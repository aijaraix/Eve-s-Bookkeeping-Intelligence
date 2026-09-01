import { describe, it, expect } from "vitest";
import { LocaleAwareNumberParser } from "../forensicExtractionEngine.js";
import { CanonicalFactResolver } from "../canonicalFactResolver.js";
import { ExtractedFact } from "../../src/types.js";

describe("Phase H.6 — Universal Financial Semantics & Adversarial Regression Suite", () => {
  describe("1. Scale Resolution & Table Unit Scaling", () => {
    it("correctly parses 70,471 in € millions as 70,471,000,000 (70.471B)", () => {
      const res = LocaleAwareNumberParser.parseLocaleAwareValue("70,471", "en", "Table Header: € million", 1_000_000);
      expect(res.normalizedValue).toBe(70_471_000_000);
      expect(res.scaleMultiplier).toBe(1_000_000);
    });

    it("correctly parses 52,884 in € millions as 52,884,000,000 (52.884B)", () => {
      const res = LocaleAwareNumberParser.parseLocaleAwareValue("52,884", "en", "Table Header: € million", 1_000_000);
      expect(res.normalizedValue).toBe(52_884_000_000);
    });

    it("correctly parses 17,587 in € millions as 17,587,000,000 (17.587B)", () => {
      const res = LocaleAwareNumberParser.parseLocaleAwareValue("17,587", "en", "Table Header: € million", 1_000_000);
      expect(res.normalizedValue).toBe(17_587_000_000);
    });

    it("correctly parses raw string '5.9bn' as 5,900,000,000 (5.9B)", () => {
      const res = LocaleAwareNumberParser.parseLocaleAwareValue("5.9bn", "en", "", 1);
      expect(res.normalizedValue).toBe(5_900_000_000);
      expect(res.scaleMultiplier).toBe(1_000_000_000);
    });

    it("correctly parses parenthetical negative numbers (26,794) in € millions as -26,794,000,000", () => {
      const res = LocaleAwareNumberParser.parseLocaleAwareValue("(26,794)", "en", "€ million", 1_000_000);
      expect(res.normalizedValue).toBe(-26_794_000_000);
    });

    it("never caps or clamps large values > 100M", () => {
      const res = LocaleAwareNumberParser.parseLocaleAwareValue("50.5 billion", "en", "", 1);
      expect(res.normalizedValue).toBe(50_500_000_000);
      expect(res.normalizedValue).not.toBe(100_000_000);
    });
  });

  describe("2. Alphanumeric Note Reference & Non-Monetary Rejection", () => {
    it("rejects alphanumeric note index '17A' as a monetary value", () => {
      const res = LocaleAwareNumberParser.parseLocaleAwareValue("17A", "en", "Cash and cash equivalents 17A", 1_000_000);
      expect(res.normalizedValue).toBeNull();
    });

    it("rejects 'Note 3' as a monetary value", () => {
      const res = LocaleAwareNumberParser.parseLocaleAwareValue("Note 3", "en", "", 1);
      expect(res.normalizedValue).toBeNull();
    });

    it("rejects year strings 'FY2025' or '2025' without monetary context", () => {
      const res = LocaleAwareNumberParser.parseLocaleAwareValue("FY2025", "en", "", 1);
      expect(res.normalizedValue).toBeNull();
    });
  });

  describe("3. Primary Statement Authority vs Footnote Subcomponents", () => {
    it("ensures footnote subcomponent ('within operating profit') loses to primary operating profit", () => {
      const primaryFact: ExtractedFact = {
        id: "FCT-PRIMARY-1",
        workspaceId: "ws-test",
        documentId: "doc-1",
        factType: "MONETARY",
        pageNumber: 1,
        sourceText: "Operating profit: 9,047",
        valueOriginal: "9,047",
        valueFunctional: "9047000000",
        labelOriginal: "Operating Profit",
        labelNormalized: "Operating Profit",
        canonicalMetric: "operating_profit",
        currencyOriginal: "EUR",
        functionalCurrency: "EUR",
        periodStart: "2025-01-01",
        periodEnd: "2025-12-31",
        statementType: "income_statement",
        entityScope: "Consolidated",
        status: "verified",
        confidence: 0.98,
        extractionMethod: "Table Parser"
      };

      const footnoteFact: ExtractedFact = {
        id: "FCT-FOOTNOTE-1",
        workspaceId: "ws-test",
        documentId: "doc-1",
        factType: "MONETARY",
        pageNumber: 10,
        labelOriginal: "Non-underlying items within operating profit before tax",
        labelNormalized: "Non-underlying items within operating profit before tax",
        canonicalMetric: "operating_profit",
        valueOriginal: "(1,047)",
        valueFunctional: "-1047000000",
        currencyOriginal: "EUR",
        functionalCurrency: "EUR",
        periodStart: "2025-01-01",
        periodEnd: "2025-12-31",
        statementType: "notes",
        sourceText: "Non-underlying items within operating profit before tax: (1,047)",
        entityScope: "Consolidated",
        status: "verified",
        confidence: 0.95,
        extractionMethod: "Note Parser"
      };

      const scorePrimary = CanonicalFactResolver.calculateFactPriorityScore(primaryFact, "operating_profit", "2025-FY");
      const scoreFootnote = CanonicalFactResolver.calculateFactPriorityScore(footnoteFact, "operating_profit", "2025-FY");

      expect(scorePrimary).toBeGreaterThan(scoreFootnote);

      const resolved = CanonicalFactResolver.resolveMetric([primaryFact, footnoteFact], "operating_profit", "2025-FY");
      expect(resolved.primaryFact?.id).toBe("FCT-PRIMARY-1");
      expect(resolved.normalizedScalarValue).toBe(9_047_000_000);
    });
  });

  describe("4. Accounting Identity Validation Gates", () => {
    it("validates Assets = Liabilities + Equity when facts balance", () => {
      const assetsFact: ExtractedFact = {
        id: "F1",
        workspaceId: "ws-test",
        documentId: "doc-1",
        factType: "MONETARY",
        pageNumber: 1,
        sourceText: "Total assets: 70,471",
        labelOriginal: "Total Assets",
        labelNormalized: "Total Assets",
        canonicalMetric: "total_assets",
        valueOriginal: "70,471",
        valueFunctional: "70471000000",
        currencyOriginal: "EUR",
        functionalCurrency: "EUR",
        periodStart: "2025-01-01",
        status: "verified",
        confidence: 0.95,
        extractionMethod: "Table Parser"
      };
      const liabFact: ExtractedFact = {
        id: "F2",
        workspaceId: "ws-test",
        documentId: "doc-1",
        factType: "MONETARY",
        pageNumber: 1,
        sourceText: "Total liabilities: 52,884",
        labelOriginal: "Total Liabilities",
        labelNormalized: "Total Liabilities",
        canonicalMetric: "total_liabilities",
        valueOriginal: "52,884",
        valueFunctional: "52884000000",
        currencyOriginal: "EUR",
        functionalCurrency: "EUR",
        periodStart: "2025-01-01",
        status: "verified",
        confidence: 0.95,
        extractionMethod: "Table Parser"
      };
      const eqFact: ExtractedFact = {
        id: "F3",
        workspaceId: "ws-test",
        documentId: "doc-1",
        factType: "MONETARY",
        pageNumber: 1,
        sourceText: "Total equity: 17,587",
        labelOriginal: "Total Equity",
        labelNormalized: "Total Equity",
        canonicalMetric: "total_equity",
        valueOriginal: "17,587",
        valueFunctional: "17587000000",
        currencyOriginal: "EUR",
        functionalCurrency: "EUR",
        periodStart: "2025-01-01",
        status: "verified",
        confidence: 0.95,
        extractionMethod: "Table Parser"
      };

      const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test", [assetsFact, liabFact, eqFact]);
      expect(summary.accountingIdentityValid).toBe(true);
      expect(summary.totalAssets.normalizedScalarValue).toBe(70_471_000_000);
      expect(summary.totalLiabilities.normalizedScalarValue).toBe(52_884_000_000);
      expect(summary.totalEquity.normalizedScalarValue).toBe(17_587_000_000);
    });

    it("flags accounting identity mismatch when Assets != Liabilities + Equity", () => {
      const assetsFact: ExtractedFact = {
        id: "F1",
        workspaceId: "ws-test",
        documentId: "doc-1",
        factType: "MONETARY",
        pageNumber: 1,
        sourceText: "Total assets: 100",
        labelOriginal: "Total Assets",
        labelNormalized: "Total Assets",
        canonicalMetric: "total_assets",
        valueOriginal: "100",
        valueFunctional: "100000000", // Bad 100M value
        currencyOriginal: "EUR",
        functionalCurrency: "EUR",
        periodStart: "2025-01-01",
        status: "verified",
        confidence: 0.95,
        extractionMethod: "Table Parser"
      };
      const liabFact: ExtractedFact = {
        id: "F2",
        workspaceId: "ws-test",
        documentId: "doc-1",
        factType: "MONETARY",
        pageNumber: 1,
        sourceText: "Total liabilities: 52,884",
        labelOriginal: "Total Liabilities",
        labelNormalized: "Total Liabilities",
        canonicalMetric: "total_liabilities",
        valueOriginal: "52,884",
        valueFunctional: "52884000000",
        currencyOriginal: "EUR",
        functionalCurrency: "EUR",
        periodStart: "2025-01-01",
        status: "verified",
        confidence: 0.95,
        extractionMethod: "Table Parser"
      };
      const eqFact: ExtractedFact = {
        id: "F3",
        workspaceId: "ws-test",
        documentId: "doc-1",
        factType: "MONETARY",
        pageNumber: 1,
        sourceText: "Total equity: 17,587",
        labelOriginal: "Total Equity",
        labelNormalized: "Total Equity",
        canonicalMetric: "total_equity",
        valueOriginal: "17,587",
        valueFunctional: "17587000000",
        currencyOriginal: "EUR",
        functionalCurrency: "EUR",
        periodStart: "2025-01-01",
        status: "verified",
        confidence: 0.95,
        extractionMethod: "Table Parser"
      };

      const summary = CanonicalFactResolver.resolveWorkspaceSummary("ws-test", [assetsFact, liabFact, eqFact]);
      expect(summary.accountingIdentityValid).toBe(false);
      expect(summary.validationMessages.some(m => m.includes("Accounting Identity Mismatch"))).toBe(true);
    });
  });

  describe("5. Universality Across Arbitrary Corporate Entities", () => {
    it("works identically for Globex Corporation and Acme Financials", () => {
      const globexFact: ExtractedFact = {
        id: "GX-1",
        workspaceId: "ws-globex",
        documentId: "doc-gx",
        factType: "MONETARY",
        pageNumber: 1,
        sourceText: "Revenue: 125.4bn",
        labelOriginal: "Revenue",
        labelNormalized: "Revenue",
        reportingEntity: "Globex Corporation",
        canonicalMetric: "revenue",
        valueOriginal: "125.4bn",
        valueFunctional: "125400000000",
        currencyOriginal: "USD",
        functionalCurrency: "USD",
        periodStart: "2025-01-01",
        statementType: "income_statement",
        status: "verified",
        confidence: 0.98,
        extractionMethod: "Table Parser"
      };

      const resolved = CanonicalFactResolver.resolveMetric([globexFact], "revenue", "2025-FY");
      expect(resolved.entityName).toBe("Globex Corporation");
      expect(resolved.formattedValue).toBe("$125.40B");
      expect(resolved.normalizedScalarValue).toBe(125_400_000_000);
    });
  });
});
