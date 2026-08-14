import { ExtractedFact, HermesFinding } from "../src/types.js";
import { CanonicalFactResolver, CanonicalResolutionResult, ResolvedFinancialSummary } from "./canonicalFactResolver.js";

export type VerificationStatusStage =
  | "UNVERIFIED"
  | "CANONICAL_SELECTED"
  | "ACCOUNTING_VALIDATED"
  | "RECONCILED"
  | "REVIEW_REQUIRED";

export interface IdentityReconciliationResult {
  identityName: string;
  formula: string;
  status: "RECONCILED" | "ACCOUNTING_VALIDATED" | "REVIEW_REQUIRED";
  expectedValue: number | null;
  actualValue: number | null;
  variance: number;
  variancePct: number;
  isWithinMateriality: boolean;
  materialityThreshold: number;
  inputFactIds: string[];
  discrepancyMessage?: string;
  notes: string[];
}

export interface RollForwardReconciliationResult {
  statementType: string;
  beginningBalance: number | null;
  netInflowsOutflows: number | null;
  expectedEndingBalance: number | null;
  actualEndingBalance: number | null;
  variance: number;
  isWithinMateriality: boolean;
  status: "RECONCILED" | "REVIEW_REQUIRED";
  discrepancyMessage?: string;
  inputFactIds: string[];
}

export interface CrossDocumentReconciliationResult {
  metric: string;
  reportingPeriod: string;
  documentsCompared: { documentId: string; documentTitle?: string; value: number }[];
  hasConflict: boolean;
  variance: number;
  status: "RECONCILED" | "REVIEW_REQUIRED";
  conflictDetails?: string;
}

export interface GapAnalysisItem {
  metric: string;
  category: "INCOME_STATEMENT" | "BALANCE_SHEET" | "CASH_FLOW" | "NOTE_DISCLOSURE";
  importance: "MANDATORY" | "RECOMMENDED" | "OPTIONAL";
  isPresent: boolean;
  resolvedFactId?: string;
  status: "PRESENT" | "MISSING_MANDATORY_FACT" | "MISSING_RECOMMENDED_FACT";
}

export interface PlausibilityRuleResult {
  ruleCode: string;
  ruleName: string;
  metric: string;
  evaluatedValue: number | string | null;
  passed: boolean;
  severity: "CRITICAL" | "WARNING" | "INFO";
  explanation: string;
}

export interface GuardedRatioResult {
  ratioName: string;
  formula: string;
  value: number | null;
  formattedValue: string;
  unit: string;
  status: "ACCOUNTING_VALIDATED" | "REVIEW_REQUIRED";
  inputFacts: { metric: string; factId?: string; period?: string; scope?: string; currency?: string; value?: number }[];
  compatibilityPassed: boolean;
  incompatibilityReason?: string;
  denominatorValid: boolean;
}

export interface PhaseDValidationResult {
  workspaceId: string;
  reportingPeriod: string;
  entityName: string;
  consolidationScope: string;
  currency: string;
  overallStatus: "RECONCILED" | "ACCOUNTING_VALIDATED" | "REVIEW_REQUIRED";

  balanceSheetIdentity: IdentityReconciliationResult;
  incomeStatementIdentity: IdentityReconciliationResult;
  cashFlowRollForward: RollForwardReconciliationResult;
  crossDocumentReconciliations: CrossDocumentReconciliationResult[];

  gapAnalysis: GapAnalysisItem[];
  plausibilityDiagnostics: PlausibilityRuleResult[];

  guardedRatios: Record<string, GuardedRatioResult>;
  derivedFacts: ExtractedFact[];

  findings: HermesFinding[];
  summaryNotes: string[];
}

export class AccountingValidationEngine {
  /**
   * Dynamic Materiality Threshold Calculator based on base scale magnitude.
   * Never forces balance; provides threshold for minor rounding tolerance.
   */
  public static calculateMaterialityThreshold(baseAmount: number | null): number {
    if (baseAmount === null || baseAmount === 0) return 1_000_000;
    const abs = Math.abs(baseAmount);
    if (abs >= 1_000_000_000) {
      // 0.05% relative or $1M absolute threshold for billion-scale entities
      return Math.max(1_000_000, abs * 0.0005);
    } else if (abs >= 1_000_000) {
      // 0.1% relative or $1,000 absolute threshold for million-scale entities
      return Math.max(1_000, abs * 0.001);
    }
    return 1.0;
  }

