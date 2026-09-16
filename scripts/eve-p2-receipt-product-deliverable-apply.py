from pathlib import Path
import re


def replace(path: str, old: str, new: str, count: int = 1) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'MISSING_SNIPPET:{path}:{old[:120]!r}')
    p.write_text(text.replace(old, new, count))


def regex_replace(path: str, pattern: str, repl: str, count: int = 1) -> None:
    p = Path(path)
    text = p.read_text()
    updated, n = re.subn(pattern, repl, text, count=count, flags=re.S)
    if n != count:
        raise SystemExit(f'REGEX_REPLACE_COUNT:{path}:expected={count}:actual={n}')
    p.write_text(updated)


# -----------------------------------------------------------------------------
# Product Truth: the financial-statement cell already receives full source
# metadata from the adapter. Preserve it when the actual user-visible cell or
# lineage icon opens the provenance drawer.
# -----------------------------------------------------------------------------
p = Path('src/components/design-system/EveFinancialTable.tsx')
text = p.read_text()
old = '''                              onInspectFact({
                                factLineageId: line.factLineageId,
                                renderId: line.renderId,
                                canonicalMetric: line.canonicalMetric,
                                period: p,
                                currency: line.currency || currency,
                                scale: line.scale || scale,
                                provenanceStatus: line.verificationStatus,
                                sourceDocName: line.sourceDocName,
                                sourcePage: line.sourcePage,
                                sourceRawValue: val ?? undefined
                              });'''
new = '''                              onInspectFact({
                                factLineageId: line.factLineageId,
                                renderId: line.renderId,
                                canonicalMetric: line.canonicalMetric,
                                period: p,
                                currency: line.currency || currency,
                                scale: line.scale || scale,
                                provenanceStatus: line.verificationStatus,
                                sourceDocName: line.sourceDocName,
                                sourcePage: line.sourcePage,
                                sourceRawValue: val ?? undefined,
                                sourceText: line.sourceText,
                                sourceType: line.sourceType,
                                sourceProvenanceId: line.sourceProvenanceId,
                                sourceCoordinate: line.sourceCoordinate,
                                sourceCoordinates: line.sourceCoordinates,
                                sourceLocationLabel: line.sourceLocationLabel,
                                sourceFormula: line.sourceFormula,
                                sourceConfidence: line.sourceConfidence,
                                sourceExtractionMethod: line.sourceExtractionMethod,
                                sourceExtractionVersion: line.sourceExtractionVersion
                              });'''
if old not in text:
    raise SystemExit('FINANCIAL_CELL_LINEAGE_SNIPPET_MISSING')
text = text.replace(old, new, 1)
old2 = '''                                onInspectFact({
                                  factLineageId: line.factLineageId,
                                  renderId: line.renderId,
                                  canonicalMetric: line.canonicalMetric,
                                  currency: line.currency || currency,
                                  scale: line.scale || scale,
                                  sourceDocName: line.sourceDocName,
                                  sourcePage: line.sourcePage
                                });'''
new2 = '''                                onInspectFact({
                                  factLineageId: line.factLineageId,
                                  renderId: line.renderId,
                                  canonicalMetric: line.canonicalMetric,
                                  currency: line.currency || currency,
                                  scale: line.scale || scale,
                                  provenanceStatus: line.verificationStatus,
                                  sourceDocName: line.sourceDocName,
                                  sourcePage: line.sourcePage,
                                  sourceRawValue: line.sourceRawValue,
                                  sourceText: line.sourceText,
                                  sourceType: line.sourceType,
                                  sourceProvenanceId: line.sourceProvenanceId,
                                  sourceCoordinate: line.sourceCoordinate,
                                  sourceCoordinates: line.sourceCoordinates,
                                  sourceLocationLabel: line.sourceLocationLabel,
                                  sourceFormula: line.sourceFormula,
                                  sourceConfidence: line.sourceConfidence,
                                  sourceExtractionMethod: line.sourceExtractionMethod,
                                  sourceExtractionVersion: line.sourceExtractionVersion
                                });'''
if old2 not in text:
    raise SystemExit('FINANCIAL_LINEAGE_BUTTON_SNIPPET_MISSING')
text = text.replace(old2, new2, 1)
text = text.replace("title={isClickable ? 'Click to inspect source proof in SEC filing' : undefined}", "title={isClickable ? 'Click to inspect source evidence' : undefined}")
p.write_text(text)

# -----------------------------------------------------------------------------
# Academy runner: Product/Deliverable dimensions remain NOT_TESTED by default,
# but a physically executed browser/export acceptance may supply independent
# evidence-backed checks. This keeps historical/default behavior fail-closed.
# -----------------------------------------------------------------------------
replace(
    'server/cpaOrganization/academyOcrCurriculumRunner.ts',
    '''  reconciliation?: AcademyOcrReconciliation;
  productTruthNotTestedReason: string;
  deliverableTruthNotTestedReason: string;
}''',
    '''  reconciliation?: AcademyOcrReconciliation;
  productTruthChecks?: FiveDimensionCheck[];
  deliverableTruthChecks?: FiveDimensionCheck[];
  productTruthNotTestedReason: string;
  deliverableTruthNotTestedReason: string;
}'''
)
replace(
    'server/cpaOrganization/academyOcrCurriculumRunner.ts',
    '''      PRODUCT_TRUTH: {
        checks: [{
          checkId: 'product-truth-browser-not-exercised',
          label: 'Actual Eve browser rendering and click-through provenance',
          outcome: 'NOT_TESTED',
          details: [fixture.productTruthNotTestedReason],
        }],
      },
      DELIVERABLE_TRUTH: {
        checks: [{
          checkId: 'deliverable-truth-export-not-exercised',
          label: 'Final report/export truth and reverse lineage',
          outcome: 'NOT_TESTED',
          details: [fixture.deliverableTruthNotTestedReason],
        }],
      },''',
    '''      PRODUCT_TRUTH: {
        checks: fixture.productTruthChecks?.length ? fixture.productTruthChecks : [{
          checkId: 'product-truth-browser-not-exercised',
          label: 'Actual Eve browser rendering and click-through provenance',
          outcome: 'NOT_TESTED',
          details: [fixture.productTruthNotTestedReason],
        }],
      },
      DELIVERABLE_TRUTH: {
        checks: fixture.deliverableTruthChecks?.length ? fixture.deliverableTruthChecks : [{
          checkId: 'deliverable-truth-export-not-exercised',
          label: 'Final report/export truth and reverse lineage',
          outcome: 'NOT_TESTED',
          details: [fixture.deliverableTruthNotTestedReason],
        }],
      },''',
    1
)

