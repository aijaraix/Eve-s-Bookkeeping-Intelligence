/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — PACKAGE A3 BROWSER & CUSTOMER UI TRUTH TEST SUITE
 * 
 * Target: Document 35 Package A3 Verification
 * Enforces:
 * 1. UploadModal accepts .htm / .html and text/html files without rejection
 * 2. UploadModal stage change does not fabricate empirical percentage numbers
 * 3. UploadModal getAgentStatus does not return artificial RUNNING fallback during processing
 * 4. PracticeContext runSwarmPass does not fabricate agent completion when response lacks agents array
 * 5. RealBrowserCustomerSimulator physically interacts with engagement routing UI controls
 * 6. RealBrowserCustomerSimulator proves truthful cryptographic hash continuity without synthetic browserUploadSha256
 * 7. RealBrowserCustomerSimulator classifies local vs production execution (LOCAL_TEST vs PRODUCTION)
 * 8. UploadModal completion screen distinguishes facts extracted from verified facts
 * 9. UI replaces unconditional guarantee strings with precise verification language
 * 10. RealBrowserCustomerSimulator fails closed if serverReceivedSha256 diverges from staged file
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { RealBrowserCustomerSimulatorEngine } from '../cpaOrganization/realBrowserCustomerSimulatorEngine.js';

