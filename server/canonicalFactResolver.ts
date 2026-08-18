import { ExtractedFact, ProvenanceCoordinates } from "../src/types.js";
import { SourceAuthorityRanker } from "./sourceAuthorityRanker.js";
import { TableContextResolver } from "./tableContextResolver.js";
import { CurrencyProvenanceEngine } from "./currencyProvenance.js";

export interface CanonicalResolutionResult {
  metric: string;
  primaryFact: ExtractedFact | null;
  alternativeFacts: ExtractedFact[];
  normalizedScalarValue: number | null;
  rawValue?: string | null;
  formattedValue: string;
  currency: string;
  unitScale: string;
  reportingPeriod: string;
  entityName: string;
  entityScope: string;
  statementType: string;
  provenance: {
    documentId: string;
    documentTitle?: string;
    pageNumber: number;
    sourceText: string;
    tableName?: string;
    rowLabel?: string;
    columnLabel?: string;
    provenanceCoordinates?: ProvenanceCoordinates;
  } | null;
  confidenceScore: number;
  resolutionScore: number;
  resolutionNotes: string[];
}

export interface ResolvedFinancialSummary {
  workspaceId: string;
  reportingPeriod: string;
  comparativeReportingPeriod: string;
  entityName: string;
  consolidationScope: string;
  currency: string;
  unitScale: string;

  // Canonical Resolved Metric Fields
  revenue: CanonicalResolutionResult;
  comparativeRevenue: CanonicalResolutionResult;
  costOfSales: CanonicalResolutionResult;
  grossProfit: CanonicalResolutionResult;
  operatingProfit: CanonicalResolutionResult;
  ebitda: CanonicalResolutionResult;
  profitBeforeTax: CanonicalResolutionResult;
  netIncome: CanonicalResolutionResult;
  totalAssets: CanonicalResolutionResult;
  totalLiabilities: CanonicalResolutionResult;
  totalEquity: CanonicalResolutionResult;
  cash: CanonicalResolutionResult;
  operatingCashFlow: CanonicalResolutionResult;
  investingCashFlow: CanonicalResolutionResult;
  financingCashFlow: CanonicalResolutionResult;
  freeCashFlow: CanonicalResolutionResult;

  // Guarded Derived Ratios & Margins
  grossMarginPct: number | null;
  operatingMarginPct: number | null;
  netMarginPct: number | null;
  debtToEquity: number | null;
  returnOnEquity: number | null;
  currentRatio: number | null;

  // Validation & Audit Status
  hasValidatedFacts: boolean;
  accountingIdentityValid: boolean;
  validationMessages: string[];
  allResolvedFacts: ExtractedFact[];
}

export class CanonicalFactResolver {
  /**
   * Evaluates if a fact meets strict customer eligibility requirements.
   * PROPOSED, unscaled, unverified, or non-Tier-1/2 facts (when Tier 1/2 exists) are BLOCKED.
   */
  public static isFactEligibleForCustomer(fact: ExtractedFact): boolean {
    if (!fact) return false;
    
    // Status check
    const status = String(fact.status || "").toUpperCase();
    const verState = String(fact.verificationStatus || fact.verification_state || "").toUpperCase();
    if (status === "PROPOSED" || status === "REJECTED" || status === "BLOCKED") return false;
    if (verState === "UNVERIFIED" || verState === "REJECTED" || verState === "CONFLICTED") return false;

    // Normalized value check
    const val = fact.normalizedValue ?? (fact as any).normalized_value ?? (fact.valueFunctional ? parseFloat(String(fact.valueFunctional)) : null);
    if (val === null || isNaN(val)) return false;

    // Currency check
    const curr = fact.currencyOriginal || fact.currency || fact.functionalCurrency;
    if (!curr) return false;

    // Reject unscaled table cell values (e.g. 11,794 or 10,772 when table scale is millions)
    const rawVal = String(fact.valueOriginal || fact.rawValue || (fact as any).original_value || "").trim();
    if (Math.abs(val) < 1_000_000 && !/\b(billion|million|thousand|bn|mn|k|mio|mrd|teur|t€)\b/i.test(rawVal)) {
      const tableScaleStr = String(fact.unitScale || (fact as any).unit_scale || (fact as any).raw_scale || "").toLowerCase();
      if (tableScaleStr.includes("million") || tableScaleStr.includes("billion") || tableScaleStr.includes("thousand") || tableScaleStr === "millions" || tableScaleStr === "billions" || tableScaleStr === "thousands") {
        return false; // Value was not multiplied by table scale multiplier
      }
    }

    return true;
  }

  /**
   * Helper to normalize currency codes to standard ISO upper-case format.
   */
  public static normalizeCurrency(currStr?: string): string {
    let res = "EUR";
    if (currStr) {
      const clean = currStr.trim().toUpperCase();
      if (clean.includes("EUR") || clean.includes("€")) res = "EUR";
      else if (clean.includes("USD") || clean.includes("$")) res = "USD";
      else if (clean.includes("GBP") || clean.includes("£")) res = "GBP";
      else if (clean.includes("CHF")) res = "CHF";
      else if (clean.includes("JPY") || clean.includes("¥")) res = "JPY";
      else if (clean.includes("CAD")) res = "CAD";
      else if (clean.includes("AUD")) res = "AUD";
      else if (clean.includes("CNY") || clean.includes("RMB")) res = "CNY";
      else res = clean.slice(0, 3) || "EUR";
    }
    return res;
  }