# -----------------------------------------------------------------------------
# Deliverable Truth: preserve source SHA, provenance IDs, exact source region,
# and extraction metadata across the report normalization boundary.
# -----------------------------------------------------------------------------
replace(
    'server/cpaOrganization/deliverableArtifactService.ts',
    '''      sourceText?: string;
      sourceBlockIds?: string[];
    }>;''',
    '''      sourceText?: string;
      sourceBlockIds?: string[];
      sourceSha256?: string;
      sourceArtifactId?: string;
      sourceProvenanceId?: string;
      sourceProvenanceIds?: string[];
      sourceCoordinate?: any;
      sourceCoordinates?: any[];
      sourceConfidence?: number;
      sourceExtractionMethod?: string;
      sourceExtractionVersion?: string;
    }>;'''
)
regex_replace(
    'server/cpaOrganization/deliverableArtifactService.ts',
    r'''    const normalizedFacts = rawFacts\.map\(\(f: any\) => \(\{.*?\n    \}\)\);''',
    '''    const normalizedFacts = rawFacts.map((f: any) => {
      const inheritedCoordinates = Array.isArray(f.sourceCoordinates) ? f.sourceCoordinates
        : Array.isArray(f.provenanceCoordinates) ? f.provenanceCoordinates
        : Array.isArray(f.provenance?.provenanceCoordinates) ? f.provenance.provenanceCoordinates
        : [];
      const sourceCoordinate = f.sourceCoordinate || f.provenance?.sourceCoordinate || inheritedCoordinates[0];
      const sourceCoordinates = inheritedCoordinates.length ? inheritedCoordinates : (sourceCoordinate ? [sourceCoordinate] : []);
      const sourceProvenanceIds = [...new Set([
        ...(Array.isArray(f.sourceProvenanceIds) ? f.sourceProvenanceIds : []),
        ...(f.sourceProvenanceId ? [f.sourceProvenanceId] : []),
        ...(Array.isArray(f.provenance?.sourceProvenanceIds) ? f.provenance.sourceProvenanceIds : []),
        ...(f.provenance?.sourceProvenanceId ? [f.provenance.sourceProvenanceId] : []),
      ].filter(Boolean).map(String))];
      return {
        id: f.id || undefined,
        canonicalMetric: f.canonicalMetric || 'Financial Metric',
        label: f.label || f.labelNormalized || f.labelOriginal || f.canonicalMetric || 'Line Item',
        value: typeof f.value === 'number' ? f.value : (Number(f.normalizedValue ?? f.valueFunctional ?? f.expectedValue) || 0),
        statement: f.statement || f.statementType || 'BALANCE_SHEET',
        sourceDoc: f.sourceDoc || f.documentTitle || f.sourceDocument || 'MISSING_EVIDENCE',
        page: typeof f.page === 'number' ? f.page : (typeof f.sourcePage === 'number' ? f.sourcePage : (typeof f.pageNumber === 'number' ? f.pageNumber : undefined)),
        verificationStatus: f.verificationStatus || 'NOT_VERIFIED',
        evidenceStatus: f.evidenceStatus || 'NOT_MEASURED',
        documentId: f.documentId,
        reportingPeriod: f.reportingPeriod || f.period || 'NOT_RECORDED',
        sourceText: f.sourceText || f.rawText || f.provenance?.sourceText || '',
        sourceBlockIds: Array.isArray(f.sourceBlockIds) ? f.sourceBlockIds : [],
        sourceSha256: f.sourceSha256 || f.provenance?.sourceSha256 || sourceCoordinate?.sourceSha256,
        sourceArtifactId: f.sourceArtifactId || f.provenance?.sourceArtifactId || sourceCoordinate?.sourceArtifactId,
        sourceProvenanceId: f.sourceProvenanceId || f.provenance?.sourceProvenanceId || sourceProvenanceIds[0],
        sourceProvenanceIds,
        sourceCoordinate,
        sourceCoordinates,
        sourceConfidence: f.sourceConfidence ?? sourceCoordinate?.confidence ?? f.provenance?.ocrConfidence,
        sourceExtractionMethod: f.sourceExtractionMethod || sourceCoordinate?.extractionMethod || f.provenance?.ocrEngine,
        sourceExtractionVersion: f.sourceExtractionVersion || sourceCoordinate?.extractionVersion || f.provenance?.ocrEngineVersion,
      };
    });'''
)
replace(
    'server/cpaOrganization/deliverableArtifactService.ts',
    '''    const euclidBalance = { assets, liabilities, equity, variance };''',
    '''    const balanceIdentityApplicable = [balance.assets, balance.liabilities, balance.equity].some(v => typeof v === 'number') ||
      normalizedFacts.some(f => /(?:asset|liabilit|equity)/i.test(String(f.canonicalMetric || '')));
    const euclidBalance = { assets, liabilities, equity, variance };'''
)
replace(
    'server/cpaOrganization/deliverableArtifactService.ts',
    '''      disclosureEvidenceLedger: params.disclosureEvidenceLedger,
      euclidBalance
    });''',
    '''      disclosureEvidenceLedger: params.disclosureEvidenceLedger,
      euclidBalance,
      balanceIdentityApplicable
    });''',
    1
)
replace(
    'server/cpaOrganization/deliverableArtifactService.ts',
    '''      disclosureEvidenceLedger: params.disclosureEvidenceLedger,
      euclidBalance
    });''',
    '''      disclosureEvidenceLedger: params.disclosureEvidenceLedger,
      euclidBalance,
      balanceIdentityApplicable
    });''',
    1
)
replace(
    'server/cpaOrganization/deliverableArtifactService.ts',
    '''      euclidBalance,
      status: reportStatus,''',
    '''      euclidBalance: balanceIdentityApplicable ? euclidBalance : null,
      balanceIdentityApplicable,
      status: reportStatus,'''
)

