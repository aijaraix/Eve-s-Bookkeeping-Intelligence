import {
  ExtractedFact,
  DocumentRecord,
  HumanReviewItem,
  EvidenceRecord,
  ReportException,
  MaterialityConfig,
  VarianceDirection,
  MaterialityClassification,
  VarianceAnalysisResult,
  TrendPoint,
  MultiPeriodTrendResult,
  RatioComparisonResult,
  FinancialAnomaly,
  FinancialAnomalyType,
  FinancialIntelligenceObservation,
  FinancialIntelligencePackage
} from "../src/types.js";
import { ReportingEngine } from "./reportingEngine.js";
import { AuditEvidenceEngine } from "./auditEvidenceEngine.js";

export const DEFAULT_MATERIALITY_CONFIG: MaterialityConfig = {
  absoluteThreshold: 1_000_000, // €1M or $1M
  percentageThreshold: 0.05, // 5%
  anomalyPercentageThreshold: 0.25, // 25%
  marginDeteriorationThresholdBps: 200 // 200 bps = 2.0%
};

/**
 * Phase G — Variance, Comparative Analysis & Financial Intelligence Engine
 *
 * Provides deterministic comparative financial analysis using only verified/canonical facts.
 * Features:
 * - Period-over-period variance analysis (YoY, QoQ, Actual vs Comparative)
 * - Multi-period trend analysis (CAGR, directional vectors)
 * - Ratio comparison & basis-point shift tracking
 * - Materiality classification & threshold engine
 * - Financial anomaly & exception detection
 * - Evidence-backed non-hallucinating explanations & causal status attribution
 * - Currency, period, entity & scope guards
 * - End-to-end 7-layer lineage traceability
 * - Integration with Phase E Human Review Queue
 */
export class FinancialIntelligenceEngine {

  /**
   * Determine whether a variance direction is Favorable, Unfavorable, or Neutral.
   */
  public static determineVarianceDirection(canonicalMetric: string, absoluteVariance: number): VarianceDirection {
    if (absoluteVariance === 0) return "NEUTRAL";

    const expenseMetrics = new Set([
      "cost_of_sales",
      "operating_expenses",
      "taxes",
      "total_liabilities",
      "current_liabilities",
      "non_current_liabilities",
      "financial_expenses"
    ]);

    if (expenseMetrics.has(canonicalMetric)) {
      // For expenses and liabilities, lower is favorable
      return absoluteVariance < 0 ? "FAVORABLE" : "UNFAVORABLE";
    }

    // For revenue, profits, assets, equity, cash, higher is favorable
    return absoluteVariance > 0 ? "FAVORABLE" : "UNFAVORABLE";
  }

  /**
   * Classify change materiality using configurable absolute and percentage thresholds.
   */
  public static classifyMateriality(
    absoluteVariance: number,
    percentageVariance: number | null,
    config: MaterialityConfig = DEFAULT_MATERIALITY_CONFIG
  ): MaterialityClassification {
    const absVal = Math.abs(absoluteVariance);
    const absPct = percentageVariance != null ? Math.abs(percentageVariance) : 0;

    if (absPct >= config.anomalyPercentageThreshold || (percentageVariance == null && absVal >= config.absoluteThreshold * 5)) {
      return "ANOMALOUS_CHANGE";
    }

    if (absVal >= config.absoluteThreshold || absPct >= config.percentageThreshold) {
      return "MATERIAL_CHANGE";
    }

    return "IMMATERIAL_CHANGE";
  }

