import assert from 'node:assert/strict';
import { AcademyDashboardTruthAuditor } from '../cpaOrganization/academyDashboardTruthAuditor';

const fact = { id: 'synthetic-revenue', status: 'APPROVED', verificationStatus: 'VERIFIED', evidenceStatus: 'CONFIRMED',
  labelOriginal: 'Revenue', documentId: 'fixture', sourceText: 'Synthetic company revenue: USD 1,200,000 for FY2024.',
  reportingPeriod: 'FY2024', functionalCurrency: 'USD', valueFunctional: 1200000 };
const row = { label: 'Revenue', declaredLabel: 'Revenue', visibleValue: '$1,200,000', period: 'FY2024', currency: 'USD', scale: 'Source units',
  factId: fact.id, factLineageId: fact.id, metric: 'revenue', renderId: 'render-fixture', verification: 'verified', operands: [] };
let rendered: any[] = [row];
const page = { $$eval: async () => rendered, url: () => 'https://test.invalid/', viewport: () => ({ width: 390, height: 844 }) };
const auditor = new AcademyDashboardTruthAuditor(page as any, 'https://test.invalid/');
const engagement = { facts: [fact], documents: [{ id: 'fixture', sha256: 'a'.repeat(64) }] };
assert.equal((await auditor.gradeFinancialScreen(engagement, 'synthetic.png')).pass, true);
for (const change of [{ visibleValue: '$1.2' }, { period: 'FY2025' }, { currency: 'EUR' }, { renderId: undefined }, { visibleValue: '—' }, { period: 'Q1 2024' }, { scale: 'Millions' }, { label: 'Assets' }, { factId: 'missing' }]) {
  rendered = [{ ...row, ...change }];
  assert.equal((await auditor.gradeFinancialScreen(engagement, 'synthetic.png')).pass, false, JSON.stringify(change));
}
rendered = [];
await assert.rejects(() => auditor.gradeFinancialScreen(engagement, 'synthetic.png'), /FALSE_EMPTY/);
console.log('PASS: financial truth grader rejects false-empty, wrong value/scale, period, currency and lineage.');
