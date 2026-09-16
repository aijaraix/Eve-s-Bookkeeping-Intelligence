import assert from 'node:assert/strict';
import fs from 'node:fs';
const worker = fs.readFileSync('server/worker.ts', 'utf8');
const hybrid = fs.readFileSync('server/hybridExtraction/HybridExtractionOrchestrator.ts', 'utf8');
const app = fs.readFileSync('services/local_ocr/app.py', 'utf8');
for (const source of [worker, hybrid]) {
  assert.ok(source.includes('shouldUsePdfOcrFallback'));
  assert.ok(source.includes('OCRParser'));
}
assert.ok(app.includes('render_pdf_pages'));
assert.ok(app.includes('PDF_RASTERIZED_FOR_OCR'));
assert.ok(app.includes('OCR_MAX_PDF_PAGES'));
console.log('PDF_OCR_INTEGRATION_WIRING_TESTS=PASS');
