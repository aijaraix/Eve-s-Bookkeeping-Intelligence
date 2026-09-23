import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { ExtractedFact } from '../../src/types.js';
import { UniversityStore, universityStore, type UniversityStage } from '../university/universityStore.js';

export type RawContinuationStage =
  | 'EXTRACTION_REMEDIATION'
  | 'EVIDENCE_COMPLETION'
  | 'CANONICALIZATION'
  | 'ACCOUNTING_CLASSIFICATION'
  | 'POSTING_WORKPAPER'
  | 'RECONCILIATION'
  | 'CLARIFICATION'
  | 'REPORT_DELIVERABLE'
  | 'LINEAGE_VERIFICATION'
  | 'MINERVA_GRADING'
  | 'REGRESSION';

export const RAW_CONTINUATION_STAGES: RawContinuationStage[] = [
  'EXTRACTION_REMEDIATION',
  'EVIDENCE_COMPLETION',
  'CANONICALIZATION',
  'ACCOUNTING_CLASSIFICATION',
  'POSTING_WORKPAPER',
  'RECONCILIATION',
  'CLARIFICATION',
  'REPORT_DELIVERABLE',
  'LINEAGE_VERIFICATION',
  'MINERVA_GRADING',
  'REGRESSION',
];

export type RawStageStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';

export interface RawStageExecution {
  executionId: string;
  continuationId: string;
  stage: RawContinuationStage;
  workerId: string;
  status: RawStageStatus;
  reason: string;
  inputRefs: string[];
  outputRefs: string[];
  startedAt: string | null;
  completedAt: string | null;
  receiptHash: string | null;
  outcomeCode: string | null;
  summary: string | null;
  resultData?: Record<string, any>;
  blockedReason?: string | null;
}

export interface RawInputContinuation {
  continuationId: string;
  idempotencyKey: string;
  sourceQueueJobId: string;
  sourceAttempt: number;
  sourceHash: string;
  intakeId: string | null;
  workspaceId: string;
  documentId: string;
  documentKind: string;
  examinationId: string | null;
  status: 'ACTIVE' | 'WAITING_FOR_CUSTOMER' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  reconciliationApplicable: boolean;
  facts: ExtractedFact[];
  rawInput: Record<string, any> | null;
  physicalProof?: {
    productEvidenceRefs: string[];
    deliverableEvidenceRefs: string[];
    recordedAt: string;
  };
  executions: RawStageExecution[];
  createdAt: string;
  updatedAt: string;
}

interface RawContinuationState {
  version: 1;
  continuations: RawInputContinuation[];
  schedulerDecisions: Array<{
    decisionId: string;
    continuationId: string | null;
    action: string;
    reason: string;
    createdAt: string;
  }>;
}

export interface RawStageReceipt {
  status: 'COMPLETED' | 'FAILED' | 'BLOCKED';
  outcomeCode: string;
  summary: string;
  outputRefs?: string[];
  resultData?: Record<string, any>;
  blockedReason?: string;
}

export type RawStageExecutor = (params: {
  continuation: RawInputContinuation;
  execution: RawStageExecution;
}) => Promise<RawStageReceipt> | RawStageReceipt;

const workerForStage: Record<RawContinuationStage, string> = {
  EXTRACTION_REMEDIATION: 'HERMES_EXTRACTION_REMEDIATOR',
  EVIDENCE_COMPLETION: 'VERITAS_EVIDENCE_AUDITOR',
  CANONICALIZATION: 'LEDGER_CANONICALIZER',
  ACCOUNTING_CLASSIFICATION: 'LEDGER_ACCOUNTING_CLASSIFIER',
  POSTING_WORKPAPER: 'LEDGER_POSTING_WORKPAPER',
  RECONCILIATION: 'EUCLID_RECONCILIATION',
  CLARIFICATION: 'CLARA_PBC_COORDINATOR',
  REPORT_DELIVERABLE: 'LEXICON_DELIVERABLE',
  LINEAGE_VERIFICATION: 'VERITAS_LINEAGE_AUDITOR',
  MINERVA_GRADING: 'MINERVA_INDEPENDENT_EXAMINER',
  REGRESSION: 'HERMES_REGRESSION_RUNNER',
};

