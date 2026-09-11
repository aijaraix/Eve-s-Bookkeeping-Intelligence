/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — PACKAGE B2 REAL AGENT EXECUTION, SWARM DAG & HANDOFF CONSERVATION TEST SUITE
 * 
 * Target: Document 35 Package B2 Verification
 * Enforces:
 * 1. Removal of computeOutput() - REAL_AI_AGENT executions reject synchronous callback bypass
 * 2. Complete Document 35 Execution Contract Persisted
 * 3. Authentic Role Classification (Deterministic engines vs Real AI agents)
 * 4. Dynamic Dependency DAG Construction with prerequisite definitions
 * 5. DAG Execution Order & Pre-condition Enforcement
 * 6. Safe Concurrent DAG Parallelism for independent nodes
 * 7. Durable Producer-to-Consumer Handoff Manifest Creation
 * 8. Strict Handoff Conservation Invariant (EXPECTED = ACKNOWLEDGED + REJECTED, UNACCOUNTED = 0)
 * 9. Handoff Conservation Violation Blocks Consumer (Fail-Closed)
 * 10. Missing Handoff Blocks Consumer
 * 11. Specialist Conflict Generates Durable Disagreement Object (No Consensus Voting)
 * 12. Active Disagreement Blocks Canonical Truth Promotion
 * 13. Disagreement Triggers Upstream Reopen / Review
 * 14. Canonical Proof-State Machine Progression
 * 15. Producer Cannot Self-Promote / QUINN Cannot Self-Certify
 * 16. File Existence Proves Persistence Only (Not Independent Verification)
 * 17. Missing Verifier Evidence Leaves Proof State at Lower Level
 * 18. Retry Policy Tracks Persistent Attempts and Fails Closed
 * 19. Honest Cost & Model Provenance (No Fabricated Tokens/Cost)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { hermesJobDispatchService, AgentJobExecution } from '../cpaOrganization/hermesJobDispatchService.js';
import { handoffConservationEngine } from '../cpaOrganization/handoffConservationEngine.js';
import { disagreementLedger } from '../cpaOrganization/disagreementLedger.js';
import { canonicalProofStateMachine } from '../cpaOrganization/canonicalProofStateMachine.js';
import { swarmDagEngine } from '../cpaOrganization/swarmDagEngine.js';
import { RealAgentExecutionRequest, RealAgentExecutionReceipt } from '../cpaOrganization/realAgentExecutionAdapter.js';