# -----------------------------------------------------------------------------
# Source-neutral report renderer + complete reverse lineage in PDF/XLSX/CSV.
# -----------------------------------------------------------------------------
p = Path('server/cpaOrganization/reviewPackageRendering.ts')
text = p.read_text()
text = re.sub(
    r'''export function reviewRow\(f: any\): any \{.*?\n\}''',
    '''export function reviewRow(f: any): any {
  const coordinates = Array.isArray(f.sourceCoordinates) && f.sourceCoordinates.length ? f.sourceCoordinates : (f.sourceCoordinate ? [f.sourceCoordinate] : []);
  const coordinate = f.sourceCoordinate || coordinates[0];
  const provenanceIds = [...new Set([
    ...(Array.isArray(f.sourceProvenanceIds) ? f.sourceProvenanceIds : []),
    ...(f.sourceProvenanceId ? [f.sourceProvenanceId] : []),
  ].filter(Boolean).map(String))];
  return { id: f.id || null, metric: f.canonicalMetric, label: f.label || f.canonicalMetric,
    value: f.value, period: f.reportingPeriod || f.period || 'NOT_RECORDED',
    statement: f.statement || f.statementType || 'NOT_RECORDED',
    documentId: f.documentId || null, sourceDoc: f.sourceDoc || 'NOT_RECORDED',
    extractorPage: f.page ?? null, sourceText: f.sourceText || '',
    sourceBlockIds: Array.isArray(f.sourceBlockIds) ? f.sourceBlockIds : [],
    sourceSha256: f.sourceSha256 || coordinate?.sourceSha256 || null,
    sourceArtifactId: f.sourceArtifactId || coordinate?.sourceArtifactId || null,
    sourceProvenanceId: f.sourceProvenanceId || provenanceIds[0] || null,
    sourceProvenanceIds: provenanceIds,
    sourceCoordinate: coordinate || null,
    sourceCoordinates: coordinates,
    sourceConfidence: f.sourceConfidence ?? coordinate?.confidence ?? null,
    sourceExtractionMethod: f.sourceExtractionMethod || coordinate?.extractionMethod || null,
    sourceExtractionVersion: f.sourceExtractionVersion || coordinate?.extractionVersion || null,
    verificationStatus: f.verificationStatus || 'NOT_VERIFIED', evidenceStatus: f.evidenceStatus || 'NOT_MEASURED' };
}
export function sourceCoordinateText(row: any): string {
  const c = row?.sourceCoordinate || row?.sourceCoordinates?.[0];
  if (!c) return row?.extractorPage != null ? `Page ${row.extractorPage}` : 'NOT_RECORDED';
  if (c.sourceType === 'IMAGE') {
    const b = c.boundingBox || {};
    const n = (v: any) => Number.isFinite(Number(v)) ? Number(v).toFixed(6) : 'NA';
    return `IMAGE page=${c.pageNumber || 1} size=${c.imageWidth || 'NA'}x${c.imageHeight || 'NA'} region=${c.ocrRegionId || 'NOT_RECORDED'} bbox[x=${n(b.x)},y=${n(b.y)},w=${n(b.width)},h=${n(b.height)},unit=${b.unit || 'NOT_RECORDED'}] transform=${c.transformId || 'NONE'}`;
  }
  if (c.sourceType === 'PDF') return `PDF page=${c.pageNumber || 1}`;
  if (c.sourceType === 'SPREADSHEET') return `SPREADSHEET ${c.sheetName || 'Sheet'}!${c.cellAddress || c.rangeAddress || 'NOT_RECORDED'}`;
  if (c.sourceType === 'CSV') return `CSV row=${c.rowIndex || 'NOT_RECORDED'} column=${c.columnIndex || c.columnName || 'NOT_RECORDED'}`;
  return `${c.sourceType || 'SOURCE'} ${JSON.stringify(c)}`;
}''',
    text,
    count=1,
    flags=re.S
)
if 'sourceCoordinateText(row: any)' not in text:
    raise SystemExit('REVIEW_ROW_PATCH_FAILED')
text = text.replace("[['Source Fact ID','Metric','Label','Value','Currency','Reporting Period','Statement','Document ID','Source Document','Extractor Locator','Verification','Evidence Status','Source Block IDs'],", "[['Source Fact ID','Metric','Label','Value','Currency','Reporting Period','Statement','Document ID','Source Document','Extractor Locator','Verification','Evidence Status','Source Block IDs','Source SHA256','Source Provenance IDs','Source Coordinate','Extraction Method','Extraction Version','Confidence','Source Excerpt'],")
text = text.replace("...facts.map(f=>{const r=reviewRow(f);return [r.id,r.metric,r.label,r.value,currency,r.period,r.statement,r.documentId,r.sourceDoc,r.extractorPage,r.verificationStatus,r.evidenceStatus,r.sourceBlockIds.join(';')];})", "...facts.map(f=>{const r=reviewRow(f);return [r.id,r.metric,r.label,r.value,currency,r.period,r.statement,r.documentId,r.sourceDoc,r.extractorPage,r.verificationStatus,r.evidenceStatus,r.sourceBlockIds.join(';'),r.sourceSha256,r.sourceProvenanceIds.join(';'),sourceCoordinateText(r),r.sourceExtractionMethod,r.sourceExtractionVersion,r.sourceConfidence,r.sourceText];})")
text = text.replace("page.drawText('EVE | PUBLIC-FILING REVIEW WORKING PAPERS'", "page.drawText('EVE | EVIDENCE REVIEW WORKING PAPERS'")
text = text.replace("text('Scope: analysis of supplied public filing evidence. Private records, transaction-level bookkeeping, external confirmations and controls testing have not been demonstrated by this package.');", "text('Scope: analysis of supplied evidence only. Completeness beyond the supplied evidence, external confirmations and controls testing have not been established by this package.');")
old_balance = '''  heading('Selected balance-sheet arithmetic');
  const b=params.euclidBalance;
  text(`Assets: ${params.currency} ${b.assets.toLocaleString('en-US')}\\nLiabilities: ${params.currency} ${b.liabilities.toLocaleString('en-US')}\\nEquity including applicable noncontrolling interests: ${params.currency} ${b.equity.toLocaleString('en-US')}\\nAssets - liabilities - equity: ${b.variance.toLocaleString('en-US')}`);
  text('This equality checks these three selected totals only. It does not establish trial-balance equality or financial-statement completeness.');'''
new_balance = '''  const b=params.euclidBalance;
  if (params.balanceIdentityApplicable) {
    heading('Selected balance-sheet arithmetic');
    text(`Assets: ${params.currency} ${b.assets.toLocaleString('en-US')}\\nLiabilities: ${params.currency} ${b.liabilities.toLocaleString('en-US')}\\nEquity including applicable noncontrolling interests: ${params.currency} ${b.equity.toLocaleString('en-US')}\\nAssets - liabilities - equity: ${b.variance.toLocaleString('en-US')}`);
    text('This equality checks these three selected totals only. It does not establish trial-balance equality or financial-statement completeness.');
  } else {
    heading('Accounting identity scope');
    text('Balance-sheet identity: NOT APPLICABLE TO THIS EVIDENCE PACKAGE. No complete assets/liabilities/equity population was supplied for this draft.');
  }'''
