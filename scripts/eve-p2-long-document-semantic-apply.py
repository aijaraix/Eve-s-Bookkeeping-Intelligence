#!/usr/bin/env python3
from pathlib import Path


def read(path):
    return Path(path).read_text()


def write(path, content):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content)


def replace_once(path, old, new):
    text = read(path)
    if old not in text:
        raise SystemExit(f'PATCH_ANCHOR_MISSING:{path}:{old[:100]!r}')
    if text.count(old) != 1:
        raise SystemExit(f'PATCH_ANCHOR_NOT_UNIQUE:{path}:{text.count(old)}')
    write(path, text.replace(old, new, 1))

ENGINE = r'''import type { FiveDimensionCheck } from './academyMinervaLab.js';

export type LongDocumentNarrativeIntent =
  | 'DOCUMENT_METADATA'
  | 'FORWARD_LOOKING_COMMENTARY'
  | 'REPORTED_FINANCIAL_STATEMENT'
  | 'REPORTED_NOTE'
  | 'ACCOUNTING_POLICY'
  | 'HYPOTHETICAL_RISK'
  | 'NON_GAAP_SUPPLEMENTAL'
  | 'UNKNOWN';

type ContextField = 'section' | 'entity' | 'period' | 'speaker' | 'author' | 'footnote' | 'narrativeIntent';

interface ContextAnchor<T = string> {
  value: T;
  sourcePage: number;
}

interface ContextState {
  section?: ContextAnchor;
  entity?: ContextAnchor;
  period?: ContextAnchor;
  speaker?: ContextAnchor;
  author?: ContextAnchor;
  footnote?: ContextAnchor;
  narrativeIntent?: ContextAnchor<LongDocumentNarrativeIntent>;
}

export interface LongDocumentPageContext {
  pageNumber: number;
  text: string;
  section: string | null;
  entity: string | null;
  period: string | null;
  speaker: string | null;
  author: string | null;
  footnote: string | null;
  narrativeIntent: LongDocumentNarrativeIntent;
  contextOrigins: Partial<Record<ContextField, number>>;
  inheritedFields: ContextField[];
  sourceCoordinate: {
    coordinateId: string;
    sourceArtifactId: string;
    sourceSha256: string;
    sourceType: 'PDF';
    pageNumber: number;
    rawLiteral: string;
    normalizedLiteral: string;
    nativeTextAvailable: true;
    evidenceMode: 'NATIVE_TEXT';
    extractionMethod: 'anydoc:pdf-native-text';
    extractionVersion: string;
  };
  evidenceRef: string;
}

export interface LongDocumentSemanticContextReview {
  reviewId: string;
  status: 'CONTEXT_LEDGER_READY' | 'BLOCKED_INSUFFICIENT_CONTEXT';
  sourceSha256: string;
  sourceArtifactId: string;
  pageCount: number;
  explicitAnchorCount: number;
  inheritedFieldCount: number;
  distinctEntityCount: number;
  distinctPeriodCount: number;
  distinctSectionCount: number;
  distinctIntentCount: number;
  pages: LongDocumentPageContext[];
  evidenceRefs: string[];
  issues: string[];
}

export interface LongDocumentSemanticQuery {
  term?: string;
  entity?: string;
  period?: string;
  sectionContains?: string;
  narrativeIntent?: LongDocumentNarrativeIntent;
  footnote?: string;
  attributionContains?: string;
}

const norm = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
const MARKER_RE = /^(SECTION|ENTITY|PERIOD|SPEAKER|AUTHOR|FOOTNOTE|INTENT)\s*:\s*(.+)$/i;
const INTENTS = new Set<LongDocumentNarrativeIntent>([
  'DOCUMENT_METADATA',
  'FORWARD_LOOKING_COMMENTARY',
  'REPORTED_FINANCIAL_STATEMENT',
  'REPORTED_NOTE',
  'ACCOUNTING_POLICY',
  'HYPOTHETICAL_RISK',
  'NON_GAAP_SUPPLEMENTAL',
  'UNKNOWN',
]);

function markerMap(text: string): Map<string, string> {
  const markers = new Map<string, string>();
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const match = rawLine.trim().match(MARKER_RE);
    if (match) markers.set(match[1].toUpperCase(), match[2].trim());
  }
  return markers;
}

function intentValue(value: string | undefined): LongDocumentNarrativeIntent {
  const candidate = norm(value).replace(/\s+/g, '_') as LongDocumentNarrativeIntent;
  return INTENTS.has(candidate) ? candidate : 'UNKNOWN';
}

function anchor(value: string | undefined, pageNumber: number): ContextAnchor | undefined {
  const trimmed = String(value || '').trim();
  return trimmed ? { value: trimmed, sourcePage: pageNumber } : undefined;
}

function copyState(state: ContextState): ContextState {
  return { ...state };
}

function originMap(state: ContextState): Partial<Record<ContextField, number>> {
  const out: Partial<Record<ContextField, number>> = {};
  for (const field of ['section', 'entity', 'period', 'speaker', 'author', 'footnote', 'narrativeIntent'] as ContextField[]) {
    const row = state[field];
    if (row) out[field] = row.sourcePage;
  }
  return out;
}

export function buildLongDocumentSemanticContext(params: {
  doc: any;
  sourceSha256: string;
  sourceArtifactId?: string;
  reviewId?: string;
}): LongDocumentSemanticContextReview {
  const sourceSha256 = String(params.sourceSha256 || '').toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sourceSha256)) throw new Error('LONG_DOCUMENT_VALID_SOURCE_SHA_REQUIRED');
  const sourceArtifactId = params.sourceArtifactId || `artifact-pdf-${sourceSha256.slice(0, 24)}`;
  const parserVersion = String(params.doc?.parser?.version || '2.0');
  const sourcePages = Array.isArray(params.doc?.pages) ? [...params.doc.pages] : [];
  sourcePages.sort((a: any, b: any) => Number(a?.page_number || 0) - Number(b?.page_number || 0));
  if (sourcePages.length < 8) throw new Error(`LONG_DOCUMENT_MINIMUM_PAGE_COUNT_NOT_MET:${sourcePages.length}`);

  const issues: string[] = [];
  const pages: LongDocumentPageContext[] = [];
  let state: ContextState = {};
  let explicitAnchorCount = 0;

  for (const page of sourcePages) {
    const pageNumber = Number(page?.page_number);
    const text = String(page?.text || '').trim();
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      issues.push(`INVALID_PAGE_NUMBER:${String(page?.page_number)}`);
      continue;
    }
    if (!text) {
      issues.push(`PAGE_${pageNumber}:EMPTY_NATIVE_TEXT`);
      continue;
    }
    const markers = markerMap(text);
    const startsSection = markers.has('SECTION');
    if (startsSection) {
      // Fail-safe boundary: attribution/footnote/intent and entity/period cannot silently bleed into a new section.
      state = {};
    }
    const apply = (marker: string, field: ContextField) => {
      const value = markers.get(marker);
      if (!value) return;
      explicitAnchorCount += 1;
      if (field === 'narrativeIntent') {
        state.narrativeIntent = { value: intentValue(value), sourcePage: pageNumber };
      } else {
        (state as any)[field] = anchor(value, pageNumber);
      }
    };
    apply('SECTION', 'section');
    apply('ENTITY', 'entity');
    apply('PERIOD', 'period');
    apply('SPEAKER', 'speaker');
    apply('AUTHOR', 'author');
    apply('FOOTNOTE', 'footnote');
    apply('INTENT', 'narrativeIntent');

    if (startsSection) {
      for (const required of ['section', 'entity', 'period', 'narrativeIntent'] as ContextField[]) {
        if (!state[required]) issues.push(`PAGE_${pageNumber}:NEW_SECTION_MISSING_${required.toUpperCase()}`);
      }
    }
    if (!state.section || !state.entity || !state.period || !state.narrativeIntent) {
      issues.push(`PAGE_${pageNumber}:CONTEXT_INCOMPLETE`);
    }

    const origins = originMap(state);
    const inheritedFields = (Object.entries(origins) as Array<[ContextField, number]>)
      .filter(([, sourcePage]) => sourcePage !== pageNumber)
      .map(([field]) => field);
    const coordinate = {
      coordinateId: `coord-${sourceSha256.slice(0, 16)}-p${pageNumber}-native-context`,
      sourceArtifactId,
      sourceSha256,
      sourceType: 'PDF' as const,
      pageNumber,
      rawLiteral: text,
      normalizedLiteral: text,
      nativeTextAvailable: true as const,
      evidenceMode: 'NATIVE_TEXT' as const,
      extractionMethod: 'anydoc:pdf-native-text' as const,
      extractionVersion: parserVersion,
    };
    pages.push({
      pageNumber,
      text,
      section: state.section?.value || null,
      entity: state.entity?.value || null,
      period: state.period?.value || null,
      speaker: state.speaker?.value || null,
      author: state.author?.value || null,
      footnote: state.footnote?.value || null,
      narrativeIntent: state.narrativeIntent?.value || 'UNKNOWN',
      contextOrigins: origins,
      inheritedFields,
      sourceCoordinate: coordinate,
      evidenceRef: `pdf:${sourceSha256}:p${pageNumber}`,
    });
  }

  const unique = (values: Array<string | null>) => new Set(values.filter((v): v is string => Boolean(v))).size;
  const evidenceRefs = pages.map(p => p.evidenceRef);
  const inheritedFieldCount = pages.reduce((sum, page) => sum + page.inheritedFields.length, 0);
  return {
    reviewId: params.reviewId || `long-document-context-${sourceSha256.slice(0, 12)}`,
    status: issues.length ? 'BLOCKED_INSUFFICIENT_CONTEXT' : 'CONTEXT_LEDGER_READY',
    sourceSha256,
    sourceArtifactId,
    pageCount: pages.length,
    explicitAnchorCount,
    inheritedFieldCount,
    distinctEntityCount: unique(pages.map(p => p.entity)),
    distinctPeriodCount: unique(pages.map(p => p.period)),
    distinctSectionCount: unique(pages.map(p => p.section)),
    distinctIntentCount: unique(pages.map(p => p.narrativeIntent)),
    pages,
    evidenceRefs,
    issues,
  };
}

export function selectLongDocumentEvidence(
  review: LongDocumentSemanticContextReview,
  query: LongDocumentSemanticQuery,
): LongDocumentPageContext[] {
  const term = norm(query.term);
  const entity = norm(query.entity);
  const period = norm(query.period);
  const section = norm(query.sectionContains);
  const footnote = norm(query.footnote);
  const attribution = norm(query.attributionContains);
  return review.pages.filter(page => {
    if (term && !norm(page.text).includes(term)) return false;
    if (entity && norm(page.entity) !== entity) return false;
    if (period && norm(page.period) !== period) return false;
    if (section && !norm(page.section).includes(section)) return false;
    if (query.narrativeIntent && page.narrativeIntent !== query.narrativeIntent) return false;
    if (footnote && norm(page.footnote) !== footnote) return false;
    if (attribution && !`${norm(page.speaker)} ${norm(page.author)}`.includes(attribution)) return false;
    return true;
  });
}

const pass = (checkId: string, label: string, evidenceRefs: string[], details: string[]): FiveDimensionCheck => ({
  checkId, label, outcome: 'PASS', evidenceRefs, details,
});

export function buildLongDocumentSemanticTargetChecks(review: LongDocumentSemanticContextReview): {
  source: FiveDimensionCheck[];
  semantic: FiveDimensionCheck[];
} {
  const coordinateIntegrity = review.pages.length >= 8 && review.pages.every(page =>
    page.sourceCoordinate.sourceType === 'PDF' &&
    page.sourceCoordinate.sourceSha256 === review.sourceSha256 &&
    page.sourceCoordinate.pageNumber === page.pageNumber &&
    page.sourceCoordinate.evidenceMode === 'NATIVE_TEXT'
  );
  if (!coordinateIntegrity || review.status !== 'CONTEXT_LEDGER_READY') {
    throw new Error(`LONG_DOCUMENT_CONTEXT_NOT_ACCEPTABLE:${review.issues.join('|')}`);
  }
  const inheritedPages = review.pages.filter(page => page.inheritedFields.length > 0);
  const keywordOnly = selectLongDocumentEvidence(review, { term: 'revenue' });
  const alphaStatement = selectLongDocumentEvidence(review, {
    term: 'revenue', entity: 'Alpha Holdings Inc.', period: 'FY 2026',
    sectionContains: 'Consolidated Statement of Operations', narrativeIntent: 'REPORTED_FINANCIAL_STATEMENT',
  });
  const betaNote = selectLongDocumentEvidence(review, {
    term: 'revenue', entity: 'Beta Subsidiary LLC', period: 'FY 2025',
    sectionContains: 'Subsidiary Revenue', narrativeIntent: 'REPORTED_NOTE',
  });
  const policyFootnote = selectLongDocumentEvidence(review, {
    term: 'revenue', entity: 'Alpha Holdings Inc.', period: 'FY 2026', footnote: '12A',
    narrativeIntent: 'ACCOUNTING_POLICY', attributionContains: 'Accounting Policy Team',
  });
  const risk = selectLongDocumentEvidence(review, {
    term: 'revenue', entity: 'Alpha Holdings Inc.', period: 'FY 2027 OUTLOOK',
    sectionContains: 'Risk Factors', narrativeIntent: 'HYPOTHETICAL_RISK', attributionContains: 'Aaron Kim',
  });
  const impossibleCrossContext = selectLongDocumentEvidence(review, {
    term: 'revenue', entity: 'Beta Subsidiary LLC', period: 'FY 2025', footnote: '12A', narrativeIntent: 'ACCOUNTING_POLICY',
  });
  if (keywordOnly.length < 8 || !alphaStatement.length || !betaNote.length || !policyFootnote.length || !risk.length || impossibleCrossContext.length) {
    throw new Error('LONG_DOCUMENT_SEMANTIC_DISAMBIGUATION_FAILED');
  }
  return {
    source: [
      pass('long-document-page-source-lineage', 'Every long-document page retains exact PDF SHA and physical page lineage', review.evidenceRefs, [
        `pages=${review.pageCount}; sha=${review.sourceSha256}; artifact=${review.sourceArtifactId}`,
      ]),
      pass('long-document-context-anchor-lineage', 'Inherited semantic context retains the physical page where each anchor originated', inheritedPages.map(p => p.evidenceRef), [
        `explicitAnchors=${review.explicitAnchorCount}; inheritedFields=${review.inheritedFieldCount}; inheritedPages=${inheritedPages.map(p => p.pageNumber).join(',')}`,
      ]),
    ],
    semantic: [
      pass('long-document-keyword-context-disambiguation', 'Semantic retrieval disambiguates identical accounting keywords by entity period section and narrative intent', [...alphaStatement, ...betaNote, ...risk].map(p => p.evidenceRef), [
        `keywordOnlyRevenuePages=${keywordOnly.map(p => p.pageNumber).join(',')}`,
        `alphaStatement=${alphaStatement.map(p => p.pageNumber).join(',')}; betaNote=${betaNote.map(p => p.pageNumber).join(',')}; risk=${risk.map(p => p.pageNumber).join(',')}`,
      ]),
      pass('long-document-footnote-attribution', 'Accounting-policy footnote retains footnote identifier author entity period and intent across continuation pages', policyFootnote.map(p => p.evidenceRef), [
        `footnotePages=${policyFootnote.map(p => p.pageNumber).join(',')}; footnote=12A; author=Accounting Policy Team`,
      ]),
      pass('long-document-cross-context-refusal', 'Impossible cross-entity and cross-period context combinations return no evidence rather than borrowing keyword matches', review.evidenceRefs, [
        'Beta FY2025 + Alpha footnote 12A accounting-policy query returned zero evidence.',
      ]),
    ],
  };
}
'''
write('server/cpaOrganization/longDocumentSemanticContextEngine.ts', ENGINE)

