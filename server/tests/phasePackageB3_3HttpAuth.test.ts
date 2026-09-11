/**
 * PACKAGE B3.3: PROFESSIONAL APPROVAL HTTP AUTHENTICATION BOUNDARY TEST SUITE
 * 
 * Verifies:
 * 1. request-body principalId cannot authenticate a user;
 * 2. request-body eventContext.principalId cannot authenticate a user;
 * 3. missing authenticated server principal returns 401;
 * 4. missing session does not create sess-${Date.now()};
 * 5. arbitrary x-session-id does not authenticate;
 * 6. authenticated principal mismatch with body principalId is rejected;
 * 7. expired server session is rejected;
 * 8. async authority provider is awaited;
 * 9. authority provider failure fails closed;
 * 10. valid authenticated server principal can reach approval evaluation.
 */

import { professionalSignoffGuard, RealAuthorityProvider, TrustedPrincipal } from '../cpaOrganization/professionalSignoffGuard.js';
import { deliverableArtifactService } from '../cpaOrganization/deliverableArtifactService.js';
import { createCPAOrganizationRouter } from '../cpaOrganization/cpaOrganizationRoutes.js';
import express, { Request, Response } from 'express';

// Helper to simulate Express HTTP requests directly against router handlers
function createMockReqRes(options: {
  body?: any;
  headers?: Record<string, string>;
  user?: any;
  ip?: string;
}) {
  const req: any = {
    body: options.body || {},
    headers: options.headers || {},
    user: options.user,
    ip: options.ip || '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' }
  };

  let statusCode = 200;
  let jsonResponse: any = null;

  const res: any = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      jsonResponse = data;
      return res;
    },
    get statusCode() {
      return statusCode;
    },
    get jsonResponse() {
      return jsonResponse;
    }
  };

  return { req, res };
}

