import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TaskEvidenceSufficiencyEngine, type EvidenceTaskDefinition } from '../cpaOrganization/taskEvidenceSufficiencyEngine.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-task-sufficiency-'));
const engine = new TaskEvidenceSufficiencyEngine(tmp);

const cashTask = (): EvidenceTaskDefinition => ({
  taskId: 'task-cash-balance',
  taskType: 'BANK_BALANCE_VERIFICATION',
  purpose: 'Establish the ending cash balance for the period.',
  workspaceId: 'ws-synthetic',
  engagementId: 'eng-synthetic',
  period: '2026-09',
  availableCapabilities: ['BANK_ENDING_BALANCE', 'BANK_RECONCILIATION'],
  evidenceRefs: ['doc-bank-statement'],
  conclusions: [{
    conclusionId: 'ending-cash',
    label: 'Ending cash balance',
    requiredCapabilities: ['BANK_ENDING_BALANCE'],
    evidenceRefs: ['fact-ending-cash'],
  }],
});

// 1. Complete source + required capability present => sufficient.
const complete = engine.evaluate({ task: cashTask() });
assert.equal(complete.sourceCompletenessState, 'SOURCE_COMPLETE');
assert.equal(complete.taskEvidenceSufficiencyState, 'SUFFICIENT_FOR_CURRENT_PURPOSE');
assert.equal(complete.recommendedAction, 'PROCEED');
assert.deepEqual(complete.allowedConclusionIds, ['ending-cash']);
assert.equal(complete.clarificationRecommended, false);

// 2. Missing pages known to contain unrelated boilerplate/disclosure narrative must remain visible,
// but must not block a point-in-time bank balance conclusion.
const boilerplateGap = engine.evaluate({
  task: cashTask(),
  gaps: [{
    gapId: 'gap-pages-4-5-boilerplate',
    sourceArtifactId: 'doc-bank-statement',
    gapType: 'MISSING_PAGE',
    description: 'Pages 4-5 are absent; adjacent headings identify terms/disclosures only.',
    location: 'Pages 4-5',
    affectedCapabilities: ['DISCLOSURE_NARRATIVE'],
    explicitMateriality: 'UNKNOWN',
    evidenceRefs: ['page-3-heading', 'page-6-heading'],
    signals: {
      structuralRelevance: 'IRRELEVANT_TO_TASK',
      continuity: 'INTACT',
      reconciliation: 'PASS',
      adjacentContext: 'Pages 3 and 6 bracket a disclosure section; transaction pages are continuous.',
    },
  }],
});
assert.equal(boilerplateGap.sourceCompletenessState, 'SOURCE_GAP_NON_MATERIAL_FOR_CURRENT_PURPOSE');
assert.equal(boilerplateGap.taskEvidenceSufficiencyState, 'SUFFICIENT_FOR_CURRENT_PURPOSE');
assert.equal(boilerplateGap.recommendedAction, 'PROCEED_WITH_DISCLOSED_GAP');
assert.equal(boilerplateGap.knownGapCount, 1);
assert.deepEqual(boilerplateGap.allowedConclusionIds, ['ending-cash']);

// 3. Missing transaction pages + broken continuity blocks transaction reconstruction.
const transactionTask: EvidenceTaskDefinition = {
  taskId: 'task-transaction-reconstruction',
  taskType: 'TRANSACTION_RECONSTRUCTION',
  purpose: 'Reconstruct the complete transaction population for the month.',
  availableCapabilities: ['TRANSACTION_LEDGER'],
  conclusions: [{
    conclusionId: 'complete-ledger',
    label: 'Complete transaction population',
    requiredCapabilities: ['TRANSACTION_LEDGER'],
    requiresCompletePopulation: true,
  }],
};
const materialGap = engine.evaluate({
  task: transactionTask,
  gaps: [{
    gapId: 'gap-pages-7-8-transactions',
    sourceArtifactId: 'doc-bank-statement',
    gapType: 'MISSING_TRANSACTION_RANGE',
    description: 'Transaction sequence jumps across the missing pages.',
    location: 'Pages 7-8',
    affectedCapabilities: ['TRANSACTION_LEDGER'],
    evidenceRefs: ['page-6-last-transaction', 'page-9-first-transaction'],
    signals: { structuralRelevance: 'RELEVANT_TO_TASK', continuity: 'BROKEN', reconciliation: 'FAIL' },
  }],
});
assert.equal(materialGap.sourceCompletenessState, 'SOURCE_GAP_MATERIAL_FOR_CURRENT_PURPOSE');
assert.equal(materialGap.taskEvidenceSufficiencyState, 'INSUFFICIENT_FOR_CURRENT_PURPOSE');
assert.equal(materialGap.recommendedAction, 'REQUEST_ADDITIONAL_EVIDENCE');
assert.deepEqual(materialGap.blockedConclusionIds, ['complete-ledger']);
assert.equal(materialGap.clarificationRecommended, true);

