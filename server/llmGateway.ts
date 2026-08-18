import { GoogleGenAI } from "@google/genai";
import { LLMGatewayRequest, LLMGatewayResponse } from "../src/types.js";

// Helper for delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Configuration via environment variables with production defaults
export const LLM_CONFIG = {
  get MAX_GLOBAL_CONCURRENCY() {
    return parseInt(process.env.LLM_MAX_CONCURRENCY || "4", 10);
  },
  get PAGE_CONCURRENCY() {
    return parseInt(process.env.INGESTION_PAGE_CONCURRENCY || "3", 10);
  },
  get MAX_RETRIES() {
    return parseInt(process.env.LLM_MAX_RETRIES || "6", 10);
  },
  get REQUEST_TIMEOUT_MS() {
    return parseInt(process.env.LLM_REQUEST_TIMEOUT_MS || "60000", 10);
  },
  get UNIT_MAX_ACTIVE_TIME_MS() {
    return parseInt(process.env.UNIT_MAX_ACTIVE_TIME_MS || "300000", 10);
  },
  get JOB_STALL_TIMEOUT_MS() {
    return parseInt(process.env.JOB_STALL_TIMEOUT_MS || "300000", 10);
  }
};

// Circuit Breaker State
type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface ProviderCircuitBreaker {
  state: CircuitState;
  consecutiveFailures: number;
  openUntil: number;
  halfOpenProbeInFlight: boolean;
  activeRequests: number;
}

const circuitBreakers: Record<string, ProviderCircuitBreaker> = {
  OPENROUTER: { state: "CLOSED", consecutiveFailures: 0, openUntil: 0, halfOpenProbeInFlight: false, activeRequests: 0 },
  GEMINI_DIRECT: { state: "CLOSED", consecutiveFailures: 0, openUntil: 0, halfOpenProbeInFlight: false, activeRequests: 0 },
};

// Global Concurrency Control Semaphore State
let activeGlobalRequests = 0;
let adaptiveGlobalConcurrency = LLM_CONFIG.MAX_GLOBAL_CONCURRENCY;
let consecutiveCleanRequests = 0;
const waitingQueue: Array<() => void> = [];

// Latency tracking array for p95/p99 calculation
const latencyWindowMs: number[] = [];

// Global Observability Metrics
export const llmGatewayMetrics = {
  requestsTotal: 0,
  requestsActive: 0,
  requestsQueued: 0,
  http429Count: 0,
  http5xxCount: 0,
  retryCount: 0,
  providerFailovers: 0,
  avgLatencyMs: 0,
  p95LatencyMs: 0,
  p99LatencyMs: 0,
  get adaptiveConcurrencyCurrent() {
    return adaptiveGlobalConcurrency;
  },
  get circuitBreakers() {
    const now = Date.now();
    return Object.fromEntries(
      Object.entries(circuitBreakers).map(([name, cb]) => {
        let effectiveState = cb.state;
        if (cb.state === "OPEN" && now >= cb.openUntil) {
          effectiveState = "HALF_OPEN";
        }
        return [name, { state: effectiveState, consecutiveFailures: cb.consecutiveFailures, activeRequests: cb.activeRequests }];
      })
    );
  }
};

export function getLLMGatewayMetrics() {
  return {
    ...llmGatewayMetrics,
    requestsActive: activeGlobalRequests,
    requestsQueued: waitingQueue.length,
    circuitBreakers: llmGatewayMetrics.circuitBreakers,
  };
}

export function resetLLMGatewayState() {
  activeGlobalRequests = 0;
  waitingQueue.length = 0;
  adaptiveGlobalConcurrency = LLM_CONFIG.MAX_GLOBAL_CONCURRENCY;
  consecutiveCleanRequests = 0;
  latencyWindowMs.length = 0;
  llmGatewayMetrics.requestsTotal = 0;
  llmGatewayMetrics.http429Count = 0;
  llmGatewayMetrics.http5xxCount = 0;
  llmGatewayMetrics.retryCount = 0;
  llmGatewayMetrics.providerFailovers = 0;
  llmGatewayMetrics.avgLatencyMs = 0;
  llmGatewayMetrics.p95LatencyMs = 0;
  llmGatewayMetrics.p99LatencyMs = 0;

  for (const name in circuitBreakers) {
    circuitBreakers[name] = { state: "CLOSED", consecutiveFailures: 0, openUntil: 0, halfOpenProbeInFlight: false, activeRequests: 0 };
  }
}

