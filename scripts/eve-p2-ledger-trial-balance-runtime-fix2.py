from pathlib import Path
p=Path('scripts/eve-p2-ledger-trial-balance-runtime-apply.py')
t=p.read_text()
early='"    try {\\n      const trialBalanceRuntime = await deriveContinuationTrialBalanceEvidence(job, document);\\n      base.trialBalanceQualification = trialBalanceRuntime.qualification;\\n      base.trialBalanceReview = trialBalanceRuntime.review;\\n      const allFacts = Array.isArray(db?.facts) ? db.facts : [];"'
plain='"    try {\\n      const allFacts = Array.isArray(db?.facts) ? db.facts : [];"'
if early not in t: raise SystemExit('TRIAL_BALANCE_EARLY_CONTINUATION_TARGET_MISSING')
t=t.replace(early,plain,1)
anchor="""replace_once('server/cpaOrganization/verifiedCustomerContinuationService.ts',
\"    try {\\n      const allFacts = Array.isArray(db?.facts) ? db.facts : [];\",
\"    try {\\n      const allFacts = Array.isArray(db?.facts) ? db.facts : [];\")
"""
if anchor not in t: raise SystemExit('TRIAL_BALANCE_PLAIN_CONTINUATION_ANCHOR_MISSING')
insert="""replace_once('server/cpaOrganization/verifiedCustomerContinuationService.ts',
\"      const document = (db?.documents || []).find((d: any) => d.id === job.documentId);\\n      const clientName = String(\",
\"      const document = (db?.documents || []).find((d: any) => d.id === job.documentId);\\n      const trialBalanceRuntime = await deriveContinuationTrialBalanceEvidence(job, document);\\n      base.trialBalanceQualification = trialBalanceRuntime.qualification;\\n      base.trialBalanceReview = trialBalanceRuntime.review;\\n      const clientName = String(\")
"""
t=t.replace(anchor,anchor+insert,1)
p.write_text(t)
print('TRIAL_BALANCE_CONTINUATION_INITIALIZATION_ORDER_FIX=PASS')
