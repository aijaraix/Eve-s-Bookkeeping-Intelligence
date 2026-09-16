from pathlib import Path


def write(path: str, content: str) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding='utf-8')


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'PATCH_TARGET_MISSING:{path}:{old[:80]}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')


def replace_count(path: str, old: str, new: str, expected: int) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    actual = text.count(old)
    if actual != expected:
        raise SystemExit(f'PATCH_COUNT_MISMATCH:{path}:expected={expected}:actual={actual}:{old[:80]}')
    p.write_text(text.replace(old, new), encoding='utf-8')


write('server/cpaOrganization/trialBalanceInterpretationEngine.ts', r'''import type { CanonicalDocumentModel } from '../../src/lib/parser/types.js';
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
''')

write('server/tests/fixtures/trialBalanceWorkbookFixture.ts', r'''import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import * as XLSXModule from 'xlsx';
const XLSX: any = (XLSXModule as any).default || XLSXModule;

export type TrialBalanceFixtureVariant = 'balanced' | 'stale-cache-unbalanced';
export const TB_WORKSPACE_ID='ws-academy-trial-balance';
export const TB_ENGAGEMENT_ID='eng-academy-trial-balance';
export const TB_DOCUMENT_ID='doc-academy-trial-balance';
export function trialBalanceEvidenceDir(): string { return process.env.TRIAL_BALANCE_ACCEPTANCE_EVIDENCE_DIR || '/tmp/eve-trial-balance-five-dimension'; }
export function sha256(bytes: Buffer): string { return crypto.createHash('sha256').update(bytes).digest('hex'); }
export function fixturePath(variant: TrialBalanceFixtureVariant): string { return path.join(trialBalanceEvidenceDir(),`trial-balance-${variant}.xlsx`); }
export function fixtureManifestPath(): string { return path.join(trialBalanceEvidenceDir(),'trial-balance-fixture-manifest.json'); }
export function loadTrialBalanceWorkbook(variant: TrialBalanceFixtureVariant): Buffer { return fs.readFileSync(fixturePath(variant)); }

export function buildTrialBalanceWorkbook(variant: TrialBalanceFixtureVariant): Buffer {
  const hiddenDebit = variant === 'balanced' ? 100 : 90;
  const wb: any = XLSX.utils.book_new();
  wb.Props = { Title:`Eve Academy Trial Balance ${variant}`, Subject:'Physical curriculum fixture', Author:'Eve Academy', Company:'Eve Academy', CreatedDate:new Date('2026-09-16T00:00:00.000Z'), ModifiedDate:new Date('2026-09-16T00:00:00.000Z') };
  const ws: any = XLSX.utils.aoa_to_sheet([
    ['Account','Account Name','Debit','Credit','Variance'],
    ['1000','Cash',1000,null,null],
    ['1100','Accounts Receivable',500,null,null],
    ['1999','Clearing',hiddenDebit,null,null],
    ['2000','Accounts Payable',null,400,null],
    ['3000','Equity',null,1000,null],
    ['4000','Revenue',null,200,null],
    ['TOTALS','',1600,1600,0]
  ]);
  ws.C8={t:'n',f:'SUM(C2:C7)',v:1600,z:'$#,##0.00'};
  ws.D8={t:'n',f:'SUM(D2:D7)',v:1600,z:'$#,##0.00'};
  ws.E8={t:'n',f:'C8-D8',v:0,z:'$#,##0.00'};
  ws['!ref']='A1:E8';
  ws['!rows']=Array.from({length:8},()=>({}));
  ws['!rows'][3]={hidden:true};
  ws['!cols']=[{wch:14},{wch:28},{wch:16},{wch:16},{wch:16}];
  XLSX.utils.book_append_sheet(wb,ws,'Trial Balance');
  return Buffer.from(XLSX.write(wb,{type:'buffer',bookType:'xlsx',compression:true,cellStyles:true}));
}
''')

