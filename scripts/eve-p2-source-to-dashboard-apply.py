#!/usr/bin/env python3
from pathlib import Path


def read(path): return Path(path).read_text()
def write(path, content):
    p=Path(path); p.parent.mkdir(parents=True, exist_ok=True); p.write_text(content)
def replace_once(path, old, new):
    text=read(path)
    if old not in text: raise SystemExit(f'PATCH_ANCHOR_MISSING:{path}:{old[:100]!r}')
    if text.count(old)!=1: raise SystemExit(f'PATCH_ANCHOR_NOT_UNIQUE:{path}:{text.count(old)}')
    write(path,text.replace(old,new,1))

# Fail-closed source identity validation at the presentation boundary.
write('src/lib/evidence/presentationSourceIdentity.ts', r'''export interface PresentationSourceIdentityValidation {
  valid: boolean;
  issues: string[];
}

function nonblank(value: unknown): boolean { return Boolean(String(value ?? '').trim()); }
function sha(value: unknown): string { return String(value ?? '').trim().toLowerCase(); }

export function validatePresentationSourceIdentity(fact: any): PresentationSourceIdentityValidation {
  const issues: string[] = [];
  const coordinates = Array.isArray(fact?.sourceCoordinates) && fact.sourceCoordinates.length
    ? fact.sourceCoordinates
    : Array.isArray(fact?.provenanceCoordinates) && fact.provenanceCoordinates.length
      ? fact.provenanceCoordinates
      : fact?.sourceCoordinate ? [fact.sourceCoordinate]
      : fact?.provenance?.sourceCoordinate ? [fact.provenance.sourceCoordinate]
      : [];
  if (!coordinates.length) return { valid: false, issues: ['SOURCE_COORDINATE_MISSING'] };

  const topSha = sha(fact?.sourceSha256 || fact?.provenance?.sourceSha256);
  const topArtifact = String(fact?.sourceArtifactId || fact?.provenance?.sourceArtifactId || '').trim();
  const provenanceId = String(fact?.sourceProvenanceId || fact?.provenance?.sourceProvenanceId || '').trim();
  if (!provenanceId) issues.push('SOURCE_PROVENANCE_ID_MISSING');

  for (const coordinate of coordinates) {
    const coordinateSha = sha(coordinate?.sourceSha256);
    const coordinateArtifact = String(coordinate?.sourceArtifactId || '').trim();
    if (!nonblank(coordinate?.coordinateId)) issues.push('SOURCE_COORDINATE_ID_MISSING');
    if (!/^[a-f0-9]{64}$/.test(coordinateSha)) issues.push('SOURCE_COORDINATE_SHA_INVALID');
    if (!coordinateArtifact) issues.push('SOURCE_COORDINATE_ARTIFACT_MISSING');
    if (topSha && coordinateSha && topSha !== coordinateSha) issues.push('SOURCE_SHA_DOES_NOT_MATCH_COORDINATE_SHA');
    if (topArtifact && coordinateArtifact && topArtifact !== coordinateArtifact) issues.push('SOURCE_ARTIFACT_DOES_NOT_MATCH_COORDINATE_ARTIFACT');
    if (coordinate?.sourceType === 'SPREADSHEET') {
      if (!nonblank(coordinate?.sheetName)) issues.push('SPREADSHEET_SHEET_MISSING');
      if (!nonblank(coordinate?.cellAddress) && !nonblank(coordinate?.rangeAddress)) issues.push('SPREADSHEET_CELL_OR_RANGE_MISSING');
    } else if (coordinate?.sourceType === 'IMAGE') {
      if (!(Number(coordinate?.imageWidth) > 0) || !(Number(coordinate?.imageHeight) > 0)) issues.push('IMAGE_DIMENSIONS_MISSING');
      const box = coordinate?.boundingBox;
      if (!box || !['NORMALIZED','PX','POINT'].includes(String(box.unit || ''))) issues.push('IMAGE_BOUNDING_BOX_MISSING');
    } else if (coordinate?.sourceType === 'PDF') {
      if (!(Number(coordinate?.pageNumber) > 0)) issues.push('PDF_PAGE_MISSING');
    } else if (coordinate?.sourceType === 'CSV') {
      if (!(Number(coordinate?.rowIndex) > 0)) issues.push('CSV_ROW_MISSING');
    }
  }
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}
''')

