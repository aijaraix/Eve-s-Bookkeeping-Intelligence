import { ExtractedFact, ProvenanceCoordinates } from "../src/types.js";

export interface CanonicalResolutionResult {
  metric: string;
  primaryFact: ExtractedFact | null;
  alternativeFacts: ExtractedFact[];
  normalizedScalarValue: number | null;
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
   * Helper to normalize currency codes to standard ISO upper-case format.
   */
  public static normalizeCurrency(currStr?: string): string & { code: string } {
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
    const strObj = Object.assign(new String(res), {
      code: res,
      [Symbol.toPrimitive]() { return res; },
      valueOf() { return res; },
      toString() { return res; }
    });
    return strObj as any;
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
        factOrText.scaleOriginal,
        factOrText.scale,
        factOrText.reportedUnit,
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
      if (typeof fact.normalizedValue === "number" && !isNaN(fact.normalizedValue) && fact.normalizedValue !== 0) {
        return fact.normalizedValue;
      }
      if (typeof fact.normalized_value === "number" && !isNaN(fact.normalized_value) && fact.normalized_value !== 0) {
        return fact.normalized_value;
      }
      if (typeof fact.valueFunctional === "number" && !isNaN(fact.valueFunctional) && fact.valueFunctional !== 0) {
        return fact.valueFunctional;
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
    
    if (Math.abs(num) >= 1_000_000_000 && scale.multiplier > 1) {
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
    const explicitScope = fact.entityScope || fact.entity_scope || fact.consolidationScope;
    if (explicitScope && explicitScope !== "Consolidated") {
      return {
        entityName: fact.entityName || (fact as any).company_id || "Group",
        entityScope: explicitScope
      };
    }

    const textToScan = [
      fact.entityName,
      fact.entityScope,
      fact.entity_scope,
      fact.consolidationScope,
      fact.sourceText,
      fact.source_context,
      fact.sourceDocument
    ].filter(Boolean).join(" ").toLowerCase();

    let entityScope = explicitScope || "Consolidated";
    
    if (
      textToScan.includes("parent") ||
      textToScan.includes("standalone") ||
      textToScan.includes("holding company") ||
      textToScan.includes("ag standalone")
    ) {
      entityScope = "Parent Only";
    } else if (
      textToScan.includes("subsidiary") ||
      textToScan.includes("audi ag") ||
      textToScan.includes("porsche ag") ||
      textToScan.includes("traton")
    ) {
      entityScope = "Subsidiary";
    } else if (
      textToScan.includes("segment") ||
      textToScan.includes("passenger cars") ||
      textToScan.includes("commercial vehicles") ||
      textToScan.includes("financial services")
    ) {
      entityScope = "Segment";
    } else if (
      textToScan.includes("consolidated") ||
      textToScan.includes("group") ||
      textToScan.includes("overall")
    ) {
      entityScope = "Consolidated";
    }

    const entityName = fact.entityName || (fact as any).company_id || "Group";

    return { entityName, entityScope };
  }

  /**
   * Deterministic Priority Scoring Algorithm for selecting the authoritative primary canonical fact.
   */
  public static calculateFactPriorityScore(
    fact: ExtractedFact,
    targetMetric: string,
    targetPeriodKey: string
  ): number {
    let score = 0;

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
      if (periodKey === targetPeriodKey) {
        score += 35;
      } else if (targetPeriodKey.includes("-") && periodKey.startsWith(targetPeriodKey.split("-")[0])) {
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

    return score;
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
    arg3?: string | ExtractedFact[] | { targetPeriod?: string },
    arg4?: { targetPeriod?: string }
  ): CanonicalResolutionResult {
    let workspaceFacts: ExtractedFact[] = [];
    let targetMetric: string = arg2;
    let targetPeriodKey: string | undefined;

    if (typeof arg1 === "string") {
      const wsId = arg1;
      const facts = Array.isArray(arg3) ? arg3 : [];
      workspaceFacts = facts.length > 0 ? facts.filter(f => f.workspaceId === wsId || f.company_id === wsId || (f as any).project_id === wsId || !f.workspaceId) : [];
      if (workspaceFacts.length === 0) workspaceFacts = facts;
      if (arg4?.targetPeriod) targetPeriodKey = this.normalizePeriodKey(arg4.targetPeriod);
      else if (typeof arg3 === "string") targetPeriodKey = this.normalizePeriodKey(arg3);
    } else {
      workspaceFacts = Array.isArray(arg1) ? arg1 : [];
      if (typeof arg3 === "string") {
        targetPeriodKey = this.normalizePeriodKey(arg3);
      } else if (arg3 && typeof arg3 === "object" && "targetPeriod" in arg3) {
        targetPeriodKey = this.normalizePeriodKey((arg3 as any).targetPeriod);
      }
    }

    const resolutionNotes: string[] = [];

    // Filter matching candidates by canonical metric or normalized label
    const candidates = workspaceFacts.filter((f) => {
      const canon = (f.canonicalMetric || f.canonical_metric || "").toLowerCase();
      const norm = (f.labelNormalized || (f as any).normalized_label || "").toLowerCase();
      const orig = (f.labelOriginal || (f as any).raw_label || "").toLowerCase();

      if (canon === targetMetric.toLowerCase()) return true;

      // Label mapping fallbacks
      if (targetMetric === "revenue") {
        return norm === "revenue" || norm.includes("total revenue") || orig.includes("group turnover") || orig.includes("sales revenue");
      }
      if (targetMetric === "comparative_revenue") {
        return norm.includes("comparative revenue") || canon === "comparative_revenue";
      }
      if (targetMetric === "cost_of_sales") {
        return norm === "cost of sales" || norm.includes("cost of revenue") || orig.includes("cost of sales");
      }
      if (targetMetric === "gross_profit") {
        return norm === "gross profit" || orig.includes("gross profit");
      }
      if (targetMetric === "operating_profit") {
        return norm === "operating profit" || norm === "operating income" || orig.includes("operating result") || orig.includes("operating profit");
      }
      if (targetMetric === "ebitda") {
        return norm === "ebitda" || orig.includes("ebitda");
      }
      if (targetMetric === "profit_before_tax") {
        return norm === "profit before tax" || orig.includes("profit before tax") || orig.includes("earnings before tax");
      }
      if (targetMetric === "net_income") {
        return norm === "net income" || norm.includes("net profit") || orig.includes("profit for the year") || orig.includes("profit attributable to equity holders");
      }
      if (targetMetric === "total_assets") {
        return norm === "total assets" || orig.includes("total assets");
      }
      if (targetMetric === "total_liabilities") {
        return norm === "total liabilities" || orig.includes("total liabilities");
      }
      if (targetMetric === "total_equity") {
        return norm === "total equity" || orig.includes("total equity") || orig.includes("equity attributable to shareholders");
      }
      if (targetMetric === "cash") {
        return norm === "cash" || norm.includes("cash and cash equivalents") || orig.includes("cash and cash equivalents");
      }
      if (targetMetric === "operating_cash_flow") {
        return norm === "operating cash flow" || orig.includes("net cash flow from operating activities");
      }
      if (targetMetric === "investing_cash_flow") {
        return norm.includes("investing cash flow") || orig.includes("net cash flow from investing activities");
      }
      if (targetMetric === "financing_cash_flow") {
        return norm.includes("financing cash flow") || orig.includes("net cash flow from financing activities");
      }
      if (targetMetric === "free_cash_flow") {
        return norm === "free cash flow" || orig.includes("free cash flow");
      }

      return false;
    });

    if (candidates.length === 0) {
      return {
        metric: targetMetric,
        primaryFact: null,
        alternativeFacts: [],
        normalizedScalarValue: null,
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

    // Score all candidates deterministically
    const scoredCandidates = candidates.map((fact) => {
      const score = this.calculateFactPriorityScore(fact, targetMetric, targetPeriodKey);
      const normalizedValue = this.calculateNormalizedValue(fact);
      return { fact, score, normalizedValue };
    }).sort((a, b) => b.score - a.score);

    const primary = scoredCandidates[0];
    const alternativeFacts = scoredCandidates.slice(1).map((c) => c.fact);

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
    const wsFacts = workspaceFacts.filter(
      (f) => f.workspaceId === workspaceId || f.company_id === workspaceId || (f as any).project_id === workspaceId
    );

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
