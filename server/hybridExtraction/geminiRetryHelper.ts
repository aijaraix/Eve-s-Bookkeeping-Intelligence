import { GoogleGenAI } from '@google/genai';
import { modelDiscoveryService, RoutingTaskType, ProviderErrorType } from '../modelDiscoveryService.js';

export interface GeminiRetryOptions {
  model?: string;
  taskType?: RoutingTaskType;
  contents: any[];
  config?: any;
  maxAttempts?: number;
  initialDelayMs?: number;
  fallbackModels?: string[];
  requiresPdf?: boolean;
  requiresStructuredOutput?: boolean;
  taskId?: string;
  onRetry?: (attempt: number, errorMsg: string, delayMs: number) => void;
  /**
   * Optional deterministic output gate. It runs before a provider call is
   * recorded as successful or resultCommitted=true. Throwing rejects the
   * response and rotates/retries through the canonical model policy.
   */
  validateResponse?: (response: any, model: string) => void;
}

export async function executeWithGeminiRetry(
  aiClient: GoogleGenAI,
  options: GeminiRetryOptions
): Promise<any> {
  const maxAttempts = options.maxAttempts || 3;
  let delayMs = options.initialDelayMs || 1500;
  const taskType = options.taskType || 'GENERAL_PROMPT';

  // Check if PDF input is included in contents
  const containsPdf = options.requiresPdf || options.contents.some((c: any) =>
    c?.fileData?.mimeType === 'application/pdf' ||
    c?.inlineData?.mimeType === 'application/pdf'
  );

  // Get task routing profile candidates from Model Discovery Service.
  // IMPORTANT: routing/circuit state is authoritative. Do not silently
  // resurrect a circuit-open model just because it is named in a static
  // profile or passed as the preferred model.
  const routedCandidates = modelDiscoveryService.getCandidateModelsForTask(taskType, {
    requiresPdf: containsPdf,
    requiresStructuredOutput: options.requiresStructuredOutput ?? true
  });

  const supportsTask = (modelId: string): boolean => {
    const rec = modelDiscoveryService.getModelRecord(modelId);
    if (!rec || !rec.available) return false;
    if (rec.healthState === 'UNAVAILABLE_CONFIGURATION' || rec.healthState === 'UNAVAILABLE_QUOTA') return false;
    if (rec.circuitState === 'OPEN') return false;
    if (containsPdf && !rec.pdfSupport) return false;
    if ((options.requiresStructuredOutput ?? true) && !rec.structuredOutputSupport) return false;
    return true;
  };

  const isHealthyClosed = (modelId: string): boolean => {
    const rec = modelDiscoveryService.getModelRecord(modelId);
    return !!rec && supportsTask(modelId) && rec.healthState === 'HEALTHY' && rec.circuitState === 'CLOSED';
  };

  let modelsToTry: string[] = [];

  // Preserve configured profile priority for models that are currently healthy.
  for (const modelId of routedCandidates) {
    if (isHealthyClosed(modelId)) modelsToTry.push(modelId);
  }

  // Append healthy, stable, free-tier models discovered at runtime. This lets
  // newly available Gemini models participate without a code deploy while
  // preserving FREE_FIRST policy and PDF/structured-output requirements.
  for (const row of modelDiscoveryService.getDiscoveredModelsTable()) {
    const modelId = row.configuredModel;
    const rec = modelDiscoveryService.getModelRecord(modelId);
    if (!rec) continue;
    if (!rec.freeTierEligible || rec.classification !== 'STABLE') continue;
    if (!isHealthyClosed(modelId)) continue;
    if (!modelsToTry.includes(modelId)) modelsToTry.push(modelId);
  }

  // A preferred model is a preference, not permission to bypass a circuit.
  if (options.model && supportsTask(options.model) && !modelsToTry.includes(options.model)) {
    if (isHealthyClosed(options.model)) {
      modelsToTry.unshift(options.model);
    } else {
      modelsToTry.push(options.model);
    }
  }

  if (options.fallbackModels && options.fallbackModels.length > 0) {
    for (const fb of options.fallbackModels) {
      if (supportsTask(fb) && !modelsToTry.includes(fb)) {
        modelsToTry.push(fb);
      }
    }
  }

  // Half-open/recovery candidates from the configured task profile come last,
  // after any known healthy closed model.
  for (const modelId of routedCandidates) {
    if (supportsTask(modelId) && !modelsToTry.includes(modelId)) {
      modelsToTry.push(modelId);
    }
  }

  modelsToTry = Array.from(new Set(modelsToTry));
  if (modelsToTry.length === 0) {
    const noModelError: any = new Error(`No eligible Gemini models are currently available for ${taskType}. Waiting for circuit recovery or provider capacity.`);
    noModelError.isCapacityError = true;
    noModelError.errorType = 'RATE_LIMIT_SHORT_TERM';
    noModelError.httpCode = 429;
    noModelError.retryAfterMs = 20000;
    throw noModelError;
  }

  let lastError: any = null;
  let lastErrorType: ProviderErrorType | null = null;
  let attemptNumber = 0;

  for (let modelIdx = 0; modelIdx < modelsToTry.length; modelIdx++) {
    const currentModel = modelsToTry[modelIdx];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      attemptNumber++;
      const startTime = new Date().toISOString();
      const callStart = Date.now();

      try {
        console.log(`[GeminiRetryHelper] Executing task ${taskType} on model ${currentModel} (Attempt ${attempt}/${maxAttempts})...`);
        const response = await aiClient.models.generateContent({
          model: currentModel,
          contents: options.contents,
          config: options.config
        });

        // MODEL CALL SUCCESS != VALID AGENT OUTPUT.
        // Validate before recording provider/model success or committing an attempt.
        if (options.validateResponse) {
          options.validateResponse(response, currentModel);
        }

        const latencyMs = Date.now() - callStart;
        modelDiscoveryService.recordModelSuccess(currentModel);

        if (options.taskId) {
          modelDiscoveryService.logTaskAttempt(options.taskId, {
            attemptNumber,
            model: currentModel,
            provider: 'Google Gemini Native API',
            startTime,
            endTime: new Date().toISOString(),
            latencyMs,
            status: 200,
            resultCommitted: true
          });
        }

        return response;
      } catch (err: any) {
        lastError = err;
        const latencyMs = Date.now() - callStart;
        const isStructuredOutputError = !!err?.isStructuredOutputError;
        const classified = isStructuredOutputError
          ? { errorType: 'UNKNOWN_PROVIDER_ERROR' as ProviderErrorType, httpCode: 200, retryAfterMs: err?.retryAfterMs || 5000 }
          : modelDiscoveryService.classifyProviderError(err);
        const { errorType, httpCode, retryAfterMs } = classified;
        lastErrorType = errorType;

        modelDiscoveryService.recordModelFailure(currentModel, err, httpCode);

        if (options.taskId) {
          modelDiscoveryService.logTaskAttempt(options.taskId, {
            attemptNumber,
            model: currentModel,
            provider: 'Google Gemini Native API',
            startTime,
            endTime: new Date().toISOString(),
            latencyMs,
            status: isStructuredOutputError ? 'INVALID_STRUCTURED_OUTPUT' : (httpCode || 'ERROR'),
            errorType,
            httpCode,
            retryAfterMs,
            resultCommitted: false
          });
        }

        // Invalid/truncated structured output is never canonical. Rotate models
        // immediately instead of repeating the same deterministic malformed result.
        if (isStructuredOutputError) {
          console.warn(`[GeminiRetryHelper] ${currentModel} returned invalid structured output for ${taskType}. Rotating model without committing result.`);
          break;
        }

        // Specification 6: MODEL_NOT_FOUND (404) -> Immediately stop retrying on current model and try next candidate!
        if (errorType === 'MODEL_NOT_FOUND') {
          console.warn(`[GeminiRetryHelper] Model ${currentModel} returned 404 MODEL_NOT_FOUND. Bypassing retries on ${currentModel} and rotating model.`);
          break;
        }

        // Specification 10: DAILY_QUOTA_EXHAUSTED -> Immediately break and throw capacity error
        if (errorType === 'DAILY_QUOTA_EXHAUSTED') {
          console.warn(`[GeminiRetryHelper] Daily quota exhausted on ${currentModel}. Halting retries.`);
          const dailyError: any = new Error("Daily Gemini API quota exhausted. Task queued for available daily capacity.");
          dailyError.isDailyQuotaError = true;
          dailyError.errorType = 'DAILY_QUOTA_EXHAUSTED';
          dailyError.retryAfterMs = retryAfterMs;
          dailyError.httpCode = httpCode || 429;
          throw dailyError;
        }

        const isRetriable = errorType === 'SERVICE_UNAVAILABLE' || errorType === 'RATE_LIMIT_SHORT_TERM' || errorType === 'TOKEN_RATE_LIMIT' || errorType === 'RPM_LIMIT' || errorType === 'TPM_LIMIT' || errorType === 'REQUEST_TIMEOUT' || errorType === 'NETWORK_ERROR';

        if (isRetriable && attempt < maxAttempts) {
          const waitTimeMs = retryAfterMs || delayMs;
          console.warn(`[GeminiRetryHelper] Transient ${errorType} on ${currentModel} (attempt ${attempt}/${maxAttempts}). Waiting ${waitTimeMs}ms...`);
          if (options.onRetry) {
            options.onRetry(attempt, err?.message || String(err), waitTimeMs);
          }
          await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
          delayMs = Math.min(20000, Math.round(delayMs * 1.5));
        } else {
          // If max attempts reached on this model or non-retriable, break inner loop to try next model
          break;
        }
      }
    }
  }

  const parsedErr = lastError?.isStructuredOutputError
    ? { retryAfterMs: lastError?.retryAfterMs || 10000, httpCode: 200 }
    : modelDiscoveryService.classifyProviderError(lastError);

  let cleanMsg = "AI capacity temporarily limited. Your work is safely saved. Processing will resume automatically.";
  if (lastError?.isStructuredOutputError) {
    cleanMsg = "AI returned incomplete or invalid structured output. No result was committed. Processing will retry automatically.";
  } else if (lastErrorType === 'SERVICE_UNAVAILABLE') {
    cleanMsg = "Gemini service temporarily experiencing high demand (503). Retrying automatically.";
  } else if (lastErrorType === 'RATE_LIMIT_SHORT_TERM' || lastErrorType === 'TOKEN_RATE_LIMIT' || lastErrorType === 'RPM_LIMIT' || lastErrorType === 'TPM_LIMIT') {
    cleanMsg = "AI capacity temporarily limited. Processing will resume automatically.";
  }

  const customError: any = new Error(cleanMsg);
  // Keep the existing queue's durable retry path, while preserving the more
  // precise structured-output flag for observability and later policy upgrades.
  customError.isCapacityError = true;
  customError.isStructuredOutputError = !!lastError?.isStructuredOutputError;
  customError.errorType = lastError?.isStructuredOutputError ? 'STRUCTURED_OUTPUT_INVALID' : (lastErrorType || 'UNKNOWN_PROVIDER_ERROR');
  customError.retryAfterMs = parsedErr.retryAfterMs;
  customError.httpCode = parsedErr.httpCode;
  customError.rawError = lastError;
  throw customError;
}