replace_once('src/adapters/presentationAdapters.ts',
"import { renderRegistry } from '../utils/renderRegistry';\n",
"import { renderRegistry } from '../utils/renderRegistry';\nimport { validatePresentationSourceIdentity } from '../lib/evidence/presentationSourceIdentity';\n")
replace_once('src/adapters/presentationAdapters.ts',
"""  const lineCurrency = factCurrency(fact, currency);
  return {
""",
"""  const lineCurrency = factCurrency(fact, currency);
  const sourceIdentity = validatePresentationSourceIdentity(fact);
  const claimedVerificationStatus = String(fact?.verificationStatus || 'review_required').toLowerCase();
  const effectiveVerificationStatus = claimedVerificationStatus === 'verified' && !sourceIdentity.valid
    ? 'review_required'
    : claimedVerificationStatus;
  return {
""")
replace_once('src/adapters/presentationAdapters.ts',
"""    verificationStatus: String(fact?.verificationStatus || 'review_required').toLowerCase() as StatementLinePresentation['verificationStatus'],
""",
"""    verificationStatus: effectiveVerificationStatus as StatementLinePresentation['verificationStatus'],
""")
replace_once('src/adapters/presentationAdapters.ts',
"""      verificationState: String(fact.verificationStatus).toUpperCase() === 'VERIFIED' ? 'VERIFIED' : 'REVIEW_REQUIRED'
""",
"""      verificationState: effectiveVerificationStatus === 'verified' ? 'VERIFIED' : 'REVIEW_REQUIRED'
""")

