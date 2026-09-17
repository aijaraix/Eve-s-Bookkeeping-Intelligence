import type { FiveDimensionCheck } from './academyMinervaLab.js';

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
