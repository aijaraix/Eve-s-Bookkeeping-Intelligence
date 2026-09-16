from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p=Path(path); text=p.read_text()
    if old not in text:
        raise SystemExit(f'TARGET_MISSING:{path}:{old[:140]}')
    p.write_text(text.replace(old,new,1))


def write(path: str, content: str):
    p=Path(path); p.parent.mkdir(parents=True,exist_ok=True); p.write_text(content)

write('server/cpaOrganization/mixedSourceReconciliationEngine.ts', r'''import type { FiveDimensionCheck } from './academyMinervaLab.js';

export type MixedSourceStatus = 'AGREED' | 'CONFLICT' | 'INSUFFICIENT_EVIDENCE';
export type MixedSourcePromotionState = 'READY_FOR_AUTHORIZED_REVIEW' | 'BLOCKED_SOURCE_CONFLICT' | 'BLOCKED_INSUFFICIENT';

export interface MixedSourceParentEvidence {
  sourceKind: 'SPREADSHEET' | 'RECEIPT_IMAGE';
  factId: string;
  value: number;
  currency: string;
  sourceSha256: string;
  sourceArtifactId?: string;
  provenanceId: string;
  sourceCoordinate: any;
  sourceText: string;
}

export interface MixedSourceReconciliationReview {
  conclusionId: string;
  canonicalMetric: string;
  status: MixedSourceStatus;
  promotionState: MixedSourcePromotionState;
  decision: 'PROMOTE_MATCHED_VALUE_FOR_AUTHORIZED_REVIEW' | 'REQUEST_SOURCE_RECONCILIATION' | 'REQUEST_MISSING_EVIDENCE';
  authoritativeValue: number | null;
  currency: string | null;
  spreadsheetValue: number | null;
  receiptValue: number | null;
  difference: number | null;
  sourceCoverageStatus: 'COMPLETE' | 'SOURCE_GAP';
  semanticStatus: 'SAME_METRIC_SAME_CURRENCY' | 'REVIEW_REQUIRED';
  parentEvidence: MixedSourceParentEvidence[];
  evidenceRefs: string[];
  warnings: string[];
}

const money = (v:any): number | null => {
  const n = typeof v === 'number' ? v : Number(v?.normalizedValue ?? v?.valueFunctional ?? v?.value);
  return Number.isFinite(n) ? Math.round((n + Number.EPSILON) * 100) / 100 : null;
};
const currency = (f:any): string => String(f?.functionalCurrency || f?.currencyOriginal || f?.currency || '').trim().toUpperCase();
const metric = (f:any): string => String(f?.canonicalMetric || '').trim().toLowerCase();
const sha = (f:any): string => String(f?.sourceSha256 || f?.sourceCoordinate?.sourceSha256 || '').trim();
const prov = (f:any): string => String(f?.sourceProvenanceId || f?.sourceProvenanceIds?.[0] || '').trim();
const coord = (f:any): any => f?.sourceCoordinate || f?.sourceCoordinates?.[0];
const artifact = (f:any): string | undefined => f?.sourceArtifactId || coord(f)?.sourceArtifactId;
const uniq = (v:string[]) => [...new Set(v.filter(Boolean))];

function parent(f:any, kind: MixedSourceParentEvidence['sourceKind']): MixedSourceParentEvidence | null {
  const value=money(f), c=currency(f), s=sha(f), p=prov(f), co=coord(f);
  if (value===null || !c || !s || !p || !co) return null;
  return { sourceKind:kind, factId:String(f?.id||''), value, currency:c, sourceSha256:s, sourceArtifactId:artifact(f), provenanceId:p, sourceCoordinate:co, sourceText:String(f?.sourceText||'') };
}

export function reconcileSpreadsheetReceipt(params:{spreadsheetFact:any; receiptFact:any; canonicalMetric?:string}): MixedSourceReconciliationReview {
  const canonicalMetric=String(params.canonicalMetric || metric(params.spreadsheetFact) || metric(params.receiptFact) || 'operating_expenses');
  const spreadsheet=parent(params.spreadsheetFact,'SPREADSHEET');
  const receipt=parent(params.receiptFact,'RECEIPT_IMAGE');
  const parents=[spreadsheet,receipt].filter(Boolean) as MixedSourceParentEvidence[];
  const warnings:string[]=[];
  const coverageOk=Boolean(spreadsheet && receipt && spreadsheet.factId && receipt.factId && spreadsheet.sourceCoordinate?.sourceType==='SPREADSHEET' && receipt.sourceCoordinate?.sourceType==='IMAGE');
  const semanticOk=Boolean(coverageOk && metric(params.spreadsheetFact)===metric(params.receiptFact) && spreadsheet!.currency===receipt!.currency);
  if (!coverageOk) warnings.push('Both exact spreadsheet-cell and receipt-image source lineages are required.');
  if (coverageOk && !semanticOk) warnings.push('Mixed sources do not establish the same metric and currency.');
  if (!coverageOk || !semanticOk) {
    return { conclusionId:'mixed-expense-evidence-reconciliation', canonicalMetric, status:'INSUFFICIENT_EVIDENCE', promotionState:'BLOCKED_INSUFFICIENT', decision:'REQUEST_MISSING_EVIDENCE', authoritativeValue:null, currency:semanticOk?spreadsheet!.currency:null, spreadsheetValue:spreadsheet?.value??null, receiptValue:receipt?.value??null, difference:null, sourceCoverageStatus:coverageOk?'COMPLETE':'SOURCE_GAP', semanticStatus:semanticOk?'SAME_METRIC_SAME_CURRENCY':'REVIEW_REQUIRED', parentEvidence:parents, evidenceRefs:uniq(parents.flatMap(p=>[`source:${p.sourceSha256}`,p.provenanceId])), warnings };
  }
  const difference=Math.round(((spreadsheet!.value-receipt!.value)+Number.EPSILON)*100)/100;
  const agreed=Math.abs(difference)<0.005;
  if (!agreed) warnings.push(`Spreadsheet and receipt disagree by ${difference.toFixed(2)} ${spreadsheet!.currency}; neither source is silently preferred.`);
  return { conclusionId:'mixed-expense-evidence-reconciliation', canonicalMetric, status:agreed?'AGREED':'CONFLICT', promotionState:agreed?'READY_FOR_AUTHORIZED_REVIEW':'BLOCKED_SOURCE_CONFLICT', decision:agreed?'PROMOTE_MATCHED_VALUE_FOR_AUTHORIZED_REVIEW':'REQUEST_SOURCE_RECONCILIATION', authoritativeValue:agreed?spreadsheet!.value:null, currency:spreadsheet!.currency, spreadsheetValue:spreadsheet!.value, receiptValue:receipt!.value, difference, sourceCoverageStatus:'COMPLETE', semanticStatus:'SAME_METRIC_SAME_CURRENCY', parentEvidence:parents, evidenceRefs:uniq(parents.flatMap(p=>[`source:${p.sourceSha256}`,p.provenanceId])), warnings };
}

export function buildMixedSourceFiveDimensionChecks(agreement:MixedSourceReconciliationReview, conflict:MixedSourceReconciliationReview):{source:FiveDimensionCheck[];semantic:FiveDimensionCheck[];accounting:FiveDimensionCheck[]} {
  const sp=conflict.parentEvidence.find(p=>p.sourceKind==='SPREADSHEET'); const rc=conflict.parentEvidence.find(p=>p.sourceKind==='RECEIPT_IMAGE');
  return {
    source:[
      {checkId:'mixed-two-source-lineages',label:'Both independent source families retain exact reverse lineage',outcome:sp?.sourceCoordinate?.sourceType==='SPREADSHEET'&&sp?.sourceCoordinate?.sheetName==='Expense Register'&&sp?.sourceCoordinate?.cellAddress==='C2'&&rc?.sourceCoordinate?.sourceType==='IMAGE'&&rc?.sourceCoordinate?.ocrRegionId==='fixture-total-glyph-region'?'PASS':'FAIL',evidenceRefs:conflict.evidenceRefs,details:[`spreadsheet=${sp?.sourceCoordinate?.sheetName}!${sp?.sourceCoordinate?.cellAddress}; receiptRegion=${rc?.sourceCoordinate?.ocrRegionId}`]},
      {checkId:'mixed-independent-source-hashes',label:'Spreadsheet and receipt remain cryptographically distinct sources',outcome:Boolean(sp?.sourceSha256&&rc?.sourceSha256&&sp.sourceSha256!==rc.sourceSha256)?'PASS':'FAIL',evidenceRefs:conflict.evidenceRefs,details:[`spreadsheetSha=${sp?.sourceSha256}; receiptSha=${rc?.sourceSha256}`]}
    ],
    semantic:[
      {checkId:'mixed-same-metric-currency',label:'Spreadsheet and receipt are recognized as evidence for the same metric and currency',outcome:agreement.semanticStatus==='SAME_METRIC_SAME_CURRENCY'&&conflict.semanticStatus==='SAME_METRIC_SAME_CURRENCY'&&agreement.currency==='USD'&&conflict.currency==='USD'?'PASS':'FAIL',evidenceRefs:[...agreement.evidenceRefs,...conflict.evidenceRefs],details:[`agreement=${agreement.semanticStatus}; conflict=${conflict.semanticStatus}`]},
      {checkId:'mixed-independent-evidence-not-flattened',label:'Independent source kinds remain distinguishable after reconciliation',outcome:new Set(conflict.parentEvidence.map(p=>p.sourceKind)).size===2?'PASS':'FAIL',evidenceRefs:conflict.evidenceRefs,details:conflict.parentEvidence.map(p=>`${p.sourceKind}:${p.factId}`)}
    ],
    accounting:[
      {checkId:'mixed-agreement-promotes-only-matched-value',label:'Matching source values reconcile to one reviewable value',outcome:agreement.status==='AGREED'&&agreement.spreadsheetValue===53.23&&agreement.receiptValue===53.23&&agreement.difference===0&&agreement.authoritativeValue===53.23&&agreement.promotionState==='READY_FOR_AUTHORIZED_REVIEW'?'PASS':'FAIL',evidenceRefs:agreement.evidenceRefs,details:[`spreadsheet=${agreement.spreadsheetValue}; receipt=${agreement.receiptValue}; authoritative=${agreement.authoritativeValue}`]},
      {checkId:'mixed-conflict-fails-closed',label:'Contradictory receipt evidence cannot be masked by the spreadsheet value',outcome:conflict.status==='CONFLICT'&&conflict.spreadsheetValue===54.23&&conflict.receiptValue===53.23&&conflict.difference===1&&conflict.authoritativeValue===null&&conflict.promotionState==='BLOCKED_SOURCE_CONFLICT'&&conflict.decision==='REQUEST_SOURCE_RECONCILIATION'?'PASS':'FAIL',evidenceRefs:conflict.evidenceRefs,details:[`spreadsheet=${conflict.spreadsheetValue}; receipt=${conflict.receiptValue}; difference=${conflict.difference}; promotion=${conflict.promotionState}`]}
    ]
  };
}
''')

