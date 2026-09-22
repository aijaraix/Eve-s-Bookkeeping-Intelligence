import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runAcademyOcrCurriculumFixture, type AcademyOcrCurriculumFixture } from '../cpaOrganization/academyOcrCurriculumRunner.js';
import {
  RECEIPT_SHA256, loadReceiptSourceRegionEvidence, receiptEvidenceDir,
} from './fixtures/receiptFiveDimensionFixture.js';

const evidenceDir = receiptEvidenceDir();
const product = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'product-truth.json'), 'utf8'));
const deliverable = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'deliverable-truth.json'), 'utf8'));
const region = loadReceiptSourceRegionEvidence();
assert.equal(product.marker, 'P2_RECEIPT_PRODUCT_TRUTH_BROWSER=PASS');
assert.equal(deliverable.marker, 'P2_RECEIPT_DELIVERABLE_TRUTH=PASS');
assert.equal(product.sourceSha256, RECEIPT_SHA256);
assert.equal(deliverable.sourceSha256, RECEIPT_SHA256);
const receiptPath = path.join(evidenceDir, 'receipt.png');
const buffer = fs.readFileSync(receiptPath);

const lines = [
  'EVE TEST MARKET', 'RECEIPT R-2026-0916', 'DATE 09/16/2026',
  'OFFICE SUPPLIES $24.50', 'PRINTER PAPER $18.00', 'COFFEE $7.25',
  'SUBTOTAL $49.75', 'SALES TAX $3.48', 'TOTAL $53.23', 'VISA 4242 $53.23',
];
const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input); const body = JSON.parse(String(init?.body || '{}'));
  const engine = url.includes('doctr') ? 'doctr' : 'paddleocr';
  const regions = lines.map((text, i) => ({
    regionId: `p1-r${i + 1}`, text, confidence: engine === 'paddleocr' ? 0.997 : 0.952,
    boundingBox: text === 'TOTAL $53.23' ? region.normalizedBoundingBox : { x: 0.05, y: 0.04 + i * 0.05, width: 0.7, height: 0.04, unit: 'NORMALIZED' as const },
  }));
  return new Response(JSON.stringify({
    engine, engineVersion: engine === 'paddleocr' ? '3.7.0' : '1.1.0',
    model: engine === 'paddleocr' ? 'PP-OCRv6-medium' : 'fast_base+crnn_vgg16_bn',
    sourceSha256: body.sourceSha256, elapsedMs: 1,
    pages: [{ pageNumber: 1, width: 900, height: 1000, regions }],
  }), { status: 200, headers: { 'content-type': 'application/json' } });
};

const fixture: AcademyOcrCurriculumFixture = {
  caseId: 'CURR-OCR-RECEIPT-PHOTO', filename: 'receipt.png', mimeType: 'image/png', buffer,
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
  productTruthChecks: [{
    checkId: 'receipt-product-browser', label: 'Actual Eve feature build renders receipt fact and opens exact source-to-pixel lineage', outcome: 'PASS',
    evidenceRefs: [`browser:${product.browserVersion}:${product.renderId}:${product.sourceSha256}`],
    details: [`Rendered ${product.visibleValue}; fact=${product.factId}; provenance=${product.provenanceId}; screenshot=${product.screenshot}`],
  }],
  deliverableTruthChecks: [{
    checkId: 'receipt-deliverable-lineage', label: 'Actual Eve PDF/export package preserves receipt source and reverse lineage', outcome: 'PASS',
    evidenceRefs: [`deliverable:${deliverable.reportId}:${deliverable.version}:${deliverable.pdfSha256}:${deliverable.sourceSha256}`],
    details: [`PDF bytes=${deliverable.pdfBytes}; fact=${deliverable.factId}; provenance=${deliverable.provenanceId}`],
  }],
  productTruthNotTestedReason: 'browser evidence receipt missing',
  deliverableTruthNotTestedReason: 'deliverable evidence receipt missing',
};
const run = await runAcademyOcrCurriculumFixture(fixture, { primaryUrl: 'http://paddle', fallbackUrl: 'http://doctr', fetchImpl: fetchImpl as any });
assert.equal(run.sourceSha256, RECEIPT_SHA256);
assert.equal(run.fiveDimensionEvaluation.overallStatus, 'FIVE_DIMENSION_PASS');
assert.equal(run.fiveDimensionEvaluation.fullyTested, true);
assert.equal(run.fiveDimensionEvaluation.allRequiredDimensionsPassed, true);
assert.equal(run.fiveDimensionEvaluation.passedDimensionCount, 5);
assert.equal(run.fiveDimensionEvaluation.notTestedDimensionCount, 0);
for (const dimension of ['SOURCE_COVERAGE','SEMANTIC_UNDERSTANDING','ACCOUNTING_ACCURACY','PRODUCT_TRUTH','DELIVERABLE_TRUTH'] as const) {
  const grade = run.fiveDimensionEvaluation.dimensions[dimension];
  assert.equal(grade.status, 'PASS', `${dimension} must pass`);
  assert.ok(grade.evidenceRefs.length > 0, `${dimension} PASS must carry evidence refs`);
}
fs.writeFileSync(path.join(evidenceDir, 'five-dimension-result.json'), JSON.stringify(run.fiveDimensionEvaluation, null, 2));
console.log('P2_RECEIPT_FIVE_DIMENSION_PASS=PASS');
