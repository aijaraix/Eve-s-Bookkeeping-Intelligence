/**
 * EVE AUTONOMOUS CPA ORGANIZATION — SYNTHETIC ENGAGEMENT & REVIEW ENGINE (Phase H.9.21)
 * 
 * Manages:
 * 1. Synthetic Client Personas (created by Minerva with private scenario instructions).
 * 2. Clara's PBC (Provided By Client) Request System & Follow-Up Lifecycle.
 * 3. Quinn's Independent Concurring Partner Review & Review Note System.
 * 4. 16-Stage Engagement Lifecycle State Machine.
 * 5. Document Versioning & Change Impact Analysis (TB v1 -> TB v2).
 * 6. Materiality Architecture.
 * 7. Engagement Twin Replayable History.
 * 8. Capability Request Registry.
 */

export type EngagementLifecycleStage =
  | 'ONBOARDING'
  | 'INITIAL_PBC'
  | 'DOCUMENTS_RECEIVED'
  | 'INGESTION'
  | 'EXTRACTION'
  | 'RECONCILIATION'
  | 'EVIDENCE_REVIEW'
  | 'CLIENT_FOLLOW_UP'
  | 'ADDITIONAL_DOCUMENTS'
  | 'REPROCESSING'
  | 'PREPARER_COMPLETE'
  | 'INTERNAL_REVIEW'
  | 'REVIEW_NOTES'
  | 'CLEARANCE'
  | 'REPORT_WIZARD'
  | 'FINAL_DELIVERABLE'
  | 'ENGAGEMENT_COMPLETE';

export type PBCRequestStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'RECEIVED'
  | 'PARTIAL'
  | 'INCORRECT_RESPONSE'
  | 'CLARIFICATION_REQUIRED'
  | 'VALIDATED'
  | 'CLEARED'
  | 'OVERDUE'
  | 'CANCELLED';

export interface PBCRequest {
  requestId: string;
  engagementId: string;
  requestedByAgent: string; // usually 'CLARA' or 'VERITAS'
  requestCategory: 'LEASES' | 'REVENUE' | 'DEBT_COVENANT' | 'CASH_CONFIRMATION' | 'TAX_SCHEDULE' | 'GENERAL_EVIDENCE';
  description: string;
  reason: string;
  materiality: 'MATERIAL' | 'SIGNIFICANT' | 'TRIVIAL';
  requestedDocuments: string[];
  requestedInformation: string;
  createdAt: string;
  dueDate: string;
  status: PBCRequestStatus;
  clientResponse?: string;
  attachments?: Array<{
    documentId: string;
    filename: string;
    version: string;
    uploadedAt: string;
  }>;
  receivedAt?: string;
  validatedBy?: string;
  clearedAt?: string;
  followUpCount: number;
}

export interface ReviewNote {
  reviewNoteId: string;
  engagementId: string;
  reviewer: string; // 'QUINN' (Independent Engagement Reviewer)
  subject: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  linkedFactIds: string[];
  linkedEvidence?: string;
  linkedReportSection?: string;
  assignedTo: string; // e.g. 'ATHENA', 'LEDGER', 'MERCURY', 'SCRIBE'
  createdAt: string;
  status: 'OPEN' | 'RESPONDED' | 'REOPENED' | 'CLEARED';
  response?: string;
  clearedBy?: string;
  clearedAt?: string;
}

export interface SyntheticClientPersona {
  personaId: string;
  name: string;
  title: string;
  companyName: string;
  email: string;
  responsiveness: 'COOPERATIVE' | 'PARTIAL' | 'DELAYED' | 'CONFUSED';
  privateInstructions: string; // Sealed from solver team
  clientName?: string;
  primaryContact?: string;
  contactEmail?: string;
  industry?: string;
  accountingFramework?: string;
  tone?: string;
  accountingSophistication?: string;
  recordsQuality?: string;
  privateScenarioInstructions?: string;
}

