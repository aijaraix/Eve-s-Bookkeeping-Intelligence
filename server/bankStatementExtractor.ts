import { CanonicalDocumentModel } from "../src/lib/parser/types.js";
import { BankTransaction, BankAccountSummary, ExtractedFact } from "../src/types.js";
import { amountAppearsInSourceBlock } from "./failClosedGuards.js";

export interface BankExtractionResult {
  success: boolean;
  summary?: BankAccountSummary;
  transactions: BankTransaction[];
  facts: ExtractedFact[];
  error?: string;
}

const DATE_RE = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|[A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4})\b/;
const AMOUNT_RE = /\(?-?\$?-?\d{1,3}(?:,\d{3})*(?:\.\d{2})\)?|\(?-?\d+(?:\.\d{2})\)?/;
const SUMMARY_BEGIN_RE = /(?:beginning balance|starting balance|previous balance|opening balance)[\s:$]*(-?\$?[\d,]+\.\d{2})/i;
const SUMMARY_END_RE = /(?:ending balance|new balance|closing balance)[\s:$]*(-?\$?[\d,]+\.\d{2})/i;

interface ExtractedBankRow {
  date: string;
  description: string;
  amount: number;
  balance?: number;
  source: string;
  page: number;
  sourceBlockId?: string;
  sourceSha256?: string;
  sourceArtifactId?: string;
  sourceProvenanceId?: string;
  sourceCoordinate?: any;
}

function parseMoney(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const negative = /^\(.*\)$/.test(trimmed) || trimmed.includes("-");
  const cleaned = trimmed.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const val = parseFloat(cleaned);
  if (Number.isNaN(val)) return null;
  return negative && val > 0 ? -val : val;
}

function rowLooksLikeTransaction(cells: string[]): boolean {
  const joined = cells.join(" ");
  if (!DATE_RE.test(joined)) return false;
  const amounts = cells.map(parseMoney).filter((v): v is number => v != null);
  return amounts.length >= 1;
}

function extractFromTables(doc: CanonicalDocumentModel): ExtractedBankRow[] {
  const rows: ExtractedBankRow[] = [];
  const tables = doc.tables || [];
  tables.forEach((table) => {
    const header = (table.headers || []).map((h) => String(h).toLowerCase());
    const dateIdx = header.findIndex((h) => h.includes("date") || h.includes("posted"));
    const descIdx = header.findIndex((h) => h.includes("desc") || h.includes("memo") || h.includes("payee") || h.includes("particular"));
    const amountIdx = header.findIndex((h) => h.includes("amount") || h.includes("debit") || h.includes("credit"));
    const balanceIdx = header.findIndex((h) => h.includes("balance") || h.includes("running"));
    const debitIdx = header.findIndex((h) => h.includes("debit") || h.includes("withdrawal"));
    const creditIdx = header.findIndex((h) => h.includes("credit") || h.includes("deposit"));
    (table.rows || []).forEach((row, rowIndex) => {
      const cells = (row || []).map((c) => String(c ?? "").trim());
      if (!rowLooksLikeTransaction(cells) && dateIdx < 0) return;
      const dateCell = dateIdx >= 0 ? cells[dateIdx] : cells.find((c) => DATE_RE.test(c)) || "";
      const dateMatch = dateCell.match(DATE_RE);
      if (!dateMatch) return;
      const description = descIdx >= 0
        ? cells[descIdx]
        : cells.find((c, i) => i !== dateIdx && /[A-Za-z]{3,}/.test(c) && parseMoney(c) == null) || cells.slice(1, 3).join(" ");
      let amount: number | null = null;
      if (debitIdx >= 0 || creditIdx >= 0) {
        const debit = debitIdx >= 0 ? parseMoney(cells[debitIdx]) : null;
        const credit = creditIdx >= 0 ? parseMoney(cells[creditIdx]) : null;
        if (debit != null && debit !== 0) amount = -Math.abs(debit);
        else if (credit != null && credit !== 0) amount = Math.abs(credit);
      }
      if (amount == null && amountIdx >= 0) amount = parseMoney(cells[amountIdx]);
      if (amount == null) {
        const moneyCells = cells.map(parseMoney).filter((v): v is number => v != null);
        amount = moneyCells.length > 0 ? moneyCells[0] : null;
      }
      if (amount == null) return;
      let amountEvidenceIndex = amountIdx;
      if (debitIdx >= 0 && parseMoney(cells[debitIdx]) != null && parseMoney(cells[debitIdx]) !== 0) amountEvidenceIndex = debitIdx;
      else if (creditIdx >= 0 && parseMoney(cells[creditIdx]) != null && parseMoney(cells[creditIdx]) !== 0) amountEvidenceIndex = creditIdx;
      const balance = balanceIdx >= 0 ? parseMoney(cells[balanceIdx]) ?? undefined : undefined;
      const source = cells.join(" | ");
      const amountToken = Number.isInteger(amount) ? String(Math.abs(amount)) : Math.abs(amount).toFixed(2);
      if (!amountAppearsInSourceBlock(amountToken, source) && !amountAppearsInSourceBlock(String(amount), source)) return;
      const cellEvidence = amountEvidenceIndex >= 0 ? table.rowEvidence?.[rowIndex]?.[amountEvidenceIndex] : undefined;
      const sourceBlock = ((doc as any).sourceBlocks || []).find((block: any) =>
        Number(block?.page_number || block?.pageNumber || 1) === Number(table.pageNumber || 1)
      );
      rows.push({
        date: dateMatch[1], description: description || "Transaction", amount, balance, source, page: table.pageNumber || 1,
        sourceBlockId: sourceBlock?.source_block_id || sourceBlock?.sourceBlockId,
        sourceSha256: cellEvidence?.coordinate?.sourceSha256 || sourceBlock?.source_sha256 || sourceBlock?.sourceSha256 || doc.source?.hash,
        sourceArtifactId: cellEvidence?.coordinate?.sourceArtifactId || sourceBlock?.source_artifact_id || sourceBlock?.sourceArtifactId || doc.source?.sourceArtifactId,
        sourceProvenanceId: cellEvidence?.provenanceId || sourceBlock?.source_provenance_id || sourceBlock?.sourceProvenanceId,
        sourceCoordinate: cellEvidence?.coordinate || sourceBlock?.source_coordinate || sourceBlock?.sourceCoordinate,
      });
    });
  });
  return rows;
}

