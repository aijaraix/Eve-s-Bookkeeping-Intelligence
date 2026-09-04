import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ExtractedFact } from "../src/types.js";
import { executeWorkerExtraction, WorkerJob } from "./worker.js";

export interface WorkerConnectionStatus {
  isConfigured: boolean;
  workerUrl: string;
  status: "CONNECTED" | "UNCONFIGURED" | "FALLBACK_LOCAL" | "ERROR";
  latencyMs?: number;
  uptimeSeconds?: number;
  activeJobsCount?: number;
  completedJobsCount?: number;
  memory?: { rssMb: number; heapUsedMb: number };
  lastCheckedAt: string;
  errorMessage?: string;
}

export class ExtractionWorkerClient {
  private workerUrl: string;
  private workerSecret: string;
  private lastHealthCheck: WorkerConnectionStatus | null = null;

  constructor() {
    this.workerUrl = (process.env.EXTRACTION_WORKER_URL || "https://eves-worker.zeabur.app").trim().replace(/\/$/, "");
    this.workerSecret = (process.env.EXTRACTION_WORKER_SECRET || "").trim();
  }

  public isRemoteWorkerConfigured(): boolean {
    return Boolean(this.workerUrl && this.workerUrl.startsWith("http"));
  }

  public async checkHealth(): Promise<WorkerConnectionStatus> {
    if (!this.isRemoteWorkerConfigured()) {
      return {
        isConfigured: false,
        workerUrl: "",
        status: "FALLBACK_LOCAL",
        lastCheckedAt: new Date().toISOString()
      };
    }

    const t0 = Date.now();
    try {
      const headers: Record<string, string> = {};
      if (this.workerSecret) {
        headers["x-worker-token"] = this.workerSecret;
      }
      const res = await fetch(`${this.workerUrl}/health`, {
        headers,
        signal: AbortSignal.timeout(4000)
      });

      if (!res.ok) {
        return {
          isConfigured: true,
          workerUrl: this.workerUrl,
          status: "ERROR",
          latencyMs: Date.now() - t0,
          errorMessage: `Worker returned HTTP ${res.status}: ${res.statusText}`,
          lastCheckedAt: new Date().toISOString()
        };
      }

      const data = await res.json();
      const status: WorkerConnectionStatus = {
        isConfigured: true,
        workerUrl: this.workerUrl,
        status: "CONNECTED",
        latencyMs: Date.now() - t0,
        uptimeSeconds: data.uptimeSeconds,
        activeJobsCount: data.activeJobsCount,
        completedJobsCount: data.completedJobsCount,
        memory: data.memory,
        lastCheckedAt: new Date().toISOString()
      };
      this.lastHealthCheck = status;
      return status;
    } catch (err: any) {
      const status: WorkerConnectionStatus = {
        isConfigured: true,
        workerUrl: this.workerUrl,
        status: "ERROR",
        latencyMs: Date.now() - t0,
        errorMessage: err.message || "Failed to connect to extraction worker",
        lastCheckedAt: new Date().toISOString()
      };
      this.lastHealthCheck = status;
      return status;
    }
  }

  public async dispatchExtractionJob(params: {
    workspaceId: string;
    documentId: string;
    documentTitle: string;
    filePath: string;
    functionalCurrency?: string;
    intakeSessionId?: string;
  }): Promise<{
    jobId: string;
    status: string;
    engine: "REMOTE_ZEABUR_WORKER" | "EMBEDDED_DETERMINISTIC_ENGINE";
  }> {
    // Check if remote worker is reachable
    if (this.isRemoteWorkerConfigured()) {
      try {
        const fileBuffer = fs.readFileSync(params.filePath);
        const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);

        // Build multipart body
        const formData = new FormData();
        const blob = new Blob([fileBuffer]);
        formData.append("file", blob, params.documentTitle);
        formData.append("workspaceId", params.workspaceId);
        formData.append("documentId", params.documentId);
        formData.append("documentTitle", params.documentTitle);
        formData.append("functionalCurrency", params.functionalCurrency || "EUR");
        if (params.intakeSessionId) {
          formData.append("intakeSessionId", params.intakeSessionId);
        }

        const headers: Record<string, string> = {};
        if (this.workerSecret) {
          headers["x-worker-token"] = this.workerSecret;
        }

        const res = await fetch(`${this.workerUrl}/v1/jobs`, {
          method: "POST",
          headers,
          body: formData,
          signal: AbortSignal.timeout(15000)
        });

        if (res.ok) {
          const data = await res.json();
          return {
            jobId: data.jobId,
            status: data.status || "QUEUED",
            engine: "REMOTE_ZEABUR_WORKER"
          };
        } else {
          console.warn(
            `[WorkerClient] Remote worker POST /v1/jobs failed with HTTP ${res.status}. Falling back to embedded deterministic engine.`
          );
        }
      } catch (err: any) {
        console.warn(
          `[WorkerClient] Remote worker connection error (${err.message}). Falling back to embedded deterministic engine.`
        );
      }
    }

    // Fallback: execute local deterministic extraction
    const localJobId = `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fileBuffer = fs.readFileSync(params.filePath);
    const documentHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    const localJob: WorkerJob = {
      jobId: localJobId,
      intakeSessionId: params.intakeSessionId,
      workspaceId: params.workspaceId,
      documentId: params.documentId,
      documentTitle: params.documentTitle,
      documentHash,
      functionalCurrency: params.functionalCurrency || "EUR",
      filePath: params.filePath,
      fileSize: fileBuffer.length,
      mimeType: "application/pdf",
      createdAt: new Date().toISOString(),
      status: "QUEUED",
      currentStage: "Local deterministic extraction queued",
      progress: 0,
      retryCount: 0,
      counters: {
        filesReceived: 1,
        pagesInventoried: 0,
        pagesParsed: 0,
        ocrPagesCount: 0,
        tablesIdentified: 0,
        tablesExtracted: 0,
        statementsIdentified: 0,
        statementsProcessed: 0,
        factsNormalized: 0,
        evidenceConfirmed: 0,
        accountingGatesPassed: 0
      },
      results: {
        facts: [],
        entities: [],
        statements: [],
        discrepancies: [],
        validationResults: null,
        pageDiagnostics: []
      },
      warnings: []
    };

    setImmediate(() => executeWorkerExtraction(localJob));

    return {
      jobId: localJobId,
      status: "QUEUED",
      engine: "EMBEDDED_DETERMINISTIC_ENGINE"
    };
  }
}

export const extractionWorkerClient = new ExtractionWorkerClient();
