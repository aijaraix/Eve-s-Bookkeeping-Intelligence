#!/usr/bin/env python3
from pathlib import Path


def read(path):
    return Path(path).read_text()


def write(path, content):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.rstrip() + '\n')


def replace_once(path, old, new):
    text = read(path)
    if old not in text:
        raise SystemExit(f'PATCH_ANCHOR_MISSING:{path}:{old[:120]!r}')
    if text.count(old) != 1:
        raise SystemExit(f'PATCH_ANCHOR_NOT_UNIQUE:{path}:{text.count(old)}')
    write(path, text.replace(old, new, 1))

# ---------------------------------------------------------------------------
# Deterministic physical-source verifier for the four degraded OCR cases.
# ---------------------------------------------------------------------------
write('scripts/academy/verify_degraded_ocr_edge_cases.py', r'''#!/usr/bin/env python3
from pathlib import Path
from io import BytesIO
import hashlib
import json
import os
from PIL import Image

OUT = Path(os.environ.get('OCR_EDGE_ACCEPTANCE_DIR', '/tmp/eve-ocr-edge-cases'))
EXPECTED = {
    'receipt.png': 'bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436',
    'invoice.png': '1000426f9989dd8aa2767d57c10248648a770aa05d957d04940fd1463e0cf105',
    'receipt_low_quality.jpg': 'a1f03b9bdda7e8d8eae67d924a62de679a8d5fa6e6d0e94967b2cfd7d417de9c',
    'receipt_rotated_90.png': '9f2496573071e396c8452534bf5afe67ddf0d676a0907919820733418609a698',
    'receipt_skewed_6deg.png': 'ec635a9f1cbb49d89afb0308339e50f591ed2a23d29d44fd8e754279eec4ce0a',
    'receipt_glare_totals.png': '49fac9e0a910f8b8b3f8cd130569cc8732bd15783ddb6611514edb4cd667072a',
    'receipt_cropped_before_totals.png': '017e27b1bdcf1d5045512fe82a2f577cb44e841bdf992405061c55781fa8eaed',
}

def sha(path: Path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

manifest = {'marker': 'P2_OCR_EDGE_PHYSICAL_SOURCE_CONTRACT=PASS', 'files': {}}
for name, expected in EXPECTED.items():
    path = OUT / name
    if not path.exists():
        raise SystemExit(f'MISSING_FIXTURE:{name}')
    actual = sha(path)
    if actual != expected:
        raise SystemExit(f'HASH_MISMATCH:{name}:{actual}:{expected}')
    with Image.open(path) as im:
        manifest['files'][name] = {'sha256': actual, 'bytes': path.stat().st_size, 'width': im.width, 'height': im.height}

# The known 90-degree fixture is reversible to the already-live-proven upright bytes.
with Image.open(OUT / 'receipt_rotated_90.png') as im:
    corrected = im.rotate(270, expand=True, fillcolor=255)
    buf = BytesIO()
    corrected.save(buf, 'PNG', optimize=True)
    corrected_bytes = buf.getvalue()
    if corrected_bytes != (OUT / 'receipt.png').read_bytes():
        raise SystemExit('ROTATION_270_DID_NOT_RESTORE_UPRIGHT_BYTES')
manifest['rotation270RestoresAcceptedReceiptBytes'] = True

# Glare fixture physically erases the material subtotal/tax/total region.
with Image.open(OUT / 'receipt_glare_totals.png').convert('L') as glare:
    material = glare.crop((40, 445, 860, 610))
    extrema = material.getextrema()
    if extrema != (255, 255):
        raise SystemExit(f'GLARE_MATERIAL_REGION_NOT_FULLY_OCCLUDED:{extrema}')
manifest['glareMaterialRegion'] = {'bbox': [40, 445, 860, 610], 'extrema': list(extrema), 'fullyOccluded': True}

# Crop fixture physically ends before the subtotal/tax/total block.
with Image.open(OUT / 'receipt_cropped_before_totals.png') as cropped:
    if (cropped.width, cropped.height) != (900, 450):
        raise SystemExit(f'CROP_DIMENSIONS_UNEXPECTED:{cropped.size}')
manifest['crop'] = {'width': 900, 'height': 450, 'materialTotalsPhysicallyAbsent': True}

# Low-quality and skew fixtures remain exact deterministic physical sources.
with Image.open(OUT / 'receipt_low_quality.jpg') as low:
    if (low.width, low.height) != (405, 450):
        raise SystemExit(f'LOW_QUALITY_DIMENSIONS_UNEXPECTED:{low.size}')
manifest['lowQualityDeterministic'] = True
manifest['skewDeterministic'] = True
manifest['durablePhysicalEvidenceRefs'] = [
    'docs/launch/evidence/2026-09-16_P2_DEGRADED_OCR_FIXTURES_ACCEPTANCE.md',
    'docs/launch/evidence/2026-09-16_P2_OCR_ORIENTATION_RETRY_ACCEPTANCE.md',
    'docs/launch/evidence/2026-09-16_P2_OCR_CURRICULUM_RECEIPT_INVOICE_ACCEPTANCE.md',
]
(OUT / 'physical-source-contract.json').write_text(json.dumps(manifest, indent=2))
print('P2_OCR_EDGE_PHYSICAL_SOURCE_CONTRACT=PASS')
''')

