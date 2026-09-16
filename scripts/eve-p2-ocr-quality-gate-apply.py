from pathlib import Path


def replace(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'MISSING_SNIPPET:{path}:{old[:180]!r}')
    p.write_text(text.replace(old, new, 1))

client = 'src/lib/ocr/localOcrClient.ts'
replace(client,
"""interface OcrQuality {
  score: number;
  averageConfidence: number;
  materialMinimumConfidence: number | null;
  regionCount: number;
  materialRegionCount: number;
}
""",
"""export interface OcrQualityAssessment {
  score: number;
  averageConfidence: number;
  materialMinimumConfidence: number | null;
  regionCount: number;
  materialRegionCount: number;
}

export interface LocalOcrQualityFailureDiagnostics {
  selectedEngine: OcrEngineName;
  reasons: string[];
  quality: OcrQualityAssessment;
  attempts: LocalOcrAttempt[];
  routingDecision: LocalOcrRoutingDecision;
  selectedResult: LocalOcrEngineResult;
}

export class LocalOcrInsufficientQualityError extends Error {
  public readonly code = 'LOCAL_OCR_INSUFFICIENT_QUALITY';
  public readonly diagnostics: LocalOcrQualityFailureDiagnostics;

  constructor(diagnostics: LocalOcrQualityFailureDiagnostics) {
    super(`LOCAL_OCR_INSUFFICIENT_QUALITY:${diagnostics.reasons.join(',')}`);
    this.name = 'LocalOcrInsufficientQualityError';
    this.diagnostics = diagnostics;
  }
}
""")
replace(client,
"""export function assessOcrQuality(result: LocalOcrEngineResult): OcrQuality {
""",
"""export function assessOcrQuality(result: LocalOcrEngineResult): OcrQualityAssessment {
""")
replace(client,
"""  private fallbackReasons(primary: LocalOcrEngineResult, quality: OcrQuality): string[] {
""",
"""  private fallbackReasons(primary: LocalOcrEngineResult, quality: OcrQualityAssessment): string[] {
""")
replace(client,
"""    return reasons;
  }

  public async recognize(input: LocalOcrInput): Promise<LocalOcrCompositeResult> {
""",
"""    return reasons;
  }

  private finalQualityReasons(quality: OcrQualityAssessment): string[] {
    const reasons: string[] = [];
    if (quality.regionCount === 0) reasons.push('SELECTED_NO_TEXT_REGIONS');
    if (quality.averageConfidence < this.primaryAverageConfidenceFloor) {
      reasons.push(`SELECTED_AVERAGE_CONFIDENCE_BELOW_${this.primaryAverageConfidenceFloor}`);
    }
    if (quality.materialMinimumConfidence !== null && quality.materialMinimumConfidence < this.materialConfidenceFloor) {
      reasons.push(`SELECTED_MATERIAL_CONFIDENCE_BELOW_${this.materialConfidenceFloor}`);
    }
    return reasons;
  }

  public async recognize(input: LocalOcrInput): Promise<LocalOcrCompositeResult> {
""")
replace(client,
"""    const attempts: LocalOcrAttempt[] = [];
    let primary: LocalOcrEngineResult | undefined;
    let primaryQuality: OcrQuality | undefined;
""",
"""    const attempts: LocalOcrAttempt[] = [];
    let primary: LocalOcrEngineResult | undefined;
    let primaryQuality: OcrQualityAssessment | undefined;
""")
replace(client,
"""    let fallback: LocalOcrEngineResult | undefined;
    let fallbackQuality: OcrQuality | undefined;
""",
"""    let fallback: LocalOcrEngineResult | undefined;
    let fallbackQuality: OcrQualityAssessment | undefined;
""")
replace(client,
"""    for (const attempt of attempts) attempt.selected = attempt.result === selected;
    const chosenQuality = assessOcrQuality(selected);
    return {
      ...selected,
      routingDecision: {
        selectedEngine: selected.engine,
        fallbackInvoked: shouldInvokeFallback,
        reasons,
        primaryScore: primaryQuality?.score ?? null,
        fallbackScore: fallbackQuality?.score ?? null,
      },
      attempts,
      warnings: [
""",
"""    for (const attempt of attempts) attempt.selected = attempt.result === selected;
    const chosenQuality = assessOcrQuality(selected);
    const routingDecision: LocalOcrRoutingDecision = {
      selectedEngine: selected.engine,
      fallbackInvoked: shouldInvokeFallback,
      reasons,
      primaryScore: primaryQuality?.score ?? null,
      fallbackScore: fallbackQuality?.score ?? null,
    };
    const finalQualityReasons = this.finalQualityReasons(chosenQuality);
    if (finalQualityReasons.length > 0) {
      throw new LocalOcrInsufficientQualityError({
        selectedEngine: selected.engine,
        reasons: finalQualityReasons,
        quality: chosenQuality,
        attempts,
        routingDecision,
        selectedResult: selected,
      });
    }
    return {
      ...selected,
      routingDecision,
      attempts,
      warnings: [
""")