# Fixture helper.
write('server/tests/fixtures/sourceToDashboardFixture.ts', r'''import fs from 'node:fs';
import path from 'node:path';
import { buildReceiptFact, RECEIPT_SHA256 } from './receiptFiveDimensionFixture.js';

export const SOURCE_DASHBOARD_WORKSPACE_ID='ws-academy-source-dashboard';
export const SOURCE_DASHBOARD_ENGAGEMENT_ID='eng-academy-source-dashboard';
export const SOURCE_DASHBOARD_SPREADSHEET_FACT_ID='fact-dashboard-spreadsheet-revenue';
export const SOURCE_DASHBOARD_RECEIPT_FACT_ID='fact-dashboard-receipt-expense';
export const SOURCE_DASHBOARD_TAMPERED_FACT_ID='fact-dashboard-tampered-net-income';
export const SOURCE_DASHBOARD_VALUE=53.23;
export function sourceDashboardDir(){return process.env.SOURCE_DASHBOARD_ACCEPTANCE_DIR||'/tmp/eve-source-to-dashboard';}
export function loadSourceDashboardManifest(){return JSON.parse(fs.readFileSync(path.join(sourceDashboardDir(),'fixture-manifest.json'),'utf8'));}

export function buildDashboardSpreadsheetFact(manifest=loadSourceDashboardManifest()):any {
  const c=manifest.spreadsheet.coordinate;
  return {id:SOURCE_DASHBOARD_SPREADSHEET_FACT_ID,workspaceId:SOURCE_DASHBOARD_WORKSPACE_ID,documentId:'doc-dashboard-revenue-xlsx',canonicalMetric:'revenue',labelOriginal:'Revenue',labelNormalized:'Total Revenue',valueOriginal:'53.23',valueFunctional:SOURCE_DASHBOARD_VALUE,normalizedValue:SOURCE_DASHBOARD_VALUE,currencyOriginal:'USD',functionalCurrency:'USD',reportingPeriod:'FY 2026',periodOriginal:'FY 2026',status:'APPROVED',verificationStatus:'VERIFIED',evidenceStatus:'CONFIRMED',sourceDocument:'revenue-register.xlsx',documentTitle:'revenue-register.xlsx',sourceText:'Revenue | 53.23 | USD',sourceSha256:manifest.spreadsheet.sha256,sourceArtifactId:c.sourceArtifactId,sourceProvenanceId:manifest.spreadsheet.provenanceId,sourceProvenanceIds:[manifest.spreadsheet.provenanceId],sourceCoordinate:c,sourceCoordinates:[c],provenanceCoordinates:[c],sourceExtractionMethod:c.extractionMethod||'spreadsheet-native',sourceExtractionVersion:c.extractionVersion||'1',scale:'Source units'};
}
export function buildDashboardReceiptFact():any {
  const r:any=buildReceiptFact(); return {...r,id:SOURCE_DASHBOARD_RECEIPT_FACT_ID,workspaceId:SOURCE_DASHBOARD_WORKSPACE_ID,documentId:'doc-dashboard-receipt',canonicalMetric:'operating_expenses'};
}
export function buildTamperedDashboardFact(manifest=loadSourceDashboardManifest()):any {
  const f=buildDashboardSpreadsheetFact(manifest); return {...f,id:SOURCE_DASHBOARD_TAMPERED_FACT_ID,canonicalMetric:'net_income',labelNormalized:'Net Income',sourceSha256:RECEIPT_SHA256};
}
export function buildSourceDashboardEngagement(includeTampered=true):any {
  const m=loadSourceDashboardManifest(); const spreadsheet=buildDashboardSpreadsheetFact(m); const receipt=buildDashboardReceiptFact(); const facts=[spreadsheet,receipt,...(includeTampered?[buildTamperedDashboardFact(m)]:[])];
  return {engagementId:SOURCE_DASHBOARD_ENGAGEMENT_ID,workspaceId:SOURCE_DASHBOARD_WORKSPACE_ID,classification:'ACADEMY',isCustomer:false,clientName:'Eve Academy Source Dashboard Fixture',entityName:'Eve Academy Source Dashboard Fixture',title:'Source-to-Dashboard Product Truth',period:'FY 2026',framework:'US_GAAP',functionalCurrency:'USD',currentStage:'EVIDENCE_REVIEW',openReviewNotesCount:0,facts,canonicalFacts:facts,documents:[{id:'doc-dashboard-revenue-xlsx',filename:'revenue-register.xlsx',sha256:m.spreadsheet.sha256,workspaceId:SOURCE_DASHBOARD_WORKSPACE_ID},{id:'doc-dashboard-receipt',filename:'receipt.png',sha256:RECEIPT_SHA256,workspaceId:SOURCE_DASHBOARD_WORKSPACE_ID}],reports:[],findings:[],periods:['FY 2026'],continuation:null};
}
''')

# Generate physical XLSX, exact receipt region evidence, and parser-derived coordinate.
write('server/tests/generateSourceToDashboardFixtures.ts', r'''import assert from 'node:assert/strict';
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
''')

