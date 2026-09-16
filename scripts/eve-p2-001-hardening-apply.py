from pathlib import Path
import re


def replace_regex(path: str, pattern: str, replacement: str, flags=re.S):
    p = Path(path)
    text = p.read_text()
    new_text, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'REPLACE_FAILED:{path}:{pattern[:120]!r}:count={count}')
    p.write_text(new_text)


def replace_exact(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'MISSING_SNIPPET:{path}:{old[:160]!r}')
    p.write_text(text.replace(old, new, 1))


# ---------------------------------------------------------------------------
# P2-001 strict five-dimension Minerva contract
# ---------------------------------------------------------------------------
minerva_types = r'''export type FiveDimensionCheckOutcome = 'PASS' | 'FAIL' | 'NOT_TESTED';
export type FiveDimensionStatus = 'PASS' | 'FAIL' | 'NOT_TESTED';

export interface FiveDimensionCheck {
  checkId: string;
  label: string;
  outcome: FiveDimensionCheckOutcome;
  evidenceRefs?: string[];
  details?: string[];
  examinerNotes?: string[];
}

export interface FiveDimensionInput { checks: FiveDimensionCheck[]; }

export interface FiveDimensionEvaluationInput {
  caseId: string;
  executionId?: string;
  dimensions: Record<FiveDimensionName, FiveDimensionInput>;
}

export interface FiveDimensionGrade {
  dimension: FiveDimensionName;
  label: string;
  status: FiveDimensionStatus;
  score: number | null;
  evidenceRefs: string[];
  testedAssertions: string[];
  passedAssertions: string[];
  failedAssertions: string[];
  notTestedReason: string | null;
  defects: string[];
  examinerNotes: string[];
  totalChecks: number;
  testedChecks: number;
  passedChecks: number;
  failedChecks: number;
  notTestedChecks: number;
}

export interface FiveDimensionEvaluationReport {
  evaluationId: string;
  caseId: string;
  executionId?: string;
  runAt: string;
  overallStatus: 'FIVE_DIMENSION_PASS' | 'FIVE_DIMENSION_FAIL' | 'INCOMPLETE_DIMENSION_COVERAGE';
  fullyTested: boolean;
  allRequiredDimensionsPassed: boolean;
  testedDimensionCount: number;
  passedDimensionCount: number;
  failedDimensionCount: number;
  notTestedDimensionCount: number;
  testedOnlyAverageScore: number | null;
  dimensions: Record<FiveDimensionName, FiveDimensionGrade>;
  testedDimensions: FiveDimensionName[];
  passedDimensions: FiveDimensionName[];
  failedDimensions: FiveDimensionName[];
  notTestedDimensions: FiveDimensionName[];
  gradingRule: string;
}
'''
replace_regex(
    'server/cpaOrganization/academyMinervaLab.ts',
    r"export type FiveDimensionCheckOutcome = .*?\n\nexport class AcademyMinervaLab",
    minerva_types + "\nexport class AcademyMinervaLab",
)