write('server/tests/fixtures/trialBalanceAcceptanceHelpers.ts', r'''import { SpreadsheetParser } from '../../../src/lib/parser/spreadsheetParser.js';
import { interpretTrialBalance } from '../../cpaOrganization/trialBalanceInterpretationEngine.js';
import { TB_DOCUMENT_ID,TB_ENGAGEMENT_ID,TB_WORKSPACE_ID,loadTrialBalanceWorkbook,type TrialBalanceFixtureVariant } from './trialBalanceWorkbookFixture.js';

export async function prepareTrialBalanceCase(variant: TrialBalanceFixtureVariant){
  const bytes=loadTrialBalanceWorkbook(variant); const parser=new SpreadsheetParser(); const inspection=await parser.inspect({filename:`trial-balance-${variant}.xlsx`,originalName:`trial-balance-${variant}.xlsx`,buffer:bytes,mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}); const doc:any=await parser.parse({filename:`trial-balance-${variant}.xlsx`,originalName:`trial-balance-${variant}.xlsx`,buffer:bytes,mimeType:inspection.mimeType,size:bytes.length},inspection); const review=interpretTrialBalance({doc,currency:'USD'}); return {bytes,doc,review,sourceSha:doc.source.hash,documentId:TB_DOCUMENT_ID};
}
export function buildTrialBalanceFact(prepared:any){ const cell=prepared.review.formulaReview.variance; return { id:'fact-trial-balance-variance',canonicalMetric:'trial_balance_variance',labelOriginal:'Trial Balance Variance',labelNormalized:'Trial Balance Variance',normalizedValue:prepared.review.variance,valueFunctional:String(prepared.review.variance),valueOriginal:String(prepared.review.variance),reportingPeriod:'2026-09',period:'2026-09',currencyOriginal:'USD',functionalCurrency:'USD',status:'REVIEW_READY',verificationStatus:'VERIFIED',evidenceStatus:'CONFIRMED',documentId:prepared.documentId,sourceDocument:'trial-balance-balanced.xlsx',sourceText:`Trial Balance!${cell.cellAddress} ${cell.formula} cached=${cell.cachedValue}`,pageNumber:1,sourceSha256:prepared.sourceSha,sourceArtifactId:prepared.review.sourceArtifactId,sourceProvenanceId:cell.provenanceId,sourceProvenanceIds:[cell.provenanceId],sourceCoordinate:cell.sourceCoordinate,sourceCoordinates:[cell.sourceCoordinate],sourceExtractionMethod:cell.sourceCoordinate?.extractionMethod,sourceExtractionVersion:cell.sourceCoordinate?.extractionVersion}; }
export function buildTrialBalanceEngagement(prepared:any){ const fact=buildTrialBalanceFact(prepared); return {engagementId:TB_ENGAGEMENT_ID,workspaceId:TB_WORKSPACE_ID,classification:'ACADEMY',isCustomer:false,clientName:'Eve Academy Trial Balance Fixture',period:'2026-09',framework:'GENERAL_LEDGER_REVIEW',functionalCurrency:'USD',currentStage:'EVIDENCE_REVIEW',documents:[{id:prepared.documentId,originalName:'trial-balance-balanced.xlsx',filename:'trial-balance-balanced.xlsx',sha256:prepared.sourceSha}],facts:[fact],canonicalFacts:[fact],reports:[],findings:[],trialBalanceReview:prepared.review}; }
''')

write('server/tests/generateTrialBalanceCurriculumFixtures.ts', r'''import fs from 'node:fs'; import path from 'node:path'; import { buildTrialBalanceWorkbook,fixtureManifestPath,fixturePath,sha256,trialBalanceEvidenceDir,type TrialBalanceFixtureVariant } from './fixtures/trialBalanceWorkbookFixture.js';
const dir=trialBalanceEvidenceDir(); fs.rmSync(dir,{recursive:true,force:true}); fs.mkdirSync(dir,{recursive:true}); const variants:TrialBalanceFixtureVariant[]=['balanced','stale-cache-unbalanced']; const manifest:any={}; for(const variant of variants){const bytes=buildTrialBalanceWorkbook(variant); fs.writeFileSync(fixturePath(variant),bytes); manifest[variant]={filename:path.basename(fixturePath(variant)),bytes:bytes.length,sha256:sha256(bytes)};} fs.writeFileSync(fixtureManifestPath(),JSON.stringify(manifest,null,2)); console.log('TRIAL_BALANCE_PHYSICAL_FIXTURES=PASS'); console.log(JSON.stringify(manifest));
''')

write('server/tests/trialBalanceInterpretationEngine.test.ts', r'''import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import { prepareTrialBalanceCase } from './fixtures/trialBalanceAcceptanceHelpers.js'; import { buildTrialBalanceFiveDimensionChecks } from '../cpaOrganization/trialBalanceInterpretationEngine.js'; import { trialBalanceEvidenceDir } from './fixtures/trialBalanceWorkbookFixture.js';
const balanced=await prepareTrialBalanceCase('balanced'); const r=balanced.review; assert.match(balanced.sourceSha,/^[a-f0-9]{64}$/); assert.equal(r.sourceSha256,balanced.sourceSha); assert.equal(r.sheetName,'Trial Balance'); assert.equal(r.sourceRange,'A1:E8'); assert.equal(r.accountLineCount,6); assert.equal(r.hiddenAccountLineCount,1); assert.equal(r.totalDebits,1600); assert.equal(r.totalCredits,1600); assert.equal(r.variance,0); assert.equal(r.status,'BALANCED'); assert.equal(r.formulaIntegrityStatus,'MATCH'); assert.equal(r.promotionState,'READY_FOR_AUTHORIZED_REVIEW'); const hidden=r.lines.find((x:any)=>x.accountCode==='1999')!; assert.equal(hidden.hiddenRow,true); assert.equal(hidden.debit,100); assert.equal(hidden.debitCoordinate.cellAddress,'C4'); assert.equal(hidden.debitCoordinate.hiddenRow,true); assert.equal(r.formulaReview.debitTotal.cellAddress,'C8'); assert.equal(r.formulaReview.debitTotal.formula,'=SUM(C2:C7)'); assert.equal(r.formulaReview.creditTotal.cellAddress,'D8'); assert.equal(r.formulaReview.creditTotal.formula,'=SUM(D2:D7)'); assert.equal(r.formulaReview.variance.cellAddress,'E8'); assert.equal(r.formulaReview.variance.formula,'=C8-D8'); const bad=await prepareTrialBalanceCase('stale-cache-unbalanced'); assert.equal(bad.review.totalDebits,1590); assert.equal(bad.review.totalCredits,1600); assert.equal(bad.review.variance,-10); assert.equal(bad.review.formulaReview.debitTotal.cachedValue,1600); assert.equal(bad.review.formulaReview.creditTotal.cachedValue,1600); assert.equal(bad.review.formulaReview.variance.cachedValue,0); assert.equal(bad.review.formulaIntegrityStatus,'STALE_OR_INCONSISTENT'); assert.equal(bad.review.status,'UNBALANCED'); assert.equal(bad.review.promotionState,'BLOCKED_UNBALANCED'); const checks=buildTrialBalanceFiveDimensionChecks(r,bad.review); for(const group of [checks.source,checks.semantic,checks.accounting]) for(const check of group) assert.equal(check.outcome,'PASS',check.label); const dir=trialBalanceEvidenceDir(); fs.writeFileSync(path.join(dir,'source-accounting.json'),JSON.stringify({marker:'P2_TRIAL_BALANCE_SOURCE_ACCOUNTING=PASS',balancedSourceSha256:balanced.sourceSha,adversarialSourceSha256:bad.sourceSha,balanced:{debits:r.totalDebits,credits:r.totalCredits,variance:r.variance,status:r.status,formulaIntegrity:r.formulaIntegrityStatus,hiddenRows:r.hiddenAccountLineCount},adversarial:{debits:bad.review.totalDebits,credits:bad.review.totalCredits,variance:bad.review.variance,status:bad.review.status,formulaIntegrity:bad.review.formulaIntegrityStatus,promotionState:bad.review.promotionState},checks},null,2)); console.log('P2_TRIAL_BALANCE_SOURCE_ACCOUNTING=PASS');
''')

