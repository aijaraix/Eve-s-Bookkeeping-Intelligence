export const DOCUMENT_MAP_SCHEMA = {
  type: "object",
  properties: {
    documentType: { type: "string" },
    documentTitle: { type: "string" },
    documentIssuer: { type: "string" },
    legalEntities: { type: "array", items: { type: "string" } },
    reportingEntities: { type: "array", items: { type: "string" } },
    reportingScopes: { type: "array", items: { type: "string" } },
    fiscalPeriods: { type: "array", items: { type: "string" } },
    currencies: { type: "array", items: { type: "string" } },
    primaryReportingCurrency: { type: "string" },
    functionalCurrencies: { type: "array", items: { type: "string" } },
    accountingFramework: { type: "string" },
    languages: { type: "array", items: { type: "string" } },
    primaryStatements: {
      type: "array",
      items: {
        type: "object",
        properties: {
          statementType: {
            type: "string",
            enum: [
              "CONSOLIDATED_INCOME_STATEMENT",
              "CONSOLIDATED_BALANCE_SHEET",
              "CONSOLIDATED_CASH_FLOW",
              "CONSOLIDATED_EQUITY_STATEMENT",
              "PARENT_COMPANY_INCOME_STATEMENT",
              "PARENT_COMPANY_BALANCE_SHEET",
              "PARENT_COMPANY_CASH_FLOW",
              "PARENT_COMPANY_EQUITY_STATEMENT",
              "OTHER_FINANCIAL_STATEMENT",
              "UNKNOWN"
            ]
          },
          statementTitle: { type: "string" },
          physicalPageCandidates: { type: "array", items: { type: "number" } },
          printedPageCandidates: { type: "array", items: { type: "number" } },
          reportingEntity: { type: "string" },
          scope: { type: "string" },
          period: { type: "string" },
          currency: { type: "string" },
          scale: { type: "string" },
          confidence: { type: "number" }
        },
        required: ["statementType", "statementTitle", "physicalPageCandidates"]
      }
    },
    importantNotes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          noteNumber: { type: "string" },
          title: { type: "string" },
          category: { type: "string" },
          physicalPages: { type: "array", items: { type: "number" } }
        },
        required: ["title", "category", "physicalPages"]
      }
    }
  },
  required: ["documentTitle", "documentIssuer", "primaryReportingCurrency", "primaryStatements"]
};