write('server/tests/fixtures/mixedSpreadsheetReceiptFixture.ts', r'''import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path'; import * as XLSXModule from 'xlsx'; const XLSX:any=(XLSXModule as any).default||XLSXModule;
export type MixedSpreadsheetVariant='agreement'|'conflict';
export const MIXED_WORKSPACE_ID='ws-academy-mixed-spreadsheet-receipt'; export const MIXED_ENGAGEMENT_ID='eng-academy-mixed-spreadsheet-receipt'; export const MIXED_SPREADSHEET_DOCUMENT_ID='doc-mixed-expense-register'; export const MIXED_RECEIPT_DOCUMENT_ID='doc-mixed-receipt-bdd93a72';
export function mixedEvidenceDir(){return process.env.MIXED_SOURCE_ACCEPTANCE_EVIDENCE_DIR||'/tmp/eve-mixed-spreadsheet-receipt';}
export function mixedWorkbookPath(v:MixedSpreadsheetVariant){return path.join(mixedEvidenceDir(),`mixed-expense-${v}.xlsx`);} export const sha256=(b:Buffer)=>crypto.createHash('sha256').update(b).digest('hex');
export function buildMixedWorkbook(v:MixedSpreadsheetVariant):Buffer { const amount=v==='agreement'?53.23:54.23; const wb:any=XLSX.utils.book_new(); wb.Props={Title:`Eve Mixed Source ${v}`,Subject:'Spreadsheet and receipt reconciliation fixture',Author:'Eve Academy',Company:'Eve Academy',CreatedDate:new Date('2026-09-16T00:00:00.000Z'),ModifiedDate:new Date('2026-09-16T00:00:00.000Z')}; const ws:any=XLSX.utils.aoa_to_sheet([['Evidence Type','Description','Amount','Currency'],['RECEIPT','TOTAL $53.23',amount,'USD']]); ws.C2={t:'n',v:amount,z:'$#,##0.00'}; ws['!ref']='A1:D2'; ws['!cols']=[{wch:18},{wch:30},{wch:16},{wch:12}]; XLSX.utils.book_append_sheet(wb,ws,'Expense Register'); return Buffer.from(XLSX.write(wb,{type:'buffer',bookType:'xlsx',compression:true,cellStyles:true})); }
export function loadMixedWorkbook(v:MixedSpreadsheetVariant):Buffer{return fs.readFileSync(mixedWorkbookPath(v));}
''')

