import assert from 'node:assert/strict';
import fs from 'node:fs';
import { rejectLegacyIssuance, projectFirmBranding } from '../legacyIssuanceGate.js';

const hostileRequest: any = {
  body: { workspaceId: 'preserved-company', signedOffBy: 'attacker@example.test', firmBranding: { partnerName: 'Caller, CPA', opinionType: 'FINAL_CERTIFIED' } },
  headers: { 'x-user-email': 'attacker@example.test' },
};
const before = JSON.stringify(hostileRequest);
function probe(req: any) {
  const result: any = {};
  const res: any = { status: (value: number) => { result.status = value; return res; }, json: (value: any) => { result.body = value; return res; } };
  rejectLegacyIssuance(req, res);
  assert.equal(result.status, 409);
  assert.equal(result.body.error, 'LEGACY_ISSUANCE_DISABLED');
  assert.equal(result.body.success, false);
}
probe(hostileRequest);
assert.equal(JSON.stringify(hostileRequest), before);
// Even a request that throws on any access is rejected: no caller authority is read.
probe(new Proxy({}, { get() { throw new Error('Request must not be read'); } }));
const source = fs.readFileSync(new URL('../../server.ts', import.meta.url), 'utf8');
assert.equal((source.match(/app\.post\("\/api\/deliverables\/generate"/g) || []).length, 1);
assert.ok(source.includes('app.post("/api/deliverables/generate", rejectLegacyIssuance);'));
const cpaRoutes = fs.readFileSync(new URL('../cpaOrganization/cpaOrganizationRoutes.ts', import.meta.url), 'utf8');
assert.equal((cpaRoutes.match(/router\.post\('\/report\/compile'/g) || []).length, 1);
assert.ok(cpaRoutes.includes("router.post('/report/compile', rejectLegacyIssuance);"));
const modal = fs.readFileSync(new URL('../../src/components/ReportWizardModal.tsx', import.meta.url), 'utf8');
assert.ok(!/fetch\(|compileAndRegisterDeliverable|FINAL_CERTIFIED|generateReport\(|window\.open|createObjectURL|handleExecuteCompilation/.test(modal));
assert.ok(modal.includes('Legacy issuance is disabled.'));
const deliverablesView = fs.readFileSync(new URL('../../src/components/views/engagement/DeliverablesView.tsx', import.meta.url), 'utf8');
assert.ok(!deliverablesView.includes('ReportWizardModal'));
assert.ok(!deliverablesView.includes('SyntheticClientPortalModal'));
const gateSource = fs.readFileSync(new URL('../legacyIssuanceGate.ts', import.meta.url), 'utf8');
assert.ok(!/\b(?:fs|db|saveStorage|ReportingEngine|generateFinancialReport)\b/.test(gateSource));
const defaults = projectFirmBranding();
for (const field of ['firmName', 'partnerName', 'licenseNumber', 'firmAddress', 'phone', 'email']) assert.equal(defaults[field as keyof typeof defaults], '');
assert.equal(defaults.opinionType, 'Pending Review');
const configured = { firmName: 'Configured Practice', licenseNumber: 'Configured License', authorityStatus: 'APPROVED' };
const projected = projectFirmBranding(configured);
assert.equal(projected.firmName, configured.firmName);
assert.equal(projected.licenseNumber, configured.licenseNumber);
assert.equal(projected.authorityStatus, 'CONFIGURATION_ONLY_NOT_PROFESSIONAL_AUTHORITY');
assert.equal(configured.authorityStatus, 'APPROVED');
console.log('legacyIssuanceGate: hostile caller claims rejected without request access or report/storage dependencies; neutral branding preserves configured values without granting authority');
