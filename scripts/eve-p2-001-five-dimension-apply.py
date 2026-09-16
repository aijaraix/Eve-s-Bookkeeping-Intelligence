from pathlib import Path


def edit(path, old, new, count=1):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"MISSING_SNIPPET:{path}:{old[:140]!r}")
    p.write_text(text.replace(old, new, count))


p = Path('server/cpaOrganization/academyMinervaLab.ts')
text = p.read_text()
marker = """export interface LiveEngagementValidationReport {
  validationId: string;
  runAt: string;
  certifiedStatus: 'TECHNICAL_VALIDATION_PASSED' | 'TECHNICAL_VALIDATION_FAILED' | 'DEFECT_DETECTED' | 'FAILED_CLOSED';
  physicalFileVerified: boolean;
  sha256Match: boolean;
  euclidIdentitySatisfied: boolean;
  varianceUsd: number;
  factsExtractedCount: number;
  details: string[];
  score: number;
}

"""
insert = marker + """export type FiveDimensionName =
  | 'SOURCE_COVERAGE'
  | 'SEMANTIC_UNDERSTANDING'
  | 'ACCOUNTING_ACCURACY'
  | 'PRODUCT_TRUTH'
  | 'DELIVERABLE_TRUTH';

export type FiveDimensionCheckOutcome = 'PASS' | 'FAIL' | 'REVIEW_REQUIRED' | 'NOT_TESTED';
export type FiveDimensionStatus = 'PASS' | 'FAIL' | 'REVIEW_REQUIRED' | 'PARTIAL' | 'NOT_TESTED';

export interface FiveDimensionCheck {
  checkId: string;
  label: string;
  outcome: FiveDimensionCheckOutcome;
  evidenceRefs?: string[];
  details?: string[];
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
  totalChecks: number;
  testedChecks: number;
  passedChecks: number;
  failedChecks: number;
  reviewRequiredChecks: number;
  notTestedChecks: number;
  evidenceRefs: string[];
  findings: string[];
}

export interface FiveDimensionEvaluationReport {
  evaluationId: string;
  caseId: string;
  executionId?: string;
  runAt: string;
  overallStatus: 'FIVE_DIMENSION_PASS' | 'FIVE_DIMENSION_FAIL' | 'REVIEW_REQUIRED' | 'INCOMPLETE_DIMENSION_COVERAGE';
  fullyTested: boolean;
  dimensions: Record<FiveDimensionName, FiveDimensionGrade>;
  testedDimensions: FiveDimensionName[];
  passedDimensions: FiveDimensionName[];
  failedDimensions: FiveDimensionName[];
  reviewRequiredDimensions: FiveDimensionName[];
  incompleteDimensions: FiveDimensionName[];
  gradingRule: string;
}

"""
if marker not in text:
    raise SystemExit('minerva interface marker missing')
