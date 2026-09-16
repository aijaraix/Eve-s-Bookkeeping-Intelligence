from pathlib import Path
import re


def write(path: str, content: str) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content)


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'MISSING_SNIPPET:{path}:{old[:140]!r}')
    p.write_text(text.replace(old, new, 1))


# -----------------------------------------------------------------------------
# Truth-safe bank statement extraction. Preserve physical page provenance,
# never parse date fragments as monetary amounts, never invent USD, and never
# turn missing balances into zero.
# -----------------------------------------------------------------------------
write('server/bankStatementExtractor.ts', r'''import { CanonicalDocumentModel } from "../src/lib/parser/types.js";
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
      const balance = balanceIdx >= 0 ? parseMoney(cells[balanceIdx]) ?? undefined : undefined;
      const source = cells.join(" | ");
      const amountToken = Number.isInteger(amount) ? String(Math.abs(amount)) : Math.abs(amount).toFixed(2);
      if (!amountAppearsInSourceBlock(amountToken, source) && !amountAppearsInSourceBlock(String(amount), source)) return;
      rows.push({ date: dateMatch[1], description: description || "Transaction", amount, balance, source, page: table.pageNumber || 1 });
    });
  });
  return rows;
}

function extractFromTextLines(doc: CanonicalDocumentModel): Array<{ date: string; description: string; amount: number; balance?: number; source: string; page: number }> {
  const rows: Array<{ date: string; description: string; amount: number; balance?: number; source: string; page: number }> = [];
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
      rows.push({ date: dateMatch[1], description, amount, balance, source: line, page: page.page });
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
''')

write('server/cpaOrganization/bankStatementCompletenessAdapter.ts', r'''import type { CanonicalDocumentModel } from '../../src/lib/parser/types.js';
import type { BankExtractionResult } from '../bankStatementExtractor.js';
import {
  TaskEvidenceSufficiencyEngine,
  type SourceEvidenceGap,
  type TaskEvidenceSufficiencyDecision,
} from './taskEvidenceSufficiencyEngine.js';

export type BankPageRole = 'SUMMARY' | 'TRANSACTIONS' | 'DISCLOSURE' | 'OTHER';
export interface BankPageObservation {
  physicalPageNumber: number;
  logicalPageNumber: number;
  declaredPageCount?: number;
  role: BankPageRole;
  hasTransactions: boolean;
  endOfTransactionActivity: boolean;
  evidenceRef: string;
}
export interface BankStatementCompletenessAssessment {
  sourceSha256?: string;
  documentId: string;
  filename: string;
  physicalPageCount: number;
  expectedLogicalPageCount: number;
  observedLogicalPages: number[];
  missingLogicalPages: number[];
  pageInventory: BankPageObservation[];
  summary: {
    currency?: string;
    beginningBalance?: number;
    endingBalance?: number;
    totalDeposits: number;
    totalWithdrawals: number;
    calculatedEndingBalance?: number;
    variance?: number;
    reconciliationStatus: 'PASS' | 'FAIL' | 'NOT_RUN';
    transactionCount: number;
  };
  gaps: SourceEvidenceGap[];
  endingBalanceDecision: TaskEvidenceSufficiencyDecision;
  transactionPopulationDecision: TaskEvidenceSufficiencyDecision;
  clarificationRecommended: boolean;
  evidenceRefs: string[];
}

const DATE_RE = /\b(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})\b/;
const MONEY_RE = /-?\$?\d[\d,]*\.\d{2}/;
function uniq<T>(values: T[]): T[] { return [...new Set(values)]; }
function marker(text: string): { logical: number; total: number } | null {
  const m = text.match(/\bPAGE\s+(\d+)\s+(?:OF|\/)\s*(\d+)\b/i);
  if (!m) return null;
  const logical = Number(m[1]), total = Number(m[2]);
  return Number.isInteger(logical) && logical > 0 && Number.isInteger(total) && total >= logical ? { logical, total } : null;
}
function hasTransactionLine(text: string): boolean {
  return text.split(/\n/).some(line => !/statement\s+period/i.test(line) && DATE_RE.test(line) && MONEY_RE.test(line));
}
function roleFor(text: string, hasTransactions: boolean): BankPageRole {
  if (hasTransactions || /TRANSACTION\s+ACTIVITY/i.test(text)) return 'TRANSACTIONS';
  if (/(?:TERMS|DISCLOSURES?|PRIVACY|FEE\s+SCHEDULE)/i.test(text)) return 'DISCLOSURE';
  if (/(?:BEGINNING|OPENING|ENDING|CLOSING)\s+BALANCE|BANK\s+STATEMENT|STATEMENT\s+PERIOD/i.test(text)) return 'SUMMARY';
  return 'OTHER';
}

export function assessBankStatementCompleteness(params: {
  doc: CanonicalDocumentModel;
  extraction: BankExtractionResult;
  workspaceId: string;
  engagementId: string;
  documentId: string;
  filename: string;
  sufficiencyStorageDir?: string;
}): BankStatementCompletenessAssessment {
  const pages = Array.isArray(params.doc.pages) && params.doc.pages.length ? params.doc.pages : [{ page_number: 1, text: params.doc.markdown || params.doc.raw_text || '' }];
  const observations: BankPageObservation[] = pages.map((page, index) => {
    const text = String(page.text || '');
    const declared = marker(text);
    const hasTransactions = hasTransactionLine(text);
    const physical = Number(page.page_number) || index + 1;
    const logical = declared?.logical || physical;
    return {
      physicalPageNumber: physical,
      logicalPageNumber: logical,
      declaredPageCount: declared?.total,
      role: roleFor(text, hasTransactions),
      hasTransactions,
      endOfTransactionActivity: /END\s+OF\s+TRANSACTION\s+ACTIVITY/i.test(text),
      evidenceRef: `bank-page:${params.documentId}:logical-${logical}:physical-${physical}`,
    };
  });
  const declaredCounts = observations.map(p => p.declaredPageCount).filter((v): v is number => Number.isFinite(v));
  const expected = declaredCounts.length ? Math.max(...declaredCounts) : Math.max(observations.length, ...observations.map(p => p.logicalPageNumber));
  const observed = uniq(observations.map(p => p.logicalPageNumber)).sort((a,b)=>a-b);
  const missing = Array.from({ length: expected }, (_, i) => i + 1).filter(p => !observed.includes(p));
  const endTransactionPage = Math.max(0, ...observations.filter(p => p.endOfTransactionActivity).map(p => p.logicalPageNumber));
  const laterTransactionPages = observations.filter(p => p.hasTransactions).map(p => p.logicalPageNumber);
  const s: any = params.extraction.summary || {};
  const beginning = typeof s.beginningBalance === 'number' ? s.beginningBalance : undefined;
  const ending = typeof s.endingBalance === 'number' ? s.endingBalance : undefined;
  const deposits = Number(s.totalDeposits || 0);
  const withdrawals = Number(s.totalWithdrawals || 0);
  const calculated = typeof s.calculatedEndingBalance === 'number' ? s.calculatedEndingBalance : undefined;
  const reconciliationStatus: 'PASS' | 'FAIL' | 'NOT_RUN' = beginning == null || ending == null || calculated == null
    ? 'NOT_RUN'
    : s.reconciliationPassed === true ? 'PASS' : 'FAIL';
  const variance = calculated != null && ending != null ? Math.round((calculated - ending) * 100) / 100 : undefined;
  const sourceSha = params.doc.source?.hash ? String(params.doc.source.hash) : undefined;
  const inventoryRef = `bank-page-inventory:${params.documentId}:${observed.join('-')}-of-${expected}`;
  const reconciliationRef = `bank-reconciliation:${params.documentId}:${reconciliationStatus}${variance == null ? '' : `:${variance.toFixed(2)}`}`;
  const gaps: SourceEvidenceGap[] = missing.map(logicalPage => {
    if (endTransactionPage > 0 && logicalPage > endTransactionPage && reconciliationStatus === 'PASS') {
      return {
        gapId: `gap-bank-${params.documentId}-page-${logicalPage}`,
        sourceArtifactId: params.documentId,
        gapType: 'MISSING_PAGE',
        description: `Logical bank-statement page ${logicalPage} is missing after explicit end of transaction activity.`,
        location: `Logical page ${logicalPage}`,
        affectedCapabilities: ['DISCLOSURE_NARRATIVE'],
        explicitMateriality: 'NON_MATERIAL',
        materialityBasis: 'Transaction activity explicitly ended before the gap and observed balances reconcile for the current bank-balance/transaction purposes.',
        evidenceRefs: [inventoryRef, reconciliationRef, `bank-end-of-transactions:logical-${endTransactionPage}`],
        signals: { structuralRelevance: 'IRRELEVANT_TO_TASK', continuity: 'INTACT', reconciliation: 'PASS', adjacentContext: `Transaction activity ended on logical page ${endTransactionPage}.` },
      };
    }
    if (laterTransactionPages.some(p => p > logicalPage) || reconciliationStatus === 'FAIL') {
      return {
        gapId: `gap-bank-${params.documentId}-page-${logicalPage}`,
        sourceArtifactId: params.documentId,
        gapType: 'MISSING_TRANSACTION_RANGE',
        description: `Logical bank-statement page ${logicalPage} is missing within or before observed transaction activity.`,
        location: `Logical page ${logicalPage}`,
        affectedCapabilities: ['TRANSACTION_LEDGER'],
        explicitMateriality: 'MATERIAL',
        materialityBasis: 'The missing page interrupts the complete transaction population and/or the observed transaction population does not reconcile to the reported ending balance.',
        evidenceRefs: [inventoryRef, reconciliationRef],
        signals: { structuralRelevance: 'RELEVANT_TO_TASK', continuity: 'BROKEN', reconciliation: reconciliationStatus === 'FAIL' ? 'FAIL' : 'UNKNOWN', structuralContext: `Later observed transaction pages: ${laterTransactionPages.filter(p => p > logicalPage).join(', ') || 'none'}` },
      };
    }
    return {
      gapId: `gap-bank-${params.documentId}-page-${logicalPage}`,
      sourceArtifactId: params.documentId,
      gapType: 'MISSING_PAGE',
      description: `Logical bank-statement page ${logicalPage} is missing and its role cannot be established from observed source structure.`,
      location: `Logical page ${logicalPage}`,
      affectedCapabilities: [],
      explicitMateriality: 'UNKNOWN',
      materialityBasis: 'Observed structure does not establish whether the missing page contains transactions, disclosures, or other task-relevant evidence.',
      evidenceRefs: [inventoryRef, reconciliationRef],
      signals: { structuralRelevance: 'UNKNOWN', continuity: 'UNKNOWN', reconciliation: reconciliationStatus === 'PASS' ? 'PASS' : reconciliationStatus === 'FAIL' ? 'FAIL' : 'NOT_RUN' },
    };
  });

  const engine = new TaskEvidenceSufficiencyEngine(params.sufficiencyStorageDir);
  const common = { workspaceId: params.workspaceId, engagementId: params.engagementId, period: 'BANK_STATEMENT_PERIOD', evidenceRefs: [inventoryRef, reconciliationRef, ...(sourceSha ? [`source:${sourceSha}`] : [])] };
  const endingBalanceDecision = engine.evaluate({ task: {
    ...common, taskId: `bank-ending-${params.documentId}`, taskType: 'BANK_BALANCE_VERIFICATION', purpose: 'Establish the explicit ending bank balance for the statement period.',
    availableCapabilities: [...(ending != null ? ['BANK_ENDING_BALANCE'] : []), ...(reconciliationStatus === 'PASS' ? ['BANK_RECONCILIATION'] : [])],
    conclusions: [{ conclusionId: 'ending-cash', label: 'Ending cash balance', requiredCapabilities: ['BANK_ENDING_BALANCE'], evidenceRefs: params.extraction.facts.filter((f:any)=>f.factType==='bank_ending_balance').map((f:any)=>f.id) }],
  }, gaps });
  const transactionPopulationDecision = engine.evaluate({ task: {
    ...common, taskId: `bank-transactions-${params.documentId}`, taskType: 'TRANSACTION_RECONSTRUCTION', purpose: 'Establish the complete bank transaction population for the statement period.',
    availableCapabilities: [...(params.extraction.transactions.length ? ['TRANSACTION_LEDGER'] : []), ...(reconciliationStatus === 'PASS' ? ['BANK_RECONCILIATION'] : [])],
    conclusions: [{ conclusionId: 'complete-transaction-population', label: 'Complete transaction population', requiredCapabilities: ['TRANSACTION_LEDGER'], requiresCompletePopulation: true, evidenceRefs: params.extraction.transactions.map((t:any)=>t.id).filter(Boolean) }],
  }, gaps });
  return {
    sourceSha256: sourceSha,
    documentId: params.documentId,
    filename: params.filename,
    physicalPageCount: observations.length,
    expectedLogicalPageCount: expected,
    observedLogicalPages: observed,
    missingLogicalPages: missing,
    pageInventory: observations,
    summary: {
      currency: s.currency,
      beginningBalance: beginning,
      endingBalance: ending,
      totalDeposits: deposits,
      totalWithdrawals: withdrawals,
      calculatedEndingBalance: calculated,
      variance,
      reconciliationStatus,
      transactionCount: params.extraction.transactions.length,
    },
    gaps,
    endingBalanceDecision,
    transactionPopulationDecision,
    clarificationRecommended: endingBalanceDecision.clarificationRecommended || transactionPopulationDecision.clarificationRecommended,
    evidenceRefs: uniq([inventoryRef, reconciliationRef, ...(sourceSha ? [`source:${sourceSha}`] : []), ...observations.map(p => p.evidenceRef), ...gaps.flatMap(g => g.evidenceRefs)]),
  };
}
''')

