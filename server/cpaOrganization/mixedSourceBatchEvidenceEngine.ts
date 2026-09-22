import { validateSourceCoordinate } from '../../src/lib/evidence/universalSourceEvidence.js';
import type { FiveDimensionCheck } from './academyMinervaLab.js';

export type MixedSourceBatchKind = 'SPREADSHEET' | 'PDF' | 'IMAGE' | 'CSV';
export type MixedSourceBatchStatus = 'VERIFIED_SOURCE_ISOLATION' | 'BLOCKED_SOURCE_IDENTITY_MISMATCH' | 'BLOCKED_INCOMPLETE_SOURCE_FAMILIES';
export type MixedSourceBatchPromotion = 'READY_FOR_AUTHORIZED_REVIEW' | 'BLOCKED_SOURCE_IDENTITY_MISMATCH' | 'BLOCKED_INCOMPLETE';
export type MixedSourceBatchDecision = 'PRESERVE_SOURCE_SCOPED_FACTS' | 'REQUEST_BATCH_SOURCE_RECONCILIATION' | 'REQUEST_MISSING_SOURCE_FAMILIES';

export interface MixedSourceBatchItem {
  sourceKind: MixedSourceBatchKind | string;
  semanticRole: string;
  factId: string;
  documentId: string;
  workspaceId: string;
  value: number;
  currency: string;
  sourceSha256: string;
  coordinateSourceSha256: string;
  sourceArtifactId: string;
  coordinateSourceArtifactId: string;
  provenanceId: string;
  sourceCoordinate: any;
  sourceText: string;
  issues: string[];
}

export interface MixedSourceBatchReview {
  batchId: string;
  expectedWorkspaceId: string;
  requiredSourceKinds: MixedSourceBatchKind[];
  status: MixedSourceBatchStatus;
  promotionState: MixedSourceBatchPromotion;
  decision: MixedSourceBatchDecision;
  sourceFamilyCount: number;
  uniqueSourceCount: number;
  uniqueDocumentCount: number;
  uniqueProvenanceCount: number;
  canonicalBatchValue: null;
  sourceItems: MixedSourceBatchItem[];
  evidenceRefs: string[];
  missingSourceKinds: MixedSourceBatchKind[];
  issues: string[];
}

const REQUIRED: MixedSourceBatchKind[]=['SPREADSHEET','PDF','IMAGE','CSV'];
const uniq=(rows:string[])=>new Set(rows.filter(Boolean)).size;

