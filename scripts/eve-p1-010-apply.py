from pathlib import Path


def edit(path, old, new, count=1):
    p=Path(path); text=p.read_text()
    if old not in text:
        raise SystemExit(f'MISSING_SNIPPET:{path}:{old[:120]!r}')
    p.write_text(text.replace(old,new,count))

p=Path('server/cpaOrganization/professionalClarificationEngine.ts')
text=p.read_text()
old="""export type ClarificationRecipientRole =
  | 'CLIENT_CONTROLLER'
  | 'CPA_PARTNER'
  | 'AUDIT_MANAGER'
  | 'TECHNICAL_ACCOUNTING_DIRECTOR';

export interface ClarificationOption {
  optionKey: string;
  label: string;
  accountingConsequence: string;
  evidenceSupport: string;
}

export interface ProfessionalClarificationRequest {
  requestId: string;
  type: ClarificationType;
  projectId: string;
  engagementId: string;
  createdBy: string;        // Agent or user who discovered ambiguity (e.g., 'EVE_CORE', 'QUINN_REVIEWER')
  assignedTo: ClarificationRecipientRole;
  
  question: string;
  whyItMatters: string;
  
  evidenceAvailable: string[];
  conflictingEvidence: string[];
  
  confidence: number;
  potentialFinancialImpact: string;
  potentialReportImpact: string;
  
  options: ClarificationOption[];
  recommendedAnswer?: string;
  
  status: ClarificationStatus;
  
  response?: {
    respondedBy: string;
    respondedAt: string;
    selectedOption?: string;
    narrativeExplanation: string;
    supportingDocumentFilenames?: string[];
  };
  
  supportingDocumentIds: string[];
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
"""
new="""export type ClarificationRecipientRole =
  | 'CLIENT_CONTROLLER'
  | 'CPA_PARTNER'
  | 'AUDIT_MANAGER'
  | 'TECHNICAL_ACCOUNTING_DIRECTOR';

export type ClarificationRequestKind =
  | 'GENERAL_CLARIFICATION'
  | 'PBC_EVIDENCE_REQUEST'
  | 'INTERNAL_MATERIALITY_REVIEW'
  | 'CPA_REVIEW';

export interface ClarificationLifecycleEvent {
  eventId: string;
  eventType:
    | 'CREATED'
    | 'SUBMITTED_TO_CLIENT'
    | 'RESPONSE_RECEIVED'
    | 'REEVALUATED'
    | 'RESOLVED'
    | 'FOLLOW_UP_REQUIRED'
    | 'WITHDRAWN';
  at: string;
  actor: string;
  note?: string;
  evidenceRefs?: string[];
  decisionId?: string;
}

export interface SufficiencyClarificationLink {
  sourceDecisionId: string;
  sourceDecisionHash: string;
  sourceTaskId: string;
  gapIds: string[];
  affectedConclusionIds: string[];
  sourceEvidenceRefs: string[];
  materialityAtCreation: 'MATERIAL' | 'UNKNOWN';
  reevaluationDecisionIds: string[];
  latestReevaluationDecisionId?: string;
  resolvedGapIds?: string[];
  unresolvedGapIds?: string[];
}

export interface ClarificationOption {
  optionKey: string;
  label: string;
  accountingConsequence: string;
  evidenceSupport: string;
}

export interface ProfessionalClarificationRequest {
  requestId: string;
  type: ClarificationType;
  projectId: string;
  engagementId: string;
  createdBy: string;        // Agent or user who discovered ambiguity (e.g., 'EVE_CORE', 'QUINN_REVIEWER')
  assignedTo: ClarificationRecipientRole;
  requestKind?: ClarificationRequestKind;
  sufficiencyLink?: SufficiencyClarificationLink;
  dueAt?: string;
  submittedAt?: string;
  
  question: string;
  whyItMatters: string;
  
  evidenceAvailable: string[];
  conflictingEvidence: string[];
  
  confidence: number;
  potentialFinancialImpact: string;
  potentialReportImpact: string;
  
  options: ClarificationOption[];
  recommendedAnswer?: string;
  
  status: ClarificationStatus;
  
  response?: {
    respondedBy: string;
    respondedAt: string;
    selectedOption?: string;
    narrativeExplanation: string;
    supportingDocumentFilenames?: string[];
    supportingDocumentIds?: string[];
    evidenceRefs?: string[];
  };
  responseEvidenceRefs?: string[];
  followUpCount?: number;
  lifecycleEvents?: ClarificationLifecycleEvent[];
  
  supportingDocumentIds: string[];
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
"""
if old not in text: raise SystemExit('professional type block missing')
text=text.replace(old,new,1)
text=text.replace("""  private constructor() {
    this.storageDir = path.resolve('storage/cpa_memory/clarifications');
""","""  public constructor(storageDir = path.resolve('storage/cpa_memory/clarifications')) {
    this.storageDir = storageDir;
""",1)
old_api="""  public createClarificationRequest(data: Omit<ProfessionalClarificationRequest, 'requestId' | 'createdAt' | 'updatedAt'>): ProfessionalClarificationRequest {
    const req: ProfessionalClarificationRequest = {
      ...data,
      requestId: `pcr-${Date.now()}-${crypto.randomUUID().slice(0, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.requests.set(req.requestId, req);
    this.persistClarificationsToDisk();
    return req;
  }

  public respondToClarification(
    requestId: string,
    responsePayload: {
      respondedBy: string;
      selectedOption?: string;
      narrativeExplanation: string;
      supportingDocumentFilenames?: string[];
    }
  ): ProfessionalClarificationRequest {
    const req = this.requests.get(requestId);
    if (!req) {
      throw new Error(`Clarification request not found: ${requestId}`);
    }

    req.response = {
      ...responsePayload,
      respondedAt: new Date().toISOString()
    };
    req.status = 'RESOLVED';
    req.resolvedBy = responsePayload.respondedBy;
    req.resolvedAt = new Date().toISOString();
    req.updatedAt = new Date().toISOString();

    this.persistClarificationsToDisk();
    return req;
  }
"""
new_api="""  private appendLifecycleEvent(req: ProfessionalClarificationRequest, event: Omit<ClarificationLifecycleEvent, 'eventId' | 'at'> & { at?: string }): void {
    req.lifecycleEvents = req.lifecycleEvents || [];
    req.lifecycleEvents.push({
      ...event,
      eventId: `pcr-evt-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
      at: event.at || new Date().toISOString(),
    });
  }

  public createClarificationRequest(data: Omit<ProfessionalClarificationRequest, 'requestId' | 'createdAt' | 'updatedAt'>): ProfessionalClarificationRequest {
    const now = new Date().toISOString();
    const req: ProfessionalClarificationRequest = {
      ...data,
      requestKind: data.requestKind || 'GENERAL_CLARIFICATION',
      responseEvidenceRefs: data.responseEvidenceRefs || [],
      followUpCount: data.followUpCount || 0,
      lifecycleEvents: data.lifecycleEvents ? [...data.lifecycleEvents] : [],
      requestId: `pcr-${Date.now()}-${crypto.randomUUID().slice(0, 4)}`,
      createdAt: now,
      updatedAt: now
    };
    if (!req.lifecycleEvents?.length) {
      this.appendLifecycleEvent(req, {
        eventType: 'CREATED',
        actor: data.createdBy,
        note: 'Clarification request created.',
        evidenceRefs: data.sufficiencyLink?.sourceEvidenceRefs || data.evidenceAvailable || [],
        decisionId: data.sufficiencyLink?.sourceDecisionId,
      });
    }
    this.requests.set(req.requestId, req);
    this.persistClarificationsToDisk();
    return req;
  }

  public markSubmittedToClient(requestId: string, actor: string): ProfessionalClarificationRequest {
    const req = this.requests.get(requestId);
    if (!req) throw new Error(`Clarification request not found: ${requestId}`);
    if (req.requestKind !== 'PBC_EVIDENCE_REQUEST') {
      throw new Error('ONLY_PBC_EVIDENCE_REQUESTS_CAN_BE_SUBMITTED_TO_CLIENT');
    }
    req.status = 'SUBMITTED_TO_CLIENT';
    req.submittedAt = new Date().toISOString();
    req.updatedAt = req.submittedAt;
    this.appendLifecycleEvent(req, {
      eventType: 'SUBMITTED_TO_CLIENT',
      actor,
      note: 'PBC evidence request marked submitted to client. No transport/send action is implied by this state change.',
      evidenceRefs: req.sufficiencyLink?.sourceEvidenceRefs || [],
      decisionId: req.sufficiencyLink?.sourceDecisionId,
    });
    this.persistClarificationsToDisk();
    return req;
  }

  public recordClarificationResponse(
    requestId: string,
    responsePayload: {
      respondedBy: string;
      selectedOption?: string;
      narrativeExplanation: string;
      supportingDocumentFilenames?: string[];
      supportingDocumentIds?: string[];
      evidenceRefs?: string[];
    },
    options: { resolveImmediately?: boolean } = {}
  ): ProfessionalClarificationRequest {
    const req = this.requests.get(requestId);
    if (!req) throw new Error(`Clarification request not found: ${requestId}`);
    if (req.requestKind === 'PBC_EVIDENCE_REQUEST' && req.status !== 'SUBMITTED_TO_CLIENT') {
      throw new Error('PBC_RESPONSE_REJECTED_BEFORE_SUBMISSION');
    }
    if (!String(responsePayload.narrativeExplanation || '').trim()) {
      throw new Error('CLARIFICATION_RESPONSE_NARRATIVE_REQUIRED');
    }

    const respondedAt = new Date().toISOString();
    req.response = { ...responsePayload, respondedAt };
    req.supportingDocumentIds = Array.from(new Set([...(req.supportingDocumentIds || []), ...(responsePayload.supportingDocumentIds || [])]));
    req.responseEvidenceRefs = Array.from(new Set([...(req.responseEvidenceRefs || []), ...(responsePayload.evidenceRefs || []), ...(responsePayload.supportingDocumentIds || [])]));
    req.status = options.resolveImmediately ? 'RESOLVED' : 'RESPONSE_RECEIVED';
    req.updatedAt = respondedAt;
    if (options.resolveImmediately) {
      req.resolvedBy = responsePayload.respondedBy;
      req.resolvedAt = respondedAt;
    }
    this.appendLifecycleEvent(req, {
      eventType: 'RESPONSE_RECEIVED',
      actor: responsePayload.respondedBy,
      note: responsePayload.narrativeExplanation,
      evidenceRefs: req.responseEvidenceRefs,
      decisionId: req.sufficiencyLink?.sourceDecisionId,
    });
    if (options.resolveImmediately) {
      this.appendLifecycleEvent(req, {
        eventType: 'RESOLVED',
        actor: responsePayload.respondedBy,
        note: 'Legacy clarification response resolved immediately.',
        evidenceRefs: req.responseEvidenceRefs,
      });
    }
    this.persistClarificationsToDisk();
    return req;
  }

  public applySufficiencyReevaluation(
    requestId: string,
    params: {
      decisionId: string;
      actor: string;
      allAffectedConclusionsAllowed: boolean;
      resolvedGapIds: string[];
      unresolvedGapIds: string[];
      note?: string;
    }
  ): ProfessionalClarificationRequest {
    const req = this.requests.get(requestId);
    if (!req) throw new Error(`Clarification request not found: ${requestId}`);
    if (!req.sufficiencyLink) throw new Error('CLARIFICATION_NOT_LINKED_TO_SUFFICIENCY_DECISION');

    req.sufficiencyLink.reevaluationDecisionIds = Array.from(new Set([...(req.sufficiencyLink.reevaluationDecisionIds || []), params.decisionId]));
    req.sufficiencyLink.latestReevaluationDecisionId = params.decisionId;
    req.sufficiencyLink.resolvedGapIds = [...params.resolvedGapIds];
    req.sufficiencyLink.unresolvedGapIds = [...params.unresolvedGapIds];
    this.appendLifecycleEvent(req, {
      eventType: 'REEVALUATED',
      actor: params.actor,
      note: params.note || 'Linked P1-009 re-evaluation decision.',
      evidenceRefs: req.responseEvidenceRefs || [],
      decisionId: params.decisionId,
    });

    if (params.allAffectedConclusionsAllowed) {
      const now = new Date().toISOString();
      req.status = 'RESOLVED';
      req.resolvedBy = params.actor;
      req.resolvedAt = now;
      req.updatedAt = now;
      this.appendLifecycleEvent(req, {
        eventType: 'RESOLVED',
        actor: params.actor,
        note: 'All conclusions affected by this clarification are allowed by the linked P1-009 re-evaluation.',
        evidenceRefs: req.responseEvidenceRefs || [],
        decisionId: params.decisionId,
      });
    } else {
      req.followUpCount = (req.followUpCount || 0) + 1;
      req.status = req.requestKind === 'PBC_EVIDENCE_REQUEST' ? 'SUBMITTED_TO_CLIENT' : 'PENDING_INTERNAL_REVIEW';
      req.updatedAt = new Date().toISOString();
      this.appendLifecycleEvent(req, {
        eventType: 'FOLLOW_UP_REQUIRED',
        actor: params.actor,
        note: 'Linked P1-009 re-evaluation still blocks or requires review for one or more affected conclusions.',
        evidenceRefs: req.responseEvidenceRefs || [],
        decisionId: params.decisionId,
      });
    }
    this.persistClarificationsToDisk();
    return req;
  }

  public respondToClarification(
    requestId: string,
    responsePayload: {
      respondedBy: string;
      selectedOption?: string;
      narrativeExplanation: string;
      supportingDocumentFilenames?: string[];
    }
  ): ProfessionalClarificationRequest {
    return this.recordClarificationResponse(requestId, responsePayload, { resolveImmediately: true });
  }
"""
if old_api not in text: raise SystemExit('professional api block missing')
text=text.replace(old_api,new_api,1)
p.write_text(text)

