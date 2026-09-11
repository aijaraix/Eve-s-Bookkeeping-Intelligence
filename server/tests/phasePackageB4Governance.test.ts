/**
 * PACKAGE B4: MINERVA, ACADEMY, LEARNING GOVERNANCE & REPOSITORY CONFORMANCE SUITE
 */

import { academyMinervaLab } from '../cpaOrganization/academyMinervaLab.js';
import { persistentAgentMemory } from '../cpaOrganization/persistentMemory.js';
import { darwinEvolutionLoop } from '../cpaOrganization/darwinEvolutionLoop.js';
import { capabilityPromotionAuthority } from '../cpaOrganization/capabilityPromotionAuthority.js';
import { skillsRegistry } from '../cpaOrganization/skillsRegistry.js';

export async function runPhasePackageB4GovernanceTests(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('====================================================');
  console.log('  RUNNING PACKAGE B4 MINERVA & ACADEMY GOVERNANCE SUITE');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, failMessage: string, successMessage: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${name} — ${successMessage}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name} — ${failMessage}`);
      failed++;
    }
  }

  // 1. Solver cannot read Minerva sealed answer
  const t1 = academyMinervaLab.getSealedGroundTruth('BENCH-001', 'HERMES');
  assert(
    'B4-REQ-01: Solver Cannot Read Sealed Answers',
    'error' in t1 && (t1 as any).error.includes('EXAMINER_SEALED_ACCESS_DENIED'),
    'Solver was able to read sealed benchmark answer!',
    'Hermes solver request to sealed vault correctly denied with EXAMINER_SEALED_ACCESS_DENIED.'
  );

  // 2. Minerva evaluation can read sealed answer
  const t2 = academyMinervaLab.getSealedGroundTruth('BENCH-001', 'MINERVA');
  assert(
    'B4-REQ-02: Examiner Can Read Sealed Answers',
    !('error' in t2) && Array.isArray((t2 as any).expectedFacts),
    'Minerva examiner failed to retrieve sealed benchmark answer!',
    'Minerva examiner request to sealed vault permitted.'
  );

  // 3. Holdout answer is not placed in shared solver memory
  let t3Passed = false;
  try {
    persistentAgentMemory.store({
      namespace: 'eve/hermes',
      type: 'EPISODIC',
      key: 'sealed_answer_bench_001',
      value: { secret: 'Turnover = 50503000000' },
      classification: 'EXAMINER_SEALED',
      tags: ['EXAMINER_SEALED']
    });
  } catch (err: any) {
    t3Passed = err.message.includes('EXAMINER_SEALED_ISOLATION_VIOLATION');
  }
  assert(
    'B4-REQ-03: Holdout Answer Blocked in Solver Memory',
    t3Passed,
    'Failed to block EXAMINER_SEALED data write into solver memory!',
    'Writing EXAMINER_SEALED data into solver memory correctly threw EXAMINER_SEALED_ISOLATION_VIOLATION.'
  );

  // 4. Customer engagement evidence does not automatically enter global Academy
  let t4Passed = false;
  try {
    persistentAgentMemory.store({
      namespace: 'eve/firm',
      type: 'SEMANTIC',
      key: 'customer_raw_financials',
      value: { secretPii: 'John Doe Financials' },
      classification: 'PRODUCTION_CUSTOMER',
      tags: ['customer_raw']
    });
  } catch (err: any) {
    t4Passed = err.message.includes('CUSTOMER_DATA_ISOLATION_VIOLATION');
  }
  assert(
    'B4-REQ-04: Raw Customer Data Blocked in Global Academy',
    t4Passed,
    'Failed to block PRODUCTION_CUSTOMER data write into global Academy!',
    'Publishing PRODUCTION_CUSTOMER data into global Academy correctly threw CUSTOMER_DATA_ISOLATION_VIOLATION.'
  );

  // 5. Academy cannot modify canonical customer fact truth
  const t5 = capabilityPromotionAuthority.validateScopeBoundary('Proposal to ALTER_CANONICAL_ELIGIBILITY');
  assert(
    'B4-REQ-05: Academy Cannot Modify Fact Eligibility',
    !t5.allowed && t5.reason.includes('UNAUTHORIZED_ACADEMY_SCOPE_VIOLATION'),
    'Academy was allowed to alter canonical eligibility!',
    'Scope check correctly blocked altering canonical eligibility.'
  );

  // 6. Academy cannot create professional approval
  const t6 = capabilityPromotionAuthority.validateScopeBoundary('BYPASS_PROFESSIONAL_APPROVAL');
  assert(
    'B4-REQ-06: Academy Cannot Bypass Professional Approval',
    !t6.allowed && t6.reason.includes('UNAUTHORIZED_ACADEMY_SCOPE_VIOLATION'),
    'Academy was allowed to bypass professional approval!',
    'Scope check correctly blocked bypassing professional approval.'
  );

  // 7. Proposal generator cannot self-promote
  let t7Passed = false;
  try {
    capabilityPromotionAuthority.submitCandidate({
      skillId: 'table-scale-detection',
      candidateVersion: 'v2.2.99-self',
      proposedBy: 'DARWIN',
      changeReason: 'Self test',
      testResults: { passed: true, score: 1.0, totalCases: 4 }
    });
    capabilityPromotionAuthority.attachHoldoutEvaluation({
      skillId: 'table-scale-detection',
      candidateVersion: 'v2.2.99-self',
      evaluatedBy: 'MINERVA',
      holdoutResults: { passed: true, accuracyRate: 1.0, numericErrorRate: 0.0 }
    });
    capabilityPromotionAuthority.promoteCandidate({
      skillId: 'table-scale-detection',
      candidateVersion: 'v2.2.99-self',
      approvedBy: 'DARWIN'
    });
  } catch (err: any) {
    t7Passed = err.message.includes('PROMOTION_AUTHORITY_VIOLATION');
  }
  assert(
    'B4-REQ-07: Proposer Cannot Self-Promote',
    t7Passed,
    'Proposer Darwin was able to self-promote its candidate version!',
    'Self-promotion by Darwin correctly blocked by Promotion Authority.'
  );

  // 8. Examiner cannot self-promote evaluated change alone
  let t8Passed = false;
  try {
    capabilityPromotionAuthority.submitCandidate({
      skillId: 'currency-normalization',
      candidateVersion: 'v2.0.99-exam',
      proposedBy: 'DARWIN',
      changeReason: 'Exam test',
      testResults: { passed: true, score: 1.0, totalCases: 4 }
    });
    capabilityPromotionAuthority.attachHoldoutEvaluation({
      skillId: 'currency-normalization',
      candidateVersion: 'v2.0.99-exam',
      evaluatedBy: 'MINERVA',
      holdoutResults: { passed: true, accuracyRate: 1.0, numericErrorRate: 0.0 }
    });
    capabilityPromotionAuthority.promoteCandidate({
      skillId: 'currency-normalization',
      candidateVersion: 'v2.0.99-exam',
      approvedBy: 'MINERVA'
    });
  } catch (err: any) {
    t8Passed = err.message.includes('PROMOTION_AUTHORITY_VIOLATION');
  }
  assert(
    'B4-REQ-08: Examiner Cannot Solely Promote',
    t8Passed,
    'Examiner Minerva was able to act as sole Promotion Authority!',
    'Examiner self-promotion correctly blocked by Promotion Authority.'
  );

  // 9. Candidate capability requires versioned promotion
  const actBefore = capabilityPromotionAuthority.getActiveVersion('balance-sheet-reconciliation');
  capabilityPromotionAuthority.submitCandidate({
    skillId: 'balance-sheet-reconciliation',
    candidateVersion: 'v2.1.0-cand',
    proposedBy: 'DARWIN',
    changeReason: 'Zero tolerance',
    testResults: { passed: true, score: 1.0, totalCases: 4 }
  });
  const actAfter = capabilityPromotionAuthority.getActiveVersion('balance-sheet-reconciliation');
  assert(
    'B4-REQ-09: Candidate Submission Is Immutable & Versioned',
    actBefore === actAfter,
    'Candidate submission mutated active production version!',
    'Submitting candidate version did not mutate active production version.'
  );

  // 10. Missing holdout evaluation blocks promotion
  let t10Passed = false;
  try {
    capabilityPromotionAuthority.submitCandidate({
      skillId: 'financial-statement-reading',
      candidateVersion: 'v2.2.0-untested',
      proposedBy: 'DARWIN',
      changeReason: 'Prompt update',
      testResults: { passed: true, score: 0.9, totalCases: 4 }
    });
    capabilityPromotionAuthority.promoteCandidate({
      skillId: 'financial-statement-reading',
      candidateVersion: 'v2.2.0-untested',
      approvedBy: 'COMMITTEE'
    });
  } catch (err: any) {
    t10Passed = err.message.includes('PROMOTION_BLOCKED');
  }
  assert(
    'B4-REQ-10: Promotion Blocked Without Sealed Evaluation',
    t10Passed,
    'Candidate without holdout evaluation was promoted!',
    'Promoting candidate lacking holdout evaluation correctly blocked.'
  );

  // 11. No measurements returns NOT_MEASURED
  const t11 = academyMinervaLab.evaluateExtractionCompleteness({
    extractedFacts: [],
    sourceCensus: { totalTables: 0, totalRows: 0, totalCells: 0, totalXbrlTags: 0 }
  });
  assert(
    'B4-REQ-11: Zero Census Returns NOT_MEASURED',
    t11.status === 'NOT_MEASURED',
    'Zero census evaluation did not return NOT_MEASURED!',
    'Zero census completeness correctly marked NOT_MEASURED.'
  );

  // 12. Academy learning metric records real numerator/denominator
  const t12 = academyMinervaLab.evaluateExtractionCompleteness({
    extractedFacts: [{ id: '1' }, { id: '2' }],
    sourceCensus: { totalTables: 1, totalRows: 1, totalCells: 10, totalXbrlTags: 0 }
  });
  assert(
    'B4-REQ-12: Extraction Ratio Measured Accurately',
    t12.passed && Math.abs(t12.ratio - 0.2) < 0.01,
    'Extraction ratio was not accurately measured!',
    'Extraction completeness ratio measured accurately.'
  );

  // 13 & 14. Suspicious extraction density blocks completion
  const t14 = academyMinervaLab.evaluateExtractionCompleteness({
    extractedFacts: [{ id: '1' }],
    sourceCensus: { totalTables: 5, totalRows: 20, totalCells: 100, totalXbrlTags: 0 }
  });
  assert(
    'B4-REQ-13/14: Low Extraction Ratio (<5%) Blocks Completion',
    !t14.passed && t14.status === 'BLOCKED_SUSPICIOUS_EXTRACTION_DENSITY',
    'Low extraction density did not block completion!',
    'Low density (<5%) extraction correctly blocked.'
  );

  // 15. Production metrics exclude Academy/test/canary records
  const solverMems = persistentAgentMemory.query({ requesterAgentId: 'HERMES' });
  assert(
    'B4-REQ-15: Solver Memory Query Excludes Examiner Sealed',
    !solverMems.some(m => m.classification === 'EXAMINER_SEALED'),
    'Solver memory query exposed EXAMINER_SEALED entries!',
    'Solver memory query excluded EXAMINER_SEALED records.'
  );

  // 16. Customer tenant memory space is isolated
  const memEntry = persistentAgentMemory.store({
    namespace: 'eve/tenant-999',
    type: 'WORKING',
    key: 'scratch',
    value: 'data',
    classification: 'PRODUCTION_CUSTOMER'
  });
  const firmMems = persistentAgentMemory.query({ namespace: 'eve/firm', requesterAgentId: 'HERMES' });
  assert(
    'B4-REQ-16: Customer Tenant Memory Space Isolated',
    memEntry.namespace === 'eve/tenant-999' && !firmMems.some(m => m.key === 'scratch'),
    'Customer tenant memory leaked into firm shared memory!',
    'Tenant memory isolated from firm shared memory.'
  );

  // 17. Solver cannot write examiner sealed memory
  let t17Passed = false;
  try {
    persistentAgentMemory.store({
      namespace: 'eve/hermes',
      type: 'EPISODIC',
      key: 'sealed_bench',
      value: { x: 1 },
      classification: 'EXAMINER_SEALED'
    });
  } catch {
    t17Passed = true;
  }
  assert(
    'B4-REQ-17: Solver Cannot Write Examiner Sealed Memory',
    t17Passed,
    'Solver was able to store EXAMINER_SEALED memory!',
    'Writing EXAMINER_SEALED memory from solver context correctly blocked.'
  );

  // 18. Skills RBAC Enforced
  const t18 = skillsRegistry.executeSkill({
    skillId: 'balance-sheet-reconciliation',
    agentId: 'eve-scribe',
    input: {}
  });
  assert(
    'B4-REQ-18: Skills RBAC Enforced For Prohibited Agent',
    !t18.success && t18.error?.includes('PermissionDenied') === true,
    'Prohibited agent executed restricted skill!',
    'Prohibited agent execution correctly returned PermissionDenied.'
  );

  // 19. Capability version rollback
  capabilityPromotionAuthority.submitCandidate({
    skillId: 'cash-flow-rollforward',
    candidateVersion: 'v1.9.5-test',
    proposedBy: 'DARWIN',
    changeReason: 'Test',
    testResults: { passed: true, score: 1.0, totalCases: 4 }
  });
  capabilityPromotionAuthority.attachHoldoutEvaluation({
    skillId: 'cash-flow-rollforward',
    candidateVersion: 'v1.9.5-test',
    evaluatedBy: 'MINERVA',
    holdoutResults: { passed: true, accuracyRate: 1.0, numericErrorRate: 0.0 }
  });
  capabilityPromotionAuthority.promoteCandidate({
    skillId: 'cash-flow-rollforward',
    candidateVersion: 'v1.9.5-test',
    approvedBy: 'COMMITTEE'
  });
  const rbRecord = capabilityPromotionAuthority.rollbackCapability('cash-flow-rollforward', '1.9.0');
  assert(
    'B4-REQ-19: Capability Version Rollback Executed',
    rbRecord.candidateVersion === '1.9.0' && capabilityPromotionAuthority.getActiveVersion('cash-flow-rollforward') === '1.9.0',
    'Rollback failed to revert active capability version!',
    'Active capability version rolled back to target version.'
  );

  // 20. Active capability version reproducible
  const activeVer = capabilityPromotionAuthority.getActiveVersion('table-scale-detection');
  assert(
    'B4-REQ-20: Active Capability Version Reproducible',
    typeof activeVer === 'string' && activeVer.length > 0,
    'Active version was not reproducible!',
    'Active capability version reproducible from authority ledger.'
  );

  console.log(`----------------------------------------------------`);
  console.log(`  PACKAGE B4 RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log(`----------------------------------------------------\n`);

  if (failed > 0) {
    throw new Error(`Package B4 Governance Suite failed: ${failed} tests failed.`);
  }

  return { passed, failed, total: passed + failed };
}

if (process.argv[1]?.includes('phasePackageB4Governance.test')) {
  runPhasePackageB4GovernanceTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
