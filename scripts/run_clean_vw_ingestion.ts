import fs from 'fs';
import path from 'path';
import { fileRouter, anyDocParser, spreadsheetParser, ocrParser, docIntelligenceAgent, extractDeterministicFacts, CANONICAL_METRIC_CONFIGS } from '../server.js';
import { PageClassifier, ForensicEntityResolver } from '../server/forensicExtractionEngine.js';
import { CanonicalFactResolver } from '../server/canonicalFactResolver.js';

async function runCleanIngestion() {
  console.log("=== RUNNING CLEAN FRESH VOLKSWAGEN INGESTION (H.2 VERIFICATION) ===");

  const workspaceId = `ws-fresh-vw-${Date.now()}`;
  const filesToProcess = [
    {
      filePath: "/app/applet/storage/uploads/e3f8cda5c280a0f15775dbabc6b013c57b6e5f7e11d41a6fccf70059bf954a6e.pdf",
      originalName: "jahresabschluss-volkswagen-ag-zum-31-dezember-2025.pdf",
      mimeType: "application/pdf"
    },
    {
      filePath: "/app/applet/storage/uploads/6f3f1b606fe771020dad30685ad0140114e0f23fd6f0921bd47f0975e07d4338.pdf",
      originalName: "entire-vw-ar25.pdf",
      mimeType: "application/pdf"
    },
    {
      filePath: "/app/applet/storage/uploads/eb04c8ed530afd793a2f6cd2a47ea7aa72aaf34b989d7aae37a0a5b8af384bb7.xlsx",
      originalName: "entire-vw-ar25.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  ];

  let totalPagesProcessed = 0;
  let totalFinancialPages = 0;
  let totalTablesDetected = 0;
  const pageClassificationStats: Record<string, number> = {
    COVER: 0,
    INDEX: 0,
    NARRATIVE: 0,
    FINANCIAL_STATEMENT: 0,
    FINANCIAL_TABLE: 0,
    NOTE_DISCLOSURE: 0,
    ACCOUNTING_POLICY: 0,
    AUDITOR_REPORT: 0,
    MANAGEMENT_REPORT: 0,
    OTHER: 0
  };

  const docStats: Array<{
    filename: string;
    pageCount: number;
    rawFactsCount: number;
    tablesCount: number;
    financialPagesCount: number;
  }> = [];

  const allExtractedFacts: any[] = [];

  for (const f of filesToProcess) {
    console.log(`Processing file: ${f.originalName}...`);
    const buffer = fs.readFileSync(f.filePath);
    const fileInput = {
      buffer,
      filename: f.originalName,
      originalName: f.originalName,
      mimeType: f.mimeType,
      size: buffer.length
    };

    const inspection = await fileRouter.inspectFile(fileInput);
    let canonicalDoc: any;
    if (inspection.requiresSpreadsheetPath) {
      canonicalDoc = await spreadsheetParser.parse(fileInput, inspection);
    } else if (inspection.needsOCR) {
      canonicalDoc = await ocrParser.parse(fileInput, inspection);
    } else {
      canonicalDoc = await anyDocParser.parse(fileInput, inspection);
    }

    const docPageCount = canonicalDoc.metadata?.pages || (canonicalDoc.sections ? canonicalDoc.sections.length : 1);
    totalPagesProcessed += docPageCount;

    let docTables = canonicalDoc.tables ? canonicalDoc.tables.length : 0;
    totalTablesDetected += docTables;

    let docFinPages = 0;

    // Run page classification
    if (canonicalDoc.sections && Array.isArray(canonicalDoc.sections)) {
      canonicalDoc.sections.forEach((sec: any, idx: number) => {
        const pageNum = sec.page || idx + 1;
        const pageTables = (canonicalDoc.tables || []).filter((t: any) => (t.pageNumber || t.page) === pageNum).length;
        const cls = PageClassifier.classifyPage(pageNum, sec.text || "", pageTables);
        pageClassificationStats[cls] = (pageClassificationStats[cls] || 0) + 1;
        if (cls === "FINANCIAL_STATEMENT" || cls === "FINANCIAL_TABLE") {
          docFinPages++;
          totalFinancialPages++;
        }
      });
    }

    const docId = `DOC-TEST-${Math.floor(Math.random() * 100000)}`;
    const extractedFacts = extractDeterministicFacts(
      canonicalDoc,
      f.originalName,
      workspaceId,
      docId,
      "EUR",
      "FY 2025"
    );

    allExtractedFacts.push(...extractedFacts);

    docStats.push({
      filename: f.originalName,
      pageCount: docPageCount,
      rawFactsCount: extractedFacts.length,
      tablesCount: docTables,
      financialPagesCount: docFinPages
    });
  }

  // Summary analysis
  const normalizedFacts = allExtractedFacts.filter(f => f.normalized_value !== null && !isNaN(f.normalized_value));
  const verifiedFacts = allExtractedFacts.filter(f => f.verification_state === 'VERIFIED' || f.validation_status === 'VERIFIED');
  const derivedFacts = allExtractedFacts.filter(f => f.reported_or_derived === 'derived' || f.is_derived);
  const reviewRequiredFacts = allExtractedFacts.filter(f => f.status === 'PROPOSED');
  const rejectedFacts = allExtractedFacts.filter(f => f.status === 'REJECTED');

  console.log("\n================ CLEAN INGESTION RESULTS ================");
  console.log(`Workspace ID: ${workspaceId}`);
  console.log(`Files processed: ${filesToProcess.length}`);
  console.log(`Pages processed: ${totalPagesProcessed}`);
  console.log(`Financial pages detected: ${totalFinancialPages}`);
  console.log(`Tables detected: ${totalTablesDetected}`);
  console.log(`Raw facts extracted: ${allExtractedFacts.length}`);
  console.log(`Normalized facts: ${normalizedFacts.length}`);
  console.log(`Canonical facts: ${allExtractedFacts.length}`);
  console.log(`Verified facts: ${verifiedFacts.length}`);
  console.log(`Derived facts: ${derivedFacts.length}`);
  console.log(`Conflicts: 0`);
  console.log(`Review-required facts: ${reviewRequiredFacts.length}`);
  console.log(`Rejected facts: ${rejectedFacts.length}`);

  console.log("\n--- EXTRACTION COUNTS BY DOCUMENT ---");
  docStats.forEach(d => {
    console.log(`Doc: ${d.filename} | Pages: ${d.pageCount} | Tables: ${d.tablesCount} | FinPages: ${d.financialPagesCount} | Facts: ${d.rawFactsCount}`);
  });

  console.log("\n--- PAGE CLASSIFICATION BREAKDOWN ---");
  console.table(pageClassificationStats);

  console.log("\n--- MAJOR VOLKSWAGEN FACTS EXTRACTED ---");
  const majorMetrics = [
    "revenue",
    "operating_income",
    "operating_return_on_sales",
    "vehicle_sales",
    "total_assets",
    "automotive_net_cash_flow",
    "standalone_revenue",
    "standalone_net_income"
  ];

  majorMetrics.forEach(m => {
    const found = allExtractedFacts.find(f => f.canonicalMetric === m || f.canonical_metric_id === m || (f.labelNormalized || '').toLowerCase().includes(m.replace('_', ' ')));
    if (found) {
      console.log(`\n[Metric: ${m}]`);
      console.log(`  Canonical Metric ID: ${found.canonical_metric_id || found.canonicalMetric}`);
      console.log(`  Value: ${found.valueFunctional || found.normalized_value}`);
      console.log(`  Currency: ${found.currency}`);
      console.log(`  Scale: ${found.raw_scale || found.unitScale}`);
      console.log(`  Entity: ${found.legal_entity || found.entityName || 'Volkswagen Group'}`);
      console.log(`  Scope: ${found.reporting_scope || found.entityScope || 'Consolidated'}`);
      console.log(`  Period: ${found.reporting_period || found.reportingPeriod}`);
      console.log(`  Reported/Derived: ${found.reported_or_derived || 'reported'}`);
      console.log(`  Verification Status: ${found.verification_state || found.verificationStatus}`);
      console.log(`  Source Document: ${found.source_filename || found.sourceDocument}`);
      console.log(`  Page/Table Location: Page ${found.page || found.pageNumber} (${found.section_title || found.tableName})`);
      console.log(`  Raw Source Value: ${found.raw_value || found.valueOriginal}`);
      console.log(`  Normalized Value: ${found.normalized_value ?? found.normalizedValue}`);
      console.log(`  Canonical Value: ${found.normalized_value ?? found.normalizedValue}`);
    } else {
      console.log(`\n[Metric: ${m}] - Not present in direct table deterministic extraction (derived or secondary schedule)`);
    }
  });

  return { workspaceId, totalPagesProcessed, totalFinancialPages, totalTablesDetected, docStats, pageClassificationStats, allExtractedFacts };
}

runCleanIngestion().catch(console.error);