minerva_methods = r'''  private gradeFiveDimension(dimension: FiveDimensionName, input: FiveDimensionInput): FiveDimensionGrade {
    const labels: Record<FiveDimensionName, string> = {
      SOURCE_COVERAGE: 'Source Coverage',
      SEMANTIC_UNDERSTANDING: 'Semantic Understanding',
      ACCOUNTING_ACCURACY: 'Accounting Accuracy',
      PRODUCT_TRUTH: 'Product Truth',
      DELIVERABLE_TRUTH: 'Deliverable Truth'
    };
    const checks = Array.isArray(input?.checks) ? input.checks : [];
    const notTested = checks.filter(c => c.outcome === 'NOT_TESTED');
    const tested = checks.filter(c => c.outcome !== 'NOT_TESTED');
    const explicitFailures = tested.filter(c => c.outcome === 'FAIL');
    const validPasses = tested.filter(c => c.outcome === 'PASS' && (c.evidenceRefs || []).some(ref => Boolean(String(ref || '').trim())));
    const passWithoutEvidence = tested.filter(c => c.outcome === 'PASS' && !(c.evidenceRefs || []).some(ref => Boolean(String(ref || '').trim())));
    const effectiveFailedChecks = [...explicitFailures, ...passWithoutEvidence];

    let status: FiveDimensionStatus;
    if (effectiveFailedChecks.length > 0) status = 'FAIL';
    else if (checks.length === 0 || notTested.length > 0) status = 'NOT_TESTED';
    else status = 'PASS';

    // A partially exercised dimension remains NOT_TESTED and receives no score.
    // This prevents a few successful assertions from inflating an incomplete dimension.
    const score = status === 'NOT_TESTED'
      ? null
      : tested.length > 0
        ? Number(((validPasses.length / tested.length) * 100).toFixed(1))
        : null;

    const evidenceRefs = [...new Set(checks.flatMap(c => c.evidenceRefs || []).map(ref => String(ref || '').trim()).filter(Boolean))];
    const testedAssertions = tested.map(c => c.checkId);
    const passedAssertions = validPasses.map(c => c.checkId);
    const failedAssertions = effectiveFailedChecks.map(c => c.checkId);
    const notTestedReasons = notTested.flatMap(c => (c.details && c.details.length ? c.details : [`${c.label} was not tested.`]));
    const defects = [
      ...explicitFailures.flatMap(c => (c.details && c.details.length ? c.details : [`${c.label}: FAIL`])),
      ...passWithoutEvidence.map(c => `${c.label}: EVIDENCE_REQUIRED_FOR_PASS`)
    ];
    const examinerNotes = checks.flatMap(c => c.examinerNotes || c.details || []);

    return {
      dimension,
      label: labels[dimension],
      status,
      score,
      evidenceRefs,
      testedAssertions,
      passedAssertions,
      failedAssertions,
      notTestedReason: notTestedReasons.length ? notTestedReasons.join(' | ') : null,
      defects,
      examinerNotes,
      totalChecks: checks.length,
      testedChecks: tested.length,
      passedChecks: validPasses.length,
      failedChecks: effectiveFailedChecks.length,
      notTestedChecks: notTested.length
    };
  }

  /** P2-001: five independent Academy quality dimensions. NOT_TESTED never becomes PASS. */
  public evaluateFiveDimensions(input: FiveDimensionEvaluationInput): FiveDimensionEvaluationReport {
    const names: FiveDimensionName[] = [
      'SOURCE_COVERAGE',
      'SEMANTIC_UNDERSTANDING',
      'ACCOUNTING_ACCURACY',
      'PRODUCT_TRUTH',
      'DELIVERABLE_TRUTH'
    ];
    const dimensions = Object.fromEntries(
      names.map(name => [name, this.gradeFiveDimension(name, input.dimensions[name])])
    ) as Record<FiveDimensionName, FiveDimensionGrade>;
    const passedDimensions = names.filter(name => dimensions[name].status === 'PASS');
    const failedDimensions = names.filter(name => dimensions[name].status === 'FAIL');
    const notTestedDimensions = names.filter(name => dimensions[name].status === 'NOT_TESTED');
    const testedDimensions = names.filter(name => dimensions[name].status !== 'NOT_TESTED');
    const testedScores = testedDimensions
      .map(name => dimensions[name].score)
      .filter((score): score is number => score !== null);
    const testedOnlyAverageScore = testedScores.length
      ? Number((testedScores.reduce((sum, score) => sum + score, 0) / testedScores.length).toFixed(1))
      : null;
    const fullyTested = notTestedDimensions.length === 0;
    const allRequiredDimensionsPassed = passedDimensions.length === names.length;
    const overallStatus: FiveDimensionEvaluationReport['overallStatus'] = failedDimensions.length > 0
      ? 'FIVE_DIMENSION_FAIL'
      : allRequiredDimensionsPassed
        ? 'FIVE_DIMENSION_PASS'
        : 'INCOMPLETE_DIMENSION_COVERAGE';

    const report: FiveDimensionEvaluationReport = {
      evaluationId: `five-dim-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      caseId: input.caseId,
      executionId: input.executionId,
      runAt: new Date().toISOString(),
      overallStatus,
      fullyTested,
      allRequiredDimensionsPassed,
      testedDimensionCount: testedDimensions.length,
      passedDimensionCount: passedDimensions.length,
      failedDimensionCount: failedDimensions.length,
      notTestedDimensionCount: notTestedDimensions.length,
      testedOnlyAverageScore,
      dimensions,
      testedDimensions,
      passedDimensions,
      failedDimensions,
      notTestedDimensions,
      gradingRule: 'Five independent dimensions. PASS requires evidence. Any failed dimension fails the case. Any untested assertion leaves its dimension NOT_TESTED. A case passes only when all five required dimensions PASS; NOT_TESTED dimensions never inflate the tested-only average.'
    };
    this.fiveDimensionHistory.unshift(report);
    if (this.fiveDimensionHistory.length > 100) this.fiveDimensionHistory = this.fiveDimensionHistory.slice(0, 100);
    return report;
  }

  public getFiveDimensionHistory(): FiveDimensionEvaluationReport[] {
    return this.fiveDimensionHistory.map(r => ({
      ...r,
      dimensions: Object.fromEntries(
        Object.entries(r.dimensions).map(([key, value]) => [key, { ...value }])
      ) as Record<FiveDimensionName, FiveDimensionGrade>
    }));
  }

  public getLatestFiveDimensionEvaluation(): FiveDimensionEvaluationReport | null {
    return this.fiveDimensionHistory[0] || null;
  }

'''
replace_regex(
    'server/cpaOrganization/academyMinervaLab.ts',
    r"  private gradeFiveDimension\(dimension: FiveDimensionName, input: FiveDimensionInput\): FiveDimensionGrade \{.*?\n  public evaluateAuthoritativePhysicalSource",
    minerva_methods + '  public evaluateAuthoritativePhysicalSource',
)

