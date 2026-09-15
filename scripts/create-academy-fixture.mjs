import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const output = process.argv[2];
if (!output) throw new Error('Provide an output PDF path.');
const pdf = await PDFDocument.create();
pdf.setTitle('Eve Academy Synthetic Company FY2024');
pdf.setCreationDate(new Date('2025-01-01T00:00:00Z'));
pdf.setModificationDate(new Date('2025-01-01T00:00:00Z'));
const font = await pdf.embedFont(StandardFonts.Helvetica);
const page = pdf.addPage([612, 792]);
const lines = [
  'EVE ACADEMY SYNTHETIC COMPANY',
  'Isolated training fixture. Not a real customer or audited financial report.',
  'Financial statements for the year ended December 31, 2024',
  'Reporting currency: USD. All amounts below are in dollars, not thousands.',
  '', 'INCOME STATEMENT - FY2024',
  'Revenue: USD 1,200,000', 'Cost of Sales: USD 600,000',
  'Research and Development: USD 100,000',
  'Selling, Informational and Administrative Expenses: USD 150,000',
  'Other expenses and income taxes, net: USD 170,000',
  'Net income attributable to common shareholders: USD 180,000',
  '', 'BALANCE SHEET - DECEMBER 31, 2024',
  'Total assets: USD 2,000,000', 'Total liabilities: USD 800,000',
  'Total stockholders equity: USD 1,200,000',
  '', 'Notes: No operating-income subtotal is presented in this fixture.',
  'No auditor opinion, professional approval or certification is provided.'
];
lines.forEach((text, index) => page.drawText(text, { x: 40, y: 745 - index * 29, size: index === 0 ? 16 : 10, font }));
fs.mkdirSync(path.dirname(output), { recursive: true });
const bytes = Buffer.from(await pdf.save());
fs.writeFileSync(output, bytes);
console.log(JSON.stringify({ file: output, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), expectedMetrics: {
  'financials-income': { revenue: 1200000, net_income: 180000 },
  'financials-balance': { total_assets: 2000000, total_liabilities: 800000, total_equity: 1200000 }
} }));