write('src/components/views/engagement/BankStatementCompletenessPanel.tsx', r'''import React from 'react';

const list = (value: any[]) => value?.length ? value.join(', ') : 'None';
const money = (value: any, currency?: string) => typeof value === 'number' ? `${currency || 'UNSPECIFIED'} ${value.toFixed(2)}` : 'Not recorded';

export const BankStatementCompletenessPanel: React.FC<{ review?: any }> = ({ review }) => {
  if (!review) return null;
  const s = review.summary || {};
  const endingState = review.endingBalanceDecision?.conclusionAssessments?.find((r:any)=>r.conclusionId==='ending-cash')?.state || 'NOT_RECORDED';
  const txnState = review.transactionPopulationDecision?.conclusionAssessments?.find((r:any)=>r.conclusionId==='complete-transaction-population')?.state || 'NOT_RECORDED';
  return <section className="border rounded-xl p-4 space-y-4" data-eve-bank-completeness="true" data-eve-bank-reconciliation={s.reconciliationStatus} data-eve-bank-ending-state={endingState} data-eve-bank-transaction-state={txnState}>
    <div><h2 className="font-semibold">Bank statement completeness review</h2><p className="text-sm">Source completeness and task sufficiency are evaluated separately. A missing page is never erased merely because one scoped conclusion may proceed.</p></div>
    <div className="grid md:grid-cols-2 gap-3 text-sm">
      <div className="border rounded-lg p-3"><strong>Page inventory</strong><p>Expected logical pages: {review.expectedLogicalPageCount}</p><p>Observed logical pages: {list(review.observedLogicalPages)}</p><p>Missing logical pages: {list(review.missingLogicalPages)}</p><p>Physical pages supplied: {review.physicalPageCount}</p></div>
      <div className="border rounded-lg p-3"><strong>Bank arithmetic</strong><p>Beginning balance: {money(s.beginningBalance,s.currency)}</p><p>Deposits: {money(s.totalDeposits,s.currency)}</p><p>Withdrawals: {money(s.totalWithdrawals,s.currency)}</p><p>Calculated ending: {money(s.calculatedEndingBalance,s.currency)}</p><p>Reported ending: {money(s.endingBalance,s.currency)}</p><p>Variance: {money(s.variance,s.currency)}</p><p>Reconciliation: {s.reconciliationStatus}</p></div>
    </div>
    <div className="border rounded-lg p-3 text-sm"><strong>Scoped conclusions</strong><p>Ending cash conclusion: {endingState}</p><p>Complete transaction population: {txnState}</p><p>Ending balance action: {review.endingBalanceDecision?.recommendedAction}</p><p>Transaction population action: {review.transactionPopulationDecision?.recommendedAction}</p><p>Clarification required: {review.clarificationRecommended ? 'YES' : 'NO'}</p></div>
    <div className="space-y-2 text-sm"><strong>Persisted source gaps</strong>{(review.gaps || []).length ? (review.gaps || []).map((gap:any)=><article key={gap.gapId} className="border rounded-lg p-3"><p>{gap.location} · {gap.gapType} · {gap.explicitMateriality || 'UNKNOWN'}</p><p>{gap.description}</p><p>Evidence: {(gap.evidenceRefs || []).join(', ') || 'Not recorded'}</p></article>) : <p>No known page gap was detected.</p>}</div>
    <p className="text-xs break-all">Source SHA-256: {review.sourceSha256 || 'Not recorded'}</p>
  </section>;
};
''')

