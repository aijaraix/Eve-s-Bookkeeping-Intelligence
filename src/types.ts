// ==========================================
// CORE FRONTEND VIEW MODES & NAVIGATION
// ==========================================

export type ViewMode =
  | 'overview'
  | 'income_statement'
  | 'balance_sheet'
  | 'cash_flow'
  | 'equity'
  | 'notes_disclosures'
  | 'segment_analysis'
  | 'ratios'
  | 'hermes_swarm'
  | 'audit_findings'
  | 'evidence_registry'
  | 'corporate_structure'
  | 'documents'
  | 'deliverables'
  | 'diagnostics'
  | string;

export type ActiveView =
  | 'overview'
  | 'companies'
  | 'projects'
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
  | 'evidence-registry'
  | 'ai-deliverables'
  | 'firm-settings'
  | 'worker-diagnostics'
  | 'users-teams'
  | 'activity-log'
  | string;

// ==========================================
// USER, FIRM & AUTH TYPES
// ==========================================

export interface UserSession {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  organization?: string;
  pinCode?: string;
  isAuthenticated: boolean;
  avatar?: string;
  [key: string]: any;
}

export interface FirmBranding {
  firmName: string;
  partnerName: string;
  licenseNumber: string;
  address?: string;
  firmAddress?: string;
  opinionType?: string;
  [key: string]: any;
}

// ==========================================
// COMPANY, WORKSPACE & PROJECT TYPES
// ==========================================

export interface CompanyEntity {
  id: string;
  name: string;
  ticker?: string;
  reportingStandard?: 'IFRS' | 'US-GAAP' | string;
  currency?: string;
  scale?: 'units' | 'thousands' | 'millions' | 'billions' | string;
  fiscalYear?: string;
  auditStatus?: 'Clean Opinion' | 'Under Review' | 'Findings Detected' | string;
  verificationScore?: number;
  workspaceId?: string;
  country?: string;
  reporting?: string;
  healthScore?: number | string;
  status?: string;
  reg?: string;
  sector?: string;
  revenue?: number | string;
  netIncome?: number | string;
  assets?: number | string;
  activeProjectsCount?: number;
  [key: string]: any;
}

export type Company = CompanyEntity;

export interface Workspace {
  id: string;
  name: string;
  code?: string;
  country?: string;
  currency?: string;
  period?: string;
  createdAt?: string;
  updatedAt?: string;
  documentsCount?: number;
  factsCount?: number;
  status?: string;
  [key: string]: any;
}

export interface Project {
  id: string;
  workspaceId: string;
  companyId: string;
  companyName: string;
  name: string;
  ticker?: string;
  sector?: string;
  status?: string;
  reporting?: string;
  assignedLead?: string;
  facts: number;
  docsCount: number;
  startDate?: string;
  dueDate?: string;
  [key: string]: any;
}

// ==========================================
// FINANCIAL FACTS & SUMMARY TYPES
// ==========================================

export interface ExtractedFact {
  id: string;
  fact_id?: string;
  workspaceId?: string;
  workspace_id?: string;
  documentId?: string;
  document_id?: string;
  sourceDocument?: string;
  factType?: string;
  fact_type?: string;
  canonicalMetric?: string;
  canonical_metric?: string;
  metric?: string;
  labelOriginal?: string;
  labelNormalized?: string;
  original_label?: string;
  normalized_label?: string;
  valueOriginal?: string;
  original_value?: string;
  valueFunctional?: string;
  normalizedValue?: number;
  normalized_value?: number;
  currencyOriginal?: string;
  functionalCurrency?: string;
  currency?: string;
  unitScale?: string;
  scale?: string;
  reportingPeriod?: string;
  periodOriginal?: string;
  periodStart?: string;
  periodEnd?: string;
  fiscalYear?: string;
  periodType?: string;
  pageNumber?: number;
  sourceText?: string;
  rawText?: string;
  rawValue?: string;
  tableName?: string;
  statementName?: string;
  statementSection?: string;
  statementType?: string;
  status?: string;
  verificationStatus?: string;
  confidence?: number;
  extractionMethod?: string;
  continuingOrDiscontinued?: string;
  accountingRole?: string;
  normalizedSign?: number;
  sourcePresentationSign?: string;
  provenanceCoordinates?: any;
  [key: string]: any;
}