if old_balance not in text:
    raise SystemExit('PDF_BALANCE_BLOCK_MISSING')
text = text.replace(old_balance, new_balance, 1)
old_fact_tail = '''    text(`Statement: ${r.statement}\\nSource fact ID: ${r.id||'MISSING'}\\nDocument: ${r.documentId||'MISSING'} / ${r.sourceDoc} | Extractor locator: ${r.extractorPage??'NOT_RECORDED'}`);
    text(`Checks: ${r.verificationStatus} / ${r.evidenceStatus}`);'''
new_fact_tail = '''    text(`Statement: ${r.statement}\\nSource fact ID: ${r.id||'MISSING'}\\nDocument: ${r.documentId||'MISSING'} / ${r.sourceDoc} | Extractor locator: ${r.extractorPage??'NOT_RECORDED'}`);
    text(`Checks: ${r.verificationStatus} / ${r.evidenceStatus}`);
    text(`Source SHA-256: ${r.sourceSha256 || 'NOT_RECORDED'}\\nSource provenance IDs: ${r.sourceProvenanceIds.length ? r.sourceProvenanceIds.join(', ') : 'NOT_RECORDED'}\\nSource coordinate: ${sourceCoordinateText(r)}`);
    text(`Extraction: ${r.sourceExtractionMethod || 'NOT_RECORDED'} ${r.sourceExtractionVersion || ''} | Confidence: ${r.sourceConfidence == null ? 'NOT_RECORDED' : r.sourceConfidence}\\nSource excerpt: ${r.sourceText || 'NOT_RECORDED'}`);'''
if old_fact_tail not in text:
    raise SystemExit('PDF_FACT_TAIL_MISSING')
text = text.replace(old_fact_tail, new_fact_tail, 1)
text = text.replace("['PUBLIC FILING ANALYSIS - DRAFT','AUTHORIZED HUMAN REVIEW REQUIRED'],", "['EVIDENCE REVIEW - DRAFT','AUTHORIZED HUMAN REVIEW REQUIRED'],")
text = text.replace("['Scope','Public filing analysis only; not an audit or CPA opinion.'],", "['Scope','Analysis of supplied evidence only; not an audit or CPA opinion.'],")
text = text.replace("['Selected assets',b.assets],['Selected liabilities',b.liabilities],['Selected equity',b.equity],['Calculated arithmetic variance',null],", "...(params.balanceIdentityApplicable ? [['Selected assets',b.assets],['Selected liabilities',b.liabilities],['Selected equity',b.equity],['Calculated arithmetic variance',null]] : [['Balance-sheet identity','NOT APPLICABLE - complete assets/liabilities/equity population not supplied']]),")
text = text.replace("['Limitations','Financial-fact IDs and original periods are preserved. HTML locators are not independently verified physical pages.'],", "['Limitations','Financial-fact IDs, original periods and recorded source locators are preserved. Completeness beyond supplied evidence is not established.'],")
text = text.replace("  summary.B15={t:'n',f:'B12-B13-B14',v:b.assets-b.liabilities-b.equity};\n  for(const addr of ['B12','B13','B14','B15'])summary[addr].z='#,##0.00;[Red](#,##0.00);\"-\"';", "  if(params.balanceIdentityApplicable){\n    summary.B15={t:'n',f:'B12-B13-B14',v:b.assets-b.liabilities-b.equity};\n    for(const addr of ['B12','B13','B14','B15'])if(summary[addr])summary[addr].z='#,##0.00;[Red](#,##0.00);\"-\"';\n  }")
old_leads = '''  add('Lead Schedules',[
    ['Source Fact ID','Metric','Reporting Period','Document ID','Source Document','Extractor Locator','Source Block IDs','Source Excerpt'],
    ...rows.map((r:any)=>[r.id,r.metric,r.period,r.documentId,r.sourceDoc,r.extractorPage,r.sourceBlockIds.join(';'),r.sourceText])
  ],[48,34,28,38,27,20,50,90]);'''
new_leads = '''  add('Lead Schedules',[
    ['Source Fact ID','Metric','Reporting Period','Document ID','Source Document','Extractor Locator','Source Block IDs','Source SHA256','Source Provenance IDs','Source Coordinate','Extraction Method','Extraction Version','Confidence','Source Excerpt'],
    ...rows.map((r:any)=>[r.id,r.metric,r.period,r.documentId,r.sourceDoc,r.extractorPage,r.sourceBlockIds.join(';'),r.sourceSha256,r.sourceProvenanceIds.join(';'),sourceCoordinateText(r),r.sourceExtractionMethod,r.sourceExtractionVersion,r.sourceConfidence,r.sourceText])
  ],[48,34,28,38,27,20,50,66,66,100,30,18,14,90]);'''
if old_leads not in text:
    raise SystemExit('XLSX_LEADS_BLOCK_MISSING')
text = text.replace(old_leads, new_leads, 1)
p.write_text(text)

# -----------------------------------------------------------------------------
# Receipt curriculum is now intended to cover all five dimensions once this
# physical browser/export acceptance succeeds. It remains scheduler-ineligible.
# -----------------------------------------------------------------------------
p = Path('server/cpaOrganization/academyMinervaLab.ts')
text = p.read_text()
old_case = '''        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH'],
        [
          'Identify merchant, transaction date, amount, tax and currency without inventing absent fields.',
          'Preserve source SHA, image dimensions, OCR engine/version, confidence and exact bounding regions.',
          'Promoted accounting fact must reverse-trace to the receipt region and any rendered product value.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED',
        ['server/tests/ocrParserEvidence.test.ts', 'docs/launch/evidence/2026-09-16_LOCAL_OCR_SOURCE_TO_PIXEL_ACCEPTANCE.md']'''
