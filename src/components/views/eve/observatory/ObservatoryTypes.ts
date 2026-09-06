/**
 * EVE NEURAL OPERATIONS OBSERVATORY — TYPES & INTERFACES
 */

export interface ObservatoryAgent {
  agentId: string;
  name: string;
  title: string;
  role: string;
  mission: string;
  charter: string[];
  domains: string[];
  allowedTools: string[];
  prohibitedTools: string[];
  preferredModelTier: string;
  operationalStatus: 'AVAILABLE' | 'WORKING' | 'IDLE' | 'REVIEWING' | 'FAILED';
  currentTaskObjective?: string;
  activeWorkspaceId?: string;
  uptimeSeconds?: number;
  competencyScores: {
    technicalAccounting: number;
    reconciliationPrecision: number;
    evidenceProvenance: number;
    anomalyDetection: number;
    consolidationLogic: number;
    multilingualExtraction: number;
    reportSynthesis: number;
    regulatoryCompliance: number;
  };
  jobsCompleted: number;
  successRate: number;
  escalationRate: number;
  learningCases: Array<{
    caseId: string;
    timestamp: string;
    context: string;
    observedDefect: string;
    rootCause: string;
    remedyApplied: string;
    verifiedBy: string;
  }>;
}

export interface ObservatoryPathway {
  id: string;
  sourceAgentId: string;
  sourceAgentName: string;
  targetAgentId: string;
  targetAgentName: string;
  signalType: string;
  description: string;
  timestamp: string;
  status: 'ACTIVE' | 'CLEARED' | 'IDLE';
}

export interface ObservatoryEventItem {
  eventId: string;
  timestamp: string;
  eventType: string;
  sourceType: string;
  sourceId: string;
  targetType?: string;
  targetId?: string;
  engagementId?: string;
  academyCaseId?: string;
  agentId?: string;
  toolId?: string;
  serviceId?: string;
  modelTier?: string;
  modelName?: string;
  summary: string;
  structuredMetadata?: Record<string, any>;
  durationMs?: number;
  eventReality?: 'FAST_REGRESSION' | 'REAL_OPERATION' | 'SYNTHETIC_CLIENT_EVENT' | 'REAL_OPERATION_SUMMARY' | string;
  executionMode?: 'FAST_REGRESSION' | 'FULL_PRACTICE' | string;
  status: 'SUCCESS' | 'IN_PROGRESS' | 'FAILED' | 'PENDING' | 'CLEARED';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'SUCCESS';
}

export interface ObservatoryStateData {
  heartbeat: {
    lastHeartbeatAt: string;
    nextHeartbeatAt: string;
    heartbeatSequence: number;
    academyState: 'IDLE' | 'RUNNING' | 'PAUSED_PREEMPTED' | 'CHECKPOINTING' | 'REGRESSION_TESTING' | 'DARWIN_ANALYSIS' | 'COOLDOWN' | 'COMPLETED';
    currentCaseId?: string | null;
    currentStage?: string | null;
    nextFullPracticeEligibleAt?: string;
    reasonForNextSchedule?: string;
    lastDecision?: {
      timestamp: string;
      action: string;
      reason: string;
    };
    customerQueueState: {
      pendingJobs: number;
      preemptingBackground: boolean;
    };
    resourceSnapshot: {
      cpuCores: number;
      cpuLoadAvg: number[];
      ramFreeMb: number;
      ramTotalMb: number;
      ramUsageMb: number;
      diskFreeGb: number;
      diskTotalGb: number;
      hardwareProfile: string;
    };
    servicesHealth: {
      ollamaLocalAI: { verified: boolean; latencyMs?: number; url: string; model: string };
      hermesAgent: { verified: boolean; gatewayUrl: string; dashboardUrl: string };
      openClawGateway: { verified: boolean; gatewayUrl: string; dashboardUrl: string };
      extractionWorker: { verified: boolean; latencyMs?: number; url: string };
    };
  };
  productionState: {
    ACADEMY_LIVE_STARTED_AT: string;
    currentMaturity: string;
    activeMission: string;
    nodeArchitecture: string;
    zeroToleranceCertified: boolean;
    numericErrorRate: number;
    provenanceIntegrity: number;
    crossEngagementLeakage: number;
  };
  currentEngagement?: any;
  agents: ObservatoryAgent[];
  activePathways: ObservatoryPathway[];
  servicesHealth: any;
  customerQueue: {
    pendingJobs: number;
    preemptingBackground: boolean;
  };
  recentEvents: ObservatoryEventItem[];
  coverage: any;
  completedTwins?: any[];
  caseHistory?: Record<string, { caseId: string; lastRunAt: string | null; executionCount: number; failureCount: number; lastMode?: string }>;
  cases?: any[];
  incidents: any[];
  evolutionProposals: any[];
  capabilityRequests: any[];
}