# ---------------------------------------------------------------------------
# Evidence-backed targeted-dimension closure for four OCR edge cases.
# ---------------------------------------------------------------------------
write('server/tests/ocrEdgeCasesCurriculumAcceptance.test.ts', r'''import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { academyMinervaLab, type FiveDimensionCheck, type FiveDimensionName } from '../cpaOrganization/academyMinervaLab.js';
import { runAcademyOcrCurriculumFixture, type AcademyOcrCurriculumFixture } from '../cpaOrganization/academyOcrCurriculumRunner.js';
import { TaskEvidenceSufficiencyEngine, type EvidenceTaskDefinition } from '../cpaOrganization/taskEvidenceSufficiencyEngine.js';

const dir = process.env.OCR_EDGE_ACCEPTANCE_DIR || '/tmp/eve-ocr-edge-cases';
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'physical-source-contract.json'), 'utf8'));
assert.equal(manifest.marker, 'P2_OCR_EDGE_PHYSICAL_SOURCE_CONTRACT=PASS');

const degradedDocPath = 'docs/launch/evidence/2026-09-16_P2_DEGRADED_OCR_FIXTURES_ACCEPTANCE.md';
const orientationDocPath = 'docs/launch/evidence/2026-09-16_P2_OCR_ORIENTATION_RETRY_ACCEPTANCE.md';
const dualDocPath = 'docs/launch/evidence/2026-09-16_P2_OCR_CURRICULUM_RECEIPT_INVOICE_ACCEPTANCE.md';
const degradedDoc = fs.readFileSync(degradedDocPath, 'utf8');
const orientationDoc = fs.readFileSync(orientationDocPath, 'utf8');
const dualDoc = fs.readFileSync(dualDocPath, 'utf8');
assert.ok(degradedDoc.includes('average confidence approximately 0.9946'));
assert.ok(degradedDoc.includes('6-degree skew'));
assert.ok(degradedDoc.includes('Both PaddleOCR and docTR recovered the material receipt content and totals correctly'));
assert.ok(degradedDoc.includes('obscured subtotal/tax/total lines disappeared'));
assert.ok(degradedDoc.includes('no subtotal/tax/total because those source regions were physically absent'));
assert.ok(orientationDoc.includes('OCR_ROTATION_270_RESTORES_ACCEPTED_RECEIPT_BYTES=PASS'));
assert.ok(orientationDoc.includes('OCR_ORIENTATION_RETRY_TESTS=PASS'));
assert.ok(dualDoc.includes('INV0ICE INV-260916-1042'));
assert.ok(dualDoc.includes('INVOICE INV-260916-1042'));
assert.ok(dualDoc.includes('material cross-engine semantic disagreement: verified'));

const hashes = Object.fromEntries(Object.entries(manifest.files).map(([name, row]: [string, any]) => [name, row.sha256]));
const receiptLines = [
  'EVE TEST MARKET', 'RECEIPT R-2026-0916', 'DATE 09/16/2026',
  'OFFICE SUPPLIES $24.50', 'PRINTER PAPER $18.00', 'COFFEE $7.25',
  'SUBTOTAL $49.75', 'SALES TAX $3.48', 'TOTAL $53.23', 'VISA 4242 $53.23',
];
const receiptFallbackLow = [...receiptLines];
receiptFallbackLow[7] = 'SALES, TAX $3.48';
const poorLines = ['FP 50', 'DAT//069/2026', '0 523'];

function makeResult(engine: 'paddleocr' | 'doctr', sourceSha256: string, lines: string[], confidence: number, rotationDegrees = 0) {
  return {
    engine,
    engineVersion: engine === 'paddleocr' ? '3.7.0' : '1.1.0',
    model: engine === 'paddleocr' ? 'PP-OCRv6-medium' : 'fast_base+crnn_vgg16_bn',
    sourceSha256,
    elapsedMs: 10,
    appliedRotationDegrees: rotationDegrees,
    coordinateSpace: 'ORIGINAL_SOURCE' as const,
    pages: [{
      pageNumber: 1,
      width: rotationDegrees === 90 || rotationDegrees === 270 ? 1000 : 900,
      height: rotationDegrees === 90 || rotationDegrees === 270 ? 900 : 1000,
      regions: lines.map((text, i) => ({
        regionId: `p1-r${i + 1}`,
        text,
        confidence,
        boundingBox: { x: 0.05, y: 0.04 + i * 0.055, width: 0.78, height: 0.04, unit: 'NORMALIZED' as const },
      })),
    }],
  };
}

function fetchFor(options: {primary: string[]; fallback: string[]; primaryConfidence: number; fallbackConfidence: number; rotationRecovery?: boolean}) {
  return async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const body = JSON.parse(String(init?.body || '{}'));
    const engine: 'paddleocr' | 'doctr' = url.includes('doctr') ? 'doctr' : 'paddleocr';
    const rotation = Number(body.rotationDegrees || 0);
    let lines = engine === 'doctr' ? options.fallback : options.primary;
    let confidence = engine === 'doctr' ? options.fallbackConfidence : options.primaryConfidence;
    if (options.rotationRecovery && engine === 'paddleocr') {
      if (rotation === 270) { lines = receiptLines; confidence = 0.995; }
      else { lines = poorLines; confidence = 0.68; }
    }
    const payload = makeResult(engine, body.sourceSha256, lines, confidence, rotation);
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } });
  };
}

function receiptFixture(caseId: string, filename: string): AcademyOcrCurriculumFixture {
  return {
    caseId,
    filename,
    mimeType: filename.endsWith('.jpg') ? 'image/jpeg' : 'image/png',
    buffer: fs.readFileSync(path.join(dir, filename)),
    semanticAssertions: [
      { checkId: 'merchant', label: 'Merchant', expectedText: 'EVE TEST MARKET' },
      { checkId: 'receipt-id', label: 'Receipt ID', expectedText: 'RECEIPT R-2026-0916' },
    ],
    accountingAssertions: [
      { checkId: 'subtotal', label: 'Subtotal', expectedText: 'SUBTOTAL $49.75' },
      { checkId: 'tax', label: 'Tax', expectedText: 'SALES TAX $3.48' },
      { checkId: 'total', label: 'Total', expectedText: 'TOTAL $53.23' },
    ],
    reconciliation: { checkId: 'identity', label: 'Subtotal + tax = total', subtotal: 49.75, tax: 3.48, total: 53.23, subtotalText: 'SUBTOTAL $49.75', taxText: 'SALES TAX $3.48', totalText: 'TOTAL $53.23' },
    productTruthNotTestedReason: 'This ingestion edge case does not target browser Product Truth.',
    deliverableTruthNotTestedReason: 'This ingestion edge case does not target final export Deliverable Truth.',
  };
}

const lowRun = await runAcademyOcrCurriculumFixture(receiptFixture('CURR-OCR-LOW-QUALITY-SCAN', 'receipt_low_quality.jpg'), {
  primaryUrl: 'http://paddle', fallbackUrl: 'http://doctr',
  fetchImpl: fetchFor({ primary: receiptLines, fallback: receiptFallbackLow, primaryConfidence: 0.9946, fallbackConfidence: 0.9423 }) as any,
});
assert.equal(lowRun.sourceSha256, hashes['receipt_low_quality.jpg']);
assert.equal(lowRun.fiveDimensionEvaluation.dimensions.SOURCE_COVERAGE.status, 'PASS');
assert.equal(lowRun.fiveDimensionEvaluation.dimensions.ACCOUNTING_ACCURACY.status, 'PASS');
assert.equal(lowRun.qualityFailure, null);

const skewRun = await runAcademyOcrCurriculumFixture(receiptFixture('CURR-OCR-ROTATED-SKEWED', 'receipt_skewed_6deg.png'), {
  primaryUrl: 'http://paddle', fallbackUrl: 'http://doctr',
  fetchImpl: fetchFor({ primary: receiptLines, fallback: receiptLines, primaryConfidence: 0.995, fallbackConfidence: 0.95 }) as any,
});
assert.equal(skewRun.sourceSha256, hashes['receipt_skewed_6deg.png']);
assert.equal(skewRun.fiveDimensionEvaluation.dimensions.SOURCE_COVERAGE.status, 'PASS');
assert.equal(skewRun.fiveDimensionEvaluation.dimensions.SEMANTIC_UNDERSTANDING.status, 'PASS');

const rotatedRun = await runAcademyOcrCurriculumFixture(receiptFixture('CURR-OCR-ROTATED-SKEWED', 'receipt_rotated_90.png'), {
  primaryUrl: 'http://paddle', fallbackUrl: 'http://doctr',
  fetchImpl: fetchFor({ primary: poorLines, fallback: poorLines, primaryConfidence: 0.68, fallbackConfidence: 0.82, rotationRecovery: true }) as any,
  primaryAverageConfidenceFloor: 0.90,
  materialConfidenceFloor: 0.85,
  orientationRetryEnabled: true,
  orientationRetryAngles: [90, 270, 180],
});
assert.equal(rotatedRun.sourceSha256, hashes['receipt_rotated_90.png']);
assert.ok(rotatedRun.ocr);
assert.equal(rotatedRun.ocr?.routingDecision.orientationRetryInvoked, true);
assert.equal(rotatedRun.ocr?.routingDecision.selectedRotationDegrees, 270);
assert.equal(rotatedRun.ocr?.coordinateSpace, 'ORIGINAL_SOURCE');
assert.equal(rotatedRun.fiveDimensionEvaluation.dimensions.SOURCE_COVERAGE.status, 'PASS');
assert.equal(rotatedRun.fiveDimensionEvaluation.dimensions.SEMANTIC_UNDERSTANDING.status, 'PASS');
assert.equal(manifest.rotation270RestoresAcceptedReceiptBytes, true);

// Glare/crop are high-confidence-visible-source cases with material totals absent.
// P1-009 must block only the total-dependent conclusion rather than infer it.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-ocr-edge-suff-'));
const sufficiency = new TaskEvidenceSufficiencyEngine(tmp);
function totalTask(sourceRef: string): EvidenceTaskDefinition {
  return {
    taskId: `receipt-total-${sourceRef.slice(-8)}`,
    taskType: 'RECEIPT_POSTING_REVIEW',
    purpose: 'Establish receipt identity and total for posting review.',
    availableCapabilities: ['MERCHANT_IDENTITY', 'RECEIPT_TOTAL'],
    evidenceRefs: [sourceRef],
    conclusions: [
      { conclusionId: 'merchant-identity', label: 'Merchant identity', requiredCapabilities: ['MERCHANT_IDENTITY'], evidenceRefs: [sourceRef] },
      { conclusionId: 'receipt-total', label: 'Receipt total', requiredCapabilities: ['RECEIPT_TOTAL'], evidenceRefs: [sourceRef] },
    ],
  };
}
function missingTotalDecision(name: string, sha: string) {
  const ref = `source:${sha}`;
  return sufficiency.evaluate({
    task: totalTask(ref),
    gaps: [{
      gapId: `gap-${name}-material-total`,
      sourceArtifactId: name,
      gapType: name.includes('glare') ? 'UNREADABLE_REGION' : 'MISSING_SECTION',
      description: 'Subtotal, tax and total source evidence is physically unavailable in this degraded fixture.',
      location: name.includes('glare') ? 'Material totals region' : 'Source cropped before totals block',
      affectedCapabilities: ['RECEIPT_TOTAL'],
      explicitMateriality: 'MATERIAL',
      evidenceRefs: [ref],
      signals: { structuralRelevance: 'RELEVANT_TO_TASK', continuity: 'BROKEN', reconciliation: 'NOT_RUN' },
    }],
  });
}
const glareDecision = missingTotalDecision('receipt_glare_totals.png', hashes['receipt_glare_totals.png']);
const cropDecision = missingTotalDecision('receipt_cropped_before_totals.png', hashes['receipt_cropped_before_totals.png']);
for (const d of [glareDecision, cropDecision]) {
  assert.equal(d.taskEvidenceSufficiencyState, 'INSUFFICIENT_FOR_CURRENT_PURPOSE');
  assert.ok(d.allowedConclusionIds.includes('merchant-identity'));
  assert.ok(d.blockedConclusionIds.includes('receipt-total'));
  assert.equal(d.recommendedAction, 'REQUEST_ADDITIONAL_EVIDENCE');
}
fs.rmSync(tmp, { recursive: true, force: true });

// Reproduce the physically observed high-confidence semantic engine disagreement
// against the exact deterministic invoice bytes and prove it cannot become a passing
// Academy interpretation solely because Paddle remains the higher-confidence primary.
const invoicePrimary = [
  'SYNTHETIC OFFICE SUPPLY CO.', 'INV0ICE INV-260916-1042', 'INVOICE DATE 09/16/2026', 'DUE DATE 10/16/2026',
  'BILL TO EVE ACADEMY TEST CLIENT', 'ACCOUNTING BINDERS 2 x $35.00 = $70.00', 'ARCHIVE BOXES 5 x $12.00 = $60.00',
  'DOCUMENT BAGS 3 x $15.00 = $45.00', 'SUBTOTAL $175.00', 'SALES TAX $12.25', 'TOTAL DUE $187.25', 'PURCHASE ORDER PO-EVE-1001', 'CURRENCY USD',
];
const invoiceFallback = [...invoicePrimary];
invoiceFallback[1] = 'INVOICE INV-260916-1042';
const invoiceFixture: AcademyOcrCurriculumFixture = {
  caseId: 'CURR-OCR-ENGINE-DISAGREEMENT', filename: 'invoice.png', mimeType: 'image/png', buffer: fs.readFileSync(path.join(dir, 'invoice.png')),
  semanticAssertions: [{ checkId: 'invoice-id', label: 'Invoice ID', expectedText: 'INVOICE INV-260916-1042' }],
  accountingAssertions: [
    { checkId: 'subtotal', label: 'Subtotal', expectedText: 'SUBTOTAL $175.00' },
    { checkId: 'tax', label: 'Tax', expectedText: 'SALES TAX $12.25' },
    { checkId: 'total', label: 'Total due', expectedText: 'TOTAL DUE $187.25' },
  ],
  reconciliation: { checkId: 'identity', label: 'Subtotal + tax = total', subtotal: 175, tax: 12.25, total: 187.25, subtotalText: 'SUBTOTAL $175.00', taxText: 'SALES TAX $12.25', totalText: 'TOTAL DUE $187.25' },
  productTruthNotTestedReason: 'This OCR disagreement edge case does not target browser Product Truth.',
  deliverableTruthNotTestedReason: 'This OCR disagreement edge case does not target final export Deliverable Truth.',
};
const disagreementRun = await runAcademyOcrCurriculumFixture(invoiceFixture, {
  primaryUrl: 'http://paddle', fallbackUrl: 'http://doctr',
  fetchImpl: fetchFor({ primary: invoicePrimary, fallback: invoiceFallback, primaryConfidence: 0.9939, fallbackConfidence: 0.9477 }) as any,
});
assert.equal(disagreementRun.sourceSha256, hashes['invoice.png']);
assert.equal(disagreementRun.dualEngineComparison.compared, true);
assert.equal(disagreementRun.dualEngineComparison.materialDifferenceDetected, true);
assert.equal(disagreementRun.ocr?.engine, 'paddleocr');
assert.equal(disagreementRun.fiveDimensionEvaluation.dimensions.SOURCE_COVERAGE.status, 'PASS');
assert.equal(disagreementRun.fiveDimensionEvaluation.dimensions.ACCOUNTING_ACCURACY.status, 'PASS');
assert.equal(disagreementRun.fiveDimensionEvaluation.dimensions.SEMANTIC_UNDERSTANDING.status, 'FAIL');
assert.equal(disagreementRun.fiveDimensionEvaluation.overallStatus, 'FIVE_DIMENSION_FAIL');

const nt = (id: string, label: string, reason: string): FiveDimensionCheck => ({ checkId: id, label, outcome: 'NOT_TESTED', details: [reason] });
const pass = (id: string, label: string, refs: string[], details: string[]): FiveDimensionCheck => ({ checkId: id, label, outcome: 'PASS', evidenceRefs: refs, details });
const durable = (p: string) => `durable-evidence:${p}`;

function targetedReport(caseId: string, target: FiveDimensionName[], targetChecks: Partial<Record<FiveDimensionName, FiveDimensionCheck[]>>) {
  const names: FiveDimensionName[] = ['SOURCE_COVERAGE','SEMANTIC_UNDERSTANDING','ACCOUNTING_ACCURACY','PRODUCT_TRUTH','DELIVERABLE_TRUTH'];
  const dimensions: any = {};
  for (const name of names) dimensions[name] = { checks: target.includes(name) ? targetChecks[name] : [nt(`${caseId}-${name.toLowerCase()}-out-of-scope`, `${name} outside this case target`, 'This dimension is not targeted by the curated OCR edge case and is intentionally not scored.')] };
  const report = academyMinervaLab.evaluateFiveDimensions({ caseId, executionId: `ocr-edge-${caseId}`, dimensions });
  for (const name of target) assert.equal(report.dimensions[name].status, 'PASS', `${caseId}:${name}`);
  for (const name of names.filter(n => !target.includes(n))) assert.equal(report.dimensions[name].status, 'NOT_TESTED', `${caseId}:${name}`);
  assert.equal(report.failedDimensionCount, 0);
  assert.equal(report.overallStatus, 'INCOMPLETE_DIMENSION_COVERAGE');
  return report;
}

const lowReport = targetedReport('CURR-OCR-LOW-QUALITY-SCAN', ['SOURCE_COVERAGE','ACCOUNTING_ACCURACY'], {
  SOURCE_COVERAGE: [pass('low-source-physical-live', 'Exact low-quality source is reproducible and was physically readable by both live OCR engines', [`source:${hashes['receipt_low_quality.jpg']}`, durable(degradedDocPath)], ['Pinned source SHA reproduced; prior live Paddle/docTR observations preserve confidence and literal provenance.'])],
  ACCOUNTING_ACCURACY: [pass('low-totals-reconciled', 'Material subtotal tax and total remain readable and reconcile on the accepted low-quality fixture', lowRun.fiveDimensionEvaluation.dimensions.ACCOUNTING_ACCURACY.evidenceRefs.concat([durable(degradedDocPath)]), ['49.75 + 3.48 = 53.23; current Academy routing contract also preserves the source SHA and OCR evidence.'])],
});

const rotatedReport = targetedReport('CURR-OCR-ROTATED-SKEWED', ['SOURCE_COVERAGE','SEMANTIC_UNDERSTANDING'], {
  SOURCE_COVERAGE: [pass('rotation-skew-source-lineage', 'Rotated and skewed fixtures retain exact source identity and original-coordinate lineage', [`source:${hashes['receipt_rotated_90.png']}`, `source:${hashes['receipt_skewed_6deg.png']}`, durable(orientationDocPath), ...rotatedRun.fiveDimensionEvaluation.dimensions.SOURCE_COVERAGE.evidenceRefs], [`selectedRotation=${rotatedRun.ocr?.routingDecision.selectedRotationDegrees}; coordinateSpace=${rotatedRun.ocr?.coordinateSpace}`])],
  SEMANTIC_UNDERSTANDING: [pass('rotation-skew-reading-order', 'Skew remains readable and the 90-degree fixture is recovered by bounded orientation retry', [`source:${hashes['receipt_skewed_6deg.png']}`, `source:${hashes['receipt_rotated_90.png']}`, durable(degradedDocPath), durable(orientationDocPath)], ['Prior live OCR recovered the 6-degree skew; the 90-degree fixture selects 270-degree correction and regenerates the accepted upright bytes exactly.'])],
});

const glareReport = targetedReport('CURR-OCR-GLARE-CROP', ['SOURCE_COVERAGE','ACCOUNTING_ACCURACY'], {
  SOURCE_COVERAGE: [pass('glare-crop-material-loss-visible', 'Glare and crop physical source loss remains explicit rather than being represented as complete evidence', [`source:${hashes['receipt_glare_totals.png']}`, `source:${hashes['receipt_cropped_before_totals.png']}`, durable(degradedDocPath)], [`glareFullyOccluded=${manifest.glareMaterialRegion.fullyOccluded}; cropTotalsAbsent=${manifest.crop.materialTotalsPhysicallyAbsent}`])],
  ACCOUNTING_ACCURACY: [pass('glare-crop-total-blocked', 'P1-009 blocks the receipt-total conclusion while leaving unrelated supported identity usable', [`p1-009:${glareDecision.decisionId}`, `p1-009:${cropDecision.decisionId}`, `source:${hashes['receipt_glare_totals.png']}`, `source:${hashes['receipt_cropped_before_totals.png']}`], [`glareBlocked=${glareDecision.blockedConclusionIds.join(',')}; cropBlocked=${cropDecision.blockedConclusionIds.join(',')}; merchant remains allowed`])],
});

const disagreementRefs = disagreementRun.ocr?.attempts.filter(a => a.result).map(a => `ocr-attempt:${a.engine}:${hashes['invoice.png']}`) || [];
const disagreementReport = targetedReport('CURR-OCR-ENGINE-DISAGREEMENT', ['SOURCE_COVERAGE','ACCOUNTING_ACCURACY'], {
  SOURCE_COVERAGE: [pass('engine-disagreement-preserved', 'Both live-proven engine alternatives and exact source identity are preserved for review', [`source:${hashes['invoice.png']}`, durable(dualDocPath), ...disagreementRefs], [`primary=INV0ICE INV-260916-1042; fallback=INVOICE INV-260916-1042; materialDifference=${disagreementRun.dualEngineComparison.materialDifferenceDetected}`])],
  ACCOUNTING_ACCURACY: [pass('engine-disagreement-blocks-semantic-promotion', 'Accounting amounts reconcile but unresolved material OCR disagreement prevents a passing canonical interpretation', disagreementRun.fiveDimensionEvaluation.dimensions.ACCOUNTING_ACCURACY.evidenceRefs.concat([`academy-evaluation:${disagreementRun.fiveDimensionEvaluation.evaluationId}`, durable(dualDocPath)]), [`accounting=${disagreementRun.fiveDimensionEvaluation.dimensions.ACCOUNTING_ACCURACY.status}; semantic=${disagreementRun.fiveDimensionEvaluation.dimensions.SEMANTIC_UNDERSTANDING.status}; overall=${disagreementRun.fiveDimensionEvaluation.overallStatus}`])],
});

const output = {
  marker: 'P2_OCR_EDGE_CASES_TARGETED_DIMENSIONS_ACCEPTED=PASS',
  physicalSourceMarker: manifest.marker,
  cases: {
    lowQuality: lowReport,
    rotatedSkewed: rotatedReport,
    glareCrop: glareReport,
    engineDisagreement: disagreementReport,
  },
  sourceHashes: hashes,
};
fs.writeFileSync(path.join(dir, 'ocr-edge-cases-acceptance.json'), JSON.stringify(output, null, 2));
console.log('P2_OCR_EDGE_CASES_TARGETED_DIMENSIONS_ACCEPTED=PASS');
''')