// Concurrency Semaphore Acquire / Release
async function acquireGlobalSlot(): Promise<void> {
  const effectiveLimit = Math.max(1, Math.min(LLM_CONFIG.MAX_GLOBAL_CONCURRENCY, adaptiveGlobalConcurrency));
  if (activeGlobalRequests < effectiveLimit) {
    activeGlobalRequests++;
    return;
  }

  llmGatewayMetrics.requestsQueued++;
  await new Promise<void>((resolve) => {
    waitingQueue.push(resolve);
  });
  llmGatewayMetrics.requestsQueued = Math.max(0, llmGatewayMetrics.requestsQueued - 1);
  activeGlobalRequests++;
}

function releaseGlobalSlot(): void {
  activeGlobalRequests = Math.max(0, activeGlobalRequests - 1);
  const next = waitingQueue.shift();
  if (next) {
    next();
  }
}

// Circuit Breaker Helper Functions
function checkProviderAvailable(providerName: string): boolean {
  const cb = circuitBreakers[providerName];
  if (!cb) return true;
  const now = Date.now();

  if (cb.state === "OPEN") {
    if (now >= cb.openUntil) {
      cb.state = "HALF_OPEN";
      cb.halfOpenProbeInFlight = false;
      return true;
    }
    return false;
  }

  if (cb.state === "HALF_OPEN") {
    if (cb.halfOpenProbeInFlight) return false;
    cb.halfOpenProbeInFlight = true;
    return true;
  }

  return true;
}

function recordProviderSuccess(providerName: string) {
  const cb = circuitBreakers[providerName];
  if (!cb) return;
  cb.consecutiveFailures = 0;
  cb.state = "CLOSED";
  cb.halfOpenProbeInFlight = false;

  // Adaptive concurrency step-up
  consecutiveCleanRequests++;
  if (consecutiveCleanRequests >= 10 && adaptiveGlobalConcurrency < LLM_CONFIG.MAX_GLOBAL_CONCURRENCY) {
    adaptiveGlobalConcurrency = Math.min(LLM_CONFIG.MAX_GLOBAL_CONCURRENCY, adaptiveGlobalConcurrency + 1);
    consecutiveCleanRequests = 0;
  }
}

export function recordProviderFailure(providerName: string, statusCode?: number | string) {
  const cb = circuitBreakers[providerName];
  if (!cb) return;

  cb.consecutiveFailures++;
  consecutiveCleanRequests = 0;

  // Adaptive concurrency step-down on rate pressure
  if (statusCode === 429 || (typeof statusCode === "number" && statusCode >= 500)) {
    if (adaptiveGlobalConcurrency > 1) {
      adaptiveGlobalConcurrency--;
      console.log(`[LLM Gateway Scheduler] Adaptive concurrency stepped down to ${adaptiveGlobalConcurrency} due to rate/server pressure (${providerName} ${statusCode}).`);
    }
  }

  if (cb.consecutiveFailures >= 3 || cb.state === "HALF_OPEN") {
    cb.state = "OPEN";
    cb.openUntil = Date.now() + 20000; // 20s cooldown
    console.warn(`[LLM Gateway Circuit Breaker] Provider ${providerName} switched to OPEN (Throttled/Unavailable) for 20s due to ${cb.consecutiveFailures} failures.`);
  }
}

function updateLatencyStats(durationMs: number) {
  latencyWindowMs.push(durationMs);
  if (latencyWindowMs.length > 100) latencyWindowMs.shift();

  const sorted = [...latencyWindowMs].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  llmGatewayMetrics.avgLatencyMs = Math.round(sum / sorted.length);

  const p95Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  const p99Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99));
  llmGatewayMetrics.p95LatencyMs = sorted[p95Idx] || durationMs;
  llmGatewayMetrics.p99LatencyMs = sorted[p99Idx] || durationMs;
}

/**
 * Parses Retry-After header value in seconds or HTTP-date string
 */
function parseRetryAfter(headerValue?: string | null): number | null {
  if (!headerValue) return null;
  const num = parseInt(headerValue, 10);
  if (!isNaN(num) && num > 0) return num * 1000;

  const dateMs = Date.parse(headerValue);
  if (!isNaN(dateMs) && dateMs > Date.now()) return dateMs - Date.now();

  return null;
}

