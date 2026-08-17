/**
 * PHASE H.4 — CURRENCY PROVENANCE ENGINE
 *
 * Enforces zero unrequested currency conversions and maintains complete currency provenance
 * across the extraction, canonicalization, and display pipeline.
 *
 * Core Directives:
 * 1. No Silent Conversion: If source document reports in EUR, normalized currency MUST remain EUR.
 *    EUR must NEVER silently convert to GBP, USD, or CHF without explicit user request.
 * 2. Immutable Provenance: Every monetary fact stores:
 *    - rawCurrency: Original code detected in text/table
 *    - reportingCurrency: Entity reporting currency
 *    - normalizedCurrency: Storage currency
 *    - displayCurrency: Rendered UI currency
 *    - exchangeRate: FX multiplier (default 1.0)
 *    - rateSource: Provenance of FX rate
 */

export interface CurrencyProvenanceModel {
  rawCurrency: string;
  reportingCurrency: string;
  normalizedCurrency: string;
  displayCurrency: string;
  exchangeRate: number;
  rateSource: 'EXACT_SOURCE' | 'NO_CONVERSION' | 'ECB_REFERENCE' | 'USER_OVERRIDE';
  conversionApplied: boolean;
  notes: string[];
}

export class CurrencyProvenanceEngine {

  /**
   * Initializes immutable currency provenance for an extracted monetary fact.
   */
  public static initializeProvenance(
    rawCurrencyInput?: string,
    workspaceCurrencyInput?: string
  ): CurrencyProvenanceModel {
    const rawCurrency = (rawCurrencyInput || workspaceCurrencyInput || 'EUR').trim().toUpperCase();
    const reportingCurrency = (workspaceCurrencyInput || rawCurrency || 'EUR').trim().toUpperCase();

    // Default rule: NO UNREQUESTED CONVERSION. Raw currency = Normalized currency = Display currency.
    return {
      rawCurrency,
      reportingCurrency,
      normalizedCurrency: rawCurrency,
      displayCurrency: rawCurrency,
      exchangeRate: 1.0,
      rateSource: 'NO_CONVERSION',
      conversionApplied: false,
      notes: [`Preserved source currency ${rawCurrency} without unrequested conversion.`]
    };
  }

  /**
   * Validates that currency alignment is maintained without silent cross-currency corruption.
   */
  public static assertCurrencyIntegrity(
    factCurrency: string,
    targetWorkspaceCurrency: string
  ): { isValid: boolean; warningMessage?: string } {
    const c1 = (factCurrency || '').trim().toUpperCase();
    const c2 = (targetWorkspaceCurrency || '').trim().toUpperCase();

    if (c1 && c2 && c1 !== c2) {
      return {
        isValid: false,
        warningMessage: `Cross-currency mismatch: Fact reported in ${c1} differs from target workspace currency ${c2}. Automatic silent conversion prohibited.`
      };
    }

    return { isValid: true };
  }
}
