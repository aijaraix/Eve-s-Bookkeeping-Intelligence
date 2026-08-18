/**
 * PHASE H.6.3 — ADVERSARIAL REGRESSION SUITE
 * Live-Path Canonical Authority, Scale Lineage & Readiness Truth Hardening
 */

import { normalizeFinancialValue } from "../forensicExtractionEngine.js";
import { CanonicalFactResolver } from "../canonicalFactResolver.js";
import { SourceAuthorityRanker } from "../sourceAuthorityRanker.js";
import { AccountingValidationEngine } from "../accountingValidationEngine.js";
import { ExtractedFact } from "../../src/types.js";

export function runPhaseH63AdversarialTests(): { name: string; passed: boolean; message: string }[] {
  const results: { name: string; passed: boolean; message: string }[] = [];

  function recordTest(name: string, condition: boolean, message: string) {
    results.push({ name, passed: condition, message });
  }

  // TEST 1: Universal Normalization Contract & Double-Scaling Immunity
  try {
    const res1 = normalizeFinancialValue({
      rawNumericValue: "50.503 billion",
      tableScale: 1_000_000_000,
      docLanguage: "en"
    });

    const isTest1Passed = res1.normalizedBaseValue === 50_503_000_000 && res1.scaleMultiplier === 1_000_000_000 && !res1.isAmbiguous;
    recordTest(
      "Test 1: Universal Normalization Single-Scaling & Double-Scale Immunity",
      isTest1Passed,
      isTest1Passed
        ? "Explicit string '50.503 billion' with tableScale=1B resolved to 50,503,000,000 without double multiplication."
        : `Failed: normalizedBaseValue = ${res1.normalizedBaseValue}, scaleMultiplier = ${res1.scaleMultiplier}`
    );
  } catch (err: any) {
    recordTest("Test 1: Universal Normalization Single-Scaling & Double-Scale Immunity", false, err.message);
  }

  // TEST 2: Normalization Trace & Scale Source Logging
  try {
    const res2 = normalizeFinancialValue({
      rawNumericValue: "11,794",
      tableScale: "Millions",
      docLanguage: "en"
    });

    const isTest2Passed = res2.normalizedBaseValue === 11_794_000_000 && res2.scaleMultiplier === 1_000_000 && res2.scaleSource === "TABLE_HEADER";
    recordTest(
      "Test 2: Table Scale Normalization & Lineage Trace",
      isTest2Passed,
      isTest2Passed
        ? "Raw '11,794' with tableScale='Millions' scaled to 11,794,000,000 with scaleSource='TABLE_HEADER'."
        : `Failed: val=${res2.normalizedBaseValue}, scaleMultiplier=${res2.scaleMultiplier}, scaleSource=${res2.scaleSource}`
    );
  } catch (err: any) {
    recordTest("Test 2: Table Scale Normalization & Lineage Trace", false, err.message);
  }

  // TEST 3: Absolute Primary Statement Source Authority (Tier 1 vs Tier 5 Narrative)
  try {
    const tier1Fact = {
      id: "fct-tier1-1",
      documentId: "doc-1",
      workspaceId: "ws-test",
      sourceDocument: "annual_report.pdf",
      pageNumber: 85,
      statementType: "income_statement",
      tableName: "Consolidated Income Statement",
      rowLabel: "Turnover",
      columnLabel: "2025",
      rawText: "Turnover: 50,503 (in € millions)",
      valueOriginal: "50,503",
      normalizedValue: 50_503_000_000,
      currencyOriginal: "EUR",
      unitScale: "Millions",
      reportingPeriod: "2025-FY",
      canonicalMetric: "revenue",
      confidence: 0.98,
      status: "APPROVED",
      verificationStatus: "VERIFIED"
    } as unknown as ExtractedFact;

    const tier5Fact = {
      id: "fct-tier5-1",
      documentId: "doc-1",
      workspaceId: "ws-test",
      sourceDocument: "annual_report.pdf",
      pageNumber: 12,
      statementType: "narrative",
      tableName: "Executive Summary Prose",
      rowLabel: "Group Sales Mention",
      columnLabel: "2025",
      rawText: "Group turnover for the year reached 52 billion euros narrative quote",
      valueOriginal: "52,000",
      normalizedValue: 52_000_000_000,
      currencyOriginal: "EUR",
      unitScale: "Millions",
      reportingPeriod: "2025-FY",
      canonicalMetric: "revenue",
      confidence: 0.85,
      status: "APPROVED",
      verificationStatus: "VERIFIED"
    } as unknown as ExtractedFact;

    const res3 = CanonicalFactResolver.resolveMetric([tier1Fact, tier5Fact], "revenue", "2025-FY");
    const isTest3Passed = res3.primaryFact?.id === "fct-tier1-1" && res3.normalizedScalarValue === 50_503_000_000;
    recordTest(
      "Test 3: Tier 1 Primary Income Statement Row Beats Tier 5 Narrative Mention",
      isTest3Passed,
      isTest3Passed
        ? "Tier 1 Consolidated Income Statement row (50.503B) successfully defeated Tier 5 narrative mention (52B)."
        : `Failed: primaryFactId=${res3.primaryFact?.id}, val=${res3.normalizedScalarValue}`
    );
  } catch (err: any) {
    recordTest("Test 3: Tier 1 Primary Income Statement Row Beats Tier 5 Narrative Mention", false, err.message);
  }

  // TEST 4: Tier 1/2 Candidates Strictly Disqualify Tier 4-6 Candidates
  try {
    const tier1Fact = {
      id: "fct-t1-netinc",
      documentId: "doc-1",
      workspaceId: "ws-test",
      sourceDocument: "annual_report.pdf",
      pageNumber: 86,
      statementType: "income_statement",
      tableName: "Consolidated Income Statement",
      rowLabel: "Net Income",
      columnLabel: "2025",
      rawText: "Net Income for the period: 11,794",
      valueOriginal: "11,794",
      normalizedValue: 11_794_000_000,
      currencyOriginal: "EUR",
      unitScale: "Millions",
      reportingPeriod: "2025-FY",
      canonicalMetric: "net_income",
      confidence: 0.99,
      status: "APPROVED",
      verificationStatus: "VERIFIED"
    } as unknown as ExtractedFact;

    const tier4Fact = {
      id: "fct-t4-mda",
      documentId: "doc-1",
      workspaceId: "ws-test",
      sourceDocument: "annual_report.pdf",
      pageNumber: 25,
      statementType: "narrative",
      tableName: "Strategic Report MD&A",
      rowLabel: "Adjusted Net Profit KPI",
      columnLabel: "2025",
      rawText: "Adjusted Net Profit KPI in MD&A section: 12,500 million",
      valueOriginal: "12,500",
      normalizedValue: 12_500_000_000,
      currencyOriginal: "EUR",
      unitScale: "Millions",
      reportingPeriod: "2025-FY",
      canonicalMetric: "net_income",
      confidence: 0.90,
      status: "APPROVED",
      verificationStatus: "VERIFIED"
    } as unknown as ExtractedFact;

    const res4 = CanonicalFactResolver.resolveMetric([tier1Fact, tier4Fact], "net_income", "2025-FY");
    const isTest4Passed = res4.primaryFact?.id === "fct-t1-netinc" && !res4.alternativeFacts.some(f => f.id === "fct-t4-mda" && SourceAuthorityRanker.rankFactAuthority(f).tier >= 4);
    recordTest(
      "Test 4: Tier 1 Disqualifies Tier 4-6 Non-Primary Candidates",
      isTest4Passed,
      isTest4Passed
        ? "Tier 1 primary Net Income row selected and Tier 4 MD&A candidate was disqualified from winning canonical authority."
        : `Failed: selectedId=${res4.primaryFact?.id}`
    );
  } catch (err: any) {
    recordTest("Test 4: Tier 1 Disqualifies Tier 4-6 Non-Primary Candidates", false, err.message);
  }

  // TEST 5: Customer Readiness Gate 5 Scale Failure Protection
  try {
    const unscaledProposedFact = {
      id: "fct-unscaled-rev",
      documentId: "doc-1",
      workspaceId: "ws-test",
      sourceDocument: "doc.pdf",
      pageNumber: 10,
      statementType: "income_statement",
      tableName: "Income Statement",
      rowLabel: "Revenue",
      valueOriginal: "50,503",
      normalizedValue: 50503, // Unscaled integer!
      currencyOriginal: "EUR",
      unitScale: "—", // Scale ambiguity!
      reportingPeriod: "2025-FY",
      canonicalMetric: "revenue",
      status: "PROPOSED",
      verificationStatus: "UNVERIFIED"
    } as unknown as ExtractedFact;

    const readinessRes = AccountingValidationEngine.evaluateCustomerReadiness("ws-test", [unscaledProposedFact]);
    const isTest5Passed = !readinessRes.isReady && readinessRes.readinessState === "DATA_VERIFICATION_REQUIRED" && !readinessRes.checks.scaleUnambiguous;
    recordTest(
      "Test 5: Readiness Gate 5 Fails when Critical Metric has Scale Ambiguity or is Unscaled",
      isTest5Passed,
      isTest5Passed
        ? "evaluateCustomerReadiness correctly returned scaleUnambiguous=false and readinessState='DATA_VERIFICATION_REQUIRED'."
        : `Failed: isReady=${readinessRes.isReady}, state=${readinessRes.readinessState}, scaleUnambiguous=${readinessRes.checks.scaleUnambiguous}`
    );
  } catch (err: any) {
    recordTest("Test 5: Readiness Gate 5 Fails when Critical Metric has Scale Ambiguity or is Unscaled", false, err.message);
  }

  // TEST 6: Blocked Fact Display Immunity in Customer Surface
  try {
    const proposedUnverifiedFact = {
      id: "fct-prop-1",
      documentId: "doc-1",
      workspaceId: "ws-test",
      sourceDocument: "doc.pdf",
      pageNumber: 12,
      statementType: "income_statement",
      tableName: "Income Statement",
      rowLabel: "Revenue",
      valueOriginal: "50,503",
      normalizedValue: 50503,
      currencyOriginal: "EUR",
      unitScale: "Millions",
      reportingPeriod: "2025-FY",
      canonicalMetric: "revenue",
      status: "PROPOSED",
      verificationStatus: "UNVERIFIED"
    } as unknown as ExtractedFact;

    const res6 = CanonicalFactResolver.resolveMetric([proposedUnverifiedFact], "revenue", "2025-FY");
    const isTest6Passed = res6.primaryFact === null && res6.normalizedScalarValue === null && res6.formattedValue === "—";
    recordTest(
      "Test 6: PROPOSED Unverified Facts Blocked From Customer Canonical Winner Output",
      isTest6Passed,
      isTest6Passed
        ? "resolveMetric returned primaryFact=null and formattedValue='—' for PROPOSED unverified fact."
        : `Failed: primaryFact=${res6.primaryFact}, formattedValue=${res6.formattedValue}`
    );
  } catch (err: any) {
    recordTest("Test 6: PROPOSED Unverified Facts Blocked From Customer Canonical Winner Output", false, err.message);
  }

  // TEST 7: Primary Cash Flow Statement Resolver Priority
  try {
    const primaryCashFlowFact = {
      id: "fct-cf-primary",
      documentId: "doc-1",
      workspaceId: "ws-test",
      sourceDocument: "report.pdf",
      pageNumber: 88,
      statementType: "cash_flow",
      tableName: "Consolidated Statement of Cash Flows",
      rowLabel: "Net cash flow from operating activities",
      valueOriginal: "10,772",
      normalizedValue: 10_772_000_000,
      currencyOriginal: "EUR",
      unitScale: "Millions",
      reportingPeriod: "2025-FY",
      canonicalMetric: "operating_cash_flow",
      status: "APPROVED",
      verificationStatus: "VERIFIED"
    } as unknown as ExtractedFact;

    const noteReconciliationFact = {
      id: "fct-cf-note",
      documentId: "doc-1",
      workspaceId: "ws-test",
      sourceDocument: "report.pdf",
      pageNumber: 120,
      statementType: "note",
      tableName: "Note 24 - Reconciliation of Operating Profit to Operating Cash Flow",
      rowLabel: "Operating Cash Flow before working capital",
      valueOriginal: "11,200",
      normalizedValue: 11_200_000_000,
      currencyOriginal: "EUR",
      unitScale: "Millions",
      reportingPeriod: "2025-FY",
      canonicalMetric: "operating_cash_flow",
      status: "APPROVED",
      verificationStatus: "VERIFIED"
    } as unknown as ExtractedFact;

    const res7 = CanonicalFactResolver.resolveMetric([primaryCashFlowFact, noteReconciliationFact], "operating_cash_flow", "2025-FY");
    const isTest7Passed = res7.primaryFact?.id === "fct-cf-primary" && res7.normalizedScalarValue === 10_772_000_000;
    recordTest(
      "Test 7: Primary Cash Flow Statement Line Item Beats Note Reconciliation Item",
      isTest7Passed,
      isTest7Passed
        ? "Primary Statement of Cash Flows row (10.772B) successfully beat Note 24 reconciliation item (11.2B)."
        : `Failed: selectedId=${res7.primaryFact?.id}, val=${res7.normalizedScalarValue}`
    );
  } catch (err: any) {
    recordTest("Test 7: Primary Cash Flow Statement Line Item Beats Note Reconciliation Item", false, err.message);
  }

  return results;
}
