import assert from 'node:assert/strict';
import { mimeTypeForSource, routeSupportedSource } from '../sourceFormatRouting.js';

assert.equal(routeSupportedSource('statement.pdf', 'application/pdf'), 'PDF');
assert.equal(routeSupportedSource('ledger.csv', 'text/csv'), 'SPREADSHEET');
assert.equal(routeSupportedSource('trial-balance.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), 'SPREADSHEET');
assert.equal(routeSupportedSource('receipt.png', 'image/png'), 'IMAGE');
assert.equal(routeSupportedSource('invoice.txt', 'text/plain'), 'DOCUMENT');
assert.equal(routeSupportedSource('filing.html', 'text/html'), 'DOCUMENT');
assert.equal(routeSupportedSource('memo.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'), 'DOCUMENT');
assert.equal(mimeTypeForSource('DOCUMENT', 'invoice.txt'), 'text/plain');
assert.throws(() => routeSupportedSource('archive.zip', 'application/zip'), /UNSUPPORTED_SOURCE_FORMAT/);

console.log('SOURCE_FORMAT_ROUTING=PASS');
