import type { LocalOcrCompositeResult, LocalOcrEngineResult, LocalOcrRegion, OcrBoundingBox } from '../../../src/lib/ocr/localOcrClient.js';
import { interpretInvoiceAp } from '../../cpaOrganization/invoiceApInterpretationEngine.js';

export const INVOICE_SHA256 = '1000426f9989dd8aa2767d57c10248648a770aa05d957d04940fd1463e0cf105';
export const INVOICE_WORKSPACE_ID = 'ws-academy-invoice-ap-260916';
export const INVOICE_ENGAGEMENT_ID = 'eng-academy-invoice-ap-260916';
export const INVOICE_DOCUMENT_ID = 'doc-invoice-260916-1042';
export const INVOICE_FACT_ID = 'fact-ap-candidate-inv-260916-1042';

const paddle = [
  ['SYNTHETIC OFFICE SUPPLY CO.',0.9999516606330872,{x:0.04416666666666667,y:0.049166666666666664,width:0.48583333333333334,height:0.027499999999999997,unit:'NORMALIZED'}],
  ['INV0ICE INV-260916-1042',0.9889451861381531,{x:0.045,y:0.095,width:0.39166666666666666,height:0.025833333333333333,unit:'NORMALIZED'}],
  ['INVOICE DATE 09/16/2026',0.9980010986328125,{x:0.045,y:0.13916666666666666,width:0.32416666666666666,height:0.02416666666666667,unit:'NORMALIZED'}],
  ['DUE DATE 10/16/2026',0.9999474883079529,{x:0.0425,y:0.17666666666666667,width:0.27,height:0.027499999999999997,unit:'NORMALIZED'}],
  ['BILL TO EVE ACADEMY TEST CLIENT',0.9998001456260681,{x:0.045,y:0.21916666666666668,width:0.4366666666666667,height:0.022499999999999992,unit:'NORMALIZED'}],
  ['ACCOUNTING BINDERS 2 x $35.00 = $70.00',0.987705409526825,{x:0.04416666666666667,y:0.25916666666666666,width:0.495,height:0.021666666666666667,unit:'NORMALIZED'}],
  ['ARCHIVE BOXES 5 x $12.00 = $60.00',0.9950847029685974,{x:0.043333333333333335,y:0.2966666666666667,width:0.43333333333333335,height:0.024999999999999967,unit:'NORMALIZED'}],
  ['DOCUMENT BAGS 3 x $15.00 = $45.00',0.9868789315223694,{x:0.043333333333333335,y:0.335,width:0.43333333333333335,height:0.02416666666666667,unit:'NORMALIZED'}],
  ['SUBTOTAL $175.00',0.9678417444229126,{x:0.04416666666666667,y:0.37416666666666665,width:0.24250000000000002,height:0.025833333333333375,unit:'NORMALIZED'}],
  ['SALES TAX $12.25',0.9996976852416992,{x:0.04416666666666667,y:0.41583333333333333,width:0.24166666666666667,height:0.02583333333333332,unit:'NORMALIZED'}],
  ['TOTAL DUE $187.25',0.9992653131484985,{x:0.0425,y:0.4583333333333333,width:0.3275,height:0.03250000000000003,unit:'NORMALIZED'}],
  ['PURCHASE ORDER PO-EVE-1001',0.9976133704185486,{x:0.04416666666666667,y:0.505,width:0.3658333333333333,height:0.025000000000000022,unit:'NORMALIZED'}],
  ['CURRENCY USD',0.9997749328613281,{x:0.045,y:0.5458333333333333,width:0.1691666666666667,height:0.023333333333333428,unit:'NORMALIZED'}],
] as const;

const doctr = [
  ['SYNTHETIC OFFICE SUPPLY CO.',0.9887917637825012,{x:0.048828125,y:0.05078125,width:0.478515625,height:0.025390625,unit:'NORMALIZED'}],
  ['INVOICE INV-260916-1042',0.9835229019323986,{x:0.0478515625,y:0.0986328125,width:0.38671875,height:0.021484375,unit:'NORMALIZED'}],
  ['INVOICE DATE 09/16/2026',0.9988551338513693,{x:0.0478515625,y:0.1416015625,width:0.3203125,height:0.0205078125,unit:'NORMALIZED'}],
  ['DUE DATE 10/16/2026',0.8460358579953512,{x:0.0458984375,y:0.1806640625,width:0.265625,height:0.021484375,unit:'NORMALIZED'}],
  ['BILL TO EVE ACADEMY TEST CLIENT',0.9313322703043619,{x:0.046875,y:0.2197265625,width:0.4345703125,height:0.021484375,unit:'NORMALIZED'}],
  ['ACCOUNTING BINDERS 2 X $35.00 = $70.00',0.9012109892708915,{x:0.0458984375,y:0.259765625,width:0.4951171875,height:0.0234375,unit:'NORMALIZED'}],
  ['ARCHIVE BOXES 5 X $12.00 = $60.00',0.9932922720909119,{x:0.0458984375,y:0.298828125,width:0.4296875,height:0.0224609375,unit:'NORMALIZED'}],
  ['DOCUMENT BAGS 3 X $15.00 = $45.00',0.9479153241430011,{x:0.046875,y:0.3369140625,width:0.4287109375,height:0.0224609375,unit:'NORMALIZED'}],
  ['SUBTOTAL $175.00',0.9958547651767731,{x:0.046875,y:0.376953125,width:0.23828125,height:0.0224609375,unit:'NORMALIZED'}],
  ['SALES TAX $12.25',0.9160399436950684,{x:0.046875,y:0.4169921875,width:0.240234375,height:0.025390625,unit:'NORMALIZED'}],
  ['TOTAL DUE $187.25',0.9410242239634196,{x:0.0478515625,y:0.4609375,width:0.3203125,height:0.029296875,unit:'NORMALIZED'}],
  ['PURCHASE ORDER PO-EVE-1001',0.9785784582297007,{x:0.0478515625,y:0.5087890625,width:0.361328125,height:0.0185546875,unit:'NORMALIZED'}],
  ['CURRENCY USD',0.897619754076004,{x:0.046875,y:0.5478515625,width:0.1669921875,height:0.0205078125,unit:'NORMALIZED'}],
] as const;

