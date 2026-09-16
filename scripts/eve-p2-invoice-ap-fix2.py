from pathlib import Path

p = Path('server/cpaOrganization/reviewPackageRendering.ts')
text = p.read_text()
old = """    text(`Semantic adjudication: ${a.semanticAdjudication?.status || 'NOT_MEASURED'} | Raw OCR labels: ${(a.semanticAdjudication?.rawLabelTexts || []).join(' | ') || 'none'}`);
"""
new = """    text(`Semantic adjudication: ${a.semanticAdjudication?.status || 'NOT_MEASURED'}`);
    const rawInvoiceLabels = a.semanticAdjudication?.rawLabelTexts || [];
    if (rawInvoiceLabels.length) for (const label of rawInvoiceLabels) text(`Raw OCR invoice label evidence: ${label}`);
    else text('Raw OCR invoice label evidence: none');
"""
if old not in text:
    raise SystemExit('INVOICE_AP_PDF_RAW_LABEL_SNIPPET_MISSING')
p.write_text(text.replace(old, new, 1))
print('INVOICE_AP_PDF_RAW_LABEL_EVIDENCE_FIX_APPLIED')
