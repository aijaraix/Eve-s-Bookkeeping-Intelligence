/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — PACKAGE A2 BROWSER TRUTH TEST SUITE
 * 
 * Target: Document 35 Package A2 Verification
 * Enforces:
 * 1. Browser customer journey throws error when server upload response lacks intakeSessionId
 * 2. Browser customer journey throws error when server upload response lacks SHA-256
 * 3. Browser network observation specifically matches POST /api/documents/upload
 * 4. Simulator does not fall back to manufacturing mock/substitute verification proof
 * 5. Simulator uses existing #customer-intake-file-input element without injecting substitute DOM elements
 * 6. UploadModal does not render static 100% Valid claim
 * 7. UploadModal does not render static PASSED • FAIL-CLOSED claim
 * 8. UploadModal does not derive agent COMPLETED / VERIFIED from stage alone
 * 9. UploadModal does not render fabricated units (e.g. files * 5)
 * 10. PracticeContext initializes user session honestly (unauthenticated or neutral)
 * 11. PracticeContext initializes branding neutrally (no fake PCAOB license / predetermined unqualified opinion)
 * 12. PracticeContext does not seed swarmAgents with mock completed agents
 * 13. PracticeContext runSwarmPass does not simulate completion or check counts on failure
 */

import fs from 'fs';
import path from 'path';
import { RealBrowserCustomerSimulatorEngine } from '../cpaOrganization/realBrowserCustomerSimulatorEngine.js';

