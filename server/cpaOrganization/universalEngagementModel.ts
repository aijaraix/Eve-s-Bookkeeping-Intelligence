/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — UNIVERSAL ENGAGEMENT MODEL
 * Phase H.9.31 Master Consolidation
 *
 * Implements the authoritative single engagement model abstraction uniting:
 * 1. Customer Engagements (commercial, billable, private client data)
 * 2. Academy Engagements (autonomous continuous practice & adversarial testing)
 * 3. Canary Engagements (full-pipeline verification)
 * 4. Regression Fixtures (deterministic speed checks)
 * 5. Demo Engagements (pre-configured showcase models)
 *
 * Absolute isolation principle:
 * - Customer work ALWAYS has preemptive priority.
 * - Academy / Synthetic work NEVER contaminates customer metrics or workpapers.
 * - Cross-engagement data leakage == 0.000.
 */

export type EngagementClassification =
  | 'CUSTOMER'
  | 'ACADEMY'
  | 'CANARY'
  | 'REGRESSION'
  | 'DEMO';

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
  | 'ENGAGEMENT_COMPLETE'
  | 'FAILED'
  | 'STALLED';

export interface UniversalMateriality {
  overallMateriality: number;
  performanceMateriality: number;
  clearlyTrivialThreshold: number;
  benchmarkBasis?: string;
  currency: string;
}

export interface UniversalEngagementSummary {
  engagementId: string;
  workspaceId?: string | null;
  classification: EngagementClassification;
  isCustomer: boolean;
  clientId: string;
  clientName: string;
  entityName: string;
  industry: string;
  jurisdiction: string;
  period: string;
  framework: 'US_GAAP' | 'IFRS' | 'TAX_STATUTORY' | 'CASH_BASIS';
  functionalCurrency: string;
  presentationCurrency: string;
  currentStage: EngagementLifecycleStage;
  stageProgressPercent: number;
  assignedPartner: string;
  assignedManager: string;
  leadAgents: string[];
  documentsCount: number;
  canonicalFactsCount: number;
  openPbcCount: number;
  clearedPbcCount: number;
  openReviewNotesCount: number;
  clearedReviewNotesCount: number;
  reportsGeneratedCount: number;
  latestReportId?: string;
  materiality: UniversalMateriality;
  startedAt: string;
  completedAt?: string;
  lastActivityAt: string;
  minervaOverallScore?: number;
  numericVariance: number;
  crossEngagementLeakageScore: number;
  notes?: string;
}

export interface UniversalEngagementDetail extends UniversalEngagementSummary {
  documents: Array<{
    documentId: string;
    filename: string;
    filesize: number;
    mimeType: string;
    sha256: string;
    classification: string;
    uploadedAt: string;
    pagesCount?: number;
  }>;
  facts?: Array<any>;
  financialFacts?: Array<any>;
  pbcRequests: Array<{
    requestId: string;
    requestedByAgent: string;
    category: string;
    description: string;
    materiality: string;
    status: 'OPEN' | 'PARTIAL' | 'SUBMITTED' | 'CLEARED' | 'REJECTED';
    clientResponse?: string;
    createdAt: string;
    clearedAt?: string;
  }>;
  reviewNotes: Array<{
    reviewNoteId: string;
    reviewer: string;
    subject: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'OPEN' | 'IN_PROGRESS' | 'CLEARED';
    assignedTo: string;
    response?: string;
    createdAt: string;
    clearedAt?: string;
  }>;
  reports: Array<{
    reportId: string;
    version: string;
    title: string;
    deliverableType: string;
    generatedAt: string;
    status: 'FINAL_CERTIFIED' | 'SUPERSEDED' | 'DRAFT';
    pdfPath?: string;
    xlsxPath?: string;
    csvPath?: string;
    jsonPath?: string;
    sha256?: string;
  }>;
  minervaEvaluation?: {
    overallScore: number;
    numericAccuracyScore: number;
    evidenceQualityScore: number;
    reportQualityScore: number;
    evaluatedAt: string;
    examiner: string;
  };
  modelCallsSummary?: {
    level0Deterministic: number;
    level1LocalQwen: number;
    level2FastCloud: number;
    level3HeavyCloud: number;
    estimatedCostUsd: number;
  };
}

/** Side-effect-free persisted projections. No simulation initialization on GET. */
export class UniversalEngagementManager {
  private static instance: UniversalEngagementManager | null = null;
  public static getInstance(): UniversalEngagementManager {
    return this.instance ||= new UniversalEngagementManager();
  }
  public async getAllEngagements(filters?: {classification?: EngagementClassification | 'ALL'; status?: 'ACTIVE' | 'COMPLETED' | 'NEEDS_ATTENTION' | 'ALL'; searchTerm?: string}): Promise<UniversalEngagementSummary[]> {
    const { readOwnerEngagements } = await import('./ownerEngagementReadModel.js');
    return readOwnerEngagements().filter(e => {
      if (filters?.classification && filters.classification !== 'ALL' && e.classification !== filters.classification) return false;
      if (filters?.status === 'COMPLETED' && e.currentStage !== 'ENGAGEMENT_COMPLETE') return false;
      if (filters?.status === 'ACTIVE' && ['ENGAGEMENT_COMPLETE', 'FAILED'].includes(e.currentStage)) return false;
      if (filters?.status === 'NEEDS_ATTENTION' && !e.openReviewNotesCount && !e.openPbcCount && e.currentStage !== 'STALLED') return false;
      const term = filters?.searchTerm?.toLowerCase();
      return !term || [e.clientName, e.entityName, e.engagementId].some(v => String(v).toLowerCase().includes(term));
    });
  }
  public async getEngagementDetail(id: string): Promise<UniversalEngagementDetail | null> {
    const { readOwnerEngagements } = await import('./ownerEngagementReadModel.js');
    const all = readOwnerEngagements();
    const exact = all.find(e => e.engagementId === id);
    if (exact) return exact;
    const scoped = all.filter(e => e.workspaceId === id);
    if (scoped.length > 1) throw new Error('ACCOUNTING_SCOPE_AMBIGUOUS: select engagementId');
    return scoped[0] || null;
  }
}
export const universalEngagementManager = UniversalEngagementManager.getInstance();
