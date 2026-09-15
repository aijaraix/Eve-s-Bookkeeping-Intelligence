/** Isolated review of FV-08 approval-event custody and FV-05/FV-11 version rehydration.
 * These fixtures are NOT real clients, human approvals, browser sessions, or production evidence.
 * The prior 10-check suite is preserved unchanged and run separately.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const repo = process.cwd();
if (process.env.NODE_ENV !== 'test') throw new Error('REVIEW_REQUIRES_TEST_ENVIRONMENT');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-export-v3-review-'));
process.chdir(root);
process.env.ACADEMY_AUTONOMOUS_ENABLED = 'false';
process.env.STORAGE_FILE = path.join(root, 'storage', 'ai_cpa_storage.json');
process.env.AI_CPA_STORAGE_FILE = process.env.STORAGE_FILE;
for (const key of ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY']) delete process.env[key];
globalThis.fetch = async () => { throw new Error('EXTERNAL_FETCH_DISABLED_IN_ISOLATED_REVIEW'); };
const observations: Array<{check: string; passed: boolean; observed: unknown}> = [];
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
function record(check: string, passed: boolean, observed: unknown): void {
  observations.push({check, passed, observed});
  console.log('CUSTODY_REVIEW_CHECK=' + JSON.stringify({check, passed, observed}));
}
async function load(relative: string): Promise<any> {
  return import(pathToFileURL(path.join(repo, relative)).href);
}

async function main(): Promise<void> {
  const {eveInternalAuditEngine: audit} = await load('server/cpaOrganization/eveInternalAuditEngine.ts');
  const {professionalSignoffGuard: guard} = await load('server/cpaOrganization/professionalSignoffGuard.ts');
  const {deliverableArtifactService: artifacts} = await load('server/cpaOrganization/deliverableArtifactService.ts');
  const principal = {
    principalId: 'review-fixture-principal', displayName: 'Review Fixture Human',
    isHuman: true, role: 'ENGAGEMENT_PARTNER', status: 'ACTIVE', sessionValid: true,
    licenseDetails: {licenseNumber: 'FICTIONAL-REVIEW-LICENSE', jurisdiction: 'TEST', status: 'ACTIVE', verificationSource: 'ISOLATED_TEST_FIXTURE'},
    authorizedEngagements: ['eng-review-custody'], authorizedTenants: ['tenant-review-fixture']
  };
  // A controlled authority provider recognizes a fictional licensed principal/session.
  // This is intentionally NOT an approval event or registration in the report-approval ledger.
  guard.setAuthorityProvider({
    name: 'ISOLATED_REVIEW_PROVIDER',
    resolvePrincipalAuthority: ({principalId}: any) => principalId === principal.principalId ? clone(principal) : null,
    verifySession: (sessionId: string, principalId: string) => sessionId === 'review-fixture-session' && principalId === principal.principalId,
    verifyLicenseStatus: () => 'ACTIVE'
  });
  const report: any = {
    reportId: 'REVIEW-CUSTODY-REPORT', engagementId: 'eng-review-custody', version: 'v1',
    status: 'FINAL_CERTIFIED', formats: {pdf: {sha256: 'a'.repeat(64)}}, facts: [], euclidVariance: 0,
    quinnReview: {deliveryEligible: true}
  };
  const unregistered: any = {
    approvalId: 'review-approval-never-recorded', principalId: principal.principalId,
    authorizedIdentity: principal.displayName, authorizedRole: 'ENGAGEMENT_PARTNER',
    authenticationContext: {sessionId: 'review-fixture-session', authenticationMethod: 'BEARER_TOKEN', timestamp: new Date().toISOString()},
    engagementId: report.engagementId, reportId: report.reportId, reportVersion: report.version,
    reportHash: report.formats.pdf.sha256, approvalScope: 'STATUTORY_DELIVERABLE_RELEASE',
    timestamp: new Date().toISOString(), approvalStatus: 'APPROVED', status: 'APPROVED',
    approvalMethod: 'INTERACTIVE_PORTAL', sourceAuthority: 'HUMAN_AUTHORITY', signatureType: 'PHYSICAL_HUMAN'
  };
  const before = guard.getApprovalForReport(report.reportId, report.formats.pdf.sha256);
  const r1 = await audit.auditDeliverableTruth({...report, approvalObject: unregistered});
  record('Known principal is not a recorded report approval',
    !before && r1.deliveryGateStatus === 'DELIVERY_BLOCKED_PENDING_REVIEW',
    {registeredBefore: Boolean(before), compliant: r1.compliant, delivery: r1.deliveryGateStatus});

  // Positive control: exercise the existing approval-event method within the isolated fixture store.
  const event = await guard.processHumanApprovalEventAsync({
    eventId: 'review-fixture-event', authenticatedPrincipalId: principal.principalId,
    engagementId: report.engagementId, reportId: report.reportId, reportVersion: report.version,
    expectedReportHash: report.formats.pdf.sha256, approvalScope: 'STATUTORY_DELIVERABLE_RELEASE',
    eventContext: clone(unregistered.authenticationContext), approvalMethod: 'INTERACTIVE_PORTAL', action: 'APPROVE'
  });
  if (!event.success || !event.approval) throw new Error('ISOLATED_REGISTERED_FIXTURE_SETUP_FAILED');
  const recorded = guard.getApprovalForReport(report.reportId, report.formats.pdf.sha256);
  const snapshot = clone(event.approval);
  const valid = await audit.auditDeliverableTruth({...report, approvalObject: clone(snapshot)});
  record('Positive control: registered fixture event remains eligible in matching scope',
    recorded?.approvalId === snapshot.approvalId && valid.deliveryGateStatus === 'ELIGIBLE_FOR_DELIVERY',
    {registered: Boolean(recorded), delivery: valid.deliveryGateStatus});
  const wrongVersion = await audit.auditDeliverableTruth({...report, version: 'v2', approvalObject: clone(snapshot)});
  record('Registered approval cannot authorize a different version',
    wrongVersion.deliveryGateStatus === 'DELIVERY_BLOCKED_PENDING_REVIEW', {delivery: wrongVersion.deliveryGateStatus});
  const revoked = guard.revokeOrInvalidateApproval(snapshot.approvalId, 'VERSION_SUPERSEDED');
  const activeAfter = guard.getApprovalForReport(report.reportId, report.formats.pdf.sha256);
  const replay = await audit.auditDeliverableTruth({...report, approvalObject: clone(snapshot)});
  record('Revoked ledger approval cannot be resurrected with an old approved copy',
    revoked.success && !activeAfter && replay.deliveryGateStatus === 'DELIVERY_BLOCKED_PENDING_REVIEW',
    {ledgerRevoked: revoked.success, activeApprovalAfterRevocation: Boolean(activeAfter), delivery: replay.deliveryGateStatus});

  guard.setAuthorityProvider(null);
  const store = path.join(root, 'storage', 'reports');
  fs.mkdirSync(store, {recursive: true});
  const id = 'REVIEW-REHYDRATION-REPORT';
  for (const [version, generatedAt] of [['v1', '2024-01-01T00:00:00Z'], ['v2', '2024-02-01T00:00:00Z']]) {
    fs.writeFileSync(path.join(store, `audit_package_${id}_${version}.json`), JSON.stringify({
      reportId: id, version, engagementId: 'eng-review-versions', workspaceId: 'ws-review-versions',
      clientName: 'Isolated Version Fixture', title: 'Fixture Only', period: 'FY 2023', currency: 'USD',
      generatedAt, status: 'READY_FOR_AUTHORIZED_HUMAN_REVIEW', facts: []
    }));
    fs.writeFileSync(path.join(store, `audit_report_${id}_${version}.pdf`), 'NOT A REAL PDF; ISOLATED VERSION BYTES ' + version);
  }
  // Empty only this temporary test instance's cache to exercise actual disk rehydration.
  artifacts.artifacts = new Map();
  artifacts.rehydrateFromDisk();
  const versions = artifacts.getAllArtifacts().filter((r: any) => r.reportId === id).map((r: any) => r.version).sort();
  record('Disk rehydration retains both versions of one report',
    JSON.stringify(versions) === JSON.stringify(['v1', 'v2']), {versions});
  const latest = artifacts.getArtifactByReportId(id);
  record('Default lookup selects latest persisted timestamp', latest?.version === 'v2', {version: latest?.version});
  const exact = artifacts.getArtifactByReportId(id, 'v1');
  const computedHash = exact ? crypto.createHash('sha256').update(fs.readFileSync(exact.formats.pdf.filepath)).digest('hex') : null;
  record('Explicit historical version retains its own bytes after rehydration',
    exact?.version === 'v1' && computedHash === exact.formats.pdf.sha256, {version: exact?.version, hashMatches: computedHash === exact?.formats?.pdf?.sha256});
  const missing = artifacts.getArtifactByReportId(id, 'absent-version');
  record('Missing requested version is not replaced by latest', missing === undefined, {returnedVersion: missing?.version ?? null});

  const result = {classification: 'ISOLATED_FUNCTION_AND_DISK_REHYDRATION_TESTS',
    passed: observations.filter(x => x.passed).length, failed: observations.filter(x => !x.passed).length,
    observations, productionDataAccess: 'NONE', actualHumanApprovalPerformed: false, browserAcceptance: 'NOT_EXECUTED'};
  fs.writeFileSync(path.join(repo, 'studio-third-export-review-results.json'), JSON.stringify(result, null, 2));
  console.log('CUSTODY_REVIEW_SUMMARY=' + JSON.stringify({passed: result.passed, failed: result.failed}));
  process.chdir(repo); fs.rmSync(root, {recursive: true, force: true});
  process.exit(result.failed ? 1 : 0);
}
main().catch(error => {
  console.error('REVIEW_HARNESS_ERROR=' + String(error));
  process.chdir(repo); fs.rmSync(root, {recursive: true, force: true}); process.exit(2);
});
