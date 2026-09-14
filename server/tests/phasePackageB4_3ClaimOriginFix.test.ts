/**
 * PHASE PACKAGE B4.3 — FINAL TRUSTED AUTHORITY CLAIM ORIGIN FIX TESTS
 * 
 * Validates strict separation between caller-supplied HTTP inputs (headers/body/query)
 * and trusted server authority (middleware, authority provider, session tokens).
 * 
 * Targeted Test Matrix (Doc 35 & Package B4.3 Requirement 8):
 * 1. Authenticated ordinary user + x-authority-role=CAPABILITY_PROMOTION_AUTHORITY does NOT become promotion authority.
 * 2. Authenticated ordinary user + x-authority-claim=EXAMINER_SEALED_READ cannot access sealed Minerva truth.
 * 3. x-authorized-agent cannot grant agent impersonation authority.
 * 4. x-tenant-id cannot add a tenant into authorizedTenants (must be requested-scope only).
 * 5. Trusted provider role grants appropriate authority.
 * 6. Trusted provider claim EXAMINER_SEALED_READ grants examiner access.
 * 7. Trusted provider claim CAPABILITY_PROMOTION_AUTHORITY grants promotion authority.
 * 8. Missing trusted role/claim remains non-privileged.
 * 9. Test-only injected authority works in test mode only (rejected in production).
 */

process.env.NODE_ENV = "test";
process.env.TEST_MODE = "true";

import express, { Express, Request, Response, NextFunction } from 'express';
import { createCPAOrganizationRouter, resolveServerAuthContext } from '../cpaOrganization/cpaOrganizationRoutes.js';
import { professionalSignoffGuard, RealAuthorityProvider, TrustedPrincipal } from '../cpaOrganization/professionalSignoffGuard.js';
import { academyMinervaLab } from '../cpaOrganization/academyMinervaLab.js';
import { capabilityPromotionAuthority } from '../cpaOrganization/capabilityPromotionAuthority.js';
import { solverExecutionRegistry } from '../cpaOrganization/solverExecutionRegistry.js';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  error?: string;
}

const testResults: TestResult[] = [];

function assert(name: string, condition: boolean, failDetails: string, passDetails: string) {
  if (condition) {
    testResults.push({ name, passed: true, details: passDetails });
    console.log(`  ✓ [PASS] ${name} — ${passDetails}`);
  } else {
    testResults.push({ name, passed: false, details: failDetails, error: failDetails });
    console.error(`  ✗ [FAIL] ${name} — ${failDetails}`);
  }
}

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/api/cpa', createCPAOrganizationRouter());
  return app;
}

async function simulateRequest(
  app: Express,
  options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    headers?: Record<string, string>;
    body?: any;
    user?: any;
  }
): Promise<{ status: number; body: any; headers: Record<string, any> }> {
  return new Promise((resolve) => {
    const reqHeaders = {
      'x-environment-target': 'TEST',
      ...(options.headers || {})
    };
    const req: any = {
      method: options.method,
      url: options.path,
      path: options.path,
      baseUrl: '',
      headers: reqHeaders,
      body: options.body || {},
      query: {},
      params: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      user: options.user
    };

    const resHeaders: Record<string, any> = {};
    const res: any = {
      statusCode: 200,
      headers: resHeaders,
      setHeader: (k: string, v: any) => { resHeaders[k.toLowerCase()] = v; },
      getHeader: (k: string) => resHeaders[k.toLowerCase()],
      status: (code: number) => {
        res.statusCode = code;
        return res;
      },
      json: (data: any) => {
        resolve({ status: res.statusCode, body: data, headers: resHeaders });
        return res;
      },
      send: (data: any) => {
        resolve({ status: res.statusCode, body: data, headers: resHeaders });
        return res;
      },
      sendFile: (filepath: string) => {
        resolve({ status: res.statusCode, body: { filepath }, headers: resHeaders });
        return res;
      }
    };

    app(req, res, (err?: any) => {
      if (err) {
        resolve({ status: 500, body: { error: err.message }, headers: resHeaders });
      } else {
        resolve({ status: 404, body: { error: 'Not Found' }, headers: resHeaders });
      }
    });
  });
}

