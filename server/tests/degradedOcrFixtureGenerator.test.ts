import assert from 'node:assert/strict';
import fs from 'node:fs';

const generator = fs.readFileSync('scripts/academy/generate_ocr_curriculum_fixtures.py', 'utf8');
for (const required of [
  '--include-degraded',
  'receipt_low_quality.jpg',
  'receipt_rotated_90.png',
  'receipt_skewed_6deg.png',
  'receipt_glare_totals.png',
  'receipt_cropped_before_totals.png',
  'GaussianBlur(0.7)',
  'rectangle((40, 445, 860, 610)',
  'crop((0, 0, 900, 450))',
]) {
  assert.ok(generator.includes(required), `missing deterministic degraded fixture recipe: ${required}`);
}
assert.ok(generator.includes("EXPECTED_PILLOW = '12.3.0'"));
console.log('DEGRADED_OCR_FIXTURE_GENERATOR_TESTS=PASS');
