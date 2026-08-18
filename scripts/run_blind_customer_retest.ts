import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  fileRouter,
  anyDocParser,
  spreadsheetParser,
  ocrParser,
  extractDeterministicFacts
} from '../server.js';
import { ForensicEntityResolver } from '../server/forensicExtractionEngine.js';
import { CanonicalFactResolver } from '../server/canonicalFactResolver.js';
import { AccountingValidationEngine } from '../server/accountingValidationEngine.js';

async function runBlindCustomerRetest() {
  const startTime = Date.now();
  const creationTimestamp = new Date(startTime).toISOString();
  const workspaceId = `ws-blind-retest-${startTime}`;

  console.log("========================================================================");
  console.log("=== PHASE H.6.2 - BLIND LIVE CUSTOMER RETEST ===");
  console.log(`Workspace ID: ${workspaceId}`);
  console.log(`Created At: ${creationTimestamp}`);
  console.log("========================================================================\n");

  const files = [
    {
      filePath: "/app/applet/storage/uploads/dcdc67ff84977e2beeb6b7a8113b6862fae1880838c613eceac42ba4b605d9d7.pdf",
      uploadedName: "unilever-annual-report-and-accounts-2025(1).pdf"
    },
    {
      filePath: "/app/applet/storage/uploads/f17c31010c2c989a184585a5c08d9386b2cf4fb5b363702157c3a89433f31b42.PDF",
      uploadedName: "Inline Viewer - 549300MKFYEKVRWML317-2025-12-31-T01.PDF"
    }
  ];

  const docAudits: any[] = [];
  const allFacts: any[] = [];
  const entityAuditResults: any[] = [];

  let totalUnits = 0;
  let completedUnits = 0;
  let skippedUnits = 0;
  let retriedUnits = 0;
  let failedUnits = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const docId = `DOC-BLIND-${i + 1}-${Math.floor(Math.random() * 100000)}`;
    const buffer = fs.readFileSync(f.filePath);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    const fileInput = {
      buffer,
      filename: f.uploadedName,
      originalName: f.uploadedName,
      mimeType: "application/pdf",
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

    const pageCount = canonicalDoc.metadata?.pageCount || canonicalDoc.pageCount || (canonicalDoc.sections ? canonicalDoc.sections.length : 1);
    const unitCount = pageCount; // Each page is a processing unit

    totalUnits += unitCount;
    completedUnits += unitCount;

    const docText = canonicalDoc.fullText || (canonicalDoc.sections ? canonicalDoc.sections.map((s: any) => s.text).join("\n") : "");
    const resolvedEntities = ForensicEntityResolver.resolveDocumentEntities(f.uploadedName, docText, f.uploadedName);

    entityAuditResults.push({
      fileName: f.uploadedName,
      resolvedEntities
    });

    const extractedFacts = extractDeterministicFacts(
      canonicalDoc,
      f.uploadedName,
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
      fact.documentId = docId;
      fact.document_id = docId;
    });

    docAudits.push({
      docId,
      uploadedName: f.uploadedName,
      hash,
      pageCount,
      unitCount,
      factCount: extractedFacts.length
    });

    allFacts.push(...extractedFacts);
  }

  const processingDurationMs = Date.now() - startTime;

  // Resolve Canonical Workspace Summary
  const summary = CanonicalFactResolver.resolveWorkspaceSummary(workspaceId, allFacts);

  // Evaluate Customer Readiness
  const readiness = AccountingValidationEngine.evaluateCustomerReadiness(workspaceId, allFacts);

  console.log("JSON_OUTPUT_START");
  console.log(JSON.stringify({
    workspaceId,
    creationTimestamp,
    processingDurationMs,
    totalUnits,
    completedUnits,
    skippedUnits,
    retriedUnits,
    failedUnits,
    docAudits,
    entityAuditResults,
    rawFactCount: allFacts.length,
    summary,
    readiness
  }, null, 2));
  console.log("JSON_OUTPUT_END");
}

runBlindCustomerRetest().catch(err => {
  console.error("Blind retest failed:", err);
  process.exit(1);
});
