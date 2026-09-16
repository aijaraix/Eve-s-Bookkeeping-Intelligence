import type { CanonicalDocumentModel } from '../../src/lib/parser/types.js';
import type { FiveDimensionCheck } from './academyMinervaLab.js';

export type TrialBalanceStatus = 'BALANCED' | 'UNBALANCED' | 'INSUFFICIENT_EVIDENCE';
export type TrialBalanceFormulaIntegrity = 'MATCH' | 'STALE_OR_INCONSISTENT' | 'NOT_PRESENT';
export type TrialBalancePromotionState = 'READY_FOR_AUTHORIZED_REVIEW' | 'BLOCKED_UNBALANCED' | 'BLOCKED_INSUFFICIENT';

export interface TrialBalanceLine {
  rowNumber: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  hiddenRow: boolean;
  accountEvidenceRef?: string;
  debitEvidenceRef?: string;
  creditEvidenceRef?: string;
  accountCoordinate?: any;
  debitCoordinate?: any;
  creditCoordinate?: any;
}

export interface TrialBalanceFormulaCell {
  cachedValue: number | null;
  formula?: string;
  cellAddress?: string;
  provenanceId?: string;
  sourceCoordinate?: any;
}

export interface TrialBalanceReview {
  sourceSha256: string;
  sourceArtifactId?: string;
  sourceDocument: string;
  sheetName: string;
  sourceRange?: string;
  currency?: string;
  accountLineCount: number;
  hiddenAccountLineCount: number;
  lines: TrialBalanceLine[];
  totalDebits: number;
  totalCredits: number;
  variance: number;
  status: TrialBalanceStatus;
  formulaIntegrityStatus: TrialBalanceFormulaIntegrity;
  promotionState: TrialBalancePromotionState;
  formulaReview: {
    debitTotal: TrialBalanceFormulaCell;
    creditTotal: TrialBalanceFormulaCell;
    variance: TrialBalanceFormulaCell;
  };
  sourceCoverageStatus: 'SOURCE_COMPLETE' | 'SOURCE_GAP';
  semanticStatus: 'TRIAL_BALANCE_ROWS_PARSED' | 'REVIEW_REQUIRED';
  semanticWarnings: string[];
  evidenceRefs: string[];
}

function numberValue(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = Number(String(value).replace(/[$,()]/g, '').trim());
  return Number.isFinite(n) ? n : null;
}
function round2(value: number): number { return Math.round((value + Number.EPSILON) * 100) / 100; }
function sameMoney(a: number | null, b: number): boolean { return a !== null && Math.abs(a - b) < 0.005; }
function refAt(rowEvidence: any[], idx: number): any | undefined { return Array.isArray(rowEvidence) ? rowEvidence[idx] || undefined : undefined; }
function unique(values: Array<string | undefined>): string[] { return [...new Set(values.filter(Boolean) as string[])]; }

