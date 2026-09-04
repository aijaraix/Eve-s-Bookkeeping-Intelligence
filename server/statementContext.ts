/**
 * Statement Context Model & Classification Engine
 * Universal Financial Statement Semantics for General Accounting & Document Intelligence
 */

export enum StatementType {
  CONSOLIDATED_INCOME_STATEMENT = "CONSOLIDATED_INCOME_STATEMENT",
  CONSOLIDATED_BALANCE_SHEET = "CONSOLIDATED_BALANCE_SHEET",
  CONSOLIDATED_CASH_FLOW = "CONSOLIDATED_CASH_FLOW",
  STATEMENT_OF_CHANGES_IN_EQUITY = "STATEMENT_OF_CHANGES_IN_EQUITY",
  PARENT_COMPANY_INCOME_STATEMENT = "PARENT_COMPANY_INCOME_STATEMENT",
  PARENT_COMPANY_BALANCE_SHEET = "PARENT_COMPANY_BALANCE_SHEET",
  PARENT_COMPANY_CASH_FLOW = "PARENT_COMPANY_CASH_FLOW",
  NOTE_DISCLOSURE = "NOTE_DISCLOSURE",
  SEGMENT_TABLE = "SEGMENT_TABLE",
  ESG_TABLE = "ESG_TABLE",
  NARRATIVE = "NARRATIVE",
  UNKNOWN = "UNKNOWN"
}

export enum AuthorityRank {
  PRIMARY_CONSOLIDATED_STATEMENT = 1,  // Highest authority: Row in primary consolidated statement
  PRIMARY_STATEMENT_ALTERNATE = 2,     // Audited primary statement alternate rendering
  PRIMARY_STATEMENT_SYNONYM = 3,       // Equivalent primary statement synonym
  XBRL_AUTHORITATIVE_FACT = 4,         // XBRL-tagged authoritative fact
  SUPPORTING_NOTE_TOTAL = 5,           // Supporting note statement total
  NARRATIVE_CORROBORATION = 6,         // Narrative corroboration
  FOOTNOTE_SUBCOMPONENT = 7,           // Footnote subcomponent / breakdown row
  DERIVED_RECONCILED = 8,              // Derived / reconciled calculation
  UNKNOWN_HEURISTIC = 9                // Lowest: Unknown heuristic candidate
}

export interface StatementContext {
  statementType: StatementType;
  statementTitle?: string;
  authorityRank: AuthorityRank;
  entityName?: string;
  scope: "Consolidated" | "Parent" | "Subsidiary" | "Division" | "Unknown";
  periodStart?: string;
  periodEnd?: string;
  fiscalPeriod?: string;
  reportingCurrency?: string;
  unitScale?: string;
  scaleMultiplier?: number;
  tableBounds?: {
    startLine?: number;
    endLine?: number;
    pageNumber?: number;
  };
  columnHeaders?: string[];
  rowHeaders?: string[];
  sourceDocument?: string;
  physicalPage?: number;
  confidence: number;
}

/**
 * Helper to classify statement type and authority rank from headers and titles
 */
export function classifyStatementContext(
  titleOrHeader: string,
  pageContext: string = "",
  scopeContext: string = "Consolidated"
): StatementContext {
  const text = (titleOrHeader + " " + pageContext).toLowerCase();

  let statementType = StatementType.UNKNOWN;
  let authorityRank = AuthorityRank.UNKNOWN_HEURISTIC;
  let scope: "Consolidated" | "Parent" | "Subsidiary" | "Division" | "Unknown" = "Consolidated";

  // Check for footnote or subcomponent signals first
  const isFootnote = text.includes("note ") || text.includes("notes to") || text.includes("footnote") || text.includes("non-underlying items") || text.includes("segment");
  const isSubcomponent = text.includes("within ") || text.includes("included in") || text.includes("comprising") || text.includes("of which");

  if (scopeContext.toLowerCase().includes("parent") || text.includes("parent company") || text.includes("holding company")) {
    scope = "Parent";
  } else if (scopeContext.toLowerCase().includes("subsidiary")) {
    scope = "Subsidiary";
  }

  // Classify Statement Type
  if (text.includes("income statement") || text.includes("statement of profit") || text.includes("statement of income") || text.includes("profit and loss") || text.includes("p&l")) {
    if (scope === "Parent") {
      statementType = StatementType.PARENT_COMPANY_INCOME_STATEMENT;
      authorityRank = AuthorityRank.PRIMARY_STATEMENT_ALTERNATE;
    } else {
      statementType = StatementType.CONSOLIDATED_INCOME_STATEMENT;
      authorityRank = AuthorityRank.PRIMARY_CONSOLIDATED_STATEMENT;
    }
  } else if (text.includes("balance sheet") || text.includes("statement of financial position")) {
    if (scope === "Parent") {
      statementType = StatementType.PARENT_COMPANY_BALANCE_SHEET;
      authorityRank = AuthorityRank.PRIMARY_STATEMENT_ALTERNATE;
    } else {
      statementType = StatementType.CONSOLIDATED_BALANCE_SHEET;
      authorityRank = AuthorityRank.PRIMARY_CONSOLIDATED_STATEMENT;
    }
  } else if (text.includes("cash flow") || text.includes("statement of cash flows")) {
    if (scope === "Parent") {
      statementType = StatementType.PARENT_COMPANY_CASH_FLOW;
      authorityRank = AuthorityRank.PRIMARY_STATEMENT_ALTERNATE;
    } else {
      statementType = StatementType.CONSOLIDATED_CASH_FLOW;
      authorityRank = AuthorityRank.PRIMARY_CONSOLIDATED_STATEMENT;
    }
  } else if (text.includes("changes in equity") || text.includes("statement of equity")) {
    statementType = StatementType.STATEMENT_OF_CHANGES_IN_EQUITY;
    authorityRank = AuthorityRank.PRIMARY_STATEMENT_ALTERNATE;
  } else if (isFootnote || isSubcomponent) {
    statementType = StatementType.NOTE_DISCLOSURE;
    authorityRank = isSubcomponent ? AuthorityRank.FOOTNOTE_SUBCOMPONENT : AuthorityRank.SUPPORTING_NOTE_TOTAL;
  } else if (text.includes("segment") || text.includes("divisional")) {
    statementType = StatementType.SEGMENT_TABLE;
    authorityRank = AuthorityRank.FOOTNOTE_SUBCOMPONENT;
  }

  // Demote subcomponents regardless of title
  if (isSubcomponent) {
    authorityRank = AuthorityRank.FOOTNOTE_SUBCOMPONENT;
  }

  return {
    statementType,
    statementTitle: titleOrHeader,
    authorityRank,
    scope,
    confidence: 0.95
  };
}
