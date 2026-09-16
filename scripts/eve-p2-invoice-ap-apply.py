from pathlib import Path


def replace(path: str, old: str, new: str, count: int = 1) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'MISSING_SNIPPET:{path}:{old[:120]!r}')
    p.write_text(text.replace(old, new, count))


Path('server/cpaOrganization/invoiceApInterpretationEngine.ts').write_text(r'''import crypto from 'node:crypto';
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
  const lineItemExtensionsPass = items.length > 0 && items.every(item => closeMoney(item.quantity * item.unitPrice, item.lineTotal));
  const lineItemSum = items.length ? items.reduce((sum, item) => sum + item.lineTotal, 0) : null;
  const lineItemsToSubtotalPass = lineItemSum !== null && subtotal.value !== null && closeMoney(lineItemSum, subtotal.value);
  const expectedTotal = subtotal.value !== null && salesTax.value !== null ? subtotal.value + salesTax.value : null;
  const subtotalPlusTaxToTotalPass = expectedTotal !== null && totalDue.value !== null && closeMoney(expectedTotal, totalDue.value);
  const variance = expectedTotal !== null && totalDue.value !== null ? totalDue.value - expectedTotal : null;
  const reconciliationStatus: InvoiceReconciliationStatus = lineItemExtensionsPass && lineItemsToSubtotalPass && subtotalPlusTaxToTotalPass ? 'PASS' : 'FAIL';

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
''')


Path('src/components/views/engagement/InvoiceApReviewPanel.tsx').write_text(r'''import React from 'react';

function value(field: any): string {
  const v = field?.value;
  if (v === null || v === undefined || v === '') return 'Not recorded';
  return String(v);
}

function money(v: any, currency?: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return 'Not recorded';
  return `${currency || ''} ${n.toFixed(2)}`.trim();
}

export const InvoiceApReviewPanel: React.FC<{ invoices: any[] }> = ({ invoices }) => {
  if (!Array.isArray(invoices) || invoices.length === 0) return null;
  return <section className="space-y-3" aria-label="Accounts payable invoice review">
    <h2 className="font-semibold">Accounts payable invoice review</h2>
    {invoices.map((invoice: any, index: number) => {
      const number = value(invoice.invoiceNumber);
      const currency = value(invoice.currency) === 'Not recorded' ? '' : value(invoice.currency);
      return <article key={`${number}-${index}`} data-eve-ap-invoice-id={number} data-eve-ap-approval-status={invoice.apControl?.approvalStatus}
        data-eve-ap-payment-eligibility={invoice.apControl?.paymentEligibility} data-eve-ap-three-way-match={invoice.apControl?.threeWayMatchStatus}
        className="border rounded-xl p-4 space-y-3 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 className="font-semibold">{value(invoice.vendor)}</h3><p className="font-mono text-sm">Invoice {number}</p></div>
          <div className="text-right text-sm"><p className="font-semibold">Total due: {money(invoice.totalDue?.value, currency)}</p><p>Due: {value(invoice.dueDate)}</p></div>
        </div>
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          <p>Invoice date: <strong>{value(invoice.invoiceDate)}</strong></p>
          <p>Bill to: <strong>{value(invoice.billTo)}</strong></p>
          <p>PO reference on invoice: <strong>{value(invoice.purchaseOrderReference)}</strong></p>
          <p>Currency: <strong>{value(invoice.currency)}</strong></p>
          <p>Subtotal: <strong>{money(invoice.subtotal?.value, currency)}</strong></p>
          <p>Sales tax: <strong>{money(invoice.salesTax?.value, currency)}</strong></p>
        </div>
        <div className="border rounded-lg p-3 text-sm space-y-1">
          <p><strong>Arithmetic reconciliation:</strong> {invoice.reconciliation?.status || 'Not measured'}</p>
          <p><strong>Payable candidate:</strong> {money(invoice.apControl?.payableCandidateAmount, invoice.apControl?.payableCandidateCurrency)} · {invoice.apControl?.payableCandidateStatus}</p>
          <p><strong>Three-way match:</strong> {invoice.apControl?.threeWayMatchStatus}</p>
          <p><strong>Independent purchase-order record:</strong> {invoice.apControl?.independentPurchaseOrderVerified ? 'VERIFIED' : 'NOT PROVIDED'}</p>
          <p><strong>Receiving evidence:</strong> {invoice.apControl?.receivingEvidenceVerified ? 'VERIFIED' : 'NOT PROVIDED'}</p>
          <p><strong>Approval:</strong> {invoice.apControl?.approvalStatus}</p>
          <p><strong>Payment eligibility:</strong> {invoice.apControl?.paymentEligibility}</p>
          <p><strong>Payment status:</strong> {invoice.apControl?.paymentStatus}</p>
          <p><strong>Posting:</strong> {invoice.apControl?.postingStatus}</p>
          <p><strong>Debit account classification:</strong> {invoice.apControl?.debitAccountClassification}</p>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 font-semibold text-sm">Invoice line items</div>
          {(invoice.lineItems?.value || []).map((item: any, itemIndex: number) => <div key={itemIndex} className="px-3 py-2 border-t text-sm flex justify-between gap-3">
            <span>{item.description} · {item.quantity} × {money(item.unitPrice, currency)}</span><strong>{money(item.lineTotal, currency)}</strong>
          </div>)}
        </div>
        <p className="text-xs text-amber-800">The invoice-stated PO reference is not an independently verified purchase order. No receiving record, approval, payment, or ledger posting is inferred from this invoice.</p>
        <p className="text-xs">OCR adjudication: <strong>{invoice.semanticAdjudication?.status}</strong>. Raw label evidence preserved: {(invoice.semanticAdjudication?.rawLabelTexts || []).join(' | ') || 'no disagreement'}.</p>
        <details data-eve-ap-lineage="true" className="text-xs border rounded-lg p-3">
          <summary className="cursor-pointer font-semibold">Source lineage and evidence references</summary>
          <p className="break-all mt-2">Source SHA-256: {invoice.sourceSha256}</p>
          <p className="break-all">Evidence refs: {(invoice.evidenceRefs || []).join(' ; ')}</p>
          <p>Invoice-number refs: {(invoice.invoiceNumber?.evidenceRefs || []).join(' ; ')}</p>
          <p>Total-due refs: {(invoice.totalDue?.evidenceRefs || []).join(' ; ')}</p>
        </details>
      </article>;
    })}
  </section>;
};
''')


