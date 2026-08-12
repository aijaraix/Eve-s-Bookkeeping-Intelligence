import { GoogleGenAI } from "@google/genai";
import { LLMGatewayRequest, LLMGatewayResponse } from "../src/types.js";

// Helper for delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes an LLM query adhering to priority routing:
 * 1. Native Gemini API (if available for high-speed primary extraction)
 * 2. OpenRouter Claude 3.5 Sonnet / Claude 3.7 Sonnet (for complex audit reasoning)
 * 3. OpenRouter GPT-4o / GPT-4o-mini
 * 4. OpenRouter Gemini / DeepSeek fallbacks
 */
export async function executeLLMQuery(
  request: LLMGatewayRequest,
  apiKeyOverride?: string
): Promise<LLMGatewayResponse> {
  const startTime = Date.now();
  const openRouterKey = apiKeyOverride || process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;

  const systemPrompt = request.systemInstruction || "You are an expert financial auditor, CPA, and forensic accountant.";

  // Priority 1: OpenRouter Claude Sonnet (Claude 3.7 / Claude 3.5 Sonnet) if OPENROUTER_API_KEY is configured
  if (openRouterKey && openRouterKey.trim().length > 0) {
    const preferred = request.preferredModel && !request.preferredModel.includes("3.5-sonnet") 
      ? request.preferredModel 
      : "anthropic/claude-3.7-sonnet";
    const modelsToTry = [
      preferred,
      "anthropic/claude-3.7-sonnet",
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o",
      "google/gemini-2.5-flash",
      "google/gemini-2.0-flash-001"
    ].filter((m, idx, self) => self.indexOf(m) === idx); // unique deduplication

    for (const targetModel of modelsToTry) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
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

        if (!response.ok) {
          console.log(`[LLM Gateway] OpenRouter ${targetModel} HTTP ${response.status} -> trying fallback`);
          continue;
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content || "";
        const promptTokens = data?.usage?.prompt_tokens || 0;
        const completionTokens = data?.usage?.completion_tokens || 0;

        if (content) {
          return {
            content,
            modelUsed: targetModel,
            provider: "OPENROUTER",
            tokensUsed: { promptTokens, completionTokens },
            executionTimeMs: Date.now() - startTime,
          };
        }
      } catch (err: any) {
        console.log(`[LLM Gateway] OpenRouter ${targetModel} skipped`);
      }
    }
  }

  // Priority 2: Native Gemini API if GEMINI_API_KEY is configured
  if (process.env.GEMINI_API_KEY) {
    const geminiModels = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    const fullPrompt = `${systemPrompt}\n\nUSER REQUEST / INPUT DATA:\n${request.prompt}`;

    for (const modelName of geminiModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: fullPrompt,
          config: request.jsonSchemaFormat
            ? { responseMimeType: "application/json" }
            : undefined,
        });

        const content = response.text || "";
        if (content) {
          return {
            content,
            modelUsed: modelName,
            provider: "GEMINI_DIRECT",
            executionTimeMs: Date.now() - startTime,
          };
        }
      } catch (err: any) {
        const is429 = err?.status === "RESOURCE_EXHAUSTED" || err?.code === 429 || (err?.message && err.message.includes("429"));
        console.log(`[LLM Gateway] Native Gemini ${modelName} ${is429 ? "(429 Rate Limit Exceeded)" : "bypassed"} -> trying next option`);
      }
    }
  }

  // Final Heuristic Fallback
  return {
    content: "",
    modelUsed: "none",
    provider: "FALLBACK_HEURISTIC",
    executionTimeMs: Date.now() - startTime,
    error: "No LLM provider available or valid API key configured.",
  };
}

/**
 * Robustly parses JSON from LLM content string, stripping markdown blocks if needed
 */
export function parseLLMJsonResponse<T>(content: string): T | null {
  if (!content || !content.trim()) return null;
  try {
    // Clean markdown code fence if present
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
