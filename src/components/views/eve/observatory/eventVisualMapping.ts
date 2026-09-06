/**
 * EVE NEURAL OPERATIONS OBSERVATORY — EVENT VISUAL MAPPING & TRUTH BINDING
 * 
 * Implements Phase H.9.24.1:
 * - 100% deterministic visual binding for all persisted CPA operational events
 * - Resolves canonical source/target nodes, payload types, colors, and node state transitions
 * - Enforces zero fake telemetry: only real persisted operational events generate signals
 * - Provides audit diagnostics (Mapped Events count vs Unmapped Events count)
 */

import { ObservatoryEventItem } from './ObservatoryTypes';

export type SignalPayloadType =
  | 'HEARTBEAT'
  | 'DOCUMENT'
  | 'FACT_PACKET'
  | 'MODEL_REQUEST'
  | 'MODEL_RESPONSE'
  | 'PBC_REQUEST'
  | 'PBC_RESPONSE'
  | 'REVIEW_NOTE'
  | 'REPORT_ARTIFACT'
  | 'MINERVA_RESULT'
  | 'RECOVERY_REQUEST'
  | 'GENERIC_PULSE';

export interface VisualEventBinding {
  eventType: string;
  defaultSourceId: string;
  defaultTargetId: string;
  payloadType: SignalPayloadType;
  color: string;
  sourceNodeState?: 'WORKING' | 'AVAILABLE' | 'REVIEWING' | 'WAITING';
  targetNodeState?: 'WORKING' | 'AVAILABLE' | 'REVIEWING' | 'WAITING';
  isLongRunning?: boolean;
  description: string;
}

// Canonical node alias normalizer
export function normalizeNodeId(id?: string): string {
  if (!id) return 'eve-hermes';
  const lower = id.toLowerCase().trim();
  if (lower === 'eve-extraction-worker' || lower === 'extraction_worker' || lower === 'worker') return 'inf-worker';
  if (lower === 'ext-synthetic-client' || lower === 'synthetic_client' || lower === 'client' || lower === 'synthetic-client') return 'ext-synthetic-client';
  if (lower === 'organism_cortex' || lower === 'cortex' || lower === 'hermes_cortex') return 'cortex-hermes';
  if (lower === 'scheduler' || lower === 'sat-scheduler') return 'sat-scheduler';
  if (lower === 'customer_queue' || lower === 'sat-customer-queue') return 'sat-customer-queue';
  if (lower === 'recovery' || lower === 'sat-recovery') return 'sat-recovery';
  if (lower === 'pdf_factory' || lower === 'sat-pdf-factory') return 'sat-pdf-factory';
  if (lower === 'xlsx_engine' || lower === 'sat-xlsx-engine') return 'sat-xlsx-engine';
  if (lower === 'json_audit_pkg' || lower === 'sat-json-audit-pkg') return 'sat-json-audit-pkg';
  if (lower === 'pbc_channel' || lower === 'sat-pbc-channel') return 'sat-pbc-channel';
  if (lower === 'fact_registry' || lower === 'sat-fact-registry') return 'sat-fact-registry';
  if (lower === 'cell_provenance' || lower === 'sat-cell-provenance') return 'sat-cell-provenance';
  if (lower === 'balance_sheet_gate' || lower === 'sat-balance-sheet-gate') return 'sat-balance-sheet-gate';
  if (lower.startsWith('mod-')) return lower;
  if (lower === 'tier0' || lower === 'deterministic') return 'mod-tier0-det';
  if (lower === 'tier1' || lower === 'qwen') return 'mod-tier1-qwen';
  if (lower === 'tier2' || lower === 'flash' || lower === 'gemini-flash') return 'mod-tier2-flash';
  if (lower === 'tier3' || lower === 'pro' || lower === 'gemini-pro') return 'mod-tier3-pro';

  // Named agents
  if (lower.startsWith('eve-')) return lower;
  return `eve-${lower}`;
}

