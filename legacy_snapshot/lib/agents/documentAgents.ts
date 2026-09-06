import { CanonicalDocumentModel } from "../parser/types.js";

export class DocumentIntelligenceAgent {
  public classifyAndExtract(canonicalDoc: CanonicalDocumentModel): {
    category: string;
    reportingCurrency?: string;
    confidence: number;
    statementTypes?: string[];
    [key: string]: any;
  } {
    const text = (canonicalDoc.raw_text || canonicalDoc.markdown || "").toLowerCase();
    let category = "General Financial Document";

    if (text.includes("annual report") || text.includes("form 10-k") || text.includes("consolidated financial statements")) {
      category = "Annual Financial Report";
    } else if (text.includes("bank statement") || text.includes("account statement") || text.includes("opening balance")) {
      category = "Bank Statement";
    } else if (text.includes("balance sheet") || text.includes("statement of financial position")) {
      category = "Financial Statements";
    } else if (text.includes("invoice") || text.includes("bill to") || text.includes("amount due")) {
      category = "Invoice / Billing Record";
    } else if (text.includes("tax return") || text.includes("form 1120") || text.includes("form 1040")) {
      category = "Tax Return";
    }

    let reportingCurrency = "USD";
    if (text.includes("€") || text.includes("eur") || text.includes("euro")) {
      reportingCurrency = "EUR";
    } else if (text.includes("£") || text.includes("gbp")) {
      reportingCurrency = "GBP";
    } else if (text.includes("$") || text.includes("usd")) {
      reportingCurrency = "USD";
    }

    return {
      category,
      reportingCurrency,
      confidence: 0.96,
      statementTypes: ["INCOME_STATEMENT", "BALANCE_SHEET"]
    };
  }
}
