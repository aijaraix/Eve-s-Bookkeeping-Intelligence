import type { FiveDimensionCheck } from './academyMinervaLab.js';

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
