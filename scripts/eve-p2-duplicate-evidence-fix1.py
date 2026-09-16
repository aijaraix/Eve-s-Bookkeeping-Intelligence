from pathlib import Path
p=Path('server/tests/fixtures/duplicateEvidenceAcceptanceHelpers.ts')
s=p.read_text()
old="const pdfFields=(text:string)=>{const grab=(r:RegExp)=>{const m=text.match(r);if(!m)throw new Error(`PDF_FIELD_MISSING:${r}`);return m[1].trim();};return {identity:{documentType:'RECEIPT',issuer:grab(/ISSUER\\s+(.+)/),documentNumber:grab(/RECEIPT\\s+(.+)/),documentDate:grab(/DATE\\s+(.+)/),currency:grab(/CURRENCY\\s+([A-Z]{3})/)},material:{subtotal:Number(grab(/SUBTOTAL USD\\s+([0-9.]+)/)),salesTax:Number(grab(/SALES TAX USD\\s+([0-9.]+)/)),total:Number(grab(/TOTAL USD\\s+([0-9.]+)/)),paymentAmount:Number(grab(/PAYMENT USD\\s+([0-9.]+)/))}};};"
new="const pdfFields=(text:string)=>{const grab=(label:string)=>{const line=text.split(/\\r?\\n/).map(x=>x.trim()).find(x=>x.startsWith(label+' '));if(!line)throw new Error(`PDF_FIELD_MISSING:${label}`);return line.slice(label.length).trim();};return {identity:{documentType:'RECEIPT',issuer:grab('ISSUER'),documentNumber:grab('RECEIPT'),documentDate:grab('DATE'),currency:grab('CURRENCY')},material:{subtotal:Number(grab('SUBTOTAL USD')),salesTax:Number(grab('SALES TAX USD')),total:Number(grab('TOTAL USD')),paymentAmount:Number(grab('PAYMENT USD'))}};};"
if old not in s: raise SystemExit('PDF_FIELDS_ANCHOR_NOT_FOUND')
p.write_text(s.replace(old,new,1))
print('DUPLICATE_PDF_LINE_LABEL_FIX=PASS')
