import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as XLSX from 'xlsx';

/** Rendering only. No fact promotion, fabricated citations, or professional approval. */
export function reviewRow(f: any): any {
  const coordinates = Array.isArray(f.sourceCoordinates) && f.sourceCoordinates.length ? f.sourceCoordinates : (f.sourceCoordinate ? [f.sourceCoordinate] : []);
  const coordinate = f.sourceCoordinate || coordinates[0];
  const provenanceIds = [...new Set([
    ...(Array.isArray(f.sourceProvenanceIds) ? f.sourceProvenanceIds : []),
    ...(f.sourceProvenanceId ? [f.sourceProvenanceId] : []),
  ].filter(Boolean).map(String))];
  return { id: f.id || null, metric: f.canonicalMetric, label: f.label || f.canonicalMetric,
    value: f.value, period: f.reportingPeriod || f.period || 'NOT_RECORDED',
    statement: f.statement || f.statementType || 'NOT_RECORDED',
    documentId: f.documentId || null, sourceDoc: f.sourceDoc || 'NOT_RECORDED',
    extractorPage: f.page ?? null, sourceText: f.sourceText || '',
    sourceBlockIds: Array.isArray(f.sourceBlockIds) ? f.sourceBlockIds : [],
    sourceSha256: f.sourceSha256 || coordinate?.sourceSha256 || null,
    sourceArtifactId: f.sourceArtifactId || coordinate?.sourceArtifactId || null,
    sourceProvenanceId: f.sourceProvenanceId || provenanceIds[0] || null,
    sourceProvenanceIds: provenanceIds,
    sourceCoordinate: coordinate || null,
    sourceCoordinates: coordinates,
    sourceConfidence: f.sourceConfidence ?? coordinate?.confidence ?? null,
    sourceExtractionMethod: f.sourceExtractionMethod || coordinate?.extractionMethod || null,
    sourceExtractionVersion: f.sourceExtractionVersion || coordinate?.extractionVersion || null,
    verificationStatus: f.verificationStatus || 'NOT_VERIFIED', evidenceStatus: f.evidenceStatus || 'NOT_MEASURED' };
}
export function sourceCoordinateText(row: any): string {
  const c = row?.sourceCoordinate || row?.sourceCoordinates?.[0];
  if (!c) return row?.extractorPage != null ? `Page ${row.extractorPage}` : 'NOT_RECORDED';
  if (c.sourceType === 'IMAGE') {
    const b = c.boundingBox || {};
    const n = (v: any) => Number.isFinite(Number(v)) ? Number(v).toFixed(6) : 'NA';
    return `IMAGE page=${c.pageNumber || 1} size=${c.imageWidth || 'NA'}x${c.imageHeight || 'NA'} region=${c.ocrRegionId || 'NOT_RECORDED'} bbox[x=${n(b.x)},y=${n(b.y)},w=${n(b.width)},h=${n(b.height)},unit=${b.unit || 'NOT_RECORDED'}] transform=${c.transformId || 'NONE'}`;
  }
  if (c.sourceType === 'PDF') return `PDF page=${c.pageNumber || 1}`;
  if (c.sourceType === 'SPREADSHEET') return `SPREADSHEET ${c.sheetName || 'Sheet'}!${c.cellAddress || c.rangeAddress || 'NOT_RECORDED'}`;
  if (c.sourceType === 'CSV') return `CSV row=${c.rowIndex || 'NOT_RECORDED'} column=${c.columnIndex || c.columnName || 'NOT_RECORDED'}`;
  return `${c.sourceType || 'SOURCE'} ${JSON.stringify(c)}`;
}
export function csvCell(value: any): string {
  const s = String(value ?? '');
  // Quoting protects delimiters; prefix spreadsheet-formula strings as well.
  const safe = /^[=+@\-\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? "'" + s : s;
  return '"' + safe.replace(/"/g, '""') + '"';
}
export function buildReviewCsv(facts: any[], currency: string): string {
  const rows = [['Source Fact ID','Metric','Label','Value','Currency','Reporting Period','Statement','Document ID','Source Document','Extractor Locator','Verification','Evidence Status','Source Block IDs','Source SHA256','Source Provenance IDs','Source Coordinate','Extraction Method','Extraction Version','Confidence','Source Excerpt'],
    ...facts.map(f=>{const r=reviewRow(f);return [r.id,r.metric,r.label,r.value,currency,r.period,r.statement,r.documentId,r.sourceDoc,r.extractorPage,r.verificationStatus,r.evidenceStatus,r.sourceBlockIds.join(';'),r.sourceSha256,r.sourceProvenanceIds.join(';'),sourceCoordinateText(r),r.sourceExtractionMethod,r.sourceExtractionVersion,r.sourceConfidence,r.sourceText];})];
  return rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
}
const sha = (b: Buffer | Uint8Array) => crypto.createHash('sha256').update(b).digest('hex');
function save(dir: string, filename: string, bytes: Buffer | Uint8Array) {
  const filepath = path.join(dir, filename), tmp = filepath + '.' + process.pid + '.tmp';
  fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(tmp, bytes); fs.renameSync(tmp, filepath);
  return { filename, filepath, sizeBytes: bytes.length, sha256: sha(bytes) };
}
function display(v: any): string { return typeof v === 'string' ? v : JSON.stringify(v ?? null); }
// Standard PDF fonts support a limited character set; retain safe readable text.
function pdfText(v: any): string { return display(v).replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[^\x20-\x7e\n]/g,'?'); }

export async function renderReviewPdf(params: any, dir: string) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page: any, y = 0;
  const width = 511, left = 42;
  const newPage = () => { page=doc.addPage([595.28,841.89]); y=783;
    page.drawText('EVE | EVIDENCE REVIEW WORKING PAPERS',{x:left,y:810,size:9,font:bold,color:rgb(.08,.15,.22)});
    page.drawLine({start:{x:left,y:800},end:{x:553,y:800},thickness:.7,color:rgb(.65,.7,.75)});
  };
  const text = (value: any, size=9, heavy=false) => {
    const font = heavy ? bold : regular;
    for (const para of pdfText(value).split('\n')) {
      let line='';
      const tokens = para.split(/\s+/).flatMap(word=>{
        if(font.widthOfTextAtSize(word,size)<=width)return [word];
        const chunks:string[]=[];let part='';for(const ch of word){if(font.widthOfTextAtSize(part+ch,size)>width){chunks.push(part);part='';}part+=ch;}if(part)chunks.push(part);return chunks;
      });
      for(const word of tokens){const next=line ? line+' '+word : word;if(font.widthOfTextAtSize(next,size)>width){if(y<64)newPage();page.drawText(line,{x:left,y,size,font});y-=size+4;line=word;}else line=next;}
      if(line){if(y<64)newPage();page.drawText(line,{x:left,y,size,font});y-=size+4;}
    }
    y-=3;
  };
  const heading=(s:string)=>{if(y<105)newPage();y-=8;text(s,12,true);};
  newPage(); text(params.clientName,17,true);
  text(params.deliverableTitle || 'Evidence Review Draft',13,true);
  text('AI-prepared draft. Not an audit, assurance opinion, or professional sign-off.',10,true);
  text(`Report: ${params.reportId} | Version: ${params.version}`);
  text(`Period of review: ${params.period} | Presentation currency: ${params.currency}`);
  text('Scope: analysis of supplied evidence only. Completeness beyond the supplied evidence, external confirmations and controls testing have not been established by this package.');
  text('All review findings and proposed classifications require authorized professional evaluation. Do not interpret successful execution or file hashes as substantive approval.');
  const b=params.euclidBalance;
  if (params.balanceIdentityApplicable) {
    heading('Selected balance-sheet arithmetic');
    text(`Assets: ${params.currency} ${b.assets.toLocaleString('en-US')}\nLiabilities: ${params.currency} ${b.liabilities.toLocaleString('en-US')}\nEquity including applicable noncontrolling interests: ${params.currency} ${b.equity.toLocaleString('en-US')}\nAssets - liabilities - equity: ${b.variance.toLocaleString('en-US')}`);
    text('This equality checks these three selected totals only. It does not establish trial-balance equality or financial-statement completeness.');
  } else {
    heading('Accounting identity scope');
    text('Balance-sheet identity: NOT APPLICABLE TO THIS EVIDENCE PACKAGE. No complete assets/liabilities/equity population was supplied for this draft.');
  }
  const facts=params.facts||[], jobs=params.specialistReview?.jobs||[];
  heading('Package coverage and unresolved matters');
  text(`${facts.length} eligible financial-fact rows; ${new Set(facts.map((f:any)=>f.id).filter(Boolean)).size} distinct source fact IDs. Repeated IDs are retained visibly, not replaced by invented identifiers.`);
  text(`Specialist executions: ${jobs.length}. Human sign-off: PENDING. External delivery authorization: NOT GRANTED.`);
  text('HTML extraction locators are not independently verified physical page numbers. Disclosure excerpts are selected evidence, not a claim of complete filing coverage.');
  for(const j of jobs){text(`${j.agentId}: execution=${j.status}; output contract=${j.outputValidationStatus||'NOT_RECORDED'}`,9,true);
    for(const u of j.uncertainties||[])text('Review limitation: '+display(u));
    const o=j.outputManifest||{};
    for(const k of ['reviewStatus','reviewConclusion','disposition','semanticAnchorStatus','technicalSignOff','independenceStatus','trialBalanceStatus'])if(o[k]!==undefined)text(`${k}: ${display(o[k])}`);
  }
  heading('Technical-review observations');
  const athena=jobs.find((j:any)=>j.agentId==='ATHENA');
  for(const k of ['asc280SegmentCompliance','asc606RevenueDisaggregation','asc842LeaseDisclosures'])if(athena?.outputManifest?.[k]){text(k,10,true);text(athena.outputManifest[k]);}
  heading('Financial-fact schedule - all included rows');
  facts.forEach((f:any,i:number)=>{const r=reviewRow(f);if(y<130)newPage();text(`${i+1}. ${r.label}`,10,true);
    text(`${params.currency} ${Number(r.value).toLocaleString('en-US',{maximumFractionDigits:8})} | Reporting period: ${r.period}`);
    text(`Statement: ${r.statement}\nSource fact ID: ${r.id||'MISSING'}\nDocument: ${r.documentId||'MISSING'} / ${r.sourceDoc} | Extractor locator: ${r.extractorPage??'NOT_RECORDED'}`);
    text(`Checks: ${r.verificationStatus} / ${r.evidenceStatus}`);
    text(`Source SHA-256: ${r.sourceSha256 || 'NOT_RECORDED'}\nSource provenance IDs: ${r.sourceProvenanceIds.length ? r.sourceProvenanceIds.join(', ') : 'NOT_RECORDED'}\nSource coordinate: ${sourceCoordinateText(r)}`);
    text(`Extraction: ${r.sourceExtractionMethod || 'NOT_RECORDED'} ${r.sourceExtractionVersion || ''} | Confidence: ${r.sourceConfidence == null ? 'NOT_RECORDED' : r.sourceConfidence}\nSource excerpt: ${r.sourceText || 'NOT_RECORDED'}`);
  });
  heading('Selected disclosure evidence');
  const ledger=params.disclosureEvidenceLedger;
  if(ledger){text(`Source SHA-256: ${ledger.sourceSha256}\nEvidence digest: ${ledger.evidenceDigestSha256}`);
    for(const e of ledger.records||[]){text(`${e.topic} | ${e.evidenceId}`,9,true);text('Source blocks: '+e.sourceBlockIds.join(', '));text(e.excerpt);}}
  const pages=doc.getPages();pages.forEach((p,i)=>{p.drawLine({start:{x:left,y:45},end:{x:553,y:45},thickness:.4,color:rgb(.7,.7,.7)});p.drawText(`DRAFT - HUMAN REVIEW REQUIRED | ${i+1} / ${pages.length}`,{x:left,y:29,size:8,font:regular});});
  return save(dir,`audit_report_${params.reportId}_${params.version}.pdf`,await doc.save());
}

