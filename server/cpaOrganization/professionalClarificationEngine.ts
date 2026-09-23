/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — PROFESSIONAL CLARIFICATION WORKFLOW
 * Phase H.9.34 Master Consolidation
 *
 * Enforces Non-Negotiable Principle:
 * "NO MATERIAL AMBIGUITY MAY BE SILENTLY GUESSED."
 * "ASK RATHER THAN GUESS."
 *
 * Core Capabilities:
 * 1. Universal ProfessionalClarificationRequest
 * 2. 16 Standard Clarification Types (Entity, Period, Currency, Scale, Version, etc.)
 * 3. Live Customer Clarification (Clara coordination + CPA Authorization Policy)
 * 4. Academy Clarification Simulation (Minerva separation + realistic response personas)
 * 5. Comprehensive Audit Trail & Provenance Linkage
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type ClarificationType =
  | 'ENTITY_IDENTITY'
  | 'ENTITY_RELATIONSHIP'
  | 'PERIOD'
  | 'CURRENCY'
  | 'SCALE'
  | 'DOCUMENT_VERSION'
  | 'SOURCE_AUTHORITY'
  | 'CONSOLIDATION_SCOPE'
  | 'ACCOUNTING_TREATMENT'
  | 'CONTRACT_SCOPE'
  | 'OWNERSHIP'
  | 'COUNTERPARTY'
  | 'TAX_JURISDICTION'
  | 'REPORTING_FRAMEWORK'
  | 'MISSING_EVIDENCE'
  | 'OTHER';

export type ClarificationStatus =
  | 'DRAFT'
  | 'PENDING_INTERNAL_REVIEW'
  | 'SUBMITTED_TO_CLIENT'
  | 'RESPONSE_RECEIVED'
  | 'RESOLVED'
  | 'WITHDRAWN';

export type ClarificationRecipientRole =
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

export class ProfessionalClarificationEngine {
  private static instance: ProfessionalClarificationEngine | null = null;
  private storageDir: string;
  
  private requests = new Map<string, ProfessionalClarificationRequest>();

  public constructor(storageDir = process.env.EVE_CLARIFICATION_DIR || path.resolve('storage/cpa_memory/clarifications')) {
    this.storageDir = storageDir;
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    this.loadClarificationsFromDisk();
    // Non-negotiable (Doc 35): Production starts empty of customer truth.
    // Do NOT auto-seed clarifications on boot.
  }

  public static getInstance(): ProfessionalClarificationEngine {
    if (!ProfessionalClarificationEngine.instance) {
      ProfessionalClarificationEngine.instance = new ProfessionalClarificationEngine();
    }
    return ProfessionalClarificationEngine.instance;
  }

  private loadClarificationsFromDisk() {
    try {
      const filePath = path.join(this.storageDir, 'clarification_requests.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const list: ProfessionalClarificationRequest[] = JSON.parse(raw);
        for (const req of list) {
          this.requests.set(req.requestId, req);
        }
      }
    } catch (err) {
      console.warn('[ProfessionalClarificationEngine] Failed reading from disk:', err);
    }
  }

