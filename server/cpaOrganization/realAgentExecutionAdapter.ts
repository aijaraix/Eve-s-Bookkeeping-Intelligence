/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — REAL AGENT EXECUTION ADAPTER (PACKAGE B2.1 / DOC 35)
 * 
 * Physical Model / Agent Execution Adapter.
 * Bridges specialist roles to authentic model/tool runtimes (CPAModelRouter / Gemini / Ollama).
 * 
 * Core Mandates:
 * 1. REAL_AI_AGENT must mean physical model/agent execution, returning an authentic execution receipt.
 * 2. No modelExecutionId => no REAL_MODEL_INFERENCE claim.
 * 3. Execution mechanism is DERIVED from execution receipt, not assigned by role definition.
 * 4. Model failure remains failure (MODEL_UNAVAILABLE / RATE_LIMITED / TIMEOUT) - fail-closed.
 * 5. Logical agent names (ATHENA, CLARA) are separate from physical provider model names (e.g. gemini-2.5-flash).
 * 6. Cost provenance reports NOT_REPORTED unless physically measured.
 * 7. Pluggable test adapter allows strict behavioral testing without circularity.
 */

import crypto from 'crypto';
import { cpaModelRouter, RouterDecision, ModelExecutionRecord } from './cpaModelRouter.js';
import { OutputValidationStatus } from './agentOutputContractValidator.js';

export type ModelCallStatus =
  | 'CALL_SUCCESS'
  | 'MODEL_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'TOOL_FAILURE'
  | 'CALL_FAILED'
  | 'NOT_INVOKED';

export interface RealAgentExecutionRequest {
  taskId: string;
  agentId: 'HERMES' | 'ATHENA' | 'CLARA' | 'LEXICON' | 'QUINN' | string;
  taskType:
    | 'EQUATION_TIE_OUT'
    | 'SCALE_DETECTION'
    | 'FX_NORMALIZATION'
    | 'TABLE_CLASSIFICATION'
    | 'ENTITY_MAPPING'
    | 'TEXT_SUMMARIZATION'
    | 'COMPLEX_POLICY_ANALYSIS'
    | 'DISPUTED_DISCREPANCY'
    | string;
  systemPrompt?: string;
  userPrompt?: string;
  contextComplexity?: 'LOW' | 'MEDIUM' | 'HIGH';
  purpose?: string;
  engagementId?: string;
  inputObjectReferences?: string[];
  contextData?: Record<string, any>;
  promptTemplateVersion?: string;
}

export interface RealAgentExecutionReceipt {
  routingDecisionId: string;
  modelExecutionId: string;
  provider: string;
  actualModel: string;
  agentId: string;
  executionStartedAt: string;
  executionCompletedAt: string;
  latencyMs: number;
  rawModelResponseRef?: string;
  rawModelResponseHash?: string;
  parsedOutput: Record<string, any> | null;
  promptTemplateVersion?: string;
  toolCalls?: Array<{ toolName: string; args: any; result?: any }>;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  costUsd?: number;
  costMeasurement: 'MEASURED' | 'ESTIMATED' | 'NOT_REPORTED';
  fallbackState: 'NONE' | 'PRIMARY_SUCCESS' | 'MODEL_FALLBACK' | 'UNAVAILABLE';
  executionStatus:
    | 'SUCCESS'
    | 'MODEL_UNAVAILABLE'
    | 'RATE_LIMITED'
    | 'TIMEOUT'
    | 'TOOL_FAILURE'
    | 'INVALID_MODEL_OUTPUT'
    | 'BLOCKED';
  modelCallStatus?: ModelCallStatus;
  outputValidationStatus?: OutputValidationStatus;
  outputValidationErrors?: string[];
  error?: string;
}

export type RealAgentAdapterFn = (
  request: RealAgentExecutionRequest
) => Promise<RealAgentExecutionReceipt>;

export class RealAgentExecutionAdapter {
  private static instance: RealAgentExecutionAdapter | null = null;
  private testAdapter: RealAgentAdapterFn | null = null;
  private invocationHistory: RealAgentExecutionRequest[] = [];

  private constructor() {}

  public static getInstance(): RealAgentExecutionAdapter {
    if (!RealAgentExecutionAdapter.instance) {
      RealAgentExecutionAdapter.instance = new RealAgentExecutionAdapter();
    }
    return RealAgentExecutionAdapter.instance;
  }