write('src/components/views/engagement/TrialBalanceReviewPanel.tsx', r'''import React from 'react';
const money=(value:any,currency?:string)=>typeof value==='number'?`${currency||'UNSPECIFIED'} ${value.toFixed(2)}`:'Not recorded';
const loc=(c:any)=>c?.sheetName&&c?.cellAddress?`${c.sheetName}!${c.cellAddress}`:'Not recorded';
export const TrialBalanceReviewPanel:React.FC<{review?:any}>=({review})=>{if(!review)return null; const f=review.formulaReview||{}; return <section className="border rounded-xl p-4 space-y-4" data-eve-trial-balance="true" data-eve-trial-balance-status={review.status} data-eve-trial-balance-formula-integrity={review.formulaIntegrityStatus} data-eve-trial-balance-promotion={review.promotionState}>
  <div><h2 className="font-semibold">Trial balance reconciliation review</h2><p className="text-sm">Debit/credit equality is recomputed from account rows. Cached spreadsheet formula values cannot override an inconsistent underlying ledger, and this review is not financial-statement completeness or posting approval.</p></div>
  <div className="grid md:grid-cols-2 gap-3 text-sm"><div className="border rounded-lg p-3"><strong>Source</strong><p>Worksheet / range: {review.sheetName}!{review.sourceRange}</p><p>Account lines: {review.accountLineCount}</p><p>Hidden account rows included: {review.hiddenAccountLineCount}</p><p>Source coverage: {review.sourceCoverageStatus}</p><p>Semantic status: {review.semanticStatus}</p></div><div className="border rounded-lg p-3"><strong>Trial-balance arithmetic</strong><p>Total debits: {money(review.totalDebits,review.currency)}</p><p>Total credits: {money(review.totalCredits,review.currency)}</p><p>Variance: {money(review.variance,review.currency)}</p><p>Trial balance status: {review.status}</p><p>Formula integrity: {review.formulaIntegrityStatus}</p><p>Promotion state: {review.promotionState}</p></div></div>
  <div className="border rounded-lg p-3 text-sm"><strong>Total formulas</strong><p>Debit total: {loc(f.debitTotal?.sourceCoordinate)} · {f.debitTotal?.formula||'No formula'} · cached {f.debitTotal?.cachedValue ?? 'Not recorded'}</p><p>Credit total: {loc(f.creditTotal?.sourceCoordinate)} · {f.creditTotal?.formula||'No formula'} · cached {f.creditTotal?.cachedValue ?? 'Not recorded'}</p><p>Variance: {loc(f.variance?.sourceCoordinate)} · {f.variance?.formula||'No formula'} · cached {f.variance?.cachedValue ?? 'Not recorded'}</p></div>
  <div className="space-y-2 text-sm"><strong>Ledger rows</strong>{(review.lines||[]).map((line:any)=><article key={`${line.rowNumber}-${line.accountCode}`} className="border rounded-lg p-3"><p>{line.accountCode} · {line.accountName} · row {line.rowNumber} · hidden {line.hiddenRow?'YES':'NO'}</p><p>Debit {money(line.debit,review.currency)} · Credit {money(line.credit,review.currency)}</p><p>Debit source: {loc(line.debitCoordinate)} · Credit source: {loc(line.creditCoordinate)}</p><p>Evidence: {[line.accountEvidenceRef,line.debitEvidenceRef,line.creditEvidenceRef].filter(Boolean).join(', ')||'Not recorded'}</p></article>)}</div>
  <p className="text-xs break-all">Source SHA-256: {review.sourceSha256||'Not recorded'}</p>
</section>;};
''')