  /**
   * Helper to resolve scale multiplier and normalized unit scale label from explicit document cues,
   * without ever guessing scale based on number magnitude.
   */
  public static resolveScale(
    factOrText: ExtractedFact | string,
    docContextText?: string
  ): { multiplier: number; scaleLabel: string; isExplicit: boolean } {
    let textToScan = "";
    let rawValStr = "";

    if (typeof factOrText === "string") {
      textToScan = `${factOrText} ${docContextText || ""}`.toLowerCase();
    } else if (factOrText) {
      textToScan = [
        (factOrText as any).unitScale,
        (factOrText as any).scaleOriginal,
        (factOrText as any).scale,
        (factOrText as any).reportedUnit,
        factOrText.sourceText,
        factOrText.source_context,
        factOrText.labelOriginal,
        docContextText || ""
      ].filter(Boolean).join(" ").toLowerCase();
      rawValStr = (factOrText.valueOriginal || factOrText.rawValue || "").toLowerCase();
    }

    // Check explicit scale indicators
    if (
      textToScan.includes("billion") ||
      textToScan.includes("€b") ||
      textToScan.includes("$b") ||
      textToScan.includes("in billions") ||
      rawValStr.endsWith("b")
    ) {
      return { multiplier: 1_000_000_000, scaleLabel: "Billions", isExplicit: true };
    }

    if (
      textToScan.includes("million") ||
      textToScan.includes("€m") ||
      textToScan.includes("$m") ||
      textToScan.includes("in millions") ||
      textToScan.includes("€ million") ||
      textToScan.includes("eur million") ||
      textToScan.includes("usd million") ||
      rawValStr.endsWith("m")
    ) {
      return { multiplier: 1_000_000, scaleLabel: "Millions", isExplicit: true };
    }

    if (
      textToScan.includes("thousand") ||
      textToScan.includes("€k") ||
      textToScan.includes("$k") ||
      textToScan.includes("in thousands") ||
      textToScan.includes("€ '000") ||
      textToScan.includes("eur '000") ||
      textToScan.includes("usd '000") ||
      rawValStr.endsWith("k")
    ) {
      return { multiplier: 1_000, scaleLabel: "Thousands", isExplicit: true };
    }

    // Default: Units
    return { multiplier: 1, scaleLabel: "Units", isExplicit: false };
  }

  /**
   * Calculate absolute scalar value in base units, preserving raw value intact.
   */
  public static calculateNormalizedValue(
    factOrRawStr: ExtractedFact | string,
    docContextTextOrScale?: string
  ): number | null {
    if (typeof factOrRawStr === "object" && factOrRawStr !== null) {
      const fact = factOrRawStr;
      // Invariant Check 1: Respect already normalized numeric scalar values in base units
      const funcNum = typeof fact.valueFunctional === "number" 
        ? fact.valueFunctional 
        : typeof fact.valueFunctional === "string" && !isNaN(parseFloat(fact.valueFunctional))
          ? parseFloat(fact.valueFunctional)
          : null;
      
      const normNum = typeof fact.normalizedValue === "number"
        ? fact.normalizedValue
        : typeof fact.normalized_value === "number"
          ? fact.normalized_value
          : null;

      if (normNum !== null && !isNaN(normNum) && normNum !== 0) {
        return normNum;
      }
      if (funcNum !== null && !isNaN(funcNum) && funcNum !== 0) {
        return funcNum;
      }
    }

    const rawStr = typeof factOrRawStr === "string" 
      ? factOrRawStr.trim() 
      : String(factOrRawStr.valueOriginal || factOrRawStr.rawValue || factOrRawStr.valueFunctional || "").trim();

    if (!rawStr) return null;

    let isNegative = false;
    if (rawStr.includes("(") && rawStr.includes(")")) isNegative = true;
    if (rawStr.startsWith("-")) isNegative = true;

    let clean = rawStr.replace(/[^0-9.,]/g, "");
    // CRITICAL PHASE H.5 FIX: Strip trailing sentence/phrase punctuation (commas, dots)
    clean = clean.replace(/[,.]+$/, "");
    if (!clean) return null;

    if (clean.includes(",") && clean.includes(".")) {
      if (clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
        clean = clean.replace(/\./g, "").replace(",", ".");
      } else {
        clean = clean.replace(/,/g, "");
      }
    } else if (clean.includes(",")) {
      const parts = clean.split(",");
      if (parts.length === 2 && parts[1].length <= 2) {
        clean = clean.replace(",", ".");
      } else {
        clean = clean.replace(/,/g, "");
      }
    }

    let num = parseFloat(clean);
    if (isNaN(num)) return null;
    if (isNegative && num > 0) num = -num;

    const scale = this.resolveScale(
      typeof factOrRawStr === "string" ? (docContextTextOrScale || "") : factOrRawStr,
      typeof factOrRawStr === "string" ? "" : docContextTextOrScale
    );
    
    // Invariant Check 2: Prevent double scaling if number is already in base units
    if (Math.abs(num) >= 1_000_000 && scale.multiplier > 1) {
      return num;
    }

    return num * scale.multiplier;
  }

  /**
   * Extract standardized period key e.g. "2024-FY", "2023-FY", "2024-Q3".
   */
  public static resolvePeriod(fact: ExtractedFact): { periodKey: string; periodType: string; isRestated: boolean } {
    const textToScan = [
      fact.reportingPeriod,
      fact.fiscalPeriod,
      fact.fiscalYear,
      fact.periodOriginal,
      fact.periodStart,
      fact.periodEnd,
      fact.columnLabel,
      fact.source_column,
      fact.rowLabel,
      fact.source_row,
      fact.sourceText,
      fact.source_context,
      fact.labelOriginal
    ].filter(Boolean).join(" ").toLowerCase();

    const isRestated = Boolean(
      fact.isRestated ||
      textToScan.includes("restated") ||
      textToScan.includes("reclassified") ||
      textToScan.includes("revised")
    );

    let periodType = fact.periodType || fact.period_type || "annual";
    if (textToScan.includes("q1") || textToScan.includes("q2") || textToScan.includes("q3") || textToScan.includes("q4") || textToScan.includes("3m") || textToScan.includes("9m")) {
      periodType = "quarterly";
    }

    // Match 4-digit year e.g. 2025, 2024, 2023
    const yearMatch = textToScan.match(/\b(20\d{2}|19\d{2})\b/);
    const yearStr = yearMatch ? yearMatch[1] : "2024";

    let periodKey = `${yearStr}-FY`;
    if (periodType === "quarterly") {
      const qMatch = textToScan.match(/\b(q[1-4]|3m|6m|9m)\b/i);
      periodKey = `${yearStr}-${qMatch ? qMatch[1].toUpperCase() : "Q3"}`;
    }

    if (isRestated) {
      periodKey += "-RESTATED";
    }

    return { periodKey, periodType, isRestated };
  }

