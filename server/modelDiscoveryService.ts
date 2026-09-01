import { GoogleGenAI } from '@google/genai';

export type ModelClassification = 'STABLE' | 'PREVIEW' | 'LATEST' | 'DEPRECATED';
export type ModelHealthState = 
  | 'HEALTHY' 
  | 'DEGRADED' 
  | 'UNAVAILABLE_CONFIGURATION' 
  | 'UNAVAILABLE_QUOTA' 
  | 'UNAVAILABLE_RATE_LIMIT';

export type ProviderErrorType = 
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMIT_SHORT_TERM'
  | 'TOKEN_RATE_LIMIT'
  | 'RPM_LIMIT'
  | 'TPM_LIMIT'
  | 'DAILY_QUOTA_EXHAUSTED'
  | 'MODEL_NOT_FOUND'
  | 'AUTHENTICATION_ERROR'
  | 'PERMISSION_ERROR'
  | 'NETWORK_ERROR'
  | 'REQUEST_TIMEOUT'
  | 'INVALID_REQUEST'
  | 'UNKNOWN_PROVIDER_ERROR';

export type RoutingTaskType = 
  | 'DOCUMENT_MAP' 
  | 'STRUCTURED_FINANCIAL_EXTRACTION' 
  | 'COMPLEX_CONFLICT_RESOLUTION' 
  | 'GENERAL_PROMPT';

export type AICostMode = 'FREE_FIRST' | 'LOW_COST' | 'FAST' | 'ENTERPRISE';

export interface ModelCapabilityRecord {
  modelId: string;
  available: boolean;
  classification: ModelClassification;
  supportedInputTypes: string[]; // ['text', 'pdf', 'image']
  pdfSupport: boolean;
  structuredOutputSupport: boolean;
  contextCapacity: number;
  freeTierEligible: boolean;
  healthState: ModelHealthState;
  lastSuccessfulCall: string | null;
  lastError: string | null;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  consecutiveFailures: number;
  openUntil: number;
  requestsMinute: number;
  tokensMinute: number;
  requestsDay: number;
}

export interface TaskAttemptRecord {
  attemptNumber: number;
  model: string;
  provider: string;
  startTime: string;
  endTime: string;
  latencyMs: number;
  status: number | string;
  errorType?: ProviderErrorType;
  httpCode?: number;
  retryAfterMs?: number;
  tokensUsed?: { promptTokens: number; completionTokens: number };
  resultCommitted: boolean;
}

// Configured baseline candidate models to discover/manage
export const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-pro-preview',
  'gemini-flash-latest'
];

export const TASK_ROUTING_PROFILES: Record<RoutingTaskType, { primary: string; fallbacks: string[] }> = {
  DOCUMENT_MAP: {
    primary: 'gemini-3.6-flash',
    fallbacks: ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
  },
  STRUCTURED_FINANCIAL_EXTRACTION: {
    primary: 'gemini-3.5-flash-lite',
    fallbacks: ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
  },
  COMPLEX_CONFLICT_RESOLUTION: {
    primary: 'gemini-3.6-flash',
    fallbacks: ['gemini-3.1-pro-preview', 'gemini-flash-latest']
  },
  GENERAL_PROMPT: {
    primary: 'gemini-3.6-flash',
    fallbacks: ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
  }
};

class ModelDiscoveryService {
  private static instance: ModelDiscoveryService;
  private modelRegistry: Map<string, ModelCapabilityRecord> = new Map();
  private isDiscovered: boolean = false;
  private dailyQuotaExhausted: boolean = false;
  private dailyQuotaResetTimestamp: number | null = null;
  private taskAttemptLogs: Map<string, TaskAttemptRecord[]> = new Map();

  private constructor() {
    this.initializeBaselineRegistry();
  }

  public static getInstance(): ModelDiscoveryService {
    if (!ModelDiscoveryService.instance) {
      ModelDiscoveryService.instance = new ModelDiscoveryService();
    }
    return ModelDiscoveryService.instance;
  }

  private initializeBaselineRegistry() {
    for (const modelId of CANDIDATE_MODELS) {
      this.modelRegistry.set(modelId, {
        modelId,
        available: true,
        classification: modelId.includes('preview') ? 'PREVIEW' : (modelId.includes('latest') ? 'LATEST' : 'STABLE'),
        supportedInputTypes: ['text', 'pdf', 'image'],
        pdfSupport: true,
        structuredOutputSupport: true,
        contextCapacity: modelId.includes('pro') ? 2000000 : 1000000,
        freeTierEligible: !modelId.includes('pro'),
        healthState: 'HEALTHY',
        lastSuccessfulCall: null,
        lastError: null,
        circuitState: 'CLOSED',
        consecutiveFailures: 0,
        openUntil: 0,
        requestsMinute: 0,
        tokensMinute: 0,
        requestsDay: 0
      });
    }
  }