runner = 'server/cpaOrganization/academyOcrCurriculumRunner.ts'
replace(runner,
"""  LocalOcrClient,
  type LocalOcrAttempt,
""",
"""  LocalOcrClient,
  LocalOcrInsufficientQualityError,
  type LocalOcrAttempt,
""")
replace(runner,
"""export interface AcademyOcrCurriculumRunResult {
  caseId: string;
  sourceSha256: string;
  ocr: LocalOcrCompositeResult;
  dualEngineComparison: AcademyOcrDualEngineComparison;
  fiveDimensionEvaluation: FiveDimensionEvaluationReport;
}
""",
"""export interface AcademyOcrQualityFailure {
  reasons: string[];
  selectedEngine: string;
  averageConfidence: number;
  materialMinimumConfidence: number | null;
  regionCount: number;
  attempts: LocalOcrAttempt[];
}

export interface AcademyOcrCurriculumRunResult {
  caseId: string;
  sourceSha256: string;
  ocr: LocalOcrCompositeResult | null;
  qualityFailure: AcademyOcrQualityFailure | null;
  dualEngineComparison: AcademyOcrDualEngineComparison;
  fiveDimensionEvaluation: FiveDimensionEvaluationReport;
}
""")
replace(runner,
"""function isMaterialDifference(a: string, b: string): boolean {
  const joined = `${a} ${b}`;
  return /[$€£¥₹]|\\d|\\b(?:TOTAL|SUBTOTAL|TAX|INVOICE|RECEIPT|DATE|AMOUNT|BALANCE|CURRENCY)\\b/i.test(joined);
}

function compareAttempts(attempts: LocalOcrAttempt[]): AcademyOcrDualEngineComparison {
""",
"""function isMaterialDifference(a: string, b: string): boolean {
  const joined = `${a} ${b}`;
  return /[$€£¥₹]|\\d|\\b(?:TOTAL|SUBTOTAL|TAX|INVOICE|RECEIPT|DATE|AMOUNT|BALANCE|CURRENCY)\\b/i.test(joined);
}

function comparisonTokens(result: LocalOcrEngineResult): string[] {
  return regions(result)
    .flatMap(region => String(region.text || '').normalize('NFKC').toUpperCase().match(/[A-Z0-9$€£¥₹#:/.-]+/g) || [])
    .filter(Boolean);
}

function multisetDifference(left: string[], right: string[]): string[] {
  const counts = new Map<string, number>();
  for (const token of right) counts.set(token, (counts.get(token) || 0) + 1);
  const diff: string[] = [];
  for (const token of left) {
    const remaining = counts.get(token) || 0;
    if (remaining > 0) counts.set(token, remaining - 1);
    else diff.push(token);
  }
  return diff;
}

function compareAttempts(attempts: LocalOcrAttempt[]): AcademyOcrDualEngineComparison {
""")
old_compare = """  const p = regions(primary);
  const f = regions(fallback);
  const max = Math.max(p.length, f.length);
  const differences: AcademyOcrEngineTextDifference[] = [];
  for (let i = 0; i < max; i += 1) {
    const primaryText = String(p[i]?.text || '');
    const fallbackText = String(f[i]?.text || '');
    if (normalizeText(primaryText) !== normalizeText(fallbackText)) {
      differences.push({
        regionIndex: i,
        primaryText,
        fallbackText,
        material: isMaterialDifference(primaryText, fallbackText),
      });
    }
  }
"""
new_compare = """  const primaryTokens = comparisonTokens(primary);
  const fallbackTokens = comparisonTokens(fallback);
  const primaryOnly = multisetDifference(primaryTokens, fallbackTokens);
  const fallbackOnly = multisetDifference(fallbackTokens, primaryTokens);
  const differences: AcademyOcrEngineTextDifference[] = [];
  if (primaryOnly.length > 0 || fallbackOnly.length > 0) {
    const primaryText = primaryOnly.join(' ');
    const fallbackText = fallbackOnly.join(' ');
    differences.push({
      regionIndex: -1,
      primaryText,
      fallbackText,
      material: isMaterialDifference(primaryText, fallbackText),
    });
  }
"""
replace(runner, old_compare, new_compare)