write('server/tests/generateMixedSpreadsheetReceiptFixtures.ts', r'''import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import {buildMixedWorkbook,mixedEvidenceDir,mixedWorkbookPath,sha256,type MixedSpreadsheetVariant} from './fixtures/mixedSpreadsheetReceiptFixture.js'; const dir=mixedEvidenceDir();fs.mkdirSync(dir,{recursive:true});const manifest:any={};for(const v of ['agreement','conflict'] as MixedSpreadsheetVariant[]){const a=buildMixedWorkbook(v),b=buildMixedWorkbook(v);assert.equal(sha256(a),sha256(b),`${v} fixture must be deterministic`);fs.writeFileSync(mixedWorkbookPath(v),a);manifest[v]={filename:path.basename(mixedWorkbookPath(v)),bytes:a.length,sha256:sha256(a)};}fs.writeFileSync(path.join(dir,'mixed-workbook-manifest.json'),JSON.stringify(manifest,null,2));console.log('MIXED_SPREADSHEET_RECEIPT_PHYSICAL_FIXTURES=PASS');console.log(JSON.stringify(manifest));
''')

write('server/tests/fixtures/mixedSpreadsheetReceiptAcceptanceHelpers.ts', r'''import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path'; import { SpreadsheetParser } from '../../../src/lib/parser/spreadsheetParser.js'; import { buildReceiptFact, buildReceiptCoordinate, loadReceiptSourceRegionEvidence, RECEIPT_SHA256 } from './receiptFiveDimensionFixture.js'; import { reconcileSpreadsheetReceipt } from '../../cpaOrganization/mixedSourceReconciliationEngine.js'; import {MIXED_ENGAGEMENT_ID,MIXED_RECEIPT_DOCUMENT_ID,MIXED_SPREADSHEET_DOCUMENT_ID,MIXED_WORKSPACE_ID,loadMixedWorkbook,mixedEvidenceDir,sha256,type MixedSpreadsheetVariant} from './mixedSpreadsheetReceiptFixture.js';
export async function prepareMixedCase(v:MixedSpreadsheetVariant){const bytes=loadMixedWorkbook(v);const spreadsheetSha=sha256(bytes);const parser=new SpreadsheetParser();const doc:any=await parser.parse({filename:`mixed-expense-${v}.xlsx`,originalName:`mixed-expense-${v}.xlsx`,mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',size:bytes.length,buffer:bytes},{detectedType:'xlsx'} as any);assertSha(doc.source.hash,spreadsheetSha);const table=doc.tables.find((t:any)=>t.sheetName==='Expense Register');if(!table)throw new Error('MIXED_EXPENSE_SHEET_MISSING');const amountRef=table.rowEvidence?.[0]?.[2];if(!amountRef?.coordinate||amountRef.coordinate.cellAddress!=='C2')throw new Error('MIXED_SPREADSHEET_AMOUNT_PROVENANCE_MISSING');const amount=Number(table.rows?.[0]?.[2]);const spreadsheetFact:any={id:`fact-mixed-spreadsheet-${v}`,workspaceId:MIXED_WORKSPACE_ID,documentId:MIXED_SPREADSHEET_DOCUMENT_ID,canonicalMetric:'operating_expenses',labelOriginal:'Expense Register Receipt Total',labelNormalized:'Expense Register Receipt Total',valueOriginal:String(amount),valueFunctional:amount,normalizedValue:amount,currencyOriginal:'USD',functionalCurrency:'USD',reportingPeriod:'FY 2026',status:'APPROVED',verificationStatus:'VERIFIED',evidenceStatus:'CONFIRMED',sourceDocument:`mixed-expense-${v}.xlsx`,documentTitle:`mixed-expense-${v}.xlsx`,sourceText:`TOTAL $53.23 recorded as ${amount.toFixed(2)}`,sourceSha256:spreadsheetSha,sourceArtifactId:amountRef.coordinate.sourceArtifactId,sourceProvenanceId:amountRef.provenanceId,sourceProvenanceIds:[amountRef.provenanceId],sourceCoordinate:amountRef.coordinate,sourceCoordinates:[amountRef.coordinate],sourceExtractionMethod:'spreadsheet-native',sourceExtractionVersion:'1'};const receiptPath=path.join(mixedEvidenceDir(),'receipt.png');const receiptBytes=fs.readFileSync(receiptPath);assertSha(crypto.createHash('sha256').update(receiptBytes).digest('hex'),RECEIPT_SHA256);const region=loadReceiptSourceRegionEvidence();const accepted=buildReceiptFact(region);const receiptFact:any={...accepted,id:'fact-mixed-receipt-total-53-23',workspaceId:MIXED_WORKSPACE_ID,documentId:MIXED_RECEIPT_DOCUMENT_ID};const review=reconcileSpreadsheetReceipt({spreadsheetFact,receiptFact,canonicalMetric:'operating_expenses'});return{variant:v,bytes,spreadsheetSha,spreadsheetFact,receiptFact,review,region};}
function assertSha(actual:string,expected:string){if(actual!==expected)throw new Error(`MIXED_SOURCE_HASH_MISMATCH:${actual}:${expected}`);}
export function buildMixedEngagement(prepared:any){return{engagementId:MIXED_ENGAGEMENT_ID,workspaceId:MIXED_WORKSPACE_ID,classification:'ACADEMY',isCustomer:false,clientName:'Eve Academy Mixed Source Fixture',period:'FY 2026',framework:'MIXED_SOURCE_EVIDENCE_REVIEW',functionalCurrency:'USD',currentStage:'EVIDENCE_REVIEW',documents:[{id:MIXED_SPREADSHEET_DOCUMENT_ID,filename:`mixed-expense-${prepared.variant}.xlsx`,originalName:`mixed-expense-${prepared.variant}.xlsx`,sha256:prepared.spreadsheetSha},{id:MIXED_RECEIPT_DOCUMENT_ID,filename:'receipt.png',originalName:'receipt.png',sha256:RECEIPT_SHA256}],facts:[prepared.spreadsheetFact,prepared.receiptFact],canonicalFacts:[prepared.spreadsheetFact,prepared.receiptFact],reports:[],findings:prepared.review.status==='CONFLICT'?[{id:'finding-mixed-conflict',topic:'Mixed source conflict',description:'Spreadsheet and receipt values disagree; canonical promotion is blocked.',status:'OPEN',sourceReferences:prepared.review.evidenceRefs}]:[],mixedSourceReview:prepared.review};}
''')