FIXTURE = r'''import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const outDir = process.env.LONG_DOCUMENT_ACCEPTANCE_DIR || '/tmp/eve-long-document-semantic';
fs.mkdirSync(outDir, { recursive: true });
const fixedDate = new Date('2026-09-16T00:00:00.000Z');

const pages = [
  [
    'SECTION: Document Cover and Scope',
    'ENTITY: Alpha Holdings Inc.',
    'PERIOD: FY 2026',
    'AUTHOR: Corporate Secretary',
    'INTENT: DOCUMENT_METADATA',
    'Revenue appears throughout this synthetic long-document fixture by design.',
  ],
  [
    'SECTION: Management Discussion and Outlook',
    'ENTITY: Alpha Holdings Inc.',
    'PERIOD: FY 2026',
    'SPEAKER: CEO Maya Levin',
    'INTENT: FORWARD_LOOKING_COMMENTARY',
    'Revenue growth is targeted for future periods; this is management outlook, not reported revenue.',
  ],
  [
    'Revenue target commentary continues here without repeating the section markers.',
    'Management discusses potential customer expansion and future demand.',
  ],
  [
    'SECTION: Consolidated Statement of Operations',
    'ENTITY: Alpha Holdings Inc.',
    'PERIOD: FY 2026',
    'AUTHOR: Finance Team',
    'INTENT: REPORTED_FINANCIAL_STATEMENT',
    'Revenue USD 120.0 million was reported for FY 2026.',
  ],
  [
    'Revenue USD 120.0 million remains the reported consolidated figure on this continuation page.',
    'Operating expense USD 82.0 million.',
  ],
  [
    'SECTION: Note 7 - Subsidiary Revenue',
    'ENTITY: Beta Subsidiary LLC',
    'PERIOD: FY 2025',
    'AUTHOR: Controller Daniel Ortiz',
    'INTENT: REPORTED_NOTE',
    'Revenue USD 44.0 million relates to Beta Subsidiary LLC for FY 2025.',
  ],
  [
    'Revenue USD 44.0 million is repeated on the continuation of Note 7 for Beta Subsidiary LLC.',
    'This page intentionally omits repeated entity and period markers.',
  ],
  [
    'SECTION: Note 12 - Revenue Recognition',
    'ENTITY: Alpha Holdings Inc.',
    'PERIOD: FY 2026',
    'AUTHOR: Accounting Policy Team',
    'FOOTNOTE: 12A',
    'INTENT: ACCOUNTING_POLICY',
    'Revenue is recognized when control transfers under the stated accounting policy.',
  ],
  [
    'Revenue recognition policy continues under footnote 12A without repeating markers.',
    'The policy text is not itself a reported revenue amount.',
  ],
  [
    'SECTION: Risk Factors',
    'ENTITY: Alpha Holdings Inc.',
    'PERIOD: FY 2027 OUTLOOK',
    'SPEAKER: CFO Aaron Kim',
    'INTENT: HYPOTHETICAL_RISK',
    'Revenue could decline if market conditions deteriorate; this is hypothetical risk language.',
  ],
  [
    'Revenue could also be affected by foreign exchange and supplier disruptions.',
    'This continuation page inherits the FY 2027 outlook risk context.',
  ],
  [
    'SECTION: Non-GAAP Appendix',
    'ENTITY: Alpha Holdings Inc.',
    'PERIOD: FY 2026',
    'AUTHOR: Investor Relations',
    'INTENT: NON_GAAP_SUPPLEMENTAL',
    'Adjusted revenue is shown for supplemental discussion and is not substituted for reported GAAP revenue.',
  ],
];

async function render(): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle('Eve Academy Long Document Semantic Context Fixture');
  pdf.setAuthor('Eve Academy');
  pdf.setSubject('Synthetic long-document semantic context acceptance');
  pdf.setCreator('Eve Academy deterministic fixture');
  pdf.setProducer('Eve Academy deterministic fixture');
  pdf.setCreationDate(fixedDate);
  pdf.setModificationDate(fixedDate);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (let index = 0; index < pages.length; index += 1) {
    const page = pdf.addPage([612, 792]);
    page.drawText(`EVE ACADEMY SYNTHETIC LONG DOCUMENT - PAGE ${index + 1}`, { x: 50, y: 742, size: 11, font: bold });
    let y = 700;
    for (const line of pages[index]) {
      page.drawText(line, { x: 50, y, size: 10, font, maxWidth: 512 });
      y -= 28;
    }
  }
  return Buffer.from(await pdf.save({ useObjectStreams: false }));
}

const first = await render();
const second = await render();
assert.equal(crypto.createHash('sha256').update(first).digest('hex'), crypto.createHash('sha256').update(second).digest('hex'), 'fixture PDF must be byte reproducible within the pinned generator');
const sha256 = crypto.createHash('sha256').update(first).digest('hex');
const pdfPath = path.join(outDir, 'long-document-semantic-context.pdf');
fs.writeFileSync(pdfPath, first);
const manifest = { marker: 'LONG_DOCUMENT_SEMANTIC_FIXTURE=PASS', filename: path.basename(pdfPath), sha256, bytes: first.length, pageCount: pages.length };
fs.writeFileSync(path.join(outDir, 'fixture-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('LONG_DOCUMENT_SEMANTIC_FIXTURE=PASS');
console.log(JSON.stringify(manifest));
'''
write('server/tests/generateLongDocumentSemanticFixture.ts', FIXTURE)