# ---------------------------------------------------------------------------
# Observatory read model: expose latest + bounded history; disable blanket
# legacy global certification semantics while preserving compatibility field.
# ---------------------------------------------------------------------------
replace_exact(
    'server/cpaOrganization/cpaOrganizationRoutes.ts',
    """      const recentEvents = observatoryEventLedger.getEvents({ limit: 50 });
      const latestFiveDimensionEvaluation = academyMinervaLab.getLatestFiveDimensionEvaluation();

      const stateObj = {
""",
    """      const recentEvents = observatoryEventLedger.getEvents({ limit: 50 });
      const latestFiveDimensionEvaluation = academyMinervaLab.getLatestFiveDimensionEvaluation();
      const fiveDimensionHistory = academyMinervaLab.getFiveDimensionHistory();

      const stateObj = {
""",
)
replace_exact(
    'server/cpaOrganization/cpaOrganizationRoutes.ts',
    """          latestFiveDimensionStatus: latestFiveDimensionEvaluation?.overallStatus || 'NOT_YET_EVALUATED',
          fullyTestedFiveDimensions: latestFiveDimensionEvaluation?.fullyTested || false,
          zeroToleranceCertified: latestFiveDimensionEvaluation?.overallStatus === 'FIVE_DIMENSION_PASS',
          numericErrorRate: null,
""",
    """          latestFiveDimensionStatus: latestFiveDimensionEvaluation?.overallStatus || 'NOT_YET_EVALUATED',
          fullyTestedFiveDimensions: latestFiveDimensionEvaluation?.fullyTested || false,
          allRequiredFiveDimensionsPassed: latestFiveDimensionEvaluation?.allRequiredDimensionsPassed || false,
          zeroToleranceCertified: null,
          zeroToleranceCertificationNote: 'Legacy global certification field disabled. Use case-scoped five-dimension evidence grading; this is an internal technical evaluation, not a CPA opinion or statutory professional certification.',
          numericErrorRate: null,
""",
)
replace_exact(
    'server/cpaOrganization/cpaOrganizationRoutes.ts',
    """        latestFiveDimensionEvaluation,
        currentEngagement,
""",
    """        latestFiveDimensionEvaluation,
        fiveDimensionHistory,
        currentEngagement,
""",
)

# ---------------------------------------------------------------------------
# UI language: technical evidence grading, never professional certification.
# ---------------------------------------------------------------------------
replace_exact(
    'src/components/views/eve/MinervaCertificationTab.tsx',
    'Minerva Live Examination & Certification Suite',
    'Minerva Technical Examination & Evidence Grading',
)
replace_exact(
    'src/components/views/eve/MinervaCertificationTab.tsx',
    """              Two-sided evaluation: Sealed ground truth strictly separated from solver prompt context
""",
    """              Two-sided internal technical evaluation with sealed ground truth separated from solver context — not a CPA opinion or statutory professional certification
""",
)
replace_exact(
    'src/components/views/eve/MinervaCertificationTab.tsx',
    """                {reconstructionReport.examinerCertification}
""",
    """                Internal technical result: {reconstructionReport.overallReconstructionScore === 1 ? 'PASSED' : 'REVIEW REQUIRED'}
""",
)

# Make incomplete dimensions visibly explicit even when some assertions ran.
replace_exact(
    'src/components/views/eve/observatory/CurriculumTab.tsx',
    """                <div className=\"text-[9px] text-slate-500\">{dim?.score == null ? 'No score — not fully tested' : `${dim.score}% of tested checks passed`}</div>
""",
    """                <div className=\"text-[9px] text-slate-500\">{status === 'NOT_TESTED' ? 'No dimension score — incomplete or not exercised' : dim?.score == null ? 'No tested score' : `${dim.score}% of tested assertions passed`}</div>
""",
)

# ---------------------------------------------------------------------------
# Deterministic acceptance tests for explicit handoff requirements.
# ---------------------------------------------------------------------------
Path('server/tests/fiveDimensionAcademyGrading.test.ts').write_text(r'''import assert from 'node:assert/strict';
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
''')

Path('server/tests/fiveDimensionAcademyPresentation.test.ts').write_text(r'''import assert from 'node:assert/strict';
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
''')

print('P2_001_HARDENING_PATCH_APPLIED')
