import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { academyMinervaLab } from '../cpaOrganization/academyMinervaLab.js';
import { buildLongDocumentSemanticTargetChecks } from '../cpaOrganization/longDocumentSemanticContextEngine.js';

const dir = process.env.LONG_DOCUMENT_ACCEPTANCE_DIR || '/tmp/eve-long-document-semantic';
const truth = JSON.parse(fs.readFileSync(path.join(dir, 'source-semantic-truth.json'), 'utf8'));
assert.equal(truth.marker, 'P2_LONG_DOCUMENT_SEMANTIC_SOURCE_TRUTH=PASS');
const checks = buildLongDocumentSemanticTargetChecks(truth.review);
const report = academyMinervaLab.evaluateFiveDimensions({
  caseId: 'CURR-SEMANTIC-LONG-DOCUMENT',
  executionId: 'long-document-semantic-physical',
  dimensions: {
    SOURCE_COVERAGE: { checks: checks.source },
    SEMANTIC_UNDERSTANDING: { checks: checks.semantic },
    ACCOUNTING_ACCURACY: { checks: [{ checkId: 'long-document-accounting-not-targeted', label: 'Accounting Accuracy is outside this semantic-context fixture', outcome: 'NOT_TESTED', details: ['This case tests semantic attribution/context boundaries, not numeric accounting conclusions.'] }] },
    PRODUCT_TRUTH: { checks: [{ checkId: 'long-document-product-not-targeted', label: 'Product Truth is outside this semantic-context fixture', outcome: 'NOT_TESTED', details: ['Real dashboard Product Truth is a separate curated curriculum case.'] }] },
    DELIVERABLE_TRUTH: { checks: [{ checkId: 'long-document-deliverable-not-targeted', label: 'Deliverable Truth is outside this semantic-context fixture', outcome: 'NOT_TESTED', details: ['Final export lineage is a separate curated curriculum case.'] }] },
  },
});
assert.equal(report.dimensions.SOURCE_COVERAGE.status, 'PASS');
assert.equal(report.dimensions.SEMANTIC_UNDERSTANDING.status, 'PASS');
assert.equal(report.dimensions.ACCOUNTING_ACCURACY.status, 'NOT_TESTED');
assert.equal(report.dimensions.PRODUCT_TRUTH.status, 'NOT_TESTED');
assert.equal(report.dimensions.DELIVERABLE_TRUTH.status, 'NOT_TESTED');
assert.equal(report.passedDimensionCount, 2);
assert.equal(report.notTestedDimensionCount, 3);
assert.equal(report.overallStatus, 'INCOMPLETE_DIMENSION_COVERAGE');
fs.writeFileSync(path.join(dir, 'targeted-dimension-result.json'), JSON.stringify({ marker: 'P2_LONG_DOCUMENT_SEMANTIC_TARGETED_DIMENSIONS=PASS', report }, null, 2));
console.log('P2_LONG_DOCUMENT_SEMANTIC_TARGETED_DIMENSIONS=PASS');