function extractFromTextLines(doc: CanonicalDocumentModel): ExtractedBankRow[] {
  const rows: ExtractedBankRow[] = [];
  const pages = Array.isArray(doc.pages) && doc.pages.length
    ? doc.pages.map(p => ({ page: Number(p.page_number) || 1, text: String(p.text || '') }))
    : [{ page: 1, text: `${doc?.markdown || ""}\n${(doc?.sections || []).map((s) => s?.text || "").join("\n")}` }];
  for (const page of pages) {
    for (const rawLine of page.text.split(/\n/)) {
      const line = rawLine.trim();
      const dateMatch = line.match(DATE_RE);
      if (!dateMatch || /statement\s+period/i.test(line)) continue;
      // Critical: remove the date before scanning monetary tokens. Otherwise a date
      // fragment such as "09" can become the transaction amount.
      const withoutDate = line.replace(dateMatch[0], ' ').trim();
      const amounts = withoutDate.match(new RegExp(AMOUNT_RE.source, "g")) || [];
      const parsedAmounts = amounts.map(parseMoney).filter((v): v is number => v != null);
      if (!parsedAmounts.length) continue;
      const amount = parsedAmounts[0];
      const balance = parsedAmounts.length > 1 ? parsedAmounts[parsedAmounts.length - 1] : undefined;
      const description = withoutDate.replace(new RegExp(AMOUNT_RE.source, "g"), " ").replace(/\s+/g, " ").trim() || "Transaction";
      if (!amountAppearsInSourceBlock(amounts[0], line)) continue;
      const sourceBlock = ((doc as any).sourceBlocks || []).find((block: any) => {
        const blockPage = Number(block?.page_number || block?.pageNumber || 1);
        const blockText = String(block?.raw_text || block?.text_content || '');
        return blockPage === page.page && blockText.includes(line);
      });
      rows.push({
        date: dateMatch[1], description, amount, balance, source: line, page: page.page,
        sourceBlockId: sourceBlock?.source_block_id || sourceBlock?.sourceBlockId,
        sourceSha256: sourceBlock?.source_sha256 || sourceBlock?.sourceSha256 || doc.source?.hash,
        sourceArtifactId: sourceBlock?.source_artifact_id || sourceBlock?.sourceArtifactId || doc.source?.sourceArtifactId,
        sourceProvenanceId: sourceBlock?.source_provenance_id || sourceBlock?.sourceProvenanceId,
        sourceCoordinate: sourceBlock?.source_coordinate || sourceBlock?.sourceCoordinate,
      });
    }
  }
  return rows;
}

