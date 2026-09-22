import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { hermesJobDispatchService, SwarmExecutionSummary } from './hermesJobDispatchService.js';
import { deliverableArtifactService, DeliverableArtifactRecord } from './deliverableArtifactService.js';
import { eveInternalAuditEngine } from './eveInternalAuditEngine.js';
import { academyMinervaLab } from './academyMinervaLab.js';
import { disclosureEvidenceLedgerService } from './disclosureEvidenceLedgerService.js';
import { deriveTrialBalanceRuntimeEvidenceFromPhysicalSource, type TrialBalanceRuntimeEvidence } from './trialBalanceRuntimeAdapter.js';

export const VERIFIED_CONTINUATION_LOGIC_VERSION = 'v10-post-reprocess-deduplicated-lineage';

export type VerifiedContinuationStatus =
  | 'READY_FROM_VERIFIED_EXTRACTION'
  | 'SPECIALIST_SWARM_RUNNING'
  | 'SPECIALIST_SWARM_COMPLETE'
  | 'AWAITING_UI_DRAFT_REQUEST'
  | 'DELIVERABLE_GENERATED_READY_FOR_HUMAN_REVIEW'
  | 'INTERNAL_TRUTH_AUDIT_COMPLETE'
  | 'MINERVA_TECHNICAL_VALIDATION_COMPLETE'
  | 'READY_FOR_AUTHORIZED_HUMAN_REVIEW'
  | 'READY_FOR_AUTHORIZED_HUMAN_REVIEW_WITH_SYSTEM_FINDINGS'
  | 'BLOCKED_NO_PROOF_COMPLETE_FACTS'
  | 'BLOCKED_CURRENCY_CONFLICT'
  | 'BLOCKED_ACCOUNTING_IDENTITY'
  | 'BLOCKED_TECHNICAL_VALIDATION'
  | 'BLOCKED_SYSTEM_ERROR';

export interface VerifiedContinuationState {
  continuationId: string;
  logicVersion?: string;
  previousStatus?: VerifiedContinuationStatus;
  jobId: string;
  jobAttempt: number;
  sourceSha256: string;
  workspaceId: string;
  documentId: string;
  engagementId: string;
  status: VerifiedContinuationStatus;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  clientName?: string;
  fiscalYear?: string;
  reportingCurrency?: string;
  proofCompleteFactsCount?: number;
  factDigestSha256?: string;
  disclosureEvidence?: any;
  euclidBalance?: { assets: number; liabilities: number; equity: number; variance: number };
  specialistSummary?: any;
  deliverable?: any;
  internalTruthAudit?: any;
  minervaLiveValidation?: any;
  systemFindings?: string[];
  reviewFindings?: string[];
  trialBalanceQualification?: string;
  trialBalanceReview?: any;
  error?: string;
  specialistRetryId?: string;
}

function upper(v: any): string {
  return String(v ?? '').trim().toUpperCase();
}

export function isProofCompleteFact(fact: any): boolean {
  return upper(fact?.status) === 'APPROVED' &&
    upper(fact?.verificationStatus || fact?.verification_status) === 'VERIFIED' &&
    upper(fact?.evidenceStatus || fact?.evidence_status) === 'CONFIRMED' &&
    Boolean(fact?.documentId || fact?.document_id) &&
    Boolean(String(fact?.sourceText || fact?.source_text || '').trim());
}

export function formatUncertainty(u: any): string {
  if (u === null || u === undefined) return '';
  if (typeof u === 'string') return u;
  if (typeof u === 'number' || typeof u === 'boolean') return String(u);
  if (typeof u === 'object') {
    if (u.topic && u.description) return `[${u.topic}] ${u.description}`;
    if (u.description) return String(u.description);
    if (u.topic) return String(u.topic);
    if (u.text) return String(u.text);
    if (u.message) return String(u.message);
    try {
      return JSON.stringify(u);
    } catch {
      return String(u);
    }
  }
  return String(u);
}

export function selectProofCompleteFacts(facts: any[], workspaceId: string): any[] {
  return (facts || []).filter(f => (f.workspaceId === workspaceId || f.workspace_id === workspaceId) && isProofCompleteFact(f));
}

export function mapProofFactToDeliverableFact(f: any, document: any, job: any): any {
  return {
    id: f.id,
    canonicalMetric: f.canonicalMetric || f.labelNormalized,
    label: f.labelOriginal || f.labelNormalized,
    value: numericFactValue(f) || 0,
    statement: f.statementType,
    sourceDoc: document?.filename || job.documentTitle,
    documentId: f.documentId || f.document_id,
    page: f.pageNumber,
    verificationStatus: f.verificationStatus,
    evidenceStatus: f.evidenceStatus,
    factState: f.status,
    unitScale: f.unitScale,
    normalizedScaleMultiplier: f.normalizedScaleMultiplier,
    reportingPeriod: f.reportingPeriod || 'NOT_RECORDED',
    sourceText: String(f.sourceText || f.source_text || ''),
    sourceBlockIds: f.sourceBlockIds || (f.sourceBlockId ? [f.sourceBlockId] : []),
    sourceSha256: f.sourceSha256 || f.provenance?.sourceSha256 || job.documentHash,
    sourceArtifactId: f.sourceArtifactId || f.provenance?.sourceArtifactId,
    sourceProvenanceId: f.sourceProvenanceId || f.provenance?.sourceProvenanceId,
    sourceProvenanceIds: f.sourceProvenanceIds || f.provenance?.sourceProvenanceIds || [],
    sourceCoordinate: f.sourceCoordinate || f.provenance?.sourceCoordinate,
    sourceCoordinates: f.sourceCoordinates || f.provenanceCoordinates || f.provenance?.provenanceCoordinates || [],
    sourceConfidence: f.sourceConfidence ?? f.confidence ?? f.provenance?.ocrConfidence,
    sourceExtractionMethod: f.sourceExtractionMethod || f.extractionMethod || f.extractionEngine || f.provenance?.ocrEngine,
    sourceExtractionVersion: f.sourceExtractionVersion || f.provenance?.ocrEngineVersion
  };
}