replace_once('src/components/views/engagement/RecordedEngagementEvidenceView.tsx',
"import { InvoiceApReviewPanel } from './InvoiceApReviewPanel';",
"import { InvoiceApReviewPanel } from './InvoiceApReviewPanel';\nimport { BankStatementCompletenessPanel } from './BankStatementCompletenessPanel';")
replace_once('src/components/views/engagement/RecordedEngagementEvidenceView.tsx',
"      <InvoiceApReviewPanel invoices={Array.isArray(detail.apInvoices) ? detail.apInvoices : []} />",
"      <BankStatementCompletenessPanel review={detail.bankStatementCompleteness} />\n      <InvoiceApReviewPanel invoices={Array.isArray(detail.apInvoices) ? detail.apInvoices : []} />")

# -----------------------------------------------------------------------------
# Extend the existing real artifact renderer/service with bank completeness state.
# -----------------------------------------------------------------------------
p = Path('server/cpaOrganization/reviewPackageRendering.ts')
text = p.read_text()
start = text.index('export function buildReviewCsv(')
end = text.index('\nconst sha =', start)
text = text[:start] + r'''export function buildReviewCsv(facts: any[], currency: string, apReview?: any, bankReview?: any): string {
  const rows = [['Source Fact ID','Metric','Label','Value','Currency','Reporting Period','Statement','Document ID','Source Document','Extractor Locator','Verification','Evidence Status','Source Block IDs','Source SHA256','Source Provenance IDs','Source Coordinate','Extraction Method','Extraction Version','Confidence','Source Excerpt'],
    ...facts.map(f=>{const r=reviewRow(f);return [r.id,r.metric,r.label,r.value,currency,r.period,r.statement,r.documentId,r.sourceDoc,r.extractorPage,r.verificationStatus,r.evidenceStatus,r.sourceBlockIds.join(';'),r.sourceSha256,r.sourceProvenanceIds.join(';'),sourceCoordinateText(r),r.sourceExtractionMethod,r.sourceExtractionVersion,r.sourceConfidence,r.sourceText];})];
  const sections = [rows.map(row=>row.map(csvCell).join(',')).join('\r\n')];
  if (apReview) {
    const a=apReview;
    const apRows:any[][]=[[],['AP INVOICE REVIEW'],['Vendor',a.vendor?.value],['Invoice Number',a.invoiceNumber?.value],['Invoice Date',a.invoiceDate?.value],['Due Date',a.dueDate?.value],['Bill To',a.billTo?.value],['PO Reference On Invoice',a.purchaseOrderReference?.value],['Currency',a.currency?.value],['Subtotal',a.subtotal?.value],['Sales Tax',a.salesTax?.value],['Total Due',a.totalDue?.value],['Semantic Adjudication',a.semanticAdjudication?.status],['Raw OCR Label Evidence',(a.semanticAdjudication?.rawLabelTexts||[]).join(' | ')],['Arithmetic Reconciliation',a.reconciliation?.status],['Payable Candidate Status',a.apControl?.payableCandidateStatus],['Three-way Match',a.apControl?.threeWayMatchStatus],['Independent PO Verified',a.apControl?.independentPurchaseOrderVerified],['Receiving Evidence Verified',a.apControl?.receivingEvidenceVerified],['Approval',a.apControl?.approvalStatus],['Payment Eligibility',a.apControl?.paymentEligibility],['Payment Status',a.apControl?.paymentStatus],['Posting',a.apControl?.postingStatus],['Evidence Refs',(a.evidenceRefs||[]).join(';')],['Source SHA256',a.sourceSha256]];
    sections.push(apRows.map(row=>row.map(csvCell).join(',')).join('\r\n'));
  }
  if (bankReview) {
    const b=bankReview, s=b.summary||{};
    const ending=(b.endingBalanceDecision?.conclusionAssessments||[]).find((r:any)=>r.conclusionId==='ending-cash')?.state;
    const txns=(b.transactionPopulationDecision?.conclusionAssessments||[]).find((r:any)=>r.conclusionId==='complete-transaction-population')?.state;
    const bankRows:any[][]=[[],['BANK STATEMENT COMPLETENESS REVIEW'],['Expected Logical Pages',b.expectedLogicalPageCount],['Observed Logical Pages',(b.observedLogicalPages||[]).join(';')],['Missing Logical Pages',(b.missingLogicalPages||[]).join(';')],['Physical Pages Supplied',b.physicalPageCount],['Currency',s.currency],['Beginning Balance',s.beginningBalance],['Total Deposits',s.totalDeposits],['Total Withdrawals',s.totalWithdrawals],['Calculated Ending Balance',s.calculatedEndingBalance],['Reported Ending Balance',s.endingBalance],['Variance',s.variance],['Reconciliation',s.reconciliationStatus],['Ending Cash Conclusion',ending],['Transaction Population Conclusion',txns],['Ending Balance Action',b.endingBalanceDecision?.recommendedAction],['Transaction Population Action',b.transactionPopulationDecision?.recommendedAction],['Clarification Required',b.clarificationRecommended],['Gaps',(b.gaps||[]).map((g:any)=>`${g.location}:${g.gapType}:${g.explicitMateriality||'UNKNOWN'}`).join(' | ')],['Source SHA256',b.sourceSha256],['Evidence Refs',(b.evidenceRefs||[]).join(';')]];
    sections.push(bankRows.map(row=>row.map(csvCell).join(',')).join('\r\n'));
  }
  return sections.join('\r\n');
}''' + text[end:]
# Insert PDF bank section after AP review and before facts declaration.
needle = "  const facts=params.facts||[], jobs=params.specialistReview?.jobs||[];"
bank_pdf = r'''  if (params.bankStatementReview) {
    const b=params.bankStatementReview, s=b.summary||{};
    const ending=(b.endingBalanceDecision?.conclusionAssessments||[]).find((r:any)=>r.conclusionId==='ending-cash')?.state || 'NOT_RECORDED';
    const txns=(b.transactionPopulationDecision?.conclusionAssessments||[]).find((r:any)=>r.conclusionId==='complete-transaction-population')?.state || 'NOT_RECORDED';
    heading('Bank statement completeness and sufficiency review');
    text(`Expected logical pages: ${b.expectedLogicalPageCount}\nObserved logical pages: ${(b.observedLogicalPages||[]).join(', ') || 'none'}\nMissing logical pages: ${(b.missingLogicalPages||[]).join(', ') || 'none'}\nPhysical pages supplied: ${b.physicalPageCount}`);
    text(`Currency: ${s.currency || 'NOT_RECORDED'}\nBeginning balance: ${s.beginningBalance ?? 'NOT_RECORDED'}\nDeposits: ${s.totalDeposits ?? 'NOT_RECORDED'}\nWithdrawals: ${s.totalWithdrawals ?? 'NOT_RECORDED'}\nCalculated ending: ${s.calculatedEndingBalance ?? 'NOT_RECORDED'}\nReported ending: ${s.endingBalance ?? 'NOT_RECORDED'}\nVariance: ${s.variance ?? 'NOT_RECORDED'}\nReconciliation: ${s.reconciliationStatus || 'NOT_RUN'}`);
    text(`Ending cash conclusion: ${ending}\nComplete transaction population: ${txns}\nEnding balance action: ${b.endingBalanceDecision?.recommendedAction || 'NOT_RECORDED'}\nTransaction population action: ${b.transactionPopulationDecision?.recommendedAction || 'NOT_RECORDED'}\nClarification required: ${b.clarificationRecommended ? 'YES' : 'NO'}`);
    for (const g of b.gaps||[]) text(`Source gap: ${g.location || 'UNKNOWN'} | ${g.gapType} | ${g.explicitMateriality || 'UNKNOWN'} | ${g.description}`);
    text(`Source SHA-256: ${b.sourceSha256 || 'NOT_RECORDED'}\nEvidence refs: ${(b.evidenceRefs||[]).join(', ') || 'NOT_RECORDED'}`);
    text('A scoped conclusion may remain usable while a different complete-population conclusion is blocked. Missing pages remain disclosed and are never globally cleared by this review.');
  }
'''
if needle not in text: raise SystemExit('RENDER_FACTS_NEEDLE_MISSING')
text = text.replace(needle, bank_pdf + needle, 1)
# Add workbook Bank Review before Specialist Review.
needle2 = "  add('Specialist Review',["
bank_xlsx = r'''  if(params.bankStatementReview){ const b=params.bankStatementReview, s=b.summary||{}; const ending=(b.endingBalanceDecision?.conclusionAssessments||[]).find((r:any)=>r.conclusionId==='ending-cash')?.state; const txns=(b.transactionPopulationDecision?.conclusionAssessments||[]).find((r:any)=>r.conclusionId==='complete-transaction-population')?.state; add('Bank Review',[
    ['Field','Recorded value'],['Expected Logical Pages',b.expectedLogicalPageCount],['Observed Logical Pages',(b.observedLogicalPages||[]).join(', ')],['Missing Logical Pages',(b.missingLogicalPages||[]).join(', ')],['Physical Pages Supplied',b.physicalPageCount],['Currency',s.currency],['Beginning Balance',s.beginningBalance],['Total Deposits',s.totalDeposits],['Total Withdrawals',s.totalWithdrawals],['Calculated Ending Balance',s.calculatedEndingBalance],['Reported Ending Balance',s.endingBalance],['Variance',s.variance],['Reconciliation',s.reconciliationStatus],['Ending Cash Conclusion',ending],['Transaction Population Conclusion',txns],['Ending Balance Action',b.endingBalanceDecision?.recommendedAction],['Transaction Population Action',b.transactionPopulationDecision?.recommendedAction],['Clarification Required',b.clarificationRecommended],['Gaps',(b.gaps||[]).map((g:any)=>`${g.location}:${g.gapType}:${g.explicitMateriality||'UNKNOWN'}`).join(' | ')],['Source SHA256',b.sourceSha256],['Evidence Refs',(b.evidenceRefs||[]).join(';')]
  ],[38,110]); }
'''
if needle2 not in text: raise SystemExit('RENDER_XLSX_NEEDLE_MISSING')
text = text.replace(needle2, bank_xlsx + needle2, 1)
p.write_text(text)