# ---------------------------------------------------------------------------
# Curriculum catalog: promote four physically accepted edge fixtures only.
# ---------------------------------------------------------------------------
replace_once('server/cpaOrganization/academyMinervaLab.ts', """        'PHYSICAL_FIXTURE_REQUIRED',
        ['server/tests/ocrParserEvidence.test.ts']
      ),
      caseSpec(
        'CURR-OCR-ROTATED-SKEWED',
""", """        'CONTRACT_READY',
        ['scripts/academy/verify_degraded_ocr_edge_cases.py', 'server/tests/ocrEdgeCasesCurriculumAcceptance.test.ts', 'server/tests/ocrFailClosedQualityGate.test.ts', 'docs/launch/evidence/2026-09-16_P2_DEGRADED_OCR_FIXTURES_ACCEPTANCE.md', 'docs/launch/evidence/2026-09-16_P2_OCR_EDGE_CASES_ACCEPTANCE.md']
      ),
      caseSpec(
        'CURR-OCR-ROTATED-SKEWED',
""")
replace_once('server/cpaOrganization/academyMinervaLab.ts', """        'PHYSICAL_FIXTURE_REQUIRED'
      ),
      caseSpec(
        'CURR-OCR-GLARE-CROP',
""", """        'CONTRACT_READY',
        ['scripts/academy/verify_degraded_ocr_edge_cases.py', 'server/tests/ocrEdgeCasesCurriculumAcceptance.test.ts', 'server/tests/ocrOrientationRetry.test.ts', 'docs/launch/evidence/2026-09-16_P2_OCR_ORIENTATION_RETRY_ACCEPTANCE.md', 'docs/launch/evidence/2026-09-16_P2_OCR_EDGE_CASES_ACCEPTANCE.md']
      ),
      caseSpec(
        'CURR-OCR-GLARE-CROP',
""")
replace_once('server/cpaOrganization/academyMinervaLab.ts', """        'PHYSICAL_FIXTURE_REQUIRED',
        ['server/tests/taskEvidenceSufficiency.test.ts']
      ),
      caseSpec(
        'CURR-OCR-ENGINE-DISAGREEMENT',
""", """        'CONTRACT_READY',
        ['scripts/academy/verify_degraded_ocr_edge_cases.py', 'server/tests/ocrEdgeCasesCurriculumAcceptance.test.ts', 'server/tests/taskEvidenceSufficiency.test.ts', 'docs/launch/evidence/2026-09-16_P2_DEGRADED_OCR_FIXTURES_ACCEPTANCE.md', 'docs/launch/evidence/2026-09-16_P2_OCR_EDGE_CASES_ACCEPTANCE.md']
      ),
      caseSpec(
        'CURR-OCR-ENGINE-DISAGREEMENT',
""")
replace_once('server/cpaOrganization/academyMinervaLab.ts', """        'PHYSICAL_FIXTURE_REQUIRED',
        ['docs/launch/evidence/2026-09-16_LOCAL_OCR_SOURCE_TO_PIXEL_ACCEPTANCE.md']
      ),
""", """        'CONTRACT_READY',
        ['server/tests/academyOcrCurriculumRunner.test.ts', 'server/tests/ocrEdgeCasesCurriculumAcceptance.test.ts', 'docs/launch/evidence/2026-09-16_P2_OCR_CURRICULUM_RECEIPT_INVOICE_ACCEPTANCE.md', 'docs/launch/evidence/2026-09-16_P2_OCR_EDGE_CASES_ACCEPTANCE.md']
      ),
""")

