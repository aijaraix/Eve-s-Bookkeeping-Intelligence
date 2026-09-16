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
    } else if (text.includes("invoice") || text.includes("bill to") || text.includes("amount due") || text.includes("total due")) {
      category = "Invoice / Billing Record";
    } else if (text.includes("tax return") || text.includes("form 1120") || text.includes("form 1040")) {
      category = "Tax Return";
    }

    let reportingCurrency: string | undefined;
    if (/\bcurrency\s+eur\b|\beur\b|€/.test(text)) reportingCurrency = "EUR";
    else if (/\bcurrency\s+gbp\b|\bgbp\b|£/.test(text)) reportingCurrency = "GBP";
    else if (/\bcurrency\s+usd\b|\busd\b/.test(text)) reportingCurrency = "USD";

    if (category === "Invoice / Billing Record") {
      const signals = [
        /\binvoice\b/.test(text), /\bbill to\b/.test(text), /\b(?:amount|total) due\b/.test(text),
        /\bdue date\b/.test(text), /\bpurchase order\b/.test(text), /\bcurrency\s+[a-z]{3}\b/.test(text)
      ].filter(Boolean).length;
      return {
        category,
        reportingCurrency,
        confidence: Math.min(0.99, 0.70 + (signals * 0.045)),
        statementTypes: [],
        documentKind: 'INVOICE',
        classificationSignals: signals,
      };
    }

    return {
      category,
      reportingCurrency,
      confidence: category === "General Financial Document" ? 0.50 : 0.90,
      statementTypes: category === "Annual Financial Report" || category === "Financial Statements" ? ["INCOME_STATEMENT", "BALANCE_SHEET"] : []
    };
  }
}
