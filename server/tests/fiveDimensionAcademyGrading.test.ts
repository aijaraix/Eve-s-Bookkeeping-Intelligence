import assert from 'node:assert/strict';
import { academyMinervaLab, type FiveDimensionEvaluationInput } from '../cpaOrganization/academyMinervaLab.js';
const passChecks = (prefix: string) => ({ checks: [{ checkId: `${prefix}-1`, label: `${prefix} check`, outcome: 'PASS' as const, evidenceRefs: [`${prefix}-evidence`] }] });
const perfect: FiveDimensionEvaluationInput = { caseId: 'P2-FIVE-DIM-PERFECT', executionId: 'exec-perfect', dimensions: {
  SOURCE_COVERAGE: passChecks('source'), SEMANTIC_UNDERSTANDING: passChecks('semantic'), ACCOUNTING_ACCURACY: passChecks('accounting'), PRODUCT_TRUTH: passChecks('product'), DELIVERABLE_TRUTH: passChecks('deliverable')
}};
const perfectReport = academyMinervaLab.evaluateFiveDimensions(perfect);
assert.equal(perfectReport.overallStatus, 'FIVE_DIMENSION_PASS');
assert.equal(perfectReport.fullyTested, true);
assert.equal(perfectReport.passedDimensions.length, 5);
assert.equal((perfectReport as any).overallScore, undefined);
const missingSource = academyMinervaLab.evaluateFiveDimensions({ ...perfect, caseId: 'P2-FIVE-DIM-SOURCE-FAIL', dimensions: { ...perfect.dimensions, SOURCE_COVERAGE: { checks: [{ checkId: 'page-gap', label: 'All expected pages present', outcome: 'FAIL', evidenceRefs: ['page-index'], details: ['Pages 4-5 are missing.'] }] } } });
assert.equal(missingSource.overallStatus, 'FIVE_DIMENSION_FAIL');
assert.equal(missingSource.dimensions.SOURCE_COVERAGE.status, 'FAIL');
assert.equal(missingSource.dimensions.ACCOUNTING_ACCURACY.status, 'PASS');
const semanticUntested = academyMinervaLab.evaluateFiveDimensions({ ...perfect, caseId: 'P2-FIVE-DIM-INCOMPLETE', dimensions: { ...perfect.dimensions, SEMANTIC_UNDERSTANDING: { checks: [{ checkId: 'semantic-rubric', label: 'Independent semantic rubric', outcome: 'NOT_TESTED', details: ['Case did not include a semantic answer key.'] }] } } });
assert.equal(semanticUntested.overallStatus, 'INCOMPLETE_DIMENSION_COVERAGE');
assert.equal(semanticUntested.fullyTested, false);
assert.equal(semanticUntested.dimensions.SEMANTIC_UNDERSTANDING.status, 'NOT_TESTED');
const productPartial = academyMinervaLab.evaluateFiveDimensions({ ...perfect, caseId: 'P2-FIVE-DIM-PRODUCT-PARTIAL', dimensions: { ...perfect.dimensions, PRODUCT_TRUTH: { checks: [ { checkId: 'server-map', label: 'Server presentation map exists', outcome: 'PASS' }, { checkId: 'browser-proof', label: 'Real browser render verified', outcome: 'NOT_TESTED' } ] } } });
assert.equal(productPartial.dimensions.PRODUCT_TRUTH.status, 'PARTIAL');
assert.equal(productPartial.overallStatus, 'INCOMPLETE_DIMENSION_COVERAGE');
const review = academyMinervaLab.evaluateFiveDimensions({ ...perfect, caseId: 'P2-FIVE-DIM-REVIEW', dimensions: { ...perfect.dimensions, SEMANTIC_UNDERSTANDING: { checks: [{ checkId: 'ambiguous-entity', label: 'Entity identity established', outcome: 'REVIEW_REQUIRED', evidenceRefs: ['entity-gap'] }] } } });
assert.equal(review.overallStatus, 'REVIEW_REQUIRED');
assert.equal(review.dimensions.SEMANTIC_UNDERSTANDING.status, 'REVIEW_REQUIRED');
console.log('FIVE_DIMENSION_ACADEMY_GRADING_TESTS=PASS');
