import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { LocalOcrClient } from '../../src/lib/ocr/localOcrClient.js';
import { runAcademyOcrCurriculumFixture, type AcademyOcrCurriculumFixture } from '../cpaOrganization/academyOcrCurriculumRunner.js';

function makeResult(engine: 'paddleocr' | 'doctr', sourceSha256: string, lines: string[], confidence: number) {
  return {
    engine,
    engineVersion: engine === 'paddleocr' ? '3.7.0' : '1.1.0',
    model: engine === 'paddleocr' ? 'PP-OCRv6-medium' : 'fast_base+crnn_vgg16_bn',
    sourceSha256,
    elapsedMs: engine === 'paddleocr' ? 1000 : 800,
    pages: [{
      pageNumber: 1,
      width: 1200,
      height: 1200,
      regions: lines.map((text, i) => ({
        regionId: `p1-r${i + 1}`,
        text,
        confidence,
        boundingBox: { x: 0.05, y: 0.05 + (i * 0.05), width: 0.7, height: 0.04, unit: 'NORMALIZED' as const },
      })),
    }],
  };
}

function fetchFor(primaryLines: string[], fallbackLines: string[], primaryConfidence = 0.99, fallbackConfidence = 0.95) {
  return async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const body = JSON.parse(String(init?.body || '{}'));
    const engine = url.includes('doctr') ? 'doctr' : 'paddleocr';
    const payload = makeResult(engine, body.sourceSha256, engine === 'doctr' ? fallbackLines : primaryLines, engine === 'doctr' ? fallbackConfidence : primaryConfidence);
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } });
  };
}

const receiptLines = [
  'EVE TEST MARKET', 'RECEIPT R-2026-0916', 'DATE 09/16/2026',
  'OFFICE SUPPLIES $24.50', 'PRINTER PAPER $18.00', 'COFFEE $7.25',
  'SUBTOTAL $49.75', 'SALES TAX $3.48', 'TOTAL $53.23',
];
const receiptFixture: AcademyOcrCurriculumFixture = {
  caseId: 'CURR-OCR-RECEIPT-PHOTO', filename: 'receipt.png', mimeType: 'image/png', buffer: Buffer.from('receipt-fixture'),
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
  productTruthNotTestedReason: 'browser not exercised',
  deliverableTruthNotTestedReason: 'export not exercised',
};
const receiptRun = await runAcademyOcrCurriculumFixture(receiptFixture, {
  primaryUrl: 'http://paddle', fallbackUrl: 'http://doctr', fetchImpl: fetchFor(receiptLines, receiptLines) as any,
});
assert.equal(receiptRun.ocr.routingDecision.fallbackInvoked, true);
assert.ok(receiptRun.ocr.routingDecision.reasons.includes('FORCED_DUAL_ENGINE_EVALUATION'));
assert.equal(receiptRun.dualEngineComparison.compared, true);
assert.equal(receiptRun.dualEngineComparison.detected, false);
assert.equal(receiptRun.fiveDimensionEvaluation.dimensions.SOURCE_COVERAGE.status, 'PASS');
assert.equal(receiptRun.fiveDimensionEvaluation.dimensions.SEMANTIC_UNDERSTANDING.status, 'PASS');
assert.equal(receiptRun.fiveDimensionEvaluation.dimensions.ACCOUNTING_ACCURACY.status, 'PASS');
assert.equal(receiptRun.fiveDimensionEvaluation.dimensions.PRODUCT_TRUTH.status, 'NOT_TESTED');
assert.equal(receiptRun.fiveDimensionEvaluation.dimensions.DELIVERABLE_TRUTH.status, 'NOT_TESTED');
assert.equal(receiptRun.fiveDimensionEvaluation.overallStatus, 'INCOMPLETE_DIMENSION_COVERAGE');
for (const dimension of ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY'] as const) {
  assert.ok(receiptRun.fiveDimensionEvaluation.dimensions[dimension].evidenceRefs.length > 0);
}

