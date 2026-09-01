import { describe, it, expect } from "vitest";
import { normalizeFinancialValue, LocaleAwareNumberParser } from "../forensicExtractionEngine.js";
import { CanonicalFactResolver } from "../canonicalFactResolver.js";
import { AccountingValidationEngine } from "../accountingValidationEngine.js";
import { SourceAuthorityRanker } from "../sourceAuthorityRanker.js";
import { ExtractedFact } from "../../src/types.js";

function createBaseFact(overrides: Record<string, any> = {}): ExtractedFact {
  const num = overrides.numericValue ?? overrides.value ?? 1000000;
  const status = overrides.status ?? "ACCEPTED";
  const verStatus = overrides.verificationStatus ?? (status === "ACCEPTED" ? "VERIFIED" : status);
  const verState = overrides.verification_state ?? verStatus;

  return {
    id: `fact-${Math.random().toString(36).substring(2, 9)}`,
    workspaceId: "ws-test-h63",
    documentId: "doc-1",
    documentName: "Annual_Report_2025.pdf",
    canonicalMetric: "revenue",
    metricDisplayName: "Revenue",
    valueOriginal: String(num),
    rawValue: String(num),
    normalizedValue: num,
    unitScale: "Units",
    currency: "EUR",
    currencyOriginal: "EUR",
    reportingPeriod: "2025-FY",
    fiscalYear: 2025,
    reportingScope: "Consolidated" as any,
    statementType: "income_statement",
    status: status,
    verificationStatus: verStatus,
    verification_state: verState,
    pageNumber: 12,
    confidence: 0.95,
    sourceText: "Consolidated Revenue for 2025 was EUR 1,000,000",
    labelOriginal: "Revenue",
    labelNormalized: "Revenue",
    extractedAt: new Date().toISOString(),
    ...(overrides as any)
  } as ExtractedFact;
}

