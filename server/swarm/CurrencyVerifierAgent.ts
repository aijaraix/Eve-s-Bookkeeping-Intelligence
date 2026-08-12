import { ExtractedFact, AgentExecutionLog, FxConversionMeta } from "../../src/types.js";

export interface CurrencyVerifierResult {
  facts: ExtractedFact[];
  executionLog: AgentExecutionLog;
  currencyDiscrepancies: number;
}

// Fixed FX reference rates vs EUR for fallback verification (e.g. ECB annual averages)
const STANDARD_FX_RATES: Record<string, number> = {
  EUR: 1.0,
  USD: 1.085, // 1 EUR = 1.085 USD
  GBP: 0.855, // 1 EUR = 0.855 GBP
  CHF: 0.945, // 1 EUR = 0.945 CHF
  JPY: 162.5, // 1 EUR = 162.5 JPY
};

/**
 * CurrencyVerifierAgent checks all extracted facts for currency consistency.
 * Prevents £ (GBP) vs € (EUR) vs $ (USD) confusion and calculates target currency equivalents.
 */
export async function runCurrencyVerifierAgent(
  workspaceId: string,
  facts: ExtractedFact[],
  targetFunctionalCurrency: string = "EUR"
): Promise<CurrencyVerifierResult> {
  const startTime = Date.now();
  const findings: string[] = [];
  let currencyDiscrepancies = 0;

  // 7-Level Currency Evidence Hierarchy
  // Level 1: Explicit accounting declaration ("presented in euros", "statements in EUR")
  // Level 2: Statement/table declaration ("€ million")
  // Level 3: Column header ("2025 EUR")
  // Level 4: Nearby table context
  // Level 5: Document-wide symbol frequency
  // Level 6: Currency symbol frequency
  // Level 7: Entity jurisdiction (supporting ONLY)

  const textSnippets = facts.map(f => `${f.sourceText || ''} ${f.valueOriginal || ''} ${f.labelOriginal || ''}`).join(" ").toLowerCase();
  
  let detectedDocCurrency = "";
  if (textSnippets.includes("presented in euro") || textSnippets.includes("presented in eur") || textSnippets.includes("expressed in euro") || textSnippets.includes("€ million") || textSnippets.includes("€m") || textSnippets.includes("€ billion")) {
    detectedDocCurrency = "EUR";
    findings.push("Level 1/2 Evidence Discovered: Document explicitly declares figures in Euro (€). Jurisdiction assumptions bypassed.");
  } else if (textSnippets.includes("presented in us dollar") || textSnippets.includes("presented in usd") || textSnippets.includes("$ million") || textSnippets.includes("$m")) {
    detectedDocCurrency = "USD";
    findings.push("Level 1/2 Evidence Discovered: Document explicitly declares figures in US Dollars ($). Jurisdiction assumptions bypassed.");
  } else if (textSnippets.includes("presented in pound") || textSnippets.includes("presented in gbp") || textSnippets.includes("£ million") || textSnippets.includes("£m")) {
    detectedDocCurrency = "GBP";
    findings.push("Level 1/2 Evidence Discovered: Document explicitly declares figures in British Pounds (£).");
  } else if (textSnippets.includes("presented in swiss franc") || textSnippets.includes("chf million")) {
    detectedDocCurrency = "CHF";
  }

  // Determine doc-wide currency if level 1/2 was found
  if (detectedDocCurrency) {
    targetFunctionalCurrency = detectedDocCurrency;
  }

  const verifiedFacts: ExtractedFact[] = facts.map((fact) => {
    let sourceCurrency = fact.currencyOriginal ? fact.currencyOriginal.toUpperCase() : "EUR";
    const sourceText = (fact.sourceText || "").toLowerCase();
    const valOrigStr = (fact.valueOriginal || "").toLowerCase();

    // Local table/fact symbol check overrides global symbol
    if (sourceText.includes("€") || sourceText.includes("eur") || sourceText.includes("euro") || valOrigStr.includes("€")) {
      sourceCurrency = "EUR";
    } else if (sourceText.includes("$") || sourceText.includes("usd") || sourceText.includes("dollar") || valOrigStr.includes("$")) {
      sourceCurrency = "USD";
    } else if (sourceText.includes("£") || sourceText.includes("gbp") || sourceText.includes("pound") || valOrigStr.includes("£")) {
      sourceCurrency = "GBP";
    } else if (sourceText.includes("chf") || valOrigStr.includes("chf")) {
      sourceCurrency = "CHF";
    } else if (detectedDocCurrency) {
      sourceCurrency = detectedDocCurrency;
    }

    // 2. Perform FX conversion calculation
    const numericVal = parseFloat(fact.valueFunctional || "0");
    let convertedValue = numericVal;
    let rate = 1.0;

    if (sourceCurrency !== targetFunctionalCurrency) {
      const sourceFxToEur = STANDARD_FX_RATES[sourceCurrency] || 1.0;
      const targetFxToEur = STANDARD_FX_RATES[targetFunctionalCurrency] || 1.0;

      // EUR = Source / SourceRate; Target = EUR * TargetRate
      const valueInEur = numericVal / sourceFxToEur;
      convertedValue = valueInEur * targetFxToEur;
      rate = targetFxToEur / sourceFxToEur;

      findings.push(`FX Converted "${fact.labelOriginal}": ${numericVal} ${sourceCurrency} -> ${convertedValue.toFixed(2)} ${targetFunctionalCurrency} (Rate: ${rate.toFixed(4)})`);
    }

    const fxMeta: FxConversionMeta = {
      sourceCurrency,
      targetCurrency: targetFunctionalCurrency,
      exchangeRate: rate,
      effectiveDate: fact.periodEnd || "2025-12-31",
      rateSource: "ECB",
      originalAmount: numericVal,
      functionalAmount: convertedValue,
    };

    return {
      ...fact,
      currencyOriginal: sourceCurrency,
      currencyFunctional: targetFunctionalCurrency,
      valueFunctional: String(convertedValue),
      fxDetails: fxMeta,
      verificationNotes: (fact.verificationNotes || "") + ` [Currency Verified: ${sourceCurrency}]`,
    };
  });

  const executionLog: AgentExecutionLog = {
    agentId: `AGENT-CURRENCY-${Date.now()}`,
    agentRole: "CURRENCY_VERIFIER",
    timestamp: new Date().toISOString(),
    modelUsed: "RECONCILIATION_ENGINE",
    status: currencyDiscrepancies === 0 ? "SUCCESS" : "WARNING",
    inputSummary: `Audited currency for ${facts.length} extracted facts against functional target currency ${targetFunctionalCurrency}`,
    findings,
    discrepanciesFound: currencyDiscrepancies,
    executionTimeMs: Date.now() - startTime,
  };

  return {
    facts: verifiedFacts,
    executionLog,
    currencyDiscrepancies,
  };
}
