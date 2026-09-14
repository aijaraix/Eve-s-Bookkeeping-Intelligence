import { inferGeminiMimeType } from '../hybridExtraction/GeminiFileService.js';
import { parseAndValidateDocumentMapResponse } from '../hybridExtraction/DocumentMapService.js';

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