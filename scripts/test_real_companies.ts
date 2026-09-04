import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Ground Truth Data for Public Companies (FY2024 Form 10-K disclosures)
export const GROUND_TRUTH = {
  APPLE: {
    name: "Apple Inc.",
    ticker: "AAPL",
    currency: "USD",
    period: "FY2024",
    revenue: 391035000000,          // $391,035 Million
    costOfSales: 210352000000,      // $210,352 Million
    grossProfit: 180683000000,      // $180,683 Million
    operatingIncome: 123216000000,  // $123,216 Million
    netIncome: 93736000000,         // $93,736 Million
    totalAssets: 364980000000,      // $364,980 Million
    totalLiabilities: 308030000000, // $308,030 Million
    totalEquity: 56950000000,       // $56,950 Million
    operatingCashFlow: 118254000000 // $118,254 Million
  },
  MICROSOFT: {
    name: "Microsoft Corporation",
    ticker: "MSFT",
    currency: "USD",
    period: "FY2024",
    revenue: 245122000000,          // $245,122 Million
    costOfSales: 75829000000,       // $75,829 Million
    grossProfit: 169293000000,      // $169,293 Million
    operatingIncome: 109433000000,  // $109,433 Million
    netIncome: 88136000000,         // $88,136 Million
    totalAssets: 512163000000,      // $512,163 Million
    totalLiabilities: 243686000000, // $243,686 Million
    totalEquity: 268477000000,      // $268,477 Million
    operatingCashFlow: 118548000000 // $118,548 Million
  },
  TESLA: {
    name: "Tesla, Inc.",
    ticker: "TSLA",
    currency: "USD",
    period: "FY2024",
    revenue: 97665000000,           // $97,665 Million
    costOfSales: 80215000000,       // $80,215 Million
    grossProfit: 17450000000,       // $17,450 Million
    operatingIncome: 7091000000,    // $7,091 Million (Net income: $7,091M)
    netIncome: 7091000000,          // $7,091 Million
    totalAssets: 122070000000,      // $122,070 Million
    totalLiabilities: 53423000000,  // $53,423 Million
    totalEquity: 68647000000,       // $68,647 Million
    operatingCashFlow: 14923000000  // $14,923 Million
  }
};

export function generateCompanySpreadsheet(companyKey: keyof typeof GROUND_TRUTH): Buffer {
  const data = GROUND_TRUTH[companyKey];
  const wb = XLSX.utils.book_new();

  // Income Statement (Amounts in millions)
  const isRows = [
    [`${data.name.toUpperCase()} - CONSOLIDATED STATEMENTS OF OPERATIONS`],
    [`(In millions, except number of shares which are reflected in thousands and per share amounts)`],
    [`Years ended`, `2024`],
    [`Total net sales`, data.revenue / 1_000_000],
    [`Total cost of sales`, data.costOfSales / 1_000_000],
    [`Gross margin`, data.grossProfit / 1_000_000],
    [`Operating income`, data.operatingIncome / 1_000_000],
    [`Net income`, data.netIncome / 1_000_000]
  ];
  const wsIs = XLSX.utils.aoa_to_sheet(isRows);
  XLSX.utils.book_append_sheet(wb, wsIs, "Income Statement");

  // Balance Sheet (Amounts in millions)
  const bsRows = [
    [`${data.name.toUpperCase()} - CONSOLIDATED BALANCE SHEETS`],
    [`(In millions, except number of shares which are reflected in thousands and par value)`],
    [`As of period end`, `2024`],
    [`Total assets`, data.totalAssets / 1_000_000],
    [`Total liabilities`, data.totalLiabilities / 1_000_000],
    [`Total shareholders' equity`, data.totalEquity / 1_000_000],
    [`Total liabilities and shareholders' equity`, (data.totalLiabilities + data.totalEquity) / 1_000_000]
  ];
  const wsBs = XLSX.utils.aoa_to_sheet(bsRows);
  XLSX.utils.book_append_sheet(wb, wsBs, "Balance Sheet");

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function generateCompanyDocument(companyKey: keyof typeof GROUND_TRUTH): string {
  const data = GROUND_TRUTH[companyKey];
  return `# ${data.name} — FORM 10-K ANNUAL REPORT
COMMISSION FILE NUMBER 001-36743
FISCAL YEAR ENDED 2024

PART II — ITEM 8. FINANCIAL STATEMENTS AND SUPPLEMENTARY DATA

CONSOLIDATED STATEMENTS OF OPERATIONS
(In millions, except per share amounts)

| Line Item | 2024 |
| :--- | :--- |
| Total net sales / Revenue | $${(data.revenue / 1_000_000).toLocaleString()} |
| Cost of sales / Cost of revenue | $${(data.costOfSales / 1_000_000).toLocaleString()} |
| Gross margin / Gross profit | $${(data.grossProfit / 1_000_000).toLocaleString()} |
| Operating income / Operating profit | $${(data.operatingIncome / 1_000_000).toLocaleString()} |
| Net income | $${(data.netIncome / 1_000_000).toLocaleString()} |

CONSOLIDATED BALANCE SHEETS
(In millions, except share data)

| Line Item | As of 2024 |
| :--- | :--- |
| Cash and cash equivalents | $${(data.operatingCashFlow / 1_000_000).toLocaleString()} |
| Total assets | $${(data.totalAssets / 1_000_000).toLocaleString()} |
| Total liabilities | $${(data.totalLiabilities / 1_000_000).toLocaleString()} |
| Total stockholders' equity | $${(data.totalEquity / 1_000_000).toLocaleString()} |
| Total liabilities and equity | $${((data.totalLiabilities + data.totalEquity) / 1_000_000).toLocaleString()} |

CONSOLIDATED STATEMENTS OF CASH FLOWS
(In millions)

| Line Item | 2024 |
| :--- | :--- |
| Cash generated by operating activities | $${(data.operatingCashFlow / 1_000_000).toLocaleString()} |

Report signed off by CPA Lead Auditor on ${new Date().toISOString().split('T')[0]}.
`;
}