// Complete authoritative audit mapping for all operational event types
export const EVENT_VISUAL_CATALOG: Record<string, VisualEventBinding> = {
  // 1. Heartbeat & Cadence
  HEARTBEAT: {
    eventType: 'HEARTBEAT',
    defaultSourceId: 'eve-hermes',
    defaultTargetId: 'sat-scheduler',
    payloadType: 'HEARTBEAT',
    color: '#6366f1',
    description: 'Hermes Heartbeat telemetry pulse'
  },
  ACADEMY_WAKE: {
    eventType: 'ACADEMY_WAKE',
    defaultSourceId: 'sat-scheduler',
    defaultTargetId: 'eve-hermes',
    payloadType: 'GENERIC_PULSE',
    color: '#818cf8',
    targetNodeState: 'WORKING',
    description: 'Academy waking from idle cooldown'
  },
  ACADEMY_CASE_SCHEDULED: {
    eventType: 'ACADEMY_CASE_SCHEDULED',
    defaultSourceId: 'sat-scheduler',
    defaultTargetId: 'eve-hermes',
    payloadType: 'GENERIC_PULSE',
    color: '#818cf8',
    sourceNodeState: 'WORKING',
    targetNodeState: 'WORKING',
    description: 'Autonomous case scheduled by Hermes'
  },
  ACADEMY_CASE_STARTED: {
    eventType: 'ACADEMY_CASE_STARTED',
    defaultSourceId: 'eve-hermes',
    defaultTargetId: 'inf-worker',
    payloadType: 'DOCUMENT',
    color: '#06b6d4',
    sourceNodeState: 'WORKING',
    targetNodeState: 'WORKING',
    isLongRunning: true,
    description: 'Academy case claimed under execution lock'
  },
  ENGAGEMENT_CREATED: {
    eventType: 'ENGAGEMENT_CREATED',
    defaultSourceId: 'eve-hermes',
    defaultTargetId: 'ext-synthetic-client',
    payloadType: 'DOCUMENT',
    color: '#06b6d4',
    sourceNodeState: 'WORKING',
    targetNodeState: 'WORKING',
    description: 'Engagement twin initialized'
  },

  // 2. Documents & Intake Pipeline
  DOCUMENT_DISCOVERED: {
    eventType: 'DOCUMENT_DISCOVERED',
    defaultSourceId: 'ext-synthetic-client',
    defaultTargetId: 'inf-worker',
    payloadType: 'DOCUMENT',
    color: '#06b6d4',
    targetNodeState: 'WORKING',
    description: 'Source financial filing discovered'
  },
  DOCUMENT_DOWNLOADED: {
    eventType: 'DOCUMENT_DOWNLOADED',
    defaultSourceId: 'ext-synthetic-client',
    defaultTargetId: 'inf-worker',
    payloadType: 'DOCUMENT',
    color: '#06b6d4',
    targetNodeState: 'WORKING',
    description: 'Source financial document acquired'
  },
  DOCUMENT_UPLOADED: {
    eventType: 'DOCUMENT_UPLOADED',
    defaultSourceId: 'ext-synthetic-client',
    defaultTargetId: 'inf-worker',
    payloadType: 'DOCUMENT',
    color: '#06b6d4',
    description: 'Supplemental schedule uploaded'
  },
  DOCUMENT_VERSIONED: {
    eventType: 'DOCUMENT_VERSIONED',
    defaultSourceId: 'inf-worker',
    defaultTargetId: 'sat-fact-registry',
    payloadType: 'DOCUMENT',
    color: '#0284c7',
    description: 'Cryptographic SHA-256 versioning'
  },
  EXTRACTION_STARTED: {
    eventType: 'EXTRACTION_STARTED',
    defaultSourceId: 'inf-worker',
    defaultTargetId: 'eve-ledger',
    payloadType: 'FACT_PACKET',
    color: '#10b981',
    sourceNodeState: 'WORKING',
    targetNodeState: 'WORKING',
    isLongRunning: true,
    description: 'Production worker parsing financial schedules'
  },
  EXTRACTION_COMPLETED: {
    eventType: 'EXTRACTION_COMPLETED',
    defaultSourceId: 'inf-worker',
    defaultTargetId: 'eve-ledger',
    payloadType: 'FACT_PACKET',
    color: '#10b981',
    sourceNodeState: 'AVAILABLE',
    targetNodeState: 'WORKING',
    description: 'Deterministic line items extracted'
  },

  // 3. Agent Coordination & Tasks
  AGENT_ACTIVATED: {
    eventType: 'AGENT_ACTIVATED',
    defaultSourceId: 'eve-hermes',
    defaultTargetId: 'eve-ledger',
    payloadType: 'GENERIC_PULSE',
    color: '#38bdf8',
    targetNodeState: 'WORKING',
    description: 'Autonomous CPA agent activated'
  },
  AGENT_IDLE: {
    eventType: 'AGENT_IDLE',
    defaultSourceId: 'eve-hermes',
    defaultTargetId: 'eve-hermes',
    payloadType: 'GENERIC_PULSE',
    color: '#64748b',
    targetNodeState: 'AVAILABLE',
    description: 'Agent standing by'
  },
  AGENT_COMPLETED: {
    eventType: 'AGENT_COMPLETED',
    defaultSourceId: 'eve-ledger',
    defaultTargetId: 'eve-hermes',
    payloadType: 'FACT_PACKET',
    color: '#10b981',
    sourceNodeState: 'AVAILABLE',
    description: 'Agent sub-task completed'
  },
  AGENT_HANDOFF: {
    eventType: 'AGENT_HANDOFF',
    defaultSourceId: 'eve-ledger',
    defaultTargetId: 'eve-veritas',
    payloadType: 'FACT_PACKET',
    color: '#0ea5e9',
    sourceNodeState: 'AVAILABLE',
    targetNodeState: 'WORKING',
    description: 'Agent-to-agent dossier handoff'
  },
  TASK_CREATED: {
    eventType: 'TASK_CREATED',
    defaultSourceId: 'eve-hermes',
    defaultTargetId: 'eve-ledger',
    payloadType: 'GENERIC_PULSE',
    color: '#38bdf8',
    targetNodeState: 'WORKING',
    description: 'Work order dispatched'
  },
  TASK_STARTED: {
    eventType: 'TASK_STARTED',
    defaultSourceId: 'eve-hermes',
    defaultTargetId: 'eve-ledger',
    payloadType: 'FACT_PACKET',
    color: '#10b981',
    targetNodeState: 'WORKING',
    isLongRunning: true,
    description: 'Audit task execution in progress'
  },
  TASK_COMPLETED: {
    eventType: 'TASK_COMPLETED',
    defaultSourceId: 'eve-athena',
    defaultTargetId: 'eve-quinn',
    payloadType: 'FACT_PACKET',
    color: '#10b981',
    sourceNodeState: 'AVAILABLE',
    targetNodeState: 'REVIEWING',
    description: 'Technical task output committed'
  },

  // 4. Model Routing & LLM Inference
  MODEL_ROUTED: {
    eventType: 'MODEL_ROUTED',
    defaultSourceId: 'eve-ledger',
    defaultTargetId: 'mod-tier1-qwen',
    payloadType: 'MODEL_REQUEST',
    color: '#6366f1',
    sourceNodeState: 'WAITING',
    targetNodeState: 'WORKING',
    isLongRunning: true,
    description: 'Inference dispatched to optimal model tier'
  },
  MODEL_COMPLETED: {
    eventType: 'MODEL_COMPLETED',
    defaultSourceId: 'mod-tier1-qwen',
    defaultTargetId: 'eve-ledger',
    payloadType: 'MODEL_RESPONSE',
    color: '#8b5cf6',
    sourceNodeState: 'AVAILABLE',
    targetNodeState: 'WORKING',
    description: 'Deterministic model response returned'
  },
  MODEL_ESCALATED: {
    eventType: 'MODEL_ESCALATED',
    defaultSourceId: 'mod-tier1-qwen',
    defaultTargetId: 'mod-tier2-flash',
    payloadType: 'MODEL_REQUEST',
    color: '#ec4899',
    description: 'Complexity escalation to higher model tier'
  },

  // 5. Fact Extraction & Provenance
  FACT_CREATED: {
    eventType: 'FACT_CREATED',
    defaultSourceId: 'inf-worker',
    defaultTargetId: 'sat-fact-registry',
    payloadType: 'FACT_PACKET',
    color: '#10b981',
    description: 'Canonical fact committed to registry'
  },
  FACT_VERIFIED: {
    eventType: 'FACT_VERIFIED',
    defaultSourceId: 'eve-veritas',
    defaultTargetId: 'eve-euclid',
    payloadType: 'FACT_PACKET',
    color: '#0ea5e9',
    sourceNodeState: 'AVAILABLE',
    targetNodeState: 'WORKING',
    description: 'Cryptographic SHA-256 provenance anchored'
  },
  FACT_REJECTED: {
    eventType: 'FACT_REJECTED',
    defaultSourceId: 'eve-veritas',
    defaultTargetId: 'eve-clara',
    payloadType: 'FACT_PACKET',
    color: '#ef4444',
    targetNodeState: 'WORKING',
    description: 'Fact failed optical provenance anchor'
  },
  EVIDENCE_LINKED: {
    eventType: 'EVIDENCE_LINKED',
    defaultSourceId: 'eve-veritas',
    defaultTargetId: 'sat-cell-provenance',
    payloadType: 'FACT_PACKET',
    color: '#06b6d4',
    description: 'Cell-level coordinate linkage verified'
  },

  // 6. Mathematical Reconciliation
  RECONCILIATION_STARTED: {
    eventType: 'RECONCILIATION_STARTED',
    defaultSourceId: 'eve-veritas',
    defaultTargetId: 'eve-euclid',
    payloadType: 'FACT_PACKET',
    color: '#14b8a6',
    targetNodeState: 'WORKING',
    isLongRunning: true,
    description: 'Double-entry balance sheet verification started'
  },
  RECONCILIATION_PASSED: {
    eventType: 'RECONCILIATION_PASSED',
    defaultSourceId: 'eve-euclid',
    defaultTargetId: 'sat-balance-sheet-gate',
    payloadType: 'FACT_PACKET',
    color: '#10b981',
    sourceNodeState: 'AVAILABLE',
    description: 'Balance Sheet Identity confirmed: Assets == Liabilities + Equity'
  },
  RECONCILIATION_FAILED: {
    eventType: 'RECONCILIATION_FAILED',
    defaultSourceId: 'eve-euclid',
    defaultTargetId: 'eve-clara',
    payloadType: 'FACT_PACKET',
    color: '#ef4444',
    targetNodeState: 'WORKING',
    description: 'Mathematical variance detected'
  },

  // 7. Client Clarification (PBC Workflow)
  PBC_REQUEST_CREATED: {
    eventType: 'PBC_REQUEST_CREATED',
    defaultSourceId: 'eve-clara',
    defaultTargetId: 'sat-pbc-channel',
    payloadType: 'PBC_REQUEST',
    color: '#f43f5e',
    sourceNodeState: 'WAITING',
    targetNodeState: 'WORKING',
    isLongRunning: true,
    description: 'Formal PBC request generated'
  },
  PBC_REQUEST_SENT: {
    eventType: 'PBC_REQUEST_SENT',
    defaultSourceId: 'sat-pbc-channel',
    defaultTargetId: 'ext-synthetic-client',
    payloadType: 'PBC_REQUEST',
    color: '#f43f5e',
    sourceNodeState: 'AVAILABLE',
    targetNodeState: 'WORKING',
    description: 'PBC transmitted to client persona'
  },
  PBC_RESPONSE_RECEIVED: {
    eventType: 'PBC_RESPONSE_RECEIVED',
    defaultSourceId: 'ext-synthetic-client',
    defaultTargetId: 'eve-clara',
    payloadType: 'PBC_RESPONSE',
    color: '#f59e0b',
    targetNodeState: 'WORKING',
    description: 'Client uploaded physical supporting schedule'
  },
  PBC_FOLLOWUP: {
    eventType: 'PBC_FOLLOWUP',
    defaultSourceId: 'eve-clara',
    defaultTargetId: 'ext-synthetic-client',
    payloadType: 'PBC_REQUEST',
    color: '#f43f5e',
    sourceNodeState: 'WAITING',
    description: 'Clarification follow-up requested'
  },
  PBC_CLEARED: {
    eventType: 'PBC_CLEARED',
    defaultSourceId: 'eve-clara',
    defaultTargetId: 'eve-veritas',
    payloadType: 'FACT_PACKET',
    color: '#10b981',
    sourceNodeState: 'AVAILABLE',
    targetNodeState: 'WORKING',
    description: 'Client evidence reconciled and approved'
  },

  // 8. Partner & Concurring Review
  REVIEW_STARTED: {
    eventType: 'REVIEW_STARTED',
    defaultSourceId: 'eve-sentinel',
    defaultTargetId: 'eve-quinn',
    payloadType: 'REVIEW_NOTE',
    color: '#f59e0b',
    targetNodeState: 'REVIEWING',
    isLongRunning: true,
    description: 'Concurring partner quality review started'
  },
  REVIEW_NOTE_CREATED: {
    eventType: 'REVIEW_NOTE_CREATED',
    defaultSourceId: 'eve-quinn',
    defaultTargetId: 'eve-athena',
    payloadType: 'REVIEW_NOTE',
    color: '#d946ef',
    sourceNodeState: 'REVIEWING',
    targetNodeState: 'WORKING',
    isLongRunning: true,
    description: 'Formal audit review note issued'
  },
  REVIEW_NOTE_RESPONDED: {
    eventType: 'REVIEW_NOTE_RESPONDED',
    defaultSourceId: 'eve-athena',
    defaultTargetId: 'eve-quinn',
    payloadType: 'REVIEW_NOTE',
    color: '#a855f7',
    sourceNodeState: 'AVAILABLE',
    targetNodeState: 'REVIEWING',
    description: 'Audit team technical response submitted'
  },
  REVIEW_NOTE_CLEARED: {
    eventType: 'REVIEW_NOTE_CLEARED',
    defaultSourceId: 'eve-quinn',
    defaultTargetId: 'eve-scribe',
    payloadType: 'REVIEW_NOTE',
    color: '#10b981',
    sourceNodeState: 'AVAILABLE',
    targetNodeState: 'WORKING',
    description: 'Review note resolved and sign-off granted'
  },
  SENTINEL_GATE: {
    eventType: 'SENTINEL_GATE',
    defaultSourceId: 'eve-sentinel',
    defaultTargetId: 'sat-gaas-gate',
    payloadType: 'GENERIC_PULSE',
    color: '#f59e0b',
    description: 'Quality assurance checklist validated'
  },

  // 9. Deliverables & Report Factory
  REPORT_GENERATION_STARTED: {
    eventType: 'REPORT_GENERATION_STARTED',
    defaultSourceId: 'eve-quinn',
    defaultTargetId: 'eve-scribe',
    payloadType: 'REPORT_ARTIFACT',
    color: '#22c55e',
    targetNodeState: 'WORKING',
    isLongRunning: true,
    description: 'Report Factory deliverable compilation started'
  },
  REPORT_GENERATED: {
    eventType: 'REPORT_GENERATED',
    defaultSourceId: 'eve-scribe',
    defaultTargetId: 'sat-pdf-factory',
    payloadType: 'REPORT_ARTIFACT',
    color: '#22c55e',
    sourceNodeState: 'AVAILABLE',
    description: 'Certified deliverables compiled (PDF, XLSX, JSON)'
  },
  REPORT_DOWNLOADED: {
    eventType: 'REPORT_DOWNLOADED',
    defaultSourceId: 'sat-pdf-factory',
    defaultTargetId: 'eve-minerva',
    payloadType: 'REPORT_ARTIFACT',
    color: '#22c55e',
    description: 'Lead schedule verified on disk'
  },
  ARTIFACT_VERIFIED: {
    eventType: 'ARTIFACT_VERIFIED',
    defaultSourceId: 'sat-json-audit-pkg',
    defaultTargetId: 'eve-minerva',
    payloadType: 'REPORT_ARTIFACT',
    color: '#22c55e',
    targetNodeState: 'WORKING',
    description: 'Physical SHA-256 package unsealed'
  },

  // 10. Minerva 3-Layer Truth Evaluation
  MINERVA_EVALUATION_STARTED: {
    eventType: 'MINERVA_EVALUATION_STARTED',
    defaultSourceId: 'sat-json-audit-pkg',
    defaultTargetId: 'eve-minerva',
    payloadType: 'MINERVA_RESULT',
    color: '#ec4899',
    targetNodeState: 'WORKING',
    isLongRunning: true,
    description: 'Minerva grading against sealed ground truth'
  },
  MINERVA_EVALUATION_COMPLETED: {
    eventType: 'MINERVA_EVALUATION_COMPLETED',
    defaultSourceId: 'eve-minerva',
    defaultTargetId: 'eve-hermes',
    payloadType: 'MINERVA_RESULT',
    color: '#ec4899',
    sourceNodeState: 'AVAILABLE',
    targetNodeState: 'WORKING',
    description: 'Minerva 3-layer truth certification committed'
  },

  // 11. Darwin Continuous Evolution
  EVOLUTION_INCIDENT: {
    eventType: 'EVOLUTION_INCIDENT',
    defaultSourceId: 'eve-minerva',
    defaultTargetId: 'eve-darwin',
    payloadType: 'MINERVA_RESULT',
    color: '#f43f5e',
    targetNodeState: 'WORKING',
    description: 'Defect quarantined for Darwin root cause analysis'
  },
  CAPABILITY_REQUEST: {
    eventType: 'CAPABILITY_REQUEST',
    defaultSourceId: 'eve-minerva',
    defaultTargetId: 'eve-darwin',
    payloadType: 'GENERIC_PULSE',
    color: '#ec4899',
    targetNodeState: 'WORKING',
    description: 'Agent charter expansion requested'
  },
  DARWIN_PROPOSAL: {
    eventType: 'DARWIN_PROPOSAL',
    defaultSourceId: 'eve-darwin',
    defaultTargetId: 'sat-darwin-sandbox',
    payloadType: 'GENERIC_PULSE',
    color: '#f472b6',
    description: 'Evolution proposal compiled for sandbox testing'
  },

  // 12. Case Lifecycle Completion
  ACADEMY_CASE_COMPLETED: {
    eventType: 'ACADEMY_CASE_COMPLETED',
    defaultSourceId: 'eve-hermes',
    defaultTargetId: 'mem-engagement-twin',
    payloadType: 'FACT_PACKET',
    color: '#10b981',
    sourceNodeState: 'AVAILABLE',
    description: 'Engagement twin finalized and archived'
  },

  // 13. Recovery & Operational Resilience
  RECOVERY_REQUEST: {
    eventType: 'RECOVERY_REQUEST',
    defaultSourceId: 'eve-hermes',
    defaultTargetId: 'sat-recovery',
    payloadType: 'RECOVERY_REQUEST',
    color: '#ef4444',
    targetNodeState: 'WORKING',
    description: 'Operational recovery circuit triggered'
  },
  TOOL_FAILURE: {
    eventType: 'TOOL_FAILURE',
    defaultSourceId: 'eve-ledger',
    defaultTargetId: 'sat-recovery',
    payloadType: 'RECOVERY_REQUEST',
    color: '#ef4444',
    description: 'Tool execution fault trapped'
  },
  RECOVERED: {
    eventType: 'RECOVERED',
    defaultSourceId: 'sat-recovery',
    defaultTargetId: 'eve-hermes',
    payloadType: 'GENERIC_PULSE',
    color: '#10b981',
    targetNodeState: 'AVAILABLE',
    description: 'Circuit breaker reset to healthy state'
  },

  // 14. Customer Priority Preemption
  CUSTOMER_JOB_RECEIVED: {
    eventType: 'CUSTOMER_JOB_RECEIVED',
    defaultSourceId: 'sat-customer-queue',
    defaultTargetId: 'eve-hermes',
    payloadType: 'GENERIC_PULSE',
    color: '#f59e0b',
    targetNodeState: 'WORKING',
    description: 'High-priority customer job entered queue'
  },
  CUSTOMER_PREEMPTION: {
    eventType: 'CUSTOMER_PREEMPTION',
    defaultSourceId: 'sat-customer-queue',
    defaultTargetId: 'eve-hermes',
    payloadType: 'GENERIC_PULSE',
    color: '#f59e0b',
    targetNodeState: 'WORKING',
    description: 'Hermes preempted Academy background case'
  },
  ACADEMY_RESUMED: {
    eventType: 'ACADEMY_RESUMED',
    defaultSourceId: 'eve-hermes',
    defaultTargetId: 'cortex-hermes',
    payloadType: 'GENERIC_PULSE',
    color: '#34d399',
    description: 'Academy checkpoint restored after customer queue clear'
  }
};

