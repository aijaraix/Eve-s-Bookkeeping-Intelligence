/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — SWARM DAG ENGINE (PACKAGE B2 / DOC 35)
 * 
 * Orchestrates dynamic dependency directed acyclic graph (DAG) execution:
 * - Explicit dependency nodes and edges with prerequisite enforcement.
 * - Concurrency: Independent nodes execute concurrently where safe.
 * - Dependent nodes wait for acknowledged prerequisite completion.
 * - Handoff conservation: Handoff manifests validated at every edge.
 * - Robust retry policy with persistent attempt tracking.
 * - Fail-closed: Downstream dependents block on prerequisite failure or missing handoff.
 */

import { handoffConservationEngine, HandoffRecord } from './handoffConservationEngine.js';
import { disagreementLedger } from './disagreementLedger.js';
import { AgentJobExecution, RoleExecutionClass } from './hermesJobDispatchService.js';

export type DagNodeStatus =
  | 'PENDING'
  | 'READY'
  | 'RUNNING'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'FAILED'
  | 'SKIPPED';

export interface DagNodeDefinition {
  nodeId: string;
  agentId: 'HERMES' | 'LEDGER' | 'EUCLID' | 'VERITAS' | 'ATHENA' | 'CLARA' | 'QUINN' | 'SENTINEL' | 'LEXICON';
  roleExecutionClass: RoleExecutionClass;
  taskObjective: string;
  jobType: string;
  prerequisites: string[]; // agentIds or nodeIds that must complete first
  inputObjectReferences: string[];
  status: DagNodeStatus;
  attempt: number;
  maxAttempts: number;
  executionRecord?: AgentJobExecution;
  incomingHandoffIds: string[];
  outgoingHandoffIds: string[];
  blockedReason?: string;
  failureReason?: string;
}

export interface DagExecutionPlan {
  engagementId: string;
  dagId: string;
  nodes: Map<string, DagNodeDefinition>;
  executionStages: string[][]; // Node IDs grouped into parallel stages
  startedAt: string;
  completedAt?: string;
  allSucceeded: boolean;
}

export type NodeExecutor = (node: DagNodeDefinition, incomingHandoffs: HandoffRecord[]) => Promise<AgentJobExecution>;

export class SwarmDagEngine {
  private static instance: SwarmDagEngine;

  private constructor() {}

  public static getInstance(): SwarmDagEngine {
    if (!SwarmDagEngine.instance) {
      SwarmDagEngine.instance = new SwarmDagEngine();
    }
    return SwarmDagEngine.instance;
  }