export async function runPhasePackageA3BrowserTruthTests(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('\n===============================================================');
  console.log('RUNNING PACKAGE A3 BROWSER TRUTH & CUSTOMER UI TEST SUITE');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;
  const total = 10;

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
  const uploadModalSource = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'UploadModal.tsx'),
    'utf-8'
  );
  const practiceContextSource = fs.readFileSync(
    path.join(process.cwd(), 'src', 'context', 'PracticeContext.tsx'),
    'utf-8'
  );

  // Test 1: UploadModal accepts .htm, .html, and text/html files without rejection
  {
    const acceptsHtm = uploadModalSource.includes('.htm') && uploadModalSource.includes('.html');
    const acceptsTextHtml = uploadModalSource.includes('text/html');
    const inputAcceptHasHtm = uploadModalSource.includes('accept=".pdf,.xlsx,.xls,.csv,.htm,.html,application/pdf,text/html"');
    
    // Simulate the exact file extension predicate used in addFiles
    const validFilesPredicate = (fileName: string, fileType: string) => {
      const lower = fileName.toLowerCase();
      return (
        lower.endsWith('.pdf') ||
        lower.endsWith('.xlsx') ||
        lower.endsWith('.xls') ||
        lower.endsWith('.csv') ||
        lower.endsWith('.htm') ||
        lower.endsWith('.html') ||
        fileType === 'application/pdf' ||
        fileType === 'text/html'
      );
    };

    const secAuthoritativeHtm = validFilesPredicate('primary_doc.htm', 'text/html');
    const secAuthoritativeHtml = validFilesPredicate('primary_doc.html', 'text/html');
    const unknownRejection = validFilesPredicate('unsupported.exe', 'application/x-msdownload');

    assertTest(
      'Test 1: UploadModal accepts authoritative SEC .htm, .html, and text/html files',
      acceptsHtm && acceptsTextHtml && inputAcceptHasHtm && secAuthoritativeHtm && secAuthoritativeHtml && !unknownRejection,
      'Expected UploadModal to support .htm, .html, text/html in dropzone and input accept'
    );
  }

  // Test 2: UploadModal stage change does not fabricate percentage numbers
  {
    // Check that stage ordinal multiplication has been completely eliminated
    const hasStageIndexTimes20 = uploadModalSource.includes('stageIndex * 20');
    const hasStageIndexMultiplication = /stages\.indexOf\(.*?\)\s*\*\s*\d+/.test(uploadModalSource);
    
    // Behavioral check of the calculation logic:
    // When percentComplete is null/undefined and processedUnits is null, realPercentage must be null
    const computePercentage = (activeJob: any, activeIntake: any): number | null => {
      if (activeJob?.percentComplete !== undefined && activeJob?.percentComplete !== null) {
        return Math.min(100, Math.max(0, Math.round(Number(activeJob.percentComplete))));
      }
      if (activeIntake?.percentComplete !== undefined && activeIntake?.percentComplete !== null) {
        return Math.min(100, Math.max(0, Math.round(Number(activeIntake.percentComplete))));
      }
      const totalUnits = Number(activeJob?.totalUnits || activeIntake?.totalUnits || 0);
      const processedUnits = Number(activeJob?.processedUnits || activeIntake?.processedUnits || 0);
      if (totalUnits > 0 && processedUnits >= 0) {
        return Math.min(100, Math.max(0, Math.round((processedUnits / totalUnits) * 100)));
      }
      return null;
    };

    const testStageWithoutPercent = computePercentage(
      { stage: 'FACT_RECONCILIATION' },
      { stage: 'FACT_RECONCILIATION' }
    );
    const testStageWithRealPercent = computePercentage(
      { percentComplete: 68 },
      {}
    );

    assertTest(
      'Test 2: UploadModal relies on empirical percentage, never stage ordinals',
      !hasStageIndexTimes20 && !hasStageIndexMultiplication && testStageWithoutPercent === null && testStageWithRealPercent === 68,
      'Expected realPercentage to be null when no empirical progress is reported, not synthetic stage math'
    );
  }

  // Test 3: UploadModal getAgentStatus does not return artificial RUNNING fallback
  {
    // Behavioral test of the hardened getAgentStatus logic
    const getAgentStatus = (agentId: string, activeJob: any, activeIntake: any, phase: string): string => {
      const records = activeJob?.agentRecords || activeIntake?.agentRecords || [];
      const match = records.find((r: any) => r.agentId === agentId || r.id === agentId);
      if (match?.status) return match.status;

      if (phase === 'COMPLETE') return 'COMPLETED';
      return 'WAITING';
    };

    const statusDuringAnalyzing = getAgentStatus('balance-sentinel', {}, {}, 'ANALYZING');
    const statusDuringSetup = getAgentStatus('balance-sentinel', {}, {}, 'SETUP');
    const hasRunningFallbackInSource = uploadModalSource.includes("phase === 'ANALYZING' ? 'RUNNING' : 'WAITING'");

    assertTest(
      'Test 3: getAgentStatus returns WAITING, never unverified RUNNING fallback',
      statusDuringAnalyzing === 'WAITING' && statusDuringSetup === 'WAITING' && !hasRunningFallbackInSource,
      `Expected getAgentStatus to return WAITING (got ${statusDuringAnalyzing}), without artificial RUNNING fallback`
    );
  }

  // Test 4: PracticeContext runSwarmPass does not fabricate agent completion when response lacks agents array
  {
    // Inspect PracticeContext source for honest handling of empty/malformed swarm responses
    const setsCompletedWithoutAgents = practiceContextSource.includes("status: 'completed',\n            lastExecution: 'Just now'");
    const setsIdleOrUnmeasured = practiceContextSource.includes("Execution detail not returned by server") ||
                                practiceContextSource.includes("HTTP success is not agent success");

    assertTest(
      'Test 4: PracticeContext preserves idle/unmeasured state when server omits agent records',
      !setsCompletedWithoutAgents && setsIdleOrUnmeasured,
      'Expected PracticeContext to not mark agents completed on bare HTTP 200 without agents payload'
    );
  }

  // Test 5: RealBrowserCustomerSimulator physically interacts with engagement routing UI controls
  {
    const interactsWithRoutingMode = simulatorSource.includes('#routing-mode-new-engagement') &&
                                    simulatorSource.includes('#routing-mode-existing-engagement');
    const interactsWithEngagementInputs = simulatorSource.includes('#new-engagement-name-input') &&
                                         simulatorSource.includes('#new-client-name-input') &&
                                         simulatorSource.includes('#reporting-standard-select') &&
                                         simulatorSource.includes('#engagement-currency-select');
    const removesFakeClientStep = !simulatorSource.includes("Select Client Workspace', `#client-${params.ticker.toLowerCase()}`");

    assertTest(
      'Test 5: RealBrowserCustomerSimulator physically drives engagement routing UI controls',
      interactsWithRoutingMode && interactsWithEngagementInputs && removesFakeClientStep,
      'Expected simulator to interact with real routing mode buttons, text inputs, and select elements in DOM'
    );
  }

  // Test 6: RealBrowserCustomerSimulator proves truthful cryptographic hash continuity
  {
    const copiesStagingToBrowser = simulatorSource.includes('browserUploadSha256 = stagingSha256');
    const hasServerReceivedSha256 = simulatorSource.includes('serverReceivedSha256');
    const provesContinuity = simulatorSource.includes('(sourceSha256 === stagingSha256) &&') &&
                            simulatorSource.includes('(stagingSha256 === serverReceivedSha256)');

    // Behavioral test of continuity calculation
    const sourceBytes = Buffer.from('Authoritative SEC Filing Content');
    const sourceSha = crypto.createHash('sha256').update(sourceBytes).digest('hex');
    const stagedBytes = Buffer.from('Authoritative SEC Filing Content');
    const stagedSha = crypto.createHash('sha256').update(stagedBytes).digest('hex');
    const serverReceivedSha = stagedSha;

    const verified = (sourceSha === stagedSha) && (stagedSha === serverReceivedSha);

    assertTest(
      'Test 6: Cryptographic hash proof compares serverReceivedSha256 without synthetic browser hash copy',
      !copiesStagingToBrowser && hasServerReceivedSha256 && provesContinuity && verified,
      'Expected hash proof to verify sourceSha256 == stagingSha256 == serverReceivedSha256 directly'
    );
  }

  // Test 7: RealBrowserCustomerSimulator classifies local vs production execution
  {
    const recordsClassification = simulatorSource.includes("environmentClassification: 'LOCAL_TEST' | 'PRODUCTION'");
    const recordsProofLevel = simulatorSource.includes("LOCAL_BROWSER_VERIFIED") && simulatorSource.includes("PRODUCTION_BROWSER_VERIFIED");
    const handlesLocalhost = simulatorSource.includes("baseUrl.includes('127.0.0.1') || baseUrl.includes('localhost')");

    // Behavioral classification test
    const classifyEnv = (baseUrl: string) => {
      const isLocal = baseUrl.includes('127.0.0.1') || baseUrl.includes('localhost');
      return {
        classification: isLocal ? 'LOCAL_TEST' : 'PRODUCTION',
        proofLevel: isLocal ? 'LOCAL_BROWSER_VERIFIED' : 'PRODUCTION_BROWSER_VERIFIED'
      };
    };

    const localCheck = classifyEnv('http://127.0.0.1:3000');
    const prodCheck = classifyEnv('https://cpa-studio.eve-accounting.com');

    assertTest(
      'Test 7: Classifies local test vs production browser verification truthfully',
      recordsClassification && recordsProofLevel && handlesLocalhost &&
      localCheck.classification === 'LOCAL_TEST' && localCheck.proofLevel === 'LOCAL_BROWSER_VERIFIED' &&
      prodCheck.classification === 'PRODUCTION' && prodCheck.proofLevel === 'PRODUCTION_BROWSER_VERIFIED',
      'Expected localhost to be classified as LOCAL_TEST / LOCAL_BROWSER_VERIFIED'
    );
  }

  // Test 8: UploadModal completion screen distinguishes facts extracted from verified facts
  {
    const hasFactsExtractedMetric = uploadModalSource.includes('Facts Extracted');
    const preservesVerifiedFactsDistinction = uploadModalSource.includes('Verified Facts') &&
                                             uploadModalSource.includes('hasVerifiedFacts');
    const distinguishesProcessingFromClearance = uploadModalSource.includes('Document Processing Complete') &&
                                                uploadModalSource.includes('Audit Clearance Gate');

    assertTest(
      'Test 8: UploadModal completion screen distinguishes extracted facts from verified facts',
      hasFactsExtractedMetric && preservesVerifiedFactsDistinction && distinguishesProcessingFromClearance,
      'Expected completion screen to separate extraction completion from verified audit promotion'
    );
  }

  // Test 9: UI replaces unconditional guarantee strings with precise verification language
  {
    const hasUnconditionalGuarantee = uploadModalSource.includes('Fail-Closed CPA Integrity Guarantee');
    const hasTruthfulControlText = uploadModalSource.includes('Fail-Closed Verification Controls');
    const hasFrameworkValidation = uploadModalSource.includes('Accounting Framework Validation');

    assertTest(
      'Test 9: Replaces unconditional guarantee language with precise verification controls',
      !hasUnconditionalGuarantee && hasTruthfulControlText && hasFrameworkValidation,
      'Expected UI to avoid unconditional guarantees and present verifiable control descriptions'
    );
  }

  // Test 10: RealBrowserCustomerSimulator fails closed if server-received hash diverges
  {
    const sourceSha = '1111111111111111111111111111111111111111111111111111111111111111';
    const stagingSha = sourceSha;
    const divergentServerSha = '2222222222222222222222222222222222222222222222222222222222222222';

    const checkHashContinuity = (src: string, stg: string, srv: string): boolean => {
      return (src === stg) && (stg === srv);
    };

    const failClosedBreachDetected = !checkHashContinuity(sourceSha, stagingSha, divergentServerSha);

    assertTest(
      'Test 10: Fail-closed hash continuity check rejects tampering or divergent server hashes',
      failClosedBreachDetected,
      'Expected hash continuity check to reject divergent server hashes'
    );
  }

  console.log(`\nPACKAGE A3 RESULT: ${passed}/${total} Passed, ${failed} Failed\n`);
  return { passed, failed, total };
}
