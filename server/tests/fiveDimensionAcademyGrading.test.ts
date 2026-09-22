import assert from 'node:assert/strict';
import { academyMinervaLab, type FiveDimensionEvaluationInput } from '../cpaOrganization/academyMinervaLab.js';

const passChecks = (prefix: string) => ({
  checks: [{ checkId: `${prefix}-1`, label: `${prefix} check`, outcome: 'PASS' as const, evidenceRefs: [`${prefix}-evidence`] }]
});
const notTested = (prefix: string) => ({
  checks: [{ checkId: `${prefix}-nt`, label: `${prefix} not tested`, outcome: 'NOT_TESTED' as const, details: [`${prefix} fixture did not exercise this assertion.`] }]
});

const perfect: FiveDimensionEvaluationInput = {
  caseId: 'P2-FIVE-DIM-PERFECT',
  executionId: 'exec-perfect',
  dimensions: {
    SOURCE_COVERAGE: passChecks('source'),
    SEMANTIC_UNDERSTANDING: passChecks('semantic'),
    ACCOUNTING_ACCURACY: passChecks('accounting'),
    PRODUCT_TRUTH: passChecks('product'),
    DELIVERABLE_TRUTH: passChecks('deliverable')
  }
};
const perfectReport = academyMinervaLab.evaluateFiveDimensions(perfect);
assert.equal(perfectReport.overallStatus, 'FIVE_DIMENSION_PASS');
assert.equal(perfectReport.fullyTested, true);
assert.equal(perfectReport.allRequiredDimensionsPassed, true);
assert.equal(perfectReport.testedDimensionCount, 5);
assert.equal(perfectReport.passedDimensionCount, 5);
assert.equal(perfectReport.failedDimensionCount, 0);
assert.equal(perfectReport.notTestedDimensionCount, 0);
assert.equal(perfectReport.testedOnlyAverageScore, 100);
assert.equal((perfectReport as any).overallScore, undefined);

// NOT_TESTED is never PASS and never creates a perfect five-dimension result.
const semanticUntested = academyMinervaLab.evaluateFiveDimensions({
  ...perfect,
  caseId: 'P2-FIVE-DIM-INCOMPLETE',
  dimensions: { ...perfect.dimensions, SEMANTIC_UNDERSTANDING: notTested('semantic') }
});
assert.equal(semanticUntested.overallStatus, 'INCOMPLETE_DIMENSION_COVERAGE');
assert.equal(semanticUntested.allRequiredDimensionsPassed, false);
assert.equal(semanticUntested.dimensions.SEMANTIC_UNDERSTANDING.status, 'NOT_TESTED');
assert.equal(semanticUntested.dimensions.SEMANTIC_UNDERSTANDING.score, null);
assert.equal(semanticUntested.notTestedDimensionCount, 1);
assert.equal(semanticUntested.testedDimensionCount, 4);
assert.equal(semanticUntested.testedOnlyAverageScore, 100);

// PASS assertions must carry evidence; missing evidence becomes a dimension defect/failure.
const evidenceMissing = academyMinervaLab.evaluateFiveDimensions({
  ...perfect,
  caseId: 'P2-FIVE-DIM-EVIDENCE-REQUIRED',
  dimensions: {
    ...perfect.dimensions,
    ACCOUNTING_ACCURACY: { checks: [{ checkId: 'accounting-no-evidence', label: 'Accounting answer is correct', outcome: 'PASS' }] }
  }
});
assert.equal(evidenceMissing.dimensions.ACCOUNTING_ACCURACY.status, 'FAIL');
assert.equal(evidenceMissing.overallStatus, 'FIVE_DIMENSION_FAIL');
assert.equal(evidenceMissing.allRequiredDimensionsPassed, false);
assert.deepEqual(evidenceMissing.dimensions.ACCOUNTING_ACCURACY.failedAssertions, ['accounting-no-evidence']);
assert.ok(evidenceMissing.dimensions.ACCOUNTING_ACCURACY.defects.some(d => d.includes('EVIDENCE_REQUIRED_FOR_PASS')));

