from pathlib import Path
p=Path('server/cpaOrganization/reviewPackageRendering.ts')
text=p.read_text()
old="  newPage(); text(params.clientName,17,true);\n  text('AI-prepared draft. Not an audit, assurance opinion, or professional sign-off.',10,true);"
new="  newPage(); text(params.clientName,17,true);\n  text(params.deliverableTitle || 'Evidence Review Draft',13,true);\n  text('AI-prepared draft. Not an audit, assurance opinion, or professional sign-off.',10,true);"
if old not in text: raise SystemExit('PDF_TITLE_INSERTION_POINT_MISSING')
p.write_text(text.replace(old,new,1))
print('RECEIPT_DELIVERABLE_TITLE_TRUTH_FIX_APPLIED')
