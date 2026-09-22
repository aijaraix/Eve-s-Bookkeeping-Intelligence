import assert from 'node:assert/strict';
import { mergeComplementaryExtractedFacts } from '../worker.js';

const base: any = {
  workspaceId: 'ws-issuer', documentId: 'doc-issuer', functionalCurrency: 'USD',
  reportingPeriod: '2025-FY', verificationStatus: 'CANONICAL_SELECTED'
};
const modelIncome: any[] = [
  { ...base, id: 'income-revenue', canonicalMetric: 'revenue', normalizedValue: 130497000000, statementType: 'INCOME_STATEMENT' },
  { ...base, id: 'income-gross-profit', canonicalMetric: 'gross_profit', normalizedValue: 97858000000, statementType: 'INCOME_STATEMENT' }
];
const deterministicTables: any[] = [
  { ...base, id: 'duplicate-revenue', canonicalMetric: 'revenue', valueFunctional: '130497000000', statementType: 'INCOME_STATEMENT' },
  { ...base, id: 'balance-assets', canonicalMetric: 'total_assets', valueFunctional: '111601000000', statementType: 'BALANCE_SHEET' },
  { ...base, id: 'balance-liabilities', canonicalMetric: 'total_liabilities', valueFunctional: '32274000000', statementType: 'BALANCE_SHEET' },
  { ...base, id: 'balance-equity', canonicalMetric: 'total_equity', valueFunctional: '79327000000', statementType: 'BALANCE_SHEET' }
];

const merged = mergeComplementaryExtractedFacts(modelIncome as any, deterministicTables as any);
assert.equal(merged.length, 5, 'partial model output must be complemented without duplicating the same semantic fact');
assert.deepEqual(merged.filter((f: any) => f.statementType === 'BALANCE_SHEET').map((f: any) => f.canonicalMetric), [
  'total_assets', 'total_liabilities', 'total_equity'
]);
assert.equal(merged.filter((f: any) => f.canonicalMetric === 'revenue').length, 1);
console.log('COMPLEMENTARY_STATEMENT_EXTRACTION=PASS');
