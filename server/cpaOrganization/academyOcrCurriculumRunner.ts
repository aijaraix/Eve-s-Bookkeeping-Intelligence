import crypto from 'node:crypto';
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
