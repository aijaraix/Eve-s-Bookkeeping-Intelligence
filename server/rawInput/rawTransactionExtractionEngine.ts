import type { CanonicalDocumentModel } from '../../src/lib/parser/types.js';
import type { ExtractedFact } from '../../src/types.js';
import { interpretInvoiceAp, type InvoiceApField, type InvoiceApInterpretation } from '../cpaOrganization/invoiceApInterpretationEngine.js';

export type RawDocumentKind =
  | 'RECEIPT'
  | 'AP_INVOICE'
  | 'AR_INVOICE'
  | 'INVOICE'
  | 'CREDIT_CARD_STATEMENT'
  | 'PAYROLL_REGISTER'
  | 'POS_SALES'
  | 'MERCHANT_SETTLEMENT'
  | 'LOAN_RECORD'
  | 'FIXED_ASSET_RECORD'
  | 'INVENTORY_RECORD'
  | 'TRANSACTION_REGISTER'
  | 'UNKNOWN';

export interface RawFieldEvidence<T> {
  value: T;
  rawLiteral: string;
  sourceText: string;
  sourceBlockId?: string;
  sourceSha256?: string;
  sourceArtifactId?: string;
  sourceProvenanceId?: string;
  sourceCoordinate?: any;
  pageNumber: number;
  confidence: number;
}

export interface RawTransactionRecord {
  transactionId: string;
  documentKind: Exclude<RawDocumentKind, 'UNKNOWN'>;
  amount: RawFieldEvidence<number>;
  transactionDate?: RawFieldEvidence<string>;
  currency?: RawFieldEvidence<string>;
  counterparty?: RawFieldEvidence<string>;
  documentNumber?: RawFieldEvidence<string>;
  subtotal?: RawFieldEvidence<number>;
  tax?: RawFieldEvidence<number>;
  paymentMethod?: RawFieldEvidence<string>;
  accountingCategory?: RawFieldEvidence<string>;
  description?: RawFieldEvidence<string>;
  lineItems: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    lineTotal: number;
    evidence: RawFieldEvidence<string>;
  }>;
  evidenceState: 'COMPLETE' | 'PARTIAL';
  canonicalizationState: 'READY_FOR_CLASSIFICATION' | 'BLOCKED_EVIDENCE_INCOMPLETE';
  clarificationReasons: string[];
}

export interface RawTransactionExtractionResult {
  recognized: boolean;
  documentKind: RawDocumentKind;
  transactions: RawTransactionRecord[];
  facts: ExtractedFact[];
  evidenceCompleteCount: number;
  needsClarificationCount: number;
  requiresClarification: boolean;
  clarificationReasons: string[];
  classifierSignals: string[];
}

interface Observation {
  text: string;
  sourceText: string;
  sourceBlockId?: string;
  sourceSha256?: string;
  sourceArtifactId?: string;
  sourceProvenanceId?: string;
  sourceCoordinate?: any;
  pageNumber: number;
  confidence: number;
}

const DATE_PATTERN = /\b(\d{4}[\/-]\d{1,2}[\/-]\d{1,2}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|[A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4})\b/;
const ISO_CURRENCY_PATTERN = /\b(USD|EUR|GBP|JPY|CHF|CAD|AUD|NZD|SEK|NOK|DKK|CNY|RMB|HKD|SGD|INR|MXN|BRL|ZAR)\b/i;