  private persistClarificationsToDisk() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(this.storageDir, 'clarification_requests.json'),
        JSON.stringify(Array.from(this.requests.values()), null, 2),
        'utf8'
      );
    } catch (err) {
      console.warn('[ProfessionalClarificationEngine] Failed saving to disk:', err);
    }
  }

  /**
   * Explicitly seeds synthetic demonstration clarifications for Academy/Regression testing only.
   * Never called automatically on production boot.
   */
  public seedSyntheticClarifications(classification: 'SYNTHETIC_ACADEMY' | 'REGRESSION' = 'SYNTHETIC_ACADEMY') {
    if (this.requests.size > 0) {
      return;
    }

    const baselineRequests: ProfessionalClarificationRequest[] = [
      {
        requestId: 'pcr-2025-001',
        type: 'ENTITY_IDENTITY',
        projectId: 'proj-vendor-review',
        engagementId: 'eng-vendor-2025',
        createdBy: 'EVE_ENTITY_RESOLVER',
        assignedTo: 'CLIENT_CONTROLLER',
        question: 'Is "ABC Telecom Ltd." the exact same corporate entity as "ABC Telecommunications Limited"?',
        whyItMatters: 'Material vendor payables of $450,000 are booked under ABC Telecom Ltd., while master service agreement specifies ABC Telecommunications Limited. Merging them affects intercompany elimination and 1099 statutory filings.',
        evidenceAvailable: [
          'Purchase Order #PO-8812 cites ABC Telecom Ltd. (Vendor ID #V-401)',
          'Vendor W-9 form on file references ABC Telecommunications Limited (EIN XX-XXX7890)'
        ],
        conflictingEvidence: [
          'Different corporate suffixes (Ltd. vs Limited)',
          'Different operating remittance addresses (Austin, TX vs Wilmington, DE)'
        ],
        confidence: 0.65,
        potentialFinancialImpact: '$450,000 AP balance reclassification risk',
        potentialReportImpact: 'Material footnote disclosure on related party / vendor concentration',
        options: [
          {
            optionKey: 'SAME_ENTITY',
            label: 'Confirmed Same Entity (Trade Name variant)',
            accountingConsequence: 'Consolidate vendor balances under primary EIN',
            evidenceSupport: 'Require updated vendor master confirmation letter'
          },
          {
            optionKey: 'DISTINCT_AFFILIATES',
            label: 'Distinct Corporate Affiliates',
            accountingConsequence: 'Maintain segregated vendor ledger and separate 1099 filings',
            evidenceSupport: 'Separate bank accounts and vendor tax IDs verified'
          }
        ],
        recommendedAnswer: 'DISTINCT_AFFILIATES until formal single-entity W-9 affidavit provided',
        status: 'SUBMITTED_TO_CLIENT',
        supportingDocumentIds: ['doc-w9-abc', 'doc-po-8812'],
        createdAt: '2026-03-05T10:00:00Z',
        updatedAt: '2026-03-05T10:00:00Z'
      },
      {
        requestId: 'pcr-2025-002',
        type: 'DOCUMENT_VERSION',
        projectId: 'proj-pltr-audit-2025',
        engagementId: 'eng-pltr-2025-annual',
        createdBy: 'QUINN_REVIEWER',
        assignedTo: 'AUDIT_MANAGER',
        question: 'Which Trial Balance version is authoritative for FY2025 close: TB_v3_Final.xlsx or TB_v4_AuditAdj.xlsx?',
        whyItMatters: 'TB_v4 includes a $4.2M adjusting journal entry for deferred stock-based compensation capitalization that TB_v3 omits.',
        evidenceAvailable: [
          'TB_v3_Final.xlsx uploaded Feb 10 with client signoff',
          'TB_v4_AuditAdj.xlsx uploaded Feb 14 by Senior Controller with memo'
        ],
        conflictingEvidence: [
          '$4,200,000 variance in Operating Expenses between schedules'
        ],
        confidence: 0.90,
        potentialFinancialImpact: '$4,200,000 Operating Income adjustment',
        potentialReportImpact: 'Draft Audit Report Section 4 footnote reconciliation',
        options: [
          {
            optionKey: 'USE_TB_V4',
            label: 'Authorize TB_v4_AuditAdj as Final Authoritative Baseline',
            accountingConsequence: 'Post AJE #14 to working trial balance with full audit trail',
            evidenceSupport: 'Controller email confirmation dated Feb 14'
          },
          {
            optionKey: 'REVERT_TB_V3',
            label: 'Maintain TB_v3 as Signed Off',
            accountingConsequence: 'Exclude unapproved audit adjustment',
            evidenceSupport: 'Prior CFO approval stamp'
          }
        ],
        recommendedAnswer: 'USE_TB_V4',
        status: 'RESOLVED',
        response: {
          respondedBy: 'Sarah Jenkins, CPA (Audit Manager)',
          respondedAt: '2026-02-16T14:30:00Z',
          selectedOption: 'USE_TB_V4',
          narrativeExplanation: 'Controller provided signed memo certifying TB_v4 reflects final audit adjustments agreed with EY LLP.',
          supportingDocumentFilenames: ['Audit_Adj_Memo_Signed.pdf']
        },
        supportingDocumentIds: ['doc-tb-v3', 'doc-tb-v4'],
        resolvedBy: 'Sarah Jenkins, CPA',
        resolvedAt: '2026-02-16T14:30:00Z',
        createdAt: '2026-02-15T09:00:00Z',
        updatedAt: '2026-02-16T14:30:00Z'
      }
    ];

    for (const req of baselineRequests) {
      this.requests.set(req.requestId, req);
    }
    this.persistClarificationsToDisk();
  }

  // --- PUBLIC APIS ---

  public getAllClarifications(filter?: {
    engagementId?: string;
    projectId?: string;
    status?: ClarificationStatus;
    type?: ClarificationType;
  }): ProfessionalClarificationRequest[] {
    let list = Array.from(this.requests.values());
    if (filter) {
      if (filter.engagementId) list = list.filter(r => r.engagementId === filter.engagementId);
      if (filter.projectId) list = list.filter(r => r.projectId === filter.projectId);
      if (filter.status) list = list.filter(r => r.status === filter.status);
      if (filter.type) list = list.filter(r => r.type === filter.type);
    }
    return list;
  }

  public getClarification(requestId: string): ProfessionalClarificationRequest | undefined {
    return this.requests.get(requestId);
  }

  private appendLifecycleEvent(req: ProfessionalClarificationRequest, event: Omit<ClarificationLifecycleEvent, 'eventId' | 'at'> & { at?: string }): void {
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
}

export const professionalClarificationEngine = ProfessionalClarificationEngine.getInstance();
