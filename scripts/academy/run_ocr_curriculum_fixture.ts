import fs from 'node:fs';
import path from 'node:path';
import { runAcademyOcrCurriculumFixture, type AcademyOcrCurriculumFixture } from '../../server/cpaOrganization/academyOcrCurriculumRunner.js';

function fixture(caseName: string, filePath: string): AcademyOcrCurriculumFixture {
  const common = {
    filename: path.basename(filePath),
    mimeType: 'image/png',
    buffer: fs.readFileSync(filePath),
    productTruthNotTestedReason: 'This OCR fixture does not exercise the actual Eve browser-rendered value/provenance drawer. Product Truth remains NOT_TESTED until a real browser pass is linked.',
    deliverableTruthNotTestedReason: 'This OCR fixture does not produce or inspect a final customer report/export. Deliverable Truth remains NOT_TESTED until a real deliverable pass is linked.',
  };
  if (caseName === 'receipt') {
    return {
      ...common,
      caseId: 'CURR-OCR-RECEIPT-PHOTO',
      semanticAssertions: [
        { checkId: 'receipt-merchant', label: 'Merchant identity', expectedText: 'EVE TEST MARKET' },
        { checkId: 'receipt-id', label: 'Receipt identifier', expectedText: 'RECEIPT R-2026-0916' },
        { checkId: 'receipt-date', label: 'Receipt date', expectedText: 'DATE 09/16/2026' },
      ],
      accountingAssertions: [
        { checkId: 'receipt-item-1', label: 'Office supplies amount', expectedText: 'OFFICE SUPPLIES $24.50' },
        { checkId: 'receipt-item-2', label: 'Printer paper amount', expectedText: 'PRINTER PAPER $18.00' },
        { checkId: 'receipt-item-3', label: 'Coffee amount', expectedText: 'COFFEE $7.25' },
        { checkId: 'receipt-subtotal', label: 'Receipt subtotal', expectedText: 'SUBTOTAL $49.75' },
        { checkId: 'receipt-tax', label: 'Receipt sales tax', expectedText: 'SALES TAX $3.48' },
        { checkId: 'receipt-total', label: 'Receipt total', expectedText: 'TOTAL $53.23' },
      ],
      reconciliation: {
        checkId: 'receipt-subtotal-tax-total', label: 'Receipt subtotal + tax = total',
        subtotal: 49.75, tax: 3.48, total: 53.23,
        subtotalText: 'SUBTOTAL $49.75', taxText: 'SALES TAX $3.48', totalText: 'TOTAL $53.23',
      },
    };
  }
  if (caseName === 'invoice') {
    return {
      ...common,
      caseId: 'CURR-OCR-SCANNED-INVOICE',
      semanticAssertions: [
        { checkId: 'invoice-vendor', label: 'Invoice vendor', expectedText: 'SYNTHETIC OFFICE SUPPLY CO.' },
        { checkId: 'invoice-id', label: 'Invoice identifier', expectedText: 'INVOICE INV-260916-1042' },
        { checkId: 'invoice-date', label: 'Invoice date', expectedText: 'INVOICE DATE 09/16/2026' },
        { checkId: 'invoice-bill-to', label: 'Invoice customer context', expectedText: 'BILL TO EVE ACADEMY TEST CLIENT' },
      ],
      accountingAssertions: [
        { checkId: 'invoice-line-1', label: 'Binder line amount', expectedText: '$70.00' },
        { checkId: 'invoice-line-2', label: 'Archive box line amount', expectedText: '$60.00' },
        { checkId: 'invoice-line-3', label: 'Document bag line amount', expectedText: '$45.00' },
        { checkId: 'invoice-subtotal', label: 'Invoice subtotal', expectedText: 'SUBTOTAL $175.00' },
        { checkId: 'invoice-tax', label: 'Invoice sales tax', expectedText: 'SALES TAX $12.25' },
        { checkId: 'invoice-total', label: 'Invoice total due', expectedText: 'TOTAL DUE $187.25' },
      ],
      reconciliation: {
        checkId: 'invoice-subtotal-tax-total', label: 'Invoice subtotal + tax = total due',
        subtotal: 175.00, tax: 12.25, total: 187.25,
        subtotalText: 'SUBTOTAL $175.00', taxText: 'SALES TAX $12.25', totalText: 'TOTAL DUE $187.25',
      },
    };
  }
  throw new Error(`Unsupported fixture: ${caseName}`);
}

const [caseName, filePath] = process.argv.slice(2);
if (!caseName || !filePath) {
  console.error('usage: npx tsx scripts/academy/run_ocr_curriculum_fixture.ts <receipt|invoice> <image-path>');
  process.exit(2);
}
const result = await runAcademyOcrCurriculumFixture(fixture(caseName, filePath));
console.log(JSON.stringify({
  caseId: result.caseId,
  sourceSha256: result.sourceSha256,
  selectedEngine: result.ocr.engine,
  routingDecision: result.ocr.routingDecision,
  attempts: result.ocr.attempts.map(a => ({
    engine: a.engine,
    selected: a.selected,
    score: a.score,
    averageConfidence: a.averageConfidence,
    materialMinimumConfidence: a.materialMinimumConfidence,
    regionCount: a.regionCount,
    error: a.error,
    text: a.result?.pages.flatMap(p => p.regions.map(r => r.text)),
  })),
  dualEngineComparison: result.dualEngineComparison,
  fiveDimension: {
    overallStatus: result.fiveDimensionEvaluation.overallStatus,
    testedDimensionCount: result.fiveDimensionEvaluation.testedDimensionCount,
    passedDimensionCount: result.fiveDimensionEvaluation.passedDimensionCount,
    failedDimensionCount: result.fiveDimensionEvaluation.failedDimensionCount,
    notTestedDimensionCount: result.fiveDimensionEvaluation.notTestedDimensionCount,
    dimensions: Object.fromEntries(Object.entries(result.fiveDimensionEvaluation.dimensions).map(([name, d]) => [name, {
      status: d.status,
      score: d.score,
      failedAssertions: d.failedAssertions,
      defects: d.defects,
      notTestedReason: d.notTestedReason,
    }])),
  },
}, null, 2));