  /**
   * Builds the canonical 9-specialist DAG definition for a CPA statutory engagement.
   */
  public buildStandardCpaDag(engagementId: string, initialReferences: string[]): DagExecutionPlan {
    const dagId = `dag-${engagementId}-${Date.now()}`;
    const nodes = new Map<string, DagNodeDefinition>();

    // 1. HERMES: Master Orchestrator (No prerequisites)
    nodes.set('HERMES', {
      nodeId: 'HERMES',
      agentId: 'HERMES',
      roleExecutionClass: 'REAL_AI_AGENT',
      taskObjective: 'Engagement scope, materiality threshold & specialist dispatch',
      jobType: 'ENGAGEMENT_ORCHESTRATION',
      prerequisites: [],
      inputObjectReferences: [...initialReferences],
      status: 'READY',
      attempt: 1,
      maxAttempts: 3,
      incomingHandoffIds: [],
      outgoingHandoffIds: []
    });

    // 2. LEDGER: Balance Sheet Structure & Mapping (Prereq: HERMES)
    nodes.set('LEDGER', {
      nodeId: 'LEDGER',
      agentId: 'LEDGER',
      roleExecutionClass: 'DETERMINISTIC_SPECIALIST_ENGINE',
      taskObjective: 'Construct balance sheet account tree and trial balance equality',
      jobType: 'ACCOUNT_CHART_RECONCILIATION',
      prerequisites: ['HERMES'],
      inputObjectReferences: [],
      status: 'PENDING',
      attempt: 1,
      maxAttempts: 3,
      incomingHandoffIds: [],
      outgoingHandoffIds: []
    });

    // 3. VERITAS: Cryptographic Byte Integrity (Prereq: HERMES)
    nodes.set('VERITAS', {
      nodeId: 'VERITAS',
      agentId: 'VERITAS',
      roleExecutionClass: 'DETERMINISTIC_SPECIALIST_ENGINE',
      taskObjective: 'Independently authenticate physical source byte integrity and citations',
      jobType: 'SOURCE_EVIDENCE_AUTHENTICATION',
      prerequisites: ['HERMES'],
      inputObjectReferences: [],
      status: 'PENDING',
      attempt: 1,
      maxAttempts: 3,
      incomingHandoffIds: [],
      outgoingHandoffIds: []
    });

    // 4. CLARA: Client Coordination & PBC Requests (Prereq: HERMES)
    nodes.set('CLARA', {
      nodeId: 'CLARA',
      agentId: 'CLARA',
      roleExecutionClass: 'REAL_AI_AGENT',
      taskObjective: 'Track client PBC schedules or record autonomous public filing evidence',
      jobType: 'PBC_EVIDENCE_REQUISITION',
      prerequisites: ['HERMES'],
      inputObjectReferences: [],
      status: 'PENDING',
      attempt: 1,
      maxAttempts: 3,
      incomingHandoffIds: [],
      outgoingHandoffIds: []
    });

    // 5. EUCLID: Mathematical Invariant Tie-Out (Prereq: LEDGER)
    nodes.set('EUCLID', {
      nodeId: 'EUCLID',
      agentId: 'EUCLID',
      roleExecutionClass: 'DETERMINISTIC_SPECIALIST_ENGINE',
      taskObjective: 'Verify strict mathematical invariant Assets = Liabilities + Stockholders Equity',
      jobType: 'ACCOUNTING_EQUATION_PROOF',
      prerequisites: ['LEDGER'],
      inputObjectReferences: [],
      status: 'PENDING',
      attempt: 1,
      maxAttempts: 3,
      incomingHandoffIds: [],
      outgoingHandoffIds: []
    });

    // 6. LEXICON: Taxonomy & Footnote Semantic Alignment (Prereq: LEDGER)
    nodes.set('LEXICON', {
      nodeId: 'LEXICON',
      agentId: 'LEXICON',
      roleExecutionClass: 'REAL_AI_AGENT',
      taskObjective: 'Map physical XBRL tags to US-GAAP taxonomy and anchor footnote dimensions',
      jobType: 'TAXONOMY_ALIGNMENT_VERIFICATION',
      prerequisites: ['LEDGER'],
      inputObjectReferences: [],
      status: 'PENDING',
      attempt: 1,
      maxAttempts: 3,
      incomingHandoffIds: [],
      outgoingHandoffIds: []
    });

    // 7. SENTINEL: Compliance & Operational Risk (Prereq: VERITAS)
    nodes.set('SENTINEL', {
      nodeId: 'SENTINEL',
      agentId: 'SENTINEL',
      roleExecutionClass: 'DETERMINISTIC_SPECIALIST_ENGINE',
      taskObjective: 'Audit professional independence, CIK registrant identity, and regulatory prohibitions',
      jobType: 'OPERATIONAL_RISK_AUDIT',
      prerequisites: ['VERITAS'],
      inputObjectReferences: [],
      status: 'PENDING',
      attempt: 1,
      maxAttempts: 3,
      incomingHandoffIds: [],
      outgoingHandoffIds: []
    });

    // 8. ATHENA: Technical Standards & Disclosures (Prereq: LEDGER, EUCLID, VERITAS)
    nodes.set('ATHENA', {
      nodeId: 'ATHENA',
      agentId: 'ATHENA',
      roleExecutionClass: 'REAL_AI_AGENT',
      taskObjective: 'Evaluate substantive GAAP presentation and footnote disclosures based on extracted filing facts',
      jobType: 'TECHNICAL_ACCOUNTING_STANDARDS_REVIEW',
      prerequisites: ['LEDGER', 'EUCLID', 'VERITAS'],
      inputObjectReferences: [],
      status: 'PENDING',
      attempt: 1,
      maxAttempts: 3,
      incomingHandoffIds: [],
      outgoingHandoffIds: []
    });

    // 9. QUINN: Quality Assurance & Concurring Partner (Prereq: ALL upstream specialists)
    nodes.set('QUINN', {
      nodeId: 'QUINN',
      agentId: 'QUINN',
      roleExecutionClass: 'REAL_AI_AGENT',
      taskObjective: 'Perform independent concurring partner preliminary quality review across workpapers',
      jobType: 'CONCURRING_PARTNER_QUALITY_REVIEW',
      prerequisites: ['HERMES', 'LEDGER', 'EUCLID', 'VERITAS', 'ATHENA', 'CLARA', 'SENTINEL', 'LEXICON'],
      inputObjectReferences: [],
      status: 'PENDING',
      attempt: 1,
      maxAttempts: 3,
      incomingHandoffIds: [],
      outgoingHandoffIds: []
    });

    // Define multi-stage execution plan allowing safe concurrency
    const executionStages: string[][] = [
      ['HERMES'],
      ['LEDGER', 'VERITAS', 'CLARA'],
      ['EUCLID', 'LEXICON', 'SENTINEL'],
      ['ATHENA'],
      ['QUINN']
    ];

    return {
      engagementId,
      dagId,
      nodes,
      executionStages,
      startedAt: new Date().toISOString(),
      allSucceeded: false
    };
  }

