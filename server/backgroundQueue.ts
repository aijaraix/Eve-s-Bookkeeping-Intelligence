import { executeSwarmPipeline } from "./swarm/SwarmOrchestrator.js";
import { ExtractedFact, DiscrepancyItem, AgentExecutionLog, AuditTrailRecord } from "../src/types.js";

export interface QueueJob {
  id: string;
  workspaceId: string;
  documentId: string;
  documentTitle: string;
  fileBuffer?: Buffer;
  textData: string;
  functionalCurrency: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number; // 0 to 100
  currentStage: string;
  chunksTotal: number;
  chunksCompleted: number;
  subAgents: {
    alpha: { status: "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED"; pages: string; factsFound: number };
    beta: { status: "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED"; pages: string; factsFound: number };
    gamma: { status: "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED"; pages: string; factsFound: number };
    synthesizer: { status: "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED"; totalFactsMerged: number };
  };
  result?: {
    facts: ExtractedFact[];
    discrepancies: DiscrepancyItem[];
    agentLogs: AgentExecutionLog[];
    auditLogs: AuditTrailRecord[];
    executionTimeMs: number;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}

class BackgroundIngestionQueue {
  private jobs: Map<string, QueueJob> = new Map();
  private isProcessingQueue = false;

  public createJob(
    workspaceId: string,
    documentId: string,
    documentTitle: string,
    textData: string,
    functionalCurrency = "EUR"
  ): QueueJob {
    const jobId = `JOB-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Determine chunk allocation based on document length
    const totalChars = textData.length;
    const estimatedPages = Math.max(1, Math.ceil(totalChars / 3000));

    const job: QueueJob = {
      id: jobId,
      workspaceId,
      documentId,
      documentTitle,
      textData,
      functionalCurrency,
      status: "QUEUED",
      progress: 0,
      currentStage: "Queued for Hermes Sub-Agent Chunked Ingestion",
      chunksTotal: Math.min(3, Math.max(1, Math.ceil(estimatedPages / 50))),
      chunksCompleted: 0,
      subAgents: {
        alpha: { status: "IDLE", pages: "Pages 1-50 (Strategic & Operating Review, Segment Revenue)", factsFound: 0 },
        beta: { status: "IDLE", pages: "Primary Financial Statements (Income Statement, Balance Sheet, Cash Flow)", factsFound: 0 },
        gamma: { status: "IDLE", pages: "Notes to Accounts (Segment Breakdown, Tax, Debt Covenants, Acquisitions)", factsFound: 0 },
        synthesizer: { status: "IDLE", totalFactsMerged: 0 }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.jobs.set(jobId, job);
    
    // Trigger async non-blocking queue processing loop
    setTimeout(() => this.processNextJob(), 10);

    return job;
  }

  public getJob(jobId: string): Omit<QueueJob, 'fileBuffer' | 'textData'> | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    const { fileBuffer, textData, ...rest } = job;
    return rest;
  }

  public getAllJobs(workspaceId?: string): Omit<QueueJob, 'fileBuffer' | 'textData'>[] {
    const all = Array.from(this.jobs.values());
    const filtered = workspaceId ? all.filter(j => j.workspaceId === workspaceId) : all;
    return filtered.map(({ fileBuffer, textData, ...rest }) => rest);
  }

  private async processNextJob() {
    if (this.isProcessingQueue) return;

    const queuedJob = Array.from(this.jobs.values()).find(j => j.status === "QUEUED");
    if (!queuedJob) return;

    this.isProcessingQueue = true;
    queuedJob.status = "PROCESSING";
    queuedJob.progress = 10;
    queuedJob.currentStage = "Allocating document sections across parallel Hermes sub-agents...";
    queuedJob.updatedAt = new Date().toISOString();

    try {
      const { textData, workspaceId, documentId, documentTitle, functionalCurrency } = queuedJob;
      
      // Split document text into chunked sections for parallel Hermes Sub-Agents
      const chunkSize = Math.ceil(textData.length / 3);
      const chunkAlphaText = textData.slice(0, Math.min(textData.length, chunkSize + 2000)); // Section 1 + overlap
      const chunkBetaText = textData.slice(Math.max(0, chunkSize - 1000), Math.min(textData.length, chunkSize * 2 + 2000)); // Section 2 + overlap
      const chunkGammaText = textData.slice(Math.max(0, chunkSize * 2 - 1000)); // Section 3

      // Stage 1: Update Agent Alpha status
      queuedJob.subAgents.alpha.status = "PROCESSING";
      queuedJob.progress = 25;
      queuedJob.currentStage = "Agent Alpha ingesting Strategic & Segment Revenue (Pages 1-50)...";
      queuedJob.updatedAt = new Date().toISOString();

      // Execute Parallel Hermes Sub-Agents (Alpha, Beta, Gamma)
      queuedJob.subAgents.beta.status = "PROCESSING";
      queuedJob.subAgents.gamma.status = "PROCESSING";

      console.log(`[Hermes Queue ${queuedJob.id}] Executing parallel chunked pipeline across 3 Hermes agents...`);

      const [resAlpha, resBeta, resGamma] = await Promise.all([
        executeSwarmPipeline(workspaceId, documentId, `${documentTitle} (Alpha Segment)`, chunkAlphaText, functionalCurrency),
        executeSwarmPipeline(workspaceId, documentId, `${documentTitle} (Beta Core Statements)`, chunkBetaText, functionalCurrency),
        executeSwarmPipeline(workspaceId, documentId, `${documentTitle} (Gamma Notes & Disclosures)`, chunkGammaText, functionalCurrency)
      ]);

      queuedJob.subAgents.alpha.status = "COMPLETED";
      queuedJob.subAgents.alpha.factsFound = resAlpha.facts.length;

      queuedJob.subAgents.beta.status = "COMPLETED";
      queuedJob.subAgents.beta.factsFound = resBeta.facts.length;

      queuedJob.subAgents.gamma.status = "COMPLETED";
      queuedJob.subAgents.gamma.factsFound = resGamma.facts.length;

      queuedJob.chunksCompleted = 3;
      queuedJob.progress = 75;
      queuedJob.currentStage = "Hermes Synthesizer merging chunked outputs into unified financial model...";
      queuedJob.subAgents.synthesizer.status = "PROCESSING";
      queuedJob.updatedAt = new Date().toISOString();

      // Merge and deduplicate facts across parallel chunk outputs
      const mergedFactsMap = new Map<string, ExtractedFact>();
      const allRawFacts = [...resAlpha.facts, ...resBeta.facts, ...resGamma.facts];

      allRawFacts.forEach((fact) => {
        const key = `${fact.labelNormalized.toLowerCase()}_${fact.valueFunctional}_${fact.currencyOriginal}`;
        if (!mergedFactsMap.has(key)) {
          mergedFactsMap.set(key, fact);
        }
      });

      const mergedFacts = Array.from(mergedFactsMap.values());
      const mergedDiscrepancies = [...resAlpha.discrepancies, ...resBeta.discrepancies, ...resGamma.discrepancies];
      const mergedAgentLogs = [...resAlpha.agentLogs, ...resBeta.agentLogs, ...resGamma.agentLogs];
      const mergedAuditLogs = [...resAlpha.auditLogs, ...resBeta.auditLogs, ...resGamma.auditLogs];

      // Add Hermes Synthesizer audit log
      mergedAuditLogs.push({
        id: `AUDIT-SYNTH-${Date.now()}`,
        workspaceId,
        documentId,
        timestamp: new Date().toISOString(),
        action: "HERMES_SYNTHESIZE",
        actor: "HermesSynthesizer",
        details: `Successfully merged chunked sub-agent outputs: Alpha (${resAlpha.facts.length}), Beta (${resBeta.facts.length}), Gamma (${resGamma.facts.length}) into ${mergedFacts.length} unified verified facts.`
      });

      queuedJob.subAgents.synthesizer.status = "COMPLETED";
      queuedJob.subAgents.synthesizer.totalFactsMerged = mergedFacts.length;

      queuedJob.result = {
        facts: mergedFacts,
        discrepancies: mergedDiscrepancies,
        agentLogs: mergedAgentLogs,
        auditLogs: mergedAuditLogs,
        executionTimeMs: resAlpha.totalExecutionTimeMs + resBeta.totalExecutionTimeMs + resGamma.totalExecutionTimeMs
      };

      queuedJob.status = "COMPLETED";
      queuedJob.progress = 100;
      queuedJob.currentStage = `Completed! Extracted ${mergedFacts.length} verified facts across 3 parallel Hermes agents.`;
      queuedJob.updatedAt = new Date().toISOString();

      console.log(`[Hermes Queue ${queuedJob.id}] Successfully completed job for ${documentTitle}`);
    } catch (err: any) {
      console.error(`[Hermes Queue ${queuedJob.id}] Processing failed:`, err);
      queuedJob.status = "FAILED";
      queuedJob.error = err?.message || "Chunked Hermes processing error";
      queuedJob.currentStage = `Failed: ${queuedJob.error}`;
      queuedJob.updatedAt = new Date().toISOString();
    } finally {
      this.isProcessingQueue = false;
      // Loop to pick up any remaining queued jobs
      setTimeout(() => this.processNextJob(), 10);
    }
  }
}

export const backgroundIngestionQueue = new BackgroundIngestionQueue();
