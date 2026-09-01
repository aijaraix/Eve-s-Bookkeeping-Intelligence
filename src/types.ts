export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'CPA Lead Partner' | 'Senior Audit Manager' | 'Staff Accountant' | 'Guest Reviewer';
  organization: string;
  avatarUrl?: string;
  pinCode?: string;
  isAuthenticated: boolean;
}

export type ActiveView =
  | 'overview'
  | 'projects'
  | 'companies'
  | 'documents'
  | 'financials-dashboard'
  | 'income-statement'
  | 'balance-sheet'
  | 'cash-flow'
  | 'ratios'
  | 'segment-analysis'
  | 'comparative-analysis'
  | 'trend-analysis'
  | 'forecast'
  | 'hermes-swarm'
  | 'audit-findings'
  | 'ai-deliverables'
  | 'users-teams'
  | 'activity-log';

export interface KPICardData {
  id: string;
  title: string;
  value: string;
  subtext: string;
  trendData: number[];
  color: string;
}

export interface RatioItem {
  name: string;
  ytd: string;
  py: string;
  change: string;
  benchmark: string;
  status: 'Good' | 'Caution' | 'Warning';
}

export interface FinancialFact {
  id: string;
  metric: string;
  label: string;
  value: number;
  formattedValue: string;
  rawString: string;
  currency: string;
  period: string;
  periodType: 'ANNUAL' | 'QUARTERLY' | 'TRAILING';
  statementType: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'NOTE_DISCLOSURE' | 'SEGMENT';
  pageNumber: number;
  tableHeader?: string;
  scaleSource?: string;
  confidence: number;
  status: 'VERIFIED' | 'REVIEW_REQUIRED' | 'RECONCILED' | 'CONFLICT';
  provenance: {
    documentId: string;
    documentTitle: string;
    section: string;
    lineNumber?: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
    snippet: string;
  };
}

export interface QueueJobStatus {
  id: string;
  documentTitle: string;
  fileSize: string;
  pagesTotal: number;
  pagesCompleted: number;
  status: 'PROCESSING' | 'COMPLETED' | 'WAITING_FOR_AI_CAPACITY' | 'QUEUED' | 'FAILED';
  currentStage: string;
  engineMode: 'HYBRID_GEMINI_NATIVE' | 'STRUCTURED_OCR' | 'DEEP_PARSER';
  progress: number;
  factsExtracted: number;
  startedAt: string;
}

export interface AccountingIdentityCheck {
  id: string;
  name: string;
  statement: string;
  formula: string;
  leftSideValue: number;
  rightSideValue: number;
  variance: number;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  toleranceThreshold: number;
  explanation: string;
}

export interface FinancialRatio {
  name: string;
  category: 'PROFITABILITY' | 'LIQUIDITY' | 'SOLVENCY' | 'EFFICIENCY';
  value: number;
  formattedValue: string;
  benchmark: string;
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
  health: 'EXCELLENT' | 'GOOD' | 'WARNING';
  formula: string;
  interpretation: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  target: string;
  details: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
}