TEST = r'''import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AnyDocParser } from '../../src/lib/parser/anydocParser.js';
import { buildLongDocumentSemanticContext, selectLongDocumentEvidence } from '../cpaOrganization/longDocumentSemanticContextEngine.js';

const dir = process.env.LONG_DOCUMENT_ACCEPTANCE_DIR || '/tmp/eve-long-document-semantic';
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'fixture-manifest.json'), 'utf8'));
const pdfPath = path.join(dir, manifest.filename);
const buffer = fs.readFileSync(pdfPath);
const parser = new AnyDocParser();
const doc: any = await parser.parse({ filename: manifest.filename, originalName: manifest.filename, mimeType: 'application/pdf', buffer, size: buffer.length }, { detectedType: 'pdf', mimeType: 'application/pdf' });
assert.equal(doc.page_count, 12);
assert.equal(doc.pageManifests.length, 12);
assert.ok(doc.pageManifests.every((p: any) => p.native_text_available === true));
const review = buildLongDocumentSemanticContext({ doc, sourceSha256: manifest.sha256 });
assert.equal(review.status, 'CONTEXT_LEDGER_READY');
assert.equal(review.pageCount, 12);
assert.equal(review.issues.length, 0);
assert.ok(review.inheritedFieldCount > 15);
assert.ok(review.pages.every(p => p.sourceCoordinate.sourceSha256 === manifest.sha256));
assert.ok(review.pages.every(p => p.sourceCoordinate.pageNumber === p.pageNumber));

const page3 = review.pages.find(p => p.pageNumber === 3)!;
assert.equal(page3.section, 'Management Discussion and Outlook');
assert.equal(page3.entity, 'Alpha Holdings Inc.');
assert.equal(page3.period, 'FY 2026');
assert.equal(page3.speaker, 'CEO Maya Levin');
assert.equal(page3.narrativeIntent, 'FORWARD_LOOKING_COMMENTARY');
assert.equal(page3.contextOrigins.section, 2);
assert.ok(page3.inheritedFields.includes('speaker'));

const page7 = review.pages.find(p => p.pageNumber === 7)!;
assert.equal(page7.entity, 'Beta Subsidiary LLC');
assert.equal(page7.period, 'FY 2025');
assert.equal(page7.author, 'Controller Daniel Ortiz');
assert.equal(page7.contextOrigins.entity, 6);

const page9 = review.pages.find(p => p.pageNumber === 9)!;
assert.equal(page9.footnote, '12A');
assert.equal(page9.author, 'Accounting Policy Team');
assert.equal(page9.narrativeIntent, 'ACCOUNTING_POLICY');
assert.equal(page9.contextOrigins.footnote, 8);

const page11 = review.pages.find(p => p.pageNumber === 11)!;
assert.equal(page11.period, 'FY 2027 OUTLOOK');
assert.equal(page11.speaker, 'CFO Aaron Kim');
assert.equal(page11.narrativeIntent, 'HYPOTHETICAL_RISK');
assert.equal(page11.contextOrigins.speaker, 10);

const keywordOnly = selectLongDocumentEvidence(review, { term: 'revenue' });
assert.ok(keywordOnly.length >= 10, `expected broad keyword collisions, got ${keywordOnly.length}`);
const statement = selectLongDocumentEvidence(review, { term: 'revenue', entity: 'Alpha Holdings Inc.', period: 'FY 2026', sectionContains: 'Consolidated Statement of Operations', narrativeIntent: 'REPORTED_FINANCIAL_STATEMENT' });
assert.deepEqual(statement.map(p => p.pageNumber), [4, 5]);
const beta = selectLongDocumentEvidence(review, { term: 'revenue', entity: 'Beta Subsidiary LLC', period: 'FY 2025', sectionContains: 'Subsidiary Revenue', narrativeIntent: 'REPORTED_NOTE' });
assert.deepEqual(beta.map(p => p.pageNumber), [6, 7]);
const footnote = selectLongDocumentEvidence(review, { term: 'revenue', entity: 'Alpha Holdings Inc.', period: 'FY 2026', footnote: '12A', narrativeIntent: 'ACCOUNTING_POLICY', attributionContains: 'Accounting Policy Team' });
assert.deepEqual(footnote.map(p => p.pageNumber), [8, 9]);
const risk = selectLongDocumentEvidence(review, { term: 'revenue', entity: 'Alpha Holdings Inc.', period: 'FY 2027 OUTLOOK', sectionContains: 'Risk Factors', narrativeIntent: 'HYPOTHETICAL_RISK', attributionContains: 'Aaron Kim' });
assert.deepEqual(risk.map(p => p.pageNumber), [10, 11]);
const impossible = selectLongDocumentEvidence(review, { term: 'revenue', entity: 'Beta Subsidiary LLC', period: 'FY 2025', footnote: '12A', narrativeIntent: 'ACCOUNTING_POLICY' });
assert.equal(impossible.length, 0);

fs.writeFileSync(path.join(dir, 'source-semantic-truth.json'), JSON.stringify({
  marker: 'P2_LONG_DOCUMENT_SEMANTIC_SOURCE_TRUTH=PASS',
  sourceSha256: review.sourceSha256,
  review,
  selections: {
    keywordOnly: keywordOnly.map(p => p.pageNumber),
    statement: statement.map(p => p.pageNumber),
    beta: beta.map(p => p.pageNumber),
    footnote: footnote.map(p => p.pageNumber),
    risk: risk.map(p => p.pageNumber),
    impossible: impossible.map(p => p.pageNumber),
  },
}, null, 2));
console.log('P2_LONG_DOCUMENT_SEMANTIC_SOURCE_TRUTH=PASS');
'''
write('server/tests/longDocumentSemanticContext.test.ts', TEST)

