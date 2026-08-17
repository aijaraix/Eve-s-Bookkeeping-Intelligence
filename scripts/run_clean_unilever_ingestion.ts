import fs from 'fs';
import path from 'path';
import { fileRouter, anyDocParser, spreadsheetParser, ocrParser, extractDeterministicFacts } from '../server.js';
import { ForensicEntityResolver } from '../server/forensicExtractionEngine.js';
import { CanonicalFactResolver } from '../server/canonicalFactResolver.js';

async function runCleanUnileverIngestion() {
  console.log("========================================================================");
  console.log("=== PHASE H.3 - GENERALIZED ENTITY & REPORTING-SCOPE ACCEPTANCE SUITE ===");
  console.log("=== CLEAN UNILEVER RE-INGESTION & FORENSIC AUDIT ===");
  console.log("========================================================================\n");

  const workspaceId = `ws-clean-unilever-${Date.now()}`;
  const filesToProcess = [
    {
      filePath: "/app/applet/storage/uploads/dcdc67ff84977e2beeb6b7a8113b6862fae1880838c613eceac42ba4b605d9d7.pdf",
      originalName: "unilever-annual-report-and-accounts-2025.pdf",
      mimeType: "application/pdf"
    },
    {
      filePath: "/app/applet/storage/uploads/f17c31010c2c989a184585a5c08d9386b2cf4fb5b363702157c3a89433f31b42.PDF",
      originalName: "Inline Viewer - 549300MKFYEKVRWML317-2025-12-31-T01.PDF",
      mimeType: "application/pdf"
    }
  ];

  const allExtractedFacts: any[] = [];
  const entityAuditResults: any[] = [];

  for (const f of filesToProcess) {
    if (!fs.existsSync(f.filePath)) {
      console.warn(`File not found: ${f.filePath}`);
      continue;
    }

    console.log(`Ingesting File: '${f.originalName}'...`);
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

    const docText = canonicalDoc.fullText || (canonicalDoc.sections ? canonicalDoc.sections.map((s: any) => s.text).join("\n") : "");
    const docTitle = f.originalName;

    // Run Forensic Resolution
    const resolvedEntities = ForensicEntityResolver.resolveDocumentEntities(docTitle, docText, f.originalName);

    entityAuditResults.push({
      fileName: f.originalName,
      resolvedEntities
    });

    const docId = `DOC-UNI-${Math.floor(Math.random() * 100000)}`;
    const extractedFacts = extractDeterministicFacts(
      canonicalDoc,
      f.originalName,
      workspaceId,
      docId,
      "EUR",
      "2025-FY"
    );

    // Annotate extracted facts with resolved entity/scope lineage
    extractedFacts.forEach((fact: any) => {
      fact.legal_entity = resolvedEntities.documentIssuer;
      fact.legalEntity = resolvedEntities.documentIssuer;
      fact.reporting_entity = resolvedEntities.reportingEntity;
      fact.reportingEntity = resolvedEntities.reportingEntity;
      fact.parent_entity = resolvedEntities.parentEntity;
      fact.parentEntity = resolvedEntities.parentEntity;
      fact.workspace_entity = resolvedEntities.workspaceEntity;
      fact.workspaceEntity = resolvedEntities.workspaceEntity;
      fact.reporting_scope = resolvedEntities.reportingScope;
      fact.reportingScope = resolvedEntities.reportingScope;
      fact.consolidation_scope = resolvedEntities.consolidationScope;
      fact.consolidationScope = resolvedEntities.consolidationScope;
    });

    allExtractedFacts.push(...extractedFacts);
  }

  console.log("\n========================================================================");
  console.log("REQUIREMENT 8: FORENSIC RESOLUTION REPORT (10 AUDIT ITEMS)");
  console.log("========================================================================");

  entityAuditResults.forEach((audit, idx) => {
    const res = audit.resolvedEntities;
    console.log(`\n--- DOCUMENT #${idx + 1}: ${audit.fileName} ---`);
    console.log(`1. Document Issuer Detected:         ${res.documentIssuer}`);
    console.log(`2. Reporting Entities Detected:      ${res.reportingEntity}`);
    console.log(`3. Consolidation Scopes Detected:    ${res.consolidationScope}`);
    console.log(`4. Parent/Company-Only Scope:       ${res.parentEntity} (PARENT_ONLY)`);
    console.log(`5. Referenced Entities Detected:     ${JSON.stringify(res.referencedEntities.map((r: any) => `${r.name} [${r.type}]`))}`);
    console.log(`6. Evidence Supporting Entity:       "${res.evidenceText}"`);
    console.log(`7. Supporting Page / Section:        Page ${res.evidenceSource.pageNumber || 1} (${res.evidenceSource.section})`);
    console.log(`8. Resolution Confidence Score:      ${(res.confidenceScore * 100).toFixed(0)}%`);
    console.log(`9. Resolution Method:               ${res.resolutionMethod}`);
    console.log(`10. Filename Fallback Invoked?:      ${res.resolutionMethod.includes("FILENAME") ? "YES (WARNING)" : "NO (Pure Text Evidence)"}`);
  });

  // Master Canonical Financial Resolution
  console.log("\n========================================================================");
  console.log("PRIMARY CANONICAL FINANCIAL METRICS RESOLVED");
  console.log("========================================================================");

  const summary = CanonicalFactResolver.resolveWorkspaceSummary(workspaceId, allExtractedFacts);

  console.log(`Workspace Name:                ${summary.entityName}`);
  console.log(`Consolidation Scope:           ${summary.consolidationScope}`);
  console.log(`Primary Reporting Period:      ${summary.reportingPeriod}`);
  console.log(`Currency:                      ${summary.currency}`);
  console.log(`Total Facts Extracted:         ${allExtractedFacts.length}`);
  console.log("------------------------------------------------------------------------");
  console.log(`Revenue:                       ${summary.revenue.formattedValue} (${summary.revenue.entityName})`);
  console.log(`Operating Profit:              ${summary.operatingProfit.formattedValue}`);
  console.log(`Net Income:                    ${summary.netIncome.formattedValue}`);
  console.log(`Total Assets:                  ${summary.totalAssets.formattedValue}`);
  console.log(`Free Cash Flow:                ${summary.freeCashFlow.formattedValue}`);
  console.log(`Gross Margin %:                ${summary.grossMarginPct !== null ? `${summary.grossMarginPct}%` : '—'}`);
  console.log(`Operating Margin %:            ${summary.operatingMarginPct !== null ? `${summary.operatingMarginPct}%` : '—'}`);
  console.log(`Accounting Identity Valid?:    ${summary.accountingIdentityValid ? "YES" : "NO"}`);

  // Fact-Level Corroboration Audit
  const corroboratedFacts = allExtractedFacts.filter((f: any) => f.corroboratingSources && f.corroboratingSources.length > 0);
  console.log(`Multi-Document Corroborating Facts: ${corroboratedFacts.length}`);
  corroboratedFacts.slice(0, 3).forEach((f: any) => {
    console.log(`  Fact '${f.canonicalMetric}': Value ${f.normalizedValue} corroborated across ${f.corroboratingSources.length + 1} filings.`);
  });

  console.log("\n=== UNILEVER RE-INGESTION & AUDIT COMPLETE ===");
}

runCleanUnileverIngestion().catch(console.error);