write('src/components/views/engagement/MixedSourceReconciliationPanel.tsx', r'''import React from 'react';
const money=(v:any,c:any)=>typeof v==='number'?`${c||'UNSPECIFIED'} ${v.toFixed(2)}`:'Not recorded';
const coord=(p:any)=>p?.sourceCoordinate?.sourceType==='SPREADSHEET'?`${p.sourceCoordinate.sheetName||'Sheet'}!${p.sourceCoordinate.cellAddress||p.sourceCoordinate.rangeAddress||'Not recorded'}`:p?.sourceCoordinate?.sourceType==='IMAGE'?`IMAGE page ${p.sourceCoordinate.pageNumber||1} · region ${p.sourceCoordinate.ocrRegionId||'Not recorded'}`:'Not recorded';
export const MixedSourceReconciliationPanel:React.FC<{review?:any}>=({review})=>{if(!review)return null;const sp=(review.parentEvidence||[]).find((p:any)=>p.sourceKind==='SPREADSHEET');const rc=(review.parentEvidence||[]).find((p:any)=>p.sourceKind==='RECEIPT_IMAGE');return <section className="border rounded-xl p-4 space-y-4" data-eve-mixed-source="true" data-eve-mixed-status={review.status} data-eve-mixed-promotion={review.promotionState}>
<div><h2 className="font-semibold">Mixed-source spreadsheet / receipt reconciliation</h2><p className="text-sm">Independent source families remain separately traceable. A structured spreadsheet does not override contradictory receipt evidence.</p></div>
<div className="grid md:grid-cols-2 gap-3 text-sm"><div className="border rounded-lg p-3"><strong>Spreadsheet evidence</strong><p>Value: {money(review.spreadsheetValue,review.currency)}</p><p>Source: {coord(sp)}</p><p className="break-all">SHA-256: {sp?.sourceSha256||'Not recorded'}</p><p className="break-all">Provenance: {sp?.provenanceId||'Not recorded'}</p></div><div className="border rounded-lg p-3"><strong>Receipt evidence</strong><p>Value: {money(review.receiptValue,review.currency)}</p><p>Source: {coord(rc)}</p><p className="break-all">SHA-256: {rc?.sourceSha256||'Not recorded'}</p><p className="break-all">Provenance: {rc?.provenanceId||'Not recorded'}</p></div></div>
<div className="border rounded-lg p-3 text-sm"><strong>Reconciliation decision</strong><p>Status: {review.status}</p><p>Difference: {money(review.difference,review.currency)}</p><p>Promotion state: {review.promotionState}</p><p>Action: {review.decision}</p><p>Canonical promoted value: {review.authoritativeValue===null||review.authoritativeValue===undefined?'NOT PROMOTED':money(review.authoritativeValue,review.currency)}</p><p>Source coverage: {review.sourceCoverageStatus}</p><p>Semantic alignment: {review.semanticStatus}</p></div>
{(review.warnings||[]).length>0&&<div className="border rounded-lg p-3 text-sm"><strong>Review warnings</strong>{review.warnings.map((w:string,i:number)=><p key={i}>{w}</p>)}</div>}
</section>};
''')

write('server/tests/mixedSpreadsheetReceiptReconciliation.test.ts', r'''import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import {buildMixedSourceFiveDimensionChecks,reconcileSpreadsheetReceipt} from '../cpaOrganization/mixedSourceReconciliationEngine.js'; import {prepareMixedCase} from './fixtures/mixedSpreadsheetReceiptAcceptanceHelpers.js'; import {mixedEvidenceDir} from './fixtures/mixedSpreadsheetReceiptFixture.js';
const agree=await prepareMixedCase('agreement');const conflict=await prepareMixedCase('conflict');assert.equal(agree.review.status,'AGREED');assert.equal(agree.review.authoritativeValue,53.23);assert.equal(agree.review.difference,0);assert.equal(agree.review.promotionState,'READY_FOR_AUTHORIZED_REVIEW');assert.equal(conflict.review.status,'CONFLICT');assert.equal(conflict.review.spreadsheetValue,54.23);assert.equal(conflict.review.receiptValue,53.23);assert.equal(conflict.review.difference,1);assert.equal(conflict.review.authoritativeValue,null);assert.equal(conflict.review.promotionState,'BLOCKED_SOURCE_CONFLICT');assert.equal(conflict.review.decision,'REQUEST_SOURCE_RECONCILIATION');assert.equal(conflict.review.parentEvidence.length,2);const sp=conflict.review.parentEvidence.find((p:any)=>p.sourceKind==='SPREADSHEET')!;const rc=conflict.review.parentEvidence.find((p:any)=>p.sourceKind==='RECEIPT_IMAGE')!;assert.equal(sp.sourceCoordinate.sourceType,'SPREADSHEET');assert.equal(sp.sourceCoordinate.sheetName,'Expense Register');assert.equal(sp.sourceCoordinate.cellAddress,'C2');assert.equal(rc.sourceCoordinate.sourceType,'IMAGE');assert.equal(rc.sourceCoordinate.ocrRegionId,'fixture-total-glyph-region');assert.notEqual(sp.sourceSha256,rc.sourceSha256);const missing=reconcileSpreadsheetReceipt({spreadsheetFact:agree.spreadsheetFact,receiptFact:{...agree.receiptFact,sourceCoordinate:undefined,sourceCoordinates:[],sourceProvenanceId:undefined,sourceProvenanceIds:[]}});assert.equal(missing.status,'INSUFFICIENT_EVIDENCE');assert.equal(missing.promotionState,'BLOCKED_INSUFFICIENT');const checks=buildMixedSourceFiveDimensionChecks(agree.review,conflict.review);assert(checks.source.every(c=>c.outcome==='PASS'));assert(checks.semantic.every(c=>c.outcome==='PASS'));assert(checks.accounting.every(c=>c.outcome==='PASS'));const proof={marker:'P2_MIXED_SPREADSHEET_RECEIPT_SOURCE_ACCOUNTING=PASS',agreement:{spreadsheetSha:agree.spreadsheetSha,receiptSha:rc.sourceSha256,status:agree.review.status,authoritativeValue:agree.review.authoritativeValue},conflict:{spreadsheetSha:conflict.spreadsheetSha,receiptSha:rc.sourceSha256,status:conflict.review.status,difference:conflict.review.difference,promotion:conflict.review.promotionState},checks};fs.writeFileSync(path.join(mixedEvidenceDir(),'source-accounting.json'),JSON.stringify(proof,null,2));console.log('P2_MIXED_SPREADSHEET_RECEIPT_SOURCE_ACCOUNTING=PASS');
''')

