/** Independent review probes; these are isolated function/handler tests, NOT browser or production proof.
 * No application server is started, no production credential is used, and all writable
 * application paths resolve under a new temporary test directory before modules load.
 * Positive signatures below are deliberately fabricated fixtures and must be rejected.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = process.cwd();
if (process.env.NODE_ENV !== 'test') throw new Error('REVIEW_REQUIRES_TEST_ENVIRONMENT');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-export-v2-review-'));
process.chdir(root);
process.env.ACADEMY_AUTONOMOUS_ENABLED = 'false';
process.env.STORAGE_FILE = path.join(root, 'storage', 'ai_cpa_storage.json');
process.env.AI_CPA_STORAGE_FILE = process.env.STORAGE_FILE;
for (const key of ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY']) delete process.env[key];
globalThis.fetch = async () => { throw new Error('EXTERNAL_FETCH_DISABLED_IN_ISOLATED_REVIEW'); };

const observations: Array<{check: string; passed: boolean; observed: unknown}> = [];
function record(check: string, passed: boolean, observed: unknown) {
  observations.push({ check, passed, observed });
  console.log('REVIEW_CHECK=' + JSON.stringify({ check, passed, observed }));
}
async function load(relative: string): Promise<any> {
  return import(pathToFileURL(path.join(repo, relative)).href);
}

async function main() {
  const { eveInternalAuditEngine } = await load('server/cpaOrganization/eveInternalAuditEngine.ts');
  const { deliverableArtifactService } = await load('server/cpaOrganization/deliverableArtifactService.ts');
  const { formatUncertainty } = await load('server/cpaOrganization/verifiedCustomerContinuationService.ts');
  const { createCPAOrganizationRouter } = await load('server/cpaOrganization/cpaOrganizationRoutes.ts');

  const draft = eveInternalAuditEngine.auditDeliverableTruth({
    reportId: 'REVIEW-FIXTURE-DRAFT', version: 'v1',
    status: 'READY_FOR_AUTHORIZED_HUMAN_REVIEW', euclidVariance: 0, facts: []
  });
  record('Unsigned draft: technical status separate from issuance',
    draft.compliant === true && draft.deliveryGateStatus === 'DELIVERY_BLOCKED_PENDING_REVIEW',
    {compliant: draft.compliant, delivery: draft.deliveryGateStatus});

  const missing = eveInternalAuditEngine.auditDeliverableTruth({
    reportId: 'REVIEW-FIXTURE-CERTIFIED', version: 'v1', status: 'FINAL_CERTIFIED', facts: []
  });
  record('Claimed final status without approval is rejected',
    missing.compliant === false && missing.deliveryGateStatus === 'DELIVERY_BLOCKED_PENDING_REVIEW',
    {compliant: missing.compliant, delivery: missing.deliveryGateStatus});

  for (const signatureProvided of [true, false]) {
    // Not registered with the trusted authority provider; no principal, session,
    // engagement binding, report/version/hash binding, or real license verification.
    const invented: any = {status: 'APPROVED', approverName: 'Review Fixture', approverLicenseNumber: 'NOT-A-REAL-LICENSE'};
    if (signatureProvided) invented.signatureType = 'PHYSICAL_HUMAN';
    const r = eveInternalAuditEngine.auditDeliverableTruth({
      reportId: 'REVIEW-FIXTURE-UNTRUSTED', version: 'v1', status: 'FINAL_CERTIFIED',
      formats: {pdf: {sha256: 'a'.repeat(64)}}, facts: [], approvalObject: invented
    });
    record('Unregistered shaped approval rejected; signature field=' + signatureProvided,
      r.compliant === false && r.deliveryGateStatus === 'DELIVERY_BLOCKED_PENDING_REVIEW',
      {compliant: r.compliant, delivery: r.deliveryGateStatus, registeredAuthority: false});
  }

  const reportId = 'REVIEW-FIXTURE-VERSIONS';
  const files: Record<string, string> = {};
  for (const version of ['v1', 'v2']) {
    files[version] = path.join(root, 'review-' + version + '.fixture');
    fs.writeFileSync(files[version], 'ISOLATED REVIEW BYTES ' + version);
  }
  const artifact = (version: string) => {
    const entry = {filepath: files[version], filename: path.basename(files[version]), sha256: version === 'v1' ? '1'.repeat(64) : '2'.repeat(64)};
    return {reportId, version, engagementId: 'eng-review-fixture', generatedAt: version === 'v1' ? '2024-01-01T00:00:00Z' : '2024-02-01T00:00:00Z', formats: {pdf: entry, xlsx: entry, json: entry, csvLeadSchedules: entry}};
  };
  // Direct service method check against a controlled in-memory fixture, no production writes.
  const originalMap = (deliverableArtifactService as any).artifacts;
  (deliverableArtifactService as any).artifacts = new Map([['eng-review-fixture', [artifact('v2'), artifact('v1')]]]);
  try {
    const exact = deliverableArtifactService.getArtifactByReportId(reportId, 'v1');
    record('Service method can select an explicitly supplied version', exact?.version === 'v1', {version: exact?.version});
  } finally { (deliverableArtifactService as any).artifacts = originalMap; }

  const router = createCPAOrganizationRouter() as any;
  const originalLookup = deliverableArtifactService.getArtifactByReportId;
  let observedArgs: any[] = [];
  // Test only the real registered handler's propagation of query.version.
  // This stub distinguishes the current default from the selected historical version.
  deliverableArtifactService.getArtifactByReportId = (...args: any[]) => {
    observedArgs = args;
    return artifact(args[1] === 'v1' ? 'v1' : 'v2');
  };
  try {
    for (const format of ['pdf', 'xlsx', 'json', 'csv']) {
      const routePath = '/report/download-' + format;
      const layer = router.stack.find((x: any) => x.route &&
        (Array.isArray(x.route.path) ? x.route.path.includes(routePath) : x.route.path === routePath));
      if (!layer) { record('Download handler forwards selected version: ' + format, false, {missingHandler: true}); continue; }
      observedArgs = [];
      let status = 200;
      let deliveredPath: string | null = null;
      const res: any = {
        status(code: number) { status = code; return this; },
        setHeader() { return this; },
        json() { return this; },
        sendFile(p: string) { deliveredPath = p; return this; }
      };
      await layer.route.stack[0].handle({query: {reportId, version: 'v1'}}, res, () => {});
      record('Download handler forwards selected version: ' + format,
        status === 200 && observedArgs[1] === 'v1' && deliveredPath === files.v1,
        {status, requestedVersion: 'v1', lookupVersion: observedArgs[1] ?? null,
         deliveredVersion: deliveredPath === files.v1 ? 'v1' : deliveredPath === files.v2 ? 'v2' : null});
    }
  } finally { deliverableArtifactService.getArtifactByReportId = originalLookup; }

  const text = formatUncertainty({topic: 'Fixture topic', description: 'Fixture description'});
  record('Formatter uses production helper for a simple structured finding',
    text === '[Fixture topic] Fixture description', {text});
  const result = {source: 'ISOLATED_FUNCTION_AND_HANDLER_TESTS', passed: observations.filter(x => x.passed).length,
    failed: observations.filter(x => !x.passed).length, observations,
    browserAcceptance: 'NOT_EXECUTED', productionDataAccess: 'NONE', deliveryPerformed: false};
  fs.writeFileSync(path.join(repo, 'studio-second-export-review-results.json'), JSON.stringify(result, null, 2));
  console.log('REVIEW_SUMMARY=' + JSON.stringify({passed: result.passed, failed: result.failed, browserAcceptance: result.browserAcceptance}));
  process.chdir(repo);
  fs.rmSync(root, {recursive: true, force: true});
  process.exit(result.failed ? 1 : 0);
}
main().catch((error) => {
  console.error('REVIEW_HARNESS_ERROR=' + String(error));
  process.chdir(repo);
  fs.rmSync(root, {recursive: true, force: true});
  process.exit(2);
});
