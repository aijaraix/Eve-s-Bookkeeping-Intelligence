import { describe, it, expect, beforeEach } from "vitest";
import { AuditEvidenceEngine } from "../auditEvidenceEngine.js";
import { ExtractedFact, DocumentRecord } from "../../src/types.js";

describe("Phase E — Audit Evidence, Lineage, Confidence & Human Review Engine", () => {
  beforeEach(() => {
    AuditEvidenceEngine.clearState();
  });

  // Helper to create mock facts
  const createMockFact = (overrides: Partial<ExtractedFact>): ExtractedFact => ({
    id: `fct-${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: "ws-test-phase-e",
    company_id: "ws-test-phase-e",
    documentId: "doc-vw-2025",
    factType: "PRIMARY_FINANCIAL_LINE_ITEM",
    labelOriginal: overrides.labelOriginal || "Sales revenue",
    labelNormalized: overrides.canonicalMetric || "revenue",
    valueOriginal: overrides.valueOriginal || "321,913",
    valueFunctional: String(overrides.normalizedValue ?? 321_913_000_000),
    normalizedValue: overrides.normalizedValue ?? 321_913_000_000,
    currencyOriginal: "EUR",
    functionalCurrency: "EUR",
    currency: "EUR",
    unitScale: "Millions",
    reportingPeriod: "2025-FY",
    fiscalYear: "2025",
    entityName: "Volkswagen Group",
    entityScope: "Consolidated",
    pageNumber: 42,
    sourceText: "Sales revenue for FY 2025 was EUR 321,913 million",
    confidence: 0.98,
    status: "PROPOSED",
    verificationStatus: "UNVERIFIED",
    extractionMethod: "HEURISTIC_PARSER",
    ...overrides
  });

  it("1. 7-Layer Lineage Traceability — Complete traversal from Dashboard Value to Physical Page Source Coordinates", () => {
    const revFact = createMockFact({
      id: "vw-rev-2025",
      documentId: "doc-vw-report",
      labelOriginal: "Sales revenue",
      canonicalMetric: "revenue",
      valueOriginal: "321,913",
      unitScale: "Millions",
      currencyOriginal: "EUR",
      normalizedValue: 321_913_000_000,
      pageNumber: 42,
      sourceText: "Sales revenue reached EUR 321,913 million in FY 2025",
      provenance: {
        pageNumber: 42,
        boundingBox: { xMin: 100, yMin: 200, xMax: 400, yMax: 220 },
        tableRowIndex: 3,
        tableColIndex: 2,
        cellRange: "C4:D4",
        rawSnippet: "Sales revenue 321,913",
        contextSentence: "Group sales revenue increased to 321,913 million Euros."
      }
    });

    const docRecord: DocumentRecord = {
      id: "doc-vw-report",
      workspaceId: "ws-test-phase-e",
      filename: "VW_FY2025_Annual_Report.pdf",
      originalName: "VW_FY2025_Annual_Report.pdf",
      mimeType: "application/pdf",
      size: 15_420_000,
      sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      status: "PROCESSED",
      category: "Annual Report",
      summary: "VW Annual Report FY2025",
      language: "EN",
      currency: "EUR",
      entityName: "Volkswagen Group",
      period: "2025-FY",
      confidence: 0.98,
      extractedFactsCount: 1,
      reviewStatus: "AUTO_VERIFIED",
      createdAt: new Date().toISOString()
    };

    const pageManifest = Array.from({ length: 150 }, (_, i) => ({ physical_page_number: i + 1 }));

    const evidence = AuditEvidenceEngine.getEvidenceRecord(revFact, {
      documentRecord: docRecord,
      pageManifest,
      canonicalReasoning: "Primary line item in Consolidated Financial Statements",
      canonicalScore: 98
    });

    expect(evidence.evidenceValid).toBe(true);
    expect(evidence.reviewStatus).toBe("AUTO_VERIFIED");

    // Layer 1: Dashboard Display Value
    expect(evidence.lineage.layer1_dashboardValue).toBe("€321.913B");

    // Layer 2: Canonical Metric
    expect(evidence.lineage.layer2_canonicalMetric.metric).toBe("revenue");
    expect(evidence.lineage.layer2_canonicalMetric.selectionScore).toBe(98);

    // Layer 3: Accounting Validation Status
    expect(evidence.lineage.layer3_accountingValidation.status).toBe("ACCOUNTING_VALIDATED");

    // Layer 4: Extracted Fact Details
    expect(evidence.lineage.layer4_extractedFact.labelOriginal).toBe("Sales revenue");
    expect(evidence.lineage.layer4_extractedFact.valueOriginal).toBe("321,913");
    expect(evidence.lineage.layer4_extractedFact.unitScale).toBe("Millions");

    // Layer 5: Source Document Record
    expect(evidence.lineage.layer5_sourceDocument.filename).toBe("VW_FY2025_Annual_Report.pdf");
    expect(evidence.lineage.layer5_sourceDocument.sha256).toContain("9f86d081884c7d");

    // Layer 6: Physical Page Verification
    expect(evidence.lineage.layer6_physicalPage.physicalPageNumber).toBe(42);
    expect(evidence.lineage.layer6_physicalPage.existsInManifest).toBe(true);

    // Layer 7: Source Location & Coordinates
    expect(evidence.lineage.layer7_sourceLocation.boundingBox).toBeDefined();
    expect(evidence.lineage.layer7_sourceLocation.tableRowIndex).toBe(3);
    expect(evidence.lineage.layer7_sourceLocation.sourceText).toContain("Sales revenue");
  });

  it("2. Multidimensional Confidence Architecture — 7 distinct confidence dimensions preserved", () => {
    const fact = createMockFact({
      confidence: 0.96,
      canonicalMetric: "revenue",
      unitScale: "Millions",
      currencyOriginal: "EUR",
      reportingPeriod: "2025-FY",
      entityName: "Volkswagen Group"
    });

    const multiConf = AuditEvidenceEngine.calculateMultidimensionalConfidence(fact, {
      canonicalScore: 95,
      validationPassed: true
    });

    expect(multiConf.extractionConfidence).toBe(0.96);
    expect(multiConf.semanticMetricConfidence).toBeGreaterThanOrEqual(0.95);
    expect(multiConf.periodConfidence).toBeGreaterThanOrEqual(0.90);
    expect(multiConf.currencyScaleConfidence).toBeGreaterThanOrEqual(0.90);
    expect(multiConf.entityScopeConfidence).toBeGreaterThanOrEqual(0.90);
    expect(multiConf.canonicalSelectionConfidence).toBe(0.95);
    expect(multiConf.accountingValidationConfidence).toBeGreaterThanOrEqual(0.90);
    expect(multiConf.overallAggregateConfidence).toBeGreaterThan(0.90);
  });

  it("3. Human Review Queue — Automatic creation of review items for discrepancies and triggers", () => {
    const factAmbiguous = createMockFact({
      id: "fct-ambig",
      canonicalMetric: "unclassified",
      labelOriginal: "Other mysterious income items"
    });

    const reviewItem = AuditEvidenceEngine.evaluateFactForReviewTriggers(factAmbiguous);

    expect(reviewItem).not.toBeNull();
    expect(reviewItem?.triggerReason).toBe("AMBIGUOUS_FACT");
    expect(reviewItem?.status).toBe("REVIEW_REQUIRED");

    const queue = AuditEvidenceEngine.getReviewQueue("ws-test-phase-e");
    expect(queue.length).toBe(1);
    expect(queue[0].factId).toBe("fct-ambig");
  });

  it("4. Fact Immutability Guarantee under Human Override — Original extracted fact is NEVER mutated", () => {
    const originalFact = createMockFact({
      id: "fct-override-test",
      canonicalMetric: "revenue",
      valueOriginal: "321,910",
      normalizedValue: 321_910_000_000
    });

    const originalJsonCopy = JSON.stringify(originalFact);

    const reviewItem = AuditEvidenceEngine.createOrUpdateReviewItem({
      workspaceId: "ws-test-phase-e",
      documentId: "doc-vw-2025",
      factId: originalFact.id,
      triggerReason: "AMBIGUOUS_FACT",
      description: "Restatement discrepancy detected.",
      originalFact,
      currentSelection: { normalizedValue: 321_910_000_000 }
    });

    // Apply human override modifying normalized value to 321,913,000,000
    const { originalFactUnchanged } = AuditEvidenceEngine.processHumanOverride(reviewItem.id, {
      reviewer: "CPA_Auditor_John",
      reason: "Updated per restatement note 14 on page 88.",
      newSelection: { normalizedValue: 321_913_000_000 },
      action: "OVERRIDE_VALUE"
    });

    // ASSERT: Original extracted fact inside review queue remains 100% UNMUTATED
    expect(originalFactUnchanged).toBe(true);
    expect(JSON.stringify(reviewItem.originalFact)).toBe(originalJsonCopy);
    expect(reviewItem.originalFact.normalizedValue).toBe(321_910_000_000);

    // ASSERT: Review history captures override cleanly
    expect(reviewItem.status).toBe("HUMAN_VERIFIED");
    expect(reviewItem.reviewHistory.length).toBe(1);
    expect(reviewItem.reviewHistory[0].reviewer).toBe("CPA_Auditor_John");
    expect(reviewItem.reviewHistory[0].newSelection.normalizedValue).toBe(321_913_000_000);
  });

  it("5. Nonexistent Citation & Missing Physical Page — Zero fabricated evidence, sets INSUFFICIENT_EVIDENCE", () => {
    const factMissingPage = createMockFact({
      id: "fct-page-26-on-25p-doc",
      pageNumber: 26, // Physical page 26 on a 25-page PDF!
      sourceText: "Invalid citation page"
    });

    const pageManifest25 = Array.from({ length: 25 }, (_, i) => ({ physical_page_number: i + 1 }));

    const evidence = AuditEvidenceEngine.getEvidenceRecord(factMissingPage, {
      pageManifest: pageManifest25
    });

    // System MUST NOT fabricate page 26!
    expect(evidence.lineage.layer6_physicalPage.existsInManifest).toBe(false);
    expect(evidence.evidenceValid).toBe(false);
    expect(evidence.reviewStatus).toBe("INSUFFICIENT_EVIDENCE");
    expect(evidence.insufficientEvidenceReason).toContain("Physical page 26 is missing from document page manifest");
  });

  it("6. Conflicting Source Values Trigger — Automated detection of conflicting facts in workspace", () => {
    const factA = createMockFact({
      id: "fct-rev-A",
      canonicalMetric: "revenue",
      normalizedValue: 300_000_000_000,
      reportingPeriod: "2025-FY"
    });

    const factB = createMockFact({
      id: "fct-rev-B",
      canonicalMetric: "revenue",
      normalizedValue: 310_000_000_000, // Conflict!
      reportingPeriod: "2025-FY"
    });

    const reviewItem = AuditEvidenceEngine.evaluateFactForReviewTriggers(factA, [factA, factB]);

    expect(reviewItem).not.toBeNull();
    expect(reviewItem?.triggerReason).toBe("CONFLICTING_FACTS");
    expect(reviewItem?.description).toContain("Conflicting fact found for metric revenue");
  });

  it("7. Derived Fact Incomplete Lineage — Missing input component facts triggers INSUFFICIENT_EVIDENCE", () => {
    const derivedFact = createMockFact({
      id: "fct-derived-gm",
      canonicalMetric: "grossMarginPct",
      reportedOrDerived: "derived",
      formulaIfDerived: "gross_profit / revenue",
      normalizedValue: 15.92
    });

    const evidence = AuditEvidenceEngine.getEvidenceRecord(derivedFact, {
      workspaceFacts: [] // EMPTY WORKSPACE FACTS = MISSING INPUT LINEAGE
    });

    expect(evidence.evidenceValid).toBe(false);
    expect(evidence.reviewStatus).toBe("INSUFFICIENT_EVIDENCE");
    expect(evidence.insufficientEvidenceReason).toContain("Derived metric input lineage is incomplete");
  });

  it("8. Immutable Append-Only Audit Trail Logging", () => {
    AuditEvidenceEngine.logAuditEvent({
      workspaceId: "ws-test-phase-e",
      documentId: "doc-vw-2025",
      factId: "vw-rev-2025",
      eventType: "EXTRACTION",
      actor: "Hermes_Extractor",
      description: "Extracted Sales revenue of 321,913 million EUR."
    });

    AuditEvidenceEngine.logAuditEvent({
      workspaceId: "ws-test-phase-e",
      documentId: "doc-vw-2025",
      factId: "vw-rev-2025",
      eventType: "ACCOUNTING_VALIDATION",
      actor: "Accounting_Engine",
      description: "Validated Gross Profit Identity: €51.24B = €321.91B - €270.67B."
    });

    const logs = AuditEvidenceEngine.getAuditLogs("ws-test-phase-e", "vw-rev-2025");
    expect(logs.length).toBe(2);
    expect(logs[0].eventType).toBe("EXTRACTION");
    expect(logs[1].eventType).toBe("ACCOUNTING_VALIDATION");
  });

  it("9. Volkswagen FY2025 End-to-End Audit Lineage Regression Test — Full 7-Layer Lineage Traversal", () => {
    const vwRevenueFact: ExtractedFact = {
      id: "vw-rev-2025-canonical",
      workspaceId: "ws-vw-fy2025",
      company_id: "vw-group",
      documentId: "doc-vw-annual-report-2025",
      factType: "PRIMARY_FINANCIAL_LINE_ITEM",
      canonicalMetric: "revenue",
      labelOriginal: "Sales revenue",
      labelNormalized: "revenue",
      valueOriginal: "321,913",
      valueFunctional: "321913000000",
      normalizedValue: 321_913_000_000,
      currencyOriginal: "EUR",
      functionalCurrency: "EUR",
      currency: "EUR",
      unitScale: "Millions",
      reportingPeriod: "2025-FY",
      fiscalYear: "2025",
      entityName: "Volkswagen Group",
      entityScope: "Consolidated",
      pageNumber: 42,
      sourceText: "Sales revenue in the 2025 fiscal year amounted to €321,913 million.",
      confidence: 0.99,
      status: "APPROVED",
      verificationStatus: "VERIFIED",
      extractionMethod: "HEURISTIC_PARSER",
      provenance: {
        pageNumber: 42,
        boundingBox: { xMin: 120, yMin: 180, xMax: 450, yMax: 200 },
        tableRowIndex: 1,
        tableColIndex: 2,
        cellRange: "B2:C2",
        rawSnippet: "Sales revenue | 321,913",
        contextSentence: "In FY 2025, consolidated sales revenue reached EUR 321,913 million."
      }
    };

    const docRecord: DocumentRecord = {
      id: "doc-vw-annual-report-2025",
      workspaceId: "ws-vw-fy2025",
      filename: "Volkswagen_Group_Annual_Report_2025.pdf",
      originalName: "Volkswagen_Group_Annual_Report_2025.pdf",
      mimeType: "application/pdf",
      size: 24_500_000,
      sha256: "4a2f819036c1e289f81a7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15",
      status: "PROCESSED",
      category: "Annual Report",
      summary: "Volkswagen Group Annual Report 2025",
      language: "EN",
      currency: "EUR",
      entityName: "Volkswagen Group",
      period: "2025-FY",
      confidence: 0.99,
      extractedFactsCount: 12,
      reviewStatus: "AUTO_VERIFIED",
      createdAt: new Date().toISOString()
    };

    const pageManifest = Array.from({ length: 280 }, (_, i) => ({ physical_page_number: i + 1 }));

    // Log extraction audit event
    AuditEvidenceEngine.logAuditEvent({
      workspaceId: "ws-vw-fy2025",
      documentId: docRecord.id,
      factId: vwRevenueFact.id,
      eventType: "EXTRACTION",
      actor: "Eve_Ingestion_Engine",
      description: "Extracted canonical Sales Revenue fact from VW Annual Report page 42."
    });

    // Traverse full end-to-end evidence record
    const evidence = AuditEvidenceEngine.getEvidenceRecord(vwRevenueFact, {
      documentRecord: docRecord,
      pageManifest,
      canonicalReasoning: "Identified as primary Consolidated Sales Revenue in Income Statement",
      canonicalScore: 99
    });

    // 1. Lineage Verification
    expect(evidence.evidenceValid).toBe(true);
    expect(evidence.reviewStatus).toBe("AUTO_VERIFIED");
    expect(evidence.lineage.layer1_dashboardValue).toBe("€321.913B");
    expect(evidence.lineage.layer2_canonicalMetric.metric).toBe("revenue");
    expect(evidence.lineage.layer3_accountingValidation.status).toBe("ACCOUNTING_VALIDATED");
    expect(evidence.lineage.layer4_extractedFact.valueOriginal).toBe("321,913");
    expect(evidence.lineage.layer4_extractedFact.unitScale).toBe("Millions");
    expect(evidence.lineage.layer5_sourceDocument.filename).toBe("Volkswagen_Group_Annual_Report_2025.pdf");
    expect(evidence.lineage.layer6_physicalPage.physicalPageNumber).toBe(42);
    expect(evidence.lineage.layer6_physicalPage.existsInManifest).toBe(true);
    expect(evidence.lineage.layer7_sourceLocation.tableRowIndex).toBe(1);

    // 2. Multidimensional Confidence Verification
    expect(evidence.multidimensionalConfidence.overallAggregateConfidence).toBeGreaterThan(0.95);
    expect(evidence.multidimensionalConfidence.extractionConfidence).toBe(0.99);

    // 3. Audit Trail Verification
    expect(evidence.auditEvents.length).toBe(1);
    expect(evidence.auditEvents[0].eventType).toBe("EXTRACTION");
  });
});