export interface EngagementMateriality {
  overallMateriality: number;
  performanceMateriality: number;
  clearlyTrivialThreshold: number;
  accountSpecificMateriality: Record<string, number>;
  currency: string;
}

export interface CapabilityRequest {
  capabilityRequestId: string;
  requestingAgent: string;
  engagementId: string;
  type: 'TOOL' | 'SKILL' | 'PARSER' | 'MODEL' | 'DATA_SOURCE' | 'UI' | 'REPORT_TEMPLATE' | 'WORKFLOW' | 'ACCOUNTING_RULE' | 'INTEGRATION' | 'INFRASTRUCTURE';
  problem: string;
  evidence: string;
  failureFrequency: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKER';
  proposedSolution: string;
  expectedBenefit: string;
  estimatedRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PROPOSED' | 'TRIAGED' | 'ACCEPTED_FOR_RESEARCH' | 'REJECTED' | 'SANDBOX' | 'BENCHMARKING' | 'APPROVED' | 'PROMOTED';
  createdAt: string;
}

export interface EngagementTwin {
  twinId: string;
  engagementId: string;
  clientName: string;
  persona: SyntheticClientPersona;
  currentStage: EngagementLifecycleStage;
  stageHistory: Array<{ stage: EngagementLifecycleStage; timestamp: string }>;
  pbcRequests: PBCRequest[];
  reviewNotes: ReviewNote[];
  materiality: EngagementMateriality;
  documentVersions: Array<{
    documentId: string;
    title: string;
    version: string;
    supersededVersion?: string;
    sha256: string;
    sizeBytes?: number;
    uploadedAt: string;
  }>;
  changeImpactHistory: Array<{
    timestamp: string;
    trigger: string;
    affectedFactsCount: number;
    affectedRatiosCount: number;
    affectedChartsCount: number;
    affectedReportsCount: number;
  }>;
  capabilityRequests: CapabilityRequest[];
  minervaScore?: {
    overallScore: number;
    numericIntegrity: number;
    evidenceIntegrity: number;
    pbcQuality: number;
    reviewEfficacy: number;
    reportIntegrity: number;
  };
}

export class SyntheticEngagementEngine {
  private static instance: SyntheticEngagementEngine | null = null;
  private twins: Map<string, EngagementTwin> = new Map();
  private capabilityRegistry: CapabilityRequest[] = [];

  private constructor() {
    this.seedCanarySimulation();
  }

  public static getInstance(): SyntheticEngagementEngine {
    if (!SyntheticEngagementEngine.instance) {
      SyntheticEngagementEngine.instance = new SyntheticEngagementEngine();
    }
    return SyntheticEngagementEngine.instance;
  }