write('server/tests/trialBalanceProductTruthBrowser.test.ts', r'''import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import puppeteer from 'puppeteer-core'; import { prepareTrialBalanceCase,buildTrialBalanceEngagement } from './fixtures/trialBalanceAcceptanceHelpers.js'; import { TB_ENGAGEMENT_ID,trialBalanceEvidenceDir } from './fixtures/trialBalanceWorkbookFixture.js';
const prepared=await prepareTrialBalanceCase('balanced'); const engagement=buildTrialBalanceEngagement(prepared); const baseUrl=process.env.EVE_TEST_BASE_URL||'http://127.0.0.1:4173'; const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean) as string[]; const executablePath=candidates.find(p=>fs.existsSync(p)); if(!executablePath)throw new Error('MISSING_BROWSER_EXECUTABLE'); const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']}); try{const page=await browser.newPage(); await page.setViewport({width:1440,height:1200}); await page.setRequestInterception(true); page.on('request',async req=>{try{const url=new URL(req.url()); if(url.origin!==new URL(baseUrl).origin||!url.pathname.startsWith('/api/'))return req.continue(); let payload:any={}; if(url.pathname==='/api/cpa/engagements/universal')payload={engagements:[{engagementId:engagement.engagementId,workspaceId:engagement.workspaceId,classification:'ACADEMY',isCustomer:false,clientName:engagement.clientName,period:engagement.period,framework:engagement.framework,functionalCurrency:engagement.functionalCurrency,currentStage:engagement.currentStage,openReviewNotesCount:0,documentsCount:1,canonicalFactsCount:engagement.canonicalFacts.length}]}; else if(url.pathname===`/api/cpa/engagements/${TB_ENGAGEMENT_ID}`)payload={engagement}; else if(url.pathname==='/api/cpa/reports/library')payload={reports:[]}; else if(url.pathname==='/api/queue/jobs')payload={jobs:[]}; else if(url.pathname==='/api/health')payload={status:'ok'}; await req.respond({status:200,contentType:'application/json',body:JSON.stringify(payload)});}catch{req.abort();}}); const response=await page.goto(`${baseUrl}/?view=engagement-evidence`,{waitUntil:'networkidle0',timeout:30000}); assert.ok(response?.ok()); const selector='[data-eve-trial-balance="true"]'; await page.waitForSelector(selector,{visible:true,timeout:15000}); const text=await page.$eval(selector,el=>(el as HTMLElement).innerText); for(const expected of ['Trial balance reconciliation review','Worksheet / range: Trial Balance!A1:E8','Account lines: 6','Hidden account rows included: 1','Total debits: USD 1600.00','Total credits: USD 1600.00','Variance: USD 0.00','Trial balance status: BALANCED','Formula integrity: MATCH','Promotion state: READY_FOR_AUTHORIZED_REVIEW','Trial Balance!C8','=SUM(C2:C7)','Trial Balance!D8','=SUM(D2:D7)','Trial Balance!E8','=C8-D8','1999 · Clearing','hidden YES','Trial Balance!C4',prepared.sourceSha])assert.ok(text.includes(expected),`trial-balance product panel missing ${expected}`); const attrs=await page.$eval(selector,(el:any)=>({status:el.dataset.eveTrialBalanceStatus,formula:el.dataset.eveTrialBalanceFormulaIntegrity,promotion:el.dataset.eveTrialBalancePromotion})); assert.deepEqual(attrs,{status:'BALANCED',formula:'MATCH',promotion:'READY_FOR_AUTHORIZED_REVIEW'}); const screenshot=path.join(trialBalanceEvidenceDir(),'trial-balance-product-truth.png'); await page.screenshot({path:screenshot,fullPage:true}); fs.writeFileSync(path.join(trialBalanceEvidenceDir(),'product-truth.json'),JSON.stringify({marker:'P2_TRIAL_BALANCE_PRODUCT_TRUTH_BROWSER=PASS',sourceSha256:prepared.sourceSha,status:prepared.review.status,formulaIntegrity:prepared.review.formulaIntegrityStatus,promotionState:prepared.review.promotionState,screenshot,browserVersion:await browser.version()},null,2)); console.log('P2_TRIAL_BALANCE_PRODUCT_TRUTH_BROWSER=PASS');}finally{await browser.close();}
''')

