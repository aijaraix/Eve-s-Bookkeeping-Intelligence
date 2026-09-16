from pathlib import Path


def edit(path: str, old: str, new: str, count: int = 1):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'MISSING_SNIPPET:{path}:{old[:180]!r}')
    p.write_text(text.replace(old, new, count))


# ---------------------------------------------------------------------------
# Extend Minerva itself with the curated five-dimension curriculum catalog.
# This is a catalog/read-model extension, not another evaluator or scheduler.
# ---------------------------------------------------------------------------
minerva = 'server/cpaOrganization/academyMinervaLab.ts'
marker = """export interface FiveDimensionEvaluationReport {
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

export class AcademyMinervaLab {
"""
insert = """export interface FiveDimensionEvaluationReport {
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

export type FiveDimensionCurriculumFamily =
  | 'IMAGE_OCR'
  | 'SOURCE_COMPLETENESS'
  | 'MIXED_SOURCE'
  | 'PBC_CLARIFICATION'
  | 'EVIDENCE_INTEGRITY'
  | 'CLIENT_ISOLATION'
  | 'SEMANTIC_CONTEXT'
  | 'PRODUCT_RENDERING'
  | 'DELIVERABLE_LINEAGE';

export type FiveDimensionCurriculumFixtureStatus =
  | 'CONTRACT_READY'
  | 'PHYSICAL_FIXTURE_REQUIRED';

export interface FiveDimensionCurriculumCase {
  caseId: string;
  title: string;
  family: FiveDimensionCurriculumFamily;
  sourceKinds: string[];
  targetDimensions: FiveDimensionName[];
  expectedSafeguards: string[];
  fixtureStatus: FiveDimensionCurriculumFixtureStatus;
  autonomousEligible: false;
  validationRefs: string[];
}

export interface FiveDimensionCurriculumCoverage {
  totalCases: number;
  contractReadyCases: number;
  physicalFixturePendingCases: number;
  autonomousEligibleCases: number;
  byFamily: Record<string, number>;
  targetDimensionCounts: Record<FiveDimensionName, number>;
}

export class AcademyMinervaLab {
"""
edit(minerva, marker, insert)

edit(
    minerva,
    """  private sealedCorpus: BenchmarkTestCase[] = [];
  private evaluationHistory: EvaluationReport[] = [];
  private fiveDimensionHistory: FiveDimensionEvaluationReport[] = [];

  private constructor() {
    this.initializeSealedCorpus();
  }
""",
    """  private sealedCorpus: BenchmarkTestCase[] = [];
  private evaluationHistory: EvaluationReport[] = [];
  private fiveDimensionHistory: FiveDimensionEvaluationReport[] = [];
  private fiveDimensionCurriculum: FiveDimensionCurriculumCase[] = [];

  private constructor() {
    this.initializeSealedCorpus();
    this.initializeFiveDimensionCurriculum();
  }
"""
)