ACCEPT = r'''import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { academyMinervaLab } from '../cpaOrganization/academyMinervaLab.js';
import { buildLongDocumentSemanticTargetChecks } from '../cpaOrganization/longDocumentSemanticContextEngine.js';

const dir = process.env.LONG_DOCUMENT_ACCEPTANCE_DIR || '/tmp/eve-long-document-semantic';
const truth = JSON.parse(fs.readFileSync(path.join(dir, 'source-semantic-truth.json'), 'utf8'));
assert.equal(truth.marker, 'P2_LONG_DOCUMENT_SEMANTIC_SOURCE_TRUTH=PASS');
const checks = buildLongDocumentSemanticTargetChecks(truth.review);
const report = academyMinervaLab.evaluateFiveDimensions({
  caseId: 'CURR-SEMANTIC-LONG-DOCUMENT',
  executionId: 'long-document-semantic-physical',
  dimensions: {
    SOURCE_COVERAGE: { checks: checks.source },
    SEMANTIC_UNDERSTANDING: { checks: checks.semantic },
    ACCOUNTING_ACCURACY: { checks: [{ checkId: 'long-document-accounting-not-targeted', label: 'Accounting Accuracy is outside this semantic-context fixture', outcome: 'NOT_TESTED', details: ['This case tests semantic attribution/context boundaries, not numeric accounting conclusions.'] }] },
    PRODUCT_TRUTH: { checks: [{ checkId: 'long-document-product-not-targeted', label: 'Product Truth is outside this semantic-context fixture', outcome: 'NOT_TESTED', details: ['Real dashboard Product Truth is a separate curated curriculum case.'] }] },
    DELIVERABLE_TRUTH: { checks: [{ checkId: 'long-document-deliverable-not-targeted', label: 'Deliverable Truth is outside this semantic-context fixture', outcome: 'NOT_TESTED', details: ['Final export lineage is a separate curated curriculum case.'] }] },
  },
});
assert.equal(report.dimensions.SOURCE_COVERAGE.status, 'PASS');
assert.equal(report.dimensions.SEMANTIC_UNDERSTANDING.status, 'PASS');
assert.equal(report.dimensions.ACCOUNTING_ACCURACY.status, 'NOT_TESTED');
assert.equal(report.dimensions.PRODUCT_TRUTH.status, 'NOT_TESTED');
assert.equal(report.dimensions.DELIVERABLE_TRUTH.status, 'NOT_TESTED');
assert.equal(report.passedDimensionCount, 2);
assert.equal(report.notTestedDimensionCount, 3);
assert.equal(report.overallStatus, 'INCOMPLETE_DIMENSION_COVERAGE');
fs.writeFileSync(path.join(dir, 'targeted-dimension-result.json'), JSON.stringify({ marker: 'P2_LONG_DOCUMENT_SEMANTIC_TARGETED_DIMENSIONS=PASS', report }, null, 2));
console.log('P2_LONG_DOCUMENT_SEMANTIC_TARGETED_DIMENSIONS=PASS');
'''
write('server/tests/longDocumentSemanticCurriculumAcceptance.test.ts', ACCEPT)