const universityStageFor: Record<RawContinuationStage, UniversityStage> = {
  EXTRACTION_REMEDIATION: 'EXTRACTION',
  EVIDENCE_COMPLETION: 'EVIDENCE',
  CANONICALIZATION: 'CANONICALIZATION',
  ACCOUNTING_CLASSIFICATION: 'ACCOUNTING',
  POSTING_WORKPAPER: 'BOOKS_WORKPAPER',
  RECONCILIATION: 'RECONCILIATION',
  CLARIFICATION: 'CLARIFICATION',
  REPORT_DELIVERABLE: 'DELIVERABLE',
  LINEAGE_VERIFICATION: 'LINEAGE',
  MINERVA_GRADING: 'MINERVA',
  REGRESSION: 'LEARNING',
};

function emptyState(): RawContinuationState {
  return { version: 1, continuations: [], schedulerDecisions: [] };
}

function sha(value: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function unique(values: Array<string | undefined | null>): string[] {
  return [...new Set(values.filter(Boolean).map(String))];
}

function isRawFact(fact: any): boolean {
  return fact?.statementType === 'RAW_INPUT_TRANSACTION' || fact?.canonicalMetric === 'raw_input_transaction_total';
}

export class RawInputHermesContinuationService {
  readonly root: string;
  readonly file: string;

  constructor(root = process.env.EVE_RAW_CONTINUATION_DIR || path.join(process.cwd(), 'storage', 'cpa_memory', 'raw_input_continuations'), private readonly university: UniversityStore = universityStore) {
    this.root = root;
    this.file = path.join(root, 'continuations.json');
  }

  read(): RawContinuationState {
    if (!fs.existsSync(this.file)) return emptyState();
    const state = JSON.parse(fs.readFileSync(this.file, 'utf8')) as RawContinuationState;
    if (state.version !== 1 || !Array.isArray(state.continuations) || !Array.isArray(state.schedulerDecisions)) {
      throw new Error('RAW_CONTINUATION_STATE_INVALID');
    }
    return state;
  }

  private transaction<T>(mutate: (state: RawContinuationState) => T): T {
    fs.mkdirSync(this.root, { recursive: true, mode: 0o700 });
    const lock = path.join(this.root, 'write.lock');
    let fd: number;
    try { fd = fs.openSync(lock, 'wx', 0o600); } catch { throw new Error('RAW_CONTINUATION_STATE_BUSY'); }
    try {
      const state = this.read();
      const result = mutate(state);
      const temp = `${this.file}.${crypto.randomUUID()}.tmp`;
      fs.writeFileSync(temp, JSON.stringify(state, null, 2), { mode: 0o600 });
      const fileFd = fs.openSync(temp, 'r');
      try { fs.fsyncSync(fileFd); } finally { fs.closeSync(fileFd); }
      fs.renameSync(temp, this.file);
      return result;
    } finally {
      fs.closeSync(fd!);
      fs.unlinkSync(lock);
    }
  }

  private decision(state: RawContinuationState, continuationId: string | null, action: string, reason: string) {
    const latest = state.schedulerDecisions.at(-1);
    if (latest && latest.continuationId === continuationId && latest.action === action && latest.reason === reason &&
      Date.now() - new Date(latest.createdAt).getTime() < 60_000) return;
    state.schedulerDecisions.push({
      decisionId: `raw-decision-${crypto.randomUUID()}`,
      continuationId,
      action,
      reason,
      createdAt: new Date().toISOString(),
    });
  }

  private createStage(continuation: RawInputContinuation, stage: RawContinuationStage, reason: string, inputRefs: string[]): RawStageExecution {
    const existing = continuation.executions.find(row => row.stage === stage && row.status !== 'FAILED');
    if (existing) return existing;
    const execution: RawStageExecution = {
      executionId: `raw-exec-${crypto.randomUUID()}`,
      continuationId: continuation.continuationId,
      stage,
      workerId: workerForStage[stage],
      status: 'QUEUED',
      reason,
      inputRefs: unique(inputRefs),
      outputRefs: [],
      startedAt: null,
      completedAt: null,
      receiptHash: null,
      outcomeCode: null,
      summary: null,
      blockedReason: null,
    };
    continuation.executions.push(execution);
    continuation.updatedAt = new Date().toISOString();
    return execution;
  }

  private mirrorQueuedExecution(continuation: RawInputContinuation, execution: RawStageExecution) {
    if (!continuation.examinationId) return;
    this.university.queueWorkerExecution({
      executionId: execution.executionId,
      examinationId: continuation.examinationId,
      workerId: execution.workerId,
      stage: universityStageFor[execution.stage],
      sourceJobId: continuation.sourceQueueJobId,
      continuationId: continuation.continuationId,
      inputRefs: execution.inputRefs,
    });
    this.university.recordSchedulerDecision({
      examinationId: continuation.examinationId,
      action: 'RAW_STAGE_QUEUED',
      reason: `${execution.stage} queued for ${execution.workerId}: ${execution.reason}`,
    });
  }

  enqueueCompletedExtraction(job: any): RawInputContinuation | null {
    const facts = Array.isArray(job?.result?.facts) ? job.result.facts.filter(isRawFact) : [];
    const rawInput = job?.result?.rawInput || job?.rawInput || null;
    if (!rawInput && !facts.length) return null;
    if (job?.status !== 'COMPLETED') throw new Error('RAW_CONTINUATION_SOURCE_JOB_NOT_COMPLETED');
    const sourceHash = String(job.documentHash || facts[0]?.sourceSha256 || '').trim();
    if (!/^[a-f0-9]{64}$/i.test(sourceHash)) throw new Error('RAW_CONTINUATION_SOURCE_HASH_REQUIRED');
    const attempt = Number(job.attemptCount || 1);
    const idempotencyKey = sha({ jobId: job.id, attempt, sourceHash });
    const examination = this.university.findExamination({ intakeId: job.intakeSessionId, workspaceId: job.workspaceId });
    let queued: RawStageExecution | null = null;
    const continuation = this.transaction(state => {
      const existing = state.continuations.find(row => row.idempotencyKey === idempotencyKey);
      if (existing) return existing;
      const now = new Date().toISOString();
      const created: RawInputContinuation = {
        continuationId: `raw-cont-${crypto.randomUUID()}`,
        idempotencyKey,
        sourceQueueJobId: String(job.id),
        sourceAttempt: attempt,
        sourceHash,
        intakeId: job.intakeSessionId || null,
        workspaceId: String(job.workspaceId),
        documentId: String(job.documentId),
        documentKind: String(rawInput?.documentKind || job?.documentMap?.documentType || facts[0]?.rawTransaction?.documentKind || 'RAW_INPUT'),
        examinationId: examination?.examinationId || null,
        status: 'ACTIVE',
        reconciliationApplicable: ['BANK_STATEMENT', 'CREDIT_CARD_STATEMENT'].includes(String(rawInput?.documentKind || facts[0]?.rawTransaction?.documentKind || '')),
        facts: facts.map((fact: any) => ({ ...fact })),
        rawInput: rawInput ? { ...rawInput } : null,
        executions: [],
        createdAt: now,
        updatedAt: now,
      };
      const firstStage: RawContinuationStage = facts.length ? 'EVIDENCE_COMPLETION' : 'EXTRACTION_REMEDIATION';
      queued = this.createStage(created, firstStage, facts.length
        ? 'Raw transaction facts require a physical evidence-completeness audit before canonicalization.'
        : 'The raw document produced no transaction-level facts; bounded extraction remediation is required.',
      unique([`queue-job:${job.id}`, `document:${job.documentId}`, `source:${sourceHash}`, ...facts.map((fact: any) => `fact:${fact.id}`)]));
      state.continuations.push(created);
      this.decision(state, created.continuationId, 'RAW_CONTINUATION_ENQUEUED', `${firstStage} queued from completed extraction job ${job.id}.`);
      return created;
    });
    if (queued) this.mirrorQueuedExecution(continuation, queued);
    return continuation;
  }

  private nextStage(continuation: RawInputContinuation, execution: RawStageExecution, receipt: RawStageReceipt): RawContinuationStage | null {
    if (receipt.status !== 'COMPLETED') return null;
    switch (execution.stage) {
      case 'EXTRACTION_REMEDIATION': return Number(receipt.resultData?.factsProduced || 0) > 0 ? 'EVIDENCE_COMPLETION' : null;
      case 'EVIDENCE_COMPLETION': return receipt.resultData?.evidenceComplete === true ? 'CANONICALIZATION' : 'CLARIFICATION';
      case 'CANONICALIZATION': return 'ACCOUNTING_CLASSIFICATION';
      case 'ACCOUNTING_CLASSIFICATION': return receipt.resultData?.classificationComplete === true ? 'POSTING_WORKPAPER' : 'CLARIFICATION';
      case 'POSTING_WORKPAPER': return continuation.reconciliationApplicable ? 'RECONCILIATION' : 'REPORT_DELIVERABLE';
      case 'RECONCILIATION': return 'REPORT_DELIVERABLE';
      case 'CLARIFICATION': return receipt.resultData?.clarificationResolved === true
        ? (receipt.resultData?.resumeStage as RawContinuationStage || 'CANONICALIZATION')
        : null;
      case 'REPORT_DELIVERABLE': return 'LINEAGE_VERIFICATION';
      case 'LINEAGE_VERIFICATION': return 'MINERVA_GRADING';
      case 'MINERVA_GRADING':
      case 'REGRESSION':
        return null;
    }
  }

  async dispatchNext(params: { supportedStages: RawContinuationStage[]; executor: RawStageExecutor; continuationId?: string }): Promise<RawStageExecution | null> {
    const supported = new Set(params.supportedStages);
    let selectedContinuationId: string | null = null;
    let selectedExecutionId: string | null = null;
    const selected = this.transaction(state => {
      const row = state.continuations
        .filter(continuation => continuation.status === 'ACTIVE' && (!params.continuationId || continuation.continuationId === params.continuationId))
        .flatMap(continuation => continuation.executions.map(execution => ({ continuation, execution })))
        .find(({ execution }) => execution.status === 'QUEUED' && supported.has(execution.stage));
      if (!row) {
        const unsupported = state.continuations.flatMap(continuation => continuation.executions).find(execution => execution.status === 'QUEUED');
        this.decision(state, null, unsupported ? 'IDLE_NO_REGISTERED_EXECUTOR' : 'IDLE_NO_ELIGIBLE_RAW_WORK', unsupported
          ? `Queued stage ${unsupported.stage} has no registered executor in this scheduler pass.`
          : 'No eligible raw-input continuation stage is queued.');
        return null;
      }
      row.execution.status = 'RUNNING';
      row.execution.startedAt = new Date().toISOString();
      row.continuation.updatedAt = row.execution.startedAt;
      selectedContinuationId = row.continuation.continuationId;
      selectedExecutionId = row.execution.executionId;
      this.decision(state, row.continuation.continuationId, 'RAW_STAGE_DISPATCHED', `${row.execution.stage} dispatched to ${row.execution.workerId}.`);
      return { continuation: structuredClone(row.continuation), execution: structuredClone(row.execution) };
    });
    if (!selected || !selectedContinuationId || !selectedExecutionId) return null;
    if (selected.continuation.examinationId) {
      this.university.startWorkerExecution(selected.execution.executionId);
      this.university.recordSchedulerDecision({
        examinationId: selected.continuation.examinationId,
        action: 'RAW_STAGE_DISPATCHED',
        reason: `${selected.execution.stage} physically dispatched to ${selected.execution.workerId}.`,
      });
    }

    let receipt: RawStageReceipt;
    try {
      receipt = await params.executor(selected);
    } catch (error: any) {
      receipt = { status: 'FAILED', outcomeCode: 'WORKER_EXCEPTION', summary: error?.message || String(error), blockedReason: error?.message || String(error) };
    }
    const receiptHash = sha({
      continuationId: selectedContinuationId,
      executionId: selectedExecutionId,
      stage: selected.execution.stage,
      receipt,
    });
    let nextExecution: RawStageExecution | null = null;
    const completed = this.transaction(state => {
      const continuation = state.continuations.find(row => row.continuationId === selectedContinuationId);
      const execution = continuation?.executions.find(row => row.executionId === selectedExecutionId);
      if (!continuation || !execution) throw new Error('RAW_RUNNING_EXECUTION_NOT_FOUND');
      execution.status = receipt.status;
      execution.completedAt = new Date().toISOString();
      execution.outputRefs = unique(receipt.outputRefs || []);
      execution.receiptHash = receiptHash;
      execution.outcomeCode = receipt.outcomeCode;
      execution.summary = receipt.summary;
      execution.resultData = receipt.resultData;
      execution.blockedReason = receipt.blockedReason || null;
      continuation.updatedAt = execution.completedAt;
      const next = this.nextStage(continuation, execution, receipt);
      if (next) {
        nextExecution = this.createStage(continuation, next, `Dependency ${execution.stage} completed with ${receipt.outcomeCode}.`, unique([...execution.outputRefs, `execution:${execution.executionId}`, `receipt:${receiptHash}`]));
        this.decision(state, continuation.continuationId, 'RAW_STAGE_HANDOFF_QUEUED', `${execution.stage} handed off to ${next}.`);
      } else if (execution.stage === 'MINERVA_GRADING' && receipt.status === 'COMPLETED') {
        continuation.status = 'COMPLETED';
      } else if (execution.stage === 'CLARIFICATION' && receipt.status === 'COMPLETED' && receipt.resultData?.clarificationResolved !== true) {
        continuation.status = 'WAITING_FOR_CUSTOMER';
      } else if (receipt.status === 'FAILED') {
        continuation.status = 'FAILED';
      } else if (receipt.status === 'BLOCKED' || (execution.stage === 'EXTRACTION_REMEDIATION' && !next)) {
        continuation.status = 'BLOCKED';
      }
      this.decision(state, continuation.continuationId, `RAW_STAGE_${receipt.status}`, `${execution.stage}: ${receipt.outcomeCode} — ${receipt.summary}`);
      return structuredClone(execution);
    });
    if (selected.continuation.examinationId) {
      this.university.finishWorkerExecution({
        executionId: completed.executionId,
        status: completed.status as 'COMPLETED' | 'FAILED' | 'BLOCKED',
        result: `${completed.outcomeCode}: ${completed.summary}`,
        outputRefs: completed.outputRefs,
        executionReceiptHash: receiptHash,
        blockedReason: completed.blockedReason || undefined,
      });
      if (completed.status === 'COMPLETED' && completed.stage === 'MINERVA_GRADING') {
        const result = completed.resultData?.minervaResult === 'PASS' ? 'PASS'
          : completed.resultData?.minervaResult === 'CLARIFICATION_PASS' ? 'CLARIFICATION_PASS'
            : 'FAIL';
        this.university.advanceExamination(selected.continuation.examinationId, 'MINERVA', result);
      } else if (completed.status === 'COMPLETED') {
        this.university.advanceExamination(selected.continuation.examinationId, universityStageFor[completed.stage]);
      } else if (completed.status === 'FAILED' || completed.status === 'BLOCKED') {
        this.university.recordFailure({
          examinationId: selected.continuation.examinationId,
          stage: universityStageFor[completed.stage],
          rootCause: completed.blockedReason || completed.outcomeCode || 'RAW_CONTINUATION_STAGE_FAILED',
          capabilityGap: completed.summary || 'The raw-input continuation could not complete this stage.',
        });
        this.university.advanceExamination(
          selected.continuation.examinationId,
          universityStageFor[completed.stage],
          completed.status === 'FAILED' ? 'FAIL' : 'BLOCKED',
        );
      }
    }
    if (nextExecution) {
      const fresh = this.read().continuations.find(row => row.continuationId === selectedContinuationId);
      if (fresh) this.mirrorQueuedExecution(fresh, nextExecution);
    }
    return completed;
  }

  queueRegression(continuationId: string, reason: string): RawStageExecution {
    let queued: RawStageExecution | null = null;
    const continuation = this.transaction(state => {
      const row = state.continuations.find(item => item.continuationId === continuationId);
      if (!row) throw new Error('RAW_CONTINUATION_NOT_FOUND');
      if (!['FAILED', 'BLOCKED'].includes(row.status)) throw new Error('RAW_REGRESSION_REQUIRES_RECORDED_FAILURE');
      queued = this.createStage(row, 'REGRESSION', reason, unique(row.executions.flatMap(execution => execution.receiptHash ? [`receipt:${execution.receiptHash}`] : [])));
      row.status = 'ACTIVE';
      this.decision(state, continuationId, 'RAW_REGRESSION_QUEUED', reason);
      return row;
    });
    this.mirrorQueuedExecution(continuation, queued!);
    return queued!;
  }

  getContinuation(continuationId: string): RawInputContinuation | null {
    return this.read().continuations.find(row => row.continuationId === continuationId) || null;
  }

  getAllContinuations(): RawInputContinuation[] {
    return this.read().continuations;
  }

  recordPhysicalProof(continuationId: string, proof: { productEvidenceRefs: string[]; deliverableEvidenceRefs: string[] }): RawInputContinuation {
    if (!proof.productEvidenceRefs.length || !proof.deliverableEvidenceRefs.length) {
      throw new Error('RAW_PHYSICAL_PRODUCT_AND_DELIVERABLE_PROOF_REQUIRED');
    }
    return this.transaction(state => {
      const continuation = state.continuations.find(row => row.continuationId === continuationId);
      if (!continuation) throw new Error('RAW_CONTINUATION_NOT_FOUND');
      continuation.physicalProof = {
        productEvidenceRefs: unique(proof.productEvidenceRefs),
        deliverableEvidenceRefs: unique(proof.deliverableEvidenceRefs),
        recordedAt: new Date().toISOString(),
      };
      continuation.updatedAt = continuation.physicalProof.recordedAt;
      this.decision(state, continuationId, 'PHYSICAL_PROOF_RECORDED', 'Customer/owner rendering and deliverable readback evidence were attached for independent Minerva grading.');
      return structuredClone(continuation);
    });
  }
}

export const rawInputEvidenceWorker: RawStageExecutor = ({ continuation, execution }) => {
  if (execution.stage === 'EXTRACTION_REMEDIATION') {
    return {
      status: 'BLOCKED',
      outcomeCode: 'NO_TRANSACTION_FACTS_TO_REMEDIATE',
      summary: 'No transaction facts were produced. The worker refused to fabricate facts and requires a capable extractor or additional readable evidence.',
      outputRefs: [`source:${continuation.sourceHash}`],
      resultData: { factsProduced: 0 },
      blockedReason: 'EXTRACTION_CAPABILITY_OR_READABLE_EVIDENCE_REQUIRED',
    };
  }
  if (execution.stage !== 'EVIDENCE_COMPLETION') throw new Error(`RAW_EVIDENCE_WORKER_UNSUPPORTED_STAGE:${execution.stage}`);
  const checks = continuation.facts.map(fact => ({
    factId: fact.id,
    amountPresent: Number.isFinite(Number(fact.normalizedValue)),
    sourceHashPresent: /^[a-f0-9]{64}$/i.test(String(fact.sourceSha256 || '')),
    sourceCoordinatePresent: Boolean(fact.sourceCoordinate),
    evidenceConfirmed: String(fact.evidenceStatus || '').toUpperCase() === 'CONFIRMED',
    approved: String(fact.status || '').toLowerCase() === 'approved',
  }));
  const complete = checks.filter(check => check.amountPresent && check.sourceHashPresent && check.sourceCoordinatePresent && check.evidenceConfirmed && check.approved);
  const evidenceComplete = checks.length > 0 && complete.length === checks.length;
  return {
    status: 'COMPLETED',
    outcomeCode: evidenceComplete ? 'EVIDENCE_COMPLETE' : 'EVIDENCE_INSUFFICIENT',
    summary: `${complete.length}/${checks.length} raw transaction facts passed amount, source identity, coordinate, confirmation, and approval gates.`,
    outputRefs: unique([`source:${continuation.sourceHash}`, ...complete.map(check => `fact:${check.factId}`)]),
    resultData: { evidenceComplete, completeCount: complete.length, factCount: checks.length, checks },
  };
};

export const rawInputHermesContinuationService = new RawInputHermesContinuationService();
