import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { CanonicalDocumentModel } from '../../src/lib/parser/types.js';
import { extractBankStatementFromDocument } from '../bankStatementExtractor.js';
import { HybridExtractionOrchestrator } from '../hybridExtraction/HybridExtractionOrchestrator.js';
import { extractRawInputTransactions } from '../rawInput/rawTransactionExtractionEngine.js';
import { buildInvoiceOcrComposite } from './fixtures/invoiceApFiveDimensionFixture.js';

function documentFromLines(lines: string[], filename = 'source.txt'): CanonicalDocumentModel {
  const sourceSha256 = crypto.createHash('sha256').update(lines.join('\n')).digest('hex');
  const sourceArtifactId = `artifact-${sourceSha256.slice(0, 16)}`;
  const sourceBlocks = lines.map((text, index) => ({
    source_block_id: `SB-doc-P1-${index + 1}`,
    document_id: 'doc',
    page_number: 1,
    raw_text: text,
    text_content: text,
    source_sha256: sourceSha256,
    source_artifact_id: sourceArtifactId,
    source_provenance_id: `prov-${index + 1}`,
    source_coordinate: {
      coordinateId: `coord-${index + 1}`,
      sourceArtifactId,
      sourceSha256,
      sourceType: 'DOCUMENT',
      lineStart: index + 1,
      lineEnd: index + 1,
      rawLiteral: text,
      normalizedLiteral: text,
      extractionMethod: 'TEST_NATIVE_TEXT',
      extractionVersion: '1',
    },
    confidence: 0.99,
  }));
  return {
    document_id: 'doc',
    source: { filename, format: 'txt', hash: sourceSha256, sourceArtifactId },
    metadata: { page_count: 1, pages: 1 },
    raw_text: lines.join('\n'),
    markdown: lines.join('\n'),
    pages: [{ page_number: 1, text: lines.join('\n') }],
    page_count: 1,
    pageManifests: [{ page_number: 1, native_text_available: true }],
    sourceBlocks,
    sections: [{ title: 'Main', text: lines.join('\n'), page: 1 }],
  };
}

const receipt = extractRawInputTransactions({
  doc: documentFromLines([
    'EVE TEST MARKET',
    'RECEIPT R-1002',
    'DATE 09/18/2026',
    'CURRENCY USD',
    'NOTEBOOK 2 x $5.00 = $10.00',
    'SUBTOTAL $10.00',
    'SALES TAX $0.80',
    'TOTAL $10.80',
    'PAYMENT METHOD VISA',
  ], 'receipt.txt'),
  workspaceId: 'ws-receipt', documentId: 'doc-receipt', filename: 'receipt.txt', currency: 'EUR',
});
assert.equal(receipt.recognized, true);
assert.equal(receipt.documentKind, 'RECEIPT');
assert.equal(receipt.transactions.length, 1);
assert.equal(receipt.transactions[0].amount.value, 10.8);
assert.equal(receipt.transactions[0].currency?.value, 'USD', 'source currency must override unrelated workspace context');
assert.equal(receipt.transactions[0].counterparty?.value, 'EVE TEST MARKET');
assert.equal(receipt.transactions[0].lineItems.length, 1);
assert.equal(receipt.transactions[0].evidenceState, 'COMPLETE');
assert.equal(receipt.facts[0].statementType, 'RAW_INPUT_TRANSACTION');
assert.equal(receipt.facts[0].status, 'approved');
assert.equal(receipt.facts[0].postingStatus, 'NOT_POSTED');
assert.ok(receipt.facts[0].sourceSha256);
assert.ok(receipt.facts[0].sourceCoordinate);

const invoiceWithoutCurrency = extractRawInputTransactions({
  doc: documentFromLines([
    'SYNTHETIC SUPPLIER CO.',
    'INVOICE INV-42',
    'INVOICE DATE 2026-09-19',
    'TOTAL DUE $187.25',
  ], 'invoice.txt'),
  workspaceId: 'ws-invoice', documentId: 'doc-invoice', filename: 'invoice.txt', currency: 'USD',
});
assert.equal(invoiceWithoutCurrency.documentKind, 'INVOICE');
assert.equal(invoiceWithoutCurrency.facts.length, 1);
assert.equal(invoiceWithoutCurrency.facts[0].normalizedValue, 187.25);
assert.equal(invoiceWithoutCurrency.facts[0].currency, undefined, 'workspace currency must not be manufactured as document evidence');
assert.equal(invoiceWithoutCurrency.facts[0].status, 'pending_review');
assert.ok(invoiceWithoutCurrency.clarificationReasons.includes('CURRENCY_MISSING_OR_AMBIGUOUS'));
assert.ok(invoiceWithoutCurrency.clarificationReasons.includes('INVOICE_AP_AR_DIRECTION_REQUIRES_TENANT_CONTEXT'));

const invoiceOcr = buildInvoiceOcrComposite();
const invoiceOcrLines = invoiceOcr.pages.flatMap(page => page.regions.map(region => region.text));
const invoiceOcrDoc: any = documentFromLines(invoiceOcrLines, 'invoice.png');
invoiceOcrDoc.ocrRoutingDecision = invoiceOcr.routingDecision;
invoiceOcrDoc.ocrEngineResults = invoiceOcr.attempts.map(attempt => ({
  engine: attempt.engine, rotationDegrees: attempt.rotationDegrees, selected: attempt.selected,
  score: attempt.score, averageConfidence: attempt.averageConfidence,
  materialMinimumConfidence: attempt.materialMinimumConfidence, regionCount: attempt.regionCount,
  result: attempt.result,
}));
const consensusInvoice = extractRawInputTransactions({ doc: invoiceOcrDoc, workspaceId: 'ws-ocr-invoice', documentId: 'doc-ocr-invoice', filename: 'invoice.png' });
assert.equal(consensusInvoice.facts.length, 1);
assert.equal(consensusInvoice.transactions[0].amount.value, 187.25);
assert.equal(consensusInvoice.transactions[0].currency?.value, 'USD');
assert.equal(consensusInvoice.transactions[0].evidenceState, 'COMPLETE', 'material fields agreed by both OCR engines must retain the existing consensus proof');
assert.equal(consensusInvoice.facts[0].sourceSha256, invoiceOcr.sourceSha256);
assert.ok(String(consensusInvoice.facts[0].sourceProvenanceId).startsWith('ocr:'));

