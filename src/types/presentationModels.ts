/**
 * EVE FRONTEND RECONSTRUCTION — CANONICAL PRESENTATION MODELS (Phase H.9.19)
 * 
 * Formal typed presentation contracts connecting the authoritative backend
 * to Tremor, shadcn/ui, and Recharts components with source-to-pixel lineage.
 */

export type OrganizationCategory = 
  | 'REAL_CUSTOMER' 
  | 'ACADEMY_CASE' 
  | 'DEMO_SEED' 
  | 'TEST_FIXTURE';

export type AccountingGateState = 
  | 'PASS' 
  | 'REVIEW_REQUIRED' 
  | 'NOT_TESTABLE' 
  | 'CALCULATING';

export type SentinelReadinessState =
  | 'READY'
  | 'READY_WITH_REVIEW_ITEMS'
  | 'REVIEW_REQUIRED'
  | 'DATA_VERIFICATION_REQUIRED'
  | 'INSUFFICIENT_EVIDENCE';

export type ProcessingState =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'EXTRACTED'
  | 'VERIFIED'
  | 'REVIEW_REQUIRED'
  | 'FAILED';

export interface SourceToPixelMetadata {
  factLineageId?: string;
  renderId?: string;
  canonicalMetric?: string;
  entityId?: string;
  period?: string;
  currency?: string;
  scale?: string;
  provenanceStatus?: 'verified' | 'unverified' | 'calculated' | 'review_required';
  sourceDocName?: string;
  sourcePage?: number;
  sourceRawValue?: string | number;
  sha256Hash?: string;
}

export interface PracticeKpiSummary {
  activeClientsCount: number;
  activeEngagementsCount: number;
  documentsProcessingCount: number;
  itemsRequiringReviewCount: number;
  reportsAwaitingApprovalCount: number;
  lastUpdated: string;
}

export interface AttentionQueueItem {
  id: string;
  type: 
    | 'failed_reconciliation'
    | 'missing_evidence'
    | 'review_required_fact'
    | 'currency_conflict'
    | 'entity_conflict'
    | 'missing_document'
    | 'report_awaiting_approval'
    | 'stuck_intake'
    | 'system_incident';
  title: string;
  severity: 'critical' | 'warning' | 'info';
  clientName: string;
  engagementId: string;
  timestamp: string;
  deepLinkView: string;
  deepLinkMetric?: string;
  details?: string;
}

export interface PracticeClientSummary {
  id: string;
  name: string;
  legalName: string;
  jurisdiction: string;
  industry: string;
  category: OrganizationCategory;
  activeEngagementsCount: number;
  latestPeriod: string;
  status: 'Active' | 'Pending Review' | 'Completed';
  openReviewItemsCount: number;
  lastActivity: string;
  reportingCurrency: string;
}

export interface EngagementSummary {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  period: string;
  framework: 'US_GAAP' | 'IFRS' | string;
  reportingCurrency: string;
  status: 'In Progress' | 'Review Required' | 'Ready' | 'Delivered';
  readinessState: SentinelReadinessState;
  openFindingsCount: number;
  documentsCount: number;
  factsCount: number;
  lastActivity: string;
  nextAction: string;
}

export interface StatementLinePresentation {
  id: string;
  label: string;
  canonicalMetric?: string;
  level: number;
  isHeader?: boolean;
  isTotal?: boolean;
  isSubtotal?: boolean;
  values: Record<string, number | null>; // period -> value
  formattedValues: Record<string, string>; // period -> formatted string
  currency: string;
  scale: string;
  variance?: number;
  variancePct?: number;
  verificationStatus: 'verified' | 'unverified' | 'calculated' | 'review_required';
  sourceDocName?: string;
  sourcePage?: number;
  factLineageId?: string;
  renderId?: string;
}

export interface BalanceSheetIdentityCheck {
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  variance: number;
  currency: string;
  gateState: AccountingGateState;
  operandsFound: {
    assets: boolean;
    liabilities: boolean;
    equity: boolean;
  };
}

export interface RatioDerivationPresentation {
  id: string;
  name: string;
  category: 'Liquidity' | 'Profitability' | 'Solvency' | 'Efficiency';
  value: number | null;
  formattedValue: string;
  formulaDescription: string;
  numeratorMetric: string;
  numeratorValue: number | null;
  numeratorLabel: string;
  denominatorMetric: string;
  denominatorValue: number | null;
  denominatorLabel: string;
  period: string;
  benchmark?: string;
  status: 'Normal' | 'Monitor' | 'Deficient';
  derivedCalculationId: string;
  currency: string;
}

export interface ChartDataPointPresentation {
  period: string;
  value: number;
  canonicalFactId?: string;
  derivedCalculationId?: string;
  currency: string;
  label: string;
  category?: string;
}

export interface CurrencyProvenancePresentation {
  sourceCurrency: string;
  functionalCurrency: string;
  reportingCurrency: string;
  presentationCurrency: string;
  fxRate: number;
  rateAuthority: string;
  rateDate: string;
  conversionMethod: 'Native (1.0)' | 'Spot Rate' | 'Period Average' | 'Historical Rate';
  lineageProof: string;
}

export interface NamedCpaAgentPresentation {
  id: string;
  name: string;
  callsign: string;
  role: string;
  charter: string;
  status: 'ACTIVE' | 'IDLE' | 'PROCESSING' | 'COOLDOWN';
  modelTier: string;
  currentJob: string | null;
  recentTasksCount: number;
  successRatePct: number;
  reviewRatePct: number;
  academyCompetencyScore: number;
  learningIncidentsCount: number;
  lastActivityAt: string;
  avatarColor: string;
}

export interface SystemServiceHealth {
  name: string;
  identifier: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'RECOVERING';
  url: string;
  latencyMs: number;
  uptimeSeconds: number;
  memoryMb?: number;
  verified: boolean;
  details?: string;
  lastCheckedAt: string;
}

export interface IncidentRecordPresentation {
  id: string;
  title: string;
  detectedAt: string;
  recoveredAt: string | null;
  affectedComponent: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  rootCause: string;
  remedy: string;
  jobsAffected: number;
  dataIntegrityResult: '100% PRESERVED' | 'RESTORED' | 'RECONCILED';
}
