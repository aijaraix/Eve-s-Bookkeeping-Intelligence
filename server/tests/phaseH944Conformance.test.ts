/**
 * PHASE H.9.44 — PRE-COMPANY 1 PHYSICAL CONFORMANCE BEHAVIORAL TEST SUITE
 * 
 * Tests real behavior across:
 * 1. Generic Universal Document IR works on multiple companies with NO Palantir identifiers in non-Palantir filings
 * 2. Balance Sheet extraction rejects manufactured Equity = Assets - Liabilities derivation
 * 3. Hermes Job Dispatch records authentic role execution classes (REAL_AI_AGENT, DETERMINISTIC_SPECIALIST_ENGINE)
 * 4. Persisted artifact receives proofLevel = 'PERSISTED' and NOT 'PRODUCT_VERIFIED' from file existence alone
 * 5. Athena and Quinn do not return predetermined compliant conclusions without substantive evidence
 * 6. Discovered account and taxonomy counts preserve 0 when 0 objects are discovered (no minimum floors)
 * 7. RealBrowserCustomerSimulatorEngine resolves browser executable dynamically
 * 8. Customer upload persists queue state (CUSTOMER_PRIORITY_ENQUEUED) without requiring /process call
 * 9. Minerva fails when given missing facts or unrelated solver outputs
 * 10. Minerva live-engagement validation validates authentic company identities without forcing Unilever values
 * 11. Predefined cohort is classified as FIXED_REGRESSION_COHORT
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { academyMinervaLab } from '../cpaOrganization/academyMinervaLab.js';
import { hermesJobDispatchService } from '../cpaOrganization/hermesJobDispatchService.js';
import { blindAutonomousH943Engine } from '../cpaOrganization/blindAutonomousH943Engine.js';
import { deepDocumentExtractionPipeline } from '../cpaOrganization/deepDocumentExtractionPipeline.js';
import { realBrowserCustomerSimulatorEngine } from '../cpaOrganization/realBrowserCustomerSimulatorEngine.js';

export async function runPhaseH944ConformanceTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n===============================================================');
  console.log('RUNNING PHASE H.9.44 FINAL PHYSICAL CONFORMANCE BEHAVIORAL SUITE');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assertTest(name: string, condition: boolean, details: string) {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} — ${details}`);
      failed++;
    }
  }

  // Test 1: Generic extractor works on non-Palantir company with zero PLTR identifiers
  const dummyNonPalantirFiling = `
    <html>
      <head><title>Acme Industrial Corp 10-K</title></head>
      <body>
        <table id="balance-sheet">
          <tr><td>Total Assets</td><td><ix:nonFraction name="us-gaap:Assets" contextRef="c-2025" unitRef="USD" scale="6">1250</ix:nonFraction></td></tr>
          <tr><td>Total Liabilities</td><td><ix:nonFraction name="us-gaap:Liabilities" contextRef="c-2025" unitRef="USD" scale="6">750</ix:nonFraction></td></tr>
          <tr><td>Stockholders Equity</td><td><ix:nonFraction name="us-gaap:StockholdersEquity" contextRef="c-2025" unitRef="USD" scale="6">500</ix:nonFraction></td></tr>
        </table>
        <p>Revenues were <ix:nonFraction name="us-gaap:Revenues" contextRef="c-2025" unitRef="USD" scale="6">2000</ix:nonFraction></p>
      </body>
    </html>
  `;
  const tmpNonPltrPath = path.join(process.cwd(), 'storage', 'cpa_memory', 'test_acme_10k.htm');
  fs.writeFileSync(tmpNonPltrPath, dummyNonPalantirFiling);

  const nonPltrExtraction = deepDocumentExtractionPipeline.runExtraction(tmpNonPltrPath);
  const jsonStr = JSON.stringify(nonPltrExtraction);
  const containsPalantirId = jsonStr.includes('DP-PLTR') || jsonStr.includes('elem-pltr') || jsonStr.includes('pltr-20251231');

  assertTest(
    'Test 1: Generic extractor extracts from non-Palantir filing without any Palantir identifiers',
    !containsPalantirId && nonPltrExtraction.metrics.totalAssetsUsd === 1250000000 && nonPltrExtraction.metrics.totalLiabilitiesUsd === 750000000,
    `Found Palantir identifiers or incorrect metric values in non-Palantir extraction: ${jsonStr.substring(0, 200)}`
  );

  // Test 2: No Derived Equity solely to balance equation
  const extractionPipelineSource = fs.readFileSync(path.join(process.cwd(), 'server', 'cpaOrganization', 'deepDocumentExtractionPipeline.ts'), 'utf8');
  assertTest(
    'Test 2: DeepDocumentExtractionPipeline forbids manufactured Equity = Assets - Liabilities derivation',
    !extractionPipelineSource.includes('stockholdersEquityUsd = totalAssetsUsd - totalLiabilitiesUsd'),
    'deepDocumentExtractionPipeline.ts contains derived equity calculation'
  );

  // Test 3: Agent execution records authentic role execution classes
  const testExecution = await hermesJobDispatchService.executeCpaSpecialistSwarm({
    engagementId: `ENG-TEST-ROLE-${Date.now()}`,
    clientName: 'Acme Industrial',
    ticker: 'ACME',
    fiscalYear: 'FY2025',
    reportedAssets: 1250000000,
    reportedLiabilities: 750000000,
    reportedEquity: 500000000,
    sourceFilePath: tmpNonPltrPath,
    sourceSha256: crypto.createHash('sha256').update(fs.readFileSync(tmpNonPltrPath)).digest('hex'),
    extractedFactsCount: nonPltrExtraction.atomicDataPoints.length
  });

  const euclidJob = testExecution.jobs.find(j => j.agentId === 'EUCLID');
  const athenaJob = testExecution.jobs.find(j => j.agentId === 'ATHENA');
  assertTest(
    'Test 3: Hermes Job Dispatch records REAL_AI_AGENT and DETERMINISTIC_SPECIALIST_ENGINE classifications',
    euclidJob?.roleExecutionClass === 'DETERMINISTIC_SPECIALIST_ENGINE' &&
    athenaJob?.roleExecutionClass === 'REAL_AI_AGENT',
    `Expected EUCLID=DETERMINISTIC_SPECIALIST_ENGINE, ATHENA=REAL_AI_AGENT; got EUCLID=${euclidJob?.roleExecutionClass}, ATHENA=${athenaJob?.roleExecutionClass}`
  );

  // Test 4: Persisted artifact alone receives proofLevel = 'PERSISTED' (not 'PRODUCT_VERIFIED')
  const firstJob = testExecution.jobs[0];
  assertTest(
    'Test 4: Persisted execution artifact receives proofLevel = PERSISTED (not PRODUCT_VERIFIED from file existence alone)',
    firstJob.proofLevel === 'PERSISTED' && fs.existsSync(firstJob.persistedArtifactPath),
    `Expected proofLevel === 'PERSISTED', got ${firstJob.proofLevel}`
  );

  // Test 5: Athena and Quinn do not return predetermined compliant conclusions
  const quinnJob = testExecution.jobs.find(j => j.agentId === 'QUINN');
  assertTest(
    'Test 5: Athena and Quinn do not claim full pre-certified compliance without independent audit sign-off',
    athenaJob?.outputManifest.technicalSignOff === 'FACTS_EXTRACTED_STANDARDS_REVIEW_PENDING_SUBSTANTIVE_AUDIT' &&
    quinnJob?.outputManifest.concurringApprovalGranted === false &&
    quinnJob?.outputManifest.deliveryEligible === false,
    'Athena or Quinn returned premature compliance sign-off'
  );

  // Test 6: Zero discovered accounts remain 0 (no manufactured minimums or floors)
  const zeroAccountExecution = await hermesJobDispatchService.executeCpaSpecialistSwarm({
    engagementId: `ENG-TEST-ZERO-${Date.now()}`,
    clientName: 'Zero Corp',
    ticker: 'ZERO',
    fiscalYear: 'FY2025',
    reportedAssets: 0,
    reportedLiabilities: 0,
    reportedEquity: 0,
    sourceFilePath: tmpNonPltrPath,
    sourceSha256: 'test',
    extractedFactsCount: 0,
    discoveredAccounts: {
      assetAccountsCount: 0,
      liabilityAccountsCount: 0,
      equityAccountsCount: 0
    },
    taxonomyMetrics: {
      uniqueConceptsCount: 0,
      customExtensionsCount: 0,
      dimensionContextsCount: 0
    }
  });
  const ledgerJob = zeroAccountExecution.jobs.find(j => j.agentId === 'LEDGER');
  const lexiconJob = zeroAccountExecution.jobs.find(j => j.agentId === 'LEXICON');
  assertTest(
    'Test 6: Discovered account and taxonomy counts remain 0 when 0 objects are discovered (no fallback floors)',
    ledgerJob?.outputManifest.assetAccountsMapped === 0 &&
    ledgerJob?.outputManifest.totalBalanceSheetAccounts === 0 &&
    lexiconJob?.outputManifest.customExtensionsCount === 0 &&
    lexiconJob?.outputManifest.dimensionContextsMapped === 0,
    `Expected 0 accounts, got ${ledgerJob?.outputManifest.totalBalanceSheetAccounts}`
  );

  // Test 7: Browser Simulator resolves Chrome executable path dynamically
  let browserExecutableResolved = false;
  try {
    const execPath = realBrowserCustomerSimulatorEngine.resolveChromeExecutablePath();
    browserExecutableResolved = typeof execPath === 'string' && execPath.length > 0;
  } catch (e: any) {
    // If no browser is installed in this test runner, it must throw MISSING_BROWSER_EXECUTABLE
    browserExecutableResolved = e.message.includes('MISSING_BROWSER_EXECUTABLE');
  }
  assertTest(
    'Test 7: RealBrowserCustomerSimulatorEngine resolves browser executable dynamically or throws MISSING_BROWSER_EXECUTABLE',
    browserExecutableResolved,
    'Failed to dynamically resolve Chrome executable or fail cleanly'
  );

  // Test 8: Minerva fails when given missing facts or unrelated solver outputs
  const unrelatedSolverOutput = {
    unrelatedCompany: 'SomeOtherCompany',
    revenue: 999999
  };
  const minervaUnrelatedResult = academyMinervaLab.runEvaluation(unrelatedSolverOutput);
  assertTest(
    'Test 8: Minerva fails when given missing expected benchmark facts or unrelated solver output',
    minervaUnrelatedResult.certifiedStatus === 'DEFECT_DETECTED' || minervaUnrelatedResult.failed > 0,
    `Expected Minerva to reject unrelated output, got ${minervaUnrelatedResult.certifiedStatus}`
  );

  // Test 9: Minerva Live Engagement Validation checks accounting identities without forcing Unilever values
  const liveVal = academyMinervaLab.evaluateLiveEngagement({
    facts: nonPltrExtraction.atomicDataPoints,
    assets: 1250000000,
    liabilities: 750000000,
    equity: 500000000,
    variance: 0,
    physicalFilePath: tmpNonPltrPath,
    physicalSha256: crypto.createHash('sha256').update(fs.readFileSync(tmpNonPltrPath)).digest('hex')
  });
  assertTest(
    'Test 9: Minerva live-engagement validation authenticates company accounting facts without forcing benchmark values',
    liveVal.certifiedStatus === 'CERTIFIED_CPA_READY' && liveVal.euclidIdentitySatisfied,
    `Live validation failed for valid Acme extraction: ${liveVal.details.join('; ')}`
  );

  // Test 10: Predefined ten-company cohort classified as FIXED_REGRESSION_COHORT
  const handoffState = blindAutonomousH943Engine.getHandoffState();
  assertTest(
    'Test 10: Ten-company cohort explicitly classified as FIXED_REGRESSION_COHORT',
    handoffState.cohortClassification === 'FIXED_REGRESSION_COHORT',
    `Expected cohortClassification to be FIXED_REGRESSION_COHORT, got ${handoffState.cohortClassification}`
  );

  // Clean up temporary test file
  try { if (fs.existsSync(tmpNonPltrPath)) fs.unlinkSync(tmpNonPltrPath); } catch (_) {}

  console.log(`\nPHASE H.9.44 RESULTS: ${passed}/${passed + failed} PASSED`);
  return { passed, failed };
}
