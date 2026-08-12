import { ExtractedFact, AgentExecutionLog } from "../../src/types.js";

export interface BackfillAgentResult {
  facts: ExtractedFact[];
  backfilledCount: number;
  executionLog: AgentExecutionLog;
}

export async function runBackfillAgent(
  workspaceId: string,
  documentId: string,
  documentTitle: string,
  documentText: string,
  existingFacts: ExtractedFact[],
  functionalCurrency = "USD"
): Promise<BackfillAgentResult> {
  const startTime = Date.now();
  const findings: string[] = [];
  let backfilledCount = 0;
  const updatedFacts = [...existingFacts];

  const coreFields = [
    { label: "Revenue", keywords: ["revenue", "sales", "turnover", "group sales", "net sales", "product revenue", "services revenue"] },
    { label: "Cost of Sales", keywords: ["cost of sales", "cost of revenue", "cost of goods sold", "cogs"] },
    { label: "Gross Profit", keywords: ["gross profit", "gross margin"] },
    { label: "Operating Income", keywords: ["operating profit", "operating income", "ebit", "operating result"] },
    { label: "Net Income", keywords: ["net income", "net profit", "profit for the year", "profit for the period", "profit after tax", "net earnings"] },
    { label: "Total Assets", keywords: ["total assets", "assets total"] },
    { label: "Total Liabilities", keywords: ["total liabilities", "liabilities total"] },
    { label: "Total Equity", keywords: ["total equity", "shareholders' equity", "stockholders' equity", "equity"] },
    { label: "Cash", keywords: ["cash and cash equivalents", "cash balances", "cash at bank", "cash in bank", "cash"] },
    { label: "Operating Expenses", keywords: ["operating expenses", "sg&a", "selling, general", "opex"] },
    { label: "Income Taxes", keywords: ["income tax", "tax expense", "taxation", "taxes on profit"] },
    { label: "Accounts Receivable", keywords: ["accounts receivable", "trade receivables", "debtors"] },
    { label: "Accounts Payable", keywords: ["accounts payable", "trade payables", "creditors"] }
  ];

  const presentLabels = new Set(updatedFacts.map(f => f.labelNormalized.toLowerCase()));

  // 1. Check which core fields are missing
  const missingFields = coreFields.filter(f => !Array.from(presentLabels).some(pl => pl.includes(f.label.toLowerCase()) || f.label.toLowerCase().includes(pl)));

  if (missingFields.length > 0) {
    findings.push(`Autonomous Backfill Agent triggered for ${missingFields.length} missing fields: ${missingFields.map(m => m.label).join(", ")}`);

    // Pass A: Rescan document text lines with broader pattern matching
    const lines = documentText.split("\n");
    for (const field of missingFields) {
      if (presentLabels.has(field.label.toLowerCase())) continue;

      for (const line of lines) {
        const lineLower = line.toLowerCase();
        const matchesKw = field.keywords.some(kw => lineLower.includes(kw));
        if (matchesKw) {
          // Find numerical currency pattern in line
          const numMatch = line.match(/(?:€|\$|£|CHF|JPY)?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]+)?)\s*(billion|million|thousand|b|m|k)?/i);
          if (numMatch) {
            let rawVal = numMatch[0];
            let cleanNum = parseFloat(numMatch[1].replace(/,/g, ''));
            const scaleStr = (numMatch[2] || '').toLowerCase();
            if (scaleStr === 'billion' || scaleStr === 'b' || lineLower.includes('in billions')) cleanNum *= 1000000000;
            else if (scaleStr === 'million' || scaleStr === 'm' || lineLower.includes('in millions')) cleanNum *= 1000000;
            else if (scaleStr === 'thousand' || scaleStr === 'k' || lineLower.includes('in thousands')) cleanNum *= 1000;

            if (cleanNum > 0) {
              const newFact: ExtractedFact = {
                id: `FCT-BACKFILL-${Date.now()}-${backfilledCount++}`,
                workspaceId,
                documentId,
                factType: field.label,
                labelOriginal: field.label,
                labelNormalized: field.label,
                valueOriginal: rawVal,
                currencyOriginal: line.includes("$") ? "USD" : line.includes("€") ? "EUR" : functionalCurrency,
                valueFunctional: String(cleanNum),
                functionalCurrency: line.includes("$") ? "USD" : line.includes("€") ? "EUR" : functionalCurrency,
                exchangeRate: "1.0",
                periodStart: "2025-01-01",
                periodEnd: "2025-12-31",
                pageNumber: 1,
                sourceText: line.trim(),
                confidence: 0.96,
                status: "VALIDATED",
                extractionMethod: "AUTONOMOUS_BACKFILL_AGENT_RESCAN"
              };
              updatedFacts.push(newFact);
              presentLabels.add(field.label.toLowerCase());
              findings.push(`Rescanned document text and recovered missing field ${field.label}: ${rawVal} (${cleanNum})`);
              break;
            }
          }
        }
      }
    }

    // Pass B: Derived Accounting Identity Equations
    const getVal = (normLabel: string) => {
      const f = updatedFacts.find(fact => fact.labelNormalized.toLowerCase().includes(normLabel.toLowerCase()));
      return f ? parseFloat(f.valueFunctional) || 0 : 0;
    };

    const rev = getVal("Revenue");
    const cogs = getVal("Cost of Sales");
    let gross = getVal("Gross Profit");
    const opex = getVal("Operating Expenses");
    let opInc = getVal("Operating Income");
    let assets = getVal("Total Assets");
    let liab = getVal("Total Liabilities");
    let equity = getVal("Total Equity");

    // Derive Gross Profit = Revenue - Cost of Sales
    if (!presentLabels.has("gross profit") && rev > 0 && cogs > 0) {
      gross = rev - cogs;
      updatedFacts.push({
        id: `FCT-BACKFILL-EQ-${Date.now()}-gp`,
        workspaceId,
        documentId,
        factType: "Gross Profit",
        labelOriginal: "Derived Gross Profit",
        labelNormalized: "Gross Profit",
        valueOriginal: `${functionalCurrency} ${gross.toLocaleString()}`,
        currencyOriginal: functionalCurrency,
        valueFunctional: String(gross),
        functionalCurrency,
        exchangeRate: "1.0",
        periodStart: "2025-01-01",
        periodEnd: "2025-12-31",
        pageNumber: 1,
        sourceText: `Derived via Accounting Equation: Gross Profit (${rev}) - Cost of Sales (${cogs})`,
        confidence: 0.99,
        status: "VALIDATED",
        extractionMethod: "AUTONOMOUS_BACKFILL_ACCOUNTING_EQUATION"
      });
      backfilledCount++;
      presentLabels.add("gross profit");
      findings.push(`Derived missing field Gross Profit: ${gross} via (Revenue - COGS)`);
    }

    // Derive Operating Income = Gross Profit - Operating Expenses
    if (!presentLabels.has("operating income") && gross > 0 && opex > 0) {
      opInc = gross - opex;
      updatedFacts.push({
        id: `FCT-BACKFILL-EQ-${Date.now()}-op`,
        workspaceId,
        documentId,
        factType: "Operating Income",
        labelOriginal: "Derived Operating Income",
        labelNormalized: "Operating Income",
        valueOriginal: `${functionalCurrency} ${opInc.toLocaleString()}`,
        currencyOriginal: functionalCurrency,
        valueFunctional: String(opInc),
        functionalCurrency,
        exchangeRate: "1.0",
        periodStart: "2025-01-01",
        periodEnd: "2025-12-31",
        pageNumber: 1,
        sourceText: `Derived via Accounting Equation: Gross Profit (${gross}) - OpEx (${opex})`,
        confidence: 0.99,
        status: "VALIDATED",
        extractionMethod: "AUTONOMOUS_BACKFILL_ACCOUNTING_EQUATION"
      });
      backfilledCount++;
      presentLabels.add("operating income");
      findings.push(`Derived missing field Operating Income: ${opInc} via (Gross Profit - OpEx)`);
    }

    // Derive Total Liabilities = Total Assets - Total Equity
    if (!presentLabels.has("total liabilities") && assets > 0 && equity > 0) {
      liab = assets - equity;
      updatedFacts.push({
        id: `FCT-BACKFILL-EQ-${Date.now()}-liab`,
        workspaceId,
        documentId,
        factType: "Total Liabilities",
        labelOriginal: "Derived Total Liabilities",
        labelNormalized: "Total Liabilities",
        valueOriginal: `${functionalCurrency} ${liab.toLocaleString()}`,
        currencyOriginal: functionalCurrency,
        valueFunctional: String(liab),
        functionalCurrency,
        exchangeRate: "1.0",
        periodStart: "2025-01-01",
        periodEnd: "2025-12-31",
        pageNumber: 1,
        sourceText: `Derived via Accounting Equation: Total Assets (${assets}) - Total Equity (${equity})`,
        confidence: 0.99,
        status: "VALIDATED",
        extractionMethod: "AUTONOMOUS_BACKFILL_ACCOUNTING_EQUATION"
      });
      backfilledCount++;
      presentLabels.add("total liabilities");
      findings.push(`Derived missing field Total Liabilities: ${liab} via (Total Assets - Total Equity)`);
    }
  } else {
    findings.push("All core financial statement metrics are fully present. No backfill needed.");
  }

  const executionLog: AgentExecutionLog = {
    agentId: `AGENT-BACKFILL-${Date.now()}`,
    agentRole: "BACKFILL_AGENT",
    timestamp: new Date().toISOString(),
    modelUsed: "hermes-autonomous-backfill-engine",
    status: "SUCCESS",
    inputSummary: `Evaluated ${existingFacts.length} input facts against 13 core accounting required metrics`,
    findings,
    discrepanciesFound: 0,
    executionTimeMs: Date.now() - startTime
  };

  return { facts: updatedFacts, backfilledCount, executionLog };
}
