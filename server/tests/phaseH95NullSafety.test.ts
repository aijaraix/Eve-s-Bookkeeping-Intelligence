import { extractBankStatementFromDocument } from '../bankStatementExtractor.js';
import { AccountingValidationEngine } from '../accountingValidationEngine.js';
import { ReviewerEngine } from '../reviewerEngine.js';
import { DiagnosticsEngine } from '../diagnosticsEngine.js';
import { amountAppearsInSourceBlock } from '../failClosedGuards.js';
import { normalizeFinancialValue } from '../forensicExtractionEngine.js';
import { AnyDocParser } from '../../src/lib/parser/anydocParser.js';

export async function runPhaseH95NullSafetyTests(): Promise<{ total: number; passed: number; failures: string[] }> {
  const failures: string[] = [];
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] ${testName}`);
    } else {
      const msg = `${testName} - ${detail || "Assertion failed"}`;
      failures.push(msg);
      console.error(`  [FAIL] ${msg}`);
    }
  }

  console.log("\n=======================================================");
  console.log("RUNNING PHASE H.9.5 NULL-SAFETY & MALFORMED INPUT SUITE");
  console.log("=======================================================\n");

  // Test 1: Null/undefined bank statement document inputs
  try {
    const nullDocRes = extractBankStatementFromDocument({
      doc: { markdown: null, sections: null } as any,
      workspaceId: 'ws-null',
      documentId: 'doc-null',
      filename: undefined as any,
      currency: null as any
    });
    assert(
      nullDocRes.success === false && nullDocRes.facts.length === 0,
      "Test 1: Null document / filename in bank statement extractor returns failure without throwing",
      `Got success=${nullDocRes.success}, facts=${nullDocRes.facts.length}`
    );
  } catch (e: any) {
    assert(false, "Test 1: Null document in bank statement extractor", e.message);
  }

  // Test 2: Null/undefined reporting period & metric key in Accounting Validation
  try {
    const mockValidationResult = AccountingValidationEngine.validateWorkspace('ws-null', [
      {
        id: 'f1',
        workspaceId: 'ws-null',
        documentId: 'doc-1',
        canonicalMetric: null as any,
        reportingPeriod: undefined as any,
        normalizedValue: 100,
        currency: 'EUR'
      } as any
    ]);
    assert(
      mockValidationResult !== null,
      "Test 2: Null reportingPeriod and canonicalMetric in AccountingValidationEngine safely handled",
      "AccountingValidationEngine handled nulls without throwing"
    );
  } catch (e: any) {
    assert(false, "Test 2: AccountingValidationEngine null handling", e.message);
  }

  // Test 3: Null/undefined category keys in ReviewerEngine
  try {
    const coverage = ReviewerEngine.getExtractionCoverageReview({
      facts: [
        { id: 'f1', category: null, labelOriginal: undefined, valueOriginal: null }
      ]
    });
    assert(
      coverage !== null && typeof coverage === 'object',
      "Test 3: Null category and label in ReviewerEngine safely handled",
      "ReviewerEngine handled nulls without throwing"
    );
  } catch (e: any) {
    assert(false, "Test 3: ReviewerEngine null handling", e.message);
  }

  // Test 4: Null/undefined metric keys in DiagnosticsEngine
  try {
    const conflicts = DiagnosticsEngine.detectConflicts('ws-null', [
      { id: 'f1', canonicalMetric: null, reportingPeriod: undefined, normalizedValue: 100 } as any
    ]);
    assert(
      Array.isArray(conflicts),
      "Test 4: Null canonicalMetric and reportingPeriod in DiagnosticsEngine handled safely",
      `Returned ${conflicts.length} conflicts`
    );
  } catch (e: any) {
    assert(false, "Test 4: DiagnosticsEngine null handling", e.message);
  }

  // Test 5: Null/undefined inputs in failClosedGuards amountAppearsInSourceBlock
  try {
    const appears1 = amountAppearsInSourceBlock(null as any, "Source block containing 100");
    const appears2 = amountAppearsInSourceBlock("100", null as any);
    const appears3 = amountAppearsInSourceBlock(undefined as any, undefined as any);
    assert(
      appears1 === false && appears2 === false && appears3 === false,
      "Test 5: Null/undefined rawValue or sourceText in amountAppearsInSourceBlock safely returns false without throwing",
      `Null rawValue=${appears1}, Null sourceText=${appears2}, Both null=${appears3}`
    );
  } catch (e: any) {
    assert(false, "Test 5: FailClosedGuards null handling", e.message);
  }

  // Test 6: Null/undefined text in normalizeFinancialValue
  try {
    const norm = normalizeFinancialValue({
      rawNumericValue: null as any,
      tableScale: undefined as any,
      currency: null as any,
      contextText: undefined as any
    });
    assert(
      norm.normalizedBaseValue === null,
      "Test 6: Null rawNumericValue in normalizeFinancialValue safely returns null base value without manufacturing facts",
      `Got normalizedBaseValue=${norm.normalizedBaseValue}`
    );
  } catch (e: any) {
    assert(false, "Test 6: ForensicExtractionEngine null handling", e.message);
  }

  // Test 7: AnyDocParser null/undefined file attributes
  try {
    const parser = new AnyDocParser();
    const parsed = await parser.parse({
      filename: null as any,
      originalName: undefined as any,
      buffer: Buffer.from("Clean text without crash"),
      size: 24,
      mimeType: "text/plain"
    });
    assert(
      parsed !== null && parsed.source !== undefined && parsed.metadata.entityName !== undefined,
      "Test 7: AnyDocParser safely handles null filename/originalName without throwing",
      `Got format=${parsed.source.format}, entityName=${parsed.metadata.entityName}`
    );
  } catch (e: any) {
    assert(false, "Test 7: AnyDocParser null handling", e.message);
  }

  return { total, passed, failures };
}