replace(
    'src/components/views/engagement/RecordedEngagementEvidenceView.tsx',
    "import React from 'react';\nimport { actionAttributes } from '../../../academy/uiActionRegistry';",
    "import React from 'react';\nimport { actionAttributes } from '../../../academy/uiActionRegistry';\nimport { InvoiceApReviewPanel } from './InvoiceApReviewPanel';"
)
replace(
    'src/components/views/engagement/RecordedEngagementEvidenceView.tsx',
    "    </> : <>\n      <section",
    "    </> : <>\n      <InvoiceApReviewPanel invoices={Array.isArray(detail.apInvoices) ? detail.apInvoices : []} />\n      <section"
)


Path('src/lib/agents/documentAgents.ts').write_text(r'''import { CanonicalDocumentModel } from "../parser/types.js";

export class DocumentIntelligenceAgent {
  public classifyAndExtract(canonicalDoc: CanonicalDocumentModel): {
    category: string;
    reportingCurrency?: string;
    confidence: number;
    statementTypes?: string[];
    [key: string]: any;
  } {
    const text = (canonicalDoc.raw_text || canonicalDoc.markdown || "").toLowerCase();
    let category = "General Financial Document";

    if (text.includes("annual report") || text.includes("form 10-k") || text.includes("consolidated financial statements")) {
      category = "Annual Financial Report";
    } else if (text.includes("bank statement") || text.includes("account statement") || text.includes("opening balance")) {
      category = "Bank Statement";
    } else if (text.includes("balance sheet") || text.includes("statement of financial position")) {
      category = "Financial Statements";
    } else if (text.includes("invoice") || text.includes("bill to") || text.includes("amount due") || text.includes("total due")) {
      category = "Invoice / Billing Record";
    } else if (text.includes("tax return") || text.includes("form 1120") || text.includes("form 1040")) {
      category = "Tax Return";
    }

    let reportingCurrency: string | undefined;
    if (/\bcurrency\s+eur\b|\beur\b|€/.test(text)) reportingCurrency = "EUR";
    else if (/\bcurrency\s+gbp\b|\bgbp\b|£/.test(text)) reportingCurrency = "GBP";
    else if (/\bcurrency\s+usd\b|\busd\b/.test(text)) reportingCurrency = "USD";

    if (category === "Invoice / Billing Record") {
      const signals = [
        /\binvoice\b/.test(text), /\bbill to\b/.test(text), /\b(?:amount|total) due\b/.test(text),
        /\bdue date\b/.test(text), /\bpurchase order\b/.test(text), /\bcurrency\s+[a-z]{3}\b/.test(text)
      ].filter(Boolean).length;
      return {
        category,
        reportingCurrency,
        confidence: Math.min(0.99, 0.70 + (signals * 0.045)),
        statementTypes: [],
        documentKind: 'INVOICE',
        classificationSignals: signals,
      };
    }

    return {
      category,
      reportingCurrency,
      confidence: category === "General Financial Document" ? 0.50 : 0.90,
      statementTypes: category === "Annual Financial Report" || category === "Financial Statements" ? ["INCOME_STATEMENT", "BALANCE_SHEET"] : []
    };
  }
}
''')


