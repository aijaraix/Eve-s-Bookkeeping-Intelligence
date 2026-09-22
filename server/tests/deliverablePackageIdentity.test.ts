import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as XLSXModule from 'xlsx';

const XLSX: any = (XLSXModule as any).default || XLSXModule;
const reports = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-package-identity-'));
process.env.HERMES_REPORTS_DIR = reports;
const { deliverableArtifactService } = await import('../cpaOrganization/deliverableArtifactService.js');

const sourceSha256 = 'c'.repeat(64);
const sourceArtifactId = 'artifact-text-cccccccccccccccccccccccc';
const report = await deliverableArtifactService.compileAndRegisterDeliverable({
  reportId: 'REP-PACKAGE-IDENTITY',
  version: 'v1.0',
  engagementId: 'eng-package-identity',
  workspaceId: 'ws-package-identity',
  clientName: 'Synthetic Package Identity Client',
  title: 'Synthetic Package Identity Draft',
  period: 'FY 2026',
  currency: 'USD',
  status: 'AI_PREPARED',
  euclidBalance: { assets: 100, liabilities: 40, equity: 60, variance: 0 },
  requireFinalLineage: true,
  facts: [{
    id: 'fact-package-identity',
    canonicalMetric: 'revenue',
    label: 'Revenue',
    value: 42,
    statement: 'INCOME_STATEMENT',
    sourceDoc: 'synthetic-source.txt',
    documentId: 'doc-package-identity',
    reportingPeriod: 'FY 2026',
    verificationStatus: 'VERIFIED',
    evidenceStatus: 'CONFIRMED',
    factState: 'APPROVED',
    unitScale: 'ONES',
    normalizedScaleMultiplier: 1,
    sourceText: 'Revenue 42',
    sourceBlockIds: ['SB-package-identity-P1'],
    sourceSha256,
    sourceArtifactId,
    sourceProvenanceId: 'prov-package-identity',
    sourceProvenanceIds: ['prov-package-identity'],
    sourceCoordinate: {
      coordinateId: 'coord-package-identity',
      sourceArtifactId,
      sourceSha256,
      sourceType: 'TEXT',
      lineStart: 1,
      lineEnd: 1,
      rawLiteral: 'Revenue 42',
      normalizedLiteral: 'Revenue 42',
      extractionMethod: 'TEXT_NATIVE_TEXT',
      extractionVersion: '1.0'
    }
  }]
});

const expectedIdentity = [report.reportId, report.version, report.engagementId, report.workspaceId, 'Synthetic Package Identity Client'];
const json = fs.readFileSync(report.formats.json!.filepath, 'utf8');
const csv = fs.readFileSync(report.formats.csvLeadSchedules!.filepath, 'utf8');
const wb = XLSX.readFile(report.formats.xlsx!.filepath);
const xlsxText = wb.SheetNames.flatMap((name: string) => XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false }).flat()).map(String).join('|');
const { PDFParse } = await import('pdf-parse');
const parser = new PDFParse({ data: fs.readFileSync(report.formats.pdf!.filepath) });
let pdfText = '';
try { pdfText = (await parser.getText()).text; } finally { await parser.destroy(); }

for (const identity of expectedIdentity) {
  assert.ok(json.includes(identity), `JSON missing ${identity}`);
  assert.ok(csv.includes(identity), `CSV missing ${identity}`);
  assert.ok(xlsxText.includes(identity), `XLSX missing ${identity}`);
  assert.ok(pdfText.includes(identity), `PDF missing ${identity}`);
}
assert.equal(wb.Sheets['Executive Summary'].B17.f, 'B14-B15-B16');
for (const token of ['APPROVED', 'ONES', 'SB-package-identity-P1']) {
  assert.ok(json.includes(token), `JSON missing ${token}`);
  assert.ok(csv.includes(token), `CSV missing ${token}`);
  assert.ok(xlsxText.includes(token), `XLSX missing ${token}`);
  assert.ok(pdfText.includes(token), `PDF missing ${token}`);
}

console.log('DELIVERABLE_PACKAGE_IDENTITY=PASS');
