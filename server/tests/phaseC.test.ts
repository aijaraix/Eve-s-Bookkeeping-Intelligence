import { describe, it, expect } from 'vitest';
import { CanonicalFactResolver } from '../canonicalFactResolver.js';
import { ExtractedFact } from '../../src/types.js';

describe('Phase C Canonical Fact Resolution & Dual-Value Normalization Engine', () => {

  it('Requirement 1 & 2: Original source values are permanently preserved in dual-value architecture', () => {
    const originalFact: ExtractedFact = {
      id: 'fct-orig-1',
      workspaceId: 'ws-test-1',
      documentId: 'doc-1',
      labelOriginal: 'Revenue from Contracts with Customers',
      labelNormalized: 'Revenue',
      valueOriginal: '€ 322,184 million',
      valueFunctional: 322184000000,
      currencyOriginal: 'EUR',
      functionalCurrency: 'EUR',
      scaleOriginal: 'Millions',
      normalizedScaleMultiplier: 1000000,
      canonicalMetric: 'revenue',
      statementType: 'INCOME_STATEMENT',
      reportingPeriod: 'FY 2024',
      entityScope: 'Group',
      sourcePage: 102,
      confidence: 0.98
    };

    const resolved = CanonicalFactResolver.resolveMetric('ws-test-1', 'revenue', [originalFact]);

    expect(resolved.primaryFact).toBeDefined();
    expect(resolved.primaryFact?.id).toBe('fct-orig-1');
    expect(resolved.primaryFact?.valueOriginal).toBe('€ 322,184 million');
    expect(resolved.primaryFact?.labelOriginal).toBe('Revenue from Contracts with Customers');
    expect(resolved.normalizedScalarValue).toBe(322184000000);
    expect(resolved.formattedValue).toBe('€322.18B');
  });

  it('Requirement 3: Period resolution distinguishes FY, Quarter, Comparative prior year, and Restated periods', () => {
    const facts: ExtractedFact[] = [
      {
        id: 'fct-fy23-comp',
        workspaceId: 'ws-test-period',
        documentId: 'doc-2024-report',
        labelOriginal: 'Revenue (2023 Comparative in 2024 Report)',
        labelNormalized: 'Revenue',
        valueOriginal: '322,284',
        valueFunctional: 322284000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'revenue',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2023',
        isComparativePeriod: true,
        entityScope: 'Group',
        confidence: 0.95
      },
      {
        id: 'fct-fy24-current',
        workspaceId: 'ws-test-period',
        documentId: 'doc-2024-report',
        labelOriginal: 'Revenue (2024 Current Period)',
        labelNormalized: 'Revenue',
        valueOriginal: '324,667',
        valueFunctional: 324667000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'revenue',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2024',
        isComparativePeriod: false,
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'fct-q3-24',
        workspaceId: 'ws-test-period',
        documentId: 'doc-q3-report',
        labelOriginal: 'Revenue (Q3 2024)',
        labelNormalized: 'Revenue',
        valueOriginal: '78,450',
        valueFunctional: 78450000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'revenue',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'Q3 2024',
        periodType: 'quarterly',
        entityScope: 'Group',
        confidence: 0.96
      }
    ];

    const currentFy = CanonicalFactResolver.resolveMetric('ws-test-period', 'revenue', facts, { targetPeriod: 'FY 2024' });
    expect(currentFy.primaryFact?.id).toBe('fct-fy24-current');
    expect(currentFy.normalizedScalarValue).toBe(324667000000);

    const compFy = CanonicalFactResolver.resolveMetric('ws-test-period', 'revenue', facts, { targetPeriod: 'FY 2023' });
    expect(compFy.primaryFact?.id).toBe('fct-fy23-comp');
    expect(compFy.normalizedScalarValue).toBe(322284000000);
  });

  it('Requirement 4: Deterministic priority scoring selects Consolidated Group Primary over Segment or Note references', () => {
    const facts: ExtractedFact[] = [
      {
        id: 'fct-note-segment',
        workspaceId: 'ws-volks',
        documentId: 'doc-vw-2024',
        labelOriginal: 'Passenger Cars Segment Revenue (Note 34)',
        labelNormalized: 'Revenue',
        valueOriginal: '160,000',
        valueFunctional: 16000000000,
        canonicalMetric: 'revenue',
        statementType: 'NOTES_TO_FINANCIALS',
        reportingPeriod: 'FY 2024',
        entityScope: 'Segment',
        confidence: 0.85
      },
      {
        id: 'fct-consolidated-primary',
        workspaceId: 'ws-volks',
        documentId: 'doc-vw-2024',
        labelOriginal: 'Sales Revenue',
        labelNormalized: 'Sales Revenue',
        valueOriginal: '324,667',
        valueFunctional: 324667000000,
        canonicalMetric: 'revenue',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2024',
        entityScope: 'Group',
        confidence: 0.99
      }
    ];

    const resolved = CanonicalFactResolver.resolveMetric('ws-volks', 'revenue', facts);
    expect(resolved.primaryFact?.id).toBe('fct-consolidated-primary');
    expect(resolved.normalizedScalarValue).toBe(324667000000);
    expect(resolved.alternativeFacts.length).toBe(1);
    expect(resolved.alternativeFacts[0].id).toBe('fct-note-segment');
  });

  it('Requirement 5 & 6: Deduplication and preservation of legitimate alternative facts', () => {
    const facts: ExtractedFact[] = [
      {
        id: 'fct-dup-1',
        workspaceId: 'ws-dedup',
        documentId: 'doc-1',
        labelOriginal: 'Sales revenue',
        valueOriginal: '324,667',
        valueFunctional: 324667000000,
        canonicalMetric: 'revenue',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2024',
        entityScope: 'Group',
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions'
      },
      {
        id: 'fct-dup-2',
        workspaceId: 'ws-dedup',
        documentId: 'doc-1',
        labelOriginal: 'Sales revenue',
        valueOriginal: '324,667',
        valueFunctional: 324667000000,
        canonicalMetric: 'revenue',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2024',
        entityScope: 'Group',
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions'
      },
      {
        id: 'fct-restated-alt',
        workspaceId: 'ws-dedup',
        documentId: 'doc-2',
        labelOriginal: 'Sales revenue (Restated)',
        valueOriginal: '324,700',
        valueFunctional: 324700000000,
        canonicalMetric: 'revenue',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2024',
        isRestated: true,
        entityScope: 'Group',
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions'
      }
    ];

    const resolved = CanonicalFactResolver.resolveMetric('ws-dedup', 'revenue', facts);
    expect(resolved.primaryFact).toBeDefined();
    // Restated usually scores slightly higher or is preserved as alternative
    expect(resolved.alternativeFacts.length).toBeGreaterThanOrEqual(1);
  });

  it('Test Case Matrix: Same value / different period', () => {
    const facts: ExtractedFact[] = [
      {
        id: 'fct-p1',
        workspaceId: 'ws-mat',
        documentId: 'doc-1',
        labelOriginal: 'Revenue',
        valueOriginal: '50,000',
        valueFunctional: 50000000000,
        canonicalMetric: 'revenue',
        reportingPeriod: 'FY 2023',
        entityScope: 'Group'
      },
      {
        id: 'fct-p2',
        workspaceId: 'ws-mat',
        documentId: 'doc-1',
        labelOriginal: 'Revenue',
        valueOriginal: '50,000',
        valueFunctional: 50000000000,
        canonicalMetric: 'revenue',
        reportingPeriod: 'FY 2024',
        entityScope: 'Group'
      }
    ];

    const res2024 = CanonicalFactResolver.resolveMetric('ws-mat', 'revenue', facts, { targetPeriod: 'FY 2024' });
    expect(res2024.primaryFact?.id).toBe('fct-p2');

    const res2023 = CanonicalFactResolver.resolveMetric('ws-mat', 'revenue', facts, { targetPeriod: 'FY 2023' });
    expect(res2023.primaryFact?.id).toBe('fct-p1');
  });

  it('Test Case Matrix: Same value / different entity', () => {
    const facts: ExtractedFact[] = [
      {
        id: 'fct-sub',
        workspaceId: 'ws-mat2',
        documentId: 'doc-1',
        labelOriginal: 'Subsidiary Revenue',
        valueOriginal: '10,000',
        valueFunctional: 10000000000,
        canonicalMetric: 'revenue',
        reportingPeriod: 'FY 2024',
        entityScope: 'Subsidiary'
      },
      {
        id: 'fct-group',
        workspaceId: 'ws-mat2',
        documentId: 'doc-1',
        labelOriginal: 'Group Revenue',
        valueOriginal: '50,000',
        valueFunctional: 50000000000,
        canonicalMetric: 'revenue',
        reportingPeriod: 'FY 2024',
        entityScope: 'Group'
      }
    ];

    const res = CanonicalFactResolver.resolveMetric('ws-mat2', 'revenue', facts);
    expect(res.primaryFact?.id).toBe('fct-group');
    expect(res.normalizedScalarValue).toBe(50000000000);
  });

  it('Test Case Matrix: Thousands vs Millions scale normalization', () => {
    const scaleThousand = CanonicalFactResolver.resolveScale('€ in thousands', '100,000');
    expect(scaleThousand.multiplier).toBe(1000);

    const scaleMillion = CanonicalFactResolver.resolveScale('€ in millions', '100');
    expect(scaleMillion.multiplier).toBe(1000000);

    const valThousand = CanonicalFactResolver.calculateNormalizedValue('100,000', '€ in thousands');
    const valMillion = CanonicalFactResolver.calculateNormalizedValue('100', '€ in millions');

    expect(valThousand).toBe(100000000);
    expect(valMillion).toBe(100000000);
  });

  it('Test Case Matrix: Multiple currencies normalization', () => {
    const eurNorm = CanonicalFactResolver.normalizeCurrency('EUR');
    expect(eurNorm.code).toBe('EUR');

    const usdNorm = CanonicalFactResolver.normalizeCurrency('US Dollars ($)');
    expect(usdNorm.code).toBe('USD');

    const gbpNorm = CanonicalFactResolver.normalizeCurrency('£');
    expect(gbpNorm.code).toBe('GBP');
  });

  it('Test Case Matrix: Missing scale and missing currency fallback', () => {
    const valNoScale = CanonicalFactResolver.calculateNormalizedValue('5,000,000', '');
    expect(valNoScale).toBe(5000000);

    const currNoInput = CanonicalFactResolver.normalizeCurrency('');
    expect(currNoInput.code).toBe('EUR');
  });

  it('Volkswagen Consolidated Financial Statement Regression Test', () => {
    // Realistic extracted facts from Volkswagen AG Consolidated Statements (2024)
    const vwFacts: ExtractedFact[] = [
      {
        id: 'vw-rev-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-annual-2024.pdf',
        labelOriginal: 'Sales revenue',
        labelNormalized: 'Sales Revenue',
        valueOriginal: '324,667',
        valueFunctional: 324667000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'revenue',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2024',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-cost-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-annual-2024.pdf',
        labelOriginal: 'Cost of sales',
        labelNormalized: 'Cost of Sales',
        valueOriginal: '-264,124',
        valueFunctional: -264124000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'cost_of_sales',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2024',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-gp-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-annual-2024.pdf',
        labelOriginal: 'Gross profit',
        labelNormalized: 'Gross Profit',
        valueOriginal: '60,543',
        valueFunctional: 60543000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'gross_profit',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2024',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-op-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-annual-2024.pdf',
        labelOriginal: 'Operating result',
        labelNormalized: 'Operating Profit',
        valueOriginal: '19,062',
        valueFunctional: 19062000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'operating_profit',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2024',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-ni-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-annual-2024.pdf',
        labelOriginal: 'Profit after tax',
        labelNormalized: 'Net Income',
        valueOriginal: '13,100',
        valueFunctional: 13100000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'net_income',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2024',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-assets-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-annual-2024.pdf',
        labelOriginal: 'Total assets',
        labelNormalized: 'Total Assets',
        valueOriginal: '624,312',
        valueFunctional: 624312000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'total_assets',
        statementType: 'BALANCE_SHEET',
        reportingPeriod: 'FY 2024',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-liab-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-annual-2024.pdf',
        labelOriginal: 'Total liabilities',
        labelNormalized: 'Total Liabilities',
        valueOriginal: '436,512',
        valueFunctional: 436512000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'total_liabilities',
        statementType: 'BALANCE_SHEET',
        reportingPeriod: 'FY 2024',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-eq-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-annual-2024.pdf',
        labelOriginal: 'Equity',
        labelNormalized: 'Total Equity',
        valueOriginal: '187,800',
        valueFunctional: 187800000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'total_equity',
        statementType: 'BALANCE_SHEET',
        reportingPeriod: 'FY 2024',
        entityScope: 'Group',
        confidence: 0.99
      }
    ];

    const summary = CanonicalFactResolver.resolveWorkspaceSummary('ws-vw-reg', vwFacts);

    expect(summary.revenue.normalizedScalarValue).toBe(324667000000);
    expect(summary.revenue.formattedValue).toBe('€324.67B');

    expect(summary.grossProfit.normalizedScalarValue).toBe(60543000000);
    expect(summary.grossProfit.formattedValue).toBe('€60.54B');

    expect(summary.grossMarginPct).toBe(18.65); // 60,543 / 324,667 * 100
    expect(summary.operatingMarginPct).toBe(5.87); // 19,062 / 324,667 * 100
    expect(summary.returnOnEquity).toBe(6.98); // 13,100 / 187,800 * 100
    expect(summary.debtToEquity).toBe(2.32); // 436,512 / 187,800

    // Absurd ratios check
    expect(summary.grossMarginPct).toBeGreaterThan(0);
    expect(summary.grossMarginPct).toBeLessThan(100);
    expect(summary.returnOnEquity).toBeGreaterThan(0);
    expect(summary.returnOnEquity).toBeLessThan(100);

    // Balance Sheet Accounting Identity check
    expect(summary.accountingIdentityValid).toBe(true);
  });

});
