import { describe, it, expect } from "vitest";
import { BackgroundIngestionQueue } from "../backgroundQueue.js";

describe("Phase A Source-Truth Test Suite", () => {
  const queue = new BackgroundIngestionQueue();

  it("Test 1: PDF Page Bounds (25 physical pages strictly mapped to 25 processing units)", () => {
    const pageManifests25 = Array.from({ length: 25 }, (_, i) => ({
      id: `PM-DOC25-P${i + 1}`,
      page_id: `PM-DOC25-P${i + 1}`,
      document_id: "DOC25",
      physical_page_number: i + 1,
      page_number: i + 1,
      physical_page_count: 25,
      status: "PROCESSED",
      text_detected: true
    }));

    const sourceBlocks25 = pageManifests25.map((pm, i) => ({
      source_block_id: `BLK-DOC25-P${i + 1}-1`,
      document_id: "DOC25",
      page_number: i + 1,
      raw_text: `Text content for physical page ${i + 1}`
    }));

    const job = queue.createJob(
      "ws-proj-001",
      "DOC25",
      "Annual_Report_25P.pdf",
      "Full doc text",
      "EUR",
      "Annual_Report_25P.pdf",
      pageManifests25,
      sourceBlocks25
    );

    expect(job.unitsTotal).toBe(25);
    expect(job.processingUnits.length).toBe(25);
    
    const maxPageNum = Math.max(...job.processingUnits.map(u => u.physical_page_number || 0));
    expect(maxPageNum).toBe(25);
    expect(job.processingUnits.some(u => (u.physical_page_number || 0) > 25)).toBe(false);
  });

  it("Test 2: Failed Page Extraction (Physical Page 10 text fails, ZERO fabricated text)", () => {
    const pageManifests10 = Array.from({ length: 10 }, (_, i) => {
      const isFailed = i + 1 === 10;
      return {
        id: `PM-DOC10-P${i + 1}`,
        page_id: `PM-DOC10-P${i + 1}`,
        document_id: "DOC10",
        physical_page_number: i + 1,
        page_number: i + 1,
        physical_page_count: 10,
        status: isFailed ? "OCR_REQUIRED" : "PROCESSED",
        text_detected: !isFailed,
        ocr_required: isFailed
      };
    });

    const sourceBlocks10 = pageManifests10
      .filter(pm => pm.physical_page_number !== 10)
      .map(pm => ({
        source_block_id: `BLK-DOC10-P${pm.physical_page_number}-1`,
        document_id: "DOC10",
        page_number: pm.physical_page_number,
        raw_text: `Valid text for page ${pm.physical_page_number}`
      }));

    const job = queue.createJob(
      "ws-proj-001",
      "DOC10",
      "Report_10P.pdf",
      "Doc text",
      "USD",
      "Report_10P.pdf",
      pageManifests10,
      sourceBlocks10
    );

    const page10Unit = job.processingUnits.find(u => u.physical_page_number === 10);
    expect(page10Unit).toBeDefined();
    expect(page10Unit?.textData).toBe("");
    expect(page10Unit?.status).toBe("NO_TEXT");
    expect(page10Unit?.textData.includes("Page 10 content")).toBe(false);
  });

  it("Test 3: Missing Inventory Handling for PDF correctly fails job", () => {
    const job = queue.createJob(
      "ws-proj-001",
      "DOC-NO-INV",
      "Uninventoried.pdf",
      "Raw chunk text without inventory",
      "USD",
      "Uninventoried.pdf",
      [], // Empty page manifests!
      []
    );

    expect(job.status).toBe("FAILED");
    expect(job.processingUnits.length).toBe(0);
    expect(job.lastError).toContain("Authoritative physical page inventory required");
  });

  it("Test 4: Page Isolation (Whole-document text does NOT leak into individual page units)", () => {
    const pageManifests3 = [1, 2, 3].map(p => ({
      id: `PM-DOC3-P${p}`,
      page_id: `PM-DOC3-P${p}`,
      document_id: "DOC3",
      physical_page_number: p,
      page_number: p,
      physical_page_count: 3,
      status: "PROCESSED"
    }));

    const sourceBlocks3 = [
      { source_block_id: "BLK-P1", document_id: "DOC3", page_number: 1, raw_text: "ALPHA_ONLY" },
      { source_block_id: "BLK-P2", document_id: "DOC3", page_number: 2, raw_text: "BETA_ONLY" },
      { source_block_id: "BLK-P3", document_id: "DOC3", page_number: 3, raw_text: "GAMMA_ONLY" }
    ];

    const fullDocText = "ALPHA_ONLY BETA_ONLY GAMMA_ONLY - FULL DOCUMENT COMBINED LEAK TEXT";

    const job = queue.createJob(
      "ws-proj-001",
      "DOC3",
      "Isolated_3P.pdf",
      fullDocText,
      "EUR",
      "Isolated_3P.pdf",
      pageManifests3,
      sourceBlocks3
    );

    const unit1 = job.processingUnits.find(u => u.physical_page_number === 1)!;
    const unit2 = job.processingUnits.find(u => u.physical_page_number === 2)!;
    const unit3 = job.processingUnits.find(u => u.physical_page_number === 3)!;

    expect(unit1.textData).toContain("ALPHA_ONLY");
    expect(unit1.textData).not.toContain("BETA_ONLY");
    expect(unit1.textData).not.toContain("GAMMA_ONLY");

    expect(unit2.textData).toContain("BETA_ONLY");
    expect(unit2.textData).not.toContain("ALPHA_ONLY");
    expect(unit2.textData).not.toContain("GAMMA_ONLY");

    expect(unit3.textData).toContain("GAMMA_ONLY");
    expect(unit3.textData).not.toContain("ALPHA_ONLY");
    expect(unit3.textData).not.toContain("BETA_ONLY");
  });

  it("Test 5: Mandatory Project Scope Consistency across multi-entity operations", () => {
    expect(() => {
      queue.createJob(
        "", // missing workspaceId
        "DOC-ORPHAN",
        "Orphan.pdf",
        "Text",
        "USD",
        "Orphan.pdf",
        [{ id: "PM-1", document_id: "DOC-ORPHAN", physical_page_number: 1, page_number: 1 }]
      );
    }).toThrow(/Mandatory workspaceId/);

    const job = queue.createJob(
      "ws-project-immutable-999",
      "DOC-MULTI-ENT",
      "MultiEntity.pdf",
      "Document mentioning Parent Co and Subsidiary Inc",
      "USD",
      "MultiEntity.pdf",
      [{ id: "PM-1", document_id: "DOC-MULTI-ENT", physical_page_number: 1, page_number: 1 }],
      [{ source_block_id: "BLK-1", document_id: "DOC-MULTI-ENT", page_number: 1, raw_text: "Entity Parent and Entity Sub" }]
    );

    expect(job.workspaceId).toBe("ws-project-immutable-999");
    expect(job.processingUnits[0].workspace_id).toBe("ws-project-immutable-999");
  });
});
