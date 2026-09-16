import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export type BankFixtureVariant = 'complete' | 'missing-disclosure' | 'missing-transactions' | 'missing-unknown';
export const BANK_WORKSPACE_ID='ws-academy-bank-completeness';
export const BANK_ENGAGEMENT_ID='eng-academy-bank-completeness';
export function bankEvidenceDir(): string { return process.env.BANK_STATEMENT_ACCEPTANCE_EVIDENCE_DIR || '/tmp/eve-bank-statement-five-dimension'; }

const PAGES: Record<BankFixtureVariant, Array<{ logical:number; total:number; lines:string[] }>> = {
  complete: [
    {logical:1,total:4,lines:['EVE ACADEMY BANK','BANK STATEMENT','ACCOUNT ****4242','STATEMENT PERIOD 09/01/2026 - 09/30/2026','CURRENCY USD','Beginning Balance $1,000.00']},
    {logical:2,total:4,lines:['TRANSACTION ACTIVITY','09/02/2026 CLIENT PAYMENT 500.00 1,500.00','09/05/2026 OFFICE RENT -300.00 1,200.00']},
    {logical:3,total:4,lines:['TRANSACTION ACTIVITY CONTINUED','09/10/2026 SOFTWARE -100.00 1,100.00','09/15/2026 REFUND 50.00 1,150.00','Ending Balance $1,150.00','END OF TRANSACTION ACTIVITY']},
    {logical:4,total:4,lines:['TERMS AND DISCLOSURES','Electronic statements are provided for recordkeeping.','Privacy and service disclosures.']},
  ],
  'missing-disclosure': [
    {logical:1,total:4,lines:['EVE ACADEMY BANK','BANK STATEMENT','ACCOUNT ****4242','STATEMENT PERIOD 09/01/2026 - 09/30/2026','CURRENCY USD','Beginning Balance $1,000.00']},
    {logical:2,total:4,lines:['TRANSACTION ACTIVITY','09/02/2026 CLIENT PAYMENT 500.00 1,500.00','09/05/2026 OFFICE RENT -300.00 1,200.00']},
    {logical:3,total:4,lines:['TRANSACTION ACTIVITY CONTINUED','09/10/2026 SOFTWARE -100.00 1,100.00','09/15/2026 REFUND 50.00 1,150.00','Ending Balance $1,150.00','END OF TRANSACTION ACTIVITY']},
  ],
  'missing-transactions': [
    {logical:1,total:4,lines:['EVE ACADEMY BANK','BANK STATEMENT','ACCOUNT ****4242','STATEMENT PERIOD 09/01/2026 - 09/30/2026','CURRENCY USD','Beginning Balance $1,000.00']},
    {logical:3,total:4,lines:['TRANSACTION ACTIVITY CONTINUED','09/10/2026 SOFTWARE -100.00 1,100.00','09/15/2026 REFUND 50.00 1,150.00','Ending Balance $1,150.00','END OF TRANSACTION ACTIVITY']},
    {logical:4,total:4,lines:['TERMS AND DISCLOSURES','Electronic statements are provided for recordkeeping.','Privacy and service disclosures.']},
  ],
  'missing-unknown': [
    {logical:1,total:3,lines:['EVE ACADEMY BANK','BANK STATEMENT','ACCOUNT ****4242','STATEMENT PERIOD 09/01/2026 - 09/30/2026','CURRENCY USD','Beginning Balance $1,000.00','09/01/2026 OPENING CREDIT 100.00 1,100.00','Ending Balance $1,100.00']},
    {logical:3,total:3,lines:['ADDITIONAL INFORMATION','Contact the bank for questions about this statement.']},
  ],
};

export async function buildBankStatementPdf(variant: BankFixtureVariant): Promise<Buffer> {
  const doc=await PDFDocument.create();
  doc.setTitle(`Eve Academy Bank Statement ${variant}`); doc.setAuthor('Eve Academy'); doc.setCreator('Eve Academy Fixture Generator'); doc.setProducer('Eve Academy Fixture Generator');
  const fixed=new Date('2026-09-16T00:00:00.000Z'); doc.setCreationDate(fixed); doc.setModificationDate(fixed);
  const font=await doc.embedFont(StandardFonts.Helvetica); const bold=await doc.embedFont(StandardFonts.HelveticaBold);
  for(const spec of PAGES[variant]){ const page=doc.addPage([612,792]); let y=735;
    for(const [i,line] of spec.lines.entries()){ page.drawText(line,{x:54,y,size:i===0?14:11,font:i===0?bold:font}); y-=28; }
    page.drawText(`Page ${spec.logical} of ${spec.total}`,{x:270,y:35,size:9,font});
  }
  return Buffer.from(await doc.save({useObjectStreams:false}));
}
export function sha256(bytes: Buffer): string { return crypto.createHash('sha256').update(bytes).digest('hex'); }
export function fixturePath(variant: BankFixtureVariant): string { return path.join(bankEvidenceDir(),`bank-${variant}.pdf`); }
export function fixtureManifestPath(): string { return path.join(bankEvidenceDir(),'bank-fixture-manifest.json'); }
export function loadBankStatementPdf(variant: BankFixtureVariant): Buffer { return fs.readFileSync(fixturePath(variant)); }
