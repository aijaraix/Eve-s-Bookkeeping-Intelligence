import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer, { type Page } from 'puppeteer-core';

const exactBuild = 'cab90405b0a18453488891718509799f8fcfeef0';
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-checkpoint4-'));
const evidenceRoot = path.join(process.cwd(), 'docs', 'university', 'evidence', 'checkpoint-4-cab90405');
const browserEvidenceRoot = path.join(evidenceRoot, 'browser');
fs.mkdirSync(browserEvidenceRoot, { recursive: true });

const storageFile = path.join(root, 'accounting.json');
fs.writeFileSync(storageFile, JSON.stringify({
  workspaces: [{
    id: 'ws-checkpoint4-vertical', name: 'North Star Synthetic Office', code: 'NSSO', currency: 'USD', country: 'US',
    classification: 'ACADEMY', tenantClassification: 'ACADEMY_SYNTHETIC', createdAt: new Date().toISOString(),
  }],
  documents: [], facts: [], findings: [], snapshots: [], auditLogs: [], discrepancies: [], agentLogs: [],
  pageManifests: [], sourceBlocks: [], reports: [],
}, null, 2));

Object.assign(process.env, {
  NODE_ENV: 'production', NO_SERVER_LISTEN: 'true', API_ONLY: 'false', STORAGE_FILE: storageFile,
  QUEUE_FILE: path.join(root, 'queue.json'), INTAKE_SESSIONS_FILE: path.join(root, 'intakes.json'),
  EVE_IDENTITY_DIR: path.join(root, 'identity'), EVE_SUPPORT_DIR: path.join(root, 'support'),
  EVE_UNIVERSITY_DIR: path.join(root, 'university'), EVE_RAW_CONTINUATION_DIR: path.join(root, 'continuations'),
  EVE_RAW_WORKPAPER_DIR: path.join(root, 'workpapers'), HERMES_REPORTS_DIR: path.join(root, 'reports'),
  EVE_CLARIFICATION_DIR: path.join(root, 'clarifications'), EVE_TASK_SUFFICIENCY_DIR: path.join(root, 'task-sufficiency'),
  HERMES_PERSISTENT_DATA_DIR: path.join(root, 'runtime-authority'), SEMANTIC_TASKS_FILE: path.join(root, 'semantic-tasks.json'),
  EVE_PUBLIC_LEADS_DIR: path.join(root, 'public-leads'), SOURCE_GIT_COMMIT_SHA: exactBuild,
  TEST_QUEUE_AUTHORITY: 'true', TEST_QUEUE_PROCESSING_AUTHORITY: 'true', TEST_INTAKE_CREATOR_AUTHORITY: 'true',
  ACADEMY_AUTONOMOUS_ENABLED: 'false',
});

const receiptPath = path.join(root, 'vertical-receipt.txt');
fs.writeFileSync(receiptPath, [
  'NORTH STAR OFFICE MARKET', 'RECEIPT R-CP4-001', 'DATE 2026-09-23', 'CURRENCY USD',
  'ARCHIVE FOLDERS 2 x $12.50 = $25.00', 'SUBTOTAL $25.00', 'SALES TAX $2.00', 'TOTAL $27.00',
  'PAYMENT METHOD VISA', 'ACCOUNTING CATEGORY OFFICE SUPPLIES',
].join('\n'));

const certKey = path.join(root, 'localhost.key');
const certFile = path.join(root, 'localhost.crt');
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', certKey, '-out', certFile,
  '-days', '1', '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1'], { stdio: 'ignore' });

const browserExecutable = process.env.EVE_ACCEPTANCE_BROWSER;
assert.ok(browserExecutable && fs.existsSync(browserExecutable), 'EVE_ACCEPTANCE_BROWSER must point to the local Chromium executable');

const { eveApp } = await import('../server.js');
const { identityStore } = await import('../server/access/accessPortal.js');
const { rawInputHermesContinuationService } = await import('../server/cpaOrganization/rawInputHermesContinuation.js');

identityStore.transaction(state => state.tenants.push({
  id: 'tenant-checkpoint4', name: 'North Star Synthetic Office', workspaceIds: ['ws-checkpoint4-vertical'], classification: 'ACADEMY_SYNTHETIC',
}));

const ownerPassword = `Owner-${crypto.randomUUID()}-Aa1!`;
const customerPassword = `Customer-${crypto.randomUUID()}-Aa1!`;
function activate(email: string, role: 'OWNER' | 'CLIENT_ADMIN', tenantId: string | null, password: string) {
  const invitation = identityStore.invite(email, role, tenantId, 'checkpoint4-local-browser', role === 'OWNER');
  const first = identityStore.login(email, invitation.temporaryPassword, '127.0.0.1');
  assert.ok(first, `Synthetic ${role} activation must succeed`);
  identityStore.changePassword(first.token, password, '');
}
activate('owner@checkpoint4.invalid', 'OWNER', null, ownerPassword);
activate('customer@checkpoint4.invalid', 'CLIENT_ADMIN', 'tenant-checkpoint4', customerPassword);