# Replace the run function in one bounded splice.
p = Path(runner)
text = p.read_text()
start = text.index('export async function runAcademyOcrCurriculumFixture(')
new_fn = r'''export async function runAcademyOcrCurriculumFixture(
  fixture: AcademyOcrCurriculumFixture,
  clientOptions: LocalOcrClientOptions = {},
): Promise<AcademyOcrCurriculumRunResult> {
  const sourceSha256 = crypto.createHash('sha256').update(fixture.buffer).digest('hex');
  const client = new LocalOcrClient({
    ...clientOptions,
    forceFallbackEvaluation: true,
  });

  let ocr: LocalOcrCompositeResult;
  try {
    ocr = await client.recognize({
      filename: fixture.filename,
      mimeType: fixture.mimeType,
      buffer: fixture.buffer,
      sourceSha256,
    });
  } catch (error) {
    if (!(error instanceof LocalOcrInsufficientQualityError)) throw error;
    const d = error.diagnostics;
    const dualEngineComparison = compareAttempts(d.attempts);
    const evidenceRefs = d.attempts
      .filter(attempt => attempt.result)
      .map(attempt => `ocr-attempt:${attempt.engine}:${sourceSha256}`);
    const fiveDimensionEvaluation = academyMinervaLab.evaluateFiveDimensions({
      caseId: fixture.caseId,
      executionId: `ocr-fixture-${sourceSha256.slice(0, 12)}`,
      dimensions: {
        SOURCE_COVERAGE: { checks: [{
          checkId: 'ocr-final-quality-gate',
          label: 'At least one OCR engine produces evidence above the final acceptance floor',
          outcome: 'FAIL',
          evidenceRefs,
          details: [
            `Selected engine=${d.selectedEngine}; averageConfidence=${d.quality.averageConfidence.toFixed(4)}; materialMinimumConfidence=${d.quality.materialMinimumConfidence == null ? 'n/a' : d.quality.materialMinimumConfidence.toFixed(4)}; reasons=${d.reasons.join(',')}`,
          ],
        }] },
        SEMANTIC_UNDERSTANDING: { checks: [{
          checkId: 'semantic-blocked-by-ocr-quality', label: 'Semantic interpretation after acceptable OCR evidence', outcome: 'NOT_TESTED',
          details: ['OCR evidence failed the final quality gate; semantic assertions are not promoted from an unusable source transcription.'],
        }] },
        ACCOUNTING_ACCURACY: { checks: [{
          checkId: 'accounting-blocked-by-ocr-quality', label: 'Accounting assertions after acceptable OCR evidence', outcome: 'NOT_TESTED',
          details: ['OCR evidence failed the final quality gate; accounting assertions are not promoted from an unusable source transcription.'],
        }] },
        PRODUCT_TRUTH: { checks: [{
          checkId: 'product-truth-browser-not-exercised', label: 'Actual Eve browser rendering and click-through provenance', outcome: 'NOT_TESTED',
          details: [fixture.productTruthNotTestedReason],
        }] },
        DELIVERABLE_TRUTH: { checks: [{
          checkId: 'deliverable-truth-export-not-exercised', label: 'Final report/export truth and reverse lineage', outcome: 'NOT_TESTED',
          details: [fixture.deliverableTruthNotTestedReason],
        }] },
      },
    });
    return {
      caseId: fixture.caseId,
      sourceSha256,
      ocr: null,
      qualityFailure: {
        reasons: [...d.reasons],
        selectedEngine: d.selectedEngine,
        averageConfidence: d.quality.averageConfidence,
        materialMinimumConfidence: d.quality.materialMinimumConfidence,
        regionCount: d.quality.regionCount,
        attempts: d.attempts,
      },
      dualEngineComparison,
      fiveDimensionEvaluation,
    };
  }

  const dualEngineComparison = compareAttempts(ocr.attempts);
  const disagreementEvidence = ocr.attempts
    .filter(attempt => attempt.result)
    .map(attempt => `ocr-attempt:${attempt.engine}:${sourceSha256}`);
  const semanticChecks: FiveDimensionCheck[] = [{
    checkId: 'ocr-material-dual-engine-agreement',
    label: 'Dual-engine OCR has no unresolved material semantic disagreement',
    outcome: !dualEngineComparison.compared
      ? 'NOT_TESTED'
      : dualEngineComparison.materialDifferenceDetected
        ? 'FAIL'
        : 'PASS',
    evidenceRefs: dualEngineComparison.compared ? disagreementEvidence : [],
    details: !dualEngineComparison.compared
      ? ['Both local OCR engine outputs were not available for comparison.']
      : dualEngineComparison.materialDifferenceDetected
        ? [`Material dual-engine disagreement requires adjudication before semantic promotion: ${dualEngineComparison.differences.map(d => `primary=[${d.primaryText}] fallback=[${d.fallbackText}]`).join(' | ')}`]
        : ['No material token-level disagreement detected between PaddleOCR and docTR.'],
  }, ...fixture.semanticAssertions.map(assertion => assertionCheck(ocr, assertion))];
  const accountingChecks = fixture.accountingAssertions.map(assertion => assertionCheck(ocr, assertion));
  if (fixture.reconciliation) accountingChecks.push(reconciliationCheck(ocr, fixture.reconciliation));

  const fiveDimensionEvaluation = academyMinervaLab.evaluateFiveDimensions({
    caseId: fixture.caseId,
    executionId: `ocr-fixture-${sourceSha256.slice(0, 12)}`,
    dimensions: {
      SOURCE_COVERAGE: { checks: sourceChecks(sourceSha256, ocr) },
      SEMANTIC_UNDERSTANDING: { checks: semanticChecks },
      ACCOUNTING_ACCURACY: { checks: accountingChecks },
      PRODUCT_TRUTH: {
        checks: [{
          checkId: 'product-truth-browser-not-exercised',
          label: 'Actual Eve browser rendering and click-through provenance',
          outcome: 'NOT_TESTED',
          details: [fixture.productTruthNotTestedReason],
        }],
      },
      DELIVERABLE_TRUTH: {
        checks: [{
          checkId: 'deliverable-truth-export-not-exercised',
          label: 'Final report/export truth and reverse lineage',
          outcome: 'NOT_TESTED',
          details: [fixture.deliverableTruthNotTestedReason],
        }],
      },
    },
  });

  return {
    caseId: fixture.caseId,
    sourceSha256,
    ocr,
    qualityFailure: null,
    dualEngineComparison,
    fiveDimensionEvaluation,
  };
}
'''
p.write_text(text[:start] + new_fn)

