import { BackgroundIngestionQueue } from "../backgroundQueue.js";
import assert from "assert";

async function runPhaseATests() {
  console.log("==========================================");
  console.log("  RUNNING PHASE A SOURCE-TRUTH TEST SUITE ");
  console.log("==========================================");

  const queue = new BackgroundIngestionQueue();
  let passedCount = 0;

  // TEST 1: PDF Page Bounds
  try {
    console.log("\n[Test 1/5] Testing PDF Page Bounds (25 pages)...");
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

    assert.strictEqual(job.unitsTotal, 25, "Job total units must strictly equal 25");
    assert.strictEqual(job.processingUnits.length, 25, "Processing units count must strictly equal 25");
    
    const maxPageNum = Math.max(...job.processingUnits.map(u => u.physical_page_number || 0));
    assert.strictEqual(maxPageNum, 25, "Max physical_page_number must be 25");
    assert.ok(!job.processingUnits.some(u => (u.physical_page_number || 0) > 25), "No physical page number can exceed 25");

    console.log("✓ TEST 1 PASSED: 25 physical pages strictly mapped to 25 processing units without bounds inflation.");
    passedCount++;
  } catch (err: any) {
    console.error("❌ TEST 1 FAILED:", err.message);
    process.exit(1);
  }

  // TEST 2: Failed Page Extraction (No Fabricated Text)
  try {
    console.log("\n[Test 2/5] Testing Failed Page Extraction (Physical Page 10 text fails)...");
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
    assert.ok(page10Unit, "Physical page 10 unit must remain in processing units");
    assert.strictEqual(page10Unit.textData, "", "Failed page 10 textData must be empty string, NOT fabricated");
    assert.strictEqual(page10Unit.status, "NO_TEXT", "Failed page unit status must be NO_TEXT");
    assert.ok(!page10Unit.textData.includes("Page 10 content"), "Must never substitute 'Page 10 content' string");

    console.log("✓ TEST 2 PASSED: Physical page 10 preserved with failure status and ZERO fabricated text.");
    passedCount++;
  } catch (err: any) {
    console.error("❌ TEST 2 FAILED:", err.message);
    process.exit(1);
  }

  // TEST 3: Missing Inventory Failure
  try {
    console.log("\n[Test 3/5] Testing Missing Inventory Handling for PDF...");
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

    assert.strictEqual(job.status, "FAILED", "Job must be marked FAILED when page inventory is missing for PDF");
    assert.strictEqual(job.processingUnits.length, 0, "No processing units must be created when PDF inventory is missing");
    assert.ok(job.lastError?.includes("Authoritative physical page inventory required"), "Job lastError must explain missing inventory");

    console.log("✓ TEST 3 PASSED: PDF missing inventory correctly fails job with 0 processing units and no page-level UI artifact.");
    passedCount++;
  } catch (err: any) {
    console.error("❌ TEST 3 FAILED:", err.message);
    process.exit(1);
  }

  // TEST 4: Page Isolation (No Whole-Document Text Leaking)
  try {
    console.log("\n[Test 4/5] Testing Page Isolation (ALPHA_ONLY, BETA_ONLY, GAMMA_ONLY)...");
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

    assert.ok(unit1.textData.includes("ALPHA_ONLY"), "Unit 1 must contain ALPHA_ONLY");
    assert.ok(!unit1.textData.includes("BETA_ONLY"), "Unit 1 must NOT contain BETA_ONLY");
    assert.ok(!unit1.textData.includes("GAMMA_ONLY"), "Unit 1 must NOT contain GAMMA_ONLY");

    assert.ok(unit2.textData.includes("BETA_ONLY"), "Unit 2 must contain BETA_ONLY");
    assert.ok(!unit2.textData.includes("ALPHA_ONLY"), "Unit 2 must NOT contain ALPHA_ONLY");
    assert.ok(!unit2.textData.includes("GAMMA_ONLY"), "Unit 2 must NOT contain GAMMA_ONLY");

    assert.ok(unit3.textData.includes("GAMMA_ONLY"), "Unit 3 must contain GAMMA_ONLY");
    assert.ok(!unit3.textData.includes("ALPHA_ONLY"), "Unit 3 must NOT contain ALPHA_ONLY");
    assert.ok(!unit3.textData.includes("BETA_ONLY"), "Unit 3 must NOT contain BETA_ONLY");

    console.log("✓ TEST 4 PASSED: Page isolation verified. Whole-document text does NOT leak into individual page units.");
    passedCount++;
  } catch (err: any) {
    console.error("❌ TEST 4 FAILED:", err.message);
    process.exit(1);
  }

  // TEST 5: Mandatory Project Scope Consistency
  try {
    console.log("\n[Test 5/5] Testing Mandatory Project Scope Consistency...");
    
    // Test rejection of orphan job without workspaceId
    assert.throws(() => {
      queue.createJob(
        "", // missing workspaceId
        "DOC-ORPHAN",
        "Orphan.pdf",
        "Text",
        "USD",
        "Orphan.pdf",
        [{ id: "PM-1", document_id: "DOC-ORPHAN", physical_page_number: 1, page_number: 1 }]
      );
    }, /Mandatory workspaceId/, "Queue must reject job creation without workspaceId");

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

    assert.strictEqual(job.workspaceId, "ws-project-immutable-999", "Job workspaceId must remain strictly bound to project container");
    assert.strictEqual(job.processingUnits[0].workspace_id, "ws-project-immutable-999", "Processing unit workspace_id must match project container");

    console.log("✓ TEST 5 PASSED: Workspace scope is strictly mandatory and preserved across multi-entity operations.");
    passedCount++;
  } catch (err: any) {
    console.error("❌ TEST 5 FAILED:", err.message);
    process.exit(1);
  }

  console.log(`\n==========================================`);
  console.log(`  ALL ${passedCount}/5 PHASE A TESTS PASSED SUCCESSFULLY! `);
  console.log(`==========================================\n`);
  process.exit(0);
}

runPhaseATests().catch(err => {
  console.error("Fatal test runner failure:", err);
  process.exit(1);
});