text = text.replace(marker, insert, 1)
text = text.replace("  private evaluationHistory: EvaluationReport[] = [];\n", "  private evaluationHistory: EvaluationReport[] = [];\n  private fiveDimensionHistory: FiveDimensionEvaluationReport[] = [];\n", 1)
method_marker = "  public evaluateAuthoritativePhysicalSource(filePath: string): {\n"
method = """  private gradeFiveDimension(dimension: FiveDimensionName, input: FiveDimensionInput): FiveDimensionGrade {
    const labels: Record<FiveDimensionName, string> = {
      SOURCE_COVERAGE: 'Source Coverage',
      SEMANTIC_UNDERSTANDING: 'Semantic Understanding',
      ACCOUNTING_ACCURACY: 'Accounting Accuracy',
      PRODUCT_TRUTH: 'Product Truth',
      DELIVERABLE_TRUTH: 'Deliverable Truth'
    };
    const checks = Array.isArray(input?.checks) ? input.checks : [];
    const tested = checks.filter(c => c.outcome !== 'NOT_TESTED');
    const passed = tested.filter(c => c.outcome === 'PASS');
    const failed = tested.filter(c => c.outcome === 'FAIL');
    const review = tested.filter(c => c.outcome === 'REVIEW_REQUIRED');
    const notTested = checks.filter(c => c.outcome === 'NOT_TESTED');
    let status: FiveDimensionStatus;
    if (tested.length === 0) status = 'NOT_TESTED';
    else if (failed.length > 0) status = 'FAIL';
    else if (review.length > 0) status = 'REVIEW_REQUIRED';
    else if (notTested.length > 0) status = 'PARTIAL';
    else status = 'PASS';
    const score = tested.length > 0 ? Number(((passed.length / tested.length) * 100).toFixed(1)) : null;
    return {
      dimension, label: labels[dimension], status, score,
      totalChecks: checks.length, testedChecks: tested.length, passedChecks: passed.length,
      failedChecks: failed.length, reviewRequiredChecks: review.length, notTestedChecks: notTested.length,
      evidenceRefs: [...new Set(checks.flatMap(c => c.evidenceRefs || []).filter(Boolean))],
      findings: checks.filter(c => c.outcome !== 'PASS').flatMap(c => (c.details && c.details.length ? c.details : [`${c.label}: ${c.outcome}`]))
    };
  }

  /** P2-001: five independent Academy quality dimensions. No generic weighted accuracy score. */
  public evaluateFiveDimensions(input: FiveDimensionEvaluationInput): FiveDimensionEvaluationReport {
    const names: FiveDimensionName[] = ['SOURCE_COVERAGE','SEMANTIC_UNDERSTANDING','ACCOUNTING_ACCURACY','PRODUCT_TRUTH','DELIVERABLE_TRUTH'];
    const dimensions = Object.fromEntries(names.map(name => [name, this.gradeFiveDimension(name, input.dimensions[name])])) as Record<FiveDimensionName, FiveDimensionGrade>;
    const passedDimensions = names.filter(name => dimensions[name].status === 'PASS');
    const failedDimensions = names.filter(name => dimensions[name].status === 'FAIL');
    const reviewRequiredDimensions = names.filter(name => dimensions[name].status === 'REVIEW_REQUIRED');
    const incompleteDimensions = names.filter(name => dimensions[name].status === 'NOT_TESTED' || dimensions[name].status === 'PARTIAL');
    const testedDimensions = names.filter(name => dimensions[name].status !== 'NOT_TESTED');
    const fullyTested = incompleteDimensions.length === 0;
    const overallStatus: FiveDimensionEvaluationReport['overallStatus'] = failedDimensions.length > 0
      ? 'FIVE_DIMENSION_FAIL'
      : reviewRequiredDimensions.length > 0
        ? 'REVIEW_REQUIRED'
        : !fullyTested ? 'INCOMPLETE_DIMENSION_COVERAGE' : 'FIVE_DIMENSION_PASS';
    const report: FiveDimensionEvaluationReport = {
      evaluationId: `five-dim-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      caseId: input.caseId, executionId: input.executionId, runAt: new Date().toISOString(),
      overallStatus, fullyTested, dimensions, testedDimensions, passedDimensions, failedDimensions,
      reviewRequiredDimensions, incompleteDimensions,
      gradingRule: 'Five independent dimensions; no weighted overall accuracy score. Any failed dimension fails the evaluation; review-required remains review; untested/partial dimensions make coverage incomplete.'
    };
    this.fiveDimensionHistory.unshift(report);
    if (this.fiveDimensionHistory.length > 100) this.fiveDimensionHistory = this.fiveDimensionHistory.slice(0, 100);
    return report;
  }

  public getFiveDimensionHistory(): FiveDimensionEvaluationReport[] {
    return this.fiveDimensionHistory.map(r => ({ ...r, dimensions: { ...r.dimensions } }));
  }

  public getLatestFiveDimensionEvaluation(): FiveDimensionEvaluationReport | null {
    return this.fiveDimensionHistory[0] || null;
  }

""" + method_marker
if method_marker not in text:
    raise SystemExit('minerva method marker missing')
text = text.replace(method_marker, method, 1)
p.write_text(text)