export function renderReviewWorkbook(params:any, dir:string){
  const wb=XLSX.utils.book_new();
  const add=(name:string,rows:any[][],widths:number[])=>{const ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=widths.map(w=>({wch:w}));ws['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:Math.max(0,rows.length-1),c:Math.max(0,(rows[0]?.length||1)-1)}})};XLSX.utils.book_append_sheet(wb,ws,name);return ws;};
  const b=params.euclidBalance;
  const summary=add('Executive Summary',[
    ['EVIDENCE REVIEW - DRAFT','AUTHORIZED HUMAN REVIEW REQUIRED'],
    ['Client',params.clientName],['Report ID',params.reportId],['Version',params.version],['Review period',params.period],['Currency',params.currency],
    ['Scope','Analysis of supplied evidence only; not an audit or CPA opinion.'],['Human sign-off','PENDING'],['External delivery authorized','NO'],
    ['Eligible financial-fact rows',params.facts.length],['Distinct source fact IDs',new Set(params.facts.map((f:any)=>f.id).filter(Boolean)).size],
    ...(params.balanceIdentityApplicable ? [['Selected assets',b.assets],['Selected liabilities',b.liabilities],['Selected equity',b.equity],['Calculated arithmetic variance',null]] : [['Balance-sheet identity','NOT APPLICABLE - complete assets/liabilities/equity population not supplied']]),
    ['Limitations','Financial-fact IDs, original periods and recorded source locators are preserved. Completeness beyond supplied evidence is not established.'],
    ['Taxonomy scope','Name-based categories are proposals, not verified extension-to-standard anchors.']
  ],[36,86]);
  if(params.balanceIdentityApplicable){
    summary.B15={t:'n',f:'B12-B13-B14',v:b.assets-b.liabilities-b.equity};
    for(const addr of ['B12','B13','B14','B15'])if(summary[addr])summary[addr].z='#,##0.00;[Red](#,##0.00);"-"';
  }
  const rows=params.facts.map((f:any)=>reviewRow(f));
  const financial=add('Financial Statements',[
    ['Source Fact ID','Metric / Label','Value','Currency','Reporting Period','Statement','Verification','Evidence'],
    ...rows.map((r:any)=>[r.id,r.label,r.value,params.currency,r.period,r.statement,r.verificationStatus,r.evidenceStatus])
  ],[48,44,22,12,28,36,20,20]);
  rows.forEach((_:any,i:number)=>{const c=financial['C'+(i+2)];if(c)c.z='#,##0.00;[Red](#,##0.00);"-"';});
  add('Lead Schedules',[
    ['Source Fact ID','Metric','Reporting Period','Document ID','Source Document','Extractor Locator','Source Block IDs','Source SHA256','Source Provenance IDs','Source Coordinate','Extraction Method','Extraction Version','Confidence','Source Excerpt'],
    ...rows.map((r:any)=>[r.id,r.metric,r.period,r.documentId,r.sourceDoc,r.extractorPage,r.sourceBlockIds.join(';'),r.sourceSha256,r.sourceProvenanceIds.join(';'),sourceCoordinateText(r),r.sourceExtractionMethod,r.sourceExtractionVersion,r.sourceConfidence,r.sourceText])
  ],[48,34,28,38,27,20,50,66,66,100,30,18,14,90]);
  add('Specialist Review',[
    ['Agent','Execution Status','Output Contract','Model','Review Limitations','Actual Output'],
    ...(params.specialistReview?.jobs||[]).flatMap((j:any)=>{
      const serialized=JSON.stringify(j.outputManifest||{});
      const chunks=serialized.match(/[\s\S]{1,24000}/g)||[''];
      return chunks.map((chunk:string,index:number)=>[`${j.agentId} [part ${index+1}/${chunks.length}]`,j.status,j.outputValidationStatus,j.provenance?.actualModel||j.provenance?.model,(j.uncertainties||[]).map(display).join(';'),chunk]);
    })
  ],[14,30,25,30,70,100]);
  add('Disclosure Evidence',[
    ['Evidence ID','Topic','Document ID','Source Block IDs','Excerpt','Excerpt SHA256'],
    ...(params.disclosureEvidenceLedger?.records||[]).map((e:any)=>[e.evidenceId,e.topic,e.documentId,e.sourceBlockIds.join(';'),e.excerpt,e.excerptSha256])
  ],[54,26,38,80,100,66]);
  return save(dir,`audit_workbook_${params.reportId}_${params.version}.xlsx`,XLSX.write(wb,{type:'buffer',bookType:'xlsx',compression:true}));
}