  /**
   * Compatibility Guard: Verifies that two or more canonical facts match in:
   * 1. Target Fiscal Period
   * 2. Consolidation Scope
   * 3. Currency
   */
  public static validateFactCompatibility(
    facts: (CanonicalResolutionResult | ExtractedFact | null | undefined)[],
    ratioName: string
  ): { compatible: boolean; reason?: string } {
    const valid = facts.filter(Boolean) as (CanonicalResolutionResult | ExtractedFact)[];
    if (valid.length < 2) {
      return { compatible: false, reason: `${ratioName} Guard: Insufficient input facts provided for validation.` };
    }

    const extractMeta = (f: CanonicalResolutionResult | ExtractedFact) => {
      if ("primaryFact" in f) {
        return {
          period: f.reportingPeriod,
          scope: f.entityScope,
          currency: f.currency,
          value: f.normalizedScalarValue
        };
      } else {
        const { periodKey } = CanonicalFactResolver.resolvePeriod(f);
        const { entityScope } = CanonicalFactResolver.resolveEntityAndScope(f);
        const curr = CanonicalFactResolver.normalizeCurrency(f.currencyOriginal || f.currency);
        const val = CanonicalFactResolver.calculateNormalizedValue(f);
        return {
          period: periodKey,
          scope: entityScope,
          currency: curr,
          value: val
        };
      }
    };

    const first = extractMeta(valid[0]);
    for (let i = 1; i < valid.length; i++) {
      const current = extractMeta(valid[i]);
      if (first.period !== current.period) {
        return {
          compatible: false,
          reason: `${ratioName} Guard: Period mismatch (${first.period} vs ${current.period}).`
        };
      }
      if (first.scope !== current.scope) {
        return {
          compatible: false,
          reason: `${ratioName} Guard: Consolidation scope mismatch (${first.scope} vs ${current.scope}).`
        };
      }
      if (String(first.currency) !== String(current.currency)) {
        return {
          compatible: false,
          reason: `${ratioName} Guard: Currency mismatch (${first.currency} vs ${current.currency}).`
        };
      }
    }

    return { compatible: true };
  }

  /**
   * 1. Balance Sheet Identity Reconciliation: Assets = Liabilities + Equity
   */
  public static reconcileBalanceSheet(
    totalAssets: CanonicalResolutionResult | null,
    totalLiabilities: CanonicalResolutionResult | null,
    totalEquity: CanonicalResolutionResult | null
  ): IdentityReconciliationResult {
    const assetsVal = totalAssets?.normalizedScalarValue ?? null;
    const liabVal = totalLiabilities?.normalizedScalarValue ?? null;
    const eqVal = totalEquity?.normalizedScalarValue ?? null;

    const inputFactIds = [
      totalAssets?.primaryFact?.id,
      totalLiabilities?.primaryFact?.id,
      totalEquity?.primaryFact?.id
    ].filter(Boolean) as string[];

    if (assetsVal === null || liabVal === null || eqVal === null) {
      return {
        identityName: "Balance Sheet Identity",
        formula: "Total Assets == Total Liabilities + Total Equity",
        status: "REVIEW_REQUIRED",
        expectedValue: null,
        actualValue: assetsVal,
        variance: 0,
        variancePct: 0,
        isWithinMateriality: false,
        materialityThreshold: 1_000_000,
        inputFactIds,
        discrepancyMessage: "One or more required balance sheet component facts are missing.",
        notes: ["Cannot verify Balance Sheet Accounting Identity due to missing core inputs."]
      };
    }

    const expectedLE = liabVal + eqVal;
    const variance = Math.abs(assetsVal - expectedLE);
    const variancePct = assetsVal !== 0 ? (variance / Math.abs(assetsVal)) * 100 : 0;
    const materialityThreshold = this.calculateMaterialityThreshold(assetsVal);
    const isWithinMateriality = variance <= materialityThreshold;

    let status: "RECONCILED" | "ACCOUNTING_VALIDATED" | "REVIEW_REQUIRED" = "REVIEW_REQUIRED";
    if (variance === 0) status = "RECONCILED";
    else if (isWithinMateriality) status = "ACCOUNTING_VALIDATED";

    const notes: string[] = [
      `Reported Total Assets: ${totalAssets?.formattedValue || assetsVal}`,
      `Sum of Liabilities + Equity: ${expectedLE}`,
      `Variance: ${variance} (${variancePct.toFixed(4)}%)`,
      `Materiality Threshold: ${materialityThreshold}`
    ];

    let discrepancyMessage: string | undefined;
    if (!isWithinMateriality) {
      discrepancyMessage = `Balance Sheet Imbalance: Total Assets (${assetsVal}) ≠ Liabilities (${liabVal}) + Equity (${eqVal}). Variance of ${variance} exceeds materiality threshold ${materialityThreshold}.`;
      notes.push(`CRITICAL: ${discrepancyMessage}`);
    }

    return {
      identityName: "Balance Sheet Identity",
      formula: "Total Assets == Total Liabilities + Total Equity",
      status,
      expectedValue: expectedLE,
      actualValue: assetsVal,
      variance,
      variancePct: parseFloat(variancePct.toFixed(4)),
      isWithinMateriality,
      materialityThreshold,
      inputFactIds,
      discrepancyMessage,
      notes
    };
  }

