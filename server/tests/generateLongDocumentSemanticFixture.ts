import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const outDir = process.env.LONG_DOCUMENT_ACCEPTANCE_DIR || '/tmp/eve-long-document-semantic';
fs.mkdirSync(outDir, { recursive: true });
const fixedDate = new Date('2026-09-16T00:00:00.000Z');

const pages = [
  [
    'SECTION: Document Cover and Scope',
    'ENTITY: Alpha Holdings Inc.',
    'PERIOD: FY 2026',
    'AUTHOR: Corporate Secretary',
    'INTENT: DOCUMENT_METADATA',
    'Revenue appears throughout this synthetic long-document fixture by design.',
  ],
  [
    'SECTION: Management Discussion and Outlook',
    'ENTITY: Alpha Holdings Inc.',
    'PERIOD: FY 2026',
    'SPEAKER: CEO Maya Levin',
    'INTENT: FORWARD_LOOKING_COMMENTARY',
    'Revenue growth is targeted for future periods; this is management outlook, not reported revenue.',
  ],
  [
    'Revenue target commentary continues here without repeating the section markers.',
    'Management discusses potential customer expansion and future demand.',
  ],
  [
    'SECTION: Consolidated Statement of Operations',
    'ENTITY: Alpha Holdings Inc.',
    'PERIOD: FY 2026',
    'AUTHOR: Finance Team',
    'INTENT: REPORTED_FINANCIAL_STATEMENT',
    'Revenue USD 120.0 million was reported for FY 2026.',
  ],
  [
    'Revenue USD 120.0 million remains the reported consolidated figure on this continuation page.',
    'Operating expense USD 82.0 million.',
  ],
  [
    'SECTION: Note 7 - Subsidiary Revenue',
    'ENTITY: Beta Subsidiary LLC',
    'PERIOD: FY 2025',
    'AUTHOR: Controller Daniel Ortiz',
    'INTENT: REPORTED_NOTE',
    'Revenue USD 44.0 million relates to Beta Subsidiary LLC for FY 2025.',
  ],
  [
    'Revenue USD 44.0 million is repeated on the continuation of Note 7 for Beta Subsidiary LLC.',
    'This page intentionally omits repeated entity and period markers.',
  ],
  [
    'SECTION: Note 12 - Revenue Recognition',
    'ENTITY: Alpha Holdings Inc.',
    'PERIOD: FY 2026',
    'AUTHOR: Accounting Policy Team',
    'FOOTNOTE: 12A',
    'INTENT: ACCOUNTING_POLICY',
    'Revenue is recognized when control transfers under the stated accounting policy.',
  ],
  [
    'Revenue recognition policy continues under footnote 12A without repeating markers.',
    'The policy text is not itself a reported revenue amount.',
  ],
  [
    'SECTION: Risk Factors',
    'ENTITY: Alpha Holdings Inc.',
    'PERIOD: FY 2027 OUTLOOK',
    'SPEAKER: CFO Aaron Kim',
    'INTENT: HYPOTHETICAL_RISK',
    'Revenue could decline if market conditions deteriorate; this is hypothetical risk language.',
  ],
  [
    'Revenue could also be affected by foreign exchange and supplier disruptions.',
    'This continuation page inherits the FY 2027 outlook risk context.',
  ],
  [
    'SECTION: Non-GAAP Appendix',
    'ENTITY: Alpha Holdings Inc.',
    'PERIOD: FY 2026',
    'AUTHOR: Investor Relations',
    'INTENT: NON_GAAP_SUPPLEMENTAL',
    'Adjusted revenue is shown for supplemental discussion and is not substituted for reported GAAP revenue.',
  ],
];

async function render(): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle('Eve Academy Long Document Semantic Context Fixture');
  pdf.setAuthor('Eve Academy');
  pdf.setSubject('Synthetic long-document semantic context acceptance');
  pdf.setCreator('Eve Academy deterministic fixture');
  pdf.setProducer('Eve Academy deterministic fixture');
  pdf.setCreationDate(fixedDate);
  pdf.setModificationDate(fixedDate);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (let index = 0; index < pages.length; index += 1) {
    const page = pdf.addPage([612, 792]);
    page.drawText(`EVE ACADEMY SYNTHETIC LONG DOCUMENT - PAGE ${index + 1}`, { x: 50, y: 742, size: 11, font: bold });
    let y = 700;
    for (const line of pages[index]) {
      page.drawText(line, { x: 50, y, size: 10, font, maxWidth: 512 });
      y -= 28;
    }
  }
  return Buffer.from(await pdf.save({ useObjectStreams: false }));
}

const first = await render();
const second = await render();
assert.equal(crypto.createHash('sha256').update(first).digest('hex'), crypto.createHash('sha256').update(second).digest('hex'), 'fixture PDF must be byte reproducible within the pinned generator');
const sha256 = crypto.createHash('sha256').update(first).digest('hex');
const pdfPath = path.join(outDir, 'long-document-semantic-context.pdf');
fs.writeFileSync(pdfPath, first);
const manifest = { marker: 'LONG_DOCUMENT_SEMANTIC_FIXTURE=PASS', filename: path.basename(pdfPath), sha256, bytes: first.length, pageCount: pages.length };
fs.writeFileSync(path.join(outDir, 'fixture-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('LONG_DOCUMENT_SEMANTIC_FIXTURE=PASS');
console.log(JSON.stringify(manifest));