replace(
    'server/cpaOrganization/reviewPackageRendering.ts',
    'export function buildReviewCsv(facts: any[], currency: string): string {',
    'export function buildReviewCsv(facts: any[], currency: string, apReview?: any): string {'
)
replace(
    'server/cpaOrganization/reviewPackageRendering.ts',
    "  return rows.map(row=>row.map(csvCell).join(',')).join('\\r\\n');\n}",
    "  const factCsv = rows.map(row=>row.map(csvCell).join(',')).join('\\r\\n');\n  if (!apReview) return factCsv;\n  const apRows: any[][] = [\n    [], ['AP INVOICE REVIEW'],\n    ['Vendor', apReview.vendor?.value], ['Invoice Number', apReview.invoiceNumber?.value],\n    ['Invoice Date', apReview.invoiceDate?.value], ['Due Date', apReview.dueDate?.value],\n    ['Bill To', apReview.billTo?.value], ['PO Reference On Invoice', apReview.purchaseOrderReference?.value],\n    ['Currency', apReview.currency?.value], ['Subtotal', apReview.subtotal?.value], ['Sales Tax', apReview.salesTax?.value], ['Total Due', apReview.totalDue?.value],\n    ['Semantic Adjudication', apReview.semanticAdjudication?.status], ['Raw OCR Label Evidence', (apReview.semanticAdjudication?.rawLabelTexts || []).join(' | ')],\n    ['Arithmetic Reconciliation', apReview.reconciliation?.status], ['Payable Candidate Status', apReview.apControl?.payableCandidateStatus],\n    ['Three-way Match', apReview.apControl?.threeWayMatchStatus], ['Independent PO Verified', apReview.apControl?.independentPurchaseOrderVerified],\n    ['Receiving Evidence Verified', apReview.apControl?.receivingEvidenceVerified], ['Approval', apReview.apControl?.approvalStatus],\n    ['Payment Eligibility', apReview.apControl?.paymentEligibility], ['Payment Status', apReview.apControl?.paymentStatus], ['Posting', apReview.apControl?.postingStatus],\n    ['Evidence Refs', (apReview.evidenceRefs || []).join(';')], ['Source SHA256', apReview.sourceSha256],\n  ];\n  return factCsv + '\\r\\n' + apRows.map(row=>row.map(csvCell).join(',')).join('\\r\\n');\n}"
)
replace(
    'server/cpaOrganization/reviewPackageRendering.ts',
    "  const facts=params.facts||[], jobs=params.specialistReview?.jobs||[];",
    "  if (params.apReview) {\n    const a=params.apReview;\n    heading('Accounts payable invoice review');\n    text(`Vendor: ${a.vendor?.value || 'NOT_RECORDED'}\\nInvoice: ${a.invoiceNumber?.value || 'NOT_RECORDED'}\\nInvoice date: ${a.invoiceDate?.value || 'NOT_RECORDED'}\\nDue date: ${a.dueDate?.value || 'NOT_RECORDED'}\\nBill to: ${a.billTo?.value || 'NOT_RECORDED'}\\nPO reference on invoice: ${a.purchaseOrderReference?.value || 'NOT_RECORDED'}\\nCurrency: ${a.currency?.value || 'NOT_RECORDED'}`);\n    text(`Subtotal: ${a.subtotal?.value ?? 'NOT_RECORDED'} | Sales tax: ${a.salesTax?.value ?? 'NOT_RECORDED'} | Total due: ${a.totalDue?.value ?? 'NOT_RECORDED'} | Reconciliation: ${a.reconciliation?.status || 'NOT_MEASURED'}`);\n    text(`Semantic adjudication: ${a.semanticAdjudication?.status || 'NOT_MEASURED'} | Raw OCR labels: ${(a.semanticAdjudication?.rawLabelTexts || []).join(' | ') || 'none'}`);\n    text(`Payable candidate: ${a.apControl?.payableCandidateAmount ?? 'NOT_RECORDED'} ${a.apControl?.payableCandidateCurrency || ''} | Candidate state: ${a.apControl?.payableCandidateStatus || 'NOT_MEASURED'}\\nThree-way match: ${a.apControl?.threeWayMatchStatus || 'NOT_MEASURED'} | Independent PO verified: ${a.apControl?.independentPurchaseOrderVerified ? 'YES' : 'NO'} | Receiving evidence verified: ${a.apControl?.receivingEvidenceVerified ? 'YES' : 'NO'}\\nApproval: ${a.apControl?.approvalStatus || 'NOT_MEASURED'} | Payment eligibility: ${a.apControl?.paymentEligibility || 'NOT_MEASURED'} | Payment status: ${a.apControl?.paymentStatus || 'NOT_MEASURED'} | Posting: ${a.apControl?.postingStatus || 'NOT_MEASURED'}`);\n    text('The invoice-stated PO reference is not independent purchase-order evidence. No approval, receiving evidence, payment, or ledger posting is inferred from invoice content.');\n    for (const item of a.lineItems?.value || []) text(`${item.description}: ${item.quantity} x ${item.unitPrice} = ${item.lineTotal}`);\n    text(`Source SHA-256: ${a.sourceSha256 || 'NOT_RECORDED'}\\nEvidence refs: ${(a.evidenceRefs || []).join(', ') || 'NOT_RECORDED'}`);\n  }\n  const facts=params.facts||[], jobs=params.specialistReview?.jobs||[];"
)
replace(
    'server/cpaOrganization/reviewPackageRendering.ts',
    "  add('Specialist Review',[",
    "  if(params.apReview){ const a=params.apReview; add('AP Review',[\n    ['Field','Recorded value'], ['Vendor',a.vendor?.value], ['Invoice Number',a.invoiceNumber?.value], ['Invoice Date',a.invoiceDate?.value], ['Due Date',a.dueDate?.value],\n    ['Bill To',a.billTo?.value], ['PO Reference On Invoice',a.purchaseOrderReference?.value], ['Currency',a.currency?.value], ['Subtotal',a.subtotal?.value], ['Sales Tax',a.salesTax?.value], ['Total Due',a.totalDue?.value],\n    ['Semantic Adjudication',a.semanticAdjudication?.status], ['Raw OCR Label Evidence',(a.semanticAdjudication?.rawLabelTexts||[]).join(' | ')], ['Arithmetic Reconciliation',a.reconciliation?.status],\n    ['Payable Candidate Status',a.apControl?.payableCandidateStatus], ['Three-way Match',a.apControl?.threeWayMatchStatus], ['Independent PO Verified',a.apControl?.independentPurchaseOrderVerified],\n    ['Receiving Evidence Verified',a.apControl?.receivingEvidenceVerified], ['Approval',a.apControl?.approvalStatus], ['Payment Eligibility',a.apControl?.paymentEligibility], ['Payment Status',a.apControl?.paymentStatus], ['Posting',a.apControl?.postingStatus],\n    ['Source SHA256',a.sourceSha256], ['Evidence Refs',(a.evidenceRefs||[]).join(';')]\n  ],[34,100]); }\n  add('Specialist Review',["
)


