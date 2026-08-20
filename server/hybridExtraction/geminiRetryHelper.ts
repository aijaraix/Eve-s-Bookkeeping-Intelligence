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

  // Get task routing profile candidates from Model Discovery Service
  let modelsToTry = modelDiscoveryService.getCandidateModelsForTask(taskType, {
    requiresPdf: containsPdf,
    requiresStructuredOutput: options.requiresStructuredOutput ?? true
  });

  if (options.model && !modelsToTry.includes(options.model)) {
    const rec = modelDiscoveryService.getModelRecord(options.model);
    if (rec && rec.available && rec.healthState !== 'UNAVAILABLE_CONFIGURATION') {
      modelsToTry.unshift(options.model);
    }
  }

  if (options.fallbackModels && options.fallbackModels.length > 0) {
    for (const fb of options.fallbackModels) {
      if (!modelsToTry.includes(fb)) {
        const rec = modelDiscoveryService.getModelRecord(fb);
        if (rec && rec.available && rec.healthState !== 'UNAVAILABLE_CONFIGURATION') {
          modelsToTry.push(fb);
        }
      }
    }
  }

  // Ensure unique models list
  modelsToTry = Array.from(new Set(modelsToTry));
  if (modelsToTry.length === 0) {
    // Default safe candidate pool if all profile candidates filtered out
    modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
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
        const { errorType, httpCode, retryAfterMs } = modelDiscoveryService.classifyProviderError(err);
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
            status: httpCode || 'ERROR',
            errorType,
            httpCode,
            retryAfterMs,
            resultCommitted: false
          });
        }

        // Specification 6: MODEL_NOT_FOUND (404) -> Immediately stop retrying on current model and try next candidate!
        if (errorType === 'MODEL_NOT_FOUND') {
          console.warn(`[GeminiRetryHelper] Model ${currentModel} returned 404 MODEL_NOT_FOUND. Bypassing retries on ${currentModel} and rotating model.`);
          break; // Break inner loop to try next model in outer loop
        }

        // Specification 10: DAILY_QUOTA_EXHAUSTED -> Immediately break and throw capacity error
        if (errorType === 'DAILY_QUOTA_EXHAUSTED') {
          console.warn(`[GeminiRetryHelper] Daily quota exhausted on ${currentModel}. Halting retries.`);
          const dailyError: any = new Error("Daily Gemini API quota exhausted. Task queued for available daily capacity.");
          dailyError.isDailyQuotaError = true;
          dailyError.errorType = 'DAILY_QUOTA_EXHAUSTED';
          throw dailyError;
        }

        const isRetriable = errorType === 'SERVICE_UNAVAILABLE' || errorType === 'RPM_LIMIT' || errorType === 'TPM_LIMIT' || errorType === 'REQUEST_TIMEOUT' || errorType === 'NETWORK_ERROR';

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

  // Formatting clean capacity error
  const rawMsg = lastError?.message || String(lastError);
  let cleanMsg = "AI capacity temporarily limited. Your work is safely saved and will resume automatically.";
  if (lastErrorType === 'SERVICE_UNAVAILABLE') {
    cleanMsg = "Gemini service temporarily experiencing high demand (503). Retrying automatically.";
  } else if (lastErrorType === 'RPM_LIMIT' || lastErrorType === 'TPM_LIMIT') {
    cleanMsg = "AI capacity temporarily limited. Processing will resume automatically.";
  }

  const customError: any = new Error(cleanMsg);
  customError.isCapacityError = true;
  customError.errorType = lastErrorType || 'UNKNOWN_PROVIDER_ERROR';
  customError.rawError = lastError;
  throw customError;
}

