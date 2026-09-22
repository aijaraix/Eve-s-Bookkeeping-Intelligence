import assert from 'node:assert/strict';
import { EvidenceCrossCheckEngine } from '../hybridExtraction/EvidenceCrossCheckEngine.js';
import { deriveCurrentBalance } from '../cpaOrganization/verifiedCustomerContinuationService.js';

const candidate: any = {
  physicalPage: 31,
  sourceQuote: 'Total shareholders’ equity 73,733 56,950',
  rowLabel: 'Total shareholders’ equity',
  rawValue: '73733',
  confidence: 0.98,
};

const result = EvidenceCrossCheckEngine.verifyCandidateAgainstSource(
  candidate,
  [{ page_number: 31, native_text_available: true }],
  [{
    page_number: 31,
    raw_text: 'Total shareholders&#8217; equity 73,733 56,950',
    source_block_id: 'SB-HTML-EQUITY',
  }],
);

assert.equal(result.evidenceStatus, 'CONFIRMED');

const contextualLabel = EvidenceCrossCheckEngine.verifyCandidateAgainstSource({
  ...candidate,
  rowLabel: 'Total shareholders’ equity, ending balances',
  sourceQuote: 'Total shareholders’ equity, ending balances',
} as any, [{ page_number: 31, native_text_available: true }], [{
  page_number: 31,
  raw_text: 'Total shareholders&#8217; equity 73,733 56,950',
  source_block_id: 'SB-HTML-EQUITY',
}]);
assert.equal(contextualLabel.evidenceStatus, 'CONFIRMED');
assert.equal(result.matchedSourceBlock?.source_block_id, 'SB-HTML-EQUITY');
const appleStyleBalance = deriveCurrentBalance([
  { statementType: 'CONSOLIDATED_BALANCE_SHEET', canonicalMetric: 'Total assets', reportingPeriod: '2025-09-27', normalizedValue: 359241 },
  { statementType: 'CONSOLIDATED_BALANCE_SHEET', canonicalMetric: 'Total liabilities', reportingPeriod: '2025-09-27', normalizedValue: 285508 },
  { statementType: 'CONSOLIDATED_BALANCE_SHEET', canonicalMetric: 'Total shareholders’ equity', reportingPeriod: '2025-09-27', normalizedValue: 73733 },
] as any[], '2025');
assert.deepEqual(appleStyleBalance, { assets: 359241, liabilities: 285508, equity: 73733, variance: 0 });
console.log('HTML_ENTITY_EVIDENCE_CROSS_CHECK=PASS');