export async function runPhasePackageB2RealAgentExecutionTests(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('\n===============================================================');
  console.log('RUNNING PACKAGE B2 REAL AGENT EXECUTION & SWARM DAG TEST SUITE');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;
  const total = 22;

  function assertTest(name: string, condition: boolean, details: string) {
    if (condition) {
      console.log(`  \x1b[32m[PASS]\x1b[0m ${name}`);
      passed++;
    } else {
      console.error(`  \x1b[31m[FAIL]\x1b[0m ${name} — ${details}`);
      failed++;
    }
  }

  // Create temporary fixture file for source testing
  const tempFixturePath = path.join(process.cwd(), 'storage', 'cpa_memory', 'test_b2_source_fixture.txt');
  const tempFixtureBytes = Buffer.from('EVE_CPA_STATUTORY_AUDIT_SOURCE_FIXTURE_DATA_2025');
  const tempFixtureSha256 = crypto.createHash('sha256').update(tempFixtureBytes).digest('hex');
  fs.writeFileSync(tempFixturePath, tempFixtureBytes);

  function createStandardTestReceipt(req: RealAgentExecutionRequest): RealAgentExecutionReceipt {
    const isLexicon = req.agentId === 'LEXICON';
    const isQuinn = req.agentId === 'QUINN';

    return {
      routingDecisionId: `route-${req.agentId.toLowerCase()}-cloud-${Date.now()}`,
      modelExecutionId: `model-exec-${req.agentId.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      provider: isLexicon ? 'local' : 'google',
      actualModel: isLexicon ? 'deepseek-r1-distill-qwen-7b' : (isQuinn ? 'gemini-2.5-pro' : 'gemini-2.5-flash'),
      agentId: req.agentId,
      executionStartedAt: new Date(Date.now() - 50).toISOString(),
      executionCompletedAt: new Date().toISOString(),
      latencyMs: 50,
      parsedOutput: {
        technicalSignOff: 'FACTS_EXTRACTED_STANDARDS_REVIEW_PENDING_SUBSTANTIVE_AUDIT',
        asc280SegmentCompliance: 'DISCLOSURE_REVIEW_CONDUCTED_COMPLIANT',
        asc606RevenueDisaggregation: 'DISCLOSURE_REVIEW_CONDUCTED_COMPLIANT',
        asc842LeaseDisclosures: 'DISCLOSURE_REVIEW_CONDUCTED_COMPLIANT',
        substantiveFindingsCount: 0,
        significantMattersAssessed: 0
      },
      usage: {
        promptTokens: 420,
        completionTokens: 90,
        totalTokens: 510
      },
      costUsd: 0,
      costMeasurement: 'MEASURED',
      fallbackState: 'PRIMARY_SUCCESS',
      executionStatus: 'SUCCESS'
    };
  }

  // Configure hermesJobDispatchService with authentic test adapter for physical model receipt generation
  hermesJobDispatchService.setExecutionAdapter(async (req) => createStandardTestReceipt(req));

  try {
    // --------------------------------------------------------------------------
    // Test 1: Removal of computeOutput() - Authentic specialist execution
    // --------------------------------------------------------------------------
    {
      const summary = await hermesJobDispatchService.executeCpaSpecialistSwarm({
        engagementId: 'eng-b2-test-1',
        clientName: 'Test Corp Alpha',
        ticker: 'TCPA',
        fiscalYear: '2025',
        reportedAssets: 1000000,
        reportedLiabilities: 400000,
        reportedEquity: 600000,
        sourceFilePath: tempFixturePath,
        sourceSha256: tempFixtureSha256,
        extractedFactsCount: 150,
        discoveredAccounts: {
          assetAccountsCount: 20,
          liabilityAccountsCount: 15,
          equityAccountsCount: 5
        }
      });

      const athenaJob = summary.jobs.find(j => j.agentId === 'ATHENA');
      const hasRealMechanism = athenaJob?.executionMechanism === 'REAL_MODEL_INFERENCE';
      const noCallbackHacks = athenaJob?.outputManifest?.technicalSignOff === 'FACTS_EXTRACTED_STANDARDS_REVIEW_PENDING_SUBSTANTIVE_AUDIT';

      assertTest(
        'Test 1: Removal of computeOutput() Execution Mechanism',
        !!athenaJob && hasRealMechanism && noCallbackHacks,
        `Athena executed with real mechanism: ${athenaJob?.executionMechanism}, signoff: ${athenaJob?.outputManifest?.technicalSignOff}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 2: Complete Document 35 Execution Contract Persisted
    // --------------------------------------------------------------------------
    {
      const summary = await hermesJobDispatchService.executeCpaSpecialistSwarm({
        engagementId: 'eng-b2-test-2',
        clientName: 'Contract Compliance Corp',
        ticker: 'CCC',
        fiscalYear: '2025',
        reportedAssets: 500000,
        reportedLiabilities: 200000,
        reportedEquity: 300000,
        sourceFilePath: tempFixturePath,
        sourceSha256: tempFixtureSha256,
        extractedFactsCount: 80
      });

      const job = summary.jobs[0];
      const hasAllFields =
        typeof job.agentExecutionId === 'string' &&
        typeof job.engagementId === 'string' &&
        typeof job.agentId === 'string' &&
        typeof job.roleExecutionClass === 'string' &&
        typeof job.taskObjective === 'string' &&
        typeof job.jobType === 'string' &&
        typeof job.inputManifestHash === 'string' &&
        Array.isArray(job.inputObjectReferences) &&
        typeof job.executionMechanism === 'string' &&
        typeof job.provenance === 'object' &&
        typeof job.startedAt === 'string' &&
        typeof job.finishedAt === 'string' &&
        typeof job.durationMs === 'number' &&
        typeof job.outputHash === 'string' &&
        Array.isArray(job.outputObjectReferences) &&
        typeof job.status === 'string' &&
        Array.isArray(job.uncertainties) &&
        Array.isArray(job.findings) &&
        typeof job.proofState === 'string' &&
        typeof job.persistedArtifactPath === 'string' &&
        fs.existsSync(job.persistedArtifactPath);

      assertTest(
        'Test 2: Complete Document 35 Execution Contract Persisted',
        hasAllFields,
        `Missing contract fields on job: ${job?.agentId}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 3: Authentic Role Classification (Deterministic vs Real AI)
    // --------------------------------------------------------------------------
    {
      const summary = await hermesJobDispatchService.executeCpaSpecialistSwarm({
        engagementId: 'eng-b2-test-3',
        clientName: 'Role Verification Corp',
        ticker: 'RVC',
        fiscalYear: '2025',
        reportedAssets: 800000,
        reportedLiabilities: 300000,
        reportedEquity: 500000,
        sourceFilePath: tempFixturePath,
        sourceSha256: tempFixtureSha256,
        extractedFactsCount: 100
      });

      const deterministicRoles = ['LEDGER', 'EUCLID', 'VERITAS', 'SENTINEL'];
      const realAiRoles = ['HERMES', 'ATHENA', 'CLARA', 'QUINN', 'LEXICON'];

      const detOk = deterministicRoles.every(id => {
        const j = summary.jobs.find(x => x.agentId === id);
        return j?.roleExecutionClass === 'DETERMINISTIC_SPECIALIST_ENGINE' &&
               j?.executionMechanism === 'DETERMINISTIC_SPECIALIST_ENGINE';
      });

      const aiOk = realAiRoles.every(id => {
        const j = summary.jobs.find(x => x.agentId === id);
        return j?.roleExecutionClass === 'REAL_AI_AGENT';
      });

      assertTest(
        'Test 3: Authentic Role Classification Matrix',
        detOk && aiOk,
        `Deterministic OK: ${detOk}, AI OK: ${aiOk}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 4: Dynamic Dependency DAG Construction
    // --------------------------------------------------------------------------
    {
      const dag = swarmDagEngine.buildStandardCpaDag('eng-b2-dag-test', ['ref-1', 'ref-2']);
      const has9Nodes = dag.nodes.size === 9;
      const euclidPrereq = dag.nodes.get('EUCLID')?.prerequisites.includes('LEDGER');
      const athenaPrereqs = ['LEDGER', 'EUCLID', 'VERITAS'].every(p => dag.nodes.get('ATHENA')?.prerequisites.includes(p));
      const quinnPrereqs = dag.nodes.get('QUINN')?.prerequisites.length === 8;

      assertTest(
        'Test 4: Dynamic Dependency DAG Construction',
        has9Nodes && !!euclidPrereq && !!athenaPrereqs && !!quinnPrereqs,
        `Nodes count: ${dag.nodes.size}, Euclid prereqs ok: ${euclidPrereq}, Athena prereqs ok: ${athenaPrereqs}, Quinn prereqs ok: ${quinnPrereqs}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 5: DAG Execution Order & Pre-condition Enforcement
    // --------------------------------------------------------------------------
    {
      const dag = swarmDagEngine.buildStandardCpaDag('eng-b2-order-test', ['ref-1']);
      // Simulate EUCLID running before LEDGER is completed
      let blockedCaught = false;
      const { plan } = await swarmDagEngine.executeDag(dag, async (node) => {
        if (node.nodeId === 'HERMES') {
          return {
            agentExecutionId: 'mock-hermes',
            engagementId: 'eng-b2-order-test',
            agentId: 'HERMES',
            roleExecutionClass: 'REAL_AI_AGENT',
            taskObjective: 'test',
            jobType: 'test',
            inputManifest: {},
            inputManifestHash: 'hash',
            inputObjectReferences: ['ref-1'],
            executionMechanism: 'ORCHESTRATOR_DISPATCH',
            provenance: { model: 'test', tier: 'test', costUsd: 0, measured: true },
            outputManifest: {},
            outputHash: 'out-hash',
            outputObjectReferences: ['ref-out-1'],
            persistedArtifactPath: 'path',
            handoffAcknowledgement: true,
            status: 'JOB_FAILED', // HERMES FAILED!
            uncertainties: [],
            findings: [],
            startedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
            durationMs: 1,
            proofLevel: 'UNVERIFIED',
            proofState: 'UNVERIFIED',
            attempt: 3,
            maxAttempts: 3
          };
        }
        return {} as any;
      });

      // Downstream nodes must be BLOCKED
      const ledgerStatus = plan.nodes.get('LEDGER')?.status;
      const euclidStatus = plan.nodes.get('EUCLID')?.status;
      const isBlocked = ledgerStatus === 'BLOCKED' && euclidStatus === 'BLOCKED';

      assertTest(
        'Test 5: DAG Execution Order & Pre-condition Enforcement',
        isBlocked,
        `Ledger status: ${ledgerStatus}, Euclid status: ${euclidStatus}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 6: Safe Concurrent DAG Parallelism
    // --------------------------------------------------------------------------
    {
      const dag = swarmDagEngine.buildStandardCpaDag('eng-b2-concurrency-test', ['ref-1']);
      const stage2 = dag.executionStages[1]; // ['LEDGER', 'VERITAS', 'CLARA']
      const isIndependentGroup = stage2.includes('LEDGER') && stage2.includes('VERITAS') && stage2.includes('CLARA');

      assertTest(
        'Test 6: Safe Concurrent DAG Parallelism',
        isIndependentGroup && stage2.length === 3,
        `Stage 2 concurrent nodes: ${stage2.join(', ')}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 7: Durable Producer-to-Consumer Handoff Manifest Creation
    // --------------------------------------------------------------------------
    {
      const refs = ['ref-obj-a', 'ref-obj-b', 'ref-obj-c'];
      const handoff = handoffConservationEngine.createHandoff({
        producerExecutionId: 'exec-prod-100',
        producerAgentId: 'HERMES',
        consumerAgentId: 'LEDGER',
        engagementScope: 'eng-b2-handoff-test',
        objectReferenceManifest: refs
      });

      const hashMatches = handoff.manifestHash === handoffConservationEngine.computeManifestHash(refs);
      const expectedCountOk = handoff.expectedReferenceCount === 3;
      const pendingStatus = handoff.status === 'PENDING';

      assertTest(
        'Test 7: Durable Producer-to-Consumer Handoff Manifest Creation',
        !!handoff.handoffId && hashMatches && expectedCountOk && pendingStatus,
        `Handoff created with id: ${handoff.handoffId}, hashMatch: ${hashMatches}, expected: ${handoff.expectedReferenceCount}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 8: Strict Handoff Conservation Invariant (EXPECTED = ACK + REJ)
    // --------------------------------------------------------------------------
    {
      const refs = ['ref-item-1', 'ref-item-2', 'ref-item-3', 'ref-item-4'];
      const handoff = handoffConservationEngine.createHandoff({
        producerExecutionId: 'exec-prod-200',
        producerAgentId: 'LEDGER',
        consumerAgentId: 'EUCLID',
        engagementScope: 'eng-b2-conserve-test',
        objectReferenceManifest: refs
      });

      const ackResult = handoffConservationEngine.acknowledgeHandoff(handoff.handoffId, {
        acknowledgedReferences: ['ref-item-1', 'ref-item-2', 'ref-item-3'],
        rejectedWithDisposition: [
          { referenceId: 'ref-item-4', disposition: 'EXCLUDED_OUT_OF_SCOPE', reason: 'Not balance sheet item' }
        ]
      });

      const isConserved = ackResult.conserved &&
        ackResult.record.status === 'ACKNOWLEDGED' &&
        ackResult.record.unaccountedReferences === 0 &&
        ackResult.record.expectedReferenceCount === (ackResult.record.acknowledgedReferenceCount + ackResult.record.rejectedWithDisposition.length);

      assertTest(
        'Test 8: Strict Handoff Conservation Invariant',
        isConserved,
        `Conserved: ${ackResult.conserved}, unaccounted: ${ackResult.record.unaccountedReferences}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 9: Handoff Conservation Violation Blocks Consumer (Fail-Closed)
    // --------------------------------------------------------------------------
    {
      const refs = ['ref-k-1', 'ref-k-2', 'ref-k-3'];
      const handoff = handoffConservationEngine.createHandoff({
        producerExecutionId: 'exec-prod-300',
        producerAgentId: 'VERITAS',
        consumerAgentId: 'SENTINEL',
        engagementScope: 'eng-b2-violation-test',
        objectReferenceManifest: refs
      });

      // Acknowledge only 2 of 3 without dispositioning the 3rd
      const ackResult = handoffConservationEngine.acknowledgeHandoff(handoff.handoffId, {
        acknowledgedReferences: ['ref-k-1', 'ref-k-2']
      });

      const isViolation = !ackResult.conserved &&
        ackResult.record.status === 'CONSERVATION_VIOLATION' &&
        ackResult.record.unaccountedReferences === 1;

      assertTest(
        'Test 9: Handoff Conservation Violation Blocks Consumer (Fail-Closed)',
        isViolation,
        `Status: ${ackResult.record.status}, unaccounted: ${ackResult.record.unaccountedReferences}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 10: Missing Handoff Blocks Consumer
    // --------------------------------------------------------------------------
    {
      const verification = handoffConservationEngine.verifyConservation('non-existent-handoff-id');
      const isBlocked = !verification.conserved && verification.unaccounted === -1;

      assertTest(
        'Test 10: Missing Handoff Blocks Consumer',
        isBlocked,
        `Verification output: conserved=${verification.conserved}, unaccounted=${verification.unaccounted}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 11: Specialist Conflict Generates Durable Disagreement Object (No Consensus Voting)
    // --------------------------------------------------------------------------
    {
      const summary = await hermesJobDispatchService.executeCpaSpecialistSwarm({
        engagementId: 'eng-b2-disagree-test',
        clientName: 'Imbalance Corp',
        ticker: 'IMB',
        fiscalYear: '2025',
        reportedAssets: 1000000,
        reportedLiabilities: 400000,
        reportedEquity: 500000, // 400k + 500k = 900k != 1000k (variance = 100k)
        sourceFilePath: tempFixturePath,
        sourceSha256: tempFixtureSha256,
        extractedFactsCount: 50
      });

      const disagreements = disagreementLedger.getDisagreementsForEngagement('eng-b2-disagree-test');
      const hasVarianceDisagreement = disagreements.some(
        d => d.disagreementType === 'ARITHMETIC_VARIANCE' &&
             d.sourceAgentId === 'LEDGER' &&
             d.challengingAgentId === 'EUCLID' &&
             d.conflictingValue === 100000 &&
             d.blocking === true
      );

      assertTest(
        'Test 11: Specialist Conflict Generates Durable Disagreement Object (No Consensus Voting)',
        hasVarianceDisagreement,
        `Disagreements recorded: ${disagreements.length}, hasVariance: ${hasVarianceDisagreement}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 12: Active Disagreement Blocks Canonical Truth Promotion
    // --------------------------------------------------------------------------
    {
      const engId = 'eng-b2-block-truth-test';
      const targetObj = 'balance-sheet-eng-b2-block-truth-test';

      disagreementLedger.recordDisagreement({
        engagementId: engId,
        sourceAgentId: 'LEDGER',
        challengingAgentId: 'EUCLID',
        targetObjectId: targetObj,
        field: 'varianceUsd',
        sourceValue: 0,
        conflictingValue: 50000,
        disagreementType: 'ARITHMETIC_VARIANCE',
        blocking: true
      });

      // Try to promote blocked object to ELIGIBLE_FOR_CANONICAL
      const evaluation = canonicalProofStateMachine.evaluatePromotion('OUTPUT_PERSISTED', 'ELIGIBLE_FOR_CANONICAL', {
        engagementId: engId,
        targetObjectId: targetObj,
        producerAgentId: 'LEDGER',
        verifyingAgentId: 'EUCLID',
        verifierEvidence: {
          verifierExecutionId: 'exec-euclid-mock',
          verifiedAt: new Date().toISOString(),
          verificationHash: 'hash',
          verificationType: 'ARITHMETIC'
        }
      });

      const promotionBlocked = !evaluation.allowed && evaluation.achievedState === 'OUTPUT_PERSISTED';

      assertTest(
        'Test 12: Active Disagreement Blocks Canonical Truth Promotion',
        promotionBlocked,
        `Promotion allowed: ${evaluation.allowed}, achievedState: ${evaluation.achievedState}, reason: ${evaluation.reason}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 13: Disagreement Triggers Upstream Reopen / Review
    // --------------------------------------------------------------------------
    {
      const record = disagreementLedger.recordDisagreement({
        engagementId: 'eng-b2-reopen-test',
        sourceAgentId: 'LEDGER',
        challengingAgentId: 'EUCLID',
        targetObjectId: 'obj-tb-reopen',
        field: 'balance',
        sourceValue: 100,
        conflictingValue: 80,
        disagreementType: 'ARITHMETIC_VARIANCE',
        blocking: true,
        reopenTargetAgentId: 'LEDGER'
      });

      const reopenTriggered = record.reopenTriggered && record.reopenTargetAgentId === 'LEDGER';

      assertTest(
        'Test 13: Disagreement Triggers Upstream Reopen / Review',
        reopenTriggered,
        `Reopen triggered: ${record.reopenTriggered}, target: ${record.reopenTargetAgentId}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 14: Canonical Proof-State Machine Progression
    // --------------------------------------------------------------------------
    {
      const eval1 = canonicalProofStateMachine.evaluatePromotion('UNVERIFIED', 'OUTPUT_PERSISTED', {
        engagementId: 'eng-b2-prog-test',
        targetObjectId: 'obj-prog-1',
        producerAgentId: 'LEDGER',
        fileExistedOnDisk: true
      });

      const eval2 = canonicalProofStateMachine.evaluatePromotion('OUTPUT_PERSISTED', 'INDEPENDENTLY_VERIFIED', {
        engagementId: 'eng-b2-prog-test',
        targetObjectId: 'obj-prog-1',
        producerAgentId: 'LEDGER',
        verifyingAgentId: 'EUCLID',
        verifierEvidence: {
          verifierExecutionId: 'exec-euclid-1',
          verifiedAt: new Date().toISOString(),
          verificationHash: 'hash-verified',
          verificationType: 'EQUATION_AUDIT'
        }
      });

      const progressionOk = eval1.allowed && eval1.achievedState === 'OUTPUT_PERSISTED' &&
                            eval2.allowed && eval2.achievedState === 'INDEPENDENTLY_VERIFIED';

      assertTest(
        'Test 14: Canonical Proof-State Machine Progression',
        progressionOk,
        `Step 1: ${eval1.achievedState}, Step 2: ${eval2.achievedState}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 15: Producer Cannot Self-Promote / QUINN Cannot Self-Certify
    // --------------------------------------------------------------------------
    {
      // Producer trying to verify itself
      const selfEval = canonicalProofStateMachine.evaluatePromotion('OUTPUT_PERSISTED', 'INDEPENDENTLY_VERIFIED', {
        engagementId: 'eng-b2-self-cert-test',
        targetObjectId: 'obj-quinn-assertion',
        producerAgentId: 'QUINN',
        verifyingAgentId: 'QUINN', // Self-verification attempt
        verifierEvidence: {
          verifierExecutionId: 'exec-quinn-self',
          verifiedAt: new Date().toISOString(),
          verificationHash: 'hash-self',
          verificationType: 'SELF_CERT'
        }
      });

      const selfPromoRejected = !selfEval.allowed && selfEval.achievedState === 'OUTPUT_PERSISTED';

      assertTest(
        'Test 15: Producer Cannot Self-Promote / QUINN Cannot Self-Certify',
        selfPromoRejected,
        `Self-promo allowed: ${selfEval.allowed}, reason: ${selfEval.reason}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 16: File Existence Proves Persistence Only
    // --------------------------------------------------------------------------
    {
      const fileEval = canonicalProofStateMachine.evaluatePromotion('UNVERIFIED', 'INDEPENDENTLY_VERIFIED', {
        engagementId: 'eng-b2-disk-test',
        targetObjectId: 'obj-disk-file',
        producerAgentId: 'LEDGER',
        fileExistedOnDisk: true
        // No verifier evidence!
      });

      const cappedAtPersisted = !fileEval.allowed && fileEval.achievedState === 'OUTPUT_PERSISTED';

      assertTest(
        'Test 16: File Existence Proves Persistence Only',
        cappedAtPersisted,
        `Achieved state: ${fileEval.achievedState}, allowed: ${fileEval.allowed}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 17: Missing Verifier Evidence Leaves Proof State at Lower Level
    // --------------------------------------------------------------------------
    {
      const missingEvidenceEval = canonicalProofStateMachine.evaluatePromotion('OUTPUT_PERSISTED', 'INDEPENDENTLY_VERIFIED', {
        engagementId: 'eng-b2-missing-verif-test',
        targetObjectId: 'obj-unverified',
        producerAgentId: 'ATHENA'
        // Missing verifier evidence and verifyingAgentId
      });

      const leftAtLower = !missingEvidenceEval.allowed && missingEvidenceEval.achievedState === 'OUTPUT_PERSISTED';

      assertTest(
        'Test 17: Missing Verifier Evidence Leaves Proof State at Lower Level',
        leftAtLower,
        `Achieved state: ${missingEvidenceEval.achievedState}, reason: ${missingEvidenceEval.reason}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 18: Retry Policy Tracks Persistent Attempts and Fails Closed
    // --------------------------------------------------------------------------
    {
      const dag = swarmDagEngine.buildStandardCpaDag('eng-b2-retry-test', ['ref-1']);
      let attemptsCount = 0;

      const { plan } = await swarmDagEngine.executeDag(dag, async (node) => {
        attemptsCount++;
        throw new Error('Simulated transient specialist failure');
      });

      const hermesNode = plan.nodes.get('HERMES');
      const failedClosed = hermesNode?.status === 'FAILED' &&
                           hermesNode?.attempt > hermesNode?.maxAttempts &&
                           attemptsCount === 3;

      assertTest(
        'Test 18: Retry Policy Tracks Persistent Attempts and Fails Closed',
        failedClosed,
        `Node status: ${hermesNode?.status}, attempts: ${attemptsCount}, maxAttempts: ${hermesNode?.maxAttempts}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 19: Honest Cost & Model Provenance (No Fabricated Tokens/Cost)
    // --------------------------------------------------------------------------
    {
      const summary = await hermesJobDispatchService.executeCpaSpecialistSwarm({
        engagementId: 'eng-b2-provenance-test',
        clientName: 'Honest Provenance Corp',
        ticker: 'HPC',
        fiscalYear: '2025',
        reportedAssets: 250000,
        reportedLiabilities: 100000,
        reportedEquity: 150000,
        sourceFilePath: tempFixturePath,
        sourceSha256: tempFixtureSha256,
        extractedFactsCount: 40
      });

      const ledgerJob = summary.jobs.find(j => j.agentId === 'LEDGER');
      const athenaJob = summary.jobs.find(j => j.agentId === 'ATHENA');

      // Deterministic specialist engine reports LEVEL_0_DETERMINISTIC with $0.00 cost
      const ledgerProvenanceHonest =
        ledgerJob?.provenance.tier === 'LEVEL_0_DETERMINISTIC' &&
        ledgerJob?.provenance.costUsd === 0 &&
        ledgerJob?.provenance.measured === true;

      // Real AI agent reports honest model and tier without fabricated million token numbers
      const athenaProvenanceHonest =
        typeof athenaJob?.provenance.model === 'string' &&
        athenaJob?.provenance.costUsd === 0 &&
        athenaJob?.provenance.measured === true;

      assertTest(
        'Test 19: Honest Cost & Model Provenance (No Fabricated Tokens/Cost)',
        ledgerProvenanceHonest && athenaProvenanceHonest,
        `Ledger: ${ledgerJob?.provenance.tier} / $${ledgerJob?.provenance.costUsd}, Athena: ${athenaJob?.provenance.model} / $${athenaJob?.provenance.costUsd}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 20: Package B2.1 Real AI Agent Fail-Closed on Model Failure / Unavailable
    // --------------------------------------------------------------------------
    {
      // Temporarily override adapter to simulate model outage/rate-limit
      hermesJobDispatchService.setExecutionAdapter(async (req) => {
        return {
          routingDecisionId: `route-${req.agentId.toLowerCase()}-fail`,
          modelExecutionId: '', // Empty model execution id
          provider: 'google',
          actualModel: 'gemini-2.5-pro',
          agentId: req.agentId,
          executionStartedAt: new Date().toISOString(),
          executionCompletedAt: new Date().toISOString(),
          latencyMs: 10,
          parsedOutput: null,
          costMeasurement: 'NOT_REPORTED',
          fallbackState: 'UNAVAILABLE',
          executionStatus: 'MODEL_UNAVAILABLE',
          error: 'Rate limit or quota exhausted'
        };
      });

      const failureSummary = await hermesJobDispatchService.executeCpaSpecialistSwarm({
        engagementId: 'eng-b2-failclosed-test',
        clientName: 'Fail Closed Corp',
        ticker: 'FCC',
        fiscalYear: '2025',
        reportedAssets: 100000,
        reportedLiabilities: 40000,
        reportedEquity: 60000,
        sourceFilePath: tempFixturePath,
        sourceSha256: tempFixtureSha256,
        extractedFactsCount: 10
      });

      const failedHermes = failureSummary.jobs.find(j => j.agentId === 'HERMES');
      // Must NOT claim REAL_MODEL_INFERENCE and must fail closed (status JOB_FAILED or MODEL_UNAVAILABLE)
      const hermesFailedClosed =
        failedHermes?.executionMechanism !== 'REAL_MODEL_INFERENCE' &&
        (failedHermes?.status === 'JOB_FAILED' || failedHermes?.status === 'MODEL_UNAVAILABLE') &&
        (!failedHermes?.modelExecutionId || failedHermes.modelExecutionId.trim().length === 0);

      // Restore standard test adapter
      hermesJobDispatchService.setExecutionAdapter(async (req) => createStandardTestReceipt(req));

      assertTest(
        'Test 20: Package B2.1 Real AI Agent Fail-Closed on Model Unavailable',
        !!hermesFailedClosed,
        `Mechanism: ${failedHermes?.executionMechanism}, Status: ${failedHermes?.status}, ModelId: ${failedHermes?.modelExecutionId}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 21: Package B2.1 Authentic Model Provenance & Routing Decision Invariant
    // --------------------------------------------------------------------------
    {
      const summary = await hermesJobDispatchService.executeCpaSpecialistSwarm({
        engagementId: 'eng-b2-receipt-test',
        clientName: 'Receipt Provenance Corp',
        ticker: 'RPC',
        fiscalYear: '2025',
        reportedAssets: 750000,
        reportedLiabilities: 300000,
        reportedEquity: 450000,
        sourceFilePath: tempFixturePath,
        sourceSha256: tempFixtureSha256,
        extractedFactsCount: 50
      });

      const quinnJob = summary.jobs.find(j => j.agentId === 'QUINN');
      const lexiconJob = summary.jobs.find(j => j.agentId === 'LEXICON');

      // Physical model ID must not equal logical agent name
      const distinctNames =
        quinnJob?.provenance.actualModel !== 'QUINN' &&
        lexiconJob?.provenance.actualModel !== 'LEXICON';

      // Routing decisions and model execution IDs must be bound
      const hasReceiptBindings =
        typeof quinnJob?.modelExecutionId === 'string' &&
        quinnJob.modelExecutionId.startsWith('model-exec-quinn') &&
        typeof quinnJob?.routingDecisionId === 'string' &&
        typeof lexiconJob?.modelExecutionId === 'string' &&
        lexiconJob.modelExecutionId.startsWith('model-exec-lexicon');

      assertTest(
        'Test 21: Package B2.1 Authentic Model Provenance & Routing Decision Invariant',
        distinctNames && hasReceiptBindings,
        `Distinct: ${distinctNames}, Quinn ModelId: ${quinnJob?.modelExecutionId}, RoutingId: ${quinnJob?.routingDecisionId}`
      );
    }

    // --------------------------------------------------------------------------
    // Test 22: Package B2.1 Deterministic Specialist Engines Do Not Invoke Model Adapter
    // --------------------------------------------------------------------------
    {
      let modelInvokedForDeterministic = false;

      // Track any model invocations
      hermesJobDispatchService.setExecutionAdapter(async (req) => {
        if (['LEDGER', 'EUCLID', 'VERITAS', 'SENTINEL'].includes(req.agentId)) {
          modelInvokedForDeterministic = true;
        }
        return createStandardTestReceipt(req);
      });

      const summary = await hermesJobDispatchService.executeCpaSpecialistSwarm({
        engagementId: 'eng-b2-deterministic-test',
        clientName: 'Deterministic Invariant Corp',
        ticker: 'DIC',
        fiscalYear: '2025',
        reportedAssets: 500000,
        reportedLiabilities: 200000,
        reportedEquity: 300000,
        sourceFilePath: tempFixturePath,
        sourceSha256: tempFixtureSha256,
        extractedFactsCount: 60
      });

      const euclidJob = summary.jobs.find(j => j.agentId === 'EUCLID');
      const veritasJob = summary.jobs.find(j => j.agentId === 'VERITAS');

      const pureDeterministic =
        !modelInvokedForDeterministic &&
        euclidJob?.executionMechanism === 'DETERMINISTIC_SPECIALIST_ENGINE' &&
        veritasJob?.executionMechanism === 'DETERMINISTIC_SPECIALIST_ENGINE' &&
        !euclidJob?.modelExecutionId &&
        !veritasJob?.modelExecutionId;

      assertTest(
        'Test 22: Package B2.1 Deterministic Specialist Separation Invariant',
        pureDeterministic,
        `Invoked for deterministic: ${modelInvokedForDeterministic}, Euclid mechanism: ${euclidJob?.executionMechanism}`
      );
    }

  } finally {
    // Reset adapter
    hermesJobDispatchService.setExecutionAdapter(null);

    // Clean up test fixture
    if (fs.existsSync(tempFixturePath)) {
      try { fs.unlinkSync(tempFixturePath); } catch (_) {}
    }
  }

  console.log('---------------------------------------------------------------');
  console.log(`PACKAGE B2 TEST RESULTS: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log('===============================================================\n');

  return { passed, failed, total };
}
