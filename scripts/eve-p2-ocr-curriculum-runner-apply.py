from pathlib import Path


def replace_exact(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'MISSING_SNIPPET:{path}:{old[:180]!r}')
    p.write_text(text.replace(old, new, 1))

# ---------------------------------------------------------------------------
# Local OCR client: opt-in forced dual-engine evaluation for Academy only.
# Default remains false, so production economics/routing are unchanged.
# ---------------------------------------------------------------------------
client = 'src/lib/ocr/localOcrClient.ts'
replace_exact(
    client,
    """  fallbackImprovementMargin?: number;
  fetchImpl?: typeof fetch;
}
""",
    """  fallbackImprovementMargin?: number;
  forceFallbackEvaluation?: boolean;
  fetchImpl?: typeof fetch;
}
"""
)
replace_exact(
    client,
    """  private fallbackImprovementMargin: number;
  private fetchImpl: typeof fetch;
""",
    """  private fallbackImprovementMargin: number;
  private forceFallbackEvaluation: boolean;
  private fetchImpl: typeof fetch;
"""
)
replace_exact(
    client,
    """    this.fallbackImprovementMargin = options.fallbackImprovementMargin ?? envNumber('EVE_OCR_FALLBACK_IMPROVEMENT_MARGIN', DEFAULT_IMPROVEMENT_MARGIN);
    this.fetchImpl = options.fetchImpl ?? fetch;
""",
    """    this.fallbackImprovementMargin = options.fallbackImprovementMargin ?? envNumber('EVE_OCR_FALLBACK_IMPROVEMENT_MARGIN', DEFAULT_IMPROVEMENT_MARGIN);
    this.forceFallbackEvaluation = options.forceFallbackEvaluation === true;
    this.fetchImpl = options.fetchImpl ?? fetch;
"""
)
replace_exact(
    client,
    """    const reasons = primary && primaryQuality ? this.fallbackReasons(primary, primaryQuality) : ['PRIMARY_UNAVAILABLE'];
    const shouldInvokeFallback = Boolean(this.fallbackUrl) && (!primary || reasons.length > 0);
""",
    """    const reasons = primary && primaryQuality ? this.fallbackReasons(primary, primaryQuality) : ['PRIMARY_UNAVAILABLE'];
    if (this.forceFallbackEvaluation && primary && this.fallbackUrl) reasons.push('FORCED_DUAL_ENGINE_EVALUATION');
    const shouldInvokeFallback = Boolean(this.fallbackUrl) && (this.forceFallbackEvaluation || !primary || reasons.length > 0);
"""
)

