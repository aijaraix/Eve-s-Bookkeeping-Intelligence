/**
 * PACKAGE B3.1: PHYSICAL HUMAN APPROVAL AUTHENTICITY & FAIL-CLOSED DURABILITY TEST SUITE
 * 
 * Verifies:
 * - Unauthenticated / untrusted / non-human approval payloads fail closed.
 * - License status unverified/expired blocks approval registration.
 * - Atomic write failure aborts in-memory indexing.
 * - Modified report hash or superseded report version invalidates sign-off.
 * - Rehydrated approvals without matching trusted authority proof are rejected.
 */

import fs from 'fs';
import path from 'path';
import { professionalSignoffGuard, ProfessionalApprovalObject, HumanApprovalEvent } from '../cpaOrganization/professionalSignoffGuard.js';
import { deliverableArtifactService } from '../cpaOrganization/deliverableArtifactService.js';

export async function runPhasePackageB3_1HumanApprovalTests() {
  console.log('\n====================================================');
  console.log('  RUNNING PACKAGE B3.1 PHYSICAL HUMAN APPROVAL SUITE');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;
  const results: { name: string; success: boolean; message: string }[] = [];

  function assert(name: string, condition: boolean, failMessage: string, successMessage: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${name} — ${successMessage}`);
      results.push({ name, success: true, message: successMessage });
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name} — ${failMessage}`);
      results.push({ name, success: false, message: failMessage });
      failed++;
    }
  }

  // Ensure trusted principal exists for valid test cases
  professionalSignoffGuard.registerTrustedPrincipal({
    principalId: 'usr-partner-test-01',
    displayName: 'Sarah Connor, CPA',
    email: 'sconnor@cpa-audit.com',
    isHuman: true,
    role: 'ENGAGEMENT_PARTNER',
    licenseDetails: {
      licenseNumber: 'CPA-CA-998877',
      jurisdiction: 'CA',
      status: 'ACTIVE',
      verificationSource: 'STATE_BOARD_OF_ACCOUNTANCY',
      verifiedAt: '2026-01-01T00:00:00Z'
    },
    authorizedEngagements: ['eng-b31-test-01'],
    sessionValid: true,
    status: 'ACTIVE'
  });

  // Test 1: Unauthenticated / missing principal payload fails closed
  const missingPrincipalCheck = professionalSignoffGuard.isValidApprovalObject({
    authorizedIdentity: 'Sarah Connor, CPA',
    authorizedRole: 'ENGAGEMENT_PARTNER',
    reportId: 'REP-B31-001',
    approvalStatus: 'APPROVED'
  });
  assert(
    'B3.1-REQ-01: Shaped Approval Object Without Principal Fails Closed',
    missingPrincipalCheck.valid === false && missingPrincipalCheck.reason?.includes('authenticated principal'),
    `Shaped object without principal was wrongly accepted! Reason: ${missingPrincipalCheck.reason}`,
    'Shaped approval object without authenticated principal context successfully rejected.'
  );

  // Test 2: AI / Non-Human Agent Payload strictly rejected
  professionalSignoffGuard.registerTrustedPrincipal({
    principalId: 'usr-ai-quinn-01',
    displayName: 'QUINN AI Partner',
    isHuman: false,
    role: 'CONCURRING_PARTNER',
    sessionValid: true,
    status: 'ACTIVE'
  });

  const aiAgentEvent: HumanApprovalEvent = {
    eventId: 'evt-ai-01',
    principalId: 'usr-ai-quinn-01',
    engagementId: 'eng-b31-test-01',
    reportId: 'REP-B31-001',
    reportVersion: '1.0',
    expectedReportHash: 'hash-1234',
    approvalScope: 'DELIVERABLE_RELEASE',
    eventContext: {
      sessionId: 'sess-ai-01',
      authenticationMethod: 'AI_AUTONOMOUS',
      timestamp: new Date().toISOString()
    },
    approvalMethod: 'INTERACTIVE_PORTAL',
    action: 'APPROVE'
  };

  const aiResult = professionalSignoffGuard.processHumanApprovalEvent(aiAgentEvent);
  assert(
    'B3.1-REQ-02: Non-Human / AI Agent Payload Rejected',
    aiResult.success === false && aiResult.error?.includes('not human'),
    `AI agent was permitted to sign off! Error: ${aiResult.error}`,
    'Non-human AI agent approval attempt strictly rejected with fail-closed error.'
  );

  // Test 3: Unverified / Expired License Blocks Approval
  professionalSignoffGuard.registerTrustedPrincipal({
    principalId: 'usr-expired-cpa-01',
    displayName: 'Expired Partner, CPA',
    isHuman: true,
    role: 'ENGAGEMENT_PARTNER',
    licenseDetails: {
      licenseNumber: 'CPA-CA-111111',
      jurisdiction: 'CA',
      status: 'EXPIRED',
      verificationSource: 'STATE_BOARD_OF_ACCOUNTANCY'
    },
    authorizedEngagements: ['eng-b31-test-01'],
    sessionValid: true,
    status: 'ACTIVE'
  });

  const expiredLicenseEvent: HumanApprovalEvent = {
    eventId: 'evt-exp-01',
    principalId: 'usr-expired-cpa-01',
    engagementId: 'eng-b31-test-01',
    reportId: 'REP-B31-001',
    reportVersion: '1.0',
    expectedReportHash: 'hash-1234',
    approvalScope: 'DELIVERABLE_RELEASE',
    eventContext: {
      sessionId: 'sess-human-01',
      authenticationMethod: 'BEARER_TOKEN',
      timestamp: new Date().toISOString()
    },
    approvalMethod: 'INTERACTIVE_PORTAL',
    action: 'APPROVE'
  };

  const expiredResult = professionalSignoffGuard.processHumanApprovalEvent(expiredLicenseEvent);
  assert(
    'B3.1-REQ-03: Inactive/Expired License Blocks Approval Registration',
    expiredResult.success === false && expiredResult.error?.includes('LICENSE_UNVERIFIED'),
    `Expired license partner was permitted to sign off! Error: ${expiredResult.error}`,
    'Practitioner with expired/unverified license status strictly blocked from registering approval.'
  );

  // Test 4: Role Mismatch Between Caller and Trusted Authority Store Fails Closed
  const callerRoleMismatchCheck = professionalSignoffGuard.isValidApprovalObject({
    principalId: 'usr-partner-test-01',
    authorizedRole: 'CONCURRING_PARTNER', // Trusted role is ENGAGEMENT_PARTNER
    reportId: 'REP-B31-001',
    reportVersion: '1.0',
    reportHash: 'hash-1234',
    approvalStatus: 'APPROVED',
    authenticationContext: {
      sessionId: 'sess-01',
      authenticationMethod: 'BEARER_TOKEN',
      timestamp: new Date().toISOString()
    }
  });
  assert(
    'B3.1-REQ-04: Caller-Supplied Role Mismatching Trusted Store Fails Closed',
    callerRoleMismatchCheck.valid === false && callerRoleMismatchCheck.reason?.includes('does not match trusted practitioner role'),
    `Role spoofing attempt was accepted! Reason: ${callerRoleMismatchCheck.reason}`,
    'Caller-supplied role string mismatching trusted practitioner authority store rejected.'
  );

  // Test 5: Atomic Write Failure Aborts In-Memory Indexing
  const origDir = professionalSignoffGuard.getApprovalsDir();
  const dummyFilePath = path.join(process.cwd(), 'storage', 'cpa_memory', 'dummy_file_barrier.txt');
  if (!fs.existsSync(path.dirname(dummyFilePath))) {
    fs.mkdirSync(path.dirname(dummyFilePath), { recursive: true });
  }
  fs.writeFileSync(dummyFilePath, 'barrier', 'utf-8');

  // Directory path where a parent component is a file -> guaranteed ENOTDIR failure
  const invalidDir = path.join(dummyFilePath, 'cannot_create_subdir');
  professionalSignoffGuard.setApprovalsDir(invalidDir);

  const validApprovalToPersist: ProfessionalApprovalObject = {
    approvalId: 'app-fail-write-01',
    principalId: 'usr-partner-test-01',
    authorizedIdentity: 'Sarah Connor, CPA',
    authorizedRole: 'ENGAGEMENT_PARTNER',
    licenseNumber: 'CPA-CA-998877',
    jurisdiction: 'CA',
    licenseStatus: 'ACTIVE',
    engagementId: 'eng-b31-test-01',
    reportId: 'REP-FAIL-WRITE-01',
    reportVersion: '1.0',
    reportHash: 'hash-fail-write',
    approvalScope: 'STATUTORY_DELIVERABLE_RELEASE',
    timestamp: new Date().toISOString(),
    approvalStatus: 'APPROVED',
    status: 'APPROVED',
    approvalMethod: 'INTERACTIVE_PORTAL',
    sourceAuthority: 'STATE_BOARD_OF_ACCOUNTANCY',
    signatureType: 'PHYSICAL_HUMAN',
    authenticationContext: {
      sessionId: 'sess-valid-01',
      authenticationMethod: 'BEARER_TOKEN',
      timestamp: new Date().toISOString()
    }
  };

  const failWriteResult = professionalSignoffGuard.registerApproval(validApprovalToPersist);
  const unindexedFetch = professionalSignoffGuard.getApprovalForReport('REP-FAIL-WRITE-01');

  // Restore valid directory and clean barrier
  professionalSignoffGuard.setApprovalsDir(origDir);
  try { fs.unlinkSync(dummyFilePath); } catch (_) {}

  assert(
    'B3.1-REQ-05: Persistence Failure Aborts In-Memory Indexing',
    failWriteResult.success === false && unindexedFetch === undefined,
    'Approval was indexed in memory despite persistent disk write failure!',
    'Failed disk write correctly prevented in-memory approval indexing (fail-closed).'
  );

  // Test 6: Report Hash & Version Binding Enforcement
  const testDir = path.join(process.cwd(), 'storage', 'cpa_memory', 'test_b31_rehydrate');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  const validEvent: HumanApprovalEvent = {
    eventId: 'evt-valid-01',
    principalId: 'usr-partner-test-01',
    engagementId: 'eng-b31-test-01',
    reportId: 'REP-BINDING-01',
    reportVersion: '1.0',
    expectedReportHash: 'correct-sha256-hash',
    approvalScope: 'STATUTORY_DELIVERABLE_RELEASE',
    eventContext: {
      sessionId: 'sess-valid-01',
      authenticationMethod: 'BEARER_TOKEN',
      timestamp: new Date().toISOString()
    },
    approvalMethod: 'INTERACTIVE_PORTAL',
    action: 'APPROVE'
  };

  const validApprovalRes = professionalSignoffGuard.processHumanApprovalEvent(validEvent);
  assert(
    'B3.1-REQ-06: Valid Human Approval Event Processes and Binds Hash',
    validApprovalRes.success === true && validApprovalRes.approval !== undefined,
    `Valid human approval event failed: ${validApprovalRes.error}`,
    'Valid human approval event successfully processed with trusted principal authority.'
  );

  // Fetch with wrong hash should fail
  const mismatchedHashFetch = professionalSignoffGuard.getApprovalForReport('REP-BINDING-01', 'wrong-sha256-hash');
  assert(
    'B3.1-REQ-07: Mismatched Report Hash Rejects Active Approval',
    mismatchedHashFetch === undefined,
    'Approval was returned for mismatched report hash!',
    'Approval request with modified/mismatched report hash correctly returned undefined.'
  );

  // Test 7: Invalidation / Revocation on Fact Change
  const revocationCount = professionalSignoffGuard.invalidateApprovalsForReport('REP-BINDING-01', 'DEPENDENT_FACT_INVALIDATED');
  const revokedFetch = professionalSignoffGuard.getApprovalForReport('REP-BINDING-01', 'correct-sha256-hash');
  assert(
    'B3.1-REQ-08: Fact Invalidation Revokes Active Approvals',
    revocationCount > 0 && revokedFetch === undefined,
    'Revoked approval was still returned for report!',
    'Invalidated dependent fact successfully revoked active professional approval.'
  );

  // Test 8: Rehydration Hardening — Synthetic drop file without trusted principal rejected
  professionalSignoffGuard.setApprovalsDir(testDir);

  const droppedFakeFile = path.join(testDir, 'app-fake-dropped.json');
  fs.writeFileSync(droppedFakeFile, JSON.stringify({
    approvalId: 'app-fake-dropped',
    authorizedIdentity: 'Fake Auditor',
    authorizedRole: 'ENGAGEMENT_PARTNER',
    reportId: 'REP-DROPPED-01',
    approvalStatus: 'APPROVED',
    status: 'APPROVED'
  }), 'utf-8');

  const rehydratedCount = professionalSignoffGuard.rehydrateApprovals();

  // Cleanup test directory
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (_) {}
  professionalSignoffGuard.setApprovalsDir(origDir);

  assert(
    'B3.1-REQ-09: Rehydration Rejects Unverified Drop Files Without Trusted Authority',
    rehydratedCount === 0,
    `Dropped synthetic file without trusted authority was rehydrated! (count=${rehydratedCount})`,
    'Rehydration hardening successfully skipped dropped file lacking trusted authority proof.'
  );

  console.log('\n----------------------------------------------------');
  console.log(`  PACKAGE B3.1 RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('----------------------------------------------------\n');

  return {
    passed,
    failed,
    total: passed + failed,
    results
  };
}
