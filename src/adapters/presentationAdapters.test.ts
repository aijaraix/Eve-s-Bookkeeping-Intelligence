import assert from 'node:assert/strict';
import {
  adaptWorkspacesToClients,
  adaptWorkspacesToEngagements,
  adaptFactsToIncomeStatement,
  adaptFactsToBalanceSheet,
  deriveFinancialRatios,
  adaptBackendAgents,
  matchesFiscalPeriod
} from './presentationAdapters';

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

const simpleFacts = [
  { id: 'rev-old', canonicalMetric: 'revenue', value: 900, reportingPeriod: '2023' },
  { id: 'rev-new', canonicalMetric: 'revenue', value: 100, reportingPeriod: '2024' },
  { id: 'assets', canonicalMetric: 'total_assets', value: 40, reportingPeriod: '2024' },
  { id: 'liabilities', canonicalMetric: 'total_liabilities', value: 10, reportingPeriod: '2023' },
];
const simpleRevenue = adaptFactsToIncomeStatement(simpleFacts, 'FY 2024').find(l => l.canonicalMetric === 'revenue')!;
assert.equal(simpleRevenue.values['FY 2024'], 100);
assert.equal(simpleRevenue.factLineageId, 'rev-new');
assert.equal(simpleRevenue.verificationStatus, 'review_required');
assert.equal(adaptFactsToBalanceSheet(simpleFacts, 'FY 2024').identityCheck.totalLiabilities, null);
assert.equal(adaptFactsToIncomeStatement(simpleFacts, '2022').length, 0);
assert.equal(deriveFinancialRatios(simpleFacts, '2022').length, 0);

// Regression: Company 1 records use a fiscal-year label on the engagement but
// date/range-shaped periods and mixed XBRL/human-readable canonical metrics on facts.
const pfizerLikeFacts = [
  { id: 'rev-2024', canonicalMetric: 'Total revenues', labelOriginal: 'Total revenues', value: 63_627_000_000, reportingPeriod: '2024-01-01 to 2024-12-31', verificationStatus: 'VERIFIED', documentId: 'pfe-20241231.htm', pageNumber: 51 },
  { id: 'net-2024', canonicalMetric: 'Net income attributable to Pfizer Inc. common shareholders', labelOriginal: 'Net income attributable to Pfizer Inc. common shareholders', value: 8_031_000_000, reportingPeriod: '2024-01-01 to 2024-12-31', verificationStatus: 'VERIFIED', documentId: 'pfe-20241231.htm', pageNumber: 51 },
  { id: 'cogs-2024', canonicalMetric: 'Cost of sales', labelOriginal: 'Cost of sales', value: 17_851_000_000, reportingPeriod: '2024-01-01 to 2024-12-31', verificationStatus: 'VERIFIED', documentId: 'pfe-20241231.htm', pageNumber: 51 },
  { id: 'rd-2024', canonicalMetric: 'Research and development expenses', labelOriginal: 'Research and development expenses', value: 10_822_000_000, reportingPeriod: '2024-01-01 to 2024-12-31', verificationStatus: 'VERIFIED', documentId: 'pfe-20241231.htm', pageNumber: 51 },
  { id: 'sga-2024', canonicalMetric: 'Selling, informational and administrative expenses', labelOriginal: 'Selling, informational and administrative expenses', value: 14_730_000_000, reportingPeriod: '2024-01-01 to 2024-12-31', verificationStatus: 'VERIFIED', documentId: 'pfe-20241231.htm', pageNumber: 51 },
  { id: 'assets-2024', canonicalMetric: 'assets', labelOriginal: 'Total assets', value: 213_396_000_000, reportingPeriod: '2024-12-31', verificationStatus: 'VERIFIED', documentId: 'pfe-20241231.htm', pageNumber: 53 },
  { id: 'liabilities-2024', canonicalMetric: 'liabilities', labelOriginal: 'Total liabilities', value: 124_899_000_000, reportingPeriod: '2024-12-31', verificationStatus: 'VERIFIED', documentId: 'pfe-20241231.htm', pageNumber: 53 },
  { id: 'equity-2024', canonicalMetric: 'stockholdersEquityIncludingPortionAttributableToNoncontrollingInterest', labelOriginal: 'Total equity', value: 88_497_000_000, reportingPeriod: '2024-12-31', verificationStatus: 'VERIFIED', documentId: 'pfe-20241231.htm', pageNumber: 53 },
  { id: 'cash-2024', canonicalMetric: 'cashAndCashEquivalentsAtCarryingValue', labelOriginal: 'Cash and cash equivalents', value: 1_043_000_000, reportingPeriod: '2024-12-31', verificationStatus: 'VERIFIED', documentId: 'pfe-20241231.htm', pageNumber: 53 },
  { id: 'assets-2023', canonicalMetric: 'assets', labelOriginal: 'Total assets', value: 226_501_000_000, reportingPeriod: '2023-12-31', verificationStatus: 'VERIFIED', documentId: 'pfe-20241231.htm', pageNumber: 53 },
];

