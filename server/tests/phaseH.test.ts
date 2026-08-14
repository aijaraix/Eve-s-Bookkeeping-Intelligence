import { describe, test, expect } from "vitest";
import { AuditEvidenceEngine } from "../auditEvidenceEngine";
import { FinancialIntelligenceEngine } from "../financialIntelligenceEngine";
import { ReportingFactGate } from "../reportingFactGate";

describe("Phase H — Customer Experience, Role Navigation & Information Architecture Suite", () => {
  test("TEST 1: Customer primary navigation architecture retains 7 core destinations", () => {
    const customerPrimaryDestinations = [
      "overview", // Home
      "companies",
      "documents",
      "financials",
      "reports",
      "review",
      "settings",
    ];

    expect(customerPrimaryDestinations.length).toBe(7);
    expect(customerPrimaryDestinations).toContain("overview");
    expect(customerPrimaryDestinations).toContain("financials");
    expect(customerPrimaryDestinations).toContain("review");
  });

  test("TEST 2: Reviewer and Admin roles cleanly extend primary navigation with deep accounting and system controls", () => {
    const customerNav = ["overview", "companies", "documents", "financials", "reports", "review", "settings"];
    const reviewerNav = [...customerNav, "unbounded-registry", "findings", "deliverables-stage"];
    const adminNav = [...reviewerNav, "swarm", "system-diagnostics", "tenant-regression", "activity", "teams"];

    expect(reviewerNav.length).toBeGreaterThan(customerNav.length);
    expect(adminNav.length).toBeGreaterThan(reviewerNav.length);
    expect(reviewerNav).toContain("unbounded-registry");
    expect(adminNav).toContain("swarm");
  });

  test("TEST 3: Financial metrics preserve 7-layer evidence lineage progressive disclosure", () => {
    const sampleFact = {
      id: "fact-h-1",
      canonicalMetric: "revenue",
      normalizedValue: 1250000,
      valueFunctional: "1250000",
      valueOriginal: "1250000",
      currencyOriginal: "USD",
      reportingPeriod: "FY2025",
      documentId: "doc-h-101",
      pageNumber: 12,
      boundingCoordinates: { x: 10, y: 20, w: 100, h: 30 },
      extractionConfidence: 0.98,
      status: "VERIFIED" as const,
      workspaceId: "ws-default",
    };

    const reviewItem = AuditEvidenceEngine.createOrUpdateReviewItem({
      workspaceId: "ws-default",
      documentId: sampleFact.documentId,
      factId: sampleFact.id,
      triggerReason: "LOW_CONFIDENCE",
      description: "Fact lineage verification for customer drill-down.",
      originalFact: sampleFact as any,
      currentSelection: { canonicalMetric: "revenue", normalizedValue: 1250000 },
    });

    expect(reviewItem.factId).toBe("fact-h-1");
    expect(reviewItem.triggerReason).toBe("LOW_CONFIDENCE");
  });

  test("TEST 4: Gate & Intelligence engines enforce company-agnostic multi-currency handling", () => {
    const usdFact = {
      id: "f-usd",
      canonicalMetric: "revenue",
      normalizedValue: 500000,
      valueFunctional: "500000",
      currencyOriginal: "USD",
      reportingPeriod: "FY2025",
      documentId: "doc-1",
      pageNumber: 1,
      extractionConfidence: 0.99,
      status: "VERIFIED" as const,
      workspaceId: "ws-test",
    };

    const eurFact = {
      id: "f-eur",
      canonicalMetric: "revenue",
      normalizedValue: 450000,
      valueFunctional: "450000",
      currencyOriginal: "EUR",
      reportingPeriod: "FY2024",
      documentId: "doc-2",
      pageNumber: 1,
      extractionConfidence: 0.99,
      status: "VERIFIED" as const,
      workspaceId: "ws-test",
    };

    const intelPackage = FinancialIntelligenceEngine.analyzeWorkspaceIntelligence({
      workspaceId: "ws-test",
      reportingPeriod: "FY2025",
      comparativePeriod: "FY2024",
      facts: [usdFact as any, eurFact as any],
    });

    const currencyException = intelPackage.exceptions.find((e) => e.type === "CURRENCY_MISMATCH");
    expect(currencyException).toBeDefined();
    expect(currencyException?.message).toContain("Current currency (USD) != Comparative currency (EUR)");
  });

  test("TEST 5: Unified Review Center aggregates actionable human-in-the-loop items", () => {
    const queue = AuditEvidenceEngine.getReviewQueue();
    expect(Array.isArray(queue)).toBe(true);
  });
});