const server = https.createServer({ key: fs.readFileSync(certKey), cert: fs.readFileSync(certFile) }, eveApp);
await new Promise<void>((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const address = server.address();
assert.ok(address && typeof address === 'object');
const base = `https://127.0.0.1:${address.port}`;

const screenshotNames: string[] = [];
async function screenshot(page: Page, name: string, heading?: string) {
  if (heading) {
    await page.evaluate(value => {
      const target = [...document.querySelectorAll('h1,h2,h3')].find(element => element.textContent?.trim() === value);
      target?.scrollIntoView({ block: 'start' });
    }, heading);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await page.screenshot({ path: path.join(browserEvidenceRoot, name), fullPage: !heading, type: 'png' });
  screenshotNames.push(name);
}

async function login(page: Page, email: string, password: string, destination: '/portal' | '/owner') {
  await page.goto(`${base}/login`, { waitUntil: 'networkidle0' });
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[data-eve-action-id="auth.login"]'),
  ]);
  assert.ok(page.url().endsWith(destination), `Normal authentication must reach ${destination}`);
}

async function loopbackJson(url: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
  return await new Promise<{ status: number; body: any }>((resolve, reject) => {
    const request = https.request(url, { method: options.method || 'GET', headers: options.headers, rejectUnauthorized: false }, response => {
      const chunks: Buffer[] = [];
      response.on('data', chunk => chunks.push(Buffer.from(chunk)));
      response.on('end', () => {
        try { resolve({ status: response.statusCode || 0, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }); }
        catch (error) { reject(error); }
      });
    });
    request.on('error', reject);
    if (options.body) request.write(options.body);
    request.end();
  });
}

const browser = await puppeteer.launch({
  executablePath: browserExecutable,
  headless: true,
  args: [
    '--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--disable-dev-shm-usage', '--disable-gpu',
    '--disable-background-networking', '--disable-component-update', '--disable-sync', '--metrics-recording-only', '--no-pings',
    '--proxy-server=direct://', '--proxy-bypass-list=*', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
  ],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 1 },
});

