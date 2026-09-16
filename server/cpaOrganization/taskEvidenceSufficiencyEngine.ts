import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type SourceCompletenessState =
  | 'SOURCE_COMPLETE'
  | 'SOURCE_GAP_NON_MATERIAL_FOR_CURRENT_PURPOSE'
  | 'SOURCE_GAP_MATERIAL_FOR_CURRENT_PURPOSE'
  | 'SOURCE_GAP_UNKNOWN_MATERIALITY';

export type TaskEvidenceSufficiencyState =
  | 'SUFFICIENT_FOR_CURRENT_PURPOSE'
  | 'INSUFFICIENT_FOR_CURRENT_PURPOSE'
  | 'REVIEW_REQUIRED_TO_DETERMINE_MATERIALITY';

export type EvidenceGapType =
  | 'MISSING_PAGE'
  | 'MISSING_SECTION'
  | 'MISSING_TRANSACTION_RANGE'
  | 'UNREADABLE_REGION'
  | 'OCR_UNCERTAINTY'
  | 'UNSUPPORTED_ELEMENT'
  | 'UNCLASSIFIED_ELEMENT'
  | 'VERSION_AMBIGUITY'
  | 'SOURCE_NOT_PROVIDED'
  | 'REQUIRED_EVIDENCE_CAPABILITY_MISSING'
  | 'OTHER';

export type GapMateriality = 'MATERIAL' | 'NON_MATERIAL' | 'UNKNOWN';
export type ContinuitySignal = 'INTACT' | 'BROKEN' | 'UNKNOWN' | 'NOT_APPLICABLE';
export type ReconciliationSignal = 'PASS' | 'FAIL' | 'NOT_RUN' | 'UNKNOWN';
export type StructuralRelevanceSignal = 'IRRELEVANT_TO_TASK' | 'RELEVANT_TO_TASK' | 'UNKNOWN';
export type ConclusionDecisionState = 'ALLOWED' | 'BLOCKED_INSUFFICIENT' | 'REVIEW_REQUIRED';
export type SufficiencyRecommendedAction =
  | 'PROCEED'
  | 'PROCEED_WITH_DISCLOSED_GAP'
  | 'REVIEW_MATERIALITY'
  | 'REQUEST_ADDITIONAL_EVIDENCE';

export interface SourceEvidenceGap {
  gapId: string;
  sourceArtifactId?: string;
  gapType: EvidenceGapType;
  description: string;
  location?: string;
  affectedCapabilities: string[];
  explicitMateriality?: GapMateriality;
  materialityBasis?: string;
  evidenceRefs: string[];
  confidence?: number;
  signals?: {
    structuralRelevance?: StructuralRelevanceSignal;
    continuity?: ContinuitySignal;
    reconciliation?: ReconciliationSignal;
    adjacentContext?: string;
    structuralContext?: string;
  };
}

export interface TaskConclusionRequirement {
  conclusionId: string;
  label: string;
  requiredCapabilities: string[];
  requiresCompletePopulation?: boolean;
  evidenceRefs?: string[];
}

export interface EvidenceTaskDefinition {
  taskId: string;
  taskType: string;
  purpose: string;
  workspaceId?: string;
  engagementId?: string;
  entityId?: string;
  period?: string;
  availableCapabilities: string[];
  conclusions: TaskConclusionRequirement[];
  evidenceRefs?: string[];
}

export interface DocumentCompletenessLike {
  documentId: string;
  recordId?: string;
  filename?: string;
  completionStatus?: string;
  overallCoverage?: number;
  pageCount?: number;
  unsupportedElements?: number;
  unclassifiedElements?: number;
  reviewRequiredFacts?: number;
}

export interface UnresolvedElementLike {
  unresolvedId: string;
  documentId?: string;
  location?: string;
  contentSnippet?: string;
  elementType?: string;
  reasonUnresolved?: string;
  severity?: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence?: number;
}

export interface GapTaskAssessment {
  gapId: string;
  derivedMateriality: GapMateriality;
  affectsCurrentTask: boolean;
  affectedConclusionIds: string[];
  rationale: string[];
}