  /**
   * Executes the DAG with support for concurrent independent nodes, handoff conservation,
   * and retry on failure.
   */
  public async executeDag(
    plan: DagExecutionPlan,
    executor: NodeExecutor
  ): Promise<{ plan: DagExecutionPlan; completedJobs: AgentJobExecution[] }> {
    const completedJobs: AgentJobExecution[] = [];

    for (const stage of plan.executionStages) {
      // Execute all nodes in the current stage concurrently (parallel execution)
      const stagePromises = stage.map(async (nodeId) => {
        const node = plan.nodes.get(nodeId);
        if (!node) return null;

        // Verify prerequisites
        for (const prereqId of node.prerequisites) {
          const prereqNode = plan.nodes.get(prereqId);
          if (!prereqNode || prereqNode.status !== 'COMPLETED') {
            node.status = 'BLOCKED';
            node.blockedReason = `Prerequisite ${prereqId} is not COMPLETED (status=${prereqNode?.status})`;
            return null;
          }
        }

        // Gather and verify incoming handoffs
        const incomingHandoffs: HandoffRecord[] = [];
        if (node.prerequisites.length > 0) {
          for (const prereqId of node.prerequisites) {
            const prereqNode = plan.nodes.get(prereqId);
            if (!prereqNode || !prereqNode.executionRecord) continue;

            // Find matching handoff
            const handoffs = handoffConservationEngine.getHandoffsForEngagement(plan.engagementId);
            const handoff = handoffs.find(
              h => h.producerAgentId === prereqNode.agentId && h.consumerAgentId === node.agentId
            );

            if (!handoff) {
              node.status = 'BLOCKED';
              node.blockedReason = `Missing required handoff from prerequisite ${prereqNode.agentId} to ${node.agentId}`;
              return null;
            }

            if (handoff.status === 'CONSERVATION_VIOLATION' || handoff.unaccountedReferences > 0) {
              node.status = 'BLOCKED';
              node.blockedReason = `Handoff conservation violation from ${prereqNode.agentId}: unaccounted=${handoff.unaccountedReferences}`;
              return null;
            }

            incomingHandoffs.push(handoff);
          }
        }

        // Execute node with retry policy
        node.status = 'RUNNING';
        let jobRecord: AgentJobExecution | null = null;
        let lastError: any = null;

        while (node.attempt <= node.maxAttempts) {
          try {
            jobRecord = await executor(node, incomingHandoffs);
            if (jobRecord.status === 'JOB_COMPLETED_SUCCESS' || jobRecord.status === 'JOB_NEEDS_REVIEW') {
              node.status = 'COMPLETED';
              node.executionRecord = jobRecord;
              completedJobs.push(jobRecord);
              break;
            } else {
              throw new Error(`Job returned status ${jobRecord.status}`);
            }
          } catch (err: any) {
            lastError = err;
            node.attempt++;
            if (node.attempt > node.maxAttempts) {
              node.status = 'FAILED';
              node.failureReason = lastError?.message || 'Exceeded maximum retry attempts';
              break;
            }
          }
        }

        return jobRecord;
      });

      // Await all concurrent nodes in this stage
      await Promise.all(stagePromises);

      // If any node in the stage failed or was blocked, downstream nodes will be blocked
      const failedInStage = stage.some(id => {
        const s = plan.nodes.get(id)?.status;
        return s === 'FAILED' || s === 'BLOCKED';
      });

      if (failedInStage) {
        // Mark subsequent nodes as blocked
        for (const [_, n] of plan.nodes.entries()) {
          if (n.status === 'PENDING') {
            n.status = 'BLOCKED';
            n.blockedReason = 'Upstream stage contained failed or blocked node';
          }
        }
        break;
      }
    }

    plan.completedAt = new Date().toISOString();
    plan.allSucceeded = Array.from(plan.nodes.values()).every(n => n.status === 'COMPLETED');
    return { plan, completedJobs };
  }
}

export const swarmDagEngine = SwarmDagEngine.getInstance();
