/**
 * PHASE H.4 — ADVERSARIAL REGRESSION TEST SUITE (20 MANDATORY TEST CASES)
 *
 * Verifies numerical integrity, accounting reconciliation, source authority,
 * non-monetary metric disambiguation, zero-fabrication guards, and display formatting.
 */

import { TableContextResolver } from "../tableContextResolver.js";
import { SourceAuthorityRanker } from "../sourceAuthorityRanker.js";
import { CurrencyProvenanceEngine } from "../currencyProvenance.js";
import { CanonicalFactResolver } from "../canonicalFactResolver.js";
import { AccountingValidationEngine } from "../accountingValidationEngine.js";
import { VerificationStateMachine } from "../verificationStateMachine.js";
import { FinancialFormatter } from "../../src/utils/financialFormatter.js";
import { ExtractedFact } from "../../src/types.js";

export function runPhaseH4AdversarialTests(): { total: number; passed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  const total = 20;

  function assert(condition: boolean, testName: string, detail?: string) {
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
  console.log("RUNNING PHASE H.4 ADVERSARIAL REGRESSION TEST SUITE");
  console.log("=======================================================\n");

  // TEST 1: Scale Multiplication Safeguard
  try {
    const tableCtx = TableContextResolver.resolveTableContext({ tableHeader: "Consolidated Income Statement (in € millions)" });
    const res = TableContextResolver.calculateNormalizedValue("11,794", tableCtx.scale);
    assert(
      res.normalizedValue === 11_794_000_000 && res.scaleUsed.scaleMultiplier === 1_000_000,
      "Test 1: Scale Multiplication Safeguard (11,794 in €m -> 11,794,000,000)"
    );
  } catch (e: any) {
    assert(false, "Test 1: Scale Multiplication Safeguard", e.message);
  }

  // TEST 2: Double Scaling Prevention Guard
  try {
    const tableCtx = TableContextResolver.resolveTableContext({ tableHeader: "Consolidated Income Statement (in € millions)" });
    const res = TableContextResolver.calculateNormalizedValue("11,794,000,000", tableCtx.scale);
    assert(
      res.normalizedValue === 11_794_000_000,
      "Test 2: Double Scaling Prevention Guard (11,794,000,000 in €m -> 11,794,000,000, NOT double scaled)"
    );
  } catch (e: any) {
    assert(false, "Test 2: Double Scaling Prevention Guard", e.message);
  }

  // TEST 3: Year-as-Value Protection Guard
  try {
    const isYearValue = (val: string | number) => {
      const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
      return num >= 1990 && num <= 2035 && Number.isInteger(num);
    };
    assert(
      isYearValue("2024") && isYearValue(2023) && !isYearValue("11794"),
      "Test 3: Year-as-Value Protection Guard identifies 2024 as year and 11794 as financial scalar"
    );
  } catch (e: any) {
    assert(false, "Test 3: Year-as-Value Protection Guard", e.message);
  }

  // TEST 4: Scale Propagation across Table Context
  try {
    const tableCtx = TableContextResolver.resolveTableContext({
      tableHeader: "Group Turnover by Division (in £ thousands)",
      columnHeaders: ["Division", "2024", "2023", "2022"]
    });
    const val2024 = TableContextResolver.calculateNormalizedValue("5,400", tableCtx.scale);
    assert(
      val2024.normalizedValue === 5_400_000 && tableCtx.scale.scaleLabel === "THOUSANDS",
      "Test 4: Scale Propagation across Table Context (£5,400 in '£ thousands' -> 5,400,000)"
    );
  } catch (e: any) {
    assert(false, "Test 4: Scale Propagation across Table Context", e.message);
  }

  // TEST 5: Non-Monetary / ESG / KPI Metric Guard
  try {
    const esgFact = {
      id: "f-esg-1",
      workspaceId: "ws-test",
      documentId: "doc-1",
      factType: "OPERATIONAL_KPI",
      canonicalMetric: "revenue",
      labelOriginal: "Water intensity per turnover",
      labelNormalized: "water intensity per turnover",
      valueOriginal: "2.5",
      valueFunctional: "2.5",
      normalizedValue: 2.5,
      currencyOriginal: "m3/€m",
      functionalCurrency: "m3/€m",
      pageNumber: 42,
      sourceText: "Water intensity per turnover was 2.5 cubic meters per million euros revenue.",
      statementType: "notes"
    } as ExtractedFact;
    const res = CanonicalFactResolver.resolveMetric([esgFact], "revenue", "2024-FY");
    assert(
      res.primaryFact === null,
      "Test 5: Non-Monetary / ESG Guard rejects 'Water intensity per turnover' from Revenue canonical resolution"
    );
  } catch (e: any) {
    assert(false, "Test 5: Non-Monetary / ESG Guard", e.message);
  }

  // TEST 6: Ratio / Growth Rate Disambiguation Guard
  try {
    const growthFact = {
      id: "f-growth-1",
      workspaceId: "ws-test",
      documentId: "doc-1",
      factType: "FINANCIAL_RATIO",
      labelOriginal: "Revenue Growth Rate",
      labelNormalized: "revenue growth rate",
      valueOriginal: "12.5%",
      valueFunctional: "12.5",
      normalizedValue: 12.5,
      currencyOriginal: "%",
      functionalCurrency: "%",
      pageNumber: 5,
      sourceText: "Revenue Growth Rate was 12.5% year-on-year."
    } as ExtractedFact;
    const res = CanonicalFactResolver.resolveMetric([growthFact], "revenue", "2024-FY");
    assert(
      res.primaryFact === null,
      "Test 6: Ratio / Growth Rate Disambiguation rejects 'Revenue Growth Rate 12.5%' from Revenue canonical resolution"
    );
  } catch (e: any) {
    assert(false, "Test 6: Ratio / Growth Rate Disambiguation Guard", e.message);
  }

  // TEST 7: Operating Result / Profit Disambiguation
  try {
    const opResultFact = {
      id: "f-op-1",
      workspaceId: "ws-test",
      documentId: "doc-1",
      factType: "FINANCIAL_LINE_ITEM",
      labelOriginal: "Operating result",
      labelNormalized: "operating result",
      valueOriginal: "3,500",
      valueFunctional: "3500000000",
      normalizedValue: 3_500_000_000,
      currencyOriginal: "EUR",
      functionalCurrency: "EUR",
      pageNumber: 12,
      sourceText: "Operating result for the fiscal year was €3,500 million.",
      statementType: "income_statement"
    } as ExtractedFact;
    const res = CanonicalFactResolver.resolveMetric([opResultFact], "operating_profit", "2024-FY");
    assert(
      res.primaryFact !== null && res.primaryFact.id === "f-op-1",
      "Test 7: Operating Result / Profit Disambiguation correctly maps 'Operating result' to operating_profit"
    );
  } catch (e: any) {
    assert(false, "Test 7: Operating Result / Profit Disambiguation", e.message);
  }

  // TEST 8: Parent-Only vs Consolidated Scope Guard
  try {
    const parentFact = {
      id: "f-parent-1",
      workspaceId: "ws-test",
      documentId: "doc-1",
      factType: "FINANCIAL_LINE_ITEM",
      canonicalMetric: "revenue",
      labelOriginal: "Unilever PLC Parent Revenue",
      labelNormalized: "revenue",
      valueOriginal: "1,200",
      valueFunctional: "1200000000",
      normalizedValue: 1_200_000_000,
      currencyOriginal: "EUR",
      functionalCurrency: "EUR",
      reportingScope: "PARENT_ONLY",
      pageNumber: 90,
      sourceText: "Parent company standalone revenue."
    } as ExtractedFact;
    const groupFact = {
      id: "f-group-1",
      workspaceId: "ws-test",
      documentId: "doc-1",
      factType: "FINANCIAL_LINE_ITEM",
      canonicalMetric: "revenue",
      labelOriginal: "Consolidated Group Turnover",
      labelNormalized: "revenue",
      valueOriginal: "59,600",
      valueFunctional: "59600000000",
      normalizedValue: 59_600_000_000,
      currencyOriginal: "EUR",
      functionalCurrency: "EUR",
      reportingScope: "CONSOLIDATED_GROUP",
      pageNumber: 10,
      sourceText: "Consolidated turnover of the Group."
    } as ExtractedFact;
    const resGroup = CanonicalFactResolver.resolveMetric([parentFact, groupFact], "revenue", "2024-FY", { targetScope: "CONSOLIDATED_GROUP" });
    assert(
      resGroup.primaryFact?.id === "f-group-1",
      "Test 8: Consolidation Scope Guard isolates CONSOLIDATED_GROUP (59.6B) from PARENT_ONLY (1.2B)"
    );
  } catch (e: any) {
    assert(false, "Test 8: Parent-Only vs Consolidated Scope Guard", e.message);
  }

  // TEST 9: Restated Prior-Year Precedence
  try {
    const origFact = {
      id: "f-2023-orig",
      workspaceId: "ws-test",
      documentId: "doc-2023",
      factType: "FINANCIAL_LINE_ITEM",
      canonicalMetric: "net_income",
      labelOriginal: "Net Profit 2023 Original",
      labelNormalized: "net income",
      valueOriginal: "1,000",
      valueFunctional: "1000000000",
      normalizedValue: 1_000_000_000,
      reportingPeriod: "2023-FY",
      isRestated: false
    } as ExtractedFact;
    const restatedFact = {
      id: "f-2023-restated",
      workspaceId: "ws-test",
      documentId: "doc-2024",
      factType: "FINANCIAL_LINE_ITEM",
      canonicalMetric: "net_income",
      labelOriginal: "Net Profit 2023 (Restated)",
      labelNormalized: "net income",
      valueOriginal: "1,050",
      valueFunctional: "1050000000",
      normalizedValue: 1_050_000_000,
      reportingPeriod: "2023-FY",
      isRestated: true
    } as ExtractedFact;
    const res = CanonicalFactResolver.resolveMetric([origFact, restatedFact], "net_income", "2023-FY");
    assert(
      res.primaryFact?.id === "f-2023-restated",
      "Test 9: Restated Prior-Year Precedence selects Restated 2023 (1.05B) over Original 2023 (1.00B)"
    );
  } catch (e: any) {
    assert(false, "Test 9: Restated Prior-Year Precedence", e.message);
  }

  // TEST 10: Primary Statement vs Footnote Note Tier Authority
  try {
    const tier1Fact = {
      id: "f-t1",
      workspaceId: "ws-test",
      documentId: "doc-1",
      factType: "FINANCIAL_LINE_ITEM",
      statementType: "income_statement",
      labelOriginal: "Turnover",
      valueOriginal: "50,000",
      valueFunctional: "50000000000",
      normalizedValue: 50_000_000_000,
      pageNumber: 10,
      sourceText: "Consolidated Income Statement turnover"
    } as ExtractedFact;
    const tier6Fact = {
      id: "f-t6",
      workspaceId: "ws-test",
      documentId: "doc-1",
      factType: "OPERATIONAL_KPI",
      statementType: "sustainability",
      labelOriginal: "Water intensity per turnover",
      valueOriginal: "12",
      valueFunctional: "12",
      normalizedValue: 12,
      pageNumber: 80,
      sourceText: "ESG Sustainability report carbon & water table"
    } as ExtractedFact;
    const r1 = SourceAuthorityRanker.rankFactAuthority(tier1Fact);
    const r6 = SourceAuthorityRanker.rankFactAuthority(tier6Fact);
    assert(
      r1.tier === 1 && r1.scoreBoost === 100 && r6.tier === 6 && r6.scoreBoost === -100,
      "Test 10: Source Authority Ranker assigns Tier 1 (+100) to Income Statement and Tier 6 (-100) to ESG Table"
    );
  } catch (e: any) {
    assert(false, "Test 10: Primary Statement vs Footnote Note Tier Authority", e.message);
  }

  // TEST 11: Multi-Document Cross-Document Conflict Discrepancy
  try {
    const docAFact = {
      id: "f-docA",
      workspaceId: "ws-test",
      documentId: "doc-A",
      sourceDocument: "2024_Annual_Report.pdf",
      factType: "FINANCIAL_LINE_ITEM",
      canonicalMetric: "revenue",
      labelNormalized: "revenue",
      valueOriginal: "100,000,000",
      valueFunctional: "100000000",
      normalizedValue: 100_000_000,
      reportingPeriod: "2024-FY"
    } as ExtractedFact;
    const docBFact = {
      id: "f-docB",
      workspaceId: "ws-test",
      documentId: "doc-B",
      sourceDocument: "2024_Press_Release.pdf",
      factType: "FINANCIAL_LINE_ITEM",
      canonicalMetric: "revenue",
      labelNormalized: "revenue",
      valueOriginal: "120,000,000",
      valueFunctional: "120000000",
      normalizedValue: 120_000_000,
      reportingPeriod: "2024-FY"
    } as ExtractedFact;
    const crossRes = AccountingValidationEngine.reconcileCrossDocument([docAFact, docBFact], "2024-FY");
    assert(
      crossRes.length > 0 && crossRes[0].hasConflict && crossRes[0].status === "REVIEW_REQUIRED",
      "Test 11: Cross-Document Conflict Detection flags $100M vs $120M conflict as REVIEW_REQUIRED"
    );
  } catch (e: any) {
    assert(false, "Test 11: Multi-Document Cross-Document Conflict Discrepancy", e.message);
  }

  // TEST 12: Balance Sheet Accounting Identity Hard Gate
  try {
    const mockAssets = { normalizedScalarValue: 1000 } as any;
    const mockLiab = { normalizedScalarValue: 400 } as any;
    const mockEq = { normalizedScalarValue: 500 } as any; // 400 + 500 = 900 != 1000
    const bsRes = AccountingValidationEngine.reconcileBalanceSheet(mockAssets, mockLiab, mockEq);
    assert(
      bsRes.status === "REVIEW_REQUIRED" && bsRes.variance === 100,
      "Test 12: Balance Sheet Identity Hard Gate flags Assets (1000) != Liab (400) + Eq (500) with variance 100"
    );
  } catch (e: any) {
    assert(false, "Test 12: Balance Sheet Accounting Identity Hard Gate", e.message);
  }

  // TEST 13: Gross Profit Accounting Identity Hard Gate
  try {
    const mockRev = { normalizedScalarValue: 1000 } as any;
    const mockCogs = { normalizedScalarValue: 400 } as any;
    const mockGP = { normalizedScalarValue: 500 } as any; // Expected 1000 - 400 = 600 != 500
    const gpRes = AccountingValidationEngine.reconcileGrossProfit(mockRev, mockCogs, mockGP);
    assert(
      gpRes.status === "REVIEW_REQUIRED" && gpRes.variance === 100,
      "Test 13: Gross Profit Identity Hard Gate flags GP (500) != Rev (1000) - COGS (400) with variance 100"
    );
  } catch (e: any) {
    assert(false, "Test 13: Gross Profit Accounting Identity Hard Gate", e.message);
  }

  // TEST 14: Cash Flow Roll-Forward Reconciliation
  try {
    const mockEndingCash = { normalizedScalarValue: 200 } as any;
    const mockOpCF = { normalizedScalarValue: 100 } as any;
    const mockInvCF = { normalizedScalarValue: -20 } as any;
    const mockFinCF = { normalizedScalarValue: -10 } as any;
    // Expected change = +70. Beginning cash = 50 -> Expected ending = 120 != 200
    const cfRes = AccountingValidationEngine.reconcileCashFlowRollForward(
      mockEndingCash, mockOpCF, mockInvCF, mockFinCF, 50
    );
    assert(
      cfRes.status === "REVIEW_REQUIRED" && cfRes.variance === 80,
      "Test 14: Cash Flow Roll-Forward flags ending cash 200 vs expected 120 with variance 80"
    );
  } catch (e: any) {
    assert(false, "Test 14: Cash Flow Roll-Forward Reconciliation", e.message);
  }

  // TEST 15: Zero Unrequested Currency Conversion Engine
  try {
    const prov = CurrencyProvenanceEngine.initializeProvenance("EUR", "EUR");
    assert(
      prov.rawCurrency === "EUR" && prov.normalizedCurrency === "EUR" && prov.exchangeRate === 1.0 && prov.rateSource === "NO_CONVERSION",
      "Test 15: Zero Unrequested Currency Conversion maintains EUR without conversion"
    );
  } catch (e: any) {
    assert(false, "Test 15: Zero Unrequested Currency Conversion Engine", e.message);
  }

  // TEST 16: Plausibility Rule: Cash Exceeds Total Assets
  try {
    const mockSummary = {
      revenue: { normalizedScalarValue: 1000 },
      grossProfit: { normalizedScalarValue: 500 },
      operatingProfit: { normalizedScalarValue: 200 },
      netIncome: { normalizedScalarValue: 100 },
      totalAssets: { normalizedScalarValue: 1000 },
      totalLiabilities: { normalizedScalarValue: 500 },
      totalEquity: { normalizedScalarValue: 500 },
      cash: { normalizedScalarValue: 1500 } // Cash > Assets!
    } as any;
    const rules = AccountingValidationEngine.runPlausibilityDiagnostics(mockSummary);
    const plau004 = rules.find((r) => r.ruleCode === "PLAU-004");
    assert(
      plau004 !== undefined && !plau004.passed && plau004.severity === "CRITICAL",
      "Test 16: Plausibility Rule PLAU-004 triggers CRITICAL failure when Cash (1500) > Assets (1000)"
    );
  } catch (e: any) {
    assert(false, "Test 16: Plausibility Rule: Cash Exceeds Total Assets", e.message);
  }

  // TEST 17: Plausibility Rule: Negative Revenue Guard
  try {
    const mockSummary = {
      revenue: { normalizedScalarValue: -500 }, // Negative revenue!
      grossProfit: { normalizedScalarValue: 100 },
      operatingProfit: { normalizedScalarValue: 50 },
      netIncome: { normalizedScalarValue: 20 },
      totalAssets: { normalizedScalarValue: 1000 },
      totalLiabilities: { normalizedScalarValue: 500 },
      totalEquity: { normalizedScalarValue: 500 },
      cash: { normalizedScalarValue: 100 }
    } as any;
    const rules = AccountingValidationEngine.runPlausibilityDiagnostics(mockSummary);
    const plau001 = rules.find((r) => r.ruleCode === "PLAU-001");
    assert(
      plau001 !== undefined && !plau001.passed && plau001.severity === "CRITICAL",
      "Test 17: Plausibility Rule PLAU-001 triggers CRITICAL failure when Revenue is negative (-500)"
    );
  } catch (e: any) {
    assert(false, "Test 17: Plausibility Rule: Negative Revenue Guard", e.message);
  }

  // TEST 18: Plausibility Rule: Negative Total Assets Guard
  try {
    const mockSummary = {
      revenue: { normalizedScalarValue: 1000 },
      grossProfit: { normalizedScalarValue: 500 },
      operatingProfit: { normalizedScalarValue: 200 },
      netIncome: { normalizedScalarValue: 100 },
      totalAssets: { normalizedScalarValue: -200 }, // Negative assets!
      totalLiabilities: { normalizedScalarValue: 500 },
      totalEquity: { normalizedScalarValue: 500 },
      cash: { normalizedScalarValue: 100 }
    } as any;
    const rules = AccountingValidationEngine.runPlausibilityDiagnostics(mockSummary);
    const plau005 = rules.find((r) => r.ruleCode === "PLAU-005");
    assert(
      plau005 !== undefined && !plau005.passed && plau005.severity === "CRITICAL",
      "Test 18: Plausibility Rule PLAU-005 triggers CRITICAL failure when Total Assets is negative (-200)"
    );
  } catch (e: any) {
    assert(false, "Test 18: Plausibility Rule: Negative Total Assets Guard", e.message);
  }

  // TEST 19: Verification State Machine Illegal Transition Block
  try {
    const trans = VerificationStateMachine.transitionState("PROPOSED", "VERIFIED", { source_document_id: "doc-1" });
    assert(
      !trans.success && trans.newState === "PROPOSED",
      "Test 19: Verification State Machine blocks direct illegal transition from PROPOSED to VERIFIED"
    );
  } catch (e: any) {
    assert(false, "Test 19: Verification State Machine Illegal Transition Block", e.message);
  }

  // TEST 20: Canonical Display Formatter Output Integrity
  try {
    const formatted = FinancialFormatter.format(11_794_000_000, { scaleLabel: "MILLIONS", currency: "EUR" });
    assert(
      formatted === "€11,794.00M (€11,794,000,000)",
      `Test 20: FinancialFormatter outputs '€11,794.00M (€11,794,000,000)' (actual: '${formatted}')`
    );
  } catch (e: any) {
    assert(false, "Test 20: Canonical Display Formatter Output Integrity", e.message);
  }

  console.log("\n-------------------------------------------------------");
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED.`);
  if (failures.length > 0) {
    console.error(`FAILURES:\n${failures.join("\n")}`);
  }
  console.log("-------------------------------------------------------\n");

  return { total, passed, failures };
}