Path('server/cpaOrganization/sufficiencyClarificationCoordinator.ts').write_text('''import {\n  ProfessionalClarificationEngine,\n  professionalClarificationEngine,\n  type ProfessionalClarificationRequest,\n  type ClarificationOption,\n} from './professionalClarificationEngine.js';\nimport {\n  TaskEvidenceSufficiencyEngine,\n  taskEvidenceSufficiencyEngine,\n  type TaskEvidenceSufficiencyDecision,\n} from './taskEvidenceSufficiencyEngine.js';\n\nconst CLIENT_EVIDENCE_GAP_TYPES = new Set([\n  'MISSING_PAGE', 'MISSING_SECTION', 'MISSING_TRANSACTION_RANGE', 'UNREADABLE_REGION',\n  'OCR_UNCERTAINTY', 'UNSUPPORTED_ELEMENT', 'SOURCE_NOT_PROVIDED',\n  'REQUIRED_EVIDENCE_CAPABILITY_MISSING',\n]);\n\nfunction unique(values: string[]): string[] { return [...new Set(values.filter(Boolean))]; }\nfunction conclusionLabels(decision: TaskEvidenceSufficiencyDecision, ids: string[]): string[] {\n  return ids.map(id => decision.task.conclusions.find(c => c.conclusionId === id)?.label || id);\n}\n\nexport class SufficiencyClarificationCoordinator {\n  constructor(\n    private readonly clarificationEngine: ProfessionalClarificationEngine = professionalClarificationEngine,\n    private readonly sufficiencyEngine: TaskEvidenceSufficiencyEngine = taskEvidenceSufficiencyEngine,\n  ) {}\n\n  private buildOptions(kind: ProfessionalClarificationRequest['requestKind']): ClarificationOption[] {\n    if (kind === 'PBC_EVIDENCE_REQUEST') return [\n      { optionKey: 'PROVIDE_REQUESTED_EVIDENCE', label: 'Provide requested evidence', accountingConsequence: 'Response becomes evidence and P1-009 must be re-evaluated before any blocked conclusion is released.', evidenceSupport: 'Attach/source the authoritative document, page, schedule, or other evidence.' },\n      { optionKey: 'EVIDENCE_UNAVAILABLE', label: 'Evidence is unavailable', accountingConsequence: 'Affected conclusions remain blocked or review-required unless alternative evidence establishes sufficiency.', evidenceSupport: 'Explain why the source cannot be provided and identify any alternative authoritative evidence.' },\n    ];\n    return [\n      { optionKey: 'NON_MATERIAL_TO_TASK', label: 'Gap is non-material to this task', accountingConsequence: 'May support proceeding with disclosed gap only after P1-009 re-evaluation.', evidenceSupport: 'Document structural/task reasoning and supporting evidence.' },\n      { optionKey: 'MATERIAL_TO_TASK', label: 'Gap is material to this task', accountingConsequence: 'Affected conclusion remains blocked pending evidence.', evidenceSupport: 'Identify the affected conclusion/capability and materiality basis.' },\n      { optionKey: 'REQUEST_CLIENT_EVIDENCE', label: 'Client evidence is needed', accountingConsequence: 'Convert/follow with a PBC evidence request.', evidenceSupport: 'Identify the exact source evidence required.' },\n    ];\n  }\n\n  public createRequestsForDecision(decisionId: string, params: { createdBy?: string; projectId?: string; dueAt?: string } = {}): ProfessionalClarificationRequest[] {\n    const decision = this.sufficiencyEngine.getDecision(decisionId);\n    if (!decision) throw new Error(`SUFFICIENCY_DECISION_NOT_FOUND:${decisionId}`);\n    if (!decision.clarificationRecommended) return [];\n    const actionable = decision.gapAssessments.filter(a => a.affectsCurrentTask && (a.derivedMateriality === 'MATERIAL' || a.derivedMateriality === 'UNKNOWN'));\n    const existing = this.clarificationEngine.getAllClarifications();\n    const created: ProfessionalClarificationRequest[] = [];\n    for (const assessment of actionable) {\n      const gap = decision.gaps.find(g => g.gapId === assessment.gapId); if (!gap) continue;\n      const duplicate = existing.find(req => req.status !== 'WITHDRAWN' && req.sufficiencyLink?.sourceDecisionId === decisionId && req.sufficiencyLink.gapIds.includes(gap.gapId));\n      if (duplicate) { created.push(duplicate); continue; }\n      const labels = conclusionLabels(decision, assessment.affectedConclusionIds);\n      const isPbc = assessment.derivedMateriality === 'MATERIAL' && CLIENT_EVIDENCE_GAP_TYPES.has(gap.gapType);\n      const requestKind: ProfessionalClarificationRequest['requestKind'] = assessment.derivedMateriality === 'UNKNOWN' ? 'INTERNAL_MATERIALITY_REVIEW' : isPbc ? 'PBC_EVIDENCE_REQUEST' : 'CPA_REVIEW';\n      const assignedTo = requestKind === 'PBC_EVIDENCE_REQUEST' ? 'CLIENT_CONTROLLER' : requestKind === 'CPA_REVIEW' ? 'CPA_PARTNER' : 'AUDIT_MANAGER';\n      const evidenceRefs = unique([...decision.evidenceRefs, ...(gap.evidenceRefs || [])]);\n      const question = requestKind === 'PBC_EVIDENCE_REQUEST' ? `Please provide authoritative evidence needed to resolve this source gap: ${gap.description}` : `Please determine whether this source gap is material to the current task before Eve proceeds: ${gap.description}`;\n      created.push(this.clarificationEngine.createClarificationRequest({\n        type: requestKind === 'PBC_EVIDENCE_REQUEST' ? 'MISSING_EVIDENCE' : 'OTHER', projectId: params.projectId || decision.task.workspaceId || decision.task.engagementId || 'UNSCOPED_PROJECT', engagementId: decision.task.engagementId || decision.task.workspaceId || 'UNSCOPED_ENGAGEMENT',\n        createdBy: params.createdBy || 'EVE_CLARA', assignedTo, requestKind, dueAt: params.dueAt, question,\n        whyItMatters: `P1-009 decision ${decision.decisionId} identified this gap as ${assessment.derivedMateriality}. Affected conclusions: ${labels.join('; ') || 'not recorded'}. The gap must remain explicit until re-evaluation.`,\n        evidenceAvailable: evidenceRefs, conflictingEvidence: assessment.rationale, confidence: typeof gap.confidence === 'number' ? gap.confidence : (assessment.derivedMateriality === 'MATERIAL' ? 1 : 0.5),\n        potentialFinancialImpact: `Not quantified by this sufficiency decision. Affected conclusions: ${labels.join('; ') || 'not recorded'}.`, potentialReportImpact: assessment.derivedMateriality === 'MATERIAL' ? 'One or more affected conclusions are blocked pending sufficient evidence.' : 'One or more affected conclusions require materiality review before release.',\n        options: this.buildOptions(requestKind), status: 'PENDING_INTERNAL_REVIEW', supportingDocumentIds: [],\n        sufficiencyLink: { sourceDecisionId: decision.decisionId, sourceDecisionHash: decision.decisionHash, sourceTaskId: decision.task.taskId, gapIds: [gap.gapId], affectedConclusionIds: [...assessment.affectedConclusionIds], sourceEvidenceRefs: evidenceRefs, materialityAtCreation: assessment.derivedMateriality, reevaluationDecisionIds: [], unresolvedGapIds: [gap.gapId], resolvedGapIds: [] },\n      }));\n    }\n    return created;\n  }\n\n  public markSubmitted(requestId: string, actor: string) { return this.clarificationEngine.markSubmittedToClient(requestId, actor); }\n  public recordResponse(requestId: string, payload: { respondedBy: string; selectedOption?: string; narrativeExplanation: string; supportingDocumentFilenames?: string[]; supportingDocumentIds?: string[]; evidenceRefs?: string[] }) { return this.clarificationEngine.recordClarificationResponse(requestId, payload, { resolveImmediately: false }); }\n  public linkReevaluation(requestId: string, reevaluationDecisionId: string, actor: string) {\n    const req = this.clarificationEngine.getClarification(requestId); if (!req) throw new Error(`CLARIFICATION_NOT_FOUND:${requestId}`);\n    const link = req.sufficiencyLink; if (!link) throw new Error('CLARIFICATION_NOT_LINKED_TO_SUFFICIENCY_DECISION');\n    const original = this.sufficiencyEngine.getDecision(link.sourceDecisionId); const next = this.sufficiencyEngine.getDecision(reevaluationDecisionId);\n    if (!original) throw new Error(`SOURCE_SUFFICIENCY_DECISION_NOT_FOUND:${link.sourceDecisionId}`); if (!next) throw new Error(`REEVALUATION_DECISION_NOT_FOUND:${reevaluationDecisionId}`);\n    if (next.task.taskId !== link.sourceTaskId) throw new Error('REEVALUATION_TASK_MISMATCH');\n    if (original.task.engagementId && next.task.engagementId !== original.task.engagementId) throw new Error('REEVALUATION_ENGAGEMENT_MISMATCH');\n    if (original.task.workspaceId && next.task.workspaceId !== original.task.workspaceId) throw new Error('REEVALUATION_WORKSPACE_MISMATCH');\n    if (next.createdAt < original.createdAt) throw new Error('REEVALUATION_PRECEDES_SOURCE_DECISION');\n    const affected = link.affectedConclusionIds.map(id => next.conclusionAssessments.find(c => c.conclusionId === id)); if (affected.some(v => !v)) throw new Error('REEVALUATION_MISSING_AFFECTED_CONCLUSION');\n    const allAllowed = affected.every(v => v?.state === 'ALLOWED');\n    const unresolvedGapIds = allAllowed ? [] : link.gapIds.filter(gapId => { const assessment = next.gapAssessments.find(a => a.gapId === gapId); return !assessment || assessment.derivedMateriality !== 'NON_MATERIAL'; });\n    const resolvedGapIds = link.gapIds.filter(id => !unresolvedGapIds.includes(id));\n    return this.clarificationEngine.applySufficiencyReevaluation(requestId, { decisionId: next.decisionId, actor, allAffectedConclusionsAllowed: allAllowed, resolvedGapIds, unresolvedGapIds, note: `P1-009 re-evaluation ${next.decisionId}: ${affected.map(v => `${v?.conclusionId}=${v?.state}`).join(', ')}` });\n  }\n}\nexport const sufficiencyClarificationCoordinator = new SufficiencyClarificationCoordinator();\n''')

