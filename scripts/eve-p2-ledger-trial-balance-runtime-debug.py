from pathlib import Path
p=Path('server/tests/academySpecialistRetry.test.ts')
t=p.read_text()
old="  assert.equal((await service.continueCompletedHybridJob(job, db))?.status, 'AWAITING_UI_DRAFT_REQUEST');"
new="  const firstContinuation = await service.continueCompletedHybridJob(job, db);\n  console.log('ACADEMY_SPECIALIST_RETRY_FIRST_CONTINUATION', JSON.stringify(firstContinuation));\n  assert.equal(firstContinuation?.status, 'AWAITING_UI_DRAFT_REQUEST', firstContinuation?.error || 'unexpected first continuation status');"
if old not in t: raise SystemExit('ACADEMY_RETRY_DIAGNOSTIC_TARGET_MISSING')
p.write_text(t.replace(old,new,1))
print('ACADEMY_RETRY_DIAGNOSTIC_APPLIED')