// 4. A known source gap with unknown impact scope is never silently treated as unrelated.
const unknownGap = engine.evaluate({
  task: cashTask(),
  gaps: [{
    gapId: 'gap-unknown-missing-page',
    sourceArtifactId: 'doc-bank-statement',
    gapType: 'MISSING_PAGE',
    description: 'Page 2 is missing and its content class cannot be inferred.',
    location: 'Page 2',
    affectedCapabilities: [],
    evidenceRefs: ['page-manifest'],
    signals: { structuralRelevance: 'UNKNOWN', continuity: 'UNKNOWN', reconciliation: 'NOT_RUN' },
  }],
});
assert.equal(unknownGap.sourceCompletenessState, 'SOURCE_GAP_UNKNOWN_MATERIALITY');
assert.equal(unknownGap.taskEvidenceSufficiencyState, 'REVIEW_REQUIRED_TO_DETERMINE_MATERIALITY');
assert.equal(unknownGap.recommendedAction, 'REVIEW_MATERIALITY');
assert.deepEqual(unknownGap.reviewRequiredConclusionIds, ['ending-cash']);

// 5. Missing a capability explicitly required by the task creates a fail-closed material gap.
const invoiceTask: EvidenceTaskDefinition = {
  taskId: 'task-invoice-total',
  taskType: 'INVOICE_RECOGNITION',
  purpose: 'Establish the invoice total for posting.',
  availableCapabilities: ['VENDOR_IDENTITY'],
  conclusions: [{ conclusionId: 'invoice-total', label: 'Invoice total', requiredCapabilities: ['INVOICE_TOTAL'] }],
};
const missingCapability = engine.evaluate({ task: invoiceTask });
assert.equal(missingCapability.taskEvidenceSufficiencyState, 'INSUFFICIENT_FOR_CURRENT_PURPOSE');
assert.ok(missingCapability.gaps.some(g => g.gapType === 'REQUIRED_EVIDENCE_CAPABILITY_MISSING'));
assert.deepEqual(missingCapability.blockedConclusionIds, ['invoice-total']);

// 6. Block only affected conclusions; unrelated conclusions remain usable.
const mixedTask: EvidenceTaskDefinition = {
  taskId: 'task-mixed-review',
  taskType: 'MIXED_DOCUMENT_REVIEW',
  purpose: 'Establish ending cash and summarize a disclosure section.',
  availableCapabilities: ['BANK_ENDING_BALANCE', 'DISCLOSURE_NARRATIVE'],
  conclusions: [
    { conclusionId: 'cash', label: 'Ending cash', requiredCapabilities: ['BANK_ENDING_BALANCE'] },
    { conclusionId: 'disclosure', label: 'Disclosure summary', requiredCapabilities: ['DISCLOSURE_NARRATIVE'] },
  ],
};
const mixed = engine.evaluate({
  task: mixedTask,
  gaps: [{
    gapId: 'gap-disclosure-section',
    gapType: 'MISSING_SECTION',
    description: 'The requested disclosure section is missing.',
    affectedCapabilities: ['DISCLOSURE_NARRATIVE'],
    explicitMateriality: 'MATERIAL',
    evidenceRefs: ['toc-disclosure-ref'],
  }],
});
assert.deepEqual(mixed.allowedConclusionIds, ['cash']);
assert.deepEqual(mixed.blockedConclusionIds, ['disclosure']);
assert.equal(mixed.taskEvidenceSufficiencyState, 'INSUFFICIENT_FOR_CURRENT_PURPOSE');

// 7. Existing document completeness gaps with unknown scope feed the same fail-safe materiality review.
const completenessDriven = engine.evaluate({
  task: cashTask(),
  completenessRecords: [{
    documentId: 'doc-bank-statement',
    recordId: 'comp-bank',
    filename: 'Bank_Statement.pdf',
    overallCoverage: 97.4,
    completionStatus: 'PARTIAL_EXTRACTION',
    unsupportedElements: 0,
    unclassifiedElements: 0,
  }],
});
assert.equal(completenessDriven.sourceCompletenessState, 'SOURCE_GAP_UNKNOWN_MATERIALITY');
assert.equal(completenessDriven.taskEvidenceSufficiencyState, 'REVIEW_REQUIRED_TO_DETERMINE_MATERIALITY');
assert.ok(completenessDriven.evidenceRefs.includes('comp-bank'));

// 8. Decisions can be durably persisted and read back without changing the result.
const persisted = engine.evaluate({ task: cashTask(), persist: true });
const readback = engine.getDecision(persisted.decisionId);
assert.equal(readback?.decisionHash, persisted.decisionHash);
assert.equal(engine.listDecisions({ engagementId: 'eng-synthetic' }).some(r => r.decisionId === persisted.decisionId), true);

fs.rmSync(tmp, { recursive: true, force: true });
console.log('TASK_EVIDENCE_SUFFICIENCY_TESTS=PASS');