edit('server/cpaOrganization/cpaOrganizationRoutes.ts',
"import { taskEvidenceSufficiencyEngine, type SourceEvidenceGap } from './taskEvidenceSufficiencyEngine.js';\n",
"import { taskEvidenceSufficiencyEngine, type SourceEvidenceGap } from './taskEvidenceSufficiencyEngine.js';\nimport { professionalClarificationEngine } from './professionalClarificationEngine.js';\nimport { sufficiencyClarificationCoordinator } from './sufficiencyClarificationCoordinator.js';\n")

route_insert='''\n\n  // 36. Professional Clarification / PBC lifecycle linked to P1-009 (P1-010)\n  router.get('/professional-clarifications', async (req: Request, res: Response) => { const authContext = await resolveServerAuthContext(req); if (!authContext.authenticatedPrincipalId) return res.status(401).json({ error: 'UNAUTHENTICATED: Professional clarifications require authenticated server context.' }); if (!authContext.isInternalOperator) return res.status(403).json({ error: 'FORBIDDEN: Professional clarification listing requires internal operator authority.' }); const requests = professionalClarificationEngine.getAllClarifications({ engagementId: req.query.engagementId ? String(req.query.engagementId) : undefined, status: req.query.status ? String(req.query.status) as any : undefined, type: req.query.type ? String(req.query.type) as any : undefined }); return res.json({ success: true, requests, total: requests.length }); });\n  router.get('/professional-clarifications/:requestId', async (req: Request, res: Response) => { const authContext = await resolveServerAuthContext(req); if (!authContext.authenticatedPrincipalId) return res.status(401).json({ error: 'UNAUTHENTICATED: Professional clarification requires authenticated server context.' }); if (!authContext.isInternalOperator) return res.status(403).json({ error: 'FORBIDDEN: Professional clarification read requires internal operator authority.' }); const request = professionalClarificationEngine.getClarification(String(req.params.requestId || '')); if (!request) return res.status(404).json({ error: 'Professional clarification not found.' }); return res.json({ success: true, request }); });\n  router.post('/professional-clarifications/from-sufficiency/:decisionId', async (req: Request, res: Response) => { try { const authContext = await resolveServerAuthContext(req); if (!authContext.authenticatedPrincipalId) return res.status(401).json({ error: 'UNAUTHENTICATED: Clarification creation requires authenticated server context.' }); if (!authContext.isInternalOperator) return res.status(403).json({ error: 'FORBIDDEN: Clarification creation requires internal operator authority.' }); const requests = sufficiencyClarificationCoordinator.createRequestsForDecision(String(req.params.decisionId || ''), { createdBy: authContext.authenticatedPrincipalId, projectId: req.body?.projectId ? String(req.body.projectId) : undefined, dueAt: req.body?.dueAt ? String(req.body.dueAt) : undefined }); return res.json({ success: true, requests, total: requests.length }); } catch (err: any) { return res.status(400).json({ error: err?.message || 'Failed to create clarification from sufficiency decision.' }); } });\n  router.post('/professional-clarifications/:requestId/submit', async (req: Request, res: Response) => { try { const authContext = await resolveServerAuthContext(req); if (!authContext.authenticatedPrincipalId) return res.status(401).json({ error: 'UNAUTHENTICATED: PBC submission state requires authenticated server context.' }); if (!authContext.isInternalOperator) return res.status(403).json({ error: 'FORBIDDEN: PBC submission state requires internal operator authority.' }); const request = sufficiencyClarificationCoordinator.markSubmitted(String(req.params.requestId || ''), authContext.authenticatedPrincipalId); return res.json({ success: true, request }); } catch (err: any) { return res.status(400).json({ error: err?.message || 'Failed to mark PBC submitted.' }); } });\n  router.post('/professional-clarifications/:requestId/respond', async (req: Request, res: Response) => { try { const authContext = await resolveServerAuthContext(req); if (!authContext.authenticatedPrincipalId) return res.status(401).json({ error: 'UNAUTHENTICATED: Clarification response requires authenticated server context.' }); const existing = professionalClarificationEngine.getClarification(String(req.params.requestId || '')); if (!existing) return res.status(404).json({ error: 'Professional clarification not found.' }); const engagementAuthorized = authContext.isInternalOperator || (authContext.authorizedEngagements || []).includes(existing.engagementId); if (!engagementAuthorized) return res.status(403).json({ error: 'FORBIDDEN: Principal is not authorized for this clarification engagement.' }); const request = sufficiencyClarificationCoordinator.recordResponse(existing.requestId, { respondedBy: authContext.authenticatedPrincipalId, selectedOption: req.body?.selectedOption ? String(req.body.selectedOption) : undefined, narrativeExplanation: String(req.body?.narrativeExplanation || ''), supportingDocumentFilenames: Array.isArray(req.body?.supportingDocumentFilenames) ? req.body.supportingDocumentFilenames.map(String) : undefined, supportingDocumentIds: Array.isArray(req.body?.supportingDocumentIds) ? req.body.supportingDocumentIds.map(String) : undefined, evidenceRefs: Array.isArray(req.body?.evidenceRefs) ? req.body.evidenceRefs.map(String) : undefined }); return res.json({ success: true, request, reevaluationRequired: true }); } catch (err: any) { return res.status(400).json({ error: err?.message || 'Failed to record clarification response.' }); } });\n  router.post('/professional-clarifications/:requestId/link-reevaluation', async (req: Request, res: Response) => { try { const authContext = await resolveServerAuthContext(req); if (!authContext.authenticatedPrincipalId) return res.status(401).json({ error: 'UNAUTHENTICATED: Clarification re-evaluation link requires authenticated server context.' }); if (!authContext.isInternalOperator) return res.status(403).json({ error: 'FORBIDDEN: Clarification re-evaluation link requires internal operator authority.' }); const decisionId = String(req.body?.decisionId || '').trim(); if (!decisionId) return res.status(400).json({ error: 'decisionId is required.' }); const request = sufficiencyClarificationCoordinator.linkReevaluation(String(req.params.requestId || ''), decisionId, authContext.authenticatedPrincipalId); return res.json({ success: true, request, resolved: request.status === 'RESOLVED' }); } catch (err: any) { return res.status(400).json({ error: err?.message || 'Failed to link clarification re-evaluation.' }); } });\n'''
edit('server/cpaOrganization/cpaOrganizationRoutes.ts', "\n  return router;\n}\n", route_insert+"\n  return router;\n}\n")

