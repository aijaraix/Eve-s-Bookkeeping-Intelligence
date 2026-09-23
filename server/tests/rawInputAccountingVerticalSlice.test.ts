import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { CanonicalDocumentModel } from '../../src/lib/parser/types.js';
import { extractRawInputTransactions } from '../rawInput/rawTransactionExtractionEngine.js';
import { RawInputHermesContinuationService, rawInputEvidenceWorker } from '../cpaOrganization/rawInputHermesContinuation.js';
import { UniversityStore } from '../university/universityStore.js';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-raw-vertical-'));
process.env.EVE_RAW_WORKPAPER_DIR = path.join(root, 'workpapers');
process.env.HERMES_REPORTS_DIR = path.join(root, 'reports');
process.env.EVE_CLARIFICATION_DIR = path.join(root, 'clarifications');

function documentFromLines(lines: string[]): CanonicalDocumentModel {
  const sourceSha256 = crypto.createHash('sha256').update(lines.join('\n')).digest('hex');
  const sourceArtifactId = `artifact-${sourceSha256.slice(0, 16)}`;
  const sourceBlocks = lines.map((text, index) => ({
    source_block_id: `SB-receipt-P1-${index + 1}`, document_id: 'doc-vertical', page_number: 1,
    raw_text: text, text_content: text, source_sha256: sourceSha256, source_artifact_id: sourceArtifactId,
    source_provenance_id: `prov-${index + 1}`,
    source_coordinate: { coordinateId: `coord-${index + 1}`, sourceArtifactId, sourceSha256, sourceType: 'DOCUMENT', lineStart: index + 1, lineEnd: index + 1, rawLiteral: text, extractionMethod: 'TEST_NATIVE_TEXT', extractionVersion: '1' },
    confidence: 0.99,
  }));
  return {
    document_id: 'doc-vertical', source: { filename: 'vertical-receipt.txt', format: 'txt', hash: sourceSha256, sourceArtifactId },
    metadata: { page_count: 1, pages: 1 }, raw_text: lines.join('\n'), markdown: lines.join('\n'),
    pages: [{ page_number: 1, text: lines.join('\n') }], page_count: 1,
    pageManifests: [{ page_number: 1, native_text_available: true }], sourceBlocks,
    sections: [{ title: 'Receipt', text: lines.join('\n'), page: 1 }],
  };
}

try {
  const { rawInputAccountingStageExecutor } = await import('../cpaOrganization/rawInputAccountingStageExecutor.js');
  const doc = documentFromLines([
    'NORTH STAR OFFICE MARKET', 'RECEIPT R-UNIV-001', 'DATE 2026-09-23', 'CURRENCY USD',
    'ARCHIVE FOLDERS 2 x $12.50 = $25.00', 'SUBTOTAL $25.00', 'SALES TAX $2.00', 'TOTAL $27.00',
    'PAYMENT METHOD VISA', 'ACCOUNTING CATEGORY OFFICE SUPPLIES',
  ]);
  const extracted = extractRawInputTransactions({ doc, workspaceId: 'ws-university-vertical', documentId: 'doc-vertical', filename: 'vertical-receipt.txt' });
  assert.equal(extracted.evidenceCompleteCount, 1);
  assert.equal(extracted.transactions[0].accountingCategory?.value, 'OFFICE SUPPLIES');

  const university = new UniversityStore(path.join(root, 'university'));
  const service = new RawInputHermesContinuationService(path.join(root, 'continuations'), university);
  const exam = university.registerAcademyIntake({ intakeId: 'intake-vertical', tenantId: 'tenant-vertical', tenantClassification: 'ACADEMY_SYNTHETIC', sourceType: 'RECEIPT', documentIds: ['doc-vertical'] });
  university.linkWorkspace('intake-vertical', 'ws-university-vertical');
  const continuation = service.enqueueCompletedExtraction({
    id: 'job-vertical', status: 'COMPLETED', attemptCount: 1, documentHash: doc.source.hash,
    intakeSessionId: 'intake-vertical', workspaceId: 'ws-university-vertical', documentId: 'doc-vertical',
    result: { facts: extracted.facts, rawInput: extracted },
  })!;
  assert.equal(continuation.examinationId, exam.examinationId);

  const evidence = await service.dispatchNext({ supportedStages: ['EVIDENCE_COMPLETION'], executor: rawInputEvidenceWorker });
  assert.equal(evidence?.outcomeCode, 'EVIDENCE_COMPLETE');
  for (const stage of ['CANONICALIZATION', 'ACCOUNTING_CLASSIFICATION', 'POSTING_WORKPAPER', 'REPORT_DELIVERABLE', 'LINEAGE_VERIFICATION'] as const) {
    const execution = await service.dispatchNext({ supportedStages: [stage], executor: rawInputAccountingStageExecutor });
    assert.equal(execution?.status, 'COMPLETED', `${stage} must complete`);
  }

  let state = service.getContinuation(continuation.continuationId)!;
  const posting = state.executions.find(row => row.stage === 'POSTING_WORKPAPER')!;
  assert.equal(posting.resultData?.workpaper?.control?.balanced, true);
  assert.equal(posting.resultData?.workpaper?.postingState, 'DRAFT_NOT_POSTED_TO_PRODUCTION_BOOKS');
  const deliverable = state.executions.find(row => row.stage === 'REPORT_DELIVERABLE')!;
  assert.equal(deliverable.resultData?.status, 'AI_PREPARED');
  assert.deepEqual(Object.keys(deliverable.resultData?.formats || {}).sort(), ['csv', 'json', 'pdf', 'xlsx']);
  const lineage = state.executions.find(row => row.stage === 'LINEAGE_VERIFICATION')!;
  assert.equal(lineage.resultData?.valid, true);
  assert.equal(lineage.resultData?.reverseLineage?.[0]?.sourceSha256, doc.source.hash);
  assert.equal(state.executions.at(-1)?.stage, 'MINERVA_GRADING');

  service.recordPhysicalProof(continuation.continuationId, {
    productEvidenceRefs: ['browser-contract:authenticated-customer-tenant-view', 'browser-contract:owner-university-view'],
    deliverableEvidenceRefs: Object.entries(deliverable.resultData?.formats || {}).map(([format, value]: any) => `readback-contract:${format}:${value.sha256}`),
  });
  const minerva = await service.dispatchNext({ supportedStages: ['MINERVA_GRADING'], executor: rawInputAccountingStageExecutor });
  assert.equal(minerva?.resultData?.minervaResult, 'PASS');
  assert.equal(minerva?.outcomeCode, 'FIVE_DIMENSION_PASS');
  state = service.getContinuation(continuation.continuationId)!;
  assert.equal(state.status, 'COMPLETED');
  assert.equal(state.executions.filter(row => Boolean(row.startedAt)).length, 7);

  console.log('UNIVERSITY_RAW_ACCOUNTING_VERTICAL_SLICE=PASS');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