  /**
   * Seeds the authoritative H.9.21 Canary Simulation engagement twin.
   */
  private seedCanarySimulation() {
    const engagementId = 'eng-sim-canary-01';
    const now = new Date().toISOString();

    const persona: SyntheticClientPersona = {
      personaId: 'persona-cfo-maria',
      name: 'Maria von Braun',
      title: 'Chief Financial Officer',
      companyName: 'AeroTech Dynamics GmbH (Academy Case)',
      email: 'm.vonbraun@aerotech-dynamics.academy',
      responsiveness: 'COOPERATIVE',
      privateInstructions: 'Withhold lease amortization schedule until Clara requests detailed IFRS 16 support.'
    };

    const materiality: EngagementMateriality = {
      overallMateriality: 2500000, // $2.5M
      performanceMateriality: 1875000, // $1.875M (75%)
      clearlyTrivialThreshold: 125000, // $125k (5%)
      accountSpecificMateriality: {
        leases: 500000,
        revenue: 1000000
      },
      currency: 'USD'
    };

    const pbc1: PBCRequest = {
      requestId: 'PBC-REQ-2026-001',
      engagementId,
      requestedByAgent: 'CLARA',
      requestCategory: 'LEASES',
      description: 'Executed Master Facility Lease Agreement & IFRS 16 Amortization Schedule',
      reason: 'Support recorded Right-of-Use Asset ($14.2M) and Lease Liability ($14.8M) on balance sheet.',
      materiality: 'MATERIAL',
      requestedDocuments: ['Master_Lease_Frankfurt_Facility.pdf', 'Lease_Amortization_Schedule_FY25.xlsx'],
      requestedInformation: 'Please provide the signed lease contract and interest rate implicit in the lease.',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: 'CLEARED',
      clientResponse: 'Provided signed Frankfurt lease contract and schedule from treasury.',
      attachments: [
        {
          documentId: 'doc-pbc-lease-01',
          filename: 'Master_Lease_Frankfurt_Facility.pdf',
          version: 'v1.0',
          uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ],
      receivedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      validatedBy: 'VERITAS',
      clearedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      followUpCount: 1
    };

    const rn1: ReviewNote = {
      reviewNoteId: 'RN-2026-001',
      engagementId,
      reviewer: 'QUINN',
      subject: 'Footnote Disclosure on Discount Rate Assumption',
      description: 'Workpaper W-14 reflects 4.5% incremental borrowing rate. Ensure sensitivity analysis footnote is drafted for final report.',
      severity: 'MEDIUM',
      linkedFactIds: ['fact-rou-asset', 'fact-lease-liab'],
      linkedReportSection: 'sec-notes-leases',
      assignedTo: 'ATHENA',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'CLEARED',
      response: 'Footnote Note 14 updated with 50bps discount rate sensitivity matrix.',
      clearedBy: 'QUINN',
      clearedAt: new Date(Date.now() - 1800000).toISOString()
    };

    const capReq1: CapabilityRequest = {
      capabilityRequestId: 'CAP-2026-01',
      requestingAgent: 'CLARA',
      engagementId,
      type: 'UI',
      problem: 'PBC client response status is visually unclear in rapid multi-item views',
      evidence: 'Observed during multi-document reconciliation pass on AeroTech case',
      failureFrequency: 3,
      severity: 'MEDIUM',
      proposedSolution: 'Introduce explicit badge styling for PARTIAL vs CLARIFICATION_REQUIRED states in portal UI',
      expectedBenefit: 'Reduces coordination latency by 35%',
      estimatedRisk: 'LOW',
      status: 'PROPOSED',
      createdAt: now
    };

    this.capabilityRegistry.push(capReq1);

    const twin: EngagementTwin = {
      twinId: 'twin-canary-01',
      engagementId,
      clientName: persona.companyName,
      persona,
      currentStage: 'FINAL_DELIVERABLE',
      stageHistory: [
        { stage: 'ONBOARDING', timestamp: new Date(Date.now() - 3600000 * 8).toISOString() },
        { stage: 'INITIAL_PBC', timestamp: new Date(Date.now() - 3600000 * 7).toISOString() },
        { stage: 'DOCUMENTS_RECEIVED', timestamp: new Date(Date.now() - 3600000 * 6).toISOString() },
        { stage: 'EXTRACTION', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
        { stage: 'RECONCILIATION', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
        { stage: 'CLIENT_FOLLOW_UP', timestamp: new Date(Date.now() - 3600000 * 3).toISOString() },
        { stage: 'ADDITIONAL_DOCUMENTS', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
        { stage: 'PREPARER_COMPLETE', timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString() },
        { stage: 'INTERNAL_REVIEW', timestamp: new Date(Date.now() - 3600000 * 1).toISOString() },
        { stage: 'CLEARANCE', timestamp: new Date(Date.now() - 1800000).toISOString() },
        { stage: 'REPORT_WIZARD', timestamp: new Date(Date.now() - 900000).toISOString() },
        { stage: 'FINAL_DELIVERABLE', timestamp: now }
      ],
      pbcRequests: [pbc1],
      reviewNotes: [rn1],
      materiality,
      documentVersions: [
        {
          documentId: 'doc-tb-v1',
          title: 'Trial_Balance_Initial.xlsx',
          version: 'v1.0',
          sha256: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
          uploadedAt: new Date(Date.now() - 3600000 * 6).toISOString()
        },
        {
          documentId: 'doc-tb-v2',
          title: 'Trial_Balance_Adjusted.xlsx',
          version: 'v2.0',
          supersededVersion: 'v1.0',
          sha256: 'f1e2d3c4b5a678901234567890abcdef1234567890abcdef1234567890abcdef',
          uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ],
      changeImpactHistory: [
        {
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          trigger: 'Receipt of Trial_Balance_Adjusted.xlsx v2.0',
          affectedFactsCount: 14,
          affectedRatiosCount: 3,
          affectedChartsCount: 2,
          affectedReportsCount: 1
        }
      ],
      capabilityRequests: [capReq1],
      minervaScore: {
        overallScore: 99.4,
        numericIntegrity: 100.0,
        evidenceIntegrity: 99.8,
        pbcQuality: 98.9,
        reviewEfficacy: 99.5,
        reportIntegrity: 100.0
      }
    };

    this.twins.set(engagementId, twin);
  }

  public createPracticeTwin(params: {
    engagementId: string;
    clientName: string;
    persona: SyntheticClientPersona;
    materiality?: Partial<EngagementMateriality>;
  }): EngagementTwin {
    const now = new Date().toISOString();
    const newTwin: EngagementTwin = {
      twinId: `twin-${params.engagementId}`,
      engagementId: params.engagementId,
      clientName: params.clientName,
      persona: params.persona,
      currentStage: 'ONBOARDING',
      stageHistory: [{ stage: 'ONBOARDING', timestamp: now }],
      pbcRequests: [],
      reviewNotes: [],
      materiality: {
        overallMateriality: params.materiality?.overallMateriality || 2000000,
        performanceMateriality: params.materiality?.performanceMateriality || 1500000,
        clearlyTrivialThreshold: params.materiality?.clearlyTrivialThreshold || 100000,
        accountSpecificMateriality: params.materiality?.accountSpecificMateriality || {},
        currency: params.materiality?.currency || 'USD'
      },
      documentVersions: [],
      changeImpactHistory: [],
      capabilityRequests: []
    };
    this.twins.set(params.engagementId, newTwin);
    return newTwin;
  }

  public recordMinervaScore(engagementId: string, score: NonNullable<EngagementTwin['minervaScore']>) {
    const twin = this.getEngagementTwin(engagementId);
    if (twin) {
      twin.minervaScore = score;
    }
  }

  public addDocumentVersion(engagementId: string, doc: {
    documentId: string;
    title: string;
    version: string;
    supersededVersion?: string;
    sha256: string;
    sizeBytes?: number;
    uploadedAt?: string;
  }) {
    const twin = this.getEngagementTwin(engagementId);
    if (twin) {
      twin.documentVersions.push({
        ...doc,
        uploadedAt: doc.uploadedAt || new Date().toISOString()
      });
    }
  }

  public addChangeImpact(engagementId: string, impact: {
    trigger: string;
    affectedFactsCount: number;
    affectedRatiosCount: number;
    affectedChartsCount: number;
    affectedReportsCount: number;
  }) {
    const twin = this.getEngagementTwin(engagementId);
    if (twin) {
      twin.changeImpactHistory.push({
        timestamp: new Date().toISOString(),
        ...impact
      });
    }
  }

  public getEngagementTwin(engagementId: string): EngagementTwin | undefined {
    return this.twins.get(engagementId) || Array.from(this.twins.values())[0];
  }

  public getAllTwins(): EngagementTwin[] {
    return Array.from(this.twins.values());
  }

  public getCapabilityRequests(): CapabilityRequest[] {
    return this.capabilityRegistry;
  }

  public createPBCRequest(req: Omit<PBCRequest, 'requestId' | 'createdAt' | 'followUpCount'>): PBCRequest {
    const pbc: PBCRequest = {
      ...req,
      requestId: `PBC-REQ-${Date.now()}`,
      createdAt: new Date().toISOString(),
      followUpCount: 0
    };

    const twin = this.getEngagementTwin(req.engagementId);
    if (twin) {
      twin.pbcRequests.push(pbc);
    }
    return pbc;
  }

  public submitClientResponse(params: {
    requestId: string;
    engagementId: string;
    response: string;
    attachmentName?: string;
    behaviorType?: 'COMPLETE_RESPONSE' | 'PARTIAL_RESPONSE' | 'WRONG_DOCUMENT' | 'WRONG_PERIOD' | 'CLARIFICATION_REQUIRED' | 'REVISED_RESPONSE' | 'DELAYED_RESPONSE';
  }): PBCRequest | undefined {
    const twin = this.getEngagementTwin(params.engagementId);
    if (!twin) return undefined;

    const pbc = twin.pbcRequests.find(p => p.requestId === params.requestId);
    if (!pbc) return undefined;

    const behavior = params.behaviorType || 'COMPLETE_RESPONSE';
    pbc.clientResponse = params.response;
    pbc.receivedAt = new Date().toISOString();

    if (behavior === 'PARTIAL_RESPONSE') {
      pbc.status = 'PARTIAL';
      pbc.followUpCount = (pbc.followUpCount || 0) + 1;
    } else if (behavior === 'WRONG_DOCUMENT' || behavior === 'WRONG_PERIOD') {
      pbc.status = 'INCORRECT_RESPONSE';
      pbc.followUpCount = (pbc.followUpCount || 0) + 1;
    } else if (behavior === 'CLARIFICATION_REQUIRED') {
      pbc.status = 'CLARIFICATION_REQUIRED';
      pbc.followUpCount = (pbc.followUpCount || 0) + 1;
    } else {
      pbc.status = 'RECEIVED';
    }

    if (params.attachmentName) {
      pbc.attachments = pbc.attachments || [];
      pbc.attachments.push({
        documentId: `doc-${Date.now()}`,
        filename: params.attachmentName,
        version: behavior === 'REVISED_RESPONSE' ? 'v2.0' : 'v1.0',
        uploadedAt: new Date().toISOString()
      });
    }

    return pbc;
  }

  public clearPBCRequest(requestId: string, engagementId: string, validatedBy: string = 'VERITAS'): PBCRequest | undefined {
    const twin = this.getEngagementTwin(engagementId);
    if (!twin) return undefined;

    const pbc = twin.pbcRequests.find(p => p.requestId === requestId);
    if (!pbc) return undefined;

    pbc.status = 'CLEARED';
    pbc.validatedBy = validatedBy;
    pbc.clearedAt = new Date().toISOString();
    return pbc;
  }

  public createReviewNote(note: Omit<ReviewNote, 'reviewNoteId' | 'createdAt'>): ReviewNote {
    const rn: ReviewNote = {
      ...note,
      reviewNoteId: `RN-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const twin = this.getEngagementTwin(note.engagementId);
    if (twin) {
      twin.reviewNotes.push(rn);
    }
    return rn;
  }

  public clearReviewNote(reviewNoteId: string, engagementId: string, responseText: string): ReviewNote | undefined {
    const twin = this.getEngagementTwin(engagementId);
    if (!twin) return undefined;

    const rn = twin.reviewNotes.find(r => r.reviewNoteId === reviewNoteId);
    if (!rn) return undefined;

    rn.status = 'CLEARED';
    rn.response = responseText;
    rn.clearedBy = 'QUINN';
    rn.clearedAt = new Date().toISOString();
    return rn;
  }

  public advanceStage(engagementId: string, nextStage: EngagementLifecycleStage): EngagementTwin | undefined {
    const twin = this.getEngagementTwin(engagementId);
    if (!twin) return undefined;

    twin.currentStage = nextStage;
    twin.stageHistory.push({
      stage: nextStage,
      timestamp: new Date().toISOString()
    });
    return twin;
  }
}

export const syntheticEngagementEngine = SyntheticEngagementEngine.getInstance();