export function shouldRecoverPersistedEvidenceBlock(prior: VerifiedContinuationState | null, job: any, facts: any[]): boolean {
  const persistedProofFacts = selectProofCompleteFacts(facts || [], job.workspaceId);
  if (prior?.status === 'BLOCKED_NO_PROOF_COMPLETE_FACTS') return persistedProofFacts.length > 0;
  if (prior?.status !== 'BLOCKED_ACCOUNTING_IDENTITY') return false;
  const persistedFiscalYear = deriveFiscalYear(persistedProofFacts);
  const persistedBalance = persistedFiscalYear ? deriveCurrentBalance(persistedProofFacts, persistedFiscalYear) : null;
  return Boolean(persistedBalance && persistedBalance.variance <= 0.01);
}

export function shouldInvalidateReadyContinuation(prior: VerifiedContinuationState | null, job: any, facts: any[]): boolean {
  if (!prior?.status?.startsWith('READY_FOR_AUTHORIZED_HUMAN_REVIEW') || !prior.deliverable?.reportId) return false;
  const proofFacts = selectProofCompleteFacts(facts || [], job.workspaceId);
  const year = deriveFiscalYear(proofFacts);
  if (!year) return false;
  const balanceKeys = new Set(['totalassets','assets','totalliabilities','liabilities','totalequity','totalshareholdersequity','totalstockholdersequity','equityincludingnoncontrollinginterest','stockholdersequityincludingportionattributabletononcontrollinginterest']);
  const groups = new Map<string, Set<number>>();
  for (const fact of proofFacts) {
    if (String(factYear(fact) || '') !== year || !String(fact?.statementType || '').toUpperCase().includes('BALANCE_SHEET')) continue;
    const key = metricKey(fact);
    if (!balanceKeys.has(key)) continue;
    const value = numericFactValue(fact);
    if (value === null) continue;
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key)!.add(value);
  }
  return [...groups.values()].some(values => values.size > 1);
}

function metricKey(f: any): string {
  return String(f?.canonicalMetric || f?.canonical_metric || f?.labelNormalized || f?.labelOriginal || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function yearsIn(value: any): number[] {
  // Accounting periods are commonly serialized both as "FY 2026" and
  // "FY2026".  A leading word boundary rejects the latter because the Y and
  // 2 are both word characters.  Bound only on adjacent digits so embedded
  // identifiers remain excluded while compact fiscal-year tokens are valid.
  return [...String(value || '').matchAll(/(?<!\d)(20\d{2})(?!\d)/g)].map(m => Number(m[1]));
}

function factYear(f: any): number | null {
  const reportingYears = yearsIn(f?.reportingPeriod);
  if (reportingYears.length) return Math.max(...reportingYears);
  const fallbackYears = [...yearsIn(f?.periodEnd), ...yearsIn(f?.periodStart)];
  return fallbackYears.length ? Math.max(...fallbackYears) : null;
}

export function deriveFiscalYear(facts: any[]): string | null {
  const years = (facts || []).map(factYear).filter((v): v is number => Number.isFinite(v as number));
  return years.length ? String(Math.max(...years)) : null;
}

function numericFactValue(f: any): number | null {
  const value = typeof f?.normalizedValue === 'number' ? f.normalizedValue : Number(f?.valueFunctional ?? f?.normalized_value);
  return Number.isFinite(value) ? value : null;
}

function uniqueMetricValue(facts: any[], keys: string[], fiscalYear: string): number | null {
  const wanted = new Set(keys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, '')));
  const candidates = (facts || []).filter(f => {
    const statement = upper(f?.statementType || f?.statement_type);
    const year = factYear(f);
    return statement.includes('BALANCE_SHEET') && String(year || '') === fiscalYear && wanted.has(metricKey(f));
  });
  const values = [...new Set(candidates.map(numericFactValue).filter((v): v is number => v !== null))];
  return values.length === 1 ? values[0] : null;
}

export function deriveCurrentBalance(facts: any[], fiscalYear: string): { assets: number; liabilities: number; equity: number; variance: number } | null {
  const assets = uniqueMetricValue(facts, ['assets', 'totalAssets', 'total_assets'], fiscalYear);
  const liabilities = uniqueMetricValue(facts, ['liabilities', 'totalLiabilities', 'total_liabilities'], fiscalYear);
  const equity = uniqueMetricValue(facts, [
    'stockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
    'totalEquity',
    'total_equity',
    'totalShareholdersEquity',
    'totalStockholdersEquity',
    'equityIncludingNoncontrollingInterest'
  ], fiscalYear);
  if (assets === null || liabilities === null || equity === null) return null;
  return { assets, liabilities, equity, variance: Math.abs(assets - (liabilities + equity)) };
}

