import assert from 'node:assert/strict';
import { extractComplementaryPrimaryStatementCandidates } from '../hybridExtraction/HybridExtractionOrchestrator.js';

const parsedDoc = {
  raw_text: 'NVIDIA Corporation 2025 Consolidated Financial Statements (In millions, except per share data). Lease terms can extend to 2060.',
  tables: [{
    pageNumber: 1,
    rows: [
      ['CONSOLIDATED BALANCE SHEETS'],
      ['Total assets', '111,601', '65,728'],
      ['Total liabilities', '32,274', '22,750'],
      ["Total shareholders' equity", '79,327', '42,978'],
      ["Total liabilities and shareholders' equity", '111,601', '65,728']
    ]
  }]
};
const facts = extractComplementaryPrimaryStatementCandidates(parsedDoc, {
  period: '', currency: 'USD', reportingEntity: 'NVIDIA Corporation'
});
assert.deepEqual(facts.map(f => [f.canonicalMetricCandidate, f.rawValue, f.scale]), [
  ['totalAssets', '111,601', 'millions'],
  ['totalLiabilities', '32,274', 'millions'],
  ['totalEquity', '79,327', 'millions']
]);
assert(facts.every(f => f.statementType === 'CONSOLIDATED_BALANCE_SHEET' && f.reportingScope === 'CONSOLIDATED'));
assert(facts.every(f => f.period === 'FY 2025'));
console.log('COMPLEMENTARY_HYBRID_STATEMENT_CANDIDATES=PASS');