write('server/tests/mixedSpreadsheetReceiptDeliverableTruth.test.ts', r'''import assert from 'node:assert/strict'; import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path'; import * as XLSXModule from 'xlsx'; const XLSX:any=(XLSXModule as any).default||XLSXModule; import {prepareMixedCase} from './fixtures/mixedSpreadsheetReceiptAcceptanceHelpers.js'; import {MIXED_ENGAGEMENT_ID,MIXED_WORKSPACE_ID,mixedEvidenceDir} from './fixtures/mixedSpreadsheetReceiptFixture.js';
const prepared=await prepareMixedCase('conflict');const dir=mixedEvidenceDir();const reports=path.join(dir,'reports');fs.mkdirSync(reports,{recursive:true});process.env.HERMES_REPORTS_DIR=reports;const {deliverableArtifactService}=await import('../cpaOrganization/deliverableArtifactService.js');const toFact=(f:any,sourceDoc:string)=>({id:f.id,canonicalMetric:f.canonicalMetric,label:f.labelNormalized,value:f.normalizedValue,statement:'MIXED_SOURCE_EVIDENCE',sourceDoc,page:f.pageNumber||1,verificationStatus:f.verificationStatus,evidenceStatus:f.evidenceStatus,documentId:f.documentId,reportingPeriod:f.reportingPeriod,sourceText:f.sourceText,sourceSha256:f.sourceSha256,sourceArtifactId:f.sourceArtifactId,sourceProvenanceId:f.sourceProvenanceId,sourceProvenanceIds:f.sourceProvenanceIds,sourceCoordinate:f.sourceCoordinate,sourceCoordinates:f.sourceCoordinates,sourceExtractionMethod:f.sourceExtractionMethod,sourceExtractionVersion:f.sourceExtractionVersion});const report=await deliverableArtifactService.compileAndRegisterDeliverable({reportId:'REP-MIXED-SPREADSHEET-RECEIPT',engagementId:MIXED_ENGAGEMENT_ID,workspaceId:MIXED_WORKSPACE_ID,version:'v1.0',title:'Mixed Source Spreadsheet Receipt Reconciliation Draft',clientName:'Eve Academy Mixed Source Fixture',period:'FY 2026',currency:'USD',status:'AI_PREPARED',facts:[toFact(prepared.spreadsheetFact,'mixed-expense-conflict.xlsx'),toFact(prepared.receiptFact,'receipt.png')],mixedSourceReview:prepared.review});const pdf=fs.readFileSync(report.formats.pdf!.filepath);const pdfSha=crypto.createHash('sha256').update(pdf).digest('hex');assert.equal(pdfSha,report.formats.pdf!.sha256);const {PDFParse}=await import('pdf-parse');const parser=new PDFParse({data:pdf});let pdfText='';try{pdfText=(await parser.getText()).text;}finally{await parser.destroy();}const sp=prepared.review.parentEvidence.find((p:any)=>p.sourceKind==='SPREADSHEET')!,rc=prepared.review.parentEvidence.find((p:any)=>p.sourceKind==='RECEIPT_IMAGE')!;for(const expected of ['Mixed-source spreadsheet / receipt reconciliation','Status: CONFLICT','Spreadsheet value: USD 54.23','Receipt value: USD 53.23','Difference: USD 1.00','Promotion state: BLOCKED_SOURCE_CONFLICT','Action: REQUEST_SOURCE_RECONCILIATION','Canonical promoted value: NOT PROMOTED','Expense Register!C2','fixture-total-glyph-region',sp.sourceSha256,rc.sourceSha256,sp.provenanceId,rc.provenanceId])assert.ok(pdfText.includes(expected),`PDF missing ${expected}`);const json=JSON.parse(fs.readFileSync(report.formats.json!.filepath,'utf8'));assert.equal(json.mixedSourceReview.status,'CONFLICT');assert.equal(json.mixedSourceReview.authoritativeValue,null);assert.equal(json.mixedSourceReview.parentEvidence.length,2);const csv=fs.readFileSync(report.formats.csvLeadSchedules!.filepath,'utf8');for(const expected of ['MIXED SOURCE RECONCILIATION','BLOCKED_SOURCE_CONFLICT','Expense Register!C2','fixture-total-glyph-region',sp.sourceSha256,rc.sourceSha256])assert.ok(csv.includes(expected),`CSV missing ${expected}`);const wb=XLSX.readFile(report.formats.xlsx!.filepath);assert.ok(wb.Sheets['Mixed Source Review']);const rows:any[][]=XLSX.utils.sheet_to_json(wb.Sheets['Mixed Source Review'],{header:1,raw:false});const txt=rows.flat().map(v=>String(v??'')).join(' | ');for(const expected of ['CONFLICT','BLOCKED_SOURCE_CONFLICT','Expense Register!C2','fixture-total-glyph-region',sp.sourceSha256,rc.sourceSha256])assert.ok(txt.includes(expected),`XLSX missing ${expected}`);const proof={marker:'P2_MIXED_SPREADSHEET_RECEIPT_DELIVERABLE_TRUTH=PASS',spreadsheetSha256:sp.sourceSha256,receiptSha256:rc.sourceSha256,reportId:report.reportId,version:report.version,pdfSha256:pdfSha,formats:{pdf:report.formats.pdf!.sha256,json:report.formats.json!.sha256,xlsx:report.formats.xlsx!.sha256,csv:report.formats.csvLeadSchedules!.sha256}};fs.writeFileSync(path.join(dir,'deliverable-truth.json'),JSON.stringify(proof,null,2));console.log('P2_MIXED_SPREADSHEET_RECEIPT_DELIVERABLE_TRUTH=PASS');
''')

