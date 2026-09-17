import crypto from 'node:crypto';
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