const invoicePrimary = [
  'SYNTHETIC OFFICE SUPPLY CO.', 'INV0ICE INV-260916-1042', 'INVOICE DATE 09/16/2026', 'BILL TO EVE ACADEMY TEST CLIENT',
  'ACCOUNTING BINDERS 2 x $35.00 = $70.00', 'ARCHIVE BOXES 5 x $12.00 = $60.00', 'DOCUMENT BAGS 3 x $15.00 = $45.00',
  'SUBTOTAL $175.00', 'SALES TAX $12.25', 'TOTAL DUE $187.25',
];
const invoiceFallback = [...invoicePrimary];
invoiceFallback[1] = 'INVOICE INV-260916-1042';
const invoiceFixture: AcademyOcrCurriculumFixture = {
  caseId: 'CURR-OCR-SCANNED-INVOICE', filename: 'invoice.png', mimeType: 'image/png', buffer: Buffer.from('invoice-fixture'),
  semanticAssertions: [
    { checkId: 'vendor', label: 'Vendor', expectedText: 'SYNTHETIC OFFICE SUPPLY CO.' },
    { checkId: 'invoice-id', label: 'Invoice ID', expectedText: 'INVOICE INV-260916-1042' },
  ],
  accountingAssertions: [
    { checkId: 'subtotal', label: 'Subtotal', expectedText: 'SUBTOTAL $175.00' },
    { checkId: 'tax', label: 'Tax', expectedText: 'SALES TAX $12.25' },
    { checkId: 'total', label: 'Total', expectedText: 'TOTAL DUE $187.25' },
  ],
  reconciliation: { checkId: 'identity', label: 'Subtotal + tax = total', subtotal: 175, tax: 12.25, total: 187.25, subtotalText: 'SUBTOTAL $175.00', taxText: 'SALES TAX $12.25', totalText: 'TOTAL DUE $187.25' },
  productTruthNotTestedReason: 'browser not exercised',
  deliverableTruthNotTestedReason: 'export not exercised',
};
const invoiceRun = await runAcademyOcrCurriculumFixture(invoiceFixture, {
  primaryUrl: 'http://paddle', fallbackUrl: 'http://doctr', fetchImpl: fetchFor(invoicePrimary, invoiceFallback, 0.994, 0.948) as any,
});
assert.equal(invoiceRun.ocr.engine, 'paddleocr', 'existing score policy still selects higher-confidence primary');
assert.equal(invoiceRun.dualEngineComparison.detected, true);
assert.equal(invoiceRun.dualEngineComparison.materialDifferenceDetected, true);
assert.ok(invoiceRun.dualEngineComparison.differences.some(d => d.primaryText.includes('INV0ICE') && d.fallbackText.includes('INVOICE')));
assert.equal(invoiceRun.fiveDimensionEvaluation.dimensions.SOURCE_COVERAGE.status, 'PASS');
assert.equal(invoiceRun.fiveDimensionEvaluation.dimensions.SEMANTIC_UNDERSTANDING.status, 'FAIL', 'ground-truth semantic mismatch must fail independently');
assert.ok(invoiceRun.fiveDimensionEvaluation.dimensions.SEMANTIC_UNDERSTANDING.failedAssertions.includes('invoice-id'));
assert.equal(invoiceRun.fiveDimensionEvaluation.dimensions.ACCOUNTING_ACCURACY.status, 'PASS');
assert.equal(invoiceRun.fiveDimensionEvaluation.overallStatus, 'FIVE_DIMENSION_FAIL');

// Production/default routing must NOT pay for fallback when high-confidence primary passes normal policy.
let defaultCalls = 0;
const source = Buffer.from('default-routing');
const sourceSha = crypto.createHash('sha256').update(source).digest('hex');
const defaultClient = new LocalOcrClient({
  primaryUrl: 'http://paddle', fallbackUrl: 'http://doctr',
  fetchImpl: (async (input: string | URL | Request, init?: RequestInit) => {
    defaultCalls += 1;
    const body = JSON.parse(String(init?.body || '{}'));
    const url = String(input);
    assert.ok(!url.includes('doctr'), 'fallback should not be called in default high-confidence path');
    return new Response(JSON.stringify(makeResult('paddleocr', body.sourceSha256, receiptLines, 0.995)), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as any,
});
const defaultRun = await defaultClient.recognize({ filename: 'default.png', mimeType: 'image/png', buffer: source, sourceSha256: sourceSha });
assert.equal(defaultCalls, 1);
assert.equal(defaultRun.routingDecision.fallbackInvoked, false);
assert.ok(!defaultRun.routingDecision.reasons.includes('FORCED_DUAL_ENGINE_EVALUATION'));

console.log('ACADEMY_OCR_CURRICULUM_RUNNER_TESTS=PASS');