new_case = '''        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH'],
        [
          'Identify merchant, transaction date, amount, tax and currency without inventing absent fields.',
          'Preserve source SHA, image dimensions, OCR engine/version, confidence and exact bounding regions.',
          'Promoted accounting fact must reverse-trace to the receipt region and any rendered product value.',
          'Receipt-derived draft artifacts must retain the source SHA, provenance ID, source region and source excerpt.'
        ],
        'CONTRACT_READY',
        ['server/tests/ocrParserEvidence.test.ts', 'server/tests/receiptProductTruthBrowser.test.ts', 'server/tests/receiptDeliverableTruth.test.ts', 'server/tests/receiptFiveDimensionAcceptance.test.ts', 'docs/launch/evidence/2026-09-16_P2_RECEIPT_FIVE_DIMENSION_ACCEPTANCE.md']'''
if old_case not in text:
    raise SystemExit('RECEIPT_CURRICULUM_CASE_MISSING')
text = text.replace(old_case, new_case, 1)
p.write_text(text)
replace('server/tests/fiveDimensionAcademyCurriculum.test.ts', 'assert.equal(coverage.contractReadyCases, 5);\nassert.equal(coverage.physicalFixturePendingCases, 14);', 'assert.equal(coverage.contractReadyCases, 6);\nassert.equal(coverage.physicalFixturePendingCases, 13);')
replace(
    'server/tests/fiveDimensionAcademyCurriculum.test.ts',
    "assert.equal(find('CURR-SUFF-MISSING-PAGE-NON-MATERIAL').fixtureStatus, 'CONTRACT_READY');",
    "assert.equal(find('CURR-OCR-RECEIPT-PHOTO').fixtureStatus, 'CONTRACT_READY');\nassert.deepEqual(find('CURR-OCR-RECEIPT-PHOTO').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY', 'PRODUCT_TRUTH', 'DELIVERABLE_TRUTH']);\nassert.equal(find('CURR-SUFF-MISSING-PAGE-NON-MATERIAL').fixtureStatus, 'CONTRACT_READY');"
)

# -----------------------------------------------------------------------------
# Shared exact receipt fixture. The source-region JSON is generated physically
# from the pinned Pillow fixture recipe during the acceptance workflow.
# -----------------------------------------------------------------------------
Path('server/tests/fixtures/receiptFiveDimensionFixture.ts').write_text(r'''import fs from 'node:fs';
import path from 'node:path';

export const RECEIPT_SHA256 = 'bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436';
export const RECEIPT_FACT_ID = 'fact-receipt-total-53-23';
export const RECEIPT_DOCUMENT_ID = 'doc-receipt-bdd93a72';
export const RECEIPT_PROVENANCE_ID = 'prov-receipt-bdd93a72-total-53-23';
export const RECEIPT_ENGAGEMENT_ID = 'eng-academy-receipt-five-dim';
export const RECEIPT_WORKSPACE_ID = 'ws-academy-receipt-five-dim';
export const RECEIPT_EXPECTED_VALUE = 53.23;

export interface ReceiptSourceRegionEvidence {
  marker: 'RECEIPT_FIXTURE_SOURCE_REGION=PASS';
  sourceSha256: string;
  filename: string;
  imageWidth: number;
  imageHeight: number;
  pixelBoundingBox: { x: number; y: number; width: number; height: number };
  normalizedBoundingBox: { x: number; y: number; width: number; height: number; unit: 'NORMALIZED' };
  rawLiteral: string;
  transformId: string;
}

export function receiptEvidenceDir(): string {
  return process.env.RECEIPT_ACCEPTANCE_EVIDENCE_DIR || '/tmp/eve-receipt-five-dimension';
}

export function loadReceiptSourceRegionEvidence(): ReceiptSourceRegionEvidence {
  const file = path.join(receiptEvidenceDir(), 'source-region.json');
  const evidence = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (evidence.marker !== 'RECEIPT_FIXTURE_SOURCE_REGION=PASS' || evidence.sourceSha256 !== RECEIPT_SHA256) {
    throw new Error('RECEIPT_SOURCE_REGION_EVIDENCE_INVALID');
  }
  return evidence;
}

export function buildReceiptCoordinate(evidence = loadReceiptSourceRegionEvidence()): any {
  return {
    coordinateId: 'coord-receipt-total-53-23',
    sourceArtifactId: `artifact-image-${RECEIPT_SHA256.slice(0, 24)}`,
    sourceSha256: RECEIPT_SHA256,
    sourceType: 'IMAGE',
    pageNumber: 1,
    imageWidth: evidence.imageWidth,
    imageHeight: evidence.imageHeight,
    boundingBox: evidence.normalizedBoundingBox,
    ocrRegionId: 'fixture-total-glyph-region',
    transformId: evidence.transformId,
    rawLiteral: evidence.rawLiteral,
    normalizedLiteral: evidence.rawLiteral,
    extractionMethod: 'local-ocr:paddleocr',
    extractionVersion: '3.7.0',
  };
}

export function buildReceiptFact(evidence = loadReceiptSourceRegionEvidence()): any {
  const coordinate = buildReceiptCoordinate(evidence);
  return {
    id: RECEIPT_FACT_ID,
    workspaceId: RECEIPT_WORKSPACE_ID,
    documentId: RECEIPT_DOCUMENT_ID,
    canonicalMetric: 'operating_expenses',
    labelOriginal: 'Receipt Total',
    labelNormalized: 'Receipt Total',
    valueOriginal: '$53.23',
    valueFunctional: RECEIPT_EXPECTED_VALUE,
    normalizedValue: RECEIPT_EXPECTED_VALUE,
    currencyOriginal: 'USD',
    functionalCurrency: 'USD',
    reportingPeriod: 'FY 2026',
    periodOriginal: 'FY 2026',
    status: 'APPROVED',
    verificationStatus: 'VERIFIED',
    evidenceStatus: 'CONFIRMED',
    pageNumber: 1,
    sourceDocument: 'receipt.png',
    documentTitle: 'receipt.png',
    sourceText: 'TOTAL $53.23',
    sourceSha256: RECEIPT_SHA256,
    sourceArtifactId: coordinate.sourceArtifactId,
    sourceProvenanceId: RECEIPT_PROVENANCE_ID,
    sourceProvenanceIds: [RECEIPT_PROVENANCE_ID],
    sourceCoordinate: coordinate,
    sourceCoordinates: [coordinate],
    provenanceCoordinates: [coordinate],
    sourceExtractionMethod: coordinate.extractionMethod,
    sourceExtractionVersion: coordinate.extractionVersion,
    scale: 'Source units',
  };
}

export function buildReceiptEngagement(evidence = loadReceiptSourceRegionEvidence()): any {
  const fact = buildReceiptFact(evidence);
  const document = {
    id: RECEIPT_DOCUMENT_ID,
    filename: 'receipt.png',
    sha256: RECEIPT_SHA256,
    workspaceId: RECEIPT_WORKSPACE_ID,
    pageCount: 1,
  };
  return {
    engagementId: RECEIPT_ENGAGEMENT_ID,
    workspaceId: RECEIPT_WORKSPACE_ID,
    classification: 'ACADEMY',
    isCustomer: false,
    clientName: 'Eve Academy Receipt Fixture',
    entityName: 'Eve Academy Receipt Fixture',
    title: 'Receipt Product and Deliverable Truth',
    period: 'FY 2026',
    framework: 'US_GAAP',
    functionalCurrency: 'USD',
    currentStage: 'ENGAGEMENT_COMPLETE',
    openReviewNotesCount: 0,
    facts: [fact],
    documents: [document],
    reports: [],
    findings: [],
    periods: ['FY 2026'],
    continuation: null,
  };
}
''')

