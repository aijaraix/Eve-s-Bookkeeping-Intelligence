import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RAW_CONTINUATION_STAGES, RawInputHermesContinuationService, rawInputEvidenceWorker } from '../cpaOrganization/rawInputHermesContinuation.js';
import { UniversityStore } from '../university/universityStore.js';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-raw-hermes-'));
try {
  const university = new UniversityStore(path.join(root, 'university'));
  const service = new RawInputHermesContinuationService(path.join(root, 'continuations'), university);
  assert.deepEqual(RAW_CONTINUATION_STAGES, [
    'EXTRACTION_REMEDIATION', 'EVIDENCE_COMPLETION', 'CANONICALIZATION', 'ACCOUNTING_CLASSIFICATION',
    'POSTING_WORKPAPER', 'RECONCILIATION', 'CLARIFICATION', 'REPORT_DELIVERABLE',
    'LINEAGE_VERIFICATION', 'MINERVA_GRADING', 'REGRESSION',
  ]);
  const sourceHash = 'a'.repeat(64);
  const fact = {
    id: 'fact-receipt-1',
    workspaceId: 'ws-receipt',
    documentId: 'doc-receipt',
    statementType: 'RAW_INPUT_TRANSACTION',
    canonicalMetric: 'raw_input_transaction_total',
    normalizedValue: 24.5,
    sourceSha256: sourceHash,
    sourceCoordinate: { coordinateId: 'coord-total', sourceSha256: sourceHash, sourceType: 'DOCUMENT' },
    evidenceStatus: 'CONFIRMED',
    status: 'approved',
    rawTransaction: { documentKind: 'RECEIPT', amount: 24.5, currency: 'USD' },
  };
  const exam = university.registerAcademyIntake({
    intakeId: 'intake-receipt', tenantId: 'tenant-receipt', tenantClassification: 'ACADEMY_SYNTHETIC',
    sourceType: 'RECEIPT', documentIds: ['doc-receipt'],
  });
  university.linkWorkspace('intake-receipt', 'ws-receipt');
  const job = {
    id: 'job-receipt', status: 'COMPLETED', attemptCount: 1, documentHash: sourceHash,
    intakeSessionId: 'intake-receipt', workspaceId: 'ws-receipt', documentId: 'doc-receipt',
    result: { facts: [fact], rawInput: { recognized: true, documentKind: 'RECEIPT' } },
  };

  const continuation = service.enqueueCompletedExtraction(job)!;
  assert.ok(continuation);
  assert.equal(continuation.examinationId, exam.examinationId);
  assert.equal(continuation.executions.length, 1);
  assert.equal(continuation.executions[0].stage, 'EVIDENCE_COMPLETION');
  assert.equal(continuation.executions[0].status, 'QUEUED');
  assert.equal(service.enqueueCompletedExtraction(job)?.continuationId, continuation.continuationId, 'completed extraction handoff must be idempotent');
  assert.equal(service.getAllContinuations().length, 1);

  const evidenceExecution = await service.dispatchNext({ supportedStages: ['EVIDENCE_COMPLETION'], executor: rawInputEvidenceWorker });
  assert.equal(evidenceExecution?.status, 'COMPLETED');
  assert.equal(evidenceExecution?.outcomeCode, 'EVIDENCE_COMPLETE');
  assert.match(String(evidenceExecution?.receiptHash), /^[a-f0-9]{64}$/);
  const afterEvidence = service.getContinuation(continuation.continuationId)!;
  assert.equal(afterEvidence.executions[1].stage, 'CANONICALIZATION');
  assert.equal(afterEvidence.executions[1].status, 'QUEUED', 'a real downstream job must be created after the evidence handoff');
  const universityEvidence = university.read().workerExecutions.find(row => row.executionId === evidenceExecution?.executionId)!;
  assert.equal(universityEvidence.status, 'COMPLETED');
  assert.ok(universityEvidence.startedAt && universityEvidence.completedAt);
  assert.equal(universityEvidence.executionReceiptHash, evidenceExecution?.receiptHash);
  assert.equal(university.read().workerExecutions.find(row => row.stage === 'CANONICALIZATION')?.status, 'QUEUED');

  const noExecutor = await service.dispatchNext({ supportedStages: ['EVIDENCE_COMPLETION'], executor: rawInputEvidenceWorker });
  assert.equal(noExecutor, null);
  assert.equal(university.snapshot().overview.workersActive, 0, 'a queued stage without an executor must not appear physically active');
  assert.match(String(university.snapshot().hermes.idleReason), /QUEUED_WORK_AWAITING_ELIGIBLE_EXECUTOR/);
  assert.equal(service.read().schedulerDecisions.at(-1)?.action, 'IDLE_NO_REGISTERED_EXECUTOR');

  university.registerAcademyIntake({
    intakeId: 'intake-partial', tenantClassification: 'ACADEMY_SYNTHETIC', sourceType: 'INVOICE', documentIds: ['doc-partial'],
  });
  university.linkWorkspace('intake-partial', 'ws-partial');
  const partialContinuation = service.enqueueCompletedExtraction({
    id: 'job-partial', status: 'COMPLETED', attemptCount: 1, documentHash: 'b'.repeat(64),
    intakeSessionId: 'intake-partial', workspaceId: 'ws-partial', documentId: 'doc-partial',
    result: {
      facts: [{ ...fact, id: 'fact-partial', workspaceId: 'ws-partial', documentId: 'doc-partial', sourceSha256: 'b'.repeat(64), sourceCoordinate: undefined, evidenceStatus: 'PARTIAL', status: 'pending_review' }],
      rawInput: { recognized: true, documentKind: 'INVOICE', requiresClarification: true },
    },
  })!;
  const partialEvidence = await service.dispatchNext({ supportedStages: ['EVIDENCE_COMPLETION'], executor: rawInputEvidenceWorker });
  assert.equal(partialEvidence?.outcomeCode, 'EVIDENCE_INSUFFICIENT');
  assert.equal(service.getContinuation(partialContinuation.continuationId)?.executions.at(-1)?.stage, 'CLARIFICATION');

  university.registerAcademyIntake({
    intakeId: 'intake-empty', tenantClassification: 'ACADEMY_SYNTHETIC', sourceType: 'POOR_OCR_RECEIPT', documentIds: ['doc-empty'],
  });
  university.linkWorkspace('intake-empty', 'ws-empty');
  const emptyContinuation = service.enqueueCompletedExtraction({
    id: 'job-empty', status: 'COMPLETED', attemptCount: 1, documentHash: 'c'.repeat(64),
    intakeSessionId: 'intake-empty', workspaceId: 'ws-empty', documentId: 'doc-empty',
    result: { facts: [], rawInput: { recognized: true, documentKind: 'RECEIPT', requiresClarification: true } },
  })!;
  assert.equal(emptyContinuation.executions[0].stage, 'EXTRACTION_REMEDIATION');
  const remediation = await service.dispatchNext({ supportedStages: ['EXTRACTION_REMEDIATION'], executor: rawInputEvidenceWorker });
  assert.equal(remediation?.status, 'BLOCKED');
  assert.equal(remediation?.outcomeCode, 'NO_TRANSACTION_FACTS_TO_REMEDIATE');
  assert.equal(service.getContinuation(emptyContinuation.continuationId)?.status, 'BLOCKED');
  assert.equal(university.snapshot().failuresRemediation.length, 1);
  assert.equal(university.findExamination({ intakeId: 'intake-empty' })?.result, 'BLOCKED');

  const regression = service.queueRegression(emptyContinuation.continuationId, 'Replay only after extractor/readability remediation is installed.');
  assert.equal(regression.stage, 'REGRESSION');
  assert.equal(regression.status, 'QUEUED');
  assert.equal(service.getContinuation(emptyContinuation.continuationId)?.status, 'ACTIVE');

  console.log('UNIVERSITY_RAW_HERMES_CONTINUATION=PASS');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