function engineResult(engine: 'paddleocr'|'doctr', rows: readonly any[]): LocalOcrEngineResult {
  const regions: LocalOcrRegion[] = rows.map((row: any, i: number) => ({
    regionId: `p1-r${i+1}`, text: row[0], confidence: row[1], boundingBox: row[2] as OcrBoundingBox,
  }));
  return {
    engine, engineVersion: engine === 'paddleocr' ? '3.7.0' : '1.1.0',
    model: engine === 'paddleocr' ? 'PP-OCRv6-medium' : 'fast_base+crnn_vgg16_bn',
    sourceSha256: INVOICE_SHA256, elapsedMs: engine === 'paddleocr' ? 14813 : 2153,
    pages: [{ pageNumber: 1, width: 1200, height: 1200, regions }],
  };
}

export function buildInvoiceOcrComposite(): LocalOcrCompositeResult {
  const primary = engineResult('paddleocr', paddle);
  const fallback = engineResult('doctr', doctr);
  return {
    ...primary,
    routingDecision: {
      selectedEngine: 'paddleocr', fallbackInvoked: true,
      reasons: ['FORCED_DUAL_ENGINE_EVALUATION'], primaryScore: 0.99, fallbackScore: 0.94,
      orientationRetryInvoked: false, selectedRotationDegrees: 0,
    },
    attempts: [
      { engine:'paddleocr', url:'live-equivalent://paddle', rotationDegrees:0, selected:true, score:0.99, averageConfidence:0.9938852053422195, materialMinimumConfidence:0.9678417444229126, regionCount:13, result:primary },
      { engine:'doctr', url:'live-equivalent://doctr', rotationDegrees:0, selected:false, score:0.94, averageConfidence:0.9476979737316733, materialMinimumConfidence:0.8460358579953512, regionCount:13, result:fallback },
    ],
  };
}

export function buildInvoiceApInterpretation() {
  return interpretInvoiceAp(buildInvoiceOcrComposite());
}

export function buildInvoiceApFact(invoice = buildInvoiceApInterpretation()) {
  return {
    id: INVOICE_FACT_ID,
    canonicalMetric: 'accounts_payable_candidate',
    labelOriginal: `Accounts Payable Candidate - ${invoice.invoiceNumber.value}`,
    labelNormalized: `Accounts Payable Candidate - ${invoice.invoiceNumber.value}`,
    normalizedValue: invoice.totalDue.value,
    valueFunctional: String(invoice.totalDue.value), valueOriginal: `$${Number(invoice.totalDue.value).toFixed(2)}`,
    reportingPeriod: '2026-09-16', period: '2026-09-16', currencyOriginal: invoice.currency.value, functionalCurrency: invoice.currency.value,
    status: 'REVIEW_REQUIRED', verificationStatus: 'VERIFIED', evidenceStatus: 'CONFIRMED',
    documentId: INVOICE_DOCUMENT_ID, sourceDocument: 'invoice.png', sourceText: 'TOTAL DUE $187.25', pageNumber: 1,
    sourceSha256: INVOICE_SHA256, sourceArtifactId: `artifact-${INVOICE_SHA256}`,
    sourceProvenanceId: `prov-invoice-total-${INVOICE_SHA256.slice(0,12)}`,
    sourceProvenanceIds: invoice.totalDue.evidenceRefs,
    sourceCoordinate: invoice.totalDue.sourceCoordinate, sourceCoordinates: invoice.totalDue.sourceCoordinate ? [invoice.totalDue.sourceCoordinate] : [],
    sourceExtractionMethod: invoice.totalDue.sourceCoordinate?.extractionMethod,
    sourceExtractionVersion: invoice.totalDue.sourceCoordinate?.extractionVersion,
  };
}

export function buildInvoiceApEngagement(invoice = buildInvoiceApInterpretation()) {
  const fact = buildInvoiceApFact(invoice);
  return {
    engagementId: INVOICE_ENGAGEMENT_ID, workspaceId: INVOICE_WORKSPACE_ID, classification: 'ACADEMY', isCustomer: false,
    clientName: 'Eve Academy AP Test Client', period: '2026-09-16', framework: 'US_GAAP', functionalCurrency: 'USD', currentStage: 'REVIEW_REQUIRED',
    facts: [fact], documents: [{ id: INVOICE_DOCUMENT_ID, filename:'invoice.png', originalName:'invoice.png', sha256:INVOICE_SHA256 }], reports: [], findings: [], apInvoices: [invoice],
    measurements: { rawExtractedRows:13, eligibleRows:1, uniqueEligibleFactIds:1, evidenceOccurrences:invoice.evidenceRefs.length, sourceDocumentCount:1 },
  };
}

export function invoiceEvidenceDir(): string {
  return process.env.INVOICE_AP_ACCEPTANCE_EVIDENCE_DIR || '/tmp/eve-invoice-ap-five-dimension';
}