Path('server/tests/sufficiencyClarificationCoordinator.test.ts').write_text("""import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport os from 'node:os';\nimport path from 'node:path';\nimport { ProfessionalClarificationEngine } from '../cpaOrganization/professionalClarificationEngine.js';\nimport { TaskEvidenceSufficiencyEngine } from '../cpaOrganization/taskEvidenceSufficiencyEngine.js';\nimport { SufficiencyClarificationCoordinator } from '../cpaOrganization/sufficiencyClarificationCoordinator.js';\nconst root = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-p1010-')); const suff = new TaskEvidenceSufficiencyEngine(path.join(root, 'suff')); const clar = new ProfessionalClarificationEngine(path.join(root, 'clar')); const coord = new SufficiencyClarificationCoordinator(clar, suff);\nconst task = { taskId: 'task-bank-recon', taskType: 'BANK_RECONCILIATION', purpose: 'Establish ending cash and complete transaction population.', workspaceId: 'ws-p1010', engagementId: 'eng-p1010', availableCapabilities: ['BANK_ENDING_BALANCE', 'TRANSACTION_LEDGER'], conclusions: [{ conclusionId: 'cash', label: 'Ending cash', requiredCapabilities: ['BANK_ENDING_BALANCE'] }, { conclusionId: 'ledger', label: 'Complete transaction ledger', requiredCapabilities: ['TRANSACTION_LEDGER'], requiresCompletePopulation: true }] };\nconst material = suff.evaluate({ task, persist: true, gaps: [{ gapId: 'gap-missing-transactions', gapType: 'MISSING_TRANSACTION_RANGE', description: 'Pages 4-5 containing transactions are missing.', affectedCapabilities: ['TRANSACTION_LEDGER'], evidenceRefs: ['doc-bank-p4-p5'], signals: { continuity: 'BROKEN', reconciliation: 'FAIL', structuralRelevance: 'RELEVANT_TO_TASK' } }] });\nconst first = coord.createRequestsForDecision(material.decisionId, { createdBy: 'test-operator' }); assert.equal(first.length,1); assert.equal(first[0].requestKind,'PBC_EVIDENCE_REQUEST'); assert.equal(first[0].assignedTo,'CLIENT_CONTROLLER'); assert.deepEqual(first[0].sufficiencyLink?.affectedConclusionIds,['ledger']);\nconst again = coord.createRequestsForDecision(material.decisionId,{createdBy:'test-operator'}); assert.equal(again[0].requestId,first[0].requestId); assert.equal(clar.getAllClarifications().length,1);\nassert.throws(()=>coord.recordResponse(first[0].requestId,{respondedBy:'client',narrativeExplanation:'Attached.'}),/PBC_RESPONSE_REJECTED_BEFORE_SUBMISSION/); coord.markSubmitted(first[0].requestId,'operator'); const responded=coord.recordResponse(first[0].requestId,{respondedBy:'client',narrativeExplanation:'Attached pages.',supportingDocumentIds:['doc-pages'],evidenceRefs:['prov-pages']}); assert.equal(responded.status,'RESPONSE_RECEIVED');\nconst stillBlocked=suff.evaluate({task,persist:true,gaps:[{gapId:'gap-missing-transactions',gapType:'MISSING_TRANSACTION_RANGE',description:'Still blocked.',affectedCapabilities:['TRANSACTION_LEDGER'],evidenceRefs:['doc-pages'],signals:{continuity:'BROKEN',reconciliation:'FAIL',structuralRelevance:'RELEVANT_TO_TASK'}}]}); const followed=coord.linkReevaluation(first[0].requestId,stillBlocked.decisionId,'reviewer'); assert.notEqual(followed.status,'RESOLVED');\nconst cleared=suff.evaluate({task,persist:true}); const resolved=coord.linkReevaluation(first[0].requestId,cleared.decisionId,'reviewer'); assert.equal(resolved.status,'RESOLVED');\nconst unknown=suff.evaluate({task,persist:true,gaps:[{gapId:'gap-unknown-page',gapType:'MISSING_PAGE',description:'Unknown page.',affectedCapabilities:[],explicitMateriality:'UNKNOWN',evidenceRefs:['page-index'],signals:{structuralRelevance:'UNKNOWN',continuity:'UNKNOWN',reconciliation:'NOT_RUN'}}]}); const reviews=coord.createRequestsForDecision(unknown.decisionId,{createdBy:'operator'}); assert.equal(reviews[0].requestKind,'INTERNAL_MATERIALITY_REVIEW'); assert.throws(()=>coord.markSubmitted(reviews[0].requestId,'operator'),/ONLY_PBC_EVIDENCE_REQUESTS/);\nconst other=suff.evaluate({task:{...task,taskId:'different-task'},persist:true}); assert.throws(()=>coord.linkReevaluation(reviews[0].requestId,other.decisionId,'reviewer'),/REEVALUATION_TASK_MISMATCH/);\nconst legacy=clar.createClarificationRequest({type:'OTHER',projectId:'legacy',engagementId:'legacy',createdBy:'legacy',assignedTo:'AUDIT_MANAGER',question:'Legacy?',whyItMatters:'Compatibility',evidenceAvailable:[],conflictingEvidence:[],confidence:1,potentialFinancialImpact:'None',potentialReportImpact:'None',options:[],status:'PENDING_INTERNAL_REVIEW',supportingDocumentIds:[]}); assert.equal(clar.respondToClarification(legacy.requestId,{respondedBy:'legacy-reviewer',narrativeExplanation:'Resolved.'}).status,'RESOLVED'); fs.rmSync(root,{recursive:true,force:true}); console.log('SUFFICIENCY_CLARIFICATION_COORDINATOR_TESTS=PASS');\n""")