WIRING = r'''import assert from 'node:assert/strict';
import fs from 'node:fs';
const hybrid = fs.readFileSync('server/hybridExtraction/HybridExtractionOrchestrator.ts', 'utf8');
assert.ok(hybrid.includes('buildLongDocumentSemanticContext'));
assert.ok(hybrid.includes('semanticContextReview'));
assert.ok(hybrid.includes('physicalPagesTotal >= 8'));
console.log('LONG_DOCUMENT_SEMANTIC_RUNTIME_WIRING=PASS');
'''
write('server/tests/longDocumentSemanticRuntimeWiring.test.ts', WIRING)

# Wire the deterministic context ledger beneath the semantic/model layer for long PDFs.
replace_once('server/hybridExtraction/HybridExtractionOrchestrator.ts',
"import { applySelectivePdfOcr, shouldUsePdfOcrFallback, shouldUseSelectivePdfOcr } from '../../src/lib/parser/pdfOcrFallback.js';\n",
"import { applySelectivePdfOcr, shouldUsePdfOcrFallback, shouldUseSelectivePdfOcr } from '../../src/lib/parser/pdfOcrFallback.js';\nimport { buildLongDocumentSemanticContext } from '../cpaOrganization/longDocumentSemanticContextEngine.js';\n")
replace_once('server/hybridExtraction/HybridExtractionOrchestrator.ts',
"  sourceBlocks?: any[];\n  error?: string;\n",
"  sourceBlocks?: any[];\n  semanticContextReview?: any;\n  error?: string;\n")
replace_once('server/hybridExtraction/HybridExtractionOrchestrator.ts',
"      const physicalPagesTotal = parsedDoc.pageManifests?.length || parsedDoc.metadata.pages || 1;\n      console.log(`[HybridExtractionOrchestrator] Deterministic Physical Page Inventory: ${physicalPagesTotal} pages identified.`);\n      updateProgress('Preparing Documents', 15);\n",
"      const physicalPagesTotal = parsedDoc.pageManifests?.length || parsedDoc.metadata.pages || 1;\n      const semanticContextReview = !isSpreadsheet && physicalPagesTotal >= 8\n        ? buildLongDocumentSemanticContext({ doc: parsedDoc, sourceSha256: params.documentHash })\n        : undefined;\n      if (semanticContextReview) (parsedDoc as any).semanticContextReview = semanticContextReview;\n      console.log(`[HybridExtractionOrchestrator] Deterministic Physical Page Inventory: ${physicalPagesTotal} pages identified.`);\n      updateProgress('Preparing Documents', 15);\n")
replace_once('server/hybridExtraction/HybridExtractionOrchestrator.ts',
"        processingDurationMs: durationMs,\n        pageManifests: parsedDoc.pageManifests || [],\n        sourceBlocks: parsedDoc.sourceBlocks || []\n",
"        processingDurationMs: durationMs,\n        pageManifests: parsedDoc.pageManifests || [],\n        sourceBlocks: parsedDoc.sourceBlocks || [],\n        semanticContextReview\n")