  /**
   * Main entry point for comprehensive Financial Intelligence Analysis.
   */
  public static analyzeWorkspaceIntelligence(params: {
    workspaceId: string;
    reportingPeriod: string;
    comparativePeriod?: string;
    additionalComparativePeriods?: string[];
    entityName?: string;
    entityScope?: string;
    currency?: string;
    facts: ExtractedFact[];
    documents?: DocumentRecord[];
    pageManifests?: Map<string, Array<{ physical_page_number: number }>>;
    reviewItems?: HumanReviewItem[];
    materialityConfig?: Partial<MaterialityConfig>;
  }): FinancialIntelligencePackage {
    const config: MaterialityConfig = {
      ...DEFAULT_MATERIALITY_CONFIG,
      ...params.materialityConfig
    };

    const exceptions: ReportException[] = [];
    const factIdsUsed: string[] = [];
    const humanReviewItemsGenerated: HumanReviewItem[] = [];

    const entityName = params.entityName || params.facts[0]?.entityName || "Reporting Entity";
    const entityScope = params.entityScope || params.facts[0]?.entityScope || "Consolidated";
    const mainCurrency = params.currency || params.facts[0]?.currencyOriginal || params.facts[0]?.currency || "EUR";

    // 1. Filter facts for workspace & scope
    const workspaceFacts = params.facts.filter((f) => {
      const ws = f.workspaceId || (f as any).company_id;
      if (ws && ws !== params.workspaceId) return false;

      if (params.entityScope && f.entityScope && f.entityScope.toLowerCase() !== params.entityScope.toLowerCase()) {
        exceptions.push({
          id: `exc-scope-${f.id}`,
          type: "INCOMPATIBLE_SCOPE",
          severity: "WARNING",
          message: `Fact ${f.id} scope (${f.entityScope}) differs from target scope (${params.entityScope}).`,
          factId: f.id,
          metric: f.canonicalMetric
        });
        return false;
      }
      return true;
    });

    // 2. Gate facts through Phase F Reporting Fact Gate
    const gatedFacts = workspaceFacts.map((fact) => {
      const doc = params.documents?.find((d) => d.id === fact.documentId);
      const manifest = params.pageManifests?.get(fact.documentId || "");
      const reviewItem = params.reviewItems?.find((r) => r.factId === fact.id);

      const gate = ReportingEngine.evaluateFactEligibility(fact, {
        documentRecord: doc,
        pageManifest: manifest,
        reviewItem,
        workspaceFacts
      });

      return { fact, gate };
    });

    // Handle gate exclusions
    gatedFacts.forEach(({ fact, gate }) => {
      if (gate.eligibilityStatus === "REJECTED") {
        exceptions.push({
          id: `exc-rej-${fact.id}`,
          type: "INSUFFICIENT_EVIDENCE",
          severity: "CRITICAL",
          message: `Fact ${fact.id} (${fact.canonicalMetric}) is REJECTED and excluded from intelligence analysis.`,
          factId: fact.id,
          metric: fact.canonicalMetric
        });
      }
    });

    const validGatedFacts = gatedFacts.filter(({ gate }) => gate.eligibilityStatus !== "REJECTED");

    // -------------------------------------------------------------------------
    // A. PERIOD-OVER-PERIOD VARIANCE ANALYSIS
    // -------------------------------------------------------------------------
    const variances: VarianceAnalysisResult[] = [];
    const compPeriod = params.comparativePeriod;

    if (compPeriod) {
      const metricKeys = [
        "revenue",
        "cost_of_sales",
        "gross_profit",
        "operating_expenses",
        "operating_income",
        "financial_income",
        "profit_before_tax",
        "taxes",
        "net_income",
        "cash_and_equivalents",
        "receivables",
        "inventory",
        "current_assets",
        "non_current_assets",
        "total_assets",
        "current_liabilities",
        "non_current_liabilities",
        "total_liabilities",
        "equity",
        "operating_cash_flow"
      ];

      for (const metricKey of metricKeys) {
        const curMatch = validGatedFacts.find(({ fact }) =>
          fact.canonicalMetric === metricKey &&
          (fact.reportingPeriod === params.reportingPeriod || fact.fiscalYear === params.reportingPeriod)
        );

        const compMatch = validGatedFacts.find(({ fact }) =>
          fact.canonicalMetric === metricKey &&
          (fact.reportingPeriod === compPeriod || fact.fiscalYear === compPeriod)
        );

        if (curMatch && compMatch) {
          const curFact = curMatch.fact;
          const compFact = compMatch.fact;

          // Currency Guard
          const curCurr = curFact.currencyOriginal || curFact.currency || mainCurrency;
          const compCurr = compFact.currencyOriginal || compFact.currency || mainCurrency;

          if (curCurr !== compCurr) {
            exceptions.push({
              id: `exc-curr-var-${metricKey}`,
              type: "CURRENCY_MISMATCH",
              severity: "CRITICAL",
              message: `Variance skipped for ${metricKey}: Current currency (${curCurr}) != Comparative currency (${compCurr}) without explicit rate conversion.`,
              factId: curFact.id,
              metric: metricKey
            });
            continue;
          }

          // Scope Guard
          if ((curFact.entityScope || "Consolidated") !== (compFact.entityScope || "Consolidated")) {
            exceptions.push({
              id: `exc-scope-var-${metricKey}`,
              type: "INCOMPATIBLE_SCOPE",
              severity: "WARNING",
              message: `Variance skipped for ${metricKey}: Entity scope mismatch (${curFact.entityScope} vs ${compFact.entityScope}).`,
              factId: curFact.id,
              metric: metricKey
            });
            continue;
          }

          const curVal = curFact.normalizedValue != null ? curFact.normalizedValue : parseFloat(curFact.valueFunctional || curFact.valueOriginal) || 0;
          const compVal = compFact.normalizedValue != null ? compFact.normalizedValue : parseFloat(compFact.valueFunctional || compFact.valueOriginal) || 0;

          const absoluteVariance = curVal - compVal;
          let percentageVariance: number | null = null;
          let formattedPct = "N/A (Division by zero)";

          if (compVal !== 0) {
            percentageVariance = (curVal - compVal) / Math.abs(compVal);
            formattedPct = `${percentageVariance >= 0 ? "+" : ""}${(percentageVariance * 100).toFixed(2)}%`;
          }

          const direction = this.determineVarianceDirection(metricKey, absoluteVariance);
          const materiality = this.classifyMateriality(absoluteVariance, percentageVariance, config);

          factIdsUsed.push(curFact.id, compFact.id);

          const evidenceLineageCurrent = AuditEvidenceEngine.getEvidenceRecord(curFact, {
            documentRecord: params.documents?.find((d) => d.id === curFact.documentId),
            pageManifest: params.pageManifests?.get(curFact.documentId || ""),
            workspaceFacts
          });

          const evidenceLineageComparative = AuditEvidenceEngine.getEvidenceRecord(compFact, {
            documentRecord: params.documents?.find((d) => d.id === compFact.documentId),
            pageManifest: params.pageManifests?.get(compFact.documentId || ""),
            workspaceFacts
          });

          variances.push({
            metricId: metricKey,
            canonicalMetric: metricKey,
            displayLabel: curFact.labelOriginal || metricKey,
            currentPeriod: params.reportingPeriod,
            comparativePeriod: compPeriod,
            currentValue: curVal,
            comparativeValue: compVal,
            absoluteVariance,
            percentageVariance,
            formattedAbsoluteVariance: ReportingEngine.formatCurrencyValue(absoluteVariance, curCurr, curFact.unitScale),
            formattedPercentageVariance: formattedPct,
            direction,
            materiality,
            sourceFactIdCurrent: curFact.id,
            sourceFactIdComparative: compFact.id,
            derivedFactId: `var-${metricKey}-${params.reportingPeriod}-${compPeriod}`,
            evidenceLineageCurrent,
            evidenceLineageComparative,
            currency: curCurr,
            entityScope: curFact.entityScope || entityScope,
            warnings: compVal === 0 ? ["Division by zero guarded in percentage calculation."] : []
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // B. MULTI-PERIOD TREND ANALYSIS
    // -------------------------------------------------------------------------
    const allPeriods = Array.from(
      new Set([
        params.reportingPeriod,
        ...(compPeriod ? [compPeriod] : []),
        ...(params.additionalComparativePeriods || [])
      ])
    ).sort(); // Sort chronologically

    const multiPeriodTrends: MultiPeriodTrendResult[] = [];
    const trendMetricKeys = ["revenue", "gross_profit", "operating_income", "net_income", "total_assets", "equity", "cash_and_equivalents"];

    for (const key of trendMetricKeys) {
      const points: TrendPoint[] = [];
      const missingPeriods: string[] = [];

      for (const period of allPeriods) {
        const match = validGatedFacts.find(
          ({ fact }) =>
            fact.canonicalMetric === key &&
            (fact.reportingPeriod === period || fact.fiscalYear === period)
        );

        if (match) {
          const val = match.fact.normalizedValue != null ? match.fact.normalizedValue : parseFloat(match.fact.valueFunctional || match.fact.valueOriginal) || 0;
          factIdsUsed.push(match.fact.id);

          const evidenceRef = AuditEvidenceEngine.getEvidenceRecord(match.fact, {
            documentRecord: params.documents?.find((d) => d.id === match.fact.documentId),
            pageManifest: params.pageManifests?.get(match.fact.documentId || ""),
            workspaceFacts
          });

          points.push({
            period,
            value: val,
            displayValue: ReportingEngine.formatCurrencyValue(val, match.fact.currencyOriginal || mainCurrency, match.fact.unitScale),
            factId: match.fact.id,
            evidenceRef
          });
        } else {
          missingPeriods.push(period);
        }
      }

      if (points.length >= 2) {
        let cagrPercentage: number | null = null;
        let formattedCAGR = "N/A";

        const firstVal = points[0].value;
        const lastVal = points[points.length - 1].value;
        const numPeriods = points.length;

        if (firstVal > 0 && lastVal > 0 && numPeriods >= 2) {
          cagrPercentage = Math.pow(lastVal / firstVal, 1 / (numPeriods - 1)) - 1;
          formattedCAGR = `${(cagrPercentage * 100).toFixed(2)}%`;
        }

        // Determine overall direction
        let overallDirection: 'UPWARD' | 'DOWNWARD' | 'STABLE' | 'MIXED' = "MIXED";
        let isAllUp = true;
        let isAllDown = true;

        for (let i = 1; i < points.length; i++) {
          if (points[i].value <= points[i - 1].value) isAllUp = false;
          if (points[i].value >= points[i - 1].value) isAllDown = false;
        }

        if (isAllUp) overallDirection = "UPWARD";
        else if (isAllDown) overallDirection = "DOWNWARD";
        else if (Math.abs(lastVal - firstVal) / firstVal < 0.02) overallDirection = "STABLE";

        multiPeriodTrends.push({
          canonicalMetric: key,
          displayLabel: key.replace(/_/g, " ").toUpperCase(),
          periods: allPeriods,
          points,
          cagrPercentage,
          formattedCAGR,
          overallDirection,
          hasMissingPeriod: missingPeriods.length > 0,
          missingPeriods,
          currency: mainCurrency,
          entityScope
        });
      }
    }

    // -------------------------------------------------------------------------
    // C. RATIO COMPARISON & SHIFT ANALYSIS
    // -------------------------------------------------------------------------
    const ratioComparisons: RatioComparisonResult[] = [];

    if (compPeriod) {
      const ratioDefinitions = [
        { name: "Gross Margin", formula: "gross_profit / revenue", num: "gross_profit", den: "revenue", isHigherBetter: true },
        { name: "Operating Margin", formula: "operating_income / revenue", num: "operating_income", den: "revenue", isHigherBetter: true },
        { name: "Net Margin", formula: "net_income / revenue", num: "net_income", den: "revenue", isHigherBetter: true },
        { name: "Return on Assets", formula: "net_income / total_assets", num: "net_income", den: "total_assets", isHigherBetter: true },
        { name: "Return on Equity", formula: "net_income / equity", num: "net_income", den: "equity", isHigherBetter: true },
        { name: "Current Ratio", formula: "current_assets / current_liabilities", num: "current_assets", den: "current_liabilities", isHigherBetter: true },
        { name: "Debt to Equity", formula: "total_liabilities / equity", num: "total_liabilities", den: "equity", isHigherBetter: false }
      ];

      for (const def of ratioDefinitions) {
        const getRatioVal = (period: string) => {
          const numFact = validGatedFacts.find(({ fact }) => fact.canonicalMetric === def.num && (fact.reportingPeriod === period || fact.fiscalYear === period));
          const denFact = validGatedFacts.find(({ fact }) => fact.canonicalMetric === def.den && (fact.reportingPeriod === period || fact.fiscalYear === period));

          if (!numFact || !denFact) return { value: null, numFact: null, denFact: null };

          const numVal = numFact.fact.normalizedValue != null ? numFact.fact.normalizedValue : parseFloat(numFact.fact.valueFunctional || numFact.fact.valueOriginal) || 0;
          const denVal = denFact.fact.normalizedValue != null ? denFact.fact.normalizedValue : parseFloat(denFact.fact.valueFunctional || denFact.fact.valueOriginal) || 0;

          if (denVal === 0) return { value: null, numFact: numFact.fact, denFact: denFact.fact };
          return { value: numVal / denVal, numFact: numFact.fact, denFact: denFact.fact };
        };

        const curRatioObj = getRatioVal(params.reportingPeriod);
        const compRatioObj = getRatioVal(compPeriod);

        if (curRatioObj.value != null && compRatioObj.value != null) {
          const curVal = curRatioObj.value;
          const compVal = compRatioObj.value;

          const absoluteChange = curVal - compVal;
          const basisPointChange = Math.round(absoluteChange * 10_000);
          const percentageChange = compVal !== 0 ? absoluteChange / Math.abs(compVal) : null;

          let direction: 'IMPROVED' | 'DETERIORATED' | 'UNCHANGED' | 'N/A' = "UNCHANGED";
          if (absoluteChange !== 0) {
            if (def.isHigherBetter) {
              direction = absoluteChange > 0 ? "IMPROVED" : "DETERIORATED";
            } else {
              direction = absoluteChange < 0 ? "IMPROVED" : "DETERIORATED";
            }
          }

          let formattedCur = `${(curVal * 100).toFixed(2)}%`;
          let formattedComp = `${(compVal * 100).toFixed(2)}%`;
          let formattedChange = `${basisPointChange >= 0 ? "+" : ""}${basisPointChange} bps`;

          if (def.name.includes("Ratio") || def.name.includes("Debt")) {
            formattedCur = `${curVal.toFixed(2)}x`;
            formattedComp = `${compVal.toFixed(2)}x`;
            formattedChange = `${absoluteChange >= 0 ? "+" : ""}${absoluteChange.toFixed(2)}x`;
          }

          const materiality = Math.abs(basisPointChange) >= config.marginDeteriorationThresholdBps ? "MATERIAL_CHANGE" : "IMMATERIAL_CHANGE";

          const evidenceRefCurrent = curRatioObj.numFact ? AuditEvidenceEngine.getEvidenceRecord(curRatioObj.numFact, { workspaceFacts }) : null;
          const evidenceRefComparative = compRatioObj.numFact ? AuditEvidenceEngine.getEvidenceRecord(compRatioObj.numFact, { workspaceFacts }) : null;

          ratioComparisons.push({
            id: `rc-${def.name.toLowerCase().replace(/\s+/g, '-')}`,
            ratioName: def.name,
            formula: def.formula,
            currentPeriod: params.reportingPeriod,
            comparativePeriod: compPeriod,
            currentRatioValue: Number(curVal.toFixed(4)),
            comparativeRatioValue: Number(compVal.toFixed(4)),
            formattedCurrentRatio: formattedCur,
            formattedComparativeRatio: formattedComp,
            absoluteChange: Number(absoluteChange.toFixed(4)),
            basisPointChange,
            percentageChange: percentageChange != null ? Number(percentageChange.toFixed(4)) : null,
            formattedChange,
            direction,
            materiality,
            currency: mainCurrency,
            scope: entityScope,
            warnings: [],
            evidenceRefCurrent,
            evidenceRefComparative
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // D. FINANCIAL ANOMALY & EXCEPTION DETECTION ENGINE
    // -------------------------------------------------------------------------
    const anomalies: FinancialAnomaly[] = [];

    // 1. Check for Large Unexplained Movements (>25% change)
    variances.forEach((v) => {
      if (v.percentageVariance != null && Math.abs(v.percentageVariance) >= config.anomalyPercentageThreshold) {
        const severity = Math.abs(v.percentageVariance) >= 0.50 ? "CRITICAL" : "WARNING";
        const anomaly: FinancialAnomaly = {
          id: `anom-var-${v.metricId}`,
          anomalyType: "LARGE_UNEXPLAINED_MOVEMENT",
          severity,
          title: `Significant movement in ${v.displayLabel}`,
          description: `${v.displayLabel} shifted by ${v.formattedAbsoluteVariance} (${v.formattedPercentageVariance}) between ${v.comparativePeriod} and ${v.currentPeriod}.`,
          metricKeys: [v.canonicalMetric],
          factIds: [v.sourceFactIdCurrent, v.sourceFactIdComparative],
          reportingPeriod: v.currentPeriod,
          comparativePeriod: v.comparativePeriod,
          requiresHumanReview: severity === "CRITICAL",
          evidenceLineageRefs: [v.evidenceLineageCurrent, v.evidenceLineageComparative].filter(Boolean) as EvidenceRecord[]
        };
        anomalies.push(anomaly);

        if (severity === "CRITICAL") {
          const revItem = AuditEvidenceEngine.createOrUpdateReviewItem({
            workspaceId: params.workspaceId,
            documentId: v.evidenceLineageCurrent?.documentId || "doc-unknown",
            factId: v.sourceFactIdCurrent,
            triggerReason: "ACCOUNTING_DISCREPANCY",
            description: `Critical financial movement detected in ${v.displayLabel}: ${v.formattedPercentageVariance}. Requires review.`,
            originalFact: validGatedFacts.find((g) => g.fact.id === v.sourceFactIdCurrent)?.fact || ({} as any),
            currentSelection: { canonicalMetric: v.canonicalMetric, absoluteVariance: v.absoluteVariance }
          });
          humanReviewItemsGenerated.push(revItem);
          anomaly.reviewItemId = revItem.id;
        }
      }
    });

    // 2. Check for Margin Deterioration (Deteriorated by >= 200 bps)
    ratioComparisons.forEach((r) => {
      if (r.direction === "DETERIORATED" && r.basisPointChange != null && Math.abs(r.basisPointChange) >= config.marginDeteriorationThresholdBps) {
        anomalies.push({
          id: `anom-ratio-${r.ratioName.toLowerCase().replace(/\s+/g, '-')}`,
          anomalyType: "MARGIN_DETERIORATION",
          severity: Math.abs(r.basisPointChange) >= 500 ? "CRITICAL" : "WARNING",
          title: `Margin contraction in ${r.ratioName}`,
          description: `${r.ratioName} contracted by ${r.formattedChange} from ${r.formattedComparativeRatio} (${r.comparativePeriod}) to ${r.formattedCurrentRatio} (${r.currentPeriod}).`,
          metricKeys: [r.ratioName],
          factIds: [r.evidenceRefCurrent?.factId, r.evidenceRefComparative?.factId].filter(Boolean) as string[],
          reportingPeriod: r.currentPeriod,
          comparativePeriod: r.comparativePeriod,
          requiresHumanReview: Math.abs(r.basisPointChange) >= 500,
          evidenceLineageRefs: [r.evidenceRefCurrent, r.evidenceRefComparative].filter(Boolean) as EvidenceRecord[]
        });
      }
    });

    // 3. Check for Revenue vs Profit Divergence
    const revVar = variances.find((v) => v.canonicalMetric === "revenue");
    const netIncVar = variances.find((v) => v.canonicalMetric === "net_income");

    if (revVar && netIncVar) {
      if (revVar.absoluteVariance > 0 && netIncVar.absoluteVariance < 0 && Math.abs(netIncVar.absoluteVariance) >= config.absoluteThreshold) {
        anomalies.push({
          id: `anom-div-rev-profit`,
          anomalyType: "REVENUE_PROFIT_DIVERGENCE",
          severity: "WARNING",
          title: "Revenue & Profit Divergence",
          description: `Revenue increased by ${revVar.formattedAbsoluteVariance} (${revVar.formattedPercentageVariance}) while Net Income decreased by ${netIncVar.formattedAbsoluteVariance} (${netIncVar.formattedPercentageVariance}).`,
          metricKeys: ["revenue", "net_income"],
          factIds: [revVar.sourceFactIdCurrent, netIncVar.sourceFactIdCurrent],
          reportingPeriod: params.reportingPeriod,
          comparativePeriod: compPeriod,
          requiresHumanReview: true,
          evidenceLineageRefs: [revVar.evidenceLineageCurrent, netIncVar.evidenceLineageCurrent].filter(Boolean) as EvidenceRecord[]
        });
      }
    }

    // 4. Check for Cash Flow Inconsistency
    const ocfVar = variances.find((v) => v.canonicalMetric === "operating_cash_flow");
    if (netIncVar && ocfVar) {
      if (netIncVar.currentValue > 0 && ocfVar.currentValue < 0) {
        anomalies.push({
          id: "anom-cf-inconsistent",
          anomalyType: "CASH_FLOW_INCONSISTENCY",
          severity: "CRITICAL",
          title: "Cash Flow Inconsistency",
          description: `Positive Net Income (${ReportingEngine.formatCurrencyValue(netIncVar.currentValue, mainCurrency)}) accompanied by negative Operating Cash Flow (${ReportingEngine.formatCurrencyValue(ocfVar.currentValue, mainCurrency)}).`,
          metricKeys: ["net_income", "operating_cash_flow"],
          factIds: [netIncVar.sourceFactIdCurrent, ocfVar.sourceFactIdCurrent],
          reportingPeriod: params.reportingPeriod,
          requiresHumanReview: true,
          evidenceLineageRefs: [netIncVar.evidenceLineageCurrent, ocfVar.evidenceLineageCurrent].filter(Boolean) as EvidenceRecord[]
        });
      }
    }

    // -------------------------------------------------------------------------
    // E. EVIDENCE-BACKED EXPLANATIONS & NON-HALLUCINATION GUARD
    // -------------------------------------------------------------------------
    const observations: FinancialIntelligenceObservation[] = [];

    variances.forEach((v) => {
      const directionText = v.absoluteVariance > 0 ? "increased" : v.absoluteVariance < 0 ? "decreased" : "remained unchanged";
      const pctText = v.percentageVariance != null ? ` (${v.formattedPercentageVariance})` : "";
      const mathText = `${v.displayLabel} ${directionText} by ${v.formattedAbsoluteVariance}${pctText} in ${v.currentPeriod} compared with ${v.comparativePeriod}.`;

      // Search source text of current and comparative facts for explicit causal explanations
      const curFact = validGatedFacts.find((g) => g.fact.id === v.sourceFactIdCurrent)?.fact;
      const compFact = validGatedFacts.find((g) => g.fact.id === v.sourceFactIdComparative)?.fact;

      const causalKeywords = ["due to", "driven by", "reflecting", "caused by", "as a result of", "attributable to", "decreased owing to", "increased owing to"];

      let foundCausalText: string | undefined = undefined;

      [curFact?.sourceText, curFact?.provenance?.contextSentence, compFact?.sourceText, compFact?.provenance?.contextSentence].forEach((str) => {
        if (!foundCausalText && str) {
          const lower = str.toLowerCase();
          if (causalKeywords.some((kw) => lower.includes(kw))) {
            foundCausalText = str.trim();
          }
        }
      });

      const hasDocumentedCausation = foundCausalText != null;
      const causalStatusText = hasDocumentedCausation
        ? `Source document discloses cause: "${foundCausalText}"`
        : "The cause is not established by the available evidence.";

      observations.push({
        id: `obs-intel-${v.metricId}`,
        observationType: hasDocumentedCausation ? "CAUSAL_DISCLOSURE" : "MATHEMATICAL_FACT",
        text: mathText,
        causalSourceText: foundCausalText,
        hasDocumentedCausation,
        causalStatusText,
        relatedMetrics: [v.canonicalMetric],
        sourceFactIds: [v.sourceFactIdCurrent, v.sourceFactIdComparative],
        evidenceLineageRefs: [v.evidenceLineageCurrent, v.evidenceLineageComparative].filter(Boolean) as EvidenceRecord[]
      });
    });

    ratioComparisons.forEach((r) => {
      if (r.materiality === "MATERIAL_CHANGE") {
        const mathText = `${r.ratioName} ${r.direction.toLowerCase()} by ${r.formattedChange} from ${r.formattedComparativeRatio} in ${r.comparativePeriod} to ${r.formattedCurrentRatio} in ${r.currentPeriod}.`;
        observations.push({
          id: `obs-ratio-${r.id}`,
          observationType: "MATHEMATICAL_FACT",
          text: mathText,
          hasDocumentedCausation: false,
          causalStatusText: "The cause is not established by the available evidence.",
          relatedMetrics: [r.ratioName],
          sourceFactIds: [r.evidenceRefCurrent?.factId, r.evidenceRefComparative?.factId].filter(Boolean) as string[],
          evidenceLineageRefs: [r.evidenceRefCurrent, r.evidenceRefComparative].filter(Boolean) as EvidenceRecord[]
        });
      }
    });

    return {
      id: `intel-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`,
      workspaceId: params.workspaceId,
      reportingPeriod: params.reportingPeriod,
      comparativePeriods: compPeriod ? [compPeriod, ...(params.additionalComparativePeriods || [])] : [],
      entityName,
      entityScope,
      currency: mainCurrency,
      generatedAt: new Date().toISOString(),
      variances,
      multiPeriodTrends,
      ratioComparisons,
      anomalies,
      observations,
      exceptions,
      humanReviewItemsGenerated,
      factIdsUsed: Array.from(new Set(factIdsUsed))
    };
  }
}
