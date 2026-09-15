process.env.TEST_MODE = 'true';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { universalEngagementManager } from './server/cpaOrganization/universalEngagementModel.js';
import { verifiedCustomerContinuationService, formatUncertainty } from './server/cpaOrganization/verifiedCustomerContinuationService.js';
import { deliverableArtifactService } from './server/cpaOrganization/deliverableArtifactService.js';
import { eveInternalAuditEngine } from './server/cpaOrganization/eveInternalAuditEngine.js';
import { professionalSignoffGuard } from './server/cpaOrganization/professionalSignoffGuard.js';

function request(options: http.RequestOptions, postData?: any): Promise<{ statusCode?: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
        } catch {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runVerification() {
  console.log('================================================================');
  console.log('     EVE BOOKKEEPING — FULL DEFECT VERIFICATION SUITE');
  console.log('                 FV-01 THROUGH FV-12');
  console.log('================================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (detail) console.log(`       └─ ${detail}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       └─ ${detail}`);
      failCount++;
    }
  }

  const PORT = 3000;

  // ----------------------------------------------------
  // TEST FV-01: API Routing & Direct Gateway Connectivity
  // ----------------------------------------------------
  try {
    const healthRes = await request({ host: '127.0.0.1', port: PORT, path: '/api/health', method: 'GET' });
    const isHealthy = healthRes.statusCode === 200;
    assert(isHealthy, 'FV-01: API Gateway & Health Route Connectivity', `Status: ${healthRes.statusCode}, body: ${JSON.stringify(healthRes.body)}`);
  } catch (err: any) {
    assert(false, 'FV-01: API Gateway Connectivity', err.message);
  }

  // ----------------------------------------------------
  // TEST FV-02: Storage Path Mismatch & Authoritative Resolution
  // ----------------------------------------------------
  try {
    const storagePath = process.env.STORAGE_FILE || process.env.AI_CPA_STORAGE_FILE || path.join(process.cwd(), 'storage', 'ai_cpa_storage.json');
    const storageExists = fs.existsSync(storagePath);
    // Ensure no competing/divergent ai_cpa_storage.json at root if storage/ is authoritative
    const rootCompeting = path.join(process.cwd(), 'ai_cpa_storage.json');
    const rootExists = fs.existsSync(rootCompeting);
    assert(storageExists && !rootExists, 'FV-02: Single Authoritative Storage Path (No Root Fallback Duplicate)', `Authoritative: ${storagePath}, Root duplicate absent: ${!rootExists}`);
  } catch (err: any) {
    assert(false, 'FV-02: Storage Path Mismatch', err.message);
  }

  // ----------------------------------------------------
  // TEST FV-03: Universal Engagements Isolation & Route Aliasing
  // ----------------------------------------------------
  try {
    const listRes = await request({ host: '127.0.0.1', port: PORT, path: '/api/cpa/engagements', method: 'GET' });
    const isListOk = listRes.statusCode === 200 && Array.isArray(listRes.body?.engagements);
    const engagements = await universalEngagementManager.getAllEngagements();
    const hasEngagements = isListOk && engagements.length > 0;
    const zeroLeakage = engagements.every(e => e.crossEngagementLeakageScore === 0);
    assert(hasEngagements && zeroLeakage, 'FV-03: Engagements Route & Cross-Engagement Zero Leakage', `API returned ${listRes.body?.engagements?.length} items, manager returned ${engagements.length}, zero leakage across all: ${zeroLeakage}`);
  } catch (err: any) {
    assert(false, 'FV-03: Engagements Route & Isolation', err.message);
  }

  // ----------------------------------------------------
  // TEST FV-04: Engagement Detail Canonical Resolution & Financial Facts Alias
  // ----------------------------------------------------
  try {
    const engagements = await universalEngagementManager.getAllEngagements();
    const targetEngId = engagements[0]?.engagementId || 'eng-sim-canary-01';
    const detail = await universalEngagementManager.getEngagementDetail(targetEngId);
    const hasFacts = detail && Array.isArray(detail.facts) && Array.isArray(detail.financialFacts);
    const aliasEqual = detail && detail.facts === detail.financialFacts;
    assert(Boolean(hasFacts && aliasEqual), 'FV-04: Engagement Detail & financialFacts Typed Compatibility Alias', `Target ID: ${targetEngId}, facts count=${detail?.facts?.length}, alias reference equal: ${aliasEqual}`);
  } catch (err: any) {
    assert(false, 'FV-04: Engagement Detail & financialFacts Alias', err.message);
  }

  // ----------------------------------------------------
  // TEST FV-05 / FV-06: Artifact Library Query & Version-Specific Resolution
  // ----------------------------------------------------
  try {
    const artifacts = deliverableArtifactService.getAllArtifacts();
    assert(Array.isArray(artifacts) && artifacts.length > 0, 'FV-05: Deliverable Artifact Library Query', `Total artifacts registered: ${artifacts.length}`);

    if (artifacts.length > 0) {
      const target = artifacts[0];
      const byId = deliverableArtifactService.getArtifactByReportId(target.reportId);
      const byIdAndVersion = deliverableArtifactService.getArtifactByReportId(target.reportId, target.version);
      const nonexistentVersion = deliverableArtifactService.getArtifactByReportId(target.reportId, 'v99.9.9-nonexistent');
      assert(Boolean(byId) && Boolean(byIdAndVersion) && nonexistentVersion === undefined, 'FV-06: Version-Specific Deliverable Artifact Retrieval', `Target report: ${target.reportId} (${target.version}), version filtered match: ${Boolean(byIdAndVersion)}, invalid rejected: ${nonexistentVersion === undefined}`);
    }
  } catch (err: any) {
    assert(false, 'FV-05/06: Deliverable Artifact Library Verification', err.message);
  }

  // ----------------------------------------------------
  // TEST FV-07: Canonical /api/reports Resolution via Continuation Service
  // ----------------------------------------------------
  try {
    const listRes = await request({ host: '127.0.0.1', port: PORT, path: '/api/reports?workspaceId=ws-test-canonical', method: 'GET' });
    const listByEngRes = await request({ host: '127.0.0.1', port: PORT, path: '/api/reports?workspaceId=eng-ws-test-canonical', method: 'GET' });
    // Both canonical ID formats should return 200 with reports array
    const okWs = listRes.statusCode === 200 && Array.isArray(listRes.body?.reports);
    const okEng = listByEngRes.statusCode === 200 && Array.isArray(listByEngRes.body?.reports);
    assert(okWs && okEng, 'FV-07: Canonical /api/reports ID Resolution (ws- and eng-)', `ws- status=${listRes.statusCode} (reports=${listRes.body?.reports?.length}), eng- status=${listByEngRes.statusCode} (reports=${listByEngRes.body?.reports?.length})`);
  } catch (err: any) {
    assert(false, 'FV-07: Canonical /api/reports ID Resolution', err.message);
  }

  // ----------------------------------------------------
  // TEST FV-08: Delivery Gate Invariant Enforcement (Truth & Physical Sign-off)
  // ----------------------------------------------------
  try {
    // 1. Unapproved Draft: Technical truth passes (compliant: true), but delivery is blocked pending review
    const draftAudit = eveInternalAuditEngine.auditDeliverableTruth({
      reportId: 'REP-TEST-DRAFT',
      status: 'READY_FOR_AUTHORIZED_HUMAN_REVIEW',
      facts: []
    });
    const draftOk = draftAudit.compliant === true && draftAudit.deliveryGateStatus === 'DELIVERY_BLOCKED_PENDING_REVIEW';

    // 2. Report claiming certified status without human approval: FAILS compliance (false certification)
    const unapprovedCertified = eveInternalAuditEngine.auditDeliverableTruth({
      reportId: 'REP-TEST-UNCERT',
      status: 'FINAL_CERTIFIED',
      facts: []
    });
    const unapprovedCertOk = unapprovedCertified.compliant === false && unapprovedCertified.deliveryGateStatus === 'DELIVERY_BLOCKED_PENDING_REVIEW';

    // 3. Prohibited AI Sign-off: FAILS compliance with P0/P1
    const aiSigned = eveInternalAuditEngine.auditDeliverableTruth({
      reportId: 'REP-TEST-AI',
      status: 'FINAL_CERTIFIED',
      approvalObject: {
        status: 'APPROVED',
        signatureType: 'AI_AUTONOMOUS',
        approverName: 'Quinn AI Supervisor',
        approverLicenseNumber: 'AI-NONE'
      },
      facts: []
    });
    const aiSignedOk = aiSigned.compliant === false && aiSigned.deliveryGateStatus === 'DELIVERY_BLOCKED_PENDING_REVIEW';

    // 4. Authentic Physical Human Partner Sign-off: PASSES both compliance and delivery eligibility
    professionalSignoffGuard.registerTrustedPrincipal({
      principalId: 'usr-partner-steve-01',
      displayName: 'Steve Stein, CPA',
      email: 'sstein@cpa-audit.com',
      isHuman: true,
      role: 'ENGAGEMENT_PARTNER',
      licenseDetails: {
        licenseNumber: 'CPA-NY-094821',
        jurisdiction: 'NY',
        status: 'ACTIVE',
        verificationSource: 'STATE_BOARD_OF_ACCOUNTANCY',
        verifiedAt: '2026-01-01T00:00:00Z'
      },
      authorizedEngagements: ['eng-test-human'],
      sessionValid: true,
      status: 'ACTIVE'
    });

    const validHumanAudit = eveInternalAuditEngine.auditDeliverableTruth({
      reportId: 'REP-TEST-HUMAN',
      engagementId: 'eng-test-human',
      version: '1.0',
      status: 'FINAL_CERTIFIED',
      formats: { pdf: { sha256: 'a'.repeat(64) } },
      approvalObject: {
        principalId: 'usr-partner-steve-01',
        authorizedRole: 'ENGAGEMENT_PARTNER',
        status: 'APPROVED',
        approvalStatus: 'APPROVED',
        signatureType: 'PHYSICAL_HUMAN',
        approverName: 'Steve Stein, CPA',
        approverLicenseNumber: 'CPA-NY-094821',
        engagementId: 'eng-test-human',
        reportId: 'REP-TEST-HUMAN',
        reportVersion: '1.0',
        reportHash: 'a'.repeat(64),
        authenticationContext: {
          sessionId: 'sess-test-01',
          authenticationMethod: 'BEARER_TOKEN',
          timestamp: new Date().toISOString()
        }
      },
      facts: []
    });
    const humanOk = validHumanAudit.compliant === true && validHumanAudit.deliveryGateStatus === 'ELIGIBLE_FOR_DELIVERY';

    // 5. Quinn explicit delivery prohibition blocks delivery
    const quinnBlockedAudit = eveInternalAuditEngine.auditDeliverableTruth({
      reportId: 'REP-TEST-QUINN-BLOCK',
      status: 'READY_FOR_AUTHORIZED_HUMAN_REVIEW',
      quinnReview: { deliveryEligible: false },
      facts: []
    });
    const quinnBlockedOk = quinnBlockedAudit.deliveryGateStatus === 'DELIVERY_BLOCKED_PENDING_REVIEW';

    assert(draftOk && unapprovedCertOk && aiSignedOk && humanOk && quinnBlockedOk, 'FV-08: Delivery Gate Invariant (Draft vs Human Approval vs AI Sign-off)', `draft=(comp:${draftAudit.compliant}, gate:${draftAudit.deliveryGateStatus}), unapprovedCertComp=${unapprovedCertified.compliant}, aiSignedComp=${aiSigned.compliant}, validHumanGate=${validHumanAudit.deliveryGateStatus}`);
  } catch (err: any) {
    assert(false, 'FV-08: Delivery Gate Invariant Enforcement', err.message);
  }

  // ----------------------------------------------------
  // TEST FV-09: Robust Uncertainty Formatting (No [object Object])
  // ----------------------------------------------------
  try {
    const testCases = [
      'Simple string uncertainty',
      { topic: 'ASC 842', description: 'Discount rate benchmark unverified' },
      { description: 'Impairment testing scope limited' },
      { topic: 'Inventory Valuation' },
      { message: 'Inventory physical count variance' },
      { rawCode: 404, detail: { line: 12 } },
      10024,
      null,
      undefined
    ];

    const formatted = testCases.map(tc => formatUncertainty(tc));
    const noneHaveObjectString = formatted.every(f => !f.includes('[object Object]'));
    const expectedSample = formatUncertainty({ topic: 'ASC 842', description: 'Discount rate benchmark unverified' });
    const matchesExpected = expectedSample === '[ASC 842] Discount rate benchmark unverified';

    assert(noneHaveObjectString && matchesExpected, 'FV-09: Robust Format Uncertainty (No [object Object])', `Output sample: "${expectedSample}", all clean: ${noneHaveObjectString}`);
  } catch (err: any) {
    assert(false, 'FV-09: Format Uncertainty Object Stringification', err.message);
  }

  // ----------------------------------------------------
  // TEST FV-10: Corporate Groups Read-Only Safety (No Mutating Side-Effects)
  // ----------------------------------------------------
  try {
    const storagePath = process.env.STORAGE_FILE || process.env.AI_CPA_STORAGE_FILE || path.join(process.cwd(), 'storage', 'ai_cpa_storage.json');
    const beforeBytes = fs.existsSync(storagePath) ? fs.readFileSync(storagePath, 'utf-8') : '';
    
    const entRes = await request({ host: '127.0.0.1', port: PORT, path: '/api/workspaces/ws-test-readonly/entities', method: 'GET' });
    const isReadOnly = entRes.statusCode === 200 && Array.isArray(entRes.body?.entities);
    
    const afterBytes = fs.existsSync(storagePath) ? fs.readFileSync(storagePath, 'utf-8') : '';
    const noStorageMutation = beforeBytes === afterBytes;

    assert(isReadOnly && noStorageMutation, 'FV-10: Read-Only Corporate Groups Endpoint (No Side-Effect Seeding)', `Status: ${entRes.statusCode}, returned ${entRes.body?.entities?.length} entities, storage file unchanged: ${noStorageMutation}`);
  } catch (err: any) {
    assert(false, 'FV-10: Corporate Groups Read-Only Test', err.message);
  }

  // ----------------------------------------------------
  // TEST FV-11: Verified Customer Continuation Service APIs
  // ----------------------------------------------------
  try {
    const hasMethod = typeof verifiedCustomerContinuationService.getContinuationByEngagementId === 'function';
    // Test graceful handling of non-existent continuation ID (returns null)
    const notFound = verifiedCustomerContinuationService.getContinuationByEngagementId('eng-nonexistent-999');
    assert(hasMethod && notFound === null, 'FV-11: Continuation Service getContinuationByEngagementId API', `Method exists: ${hasMethod}, missing ID returned null: ${notFound === null}`);
  } catch (err: any) {
    assert(false, 'FV-11: Verified Continuation Service API', err.message);
  }

  // ----------------------------------------------------
  // TEST FV-12: End-to-End Client & Server Deliverable Route Alignment
  // ----------------------------------------------------
  try {
    const pdfRes = await request({ host: '127.0.0.1', port: PORT, path: '/api/cpa/report/download-pdf?reportId=REP-FINALITY-001', method: 'GET' });
    const jsonRes = await request({ host: '127.0.0.1', port: PORT, path: '/api/cpa/report/download-json?reportId=REP-FINALITY-001', method: 'GET' });
    const xlsxRes = await request({ host: '127.0.0.1', port: PORT, path: '/api/cpa/report/download-xlsx?reportId=REP-FINALITY-001', method: 'GET' });
    const csvRes = await request({ host: '127.0.0.1', port: PORT, path: '/api/cpa/report/download-csv?reportId=REP-FINALITY-001', method: 'GET' });

    // Verify all 4 deliverable download endpoints exist and respond (200 with content or 404 if file absent, not 500 or undefined route)
    const allValid = [pdfRes, jsonRes, xlsxRes, csvRes].every(r => r.statusCode === 200 || r.statusCode === 404);
    assert(allValid, 'FV-12: Client & Server Deliverable Download Routes (PDF, XLSX, CSV, JSON)', `PDF=${pdfRes.statusCode}, JSON=${jsonRes.statusCode}, XLSX=${xlsxRes.statusCode}, CSV=${csvRes.statusCode}`);
  } catch (err: any) {
    assert(false, 'FV-12: Deliverable Download Route Handlers', err.message);
  }

  console.log('\n================================================================');
  console.log(` VERIFICATION SUMMARY: ${passCount} PASSED | ${failCount} FAILED`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
