/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — SNOWFLAKE DATA TRUTH RECONCILIATION
 * 
 * Designates the authoritative SEC Form 10-K filing as the operational accounting truth.
 * Grounded in physical SEC filing bytes (SHA-256: aba0f42c1a355c12c9b17a4be1a99107c1504a5b94df757af253d967dd590353).
 */

import { cleanSlateRehearsalPipeline } from './cleanSlateRehearsalPipeline.js';

export interface SnowflakeMetricReconciliation {
  metricName: string;
  authoritativeValueUsd: number;
  formattedDisplay: string;
  sourceFiling: string;
  secFilingLocation: string;
  sourceElementRef: string;
  canonicalFactId: string;
  canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH';
  xbrlTag?: string;
  auditNotes: string;
}

export class SnowflakeTruthReconciliationService {
  private static instance: SnowflakeTruthReconciliationService;

  private constructor() {}

  public static getInstance(): SnowflakeTruthReconciliationService {
    if (!SnowflakeTruthReconciliationService.instance) {
      SnowflakeTruthReconciliationService.instance = new SnowflakeTruthReconciliationService();
    }
    return SnowflakeTruthReconciliationService.instance;
  }

  public getMetrics(): SnowflakeMetricReconciliation[] {
    const res = cleanSlateRehearsalPipeline.getCurrentResult();
    const ops = res.statementsReconciliation.operations;
    const bs = res.statementsReconciliation.balanceSheet;
    const cf = res.statementsReconciliation.cashFlow;
    const seg = res.statementsReconciliation.segmentsAndGeography;

    return [
      {
        metricName: 'Total Revenues (FY 2025)',
        authoritativeValueUsd: ops.revenueUsd,
        formattedDisplay: '$3,626,396,000',
        sourceFiling: 'Snowflake Inc. Form 10-K (FY ended Jan 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Statements of Operations (p. 84, Row 1)',
        sourceElementRef: 'elem-snow-sec-is-rev',
        canonicalFactId: 'FACT-SNOW-2025-REVENUE-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax',
        auditNotes: 'Verified against physical SEC filing. Tie-out: Product ($3.46B) + Professional Services ($164M) = $3.626B.'
      },
      {
        metricName: 'Product Revenue (FY 2025)',
        authoritativeValueUsd: seg.productRevenueUsd,
        formattedDisplay: '$3,462,422,000',
        sourceFiling: 'Snowflake Inc. Form 10-K (FY ended Jan 31, 2025)',
        secFilingLocation: 'Note 3: Revenue, Disaggregation Table',
        sourceElementRef: 'elem-snow-sec-note3-prodrev',
        canonicalFactId: 'FACT-SNOW-2025-PRODREV-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:ProductRevenue',
        auditNotes: 'Represents 95.48% of total consolidated revenue.'
      },
      {
        metricName: 'Professional Services & Other Revenue',
        authoritativeValueUsd: seg.professionalServicesRevenueUsd,
        formattedDisplay: '$163,974,000',
        sourceFiling: 'Snowflake Inc. Form 10-K (FY ended Jan 31, 2025)',
        secFilingLocation: 'Note 3: Revenue, Disaggregation Table',
        sourceElementRef: 'elem-snow-sec-note3-profserv',
        canonicalFactId: 'FACT-SNOW-2025-PROFSERV-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:ServiceRevenue',
        auditNotes: 'Represents 4.52% of total consolidated revenue.'
      },
      {
        metricName: 'Gross Profit (FY 2025)',
        authoritativeValueUsd: ops.grossProfitUsd,
        formattedDisplay: '$2,411,723,000',
        sourceFiling: 'Snowflake Inc. Form 10-K (FY ended Jan 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Statements of Operations (p. 84, Row 3)',
        sourceElementRef: 'elem-snow-sec-is-gp',
        canonicalFactId: 'FACT-SNOW-2025-GROSSPROFIT-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:GrossProfit',
        auditNotes: 'Verified mathematical tie-out: $3,626,396k - $1,214,673k = $2,411,723k (Gross margin 66.50%).'
      },
      {
        metricName: 'Operating Loss (FY 2025)',
        authoritativeValueUsd: ops.operatingLossUsd,
        formattedDisplay: '$(1,456,010,000)',
        sourceFiling: 'Snowflake Inc. Form 10-K (FY ended Jan 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Statements of Operations (p. 84, Row 9)',
        sourceElementRef: 'elem-snow-sec-is-oploss',
        canonicalFactId: 'FACT-SNOW-2025-OPLOSS-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:OperatingIncomeLoss',
        auditNotes: 'Tie-out: Gross Profit ($2,411,723k) - Total Opex ($3,867,733k) = Operating Loss ($(1,456,010k)).'
      },
      {
        metricName: 'Net Loss Attributable to Snowflake Inc.',
        authoritativeValueUsd: ops.netLossCommonUsd,
        formattedDisplay: '$(1,285,640,000)',
        sourceFiling: 'Snowflake Inc. Form 10-K (FY ended Jan 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Statements of Operations (p. 84, Row 17)',
        sourceElementRef: 'elem-snow-sec-is-netloss',
        canonicalFactId: 'FACT-SNOW-2025-NETLOSS-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:NetIncomeLoss',
        auditNotes: 'Consolidated net loss $(1,289,212k) less noncontrolling interest $(3,572k).'
      },
      {
        metricName: 'Total Assets (as of Jan 31, 2025)',
        authoritativeValueUsd: bs.totalAssetsUsd,
        formattedDisplay: '$9,033,938,000',
        sourceFiling: 'Snowflake Inc. Form 10-K (FY ended Jan 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Balance Sheets (p. 83, Row 15)',
        sourceElementRef: 'elem-snow-sec-bs-assets',
        canonicalFactId: 'FACT-SNOW-2025-ASSETS-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:Assets',
        auditNotes: 'Current Assets ($5,869,372k) + Noncurrent Assets ($3,164,566k) = $9,033,938k.'
      },
      {
        metricName: 'Total Liabilities (as of Jan 31, 2025)',
        authoritativeValueUsd: bs.totalLiabilitiesUsd,
        formattedDisplay: '$6,027,295,000',
        sourceFiling: 'Snowflake Inc. Form 10-K (FY ended Jan 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Balance Sheets (p. 83, Row 27)',
        sourceElementRef: 'elem-snow-sec-bs-liab',
        canonicalFactId: 'FACT-SNOW-2025-LIAB-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:Liabilities',
        auditNotes: 'Current Liabilities ($3,301,183k) + Convertible Senior Notes ($2,271,529k) + Other ($454,583k).'
      },
      {
        metricName: 'Total Stockholders’ Equity',
        authoritativeValueUsd: bs.totalStockholdersEquityUsd,
        formattedDisplay: '$3,006,643,000',
        sourceFiling: 'Snowflake Inc. Form 10-K (FY ended Jan 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Balance Sheets (p. 83, Row 38)',
        sourceElementRef: 'elem-snow-sec-bs-equity',
        canonicalFactId: 'FACT-SNOW-2025-EQUITY-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
        auditNotes: 'Snowflake Stockholders’ Equity ($2,999,929k) + Noncontrolling Interest ($6,714k).'
      },
      {
        metricName: 'Operating Cash Flow (FY 2025)',
        authoritativeValueUsd: cf.operatingCashFlowUsd,
        formattedDisplay: '$959,764,000',
        sourceFiling: 'Snowflake Inc. Form 10-K (FY ended Jan 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Statements of Cash Flows (p. 87)',
        sourceElementRef: 'elem-snow-sec-cf-operating',
        canonicalFactId: 'FACT-SNOW-2025-OPCASH-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:NetCashProvidedByUsedInOperatingActivities',
        auditNotes: 'Net cash provided by operating activities.'
      },
      {
        metricName: 'Remaining Performance Obligations (RPO)',
        authoritativeValueUsd: 6900000000,
        formattedDisplay: '$6,900,000,000',
        sourceFiling: 'Snowflake Inc. Form 10-K (FY ended Jan 31, 2025)',
        secFilingLocation: 'Note 3: Revenue, Remaining Performance Obligations disclosure',
        sourceElementRef: 'elem-snow-sec-note3-rpo',
        canonicalFactId: 'FACT-SNOW-2025-RPO-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:RevenueRemainingPerformanceObligation',
        auditNotes: 'Contracted future revenue not yet recognized (~48% expected next 12 months).'
      }
    ];
  }
}

export const snowflakeTruthReconciliationService = SnowflakeTruthReconciliationService.getInstance();