curriculum_methods = r'''  private initializeFiveDimensionCurriculum(): void {
    const caseSpec = (
      caseId: string,
      title: string,
      family: FiveDimensionCurriculumFamily,
      sourceKinds: string[],
      targetDimensions: FiveDimensionName[],
      expectedSafeguards: string[],
      fixtureStatus: FiveDimensionCurriculumFixtureStatus,
      validationRefs: string[] = []
    ): FiveDimensionCurriculumCase => ({
      caseId,
      title,
      family,
      sourceKinds,
      targetDimensions,
      expectedSafeguards,
      fixtureStatus,
      autonomousEligible: false,
      validationRefs
    });

    this.fiveDimensionCurriculum = [
      caseSpec(
        'CURR-OCR-RECEIPT-PHOTO',
        'Receipt photo with exact OCR region provenance',
        'IMAGE_OCR',
        ['IMAGE', 'RECEIPT'],
        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH'],
        [
          'Identify merchant, transaction date, amount, tax and currency without inventing absent fields.',
          'Preserve source SHA, image dimensions, OCR engine/version, confidence and exact bounding regions.',
          'Promoted accounting fact must reverse-trace to the receipt region and any rendered product value.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED',
        ['server/tests/ocrParserEvidence.test.ts', 'docs/launch/evidence/2026-09-16_LOCAL_OCR_SOURCE_TO_PIXEL_ACCEPTANCE.md']
      ),
      caseSpec(
        'CURR-OCR-SCANNED-INVOICE',
        'Scanned invoice with line-item and total reconciliation',
        'IMAGE_OCR',
        ['IMAGE', 'INVOICE'],
        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'DELIVERABLE_TRUTH'],
        [
          'Extract vendor, invoice number, dates, line items, subtotal, tax and total with exact regions.',
          'Reconcile line items/subtotal/tax/total and fail closed on a material mismatch.',
          'Any invoice-derived report/export value must preserve original source lineage.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED',
        ['server/tests/ocrParserEvidence.test.ts']
      ),
      caseSpec(
        'CURR-OCR-IMAGE-ONLY-PDF',
        'Image-only PDF requiring page-aware OCR',
        'IMAGE_OCR',
        ['PDF', 'IMAGE_ONLY_PDF'],
        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY'],
        [
          'Detect that native text is absent and route pages through the local OCR path.',
          'Preserve exact PDF page plus OCR region coordinates for every promoted observation.',
          'Do not silently treat missing OCR output as a complete source.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED',
        ['server/tests/ocrParserEvidence.test.ts', 'server/tests/universalSourceEvidenceContract.test.ts']
      ),
      caseSpec(
        'CURR-OCR-LOW-QUALITY-SCAN',
        'Low-quality scan with uncertainty preservation',
        'IMAGE_OCR',
        ['IMAGE', 'DEGRADED_SCAN'],
        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY'],
        [
          'Preserve OCR confidence and uncertain alternatives rather than force an unsupported value.',
          'Low-confidence material values must fail closed or enter review instead of silent promotion.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED',
        ['server/tests/ocrParserEvidence.test.ts']
      ),
      caseSpec(
        'CURR-OCR-ROTATED-SKEWED',
        'Rotated/skewed document image',
        'IMAGE_OCR',
        ['IMAGE', 'ROTATED_SCAN', 'SKEWED_SCAN'],
        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING'],
        [
          'Recover document reading order after orientation/skew handling.',
          'Retain original-image coordinate lineage even when preprocessing is applied.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED'
      ),
      caseSpec(
        'CURR-OCR-GLARE-CROP',
        'Glare/crop image with material evidence loss',
        'IMAGE_OCR',
        ['IMAGE', 'GLARE', 'CROPPED_IMAGE'],
        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY'],
        [
          'Detect unreadable/cropped material regions instead of declaring the source complete.',
          'Block conclusions that require the obscured evidence while allowing unrelated supported conclusions.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED',
        ['server/tests/taskEvidenceSufficiency.test.ts']
      ),
      caseSpec(
        'CURR-OCR-ENGINE-DISAGREEMENT',
        'PaddleOCR versus docTR material disagreement',
        'IMAGE_OCR',
        ['IMAGE', 'OCR_MULTI_ENGINE'],
        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY'],
        [
          'Preserve both engine outputs, confidence and engine/version metadata.',
          'Do not silently choose a materially different value solely because one engine is primary.',
          'Escalate or review material disagreement before canonical promotion.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED',
        ['docs/launch/evidence/2026-09-16_LOCAL_OCR_SOURCE_TO_PIXEL_ACCEPTANCE.md']
      ),
      caseSpec(
        'CURR-SUFF-MISSING-PAGE-NON-MATERIAL',
        'Missing page proven non-material for the current task',
        'SOURCE_COMPLETENESS',
        ['PDF', 'MISSING_PAGE'],
        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH'],
        [
          'Persist the source gap even when the current conclusion may proceed.',
          'Disclose the gap and mark it non-material only for the scoped current purpose.',
          'Do not erase or globally clear the missing page.'
        ],
        'CONTRACT_READY',
        ['server/tests/taskEvidenceSufficiency.test.ts']
      ),
      caseSpec(
        'CURR-SUFF-MISSING-TRANSACTION-MATERIAL',
        'Missing transaction pages material to population completeness',
        'SOURCE_COMPLETENESS',
        ['PDF', 'TRANSACTION_POPULATION', 'MISSING_PAGE'],
        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH'],
        [
          'Classify broken transaction continuity as material for a complete-population task.',
          'Block the affected population-dependent conclusion.',
          'Do not block unrelated conclusions that remain independently supported.'
        ],
        'CONTRACT_READY',
        ['server/tests/taskEvidenceSufficiency.test.ts']
      ),
      caseSpec(
        'CURR-SUFF-MISSING-PAGE-UNKNOWN',
        'Missing page with unknown materiality',
        'SOURCE_COMPLETENESS',
        ['PDF', 'MISSING_PAGE'],
        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH'],
        [
          'Classify unknown impact as review required rather than complete or sufficient.',
          'Apply fail-safe scope to current conclusions until the missing-page impact is established.'
        ],
        'CONTRACT_READY',
        ['server/tests/taskEvidenceSufficiency.test.ts', 'server/tests/sufficiencyClarificationCoordinator.test.ts']
      ),
      caseSpec(
        'CURR-MIXED-SOURCE-BATCH',
        'Mixed source batch with independent coordinate families',
        'MIXED_SOURCE',
        ['SPREADSHEET', 'PDF', 'IMAGE', 'CSV'],
        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY'],
        [
          'Preserve the correct coordinate family for every source rather than flattening provenance.',
          'Mixed-source conclusions must retain all material parent evidence references.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED',
        ['server/tests/universalSourceEvidenceContract.test.ts']
      ),
      caseSpec(
        'CURR-MIXED-SPREADSHEET-RECEIPT',
        'Spreadsheet plus receipt mixed conclusion',
        'MIXED_SOURCE',
        ['SPREADSHEET', 'IMAGE', 'RECEIPT'],
        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH'],
        [
          'A mixed conclusion must reverse-trace to the exact spreadsheet cell/range and receipt OCR region.',
          'A correct spreadsheet value cannot mask contradictory receipt evidence.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED',
        ['server/tests/spreadsheetSourceToPixelLineage.test.ts', 'server/tests/ocrParserEvidence.test.ts']
      ),
      caseSpec(
        'CURR-PBC-INSUFFICIENT-RESPONSE',
        'PBC response received but evidence remains insufficient',
        'PBC_CLARIFICATION',
        ['PBC_RESPONSE', 'EVIDENCE_REFERENCE'],
        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH'],
        [
          'A customer/CPA response is evidence, not automatic clearance.',
          'Response state becomes RESPONSE_RECEIVED and requires a new P1-009 decision.',
          'If any affected conclusion remains blocked/review-required, the request remains unresolved and follow-up is required.'
        ],
        'CONTRACT_READY',
        ['server/tests/sufficiencyClarificationCoordinator.test.ts', 'server/tests/sufficiencyClarificationRoutes.test.ts']
      ),
      caseSpec(
        'CURR-PBC-RESOLVES-AFTER-REEVALUATION',
        'PBC response resolves only after allowed re-evaluation',
        'PBC_CLARIFICATION',
        ['PBC_RESPONSE', 'EVIDENCE_REFERENCE'],
        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH'],
        [
          'Link the response to the same task/workspace/engagement and affected conclusions.',
          'Resolve only after a later P1-009 re-evaluation marks every affected conclusion ALLOWED.'
        ],
        'CONTRACT_READY',
        ['server/tests/sufficiencyClarificationCoordinator.test.ts', 'server/tests/sufficiencyClarificationRoutes.test.ts']
      ),
      caseSpec(
        'CURR-EVIDENCE-DUPLICATE-NEAR-DUPLICATE',
        'Duplicate and near-duplicate evidence discrimination',
        'EVIDENCE_INTEGRITY',
        ['PDF', 'IMAGE', 'DUPLICATE_EVIDENCE'],
        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY'],
        [
          'Exact duplicates must not be double-counted as independent corroboration.',
          'Near-duplicates with materially changed content must remain distinguishable and traceable.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED'
      ),
      caseSpec(
        'CURR-ISOLATION-BULK-MIXED-CLIENT',
        'Bulk mixed-client upload isolation',
        'CLIENT_ISOLATION',
        ['BULK_UPLOAD', 'MULTI_CLIENT'],
        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'PRODUCT_TRUTH'],
        [
          'Evidence must remain bound to the correct workspace/engagement/client.',
          'No fact, provenance reference, clarification or rendered value may cross client boundaries.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED'
      ),
      caseSpec(
        'CURR-SEMANTIC-LONG-DOCUMENT',
        'Long-document semantic/context extraction',
        'SEMANTIC_CONTEXT',
        ['PDF', 'LONG_DOCUMENT', 'NARRATIVE'],
        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING'],
        [
          'Preserve entity, author/speaker, section, footnote and narrative intent where material.',
          'Do not substitute accounting keyword matching for document-level semantic context.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED'
      ),
      caseSpec(
        'CURR-PRODUCT-SOURCE-TO-DASHBOARD',
        'Real source-to-dashboard click-through',
        'PRODUCT_RENDERING',
        ['SPREADSHEET', 'IMAGE', 'BROWSER_RENDER'],
        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH'],
        [
          'Verify the actual browser-rendered value rather than a backend-only adapter object.',
          'Click-through provenance must reverse-trace the rendered value to original customer evidence coordinates.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED',
        ['docs/launch/evidence/2026-09-16_SPREADSHEET_SOURCE_TO_PIXEL_LINEAGE_ACCEPTANCE.md', 'docs/launch/evidence/2026-09-16_LOCAL_OCR_SOURCE_TO_PIXEL_ACCEPTANCE.md']
      ),
      caseSpec(
        'CURR-DELIVERABLE-FINAL-LINEAGE',
        'Final report/export evidence lineage',
        'DELIVERABLE_LINEAGE',
        ['PDF_EXPORT', 'XLSX_EXPORT', 'REPORT'],
        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY', 'DELIVERABLE_TRUTH'],
        [
          'Final exported/report values must match canonical results and remain grounded in original evidence.',
          'Material report statements must retain enough lineage to reverse-trace through derivations to source coordinates.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED',
        ['src/adapters/presentationAdapters.test.ts']
      )
    ];
  }

  public getFiveDimensionCurriculumCases(): FiveDimensionCurriculumCase[] {
    return this.fiveDimensionCurriculum.map(c => ({
      ...c,
      sourceKinds: [...c.sourceKinds],
      targetDimensions: [...c.targetDimensions],
      expectedSafeguards: [...c.expectedSafeguards],
      validationRefs: [...c.validationRefs]
    }));
  }

  public getFiveDimensionCurriculumCoverage(): FiveDimensionCurriculumCoverage {
    const byFamily: Record<string, number> = {};
    const targetDimensionCounts: Record<FiveDimensionName, number> = {
      SOURCE_COVERAGE: 0,
      SEMANTIC_UNDERSTANDING: 0,
      ACCOUNTING_ACCURACY: 0,
      PRODUCT_TRUTH: 0,
      DELIVERABLE_TRUTH: 0
    };
    for (const c of this.fiveDimensionCurriculum) {
      byFamily[c.family] = (byFamily[c.family] || 0) + 1;
      for (const dimension of c.targetDimensions) targetDimensionCounts[dimension] += 1;
    }
    return {
      totalCases: this.fiveDimensionCurriculum.length,
      contractReadyCases: this.fiveDimensionCurriculum.filter(c => c.fixtureStatus === 'CONTRACT_READY').length,
      physicalFixturePendingCases: this.fiveDimensionCurriculum.filter(c => c.fixtureStatus === 'PHYSICAL_FIXTURE_REQUIRED').length,
      autonomousEligibleCases: this.fiveDimensionCurriculum.filter(c => c.autonomousEligible).length,
      byFamily,
      targetDimensionCounts
    };
  }

'''
run_marker = """  /**
   * Evaluates solver outputs against the sealed benchmark corpus.
"""
edit(minerva, run_marker, curriculum_methods + run_marker)

