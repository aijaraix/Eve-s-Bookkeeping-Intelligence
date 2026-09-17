import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { buildMixedSourceBatchEngagement, prepareMixedSourceBatch } from './fixtures/mixedSourceBatchAcceptanceHelpers.js';
import { batchEvidenceDir, BATCH_ENGAGEMENT_ID } from './fixtures/mixedSourceBatchFixture.js';

const engagement=await buildMixedSourceBatchEngagement();
const prepared=await prepareMixedSourceBatch();
const baseUrl=process.env.EVE_TEST_BASE_URL||'http://127.0.0.1:4173';
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean) as string[];
const executablePath=candidates.find(p=>fs.existsSync(p));
if(!executablePath)throw new Error('MISSING_BROWSER_EXECUTABLE');
const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
try{
  const page=await browser.newPage();
  await page.setViewport({width:1440,height:1200});
  await page.setRequestInterception(true);
  page.on('request',async req=>{
    try{
      const url=new URL(req.url());
      if(url.origin!==new URL(baseUrl).origin||!url.pathname.startsWith('/api/'))return req.continue();
      let payload:any={};
      if(url.pathname==='/api/cpa/engagements/universal')payload={engagements:[{engagementId:engagement.engagementId,workspaceId:engagement.workspaceId,classification:'ACADEMY',isCustomer:false,clientName:engagement.clientName,period:engagement.period,framework:engagement.framework,functionalCurrency:'USD',currentStage:'EVIDENCE_REVIEW',openReviewNotesCount:1,documentsCount:4,canonicalFactsCount:4}]};
      else if(url.pathname===`/api/cpa/engagements/${BATCH_ENGAGEMENT_ID}`)payload={engagement};
      else if(url.pathname==='/api/cpa/reports/library')payload={reports:[]};
      else if(url.pathname==='/api/queue/jobs')payload={jobs:[]};
      else if(url.pathname==='/api/health')payload={status:'ok'};
      await req.respond({status:200,contentType:'application/json',body:JSON.stringify(payload)});
    }catch{req.abort();}
  });
  const response=await page.goto(`${baseUrl}/?view=engagement-evidence`,{waitUntil:'networkidle0',timeout:30000});
  assert.ok(response?.ok());
  const selector='[data-eve-mixed-batch="true"]';
  await page.waitForSelector(selector,{visible:true,timeout:15000});
  const text=await page.$eval(selector,el=>(el as HTMLElement).innerText);
  for(const expected of ['Mixed-source batch isolation review','BLOCKED_SOURCE_IDENTITY_MISMATCH','REQUEST_BATCH_SOURCE_RECONCILIATION','NOT AGGREGATED','SPREADSHEET','PDF','IMAGE','CSV','USD 53.23','USD 53.24','USD 53.25','USD 53.26','Expense Register!B2','PDF page=1','fixture-total-glyph-region','CSV row=2 column=2','SOURCE_SHA_DOES_NOT_MATCH_COORDINATE_SHA'])assert.ok(text.includes(expected),`browser missing ${expected}`);
  for(const sha of Object.values(prepared.sourceShas))assert.ok(text.includes(String(sha)),`browser missing source sha ${sha}`);
  const screenshot=path.join(batchEvidenceDir(),'mixed-source-batch-product-truth.png');
  await page.screenshot({path:screenshot,fullPage:true});
  fs.writeFileSync(path.join(batchEvidenceDir(),'product-truth.json'),JSON.stringify({marker:'P2_MIXED_SOURCE_BATCH_PRODUCT_TRUTH_BROWSER=PASS',screenshot:path.basename(screenshot),status:prepared.tamperedReview.status,promotionState:prepared.tamperedReview.promotionState,sourceShas:prepared.sourceShas,browserVersion:await browser.version()},null,2));
  console.log('P2_MIXED_SOURCE_BATCH_PRODUCT_TRUTH_BROWSER=PASS');
}finally{await browser.close();}
