import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { shouldUsePdfOcrFallback } from '../../src/lib/parser/pdfOcrFallback.js';
import { OCRParser } from '../../src/lib/parser/ocrParser.js';

assert.equal(shouldUsePdfOcrFallback({ raw_text: '', pageManifests: [{ native_text_available: false }, { native_text_available: false }] }, { detectedType: 'pdf', mimeType: 'application/pdf' }), true);
assert.equal(shouldUsePdfOcrFallback({ raw_text: 'native text', pageManifests: [{ native_text_available: true }] }, { detectedType: 'pdf', mimeType: 'application/pdf' }), false);
assert.equal(shouldUsePdfOcrFallback({ raw_text: '', pageManifests: [{ native_text_available: false }, { native_text_available: true }] }, { detectedType: 'pdf', mimeType: 'application/pdf' }), false);
assert.equal(shouldUsePdfOcrFallback({ raw_text: '', pageManifests: [] }, { detectedType: 'png', mimeType: 'image/png' }), false);

const buffer = Buffer.from('synthetic-image-only-pdf-bytes');
const sourceSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
const mockClient = {
  async recognize() {
    return {
      engine: 'paddleocr' as const,
      engineVersion: '3.7.0',
      model: 'test-pdf-ocr',
      sourceSha256,
      elapsedMs: 10,
      pages: [{
        pageNumber: 2,
        width: 1000,
        height: 1400,
        regions: [{
          regionId: 'p2-r1',
          text: 'TOTAL $53.23',
          confidence: 0.99,
          boundingBox: { x: 0.1, y: 0.8, width: 0.4, height: 0.05, unit: 'NORMALIZED' as const },
        }],
      }],
      routingDecision: { selectedEngine: 'paddleocr' as const, fallbackInvoked: false, reasons: [], primaryScore: 0.99, fallbackScore: null },
      attempts: [],
    };
  },
};
const parser = new OCRParser(mockClient as any);
const doc: any = await parser.parse({ filename: 'scan.pdf', originalName: 'scan.pdf', mimeType: 'application/pdf', buffer }, { detectedType: 'pdf', mimeType: 'application/pdf' });
assert.equal(doc.metadata.detectedType, 'ocr_pdf');
assert.equal(doc.parser.ocr_used, true);
assert.equal(doc.pageManifests[0].native_text_available, false);
assert.equal(doc.sourceValueProvenance.length, 1);
const coord = doc.sourceValueProvenance[0].coordinates[0];
assert.equal(coord.sourceType, 'PDF');
assert.equal(coord.pageNumber, 2);
assert.equal(coord.evidenceMode, 'OCR');
assert.equal(coord.nativeTextAvailable, false);
assert.equal(coord.sourceSha256, sourceSha256);
assert.equal(coord.boundingBox.unit, 'NORMALIZED');
console.log('PDF_OCR_FALLBACK_TESTS=PASS');
