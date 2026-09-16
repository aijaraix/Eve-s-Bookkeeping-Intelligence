from pathlib import Path
p=Path('server/tests/sufficiencyClarificationCoordinator.test.ts')
text=p.read_text()
old="const unknown=suff.evaluate({task,persist:true,gaps:[{gapId:'gap-unknown-page',gapType:'MISSING_PAGE',description:'Unknown page.',affectedCapabilities:[],explicitMateriality:'UNKNOWN',evidenceRefs:['page-index'],signals:{structuralRelevance:'UNKNOWN',continuity:'UNKNOWN',reconciliation:'NOT_RUN'}}]}); const reviews=coord.createRequestsForDecision(unknown.decisionId,{createdBy:'operator'});"
new="const reviewTask={...task,taskId:'task-balance-review',purpose:'Verify ending cash.',availableCapabilities:['BANK_ENDING_BALANCE'],conclusions:[{conclusionId:'cash',label:'Ending cash',requiredCapabilities:['BANK_ENDING_BALANCE']}]}; const unknown=suff.evaluate({task:reviewTask,persist:true,gaps:[{gapId:'gap-unknown-page',gapType:'MISSING_PAGE',description:'Unknown page.',affectedCapabilities:[],explicitMateriality:'UNKNOWN',evidenceRefs:['page-index'],signals:{structuralRelevance:'UNKNOWN',continuity:'UNKNOWN',reconciliation:'NOT_RUN'}}]}); const reviews=coord.createRequestsForDecision(unknown.decisionId,{createdBy:'operator'});"
if old not in text: raise SystemExit('P1-010 unknown-materiality test snippet not found')
p.write_text(text.replace(old,new,1))