# Deliverable service bank pass-through / durability.
replace_once('server/cpaOrganization/deliverableArtifactService.ts', '  apReview?: any;\n}', '  apReview?: any;\n  bankStatementReview?: any;\n}')
replace_once('server/cpaOrganization/deliverableArtifactService.ts', '            apReview: data.apReview\n', '            apReview: data.apReview,\n            bankStatementReview: data.bankStatementReview\n')
# Both PDF and XLSX calls contain the same tail; replace twice deliberately.
p = Path('server/cpaOrganization/deliverableArtifactService.ts')
text = p.read_text()
old = '      balanceIdentityApplicable,\n      apReview: params.apReview\n    });'
new = '      balanceIdentityApplicable,\n      apReview: params.apReview,\n      bankStatementReview: params.bankStatementReview\n    });'
if text.count(old) < 2: raise SystemExit(f'DELIVERABLE_RENDER_CALL_COUNT:{text.count(old)}')
text = text.replace(old, new, 2)
text = text.replace('      apReview: params.apReview || null\n', '      apReview: params.apReview || null,\n      bankStatementReview: params.bankStatementReview || null\n', 1)
text = text.replace('    const csvContent = buildReviewCsv(normalizedFacts, currency, params.apReview);', '    const csvContent = buildReviewCsv(normalizedFacts, currency, params.apReview, params.bankStatementReview);', 1)
text = text.replace('      apReview: params.apReview || undefined\n', '      apReview: params.apReview || undefined,\n      bankStatementReview: params.bankStatementReview || undefined\n', 1)
p.write_text(text)

# -----------------------------------------------------------------------------
# Physical PDF fixtures and tests.
# -----------------------------------------------------------------------------
write('server/tests/fixtures/bankStatementCompletenessFixture.ts', r'''import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export type BankFixtureVariant = 'complete' | 'missing-disclosure' | 'missing-transactions' | 'missing-unknown';
export const BANK_WORKSPACE_ID='ws-academy-bank-completeness';
export const BANK_ENGAGEMENT_ID='eng-academy-bank-completeness';
export function bankEvidenceDir(): string { return process.env.BANK_STATEMENT_ACCEPTANCE_EVIDENCE_DIR || '/tmp/eve-bank-statement-five-dimension'; }

const PAGES: Record<BankFixtureVariant, Array<{ logical:number; total:number; lines:string[] }>> = {
  complete: [
    {logical:1,total:4,lines:['EVE ACADEMY BANK','BANK STATEMENT','ACCOUNT ****4242','STATEMENT PERIOD 09/01/2026 - 09/30/2026','CURRENCY USD','Beginning Balance $1,000.00']},
    {logical:2,total:4,lines:['TRANSACTION ACTIVITY','09/02/2026 CLIENT PAYMENT 500.00 1,500.00','09/05/2026 OFFICE RENT -300.00 1,200.00']},
    {logical:3,total:4,lines:['TRANSACTION ACTIVITY CONTINUED','09/10/2026 SOFTWARE -100.00 1,100.00','09/15/2026 REFUND 50.00 1,150.00','Ending Balance $1,150.00','END OF TRANSACTION ACTIVITY']},
    {logical:4,total:4,lines:['TERMS AND DISCLOSURES','Electronic statements are provided for recordkeeping.','Privacy and service disclosures.']},
  ],
  'missing-disclosure': [
    {logical:1,total:4,lines:['EVE ACADEMY BANK','BANK STATEMENT','ACCOUNT ****4242','STATEMENT PERIOD 09/01/2026 - 09/30/2026','CURRENCY USD','Beginning Balance $1,000.00']},
    {logical:2,total:4,lines:['TRANSACTION ACTIVITY','09/02/2026 CLIENT PAYMENT 500.00 1,500.00','09/05/2026 OFFICE RENT -300.00 1,200.00']},
    {logical:3,total:4,lines:['TRANSACTION ACTIVITY CONTINUED','09/10/2026 SOFTWARE -100.00 1,100.00','09/15/2026 REFUND 50.00 1,150.00','Ending Balance $1,150.00','END OF TRANSACTION ACTIVITY']},
  ],
  'missing-transactions': [
    {logical:1,total:4,lines:['EVE ACADEMY BANK','BANK STATEMENT','ACCOUNT ****4242','STATEMENT PERIOD 09/01/2026 - 09/30/2026','CURRENCY USD','Beginning Balance $1,000.00']},
    {logical:3,total:4,lines:['TRANSACTION ACTIVITY CONTINUED','09/10/2026 SOFTWARE -100.00 1,100.00','09/15/2026 REFUND 50.00 1,150.00','Ending Balance $1,150.00','END OF TRANSACTION ACTIVITY']},
    {logical:4,total:4,lines:['TERMS AND DISCLOSURES','Electronic statements are provided for recordkeeping.','Privacy and service disclosures.']},
  ],
  'missing-unknown': [
    {logical:1,total:3,lines:['EVE ACADEMY BANK','BANK STATEMENT','ACCOUNT ****4242','STATEMENT PERIOD 09/01/2026 - 09/30/2026','CURRENCY USD','Beginning Balance $1,000.00','09/01/2026 OPENING CREDIT 100.00 1,100.00','Ending Balance $1,100.00']},
    {logical:3,total:3,lines:['ADDITIONAL INFORMATION','Contact the bank for questions about this statement.']},
  ],
};

export async function buildBankStatementPdf(variant: BankFixtureVariant): Promise<Buffer> {
  const doc=await PDFDocument.create();
  doc.setTitle(`Eve Academy Bank Statement ${variant}`); doc.setAuthor('Eve Academy'); doc.setCreator('Eve Academy Fixture Generator'); doc.setProducer('Eve Academy Fixture Generator');
  const fixed=new Date('2026-09-16T00:00:00.000Z'); doc.setCreationDate(fixed); doc.setModificationDate(fixed);
  const font=await doc.embedFont(StandardFonts.Helvetica); const bold=await doc.embedFont(StandardFonts.HelveticaBold);
  for(const spec of PAGES[variant]){ const page=doc.addPage([612,792]); let y=735;
    for(const [i,line] of spec.lines.entries()){ page.drawText(line,{x:54,y,size:i===0?14:11,font:i===0?bold:font}); y-=28; }
    page.drawText(`Page ${spec.logical} of ${spec.total}`,{x:270,y:35,size:9,font});
  }
  return Buffer.from(await doc.save({useObjectStreams:false}));
}
export function sha256(bytes: Buffer): string { return crypto.createHash('sha256').update(bytes).digest('hex'); }
export function fixturePath(variant: BankFixtureVariant): string { return path.join(bankEvidenceDir(),`bank-${variant}.pdf`); }
export function fixtureManifestPath(): string { return path.join(bankEvidenceDir(),'bank-fixture-manifest.json'); }
export function loadBankStatementPdf(variant: BankFixtureVariant): Buffer { return fs.readFileSync(fixturePath(variant)); }
''')

