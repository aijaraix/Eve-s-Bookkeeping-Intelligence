import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { LocalOcrClient } from '../../src/lib/ocr/localOcrClient.js';
import { OCRParser } from '../../src/lib/parser/ocrParser.js';

const buffer = Buffer.from('synthetic-rotated-receipt-source');
const sourceSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
const requests: Array<{ url: string; rotationDegrees: number; sourceSha256: string }> = [];

const makeResult = (engine: 'paddleocr' | 'doctr', rotationDegrees: number, confidence: number, text: string) => ({
  engine,
  engineVersion: engine === 'paddleocr' ? '3.7.0-test' : '1.1.0-test',
  serviceVersion: '1.2.0-test',
  model: engine === 'paddleocr' ? 'paddle-test' : 'doctr-test',
  sourceSha256,
  elapsedMs: 5,
  appliedRotationDegrees: rotationDegrees,
  coordinateSpace: 'ORIGINAL_SOURCE' as const,
  pages: [{
    pageNumber: 1,
    width: 900,
    height: 1000,
    regions: [{
      regionId: 'p1-r1',
      text,
      confidence,
      boundingBox: { x: 0.1, y: 0.7, width: 0.5, height: 0.08, unit: 'NORMALIZED' as const },
      polygon: [],
    }],
  }],
  warnings: rotationDegrees ? [`OCR_ORIENTATION_WORKING_COPY:${rotationDegrees}`] : [],
});

let primaryCalls = 0;
let fallbackCalls = 0;
const fetchImpl = async (url: any, init?: any) => {
  const parsed = JSON.parse(String(init?.body || '{}'));
  const rotationDegrees = Number(parsed.rotationDegrees || 0);
  requests.push({ url: String(url), rotationDegrees, sourceSha256: String(parsed.sourceSha256 || '') });
  const isFallback = String(url).includes('doctr');
  if (isFallback) fallbackCalls++; else primaryCalls++;

  let confidence = isFallback ? 0.72 : 0.62;
  let text = isFallback ? 'ROTATED GARBLED 53.23' : 'BAD OCR 53.23';
  if (!isFallback && rotationDegrees === 90) { confidence = 0.45; text = 'UPSIDE DOWN OCR'; }
  if (!isFallback && rotationDegrees === 270) { confidence = 0.995; text = 'TOTAL $53.23'; }
  if (!isFallback && rotationDegrees === 180) { confidence = 0.40; text = 'SIDEWAYS OCR'; }

  return new Response(JSON.stringify(makeResult(isFallback ? 'doctr' : 'paddleocr', rotationDegrees, confidence, text)), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

const client = new LocalOcrClient({
  primaryUrl: 'http://paddle',
  fallbackUrl: 'http://doctr',
  fetchImpl: fetchImpl as typeof fetch,
  primaryAverageConfidenceFloor: 0.90,
  materialConfidenceFloor: 0.85,
  orientationRetryEnabled: true,
  orientationRetryAngles: [90, 270, 180],
});

const result = await client.recognize({ filename: 'receipt-rotated.png', mimeType: 'image/png', buffer, sourceSha256 });
assert.equal(result.engine, 'paddleocr');
assert.equal(result.appliedRotationDegrees, 270);
assert.equal(result.coordinateSpace, 'ORIGINAL_SOURCE');
assert.equal(result.routingDecision.orientationRetryInvoked, true);
assert.equal(result.routingDecision.selectedRotationDegrees, 270);
assert.equal(result.routingDecision.selectedEngine, 'paddleocr');
assert.equal(primaryCalls, 4); // original + 90/270/180 bounded retries
assert.equal(fallbackCalls, 1); // original fallback only; no rotated fallback once Paddle has a passing orientation
assert.equal(result.attempts.length, 5);
assert.equal(result.attempts.filter(attempt => attempt.selected).length, 1);
assert.equal(result.attempts.find(attempt => attempt.selected)?.rotationDegrees, 270);
assert.equal(result.pages[0].regions[0].text, 'TOTAL $53.23');
assert.ok(result.warnings?.includes('OCR_ORIENTATION_RETRY_EVALUATED'));
assert.ok(result.warnings?.includes('OCR_ORIENTATION_RETRY_SELECTED:270'));
assert.ok(requests.every(request => request.sourceSha256 === sourceSha256));
assert.deepEqual(requests.map(request => request.rotationDegrees), [0, 0, 90, 270, 180]);

const parser = new OCRParser({ recognize: async () => result } as any);
const parsedDoc: any = await parser.parse({
  filename: 'receipt-rotated.png',
  originalName: 'receipt-rotated.png',
  mimeType: 'image/png',
  buffer,
  size: buffer.length,
}, { detectedType: 'png', mimeType: 'image/png', needsOCR: true });
assert.equal(parsedDoc.parser.orientationRetryInvoked, true);
assert.equal(parsedDoc.parser.selectedRotationDegrees, 270);
assert.equal(parsedDoc.metadata.ocrRotationDegrees, 270);
assert.equal(parsedDoc.ocrLines[0].coordinate.transformId, 'ocr-rotation-270-remapped-to-original');
assert.equal(parsedDoc.ocrLines[0].coordinate.sourceSha256, sourceSha256);
assert.equal(parsedDoc.sourceBlocks[0].ocr_rotation_degrees, 270);
assert.match(parsedDoc.sourceValueProvenance[0].transformationSteps[0].notes, /orientationRetryDegrees=270/);
assert.match(parsedDoc.sourceValueProvenance[0].transformationSteps[0].notes, /coordinates=original-source/);

console.log('OCR_ORIENTATION_RETRY_TESTS=PASS');
