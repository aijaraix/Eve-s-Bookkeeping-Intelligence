import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-raw-live-'));
const storageFile = path.join(root, 'accounting.json');
fs.writeFileSync(storageFile, JSON.stringify({
  workspaces: [{ id: 'ws-live-raw', name: 'North Star Synthetic Office', code: 'NSSO', currency: 'USD', country: 'US', classification: 'ACADEMY', tenantClassification: 'ACADEMY_SYNTHETIC', createdAt: new Date().toISOString() }],
  documents: [], facts: [], findings: [], snapshots: [], auditLogs: [], discrepancies: [], agentLogs: [], pageManifests: [], sourceBlocks: [], reports: [],
}));
Object.assign(process.env, {
  NODE_ENV: 'test', NO_SERVER_LISTEN: 'true', STORAGE_FILE: storageFile,
  QUEUE_FILE: path.join(root, 'queue.json'), INTAKE_SESSIONS_FILE: path.join(root, 'intakes.json'),
  EVE_IDENTITY_DIR: path.join(root, 'identity'), EVE_UNIVERSITY_DIR: path.join(root, 'university'),
  EVE_RAW_CONTINUATION_DIR: path.join(root, 'continuations'), EVE_RAW_WORKPAPER_DIR: path.join(root, 'workpapers'),
  HERMES_REPORTS_DIR: path.join(root, 'reports'), EVE_CLARIFICATION_DIR: path.join(root, 'clarifications'),
  HERMES_PERSISTENT_DATA_DIR: path.join(root, 'runtime-authority'),
  TEST_QUEUE_AUTHORITY: 'true', TEST_QUEUE_PROCESSING_AUTHORITY: 'true', TEST_INTAKE_CREATOR_AUTHORITY: 'true',
});

const { eveApp } = await import('../../server.js');
const { identityStore } = await import('../access/accessPortal.js');
const { rawInputHermesContinuationService } = await import('../cpaOrganization/rawInputHermesContinuation.js');
const ownerPassword = `Owner-${crypto.randomUUID()}-Aa1!`;
const customerPassword = `Customer-${crypto.randomUUID()}-Aa1!`;
identityStore.transaction(state => state.tenants.push({ id: 'tenant-live-raw', name: 'North Star Synthetic Office', workspaceIds: ['ws-live-raw'] }));
function activate(email: string, role: 'OWNER' | 'CLIENT_ADMIN', tenantId: string | null, password: string) {
  const invitation = identityStore.invite(email, role, tenantId, 'raw-live-test', role === 'OWNER');
  const first = identityStore.login(email, invitation.temporaryPassword, '127.0.0.1');
  assert.ok(first);
  identityStore.changePassword(first.token, password, '');
}
activate('owner@raw-live.invalid', 'OWNER', null, ownerPassword);
activate('customer@raw-live.invalid', 'CLIENT_ADMIN', 'tenant-live-raw', customerPassword);

const server = eveApp.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${(server.address() as any).port}`;
const origin = `https://127.0.0.1:${(server.address() as any).port}`;

async function login(email: string, password: string) {
  const start = await fetch(`${base}/login`, { headers: { host: 'eve.test' } });
  const html = await start.text();
  const csrf = html.match(/name="csrf" value="([^"]+)"/)?.[1];
  const pre = start.headers.getSetCookie().map(value => value.split(';')[0]).find(value => value.startsWith('__Host-eve_login_csrf='));
  assert.ok(csrf && pre);
  const response = await fetch(`${base}/auth/login`, {
    method: 'POST', redirect: 'manual',
    headers: { host: 'eve.test', origin, cookie: pre, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, password, csrf }),
  });
  assert.equal(response.status, 303);
  const cookie = response.headers.getSetCookie().map(value => value.split(';')[0]).find(value => value.startsWith('__Host-eve_session='));
  assert.ok(cookie);
  const sessionResponse = await fetch(`${base}/api/access/session`, { headers: { host: 'eve.test', cookie } });
  assert.equal(sessionResponse.status, 200);
  return { cookie, csrf: (await sessionResponse.json()).csrf as string };
}