# -----------------------------------------------------------------------------
# Real built-product browser proof. API reads are deterministic isolated Academy
# fixture responses, but the React app, adapters, table and drawer are the real
# feature-branch product build executed in Chromium.
# -----------------------------------------------------------------------------
Path('server/tests/receiptProductTruthBrowser.test.ts').write_text(r'''import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import {
  RECEIPT_ENGAGEMENT_ID, RECEIPT_FACT_ID, RECEIPT_PROVENANCE_ID, RECEIPT_SHA256,
  buildReceiptEngagement, loadReceiptSourceRegionEvidence, receiptEvidenceDir,
} from './fixtures/receiptFiveDimensionFixture.js';

const baseUrl = process.env.EVE_TEST_BASE_URL || 'http://127.0.0.1:4173';
const evidenceDir = receiptEvidenceDir();
fs.mkdirSync(evidenceDir, { recursive: true });
const region = loadReceiptSourceRegionEvidence();
const engagement = buildReceiptEngagement(region);
const candidates = [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean) as string[];
const executablePath = candidates.find(p => fs.existsSync(p));
if (!executablePath) throw new Error('MISSING_BROWSER_EXECUTABLE');

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on('request', async request => {
    try {
      const url = new URL(request.url());
      if (url.origin !== new URL(baseUrl).origin || !url.pathname.startsWith('/api/')) return request.continue();
      let payload: any = {};
      if (url.pathname === '/api/cpa/engagements/universal') {
        payload = { engagements: [{
          engagementId: engagement.engagementId, workspaceId: engagement.workspaceId, classification: 'ACADEMY', isCustomer: false,
          clientName: engagement.clientName, period: engagement.period, framework: engagement.framework,
          functionalCurrency: engagement.functionalCurrency, currentStage: engagement.currentStage, openReviewNotesCount: 0,
          documentsCount: 1, canonicalFactsCount: 1,
        }] };
      } else if (url.pathname === `/api/cpa/engagements/${encodeURIComponent(RECEIPT_ENGAGEMENT_ID)}` || url.pathname === `/api/cpa/engagements/${RECEIPT_ENGAGEMENT_ID}`) {
        payload = { engagement };
      } else if (url.pathname === '/api/cpa/reports/library') {
        payload = { reports: [] };
      } else if (url.pathname === '/api/queue/jobs') {
        payload = { jobs: [] };
      } else if (url.pathname === '/api/health') {
        payload = { status: 'ok' };
      }
      await request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
    } catch (error) {
      request.abort();
    }
  });

  const response = await page.goto(`${baseUrl}/?view=financials-income`, { waitUntil: 'networkidle0', timeout: 30000 });
  assert.ok(response?.ok(), `feature preview navigation failed: ${response?.status()}`);
  const selector = `[data-eve-financial-value="true"][data-canonical-fact-id="${RECEIPT_FACT_ID}"]`;
  await page.waitForSelector(selector, { visible: true, timeout: 15000 });
  const cell = await page.$eval(selector, (el: any) => ({
    text: el.innerText.trim(), factId: el.dataset.canonicalFactId, renderId: el.dataset.renderId,
    metric: el.dataset.canonicalMetric, period: el.dataset.period, currency: el.dataset.currency,
  }));
  assert.equal(cell.text, '$53.23');
  assert.equal(cell.factId, RECEIPT_FACT_ID);
  assert.equal(cell.metric, 'operating_expenses');
  assert.equal(cell.period, 'FY 2026');
  assert.equal(cell.currency, 'USD');
  assert.ok(cell.renderId, 'actual product cell must register reverse-render lineage');

  await page.click(selector);
  await page.waitForSelector('[role="dialog"]', { visible: true, timeout: 10000 });
  const normalText = await page.$eval('[role="dialog"]', el => (el as HTMLElement).innerText);
  for (const expected of [
    'Source-to-Pixel Provenance', 'receipt.png', 'TOTAL $53.23', '900×1000', 'fixture-total-glyph-region',
    RECEIPT_PROVENANCE_ID, 'local-ocr:paddleocr', '3.7.0',
    'x=0.0667 y=0.5590 w=0.3211 h=0.0370 NORMALIZED',
  ]) assert.ok(normalText.includes(expected), `provenance drawer missing ${expected}`);

  await page.click('[data-eve-action-id="evidence.technical"]');
  const advancedText = await page.$eval('[role="dialog"]', el => (el as HTMLElement).innerText);
  assert.ok(advancedText.includes(RECEIPT_SHA256));
  assert.ok(advancedText.includes(RECEIPT_FACT_ID));
  assert.ok(advancedText.includes(cell.renderId));

  const screenshot = path.join(evidenceDir, 'product-truth-browser.png');
  await page.screenshot({ path: screenshot, fullPage: true });
  const proof = {
    marker: 'P2_RECEIPT_PRODUCT_TRUTH_BROWSER=PASS',
    sourceSha256: RECEIPT_SHA256,
    engagementId: RECEIPT_ENGAGEMENT_ID,
    factId: RECEIPT_FACT_ID,
    provenanceId: RECEIPT_PROVENANCE_ID,
    renderId: cell.renderId,
    visibleValue: cell.text,
    sourceLocation: region.normalizedBoundingBox,
    screenshot,
    browserVersion: await browser.version(),
  };
  fs.writeFileSync(path.join(evidenceDir, 'product-truth.json'), JSON.stringify(proof, null, 2));
  console.log('P2_RECEIPT_PRODUCT_TRUTH_BROWSER=PASS');
} finally {
  await browser.close();
}
''')

