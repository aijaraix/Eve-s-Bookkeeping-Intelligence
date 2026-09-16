from pathlib import Path
p=Path('server/tests/bankStatementCompletenessAdapter.test.ts')
text=p.read_text()
old="assert.deepEqual(unknown.assessment.endingBalanceDecision.reviewRequiredConclusionIds,['ending-cash']); assert.deepEqual(unknown.assessment.transactionPopulationDecision.reviewRequiredConclusionIds,['complete-transaction-population']); assert.equal(unknown.assessment.endingBalanceDecision.recommendedAction,'REVIEW_MATERIALITY');"
new="assert.deepEqual(unknown.assessment.endingBalanceDecision.reviewRequiredConclusionIds,['ending-cash']); assert.deepEqual(unknown.assessment.transactionPopulationDecision.blockedConclusionIds,['complete-transaction-population'],'a complete-population conclusion must fail closed when an unknown missing page may contain population members'); assert.equal(unknown.assessment.endingBalanceDecision.recommendedAction,'REVIEW_MATERIALITY'); assert.equal(unknown.assessment.transactionPopulationDecision.recommendedAction,'REQUEST_ADDITIONAL_EVIDENCE');"
if old not in text: raise SystemExit('UNKNOWN_EXPECTATION_SNIPPET_MISSING')
text=text.replace(old,new,1)
text=text.replace("transactions:unknown.assessment.transactionPopulationDecision.reviewRequiredConclusionIds","transactionsBlocked:unknown.assessment.transactionPopulationDecision.blockedConclusionIds",1)
p.write_text(text)
print('BANK_UNKNOWN_COMPLETE_POPULATION_EXPECTATION_FIXED')
