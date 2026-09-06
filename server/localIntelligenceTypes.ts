export type LocalTaskType =
  | 'STATEMENT_TYPE_CLASSIFICATION'
  | 'CANONICAL_ROW_MAPPING'
  | 'ENTITY_TYPE_CLASSIFICATION'
  | 'ENTITY_SCOPE_CLASSIFICATION'
  | 'MULTILINGUAL_ACCOUNTING_TERM_MAPPING'
  | 'DISCLOSURE_TYPE_CLASSIFICATION'
  | 'NOTE_RELEVANCE'
  | 'PERIOD_CONTEXT_CLASSIFICATION'
  | 'CURRENCY_CONTEXT_CLASSIFICATION'
  | 'AMBIGUITY_TRIAGE'
  | 'AI_ESCALATION_DECISION';

export type StatementTypeResult =
  | 'INCOME_STATEMENT'
  | 'BALANCE_SHEET'
  | 'CASH_FLOW_STATEMENT'
  | 'CHANGES_IN_EQUITY'
  | 'NOTES_AND_DISCLOSURES'
  | 'UNKNOWN';

export type EntityTypeResult =
  | 'CORPORATION'
  | 'SUBSIDIARY'
  | 'JOINT_VENTURE'
  | 'ASSOCIATE'
  | 'AUDIT_FIRM'
  | 'REGULATOR'
  | 'FINANCIAL_INSTITUTION'
  | 'INDIVIDUAL'
  | 'UNKNOWN';

export type EntityScopeResult =
  | 'PARENT_REPORTING_ENTITY'
  | 'CONSOLIDATED_SUBSIDIARY'
  | 'EQUITY_ACCOUNTED_INVESTEE'
  | 'EXTERNAL_PARTY'
  | 'DISCONTINUED_OPERATION'
  | 'UNKNOWN';

export type RoutingLevel = 0 | 1 | 2 | 3 | 4;

export type ResolutionStatus =
  | 'RESOLVED_DETERMINISTIC'
  | 'RESOLVED_LOCAL_QWEN'
  | 'RESOLVED_GEMINI'
  | 'WAITING_FOR_AI_CAPACITY'
  | 'REVIEW_REQUIRED';

export interface LocalTaskResult<T> {
  taskType: LocalTaskType;
  success: boolean;
  value: T;
  confidence: number; // 0.0 to 1.0
  latencyMs: number;
  model: string;
  source: 'LOCAL_QWEN' | 'DETERMINISTIC_FALLBACK' | 'CLOUD_ESCALATION' | 'UNRESOLVED_ESCALATED';
  routingLevel: RoutingLevel;
  resolutionStatus: ResolutionStatus;
  tokensUsed?: { prompt: number; completion: number };
  rawOutput?: string;
  escalationRequired?: boolean;
  escalationReason?: string;
}

export interface StatementTypeClassificationInput {
  sampleRows: string[];
  documentTitle?: string;
  headerClues?: string[];
}

export interface CanonicalRowMappingInput {
  rawRowLabel: string;
  statementType?: StatementTypeResult;
  currency?: string;
  surroundingRows?: string[];
}

export interface EntityClassificationInput {
  entityName: string;
  contextSnippet?: string;
  surroundingText?: string;
  documentTitle?: string;
}

export interface TermMappingInput {
  foreignTerm: string;
  sourceLanguage?: string;
  targetStandard?: 'IFRS' | 'US_GAAP';
}

export interface DisclosureClassificationInput {
  heading: string;
  excerpt: string;
}

export interface NoteRelevanceInput {
  noteTitle: string;
  noteExcerpt: string;
  targetFinancialArea: string;
}

export interface PeriodContextInput {
  rawPeriodString: string;
  contextHeader?: string;
}

export interface CurrencyContextInput {
  rawCurrencyString: string;
  documentJurisdiction?: string;
}

export interface AmbiguityTriageInput {
  issueDescription: string;
  competingValues: Array<{ source: string; value: string | number }>;
  statementContext?: string;
}

export interface EscalationDecisionInput {
  task: LocalTaskType;
  confidence: number;
  discrepancyAmount?: number;
  materialityThreshold?: number;
  reason: string;
}

export interface LocalIntelligenceTelemetry {
  deterministicTasks: number;
  localAITasks: number;
  localAIEscalated: number;
  GeminiTasks: number;
  localAIFailures: number;
  totalLatencyMs: number;
  averageLatencyMs: number;
  tasksByType: Record<string, number>;
  lastTaskAt?: string;
  activeConcurrency: number;
}
