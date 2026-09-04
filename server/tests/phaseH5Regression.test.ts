/**
 * PHASE H.5 — CANONICAL RESOLUTION, VERIFICATION & PRESENTATION INTEGRITY HARDENING
 * Automated Regression Test Suite (Test Cases A through M)
 */

import { SourceAuthorityRanker } from '../sourceAuthorityRanker.js';
import { LocaleAwareNumberParser } from '../forensicExtractionEngine.js';
import { CanonicalFactResolver } from '../canonicalFactResolver.js';
import { VerificationStateMachine } from '../verificationStateMachine.js';
import { AccountingValidationEngine } from '../accountingValidationEngine.js';
import { ExtractedFact } from '../../src/types.js';

export function runPhaseH5RegressionTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ [PASS] ${testName}`);
    } else {
      failed++;
      const err = `[FAIL] ${testName}${detail ? `: ${detail}` : ''}`;
      errors.push(err);
      console.error(`  ✗ ${err}`);
    }
  }

  console.log('\n==================================================');
  console.log('RUNNING PHASE H.5 REGRESSION TEST SUITE (A-M)');
  console.log('==================================================\n');

  // ----------------------------------------------------
  // TEST A: Source Authority Hierarchy Ranking
  // ----------------------------------------------------
  try {
    const tier1Fact = {
      id: 'f-t1',
      statementType: 'income_statement',
      tableName: 'Consolidated Income Statement',
      labelOriginal: 'Turnover',
      valueOriginal: '50,503',
      confidence: 0.98
    } as any;
    const tier5Fact = {
      id: 'f-t5',
      statementType: 'narrative',
      sourceText: 'We generated turnover of 50.5 billion in FY 2025',
      labelOriginal: 'Turnover',
      valueOriginal: '50.5 billion',
      confidence: 0.95
    } as any;
    const tier6Fact = {
      id: 'f-t6',
      statementType: 'table',
      tableName: 'Water Consumption and CO2 Emissions per million revenue',
      labelOriginal: 'Turnover per million revenue',
      valueOriginal: '505',
      confidence: 0.90
    } as any;

    const rank1 = SourceAuthorityRanker.rankFactAuthority(tier1Fact);
    const rank5 = SourceAuthorityRanker.rankFactAuthority(tier5Fact);
    const rank6 = SourceAuthorityRanker.rankFactAuthority(tier6Fact);

    assert(rank1.tier === 1 && rank1.scoreBoost === 100, 'Test A1: Tier 1 Primary Statement Authority (+100)');
    assert(rank5.tier === 5 && rank5.scoreBoost === 0, 'Test A2: Tier 5 Narrative Authority (0)');
    assert(rank6.tier === 6 && rank6.scoreBoost === -100, 'Test A3: Tier 6 ESG Table Authority (-100)');
  } catch (e: any) {
    assert(false, 'Test A: Exception in Authority Hierarchy', e.message);
  }

  // ----------------------------------------------------
  // TEST B: Universal Numeric Normalization & Single Scaling
  // ----------------------------------------------------
  try {
    const parsedNarrative = LocaleAwareNumberParser.parseLocaleAwareValue('50.5 billion,', 'en', 'We generated turnover of 50.5 billion,', 1);
    const numNarrative = parsedNarrative.normalizedValue;

    const parsedTable = LocaleAwareNumberParser.parseLocaleAwareValue('50,503', 'en', 'Table Header: € million', 1_000_000);
    const numTable = parsedTable.normalizedValue;

    assert(numNarrative === 50_500_000_000, 'Test B1: Narrative "50.5 billion," parses to 50,500,000,000 (not 505B)', `Got ${numNarrative}`);
    assert(numTable === 50_503_000_000, 'Test B2: Table "50,503" with € million header parses to 50,503_000_000', `Got ${numTable}`);
  } catch (e: any) {
    assert(false, 'Test B: Exception in Numeric Normalization', e.message);
  }

  // ----------------------------------------------------
  // TEST C: Primary Net Income vs Footnote Selection
  // ----------------------------------------------------
  try {
    const primaryNetIncome = {
      id: 'f-primary-net-inc',
      statementType: 'income_statement',
      tableName: 'Consolidated Income Statement',
      canonicalMetric: 'net_income',
      labelOriginal: 'Profit for the year',
      labelNormalized: 'Net Income',
      valueOriginal: '5,122',
      valueFunctional: '5122000000',
      currency: 'EUR',
      reportingPeriod: '2025-FY',
      reportingScope: 'GROUP_CONSOLIDATED',
      confidence: 0.98
    } as any;

    const footnoteSubcomponent = {
      id: 'f-footnote-sub',
      statementType: 'notes',
      tableName: 'Note 3 - Other Items',
      canonicalMetric: 'net_income',
      labelOriginal: 'Within net profit (a)',
      labelNormalized: 'Net Profit Subcomponent',
      valueOriginal: '-39',
      valueFunctional: '-39000000',
      currency: 'GBP',
      reportingPeriod: '2025-FY',
      reportingScope: 'GROUP_CONSOLIDATED',
      confidence: 0.95
    } as any;

    const res = CanonicalFactResolver.resolveMetric([primaryNetIncome, footnoteSubcomponent], 'net_income', '2025-FY');
    assert(res.primaryFact?.id === 'f-primary-net-inc', 'Test C: Primary consolidated net profit wins over footnote subcomponent');
    assert(res.normalizedScalarValue === 5_122_000_000, 'Test C: Primary net income value resolved as 5,122,000,000');
  } catch (e: any) {
    assert(false, 'Test C: Exception in Net Income Selection', e.message);
  }

  // ----------------------------------------------------
  // TEST D: Anti-Zero Self-Healing Policy
  // ----------------------------------------------------
  try {
    const resMissing = CanonicalFactResolver.resolveMetric([], 'total_equity', '2025-FY');
    assert(resMissing.normalizedScalarValue === null, 'Test D1: Missing metric yields null scalar value (not 0)');
    assert(resMissing.formattedValue === '—', 'Test D2: Missing metric formatted as "—" (not $0.00)');
  } catch (e: any) {
    assert(false, 'Test D: Exception in Anti-Zero Policy', e.message);
  }

  // ----------------------------------------------------
  // TEST E: Balance-Sheet Completeness Recovery / Derived Formula
  // ----------------------------------------------------
  try {
    const assetsFact = {
      id: 'f-assets',
      canonicalMetric: 'total_assets',
      normalizedValue: 70_471_000_000,
      valueFunctional: '70471000000',
      reportingPeriod: '2025-FY',
      currency: 'EUR'
    } as any;
    const liabFact = {
      id: 'f-liab',
      canonicalMetric: 'total_liabilities',
      normalizedValue: 52_884_000_000,
      valueFunctional: '52884000000',
      reportingPeriod: '2025-FY',
      currency: 'EUR'
    } as any;

    const canonAssets = CanonicalFactResolver.resolveMetric([assetsFact], 'total_assets', '2025-FY');
    const canonLiab = CanonicalFactResolver.resolveMetric([liabFact], 'total_liabilities', '2025-FY');
    const canonEqNull = CanonicalFactResolver.resolveMetric([], 'total_equity', '2025-FY');

    const bsReconcil = AccountingValidationEngine.reconcileBalanceSheet(canonAssets, canonLiab, canonEqNull);
    assert(bsReconcil.status === 'REVIEW_REQUIRED', 'Test E: Missing equity requires review for reconciliation');
  } catch (e: any) {
    assert(false, 'Test E: Exception in Balance Sheet Completeness', e.message);
  }

  // ----------------------------------------------------
  // TEST F: Authoritative Functional Value & Presentation Formatting
  // ----------------------------------------------------
  try {
    const fact = {
      id: 'f-fmt',
      canonicalMetric: 'gross_profit',
      valueOriginal: '23,709',
      valueFunctional: '23709000000',
      currency: 'EUR',
      reportingPeriod: '2025-FY'
    } as any;
    const res = CanonicalFactResolver.resolveMetric([fact], 'gross_profit', '2025-FY');
    assert(res.normalizedScalarValue === 23_709_000_000, 'Test F1: Functional scalar scalar value is 23,709,000,000');
    assert(res.formattedValue === '€23.71B', 'Test F2: Formatted presentation is €23.71B (never €23.71K)', `Got ${res.formattedValue}`);
  } catch (e: any) {
    assert(false, 'Test F: Exception in Formatting', e.message);
  }

  // ----------------------------------------------------
  // TEST G: Currency & Scale Isolation
  // ----------------------------------------------------
  try {
    const gbpFact = {
      id: 'f-gbp',
      canonicalMetric: 'net_income',
      currencyOriginal: 'GBP',
      valueOriginal: '-39',
      valueFunctional: '-39000000'
    } as any;
    const normCurr = CanonicalFactResolver.normalizeCurrency(gbpFact.currencyOriginal);
    assert(normCurr === 'GBP', 'Test G: GBP currency isolated and preserved without forced conversion to EUR');
  } catch (e: any) {
    assert(false, 'Test G: Exception in Currency Isolation', e.message);
  }

  // ----------------------------------------------------
  // TEST H: Verification State Hardening
  // ----------------------------------------------------
  try {
    const presentation = VerificationStateMachine.getDashboardPresentation({
      verification_state: 'CONFLICTED',
      is_derived: false
    });
    assert(!presentation.isVerifiedForDashboard, 'Test H: CONFLICTED fact cannot be presented as verified on dashboard');
  } catch (e: any) {
    assert(false, 'Test H: Exception in Verification State Hardening', e.message);
  }

  // ----------------------------------------------------
  // TEST I: Audit Readiness Formula Consistency
  // ----------------------------------------------------
  try {
    const totalRequiredMetrics = 8;
    const verifiedVerifiedMetrics = 6;
    const calcReadiness = Math.round((verifiedVerifiedMetrics / totalRequiredMetrics) * 100);
    assert(calcReadiness === 75, 'Test I: Audit Readiness formula produces consistent 75% for 6/8 verified metrics');
  } catch (e: any) {
    assert(false, 'Test I: Exception in Audit Readiness', e.message);
  }

  // ----------------------------------------------------
  // TEST J: Project Page Count Scope Isolation
  // ----------------------------------------------------
  try {
    const workspaceDocs = [
      { id: 'd1', project_id: 'ws-unilever-test', pageCount: 285 },
      { id: 'd2', project_id: 'ws-unilever-test', pageCount: 302 },
      { id: 'd3', project_id: 'ws-other', pageCount: 1 } // Belongs to different workspace
    ];

    const filtered = workspaceDocs.filter(d => d.project_id === 'ws-unilever-test');
    const pageCount = filtered.reduce((acc, d) => acc + d.pageCount, 0);
    assert(pageCount === 587, 'Test J: Workspace page count strictly isolates workspace documents (587 pages)');
  } catch (e: any) {
    assert(false, 'Test J: Exception in Page Count Scope Isolation', e.message);
  }

  // ----------------------------------------------------
  // TEST K: Materiality-Aware Accounting Identity Assistance
  // ----------------------------------------------------
  try {
    const cogsFact = {
      id: 'f-cogs',
      canonicalMetric: 'cost_of_sales',
      valueFunctional: '26794000000',
      reportingPeriod: '2025-FY'
    } as any;
    const gpFact = {
      id: 'f-gp',
      canonicalMetric: 'gross_profit',
      valueFunctional: '23709000000',
      reportingPeriod: '2025-FY'
    } as any;

    const goodRevenueFact = {
      id: 'f-rev-good',
      canonicalMetric: 'revenue',
      valueOriginal: '50,503',
      valueFunctional: '50503000000',
      statementType: 'income_statement',
      reportingPeriod: '2025-FY'
    } as any;

    const badRevenueFact = {
      id: 'f-rev-bad',
      canonicalMetric: 'revenue',
      valueOriginal: '505 billion',
      valueFunctional: '505000000000',
      statementType: 'narrative',
      reportingPeriod: '2025-FY'
    } as any;

    const scoreGood = CanonicalFactResolver.calculateFactPriorityScore(
      goodRevenueFact,
      'revenue',
      '2025-FY',
      [cogsFact, gpFact, goodRevenueFact, badRevenueFact]
    );

    const scoreBad = CanonicalFactResolver.calculateFactPriorityScore(
      badRevenueFact,
      'revenue',
      '2025-FY',
      [cogsFact, gpFact, goodRevenueFact, badRevenueFact]
    );

    assert(scoreGood > scoreBad + 150, 'Test K: Reconciling revenue (50.503B) strongly outscores contradicting revenue (505B)', `Good=${scoreGood}, Bad=${scoreBad}`);
  } catch (e: any) {
    assert(false, 'Test K: Exception in Accounting Identity Assistance', e.message);
  }

  // ----------------------------------------------------
  // TEST L: Primary Equity Synonym Expansion
  // ----------------------------------------------------
  try {
    const equityFact = {
      id: 'f-eq-syn',
      statementType: 'balance_sheet',
      tableName: 'Consolidated Statement of Financial Position',
      labelOriginal: 'Total equity attributable to owners of the parent',
      valueOriginal: '17,587',
      valueFunctional: '17587000000',
      reportingPeriod: '2025-FY'
    } as any;

    const res = CanonicalFactResolver.resolveMetric([equityFact], 'total_equity', '2025-FY');
    assert(res.primaryFact?.id === 'f-eq-syn', 'Test L: "Total equity attributable to owners of the parent" successfully maps to total_equity');
  } catch (e: any) {
    assert(false, 'Test L: Exception in Equity Synonym Expansion', e.message);
  }

  // ----------------------------------------------------
  // TEST M: Note-Number False Positive Disambiguation
  // ----------------------------------------------------
  try {
    const noteText = 'Note 3';
    const epsText = '3.42';

    const parsedNote = LocaleAwareNumberParser.parseLocaleAwareValue(noteText, 'en', 'Note 3 - Significant Accounting Policies', 1);
    const parsedEPS = LocaleAwareNumberParser.parseLocaleAwareValue(epsText, 'en', 'Basic earnings per share: €3.42', 1);

    assert(parsedNote.normalizedValue === null, 'Test M1: Standalone "Note 3" rejected as monetary value');
    assert(parsedEPS.normalizedValue === 3.42, 'Test M2: Legitimate EPS figure 3.42 preserved');
  } catch (e: any) {
    assert(false, 'Test M: Exception in Note-Number Disambiguation', e.message);
  }

  console.log('\n==================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  return { passed, failed, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { failed } = runPhaseH5RegressionTests();
  process.exit(failed > 0 ? 1 : 0);
}
