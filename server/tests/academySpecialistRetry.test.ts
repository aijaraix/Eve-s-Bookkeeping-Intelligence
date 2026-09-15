import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const originalCwd = process.cwd();
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-academy-retry-test-'));
process.chdir(root);
try {
  const { verifiedCustomerContinuationService: service } = await import('../cpaOrganization/verifiedCustomerContinuationService');
  const { hermesJobDispatchService: dispatch } = await import('../cpaOrganization/hermesJobDispatchService');
  const source = path.join(root, 'source.html');
  fs.writeFileSync(source, '<html>Explicit synthetic test: assets 200; liabilities 80; equity 120.</html>');
  const hash = (p: string) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  const job: any = { id: 'synthetic-retry-job', workspaceId: 'synthetic-academy', documentId: 'synthetic-doc',
    classification: 'ACADEMY', engineMode: 'HYBRID_GEMINI_NATIVE', status: 'COMPLETED', attemptCount: 1,
    functionalCurrency: 'USD', documentHash: hash(source), filePath: source };
  const db: any = { workspaces: [{ id: job.workspaceId, classification: 'ACADEMY', name: 'Synthetic Retry Test' }],
    documents: [{ id: job.documentId, classification: 'ACADEMY', filePath: source, filename: 'source.html' }], sourceBlocks: [],
    facts: [['totalAssets', 200], ['totalLiabilities', 80], ['totalEquity', 120]].map(([metric, value], i) => ({
      id: `synthetic-${i}`, workspaceId: job.workspaceId, documentId: job.documentId, canonicalMetric: metric,
      labelOriginal: metric, normalizedValue: value, valueFunctional: value, functionalCurrency: 'USD',
      status: 'APPROVED', verificationStatus: 'VERIFIED', evidenceStatus: 'CONFIRMED',
      reportingPeriod: '2024-12-31', sourceText: `Synthetic source ${metric} ${value}`, statementType: 'BALANCE_SHEET'
    })) };
  let retry = false;
  const calls: string[] = [];
  dispatch.executeSpecialistRole = async (agentId: any) => {
    calls.push(agentId);
    const failed = agentId === 'LEXICON' && !retry;
    return { status: failed ? 'MODEL_UNAVAILABLE' : 'JOB_COMPLETED_SUCCESS',
      executionMechanism: 'REAL_MODEL_INFERENCE', roleExecutionClass: 'REAL_AI_AGENT',
      modelExecutionId: failed ? undefined : `synthetic-model-${agentId}-${calls.length}`,
      outputValidationStatus: 'VALIDATED', modelCallStatus: failed ? 'MODEL_UNAVAILABLE' : 'CALL_SUCCESS',
      provenance: { provider: 'ISOLATED_TEST_ONLY', model: 'ISOLATED_TEST_ONLY' }, findings: [], uncertainties: [],
      outputObjectReferences: [`synthetic-output-${agentId}`], outputManifest: { varianceUsd: 0, sha256Match: true,
        pbcStatus: 'SYNTHETIC_TEST', reviewConclusion: 'PENDING_HUMAN_REVIEW', responseCount: 0 } } as any;
  };
  assert.equal((await service.continueCompletedHybridJob(job, db))?.status, 'AWAITING_UI_DRAFT_REQUEST');
  service.requestAcademyDraft(job, db);
  const before = (await service.continueCompletedHybridJob(job, db))!;
  assert(before.completedAt);
  const oldPdf = before.deliverable.formats.pdf.filepath;
  const oldPdfHash = hash(oldPdf);
  const receipts = before.specialistSummary.jobs.map((j: any) => ({ id: j.agentExecutionId, path: j.persistedArtifactPath, hash: hash(j.persistedArtifactPath) }));
  assert.throws(() => service.requestAcademyLexiconRetry({ ...job, classification: 'CUSTOMER' }, db));
  assert.throws(() => service.requestAcademyLexiconRetry({ ...job, documentHash: 'b'.repeat(64) }, db));
  service.requestAcademyLexiconRetry(job, db);
  assert.throws(() => service.requestAcademyLexiconRetry(job, db), /already/);
  retry = true; calls.length = 0;
  const after = (await service.continueCompletedHybridJob(job, db))!;
  assert.deepEqual(calls.sort(), ['LEXICON', 'QUINN']);
  assert.equal(after.specialistSummary.allJobsSucceeded, true);
  assert.equal(after.deliverable.version, before.deliverable.version + '.r1');
  assert.equal(hash(oldPdf), oldPdfHash, 'prior report bytes must remain intact');
  assert(receipts.every((r: any) => hash(r.path) === r.hash), 'prior receipts must remain intact');
  const retained = after.specialistSummary.jobs.filter((j: any) => !['LEXICON', 'QUINN'].includes(j.agentId));
  assert.equal(retained.length, 7);
  assert(retained.every((j: any) => before.specialistSummary.jobs.some((b: any) => b.agentExecutionId === j.agentExecutionId)));
  calls.length = 0;
  await service.continueCompletedHybridJob(job, db);
  assert.equal(calls.length, 0, 'later sweeps must not repeat the retry');
  console.log('PASS: isolated retry preserves seven completed specialists, old receipts and report bytes; only Lexicon and dependent Quinn run; customer/hash/duplicate gates reject.');
} finally {
  process.chdir(originalCwd);
  fs.rmSync(root, { recursive: true, force: true });
}