# ---------------------------------------------------------------------------
# Expose curated curriculum through the existing Observatory read model.
# ---------------------------------------------------------------------------
routes = 'server/cpaOrganization/cpaOrganizationRoutes.ts'
edit(
    routes,
    """      const recentEvents = observatoryEventLedger.getEvents({ limit: 50 });
      const latestFiveDimensionEvaluation = academyMinervaLab.getLatestFiveDimensionEvaluation();
      const fiveDimensionHistory = academyMinervaLab.getFiveDimensionHistory();

      const stateObj = {
""",
    """      const recentEvents = observatoryEventLedger.getEvents({ limit: 50 });
      const latestFiveDimensionEvaluation = academyMinervaLab.getLatestFiveDimensionEvaluation();
      const fiveDimensionHistory = academyMinervaLab.getFiveDimensionHistory();
      const fiveDimensionCurriculum = academyMinervaLab.getFiveDimensionCurriculumCases();
      const fiveDimensionCurriculumCoverage = academyMinervaLab.getFiveDimensionCurriculumCoverage();

      const stateObj = {
"""
)
edit(
    routes,
    """        latestFiveDimensionEvaluation,
        fiveDimensionHistory,
        currentEngagement,
""",
    """        latestFiveDimensionEvaluation,
        fiveDimensionHistory,
        fiveDimensionCurriculum,
        fiveDimensionCurriculumCoverage,
        currentEngagement,
"""
)

