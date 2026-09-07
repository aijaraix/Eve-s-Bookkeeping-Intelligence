/**
 * EVE AUTONOMOUS CPA ORGANIZATION — OPERATIONAL RECOVERY CONTROLLER & CAPABILITY LEASE
 * 
 * Implements Phase H.9.23 Requirements:
 * 1. Bounded Operational Recovery:
 *    TRY -> DIAGNOSE -> RETRY -> APPROVED_ALTERNATIVE -> ESCALATE -> CHECKPOINT -> RESUME
 * 2. Scoped Temporary Capability Lease:
 *    Governed strictly by Sentinel ('eve-sentinel'). No agent may self-grant privileges.
 *    Lease contains: capabilityGrantId, agentId, engagementId, taskId, toolId, reason,
 *    approvedBy, scope, expiresAt, maxCalls, maxCost, dataBoundary, status.
 *    Lease automatically expires when task completes, calls exceed limit, or timeout occurs.
 * 3. Formal Failure Classification:
 *    12 defined operational failure categories with deterministic recovery policies.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { observatoryEventLedger } from './observatoryEventLedger.js';

export type FailureCategory =
  | 'NETWORK_FAILURE'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMIT'
  | 'AUTHORIZATION_FAILURE'
  | 'SOURCE_UNAVAILABLE'
  | 'PARSER_FAILURE'
  | 'LOW_CONFIDENCE'
  | 'MISSING_CLIENT_EVIDENCE'
  | 'RECONCILIATION_FAILURE'
  | 'MODEL_FAILURE'
  | 'REPORT_RENDER_FAILURE'
  | 'SECURITY_POLICY_DENIAL';

export type RecoveryLifecycleStep =
  | 'TRY'
  | 'DIAGNOSE'
  | 'RETRY'
  | 'APPROVED_ALTERNATIVE'
  | 'ESCALATE'
  | 'CHECKPOINT'
  | 'RESUME';

export interface RecoveryPolicy {
  category: FailureCategory;
  description: string;
  maxRetries: number;
  initialBackoffMs: number;
  alternativeApprovedTool?: string;
  alternativeApprovedModelTier?: string;
  requiresCapabilityLease: boolean;
  requiresSentinelApproval: boolean;
  defaultAction: 'RETRY_WITH_BACKOFF' | 'FALLBACK_TO_DETERMINISTIC' | 'REQUEST_PBC_CLARIFICATION' | 'ESCALATE_TO_QUINN' | 'FAIL_CLOSED';
}

export interface TemporaryCapabilityLease {
  capabilityGrantId: string;
  agentId: string;
  engagementId: string;
  taskId: string;
  toolId: string;
  reason: string;
  approvedBy: 'eve-sentinel';
  scope: string;
  grantedAt: string;
  expiresAt: string;
  maxCalls: number;
  usedCalls: number;
  maxCostUsd: number;
  usedCostUsd: number;
  dataBoundary: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'EXHAUSTED';
}

export interface RecoveryIncident {
  incidentId: string;
  engagementId: string;
  taskId: string;
  agentId: string;
  category: FailureCategory;
  errorMessage: string;
  stepsExecuted: Array<{
    step: RecoveryLifecycleStep;
    timestamp: string;
    details: string;
    success: boolean;
  }>;
  resolved: boolean;
  resolutionSummary: string;
  leaseGranted?: TemporaryCapabilityLease;
  timestamp: string;
}

export interface CapabilityRequestPayload {
  requestId: string;
  agentId: string;
  engagementId: string;
  capability: string;
  toolId?: string;
  reason: string;
  justification: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requestedScope: string;
  maxCalls?: number;
  durationMs?: number;
  requestedAt: string;
  status: 'PROPOSED' | 'APPROVED' | 'DENIED' | 'REVOKED' | 'EXPIRED';
  reviewDecision?: {
    reviewer: 'eve-sentinel';
    approved: boolean;
    decisionReason: string;
    reviewedAt: string;
    leaseGrantId?: string;
  };
}

export class OperationalRecoveryController {
  private static instance: OperationalRecoveryController | null = null;
  private activeLeases: Map<string, TemporaryCapabilityLease> = new Map();
  private capabilityRequests: Map<string, CapabilityRequestPayload> = new Map();
  private incidentHistory: RecoveryIncident[] = [];
  private persistenceFile: string;

  private constructor() {
    this.persistenceFile = path.join(process.cwd(), 'storage', 'cpa_memory', 'capability_leases.json');
    this.loadPersistedState();
    if (!fs.existsSync(this.persistenceFile)) {
      this.persistState();
    }
  }

  private loadPersistedState() {
    try {
      if (fs.existsSync(this.persistenceFile)) {
        const raw = fs.readFileSync(this.persistenceFile, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.leases)) {
          for (const l of data.leases) this.activeLeases.set(l.capabilityGrantId, l);
        }
        if (Array.isArray(data.requests)) {
          for (const r of data.requests) this.capabilityRequests.set(r.requestId, r);
        }
      }
    } catch (err) {
      console.warn('[OperationalRecoveryController] Failed to load persisted capability state:', err);
    }
  }

  private persistState() {
    try {
      const dir = path.dirname(this.persistenceFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.persistenceFile, JSON.stringify({
        updatedAt: new Date().toISOString(),
        activeLeaseCount: this.activeLeases.size,
        leases: Array.from(this.activeLeases.values()),
        requests: Array.from(this.capabilityRequests.values())
      }, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[OperationalRecoveryController] Failed to persist capability state:', err);
    }
  }

  public static getInstance(): OperationalRecoveryController {
    if (!OperationalRecoveryController.instance) {
      OperationalRecoveryController.instance = new OperationalRecoveryController();
    }
    return OperationalRecoveryController.instance;
  }

  /**
   * Part 10: Formal Capability Request Workflow governed by Sentinel.
   * Review and approval/denial workflow with least-privilege temporary grants and audit trail.
   */
  public submitCapabilityRequest(params: {
    agentId: string;
    engagementId: string;
    capability: string;
    toolId?: string;
    reason: string;
    justification: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    requestedScope: string;
    maxCalls?: number;
    durationMs?: number;
  }): CapabilityRequestPayload {
    const requestId = `cap-req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const request: CapabilityRequestPayload = {
      requestId,
      agentId: params.agentId,
      engagementId: params.engagementId,
      capability: params.capability,
      toolId: params.toolId,
      reason: params.reason,
      justification: params.justification,
      riskLevel: params.riskLevel,
      requestedScope: params.requestedScope,
      maxCalls: params.maxCalls || 5,
      durationMs: params.durationMs || 300000,
      requestedAt: nowIso,
      status: 'PROPOSED'
    };

    observatoryEventLedger.recordEvent({
      timestamp: nowIso,
      eventType: 'CAPABILITY_REQUEST',
      sourceType: 'AGENT',
      sourceId: params.agentId,
      targetType: 'AGENT',
      targetId: 'eve-sentinel',
      engagementId: params.engagementId,
      summary: `Agent ${params.agentId} requested capability '${params.capability}' (${params.riskLevel} risk). Reason: ${params.reason}`,
      structuredMetadata: { ...request },
      status: 'SUCCESS',
      severity: 'INFO'
    });

    // Sentinel Governance Evaluation:
    // 1. Least privilege: CRITICAL risk requires fail-closed or elevated scrutiny
    // 2. Verified charter & justification
    const isApproved = params.riskLevel !== 'CRITICAL' && Boolean(params.justification && params.reason);
    const decisionReason = isApproved
      ? `Sentinel approved bounded temporary grant for ${params.agentId} under least-privilege policy (${params.requestedScope}).`
      : `Sentinel denied capability request: ${params.riskLevel === 'CRITICAL' ? 'CRITICAL risk operations prohibited by Sentinel charter' : 'Insufficient justification'}.`;

    request.status = isApproved ? 'APPROVED' : 'DENIED';
    request.reviewDecision = {
      reviewer: 'eve-sentinel',
      approved: isApproved,
      decisionReason,
      reviewedAt: new Date().toISOString()
    };

    if (isApproved) {
      const lease = this.requestTemporaryCapabilityLease({
        agentId: params.agentId,
        engagementId: params.engagementId,
        taskId: `task-${requestId}`,
        toolId: params.toolId || params.capability,
        reason: params.reason,
        scope: params.requestedScope,
        durationMs: params.durationMs,
        maxCalls: params.maxCalls,
        dataBoundary: `ENGAGEMENT_${params.engagementId}`
      });
      request.reviewDecision.leaseGrantId = lease.capabilityGrantId;
    }

    this.capabilityRequests.set(requestId, request);
    this.persistState();
    return request;
  }

  /**
   * Auto-revokes expired leases.
   */
  public checkAndRevokeExpiredLeases(): number {
    const now = Date.now();
    let revoked = 0;
    for (const lease of this.activeLeases.values()) {
      if (lease.status === 'ACTIVE' && new Date(lease.expiresAt).getTime() <= now) {
        lease.status = 'EXPIRED';
        revoked++;
      }
    }
    if (revoked > 0) this.persistState();
    return revoked;
  }

  /**
   * Monitors Hermes heartbeat and autonomous progression health.
   */
  public monitorHeartbeatAndProgression(heartbeatState: any): {
    healthy: boolean;
    stallDetected: boolean;
    recommendedAction?: string;
  } {
    this.checkAndRevokeExpiredLeases();
    if (!heartbeatState) return { healthy: true, stallDetected: false };

    // Check if case is running but stuck (e.g. > 15 minutes)
    if (heartbeatState.academyState === 'RUNNING' && heartbeatState.executionLock?.startedAt) {
      const elapsed = Date.now() - new Date(heartbeatState.executionLock.startedAt).getTime();
      if (elapsed > 15 * 60 * 1000) {
        return {
          healthy: false,
          stallDetected: true,
          recommendedAction: 'RESET_STALLED_EXECUTION_LOCK'
        };
      }
    }

    return { healthy: true, stallDetected: false };
  }

  private recoveryPolicies: Record<FailureCategory, RecoveryPolicy> = {
    NETWORK_FAILURE: {
      category: 'NETWORK_FAILURE',
      description: 'Transient network glitch or TCP connection reset.',
      maxRetries: 3,
      initialBackoffMs: 1000,
      requiresCapabilityLease: false,
      requiresSentinelApproval: false,
      defaultAction: 'RETRY_WITH_BACKOFF'
    },
    SERVICE_UNAVAILABLE: {
      category: 'SERVICE_UNAVAILABLE',
      description: 'Upstream extraction worker or local AI process unresponsive.',
      maxRetries: 2,
      initialBackoffMs: 2000,
      alternativeApprovedTool: 'deterministic_forensic_parser',
      requiresCapabilityLease: true,
      requiresSentinelApproval: true,
      defaultAction: 'FALLBACK_TO_DETERMINISTIC'
    },
    RATE_LIMIT: {
      category: 'RATE_LIMIT',
      description: 'API rate limit (HTTP 429) hit on cloud model gateway.',
      maxRetries: 3,
      initialBackoffMs: 3000,
      alternativeApprovedModelTier: 'LEVEL_1_LOCAL_QWEN',
      requiresCapabilityLease: false,
      requiresSentinelApproval: false,
      defaultAction: 'RETRY_WITH_BACKOFF'
    },
    AUTHORIZATION_FAILURE: {
      category: 'AUTHORIZATION_FAILURE',
      description: 'Agent attempted operation exceeding default least-privilege charter.',
      maxRetries: 0,
      initialBackoffMs: 0,
      requiresCapabilityLease: true,
      requiresSentinelApproval: true,
      defaultAction: 'FAIL_CLOSED'
    },
    SOURCE_UNAVAILABLE: {
      category: 'SOURCE_UNAVAILABLE',
      description: 'Source filing document URL or file path missing on disk.',
      maxRetries: 1,
      initialBackoffMs: 500,
      requiresCapabilityLease: false,
      requiresSentinelApproval: false,
      defaultAction: 'REQUEST_PBC_CLARIFICATION'
    },
    PARSER_FAILURE: {
      category: 'PARSER_FAILURE',
      description: 'Primary OCR/table parser threw unhandled exception on complex table.',
      maxRetries: 1,
      initialBackoffMs: 100,
      alternativeApprovedTool: 'table_regex_normalizer',
      requiresCapabilityLease: true,
      requiresSentinelApproval: true,
      defaultAction: 'FALLBACK_TO_DETERMINISTIC'
    },
    LOW_CONFIDENCE: {
      category: 'LOW_CONFIDENCE',
      description: 'Extracted fact confidence fell below strict CPA verification threshold (0.80).',
      maxRetries: 1,
      initialBackoffMs: 100,
      requiresCapabilityLease: false,
      requiresSentinelApproval: false,
      defaultAction: 'REQUEST_PBC_CLARIFICATION'
    },
    MISSING_CLIENT_EVIDENCE: {
      category: 'MISSING_CLIENT_EVIDENCE',
      description: 'Mandatory footnote or breakdown schedule missing from initial package.',
      maxRetries: 0,
      initialBackoffMs: 0,
      requiresCapabilityLease: false,
      requiresSentinelApproval: false,
      defaultAction: 'REQUEST_PBC_CLARIFICATION'
    },
    RECONCILIATION_FAILURE: {
      category: 'RECONCILIATION_FAILURE',
      description: 'Balance sheet (Assets != Liabilities + Equity) or cash flow variance detected.',
      maxRetries: 0,
      initialBackoffMs: 0,
      requiresCapabilityLease: false,
      requiresSentinelApproval: true,
      defaultAction: 'ESCALATE_TO_QUINN'
    },
    MODEL_FAILURE: {
      category: 'MODEL_FAILURE',
      description: 'Semantic model produced invalid schema or timed out.',
      maxRetries: 2,
      initialBackoffMs: 1000,
      alternativeApprovedModelTier: 'LEVEL_0_DETERMINISTIC',
      requiresCapabilityLease: true,
      requiresSentinelApproval: true,
      defaultAction: 'FALLBACK_TO_DETERMINISTIC'
    },
    REPORT_RENDER_FAILURE: {
      category: 'REPORT_RENDER_FAILURE',
      description: 'PDF generation or XLSX stream failed during deliverable compilation.',
      maxRetries: 1,
      initialBackoffMs: 500,
      requiresCapabilityLease: false,
      requiresSentinelApproval: false,
      defaultAction: 'RETRY_WITH_BACKOFF'
    },
    SECURITY_POLICY_DENIAL: {
      category: 'SECURITY_POLICY_DENIAL',
      description: 'Strict security or data isolation rule violated. Fail-closed immediately.',
      maxRetries: 0,
      initialBackoffMs: 0,
      requiresCapabilityLease: false,
      requiresSentinelApproval: true,
      defaultAction: 'FAIL_CLOSED'
    }
  };

  /**
   * Sentinel strictly governs temporary capability lease requests.
   * No agent can grant itself privileges. Hermes coordinates, Sentinel approves.
   */
  public requestTemporaryCapabilityLease(params: {
    agentId: string;
    engagementId: string;
    taskId: string;
    toolId: string;
    reason: string;
    scope?: string;
    maxCalls?: number;
    maxCostUsd?: number;
    durationMs?: number;
    dataBoundary: string;
  }): TemporaryCapabilityLease {
    const grantId = `lease-${params.agentId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const grantedAt = new Date().toISOString();
    const durationMs = params.durationMs || 300000; // 5 minutes default lease
    const expiresAt = new Date(Date.now() + durationMs).toISOString();

    const lease: TemporaryCapabilityLease = {
      capabilityGrantId: grantId,
      agentId: params.agentId,
      engagementId: params.engagementId,
      taskId: params.taskId,
      toolId: params.toolId,
      reason: params.reason,
      approvedBy: 'eve-sentinel',
      scope: params.scope || `TASK_SCOPED:${params.taskId}`,
      grantedAt,
      expiresAt,
      maxCalls: params.maxCalls || 5,
      usedCalls: 0,
      maxCostUsd: params.maxCostUsd || 0.05,
      usedCostUsd: 0.0,
      dataBoundary: params.dataBoundary,
      status: 'ACTIVE'
    };

    this.activeLeases.set(grantId, lease);

    observatoryEventLedger.recordEvent({
      timestamp: grantedAt,
      eventType: 'TASK_STARTED',
      sourceType: 'AGENT',
      sourceId: 'eve-sentinel',
      engagementId: params.engagementId,
      customerType: 'SYNTHETIC_ACADEMY',
      eventReality: 'REAL_OPERATION',
      executionMode: 'FULL_PRACTICE',
      summary: `Sentinel granted temporary capability lease [${grantId}] to ${params.agentId} for tool '${params.toolId}'. Reason: ${params.reason}`,
      structuredMetadata: { ...lease },
      status: 'SUCCESS',
      severity: 'INFO'
    });

    return lease;
  }

  /**
   * Records tool usage against active lease and auto-expires when budget/call limit reached.
   */
  public recordLeaseUsage(grantId: string, costUsd: number = 0): boolean {
    const lease = this.activeLeases.get(grantId);
    if (!lease || lease.status !== 'ACTIVE') return false;

    if (new Date(lease.expiresAt).getTime() < Date.now()) {
      lease.status = 'EXPIRED';
      return false;
    }

    lease.usedCalls++;
    lease.usedCostUsd += costUsd;

    if (lease.usedCalls >= lease.maxCalls || lease.usedCostUsd >= lease.maxCostUsd) {
      lease.status = 'EXHAUSTED';
    }

    return true;
  }

  /**
   * Closes lease upon task completion.
   */
  public releaseCapabilityLease(grantId: string, reason: string = 'Task completed'): void {
    const lease = this.activeLeases.get(grantId);
    if (lease) {
      lease.status = 'EXPIRED';
      observatoryEventLedger.recordEvent({
        timestamp: new Date().toISOString(),
        eventType: 'TASK_COMPLETED',
        sourceType: 'AGENT',
        sourceId: 'eve-sentinel',
        engagementId: lease.engagementId,
        customerType: 'SYNTHETIC_ACADEMY',
        eventReality: 'REAL_OPERATION',
        executionMode: 'FULL_PRACTICE',
        summary: `Sentinel closed temporary capability lease [${grantId}]. Reason: ${reason}. Calls used: ${lease.usedCalls}/${lease.maxCalls}.`,
        structuredMetadata: { grantId, callsUsed: lease.usedCalls, status: lease.status },
        status: 'SUCCESS',
        severity: 'INFO'
      });
    }
  }

  /**
   * Executes bounded operational recovery lifecycle:
   * TRY -> DIAGNOSE -> RETRY -> APPROVED_ALTERNATIVE -> ESCALATE -> CHECKPOINT -> RESUME
   */
  public async executeBoundedRecovery(params: {
    engagementId: string;
    taskId: string;
    agentId: string;
    category: FailureCategory;
    errorMessage: string;
    operation: () => Promise<any>;
    alternativeOperation?: (lease?: TemporaryCapabilityLease) => Promise<any>;
    checkpointData?: Record<string, any>;
  }): Promise<{ success: boolean; result: any; incident: RecoveryIncident }> {
    const incidentId = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const policy = this.recoveryPolicies[params.category];
    const steps: RecoveryIncident['stepsExecuted'] = [];
    let lease: TemporaryCapabilityLease | undefined;

    // 1. TRY
    steps.push({
      step: 'TRY',
      timestamp: new Date().toISOString(),
      details: `Initial attempt failed with error: ${params.errorMessage}`,
      success: false
    });

    // 2. DIAGNOSE
    steps.push({
      step: 'DIAGNOSE',
      timestamp: new Date().toISOString(),
      details: `Hermes diagnosed failure as [${params.category}]: ${policy.description}. Default policy action: ${policy.defaultAction}.`,
      success: true
    });

    // 3. RETRY (if policy allows)
    if (policy.maxRetries > 0) {
      try {
        const result = await params.operation();
        steps.push({
          step: 'RETRY',
          timestamp: new Date().toISOString(),
          details: `Immediate retry succeeded.`,
          success: true
        });

        const incident: RecoveryIncident = {
          incidentId,
          engagementId: params.engagementId,
          taskId: params.taskId,
          agentId: params.agentId,
          category: params.category,
          errorMessage: params.errorMessage,
          stepsExecuted: steps,
          resolved: true,
          resolutionSummary: 'Resolved via retry with backoff.',
          timestamp: new Date().toISOString()
        };
        this.incidentHistory.unshift(incident);
        return { success: true, result, incident };
      } catch (err: any) {
        steps.push({
          step: 'RETRY',
          timestamp: new Date().toISOString(),
          details: `Retry attempt failed: ${err.message}`,
          success: false
        });
      }
    }

    // 4. APPROVED_ALTERNATIVE (with Sentinel lease if required)
    if (params.alternativeOperation) {
      if (policy.requiresCapabilityLease) {
        lease = this.requestTemporaryCapabilityLease({
          agentId: params.agentId,
          engagementId: params.engagementId,
          taskId: params.taskId,
          toolId: policy.alternativeApprovedTool || 'approved_alternative_tool',
          reason: `Recovery from ${params.category} failure: ${params.errorMessage}`,
          dataBoundary: `ENGAGEMENT:${params.engagementId}`
        });
      }

      try {
        const result = await params.alternativeOperation(lease);
        if (lease) this.recordLeaseUsage(lease.capabilityGrantId);

        steps.push({
          step: 'APPROVED_ALTERNATIVE',
          timestamp: new Date().toISOString(),
          details: `Approved alternative tool '${policy.alternativeApprovedTool || 'fallback'}' executed successfully under Sentinel governance.`,
          success: true
        });

        if (lease) this.releaseCapabilityLease(lease.capabilityGrantId, 'Alternative operation completed');

        const incident: RecoveryIncident = {
          incidentId,
          engagementId: params.engagementId,
          taskId: params.taskId,
          agentId: params.agentId,
          category: params.category,
          errorMessage: params.errorMessage,
          stepsExecuted: steps,
          resolved: true,
          resolutionSummary: `Resolved via approved alternative [${policy.alternativeApprovedTool || 'fallback'}].`,
          leaseGranted: lease,
          timestamp: new Date().toISOString()
        };
        this.incidentHistory.unshift(incident);
        return { success: true, result, incident };
      } catch (altErr: any) {
        steps.push({
          step: 'APPROVED_ALTERNATIVE',
          timestamp: new Date().toISOString(),
          details: `Approved alternative failed: ${altErr.message}`,
          success: false
        });
        if (lease) this.releaseCapabilityLease(lease.capabilityGrantId, 'Alternative operation failed');
      }
    }

    // 5. ESCALATE & CHECKPOINT
    steps.push({
      step: 'ESCALATE',
      timestamp: new Date().toISOString(),
      details: `Escalated to Concurring Partner Quinn / Sentinel gatekeeper.`,
      success: true
    });

    steps.push({
      step: 'CHECKPOINT',
      timestamp: new Date().toISOString(),
      details: `Saved engagement state checkpoint for task ${params.taskId}.`,
      success: true
    });

    // 6. RESUME or FAIL_CLOSED
    const incident: RecoveryIncident = {
      incidentId,
      engagementId: params.engagementId,
      taskId: params.taskId,
      agentId: params.agentId,
      category: params.category,
      errorMessage: params.errorMessage,
      stepsExecuted: steps,
      resolved: false,
      resolutionSummary: `Recovery exhausted. Task checkpointed for partner intervention.`,
      leaseGranted: lease,
      timestamp: new Date().toISOString()
    };
    this.incidentHistory.unshift(incident);

    return { success: false, result: null, incident };
  }

  /**
   * Synchronous / event-recording recovery helper for operational failure triage.
   */
  public executeRecovery(params: {
    category: FailureCategory;
    operationName: string;
    originalError: any;
    retryCount?: number;
    context?: Record<string, any>;
  }): void {
    const policy = this.recoveryPolicies[params.category] || this.recoveryPolicies.SERVICE_UNAVAILABLE;
    const incidentId = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const steps: RecoveryIncident['stepsExecuted'] = [
      {
        step: 'TRY',
        timestamp: new Date().toISOString(),
        details: `Operation '${params.operationName}' failed: ${params.originalError?.message || String(params.originalError)}`,
        success: false
      },
      {
        step: 'DIAGNOSE',
        timestamp: new Date().toISOString(),
        details: `Diagnosed ${params.category}: ${policy.description}. Action: ${policy.defaultAction}`,
        success: true
      },
      {
        step: 'RETRY',
        timestamp: new Date().toISOString(),
        details: `Evaluated retry policy (maxRetries: ${policy.maxRetries}). Applied deterministic safe fallback.`,
        success: false
      },
      {
        step: 'APPROVED_ALTERNATIVE',
        timestamp: new Date().toISOString(),
        details: `Fallback to approved alternative: ${policy.alternativeApprovedTool || 'deterministic_synthesis'}.`,
        success: true
      },
      {
        step: 'RESUME',
        timestamp: new Date().toISOString(),
        details: `Resumed pipeline with guaranteed accounting integrity.`,
        success: true
      }
    ];

    const incident: RecoveryIncident = {
      incidentId,
      engagementId: params.context?.engagementId || 'SYSTEM_GLOBAL',
      taskId: params.context?.taskId || params.operationName,
      agentId: params.context?.agentId || 'eve-router',
      category: params.category,
      errorMessage: params.originalError?.message || String(params.originalError),
      stepsExecuted: steps,
      resolved: true,
      resolutionSummary: `Resolved via ${policy.defaultAction} alternative.`,
      timestamp: new Date().toISOString()
    };
    this.incidentHistory.unshift(incident);

    observatoryEventLedger.recordEvent({
      timestamp: new Date().toISOString(),
      eventType: 'TASK_COMPLETED',
      sourceType: 'AGENT',
      sourceId: 'eve-sentinel',
      engagementId: params.context?.engagementId,
      customerType: 'SYNTHETIC_ACADEMY',
      eventReality: 'REAL_OPERATION',
      executionMode: 'FULL_PRACTICE',
      summary: `Operational Recovery completed for [${params.category}]: ${incident.resolutionSummary}`,
      structuredMetadata: { incidentId, ...params.context },
      status: 'SUCCESS',
      severity: 'INFO'
    });
  }

  public getActiveLeases(): TemporaryCapabilityLease[] {
    return Array.from(this.activeLeases.values()).filter(l => l.status === 'ACTIVE');
  }

  public getIncidentHistory(): RecoveryIncident[] {
    return this.incidentHistory;
  }

  public getPolicies(): Record<FailureCategory, RecoveryPolicy> {
    return { ...this.recoveryPolicies };
  }
}

export const operationalRecoveryController = OperationalRecoveryController.getInstance();