replace(
    'server/cpaOrganization/deliverableArtifactService.ts',
    '  disclosureEvidenceLedger?: any;\n}',
    '  disclosureEvidenceLedger?: any;\n  apReview?: any;\n}'
)
replace(
    'server/cpaOrganization/deliverableArtifactService.ts',
    '            disclosureEvidenceLedger: data.disclosureEvidenceLedger\n          };',
    '            disclosureEvidenceLedger: data.disclosureEvidenceLedger,\n            apReview: data.apReview\n          };'
)
replace(
    'server/cpaOrganization/deliverableArtifactService.ts',
    '      balanceIdentityApplicable\n    });',
    '      balanceIdentityApplicable,\n      apReview: params.apReview\n    });',
    1
)
replace(
    'server/cpaOrganization/deliverableArtifactService.ts',
    '      balanceIdentityApplicable\n    });',
    '      balanceIdentityApplicable,\n      apReview: params.apReview\n    });',
    1
)
replace(
    'server/cpaOrganization/deliverableArtifactService.ts',
    '      disclosureEvidenceLedger: params.disclosureEvidenceLedger || null\n    };',
    '      disclosureEvidenceLedger: params.disclosureEvidenceLedger || null,\n      apReview: params.apReview || null\n    };'
)
replace(
    'server/cpaOrganization/deliverableArtifactService.ts',
    '    const csvContent = buildReviewCsv(normalizedFacts, currency);',
    '    const csvContent = buildReviewCsv(normalizedFacts, currency, params.apReview);'
)
replace(
    'server/cpaOrganization/deliverableArtifactService.ts',
    '      disclosureEvidenceLedger: params.disclosureEvidenceLedger || undefined\n    };',
    '      disclosureEvidenceLedger: params.disclosureEvidenceLedger || undefined,\n      apReview: params.apReview || undefined\n    };'
)


replace(
    'server/cpaOrganization/academyMinervaLab.ts',
    """      caseSpec(
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
      ),""",
    """      caseSpec(
        'CURR-OCR-SCANNED-INVOICE',
        'Scanned invoice with line-item, AP control and deliverable reconciliation',
        'IMAGE_OCR',
        ['IMAGE', 'INVOICE', 'ACCOUNTS_PAYABLE'],
        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH'],
        [
          'Extract vendor, invoice number, invoice/due dates, bill-to, PO reference, currency, line items, subtotal, tax and total with exact evidence references.',
          'Preserve raw multi-engine OCR disagreement and require explicit field-level adjudication rather than silently preferring a label.',
          'Reconcile quantity × unit price, line-item sum to subtotal, and subtotal plus tax to total due.',
          'Treat an invoice-stated PO reference as a reference only; absent independent PO, receiving and approval evidence, three-way match remains NOT_TESTABLE and payment remains BLOCKED.',
          'Never infer payment, approval, debit-account classification or ledger posting from invoice content alone.',
          'Actual product AP review and every exported draft must preserve AP state plus original source lineage.'
        ],
        'CONTRACT_READY',
        ['server/tests/invoiceApInterpretationEngine.test.ts', 'server/tests/invoiceApProductTruthBrowser.test.ts', 'server/tests/invoiceApDeliverableTruth.test.ts', 'server/tests/invoiceApFiveDimensionAcceptance.test.ts', 'docs/launch/evidence/2026-09-16_P2_INVOICE_AP_FIVE_DIMENSION_ACCEPTANCE.md']
      ),"""
)
replace('server/tests/fiveDimensionAcademyCurriculum.test.ts', 'assert.equal(coverage.contractReadyCases, 6);', 'assert.equal(coverage.contractReadyCases, 7);')
replace('server/tests/fiveDimensionAcademyCurriculum.test.ts', 'assert.equal(coverage.physicalFixturePendingCases, 13);', 'assert.equal(coverage.physicalFixturePendingCases, 12);')
replace(
    'server/tests/fiveDimensionAcademyCurriculum.test.ts',
    "assert.deepEqual(find('CURR-OCR-RECEIPT-PHOTO').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);",
    "assert.deepEqual(find('CURR-OCR-RECEIPT-PHOTO').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);\nassert.equal(find('CURR-OCR-SCANNED-INVOICE').fixtureStatus, 'CONTRACT_READY');\nassert.deepEqual(find('CURR-OCR-SCANNED-INVOICE').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);\nassert.ok(find('CURR-OCR-SCANNED-INVOICE').expectedSafeguards.join(' ').includes('payment remains BLOCKED'));"
)


Path('server/tests/fixtures/invoiceApFiveDimensionFixture.ts').write_text(r'''import type { LocalOcrCompositeResult, LocalOcrEngineResult, LocalOcrRegion, OcrBoundingBox } from '../../../src/lib/ocr/localOcrClient.js';
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
''')