  /**
   * Injects a controlled test adapter for behavioral verification.
   */
  public setTestAdapter(adapter: RealAgentAdapterFn | null): void {
    this.testAdapter = adapter;
  }

  public getInvocationHistory(): RealAgentExecutionRequest[] {
    return [...this.invocationHistory];
  }

  public clearInvocationHistory(): void {
    this.invocationHistory = [];
  }

  /**
   * Physical model / agent execution routine.
   * Routes through CPAModelRouter (or injected test adapter) and produces a verifiable receipt.
   */
  public async executeRealAgentWork(
    request: RealAgentExecutionRequest
  ): Promise<RealAgentExecutionReceipt> {
    this.invocationHistory.push({ ...request });

    // If an injected test adapter is present, invoke it directly
    if (this.testAdapter) {
      return await this.testAdapter(request);
    }

    // Default: Route through canonical CPAModelRouter
    const tStart = Date.now();
    const reqStartedAt = new Date().toISOString();

    try {
      const result = await cpaModelRouter.executeTask({
        taskId: request.taskId,
        taskType: (request.taskType as any) || 'COMPLEX_POLICY_ANALYSIS',
        systemPrompt: request.systemPrompt,
        userPrompt: request.userPrompt,
        contextComplexity: request.contextComplexity || 'HIGH',
        purpose: request.purpose || `Real agent execution for ${request.agentId}`,
        engagementId: request.engagementId
      });

      const latencyMs = Math.max(1, Date.now() - tStart);
      const reqCompletedAt = new Date().toISOString();
      const { decision, execution, outputText } = result;

      // If model router failed or was unavailable, fail closed without local synthesis
      if (execution.executionStatus === 'MODEL_UNAVAILABLE' || !execution.success) {
        return {
          routingDecisionId: decision.taskId,
          modelExecutionId: '', // Fail-closed: No valid modelExecutionId on failure
          provider: 'google',
          actualModel: execution.actualModel || 'UNKNOWN',
          agentId: request.agentId,
          executionStartedAt: reqStartedAt,
          executionCompletedAt: reqCompletedAt,
          latencyMs,
          parsedOutput: null,
          promptTemplateVersion: request.promptTemplateVersion || '2026.1',
          costMeasurement: 'NOT_REPORTED',
          costUsd: 0,
          fallbackState: 'UNAVAILABLE',
          executionStatus: 'MODEL_UNAVAILABLE',
          modelCallStatus: 'MODEL_UNAVAILABLE',
          outputValidationStatus: 'NOT_APPLICABLE',
          error: execution.fallbackReason || 'Model runtime unavailable or unconfigured'
        };
      }

      // Model succeeded: parse response safely
      let parsedJson: Record<string, any> | null = null;
      try {
        parsedJson = JSON.parse(outputText);
      } catch {
        parsedJson = { textResponse: outputText };
      }

      const rawHash = crypto.createHash('sha256').update(outputText || '').digest('hex');

      return {
        routingDecisionId: decision.taskId,
        modelExecutionId: execution.executionId,
        provider: decision.selectedTier === 'LEVEL_1_LOCAL_QWEN' ? 'ollama' : 'google',
        actualModel: execution.actualModel || decision.selectedModel,
        agentId: request.agentId,
        executionStartedAt: reqStartedAt,
        executionCompletedAt: reqCompletedAt,
        latencyMs,
        rawModelResponseRef: `ref-model-out-${execution.executionId}`,
        rawModelResponseHash: rawHash,
        parsedOutput: parsedJson,
        promptTemplateVersion: request.promptTemplateVersion || '2026.1',
        toolCalls: [],
        usage: execution.tokensUsed
          ? {
              promptTokens: execution.tokensUsed.promptTokens,
              completionTokens: execution.tokensUsed.completionTokens,
              totalTokens:
                (execution.tokensUsed.promptTokens || 0) +
                (execution.tokensUsed.completionTokens || 0)
            }
          : undefined,
        costUsd: execution.costUsd,
        costMeasurement: execution.costUsd > 0 ? 'ESTIMATED' : 'NOT_REPORTED',
        fallbackState: execution.fallback ? 'MODEL_FALLBACK' : 'PRIMARY_SUCCESS',
        executionStatus: 'SUCCESS',
        modelCallStatus: 'CALL_SUCCESS',
        outputValidationStatus: 'PENDING'
      };
    } catch (err: any) {
      const reqCompletedAt = new Date().toISOString();
      return {
        routingDecisionId: request.taskId,
        modelExecutionId: '',
        provider: 'unknown',
        actualModel: 'UNKNOWN',
        agentId: request.agentId,
        executionStartedAt: reqStartedAt,
        executionCompletedAt: reqCompletedAt,
        latencyMs: Math.max(1, Date.now() - tStart),
        parsedOutput: null,
        promptTemplateVersion: request.promptTemplateVersion || '2026.1',
        costMeasurement: 'NOT_REPORTED',
        costUsd: 0,
        fallbackState: 'UNAVAILABLE',
        executionStatus: 'MODEL_UNAVAILABLE',
        modelCallStatus: 'CALL_FAILED',
        outputValidationStatus: 'NOT_APPLICABLE',
        error: err.message
      };
    }
  }