write('server/tests/generateBankStatementCurriculumFixtures.ts', r'''import fs from 'node:fs';
import { bankEvidenceDir, buildBankStatementPdf, fixtureManifestPath, fixturePath, sha256, type BankFixtureVariant } from './fixtures/bankStatementCompletenessFixture.js';
const variants:BankFixtureVariant[]=['complete','missing-disclosure','missing-transactions','missing-unknown'];
fs.rmSync(bankEvidenceDir(),{recursive:true,force:true}); fs.mkdirSync(bankEvidenceDir(),{recursive:true});
const manifest:any={marker:'BANK_STATEMENT_PHYSICAL_FIXTURES=PASS',fixtures:{}};
for(const variant of variants){ const bytes=await buildBankStatementPdf(variant); fs.writeFileSync(fixturePath(variant),bytes); manifest.fixtures[variant]={filename:fixturePath(variant).split('/').pop(),bytes:bytes.length,sha256:sha256(bytes)}; }
fs.writeFileSync(fixtureManifestPath(),JSON.stringify(manifest,null,2));
console.log('BANK_STATEMENT_PHYSICAL_FIXTURES=PASS'); console.log(JSON.stringify(manifest.fixtures));
''')

write('server/tests/bankStatementCompletenessAdapter.test.ts', r'''import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path';
import { AnyDocParser } from '../..//src/lib/parser/anydocParser.js';
import { extractBankStatementFromDocument } from '../bankStatementExtractor.js';
import { assessBankStatementCompleteness } from '../cpaOrganization/bankStatementCompletenessAdapter.js';
import { BANK_ENGAGEMENT_ID,BANK_WORKSPACE_ID,bankEvidenceDir,fixtureManifestPath,loadBankStatementPdf,sha256,type BankFixtureVariant } from './fixtures/bankStatementCompletenessFixture.js';
const parser=new AnyDocParser();
async function run(variant:BankFixtureVariant){ const bytes=loadBankStatementPdf(variant); const sourceSha=sha256(bytes); const doc=await parser.parse({filename:`bank-${variant}.pdf`,originalName:`bank-${variant}.pdf`,mimeType:'application/pdf',buffer:bytes}); doc.source.hash=sourceSha; const documentId=`doc-bank-${variant}`; const extraction=extractBankStatementFromDocument({doc,workspaceId:BANK_WORKSPACE_ID,documentId,filename:`bank-${variant}.pdf`}); assert.equal(extraction.success,true); const assessment=assessBankStatementCompleteness({doc,extraction,workspaceId:BANK_WORKSPACE_ID,engagementId:BANK_ENGAGEMENT_ID,documentId,filename:`bank-${variant}.pdf`}); return {bytes,sourceSha,doc,extraction,assessment}; }
const complete=await run('complete');
assert.equal(complete.doc.page_count,4); assert.equal(complete.extraction.transactions.length,4); assert.equal(complete.extraction.transactions[0].amount,500,'date fragment must never become transaction amount'); assert.equal((complete.extraction.transactions[0] as any).sourcePage,2); assert.equal((complete.extraction.transactions[2] as any).sourcePage,3); assert.equal((complete.extraction.summary as any).currency,'USD'); assert.equal((complete.extraction.summary as any).beginningBalance,1000); assert.equal((complete.extraction.summary as any).endingBalance,1150); assert.equal((complete.extraction.summary as any).calculatedEndingBalance,1150); assert.equal((complete.extraction.summary as any).reconciliationPassed,true); assert.deepEqual(complete.assessment.missingLogicalPages,[]); assert.equal(complete.assessment.summary.reconciliationStatus,'PASS'); assert.equal(new Set(complete.extraction.facts.map(f=>f.id)).size,complete.extraction.facts.length,'bank balance fact IDs must be unique');
const nonmaterial=await run('missing-disclosure'); assert.deepEqual(nonmaterial.assessment.observedLogicalPages,[1,2,3]); assert.deepEqual(nonmaterial.assessment.missingLogicalPages,[4]); assert.equal(nonmaterial.assessment.gaps[0].gapType,'MISSING_PAGE'); assert.equal(nonmaterial.assessment.gaps[0].explicitMateriality,'NON_MATERIAL'); assert.equal(nonmaterial.assessment.endingBalanceDecision.sourceCompletenessState,'SOURCE_GAP_NON_MATERIAL_FOR_CURRENT_PURPOSE'); assert.equal(nonmaterial.assessment.endingBalanceDecision.taskEvidenceSufficiencyState,'SUFFICIENT_FOR_CURRENT_PURPOSE'); assert.equal(nonmaterial.assessment.transactionPopulationDecision.taskEvidenceSufficiencyState,'SUFFICIENT_FOR_CURRENT_PURPOSE');
const material=await run('missing-transactions'); assert.deepEqual(material.assessment.observedLogicalPages,[1,3,4]); assert.deepEqual(material.assessment.missingLogicalPages,[2]); assert.equal(material.assessment.gaps[0].gapType,'MISSING_TRANSACTION_RANGE'); assert.equal(material.assessment.gaps[0].explicitMateriality,'MATERIAL'); assert.equal(material.assessment.summary.beginningBalance,1000); assert.equal(material.assessment.summary.endingBalance,1150); assert.equal(material.assessment.summary.totalDeposits,50); assert.equal(material.assessment.summary.totalWithdrawals,100); assert.equal(material.assessment.summary.calculatedEndingBalance,950); assert.equal(material.assessment.summary.variance,-200); assert.equal(material.assessment.summary.reconciliationStatus,'FAIL'); assert.deepEqual(material.assessment.endingBalanceDecision.allowedConclusionIds,['ending-cash']); assert.deepEqual(material.assessment.transactionPopulationDecision.blockedConclusionIds,['complete-transaction-population']); assert.equal(material.assessment.transactionPopulationDecision.recommendedAction,'REQUEST_ADDITIONAL_EVIDENCE'); assert.equal(material.assessment.clarificationRecommended,true);
const unknown=await run('missing-unknown'); assert.deepEqual(unknown.assessment.missingLogicalPages,[2]); assert.equal(unknown.assessment.gaps[0].explicitMateriality,'UNKNOWN'); assert.equal(unknown.assessment.summary.reconciliationStatus,'PASS'); assert.deepEqual(unknown.assessment.endingBalanceDecision.reviewRequiredConclusionIds,['ending-cash']); assert.deepEqual(unknown.assessment.transactionPopulationDecision.reviewRequiredConclusionIds,['complete-transaction-population']); assert.equal(unknown.assessment.endingBalanceDecision.recommendedAction,'REVIEW_MATERIALITY');
// Currency must not be invented and absent balances must not become zero.
const noCurrencyDoc:any={...complete.doc,metadata:{...complete.doc.metadata,currency:undefined},pages:complete.doc.pages!.map(p=>({...p,text:p.text.replace(/CURRENCY USD/g,'')})),markdown:(complete.doc.markdown||'').replace(/CURRENCY USD/g,''),raw_text:(complete.doc.raw_text||'').replace(/CURRENCY USD/g,''),sections:(complete.doc.sections||[]).map(s=>({...s,text:s.text.replace(/CURRENCY USD/g,'')}))};
const noCurrency=extractBankStatementFromDocument({doc:noCurrencyDoc,workspaceId:'ws',documentId:'doc-no-currency',filename:'bank-no-currency.pdf'}); assert.equal((noCurrency.summary as any).currency,undefined,'dollar symbol alone must not silently establish USD');
const noBalancesDoc:any={document_id:'doc-no-bal',source:{filename:'no-bal.txt',format:'txt'},metadata:{},raw_text:'09/02/2026 TEST DEPOSIT 25.00',markdown:'09/02/2026 TEST DEPOSIT 25.00',pages:[{page_number:1,text:'09/02/2026 TEST DEPOSIT 25.00'}],sections:[]};
const noBalances=extractBankStatementFromDocument({doc:noBalancesDoc,workspaceId:'ws',documentId:'doc-no-bal',filename:'no-bal.txt'}); assert.equal(noBalances.success,true); assert.equal((noBalances.summary as any).beginningBalance,undefined); assert.equal((noBalances.summary as any).endingBalance,undefined); assert.equal((noBalances.summary as any).calculatedEndingBalance,undefined); assert.equal((noBalances.summary as any).reconciliationPassed,false);
const fixtureManifest=JSON.parse(fs.readFileSync(fixtureManifestPath(),'utf8'));
const proof={marker:'P2_BANK_STATEMENT_SOURCE_SUFFICIENCY_CASES=PASS',fixtureManifest,cases:{complete:{sha:complete.sourceSha,reconciliation:complete.assessment.summary.reconciliationStatus},nonmaterial:{sha:nonmaterial.sourceSha,missing:nonmaterial.assessment.missingLogicalPages,ending:nonmaterial.assessment.endingBalanceDecision.taskEvidenceSufficiencyState,transactions:nonmaterial.assessment.transactionPopulationDecision.taskEvidenceSufficiencyState},material:{sha:material.sourceSha,missing:material.assessment.missingLogicalPages,reconciliation:material.assessment.summary.reconciliationStatus,variance:material.assessment.summary.variance,ending:material.assessment.endingBalanceDecision.allowedConclusionIds,blocked:material.assessment.transactionPopulationDecision.blockedConclusionIds},unknown:{sha:unknown.sourceSha,missing:unknown.assessment.missingLogicalPages,ending:unknown.assessment.endingBalanceDecision.reviewRequiredConclusionIds,transactions:unknown.assessment.transactionPopulationDecision.reviewRequiredConclusionIds}}}; fs.writeFileSync(path.join(bankEvidenceDir(),'source-sufficiency-cases.json'),JSON.stringify(proof,null,2)); console.log('P2_BANK_STATEMENT_SOURCE_SUFFICIENCY_CASES=PASS');
''')