write('server/tests/trialBalanceDeliverableTruth.test.ts', r'''import assert from 'node:assert/strict'; import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path'; import * as XLSXModule from 'xlsx'; const XLSX:any=(XLSXModule as any).default||XLSXModule; import { prepareTrialBalanceCase,buildTrialBalanceFact } from './fixtures/trialBalanceAcceptanceHelpers.js'; import { TB_ENGAGEMENT_ID,TB_WORKSPACE_ID,trialBalanceEvidenceDir } from './fixtures/trialBalanceWorkbookFixture.js';
const prepared=await prepareTrialBalanceCase('balanced'); const dir=trialBalanceEvidenceDir(); const reports=path.join(dir,'reports'); fs.mkdirSync(reports,{recursive:true}); process.env.HERMES_REPORTS_DIR=reports; const {deliverableArtifactService}=await import('../cpaOrganization/deliverableArtifactService.js'); const fact=buildTrialBalanceFact(prepared); const report=await deliverableArtifactService.compileAndRegisterDeliverable({reportId:'REP-TRIAL-BALANCE',engagementId:TB_ENGAGEMENT_ID,workspaceId:TB_WORKSPACE_ID,version:'v1.0',title:'Trial Balance Evidence Review Draft',clientName:'Eve Academy Trial Balance Fixture',period:'September 2026',currency:'USD',status:'AI_PREPARED',facts:[{id:fact.id,canonicalMetric:fact.canonicalMetric,label:fact.labelNormalized,value:fact.normalizedValue,statement:'TRIAL_BALANCE',sourceDoc:'trial-balance-balanced.xlsx',page:1,verificationStatus:'VERIFIED',evidenceStatus:'CONFIRMED',documentId:fact.documentId,reportingPeriod:'September 2026',sourceText:fact.sourceText,sourceSha256:fact.sourceSha256,sourceArtifactId:fact.sourceArtifactId,sourceProvenanceId:fact.sourceProvenanceId,sourceProvenanceIds:fact.sourceProvenanceIds,sourceCoordinate:fact.sourceCoordinate,sourceCoordinates:fact.sourceCoordinates,sourceExtractionMethod:fact.sourceExtractionMethod,sourceExtractionVersion:fact.sourceExtractionVersion}],trialBalanceReview:prepared.review}); const pdf=fs.readFileSync(report.formats.pdf!.filepath); const pdfSha=crypto.createHash('sha256').update(pdf).digest('hex'); assert.equal(pdfSha,report.formats.pdf!.sha256); const {PDFParse}=await import('pdf-parse'); const parser=new PDFParse({data:pdf}); let pdfText=''; try{pdfText=(await parser.getText()).text;}finally{await parser.destroy();} for(const expected of ['Trial balance reconciliation review','Trial balance status: BALANCED','Total debits: 1600','Total credits: 1600','Variance: 0','Formula integrity: MATCH','Promotion state: READY_FOR_AUTHORIZED_REVIEW','Hidden account rows included: 1','Account 1999 | Clearing','Trial Balance!C4','SUM(C2:C7)','SUM(D2:D7)','C8-D8',prepared.sourceSha])assert.ok(pdfText.includes(expected),`PDF missing ${expected}`); const json=JSON.parse(fs.readFileSync(report.formats.json!.filepath,'utf8')); assert.equal(json.trialBalanceReview.sourceSha256,prepared.sourceSha); assert.equal(json.trialBalanceReview.status,'BALANCED'); assert.equal(json.trialBalanceReview.formulaIntegrityStatus,'MATCH'); assert.equal(json.trialBalanceReview.lines.find((l:any)=>l.accountCode==='1999').debitCoordinate.cellAddress,'C4'); const csv=fs.readFileSync(report.formats.csvLeadSchedules!.filepath,'utf8'); for(const expected of ['TRIAL BALANCE REVIEW','BALANCED','MATCH','1999','Clearing','Trial Balance!C4','SUM(C2:C7)',prepared.sourceSha])assert.ok(csv.includes(expected),`CSV missing ${expected}`); const wb=XLSX.readFile(report.formats.xlsx!.filepath); assert.ok(wb.Sheets['Trial Balance Review']); const sheetRows:any[][]=XLSX.utils.sheet_to_json(wb.Sheets['Trial Balance Review'],{header:1,raw:false}); const sheetText=sheetRows.flat().map(v=>String(v??'')).join(' | '); for(const expected of ['BALANCED','MATCH','1999','Clearing','Trial Balance!C4','SUM(C2:C7)',prepared.sourceSha])assert.ok(sheetText.includes(expected),`XLSX missing ${expected}`); fs.writeFileSync(path.join(dir,'deliverable-truth.json'),JSON.stringify({marker:'P2_TRIAL_BALANCE_DELIVERABLE_TRUTH=PASS',sourceSha256:prepared.sourceSha,reportId:report.reportId,version:report.version,pdfSha256:pdfSha,formats:{pdf:report.formats.pdf!.sha256,json:report.formats.json!.sha256,xlsx:report.formats.xlsx!.sha256,csv:report.formats.csvLeadSchedules!.sha256}},null,2)); console.log('P2_TRIAL_BALANCE_DELIVERABLE_TRUTH=PASS');
''')

write('server/tests/trialBalanceFiveDimensionAcceptance.test.ts', r'''import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import { academyMinervaLab } from '../cpaOrganization/academyMinervaLab.js'; import { buildTrialBalanceFiveDimensionChecks } from '../cpaOrganization/trialBalanceInterpretationEngine.js'; import { prepareTrialBalanceCase } from './fixtures/trialBalanceAcceptanceHelpers.js'; import { trialBalanceEvidenceDir } from './fixtures/trialBalanceWorkbookFixture.js';
const dir=trialBalanceEvidenceDir(); const source=JSON.parse(fs.readFileSync(path.join(dir,'source-accounting.json'),'utf8')); const product=JSON.parse(fs.readFileSync(path.join(dir,'product-truth.json'),'utf8')); const deliverable=JSON.parse(fs.readFileSync(path.join(dir,'deliverable-truth.json'),'utf8')); assert.equal(source.marker,'P2_TRIAL_BALANCE_SOURCE_ACCOUNTING=PASS'); assert.equal(product.marker,'P2_TRIAL_BALANCE_PRODUCT_TRUTH_BROWSER=PASS'); assert.equal(deliverable.marker,'P2_TRIAL_BALANCE_DELIVERABLE_TRUTH=PASS'); const balanced=await prepareTrialBalanceCase('balanced'); const adversarial=await prepareTrialBalanceCase('stale-cache-unbalanced'); assert.equal(product.sourceSha256,balanced.sourceSha); assert.equal(deliverable.sourceSha256,balanced.sourceSha); const checks=buildTrialBalanceFiveDimensionChecks(balanced.review,adversarial.review); const report=academyMinervaLab.evaluateFiveDimensions({caseId:'CURR-SPREADSHEET-GL-TRIAL-BALANCE',executionId:`trial-balance-${balanced.sourceSha.slice(0,12)}`,dimensions:{SOURCE_COVERAGE:{checks:checks.source},SEMANTIC_UNDERSTANDING:{checks:checks.semantic},ACCOUNTING_ACCURACY:{checks:checks.accounting},PRODUCT_TRUTH:{checks:[{checkId:'tb-real-product-browser',label:'Actual Eve trial-balance review renders exact spreadsheet and reconciliation state',outcome:'PASS',evidenceRefs:[`browser:${product.screenshot}`,`source:${balanced.sourceSha}`],details:[`status=${product.status}; formula=${product.formulaIntegrity}; promotion=${product.promotionState}`]}]},DELIVERABLE_TRUTH:{checks:[{checkId:'tb-artifact-reverse-lineage',label:'Trial-balance artifacts preserve reconciliation state, formula evidence and exact spreadsheet lineage',outcome:'PASS',evidenceRefs:[`artifact:pdf:${deliverable.formats.pdf}`,`artifact:json:${deliverable.formats.json}`,`artifact:xlsx:${deliverable.formats.xlsx}`,`artifact:csv:${deliverable.formats.csv}`],details:[`report=${deliverable.reportId}:${deliverable.version}`]}]}}}); for(const d of ['SOURCE_COVERAGE','SEMANTIC_UNDERSTANDING','ACCOUNTING_ACCURACY','PRODUCT_TRUTH','DELIVERABLE_TRUTH'] as const)assert.equal(report.dimensions[d].status,'PASS',`${d} must pass`); assert.equal(report.passedDimensionCount,5); assert.equal(report.notTestedDimensionCount,0); assert.equal(report.fullyTested,true); assert.equal(report.allRequiredDimensionsPassed,true); assert.equal(report.overallStatus,'FIVE_DIMENSION_PASS'); fs.writeFileSync(path.join(dir,'five-dimension-result.json'),JSON.stringify({marker:'P2_TRIAL_BALANCE_FIVE_DIMENSION_PASS=PASS',sourceSha256:balanced.sourceSha,adversarialSourceSha256:adversarial.sourceSha,report},null,2)); console.log('P2_TRIAL_BALANCE_FIVE_DIMENSION_PASS=PASS');
''')