# CLI: support a quality-rejected curriculum finding without crashing.
cli = 'scripts/academy/run_ocr_curriculum_fixture.ts'
replace(cli,
"""  selectedEngine: result.ocr.engine,
  routingDecision: result.ocr.routingDecision,
  attempts: result.ocr.attempts.map(a => ({
""",
"""  selectedEngine: result.ocr?.engine || result.qualityFailure?.selectedEngine || null,
  routingDecision: result.ocr?.routingDecision || null,
  qualityFailure: result.qualityFailure ? {
    reasons: result.qualityFailure.reasons,
    selectedEngine: result.qualityFailure.selectedEngine,
    averageConfidence: result.qualityFailure.averageConfidence,
    materialMinimumConfidence: result.qualityFailure.materialMinimumConfidence,
    regionCount: result.qualityFailure.regionCount,
  } : null,
  attempts: (result.ocr?.attempts || result.qualityFailure?.attempts || []).map(a => ({
""")

# Strengthen local OCR routing tests with final selected-quality fail-closed behavior.
test = 'server/tests/localOcrRouting.test.ts'
p = Path(test); t = p.read_text()
insert = r'''
{
  let fallbackCalls = 0;
  const fetchImpl = async (url: any) => {
    const fallback = String(url).includes('doctr');
    if (fallback) fallbackCalls++;
    const confidence = fallback ? 0.80 : 0.65;
    return new Response(JSON.stringify({
      ...base,
      engine: fallback ? 'doctr' : 'paddleocr',
      model: fallback ? 'doctr-test' : 'paddle-test',
      pages: [{ ...base.pages[0], regions: [{ ...base.pages[0].regions[0], text: fallback ? 'GARBLED 523' : 'BAD OCR 523', confidence }] }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const client = new LocalOcrClient({
    primaryUrl: 'http://paddle', fallbackUrl: 'http://doctr', fetchImpl: fetchImpl as typeof fetch,
    primaryAverageConfidenceFloor: 0.90, materialConfidenceFloor: 0.85,
  });
  await assert.rejects(
    () => client.recognize({ filename: 'rotated-receipt.png', mimeType: 'image/png', buffer, sourceSha256 }),
    (error: any) => {
      assert.equal(error?.code, 'LOCAL_OCR_INSUFFICIENT_QUALITY');
      assert.ok(error?.diagnostics?.reasons?.some((r: string) => r.includes('SELECTED_AVERAGE_CONFIDENCE')));
      assert.equal(error?.diagnostics?.selectedEngine, 'doctr');
      assert.equal(error?.diagnostics?.attempts?.length, 2);
      return true;
    },
  );
  assert.equal(fallbackCalls, 1);
}
'''
t = t.replace("\nconsole.log('LOCAL_OCR_ROUTING_TESTS=PASS');", insert + "\nconsole.log('LOCAL_OCR_ROUTING_TESTS=PASS');")
p.write_text(t)

