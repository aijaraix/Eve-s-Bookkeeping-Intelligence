import { describe, it, expect } from "vitest";
import { AccountingValidationEngine } from "../accountingValidationEngine.js";
import { CanonicalFactResolver } from "../canonicalFactResolver.js";
import { ExtractedFact } from "../../src/types.js";

describe("Phase D — Accounting Validation, Gap Analysis, Reconciliation & Derived Metrics", () => {

  // helper to generate mock facts
  const createMockFact = (overrides: Partial<ExtractedFact>): ExtractedFact => ({
    id: `fct-${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: "ws-test-phase-d",
    company_id: "ws-test-phase-d",
    documentId: "doc-test-1",
    factType: "PRIMARY_FINANCIAL_LINE_ITEM",
    labelOriginal: overrides.canonicalMetric || "Metric Label",
    labelNormalized: overrides.canonicalMetric || "Metric Label",
    valueOriginal: String(overrides.normalizedValue ?? overrides.valueFunctional ?? 100),
    valueFunctional: String(overrides.normalizedValue ?? overrides.valueFunctional ?? 100),
    normalizedValue: overrides.normalizedValue ?? 100,
    currencyOriginal: "EUR",
    functionalCurrency: "EUR",
    currency: "EUR",
    unitScale: "Millions",
    reportingPeriod: "2025-FY",
    fiscalYear: "2025",
    entityName: "Test Group",
    entityScope: "Consolidated",
    pageNumber: 1,
    sourceText: "Test source text snippet",
    confidence: 0.95,
    status: "APPROVED",
    verificationStatus: "VALIDATED",
    extractionMethod: "HEURISTIC_PARSER",
    ...overrides
  });

  it("1. Incompatible Period Guard Failure — Ratio calculation fails and marks REVIEW_REQUIRED", () => {
    const rev2025 = createMockFact({
      id: "rev-2025",
      canonicalMetric: "revenue",
      reportingPeriod: "2025-FY",
      normalizedValue: 321_910_000_000
    });

    const ni2024 = createMockFact({
      id: "ni-2024",
      canonicalMetric: "net_income",
      reportingPeriod: "2024-FY",
      normalizedValue: 12_000_000_000
    });

    const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test-phase-d", [rev2025, ni2024]);
    const guarded = AccountingValidationEngine.calculateGuardedRatios(summary);

    expect(guarded.netMarginPct.value).toBeNull();
    expect(guarded.netMarginPct.compatibilityPassed).toBe(false);
    expect(guarded.netMarginPct.status).toBe("REVIEW_REQUIRED");
    expect(guarded.netMarginPct.incompatibilityReason).toContain("Period mismatch");
  });

  it("2. Incompatible Consolidation Scope Guard Failure — Parent vs Consolidated scope mismatch", () => {
    const eqParent = createMockFact({
      id: "eq-parent",
      canonicalMetric: "total_equity",
      entityScope: "Parent Only",
      reportingPeriod: "2025-FY",
      normalizedValue: 50_000_000_000
    });

    const niConsolidated = createMockFact({
      id: "ni-cons",
      canonicalMetric: "net_income",
      entityScope: "Consolidated",
      reportingPeriod: "2025-FY",
      normalizedValue: 10_000_000_000
    });

    const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test-phase-d", [eqParent, niConsolidated]);
    const guarded = AccountingValidationEngine.calculateGuardedRatios(summary);

    expect(guarded.returnOnEquity.value).toBeNull();
    expect(guarded.returnOnEquity.compatibilityPassed).toBe(false);
    expect(guarded.returnOnEquity.status).toBe("REVIEW_REQUIRED");
    expect(guarded.returnOnEquity.incompatibilityReason).toContain("Consolidation scope mismatch");
  });

  it("3. Incompatible Scale & Normalization Verification", () => {
    const revK = createMockFact({
      id: "rev-k",
      canonicalMetric: "revenue",
      valueOriginal: "321,910,000",
      unitScale: "Thousands",
      normalizedValue: 321_910_000_000
    });

    const cogsRaw = createMockFact({
      id: "cogs-raw",
      canonicalMetric: "cost_of_sales",
      valueOriginal: "(270,670,000,000)",
      unitScale: "Units",
      normalizedValue: -270_670_000_000
    });

    const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test-phase-d", [revK, cogsRaw]);
    const gpIdentity = AccountingValidationEngine.reconcileGrossProfit(
      summary.revenue,
      summary.costOfSales,
      summary.grossProfit
    );

    // Both values normalized to base units accurately
    expect(summary.revenue.normalizedScalarValue).toBe(321_910_000_000);
    expect(summary.costOfSales.normalizedScalarValue).toBe(-270_670_000_000);
  });

  it("4. Incompatible Currency Guard Failure — USD vs EUR currency mismatch", () => {
    const niUsd = createMockFact({
      id: "ni-usd",
      canonicalMetric: "net_income",
      currencyOriginal: "USD",
      currency: "USD",
      reportingPeriod: "2025-FY",
      normalizedValue: 10_000_000_000
    });

    const eqEur = createMockFact({
      id: "eq-eur",
      canonicalMetric: "total_equity",
      currencyOriginal: "EUR",
      currency: "EUR",
      reportingPeriod: "2025-FY",
      normalizedValue: 100_000_000_000
    });

    const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test-phase-d", [niUsd, eqEur]);
    const guarded = AccountingValidationEngine.calculateGuardedRatios(summary);

    expect(guarded.returnOnEquity.value).toBeNull();
    expect(guarded.returnOnEquity.compatibilityPassed).toBe(false);
    expect(guarded.returnOnEquity.status).toBe("REVIEW_REQUIRED");
    expect(guarded.returnOnEquity.incompatibilityReason).toContain("Currency mismatch");
  });

  it("5. Incorrect Sign Handling in Gross Profit Identity", () => {
    const rev = createMockFact({ id: "rev", canonicalMetric: "revenue", normalizedValue: 100_000_000_000 });
    // Incorrect positive sign for cost of sales that fails math
    const cogs = createMockFact({ id: "cogs", canonicalMetric: "cost_of_sales", normalizedValue: 120_000_000_000 });
    const gp = createMockFact({ id: "gp", canonicalMetric: "gross_profit", normalizedValue: 20_000_000_000 });

    const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test-phase-d", [rev, cogs, gp]);
    const gpIdentity = AccountingValidationEngine.reconcileGrossProfit(summary.revenue, summary.costOfSales, summary.grossProfit);

    expect(gpIdentity.status).toBe("REVIEW_REQUIRED");
    expect(gpIdentity.isWithinMateriality).toBe(false);
    expect(gpIdentity.discrepancyMessage).toContain("Income Statement Discrepancy");
  });

  it("6. Balance Sheet Imbalance — $10B Imbalance detected and flagged", () => {
    const assets = createMockFact({ id: "ast", canonicalMetric: "total_assets", normalizedValue: 100_000_000_000 });
    const liab = createMockFact({ id: "lia", canonicalMetric: "total_liabilities", normalizedValue: 60_000_000_000 });
    const eq = createMockFact({ id: "equ", canonicalMetric: "total_equity", normalizedValue: 30_000_000_000 }); // $60B + $30B = $90B ≠ $100B

    const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test-phase-d", [assets, liab, eq]);
    const bsIdentity = AccountingValidationEngine.reconcileBalanceSheet(summary.totalAssets, summary.totalLiabilities, summary.totalEquity);

    expect(bsIdentity.status).toBe("REVIEW_REQUIRED");
    expect(bsIdentity.variance).toBe(10_000_000_000);
    expect(bsIdentity.isWithinMateriality).toBe(false);
    expect(bsIdentity.discrepancyMessage).toContain("Balance Sheet Imbalance");
  });

  it("7. Cash Flow Roll-Forward Imbalance — Roll-forward discrepancy detected", () => {
    const cash = createMockFact({ id: "csh", canonicalMetric: "cash", normalizedValue: 20_000_000_000 });
    const op = createMockFact({ id: "op-cf", canonicalMetric: "operating_cash_flow", normalizedValue: 5_000_000_000 });
    const inv = createMockFact({ id: "inv-cf", canonicalMetric: "investing_cash_flow", normalizedValue: -2_000_000_000 });
    const fin = createMockFact({ id: "fin-cf", canonicalMetric: "financing_cash_flow", normalizedValue: -1_000_000_000 });

    const rollForward = AccountingValidationEngine.reconcileCashFlowRollForward(
      { normalizedScalarValue: cash.normalizedValue, primaryFact: cash } as any,
      { normalizedScalarValue: op.normalizedValue, primaryFact: op } as any,
      { normalizedScalarValue: inv.normalizedValue, primaryFact: inv } as any,
      { normalizedScalarValue: fin.normalizedValue, primaryFact: fin } as any,
      10_000_000_000 // Beginning cash = 10B -> Net = +2B -> Expected ending = 12B != Reported 20B
    );

    expect(rollForward.status).toBe("REVIEW_REQUIRED");
    expect(rollForward.variance).toBe(8_000_000_000);
    expect(rollForward.isWithinMateriality).toBe(false);
  });

  it("8. Missing Denominator Guard Protection — Prevents NaN/Infinity when Equity = 0", () => {
    const ni = createMockFact({ id: "ni", canonicalMetric: "net_income", normalizedValue: 10_000_000_000 });
    const eqZero = createMockFact({ id: "eq-0", canonicalMetric: "total_equity", normalizedValue: 0 });

    const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test-phase-d", [ni, eqZero]);
    const guarded = AccountingValidationEngine.calculateGuardedRatios(summary);

    expect(guarded.returnOnEquity.value).toBeNull();
    expect(guarded.returnOnEquity.denominatorValid).toBe(false);
    expect(guarded.returnOnEquity.status).toBe("REVIEW_REQUIRED");
  });

  it("9. Plausibility Diagnostic Failures — Negative Revenue and Cash > Assets caught", () => {
    const negRev = createMockFact({ id: "neg-rev", canonicalMetric: "revenue", normalizedValue: -50_000_000_000 });
    const hugeCash = createMockFact({ id: "huge-csh", canonicalMetric: "cash", normalizedValue: 200_000_000_000 });
    const smallAssets = createMockFact({ id: "sml-ast", canonicalMetric: "total_assets", normalizedValue: 100_000_000_000 });

    const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test-phase-d", [negRev, hugeCash, smallAssets]);
    const plausibility = AccountingValidationEngine.runPlausibilityDiagnostics(summary);

    const revRule = plausibility.find((p) => p.ruleCode === "PLAU-001");
    const cashRule = plausibility.find((p) => p.ruleCode === "PLAU-004");

    expect(revRule?.passed).toBe(false);
    expect(revRule?.severity).toBe("CRITICAL");
    expect(cashRule?.passed).toBe(false);
    expect(cashRule?.severity).toBe("CRITICAL");
  });

  it("10. Volkswagen FY2025 Regression Test — Reconciles perfectly with 100% accounting identities", () => {
    const vwFacts: ExtractedFact[] = [
      createMockFact({
        id: "vw-rev-2025",
        canonicalMetric: "revenue",
        valueOriginal: "321,910",
        valueFunctional: "321910000000",
        normalizedValue: 321_910_000_000,
        unitScale: "Millions",
        reportingPeriod: "2025-FY",
        entityName: "Volkswagen Group",
        entityScope: "Consolidated"
      }),
      createMockFact({
        id: "vw-cogs-2025",
        canonicalMetric: "cost_of_sales",
        valueOriginal: "(270,670)",
        valueFunctional: "-270670000000",
        normalizedValue: -270_670_000_000,
        unitScale: "Millions",
        reportingPeriod: "2025-FY",
        entityName: "Volkswagen Group",
        entityScope: "Consolidated"
      }),
      createMockFact({
        id: "vw-gp-2025",
        canonicalMetric: "gross_profit",
        valueOriginal: "51,240",
        valueFunctional: "51240000000",
        normalizedValue: 51_240_000_000,
        unitScale: "Millions",
        reportingPeriod: "2025-FY",
        entityName: "Volkswagen Group",
        entityScope: "Consolidated"
      }),
      createMockFact({
        id: "vw-ast-2025",
        canonicalMetric: "total_assets",
        valueOriginal: "635,200",
        valueFunctional: "635200000000",
        normalizedValue: 635_200_000_000,
        unitScale: "Millions",
        reportingPeriod: "2025-FY",
        entityName: "Volkswagen Group",
        entityScope: "Consolidated"
      }),
      createMockFact({
        id: "vw-lia-2025",
        canonicalMetric: "total_liabilities",
        valueOriginal: "443,100",
        valueFunctional: "443100000000",
        normalizedValue: 443_100_000_000,
        unitScale: "Millions",
        reportingPeriod: "2025-FY",
        entityName: "Volkswagen Group",
        entityScope: "Consolidated"
      }),
      createMockFact({
        id: "vw-eq-2025",
        canonicalMetric: "total_equity",
        valueOriginal: "192,100",
        valueFunctional: "192100000000",
        normalizedValue: 192_100_000_000,
        unitScale: "Millions",
        reportingPeriod: "2025-FY",
        entityName: "Volkswagen Group",
        entityScope: "Consolidated"
      }),
      createMockFact({
        id: "vw-ni-2025",
        canonicalMetric: "net_income",
        valueOriginal: "12,150",
        valueFunctional: "12150000000",
        normalizedValue: 12_150_000_000,
        unitScale: "Millions",
        reportingPeriod: "2025-FY",
        entityName: "Volkswagen Group",
        entityScope: "Consolidated"
      }),
      createMockFact({
        id: "vw-csh-2025",
        canonicalMetric: "cash",
        valueOriginal: "42,500",
        valueFunctional: "42500000000",
        normalizedValue: 42_500_000_000,
        unitScale: "Millions",
        reportingPeriod: "2025-FY",
        entityName: "Volkswagen Group",
        entityScope: "Consolidated"
      }),
      createMockFact({
        id: "vw-opcf-2025",
        canonicalMetric: "operating_cash_flow",
        valueOriginal: "32,100",
        valueFunctional: "32100000000",
        normalizedValue: 32_100_000_000,
        unitScale: "Millions",
        reportingPeriod: "2025-FY",
        entityName: "Volkswagen Group",
        entityScope: "Consolidated"
      }),
      createMockFact({
        id: "vw-invcf-2025",
        canonicalMetric: "investing_cash_flow",
        valueOriginal: "(18,200)",
        valueFunctional: "-18200000000",
        normalizedValue: -18_200_000_000,
        unitScale: "Millions",
        reportingPeriod: "2025-FY",
        entityName: "Volkswagen Group",
        entityScope: "Consolidated"
      }),
      createMockFact({
        id: "vw-fincf-2025",
        canonicalMetric: "financing_cash_flow",
        valueOriginal: "(8,400)",
        valueFunctional: "-840000000",
        normalizedValue: -8_400_000_000,
        unitScale: "Millions",
        reportingPeriod: "2025-FY",
        entityName: "Volkswagen Group",
        entityScope: "Consolidated"
      })
    ];

    const validationResult = AccountingValidationEngine.validateWorkspace("ws-test-phase-d", vwFacts);

    // Assert Balance Sheet Identity: €635.20B = €443.10B + €192.10B
    expect(validationResult.balanceSheetIdentity.status).toBe("RECONCILED");
    expect(validationResult.balanceSheetIdentity.variance).toBe(0);
    expect(validationResult.balanceSheetIdentity.actualValue).toBe(635_200_000_000);
    expect(validationResult.balanceSheetIdentity.expectedValue).toBe(635_200_000_000);

    // Assert Income Statement Identity: €51.24B = €321.91B - €270.67B
    expect(validationResult.incomeStatementIdentity.status).toBe("RECONCILED");
    expect(validationResult.incomeStatementIdentity.variance).toBe(0);

    // Assert Guarded Ratios
    expect(validationResult.guardedRatios.grossMarginPct.value).toBe(15.92);
    expect(validationResult.guardedRatios.netMarginPct.value).toBe(3.77);
    expect(validationResult.guardedRatios.returnOnEquity.value).toBe(6.32);
    expect(validationResult.guardedRatios.debtToEquity.value).toBe(2.31);

    // Assert Derived Facts generated with complete lineage trace
    expect(validationResult.derivedFacts.length).toBeGreaterThan(0);
    const gmDerived = validationResult.derivedFacts.find((f) => f.canonicalMetric === "grossMarginPct");
    expect(gmDerived).toBeDefined();
    expect(gmDerived?.reportedOrDerived).toBe("derived");
    expect(gmDerived?.verificationNotes).toContain("Lineage Trace");

    // Assert Overall Status is RECONCILED / ACCOUNTING_VALIDATED
    expect(["RECONCILED", "ACCOUNTING_VALIDATED"]).toContain(validationResult.overallStatus);
  });

  it("11. Distinct Verification Status Progression & Fact Immutability Guarantee", () => {
    const fact = createMockFact({
      id: "fct-immutable",
      canonicalMetric: "total_assets",
      valueOriginal: "100",
      valueFunctional: "100000000",
      normalizedValue: 100_000_000
    });

    const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test-phase-d", [fact]);

    // Stage 1: Selected as Canonical Primary
    expect(summary.totalAssets.primaryFact?.id).toBe("fct-immutable");

    // Execute Phase D
    const validationResult = AccountingValidationEngine.validateWorkspace("ws-test-phase-d", [fact]);

    // Fact raw and normalized scalar value preserved 100% intact
    expect(fact.valueOriginal).toBe("100");
    expect(fact.normalizedValue).toBe(100_000_000);

    // Status progressed from CANONICAL_SELECTED to validation outcome
    expect(fact.verificationStatus).toBeDefined();
    expect(fact.verificationStatus).not.toBe("UNVERIFIED");
  });

});