  /**
   * Discovers available models at runtime via @google/genai ai.models.list()
   */
  public async discoverRuntimeModels(apiKeyOverride?: string): Promise<void> {
    const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      console.warn("[ModelDiscoveryService] Gemini API key missing. All models marked UNAVAILABLE_CONFIGURATION.");
      for (const [id, rec] of this.modelRegistry) {
        rec.available = false;
        rec.healthState = 'UNAVAILABLE_CONFIGURATION';
      }
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const discoveredIds = new Set<string>();

      try {
        const list = await ai.models.list();
        for await (const m of list) {
          if (m.name) {
            const cleanId = m.name.replace(/^models\//, '');
            discoveredIds.add(cleanId);
          }
        }
      } catch (listErr: any) {
        console.warn(`[ModelDiscoveryService] ai.models.list() call failed (${listErr?.message}). Falling back to candidate pool verification.`);
      }

      // Special rule for gemini-3.7-flash: ONLY include if discovered in live API!
      if (discoveredIds.has('gemini-3.7-flash')) {
        if (!this.modelRegistry.has('gemini-3.7-flash')) {
          this.modelRegistry.set('gemini-3.7-flash', {
            modelId: 'gemini-3.7-flash',
            available: true,
            classification: 'STABLE',
            supportedInputTypes: ['text', 'pdf', 'image'],
            pdfSupport: true,
            structuredOutputSupport: true,
            contextCapacity: 1000000,
            freeTierEligible: true,
            healthState: 'HEALTHY',
            lastSuccessfulCall: null,
            lastError: null,
            circuitState: 'CLOSED',
            consecutiveFailures: 0,
            openUntil: 0,
            requestsMinute: 0,
            tokensMinute: 0,
            requestsDay: 0
          });
        }
      }

      // Update registry availability based on discovery
      for (const [id, rec] of this.modelRegistry.entries()) {
        if (discoveredIds.size > 0) {
          const isPresent = discoveredIds.has(id);
          rec.available = isPresent;
          if (!isPresent) {
            rec.healthState = 'UNAVAILABLE_CONFIGURATION';
            rec.lastError = 'MODEL_NOT_FOUND (404) during API discovery';
          } else {
            if (rec.healthState === 'UNAVAILABLE_CONFIGURATION') {
              rec.healthState = 'HEALTHY';
              rec.lastError = null;
            }
          }
        } else {
          // If list API was unavailable, keep candidate pool available unless marked 404 previously
          if (rec.healthState !== 'UNAVAILABLE_CONFIGURATION') {
            rec.available = true;
          }
        }
      }

      this.isDiscovered = true;
      console.log(`[ModelDiscoveryService] Runtime model discovery complete. Available models: ${Array.from(this.modelRegistry.values()).filter(m => m.available).map(m => m.modelId).join(', ')}`);
    } catch (err: any) {
      console.error("[ModelDiscoveryService] Exception during model discovery:", err);
    }
  }