# ---------------------------------------------------------------------------
# Academy OCR curriculum runner.
# ---------------------------------------------------------------------------
Path('server/cpaOrganization/academyOcrCurriculumRunner.ts').write_text(r'''import crypto from 'node:crypto';
import {
  LocalOcrClient,
  type LocalOcrAttempt,
  type LocalOcrClientOptions,
  type LocalOcrCompositeResult,
  type LocalOcrEngineResult,
  type LocalOcrRegion,
} from '../../src/lib/ocr/localOcrClient.js';
import {
  academyMinervaLab,
  type FiveDimensionCheck,
  type FiveDimensionEvaluationReport,
} from './academyMinervaLab.js';

export interface AcademyOcrTextAssertion {
  checkId: string;
  label: string;
  expectedText: string;
}

export interface AcademyOcrReconciliation {
  checkId: string;
  label: string;
  subtotal: number;
  tax: number;
  total: number;
  tolerance?: number;
  subtotalText: string;
  taxText: string;
  totalText: string;
}

export interface AcademyOcrCurriculumFixture {
  caseId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  semanticAssertions: AcademyOcrTextAssertion[];
  accountingAssertions: AcademyOcrTextAssertion[];
  reconciliation?: AcademyOcrReconciliation;
  productTruthNotTestedReason: string;
  deliverableTruthNotTestedReason: string;
}

export interface AcademyOcrEngineTextDifference {
  regionIndex: number;
  primaryText: string;
  fallbackText: string;
  material: boolean;
}

export interface AcademyOcrDualEngineComparison {
  compared: boolean;
  detected: boolean;
  materialDifferenceDetected: boolean;
  primaryEngine: string | null;
  fallbackEngine: string | null;
  differences: AcademyOcrEngineTextDifference[];
}

export interface AcademyOcrCurriculumRunResult {
  caseId: string;
  sourceSha256: string;
  ocr: LocalOcrCompositeResult;
  dualEngineComparison: AcademyOcrDualEngineComparison;
  fiveDimensionEvaluation: FiveDimensionEvaluationReport;
}

function normalizeText(value: string): string {
  return String(value || '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[^A-Z0-9$€£¥₹#:/.,=+\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function regions(result?: LocalOcrEngineResult): LocalOcrRegion[] {
  return (result?.pages || []).flatMap(page => Array.isArray(page.regions) ? page.regions : []);
}

function evidenceRef(result: LocalOcrEngineResult, region: LocalOcrRegion): string {
  const page = (result.pages || []).find(p => p.regions?.some(r => r.regionId === region.regionId));
  return `ocr:${result.engine}:${result.sourceSha256}:p${page?.pageNumber || 1}:${region.regionId}`;
}

function evidenceRefsForText(result: LocalOcrEngineResult, expectedText: string): string[] {
  const needle = normalizeText(expectedText);
  if (!needle) return [];
  return regions(result)
    .filter(region => normalizeText(region.text).includes(needle))
    .map(region => evidenceRef(result, region));
}

function fullText(result: LocalOcrEngineResult): string {
  return normalizeText(regions(result).map(region => region.text).join(' | '));
}

function isMaterialDifference(a: string, b: string): boolean {
  const joined = `${a} ${b}`;
  return /[$€£¥₹]|\d|\b(?:TOTAL|SUBTOTAL|TAX|INVOICE|RECEIPT|DATE|AMOUNT|BALANCE|CURRENCY)\b/i.test(joined);
}

function compareAttempts(attempts: LocalOcrAttempt[]): AcademyOcrDualEngineComparison {
  const primary = attempts.find(a => a.engine === 'paddleocr' && a.result)?.result;
  const fallback = attempts.find(a => a.engine === 'doctr' && a.result)?.result;
  if (!primary || !fallback) {
    return {
      compared: false,
      detected: false,
      materialDifferenceDetected: false,
      primaryEngine: primary?.engine || null,
      fallbackEngine: fallback?.engine || null,
      differences: [],
    };
  }
  const p = regions(primary);
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
  return {
    compared: true,
    detected: differences.length > 0,
    materialDifferenceDetected: differences.some(d => d.material),
    primaryEngine: primary.engine,
    fallbackEngine: fallback.engine,
    differences,
  };
}

function assertionCheck(result: LocalOcrEngineResult, assertion: AcademyOcrTextAssertion): FiveDimensionCheck {
  const refs = evidenceRefsForText(result, assertion.expectedText);
  const observed = fullText(result).includes(normalizeText(assertion.expectedText));
  return {
    checkId: assertion.checkId,
    label: assertion.label,
    outcome: observed ? 'PASS' : 'FAIL',
    evidenceRefs: refs,
    details: observed
      ? [`Observed expected OCR literal: ${assertion.expectedText}`]
      : [`Expected OCR literal not present in selected engine output: ${assertion.expectedText}`],
  };
}

function reconciliationCheck(result: LocalOcrEngineResult, rec: AcademyOcrReconciliation): FiveDimensionCheck {
  const tolerance = rec.tolerance ?? 0.005;
  const identityOk = Math.abs((rec.subtotal + rec.tax) - rec.total) <= tolerance;
  const refs = [
    ...evidenceRefsForText(result, rec.subtotalText),
    ...evidenceRefsForText(result, rec.taxText),
    ...evidenceRefsForText(result, rec.totalText),
  ];
  const textOk = refs.length >= 3 &&
    fullText(result).includes(normalizeText(rec.subtotalText)) &&
    fullText(result).includes(normalizeText(rec.taxText)) &&
    fullText(result).includes(normalizeText(rec.totalText));
  return {
    checkId: rec.checkId,
    label: rec.label,
    outcome: identityOk && textOk ? 'PASS' : 'FAIL',
    evidenceRefs: [...new Set(refs)],
    details: [
      `Expected identity: ${rec.subtotal} + ${rec.tax} = ${rec.total}; arithmetic=${identityOk ? 'PASS' : 'FAIL'}; selected OCR literals=${textOk ? 'PASS' : 'FAIL'}.`,
    ],
  };
}

function sourceChecks(sourceSha256: string, ocr: LocalOcrCompositeResult): FiveDimensionCheck[] {
  const selectedRegions = regions(ocr);
  const exactHash = ocr.sourceSha256.toLowerCase() === sourceSha256.toLowerCase();
  const coordinateComplete = selectedRegions.length > 0 && ocr.pages.every(page =>
    Number(page.width) > 0 && Number(page.height) > 0 && page.regions.every(region => {
      const b = region.boundingBox;
      return Boolean(region.regionId) && Boolean(String(region.text || '').trim()) &&
        Number.isFinite(region.confidence) && Boolean(b) && b.unit === 'NORMALIZED' &&
        [b.x, b.y, b.width, b.height].every(v => Number.isFinite(v) && v >= 0 && v <= 1);
    })
  );
  const dualPreserved = ocr.attempts.filter(a => a.result).length >= 2;
  const selectedEvidence = selectedRegions.slice(0, 3).map(region => evidenceRef(ocr, region));
  return [
    {
      checkId: 'ocr-source-hash',
      label: 'Selected OCR output preserves the exact original source SHA-256',
      outcome: exactHash ? 'PASS' : 'FAIL',
      evidenceRefs: exactHash ? [`source:${sourceSha256}`] : [],
      details: [`selected=${ocr.sourceSha256}; expected=${sourceSha256}`],
    },
    {
      checkId: 'ocr-region-coordinate-contract',
      label: 'OCR text regions preserve dimensions, confidence and normalized bounding coordinates',
      outcome: coordinateComplete ? 'PASS' : 'FAIL',
      evidenceRefs: coordinateComplete ? selectedEvidence : [],
      details: [`selected engine=${ocr.engine}; pages=${ocr.pages.length}; regions=${selectedRegions.length}`],
    },
    {
      checkId: 'ocr-dual-engine-attempt-preservation',
      label: 'Academy dual-engine mode preserves both PaddleOCR and docTR attempts',
      outcome: dualPreserved ? 'PASS' : 'FAIL',
      evidenceRefs: dualPreserved
        ? ocr.attempts.filter(a => a.result).map(a => `ocr-attempt:${a.engine}:${sourceSha256}`)
        : [],
      details: [`attempt engines=${ocr.attempts.map(a => `${a.engine}:${a.result ? 'RESULT' : 'NO_RESULT'}`).join(', ')}`],
    },
  ];
}

export async function runAcademyOcrCurriculumFixture(
  fixture: AcademyOcrCurriculumFixture,
  clientOptions: LocalOcrClientOptions = {},
): Promise<AcademyOcrCurriculumRunResult> {
  const sourceSha256 = crypto.createHash('sha256').update(fixture.buffer).digest('hex');
  const client = new LocalOcrClient({
    ...clientOptions,
    forceFallbackEvaluation: true,
  });
  const ocr = await client.recognize({
    filename: fixture.filename,
    mimeType: fixture.mimeType,
    buffer: fixture.buffer,
    sourceSha256,
  });
  const dualEngineComparison = compareAttempts(ocr.attempts);
  const semanticChecks = fixture.semanticAssertions.map(assertion => assertionCheck(ocr, assertion));
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
    dualEngineComparison,
    fiveDimensionEvaluation,
  };
}
''')

