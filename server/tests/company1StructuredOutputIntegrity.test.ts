import { inferGeminiMimeType, normalizeHtmlForGemini, MAX_NORMALIZED_HTML_CHARS } from '../hybridExtraction/GeminiFileService.js';
import { parseAndValidateDocumentMapResponse } from '../hybridExtraction/DocumentMapService.js';
import { isCapacityProviderErrorType } from '../hybridExtraction/geminiRetryHelper.js';
import { EvidenceCrossCheckEngine } from '../hybridExtraction/EvidenceCrossCheckEngine.js';
import { AnyDocParser } from '../../src/lib/parser/anydocParser.js';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function expectStructuredFailure(fn: () => unknown, label: string): void {
  let caught: any = null;
  try { fn(); } catch (err: any) { caught = err; }
  assert(!!caught, `${label}: expected failure but validation passed`);
  assert(caught.isStructuredOutputError === true, `${label}: failure was not classified as structured-output integrity error`);
}

export async function runCompany1StructuredOutputIntegrityTests(): Promise<void> {
  assert(inferGeminiMimeType('/storage/uploads/pfe-20241231.htm') === 'text/html', 'SEC .htm MIME must remain text/html');
  assert(inferGeminiMimeType('/storage/uploads/annual-report.html') === 'text/html', 'HTML MIME must remain text/html');
  assert(inferGeminiMimeType('/storage/uploads/report.pdf') === 'application/pdf', 'PDF MIME must remain application/pdf');

  const rawHtml = `<!doctype html><html><head><style>.x{display:none}</style><script>ignore()</script></head><body>
    <ix:hidden>machine-only duplicate facts 999999</ix:hidden>
    <h1>Pfizer Inc. 2024 Form 10-K</h1>
    <p>Consolidated Statements of Operations</p>
    <div>Product revenues $ 53,816 $ 50,914 $ 91,793</div>
  </body></html>`;
  const normalized = normalizeHtmlForGemini(rawHtml);
  assert(normalized.includes('Pfizer Inc. 2024 Form 10-K'), 'Normalized SEC HTML must preserve issuer/title text');
  assert(normalized.includes('Consolidated Statements of Operations'), 'Normalized SEC HTML must preserve statement headings');
  assert(normalized.includes('Product revenues $ 53,816'), 'Normalized SEC HTML must preserve visible financial text');
  assert(!normalized.includes('machine-only duplicate facts'), 'Normalized SEC HTML must remove ix:hidden payload');
  assert(!normalized.includes('ignore()'), 'Normalized SEC HTML must remove script payload');
  assert(normalized.length < rawHtml.length, 'Normalized SEC HTML should reduce markup/token footprint');
  assert(MAX_NORMALIZED_HTML_CHARS >= 1_000_000, 'Normalized HTML budget should support full SEC filings without arbitrary tiny truncation');

  assert(isCapacityProviderErrorType('RATE_LIMIT_SHORT_TERM') === true, 'Short-term rate limit must remain capacity-retryable');
  assert(isCapacityProviderErrorType('SERVICE_UNAVAILABLE') === true, '503 service unavailable must remain capacity-retryable');
  assert(isCapacityProviderErrorType('INVALID_REQUEST') === false, 'Permanent invalid request must not be mislabeled as capacity');
  assert(isCapacityProviderErrorType('AUTHENTICATION_ERROR') === false, 'Authentication error must not be mislabeled as capacity');

  const parser = new AnyDocParser();
  // Reproduce the production caller bug: HybridExtractionOrchestrator historically
  // passed application/pdf for a real .htm filing. Filename/HTML semantics must win.
  const parsedHtml = await parser.parse({
    filename: 'pfe-20241231.htm', originalName: 'pfe-20241231.htm', mimeType: 'application/pdf',
    size: Buffer.byteLength(rawHtml), buffer: Buffer.from(rawHtml)
  });
  assert(parsedHtml.source?.format === 'html', 'SEC .htm filename must override an incorrect application/pdf MIME hint');
  assert(Array.isArray(parsedHtml.sourceBlocks) && parsedHtml.sourceBlocks.length >= 3, 'HTML parser must materialize line-level deterministic source blocks');
  const revenueBlock = parsedHtml.sourceBlocks.find((b: any) => String(b.raw_text).includes('Product revenues')) as any;
  assert(!!revenueBlock, 'HTML evidence blocks must contain the visible revenue line');
  assert(String(revenueBlock.evidence_scope) === 'DOCUMENT', 'SEC HTML evidence must be explicitly document-scoped');
  assert(!parsedHtml.sourceBlocks.some((b: any) => String(b.raw_text).includes('machine-only duplicate facts')), 'Source blocks must exclude ix:hidden machine-only payload');

  const evidence = EvidenceCrossCheckEngine.verifyCandidateAgainstSource({
    physicalPage: 51,
    sourceQuote: 'Product revenues $ 53,816 $ 50,914 $ 91,793',
    rowLabel: 'Product revenues',
    rawValue: '53816',
    confidence: 0.99
  } as any, parsedHtml.pageManifests, parsedHtml.sourceBlocks);
  assert(evidence.evidenceStatus === 'CONFIRMED', 'Document-scoped HTML evidence should confirm exact same-line quote+amount evidence');
  assert(evidence.matchedPageNumber === undefined, 'Document-scoped HTML evidence must not fabricate a physical page match');
  assert(String(evidence.notes || '').includes('document-scoped'), 'Evidence notes must disclose document-scoped confirmation');

  const wrongAmount = EvidenceCrossCheckEngine.verifyCandidateAgainstSource({
    physicalPage: 51,
    sourceQuote: 'Product revenues $ 53,816 $ 50,914 $ 91,793',
    rowLabel: 'Product revenues', rawValue: '777777', confidence: 0.99
  } as any, parsedHtml.pageManifests, parsedHtml.sourceBlocks);
  assert(wrongAmount.evidenceStatus !== 'CONFIRMED', 'Matching quote/label with a nonexistent amount must not confirm the fact');

  const missingEvidence = EvidenceCrossCheckEngine.verifyCandidateAgainstSource({
    physicalPage: 51, rowLabel: 'Product revenues', rawValue: '53816', confidence: 0.99
  } as any, undefined, undefined);
  assert(missingEvidence.evidenceStatus === 'UNCONFIRMED', 'Missing evidence arrays must fail closed instead of crashing');

  const validMap = {
    documentType: 'SEC_10_K', documentTitle: 'Pfizer Inc. 2024 Form 10-K', documentIssuer: 'Pfizer Inc.',
    primaryReportingCurrency: 'USD',
    primaryStatements: [{ statementType: 'CONSOLIDATED_INCOME_STATEMENT', statementTitle: 'Consolidated Statements of Operations', physicalPageCandidates: [51] }],
    importantNotes: [{ title: 'Revenue', category: 'Revenue', physicalPages: [51] }]
  };
  const parsed = parseAndValidateDocumentMapResponse({ text: JSON.stringify(validMap), candidates: [{ finishReason: 'STOP' }] });
  assert(parsed.documentIssuer === 'Pfizer Inc.', 'Valid structured output should pass unchanged');

  expectStructuredFailure(() => parseAndValidateDocumentMapResponse({ text: '{"documentTitle":"Pfizer', candidates: [{ finishReason: 'MAX_TOKENS' }] }), 'Truncated response');
  expectStructuredFailure(() => parseAndValidateDocumentMapResponse({ text: '{"documentTitle":"Pfizer', candidates: [{ finishReason: 'STOP' }] }), 'Malformed JSON');

  const oversized = { ...validMap, importantNotes: Array.from({ length: 49 }, (_, i) => ({ title: `Note ${i + 1}`, category: 'Other', physicalPages: [1] })) };
  expectStructuredFailure(() => parseAndValidateDocumentMapResponse({ text: JSON.stringify(oversized), candidates: [{ finishReason: 'STOP' }] }), 'Oversized Document Map');

  console.log('✓ Company 1 structured-output, parser precedence, and document-scoped evidence tests passed');
}

await runCompany1StructuredOutputIntegrityTests();