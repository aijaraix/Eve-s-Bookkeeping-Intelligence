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
  rateSource: 'ECB' | 'FED' | 'USER_OVERRIDE' | 'EXTRACTED_NOTES';
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
  rowLabel?: string;
  source_row?: string;
  columnLabel?: string;
  source_column?: string;

  // Provenance Location
  pageNumber: number;
  source_page?: number;
  tableName?: string;
  source_table?: string;
  sourceText: string;
  rawText?: string;
  source_context?: string;
  sourceDocument?: string;

  // Values & Scale (Crucial: never destroy raw value!)
  valueOriginal: string;
  raw_value?: string;
  rawValue?: string;
  valueFunctional: string;
  normalizedValue?: number;
  normalized_value?: number;
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
  status: 'BALANCED' | 'VARIANCE_DETECTED' | 'MISSING_DATA';
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
  entityType: 'PARENT' | 'SUBSIDIARY' | 'JOINT_VENTURE' | 'AFFILIATE' | 'OPERATING_UNIT';
  ownershipPercentage: number;
  scope: 'Consolidated' | 'Parent Only' | 'Subsidiary';
  taxId?: string;
  notes?: string;
  createdAt: string;
}

export interface EntityRelationship {
  id: string;
  workspaceId: string;
  parentEntityId: string;
  childEntityId: string;
  relationshipType: 'PARENT_OF' | 'SUBSIDIARY_OF' | 'OWNS' | 'JOINT_VENTURE';
  ownershipPercentage: number;
  effectiveDate?: string;
  consolidationMethod: 'FULL' | 'EQUITY' | 'PROPORTIONAL' | 'NONE';
}

export interface FxRateRecord {
  id: string;
  sourceCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  effectiveDate: string;
  rateSource: 'ECB' | 'FED' | 'USER_OVERRIDE' | 'EXTRACTED_NOTES' | 'BOE' | 'BOJ';
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
  netInvestingCashFlow?: string;
  netFinancingCashFlow?: string;
  freeCashFlow: string;
  operatingMarginPct?: string;
  underlyingOperatingMarginPct?: string;
  currency: string;
  period: string;
  validationPassRate: string;
  averageConfidence: string;
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
  grossMarginPct?: string;
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
  category: 'MULTI_DOC_INGESTION' | 'MULTILINGUAL_TRANSLATION' | 'MULTI_CURRENCY_FX' | 'CANDIDATE_BACKFILL' | 'RECONCILIATION_RULES';
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