Path('server/tests/invoiceApInterpretationEngine.test.ts').write_text(r'''import assert from 'node:assert/strict';
import { interpretInvoiceAp, buildInvoiceApFiveDimensionChecks } from '../cpaOrganization/invoiceApInterpretationEngine.js';
import { buildInvoiceOcrComposite, INVOICE_SHA256 } from './fixtures/invoiceApFiveDimensionFixture.js';

const invoice = interpretInvoiceAp(buildInvoiceOcrComposite());
assert.equal(invoice.sourceSha256, INVOICE_SHA256);
assert.equal(invoice.vendor.value, 'SYNTHETIC OFFICE SUPPLY CO.');
assert.equal(invoice.invoiceNumber.value, 'INV-260916-1042');
assert.equal(invoice.invoiceDate.value, '09/16/2026');
assert.equal(invoice.dueDate.value, '10/16/2026');
assert.equal(invoice.billTo.value, 'EVE ACADEMY TEST CLIENT');
assert.equal(invoice.purchaseOrderReference.value, 'PO-EVE-1001');
assert.equal(invoice.currency.value, 'USD');
assert.equal(invoice.lineItems.value?.length, 3);
assert.deepEqual(invoice.lineItems.value?.map(i => i.lineTotal), [70,60,45]);
assert.equal(invoice.subtotal.value, 175);
assert.equal(invoice.salesTax.value, 12.25);
assert.equal(invoice.totalDue.value, 187.25);
assert.equal(invoice.semanticAdjudication.rawLabelDisagreement, true);
assert.deepEqual(invoice.semanticAdjudication.rawLabelTexts, ['INV0ICE INV-260916-1042','INVOICE INV-260916-1042']);
assert.equal(invoice.semanticAdjudication.status, 'RESOLVED_FIELD_CONSENSUS');
assert.equal(invoice.semanticAdjudication.unresolvedRequiredFields.length, 0);
assert.equal(invoice.reconciliation.status, 'PASS');
assert.equal(invoice.reconciliation.lineItemExtensionsPass, true);
assert.equal(invoice.reconciliation.lineItemsToSubtotalPass, true);
assert.equal(invoice.reconciliation.subtotalPlusTaxToTotalPass, true);
assert.equal(invoice.reconciliation.lineItemSum, 175);
assert.equal(invoice.reconciliation.expectedTotal, 187.25);
assert.equal(invoice.reconciliation.variance, 0);
assert.equal(invoice.apControl.payableCandidateAmount, 187.25);
assert.equal(invoice.apControl.payableCandidateCurrency, 'USD');
assert.equal(invoice.apControl.payableCandidateStatus, 'SUPPORTED_CANDIDATE');
assert.equal(invoice.apControl.threeWayMatchStatus, 'NOT_TESTABLE');
assert.equal(invoice.apControl.independentPurchaseOrderVerified, false);
assert.equal(invoice.apControl.receivingEvidenceVerified, false);
assert.equal(invoice.apControl.approvalEvidenceVerified, false);
assert.equal(invoice.apControl.approvalStatus, 'REVIEW_REQUIRED');
assert.equal(invoice.apControl.paymentEligibility, 'BLOCKED');
assert.equal(invoice.apControl.paymentStatus, 'UNKNOWN');
assert.equal(invoice.apControl.postingStatus, 'NOT_POSTED');
assert.equal(invoice.apControl.debitAccountClassification, 'REVIEW_REQUIRED');
assert.ok(invoice.duplicateCandidateFingerprint);

const checks = buildInvoiceApFiveDimensionChecks(invoice);
for (const check of [...checks.source, ...checks.semantic, ...checks.accounting]) {
  assert.equal(check.outcome, 'PASS', `${check.checkId} must pass`);
  assert.ok((check.evidenceRefs || []).length > 0, `${check.checkId} requires evidence refs`);
}

const conflict = buildInvoiceOcrComposite();
const doctr = conflict.attempts.find(a => a.engine === 'doctr')!.result!;
doctr.pages[0].regions.find(r => r.regionId === 'p1-r11')!.text = 'TOTAL DUE $197.25';
const conflicted = interpretInvoiceAp(conflict);
assert.equal(conflicted.totalDue.status, 'CONFLICT');
assert.equal(conflicted.semanticAdjudication.status, 'REVIEW_REQUIRED');
assert.equal(conflicted.reconciliation.status, 'FAIL');
assert.equal(conflicted.apControl.payableCandidateStatus, 'REVIEW_REQUIRED');
assert.ok(buildInvoiceApFiveDimensionChecks(conflicted).semantic.some(c => c.outcome === 'FAIL'));
assert.ok(buildInvoiceApFiveDimensionChecks(conflicted).accounting.some(c => c.outcome === 'FAIL'));

console.log('INVOICE_AP_INTERPRETATION_ENGINE_TESTS=PASS');
''')


