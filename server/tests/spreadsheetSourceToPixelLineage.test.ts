import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as XLSX from 'xlsx';
import { SpreadsheetParser } from '../../src/lib/parser/spreadsheetParser.js';
import { adaptFactsToBalanceSheet } from '../../src/adapters/presentationAdapters.js';

const wb = XLSX.utils.book_new();
const ws: any = XLSX.utils.aoa_to_sheet([
  ['Metric', 'Value'],
  ['Total Assets', 100],
  ['Total Liabilities', 60],
  ['Total Equity', 40]
]);
ws.B4 = { t: 'n', f: 'B2-B3', v: 40, z: '$#,##0.00' };
ws['!ref'] = 'A1:B4';
ws['!cols'] = [{}, { hidden: true }];
XLSX.utils.book_append_sheet(wb, ws, 'Balance');
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

const parser = new SpreadsheetParser();
const parsed: any = await parser.parse({
  filename: 'Synthetic_Balance.xlsx',
  originalName: 'Synthetic_Balance.xlsx',
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  buffer,
  size: buffer.length
}, { detectedType: 'xlsx' });

assert.match(parsed.source.hash, /^[a-f0-9]{64}$/);
assert.equal(parsed.source.sourceArtifactId.startsWith('artifact-spreadsheet-'), true);
assert.equal(parsed.tables.length, 1);
assert.equal(parsed.tables[0].rowEvidence.length, 3);
const b4Ref = parsed.tables[0].rowEvidence[2][1];
assert.equal(b4Ref.coordinate.sourceType, 'SPREADSHEET');
assert.equal(b4Ref.coordinate.sheetName, 'Balance');
assert.equal(b4Ref.coordinate.cellAddress, 'B4');
assert.equal(b4Ref.coordinate.formula, '=B2-B3');
assert.equal(b4Ref.coordinate.cachedValue, 40);
assert.equal(b4Ref.coordinate.numberFormat, '$#,##0.00');
assert.equal(b4Ref.coordinate.hiddenColumn, true);
assert.equal(parsed.sourceValueProvenance.some((p: any) => p.provenanceId === b4Ref.provenanceId), true);

const b2Ref = parsed.tables[0].rowEvidence[0][1];
const b3Ref = parsed.tables[0].rowEvidence[1][1];
const sourceFact = (id: string, metric: string, value: number, evidence: any) => ({
  id,
  canonicalMetric: metric,
  labelOriginal: metric.replaceAll('_', ' '),
  labelNormalized: metric.replaceAll('_', ' '),
  valueOriginal: String(value),
  valueFunctional: String(value),
  normalizedValue: value,
  reportingPeriod: 'FY 2026',
  verificationStatus: 'VERIFIED',
  sourceDocument: 'Synthetic_Balance.xlsx',
  sourceText: `${metric}: ${value} (${evidence.coordinate.sheetName}!${evidence.coordinate.cellAddress})`,
  sourceProvenanceId: evidence.provenanceId,
  sourceCoordinate: evidence.coordinate,
  sourceCoordinates: [evidence.coordinate],
  provenanceCoordinates: [evidence.coordinate]
});
const facts = [
  sourceFact('fact-assets', 'total_assets', 100, b2Ref),
  sourceFact('fact-liabilities', 'total_liabilities', 60, b3Ref),
  sourceFact('fact-equity', 'total_equity', 40, b4Ref)
];
const projected = adaptFactsToBalanceSheet(facts, 'FY 2026', 'USD');
const equity = projected.lines.find(line => line.canonicalMetric === 'total_equity')!;
assert.equal(equity.factLineageId, 'fact-equity');
assert.equal(equity.sourceProvenanceId, b4Ref.provenanceId);
assert.equal(equity.sourceCoordinate?.cellAddress, 'B4');
assert.equal(equity.sourceLocationLabel, 'Balance!B4');
assert.equal(equity.sourceFormula, '=B2-B3');
assert.ok(equity.renderId, 'real presentation adapter must register a render ID');

const serverSource = fs.readFileSync('server.ts', 'utf8');
assert(serverSource.includes('sourceProvenanceId: f.sourceProvenanceId'), 'web persistence must retain provenance ID');
assert(serverSource.includes('sourceCoordinate: f.sourceCoordinate'), 'web persistence must retain exact source coordinate');
const workerSource = fs.readFileSync('server/worker.ts', 'utf8');
assert(workerSource.includes('sourceCoordinate: valueEvidence?.coordinate'), 'worker fact extraction must bind the numeric cell coordinate');
const homeSource = fs.readFileSync('src/components/views/practice/PracticeHomeView.tsx', 'utf8');
assert(homeSource.includes('data-source-provenance-id'), 'actual Practice Home financial identity card must expose provenance ID in DOM');
assert(homeSource.includes('data-source-location'), 'actual Practice Home financial identity card must expose source location in DOM');
const drawerSource = fs.readFileSync('src/components/design-system/EveProvenanceDrawer.tsx', 'utf8');
assert(drawerSource.includes("coordinate?.sourceType === 'SPREADSHEET'"), 'provenance drawer must render spreadsheet-specific evidence');
assert(drawerSource.includes('Sheet / Cell'), 'provenance drawer must show exact sheet/cell');

console.log('SPREADSHEET_SOURCE_TO_PIXEL_LINEAGE_TESTS=PASS');
