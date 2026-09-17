import assert from 'node:assert/strict';
import { adaptFactsToBalanceSheet } from '../../src/adapters/presentationAdapters.js';

const imageCoordinate = {
  coordinateId: 'coord-receipt-assets',
  sourceArtifactId: 'artifact-receipt-1',
  sourceSha256: 'a'.repeat(64),
  sourceType: 'IMAGE',
  pageNumber: 1,
  imageWidth: 1200,
  imageHeight: 1800,
  boundingBox: { x: 0.61, y: 0.82, width: 0.24, height: 0.04, unit: 'NORMALIZED' },
  ocrRegionId: 'p1-r8',
  rawLiteral: 'TOTAL ASSETS $400,000',
  normalizedLiteral: 'TOTAL ASSETS $400,000',
  confidence: 0.9925,
  extractionMethod: 'local-ocr:paddleocr',
  extractionVersion: '3.7.0',
};

const facts = [
  {
    id: 'fact-assets-image', canonicalMetric: 'total_assets', labelOriginal: 'Total Assets',
    valueFunctional: '400000', normalizedValue: 400000, valueOriginal: '$400,000',
    reportingPeriod: '2026-12-31', verificationStatus: 'VERIFIED', evidenceStatus: 'CONFIRMED', status: 'APPROVED',
    documentId: 'doc-receipt', sourceDocument: 'receipt.png', sourceText: 'TOTAL ASSETS $400,000',
    sourceProvenanceId: 'prov-receipt-assets', sourceCoordinate: imageCoordinate, sourceCoordinates: [imageCoordinate], provenanceCoordinates: [imageCoordinate],
  },
  {
    id: 'fact-liabilities-image', canonicalMetric: 'total_liabilities', labelOriginal: 'Total Liabilities',
    valueFunctional: '150000', normalizedValue: 150000, valueOriginal: '$150,000',
    reportingPeriod: '2026-12-31', verificationStatus: 'VERIFIED', evidenceStatus: 'CONFIRMED', status: 'APPROVED',
    documentId: 'doc-receipt', sourceDocument: 'receipt.png', sourceText: 'TOTAL LIABILITIES $150,000',
  },
  {
    id: 'fact-equity-image', canonicalMetric: 'total_equity', labelOriginal: 'Total Equity',
    valueFunctional: '250000', normalizedValue: 250000, valueOriginal: '$250,000',
    reportingPeriod: '2026-12-31', verificationStatus: 'VERIFIED', evidenceStatus: 'CONFIRMED', status: 'APPROVED',
    documentId: 'doc-receipt', sourceDocument: 'receipt.png', sourceText: 'TOTAL EQUITY $250,000',
  },
];

const result = adaptFactsToBalanceSheet(facts as any[], 'FY 2026', 'USD');
const line = result.lines.find(item => item.canonicalMetric === 'total_assets');
assert.ok(line, 'total assets line should be rendered');
assert.equal(line?.values['FY 2026'], 400000);
assert.equal(line?.factLineageId, 'fact-assets-image');
assert.equal(line?.sourceType, 'IMAGE');
assert.equal(line?.sourceProvenanceId, 'prov-receipt-assets');
assert.equal(line?.sourceCoordinate?.ocrRegionId, 'p1-r8');
assert.equal(line?.sourceConfidence, 0.9925);
assert.equal(line?.sourceExtractionMethod, 'local-ocr:paddleocr');
assert.equal(line?.sourceExtractionVersion, '3.7.0');
assert.ok(line?.sourceLocationLabel?.includes('Image region'));
assert.ok(line?.sourceLocationLabel?.includes('x=61.0%'));
assert.ok(line?.renderId, 'actual presentation adapter must register a render id');

console.log('IMAGE_SOURCE_TO_PIXEL_PRESENTATION_TESTS=PASS');