export async function runPhasePackageB3_3HttpAuthTests() {
  console.log('\n====================================================');
  console.log('  RUNNING PACKAGE B3.3 HTTP AUTHENTICATION SUITE');
  console.log('====================================================');

  const origNodeEnv = process.env.NODE_ENV;
  const origTestMode = process.env.TEST_MODE;
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'true';

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

  // Set up mock report deliverable artifact for signoff tests
  await deliverableArtifactService.compileAndRegisterDeliverable({
    engagementId: 'eng-b33-01',
    reportId: 'rep-b33-01',
    version: '1.0',
    companyName: 'B3.3 Test Client Corp',
    facts: [{ canonicalMetric: 'Revenue', value: 1000000, id: 'f-b33-01' }]
  });

  const validTestPrincipal: TrustedPrincipal = {
    principalId: 'usr-b33-valid-cpa',
    displayName: 'Aria Montgomery, CPA',
    email: 'aria@assurance.com',
    isHuman: true,
    role: 'ENGAGEMENT_PARTNER',
    licenseDetails: {
      licenseNumber: 'CPA-NY-102938',
      jurisdiction: 'NY',
      status: 'ACTIVE',
      verificationSource: 'STATE_BOARD_OF_ACCOUNTANCY',
      verifiedAt: '2026-01-01T00:00:00Z'
    },
    authorizedEngagements: ['eng-b33-01'],
    sessionValid: true,
    status: 'ACTIVE'
  };

  professionalSignoffGuard.registerTrustedPrincipal(validTestPrincipal);

  // Extract router signoff handler
  const router = createCPAOrganizationRouter();
  const signoffRouteLayer = (router as any).stack.find((layer: any) => layer.route?.path === '/report/signoff');
  const signoffHandler = signoffRouteLayer?.route?.stack[0]?.handle;

  if (!signoffHandler) {
    throw new Error('Could not find /report/signoff handler in CPA organization router stack!');
  }

  // ----------------------------------------------------
  // TEST 1: Request-body principalId cannot authenticate user
  // ----------------------------------------------------
  const { req: req1, res: res1 } = createMockReqRes({
    body: {
      engagementId: 'eng-b33-01',
      reportId: 'rep-b33-01',
      principalId: 'usr-b33-valid-cpa',
      expectedReportHash: 'hash-b33-01'
    }
  });

  await signoffHandler(req1, res1);
  assert(
    'B3.3-REQ-01: Request-body principalId cannot authenticate',
    res1.statusCode === 401 && res1.jsonResponse?.success === false && res1.jsonResponse?.error?.includes('UNAUTHENTICATED'),
    `Body principalId was accepted without server authentication! Status: ${res1.statusCode}, Body: ${JSON.stringify(res1.jsonResponse)}`,
    'Request-body principalId alone correctly rejected with 401 UNAUTHENTICATED.'
  );

  // ----------------------------------------------------
  // TEST 2: Request-body eventContext.principalId cannot authenticate user
  // ----------------------------------------------------
  const { req: req2, res: res2 } = createMockReqRes({
    body: {
      engagementId: 'eng-b33-01',
      reportId: 'rep-b33-01',
      eventContext: { principalId: 'usr-b33-valid-cpa' }
    }
  });

  await signoffHandler(req2, res2);
  assert(
    'B3.3-REQ-02: Request-body eventContext.principalId cannot authenticate',
    res2.statusCode === 401 && res2.jsonResponse?.success === false && res2.jsonResponse?.error?.includes('UNAUTHENTICATED'),
    `eventContext.principalId was accepted without server auth! Status: ${res2.statusCode}`,
    'Request-body eventContext.principalId correctly rejected with 401 UNAUTHENTICATED.'
  );

  // ----------------------------------------------------
  // TEST 3: Missing authenticated server principal returns 401
  // ----------------------------------------------------
  const { req: req3, res: res3 } = createMockReqRes({
    body: {
      engagementId: 'eng-b33-01',
      reportId: 'rep-b33-01'
    }
  });

  await signoffHandler(req3, res3);
  assert(
    'B3.3-REQ-03: Missing authenticated server principal returns 401',
    res3.statusCode === 401 && res3.jsonResponse?.success === false,
    `Missing authenticated server principal returned status ${res3.statusCode} instead of 401`,
    'Missing server-authenticated principal correctly returned 401.'
  );

  // ----------------------------------------------------
  // TEST 4: Missing session does not create synthetic sess-${Date.now()}
  // ----------------------------------------------------
  const { req: req4, res: res4 } = createMockReqRes({
    body: {
      engagementId: 'eng-b33-01',
      reportId: 'rep-b33-01',
      action: 'APPROVE'
    }
  });

  await signoffHandler(req4, res4);
  assert(
    'B3.3-REQ-04: Missing session does not create synthetic sess-${Date.now()}',
    res4.statusCode === 401 && res4.jsonResponse?.approval === undefined,
    `Synthetic session fallback was created! Response: ${JSON.stringify(res4.jsonResponse)}`,
    'No synthetic session created; unauthenticated request rejected with 401.'
  );

  // ----------------------------------------------------
  // TEST 5: Arbitrary x-session-id header does not authenticate
  // ----------------------------------------------------
  const { req: req5, res: res5 } = createMockReqRes({
    headers: {
      'x-session-id': 'sess-arbitrary-unregistered-header-xyz'
    },
    body: {
      engagementId: 'eng-b33-01',
      reportId: 'rep-b33-01'
    }
  });

  await signoffHandler(req5, res5);
  assert(
    'B3.3-REQ-05: Arbitrary x-session-id header does not authenticate',
    res5.statusCode === 401 && res5.jsonResponse?.success === false,
    `Arbitrary x-session-id granted auth! Status: ${res5.statusCode}`,
    'Arbitrary x-session-id header correctly rejected with 401 UNAUTHENTICATED.'
  );

  // ----------------------------------------------------
  // TEST 6: Authenticated principal mismatch with body principalId is rejected
  // ----------------------------------------------------
  const { req: req6, res: res6 } = createMockReqRes({
    user: {
      principalId: 'usr-b33-valid-cpa',
      sessionId: 'sess-b33-valid-99'
    },
    body: {
      engagementId: 'eng-b33-01',
      reportId: 'rep-b33-01',
      principalId: 'usr-malicious-spoof-attacker',
      expectedReportHash: 'hash-b33-01'
    }
  });

  await signoffHandler(req6, res6);
  assert(
    'B3.3-REQ-06: Authenticated principal mismatch with body principalId rejected',
    res6.statusCode === 403 && res6.jsonResponse?.error?.includes('PRINCIPAL_MISMATCH'),
    `Principal mismatch was not rejected with 403! Status: ${res6.statusCode}, Error: ${res6.jsonResponse?.error}`,
    'Principal mismatch between server user and body principalId rejected with 403 PRINCIPAL_MISMATCH.'
  );

  // ----------------------------------------------------
  // TEST 7: Expired server session is rejected
  // ----------------------------------------------------
  const expiredTestPrincipal: TrustedPrincipal = {
    principalId: 'usr-b33-expired-cpa',
    displayName: 'Expired CPA, CPA',
    isHuman: true,
    role: 'ENGAGEMENT_PARTNER',
    licenseDetails: {
      licenseNumber: 'CPA-NY-999999',
      jurisdiction: 'NY',
      status: 'ACTIVE'
    },
    authorizedEngagements: ['eng-b33-01'],
    sessionValid: false, // Expired session
    status: 'ACTIVE'
  };
  professionalSignoffGuard.registerTrustedPrincipal(expiredTestPrincipal);

  const { req: req7, res: res7 } = createMockReqRes({
    headers: {
      authorization: 'Bearer usr-b33-expired-cpa'
    },
    body: {
      engagementId: 'eng-b33-01',
      reportId: 'rep-b33-01'
    }
  });

  await signoffHandler(req7, res7);
  assert(
    'B3.3-REQ-07: Expired server session is rejected',
    res7.statusCode === 401 && res7.jsonResponse?.error?.includes('EXPIRED_SESSION_REJECTED'),
    `Expired server session was accepted! Status: ${res7.statusCode}, Error: ${res7.jsonResponse?.error}`,
    'Expired server session correctly rejected with 401 EXPIRED_SESSION_REJECTED.'
  );

  // ----------------------------------------------------
  // TEST 8: Async authority provider is awaited
  // ----------------------------------------------------
  const asyncProvider: RealAuthorityProvider = {
    name: 'AsyncTestAuthorityProvider',
    async resolvePrincipalAuthority(params) {
      await new Promise(resolve => setTimeout(resolve, 15));
      if (params.sessionId === 'sess-async-valid-01' || params.principalId === 'usr-b33-async-cpa') {
        return {
          principalId: 'usr-b33-async-cpa',
          displayName: 'Async Partner, CPA',
          isHuman: true,
          role: 'ENGAGEMENT_PARTNER',
          licenseDetails: {
            licenseNumber: 'CPA-TX-445566',
            jurisdiction: 'TX',
            status: 'ACTIVE',
            verificationSource: 'TEXAS_BOARD'
          },
          authorizedEngagements: ['eng-b33-01'],
          sessionValid: true,
          status: 'ACTIVE'
        };
      }
      return null;
    },
    async verifySession(sessionId, principalId) {
      await new Promise(resolve => setTimeout(resolve, 10));
      return sessionId === 'sess-async-valid-01' && principalId === 'usr-b33-async-cpa';
    },
    async verifyLicenseStatus(licenseNumber, jurisdiction) {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'ACTIVE';
    }
  };

  professionalSignoffGuard.setAuthorityProvider(asyncProvider);

  const artifact = deliverableArtifactService.getArtifactByReportId('rep-b33-01');
  const validHash = artifact?.formats?.pdf?.sha256 || artifact?.canonicalFactHash || '';

  const { req: req8, res: res8 } = createMockReqRes({
    headers: {
      authorization: 'Bearer sess-async-valid-01'
    },
    body: {
      engagementId: 'eng-b33-01',
      reportId: 'rep-b33-01',
      expectedReportHash: validHash,
      action: 'APPROVE'
    }
  });

  await signoffHandler(req8, res8);
  assert(
    'B3.3-REQ-08: Async authority provider is awaited',
    res8.statusCode === 200 && res8.jsonResponse?.success === true && res8.jsonResponse?.approval?.principalId === 'usr-b33-async-cpa',
    `Async authority provider failed or was not awaited! Status: ${res8.statusCode}, Body: ${JSON.stringify(res8.jsonResponse)}`,
    'Async authority provider methods successfully awaited and signoff granted.'
  );

  // ----------------------------------------------------
  // TEST 9: Authority provider failure fails closed
  // ----------------------------------------------------
  const failingProvider: RealAuthorityProvider = {
    name: 'FailingAuthorityProvider',
    async resolvePrincipalAuthority() {
      await new Promise(resolve => setTimeout(resolve, 10));
      throw new Error('Database Connection Disconnected');
    }
  };

  professionalSignoffGuard.setAuthorityProvider(failingProvider);

  const { req: req9, res: res9 } = createMockReqRes({
    headers: {
      authorization: 'Bearer sess-failing-provider-token'
    },
    body: {
      engagementId: 'eng-b33-01',
      reportId: 'rep-b33-01'
    }
  });

  await signoffHandler(req9, res9);
  assert(
    'B3.3-REQ-09: Authority provider failure fails closed',
    (res9.statusCode === 503 || res9.statusCode === 500) && res9.jsonResponse?.success === false && res9.jsonResponse?.error?.includes('AUTHORITY_PROVIDER_UNAVAILABLE'),
    `Authority provider failure did not fail closed cleanly! Status: ${res9.statusCode}, Body: ${JSON.stringify(res9.jsonResponse)}`,
    'Authority provider failure correctly failed closed with 503 AUTHORITY_PROVIDER_UNAVAILABLE.'
  );

  // Clean up failing provider
  professionalSignoffGuard.setAuthorityProvider(null);

  // ----------------------------------------------------
  // TEST 10: Valid authenticated server principal can reach approval evaluation
  // ----------------------------------------------------
  const { req: req10, res: res10 } = createMockReqRes({
    user: {
      principalId: 'usr-b33-valid-cpa',
      sessionId: 'sess-b33-valid-session-100'
    },
    body: {
      engagementId: 'eng-b33-01',
      reportId: 'rep-b33-01',
      expectedReportHash: validHash,
      approvalScope: 'STATUTORY_DELIVERABLE_RELEASE',
      action: 'APPROVE',
      notes: 'Verified statutory compliance.'
    }
  });

  await signoffHandler(req10, res10);
  assert(
    'B3.3-REQ-10: Valid authenticated server principal reaches approval evaluation',
    res10.statusCode === 200 && res10.jsonResponse?.success === true && res10.jsonResponse?.approval?.principalId === 'usr-b33-valid-cpa',
    `Valid authenticated server principal failed signoff evaluation! Status: ${res10.statusCode}, Body: ${JSON.stringify(res10.jsonResponse)}`,
    'Valid server-authenticated principal successfully evaluated and professional sign-off registered.'
  );

  console.log('----------------------------------------------------');
  console.log(`  PACKAGE B3.3 RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    throw new Error(`Package B3.3 HTTP Authentication Suite failed: ${failed} tests failed.`);
  }

  return { passed, failed, total: passed + failed };
}

if (process.argv[1]?.includes('phasePackageB3_3HttpAuth.test')) {
  runPhasePackageB3_3HttpAuthTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