export interface FinancialFact {
  id: string;
  metric: string;
  label: string;
  value: number;
  formattedValue: string;
  rawString?: string;
  currency?: string;
  period?: string;
  periodType?: 'ANNUAL' | 'QUARTERLY' | string;
  statementType?: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'SEGMENT' | 'NOTE_DISCLOSURE' | string;
  pageNumber?: number;
  tableHeader?: string;
  scaleSource?: string;
  confidence?: number;
  status?: 'VERIFIED' | 'RECONCILED' | 'CONFLICT' | 'REVIEW_REQUIRED' | string;
  provenance?: {
    documentId?: string;
    documentTitle?: string;
    section?: string;
    snippet?: string;
    lineNumber?: number | string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface FinancialSummary {
  workspaceId?: string;
  currency?: string;
  revenue?: number | null;
  netIncome?: number | null;
  assets?: number | null;
  liabilities?: number | null;
  equity?: number | null;
  grossProfit?: number | null;
  operatingProfit?: number | null;
  validationPassRate?: number;
  hasValidatedFacts?: boolean;
  periods?: Array<{
    period: string;
    revenue?: number;
    netIncome?: number;
    revenueRaw?: number;
    netIncomeRaw?: number;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface StatementLineItem {
  id: string;
  label: string;
  level: number;
  isHeader?: boolean;
  isTotal?: boolean;
  values: Record<string, number | null>;
  noteRef?: string;
  confidence: number;
  sourceDoc?: string;
  page?: number;
  status: 'verified' | 'flagged' | 'reconciled';
}

// ==========================================
// DOCUMENTS & QUEUE INGESTION TYPES
// ==========================================

export interface DocumentRecord {
  id: string;
  workspaceId: string;
  filename: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  sha256?: string;
  status?: string;
  category?: string;
  language?: string;
  pageCount?: number;
  tablesCount?: number;
  factsCount?: number;
  uploadedAt?: string;
  createdAt?: string;
  url?: string;
  [key: string]: any;
}

export interface QueueJobStatus {
  id: string;
  documentTitle: string;
  fileSize: string;
  pagesTotal: number;
  pagesCompleted: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'WAITING_FOR_AI_CAPACITY' | string;
  currentStage: string;
  engineMode: 'STRUCTURED_OCR' | 'DEEP_PARSER' | 'HYBRID_GEMINI_NATIVE' | string;
  progress: number;
  factsExtracted: number;
  startedAt?: string;
  [key: string]: any;
}

export type QueueJobRecord = any;

export type IngestionJobStage =
  | 'INTAKE'
  | 'PARSING'
  | 'TABLE_EXTRACTION'
  | 'OCR'
  | 'FINANCIAL_CLASSIFICATION'
  | 'SWARM_VERIFICATION'
  | 'CANONICAL_RESOLVER'
  | 'COMPLETE'
  | string;

export type IngestionJobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'WAITING_FOR_AI_CAPACITY'
  | string;

export interface StageRecord {
  stage: IngestionJobStage;
  timestamp: string;
  durationMs?: number;
  status: string;
  details?: string;
  [key: string]: any;
}

export interface ProcessingUnitRecord {
  id?: string;
  unit_id?: string;
  status: string;
  progress?: number;
  createdAt?: string;
  [key: string]: any;
}

export interface IntakeSessionRecord {
  id: string;
  workspaceId?: string;
  targetProjectId?: string;
  files?: IntakeSessionFileRecord[];
  uploadedFiles?: IntakeSessionFileRecord[];
  status: string;
  createdAt?: string;
  [key: string]: any;
}

export interface IntakeSessionFileRecord {
  id?: string;
  filename?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  status?: string;
  [key: string]: any;
}

// ==========================================
// AUDIT, FINDINGS & HERMES SWARM TYPES
// ==========================================

export interface SwarmAgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'completed' | 'flagged';
  confidence: number;
  checksCount: number;
  discrepanciesFound: number;
  lastExecution: string;
  avatar: string;
}

export interface AuditFinding {
  id: string;
  title: string;
  severity?: 'critical' | 'material' | 'advisory' | 'resolved' | string;
  category?: 'Arithmetic' | 'Currency/Scale' | 'Presentation' | 'Footnote Mismatch' | 'Disclosure Gap' | 'Compliance' | 'Revenue' | string;
  statement?: string;
  affectedPeriods?: string[];
  discrepancyAmount?: number;
  impactDescription?: string;
  suggestedAction?: string;
  evidenceSource?: string;
  page?: number;
  resolved?: boolean;
  [key: string]: any;
}

export type HermesFinding = AuditFinding;

export interface EvidenceRecord {
  id?: string;
  factKey?: string;
  factId?: string;
  value?: number | string;
  period?: string;
  documentName?: string;
  pageNumber?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  extractedText?: string;
  authorityScore?: number;
  verificationAgent?: string;
  timestamp?: string;
  evidenceStatus?: string;
  [key: string]: any;
}

export interface DiscrepancyItem {
  id: string;
  type?: string;
  severity: string;
  description: string;
  factId?: string;
  expectedValue?: any;
  actualValue?: any;
  [key: string]: any;
}

export interface AgentExecutionLog {
  id?: string;
  agentId?: string;
  agentRole?: string;
  agentName?: string;
  startedAt?: string;
  timestamp?: string;
  completedAt?: string;
  status: string;
  findingsCount?: number;
  findings?: string[];
  discrepanciesFound?: number;
  executionTimeMs?: number;
  modelUsed?: string;
  inputSummary?: string;
  message?: string;
  [key: string]: any;
}

export interface AuditTrailRecord {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details?: any;
  [key: string]: any;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: string;
  userId?: string;
  details?: any;
  [key: string]: any;
}

export interface HumanReviewItem {
  id: string;
  factId?: string;
  reason?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED' | 'REVIEW_REQUIRED' | string;
  suggestedValue?: any;
  [key: string]: any;
}

export interface HumanReviewOverrideRecord {
  id: string;
  reviewItemId?: string;
  factId?: string;
  overrideValue?: any;
  overriddenBy?: string;
  overriddenAt?: string;
  notes?: string;
  [key: string]: any;
}

export type PhaseEReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISED' | 'AUTO_VERIFIED' | 'INSUFFICIENT_EVIDENCE' | 'REVIEW_REQUIRED' | string;

export interface MultidimensionalConfidence {
  overall?: number;
  optical?: number;
  semantic?: number;
  arithmetic?: number;
  lineage?: number;
  [key: string]: any;
}

export interface ProvenanceCoordinates {
  pageNumber: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  sourceText?: string;
  [key: string]: any;
}

// ==========================================
// CORPORATE GROUP & MULTI-ENTITY TYPES
// ==========================================

export interface CorporateEntity {
  id: string;
  workspaceId?: string;
  name?: string;
  legalName?: string;
  jurisdiction?: string;
  reportingCurrency?: string;
  entityType?: 'PARENT' | 'SUBSIDIARY' | 'JOINT_VENTURE' | 'OPERATING_UNIT' | 'SUPPLIER' | 'VENDOR' | string;
  ownershipPercentage?: number;
  scope?: string;
  taxId?: string;
  category?: string;
  spendOrRevenue?: number;
  criticalityRisk?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL_SINGLE_SOURCE' | string;
  notes?: string;
  [key: string]: any;
}

export interface EntityRelationship {
  id: string;
  workspaceId?: string;
  parentEntityId?: string;
  childEntityId?: string;
  relationshipType?: string;
  ownershipPercentage?: number;
  [key: string]: any;
}

export interface FxRateRecord {
  id?: string;
  sourceCurrency: string;
  targetCurrency: string;
  rate?: number;
  exchangeRate?: number;
  source?: string;
  rateSource?: string;
  effectiveDate?: string;
  asOfDate?: string;
  lastUpdated?: string;
  [key: string]: any;
}

export interface FxConversionMeta {
  sourceCurrency: string;
  targetCurrency: string;
  rate?: number;
  exchangeRate?: number;
  originalAmount?: number;
  functionalAmount?: number;
  effectiveDate?: string;
  rateSource?: string;
  convertedValue?: number;
  [key: string]: any;
}

// ==========================================
// BANK STATEMENT EXTRACTOR TYPES
// ==========================================

export interface BankTransaction {
  id?: string;
  date: string;
  description: string;
  amount: number;
  balance?: number;
  currency?: string;
  sourceBlock?: string;
  page?: number;
  [key: string]: any;
}

export interface BankAccountSummary {
  accountNumber?: string;
  bankName?: string;
  openingBalance?: number;
  closingBalance?: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
  currency?: string;
  period?: string;
  transactions?: BankTransaction[];
  [key: string]: any;
}

// ==========================================
// REPORTING & INTELLIGENCE ENGINE TYPES
// ==========================================

export type ReportingScopeType = 'CONSOLIDATED' | 'STANDALONE' | 'SEGMENT' | string;
export type PhaseH2VerificationState = 'UNVERIFIED' | 'PROVISIONALLY_VERIFIED' | 'VERIFIED' | 'RECONCILED';
export type PageClassificationType = 'FINANCIAL_STATEMENT' | 'NOTES' | 'AUDIT_OPINION' | 'NARRATIVE' | 'OTHER' | 'COVER' | 'INDEX' | 'FINANCIAL_TABLE' | 'NOTE_DISCLOSURE' | 'AUDITOR_REPORT' | 'MANAGEMENT_REPORT' | string;

export interface PageDiagnostics {
  pageNumber: number;
  textLength: number;
  tablesFound: number;
  classification: PageClassificationType;
  [key: string]: any;
}

export interface SixReliabilityLayersStatus {
  layer1FormatCheck: boolean;
  layer2StructureExtraction: boolean;
  layer3TableExtraction: boolean;
  layer4OcrCrossValidation: boolean;
  layer5SemanticClassification: boolean;
  layer6AuditEvidenceReconciliation: boolean;
}

export interface GeneralizedDocumentEntityModel {
  entityName?: string;
  identifiers?: string[];
  jurisdiction?: string;
  documentIssuer?: string;
  reportingEntity?: string;
  parentEntity?: string;
  workspaceEntity?: string;
  consolidationScope?: string;
  reportingScope?: string;
  referencedEntities?: any;
  evidenceText?: string;
  [key: string]: any;
}

export interface EntityEvidenceLineage {
  entity?: string;
  evidenceChain?: string[];
  canonical_entity_id?: string;
  canonical_entity_name?: string;
  legal_entity?: string;
  reporting_entity?: string;
  parent_entity?: string;
  consolidation_scope?: string;
  reporting_scope?: string;
  canonical_entity?: string;
  [key: string]: any;
}

export type ReportingEligibilityStatus = 'REPORT_READY' | 'REVIEW_REQUIRED' | 'REJECTED' | 'EXCLUDED' | 'INSUFFICIENT_EVIDENCE' | string;
export type ReportType = 'FULL_AUDIT' | 'EXECUTIVE_SUMMARY' | 'LEAD_SCHEDULE' | 'MANAGEMENT_LETTER' | string;
export type ReportValidationStatus = 'VALIDATED' | 'WITH_WARNINGS' | 'FAILED' | 'RECONCILED' | 'REVIEW_REQUIRED' | 'DISCREPANCY_DETECTED' | string;
export type ReportConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'HIGH_CONFIDENCE' | 'MEDIUM_CONFIDENCE' | 'LOW_CONFIDENCE' | 'REVIEW_REQUIRED' | string;

export interface ReportMetric {
  id?: string;
  metricKey?: string;
  canonicalMetric?: string;
  label?: string;
  originalLabel?: string;
  displayLabel?: string;
  value: number | null;
  displayValue?: string;
  currency: string;
  period?: string;
  reportingPeriod?: string;
  formattedValue?: string;
  unitScale?: string;
  [key: string]: any;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  metrics?: ReportMetric[];
  [key: string]: any;
}

export interface ReportVariance {
  metric?: string;
  metricId?: string;
  canonicalMetric?: string;
  displayLabel?: string;
  period1?: string;
  period2?: string;
  currentPeriod?: string;
  comparativePeriod?: string;
  currentValue?: number;
  comparativeValue?: number;
  amountChange?: number;
  percentChange?: number;
  absoluteVariance?: number;
  percentageVariance?: number;
  favorable?: boolean;
  [key: string]: any;
}

export interface ReportRatio {
  name: string;
  value: number;
  benchmark?: number;
  interpretation?: string;
  [key: string]: any;
}

export interface ReportException {
  id: string;
  type?: string;
  description?: string;
  message?: string;
  severity?: string;
  factId?: string;
  metric?: string;
  [key: string]: any;
}

export interface ManagementObservation {
  id: string;
  topic?: string;
  observation?: string;
  recommendation?: string;
  riskRating?: string;
  text?: string;
  type?: string;
  relatedMetric?: any;
  sourceFactIds?: any[];
  isAIGeneratedCausal?: boolean;
  [key: string]: any;
}

export interface FinancialReport {
  id: string;
  title: string;
  workspaceId: string;
  deliverableType?: string;
  reportType?: string;
  audience?: string;
  status?: string;
  generatedAt?: string;
  signedOffBy?: string;
  sections?: ReportSection[];
  metrics?: ReportMetric[];
  variances?: ReportVariance[];
  ratios?: ReportRatio[];
  exceptions?: ReportException[];
  observations?: ManagementObservation[];
  [key: string]: any;
}

// Materiality & Variance Analysis
export interface MaterialityConfig {
  absoluteThreshold: number;
  percentageThreshold: number;
  anomalyPercentageThreshold: number;
  [key: string]: any;
}

export type VarianceDirection = 'INCREASE' | 'DECREASE' | 'FLAT';
export type MaterialityClassification = 'MATERIAL' | 'IMMATERIAL' | 'NOTABLE';

export interface VarianceAnalysisResult {
  metric: string;
  absoluteVariance: number;
  percentageVariance: number;
  direction: VarianceDirection;
  isMaterial: boolean;
  classification: MaterialityClassification;
  [key: string]: any;
}

export interface TrendPoint {
  period: string;
  value: number;
  [key: string]: any;
}

export interface MultiPeriodTrendResult {
  metric: string;
  points: TrendPoint[];
  cagr?: number;
  trendDirection: string;
  [key: string]: any;
}

export interface RatioComparisonResult {
  ratioName: string;
  currentValue: number;
  priorValue?: number;
  change: number;
  [key: string]: any;
}

export type FinancialAnomalyType = 'SIGN_REVERSAL' | 'UNUSUAL_SPIKE' | 'MATHEMATICAL_DISCREPANCY' | 'MISSING_PERIOD';

export interface FinancialAnomaly {
  type: FinancialAnomalyType;
  description: string;
  affectedMetric: string;
  severity: string;
  [key: string]: any;
}

export interface FinancialIntelligenceObservation {
  id: string;
  category: string;
  insight: string;
  impact: string;
  [key: string]: any;
}

export interface FinancialIntelligencePackage {
  variances: VarianceAnalysisResult[];
  trends: MultiPeriodTrendResult[];
  ratios: RatioComparisonResult[];
  anomalies: FinancialAnomaly[];
  observations: FinancialIntelligenceObservation[];
  [key: string]: any;
}

// Diagnostics Records
export interface PageManifestRecord {
  pageNumber?: number;
  nativeTextAvailable?: boolean;
  factsCount?: number;
  tablesCount?: number;
  [key: string]: any;
}

export interface SourceBlockRecord {
  id?: string;
  pageNumber?: number;
  text?: string;
  snippet?: string;
  [key: string]: any;
}

export interface TableInspectorRecord {
  id?: string;
  pageNumber?: number;
  rowCount?: number;
  colCount?: number;
  headers?: string[];
  [key: string]: any;
}

export interface DerivedMetricRecord {
  metric?: string;
  formula?: string;
  calculatedValue?: number;
  [key: string]: any;
}

export interface ValidationRuleResult {
  ruleId?: string;
  ruleName?: string;
  passed?: boolean;
  validation_id?: string;
  workspace_id?: string;
  rule_name?: string;
  formula?: string;
  input_fact_ids?: string[];
  expected_result?: any;
  actual_result?: any;
  variance?: number;
  variance_pct?: number;
  status?: string;
  reason?: string;
  timestamp?: string;
  details?: string;
  [key: string]: any;
}

export interface FactConflictRecord {
  id?: string;
  conflict_id?: string;
  workspace_id?: string;
  canonical_metric?: string;
  reporting_period?: string;
  candidates?: any[];
  classification?: string;
  resolution_note?: string;
  factId1?: string;
  factId2?: string;
  metric?: string;
  conflictType?: string;
  [key: string]: any;
}

export interface AdditionalFactOpportunity {
  id?: string;
  opportunity_id?: string;
  document_id?: string;
  page_number?: number;
  category?: string;
  detected_text?: string;
  proposed_fact_label?: string;
  proposed_value?: string;
  status?: string;
  extracted_fact_id?: string;
  metric?: string;
  suggestedLocation?: string;
  [key: string]: any;
}

export interface DashboardLineageItem {
  metric: string;
  lineageChain: string[];
  [key: string]: any;
}

export interface ReportLineageItem {
  sectionId: string;
  factIds: string[];
  [key: string]: any;
}

export interface SystemHealthCheck {
  service: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latencyMs?: number;
  message?: string;
  [key: string]: any;
}

export interface StaticMockScanResult {
  clean: boolean;
  detections: Array<{
    file_path: string;
    line_number: number;
    snippet: string;
    severity: string;
    description: string;
  }>;
}

export interface FactCandidate {
  metric?: string;
  value?: number;
  id?: string;
  workspaceId?: string;
  documentId?: string;
  proposedLabel?: string;
  canonicalMetric?: string;
  proposedValue?: number;
  currency?: string;
  candidateState?: string;
  candidateSource?: string;
  [key: string]: any;
}

export interface AccountingReconciliationRule {
  id: string;
  name?: string;
  formula?: string;
  ruleCode?: string;
  ruleName?: string;
  statementA?: string;
  metricA?: string;
  statementB?: string;
  metricB?: string;
  tolerance?: number;
  status?: string;
  variance?: number;
  explanation?: string;
  [key: string]: any;
}

export interface LLMGatewayRequest {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  model?: string;
  [key: string]: any;
}

export interface LLMGatewayResponse {
  text?: string;
  content?: any;
  model?: string;
  modelUsed?: string;
  provider?: string;
  latencyMs?: number;
  executionTimeMs?: number;
  tokensUsed?: any;
  usage?: any;
  retryCount?: number;
  providerAttemptHistory?: any[];
  [key: string]: any;
}

export interface TenantRolePermission {
  role: string;
  permissions?: string[];
  canReadFacts?: boolean;
  canExportReports?: boolean;
  canMutateWorkspaces?: boolean;
  canApproveDeliverables?: boolean;
  canTriggerSwarm?: boolean;
  canOverrideEvidence?: boolean;
  [key: string]: any;
}

export interface TenantWorkspaceAccess {
  workspaceId: string;
  userId?: string;
  userEmail?: string;
  role: 'AUDITOR' | 'READ_ONLY' | 'ADMIN' | 'REVIEWER';
  [key: string]: any;
}

export interface RegressionTestCase {
  id: string;
  title?: string;
  name?: string;
  category?: string;
  inputSummary?: string;
  expectedOutcome?: string;
  actualOutcome?: string;
  expectedResult?: any;
  status?: string;
  executionTimeMs?: number;
  details?: string;
  [key: string]: any;
}

export interface RegressionSuiteRun {
  runId: string;
  workspaceId?: string;
  passed?: number;
  failed?: number;
  total?: number;
  passedCount?: number;
  failedCount?: number;
  skippedCount?: number;
  totalTests?: number;
  passRatePercentage?: number;
  durationMs?: number;
  executedAt?: string;
  testCases?: RegressionTestCase[];
  results?: any[];
  [key: string]: any;
}

export interface LeadScheduleSection {
  title?: string;
  sectionTitle?: string;
  rows: LeadScheduleRow[];
  totalValue?: number;
  [key: string]: any;
}

export interface LeadScheduleRow {
  accountName?: string;
  accountNumber?: string;
  balance?: number;
  adjustment?: number;
  finalBalance?: number;
  reference?: string;
  factId?: string;
  valueFunctional?: string | number;
  [key: string]: any;
}

export interface AuditMemorandum {
  id?: string;
  memoId?: string;
  title?: string;
  author?: string;
  date?: string;
  subject?: string;
  memoBody?: string;
  conclusion?: string;
  [key: string]: any;
}

export interface DeliverablePackage {
  id?: string;
  packageId?: string;
  workspaceId: string;
  title?: string;
  schedules?: LeadScheduleSection[];
  memorandum?: AuditMemorandum;
  generatedAt?: string;
  [key: string]: any;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: { source: string; page: number; fact: string }[];
}
