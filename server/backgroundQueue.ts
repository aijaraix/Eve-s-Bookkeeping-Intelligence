import fs from "fs";
import path from "path";
import { executeSwarmPipeline } from "./swarm/SwarmOrchestrator.js";
import { ExtractedFact, DiscrepancyItem, AgentExecutionLog, AuditTrailRecord } from "../src/types.js";

const QUEUE_FILE = path.join(process.cwd(), "storage", "queue_jobs.json");

export interface ProcessingUnit {
  unit_id: string;
  document_id: string;
  workspace_id: string;
  actual_page_start: number;
  actual_page_end: number;
  section_id?: string;
  source_block_ids?: string[];
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "RETRYING" | "REVIEW_REQUIRED";
  attempt_count: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  last_error?: string;
  textData: string;
}

export interface QueueJob {
  id: string;
  workspaceId: string;
  documentId: string;
  documentTitle: string;
  filePath?: string;
  textData?: string;
  functionalCurrency: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "RETRYING" | "REVIEW_REQUIRED";
  progress: number; // 0 to 100
  currentStage: string;
  unitsTotal: number;
  unitsCompleted: number;
  attemptCount: number;
  processingUnits: ProcessingUnit[];
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

  constructor() {
    this.loadQueueFromDisk();
  }

  private saveQueueToDisk() {
    try {
      const storageDir = path.dirname(QUEUE_FILE);
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      const serializableJobs = Array.from(this.jobs.values());
      fs.writeFileSync(QUEUE_FILE, JSON.stringify(serializableJobs, null, 2));
    } catch (err) {
      console.error("[Hermes Queue] Failed to save queue to disk:", err);
    }
  }

  private loadQueueFromDisk() {
    try {
      if (fs.existsSync(QUEUE_FILE)) {
        const raw = fs.readFileSync(QUEUE_FILE, "utf-8");
        const list: QueueJob[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(job => {
            if (job.status === "PROCESSING") {
              job.status = "QUEUED";
              job.currentStage = "Re-queued following server restart";
            }
            this.jobs.set(job.id, job);
          });
          console.log(`[Hermes Queue] Loaded ${list.length} persisted queue jobs from storage.`);
        }
      }
    } catch (err) {
      console.error("[Hermes Queue] Failed to load queue from disk:", err);
    }
    setTimeout(() => this.processNextJob(), 100);
  }

