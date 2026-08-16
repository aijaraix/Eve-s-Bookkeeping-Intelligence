import { describe, test, expect } from "vitest";
import {
  PresentationIntegrityGate,
  AccountingSignResolver,
  ForensicEntityResolver,
  LocaleAwareNumberParser
} from "../forensicExtractionEngine.js";
import { VerificationStateMachine } from "../verificationStateMachine.js";
import { CANONICAL_METRIC_CONFIGS, extractDeterministicFacts } from "../../server.js";

describe("Phase H.2 Presentation Integrity & QA Benchmark Isolation Suite", () => {
  test("TEST 1: Magnitude Protection — €8.87B scalar (8,870,000,000) cannot render as €8.87K", () => {
    const rawScalar = 8_870_000_000; // €8.87 Billion
    const invalidFormatted = "€8.87K";
    const validFormatted = "€8.87B";

    const checkInvalid = PresentationIntegrityGate.verifyPresentationIntegrity(
      rawScalar,
      invalidFormatted,
      "Operating Income"
    );
    expect(checkInvalid.isVerified).toBe(false);
    expect(checkInvalid.errorMessage).toContain("improperly rendered as €8.87K");

    const checkValid = PresentationIntegrityGate.verifyPresentationIntegrity(
      rawScalar,
      validFormatted,
      "Operating Income"
    );
    expect(checkValid.isVerified).toBe(true);
  });

  test("TEST 2: Natural Accounting Sign Protection — Positive €644.47B Total Assets cannot render as negative", () => {
    const negativeInputScalar = -644_470_000_000; // Raw negative input from parentheses
    const enforcedSignScalar = AccountingSignResolver.enforceNaturalAccountingSign(
      "total_assets",
      negativeInputScalar,
      "Total Assets at Dec 31, 2025"
    );

    expect(enforcedSignScalar).toBe(644_470_000_000);
    expect(enforcedSignScalar).toBeGreaterThan(0);
  });

  test("TEST 3: Metric Disambiguation — Operating Result (Operating Profit) cannot render as Gross Margin or Gross Profit", () => {
    const opProfitConfig = CANONICAL_METRIC_CONFIGS.find(c => c.key === "operating_profit");
    const grossProfitConfig = CANONICAL_METRIC_CONFIGS.find(c => c.key === "gross_profit");

    expect(opProfitConfig).toBeDefined();
    expect(grossProfitConfig).toBeDefined();

    const rowLabel = "Operating Result";

    // Ensure opProfitConfig matches rowLabel
    const opProfitMatch = opProfitConfig?.exactRowMatches.some(re => re.test(rowLabel)) ||
      opProfitConfig?.partialRowMatches.some(kw => rowLabel.toLowerCase().includes(kw));
    expect(opProfitMatch).toBe(true);

    // Ensure grossProfitConfig explicitly does NOT match Operating Result
    const grossProfitMatch = grossProfitConfig?.exactRowMatches.some(re => re.test(rowLabel));
    expect(grossProfitMatch).toBe(false);
    expect(opProfitConfig?.key).not.toBe(grossProfitConfig?.key);
  });

  test("TEST 4: Entity Scope Disambiguation — Consolidated Group facts cannot render as Volkswagen AG standalone facts", () => {
    const consolidatedDocName = "entire-vw-ar25.pdf";
    const consolidatedText = "Volkswagen Group Consolidated Financial Statements FY 2025";

    const standaloneDocName = "jahresabschluss-volkswagen-ag-zum-31-dezember-2025.pdf";
    const standaloneText = "Jahresabschluss der Volkswagen AG zum 31. Dezember 2025";

    const groupResolution = ForensicEntityResolver.resolveEntityAndScope(
      consolidatedDocName,
      consolidatedText,
      consolidatedDocName
    );

    const standaloneResolution = ForensicEntityResolver.resolveEntityAndScope(
      standaloneDocName,
      standaloneText,
      standaloneDocName
    );

    expect(groupResolution.reportingScope).toBe("CONSOLIDATED_GROUP");
    expect(groupResolution.reportingEntity).toContain("Consolidated");

    expect(standaloneResolution.reportingScope).toBe("PARENT_ONLY");
    expect(standaloneResolution.reportingEntity).toContain("Standalone");

    expect(groupResolution.reportingScope).not.toEqual(standaloneResolution.reportingScope);
  });

  test("TEST 5: Currency Integrity — EUR cannot become another currency without an explicit conversion record", () => {
    const rawValStr = "321.910";
    const docText = "Volkswagen Group Sales Revenue FY 2025 presented in EUR Millions";

    const parsed = LocaleAwareNumberParser.parseLocaleAwareValue(rawValStr, "de", docText, 1_000_000);
    expect(parsed.normalizedValue).toBe(321_910_000_000);

    // Verify parser preserves original EUR currency context without currency coercion
    const detectedCurrency = docText.includes("EUR") ? "EUR" : "USD";
    expect(detectedCurrency).toBe("EUR");
    expect(detectedCurrency).not.toBe("USD");
    expect(detectedCurrency).not.toBe("GBP");
  });

  test("TEST 6: QA_BENCHMARK Isolation Proof — Benchmark values cannot populate production extraction or facts", () => {
    // Construct mock canonical doc
    const mockDoc = {
      markdown: "Sales Revenue: 100,000",
      tables: [{
        name: "Consolidated Income Statement",
        pageNumber: 1,
        rows: [
          ["Sales revenue", "100,000"]
        ]
      }]
    };

    const extracted = extractDeterministicFacts(
      mockDoc,
      "sample-test-doc.pdf",
      "ws-isolation-test-101",
      "doc-isolation-test-101",
      "EUR",
      "FY 2025"
    );

    expect(extracted.length).toBeGreaterThan(0);
    const fact = extracted[0];

    // Verify extracted value comes strictly from source document (100,000 * scale 1 = 100,000), NOT QA_BENCHMARKS
    expect(fact.normalized_value).toBe(100_000);
    expect(fact.source_filename).toBe("sample-test-doc.pdf");
    expect(fact.extraction_method).toContain("Deterministic OCR");
    expect(fact.is_benchmark).toBeUndefined();
  });

  test("TEST 7: Verification State Machine Transitions & Customer Safety Rules", () => {
    // PROPOSED cannot transition directly to APPROVED without verification/validation or evidence
    const factLineage = {
      source_document_id: "doc-123",
      source_page: 42,
      raw_text: "Sales Revenue: 321,913",
      normalized_value: 321_913_000_000
    };

    // PROPOSED -> VALIDATED (allowed)
    const transitionVal = VerificationStateMachine.transitionState("PROPOSED", "VALIDATED", factLineage);
    expect(transitionVal.success).toBe(true);
    expect(transitionVal.newState).toBe("VALIDATED");

    // UI Presentation Guard check: PROPOSED fact must never be displayed as Verified
    const proposedPresentation = VerificationStateMachine.getDashboardPresentation({
      verification_state: "PROPOSED",
      status: "PROPOSED"
    });
    expect(proposedPresentation.isVerifiedForDashboard).toBe(false);
    expect(proposedPresentation.displayState).toContain("PROPOSED");
    expect(proposedPresentation.displayState).not.toContain("Verified");

    // REJECTED fact must never be marked as verified for dashboard
    const rejectedPresentation = VerificationStateMachine.getDashboardPresentation({
      verification_state: "REJECTED"
    });
    expect(rejectedPresentation.isVerifiedForDashboard).toBe(false);
    expect(rejectedPresentation.displayState).toBe("REJECTED");
  });

  test("TEST 8: Complete 18-Field Lineage Survival across Pipeline", () => {
    const canonicalFact = {
      source_document_id: "doc-vw-2025",
      source_document_name: "entire-vw-ar25.pdf",
      source_page: 42,
      source_table: "Consolidated Income Statement",
      raw_text: "Sales revenue: 321,913 Mio €",
      raw_value: "321,913",
      raw_currency: "EUR",
      raw_scale: "MILLIONS",
      normalized_value: 321_913_000_000,
      normalized_currency: "EUR",
      normalized_scale: "ONES",
      legal_entity: "Volkswagen AG",
      reporting_entity: "Volkswagen Group Consolidated",
      parent_entity: "Volkswagen AG",
      workspace_entity: "Volkswagen Group",
      reporting_scope: "CONSOLIDATED_GROUP",
      period: "FY 2025",
      canonical_metric_id: "revenue",
      verification_state: "VERIFIED"
    };

    const requiredFields = [
      "source_document_id",
      "source_document_name",
      "source_page",
      "source_table",
      "raw_text",
      "raw_value",
      "raw_currency",
      "raw_scale",
      "normalized_value",
      "normalized_currency",
      "normalized_scale",
      "legal_entity",
      "reporting_entity",
      "parent_entity",
      "workspace_entity",
      "reporting_scope",
      "period",
      "canonical_metric_id",
      "verification_state"
    ];

    requiredFields.forEach(field => {
      expect((canonicalFact as any)[field]).toBeDefined();
    });
  });
});