// Product Truth can fail independently while Accounting Accuracy passes.
const productFailure = academyMinervaLab.evaluateFiveDimensions({
  ...perfect,
  caseId: 'P2-FIVE-DIM-PRODUCT-FAIL',
  dimensions: {
    ...perfect.dimensions,
    PRODUCT_TRUTH: { checks: [{ checkId: 'browser-render', label: 'Actual browser value matches canonical fact', outcome: 'FAIL', evidenceRefs: ['browser-proof-1'], details: ['Rendered value drifted from canonical fact.'] }] }
  }
});
assert.equal(productFailure.dimensions.ACCOUNTING_ACCURACY.status, 'PASS');
assert.equal(productFailure.dimensions.PRODUCT_TRUTH.status, 'FAIL');
assert.equal(productFailure.overallStatus, 'FIVE_DIMENSION_FAIL');

// Deliverable Truth can fail independently of Product Truth and Accounting Accuracy.
const deliverableFailure = academyMinervaLab.evaluateFiveDimensions({
  ...perfect,
  caseId: 'P2-FIVE-DIM-DELIVERABLE-FAIL',
  dimensions: {
    ...perfect.dimensions,
    DELIVERABLE_TRUTH: { checks: [{ checkId: 'export-lineage', label: 'Final export preserves evidence lineage', outcome: 'FAIL', evidenceRefs: ['export-proof-1'], details: ['Export omitted a required source reference.'] }] }
  }
});
assert.equal(deliverableFailure.dimensions.ACCOUNTING_ACCURACY.status, 'PASS');
assert.equal(deliverableFailure.dimensions.PRODUCT_TRUTH.status, 'PASS');
assert.equal(deliverableFailure.dimensions.DELIVERABLE_TRUTH.status, 'FAIL');
assert.equal(deliverableFailure.overallStatus, 'FIVE_DIMENSION_FAIL');

// Source Coverage can fail independently.
const sourceFailure = academyMinervaLab.evaluateFiveDimensions({
  ...perfect,
  caseId: 'P2-FIVE-DIM-SOURCE-FAIL',
  dimensions: {
    ...perfect.dimensions,
    SOURCE_COVERAGE: { checks: [{ checkId: 'page-gap', label: 'All required pages accounted for', outcome: 'FAIL', evidenceRefs: ['page-census-1'], details: ['Pages 4-5 are missing.'] }] }
  }
});
assert.equal(sourceFailure.dimensions.SOURCE_COVERAGE.status, 'FAIL');
assert.equal(sourceFailure.dimensions.ACCOUNTING_ACCURACY.status, 'PASS');
assert.equal(sourceFailure.overallStatus, 'FIVE_DIMENSION_FAIL');

// Source Coverage can also remain NOT_TESTED independently.
const sourceUntested = academyMinervaLab.evaluateFiveDimensions({
  ...perfect,
  caseId: 'P2-FIVE-DIM-SOURCE-NOT-TESTED',
  dimensions: { ...perfect.dimensions, SOURCE_COVERAGE: notTested('source') }
});
assert.equal(sourceUntested.dimensions.SOURCE_COVERAGE.status, 'NOT_TESTED');
assert.equal(sourceUntested.overallStatus, 'INCOMPLETE_DIMENSION_COVERAGE');

// Tested-only average excludes NOT_TESTED dimensions instead of treating them as implicit 100s.
const noInflation = academyMinervaLab.evaluateFiveDimensions({
  caseId: 'P2-FIVE-DIM-NO-INFLATION',
  dimensions: {
    SOURCE_COVERAGE: { checks: [
      { checkId: 'source-pass', label: 'One source assertion passed', outcome: 'PASS', evidenceRefs: ['source-pass-evidence'] },
      { checkId: 'source-fail', label: 'One source assertion failed', outcome: 'FAIL', evidenceRefs: ['source-fail-evidence'] }
    ] },
    SEMANTIC_UNDERSTANDING: notTested('semantic'),
    ACCOUNTING_ACCURACY: notTested('accounting'),
    PRODUCT_TRUTH: notTested('product'),
    DELIVERABLE_TRUTH: notTested('deliverable')
  }
});
assert.equal(noInflation.dimensions.SOURCE_COVERAGE.score, 50);
assert.equal(noInflation.testedOnlyAverageScore, 50);
assert.equal(noInflation.testedDimensionCount, 1);
assert.equal(noInflation.notTestedDimensionCount, 4);
assert.equal(noInflation.allRequiredDimensionsPassed, false);

const latest = academyMinervaLab.getLatestFiveDimensionEvaluation();
assert.equal(latest?.caseId, 'P2-FIVE-DIM-NO-INFLATION');
assert.ok(academyMinervaLab.getFiveDimensionHistory().length >= 7);

console.log('FIVE_DIMENSION_ACADEMY_GRADING_TESTS=PASS');