write('server/tests/mixedSpreadsheetReceiptProductTruthBrowser.test.ts', r'''import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import puppeteer from 'puppeteer-core'; import {buildMixedEngagement,prepareMixedCase} from './fixtures/mixedSpreadsheetReceiptAcceptanceHelpers.js'; import {MIXED_ENGAGEMENT_ID,mixedEvidenceDir} from './fixtures/mixedSpreadsheetReceiptFixture.js';
const prepared=await prepareMixedCase('conflict');const engagement=buildMixedEngagement(prepared);const baseUrl=process.env.EVE_TEST_BASE_URL||'http://127.0.0.1:4173';const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean) as string[];const executablePath=candidates.find(p=>fs.existsSync(p));if(!executablePath)throw new Error('MISSING_BROWSER_EXECUTABLE');const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});try{const page=await browser.newPage();await page.setViewport({width:1440,height:1100});await page.setRequestInterception(true);page.on('request',async req=>{try{const url=new URL(req.url());if(url.origin!==new URL(baseUrl).origin||!url.pathname.startsWith('/api/'))return req.continue();let payload:any={};if(url.pathname==='/api/cpa/engagements/universal')payload={engagements:[{engagementId:engagement.engagementId,workspaceId:engagement.workspaceId,classification:'ACADEMY',isCustomer:false,clientName:engagement.clientName,period:engagement.period,framework:engagement.framework,functionalCurrency:'USD',currentStage:'EVIDENCE_REVIEW',openReviewNotesCount:1,documentsCount:2,canonicalFactsCount:2}]};else if(url.pathname===`/api/cpa/engagements/${MIXED_ENGAGEMENT_ID}`)payload={engagement};else if(url.pathname==='/api/cpa/reports/library')payload={reports:[]};else if(url.pathname==='/api/queue/jobs')payload={jobs:[]};else if(url.pathname==='/api/health')payload={status:'ok'};await req.respond({status:200,contentType:'application/json',body:JSON.stringify(payload)});}catch{req.abort();}});const response=await page.goto(`${baseUrl}/?view=engagement-evidence`,{waitUntil:'networkidle0',timeout:30000});assert.ok(response?.ok());const selector='[data-eve-mixed-source="true"]';await page.waitForSelector(selector,{visible:true,timeout:15000});const text=await page.$eval(selector,el=>(el as HTMLElement).innerText);const sp=prepared.review.parentEvidence.find((p:any)=>p.sourceKind==='SPREADSHEET')!,rc=prepared.review.parentEvidence.find((p:any)=>p.sourceKind==='RECEIPT_IMAGE')!;for(const expected of ['Mixed-source spreadsheet / receipt reconciliation','Spreadsheet evidence','Value: USD 54.23','Source: Expense Register!C2','Receipt evidence','Value: USD 53.23','region fixture-total-glyph-region','Status: CONFLICT','Difference: USD 1.00','Promotion state: BLOCKED_SOURCE_CONFLICT','Action: REQUEST_SOURCE_RECONCILIATION','Canonical promoted value: NOT PROMOTED',sp.sourceSha256,rc.sourceSha256,sp.provenanceId,rc.provenanceId])assert.ok(text.includes(expected),`mixed-source product panel missing ${expected}`);const attrs=await page.$eval(selector,(el:any)=>({status:el.dataset.eveMixedStatus,promotion:el.dataset.eveMixedPromotion}));assert.deepEqual(attrs,{status:'CONFLICT',promotion:'BLOCKED_SOURCE_CONFLICT'});const screenshot=path.join(mixedEvidenceDir(),'mixed-source-product-truth.png');await page.screenshot({path:screenshot,fullPage:true});fs.writeFileSync(path.join(mixedEvidenceDir(),'product-truth.json'),JSON.stringify({marker:'P2_MIXED_SPREADSHEET_RECEIPT_PRODUCT_TRUTH_BROWSER=PASS',spreadsheetSha256:sp.sourceSha256,receiptSha256:rc.sourceSha256,status:'CONFLICT',promotionState:'BLOCKED_SOURCE_CONFLICT',screenshot,browserVersion:await browser.version()},null,2));console.log('P2_MIXED_SPREADSHEET_RECEIPT_PRODUCT_TRUTH_BROWSER=PASS');}finally{await browser.close();}
''')

write('server/tests/mixedSpreadsheetReceiptFiveDimensionAcceptance.test.ts', r'''import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import {academyMinervaLab} from '../cpaOrganization/academyMinervaLab.js'; import {buildMixedSourceFiveDimensionChecks} from '../cpaOrganization/mixedSourceReconciliationEngine.js'; import {prepareMixedCase} from './fixtures/mixedSpreadsheetReceiptAcceptanceHelpers.js'; import {mixedEvidenceDir} from './fixtures/mixedSpreadsheetReceiptFixture.js';
const dir=mixedEvidenceDir();const source=JSON.parse(fs.readFileSync(path.join(dir,'source-accounting.json'),'utf8'));const product=JSON.parse(fs.readFileSync(path.join(dir,'product-truth.json'),'utf8'));const deliverable=JSON.parse(fs.readFileSync(path.join(dir,'deliverable-truth.json'),'utf8'));assert.equal(source.marker,'P2_MIXED_SPREADSHEET_RECEIPT_SOURCE_ACCOUNTING=PASS');assert.equal(product.marker,'P2_MIXED_SPREADSHEET_RECEIPT_PRODUCT_TRUTH_BROWSER=PASS');assert.equal(deliverable.marker,'P2_MIXED_SPREADSHEET_RECEIPT_DELIVERABLE_TRUTH=PASS');const agree=await prepareMixedCase('agreement');const conflict=await prepareMixedCase('conflict');const checks=buildMixedSourceFiveDimensionChecks(agree.review,conflict.review);const report=academyMinervaLab.evaluateFiveDimensions({caseId:'CURR-MIXED-SPREADSHEET-RECEIPT',executionId:`mixed-${conflict.spreadsheetSha.slice(0,12)}`,dimensions:{SOURCE_COVERAGE:{checks:checks.source},SEMANTIC_UNDERSTANDING:{checks:checks.semantic},ACCOUNTING_ACCURACY:{checks:checks.accounting},PRODUCT_TRUTH:{checks:[{checkId:'mixed-real-product-browser',label:'Actual Eve product renders both source lineages and blocked conflict state',outcome:'PASS',evidenceRefs:[`browser:${product.screenshot}`,`source:${product.spreadsheetSha256}`,`source:${product.receiptSha256}`],details:[`status=${product.status}; promotion=${product.promotionState}`]}]},DELIVERABLE_TRUTH:{checks:[{checkId:'mixed-artifact-dual-lineage',label:'PDF JSON CSV and XLSX preserve both lineages and the blocked conflict decision',outcome:'PASS',evidenceRefs:[`artifact:pdf:${deliverable.formats.pdf}`,`artifact:json:${deliverable.formats.json}`,`artifact:xlsx:${deliverable.formats.xlsx}`,`artifact:csv:${deliverable.formats.csv}`],details:[`report=${deliverable.reportId}:${deliverable.version}`]}]}}});for(const d of ['SOURCE_COVERAGE','SEMANTIC_UNDERSTANDING','ACCOUNTING_ACCURACY','PRODUCT_TRUTH','DELIVERABLE_TRUTH'] as const)assert.equal(report.dimensions[d].status,'PASS',`${d} must pass`);assert.equal(report.passedDimensionCount,5);assert.equal(report.notTestedDimensionCount,0);assert.equal(report.fullyTested,true);assert.equal(report.allRequiredDimensionsPassed,true);assert.equal(report.overallStatus,'FIVE_DIMENSION_PASS');fs.writeFileSync(path.join(dir,'five-dimension-result.json'),JSON.stringify({marker:'P2_MIXED_SPREADSHEET_RECEIPT_FIVE_DIMENSION_PASS=PASS',agreementSpreadsheetSha256:agree.spreadsheetSha,conflictSpreadsheetSha256:conflict.spreadsheetSha,receiptSha256:product.receiptSha256,report},null,2));console.log('P2_MIXED_SPREADSHEET_RECEIPT_FIVE_DIMENSION_PASS=PASS');
''')