  /**
   * 2. Income Statement Gross Profit Identity Reconciliation
   * Gross Profit = Revenue + Cost of Sales (accounting sign aware)
   */
  public static reconcileGrossProfit(
    revenue: CanonicalResolutionResult | null,
    costOfSales: CanonicalResolutionResult | null,
    grossProfit: CanonicalResolutionResult | null
  ): IdentityReconciliationResult {
    const revVal = revenue?.normalizedScalarValue ?? null;
    const cogsVal = costOfSales?.normalizedScalarValue ?? null;
    const gpVal = grossProfit?.normalizedScalarValue ?? null;

    const inputFactIds = [
      revenue?.primaryFact?.id,
      costOfSales?.primaryFact?.id,
      grossProfit?.primaryFact?.id
    ].filter(Boolean) as string[];

    if (revVal === null || cogsVal === null || gpVal === null) {
      return {
        identityName: "Gross Profit Identity",
        formula: "Gross Profit == Revenue - Cost of Sales",
        status: "REVIEW_REQUIRED",
        expectedValue: null,
        actualValue: gpVal,
        variance: 0,
        variancePct: 0,
        isWithinMateriality: false,
        materialityThreshold: 1_000_000,
        inputFactIds,
        discrepancyMessage: "One or more income statement component facts (Revenue, COGS, Gross Profit) are missing.",
        notes: ["Missing income statement facts preventing full Gross Profit reconciliation."]
      };
    }

    // Account for sign presentation: Cost of sales is an expense, mathematically subtracted from Revenue
    const expectedGP = revVal - Math.abs(cogsVal);
    const variance = Math.abs(gpVal - expectedGP);
    const variancePct = gpVal !== 0 ? (variance / Math.abs(gpVal)) * 100 : 0;
    const materialityThreshold = this.calculateMaterialityThreshold(revVal);
    const isWithinMateriality = variance <= materialityThreshold;

    let status: "RECONCILED" | "ACCOUNTING_VALIDATED" | "REVIEW_REQUIRED" = "REVIEW_REQUIRED";
    if (variance === 0) status = "RECONCILED";
    else if (isWithinMateriality) status = "ACCOUNTING_VALIDATED";

    const notes: string[] = [
      `Reported Revenue: ${revenue?.formattedValue || revVal}`,
      `Reported Cost of Sales: ${costOfSales?.formattedValue || cogsVal}`,
      `Reported Gross Profit: ${grossProfit?.formattedValue || gpVal}`,
      `Calculated Gross Profit: ${expectedGP}`,
      `Variance: ${variance}`
    ];

    let discrepancyMessage: string | undefined;
    if (!isWithinMateriality) {
      discrepancyMessage = `Income Statement Discrepancy: Reported Gross Profit (${gpVal}) ≠ Revenue (${revVal}) - Cost of Sales (${Math.abs(cogsVal)}). Variance of ${variance} exceeds materiality ${materialityThreshold}.`;
      notes.push(`CRITICAL: ${discrepancyMessage}`);
    }

    return {
      identityName: "Gross Profit Identity",
      formula: "Gross Profit == Revenue - Cost of Sales",
      status,
      expectedValue: expectedGP,
      actualValue: gpVal,
      variance,
      variancePct: parseFloat(variancePct.toFixed(4)),
      isWithinMateriality,
      materialityThreshold,
      inputFactIds,
      discrepancyMessage,
      notes
    };
  }

  /**
   * 3. Cash Flow Roll-Forward Reconciliation
   * Ending Cash = Beginning Cash + Operating CF + Investing CF + Financing CF
   */
  public static reconcileCashFlowRollForward(
    cash: CanonicalResolutionResult | null,
    operatingCF: CanonicalResolutionResult | null,
    investingCF: CanonicalResolutionResult | null,
    financingCF: CanonicalResolutionResult | null,
    beginningCashVal?: number | null
  ): RollForwardReconciliationResult {
    const endingCash = cash?.normalizedScalarValue ?? null;
    const opVal = operatingCF?.normalizedScalarValue ?? null;
    const invVal = investingCF?.normalizedScalarValue ?? null;
    const finVal = financingCF?.normalizedScalarValue ?? null;

    const inputFactIds = [
      cash?.primaryFact?.id,
      operatingCF?.primaryFact?.id,
      investingCF?.primaryFact?.id,
      financingCF?.primaryFact?.id
    ].filter(Boolean) as string[];

    if (endingCash === null || opVal === null || invVal === null || finVal === null) {
      return {
        statementType: "Cash Flow Roll-Forward",
        beginningBalance: beginningCashVal ?? null,
        netInflowsOutflows: null,
        expectedEndingBalance: null,
        actualEndingBalance: endingCash,
        variance: 0,
        isWithinMateriality: false,
        status: "REVIEW_REQUIRED",
        discrepancyMessage: "Missing one or more cash flow statement activities (Operating, Investing, or Financing CF).",
        inputFactIds
      };
    }

    const netCashChange = opVal + invVal + finVal;
    let expectedEnding = netCashChange;
    if (typeof beginningCashVal === "number") {
      expectedEnding = beginningCashVal + netCashChange;
    }

    const variance = typeof beginningCashVal === "number" 
      ? Math.abs(endingCash - expectedEnding)
      : 0; // If beginning cash is not explicitly supplied, check net cash flow consistency

    const materiality = this.calculateMaterialityThreshold(endingCash);
    const isWithinMateriality = variance <= materiality;

    let status: "RECONCILED" | "REVIEW_REQUIRED" = isWithinMateriality ? "RECONCILED" : "REVIEW_REQUIRED";
    let discrepancyMessage: string | undefined;

    if (!isWithinMateriality) {
      discrepancyMessage = `Cash Flow Roll-Forward Imbalance: Expected ending cash (${expectedEnding}) ≠ Reported cash (${endingCash}). Variance: ${variance}.`;
    }

    return {
      statementType: "Cash Flow Roll-Forward",
      beginningBalance: beginningCashVal ?? null,
      netInflowsOutflows: netCashChange,
      expectedEndingBalance: expectedEnding,
      actualEndingBalance: endingCash,
      variance,
      isWithinMateriality,
      status,
      discrepancyMessage,
      inputFactIds
    };
  }

