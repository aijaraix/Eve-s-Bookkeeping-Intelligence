import { STATEMENT_FACT_ITEM_SCHEMA } from './incomeStatementSchema.js';

export const NOTE_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    noteTitle: { type: "string" },
    noteCategory: { type: "string" },
    reportingEntity: { type: "string" },
    currency: { type: "string" },
    tableScale: { type: "string" },
    extractedFacts: {
      type: "array",
      items: STATEMENT_FACT_ITEM_SCHEMA
    }
  },
  required: ["noteTitle", "noteCategory", "extractedFacts"]
};