write('server/tests/sourceToDashboardPresentationIntegrity.test.ts', r'''import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path';
import { adaptFactsToIncomeStatement } from '../../src/adapters/presentationAdapters.js';
import { validatePresentationSourceIdentity } from '../../src/lib/evidence/presentationSourceIdentity.js';
import { renderRegistry } from '../../src/utils/renderRegistry.js';
import { buildDashboardReceiptFact,buildDashboardSpreadsheetFact,buildTamperedDashboardFact,SOURCE_DASHBOARD_RECEIPT_FACT_ID,SOURCE_DASHBOARD_SPREADSHEET_FACT_ID,SOURCE_DASHBOARD_TAMPERED_FACT_ID,sourceDashboardDir } from './fixtures/sourceToDashboardFixture.js';
const spreadsheet=buildDashboardSpreadsheetFact(),receipt=buildDashboardReceiptFact(),tampered=buildTamperedDashboardFact();
assert.equal(validatePresentationSourceIdentity(spreadsheet).valid,true);assert.equal(validatePresentationSourceIdentity(receipt).valid,true);const bad=validatePresentationSourceIdentity(tampered);assert.equal(bad.valid,false);assert.ok(bad.issues.includes('SOURCE_SHA_DOES_NOT_MATCH_COORDINATE_SHA'));
renderRegistry.clear();const lines=adaptFactsToIncomeStatement([spreadsheet,receipt,tampered],'FY 2026','USD');const byFact=(id:string)=>lines.find((l:any)=>l.factLineageId===id) as any;const rev=byFact(SOURCE_DASHBOARD_SPREADSHEET_FACT_ID),sga=byFact(SOURCE_DASHBOARD_RECEIPT_FACT_ID),net=byFact(SOURCE_DASHBOARD_TAMPERED_FACT_ID);assert.ok(rev&&sga&&net);assert.equal(rev.formattedValues['FY 2026'],'$53.23');assert.equal(sga.formattedValues['FY 2026'],'$53.23');assert.equal(rev.verificationStatus,'verified');assert.equal(sga.verificationStatus,'verified');assert.equal(net.verificationStatus,'review_required');assert.equal(rev.sourceCoordinate.sourceType,'SPREADSHEET');assert.equal(rev.sourceCoordinate.sheetName,'Revenue Register');assert.equal(rev.sourceCoordinate.cellAddress,'B2');assert.equal(sga.sourceCoordinate.sourceType,'IMAGE');assert.equal(sga.sourceCoordinate.ocrRegionId,'fixture-total-glyph-region');assert.equal(renderRegistry.getRender(rev.renderId)?.verificationState,'VERIFIED');assert.equal(renderRegistry.getRender(sga.renderId)?.verificationState,'VERIFIED');assert.equal(renderRegistry.getRender(net.renderId)?.verificationState,'REVIEW_REQUIRED');
const proof={marker:'P2_SOURCE_DASHBOARD_PRESENTATION_INTEGRITY=PASS',validFactIds:[spreadsheet.id,receipt.id],tamperedFactId:tampered.id,tamperIssues:bad.issues,renderStates:{spreadsheet:renderRegistry.getRender(rev.renderId),receipt:renderRegistry.getRender(sga.renderId),tampered:renderRegistry.getRender(net.renderId)}};fs.writeFileSync(path.join(sourceDashboardDir(),'presentation-integrity.json'),JSON.stringify(proof,null,2));console.log('P2_SOURCE_DASHBOARD_PRESENTATION_INTEGRITY=PASS');
''')