# Add Academy tests for quality failure and robust token comparison.
runner_test = 'server/tests/academyOcrCurriculumRunner.test.ts'
p = Path(runner_test); t = p.read_text()
# Existing successful receipt now includes the cross-engine agreement assertion and should still pass.
t = t.replace("assert.equal(receiptRun.dualEngineComparison.detected, false);", "assert.equal(receiptRun.dualEngineComparison.detected, false);\nassert.equal(receiptRun.qualityFailure, null);")
t = t.replace("assert.equal(invoiceRun.dualEngineComparison.materialDifferenceDetected, true);", "assert.equal(invoiceRun.dualEngineComparison.materialDifferenceDetected, true);\nassert.equal(invoiceRun.qualityFailure, null);")
extra = r'''

// Punctuation and line segmentation differences are not material semantic disagreement.
const segmentationPrimary = ['EVE TEST MARKET', 'OFFICE SUPPLIES $24.50', 'SALES TAX $3.48', 'TOTAL $53.23'];
const segmentationFallback = ['EVE TEST MARKET', 'OFFICE', 'SUPPLIES $24.50', 'SALES, TAX $3.48', 'TOTAL $53.23'];
const segmentationFixture: AcademyOcrCurriculumFixture = {
  ...receiptFixture,
  caseId: 'CURR-OCR-SEGMENTATION-NORMALIZATION',
  semanticAssertions: [{ checkId: 'merchant', label: 'Merchant', expectedText: 'EVE TEST MARKET' }],
  accountingAssertions: [{ checkId: 'total', label: 'Total', expectedText: 'TOTAL $53.23' }],
  reconciliation: undefined,
};
const segmentationRun = await runAcademyOcrCurriculumFixture(segmentationFixture, {
  primaryUrl: 'http://paddle', fallbackUrl: 'http://doctr', fetchImpl: fetchFor(segmentationPrimary, segmentationFallback, 0.99, 0.95) as any,
});
assert.equal(segmentationRun.dualEngineComparison.detected, false);
assert.equal(segmentationRun.fiveDimensionEvaluation.dimensions.SEMANTIC_UNDERSTANDING.status, 'PASS');

// When both engines are below the final quality floor, Academy records a Source Coverage failure and does not promote downstream assertions.
const poorPrimary = ['FP 50', 'DAT//069/2026', '0 523'];
const poorFallback = ['-', 'I', 'A - I'];
const poorRun = await runAcademyOcrCurriculumFixture({
  ...receiptFixture,
  caseId: 'CURR-OCR-ROTATED-SKEWED',
}, {
  primaryUrl: 'http://paddle', fallbackUrl: 'http://doctr', fetchImpl: fetchFor(poorPrimary, poorFallback, 0.68, 0.82) as any,
  primaryAverageConfidenceFloor: 0.90,
  materialConfidenceFloor: 0.85,
});
assert.equal(poorRun.ocr, null);
assert.ok(poorRun.qualityFailure);
assert.equal(poorRun.qualityFailure?.selectedEngine, 'doctr');
assert.ok(poorRun.qualityFailure?.reasons.some(r => r.includes('SELECTED_AVERAGE_CONFIDENCE')));
assert.equal(poorRun.fiveDimensionEvaluation.dimensions.SOURCE_COVERAGE.status, 'FAIL');
assert.equal(poorRun.fiveDimensionEvaluation.dimensions.SEMANTIC_UNDERSTANDING.status, 'NOT_TESTED');
assert.equal(poorRun.fiveDimensionEvaluation.dimensions.ACCOUNTING_ACCURACY.status, 'NOT_TESTED');
assert.equal(poorRun.fiveDimensionEvaluation.dimensions.PRODUCT_TRUTH.status, 'NOT_TESTED');
assert.equal(poorRun.fiveDimensionEvaluation.dimensions.DELIVERABLE_TRUTH.status, 'NOT_TESTED');
assert.equal(poorRun.fiveDimensionEvaluation.overallStatus, 'FIVE_DIMENSION_FAIL');
'''
t = t.replace("\nconsole.log('ACADEMY_OCR_CURRICULUM_RUNNER_TESTS=PASS');", extra + "\nconsole.log('ACADEMY_OCR_CURRICULUM_RUNNER_TESTS=PASS');")
p.write_text(t)

