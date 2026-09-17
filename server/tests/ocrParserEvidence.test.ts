import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { OCRParser } from '../../src/lib/parser/ocrParser.js';

const buffer = Buffer.from('synthetic-image-evidence');
const sha = crypto.createHash('sha256').update(buffer).digest('hex');
const fakeClient = {
  recognize: async () => ({
    engine: 'paddleocr' as const,
    engineVersion: '3.7.0',
    serviceVersion: '1.0.0',
    model: 'PP-OCRv6-medium',
    sourceSha256: sha,
    elapsedMs: 20,
    pages: [{
      pageNumber: 1,
      width: 1000,
      height: 1400,
      regions: [
        {
          regionId: 'p1-r1',
          text: 'TOTAL $45.90',
          confidence: 0.995,
          boundingBox: { x: 0.35, y: 0.72, width: 0.25, height: 0.04, unit: 'NORMALIZED' as const },
          polygon: [[0.35, 0.72], [0.60, 0.72], [0.60, 0.76], [0.35, 0.76]],
        },
      ],
    }],
    routingDecision: {
      selectedEngine: 'paddleocr' as const,
      fallbackInvoked: false,
      reasons: [],
      primaryScore: 0.995,
      fallbackScore: null,
    },
    attempts: [{
      engine: 'paddleocr' as const,
      url: 'http://paddle',
      selected: true,
      score: 0.995,
      averageConfidence: 0.995,
      materialMinimumConfidence: 0.995,
      regionCount: 1,
    }],
    warnings: [],
  }),
};

const parser = new OCRParser(fakeClient as any);
const parsed: any = await parser.parse({
  filename: 'receipt.png',
  originalName: 'receipt.png',
  mimeType: 'image/png',
  buffer,
  size: buffer.length,
}, { detectedType: 'png', mimeType: 'image/png', needsOCR: true });

assert.equal(parsed.source.hash, sha);
assert.equal(parsed.parser.ocr_used, true);
assert.equal(parsed.parser.selectedEngine, 'paddleocr');
assert.equal(parsed.raw_text, 'TOTAL $45.90');
assert.equal(parsed.ocrLines.length, 1);
assert.equal(parsed.sourceValueProvenance.length, 1);
assert.equal(parsed.sourceBlocks.length, 1);

const line = parsed.ocrLines[0];
assert.equal(line.text, 'TOTAL $45.90');
assert.equal(line.coordinate.sourceType, 'IMAGE');
assert.equal(line.coordinate.sourceSha256, sha);
assert.equal(line.coordinate.imageWidth, 1000);
assert.equal(line.coordinate.imageHeight, 1400);
assert.deepEqual(line.coordinate.boundingBox, { x: 0.35, y: 0.72, width: 0.25, height: 0.04, unit: 'NORMALIZED' });
assert.equal(line.coordinate.extractionMethod, 'local-ocr:paddleocr');
assert.equal(line.coordinate.extractionVersion, '3.7.0');
assert.equal(parsed.sourceValueProvenance[0].verificationState, 'VERIFIED');
assert.equal(parsed.pageManifests[0].native_text_available, false);
assert.equal(parsed.pageManifests[0].ocr_used, true);

console.log('OCR_PARSER_EVIDENCE_TESTS=PASS');