write('server/tests/sourceToDashboardProductTruthBrowser.test.ts', r'''import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path'; import puppeteer from 'puppeteer-core';
import { RECEIPT_PROVENANCE_ID,RECEIPT_SHA256 } from './fixtures/receiptFiveDimensionFixture.js';
import { buildSourceDashboardEngagement,loadSourceDashboardManifest,SOURCE_DASHBOARD_ENGAGEMENT_ID,SOURCE_DASHBOARD_RECEIPT_FACT_ID,SOURCE_DASHBOARD_SPREADSHEET_FACT_ID,SOURCE_DASHBOARD_TAMPERED_FACT_ID,sourceDashboardDir } from './fixtures/sourceToDashboardFixture.js';
const baseUrl=process.env.EVE_TEST_BASE_URL||'http://127.0.0.1:4173';const dir=sourceDashboardDir();const manifest=loadSourceDashboardManifest();const engagement=buildSourceDashboardEngagement(true);const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean) as string[];const executablePath=candidates.find(p=>fs.existsSync(p));if(!executablePath)throw new Error('MISSING_BROWSER_EXECUTABLE');const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
try {const page=await browser.newPage();await page.setViewport({width:1440,height:1050});await page.setRequestInterception(true);page.on('request',async request=>{try{const url=new URL(request.url());if(url.origin!==new URL(baseUrl).origin||!url.pathname.startsWith('/api/'))return request.continue();let payload:any={};if(url.pathname==='/api/cpa/engagements/universal')payload={engagements:[{engagementId:engagement.engagementId,workspaceId:engagement.workspaceId,classification:'ACADEMY',isCustomer:false,clientName:engagement.clientName,period:engagement.period,framework:engagement.framework,functionalCurrency:'USD',currentStage:'EVIDENCE_REVIEW',openReviewNotesCount:0,documentsCount:2,canonicalFactsCount:3}]};else if(url.pathname===`/api/cpa/engagements/${encodeURIComponent(SOURCE_DASHBOARD_ENGAGEMENT_ID)}`||url.pathname===`/api/cpa/engagements/${SOURCE_DASHBOARD_ENGAGEMENT_ID}`)payload={engagement};else if(url.pathname==='/api/cpa/reports/library')payload={reports:[]};else if(url.pathname==='/api/queue/jobs')payload={jobs:[]};else if(url.pathname==='/api/health')payload={status:'ok'};await request.respond({status:200,contentType:'application/json',body:JSON.stringify(payload)});}catch{request.abort();}});
const response=await page.goto(`${baseUrl}/?view=financials-income`,{waitUntil:'networkidle0',timeout:30000});assert.ok(response?.ok());
async function cell(id:string){const sel=`[data-eve-financial-value="true"][data-canonical-fact-id="${id}"]`;await page.waitForSelector(sel,{visible:true,timeout:15000});return {sel,data:await page.$eval(sel,(el:any)=>({text:el.innerText.trim(),factId:el.dataset.canonicalFactId,renderId:el.dataset.renderId,status:el.dataset.provenanceStatus,metric:el.dataset.canonicalMetric}))};}
const spreadsheetCell=await cell(SOURCE_DASHBOARD_SPREADSHEET_FACT_ID),receiptCell=await cell(SOURCE_DASHBOARD_RECEIPT_FACT_ID),tamperedCell=await cell(SOURCE_DASHBOARD_TAMPERED_FACT_ID);for(const c of [spreadsheetCell,receiptCell,tamperedCell])assert.equal(c.data.text,'$53.23');assert.equal(spreadsheetCell.data.status,'verified');assert.equal(receiptCell.data.status,'verified');assert.equal(tamperedCell.data.status,'review_required');assert.ok(spreadsheetCell.data.renderId&&receiptCell.data.renderId&&tamperedCell.data.renderId);
await page.click(spreadsheetCell.sel);await page.waitForSelector('[role="dialog"]',{visible:true,timeout:10000});let text=await page.$eval('[role="dialog"]',el=>(el as HTMLElement).innerText);for(const expected of ['Source-to-Pixel Provenance','revenue-register.xlsx','Revenue Register!B2',manifest.spreadsheet.provenanceId,'Revenue | 53.23 | USD'])assert.ok(text.includes(expected),`spreadsheet drawer missing ${expected}`);await page.click('[data-eve-action-id="evidence.technical"]');text=await page.$eval('[role="dialog"]',el=>(el as HTMLElement).innerText);for(const expected of [manifest.spreadsheet.sha256,SOURCE_DASHBOARD_SPREADSHEET_FACT_ID,spreadsheetCell.data.renderId])assert.ok(text.includes(expected),`spreadsheet technical trace missing ${expected}`);await page.click('[data-eve-action-id="evidence.close"]');await page.waitForSelector('[role="dialog"]',{hidden:true});
await page.click(receiptCell.sel);await page.waitForSelector('[role="dialog"]',{visible:true,timeout:10000});text=await page.$eval('[role="dialog"]',el=>(el as HTMLElement).innerText);for(const expected of ['Source-to-Pixel Provenance','receipt.png','TOTAL $53.23','900×1000','fixture-total-glyph-region',RECEIPT_PROVENANCE_ID])assert.ok(text.includes(expected),`receipt drawer missing ${expected}`);await page.click('[data-eve-action-id="evidence.technical"]');text=await page.$eval('[role="dialog"]',el=>(el as HTMLElement).innerText);for(const expected of [RECEIPT_SHA256,SOURCE_DASHBOARD_RECEIPT_FACT_ID,receiptCell.data.renderId])assert.ok(text.includes(expected),`receipt technical trace missing ${expected}`);await page.click('[data-eve-action-id="evidence.close"]');
const screenshot=path.join(dir,'source-to-dashboard-product-truth.png');await page.screenshot({path:screenshot,fullPage:true});const proof={marker:'P2_SOURCE_TO_DASHBOARD_PRODUCT_TRUTH_BROWSER=PASS',visibleValue:'$53.23',spreadsheet:{factId:SOURCE_DASHBOARD_SPREADSHEET_FACT_ID,renderId:spreadsheetCell.data.renderId,status:spreadsheetCell.data.status,sourceSha256:manifest.spreadsheet.sha256,sourceLocator:'Revenue Register!B2',provenanceId:manifest.spreadsheet.provenanceId},receipt:{factId:SOURCE_DASHBOARD_RECEIPT_FACT_ID,renderId:receiptCell.data.renderId,status:receiptCell.data.status,sourceSha256:RECEIPT_SHA256,sourceLocator:'fixture-total-glyph-region',provenanceId:RECEIPT_PROVENANCE_ID},tampered:{factId:SOURCE_DASHBOARD_TAMPERED_FACT_ID,renderId:tamperedCell.data.renderId,status:tamperedCell.data.status},screenshot,browserVersion:await browser.version()};fs.writeFileSync(path.join(dir,'product-truth.json'),JSON.stringify(proof,null,2));console.log('P2_SOURCE_TO_DASHBOARD_PRODUCT_TRUTH_BROWSER=PASS');} finally {await browser.close();}
''')