# UI wiring
replace_once('src/components/views/engagement/RecordedEngagementEvidenceView.tsx',"import { TrialBalanceReviewPanel } from './TrialBalanceReviewPanel';","import { TrialBalanceReviewPanel } from './TrialBalanceReviewPanel';\nimport { MixedSourceReconciliationPanel } from './MixedSourceReconciliationPanel';")
replace_once('src/components/views/engagement/RecordedEngagementEvidenceView.tsx',"      <TrialBalanceReviewPanel review={detail.trialBalanceReview} />","      <MixedSourceReconciliationPanel review={detail.mixedSourceReview} />\n      <TrialBalanceReviewPanel review={detail.trialBalanceReview} />")

# Deliverable service pass-through
replace_once('server/cpaOrganization/deliverableArtifactService.ts',"  trialBalanceReview?: any;\n}","  trialBalanceReview?: any;\n  mixedSourceReview?: any;\n}")
replace_once('server/cpaOrganization/deliverableArtifactService.ts',"            trialBalanceReview: data.trialBalanceReview\n", "            trialBalanceReview: data.trialBalanceReview,\n            mixedSourceReview: data.mixedSourceReview\n")
replace_once('server/cpaOrganization/deliverableArtifactService.ts',"      trialBalanceReview: params.trialBalanceReview\n    });\n\n    // 2. Generate Binary XLSX", "      trialBalanceReview: params.trialBalanceReview,\n      mixedSourceReview: params.mixedSourceReview\n    });\n\n    // 2. Generate Binary XLSX")
replace_once('server/cpaOrganization/deliverableArtifactService.ts',"      trialBalanceReview: params.trialBalanceReview\n    });\n\n    // Canonical fact hash", "      trialBalanceReview: params.trialBalanceReview,\n      mixedSourceReview: params.mixedSourceReview\n    });\n\n    // Canonical fact hash")
replace_once('server/cpaOrganization/deliverableArtifactService.ts',"      trialBalanceReview: params.trialBalanceReview || null\n    };", "      trialBalanceReview: params.trialBalanceReview || null,\n      mixedSourceReview: params.mixedSourceReview || null\n    };")
replace_once('server/cpaOrganization/deliverableArtifactService.ts',"    const csvContent = buildReviewCsv(normalizedFacts, currency, params.apReview, params.bankStatementReview, params.trialBalanceReview);", "    const csvContent = buildReviewCsv(normalizedFacts, currency, params.apReview, params.bankStatementReview, params.trialBalanceReview, params.mixedSourceReview);")
replace_once('server/cpaOrganization/deliverableArtifactService.ts',"      trialBalanceReview: params.trialBalanceReview || undefined\n    };", "      trialBalanceReview: params.trialBalanceReview || undefined,\n      mixedSourceReview: params.mixedSourceReview || undefined\n    };")

# Renderer CSV
replace_once('server/cpaOrganization/reviewPackageRendering.ts',"export function buildReviewCsv(facts: any[], currency: string, apReview?: any, bankReview?: any, trialBalanceReview?: any): string {","export function buildReviewCsv(facts: any[], currency: string, apReview?: any, bankReview?: any, trialBalanceReview?: any, mixedSourceReview?: any): string {")
replace_once('server/cpaOrganization/reviewPackageRendering.ts',"  return sections.join('\\r\\n');\n}\nconst sha",r'''  if (mixedSourceReview) {
    const m=mixedSourceReview; const sp=(m.parentEvidence||[]).find((p:any)=>p.sourceKind==='SPREADSHEET'); const rc=(m.parentEvidence||[]).find((p:any)=>p.sourceKind==='RECEIPT_IMAGE');
    const mixedRows:any[][]=[[],['MIXED SOURCE RECONCILIATION'],['Status',m.status],['Promotion State',m.promotionState],['Action',m.decision],['Canonical Promoted Value',m.authoritativeValue??'NOT PROMOTED'],['Currency',m.currency],['Spreadsheet Value',m.spreadsheetValue],['Receipt Value',m.receiptValue],['Difference',m.difference],['Source Coverage',m.sourceCoverageStatus],['Semantic Alignment',m.semanticStatus],['Spreadsheet Source SHA256',sp?.sourceSha256],['Spreadsheet Provenance',sp?.provenanceId],['Spreadsheet Coordinate',sourceCoordinateText({sourceCoordinate:sp?.sourceCoordinate})],['Receipt Source SHA256',rc?.sourceSha256],['Receipt Provenance',rc?.provenanceId],['Receipt Coordinate',sourceCoordinateText({sourceCoordinate:rc?.sourceCoordinate})],['Evidence Refs',(m.evidenceRefs||[]).join(';')],['Warnings',(m.warnings||[]).join(' | ')]];
    sections.push(mixedRows.map(row=>row.map(csvCell).join(',')).join('\r\n'));
  }
  return sections.join('\r\n');
}
const sha''')