# Product UI wiring
replace_once('src/components/views/engagement/RecordedEngagementEvidenceView.tsx',
"import { BankStatementCompletenessPanel } from './BankStatementCompletenessPanel';",
"import { BankStatementCompletenessPanel } from './BankStatementCompletenessPanel';\nimport { TrialBalanceReviewPanel } from './TrialBalanceReviewPanel';")
replace_once('src/components/views/engagement/RecordedEngagementEvidenceView.tsx',
"      <BankStatementCompletenessPanel review={detail.bankStatementCompleteness} />",
"      <TrialBalanceReviewPanel review={detail.trialBalanceReview} />\n      <BankStatementCompletenessPanel review={detail.bankStatementCompleteness} />")

# Deliverable service pass-through
replace_once('server/cpaOrganization/deliverableArtifactService.ts', "  bankStatementReview?: any;\n", "  bankStatementReview?: any;\n  trialBalanceReview?: any;\n")
replace_once('server/cpaOrganization/deliverableArtifactService.ts', "            bankStatementReview: data.bankStatementReview\n", "            bankStatementReview: data.bankStatementReview,\n            trialBalanceReview: data.trialBalanceReview\n")
replace_count('server/cpaOrganization/deliverableArtifactService.ts', "      bankStatementReview: params.bankStatementReview\n", "      bankStatementReview: params.bankStatementReview,\n      trialBalanceReview: params.trialBalanceReview\n", 2)
replace_once('server/cpaOrganization/deliverableArtifactService.ts', "      bankStatementReview: params.bankStatementReview || null\n", "      bankStatementReview: params.bankStatementReview || null,\n      trialBalanceReview: params.trialBalanceReview || null\n")
replace_once('server/cpaOrganization/deliverableArtifactService.ts', "    const csvContent = buildReviewCsv(normalizedFacts, currency, params.apReview, params.bankStatementReview);", "    const csvContent = buildReviewCsv(normalizedFacts, currency, params.apReview, params.bankStatementReview, params.trialBalanceReview);")
replace_once('server/cpaOrganization/deliverableArtifactService.ts', "      bankStatementReview: params.bankStatementReview || undefined\n", "      bankStatementReview: params.bankStatementReview || undefined,\n      trialBalanceReview: params.trialBalanceReview || undefined\n")