assert.equal(matchesFiscalPeriod({ reportingPeriod: '2024-12-31' }, 'FY 2024'), true);
assert.equal(matchesFiscalPeriod({ reportingPeriod: '2024-01-01 to 2024-12-31' }, 'FY 2024'), true);
assert.equal(matchesFiscalPeriod({ reportingPeriod: '2023-12-31' }, 'FY 2024'), false);

const pfizerIncome = adaptFactsToIncomeStatement(pfizerLikeFacts, 'FY 2024', 'USD');
assert.equal(pfizerIncome.find(l => l.canonicalMetric === 'revenue')?.values['FY 2024'], 63_627_000_000);
assert.equal(pfizerIncome.find(l => l.canonicalMetric === 'net_income')?.values['FY 2024'], 8_031_000_000);
assert.equal(pfizerIncome.find(l => l.canonicalMetric === 'cost_of_goods_sold')?.values['FY 2024'], 17_851_000_000);
assert.equal(pfizerIncome.find(l => l.canonicalMetric === 'research_and_development')?.values['FY 2024'], 10_822_000_000);
assert.equal(pfizerIncome.find(l => l.canonicalMetric === 'selling_general_and_administrative')?.values['FY 2024'], 14_730_000_000);
assert.equal(pfizerIncome.some(l => l.canonicalMetric === 'operating_income'), false, 'Operating income must remain absent when no direct source fact exists');

const pfizerBalance = adaptFactsToBalanceSheet(pfizerLikeFacts, 'FY 2024', 'USD');
assert.equal(pfizerBalance.identityCheck.totalAssets, 213_396_000_000);
assert.equal(pfizerBalance.identityCheck.totalLiabilities, 124_899_000_000);
assert.equal(pfizerBalance.identityCheck.totalEquity, 88_497_000_000);
assert.equal(pfizerBalance.identityCheck.variance, 0);
assert.equal(pfizerBalance.identityCheck.gateState, 'PASS');
assert.equal(pfizerBalance.lines.find(l => l.canonicalMetric === 'cash')?.values['FY 2024'], 1_043_000_000);

const pfizerRatios = deriveFinancialRatios(pfizerLikeFacts, 'FY 2024', 'USD');
assert.ok(pfizerRatios.find(r => r.id === 'ratio-net-margin'));
assert.ok(pfizerRatios.find(r => r.id === 'ratio-roe'));
assert.ok(pfizerRatios.find(r => r.id === 'ratio-debt-equity'));
assert.equal(pfizerRatios.some(r => r.id === 'ratio-op-margin'), false, 'No operating margin without a sourced operating-income fact');
console.log('PASS: fiscal-year projection hydrates date/range facts and mixed production metric aliases without inventing missing facts');

const [unmeasuredAgent, zeroAgent] = adaptBackendAgents([
  { id: 'fictional-unmeasured', name: 'Fictional Unmeasured' },
  { id: 'fictional-zero', name: 'Fictional Zero', tasksCompleted: 0, successRate: 0, reviewRatePct: 0, academyCompetencyScore: 0, learningIncidentsCount: 0, lastActivityAt: '2024-01-01T00:00:00Z' },
]);
for (const key of ['recentTasksCount', 'successRatePct', 'reviewRatePct', 'academyCompetencyScore', 'learningIncidentsCount'] as const) {
  assert.equal(unmeasuredAgent[key], null);
  assert.equal(zeroAgent[key], 0);
}
assert.equal(unmeasuredAgent.lastActivityAt, null);
assert.equal(unmeasuredAgent.status, 'NOT_MEASURED');
assert.equal(zeroAgent.lastActivityAt, '2024-01-01T00:00:00Z');
console.log('PASS: missing agent telemetry remains null; recorded zero values and timestamp preserved');
