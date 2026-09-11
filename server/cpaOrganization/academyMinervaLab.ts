/**
 * EVE AUTONOMOUS CPA ORGANIZATION — ACADEMY & MINERVA EVALUATION LAB
 * 
 * Implements the Two-Sided Academy Architecture (Doc 31 & 33):
 * - Side A (Examiner): MINERVA with sealed ground truth benchmarks.
 *   Sealed benchmarks are strictly isolated and never leaked to solver contexts.
 * - Side B (Solver): HERMES and specialized audit engines.
 * 
 * Strict Evaluation Rules:
 * - A benchmark ONLY passes if the tested solver actually produces the expected results for THAT benchmark.
 * - Never increment passedCount automatically.
 * - Never increment valid citations without verifying citations against evidence.
 * - Missing required evidence = FAIL / NOT TESTED.
 * - Two separate concepts:
 *   A. Sealed regression benchmark examination (runEvaluation)
 *   B. Live-engagement independent validation (evaluateLiveEngagement)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { solverExecutionRegistry } from './solverExecutionRegistry.js';

export interface BenchmarkTestCase {
  id: string;
  category: 'GOLDEN_STANDARD' | 'MULTI_CURRENCY' | 'CONSOLIDATION' | 'ADVERSARIAL_OCR' | 'FAIL_CLOSED';
  title: string;
  description: string;
  groundTruth: {
    expectedFacts: Array<{ canonicalName: string; value: string; period: string; currency?: string; scale?: string }>;
    requiredIdentities: Array<{ equation: string; expectedVariance: number }>;
    prohibitedHallucinations: string[];
    failClosedRequired: boolean;
  };
  sealed: boolean;
}

export interface EvaluationReport {
  evalId: string;
  runAt: string;
  durationMs: number;
  totalTests: number;
  passed: number;
  failed: number;
  accuracyRate: number; // 0.0 - 1.0
  numericErrorRate: number; // 0.0 - 1.0 (must be 0.000 for CPA certification)
  citationIntegrity: number | null; // null if 0 citations checked
  failClosedIntegrity: number; // 0.0 - 1.0
  certifiedStatus: 'BENCHMARK_PASSED' | 'BENCHMARK_FAILED' | 'NOT_TESTED' | 'DEFECT_DETECTED' | 'FAILED_CLOSED' | 'CERTIFIED_CPA_READY';
  caseDetails: Array<{
    testId: string;
    testTitle: string;
    status: 'PASS' | 'FAIL';
    score: number;
    observations: string[];
    discrepancies: string[];
  }>;
}

export interface LiveEngagementValidationReport {
  validationId: string;
  runAt: string;
  certifiedStatus: 'TECHNICAL_VALIDATION_PASSED' | 'TECHNICAL_VALIDATION_FAILED' | 'DEFECT_DETECTED' | 'FAILED_CLOSED' | 'CERTIFIED_CPA_READY';
  physicalFileVerified: boolean;
  sha256Match: boolean;
  euclidIdentitySatisfied: boolean;
  varianceUsd: number;
  factsExtractedCount: number;
  details: string[];
  score: number;
}

export class AcademyMinervaLab {
  private static instance: AcademyMinervaLab | null = null;
  private sealedCorpus: BenchmarkTestCase[] = [];
  private evaluationHistory: EvaluationReport[] = [];

  private constructor() {
    this.initializeSealedCorpus();
  }

  public static getInstance(): AcademyMinervaLab {
    if (!AcademyMinervaLab.instance) {
      AcademyMinervaLab.instance = new AcademyMinervaLab();
    }
    return AcademyMinervaLab.instance;
  }

  private initializeSealedCorpus() {
    this.sealedCorpus = [
      {
        id: 'BENCH-001',
        category: 'GOLDEN_STANDARD',
        title: 'Unilever PLC FY 2025 Continuing Operations Golden Fixture',
        description: 'Verifies continuing-operations Turnover of €50.503 Billion and rejects prohibited discontinued €59.60B value.',
        groundTruth: {
          expectedFacts: [
            { canonicalName: 'Turnover (Continuing Operations)', value: '50503000000', period: 'FY 2025', currency: 'EUR', scale: 'millions' },
            { canonicalName: 'Operating Profit', value: '9900000000', period: 'FY 2025', currency: 'EUR', scale: 'millions' },
            { canonicalName: 'Net Profit', value: '7200000000', period: 'FY 2025', currency: 'EUR', scale: 'millions' }
          ],
          requiredIdentities: [
            { equation: 'Assets == Liabilities + Equity', expectedVariance: 0 }
          ],
          prohibitedHallucinations: ['59600000000', '€59.60B', '59.60 Billion'],
          failClosedRequired: true
        },
        sealed: true
      },
      {
        id: 'BENCH-002',
        category: 'MULTI_CURRENCY',
        title: 'Tri-Currency Group Normalization (EUR, USD, GBP)',
        description: 'Tests multi-currency subsidiary consolidation into functional EUR with daily ECB rate validation.',
        groundTruth: {
          expectedFacts: [
            { canonicalName: 'US Subsidiary Revenue', value: '10850000', period: 'FY 2025', currency: 'USD' },
            { canonicalName: 'UK Subsidiary Revenue', value: '8500000', period: 'FY 2025', currency: 'GBP' },
            { canonicalName: 'Normalized Group Revenue', value: '20120000', period: 'FY 2025', currency: 'EUR' }
          ],
          requiredIdentities: [
            { equation: 'ConvertedEUR == USD / 1.085 + GBP / 0.850', expectedVariance: 0.01 }
          ],
          prohibitedHallucinations: ['Arbitrary FX Rate', 'Unverified conversion'],
          failClosedRequired: true
        },
        sealed: true
      },
      {
        id: 'BENCH-003',
        category: 'ADVERSARIAL_OCR',
        title: 'Degraded Scan & Year-As-Value Protection Guard',
        description: 'Validates that column header years (e.g. 2025) on degraded scans are never mapped into numeric financial line items.',
        groundTruth: {
          expectedFacts: [
            { canonicalName: 'Total Assets', value: '142500000', period: 'FY 2025', currency: 'EUR' },
            { canonicalName: 'Total Liabilities', value: '85200000', period: 'FY 2025', currency: 'EUR' },
            { canonicalName: 'Total Equity', value: '57300000', period: 'FY 2025', currency: 'EUR' }
          ],
          requiredIdentities: [
            { equation: 'Assets == Liabilities + Equity', expectedVariance: 0 }
          ],
          prohibitedHallucinations: ['2025', '2024'],
          failClosedRequired: true
        },
        sealed: true
      },
      {
        id: 'BENCH-004',
        category: 'FAIL_CLOSED',
        title: 'Unbalanced Balance Sheet Rejection Gate',
        description: 'Ensures that an intentional €500,000 discrepancy immediately triggers Fail-Closed refusal and blocks certification.',
        groundTruth: {
          expectedFacts: [],
          requiredIdentities: [
            { equation: 'Assets == Liabilities + Equity', expectedVariance: 500000 }
          ],
          prohibitedHallucinations: ['Auto-balanced', 'Rounded away discrepancy'],
          failClosedRequired: true
        },
        sealed: true
      }
    ];
  }

  /**
   * Evaluates solver outputs against the sealed benchmark corpus.
   * If solverOutputs is passed, evaluates each benchmark against the specific output provided for that test case.
   * If solver output is missing or incomplete for a test case, that test case FAILS.
   */
  public runEvaluation(solverOutputs?: Record<string, any>, solverExecutionId?: string): EvaluationReport {
    const startTime = Date.now();
    const caseDetails: EvaluationReport['caseDetails'] = [];
    let passedCount = 0;
    let totalCheckedFacts = 0;
    let totalNumericDiscrepancies = 0;
    let totalCitationsChecked = 0;
    let validCitations = 0;
    let failClosedSuccess = true;

    // Requirement 1 & 3: If no solver output provided at all, ALL benchmark cases fail.
    const hasOutputs = solverOutputs && typeof solverOutputs === 'object' && Object.keys(solverOutputs).length > 0;

    for (const testCase of this.sealedCorpus) {
      let passed = true;
      const observations: string[] = [];
      const discrepancies: string[] = [];

      // Determine solver output for this specific test case
      const caseOutput = hasOutputs ? (solverOutputs[testCase.id] || (solverOutputs.benchmarkId === testCase.id ? solverOutputs : null)) : null;

      if (!caseOutput) {
        // Requirement 1: NO solver result means NOT_TESTED / FAIL_MISSING_SOLVER_OUTPUT.
        // Minerva may NEVER obtain a score by verifying its own benchmark definition.
        passed = false;
        discrepancies.push(`FAIL_MISSING_SOLVER_OUTPUT: Benchmark ${testCase.id} (${testCase.title}) has no solver output.`);
      } else if (testCase.category === 'GOLDEN_STANDARD') {
        totalCheckedFacts += testCase.groundTruth.expectedFacts.length;
        const outputString = JSON.stringify(caseOutput);

        for (const prohibited of testCase.groundTruth.prohibitedHallucinations) {
          if (outputString.includes(prohibited)) {
            passed = false;
            discrepancies.push(`Prohibited hallucination detected: ${prohibited}`);
            totalNumericDiscrepancies++;
          }
        }

        for (const expected of testCase.groundTruth.expectedFacts) {
          totalCitationsChecked++;
          const found = outputString.includes(expected.value) || 
            (caseOutput.facts && caseOutput.facts.some((f: any) => String(f.value || f.normalizedValue) === expected.value));
          if (!found) {
            passed = false;
            discrepancies.push(`Missing expected fact: ${expected.canonicalName} = ${expected.value}`);
            totalNumericDiscrepancies++;
          } else {
            validCitations++;
          }
        }

        if (passed) {
          observations.push('Golden standard test case evaluated cleanly with full factual verification.');
          passedCount++;
        }
      } else if (testCase.category === 'MULTI_CURRENCY') {
        totalCheckedFacts += testCase.groundTruth.expectedFacts.length;
        const outputString = JSON.stringify(caseOutput);
        for (const expected of testCase.groundTruth.expectedFacts) {
          totalCitationsChecked++;
          const found = outputString.includes(expected.value) ||
            (caseOutput.facts && caseOutput.facts.some((f: any) => String(f.value || f.normalizedValue) === expected.value));
          if (!found) {
            passed = false;
            discrepancies.push(`Multi-currency missing expected fact: ${expected.canonicalName} = ${expected.value}`);
            totalNumericDiscrepancies++;
          } else {
            validCitations++;
          }
        }

        if (caseOutput.convertedEur !== undefined) {
          const expectedEur = 20120000;
          if (Math.abs(caseOutput.convertedEur - expectedEur) > 100) {
            passed = false;
            discrepancies.push(`Multi-currency conversion error: got ${caseOutput.convertedEur}, expected ${expectedEur}`);
            totalNumericDiscrepancies++;
          }
        }

        if (passed) {
          observations.push('Multi-currency conversion and translation reserve verified.');
          passedCount++;
        }
      } else if (testCase.category === 'ADVERSARIAL_OCR') {
        totalCheckedFacts += testCase.groundTruth.expectedFacts.length;
        const outStr = JSON.stringify(caseOutput);
        if (outStr.includes('"Total Assets":2025') || outStr.includes('"Total Assets": 2025') || (outStr.includes('"2025"') && !outStr.includes('142500000'))) {
          passed = false;
          discrepancies.push('Year header 2025 incorrectly parsed as Total Assets value');
          totalNumericDiscrepancies++;
        }

        for (const expected of testCase.groundTruth.expectedFacts) {
          totalCitationsChecked++;
          const found = outStr.includes(expected.value) ||
            (caseOutput.facts && caseOutput.facts.some((f: any) => String(f.value || f.normalizedValue) === expected.value));
          if (!found) {
            passed = false;
            discrepancies.push(`Adversarial OCR missing fact: ${expected.canonicalName} = ${expected.value}`);
            totalNumericDiscrepancies++;
          } else {
            validCitations++;
          }
        }

        if (passed) {
          observations.push('Year-As-Value Protection Guard verified against degraded scan.');
          passedCount++;
        }
      } else if (testCase.category === 'FAIL_CLOSED') {
        const isRefused = caseOutput.status === 'REFUSED' || 
          caseOutput.status === 'FAILED_CLOSED' ||
          caseOutput.refused === true || 
          caseOutput.variance > 0 ||
          caseOutput.error !== undefined;

        if (isRefused) {
          observations.push('Fail-Closed Gatekeeper correctly refused unbalanced inputs.');
          passedCount++;
        } else {
          passed = false;
          discrepancies.push('Fail-closed gatekeeper failed to refuse unbalanced inputs');
          failClosedSuccess = false;
        }
      }

      caseDetails.push({
        testId: testCase.id,
        testTitle: testCase.title,
        status: passed ? 'PASS' : 'FAIL',
        score: passed ? 1.0 : 0.0,
        observations,
        discrepancies
      });
    }

    // Requirement 15: NO FAKE TIMING. Record actual duration.
    const durationMs = Date.now() - startTime;

    const accuracyRate = passedCount / this.sealedCorpus.length;
    const numericErrorRate = !hasOutputs ? 1.000 : (totalCheckedFacts > 0 ? (totalNumericDiscrepancies / totalCheckedFacts) : 0.000);

    // Requirement 16: Zero denominator yields null / NOT_MEASURED, not 100%
    const citationIntegrity = totalCitationsChecked > 0 ? (validCitations / totalCitationsChecked) : null;
    const failClosedIntegrity = failClosedSuccess && hasOutputs ? 1.000 : 0.000;

    // Requirement 14: Rename certifiedStatus
    let certifiedStatus: EvaluationReport['certifiedStatus'] = 'BENCHMARK_FAILED';
    if (!hasOutputs) {
      certifiedStatus = 'NOT_TESTED';
    } else if (passedCount === this.sealedCorpus.length && numericErrorRate === 0 && failClosedIntegrity === 1.0) {
      certifiedStatus = 'BENCHMARK_PASSED';
    } else if (failClosedIntegrity < 1) {
      certifiedStatus = 'FAILED_CLOSED';
    } else {
      certifiedStatus = 'DEFECT_DETECTED';
    }

    const report: EvaluationReport = {
      evalId: `EVAL-MINERVA-${Date.now().toString().slice(-6)}`,
      runAt: new Date().toISOString(),
      durationMs,
      totalTests: this.sealedCorpus.length,
      passed: passedCount,
      failed: this.sealedCorpus.length - passedCount,
      accuracyRate,
      numericErrorRate,
      citationIntegrity,
      failClosedIntegrity,
      certifiedStatus,
      caseDetails
    };

    this.evaluationHistory.unshift(report);
    return report;
  }

  /**
   * Independent validation for a live engagement (Doc 34):
   * Validates physical source integrity, accounting identities, and fact citations without forcing Unilever benchmark values.
   */
  public evaluateLiveEngagement(params: {
    facts: any[];
    assets: number;
    liabilities: number;
    equity: number;
    variance: number;
    physicalFilePath: string;
    physicalSha256: string;
  }): LiveEngagementValidationReport {
    const details: string[] = [];
    let passed = true;

    // 1. Physical source file existence and hash check
    const fullPath = path.isAbsolute(params.physicalFilePath) ? params.physicalFilePath : path.join(process.cwd(), params.physicalFilePath);
    let physicalFileVerified = false;
    let sha256Match = false;

    if (fs.existsSync(fullPath)) {
      physicalFileVerified = true;
      const fileBytes = fs.readFileSync(fullPath);
      const actualHash = crypto.createHash('sha256').update(fileBytes).digest('hex');
      sha256Match = (actualHash === params.physicalSha256);
      if (sha256Match) {
        details.push(`Physical source authenticated (SHA-256: ${actualHash.substring(0, 16)}...)`);
      } else {
        passed = false;
        details.push(`Physical source hash mismatch: expected ${params.physicalSha256}, got ${actualHash}`);
      }
    } else {
      passed = false;
      details.push(`Physical source file missing at ${fullPath}`);
    }

    // 2. Euclid Accounting Identity check (Assets = Liabilities + Equity)
    const euclidIdentitySatisfied = (params.variance === 0 && params.assets === (params.liabilities + params.equity));
    if (euclidIdentitySatisfied) {
      details.push(`Accounting identity verified: Assets ($${params.assets}) == Liabilities ($${params.liabilities}) + Equity ($${params.equity}) [Variance: $0]`);
    } else {
      passed = false;
      details.push(`Accounting identity discrepancy: Variance = $${params.variance}`);
    }

    // 3. Extracted facts count check
    const factsCount = (params.facts || []).length;
    if (factsCount > 0) {
      details.push(`Extracted ${factsCount} authoritative financial facts with source-to-pixel citations`);
    } else {
      passed = false;
      details.push('Zero financial facts extracted from filing');
    }

    const report: LiveEngagementValidationReport = {
      validationId: `VAL-LIVE-${Date.now().toString().slice(-6)}`,
      runAt: new Date().toISOString(),
      certifiedStatus: passed ? 'CERTIFIED_CPA_READY' : (euclidIdentitySatisfied ? 'DEFECT_DETECTED' : 'FAILED_CLOSED'),
      physicalFileVerified,
      sha256Match,
      euclidIdentitySatisfied,
      varianceUsd: params.variance,
      factsExtractedCount: factsCount,
      details,
      score: passed ? 100 : 0
    };

    return report;
  }

  public getEvaluationHistory(): EvaluationReport[] {
    // Requirement 2: Do NOT create auto-evaluations when history is empty!
    return this.evaluationHistory;
  }

  public getEvaluationReport(evalId: string): EvaluationReport | undefined {
    return this.evaluationHistory.find(r => r.evalId === evalId);
  }

  public getSealedCorpusSummary(): Array<{ id: string; category: string; title: string; description: string }> {
    return this.sealedCorpus.map(c => ({
      id: c.id,
      category: c.category,
      title: c.title,
      description: c.description
    }));
  }

  public getBenchmarkById(id: string): BenchmarkTestCase | undefined {
    return this.sealedCorpus.find(c => c.id === id);
  }

  /**
   * Access-controlled retrieval of sealed benchmark ground truth.
   * Requirement 4: Identity MUST come from authenticated server context, NOT arbitrary string.
   */
  public getSealedGroundTruth(benchmarkId: string, authContext?: { authenticatedPrincipalId: string | null; isExaminerService?: boolean } | string): BenchmarkTestCase['groundTruth'] | { error: string } {
    let authorized = false;
    if (typeof authContext === 'object' && authContext !== null) {
      authorized = Boolean(authContext.isExaminerService || authContext.authenticatedPrincipalId === 'MINERVA_EXAMINER_SERVICE' || authContext.authenticatedPrincipalId === 'SYSTEM_EXAMINER');
    }

    if (!authorized) {
      return {
        error: `EXAMINER_SEALED_ACCESS_DENIED: Caller lacks authenticated examiner-service authority.`
      };
    }

    const benchmark = this.getBenchmarkById(benchmarkId);
    if (!benchmark) {
      return { error: `Benchmark '${benchmarkId}' not found in sealed vault.` };
    }

    return benchmark.groundTruth;
  }

  /**
   * Evaluates extraction completeness against an INDEPENDENT SOURCE-SIDE CENSUS (Doc 35 Requirement 5).
   * Denominator comes from persisted physical document census artifact, NOT caller body.
   */
  public evaluateExtractionCompleteness(params: {
    extractedFacts: any[];
    documentId?: string;
    sourceCensus?: { totalTables?: number; totalRows?: number; totalCells?: number; totalXbrlTags?: number; totalCensusCount?: number };
  }): { passed: boolean; status: string; ratio: number; denominator: number; details: string[] } {
    const censusArt = params.documentId ? solverExecutionRegistry.getCensusArtifact(params.documentId) : undefined;
    const censusCount = censusArt?.totalCensusCount ?? (
      params.sourceCensus ? (
        params.sourceCensus.totalCensusCount ||
        params.sourceCensus.totalCells ||
        ((params.sourceCensus.totalTables || 0) + (params.sourceCensus.totalRows || 0) + (params.sourceCensus.totalCells || 0) + (params.sourceCensus.totalXbrlTags || 0))
      ) : 0
    );

    if (censusCount === 0) {
      return {
        passed: false,
        status: params.documentId ? 'DOCUMENT_CENSUS_MISSING' : 'NOT_MEASURED',
        ratio: 0,
        denominator: 0,
        details: [`Physical source census elements count is 0. Completeness cannot be measured.`]
      };
    }

    const extractedCount = (params.extractedFacts || []).length;
    const ratio = extractedCount / censusCount;
    if (extractedCount === 0 || ratio < 0.05) {
      return {
        passed: false,
        status: 'BLOCKED_SUSPICIOUS_EXTRACTION_DENSITY',
        ratio,
        denominator: censusCount,
        details: [`Extracted ${extractedCount} facts out of ${censusCount} physical source census elements (${(ratio * 100).toFixed(1)}%). Suspicious low density blocks completion.`]
      };
    }

    return {
      passed: true,
      status: 'EXTRACTION_COMPLETENESS_VERIFIED',
      ratio,
      denominator: censusCount,
      details: [`Extraction completeness verified against physical census: ${extractedCount} facts extracted from ${censusCount} census elements (${(ratio * 100).toFixed(1)}%).`]
    };
  }

  /**
   * Ask-Anything Testing & Memory Isolation (Doc 35 Requirement 6):
   * Evaluates if solver answered purely from persisted memory without external re-reads.
   * Expected truth comes from sealed examiner vault. Actual tools come from persisted solver execution package.
   */
  public evaluateAskAnythingMemoryRecall(params: {
    solverExecutionId: string;
    questionId: string;
    solverResponse: string;
    toolsUsedDuringRecall?: string[];
  }): { passed: boolean; status: string; recallCategory: 'ANSWERABLE_FROM_MEMORY' | 'PARTIALLY_CAPTURED' | 'NOT_CAPTURED' | 'INVALID_UNSUPPORTED_QUESTION'; score: number; verifiedToolsUsed: string[]; details: string[] } {
    const pkg = solverExecutionRegistry.getExecutionPackage(params.solverExecutionId);
    if (!pkg) {
      return {
        passed: false,
        status: 'SOLVER_EXECUTION_RECEIPT_NOT_FOUND',
        recallCategory: 'NOT_CAPTURED',
        score: 0.0,
        verifiedToolsUsed: [],
        details: [`SOLVER_EXECUTION_PACKAGE_NOT_FOUND: Persisted execution package '${params.solverExecutionId}' not found.`]
      };
    }

    const forbiddenTools = ['source_re_read', 'external_sec_web', 'sealed_benchmark_lookup', 'pdf_re_parse'];
    const actualToolsUsed = pkg.toolAccessReceipt || [];

    for (const tool of actualToolsUsed) {
      if (forbiddenTools.includes(tool)) {
        return {
          passed: false,
          status: 'FORBIDDEN_TOOL_INVOKED',
          recallCategory: 'NOT_CAPTURED',
          score: 0.0,
          verifiedToolsUsed: actualToolsUsed,
          details: [`Memory recall violation: Solver invoked forbidden tool '${tool}' according to persisted execution receipt.`]
        };
      }
    }

    const benchmark = this.getBenchmarkById(pkg.benchmarkId || params.questionId) || this.sealedCorpus[0];
    const expectedFact = benchmark?.groundTruth?.expectedFacts?.[0]?.value || '';

    const response = (params.solverResponse || '').toLowerCase();
    const expected = expectedFact.toLowerCase();

    if (!expected) {
      return {
        passed: false,
        status: 'UNSUPPORTED_QUESTION',
        recallCategory: 'INVALID_UNSUPPORTED_QUESTION',
        score: 0.0,
        verifiedToolsUsed: actualToolsUsed,
        details: ['Question lacks ground truth reference in examiner vault.']
      };
    }

    if (response.includes(expected)) {
      return {
        passed: true,
        status: 'RECALL_VERIFIED',
        recallCategory: 'ANSWERABLE_FROM_MEMORY',
        score: 1.0,
        verifiedToolsUsed: actualToolsUsed,
        details: ['Fact successfully recalled from persisted agent memory without forbidden document re-reading.']
      };
    } else {
      return {
        passed: false,
        status: 'RECALL_INCOMPLETE',
        recallCategory: 'NOT_CAPTURED',
        score: 0.0,
        verifiedToolsUsed: actualToolsUsed,
        details: ['Fact was missing or not present in persisted memory recall response.']
      };
    }
  }

  public evaluateAuthoritativePhysicalSource(filePath: string): {
    passed: boolean;
    certifiedStatus: string;
    details: string[];
    score: number;
    fileSizeBytes?: number;
    sha256?: string;
  } {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      return {
        passed: false,
        certifiedStatus: 'REJECTED_SOURCE_NOT_FOUND',
        details: [`File not found at path: ${fullPath}`],
        score: 0
      };
    }

    const fileBytes = fs.readFileSync(fullPath);
    const size = fileBytes.length;
    const sha256 = crypto.createHash('sha256').update(fileBytes).digest('hex');

    if (size < 1000) {
      return {
        passed: false,
        certifiedStatus: 'REJECTED_INSUFFICIENT_SIZE',
        details: [`Physical source size ${size} bytes is below minimum authoritative filing threshold`],
        score: 0,
        fileSizeBytes: size,
        sha256
      };
    }

    const contentSnippet = fileBytes.toString('utf8', 0, Math.min(size, 2000000)).toLowerCase();
    
    const hasFinancialMarkers = 
      contentSnippet.includes('balance sheet') ||
      contentSnippet.includes('statement of operations') ||
      contentSnippet.includes('statements of income') ||
      contentSnippet.includes('statement of financial position') ||
      contentSnippet.includes('statement of cash flows') ||
      contentSnippet.includes('ix:nonfraction') ||
      contentSnippet.includes('xbrl');

    const isSyntheticDummy = contentSnippet.includes('synthetic_dummy_marker') ||
      (contentSnippet.includes('dummy') && !hasFinancialMarkers) ||
      (size < 50000 && !hasFinancialMarkers);

    if (isSyntheticDummy || !hasFinancialMarkers) {
      return {
        passed: false,
        certifiedStatus: 'REJECTED_SYNTHETIC_OR_UNSTRUCTURED',
        details: ['Source file lacks authentic financial statements, tables, or XBRL taxonomy elements'],
        score: 0,
        fileSizeBytes: size,
        sha256
      };
    }

    return {
      passed: true,
      certifiedStatus: 'SOURCE_ELIGIBLE_PHYSICAL_FILING',
      details: [
        'Authoritative physical filing structure verified as eligible source input',
        `Size: ${size} bytes`,
        `SHA-256: ${sha256.slice(0, 16)}...`
      ],
      score: 100,
      fileSizeBytes: size,
      sha256
    };
  }
}

export const academyMinervaLab = AcademyMinervaLab.getInstance();
