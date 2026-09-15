import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { AnyDocParser } from '../../src/lib/parser/anydocParser';
import { EvidenceCrossCheckEngine } from '../hybridExtraction/EvidenceCrossCheckEngine';

const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
pdf.addPage().drawText('Revenue: USD 1,200,000', { x: 40, y: 700, font });
pdf.addPage().drawText('Total assets: USD 2,000,000', { x: 40, y: 700, font });
const parsed = await new AnyDocParser().parse({ filename: 'synthetic.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
assert.equal(parsed.pageManifests.length, 2);
assert.equal(parsed.sourceBlocks.length, 2);
assert(parsed.sourceBlocks[0].raw_text.includes('Revenue: USD 1,200,000'));
assert(!parsed.sourceBlocks[0].raw_text.includes('%PDF-'));
const candidate: any = { physicalPage: 1, rowLabel: 'Revenue', rawValue: '1200000', sourceQuote: 'Revenue: USD 1,200,000', confidence: 0.99 };
assert.equal(EvidenceCrossCheckEngine.verifyCandidateAgainstSource(candidate, parsed.pageManifests, parsed.sourceBlocks).evidenceStatus, 'CONFIRMED');
assert.notEqual(EvidenceCrossCheckEngine.verifyCandidateAgainstSource({ ...candidate, physicalPage: 2 }, parsed.pageManifests, parsed.sourceBlocks).evidenceStatus, 'CONFIRMED');
await assert.rejects(new AnyDocParser().parse({ filename: 'broken.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-INVALID BINARY') }));
console.log('PASS: real PDF native text, physical page isolation and invalid-PDF fail-closed evidence.');
