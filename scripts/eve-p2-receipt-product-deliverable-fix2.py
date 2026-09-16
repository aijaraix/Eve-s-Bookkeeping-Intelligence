from pathlib import Path
p=Path('server/tests/receiptDeliverableTruth.test.ts')
text=p.read_text()
old="import * as XLSX from 'xlsx';"
new="import * as XLSXModule from 'xlsx';\nconst XLSX: any = (XLSXModule as any).default || XLSXModule;"
if old not in text: raise SystemExit('XLSX_IMPORT_SNIPPET_MISSING')
p.write_text(text.replace(old,new,1))
print('RECEIPT_XLSX_READBACK_FIX_APPLIED')
