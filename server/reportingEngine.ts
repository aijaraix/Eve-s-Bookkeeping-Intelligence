import {
  ExtractedFact,
  DocumentRecord,
  HumanReviewItem,
  EvidenceRecord,
  MultidimensionalConfidence,
  ReportingEligibilityStatus,
  ReportType,
  ReportValidationStatus,
  ReportConfidenceLevel,
  ReportMetric,
  ReportSection,
  ReportVariance,
  ReportRatio,
  ReportException,
  ManagementObservation,
  FinancialReport
} from "../src/types.js";
import { AuditEvidenceEngine } from "./auditEvidenceEngine.js";

/**
 * Phase F — Financial Reporting, Statement Generation & Explainable Analysis Engine
 *
 * Consumes verified facts from Phases A–E and generates deterministic, audit-traceable
 * financial reports without inventing, estimating, or fabricating financial numbers.
 */

export class ReportingEngine {

  /**
   * Helper to format numbers nicely with scale & currency.
   */
  public static formatCurrencyValue(val: number | null | undefined, currency: string = "EUR", scale: string = "Units"): string {
    if (val == null || isNaN(val)) return "N/A";
    const sign = val < 0 ? "-" : "";
    const absVal = Math.abs(val);

    const currSymbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : `${currency} `;

    if (absVal >= 1_000_000_000) {
      return `${sign}${currSymbol}${(absVal / 1_000_000_000).toFixed(3)}B`;
    } else if (absVal >= 1_000_000) {
      return `${sign}${currSymbol}${(absVal / 1_000_000).toFixed(2)}M`;
    } else if (absVal >= 1_000) {
      return `${sign}${currSymbol}${(absVal / 1_000).toFixed(2)}k`;
    }
    return `${sign}${currSymbol}${absVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // =========================================================================
  // 1. REPORTING FACT GATE
  // =========================================================================

  public static evaluateFactEligibility(
    fact: ExtractedFact,
    context?: {
      documentRecord?: DocumentRecord;
      pageManifest?: Array<{ physical_page_number: number }>;
      reviewItem?: HumanReviewItem;
      workspaceFacts?: ExtractedFact[];
      validationResult?: any;
    }
  ): {
    eligibilityStatus: ReportingEligibilityStatus;
    warnings: string[];
    confidence: MultidimensionalConfidence;
    evidenceRef: EvidenceRecord;
  } {
    const warnings: string[] = [];

    // Calculate multidimensional confidence and extract evidence record from Phase E
    const evidenceRef = AuditEvidenceEngine.getEvidenceRecord(fact, {
      documentRecord: context?.documentRecord,
      pageManifest: context?.pageManifest,
      workspaceFacts: context?.workspaceFacts,
      validationResult: context?.validationResult
    });

    const confidence = evidenceRef.multidimensionalConfidence;

    // Check mandatory fields
    if (!fact.workspaceId && !(fact as any).company_id) {
      warnings.push("Missing workspace identifier.");
    }
    if (!fact.documentId && !(fact as any).document_id) {
      warnings.push("Missing document identifier.");
    }
    if (!fact.id) {
      warnings.push("Missing fact identifier.");
    }
    if (!fact.canonicalMetric || fact.canonicalMetric === "unclassified") {
      warnings.push(`Unclassified metric label "${fact.labelOriginal}".`);
    }
    if (!fact.reportingPeriod && !fact.fiscalYear) {
      warnings.push("Missing reporting period or fiscal year.");
    }
    if (!fact.currencyOriginal && !fact.currency) {
      warnings.push("Missing explicit currency.");
    }

    // Physical source page validation
    const pageNum = fact.pageNumber || (fact as any).source_page;
    if (pageNum == null || pageNum <= 0) {
      warnings.push("Missing physical source page reference.");
    } else if (context?.pageManifest && context.pageManifest.length > 0) {
      const exists = context.pageManifest.some((p) => p.physical_page_number === pageNum);
      if (!exists) {
        warnings.push(`Physical page ${pageNum} does not exist in source document page manifest (total pages: ${context.pageManifest.length}).`);
      }
    }

    // Determine eligibility status
    let eligibilityStatus: ReportingEligibilityStatus = "REPORT_READY";

    if (fact.status === "REJECTED" || fact.verificationStatus === "REJECTED" || evidenceRef.reviewStatus === "REJECTED") {
      eligibilityStatus = "REJECTED";
    } else if (fact.status === "UNVERIFIED" || fact.verificationStatus === "UNVERIFIED" || context?.reviewItem?.status === "REVIEW_REQUIRED" || evidenceRef.reviewStatus === "REVIEW_REQUIRED") {
      eligibilityStatus = "REVIEW_REQUIRED";
    } else if (!evidenceRef.evidenceValid || warnings.some((w) => w.includes("Missing physical source page") || w.includes("does not exist in source document"))) {
      eligibilityStatus = "INSUFFICIENT_EVIDENCE";
    } else if (warnings.length > 0 || confidence.overallAggregateConfidence < 0.80) {
      eligibilityStatus = "REPORT_WITH_WARNING";
    }

    return {
      eligibilityStatus,
      warnings,
      confidence,
      evidenceRef
    };
  }

  // =========================================================================
  // 2. FINANCIAL STATEMENT & REPORT GENERATION ENGINE
  // =========================================================================

  public static generateFinancialReport(params: {
    workspaceId: string;
    reportType?: ReportType;
    title?: string;
    reportingPeriod: string;
    comparativePeriod?: string;
    entityName?: string;
    entityScope?: string;
    currency?: string;
    facts: ExtractedFact[];
    documents?: DocumentRecord[];
    pageManifests?: Map<string, Array<{ physical_page_number: number }>>;
    reviewItems?: HumanReviewItem[];
    validationResult?: any;
  }): FinancialReport {
    const reportId = `rep-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
    const reportType = params.reportType || "FINANCIAL_STATEMENT";
    const entityName = params.entityName || params.facts[0]?.entityName || "Reporting Entity";
    const entityScope = params.entityScope || params.facts[0]?.entityScope || "Consolidated";
    const mainCurrency = params.currency || params.facts[0]?.currencyOriginal || params.facts[0]?.currency || "EUR";

    const exceptions: ReportException[] = [];
    const factIdsUsed: string[] = [];
    const derivedFactIds: string[] = [];

    // Filter facts relevant to workspace and entity
    const workspaceFacts = params.facts.filter((f) => {
      const ws = f.workspaceId || (f as any).company_id;
      if (ws && ws !== params.workspaceId) return false;

      // Scope/Entity check to prevent mixing consolidated with parent-company
      if (params.entityScope && f.entityScope && f.entityScope.toLowerCase() !== params.entityScope.toLowerCase()) {
        exceptions.push({
          id: `exc-scope-${f.id}`,
          type: "INCOMPATIBLE_SCOPE",
          severity: "WARNING",
          message: `Fact ${f.id} scope (${f.entityScope}) differs from report target scope (${params.entityScope}).`,
          factId: f.id,
          metric: f.canonicalMetric
        });
        return false;
      }
      return true;
    });

    // Run Fact Gate on all facts
    const gatedFacts = workspaceFacts.map((fact) => {
      const doc = params.documents?.find((d) => d.id === fact.documentId);
      const manifest = params.pageManifests?.get(fact.documentId || "");
      const reviewItem = params.reviewItems?.find((r) => r.factId === fact.id);

      const gate = this.evaluateFactEligibility(fact, {
        documentRecord: doc,
        pageManifest: manifest,
        reviewItem,
        workspaceFacts,
        validationResult: params.validationResult
      });

      return { fact, gate };
    });

    // Check for rejected or unverified facts
    gatedFacts.forEach(({ fact, gate }) => {
      if (gate.eligibilityStatus === "REJECTED") {
        exceptions.push({
          id: `exc-rej-${fact.id}`,
          type: "INSUFFICIENT_EVIDENCE",
          severity: "CRITICAL",
          message: `Fact ${fact.id} (${fact.canonicalMetric}) is REJECTED and excluded from reporting.`,
          factId: fact.id,
          metric: fact.canonicalMetric
        });
      } else if (gate.eligibilityStatus === "REVIEW_REQUIRED") {
        exceptions.push({
          id: `exc-rev-${fact.id}`,
          type: "HUMAN_REVIEW_REQUIRED",
          severity: "WARNING",
          message: `Fact ${fact.id} (${fact.canonicalMetric}) requires human review before full verification.`,
          factId: fact.id,
          metric: fact.canonicalMetric
        });
      } else if (gate.eligibilityStatus === "INSUFFICIENT_EVIDENCE") {
        exceptions.push({
          id: `exc-evid-${fact.id}`,
          type: "INSUFFICIENT_EVIDENCE",
          severity: "CRITICAL",
          message: `Fact ${fact.id} (${fact.canonicalMetric}) lacks valid physical source page evidence.`,
          factId: fact.id,
          metric: fact.canonicalMetric
        });
      }
    });

    // Filter to valid non-rejected facts for current period
    const currentPeriodGated = gatedFacts.filter(({ fact, gate }) => {
      if (gate.eligibilityStatus === "REJECTED") return false;
      const periodMatches =
        fact.reportingPeriod === params.reportingPeriod ||
        fact.fiscalYear === params.reportingPeriod ||
        (params.reportingPeriod.includes(fact.fiscalYear || "") && fact.fiscalYear);
      return periodMatches;
    });

    // Separate facts for comparative period if specified
    const comparativePeriodGated = params.comparativePeriod
      ? gatedFacts.filter(({ fact, gate }) => {
          if (gate.eligibilityStatus === "REJECTED") return false;
          const periodMatches =
            fact.reportingPeriod === params.comparativePeriod ||
            fact.fiscalYear === params.comparativePeriod ||
            (params.comparativePeriod!.includes(fact.fiscalYear || "") && fact.fiscalYear);
          return periodMatches;
        })
      : [];

    // Helper to find best gated metric for a canonical metric
    const findMetricFact = (metricName: string, gatedList = currentPeriodGated) => {
      const match = gatedList.find(({ fact }) => fact.canonicalMetric === metricName);
      if (match) {
        factIdsUsed.push(match.fact.id);
        return match;
      }
      return null;
    };

    // Helper to build ReportMetric
    const createReportMetric = (metricName: string, fallbackLabel: string, gatedList = currentPeriodGated): ReportMetric | null => {
      const found = findMetricFact(metricName, gatedList);
      if (!found) return null;

      const { fact, gate } = found;
      const val = fact.normalizedValue != null ? fact.normalizedValue : parseFloat(fact.valueFunctional || fact.valueOriginal) || null;

      return {
        id: `rm-${fact.id}`,
        canonicalMetric: fact.canonicalMetric || metricName,
        originalLabel: fact.labelOriginal || fallbackLabel,
        displayLabel: fact.labelOriginal ? `${fact.canonicalMetric} (${fact.labelOriginal})` : fallbackLabel,
        value: val,
        displayValue: this.formatCurrencyValue(val, fact.currencyOriginal || mainCurrency, fact.unitScale),
        currency: fact.currencyOriginal || mainCurrency,
        unitScale: fact.unitScale || "Units",
        reportingPeriod: fact.reportingPeriod || params.reportingPeriod,
        entityScope: fact.entityScope || entityScope,
        factId: fact.id,
        eligibilityStatus: gate.eligibilityStatus,
        confidence: gate.confidence,
        evidenceRef: gate.evidenceRef,
        warnings: gate.warnings
      };
    };

    // =========================================================================
    // A. INCOME STATEMENT GENERATION
    // =========================================================================
    const revMetric = createReportMetric("revenue", "Sales Revenue");
    const cosMetric = createReportMetric("cost_of_sales", "Cost of Sales");
    const gpMetric = createReportMetric("gross_profit", "Gross Profit");
    const opexMetric = createReportMetric("operating_expenses", "Operating Expenses");
    const opIncMetric = createReportMetric("operating_income", "Operating Profit");
    const finIncMetric = createReportMetric("financial_income", "Finance Income / Expense");
    const pbtMetric = createReportMetric("profit_before_tax", "Profit Before Tax");
    const taxMetric = createReportMetric("taxes", "Income Tax Expense");
    const netIncMetric = createReportMetric("net_income", "Net Income");

    const isMetrics: ReportMetric[] = [];
    if (revMetric) isMetrics.push(revMetric);
    if (cosMetric) isMetrics.push(cosMetric);
    if (gpMetric) isMetrics.push(gpMetric);
    if (opexMetric) isMetrics.push(opexMetric);
    if (opIncMetric) isMetrics.push(opIncMetric);
    if (finIncMetric) isMetrics.push(finIncMetric);
    if (pbtMetric) isMetrics.push(pbtMetric);
    if (taxMetric) isMetrics.push(taxMetric);
    if (netIncMetric) isMetrics.push(netIncMetric);

    const incomeStatement = isMetrics.length > 0 ? {
      sections: [
        {
          id: "sec-is-core",
          title: "Operating Results",
          metrics: isMetrics,
          subtotal: netIncMetric?.value ?? null,
          subtotalDisplay: this.formatCurrencyValue(netIncMetric?.value ?? null, mainCurrency)
        }
      ],
      netIncome: netIncMetric?.value ?? null,
      netIncomeDisplay: this.formatCurrencyValue(netIncMetric?.value ?? null, mainCurrency)
    } : undefined;

    // =========================================================================
    // B. BALANCE SHEET GENERATION
    // =========================================================================
    const cashMetric = createReportMetric("cash_and_equivalents", "Cash and Cash Equivalents");
    const recMetric = createReportMetric("receivables", "Trade Receivables");
    const invMetric = createReportMetric("inventory", "Inventories");
    const curAssetMetric = createReportMetric("current_assets", "Total Current Assets");
    const nonCurAssetMetric = createReportMetric("non_current_assets", "Total Non-Current Assets");
    const totAssetMetric = createReportMetric("total_assets", "Total Assets");

    const curLiabMetric = createReportMetric("current_liabilities", "Total Current Liabilities");
    const nonCurLiabMetric = createReportMetric("non_current_liabilities", "Total Non-Current Liabilities");
    const totLiabMetric = createReportMetric("total_liabilities", "Total Liabilities");

    const equityMetric = createReportMetric("equity", "Total Equity");

    const assetMetrics = [cashMetric, recMetric, invMetric, curAssetMetric, nonCurAssetMetric, totAssetMetric].filter(Boolean) as ReportMetric[];
    const liabMetrics = [curLiabMetric, nonCurLiabMetric, totLiabMetric].filter(Boolean) as ReportMetric[];
    const eqMetrics = [equityMetric].filter(Boolean) as ReportMetric[];

    let isBsReconciled = false;
    let bsDiscrepancy = 0;
    let bsStatus: ReportValidationStatus = "UNVERIFIED";

    if (totAssetMetric?.value != null && totLiabMetric?.value != null && equityMetric?.value != null) {
      const calculatedLiabEq = totLiabMetric.value + equityMetric.value;
      bsDiscrepancy = Math.abs(totAssetMetric.value - calculatedLiabEq);
      // Allow minor floating point / rounding threshold (e.g. 1000 units)
      if (bsDiscrepancy < 1000) {
        isBsReconciled = true;
        bsStatus = "RECONCILED";
      } else {
        isBsReconciled = false;
        bsStatus = "DISCREPANCY_DETECTED";
        exceptions.push({
          id: `exc-bs-disc-${Date.now()}`,
          type: "UNRECONCILED_BALANCE_SHEET",
          severity: "CRITICAL",
          message: `Balance sheet identity discrepancy detected: Total Assets (${this.formatCurrencyValue(totAssetMetric.value)}) != Total Liabilities + Equity (${this.formatCurrencyValue(calculatedLiabEq)}). Difference: ${this.formatCurrencyValue(bsDiscrepancy)}.`
        });
      }
    } else if (totAssetMetric || totLiabMetric || equityMetric) {
      bsStatus = "REVIEW_REQUIRED";
      exceptions.push({
        id: `exc-bs-inc-${Date.now()}`,
        type: "MISSING_METRIC",
        severity: "WARNING",
        message: "Balance sheet is incomplete; missing required primary components to verify Assets = Liabilities + Equity identity."
      });
    }

    const balanceSheet = (assetMetrics.length > 0 || liabMetrics.length > 0 || eqMetrics.length > 0) ? {
      assets: {
        id: "sec-bs-assets",
        title: "Assets",
        metrics: assetMetrics,
        subtotal: totAssetMetric?.value ?? null,
        subtotalDisplay: this.formatCurrencyValue(totAssetMetric?.value ?? null, mainCurrency)
      },
      liabilities: {
        id: "sec-bs-liabilities",
        title: "Liabilities",
        metrics: liabMetrics,
        subtotal: totLiabMetric?.value ?? null,
        subtotalDisplay: this.formatCurrencyValue(totLiabMetric?.value ?? null, mainCurrency)
      },
      equity: {
        id: "sec-bs-equity",
        title: "Equity",
        metrics: eqMetrics,
        subtotal: equityMetric?.value ?? null,
        subtotalDisplay: this.formatCurrencyValue(equityMetric?.value ?? null, mainCurrency)
      },
      isReconciled: isBsReconciled,
      discrepancyAmount: bsDiscrepancy,
      status: bsStatus
    } : undefined;

    // =========================================================================
    // C. CASH FLOW STATEMENT GENERATION
    // =========================================================================
    const ocfMetric = createReportMetric("operating_cash_flow", "Cash Flow from Operating Activities");
    const icfMetric = createReportMetric("investing_cash_flow", "Cash Flow from Investing Activities");
    const fcfMetric = createReportMetric("financing_cash_flow", "Cash Flow from Financing Activities");
    const netCashMetric = createReportMetric("net_change_in_cash", "Net Change in Cash");
    const openCashMetric = createReportMetric("opening_cash", "Opening Cash Balance");
    const closeCashMetric = createReportMetric("closing_cash", "Closing Cash Balance");

    const cfOperatingMetrics = [ocfMetric].filter(Boolean) as ReportMetric[];
    const cfInvestingMetrics = [icfMetric].filter(Boolean) as ReportMetric[];
    const cfFinancingMetrics = [fcfMetric].filter(Boolean) as ReportMetric[];

    let isCfReconciled = false;
    if (ocfMetric?.value != null && icfMetric?.value != null && fcfMetric?.value != null) {
      const calcNet = ocfMetric.value + icfMetric.value + fcfMetric.value;
      if (netCashMetric?.value != null) {
        isCfReconciled = Math.abs(calcNet - netCashMetric.value) < 1000;
      } else {
        isCfReconciled = true;
      }
    }

    const cashFlowStatement = (cfOperatingMetrics.length > 0 || cfInvestingMetrics.length > 0 || cfFinancingMetrics.length > 0) ? {
      operating: {
        id: "sec-cf-op",
        title: "Operating Activities",
        metrics: cfOperatingMetrics,
        subtotal: ocfMetric?.value ?? null,
        subtotalDisplay: this.formatCurrencyValue(ocfMetric?.value ?? null, mainCurrency)
      },
      investing: {
        id: "sec-cf-inv",
        title: "Investing Activities",
        metrics: cfInvestingMetrics,
        subtotal: icfMetric?.value ?? null,
        subtotalDisplay: this.formatCurrencyValue(icfMetric?.value ?? null, mainCurrency)
      },
      financing: {
        id: "sec-cf-fin",
        title: "Financing Activities",
        metrics: cfFinancingMetrics,
        subtotal: fcfMetric?.value ?? null,
        subtotalDisplay: this.formatCurrencyValue(fcfMetric?.value ?? null, mainCurrency)
      },
      netChangeInCash: netCashMetric?.value ?? (ocfMetric?.value && icfMetric?.value && fcfMetric?.value ? ocfMetric.value + icfMetric.value + fcfMetric.value : null),
      openingCash: openCashMetric?.value ?? null,
      closingCash: closeCashMetric?.value ?? null,
      isReconciled: isCfReconciled
    } : undefined;

    // =========================================================================
    // 4. COMPARATIVE VARIANCE ANALYSIS ENGINE
    // =========================================================================
    const variances: ReportVariance[] = [];

    if (params.comparativePeriod && comparativePeriodGated.length > 0) {
      // Metric list to compute variances on
      const metricKeys = ["revenue", "cost_of_sales", "gross_profit", "operating_income", "net_income", "total_assets", "total_liabilities", "equity"];

      for (const key of metricKeys) {
        const cur = currentPeriodGated.find(({ fact }) => fact.canonicalMetric === key);
        const comp = comparativePeriodGated.find(({ fact }) => fact.canonicalMetric === key);

        if (cur && comp) {
          const curFact = cur.fact;
          const compFact = comp.fact;

          // Currency compatibility check
          const curCurr = curFact.currencyOriginal || mainCurrency;
          const compCurr = compFact.currencyOriginal || mainCurrency;

          if (curCurr !== compCurr) {
            exceptions.push({
              id: `exc-curr-var-${key}`,
              type: "CURRENCY_MISMATCH",
              severity: "CRITICAL",
              message: `Cannot calculate variance for ${key}: Current period currency (${curCurr}) differs from comparative period currency (${compCurr}) without explicit rate conversion.`,
              factId: curFact.id,
              metric: key
            });
            continue;
          }

          // Entity & Scope compatibility check
          if ((curFact.entityScope || "Consolidated") !== (compFact.entityScope || "Consolidated")) {
            exceptions.push({
              id: `exc-scope-var-${key}`,
              type: "INCOMPATIBLE_SCOPE",
              severity: "WARNING",
              message: `Entity scope mismatch in variance calculation for ${key}: ${curFact.entityScope} vs ${compFact.entityScope}.`,
              factId: curFact.id,
              metric: key
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
            formattedPct = `${(percentageVariance * 100).toFixed(2)}%`;
          }

          const derivedFactId = `var-${key}-${params.reportingPeriod}-${params.comparativePeriod}`;
          derivedFactIds.push(derivedFactId);

          variances.push({
            metricId: key,
            canonicalMetric: key,
            displayLabel: curFact.labelOriginal || key,
            currentPeriod: params.reportingPeriod,
            comparativePeriod: params.comparativePeriod,
            currentValue: curVal,
            comparativeValue: compVal,
            absoluteVariance,
            percentageVariance,
            formattedAbsoluteVariance: this.formatCurrencyValue(absoluteVariance, curCurr, curFact.unitScale),
            formattedPercentageVariance: formattedPct,
            sourceFactIdCurrent: curFact.id,
            sourceFactIdComparative: compFact.id,
            derivedFactId,
            eligibilityStatus: "REPORT_READY",
            warnings: compVal === 0 ? ["Comparative value is zero; percentage variance guarded against division by zero."] : []
          });
        }
      }
    }

    // =========================================================================
    // 5. FINANCIAL RATIOS ENGINE
    // =========================================================================
    const ratios: ReportRatio[] = [];

    const computeRatio = (
      ratioName: string,
      formulaStr: string,
      numKey: string,
      denKey: string
    ) => {
      const numFact = currentPeriodGated.find(({ fact }) => fact.canonicalMetric === numKey);
      const denFact = currentPeriodGated.find(({ fact }) => fact.canonicalMetric === denKey);

      let eligibilityStatus: ReportingEligibilityStatus = "REPORT_READY";
      const ratioWarnings: string[] = [];

      if (!numFact || !denFact) {
        eligibilityStatus = "INSUFFICIENT_EVIDENCE";
        ratioWarnings.push(`Missing required input canonical facts for ${ratioName} (${!numFact ? numKey : ''} ${!denFact ? denKey : ''}).`);
        ratios.push({
          id: `ratio-${ratioName.toLowerCase().replace(/\s+/g, '-')}`,
          name: ratioName,
          value: null,
          formattedValue: "INSUFFICIENT_EVIDENCE",
          formula: formulaStr,
          numeratorMetric: numKey,
          denominatorMetric: denKey,
          numeratorFactId: numFact?.fact.id || null,
          denominatorFactId: denFact?.fact.id || null,
          reportingPeriod: params.reportingPeriod,
          currency: mainCurrency,
          scope: entityScope,
          timestamp: new Date().toISOString(),
          eligibilityStatus,
          warnings: ratioWarnings
        });
        return;
      }

      const numVal = numFact.fact.normalizedValue != null ? numFact.fact.normalizedValue : parseFloat(numFact.fact.valueFunctional || numFact.fact.valueOriginal) || 0;
      const denVal = denFact.fact.normalizedValue != null ? denFact.fact.normalizedValue : parseFloat(denFact.fact.valueFunctional || denFact.fact.valueOriginal) || 0;

      // Currency compatibility check
      if ((numFact.fact.currencyOriginal || mainCurrency) !== (denFact.fact.currencyOriginal || mainCurrency)) {
        exceptions.push({
          id: `exc-curr-ratio-${ratioName}`,
          type: "CURRENCY_MISMATCH",
          severity: "CRITICAL",
          message: `Cannot calculate ${ratioName}: Numerator currency (${numFact.fact.currencyOriginal}) differs from Denominator currency (${denFact.fact.currencyOriginal}).`
        });
        ratios.push({
          id: `ratio-${ratioName.toLowerCase().replace(/\s+/g, '-')}`,
          name: ratioName,
          value: null,
          formattedValue: "CURRENCY_MISMATCH",
          formula: formulaStr,
          numeratorMetric: numKey,
          denominatorMetric: denKey,
          numeratorFactId: numFact.fact.id,
          denominatorFactId: denFact.fact.id,
          reportingPeriod: params.reportingPeriod,
          currency: mainCurrency,
          scope: entityScope,
          timestamp: new Date().toISOString(),
          eligibilityStatus: "INSUFFICIENT_EVIDENCE",
          warnings: ["Currency mismatch between ratio numerator and denominator."]
        });
        return;
      }

      if (denVal === 0) {
        ratioWarnings.push("Denominator is zero; guarded against division by zero.");
        ratios.push({
          id: `ratio-${ratioName.toLowerCase().replace(/\s+/g, '-')}`,
          name: ratioName,
          value: null,
          formattedValue: "N/A (Division by zero)",
          formula: formulaStr,
          numeratorMetric: numKey,
          denominatorMetric: denKey,
          numeratorFactId: numFact.fact.id,
          denominatorFactId: denFact.fact.id,
          reportingPeriod: params.reportingPeriod,
          currency: mainCurrency,
          scope: entityScope,
          timestamp: new Date().toISOString(),
          eligibilityStatus: "INSUFFICIENT_EVIDENCE",
          warnings: ratioWarnings
        });
        return;
      }

      const ratioVal = numVal / denVal;
      let formatted = `${(ratioVal * 100).toFixed(2)}%`;
      if (ratioName.includes("Ratio") || ratioName.includes("Debt")) {
        formatted = `${ratioVal.toFixed(2)}x`;
      }

      const evidenceRef = AuditEvidenceEngine.getEvidenceRecord(numFact.fact, {
        workspaceFacts: params.facts
      });

      ratios.push({
        id: `ratio-${ratioName.toLowerCase().replace(/\s+/g, '-')}`,
        name: ratioName,
        value: Number(ratioVal.toFixed(4)),
        formattedValue: formatted,
        formula: formulaStr,
        numeratorMetric: numKey,
        denominatorMetric: denKey,
        numeratorFactId: numFact.fact.id,
        denominatorFactId: denFact.fact.id,
        reportingPeriod: params.reportingPeriod,
        currency: mainCurrency,
        scope: entityScope,
        timestamp: new Date().toISOString(),
        eligibilityStatus,
        warnings: ratioWarnings,
        evidenceRef
      });
    };

    // Calculate core financial ratios
    computeRatio("Gross Margin", "gross_profit / revenue", "gross_profit", "revenue");
    computeRatio("Operating Margin", "operating_income / revenue", "operating_income", "revenue");
    computeRatio("Net Margin", "net_income / revenue", "net_income", "revenue");
    computeRatio("Current Ratio", "current_assets / current_liabilities", "current_assets", "current_liabilities");
    computeRatio("Debt to Equity", "total_liabilities / equity", "total_liabilities", "equity");
    computeRatio("Return on Assets", "net_income / total_assets", "net_income", "total_assets");
    computeRatio("Return on Equity", "net_income / equity", "net_income", "equity");

    // =========================================================================
    // 6. MANAGEMENT / CPA DETERMINISTIC SUMMARY OBSERVATIONS
    // =========================================================================
    const observations: ManagementObservation[] = [];

    variances.forEach((v) => {
      const direction = v.absoluteVariance > 0 ? "increased" : v.absoluteVariance < 0 ? "decreased" : "remained unchanged";
      const pctText = v.percentageVariance != null ? ` (${v.formattedPercentageVariance})` : "";
      observations.push({
        id: `obs-var-${v.metricId}`,
        type: "CALCULATED_OBSERVATION",
        text: `${v.displayLabel} ${direction} by ${v.formattedAbsoluteVariance}${pctText} in ${v.currentPeriod} compared with ${v.comparativePeriod}.`,
        relatedMetric: v.canonicalMetric,
        sourceFactIds: [v.sourceFactIdCurrent, v.sourceFactIdComparative],
        isAIGeneratedCausal: false
      });
    });

    if (balanceSheet) {
      if (balanceSheet.isReconciled) {
        observations.push({
          id: `obs-bs-rec`,
          type: "CALCULATED_OBSERVATION",
          text: `Balance Sheet is fully reconciled for ${params.reportingPeriod}: Total Assets (${balanceSheet.assets.subtotalDisplay}) equal Total Liabilities + Equity.`,
          relatedMetric: "total_assets",
          sourceFactIds: factIdsUsed,
          isAIGeneratedCausal: false
        });
      }
    }

    // Determine Overall Report Confidence & Validation Status
    let overallConfidenceLevel: ReportConfidenceLevel = "HIGH_CONFIDENCE";
    const gatedConfidences = currentPeriodGated.map((g) => g.gate.confidence.overallAggregateConfidence);
    if (gatedConfidences.length > 0) {
      const avgConf = gatedConfidences.reduce((a, b) => a + b, 0) / gatedConfidences.length;
      if (avgConf < 0.65) overallConfidenceLevel = "LOW_CONFIDENCE";
      else if (avgConf < 0.85) overallConfidenceLevel = "MEDIUM_CONFIDENCE";
    }

    if (exceptions.some((e) => e.type === "HUMAN_REVIEW_REQUIRED")) {
      overallConfidenceLevel = "REVIEW_REQUIRED";
    }

    const overallAccountingStatus: ReportValidationStatus = bsStatus === "RECONCILED" ? "RECONCILED" : bsStatus === "DISCREPANCY_DETECTED" ? "DISCREPANCY_DETECTED" : "REVIEW_REQUIRED";

    return {
      id: reportId,
      workspaceId: params.workspaceId,
      companyId: params.workspaceId,
      reportType,
      title: params.title || `${entityName} ${params.reportingPeriod} Financial Report`,
      reportingPeriod: params.reportingPeriod,
      comparativePeriod: params.comparativePeriod,
      entityName,
      entityScope,
      currency: mainCurrency,
      generatedAt: new Date().toISOString(),
      accountingValidationStatus: overallAccountingStatus,
      overallConfidenceLevel,
      incomeStatement,
      balanceSheet,
      cashFlowStatement,
      variances,
      ratios,
      exceptions,
      observations,
      factIdsUsed: Array.from(new Set(factIdsUsed)),
      derivedFactIds,
      version: "1.0.0"
    };
  }
}