# Deliverable renderer: CSV
replace_once('server/cpaOrganization/reviewPackageRendering.ts',
"export function buildReviewCsv(facts: any[], currency: string, apReview?: any, bankReview?: any): string {",
"export function buildReviewCsv(facts: any[], currency: string, apReview?: any, bankReview?: any, trialBalanceReview?: any): string {")
replace_once('server/cpaOrganization/reviewPackageRendering.ts',
"  return sections.join('\\r\\n');\n}",
r'''  if (trialBalanceReview) {
    const t=trialBalanceReview, f=t.formulaReview||{};
    const tbRows:any[][]=[[],['TRIAL BALANCE REVIEW'],['Worksheet',t.sheetName],['Source Range',t.sourceRange],['Account Lines',t.accountLineCount],['Hidden Account Rows Included',t.hiddenAccountLineCount],['Total Debits',t.totalDebits],['Total Credits',t.totalCredits],['Variance',t.variance],['Trial Balance Status',t.status],['Formula Integrity',t.formulaIntegrityStatus],['Promotion State',t.promotionState],['Debit Total Formula',`${f.debitTotal?.sourceCoordinate?.sheetName||t.sheetName}!${f.debitTotal?.cellAddress||'NA'} ${f.debitTotal?.formula||'NO_FORMULA'} cached=${f.debitTotal?.cachedValue??'NA'}`],['Credit Total Formula',`${f.creditTotal?.sourceCoordinate?.sheetName||t.sheetName}!${f.creditTotal?.cellAddress||'NA'} ${f.creditTotal?.formula||'NO_FORMULA'} cached=${f.creditTotal?.cachedValue??'NA'}`],['Variance Formula',`${f.variance?.sourceCoordinate?.sheetName||t.sheetName}!${f.variance?.cellAddress||'NA'} ${f.variance?.formula||'NO_FORMULA'} cached=${f.variance?.cachedValue??'NA'}`],['Source SHA256',t.sourceSha256],['Evidence Refs',(t.evidenceRefs||[]).join(';')],[],['Account Code','Account Name','Debit','Credit','Row','Hidden','Debit Source','Credit Source','Evidence Refs'],...(t.lines||[]).map((line:any)=>[line.accountCode,line.accountName,line.debit,line.credit,line.rowNumber,line.hiddenRow?'YES':'NO',line.debitCoordinate?.sheetName&&line.debitCoordinate?.cellAddress?`${line.debitCoordinate.sheetName}!${line.debitCoordinate.cellAddress}`:'',line.creditCoordinate?.sheetName&&line.creditCoordinate?.cellAddress?`${line.creditCoordinate.sheetName}!${line.creditCoordinate.cellAddress}`:'',[line.accountEvidenceRef,line.debitEvidenceRef,line.creditEvidenceRef].filter(Boolean).join(';')])];
    sections.push(tbRows.map(row=>row.map(csvCell).join(',')).join('\r\n'));
  }
  return sections.join('\r\n');
}''')

# Deliverable renderer: PDF
replace_once('server/cpaOrganization/reviewPackageRendering.ts',
"  const facts=params.facts||[], jobs=params.specialistReview?.jobs||[];",
r'''  if (params.trialBalanceReview) {
    const t=params.trialBalanceReview, f=t.formulaReview||{};
    heading('Trial balance reconciliation review');
    text(`Worksheet / range: ${t.sheetName || 'NOT_RECORDED'}!${t.sourceRange || 'NOT_RECORDED'}\nAccount lines: ${t.accountLineCount}\nHidden account rows included: ${t.hiddenAccountLineCount}\nTotal debits: ${t.totalDebits}\nTotal credits: ${t.totalCredits}\nVariance: ${t.variance}\nTrial balance status: ${t.status}\nFormula integrity: ${t.formulaIntegrityStatus}\nPromotion state: ${t.promotionState}`);
    text(`Debit total formula: ${f.debitTotal?.sourceCoordinate?.sheetName || t.sheetName}!${f.debitTotal?.cellAddress || 'NA'} = ${f.debitTotal?.formula || 'NO_FORMULA'} | cached=${f.debitTotal?.cachedValue ?? 'NA'}\nCredit total formula: ${f.creditTotal?.sourceCoordinate?.sheetName || t.sheetName}!${f.creditTotal?.cellAddress || 'NA'} = ${f.creditTotal?.formula || 'NO_FORMULA'} | cached=${f.creditTotal?.cachedValue ?? 'NA'}\nVariance formula: ${f.variance?.sourceCoordinate?.sheetName || t.sheetName}!${f.variance?.cellAddress || 'NA'} = ${f.variance?.formula || 'NO_FORMULA'} | cached=${f.variance?.cachedValue ?? 'NA'}`);
    for (const line of t.lines||[]) text(`Account ${line.accountCode} | ${line.accountName} | Debit=${line.debit} | Credit=${line.credit} | row=${line.rowNumber} | hidden=${line.hiddenRow?'YES':'NO'} | debitSource=${line.debitCoordinate?.sheetName&&line.debitCoordinate?.cellAddress?`${line.debitCoordinate.sheetName}!${line.debitCoordinate.cellAddress}`:'NONE'} | creditSource=${line.creditCoordinate?.sheetName&&line.creditCoordinate?.cellAddress?`${line.creditCoordinate.sheetName}!${line.creditCoordinate.cellAddress}`:'NONE'}`);
    text(`Source SHA-256: ${t.sourceSha256 || 'NOT_RECORDED'}\nEvidence refs: ${(t.evidenceRefs||[]).join(', ') || 'NOT_RECORDED'}`);
    text('Trial-balance equality is recomputed from source account rows. It is not a financial-statement completeness conclusion and does not authorize posting or professional sign-off.');
  }
  const facts=params.facts||[], jobs=params.specialistReview?.jobs||[];''')