export function interpretTrialBalance(params: { doc: CanonicalDocumentModel; currency?: string }): TrialBalanceReview {
  const doc: any = params.doc;
  const tables: any[] = Array.isArray(doc.tables) ? doc.tables : [];
  const table = tables.find(t => {
    const headers = (t.headers || []).map((h: any) => String(h || '').trim().toLowerCase());
    return headers.some((h: string) => h.includes('debit')) && headers.some((h: string) => h.includes('credit')) && headers.some((h: string) => h.includes('account'));
  });
  const sourceSha256 = String(doc?.source?.hash || '');
  const sourceArtifactId = doc?.source?.sourceArtifactId ? String(doc.source.sourceArtifactId) : undefined;
  const sourceDocument = String(doc?.source?.originalName || doc?.source?.filename || 'spreadsheet');
  if (!table || !sourceSha256) {
    return {
      sourceSha256, sourceArtifactId, sourceDocument, sheetName: table?.sheetName || 'NOT_RECORDED', sourceRange: table?.rangeAddress,
      currency: params.currency, accountLineCount: 0, hiddenAccountLineCount: 0, lines: [], totalDebits: 0, totalCredits: 0, variance: 0,
      status: 'INSUFFICIENT_EVIDENCE', formulaIntegrityStatus: 'NOT_PRESENT', promotionState: 'BLOCKED_INSUFFICIENT',
      formulaReview: { debitTotal: { cachedValue: null }, creditTotal: { cachedValue: null }, variance: { cachedValue: null } },
      sourceCoverageStatus: 'SOURCE_GAP', semanticStatus: 'REVIEW_REQUIRED', semanticWarnings: ['Trial-balance table or source SHA is missing.'], evidenceRefs: []
    };
  }
  const headers = (table.headers || []).map((h: any) => String(h || '').trim());
  const lower = headers.map((h: string) => h.toLowerCase());
  const accountIdx = lower.findIndex((h: string) => /^account(?:\s+(?:code|number|no\.?))?$/.test(h));
  const nameIdx = lower.findIndex((h: string) => h.includes('name') || h.includes('description'));
  const debitIdx = lower.findIndex((h: string) => h.includes('debit'));
  const creditIdx = lower.findIndex((h: string) => h.includes('credit'));
  const varianceIdx = lower.findIndex((h: string) => h.includes('variance') || h.includes('difference'));
  if (accountIdx < 0 || debitIdx < 0 || creditIdx < 0) {
    return {
      sourceSha256, sourceArtifactId, sourceDocument, sheetName: table.sheetName || table.name || 'NOT_RECORDED', sourceRange: table.rangeAddress,
      currency: params.currency, accountLineCount: 0, hiddenAccountLineCount: 0, lines: [], totalDebits: 0, totalCredits: 0, variance: 0,
      status: 'INSUFFICIENT_EVIDENCE', formulaIntegrityStatus: 'NOT_PRESENT', promotionState: 'BLOCKED_INSUFFICIENT',
      formulaReview: { debitTotal: { cachedValue: null }, creditTotal: { cachedValue: null }, variance: { cachedValue: null } },
      sourceCoverageStatus: 'SOURCE_GAP', semanticStatus: 'REVIEW_REQUIRED', semanticWarnings: ['Required Account/Debit/Credit columns are missing.'], evidenceRefs: []
    };
  }

  const rows: any[][] = Array.isArray(table.rows) ? table.rows : [];
  const evidenceRows: any[][] = Array.isArray(table.rowEvidence) ? table.rowEvidence : [];
  const lines: TrialBalanceLine[] = [];
  const semanticWarnings: string[] = [];
  const missingEvidence: string[] = [];
  let totalsRow: any[] | undefined;
  let totalsEvidence: any[] | undefined;

  rows.forEach((row: any[], idx: number) => {
    const evidence = evidenceRows[idx] || [];
    const accountCode = String(row?.[accountIdx] ?? '').trim();
    const accountName = nameIdx >= 0 ? String(row?.[nameIdx] ?? '').trim() : '';
    if (/^totals?$/i.test(accountCode) || /^totals?$/i.test(accountName)) {
      totalsRow = row; totalsEvidence = evidence; return;
    }
    if (!accountCode && !accountName) return;
    const rawDebit = row?.[debitIdx]; const rawCredit = row?.[creditIdx];
    const parsedDebit = numberValue(rawDebit); const parsedCredit = numberValue(rawCredit);
    if (parsedDebit === null && parsedCredit === null) return;
    const debit = round2(parsedDebit ?? 0); const credit = round2(parsedCredit ?? 0);
    if (Math.abs(debit) > 0 && Math.abs(credit) > 0) semanticWarnings.push(`Row ${idx + 2} contains both debit and credit amounts.`);
    const accountRef = refAt(evidence, accountIdx); const debitRef = refAt(evidence, debitIdx); const creditRef = refAt(evidence, creditIdx);
    if (!accountRef?.provenanceId || !accountRef?.coordinate) missingEvidence.push(`row-${idx + 2}-account`);
    if (parsedDebit !== null && (!debitRef?.provenanceId || !debitRef?.coordinate)) missingEvidence.push(`row-${idx + 2}-debit`);
    if (parsedCredit !== null && (!creditRef?.provenanceId || !creditRef?.coordinate)) missingEvidence.push(`row-${idx + 2}-credit`);
    const coords = [accountRef?.coordinate, debitRef?.coordinate, creditRef?.coordinate].filter(Boolean);
    const rowNumber = Number(accountRef?.coordinate?.rowIndex || debitRef?.coordinate?.rowIndex || creditRef?.coordinate?.rowIndex || idx + 2);
    lines.push({
      rowNumber, accountCode, accountName, debit, credit,
      hiddenRow: coords.some((c: any) => c?.hiddenRow === true),
      accountEvidenceRef: accountRef?.provenanceId, debitEvidenceRef: debitRef?.provenanceId, creditEvidenceRef: creditRef?.provenanceId,
      accountCoordinate: accountRef?.coordinate, debitCoordinate: debitRef?.coordinate, creditCoordinate: creditRef?.coordinate
    });
  });

  const totalDebits = round2(lines.reduce((sum, line) => sum + line.debit, 0));
  const totalCredits = round2(lines.reduce((sum, line) => sum + line.credit, 0));
  const variance = round2(totalDebits - totalCredits);
  const makeFormulaCell = (colIdx: number): TrialBalanceFormulaCell => {
    if (!totalsRow || !totalsEvidence || colIdx < 0) return { cachedValue: null };
    const ref = refAt(totalsEvidence, colIdx);
    return {
      cachedValue: numberValue(totalsRow[colIdx]), formula: ref?.coordinate?.formula, cellAddress: ref?.coordinate?.cellAddress,
      provenanceId: ref?.provenanceId, sourceCoordinate: ref?.coordinate
    };
  };
  const debitTotal = makeFormulaCell(debitIdx), creditTotal = makeFormulaCell(creditIdx), varianceCell = makeFormulaCell(varianceIdx);
  const formulaCells = [debitTotal, creditTotal, varianceCell];
  const anyFormula = formulaCells.some(cell => Boolean(cell.formula));
  const formulaIntegrityStatus: TrialBalanceFormulaIntegrity = !anyFormula ? 'NOT_PRESENT'
    : sameMoney(debitTotal.cachedValue, totalDebits) && sameMoney(creditTotal.cachedValue, totalCredits) && sameMoney(varianceCell.cachedValue, variance)
      ? 'MATCH' : 'STALE_OR_INCONSISTENT';
  const sourceCoverageStatus = missingEvidence.length === 0 && lines.length > 0 ? 'SOURCE_COMPLETE' : 'SOURCE_GAP';
  if (missingEvidence.length) semanticWarnings.push(`Missing exact spreadsheet evidence for: ${missingEvidence.join(', ')}`);
  const semanticStatus = sourceCoverageStatus === 'SOURCE_COMPLETE' && semanticWarnings.length === 0 ? 'TRIAL_BALANCE_ROWS_PARSED' : 'REVIEW_REQUIRED';
  let status: TrialBalanceStatus = 'INSUFFICIENT_EVIDENCE';
  if (sourceCoverageStatus === 'SOURCE_COMPLETE' && lines.length > 0) status = Math.abs(variance) < 0.005 && formulaIntegrityStatus !== 'STALE_OR_INCONSISTENT' ? 'BALANCED' : 'UNBALANCED';
  const promotionState: TrialBalancePromotionState = status === 'BALANCED' ? 'READY_FOR_AUTHORIZED_REVIEW' : status === 'UNBALANCED' ? 'BLOCKED_UNBALANCED' : 'BLOCKED_INSUFFICIENT';
  const evidenceRefs = unique([
    ...lines.flatMap(line => [line.accountEvidenceRef, line.debitEvidenceRef, line.creditEvidenceRef]),
    debitTotal.provenanceId, creditTotal.provenanceId, varianceCell.provenanceId
  ]);
  return {
    sourceSha256, sourceArtifactId, sourceDocument, sheetName: table.sheetName || table.name || 'NOT_RECORDED', sourceRange: table.rangeAddress,
    currency: params.currency, accountLineCount: lines.length, hiddenAccountLineCount: lines.filter(line => line.hiddenRow).length, lines,
    totalDebits, totalCredits, variance, status, formulaIntegrityStatus, promotionState,
    formulaReview: { debitTotal, creditTotal, variance: varianceCell }, sourceCoverageStatus, semanticStatus, semanticWarnings, evidenceRefs
  };
}

