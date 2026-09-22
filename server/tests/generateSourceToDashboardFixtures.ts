import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import * as XLSXModule from 'xlsx';
import { SpreadsheetParser } from '../../src/lib/parser/spreadsheetParser.js';
import { RECEIPT_SHA256 } from './fixtures/receiptFiveDimensionFixture.js';
import { sourceDashboardDir } from './fixtures/sourceToDashboardFixture.js';
const XLSX:any=(XLSXModule as any).default||XLSXModule; const dir=sourceDashboardDir(); fs.mkdirSync(dir,{recursive:true});
const sha=(b:Buffer)=>crypto.createHash('sha256').update(b).digest('hex');
function workbook():Buffer {const wb:any=XLSX.utils.book_new();wb.Props={Title:'Eve Source Dashboard Revenue Register',Subject:'Product Truth fixture',Author:'Eve Academy',Company:'Eve Academy',CreatedDate:new Date('2026-09-16T00:00:00.000Z'),ModifiedDate:new Date('2026-09-16T00:00:00.000Z')};const ws:any=XLSX.utils.aoa_to_sheet([['Metric','Amount','Currency'],['Revenue',53.23,'USD']]);ws.B2={t:'n',v:53.23,z:'$#,##0.00'};ws['!ref']='A1:C2';XLSX.utils.book_append_sheet(wb,ws,'Revenue Register');return Buffer.from(XLSX.write(wb,{type:'buffer',bookType:'xlsx',compression:true,cellStyles:true}));}
const one=workbook(),two=workbook();assert.deepEqual(one,two,'XLSX fixture must be byte deterministic');const xlsx=path.join(dir,'revenue-register.xlsx');fs.writeFileSync(xlsx,one);const spreadsheetSha=sha(one);
const receipt=fs.readFileSync(path.join(dir,'receipt.png'));assert.equal(sha(receipt),RECEIPT_SHA256);
const region={marker:'RECEIPT_FIXTURE_SOURCE_REGION=PASS',sourceSha256:RECEIPT_SHA256,filename:'receipt.png',imageWidth:900,imageHeight:1000,pixelBoundingBox:{x:60,y:559,width:289,height:37},normalizedBoundingBox:{x:60/900,y:559/1000,width:289/900,height:37/1000,unit:'NORMALIZED'},rawLiteral:'TOTAL $53.23',transformId:'academy-fixture-glyph-bbox-v1'};fs.writeFileSync(path.join(dir,'source-region.json'),JSON.stringify(region,null,2));
const parser=new SpreadsheetParser();const doc:any=await parser.parse({filename:'revenue-register.xlsx',originalName:'revenue-register.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',size:one.length,buffer:one},{detectedType:'xlsx'} as any);assert.equal(doc.source.hash,spreadsheetSha);const table=doc.tables.find((t:any)=>t.sheetName==='Revenue Register');assert.ok(table);const ref=table.rowEvidence?.[0]?.[1];assert.equal(ref?.coordinate?.cellAddress,'B2');assert.equal(Number(table.rows?.[0]?.[1]),53.23);assert.equal(ref.coordinate.sourceSha256,spreadsheetSha);
const manifest={marker:'P2_SOURCE_DASHBOARD_FIXTURES=PASS',value:53.23,spreadsheet:{filename:'revenue-register.xlsx',sha256:spreadsheetSha,bytes:one.length,provenanceId:ref.provenanceId,coordinate:ref.coordinate},receipt:{filename:'receipt.png',sha256:RECEIPT_SHA256,bytes:receipt.length,region}};fs.writeFileSync(path.join(dir,'fixture-manifest.json'),JSON.stringify(manifest,null,2));console.log('P2_SOURCE_DASHBOARD_FIXTURES=PASS');
