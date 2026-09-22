import React from 'react';
const show=(v:any)=>v===null||v===undefined||v===''?'NOT RECORDED':String(v);
const coordinate=(c:any)=>{ if(!c)return 'NOT RECORDED'; if(c.sourceType==='SPREADSHEET')return `SPREADSHEET ${c.sheetName}!${c.cellAddress||c.rangeAddress}`; if(c.sourceType==='CSV')return `CSV row=${c.rowIndex} column=${c.columnIndex} ${c.columnName||''}`; if(c.sourceType==='PDF')return `PDF page=${c.pageNumber}`; if(c.sourceType==='IMAGE')return `IMAGE page=${c.pageNumber||1} region=${c.ocrRegionId||'NOT RECORDED'}`; return `${c.sourceType||'SOURCE'} ${JSON.stringify(c)}`; };
export const MixedSourceBatchPanel:React.FC<{review:any}>=({review})=>{ if(!review)return null; return <section className="border rounded-xl p-4 space-y-3" data-eve-mixed-batch="true">
  <h2 className="font-semibold">Mixed-source batch isolation review</h2>
  <p>Status: <strong>{show(review.status)}</strong> · Promotion: <strong>{show(review.promotionState)}</strong></p>
  <p>Action: {show(review.decision)} · Source families: {show(review.sourceFamilyCount)} / 4 · Unique source identities: {show(review.uniqueSourceCount)}</p>
  <p>Canonical batch value: <strong>{review.canonicalBatchValue==null?'NOT AGGREGATED':show(review.canonicalBatchValue)}</strong></p>
  <p>Similar amounts are not treated as identity or automatic corroboration. Each observation remains attached to its own document and coordinate family.</p>
  <div className="grid gap-3 md:grid-cols-2">{(review.sourceItems||[]).map((item:any,index:number)=><article key={item.factId||index} className="border rounded-lg p-3 space-y-1" data-source-kind={item.sourceKind}>
    <h3 className="font-medium">{show(item.sourceKind)} · {show(item.semanticRole)}</h3>
    <p>Value: {show(item.currency)} {show(item.value)} · Fact: {show(item.factId)}</p>
    <p>Document: {show(item.documentId)} · Workspace: {show(item.workspaceId)}</p>
    <p>Coordinate: {coordinate(item.sourceCoordinate)}</p>
    <p className="break-all">Source SHA-256: {show(item.sourceSha256)}</p>
    <p className="break-all">Coordinate SHA-256: {show(item.coordinateSourceSha256)}</p>
    <p className="break-all">Provenance: {show(item.provenanceId)}</p>
    <p className="break-all">Artifact: {show(item.sourceArtifactId)}</p>
    <p>Issues: {(item.issues||[]).join(' | ')||'NONE'}</p>
  </article>)}</div>
  {review.issues?.length>0&&<div><h3 className="font-medium">Blocking source-identity findings</h3><ul className="list-disc pl-5">{review.issues.map((issue:string,i:number)=><li key={i}>{issue}</li>)}</ul></div>}
</section>; };