# Dedicated static acceptance contract: OCR parser must still depend on recognize(), so quality rejection blocks parsing before provenance promotion.
Path('server/tests/ocrFailClosedQualityGate.test.ts').write_text(r'''import assert from 'node:assert/strict';
import fs from 'node:fs';

const client = fs.readFileSync('src/lib/ocr/localOcrClient.ts', 'utf8');
assert.ok(client.includes("LOCAL_OCR_INSUFFICIENT_QUALITY"));
assert.ok(client.includes('finalQualityReasons'));
assert.ok(client.includes('throw new LocalOcrInsufficientQualityError'));

const parser = fs.readFileSync('src/lib/parser/ocrParser.ts', 'utf8');
const recognizeAt = parser.indexOf('await this.client.recognize');
const provenanceAt = parser.indexOf('const sourceValueProvenance');
assert.ok(recognizeAt >= 0 && provenanceAt > recognizeAt, 'OCR must clear client quality gate before source provenance/promotion is constructed');

const runner = fs.readFileSync('server/cpaOrganization/academyOcrCurriculumRunner.ts', 'utf8');
assert.ok(runner.includes('semantic-blocked-by-ocr-quality'));
assert.ok(runner.includes('accounting-blocked-by-ocr-quality'));
assert.ok(runner.includes('ocr-material-dual-engine-agreement'));

console.log('OCR_FAIL_CLOSED_QUALITY_GATE_TESTS=PASS');
''')

print('OCR_QUALITY_GATE_PATCH_APPLIED')