# -----------------------------------------------------------------------------
# Real artifact proof. Uses Eve's real DeliverableArtifactService and renderer,
# reads the resulting PDF/JSON/CSV/XLSX back, and demands reverse lineage.
# -----------------------------------------------------------------------------
Path('server/tests/receiptDeliverableTruth.test.ts').write_text(r'''import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import {
  RECEIPT_DOCUMENT_ID, RECEIPT_ENGAGEMENT_ID, RECEIPT_FACT_ID, RECEIPT_PROVENANCE_ID, RECEIPT_SHA256,
  RECEIPT_WORKSPACE_ID, buildReceiptFact, loadReceiptSourceRegionEvidence, receiptEvidenceDir,
} from './fixtures/receiptFiveDimensionFixture.js';

const evidenceDir = receiptEvidenceDir();
const reportsDir = path.join(evidenceDir, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });
process.env.HERMES_REPORTS_DIR = reportsDir;
const { deliverableArtifactService } = await import('../cpaOrganization/deliverableArtifactService.js');
const region = loadReceiptSourceRegionEvidence();
const fact = buildReceiptFact(region);
const report = await deliverableArtifactService.compileAndRegisterDeliverable({
  reportId: 'REP-RECEIPT-53-23', engagementId: RECEIPT_ENGAGEMENT_ID, workspaceId: RECEIPT_WORKSPACE_ID,
  version: 'v1.0', title: 'Receipt Evidence Review Draft', clientName: 'Eve Academy Receipt Fixture',
  period: 'FY 2026', currency: 'USD', status: 'AI_PREPARED',
  facts: [{
    id: fact.id, canonicalMetric: fact.canonicalMetric, label: fact.labelNormalized, value: fact.normalizedValue,
    statement: 'EXPENSE_EVIDENCE', sourceDoc: 'receipt.png', page: 1, verificationStatus: 'VERIFIED', evidenceStatus: 'CONFIRMED',
    documentId: RECEIPT_DOCUMENT_ID, reportingPeriod: 'FY 2026', sourceText: fact.sourceText, sourceBlockIds: ['SB-RECEIPT-TOTAL'],
    sourceSha256: fact.sourceSha256, sourceArtifactId: fact.sourceArtifactId,
    sourceProvenanceId: fact.sourceProvenanceId, sourceProvenanceIds: fact.sourceProvenanceIds,
    sourceCoordinate: fact.sourceCoordinate, sourceCoordinates: fact.sourceCoordinates,
    sourceExtractionMethod: fact.sourceExtractionMethod, sourceExtractionVersion: fact.sourceExtractionVersion,
  }],
});
assert.equal(report.status, 'AI_PREPARED');
assert.equal(report.numericFactsCount, 1);
assert.ok(report.formats.pdf && report.formats.json && report.formats.xlsx && report.formats.csvLeadSchedules);
const pdfBytes = fs.readFileSync(report.formats.pdf!.filepath);
assert.equal(pdfBytes.subarray(0, 5).toString(), '%PDF-');
const pdfSha = crypto.createHash('sha256').update(pdfBytes).digest('hex');
assert.equal(pdfSha, report.formats.pdf!.sha256);
assert.equal(pdfSha, report.manifest.artifacts.pdf.sha256);

const { PDFParse } = await import('pdf-parse');
const parser = new PDFParse({ data: pdfBytes });
let pdfText = '';
try { pdfText = (await parser.getText()).text; } finally { await parser.destroy(); }
for (const expected of [
  'EVE | EVIDENCE REVIEW WORKING PAPERS', 'Receipt Evidence Review Draft', 'TOTAL $53.23', RECEIPT_SHA256,
  RECEIPT_PROVENANCE_ID, 'fixture-total-glyph-region', 'local-ocr:paddleocr', '3.7.0',
  'Balance-sheet identity: NOT APPLICABLE TO THIS EVIDENCE PACKAGE',
]) assert.ok(pdfText.includes(expected), `PDF missing reverse-lineage/truth text: ${expected}`);
assert.ok(!pdfText.includes('PUBLIC-FILING REVIEW'), 'receipt draft must not claim public-filing scope');

const jsonPayload = JSON.parse(fs.readFileSync(report.formats.json!.filepath, 'utf8'));
assert.equal(jsonPayload.balanceIdentityApplicable, false);
assert.equal(jsonPayload.euclidBalance, null);
assert.equal(jsonPayload.facts[0].sourceSha256, RECEIPT_SHA256);
assert.equal(jsonPayload.facts[0].sourceProvenanceId, RECEIPT_PROVENANCE_ID);
assert.deepEqual(jsonPayload.facts[0].sourceCoordinate.boundingBox, region.normalizedBoundingBox);

const csv = fs.readFileSync(report.formats.csvLeadSchedules!.filepath, 'utf8');
for (const expected of [RECEIPT_SHA256, RECEIPT_PROVENANCE_ID, 'fixture-total-glyph-region', 'TOTAL $53.23']) {
  assert.ok(csv.includes(expected), `CSV missing ${expected}`);
}
const workbook = XLSX.readFile(report.formats.xlsx!.filepath);
const leadRows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets['Lead Schedules'], { header: 1, raw: false });
const leadText = leadRows.flat().map(v => String(v ?? '')).join(' | ');
for (const expected of [RECEIPT_SHA256, RECEIPT_PROVENANCE_ID, 'fixture-total-glyph-region', 'TOTAL $53.23']) {
  assert.ok(leadText.includes(expected), `XLSX lead schedule missing ${expected}`);
}

const proof = {
  marker: 'P2_RECEIPT_DELIVERABLE_TRUTH=PASS', sourceSha256: RECEIPT_SHA256, factId: RECEIPT_FACT_ID,
  provenanceId: RECEIPT_PROVENANCE_ID, reportId: report.reportId, version: report.version,
  pdfSha256: pdfSha, pdfBytes: pdfBytes.length, canonicalFactHash: report.canonicalFactHash,
  formats: { pdf: report.formats.pdf!.sha256, json: report.formats.json!.sha256, xlsx: report.formats.xlsx!.sha256, csv: report.formats.csvLeadSchedules!.sha256 },
};
fs.writeFileSync(path.join(evidenceDir, 'deliverable-truth.json'), JSON.stringify(proof, null, 2));
console.log('P2_RECEIPT_DELIVERABLE_TRUTH=PASS');
''')

