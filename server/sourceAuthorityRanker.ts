/**
 * PHASE H.4 — SOURCE AUTHORITY RANKER
 *
 * Ranks fact sources strictly into hierarchical authority tiers (Tier 1 to Tier 7)
 * to ensure that primary audited financial statements always take precedence over narrative,
 * notes, or ESG/sustainability tables.
 *
 * Tiers:
 * - Tier 1: Primary Audited Financial Statements (Income Statement, Balance Sheet, Cash Flow, Equity) (+100)
 * - Tier 2: Audited Notes supporting primary statements (+50)
 * - Tier 3: Official Financial Highlights / Reconciliations (+30)
 * - Tier 4: MD&A / Management Discussion & Analysis (+10)
 * - Tier 5: Narrative Prose (0)
 * - Tier 6: ESG / Sustainability / Operational KPI Tables (-100)
 * - Tier 7: Unrelated Footnotes / Non-Financial Footnotes (-150)
 */

import { ExtractedFact } from "../src/types.js";

export interface AuthorityRankResult {
  tier: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  scoreBoost: number;
  isPrimaryStatement: boolean;
  isAuditedNote: boolean;
  isESGTable: boolean;
  isNarrative: boolean;
  tierDescription: string;
}

export class SourceAuthorityRanker {

  /**
   * Evaluate authority tier and priority boost for a given fact.
   */
  public static rankFactAuthority(fact: ExtractedFact): AuthorityRankResult {
    const stmtType = (fact.statementType || fact.statement_type || "").toLowerCase();
    const sectionTitle = (fact.statementSection || (fact as any).section_title || "").toLowerCase();
    const tableName = (fact.tableName || fact.source_table || "").toLowerCase();
    const labelOrig = (fact.labelOriginal || (fact as any).raw_label || "").toLowerCase();
    const labelNorm = (fact.labelNormalized || (fact as any).normalized_label || "").toLowerCase();
    const sourceText = (fact.sourceText || fact.rawText || fact.source_context || "").toLowerCase();

    const fullTextToScan = [
      stmtType,
      sectionTitle,
      tableName,
      labelOrig,
      labelNorm,
      sourceText
    ].join(" ");

    // 1. Detect Tier 6 & Tier 7 ESG / Sustainability / Operational KPI tables first
    const esgKeywords = [
      "water consumption",
      "water intensity",
      "carbon intensity",
      "co2",
      "ghg",
      "greenhouse gas",
      "emissions",
      "waste generated",
      "kwh",
      "energy intensity",
      "employee turnover",
      "gender diversity",
      "safety incidents",
      "injury rate",
      "esg",
      "sustainability report",
      "gri index",
      "sasb",
      "scope 1",
      "scope 2",
      "scope 3",
      "plastic packaging",
      "recyclable material",
      "per turnover",
      "per million revenue"
    ];

    const isESGTable = esgKeywords.some(kw => fullTextToScan.includes(kw));
    if (isESGTable) {
      return {
        tier: 6,
        scoreBoost: -100,
        isPrimaryStatement: false,
        isAuditedNote: false,
        isESGTable: true,
        isNarrative: false,
        tierDescription: "Tier 6: ESG / Sustainability / Operational KPI Table"
      };
    }

    // 2. Detect Tier 1: Primary Audited Financial Statements
    const isIncomeStatement =
      stmtType === "income_statement" ||
      fullTextToScan.includes("consolidated income statement") ||
      fullTextToScan.includes("consolidated statement of profit or loss") ||
      fullTextToScan.includes("gewinn- und verlustrechnung");

    const isBalanceSheet =
      stmtType === "balance_sheet" ||
      fullTextToScan.includes("consolidated balance sheet") ||
      fullTextToScan.includes("consolidated statement of financial position") ||
      fullTextToScan.includes("bilanz zum");

    const isCashFlow =
      stmtType === "cash_flow" ||
      fullTextToScan.includes("consolidated statement of cash flows") ||
      fullTextToScan.includes("kapitalflussrechnung");

    const isEquityStatement =
      stmtType === "equity" ||
      fullTextToScan.includes("statement of changes in equity") ||
      fullTextToScan.includes("eigenkapitalveränderungsrechnung");

    const isPrimaryStatement = isIncomeStatement || isBalanceSheet || isCashFlow || isEquityStatement;

    if (isPrimaryStatement) {
      // De-prioritize page 1-3 cover / table of contents / executive summary highlights to Tier 3 unless explicitly titled consolidated statement
      const pageNum = typeof fact.pageNumber === 'number' ? fact.pageNumber : parseInt((fact as any).page_number || '0', 10);
      const isPage1To3 = pageNum > 0 && pageNum <= 3;
      const isExplicitStatementTitle =
        fullTextToScan.includes("consolidated statement of profit or loss") ||
        fullTextToScan.includes("consolidated income statement") ||
        fullTextToScan.includes("consolidated balance sheet") ||
        fullTextToScan.includes("consolidated statement of financial position") ||
        fullTextToScan.includes("consolidated statement of cash flows") ||
        fullTextToScan.includes("statement of changes in equity");

      if (isPage1To3 && !isExplicitStatementTitle) {
        return {
          tier: 3,
          scoreBoost: 30,
          isPrimaryStatement: false,
          isAuditedNote: false,
          isESGTable: false,
          isNarrative: false,
          tierDescription: "Tier 3: Executive Summary / Highlights (Page 1-3)"
        };
      }

      return {
        tier: 1,
        scoreBoost: 100,
        isPrimaryStatement: true,
        isAuditedNote: false,
        isESGTable: false,
        isNarrative: false,
        tierDescription: "Tier 1: Audited Primary Financial Statement"
      };
    }

    // 3. Detect Tier 2: Audited Notes
    const isAuditedNote =
      stmtType === "notes" ||
      stmtType === "note" ||
      fullTextToScan.includes("notes to the consolidated financial statements") ||
      fullTextToScan.includes("note 1") ||
      fullTextToScan.includes("note 2") ||
      fullTextToScan.includes("anhang");

    if (isAuditedNote) {
      return {
        tier: 2,
        scoreBoost: 50,
        isPrimaryStatement: false,
        isAuditedNote: true,
        isESGTable: false,
        isNarrative: false,
        tierDescription: "Tier 2: Audited Notes to Financial Statements"
      };
    }

    // 4. Detect Tier 3: Highlights & Reconciliations
    if (fullTextToScan.includes("financial highlights") || fullTextToScan.includes("reconciliation") || fullTextToScan.includes("key performance indicators")) {
      return {
        tier: 3,
        scoreBoost: 30,
        isPrimaryStatement: false,
        isAuditedNote: false,
        isESGTable: false,
        isNarrative: false,
        tierDescription: "Tier 3: Official Financial Highlights / Reconciliations"
      };
    }

    // 5. Detect Tier 4: MD&A / Strategic Report
    if (fullTextToScan.includes("management discussion") || fullTextToScan.includes("strategic report") || fullTextToScan.includes("lagebericht")) {
      return {
        tier: 4,
        scoreBoost: 10,
        isPrimaryStatement: false,
        isAuditedNote: false,
        isESGTable: false,
        isNarrative: true,
        tierDescription: "Tier 4: Management Discussion and Analysis (MD&A)"
      };
    }

    // 6. Tier 5: Narrative Prose
    return {
      tier: 5,
      scoreBoost: 0,
      isPrimaryStatement: false,
      isAuditedNote: false,
      isESGTable: false,
      isNarrative: true,
      tierDescription: "Tier 5: Narrative Prose"
    };
  }
}