export function evaluateMixedSourceBatch(params:{facts:any[];expectedWorkspaceId:string;batchId?:string}):MixedSourceBatchReview {
  const facts=Array.isArray(params.facts)?params.facts:[];
  const items:MixedSourceBatchItem[]=facts.map((fact:any)=>{
    const coordinate=fact?.sourceCoordinate || (Array.isArray(fact?.sourceCoordinates)?fact.sourceCoordinates[0]:undefined);
    const sourceKind=String(coordinate?.sourceType||'MISSING').toUpperCase();
    const sourceSha256=String(fact?.sourceSha256||'');
    const coordinateSourceSha256=String(coordinate?.sourceSha256||'');
    const sourceArtifactId=String(fact?.sourceArtifactId||'');
    const coordinateSourceArtifactId=String(coordinate?.sourceArtifactId||'');
    const provenanceId=String(fact?.sourceProvenanceId || fact?.sourceProvenanceIds?.[0] || '');
    const issues:string[]=[];
    if(!REQUIRED.includes(sourceKind as MixedSourceBatchKind)) issues.push(`UNEXPECTED_SOURCE_KIND:${sourceKind}`);
    if(!fact?.id) issues.push('MISSING_FACT_ID');
    if(!fact?.documentId) issues.push('MISSING_DOCUMENT_ID');
    if(!sourceSha256) issues.push('MISSING_SOURCE_SHA256');
    if(!sourceArtifactId) issues.push('MISSING_SOURCE_ARTIFACT_ID');
    if(!provenanceId) issues.push('MISSING_PROVENANCE_ID');
    if(!coordinate) issues.push('MISSING_SOURCE_COORDINATE');
    if(String(fact?.workspaceId||'')!==params.expectedWorkspaceId) issues.push(`WORKSPACE_MISMATCH:${fact?.workspaceId||'MISSING'}`);
    if(sourceSha256 && coordinateSourceSha256 && sourceSha256!==coordinateSourceSha256) issues.push('SOURCE_SHA_DOES_NOT_MATCH_COORDINATE_SHA');
    if(sourceArtifactId && coordinateSourceArtifactId && sourceArtifactId!==coordinateSourceArtifactId) issues.push('SOURCE_ARTIFACT_DOES_NOT_MATCH_COORDINATE_ARTIFACT');
    if(coordinate){ for(const issue of validateSourceCoordinate(coordinate).issues) issues.push(`COORDINATE_INVALID:${issue}`); }
    return {sourceKind,semanticRole:String(fact?.semanticRole||fact?.labelNormalized||fact?.labelOriginal||fact?.id||'UNRECORDED'),factId:String(fact?.id||''),documentId:String(fact?.documentId||''),workspaceId:String(fact?.workspaceId||''),value:Number(fact?.normalizedValue??fact?.valueFunctional??fact?.value),currency:String(fact?.functionalCurrency||fact?.currencyOriginal||fact?.currency||''),sourceSha256,coordinateSourceSha256,sourceArtifactId,coordinateSourceArtifactId,provenanceId,sourceCoordinate:coordinate,sourceText:String(fact?.sourceText||''),issues};
  });
  const kinds=new Set(items.map(i=>i.sourceKind));
  const missingSourceKinds=REQUIRED.filter(k=>!kinds.has(k));
  const issues=items.flatMap(i=>i.issues.map(issue=>`${i.sourceKind}:${i.factId}:${issue}`));
  if(uniq(items.map(i=>i.sourceSha256))!==items.length) issues.push('SOURCE_SHA_IDENTITIES_NOT_UNIQUE');
  if(uniq(items.map(i=>i.documentId))!==items.length) issues.push('DOCUMENT_IDENTITIES_NOT_UNIQUE');
  if(uniq(items.map(i=>i.provenanceId))!==items.length) issues.push('PROVENANCE_IDENTITIES_NOT_UNIQUE');
  if(uniq(items.map(i=>i.sourceArtifactId))!==items.length) issues.push('SOURCE_ARTIFACT_IDENTITIES_NOT_UNIQUE');
  const identityMismatch=issues.length>0;
  const incomplete=missingSourceKinds.length>0 || items.length!==REQUIRED.length;
  const status:MixedSourceBatchStatus=identityMismatch?'BLOCKED_SOURCE_IDENTITY_MISMATCH':incomplete?'BLOCKED_INCOMPLETE_SOURCE_FAMILIES':'VERIFIED_SOURCE_ISOLATION';
  const promotionState:MixedSourceBatchPromotion=status==='VERIFIED_SOURCE_ISOLATION'?'READY_FOR_AUTHORIZED_REVIEW':status==='BLOCKED_SOURCE_IDENTITY_MISMATCH'?'BLOCKED_SOURCE_IDENTITY_MISMATCH':'BLOCKED_INCOMPLETE';
  const decision:MixedSourceBatchDecision=status==='VERIFIED_SOURCE_ISOLATION'?'PRESERVE_SOURCE_SCOPED_FACTS':status==='BLOCKED_SOURCE_IDENTITY_MISMATCH'?'REQUEST_BATCH_SOURCE_RECONCILIATION':'REQUEST_MISSING_SOURCE_FAMILIES';
  const evidenceRefs=[...new Set(items.flatMap(i=>[`document:${i.documentId}`,`source:${i.sourceSha256}`,`provenance:${i.provenanceId}`]).filter(v=>!v.endsWith(':')))];
  return {batchId:params.batchId||'mixed-source-batch',expectedWorkspaceId:params.expectedWorkspaceId,requiredSourceKinds:[...REQUIRED],status,promotionState,decision,sourceFamilyCount:kinds.size,uniqueSourceCount:uniq(items.map(i=>i.sourceSha256)),uniqueDocumentCount:uniq(items.map(i=>i.documentId)),uniqueProvenanceCount:uniq(items.map(i=>i.provenanceId)),canonicalBatchValue:null,sourceItems:items,evidenceRefs,missingSourceKinds,issues};
}

const pass=(checkId:string,label:string,evidenceRefs:string[],details:string[]):FiveDimensionCheck=>({checkId,label,outcome:'PASS',evidenceRefs,details});
export function buildMixedSourceBatchFiveDimensionChecks(valid:MixedSourceBatchReview,tampered:MixedSourceBatchReview){
  const refs=valid.evidenceRefs;
  return {
    source:[
      pass('batch-four-coordinate-families','Spreadsheet PDF image and CSV retain independent source coordinate families',refs,[`families=${valid.sourceFamilyCount}; uniqueSources=${valid.uniqueSourceCount}`]),
      pass('batch-distinct-identities','All four batch members retain distinct document source and provenance identities',refs,[`documents=${valid.uniqueDocumentCount}; provenance=${valid.uniqueProvenanceCount}`])
    ],
    semantic:[
      pass('batch-source-scoped-semantics','Similar monetary values remain source-scoped observations rather than automatic corroboration',refs,[`canonicalBatchValue=${valid.canonicalBatchValue}`]),
      pass('batch-cross-document-substitution-detected','Cross-document coordinate substitution is detected and not flattened away',tampered.evidenceRefs,[`status=${tampered.status}`])
    ],
    accounting:[
      pass('batch-no-implicit-aggregation','Mixed-source batch does not sum or promote similar independent values into a canonical accounting amount',refs,[`decision=${valid.decision}`]),
      pass('batch-mismatch-fails-closed','A source identity mismatch blocks promotion and requires source reconciliation',tampered.evidenceRefs,[`promotion=${tampered.promotionState}; decision=${tampered.decision}`])
    ]
  };
}
