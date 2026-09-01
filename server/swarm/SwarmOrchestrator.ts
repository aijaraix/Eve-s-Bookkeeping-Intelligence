import { runInspectorAgent } from "./InspectorAgent.js";
import { runCurrencyVerifierAgent } from "./CurrencyVerifierAgent.js";
import { runScaleVerifierAgent } from "./ScaleVerifierAgent.js";
import { runDiscrepancyAuditorAgent } from "./DiscrepancyAuditorAgent.js";
import { runArithmeticReconcilerAgent } from "./ArithmeticReconcilerAgent.js";
import { runBackfillAgent } from "./BackfillAgent.js";
import { ExtractedFact, AgentExecutionLog, AuditTrailRecord, DiscrepancyItem } from "../../src/types.js";

export interface SwarmPipelineOutput {
  facts: ExtractedFact[];
  discrepancies: DiscrepancyItem[];
  agentLogs: AgentExecutionLog[];
  auditLogs: AuditTrailRecord[];
  totalExecutionTimeMs: number;
}

/**
 * SwarmOrchestrator coordinates the 4 specialized CPA agents into a multi-agent pipeline:
 * 1. InspectorAgent (Claude 3.7 Sonnet extraction & provenance)
 * 2. CurrencyVerifierAgent (ISO currency verification & FX conversion)
 * 3. DiscrepancyAuditorAgent (Anomaly & hallucination rejection)
 * 4. ArithmeticReconcilerAgent (Accounting equation & statement checks)
 */
export async function executeSwarmPipeline(
  workspaceId: string,
  documentId: string,
  documentTitle: string,
  documentText: string,
  functionalCurrency: string = "EUR",
  apiKeyOverride?: string
): Promise<SwarmPipelineOutput> {
  const pipelineStartTime = Date.now();
  const agentLogs: AgentExecutionLog[] = [];
  const auditLogs: AuditTrailRecord[] = [];
  let discrepancies: DiscrepancyItem[] = [];

  // Audit Trail Entry: Ingestion
  auditLogs.push({
    id: `AUDIT-INGEST-${Date.now()}`,
    workspaceId,
    documentId,
    timestamp: new Date().toISOString(),
    action: "DOCUMENT_INGEST",
    actor: "SwarmOrchestrator",
    details: `Initiated forensic multi-agent audit pipeline on document "${documentTitle}" (${documentText.length} chars)`,
  });

  // Stage 1: Inspector Agent
  console.log(`[SwarmOrchestrator] Running InspectorAgent with Claude 3.7 Sonnet...`);
  const inspectorRes = await runInspectorAgent(
    workspaceId,
    documentId,
    documentTitle,
    documentText,
    apiKeyOverride
  );
  agentLogs.push(inspectorRes.executionLog);

  auditLogs.push({
    id: `AUDIT-INSPECT-${Date.now()}`,
    workspaceId,
    documentId,
    timestamp: new Date().toISOString(),
    action: "SWARM_EXTRACT",
    actor: "InspectorAgent",
    modelUsed: inspectorRes.executionLog.modelUsed,
    details: `Extracted ${inspectorRes.facts.length} initial line items with spatial provenance coordinates.`,
  });

  // Stage 2: Currency Verifier Agent
  console.log(`[SwarmOrchestrator] Running CurrencyVerifierAgent...`);
  const currencyRes = await runCurrencyVerifierAgent(
    workspaceId,
    inspectorRes.facts,
    functionalCurrency
  );
  agentLogs.push(currencyRes.executionLog);

  auditLogs.push({
    id: `AUDIT-CURRENCY-${Date.now()}`,
    workspaceId,
    documentId,
    timestamp: new Date().toISOString(),
    action: "CURRENCY_NORMALIZE",
    actor: "CurrencyVerifierAgent",
    details: `Audited currencies across ${currencyRes.facts.length} facts. Corrected ${currencyRes.currencyDiscrepancies} currency mismatches to functional currency ${functionalCurrency}.`,
  });

  // Stage 2b: Scale Verifier Agent
  console.log(`[SwarmOrchestrator] Running ScaleVerifierAgent...`);
  const scaleRes = await runScaleVerifierAgent(
    workspaceId,
    currencyRes.facts
  );
  agentLogs.push(scaleRes.executionLog);

  // Stage 3: Discrepancy Auditor Agent
  console.log(`[SwarmOrchestrator] Running DiscrepancyAuditorAgent...`);
  const discrepancyRes = await runDiscrepancyAuditorAgent(
    workspaceId,
    documentId,
    scaleRes.facts
  );
  agentLogs.push(discrepancyRes.executionLog);
  discrepancies = [...discrepancies, ...discrepancyRes.discrepancies];

  auditLogs.push({
    id: `AUDIT-DISCREPANCY-${Date.now()}`,
    workspaceId,
    documentId,
    timestamp: new Date().toISOString(),
    action: "REJECT_HALLUCINATION",
    actor: "DiscrepancyAuditorAgent",
    details: `Audited facts for hallucinations. Found and cataloged ${discrepancyRes.discrepancies.length} discrepancy issues.`,
  });

  // Stage 4: Arithmetic Reconciler Agent
  console.log(`[SwarmOrchestrator] Running ArithmeticReconcilerAgent...`);
  const arithmeticRes = await runArithmeticReconcilerAgent(
    workspaceId,
    documentId,
    discrepancyRes.facts
  );
  agentLogs.push(arithmeticRes.executionLog);
  discrepancies = [...discrepancies, ...arithmeticRes.reconciliationDiscrepancies];

  auditLogs.push({
    id: `AUDIT-RECONCILE-${Date.now()}`,
    workspaceId,
    documentId,
    timestamp: new Date().toISOString(),
    action: "RECONCILE_ARITHMETIC",
    actor: "ArithmeticReconcilerAgent",
    details: `Mathematical statement audit complete. ${arithmeticRes.reconciliationDiscrepancies.length} equation discrepancies flagged.`,
  });

  // Stage 5: Autonomous Backfill & Dynamic Rescan Agent
  console.log(`[SwarmOrchestrator] Running Autonomous BackfillAgent...`);
  const backfillRes = await runBackfillAgent(
    workspaceId,
    documentId,
    documentTitle,
    documentText,
    arithmeticRes.facts,
    functionalCurrency
  );
  agentLogs.push(backfillRes.executionLog);

  if (backfillRes.backfilledCount > 0) {
    auditLogs.push({
      id: `AUDIT-BACKFILL-${Date.now()}`,
      workspaceId,
      documentId,
      timestamp: new Date().toISOString(),
      action: "AUTONOMOUS_FIELD_BACKFILL",
      actor: "BackfillAgent",
      details: `Rescanned document disclosures and accounting equations. Backfilled ${backfillRes.backfilledCount} missing fields.`,
    });
  }

  const totalExecutionTimeMs = Date.now() - pipelineStartTime;

  return {
    facts: backfillRes.facts,
    discrepancies,
    agentLogs,
    auditLogs,
    totalExecutionTimeMs,
  };
}
