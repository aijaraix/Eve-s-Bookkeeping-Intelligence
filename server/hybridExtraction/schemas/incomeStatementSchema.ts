export const STATEMENT_FACT_ITEM_SCHEMA = {
  type: "object",
  properties: {
    metricLabel: { type: "string" },
    canonicalMetricCandidate: { type: "string" },
    rawValue: { type: "string" },
    rawText: { type: "string" },
    currency: { type: "string" },
    scale: { type: "string" },
    period: { type: "string" },
    comparativePeriod: { type: "string" },
    reportingEntity: { type: "string" },
    reportingScope: { type: "string" },
    statementType: { type: "string" },
    physicalPage: { type: "number" },
    printedPage: { type: "number" },
    rowLabel: { type: "string" },
    columnLabel: { type: "string" },
    isSubtotal: { type: "boolean" },
    isTotal: { type: "boolean" },
    isDerivedBySource: { type: "boolean" },
    confidence: { type: "number" },
    sourceQuote: { type: "string" }
  },
  required: ["metricLabel", "rawValue", "currency", "period", "physicalPage", "rowLabel", "sourceQuote"]
};

export const PRIMARY_STATEMENT_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    statementType: { type: "string" },
    statementTitle: { type: "string" },
    reportingEntity: { type: "string" },
    scope: { type: "string" },
    reportingPeriod: { type: "string" },
    comparativePeriods: { type: "array", items: { type: "string" } },
    currency: { type: "string" },
    tableScale: { type: "string" },
    lineItems: {
      type: "array",
      items: STATEMENT_FACT_ITEM_SCHEMA
    }
  },
  required: ["statementType", "statementTitle", "currency", "lineItems"]
};
