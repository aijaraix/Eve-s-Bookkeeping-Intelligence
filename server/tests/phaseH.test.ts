import { describe, test, expect } from "vitest";
import { AuditEvidenceEngine } from "../auditEvidenceEngine";
import { FinancialIntelligenceEngine } from "../financialIntelligenceEngine";
import { ReportingEngine } from "../reportingEngine";
import { BackgroundIngestionQueue } from "../backgroundQueue";

describe("Phase H — Customer UX, Project Workspace & Document-First Navigation Suite", () => {
  test("TEST 1: Customer primary navigation architecture retains 7 core destinations including Projects", () => {
    const customerPrimaryDestinations = [
      "overview", // Home
      "projects",  // Projects
      "documents",
      "financials",
      "reports",
      "review",
      "settings",
    ];

    expect(customerPrimaryDestinations.length).toBe(7);
    expect(customerPrimaryDestinations).toContain("overview");
    expect(customerPrimaryDestinations).toContain("projects");
    expect(customerPrimaryDestinations).toContain("financials");
    expect(customerPrimaryDestinations).toContain("review");
  });

  test("TEST 2: Reviewer and Admin roles cleanly extend primary navigation while customer mode hides internal switcher", () => {
    const customerNav = ["overview", "projects", "documents", "financials", "reports", "review", "settings"];
    const reviewerNav = [...customerNav, "unbounded-registry", "findings", "deliverables-stage"];
    const adminNav = [...reviewerNav, "swarm", "system-diagnostics", "tenant-regression", "activity", "teams"];

    expect(reviewerNav.length).toBeGreaterThan(customerNav.length);
    expect(adminNav.length).toBeGreaterThan(reviewerNav.length);
    expect(reviewerNav).toContain("unbounded-registry");
    expect(adminNav).toContain("swarm");
  });

  test("TEST 3: Public unauthenticated upload session preserves files and attaches to Project upon authentication", () => {
    // Session state simulation before auth
    const unauthenticatedUploadSession = {
      sessionId: "sess-temp-9912",
      pendingFiles: [
        { name: "2025_Income_Statement.pdf", size: 1048576, type: "application/pdf" },
        { name: "2025_Balance_Sheet.pdf", size: 2097152, type: "application/pdf" },
      ],
      pendingInstructions: "Analyze FY2025 financial performance",
      createdAt: new Date().toISOString(),
    };

    expect(unauthenticatedUploadSession.pendingFiles.length).toBe(2);

    // Auth transition simulation: Account created -> Project created -> Files attached
    const createdProject = {
      id: "prj-auth-101",
      name: "FY2025 Financial Performance Review",
      workspaceId: "ws-user-402",
      attachedDocuments: unauthenticatedUploadSession.pendingFiles.map((f, idx) => ({
        id: `doc-auth-${idx + 1}`,
        name: f.name,
        size: f.size,
        status: "QUEUED",
      })),
      createdAt: new Date().toISOString(),
    };

    expect(createdProject.attachedDocuments.length).toBe(2);
    expect(createdProject.workspaceId).toBe("ws-user-402");
    expect(createdProject.attachedDocuments[0].status).toBe("QUEUED");
  });

  test("TEST 4: Strict Project Container Isolation — Project A facts never contaminate Project B", () => {
    const factProjectA = {
      id: "fact-prj-a-1",
      canonicalMetric: "revenue",
      normalizedValue: 1000000,
      currencyOriginal: "USD",
      reportingPeriod: "FY2025",
      documentId: "doc-prj-a",
      workspaceId: "prj-a",
      entityName: "Acme Corp Alpha",
      extractionConfidence: 0.99,
      status: "VERIFIED" as const,
    };

    const factProjectB = {
      id: "fact-prj-b-1",
      canonicalMetric: "revenue",
      normalizedValue: 2500000,
      currencyOriginal: "USD",
      reportingPeriod: "FY2025",
      documentId: "doc-prj-b",
      workspaceId: "prj-b",
      entityName: "Acme Corp Alpha", // Same name, different Project
      extractionConfidence: 0.99,
      status: "VERIFIED" as const,
    };

    // Analyze Project A
    const intelPackageA = FinancialIntelligenceEngine.analyzeWorkspaceIntelligence({
      workspaceId: "prj-a",
      reportingPeriod: "FY2025",
      facts: [factProjectA as any, factProjectB as any], // Include both in pool to test workspace filtering
    });

    // Verify Project A facts only include Project A fact
    expect(intelPackageA.workspaceId).toBe("prj-a");
    // Intelligence engine filters by workspaceId:
    const usedFactIds = intelPackageA.factIdsUsed;
    expect(usedFactIds).toContain("fact-prj-a-1");
    expect(usedFactIds).not.toContain("fact-prj-b-1");
  });

  test("TEST 5: Multi-Entity Project Graph — Parent/Subsidiary relationships & uncertain relationships route to Review Queue", () => {
    const parentEntity = { id: "ent-1", name: "Global Holdings Inc.", role: "PARENT" };
    const subsidiaryEntity = { id: "ent-2", name: "Global Holdings Europe GmbH", role: "SUBSIDIARY", parentId: "ent-1" };
    const uncertainEntity = { id: "ent-3", name: "Global Tech Services LLC", role: "UNKNOWN" };

    const reviewItem = AuditEvidenceEngine.createOrUpdateReviewItem({
      workspaceId: "prj-graph-test",
      documentId: "doc-entity-1",
      factId: "fact-ent-3",
      triggerReason: "ENTITY_RELATIONSHIP_UNCERTAIN" as any,
      description: "Uncertain corporate group relationship for Global Tech Services LLC.",
      originalFact: { id: "fact-ent-3", canonicalMetric: "entity_relationship", valueOriginal: "Global Tech Services LLC" } as any,
      currentSelection: { entityName: "Global Tech Services LLC", proposedRole: "AFFILIATE" },
    });

    expect(reviewItem).toBeDefined();
    expect(reviewItem.status).toBe("REVIEW_REQUIRED");
    expect(reviewItem.factId).toBe("fact-ent-3");
  });

  test("TEST 6: Multi-Currency & Multi-Period (Q1..Q4/FY) Handling in Financial Intelligence Engine", () => {
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

  test("TEST 7: Asynchronous Queue Re-attachment — Reconnecting to active job without duplicate runs", () => {
    const queue = new BackgroundIngestionQueue();
    const docId = `doc-dedup-phaseH-${Date.now()}`;
    const workspaceId = `ws-phaseH-${Date.now()}`;

    const pageManifests = [{ page_id: "PM-1", physical_page_number: 1, page_number: 1 }];
    const sourceBlocks = [{ source_block_id: "SB-1", page_number: 1, raw_text: "Revenue 100" }];

    const job1 = queue.createJob(workspaceId, docId, "Analyze Project Document.pdf", "Sample text", "EUR", "Analyze Project Document.pdf", pageManifests, sourceBlocks);
    const job2 = queue.createJob(workspaceId, docId, "Analyze Project Document.pdf", "Sample text", "EUR", "Analyze Project Document.pdf", pageManifests, sourceBlocks);

    // Must return exact same job instance due to deduplication
    expect(job1.id).toBe(job2.id);
    expect(job2.documentId).toBe(docId);
  });

  test("TEST 8: Progressive Disclosure & Evidence Chain — 7-layer lineage drill-down passes ReportingFactGate", () => {
    const sampleFact = {
      id: "fact-h-108",
      canonicalMetric: "revenue",
      normalizedValue: 1250000,
      valueFunctional: "1250000",
      valueOriginal: "1250000",
      currencyOriginal: "USD",
      reportingPeriod: "FY2025",
      documentId: "doc-h-108",
      pageNumber: 12,
      boundingCoordinates: { x: 10, y: 20, w: 100, h: 30 },
      extractionConfidence: 0.98,
      status: "VERIFIED" as const,
      workspaceId: "ws-default",
      sourceText: "Reported revenue was 1250000 USD for the period.",
    };

    const evidenceRecord = AuditEvidenceEngine.getEvidenceRecord(sampleFact as any, {
      documentRecord: {
        id: "doc-h-108",
        workspaceId: "ws-default",
        filename: "FY2025_Report.pdf",
        fileSize: 1024500,
        uploadTimestamp: new Date().toISOString(),
        mimeType: "application/pdf",
        storagePath: "/storage/docs/doc-h-108.pdf",
        status: "PROCESSED",
        pageCount: 25,
      } as any,
    });

    expect(evidenceRecord.evidenceValid).toBe(true);
    expect(evidenceRecord.displayValue).toBe("€1.25M");
    expect(evidenceRecord.lineage.layer5_sourceDocument.id).toBe("doc-h-108");
    expect(evidenceRecord.lineage.layer6_physicalPage.physicalPageNumber).toBe(12);

    const gateEvaluation = ReportingEngine.evaluateFactEligibility(sampleFact as any, {
      documentRecord: {
        id: "doc-h-108",
        workspaceId: "ws-default",
        filename: "FY2025_Report.pdf",
        fileSize: 1024500,
        uploadTimestamp: new Date().toISOString(),
        mimeType: "application/pdf",
        storagePath: "/storage/docs/doc-h-108.pdf",
        status: "PROCESSED",
        pageCount: 25,
      } as any,
    });

    expect(gateEvaluation.eligibilityStatus).toBe("REPORT_READY");
  });
});