write('server/tests/fixtures/bankStatementAcceptanceHelpers.ts', r'''import { AnyDocParser } from '../../../src/lib/parser/anydocParser.js';
import { extractBankStatementFromDocument } from '../../bankStatementExtractor.js';
import { assessBankStatementCompleteness } from '../../cpaOrganization/bankStatementCompletenessAdapter.js';
import { BANK_ENGAGEMENT_ID,BANK_WORKSPACE_ID,loadBankStatementPdf,sha256,type BankFixtureVariant } from './bankStatementCompletenessFixture.js';
export async function prepareBankCase(variant:BankFixtureVariant){ const bytes=loadBankStatementPdf(variant); const sourceSha=sha256(bytes); const parser=new AnyDocParser(); const doc=await parser.parse({filename:`bank-${variant}.pdf`,originalName:`bank-${variant}.pdf`,mimeType:'application/pdf',buffer:bytes}); doc.source.hash=sourceSha; const documentId=`doc-bank-${variant}`; const extraction=extractBankStatementFromDocument({doc,workspaceId:BANK_WORKSPACE_ID,documentId,filename:`bank-${variant}.pdf`}); const assessment=assessBankStatementCompleteness({doc,extraction,workspaceId:BANK_WORKSPACE_ID,engagementId:BANK_ENGAGEMENT_ID,documentId,filename:`bank-${variant}.pdf`}); return {bytes,sourceSha,doc,documentId,extraction,assessment}; }
export function buildBankEngagement(prepared:any){ return { engagementId:BANK_ENGAGEMENT_ID,workspaceId:BANK_WORKSPACE_ID,classification:'ACADEMY',isCustomer:false,clientName:'Eve Academy Bank Statement Fixture',period:'2026-09',framework:'BANK_EVIDENCE_REVIEW',functionalCurrency:prepared.assessment.summary.currency || 'NOT_RECORDED',currentStage:'EVIDENCE_REVIEW',documents:[{id:prepared.documentId,originalName:'bank-missing-transactions.pdf',filename:'bank-missing-transactions.pdf',sha256:prepared.sourceSha}],canonicalFacts:prepared.extraction.facts,findings:[],bankStatementCompleteness:prepared.assessment}; }
''')

write('server/tests/bankStatementProductTruthBrowser.test.ts', r'''import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import puppeteer from 'puppeteer-core';
import { BANK_ENGAGEMENT_ID,bankEvidenceDir } from './fixtures/bankStatementCompletenessFixture.js'; import { buildBankEngagement,prepareBankCase } from './fixtures/bankStatementAcceptanceHelpers.js';
const prepared=await prepareBankCase('missing-transactions'); const engagement=buildBankEngagement(prepared); const baseUrl=process.env.EVE_TEST_BASE_URL||'http://127.0.0.1:4173'; const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean) as string[]; const executablePath=candidates.find(p=>fs.existsSync(p)); if(!executablePath)throw new Error('MISSING_BROWSER_EXECUTABLE'); const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
try{const page=await browser.newPage(); await page.setViewport({width:1440,height:1100}); await page.setRequestInterception(true); page.on('request',async req=>{try{const url=new URL(req.url()); if(url.origin!==new URL(baseUrl).origin||!url.pathname.startsWith('/api/'))return req.continue(); let payload:any={}; if(url.pathname==='/api/cpa/engagements/universal')payload={engagements:[{engagementId:engagement.engagementId,workspaceId:engagement.workspaceId,classification:'ACADEMY',isCustomer:false,clientName:engagement.clientName,period:engagement.period,framework:engagement.framework,functionalCurrency:engagement.functionalCurrency,currentStage:engagement.currentStage,openReviewNotesCount:0,documentsCount:1,canonicalFactsCount:engagement.canonicalFacts.length}]}; else if(url.pathname===`/api/cpa/engagements/${BANK_ENGAGEMENT_ID}`)payload={engagement}; else if(url.pathname==='/api/cpa/reports/library')payload={reports:[]}; else if(url.pathname==='/api/queue/jobs')payload={jobs:[]}; else if(url.pathname==='/api/health')payload={status:'ok'}; await req.respond({status:200,contentType:'application/json',body:JSON.stringify(payload)});}catch{req.abort();}}); const response=await page.goto(`${baseUrl}/?view=engagement-evidence`,{waitUntil:'networkidle0',timeout:30000}); assert.ok(response?.ok()); const selector='[data-eve-bank-completeness="true"]'; await page.waitForSelector(selector,{visible:true,timeout:15000}); const text=await page.$eval(selector,el=>(el as HTMLElement).innerText); for(const expected of ['Bank statement completeness review','Expected logical pages: 4','Observed logical pages: 1, 3, 4','Missing logical pages: 2','Beginning balance: USD 1000.00','Deposits: USD 50.00','Withdrawals: USD 100.00','Calculated ending: USD 950.00','Reported ending: USD 1150.00','Variance: USD -200.00','Reconciliation: FAIL','Ending cash conclusion: ALLOWED','Complete transaction population: BLOCKED_INSUFFICIENT','Transaction population action: REQUEST_ADDITIONAL_EVIDENCE','Clarification required: YES','MISSING_TRANSACTION_RANGE','MATERIAL',prepared.sourceSha])assert.ok(text.includes(expected),`bank product panel missing ${expected}`); const attrs=await page.$eval(selector,(el:any)=>({reconciliation:el.dataset.eveBankReconciliation,ending:el.dataset.eveBankEndingState,transactions:el.dataset.eveBankTransactionState})); assert.deepEqual(attrs,{reconciliation:'FAIL',ending:'ALLOWED',transactions:'BLOCKED_INSUFFICIENT'}); const screenshot=path.join(bankEvidenceDir(),'bank-product-truth.png'); await page.screenshot({path:screenshot,fullPage:true}); fs.writeFileSync(path.join(bankEvidenceDir(),'product-truth.json'),JSON.stringify({marker:'P2_BANK_STATEMENT_PRODUCT_TRUTH_BROWSER=PASS',sourceSha256:prepared.sourceSha,missingLogicalPages:prepared.assessment.missingLogicalPages,reconciliation:prepared.assessment.summary.reconciliationStatus,endingState:'ALLOWED',transactionState:'BLOCKED_INSUFFICIENT',screenshot,browserVersion:await browser.version()},null,2)); console.log('P2_BANK_STATEMENT_PRODUCT_TRUTH_BROWSER=PASS');}finally{await browser.close();}
''')