export function buildVerifiedFactDigest(facts: any[]): any[] {
  return (facts || []).map(f => ({
    id: f.id,
    canonicalMetric: f.canonicalMetric || f.canonical_metric,
    label: f.labelOriginal || f.labelNormalized,
    value: numericFactValue(f),
    currency: upper(f.functionalCurrency || f.currencyOriginal || f.currency),
    period: f.reportingPeriod,
    statementType: f.statementType || f.statement_type,
    reportingScope: f.reportingScope || f.reporting_scope,
    reportingEntity: f.reportingEntity || f.reporting_entity,
    documentId: f.documentId || f.document_id,
    page: f.pageNumber || f.page,
    verificationStatus: upper(f.verificationStatus || f.verification_status),
    evidenceStatus: upper(f.evidenceStatus || f.evidence_status),
    sourceSnippet: String(f.sourceText || f.source_text || '').slice(0, 180)
  }));
}

function countDiscoveredAccounts(facts: any[]) {
  const balanceFacts = (facts || []).filter(f => upper(f.statementType || f.statement_type).includes('BALANCE_SHEET'));
  const text = (f: any) => `${f.factType || ''} ${f.canonicalMetric || ''} ${f.labelOriginal || ''}`.toLowerCase();
  return {
    assetAccountsCount: balanceFacts.filter(f => /asset|cash|receiv|inventor|investment|goodwill|property|equipment/.test(text(f))).length,
    liabilityAccountsCount: balanceFacts.filter(f => /liabil|debt|borrow|payable|accrued/.test(text(f))).length,
    equityAccountsCount: balanceFacts.filter(f => /equity|stock|capital|retained|treasury/.test(text(f))).length
  };
}

export function loadPersistedAdjudicationLineage(workspaceId: string, facts: any[]): any | undefined {
  const root = path.join(process.cwd(), 'storage', 'cpa_memory');
  const clarificationPath = path.join(root, 'clarifications', 'clarification_requests.json');
  const decisionsDir = path.join(root, 'task_sufficiency');
  if (!fs.existsSync(clarificationPath) || !fs.existsSync(decisionsDir)) return undefined;
  const clarificationPayload = JSON.parse(fs.readFileSync(clarificationPath, 'utf8'));
  const clarifications = (Array.isArray(clarificationPayload) ? clarificationPayload : clarificationPayload.clarifications || [])
    .filter((c: any) => c.projectId === workspaceId && c.status === 'RESOLVED' && c.response);
  const decisions = fs.readdirSync(decisionsDir).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(decisionsDir, f), 'utf8')))
    .filter((d: any) => d.task?.workspaceId === workspaceId && (d.allowedConclusionIds || []).length > 0)
    .sort((a: any, b: any) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const decision = decisions.at(-1);
  if (!decision) return undefined;
  const clarification = clarifications.find((c: any) => (decision.evidenceRefs || []).includes(`clarification:${c.requestId}`));
  if (!clarification) return undefined;
  const refs = decision.evidenceRefs || [];
  const documentIds = refs.filter((r: string) => r.startsWith('document:')).map((r: string) => r.slice(9));
  const sourceShas = refs.filter((r: string) => r.startsWith('sha256:')).map((r: string) => r.slice(7));
  const evidence = documentIds.map((documentId: string, index: number) => {
    const related = facts.filter((f: any) => (f.documentId || f.document_id) === documentId);
    return {
      role: index === documentIds.length - 1 ? 'RESOLVING_SOURCE' : `CONFLICT_SOURCE_${String.fromCharCode(65 + index)}`,
      documentId,
      sourceSha256: sourceShas[index] || related.find((f: any) => f.sourceSha256)?.sourceSha256,
      provenanceIds: [...new Set(related.flatMap((f: any) => [f.sourceProvenanceId, ...(f.sourceProvenanceIds || [])]).filter(Boolean))],
      sourceBlockIds: [...new Set(related.flatMap((f: any) => [f.sourceBlockId, ...(f.sourceBlockIds || [])]).filter(Boolean))],
      locator: related.map((f: any) => f.sourceCoordinate || f.sourceCoordinates?.[0]).filter(Boolean)[0] || 'PERSISTED_SOURCE_DOCUMENT'
    };
  });
  return {
    conflictId: `conflict:${decision.task?.taskId || decision.decisionId}`,
    gapId: clarification.sufficiencyLink?.gapIds?.[0],
    clarificationId: clarification.requestId,
    affectedConclusionId: decision.allowedConclusionIds?.[0],
    finalStatus: decision.conclusionAssessments?.[0]?.state || 'ALLOWED',
    clarificationResponse: clarification.response?.narrativeExplanation,
    responseAloneCleared: false,
    finalDecisionId: decision.decisionId,
    finalDecisionHash: decision.decisionHash,
    evidence
  };
}