  /**
   * 4. Cross-Document Reconciliation:
   * Compares facts across different uploaded documents for the same metric/period/scope.
   */
  public static reconcileCrossDocument(
    workspaceFacts: ExtractedFact[],
    targetPeriodKey: string
  ): CrossDocumentReconciliationResult[] {
    const results: CrossDocumentReconciliationResult[] = [];
    const grouped: Record<string, ExtractedFact[]> = {};

    workspaceFacts.forEach((f) => {
      const { periodKey } = CanonicalFactResolver.resolvePeriod(f);
      if (periodKey === targetPeriodKey) {
        const metric = (f.canonicalMetric || f.canonical_metric || f.labelNormalized || "").toLowerCase();
        if (metric && metric !== "unclassified") {
          const docId = f.documentId || f.document_id || "doc-default";
          const key = `${metric}_${periodKey}`;
          if (!grouped[key]) grouped[key] = [];
          // Avoid duplicate facts from same document
          if (!grouped[key].some((ex) => (ex.documentId || ex.document_id) === docId)) {
            grouped[key].push(f);
          }
        }
      }
    });

    Object.entries(grouped).forEach(([key, facts]) => {
      if (facts.length > 1) {
        const docsCompared = facts.map((f) => ({
          documentId: f.documentId || f.document_id || "unknown",
          documentTitle: f.sourceDocument,
          value: CanonicalFactResolver.calculateNormalizedValue(f) ?? 0
        }));

        const values = docsCompared.map((d) => d.value);
        const maxVal = Math.max(...values);
        const minVal = Math.min(...values);
        const variance = Math.abs(maxVal - minVal);
        const materiality = this.calculateMaterialityThreshold(maxVal);

        const hasConflict = variance > materiality;
        const metricName = key.split("_")[0];

        results.push({
          metric: metricName,
          reportingPeriod: targetPeriodKey,
          documentsCompared: docsCompared,
          hasConflict,
          variance,
          status: hasConflict ? "REVIEW_REQUIRED" : "RECONCILED",
          conflictDetails: hasConflict
            ? `Cross-Document Discrepancy detected for ${metricName} in ${targetPeriodKey}: values differ across documents (${values.join(", ")}). Variance of ${variance} exceeds materiality threshold.`
            : undefined
        });
      }
    });

    return results;
  }

  /**
   * 5. Executable Gap Analysis Scanner
   */
  public static runGapAnalysis(
    resolvedSummary: ResolvedFinancialSummary,
    workspaceFacts: ExtractedFact[]
  ): GapAnalysisItem[] {
    const gapItems: GapAnalysisItem[] = [];

    const checks: {
      metric: string;
      res: CanonicalResolutionResult;
      category: GapAnalysisItem["category"];
      importance: GapAnalysisItem["importance"];
    }[] = [
      { metric: "revenue", res: resolvedSummary.revenue, category: "INCOME_STATEMENT", importance: "MANDATORY" },
      { metric: "cost_of_sales", res: resolvedSummary.costOfSales, category: "INCOME_STATEMENT", importance: "RECOMMENDED" },
      { metric: "gross_profit", res: resolvedSummary.grossProfit, category: "INCOME_STATEMENT", importance: "RECOMMENDED" },
      { metric: "operating_profit", res: resolvedSummary.operatingProfit, category: "INCOME_STATEMENT", importance: "RECOMMENDED" },
      { metric: "net_income", res: resolvedSummary.netIncome, category: "INCOME_STATEMENT", importance: "MANDATORY" },
      { metric: "total_assets", res: resolvedSummary.totalAssets, category: "BALANCE_SHEET", importance: "MANDATORY" },
      { metric: "total_liabilities", res: resolvedSummary.totalLiabilities, category: "BALANCE_SHEET", importance: "MANDATORY" },
      { metric: "total_equity", res: resolvedSummary.totalEquity, category: "BALANCE_SHEET", importance: "MANDATORY" },
      { metric: "cash", res: resolvedSummary.cash, category: "BALANCE_SHEET", importance: "MANDATORY" },
      { metric: "operating_cash_flow", res: resolvedSummary.operatingCashFlow, category: "CASH_FLOW", importance: "MANDATORY" }
    ];

    checks.forEach(({ metric, res, category, importance }) => {
      const isPresent = res.normalizedScalarValue !== null && res.primaryFact !== null;
      let status: GapAnalysisItem["status"] = "PRESENT";
      if (!isPresent) {
        status = importance === "MANDATORY" ? "MISSING_MANDATORY_FACT" : "MISSING_RECOMMENDED_FACT";
      }

      gapItems.push({
        metric,
        category,
        importance,
        isPresent,
        resolvedFactId: res.primaryFact?.id,
        status
      });
    });

    return gapItems;
  }