# Deliverable renderer: XLSX
replace_once('server/cpaOrganization/reviewPackageRendering.ts',
"  add('Specialist Review',[",
r'''  if(params.trialBalanceReview){ const t=params.trialBalanceReview, f=t.formulaReview||{}; add('Trial Balance Review',[
    ['Field','Recorded value'],['Worksheet',t.sheetName],['Source Range',t.sourceRange],['Account Lines',t.accountLineCount],['Hidden Account Rows Included',t.hiddenAccountLineCount],['Total Debits',t.totalDebits],['Total Credits',t.totalCredits],['Variance',t.variance],['Trial Balance Status',t.status],['Formula Integrity',t.formulaIntegrityStatus],['Promotion State',t.promotionState],['Debit Total Formula',`${f.debitTotal?.sourceCoordinate?.sheetName||t.sheetName}!${f.debitTotal?.cellAddress||'NA'} ${f.debitTotal?.formula||'NO_FORMULA'} cached=${f.debitTotal?.cachedValue??'NA'}`],['Credit Total Formula',`${f.creditTotal?.sourceCoordinate?.sheetName||t.sheetName}!${f.creditTotal?.cellAddress||'NA'} ${f.creditTotal?.formula||'NO_FORMULA'} cached=${f.creditTotal?.cachedValue??'NA'}`],['Variance Formula',`${f.variance?.sourceCoordinate?.sheetName||t.sheetName}!${f.variance?.cellAddress||'NA'} ${f.variance?.formula||'NO_FORMULA'} cached=${f.variance?.cachedValue??'NA'}`],['Source SHA256',t.sourceSha256],['Evidence Refs',(t.evidenceRefs||[]).join(';')],[],['Account Code','Account Name','Debit','Credit','Row','Hidden','Debit Source','Credit Source','Evidence Refs'],...(t.lines||[]).map((line:any)=>[line.accountCode,line.accountName,line.debit,line.credit,line.rowNumber,line.hiddenRow?'YES':'NO',line.debitCoordinate?.sheetName&&line.debitCoordinate?.cellAddress?`${line.debitCoordinate.sheetName}!${line.debitCoordinate.cellAddress}`:'',line.creditCoordinate?.sheetName&&line.creditCoordinate?.cellAddress?`${line.creditCoordinate.sheetName}!${line.creditCoordinate.cellAddress}`:'',[line.accountEvidenceRef,line.debitEvidenceRef,line.creditEvidenceRef].filter(Boolean).join(';')])
  ],[34,100,20,20,14,14,28,28,80]); }
  add('Specialist Review',[''')
# previous replacement intentionally changes opening; restore correct array token
replace_once('server/cpaOrganization/reviewPackageRendering.ts', "  add('Specialist Review',['\n", "  add('Specialist Review',[\n")

# Academy curriculum family and case
replace_once('server/cpaOrganization/academyMinervaLab.ts', "  | 'DELIVERABLE_LINEAGE';", "  | 'DELIVERABLE_LINEAGE'\n  | 'LEDGER_RECONCILIATION';")
trial_case = r'''      caseSpec(
        'CURR-SPREADSHEET-GL-TRIAL-BALANCE',
        'Spreadsheet general ledger trial-balance reconciliation with exact cell/formula lineage',
        'LEDGER_RECONCILIATION',
        ['SPREADSHEET', 'GENERAL_LEDGER', 'TRIAL_BALANCE'],
        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH'],
        [
          'Recompute debit and credit totals from account rows rather than trusting cached spreadsheet total cells.',
          'Include hidden ledger rows in the population and retain their exact workbook/sheet/cell provenance.',
          'Preserve total and variance formulas, cached values, source SHA and source provenance IDs.',
          'A stale cached formula cannot override an unbalanced underlying ledger; unbalanced trial balances must be blocked.',
          'Trial-balance equality is distinct from Assets = Liabilities + Equity and does not establish financial-statement completeness or posting approval.',
          'Actual product and exported draft artifacts must preserve trial-balance state plus reverse lineage.'
        ],
        'CONTRACT_READY',
        ['server/tests/trialBalanceInterpretationEngine.test.ts', 'server/tests/trialBalanceProductTruthBrowser.test.ts', 'server/tests/trialBalanceDeliverableTruth.test.ts', 'server/tests/trialBalanceFiveDimensionAcceptance.test.ts', 'docs/launch/evidence/2026-09-16_P2_TRIAL_BALANCE_FIVE_DIMENSION_ACCEPTANCE.md']
      ),
'''
replace_once('server/cpaOrganization/academyMinervaLab.ts', "      caseSpec(\n        'CURR-PBC-INSUFFICIENT-RESPONSE',", trial_case + "      caseSpec(\n        'CURR-PBC-INSUFFICIENT-RESPONSE',")

# Curriculum regression counts and assertions
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts', "assert.equal(cases.length, 19);", "assert.equal(cases.length, 20);")
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts', "assert.equal(new Set(cases.map(c => c.caseId)).size, 19);", "assert.equal(new Set(cases.map(c => c.caseId)).size, 20);")
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts', "assert.equal(coverage.totalCases, 19);", "assert.equal(coverage.totalCases, 20);")
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts', "assert.equal(coverage.contractReadyCases, 7);", "assert.equal(coverage.contractReadyCases, 8);")
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts', "  'CURR-MIXED-SPREADSHEET-RECEIPT',\n", "  'CURR-MIXED-SPREADSHEET-RECEIPT',\n  'CURR-SPREADSHEET-GL-TRIAL-BALANCE',\n")
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts', "assert.ok(find('CURR-OCR-ENGINE-DISAGREEMENT').expectedSafeguards.join(' ').includes('Preserve both engine outputs'));", "assert.equal(find('CURR-SPREADSHEET-GL-TRIAL-BALANCE').fixtureStatus, 'CONTRACT_READY');\nassert.deepEqual(find('CURR-SPREADSHEET-GL-TRIAL-BALANCE').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);\nassert.ok(find('CURR-SPREADSHEET-GL-TRIAL-BALANCE').expectedSafeguards.join(' ').includes('stale cached formula'));\nassert.ok(find('CURR-SPREADSHEET-GL-TRIAL-BALANCE').validationRefs.includes('server/tests/trialBalanceFiveDimensionAcceptance.test.ts'));\nassert.ok(find('CURR-OCR-ENGINE-DISAGREEMENT').expectedSafeguards.join(' ').includes('Preserve both engine outputs'));")

print('TRIAL_BALANCE_FIVE_DIMENSION_PATCH_APPLIED')