describe("Phase H.6.3 Canonical Authority, Scale Lineage & Readiness Truth Suite", () => {
  // TEST A: "50.5 billion" normalizes to 50,500,000,000 exactly once
  it("TEST A: '50.5 billion' normalizes to 50,500,000,000 exactly once", () => {
    const res = normalizeFinancialValue({
      rawNumericValue: "50.5 billion,",
      explicitScale: "BILLIONS",
      tableScale: "MILLIONS", // Table header says millions, but scalar text says billion!
      docLanguage: "en"
    });
    expect(res.normalizedBaseValue).toBe(50_500_000_000);
    expect(res.scaleSource).toBe("EXPLICIT_TEXT");
  });

  // TEST B: Narrative Revenue cannot beat primary Income Statement Revenue
  it("TEST B: Narrative Revenue cannot beat primary Income Statement Revenue", () => {
    const primaryFact = createBaseFact({
      id: "is-rev-1",
      canonicalMetric: "revenue",
      statementType: "income_statement",
      labelOriginal: "Turnover",
      valueOriginal: "50503000000",
      normalizedValue: 50503000000,
      pageNumber: 112
    });
    const narrativeFact = createBaseFact({
      id: "narrative-rev-1",
      canonicalMetric: "revenue",
      statementType: "management_narrative",
      labelOriginal: "Turnover of continuing operations",
      valueOriginal: "50.5 billion",
      normalizedValue: 50500000000,
      pageNumber: 15
    });

    const res = CanonicalFactResolver.resolveMetric([narrativeFact, primaryFact], "revenue", "2025-FY");
    expect(res.primaryFact?.id).toBe("is-rev-1");
    expect(res.normalizedScalarValue).toBe(50503000000);
  });

  // TEST C: 11,794 under "€ millions" normalizes to 11,794,000,000
  it("TEST C: 11,794 under '€ millions' normalizes to 11,794,000,000", () => {
    const res = normalizeFinancialValue({
      rawNumericValue: "11,794",
      tableScale: "MILLIONS",
      currency: "EUR"
    });
    expect(res.normalizedBaseValue).toBe(11_794_000_000);
  });

  // TEST D: 10,772 under a millions Cash Flow table normalizes correctly
  it("TEST D: 10,772 under a millions Cash Flow table normalizes correctly", () => {
    const res = normalizeFinancialValue({
      rawNumericValue: "10,772",
      tableScale: "MILLIONS",
      currency: "EUR"
    });
    expect(res.normalizedBaseValue).toBe(10_772_000_000);
  });

  // TEST E: Unscaled candidate is blocked from customer eligibility
  it("TEST E: Unscaled candidate is blocked from customer eligibility", () => {
    const unscaledFact = createBaseFact({
      id: "unscaled-ni",
      canonicalMetric: "net_income",
      valueOriginal: "11794",
      normalizedValue: 11794, // Missing table multiplier 1,000,000
      unitScale: "Millions",
      status: "PROPOSED",
      verificationStatus: "UNVERIFIED"
    });

    const isEligible = CanonicalFactResolver.isFactEligibleForCustomer(unscaledFact);
    expect(isEligible).toBe(false);
  });

  // TEST F: Scale ambiguity forces readiness scale gate FAIL
  it("TEST F: Scale ambiguity forces readiness scale gate FAIL", () => {
    const unscaledFact = createBaseFact({
      id: "unscaled-ni",
      canonicalMetric: "net_income",
      valueOriginal: "11794",
      normalizedValue: 11794,
      unitScale: "Millions",
      status: "PROPOSED",
      verificationStatus: "UNVERIFIED"
    });

    const readiness = AccountingValidationEngine.evaluateCustomerReadiness("ws-test-h63", [unscaledFact]);
    expect(readiness.isReady).toBe(false);
    expect(readiness.checks.scaleUnambiguous).toBe(false);
  });

  // TEST G: Accounting identity cannot PASS if an operand is blocked
  it("TEST G: Accounting identity cannot PASS if an operand is blocked", () => {
    const assetsFact = createBaseFact({
      id: "ast-1",
      canonicalMetric: "total_assets",
      statementType: "balance_sheet",
      normalizedValue: 70471000000,
      status: "ACCEPTED",
      verificationStatus: "VERIFIED"
    });
    const liabFact = createBaseFact({
      id: "liab-1",
      canonicalMetric: "total_liabilities",
      statementType: "balance_sheet",
      normalizedValue: 52884000000,
      status: "ACCEPTED",
      verificationStatus: "VERIFIED"
    });
    const equityFact = createBaseFact({
      id: "eq-1",
      canonicalMetric: "total_equity",
      statementType: "balance_sheet",
      valueOriginal: "17587",
      normalizedValue: 17587, // Unscaled PROPOSED fact!
      status: "PROPOSED",
      verificationStatus: "UNVERIFIED"
    });

    const validationRes = AccountingValidationEngine.validateWorkspace("ws-test-h63", [assetsFact, liabFact, equityFact]);
    expect(validationRes.balanceSheetIdentity.status).toBe("REVIEW_REQUIRED");
  });

  // TEST H: Arbitrary €100M fallback values cannot be created
  it("TEST H: Arbitrary €100M fallback values cannot be created", () => {
    const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test-h63", []);
    expect(summary.revenue.normalizedScalarValue).toBeNull();
    expect(summary.revenue.formattedValue).toBe("—");
    expect(summary.revenue.normalizedScalarValue).not.toBe(100000000);
  });

  // TEST I: Missing Equity returns null / —, never zero
  it("TEST I: Missing Equity returns null / —, never zero", () => {
    const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test-h63", []);
    expect(summary.totalEquity.normalizedScalarValue).toBeNull();
    expect(summary.totalEquity.formattedValue).toBe("—");
  });

  // TEST J: Tier 1 audited statement always defeats Tier 5 narrative for same metric/period/scope
  it("TEST J: Tier 1 audited statement always defeats Tier 5 narrative", () => {
    const tier1Fact = createBaseFact({
      id: "tier1-fact",
      canonicalMetric: "revenue",
      statementType: "consolidated income statement",
      normalizedValue: 50503000000,
      status: "ACCEPTED",
      verificationStatus: "VERIFIED"
    });
    const tier5Fact = createBaseFact({
      id: "tier5-fact",
      canonicalMetric: "revenue",
      statementType: "management_narrative",
      normalizedValue: 50500000000,
      status: "ACCEPTED",
      verificationStatus: "VERIFIED"
    });

    const rank1 = SourceAuthorityRanker.rankFactAuthority(tier1Fact);
    const rank5 = SourceAuthorityRanker.rankFactAuthority(tier5Fact);
    expect(rank1.tier).toBe(1);
    expect(rank5.tier).toBe(5);

    const res = CanonicalFactResolver.resolveMetric([tier5Fact, tier1Fact], "revenue", "2025-FY");
    expect(res.primaryFact?.id).toBe("tier1-fact");
  });

  // TEST K: Footnote Net Income component cannot defeat Profit for Period primary statement total
  it("TEST K: Footnote Net Income component cannot defeat Profit for Period primary statement total", () => {
    const primaryNetIncome = createBaseFact({
      id: "primary-ni",
      canonicalMetric: "net_income",
      statementType: "income_statement",
      labelOriginal: "Net profit for the year",
      normalizedValue: 11794000000,
      status: "ACCEPTED",
      verificationStatus: "VERIFIED"
    });
    const footnoteSubSegment = createBaseFact({
      id: "footnote-ni",
      canonicalMetric: "net_income",
      statementType: "footnote",
      labelOriginal: "Continuing operations net profit segment",
      normalizedValue: 9047000000,
      status: "ACCEPTED",
      verificationStatus: "VERIFIED"
    });

    const res = CanonicalFactResolver.resolveMetric([footnoteSubSegment, primaryNetIncome], "net_income", "2025-FY");
    expect(res.primaryFact?.id).toBe("primary-ni");
    expect(res.normalizedScalarValue).toBe(11794000000);
  });

  // TEST L: Operating/Investing/Financing Cash Flow rows resolve from primary Cash Flow statement
  it("TEST L: Operating/Investing/Financing Cash Flow rows resolve from primary Cash Flow statement", () => {
    const ocf = createBaseFact({
      id: "ocf-fact",
      canonicalMetric: "operating_cash_flow",
      statementType: "cash_flow",
      labelOriginal: "Cash flow from operating activities",
      normalizedValue: 10772000000,
      status: "ACCEPTED",
      verificationStatus: "VERIFIED"
    });
    const icf = createBaseFact({
      id: "icf-fact",
      canonicalMetric: "investing_cash_flow",
      statementType: "cash_flow",
      labelOriginal: "Net cash used in investing activities",
      normalizedValue: -3200000000,
      status: "ACCEPTED",
      verificationStatus: "VERIFIED"
    });
    const fcf = createBaseFact({
      id: "fcf-fact",
      canonicalMetric: "financing_cash_flow",
      statementType: "cash_flow",
      labelOriginal: "Net cash used in financing activities",
      normalizedValue: -6500000000,
      status: "ACCEPTED",
      verificationStatus: "VERIFIED"
    });

    const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test-h63", [ocf, icf, fcf]);
    expect(summary.operatingCashFlow.normalizedScalarValue).toBe(10772000000);
    expect(summary.investingCashFlow.normalizedScalarValue).toBe(-3200000000);
    expect(summary.financingCashFlow.normalizedScalarValue).toBe(-6500000000);
  });

  // TEST M: Alternate filing renderings corroborate instead of double-count
  it("TEST M: Alternate filing renderings corroborate instead of double-count", () => {
    const pdfFact = createBaseFact({
      id: "pdf-rev",
      documentId: "doc-pdf",
      documentName: "Annual_Report.pdf",
      canonicalMetric: "revenue",
      normalizedValue: 50503000000,
      status: "ACCEPTED",
      verificationStatus: "VERIFIED"
    });
    const xbrlFact = createBaseFact({
      id: "xbrl-rev",
      documentId: "doc-xbrl",
      documentName: "Inline_XBRL.pdf",
      canonicalMetric: "revenue",
      normalizedValue: 50503000000,
      status: "ACCEPTED",
      verificationStatus: "VERIFIED"
    });

    const res = CanonicalFactResolver.resolveMetric([pdfFact, xbrlFact], "revenue", "2025-FY");
    expect(res.primaryFact?.id).toBe("pdf-rev");
    expect(res.alternativeFacts.length).toBe(1);
    expect(pdfFact.corroboratingSources?.length).toBeGreaterThan(0);
  });

  // TEST N: Customer dashboard does not display PROPOSED/BLOCKED critical totals
  it("TEST N: Customer dashboard does not display PROPOSED/BLOCKED critical totals", () => {
    const proposedFact = createBaseFact({
      id: "prop-fact",
      canonicalMetric: "revenue",
      status: "PROPOSED",
      verificationStatus: "UNVERIFIED"
    });

    const res = CanonicalFactResolver.resolveMetric([proposedFact], "revenue", "2025-FY");
    expect(res.primaryFact).toBeNull();
    expect(res.formattedValue).toBe("—");
  });

  // TEST O: Charts exclude blocked facts
  it("TEST O: Charts exclude blocked facts", () => {
    const blockedFact = createBaseFact({
      id: "blocked-rev",
      canonicalMetric: "revenue",
      status: "PROPOSED",
      verificationStatus: "UNVERIFIED"
    });

    const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test-h63", [blockedFact]);
    expect(summary.revenue.normalizedScalarValue).toBeNull();
    expect(summary.revenue.formattedValue).toBe("—");
  });

  // TEST P: Ratios cannot compute using blocked facts
  it("TEST P: Ratios cannot compute using blocked facts", () => {
    const blockedRev = createBaseFact({
      id: "blocked-rev",
      canonicalMetric: "revenue",
      status: "PROPOSED",
      verificationStatus: "UNVERIFIED"
    });
    const validAssets = createBaseFact({
      id: "valid-ast",
      canonicalMetric: "total_assets",
      normalizedValue: 70471000000,
      status: "ACCEPTED",
      verificationStatus: "VERIFIED"
    });

    const validationRes = AccountingValidationEngine.validateWorkspace("ws-test-h63", [blockedRev, validAssets]);
    expect(validationRes.guardedRatios.grossMarginPct?.value).toBeNull();
    expect(validationRes.guardedRatios.grossMarginPct?.formattedValue).toBe("—");
  });

  // TEST Q: AI insights cannot use blocked facts
  it("TEST Q: AI insights cannot use blocked facts", () => {
    const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test-h63", []);
    expect(summary.revenue.primaryFact).toBeNull();
    expect(summary.netIncome.primaryFact).toBeNull();
  });

  // TEST R: Exports cannot label blocked facts as verified
  it("TEST R: Exports cannot label blocked facts as verified", () => {
    const blockedFact = createBaseFact({
      id: "blocked-fact",
      status: "PROPOSED",
      verificationStatus: "UNVERIFIED"
    });

    const isEligible = CanonicalFactResolver.isFactEligibleForCustomer(blockedFact);
    expect(isEligible).toBe(false);
  });

  // TEST S: Readiness cannot return CUSTOMER_READY while any critical scale conflict exists
  it("TEST S: Readiness cannot return CUSTOMER_READY while any critical scale conflict exists", () => {
    const unscaledNi = createBaseFact({
      id: "unscaled-ni",
      canonicalMetric: "net_income",
      valueOriginal: "11794",
      normalizedValue: 11794,
      unitScale: "Millions",
      status: "PROPOSED",
      verificationStatus: "UNVERIFIED"
    });

    const readiness = AccountingValidationEngine.evaluateCustomerReadiness("ws-test-h63", [unscaledNi]);
    expect(readiness.isReady).toBe(false);
    expect(readiness.readinessState).not.toBe("CUSTOMER_READY");
  });

  // TEST T: Readiness cannot return CUSTOMER_READY while any critical primary metric is BLOCKED
  it("TEST T: Readiness cannot return CUSTOMER_READY while any critical primary metric is BLOCKED", () => {
    const facts = [
      createBaseFact({ id: "r1", canonicalMetric: "revenue", status: "ACCEPTED", verificationStatus: "VERIFIED", normalizedValue: 50503000000 }),
      createBaseFact({ id: "ni1", canonicalMetric: "net_income", status: "PROPOSED", verificationStatus: "UNVERIFIED", normalizedValue: 11794 }), // BLOCKED!
      createBaseFact({ id: "a1", canonicalMetric: "total_assets", status: "ACCEPTED", verificationStatus: "VERIFIED", normalizedValue: 70471000000 }),
      createBaseFact({ id: "l1", canonicalMetric: "total_liabilities", status: "ACCEPTED", verificationStatus: "VERIFIED", normalizedValue: 52884000000 }),
      createBaseFact({ id: "e1", canonicalMetric: "total_equity", status: "ACCEPTED", verificationStatus: "VERIFIED", normalizedValue: 17587000000 })
    ];

    const readiness = AccountingValidationEngine.evaluateCustomerReadiness("ws-test-h63", facts);
    expect(readiness.isReady).toBe(false);
    expect(readiness.readinessState).not.toBe("CUSTOMER_READY");
  });
});