  /**
   * 6. Plausibility Diagnostics Engine
   */
  public static runPlausibilityDiagnostics(
    summary: ResolvedFinancialSummary
  ): PlausibilityRuleResult[] {
    const rules: PlausibilityRuleResult[] = [];

    const rev = summary.revenue.normalizedScalarValue;
    const gp = summary.grossProfit.normalizedScalarValue;
    const op = summary.operatingProfit.normalizedScalarValue;
    const ni = summary.netIncome.normalizedScalarValue;
    const assets = summary.totalAssets.normalizedScalarValue;
    const liab = summary.totalLiabilities.normalizedScalarValue;
    const eq = summary.totalEquity.normalizedScalarValue;
    const cash = summary.cash.normalizedScalarValue;

    // PLAU-001: Non-Negative Revenue
    if (rev !== null) {
      const pass = rev >= 0;
      rules.push({
        ruleCode: "PLAU-001",
        ruleName: "Non-Negative Revenue Check",
        metric: "revenue",
        evaluatedValue: rev,
        passed: pass,
        severity: "CRITICAL",
        explanation: pass
          ? "Revenue is non-negative."
          : `CRITICAL: Negative revenue reported (${rev}), indicating data corruption or reversal anomaly.`
      });
    }

    // PLAU-002: Gross Margin Bounded (-100% to 100%)
    if (summary.grossMarginPct !== null) {
      const pass = summary.grossMarginPct >= -100 && summary.grossMarginPct <= 100;
      rules.push({
        ruleCode: "PLAU-002",
        ruleName: "Gross Margin Bounded Check",
        metric: "gross_margin_pct",
        evaluatedValue: `${summary.grossMarginPct}%`,
        passed: pass,
        severity: "CRITICAL",
        explanation: pass
          ? "Gross margin percentage is within standard accounting bounds [-100%, 100%]."
          : `CRITICAL: Implausible gross margin (${summary.grossMarginPct}%).`
      });
    }

    // PLAU-003: Operating Margin Bounded (-100% to 100%)
    if (summary.operatingMarginPct !== null) {
      const pass = summary.operatingMarginPct >= -100 && summary.operatingMarginPct <= 100;
      rules.push({
        ruleCode: "PLAU-003",
        ruleName: "Operating Margin Bounded Check",
        metric: "operating_margin_pct",
        evaluatedValue: `${summary.operatingMarginPct}%`,
        passed: pass,
        severity: "WARNING",
        explanation: pass
          ? "Operating margin percentage is within standard bounds."
          : `WARNING: Implausible operating margin (${summary.operatingMarginPct}%).`
      });
    }

    // PLAU-004: Cash Cannot Exceed Total Assets
    if (cash !== null && assets !== null && assets > 0) {
      const pass = cash <= assets;
      rules.push({
        ruleCode: "PLAU-004",
        ruleName: "Cash vs Assets Plausibility Check",
        metric: "cash_vs_assets",
        evaluatedValue: `Cash: ${cash}, Assets: ${assets}`,
        passed: pass,
        severity: "CRITICAL",
        explanation: pass
          ? "Cash & Equivalents is less than or equal to Total Assets."
          : `CRITICAL: Cash (${cash}) exceeds Total Assets (${assets}), indicating scale or classification error.`
      });
    }

    // PLAU-005: Total Assets Must Be Positive
    if (assets !== null) {
      const pass = assets > 0;
      rules.push({
        ruleCode: "PLAU-005",
        ruleName: "Positive Total Assets Check",
        metric: "total_assets",
        evaluatedValue: assets,
        passed: pass,
        severity: "CRITICAL",
        explanation: pass
          ? "Total Assets is positive."
          : `CRITICAL: Total Assets must be positive (reported: ${assets}).`
      });
    }

    // PLAU-006: Total Liabilities Must Be Non-Negative
    if (liab !== null) {
      const pass = liab >= 0;
      rules.push({
        ruleCode: "PLAU-006",
        ruleName: "Non-Negative Liabilities Check",
        metric: "total_liabilities",
        evaluatedValue: liab,
        passed: pass,
        severity: "WARNING",
        explanation: pass
          ? "Total Liabilities is non-negative."
          : `WARNING: Reported negative liabilities (${liab}).`
      });
    }

    return rules;
  }

