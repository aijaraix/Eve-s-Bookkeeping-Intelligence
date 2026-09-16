import assert from 'node:assert/strict';
import fs from 'node:fs';
import { academyMinervaLab } from '../cpaOrganization/academyMinervaLab.js';

const cases = academyMinervaLab.getFiveDimensionCurriculumCases();
const coverage = academyMinervaLab.getFiveDimensionCurriculumCoverage();

assert.equal(cases.length, 20);
assert.equal(new Set(cases.map(c => c.caseId)).size, 20);
assert.equal(coverage.totalCases, 20);
assert.equal(coverage.contractReadyCases, 17);
assert.equal(coverage.physicalFixturePendingCases, 3);
assert.equal(coverage.autonomousEligibleCases, 0, 'new curriculum cases must not silently enter autonomous scheduling');

const requiredIds = [
  'CURR-OCR-RECEIPT-PHOTO',
  'CURR-OCR-SCANNED-INVOICE',
  'CURR-OCR-IMAGE-ONLY-PDF',
  'CURR-OCR-LOW-QUALITY-SCAN',
  'CURR-OCR-ROTATED-SKEWED',
  'CURR-OCR-GLARE-CROP',
  'CURR-OCR-ENGINE-DISAGREEMENT',
  'CURR-SUFF-MISSING-PAGE-NON-MATERIAL',
  'CURR-SUFF-MISSING-TRANSACTION-MATERIAL',
  'CURR-SUFF-MISSING-PAGE-UNKNOWN',
  'CURR-MIXED-SOURCE-BATCH',
  'CURR-MIXED-SPREADSHEET-RECEIPT',
  'CURR-SPREADSHEET-GL-TRIAL-BALANCE',
  'CURR-PBC-INSUFFICIENT-RESPONSE',
  'CURR-PBC-RESOLVES-AFTER-REEVALUATION',
  'CURR-EVIDENCE-DUPLICATE-NEAR-DUPLICATE',
  'CURR-ISOLATION-BULK-MIXED-CLIENT',
  'CURR-SEMANTIC-LONG-DOCUMENT',
  'CURR-PRODUCT-SOURCE-TO-DASHBOARD',
  'CURR-DELIVERABLE-FINAL-LINEAGE'
];
for (const id of requiredIds) assert.ok(cases.some(c => c.caseId === id), `missing curated case ${id}`);

for (const c of cases) {
  assert.equal(c.autonomousEligible, false);
  assert.ok(c.targetDimensions.length > 0, `${c.caseId} must target at least one dimension`);
  assert.ok(c.expectedSafeguards.length > 0, `${c.caseId} must define expected safeguards`);
  assert.ok(['CONTRACT_READY', 'PHYSICAL_FIXTURE_REQUIRED'].includes(c.fixtureStatus));
}

for (const dimension of ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH'] as const) {
  assert.ok(coverage.targetDimensionCounts[dimension] > 0, `${dimension} needs curriculum coverage`);
}

