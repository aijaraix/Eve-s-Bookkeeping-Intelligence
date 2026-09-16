import assert from 'node:assert/strict';
import { interpretInvoiceAp, buildInvoiceApFiveDimensionChecks } from '../cpaOrganization/invoiceApInterpretationEngine.js';
import { buildInvoiceOcrComposite, INVOICE_SHA256 } from './fixtures/invoiceApFiveDimensionFixture.js';

const invoice = interpretInvoiceAp(buildInvoiceOcrComposite());
assert.equal(invoice.sourceSha256, INVOICE_SHA256);
assert.equal(invoice.vendor.value, 'SYNTHETIC OFFICE SUPPLY CO.');
assert.equal(invoice.invoiceNumber.value, 'INV-260916-1042');
assert.equal(invoice.invoiceDate.value, '09/16/2026');
assert.equal(invoice.dueDate.value, '10/16/2026');
assert.equal(invoice.billTo.value, 'EVE ACADEMY TEST CLIENT');
assert.equal(invoice.purchaseOrderReference.value, 'PO-EVE-1001');
assert.equal(invoice.currency.value, 'USD');
assert.equal(invoice.lineItems.value?.length, 3);
assert.deepEqual(invoice.lineItems.value?.map(i => i.lineTotal), [70,60,45]);
assert.equal(invoice.subtotal.value, 175);
assert.equal(invoice.salesTax.value, 12.25);
assert.equal(invoice.totalDue.value, 187.25);
assert.equal(invoice.semanticAdjudication.rawLabelDisagreement, true);
assert.deepEqual(invoice.semanticAdjudication.rawLabelTexts, ['INV0ICE INV-260916-1042','INVOICE INV-260916-1042']);
assert.equal(invoice.semanticAdjudication.status, 'RESOLVED_FIELD_CONSENSUS');
assert.equal(invoice.semanticAdjudication.unresolvedRequiredFields.length, 0);
assert.equal(invoice.reconciliation.status, 'PASS');
assert.equal(invoice.reconciliation.lineItemExtensionsPass, true);
assert.equal(invoice.reconciliation.lineItemsToSubtotalPass, true);
assert.equal(invoice.reconciliation.subtotalPlusTaxToTotalPass, true);
assert.equal(invoice.reconciliation.lineItemSum, 175);
assert.equal(invoice.reconciliation.expectedTotal, 187.25);
assert.equal(invoice.reconciliation.variance, 0);
assert.equal(invoice.apControl.payableCandidateAmount, 187.25);
assert.equal(invoice.apControl.payableCandidateCurrency, 'USD');
assert.equal(invoice.apControl.payableCandidateStatus, 'SUPPORTED_CANDIDATE');
assert.equal(invoice.apControl.threeWayMatchStatus, 'NOT_TESTABLE');
assert.equal(invoice.apControl.independentPurchaseOrderVerified, false);
assert.equal(invoice.apControl.receivingEvidenceVerified, false);
assert.equal(invoice.apControl.approvalEvidenceVerified, false);
assert.equal(invoice.apControl.approvalStatus, 'REVIEW_REQUIRED');
assert.equal(invoice.apControl.paymentEligibility, 'BLOCKED');
assert.equal(invoice.apControl.paymentStatus, 'UNKNOWN');
assert.equal(invoice.apControl.postingStatus, 'NOT_POSTED');
assert.equal(invoice.apControl.debitAccountClassification, 'REVIEW_REQUIRED');
assert.ok(invoice.duplicateCandidateFingerprint);

const checks = buildInvoiceApFiveDimensionChecks(invoice);
for (const check of [...checks.source, ...checks.semantic, ...checks.accounting]) {
  assert.equal(check.outcome, 'PASS', `${check.checkId} must pass`);
  assert.ok((check.evidenceRefs || []).length > 0, `${check.checkId} requires evidence refs`);
}

const conflict = buildInvoiceOcrComposite();
const doctr = conflict.attempts.find(a => a.engine === 'doctr')!.result!;
doctr.pages[0].regions.find(r => r.regionId === 'p1-r11')!.text = 'TOTAL DUE $197.25';
const conflicted = interpretInvoiceAp(conflict);
assert.equal(conflicted.totalDue.status, 'CONFLICT');
assert.equal(conflicted.semanticAdjudication.status, 'REVIEW_REQUIRED');
assert.equal(conflicted.reconciliation.status, 'FAIL');
assert.equal(conflicted.apControl.payableCandidateStatus, 'REVIEW_REQUIRED');
assert.ok(buildInvoiceApFiveDimensionChecks(conflicted).semantic.some(c => c.outcome === 'FAIL'));
assert.ok(buildInvoiceApFiveDimensionChecks(conflicted).accounting.some(c => c.outcome === 'FAIL'));

console.log('INVOICE_AP_INTERPRETATION_ENGINE_TESTS=PASS');