  /**
   * Extract entity name and consolidation scope without mutating original source fields.
   */
  public static resolveEntityAndScope(fact: ExtractedFact): { entityName: string; entityScope: string } {
    const explicitScope = fact.entityScope || fact.entity_scope || fact.consolidationScope || fact.consolidation_scope || fact.reportingScope || fact.reporting_scope;

    const textToScan = [
      fact.reportingEntity,
      fact.reporting_entity,
      fact.legalEntity,
      fact.legal_entity,
      fact.entityName,
      explicitScope,
      fact.sourceText,
      fact.source_context,
      fact.sourceDocument
    ].filter(Boolean).join(" ").toLowerCase();

    let entityScope = "Consolidated";
    
    if (
      explicitScope === "PARENT_ONLY" ||
      explicitScope === "Parent Only" ||
      textToScan.includes("parent") ||
      textToScan.includes("standalone") ||
      textToScan.includes("holding company") ||
      textToScan.includes("ag standalone")
    ) {
      entityScope = "Parent Only";
    } else if (
      explicitScope === "SUBSIDIARY" ||
      textToScan.includes("subsidiary") ||
      textToScan.includes("audi ag") ||
      textToScan.includes("porsche ag") ||
      textToScan.includes("traton")
    ) {
      entityScope = "Subsidiary";
    } else if (
      explicitScope === "SEGMENT" ||
      textToScan.includes("segment") ||
      textToScan.includes("passenger cars") ||
      textToScan.includes("commercial vehicles") ||
      textToScan.includes("financial services") ||
      textToScan.includes("beauty & wellbeing")
    ) {
      entityScope = "Segment";
    } else if (
      explicitScope === "CONSOLIDATED_GROUP" ||
      explicitScope === "Consolidated" ||
      textToScan.includes("consolidated") ||
      textToScan.includes("group") ||
      textToScan.includes("overall")
    ) {
      entityScope = "Consolidated";
    }

    const entityName = fact.reportingEntity || fact.reporting_entity || fact.legalEntity || fact.legal_entity || fact.entityName || (fact as any).company_id || "Group";

    return { entityName, entityScope };
  }

  /**
   * Deterministic Priority Scoring Algorithm for selecting the authoritative primary canonical fact.
   */
  public static calculateFactPriorityScore(
    fact: ExtractedFact,
    targetMetric: string,
    targetPeriodKey: string,
    workspaceFacts?: ExtractedFact[]
  ): number {
    let score = 0;

    // 0. Source Authority Ranker (Tiers 1-7)
    const rank = SourceAuthorityRanker.rankFactAuthority(fact);
    score += rank.scoreBoost;

    const stmtType = (fact.statementType || fact.statement_type || "").toLowerCase();
    const { entityScope } = this.resolveEntityAndScope(fact);
    const { periodKey, isRestated } = this.resolvePeriod(fact);

    // 1. Statement Type Weight (Primary Statements are authoritative)
    if (
      stmtType === "income_statement" ||
      stmtType === "balance_sheet" ||
      stmtType === "cash_flow" ||
      stmtType === "primary_financial_statement"
    ) {
      score += 40;
    } else if (stmtType === "notes" || stmtType === "note") {
      score += 15;
    } else if (stmtType === "segment" || stmtType === "geography") {
      score += 5;
    } else {
      score += 2; // Narrative or general
    }

    // 2. Consolidation Scope Weight (Consolidated/Group is primary)
    if (entityScope === "Consolidated" || entityScope === "Group") {
      score += 30;
    } else if (entityScope === "Parent Only" || entityScope === "Parent") {
      score += 15;
    } else if (entityScope === "Subsidiary") {
      score += 5;
    } else if (entityScope === "Segment") {
      score += 2;
    }

    // 3. Target Period Alignment
    if (targetPeriodKey) {
      const basePeriodKey = periodKey.replace("-RESTATED", "");
      const baseTargetPeriodKey = targetPeriodKey.replace("-RESTATED", "");

      if (basePeriodKey === baseTargetPeriodKey) {
        score += 35;
      } else if (baseTargetPeriodKey.includes("-") && basePeriodKey.startsWith(baseTargetPeriodKey.split("-")[0])) {
        score += 10;
      } else {
        score -= 30; // Strong penalty when fact period does not match target period
      }
    }

    // 4. Restatement bonus (restated facts override original un-restated for same period)
    if (isRestated) {
      score += 10;
    }

    // 5. Reported vs Derived
    const repOrDer = (fact.reportedOrDerived || fact.reported_or_derived || "reported").toLowerCase();
    if (repOrDer === "reported") {
      score += 10;
    }

    // 6. Confidence score
    const conf = typeof fact.confidence === "number" ? fact.confidence : 0.85;
    score += Math.round(conf * 10);

    // 7. Canonical Metric exact match bonus
    const canon = (fact.canonicalMetric || fact.canonical_metric || "").toLowerCase();
    if (canon === targetMetric.toLowerCase()) {
      score += 15;
    }

    // CRITICAL PHASE H.5 FIX 3: Footnote Subcomponent Penalty
    // Primary statement totals must not be defeated by footnote subcomponents
    const fullContext = [
      fact.labelOriginal,
      fact.labelNormalized,
      fact.sourceText,
      fact.source_context
    ].filter(Boolean).join(" ").toLowerCase();

    const isSubcomponent =
      fullContext.includes("within") ||
      fullContext.includes("component of") ||
      fullContext.includes("included in") ||
      fullContext.includes("part of") ||
      fullContext.includes("note footnote") ||
      fullContext.includes("refer note");

    if (isSubcomponent && ["revenue", "net_income", "total_assets", "total_liabilities", "total_equity", "gross_profit", "operating_profit", "cash", "free_cash_flow", "cost_of_sales", "profit_before_tax"].includes(targetMetric.toLowerCase())) {
      score -= 250; // Severe penalty for subcomponents competing for primary totals
    }

    // CRITICAL PHASE H.5 FIX 11: Materiality-Aware Accounting Identity Assistance
    if (workspaceFacts && workspaceFacts.length > 0) {
      const candVal = this.calculateNormalizedValue(fact);
      if (candVal !== null) {
        if (targetMetric === "revenue") {
          // Check if candVal reconciles Revenue = Gross Profit + Cost of Sales
          const cogsFact = workspaceFacts.find(f => (f.canonicalMetric || "").toLowerCase() === "cost_of_sales");
          const gpFact = workspaceFacts.find(f => (f.canonicalMetric || "").toLowerCase() === "gross_profit");
          if (cogsFact && gpFact) {
            const cogsVal = this.calculateNormalizedValue(cogsFact);
            const gpVal = this.calculateNormalizedValue(gpFact);
            if (cogsVal !== null && gpVal !== null) {
              const expectedRev = Math.abs(gpVal) + Math.abs(cogsVal);
              const variance = Math.abs(candVal - expectedRev);
              const materiality = Math.max(1_000_000, expectedRev * 0.01);
              if (variance <= materiality) {
                score += 100; // Accounting Identity Match Boost
              } else if (variance > expectedRev * 0.1) {
                score -= 200; // Severe Accounting Contradiction Penalty
              }
            }
          }
        } else if (targetMetric === "total_assets") {
          // Assets = Liabilities + Equity
          const liabFact = workspaceFacts.find(f => (f.canonicalMetric || "").toLowerCase() === "total_liabilities");
          const eqFact = workspaceFacts.find(f => (f.canonicalMetric || "").toLowerCase() === "total_equity");
          if (liabFact && eqFact) {
            const liabVal = this.calculateNormalizedValue(liabFact);
            const eqVal = this.calculateNormalizedValue(eqFact);
            if (liabVal !== null && eqVal !== null) {
              const expectedAssets = liabVal + eqVal;
              const variance = Math.abs(candVal - expectedAssets);
              const materiality = Math.max(1_000_000, expectedAssets * 0.01);
              if (variance <= materiality) {
                score += 100;
              } else if (variance > expectedAssets * 0.1) {
                score -= 200;
              }
            }
          }
        }
      }
    }

    // Net Income / Profit Disambiguation Hierarchy Boost / Penalty
    if (targetMetric === "net_income") {
      const isAttributableNci = fullContext.includes("non-controlling") || fullContext.includes("nci") || fullContext.includes("minority interest");
      const isDiscontinued = fullContext.includes("discontinued");
      const isSegmentProfit = fullContext.includes("segment") || fullContext.includes("division");

      if (isAttributableNci || isDiscontinued || isSegmentProfit) {
        score -= 300; // Penalize sub-totals competing for primary Net Income
      } else if (
        fullContext.includes("profit for the year") ||
        fullContext.includes("profit for the period") ||
        fullContext.includes("net profit") ||
        fullContext.includes("net income") ||
        fullContext.includes("jahresüberschuss") ||
        fullContext.includes("resultado del ejercicio") ||
        fullContext.includes("konzernergebnis")
      ) {
        score += 100; // Boost primary profit line item
      }
    }

    // Cash Flow Statement Primary Table Boost
    if (["operating_cash_flow", "investing_cash_flow", "financing_cash_flow", "free_cash_flow"].includes(targetMetric)) {
      if (
        stmtType.includes("cash_flow") ||
        stmtType.includes("primary_financial_statement") ||
        fullContext.includes("cash flow statement") ||
        fullContext.includes("statement of cash flows")
      ) {
        score += 100;
      } else if (fullContext.includes("note") || fullContext.includes("footnote") || fullContext.includes("segment")) {
        score -= 100;
      }
    }

    return score;
  }

