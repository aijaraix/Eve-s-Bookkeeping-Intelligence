from pathlib import Path
p=Path('server/tests/receiptProductTruthBrowser.test.ts')
text=p.read_text()
old="  assert.equal(cell.metric, 'operating_expenses');"
new="  assert.equal(cell.metric, 'selling_general_and_administrative', 'presentation adapter intentionally canonicalizes operating_expenses into the SGA statement line');"
if old not in text: raise SystemExit('BROWSER_METRIC_ASSERTION_MISSING')
p.write_text(text.replace(old,new,1))
print('RECEIPT_BROWSER_CANONICAL_METRIC_FIX_APPLIED')