export async function runPackageB4_3ClaimOriginFixTests(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('\n================================================================');
  console.log('  PHASE PACKAGE B4.3 — FINAL TRUSTED AUTHORITY CLAIM ORIGIN TESTS');
  console.log('================================================================\n');

  const app = createTestApp();

  // --------------------------------------------------------------------------
  // TEST 1: Authenticated ordinary user + x-authority-role elevation attempt
  // --------------------------------------------------------------------------
  console.log('--- Test 1: Caller-controlled x-authority-role Header Elevation ---');
  const ordinaryUserReq = await simulateRequest(app, {
    method: 'POST',
    path: '/api/cpa/capability/promote',
    headers: {
      'x-authority-role': 'CAPABILITY_PROMOTION_AUTHORITY'
    },
    user: {
      principalId: 'usr-ordinary-auditor-1',
      role: 'AUDIT_STAFF',
      isHuman: true
    },
    body: {
      skillId: 'extract_financial_table',
      candidateVersion: '2.0.0',
      approvedBy: 'usr-ordinary-auditor-1'
    }
  });

  assert(
    'B4.3-TEST-1: Header x-authority-role cannot elevate ordinary user to Promotion Authority (400)',
    ordinaryUserReq.status === 400 && String(ordinaryUserReq.body?.error).includes('UNAUTHORIZED_PROMOTION_AUTHORITY'),
    `Expected HTTP 400 UNAUTHORIZED_PROMOTION_AUTHORITY, got ${ordinaryUserReq.status}: ${JSON.stringify(ordinaryUserReq.body)}`,
    'x-authority-role header was strictly ignored; ordinary user was not elevated to Promotion Authority.'
  );

  // --------------------------------------------------------------------------
  // TEST 2: Authenticated ordinary user + x-authority-claim elevation attempt
  // --------------------------------------------------------------------------
  console.log('\n--- Test 2: Caller-controlled x-authority-claim Header Elevation ---');
  const claimSpoofReq = await simulateRequest(app, {
    method: 'GET',
    path: '/api/cpa/academy/sealed-truth/BENCH-001',
    headers: {
      'x-authority-claim': 'EXAMINER_SEALED_READ'
    },
    user: {
      principalId: 'usr-ordinary-auditor-2',
      role: 'AUDIT_STAFF',
      claims: []
    }
  });

  assert(
    'B4.3-TEST-2: Header x-authority-claim cannot grant access to sealed Minerva truth (403)',
    claimSpoofReq.status === 403 && String(claimSpoofReq.body?.error).includes('EXAMINER_SEALED_ACCESS_DENIED'),
    `Expected HTTP 403 EXAMINER_SEALED_ACCESS_DENIED, got ${claimSpoofReq.status}: ${JSON.stringify(claimSpoofReq.body)}`,
    'x-authority-claim header was strictly ignored; sealed benchmark truth access was denied.'
  );

  // --------------------------------------------------------------------------
  // TEST 3: x-authorized-agent header cannot grant agent impersonation authority
  // --------------------------------------------------------------------------
  console.log('\n--- Test 3: Caller-controlled x-authorized-agent Impersonation ---');
  const agentSpoofReq = await simulateRequest(app, {
    method: 'POST',
    path: '/api/cpa/skills/execute',
    headers: {
      'x-authorized-agent': 'eve-ledger-spoofed'
    },
    user: {
      principalId: 'usr-agent-delegate-1',
      role: 'AGENT_DELEGATE',
      authorizedAgents: ['eve-hermes'] // Only authorized for eve-hermes
    },
    body: {
      skillId: 'extract_financial_table',
      agentId: 'eve-ledger-spoofed',
      input: { text: 'table' }
    }
  });

  assert(
    'B4.3-TEST-3: Header x-authorized-agent cannot grant agent impersonation (403)',
    agentSpoofReq.status === 403 && agentSpoofReq.body?.error === 'AGENT_IMPERSONATION_FORBIDDEN',
    `Expected HTTP 403 AGENT_IMPERSONATION_FORBIDDEN, got ${agentSpoofReq.status}: ${JSON.stringify(agentSpoofReq.body)}`,
    'x-authorized-agent header was strictly ignored; unauthorized agent execution was blocked.'
  );

  // --------------------------------------------------------------------------
  // TEST 4: x-tenant-id header is requested-scope only and cannot grant tenant access
  // --------------------------------------------------------------------------
  console.log('\n--- Test 4: Caller-controlled x-tenant-id Scope Elevation ---');
  const tenantCrossReq = await simulateRequest(app, {
    method: 'GET',
    path: '/api/cpa/memory',
    headers: {
      'x-tenant-id': 'tenant-unilever'
    },
    user: {
      principalId: 'usr-tenant-locked-1',
      role: 'INTERNAL_OPERATOR',
      authorizedTenants: ['tenant-coca-cola'] // Only authorized for coca-cola
    }
  });

  assert(
    'B4.3-TEST-4: Header x-tenant-id cannot grant access to unauthorized tenant (403)',
    tenantCrossReq.status === 403 && String(tenantCrossReq.body?.error).includes('CROSS_TENANT_ACCESS_DENIED'),
    `Expected HTTP 403 CROSS_TENANT_ACCESS_DENIED, got ${tenantCrossReq.status}: ${JSON.stringify(tenantCrossReq.body)}`,
    'x-tenant-id header was verified against trusted authorizedTenants and unauthorized tenant access was rejected.'
  );

  // --------------------------------------------------------------------------
  // TEST 5: Trusted provider role grants appropriate authority
  // --------------------------------------------------------------------------
  console.log('\n--- Test 5: Trusted Authority Provider Role Resolution ---');
  professionalSignoffGuard.registerTestPrincipalInternal({
    principalId: 'p-trusted-partner-1',
    displayName: 'Sarah Jenkins, CPA',
    isHuman: true,
    role: 'LICENSED_CPA',
    sessionValid: true,
    status: 'ACTIVE',
    authorizedTenants: ['tenant-unilever']
  });

  const trustedRoleReq = await simulateRequest(app, {
    method: 'GET',
    path: '/api/cpa/memory',
    headers: {
      authorization: 'Bearer p-trusted-partner-1',
      'x-tenant-id': 'tenant-unilever'
    }
  });

  assert(
    'B4.3-TEST-5: Trusted provider role (LICENSED_CPA) successfully authorizes requests (200)',
    trustedRoleReq.status === 200 && Array.isArray(trustedRoleReq.body?.memories),
    `Expected HTTP 200, got ${trustedRoleReq.status}: ${JSON.stringify(trustedRoleReq.body)}`,
    'Trusted principal role was successfully resolved from trusted provider and permitted valid tenant access.'
  );

  // --------------------------------------------------------------------------
  // TEST 6: Trusted provider claim EXAMINER_SEALED_READ grants examiner access
  // --------------------------------------------------------------------------
  console.log('\n--- Test 6: Trusted Provider EXAMINER_SEALED_READ Claim ---');
  professionalSignoffGuard.registerTestPrincipalInternal({
    principalId: 'p-trusted-examiner-1',
    displayName: 'Minerva Examiner Service',
    isHuman: false,
    role: 'EXAMINER_SERVICE',
    claims: ['EXAMINER_SEALED_READ'],
    sessionValid: true,
    status: 'ACTIVE'
  });

  const trustedClaimReq = await simulateRequest(app, {
    method: 'GET',
    path: '/api/cpa/academy/sealed-truth/BENCH-001',
    headers: {
      authorization: 'Bearer p-trusted-examiner-1'
    }
  });

  assert(
    'B4.3-TEST-6: Trusted provider claim EXAMINER_SEALED_READ grants sealed truth read access (200)',
    trustedClaimReq.status === 200 && trustedClaimReq.body?.groundTruth?.expectedFacts?.length > 0,
    `Expected HTTP 200 with groundTruth, got ${trustedClaimReq.status}: ${JSON.stringify(trustedClaimReq.body)}`,
    'EXAMINER_SEALED_READ claim from trusted provider granted access to sealed Minerva benchmark ground truth.'
  );

  // --------------------------------------------------------------------------
  // TEST 7: Trusted provider claim CAPABILITY_PROMOTION_AUTHORITY grants promotion authority
  // --------------------------------------------------------------------------
  console.log('\n--- Test 7: Trusted Provider CAPABILITY_PROMOTION_AUTHORITY Claim ---');
  professionalSignoffGuard.registerTestPrincipalInternal({
    principalId: 'p-promotion-authority-1',
    displayName: 'Promotion Committee Lead',
    isHuman: true,
    role: 'PROMOTION_COMMITTEE',
    claims: ['CAPABILITY_PROMOTION_AUTHORITY'],
    sessionValid: true,
    status: 'ACTIVE'
  });

  // Submit a candidate and attach holdout eval to test promotion
  capabilityPromotionAuthority.submitCandidate({
    skillId: 'b4_3_test_skill',
    candidateVersion: '1.5.0',
    proposedBy: 'DARWIN',
    changeReason: 'Optimization for B4.3 validation',
    learningCaseIds: ['LC-B43-001'],
    testResults: { passed: true, score: 100, totalCases: 5 }
  });

  const passingOutputs = {
    'BENCH-001': {
      facts: [
        { canonicalName: 'Turnover (Continuing Operations)', value: '50503000000' },
        { canonicalName: 'Operating Profit', value: '9900000000' },
        { canonicalName: 'Net Profit', value: '7200000000' }
      ]
    },
    'BENCH-002': {
      facts: [
        { canonicalName: 'US Subsidiary Revenue', value: '10850000' },
        { canonicalName: 'UK Subsidiary Revenue', value: '8500000' },
        { canonicalName: 'Normalized Group Revenue', value: '20120000' }
      ],
      convertedEur: 20120000
    },
    'BENCH-003': {
      facts: [
        { canonicalName: 'Total Assets', value: '142500000' },
        { canonicalName: 'Total Liabilities', value: '85200000' },
        { canonicalName: 'Total Equity', value: '57300000' }
      ]
    },
    'BENCH-004': {
      status: 'REFUSED',
      variance: 500000
    }
  };

  solverExecutionRegistry.registerExecutionPackage({
    executionId: 'exec-b4-3-7',
    agentId: 'HERMES',
    toolCalls: [],
    outputs: passingOutputs
  });

  const rep7 = academyMinervaLab.runEvaluation(passingOutputs, 'exec-b4-3-7');
  capabilityPromotionAuthority.attachHoldoutEvaluation({
    skillId: 'b4_3_test_skill',
    candidateVersion: '1.5.0',
    evalId: rep7.evalId
  });

  const trustedPromoReq = await simulateRequest(app, {
    method: 'POST',
    path: '/api/cpa/capability/promote',
    headers: {
      authorization: 'Bearer p-promotion-authority-1'
    },
    body: {
      skillId: 'b4_3_test_skill',
      candidateVersion: '1.5.0',
      approvedBy: 'p-promotion-authority-1'
    }
  });

  assert(
    'B4.3-TEST-7: Trusted provider claim CAPABILITY_PROMOTION_AUTHORITY authorizes promotion (200)',
    trustedPromoReq.status === 200 && trustedPromoReq.body?.promotedRecord?.status === 'PROMOTED_ACTIVE',
    `Expected HTTP 200 with PROMOTED_ACTIVE, got ${trustedPromoReq.status}: ${JSON.stringify(trustedPromoReq.body)}`,
    'CAPABILITY_PROMOTION_AUTHORITY claim from trusted provider authorized candidate version promotion.'
  );

  // --------------------------------------------------------------------------
  // TEST 8: Missing trusted role/claim remains non-privileged
  // --------------------------------------------------------------------------
  console.log('\n--- Test 8: Missing Trusted Role / Claim Remains Non-Privileged ---');
  professionalSignoffGuard.registerTestPrincipalInternal({
    principalId: 'p-unprivileged-staff-1',
    displayName: 'Junior Audit Staff',
    isHuman: true,
    role: 'AUDIT_STAFF',
    claims: [],
    sessionValid: true,
    status: 'ACTIVE'
  });

  const unprivilegedExaminerReq = await simulateRequest(app, {
    method: 'GET',
    path: '/api/cpa/academy/sealed-truth/BENCH-001',
    headers: {
      authorization: 'Bearer p-unprivileged-staff-1'
    }
  });

  const unprivilegedSpawnReq = await simulateRequest(app, {
    method: 'POST',
    path: '/api/cpa/specialist/spawn',
    headers: {
      authorization: 'Bearer p-unprivileged-staff-1'
    },
    body: { topic: 'Testing' }
  });

  assert(
    'B4.3-TEST-8: Missing trusted role/claim remains non-privileged (403 on privileged routes)',
    unprivilegedExaminerReq.status === 403 && unprivilegedSpawnReq.status === 403,
    `Expected HTTP 403 on both, got ${unprivilegedExaminerReq.status} and ${unprivilegedSpawnReq.status}`,
    'Non-privileged authenticated principal was properly forbidden from accessing examiner or operator actions.'
  );

  // --------------------------------------------------------------------------
  // TEST 9: Test-only injected authority works in test mode only (rejected in production)
  // --------------------------------------------------------------------------
  console.log('\n--- Test 9: Test-only Injected Authority Environment Gating ---');
  
  // In test mode: x-test-authority-inject works
  const testModeInjectReq = await simulateRequest(app, {
    method: 'GET',
    path: '/api/cpa/memory',
    headers: {
      'x-test-authority-inject': 'true',
      'x-principal-id': 'test-injected-op',
      'x-authority-role': 'INTERNAL_OPERATOR'
    }
  });

  // Temporarily simulate production mode
  const originalEnv = process.env.NODE_ENV;
  const originalTestMode = process.env.TEST_MODE;
  process.env.NODE_ENV = 'production';
  process.env.TEST_MODE = 'false';

  const prodModeInjectReq = await simulateRequest(app, {
    method: 'GET',
    path: '/api/cpa/memory',
    headers: {
      'x-test-authority-inject': 'true',
      'x-principal-id': 'test-injected-op',
      'x-authority-role': 'INTERNAL_OPERATOR'
    }
  });

  // Restore test mode
  process.env.NODE_ENV = originalEnv || 'test';
  process.env.TEST_MODE = originalTestMode || 'true';

  assert(
    'B4.3-TEST-9: Test-injected authority works in test mode (200) and is strictly rejected in production (401)',
    testModeInjectReq.status === 200 && prodModeInjectReq.status === 401,
    `Expected 200 in test mode, 401 in prod mode. Got test=${testModeInjectReq.status}, prod=${prodModeInjectReq.status}`,
    'Test authority injection is strictly gated to test environment; production rejects untrusted header injection.'
  );

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  const total = testResults.length;

  console.log('\n================================================================');
  console.log(`  PHASE PACKAGE B4.3 TEST SUMMARY: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log('================================================================\n');

  return { passed, failed, total };
}

// Auto-run when executed directly via tsx
if (process.argv[1]?.includes('phasePackageB4_3ClaimOriginFix.test.ts')) {
  runPackageB4_3ClaimOriginFixTests()
    .then((res) => {
      process.exit(res.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal error during test execution:', err);
      process.exit(1);
    });
}