Path('server/tests/documentIntelligenceInvoiceTruth.test.ts').write_text(r'''import assert from 'node:assert/strict';
import { DocumentIntelligenceAgent } from '../../src/lib/agents/documentAgents.js';

const agent = new DocumentIntelligenceAgent();
const invoice = agent.classifyAndExtract({ raw_text: 'INVOICE INV-1\nBILL TO Client\nTOTAL DUE $100\nDUE DATE 10/16/2026\nPURCHASE ORDER PO-1\nCURRENCY USD' } as any);
assert.equal(invoice.category, 'Invoice / Billing Record');
assert.equal(invoice.documentKind, 'INVOICE');
assert.equal(invoice.reportingCurrency, 'USD');
assert.deepEqual(invoice.statementTypes, []);
assert.ok(invoice.classificationSignals >= 5);
assert.ok(invoice.confidence < 1 && invoice.confidence > 0.9);

const dollarOnly = agent.classifyAndExtract({ raw_text: 'INVOICE INV-2\nBILL TO Client\nTOTAL DUE $100' } as any);
assert.equal(dollarOnly.category, 'Invoice / Billing Record');
assert.equal(dollarOnly.reportingCurrency, undefined, 'dollar sign alone must not silently mean USD');
assert.deepEqual(dollarOnly.statementTypes, []);

console.log('DOCUMENT_INTELLIGENCE_INVOICE_TRUTH_TESTS=PASS');
''')


Path('server/tests/invoiceApProductTruthBrowser.test.ts').write_text(r'''import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { buildInvoiceApEngagement, buildInvoiceApInterpretation, INVOICE_ENGAGEMENT_ID, INVOICE_SHA256, invoiceEvidenceDir } from './fixtures/invoiceApFiveDimensionFixture.js';

const baseUrl = process.env.EVE_TEST_BASE_URL || 'http://127.0.0.1:4173';
const evidenceDir = invoiceEvidenceDir(); fs.mkdirSync(evidenceDir,{recursive:true});
const invoice = buildInvoiceApInterpretation(); const engagement = buildInvoiceApEngagement(invoice);
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean) as string[];
const executablePath=candidates.find(p=>fs.existsSync(p)); if(!executablePath) throw new Error('MISSING_BROWSER_EXECUTABLE');
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage(); await page.setViewport({width:1440,height:1100}); await page.setRequestInterception(true);
 page.on('request',async request=>{try{const url=new URL(request.url()); if(url.origin!==new URL(baseUrl).origin||!url.pathname.startsWith('/api/'))return request.continue(); let payload:any={};
   if(url.pathname==='/api/cpa/engagements/universal')payload={engagements:[{engagementId:engagement.engagementId,workspaceId:engagement.workspaceId,classification:'ACADEMY',isCustomer:false,clientName:engagement.clientName,period:engagement.period,framework:engagement.framework,functionalCurrency:engagement.functionalCurrency,currentStage:engagement.currentStage,openReviewNotesCount:0,documentsCount:1,canonicalFactsCount:1}]};
   else if(url.pathname===`/api/cpa/engagements/${INVOICE_ENGAGEMENT_ID}`)payload={engagement};
   else if(url.pathname==='/api/cpa/reports/library')payload={reports:[]}; else if(url.pathname==='/api/queue/jobs')payload={jobs:[]}; else if(url.pathname==='/api/health')payload={status:'ok'};
   await request.respond({status:200,contentType:'application/json',body:JSON.stringify(payload)});
 }catch{request.abort();}});
 const response=await page.goto(`${baseUrl}/?view=engagement-evidence`,{waitUntil:'networkidle0',timeout:30000}); assert.ok(response?.ok());
 const selector='[data-eve-ap-invoice-id="INV-260916-1042"]'; await page.waitForSelector(selector,{visible:true,timeout:15000});
 const panelText=await page.$eval(selector,el=>(el as HTMLElement).innerText);
 for(const expected of ['SYNTHETIC OFFICE SUPPLY CO.','Invoice INV-260916-1042','09/16/2026','10/16/2026','PO-EVE-1001','USD','USD 175.00','USD 12.25','USD 187.25','Arithmetic reconciliation: PASS','Three-way match: NOT_TESTABLE','Independent purchase-order record: NOT PROVIDED','Receiving evidence: NOT PROVIDED','Approval: REVIEW_REQUIRED','Payment eligibility: BLOCKED','Payment status: UNKNOWN','Posting: NOT_POSTED','Debit account classification: REVIEW_REQUIRED','RESOLVED_FIELD_CONSENSUS','INV0ICE INV-260916-1042','INVOICE INV-260916-1042']) assert.ok(panelText.includes(expected),`AP product panel missing ${expected}`);
 const attrs=await page.$eval(selector,(el:any)=>({approval:el.dataset.eveApApprovalStatus,payment:el.dataset.eveApPaymentEligibility,match:el.dataset.eveApThreeWayMatch}));
 assert.deepEqual(attrs,{approval:'REVIEW_REQUIRED',payment:'BLOCKED',match:'NOT_TESTABLE'});
 await page.$eval(`${selector} details[data-eve-ap-lineage="true"]`,(el:any)=>{el.open=true;});
 const lineageText=await page.$eval(`${selector} details[data-eve-ap-lineage="true"]`,el=>(el as HTMLElement).innerText);
 assert.ok(lineageText.includes(INVOICE_SHA256)); assert.ok(lineageText.includes('ocr:paddleocr:')); assert.ok(lineageText.includes('ocr:doctr:'));
 const screenshot=path.join(evidenceDir,'invoice-ap-product-truth.png'); await page.screenshot({path:screenshot,fullPage:true});
 const proof={marker:'P2_INVOICE_AP_PRODUCT_TRUTH_BROWSER=PASS',sourceSha256:INVOICE_SHA256,invoiceNumber:invoice.invoiceNumber.value,approvalStatus:invoice.apControl.approvalStatus,paymentEligibility:invoice.apControl.paymentEligibility,threeWayMatch:invoice.apControl.threeWayMatchStatus,screenshot,browserVersion:await browser.version()};
 fs.writeFileSync(path.join(evidenceDir,'product-truth.json'),JSON.stringify(proof,null,2)); console.log('P2_INVOICE_AP_PRODUCT_TRUTH_BROWSER=PASS');
}finally{await browser.close();}
''')