export async function deriveContinuationTrialBalanceEvidence(job: any, document: any): Promise<TrialBalanceRuntimeEvidence> {
  const sourceFilePath=String(job?.filePath || document?.filePath || document?.url || '');
  const filename=String(document?.originalName || document?.filename || job?.documentTitle || (sourceFilePath ? path.basename(sourceFilePath) : ''));
  const mimeType=String(document?.mimeType || job?.mimeType || '');
  const expectedSourceSha256=String(job?.documentHash || document?.sha256 || '');
  const runtime=await deriveTrialBalanceRuntimeEvidenceFromPhysicalSource({sourceFilePath,expectedSourceSha256,filename,mimeType,currency:job?.functionalCurrency});
  const workerReview=job?.result?.trialBalanceReview || job?.results?.trialBalanceReview;
  if (workerReview) {
    if (runtime.qualification !== 'QUALIFIED_TRIAL_BALANCE' || !runtime.review) throw new Error('TRIAL_BALANCE_WORKER_CONTINUATION_MISMATCH');
    const same = workerReview.sourceSha256 === runtime.review.sourceSha256 && workerReview.status === runtime.review.status &&
      Number(workerReview.totalDebits) === runtime.review.totalDebits && Number(workerReview.totalCredits) === runtime.review.totalCredits &&
      Number(workerReview.variance) === runtime.review.variance && workerReview.formulaIntegrityStatus === runtime.review.formulaIntegrityStatus;
    if (!same) throw new Error('TRIAL_BALANCE_WORKER_CONTINUATION_MISMATCH');
  }
  return runtime;
}

function compactSwarm(summary: SwarmExecutionSummary): any {
  return {
    engagementId: summary.engagementId,
    clientName: summary.clientName,
    totalJobsExecuted: summary.totalJobsExecuted,
    allJobsSucceeded: summary.allJobsSucceeded,
    euclidVarianceUsd: summary.euclidVarianceUsd,
    euclidEquationBalanced: summary.euclidEquationBalanced,
    pbcItemsCleared: summary.pbcItemsCleared,
    pbcStatus: summary.pbcStatus,
    qualityReviewApproved: summary.qualityReviewApproved,
    jobs: summary.jobs.map(j => ({
      agentExecutionId: j.agentExecutionId,
      agentId: j.agentId,
      roleExecutionClass: j.roleExecutionClass,
      executionMechanism: j.executionMechanism,
      status: j.status,
      modelCallStatus: j.modelCallStatus,
      outputValidationStatus: j.outputValidationStatus,
      proofLevel: j.proofLevel,
      proofState: j.proofState,
      provenance: j.provenance,
      findings: j.findings,
      uncertainties: j.uncertainties,
      outputManifest: j.outputManifest,
      persistedArtifactPath: j.persistedArtifactPath
    })),
    executedAt: summary.executedAt
  };
}

export class VerifiedCustomerContinuationService {
  private static instance: VerifiedCustomerContinuationService | null = null;
  private readonly storageDir = path.join(process.cwd(), 'storage', 'cpa_memory', 'verified_customer_continuations');
  private readonly activeJobs = new Set<string>();

  private constructor() {
    fs.mkdirSync(this.storageDir, { recursive: true });
  }

  public static getInstance(): VerifiedCustomerContinuationService {
    if (!VerifiedCustomerContinuationService.instance) {
      VerifiedCustomerContinuationService.instance = new VerifiedCustomerContinuationService();
    }
    return VerifiedCustomerContinuationService.instance;
  }

  private continuationId(jobId: string): string {
    return `CONT-${crypto.createHash('sha256').update(jobId).digest('hex').slice(0, 16)}`;
  }

  private engagementId(jobId: string): string {
    return `eng-customer-${crypto.createHash('sha256').update(jobId).digest('hex').slice(0, 16)}`;
  }

  private reportId(jobId: string): string {
    return `REP-CUSTOMER-${crypto.createHash('sha256').update(jobId).digest('hex').slice(0, 12)}`;
  }

  private statePath(jobId: string): string {
    return path.join(this.storageDir, `${crypto.createHash('sha256').update(jobId).digest('hex')}.json`);
  }

  private draftRequestIdentity(job: any) {
    return { jobId: job.id, workspaceId: job.workspaceId, documentId: job.documentId,
      attempt: Number(job.attemptCount || 0), sourceSha256: job.documentHash, professionalApproval: false };
  }

  private hasCurrentDraftRequest(job: any): boolean {
    try {
      const request = JSON.parse(fs.readFileSync(this.statePath(job.id) + '.draft-request', 'utf8'));
      return Object.entries(this.draftRequestIdentity(job)).every(([key, value]) => request[key] === value);
    } catch { return false; }
  }

