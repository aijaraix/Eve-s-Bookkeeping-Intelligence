import { GoogleGenAI } from '@google/genai';
import {
  LocalTaskType,
  LocalTaskResult,
  RoutingLevel,
  ResolutionStatus,
  StatementTypeResult,
  EntityTypeResult,
  EntityScopeResult,
  StatementTypeClassificationInput,
  CanonicalRowMappingInput,
  EntityClassificationInput,
  TermMappingInput,
  DisclosureClassificationInput,
  NoteRelevanceInput,
  PeriodContextInput,
  CurrencyContextInput,
  AmbiguityTriageInput,
  EscalationDecisionInput,
  LocalIntelligenceTelemetry,
} from './localIntelligenceTypes.js';
import { learningRegistry } from './learningRegistry.js';

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export class LocalIntelligenceClient {
  private enabled: boolean;
  private baseUrl: string;
  private modelName: string;
  private timeoutMs: number;
  private maxConcurrency: number;
  private activeConcurrency = 0;
  private queue: Array<() => void> = [];

  // Diagnostic worker proxy support
  private workerProxyUrl: string;
  private publicFallbackUrl: string;

  private telemetry: LocalIntelligenceTelemetry = {
    deterministicTasks: 0,
    localAITasks: 0,
    localAIEscalated: 0,
    GeminiTasks: 0,
    localAIFailures: 0,
    totalLatencyMs: 0,
    averageLatencyMs: 0,
    tasksByType: {},
    activeConcurrency: 0,
  };

  constructor() {
    this.enabled = process.env.LOCAL_AI_ENABLED !== 'false';
    this.baseUrl = (process.env.LOCAL_AI_BASE_URL || 'http://eve-local-ai.zeabur.internal:11434').replace(/\/$/, '');
    this.modelName = process.env.LOCAL_AI_MODEL || 'qwen3.5:4b-q4_K_M';
    this.timeoutMs = parseInt(process.env.LOCAL_AI_TIMEOUT_MS || '45000', 10);
    this.maxConcurrency = parseInt(process.env.LOCAL_AI_MAX_CONCURRENCY || '1', 10);
    this.workerProxyUrl = (process.env.EXTRACTION_WORKER_URL || 'https://eves-worker.zeabur.app').replace(/\/$/, '');
    this.publicFallbackUrl = (process.env.LOCAL_AI_PUBLIC_URL || 'https://eves-local-ai.zeabur.app').replace(/\/$/, '');
  }

  /**
   * Preserve Deterministic Authority Guard:
   * Local Qwen must never directly approve:
   * financial normalization, scale multiplication, FX rates,
   * canonical winner promotion, accounting identity results,
   * audit readiness, or CPA opinion.
   */
  public static assertDeterministicAuthority(operation: string): void {
    const RESTRICTED_OPERATIONS = [
      'financial_normalization',
      'scale_multiplication',
      'fx_rates',
      'canonical_winner_promotion',
      'accounting_identity_results',
      'audit_readiness',
      'cpa_opinion',
    ];
    if (RESTRICTED_OPERATIONS.includes(operation.toLowerCase())) {
      throw new Error(`DeterministicAuthorityViolation: Operation '${operation}' is reserved strictly for deterministic production engines and cannot be approved by Local Qwen.`);
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(flag: boolean): void {
    this.enabled = flag;
  }

  public getTelemetry(): LocalIntelligenceTelemetry {
    return {
      ...this.telemetry,
      activeConcurrency: this.activeConcurrency,
    };
  }

  public async checkHealth(): Promise<{
    status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
    model: string;
    baseUrl: string;
    latencyMs?: number;
    details?: any;
  }> {
    const t0 = Date.now();
    const candidateUrls = [this.baseUrl];
    if (this.publicFallbackUrl && !candidateUrls.includes(this.publicFallbackUrl)) {
      candidateUrls.push(this.publicFallbackUrl);
    }

    for (const testUrl of candidateUrls) {
      try {
        // 1. Check native Ollama tags endpoint
        const resTags = await fetch(`${testUrl}/api/tags`, {
          signal: AbortSignal.timeout(4000),
        }).catch(() => null);

        if (resTags && resTags.ok) {
          const body = await resTags.json().catch(() => null);
          return {
            status: 'HEALTHY',
            model: this.modelName,
            baseUrl: testUrl,
            latencyMs: Date.now() - t0,
            details: body,
          };
        }

        // 2. Check OpenAI-compatible /v1/models endpoint
        const resModels = await fetch(`${testUrl}/v1/models`, {
          signal: AbortSignal.timeout(4000),
        }).catch(() => null);

        if (resModels && resModels.ok) {
          const body = await resModels.json().catch(() => null);
          return {
            status: 'HEALTHY',
            model: this.modelName,
            baseUrl: testUrl,
            latencyMs: Date.now() - t0,
            details: body,
          };
        }

        // 3. Check Ollama root endpoint
        const resRoot = await fetch(`${testUrl}/`, {
          signal: AbortSignal.timeout(3000),
        }).catch(() => null);

        if (resRoot && resRoot.ok) {
          const text = await resRoot.text().catch(() => '');
          if (text.includes('Ollama is running')) {
            return {
              status: 'HEALTHY',
              model: this.modelName,
              baseUrl: testUrl,
              latencyMs: Date.now() - t0,
              details: { message: text.trim() },
            };
          }
        }
      } catch {
        // Attempt next candidate URL
      }
    }

    try {
      // Check via worker proxy if direct candidate URLs fail
      if (this.workerProxyUrl) {
        const proxyRes = await fetch(`${this.workerProxyUrl}/api/worker/local-ai/status`, {
          signal: AbortSignal.timeout(5000),
        }).catch(() => null);

        if (proxyRes && proxyRes.ok) {
          const proxyData = await proxyRes.json();
          return {
            status: proxyData.status === 'HEALTHY' ? 'HEALTHY' : 'DEGRADED',
            model: proxyData.model || this.modelName,
            baseUrl: this.baseUrl,
            latencyMs: Date.now() - t0,
            details: proxyData,
          };
        }
      }

      return {
        status: 'OFFLINE',
        model: this.modelName,
        baseUrl: this.baseUrl,
        latencyMs: Date.now() - t0,
      };
    } catch (err: any) {
      return {
        status: 'OFFLINE',
        model: this.modelName,
        baseUrl: this.baseUrl,
        latencyMs: Date.now() - t0,
        details: { error: err.message },
      };
    }
  }

  private async acquireConcurrencySlot(): Promise<void> {
    if (this.activeConcurrency < this.maxConcurrency) {
      this.activeConcurrency++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.activeConcurrency++;
        resolve();
      });
    });
  }

  private releaseConcurrencySlot(): void {
    this.activeConcurrency = Math.max(0, this.activeConcurrency - 1);
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }

  private async escalateToGemini<T>(
    taskType: LocalTaskType,
    systemPrompt: string,
    userPrompt: string,
    parseAndValidate: (rawText: string) => { valid: boolean; value: T; confidence: number; reason?: string }
  ): Promise<{ success: boolean; value?: T; confidence?: number; rawOutput?: string; model?: string }> {
    const client = getGeminiClient();
    if (!client) return { success: false };

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    for (const model of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nSTRICT REQUIREMENT: Output valid JSON only matching the schema.\n\nTask Input:\n${userPrompt}` }] },
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.0,
          },
        });
        const text = response.text || '';
        const validation = parseAndValidate(text);
        if (validation.valid) {
          return {
            success: true,
            value: validation.value,
            confidence: Math.max(validation.confidence, 0.85),
            rawOutput: text,
            model,
          };
        }
      } catch (err) {
        // Continue to next available Gemini model
      }
    }
    return { success: false };
  }

  public async executeSemanticTask<T>(
    taskType: LocalTaskType,
    systemPrompt: string,
    userPrompt: string,
    parseAndValidate: (rawText: string) => { valid: boolean; value: T; confidence: number; reason?: string },
    deterministicFallback: () => T,
    isMaterial = false
  ): Promise<LocalTaskResult<T>> {
    const t0 = Date.now();
    this.telemetry.tasksByType[taskType] = (this.telemetry.tasksByType[taskType] || 0) + 1;

    // LEVEL 0: Deterministic Bypass / AI Disabled
    if (!this.enabled) {
      this.telemetry.deterministicTasks++;
      const val = deterministicFallback();
      return {
        taskType,
        success: true,
        value: val,
        confidence: 0.85,
        latencyMs: Date.now() - t0,
        model: 'DETERMINISTIC_RULES',
        source: 'DETERMINISTIC_FALLBACK',
        routingLevel: 0,
        resolutionStatus: 'RESOLVED_DETERMINISTIC',
      };
    }

    await this.acquireConcurrencySlot();

    try {
      // LEVEL 1: LOCAL QWEN3-4B
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const requestBody = {
        messages,
        temperature: 0.0,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      let response: Response | null = null;
      try {
        // Attempt direct call to local AI service (Zeabur private networking)
        response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } catch (directErr) {
        // If direct fetch fails (e.g. preview environment outside Zeabur private network),
        // try public fallback URL or eves-worker proxy
        if (this.publicFallbackUrl && this.publicFallbackUrl !== this.baseUrl) {
          try {
            response = await fetch(`${this.publicFallbackUrl}/v1/chat/completions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
            });
          } catch {
            response = null;
          }
        }

        if (!response && this.workerProxyUrl) {
          try {
            response = await fetch(`${this.workerProxyUrl}/api/worker/local-ai/predict`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ taskType, requestBody }),
              signal: controller.signal,
            });
          } catch (proxyErr) {
            response = null;
          }
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (response && response.ok) {
        const json = await response.json();
        let content = json.choices?.[0]?.message?.content?.trim() || '';
        
        // Support fallback extraction from reasoning_content if content field is blank
        if (!content && json.choices?.[0]?.message?.reasoning_content) {
          const reasoning = json.choices[0].message.reasoning_content;
          const jsonMatch = reasoning.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            content = jsonMatch[0];
          }
        }

        const usage = json.usage
          ? { prompt: json.usage.prompt_tokens, completion: json.usage.completion_tokens }
          : undefined;

        const validation = parseAndValidate(content);
        const latency = Date.now() - t0;

        if (validation.valid && validation.confidence >= 0.5) {
          this.telemetry.localAITasks++;
          this.telemetry.totalLatencyMs += latency;
          this.telemetry.averageLatencyMs = Math.round(this.telemetry.totalLatencyMs / this.telemetry.localAITasks);
          this.telemetry.lastTaskAt = new Date().toISOString();

          return {
            taskType,
            success: true,
            value: validation.value,
            confidence: validation.confidence,
            latencyMs: latency,
            model: this.modelName,
            source: 'LOCAL_QWEN',
            routingLevel: 1,
            resolutionStatus: 'RESOLVED_LOCAL_QWEN',
            tokensUsed: usage,
            rawOutput: content,
            escalationRequired: false,
          };
        }

        // Local Qwen returned low confidence or invalid schema -> ESCALATE
        this.telemetry.localAIEscalated++;
      } else {
        // Local Qwen call failed (unreachable or non-200) -> ESCALATE
        this.telemetry.localAIFailures++;
      }

      // =========================================================================
      // ESCALATION LADDER (NEVER SILENTLY RESOLVE UNRESOLVED AMBIGUITY AS DETERMINISTIC)
      // =========================================================================

      // LEVEL 2: GEMINI FLASH / APPROVED FREE OR LOW-COST CLOUD
      const geminiResult = await this.escalateToGemini(taskType, systemPrompt, userPrompt, parseAndValidate);
      if (geminiResult.success && geminiResult.value !== undefined) {
        this.telemetry.GeminiTasks++;
        learningRegistry.recordCase({
          taskType,
          inputSnapshot: { systemPrompt, userPrompt },
          localOutput: null,
          groundTruth: null, // Critical: Cloud model output CANNOT self-label as ground truth
          groundTruthSource: null,
          decision: 'ESCALATED',
          confidence: geminiResult.confidence ?? 0.85,
          failureMode: 'LOCAL_AI_ESCALATED_TO_GEMINI',
          auditNotes: `Resolved via Level 2 Cloud Escalation (${geminiResult.model}). Case remains OPEN per GroundTruth rule.`,
        });

        return {
          taskType,
          success: true,
          value: geminiResult.value,
          confidence: geminiResult.confidence ?? 0.85,
          latencyMs: Date.now() - t0,
          model: geminiResult.model || 'gemini-flash',
          source: 'CLOUD_ESCALATION',
          routingLevel: 2,
          resolutionStatus: 'RESOLVED_GEMINI',
          rawOutput: geminiResult.rawOutput,
          escalationRequired: false,
        };
      }

      // LEVEL 3: PREMIUM CLOUD MODEL ONLY IF EXPLICITLY AUTHORIZED
      const allowPaid = process.env.ALLOW_PAID_PROVIDER_FALLBACK === 'true';
      if (allowPaid) {
        // If explicitly authorized, premium fallback would execute here
      }

      // LEVEL 4: CPA REVIEW / AMBIGUITY QUEUE (FAIL-SAFE ESCALATION)
      // Never silently complete an unresolved semantic task as deterministic-only!
      const finalLatency = Date.now() - t0;
      learningRegistry.recordCase({
        taskType,
        inputSnapshot: { systemPrompt, userPrompt },
        localOutput: null,
        groundTruth: null,
        groundTruthSource: null,
        decision: 'ESCALATED',
        confidence: 0,
        failureMode: 'LOCAL_AND_CLOUD_UNAVAILABLE',
        auditNotes: 'Local AI failed/low confidence and cloud unavailable. Case remains OPEN for CPA review.',
      });

      const fallbackVal = deterministicFallback();
      return {
        taskType,
        success: false,
        value: fallbackVal,
        confidence: 0.5,
        latencyMs: finalLatency,
        model: 'CPA_REVIEW_REQUIRED',
        source: 'UNRESOLVED_ESCALATED',
        routingLevel: 4,
        resolutionStatus: isMaterial ? 'REVIEW_REQUIRED' : 'WAITING_FOR_AI_CAPACITY',
        escalationRequired: true,
        escalationReason: 'LOCAL_AI_LOW_CONFIDENCE_AND_CLOUD_UNAVAILABLE',
      };
    } catch (err: any) {
      this.telemetry.localAIFailures++;
      const latency = Date.now() - t0;

      // Attempt Gemini escalation even after exception
      const geminiResult = await this.escalateToGemini(taskType, systemPrompt, userPrompt, parseAndValidate);
      if (geminiResult.success && geminiResult.value !== undefined) {
        this.telemetry.GeminiTasks++;
        return {
          taskType,
          success: true,
          value: geminiResult.value,
          confidence: geminiResult.confidence ?? 0.85,
          latencyMs: latency,
          model: geminiResult.model || 'gemini-flash',
          source: 'CLOUD_ESCALATION',
          routingLevel: 2,
          resolutionStatus: 'RESOLVED_GEMINI',
          rawOutput: geminiResult.rawOutput,
          escalationRequired: false,
        };
      }

      learningRegistry.recordCase({
        taskType,
        inputSnapshot: { systemPrompt, userPrompt },
        localOutput: null,
        groundTruth: null,
        groundTruthSource: null,
        decision: 'ESCALATED',
        confidence: 0,
        failureMode: err.name === 'AbortError' ? 'TIMEOUT' : `ERROR: ${err.message}`,
        auditNotes: 'Fell back to CPA review due to local AI exception and cloud unavailability. Case remains OPEN.',
      });

      const fallbackVal = deterministicFallback();
      return {
        taskType,
        success: false,
        value: fallbackVal,
        confidence: 0.5,
        latencyMs: latency,
        model: 'CPA_REVIEW_REQUIRED',
        source: 'UNRESOLVED_ESCALATED',
        routingLevel: 4,
        resolutionStatus: isMaterial ? 'REVIEW_REQUIRED' : 'WAITING_FOR_AI_CAPACITY',
        escalationRequired: true,
        escalationReason: `LOCAL_AI_EXCEPTION: ${err.message}`,
      };
    } finally {
      this.releaseConcurrencySlot();
    }
  }

  // TASK 1: STATEMENT_TYPE_CLASSIFICATION
  public async classifyStatementType(input: StatementTypeClassificationInput): Promise<LocalTaskResult<StatementTypeResult>> {
    const sys = `You are a certified lead CPA classifier. Classify the financial statement type.
Strictly return JSON: {"statementType": "INCOME_STATEMENT" | "BALANCE_SHEET" | "CASH_FLOW_STATEMENT" | "CHANGES_IN_EQUITY" | "NOTES_AND_DISCLOSURES" | "UNKNOWN", "confidence": 0.0-1.0, "justification": string}`;
    const user = `Document: ${input.documentTitle || 'Financial Report'}
Sample line items:
${input.sampleRows.slice(0, 15).join('\n')}`;

    return this.executeSemanticTask<StatementTypeResult>(
      'STATEMENT_TYPE_CLASSIFICATION',
      sys,
      user,
      (raw) => {
        try {
          const parsed = JSON.parse(raw);
          const validTypes: StatementTypeResult[] = [
            'INCOME_STATEMENT',
            'BALANCE_SHEET',
            'CASH_FLOW_STATEMENT',
            'CHANGES_IN_EQUITY',
            'NOTES_AND_DISCLOSURES',
            'UNKNOWN',
          ];
          if (validTypes.includes(parsed.statementType)) {
            return { valid: true, value: parsed.statementType, confidence: parsed.confidence || 0.9 };
          }
        } catch (_) {}
        return { valid: false, value: 'UNKNOWN', confidence: 0 };
      },
      () => {
        const rowsStr = input.sampleRows.join(' ').toLowerCase();
        if (/revenue|turnover|cost of sales|gross profit|operating profit|net income/i.test(rowsStr)) return 'INCOME_STATEMENT';
        if (/total assets|current assets|liabilities|shareholders' equity|cash and cash equivalents/i.test(rowsStr)) return 'BALANCE_SHEET';
        if (/operating activities|investing activities|financing activities|net cash flows/i.test(rowsStr)) return 'CASH_FLOW_STATEMENT';
        if (/retained earnings|share capital|treasury shares|dividends paid/i.test(rowsStr)) return 'CHANGES_IN_EQUITY';
        return 'UNKNOWN';
      }
    );
  }

  // TASK 2: CANONICAL_ROW_MAPPING
  public async mapCanonicalRow(input: CanonicalRowMappingInput): Promise<LocalTaskResult<string>> {
    const sys = `You are an expert CPA mapping line items to standardized GAAP/IFRS canonical tags.
Common canonical tags: REVENUE, COST_OF_GOODS_SOLD, GROSS_PROFIT, OPERATING_EXPENSES, OPERATING_INCOME, PRE_TAX_INCOME, INCOME_TAX, NET_INCOME, CASH_AND_EQUIVALENTS, ACCOUNTS_RECEIVABLE, INVENTORIES, TOTAL_CURRENT_ASSETS, PROPERTY_PLANT_EQUIPMENT, GOODWILL, INTANGIBLE_ASSETS, TOTAL_ASSETS, ACCOUNTS_PAYABLE, CURRENT_DEBT, TOTAL_CURRENT_LIABILITIES, LONG_TERM_DEBT, TOTAL_LIABILITIES, SHARE_CAPITAL, RETAINED_EARNINGS, TOTAL_EQUITY, OPERATING_CASH_FLOW, INVESTING_CASH_FLOW, FINANCING_CASH_FLOW.
Strictly return JSON: {"canonicalTag": string, "confidence": 0.0-1.0}`;
    const user = `Line Item: "${input.rawRowLabel}"
Statement Type: ${input.statementType || 'GENERAL'}
Surrounding items: ${(input.surroundingRows || []).slice(0, 5).join(', ')}`;

    return this.executeSemanticTask<string>(
      'CANONICAL_ROW_MAPPING',
      sys,
      user,
      (raw) => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.canonicalTag && typeof parsed.canonicalTag === 'string') {
            return {
              valid: true,
              value: parsed.canonicalTag.toUpperCase().replace(/\s+/g, '_'),
              confidence: parsed.confidence || 0.85,
            };
          }
        } catch (_) {}
        return { valid: false, value: 'UNKNOWN_LINE_ITEM', confidence: 0 };
      },
      () => {
        const l = input.rawRowLabel.toLowerCase().trim();
        if (/turnover|revenue|sales/i.test(l)) return 'REVENUE';
        if (/cost of sales|cost of goods/i.test(l)) return 'COST_OF_GOODS_SOLD';
        if (/gross profit|gross margin/i.test(l)) return 'GROSS_PROFIT';
        if (/operating profit|operating income|ebit\b/i.test(l)) return 'OPERATING_INCOME';
        if (/net profit|net income|profit for the year|profit for the period/i.test(l)) return 'NET_INCOME';
        if (/total assets/i.test(l)) return 'TOTAL_ASSETS';
        if (/total liabilities/i.test(l)) return 'TOTAL_LIABILITIES';
        if (/total equity/i.test(l)) return 'TOTAL_EQUITY';
        if (/cash and cash equivalents/i.test(l)) return 'CASH_AND_EQUIVALENTS';
        return l.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      }
    );
  }

  // TASK 3: ENTITY_TYPE_CLASSIFICATION
  public async classifyEntityType(input: EntityClassificationInput): Promise<LocalTaskResult<EntityTypeResult>> {
    const sys = `You are a forensic corporate structure auditor. Classify the entity type.
Allowed types: "CORPORATION" | "SUBSIDIARY" | "JOINT_VENTURE" | "ASSOCIATE" | "AUDIT_FIRM" | "REGULATOR" | "FINANCIAL_INSTITUTION" | "INDIVIDUAL" | "UNKNOWN".
Strictly return JSON: {"entityType": string, "confidence": 0.0-1.0}`;
    const user = `Entity Name: "${input.entityName}"
Context: ${input.contextSnippet || input.documentTitle || 'Annual Report'}`;

    return this.executeSemanticTask<EntityTypeResult>(
      'ENTITY_TYPE_CLASSIFICATION',
      sys,
      user,
      (raw) => {
        try {
          const parsed = JSON.parse(raw);
          const valid: EntityTypeResult[] = [
            'CORPORATION',
            'SUBSIDIARY',
            'JOINT_VENTURE',
            'ASSOCIATE',
            'AUDIT_FIRM',
            'REGULATOR',
            'FINANCIAL_INSTITUTION',
            'INDIVIDUAL',
            'UNKNOWN',
          ];
          if (valid.includes(parsed.entityType)) {
            return { valid: true, value: parsed.entityType, confidence: parsed.confidence || 0.9 };
          }
        } catch (_) {}
        return { valid: false, value: 'UNKNOWN', confidence: 0 };
      },
      () => {
        const n = input.entityName.toLowerCase();
        if (/pwc|pricewaterhousecoopers|kpmg|deloitte|ernst & young|ey\b|bdo|grant thornton/i.test(n)) return 'AUDIT_FIRM';
        if (/sec\b|securities and exchange|finra|fca\b|esma|bafin/i.test(n)) return 'REGULATOR';
        if (/bank|jpmorgan|goldman|barclays|hsbc|bnp/i.test(n)) return 'FINANCIAL_INSTITUTION';
        if (/plc|ag|se|corp|inc|gmbh|sa|nv|ltd|limited/i.test(n)) return 'CORPORATION';
        return 'UNKNOWN';
      }
    );
  }

  // TASK 4: ENTITY_SCOPE_CLASSIFICATION
  public async classifyEntityScope(input: EntityClassificationInput): Promise<LocalTaskResult<EntityScopeResult>> {
    const sys = `Classify if the entity is the primary parent reporting entity, a consolidated subsidiary, or an external party.
Allowed values: "PARENT_REPORTING_ENTITY" | "CONSOLIDATED_SUBSIDIARY" | "EQUITY_ACCOUNTED_INVESTEE" | "EXTERNAL_PARTY" | "DISCONTINUED_OPERATION" | "UNKNOWN".
Strictly return JSON: {"entityScope": string, "confidence": 0.0-1.0}`;
    const user = `Entity Name: "${input.entityName}"
Document Title: ${input.documentTitle || ''}
Context: ${input.contextSnippet || ''}`;

    return this.executeSemanticTask<EntityScopeResult>(
      'ENTITY_SCOPE_CLASSIFICATION',
      sys,
      user,
      (raw) => {
        try {
          const parsed = JSON.parse(raw);
          const valid: EntityScopeResult[] = [
            'PARENT_REPORTING_ENTITY',
            'CONSOLIDATED_SUBSIDIARY',
            'EQUITY_ACCOUNTED_INVESTEE',
            'EXTERNAL_PARTY',
            'DISCONTINUED_OPERATION',
            'UNKNOWN',
          ];
          if (valid.includes(parsed.entityScope)) {
            return { valid: true, value: parsed.entityScope, confidence: parsed.confidence || 0.9 };
          }
        } catch (_) {}
        return { valid: false, value: 'UNKNOWN', confidence: 0 };
      },
      () => {
        const n = input.entityName.toLowerCase();
        const doc = (input.documentTitle || '').toLowerCase();
        if (/pwc|kpmg|deloitte|ernst & young|ey\b|sec|fca|auditor/i.test(n)) return 'EXTERNAL_PARTY';
        if (doc && (doc.includes(n) || n.includes(doc.replace(/annual report|financial statement/g, '').trim()))) {
          return 'PARENT_REPORTING_ENTITY';
        }
        return 'CONSOLIDATED_SUBSIDIARY';
      }
    );
  }

  // TASK 5: MULTILINGUAL_ACCOUNTING_TERM_MAPPING
  public async mapMultilingualAccountingTerm(input: TermMappingInput): Promise<LocalTaskResult<string>> {
    const sys = `You are a multilingual financial accounting translator. Translate foreign accounting terms (German, French, Spanish, Italian, Dutch, Chinese, Japanese) to standard English IFRS/GAAP terms.
Strictly return JSON: {"englishStandardTerm": string, "confidence": 0.0-1.0}`;
    const user = `Term: "${input.foreignTerm}"
Source Language: ${input.sourceLanguage || 'Auto'}
Standard: ${input.targetStandard || 'IFRS'}`;

    return this.executeSemanticTask<string>(
      'MULTILINGUAL_ACCOUNTING_TERM_MAPPING',
      sys,
      user,
      (raw) => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.englishStandardTerm) {
            return { valid: true, value: parsed.englishStandardTerm, confidence: parsed.confidence || 0.9 };
          }
        } catch (_) {}
        return { valid: false, value: input.foreignTerm, confidence: 0 };
      },
      () => {
        const t = input.foreignTerm.toLowerCase().trim();
        const dict: Record<string, string> = {
          umsatzerlöse: 'Revenue',
          bilanzsumme: 'Total Assets',
          jahresüberschuss: 'Net Income',
          eigenkapital: 'Total Equity',
          verbindlichkeiten: 'Liabilities',
          aktiva: 'Assets',
          passiva: 'Equity and Liabilities',
          "chiffre d'affaires": 'Revenue',
          'résultat net': 'Net Income',
          ingresos: 'Revenue',
          'beneficio neto': 'Net Income',
          attivo: 'Assets',
          passivo: 'Liabilities',
          fatturato: 'Revenue',
        };
        return dict[t] || input.foreignTerm;
      }
    );
  }

  // TASK 6: DISCLOSURE_TYPE_CLASSIFICATION
  public async classifyDisclosureType(input: DisclosureClassificationInput): Promise<LocalTaskResult<string>> {
    const sys = `Classify the accounting note or disclosure into standard IFRS/GAAP disclosure categories.
Examples: BASIS_OF_PREPARATION, SIGNIFICANT_ACCOUNTING_POLICIES, SEGMENT_REPORTING, REVENUE_RECOGNITION, FINANCIAL_INSTRUMENTS_RISK, PENSION_OBLIGATIONS, CONTINGENT_LIABILITIES, RELATED_PARTY_TRANSACTIONS, SUBSEQUENT_EVENTS, LEASES, INCOME_TAXES.
Strictly return JSON: {"disclosureCategory": string, "confidence": 0.0-1.0}`;
    const user = `Heading: "${input.heading}"
Excerpt: "${input.excerpt.slice(0, 300)}"`;

    return this.executeSemanticTask<string>(
      'DISCLOSURE_TYPE_CLASSIFICATION',
      sys,
      user,
      (raw) => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.disclosureCategory) {
            return { valid: true, value: parsed.disclosureCategory, confidence: parsed.confidence || 0.85 };
          }
        } catch (_) {}
        return { valid: false, value: 'GENERAL_DISCLOSURE', confidence: 0 };
      },
      () => {
        const h = (input.heading + ' ' + input.excerpt).toLowerCase();
        if (/basis of preparation|accounting policies/i.test(h)) return 'BASIS_OF_PREPARATION';
        if (/segment/i.test(h)) return 'SEGMENT_REPORTING';
        if (/pension|retirement|employee benefits/i.test(h)) return 'PENSION_OBLIGATIONS';
        if (/tax|deferred tax/i.test(h)) return 'INCOME_TAXES';
        if (/lease/i.test(h)) return 'LEASES';
        if (/related part/i.test(h)) return 'RELATED_PARTY_TRANSACTIONS';
        if (/subsequent event/i.test(h)) return 'SUBSEQUENT_EVENTS';
        return 'GENERAL_DISCLOSURE';
      }
    );
  }

  // TASK 7: NOTE_RELEVANCE
  public async evaluateNoteRelevance(input: NoteRelevanceInput): Promise<LocalTaskResult<{ relevant: boolean; relevanceScore: number; reason: string }>> {
    const sys = `Evaluate if a disclosure note is relevant to a specific financial area.
Strictly return JSON: {"relevant": boolean, "relevanceScore": 0.0-1.0, "reason": string}`;
    const user = `Target Area: ${input.targetFinancialArea}
Note Title: ${input.noteTitle}
Excerpt: ${input.noteExcerpt.slice(0, 400)}`;

    return this.executeSemanticTask<{ relevant: boolean; relevanceScore: number; reason: string }>(
      'NOTE_RELEVANCE',
      sys,
      user,
      (raw) => {
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed.relevant === 'boolean') {
            return {
              valid: true,
              value: {
                relevant: parsed.relevant,
                relevanceScore: parsed.relevanceScore || (parsed.relevant ? 0.9 : 0.1),
                reason: parsed.reason || 'Semantic match',
              },
              confidence: 0.9,
            };
          }
        } catch (_) {}
        return { valid: false, value: { relevant: false, relevanceScore: 0, reason: 'Invalid response' }, confidence: 0 };
      },
      () => {
        const text = (input.noteTitle + ' ' + input.noteExcerpt).toLowerCase();
        const target = input.targetFinancialArea.toLowerCase();
        const words = target.split(/\s+/).filter(w => w.length > 3);
        const match = words.some(w => text.includes(w));
        return {
          relevant: match,
          relevanceScore: match ? 0.85 : 0.15,
          reason: match ? 'Deterministic keyword match' : 'No keyword overlap',
        };
      }
    );
  }

  // TASK 8: PERIOD_CONTEXT_CLASSIFICATION
  public async classifyPeriodContext(input: PeriodContextInput): Promise<LocalTaskResult<{
    periodType: 'ANNUAL' | 'QUARTERLY' | 'INTERIM' | 'POINT_IN_TIME';
    year: number;
    description: string;
  }>> {
    const sys = `Classify financial period headers.
Strictly return JSON: {"periodType": "ANNUAL" | "QUARTERLY" | "INTERIM" | "POINT_IN_TIME", "year": number, "description": string, "confidence": 0.0-1.0}`;
    const user = `Header string: "${input.rawPeriodString}"
Context: ${input.contextHeader || ''}`;

    return this.executeSemanticTask<{ periodType: 'ANNUAL' | 'QUARTERLY' | 'INTERIM' | 'POINT_IN_TIME'; year: number; description: string }>(
      'PERIOD_CONTEXT_CLASSIFICATION',
      sys,
      user,
      (raw) => {
        try {
          const parsed = JSON.parse(raw);
          if (['ANNUAL', 'QUARTERLY', 'INTERIM', 'POINT_IN_TIME'].includes(parsed.periodType)) {
            return {
              valid: true,
              value: {
                periodType: parsed.periodType,
                year: Number(parsed.year) || new Date().getFullYear(),
                description: parsed.description || input.rawPeriodString,
              },
              confidence: parsed.confidence || 0.9,
            };
          }
        } catch (_) {}
        return { valid: false, value: { periodType: 'ANNUAL', year: 2024, description: input.rawPeriodString }, confidence: 0 };
      },
      () => {
        const s = input.rawPeriodString;
        const yearMatch = s.match(/20\d\d/);
        const year = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();
        let periodType: 'ANNUAL' | 'QUARTERLY' | 'INTERIM' | 'POINT_IN_TIME' = 'ANNUAL';
        if (/q[1-4]|first quarter|second quarter|third quarter|fourth quarter/i.test(s)) periodType = 'QUARTERLY';
        else if (/as at|as of|at 31 december/i.test(s)) periodType = 'POINT_IN_TIME';
        else if (/half year|interim|6 months/i.test(s)) periodType = 'INTERIM';
        return { periodType, year, description: s };
      }
    );
  }

  // TASK 9: CURRENCY_CONTEXT_CLASSIFICATION
  public async classifyCurrencyContext(input: CurrencyContextInput): Promise<LocalTaskResult<{
    currencyCode: string;
    scaleMultiplier: number;
    symbol: string;
  }>> {
    const sys = `Parse currency symbol and magnitude scale from financial headers.
Allowed currencies: ISO 4217 (EUR, USD, GBP, JPY, CHF, CAD, AUD, etc.).
Magnitude scales: 1 (units), 1000 (thousands), 1000000 (millions), 1000000000 (billions).
Strictly return JSON: {"currencyCode": string, "scaleMultiplier": number, "symbol": string, "confidence": 0.0-1.0}`;
    const user = `Text: "${input.rawCurrencyString}"
Jurisdiction: ${input.documentJurisdiction || ''}`;

    return this.executeSemanticTask<{ currencyCode: string; scaleMultiplier: number; symbol: string }>(
      'CURRENCY_CONTEXT_CLASSIFICATION',
      sys,
      user,
      (raw) => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.currencyCode && typeof parsed.scaleMultiplier === 'number') {
            return {
              valid: true,
              value: {
                currencyCode: parsed.currencyCode.toUpperCase(),
                scaleMultiplier: parsed.scaleMultiplier,
                symbol: parsed.symbol || parsed.currencyCode,
              },
              confidence: parsed.confidence || 0.9,
            };
          }
        } catch (_) {}
        return { valid: false, value: { currencyCode: 'EUR', scaleMultiplier: 1000000, symbol: '€' }, confidence: 0 };
      },
      () => {
        const s = input.rawCurrencyString.toLowerCase();
        let currencyCode = 'EUR';
        let symbol = '€';
        if (s.includes('$') || s.includes('usd') || s.includes('dollar')) {
          currencyCode = 'USD';
          symbol = '$';
        } else if (s.includes('£') || s.includes('gbp') || s.includes('pound')) {
          currencyCode = 'GBP';
          symbol = '£';
        } else if (s.includes('chf')) {
          currencyCode = 'CHF';
          symbol = 'CHF';
        }

        let scaleMultiplier = 1;
        if (s.includes('billion') || s.includes('bn') || s.includes('mrd')) scaleMultiplier = 1000000000;
        else if (s.includes('million') || s.includes('mn') || s.includes('mio') || s.includes('m€') || s.includes('$m')) scaleMultiplier = 1000000;
        else if (s.includes('thousand') || s.includes('k€') || s.includes('$k') || s.includes("'000")) scaleMultiplier = 1000;

        return { currencyCode, scaleMultiplier, symbol };
      }
    );
  }

  // TASK 10: AMBIGUITY_TRIAGE
  public async triageAmbiguity(input: AmbiguityTriageInput): Promise<LocalTaskResult<{
    action: 'LOCAL_RESOLVE' | 'ESCALATE_CLOUD' | 'REQUIRE_CPA_REVIEW';
    resolvedValue?: string | number;
    justification: string;
  }>> {
    const sys = `You are a Lead CPA auditor triaging conflicting financial figures.
If the discrepancy is small rounding or clearly one value is restated in later period, recommend LOCAL_RESOLVE.
If numbers differ significantly without obvious explanation, recommend ESCALATE_CLOUD or REQUIRE_CPA_REVIEW.
Strictly return JSON: {"action": "LOCAL_RESOLVE" | "ESCALATE_CLOUD" | "REQUIRE_CPA_REVIEW", "resolvedValue"?: string | number, "justification": string, "confidence": 0.0-1.0}`;
    const user = `Issue: ${input.issueDescription}
Competing values: ${JSON.stringify(input.competingValues)}
Context: ${input.statementContext || ''}`;

    return this.executeSemanticTask<{ action: 'LOCAL_RESOLVE' | 'ESCALATE_CLOUD' | 'REQUIRE_CPA_REVIEW'; resolvedValue?: string | number; justification: string }>(
      'AMBIGUITY_TRIAGE',
      sys,
      user,
      (raw) => {
        try {
          const parsed = JSON.parse(raw);
          if (['LOCAL_RESOLVE', 'ESCALATE_CLOUD', 'REQUIRE_CPA_REVIEW'].includes(parsed.action)) {
            return {
              valid: true,
              value: {
                action: parsed.action,
                resolvedValue: parsed.resolvedValue,
                justification: parsed.justification || 'Analyzed discrepancy',
              },
              confidence: parsed.confidence || 0.85,
            };
          }
        } catch (_) {}
        return { valid: false, value: { action: 'ESCALATE_CLOUD', justification: 'Parse failed' }, confidence: 0 };
      },
      () => {
        return {
          action: 'ESCALATE_CLOUD',
          justification: 'Deterministic fail-closed rule: conflicting figures require cloud or CPA escalation',
        };
      }
    );
  }

  // TASK 11: AI_ESCALATION_DECISION
  public async evaluateEscalationDecision(input: EscalationDecisionInput): Promise<LocalTaskResult<{
    shouldEscalate: boolean;
    escalateTo: 'LEVEL_2_GEMINI_FLASH' | 'LEVEL_3_PREMIUM_REASONING' | 'LEVEL_4_CPA_REVIEW' | 'NONE';
    reason: string;
  }>> {
    const sys = `Determine if a financial analysis task requires escalation.
Strictly return JSON: {"shouldEscalate": boolean, "escalateTo": "LEVEL_2_GEMINI_FLASH" | "LEVEL_3_PREMIUM_REASONING" | "LEVEL_4_CPA_REVIEW" | "NONE", "reason": string, "confidence": 0.0-1.0}`;
    const user = `Task: ${input.task}
Confidence: ${input.confidence}
Discrepancy: ${input.discrepancyAmount ?? 'N/A'}
Threshold: ${input.materialityThreshold ?? 'N/A'}
Trigger: ${input.reason}`;

    return this.executeSemanticTask<{ shouldEscalate: boolean; escalateTo: 'LEVEL_2_GEMINI_FLASH' | 'LEVEL_3_PREMIUM_REASONING' | 'LEVEL_4_CPA_REVIEW' | 'NONE'; reason: string }>(
      'AI_ESCALATION_DECISION',
      sys,
      user,
      (raw) => {
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed.shouldEscalate === 'boolean') {
            return {
              valid: true,
              value: {
                shouldEscalate: parsed.shouldEscalate,
                escalateTo: parsed.escalateTo || (parsed.shouldEscalate ? 'LEVEL_2_GEMINI_FLASH' : 'NONE'),
                reason: parsed.reason || 'Escalation rules evaluated',
              },
              confidence: parsed.confidence || 0.9,
            };
          }
        } catch (_) {}
        return { valid: false, value: { shouldEscalate: true, escalateTo: 'LEVEL_2_GEMINI_FLASH', reason: 'Parse failure' }, confidence: 0 };
      },
      () => {
        const shouldEscalate = input.confidence < 0.85 || Boolean(input.discrepancyAmount && input.materialityThreshold && input.discrepancyAmount > input.materialityThreshold);
        return {
          shouldEscalate,
          escalateTo: shouldEscalate ? 'LEVEL_2_GEMINI_FLASH' : 'NONE',
          reason: shouldEscalate ? 'Confidence below safe threshold or discrepancy exceeds materiality' : 'Task passed local confidence gate',
        };
      }
    );
  }
}

export const localIntelligenceClient = new LocalIntelligenceClient();