# ---------------------------------------------------------------------------
# Wire existing Academy view into the existing Curriculum tab.
# ---------------------------------------------------------------------------
view = 'src/components/views/eve/EveAcademyView.tsx'
edit(
    view,
    """        <CurriculumTab
          coverage={stateData?.coverage}
          fiveDimensionEvaluation={stateData?.latestFiveDimensionEvaluation}
        />
""",
    """        <CurriculumTab
          coverage={stateData?.coverage}
          fiveDimensionEvaluation={stateData?.latestFiveDimensionEvaluation}
          fiveDimensionCurriculum={stateData?.fiveDimensionCurriculum}
          fiveDimensionCurriculumCoverage={stateData?.fiveDimensionCurriculumCoverage}
        />
"""
)

# ---------------------------------------------------------------------------
# Add truthful curriculum readiness presentation. Nothing here claims the
# physical OCR/browser fixtures have executed.
# ---------------------------------------------------------------------------
curriculum_ui = 'src/components/views/eve/observatory/CurriculumTab.tsx'
edit(
    curriculum_ui,
    """export interface CurriculumTabProps {
  fiveDimensionEvaluation?: any;
  coverage?: {
""",
    """export interface CurriculumTabProps {
  fiveDimensionEvaluation?: any;
  fiveDimensionCurriculum?: any[];
  fiveDimensionCurriculumCoverage?: any;
  coverage?: {
"""
)
edit(
    curriculum_ui,
    """export const CurriculumTab: React.FC<CurriculumTabProps> = ({ coverage, fiveDimensionEvaluation }) => {
""",
    """export const CurriculumTab: React.FC<CurriculumTabProps> = ({ coverage, fiveDimensionEvaluation, fiveDimensionCurriculum = [], fiveDimensionCurriculumCoverage }) => {
"""
)
ui_marker = """      {/* Grid: Frameworks & Complexities */}
"""
ui_section = r'''      {/* Curated five-dimension curriculum */}
      <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs" data-testid="academy-five-dimension-curriculum">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">Five-Dimension Curriculum Queue</div>
            <div className="text-sm font-bold text-white mt-1">Curated cases are specifications until their declared fixture path is physically exercised</div>
          </div>
          <div className="flex gap-2 text-[9px]">
            <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">{fiveDimensionCurriculumCoverage?.contractReadyCases || 0} contract-ready</span>
            <span className="px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800">{fiveDimensionCurriculumCoverage?.physicalFixturePendingCases || 0} physical fixture required</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">All new cases are intentionally excluded from autonomous scheduling until their fixture/execution path is proven. This catalog does not convert a specification into a pass.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {fiveDimensionCurriculum.map((item: any) => (
            <div key={item.caseId} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[11px] text-white font-bold leading-snug">{item.title}</div>
                <span className={`text-[8px] px-1.5 py-0.5 rounded border whitespace-nowrap ${item.fixtureStatus === 'CONTRACT_READY' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'}`}>{String(item.fixtureStatus || '').replace(/_/g, ' ')}</span>
              </div>
              <div className="text-[9px] text-slate-500">{item.caseId} · {String(item.family || '').replace(/_/g, ' ')}</div>
              <div className="text-[9px] text-indigo-300">{(item.targetDimensions || []).map((d: string) => d.replace(/_/g, ' ')).join(' · ')}</div>
              <div className="text-[9px] text-slate-500">Autonomous scheduler: NOT ELIGIBLE</div>
            </div>
          ))}
        </div>
      </div>

'''
edit(curriculum_ui, ui_marker, ui_section + ui_marker)