export async function runPhasePackageA2BrowserTruthTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n===============================================================');
  console.log('RUNNING PACKAGE A2 BROWSER TRUTH & UI VERIFICATION TEST SUITE');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

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

  // Test 1: Browser customer journey throws error when server upload response lacks intakeSessionId
  try {
    let threw = false;
    try {
      simulator.validateUploadAcknowledgement({
        success: true,
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        // intakeSessionId missing
      });
    } catch (err: any) {
      threw = err.message.includes('intakeSessionId');
    }
    assertTest(
      'Test 1: Fails closed when upload response lacks intakeSessionId',
      threw,
      'Expected validateUploadAcknowledgement to throw error on missing intakeSessionId'
    );
  } catch (err: any) {
    assertTest('Test 1: Fails closed when upload response lacks intakeSessionId', false, err.message);
  }

  // Test 2: Browser customer journey throws error when server upload response lacks SHA-256
  try {
    let threw = false;
    try {
      simulator.validateUploadAcknowledgement({
        success: true,
        intakeSessionId: 'session-cpa-test-123'
        // sha256 missing
      });
    } catch (err: any) {
      threw = err.message.includes('SHA256');
    }
    assertTest(
      'Test 2: Fails closed when upload response lacks SHA-256',
      threw,
      'Expected validateUploadAcknowledgement to throw error on missing SHA-256'
    );
  } catch (err: any) {
    assertTest('Test 2: Fails closed when upload response lacks SHA-256', false, err.message);
  }

  // Test 3: Browser network observation specifically matches POST /api/documents/upload
  {
    const matchesEndpoint =
      simulatorSource.includes("url.includes('/api/documents/upload')") &&
      simulatorSource.includes("req.method() === 'POST'");
    assertTest(
      'Test 3: Network observation specifically matches POST /api/documents/upload',
      matchesEndpoint,
      'Simulator must explicitly filter for POST requests to /api/documents/upload'
    );
  }

  // Test 4: Simulator does not fall back to manufacturing mock/substitute verification proof
  {
    const noMockFallback =
      !simulatorSource.includes('mockUploadResult') &&
      !simulatorSource.includes('fallbackSha') &&
      !simulatorSource.includes('proofLevel: \'SYNTHETIC\'') &&
      simulatorSource.includes('validateUploadAcknowledgement');
    assertTest(
      'Test 4: Simulator does not manufacture mock/substitute verification proof',
      noMockFallback,
      'Simulator must strictly fail closed without fallback mocks'
    );
  }

  // Test 5: Simulator uses existing #customer-intake-file-input element without injecting substitute DOM elements
  {
    const usesRealInput =
      simulatorSource.includes('#customer-intake-file-input') &&
      !simulatorSource.includes('document.createElement(\'input\')') &&
      simulatorSource.includes('Creation of substitute input is strictly prohibited');
    assertTest(
      'Test 5: Simulator uses existing #customer-intake-file-input without substitute injection',
      usesRealInput,
      'Simulator must throw when #customer-intake-file-input is absent, never injecting replacement elements'
    );
  }

  // Test 6: UploadModal does not render static 100% Valid claim
  {
    const noStatic100Valid =
      !uploadModalSource.includes('100% Valid') &&
      uploadModalSource.includes('balanceIntegrity');
    assertTest(
      'Test 6: UploadModal does not render static 100% Valid claim',
      noStatic100Valid,
      'UploadModal must not hardcode "100% Valid"; it must render authentic clearance or pending review'
    );
  }

  // Test 7: UploadModal does not render static PASSED • FAIL-CLOSED claim
  {
    const noStaticPassedFailClosed =
      !uploadModalSource.includes('PASSED • FAIL-CLOSED') &&
      uploadModalSource.includes('gateStatus');
    assertTest(
      'Test 7: UploadModal does not render static PASSED • FAIL-CLOSED claim',
      noStaticPassedFailClosed,
      'UploadModal must not hardcode "PASSED • FAIL-CLOSED"; it must render authentic gate status'
    );
  }

  // Test 8: UploadModal does not derive agent COMPLETED / VERIFIED from stage alone
  {
    const noStageInference =
      !uploadModalSource.includes("stageIndex >= 2 ? (stageIndex >= 4 ? 'COMPLETED'") &&
      !uploadModalSource.includes("stageIndex >= 3 ? (stageIndex >= 5 ? 'COMPLETED'") &&
      uploadModalSource.includes('getAgentStatus');
    assertTest(
      'Test 8: UploadModal does not derive agent COMPLETED / VERIFIED from stage alone',
      noStageInference,
      'UploadModal must determine agent status from backend job agents, not stageIndex ternary'
    );
  }

  // Test 9: UploadModal does not render fabricated units (e.g. files * 5)
  {
    const noFabricatedUnits =
      !uploadModalSource.includes('selectedFiles.length * 5') &&
      !uploadModalSource.includes('Math.max(1, stageIndex + 1)');
    assertTest(
      'Test 9: UploadModal does not render fabricated units (files * 5)',
      noFabricatedUnits,
      'UploadModal must not multiply selectedFiles.length by 5 or infer completed units from stage'
    );
  }

  // Test 10: PracticeContext initializes user session honestly (unauthenticated or neutral)
  {
    const neutralSession =
      practiceContextSource.includes('isAuthenticated: false') &&
      !practiceContextSource.includes('email: \'stevestein4454@gmail.com\'') &&
      !practiceContextSource.includes('name: \'Steve Stein, CPA\'');
    assertTest(
      'Test 10: PracticeContext initializes user session honestly (unauthenticated)',
      neutralSession,
      'PracticeContext default session must be unauthenticated, without fake partner identity'
    );
  }

  // Test 11: PracticeContext initializes branding neutrally (no fake PCAOB license / predetermined unqualified opinion)
  {
    const neutralBranding =
      !practiceContextSource.includes('CPA-PCAOB-982410') &&
      !practiceContextSource.includes('Unqualified / Clean Opinion') &&
      practiceContextSource.includes('Pending Review');
    assertTest(
      'Test 11: PracticeContext initializes branding neutrally without fake PCAOB license',
      neutralBranding,
      'PracticeContext branding must not include fake PCAOB credentials or predetermined clean opinion'
    );
  }

  // Test 12: PracticeContext does not seed swarmAgents with mock completed agents
  {
    const unexecutedAgents =
      practiceContextSource.includes('initialSwarmAgents') &&
      !practiceContextSource.includes('useState<SwarmAgentStatus[]>(mockSwarmAgents)');
    assertTest(
      'Test 12: PracticeContext does not seed swarmAgents with mock completed agents',
      unexecutedAgents,
      'PracticeContext must initialize swarmAgents with idle, unexecuted records'
    );
  }

  // Test 13: PracticeContext runSwarmPass does not simulate completion or check counts on failure
  {
    const failClosedSwarm =
      !practiceContextSource.includes('checksCount + Math.floor(Math.random()') &&
      practiceContextSource.includes('Execution failed / Unverified');
    assertTest(
      'Test 13: PracticeContext runSwarmPass does not simulate completion on failure',
      failClosedSwarm,
      'runSwarmPass must not fabricate check counts with Math.random() or set completed status on failure'
    );
  }

  console.log(`\nPACKAGE A2 SUITE COMPLETE: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}

if (process.argv[1]?.includes('phasePackageA2BrowserTruth.test')) {
  runPhasePackageA2BrowserTruthTests().then(({ failed }) => {
    if (failed > 0) {
      process.exit(1);
    }
  });
}
