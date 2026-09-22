import crypto from 'node:crypto';
import type {
  LocalOcrCompositeResult,
  LocalOcrEngineResult,
  LocalOcrRegion,
  OcrEngineName,
} from '../../src/lib/ocr/localOcrClient.js';
import type { FiveDimensionCheck } from './academyMinervaLab.js';

export type InvoiceConsensusStatus = 'CONSENSUS' | 'MISSING' | 'CONFLICT';
export type InvoiceSemanticAdjudicationStatus = 'NO_DISAGREEMENT' | 'RESOLVED_FIELD_CONSENSUS' | 'REVIEW_REQUIRED';
export type InvoiceReconciliationStatus = 'PASS' | 'FAIL';

export interface InvoiceApField<T> {
  value: T | null;
  status: InvoiceConsensusStatus;
  evidenceRefs: string[];
  sourceCoordinate?: any;
  perEngine: Partial<Record<OcrEngineName, {
    value: T | null;
    evidenceRef?: string;
    regionId?: string;
    confidence?: number;
    rawText?: string;
  }>>;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceApInterpretation {
  documentKind: 'INVOICE';
  sourceSha256: string;
  vendor: InvoiceApField<string>;
  invoiceNumber: InvoiceApField<string>;
  invoiceDate: InvoiceApField<string>;
  dueDate: InvoiceApField<string>;
  billTo: InvoiceApField<string>;
  purchaseOrderReference: InvoiceApField<string>;
  currency: InvoiceApField<string>;
  lineItems: InvoiceApField<InvoiceLineItem[]>;
  subtotal: InvoiceApField<number>;
  salesTax: InvoiceApField<number>;
  totalDue: InvoiceApField<number>;
  semanticAdjudication: {
    status: InvoiceSemanticAdjudicationStatus;
    rawLabelDisagreement: boolean;
    rawLabelTexts: string[];
    evidenceRefs: string[];
    unresolvedRequiredFields: string[];
    rationale: string;
  };
  reconciliation: {
    status: InvoiceReconciliationStatus;
    lineItemExtensionsPass: boolean;
    lineItemsToSubtotalPass: boolean;
    subtotalPlusTaxToTotalPass: boolean;
    lineItemSum: number | null;
    expectedTotal: number | null;
    variance: number | null;
  };
  apControl: {
    payableCandidateAmount: number | null;
    payableCandidateCurrency: string | null;
    payableCandidateStatus: 'SUPPORTED_CANDIDATE' | 'REVIEW_REQUIRED';
    liabilityConcept: 'ACCOUNTS_PAYABLE';
    debitAccountClassification: 'REVIEW_REQUIRED';
    postingStatus: 'NOT_POSTED';
    approvalStatus: 'APPROVED' | 'REVIEW_REQUIRED';
    paymentEligibility: 'ELIGIBLE' | 'BLOCKED';
    paymentStatus: 'UNKNOWN' | 'EVIDENCE_PRESENT_REVIEW_REQUIRED';
    threeWayMatchStatus: 'PASS' | 'NOT_TESTABLE';
    independentPurchaseOrderVerified: boolean;
    receivingEvidenceVerified: boolean;
    approvalEvidenceVerified: boolean;
    invoiceReferencesPurchaseOrder: boolean;
    controlNotes: string[];
  };
  evidenceRefs: string[];
  duplicateCandidateFingerprint: string | null;
}

export interface InvoiceApInterpretationOptions {
  independentPurchaseOrderVerified?: boolean;
  receivingEvidenceVerified?: boolean;
  approvalEvidenceVerified?: boolean;
  paymentEvidenceVerified?: boolean;
}

interface EngineField<T> {
  value: T | null;
  region?: LocalOcrRegion;
  evidenceRef?: string;
  sourceCoordinate?: any;
}

interface ParsedEngineInvoice {
  engine: OcrEngineName;
  sourceSha256: string;
  vendor: EngineField<string>;
  invoiceNumber: EngineField<string>;
  invoiceDate: EngineField<string>;
  dueDate: EngineField<string>;
  billTo: EngineField<string>;
  purchaseOrderReference: EngineField<string>;
  currency: EngineField<string>;
  lineItems: EngineField<InvoiceLineItem[]>;
  subtotal: EngineField<number>;
  salesTax: EngineField<number>;
  totalDue: EngineField<number>;
  invoiceLabelText: EngineField<string>;
}

function normalized(value: unknown): string {
  return String(value ?? '').normalize('NFKC').toUpperCase().replace(/\s+/g, ' ').trim();
}

function money(value: string): number | null {
  const n = Number(String(value || '').replace(/[$,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function closeMoney(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.005;
}

function pagesAndRegions(result: LocalOcrEngineResult): Array<{ page: any; region: LocalOcrRegion }> {
  return (result.pages || []).flatMap(page => (page.regions || []).map(region => ({ page, region })));
}

function evidenceRef(result: LocalOcrEngineResult, region: LocalOcrRegion, pageNumber = 1): string {
  return `ocr:${result.engine}:${result.sourceSha256}:p${pageNumber}:${region.regionId}`;
}

function coordinate(result: LocalOcrEngineResult, page: any, region: LocalOcrRegion): any {
  return {
    coordinateId: `coord-${result.engine}-${region.regionId}`,
    sourceArtifactId: `artifact-${result.sourceSha256}`,
    sourceSha256: result.sourceSha256,
    sourceType: 'IMAGE',
    pageNumber: page.pageNumber || 1,
    imageWidth: page.width,
    imageHeight: page.height,
    boundingBox: region.boundingBox,
    ocrRegionId: region.regionId,
    rawLiteral: region.text,
    normalizedLiteral: normalized(region.text),
    confidence: region.confidence,
    extractionMethod: `local-ocr:${result.engine}`,
    extractionVersion: result.engineVersion,
  };
}

function findRegion(result: LocalOcrEngineResult, predicate: (text: string) => boolean): { page: any; region: LocalOcrRegion } | undefined {
  return pagesAndRegions(result).find(({ region }) => predicate(normalized(region.text)));
}

function scalarField<T>(result: LocalOcrEngineResult, found: { page: any; region: LocalOcrRegion } | undefined, value: T | null): EngineField<T> {
  if (!found) return { value: null };
  return {
    value,
    region: found.region,
    evidenceRef: evidenceRef(result, found.region, found.page.pageNumber || 1),
    sourceCoordinate: coordinate(result, found.page, found.region),
  };
}

function parseEngine(result: LocalOcrEngineResult): ParsedEngineInvoice {
  const all = pagesAndRegions(result);
  const vendorFound = all[0];
  const invoiceLabelFound = findRegion(result, t => /\bINV(?:0|O)ICE\b/.test(t) && /\bINV-[A-Z0-9-]+\b/.test(t));
  const invoiceDateFound = findRegion(result, t => t.startsWith('INVOICE DATE '));
  const dueDateFound = findRegion(result, t => t.startsWith('DUE DATE '));
  const billToFound = findRegion(result, t => t.startsWith('BILL TO '));
  const poFound = findRegion(result, t => t.startsWith('PURCHASE ORDER '));
  const currencyFound = findRegion(result, t => t.startsWith('CURRENCY '));
  const subtotalFound = findRegion(result, t => t.startsWith('SUBTOTAL '));
  const taxFound = findRegion(result, t => t.startsWith('SALES TAX '));
  const totalFound = findRegion(result, t => t.startsWith('TOTAL DUE '));

  const invoiceNumberMatch = invoiceLabelFound?.region.text.match(/\b(INV-[A-Z0-9-]+)\b/i);
  const invoiceDateMatch = invoiceDateFound?.region.text.match(/INVOICE DATE\s+(\d{2}\/\d{2}\/\d{4})/i);
  const dueDateMatch = dueDateFound?.region.text.match(/DUE DATE\s+(\d{2}\/\d{2}\/\d{4})/i);
  const billToMatch = billToFound?.region.text.match(/BILL TO\s+(.+)$/i);
  const poMatch = poFound?.region.text.match(/PURCHASE ORDER\s+([A-Z0-9-]+)/i);
  const currencyMatch = currencyFound?.region.text.match(/CURRENCY\s+([A-Z]{3})/i);
  const subtotalMatch = subtotalFound?.region.text.match(/SUBTOTAL\s+\$([0-9,.]+)/i);
  const taxMatch = taxFound?.region.text.match(/SALES TAX\s+\$([0-9,.]+)/i);
  const totalMatch = totalFound?.region.text.match(/TOTAL DUE\s+\$([0-9,.]+)/i);

  const lineFound = all.filter(({ region }) => /\s\d+\s+[xX]\s+\$[0-9,.]+\s*=\s*\$[0-9,.]+/.test(region.text));
  const lineItems: InvoiceLineItem[] = [];
  for (const { region } of lineFound) {
    const m = region.text.match(/^(.+?)\s+(\d+)\s+[xX]\s+\$([0-9,.]+)\s*=\s*\$([0-9,.]+)$/i);
    if (!m) continue;
    const unitPrice = money(m[3]);
    const lineTotal = money(m[4]);
    if (unitPrice === null || lineTotal === null) continue;
    lineItems.push({ description: normalized(m[1]), quantity: Number(m[2]), unitPrice, lineTotal });
  }
  const lineRefs = lineFound.map(({ page, region }) => evidenceRef(result, region, page.pageNumber || 1));
  const firstLineCoord = lineFound[0] ? coordinate(result, lineFound[0].page, lineFound[0].region) : undefined;

  return {
    engine: result.engine,
    sourceSha256: result.sourceSha256,
    vendor: scalarField(result, vendorFound, vendorFound ? normalized(vendorFound.region.text) : null),
    invoiceNumber: scalarField(result, invoiceLabelFound, invoiceNumberMatch ? normalized(invoiceNumberMatch[1]) : null),
    invoiceDate: scalarField(result, invoiceDateFound, invoiceDateMatch ? invoiceDateMatch[1] : null),
    dueDate: scalarField(result, dueDateFound, dueDateMatch ? dueDateMatch[1] : null),
    billTo: scalarField(result, billToFound, billToMatch ? normalized(billToMatch[1]) : null),
    purchaseOrderReference: scalarField(result, poFound, poMatch ? normalized(poMatch[1]) : null),
    currency: scalarField(result, currencyFound, currencyMatch ? normalized(currencyMatch[1]) : null),
    lineItems: {
      value: lineItems.length ? lineItems : null,
      evidenceRef: lineRefs.join('|'),
      sourceCoordinate: firstLineCoord,
    },
    subtotal: scalarField(result, subtotalFound, subtotalMatch ? money(subtotalMatch[1]) : null),
    salesTax: scalarField(result, taxFound, taxMatch ? money(taxMatch[1]) : null),
    totalDue: scalarField(result, totalFound, totalMatch ? money(totalMatch[1]) : null),
    invoiceLabelText: scalarField(result, invoiceLabelFound, invoiceLabelFound ? normalized(invoiceLabelFound.region.text) : null),
  };
}

function engineResults(ocr: LocalOcrCompositeResult): LocalOcrEngineResult[] {
  const seen = new Set<OcrEngineName>();
  const out: LocalOcrEngineResult[] = [];
  for (const attempt of ocr.attempts || []) {
    if (attempt.result && !seen.has(attempt.result.engine)) {
      seen.add(attempt.result.engine);
      out.push(attempt.result);
    }
  }
  if (!seen.has(ocr.engine)) out.push(ocr);
  return out;
}

function fieldConsensus<T>(parsed: ParsedEngineInvoice[], getter: (p: ParsedEngineInvoice) => EngineField<T>, equals?: (a: T, b: T) => boolean): InvoiceApField<T> {
  const perEngine: InvoiceApField<T>['perEngine'] = {};
  const values: T[] = [];
  const refs: string[] = [];
  let sourceCoordinate: any;
  for (const item of parsed) {
    const f = getter(item);
    perEngine[item.engine] = {
      value: f.value,
      evidenceRef: f.evidenceRef,
      regionId: f.region?.regionId,
      confidence: f.region?.confidence,
      rawText: f.region?.text,
    };
    if (f.value !== null) values.push(f.value);
    if (f.evidenceRef) refs.push(...f.evidenceRef.split('|').filter(Boolean));
    if (!sourceCoordinate && f.sourceCoordinate) sourceCoordinate = f.sourceCoordinate;
  }
  if (!values.length) return { value: null, status: 'MISSING', evidenceRefs: [...new Set(refs)], sourceCoordinate, perEngine };
  if (values.length !== parsed.length) return { value: values[0], status: 'MISSING', evidenceRefs: [...new Set(refs)], sourceCoordinate, perEngine };
  const eq = equals || ((a: T, b: T) => JSON.stringify(a) === JSON.stringify(b));
  const allEqual = values.every(v => eq(v, values[0]));
  return { value: values[0], status: allEqual ? 'CONSENSUS' : 'CONFLICT', evidenceRefs: [...new Set(refs)], sourceCoordinate, perEngine };
}

function unionRefs(...groups: Array<string[] | undefined>): string[] {
  return [...new Set(groups.flatMap(g => g || []).filter(Boolean))];
}

export function interpretInvoiceAp(
  ocr: LocalOcrCompositeResult,
  options: InvoiceApInterpretationOptions = {},
): InvoiceApInterpretation {
  const results = engineResults(ocr);
  const parsed = results.map(parseEngine);
  const vendor = fieldConsensus(parsed, p => p.vendor);
  const invoiceNumber = fieldConsensus(parsed, p => p.invoiceNumber);
  const invoiceDate = fieldConsensus(parsed, p => p.invoiceDate);
  const dueDate = fieldConsensus(parsed, p => p.dueDate);
  const billTo = fieldConsensus(parsed, p => p.billTo);
  const purchaseOrderReference = fieldConsensus(parsed, p => p.purchaseOrderReference);
  const currency = fieldConsensus(parsed, p => p.currency);
  const lineItems = fieldConsensus(parsed, p => p.lineItems);
  const subtotal = fieldConsensus(parsed, p => p.subtotal, closeMoney);
  const salesTax = fieldConsensus(parsed, p => p.salesTax, closeMoney);
  const totalDue = fieldConsensus(parsed, p => p.totalDue, closeMoney);

  const labelFields = parsed.map(p => p.invoiceLabelText).filter(f => f.value);
  const rawLabelTexts = [...new Set(labelFields.map(f => String(f.value)))];
  const rawLabelDisagreement = rawLabelTexts.length > 1;
  const labelRefs = labelFields.flatMap(f => f.evidenceRef ? [f.evidenceRef] : []);
  const required: Array<[string, InvoiceApField<any>]> = [
    ['vendor', vendor], ['invoiceNumber', invoiceNumber], ['invoiceDate', invoiceDate], ['dueDate', dueDate],
    ['billTo', billTo], ['purchaseOrderReference', purchaseOrderReference], ['currency', currency],
    ['lineItems', lineItems], ['subtotal', subtotal], ['salesTax', salesTax], ['totalDue', totalDue],
  ];
  const unresolvedRequiredFields = required.filter(([, f]) => f.status !== 'CONSENSUS').map(([name]) => name);
  const semanticStatus: InvoiceSemanticAdjudicationStatus = unresolvedRequiredFields.length
    ? 'REVIEW_REQUIRED'
    : rawLabelDisagreement ? 'RESOLVED_FIELD_CONSENSUS' : 'NO_DISAGREEMENT';

  const items = lineItems.value || [];
  // Accounting reconciliation may not PASS by silently using one engine's value
  // when any material numeric field remains missing or conflicted across OCR engines.
  const lineItemExtensionsPass = lineItems.status === 'CONSENSUS' && items.length > 0 &&
    items.every(item => closeMoney(item.quantity * item.unitPrice, item.lineTotal));
  const lineItemSum = items.length ? items.reduce((sum, item) => sum + item.lineTotal, 0) : null;
  const lineItemsToSubtotalPass = lineItems.status === 'CONSENSUS' && subtotal.status === 'CONSENSUS' &&
    lineItemSum !== null && subtotal.value !== null && closeMoney(lineItemSum, subtotal.value);
  const expectedTotal = subtotal.value !== null && salesTax.value !== null ? subtotal.value + salesTax.value : null;
  const subtotalPlusTaxToTotalPass = subtotal.status === 'CONSENSUS' && salesTax.status === 'CONSENSUS' && totalDue.status === 'CONSENSUS' &&
    expectedTotal !== null && totalDue.value !== null && closeMoney(expectedTotal, totalDue.value);
  const variance = expectedTotal !== null && totalDue.value !== null ? totalDue.value - expectedTotal : null;
  const accountingFieldsConsensus = lineItems.status === 'CONSENSUS' && subtotal.status === 'CONSENSUS' &&
    salesTax.status === 'CONSENSUS' && totalDue.status === 'CONSENSUS';
  const reconciliationStatus: InvoiceReconciliationStatus = accountingFieldsConsensus && lineItemExtensionsPass &&
    lineItemsToSubtotalPass && subtotalPlusTaxToTotalPass ? 'PASS' : 'FAIL';

  const independentPurchaseOrderVerified = options.independentPurchaseOrderVerified === true;
  const receivingEvidenceVerified = options.receivingEvidenceVerified === true;
  const approvalEvidenceVerified = options.approvalEvidenceVerified === true;
  const paymentEvidenceVerified = options.paymentEvidenceVerified === true;
  const invoiceReferencesPurchaseOrder = purchaseOrderReference.status === 'CONSENSUS' && Boolean(purchaseOrderReference.value);
  const threeWayMatchStatus = invoiceReferencesPurchaseOrder && independentPurchaseOrderVerified && receivingEvidenceVerified ? 'PASS' : 'NOT_TESTABLE';
  const approvalStatus = approvalEvidenceVerified ? 'APPROVED' : 'REVIEW_REQUIRED';
  const paymentEligibility = approvalEvidenceVerified && threeWayMatchStatus === 'PASS' && reconciliationStatus === 'PASS' && semanticStatus !== 'REVIEW_REQUIRED'
    ? 'ELIGIBLE' : 'BLOCKED';
  const payableCandidateStatus = reconciliationStatus === 'PASS' && semanticStatus !== 'REVIEW_REQUIRED' && totalDue.value !== null && currency.value
    ? 'SUPPORTED_CANDIDATE' : 'REVIEW_REQUIRED';

  const evidenceRefs = unionRefs(
    vendor.evidenceRefs, invoiceNumber.evidenceRefs, invoiceDate.evidenceRefs, dueDate.evidenceRefs,
    billTo.evidenceRefs, purchaseOrderReference.evidenceRefs, currency.evidenceRefs, lineItems.evidenceRefs,
    subtotal.evidenceRefs, salesTax.evidenceRefs, totalDue.evidenceRefs, labelRefs,
  );
  const duplicateCandidateFingerprint = vendor.value && invoiceNumber.value && totalDue.value !== null && currency.value
    ? crypto.createHash('sha256').update(`${vendor.value}|${invoiceNumber.value}|${totalDue.value.toFixed(2)}|${currency.value}`).digest('hex')
    : null;

  return {
    documentKind: 'INVOICE',
    sourceSha256: ocr.sourceSha256,
    vendor, invoiceNumber, invoiceDate, dueDate, billTo, purchaseOrderReference, currency, lineItems, subtotal, salesTax, totalDue,
    semanticAdjudication: {
      status: semanticStatus,
      rawLabelDisagreement,
      rawLabelTexts,
      evidenceRefs: [...new Set(labelRefs)],
      unresolvedRequiredFields,
      rationale: semanticStatus === 'RESOLVED_FIELD_CONSENSUS'
        ? 'Raw OCR label disagreement is preserved, but both engines independently agree on the invoice identifier and every required AP field.'
        : semanticStatus === 'NO_DISAGREEMENT'
          ? 'Required AP fields agree across available OCR engines.'
          : `Required AP field conflicts/missing evidence remain: ${unresolvedRequiredFields.join(', ')}`,
    },
    reconciliation: {
      status: reconciliationStatus,
      lineItemExtensionsPass,
      lineItemsToSubtotalPass,
      subtotalPlusTaxToTotalPass,
      lineItemSum,
      expectedTotal,
      variance,
    },
    apControl: {
      payableCandidateAmount: totalDue.value,
      payableCandidateCurrency: currency.value,
      payableCandidateStatus,
      liabilityConcept: 'ACCOUNTS_PAYABLE',
      debitAccountClassification: 'REVIEW_REQUIRED',
      postingStatus: 'NOT_POSTED',
      approvalStatus,
      paymentEligibility,
      paymentStatus: paymentEvidenceVerified ? 'EVIDENCE_PRESENT_REVIEW_REQUIRED' : 'UNKNOWN',
      threeWayMatchStatus,
      independentPurchaseOrderVerified,
      receivingEvidenceVerified,
      approvalEvidenceVerified,
      invoiceReferencesPurchaseOrder,
      controlNotes: [
        'The invoice-stated PO reference is not independent purchase-order evidence.',
        'No receiving evidence is inferred from the invoice itself.',
        'No approval, payment, or ledger posting is inferred from invoice content.',
        'The debit-side chart-of-accounts classification remains review required.',
      ],
    },
    evidenceRefs,
    duplicateCandidateFingerprint,
  };
}

export function buildInvoiceApFiveDimensionChecks(invoice: InvoiceApInterpretation): {
  source: FiveDimensionCheck[];
  semantic: FiveDimensionCheck[];
  accounting: FiveDimensionCheck[];
} {
  const allRefs = invoice.evidenceRefs;
  const requiredConsensusPass = invoice.semanticAdjudication.unresolvedRequiredFields.length === 0;
  const adjudicationPass = invoice.semanticAdjudication.status !== 'REVIEW_REQUIRED';
  const controlPass = invoice.apControl.approvalStatus === 'REVIEW_REQUIRED' && invoice.apControl.paymentEligibility === 'BLOCKED' && invoice.apControl.postingStatus === 'NOT_POSTED';
  const threeWayGuardPass = invoice.apControl.threeWayMatchStatus === 'NOT_TESTABLE' && invoice.apControl.invoiceReferencesPurchaseOrder && !invoice.apControl.independentPurchaseOrderVerified && !invoice.apControl.receivingEvidenceVerified;
  return {
    source: [{
      checkId: 'invoice-ap-source-evidence',
      label: 'Invoice AP interpretation retains exact source identity and evidence references',
      outcome: invoice.sourceSha256 && allRefs.length > 0 ? 'PASS' : 'FAIL',
      evidenceRefs: allRefs,
      details: [`sourceSha256=${invoice.sourceSha256}; evidenceRefs=${allRefs.length}`],
    }],
    semantic: [
      {
        checkId: 'invoice-required-field-consensus',
        label: 'Required invoice/AP fields reach cross-engine consensus',
        outcome: requiredConsensusPass ? 'PASS' : 'FAIL',
        evidenceRefs: allRefs,
        details: [`unresolvedRequiredFields=${invoice.semanticAdjudication.unresolvedRequiredFields.join(',') || 'none'}`],
      },
      {
        checkId: 'invoice-ocr-label-adjudication',
        label: 'Raw OCR disagreement is explicitly preserved and adjudicated at field level',
        outcome: adjudicationPass ? 'PASS' : 'FAIL',
        evidenceRefs: invoice.semanticAdjudication.evidenceRefs,
        details: [invoice.semanticAdjudication.rationale, `rawLabelTexts=${invoice.semanticAdjudication.rawLabelTexts.join(' | ')}`],
      },
      {
        checkId: 'invoice-no-approval-inference',
        label: 'Invoice content does not manufacture approval, payment eligibility, or posting',
        outcome: controlPass ? 'PASS' : 'FAIL',
        evidenceRefs: unionRefs(invoice.totalDue.evidenceRefs, invoice.purchaseOrderReference.evidenceRefs),
        details: [`approval=${invoice.apControl.approvalStatus}; paymentEligibility=${invoice.apControl.paymentEligibility}; posting=${invoice.apControl.postingStatus}`],
      },
    ],
    accounting: [
      {
        checkId: 'invoice-line-item-extensions',
        label: 'Invoice quantities × unit prices equal recorded line totals',
        outcome: invoice.reconciliation.lineItemExtensionsPass ? 'PASS' : 'FAIL',
        evidenceRefs: invoice.lineItems.evidenceRefs,
        details: [`items=${invoice.lineItems.value?.length || 0}`],
      },
      {
        checkId: 'invoice-subtotal-reconciliation',
        label: 'Invoice line-item totals reconcile to subtotal',
        outcome: invoice.reconciliation.lineItemsToSubtotalPass ? 'PASS' : 'FAIL',
        evidenceRefs: unionRefs(invoice.lineItems.evidenceRefs, invoice.subtotal.evidenceRefs),
        details: [`lineItemSum=${invoice.reconciliation.lineItemSum}; subtotal=${invoice.subtotal.value}`],
      },
      {
        checkId: 'invoice-total-reconciliation',
        label: 'Subtotal plus sales tax reconciles to total due',
        outcome: invoice.reconciliation.subtotalPlusTaxToTotalPass ? 'PASS' : 'FAIL',
        evidenceRefs: unionRefs(invoice.subtotal.evidenceRefs, invoice.salesTax.evidenceRefs, invoice.totalDue.evidenceRefs),
        details: [`expectedTotal=${invoice.reconciliation.expectedTotal}; totalDue=${invoice.totalDue.value}; variance=${invoice.reconciliation.variance}`],
      },
      {
        checkId: 'invoice-payable-candidate-control',
        label: 'Evidence-supported payable candidate is separated from posting/payment authorization',
        outcome: invoice.apControl.payableCandidateStatus === 'SUPPORTED_CANDIDATE' && threeWayGuardPass ? 'PASS' : 'FAIL',
        evidenceRefs: unionRefs(invoice.totalDue.evidenceRefs, invoice.currency.evidenceRefs, invoice.purchaseOrderReference.evidenceRefs),
        details: [`payable=${invoice.apControl.payableCandidateAmount} ${invoice.apControl.payableCandidateCurrency}; threeWay=${invoice.apControl.threeWayMatchStatus}; debitAccount=${invoice.apControl.debitAccountClassification}`],
      },
    ],
  };
}
