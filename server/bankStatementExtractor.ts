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

function extractFromTables(doc: CanonicalDocumentModel): Array<{ date: string; description: string; amount: number; balance?: number; source: string; page: number }> {
  const rows: Array<{ date: string; description: string; amount: number; balance?: number; source: string; page: number }> = [];
  const tables = doc.tables || [];

  tables.forEach((table) => {
    const header = (table.headers || []).map((h) => String(h).toLowerCase());
    const dateIdx = header.findIndex((h) => h.includes("date") || h.includes("posted"));
    const descIdx = header.findIndex((h) => h.includes("desc") || h.includes("memo") || h.includes("payee") || h.includes("particular"));
    const amountIdx = header.findIndex((h) => h.includes("amount") || h.includes("debit") || h.includes("credit"));
    const balanceIdx = header.findIndex((h) => h.includes("balance") || h.includes("running"));
    const debitIdx = header.findIndex((h) => h.includes("debit") || h.includes("withdrawal"));
    const creditIdx = header.findIndex((h) => h.includes("credit") || h.includes("deposit"));

    (table.rows || []).forEach((row) => {
      const cells = (row || []).map((c) => String(c ?? "").trim());
      if (!rowLooksLikeTransaction(cells) && dateIdx < 0) return;

      const dateCell = dateIdx >= 0 ? cells[dateIdx] : cells.find((c) => DATE_RE.test(c)) || "";
      const dateMatch = dateCell.match(DATE_RE);
      if (!dateMatch) return;

      const description =
        descIdx >= 0
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

      const balance = balanceIdx >= 0 ? parseMoney(cells[balanceIdx]) ?? undefined : undefined;
      const source = cells.join(" | ");
      const amountToken = Number.isInteger(amount) ? String(Math.abs(amount)) : Math.abs(amount).toFixed(2);
      if (!amountAppearsInSourceBlock(amountToken, source) && !amountAppearsInSourceBlock(String(amount), source)) {
        return;
      }

      rows.push({
        date: dateMatch[1],
        description: description || "Transaction",
        amount,
        balance,
        source,
        page: table.pageNumber || 1
      });
    });
  });

  return rows;
}

function extractFromTextLines(doc: CanonicalDocumentModel): Array<{ date: string; description: string; amount: number; balance?: number; source: string; page: number }> {
  const rows: Array<{ date: string; description: string; amount: number; balance?: number; source: string; page: number }> = [];
  const lines = `${doc.markdown || ""}\n${(doc.sections || []).map((s) => s.text).join("\n")}`.split(/\n/);

  lines.forEach((line, idx) => {
    const dateMatch = line.match(DATE_RE);
    if (!dateMatch) return;
    const amounts = line.match(new RegExp(AMOUNT_RE.source, "g")) || [];
    if (amounts.length === 0) return;
    const parsedAmounts = amounts.map(parseMoney).filter((v): v is number => v != null);
    if (parsedAmounts.length === 0) return;

    const amount = parsedAmounts[0];
    const balance = parsedAmounts.length > 1 ? parsedAmounts[parsedAmounts.length - 1] : undefined;
    const description = line.replace(DATE_RE, "").replace(AMOUNT_RE, "").replace(/\s+/g, " ").trim() || "Transaction";

    if (!amountAppearsInSourceBlock(amounts[0], line)) return;

    rows.push({
      date: dateMatch[1],
      description,
      amount,
      balance,
      source: line.trim(),
      page: 1
    });
  });

  return rows;
}