const conflictedOcrDoc: any = structuredClone(invoiceOcrDoc);
const fallbackTotal = conflictedOcrDoc.ocrEngineResults
  .find((attempt: any) => !attempt.selected)?.result?.pages?.[0]?.regions
  ?.find((region: any) => String(region.text).startsWith('TOTAL DUE'));
assert.ok(fallbackTotal);
fallbackTotal.text = 'TOTAL DUE $197.25';
const conflictedInvoice = extractRawInputTransactions({ doc: conflictedOcrDoc, workspaceId: 'ws-ocr-conflict', documentId: 'doc-ocr-conflict', filename: 'invoice.png' });
assert.equal(conflictedInvoice.facts[0].status, 'pending_review');
assert.ok(conflictedInvoice.clarificationReasons.includes('OCR_FIELD_TOTALDUE_CONFLICT'));

const tableDoc = documentFromLines(['Date,Description,Amount,Currency'], 'transactions.csv');
const tableSha = tableDoc.source.hash!;
const coordinate = (cell: string, row: number, column: number) => ({
  provenanceId: `prov-r${row}-c${column}`,
  coordinate: {
    coordinateId: `coord-r${row}-c${column}`,
    sourceArtifactId: tableDoc.source.sourceArtifactId,
    sourceSha256: tableSha,
    sourceType: 'CSV',
    rowNumber: row,
    columnNumber: column,
    rawLiteral: cell,
    normalizedLiteral: cell,
    extractionMethod: 'CSV_NATIVE',
    extractionVersion: '1',
  },
});
tableDoc.tables = [{
  headers: ['Date', 'Description', 'Amount', 'Currency'],
  rows: [
    ['2026-09-20', 'Permit fee', '125.00', 'USD'],
    ['2026-09-21', 'Customer refund', '(20.00)', 'USD'],
  ],
  pageNumber: 1,
  rowEvidence: [
    [coordinate('2026-09-20', 2, 1), coordinate('Permit fee', 2, 2), coordinate('125.00', 2, 3), coordinate('USD', 2, 4)],
    [coordinate('2026-09-21', 3, 1), coordinate('Customer refund', 3, 2), coordinate('(20.00)', 3, 3), coordinate('USD', 3, 4)],
  ],
}];
const register = extractRawInputTransactions({ doc: tableDoc, workspaceId: 'ws-register', documentId: 'doc-register', filename: 'transactions.csv' });
assert.equal(register.documentKind, 'TRANSACTION_REGISTER');
assert.equal(register.transactions.length, 2);
assert.deepEqual(register.transactions.map(row => row.amount.value), [125, -20]);
assert.equal(register.evidenceCompleteCount, 2);
assert.ok(register.facts.every(fact => fact.status === 'approved' && fact.sourceCoordinate?.sourceType === 'CSV'));

const bankDoc = documentFromLines([
  'BANK STATEMENT',
  'CURRENCY USD',
  'BEGINNING BALANCE $100.00',
  '09/20/2026 COFFEE SHOP -12.50 87.50',
  'ENDING BALANCE $87.50',
], 'bank.txt');
const bank = extractBankStatementFromDocument({ doc: bankDoc, workspaceId: 'ws-bank', documentId: 'doc-bank', filename: 'bank.txt' });
assert.equal(bank.success, true);
const bankTransactionFacts = bank.facts.filter(fact => fact.canonicalMetric === 'raw_input_transaction_total');
assert.equal(bankTransactionFacts.length, 1, 'each bank row must persist as a transaction-level fact');
assert.equal(bankTransactionFacts[0].normalizedValue, -12.5);
assert.equal(bankTransactionFacts[0].status, 'approved');
assert.equal(bankTransactionFacts[0].rawTransaction.reconciliationApplicable, true);

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-raw-input-hybrid-'));
try {
  const filepath = path.join(root, 'academy-receipt.txt');
  const bytes = Buffer.from([
    'ACADEMY BOOK SHOP',
    'RECEIPT R-9001',
    'DATE 09/22/2026',
    'CURRENCY USD',
    'TOTAL $24.50',
  ].join('\n'));
  fs.writeFileSync(filepath, bytes);
  const result = await new HybridExtractionOrchestrator().processDocument({
    intakeId: 'intake-raw-1', documentId: 'doc-raw-1', workspaceId: 'ws-raw-1',
    filePath: filepath, originalFilename: 'academy-receipt.txt', mimeType: 'text/plain',
    documentHash: crypto.createHash('sha256').update(bytes).digest('hex'), currency: 'EUR',
  });
  assert.equal(result.success, true);
  assert.equal(result.documentMap.documentType, 'RECEIPT');
  assert.equal(result.rawInput?.recognized, true);
  assert.equal(result.canonicalFacts.length, 1);
  assert.equal(result.canonicalFacts[0].extractionEngine, 'RAW_TRANSACTION_DETERMINISTIC_V1');
  assert.equal(result.canonicalFacts[0].currency, 'USD');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log('UNIVERSITY_RAW_TRANSACTION_EXTRACTION=PASS');