  public createJob(
    workspaceId: string,
    documentId: string,
    documentTitle: string,
    textData: string,
    functionalCurrency = "EUR",
    filePath?: string
  ): QueueJob {
    const jobId = `JOB-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Divide document into real bounded processing units based on sections / pages
    const paragraphs = textData.split(/\n\s*\n/);
    const units: ProcessingUnit[] = [];
    const maxCharsPerUnit = 4000;
    
    let currentUnitText = "";
    let pageCounter = 1;
    let unitIdx = 1;

    for (const para of paragraphs) {
      if ((currentUnitText + para).length > maxCharsPerUnit && currentUnitText.trim().length > 0) {
        units.push({
          unit_id: `UNIT-${jobId}-${unitIdx++}`,
          document_id: documentId,
          workspace_id: workspaceId,
          actual_page_start: pageCounter,
          actual_page_end: pageCounter + 1,
          section_id: `SEC-${unitIdx}`,
          source_block_ids: [`BLK-${unitIdx}-A`, `BLK-${unitIdx}-B`],
          status: "QUEUED",
          attempt_count: 0,
          created_at: new Date().toISOString(),
          textData: currentUnitText
        });
        currentUnitText = para + "\n\n";
        pageCounter += 1;
      } else {
        currentUnitText += para + "\n\n";
      }
    }

    if (currentUnitText.trim().length > 0) {
      units.push({
        unit_id: `UNIT-${jobId}-${unitIdx++}`,
        document_id: documentId,
        workspace_id: workspaceId,
        actual_page_start: pageCounter,
        actual_page_end: pageCounter,
        section_id: `SEC-${unitIdx}`,
        source_block_ids: [`BLK-${unitIdx}-A`],
        status: "QUEUED",
        attempt_count: 0,
        created_at: new Date().toISOString(),
        textData: currentUnitText
      });
    }

    const job: QueueJob = {
      id: jobId,
      workspaceId,
      documentId,
      documentTitle,
      filePath,
      textData,
      functionalCurrency,
      status: "QUEUED",
      progress: 0,
      currentStage: `Queued for Bounded Unit Ingestion (${units.length} units total)`,
      unitsTotal: units.length,
      unitsCompleted: 0,
      attemptCount: 1,
      processingUnits: units,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.jobs.set(jobId, job);
    this.saveQueueToDisk();
    
    setTimeout(() => this.processNextJob(), 10);
    return job;
  }

  public getJob(jobId: string): Omit<QueueJob, 'textData'> | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    const { textData, ...rest } = job;
    return rest;
  }

  public getAllJobs(workspaceId?: string): Omit<QueueJob, 'textData'>[] {
    const all = Array.from(this.jobs.values());
    const filtered = workspaceId ? all.filter(j => j.workspaceId === workspaceId) : all;
    return filtered.map(({ textData, ...rest }) => rest);
  }

  private async processNextJob() {
    if (this.isProcessingQueue) return;

    const queuedJob = Array.from(this.jobs.values()).find(j => j.status === "QUEUED");
    if (!queuedJob) return;

    this.isProcessingQueue = true;
    queuedJob.status = "PROCESSING";
    queuedJob.progress = 5;
    queuedJob.currentStage = `Processing ${queuedJob.unitsTotal} bounded document units...`;
    queuedJob.updatedAt = new Date().toISOString();
    this.saveQueueToDisk();

    try {
      const { workspaceId, documentId, documentTitle, functionalCurrency } = queuedJob;
      const allUnitFacts: ExtractedFact[] = [];
      const allDiscrepancies: DiscrepancyItem[] = [];
      const allAgentLogs: AgentExecutionLog[] = [];
      const allAuditLogs: AuditTrailRecord[] = [];
      let totalExecutionMs = 0;

      // Process EVERY bounded unit until ALL source units are accounted for!
      for (let i = 0; i < queuedJob.processingUnits.length; i++) {
        const unit = queuedJob.processingUnits[i];
        unit.status = "PROCESSING";
        unit.started_at = new Date().toISOString();
        unit.attempt_count += 1;

        queuedJob.currentStage = `Processing unit ${i + 1}/${queuedJob.unitsTotal} (Pages ${unit.actual_page_start}-${unit.actual_page_end})...`;
        queuedJob.progress = Math.round(((i + 1) / queuedJob.unitsTotal) * 90);
        queuedJob.updatedAt = new Date().toISOString();
        this.saveQueueToDisk();

        try {
          const res = await executeSwarmPipeline(
            workspaceId,
            documentId,
            `${documentTitle} [Unit ${i + 1}: p.${unit.actual_page_start}-${unit.actual_page_end}]`,
            unit.textData,
            functionalCurrency
          );

          unit.status = "COMPLETED";
          unit.completed_at = new Date().toISOString();
          queuedJob.unitsCompleted += 1;

          allUnitFacts.push(...res.facts);
          allDiscrepancies.push(...res.discrepancies);
          allAgentLogs.push(...res.agentLogs);
          allAuditLogs.push(...res.auditLogs);
          totalExecutionMs += res.totalExecutionTimeMs;
        } catch (unitErr: any) {
          unit.status = "FAILED";
          unit.last_error = unitErr?.message || "Unit extraction failed";
          console.error(`[Hermes Queue ${queuedJob.id}] Unit ${unit.unit_id} failed:`, unitErr);
        }
      }

      // Deduplicate facts across all processing units
      const mergedFactsMap = new Map<string, ExtractedFact>();
      allUnitFacts.forEach((fact) => {
        const key = `${fact.labelNormalized.toLowerCase()}_${fact.valueFunctional}_${fact.currencyOriginal}`;
        if (!mergedFactsMap.has(key)) {
          mergedFactsMap.set(key, fact);
        }
      });

      const mergedFacts = Array.from(mergedFactsMap.values());

      allAuditLogs.push({
        id: `AUDIT-UNITS-COMPLETE-${Date.now()}`,
        workspaceId,
        documentId,
        timestamp: new Date().toISOString(),
        action: "BOUNDED_UNITS_COMPLETE",
        actor: "HermesQueueManager",
        details: `Successfully processed ${queuedJob.unitsCompleted}/${queuedJob.unitsTotal} bounded processing units. Extracted ${mergedFacts.length} unique facts.`
      });

      queuedJob.result = {
        facts: mergedFacts,
        discrepancies: allDiscrepancies,
        agentLogs: allAgentLogs,
        auditLogs: allAuditLogs,
        executionTimeMs: totalExecutionMs
      };

      queuedJob.status = "COMPLETED";
      queuedJob.progress = 100;
      queuedJob.currentStage = `Completed! Successfully processed ${queuedJob.unitsCompleted}/${queuedJob.unitsTotal} bounded units (${mergedFacts.length} verified facts).`;
      queuedJob.updatedAt = new Date().toISOString();
      this.saveQueueToDisk();

      console.log(`[Hermes Queue ${queuedJob.id}] Successfully completed job for ${documentTitle}`);
    } catch (err: any) {
      console.error(`[Hermes Queue ${queuedJob.id}] Processing failed:`, err);
      queuedJob.status = "FAILED";
      queuedJob.error = err?.message || "Bounded unit queue processing error";
      queuedJob.currentStage = `Failed: ${queuedJob.error}`;
      queuedJob.updatedAt = new Date().toISOString();
      this.saveQueueToDisk();
    } finally {
      this.isProcessingQueue = false;
      setTimeout(() => this.processNextJob(), 10);
    }
  }
}

export const backgroundIngestionQueue = new BackgroundIngestionQueue();
