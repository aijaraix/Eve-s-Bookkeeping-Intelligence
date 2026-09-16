from pathlib import Path
p=Path('server/tests/fixtures/bankStatementAcceptanceHelpers.ts')
text=p.read_text()
old="documents:[{id:prepared.documentId,originalName:'bank_statement_missing_txn_page.pdf',filename:'bank_statement_missing_txn_page.pdf',sha256:prepared.sourceSha}],canonicalFacts:prepared.extraction.facts,findings:[],bankStatementCompleteness:prepared.assessment"
if old not in text:
    old="documents:[{id:prepared.documentId,originalName:'bank-missing-transactions.pdf',filename:'bank-missing-transactions.pdf',sha256:prepared.sourceSha}],canonicalFacts:prepared.extraction.facts,findings:[],bankStatementCompleteness:prepared.assessment"
new="documents:[{id:prepared.documentId,originalName:'bank-missing-transactions.pdf',filename:'bank-missing-transactions.pdf',sha256:prepared.sourceSha}],facts:prepared.extraction.facts,canonicalFacts:prepared.extraction.facts,reports:[],findings:[],bankStatementCompleteness:prepared.assessment"
if old not in text: raise SystemExit('BANK_ENGAGEMENT_SHAPE_SNIPPET_MISSING')
p.write_text(text.replace(old,new,1))
print('BANK_BROWSER_ENGAGEMENT_SHAPE_FIXED')