edit('server/cpaOrganization/hermesPrimeAcademyEngine.ts',
"import { AccountingValidationEngine } from '../accountingValidationEngine.js';\n",
"import { AccountingValidationEngine } from '../accountingValidationEngine.js';\nimport { academyMinervaLab, type FiveDimensionEvaluationReport } from './academyMinervaLab.js';\n")
edit('server/cpaOrganization/hermesPrimeAcademyEngine.ts',
"""    scoringFormula?: string;
  };
""",
"""    scoringFormula?: string;
    fiveDimensionGrading?: FiveDimensionEvaluationReport;
  };
""")
old = """    const threeLayerTruthPassed = sourceFileExists && extractedFacts.length > 0 && pdfBytesValid && xlsxValid && balanceSheetIdentityPassed;

    const minervaScore = {
"""
new = """    const threeLayerTruthPassed = sourceFileExists && extractedFacts.length > 0 && pdfBytesValid && xlsxValid && balanceSheetIdentityPassed;

    const fiveDimensionGrading = academyMinervaLab.evaluateFiveDimensions({
      caseId: groundTruth.caseId,
      executionId: engagementId,
      dimensions: {
        SOURCE_COVERAGE: { checks: [
          { checkId: 'source-workbook-exists', label: 'Primary source workbook physically exists', outcome: sourceFileExists ? 'PASS' : 'FAIL', evidenceRefs: [sourceFilePathXlsx] },
          { checkId: 'pbc-source-exists', label: 'Supporting PBC source physically exists', outcome: pbcFileExists ? 'PASS' : 'FAIL', evidenceRefs: [pbcFilePath] },
          { checkId: 'fact-provenance-complete', label: 'All extracted facts retain source document provenance', outcome: factsHaveProvenance ? 'PASS' : 'FAIL', evidenceRefs: extractedFacts.map(f => String(f.documentId || '')).filter(Boolean) }
        ] },
        SEMANTIC_UNDERSTANDING: { checks: [
          { checkId: 'legacy-semantic-rubric', label: 'Independent sealed semantic/context assertions', outcome: 'NOT_TESTED', details: ['Legacy Full Practice cases do not yet carry an independent sealed semantic assertion rubric. New P2 curriculum cases must provide one.'] }
        ] },
        ACCOUNTING_ACCURACY: { checks: [
          ...canonicalResolutions.map(r => ({ checkId: `fact-${r.metric.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, label: `${r.metric} matches sealed expected value`, outcome: r.matched ? 'PASS' as const : 'FAIL' as const, evidenceRefs: [r.metric], details: r.matched ? [] : [`Expected ${r.expectedValue}; resolved ${r.resolvedValue}`] })),
          { checkId: 'balance-sheet-identity', label: 'Assets = Liabilities + Equity', outcome: balanceSheetIdentityPassed ? 'PASS' : 'FAIL', evidenceRefs: [`FACT-EUCLID-${engagementId}`] },
          { checkId: 'accounting-validation', label: 'Accounting validation engine reconciled the promoted facts', outcome: validationPassed ? 'PASS' : 'FAIL', evidenceRefs: [engagementId] }
        ] },
        PRODUCT_TRUTH: { checks: [
          { checkId: 'browser-source-to-pixel', label: 'Actual customer-visible browser render matches graded facts and lineage', outcome: 'NOT_TESTED', details: ['Legacy Full Practice backend cases do not execute the real-browser source-to-pixel acceptance required by the launch standard.'] },
          { checkId: 'task-sufficiency-behavior', label: 'Source completeness / task sufficiency behavior exercised', outcome: 'NOT_TESTED', details: ['Legacy Full Practice cases predate P1-009 task-sufficiency scenarios.'] },
          { checkId: 'clarification-lifecycle-behavior', label: 'Clarification/PBC response and re-evaluation behavior exercised', outcome: 'NOT_TESTED', details: ['Legacy Full Practice cases predate the P1-010 linked clarification lifecycle.'] }
        ] },
        DELIVERABLE_TRUTH: { checks: [
          { checkId: 'deliverable-registered', label: 'Deliverable package registered', outcome: registeredDeliverable ? 'PASS' : 'FAIL', evidenceRefs: [registeredDeliverable?.reportId || ''] },
          { checkId: 'pdf-bytes-valid', label: 'PDF bytes/hash validate against artifact manifest', outcome: pdfBytesValid ? 'PASS' : 'FAIL', evidenceRefs: [pdfInfo?.sha256 || ''] },
          { checkId: 'xlsx-bytes-valid', label: 'XLSX bytes/hash validate against artifact manifest', outcome: xlsxValid ? 'PASS' : 'FAIL', evidenceRefs: [xlsxInfo?.sha256 || ''] }
        ] }
      }
    });

    const minervaScore = {
"""
edit('server/cpaOrganization/hermesPrimeAcademyEngine.ts', old, new)
edit('server/cpaOrganization/hermesPrimeAcademyEngine.ts',
"""      scoringFormula: 'overallScore = (numericIntegrity * 0.40) + (evidenceIntegrity * 0.20) + (pbcQuality * 0.15) + (reviewEfficacy * 0.10) + (reportIntegrity * 0.15)'
    };
""",
"""      scoringFormula: 'Legacy compatibility score only. P2-001 launch grading uses fiveDimensionGrading and does not collapse the five dimensions into one accuracy number.',
      fiveDimensionGrading
    };
""")
edit('server/cpaOrganization/hermesPrimeAcademyEngine.ts',
"""      summary: `Minerva evaluated physical artifacts for ${groundTruth.issuer}: ${minervaScore.overallScore}/100 overall (Numeric: ${minervaScore.numericIntegrity}%, Evidence: ${minervaScore.evidenceIntegrity}%, Report: ${minervaScore.reportIntegrity}%).`,
""",
"""      summary: `Minerva evaluated physical artifacts for ${groundTruth.issuer}. Legacy score ${minervaScore.overallScore}/100; five-dimension status: ${fiveDimensionGrading.overallStatus}.`,
""")

