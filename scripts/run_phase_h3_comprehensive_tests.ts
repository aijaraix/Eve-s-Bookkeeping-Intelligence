import fs from 'fs';
import { ForensicEntityResolver } from '../server/forensicExtractionEngine.js';
import { CanonicalFactResolver } from '../server/canonicalFactResolver.js';
import { ExtractedFact } from '../src/types.js';

async function runComprehensiveTests() {
  console.log("========================================================================");
  console.log("=== PHASE H.3 COMPREHENSIVE REGRESSION & ACCEPTANCE TEST SUITE ===");
  console.log("========================================================================\n");

  // TEST 1: UNKNOWN COMPANY TEST (Company not in BRAND_ROOT_MAP)
  console.log("------------------------------------------------------------------------");
  console.log("TEST 1: UNKNOWN COMPANY TEST (Zero Dictionary / Zero Filename Dependency)");
  console.log("------------------------------------------------------------------------");
  const unknownCompanyDocText = `
    CONSOLIDATED FINANCIAL STATEMENTS 2025 OF AETHELGARD GLOBAL DYNAMICS SE
    Independent Auditor's Report to the Supervisory Board of Aethelgard Global Dynamics SE.
    We have audited the consolidated financial statements of Aethelgard Global Dynamics SE and its subsidiaries ("Aethelgard Group").
    In 2025, Aethelgard Group generated consolidated revenue of €14,250,000,000 and operating profit of €2,100,000,000.
    Parent company standalone net income for Aethelgard Global Dynamics SE (Single Entity) was €850,000,000.
    Audited by Ernst & Young GmbH Wirtschaftsprüfungsgesellschaft.
  `;
  const unknownFileName = "document_upload_temp_99214.pdf";

  const res1 = ForensicEntityResolver.resolveDocumentEntities(unknownFileName, unknownCompanyDocText, unknownFileName);
  console.log(`Document Issuer:             ${res1.documentIssuer}`);
  console.log(`Workspace Entity:            ${res1.workspaceEntity}`);
  console.log(`Reporting Entity:            ${res1.reportingEntity}`);
  console.log(`Consolidation Scope:         ${res1.consolidationScope}`);
  console.log(`Parent Entity Scope:         ${res1.parentEntity} (PARENT_ONLY)`);
  console.log(`Confidence Score:            ${(res1.confidenceScore * 100).toFixed(0)}%`);
  console.log(`Resolution Method:           ${res1.resolutionMethod}`);
  console.log(`Filename Fallback Invoked?:  ${res1.resolutionMethod.includes("FILENAME") ? "YES (FAIL)" : "NO (PASS)"}`);
  const pass1 = res1.workspaceEntity.toUpperCase().includes("AETHELGARD GLOBAL DYNAMICS") && res1.documentIssuer.toUpperCase().includes("AETHELGARD GLOBAL DYNAMICS SE") && !res1.resolutionMethod.includes("FILENAME");
  console.log(`TEST 1 RESULT:               ${pass1 ? "PASSED [SUCCESS]" : "FAILED"}\n`);

  // TEST 2: VOLKSWAGEN REGRESSION TEST
  console.log("------------------------------------------------------------------------");
  console.log("TEST 2: VOLKSWAGEN REGRESSION TEST");
  console.log("------------------------------------------------------------------------");
  const vwDocText = `
    Jahresabschluss und Lagebericht der Volkswagen AG zum 31. Dezember 2025.
    Bestätigungsvermerk des unabhängigen Abschlussprüfers.
    Die Volkswagen AG ist die Muttergesellschaft des Volkswagen Konzerns.
    Umsatzerlöse der Volkswagen AG betrugen €88.500.000.000.
    Geprüft von PwC Wirtschaftsprüfungsgesellschaft.
  `;
  const vwFileName = "entire-vw-ar25.pdf";

  const res2 = ForensicEntityResolver.resolveDocumentEntities(vwFileName, vwDocText, vwFileName);
  console.log(`Document Issuer:             ${res2.documentIssuer}`);
  console.log(`Workspace Entity:            ${res2.workspaceEntity}`);
  console.log(`Reporting Entity:            ${res2.reportingEntity}`);
  console.log(`Consolidation Scope:         ${res2.consolidationScope}`);
  console.log(`Resolution Method:           ${res2.resolutionMethod}`);
  const pass2 = res2.workspaceEntity === "Volkswagen" || res2.documentIssuer === "Volkswagen AG";
  console.log(`TEST 2 RESULT:               ${pass2 ? "PASSED [SUCCESS]" : "FAILED"}\n`);

  // TEST 3: DUPLICATE DOCUMENT INGESTION & FACT DEDUPLICATION TEST
  console.log("------------------------------------------------------------------------");
  console.log("TEST 3: DUPLICATE DOCUMENT INGESTION & CORROBORATION DETECTOR");
  console.log("------------------------------------------------------------------------");
  const mockFacts: any[] = [
    {
      id: "FCT-101",
      fact_id: "FCT-101",
      document_id: "DOC-ORIGINAL",
      project_id: "WS-DUP-TEST",
      workspaceId: "WS-DUP-TEST",
      source_filename: "annual_report_2025.pdf",
      page: 12,
      section_title: "Income Statement",
      source_text: "Revenue: €505,000M",
      original_label: "Revenue",
      normalized_label: "Revenue",
      original_value: "505,000",
      normalized_value: 505000000000,
      currency: "EUR",
      reporting_period: "2025-FY",
      confidence: 0.98,
      canonicalMetric: "revenue",
      normalizedValue: 505000000000,
      sourceDocument: "annual_report_2025.pdf",
      tableName: "Group Income Statement",
      reportingScope: "CONSOLIDATED_GROUP",
      legalEntity: "Unilever PLC",
      reportingEntity: "Unilever Group"
    },
    {
      id: "FCT-102",
      fact_id: "FCT-102",
      document_id: "DOC-DUPLICATE-ESEF",
      project_id: "WS-DUP-TEST",
      workspaceId: "WS-DUP-TEST",
      source_filename: "Inline Viewer - 549300MKFYEKVRWML317-2025-12-31-T01.PDF",
      page: 1,
      section_title: "ESEF Rendering",
      source_text: "Revenue: €505,000,000,000",
      original_label: "Total Sales Revenue",
      normalized_label: "Revenue",
      original_value: "505000000000",
      normalized_value: 505000000000,
      currency: "EUR",
      reporting_period: "2025-FY",
      confidence: 0.99,
      canonicalMetric: "revenue",
      normalizedValue: 505000000000,
      sourceDocument: "Inline Viewer - 549300MKFYEKVRWML317-2025-12-31-T01.PDF",
      tableName: "ESEF Income Statement",
      reportingScope: "CONSOLIDATED_GROUP",
      legalEntity: "Unilever PLC",
      reportingEntity: "Unilever Group"
    }
  ];

  const resolvedRev = CanonicalFactResolver.resolveMetric("WS-DUP-TEST", "revenue", mockFacts as ExtractedFact[], { targetPeriod: "2025-FY" });
  console.log(`Primary Resolved Metric:     ${resolvedRev.metric}`);
  console.log(`Primary Value:              ${resolvedRev.formattedValue}`);
  console.log(`Primary Document:           ${resolvedRev.primaryFact?.sourceDocument || (resolvedRev.primaryFact as any)?.source_filename}`);
  console.log(`Corroborating Sources Count: ${resolvedRev.primaryFact?.corroboratingSources?.length || 0}`);
  if (resolvedRev.primaryFact?.corroboratingSources) {
    resolvedRev.primaryFact.corroboratingSources.forEach((cs: any, idx: number) => {
      console.log(`  Source #${idx + 1}: ${cs.documentName} (Page ${cs.pageNumber}) -> ${cs.rawValue}`);
    });
  }
  const pass3 = (resolvedRev.primaryFact?.corroboratingSources?.length || 0) === 1;
  console.log(`TEST 3 RESULT:               ${pass3 ? "PASSED [SUCCESS]" : "FAILED"}\n`);

  // TEST 4: PARENT-ONLY VS CONSOLIDATED FACT SCOPE SEPARATION
  console.log("------------------------------------------------------------------------");
  console.log("TEST 4: PARENT-ONLY VS CONSOLIDATED FACT SCOPE SEPARATION");
  console.log("------------------------------------------------------------------------");
  const scopedFacts: any[] = [
    {
      id: "FCT-PARENT-1",
      fact_id: "FCT-PARENT-1",
      document_id: "DOC-PARENT",
      project_id: "WS-SCOPE-TEST",
      workspaceId: "WS-SCOPE-TEST",
      source_filename: "jahresabschluss-volkswagen-ag-zum-31-dezember-2025.pdf",
      page: 1,
      section_title: "Parent Balance Sheet",
      source_text: "Parent Revenue: €88,500M",
      original_label: "Revenue",
      normalized_label: "Revenue",
      original_value: "88,500",
      normalized_value: 88500000000,
      currency: "EUR",
      reporting_period: "2025-FY",
      confidence: 0.98,
      canonicalMetric: "revenue",
      normalizedValue: 88500000000,
      sourceDocument: "jahresabschluss-volkswagen-ag-zum-31-dezember-2025.pdf",
      tableName: "Volkswagen AG Standalone",
      reportingScope: "PARENT_ONLY",
      legalEntity: "Volkswagen AG",
      reportingEntity: "Volkswagen AG (Standalone)"
    },
    {
      id: "FCT-GROUP-1",
      fact_id: "FCT-GROUP-1",
      document_id: "DOC-GROUP",
      project_id: "WS-SCOPE-TEST",
      workspaceId: "WS-SCOPE-TEST",
      source_filename: "entire-vw-ar25.pdf",
      page: 1,
      section_title: "Consolidated Income Statement",
      source_text: "Group Sales Revenue: €322,300M",
      original_label: "Sales Revenue",
      normalized_label: "Revenue",
      original_value: "322,300",
      normalized_value: 322300000000,
      currency: "EUR",
      reporting_period: "2025-FY",
      confidence: 0.99,
      canonicalMetric: "revenue",
      normalizedValue: 322300000000,
      sourceDocument: "entire-vw-ar25.pdf",
      tableName: "Group Income Statement",
      reportingScope: "CONSOLIDATED_GROUP",
      legalEntity: "Volkswagen AG",
      reportingEntity: "Volkswagen Group"
    }
  ];

  const parentResolved = CanonicalFactResolver.resolveMetric("WS-SCOPE-TEST", "revenue", scopedFacts as ExtractedFact[], { targetPeriod: "2025-FY", targetScope: "PARENT_ONLY" });
  const groupResolved = CanonicalFactResolver.resolveMetric("WS-SCOPE-TEST", "revenue", scopedFacts as ExtractedFact[], { targetPeriod: "2025-FY", targetScope: "CONSOLIDATED_GROUP" });

  console.log(`Parent Scope Resolved Revenue:  ${parentResolved.formattedValue} (${parentResolved.entityScope})`);
  console.log(`Group Scope Resolved Revenue:   ${groupResolved.formattedValue} (${groupResolved.entityScope})`);

  const pass4 = parentResolved.normalizedScalarValue === 88500000000 && groupResolved.normalizedScalarValue === 322300000000;
  console.log(`TEST 4 RESULT:               ${pass4 ? "PASSED [SUCCESS]" : "FAILED"}\n`);

  console.log("========================================================================");
  console.log("=== COMPREHENSIVE REGRESSION & ACCEPTANCE SUITE FINISHED ===");
  console.log("========================================================================");
}

runComprehensiveTests().catch(console.error);