  public requestAcademyDraft(job: any, db: any): void {
    const workspace = db.workspaces.find((w: any) => w.id === job.workspaceId);
    if (job.classification !== 'ACADEMY' || workspace?.classification !== 'ACADEMY' || job.status !== 'COMPLETED') {
      throw new Error('Only completed isolated Academy work is eligible for this draft request.');
    }
    const state = this.getState(job.id);
    if (!state?.specialistSummary || state.jobAttempt !== Number(job.attemptCount || 0) ||
      state.sourceSha256 !== job.documentHash || state.workspaceId !== job.workspaceId || state.documentId !== job.documentId) {
      throw new Error('Specialist processing for the current source and attempt is not complete.');
    }
    if (this.hasCurrentDraftRequest(job)) return;
    const target = this.statePath(job.id) + '.draft-request';
    const temporary = target + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify({ ...this.draftRequestIdentity(job), requestedAt: new Date().toISOString() }), { mode: 0o600 });
    const fd = fs.openSync(temporary, 'r'); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(temporary, target);
    const dir = fs.openSync(this.storageDir, 'r'); try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
  }

  public requestAcademyLexiconRetry(job: any, db: any): void {
    const state = this.getState(job.id);
    const workspace = db.workspaces.find((w: any) => w.id === job.workspaceId);
    const failed = state?.specialistSummary?.jobs?.filter((j: any) => j.status !== 'JOB_COMPLETED_SUCCESS') || [];
    if (job.classification !== 'ACADEMY' || workspace?.classification !== 'ACADEMY' || job.status !== 'COMPLETED' ||
      !state?.completedAt || state.workspaceId !== job.workspaceId || state.documentId !== job.documentId ||
      state.sourceSha256 !== job.documentHash || state.jobAttempt !== Number(job.attemptCount || 0) ||
      failed.length !== 1 || failed[0].agentId !== 'LEXICON' || failed[0].status !== 'MODEL_UNAVAILABLE') {
      throw new Error('Only the unavailable Lexicon step of a completed isolated Academy case can be retried.');
    }
    const target = this.statePath(job.id) + '.lexicon-retry';
    if (fs.existsSync(target)) throw new Error('This case already has a recorded bounded specialist retry.');
    const bytes = JSON.stringify({ ...this.draftRequestIdentity(job), id: crypto.randomUUID(),
      requestedAt: new Date().toISOString(), baseline: state }, null, 2);
    const fd = fs.openSync(target, 'wx', 0o600);
    try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    const dir = fs.openSync(this.storageDir, 'r'); try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
  }

  private pendingLexiconRetry(job: any, prior: VerifiedContinuationState | null): any | null {
    const target = this.statePath(job.id) + '.lexicon-retry';
    if (!fs.existsSync(target)) return null;
    const request = JSON.parse(fs.readFileSync(target, 'utf8'));
    if (job.classification !== 'ACADEMY' || !Object.entries(this.draftRequestIdentity(job)).every(([k, v]) => request[k] === v)) {
      throw new Error('SPECIALIST_RETRY_SCOPE_MISMATCH');
    }
    return prior?.specialistRetryId === request.id ? null : request;
  }

  public getState(jobId: string): VerifiedContinuationState | null {
    try {
      const p = this.statePath(jobId);
      return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : null;
    } catch {
      return null;
    }
  }

  public getContinuationByEngagementId(engagementId: string): VerifiedContinuationState | null {
    try {
      if (!fs.existsSync(this.storageDir)) return null;
      const files = fs.readdirSync(this.storageDir).filter(f => f.endsWith('.json'));
      const candidates: VerifiedContinuationState[] = [];
      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(this.storageDir, file), 'utf-8');
          const state = JSON.parse(raw) as VerifiedContinuationState;
          if (state && (state.engagementId === engagementId || state.workspaceId === engagementId || state.continuationId === engagementId || state.jobId === engagementId)) {
            candidates.push(state);
          }
        } catch {
          // Explicitly ignore corrupt or partial records
        }
      }
      if (candidates.length === 0) return null;
      // Sort deterministically by latest updatedAt or completedAt
      candidates.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.completedAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.completedAt || 0).getTime();
        return timeB - timeA;
      });
      return candidates[0];
    } catch {
      return null;
    }
  }

  private persist(state: VerifiedContinuationState): VerifiedContinuationState {
    state.updatedAt = new Date().toISOString();
    const target = this.statePath(state.jobId);
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    const body = JSON.stringify(state, null, 2);
    fs.writeFileSync(tmp, body, 'utf-8');
    const fd = fs.openSync(tmp, 'r');
    try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(tmp, target);
    try {
      const dfd = fs.openSync(this.storageDir, 'r');
      try { fs.fsyncSync(dfd); } finally { fs.closeSync(dfd); }
    } catch {}
    return state;
  }

  private isTerminalForSameAttempt(state: VerifiedContinuationState | null, job: any): boolean {
    if (!state) return false;
    if (state.logicVersion !== VERIFIED_CONTINUATION_LOGIC_VERSION) return false;
    if (state.jobAttempt !== Number(job?.attemptCount || 0) || state.sourceSha256 !== job?.documentHash) return false;
    return [
      'READY_FOR_AUTHORIZED_HUMAN_REVIEW',
      'READY_FOR_AUTHORIZED_HUMAN_REVIEW_WITH_SYSTEM_FINDINGS',
      'BLOCKED_NO_PROOF_COMPLETE_FACTS',
      'BLOCKED_CURRENCY_CONFLICT',
      'BLOCKED_ACCOUNTING_IDENTITY',
      'BLOCKED_TECHNICAL_VALIDATION'
    ].includes(state.status);
  }

  public async continueCompletedHybridJob(job: any, db: any): Promise<VerifiedContinuationState | null> {
    if (!job || job.engineMode !== 'HYBRID_GEMINI_NATIVE' || job.status !== 'COMPLETED' || !job.id || !job.workspaceId) return null;
    const workspace = db.workspaces.find((w: any) => w.id === job.workspaceId);
    const document = db.documents.find((d: any) => d.id === job.documentId);
    if ([job, workspace, document].some(record => record?.classification === 'ACADEMY') &&
        ![job, workspace, document].every(record => record?.classification === 'ACADEMY')) {
      throw new Error('ACADEMY_CLASSIFICATION_MISMATCH');
    }
    const prior = this.getState(job.id);
    if (shouldInvalidateReadyContinuation(prior, job, db.facts || [])) {
      return this.persist({ ...prior!, previousStatus: prior!.status, status: 'BLOCKED_ACCOUNTING_IDENTITY',
        updatedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
        error: 'A later independently preserved source created a material balance-sheet conflict; the prior draft is stale and blocked pending evidence adjudication.',
        deliverable: { ...prior!.deliverable!, status: 'STALE_BLOCKED_CONFLICT', isStale: true } });
    }
    const retry = this.pendingLexiconRetry(job, prior);
    if (!retry && this.isTerminalForSameAttempt(prior, job)) {
      if (!shouldRecoverPersistedEvidenceBlock(prior, job, db.facts || [])) return prior;
    }
    // An interrupted claimed retry requires reconciliation, never automatic duplicate model calls.
    if (!retry && prior?.specialistRetryId) return prior;
    if (job.classification === 'ACADEMY' && prior?.status === 'AWAITING_UI_DRAFT_REQUEST' &&
      prior.jobAttempt === Number(job.attemptCount || 0) && prior.sourceSha256 === job.documentHash &&
      prior.logicVersion === VERIFIED_CONTINUATION_LOGIC_VERSION && !this.hasCurrentDraftRequest(job)) return prior;
    if (this.activeJobs.has(job.id)) return prior;

    this.activeJobs.add(job.id);
    const startedAt = prior?.startedAt || new Date().toISOString();
    const base: VerifiedContinuationState = {
      continuationId: this.continuationId(job.id),
      logicVersion: VERIFIED_CONTINUATION_LOGIC_VERSION,
      previousStatus: prior?.status,
      jobId: job.id,
      jobAttempt: Number(job.attemptCount || 0),
      sourceSha256: String(job.documentHash || ''),
      workspaceId: String(job.workspaceId),
      documentId: String(job.documentId || ''),
      engagementId: this.engagementId(job.id),
      status: 'READY_FROM_VERIFIED_EXTRACTION',
      startedAt,
      updatedAt: new Date().toISOString()
    };
    if (retry) base.specialistRetryId = retry.id;

    try {
      const allFacts = Array.isArray(db?.facts) ? db.facts : [];
      const proofFacts = selectProofCompleteFacts(allFacts, job.workspaceId);
      if (proofFacts.length === 0) {
        return this.persist({ ...base, status: 'BLOCKED_NO_PROOF_COMPLETE_FACTS', completedAt: new Date().toISOString(), error: 'No APPROVED + VERIFIED + CONFIRMED facts available for continuation.' });
      }

      const currencies = [...new Set(proofFacts.map(f => upper(f.functionalCurrency || f.currencyOriginal || f.currency)).filter(Boolean))];
      const jobCurrency = upper(job.functionalCurrency);
      if (currencies.length !== 1 || (jobCurrency && currencies[0] !== jobCurrency)) {
        return this.persist({ ...base, status: 'BLOCKED_CURRENCY_CONFLICT', completedAt: new Date().toISOString(), reportingCurrency: currencies.join(','), error: `Proof-complete facts contain inconsistent currency authority: ${currencies.join(',') || 'NONE'}; job=${jobCurrency || 'NONE'}` });
      }
      const reportingCurrency = currencies[0];
      const fiscalYear = deriveFiscalYear(proofFacts);
      if (!fiscalYear) {
        return this.persist({ ...base, status: 'BLOCKED_ACCOUNTING_IDENTITY', completedAt: new Date().toISOString(), error: 'Unable to derive fiscal year from proof-complete facts.' });
      }
      const euclidBalance = deriveCurrentBalance(proofFacts, fiscalYear);
      if (!euclidBalance || euclidBalance.variance > 1) {
        return this.persist({ ...base, status: 'BLOCKED_ACCOUNTING_IDENTITY', completedAt: new Date().toISOString(), euclidBalance: euclidBalance || undefined, error: 'Current-period balance-sheet identity is missing, conflicting, or unbalanced.' });
      }

      const workspace = (db?.workspaces || []).find((w: any) => w.id === job.workspaceId);
      const document = (db?.documents || []).find((d: any) => d.id === job.documentId);
      const trialBalanceRuntime = await deriveContinuationTrialBalanceEvidence(job, document);
      base.trialBalanceQualification = trialBalanceRuntime.qualification;
      base.trialBalanceReview = trialBalanceRuntime.review;
      const clientName = String(
        job?.result?.documentMap?.documentIssuer ||
        proofFacts.find((f: any) => f.reportingEntity)?.reportingEntity ||
        workspace?.name ||
        job.documentTitle ||
        'Customer Entity'
      );
      const factDigest = buildVerifiedFactDigest(proofFacts);
      const factDigestSha256 = crypto.createHash('sha256').update(JSON.stringify(factDigest)).digest('hex');
      const disclosureLedger = disclosureEvidenceLedgerService.buildAndPersist({
        documentId: String(job.documentId || ''),
        sourceFilePath: String(job.filePath || document?.filePath || document?.url || ''),
        expectedSourceSha256: String(job.documentHash || ''),
        sourceBlocks: Array.isArray(db?.sourceBlocks) ? db.sourceBlocks : []
      });
      const disclosureEvidenceSummary = {
        ledgerId: disclosureLedger.ledgerId,
        persistedPath: disclosureLedger.persistedPath,
        sourceSha256: disclosureLedger.sourceSha256,
        sourceSha256Match: disclosureLedger.sourceSha256Match,
        sourceBlockCount: disclosureLedger.sourceBlockCount,
        evidenceCount: disclosureLedger.evidenceCount,
        topicCounts: disclosureLedger.topicCounts,
        evidenceDigestSha256: disclosureLedger.evidenceDigestSha256,
        taxonomyMetrics: disclosureLedger.taxonomyMetrics,
        evidenceIds: disclosureLedger.records.map(r => r.evidenceId)
      };

      let state = this.persist({
        ...base,
        clientName,
        fiscalYear,
        reportingCurrency,
        proofCompleteFactsCount: proofFacts.length,
        factDigestSha256,
        disclosureEvidence: disclosureEvidenceSummary,
        euclidBalance,
        status: 'SPECIALIST_SWARM_RUNNING'
      });

      let swarm: SwarmExecutionSummary;
      if (!retry && prior?.logicVersion === VERIFIED_CONTINUATION_LOGIC_VERSION && prior?.specialistSummary && prior.jobAttempt === base.jobAttempt && prior.sourceSha256 === base.sourceSha256) {
        swarm = prior.specialistSummary as SwarmExecutionSummary;
      } else {
        let reuseSuccessfulJobs: any[] | undefined;
        if (retry) {
          if (retry.baseline.factDigestSha256 !== factDigestSha256) throw new Error('SPECIALIST_RETRY_FACTS_CHANGED');
          const jobRoot = fs.realpathSync(path.join(process.cwd(), 'storage', 'cpa_memory', 'agent_executions'));
          reuseSuccessfulJobs = retry.baseline.specialistSummary.jobs.map((j: any) => {
            const file = fs.realpathSync(j.persistedArtifactPath);
            if (path.dirname(file) !== jobRoot) throw new Error('SPECIALIST_RECEIPT_SCOPE_MISMATCH');
            const record = JSON.parse(fs.readFileSync(file, 'utf8'));
            if (record.agentExecutionId !== j.agentExecutionId || record.engagementId !== base.engagementId || record.status !== j.status) {
              throw new Error('SPECIALIST_RECEIPT_IDENTITY_MISMATCH');
            }
            record.proofLevel = 'PERSISTED';
            record.proofState = 'OUTPUT_PERSISTED';
            return record;
          });
        }
        swarm = await hermesJobDispatchService.executeCpaSpecialistSwarm({
          engagementId: base.engagementId,
          clientName,
          ticker: 'NOT_MEASURED',
          fiscalYear,
          reportedAssets: euclidBalance.assets,
          reportedLiabilities: euclidBalance.liabilities,
          reportedEquity: euclidBalance.equity,
          sourceFilePath: String(job.filePath || document?.url || ''),
          sourceSha256: String(job.documentHash || ''),
          extractedFactsCount: proofFacts.length,
          verifiedFacts: factDigest,
          verifiedFactsDigestSha256: factDigestSha256,
          disclosureEvidence: disclosureLedger.records,
          disclosureEvidenceDigestSha256: disclosureLedger.evidenceDigestSha256,
          disclosureEvidenceLedgerId: disclosureLedger.ledgerId,
          taxonomyMetrics: disclosureLedger.taxonomyMetrics,
          reportingCurrency,
          workspaceId: job.workspaceId,
          documentId: job.documentId,
          trialBalanceQualification: trialBalanceRuntime.qualification,
          trialBalanceReview: trialBalanceRuntime.review,
          reuseSuccessfulJobs,
          discoveredAccounts: countDiscoveredAccounts(proofFacts),
          customerPbcUploaded: false,
          customerPbcFilesCount: 0
        } as any);
      }

      const ledger = swarm.jobs.find(j => j.agentId === 'LEDGER');
      const ledgerTrialBalanceReview = ledger?.outputManifest?.trialBalanceReview || trialBalanceRuntime.review;
      state = this.persist({ ...state, status: 'SPECIALIST_SWARM_COMPLETE', specialistSummary: compactSwarm(swarm), trialBalanceQualification: trialBalanceRuntime.qualification, trialBalanceReview: ledgerTrialBalanceReview });
      const quinn = swarm.jobs.find(j => j.agentId === 'QUINN');
      const quinnReview = {
        aiQualityReview: quinn?.status || 'NOT_RUN',
        reviewConclusion: quinn?.outputManifest?.reviewConclusion || 'NOT_RUN',
        agentExecutionId: quinn?.agentExecutionId || null,
        humanPartnerSignOff: 'PENDING',
        concurringApprovalGranted: false,
        deliveryEligible: false
      };

      if (job.classification === 'ACADEMY' && !this.hasCurrentDraftRequest(job)) {
        return this.persist({ ...state, status: 'AWAITING_UI_DRAFT_REQUEST' });
      }
      let artifact: DeliverableArtifactRecord;
      if (!retry && prior?.logicVersion === VERIFIED_CONTINUATION_LOGIC_VERSION && prior?.deliverable?.reportId && prior.jobAttempt === base.jobAttempt && prior.sourceSha256 === base.sourceSha256) {
        artifact = prior.deliverable as DeliverableArtifactRecord;
      } else {
        artifact = await deliverableArtifactService.compileAndRegisterDeliverable({
          reportId: this.reportId(job.id),
          engagementId: base.engagementId,
          workspaceId: job.workspaceId,
          version: `v6.a${base.jobAttempt}.${factDigestSha256.slice(0,8)}${retry ? '.r1' : ''}`,
          title: `${clientName} Financial Review Draft`,
          deliverableType: 'FINANCIAL_REVIEW_DRAFT',
          audience: 'AUTHORIZED_CPA_REVIEW',
          clientName,
          firmName: 'Eve Autonomous CPA System',
          partnerName: 'READY_FOR_AUTHORIZED_HUMAN_REVIEW',
          licenseNumber: '',
          period: `FY ${fiscalYear}`,
          currency: reportingCurrency,
          status: 'READY_FOR_AUTHORIZED_HUMAN_REVIEW',
          quinnReviewStatus: 'READY_FOR_AUTHORIZED_HUMAN_REVIEW',
          quinnReview,
          specialistReview: compactSwarm(swarm),
          disclosureEvidenceLedger: {
            ...disclosureEvidenceSummary,
            records: disclosureLedger.records
          },
          trialBalanceReview: ledgerTrialBalanceReview,
          adjudicationLineage: loadPersistedAdjudicationLineage(job.workspaceId, proofFacts),
          requireFinalLineage: true,
          facts: proofFacts.map((f: any) => mapProofFactToDeliverableFact(f, document, job)),
          euclidBalance
        });
      }

      state = this.persist({ ...state, status: 'DELIVERABLE_GENERATED_READY_FOR_HUMAN_REVIEW', deliverable: artifact });

      const internalTruthAudit = eveInternalAuditEngine.auditDeliverableTruth(
        { ...artifact, status: artifact.status, euclidBalance, facts: proofFacts },
        { underlyingFacts: proofFacts, derivations: [], approvalObject: undefined }
      );
      state = this.persist({ ...state, status: 'INTERNAL_TRUTH_AUDIT_COMPLETE', internalTruthAudit });

      const minervaLiveValidation = academyMinervaLab.evaluateLiveEngagement({
        facts: proofFacts,
        assets: euclidBalance.assets,
        liabilities: euclidBalance.liabilities,
        equity: euclidBalance.equity,
        variance: euclidBalance.variance,
        physicalFilePath: String(job.filePath || ''),
        physicalSha256: String(job.documentHash || '')
      });
      state = this.persist({ ...state, status: 'MINERVA_TECHNICAL_VALIDATION_COMPLETE', minervaLiveValidation });

      const disclosureEvidenceGaps = Object.entries(disclosureLedger.topicCounts)
        .filter(([, count]) => Number(count) === 0)
        .map(([topic]) => `DISCLOSURE_EVIDENCE_GAP:${topic}`);
      const systemFindings = [
        ...swarm.jobs
          .filter(j => j.status !== 'JOB_COMPLETED_SUCCESS')
          .map(j => `${j.agentId}:${j.status}${j.uncertainties?.length ? `:${j.uncertainties.map(formatUncertainty).join(' | ')}` : ''}`),
        ...disclosureEvidenceGaps
      ];
      const technicalPass = internalTruthAudit.compliant && minervaLiveValidation.certifiedStatus === 'TECHNICAL_VALIDATION_PASSED';
      const finalStatus: VerifiedContinuationStatus = !technicalPass
        ? 'BLOCKED_TECHNICAL_VALIDATION'
        : (systemFindings.length > 0 ? 'READY_FOR_AUTHORIZED_HUMAN_REVIEW_WITH_SYSTEM_FINDINGS' : 'READY_FOR_AUTHORIZED_HUMAN_REVIEW');

      return this.persist({
        ...state,
        status: finalStatus,
        completedAt: new Date().toISOString(),
        systemFindings,
        reviewFindings: swarm.jobs.flatMap(j => (j.uncertainties || []).map(u => `${j.agentId}: ${formatUncertainty(u)}`))
      });
    } catch (err: any) {
      return this.persist({
        ...base,
        status: 'BLOCKED_SYSTEM_ERROR',
        completedAt: new Date().toISOString(),
        error: err?.message || String(err)
      });
    } finally {
      this.activeJobs.delete(job.id);
    }
  }
}

export const verifiedCustomerContinuationService = VerifiedCustomerContinuationService.getInstance();
