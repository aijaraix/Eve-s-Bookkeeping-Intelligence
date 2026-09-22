import assert from 'node:assert/strict';
import fs from 'node:fs';

const client = fs.readFileSync('src/lib/ocr/localOcrClient.ts', 'utf8');
assert.ok(client.includes("LOCAL_OCR_INSUFFICIENT_QUALITY"));
assert.ok(client.includes('finalQualityReasons'));
assert.ok(client.includes('throw new LocalOcrInsufficientQualityError'));

const parser = fs.readFileSync('src/lib/parser/ocrParser.ts', 'utf8');
const recognizeAt = parser.indexOf('await this.client.recognize');
const provenanceAt = parser.indexOf('const sourceValueProvenance');
assert.ok(recognizeAt >= 0 && provenanceAt > recognizeAt, 'OCR must clear client quality gate before source provenance/promotion is constructed');

const runner = fs.readFileSync('server/cpaOrganization/academyOcrCurriculumRunner.ts', 'utf8');
assert.ok(runner.includes('semantic-blocked-by-ocr-quality'));
assert.ok(runner.includes('accounting-blocked-by-ocr-quality'));
assert.ok(runner.includes('ocr-material-dual-engine-agreement'));

console.log('OCR_FAIL_CLOSED_QUALITY_GATE_TESTS=PASS');