Path('server/tests/invoiceApDeliverableTruth.test.ts').write_text(r'''import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import * as XLSXModule from 'xlsx';
const XLSX:any=(XLSXModule as any).default||XLSXModule;
import { buildInvoiceApFact, buildInvoiceApInterpretation, INVOICE_DOCUMENT_ID, INVOICE_ENGAGEMENT_ID, INVOICE_FACT_ID, INVOICE_SHA256, INVOICE_WORKSPACE_ID, invoiceEvidenceDir } from './fixtures/invoiceApFiveDimensionFixture.js';

const evidenceDir=invoiceEvidenceDir(); const reportsDir=path.join(evidenceDir,'reports'); fs.mkdirSync(reportsDir,{recursive:true}); process.env.HERMES_REPORTS_DIR=reportsDir;
const {deliverableArtifactService}=await import('../cpaOrganization/deliverableArtifactService.js');
const invoice=buildInvoiceApInterpretation(); const fact=buildInvoiceApFact(invoice);
const report=await deliverableArtifactService.compileAndRegisterDeliverable({reportId:'REP-INVOICE-AP-260916-1042',engagementId:INVOICE_ENGAGEMENT_ID,workspaceId:INVOICE_WORKSPACE_ID,version:'v1.0',title:'Invoice AP Evidence Review Draft',clientName:'Eve Academy AP Test Client',period:'2026-09-16',currency:'USD',status:'AI_PREPARED',apReview:invoice,facts:[{
 id:fact.id,canonicalMetric:fact.canonicalMetric,label:fact.labelNormalized,value:fact.normalizedValue,statement:'AP_EVIDENCE',sourceDoc:'invoice.png',page:1,verificationStatus:'VERIFIED',evidenceStatus:'CONFIRMED',documentId:INVOICE_DOCUMENT_ID,reportingPeriod:'2026-09-16',sourceText:fact.sourceText,sourceBlockIds:['SB-INVOICE-TOTAL'],sourceSha256:fact.sourceSha256,sourceArtifactId:fact.sourceArtifactId,sourceProvenanceId:fact.sourceProvenanceId,sourceProvenanceIds:fact.sourceProvenanceIds,sourceCoordinate:fact.sourceCoordinate,sourceCoordinates:fact.sourceCoordinates,sourceExtractionMethod:fact.sourceExtractionMethod,sourceExtractionVersion:fact.sourceExtractionVersion,
}]});
assert.equal(report.status,'AI_PREPARED'); assert.ok(report.formats.pdf&&report.formats.json&&report.formats.xlsx&&report.formats.csvLeadSchedules);
const pdfBytes=fs.readFileSync(report.formats.pdf!.filepath); assert.equal(pdfBytes.subarray(0,5).toString(),'%PDF-'); const pdfSha=crypto.createHash('sha256').update(pdfBytes).digest('hex'); assert.equal(pdfSha,report.formats.pdf!.sha256);
const {PDFParse}=await import('pdf-parse'); const parser=new PDFParse({data:pdfBytes}); let pdfText=''; try{pdfText=(await parser.getText()).text;}finally{await parser.destroy();}
for(const expected of ['Invoice AP Evidence Review Draft','Accounts payable invoice review','SYNTHETIC OFFICE SUPPLY CO.','INV-260916-1042','10/16/2026','PO-EVE-1001','Total due: 187.25','Reconciliation: PASS','Semantic adjudication: RESOLVED_FIELD_CONSENSUS','INV0ICE INV-260916-1042','INVOICE INV-260916-1042','Three-way match: NOT_TESTABLE','Approval: REVIEW_REQUIRED','Payment eligibility: BLOCKED','Payment status: UNKNOWN','Posting: NOT_POSTED',INVOICE_SHA256,'TOTAL DUE $187.25']) assert.ok(pdfText.includes(expected),`PDF missing ${expected}`);
const json=JSON.parse(fs.readFileSync(report.formats.json!.filepath,'utf8')); assert.equal(json.apReview.invoiceNumber.value,'INV-260916-1042'); assert.equal(json.apReview.apControl.paymentEligibility,'BLOCKED'); assert.equal(json.apReview.apControl.threeWayMatchStatus,'NOT_TESTABLE'); assert.equal(json.facts[0].sourceSha256,INVOICE_SHA256);
const csv=fs.readFileSync(report.formats.csvLeadSchedules!.filepath,'utf8'); for(const expected of ['AP INVOICE REVIEW','INV-260916-1042','REVIEW_REQUIRED','BLOCKED','NOT_TESTABLE',INVOICE_SHA256,'TOTAL DUE $187.25']) assert.ok(csv.includes(expected),`CSV missing ${expected}`);
const workbook=XLSX.readFile(report.formats.xlsx!.filepath); assert.ok(workbook.Sheets['AP Review']); const apRows:any[][]=XLSX.utils.sheet_to_json(workbook.Sheets['AP Review'],{header:1,raw:false}); const apText=apRows.flat().map(v=>String(v??'')).join(' | '); for(const expected of ['INV-260916-1042','PO-EVE-1001','RESOLVED_FIELD_CONSENSUS','NOT_TESTABLE','REVIEW_REQUIRED','BLOCKED','NOT_POSTED',INVOICE_SHA256]) assert.ok(apText.includes(expected),`XLSX AP Review missing ${expected}`);
const leadRows:any[][]=XLSX.utils.sheet_to_json(workbook.Sheets['Lead Schedules'],{header:1,raw:false}); const leadText=leadRows.flat().map(v=>String(v??'')).join(' | '); for(const expected of [INVOICE_SHA256,'TOTAL DUE $187.25']) assert.ok(leadText.includes(expected));
const proof={marker:'P2_INVOICE_AP_DELIVERABLE_TRUTH=PASS',sourceSha256:INVOICE_SHA256,factId:INVOICE_FACT_ID,invoiceNumber:invoice.invoiceNumber.value,reportId:report.reportId,version:report.version,pdfSha256:pdfSha,pdfBytes:pdfBytes.length,formats:{pdf:report.formats.pdf!.sha256,json:report.formats.json!.sha256,xlsx:report.formats.xlsx!.sha256,csv:report.formats.csvLeadSchedules!.sha256}}; fs.writeFileSync(path.join(evidenceDir,'deliverable-truth.json'),JSON.stringify(proof,null,2)); console.log('P2_INVOICE_AP_DELIVERABLE_TRUTH=PASS');
''')


