/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — PACKAGE A4 BROWSER PROOF SEMANTICS CLEANUP TEST SUITE
 * 
 * Target: Document 35 Package A4 Verification
 * Enforces:
 * 1. browserUploadSha256 is not an alias of serverReceivedSha256 and is removed from authoritative proof contract
 * 2. Comments/results no longer claim five independent hash boundaries (truthful 3-boundary chain: source -> staging -> server)
 * 3. Extracted facts are not automatically labeled canonical facts unless canonical promotion has occurred
 * 4. Processing completion is not automatically labeled "Verified & Staged" unless actual verification evidence exists
 * 5. Arbitrary remote/staging/preview URLs cannot receive PRODUCTION_BROWSER_VERIFIED without explicit configuration
 * 6. Explicit production configuration (EVE_RUNTIME_ENV=production AND EVE_APP_BASE_URL=declaredUrl) can receive PRODUCTION_BROWSER_VERIFIED
 */

import fs from 'fs';
import path from 'path';
import { RealBrowserCustomerSimulatorEngine } from '../cpaOrganization/realBrowserCustomerSimulatorEngine.js';

export async function runPhasePackageA4BrowserProofTests(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('\n===============================================================');
  console.log('RUNNING PACKAGE A4 BROWSER PROOF SEMANTICS TEST SUITE');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;
  const total = 6;

  function assertTest(name: string, condition: boolean, details: string) {
    if (condition) {
      console.log(`  \x1b[32m[PASS]\x1b[0m ${name}`);
      passed++;
    } else {
      console.error(`  \x1b[31m[FAIL]\x1b[0m ${name} — ${details}`);
      failed++;
    }
  }

  const simulator = RealBrowserCustomerSimulatorEngine.getInstance();
  const simulatorSource = fs.readFileSync(
    path.join(process.cwd(), 'server', 'cpaOrganization', 'realBrowserCustomerSimulatorEngine.ts'),
    'utf-8'
  );
  const productionEngineSource = fs.readFileSync(
    path.join(process.cwd(), 'server', 'cpaOrganization', 'productionAutonomousCPAEngine.ts'),
    'utf-8'
  );
  const uploadModalSource = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'UploadModal.tsx'),
    'utf-8'
  );

  // Test 1: browserUploadSha256 is not an alias of serverReceivedSha256
  {
    const hasDuplicateAssign = simulatorSource.includes('browserUploadSha256: serverReceivedSha256');
    const hasInterfaceProperty = /interface\s+RealBrowserJourneyResult\s*\{[^}]*browserUploadSha256/s.test(simulatorSource);
    const hasServerReceivedSha = simulatorSource.includes('serverReceivedSha256: string');

    assertTest(
      'Test 1: browserUploadSha256 is not an alias of serverReceivedSha256 and removed from proof contract',
      !hasDuplicateAssign && !hasInterfaceProperty && hasServerReceivedSha,
      'Expected browserUploadSha256 alias to be removed from return object and RealBrowserJourneyResult interface'
    );
  }

  // Test 2: Comments and logs no longer claim five independent hash boundaries
  {
    const simulatorHas5Point = simulatorSource.includes('5-point') || simulatorSource.includes('5-Point') || simulatorSource.toLowerCase().includes('five-point');
    const prodEngineHas5Point = productionEngineSource.includes('5-point') || productionEngineSource.includes('5-Point') || productionEngineSource.toLowerCase().includes('five-point');
    const hasTruthfulChainComment = simulatorSource.includes('SOURCE_BYTES_SHA = STAGED_FILE_SHA = SERVER_RECEIVED_BYTES_SHA');

    assertTest(
      'Test 2: Code and comments no longer claim 5-point hash chain (truthful 3-boundary continuity)',
      !simulatorHas5Point && !prodEngineHas5Point && hasTruthfulChainComment,
      'Expected elimination of 5-point claims and adoption of 3-boundary cryptographic continuity'
    );
  }

  // Test 3: Extracted facts are not automatically called canonical facts
  {
    const hasUnconditionalCanonicalLabel = uploadModalSource.includes('<div className="text-xs font-bold text-slate-900">Extracted Canonical Facts</div>');
    const hasConditionalFactsLabel = uploadModalSource.includes("{isPromoted ? 'Canonical Facts' : 'Facts Extracted'}");

    assertTest(
      'Test 3: Extracted facts are not labeled canonical facts unless promotion is proven',
      !hasUnconditionalCanonicalLabel && hasConditionalFactsLabel,
      'Expected UploadModal to use "Facts Extracted" until canonical promotion is proven'
    );
  }

  // Test 4: Processing completion is not automatically called verified
  {
    const hasUnconditionalVerifiedStaged = uploadModalSource.includes("{phase === 'COMPLETE' && '3. Verified & Staged'}");
    const hasConditionalProcessingComplete = uploadModalSource.includes("phase === 'COMPLETE' && (isCleared && hasVerifiedFacts ? '3. Verified & Staged' : '3. Processing Complete')");

    assertTest(
      'Test 4: Processing completion is not automatically called verified without backend clearance',
      !hasUnconditionalVerifiedStaged && hasConditionalProcessingComplete,
      'Expected Phase 3 badge to show "Processing Complete" unless isCleared and hasVerifiedFacts are true'
    );
  }

  // Test 5: Arbitrary remote/staging URL cannot receive PRODUCTION_BROWSER_VERIFIED
  {
    const stagingResult = simulator.classifyEnvironment('https://cpa-staging.eve-accounting.com', {
      EVE_RUNTIME_ENV: 'staging',
      EVE_APP_BASE_URL: 'https://cpa-staging.eve-accounting.com'
    });

    const previewResult = simulator.classifyEnvironment('https://eve-preview-ku5ofl.run.app', {
      EVE_RUNTIME_ENV: 'preview'
    });

    const unconfiguredRemoteResult = simulator.classifyEnvironment('https://random-cloud-host.io', {
      EVE_RUNTIME_ENV: 'production',
      EVE_APP_BASE_URL: 'https://official-production.eve-accounting.com' // does not match baseUrl
    });

    const noConfigRemoteResult = simulator.classifyEnvironment('https://arbitrary-site.com', {});

    const stagingSafe = stagingResult.proofLevel === 'STAGING_BROWSER_VERIFIED' && stagingResult.environmentClassification === 'STAGING';
    const previewSafe = previewResult.proofLevel === 'PREVIEW_BROWSER_VERIFIED' && previewResult.environmentClassification === 'PREVIEW';
    const mismatchSafe = unconfiguredRemoteResult.proofLevel === 'NON_PRODUCTION_BROWSER_VERIFIED' && unconfiguredRemoteResult.environmentClassification === 'NON_PRODUCTION';
    const noConfigSafe = noConfigRemoteResult.proofLevel === 'NON_PRODUCTION_BROWSER_VERIFIED' && noConfigRemoteResult.environmentClassification === 'NON_PRODUCTION';

    assertTest(
      'Test 5: Arbitrary remote, staging, and preview URLs cannot receive PRODUCTION_BROWSER_VERIFIED',
      stagingSafe && previewSafe && mismatchSafe && noConfigSafe,
      'Expected arbitrary remote/staging/preview URLs to receive non-production proof levels'
    );
  }

  // Test 6: Explicit production configuration can receive PRODUCTION_BROWSER_VERIFIED
  {
    const prodUrl = 'https://cpa.eve-accounting.com';
    const explicitProdResult = simulator.classifyEnvironment(prodUrl, {
      EVE_RUNTIME_ENV: 'production',
      EVE_APP_BASE_URL: prodUrl
    });

    const prodWithTrailingSlash = simulator.classifyEnvironment('https://cpa.eve-accounting.com/', {
      EVE_RUNTIME_ENV: 'production',
      EVE_APP_BASE_URL: 'https://cpa.eve-accounting.com'
    });

    const isProd = explicitProdResult.environmentClassification === 'PRODUCTION' &&
                   explicitProdResult.proofLevel === 'PRODUCTION_BROWSER_VERIFIED' &&
                   prodWithTrailingSlash.environmentClassification === 'PRODUCTION' &&
                   prodWithTrailingSlash.proofLevel === 'PRODUCTION_BROWSER_VERIFIED';

    assertTest(
      'Test 6: Explicit production configuration receives PRODUCTION_BROWSER_VERIFIED',
      isProd,
      'Expected EVE_RUNTIME_ENV=production AND EVE_APP_BASE_URL match to receive PRODUCTION / PRODUCTION_BROWSER_VERIFIED'
    );
  }

  console.log(`\nPACKAGE A4 RESULT: ${passed}/${total} Passed, ${failed} Failed\n`);
  return { passed, failed, total };
}
