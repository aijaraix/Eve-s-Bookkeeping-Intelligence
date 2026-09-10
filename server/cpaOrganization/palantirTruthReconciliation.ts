/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — PALANTIR DATA TRUTH RECONCILIATION
 * 
 * Reconciles conflicting historical values across runs, documents, and prototypes for FY2025.
 * Designates the single authoritative SEC Form 10-K filing as the operational accounting truth.
 * 
 * Phase H.9.36.2: Fully rebuilt from physical SEC Form 10-K bytes.
 * Quarantines synthetic fixtures and records genuine physical SEC facts and SHA-256 hash.
 */

import { deepDocumentExtractionPipeline } from './deepDocumentExtractionPipeline';

export interface FinancialMetricReconciliation {
  metricName: string;
  authoritativeValueUsd: number;
  formattedDisplay: string;
  sourceFiling: string;
  secFilingLocation: string;
  sourceElementRef: string;
  canonicalFactId: string;
  canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH';
  xbrlTag?: string;
  legacyOrSimulatedValuesAudited: {
    runId: string;
    variantValueUsd: number;
    explanation: string;
    disposition: 'QUARANTINED_NON_AUTHORITATIVE' | 'SUPERSEDED_HISTORICAL_RUN' | 'SIMULATED_ACADEMY_PRE_RUN';
  }[];
}

export class PalantirTruthReconciliationService {
  private static instance: PalantirTruthReconciliationService;

  private constructor() {}

  public static getInstance(): PalantirTruthReconciliationService {
    if (!PalantirTruthReconciliationService.instance) {
      PalantirTruthReconciliationService.instance = new PalantirTruthReconciliationService();
    }
    return PalantirTruthReconciliationService.instance;
  }

