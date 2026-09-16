import assert from 'node:assert/strict';
import { selectParserPath } from '../../src/lib/parser/parserSelection.js';

assert.equal(selectParserPath({ detectedType: 'xlsx', requiresParser: 'SpreadsheetParser' }), 'SPREADSHEET');
assert.equal(selectParserPath({ detectedType: 'png', mimeType: 'image/png', needsOCR: true, requiresParser: 'OCRParser' }), 'OCR');
assert.equal(selectParserPath({ detectedType: 'jpeg', mimeType: 'image/jpeg' }), 'OCR');
assert.equal(selectParserPath({ detectedType: 'pdf', mimeType: 'application/pdf', requiresParser: 'AnyDocParser' }), 'DOCUMENT');
assert.equal(selectParserPath({ detectedType: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'DOCUMENT');

console.log('PARSER_SELECTION_TESTS=PASS');