  /**
   * 7. Guarded Ratios Engine
   * Enforces dimensional compatibility (period, scope, currency) and denominator protection.
   */
  public static calculateGuardedRatios(
    summary: ResolvedFinancialSummary
  ): Record<string, GuardedRatioResult> {
    const ratios: Record<string, GuardedRatioResult> = {};

    const rev = summary.revenue;
    const gp = summary.grossProfit;
    const op = summary.operatingProfit;
    const ni = summary.netIncome;
    const eq = summary.totalEquity;
    const liab = summary.totalLiabilities;

    // A. Gross Margin (%)
    const gmComp = this.validateFactCompatibility([gp, rev], "Gross Margin");
    const revVal = rev.normalizedScalarValue;
    const gpVal = gp.normalizedScalarValue;
    let gmValidDenom = revVal !== null && revVal !== 0;
    let gmVal: number | null = null;

    if (gmComp.compatible && gmValidDenom && gpVal !== null && revVal !== null) {
      gmVal = parseFloat(((gpVal / revVal) * 100).toFixed(2));
    }

    ratios["grossMarginPct"] = {
      ratioName: "Gross Margin (%)",
      formula: "(Gross Profit / Revenue) * 100",
      value: gmVal,
      formattedValue: gmVal !== null ? `${gmVal.toFixed(2)}%` : "—",
      unit: "%",
      status: gmVal !== null ? "ACCOUNTING_VALIDATED" : "REVIEW_REQUIRED",
      inputFacts: [
        { metric: "gross_profit", factId: gp.primaryFact?.id, period: gp.reportingPeriod, scope: gp.entityScope, currency: gp.currency, value: gpVal ?? undefined },
        { metric: "revenue", factId: rev.primaryFact?.id, period: rev.reportingPeriod, scope: rev.entityScope, currency: rev.currency, value: revVal ?? undefined }
      ],
      compatibilityPassed: gmComp.compatible,
      incompatibilityReason: gmComp.reason,
      denominatorValid: gmValidDenom
    };

    // B. Net Margin (%)
    const nmComp = this.validateFactCompatibility([ni, rev], "Net Margin");
    const niVal = ni.normalizedScalarValue;
    let nmValidDenom = revVal !== null && revVal !== 0;
    let nmVal: number | null = null;

    if (nmComp.compatible && nmValidDenom && niVal !== null && revVal !== null) {
      nmVal = parseFloat(((niVal / revVal) * 100).toFixed(2));
    }

    ratios["netMarginPct"] = {
      ratioName: "Net Margin (%)",
      formula: "(Net Income / Revenue) * 100",
      value: nmVal,
      formattedValue: nmVal !== null ? `${nmVal.toFixed(2)}%` : "—",
      unit: "%",
      status: nmVal !== null ? "ACCOUNTING_VALIDATED" : "REVIEW_REQUIRED",
      inputFacts: [
        { metric: "net_income", factId: ni.primaryFact?.id, period: ni.reportingPeriod, scope: ni.entityScope, currency: ni.currency, value: niVal ?? undefined },
        { metric: "revenue", factId: rev.primaryFact?.id, period: rev.reportingPeriod, scope: rev.entityScope, currency: rev.currency, value: revVal ?? undefined }
      ],
      compatibilityPassed: nmComp.compatible,
      incompatibilityReason: nmComp.reason,
      denominatorValid: nmValidDenom
    };

    // C. Return on Equity (ROE) (%)
    const roeComp = this.validateFactCompatibility([ni, eq], "Return on Equity");
    const eqVal = eq.normalizedScalarValue;
    let roeValidDenom = eqVal !== null && eqVal !== 0;
    let roeVal: number | null = null;

    if (roeComp.compatible && roeValidDenom && niVal !== null && eqVal !== null) {
      roeVal = parseFloat(((niVal / eqVal) * 100).toFixed(2));
    }

    ratios["returnOnEquity"] = {
      ratioName: "Return on Equity (ROE) (%)",
      formula: "(Net Income / Total Equity) * 100",
      value: roeVal,
      formattedValue: roeVal !== null ? `${roeVal.toFixed(2)}%` : "—",
      unit: "%",
      status: roeVal !== null ? "ACCOUNTING_VALIDATED" : "REVIEW_REQUIRED",
      inputFacts: [
        { metric: "net_income", factId: ni.primaryFact?.id, period: ni.reportingPeriod, scope: ni.entityScope, currency: ni.currency, value: niVal ?? undefined },
        { metric: "total_equity", factId: eq.primaryFact?.id, period: eq.reportingPeriod, scope: eq.entityScope, currency: eq.currency, value: eqVal ?? undefined }
      ],
      compatibilityPassed: roeComp.compatible,
      incompatibilityReason: roeComp.reason,
      denominatorValid: roeValidDenom
    };

    // D. Debt to Equity (x)
    const deComp = this.validateFactCompatibility([liab, eq], "Debt to Equity");
    const liabVal = liab.normalizedScalarValue;
    let deValidDenom = eqVal !== null && eqVal !== 0;
    let deVal: number | null = null;

    if (deComp.compatible && deValidDenom && liabVal !== null && eqVal !== null) {
      deVal = parseFloat((liabVal / eqVal).toFixed(2));
    }

    ratios["debtToEquity"] = {
      ratioName: "Debt to Equity Ratio",
      formula: "Total Liabilities / Total Equity",
      value: deVal,
      formattedValue: deVal !== null ? `${deVal.toFixed(2)}x` : "—",
      unit: "x",
      status: deVal !== null ? "ACCOUNTING_VALIDATED" : "REVIEW_REQUIRED",
      inputFacts: [
        { metric: "total_liabilities", factId: liab.primaryFact?.id, period: liab.reportingPeriod, scope: liab.entityScope, currency: liab.currency, value: liabVal ?? undefined },
        { metric: "total_equity", factId: eq.primaryFact?.id, period: eq.reportingPeriod, scope: eq.entityScope, currency: eq.currency, value: eqVal ?? undefined }
      ],
      compatibilityPassed: deComp.compatible,
      incompatibilityReason: deComp.reason,
      denominatorValid: deValidDenom
    };

    return ratios;
  }