write('server/tests/sourceToDashboardCurriculumAcceptance.test.ts', r'''import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import { academyMinervaLab } from '../cpaOrganization/academyMinervaLab.js';import { sourceDashboardDir } from './fixtures/sourceToDashboardFixture.js';
const dir=sourceDashboardDir();const manifest=JSON.parse(fs.readFileSync(path.join(dir,'fixture-manifest.json'),'utf8'));const product=JSON.parse(fs.readFileSync(path.join(dir,'product-truth.json'),'utf8'));const integrity=JSON.parse(fs.readFileSync(path.join(dir,'presentation-integrity.json'),'utf8'));assert.equal(product.marker,'P2_SOURCE_TO_DASHBOARD_PRODUCT_TRUTH_BROWSER=PASS');assert.equal(integrity.marker,'P2_SOURCE_DASHBOARD_PRESENTATION_INTEGRITY=PASS');const refs=[`xlsx:${manifest.spreadsheet.sha256}:Revenue Register!B2`,`image:${manifest.receipt.sha256}:fixture-total-glyph-region`,`browser:${product.spreadsheet.renderId}`,`browser:${product.receipt.renderId}`,`tamper:${integrity.tamperedFactId}:review_required`];const report=academyMinervaLab.evaluateFiveDimensions({caseId:'CURR-PRODUCT-SOURCE-TO-DASHBOARD',executionId:`source-dashboard-${manifest.spreadsheet.sha256.slice(0,12)}`,dimensions:{SOURCE_COVERAGE:{checks:[{checkId:'two-physical-source-families',label:'Spreadsheet and image sources retain distinct exact physical identities',outcome:'PASS',evidenceRefs:refs.slice(0,2),details:[`Both independently show 53.23 but retain separate SHA/coordinate/provenance identities.`]},{checkId:'tampered-source-binding-blocked',label:'Cross-source SHA substitution cannot remain verified',outcome:'PASS',evidenceRefs:[refs[4]],details:integrity.tamperIssues}]},SEMANTIC_UNDERSTANDING:{checks:[{checkId:'semantic-not-targeted',label:'Semantic understanding is outside this Product Truth case',outcome:'NOT_TESTED',details:['This case tests source-to-render fidelity rather than semantic interpretation.']}]},ACCOUNTING_ACCURACY:{checks:[{checkId:'rendered-values-equal-source-values',label:'Both actual rendered values exactly equal their independent source values',outcome:'PASS',evidenceRefs:[refs[0],refs[1],refs[2],refs[3]],details:['Spreadsheet B2=53.23 and receipt total=53.23; the identical amount does not merge their provenance.']}]},PRODUCT_TRUTH:{checks:[{checkId:'spreadsheet-browser-clickthrough',label:'Actual built Eve spreadsheet-derived cell click-through reaches exact XLSX cell evidence',outcome:'PASS',evidenceRefs:[refs[0],refs[2]],details:[`render=${product.spreadsheet.renderId}`]},{checkId:'receipt-browser-clickthrough',label:'Actual built Eve image-derived cell click-through reaches exact receipt region evidence',outcome:'PASS',evidenceRefs:[refs[1],refs[3]],details:[`render=${product.receipt.renderId}`]},{checkId:'tampered-ui-not-verified',label:'Actual UI refuses verified Product Truth for a source-identity-mismatched fact',outcome:product.tampered.status==='review_required'?'PASS':'FAIL',evidenceRefs:[refs[4]],details:[`status=${product.tampered.status}`]}]},DELIVERABLE_TRUTH:{checks:[{checkId:'deliverable-not-targeted',label:'Final export lineage is reserved for the final deliverable case',outcome:'NOT_TESTED',details:['CURR-DELIVERABLE-FINAL-LINEAGE remains the dedicated export acceptance.']}]}}});assert.equal(report.dimensions.SOURCE_COVERAGE.status,'PASS');assert.equal(report.dimensions.ACCOUNTING_ACCURACY.status,'PASS');assert.equal(report.dimensions.PRODUCT_TRUTH.status,'PASS');assert.equal(report.dimensions.SEMANTIC_UNDERSTANDING.status,'NOT_TESTED');assert.equal(report.dimensions.DELIVERABLE_TRUTH.status,'NOT_TESTED');assert.equal(report.overallStatus,'INCOMPLETE_DIMENSION_COVERAGE');fs.writeFileSync(path.join(dir,'five-dimension.json'),JSON.stringify(report,null,2));console.log('P2_SOURCE_TO_DASHBOARD_TARGETED_DIMENSIONS=PASS');
''')