Path('server/tests/sufficiencyClarificationRoutes.test.ts').write_text("""import assert from 'node:assert/strict';\nimport { createCPAOrganizationRouter } from '../cpaOrganization/cpaOrganizationRoutes.js';\nimport { taskEvidenceSufficiencyEngine } from '../cpaOrganization/taskEvidenceSufficiencyEngine.js';\nimport { hermesHeartbeat } from '../cpaOrganization/hermesHeartbeat.js';\nfunction handler(path:string,method:'get'|'post'){const router=createCPAOrganizationRouter();const layer=(router as any).stack.find((x:any)=>x.route?.path===path&&x.route?.methods?.[method]);const fn=layer?.route?.stack?.[0]?.handle;if(!fn)throw new Error(`ROUTE_NOT_FOUND:${method}:${path}`);return fn;} function rr(params:{body?:any;query?:any;params?:any;user?:any}={}){const req:any={body:params.body||{},query:params.query||{},params:params.params||{},user:params.user,headers:{},socket:{remoteAddress:'127.0.0.1'}};let code=200,payload:any;const res:any={status(c:number){code=c;return res},json(d:any){payload=d;return res},get statusCode(){return code},get payload(){return payload}};return{req,res}}\nconst internal={id:'p1010-operator',sessionId:'p1010-session',role:'INTERNAL_OPERATOR',claims:['INTERNAL_OPERATOR'],isHuman:true}; const create=handler('/professional-clarifications/from-sufficiency/:decisionId','post'); const submit=handler('/professional-clarifications/:requestId/submit','post'); const respond=handler('/professional-clarifications/:requestId/respond','post'); const link=handler('/professional-clarifications/:requestId/link-reevaluation','post');\nconst task={taskId:'route-task-p1010',taskType:'BANK_RECON',purpose:'Reconstruct transaction population.',workspaceId:'ws-route-p1010',engagementId:'eng-route-p1010',availableCapabilities:['TRANSACTION_LEDGER'],conclusions:[{conclusionId:'ledger',label:'Complete ledger',requiredCapabilities:['TRANSACTION_LEDGER'],requiresCompletePopulation:true}]}; const decision=taskEvidenceSufficiencyEngine.evaluate({task,persist:true,gaps:[{gapId:'route-gap',gapType:'MISSING_TRANSACTION_RANGE',description:'Missing transaction page.',affectedCapabilities:['TRANSACTION_LEDGER'],evidenceRefs:['route-evidence'],signals:{continuity:'BROKEN',reconciliation:'FAIL',structuralRelevance:'RELEVANT_TO_TASK'}}]});\n{const{req,res}=rr({params:{decisionId:decision.decisionId}});await create(req,res);assert.equal(res.statusCode,401)} let requestId=''; {const{req,res}=rr({params:{decisionId:decision.decisionId},user:internal});await create(req,res);assert.equal(res.statusCode,200);requestId=res.payload.requests[0].requestId} {const{req,res}=rr({params:{requestId},user:internal});await submit(req,res);assert.equal(res.statusCode,200)} {const{req,res}=rr({params:{requestId},user:internal,body:{respondedBy:'spoof',narrativeExplanation:'Evidence attached.',supportingDocumentIds:['doc-response']}});await respond(req,res);assert.equal(res.statusCode,200);assert.equal(res.payload.request.response.respondedBy,'p1010-operator');assert.equal(res.payload.request.status,'RESPONSE_RECEIVED')} const cleared=taskEvidenceSufficiencyEngine.evaluate({task,persist:true}); {const{req,res}=rr({params:{requestId},user:internal,body:{decisionId:cleared.decisionId}});await link(req,res);assert.equal(res.statusCode,200);assert.equal(res.payload.resolved,true)} hermesHeartbeat.stopHeartbeat(); console.log('SUFFICIENCY_CLARIFICATION_ROUTES_TESTS=PASS'); setTimeout(()=>process.exit(0),0);\n""")