  /**
   * Helper to create a verifiable test adapter receipt for tests.
   */
  public createTestReceipt(params: {
    agentId: string;
    modelExecutionId: string;
    actualModel?: string;
    provider?: string;
    parsedOutput?: Record<string, any>;
    executionStatus?: RealAgentExecutionReceipt['executionStatus'];
    modelCallStatus?: ModelCallStatus;
    outputValidationStatus?: OutputValidationStatus;
    outputValidationErrors?: string[];
    error?: string;
    costUsd?: number;
    costMeasurement?: 'MEASURED' | 'ESTIMATED' | 'NOT_REPORTED';
  }): RealAgentExecutionReceipt {
    const now = new Date().toISOString();
    const executionStatus = params.executionStatus || 'SUCCESS';
    const modelCallStatus = params.modelCallStatus || (executionStatus === 'MODEL_UNAVAILABLE' ? 'MODEL_UNAVAILABLE' : 'CALL_SUCCESS');
    return {
      routingDecisionId: `decision-${Date.now()}`,
      modelExecutionId: params.modelExecutionId,
      provider: params.provider || 'injected_test_provider',
      actualModel: params.actualModel || 'test-real-model-v1',
      agentId: params.agentId,
      executionStartedAt: now,
      executionCompletedAt: now,
      latencyMs: 42,
      rawModelResponseRef: `ref-test-${params.modelExecutionId}`,
      rawModelResponseHash: crypto.createHash('sha256').update(JSON.stringify(params.parsedOutput || {})).digest('hex'),
      parsedOutput: params.parsedOutput || { status: 'PROCESSED' },
      promptTemplateVersion: '2026.1',
      toolCalls: [],
      costUsd: params.costUsd ?? 0,
      costMeasurement: params.costMeasurement || (params.costUsd !== undefined && params.costUsd > 0 ? 'MEASURED' : 'NOT_REPORTED'),
      fallbackState: 'PRIMARY_SUCCESS',
      executionStatus,
      modelCallStatus,
      outputValidationStatus: params.outputValidationStatus || 'PENDING',
      outputValidationErrors: params.outputValidationErrors,
      error: params.error
    };
  }
}

export const realAgentExecutionAdapter = RealAgentExecutionAdapter.getInstance();

export async function executeRealAgentWork(
  request: RealAgentExecutionRequest
): Promise<RealAgentExecutionReceipt> {
  return await realAgentExecutionAdapter.executeRealAgentWork(request);
}

/**
 * Derives execution mechanism from authentic receipt.
 * Strict Invariant: No valid modelExecutionId => NEVER return REAL_MODEL_INFERENCE.
 */
export function deriveExecutionMechanism(receipt: {
  modelExecutionId?: string;
  executionStatus?: string;
  isDeterministic?: boolean;
  isOrchestratorDispatch?: boolean;
}): 'REAL_MODEL_INFERENCE' | 'DETERMINISTIC_SPECIALIST_ENGINE' | 'ORCHESTRATOR_DISPATCH' | 'HEURISTIC_EVALUATION' {
  if (
    receipt.modelExecutionId &&
    receipt.modelExecutionId.trim().length > 0 &&
    receipt.executionStatus === 'SUCCESS'
  ) {
    return 'REAL_MODEL_INFERENCE';
  }
  if (receipt.isDeterministic) {
    return 'DETERMINISTIC_SPECIALIST_ENGINE';
  }
  if (receipt.isOrchestratorDispatch) {
    return 'ORCHESTRATOR_DISPATCH';
  }
  return 'HEURISTIC_EVALUATION';
}