let acceptanceFailure: unknown = null;
try {
  const customerContext = await browser.createBrowserContext();
  const customerPage = await customerContext.newPage();
  await login(customerPage, 'customer@checkpoint4.invalid', customerPassword, '/portal');
  assert.match(await customerPage.content(), /North Star Synthetic Office/);
  await screenshot(customerPage, '01-customer-workspace-before-upload.png');

  const chooser = await customerPage.$('input[type="file"]');
  assert.ok(chooser, 'Customer Documents upload control must render');
  await chooser.uploadFile(receiptPath);
  await Promise.all([
    customerPage.waitForNavigation({ waitUntil: 'networkidle0' }),
    customerPage.click('button[data-eve-action-id="customer.documents.upload"]'),
  ]);
  assert.match(await customerPage.content(), /QUEUED/);
  await screenshot(customerPage, '02-customer-upload-accepted.png');

  const deadline = Date.now() + 45_000;
  let continuation: any = null;
  while (Date.now() < deadline) {
    continuation = rawInputHermesContinuationService.getAllContinuations().find(row => row.workspaceId === 'ws-checkpoint4-vertical');
    if (continuation?.executions.at(-1)?.stage === 'MINERVA_GRADING') break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(continuation, 'Browser upload must create a raw-input continuation');
  assert.equal(continuation.executions.at(-1)?.stage, 'MINERVA_GRADING');

  await customerPage.goto(`${base}/portal`, { waitUntil: 'networkidle0' });
  const customerHtml = await customerPage.content();
  for (const expected of ['vertical-receipt.txt', 'Transaction facts', 'NORTH STAR OFFICE MARKET', 'OFFICE SUPPLIES', 'Evidence and provenance',
    'Workpaper / books', 'DRAFT_NOT_POSTED_TO_PRODUCTION_BOOKS', 'YES', 'Four-format deliverable', 'PDF', 'XLSX', 'CSV', 'JSON',
    'Reverse lineage', 'REVERSE_LINEAGE_VERIFIED']) assert.ok(customerHtml.includes(expected), `Customer UI missing ${expected}`);
  await screenshot(customerPage, '03-customer-documents-and-source.png', 'Documents');
  await screenshot(customerPage, '04-customer-processing-and-accounting.png', 'Processing and accounting stages');
  await screenshot(customerPage, '05-customer-transaction-facts.png', 'Transaction facts');
  await screenshot(customerPage, '06-customer-evidence-provenance.png', 'Evidence and provenance');
  await screenshot(customerPage, '07-customer-workpaper-books.png', 'Workpaper / books');
  await screenshot(customerPage, '08-customer-four-format-deliverable.png', 'Four-format deliverable');
  await screenshot(customerPage, '09-customer-reverse-lineage.png', 'Reverse lineage');

  const downloadRoot = path.join(root, 'browser-downloads');
  fs.mkdirSync(downloadRoot, { recursive: true });
  const downloadSession = await customerPage.createCDPSession();
  await downloadSession.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadRoot });
  const reportLinks = await customerPage.$$('a[href*="/api/portal/report"]');
  const readbacks: Array<{ format: string; status: number; headerSha256: string | undefined; bytes: number[] }> = [];
  for (const link of reportLinks) {
    const href = await link.evaluate(element => (element as HTMLAnchorElement).href);
    const format = new URL(href).searchParams.get('format')?.toUpperCase() || 'UNKNOWN';
    const responsePromise = customerPage.waitForResponse(response => response.url() === href, { timeout: 10_000 });
    await link.click();
    const response = await responsePromise;
    const disposition = response.headers()['content-disposition'] || '';
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    assert.ok(filename, `${format} download must provide a filename`);
    const target = path.join(downloadRoot, path.basename(filename));
    const downloadDeadline = Date.now() + 10_000;
    while (!fs.existsSync(target) && Date.now() < downloadDeadline) await new Promise(resolve => setTimeout(resolve, 50));
    assert.ok(fs.existsSync(target), `${format} browser download must reach disk`);
    readbacks.push({ format, status: response.status(), headerSha256: response.headers()['x-artifact-sha256'], bytes: [...fs.readFileSync(target)] });
  }
  assert.deepEqual(readbacks.map(row => row.format).sort(), ['CSV', 'JSON', 'PDF', 'XLSX']);
  const deliverableEvidenceRefs = readbacks.map(row => {
    assert.equal(row.status, 200, `${row.format} browser download must succeed`);
    const actual = crypto.createHash('sha256').update(Buffer.from(row.bytes)).digest('hex');
    assert.equal(actual, row.headerSha256, `${row.format} browser readback hash must match`);
    return `readback:${row.format.toLowerCase()}:${actual}`;
  });

  await customerPage.goto(`${base}/portal`, { waitUntil: 'networkidle0' });
  await screenshot(customerPage, '10-customer-exceptions-not-applicable.png', 'Shared findings');

  const ownerContext = await browser.createBrowserContext();
  const ownerPage = await ownerContext.newPage();
  await login(ownerPage, 'owner@checkpoint4.invalid', ownerPassword, '/owner');
  await screenshot(ownerPage, '11-owner-overview.png');
  await ownerPage.goto(`${base}/owner/customers`, { waitUntil: 'networkidle0' });
  await screenshot(ownerPage, '12-owner-customers.png');
  await ownerPage.goto(`${base}/owner/customers/ws-checkpoint4-vertical`, { waitUntil: 'networkidle0' });
  for (const expected of ['Customer detail', 'vertical-receipt.txt', 'Academy Accounting Case', 'Workpaper / books', 'Four-format deliverable', 'Reverse lineage']) assert.ok((await ownerPage.content()).includes(expected), `Owner customer UI missing ${expected}`);
  await screenshot(ownerPage, '13-owner-customer-detail.png');
  await ownerPage.goto(`${base}/owner/documents`, { waitUntil: 'networkidle0' });
  await screenshot(ownerPage, '14-owner-documents.png');
  await ownerPage.goto(`${base}/owner/exceptions`, { waitUntil: 'networkidle0' });
  await screenshot(ownerPage, '15-owner-exceptions-not-applicable.png');
  await ownerPage.goto(`${base}/owner/reports`, { waitUntil: 'networkidle0' });
  await screenshot(ownerPage, '16-owner-reports.png');
  await ownerPage.goto(`${base}/owner/academy`, { waitUntil: 'networkidle0' });
  await screenshot(ownerPage, '17-owner-academy.png');
  await ownerPage.goto(`${base}/owner/university`, { waitUntil: 'networkidle0' });
  const universityBefore = await ownerPage.content();
  for (const expected of ['University Overview', 'North Star Synthetic Office', 'Raw Accounting Case State', 'MINERVA_GRADING', 'Workpaper / books', 'Four-format deliverable', 'Reverse lineage']) assert.ok(universityBefore.includes(expected), `Owner University UI missing ${expected}`);
  await screenshot(ownerPage, '18-owner-university-before-grade.png');

  const productEvidenceRefs = screenshotNames.map(name => `screenshot:docs/university/evidence/checkpoint-4-cab90405/browser/${name}`);
  const ownerCookies = await ownerPage.cookies(base);
  const cookieHeader = ownerCookies.map(item => `${item.name}=${item.value}`).join('; ');
  const csrfToken = await ownerPage.$eval('input[name="csrf"]', element => (element as HTMLInputElement).value);
  const gradeBody = JSON.stringify({ productEvidenceRefs, deliverableEvidenceRefs });
  const gradeResult = await loopbackJson(`${base}/api/university/raw-continuations/${continuation.continuationId}/physical-proof`, {
    method: 'POST',
    headers: { origin: base, cookie: cookieHeader, 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(gradeBody)), 'x-eve-csrf': csrfToken },
    body: gradeBody,
  });
  assert.equal(gradeResult.status, 200, JSON.stringify(gradeResult.body));
  const minervaResult = gradeResult.body?.execution?.resultData?.minervaResult;
  assert.ok(['PASS', 'CLARIFICATION_PASS', 'FAIL', 'BLOCKED'].includes(minervaResult), 'Minerva must return a truthful governed disposition');

  await ownerPage.goto(`${base}/owner/university`, { waitUntil: 'networkidle0' });
  assert.ok((await ownerPage.content()).includes(minervaResult), `Owner University must render Minerva result ${minervaResult}`);
  await screenshot(ownerPage, '19-owner-university-minerva-grade.png', 'Independent Minerva');
  await customerPage.goto(`${base}/portal`, { waitUntil: 'networkidle0' });
  assert.ok((await customerPage.content()).includes(minervaResult), `Customer UI must render Minerva result ${minervaResult}`);
  await screenshot(customerPage, '20-customer-final-accounting-lineage-grade.png');

  const finalContinuation = rawInputHermesContinuationService.getContinuation(continuation.continuationId)!;
  const workpaper = finalContinuation.executions.find(row => row.stage === 'POSTING_WORKPAPER')?.resultData?.workpaper;
  const deliverable = finalContinuation.executions.find(row => row.stage === 'REPORT_DELIVERABLE')?.resultData;
  const lineage = finalContinuation.executions.find(row => row.stage === 'LINEAGE_VERIFICATION')?.resultData;
  const manifest = {
    checkpoint: 4, exactBuild, runtime: 'LOCAL_SAME_NAMESPACE_HTTPS_EXPRESS_CHROMIUM_LOOPBACK_ONLY',
    browser: await browser.version(), syntheticAuth: 'PASS', customerBrowser: 'PASS', ownerBrowser: 'PASS',
    case: { continuationId: finalContinuation.continuationId, examinationId: finalContinuation.examinationId, sourceType: finalContinuation.documentKind, workspaceId: finalContinuation.workspaceId, tenantClassification: 'ACADEMY_SYNTHETIC' },
    transactionFacts: finalContinuation.facts.length, evidence: finalContinuation.facts.every((fact:any) => fact.sourceSha256 && fact.sourceCoordinate) ? 'COMPLETE' : 'INCOMPLETE',
    canonicalAccounting: finalContinuation.executions.find(row => row.stage === 'CANONICALIZATION')?.outcomeCode,
    downstreamWorkers: finalContinuation.executions.map(row => ({ stage: row.stage, workerId: row.workerId, status: row.status, outcomeCode: row.outcomeCode, receiptHash: row.receiptHash })),
    workpaperBooks: { workpaperId: workpaper?.workpaperId, balanced: workpaper?.control?.balanced, postingState: workpaper?.postingState },
    deliverable: { reportId: deliverable?.reportId, version: deliverable?.version, formats: deliverableEvidenceRefs },
    reverseLineage: { valid: lineage?.valid, count: lineage?.reverseLineage?.length }, minervaResult,
    screenshotCount: screenshotNames.length, screenshots: screenshotNames.map(name => `browser/${name}`),
    productionTouched: false, oldK3sCandidateTouched: false, mainTouched: false, recoveryBranchTouched: false, pr31Merged: false,
    completedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(evidenceRoot, 'acceptance-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`CHECKPOINT4_LOCAL_BROWSER_ACCEPTANCE=${minervaResult}`);
  console.log(`SCREENSHOT_COUNT=${screenshotNames.length}`);
  console.log(`EVIDENCE_PATH=${path.relative(process.cwd(), evidenceRoot)}`);
} catch (error) {
  acceptanceFailure = error;
} finally {
  await browser.close();
  await new Promise<void>(resolve => server.close(() => resolve()));
  fs.rmSync(root, { recursive: true, force: true });
}

if (acceptanceFailure) {
  console.error(acceptanceFailure);
  process.exit(1);
}
process.exit(0);
