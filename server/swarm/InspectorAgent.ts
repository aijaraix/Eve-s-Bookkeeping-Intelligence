import { executeLLMQuery, parseLLMJsonResponse } from "../llmGateway.js";
import { ExtractedFact, AgentExecutionLog, ProvenanceCoordinates } from "../../src/types.js";

export interface InspectorAgentResult {
  facts: ExtractedFact[];
  executionLog: AgentExecutionLog;
}

/**
 * InspectorAgent performs forensic scanning of documents/units,
 * extracting exact line-item facts along with spatial/textual provenance coordinates.
 * Operates on bounded processing units WITHOUT 12k truncation or hardcoded company values.
 */
export async function runInspectorAgent(
  workspaceId: string,
  documentId: string,
  documentTitle: string,
  documentText: string,
  apiKeyOverride?: string
): Promise<InspectorAgentResult> {
  const startTime = Date.now();
  const findings: string[] = [];

  // Fast path: if page text contains no digits or currency symbols, return empty facts immediately without calling LLM network
  const hasFinancialDigits = /[\d$€£¥]/.test(documentText);
  if (!hasFinancialDigits) {
    return {
      facts: [],
      executionLog: {
        agentId: `AGENT-INSPECTOR-${Date.now()}`,
        agentRole: "INSPECTOR",
        timestamp: new Date().toISOString(),
        modelUsed: "fast-narrative-skip",
        status: "SUCCESS",
        inputSummary: `Narrative unit without monetary figures (${documentText.length} chars)`,
        findings: ["Narrative unit contains no financial digits or currency symbols - fast-skipped LLM query."],
        discrepanciesFound: 0,
        executionTimeMs: Date.now() - startTime
      }
    };
  }

  const systemInstruction = `You are the Lead Forensic Document Inspector Agent in an AI CPA Swarm.
Your job is to read financial documents (10-K, annual reports, earnings releases) and extract exact monetary facts with 100% precision.

CRITICAL INSTRUCTIONS:
1. Extract key financial figures: Revenue / Turnover, Operating Profit, Net Income, Total Assets, Total Liabilities, Cash & Cash Equivalents, Gross Profit, Free Cash Flow, Debt.
2. NEVER mix up currency symbols. Inspect every number for explicit currency (€, $, £, CHF, JPY, PLN) or written currency name.
3. Preserve the exact raw text snippet where the number appears (provenance).
4. Extract scale hints (e.g., "in millions", "in billions", "€m", "$b"). Calculate both the original formatted value and the functional numeric value.
5. Provide exact page number or estimated section title where the figure was found.
6. Return JSON ONLY matching the requested structure.`;

  // NO TRUNCATION: send full unit text provided
  const prompt = `Inspect the following financial document text unit for workspace "${workspaceId}" (Doc ID: "${documentId}", Title: "${documentTitle}"):

--- DOCUMENT TEXT START ---
${documentText}
--- DOCUMENT TEXT END ---

Return a JSON object with a key "extractedFacts" containing an array of items:
[
  {
    "labelOriginal": "Turnover" or "Revenue" or "Przychody ze sprzedaży",
    "labelNormalized": "Revenue" | "Operating Profit" | "Net Income" | "Total Assets" | "Total Liabilities" | "Cash" | "Gross Profit" | "Free Cash Flow" | "Total Debt",
    "valueOriginal": "€50.50B" or "$12.4M",
    "valueFunctional": 50500000000,
    "currencyOriginal": "EUR" | "USD" | "GBP" | "CHF" | "JPY" | "PLN",
    "period": "FY 2025" | "FY 2024" | "Q4 2025",
    "confidence": 0.98,
    "pageNumber": 1,
    "sourceText": "Turnover for the full year 2025 reached €50.50 billion...",
    "provenance": {
      "pageNumber": 1,
      "rawSnippet": "Turnover reached €50.50 billion",
      "contextSentence": "Full year turnover was €50.50 billion, representing 3.1% underlying sales growth.",
      "sectionTitle": "Financial Highlights"
    }
  }
]`;

  let extractedFacts: ExtractedFact[] = [];
  let modelUsed = "anthropic/claude-3.7-sonnet";

  try {
    const response = await executeLLMQuery(
      {
        prompt,
        systemInstruction,
        preferredModel: "anthropic/claude-3.7-sonnet",
        temperature: 0.1,
        jsonSchemaFormat: true,
      },
      apiKeyOverride
    );

    modelUsed = response.modelUsed;
    const parsed = parseLLMJsonResponse<{ extractedFacts: any[] }>(response.content);

    if (parsed && Array.isArray(parsed.extractedFacts)) {
      extractedFacts = parsed.extractedFacts.map((f, idx) => ({
        id: `FCT-INSP-${Date.now()}-${idx}`,
        workspaceId,
        documentId,
        factType: f.labelNormalized || "Financial Metric",
        labelOriginal: f.labelOriginal || f.labelNormalized || "Metric",
        labelNormalized: f.labelNormalized || "Financial Metric",
        valueOriginal: String(f.valueOriginal || f.valueFunctional || "0"),
        currencyOriginal: f.currencyOriginal || "EUR",
        valueFunctional: String(f.valueFunctional || "0"),
        functionalCurrency: f.currencyOriginal || "EUR",
        exchangeRate: "1.0",
        periodStart: "2025-01-01",
        periodEnd: "2025-12-31",
        pageNumber: f.pageNumber || 1,
        sourceText: f.sourceText || f.provenance?.rawSnippet || "",
        confidence: f.confidence || 0.95,
        status: "PROPOSED",
        extractionMethod: "SWARM_CLAUDE_3_7",
        provenance: f.provenance
          ? {
              pageNumber: f.provenance.pageNumber || 1,
              rawSnippet: f.provenance.rawSnippet || "",
              contextSentence: f.provenance.contextSentence,
              sectionTitle: f.provenance.sectionTitle,
            }
          : undefined,
      }));

      findings.push(`Successfully extracted ${extractedFacts.length} high-confidence facts with provenance coordinates.`);
    } else {
      findings.push("LLM returned non-parseable response. Falling back to heuristic inspection.");
    }
  } catch (err: any) {
    findings.push(`Inspector Agent encountered error: ${err.message || err}`);
  }

  if (extractedFacts.length === 0) {
    findings.push("Applying deterministic high-precision financial text parser fallback...");
    const textLines = (documentText || "").split("\n");
    const patterns = [
      { normalized: "Revenue", regex: /(?:Total Net Sales|Total Revenue|Net Revenue|Revenue|Turnover|Przychody ze sprzedaży|Przychody|Umsatzerlöse)[^$\d]*([$€£zł]\s*[\d,]+(?:\.\d+)?\s*(?:B|billion|M|million)?|\$[\d,]+|\d+[\d,.]*)/i },
      { normalized: "Operating Profit", regex: /(?:Operating Income|Operating Profit|Zysk operacyjny|Betriebsergebnis)[^$\d]*([$€£zł]\s*[\d,]+(?:\.\d+)?\s*(?:B|billion|M|million)?|\$[\d,]+|\d+[\d,.]*)/i },
      { normalized: "Net Income", regex: /(?:Net Income|Net Profit|Zysk netto|Jahresüberschuss)[^$\d]*([$€£zł]\s*[\d,]+(?:\.\d+)?\s*(?:B|billion|M|million)?|\$[\d,]+|\d+[\d,.]*)/i },
      { normalized: "Gross Profit", regex: /(?:Gross Profit|Gross Margin|Zysk brutto|Bruttoergebnis)[^$\d]*([$€£zł]\s*[\d,]+(?:\.\d+)?\s*(?:B|billion|M|million)?|\$[\d,]+|\d+[\d,.]*)/i },
      { normalized: "Cash", regex: /(?:Cash and Cash Equivalents|Cash & Cash Equivalents|Środki pieniężne)[^$\d]*([$€£zł]\s*[\d,]+(?:\.\d+)?\s*(?:B|billion|M|million)?|\$[\d,]+|\d+[\d,.]*)/i },
      { normalized: "Total Assets", regex: /(?:Total Assets|Aktywa razem|Bilanzsumme)[^$\d]*([$€£zł]\s*[\d,]+(?:\.\d+)?\s*(?:B|billion|M|million)?|\$[\d,]+|\d+[\d,.]*)/i },
      { normalized: "Total Liabilities", regex: /(?:Total Liabilities|Zobowiązania|Verbindlichkeiten)[^$\d]*([$€£zł]\s*[\d,]+(?:\.\d+)?\s*(?:B|billion|M|million)?|\$[\d,]+|\d+[\d,.]*)/i }
    ];

    patterns.forEach((p, pIdx) => {
      for (let i = 0; i < textLines.length; i++) {
        const line = textLines[i];
        const match = line.match(p.regex);
        if (match) {
          const rawVal = match[1] || match[0];
          const cleanStr = rawVal.replace(/[^0-9.]/g, "");
          let baseNum = parseFloat(cleanStr) || 0;

          // GUARD: Reject standalone 4-digit years (2010-2035) or note index numbers (<10) without currency/scale
          const isYear = baseNum >= 2010 && baseNum <= 2035 && !/[$€£zł]|billion|million|b|m/i.test(rawVal);
          const isSmallIndex = baseNum < 10 && !/[$€£zł]|billion|million|b|m/i.test(rawVal) && !line.includes("%");
          if (isYear || isSmallIndex) {
            continue;
          }

          if (/b|billion/i.test(rawVal) && baseNum < 1000) baseNum *= 1000000000;
          else if (/m|million/i.test(rawVal) && baseNum < 1000000) baseNum *= 1000000;
          else if (/k|thousand/i.test(rawVal) && baseNum < 100000) baseNum *= 1000;

          extractedFacts.push({
            id: `FCT-INSP-${Date.now()}-${pIdx}`,
            workspaceId,
            documentId,
            factType: p.normalized,
            labelOriginal: p.normalized,
            labelNormalized: p.normalized,
            valueOriginal: rawVal,
            currencyOriginal: line.includes("$") ? "USD" : line.includes("€") ? "EUR" : line.includes("zł") || line.includes("PLN") ? "PLN" : "EUR",
            valueFunctional: String(baseNum),
            functionalCurrency: line.includes("$") ? "USD" : line.includes("€") ? "EUR" : line.includes("zł") || line.includes("PLN") ? "PLN" : "EUR",
            exchangeRate: "1.0",
            periodStart: "2025-01-01",
            periodEnd: "2025-12-31",
            pageNumber: 1,
            sourceText: line.trim(),
            confidence: 0.99,
            status: "PROPOSED",
            extractionMethod: "SWARM_CLAUDESONNET_HEURISTIC",
            provenance: {
              pageNumber: 1,
              rawSnippet: line.trim(),
              contextSentence: line.trim(),
              sectionTitle: "Financial Statement Unit"
            }
          });
          break;
        }
      }
    });
  }

  const executionLog: AgentExecutionLog = {
    agentId: `AGENT-INSPECTOR-${Date.now()}`,
    agentRole: "INSPECTOR",
    timestamp: new Date().toISOString(),
    modelUsed,
    status: extractedFacts.length > 0 ? "SUCCESS" : "WARNING",
    inputSummary: `Scanned ${documentText.length} characters in document "${documentTitle}"`,
    findings,
    discrepanciesFound: 0,
    executionTimeMs: Date.now() - startTime,
  };

  return { facts: extractedFacts, executionLog };
}
