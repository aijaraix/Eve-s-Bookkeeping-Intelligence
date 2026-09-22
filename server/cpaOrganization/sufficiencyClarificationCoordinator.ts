import {
  ProfessionalClarificationEngine,
  professionalClarificationEngine,
  type ProfessionalClarificationRequest,
  type ClarificationOption,
} from './professionalClarificationEngine.js';
import {
  TaskEvidenceSufficiencyEngine,
  taskEvidenceSufficiencyEngine,
  type TaskEvidenceSufficiencyDecision,
} from './taskEvidenceSufficiencyEngine.js';

const CLIENT_EVIDENCE_GAP_TYPES = new Set([
  'MISSING_PAGE', 'MISSING_SECTION', 'MISSING_TRANSACTION_RANGE', 'UNREADABLE_REGION',
  'OCR_UNCERTAINTY', 'UNSUPPORTED_ELEMENT', 'SOURCE_NOT_PROVIDED',
  'REQUIRED_EVIDENCE_CAPABILITY_MISSING',
]);

function unique(values: string[]): string[] { return [...new Set(values.filter(Boolean))]; }
function conclusionLabels(decision: TaskEvidenceSufficiencyDecision, ids: string[]): string[] {
  return ids.map(id => decision.task.conclusions.find(c => c.conclusionId === id)?.label || id);
}

export class SufficiencyClarificationCoordinator {
  constructor(
    private readonly clarificationEngine: ProfessionalClarificationEngine = professionalClarificationEngine,
    private readonly sufficiencyEngine: TaskEvidenceSufficiencyEngine = taskEvidenceSufficiencyEngine,
  ) {}

  private buildOptions(kind: ProfessionalClarificationRequest['requestKind']): ClarificationOption[] {
    if (kind === 'PBC_EVIDENCE_REQUEST') return [
      { optionKey: 'PROVIDE_REQUESTED_EVIDENCE', label: 'Provide requested evidence', accountingConsequence: 'Response becomes evidence and P1-009 must be re-evaluated before any blocked conclusion is released.', evidenceSupport: 'Attach/source the authoritative document, page, schedule, or other evidence.' },
      { optionKey: 'EVIDENCE_UNAVAILABLE', label: 'Evidence is unavailable', accountingConsequence: 'Affected conclusions remain blocked or review-required unless alternative evidence establishes sufficiency.', evidenceSupport: 'Explain why the source cannot be provided and identify any alternative authoritative evidence.' },
    ];
    return [
      { optionKey: 'NON_MATERIAL_TO_TASK', label: 'Gap is non-material to this task', accountingConsequence: 'May support proceeding with disclosed gap only after P1-009 re-evaluation.', evidenceSupport: 'Document structural/task reasoning and supporting evidence.' },
      { optionKey: 'MATERIAL_TO_TASK', label: 'Gap is material to this task', accountingConsequence: 'Affected conclusion remains blocked pending evidence.', evidenceSupport: 'Identify the affected conclusion/capability and materiality basis.' },
      { optionKey: 'REQUEST_CLIENT_EVIDENCE', label: 'Client evidence is needed', accountingConsequence: 'Convert/follow with a PBC evidence request.', evidenceSupport: 'Identify the exact source evidence required.' },
    ];
  }