write('server/tests/bankStatementDeliverableTruth.test.ts', r'''import assert from 'node:assert/strict'; import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path'; import * as XLSXModule from 'xlsx'; const XLSX:any=(XLSXModule as any).default||XLSXModule;
import { bankEvidenceDir,BANK_ENGAGEMENT_ID,BANK_WORKSPACE_ID } from './fixtures/bankStatementCompletenessFixture.js'; import { prepareBankCase } from './fixtures/bankStatementAcceptanceHelpers.js';
const prepared=await prepareBankCase('missing-transactions'); const dir=bankEvidenceDir(); const reports=path.join(dir,'reports'); fs.mkdirSync(reports,{recursive:true}); process.env.HERMES_REPORTS_DIR=reports; const {deliverableArtifactService}=await import('../cpaOrganization/deliverableArtifactService.js'); const ending:any=prepared.extraction.facts.find((f:any)=>f.factType==='bank_ending_balance'); assert.ok(ending,'ending balance fact required'); const provenanceId=`prov-bank-ending-${prepared.sourceSha.slice(0,12)}`; const coordinate={coordinateId:`coord-bank-ending-${prepared.sourceSha.slice(0,12)}`,sourceArtifactId:`artifact-pdf-${prepared.sourceSha.slice(0,24)}`,sourceSha256:prepared.sourceSha,sourceType:'PDF',pageNumber:ending.pageNumber,rawLiteral:ending.sourceText,normalizedLiteral:ending.sourceText,extractionMethod:'BANK_STATEMENT_NATIVE_PARSE',extractionVersion:'2.1'};
const report=await deliverableArtifactService.compileAndRegisterDeliverable({reportId:'REP-BANK-MISSING-TXN',engagementId:BANK_ENGAGEMENT_ID,workspaceId:BANK_WORKSPACE_ID,version:'v1.0',title:'Bank Statement Completeness Review Draft',clientName:'Eve Academy Bank Fixture',period:'September 2026',currency:'USD',status:'AI_PREPARED',facts:[{id:ending.id,canonicalMetric:ending.canonicalMetric,label:ending.labelNormalized,value:ending.normalizedValue,statement:'BANK_STATEMENT',sourceDoc:'bank-missing-transactions.pdf',page:ending.pageNumber,verificationStatus:'REVIEW_REQUIRED',evidenceStatus:'SOURCE_GAP_PRESENT',documentId:prepared.documentId,reportingPeriod:'September 2026',sourceText:ending.sourceText,sourceBlockIds:[`bank-page:${ending.pageNumber}`],sourceSha256:prepared.sourceSha,sourceArtifactId:coordinate.sourceArtifactId,sourceProvenanceId:provenanceId,sourceProvenanceIds:[provenanceId],sourceCoordinate:coordinate,sourceCoordinates:[coordinate],sourceExtractionMethod:coordinate.extractionMethod,sourceExtractionVersion:coordinate.extractionVersion}],bankStatementReview:prepared.assessment}); assert.equal(report.status,'AI_PREPARED'); const pdf=fs.readFileSync(report.formats.pdf!.filepath); const pdfSha=crypto.createHash('sha256').update(pdf).digest('hex'); assert.equal(pdfSha,report.formats.pdf!.sha256); const {PDFParse}=await import('pdf-parse'); const parser=new PDFParse({data:pdf}); let pdfText=''; try{pdfText=(await parser.getText()).text;}finally{await parser.destroy();} for(const expected of ['Bank statement completeness and sufficiency review','Expected logical pages: 4','Observed logical pages: 1, 3, 4','Missing logical pages: 2','Reconciliation: FAIL','Ending cash conclusion: ALLOWED','Complete transaction population: BLOCKED_INSUFFICIENT','REQUEST_ADDITIONAL_EVIDENCE','MISSING_TRANSACTION_RANGE',prepared.sourceSha])assert.ok(pdfText.includes(expected),`PDF missing ${expected}`); const json=JSON.parse(fs.readFileSync(report.formats.json!.filepath,'utf8')); assert.equal(json.bankStatementReview.sourceSha256,prepared.sourceSha); assert.deepEqual(json.bankStatementReview.missingLogicalPages,[2]); assert.equal(json.bankStatementReview.summary.reconciliationStatus,'FAIL'); const csv=fs.readFileSync(report.formats.csvLeadSchedules!.filepath,'utf8'); for(const expected of ['BANK STATEMENT COMPLETENESS REVIEW','MISSING_TRANSACTION_RANGE','BLOCKED_INSUFFICIENT',prepared.sourceSha])assert.ok(csv.includes(expected),`CSV missing ${expected}`); const wb=XLSX.readFile(report.formats.xlsx!.filepath); assert.ok(wb.Sheets['Bank Review']); const bankRows:any[][]=XLSX.utils.sheet_to_json(wb.Sheets['Bank Review'],{header:1,raw:false}); const bankText=bankRows.flat().map(v=>String(v??'')).join(' | '); for(const expected of ['MISSING_TRANSACTION_RANGE','BLOCKED_INSUFFICIENT',prepared.sourceSha])assert.ok(bankText.includes(expected),`XLSX missing ${expected}`); const proof={marker:'P2_BANK_STATEMENT_DELIVERABLE_TRUTH=PASS',sourceSha256:prepared.sourceSha,reportId:report.reportId,version:report.version,pdfSha256:pdfSha,formats:{pdf:report.formats.pdf!.sha256,json:report.formats.json!.sha256,xlsx:report.formats.xlsx!.sha256,csv:report.formats.csvLeadSchedules!.sha256}}; fs.writeFileSync(path.join(dir,'deliverable-truth.json'),JSON.stringify(proof,null,2)); console.log('P2_BANK_STATEMENT_DELIVERABLE_TRUTH=PASS');
''')