# Renderer PDF before package coverage
replace_once('server/cpaOrganization/reviewPackageRendering.ts',"  const facts=params.facts||[], jobs=params.specialistReview?.jobs||[];",r'''  if (params.mixedSourceReview) {
    const m=params.mixedSourceReview; const sp=(m.parentEvidence||[]).find((p:any)=>p.sourceKind==='SPREADSHEET'); const rc=(m.parentEvidence||[]).find((p:any)=>p.sourceKind==='RECEIPT_IMAGE');
    heading('Mixed-source spreadsheet / receipt reconciliation');
    text(`Status: ${m.status}\nSpreadsheet value: ${m.currency || 'UNSPECIFIED'} ${Number(m.spreadsheetValue).toFixed(2)}\nReceipt value: ${m.currency || 'UNSPECIFIED'} ${Number(m.receiptValue).toFixed(2)}\nDifference: ${m.currency || 'UNSPECIFIED'} ${Number(m.difference).toFixed(2)}\nPromotion state: ${m.promotionState}\nAction: ${m.decision}\nCanonical promoted value: ${m.authoritativeValue == null ? 'NOT PROMOTED' : `${m.currency} ${Number(m.authoritativeValue).toFixed(2)}`}`);
    text(`Spreadsheet source: ${sourceCoordinateText({sourceCoordinate:sp?.sourceCoordinate})}\nSpreadsheet SHA-256: ${sp?.sourceSha256 || 'NOT_RECORDED'}\nSpreadsheet provenance: ${sp?.provenanceId || 'NOT_RECORDED'}`);
    text(`Receipt source: ${sourceCoordinateText({sourceCoordinate:rc?.sourceCoordinate})}\nReceipt SHA-256: ${rc?.sourceSha256 || 'NOT_RECORDED'}\nReceipt provenance: ${rc?.provenanceId || 'NOT_RECORDED'}`);
    text(`Source coverage: ${m.sourceCoverageStatus}\nSemantic alignment: ${m.semanticStatus}\nEvidence refs: ${(m.evidenceRefs||[]).join(', ') || 'NOT_RECORDED'}`);
    for (const warning of m.warnings||[]) text(`Review warning: ${warning}`);
    text('A structured spreadsheet never overrides contradictory receipt evidence. Conflict blocks canonical promotion until the source discrepancy is reconciled.');
  }
  const facts=params.facts||[], jobs=params.specialistReview?.jobs||[];''')

# Renderer XLSX before specialist review
replace_once('server/cpaOrganization/reviewPackageRendering.ts',"  add('Specialist Review',[",r'''  if(params.mixedSourceReview){ const m=params.mixedSourceReview; const sp=(m.parentEvidence||[]).find((p:any)=>p.sourceKind==='SPREADSHEET'); const rc=(m.parentEvidence||[]).find((p:any)=>p.sourceKind==='RECEIPT_IMAGE'); add('Mixed Source Review',[
    ['Field','Recorded value'],['Status',m.status],['Promotion State',m.promotionState],['Action',m.decision],['Canonical Promoted Value',m.authoritativeValue??'NOT PROMOTED'],['Currency',m.currency],['Spreadsheet Value',m.spreadsheetValue],['Receipt Value',m.receiptValue],['Difference',m.difference],['Source Coverage',m.sourceCoverageStatus],['Semantic Alignment',m.semanticStatus],['Spreadsheet Source SHA256',sp?.sourceSha256],['Spreadsheet Provenance',sp?.provenanceId],['Spreadsheet Coordinate',sourceCoordinateText({sourceCoordinate:sp?.sourceCoordinate})],['Receipt Source SHA256',rc?.sourceSha256],['Receipt Provenance',rc?.provenanceId],['Receipt Coordinate',sourceCoordinateText({sourceCoordinate:rc?.sourceCoordinate})],['Evidence Refs',(m.evidenceRefs||[]).join(';')],['Warnings',(m.warnings||[]).join(' | ')]
  ],[36,120]); }
  add('Specialist Review',[''')

# Curriculum case upgrade
old_case=r'''      caseSpec(
        'CURR-MIXED-SPREADSHEET-RECEIPT',
        'Spreadsheet plus receipt mixed conclusion',
        'MIXED_SOURCE',
        ['SPREADSHEET', 'IMAGE', 'RECEIPT'],
        ['SOURCE_COVERAGE', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH'],
        [
          'A mixed conclusion must reverse-trace to the exact spreadsheet cell/range and receipt OCR region.',
          'A correct spreadsheet value cannot mask contradictory receipt evidence.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED',
        ['server/tests/spreadsheetSourceToPixelLineage.test.ts', 'server/tests/ocrParserEvidence.test.ts']
      ),'''
new_case=r'''      caseSpec(
        'CURR-MIXED-SPREADSHEET-RECEIPT',
        'Spreadsheet plus receipt mixed conclusion',
        'MIXED_SOURCE',
        ['SPREADSHEET', 'IMAGE', 'RECEIPT'],
        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH'],
        [
          'A mixed conclusion must reverse-trace to the exact spreadsheet cell/range and receipt OCR region.',
          'Agreement may produce a reviewable matched value only when both independent sources establish the same metric and currency.',
          'A correct-looking spreadsheet value cannot mask contradictory receipt evidence; conflict must preserve both values and block canonical promotion.',
          'Actual product and exported PDF/JSON/CSV/XLSX artifacts must retain both parent source families and the reconciliation decision.'
        ],
        'CONTRACT_READY',
        ['server/tests/mixedSpreadsheetReceiptReconciliation.test.ts', 'server/tests/mixedSpreadsheetReceiptProductTruthBrowser.test.ts', 'server/tests/mixedSpreadsheetReceiptDeliverableTruth.test.ts', 'server/tests/mixedSpreadsheetReceiptFiveDimensionAcceptance.test.ts', 'docs/launch/evidence/2026-09-16_P2_MIXED_SPREADSHEET_RECEIPT_ACCEPTANCE.md']
      ),'''
replace_once('server/cpaOrganization/academyMinervaLab.ts',old_case,new_case)
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts','assert.equal(coverage.contractReadyCases, 8);','assert.equal(coverage.contractReadyCases, 9);')
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts','assert.equal(coverage.physicalFixturePendingCases, 12);','assert.equal(coverage.physicalFixturePendingCases, 11);')
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts',"assert.equal(find('CURR-SPREADSHEET-GL-TRIAL-BALANCE').fixtureStatus, 'CONTRACT_READY');", "assert.equal(find('CURR-MIXED-SPREADSHEET-RECEIPT').fixtureStatus, 'CONTRACT_READY');\nassert.deepEqual(find('CURR-MIXED-SPREADSHEET-RECEIPT').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);\nassert.ok(find('CURR-MIXED-SPREADSHEET-RECEIPT').expectedSafeguards.join(' ').includes('block canonical promotion'));\nassert.ok(find('CURR-MIXED-SPREADSHEET-RECEIPT').validationRefs.includes('server/tests/mixedSpreadsheetReceiptFiveDimensionAcceptance.test.ts'));\nassert.equal(find('CURR-SPREADSHEET-GL-TRIAL-BALANCE').fixtureStatus, 'CONTRACT_READY');")

print('MIXED_SPREADSHEET_RECEIPT_PATCH_APPLIED')
