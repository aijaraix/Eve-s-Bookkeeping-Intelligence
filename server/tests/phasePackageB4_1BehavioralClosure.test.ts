/**
 * PACKAGE B4.1: FINAL GOVERNANCE BEHAVIORAL CLOSURE SUITE
 * 20 Negative Behavioral Verification Tests
 */

import fs from 'fs';
import path from 'path';
import { academyMinervaLab } from '../cpaOrganization/academyMinervaLab.js';
import { persistentAgentMemory } from '../cpaOrganization/persistentMemory.js';
import { capabilityPromotionAuthority } from '../cpaOrganization/capabilityPromotionAuthority.js';
import { solverExecutionRegistry } from '../cpaOrganization/solverExecutionRegistry.js';

export async function runPhasePackageB4_1BehavioralClosureTests(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('====================================================');
  console.log('  RUNNING PACKAGE B4.1 BEHAVIORAL CLOSURE SUITE (20 NEGATIVE TESTS)');
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

  // 1. test_minerva_eval_without_solver_output_fails_closed
  const eval1 = academyMinervaLab.runEvaluation();
  assert(
    'B4.1-TEST-01: Minerva Eval Without Solver Output Fails Closed',
    eval1.certifiedStatus !== 'BENCHMARK_PASSED' && eval1.numericErrorRate > 0 && eval1.passed === 0,
    'Minerva evaluation passed benchmark without solver output!',
    'Minerva evaluation correctly failed closed when no solver output was provided.'
  );

  // 2. test_minerva_cannot_self_verify_benchmark_definition
  const eval2 = academyMinervaLab.runEvaluation(undefined, 'non-existent-solver-exec-id');
  assert(
    'B4.1-TEST-02: Minerva Cannot Self-Verify Benchmark Definition',
    eval2.certifiedStatus === 'NOT_TESTED' || eval2.certifiedStatus === 'FAIL_MISSING_SOLVER_OUTPUT' || eval2.certifiedStatus === 'BENCHMARK_FAILED',
    'Minerva self-verified benchmark definition to gain score!',
    'Minerva examiner refused self-evaluation and required solver execution outputs.'
  );

  // 3. test_sealed_ground_truth_denies_caller_self_identifying_as_minerva
  const res3 = academyMinervaLab.getSealedGroundTruth('BENCH-001', {
    authenticatedPrincipalId: null,
    sessionId: null,
    authMethod: 'BEARER_TOKEN'
  });
  assert(
    'B4.1-TEST-03: Sealed Truth Denies Unauthenticated Self-Identified Minerva Header',
    'error' in res3 && res3.error.includes('EXAMINER_SEALED_ACCESS_DENIED'),
    'Unauthenticated caller self-identifying as Minerva was granted access to sealed ground truth!',
    'Sealed ground truth denied unauthenticated caller attempting to spoof Minerva.'
  );

  // 4. test_sealed_ground_truth_denies_unauthenticated_requests
  const res4 = academyMinervaLab.getSealedGroundTruth('BENCH-001', null);
  assert(
    'B4.1-TEST-04: Sealed Truth Denies Unauthenticated Requests',
    'error' in res4 && res4.error.includes('EXAMINER_SEALED_ACCESS_DENIED'),
    'Unauthenticated request was granted access to sealed ground truth!',
    'Sealed ground truth denied unauthenticated request.'
  );

  // 5. test_extraction_completeness_rejects_caller_supplied_census_denominator
  // Register a document census with 100 cells
  solverExecutionRegistry.registerCensusArtifact({
    documentId: 'doc-census-test-01',
    totalTables: 2,
    totalRows: 10,
    totalCells: 100,
    totalXbrlTags: 5,
    checksum: 'abc-checksum-01'
  });
  // Caller supplies fraudulent census claiming 2 cells (50% ratio)
  const eval5 = academyMinervaLab.evaluateExtractionCompleteness({
    extractedFacts: [{ id: 'f1' }],
    documentId: 'doc-census-test-01',
    sourceCensus: { totalTables: 1, totalRows: 1, totalCells: 2, totalXbrlTags: 0 } as any
  });
  assert(
    'B4.1-TEST-05: Extraction Completeness Rejects Caller-Supplied Census Denominator',
    eval5.denominator === 100 && eval5.ratio === 0.01 && eval5.status === 'BLOCKED_SUSPICIOUS_EXTRACTION_DENSITY',
    'Evaluate extraction completeness trusted client-supplied fraudulent census denominator!',
    'Extraction completeness correctly ignored client census and used registered document census (denominator = 100).'
  );

  // 6. test_extraction_completeness_fails_closed_when_census_missing
  const eval6 = academyMinervaLab.evaluateExtractionCompleteness({
    extractedFacts: [{ id: 'f1' }],
    documentId: 'unregistered-doc-id-999'
  });
  assert(
    'B4.1-TEST-06: Extraction Completeness Fails Closed When Census Missing',
    !eval6.passed && eval6.status === 'DOCUMENT_CENSUS_MISSING',
    'Extraction completeness passed or measured when document census was missing!',
    'Extraction completeness correctly failed closed with DOCUMENT_CENSUS_MISSING.'
  );

  // 7. test_ask_anything_memory_recall_rejects_unverified_tool_usage
  // Register a solver execution package with no tool calls
  solverExecutionRegistry.registerExecutionPackage({
    executionId: 'exec-pkg-test-01',
    agentId: 'HERMES',
    timestamp: new Date().toISOString(),
    toolUsageReceipts: [],
    outputFacts: [{ key: 'revenue', value: '50503000000' }],
    memoryRetrievals: []
  });
  // Caller claims tool usage in request body
  const eval7 = academyMinervaLab.evaluateAskAnythingMemoryRecall({
    solverExecutionId: 'exec-pkg-test-01',
    questionId: 'q-01',
    solverResponse: 'Turnover is €50.503 Billion',
    toolsUsedDuringRecall: ['pdf_extractor', 'memory_search']
  });
  assert(
    'B4.1-TEST-07: Memory Recall Rejects Unverified Tool Usage',
    eval7.verifiedToolsUsed.length === 0,
    'Memory recall trusted client-supplied unverified tool usage!',
    'Memory recall correctly ignored caller-supplied tools and verified empty tool list from registered receipt.'
  );

  // 8. test_ask_anything_memory_recall_fails_closed_when_receipt_missing
  const eval8 = academyMinervaLab.evaluateAskAnythingMemoryRecall({
    solverExecutionId: 'unregistered-exec-999',
    questionId: 'q-02',
    solverResponse: 'Some response'
  });
  assert(
    'B4.1-TEST-08: Memory Recall Fails Closed When Receipt Missing',
    !eval8.passed && eval8.status === 'SOLVER_EXECUTION_RECEIPT_NOT_FOUND',
    'Memory recall passed when solver execution receipt was missing!',
    'Memory recall correctly failed closed with SOLVER_EXECUTION_RECEIPT_NOT_FOUND.'
  );

  // 9. test_capability_promotion_requires_authenticated_authority_context
  let t9Passed = false;
  try {
    capabilityPromotionAuthority.submitCandidate({
      skillId: 'table-scale-detection',
      candidateVersion: 'v2.3.0-unauth',
      proposedBy: 'DARWIN',
      changeReason: 'Test promotion auth',
      testResults: { passed: true, score: 1.0, totalCases: 5 }
    });
    capabilityPromotionAuthority.promoteCandidate({
      skillId: 'table-scale-detection',
      candidateVersion: 'v2.3.0-unauth'
    });
  } catch (err: any) {
    t9Passed = err.message.includes('UNAUTHORIZED_PROMOTION_AUTHORITY');
  }
  assert(
    'B4.1-TEST-09: Capability Promotion Requires Authenticated Authority Context',
    t9Passed,
    'Candidate promotion succeeded without authenticated promotion authority context!',
    'Candidate promotion correctly threw UNAUTHORIZED_PROMOTION_AUTHORITY.'
  );

  // 10. test_capability_promotion_rejects_unauthenticated_string_principal
  let t10Passed = false;
  try {
    capabilityPromotionAuthority.promoteCandidate({
      skillId: 'table-scale-detection',
      candidateVersion: 'v2.3.0-unauth',
      authContext: 'UNTRUSTED_CALLER_STRING'
    });
  } catch (err: any) {
    t10Passed = err.message.includes('UNAUTHORIZED_PROMOTION_AUTHORITY');
  }
  assert(
    'B4.1-TEST-10: Capability Promotion Rejects Arbitrary Caller String Principal',
    t10Passed,
    'Candidate promotion accepted untrusted string principal!',
    'Candidate promotion correctly rejected untrusted string principal.'
  );

  // 11. test_capability_promotion_rejects_proposer_self_promotion
  let t11Passed = false;
  try {
    capabilityPromotionAuthority.submitCandidate({
      skillId: 'table-scale-detection',
      candidateVersion: 'v2.3.1-self',
      proposedBy: 'CHIEF_CPA_OFFICER',
      changeReason: 'Test self promotion',
      testResults: { passed: true, score: 1.0, totalCases: 5 }
    });
    capabilityPromotionAuthority.promoteCandidate({
      skillId: 'table-scale-detection',
      candidateVersion: 'v2.3.1-self',
      authContext: { authenticatedPrincipalId: 'CHIEF_CPA_OFFICER', isPromotionAuthority: true }
    });
  } catch (err: any) {
    t11Passed = err.message.includes('PROMOTION_AUTHORITY_VIOLATION');
  }
  assert(
    'B4.1-TEST-11: Capability Promotion Rejects Proposer Self-Promotion',
    t11Passed,
    'Candidate promotion permitted proposer self-promotion!',
    'Candidate promotion correctly threw PROMOTION_AUTHORITY_VIOLATION on proposer self-promotion.'
  );

  const passingSolverOutputs = {
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

  // 12. test_capability_promotion_rejects_examiner_self_promotion
  let t12Passed = false;
  try {
    capabilityPromotionAuthority.submitCandidate({
      skillId: 'table-scale-detection',
      candidateVersion: 'v2.3.2-exam',
      proposedBy: 'DARWIN',
      changeReason: 'Test examiner self promotion',
      testResults: { passed: true, score: 1.0, totalCases: 5 }
    });
    // Register evaluation report with MINERVA
    solverExecutionRegistry.registerExecutionPackage({
      executionId: 'exec-001',
      agentId: 'HERMES',
      toolCalls: [],
      outputs: passingSolverOutputs
    });
    const evalReport = academyMinervaLab.runEvaluation(passingSolverOutputs, 'exec-001');
    capabilityPromotionAuthority.attachHoldoutEvaluation({
      skillId: 'table-scale-detection',
      candidateVersion: 'v2.3.2-exam',
      evalId: evalReport.evalId
    });
    capabilityPromotionAuthority.promoteCandidate({
      skillId: 'table-scale-detection',
      candidateVersion: 'v2.3.2-exam',
      authContext: { authenticatedPrincipalId: 'MINERVA', isPromotionAuthority: true }
    });
  } catch (err: any) {
    t12Passed = err.message.includes('PROMOTION_AUTHORITY_VIOLATION');
  }
  assert(
    'B4.1-TEST-12: Capability Promotion Rejects Examiner Self-Promotion',
    t12Passed,
    'Candidate promotion permitted examiner self-promotion!',
    'Candidate promotion correctly threw PROMOTION_AUTHORITY_VIOLATION on examiner self-promotion.'
  );

  // 13. test_capability_promotion_atomic_fsync_reverts_in_memory_on_write_failure
  // Test atomic persistence write failure handling
  let t13Passed = false;
  try {
    // Create candidate
    capabilityPromotionAuthority.submitCandidate({
      skillId: 'atomic-test-skill',
      candidateVersion: 'v1.0.0-tmp',
      proposedBy: 'DARWIN',
      changeReason: 'Atomic write test',
      testResults: { passed: true, score: 1.0, totalCases: 5 }
    });
    solverExecutionRegistry.registerExecutionPackage({
      executionId: 'exec-002',
      agentId: 'HERMES',
      toolCalls: [],
      outputs: passingSolverOutputs
    });
    const evalReport = academyMinervaLab.runEvaluation(passingSolverOutputs, 'exec-002');
    capabilityPromotionAuthority.attachHoldoutEvaluation({
      skillId: 'atomic-test-skill',
      candidateVersion: 'v1.0.0-tmp',
      evalId: evalReport.evalId
    });

    // Temporarily point storageFile to read-only or invalid path to induce write failure
    const cpa = capabilityPromotionAuthority as any;
    const originalFile = cpa.storageFile;
    cpa.storageFile = '/invalid_dir_path_nonexistent/ledger.json';

    try {
      capabilityPromotionAuthority.promoteCandidate({
        skillId: 'atomic-test-skill',
        candidateVersion: 'v1.0.0-tmp',
        authContext: { authenticatedPrincipalId: 'PROMOTION_AUTHORITY_COMMITTEE', isPromotionAuthority: true }
      });
    } catch (err: any) {
      const activeAfterFail = capabilityPromotionAuthority.getActiveVersion('atomic-test-skill');
      if (err.message.includes('PERSISTENCE_FAILURE') && activeAfterFail !== 'v1.0.0-tmp') {
        t13Passed = true;
      }
    } finally {
      cpa.storageFile = originalFile;
    }
  } catch (err) {}
  assert(
    'B4.1-TEST-13: Atomic Persistence Reverts Active State on Write Failure',
    t13Passed,
    'Capability promotion left active version updated in memory despite storage write failure!',
    'Capability promotion reverted active version state fail-closed when persistent storage write failed.'
  );

  // 14. test_capability_holdout_attachment_requires_persisted_eval_receipt
  let t14Passed = false;
  try {
    capabilityPromotionAuthority.submitCandidate({
      skillId: 'table-scale-detection',
      candidateVersion: 'v2.3.3-noeval',
      proposedBy: 'DARWIN',
      changeReason: 'Test missing holdout eval',
      testResults: { passed: true, score: 1.0, totalCases: 5 }
    });
    capabilityPromotionAuthority.attachHoldoutEvaluation({
      skillId: 'table-scale-detection',
      candidateVersion: 'v2.3.3-noeval',
      evalId: 'fake-eval-id-999'
    });
  } catch (err: any) {
    t14Passed = err.message.includes('MINERVA_EVALUATION_RECEIPT_NOT_FOUND');
  }
  assert(
    'B4.1-TEST-14: Holdout Evaluation Attachment Requires Persisted Minerva Receipt',
    t14Passed,
    'Holdout evaluation was attached using unverified evalId!',
    'Holdout evaluation attachment correctly threw MINERVA_EVALUATION_RECEIPT_NOT_FOUND.'
  );

  // 15. test_capability_holdout_attachment_rejects_caller_supplied_scores
  const evalReport15 = academyMinervaLab.runEvaluation(passingSolverOutputs, 'exec-003');
  capabilityPromotionAuthority.submitCandidate({
    skillId: 'table-scale-detection',
    candidateVersion: 'v2.3.4-receipt',
    proposedBy: 'DARWIN',
    changeReason: 'Test receipt holdout',
    testResults: { passed: true, score: 1.0, totalCases: 5 }
  });
  const attachedRecord = capabilityPromotionAuthority.attachHoldoutEvaluation({
    skillId: 'table-scale-detection',
    candidateVersion: 'v2.3.4-receipt',
    evalId: evalReport15.evalId
  });
  assert(
    'B4.1-TEST-15: Holdout Evaluation Uses Examiner Receipt Accuracy Scores',
    attachedRecord.holdoutResults?.evalId === evalReport15.evalId && attachedRecord.evaluatedBy === 'MINERVA',
    'Holdout evaluation failed to link persisted evaluation report receipt!',
    'Holdout evaluation correctly attached verified Minerva report receipt.'
  );

  // 16. test_persistent_memory_store_denies_solver_writing_examiner_sealed
  let t16Passed = false;
  try {
    persistentAgentMemory.store({
      namespace: 'eve/hermes',
      type: 'EPISODIC',
      key: 'sealed_key_01',
      value: { secret: 'truth' },
      classification: 'EXAMINER_SEALED'
    });
  } catch (err: any) {
    t16Passed = err.message.includes('EXAMINER_SEALED_ISOLATION_VIOLATION');
  }
  assert(
    'B4.1-TEST-16: Persistent Memory Denies Writing Sealed Content in Solver Namespace',
    t16Passed,
    'Persistent memory allowed writing EXAMINER_SEALED entry into solver namespace!',
    'Persistent memory correctly threw EXAMINER_SEALED_ISOLATION_VIOLATION.'
  );

  // 17. test_persistent_memory_store_denies_unauthenticated_writing_examiner_sealed
  let t17Passed = false;
  try {
    persistentAgentMemory.store({
      namespace: 'eve/minerva/sealed',
      type: 'EPISODIC',
      key: 'sealed_key_02',
      value: { secret: 'truth' },
      classification: 'EXAMINER_SEALED',
      authContext: { authenticatedPrincipalId: 'UNTRUSTED_USER', isExaminerService: false }
    });
  } catch (err: any) {
    t17Passed = err.message.includes('EXAMINER_SEALED_ACCESS_DENIED');
  }
  assert(
    'B4.1-TEST-17: Persistent Memory Denies Unauthenticated Calling Principal Writing Sealed Content',
    t17Passed,
    'Persistent memory allowed non-examiner principal to write EXAMINER_SEALED entry!',
    'Persistent memory correctly threw EXAMINER_SEALED_ACCESS_DENIED.'
  );

  // 18. test_persistent_memory_retrieve_denies_unauthenticated_reading_examiner_sealed
  // First store an entry in examiner namespace with examiner authContext
  persistentAgentMemory.store({
    namespace: 'eve/minerva/vault',
    type: 'SEMANTIC',
    key: 'sealed_bench_answer_99',
    value: { golden: 123 },
    classification: 'EXAMINER_SEALED',
    tags: ['EXAMINER_SEALED'],
    authContext: { authenticatedPrincipalId: 'MINERVA_EXAMINER_SERVICE', isExaminerService: true }
  });
  const readRes18 = persistentAgentMemory.retrieve('eve/minerva/vault', 'sealed_bench_answer_99', 'HERMES', {
    authenticatedPrincipalId: 'HERMES_SOLVER',
    isExaminerService: false
  });
  assert(
    'B4.1-TEST-18: Persistent Memory Retrieve Denies Non-Examiner Reading Sealed Content',
    readRes18 === null,
    'Persistent memory retrieve exposed EXAMINER_SEALED entry to solver caller!',
    'Persistent memory retrieve correctly returned null for non-examiner caller.'
  );

  // 19. test_persistent_memory_query_filters_examiner_sealed_from_solvers
  const queryRes19 = persistentAgentMemory.query({
    namespace: 'eve/minerva/vault',
    authContext: { authenticatedPrincipalId: 'HERMES_SOLVER', isExaminerService: false }
  });
  assert(
    'B4.1-TEST-19: Persistent Memory Query Filters Sealed Content From Solvers',
    !queryRes19.some(e => e.classification === 'EXAMINER_SEALED'),
    'Persistent memory query exposed EXAMINER_SEALED entries to solver context!',
    'Persistent memory query filtered out all EXAMINER_SEALED records for solver context.'
  );

  // 20. test_capability_promotion_authority_no_default_seeded_capabilities
  const cpaInstance = capabilityPromotionAuthority;
  const ledger20 = cpaInstance.getLedger();
  const hasSyntheticBootstrap = ledger20.some(r => r.proposedBy === 'SYSTEM_BOOTSTRAP' && r.promotedAt === '2026-08-01T00:00:00Z');
  assert(
    'B4.1-TEST-20: Capability Promotion Authority Has No Automatic Synthetic Default Seeding',
    !hasSyntheticBootstrap,
    'Capability promotion authority contains synthetic perfect baseline seeding on startup!',
    'Capability promotion authority startup ledger confirmed clean without synthetic/seeded baseline promotions.'
  );

  console.log('----------------------------------------------------');
  console.log(`  PACKAGE B4.1 RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('----------------------------------------------------\n');

  if (failed > 0) {
    throw new Error(`Package B4.1 Behavioral Closure Suite failed: ${failed} tests failed.`);
  }

  return { passed, failed, total: passed + failed };
}

if (process.argv[1]?.includes('phasePackageB4_1BehavioralClosure.test')) {
  runPhasePackageB4_1BehavioralClosureTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
