/** Isolated lifecycle regression: fictional inputs, no provider calls or production authority. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const repo = process.cwd();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-report-custody-'));
const savedEnv = { ...process.env };
const savedFetch = globalThis.fetch;
process.chdir(tmp);
process.env.NODE_ENV = 'test';
process.env.ACADEMY_AUTONOMOUS_ENABLED = 'false';
process.env.HERMES_REPORTS_DIR = path.join(tmp, 'storage', 'reports');
process.env.STORAGE_FILE = path.join(tmp, 'storage', 'ai_cpa_storage.json');
process.env.AI_CPA_STORAGE_FILE = process.env.STORAGE_FILE;
for (const key of ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY']) delete process.env[key];
globalThis.fetch = async () => { throw new Error('EXTERNAL_FETCH_DISABLED_IN_LIFECYCLE_TEST'); };
try {
  const { deliverableArtifactService: service } = await import(pathToFileURL(path.join(repo, 'server/cpaOrganization/deliverableArtifactService.ts')).href);
  const { professionalSignoffGuard: guard } = await import(pathToFileURL(path.join(repo, 'server/cpaOrganization/professionalSignoffGuard.ts')).href);
  const params = {
    reportId: 'ISOLATED-LIFECYCLE-REPORT', engagementId: 'eng-isolated-lifecycle', workspaceId: 'ws-isolated-lifecycle',
    version: 'v1', title: 'Isolated lifecycle test draft', clientName: 'Fictional Test Entity',
    period: 'FY 2024', currency: 'USD', status: 'FINAL_CERTIFIED', facts: [],
    euclidBalance: { assets: 10, liabilities: 6, equity: 4, variance: 0 }
  };
  const compiled = await service.compileAndRegisterDeliverable(params);
  assert.equal(compiled.status, 'READY_FOR_AUTHORIZED_HUMAN_REVIEW', 'caller status must not certify a generated package');
  assert.equal(guard.getApprovalForReport(params.reportId, compiled.formats.pdf.sha256), undefined);
  const jsonPath = compiled.formats.json.filepath;
  assert.ok(jsonPath.startsWith(tmp + path.sep));
  const persisted = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  assert.equal(persisted.status, 'READY_FOR_AUTHORIZED_HUMAN_REVIEW', 'persisted package must remain draft');
  assert.ok(fs.readFileSync(compiled.formats.pdf.filepath).subarray(0,5).equals(Buffer.from('%PDF-')), 'exercise real renderer, not a mocked compiler');

  // Recognizing a principal and session is deliberately insufficient: no approval event is recorded.
  const principal = { principalId: 'fictional-lifecycle-principal', displayName: 'Fictional Test Reviewer', isHuman: true, role: 'ENGAGEMENT_PARTNER', status: 'ACTIVE', sessionValid: true, licenseDetails: { licenseNumber: 'FICTIONAL-ONLY', jurisdiction: 'TEST', status: 'ACTIVE', verificationSource: 'ISOLATED_TEST' }, authorizedEngagements: [params.engagementId], authorizedTenants: ['fixture-tenant'] };
  guard.setAuthorityProvider({ name: 'ISOLATED_LIFECYCLE_TEST', resolvePrincipalAuthority: ({principalId}: any) => principalId === principal.principalId ? principal : null, verifySession: (sessionId: string, principalId: string) => sessionId === 'fictional-session' && principalId === principal.principalId, verifyLicenseStatus: () => 'ACTIVE' });
  const claimedApproval = {
    approvalId: 'fictional-never-recorded', principalId: principal.principalId, authorizedIdentity: principal.displayName, authorizedRole: 'ENGAGEMENT_PARTNER',
    authenticationContext: { sessionId: 'fictional-session', authenticationMethod: 'BEARER_TOKEN', timestamp: new Date().toISOString() },
    engagementId: params.engagementId, reportId: params.reportId, reportVersion: params.version, reportHash: compiled.formats.pdf.sha256,
    approvalScope: 'STATUTORY_DELIVERABLE_RELEASE', timestamp: new Date().toISOString(), approvalStatus: 'APPROVED', status: 'APPROVED', approvalMethod: 'INTERACTIVE_PORTAL', sourceAuthority: 'HUMAN_AUTHORITY', signatureType: 'PHYSICAL_HUMAN'
  };
  persisted.status = 'FINAL_CERTIFIED'; persisted.approvalObject = claimedApproval;
  fs.writeFileSync(jsonPath, JSON.stringify(persisted));
  // Clear this isolated instance's cache to prove the disk rehydration decision.
  service.artifacts = new Map();
  assert.equal(service.rehydrateFromDisk(), 1);
  const rehydrated = service.getArtifactByReportId(params.reportId, params.version);
  assert.ok(rehydrated, 'positive retrieval must succeed');
  assert.equal(rehydrated.status, 'READY_FOR_AUTHORIZED_HUMAN_REVIEW', 'shaped approval without an active ledger event cannot certify after restart');
  assert.equal(guard.getApprovalForReport(params.reportId, compiled.formats.pdf.sha256), undefined);
  guard.setAuthorityProvider(null);
  console.log('reportLifecycleCustody: PASS caller certification rejected; real generated package stays draft; unrecorded approval rejected during disk rehydration');
} finally {
  globalThis.fetch = savedFetch;
  process.chdir(repo);
  for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
  Object.assign(process.env, savedEnv);
  fs.rmSync(tmp, { recursive: true, force: true });
}