# ---------------------------------------------------------------------------
# Deterministic catalog contract tests.
# ---------------------------------------------------------------------------
Path('server/tests/fiveDimensionAcademyCurriculum.test.ts').write_text(r'''import assert from 'node:assert/strict';
import fs from 'node:fs';
import { academyMinervaLab } from '../cpaOrganization/academyMinervaLab.js';

const cases = academyMinervaLab.getFiveDimensionCurriculumCases();
const coverage = academyMinervaLab.getFiveDimensionCurriculumCoverage();

assert.equal(cases.length, 19);
assert.equal(new Set(cases.map(c => c.caseId)).size, 19);
assert.equal(coverage.totalCases, 19);
assert.equal(coverage.contractReadyCases, 5);
assert.equal(coverage.physicalFixturePendingCases, 14);
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
assert.equal(find('CURR-SUFF-MISSING-PAGE-NON-MATERIAL').fixtureStatus, 'CONTRACT_READY');
assert.ok(find('CURR-SUFF-MISSING-PAGE-NON-MATERIAL').expectedSafeguards.join(' ').includes('Persist the source gap'));
assert.ok(find('CURR-SUFF-MISSING-TRANSACTION-MATERIAL').expectedSafeguards.join(' ').includes('Block the affected'));
assert.ok(find('CURR-SUFF-MISSING-PAGE-UNKNOWN').expectedSafeguards.join(' ').includes('review required'));
assert.ok(find('CURR-OCR-ENGINE-DISAGREEMENT').expectedSafeguards.join(' ').includes('Preserve both engine outputs'));
assert.ok(find('CURR-PBC-INSUFFICIENT-RESPONSE').expectedSafeguards.join(' ').includes('not automatic clearance'));
assert.ok(find('CURR-PBC-INSUFFICIENT-RESPONSE').expectedSafeguards.join(' ').includes('remains unresolved'));
assert.ok(find('CURR-PBC-RESOLVES-AFTER-REEVALUATION').expectedSafeguards.join(' ').includes('every affected conclusion ALLOWED'));
assert.ok(find('CURR-ISOLATION-BULK-MIXED-CLIENT').expectedSafeguards.join(' ').includes('No fact, provenance reference, clarification or rendered value may cross client boundaries'));
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
''')

print('P2_CURRICULUM_CATALOG_PATCH_APPLIED')
