/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — PACKAGE B3.2 TEST SUITE
 * Real Authority Provider Integration, Trust Backdoor Prevention & Fail-Closed Durability
 */

import fs from 'fs';
import path from 'path';
import {
  professionalSignoffGuard,
  TEST_TRUSTED_PRINCIPAL_ADAPTER,
  RealAuthorityProvider,
  TrustedPrincipal,
  HumanApprovalEvent
} from '../cpaOrganization/professionalSignoffGuard.js';

export async function runPhasePackageB3_2AuthorityIntegrationTests(): Promise<{
  passed: number;
  failed: number;
  total: number;
  results: Array<{ name: string; success: boolean; message: string }>;
}> {
  const results: Array<{ name: string; success: boolean; message: string }> = [];
  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, failMsg: string, passMsg: string) {
    if (condition) {
      passed++;
      results.push({ name, success: true, message: passMsg });
    } else {
      failed++;
      results.push({ name, success: false, message: failMsg });
    }
  }

  const originalNodeEnv = process.env.NODE_ENV;

  try {
    // ----------------------------------------------------
    // TEST 1 & 2: Production trusted-principal store starts empty & Jane Doe does not exist
    // ----------------------------------------------------
    TEST_TRUSTED_PRINCIPAL_ADAPTER.clearTestPrincipals();
    professionalSignoffGuard.setAuthorityProvider(null);

    const janeDoeLookUp = professionalSignoffGuard.getTrustedPrincipal('usr-jane-doe-cpa-01');
    assert(
      'B3.2-REQ-01/02: Production Store Starts Empty & Jane Doe Removed',
      janeDoeLookUp === undefined,
      'Hardcoded Jane Doe principal was found in default authority store!',
      'Jane Doe hardcoded principal correctly removed; production store starts empty.'
    );

    // ----------------------------------------------------
    // TEST 3: Production cannot call registerTrustedPrincipal to manufacture CPA authority
    // ----------------------------------------------------
    process.env.NODE_ENV = 'production';
    delete process.env.TEST_MODE;

    let registrationBlocked = false;
    try {
      professionalSignoffGuard.registerTrustedPrincipal({
        principalId: 'usr-fake-prod-cpa',
        displayName: 'Manufactured CPA',
        isHuman: true,
        role: 'LICENSED_CPA',
        sessionValid: true,
        status: 'ACTIVE'
      });
    } catch (err: any) {
      if (err.message.includes('PUBLIC_TRUST_REGISTRATION_BLOCKED')) {
        registrationBlocked = true;
      }
    }

    assert(
      'B3.2-REQ-03: Public Trust Registration Blocked in Production',
      registrationBlocked === true,
      'registerTrustedPrincipal allowed manual registration in production environment!',
      'Public trust registration correctly blocked with PUBLIC_TRUST_REGISTRATION_BLOCKED error.'
    );

    // ----------------------------------------------------
    // TEST 4: Test-only principal injection works in test mode
    // ----------------------------------------------------
    process.env.NODE_ENV = 'test';
    const testPrincipal: TrustedPrincipal = {
      principalId: 'usr-test-valid-cpa-01',
      displayName: 'Alice Test, CPA',
      email: 'atest@cpa-firm.com',
      isHuman: true,
      role: 'ENGAGEMENT_PARTNER',
      licenseDetails: {
        licenseNumber: 'CPA-NY-998877',
        jurisdiction: 'NY',
        status: 'ACTIVE',
        verificationSource: 'STATE_BOARD_OF_ACCOUNTANCY',
        verifiedAt: new Date().toISOString()
      },
      authorizedEngagements: ['eng-b32-01'],
      sessionValid: true,
      status: 'ACTIVE'
    };

    TEST_TRUSTED_PRINCIPAL_ADAPTER.registerTestPrincipal(testPrincipal);
    const retrievedTestPrincipal = professionalSignoffGuard.getTrustedPrincipal('usr-test-valid-cpa-01');

    assert(
      'B3.2-REQ-04: Test Principal Injection Allowed in Test Environment',
      retrievedTestPrincipal !== undefined && retrievedTestPrincipal.principalId === 'usr-test-valid-cpa-01',
      'Test adapter failed to inject test principal in test environment!',
      'Test adapter successfully registered mock principal in test mode.'
    );

    // ----------------------------------------------------
    // TEST 5: Request-body principalId cannot override server authenticated principal
    // ----------------------------------------------------
    const spoofEvent: HumanApprovalEvent = {
      eventId: 'evt-spoof-01',
      principalId: 'usr-spoofed-attacker-01',
      authenticatedPrincipalId: 'usr-test-valid-cpa-01',
      engagementId: 'eng-b32-01',
      reportId: 'rep-b32-01',
      reportVersion: '1.0',
      expectedReportHash: 'hash-b32-01',
      approvalScope: 'STATUTORY_DELIVERABLE_RELEASE',
      approvalMethod: 'INTERACTIVE_PORTAL',
      action: 'APPROVE',
      eventContext: {
        sessionId: 'sess-b32-valid-01',
        authenticationMethod: 'BEARER_TOKEN',
        timestamp: new Date().toISOString()
      }
    };

    const spoofResult = professionalSignoffGuard.processHumanApprovalEvent(spoofEvent);
    assert(
      'B3.2-REQ-05: Server-Resolved Principal Enforced Over Body principalId',
      spoofResult.success === false && spoofResult.error?.includes('PRINCIPAL_MISMATCH') === true,
      `Body principal spoofing was not blocked as expected! Result: ${JSON.stringify(spoofResult)}`,
      'Request-body principalId mismatch rejected with PRINCIPAL_MISMATCH error.'
    );

    // ----------------------------------------------------
    // TEST 6: Expired or invalid session rejects approval
    // ----------------------------------------------------
    const expiredEvent: HumanApprovalEvent = {
      eventId: 'evt-expired-01',
      authenticatedPrincipalId: 'usr-test-valid-cpa-01',
      engagementId: 'eng-b32-01',
      reportId: 'rep-b32-02',
      reportVersion: '1.0',
      expectedReportHash: 'hash-b32-02',
      approvalScope: 'STATUTORY_DELIVERABLE_RELEASE',
      approvalMethod: 'INTERACTIVE_PORTAL',
      action: 'APPROVE',
      eventContext: {
        sessionId: 'sess-expired-99',
        authenticationMethod: 'BEARER_TOKEN',
        timestamp: new Date().toISOString(),
        isExpired: true
      }
    };

    const expiredResult = professionalSignoffGuard.processHumanApprovalEvent(expiredEvent);
    assert(
      'B3.2-REQ-06: Expired Session Rejects Professional Approval',
      expiredResult.success === false && expiredResult.error?.includes('EXPIRED_SESSION_REJECTED') === true,
      `Expired session approval was accepted! Result: ${JSON.stringify(expiredResult)}`,
      'Expired session approval correctly rejected with EXPIRED_SESSION_REJECTED.'
    );

    // ----------------------------------------------------
    // TEST 7: Unverified license fails closed
    // ----------------------------------------------------
    const unverifiedLicensePrincipal: TrustedPrincipal = {
      principalId: 'usr-unverified-license-cpa',
      displayName: 'Bob Unverified, CPA',
      isHuman: true,
      role: 'ENGAGEMENT_PARTNER',
      licenseDetails: {
        licenseNumber: 'CPA-NY-000000',
        jurisdiction: 'NY',
        status: 'UNVERIFIED'
      },
      authorizedEngagements: ['eng-b32-01'],
      sessionValid: true,
      status: 'ACTIVE'
    };
    TEST_TRUSTED_PRINCIPAL_ADAPTER.registerTestPrincipal(unverifiedLicensePrincipal);

    const unverifiedEvent: HumanApprovalEvent = {
      eventId: 'evt-unverified-01',
      authenticatedPrincipalId: 'usr-unverified-license-cpa',
      engagementId: 'eng-b32-01',
      reportId: 'rep-b32-03',
      reportVersion: '1.0',
      expectedReportHash: 'hash-b32-03',
      approvalScope: 'STATUTORY_DELIVERABLE_RELEASE',
      approvalMethod: 'INTERACTIVE_PORTAL',
      action: 'APPROVE',
      eventContext: {
        sessionId: 'sess-valid-bob-01',
        authenticationMethod: 'BEARER_TOKEN',
        timestamp: new Date().toISOString()
      }
    };

    const unverifiedResult = professionalSignoffGuard.processHumanApprovalEvent(unverifiedEvent);
    assert(
      'B3.2-REQ-07: Unverified License Status Fails Closed',
      unverifiedResult.success === false && (unverifiedResult.error?.includes('LICENSE_AUTHORITY_NOT_VERIFIED') || unverifiedResult.error?.includes('LICENSE_UNVERIFIED')),
      `Unverified license allowed professional sign-off! Result: ${JSON.stringify(unverifiedResult)}`,
      'Unverified license status correctly rejected with LICENSE_AUTHORITY_NOT_VERIFIED.'
    );

    // ----------------------------------------------------
    // TEST 8: Wildcard engagement membership is prohibited in production
    // ----------------------------------------------------
    process.env.NODE_ENV = 'production';
    delete process.env.TEST_MODE;

    const wildcardPrincipal: TrustedPrincipal = {
      principalId: 'usr-wildcard-cpa-01',
      displayName: 'Charlie Wildcard, CPA',
      isHuman: true,
      role: 'ENGAGEMENT_PARTNER',
      licenseDetails: {
        licenseNumber: 'CPA-NY-112233',
        jurisdiction: 'NY',
        status: 'ACTIVE',
        verificationSource: 'STATE_BOARD_OF_ACCOUNTANCY'
      },
      authorizedEngagements: ['*'], // Wildcard only
      sessionValid: true,
      status: 'ACTIVE'
    };

    // Provider that returns wildcard principal
    const mockProvider: RealAuthorityProvider = {
      name: 'MOCK_FIRM_AUTHORITY_PROVIDER',
      resolvePrincipalAuthority: () => wildcardPrincipal
    };
    professionalSignoffGuard.setAuthorityProvider(mockProvider);

    const wildcardApprovalCheck = professionalSignoffGuard.isValidApprovalObject({
      approvalId: 'app-wildcard-01',
      principalId: 'usr-wildcard-cpa-01',
      authorizedIdentity: 'Charlie Wildcard, CPA',
      authorizedRole: 'ENGAGEMENT_PARTNER',
      engagementId: 'eng-specific-production-01',
      reportId: 'rep-wildcard-01',
      reportVersion: '1.0',
      reportHash: 'hash-wildcard-01',
      approvalScope: 'STATUTORY_DELIVERABLE_RELEASE',
      timestamp: new Date().toISOString(),
      approvalStatus: 'APPROVED',
      approvalMethod: 'INTERACTIVE_PORTAL',
      sourceAuthority: 'STATE_BOARD_OF_ACCOUNTANCY',
      signatureType: 'PHYSICAL_HUMAN',
      authenticationContext: {
        sessionId: 'sess-wildcard-01',
        authenticationMethod: 'BEARER_TOKEN',
        timestamp: new Date().toISOString()
      }
    });

    assert(
      'B3.2-REQ-08: Wildcard Engagement Authority Prohibited for Production Sign-off',
      wildcardApprovalCheck.valid === false && wildcardApprovalCheck.reason?.includes('WILDCARD_ENGAGEMENT_AUTHORITY_REMOVED') === true,
      `Wildcard engagement authority was wrongly allowed in production! Reason: ${wildcardApprovalCheck.reason}`,
      'Wildcard engagement authority in production rejected with WILDCARD_ENGAGEMENT_AUTHORITY_REMOVED.'
    );

    // ----------------------------------------------------
    // TEST 9: Missing professional authority provider fails closed
    // ----------------------------------------------------
    professionalSignoffGuard.setAuthorityProvider(null);

    const missingProviderCheck = professionalSignoffGuard.isValidApprovalObject({
      approvalId: 'app-missing-prov-01',
      principalId: 'usr-unknown-principal-01',
      authorizedIdentity: 'Unknown User',
      authorizedRole: 'ENGAGEMENT_PARTNER',
      engagementId: 'eng-missing-01',
      reportId: 'rep-missing-01',
      reportVersion: '1.0',
      reportHash: 'hash-missing-01',
      approvalScope: 'STATUTORY_DELIVERABLE_RELEASE',
      timestamp: new Date().toISOString(),
      approvalStatus: 'APPROVED',
      approvalMethod: 'INTERACTIVE_PORTAL',
      sourceAuthority: 'STATE_BOARD_OF_ACCOUNTANCY',
      signatureType: 'PHYSICAL_HUMAN',
      authenticationContext: {
        sessionId: 'sess-missing-01',
        authenticationMethod: 'BEARER_TOKEN',
        timestamp: new Date().toISOString()
      }
    });

    assert(
      'B3.2-REQ-09: Missing Professional Authority Provider Fails Closed',
      missingProviderCheck.valid === false && missingProviderCheck.reason?.includes('PROFESSIONAL_AUTHORITY_NOT_CONFIGURED') === true,
      `Missing authority provider did not fail closed! Reason: ${missingProviderCheck.reason}`,
      'Missing professional authority provider correctly failed closed with PROFESSIONAL_AUTHORITY_NOT_CONFIGURED.'
    );

    // ----------------------------------------------------
    // TEST 10: Previously persisted approval becomes ineligible if current authority is no longer valid
    // ----------------------------------------------------
    process.env.NODE_ENV = 'test';
    TEST_TRUSTED_PRINCIPAL_ADAPTER.clearTestPrincipals();

    // 1. Register test principal & create valid approval
    const validRevocablePrincipal: TrustedPrincipal = {
      principalId: 'usr-revocable-cpa-01',
      displayName: 'Diana Revocable, CPA',
      isHuman: true,
      role: 'ENGAGEMENT_PARTNER',
      licenseDetails: {
        licenseNumber: 'CPA-NY-776655',
        jurisdiction: 'NY',
        status: 'ACTIVE',
        verificationSource: 'STATE_BOARD_OF_ACCOUNTANCY'
      },
      authorizedEngagements: ['eng-revocation-01'],
      sessionValid: true,
      status: 'ACTIVE'
    };
    TEST_TRUSTED_PRINCIPAL_ADAPTER.registerTestPrincipal(validRevocablePrincipal);

    const testDir = path.join(process.cwd(), 'storage', 'cpa_memory', 'approvals_test_b32');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    professionalSignoffGuard.setApprovalsDir(testDir);

    const validEvent: HumanApprovalEvent = {
      eventId: 'evt-rev-01',
      authenticatedPrincipalId: 'usr-revocable-cpa-01',
      engagementId: 'eng-revocation-01',
      reportId: 'rep-revocation-01',
      reportVersion: '1.0',
      expectedReportHash: 'hash-revocation-01',
      approvalScope: 'STATUTORY_DELIVERABLE_RELEASE',
      approvalMethod: 'INTERACTIVE_PORTAL',
      action: 'APPROVE',
      eventContext: {
        sessionId: 'sess-revocation-01',
        authenticationMethod: 'BEARER_TOKEN',
        timestamp: new Date().toISOString()
      }
    };

    const validResult = professionalSignoffGuard.processHumanApprovalEvent(validEvent);
    assert(
      'B3.2-REQ-10A: Initial Approval Persisted Successfully',
      validResult.success === true && validResult.approval !== undefined,
      `Initial approval creation failed: ${validResult.error}`,
      'Initial approval successfully created and persisted to disk.'
    );

    // 2. Revoke authority / clear trusted principal store
    TEST_TRUSTED_PRINCIPAL_ADAPTER.clearTestPrincipals();

    // 3. Trigger rehydration
    const rehydratedCount = professionalSignoffGuard.rehydrateApprovals();
    const approvalAfterRehydration = professionalSignoffGuard.getApprovalForReport('rep-revocation-01');

    assert(
      'B3.2-REQ-10B: Persisted Approval Becomes Ineligible On Rehydration Without Valid Authority',
      rehydratedCount === 0 && approvalAfterRehydration === undefined,
      'Persisted approval remained eligible after authority was lost/cleared!',
      'Rehydration correctly rejected persisted approval when current authority could not be proven.'
    );

    // Clean up test directory
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch (_) {}

  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }

  return { passed, failed, total: passed + failed, results };
}
