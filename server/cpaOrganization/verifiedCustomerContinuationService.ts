import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { hermesJobDispatchService, SwarmExecutionSummary } from './hermesJobDispatchService.js';
import { deliverableArtifactService, DeliverableArtifactRecord } from './deliverableArtifactService.js';
import { eveInternalAuditEngine } from './eveInternalAuditEngine.js';
import { academyMinervaLab } from './academyMinervaLab.js';

export const VERIFIED_CONTINUATION_LOGIC_VERSION = 'v4-qwen-response-channel';

export type VerifiedContinuationStatus =
  | 'READY_FROM_VERIFIED_EXTRACTION'
  | 'SPECIALIST_SWARM_RUNNING'
  | 'SPECIALIST_SWARM_COMPLETE'
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
  euclidBalance?: { assets: number; liabilities: number; equity: number; variance: number };
  specialistSummary?: any;
  deliverable?: any;
  internalTruthAudit?: any;
  minervaLiveValidation?: any;
  systemFindings?: string[];
  error?: string;
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

export function selectProofCompleteFacts(facts: any[], workspaceId: string): any[] {
  return (facts || []).filter(f => (f.workspaceId === workspaceId || f.workspace_id === workspaceId) && isProofCompleteFact(f));
}

function metricKey(f: any): string {
  return String(f?.canonicalMetric || f?.canonical_metric || f?.labelNormalized || f?.labelOriginal || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function yearsIn(value: any): number[] {
  return [...String(value || '').matchAll(/\b(20\d{2})\b/g)].map(m => Number(m[1]));
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

  public getState(jobId: string): VerifiedContinuationState | null {
    try {
      const p = this.statePath(jobId);
      return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : null;
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
    const prior = this.getState(job.id);
    if (this.isTerminalForSameAttempt(prior, job)) return prior;
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
      const clientName = String(
        job?.result?.documentMap?.documentIssuer ||
        proofFacts.find((f: any) => f.reportingEntity)?.reportingEntity ||
        workspace?.name ||
        job.documentTitle ||
        'Customer Entity'
      );
      const factDigest = buildVerifiedFactDigest(proofFacts);
      const factDigestSha256 = crypto.createHash('sha256').update(JSON.stringify(factDigest)).digest('hex');

      let state = this.persist({
        ...base,
        clientName,
        fiscalYear,
        reportingCurrency,
        proofCompleteFactsCount: proofFacts.length,
        factDigestSha256,
        euclidBalance,
        status: 'SPECIALIST_SWARM_RUNNING'
      });

      let swarm: SwarmExecutionSummary;
      if (prior?.logicVersion === VERIFIED_CONTINUATION_LOGIC_VERSION && prior?.specialistSummary && prior.jobAttempt === base.jobAttempt && prior.sourceSha256 === base.sourceSha256) {
        swarm = prior.specialistSummary as SwarmExecutionSummary;
      } else {
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
          reportingCurrency,
          workspaceId: job.workspaceId,
          documentId: job.documentId,
          discoveredAccounts: countDiscoveredAccounts(proofFacts),
          customerPbcUploaded: false,
          customerPbcFilesCount: 0
        } as any);
      }

      state = this.persist({ ...state, status: 'SPECIALIST_SWARM_COMPLETE', specialistSummary: compactSwarm(swarm) });
      const quinn = swarm.jobs.find(j => j.agentId === 'QUINN');
      const quinnReview = {
        aiQualityReview: quinn?.status || 'NOT_RUN',
        reviewConclusion: quinn?.outputManifest?.reviewConclusion || 'NOT_RUN',
        agentExecutionId: quinn?.agentExecutionId || null,
        humanPartnerSignOff: 'PENDING',
        concurringApprovalGranted: false,
        deliveryEligible: false
      };

      let artifact: DeliverableArtifactRecord;
      if (prior?.deliverable?.reportId && prior.jobAttempt === base.jobAttempt && prior.sourceSha256 === base.sourceSha256) {
        artifact = prior.deliverable as DeliverableArtifactRecord;
      } else {
        artifact = await deliverableArtifactService.compileAndRegisterDeliverable({
          reportId: this.reportId(job.id),
          engagementId: base.engagementId,
          workspaceId: job.workspaceId,
          version: 'v1.0',
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
          facts: proofFacts.map((f: any) => ({
            id: f.id,
            canonicalMetric: f.canonicalMetric || f.labelNormalized,
            label: f.labelOriginal || f.labelNormalized,
            value: numericFactValue(f) || 0,
            statement: f.statementType,
            sourceDoc: document?.filename || job.documentTitle,
            documentId: f.documentId || f.document_id,
            page: f.pageNumber,
            verificationStatus: f.verificationStatus,
            evidenceStatus: f.evidenceStatus
          })),
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

      const systemFindings = swarm.jobs
        .filter(j => j.status !== 'JOB_COMPLETED_SUCCESS')
        .map(j => `${j.agentId}:${j.status}${j.uncertainties?.length ? `:${j.uncertainties.join(' | ')}` : ''}`);
      const technicalPass = internalTruthAudit.compliant && minervaLiveValidation.certifiedStatus === 'TECHNICAL_VALIDATION_PASSED';
      const finalStatus: VerifiedContinuationStatus = !technicalPass
        ? 'BLOCKED_TECHNICAL_VALIDATION'
        : (systemFindings.length > 0 ? 'READY_FOR_AUTHORIZED_HUMAN_REVIEW_WITH_SYSTEM_FINDINGS' : 'READY_FOR_AUTHORIZED_HUMAN_REVIEW');

      return this.persist({
        ...state,
        status: finalStatus,
        completedAt: new Date().toISOString(),
        systemFindings
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
