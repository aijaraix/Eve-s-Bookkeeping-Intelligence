import { ExtractedFact, ReportingScopeType } from '../../src/types.js';

export interface DocumentMapStatementCandidate {
  statementType: 'CONSOLIDATED_INCOME_STATEMENT' | 'CONSOLIDATED_BALANCE_SHEET' | 'CONSOLIDATED_CASH_FLOW' | 'CONSOLIDATED_EQUITY_STATEMENT' | 'PARENT_COMPANY_INCOME_STATEMENT' | 'PARENT_COMPANY_BALANCE_SHEET' | 'PARENT_COMPANY_CASH_FLOW' | 'PARENT_COMPANY_EQUITY_STATEMENT' | 'OTHER_FINANCIAL_STATEMENT' | 'UNKNOWN';
  statementTitle: string;
  physicalPageCandidates: number[];
  printedPageCandidates?: number[];
  reportingEntity?: string;
  scope?: ReportingScopeType;
  period?: string;
  currency?: string;
  scale?: string;
  confidence?: number;
}

export interface DocumentMapModel {
  documentType: string;
  documentTitle: string;
  documentIssuer: string;
  legalEntities: string[];
  reportingEntities: string[];
  reportingScopes: ReportingScopeType[];
  fiscalPeriods: string[];
  currencies: string[];
  primaryReportingCurrency: string;
  functionalCurrencies: string[];
  accountingFramework?: string;
  languages: string[];
  primaryStatements: DocumentMapStatementCandidate[];
  importantNotes: Array<{ noteNumber?: string; title: string; category: string; physicalPages: number[] }>;
  auditorSections?: Array<{ title: string; physicalPages: number[] }>;
  companyAccountSections?: Array<{ title: string; physicalPages: number[] }>;
  consolidatedSections?: Array<{ title: string; physicalPages: number[] }>;
  segmentSections?: Array<{ title: string; physicalPages: number[] }>;
}

export interface StatementFactCandidate {
  metricLabel: string;
  canonicalMetricCandidate?: string;
  rawValue: string;
  rawText?: string;
  currency: string;
  scale?: string;
  period: string;
  comparativePeriod?: string;
  reportingEntity?: string;
  reportingScope?: ReportingScopeType;
  statementType: string;
  physicalPage: number;
  printedPage?: number;
  rowLabel: string;
  columnLabel?: string;
  isSubtotal?: boolean;
  isTotal?: boolean;
  isDerivedBySource?: boolean;
  confidence: number;
  sourceQuote: string;
}

export interface EvidenceCrossCheckResult {
  candidate: StatementFactCandidate;
  evidenceStatus: 'CONFIRMED' | 'VISUALLY_CONFIRMED' | 'PARTIAL' | 'UNCONFIRMED' | 'CONFLICTED';
  matchedSourceText?: string;
  matchedPageNumber?: number;
  confidenceScore: number;
  notes?: string;
}

export interface SemanticExtractionTask {
  taskId: string;
  intakeId: string;
  documentId: string;
  taskType: 'DOCUMENT_MAP' | 'EXTRACT_INCOME_STATEMENT' | 'EXTRACT_BALANCE_SHEET' | 'EXTRACT_CASH_FLOW' | 'EXTRACT_EQUITY' | 'EXTRACT_NOTE';
  status: 'QUEUED' | 'RUNNING' | 'WAITING_RATE_LIMIT' | 'RETRY_SCHEDULED' | 'COMPLETED' | 'COMPLETED_WITH_WARNINGS' | 'FAILED_TERMINAL';
  attempts: number;
  provider: string;
  model: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  retryAt?: number;
  resultData?: any;
}
