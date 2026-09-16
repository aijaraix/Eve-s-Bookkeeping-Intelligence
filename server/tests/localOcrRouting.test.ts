import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { LocalOcrClient } from '../../src/lib/ocr/localOcrClient.js';

const buffer = Buffer.from('synthetic-receipt-bytes');
const sourceSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
const base = {
  engineVersion: 'test-1',
  serviceVersion: '1',
  sourceSha256,
  elapsedMs: 10,
  pages: [{
    pageNumber: 1,
    width: 1000,
    height: 1200,
    regions: [{
      regionId: 'p1-r1',
      text: 'TOTAL $45.90',
      confidence: 0.99,
      boundingBox: { x: 0.1, y: 0.8, width: 0.4, height: 0.05, unit: 'NORMALIZED' as const },
    }],
  }],
};

{
  let fallbackCalls = 0;
  const fetchImpl = async (url: any) => {
    if (String(url).includes('doctr')) fallbackCalls++;
    return new Response(JSON.stringify({ ...base, engine: 'paddleocr', model: 'paddle-test' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  const client = new LocalOcrClient({
    primaryUrl: 'http://paddle',
    fallbackUrl: 'http://doctr',
    fetchImpl: fetchImpl as typeof fetch,
  });
  const result = await client.recognize({ filename: 'receipt.png', mimeType: 'image/png', buffer, sourceSha256 });
  assert.equal(result.engine, 'paddleocr');
  assert.equal(result.routingDecision.fallbackInvoked, false);
  assert.equal(fallbackCalls, 0);
  assert.equal(result.attempts.length, 1);
  assert.equal(result.attempts[0].selected, true);
}

{
  let primaryCalls = 0;
  let fallbackCalls = 0;
  const fetchImpl = async (url: any) => {
    if (String(url).includes('paddle')) {
      primaryCalls++;
      return new Response(JSON.stringify({
        ...base,
        engine: 'paddleocr',
        model: 'paddle-test',
        pages: [{ ...base.pages[0], regions: [{ ...base.pages[0].regions[0], confidence: 0.55 }] }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    fallbackCalls++;
    return new Response(JSON.stringify({ ...base, engine: 'doctr', model: 'doctr-test' }), {
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
  });
  const result = await client.recognize({ filename: 'receipt.png', mimeType: 'image/png', buffer, sourceSha256 });
  assert.equal(primaryCalls, 1);
  assert.equal(fallbackCalls, 1);
  assert.equal(result.routingDecision.fallbackInvoked, true);
  assert.equal(result.engine, 'doctr');
  assert.ok(result.routingDecision.reasons.some(reason => reason.includes('MATERIAL_CONFIDENCE')));
  assert.equal(result.attempts.find(a => a.engine === 'doctr')?.selected, true);
}

{
  const fetchImpl = async () => new Response(JSON.stringify({ ...base, engine: 'paddleocr', sourceSha256: 'f'.repeat(64) }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  const client = new LocalOcrClient({ primaryUrl: 'http://paddle', fetchImpl: fetchImpl as typeof fetch });
  await assert.rejects(
    () => client.recognize({ filename: 'receipt.png', mimeType: 'image/png', buffer, sourceSha256 }),
    /LOCAL_OCR_FAILED|LOCAL_OCR_SOURCE_HASH_MISMATCH/,
  );
}

console.log('LOCAL_OCR_ROUTING_TESTS=PASS');
