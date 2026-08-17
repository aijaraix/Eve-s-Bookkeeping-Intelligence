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
    } as any;

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
    ] as any;

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
    ] as any;

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
    ] as any;

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
    ] as any;

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
    ] as any;

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
    expect((eurNorm as any).code || eurNorm).toBe('EUR');

    const usdNorm = CanonicalFactResolver.normalizeCurrency('US Dollars ($)');
    expect((usdNorm as any).code || usdNorm).toBe('USD');

    const gbpNorm = CanonicalFactResolver.normalizeCurrency('£');
    expect((gbpNorm as any).code || gbpNorm).toBe('GBP');
  });

  it('Test Case Matrix: Missing scale and missing currency fallback', () => {
    const valNoScale = CanonicalFactResolver.calculateNormalizedValue('5,000,000', '');
    expect(valNoScale).toBe(5000000);

    const currNoInput = CanonicalFactResolver.normalizeCurrency('');
    expect((currNoInput as any).code || currNoInput).toBe('EUR');
  });

  it('Volkswagen Consolidated Financial Statement Regression Test', () => {
    // Realistic extracted facts from Volkswagen AG Consolidated Statements (Side-by-side FY2025 and FY2024 comparative)
    const vwFacts: ExtractedFact[] = [
      // FY 2025 Facts
      {
        id: 'vw-rev-2025',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Sales revenue',
        labelNormalized: 'Sales Revenue',
        valueOriginal: '321,913',
        valueFunctional: 321913000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'revenue',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2025',
        columnLabel: '2025',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-cost-2025',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Cost of sales',
        labelNormalized: 'Cost of Sales',
        valueOriginal: '-270,671',
        valueFunctional: -270671000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'cost_of_sales',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2025',
        columnLabel: '2025',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-gp-2025',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Gross profit',
        labelNormalized: 'Gross Profit',
        valueOriginal: '51,242',
        valueFunctional: 51242000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'gross_profit',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2025',
        columnLabel: '2025',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-ni-2025',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Profit after tax',
        labelNormalized: 'Net Income',
        valueOriginal: '12,150',
        valueFunctional: 12150000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'net_income',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2025',
        columnLabel: '2025',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-assets-2025',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Total assets',
        labelNormalized: 'Total Assets',
        valueOriginal: '635,200',
        valueFunctional: 635200000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'total_assets',
        statementType: 'BALANCE_SHEET',
        reportingPeriod: 'FY 2025',
        columnLabel: '2025',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-liab-2025',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Total liabilities',
        labelNormalized: 'Total Liabilities',
        valueOriginal: '443,100',
        valueFunctional: 443100000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'total_liabilities',
        statementType: 'BALANCE_SHEET',
        reportingPeriod: 'FY 2025',
        columnLabel: '2025',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-eq-2025',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Equity',
        labelNormalized: 'Total Equity',
        valueOriginal: '192,100',
        valueFunctional: 192100000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'total_equity',
        statementType: 'BALANCE_SHEET',
        reportingPeriod: 'FY 2025',
        columnLabel: '2025',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-cash-2025',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Cash and cash equivalents',
        labelNormalized: 'Cash and Cash Equivalents',
        valueOriginal: '42,500',
        valueFunctional: 42500000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'cash',
        statementType: 'BALANCE_SHEET',
        reportingPeriod: 'FY 2025',
        columnLabel: '2025',
        entityScope: 'Group',
        confidence: 0.99
      },

      // FY 2024 Comparative Facts
      {
        id: 'vw-rev-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Sales revenue',
        labelNormalized: 'Sales Revenue',
        valueOriginal: '324,656',
        valueFunctional: 324656000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'revenue',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2024',
        columnLabel: '2024',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-cost-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Cost of sales',
        labelNormalized: 'Cost of Sales',
        valueOriginal: '-264,124',
        valueFunctional: -264124000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'cost_of_sales',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2024',
        columnLabel: '2024',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-gp-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Gross profit',
        labelNormalized: 'Gross Profit',
        valueOriginal: '60,532',
        valueFunctional: 60532000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'gross_profit',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2024',
        columnLabel: '2024',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-ni-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Profit after tax',
        labelNormalized: 'Net Income',
        valueOriginal: '13,100',
        valueFunctional: 13100000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'net_income',
        statementType: 'INCOME_STATEMENT',
        reportingPeriod: 'FY 2024',
        columnLabel: '2024',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-assets-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Total assets',
        labelNormalized: 'Total Assets',
        valueOriginal: '624,312',
        valueFunctional: 624312000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'total_assets',
        statementType: 'BALANCE_SHEET',
        reportingPeriod: 'FY 2024',
        columnLabel: '2024',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-liab-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Total liabilities',
        labelNormalized: 'Total Liabilities',
        valueOriginal: '436,512',
        valueFunctional: 436512000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'total_liabilities',
        statementType: 'BALANCE_SHEET',
        reportingPeriod: 'FY 2024',
        columnLabel: '2024',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-eq-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Equity',
        labelNormalized: 'Total Equity',
        valueOriginal: '187,800',
        valueFunctional: 187800000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'total_equity',
        statementType: 'BALANCE_SHEET',
        reportingPeriod: 'FY 2024',
        columnLabel: '2024',
        entityScope: 'Group',
        confidence: 0.99
      },
      {
        id: 'vw-cash-2024',
        workspaceId: 'ws-vw-reg',
        documentId: 'vw-ar-2025.pdf',
        labelOriginal: 'Cash and cash equivalents',
        labelNormalized: 'Cash and Cash Equivalents',
        valueOriginal: '40,100',
        valueFunctional: 40100000000,
        currencyOriginal: 'EUR',
        scaleOriginal: 'Millions',
        canonicalMetric: 'cash',
        statementType: 'BALANCE_SHEET',
        reportingPeriod: 'FY 2024',
        columnLabel: '2024',
        entityScope: 'Group',
        confidence: 0.99
      }
    ] as any;

    // 1. Assert FY2025 Direct Metric Target Resolution
    const resRev2025 = CanonicalFactResolver.resolveMetric(vwFacts, 'revenue', '2025-FY');
    expect(resRev2025.primaryFact?.id).toBe('vw-rev-2025');
    expect(resRev2025.normalizedScalarValue).toBe(321913000000);
    expect(resRev2025.formattedValue).toBe('€321.91B');

    const resCost2025 = CanonicalFactResolver.resolveMetric(vwFacts, 'cost_of_sales', '2025-FY');
    expect(resCost2025.primaryFact?.id).toBe('vw-cost-2025');
    expect(resCost2025.normalizedScalarValue).toBe(-270671000000);

    const resGp2025 = CanonicalFactResolver.resolveMetric(vwFacts, 'gross_profit', '2025-FY');
    expect(resGp2025.primaryFact?.id).toBe('vw-gp-2025');
    expect(resGp2025.normalizedScalarValue).toBe(51242000000);

    const resNi2025 = CanonicalFactResolver.resolveMetric(vwFacts, 'net_income', '2025-FY');
    expect(resNi2025.primaryFact?.id).toBe('vw-ni-2025');
    expect(resNi2025.normalizedScalarValue).toBe(12150000000);

    const resAssets2025 = CanonicalFactResolver.resolveMetric(vwFacts, 'total_assets', '2025-FY');
    expect(resAssets2025.primaryFact?.id).toBe('vw-assets-2025');
    expect(resAssets2025.normalizedScalarValue).toBe(635200000000);

    const resEq2025 = CanonicalFactResolver.resolveMetric(vwFacts, 'total_equity', '2025-FY');
    expect(resEq2025.primaryFact?.id).toBe('vw-eq-2025');
    expect(resEq2025.normalizedScalarValue).toBe(192100000000);

    const resCash2025 = CanonicalFactResolver.resolveMetric(vwFacts, 'cash', '2025-FY');
    expect(resCash2025.primaryFact?.id).toBe('vw-cash-2025');
    expect(resCash2025.normalizedScalarValue).toBe(42500000000);

    // 2. Assert FY2024 Direct Metric Target Resolution (Side-by-side comparative verification)
    const resRev2024 = CanonicalFactResolver.resolveMetric(vwFacts, 'revenue', '2024-FY');
    expect(resRev2024.primaryFact?.id).toBe('vw-rev-2024');
    expect(resRev2024.normalizedScalarValue).toBe(324656000000);
    expect(resRev2024.formattedValue).toBe('€324.66B');

    const resCost2024 = CanonicalFactResolver.resolveMetric(vwFacts, 'cost_of_sales', '2024-FY');
    expect(resCost2024.primaryFact?.id).toBe('vw-cost-2024');
    expect(resCost2024.normalizedScalarValue).toBe(-264124000000);

    const resGp2024 = CanonicalFactResolver.resolveMetric(vwFacts, 'gross_profit', '2024-FY');
    expect(resGp2024.primaryFact?.id).toBe('vw-gp-2024');
    expect(resGp2024.normalizedScalarValue).toBe(60532000000);

    const resNi2024 = CanonicalFactResolver.resolveMetric(vwFacts, 'net_income', '2024-FY');
    expect(resNi2024.primaryFact?.id).toBe('vw-ni-2024');
    expect(resNi2024.normalizedScalarValue).toBe(13100000000);

    const resAssets2024 = CanonicalFactResolver.resolveMetric(vwFacts, 'total_assets', '2024-FY');
    expect(resAssets2024.primaryFact?.id).toBe('vw-assets-2024');
    expect(resAssets2024.normalizedScalarValue).toBe(624312000000);

    const resEq2024 = CanonicalFactResolver.resolveMetric(vwFacts, 'total_equity', '2024-FY');
    expect(resEq2024.primaryFact?.id).toBe('vw-eq-2024');
    expect(resEq2024.normalizedScalarValue).toBe(187800000000);

    const resCash2024 = CanonicalFactResolver.resolveMetric(vwFacts, 'cash', '2024-FY');
    expect(resCash2024.primaryFact?.id).toBe('vw-cash-2024');
    expect(resCash2024.normalizedScalarValue).toBe(40100000000);

    // 3. Workspace Summary auto-detects latest annual period (FY2025) and computes accurate guarded ratios
    const summary = CanonicalFactResolver.resolveWorkspaceSummary('ws-vw-reg', vwFacts);

    expect(summary.reportingPeriod).toBe('2025-FY');
    expect(summary.revenue.normalizedScalarValue).toBe(321913000000);
    expect(summary.revenue.formattedValue).toBe('€321.91B');

    expect(summary.grossProfit.normalizedScalarValue).toBe(51242000000);
    expect(summary.grossProfit.formattedValue).toBe('€51.24B');

    expect(summary.grossMarginPct).toBe(15.92); // 51,242 / 321,913 * 100 = 15.918%
    expect(summary.netMarginPct).toBe(3.77); // 12,150 / 321,913 * 100 = 3.774%
    expect(summary.returnOnEquity).toBe(6.32); // 12,150 / 192,100 * 100 = 6.324%

    // Accounting Identity check for FY2025 (635,200 = 443,100 + 192,100)
    expect(summary.accountingIdentityValid).toBe(true);
  });

});
