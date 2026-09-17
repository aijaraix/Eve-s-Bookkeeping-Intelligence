import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AnyDocParser } from '../../src/lib/parser/anydocParser.js';
import { buildLongDocumentSemanticContext, selectLongDocumentEvidence } from '../cpaOrganization/longDocumentSemanticContextEngine.js';

const dir = process.env.LONG_DOCUMENT_ACCEPTANCE_DIR || '/tmp/eve-long-document-semantic';
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'fixture-manifest.json'), 'utf8'));
const pdfPath = path.join(dir, manifest.filename);
const buffer = fs.readFileSync(pdfPath);
const parser = new AnyDocParser();
const doc: any = await parser.parse({ filename: manifest.filename, originalName: manifest.filename, mimeType: 'application/pdf', buffer, size: buffer.length }, { detectedType: 'pdf', mimeType: 'application/pdf' });
assert.equal(doc.page_count, 12);
assert.equal(doc.pageManifests.length, 12);
assert.ok(doc.pageManifests.every((p: any) => p.native_text_available === true));
const review = buildLongDocumentSemanticContext({ doc, sourceSha256: manifest.sha256 });
assert.equal(review.status, 'CONTEXT_LEDGER_READY');
assert.equal(review.pageCount, 12);
assert.equal(review.issues.length, 0);
assert.ok(review.inheritedFieldCount > 15);
assert.ok(review.pages.every(p => p.sourceCoordinate.sourceSha256 === manifest.sha256));
assert.ok(review.pages.every(p => p.sourceCoordinate.pageNumber === p.pageNumber));

const page3 = review.pages.find(p => p.pageNumber === 3)!;
assert.equal(page3.section, 'Management Discussion and Outlook');
assert.equal(page3.entity, 'Alpha Holdings Inc.');
assert.equal(page3.period, 'FY 2026');
assert.equal(page3.speaker, 'CEO Maya Levin');
assert.equal(page3.narrativeIntent, 'FORWARD_LOOKING_COMMENTARY');
assert.equal(page3.contextOrigins.section, 2);
assert.ok(page3.inheritedFields.includes('speaker'));

const page7 = review.pages.find(p => p.pageNumber === 7)!;
assert.equal(page7.entity, 'Beta Subsidiary LLC');
assert.equal(page7.period, 'FY 2025');
assert.equal(page7.author, 'Controller Daniel Ortiz');
assert.equal(page7.contextOrigins.entity, 6);

const page9 = review.pages.find(p => p.pageNumber === 9)!;
assert.equal(page9.footnote, '12A');
assert.equal(page9.author, 'Accounting Policy Team');
assert.equal(page9.narrativeIntent, 'ACCOUNTING_POLICY');
assert.equal(page9.contextOrigins.footnote, 8);

const page11 = review.pages.find(p => p.pageNumber === 11)!;
assert.equal(page11.period, 'FY 2027 OUTLOOK');
assert.equal(page11.speaker, 'CFO Aaron Kim');
assert.equal(page11.narrativeIntent, 'HYPOTHETICAL_RISK');
assert.equal(page11.contextOrigins.speaker, 10);

const keywordOnly = selectLongDocumentEvidence(review, { term: 'revenue' });
assert.ok(keywordOnly.length >= 10, `expected broad keyword collisions, got ${keywordOnly.length}`);
const statement = selectLongDocumentEvidence(review, { term: 'revenue', entity: 'Alpha Holdings Inc.', period: 'FY 2026', sectionContains: 'Consolidated Statement of Operations', narrativeIntent: 'REPORTED_FINANCIAL_STATEMENT' });
assert.deepEqual(statement.map(p => p.pageNumber), [4, 5]);
const beta = selectLongDocumentEvidence(review, { term: 'revenue', entity: 'Beta Subsidiary LLC', period: 'FY 2025', sectionContains: 'Subsidiary Revenue', narrativeIntent: 'REPORTED_NOTE' });
assert.deepEqual(beta.map(p => p.pageNumber), [6, 7]);
const footnote = selectLongDocumentEvidence(review, { term: 'revenue', entity: 'Alpha Holdings Inc.', period: 'FY 2026', footnote: '12A', narrativeIntent: 'ACCOUNTING_POLICY', attributionContains: 'Accounting Policy Team' });
assert.deepEqual(footnote.map(p => p.pageNumber), [8, 9]);
const risk = selectLongDocumentEvidence(review, { term: 'revenue', entity: 'Alpha Holdings Inc.', period: 'FY 2027 OUTLOOK', sectionContains: 'Risk Factors', narrativeIntent: 'HYPOTHETICAL_RISK', attributionContains: 'Aaron Kim' });
assert.deepEqual(risk.map(p => p.pageNumber), [10, 11]);
const impossible = selectLongDocumentEvidence(review, { term: 'revenue', entity: 'Beta Subsidiary LLC', period: 'FY 2025', footnote: '12A', narrativeIntent: 'ACCOUNTING_POLICY' });
assert.equal(impossible.length, 0);

fs.writeFileSync(path.join(dir, 'source-semantic-truth.json'), JSON.stringify({
  marker: 'P2_LONG_DOCUMENT_SEMANTIC_SOURCE_TRUTH=PASS',
  sourceSha256: review.sourceSha256,
  review,
  selections: {
    keywordOnly: keywordOnly.map(p => p.pageNumber),
    statement: statement.map(p => p.pageNumber),
    beta: beta.map(p => p.pageNumber),
    footnote: footnote.map(p => p.pageNumber),
    risk: risk.map(p => p.pageNumber),
    impossible: impossible.map(p => p.pageNumber),
  },
}, null, 2));
console.log('P2_LONG_DOCUMENT_SEMANTIC_SOURCE_TRUTH=PASS');