  /**
   * Classifies provider errors into explicit taxonomy
   */
  public classifyProviderError(err: any, statusCode?: number): { errorType: ProviderErrorType; httpCode?: number; retryAfterMs?: number } {
    const rawMsg = err?.message || String(err);
    const msg = rawMsg.toLowerCase();
    const code = statusCode || err?.status || err?.code || err?.statusCode;

    // Parse retryAfterMs if present in rawMsg or headers
    let retryAfterMs: number | undefined = undefined;
    const retryInMatch = rawMsg.match(/retry in\s+(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:([\d\.]+)s)?/i);
    if (retryInMatch) {
      const h = parseInt(retryInMatch[1] || '0', 10);
      const m = parseInt(retryInMatch[2] || '0', 10);
      const s = parseFloat(retryInMatch[3] || '0');
      const total = (h * 3600 + m * 60 + s) * 1000;
      if (total > 0) retryAfterMs = Math.round(total);
    } else {
      const retryAfterHeaderMatch = rawMsg.match(/retry-after[:=\s]+(\d+)/i);
      if (retryAfterHeaderMatch) {
        const secs = parseInt(retryAfterHeaderMatch[1], 10);
        if (!isNaN(secs) && secs > 0) retryAfterMs = secs * 1000;
      }
    }

    if (code === 404 || msg.includes("404") || msg.includes("model_not_found") || msg.includes("not found") || msg.includes("unrecognized model")) {
      return { errorType: 'MODEL_NOT_FOUND', httpCode: 404, retryAfterMs };
    }
    if (code === 401 || msg.includes("401") || msg.includes("unauthenticated") || msg.includes("invalid api key") || msg.includes("invalid_key")) {
      return { errorType: 'AUTHENTICATION_ERROR', httpCode: 401, retryAfterMs };
    }
    if (code === 403 || msg.includes("403") || msg.includes("permission_denied")) {
      return { errorType: 'PERMISSION_ERROR', httpCode: 403, retryAfterMs };
    }

    // 429 Handling
    if (code === 429 || msg.includes("429") || msg.includes("resource_exhausted") || msg.includes("quota")) {
      if (msg.includes("daily") || msg.includes("per day") || msg.includes("per_day") || msg.includes("free tier limit") || (retryAfterMs && retryAfterMs > 3600000)) {
        return { errorType: 'DAILY_QUOTA_EXHAUSTED', httpCode: 429, retryAfterMs };
      }
      if (msg.includes("tpm") || msg.includes("token") || msg.includes("tokens per minute")) {
        return { errorType: 'TPM_LIMIT', httpCode: 429, retryAfterMs };
      }
      if (msg.includes("rpm") || msg.includes("request") || msg.includes("requests per minute")) {
        return { errorType: 'RPM_LIMIT', httpCode: 429, retryAfterMs };
      }
      return { errorType: 'RATE_LIMIT_SHORT_TERM', httpCode: 429, retryAfterMs };
    }

    // 5xx Handling
    if (code === 503 || code === 500 || code === 502 || code === 504 || msg.includes("503") || msg.includes("unavailable") || msg.includes("overloaded") || msg.includes("server error") || msg.includes("high demand")) {
      return { errorType: 'SERVICE_UNAVAILABLE', httpCode: typeof code === 'number' ? code : 503, retryAfterMs };
    }

    // Timeout / Abort
    if (msg.includes("timeout") || msg.includes("aborted") || msg.includes("abort")) {
      return { errorType: 'REQUEST_TIMEOUT', httpCode: 408, retryAfterMs };
    }

    // Network Error
    if (msg.includes("fetch failed") || msg.includes("econnreset") || msg.includes("enotfound") || msg.includes("network")) {
      return { errorType: 'NETWORK_ERROR', httpCode: 0, retryAfterMs };
    }

    // 400 Bad Request
    if (code === 400 || msg.includes("bad request") || msg.includes("invalid argument")) {
      return { errorType: 'INVALID_REQUEST', httpCode: 400, retryAfterMs };
    }

    return { errorType: 'UNKNOWN_PROVIDER_ERROR', httpCode: typeof code === 'number' ? code : 500, retryAfterMs };
  }

  /**
   * Resolves routing models for a specific task profile and constraints
   */
  public getCandidateModelsForTask(
    taskType: RoutingTaskType,
    requirements?: { requiresPdf?: boolean; requiresStructuredOutput?: boolean }
  ): string[] {
    const profile = TASK_ROUTING_PROFILES[taskType] || TASK_ROUTING_PROFILES.GENERAL_PROMPT;
    const rawList = [profile.primary, ...profile.fallbacks];
    const candidates: string[] = [];
    const now = Date.now();

    for (const modelId of rawList) {
      const rec = this.modelRegistry.get(modelId);
      if (!rec) continue;

      // Must be available and configured
      if (!rec.available || rec.healthState === 'UNAVAILABLE_CONFIGURATION') continue;

      // Check daily quota state
      if (rec.healthState === 'UNAVAILABLE_QUOTA' || this.dailyQuotaExhausted) continue;

      // Check circuit breaker state
      if (rec.circuitState === 'OPEN') {
        if (now >= rec.openUntil) {
          rec.circuitState = 'HALF_OPEN';
        } else {
          continue; // Bypassed while OPEN
        }
      }

      // Check PDF capability if required
      if (requirements?.requiresPdf && !rec.pdfSupport) continue;

      // Check Structured Output capability if required
      if (requirements?.requiresStructuredOutput && !rec.structuredOutputSupport) continue;

      candidates.push(modelId);
    }

    // De-duplicate while preserving profile priority order
    return Array.from(new Set(candidates));
  }

  /**
   * Records successful model call
   */
  public recordModelSuccess(modelId: string) {
    const rec = this.modelRegistry.get(modelId);
    if (!rec) return;

    rec.lastSuccessfulCall = new Date().toISOString();
    rec.lastError = null;
    rec.consecutiveFailures = 0;
    rec.circuitState = 'CLOSED';
    rec.healthState = 'HEALTHY';
    rec.requestsMinute++;
    rec.requestsDay++;
  }

