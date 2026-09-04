export interface Company {
  id: string;
  name: string;
  ticker: string;
  country: string;
  reporting: 'IFRS' | 'US GAAP';
  currency: string;
  healthScore: string;
  status: 'AUDITED' | 'IN_PROGRESS' | 'REVIEW_REQUIRED';
  reg: string;
  sector: string;
  revenue: string;
  netIncome: string;
  assets: string;
  activeProjectsCount: number;
  workspaceId: string;
}

export interface Project {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  ticker: string;
  sector: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PENDING_REVIEW';
  reporting: 'IFRS' | 'US GAAP';
  assignedLead: string;
  facts: number;
  docsCount: number;
  startDate: string;
  dueDate: string;
  workspaceId: string;
}

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
  | 'equity-statement'
  | 'notes-disclosures'
  | 'ratios'
  | 'segment-analysis'
  | 'comparative-analysis'
  | 'trend-analysis'
  | 'forecast'
  | 'corporate-structure'
  | 'currencies-fx'
  | 'capital-structure'
  | 'hermes-swarm'
  | 'audit-findings'
  | 'working-papers'
  | 'evidence-registry'
  | 'ai-deliverables'
  | 'firm-settings'
  | 'worker-diagnostics'
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
  rawString?: string;
  currency?: string;
  period: string;
  periodType?: 'ANNUAL' | 'QUARTERLY' | 'TRAILING';
  statementType?: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'NOTE_DISCLOSURE' | 'SEGMENT' | string;
  pageNumber: number;
  tableHeader?: string;
  scaleSource?: string;
  scale?: string;
  confidence?: number;
  status?: 'VERIFIED' | 'REVIEW_REQUIRED' | 'RECONCILED' | 'CONFLICT' | string;
  verified?: boolean;
  sourceDocumentId?: string;
  sourceDocumentName?: string;
  provenance?: {
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

// ---- Server / extraction domain types (fail-closed pipeline) ----
export interface AgentOpinion {
  agentName: 'FIN_AGENT' | 'AUDIT_AGENT' | 'RISK_AGENT' | 'HERMES_SUPERVISOR';
  status: 'Agree' | 'Partial' | 'Disagree';
  confidence: number;
  opinion: string;
}

export interface HermesFinding {
  id: string;
  workspaceId: string;
  companyName: string;
  title: string;
  category: 'Revenue' | 'Inventory' | 'AP' | 'Journal Entries' | 'Cash' | 'Tax' | 'Compliance' | 'Fixed Assets';
  risk: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  finAgentStatus: 'Agree' | 'Partial' | 'Disagree';
  auditAgentStatus: 'Agree' | 'Partial' | 'Disagree';
  riskAgentStatus: 'Agree' | 'Partial' | 'Disagree';
  consensusScore: number;
  confidenceScore: number;
  materiality: number;
  status: 'Auto Resolved' | 'Needs Review' | 'Escalated' | 'Waiting Evidence';
  nextAction: string;
  assignee?: string;
  assigneeAvatar?: string;
  dueDate?: string;
  period: string;
  createdDate: string;
  finAgentOpinion: string;
  finAgentConfidence: number;
  auditAgentOpinion: string;
  auditAgentConfidence: number;
  riskAgentOpinion: string;
  riskAgentConfidence: number;
  aiRecommendation: string;
  relatedDocsCount: number;
  relatedJeCount: number;
  relatedAccountsCount: number;
  relatedTasksCount: number;
  agentOpinions?: AgentOpinion[];
}
export interface Workspace {
  id: string;
  name: string;
  code: string;
  currency: string;
  country: string;
  period?: string;
  userEmail?: string;
  createdAt: string;
  workspaceType?: 'bank_statement_review' | 'monthly_bookkeeping' | 'financial_statement_analysis' | 'audit_engagement' | 'tax_review' | 'expense_review' | 'general_workspace';
  primaryEntityId?: string;
}

export interface BankTransaction {
  id: string;
  workspaceId: string;
  documentId: string;
  date: string;
  postingDate?: string;
  description: string;
  rawDescription: string;
  amount: number;
  transactionType: 'deposit' | 'withdrawal' | 'fee' | 'check' | 'transfer';
  counterparty?: string;
  referenceNumber?: string;
  category: string;
  sourcePage: number;
  sourceRow?: number;
  confidence: number;
  reconciled: boolean;
}

export interface BankAccountSummary {
  bankName: string;
  accountHolder: string;
  accountType: string;
  maskedAccountNumber: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  beginningBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalChecks: number;
  totalFees: number;
  endingBalance: number;
  averageBalance: number;
  depositCount: number;
  withdrawalCount: number;
  transactionCount: number;
  calculatedEndingBalance: number;
  reconciliationPassed: boolean;
}

export interface DocumentRecord {
  id: string;
  workspaceId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  sha256: string;
  status: string;
  category: string;
  language: string;
  currency: string;
  entityName: string;
  period: string;
  confidence: number;
  extractedFactsCount: number;
  reviewStatus: string;
  createdAt: string;
  summary: string;
  pageCount?: number;
  filePath?: string;
  ingestionVersion?: string;
  isDuplicate?: boolean;
  engineMode?: string;
}

export interface ProvenanceCoordinates {
  pageNumber: number;
  boundingBox?: {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  };
  tableRowIndex?: number;
  tableColIndex?: number;
  tableId?: string;
  cellRange?: string;
  rawSnippet: string;
  contextSentence?: string;
  sectionTitle?: string;
}

export interface FxConversionMeta {
  sourceCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  effectiveDate: string;
  rateSource: 'ECB' | 'FED' | 'USER_OVERRIDE' | 'EXTRACTED_NOTES' | 'REFERENCE_RATE_NOT_FOR_REPORTING' | string;
  originalAmount: number;
  functionalAmount: number;
}

export interface ExtractedFact {
  // Core Identifiers
  id: string;
  fact_id?: string;
  workspaceId: string;
  company_id?: string;
  documentId: string;
  document_id?: string;
  factType: string;
  extractionEngine?: 'HYBRID_GEMINI_NATIVE' | 'DETERMINISTIC_NATIVE' | 'LEGACY_PAGE_SWARM' | 'MANUAL_ENTRY' | 'DERIVED_CALCULATION' | string;

  // Taxonomy & Classification
  canonicalMetric?: 'revenue' | 'comparative_revenue' | 'cost_of_sales' | 'gross_profit' | 'operating_profit' | 'ebitda' | 'profit_before_tax' | 'net_income' | 'total_assets' | 'total_liabilities' | 'total_equity' | 'operating_cash_flow' | 'free_cash_flow' | 'investing_cash_flow' | 'financing_cash_flow' | 'unclassified' | string;
  canonical_metric?: string;
  statementType?: 'income_statement' | 'balance_sheet' | 'cash_flow' | 'equity' | 'notes' | 'segment' | 'geography' | 'risk' | 'tax' | 'ratio' | 'audit' | 'governance' | string;
  statement_type?: string;
  statementSection?: string;
  statement_section?: string;
  statementName?: string;

  // Labels & Text
  labelOriginal: string;
  raw_label?: string;
  labelNormalized: string;
  metric?: string;
  label?: string;
  formattedValue?: string;
  period?: string;
  sourceDocumentName?: string;
  evidenceStatus?: string;
  rowLabel?: string;
  source_row?: string;
  columnLabel?: string;
  source_column?: string;

  // Provenance Location
  pageNumber: number;
  source_page?: number;
  sourceUnitId?: string;
  extractionAttemptId?: string;
  tableName?: string;
  source_table?: string;
  sourceText: string;
  rawText?: string;
  source_context?: string;
  sourceDocument?: string;

  // Values & Scale (Crucial: never destroy raw value!)
  valueOriginal: string;
  rawValue?: string;
  valueFunctional: string;
  normalizedValue?: number;
  reportedOrDerived?: 'reported' | 'derived';
  reported_or_derived?: 'reported' | 'derived';
  formulaIfDerived?: string;
  formula_if_derived?: string;

  // Units, Scale, & Currency
  currencyOriginal: string;
  functionalCurrency: string;
  currency?: string;
  reportedUnit?: string;
  reported_unit?: string;
  unitScale?: 'Units' | 'Thousands' | 'Millions' | 'Billions' | string;
  scale?: string;
  scaleOriginal?: string;
  normalizedScaleMultiplier?: number;
  exchangeRate?: string;

  // Time & Reporting Periods
  periodStart?: string;
  period_start?: string;
  periodEnd?: string;
  period_end?: string;
  fiscalYear?: string;
  fiscal_year?: string;
  reportingPeriod?: string;
  fiscalPeriod?: string;
  periodType?: 'annual' | 'quarterly' | 'ltm' | 'restated' | string;
  period_type?: string;
  periodOriginal?: string;
  isRestated?: boolean;

  // Accounting Standards & Operations
  gaapOrNonGaap?: 'gaap' | 'non_gaap' | 'ifrs' | string;
  gaap_or_non_gaap?: string;
  continuingOrDiscontinued?: 'continuing' | 'discontinued' | 'consolidated' | string;
  continuing_or_discontinued_operations?: string;

  // Dimensions & Sub-Breakdowns
  segment?: string;
  geography?: string;
  businessUnit?: string;
  business_unit?: string;
  productCategory?: string;
  product_category?: string;

  // Sign & Accounting Role
  sourcePresentationSign?: 'positive' | 'negative' | 'parentheses';
  accountingRole?: 'revenue' | 'expense' | 'asset' | 'liability' | 'equity' | 'profit' | 'loss' | 'cash_inflow' | 'cash_outflow' | string;
  normalizedSign?: 1 | -1;

  // Status, Confidence, & Verification
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'DISCREPANCY' | 'proposed' | 'approved' | 'rejected' | 'discrepancy' | 'VALIDATED' | string;
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'DATA_VERIFICATION_REQUIRED' | 'validated' | string;
  verification_status?: string;
  confidence: number;
  confidence_score?: number;
  extractionMethod: 'SWARM_CLAUDE_3_7' | 'SWARM_CLAUDE_3_5' | 'GEMINI_FLASH' | 'HEURISTIC_PARSER' | 'HYBRID' | 'Deterministic OCR & Table Parser' | 'Deterministic Narrative Parser' | string;
  extraction_method?: string;
  validationMethod?: string;
  validation_method?: string;
  crossReference?: string;
  cross_reference?: string;

  // Nested structures
  provenance?: ProvenanceCoordinates;
  fxDetails?: FxConversionMeta;
  auditTrailId?: string;
  verificationNotes?: string;

  // Stage 2: Corporate Group & Multilingual fields
  entityId?: string;
  entityName?: string;
  entityScope?: 'Consolidated' | 'Parent Only' | 'Subsidiary' | string;
  entity_scope?: string;
  originalLanguage?: string;
  detectedLanguage?: string;
  translationQualityScore?: number;

  // Stage 3: Unbounded Registry, Candidates, Second-Pass Disclosures & Multi-Stage Reconciliation
  candidateState?: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'VERIFIED' | string;
  isCandidate?: boolean;
  candidateSource?: 'SECOND_PASS_NOTE' | 'BACKFILL_AGENT' | 'FIRST_PASS' | string;
  isNoteDisclosure?: boolean;
  noteReference?: string;
  disclosureCategory?: 'Leases & Commitments' | 'Tax Disclosures' | 'Segment Reporting' | 'Contingencies' | 'Related Parties' | 'Accounting Policies' | 'General Disclosures' | string;
  verificationStage?: 'UNVERIFIED' | 'PASS_1_MATH' | 'PASS_2_RECONCILED' | 'FLAGGED' | string;
  reconciliationVariance?: number;
  reconciliationRule?: string;

  // Phase H.2 Forensic Reliability & Canonical Fact Integrity Fields
  legal_entity?: string;
  legalEntity?: string;
  reporting_entity?: string;
  reportingEntity?: string;
  parent_entity?: string;
  parentEntity?: string;
  workspace_entity?: string;
  workspaceEntity?: string;
  reporting_scope?: ReportingScopeType;
  reportingScope?: ReportingScopeType;
  consolidation_scope?: string;
  consolidationScope?: string;
  raw_value?: string;
  raw_currency?: string;
  raw_scale?: 'ONES' | 'THOUSANDS' | 'MILLIONS' | 'BILLIONS' | 'UNKNOWN' | string;
  raw_text?: string;
  normalized_value?: number;
  normalized_currency?: string;
  normalized_scale?: 'ONES' | 'THOUSANDS' | 'MILLIONS' | 'BILLIONS' | 'UNKNOWN' | string;
  canonical_metric_id?: string;
  is_derived?: boolean;
  formula?: string;
  parent_fact_ids?: string[];
  verification_state?: PhaseH2VerificationState;
  corroboratingSources?: Array<{
    documentId: string;
    documentName: string;
    pageNumber: number;
    tableName?: string;
    rawValue: string;
    confidence: number;
    sourceText?: string;
  }>;
}

export type ReportingScopeType =
  | 'CONSOLIDATED_GROUP'
  | 'PARENT_ONLY'
  | 'SUBSIDIARY'
  | 'SEGMENT'
  | 'CONTINUING_OPERATIONS'
  | 'DISCONTINUED_OPERATIONS'
  | 'ASSOCIATE'
  | 'JOINT_VENTURE'
  | 'OTHER'
  | 'UNKNOWN';

export interface EntityEvidenceLineage {
  canonical_entity_id: string;
  canonical_entity_name: string;
  legal_entity: string;
  reporting_entity: string;
  parent_entity: string;
  consolidation_scope: string;
  reporting_scope: ReportingScopeType;
  source_document_id: string;
  source_document_name: string;
  source_page: number;
  source_table?: string;
  source_section?: string;
  evidence_text: string;
  resolution_method: string;
  confidence_score: number;
  verification_state: 'PROPOSED' | 'VALIDATED' | 'APPROVED' | 'VERIFIED' | 'REJECTED' | 'CONFLICTED' | 'UNRESOLVED';
  raw_entity_text: string;
  canonical_entity: string;
}

export interface GeneralizedDocumentEntityModel {
  documentIssuer: string;
  reportingEntity: string;
  parentEntity: string;
  workspaceEntity: string;
  consolidationScope: ReportingScopeType;
  reportingScope: ReportingScopeType;
  referencedEntities: Array<{
    name: string;
    type: 'SUBSIDIARY' | 'PARENT' | 'ASSOCIATE' | 'JOINT_VENTURE' | 'AUDITOR' | 'REGULATOR' | 'COUNTERPARTY' | 'OTHER';
    evidenceText?: string;
    confidence?: number;
    ownershipPercentage?: number;
  }>;
  evidenceText: string;
  evidenceSource: {
    pageNumber?: number;
    section?: string;
    table?: string;
  };
  resolutionMethod: string;
  confidenceScore: number;
  verificationState: 'PROPOSED' | 'VALIDATED' | 'APPROVED' | 'VERIFIED' | 'REJECTED' | 'CONFLICTED' | 'UNRESOLVED';
  candidateEntities?: Array<{
    name: string;
    confidence: number;
    evidence: string;
  }>;
}

export type PhaseH2VerificationState =
  | 'RAW'
  | 'EXTRACTED'
  | 'NORMALIZED'
  | 'CANONICAL_CANDIDATE'
  | 'RECONCILED'
  | 'VERIFIED'
  | 'DERIVED_UNVERIFIED'
  | 'VERIFIED_DERIVED'
  | 'CONFLICT'
  | 'INSUFFICIENT_EVIDENCE'
  | 'REVIEW_REQUIRED'
  | 'REJECTED';

export type PageClassificationType =
  | 'COVER'
  | 'INDEX'
  | 'NARRATIVE'
  | 'FINANCIAL_STATEMENT'
  | 'FINANCIAL_TABLE'
  | 'NOTE_DISCLOSURE'
  | 'ACCOUNTING_POLICY'
  | 'AUDITOR_REPORT'
  | 'MANAGEMENT_REPORT'
  | 'OTHER';

export interface SixReliabilityLayersStatus {
  ingestion: {
    documentsProcessed: number;
    totalDocuments: number;
    pagesProcessed: number;
    totalPages: number;
    isComplete: boolean;
  };
  extraction: {
    financialPagesDetected: number;
    factsExtracted: number;
    candidateFactsCount: number;
    tablesDetected: number;
    isComplete: boolean;
  };
  evidenceCoverage: {
    factsWithCoordinates: number;
    factsWithSourceText: number;
    coveragePct: number;
    isComplete: boolean;
  };
  reconciliation: {
    balanceSheetReconciled: boolean;
    incomeStatementReconciled: boolean;
    cashFlowReconciled: boolean;
    reconciliationStatus: 'RECONCILED' | 'DISCREPANCY' | 'PENDING';
  };
  verification: {
    verifiedFacts: number;
    reviewRequiredFacts: number;
    unresolvedConflicts: number;
    status: 'VERIFIED' | 'REVIEW_REQUIRED' | 'CONFLICT';
  };
  presentationIntegrity: {
    magnitudeMismatchCount: number;
    signMismatchCount: number;
    taxonomyMismatchCount: number;
    isVerified: boolean;
  };
  overallStatus: 'AUDIT_READY' | 'REVIEW_REQUIRED' | 'PROCESSING' | 'INCOMPLETE_EVIDENCE';
}

export interface PageDiagnostics {
  pageNumber: number;
  documentId: string;
  classification: PageClassificationType;
  tablesDetected: number;
  candidateFactsCount: number;
  extractedFactsCount: number;
  rejectedFactsCount: number;
  factsNeedingReviewCount: number;
  hasSuspiciousZeroExtraction: boolean;
  warningMessage?: string;
}

export interface FactCandidate {
  id: string;
  workspaceId: string;
  documentId: string;
  proposedLabel: string;
  canonicalMetric: string;
  proposedValue: number;
  currency: string;
  candidateState: 'PROPOSED' | 'ACCEPTED' | 'REJECTED';
  candidateSource: 'SECOND_PASS_NOTE' | 'BACKFILL_AGENT' | 'FIRST_PASS';
  noteReference?: string;
  sourceSnippet: string;
  pageNumber: number;
  confidence: number;
  reasoning: string;
  createdAt: string;
}

export interface AccountingReconciliationRule {
  id: string;
  ruleCode: string;
  ruleName: string;
  statementA: string;
  metricA: string;
  statementB: string;
  metricB: string;
  tolerance: number;
  status: 'BALANCED' | 'VARIANCE_DETECTED' | 'MISSING_DATA' | 'INCOMPLETE_BRIDGE' | 'INSUFFICIENT_DIMENSIONALLY_MATCHED_DATA';
  expectedEquation: string;
  calculatedValueA: number;
  calculatedValueB: number;
  variance: number;
  explanation: string;
}

export interface CorporateEntity {
  id: string;
  workspaceId: string;
  name: string;
  legalName: string;
  jurisdiction: string;
  reportingCurrency: string;
  entityType: 'PARENT' | 'SUBSIDIARY' | 'JOINT_VENTURE' | 'AFFILIATE' | 'OPERATING_UNIT' | 'SUPPLIER' | 'VENDOR';
  ownershipPercentage: number;
  scope: 'Consolidated' | 'Parent Only' | 'Subsidiary' | 'Unconsolidated Vendor';
  taxId?: string;
  notes?: string;
  spendOrRevenue?: number;
  criticalityRisk?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL_SINGLE_SOURCE';
  category?: string;
  createdAt: string;
}

export interface EntityRelationship {
  id: string;
  workspaceId: string;
  parentEntityId: string;
  childEntityId: string;
  relationshipType: 'PARENT_OF' | 'SUBSIDIARY_OF' | 'OWNS' | 'JOINT_VENTURE' | 'SUPPLIER_TO';
  ownershipPercentage: number;
  effectiveDate?: string;
  consolidationMethod: 'FULL' | 'EQUITY' | 'PROPORTIONAL' | 'VENDOR_UNCONSOLIDATED' | 'NONE';
  annualTransactionVolume?: number;
  intercompanyNotes?: string;
}

export interface FirmBranding {
  firmName: string;
  partnerName: string;
  licenseNumber: string;
  firmAddress: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  accentColor?: string;
  opinionType?: string;
  disclaimer?: string;
}

export interface FxRateRecord {
  id: string;
  sourceCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  effectiveDate: string;
  rateSource: 'ECB' | 'FED' | 'USER_OVERRIDE' | 'EXTRACTED_NOTES' | 'BOE' | 'BOJ' | 'REFERENCE_RATE_NOT_FOR_REPORTING';
  lastUpdated: string;
}

export interface StatementCoverageStatus {
  incomeStatement: { detected: boolean; factCount: number; verifiedCount: number; coveragePct: number };
  balanceSheet: { detected: boolean; factCount: number; verifiedCount: number; coveragePct: number };
  cashFlow: { detected: boolean; factCount: number; verifiedCount: number; coveragePct: number };
  equityStatement: { detected: boolean; factCount: number; verifiedCount: number; coveragePct: number };
  notesToFinancials: { detected: boolean; factCount: number; verifiedCount: number; coveragePct: number };
  segmentDisclosures: { detected: boolean; factCount: number; verifiedCount: number; coveragePct: number };
  geographicDisclosures: { detected: boolean; factCount: number; verifiedCount: number; coveragePct: number };
  riskDisclosures: { detected: boolean; factCount: number; verifiedCount: number; coveragePct: number };
  managementKpis: { detected: boolean; factCount: number; verifiedCount: number; coveragePct: number };
}

export interface FactExtractionReport {
  validatedEntity: string;
  entityCode: string;
  pagesProcessed: number;
  documentsProcessed: number;
  totalFactsExtracted: number;
  verifiedFactsCount: number;
  derivedMetricsCount: number;
  unverifiedFactsCount: number;
  rejectedFactsCount: number;
  tablesDetectedCount: number;
  statementsLocatedCount: number;
  reportingSectionsCount: number;
  reportingPeriods: string[];
  primaryCurrency: string;
  statementCoverage: StatementCoverageStatus;
  pipelineStatus: {
    processingComplete: boolean;
    financialValidationComplete: boolean;
    factValidationPassRate: string;
    accountingReconciliationRate: string;
    overallConfidenceScore: string;
  };
}

export interface AgentExecutionLog {
  agentId: string;
  agentRole: 'INSPECTOR' | 'CURRENCY_VERIFIER' | 'DISCREPANCY_AUDITOR' | 'ARITHMETIC_RECONCILER' | 'CROSS_CHECKER' | 'BACKFILL_AGENT' | string;
  timestamp: string;
  modelUsed: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  inputSummary: string;
  findings: string[];
  discrepanciesFound?: number;
  executionTimeMs: number;
  prompt?: string;
  response?: string;
}

export interface AuditTrailRecord {
  id: string;
  workspaceId: string;
  documentId?: string;
  factId?: string;
  timestamp: string;
  action: 'DOCUMENT_INGEST' | 'SWARM_EXTRACT' | 'CURRENCY_NORMALIZE' | 'RECONCILE_ARITHMETIC' | 'USER_OVERRIDE' | 'REJECT_HALLUCINATION' | 'HERMES_SYNTHESIZE' | 'AUTONOMOUS_FIELD_BACKFILL' | string;
  actor: string;
  modelUsed?: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
}

export interface DiscrepancyItem {
  id: string;
  workspaceId: string;
  documentId: string;
  factId?: string;
  category: 'CURRENCY_MISMATCH' | 'SCALE_AMBIGUITY' | 'ARITHMETIC_MISMATCH' | 'YOY_ANOMALY' | 'MULTILINGUAL_TRANSLATION_CONFLICT';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  expectedValue?: string;
  actualValue?: string;
  suggestedAction: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface LLMGatewayRequest {
  prompt: string;
  systemInstruction?: string;
  preferredModel?: 'anthropic/claude-3.7-sonnet' | 'anthropic/claude-3.5-sonnet' | 'google/gemini-3.6-flash' | 'google/gemini-3.1-pro-preview' | 'auto';
  temperature?: number;
  maxTokens?: number;
  jsonSchemaFormat?: boolean;
}

export interface LLMGatewayResponse {
  content: string;
  modelUsed: string;
  provider: 'OPENROUTER' | 'GEMINI_DIRECT' | 'FALLBACK_HEURISTIC';
  tokensUsed?: { promptTokens: number; completionTokens: number };
  executionTimeMs: number;
  error?: string;
  retryCount?: number;
  providerAttemptHistory?: Array<{ provider: string; model: string; status: number | string; durationMs: number; error?: string }>;
}


export interface FinancialPeriodSegment {
  period: string;
  revenue: string;
  costOfRevenue: string;
  grossProfit: string;
  operatingExpenses: string;
  operatingIncome: string;
  netIncome: string;
  assets: string;
  liabilities: string;
  equity: string;
  docCount: number;
}

export interface FinancialSummary {
  revenue: string;
  costOfRevenue: string;
  grossProfit: string;
  operatingExpenses: string;
  operatingIncome: string;
  ebitda: string;
  profitBeforeTax: string;
  taxes: string;
  netIncome: string;
  cash: string;
  assets: string;
  liabilities: string;
  equity: string;
  accountsReceivable: string;
  accountsPayable: string;
  operatingCashFlow: string;
  investingCashFlow?: string;
  financingCashFlow?: string;
  netInvestingCashFlow?: string;
  netFinancingCashFlow?: string;
  freeCashFlow: string;
  grossMarginPct?: string;
  operatingMarginPct?: string;
  netMarginPct?: string;
  debtToEquity?: number;
  returnOnEquity?: number;
  underlyingOperatingMarginPct?: string;
  currency: string;
  period: string;
  validationPassRate: string;
  averageConfidence: string;
  hasDiscrepancies?: boolean;
  totalFacts: number;
  approvedFacts: number;
  proposedFacts: number;
  rejectedFacts: number;
  documentCount?: number;
  hasValidatedFacts?: boolean;
  revenueRaw?: number;
  comparativeRevenueRaw?: number;
  revenueYoYPct?: string;
  costOfRevenueRaw?: number;
  grossProfitRaw?: number;
  operatingIncomeRaw?: number;
  ebitdaRaw?: number;
  profitBeforeTaxRaw?: number;
  netIncomeRaw?: number;
  cashRaw?: number;
  assetsRaw?: number;
  liabilitiesRaw?: number;
  equityRaw?: number;
  operatingCashFlowRaw?: number;
  netInvestingCashFlowRaw?: number;
  netFinancingCashFlowRaw?: number;
  freeCashFlowRaw?: number;
  currentAssetsRaw?: number;
  currentLiabilitiesRaw?: number;
  unitScale?: string;
  validationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'DATA_VERIFICATION_REQUIRED';
  validationMessage?: string;
  kpiProvenanceMap?: Record<string, ExtractedFact>;
  multiPeriodData?: FinancialPeriodSegment[];
}

// ==========================================
// SYSTEM DIAGNOSTICS & OBSERVABILITY TYPES
// ==========================================

export interface PageManifestRecord {
  id: string;
  document_id: string;
  page_number: number;
  printed_page_number?: number;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'RETRYING' | 'FAILED' | 'REVIEW_REQUIRED';
  text_detected: boolean;
  image_detected: boolean;
  table_detected: boolean;
  chart_detected: boolean;
  ocr_required: boolean;
  native_text_available: boolean;
  processing_attempts: number;
  processing_duration_ms: number;
  worker_job_id?: string;
  failure_reason?: string;
  retry_count: number;
  source_blocks_created: number;
  facts_extracted: number;
  verification_status: string;
}

export interface SourceBlockRecord {
  source_block_id: string;
  document_id: string;
  page_number: number;
  section: string;
  subsection?: string;
  block_type: 'Heading' | 'Paragraph' | 'Table' | 'Row' | 'Cell' | 'Footnote' | 'Chart' | 'Caption' | 'Note' | 'List' | 'Disclosure';
  raw_text: string;
  normalized_text?: string;
  bounding_box?: { xMin: number; yMin: number; xMax: number; yMax: number };
  table_relationship?: { table_id: string; row_index: number; col_index: number };
  parent_block_id?: string;
  child_block_ids?: string[];
  processing_status: 'CAPTURED' | 'PROCESSED' | 'FAILED';
}

export interface TableInspectorRecord {
  table_id: string;
  document_id: string;
  page_number: number;
  table_title: string;
  headers: string[];
  rows: string[][];
  columns_count: number;
  rows_count: number;
  currency: string;
  unit: string;
  reporting_period: string;
  statement_type: string;
  extraction_confidence: number;
  processing_state: 'DETECTED' | 'EXTRACTED' | 'FAILED' | 'AMBIGUOUS';
  facts_generated: number;
  validation_result: string;
  issues: string[];
}

export interface DerivedMetricRecord {
  derived_metric_id: string;
  workspace_id: string;
  metric_name: string;
  formula: string;
  input_fact_ids: string[];
  input_values: Record<string, number | string>;
  calculation_result: number | string | null;
  currency_or_unit: string;
  reporting_period: string;
  validation_status: 'CALCULATED' | 'NOT_AVAILABLE' | 'INVALID_INPUTS';
  calculated_at: string;
}

export interface ValidationRuleResult {
  validation_id: string;
  workspace_id: string;
  rule_name: string;
  formula: string;
  input_fact_ids: string[];
  expected_result: string | number;
  actual_result: string | number;
  variance: number;
  variance_pct: number;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'INSUFFICIENT_DATA' | 'REVIEW_REQUIRED';
  reason: string;
  timestamp: string;
}

export interface FactConflictRecord {
  conflict_id: string;
  workspace_id: string;
  canonical_metric: string;
  reporting_period: string;
  candidates: {
    fact_id: string;
    value: string;
    normalized_value: number;
    source_document: string;
    page_number: number;
    context: string;
    confidence: number;
    authority_rank: number;
  }[];
  classification: 'rounding' | 'reported_vs_underlying' | 'gaap_vs_nongaap' | 'continuing_vs_discontinued' | 'segment_vs_consolidated' | 'period_difference' | 'unresolved';
  resolved_fact_id?: string;
  resolution_notes?: string;
}

export interface AdditionalFactOpportunity {
  opportunity_id: string;
  document_id: string;
  page_number: number;
  category: 'operational_kpi' | 'guidance' | 'tax_rate' | 'interest_rate' | 'employee_count' | 'rd_spend' | 'debt_maturity' | 'esg' | 'risk' | 'governance' | 'other';
  detected_text: string;
  proposed_fact_label: string;
  proposed_value: string;
  status: 'EXTRACTED' | 'DUPLICATE' | 'CONFLICT' | 'AMBIGUOUS' | 'UNREADABLE' | 'INSUFFICIENT_CONTEXT' | 'HUMAN_REVIEW_REQUIRED';
  extracted_fact_id?: string;
}

export interface DashboardLineageItem {
  component_id: string;
  component_name: string;
  route: string;
  metric: string;
  source_type: 'FACT_REGISTRY' | 'DERIVED_METRIC' | 'UNAVAILABLE_EMPTY_STATE';
  fact_id?: string;
  derived_metric_id?: string;
  status: 'CONNECTED' | 'EMPTY_STATE' | 'FLAGGED_MOCK';
  last_refresh: string;
  data_query: string;
}

export interface ReportLineageItem {
  report_id: string;
  workspace_id: string;
  report_type: string;
  generation_date: string;
  template_version: string;
  fact_ids_used: string[];
  derived_metric_ids_used: string[];
  source_block_ids_used: string[];
  ai_claims: { claim: string; supporting_fact_ids: string[]; verified: boolean }[];
  source_citations: string[];
}

export interface TenantRolePermission {
  role: 'ADMIN' | 'AUDITOR' | 'REVIEWER' | 'READ_ONLY';
  canReadFacts: boolean;
  canEditFacts: boolean;
  canApproveCandidates: boolean;
  canManageEntities: boolean;
  canManageFxRates: boolean;
  canRunRegressionSuite: boolean;
}

export interface TenantWorkspaceAccess {
  userId: string;
  userEmail: string;
  workspaceId: string;
  role: 'ADMIN' | 'AUDITOR' | 'REVIEWER' | 'READ_ONLY';
  grantedAt: string;
}

export interface RegressionTestCase {
  id: string;
  name: string;
  category: 'MULTI_DOC_INGESTION' | 'MULTILINGUAL_TRANSLATION' | 'MULTI_CURRENCY_FX' | 'CANDIDATE_BACKFILL' | 'RECONCILIATION_RULES' | 'SECURITY_ISOLATION';
  inputSummary: string;
  expectedOutcome: string;
  actualOutcome: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  executionTimeMs: number;
  details: string;
}

export interface RegressionSuiteRun {
  runId: string;
  workspaceId: string;
  executedAt: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  passRatePercentage: number;
  durationMs: number;
  testCases: RegressionTestCase[];
}

export interface LeadScheduleRow {
  factId: string;
  labelOriginal: string;
  labelNormalized: string;
  canonicalMetric: string;
  valueOriginal: string;
  originalCurrency: string;
  valueFunctional: string;
  functionalCurrency: string;
  pageNumber: number;
  documentTitle: string;
  sourceText: string;
  fxRateApplied?: number;
  verificationStatus: string;
  candidateState: string;
}

export interface LeadScheduleSection {
  sectionTitle: string;
  statementType: 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'CASH_FLOW' | 'FOOTNOTE_DISCLOSURES';
  rows: LeadScheduleRow[];
  totalFunctionalValue: number;
  currency: string;
}

export interface AuditMemorandum {
  memoId: string;
  workspaceId: string;
  generatedAt: string;
  preparedBy: string;
  title: string;
  executiveSummary: string;
  entityStructureSummary: string;
  currencyConversionSummary: string;
  reconciliationStatusSummary: string;
  materialDisclosuresSummary: string;
  findingsAndNotes: string[];
  signOffStatus: 'DRAFT' | 'REVIEWED' | 'APPROVED';
}

export interface DeliverablePackage {
  packageId: string;
  workspaceId: string;
  createdAt: string;
  leadSchedules: LeadScheduleSection[];
  auditMemorandum: AuditMemorandum;
  totalFactsCount: number;
  totalDocumentsCount: number;
  downloadUrl?: string;
}

export interface SystemHealthCheck {
  database_available: boolean;
  object_storage_available: boolean;
  gemini_api_available: boolean;
  openrouter_api_available: boolean;
  queue_available: boolean;
  workers_available: boolean;
  search_index_available: boolean;
  fact_registry_available: boolean;
  validation_engine_available: boolean;
  report_engine_available: boolean;
  last_check_timestamp: string;
}

export interface StaticMockScanResult {
  file_path: string;
  line_number: number;
  snippet: string;
  severity: 'HIGH_PRIORITY_PROTOTYPE_VAL' | 'MEDIUM_MOCK_ARRAY' | 'LOW_TEST_FIXTURE';
  description: string;
}

export type IngestionJobStage =
  | "DOCUMENT_REGISTERED"
  | "PAGE_INVENTORY_STARTED"
  | "PAGE_INVENTORY_COMPLETED"
  | "SOURCE_BLOCKS_INDEXED"
  | "PHYSICAL_EXTRACTION_IN_PROGRESS"
  | "PHYSICAL_EXTRACTION_COMPLETED"
  | "FINANCIAL_ANALYSIS_IN_PROGRESS"
  | "FINANCIAL_ANALYSIS_COMPLETED"
  | "GAP_ANALYSIS_COMPLETED"
  | "AUDIT_LINEAGE_VERIFIED"
  | "FINAL_RECONCILIATION_COMPLETED"
  | "WAITING_FOR_AI_CAPACITY"
  | "WAITING_FOR_DAILY_CAPACITY"
  | "INGESTION_FAILED";

export type IngestionJobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "WAITING_FOR_LLM"
  | "WAITING_FOR_AI_CAPACITY"
  | "WAITING_FOR_DAILY_CAPACITY"
  | "CONFIGURATION_REQUIRED"
  | "RATE_LIMITED"
  | "RECOVERING"
  | "COMPLETED"
  | "COMPLETED_WITH_WARNINGS"
  | "REVIEW_REQUIRED"
  | "FAILED"
  | "STALLED";

export interface StageRecord {
  stage: IngestionJobStage;
  status: "STARTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  timestamp: string;
  details?: string;
}

export interface ProcessingUnitRecord {
  unit_id: string;
  document_id: string;
  workspace_id: string;
  source_type: "PDF_PAGE" | "PDF_PAGE_RANGE" | "TABLE" | "NOTE" | "DOCX_SECTION" | "SPREADSHEET_RANGE" | "CSV_BATCH" | "IMAGE_PAGE";
  unit_type?: string;
  page_id?: string;
  physical_page_number?: number;
  actual_page_start: number;
  actual_page_end: number;
  section_id?: string;
  source_block_ids?: string[];
  status: "QUEUED" | "PROCESSING" | "WAITING_FOR_LLM" | "RATE_LIMITED" | "RETRYING" | "COMPLETED" | "COMPLETED_NO_FINANCIAL_FACTS" | "COMPLETED_WITH_WARNINGS" | "FAILED" | "FAILED_TERMINAL" | "REVIEW_REQUIRED" | "NO_TEXT";
  attempt_count: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  last_error?: string;
  textData: string;
}

export interface QueueJobRecord {
  id: string;
  workspaceId: string;
  intakeSessionId?: string;
  documentId: string;
  documentTitle: string;
  documentHash?: string;
  functionalCurrency: string;
  engineMode?: string;
  status: IngestionJobStatus;
  stage: IngestionJobStage;
  stageHistory: StageRecord[];
  currentStage: string;
  currentStageIndex?: number;
  totalStages?: number;
  progress: number;
  startedAt?: string;
  updatedAt: string;
  heartbeatAt: string;
  completedAt?: string;
  lastError?: string;
  unitsTotal: number;
  unitsCompleted: number;
  pagesTotal: number;
  pagesCompleted: number;
  tasksTotal: number;
  tasksCompleted: number;
  semanticTasksTotal?: number;
  semanticTasksCompleted?: number;
  semanticTasksFailed?: number;
  semanticTasksWaiting?: number;
  factsExtractedCount?: number;
  pagesProcessedCount?: number;
  entitiesDiscoveredCount?: number;
  attemptCount: number;
  nextRetryAt?: number;
  capacityAttemptNumber?: number;
  lastErrorType?: string;
  httpCode?: number;
  retryAfterMs?: number;
  circuitState?: string;
  lastSuccessfulStage?: string;
  processingUnits: ProcessingUnitRecord[];
  result?: {
    facts: ExtractedFact[];
    discrepancies: DiscrepancyItem[];
    agentLogs: AgentExecutionLog[];
    auditLogs: AuditTrailRecord[];
    executionTimeMs: number;
  };
  error?: string;
  createdAt: string;
}

export interface IntakeSessionFileRecord {
  filename: string;
  originalName: string;
  sha256: string;
  size: number;
  mimeType: string;
  filePath?: string;
  documentId: string;
  pageCount?: number;
}

export interface IntakeSessionRecord {
  id: string;
  targetProjectId?: string | null;
  userId?: string;
  userEmail?: string;
  engineMode?: string;
  uploadedFiles: IntakeSessionFileRecord[];
  documentIds: string[];
  queueJobIds: string[];
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'REVIEW_REQUIRED' | 'FAILED';
  progress: number;
  pagesTotal: number;
  pagesProcessed: number;
  factsFoundCount: number;
  entitiesDiscoveredCount: number;
  detectedEntities: Array<{
    id: string;
    name: string;
    legalName?: string;
    scope: string;
    entityType: 'PARENT' | 'SUBSIDIARY' | 'COUNTERPARTY';
    reportingCurrency?: string;
    jurisdiction?: string;
  }>;
  detectedReportingPeriods: string[];
  detectedCurrencies: string[];
  detectedStatements: string[];
  candidateRelationships: Array<{
    parentName: string;
    childName: string;
    relationshipType: string;
  }>;
  stagedFacts?: any[];
  stagedDocuments?: any[];
  stagedPageManifests?: any[];
  stagedSourceBlocks?: any[];
  warnings?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completionState: 'PENDING' | 'PROMOTED' | 'REVIEW_REQUIRED' | 'FAILED';
  promotedProjectId?: string | null;
  currentStageName?: string;
}

export type PhaseEReviewStatus =
  | 'AUTO_VERIFIED'
  | 'REVIEW_REQUIRED'
  | 'UNDER_REVIEW'
  | 'HUMAN_VERIFIED'
  | 'REJECTED'
  | 'INSUFFICIENT_EVIDENCE';

export interface MultidimensionalConfidence {
  extractionConfidence: number;
  semanticMetricConfidence: number;
  periodConfidence: number;
  currencyScaleConfidence: number;
  entityScopeConfidence: number;
  canonicalSelectionConfidence: number;
  accountingValidationConfidence: number;
  overallAggregateConfidence: number;
}

export interface HumanReviewOverrideRecord {
  id: string;
  reviewItemId: string;
  factId: string;
  reviewer: string;
  timestamp: string;
  reason: string;
  previousSelection: any;
  newSelection: any;
  action: 'HUMAN_VERIFIED' | 'REJECTED' | 'OVERRIDE_VALUE' | 'OVERRIDE_METRIC' | 'FLAG_INSUFFICIENT_EVIDENCE';
}

export interface HumanReviewItem {
  id: string;
  workspaceId: string;
  documentId: string;
  factId: string;
  triggerReason: 'AMBIGUOUS_FACT' | 'CONFLICTING_FACTS' | 'ACCOUNTING_DISCREPANCY' | 'INCOMPATIBLE_PERIOD' | 'INCOMPATIBLE_SCOPE' | 'UNCERTAIN_CURRENCY_SCALE' | 'FAILED_EXTRACTION' | 'MISSING_SOURCE_PAGE' | 'LOW_CONFIDENCE_SELECTION';
  status: PhaseEReviewStatus;
  description: string;
  originalFact: ExtractedFact;
  currentSelection: any;
  previousSelections: any[];
  reviewHistory: HumanReviewOverrideRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  workspaceId: string;
  documentId?: string;
  factId?: string;
  timestamp: string;
  eventType: 'EXTRACTION' | 'NORMALIZATION' | 'CANONICAL_SELECTION' | 'ACCOUNTING_VALIDATION' | 'RECONCILIATION' | 'DERIVED_CALCULATION' | 'REVIEW_CREATED' | 'HUMAN_OVERRIDE';
  actor: string;
  description: string;
  previousState?: any;
  newState?: any;
  metadata?: Record<string, any>;
}

export interface EvidenceRecord {
  factId: string;
  workspaceId: string;
  documentId: string;
  canonicalMetric: string;
  displayValue: string;
  normalizedValue: number | null;
  currency: string;
  scale: string;
  reportingPeriod: string;
  entityScope: string;
  reviewStatus: PhaseEReviewStatus;
  multidimensionalConfidence: MultidimensionalConfidence;
  lineage: {
    layer1_dashboardValue: string;
    layer2_canonicalMetric: { metric: string; selectionScore: number; reasoning: string };
    layer3_accountingValidation: { status: string; checksPassed: string[]; discrepancies: string[] };
    layer4_extractedFact: { id: string; labelOriginal: string; valueOriginal: string; currencyOriginal: string; unitScale: string; normalizedValue: number | null; extractionMethod: string };
    layer5_sourceDocument: { id: string; filename: string; sha256: string; status: string };
    layer6_physicalPage: { physicalPageNumber: number | null; existsInManifest: boolean };
    layer7_sourceLocation: { boundingBox?: any; tableRowIndex?: number; tableColIndex?: number; cellRange?: string; sourceText: string; contextSentence?: string };
  };
  evidenceValid: boolean;
  insufficientEvidenceReason?: string;
  auditEvents: AuditEvent[];
  reconciliationFindings: string[];
}

export type ReportingEligibilityStatus =
  | 'REPORT_READY'
  | 'REPORT_WITH_WARNING'
  | 'REVIEW_REQUIRED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'REJECTED';

export type ReportType =
  | 'FINANCIAL_STATEMENT'
  | 'MANAGEMENT_REPORT'
  | 'VARIANCE_REPORT'
  | 'FINANCIAL_HEALTH_REPORT'
  | 'AUDIT_SUPPORT'
  | 'BOOKKEEPING_REVIEW'
  | 'MONTHLY_CLOSE'
  | 'QUARTERLY_REPORT'
  | 'ANNUAL_REPORT'
  | 'MULTI_ENTITY';

export type ReportValidationStatus =
  | 'RECONCILED'
  | 'REVIEW_REQUIRED'
  | 'DISCREPANCY_DETECTED'
  | 'UNVERIFIED';

export type ReportConfidenceLevel =
  | 'HIGH_CONFIDENCE'
  | 'MEDIUM_CONFIDENCE'
  | 'LOW_CONFIDENCE'
  | 'HUMAN_VERIFIED'
  | 'REVIEW_REQUIRED';

export interface ReportMetric {
  id: string;
  canonicalMetric: string;
  originalLabel: string;
  displayLabel: string;
  value: number | null;
  displayValue: string;
  currency: string;
  unitScale: string;
  reportingPeriod: string;
  entityScope: string;
  factId: string;
  eligibilityStatus: ReportingEligibilityStatus;
  confidence: MultidimensionalConfidence;
  evidenceRef: EvidenceRecord | null;
  warnings: string[];
}

export interface ReportSection {
  id: string;
  title: string;
  metrics: ReportMetric[];
  subsections?: ReportSection[];
  subtotal: number | null;
  subtotalDisplay: string;
}

export interface ReportVariance {
  metricId: string;
  canonicalMetric: string;
  displayLabel: string;
  currentPeriod: string;
  comparativePeriod: string;
  currentValue: number;
  comparativeValue: number;
  absoluteVariance: number;
  percentageVariance: number | null;
  formattedAbsoluteVariance: string;
  formattedPercentageVariance: string;
  sourceFactIdCurrent: string;
  sourceFactIdComparative: string;
  derivedFactId: string;
  eligibilityStatus: ReportingEligibilityStatus;
  warnings: string[];
}

export interface ReportRatio {
  id: string;
  name: string;
  value: number | null;
  formattedValue: string;
  formula: string;
  numeratorMetric: string;
  denominatorMetric: string;
  numeratorFactId: string | null;
  denominatorFactId: string | null;
  reportingPeriod: string;
  currency: string;
  scope: string;
  timestamp: string;
  eligibilityStatus: ReportingEligibilityStatus;
  warnings: string[];
  evidenceRef?: EvidenceRecord | null;
}

export interface ReportException {
  id: string;
  type:
    | 'MISSING_METRIC'
    | 'PERIOD_MISMATCH'
    | 'CURRENCY_MISMATCH'
    | 'SCALE_UNCERTAINTY'
    | 'UNRECONCILED_BALANCE_SHEET'
    | 'CASH_FLOW_DISCREPANCY'
    | 'LOW_CONFIDENCE'
    | 'CONFLICTING_FACTS'
    | 'MISSING_SOURCE_PAGE'
    | 'HUMAN_REVIEW_REQUIRED'
    | 'INSUFFICIENT_EVIDENCE'
    | 'INCOMPATIBLE_SCOPE'
    | 'INCOMPATIBLE_PERIOD';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  factId?: string;
  metric?: string;
}

export interface ManagementObservation {
  id: string;
  type: 'CALCULATED_OBSERVATION';
  text: string;
  relatedMetric: string;
  sourceFactIds: string[];
  isAIGeneratedCausal: false;
}

export interface FinancialReport {
  id: string;
  workspaceId: string;
  companyId?: string;
  reportType: ReportType;
  title: string;
  reportingPeriod: string;
  comparativePeriod?: string;
  entityName: string;
  entityScope: string;
  currency: string;
  generatedAt: string;
  accountingValidationStatus: ReportValidationStatus;
  overallConfidenceLevel: ReportConfidenceLevel;
  incomeStatement?: {
    sections: ReportSection[];
    netIncome: number | null;
    netIncomeDisplay: string;
  };
  balanceSheet?: {
    assets: ReportSection;
    liabilities: ReportSection;
    equity: ReportSection;
    isReconciled: boolean;
    discrepancyAmount: number;
    status: ReportValidationStatus;
  };
  cashFlowStatement?: {
    operating: ReportSection;
    investing: ReportSection;
    financing: ReportSection;
    netChangeInCash: number | null;
    openingCash: number | null;
    closingCash: number | null;
    isReconciled: boolean;
  };
  variances: ReportVariance[];
  ratios: ReportRatio[];
  exceptions: ReportException[];
  observations: ManagementObservation[];
  factIdsUsed: string[];
  derivedFactIds: string[];
  version: string;
}

// ==========================================
// PHASE G — VARIANCE & FINANCIAL INTELLIGENCE ENGINE TYPES
// ==========================================

export type VarianceDirection = 'FAVORABLE' | 'UNFAVORABLE' | 'NEUTRAL';
export type MaterialityClassification = 'MATERIAL_CHANGE' | 'IMMATERIAL_CHANGE' | 'ANOMALOUS_CHANGE';

export interface MaterialityConfig {
  absoluteThreshold: number;
  percentageThreshold: number;
  anomalyPercentageThreshold: number;
  marginDeteriorationThresholdBps: number;
}

export interface VarianceAnalysisResult {
  metricId: string;
  canonicalMetric: string;
  displayLabel: string;
  currentPeriod: string;
  comparativePeriod: string;
  currentValue: number;
  comparativeValue: number;
  absoluteVariance: number;
  percentageVariance: number | null;
  formattedAbsoluteVariance: string;
  formattedPercentageVariance: string;
  direction: VarianceDirection;
  materiality: MaterialityClassification;
  sourceFactIdCurrent: string;
  sourceFactIdComparative: string;
  derivedFactId: string;
  evidenceLineageCurrent?: EvidenceRecord | null;
  evidenceLineageComparative?: EvidenceRecord | null;
  currency: string;
  entityScope: string;
  warnings: string[];
}

export interface TrendPoint {
  period: string;
  value: number;
  displayValue: string;
  factId: string;
  evidenceRef?: EvidenceRecord | null;
}

export interface MultiPeriodTrendResult {
  canonicalMetric: string;
  displayLabel: string;
  periods: string[];
  points: TrendPoint[];
  cagrPercentage: number | null;
  formattedCAGR: string;
  overallDirection: 'UPWARD' | 'DOWNWARD' | 'STABLE' | 'MIXED';
  hasMissingPeriod: boolean;
  missingPeriods: string[];
  currency: string;
  entityScope: string;
}

export interface RatioComparisonResult {
  id: string;
  ratioName: string;
  formula: string;
  currentPeriod: string;
  comparativePeriod: string;
  currentRatioValue: number | null;
  comparativeRatioValue: number | null;
  formattedCurrentRatio: string;
  formattedComparativeRatio: string;
  absoluteChange: number | null;
  basisPointChange: number | null;
  percentageChange: number | null;
  formattedChange: string;
  direction: 'IMPROVED' | 'DETERIORATED' | 'UNCHANGED' | 'N/A';
  materiality: MaterialityClassification;
  currency: string;
  scope: string;
  warnings: string[];
  evidenceRefCurrent?: EvidenceRecord | null;
  evidenceRefComparative?: EvidenceRecord | null;
}

export type FinancialAnomalyType =
  | 'LARGE_UNEXPLAINED_MOVEMENT'
  | 'MARGIN_DETERIORATION'
  | 'MARGIN_IMPROVEMENT'
  | 'REVENUE_PROFIT_DIVERGENCE'
  | 'ASSET_LIABILITY_ANOMALY'
  | 'CASH_FLOW_INCONSISTENCY'
  | 'ACCOUNTING_IDENTITY_CONFLICT'
  | 'PERIOD_CURRENCY_SCOPE_INCOMPATIBILITY';

export interface FinancialAnomaly {
  id: string;
  anomalyType: FinancialAnomalyType;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  metricKeys: string[];
  factIds: string[];
  reportingPeriod: string;
  comparativePeriod?: string;
  requiresHumanReview: boolean;
  reviewItemId?: string;
  evidenceLineageRefs: EvidenceRecord[];
}

export interface FinancialIntelligenceObservation {
  id: string;
  observationType: 'MATHEMATICAL_FACT' | 'CAUSAL_DISCLOSURE';
  text: string;
  causalSourceText?: string;
  hasDocumentedCausation: boolean;
  causalStatusText: string;
  relatedMetrics: string[];
  sourceFactIds: string[];
  evidenceLineageRefs: EvidenceRecord[];
}

export interface FinancialIntelligencePackage {
  id: string;
  workspaceId: string;
  reportingPeriod: string;
  comparativePeriods: string[];
  entityName: string;
  entityScope: string;
  currency: string;
  generatedAt: string;
  variances: VarianceAnalysisResult[];
  multiPeriodTrends: MultiPeriodTrendResult[];
  ratioComparisons: RatioComparisonResult[];
  anomalies: FinancialAnomaly[];
  observations: FinancialIntelligenceObservation[];
  exceptions: ReportException[];
  humanReviewItemsGenerated: HumanReviewItem[];
  factIdsUsed: string[];
}



