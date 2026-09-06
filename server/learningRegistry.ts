import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { LocalTaskType } from './localIntelligenceTypes.js';

export type GroundTruthSource =
  | 'PRIMARY_SOURCE_VERIFIED'
  | 'DETERMINISTIC_ACCOUNTING_PROOF'
  | 'SEALED_BENCHMARK'
  | 'CPA_APPROVED'
  | 'AUTHORITATIVE_CANONICAL_RESOLUTION';

export const ALLOWED_GROUND_TRUTH_SOURCES: readonly GroundTruthSource[] = [
  'PRIMARY_SOURCE_VERIFIED',
  'DETERMINISTIC_ACCOUNTING_PROOF',
  'SEALED_BENCHMARK',
  'CPA_APPROVED',
  'AUTHORITATIVE_CANONICAL_RESOLUTION',
] as const;

export type DisallowedGroundTruthSource =
  | 'LOCAL_MODEL_SELF_LABEL'
  | 'CLOUD_MODEL_SELF_LABEL'
  | 'UNVERIFIED_CANONICAL_GUESS';

export interface LearningCase {
  caseId: string;
  taskType: LocalTaskType;
  inputSnapshot: any;
  localOutput: any;
  groundTruth: any | null;
  groundTruthSource: GroundTruthSource | null;
  caseStatus: 'OPEN' | 'RESOLVED';
  decision: 'ACCEPTED' | 'ESCALATED' | 'OVERRIDDEN' | 'REJECTED';
  confidence: number;
  failureMode?: string;
  sourceDocument?: string;
  extractedFacts?: any[];
  auditNotes?: string;
  timestamp: string;
}

export interface LearningRegistryMetrics {
  totalCases: number;
  acceptedCount: number;
  escalatedCount: number;
  overriddenCount: number;
  openCasesCount: number;
  resolvedCasesCount: number;
  casesByTaskType: Record<string, number>;
  lastRecordedAt?: string;
}

export class LearningCaseRegistry {
  private cases: LearningCase[] = [];
  private storagePath: string;

  constructor() {
    const storageDir = path.join(process.cwd(), 'storage');
    if (!fs.existsSync(storageDir)) {
      try {
        fs.mkdirSync(storageDir, { recursive: true });
      } catch (err) {
        // ignore in readonly env
      }
    }
    this.storagePath = path.join(storageDir, 'learning_cases.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf8');
        this.cases = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[LearningRegistry] Could not load persisted cases:', err);
    }
  }

  private persistToDisk(): void {
    try {
      fs.writeFileSync(this.storagePath, JSON.stringify(this.cases.slice(-1000), null, 2), 'utf8');
    } catch (err) {
      // safe fallback if disk write fails
    }
  }

  public recordCase(entry: {
    taskType: LocalTaskType;
    inputSnapshot: any;
    localOutput: any;
    groundTruth?: any;
    groundTruthSource?: GroundTruthSource | null;
    decision: 'ACCEPTED' | 'ESCALATED' | 'OVERRIDDEN' | 'REJECTED';
    confidence: number;
    failureMode?: string;
    sourceDocument?: string;
    extractedFacts?: any[];
    auditNotes?: string;
  }): LearningCase {
    const caseId = `case-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // Enforce Rule: groundTruth may ONLY be populated from an independently verified resolution source
    let validatedGroundTruth: any | null = null;
    let validatedSource: GroundTruthSource | null = null;
    let status: 'OPEN' | 'RESOLVED' = 'OPEN';

    if (
      entry.groundTruthSource &&
      ALLOWED_GROUND_TRUTH_SOURCES.includes(entry.groundTruthSource as GroundTruthSource) &&
      entry.groundTruth !== undefined &&
      entry.groundTruth !== null
    ) {
      validatedGroundTruth = entry.groundTruth;
      validatedSource = entry.groundTruthSource as GroundTruthSource;
      status = 'RESOLVED';
    } else {
      validatedGroundTruth = null;
      validatedSource = null;
      status = 'OPEN';
    }

    const newCase: LearningCase = {
      caseId,
      timestamp: new Date().toISOString(),
      taskType: entry.taskType,
      inputSnapshot: entry.inputSnapshot,
      localOutput: entry.localOutput,
      groundTruth: validatedGroundTruth,
      groundTruthSource: validatedSource,
      caseStatus: status,
      decision: entry.decision,
      confidence: entry.confidence,
      failureMode: entry.failureMode,
      sourceDocument: entry.sourceDocument,
      extractedFacts: entry.extractedFacts,
      auditNotes: entry.auditNotes,
    };

    this.cases.push(newCase);
    if (this.cases.length > 2000) {
      this.cases = this.cases.slice(-2000); // Ring buffer protection
    }

    this.persistToDisk();
    return newCase;
  }

  public getCases(limit = 100, taskType?: LocalTaskType): LearningCase[] {
    let filtered = this.cases;
    if (taskType) {
      filtered = filtered.filter(c => c.taskType === taskType);
    }
    return filtered.slice(-limit).reverse();
  }

  public getMetrics(): LearningRegistryMetrics {
    const metrics: LearningRegistryMetrics = {
      totalCases: this.cases.length,
      acceptedCount: 0,
      escalatedCount: 0,
      overriddenCount: 0,
      openCasesCount: 0,
      resolvedCasesCount: 0,
      casesByTaskType: {},
      lastRecordedAt: this.cases.length > 0 ? this.cases[this.cases.length - 1].timestamp : undefined,
    };

    for (const c of this.cases) {
      if (c.decision === 'ACCEPTED') metrics.acceptedCount++;
      if (c.decision === 'ESCALATED') metrics.escalatedCount++;
      if (c.decision === 'OVERRIDDEN') metrics.overriddenCount++;
      if (c.caseStatus === 'RESOLVED') {
        metrics.resolvedCasesCount++;
      } else {
        metrics.openCasesCount++;
      }
      metrics.casesByTaskType[c.taskType] = (metrics.casesByTaskType[c.taskType] || 0) + 1;
    }

    return metrics;
  }

  public exportCasesForEval(): {
    version: string;
    exportedAt: string;
    count: number;
    cases: LearningCase[];
  } {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      count: this.cases.length,
      cases: this.cases,
    };
  }
}

export const learningRegistry = new LearningCaseRegistry();