let journeyFailure: unknown = null;
try {
  const customer = await login('customer@raw-live.invalid', customerPassword);
  const receipt = [
    'NORTH STAR OFFICE MARKET', 'RECEIPT R-LIVE-001', 'DATE 2026-09-23', 'CURRENCY USD',
    'ARCHIVE FOLDERS 2 x $12.50 = $25.00', 'SUBTOTAL $25.00', 'SALES TAX $2.00', 'TOTAL $27.00',
    'PAYMENT METHOD VISA', 'ACCOUNTING CATEGORY OFFICE SUPPLIES',
  ].join('\n');
  const form = new FormData();
  form.set('workspaceId', 'ws-live-raw'); form.set('uploadIntent', 'ATTACH_TO_EXISTING_PROJECT');
  form.set('files', new File([receipt], 'vertical-receipt.txt', { type: 'text/plain' }));
  const upload = await fetch(`${base}/api/portal/intake`, {
    method: 'POST', headers: { host: 'eve.test', origin, cookie: customer.cookie, 'x-eve-csrf': customer.csrf }, body: form,
  });
  const uploadText = await upload.text();
  assert.equal(upload.status, 200, uploadText);
  const uploadResult = JSON.parse(uploadText);
  assert.equal(uploadResult.status, 'QUEUED');

  const deadline = Date.now() + 45_000;
  let continuation: any = null;
  while (Date.now() < deadline) {
    continuation = rawInputHermesContinuationService.getAllContinuations().find(row => row.workspaceId === 'ws-live-raw');
    if (continuation?.executions.at(-1)?.stage === 'MINERVA_GRADING') break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(continuation, 'live upload must create a raw continuation');
  assert.equal(continuation.executions.at(-1)?.stage, 'MINERVA_GRADING');
  for (const stage of ['EVIDENCE_COMPLETION', 'CANONICALIZATION', 'ACCOUNTING_CLASSIFICATION', 'POSTING_WORKPAPER', 'REPORT_DELIVERABLE', 'LINEAGE_VERIFICATION']) {
    assert.equal(continuation.executions.find((row: any) => row.stage === stage)?.status, 'COMPLETED', `${stage} must physically complete`);
  }

  const portal = await fetch(`${base}/portal`, { headers: { host: 'eve.test', cookie: customer.cookie } });
  const portalHtml = await portal.text();
  assert.equal(portal.status, 200);
  for (const expected of ['North Star Synthetic Office', 'vertical-receipt.txt', 'Raw accounting continuation', 'MINERVA_GRADING', 'REVERSE_LINEAGE_VERIFIED', 'Raw Input Accounting Review Package']) {
    assert.ok(portalHtml.includes(expected), `customer portal missing ${expected}`);
  }
  const reportUrl = portalHtml.match(/href="([^"]*\/api\/portal\/report[^"]*format=json)"/)?.[1]?.replaceAll('&amp;', '&');
  assert.ok(reportUrl);
  const download = await fetch(`${base}${reportUrl}`, { headers: { host: 'eve.test', cookie: customer.cookie } });
  assert.equal(download.status, 200);
  const reportBytes = Buffer.from(await download.arrayBuffer());
  assert.equal(download.headers.get('x-artifact-sha256'), crypto.createHash('sha256').update(reportBytes).digest('hex'));

  const owner = await login('owner@raw-live.invalid', ownerPassword);
  const ownerPage = await fetch(`${base}/owner/university`, { headers: { host: 'eve.test', cookie: owner.cookie } });
  const ownerHtml = await ownerPage.text();
  assert.equal(ownerPage.status, 200);
  for (const expected of ['University Overview', 'North Star Synthetic Office', 'Minerva', 'Workforce', 'Hermes']) assert.ok(ownerHtml.includes(expected), `owner command center missing ${expected}`);
  assert.equal(continuation.status, 'ACTIVE', 'Minerva must remain queued until real browser and deliverable readback proof is recorded');
  assert.equal(continuation.physicalProof, undefined);

  console.log('UNIVERSITY_RAW_LIVE_SERVER_JOURNEY=PASS');
} catch (error) {
  journeyFailure = error;
} finally {
  await new Promise<void>(resolve => server.close(() => resolve()));
  fs.rmSync(root, { recursive: true, force: true });
}
if (journeyFailure) {
  console.error(journeyFailure);
  process.exit(1);
}
process.exit(0);
