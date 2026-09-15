import assert from 'node:assert/strict';
import { adaptWorkspacesToClients, adaptWorkspacesToEngagements, adaptFactsToIncomeStatement, adaptFactsToBalanceSheet, deriveFinancialRatios } from './presentationAdapters';

const scopes = [
  { id: 'eng-a', engagementId: 'eng-a', workspaceId: 'ws-a', name: 'Fictional A', isCustomer: true, period: 'FY 2024', documentsCount: 2, canonicalFactsCount: 3 },
  { id: 'eng-b', engagementId: 'eng-b', workspaceId: 'ws-b', name: 'Fictional B', isCustomer: false, classification: 'CANARY' },
];
const clients = adaptWorkspacesToClients(scopes);
assert.equal(clients[0].id, 'eng-a');
assert.equal(clients[0].category, 'REAL_CUSTOMER');
assert.equal(clients[1].category, 'TEST_FIXTURE');
assert.equal(clients[1].latestPeriod, 'Period not recorded');
const engagements = adaptWorkspacesToEngagements(scopes, 999, 999, 0);
assert.equal(engagements[0].id, 'eng-a');
assert.equal(engagements[0].readinessState, 'REVIEW_REQUIRED');
assert.equal(engagements[0].factsCount, 3);
assert.equal(engagements[1].factsCount, 0);
assert.equal(engagements[1].documentsCount, 0);
const facts = [
  { id: 'rev-old', canonicalMetric: 'revenue', value: 900, reportingPeriod: '2023' },
  { id: 'rev-new', canonicalMetric: 'revenue', value: 100, reportingPeriod: '2024' },
  { id: 'assets', canonicalMetric: 'total_assets', value: 40, reportingPeriod: '2024' },
  { id: 'liabilities', canonicalMetric: 'total_liabilities', value: 10, reportingPeriod: '2023' },
];
const revenue = adaptFactsToIncomeStatement(facts, 'FY 2024').find(l => l.canonicalMetric === 'revenue')!;
assert.equal(revenue.values['FY 2024'], 100);
assert.equal(revenue.factLineageId, 'rev-new');
assert.equal(revenue.verificationStatus, 'review_required');
assert.equal(adaptFactsToBalanceSheet(facts, 'FY 2024').identityCheck.totalLiabilities, null);
assert.equal(adaptFactsToIncomeStatement(facts, '2022').length, 0);
assert.equal(deriveFinancialRatios(facts, '2022').length, 0);
console.log('PASS: presentation identity, scope counts, period isolation, missing operands and review truth');