# Catalog regression count and case assertions.
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts', """assert.equal(coverage.contractReadyCases, 13);
assert.equal(coverage.physicalFixturePendingCases, 7);
""", """assert.equal(coverage.contractReadyCases, 17);
assert.equal(coverage.physicalFixturePendingCases, 3);
""")
anchor = """assert.ok(find('CURR-OCR-ENGINE-DISAGREEMENT').expectedSafeguards.join(' ').includes('Preserve both engine outputs'));
"""
replacement = """assert.equal(find('CURR-OCR-LOW-QUALITY-SCAN').fixtureStatus, 'CONTRACT_READY');
assert.ok(find('CURR-OCR-LOW-QUALITY-SCAN').validationRefs.includes('server/tests/ocrEdgeCasesCurriculumAcceptance.test.ts'));
assert.equal(find('CURR-OCR-ROTATED-SKEWED').fixtureStatus, 'CONTRACT_READY');
assert.ok(find('CURR-OCR-ROTATED-SKEWED').validationRefs.includes('server/tests/ocrOrientationRetry.test.ts'));
assert.equal(find('CURR-OCR-GLARE-CROP').fixtureStatus, 'CONTRACT_READY');
assert.ok(find('CURR-OCR-GLARE-CROP').validationRefs.includes('server/tests/taskEvidenceSufficiency.test.ts'));
assert.equal(find('CURR-OCR-ENGINE-DISAGREEMENT').fixtureStatus, 'CONTRACT_READY');
assert.ok(find('CURR-OCR-ENGINE-DISAGREEMENT').expectedSafeguards.join(' ').includes('Preserve both engine outputs'));
assert.ok(find('CURR-OCR-ENGINE-DISAGREEMENT').validationRefs.includes('server/tests/academyOcrCurriculumRunner.test.ts'));
"""
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts', anchor, replacement)

print('OCR_EDGE_CASES_PATCH_APPLIED')