  public getMetrics(): FinancialMetricReconciliation[] {
    const ext = deepDocumentExtractionPipeline.getAuthoritativeExtraction();
    const p = ext.primaryFinancialMetrics;

    return [
      {
        metricName: 'Total Revenues (FY 2025)',
        authoritativeValueUsd: p.revenueUsd, // $4,475,446,000
        formattedDisplay: '$4,475,446,000',
        sourceFiling: 'Palantir Technologies Inc. Form 10-K (FY ended Dec 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Statements of Operations (p. 84, Table 14 Row 3)',
        sourceElementRef: 'elem-pltr-sec-is-rev',
        canonicalFactId: 'FACT-PLTR-2025-REVENUE-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax',
        legacyOrSimulatedValuesAudited: [
          {
            runId: 'RUN-SYNTH-FIXTURE-H914',
            variantValueUsd: 3425000000,
            explanation: 'Synthetic prototype fixture ungrounded in physical SEC filing. Quarantined in Q-PLTR-REV-3425M.',
            disposition: 'QUARANTINED_NON_AUTHORITATIVE'
          },
          {
            runId: 'RUN-CANARY-CROSS-CONTAM',
            variantValueUsd: 14200000000,
            explanation: 'Canary deliverable package REP-1788813325563 cross-contaminated into Palantir engagement. Quarantined in Q-REP-1788813325563-CANARY.',
            disposition: 'QUARANTINED_NON_AUTHORITATIVE'
          }
        ]
      },
      {
        metricName: 'Gross Profit (FY 2025)',
        authoritativeValueUsd: p.grossProfitUsd, // $3,686,269,000
        formattedDisplay: '$3,686,269,000',
        sourceFiling: 'Palantir Technologies Inc. Form 10-K (FY ended Dec 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Statements of Operations (p. 84, Table 14 Row 7)',
        sourceElementRef: 'elem-pltr-sec-is-gp',
        canonicalFactId: 'FACT-PLTR-2025-GROSSPROFIT-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:GrossProfit',
        legacyOrSimulatedValuesAudited: []
      },
      {
        metricName: 'Operating Income (FY 2025)',
        authoritativeValueUsd: p.operatingIncomeUsd, // $1,414,015,000
        formattedDisplay: '$1,414,015,000',
        sourceFiling: 'Palantir Technologies Inc. Form 10-K (FY ended Dec 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Statements of Operations (p. 84, Table 14 Row 14)',
        sourceElementRef: 'elem-pltr-sec-is-opinc',
        canonicalFactId: 'FACT-PLTR-2025-OPINC-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:OperatingIncomeLoss',
        legacyOrSimulatedValuesAudited: []
      },
      {
        metricName: 'Consolidated Net Income (FY 2025)',
        authoritativeValueUsd: p.netIncomeUsd, // $1,634,644,000
        formattedDisplay: '$1,634,644,000',
        sourceFiling: 'Palantir Technologies Inc. Form 10-K (FY ended Dec 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Statements of Operations (p. 84, Table 14 Row 22)',
        sourceElementRef: 'elem-pltr-sec-is-netinc',
        canonicalFactId: 'FACT-PLTR-2025-NETINC-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:NetIncomeLoss',
        legacyOrSimulatedValuesAudited: [
          {
            runId: 'RUN-SYNTH-FIXTURE-H914',
            variantValueUsd: 415000000,
            explanation: 'Synthetic prototype constant. Quarantined in Q-PLTR-NETINC-415M.',
            disposition: 'QUARANTINED_NON_AUTHORITATIVE'
          },
          {
            runId: 'RUN-SYNTH-SEED-H915',
            variantValueUsd: 525000000,
            explanation: 'Synthetic seed value. Quarantined in Q-PLTR-NETINC-415M.',
            disposition: 'QUARANTINED_NON_AUTHORITATIVE'
          }
        ]
      },
      {
        metricName: 'Total Assets (as of Dec 31, 2025)',
        authoritativeValueUsd: p.totalAssetsUsd, // $8,900,392,000
        formattedDisplay: '$8,900,392,000',
        sourceFiling: 'Palantir Technologies Inc. Form 10-K (FY ended Dec 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Balance Sheets (p. 86, Table 15 Row 18)',
        sourceElementRef: 'elem-pltr-sec-bs-assets',
        canonicalFactId: 'FACT-PLTR-2025-ASSETS-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:Assets',
        legacyOrSimulatedValuesAudited: [
          {
            runId: 'RUN-SYNTH-FIXTURE-H914',
            variantValueUsd: 5520000000,
            explanation: 'Synthetic prototype fixture. Quarantined in Q-PLTR-ASSETS-5520M.',
            disposition: 'QUARANTINED_NON_AUTHORITATIVE'
          }
        ]
      },
      {
        metricName: 'Total Liabilities (as of Dec 31, 2025)',
        authoritativeValueUsd: p.totalLiabilitiesUsd, // $1,412,381,000
        formattedDisplay: '$1,412,381,000',
        sourceFiling: 'Palantir Technologies Inc. Form 10-K (FY ended Dec 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Balance Sheets (p. 86, Table 15 Row 32)',
        sourceElementRef: 'elem-pltr-sec-bs-liab',
        canonicalFactId: 'FACT-PLTR-2025-LIAB-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:Liabilities',
        legacyOrSimulatedValuesAudited: [
          {
            runId: 'RUN-SYNTH-FIXTURE-H914',
            variantValueUsd: 1140000000,
            explanation: 'Synthetic prototype fixture. Quarantined in Q-PLTR-LIAB-1140M.',
            disposition: 'QUARANTINED_NON_AUTHORITATIVE'
          }
        ]
      },
      {
        metricName: 'Total Stockholders Equity (as of Dec 31, 2025)',
        authoritativeValueUsd: p.stockholdersEquityUsd, // $7,488,011,000
        formattedDisplay: '$7,488,011,000',
        sourceFiling: 'Palantir Technologies Inc. Form 10-K (FY ended Dec 31, 2025)',
        secFilingLocation: 'Part II Item 8: Consolidated Balance Sheets (p. 86, Table 15 Row 45)',
        sourceElementRef: 'elem-pltr-sec-bs-equity',
        canonicalFactId: 'FACT-PLTR-2025-EQUITY-AUTH',
        canonicalStatus: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        xbrlTag: 'us-gaap:StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
        legacyOrSimulatedValuesAudited: [
          {
            runId: 'RUN-SYNTH-FIXTURE-H914',
            variantValueUsd: 4380000000,
            explanation: 'Synthetic prototype fixture. Quarantined in Q-PLTR-EQUITY-4380M.',
            disposition: 'QUARANTINED_NON_AUTHORITATIVE'
          }
        ]
      }
    ];
  }

  public getReconciliationReport() {
    const ext = deepDocumentExtractionPipeline.getAuthoritativeExtraction();
    const metrics = this.getMetrics();
    const assets = ext.primaryFinancialMetrics.totalAssetsUsd;
    const liabilities = ext.primaryFinancialMetrics.totalLiabilitiesUsd;
    const equity = ext.primaryFinancialMetrics.stockholdersEquityUsd;
    const tieOutEquationBalance = assets === (liabilities + equity);

    return {
      success: true,
      authoritativeSource: 'Palantir Technologies Inc. Form 10-K (FY 2025, Commission File Number 001-39540)',
      sourceHashSha256: ext.physicalSha256,
      tieOutVerified: tieOutEquationBalance,
      accountingEquation: `$8,900,392,000 (Assets) = $1,412,381,000 (Liabilities) + $7,488,011,000 (Equity)`,
      reconciledMetrics: metrics
    };
  }
}

export const palantirTruthReconciliationService = PalantirTruthReconciliationService.getInstance();