  /**
   * Phase H.6.2 Deterministic Primary Statement Fact Promotion Policy (Gates A-I)
   */
  public static promotePrimaryStatementFacts(
    workspaceFacts: ExtractedFact[],
    summary?: ResolvedFinancialSummary
  ): ExtractedFact[] {
    return workspaceFacts.map(fact => {
      // If fact is rejected or human overridden, preserve status
      if (fact.status === "REJECTED" || fact.verificationStatus === "REJECTED") {
        return fact;
      }

      const stmtType = (fact.statementType || fact.statement_type || (fact as any).section_title || (fact as any).tableName || "").toLowerCase();
      const isPrimaryStatement = 
        stmtType.includes("income_statement") ||
        stmtType.includes("balance_sheet") ||
        stmtType.includes("cash_flow") ||
        stmtType.includes("primary_financial_statement") ||
        stmtType.includes("consolidated balance sheet") ||
        stmtType.includes("consolidated income statement") ||
        stmtType.includes("consolidated cash flow") ||
        stmtType.includes("statement of financial position") ||
        stmtType.includes("statement of profit") ||
        stmtType.includes("cash flow statement") ||
        stmtType.includes("bilanz") ||
        stmtType.includes("gewinn- und verlustrechnung");

      // Gate A: Primary Statement Classification
      const gateA = isPrimaryStatement;

      // Gate B: Exact Row / Column Context
      const rowLabel = fact.labelOriginal || fact.rowLabel || (fact as any).source_row || (fact as any).original_label;
      const gateB = Boolean(rowLabel && String(rowLabel).trim().length > 0);

      // Gate C: Currency & Scale Inheritance
      const curr = fact.currencyOriginal || fact.currency || fact.functionalCurrency;
      const gateC = Boolean(curr && ["EUR", "USD", "GBP", "CHF", "JPY", "CAD", "AUD"].includes(String(curr).toUpperCase()));

      // Gate D: Resolved Reporting Period
      const period = fact.reportingPeriod || (fact as any).reporting_period || fact.fiscalPeriod;
      const gateD = Boolean(period && String(period).length >= 4);

      // Gate E: Resolved Consolidation Scope
      const scope = fact.reportingScope || (fact as any).reporting_scope || fact.consolidationScope || (fact as any).consolidation_scope;
      const gateE = Boolean(scope);

      // Gate F & G: Winner Alignment & No Material Conflict
      let gateF_G = true;
      if (summary) {
        const canon = (fact.canonicalMetric || fact.canonical_metric || "").toLowerCase();
        const metricMap: Record<string, string> = {
          revenue: "revenue",
          cost_of_sales: "costOfSales",
          gross_profit: "grossProfit",
          operating_profit: "operatingProfit",
          ebitda: "ebitda",
          profit_before_tax: "profitBeforeTax",
          net_income: "netIncome",
          total_assets: "totalAssets",
          total_liabilities: "totalLiabilities",
          total_equity: "totalEquity",
          cash: "cash",
          operating_cash_flow: "operatingCashFlow",
          investing_cash_flow: "investingCashFlow",
          financing_cash_flow: "financingCashFlow",
          free_cash_flow: "freeCashFlow"
        };
        const propName = metricMap[canon] || canon;
        if (canon && (summary as any)[propName]) {
          const res = (summary as any)[propName] as any;
          if (res && res.primaryFact && res.primaryFact.id !== fact.id) {
            gateF_G = false;
          }
        }
      }

      // Gate H: Complete Provenance
      const docId = fact.documentId || fact.document_id;
      const page = fact.pageNumber || (fact as any).page || (fact as any).source_page;
      const sourceTxt = fact.sourceText || fact.rawText || (fact as any).source_text || (fact as any).source_context;
      const gateH = Boolean(docId && (page > 0 || sourceTxt));

      // Gate I: Accounting Identity Reconciliation
      let gateI = true;
      if (summary && summary.accountingIdentityValid === false) {
        const canon = (fact.canonicalMetric || fact.canonical_metric || "").toLowerCase();
        if (["total_assets", "total_liabilities", "total_equity", "revenue", "cost_of_sales", "gross_profit"].includes(canon)) {
          gateI = false;
        }
      }

      const allGatesPassed = gateA && gateB && gateC && gateD && gateE && gateF_G && gateH && gateI;

      if (allGatesPassed) {
        return {
          ...fact,
          status: "APPROVED",
          verificationStatus: "VERIFIED",
          verification_state: "VERIFIED"
        };
      } else {
        return {
          ...fact,
          status: fact.status === "APPROVED" || fact.status === "VALIDATED" ? "PROPOSED" : (fact.status || "PROPOSED"),
          verificationStatus: fact.verificationStatus === "VERIFIED" ? "PROPOSED" : (fact.verificationStatus || "PROPOSED")
        };
      }
    });
  }