function findSummaryEvidence(doc: CanonicalDocumentModel, regex: RegExp): { value: number; source: string; page: number } | null {
  const pages = Array.isArray(doc.pages) && doc.pages.length
    ? doc.pages.map(p => ({ page: Number(p.page_number) || 1, text: String(p.text || '') }))
    : [{ page: 1, text: String(doc.markdown || doc.raw_text || '') }];
  for (const page of pages) {
    const match = page.text.match(regex);
    const value = parseMoney(match?.[1]);
    if (match && value != null) return { value, source: match[0], page: page.page };
  }
  return null;
}

function detectExplicitCurrency(text: string): string | undefined {
  const match = text.match(/\b(?:CURRENCY|ACCOUNT\s+CURRENCY)\s*[:\-]?\s*(USD|EUR|GBP|JPY|CHF|CAD|AUD|NZD|SEK|NOK|DKK)\b/i);
  return match?.[1]?.toUpperCase();
}

export function extractBankStatementFromDocument(params: {
  doc: CanonicalDocumentModel;
  workspaceId: string;
  documentId: string;
  filename: string;
  currency?: string;
}): BankExtractionResult {
  const { doc, workspaceId, documentId, filename } = params;
  const text = `${doc.markdown || ""} ${(doc.sections || []).map((s) => s.text).join(" ")}`;
  const tableRows = extractFromTables(doc);
  const textRows = tableRows.length > 0 ? [] : extractFromTextLines(doc);
  const extractedRows = tableRows.length > 0 ? tableRows : textRows;
  if (extractedRows.length === 0) {
    return { success: false, transactions: [], facts: [], error: `Bank statement parse missed: no dated transactions with amounts found in ${filename}. Refusing fixture fallback.` };
  }

  const beginningEvidence = findSummaryEvidence(doc, SUMMARY_BEGIN_RE);
  const endingEvidence = findSummaryEvidence(doc, SUMMARY_END_RE);
  const beginningBalance = beginningEvidence?.value ?? null;
  const endingBalance = endingEvidence?.value ?? null;
  const deposits = extractedRows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
  const withdrawals = extractedRows.filter((r) => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);
  const lastBalance = [...extractedRows].reverse().find((r) => r.balance != null)?.balance;
  const firstBalance = extractedRows.find((r) => r.balance != null)?.balance;
  const explicitCurrency = params.currency || doc.metadata?.currency || detectExplicitCurrency(text);
  const resolvedBegin = beginningBalance ?? (firstBalance != null && extractedRows[0] ? firstBalance - extractedRows[0].amount : null);
  const resolvedEnd = endingBalance ?? lastBalance ?? null;
  const calculatedEnd = resolvedBegin != null ? Math.round((resolvedBegin + deposits - withdrawals) * 100) / 100 : undefined;

  const transactions: BankTransaction[] = extractedRows.map((r, i) => ({
    id: `TXN-${documentId}-${i + 1}`,
    workspaceId,
    documentId,
    date: r.date,
    postingDate: r.date,
    description: r.description,
    rawDescription: r.source,
    sourceBlock: r.source,
    amount: r.amount,
    balance: r.balance,
    currency: explicitCurrency,
    transactionType: r.amount >= 0 ? "deposit" : "withdrawal",
    counterparty: r.description,
    category: "Extracted Bank Transaction",
    sourcePage: r.page,
    page: r.page,
    reconciled: false
  }));

  const summary: BankAccountSummary = {
    bankName: "",
    accountHolder: doc.metadata?.entityName || "",
    accountType: "Unknown",
    maskedAccountNumber: "",
    periodStart: extractedRows[0]?.date || "",
    periodEnd: extractedRows[extractedRows.length - 1]?.date || "",
    currency: explicitCurrency,
    beginningBalance: resolvedBegin ?? undefined,
    totalDeposits: deposits,
    totalWithdrawals: withdrawals,
    totalChecks: 0,
    totalFees: 0,
    endingBalance: resolvedEnd ?? undefined,
    averageBalance: undefined,
    depositCount: extractedRows.filter((r) => r.amount > 0).length,
    withdrawalCount: extractedRows.filter((r) => r.amount < 0).length,
    transactionCount: extractedRows.length,
    calculatedEndingBalance: calculatedEnd,
    reconciliationPassed: resolvedBegin != null && resolvedEnd != null && calculatedEnd != null
      ? Math.abs(calculatedEnd - resolvedEnd) < 0.05
      : false
  };

  const facts: ExtractedFact[] = [];
  extractedRows.forEach((row, index) => {
    const evidenceComplete = Boolean(row.sourceSha256 && row.sourceCoordinate && explicitCurrency);
    const clarificationReasons = [
      ...(!row.sourceSha256 || !row.sourceCoordinate ? ['AMOUNT_SOURCE_COORDINATE_REQUIRED'] : []),
      ...(!explicitCurrency ? ['CURRENCY_MISSING_OR_AMBIGUOUS'] : []),
    ];
    facts.push({
      id: `FCT-BANK-${documentId}-transaction-${index + 1}`,
      workspaceId,
      documentId,
      sourceDocument: filename,
      factType: 'transaction',
      canonicalMetric: 'raw_input_transaction_total',
      labelOriginal: row.description,
      labelNormalized: 'Bank Transaction',
      valueOriginal: String(row.amount),
      valueFunctional: String(row.amount),
      normalizedValue: row.amount,
      currencyOriginal: explicitCurrency,
      functionalCurrency: explicitCurrency,
      currency: explicitCurrency,
      unitScale: 'Units',
      exchangeRate: explicitCurrency ? '1.0000' : undefined,
      reportingPeriod: row.date,
      periodStart: row.date,
      periodEnd: row.date,
      statementType: 'RAW_INPUT_TRANSACTION',
      accountingRole: 'TRANSACTION_CANDIDATE',
      pageNumber: row.page,
      sourceText: row.source,
      sourceBlockId: row.sourceBlockId,
      sourceBlockIds: row.sourceBlockId ? [row.sourceBlockId] : [],
      sourceSha256: row.sourceSha256,
      sourceArtifactId: row.sourceArtifactId,
      sourceProvenanceId: row.sourceProvenanceId,
      sourceProvenanceIds: row.sourceProvenanceId ? [row.sourceProvenanceId] : [],
      sourceCoordinate: row.sourceCoordinate,
      sourceCoordinates: row.sourceCoordinate ? [row.sourceCoordinate] : [],
      provenanceCoordinates: row.sourceCoordinate ? [row.sourceCoordinate] : [],
      evidenceStatus: evidenceComplete ? 'CONFIRMED' : 'PARTIAL',
      verificationStatus: evidenceComplete ? 'EVIDENCE_CONFIRMED' : 'REVIEW_REQUIRED',
      status: evidenceComplete ? 'approved' : 'pending_review',
      extractionEngine: 'BANK_STATEMENT_PARSER',
      extractionMethod: 'BANK_TRANSACTION_NATIVE_PARSE',
      canonicalizationState: evidenceComplete ? 'READY_FOR_CLASSIFICATION' : 'BLOCKED_EVIDENCE_INCOMPLETE',
      postingStatus: 'NOT_POSTED',
      clarificationReasons,
      rawTransaction: {
        transactionId: transactions[index]?.id,
        documentKind: 'BANK_STATEMENT',
        date: row.date,
        description: row.description,
        amount: row.amount,
        balance: row.balance,
        currency: explicitCurrency,
        reconciliationApplicable: true,
        reconciliationPassed: summary.reconciliationPassed,
      },
    } as ExtractedFact);
  });
  const pushFact = (label: string, value: number | null, source: string, page: number, factType: string) => {
    if (value == null || !source) return;
    const token = Number.isInteger(value) ? String(Math.abs(value)) : Math.abs(value).toFixed(2);
    if (!amountAppearsInSourceBlock(token, source) && !amountAppearsInSourceBlock(String(value), source)) return;
    facts.push({
      id: `FCT-BANK-${documentId}-${factType}`,
      workspaceId,
      documentId,
      factType,
      extractionEngine: "BANK_STATEMENT_PARSER",
      labelOriginal: label,
      labelNormalized: label,
      canonicalMetric: factType,
      statementType: "BANK_STATEMENT" as any,
      valueOriginal: String(value),
      valueFunctional: String(value),
      normalizedValue: value,
      currencyOriginal: explicitCurrency,
      functionalCurrency: explicitCurrency,
      currency: explicitCurrency,
      unitScale: "Units",
      exchangeRate: explicitCurrency ? "1.0000" : undefined,
      pageNumber: page,
      sourceText: source,
      status: "pending_review",
      extractionMethod: "BANK_STATEMENT_NATIVE_PARSE"
    } as ExtractedFact);
  };
  if (beginningEvidence) pushFact("Beginning Balance", beginningBalance, beginningEvidence.source, beginningEvidence.page, "bank_beginning_balance");
  if (endingEvidence) pushFact("Ending Balance", endingBalance, endingEvidence.source, endingEvidence.page, "bank_ending_balance");
  return { success: true, summary, transactions, facts };
}