old_case = """      caseSpec(\n        'CURR-SEMANTIC-LONG-DOCUMENT',\n        'Long-document semantic/context extraction',\n        'SEMANTIC_CONTEXT',\n        ['PDF', 'LONG_DOCUMENT', 'NARRATIVE'],\n        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING'],\n        [\n          'Preserve entity, author/speaker, section, footnote and narrative intent where material.',\n          'Do not substitute accounting keyword matching for document-level semantic context.'\n        ],\n        'PHYSICAL_FIXTURE_REQUIRED'\n      ),\n"""
new_case = """      caseSpec(\n        'CURR-SEMANTIC-LONG-DOCUMENT',\n        'Long-document semantic/context extraction',\n        'SEMANTIC_CONTEXT',\n        ['PDF', 'LONG_DOCUMENT', 'NARRATIVE'],\n        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING'],\n        [\n          'Preserve entity, author/speaker, section, footnote and narrative intent where material.',\n          'Continuation pages must inherit context only from a physically traceable prior anchor within the same section.',\n          'New sections reset prior attribution/context unless the new section explicitly establishes its own entity, period and intent.',\n          'Do not substitute accounting keyword matching for document-level semantic context; identical terms across entities, periods and intents remain distinct.',\n          'Impossible cross-entity or cross-period context combinations must return no evidence rather than borrow a nearby keyword match.'\n        ],\n        'CONTRACT_READY',\n        ['server/tests/longDocumentSemanticContext.test.ts', 'server/tests/longDocumentSemanticRuntimeWiring.test.ts', 'server/tests/longDocumentSemanticCurriculumAcceptance.test.ts', 'docs/launch/evidence/2026-09-16_P2_LONG_DOCUMENT_SEMANTIC_CONTEXT_ACCEPTANCE.md']\n      ),\n"""
replace_once('server/cpaOrganization/academyMinervaLab.ts', old_case, new_case)

replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts',
"assert.equal(coverage.contractReadyCases, 17);\nassert.equal(coverage.physicalFixturePendingCases, 3);",
"assert.equal(coverage.contractReadyCases, 18);\nassert.equal(coverage.physicalFixturePendingCases, 2);")
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts',
"assert.ok(find('CURR-ISOLATION-BULK-MIXED-CLIENT').validationRefs.includes('server/tests/clientIsolationFiveDimensionAcceptance.test.ts'));\nassert.ok(find('CURR-PRODUCT-SOURCE-TO-DASHBOARD').expectedSafeguards.join(' ').includes('actual browser-rendered value'));",
"assert.ok(find('CURR-ISOLATION-BULK-MIXED-CLIENT').validationRefs.includes('server/tests/clientIsolationFiveDimensionAcceptance.test.ts'));\nassert.equal(find('CURR-SEMANTIC-LONG-DOCUMENT').fixtureStatus, 'CONTRACT_READY');\nassert.deepEqual(find('CURR-SEMANTIC-LONG-DOCUMENT').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING']);\nassert.ok(find('CURR-SEMANTIC-LONG-DOCUMENT').expectedSafeguards.join(' ').includes('Impossible cross-entity'));\nassert.ok(find('CURR-SEMANTIC-LONG-DOCUMENT').validationRefs.includes('server/tests/longDocumentSemanticCurriculumAcceptance.test.ts'));\nassert.ok(find('CURR-PRODUCT-SOURCE-TO-DASHBOARD').expectedSafeguards.join(' ').includes('actual browser-rendered value'));")

print('LONG_DOCUMENT_SEMANTIC_PATCH_APPLIED')
