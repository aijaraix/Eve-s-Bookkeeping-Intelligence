import assert from 'node:assert/strict';
import fs from 'node:fs';

const curriculum = fs.readFileSync('src/components/views/eve/observatory/CurriculumTab.tsx', 'utf8');
for (const term of ['Source Coverage', 'Semantic Understanding', 'Accounting Accuracy', 'Product Truth', 'Deliverable Truth', 'NOT TESTED']) {
  assert.ok(curriculum.includes(term), `Curriculum UI missing: ${term}`);
}
assert.ok(curriculum.includes("status === 'PASS'"));
assert.ok(curriculum.includes("status === 'FAIL'"));
assert.ok(curriculum.includes("status === 'NOT_TESTED'"));

const minervaUi = fs.readFileSync('src/components/views/eve/MinervaCertificationTab.tsx', 'utf8');
assert.ok(!minervaUi.includes('CERTIFIED 100%'));
assert.ok(!minervaUi.includes('Minerva Live Examination & Certification Suite'));
assert.ok(minervaUi.includes('not a CPA opinion or statutory professional certification'));

const routes = fs.readFileSync('server/cpaOrganization/cpaOrganizationRoutes.ts', 'utf8');
assert.ok(routes.includes("gradingModel: 'CASE_SCOPED_FIVE_DIMENSION'"));
assert.ok(routes.includes('latestFiveDimensionEvaluation'));
assert.ok(routes.includes('fiveDimensionHistory'));
assert.ok(routes.includes('allRequiredFiveDimensionsPassed'));
assert.ok(routes.includes('zeroToleranceCertified: null'));
assert.ok(routes.includes('numericErrorRate: null'));

console.log('FIVE_DIMENSION_ACADEMY_PRESENTATION_TESTS=PASS');