# Curriculum: final Product Truth case becomes contract-ready; only deliverable case remains pending.
replace_once('server/cpaOrganization/academyMinervaLab.ts',
"""        'PHYSICAL_FIXTURE_REQUIRED'
      ),
      caseSpec(
        'CURR-DELIVERABLE-FINAL-LINEAGE',
""",
"""        'CONTRACT_READY',
        ['server/tests/sourceToDashboardPresentationIntegrity.test.ts', 'server/tests/sourceToDashboardProductTruthBrowser.test.ts', 'server/tests/sourceToDashboardCurriculumAcceptance.test.ts', 'docs/launch/evidence/2026-09-16_P2_SOURCE_TO_DASHBOARD_PRODUCT_TRUTH_ACCEPTANCE.md']
      ),
      caseSpec(
        'CURR-DELIVERABLE-FINAL-LINEAGE',
""")
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts','assert.equal(coverage.contractReadyCases, 18);\nassert.equal(coverage.physicalFixturePendingCases, 2);','assert.equal(coverage.contractReadyCases, 19);\nassert.equal(coverage.physicalFixturePendingCases, 1);')
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts',
"""assert.ok(find('CURR-PRODUCT-SOURCE-TO-DASHBOARD').expectedSafeguards.join(' ').includes('actual browser-rendered value'));
""",
"""assert.equal(find('CURR-PRODUCT-SOURCE-TO-DASHBOARD').fixtureStatus, 'CONTRACT_READY');
assert.ok(find('CURR-PRODUCT-SOURCE-TO-DASHBOARD').expectedSafeguards.join(' ').includes('actual browser-rendered value'));
assert.ok(find('CURR-PRODUCT-SOURCE-TO-DASHBOARD').validationRefs.includes('server/tests/sourceToDashboardProductTruthBrowser.test.ts'));
""")
print('SOURCE_TO_DASHBOARD_PATCH_APPLIED')