  public static normalizePeriodKey(input?: string): string {
    if (!input) return "2024-FY";
    const str = input.trim().toLowerCase();
    if (str.match(/^(19|20)\d{2}-(fy|q[1-4])$/i)) return str.toUpperCase();
    const yearMatch = str.match(/\b(20\d{2}|19\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : "2024";
    if (str.includes("q1")) return `${year}-Q1`;
    if (str.includes("q2")) return `${year}-Q2`;
    if (str.includes("q3")) return `${year}-Q3`;
    if (str.includes("q4")) return `${year}-Q4`;
    return `${year}-FY`;
  }

  /**
   * Resolve single canonical metric among candidate facts.
   */
  public static resolveMetric(
    arg1: ExtractedFact[] | string,
    arg2: string,
    arg3?: string | ExtractedFact[] | { targetPeriod?: string; targetScope?: string },
    arg4?: { targetPeriod?: string; targetScope?: string } | string
  ): CanonicalResolutionResult {
    let workspaceFacts: ExtractedFact[] = [];
    let targetMetric: string = arg2;
    let targetPeriodKey: string | undefined;
    let targetScopeFilter: string | undefined;

    if (typeof arg4 === "string") {
      targetScopeFilter = arg4;
    } else if (arg4 && typeof arg4 === "object" && arg4.targetScope) {
      targetScopeFilter = arg4.targetScope;
    }

    if (typeof arg1 === "string") {
      const wsId = arg1;
      const facts = Array.isArray(arg3) ? arg3 : [];
      workspaceFacts = facts.length > 0 ? facts.filter(f => f.workspaceId === wsId || f.company_id === wsId || (f as any).project_id === wsId || !f.workspaceId) : [];
      if (workspaceFacts.length === 0) workspaceFacts = facts;
      if (arg4 && typeof arg4 === "object" && arg4.targetPeriod) targetPeriodKey = this.normalizePeriodKey(arg4.targetPeriod);
      else if (typeof arg3 === "string") targetPeriodKey = this.normalizePeriodKey(arg3);
    } else {
      workspaceFacts = Array.isArray(arg1) ? arg1 : [];
      if (typeof arg3 === "string") {
        targetPeriodKey = this.normalizePeriodKey(arg3);
      } else if (arg3 && typeof arg3 === "object") {
        if ("targetPeriod" in arg3 && arg3.targetPeriod) targetPeriodKey = this.normalizePeriodKey(arg3.targetPeriod);
        if ("targetScope" in arg3 && arg3.targetScope) targetScopeFilter = arg3.targetScope;
      }
    }

    if (targetScopeFilter) {
      const filtered = workspaceFacts.filter(f => {
        const s = f.reportingScope || f.reporting_scope || f.consolidationScope || f.entityScope || f.entity_scope;
        if (targetScopeFilter === "PARENT_ONLY") return s === "PARENT_ONLY" || s === "Parent Only";
        if (targetScopeFilter === "CONSOLIDATED_GROUP" || targetScopeFilter === "Consolidated") return s !== "PARENT_ONLY" && s !== "Parent Only";
        return s === targetScopeFilter;
      });
      if (filtered.length > 0) {
        workspaceFacts = filtered;
      }
    }

    const resolutionNotes: string[] = [];

    const monetaryMetrics = new Set([
      "revenue", "comparative_revenue", "cost_of_sales", "gross_profit",
      "operating_profit", "ebitda", "profit_before_tax", "net_income",
      "total_assets", "total_liabilities", "total_equity", "cash",
      "operating_cash_flow", "investing_cash_flow", "financing_cash_flow", "free_cash_flow"
    ]);

    const isMonetaryTarget = monetaryMetrics.has(targetMetric.toLowerCase());

    // Filter matching candidates by canonical metric or normalized label
    const candidates = workspaceFacts.filter((f) => {
      const canon = (f.canonicalMetric || f.canonical_metric || "").toLowerCase();
      const norm = (f.labelNormalized || (f as any).normalized_label || "").toLowerCase();
      const orig = (f.labelOriginal || (f as any).raw_label || "").toLowerCase();
      const sourceText = (f.sourceText || f.rawText || f.source_context || "").toLowerCase();

      // NON-MONETARY / RATIO / ESG GUARD
      if (isMonetaryTarget) {
        const ratioKeywords = [
          "ratio", "margin %", "intensity", "per turnover", "per revenue", "per share",
          "per employee", "growth %", "growth rate", "percentage", "%", "kg", "kwh",
          "tonnes", "co2", "index", "water consumption", "emissions", "carbon"
        ];
        const textToScan = `${norm} ${orig} ${sourceText}`.toLowerCase();
        if (ratioKeywords.some(kw => textToScan.includes(kw))) {
          return false; // Reject non-monetary / ratio / ESG metrics from monetary canonical resolution
        }
      }

      if (canon === targetMetric.toLowerCase()) return true;

      // Label mapping fallbacks
      if (targetMetric === "revenue") {
        return norm === "revenue" || norm === "turnover" || norm.includes("total revenue") || orig.includes("group turnover") || orig.includes("sales revenue") || orig.includes("turnover") || orig.includes("umsatzerlöse");
      }
      if (targetMetric === "comparative_revenue") {
        return norm.includes("comparative revenue") || canon === "comparative_revenue";
      }
      if (targetMetric === "cost_of_sales") {
        return norm === "cost of sales" || norm.includes("cost of revenue") || norm.includes("cost of goods sold") || orig.includes("cost of sales") || orig.includes("cost of goods sold") || orig.includes("umsatzkosten") || orig.includes("coste de las ventas");
      }
      if (targetMetric === "gross_profit") {
        return norm === "gross profit" || orig.includes("gross profit") || orig.includes("bruttoergebnis");
      }
      if (targetMetric === "operating_profit") {
        return norm === "operating profit" || norm === "operating income" || orig.includes("operating result") || orig.includes("operating profit") || orig.includes("operatives ergebnis") || orig.includes("betriebsergebnis");
      }
      if (targetMetric === "ebitda") {
        return norm === "ebitda" || orig.includes("ebitda");
      }
      if (targetMetric === "profit_before_tax") {
        return norm === "profit before tax" || orig.includes("profit before tax") || orig.includes("earnings before tax") || orig.includes("ergebnis vor steuern");
      }
      if (targetMetric === "net_income") {
        return norm === "net income" || norm.includes("net profit") || norm.includes("profit for the year") || norm.includes("profit for the period") || orig.includes("profit for the year") || orig.includes("profit for the period") || orig.includes("net profit") || orig.includes("net income") || orig.includes("jahresüberschuss") || orig.includes("resultado del ejercicio") || orig.includes("profit attributable to equity holders");
      }
      if (targetMetric === "total_assets") {
        return norm === "total assets" || orig.includes("total assets") || orig.includes("bilanzsumme") || orig.includes("summe aktiva");
      }
      if (targetMetric === "total_liabilities") {
        return norm === "total liabilities" || orig.includes("total liabilities") || orig.includes("summe passiva") || orig.includes("verbindlichkeiten");
      }
      if (targetMetric === "total_equity") {
        return norm === "total equity" || orig.includes("total equity") || orig.includes("equity attributable to shareholders") || orig.includes("eigenkapital");
      }
      if (targetMetric === "cash") {
        return norm === "cash" || norm.includes("cash and cash equivalents") || orig.includes("cash and cash equivalents") || orig.includes("flüssige mittel") || orig.includes("kassenbestand");
      }
      if (targetMetric === "operating_cash_flow") {
        const textToScan = `${norm} ${orig} ${sourceText}`.toLowerCase();
        return (
          norm === "operating cash flow" ||
          textToScan.includes("operating cash flow") ||
          textToScan.includes("operating cash flows") ||
          textToScan.includes("cash flow from operating") ||
          textToScan.includes("cash flows from operating") ||
          textToScan.includes("cash from operating") ||
          textToScan.includes("cash generated from operating") ||
          textToScan.includes("cash generated from operations") ||
          textToScan.includes("net cash generated from operating") ||
          textToScan.includes("net cash flow from operating") ||
          textToScan.includes("net cash flows from operating") ||
          textToScan.includes("flujo de efectivo de las actividades de explotación") ||
          textToScan.includes("cashflow aus der laufenden geschäftstätigkeit") ||
          textToScan.includes("flux de trésorerie")
        );
      }
      if (targetMetric === "investing_cash_flow") {
        const textToScan = `${norm} ${orig} ${sourceText}`.toLowerCase();
        return (
          norm.includes("investing cash flow") ||
          textToScan.includes("investing cash flow") ||
          textToScan.includes("cash flow from investing") ||
          textToScan.includes("cash flows from investing") ||
          textToScan.includes("cash used in investing") ||
          textToScan.includes("cash flows used in investing") ||
          textToScan.includes("flujo de efectivo de las actividades de inversión") ||
          textToScan.includes("cashflow aus der investitionstätigkeit")
        );
      }
      if (targetMetric === "financing_cash_flow") {
        const textToScan = `${norm} ${orig} ${sourceText}`.toLowerCase();
        return (
          norm.includes("financing cash flow") ||
          textToScan.includes("financing cash flow") ||
          textToScan.includes("cash flow from financing") ||
          textToScan.includes("cash flows from financing") ||
          textToScan.includes("cash used in financing") ||
          textToScan.includes("cash flows used in financing") ||
          textToScan.includes("flujo de efectivo de las actividades de financiación") ||
          textToScan.includes("cashflow aus der finanzierungstätigkeit")
        );
      }
      if (targetMetric === "free_cash_flow") {
        const textToScan = `${norm} ${orig} ${sourceText}`.toLowerCase();
        return (
          norm === "free cash flow" ||
          textToScan.includes("free cash flow") ||
          textToScan.includes("flujo de caja libre") ||
          textToScan.includes("freier cashflow")
        );
      }

      return false;
    });

    if (candidates.length === 0) {
      return {
        metric: targetMetric,
        primaryFact: null,
        alternativeFacts: [],
        normalizedScalarValue: null,
        rawValue: null,
        formattedValue: "—",
        currency: "EUR",
        unitScale: "—",
        reportingPeriod: targetPeriodKey,
        entityName: "N/A",
        entityScope: "Consolidated",
        statementType: "N/A",
        provenance: null,
        confidenceScore: 0,
        resolutionScore: 0,
        resolutionNotes: [`No extracted fact candidates found for metric "${targetMetric}".`]
      };
    }

    // STEP 4 & STEP 5: SOURCE AUTHORITY HIERARCHY & CUSTOMER ELIGIBILITY GATES
    // 1. Source Authority Filter: If Tier 1/2 Primary Statement candidates exist, Tier 4-6 candidates are STRICTLY DISQUALIFIED
    const primaryMetricsSet = new Set([
      "revenue", "cost_of_sales", "gross_profit", "operating_profit", "profit_before_tax",
      "net_income", "total_assets", "total_liabilities", "total_equity", "cash",
      "operating_cash_flow", "investing_cash_flow", "financing_cash_flow", "free_cash_flow"
    ]);

    let eligiblePool = candidates;
    if (primaryMetricsSet.has(targetMetric.toLowerCase())) {
      const hasTier1or2 = candidates.some(f => {
        const rank = SourceAuthorityRanker.rankFactAuthority(f);
        return rank.tier === 1 || rank.tier === 2;
      });
      if (hasTier1or2) {
        eligiblePool = candidates.filter(f => {
          const rank = SourceAuthorityRanker.rankFactAuthority(f);
          return rank.tier === 1 || rank.tier === 2 || rank.tier === 3;
        });
      }
    }

    // Score all candidates deterministically
    const scoredCandidates = eligiblePool.map((fact) => {
      const score = this.calculateFactPriorityScore(fact, targetMetric, targetPeriodKey || "2024-FY", workspaceFacts);
      const normalizedValue = this.calculateNormalizedValue(fact);
      return { fact, score, normalizedValue };
    }).sort((a, b) => b.score - a.score);

    // 2. Customer Eligibility Filter: PROPOSED, unscaled, or unverified facts CANNOT become customer-facing canonical winners
    const customerEligibleCandidates = scoredCandidates.filter(c => this.isFactEligibleForCustomer(c.fact));

    if (customerEligibleCandidates.length === 0) {
      return {
        metric: targetMetric,
        primaryFact: null,
        alternativeFacts: candidates,
        normalizedScalarValue: null,
        rawValue: null,
        formattedValue: "—",
        currency: "EUR",
        unitScale: "—",
        reportingPeriod: targetPeriodKey || "2024-FY",
        entityName: "N/A",
        entityScope: "Consolidated",
        statementType: "N/A",
        provenance: null,
        confidenceScore: 0,
        resolutionScore: 0,
        resolutionNotes: [`No customer-eligible canonical facts found for metric "${targetMetric}". All ${candidates.length} candidates were PROPOSED, unscaled, or disqualified by Source Authority Hierarchy.`]
      };
    }

    const primary = customerEligibleCandidates[0];
    const alternativeFacts = scoredCandidates.filter(c => c.fact.id !== primary.fact.id).map(c => c.fact);

    // Multi-Document Corroboration Detection
    if (primary && primary.normalizedValue !== null) {
      const corroborating = scoredCandidates.slice(1).filter((c) => {
        if (c.normalizedValue === null) return false;
        const diff = Math.abs(c.normalizedValue - primary.normalizedValue);
        const relDiff = primary.normalizedValue !== 0 ? diff / Math.abs(primary.normalizedValue) : diff;
        return relDiff < 0.001; // Within 0.1% numeric tolerance across filings
      });

      if (corroborating.length > 0) {
        primary.fact.corroboratingSources = corroborating.map((c) => ({
          documentId: c.fact.documentId || c.fact.document_id || "N/A",
          documentName: c.fact.sourceDocument || "Secondary Filing",
          pageNumber: c.fact.pageNumber || c.fact.source_page || 1,
          tableName: c.fact.tableName || c.fact.source_table,
          rawValue: String(c.fact.rawValue || (c.fact as any).numericValue || c.fact.normalized_value || c.normalizedValue),
          confidence: c.fact.confidence || 0.90,
          sourceText: c.fact.sourceText || c.fact.rawText
        }));
      }
    }

    const { entityName, entityScope } = this.resolveEntityAndScope(primary.fact);
    const { periodKey } = this.resolvePeriod(primary.fact);
    const scale = this.resolveScale(primary.fact);
    const curr = this.normalizeCurrency(primary.fact.currencyOriginal || primary.fact.currency);

    const val = primary.normalizedValue;
    const getSymbol = (c: string) => {
      const u = (c || "").toUpperCase();
      if (u === "EUR") return "€";
      if (u === "USD") return "$";
      if (u === "GBP") return "£";
      if (u === "CHF") return "CHF ";
      if (u === "JPY") return "¥";
      return c ? `${c} ` : "$";
    };
    const sym = getSymbol(curr);

    let formattedVal = "—";
    if (val !== null && !isNaN(val)) {
      const abs = Math.abs(val);
      const sign = val < 0 ? "-" : "";
      if (abs >= 1_000_000_000) {
        formattedVal = `${sign}${sym}${(abs / 1_000_000_000).toFixed(2)}B`;
      } else if (abs >= 1_000_000) {
        formattedVal = `${sign}${sym}${(abs / 1_000_000).toFixed(2)}M`;
      } else if (abs >= 1_000) {
        formattedVal = `${sign}${sym}${(abs / 1_000).toFixed(2)}K`;
      } else {
        formattedVal = `${sign}${sym}${abs.toFixed(2)}`;
      }
    }

    resolutionNotes.push(`Selected primary canonical fact ID ${primary.fact.id} with priority score ${primary.score}.`);
    if (alternativeFacts.length > 0) {
      resolutionNotes.push(`Preserved ${alternativeFacts.length} alternative source facts in lineage registry.`);
    }

    return {
      metric: targetMetric,
      primaryFact: primary.fact,
      alternativeFacts,
      normalizedScalarValue: val,
      formattedValue: formattedVal,
      currency: curr,
      unitScale: scale.scaleLabel,
      reportingPeriod: periodKey,
      entityName,
      entityScope,
      statementType: primary.fact.statementType || primary.fact.statement_type || "primary_statement",
      provenance: primary.fact ? {
        documentId: primary.fact.documentId || primary.fact.document_id || "N/A",
        documentTitle: primary.fact.sourceDocument,
        pageNumber: primary.fact.pageNumber || primary.fact.source_page || 1,
        sourceText: primary.fact.sourceText || primary.fact.rawText || "",
        tableName: primary.fact.tableName || primary.fact.source_table,
        rowLabel: primary.fact.rowLabel || primary.fact.source_row,
        columnLabel: primary.fact.columnLabel || primary.fact.source_column,
        provenanceCoordinates: primary.fact.provenance
      } : null,
      confidenceScore: primary.fact.confidence || 0.85,
      resolutionScore: primary.score,
      resolutionNotes
    };
  }

  private static areFactsCompatibleForRatio(
    f1: CanonicalResolutionResult,
    f2: CanonicalResolutionResult,
    ratioName: string,
    validationMessages: string[]
  ): boolean {
    if (f1.normalizedScalarValue === null || f2.normalizedScalarValue === null) return false;
    if (String(f1.reportingPeriod) !== String(f2.reportingPeriod)) {
      validationMessages.push(`${ratioName} Guard: Period mismatch between ${f1.metric} (${f1.reportingPeriod}) and ${f2.metric} (${f2.reportingPeriod}).`);
      return false;
    }
    if (String(f1.currency) !== String(f2.currency)) {
      validationMessages.push(`${ratioName} Guard: Currency mismatch between ${f1.metric} (${f1.currency}) and ${f2.metric} (${f2.currency}).`);
      return false;
    }
    if (String(f1.entityScope) !== String(f2.entityScope)) {
      validationMessages.push(`${ratioName} Guard: Consolidation scope mismatch between ${f1.metric} (${f1.entityScope}) and ${f2.metric} (${f2.entityScope}).`);
      return false;
    }
    return true;
  }

  /**
   * Master Resolver: Resolves complete canonical financial summary for workspace.
   */
  public static resolveWorkspaceSummary(
    workspaceId: string,
    workspaceFacts: ExtractedFact[]
  ): ResolvedFinancialSummary {
    let wsFacts = workspaceFacts.filter(
      (f) => f.workspaceId === workspaceId || f.company_id === workspaceId || (f as any).project_id === workspaceId
    );
    if (wsFacts.length === 0) {
      wsFacts = workspaceFacts;
    }

    // Auto-detect target primary period (prefer latest annual period across facts)
    const annualPeriods = wsFacts
      .map((f) => this.resolvePeriod(f).periodKey)
      .filter((p) => p.endsWith("-FY"))
      .sort((a, b) => b.localeCompare(a));

    const targetPeriodKey = annualPeriods[0] || "2025-FY";
    const targetCompPeriodKey = annualPeriods[1] || "2024-FY";

    const revenue = this.resolveMetric(wsFacts, "revenue", targetPeriodKey);
    const comparativeRevenue = this.resolveMetric(wsFacts, "comparative_revenue", targetCompPeriodKey);
    const costOfSales = this.resolveMetric(wsFacts, "cost_of_sales", targetPeriodKey);
    const grossProfit = this.resolveMetric(wsFacts, "gross_profit", targetPeriodKey);
    const operatingProfit = this.resolveMetric(wsFacts, "operating_profit", targetPeriodKey);
    const ebitda = this.resolveMetric(wsFacts, "ebitda", targetPeriodKey);
    const profitBeforeTax = this.resolveMetric(wsFacts, "profit_before_tax", targetPeriodKey);
    const netIncome = this.resolveMetric(wsFacts, "net_income", targetPeriodKey);
    const totalAssets = this.resolveMetric(wsFacts, "total_assets", targetPeriodKey);
    const totalLiabilities = this.resolveMetric(wsFacts, "total_liabilities", targetPeriodKey);
    const totalEquity = this.resolveMetric(wsFacts, "total_equity", targetPeriodKey);
    const cash = this.resolveMetric(wsFacts, "cash", targetPeriodKey);
    const operatingCashFlow = this.resolveMetric(wsFacts, "operating_cash_flow", targetPeriodKey);
    const investingCashFlow = this.resolveMetric(wsFacts, "investing_cash_flow", targetPeriodKey);
    const financingCashFlow = this.resolveMetric(wsFacts, "financing_cash_flow", targetPeriodKey);
    const freeCashFlow = this.resolveMetric(wsFacts, "free_cash_flow", targetPeriodKey);

    // Context-Aware Guarded Derived Ratios
    const validationMessages: string[] = [];

    // 1. Gross Margin % Guard
    let grossMarginPct: number | null = null;
    const revVal = revenue.normalizedScalarValue;
    let gpVal = grossProfit.normalizedScalarValue;
    const cogsVal = costOfSales.normalizedScalarValue;

    if (gpVal === null && revVal !== null && cogsVal !== null) {
      gpVal = revVal - Math.abs(cogsVal);
    }

    if (revVal !== null && revVal > 0 && gpVal !== null) {
      if (this.areFactsCompatibleForRatio(grossProfit, revenue, "Gross Margin", validationMessages) || (gpVal === revVal - Math.abs(cogsVal || 0) && revenue.reportingPeriod === targetPeriodKey)) {
        grossMarginPct = parseFloat(((gpVal / revVal) * 100).toFixed(2));
      }
    }

    // 2. Operating Margin % Guard
    let operatingMarginPct: number | null = null;
    const opVal = operatingProfit.normalizedScalarValue;
    if (revVal !== null && revVal > 0 && opVal !== null) {
      if (this.areFactsCompatibleForRatio(operatingProfit, revenue, "Operating Margin", validationMessages)) {
        operatingMarginPct = parseFloat(((opVal / revVal) * 100).toFixed(2));
      }
    }

    // 3. Net Margin % Guard
    let netMarginPct: number | null = null;
    const niVal = netIncome.normalizedScalarValue;
    if (revVal !== null && revVal > 0 && niVal !== null) {
      if (this.areFactsCompatibleForRatio(netIncome, revenue, "Net Margin", validationMessages)) {
        netMarginPct = parseFloat(((niVal / revVal) * 100).toFixed(2));
      }
    }

    // 4. Return on Equity (ROE) Guard
    let returnOnEquity: number | null = null;
    const eqVal = totalEquity.normalizedScalarValue;
    if (niVal !== null && eqVal !== null && eqVal > 0) {
      if (this.areFactsCompatibleForRatio(netIncome, totalEquity, "Return on Equity", validationMessages)) {
        returnOnEquity = parseFloat(((niVal / eqVal) * 100).toFixed(2));
      }
    }

    // 5. Debt to Equity Guard
    let debtToEquity: number | null = null;
    const liabVal = totalLiabilities.normalizedScalarValue;
    if (liabVal !== null && eqVal !== null && eqVal > 0) {
      if (this.areFactsCompatibleForRatio(totalLiabilities, totalEquity, "Debt to Equity", validationMessages)) {
        debtToEquity = parseFloat((liabVal / eqVal).toFixed(2));
      }
    }

    // Balance Sheet Accounting Identity Audit Pass (Assets = Liabilities + Equity)
    let accountingIdentityValid = true;
    const assetsVal = totalAssets.normalizedScalarValue;
    if (assetsVal !== null && liabVal !== null && eqVal !== null && assetsVal > 0) {
      const expectedAssets = liabVal + eqVal;
      const diff = Math.abs(assetsVal - expectedAssets);
      if (diff / assetsVal > 0.03) {
        accountingIdentityValid = false;
        validationMessages.push(
          `Accounting Identity Mismatch: Total Assets (${assetsVal}) ≠ Liabilities (${liabVal}) + Equity (${eqVal})`
        );
      }
    }

    const allResolvedFacts = [
      revenue.primaryFact,
      comparativeRevenue.primaryFact,
      costOfSales.primaryFact,
      grossProfit.primaryFact,
      operatingProfit.primaryFact,
      ebitda.primaryFact,
      profitBeforeTax.primaryFact,
      netIncome.primaryFact,
      totalAssets.primaryFact,
      totalLiabilities.primaryFact,
      totalEquity.primaryFact,
      cash.primaryFact,
      operatingCashFlow.primaryFact,
      investingCashFlow.primaryFact,
      financingCashFlow.primaryFact,
      freeCashFlow.primaryFact
    ].filter(Boolean) as ExtractedFact[];

    return {
      workspaceId,
      reportingPeriod: targetPeriodKey,
      comparativeReportingPeriod: targetCompPeriodKey,
      entityName: revenue.entityName !== "N/A" ? revenue.entityName : "Group",
      consolidationScope: revenue.entityScope,
      currency: revenue.currency,
      unitScale: revenue.unitScale,

      revenue,
      comparativeRevenue,
      costOfSales,
      grossProfit,
      operatingProfit,
      ebitda,
      profitBeforeTax,
      netIncome,
      totalAssets,
      totalLiabilities,
      totalEquity,
      cash,
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      freeCashFlow,

      grossMarginPct,
      operatingMarginPct,
      netMarginPct,
      debtToEquity,
      returnOnEquity,
      currentRatio: null,

      hasValidatedFacts: wsFacts.length > 0,
      accountingIdentityValid,
      validationMessages,
      allResolvedFacts
    };
  }
}
