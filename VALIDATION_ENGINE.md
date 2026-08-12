# Validation & Reconciliation Engine Specification

## Core Accounting Identity Rules

1. **Balance Sheet Reconciliation**:
   $$\text{Total Assets} = \text{Total Liabilities} + \text{Total Equity}$$
2. **Income Statement Reconciliation**:
   $$\text{Gross Profit} = \text{Revenue} - \text{Cost of Sales}$$
3. **Cash Flow Reconciliation**:
   $$\text{Free Cash Flow} = \text{Operating Cash Flow} - \text{CapEx}$$
4. **Tax Rate Reconciliation**:
   $$\text{Effective Tax Rate} = \frac{\text{Income Tax Expense}}{\text{Profit Before Tax}}$$

Statuses produced: `PASS`, `FAIL`, `WARNING`, `INSUFFICIENT_DATA`, `REVIEW_REQUIRED`.
