import type { CanonicalDocumentModel } from '../../src/lib/parser/types.js';
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
