import React from 'react';

const list = (value: any[]) => value?.length ? value.join(', ') : 'None';
const money = (value: any, currency?: string) => typeof value === 'number' ? `${currency || 'UNSPECIFIED'} ${value.toFixed(2)}` : 'Not recorded';

export const BankStatementCompletenessPanel: React.FC<{ review?: any }> = ({ review }) => {
  if (!review) return null;
  const s = review.summary || {};
  const endingState = review.endingBalanceDecision?.conclusionAssessments?.find((r:any)=>r.conclusionId==='ending-cash')?.state || 'NOT_RECORDED';
  const txnState = review.transactionPopulationDecision?.conclusionAssessments?.find((r:any)=>r.conclusionId==='complete-transaction-population')?.state || 'NOT_RECORDED';
  return <section className="border rounded-xl p-4 space-y-4" data-eve-bank-completeness="true" data-eve-bank-reconciliation={s.reconciliationStatus} data-eve-bank-ending-state={endingState} data-eve-bank-transaction-state={txnState}>
    <div><h2 className="font-semibold">Bank statement completeness review</h2><p className="text-sm">Source completeness and task sufficiency are evaluated separately. A missing page is never erased merely because one scoped conclusion may proceed.</p></div>
    <div className="grid md:grid-cols-2 gap-3 text-sm">
      <div className="border rounded-lg p-3"><strong>Page inventory</strong><p>Expected logical pages: {review.expectedLogicalPageCount}</p><p>Observed logical pages: {list(review.observedLogicalPages)}</p><p>Missing logical pages: {list(review.missingLogicalPages)}</p><p>Physical pages supplied: {review.physicalPageCount}</p></div>
      <div className="border rounded-lg p-3"><strong>Bank arithmetic</strong><p>Beginning balance: {money(s.beginningBalance,s.currency)}</p><p>Deposits: {money(s.totalDeposits,s.currency)}</p><p>Withdrawals: {money(s.totalWithdrawals,s.currency)}</p><p>Calculated ending: {money(s.calculatedEndingBalance,s.currency)}</p><p>Reported ending: {money(s.endingBalance,s.currency)}</p><p>Variance: {money(s.variance,s.currency)}</p><p>Reconciliation: {s.reconciliationStatus}</p></div>
    </div>
    <div className="border rounded-lg p-3 text-sm"><strong>Scoped conclusions</strong><p>Ending cash conclusion: {endingState}</p><p>Complete transaction population: {txnState}</p><p>Ending balance action: {review.endingBalanceDecision?.recommendedAction}</p><p>Transaction population action: {review.transactionPopulationDecision?.recommendedAction}</p><p>Clarification required: {review.clarificationRecommended ? 'YES' : 'NO'}</p></div>
    <div className="space-y-2 text-sm"><strong>Persisted source gaps</strong>{(review.gaps || []).length ? (review.gaps || []).map((gap:any)=><article key={gap.gapId} className="border rounded-lg p-3"><p>{gap.location} · {gap.gapType} · {gap.explicitMateriality || 'UNKNOWN'}</p><p>{gap.description}</p><p>Evidence: {(gap.evidenceRefs || []).join(', ') || 'Not recorded'}</p></article>) : <p>No known page gap was detected.</p>}</div>
    <p className="text-xs break-all">Source SHA-256: {review.sourceSha256 || 'Not recorded'}</p>
  </section>;
};
