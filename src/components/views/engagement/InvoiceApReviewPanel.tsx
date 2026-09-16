import React from 'react';

function value(field: any): string {
  const v = field?.value;
  if (v === null || v === undefined || v === '') return 'Not recorded';
  return String(v);
}

function money(v: any, currency?: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return 'Not recorded';
  return `${currency || ''} ${n.toFixed(2)}`.trim();
}

export const InvoiceApReviewPanel: React.FC<{ invoices: any[] }> = ({ invoices }) => {
  if (!Array.isArray(invoices) || invoices.length === 0) return null;
  return <section className="space-y-3" aria-label="Accounts payable invoice review">
    <h2 className="font-semibold">Accounts payable invoice review</h2>
    {invoices.map((invoice: any, index: number) => {
      const number = value(invoice.invoiceNumber);
      const currency = value(invoice.currency) === 'Not recorded' ? '' : value(invoice.currency);
      return <article key={`${number}-${index}`} data-eve-ap-invoice-id={number} data-eve-ap-approval-status={invoice.apControl?.approvalStatus}
        data-eve-ap-payment-eligibility={invoice.apControl?.paymentEligibility} data-eve-ap-three-way-match={invoice.apControl?.threeWayMatchStatus}
        className="border rounded-xl p-4 space-y-3 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 className="font-semibold">{value(invoice.vendor)}</h3><p className="font-mono text-sm">Invoice {number}</p></div>
          <div className="text-right text-sm"><p className="font-semibold">Total due: {money(invoice.totalDue?.value, currency)}</p><p>Due: {value(invoice.dueDate)}</p></div>
        </div>
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          <p>Invoice date: <strong>{value(invoice.invoiceDate)}</strong></p>
          <p>Bill to: <strong>{value(invoice.billTo)}</strong></p>
          <p>PO reference on invoice: <strong>{value(invoice.purchaseOrderReference)}</strong></p>
          <p>Currency: <strong>{value(invoice.currency)}</strong></p>
          <p>Subtotal: <strong>{money(invoice.subtotal?.value, currency)}</strong></p>
          <p>Sales tax: <strong>{money(invoice.salesTax?.value, currency)}</strong></p>
        </div>
        <div className="border rounded-lg p-3 text-sm space-y-1">
          <p><strong>Arithmetic reconciliation:</strong> {invoice.reconciliation?.status || 'Not measured'}</p>
          <p><strong>Payable candidate:</strong> {money(invoice.apControl?.payableCandidateAmount, invoice.apControl?.payableCandidateCurrency)} · {invoice.apControl?.payableCandidateStatus}</p>
          <p><strong>Three-way match:</strong> {invoice.apControl?.threeWayMatchStatus}</p>
          <p><strong>Independent purchase-order record:</strong> {invoice.apControl?.independentPurchaseOrderVerified ? 'VERIFIED' : 'NOT PROVIDED'}</p>
          <p><strong>Receiving evidence:</strong> {invoice.apControl?.receivingEvidenceVerified ? 'VERIFIED' : 'NOT PROVIDED'}</p>
          <p><strong>Approval:</strong> {invoice.apControl?.approvalStatus}</p>
          <p><strong>Payment eligibility:</strong> {invoice.apControl?.paymentEligibility}</p>
          <p><strong>Payment status:</strong> {invoice.apControl?.paymentStatus}</p>
          <p><strong>Posting:</strong> {invoice.apControl?.postingStatus}</p>
          <p><strong>Debit account classification:</strong> {invoice.apControl?.debitAccountClassification}</p>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 font-semibold text-sm">Invoice line items</div>
          {(invoice.lineItems?.value || []).map((item: any, itemIndex: number) => <div key={itemIndex} className="px-3 py-2 border-t text-sm flex justify-between gap-3">
            <span>{item.description} · {item.quantity} × {money(item.unitPrice, currency)}</span><strong>{money(item.lineTotal, currency)}</strong>
          </div>)}
        </div>
        <p className="text-xs text-amber-800">The invoice-stated PO reference is not an independently verified purchase order. No receiving record, approval, payment, or ledger posting is inferred from this invoice.</p>
        <p className="text-xs">OCR adjudication: <strong>{invoice.semanticAdjudication?.status}</strong>. Raw label evidence preserved: {(invoice.semanticAdjudication?.rawLabelTexts || []).join(' | ') || 'no disagreement'}.</p>
        <details data-eve-ap-lineage="true" className="text-xs border rounded-lg p-3">
          <summary className="cursor-pointer font-semibold">Source lineage and evidence references</summary>
          <p className="break-all mt-2">Source SHA-256: {invoice.sourceSha256}</p>
          <p className="break-all">Evidence refs: {(invoice.evidenceRefs || []).join(' ; ')}</p>
          <p>Invoice-number refs: {(invoice.invoiceNumber?.evidenceRefs || []).join(' ; ')}</p>
          <p>Total-due refs: {(invoice.totalDue?.evidenceRefs || []).join(' ; ')}</p>
        </details>
      </article>;
    })}
  </section>;
};