export function buildTrialBalanceFiveDimensionChecks(review: TrialBalanceReview, adversarial: TrialBalanceReview): {
  source: FiveDimensionCheck[]; semantic: FiveDimensionCheck[]; accounting: FiveDimensionCheck[];
} {
  const hidden = review.lines.find(line => line.hiddenRow);
  const formulaRefs = [review.formulaReview.debitTotal.provenanceId, review.formulaReview.creditTotal.provenanceId, review.formulaReview.variance.provenanceId].filter(Boolean) as string[];
  return {
    source: [
      { checkId: 'tb-source-sha-sheet-range', label: 'Trial balance source SHA and exact worksheet/range are retained', outcome: review.sourceSha256 && review.sheetName === 'Trial Balance' && review.sourceRange === 'A1:E8' ? 'PASS' : 'FAIL', evidenceRefs: [`source:${review.sourceSha256}`, ...formulaRefs], details: [`sheet=${review.sheetName}; range=${review.sourceRange}`] },
      { checkId: 'tb-hidden-row-source-lineage', label: 'Hidden ledger row remains in the source population with exact cell lineage', outcome: hidden?.accountCode === '1999' && hidden.debitCoordinate?.cellAddress === 'C4' && hidden.debitCoordinate?.hiddenRow === true ? 'PASS' : 'FAIL', evidenceRefs: hidden ? [hidden.accountEvidenceRef, hidden.debitEvidenceRef].filter(Boolean) as string[] : [], details: [hidden ? `row=${hidden.rowNumber}; debitCell=${hidden.debitCoordinate?.cellAddress}` : 'hidden row missing'] },
      { checkId: 'tb-formula-source-lineage', label: 'Total debit, total credit and variance formulas retain exact spreadsheet coordinates', outcome: review.formulaReview.debitTotal.cellAddress === 'C8' && review.formulaReview.creditTotal.cellAddress === 'D8' && review.formulaReview.variance.cellAddress === 'E8' && formulaRefs.length === 3 ? 'PASS' : 'FAIL', evidenceRefs: formulaRefs, details: [review.formulaReview.debitTotal.formula || '', review.formulaReview.creditTotal.formula || '', review.formulaReview.variance.formula || ''] }
    ],
    semantic: [
      { checkId: 'tb-account-row-semantics', label: 'Account rows are separated from formula total rows without dropping hidden accounts', outcome: review.accountLineCount === 6 && review.hiddenAccountLineCount === 1 && review.semanticStatus === 'TRIAL_BALANCE_ROWS_PARSED' ? 'PASS' : 'FAIL', evidenceRefs: review.evidenceRefs, details: [`accounts=${review.accountLineCount}; hidden=${review.hiddenAccountLineCount}`] },
      { checkId: 'tb-debit-credit-semantics', label: 'Debit and credit columns are interpreted as separate trial-balance sides', outcome: review.lines.every(line => !(line.debit !== 0 && line.credit !== 0)) ? 'PASS' : 'FAIL', evidenceRefs: review.evidenceRefs, details: review.semanticWarnings }
    ],
    accounting: [
      { checkId: 'tb-balanced-recompute', label: 'Trial balance is recomputed from account rows and balances to zero variance', outcome: review.totalDebits === 1600 && review.totalCredits === 1600 && review.variance === 0 && review.status === 'BALANCED' ? 'PASS' : 'FAIL', evidenceRefs: review.evidenceRefs, details: [`debits=${review.totalDebits}; credits=${review.totalCredits}; variance=${review.variance}`] },
      { checkId: 'tb-formula-cache-reconciliation', label: 'Cached total formulas agree with recomputed row totals', outcome: review.formulaIntegrityStatus === 'MATCH' ? 'PASS' : 'FAIL', evidenceRefs: formulaRefs, details: [`formulaIntegrity=${review.formulaIntegrityStatus}`] },
      { checkId: 'tb-stale-cache-fail-closed', label: 'Stale cached spreadsheet totals cannot override an unbalanced underlying ledger', outcome: adversarial.totalDebits === 1590 && adversarial.totalCredits === 1600 && adversarial.variance === -10 && adversarial.formulaIntegrityStatus === 'STALE_OR_INCONSISTENT' && adversarial.status === 'UNBALANCED' && adversarial.promotionState === 'BLOCKED_UNBALANCED' ? 'PASS' : 'FAIL', evidenceRefs: adversarial.evidenceRefs, details: [`debits=${adversarial.totalDebits}; credits=${adversarial.totalCredits}; variance=${adversarial.variance}; formula=${adversarial.formulaIntegrityStatus}; promotion=${adversarial.promotionState}`] }
    ]
  };
}