# -----------------------------------------------------------------------------
# Final five-dimension composition must consume the two machine evidence receipts
# produced earlier in the same CI job; no evidence receipt -> no PASS.
# -----------------------------------------------------------------------------
Path('server/tests/receiptFiveDimensionAcceptance.test.ts').write_text(r'''import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runAcademyOcrCurriculumFixture, type AcademyOcrCurriculumFixture } from '../cpaOrganization/academyOcrCurriculumRunner.js';
import {
  RECEIPT_SHA256, loadReceiptSourceRegionEvidence, receiptEvidenceDir,
} from './fixtures/receiptFiveDimensionFixture.js';

const evidenceDir = receiptEvidenceDir();
const product = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'product-truth.json'), 'utf8'));
const deliverable = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'deliverable-truth.json'), 'utf8'));
const region = loadReceiptSourceRegionEvidence();
assert.equal(product.marker, 'P2_RECEIPT_PRODUCT_TRUTH_BROWSER=PASS');
assert.equal(deliverable.marker, 'P2_RECEIPT_DELIVERABLE_TRUTH=PASS');
assert.equal(product.sourceSha256, RECEIPT_SHA256);
assert.equal(deliverable.sourceSha256, RECEIPT_SHA256);
const receiptPath = path.join(evidenceDir, 'receipt.png');
const buffer = fs.readFileSync(receiptPath);

const lines = [
  'EVE TEST MARKET', 'RECEIPT R-2026-0916', 'DATE 09/16/2026',
  'OFFICE SUPPLIES $24.50', 'PRINTER PAPER $18.00', 'COFFEE $7.25',
  'SUBTOTAL $49.75', 'SALES TAX $3.48', 'TOTAL $53.23', 'VISA 4242 $53.23',
];
const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input); const body = JSON.parse(String(init?.body || '{}'));
  const engine = url.includes('doctr') ? 'doctr' : 'paddleocr';
  const regions = lines.map((text, i) => ({
    regionId: `p1-r${i + 1}`, text, confidence: engine === 'paddleocr' ? 0.997 : 0.952,
    boundingBox: text === 'TOTAL $53.23' ? region.normalizedBoundingBox : { x: 0.05, y: 0.04 + i * 0.05, width: 0.7, height: 0.04, unit: 'NORMALIZED' as const },
  }));
  return new Response(JSON.stringify({
    engine, engineVersion: engine === 'paddleocr' ? '3.7.0' : '1.1.0',
    model: engine === 'paddleocr' ? 'PP-OCRv6-medium' : 'fast_base+crnn_vgg16_bn',
    sourceSha256: body.sourceSha256, elapsedMs: 1,
    pages: [{ pageNumber: 1, width: 900, height: 1000, regions }],
  }), { status: 200, headers: { 'content-type': 'application/json' } });
};

const fixture: AcademyOcrCurriculumFixture = {
  caseId: 'CURR-OCR-RECEIPT-PHOTO', filename: 'receipt.png', mimeType: 'image/png', buffer,
  semanticAssertions: [
    { checkId: 'merchant', label: 'Merchant', expectedText: 'EVE TEST MARKET' },
    { checkId: 'receipt-id', label: 'Receipt ID', expectedText: 'RECEIPT R-2026-0916' },
  ],
  accountingAssertions: [
    { checkId: 'subtotal', label: 'Subtotal', expectedText: 'SUBTOTAL $49.75' },
    { checkId: 'tax', label: 'Tax', expectedText: 'SALES TAX $3.48' },
    { checkId: 'total', label: 'Total', expectedText: 'TOTAL $53.23' },
  ],
  reconciliation: { checkId: 'identity', label: 'Subtotal + tax = total', subtotal: 49.75, tax: 3.48, total: 53.23, subtotalText: 'SUBTOTAL $49.75', taxText: 'SALES TAX $3.48', totalText: 'TOTAL $53.23' },
  productTruthChecks: [{
    checkId: 'receipt-product-browser', label: 'Actual Eve feature build renders receipt fact and opens exact source-to-pixel lineage', outcome: 'PASS',
    evidenceRefs: [`browser:${product.browserVersion}:${product.renderId}:${product.sourceSha256}`],
    details: [`Rendered ${product.visibleValue}; fact=${product.factId}; provenance=${product.provenanceId}; screenshot=${product.screenshot}`],
  }],
  deliverableTruthChecks: [{
    checkId: 'receipt-deliverable-lineage', label: 'Actual Eve PDF/export package preserves receipt source and reverse lineage', outcome: 'PASS',
    evidenceRefs: [`deliverable:${deliverable.reportId}:${deliverable.version}:${deliverable.pdfSha256}:${deliverable.sourceSha256}`],
    details: [`PDF bytes=${deliverable.pdfBytes}; fact=${deliverable.factId}; provenance=${deliverable.provenanceId}`],
  }],
  productTruthNotTestedReason: 'browser evidence receipt missing',
  deliverableTruthNotTestedReason: 'deliverable evidence receipt missing',
};
const run = await runAcademyOcrCurriculumFixture(fixture, { primaryUrl: 'http://paddle', fallbackUrl: 'http://doctr', fetchImpl: fetchImpl as any });
assert.equal(run.sourceSha256, RECEIPT_SHA256);
assert.equal(run.fiveDimensionEvaluation.overallStatus, 'FIVE_DIMENSION_PASS');
assert.equal(run.fiveDimensionEvaluation.fullyTested, true);
assert.equal(run.fiveDimensionEvaluation.allRequiredDimensionsPassed, true);
assert.equal(run.fiveDimensionEvaluation.passedDimensionCount, 5);
assert.equal(run.fiveDimensionEvaluation.notTestedDimensionCount, 0);
for (const dimension of ['SOURCE_COVERAGE','SEMANTIC_UNDERSTANDING','ACCOUNTING_ACCURACY','PRODUCT_TRUTH','DELIVERABLE_TRUTH'] as const) {
  const grade = run.fiveDimensionEvaluation.dimensions[dimension];
  assert.equal(grade.status, 'PASS', `${dimension} must pass`);
  assert.ok(grade.evidenceRefs.length > 0, `${dimension} PASS must carry evidence refs`);
}
fs.writeFileSync(path.join(evidenceDir, 'five-dimension-result.json'), JSON.stringify(run.fiveDimensionEvaluation, null, 2));
console.log('P2_RECEIPT_FIVE_DIMENSION_PASS=PASS');
''')

print('RECEIPT_PRODUCT_DELIVERABLE_PATCH_APPLIED')