  /**
   * Records model failure and updates circuit breaker / health state based on error taxonomy
   */
  public recordModelFailure(modelId: string, err: any, statusCode?: number) {
    const rec = this.modelRegistry.get(modelId);
    const { errorType, httpCode } = this.classifyProviderError(err, statusCode);
    const errorMsg = `${errorType} (${httpCode || 'ERR'}): ${err?.message || String(err)}`;

    if (rec) {
      rec.lastError = errorMsg;
      rec.consecutiveFailures++;

      if (errorType === 'MODEL_NOT_FOUND') {
        rec.available = false;
        rec.healthState = 'UNAVAILABLE_CONFIGURATION';
        console.warn(`[ModelDiscoveryService] Model ${modelId} returned MODEL_NOT_FOUND (404). Removed from active routing.`);
        return;
      }

      if (errorType === 'DAILY_QUOTA_EXHAUSTED') {
        rec.healthState = 'UNAVAILABLE_QUOTA';
        this.dailyQuotaExhausted = true;
        this.dailyQuotaResetTimestamp = Date.now() + 86400000; // 24h fallback reset
        console.warn(`[ModelDiscoveryService] Model ${modelId} daily quota exhausted. AI tasks set to WAITING_FOR_DAILY_CAPACITY.`);
        return;
      }

      if (errorType === 'RPM_LIMIT' || errorType === 'TPM_LIMIT') {
        rec.healthState = 'UNAVAILABLE_RATE_LIMIT';
      } else if (errorType === 'SERVICE_UNAVAILABLE' || errorType === 'REQUEST_TIMEOUT' || errorType === 'NETWORK_ERROR') {
        rec.healthState = 'DEGRADED';
      }

      // Circuit Breaker Trigger: 3 consecutive transient failures or failure during HALF_OPEN
      if (rec.consecutiveFailures >= 3 || rec.circuitState === 'HALF_OPEN') {
        rec.circuitState = 'OPEN';
        rec.openUntil = Date.now() + 20000; // 20s cooldown
        console.warn(`[ModelDiscoveryService Circuit Breaker] Model ${modelId} switched to OPEN for 20s due to ${rec.consecutiveFailures} consecutive failures.`);
      }
    }
  }

  /**
   * Log attempt history for audit and diagnostics
   */
  public logTaskAttempt(taskId: string, attempt: TaskAttemptRecord) {
    if (!this.taskAttemptLogs.has(taskId)) {
      this.taskAttemptLogs.set(taskId, []);
    }
    this.taskAttemptLogs.get(taskId)!.push(attempt);
  }

  public getTaskAttempts(taskId: string): TaskAttemptRecord[] {
    return this.taskAttemptLogs.get(taskId) || [];
  }

  public getDailyQuotaStatus() {
    return {
      isExhausted: this.dailyQuotaExhausted,
      resetTimestamp: this.dailyQuotaResetTimestamp
    };
  }

  public resetDailyQuotaState() {
    this.dailyQuotaExhausted = false;
    this.dailyQuotaResetTimestamp = null;
    for (const rec of this.modelRegistry.values()) {
      if (rec.healthState === 'UNAVAILABLE_QUOTA') {
        rec.healthState = 'HEALTHY';
      }
    }
  }

  public resetAllRegistryState() {
    this.modelRegistry.clear();
    this.initializeBaselineRegistry();
    this.dailyQuotaExhausted = false;
    this.dailyQuotaResetTimestamp = null;
    this.taskAttemptLogs.clear();
  }

  public getModelRecord(modelId: string): ModelCapabilityRecord | undefined {
    return this.modelRegistry.get(modelId);
  }

  /**
   * Generates Discovered Models Capability Table for Admin Diagnostics (Spec 24)
   */
  public getDiscoveredModelsTable(): Array<{
    configuredModel: string;
    available: boolean;
    pdfCompatible: boolean;
    structuredOutputCompatible: boolean;
    freeFirstEligible: boolean;
    status: string;
    healthState: ModelHealthState;
    circuitState: string;
    classification: ModelClassification;
  }> {
    return Array.from(this.modelRegistry.values()).map(rec => ({
      configuredModel: rec.modelId,
      available: rec.available,
      pdfCompatible: rec.pdfSupport,
      structuredOutputCompatible: rec.structuredOutputSupport,
      freeFirstEligible: rec.freeTierEligible,
      status: rec.available ? (rec.circuitState === 'OPEN' ? 'CIRCUIT_OPEN' : rec.healthState) : 'UNAVAILABLE_CONFIGURATION',
      healthState: rec.healthState,
      circuitState: rec.circuitState,
      classification: rec.classification
    }));
  }
}

export const modelDiscoveryService = ModelDiscoveryService.getInstance();
