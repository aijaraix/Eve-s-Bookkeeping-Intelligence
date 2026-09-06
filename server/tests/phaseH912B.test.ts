/**
 * PHASE H.9.12B — EVE AUTONOMOUS CPA ORGANIZATION REGRESSION TEST SUITE
 * 
 * Tests the full Eve Autonomous CPA Organization:
 * 1. 13 Named CPA Agents (Full profiles, charters, competency matrices)
 * 2. Least-Privilege Tool RBAC & Deterministic Authority Enforcement
 * 3. 5-Layer Persistent Hierarchical Agent Memory Store
 * 4. Dynamic Swarm Formations & Temporary Specialist Spawning
 * 5. 5-Tier Model Router (Levels 0–4) & Deterministic Task Routing
 * 6. Two-Sided Minerva Academy & Evaluation Lab (0.000 Numeric Error Rate)
 * 7. Sealed Benchmark Corpus Protection (Unilever Continuing Operations €50.503B)
 * 8. Darwin Evolution Loop (Automated root-cause, proposal, sandbox benchmark)
 * 9. Hermes Heartbeat & Customer Priority Preemption
 * 10. Certified 12-Skill Execution Engine (Balance sheet, cash flow, scale, FX)
 */

import { cpaAgentRegistry } from '../cpaOrganization/cpaAgentRegistry.js';
import { skillsRegistry } from '../cpaOrganization/skillsRegistry.js';
import { persistentAgentMemory } from '../cpaOrganization/persistentMemory.js';
import { cpaModelRouter } from '../cpaOrganization/cpaModelRouter.js';
import { academyMinervaLab } from '../cpaOrganization/academyMinervaLab.js';
import { darwinEvolutionLoop } from '../cpaOrganization/darwinEvolutionLoop.js';
import { hermesHeartbeat } from '../cpaOrganization/hermesHeartbeat.js';
import { LocalIntelligenceClient } from '../localIntelligenceClient.js';