p = Path('server/cpaOrganization/cpaOrganizationRoutes.ts')
text = p.read_text()
old = """      const recentEvents = observatoryEventLedger.getEvents({ limit: 50 });

      const stateObj = {
        heartbeat: heartbeatState,
        executionLock,
        productionState: {
          ACADEMY_LIVE_STARTED_AT: '2026-09-05T23:35:00Z',
          currentMaturity: 'INTERNAL_PRODUCTION / CONTINUOUS_AUTONOMOUS_LEARNING_ACTIVE',
          activeMission: 'Phase H.9.21 Autonomous Verification & Continuous Academy',
          nodeArchitecture: '4 vCPU, 16 GB RAM (CPU-only, no GPU)',
          zeroToleranceCertified: true,
          numericErrorRate: 0.000,
          provenanceIntegrity: 1.000,
          crossEngagementLeakage: 0.000
        },
"""
new = """      const recentEvents = observatoryEventLedger.getEvents({ limit: 50 });
      const latestFiveDimensionEvaluation = academyMinervaLab.getLatestFiveDimensionEvaluation();

      const stateObj = {
        heartbeat: heartbeatState,
        executionLock,
        productionState: {
          ACADEMY_LIVE_STARTED_AT: '2026-09-05T23:35:00Z',
          currentMaturity: 'INTERNAL_PRODUCTION / CONTINUOUS_AUTONOMOUS_LEARNING_ACTIVE',
          activeMission: 'Five-dimension, case-scoped evidence grading with sealed Minerva evaluation',
          nodeArchitecture: '4 vCPU, 16 GB RAM (CPU-only, no GPU)',
          gradingModel: 'CASE_SCOPED_FIVE_DIMENSION',
          latestFiveDimensionStatus: latestFiveDimensionEvaluation?.overallStatus || 'NOT_YET_EVALUATED',
          fullyTestedFiveDimensions: latestFiveDimensionEvaluation?.fullyTested || false,
          zeroToleranceCertified: latestFiveDimensionEvaluation?.overallStatus === 'FIVE_DIMENSION_PASS',
          numericErrorRate: null,
          provenanceIntegrity: null,
          crossEngagementLeakage: null
        },
        latestFiveDimensionEvaluation,
"""
if old not in text:
    raise SystemExit('observatory state block missing')
p.write_text(text.replace(old, new, 1))

edit('src/components/views/eve/observatory/ObservatoryTypes.ts',
"""    zeroToleranceCertified: boolean;
    numericErrorRate: number;
    provenanceIntegrity: number;
    crossEngagementLeakage: number;
  };
""",
"""    gradingModel?: string;
    latestFiveDimensionStatus?: string;
    fullyTestedFiveDimensions?: boolean;
    zeroToleranceCertified: boolean;
    numericErrorRate: number | null;
    provenanceIntegrity: number | null;
    crossEngagementLeakage: number | null;
  };
  latestFiveDimensionEvaluation?: any;
""")

