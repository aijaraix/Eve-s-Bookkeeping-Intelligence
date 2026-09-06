export interface UnileverGoldenFact {
  factId: string;
  metric: string;
  rowLabel: string;
  rawAmount: string;
  normalizedValue: number;
  currency: string;
  period: string;
  pageNumber: number;
  rawText: string;
}

export const UNILEVER_FY2025_GOLDEN_DATASET: UnileverGoldenFact[] = [
  {
    factId: "unilever-rev-2025",
    metric: "revenue",
    rowLabel: "Turnover (continuing operations)",
    rawAmount: "50503",
    normalizedValue: 50503000000,
    currency: "EUR",
    period: "FY2025",
    pageNumber: 124,
    rawText: "Group Turnover was €50,503 million for continuing operations."
  },
  {
    factId: "unilever-cos-2025",
    metric: "cost_of_sales",
    rowLabel: "Cost of sales",
    rawAmount: "26794",
    normalizedValue: 26794000000,
    currency: "EUR",
    period: "FY2025",
    pageNumber: 124,
    rawText: "Cost of sales was €26,794 million."
  },
  {
    factId: "unilever-gp-2025",
    metric: "gross_profit",
    rowLabel: "Gross profit",
    rawAmount: "23709",
    normalizedValue: 23709000000,
    currency: "EUR",
    period: "FY2025",
    pageNumber: 124,
    rawText: "Gross profit was €23,709 million."
  },
  {
    factId: "unilever-assets-2025",
    metric: "total_assets",
    rowLabel: "Total assets",
    rawAmount: "70471",
    normalizedValue: 70471000000,
    currency: "EUR",
    period: "FY2025",
    pageNumber: 126,
    rawText: "Total assets stood at €70,471 million."
  },
  {
    factId: "unilever-liab-2025",
    metric: "total_liabilities",
    rowLabel: "Total liabilities",
    rawAmount: "52884",
    normalizedValue: 52884000000,
    currency: "EUR",
    period: "FY2025",
    pageNumber: 126,
    rawText: "Total liabilities were €52,884 million."
  },
  {
    factId: "unilever-eq-2025",
    metric: "total_equity",
    rowLabel: "Total equity",
    rawAmount: "17587",
    normalizedValue: 17587000000,
    currency: "EUR",
    period: "FY2025",
    pageNumber: 126,
    rawText: "Total equity was €17,587 million."
  }
];

export function verifyUnileverReconciliation() {
  const assets = 70471000000;
  const liabilities = 52884000000;
  const equity = 17587000000;
  const liabilitiesPlusEquity = liabilities + equity;
  const revenue = 50503000000;
  const costOfSales = 26794000000;
  const grossProfit = 23709000000;
  const calculatedGrossProfit = revenue - costOfSales;

  return {
    balanceSheetReconciled: assets === liabilitiesPlusEquity,
    assets,
    liabilities,
    equity,
    liabilitiesPlusEquity,
    incomeStatementReconciled: grossProfit === calculatedGrossProfit,
    grossProfit,
    calculatedGrossProfit,
    revenue,
    costOfSales
  };
}
