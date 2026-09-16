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
export function buildReviewCsv(facts: any[], currency: string, apReview?: any, bankReview?: any, trialBalanceReview?: any, mixedSourceReview?: any): string {
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
  if (trialBalanceReview) {
    const t=trialBalanceReview, f=t.formulaReview||{};
    const tbRows:any[][]=[[],['TRIAL BALANCE REVIEW'],['Worksheet',t.sheetName],['Source Range',t.sourceRange],['Account Lines',t.accountLineCount],['Hidden Account Rows Included',t.hiddenAccountLineCount],['Total Debits',t.totalDebits],['Total Credits',t.totalCredits],['Variance',t.variance],['Trial Balance Status',t.status],['Formula Integrity',t.formulaIntegrityStatus],['Promotion State',t.promotionState],['Debit Total Formula',`${f.debitTotal?.sourceCoordinate?.sheetName||t.sheetName}!${f.debitTotal?.cellAddress||'NA'} ${f.debitTotal?.formula||'NO_FORMULA'} cached=${f.debitTotal?.cachedValue??'NA'}`],['Credit Total Formula',`${f.creditTotal?.sourceCoordinate?.sheetName||t.sheetName}!${f.creditTotal?.cellAddress||'NA'} ${f.creditTotal?.formula||'NO_FORMULA'} cached=${f.creditTotal?.cachedValue??'NA'}`],['Variance Formula',`${f.variance?.sourceCoordinate?.sheetName||t.sheetName}!${f.variance?.cellAddress||'NA'} ${f.variance?.formula||'NO_FORMULA'} cached=${f.variance?.cachedValue??'NA'}`],['Source SHA256',t.sourceSha256],['Evidence Refs',(t.evidenceRefs||[]).join(';')],[],['Account Code','Account Name','Debit','Credit','Row','Hidden','Debit Source','Credit Source','Evidence Refs'],...(t.lines||[]).map((line:any)=>[line.accountCode,line.accountName,line.debit,line.credit,line.rowNumber,line.hiddenRow?'YES':'NO',line.debitCoordinate?.sheetName&&line.debitCoordinate?.cellAddress?`${line.debitCoordinate.sheetName}!${line.debitCoordinate.cellAddress}`:'',line.creditCoordinate?.sheetName&&line.creditCoordinate?.cellAddress?`${line.creditCoordinate.sheetName}!${line.creditCoordinate.cellAddress}`:'',[line.accountEvidenceRef,line.debitEvidenceRef,line.creditEvidenceRef].filter(Boolean).join(';')])];
    sections.push(tbRows.map(row=>row.map(csvCell).join(',')).join('\r\n'));
  }
  if (mixedSourceReview) {
    const m=mixedSourceReview; const sp=(m.parentEvidence||[]).find((p:any)=>p.sourceKind==='SPREADSHEET'); const rc=(m.parentEvidence||[]).find((p:any)=>p.sourceKind==='RECEIPT_IMAGE');
    const mixedRows:any[][]=[[],['MIXED SOURCE RECONCILIATION'],['Status',m.status],['Promotion State',m.promotionState],['Action',m.decision],['Canonical Promoted Value',m.authoritativeValue??'NOT PROMOTED'],['Currency',m.currency],['Spreadsheet Value',m.spreadsheetValue],['Receipt Value',m.receiptValue],['Difference',m.difference],['Source Coverage',m.sourceCoverageStatus],['Semantic Alignment',m.semanticStatus],['Spreadsheet Source SHA256',sp?.sourceSha256],['Spreadsheet Provenance',sp?.provenanceId],['Spreadsheet Coordinate',sourceCoordinateText({sourceCoordinate:sp?.sourceCoordinate})],['Receipt Source SHA256',rc?.sourceSha256],['Receipt Provenance',rc?.provenanceId],['Receipt Coordinate',sourceCoordinateText({sourceCoordinate:rc?.sourceCoordinate})],['Evidence Refs',(m.evidenceRefs||[]).join(';')],['Warnings',(m.warnings||[]).join(' | ')]];
    sections.push(mixedRows.map(row=>row.map(csvCell).join(',')).join('\r\n'));
  }
  return sections.join('\r\n');
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
  if (params.apReview) {
    const a=params.apReview;
    heading('Accounts payable invoice review');
    text(`Vendor: ${a.vendor?.value || 'NOT_RECORDED'}\nInvoice: ${a.invoiceNumber?.value || 'NOT_RECORDED'}\nInvoice date: ${a.invoiceDate?.value || 'NOT_RECORDED'}\nDue date: ${a.dueDate?.value || 'NOT_RECORDED'}\nBill to: ${a.billTo?.value || 'NOT_RECORDED'}\nPO reference on invoice: ${a.purchaseOrderReference?.value || 'NOT_RECORDED'}\nCurrency: ${a.currency?.value || 'NOT_RECORDED'}`);
    text(`Subtotal: ${a.subtotal?.value ?? 'NOT_RECORDED'} | Sales tax: ${a.salesTax?.value ?? 'NOT_RECORDED'} | Total due: ${a.totalDue?.value ?? 'NOT_RECORDED'} | Reconciliation: ${a.reconciliation?.status || 'NOT_MEASURED'}`);
    text(`Semantic adjudication: ${a.semanticAdjudication?.status || 'NOT_MEASURED'}`);
    const rawInvoiceLabels = a.semanticAdjudication?.rawLabelTexts || [];
    if (rawInvoiceLabels.length) for (const label of rawInvoiceLabels) text(`Raw OCR invoice label evidence: ${label}`);
    else text('Raw OCR invoice label evidence: none');
    text(`Payable candidate: ${a.apControl?.payableCandidateAmount ?? 'NOT_RECORDED'} ${a.apControl?.payableCandidateCurrency || ''} | Candidate state: ${a.apControl?.payableCandidateStatus || 'NOT_MEASURED'}\nThree-way match: ${a.apControl?.threeWayMatchStatus || 'NOT_MEASURED'} | Independent PO verified: ${a.apControl?.independentPurchaseOrderVerified ? 'YES' : 'NO'} | Receiving evidence verified: ${a.apControl?.receivingEvidenceVerified ? 'YES' : 'NO'}\nApproval: ${a.apControl?.approvalStatus || 'NOT_MEASURED'} | Payment eligibility: ${a.apControl?.paymentEligibility || 'NOT_MEASURED'} | Payment status: ${a.apControl?.paymentStatus || 'NOT_MEASURED'} | Posting: ${a.apControl?.postingStatus || 'NOT_MEASURED'}`);
    text('The invoice-stated PO reference is not independent purchase-order evidence. No approval, receiving evidence, payment, or ledger posting is inferred from invoice content.');
    for (const item of a.lineItems?.value || []) text(`${item.description}: ${item.quantity} x ${item.unitPrice} = ${item.lineTotal}`);
    text(`Source SHA-256: ${a.sourceSha256 || 'NOT_RECORDED'}\nEvidence refs: ${(a.evidenceRefs || []).join(', ') || 'NOT_RECORDED'}`);
  }
  if (params.bankStatementReview) {
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
  if (params.trialBalanceReview) {
    const t=params.trialBalanceReview, f=t.formulaReview||{};
    heading('Trial balance reconciliation review');
    text(`Worksheet / range: ${t.sheetName || 'NOT_RECORDED'}!${t.sourceRange || 'NOT_RECORDED'}\nAccount lines: ${t.accountLineCount}\nHidden account rows included: ${t.hiddenAccountLineCount}\nTotal debits: ${t.totalDebits}\nTotal credits: ${t.totalCredits}\nVariance: ${t.variance}\nTrial balance status: ${t.status}\nFormula integrity: ${t.formulaIntegrityStatus}\nPromotion state: ${t.promotionState}`);
    text(`Debit total formula: ${f.debitTotal?.sourceCoordinate?.sheetName || t.sheetName}!${f.debitTotal?.cellAddress || 'NA'} = ${f.debitTotal?.formula || 'NO_FORMULA'} | cached=${f.debitTotal?.cachedValue ?? 'NA'}\nCredit total formula: ${f.creditTotal?.sourceCoordinate?.sheetName || t.sheetName}!${f.creditTotal?.cellAddress || 'NA'} = ${f.creditTotal?.formula || 'NO_FORMULA'} | cached=${f.creditTotal?.cachedValue ?? 'NA'}\nVariance formula: ${f.variance?.sourceCoordinate?.sheetName || t.sheetName}!${f.variance?.cellAddress || 'NA'} = ${f.variance?.formula || 'NO_FORMULA'} | cached=${f.variance?.cachedValue ?? 'NA'}`);
    for (const line of t.lines||[]) text(`Account ${line.accountCode} | ${line.accountName} | Debit=${line.debit} | Credit=${line.credit} | row=${line.rowNumber} | hidden=${line.hiddenRow?'YES':'NO'} | debitSource=${line.debitCoordinate?.sheetName&&line.debitCoordinate?.cellAddress?`${line.debitCoordinate.sheetName}!${line.debitCoordinate.cellAddress}`:'NONE'} | creditSource=${line.creditCoordinate?.sheetName&&line.creditCoordinate?.cellAddress?`${line.creditCoordinate.sheetName}!${line.creditCoordinate.cellAddress}`:'NONE'}`);
    text(`Source SHA-256: ${t.sourceSha256 || 'NOT_RECORDED'}\nEvidence refs: ${(t.evidenceRefs||[]).join(', ') || 'NOT_RECORDED'}`);
    text('Trial-balance equality is recomputed from source account rows. It is not a financial-statement completeness conclusion and does not authorize posting or professional sign-off.');
  }
  if (params.mixedSourceReview) {
    const m=params.mixedSourceReview; const sp=(m.parentEvidence||[]).find((p:any)=>p.sourceKind==='SPREADSHEET'); const rc=(m.parentEvidence||[]).find((p:any)=>p.sourceKind==='RECEIPT_IMAGE');
    heading('Mixed-source spreadsheet / receipt reconciliation');
    text(`Status: ${m.status}\nSpreadsheet value: ${m.currency || 'UNSPECIFIED'} ${Number(m.spreadsheetValue).toFixed(2)}\nReceipt value: ${m.currency || 'UNSPECIFIED'} ${Number(m.receiptValue).toFixed(2)}\nDifference: ${m.currency || 'UNSPECIFIED'} ${Number(m.difference).toFixed(2)}\nPromotion state: ${m.promotionState}\nAction: ${m.decision}\nCanonical promoted value: ${m.authoritativeValue == null ? 'NOT PROMOTED' : `${m.currency} ${Number(m.authoritativeValue).toFixed(2)}`}`);
    text(`Spreadsheet source: ${sourceCoordinateText({sourceCoordinate:sp?.sourceCoordinate})}\nSpreadsheet SHA-256: ${sp?.sourceSha256 || 'NOT_RECORDED'}\nSpreadsheet provenance: ${sp?.provenanceId || 'NOT_RECORDED'}`);
    text(`Receipt source: ${sourceCoordinateText({sourceCoordinate:rc?.sourceCoordinate})}\nReceipt SHA-256: ${rc?.sourceSha256 || 'NOT_RECORDED'}\nReceipt provenance: ${rc?.provenanceId || 'NOT_RECORDED'}`);
    text(`Source coverage: ${m.sourceCoverageStatus}\nSemantic alignment: ${m.semanticStatus}\nEvidence refs: ${(m.evidenceRefs||[]).join(', ') || 'NOT_RECORDED'}`);
    for (const warning of m.warnings||[]) text(`Review warning: ${warning}`);
    text('A structured spreadsheet never overrides contradictory receipt evidence. Conflict blocks canonical promotion until the source discrepancy is reconciled.');
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
  if(params.apReview){ const a=params.apReview; add('AP Review',[
    ['Field','Recorded value'], ['Vendor',a.vendor?.value], ['Invoice Number',a.invoiceNumber?.value], ['Invoice Date',a.invoiceDate?.value], ['Due Date',a.dueDate?.value],
    ['Bill To',a.billTo?.value], ['PO Reference On Invoice',a.purchaseOrderReference?.value], ['Currency',a.currency?.value], ['Subtotal',a.subtotal?.value], ['Sales Tax',a.salesTax?.value], ['Total Due',a.totalDue?.value],
    ['Semantic Adjudication',a.semanticAdjudication?.status], ['Raw OCR Label Evidence',(a.semanticAdjudication?.rawLabelTexts||[]).join(' | ')], ['Arithmetic Reconciliation',a.reconciliation?.status],
    ['Payable Candidate Status',a.apControl?.payableCandidateStatus], ['Three-way Match',a.apControl?.threeWayMatchStatus], ['Independent PO Verified',a.apControl?.independentPurchaseOrderVerified],
    ['Receiving Evidence Verified',a.apControl?.receivingEvidenceVerified], ['Approval',a.apControl?.approvalStatus], ['Payment Eligibility',a.apControl?.paymentEligibility], ['Payment Status',a.apControl?.paymentStatus], ['Posting',a.apControl?.postingStatus],
    ['Source SHA256',a.sourceSha256], ['Evidence Refs',(a.evidenceRefs||[]).join(';')]
  ],[34,100]); }
  if(params.bankStatementReview){ const b=params.bankStatementReview, s=b.summary||{}; const ending=(b.endingBalanceDecision?.conclusionAssessments||[]).find((r:any)=>r.conclusionId==='ending-cash')?.state; const txns=(b.transactionPopulationDecision?.conclusionAssessments||[]).find((r:any)=>r.conclusionId==='complete-transaction-population')?.state; add('Bank Review',[
    ['Field','Recorded value'],['Expected Logical Pages',b.expectedLogicalPageCount],['Observed Logical Pages',(b.observedLogicalPages||[]).join(', ')],['Missing Logical Pages',(b.missingLogicalPages||[]).join(', ')],['Physical Pages Supplied',b.physicalPageCount],['Currency',s.currency],['Beginning Balance',s.beginningBalance],['Total Deposits',s.totalDeposits],['Total Withdrawals',s.totalWithdrawals],['Calculated Ending Balance',s.calculatedEndingBalance],['Reported Ending Balance',s.endingBalance],['Variance',s.variance],['Reconciliation',s.reconciliationStatus],['Ending Cash Conclusion',ending],['Transaction Population Conclusion',txns],['Ending Balance Action',b.endingBalanceDecision?.recommendedAction],['Transaction Population Action',b.transactionPopulationDecision?.recommendedAction],['Clarification Required',b.clarificationRecommended],['Gaps',(b.gaps||[]).map((g:any)=>`${g.location}:${g.gapType}:${g.explicitMateriality||'UNKNOWN'}`).join(' | ')],['Source SHA256',b.sourceSha256],['Evidence Refs',(b.evidenceRefs||[]).join(';')]
  ],[38,110]); }
  if(params.trialBalanceReview){ const t=params.trialBalanceReview, f=t.formulaReview||{}; add('Trial Balance Review',[
    ['Field','Recorded value'],['Worksheet',t.sheetName],['Source Range',t.sourceRange],['Account Lines',t.accountLineCount],['Hidden Account Rows Included',t.hiddenAccountLineCount],['Total Debits',t.totalDebits],['Total Credits',t.totalCredits],['Variance',t.variance],['Trial Balance Status',t.status],['Formula Integrity',t.formulaIntegrityStatus],['Promotion State',t.promotionState],['Debit Total Formula',`${f.debitTotal?.sourceCoordinate?.sheetName||t.sheetName}!${f.debitTotal?.cellAddress||'NA'} ${f.debitTotal?.formula||'NO_FORMULA'} cached=${f.debitTotal?.cachedValue??'NA'}`],['Credit Total Formula',`${f.creditTotal?.sourceCoordinate?.sheetName||t.sheetName}!${f.creditTotal?.cellAddress||'NA'} ${f.creditTotal?.formula||'NO_FORMULA'} cached=${f.creditTotal?.cachedValue??'NA'}`],['Variance Formula',`${f.variance?.sourceCoordinate?.sheetName||t.sheetName}!${f.variance?.cellAddress||'NA'} ${f.variance?.formula||'NO_FORMULA'} cached=${f.variance?.cachedValue??'NA'}`],['Source SHA256',t.sourceSha256],['Evidence Refs',(t.evidenceRefs||[]).join(';')],[],['Account Code','Account Name','Debit','Credit','Row','Hidden','Debit Source','Credit Source','Evidence Refs'],...(t.lines||[]).map((line:any)=>[line.accountCode,line.accountName,line.debit,line.credit,line.rowNumber,line.hiddenRow?'YES':'NO',line.debitCoordinate?.sheetName&&line.debitCoordinate?.cellAddress?`${line.debitCoordinate.sheetName}!${line.debitCoordinate.cellAddress}`:'',line.creditCoordinate?.sheetName&&line.creditCoordinate?.cellAddress?`${line.creditCoordinate.sheetName}!${line.creditCoordinate.cellAddress}`:'',[line.accountEvidenceRef,line.debitEvidenceRef,line.creditEvidenceRef].filter(Boolean).join(';')])
  ],[34,100,20,20,14,14,28,28,80]); }
  if(params.mixedSourceReview){ const m=params.mixedSourceReview; const sp=(m.parentEvidence||[]).find((p:any)=>p.sourceKind==='SPREADSHEET'); const rc=(m.parentEvidence||[]).find((p:any)=>p.sourceKind==='RECEIPT_IMAGE'); add('Mixed Source Review',[
    ['Field','Recorded value'],['Status',m.status],['Promotion State',m.promotionState],['Action',m.decision],['Canonical Promoted Value',m.authoritativeValue??'NOT PROMOTED'],['Currency',m.currency],['Spreadsheet Value',m.spreadsheetValue],['Receipt Value',m.receiptValue],['Difference',m.difference],['Source Coverage',m.sourceCoverageStatus],['Semantic Alignment',m.semanticStatus],['Spreadsheet Source SHA256',sp?.sourceSha256],['Spreadsheet Provenance',sp?.provenanceId],['Spreadsheet Coordinate',sourceCoordinateText({sourceCoordinate:sp?.sourceCoordinate})],['Receipt Source SHA256',rc?.sourceSha256],['Receipt Provenance',rc?.provenanceId],['Receipt Coordinate',sourceCoordinateText({sourceCoordinate:rc?.sourceCoordinate})],['Evidence Refs',(m.evidenceRefs||[]).join(';')],['Warnings',(m.warnings||[]).join(' | ')]
  ],[36,120]); }
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
