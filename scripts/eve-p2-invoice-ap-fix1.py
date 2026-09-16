from pathlib import Path

p = Path('server/cpaOrganization/invoiceApInterpretationEngine.ts')
text = p.read_text()
old = """  const items = lineItems.value || [];
  const lineItemExtensionsPass = items.length > 0 && items.every(item => closeMoney(item.quantity * item.unitPrice, item.lineTotal));
  const lineItemSum = items.length ? items.reduce((sum, item) => sum + item.lineTotal, 0) : null;
  const lineItemsToSubtotalPass = lineItemSum !== null && subtotal.value !== null && closeMoney(lineItemSum, subtotal.value);
  const expectedTotal = subtotal.value !== null && salesTax.value !== null ? subtotal.value + salesTax.value : null;
  const subtotalPlusTaxToTotalPass = expectedTotal !== null && totalDue.value !== null && closeMoney(expectedTotal, totalDue.value);
  const variance = expectedTotal !== null && totalDue.value !== null ? totalDue.value - expectedTotal : null;
  const reconciliationStatus: InvoiceReconciliationStatus = lineItemExtensionsPass && lineItemsToSubtotalPass && subtotalPlusTaxToTotalPass ? 'PASS' : 'FAIL';
"""
new = """  const items = lineItems.value || [];
  // Accounting reconciliation may not PASS by silently using one engine's value
  // when any material numeric field remains missing or conflicted across OCR engines.
  const lineItemExtensionsPass = lineItems.status === 'CONSENSUS' && items.length > 0 &&
    items.every(item => closeMoney(item.quantity * item.unitPrice, item.lineTotal));
  const lineItemSum = items.length ? items.reduce((sum, item) => sum + item.lineTotal, 0) : null;
  const lineItemsToSubtotalPass = lineItems.status === 'CONSENSUS' && subtotal.status === 'CONSENSUS' &&
    lineItemSum !== null && subtotal.value !== null && closeMoney(lineItemSum, subtotal.value);
  const expectedTotal = subtotal.value !== null && salesTax.value !== null ? subtotal.value + salesTax.value : null;
  const subtotalPlusTaxToTotalPass = subtotal.status === 'CONSENSUS' && salesTax.status === 'CONSENSUS' && totalDue.status === 'CONSENSUS' &&
    expectedTotal !== null && totalDue.value !== null && closeMoney(expectedTotal, totalDue.value);
  const variance = expectedTotal !== null && totalDue.value !== null ? totalDue.value - expectedTotal : null;
  const accountingFieldsConsensus = lineItems.status === 'CONSENSUS' && subtotal.status === 'CONSENSUS' &&
    salesTax.status === 'CONSENSUS' && totalDue.status === 'CONSENSUS';
  const reconciliationStatus: InvoiceReconciliationStatus = accountingFieldsConsensus && lineItemExtensionsPass &&
    lineItemsToSubtotalPass && subtotalPlusTaxToTotalPass ? 'PASS' : 'FAIL';
"""
if old not in text:
    raise SystemExit('INVOICE_AP_RECONCILIATION_SNIPPET_MISSING')
p.write_text(text.replace(old, new, 1))
print('INVOICE_AP_FAIL_CLOSED_RECONCILIATION_FIX_APPLIED')