Path('server/tests/invoiceApFiveDimensionAcceptance.test.ts').write_text(r'''import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { academyMinervaLab } from '../cpaOrganization/academyMinervaLab.js';
import { buildInvoiceApFiveDimensionChecks } from '../cpaOrganization/invoiceApInterpretationEngine.js';
import { buildInvoiceApInterpretation, INVOICE_SHA256, invoiceEvidenceDir } from './fixtures/invoiceApFiveDimensionFixture.js';

const dir=invoiceEvidenceDir(); const productPath=path.join(dir,'product-truth.json'); const deliverablePath=path.join(dir,'deliverable-truth.json');
assert.ok(fs.existsSync(productPath),'Product Truth evidence receipt missing'); assert.ok(fs.existsSync(deliverablePath),'Deliverable Truth evidence receipt missing');
const product=JSON.parse(fs.readFileSync(productPath,'utf8')); const deliverable=JSON.parse(fs.readFileSync(deliverablePath,'utf8'));
assert.equal(product.marker,'P2_INVOICE_AP_PRODUCT_TRUTH_BROWSER=PASS'); assert.equal(deliverable.marker,'P2_INVOICE_AP_DELIVERABLE_TRUTH=PASS'); assert.equal(product.sourceSha256,INVOICE_SHA256); assert.equal(deliverable.sourceSha256,INVOICE_SHA256);
const invoice=buildInvoiceApInterpretation(); const checks=buildInvoiceApFiveDimensionChecks(invoice);
const report=academyMinervaLab.evaluateFiveDimensions({caseId:'CURR-OCR-SCANNED-INVOICE',executionId:`invoice-ap-${INVOICE_SHA256.slice(0,12)}`,dimensions:{
 SOURCE_COVERAGE:{checks:checks.source}, SEMANTIC_UNDERSTANDING:{checks:checks.semantic}, ACCOUNTING_ACCURACY:{checks:checks.accounting},
 PRODUCT_TRUTH:{checks:[{checkId:'invoice-ap-real-product-browser',label:'Actual Eve AP invoice review renders evidence-backed state in Chromium',outcome:'PASS',evidenceRefs:[`browser:${product.screenshot}`,`source:${INVOICE_SHA256}`],details:[`approval=${product.approvalStatus}; payment=${product.paymentEligibility}; threeWay=${product.threeWayMatch}`]}]},
 DELIVERABLE_TRUTH:{checks:[{checkId:'invoice-ap-artifact-reverse-lineage',label:'Invoice AP draft artifacts preserve AP state and original source lineage',outcome:'PASS',evidenceRefs:[`artifact:pdf:${deliverable.formats.pdf}`,`artifact:json:${deliverable.formats.json}`,`artifact:xlsx:${deliverable.formats.xlsx}`,`artifact:csv:${deliverable.formats.csv}`],details:[`report=${deliverable.reportId}:${deliverable.version}; pdfSha=${deliverable.pdfSha256}`]}]},
}});
for(const dimension of ['SOURCE_COVERAGE','SEMANTIC_UNDERSTANDING','ACCOUNTING_ACCURACY','PRODUCT_TRUTH','DELIVERABLE_TRUTH'] as const) assert.equal(report.dimensions[dimension].status,'PASS',`${dimension} must pass`);
assert.equal(report.passedDimensionCount,5); assert.equal(report.notTestedDimensionCount,0); assert.equal(report.fullyTested,true); assert.equal(report.allRequiredDimensionsPassed,true); assert.equal(report.overallStatus,'FIVE_DIMENSION_PASS');
fs.writeFileSync(path.join(dir,'five-dimension-result.json'),JSON.stringify({marker:'P2_INVOICE_AP_FIVE_DIMENSION_PASS=PASS',sourceSha256:INVOICE_SHA256,report},null,2)); console.log('P2_INVOICE_AP_FIVE_DIMENSION_PASS=PASS');
''')

print('INVOICE_AP_PATCH_APPLIED')