function parseSummaryAmount(text: string, regex: RegExp): number | null {
  const m = text.match(regex);
  if (!m || !m[1]) return null;
  return parseMoney(m[1]);
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
    return {
      success: false,
      transactions: [],
      facts: [],
      error: `Bank statement parse missed: no dated transactions with amounts found in ${filename}. Refusing fixture fallback.`
    };
  }

  const beginningBalance = parseSummaryAmount(
    text,
    /(?:beginning balance|starting balance|previous balance|opening balance)[\s:$]*(-?\$?[\d,]+\.\d{2})/i
  );
  const endingBalance = parseSummaryAmount(
    text,
    /(?:ending balance|new balance|closing balance)[\s:$]*(-?\$?[\d,]+\.\d{2})/i
  );

  const deposits = extractedRows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
  const withdrawals = extractedRows.filter((r) => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);
  const lastBalance = [...extractedRows].reverse().find((r) => r.balance != null)?.balance;
  const firstBalance = extractedRows.find((r) => r.balance != null)?.balance;

  const currency = params.currency || doc.metadata?.currency || "USD";
  const resolvedBegin = beginningBalance ?? (firstBalance != null && extractedRows[0] ? firstBalance - extractedRows[0].amount : null);
  const resolvedEnd = endingBalance ?? lastBalance ?? null;

  const transactions: BankTransaction[] = extractedRows.map((r, i) => ({
    id: `TXN-${documentId}-${i + 1}`,
    workspaceId,
    documentId,
    date: r.date,
    postingDate: r.date,
    description: r.description,
    rawDescription: r.source,
    amount: r.amount,
    transactionType: r.amount >= 0 ? "deposit" : "withdrawal",
    counterparty: r.description,
    category: "Extracted Bank Transaction",
    sourcePage: r.page,
    confidence: 0,
    reconciled: false
  }));

  const summary: BankAccountSummary = {
    bankName: "",
    accountHolder: doc.metadata?.entityName || "",
    accountType: "Unknown",
    maskedAccountNumber: "",
    periodStart: extractedRows[0]?.date || "",
    periodEnd: extractedRows[extractedRows.length - 1]?.date || "",
    currency,
    beginningBalance: resolvedBegin ?? 0,
    totalDeposits: deposits,
    totalWithdrawals: withdrawals,
    totalChecks: 0,
    totalFees: 0,
    endingBalance: resolvedEnd ?? 0,
    averageBalance: 0,
    depositCount: extractedRows.filter((r) => r.amount > 0).length,
    withdrawalCount: extractedRows.filter((r) => r.amount < 0).length,
    transactionCount: extractedRows.length,
    calculatedEndingBalance: resolvedBegin != null ? Math.round((resolvedBegin + deposits - withdrawals) * 100) / 100 : 0,
    reconciliationPassed: resolvedBegin != null && resolvedEnd != null
      ? Math.abs(resolvedBegin + deposits - withdrawals - resolvedEnd) < 0.05
      : false
  };

  const facts: ExtractedFact[] = [];
  const pushFact = (label: string, value: number | null, source: string, page: number, factType: string) => {
    if (value == null || !source) return;
    const token = Number.isInteger(value) ? String(Math.abs(value)) : Math.abs(value).toFixed(2);
    if (!amountAppearsInSourceBlock(token, source) && !amountAppearsInSourceBlock(String(value), source)) {
      return;
    }
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
      currencyOriginal: currency,
      functionalCurrency: currency,
      currency,
      unitScale: "Units",
      exchangeRate: "1.0000",
      pageNumber: page,
      sourceText: source,
      status: "pending_review",
      extractionMethod: "BANK_STATEMENT_NATIVE_PARSE"
    } as ExtractedFact);
  };

  if (beginningBalance != null) {
    const src = text.match(/(?:beginning balance|starting balance|previous balance|opening balance)[\s:$]*-?\$?[\d,]+\.\d{2}/i)?.[0] || "";
    pushFact("Beginning Balance", beginningBalance, src, 1, "cash");
  }
  if (endingBalance != null) {
    const src = text.match(/(?:ending balance|new balance|closing balance)[\s:$]*-?\$?[\d,]+\.\d{2}/i)?.[0] || "";
    pushFact("Ending Balance", endingBalance, src, 1, "cash");
  }

  return {
    success: true,
    summary,
    transactions,
    facts
  };
}
