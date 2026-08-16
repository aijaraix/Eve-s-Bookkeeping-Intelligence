/**
 * Coverage Audit Engine & Diagnostic Metrics Calculator
 * Evaluates accounting coverage across document pages & tables without artificially inflating numbers.
 */

export interface ZeroFactPageAuditItem {
  documentName: string;
  pageNumber: number;
  tableTitle?: string;
  category: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  categoryDescription: string;
  dataSummary?: string;
  whyMissedReason?: string;
  recommendedExtractor?: string;
}

export interface ExtractionDiagnosticsReport {
  financialPagesDetected: number;
  financialTablesDetected: number;
  tablesSuccessfullyParsed: number;
  tablesPartiallyParsed: number;
  tablesSkippedIntentionally: number;
  tablesFailed: number;
  primaryFactsExtracted: number;
  duplicateFactsSuppressed: number;
  conflictingFacts: number;
  factsRequiringReview: number;
  factsWithCompleteLineage: number;
  tableExtractionCoverage: number; // percentage e.g. 91.2%
  factLineageCoverage: number; // percentage e.g. 100%
  zeroFactPagesBreakdown: Record<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G', number>;
  representativeExamples: ZeroFactPageAuditItem[];
}

export class CoverageAuditEngine {
  /**
   * Audits pages classified as FINANCIAL_STATEMENT or FINANCIAL_TABLE that yielded zero extracted primary facts.
   */
  public static auditZeroFactPages(
    pages: Array<{ pageNumber: number; documentName: string; classification: string; text: string; tablesCount: number; factCount: number }>
  ): { breakdown: Record<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G', number>; examples: ZeroFactPageAuditItem[] } {
    const breakdown: Record<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G', number> = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0,
      G: 0
    };

    const examples: ZeroFactPageAuditItem[] = [];

    const zeroFactPages = pages.filter(
      p => (p.classification === 'FINANCIAL_STATEMENT' || p.classification === 'FINANCIAL_TABLE') && p.factCount === 0
    );

    for (const p of zeroFactPages) {
      const textLower = (p.text || '').toLowerCase();

      // Category B: Comparative/repeated tables (e.g. prior year comparative or duplicate table in appendix)
      if (textLower.includes('vorjahr') || textLower.includes('prior year') || textLower.includes('comparative') || textLower.includes('multi-year summary')) {
        breakdown.B++;
      }
      // Category A: Intentionally ignored non-primary schedule (e.g. executive remuneration, corporate governance, ESG metrics, header tables)
      else if (
        textLower.includes('remuneration') ||
        textLower.includes('vergütung') ||
        textLower.includes('governance') ||
        textLower.includes('esg') ||
        textLower.includes('sustainability') ||
        textLower.includes('glossary') ||
        textLower.includes('shareholder structure')
      ) {
        breakdown.A++;
      }
      // Category C: Narrative/formatting text with border or layout lines misclassified as table
      else if (p.tablesCount === 1 && p.text.length > 1000 && !textLower.includes('eur') && !textLower.includes('€')) {
        breakdown.C++;
      }
      // Category F: Multi-column complex note schedule requiring specialized multi-tiered note parser
      else if (textLower.includes('note') || textLower.includes('anhang') || textLower.includes('breakdown of')) {
        breakdown.F++;
        if (examples.length < 5) {
          examples.push({
            documentName: p.documentName,
            pageNumber: p.pageNumber,
            tableTitle: 'Note Disclosure Table / Subsidiary Breakdown Schedule',
            category: 'F',
            categoryDescription: 'Requires specialized multi-tiered note schedule parser',
            dataSummary: p.text.slice(0, 150) + '...',
            whyMissedReason: 'Multi-column nested note structure ignored by primary balance sheet / income statement matcher',
            recommendedExtractor: 'Specialized Disclosures & Note Sub-ledger Extractor'
          });
        }
      }
      // Category D: Secondary financial metric present in table row but not mapped to core canonical KPI
      else if (textLower.includes('million') || textLower.includes('mio') || textLower.includes('thousand')) {
        breakdown.D++;
        if (examples.length < 5) {
          examples.push({
            documentName: p.documentName,
            pageNumber: p.pageNumber,
            tableTitle: 'Secondary Financial Schedule Table',
            category: 'D',
            categoryDescription: 'Contains valid secondary line items not mapped to core GAAP/IFRS KPIs',
            dataSummary: p.text.slice(0, 150) + '...',
            whyMissedReason: 'Row labels represent secondary granular sub-accounts rather than primary balance sheet / P&L totals',
            recommendedExtractor: 'Granular Sub-ledger Line Item Mapper'
          });
        }
      }
      // Category E: Complex multi-line cell formatting parser challenge
      else {
        breakdown.E++;
      }
    }

    return { breakdown, examples };
  }

  /**
   * Calculates comprehensive diagnostic metrics including Table Extraction Coverage and Fact Lineage Coverage.
   */
  public static calculateDiagnostics(input: {
    financialPagesDetected: number;
    financialTablesDetected: number;
    tablesSuccessfullyParsed: number;
    tablesPartiallyParsed: number;
    tablesSkippedIntentionally: number;
    tablesFailed: number;
    primaryFactsExtracted: number;
    duplicateFactsSuppressed: number;
    conflictingFacts: number;
    factsRequiringReview: number;
    factsWithCompleteLineage: number;
    pages: Array<any>;
  }): ExtractionDiagnosticsReport {
    const tableExtractionCoverage =
      input.financialTablesDetected > 0
        ? ((input.tablesSuccessfullyParsed + input.tablesPartiallyParsed + input.tablesSkippedIntentionally) /
            input.financialTablesDetected) *
          100
        : 100;

    const factLineageCoverage =
      input.primaryFactsExtracted > 0
        ? (input.factsWithCompleteLineage / input.primaryFactsExtracted) * 100
        : 100;

    const { breakdown, examples } = this.auditZeroFactPages(input.pages);

    return {
      financialPagesDetected: input.financialPagesDetected,
      financialTablesDetected: input.financialTablesDetected,
      tablesSuccessfullyParsed: input.tablesSuccessfullyParsed,
      tablesPartiallyParsed: input.tablesPartiallyParsed,
      tablesSkippedIntentionally: input.tablesSkippedIntentionally,
      tablesFailed: input.tablesFailed,
      primaryFactsExtracted: input.primaryFactsExtracted,
      duplicateFactsSuppressed: input.duplicateFactsSuppressed,
      conflictingFacts: input.conflictingFacts,
      factsRequiringReview: input.factsRequiringReview,
      factsWithCompleteLineage: input.factsWithCompleteLineage,
      tableExtractionCoverage: Math.min(100, Math.round(tableExtractionCoverage * 10) / 10),
      factLineageCoverage: Math.round(factLineageCoverage * 10) / 10,
      zeroFactPagesBreakdown: breakdown,
      representativeExamples: examples
    };
  }
}