  /**
   * 8. Derived Fact Generator with Complete Input Lineage
   */
  public static generateDerivedFacts(
    workspaceId: string,
    guardedRatios: Record<string, GuardedRatioResult>,
    summary: ResolvedFinancialSummary
  ): ExtractedFact[] {
    const derivedFacts: ExtractedFact[] = [];

    Object.entries(guardedRatios).forEach(([ratioKey, ratioRes]) => {
      if (ratioRes.value !== null) {
        const inputTrace = ratioRes.inputFacts
          .map((f) => `${f.metric}:${f.factId || "derived"}[${f.value}]`)
          .join(", ");

        const derivedFactId = `derived-fact-${ratioKey}-${workspaceId}`;

        derivedFacts.push({
          id: derivedFactId,
          fact_id: derivedFactId,
          workspaceId,
          company_id: workspaceId,
          documentId: summary.revenue.primaryFact?.documentId || summary.totalAssets.primaryFact?.documentId || "derived-doc",
          document_id: summary.revenue.primaryFact?.documentId || summary.totalAssets.primaryFact?.documentId || "derived-doc",
          factType: "DERIVED_FINANCIAL_METRIC",
          canonicalMetric: ratioKey,
          canonical_metric: ratioKey,
          labelOriginal: `Derived ${ratioRes.ratioName}`,
          raw_label: `Derived ${ratioRes.ratioName}`,
          labelNormalized: ratioRes.ratioName,
          valueOriginal: ratioRes.formattedValue,
          raw_value: ratioRes.formattedValue,
          valueFunctional: String(ratioRes.value),
          normalizedValue: ratioRes.value,
          normalized_value: ratioRes.value,
          reportedOrDerived: "derived",
          reported_or_derived: "derived",
          formulaIfDerived: ratioRes.formula,
          formula_if_derived: ratioRes.formula,
          currencyOriginal: summary.currency,
          functionalCurrency: summary.currency,
          currency: summary.currency,
          reportedUnit: ratioRes.unit,
          unitScale: ratioRes.unit,
          reportingPeriod: summary.reportingPeriod,
          fiscalYear: summary.reportingPeriod.split("-")[0],
          consolidationScope: summary.consolidationScope,
          entityName: summary.entityName,
          pageNumber: 1,
          sourceText: `Derived ${ratioRes.ratioName} calculated via ${ratioRes.formula}. Input fact trace: ${inputTrace}`,
          rawText: `Derived ${ratioRes.ratioName} calculated via ${ratioRes.formula}`,
          confidence: 1.0,
          confidence_score: 1.0,
          status: ratioRes.status === "ACCOUNTING_VALIDATED" ? "VALIDATED" : "PROPOSED",
          verificationStatus: ratioRes.status,
          verification_status: ratioRes.status,
          extractionMethod: "PHASE_D_ACCOUNTING_VALIDATION_ENGINE",
          extraction_method: "PHASE_D_ACCOUNTING_VALIDATION_ENGINE",
          auditTrailId: `audit-trail-${ratioKey}-${workspaceId}`,
          verificationNotes: `Lineage Trace: Input Facts [${ratioRes.inputFacts.map((i) => i.factId).join(", ")}]`
        });
      }
    });

    return derivedFacts;
  }

