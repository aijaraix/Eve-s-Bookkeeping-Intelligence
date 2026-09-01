export interface GoldenFact {
  factId: string;
  metric: string;
  rowLabel: string;
  statementType: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'FOOTNOTE';
  sourceAuthority: 'AUDITED_PRIMARY_STATEMENT' | 'NOTE' | 'MANAGEMENT_NARRATIVE';
  rawText: string;
  reportedScale: 'MILLIONS';
  scaleMultiplier: 1000000;
  rawAmount: number;
  normalizedValue: number;
  currency: 'EUR';
  period: 'FY 2025';
  pageNumber: number;
}

export const UNILEVER_FY2025_GOLDEN_DATASET: GoldenFact[] = [
  {
    factId: 'fct-unilever-2025-rev-1',
    metric: 'revenue',
    rowLabel: 'Turnover',
    statementType: 'INCOME_STATEMENT',
    sourceAuthority: 'AUDITED_PRIMARY_STATEMENT',
    rawText: 'Group turnover was €50,503 million in FY 2025.',
    reportedScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    rawAmount: 50503,
    normalizedValue: 50503000000,
    currency: 'EUR',
    period: 'FY 2025',
    pageNumber: 82
  },
  {
    factId: 'fct-unilever-2025-cogs-1',
    metric: 'cost_of_sales',
    rowLabel: 'Cost of sales',
    statementType: 'INCOME_STATEMENT',
    sourceAuthority: 'AUDITED_PRIMARY_STATEMENT',
    rawText: 'Cost of sales for the period was €(26,794) million.',
    reportedScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    rawAmount: -26794,
    normalizedValue: -26794000000,
    currency: 'EUR',
    period: 'FY 2025',
    pageNumber: 82
  },
  {
    factId: 'fct-unilever-2025-gp-1',
    metric: 'gross_profit',
    rowLabel: 'Gross profit',
    statementType: 'INCOME_STATEMENT',
    sourceAuthority: 'AUDITED_PRIMARY_STATEMENT',
    rawText: 'Gross profit was €23,709 million.',
    reportedScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    rawAmount: 23709,
    normalizedValue: 23709000000,
    currency: 'EUR',
    period: 'FY 2025',
    pageNumber: 82
  },
  {
    factId: 'fct-unilever-2025-op-1',
    metric: 'operating_profit',
    rowLabel: 'Operating profit',
    statementType: 'INCOME_STATEMENT',
    sourceAuthority: 'AUDITED_PRIMARY_STATEMENT',
    rawText: 'Operating profit reached €9,037 million.',
    reportedScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    rawAmount: 9037,
    normalizedValue: 9037000000,
    currency: 'EUR',
    period: 'FY 2025',
    pageNumber: 82
  },
  {
    factId: 'fct-unilever-2025-net-1',
    metric: 'net_income',
    rowLabel: 'Net profit from continuing operations',
    statementType: 'INCOME_STATEMENT',
    sourceAuthority: 'AUDITED_PRIMARY_STATEMENT',
    rawText: 'Net profit from continuing operations was €6,213 million.',
    reportedScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    rawAmount: 6213,
    normalizedValue: 6213000000,
    currency: 'EUR',
    period: 'FY 2025',
    pageNumber: 82
  },
  {
    factId: 'fct-unilever-2025-ast-1',
    metric: 'total_assets',
    rowLabel: 'Total assets',
    statementType: 'BALANCE_SHEET',
    sourceAuthority: 'AUDITED_PRIMARY_STATEMENT',
    rawText: 'Total consolidated assets were €70,471 million as of 31 December 2025.',
    reportedScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    rawAmount: 70471,
    normalizedValue: 70471000000,
    currency: 'EUR',
    period: 'FY 2025',
    pageNumber: 84
  },
  {
    factId: 'fct-unilever-2025-liab-1',
    metric: 'total_liabilities',
    rowLabel: 'Total liabilities',
    statementType: 'BALANCE_SHEET',
    sourceAuthority: 'AUDITED_PRIMARY_STATEMENT',
    rawText: 'Total liabilities were €52,884 million as of 31 December 2025.',
    reportedScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    rawAmount: 52884,
    normalizedValue: 52884000000,
    currency: 'EUR',
    period: 'FY 2025',
    pageNumber: 84
  },
  {
    factId: 'fct-unilever-2025-eq-1',
    metric: 'total_equity',
    rowLabel: 'Total equity',
    statementType: 'BALANCE_SHEET',
    sourceAuthority: 'AUDITED_PRIMARY_STATEMENT',
    rawText: 'Total equity reached €17,587 million.',
    reportedScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    rawAmount: 17587,
    normalizedValue: 17587000000,
    currency: 'EUR',
    period: 'FY 2025',
    pageNumber: 84
  },
  {
    factId: 'fct-unilever-2025-ocf-1',
    metric: 'operating_cash_flow',
    rowLabel: 'Net cash flow from operating activities',
    statementType: 'CASH_FLOW',
    sourceAuthority: 'AUDITED_PRIMARY_STATEMENT',
    rawText: 'Net cash flow generated from operating activities was €10,772 million.',
    reportedScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    rawAmount: 10772,
    normalizedValue: 10772000000,
    currency: 'EUR',
    period: 'FY 2025',
    pageNumber: 86
  },
  {
    factId: 'fct-unilever-2025-icf-1',
    metric: 'net_investing_cash_flow',
    rowLabel: 'Net cash flow used in investing activities',
    statementType: 'CASH_FLOW',
    sourceAuthority: 'AUDITED_PRIMARY_STATEMENT',
    rawText: 'Net cash flow used in investing activities was €(2,394) million.',
    reportedScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    rawAmount: -2394,
    normalizedValue: -2394000000,
    currency: 'EUR',
    period: 'FY 2025',
    pageNumber: 86
  },
  {
    factId: 'fct-unilever-2025-fcf-1',
    metric: 'net_financing_cash_flow',
    rowLabel: 'Net cash flow used in financing activities',
    statementType: 'CASH_FLOW',
    sourceAuthority: 'AUDITED_PRIMARY_STATEMENT',
    rawText: 'Net cash flow used in financing activities was €(9,884) million.',
    reportedScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    rawAmount: -9884,
    normalizedValue: -9884000000,
    currency: 'EUR',
    period: 'FY 2025',
    pageNumber: 86
  },
  {
    factId: 'fct-unilever-2025-freecf-1',
    metric: 'free_cash_flow',
    rowLabel: 'Free cash flow',
    statementType: 'CASH_FLOW',
    sourceAuthority: 'AUDITED_PRIMARY_STATEMENT',
    rawText: 'Free cash flow generated was €5,921 million.',
    reportedScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    rawAmount: 5921,
    normalizedValue: 5921000000,
    currency: 'EUR',
    period: 'FY 2025',
    pageNumber: 7
  }
];

export function verifyUnileverReconciliation(): {
  balanceSheetReconciled: boolean;
  incomeStatementReconciled: boolean;
  assets: number;
  liabilitiesPlusEquity: number;
  grossProfit: number;
  calculatedGrossProfit: number;
} {
  const datasetMap = new Map(UNILEVER_FY2025_GOLDEN_DATASET.map(f => [f.metric, f.normalizedValue]));
  
  const assets = datasetMap.get('total_assets') || 0;
  const liabilities = datasetMap.get('total_liabilities') || 0;
  const equity = datasetMap.get('total_equity') || 0;
  const liabilitiesPlusEquity = liabilities + equity;

  const revenue = datasetMap.get('revenue') || 0;
  const cogs = datasetMap.get('cost_of_sales') || 0; // Negative number
  const grossProfit = datasetMap.get('gross_profit') || 0;
  const calculatedGrossProfit = revenue + cogs;

  return {
    balanceSheetReconciled: assets === liabilitiesPlusEquity,
    incomeStatementReconciled: grossProfit === calculatedGrossProfit,
    assets,
    liabilitiesPlusEquity,
    grossProfit,
    calculatedGrossProfit
  };
}