/**
 * Resolves full visual presentation data for any persisted operational event
 */
export function resolveVisualEvent(evt: ObservatoryEventItem): {
  sourceId: string;
  targetId: string;
  payloadType: SignalPayloadType;
  color: string;
  isMapped: boolean;
  binding: VisualEventBinding;
} {
  const binding = EVENT_VISUAL_CATALOG[evt.eventType];

  if (!binding) {
    // Unmapped fallback (preserves honest diagnostics)
    const fallbackSource = normalizeNodeId(evt.sourceId);
    const fallbackTarget = evt.targetId ? normalizeNodeId(evt.targetId) : 'eve-hermes';
    return {
      sourceId: fallbackSource,
      targetId: fallbackTarget,
      payloadType: 'GENERIC_PULSE',
      color: '#94a3b8',
      isMapped: false,
      binding: {
        eventType: evt.eventType,
        defaultSourceId: fallbackSource,
        defaultTargetId: fallbackTarget,
        payloadType: 'GENERIC_PULSE',
        color: '#94a3b8',
        description: evt.summary
      }
    };
  }

  // Use explicit event source and target if provided, otherwise canonical audit fallbacks
  const sourceId = evt.sourceId ? normalizeNodeId(evt.sourceId) : binding.defaultSourceId;
  const targetId = evt.targetId ? normalizeNodeId(evt.targetId) : binding.defaultTargetId;

  return {
    sourceId,
    targetId,
    payloadType: binding.payloadType,
    color: binding.color,
    isMapped: true,
    binding
  };
}

/**
 * Computes live audit diagnostic counts across all loaded events
 */
export function auditEventCoverage(events: ObservatoryEventItem[]): {
  total: number;
  mappedCount: number;
  unmappedCount: number;
  unmappedEvents: string[];
  mappingPercentage: number;
} {
  let mapped = 0;
  let unmapped = 0;
  const unmappedTypes = new Set<string>();

  for (const evt of events) {
    if (EVENT_VISUAL_CATALOG[evt.eventType]) {
      mapped++;
    } else {
      unmapped++;
      unmappedTypes.add(evt.eventType);
    }
  }

  const total = events.length;
  const percentage = total === 0 ? 100 : Math.round((mapped / total) * 100);

  return {
    total,
    mappedCount: mapped,
    unmappedCount: unmapped,
    unmappedEvents: Array.from(unmappedTypes),
    mappingPercentage: percentage
  };
}
