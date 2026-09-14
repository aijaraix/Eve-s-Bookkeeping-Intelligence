import { inferGeminiMimeType, normalizeHtmlForGemini, MAX_NORMALIZED_HTML_CHARS } from '../hybridExtraction/GeminiFileService.js';
import { parseAndValidateDocumentMapResponse } from '../hybridExtraction/DocumentMapService.js';
import { isCapacityProviderErrorType } from '../hybridExtraction/geminiRetryHelper.js';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function expectStructuredFailure(fn: () => unknown, label: string): void {
  let caught: any = null;
  try {
    fn();
  } catch (err: any) {
    caught = err;
  }
  assert(!!caught, `${label}: expected failure but validation passed`);
  assert(caught.isStructuredOutputError === true, `${label}: failure was not classified as structured-output integrity error`);
}

export function runCompany1StructuredOutputIntegrityTests(): void {
  assert(inferGeminiMimeType('/storage/uploads/pfe-20241231.htm') === 'text/html', 'SEC .htm MIME must remain text/html');
  assert(inferGeminiMimeType('/storage/uploads/annual-report.html') === 'text/html', 'HTML MIME must remain text/html');
  assert(inferGeminiMimeType('/storage/uploads/report.pdf') === 'application/pdf', 'PDF MIME must remain application/pdf');

  const rawHtml = `<!doctype html><html><head><style>.x{display:none}</style><script>ignore()</script></head><body>
    <ix:hidden>machine-only duplicate facts 999999</ix:hidden>
    <h1>Pfizer Inc. 2024 Form 10-K</h1>
    <p>Consolidated Statements of Operations</p>
    <div>Total revenues $63.6 billion</div>
  </body></html>`;
  const normalized = normalizeHtmlForGemini(rawHtml);
  assert(normalized.includes('Pfizer Inc. 2024 Form 10-K'), 'Normalized SEC HTML must preserve issuer/title text');
  assert(normalized.includes('Consolidated Statements of Operations'), 'Normalized SEC HTML must preserve statement headings');
  assert(normalized.includes('Total revenues $63.6 billion'), 'Normalized SEC HTML must preserve visible financial text');
  assert(!normalized.includes('machine-only duplicate facts'), 'Normalized SEC HTML must remove ix:hidden payload');
  assert(!normalized.includes('ignore()'), 'Normalized SEC HTML must remove script payload');
  assert(normalized.length < rawHtml.length, 'Normalized SEC HTML should reduce markup/token footprint');
  assert(MAX_NORMALIZED_HTML_CHARS >= 1_000_000, 'Normalized HTML budget should support full SEC filings without arbitrary tiny truncation');

  assert(isCapacityProviderErrorType('RATE_LIMIT_SHORT_TERM') === true, 'Short-term rate limit must remain capacity-retryable');
  assert(isCapacityProviderErrorType('SERVICE_UNAVAILABLE') === true, '503 service unavailable must remain capacity-retryable');
  assert(isCapacityProviderErrorType('INVALID_REQUEST') === false, 'Permanent invalid request must not be mislabeled as capacity');
  assert(isCapacityProviderErrorType('AUTHENTICATION_ERROR') === false, 'Authentication error must not be mislabeled as capacity');

  const validMap = {
    documentType: 'SEC_10_K',
    documentTitle: 'Pfizer Inc. 2024 Form 10-K',
    documentIssuer: 'Pfizer Inc.',
    primaryReportingCurrency: 'USD',
    primaryStatements: [
      {
        statementType: 'CONSOLIDATED_INCOME_STATEMENT',
        statementTitle: 'Consolidated Statements of Operations',
        physicalPageCandidates: [1]
      }
    ],
    importantNotes: [
      { title: 'Revenue', category: 'Revenue', physicalPages: [1] }
    ]
  };

  const parsed = parseAndValidateDocumentMapResponse({
    text: JSON.stringify(validMap),
    candidates: [{ finishReason: 'STOP' }]
  });
  assert(parsed.documentIssuer === 'Pfizer Inc.', 'Valid structured output should pass unchanged');

  expectStructuredFailure(
    () => parseAndValidateDocumentMapResponse({ text: '{"documentTitle":"Pfizer', candidates: [{ finishReason: 'MAX_TOKENS' }] }),
    'Truncated response'
  );

  expectStructuredFailure(
    () => parseAndValidateDocumentMapResponse({ text: '{"documentTitle":"Pfizer', candidates: [{ finishReason: 'STOP' }] }),
    'Malformed JSON'
  );

  const oversized = {
    ...validMap,
    importantNotes: Array.from({ length: 49 }, (_, i) => ({ title: `Note ${i + 1}`, category: 'Other', physicalPages: [1] }))
  };
  expectStructuredFailure(
    () => parseAndValidateDocumentMapResponse({ text: JSON.stringify(oversized), candidates: [{ finishReason: 'STOP' }] }),
    'Oversized Document Map'
  );

  console.log('✓ Company 1 structured-output integrity regression tests passed');
}

runCompany1StructuredOutputIntegrityTests();