function clean(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function parseMoney(raw: unknown): number | null {
  const literal = clean(raw);
  if (!literal) return null;
  const negative = /^\(.*\)$/.test(literal) || /-\s*\d/.test(literal);
  const normalized = literal.replace(/[^0-9.]/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return negative && parsed > 0 ? -parsed : parsed;
}

function observations(doc: CanonicalDocumentModel): Observation[] {
  const blocks = Array.isArray((doc as any).sourceBlocks)
    ? (doc as any).sourceBlocks
    : (Array.isArray((doc as any).source_blocks) ? (doc as any).source_blocks : []);
  const out: Observation[] = [];
  for (const block of blocks) {
    const sourceText = String(block?.raw_text || block?.text_content || '');
    const lines = sourceText.split(/\r?\n/).map(clean).filter(Boolean);
    for (const line of lines.length ? lines : [clean(sourceText)].filter(Boolean)) {
      out.push({
        text: line,
        sourceText,
        sourceBlockId: block?.source_block_id || block?.sourceBlockId || block?.id,
        sourceSha256: block?.source_sha256 || block?.sourceSha256 || doc.source?.hash,
        sourceArtifactId: block?.source_artifact_id || block?.sourceArtifactId || doc.source?.sourceArtifactId,
        sourceProvenanceId: block?.source_provenance_id || block?.sourceProvenanceId,
        sourceCoordinate: block?.source_coordinate || block?.sourceCoordinate,
        pageNumber: Number(block?.page_number || block?.pageNumber || 1),
        confidence: Number(block?.confidence ?? block?.source_coordinate?.confidence ?? 0.98),
      });
    }
  }
  if (out.length) return out;
  for (const page of doc.pages || []) {
    for (const line of String(page.text || '').split(/\r?\n/).map(clean).filter(Boolean)) {
      out.push({ text: line, sourceText: String(page.text || ''), pageNumber: Number(page.page_number || 1), confidence: 0 });
    }
  }
  return out;
}

function evidence<T>(obs: Observation, value: T, rawLiteral = obs.text, overrides: Partial<RawFieldEvidence<T>> = {}): RawFieldEvidence<T> {
  return {
    value,
    rawLiteral: clean(rawLiteral),
    sourceText: obs.sourceText,
    sourceBlockId: obs.sourceBlockId,
    sourceSha256: obs.sourceSha256,
    sourceArtifactId: obs.sourceArtifactId,
    sourceProvenanceId: obs.sourceProvenanceId,
    sourceCoordinate: obs.sourceCoordinate,
    pageNumber: obs.pageNumber,
    confidence: obs.confidence,
    ...overrides,
  };
}

function findMatch<T>(rows: Observation[], patterns: RegExp[], map: (match: RegExpMatchArray, row: Observation) => T | null): RawFieldEvidence<T> | undefined {
  for (const row of rows) {
    for (const pattern of patterns) {
      const match = row.text.match(pattern);
      if (!match) continue;
      const value = map(match, row);
      if (value !== null) return evidence(row, value, match[0]);
    }
  }
  return undefined;
}

function detectKind(filename: string, text: string, tables: any[]): { kind: RawDocumentKind; signals: string[] } {
  const haystack = `${filename}\n${text}`.toLowerCase();
  const signals: string[] = [];
  const choose = (kind: RawDocumentKind, signal: string) => ({ kind, signals: [signal] });
  const financialStatement = /\b(consolidated\s+(?:statements?|balance)|annual report|statement of financial position|total assets|total liabilities)\b/.test(haystack);

  if (/\bcredit card\b/.test(haystack) && /\b(statement|account|transactions?)\b/.test(haystack)) return choose('CREDIT_CARD_STATEMENT', 'CREDIT_CARD_STATEMENT_LABEL');
  if (/\b(payroll|pay register|gross pay|net pay|employee earnings)\b/.test(haystack)) return choose('PAYROLL_REGISTER', 'PAYROLL_LANGUAGE');
  if (/\b(merchant settlement|processor settlement|payout id|net payout|processing fee)\b/.test(haystack)) return choose('MERCHANT_SETTLEMENT', 'MERCHANT_SETTLEMENT_LANGUAGE');
  if (/\b(point of sale|pos report|register close|daily sales|till summary|net sales)\b/.test(haystack)) return choose('POS_SALES', 'POS_SALES_LANGUAGE');
  if (/\b(loan statement|principal payment|interest payment|promissory note|loan payment)\b/.test(haystack)) return choose('LOAN_RECORD', 'LOAN_LANGUAGE');
  if (/\b(fixed asset|asset register|depreciation|useful life|serial number)\b/.test(haystack)) return choose('FIXED_ASSET_RECORD', 'FIXED_ASSET_LANGUAGE');
  if (/\b(inventory (?:register|receipt|movement)|quantity on hand|stock receipt|sku\b)\b/.test(haystack)) return choose('INVENTORY_RECORD', 'INVENTORY_LANGUAGE');
  if (/\b(receipt|cashier|change due|amount paid)\b/.test(haystack)) return choose('RECEIPT', 'RECEIPT_LANGUAGE');
  if (/\b(invoice|total due|amount due|bill to)\b/.test(haystack)) {
    if (/\b(accounts payable|vendor invoice|supplier invoice|bill from)\b/.test(haystack)) return choose('AP_INVOICE', 'AP_INVOICE_LANGUAGE');
    if (/\b(accounts receivable|customer invoice|invoice to)\b/.test(haystack)) return choose('AR_INVOICE', 'AR_INVOICE_LANGUAGE');
    return choose('INVOICE', 'INVOICE_LANGUAGE_DIRECTION_UNRESOLVED');
  }

  const hasTransactionTable = tables.some(table => {
    const headers = (table?.headers || []).map((header: unknown) => clean(header).toLowerCase());
    return headers.some((header: string) => /\b(date|posted)\b/.test(header)) &&
      headers.some((header: string) => /\b(amount|debit|credit|total)\b/.test(header));
  });
  if (hasTransactionTable && !financialStatement) {
    signals.push('DATED_AMOUNT_TABLE');
    return { kind: 'TRANSACTION_REGISTER', signals };
  }
  return { kind: 'UNKNOWN', signals: financialStatement ? ['FINANCIAL_STATEMENT_GUARD'] : [] };
}

function findCounterparty(rows: Observation[], kind: RawDocumentKind): RawFieldEvidence<string> | undefined {
  const labeled = findMatch(rows, [
    /\b(?:vendor|supplier|merchant|payee|counterparty|employer|customer)\s*[:#-]\s*(.+)$/i,
    /\b(?:bill from|sold by|purchased from)\s*[:#-]?\s*(.+)$/i,
  ], match => clean(match[1]) || null);
  if (labeled) return labeled;
  if (!['RECEIPT', 'INVOICE', 'AP_INVOICE', 'AR_INVOICE'].includes(kind)) return undefined;
  const candidate = rows.find(row => {
    const line = row.text;
    return /[A-Za-z]{3}/.test(line) && line.length <= 120 &&
      !/\b(receipt|invoice|date|due|subtotal|tax|total|currency|bill to|purchase order|qty|quantity)\b/i.test(line) &&
      !DATE_PATTERN.test(line) && !/^\s*\d/.test(line);
  });
  return candidate ? evidence(candidate, candidate.text) : undefined;
}

function findDescription(rows: Observation[], kind: RawDocumentKind): RawFieldEvidence<string> | undefined {
  const labeled = findMatch(rows, [
    /\b(?:description|memo|purpose|item|service)\s*[:#-]\s*(.+)$/i,
  ], match => clean(match[1]) || null);
  if (labeled) return labeled;
  const kindLabel = kind.replace(/_/g, ' ').toLowerCase();
  const row = rows.find(item => /[A-Za-z]{3}/.test(item.text) && /\d/.test(item.text) && !/\b(total|subtotal|tax|date|invoice|receipt)\b/i.test(item.text));
  return row ? evidence(row, clean(row.text)) : rows[0] ? evidence(rows[0], kindLabel) : undefined;
}

function extractLineItems(rows: Observation[]): RawTransactionRecord['lineItems'] {
  const items: RawTransactionRecord['lineItems'] = [];
  for (const row of rows) {
    const match = row.text.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*[xX×]\s*[$€£¥]?\s*([\d,.]+)\s*=\s*[$€£¥]?\s*([\d,.]+)\s*$/);
    if (!match) continue;
    const quantity = Number(match[2]);
    const unitPrice = parseMoney(match[3]);
    const lineTotal = parseMoney(match[4]);
    if (!Number.isFinite(quantity) || unitPrice === null || lineTotal === null) continue;
    items.push({ description: clean(match[1]), quantity, unitPrice, lineTotal, evidence: evidence(row, row.text) });
  }
  return items;
}

function invoiceConsensusFromDocument(doc: CanonicalDocumentModel): InvoiceApInterpretation | null {
  const attempts = Array.isArray((doc as any).ocrEngineResults)
    ? (doc as any).ocrEngineResults.filter((attempt: any) => attempt?.result)
    : [];
  if (!attempts.length) return null;
  const selected = attempts.find((attempt: any) => attempt.selected) || attempts[0];
  if (!selected?.result) return null;
  try {
    return interpretInvoiceAp({
      ...selected.result,
      routingDecision: (doc as any).ocrRoutingDecision || {
        selectedEngine: selected.result.engine,
        fallbackInvoked: attempts.length > 1,
        reasons: attempts.length > 1 ? ['PARSER_RETAINED_MULTIPLE_OCR_ENGINES'] : [],
        orientationRetryInvoked: false,
        selectedRotationDegrees: Number(selected.rotationDegrees || 0),
      },
      attempts,
    } as any);
  } catch {
    return null;
  }
}

function invoiceFieldEvidence<T>(field: InvoiceApField<T>, rows: Observation[]): RawFieldEvidence<T> | undefined {
  if (field.value === null || field.value === undefined) return undefined;
  const rawLiteral = clean(field.sourceCoordinate?.rawLiteral || Object.values(field.perEngine || {}).find(item => item?.rawText)?.rawText || field.value);
  const row = rows.find(item => item.text === rawLiteral || item.text.includes(rawLiteral) || rawLiteral.includes(item.text)) || rows[0];
  if (!row) return undefined;
  const evidenceRef = field.evidenceRefs?.[0];
  return evidence(row, field.value, rawLiteral, {
    sourceSha256: field.sourceCoordinate?.sourceSha256 || row.sourceSha256,
    sourceArtifactId: field.sourceCoordinate?.sourceArtifactId || row.sourceArtifactId,
    sourceProvenanceId: evidenceRef || row.sourceProvenanceId,
    sourceCoordinate: field.sourceCoordinate || row.sourceCoordinate,
    confidence: Number(field.sourceCoordinate?.confidence ?? row.confidence),
  });
}

function invoiceLineEvidence(field: InvoiceApField<any>, rows: Observation[], value: string, searchText: string): RawFieldEvidence<string> | undefined {
  const row = rows.find(item => item.text.toUpperCase().includes(searchText.toUpperCase())) || rows[0];
  if (!row) return undefined;
  return evidence(row, value, row.text, {
    sourceSha256: field.sourceCoordinate?.sourceSha256 || row.sourceSha256,
    sourceArtifactId: field.sourceCoordinate?.sourceArtifactId || row.sourceArtifactId,
    sourceProvenanceId: field.evidenceRefs?.[0] || row.sourceProvenanceId,
    sourceCoordinate: field.sourceCoordinate || row.sourceCoordinate,
    confidence: Number(field.sourceCoordinate?.confidence ?? row.confidence),
  });
}

function transactionFromInvoiceConsensus(
  invoice: InvoiceApInterpretation,
  rows: Observation[],
  kind: 'AP_INVOICE' | 'AR_INVOICE' | 'INVOICE',
): RawTransactionRecord | null {
  const amount = invoiceFieldEvidence(invoice.totalDue, rows);
  if (!amount) return null;
  const transactionDate = invoiceFieldEvidence(invoice.invoiceDate, rows);
  const currency = invoiceFieldEvidence(invoice.currency, rows);
  const counterparty = invoiceFieldEvidence(invoice.vendor, rows);
  const documentNumber = invoiceFieldEvidence(invoice.invoiceNumber, rows);
  const subtotal = invoiceFieldEvidence(invoice.subtotal, rows);
  const tax = invoiceFieldEvidence(invoice.salesTax, rows);
  const descriptionValue = invoice.lineItems.value?.map(item => item.description).join('; ');
  const description = descriptionValue
    ? invoiceLineEvidence(invoice.lineItems, rows, descriptionValue, invoice.lineItems.value![0].description)
    : undefined;
  const materialFields: Array<[string, InvoiceApField<any>]> = [
    ['totalDue', invoice.totalDue],
    ['invoiceDate', invoice.invoiceDate],
    ['currency', invoice.currency],
    ['vendor', invoice.vendor],
  ];
  const reasons = materialFields
    .filter(([, field]) => field.status !== 'CONSENSUS')
    .map(([name, field]) => `OCR_FIELD_${name.toUpperCase()}_${field.status}`);
  const partial = {
    transactionId: '1',
    documentKind: kind,
    amount,
    transactionDate,
    currency,
    counterparty,
    documentNumber,
    subtotal,
    tax,
    description,
    lineItems: (invoice.lineItems.value || []).map(item => ({
      ...item,
      evidence: invoiceLineEvidence(invoice.lineItems, rows, JSON.stringify(item), item.description) || evidence({
        text: amount.rawLiteral, sourceText: amount.sourceText, sourceBlockId: amount.sourceBlockId,
        sourceSha256: amount.sourceSha256, sourceArtifactId: amount.sourceArtifactId,
        sourceProvenanceId: amount.sourceProvenanceId, sourceCoordinate: amount.sourceCoordinate,
        pageNumber: amount.pageNumber, confidence: amount.confidence,
      }, JSON.stringify(item)),
    })),
  };
  reasons.push(...requiredEvidenceReasons(partial));
  if (kind === 'INVOICE') reasons.push('INVOICE_AP_AR_DIRECTION_REQUIRES_TENANT_CONTEXT');
  const evidenceReasons = [...new Set(reasons.filter(reason => reason !== 'INVOICE_AP_AR_DIRECTION_REQUIRES_TENANT_CONTEXT'))];
  return {
    ...partial,
    evidenceState: evidenceReasons.length ? 'PARTIAL' : 'COMPLETE',
    canonicalizationState: evidenceReasons.length ? 'BLOCKED_EVIDENCE_INCOMPLETE' : 'READY_FOR_CLASSIFICATION',
    clarificationReasons: [...new Set(reasons)],
  };
}

function requiredEvidenceReasons(transaction: Omit<RawTransactionRecord, 'evidenceState' | 'canonicalizationState' | 'clarificationReasons'>): string[] {
  const reasons: string[] = [];
  if (!transaction.amount.sourceSha256 || !transaction.amount.sourceCoordinate) reasons.push('AMOUNT_SOURCE_COORDINATE_REQUIRED');
  if (!transaction.transactionDate) reasons.push('TRANSACTION_DATE_MISSING');
  if (!transaction.currency) reasons.push('CURRENCY_MISSING_OR_AMBIGUOUS');
  if (!transaction.counterparty && !transaction.description) reasons.push('COUNTERPARTY_OR_DESCRIPTION_MISSING');
  if (transaction.amount.confidence > 0 && transaction.amount.confidence < 0.9) reasons.push('MATERIAL_AMOUNT_LOW_CONFIDENCE');
  return reasons;
}

function factFromTransaction(transaction: RawTransactionRecord, params: { workspaceId: string; documentId: string; filename: string }): ExtractedFact {
  const amount = transaction.amount;
  const evidenceFields = [
    transaction.amount, transaction.transactionDate, transaction.currency, transaction.counterparty,
    transaction.documentNumber, transaction.subtotal, transaction.tax, transaction.paymentMethod, transaction.accountingCategory, transaction.description,
    ...transaction.lineItems.map(item => item.evidence),
  ].filter(Boolean) as RawFieldEvidence<unknown>[];
  const blockIds = [...new Set(evidenceFields.map(field => field.sourceBlockId).filter(Boolean))];
  const provenanceIds = [...new Set(evidenceFields.map(field => field.sourceProvenanceId).filter(Boolean))];
  const coordinates = evidenceFields.map(field => field.sourceCoordinate).filter(Boolean);
  const complete = transaction.evidenceState === 'COMPLETE';
  return {
    id: `FCT-RAW-${params.documentId}-${transaction.transactionId}`,
    workspaceId: params.workspaceId,
    documentId: params.documentId,
    sourceDocument: params.filename,
    factType: 'transaction',
    canonicalMetric: 'raw_input_transaction_total',
    labelOriginal: `${transaction.documentKind} transaction total`,
    labelNormalized: 'Raw Input Transaction Total',
    valueOriginal: amount.rawLiteral,
    valueFunctional: String(amount.value),
    normalizedValue: amount.value,
    currencyOriginal: transaction.currency?.value,
    functionalCurrency: transaction.currency?.value,
    currency: transaction.currency?.value,
    unitScale: 'Units',
    exchangeRate: transaction.currency ? '1.0000' : undefined,
    reportingPeriod: transaction.transactionDate?.value,
    periodStart: transaction.transactionDate?.value,
    periodEnd: transaction.transactionDate?.value,
    statementType: 'RAW_INPUT_TRANSACTION',
    accountingRole: 'TRANSACTION_CANDIDATE',
    pageNumber: amount.pageNumber,
    sourceText: amount.sourceText,
    sourceBlockId: amount.sourceBlockId,
    sourceBlockIds: blockIds,
    sourceSha256: amount.sourceSha256,
    sourceArtifactId: amount.sourceArtifactId,
    sourceProvenanceId: amount.sourceProvenanceId,
    sourceProvenanceIds: provenanceIds,
    sourceCoordinate: amount.sourceCoordinate,
    sourceCoordinates: coordinates,
    provenanceCoordinates: coordinates,
    confidence: Math.min(...evidenceFields.map(field => field.confidence || 0)),
    evidenceStatus: complete ? 'CONFIRMED' : 'PARTIAL',
    verificationStatus: complete ? 'EVIDENCE_CONFIRMED' : 'REVIEW_REQUIRED',
    status: complete ? 'approved' : 'pending_review',
    extractionEngine: 'RAW_TRANSACTION_DETERMINISTIC_V1',
    extractionMethod: 'RAW_INPUT_EVIDENCE_PARSE',
    canonicalizationState: transaction.canonicalizationState,
    postingStatus: 'NOT_POSTED',
    clarificationReasons: transaction.clarificationReasons,
    rawTransaction: transaction,
  };
}

function transactionsFromTables(doc: CanonicalDocumentModel, kind: Exclude<RawDocumentKind, 'UNKNOWN'>, documentId: string): RawTransactionRecord[] {
  const results: RawTransactionRecord[] = [];
  for (const [tableIndex, table] of (doc.tables || []).entries()) {
    const headers = (table.headers || []).map(header => clean(header).toLowerCase());
    const dateIndex = headers.findIndex(header => /\b(date|posted)\b/.test(header));
    const descriptionIndex = headers.findIndex(header => /\b(description|memo|payee|vendor|merchant|counterparty|employee|item)\b/.test(header));
    const currencyIndex = headers.findIndex(header => /\bcurrency\b/.test(header));
    const amountIndex = headers.findIndex(header => /\b(amount|net amount|total)\b/.test(header) && !/balance/.test(header));
    const debitIndex = headers.findIndex(header => /\b(debit|withdrawal)\b/.test(header));
    const creditIndex = headers.findIndex(header => /\b(credit|deposit)\b/.test(header));
    if (dateIndex < 0 || (amountIndex < 0 && debitIndex < 0 && creditIndex < 0)) continue;

    for (const [rowIndex, rawRow] of (table.rows || []).entries()) {
      const row = (rawRow || []).map(clean);
      const dateMatch = row[dateIndex]?.match(DATE_PATTERN);
      if (!dateMatch) continue;
      let selectedIndex = amountIndex;
      let amount = amountIndex >= 0 ? parseMoney(row[amountIndex]) : null;
      if (debitIndex >= 0) {
        const debit = parseMoney(row[debitIndex]);
        if (debit !== null && debit !== 0) { amount = -Math.abs(debit); selectedIndex = debitIndex; }
      }
      if ((amount === null || amount === 0) && creditIndex >= 0) {
        const credit = parseMoney(row[creditIndex]);
        if (credit !== null && credit !== 0) { amount = Math.abs(credit); selectedIndex = creditIndex; }
      }
      if (amount === null || selectedIndex < 0) continue;

      const cellEvidence = table.rowEvidence?.[rowIndex]?.[selectedIndex];
      const sourceBlock = ((doc as any).sourceBlocks || []).find((block: any) => Number(block?.page_number || block?.pageNumber) === Number(table.pageNumber || tableIndex + 1));
      const base: Observation = {
        text: row.join(' | '), sourceText: row.join(' | '),
        sourceBlockId: sourceBlock?.source_block_id || sourceBlock?.sourceBlockId,
        sourceSha256: cellEvidence?.coordinate?.sourceSha256 || sourceBlock?.source_sha256 || doc.source?.hash,
        sourceArtifactId: cellEvidence?.coordinate?.sourceArtifactId || sourceBlock?.source_artifact_id || doc.source?.sourceArtifactId,
        sourceProvenanceId: cellEvidence?.provenanceId,
        sourceCoordinate: cellEvidence?.coordinate,
        pageNumber: Number(table.pageNumber || tableIndex + 1), confidence: 0.99,
      };
      const fieldForCell = <T>(index: number, value: T): RawFieldEvidence<T> => {
        const cell = table.rowEvidence?.[rowIndex]?.[index];
        return evidence(base, value, row[index], {
          sourceSha256: cell?.coordinate?.sourceSha256 || base.sourceSha256,
          sourceArtifactId: cell?.coordinate?.sourceArtifactId || base.sourceArtifactId,
          sourceProvenanceId: cell?.provenanceId,
          sourceCoordinate: cell?.coordinate,
        });
      };
      const currencyMatch = currencyIndex >= 0 ? row[currencyIndex]?.match(ISO_CURRENCY_PATTERN) : undefined;
      const description = descriptionIndex >= 0 && row[descriptionIndex] ? fieldForCell(descriptionIndex, row[descriptionIndex]) : undefined;
      const partial = {
        transactionId: `${tableIndex + 1}-${rowIndex + 1}`,
        documentKind: kind,
        amount: fieldForCell(selectedIndex, amount),
        transactionDate: fieldForCell(dateIndex, dateMatch[1]),
        currency: currencyMatch ? fieldForCell(currencyIndex, currencyMatch[1].toUpperCase()) : undefined,
        counterparty: description,
        description,
        lineItems: [],
      };
      const reasons = requiredEvidenceReasons(partial);
      results.push({
        ...partial,
        evidenceState: reasons.length ? 'PARTIAL' : 'COMPLETE',
        canonicalizationState: reasons.length ? 'BLOCKED_EVIDENCE_INCOMPLETE' : 'READY_FOR_CLASSIFICATION',
        clarificationReasons: reasons,
      });
    }
  }
  return results;
}

export function extractRawInputTransactions(params: {
  doc: CanonicalDocumentModel;
  workspaceId: string;
  documentId: string;
  filename: string;
  currency?: string;
}): RawTransactionExtractionResult {
  const rows = observations(params.doc);
  const fullText = rows.map(row => row.text).join('\n');
  const classification = detectKind(params.filename, fullText, params.doc.tables || []);
  if (classification.kind === 'UNKNOWN') {
    return { recognized: false, documentKind: 'UNKNOWN', transactions: [], facts: [], evidenceCompleteCount: 0, needsClarificationCount: 0, requiresClarification: false, clarificationReasons: [], classifierSignals: classification.signals };
  }

  const kind = classification.kind as Exclude<RawDocumentKind, 'UNKNOWN'>;
  let transactions = transactionsFromTables(params.doc, kind, params.documentId);
  if (!transactions.length && ['AP_INVOICE', 'AR_INVOICE', 'INVOICE'].includes(kind)) {
    const invoiceConsensus = invoiceConsensusFromDocument(params.doc);
    const consensusTransaction = invoiceConsensus
      ? transactionFromInvoiceConsensus(invoiceConsensus, rows, kind as 'AP_INVOICE' | 'AR_INVOICE' | 'INVOICE')
      : null;
    if (consensusTransaction) transactions = [consensusTransaction];
  }
  if (!transactions.length) {
    const amount = findMatch(rows, [
      /\b(?:grand\s+total|total\s+due|amount\s+due|amount\s+paid|net\s+pay|net\s+sales|net\s+(?:settlement|payout)|payment\s+amount|asset\s+cost|total\s+value|total)\s*[:#-]?\s*((?:[A-Z]{3}\s*)?[$€£¥]?\s*\(?-?[\d,]+(?:\.\d{2})?\)?)/i,
    ], match => parseMoney(match[1]));
    if (amount) {
      // A workspace functional currency is accounting context, not source
      // evidence. Only an ISO code physically present in this document can
      // complete the raw transaction's currency field.
      const currency = findMatch(rows, [ISO_CURRENCY_PATTERN], match => match[1].toUpperCase());
      const transactionDate = findMatch(rows, [
        /\b(?:invoice\s+date|transaction\s+date|receipt\s+date|pay\s+date|settlement\s+date|date)\s*[:#-]?\s*(\d{4}[\/-]\d{1,2}[\/-]\d{1,2}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|[A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4})\b/i,
        DATE_PATTERN,
      ], match => clean(match[1]));
      const counterparty = findCounterparty(rows, kind);
      const documentNumber = findMatch(rows, [
        /\b(?:invoice|receipt|document|reference|payout|loan|asset)\s*(?:number|no\.?|#|id)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{2,})\b/i,
      ], match => clean(match[1]).toUpperCase());
      const subtotal = findMatch(rows, [/\bsubtotal\s*[:#-]?\s*((?:[A-Z]{3}\s*)?[$€£¥]?\s*\(?-?[\d,]+(?:\.\d{2})?\)?)/i], match => parseMoney(match[1]));
      const tax = findMatch(rows, [/\b(?:sales\s+tax|vat|gst|tax)\s*[:#-]?\s*((?:[A-Z]{3}\s*)?[$€£¥]?\s*\(?-?[\d,]+(?:\.\d{2})?\)?)/i], match => parseMoney(match[1]));
      const paymentMethod = findMatch(rows, [/\b(?:payment\s+method|paid\s+by|tender)\s*[:#-]?\s*(cash|visa|mastercard|amex|card|check|cheque|bank transfer|ach|wire)\b/i], match => clean(match[1]).toUpperCase());
      // Classification may use a category only when the source explicitly
      // states it. Merchant names and item descriptions are not silently
      // converted into ledger accounts.
      const accountingCategory = findMatch(rows, [
        /\b(?:accounting|expense|bookkeeping)\s+category\s*[:#-]?\s*([A-Z][A-Z &/-]{2,80})$/i,
      ], match => clean(match[1]).toUpperCase());
      const description = findDescription(rows, kind);
      const partial = {
        transactionId: '1', documentKind: kind, amount, transactionDate, currency, counterparty,
        documentNumber, subtotal, tax, paymentMethod, accountingCategory, description, lineItems: extractLineItems(rows),
      };
      const reasons = requiredEvidenceReasons(partial);
      if (kind === 'INVOICE') reasons.push('INVOICE_AP_AR_DIRECTION_REQUIRES_TENANT_CONTEXT');
      transactions = [{
        ...partial,
        evidenceState: reasons.filter(reason => reason !== 'INVOICE_AP_AR_DIRECTION_REQUIRES_TENANT_CONTEXT').length ? 'PARTIAL' : 'COMPLETE',
        canonicalizationState: reasons.filter(reason => reason !== 'INVOICE_AP_AR_DIRECTION_REQUIRES_TENANT_CONTEXT').length ? 'BLOCKED_EVIDENCE_INCOMPLETE' : 'READY_FOR_CLASSIFICATION',
        clarificationReasons: reasons,
      }];
    }
  }

  const topLevelReasons = transactions.length
    ? [...new Set(transactions.flatMap(transaction => transaction.clarificationReasons))]
    : ['TRANSACTION_AMOUNT_NOT_SUPPORTED_BY_SOURCE'];
  const facts = transactions.map(transaction => factFromTransaction(transaction, params));
  const evidenceCompleteCount = transactions.filter(transaction => transaction.evidenceState === 'COMPLETE').length;
  return {
    recognized: true,
    documentKind: kind,
    transactions,
    facts,
    evidenceCompleteCount,
    needsClarificationCount: transactions.length - evidenceCompleteCount + (transactions.length ? 0 : 1),
    requiresClarification: transactions.length === 0 || topLevelReasons.length > 0,
    clarificationReasons: topLevelReasons,
    classifierSignals: classification.signals,
  };
}
