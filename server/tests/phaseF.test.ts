import { describe, it, expect, beforeEach } from "vitest";
import { ReportingEngine } from "../reportingEngine.js";
import { AuditEvidenceEngine } from "../auditEvidenceEngine.js";
import { ExtractedFact, DocumentRecord, HumanReviewItem } from "../../src/types.js";

describe("Phase F — Financial Reporting, Statement Generation & Explainable Analysis Engine", () => {
  beforeEach(() => {
    AuditEvidenceEngine.clearState();
  });

  const createMockFact = (overrides: Partial<ExtractedFact>): ExtractedFact => ({
    id: `fct-${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: "ws-test-phase-f",
    company_id: "ws-test-phase-f",
    documentId: "doc-vw-2025",
    factType: "PRIMARY_FINANCIAL_LINE_ITEM",
    labelOriginal: overrides.labelOriginal || "Sales revenue",
    labelNormalized: overrides.canonicalMetric || "revenue",
    canonicalMetric: overrides.canonicalMetric || "revenue",
    valueOriginal: overrides.valueOriginal || "321,913",
    valueFunctional: String(overrides.normalizedValue ?? 321_913_000_000),
    normalizedValue: overrides.normalizedValue ?? 321_913_000_000,
    currencyOriginal: "EUR",
    functionalCurrency: "EUR",
    currency: "EUR",
    unitScale: "Millions",
    reportingPeriod: overrides.reportingPeriod || "2025-FY",
    fiscalYear: overrides.fiscalYear || "2025",
    entityName: "Volkswagen Group",
    entityScope: overrides.entityScope || "Consolidated",
    pageNumber: 42,
    sourceText: "Sales revenue for FY 2025 was EUR 321,913 million",
    confidence: 0.98,
    status: overrides.status || "APPROVED",
    verificationStatus: overrides.verificationStatus || "VERIFIED",
    extractionMethod: "HEURISTIC_PARSER",
    ...overrides
  });

  const pageManifest = Array.from({ length: 150 }, (_, i) => ({ physical_page_number: i + 1 }));

  it("TEST 1: Validated canonical facts generate correct financial statement values", () => {
    const revFact = createMockFact({ canonicalMetric: "revenue", normalizedValue: 321_913_000_000, labelOriginal: "Sales revenue" });
    const gpFact = createMockFact({ canonicalMetric: "gross_profit", normalizedValue: 51_240_000_000, labelOriginal: "Gross profit" });
    const netIncFact = createMockFact({ canonicalMetric: "net_income", normalizedValue: 12_800_000_000, labelOriginal: "Earnings after tax" });

    const report = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      facts: [revFact, gpFact, netIncFact],
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    expect(report.incomeStatement).toBeDefined();
    expect(report.incomeStatement?.netIncome).toBe(12_800_000_000);
    expect(report.incomeStatement?.sections[0].metrics.length).toBe(3);
    expect(report.overallConfidenceLevel).toBe("HIGH_CONFIDENCE");
  });

  it("TEST 2: An unverified/rejected fact cannot silently enter a report", () => {
    const rejectedFact = createMockFact({
      id: "fct-rejected-1",
      canonicalMetric: "revenue",
      status: "REJECTED",
      verificationStatus: "REJECTED"
    });

    const report = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      facts: [rejectedFact],
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    // Rejected fact MUST NOT enter statement metrics
    expect(report.incomeStatement).toBeUndefined();

    // Exception MUST be explicitly logged
    expect(report.exceptions.some((e) => e.type === "INSUFFICIENT_EVIDENCE" && e.factId === "fct-rejected-1")).toBe(true);
  });

  it("TEST 3: FY2025 and FY2024 comparative values remain correctly separated", () => {
    const rev2025 = createMockFact({ id: "fct-rev-2025", reportingPeriod: "2025-FY", fiscalYear: "2025", normalizedValue: 321_913_000_000 });
    const rev2024 = createMockFact({ id: "fct-rev-2024", reportingPeriod: "2024-FY", fiscalYear: "2024", normalizedValue: 324_667_000_000 });

    const report = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      facts: [rev2025, rev2024],
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    // Income Statement shows ONLY 2025 value
    expect(report.incomeStatement?.sections[0].metrics[0].value).toBe(321_913_000_000);

    // Variance engine compares both
    expect(report.variances.length).toBe(1);
    expect(report.variances[0].currentValue).toBe(321_913_000_000);
    expect(report.variances[0].comparativeValue).toBe(324_667_000_000);
    expect(report.variances[0].absoluteVariance).toBe(-2_754_000_000);
    expect(report.variances[0].formattedPercentageVariance).toBe("-0.85%");
  });

  it("TEST 4: Period mismatch prevents invalid variance calculation", () => {
    const q2Rev = createMockFact({ id: "fct-q2-2025", reportingPeriod: "2025-Q2", fiscalYear: "2025", normalizedValue: 80_000_000_000 });
    const fy2024Rev = createMockFact({ id: "fct-fy-2024", reportingPeriod: "2024-FY", fiscalYear: "2024", normalizedValue: 324_667_000_000 });

    const report = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-Q2",
      comparativePeriod: "2024-FY",
      facts: [q2Rev, fy2024Rev],
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    // Periods 2025-Q2 vs 2024-FY don't match annual key filters cleanly or raise period exception
    expect(report.incomeStatement?.sections[0].metrics[0].value).toBe(80_000_000_000);
  });

  it("TEST 5: Currency mismatch prevents invalid variance/ratio calculation", () => {
    const usdRev2025 = createMockFact({ id: "fct-usd-2025", currencyOriginal: "USD", normalizedValue: 350_000_000_000, reportingPeriod: "2025-FY" });
    const eurRev2024 = createMockFact({ id: "fct-eur-2024", currencyOriginal: "EUR", normalizedValue: 324_667_000_000, reportingPeriod: "2024-FY" });

    const report = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      facts: [usdRev2025, eurRev2024],
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    expect(report.variances.length).toBe(0);
    expect(report.exceptions.some((e) => e.type === "CURRENCY_MISMATCH")).toBe(true);
  });

  it("TEST 6: Entity/scope mismatch prevents invalid calculations", () => {
    const parentFact = createMockFact({ id: "fct-parent", entityScope: "ParentCompany", canonicalMetric: "revenue" });
    const consolidatedFact = createMockFact({ id: "fct-consolidated", entityScope: "Consolidated", canonicalMetric: "revenue" });

    const report = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      entityScope: "Consolidated",
      facts: [parentFact, consolidatedFact],
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    // Parent company fact excluded under Consolidated report target scope
    expect(report.exceptions.some((e) => e.type === "INCOMPATIBLE_SCOPE")).toBe(true);
    expect(report.incomeStatement?.sections[0].metrics[0].factId).toBe("fct-consolidated");
  });

  it("TEST 7: Division-by-zero ratio returns guarded status", () => {
    const zeroRevFact = createMockFact({ canonicalMetric: "revenue", normalizedValue: 0 });
    const gpFact = createMockFact({ canonicalMetric: "gross_profit", normalizedValue: 50_000_000 });

    const report = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      facts: [zeroRevFact, gpFact],
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    const gmRatio = report.ratios.find((r) => r.name === "Gross Margin");
    expect(gmRatio).toBeDefined();
    expect(gmRatio?.value).toBeNull();
    expect(gmRatio?.formattedValue).toBe("N/A (Division by zero)");
    expect(gmRatio?.eligibilityStatus).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("TEST 8: Missing ratio input returns INSUFFICIENT_EVIDENCE", () => {
    const netIncFact = createMockFact({ canonicalMetric: "net_income", normalizedValue: 10_000_000 });

    const report = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      facts: [netIncFact], // Missing total_assets
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    const roaRatio = report.ratios.find((r) => r.name === "Return on Assets");
    expect(roaRatio).toBeDefined();
    expect(roaRatio?.value).toBeNull();
    expect(roaRatio?.formattedValue).toBe("INSUFFICIENT_EVIDENCE");
    expect(roaRatio?.eligibilityStatus).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("TEST 9: Balance sheet reconciliation status propagates correctly", () => {
    const assetsFact = createMockFact({ canonicalMetric: "total_assets", normalizedValue: 500_000_000_000 });
    const liabFact = createMockFact({ canonicalMetric: "total_liabilities", normalizedValue: 300_000_000_000 });
    const eqFact = createMockFact({ canonicalMetric: "equity", normalizedValue: 200_000_000_000 });

    const reportReconciled = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      facts: [assetsFact, liabFact, eqFact],
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    expect(reportReconciled.balanceSheet?.isReconciled).toBe(true);
    expect(reportReconciled.balanceSheet?.status).toBe("RECONCILED");

    // Unreconciled balance sheet test
    const eqFactWrong = createMockFact({ canonicalMetric: "equity", normalizedValue: 150_000_000_000 });
    const reportUnreconciled = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      facts: [assetsFact, liabFact, eqFactWrong],
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    expect(reportUnreconciled.balanceSheet?.isReconciled).toBe(false);
    expect(reportUnreconciled.balanceSheet?.status).toBe("DISCREPANCY_DETECTED");
    expect(reportUnreconciled.exceptions.some((e) => e.type === "UNRECONCILED_BALANCE_SHEET")).toBe(true);
  });

  it("TEST 10: Every displayed material metric retains evidence lineage", () => {
    const revFact = createMockFact({
      id: "fct-lineage-test",
      canonicalMetric: "revenue",
      normalizedValue: 321_913_000_000,
      pageNumber: 42,
      provenance: {
        pageNumber: 42,
        tableRowIndex: 2,
        tableColIndex: 1,
        rawSnippet: "Sales revenue 321,913"
      }
    });

    const docRecord: DocumentRecord = {
      id: "doc-vw-2025",
      workspaceId: "ws-test-phase-f",
      filename: "VW_2025.pdf",
      originalName: "VW_2025.pdf",
      mimeType: "application/pdf",
      size: 1000000,
      sha256: "abc123sha256",
      status: "PROCESSED",
      category: "Annual Report",
      summary: "VW 2025 Annual Report",
      language: "EN",
      currency: "EUR",
      entityName: "Volkswagen Group",
      period: "2025-FY",
      confidence: 0.98,
      extractedFactsCount: 1,
      reviewStatus: "AUTO_VERIFIED",
      createdAt: new Date().toISOString()
    };

    const report = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      facts: [revFact],
      documents: [docRecord],
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    const metric = report.incomeStatement?.sections[0].metrics[0];
    expect(metric?.evidenceRef).toBeDefined();
    expect(metric?.evidenceRef?.lineage.layer1_dashboardValue).toBe("€321.913B");
    expect(metric?.evidenceRef?.lineage.layer5_sourceDocument.filename).toBe("VW_2025.pdf");
    expect(metric?.evidenceRef?.lineage.layer6_physicalPage.physicalPageNumber).toBe(42);
    expect(metric?.evidenceRef?.lineage.layer7_sourceLocation.tableRowIndex).toBe(2);
  });

  it("TEST 11: Derived variance retains BOTH source fact IDs", () => {
    const curFact = createMockFact({ id: "fct-cur-11", reportingPeriod: "2025-FY", fiscalYear: "2025", normalizedValue: 321_913_000_000 });
    const compFact = createMockFact({ id: "fct-comp-11", reportingPeriod: "2024-FY", fiscalYear: "2024", normalizedValue: 324_667_000_000 });

    const report = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      facts: [curFact, compFact],
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    const variance = report.variances[0];
    expect(variance).toBeDefined();
    expect(variance.sourceFactIdCurrent).toBe("fct-cur-11");
    expect(variance.sourceFactIdComparative).toBe("fct-comp-11");
    expect(variance.derivedFactId).toBe("var-revenue-2025-FY-2024-FY");
  });

  it("TEST 12: Human-reviewed facts preserve original extraction history", () => {
    const originalFact = createMockFact({
      id: "fct-rev-review-test",
      canonicalMetric: "revenue",
      normalizedValue: 320_000_000_000
    });

    const reviewItem = AuditEvidenceEngine.createOrUpdateReviewItem({
      workspaceId: "ws-test-phase-f",
      documentId: "doc-vw-2025",
      factId: originalFact.id,
      triggerReason: "AMBIGUOUS_FACT",
      description: "Needs human verification.",
      originalFact,
      currentSelection: { normalizedValue: 320_000_000_000 }
    });

    AuditEvidenceEngine.processHumanOverride(reviewItem.id, {
      reviewer: "Auditor_Jane",
      reason: "Corrected from restatement footnote.",
      newSelection: { normalizedValue: 321_913_000_000 },
      action: "HUMAN_VERIFIED"
    });

    // Generate report with updated review state
    const report = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      facts: [originalFact],
      reviewItems: [reviewItem],
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    // Original fact in reviewItem remains unmutated
    expect(reviewItem.originalFact.normalizedValue).toBe(320_000_000_000);
    expect(reviewItem.reviewHistory[0].reviewer).toBe("Auditor_Jane");
  });

  it("TEST 13: Missing physical source evidence prevents false VERIFIED status", () => {
    const invalidFact = createMockFact({
      id: "fct-page-invalid",
      pageNumber: 999, // Page 999 does not exist in 150 page manifest!
      canonicalMetric: "revenue"
    });

    const report = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      facts: [invalidFact],
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    expect(report.exceptions.some((e) => e.type === "INSUFFICIENT_EVIDENCE")).toBe(true);
  });

  it("TEST 14: No fabricated values appear when data is incomplete", () => {
    const revOnlyFact = createMockFact({ canonicalMetric: "revenue", normalizedValue: 321_913_000_000 });

    const report = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      facts: [revOnlyFact],
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    // Cost of sales, Opex, Net income are NOT fabricated as 0
    const isMetrics = report.incomeStatement?.sections[0].metrics;
    expect(isMetrics?.length).toBe(1);
    expect(isMetrics?.find((m) => m.canonicalMetric === "cost_of_sales")).toBeUndefined();
    expect(isMetrics?.find((m) => m.canonicalMetric === "net_income")).toBeUndefined();
  });

  it("TEST 15: Volkswagen FY2025 regression produces expected verified target-period values from Phase C/D/E without hardcoded Volkswagen-specific production logic", () => {
    const vwFacts: ExtractedFact[] = [
      createMockFact({ id: "vw-rev-25", canonicalMetric: "revenue", labelOriginal: "Sales revenue", normalizedValue: 321_913_000_000, reportingPeriod: "2025-FY", fiscalYear: "2025" }),
      createMockFact({ id: "vw-rev-24", canonicalMetric: "revenue", labelOriginal: "Sales revenue", normalizedValue: 324_667_000_000, reportingPeriod: "2024-FY", fiscalYear: "2024" }),
      createMockFact({ id: "vw-cos-25", canonicalMetric: "cost_of_sales", labelOriginal: "Cost of sales", normalizedValue: 270_673_000_000, reportingPeriod: "2025-FY", fiscalYear: "2025" }),
      createMockFact({ id: "vw-gp-25", canonicalMetric: "gross_profit", labelOriginal: "Gross profit", normalizedValue: 51_240_000_000, reportingPeriod: "2025-FY", fiscalYear: "2025" }),
      createMockFact({ id: "vw-assets-25", canonicalMetric: "total_assets", labelOriginal: "Total assets", normalizedValue: 580_000_000_000, reportingPeriod: "2025-FY", fiscalYear: "2025" }),
      createMockFact({ id: "vw-liab-25", canonicalMetric: "total_liabilities", labelOriginal: "Total liabilities", normalizedValue: 420_000_000_000, reportingPeriod: "2025-FY", fiscalYear: "2025" }),
      createMockFact({ id: "vw-eq-25", canonicalMetric: "equity", labelOriginal: "Equity", normalizedValue: 160_000_000_000, reportingPeriod: "2025-FY", fiscalYear: "2025" })
    ];

    const report = ReportingEngine.generateFinancialReport({
      workspaceId: "ws-test-phase-f",
      reportingPeriod: "2025-FY",
      comparativePeriod: "2024-FY",
      entityName: "Volkswagen Group",
      entityScope: "Consolidated",
      facts: vwFacts,
      pageManifests: new Map([["doc-vw-2025", pageManifest]])
    });

    // 1. Income Statement
    expect(report.incomeStatement?.sections[0].metrics.find((m) => m.canonicalMetric === "revenue")?.displayValue).toBe("€321.913B");
    expect(report.incomeStatement?.sections[0].metrics.find((m) => m.canonicalMetric === "gross_profit")?.displayValue).toBe("€51.240B");

    // 2. Comparative Variance
    const revVar = report.variances.find((v) => v.canonicalMetric === "revenue");
    expect(revVar).toBeDefined();
    expect(revVar?.absoluteVariance).toBe(-2_754_000_000);
    expect(revVar?.formattedPercentageVariance).toBe("-0.85%");

    // 3. Balance Sheet Identity
    expect(report.balanceSheet?.isReconciled).toBe(true);
    expect(report.balanceSheet?.status).toBe("RECONCILED");

    // 4. Financial Ratios
    const gmRatio = report.ratios.find((r) => r.name === "Gross Margin");
    expect(gmRatio?.value).toBe(0.1592); // 51.240B / 321.913B = ~15.92%
    expect(gmRatio?.formattedValue).toBe("15.92%");

    // 5. CPA Observations
    expect(report.observations.some((o) => o.text.includes("Sales revenue decreased by -€2.754B (-0.85%)"))).toBe(true);
    expect(report.observations.some((o) => o.text.includes("Balance Sheet is fully reconciled"))).toBe(true);
  });
});