export async function runPhaseH912BTests(): Promise<{ total: number; passed: number; failures: string[] }> {
  const failures: string[] = [];
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] ${testName}`);
    } else {
      const msg = `${testName} - ${detail || 'Assertion failed'}`;
      failures.push(msg);
      console.error(`  [FAIL] ${msg}`);
    }
  }

  console.log('\n===============================================================');
  console.log('RUNNING PHASE H.9.12B EVE AUTONOMOUS CPA ORGANIZATION SUITE');
  console.log('===============================================================\n');

  // Test 1: 13 Named CPA Agents Initialization & Profile Integrity
  try {
    const agents = cpaAgentRegistry.getAllAgents();
    const expectedAgentIds = [
      'eve-hermes',
      'eve-athena',
      'eve-ledger',
      'eve-atlas',
      'eve-mercury',
      'eve-euclid',
      'eve-veritas',
      'eve-argus',
      'eve-scribe',
      'eve-lexicon',
      'eve-sentinel',
      'eve-darwin',
      'eve-minerva'
    ];

    const hasAllAgents = expectedAgentIds.every((id) => agents.some((a) => a.agentId === id));
    const allHaveCharters = agents.every((a) => a.charter && a.charter.length > 0);
    const allHaveCompetencies = agents.every((a) => a.competencyScores && Object.keys(a.competencyScores).length >= 8);

    assert(
      agents.length >= 13 && hasAllAgents && allHaveCharters && allHaveCompetencies,
      'Test 1: 13 Named CPA Agents initialized with full charters & 8-dimension competency scores',
      `Found ${agents.length} agents, allExpected=${hasAllAgents}`
    );
  } catch (e: any) {
    assert(false, 'Test 1: 13 Named CPA Agents', e.message);
  }

  // Test 2: Role-Based Access Control (RBAC) & Least Privilege
  try {
    // SCRIBE should NOT have ledger mutation or forensic manipulation
    const scribePerm = skillsRegistry.verifyAgentPermission('eve-scribe', 'balance-sheet-reconciliation');
    // EUCLID MUST have balance sheet reconciliation
    const euclidPerm = skillsRegistry.verifyAgentPermission('eve-euclid', 'balance-sheet-reconciliation');
    // ARGUS should NOT have balance sheet reconciliation mutation
    const argusProhibited = !skillsRegistry.verifyAgentPermission('eve-argus', 'balance-sheet-reconciliation');

    assert(
      scribePerm === false && euclidPerm === true && argusProhibited === true,
      'Test 2: Strict RBAC correctly enforces skill authorizations and prohibitions',
      `euclid=${euclidPerm}, scribe=${scribePerm}, argusProhibited=${argusProhibited}`
    );
  } catch (e: any) {
    assert(false, 'Test 2: RBAC enforcement', e.message);
  }

  // Test 3: Deterministic Authority Guard Enforcement
  try {
    let violationCaught = false;
    try {
      LocalIntelligenceClient.assertDeterministicAuthority('financial_normalization');
    } catch (err: any) {
      if (err.message.includes('DeterministicAuthorityViolation')) {
        violationCaught = true;
      }
    }

    assert(
      violationCaught === true,
      'Test 3: Local Qwen deterministic authority guard throws on financial_normalization',
      `violationCaught=${violationCaught}`
    );
  } catch (e: any) {
    assert(false, 'Test 3: Deterministic authority guard', e.message);
  }

  // Test 4: Persistent Hierarchical Memory Read/Write & Seeding
  try {
    // Query firm-shared memory
    const firmMem = persistentAgentMemory.query({ namespace: 'eve/firm', tag: 'unilever' });
    const hasUnileverFixture = firmMem.some(
      (m) => m.value?.turnoverContinuingEUR === 50503000000 || m.value?.turnoverContinuing === '€50,503m'
    );

    // Store episodic memory
    const stored = persistentAgentMemory.store({
      namespace: 'eve/euclid',
      type: 'EPISODIC',
      key: 'test_tie_out_case',
      value: { testRun: true, status: 'PASSED' },
      tags: ['test', 'regression'],
      confidence: 1.0
    });

    const retrieved = persistentAgentMemory.retrieve('eve/euclid', 'test_tie_out_case');

    assert(
      hasUnileverFixture && retrieved !== null && retrieved.value?.status === 'PASSED',
      'Test 4: Persistent memory stores, seeds firm standard, and retrieves episodic entry',
      `hasUnilever=${hasUnileverFixture}, retrieved=${!!retrieved}`
    );
  } catch (e: any) {
    assert(false, 'Test 4: Persistent memory store', e.message);
  }

  // Test 5: Dynamic Swarm Assembly & Temporary Specialist Spawning
  try {
    const swarms = cpaAgentRegistry.getAllSwarms();
    const basicAuditSwarm = cpaAgentRegistry.getSwarm('swarm-basic-audit');

    // Spawn ad-hoc specialist
    const specialist = cpaAgentRegistry.spawnTemporarySpecialist({
      topic: 'IFRS_16_LEASES',
      customTitle: 'IFRS 16 Lease Specialist',
      targetWorkspaceId: 'ws-test'
    });

    // Dispatch swarm execution
    const dispatchResult = cpaAgentRegistry.dispatchSwarm({
      swarmId: 'swarm-basic-audit',
      workspaceId: 'ws-test',
      workspaceFacts: [{ metric: 'Turnover', val: 50503000000 }]
    });

    assert(
      swarms.length >= 4 &&
      basicAuditSwarm !== undefined &&
      specialist.role === 'AD_HOC_SPECIALIST' &&
      dispatchResult.success === true &&
      dispatchResult.reconciled === true,
      'Test 5: Dynamic Swarm dispatch executes multi-agent DAG and spawns temporary specialists',
      `swarms=${swarms.length}, specialist=${specialist.name}, dispatchSuccess=${dispatchResult.success}`
    );
  } catch (e: any) {
    assert(false, 'Test 5: Swarm assembly & specialist spawn', e.message);
  }

  // Test 6: 5-Tier Model Router (Level 0 Deterministic vs Level 1 Local Qwen)
  try {
    const deterministicRoute = cpaModelRouter.routeTask({
      taskId: 't-1',
      taskType: 'EQUATION_TIE_OUT'
    });

    const localQwenRoute = cpaModelRouter.routeTask({
      taskId: 't-2',
      taskType: 'TABLE_CLASSIFICATION'
    });

    const cloudRoute = cpaModelRouter.routeTask({
      taskId: 't-3',
      taskType: 'COMPLEX_POLICY_ANALYSIS'
    });

    const telemetry = cpaModelRouter.getTelemetry();

    assert(
      deterministicRoute.selectedTier === 'LEVEL_0_DETERMINISTIC' &&
      deterministicRoute.estimatedCostUsd === 0.0 &&
      localQwenRoute.selectedTier === 'LEVEL_1_LOCAL_QWEN' &&
      cloudRoute.selectedTier === 'LEVEL_3_HEAVY_CLOUD' &&
      telemetry.totalDecisions > 0,
      'Test 6: 5-Tier Model Router routes math to Level 0 ($0), categorization to Level 1, policy to Level 3',
      `det=${deterministicRoute.selectedTier}, qwen=${localQwenRoute.selectedTier}, cloud=${cloudRoute.selectedTier}`
    );
  } catch (e: any) {
    assert(false, 'Test 6: Model router evaluation', e.message);
  }

  // Test 7: Two-Sided Minerva Academy & Evaluation Lab
  try {
    const evalReport = academyMinervaLab.runEvaluation();
    const history = academyMinervaLab.getEvaluationHistory();
    const benchmarks = academyMinervaLab.getSealedCorpusSummary();

    assert(
      evalReport.certifiedStatus === 'CERTIFIED_CPA_READY' &&
      evalReport.numericErrorRate === 0.0 &&
      evalReport.passed >= 4 &&
      evalReport.failed === 0 &&
      history.length > 0 &&
      benchmarks.length >= 2,
      'Test 7: Minerva Academy evaluation verifies sealed benchmarks with 0.000 numeric error rate',
      `status=${evalReport.certifiedStatus}, passed=${evalReport.passed}, errorRate=${evalReport.numericErrorRate}, benchmarks=${benchmarks.length}`
    );
  } catch (e: any) {
    assert(false, 'Test 7: Minerva Academy lab', e.message);
  }

  // Test 8: Sealed Benchmark Protection (Unilever Continuing Operations €50.503B)
  try {
    const bench = academyMinervaLab.getBenchmarkById('BENCH-001');
    const turnoverFact = bench?.groundTruth.expectedFacts.find((f) => f.canonicalName.includes('Turnover'));

    assert(
      bench !== undefined &&
      bench.title.includes('Unilever') &&
      turnoverFact?.value === '50503000000' &&
      bench.groundTruth.prohibitedHallucinations.includes('59600000000'),
      'Test 8: Sealed benchmark corpus enforces Unilever Continuing Turnover €50.503B and strictly prohibits €59.60B',
      `found=${!!bench}, expected=${turnoverFact?.value}`
    );
  } catch (e: any) {
    assert(false, 'Test 8: Sealed benchmark protection', e.message);
  }

  // Test 9: Darwin Evolution Loop (Defect Analysis & Sandbox Benchmark Gating)
  try {
    const proposal = darwinEvolutionLoop.analyzeDefectAndPropose({
      sourceDefect: 'Currency symbol £ recognized as € due to faint top crossbar',
      affectedSkillId: 'currency-normalization',
      rootCauseAnalysis: 'OCR confidence on single character was low without entity check',
      proposedEnhancement: 'Incorporate Companies House corporate jurisdiction check'
    });

    const proposals = darwinEvolutionLoop.getAllProposals();

    assert(
      proposal.status === 'PROMOTED_TO_PRODUCTION' &&
      proposal.benchmarkValidationResult.passed === true &&
      proposal.benchmarkValidationResult.regressionDetected === false &&
      proposals.length >= 2,
      'Test 9: Darwin Evolution Loop diagnoses root cause and gates promotion via sealed Minerva benchmark',
      `status=${proposal.status}, regressionDetected=${proposal.benchmarkValidationResult.regressionDetected}`
    );
  } catch (e: any) {
    assert(false, 'Test 9: Darwin Evolution Loop', e.message);
  }

  // Test 10: Certified Skill Execution Engine (Deterministic Math & RBAC)
  try {
    // 1. Balance sheet tie-out (Assets 100 == Liabilities 60 + Equity 40)
    const tieOutSuccess = skillsRegistry.executeSkill({
      skillId: 'balance-sheet-reconciliation',
      agentId: 'eve-euclid',
      input: { assets: 100, liabilities: 60, equity: 40 }
    });

    // 2. Prohibited agent execution (Scribe cannot execute balance sheet reconciliation)
    const rbacBlocked = skillsRegistry.executeSkill({
      skillId: 'balance-sheet-reconciliation',
      agentId: 'eve-scribe',
      input: { assets: 100, liabilities: 60, equity: 40 }
    });

    // 3. Cash flow roll-forward
    const cfSuccess = skillsRegistry.executeSkill({
      skillId: 'cash-flow-rollforward',
      agentId: 'eve-ledger',
      input: { beginningCash: 50, operating: 30, investing: -10, financing: -10, endingCash: 60 }
    });

    // 4. Scale detection
    const scaleSuccess = skillsRegistry.executeSkill({
      skillId: 'table-scale-detection',
      agentId: 'eve-ledger',
      input: { tableHeaders: ['Consolidated Balance Sheet', '(in € millions)'] }
    });

    assert(
      tieOutSuccess.success === true &&
      tieOutSuccess.output?.balanced === true &&
      rbacBlocked.success === false &&
      rbacBlocked.error?.includes('PermissionDenied') &&
      cfSuccess.output?.reconciled === true &&
      scaleSuccess.output?.scaleFactor === 1_000_000,
      'Test 10: Certified skill execution engine validates deterministic math and blocks unauthorized roles',
      `tieOut=${tieOutSuccess.output?.balanced}, rbacBlocked=${!rbacBlocked.success}, scale=${scaleSuccess.output?.scaleFactor}`
    );
  } catch (e: any) {
    assert(false, 'Test 10: Certified skill execution engine', e.message);
  }

  // Test 11: Hermes Heartbeat & Priority Queue Preemption
  try {
    hermesHeartbeat.registerCustomerJob('job-priority-1');
    const statusBefore = await hermesHeartbeat.getStatus();
    const hasJob = statusBefore.customerPriorityQueue.pendingJobs > 0;
    
    hermesHeartbeat.completeCustomerJob('job-priority-1');
    const statusAfter = await hermesHeartbeat.getStatus();
    const jobCleared = statusAfter.customerPriorityQueue.pendingJobs === 0;

    assert(
      hasJob && jobCleared && statusAfter.systemResourceHealth.status === 'OPTIMAL',
      'Test 11: Hermes Heartbeat manages customer priority queue preemption and resource telemetry',
      `hasJob=${hasJob}, jobCleared=${jobCleared}, health=${statusAfter.systemResourceHealth.status}`
    );
  } catch (e: any) {
    assert(false, 'Test 11: Hermes heartbeat', e.message);
  }

  console.log(`\nPHASE H.9.12B RESULTS: ${passed}/${total} PASSED\n`);
  return { total, passed, failures };
}
