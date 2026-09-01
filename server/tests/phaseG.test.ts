import { describe, it, expect, beforeEach } from "vitest";
import { FinancialIntelligenceEngine, DEFAULT_MATERIALITY_CONFIG } from "../financialIntelligenceEngine.js";
import { AuditEvidenceEngine } from "../auditEvidenceEngine.js";
import { ExtractedFact, DocumentRecord } from "../../src/types.js";

describe("Phase G — Variance, Comparative Analysis & Financial Intelligence Engine Suite", () => {
  beforeEach(() => {
    AuditEvidenceEngine.clearState();
  });

  const createMockFact = (overrides: Partial<ExtractedFact>): ExtractedFact => ({
    id: `fct-${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: "ws-test-phase-g",
    company_id: "ws-test-phase-g",
    documentId: "doc-vw-2025",
    factType: "PRIMARY_FINANCIAL_LINE_ITEM",
    labelOriginal: overrides.labelOriginal || "Sales revenue",
    labelNormalized: overrides.canonicalMetric || "revenue",
    canonicalMetric: overrides.canonicalMetric || "revenue",
    valueOriginal: overrides.valueOriginal || "321,913",
    valueFunctional: String(overrides.normalizedValue ?? 321_913_000_000),
    normalizedValue: overrides.normalizedValue ?? 321_913_000_000,
    currencyOriginal: overrides.currencyOriginal || "EUR",
    functionalCurrency: overrides.functionalCurrency || "EUR",
    currency: overrides.currencyOriginal || "EUR",
    unitScale: overrides.unitScale || "Millions",
    reportingPeriod: overrides.reportingPeriod || "2025-FY",
    fiscalYear: overrides.fiscalYear || "2025",
    entityName: "Volkswagen Group",
    entityScope: overrides.entityScope || "Consolidated",
    pageNumber: overrides.pageNumber || 42,
    sourceText: overrides.sourceText || "Sales revenue for FY 2025 was EUR 321,913 million",
    confidence: 0.98,
    status: overrides.status || "APPROVED",
    verificationStatus: overrides.verificationStatus || "VERIFIED",
    extractionMethod: "HEURISTIC_PARSER",
    ...overrides
  });

  const pageManifest = Array.from({ length: 150 }, (_, i) => ({ physical_page_number: i + 1 }));
  const pageManifestsMap = new Map([["doc-vw-2025", pageManifest], ["doc-vw-2024", pageManifest]]);

  // =========================================================================
  // 1. VARIANCE CALCULATIONS & PERCENTAGE CALCULATIONS
  // =========================================================================
  it("TEST 1: Correct positive variance and percentage calculations", () => {
    const curRev = createMockFact({ id: "fct-cur-rev", reportingPeriod: "2025-FY", fiscalYear: "2025", normalizedValue: 120_000_000_000 });
    const compRev = createMockFact({ id: "fct-comp-rev", reportingPeriod: "2024-FY", fiscalYear: "2024", normalizedValue: 100_000_000_000 });

    const intel = FinancialIntelligenceEngine.analyzeWorkspaceIntelligence({
      workspaceId: "ws-test-phase-g",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      facts: [curRev, compRev],
      pageManifests: pageManifestsMap
    });

    const revVar = intel.variances.find((v) => v.canonicalMetric === "revenue");
    expect(revVar).toBeDefined();
    expect(revVar?.absoluteVariance).toBe(20_000_000_000);
    expect(revVar?.percentageVariance).toBe(0.20);
    expect(revVar?.formattedPercentageVariance).toBe("+20.00%");
    expect(revVar?.direction).toBe("FAVORABLE");
    expect(revVar?.materiality).toBe("MATERIAL_CHANGE");
  });

  it("TEST 2: Zero denominator is guarded against division-by-zero", () => {
    const curRev = createMockFact({ id: "fct-cur-rev2", reportingPeriod: "2025-FY", fiscalYear: "2025", normalizedValue: 50_000_000_000 });
    const compRev = createMockFact({ id: "fct-comp-rev2", reportingPeriod: "2024-FY", fiscalYear: "2024", normalizedValue: 0 });

    const intel = FinancialIntelligenceEngine.analyzeWorkspaceIntelligence({
      workspaceId: "ws-test-phase-g",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      facts: [curRev, compRev],
      pageManifests: pageManifestsMap
    });

    const revVar = intel.variances.find((v) => v.canonicalMetric === "revenue");
    expect(revVar).toBeDefined();
    expect(revVar?.absoluteVariance).toBe(50_000_000_000);
    expect(revVar?.percentageVariance).toBeNull();
    expect(revVar?.formattedPercentageVariance).toBe("N/A (Division by zero)");
  });

  it("TEST 3: Negative baseline values calculate percentage variance correctly using absolute value", () => {
    const curNet = createMockFact({ id: "fct-cur-net", canonicalMetric: "net_income", reportingPeriod: "2025-FY", fiscalYear: "2025", normalizedValue: 200_000_000 });
    const compNet = createMockFact({ id: "fct-comp-net", canonicalMetric: "net_income", reportingPeriod: "2024-FY", fiscalYear: "2024", normalizedValue: -500_000_000 });

    const intel = FinancialIntelligenceEngine.analyzeWorkspaceIntelligence({
      workspaceId: "ws-test-phase-g",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      facts: [curNet, compNet],
      pageManifests: pageManifestsMap
    });

    const netVar = intel.variances.find((v) => v.canonicalMetric === "net_income");
    expect(netVar).toBeDefined();
    expect(netVar?.absoluteVariance).toBe(700_000_000); // 200M - (-500M) = 700M
    expect(netVar?.percentageVariance).toBe(1.40); // 700M / |-500M| = 140%
    expect(netVar?.direction).toBe("FAVORABLE");
  });

  // =========================================================================
  // 2. GUARDS: CURRENCY, SCOPE, PERIODS & EVIDENCE
  // =========================================================================
  it("TEST 4: Incompatible currencies prevent invalid variance comparison and log exception", () => {
    const eurRev = createMockFact({ id: "fct-eur-rev", currencyOriginal: "EUR", normalizedValue: 100_000_000, reportingPeriod: "2025-FY" });
    const usdRev = createMockFact({ id: "fct-usd-rev", currencyOriginal: "USD", normalizedValue: 100_000_000, reportingPeriod: "2024-FY" });

    const intel = FinancialIntelligenceEngine.analyzeWorkspaceIntelligence({
      workspaceId: "ws-test-phase-g",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      facts: [eurRev, usdRev],
      pageManifests: pageManifestsMap
    });

    expect(intel.variances.length).toBe(0);
    expect(intel.exceptions.some((e) => e.type === "CURRENCY_MISMATCH")).toBe(true);
  });

  it("TEST 5: Incompatible scopes prevent invalid variance comparison and log exception", () => {
    const parentFact = createMockFact({ id: "fct-parent-scope", entityScope: "ParentCompany", normalizedValue: 100_000_000, reportingPeriod: "2025-FY" });
    const consolidatedFact = createMockFact({ id: "fct-cons-scope", entityScope: "Consolidated", normalizedValue: 100_000_000, reportingPeriod: "2024-FY" });

    const intel = FinancialIntelligenceEngine.analyzeWorkspaceIntelligence({
      workspaceId: "ws-test-phase-g",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      entityScope: "Consolidated",
      facts: [parentFact, consolidatedFact],
      pageManifests: pageManifestsMap
    });

    expect(intel.exceptions.some((e) => e.type === "INCOMPATIBLE_SCOPE")).toBe(true);
  });

  it("TEST 6: Rejected or unverified facts are gated from entering analysis", () => {
    const rejFact = createMockFact({ id: "fct-rej-6", status: "REJECTED", normalizedValue: 100_000_000, reportingPeriod: "2025-FY" });
    const validFact = createMockFact({ id: "fct-val-6", status: "APPROVED", normalizedValue: 90_000_000, reportingPeriod: "2024-FY" });

    const intel = FinancialIntelligenceEngine.analyzeWorkspaceIntelligence({
      workspaceId: "ws-test-phase-g",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      facts: [rejFact, validFact],
      pageManifests: pageManifestsMap
    });

    expect(intel.variances.length).toBe(0);
    expect(intel.exceptions.some((e) => e.type === "INSUFFICIENT_EVIDENCE")).toBe(true);
  });

  // =========================================================================
  // 3. CAUSAL EXPLANATIONS & NON-HALLUCINATION GUARANTEES
  // =========================================================================
  it("TEST 7: Unsupported causal explanation prevention explicitly sets status when cause is missing", () => {
    const curRev = createMockFact({
      id: "fct-cur-nocause",
      reportingPeriod: "2025-FY",
      normalizedValue: 110_000_000,
      sourceText: "Revenue for FY 2025 was EUR 110M"
    });
    const compRev = createMockFact({
      id: "fct-comp-nocause",
      reportingPeriod: "2024-FY",
      normalizedValue: 100_000_000,
      sourceText: "Revenue for FY 2024 was EUR 100M"
    });

    const intel = FinancialIntelligenceEngine.analyzeWorkspaceIntelligence({
      workspaceId: "ws-test-phase-g",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      facts: [curRev, compRev],
      pageManifests: pageManifestsMap
    });

    const obs = intel.observations.find((o) => o.relatedMetrics.includes("revenue"));
    expect(obs).toBeDefined();
    expect(obs?.hasDocumentedCausation).toBe(false);
    expect(obs?.causalStatusText).toBe("The cause is not established by the available evidence.");
  });

  it("TEST 8: Disclosed causal explanation in source text is captured without hallucination", () => {
    const curRev = createMockFact({
      id: "fct-cur-cause",
      reportingPeriod: "2025-FY",
      normalizedValue: 90_000_000,
      sourceText: "Sales revenue decreased owing to supply chain bottlenecks in Western Europe."
    });
    const compRev = createMockFact({
      id: "fct-comp-cause",
      reportingPeriod: "2024-FY",
      normalizedValue: 100_000_000,
      sourceText: "Sales revenue for 2024 was EUR 100M"
    });

    const intel = FinancialIntelligenceEngine.analyzeWorkspaceIntelligence({
      workspaceId: "ws-test-phase-g",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      facts: [curRev, compRev],
      pageManifests: pageManifestsMap
    });

    const obs = intel.observations.find((o) => o.relatedMetrics.includes("revenue"));
    expect(obs).toBeDefined();
    expect(obs?.hasDocumentedCausation).toBe(true);
    expect(obs?.causalSourceText).toContain("decreased owing to supply chain bottlenecks");
    expect(obs?.causalStatusText).toContain("Source document discloses cause");
  });

  // =========================================================================
  // 4. MULTI-PERIOD TRENDS & CAGR
  // =========================================================================
  it("TEST 9: Multi-period trends compute CAGR and identify missing periods accurately", () => {
    const rev23 = createMockFact({ id: "rev-23", reportingPeriod: "2023-FY", fiscalYear: "2023", normalizedValue: 100_000_000 });
    const rev24 = createMockFact({ id: "rev-24", reportingPeriod: "2024-FY", fiscalYear: "2024", normalizedValue: 110_000_000 });
    const rev25 = createMockFact({ id: "rev-25", reportingPeriod: "2025-FY", fiscalYear: "2025", normalizedValue: 121_000_000 });

    const intel = FinancialIntelligenceEngine.analyzeWorkspaceIntelligence({
      workspaceId: "ws-test-phase-g",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      additionalComparativePeriods: ["2023-FY"],
      facts: [rev23, rev24, rev25],
      pageManifests: pageManifestsMap
    });

    const trend = intel.multiPeriodTrends.find((t) => t.canonicalMetric === "revenue");
    expect(trend).toBeDefined();
    expect(trend?.points.length).toBe(3);
    expect(trend?.cagrPercentage).toBeCloseTo(0.10, 2); // (121M/100M)^(1/2) - 1 = 10%
    expect(trend?.overallDirection).toBe("UPWARD");
    expect(trend?.hasMissingPeriod).toBe(false);
  });

  // =========================================================================
  // 5. RATIO SHIFTS & BASIS POINTS
  // =========================================================================
  it("TEST 10: Ratio changes, basis points, and direction vectors compute accurately", () => {
    const rev25 = createMockFact({ id: "r25", canonicalMetric: "revenue", reportingPeriod: "2025-FY", normalizedValue: 100_000_000 });
    const gp25 = createMockFact({ id: "gp25", canonicalMetric: "gross_profit", reportingPeriod: "2025-FY", normalizedValue: 30_000_000 });

    const rev24 = createMockFact({ id: "r24", canonicalMetric: "revenue", reportingPeriod: "2024-FY", normalizedValue: 100_000_000 });
    const gp24 = createMockFact({ id: "gp24", canonicalMetric: "gross_profit", reportingPeriod: "2024-FY", normalizedValue: 25_000_000 });

    const intel = FinancialIntelligenceEngine.analyzeWorkspaceIntelligence({
      workspaceId: "ws-test-phase-g",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      facts: [rev25, gp25, rev24, gp24],
      pageManifests: pageManifestsMap
    });

    const gmRatio = intel.ratioComparisons.find((r) => r.ratioName === "Gross Margin");
    expect(gmRatio).toBeDefined();
    expect(gmRatio?.currentRatioValue).toBe(0.30); // 30%
    expect(gmRatio?.comparativeRatioValue).toBe(0.25); // 25%
    expect(gmRatio?.basisPointChange).toBe(500); // +500 bps
    expect(gmRatio?.direction).toBe("IMPROVED");
  });

  // =========================================================================
  // 6. IMMUTABILITY & FULL LINEAGE
  // =========================================================================
  it("TEST 11: Source facts remain strictly unmutated during analysis and lineage is preserved", () => {
    const fact = createMockFact({ id: "fct-immutable", normalizedValue: 50_000_000 });
    const factSnapshot = JSON.stringify(fact);

    const intel = FinancialIntelligenceEngine.analyzeWorkspaceIntelligence({
      workspaceId: "ws-test-phase-g",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      facts: [fact],
      pageManifests: pageManifestsMap
    });

    expect(JSON.stringify(fact)).toBe(factSnapshot);

    const trend = intel.multiPeriodTrends[0];
    if (trend && trend.points[0]) {
      expect(trend.points[0].evidenceRef).toBeDefined();
      expect(trend.points[0].evidenceRef?.lineage.layer4_extractedFact.id).toBe("fct-immutable");
    }
  });

  // =========================================================================
  // 7. VOLKSWAGEN FY2025 / FY2024 REGRESSION TEST
  // =========================================================================
  it("TEST 12: Volkswagen FY2025 vs FY2024 comparative analysis regression test", () => {
    const doc2025: DocumentRecord = {
      id: "doc-vw-2025",
      workspaceId: "ws-vw-regression",
      filename: "VW_2025_Annual_Report.pdf",
      originalName: "VW_2025_Annual_Report.pdf",
      mimeType: "application/pdf",
      size: 5000000,
      sha256: "vw2025sha256hash",
      status: "PROCESSED",
      category: "Annual Report",
      summary: "Volkswagen Group Annual Report 2025",
      language: "EN",
      currency: "EUR",
      entityName: "Volkswagen Group",
      period: "2025-FY",
      confidence: 0.99,
      extractedFactsCount: 10,
      reviewStatus: "AUTO_VERIFIED",
      createdAt: new Date().toISOString()
    };

    const doc2024: DocumentRecord = {
      ...doc2025,
      id: "doc-vw-2024",
      filename: "VW_2024_Annual_Report.pdf",
      originalName: "VW_2024_Annual_Report.pdf",
      period: "2024-FY"
    };

    const vwFacts: ExtractedFact[] = [
      // 2025 Facts
      createMockFact({ id: "vw-rev-25", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2025", canonicalMetric: "revenue", labelOriginal: "Sales revenue", normalizedValue: 321_913_000_000, reportingPeriod: "2025-FY", fiscalYear: "2025", pageNumber: 42 }),
      createMockFact({ id: "vw-cos-25", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2025", canonicalMetric: "cost_of_sales", labelOriginal: "Cost of sales", normalizedValue: 270_673_000_000, reportingPeriod: "2025-FY", fiscalYear: "2025", pageNumber: 42 }),
      createMockFact({ id: "vw-gp-25", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2025", canonicalMetric: "gross_profit", labelOriginal: "Gross profit", normalizedValue: 51_240_000_000, reportingPeriod: "2025-FY", fiscalYear: "2025", pageNumber: 42 }),
      createMockFact({ id: "vw-net-25", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2025", canonicalMetric: "net_income", labelOriginal: "Earnings after tax", normalizedValue: 12_800_000_000, reportingPeriod: "2025-FY", fiscalYear: "2025", pageNumber: 42 }),
      createMockFact({ id: "vw-assets-25", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2025", canonicalMetric: "total_assets", labelOriginal: "Total assets", normalizedValue: 580_000_000_000, reportingPeriod: "2025-FY", fiscalYear: "2025", pageNumber: 88 }),
      createMockFact({ id: "vw-liab-25", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2025", canonicalMetric: "total_liabilities", labelOriginal: "Total liabilities", normalizedValue: 420_000_000_000, reportingPeriod: "2025-FY", fiscalYear: "2025", pageNumber: 88 }),
      createMockFact({ id: "vw-eq-25", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2025", canonicalMetric: "equity", labelOriginal: "Total equity", normalizedValue: 160_000_000_000, reportingPeriod: "2025-FY", fiscalYear: "2025", pageNumber: 88 }),
      createMockFact({ id: "vw-cash-25", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2025", canonicalMetric: "cash_and_equivalents", labelOriginal: "Cash and cash equivalents", normalizedValue: 42_000_000_000, reportingPeriod: "2025-FY", fiscalYear: "2025", pageNumber: 88 }),

      // 2024 Comparative Facts
      createMockFact({ id: "vw-rev-24", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2024", canonicalMetric: "revenue", labelOriginal: "Sales revenue", normalizedValue: 324_667_000_000, reportingPeriod: "2024-FY", fiscalYear: "2024", pageNumber: 40 }),
      createMockFact({ id: "vw-gp-24", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2024", canonicalMetric: "gross_profit", labelOriginal: "Gross profit", normalizedValue: 52_100_000_000, reportingPeriod: "2024-FY", fiscalYear: "2024", pageNumber: 40 }),
      createMockFact({ id: "vw-net-24", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2024", canonicalMetric: "net_income", labelOriginal: "Earnings after tax", normalizedValue: 13_200_000_000, reportingPeriod: "2024-FY", fiscalYear: "2024", pageNumber: 40 }),
      createMockFact({ id: "vw-assets-24", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2024", canonicalMetric: "total_assets", labelOriginal: "Total assets", normalizedValue: 570_000_000_000, reportingPeriod: "2024-FY", fiscalYear: "2024", pageNumber: 85 }),
      createMockFact({ id: "vw-liab-24", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2024", canonicalMetric: "total_liabilities", labelOriginal: "Total liabilities", normalizedValue: 415_000_000_000, reportingPeriod: "2024-FY", fiscalYear: "2024", pageNumber: 85 }),
      createMockFact({ id: "vw-eq-24", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2024", canonicalMetric: "equity", labelOriginal: "Total equity", normalizedValue: 155_000_000_000, reportingPeriod: "2024-FY", fiscalYear: "2024", pageNumber: 85 }),
      createMockFact({ id: "vw-cash-24", workspaceId: "ws-vw-regression", company_id: "ws-vw-regression", documentId: "doc-vw-2024", canonicalMetric: "cash_and_equivalents", labelOriginal: "Cash and cash equivalents", normalizedValue: 40_000_000_000, reportingPeriod: "2024-FY", fiscalYear: "2024", pageNumber: 85 })
    ];

    const intel = FinancialIntelligenceEngine.analyzeWorkspaceIntelligence({
      workspaceId: "ws-vw-regression",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      entityName: "Volkswagen Group",
      entityScope: "Consolidated",
      facts: vwFacts,
      documents: [doc2025, doc2024],
      pageManifests: pageManifestsMap
    });

    // 1. Revenue Variance: 321,913M vs 324,667M => -2,754M (-0.85%)
    const revVar = intel.variances.find((v) => v.canonicalMetric === "revenue");
    expect(revVar).toBeDefined();
    expect(revVar?.currentValue).toBe(321_913_000_000);
    expect(revVar?.comparativeValue).toBe(324_667_000_000);
    expect(revVar?.absoluteVariance).toBe(-2_754_000_000);
    expect(revVar?.formattedPercentageVariance).toBe("-0.85%");
    expect(revVar?.direction).toBe("UNFAVORABLE");
    expect(revVar?.materiality).toBe("MATERIAL_CHANGE");

    // 2. Gross Profit Variance: 51,240M vs 52,100M => -860M (-1.65%)
    const gpVar = intel.variances.find((v) => v.canonicalMetric === "gross_profit");
    expect(gpVar).toBeDefined();
    expect(gpVar?.absoluteVariance).toBe(-860_000_000);

    // 3. Net Income Variance: 12,800M vs 13,200M => -400M (-3.03%)
    const netVar = intel.variances.find((v) => v.canonicalMetric === "net_income");
    expect(netVar).toBeDefined();
    expect(netVar?.absoluteVariance).toBe(-400_000_000);

    // 4. Total Assets Variance: 580,000M vs 570,000M => +10,000M (+1.75%)
    const assetVar = intel.variances.find((v) => v.canonicalMetric === "total_assets");
    expect(assetVar).toBeDefined();
    expect(assetVar?.absoluteVariance).toBe(10_000_000_000);

    // 5. Equity Variance: 160,000M vs 155,000M => +5,000M (+3.23%)
    const eqVar = intel.variances.find((v) => v.canonicalMetric === "equity");
    expect(eqVar).toBeDefined();
    expect(eqVar?.absoluteVariance).toBe(5_000_000_000);

    // 6. Cash Variance: 42,000M vs 40,000M => +2,000M (+5.00%)
    const cashVar = intel.variances.find((v) => v.canonicalMetric === "cash_and_equivalents");
    expect(cashVar).toBeDefined();
    expect(cashVar?.absoluteVariance).toBe(2_000_000_000);

    // 7. Ratios: Gross Margin (15.92% vs 16.05% => -13 bps), ROE (8.00% vs 8.52% => -52 bps)
    const gmRatio = intel.ratioComparisons.find((r) => r.ratioName === "Gross Margin");
    expect(gmRatio).toBeDefined();
    expect(gmRatio?.currentRatioValue).toBe(0.1592); // 51,240 / 321,913 = ~15.92%
    expect(gmRatio?.comparativeRatioValue).toBe(0.1605); // 52,100 / 324,667 = ~16.05%
    expect(gmRatio?.basisPointChange).toBe(-13); // -13 bps
    expect(gmRatio?.direction).toBe("DETERIORATED");

    const roeRatio = intel.ratioComparisons.find((r) => r.ratioName === "Return on Equity");
    expect(roeRatio).toBeDefined();
    expect(roeRatio?.currentRatioValue).toBe(0.08); // 12,800 / 160,000 = 8.00%
    expect(roeRatio?.comparativeRatioValue).toBe(0.0852); // 13,200 / 155,000 = 8.52%
    expect(roeRatio?.basisPointChange).toBe(-52); // -52 bps

    // 8. Lineage Verification for Calculations
    expect(revVar?.evidenceLineageCurrent?.lineage.layer5_sourceDocument.filename).toBe("VW_2025_Annual_Report.pdf");
    expect(revVar?.evidenceLineageCurrent?.lineage.layer6_physicalPage.physicalPageNumber).toBe(42);
    expect(revVar?.evidenceLineageComparative?.lineage.layer5_sourceDocument.filename).toBe("VW_2024_Annual_Report.pdf");
    expect(revVar?.evidenceLineageComparative?.lineage.layer6_physicalPage.physicalPageNumber).toBe(40);
  });
});