export interface ConclusionSufficiencyAssessment {
  conclusionId: string;
  label: string;
  state: ConclusionDecisionState;
  blockingGapIds: string[];
  reviewGapIds: string[];
  evidenceRefs: string[];
}

export interface TaskEvidenceSufficiencyDecision {
  decisionId: string;
  createdAt: string;
  task: EvidenceTaskDefinition;
  sourceCompletenessState: SourceCompletenessState;
  taskEvidenceSufficiencyState: TaskEvidenceSufficiencyState;
  recommendedAction: SufficiencyRecommendedAction;
  gaps: SourceEvidenceGap[];
  gapAssessments: GapTaskAssessment[];
  conclusionAssessments: ConclusionSufficiencyAssessment[];
  allowedConclusionIds: string[];
  blockedConclusionIds: string[];
  reviewRequiredConclusionIds: string[];
  knownGapCount: number;
  materialGapCount: number;
  unknownMaterialityGapCount: number;
  clarificationRecommended: boolean;
  evidenceRefs: string[];
  decisionHash: string;
}

export interface EvaluateSufficiencyInput {
  task: EvidenceTaskDefinition;
  gaps?: SourceEvidenceGap[];
  completenessRecords?: DocumentCompletenessLike[];
  unresolvedElements?: UnresolvedElementLike[];
  persist?: boolean;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function intersects(a: string[], b: string[]): boolean {
  const set = new Set(a.map(v => v.toUpperCase()));
  return b.some(v => set.has(v.toUpperCase()));
}

function stableHash(value: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function hardFailureSignal(gap: SourceEvidenceGap): boolean {
  return gap.signals?.continuity === 'BROKEN' || gap.signals?.reconciliation === 'FAIL';
}

function deriveMateriality(
  gap: SourceEvidenceGap,
  affectedConclusions: TaskConclusionRequirement[]
): { materiality: GapMateriality; rationale: string[] } {
  const rationale: string[] = [];
  const affectsTask = affectedConclusions.length > 0;

  if (!affectsTask) {
    rationale.push('Gap does not intersect any capability required by the current task.');
    return { materiality: 'NON_MATERIAL', rationale };
  }

  if (hardFailureSignal(gap)) {
    if (gap.signals?.continuity === 'BROKEN') rationale.push('Continuity is broken for evidence required by the current task.');
    if (gap.signals?.reconciliation === 'FAIL') rationale.push('A reconciliation tied to required evidence failed.');
    return { materiality: 'MATERIAL', rationale };
  }

  if (affectedConclusions.some(c => c.requiresCompletePopulation) &&
      ['MISSING_PAGE', 'MISSING_SECTION', 'MISSING_TRANSACTION_RANGE', 'SOURCE_NOT_PROVIDED', 'REQUIRED_EVIDENCE_CAPABILITY_MISSING'].includes(gap.gapType)) {
    if (gap.signals?.structuralRelevance !== 'IRRELEVANT_TO_TASK') {
      rationale.push('The affected conclusion requires a complete population and the gap may contain required members of that population.');
      return { materiality: 'MATERIAL', rationale };
    }
  }

  if (gap.explicitMateriality === 'MATERIAL') {
    rationale.push(gap.materialityBasis || 'Gap was explicitly classified material to the current purpose.');
    return { materiality: 'MATERIAL', rationale };
  }

  if (gap.explicitMateriality === 'NON_MATERIAL') {
    rationale.push(gap.materialityBasis || 'Gap was explicitly classified non-material to the current purpose.');
    return { materiality: 'NON_MATERIAL', rationale };
  }

  if (gap.signals?.structuralRelevance === 'IRRELEVANT_TO_TASK' &&
      gap.signals?.continuity !== 'BROKEN' && gap.signals?.reconciliation !== 'FAIL') {
    rationale.push('Structural context indicates the missing/unreadable content is irrelevant to the requested task.');
    if (gap.signals?.continuity === 'INTACT') rationale.push('Relevant evidence continuity remains intact.');
    if (gap.signals?.reconciliation === 'PASS') rationale.push('Relevant reconciliation passed.');
    return { materiality: 'NON_MATERIAL', rationale };
  }

  if (gap.signals?.structuralRelevance === 'RELEVANT_TO_TASK') {
    rationale.push('Structural context indicates the gap may contain evidence required by the current task.');
  } else {
    rationale.push('Materiality of the gap to the current task has not been established.');
  }
  return { materiality: 'UNKNOWN', rationale };
}

export class TaskEvidenceSufficiencyEngine {
  readonly storageDir: string;

  constructor(storageDir = process.env.EVE_TASK_SUFFICIENCY_DIR || path.resolve('storage/cpa_memory/task_sufficiency')) {
    this.storageDir = storageDir;
  }

  public deriveGapsFromCompleteness(
    records: DocumentCompletenessLike[] = [],
    unresolved: UnresolvedElementLike[] = []
  ): SourceEvidenceGap[] {
    const gaps: SourceEvidenceGap[] = [];

    for (const record of records) {
      const evidenceRef = record.recordId || record.documentId;
      const coverage = Number(record.overallCoverage);
      const status = String(record.completionStatus || '').toUpperCase();
      if (Number.isFinite(coverage) && coverage < 100) {
        gaps.push({
          gapId: `gap-coverage-${record.documentId}`,
          sourceArtifactId: record.documentId,
          gapType: 'OTHER',
          description: `Source coverage recorded at ${coverage}% for ${record.filename || record.documentId}.`,
          affectedCapabilities: [],
          explicitMateriality: 'UNKNOWN',
          materialityBasis: 'Coverage below 100% is a source-side gap, but task impact requires separate evaluation.',
          evidenceRefs: [evidenceRef],
        });
      }
      if (Number(record.unsupportedElements || 0) > 0) {
        gaps.push({
          gapId: `gap-unsupported-${record.documentId}`,
          sourceArtifactId: record.documentId,
          gapType: 'UNSUPPORTED_ELEMENT',
          description: `${record.unsupportedElements} source elements are unsupported.`,
          affectedCapabilities: [],
          explicitMateriality: 'UNKNOWN',
          evidenceRefs: [evidenceRef],
        });
      }
      if (Number(record.unclassifiedElements || 0) > 0) {
        gaps.push({
          gapId: `gap-unclassified-${record.documentId}`,
          sourceArtifactId: record.documentId,
          gapType: 'UNCLASSIFIED_ELEMENT',
          description: `${record.unclassifiedElements} source elements are unclassified.`,
          affectedCapabilities: [],
          explicitMateriality: 'UNKNOWN',
          evidenceRefs: [evidenceRef],
        });
      }
      if (['REVIEW_REQUIRED', 'UNSUPPORTED_STRUCTURE', 'FAILED', 'PARTIAL_EXTRACTION', 'DISCLOSURES_PARTIAL', 'MULTIMODAL_REVIEW_PARTIAL'].includes(status)) {
        gaps.push({
          gapId: `gap-status-${record.documentId}`,
          sourceArtifactId: record.documentId,
          gapType: status === 'UNSUPPORTED_STRUCTURE' ? 'UNSUPPORTED_ELEMENT' : 'OTHER',
          description: `Document completion status is ${status}.`,
          affectedCapabilities: [],
          explicitMateriality: 'UNKNOWN',
          evidenceRefs: [evidenceRef],
        });
      }
    }

    for (const item of unresolved) {
      gaps.push({
        gapId: `gap-unresolved-${item.unresolvedId}`,
        sourceArtifactId: item.documentId,
        gapType: item.elementType?.toLowerCase().includes('ocr') ? 'OCR_UNCERTAINTY' : 'OTHER',
        description: item.reasonUnresolved || item.contentSnippet || 'Unresolved source element.',
        location: item.location,
        affectedCapabilities: [],
        explicitMateriality: item.severity === 'HIGH' ? 'UNKNOWN' : undefined,
        evidenceRefs: [item.unresolvedId],
        confidence: item.confidence,
      });
    }

    return gaps;
  }

  public evaluate(input: EvaluateSufficiencyInput): TaskEvidenceSufficiencyDecision {
    const task = input.task;
    if (!task?.taskId || !task.purpose || !Array.isArray(task.conclusions) || task.conclusions.length === 0) {
      throw new Error('TASK_EVIDENCE_SUFFICIENCY_INVALID_TASK');
    }

    const gaps = [
      ...(input.gaps || []),
      ...this.deriveGapsFromCompleteness(input.completenessRecords, input.unresolvedElements),
    ];

    const available = new Set((task.availableCapabilities || []).map(v => v.toUpperCase()));
    for (const conclusion of task.conclusions) {
      for (const capability of conclusion.requiredCapabilities || []) {
        if (!available.has(capability.toUpperCase())) {
          const gapId = `gap-required-${task.taskId}-${conclusion.conclusionId}-${capability}`.replace(/[^a-zA-Z0-9_.-]/g, '-');
          if (!gaps.some(g => g.gapId === gapId)) {
            gaps.push({
              gapId,
              gapType: 'REQUIRED_EVIDENCE_CAPABILITY_MISSING',
              description: `Required evidence capability ${capability} is not present for conclusion ${conclusion.label}.`,
              affectedCapabilities: [capability],
              explicitMateriality: 'MATERIAL',
              materialityBasis: 'The task explicitly requires this evidence capability.',
              evidenceRefs: conclusion.evidenceRefs || [],
            });
          }
        }
      }
    }

    const gapAssessments: GapTaskAssessment[] = gaps.map(gap => {
      const affectedConclusions = task.conclusions.filter(c => intersects(gap.affectedCapabilities || [], c.requiredCapabilities || []));
      const derived = deriveMateriality(gap, affectedConclusions);
      return {
        gapId: gap.gapId,
        derivedMateriality: derived.materiality,
        affectsCurrentTask: affectedConclusions.length > 0,
        affectedConclusionIds: affectedConclusions.map(c => c.conclusionId),
        rationale: derived.rationale,
      };
    });

    const conclusionAssessments: ConclusionSufficiencyAssessment[] = task.conclusions.map(conclusion => {
      const relevant = gapAssessments.filter(g => g.affectedConclusionIds.includes(conclusion.conclusionId));
      const blocking = relevant.filter(g => g.derivedMateriality === 'MATERIAL').map(g => g.gapId);
      const review = relevant.filter(g => g.derivedMateriality === 'UNKNOWN').map(g => g.gapId);
      const state: ConclusionDecisionState = blocking.length
        ? 'BLOCKED_INSUFFICIENT'
        : review.length
          ? 'REVIEW_REQUIRED'
          : 'ALLOWED';
      return {
        conclusionId: conclusion.conclusionId,
        label: conclusion.label,
        state,
        blockingGapIds: blocking,
        reviewGapIds: review,
        evidenceRefs: unique([...(task.evidenceRefs || []), ...(conclusion.evidenceRefs || [])]),
      };
    });

    const materialGapCount = gapAssessments.filter(g => g.derivedMateriality === 'MATERIAL' && g.affectsCurrentTask).length;
    const unknownMaterialityGapCount = gapAssessments.filter(g => g.derivedMateriality === 'UNKNOWN' && g.affectsCurrentTask).length;

    let sourceCompletenessState: SourceCompletenessState;
    if (gaps.length === 0) sourceCompletenessState = 'SOURCE_COMPLETE';
    else if (materialGapCount > 0) sourceCompletenessState = 'SOURCE_GAP_MATERIAL_FOR_CURRENT_PURPOSE';
    else if (unknownMaterialityGapCount > 0) sourceCompletenessState = 'SOURCE_GAP_UNKNOWN_MATERIALITY';
    else sourceCompletenessState = 'SOURCE_GAP_NON_MATERIAL_FOR_CURRENT_PURPOSE';

    const blocked = conclusionAssessments.filter(c => c.state === 'BLOCKED_INSUFFICIENT');
    const review = conclusionAssessments.filter(c => c.state === 'REVIEW_REQUIRED');
    const allowed = conclusionAssessments.filter(c => c.state === 'ALLOWED');

    const taskEvidenceSufficiencyState: TaskEvidenceSufficiencyState = blocked.length
      ? 'INSUFFICIENT_FOR_CURRENT_PURPOSE'
      : review.length
        ? 'REVIEW_REQUIRED_TO_DETERMINE_MATERIALITY'
        : 'SUFFICIENT_FOR_CURRENT_PURPOSE';

    const recommendedAction: SufficiencyRecommendedAction = taskEvidenceSufficiencyState === 'INSUFFICIENT_FOR_CURRENT_PURPOSE'
      ? 'REQUEST_ADDITIONAL_EVIDENCE'
      : taskEvidenceSufficiencyState === 'REVIEW_REQUIRED_TO_DETERMINE_MATERIALITY'
        ? 'REVIEW_MATERIALITY'
        : gaps.length > 0
          ? 'PROCEED_WITH_DISCLOSED_GAP'
          : 'PROCEED';

    const createdAt = new Date().toISOString();
    const decisionId = `suff-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const evidenceRefs = unique([
      ...(task.evidenceRefs || []),
      ...gaps.flatMap(g => g.evidenceRefs || []),
      ...conclusionAssessments.flatMap(c => c.evidenceRefs || []),
    ]);

    const decisionWithoutHash = {
      decisionId,
      createdAt,
      task,
      sourceCompletenessState,
      taskEvidenceSufficiencyState,
      recommendedAction,
      gaps,
      gapAssessments,
      conclusionAssessments,
      allowedConclusionIds: allowed.map(c => c.conclusionId),
      blockedConclusionIds: blocked.map(c => c.conclusionId),
      reviewRequiredConclusionIds: review.map(c => c.conclusionId),
      knownGapCount: gaps.length,
      materialGapCount,
      unknownMaterialityGapCount,
      clarificationRecommended: recommendedAction === 'REQUEST_ADDITIONAL_EVIDENCE' || recommendedAction === 'REVIEW_MATERIALITY',
      evidenceRefs,
    };

    const decision: TaskEvidenceSufficiencyDecision = {
      ...decisionWithoutHash,
      decisionHash: stableHash(decisionWithoutHash),
    };

    if (input.persist) this.persistDecision(decision);
    return decision;
  }

  public persistDecision(decision: TaskEvidenceSufficiencyDecision): string {
    fs.mkdirSync(this.storageDir, { recursive: true });
    const target = path.join(this.storageDir, `${decision.decisionId}.json`);
    const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(decision, null, 2), 'utf8');
    fs.renameSync(temp, target);
    return target;
  }

  public getDecision(decisionId: string): TaskEvidenceSufficiencyDecision | undefined {
    const target = path.join(this.storageDir, `${decisionId}.json`);
    if (!fs.existsSync(target)) return undefined;
    return JSON.parse(fs.readFileSync(target, 'utf8')) as TaskEvidenceSufficiencyDecision;
  }

  public listDecisions(filter?: { workspaceId?: string; engagementId?: string; taskId?: string }): TaskEvidenceSufficiencyDecision[] {
    if (!fs.existsSync(this.storageDir)) return [];
    const records: TaskEvidenceSufficiencyDecision[] = [];
    for (const filename of fs.readdirSync(this.storageDir).filter(f => f.endsWith('.json'))) {
      try {
        const record = JSON.parse(fs.readFileSync(path.join(this.storageDir, filename), 'utf8')) as TaskEvidenceSufficiencyDecision;
        if (filter?.workspaceId && record.task.workspaceId !== filter.workspaceId) continue;
        if (filter?.engagementId && record.task.engagementId !== filter.engagementId) continue;
        if (filter?.taskId && record.task.taskId !== filter.taskId) continue;
        records.push(record);
      } catch {
        // A malformed persisted decision is not silently accepted as evidence.
      }
    }
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export const taskEvidenceSufficiencyEngine = new TaskEvidenceSufficiencyEngine();