edit('src/components/views/eve/observatory/CurriculumTab.tsx', "export interface CurriculumTabProps {\n  coverage?: {\n", "export interface CurriculumTabProps {\n  fiveDimensionEvaluation?: any;\n  coverage?: {\n")
edit('src/components/views/eve/observatory/CurriculumTab.tsx', "export const CurriculumTab: React.FC<CurriculumTabProps> = ({ coverage }) => {\n", "export const CurriculumTab: React.FC<CurriculumTabProps> = ({ coverage, fiveDimensionEvaluation }) => {\n")
marker = "      {/* Grid: Frameworks & Complexities */}\n"
section = """      {/* Five-dimension Minerva grading */}
      <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs" data-testid="academy-five-dimension-grading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Minerva Five-Dimension Evidence Grade</div>
            <div className="text-sm font-bold text-white mt-1">Source Coverage · Semantic Understanding · Accounting Accuracy · Product Truth · Deliverable Truth</div>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${fiveDimensionEvaluation?.overallStatus === 'FIVE_DIMENSION_PASS' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : fiveDimensionEvaluation?.overallStatus === 'FIVE_DIMENSION_FAIL' ? 'bg-red-950 text-red-300 border-red-800' : 'bg-amber-950 text-amber-300 border-amber-800'}`}>
            {fiveDimensionEvaluation?.overallStatus || 'NOT YET EVALUATED'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">Case-scoped evidence only. Untested dimensions remain explicitly NOT TESTED; Eve does not inherit a pass from another dimension or a legacy aggregate score.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {[
            ['SOURCE_COVERAGE', 'Source Coverage'], ['SEMANTIC_UNDERSTANDING', 'Semantic Understanding'],
            ['ACCOUNTING_ACCURACY', 'Accounting Accuracy'], ['PRODUCT_TRUTH', 'Product Truth'], ['DELIVERABLE_TRUTH', 'Deliverable Truth']
          ].map(([key, label]) => {
            const dim = fiveDimensionEvaluation?.dimensions?.[key];
            const status = dim?.status || 'NOT_TESTED';
            return (
              <div key={key} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="text-white font-bold text-[11px]">{label}</div>
                <div className={`text-[10px] font-bold ${status === 'PASS' ? 'text-emerald-400' : status === 'FAIL' ? 'text-red-400' : 'text-amber-400'}`}>{status.replace(/_/g, ' ')}</div>
                <div className="text-[9px] text-slate-500">{dim?.score == null ? 'No score — not fully tested' : `${dim.score}% of tested checks passed`}</div>
              </div>
            );
          })}
        </div>
      </div>

""" + marker
edit('src/components/views/eve/observatory/CurriculumTab.tsx', marker, section)
edit('src/components/views/eve/EveAcademyView.tsx', """        <CurriculumTab
          coverage={stateData?.coverage}
        />
""", """        <CurriculumTab
          coverage={stateData?.coverage}
          fiveDimensionEvaluation={stateData?.latestFiveDimensionEvaluation}
        />
""")
edit('src/components/views/eve/MinervaCertificationTab.tsx', "                CERTIFIED 100%\n", "                CASE-SCOPED EVIDENCE\n")
edit('src/components/views/eve/MinervaCertificationTab.tsx', "                Certified Complete (12 / 12 Correct with Evidence)\n", "                {questionnaireReport.items?.length || 0} examiner-scored questions\n")

Path('server/tests/fiveDimensionAcademyGrading.test.ts').write_text(r'''import assert from 'node:assert/strict';
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
''')
Path('server/tests/fiveDimensionAcademyPresentation.test.ts').write_text(r'''import assert from 'node:assert/strict';
import fs from 'node:fs';
const curriculum = fs.readFileSync('src/components/views/eve/observatory/CurriculumTab.tsx', 'utf8');
for (const term of ['Source Coverage', 'Semantic Understanding', 'Accounting Accuracy', 'Product Truth', 'Deliverable Truth', 'NOT TESTED']) assert.ok(curriculum.includes(term), `Curriculum UI missing: ${term}`);
const minervaUi = fs.readFileSync('src/components/views/eve/MinervaCertificationTab.tsx', 'utf8');
assert.ok(!minervaUi.includes('CERTIFIED 100%'));
const routes = fs.readFileSync('server/cpaOrganization/cpaOrganizationRoutes.ts', 'utf8');
assert.ok(routes.includes("gradingModel: 'CASE_SCOPED_FIVE_DIMENSION'"));
assert.ok(routes.includes('latestFiveDimensionEvaluation'));
assert.ok(routes.includes('numericErrorRate: null'));
console.log('FIVE_DIMENSION_ACADEMY_PRESENTATION_TESTS=PASS');
''')