write('server/tests/bankStatementFiveDimensionAcceptance.test.ts', r'''import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import { academyMinervaLab } from '../cpaOrganization/academyMinervaLab.js'; import { bankEvidenceDir } from './fixtures/bankStatementCompletenessFixture.js'; import { prepareBankCase } from './fixtures/bankStatementAcceptanceHelpers.js';
const dir=bankEvidenceDir(); const sourcePath=path.join(dir,'source-sufficiency-cases.json'), productPath=path.join(dir,'product-truth.json'), deliverablePath=path.join(dir,'deliverable-truth.json'); for(const p of [sourcePath,productPath,deliverablePath])assert.ok(fs.existsSync(p),`missing evidence receipt ${p}`); const source=JSON.parse(fs.readFileSync(sourcePath,'utf8')), product=JSON.parse(fs.readFileSync(productPath,'utf8')), deliverable=JSON.parse(fs.readFileSync(deliverablePath,'utf8')); assert.equal(source.marker,'P2_BANK_STATEMENT_SOURCE_SUFFICIENCY_CASES=PASS'); assert.equal(product.marker,'P2_BANK_STATEMENT_PRODUCT_TRUTH_BROWSER=PASS'); assert.equal(deliverable.marker,'P2_BANK_STATEMENT_DELIVERABLE_TRUTH=PASS'); const prepared=await prepareBankCase('missing-transactions'); assert.equal(product.sourceSha256,prepared.sourceSha); assert.equal(deliverable.sourceSha256,prepared.sourceSha); const a=prepared.assessment; const materialGap=a.gaps.find(g=>g.gapType==='MISSING_TRANSACTION_RANGE'); const sourceChecks:any[]=[{checkId:'bank-physical-page-inventory',label:'Physical/logical page inventory detects missing transaction page',outcome:materialGap&&a.expectedLogicalPageCount===4&&a.missingLogicalPages.join(',')==='2'?'PASS':'FAIL',evidenceRefs:[`source:${prepared.sourceSha}`,...a.pageInventory.map(p=>p.evidenceRef),...(materialGap?.evidenceRefs||[])],details:[`expected=${a.expectedLogicalPageCount}; observed=${a.observedLogicalPages.join(',')}; missing=${a.missingLogicalPages.join(',')}`]}]; const semanticChecks:any[]=[{checkId:'bank-scoped-sufficiency',label:'Missing transaction page blocks complete population without erasing explicit ending balance evidence',outcome:a.endingBalanceDecision.allowedConclusionIds.includes('ending-cash')&&a.transactionPopulationDecision.blockedConclusionIds.includes('complete-transaction-population')?'PASS':'FAIL',evidenceRefs:[`decision:${a.endingBalanceDecision.decisionHash}`,`decision:${a.transactionPopulationDecision.decisionHash}`],details:[`ending=${a.endingBalanceDecision.allowedConclusionIds.join(',')}; blocked=${a.transactionPopulationDecision.blockedConclusionIds.join(',')}`]}]; const accountingChecks:any[]=[{checkId:'bank-reconciliation-fail-closed',label:'Observed transaction population reconciliation fails and remains blocked',outcome:a.summary.reconciliationStatus==='FAIL'&&a.summary.calculatedEndingBalance===950&&a.summary.endingBalance===1150&&a.summary.variance===-200?'PASS':'FAIL',evidenceRefs:a.evidenceRefs,details:[`1000 + 50 - 100 = ${a.summary.calculatedEndingBalance}; reported=${a.summary.endingBalance}; variance=${a.summary.variance}`]}]; const report=academyMinervaLab.evaluateFiveDimensions({caseId:'CURR-SUFF-MISSING-TRANSACTION-MATERIAL',executionId:`bank-${prepared.sourceSha.slice(0,12)}`,dimensions:{SOURCE_COVERAGE:{checks:sourceChecks},SEMANTIC_UNDERSTANDING:{checks:semanticChecks},ACCOUNTING_ACCURACY:{checks:accountingChecks},PRODUCT_TRUTH:{checks:[{checkId:'bank-real-product-browser',label:'Actual Eve bank completeness panel renders scoped decisions',outcome:'PASS',evidenceRefs:[`browser:${product.screenshot}`,`source:${prepared.sourceSha}`],details:[`ending=${product.endingState}; transactions=${product.transactionState}; reconciliation=${product.reconciliation}`]}]},DELIVERABLE_TRUTH:{checks:[{checkId:'bank-artifact-sufficiency-lineage',label:'Bank completeness/export package preserves gap, scoped decisions and source SHA',outcome:'PASS',evidenceRefs:[`artifact:pdf:${deliverable.formats.pdf}`,`artifact:json:${deliverable.formats.json}`,`artifact:xlsx:${deliverable.formats.xlsx}`,`artifact:csv:${deliverable.formats.csv}`],details:[`report=${deliverable.reportId}:${deliverable.version}`]}]}}}); for(const d of ['SOURCE_COVERAGE','SEMANTIC_UNDERSTANDING','ACCOUNTING_ACCURACY','PRODUCT_TRUTH','DELIVERABLE_TRUTH'] as const)assert.equal(report.dimensions[d].status,'PASS',`${d} must pass`); assert.equal(report.passedDimensionCount,5); assert.equal(report.notTestedDimensionCount,0); assert.equal(report.fullyTested,true); assert.equal(report.allRequiredDimensionsPassed,true); assert.equal(report.overallStatus,'FIVE_DIMENSION_PASS'); fs.writeFileSync(path.join(dir,'five-dimension-result.json'),JSON.stringify({marker:'P2_BANK_STATEMENT_FIVE_DIMENSION_PASS=PASS',sourceSha256:prepared.sourceSha,report},null,2)); console.log('P2_BANK_STATEMENT_FIVE_DIMENSION_PASS=PASS');
''')

# Curriculum: make the physical bank context explicit and add evidence refs. The material case now has all-five physical proof.
p=Path('server/cpaOrganization/academyMinervaLab.ts'); text=p.read_text()
text=text.replace("        ['PDF', 'MISSING_PAGE'],\n        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH'],\n        [\n          'Persist the source gap even when the current conclusion may proceed.'", "        ['PDF', 'BANK_STATEMENT', 'MISSING_PAGE'],\n        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH'],\n        [\n          'Persist the source gap even when the current conclusion may proceed.'",1)
text=text.replace("        'CONTRACT_READY',\n        ['server/tests/taskEvidenceSufficiency.test.ts']\n      ),\n      caseSpec(\n        'CURR-SUFF-MISSING-TRANSACTION-MATERIAL'", "        'CONTRACT_READY',\n        ['server/tests/taskEvidenceSufficiency.test.ts', 'server/tests/bankStatementCompletenessAdapter.test.ts']\n      ),\n      caseSpec(\n        'CURR-SUFF-MISSING-TRANSACTION-MATERIAL'",1)
text=text.replace("        ['PDF', 'TRANSACTION_POPULATION', 'MISSING_PAGE'],\n        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH'],", "        ['PDF', 'BANK_STATEMENT', 'TRANSACTION_POPULATION', 'MISSING_PAGE'],\n        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH'],",1)
text=text.replace("        'CONTRACT_READY',\n        ['server/tests/taskEvidenceSufficiency.test.ts']\n      ),\n      caseSpec(\n        'CURR-SUFF-MISSING-PAGE-UNKNOWN'", "        'CONTRACT_READY',\n        ['server/tests/taskEvidenceSufficiency.test.ts', 'server/tests/bankStatementCompletenessAdapter.test.ts', 'server/tests/bankStatementProductTruthBrowser.test.ts', 'server/tests/bankStatementDeliverableTruth.test.ts', 'server/tests/bankStatementFiveDimensionAcceptance.test.ts', 'docs/launch/evidence/2026-09-16_P2_BANK_STATEMENT_COMPLETENESS_ACCEPTANCE.md']\n      ),\n      caseSpec(\n        'CURR-SUFF-MISSING-PAGE-UNKNOWN'",1)
# the remaining missing-page sourceKinds occurrence is the unknown case
idx=text.find("        ['PDF', 'MISSING_PAGE'],", text.find("'CURR-SUFF-MISSING-PAGE-UNKNOWN'"))
if idx<0: raise SystemExit('UNKNOWN_CASE_SOURCEKINDS_MISSING')
text=text[:idx]+text[idx:].replace("        ['PDF', 'MISSING_PAGE'],","        ['PDF', 'BANK_STATEMENT', 'MISSING_PAGE'],",1)
needle="        ['server/tests/taskEvidenceSufficiency.test.ts', 'server/tests/sufficiencyClarificationCoordinator.test.ts']"
if needle not in text: raise SystemExit('UNKNOWN_VALIDATION_REFS_MISSING')
text=text.replace(needle,"        ['server/tests/taskEvidenceSufficiency.test.ts', 'server/tests/sufficiencyClarificationCoordinator.test.ts', 'server/tests/bankStatementCompletenessAdapter.test.ts']",1)
p.write_text(text)

# Catalog regression assertions for physical bank coverage.
p=Path('server/tests/fiveDimensionAcademyCurriculum.test.ts'); text=p.read_text()
needle="assert.ok(find('CURR-SUFF-MISSING-PAGE-UNKNOWN').expectedSafeguards.join(' ').includes('review required'));"
addition=needle+"\nassert.ok(find('CURR-SUFF-MISSING-PAGE-NON-MATERIAL').sourceKinds.includes('BANK_STATEMENT'));\nassert.ok(find('CURR-SUFF-MISSING-TRANSACTION-MATERIAL').sourceKinds.includes('BANK_STATEMENT'));\nassert.deepEqual(find('CURR-SUFF-MISSING-TRANSACTION-MATERIAL').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);\nassert.ok(find('CURR-SUFF-MISSING-TRANSACTION-MATERIAL').validationRefs.includes('server/tests/bankStatementFiveDimensionAcceptance.test.ts'));\nassert.ok(find('CURR-SUFF-MISSING-PAGE-UNKNOWN').sourceKinds.includes('BANK_STATEMENT'));"
if needle not in text: raise SystemExit('CURRICULUM_TEST_NEEDLE_MISSING')
p.write_text(text.replace(needle,addition,1))

print('BANK_STATEMENT_COMPLETENESS_PATCH_APPLIED')