export async function executeLLMQuery(
  request: LLMGatewayRequest & { workspaceId?: string; documentId?: string; unitId?: string },
  apiKeyOverride?: string
): Promise<LLMGatewayResponse> {
  const startTime = Date.now();
  llmGatewayMetrics.requestsTotal++;

  // Acquire slot in global concurrency semaphore
  await acquireGlobalSlot();

  const providerAttemptHistory: Array<{ provider: string; model: string; status: number | string; durationMs: number; error?: string }> = [];
  let retryCount = 0;

  try {
    const openRouterKey = apiKeyOverride || process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
    const systemPrompt = request.systemInstruction || "You are an expert financial auditor, CPA, and forensic accountant.";

    // Provider Priority 1: OpenRouter (Claude / Gemini / GPT models)
    if (openRouterKey && openRouterKey.trim().length > 0 && checkProviderAvailable("OPENROUTER")) {
      const preferred = request.preferredModel && !request.preferredModel.includes("3.5-sonnet")
        ? request.preferredModel
        : "anthropic/claude-3.7-sonnet";

      const modelsToTry = [
        preferred,
        "google/gemini-2.5-flash",
        "anthropic/claude-3.7-sonnet",
        "anthropic/claude-3.5-sonnet",
        "openai/gpt-4o"
      ].filter((m, idx, self) => self.indexOf(m) === idx);

      for (const targetModel of modelsToTry) {
        if (!checkProviderAvailable("OPENROUTER")) {
          console.log(`[LLM Gateway Scheduler] OpenRouter circuit breaker is OPEN, bypassing model ${targetModel}.`);
          break;
        }

        let modelAttempt = 0;
        const maxRetries = LLM_CONFIG.MAX_RETRIES;

        while (modelAttempt <= maxRetries) {
          const callStart = Date.now();
          try {
            circuitBreakers.OPENROUTER.activeRequests++;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), LLM_CONFIG.REQUEST_TIMEOUT_MS);

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              signal: controller.signal,
              headers: {
                "Authorization": `Bearer ${openRouterKey.trim()}`,
                "HTTP-Referer": process.env.APP_URL || "https://ai.studio",
                "X-Title": "Eves Bookkeeping CPA Platform",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: targetModel,
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: request.prompt },
                ],
                temperature: request.temperature ?? 0.1,
                max_tokens: request.maxTokens ?? 4000,
                provider: {
                  allow_fallbacks: true,
                  data_collection: "deny"
                },
                ...(request.jsonSchemaFormat ? { response_format: { type: "json_object" } } : {})
              }),
            });

            clearTimeout(timeoutId);
            circuitBreakers.OPENROUTER.activeRequests = Math.max(0, circuitBreakers.OPENROUTER.activeRequests - 1);
            const callDuration = Date.now() - callStart;

            if (response.ok) {
              const data = await response.json();
              const content = data?.choices?.[0]?.message?.content || "";
              const promptTokens = data?.usage?.prompt_tokens || 0;
              const completionTokens = data?.usage?.completion_tokens || 0;

              if (content) {
                recordProviderSuccess("OPENROUTER");
                providerAttemptHistory.push({ provider: "OPENROUTER", model: targetModel, status: response.status, durationMs: callDuration });
                updateLatencyStats(Date.now() - startTime);

                return {
                  content,
                  modelUsed: targetModel,
                  provider: "OPENROUTER",
                  tokensUsed: { promptTokens, completionTokens },
                  executionTimeMs: Date.now() - startTime,
                  retryCount,
                  providerAttemptHistory,
                };
              }
            }

            // Handle Non-200 Responses
            const is429 = response.status === 429;
            const is5xx = response.status >= 500 && response.status < 600;

            if (is429) llmGatewayMetrics.http429Count++;
            if (is5xx) llmGatewayMetrics.http5xxCount++;

            providerAttemptHistory.push({ provider: "OPENROUTER", model: targetModel, status: response.status, durationMs: callDuration, error: `HTTP ${response.status}` });

            if ((is429 || is5xx) && modelAttempt < maxRetries) {
              retryCount++;
              llmGatewayMetrics.retryCount++;
              recordProviderFailure("OPENROUTER", response.status);

              const retryAfterMs = parseRetryAfter(response.headers.get("Retry-After"));
              const backoffMs = retryAfterMs ?? (Math.min(1000 * Math.pow(2, modelAttempt), 32000) + Math.floor(Math.random() * 1000));

              console.warn(`[LLM Gateway Scheduler] OpenRouter ${targetModel} HTTP ${response.status} (attempt ${modelAttempt + 1}/${maxRetries}). Waiting ${backoffMs}ms backoff...`);
              await sleep(backoffMs);
              modelAttempt++;
              continue;
            }

            recordProviderFailure("OPENROUTER", response.status);
            break; // Try next model or failover to Gemini
          } catch (err: any) {
            circuitBreakers.OPENROUTER.activeRequests = Math.max(0, circuitBreakers.OPENROUTER.activeRequests - 1);
            const callDuration = Date.now() - callStart;
            const errName = err?.name || "Error";

            providerAttemptHistory.push({ provider: "OPENROUTER", model: targetModel, status: errName, durationMs: callDuration, error: err?.message });

            if (modelAttempt < maxRetries) {
              retryCount++;
              llmGatewayMetrics.retryCount++;
              recordProviderFailure("OPENROUTER", errName);

              const backoffMs = Math.min(1000 * Math.pow(2, modelAttempt), 32000) + Math.floor(Math.random() * 1000);
              console.warn(`[LLM Gateway Scheduler] OpenRouter ${targetModel} fetch error '${err?.message}' (attempt ${modelAttempt + 1}/${maxRetries}). Backing off ${backoffMs}ms...`);
              await sleep(backoffMs);
              modelAttempt++;
              continue;
            }

            recordProviderFailure("OPENROUTER", errName);
            break;
          }
        }
      }
    }

    // Provider Priority 2: Native Gemini Direct API Failover
    if (process.env.GEMINI_API_KEY && checkProviderAvailable("GEMINI_DIRECT")) {
      llmGatewayMetrics.providerFailovers++;
      console.log(`[LLM Gateway Scheduler] Failover initiated -> Attempting Direct Native Gemini API...`);

      const geminiModels = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      const fullPrompt = `${systemPrompt}\n\nUSER REQUEST / INPUT DATA:\n${request.prompt}`;

      for (const modelName of geminiModels) {
        let modelAttempt = 0;
        const maxRetries = Math.min(3, LLM_CONFIG.MAX_RETRIES);

        while (modelAttempt <= maxRetries) {
          const callStart = Date.now();
          try {
            circuitBreakers.GEMINI_DIRECT.activeRequests++;

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Gemini API call timed out after ${LLM_CONFIG.REQUEST_TIMEOUT_MS}ms`)), LLM_CONFIG.REQUEST_TIMEOUT_MS)
            );

            const apiPromise = ai.models.generateContent({
              model: modelName,
              contents: fullPrompt,
              config: request.jsonSchemaFormat ? { responseMimeType: "application/json" } : undefined,
            });

            const response: any = await Promise.race([apiPromise, timeoutPromise]);
            circuitBreakers.GEMINI_DIRECT.activeRequests = Math.max(0, circuitBreakers.GEMINI_DIRECT.activeRequests - 1);
            const callDuration = Date.now() - callStart;

            const content = response.text || "";
            if (content) {
              recordProviderSuccess("GEMINI_DIRECT");
              providerAttemptHistory.push({ provider: "GEMINI_DIRECT", model: modelName, status: 200, durationMs: callDuration });
              updateLatencyStats(Date.now() - startTime);

              return {
                content,
                modelUsed: modelName,
                provider: "GEMINI_DIRECT",
                executionTimeMs: Date.now() - startTime,
                retryCount,
                providerAttemptHistory,
              };
            }
          } catch (err: any) {
            circuitBreakers.GEMINI_DIRECT.activeRequests = Math.max(0, circuitBreakers.GEMINI_DIRECT.activeRequests - 1);
            const callDuration = Date.now() - callStart;
            const is429 = err?.status === "RESOURCE_EXHAUSTED" || err?.code === 429 || (err?.message && err.message.includes("429"));
            if (is429) llmGatewayMetrics.http429Count++;

            providerAttemptHistory.push({ provider: "GEMINI_DIRECT", model: modelName, status: is429 ? 429 : "ERROR", durationMs: callDuration, error: err?.message });

            if (is429 && modelAttempt < maxRetries) {
              retryCount++;
              llmGatewayMetrics.retryCount++;
              recordProviderFailure("GEMINI_DIRECT", 429);

              const backoffMs = Math.min(1000 * Math.pow(2, modelAttempt), 16000) + Math.floor(Math.random() * 1000);
              console.warn(`[LLM Gateway Scheduler] Native Gemini ${modelName} 429 Rate Limit (attempt ${modelAttempt + 1}/${maxRetries}). Backing off ${backoffMs}ms...`);
              await sleep(backoffMs);
              modelAttempt++;
              continue;
            }

            recordProviderFailure("GEMINI_DIRECT", is429 ? 429 : "ERROR");
            break;
          }
        }
      }
    }

    // Final Deterministic Fallback
    updateLatencyStats(Date.now() - startTime);
    return {
      content: "",
      modelUsed: "none",
      provider: "FALLBACK_HEURISTIC",
      executionTimeMs: Date.now() - startTime,
      error: "All LLM providers throttled or unavailable.",
      retryCount,
      providerAttemptHistory,
    };
  } finally {
    releaseGlobalSlot();
  }
}

/**
 * Robustly parses JSON from LLM content string, stripping markdown blocks if needed
 */
export function parseLLMJsonResponse<T>(content: string): T | null {
  if (!content || !content.trim()) return null;
  try {
    let cleaned = content.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error("Failed to parse LLM JSON response:", err);
    return null;
  }
}