  public createRequestsForDecision(decisionId: string, params: { createdBy?: string; projectId?: string; dueAt?: string } = {}): ProfessionalClarificationRequest[] {
    const decision = this.sufficiencyEngine.getDecision(decisionId);
    if (!decision) throw new Error(`SUFFICIENCY_DECISION_NOT_FOUND:${decisionId}`);
    if (!decision.clarificationRecommended) return [];
    const actionable = decision.gapAssessments.filter(a => a.affectsCurrentTask && (a.derivedMateriality === 'MATERIAL' || a.derivedMateriality === 'UNKNOWN'));
    const existing = this.clarificationEngine.getAllClarifications();
    const created: ProfessionalClarificationRequest[] = [];
    for (const assessment of actionable) {
      const gap = decision.gaps.find(g => g.gapId === assessment.gapId); if (!gap) continue;
      const duplicate = existing.find(req => req.status !== 'WITHDRAWN' && req.sufficiencyLink?.sourceDecisionId === decisionId && req.sufficiencyLink.gapIds.includes(gap.gapId));
      if (duplicate) { created.push(duplicate); continue; }
      const labels = conclusionLabels(decision, assessment.affectedConclusionIds);
      const isPbc = assessment.derivedMateriality === 'MATERIAL' && CLIENT_EVIDENCE_GAP_TYPES.has(gap.gapType);
      const requestKind: ProfessionalClarificationRequest['requestKind'] = assessment.derivedMateriality === 'UNKNOWN' ? 'INTERNAL_MATERIALITY_REVIEW' : isPbc ? 'PBC_EVIDENCE_REQUEST' : 'CPA_REVIEW';
      const assignedTo = requestKind === 'PBC_EVIDENCE_REQUEST' ? 'CLIENT_CONTROLLER' : requestKind === 'CPA_REVIEW' ? 'CPA_PARTNER' : 'AUDIT_MANAGER';
      const evidenceRefs = unique([...decision.evidenceRefs, ...(gap.evidenceRefs || [])]);
      const question = requestKind === 'PBC_EVIDENCE_REQUEST' ? `Please provide authoritative evidence needed to resolve this source gap: ${gap.description}` : `Please determine whether this source gap is material to the current task before Eve proceeds: ${gap.description}`;
      created.push(this.clarificationEngine.createClarificationRequest({
        type: requestKind === 'PBC_EVIDENCE_REQUEST' ? 'MISSING_EVIDENCE' : 'OTHER', projectId: params.projectId || decision.task.workspaceId || decision.task.engagementId || 'UNSCOPED_PROJECT', engagementId: decision.task.engagementId || decision.task.workspaceId || 'UNSCOPED_ENGAGEMENT',
        createdBy: params.createdBy || 'EVE_CLARA', assignedTo, requestKind, dueAt: params.dueAt, question,
        whyItMatters: `P1-009 decision ${decision.decisionId} identified this gap as ${assessment.derivedMateriality}. Affected conclusions: ${labels.join('; ') || 'not recorded'}. The gap must remain explicit until re-evaluation.`,
        evidenceAvailable: evidenceRefs, conflictingEvidence: assessment.rationale, confidence: typeof gap.confidence === 'number' ? gap.confidence : (assessment.derivedMateriality === 'MATERIAL' ? 1 : 0.5),
        potentialFinancialImpact: `Not quantified by this sufficiency decision. Affected conclusions: ${labels.join('; ') || 'not recorded'}.`, potentialReportImpact: assessment.derivedMateriality === 'MATERIAL' ? 'One or more affected conclusions are blocked pending sufficient evidence.' : 'One or more affected conclusions require materiality review before release.',
        options: this.buildOptions(requestKind), status: 'PENDING_INTERNAL_REVIEW', supportingDocumentIds: [],
        sufficiencyLink: { sourceDecisionId: decision.decisionId, sourceDecisionHash: decision.decisionHash, sourceTaskId: decision.task.taskId, gapIds: [gap.gapId], affectedConclusionIds: [...assessment.affectedConclusionIds], sourceEvidenceRefs: evidenceRefs, materialityAtCreation: assessment.derivedMateriality as 'MATERIAL' | 'UNKNOWN', reevaluationDecisionIds: [], unresolvedGapIds: [gap.gapId], resolvedGapIds: [] },
      }));
    }
    return created;
  }

  public markSubmitted(requestId: string, actor: string) { return this.clarificationEngine.markSubmittedToClient(requestId, actor); }
  public recordResponse(requestId: string, payload: { respondedBy: string; selectedOption?: string; narrativeExplanation: string; supportingDocumentFilenames?: string[]; supportingDocumentIds?: string[]; evidenceRefs?: string[] }) { return this.clarificationEngine.recordClarificationResponse(requestId, payload, { resolveImmediately: false }); }
  public linkReevaluation(requestId: string, reevaluationDecisionId: string, actor: string) {
    const req = this.clarificationEngine.getClarification(requestId); if (!req) throw new Error(`CLARIFICATION_NOT_FOUND:${requestId}`);
    const link = req.sufficiencyLink; if (!link) throw new Error('CLARIFICATION_NOT_LINKED_TO_SUFFICIENCY_DECISION');
    const original = this.sufficiencyEngine.getDecision(link.sourceDecisionId); const next = this.sufficiencyEngine.getDecision(reevaluationDecisionId);
    if (!original) throw new Error(`SOURCE_SUFFICIENCY_DECISION_NOT_FOUND:${link.sourceDecisionId}`); if (!next) throw new Error(`REEVALUATION_DECISION_NOT_FOUND:${reevaluationDecisionId}`);
    if (next.task.taskId !== link.sourceTaskId) throw new Error('REEVALUATION_TASK_MISMATCH');
    if (original.task.engagementId && next.task.engagementId !== original.task.engagementId) throw new Error('REEVALUATION_ENGAGEMENT_MISMATCH');
    if (original.task.workspaceId && next.task.workspaceId !== original.task.workspaceId) throw new Error('REEVALUATION_WORKSPACE_MISMATCH');
    if (next.createdAt < original.createdAt) throw new Error('REEVALUATION_PRECEDES_SOURCE_DECISION');
    const affected = link.affectedConclusionIds.map(id => next.conclusionAssessments.find(c => c.conclusionId === id)); if (affected.some(v => !v)) throw new Error('REEVALUATION_MISSING_AFFECTED_CONCLUSION');
    const allAllowed = affected.every(v => v?.state === 'ALLOWED');
    const unresolvedGapIds = allAllowed ? [] : link.gapIds.filter(gapId => { const assessment = next.gapAssessments.find(a => a.gapId === gapId); return !assessment || assessment.derivedMateriality !== 'NON_MATERIAL'; });
    const resolvedGapIds = link.gapIds.filter(id => !unresolvedGapIds.includes(id));
    return this.clarificationEngine.applySufficiencyReevaluation(requestId, { decisionId: next.decisionId, actor, allAffectedConclusionsAllowed: allAllowed, resolvedGapIds, unresolvedGapIds, note: `P1-009 re-evaluation ${next.decisionId}: ${affected.map(v => `${v?.conclusionId}=${v?.state}`).join(', ')}` });
  }
}
export const sufficiencyClarificationCoordinator = new SufficiencyClarificationCoordinator();
