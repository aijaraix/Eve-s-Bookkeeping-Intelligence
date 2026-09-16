import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { buildInvoiceApEngagement, buildInvoiceApInterpretation, INVOICE_ENGAGEMENT_ID, INVOICE_SHA256, invoiceEvidenceDir } from './fixtures/invoiceApFiveDimensionFixture.js';

const baseUrl = process.env.EVE_TEST_BASE_URL || 'http://127.0.0.1:4173';
const evidenceDir = invoiceEvidenceDir(); fs.mkdirSync(evidenceDir,{recursive:true});
const invoice = buildInvoiceApInterpretation(); const engagement = buildInvoiceApEngagement(invoice);
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean) as string[];
const executablePath=candidates.find(p=>fs.existsSync(p)); if(!executablePath) throw new Error('MISSING_BROWSER_EXECUTABLE');
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage(); await page.setViewport({width:1440,height:1100}); await page.setRequestInterception(true);
 page.on('request',async request=>{try{const url=new URL(request.url()); if(url.origin!==new URL(baseUrl).origin||!url.pathname.startsWith('/api/'))return request.continue(); let payload:any={};
   if(url.pathname==='/api/cpa/engagements/universal')payload={engagements:[{engagementId:engagement.engagementId,workspaceId:engagement.workspaceId,classification:'ACADEMY',isCustomer:false,clientName:engagement.clientName,period:engagement.period,framework:engagement.framework,functionalCurrency:engagement.functionalCurrency,currentStage:engagement.currentStage,openReviewNotesCount:0,documentsCount:1,canonicalFactsCount:1}]};
   else if(url.pathname===`/api/cpa/engagements/${INVOICE_ENGAGEMENT_ID}`)payload={engagement};
   else if(url.pathname==='/api/cpa/reports/library')payload={reports:[]}; else if(url.pathname==='/api/queue/jobs')payload={jobs:[]}; else if(url.pathname==='/api/health')payload={status:'ok'};
   await request.respond({status:200,contentType:'application/json',body:JSON.stringify(payload)});
 }catch{request.abort();}});
 const response=await page.goto(`${baseUrl}/?view=engagement-evidence`,{waitUntil:'networkidle0',timeout:30000}); assert.ok(response?.ok());
 const selector='[data-eve-ap-invoice-id="INV-260916-1042"]'; await page.waitForSelector(selector,{visible:true,timeout:15000});
 const panelText=await page.$eval(selector,el=>(el as HTMLElement).innerText);
 for(const expected of ['SYNTHETIC OFFICE SUPPLY CO.','Invoice INV-260916-1042','09/16/2026','10/16/2026','PO-EVE-1001','USD','USD 175.00','USD 12.25','USD 187.25','Arithmetic reconciliation: PASS','Three-way match: NOT_TESTABLE','Independent purchase-order record: NOT PROVIDED','Receiving evidence: NOT PROVIDED','Approval: REVIEW_REQUIRED','Payment eligibility: BLOCKED','Payment status: UNKNOWN','Posting: NOT_POSTED','Debit account classification: REVIEW_REQUIRED','RESOLVED_FIELD_CONSENSUS','INV0ICE INV-260916-1042','INVOICE INV-260916-1042']) assert.ok(panelText.includes(expected),`AP product panel missing ${expected}`);
 const attrs=await page.$eval(selector,(el:any)=>({approval:el.dataset.eveApApprovalStatus,payment:el.dataset.eveApPaymentEligibility,match:el.dataset.eveApThreeWayMatch}));
 assert.deepEqual(attrs,{approval:'REVIEW_REQUIRED',payment:'BLOCKED',match:'NOT_TESTABLE'});
 await page.$eval(`${selector} details[data-eve-ap-lineage="true"]`,(el:any)=>{el.open=true;});
 const lineageText=await page.$eval(`${selector} details[data-eve-ap-lineage="true"]`,el=>(el as HTMLElement).innerText);
 assert.ok(lineageText.includes(INVOICE_SHA256)); assert.ok(lineageText.includes('ocr:paddleocr:')); assert.ok(lineageText.includes('ocr:doctr:'));
 const screenshot=path.join(evidenceDir,'invoice-ap-product-truth.png'); await page.screenshot({path:screenshot,fullPage:true});
 const proof={marker:'P2_INVOICE_AP_PRODUCT_TRUTH_BROWSER=PASS',sourceSha256:INVOICE_SHA256,invoiceNumber:invoice.invoiceNumber.value,approvalStatus:invoice.apControl.approvalStatus,paymentEligibility:invoice.apControl.paymentEligibility,threeWayMatch:invoice.apControl.threeWayMatchStatus,screenshot,browserVersion:await browser.version()};
 fs.writeFileSync(path.join(evidenceDir,'product-truth.json'),JSON.stringify(proof,null,2)); console.log('P2_INVOICE_AP_PRODUCT_TRUTH_BROWSER=PASS');
}finally{await browser.close();}
