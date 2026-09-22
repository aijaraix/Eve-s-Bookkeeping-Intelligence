import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import * as XLSXModule from 'xlsx';
const XLSX: any = (XLSXModule as any).default || XLSXModule;
import {
  RECEIPT_DOCUMENT_ID, RECEIPT_ENGAGEMENT_ID, RECEIPT_FACT_ID, RECEIPT_PROVENANCE_ID, RECEIPT_SHA256,
  RECEIPT_WORKSPACE_ID, buildReceiptFact, loadReceiptSourceRegionEvidence, receiptEvidenceDir,
} from './fixtures/receiptFiveDimensionFixture.js';

const evidenceDir = receiptEvidenceDir();
const reportsDir = path.join(evidenceDir, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });
process.env.HERMES_REPORTS_DIR = reportsDir;
const { deliverableArtifactService } = await import('../cpaOrganization/deliverableArtifactService.js');
const region = loadReceiptSourceRegionEvidence();
const fact = buildReceiptFact(region);
const report = await deliverableArtifactService.compileAndRegisterDeliverable({
  reportId: 'REP-RECEIPT-53-23', engagementId: RECEIPT_ENGAGEMENT_ID, workspaceId: RECEIPT_WORKSPACE_ID,
  version: 'v1.0', title: 'Receipt Evidence Review Draft', clientName: 'Eve Academy Receipt Fixture',
  period: 'FY 2026', currency: 'USD', status: 'AI_PREPARED',
  facts: [{
    id: fact.id, canonicalMetric: fact.canonicalMetric, label: fact.labelNormalized, value: fact.normalizedValue,
    statement: 'EXPENSE_EVIDENCE', sourceDoc: 'receipt.png', page: 1, verificationStatus: 'VERIFIED', evidenceStatus: 'CONFIRMED',
    documentId: RECEIPT_DOCUMENT_ID, reportingPeriod: 'FY 2026', sourceText: fact.sourceText, sourceBlockIds: ['SB-RECEIPT-TOTAL'],
    sourceSha256: fact.sourceSha256, sourceArtifactId: fact.sourceArtifactId,
    sourceProvenanceId: fact.sourceProvenanceId, sourceProvenanceIds: fact.sourceProvenanceIds,
    sourceCoordinate: fact.sourceCoordinate, sourceCoordinates: fact.sourceCoordinates,
    sourceExtractionMethod: fact.sourceExtractionMethod, sourceExtractionVersion: fact.sourceExtractionVersion,
  }],
});
assert.equal(report.status, 'AI_PREPARED');
assert.equal(report.numericFactsCount, 1);
assert.ok(report.formats.pdf && report.formats.json && report.formats.xlsx && report.formats.csvLeadSchedules);
const pdfBytes = fs.readFileSync(report.formats.pdf!.filepath);
assert.equal(pdfBytes.subarray(0, 5).toString(), '%PDF-');
const pdfSha = crypto.createHash('sha256').update(pdfBytes).digest('hex');
assert.equal(pdfSha, report.formats.pdf!.sha256);
assert.equal(pdfSha, report.manifest.artifacts.pdf.sha256);

const { PDFParse } = await import('pdf-parse');
const parser = new PDFParse({ data: pdfBytes });
let pdfText = '';
try { pdfText = (await parser.getText()).text; } finally { await parser.destroy(); }
for (const expected of [
  'EVE | EVIDENCE REVIEW WORKING PAPERS', 'Receipt Evidence Review Draft', 'TOTAL $53.23', RECEIPT_SHA256,
  RECEIPT_PROVENANCE_ID, 'fixture-total-glyph-region', 'local-ocr:paddleocr', '3.7.0',
  'Balance-sheet identity: NOT APPLICABLE TO THIS EVIDENCE PACKAGE',
]) assert.ok(pdfText.includes(expected), `PDF missing reverse-lineage/truth text: ${expected}`);
assert.ok(!pdfText.includes('PUBLIC-FILING REVIEW'), 'receipt draft must not claim public-filing scope');

const jsonPayload = JSON.parse(fs.readFileSync(report.formats.json!.filepath, 'utf8'));
assert.equal(jsonPayload.balanceIdentityApplicable, false);
assert.equal(jsonPayload.euclidBalance, null);
assert.equal(jsonPayload.facts[0].sourceSha256, RECEIPT_SHA256);
assert.equal(jsonPayload.facts[0].sourceProvenanceId, RECEIPT_PROVENANCE_ID);
assert.deepEqual(jsonPayload.facts[0].sourceCoordinate.boundingBox, region.normalizedBoundingBox);

const csv = fs.readFileSync(report.formats.csvLeadSchedules!.filepath, 'utf8');
for (const expected of [RECEIPT_SHA256, RECEIPT_PROVENANCE_ID, 'fixture-total-glyph-region', 'TOTAL $53.23']) {
  assert.ok(csv.includes(expected), `CSV missing ${expected}`);
}
const workbook = XLSX.readFile(report.formats.xlsx!.filepath);
const leadRows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets['Lead Schedules'], { header: 1, raw: false });
const leadText = leadRows.flat().map(v => String(v ?? '')).join(' | ');
for (const expected of [RECEIPT_SHA256, RECEIPT_PROVENANCE_ID, 'fixture-total-glyph-region', 'TOTAL $53.23']) {
  assert.ok(leadText.includes(expected), `XLSX lead schedule missing ${expected}`);
}

const proof = {
  marker: 'P2_RECEIPT_DELIVERABLE_TRUTH=PASS', sourceSha256: RECEIPT_SHA256, factId: RECEIPT_FACT_ID,
  provenanceId: RECEIPT_PROVENANCE_ID, reportId: report.reportId, version: report.version,
  pdfSha256: pdfSha, pdfBytes: pdfBytes.length, canonicalFactHash: report.canonicalFactHash,
  formats: { pdf: report.formats.pdf!.sha256, json: report.formats.json!.sha256, xlsx: report.formats.xlsx!.sha256, csv: report.formats.csvLeadSchedules!.sha256 },
};
fs.writeFileSync(path.join(evidenceDir, 'deliverable-truth.json'), JSON.stringify(proof, null, 2));
console.log('P2_RECEIPT_DELIVERABLE_TRUTH=PASS');