# ---------------------------------------------------------------------------
# Physical-fixture generation recipe used on the Eve CPU host. It is not part
# of production runtime and writes only when an operator explicitly runs it.
# ---------------------------------------------------------------------------
Path('scripts/academy').mkdir(parents=True, exist_ok=True)
Path('scripts/academy/generate_ocr_curriculum_fixtures.py').write_text(r'''#!/usr/bin/env python3
"""Generate deterministic synthetic receipt/invoice images for Academy OCR cases.

Requires Pillow 12.3.0 and the DejaVu Mono fonts at the paths below. These
fixtures contain no customer data. Generation is deliberately separate from
production application dependencies.
"""
from pathlib import Path
from io import BytesIO
import argparse
import hashlib
import PIL
from PIL import Image, ImageDraw, ImageFont

EXPECTED_PILLOW = '12.3.0'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'


def font(path: str, size: int):
    return ImageFont.truetype(path, size)


def write_image(path: Path, width: int, height: int, rows):
    image = Image.new('L', (width, height), 255)
    draw = ImageDraw.Draw(image)
    y = 60 if width == 900 else 55
    for text, font_path, size in rows:
        draw.text((60 if width == 900 else 55, y), text, font=font(font_path, size), fill=0)
        y += size + (18 if width == 900 else 20)
    data = BytesIO()
    image.save(data, 'PNG', optimize=True)
    payload = data.getvalue()
    path.write_bytes(payload)
    return hashlib.sha256(payload).hexdigest(), len(payload)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('output_dir')
    args = parser.parse_args()
    if PIL.__version__ != EXPECTED_PILLOW:
        raise SystemExit(f'Pillow {EXPECTED_PILLOW} required for fixture reproducibility; found {PIL.__version__}')
    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)

    receipt = [
        ('EVE TEST MARKET', BOLD, 42), ('123 ACADEMY WAY', FONT, 30), ('MIAMI FL 33101', FONT, 30),
        ('RECEIPT R-2026-0916', FONT, 30), ('DATE 09/16/2026', FONT, 30),
        ('OFFICE SUPPLIES $24.50', FONT, 30), ('PRINTER PAPER $18.00', FONT, 30), ('COFFEE $7.25', FONT, 30),
        ('SUBTOTAL $49.75', FONT, 30), ('SALES TAX $3.48', FONT, 30), ('TOTAL $53.23', BOLD, 40), ('VISA 4242 $53.23', FONT, 30),
    ]
    invoice = [
        ('SYNTHETIC OFFICE SUPPLY CO.', BOLD, 36), ('INVOICE INV-260916-1042', BOLD, 34),
        ('INVOICE DATE 09/16/2026', FONT, 28), ('DUE DATE 10/16/2026', FONT, 28),
        ('BILL TO EVE ACADEMY TEST CLIENT', FONT, 28), ('ACCOUNTING BINDERS 2 x $35.00 = $70.00', FONT, 26),
        ('ARCHIVE BOXES 5 x $12.00 = $60.00', FONT, 26), ('DOCUMENT BAGS 3 x $15.00 = $45.00', FONT, 26),
        ('SUBTOTAL $175.00', FONT, 30), ('SALES TAX $12.25', FONT, 30), ('TOTAL DUE $187.25', BOLD, 38),
        ('PURCHASE ORDER PO-EVE-1001', FONT, 28), ('CURRENCY USD', FONT, 28),
    ]
    for name, w, h, rows in [('receipt.png', 900, 1000, receipt), ('invoice.png', 1200, 1200, invoice)]:
        sha, size = write_image(out / name, w, h, rows)
        print(f'{name}\tbytes={size}\tsha256={sha}')


if __name__ == '__main__':
    main()
''')

# ---------------------------------------------------------------------------
# CLI that exercises the actual LocalOcrClient + Minerva grader. A grade FAIL
# is a valid Academy finding, so infrastructure success does not require PASS.
# ---------------------------------------------------------------------------
Path('scripts/academy/run_ocr_curriculum_fixture.ts').write_text(r'''import fs from 'node:fs';
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
''')

# ---------------------------------------------------------------------------
# Deterministic contract tests reproduce the exact type of disagreement seen
# physically, while leaving the live-service call to runtime acceptance.
# ---------------------------------------------------------------------------
Path('server/tests/academyOcrCurriculumRunner.test.ts').write_text(r'''import assert from 'node:assert/strict';
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
''')

print('ACADEMY_OCR_CURRICULUM_RUNNER_PATCH_APPLIED')