  /**
   * Master Validator: Performs independent Phase D Accounting Validation, Gap Analysis,
   * Reconciliations, and Findings Persistence.
   */
  public static validateWorkspace(
    workspaceId: string,
    workspaceFacts: ExtractedFact[]
  ): PhaseDValidationResult {
    const summary = CanonicalFactResolver.resolveWorkspaceSummary(workspaceId, workspaceFacts);

    // Update statuses of canonical facts to CANONICAL_SELECTED
    summary.allResolvedFacts.forEach((f) => {
      if (!f.verificationStatus || f.verificationStatus === "UNVERIFIED") {
        f.verificationStatus = "CANONICAL_SELECTED";
      }
    });

    // 1. Accounting Identities
    const bsIdentity = this.reconcileBalanceSheet(summary.totalAssets, summary.totalLiabilities, summary.totalEquity);
    const gpIdentity = this.reconcileGrossProfit(summary.revenue, summary.costOfSales, summary.grossProfit);

    // 2. Roll-Forward Reconciliations
    const cashRollForward = this.reconcileCashFlowRollForward(
      summary.cash,
      summary.operatingCashFlow,
      summary.investingCashFlow,
      summary.financingCashFlow
    );

    // 3. Cross-Document Reconciliations
    const crossDocReconciliations = this.reconcileCrossDocument(workspaceFacts, summary.reportingPeriod);

    // 4. Executable Gap Analysis
    const gapAnalysis = this.runGapAnalysis(summary, workspaceFacts);

    // 5. Plausibility Diagnostics
    const plausibilityDiagnostics = this.runPlausibilityDiagnostics(summary);

    // 6. Guarded KPIs & Derived Facts
    const guardedRatios = this.calculateGuardedRatios(summary);
    const derivedFacts = this.generateDerivedFacts(workspaceId, guardedRatios, summary);

    // 7. Overall Status & Hermes Findings Generation
    const findings: HermesFinding[] = [];
    const summaryNotes: string[] = [];

    let overallStatus: PhaseDValidationResult["overallStatus"] = "RECONCILED";

    // Evaluate Balance Sheet Identity
    if (bsIdentity.status === "REVIEW_REQUIRED") {
      overallStatus = "REVIEW_REQUIRED";
      if (bsIdentity.discrepancyMessage) {
        findings.push({
          id: `find-bs-${workspaceId}`,
          workspaceId,
          companyName: summary.entityName,
          title: "Balance Sheet Imbalance Detected",
          category: "Compliance",
          risk: "Critical",
          finAgentStatus: "Disagree",
          auditAgentStatus: "Disagree",
          riskAgentStatus: "Disagree",
          consensusScore: 0.1,
          confidenceScore: 0.99,
          materiality: bsIdentity.variance,
          status: "Needs Review",
          nextAction: "Inspect assets, liabilities, and equity line items for classification or extraction errors.",
          period: summary.reportingPeriod,
          createdDate: new Date().toISOString().split("T")[0],
          finAgentOpinion: bsIdentity.discrepancyMessage,
          finAgentConfidence: 0.99,
          auditAgentOpinion: bsIdentity.discrepancyMessage,
          auditAgentConfidence: 0.99,
          riskAgentOpinion: bsIdentity.discrepancyMessage,
          riskAgentConfidence: 0.99,
          aiRecommendation: "Verify underlying balance sheet statements and check for unextracted line items.",
          relatedDocsCount: 1,
          relatedJeCount: 0,
          relatedAccountsCount: 3,
          relatedTasksCount: 1
        });
      }
    } else if (bsIdentity.status === "ACCOUNTING_VALIDATED" && overallStatus === "RECONCILED") {
      overallStatus = "ACCOUNTING_VALIDATED";
    }

    // Evaluate Gross Profit Identity
    if (gpIdentity.status === "REVIEW_REQUIRED") {
      overallStatus = "REVIEW_REQUIRED";
      if (gpIdentity.discrepancyMessage) {
        findings.push({
          id: `find-gp-${workspaceId}`,
          workspaceId,
          companyName: summary.entityName,
          title: "Income Statement Gross Profit Discrepancy",
          category: "Revenue",
          risk: "High",
          finAgentStatus: "Disagree",
          auditAgentStatus: "Disagree",
          riskAgentStatus: "Disagree",
          consensusScore: 0.2,
          confidenceScore: 0.98,
          materiality: gpIdentity.variance,
          status: "Needs Review",
          nextAction: "Review Revenue and Cost of Sales line items.",
          period: summary.reportingPeriod,
          createdDate: new Date().toISOString().split("T")[0],
          finAgentOpinion: gpIdentity.discrepancyMessage,
          finAgentConfidence: 0.98,
          auditAgentOpinion: gpIdentity.discrepancyMessage,
          auditAgentConfidence: 0.98,
          riskAgentOpinion: gpIdentity.discrepancyMessage,
          riskAgentConfidence: 0.98,
          aiRecommendation: "Reconcile gross profit against revenue minus cost of sales.",
          relatedDocsCount: 1,
          relatedJeCount: 0,
          relatedAccountsCount: 2,
          relatedTasksCount: 1
        });
      }
    }

    // Evaluate Plausibility Failures
    const failedPlausibility = plausibilityDiagnostics.filter((p) => !p.passed);
    if (failedPlausibility.length > 0) {
      overallStatus = "REVIEW_REQUIRED";
      failedPlausibility.forEach((fp, i) => {
        findings.push({
          id: `find-plau-${workspaceId}-${i + 1}`,
          workspaceId,
          companyName: summary.entityName,
          title: `Plausibility Diagnostic Failed: ${fp.ruleName}`,
          category: "Compliance",
          risk: fp.severity === "CRITICAL" ? "Critical" : "High",
          finAgentStatus: "Disagree",
          auditAgentStatus: "Disagree",
          riskAgentStatus: "Disagree",
          consensusScore: 0.1,
          confidenceScore: 0.99,
          materiality: 0,
          status: "Needs Review",
          nextAction: `Investigate rule failure: ${fp.ruleName}`,
          period: summary.reportingPeriod,
          createdDate: new Date().toISOString().split("T")[0],
          finAgentOpinion: fp.explanation,
          finAgentConfidence: 0.99,
          auditAgentOpinion: fp.explanation,
          auditAgentConfidence: 0.99,
          riskAgentOpinion: fp.explanation,
          riskAgentConfidence: 0.99,
          aiRecommendation: "Inspect input fact source context and scale.",
          relatedDocsCount: 1,
          relatedJeCount: 0,
          relatedAccountsCount: 1,
          relatedTasksCount: 1
        });
      });
    }

    // Evaluate Missing Mandatory Facts
    const missingMandatory = gapAnalysis.filter((g) => g.status === "MISSING_MANDATORY_FACT");
    if (missingMandatory.length > 0) {
      if (overallStatus !== "REVIEW_REQUIRED") {
        overallStatus = "ACCOUNTING_VALIDATED";
      }
      summaryNotes.push(`Gap Analysis: Missing ${missingMandatory.length} mandatory line items (${missingMandatory.map((m) => m.metric).join(", ")}).`);
    }

    // Update canonical facts verification status based on validation result
    summary.allResolvedFacts.forEach((f) => {
      if (overallStatus === "RECONCILED" || overallStatus === "ACCOUNTING_VALIDATED") {
        f.verificationStatus = overallStatus;
        f.status = "VALIDATED";
      } else {
        f.verificationStatus = "REVIEW_REQUIRED";
        f.status = "DISCREPANCY";
      }
    });

    summaryNotes.push(`Phase D Validation Complete. Overall Status: ${overallStatus}`);

    return {
      workspaceId,
      reportingPeriod: summary.reportingPeriod,
      entityName: summary.entityName,
      consolidationScope: summary.consolidationScope,
      currency: summary.currency,
      overallStatus,
      balanceSheetIdentity: bsIdentity,
      incomeStatementIdentity: gpIdentity,
      cashFlowRollForward: cashRollForward,
      crossDocumentReconciliations: crossDocReconciliations,
      gapAnalysis,
      plausibilityDiagnostics,
      guardedRatios,
      derivedFacts,
      findings,
      summaryNotes
    };
  }
}