const find = (id: string) => cases.find(c => c.caseId === id)!;
assert.equal(find('CURR-OCR-RECEIPT-PHOTO').fixtureStatus, 'CONTRACT_READY');
assert.deepEqual(find('CURR-OCR-RECEIPT-PHOTO').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);
assert.equal(find('CURR-OCR-SCANNED-INVOICE').fixtureStatus, 'CONTRACT_READY');
assert.deepEqual(find('CURR-OCR-SCANNED-INVOICE').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);
assert.ok(find('CURR-OCR-SCANNED-INVOICE').expectedSafeguards.join(' ').includes('payment remains BLOCKED'));
assert.equal(find('CURR-OCR-IMAGE-ONLY-PDF').fixtureStatus, 'CONTRACT_READY');
assert.deepEqual(find('CURR-OCR-IMAGE-ONLY-PDF').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY']);
assert.ok(find('CURR-OCR-IMAGE-ONLY-PDF').expectedSafeguards.join(' ').includes('mixed PDFs'));
assert.ok(find('CURR-OCR-IMAGE-ONLY-PDF').validationRefs.includes('server/tests/mixedPdfSelectiveOcr.test.ts'));
assert.equal(find('CURR-SUFF-MISSING-PAGE-NON-MATERIAL').fixtureStatus, 'CONTRACT_READY');
assert.ok(find('CURR-SUFF-MISSING-PAGE-NON-MATERIAL').expectedSafeguards.join(' ').includes('Persist the source gap'));
assert.ok(find('CURR-SUFF-MISSING-TRANSACTION-MATERIAL').expectedSafeguards.join(' ').includes('Block the affected'));
assert.ok(find('CURR-SUFF-MISSING-PAGE-UNKNOWN').expectedSafeguards.join(' ').includes('review required'));
assert.ok(find('CURR-SUFF-MISSING-PAGE-NON-MATERIAL').sourceKinds.includes('BANK_STATEMENT'));
assert.ok(find('CURR-SUFF-MISSING-TRANSACTION-MATERIAL').sourceKinds.includes('BANK_STATEMENT'));
assert.deepEqual(find('CURR-SUFF-MISSING-TRANSACTION-MATERIAL').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);
assert.ok(find('CURR-SUFF-MISSING-TRANSACTION-MATERIAL').validationRefs.includes('server/tests/bankStatementFiveDimensionAcceptance.test.ts'));
assert.ok(find('CURR-SUFF-MISSING-PAGE-UNKNOWN').sourceKinds.includes('BANK_STATEMENT'));
assert.equal(find('CURR-MIXED-SOURCE-BATCH').fixtureStatus, 'CONTRACT_READY');
assert.deepEqual(find('CURR-MIXED-SOURCE-BATCH').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);
assert.ok(find('CURR-MIXED-SOURCE-BATCH').expectedSafeguards.join(' ').includes('Cross-document coordinate'));
assert.ok(find('CURR-MIXED-SOURCE-BATCH').validationRefs.includes('server/tests/mixedSourceBatchFiveDimensionAcceptance.test.ts'));
assert.equal(find('CURR-MIXED-SPREADSHEET-RECEIPT').fixtureStatus, 'CONTRACT_READY');
assert.deepEqual(find('CURR-MIXED-SPREADSHEET-RECEIPT').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);
assert.ok(find('CURR-MIXED-SPREADSHEET-RECEIPT').expectedSafeguards.join(' ').includes('block canonical promotion'));
assert.ok(find('CURR-MIXED-SPREADSHEET-RECEIPT').validationRefs.includes('server/tests/mixedSpreadsheetReceiptFiveDimensionAcceptance.test.ts'));
assert.equal(find('CURR-SPREADSHEET-GL-TRIAL-BALANCE').fixtureStatus, 'CONTRACT_READY');
assert.deepEqual(find('CURR-SPREADSHEET-GL-TRIAL-BALANCE').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);
assert.ok(find('CURR-SPREADSHEET-GL-TRIAL-BALANCE').expectedSafeguards.join(' ').includes('stale cached formula'));
assert.ok(find('CURR-SPREADSHEET-GL-TRIAL-BALANCE').validationRefs.includes('server/tests/trialBalanceFiveDimensionAcceptance.test.ts'));
assert.equal(find('CURR-OCR-LOW-QUALITY-SCAN').fixtureStatus, 'CONTRACT_READY');
assert.ok(find('CURR-OCR-LOW-QUALITY-SCAN').validationRefs.includes('server/tests/ocrEdgeCasesCurriculumAcceptance.test.ts'));
assert.equal(find('CURR-OCR-ROTATED-SKEWED').fixtureStatus, 'CONTRACT_READY');
assert.ok(find('CURR-OCR-ROTATED-SKEWED').validationRefs.includes('server/tests/ocrOrientationRetry.test.ts'));
assert.equal(find('CURR-OCR-GLARE-CROP').fixtureStatus, 'CONTRACT_READY');
assert.ok(find('CURR-OCR-GLARE-CROP').validationRefs.includes('server/tests/taskEvidenceSufficiency.test.ts'));
assert.equal(find('CURR-OCR-ENGINE-DISAGREEMENT').fixtureStatus, 'CONTRACT_READY');
assert.ok(find('CURR-OCR-ENGINE-DISAGREEMENT').expectedSafeguards.join(' ').includes('Preserve both engine outputs'));
assert.ok(find('CURR-OCR-ENGINE-DISAGREEMENT').validationRefs.includes('server/tests/academyOcrCurriculumRunner.test.ts'));
assert.ok(find('CURR-PBC-INSUFFICIENT-RESPONSE').expectedSafeguards.join(' ').includes('not automatic clearance'));
assert.ok(find('CURR-PBC-INSUFFICIENT-RESPONSE').expectedSafeguards.join(' ').includes('remains unresolved'));
assert.ok(find('CURR-PBC-RESOLVES-AFTER-REEVALUATION').expectedSafeguards.join(' ').includes('every affected conclusion ALLOWED'));
assert.equal(find('CURR-EVIDENCE-DUPLICATE-NEAR-DUPLICATE').fixtureStatus, 'CONTRACT_READY');
assert.deepEqual(find('CURR-EVIDENCE-DUPLICATE-NEAR-DUPLICATE').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);
assert.ok(find('CURR-EVIDENCE-DUPLICATE-NEAR-DUPLICATE').expectedSafeguards.join(' ').includes('Cosmetic-only near-duplicates'));
assert.ok(find('CURR-EVIDENCE-DUPLICATE-NEAR-DUPLICATE').validationRefs.includes('server/tests/duplicateEvidenceFiveDimensionAcceptance.test.ts'));
assert.equal(find('CURR-ISOLATION-BULK-MIXED-CLIENT').fixtureStatus, 'CONTRACT_READY');
assert.deepEqual(find('CURR-ISOLATION-BULK-MIXED-CLIENT').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);
assert.ok(find('CURR-ISOLATION-BULK-MIXED-CLIENT').expectedSafeguards.join(' ').includes('clarification and rendered value'));
assert.ok(find('CURR-ISOLATION-BULK-MIXED-CLIENT').validationRefs.includes('server/tests/clientIsolationFiveDimensionAcceptance.test.ts'));
assert.ok(find('CURR-PRODUCT-SOURCE-TO-DASHBOARD').expectedSafeguards.join(' ').includes('actual browser-rendered value'));
assert.ok(find('CURR-DELIVERABLE-FINAL-LINEAGE').expectedSafeguards.join(' ').includes('reverse-trace'));

const routeText = fs.readFileSync('server/cpaOrganization/cpaOrganizationRoutes.ts', 'utf8');
assert.ok(routeText.includes('fiveDimensionCurriculum'));
assert.ok(routeText.includes('fiveDimensionCurriculumCoverage'));

const uiText = fs.readFileSync('src/components/views/eve/observatory/CurriculumTab.tsx', 'utf8');
assert.ok(uiText.includes('Five-Dimension Curriculum Queue'));
assert.ok(uiText.includes('Autonomous scheduler: NOT ELIGIBLE'));
assert.ok(uiText.includes('physical fixture required'));
assert.ok(uiText.includes('This catalog does not convert a specification into a pass.'));

console.log('FIVE_DIMENSION_ACADEMY_CURRICULUM_TESTS=PASS');
