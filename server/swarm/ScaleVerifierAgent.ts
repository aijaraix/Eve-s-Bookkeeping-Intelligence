import { ExtractedFact, AgentExecutionLog } from "../../src/types.js";

export interface ScaleVerifierResult {
  facts: ExtractedFact[];
  executionLog: AgentExecutionLog;
  scaleCorrectionsCount: number;
}

/**
  * ScaleVerifierAgent checks all extracted financial facts for unit scale consistency
  * (Units vs Thousands vs Millions vs Billions) and prevents 1,000x or 1,000,000x errors.
  */
export async function runScaleVerifierAgent(
  workspaceId: string,
  facts: ExtractedFact[]
): Promise<ScaleVerifierResult> {
  const startTime = Date.now();
  const findings: string[] = [];
  let scaleCorrectionsCount = 0;

  const verifiedFacts: ExtractedFact[] = facts.map((fact) => {
    const rawValStr = (fact.valueOriginal || "").toLowerCase();
    const sourceText = (fact.sourceText || "").toLowerCase();
    let numericVal = parseFloat(fact.valueFunctional || "0");
    let scaleMultiplier = 1;
    let detectedScale = "Units";

    // Detect scale markers in snippet or raw text
    if (sourceText.includes("billion") || sourceText.includes("€b") || sourceText.includes("$b") || rawValStr.includes("b")) {
      detectedScale = "Billions";
      if (Math.abs(numericVal) < 1000) {
        scaleMultiplier = 1_000_000_000;
      }
    } else if (sourceText.includes("million") || sourceText.includes("€m") || sourceText.includes("$m") || sourceText.includes("in millions") || rawValStr.includes("m")) {
      detectedScale = "Millions";
      if (Math.abs(numericVal) < 10000) {
        scaleMultiplier = 1_000_000;
      }
    } else if (sourceText.includes("thousand") || sourceText.includes("€k") || sourceText.includes("$k") || sourceText.includes("in thousands") || rawValStr.includes("k")) {
      detectedScale = "Thousands";
      if (Math.abs(numericVal) < 100000) {
        scaleMultiplier = 1000;
      }
    }

    if (scaleMultiplier !== 1) {
      const originalFunctional = numericVal;
      numericVal = numericVal * scaleMultiplier;
      scaleCorrectionsCount++;
      findings.push(`Scale Adjusted Fact "${fact.labelOriginal}": ${originalFunctional} -> ${numericVal} (${detectedScale})`);
    }

    return {
      ...fact,
      valueFunctional: String(numericVal),
      verificationNotes: (fact.verificationNotes || "") + ` [Scale Verified: ${detectedScale}]`,
    };
  });

  const executionLog: AgentExecutionLog = {
    agentId: `AGENT-SCALE-${Date.now()}`,
    agentRole: "SCALE_VERIFIER",
    timestamp: new Date().toISOString(),
    modelUsed: "RECONCILIATION_ENGINE",
    status: scaleCorrectionsCount === 0 ? "SUCCESS" : "WARNING",
    inputSummary: `Audited unit scale for ${facts.length} extracted facts`,
    findings,
    discrepanciesFound: scaleCorrectionsCount,
    executionTimeMs: Date.now() - startTime,
  };

  return {
    facts: verifiedFacts,
    executionLog,
    scaleCorrectionsCount,
  };
}
