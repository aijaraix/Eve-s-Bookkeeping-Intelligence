import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import {
  RECEIPT_ENGAGEMENT_ID, RECEIPT_FACT_ID, RECEIPT_PROVENANCE_ID, RECEIPT_SHA256,
  buildReceiptEngagement, loadReceiptSourceRegionEvidence, receiptEvidenceDir,
} from './fixtures/receiptFiveDimensionFixture.js';

const baseUrl = process.env.EVE_TEST_BASE_URL || 'http://127.0.0.1:4173';
const evidenceDir = receiptEvidenceDir();
fs.mkdirSync(evidenceDir, { recursive: true });
const region = loadReceiptSourceRegionEvidence();
const engagement = buildReceiptEngagement(region);
const candidates = [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean) as string[];
const executablePath = candidates.find(p => fs.existsSync(p));
if (!executablePath) throw new Error('MISSING_BROWSER_EXECUTABLE');

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on('request', async request => {
    try {
      const url = new URL(request.url());
      if (url.origin !== new URL(baseUrl).origin || !url.pathname.startsWith('/api/')) return request.continue();
      let payload: any = {};
      if (url.pathname === '/api/cpa/engagements/universal') {
        payload = { engagements: [{
          engagementId: engagement.engagementId, workspaceId: engagement.workspaceId, classification: 'ACADEMY', isCustomer: false,
          clientName: engagement.clientName, period: engagement.period, framework: engagement.framework,
          functionalCurrency: engagement.functionalCurrency, currentStage: engagement.currentStage, openReviewNotesCount: 0,
          documentsCount: 1, canonicalFactsCount: 1,
        }] };
      } else if (url.pathname === `/api/cpa/engagements/${encodeURIComponent(RECEIPT_ENGAGEMENT_ID)}` || url.pathname === `/api/cpa/engagements/${RECEIPT_ENGAGEMENT_ID}`) {
        payload = { engagement };
      } else if (url.pathname === '/api/cpa/reports/library') {
        payload = { reports: [] };
      } else if (url.pathname === '/api/queue/jobs') {
        payload = { jobs: [] };
      } else if (url.pathname === '/api/health') {
        payload = { status: 'ok' };
      }
      await request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
    } catch (error) {
      request.abort();
    }
  });

  const response = await page.goto(`${baseUrl}/?view=financials-income`, { waitUntil: 'networkidle0', timeout: 30000 });
  assert.ok(response?.ok(), `feature preview navigation failed: ${response?.status()}`);
  const selector = `[data-eve-financial-value="true"][data-canonical-fact-id="${RECEIPT_FACT_ID}"]`;
  await page.waitForSelector(selector, { visible: true, timeout: 15000 });
  const cell = await page.$eval(selector, (el: any) => ({
    text: el.innerText.trim(), factId: el.dataset.canonicalFactId, renderId: el.dataset.renderId,
    metric: el.dataset.canonicalMetric, period: el.dataset.period, currency: el.dataset.currency,
  }));
  assert.equal(cell.text, '$53.23');
  assert.equal(cell.factId, RECEIPT_FACT_ID);
  assert.equal(cell.metric, 'selling_general_and_administrative', 'presentation adapter intentionally canonicalizes operating_expenses into the SGA statement line');
  assert.equal(cell.period, 'FY 2026');
  assert.equal(cell.currency, 'USD');
  assert.ok(cell.renderId, 'actual product cell must register reverse-render lineage');

  await page.click(selector);
  await page.waitForSelector('[role="dialog"]', { visible: true, timeout: 10000 });
  const normalText = await page.$eval('[role="dialog"]', el => (el as HTMLElement).innerText);
  for (const expected of [
    'Source-to-Pixel Provenance', 'receipt.png', 'TOTAL $53.23', '900×1000', 'fixture-total-glyph-region',
    RECEIPT_PROVENANCE_ID, 'local-ocr:paddleocr', '3.7.0',
    'x=0.0667 y=0.5590 w=0.3211 h=0.0370 NORMALIZED',
  ]) assert.ok(normalText.includes(expected), `provenance drawer missing ${expected}`);

  await page.click('[data-eve-action-id="evidence.technical"]');
  const advancedText = await page.$eval('[role="dialog"]', el => (el as HTMLElement).innerText);
  assert.ok(advancedText.includes(RECEIPT_SHA256));
  assert.ok(advancedText.includes(RECEIPT_FACT_ID));
  assert.ok(advancedText.includes(cell.renderId));

  const screenshot = path.join(evidenceDir, 'product-truth-browser.png');
  await page.screenshot({ path: screenshot, fullPage: true });
  const proof = {
    marker: 'P2_RECEIPT_PRODUCT_TRUTH_BROWSER=PASS',
    sourceSha256: RECEIPT_SHA256,
    engagementId: RECEIPT_ENGAGEMENT_ID,
    factId: RECEIPT_FACT_ID,
    provenanceId: RECEIPT_PROVENANCE_ID,
    renderId: cell.renderId,
    visibleValue: cell.text,
    sourceLocation: region.normalizedBoundingBox,
    screenshot,
    browserVersion: await browser.version(),
  };
  fs.writeFileSync(path.join(evidenceDir, 'product-truth.json'), JSON.stringify(proof, null, 2));
  console.log('P2_RECEIPT_PRODUCT_TRUTH_BROWSER=PASS');
} finally {
  await browser.close();
}
