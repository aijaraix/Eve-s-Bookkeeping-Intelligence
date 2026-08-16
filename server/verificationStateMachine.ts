/**
 * Verification State Machine for Financial Fact Lineage & Customer Safety
 * Enforces strict, auditable, and deterministic state transitions.
 * Prevents UI misrepresentation (e.g., calling a PROPOSED fact "Verified").
 */

export type VerificationState =
  | 'PROPOSED'
  | 'VALIDATED'
  | 'VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONFLICTED';

export interface VerificationStateDefinition {
  state: VerificationState;
  assignedBy: string; // e.g. "AI Extraction Engine", "Deterministic Validation Rules", "Multi-Source Reconciler", "CPA / Auditor"
  evidenceRequired: string[];
  canAiAssign: boolean;
  canDeterministicAssign: boolean;
  humanReviewRequired: boolean;
  canDisplayOnDashboard: boolean;
  dashboardLabel: string;
  canUseInCalculations: boolean;
  canExportInReports: boolean;
}

export const VERIFICATION_STATE_REGISTRY: Record<VerificationState, VerificationStateDefinition> = {
  PROPOSED: {
    state: 'PROPOSED',
    assignedBy: 'AI & OCR Raw Extraction Engines',
    evidenceRequired: ['source_document_id', 'source_page', 'raw_text'],
    canAiAssign: true,
    canDeterministicAssign: false,
    humanReviewRequired: true,
    canDisplayOnDashboard: true,
    dashboardLabel: 'PROPOSED (Unverified - Review Required)',
    canUseInCalculations: false,
    canExportInReports: false
  },
  VALIDATED: {
    state: 'VALIDATED',
    assignedBy: 'Deterministic Rules & Parsing Engine',
    evidenceRequired: ['source_document_id', 'source_page', 'raw_text', 'normalized_value', 'parsing_pass'],
    canAiAssign: false,
    canDeterministicAssign: true,
    humanReviewRequired: false,
    canDisplayOnDashboard: true,
    dashboardLabel: 'System Validated',
    canUseInCalculations: true,
    canExportInReports: true
  },
  VERIFIED: {
    state: 'VERIFIED',
    assignedBy: 'Multi-Source Cross-Reference & Lineage Engine',
    evidenceRequired: [
      'source_document_id',
      'source_page',
      'raw_text',
      'normalized_value',
      'complete_lineage',
      'cross_reference_pass'
    ],
    canAiAssign: false,
    canDeterministicAssign: true,
    humanReviewRequired: false,
    canDisplayOnDashboard: true,
    dashboardLabel: 'Machine Verified (Complete Lineage)',
    canUseInCalculations: true,
    canExportInReports: true
  },
  APPROVED: {
    state: 'APPROVED',
    assignedBy: 'CPA Human Auditor / Lead System Audit Engine',
    evidenceRequired: ['complete_lineage', 'verification_pass', 'auditor_signature_or_system_signoff'],
    canAiAssign: false,
    canDeterministicAssign: false,
    humanReviewRequired: true,
    canDisplayOnDashboard: true,
    dashboardLabel: 'Approved (Audit Final)',
    canUseInCalculations: true,
    canExportInReports: true
  },
  REJECTED: {
    state: 'REJECTED',
    assignedBy: 'Sanity/Hallucination Guards or CPA Auditor',
    evidenceRequired: ['rejection_reason_or_rule_id'],
    canAiAssign: false,
    canDeterministicAssign: true,
    humanReviewRequired: false,
    canDisplayOnDashboard: false,
    dashboardLabel: 'REJECTED',
    canUseInCalculations: false,
    canExportInReports: false
  },
  CONFLICTED: {
    state: 'CONFLICTED',
    assignedBy: 'Discrepancy Engine',
    evidenceRequired: ['conflicting_fact_ids', 'delta_amount'],
    canAiAssign: false,
    canDeterministicAssign: true,
    humanReviewRequired: true,
    canDisplayOnDashboard: true,
    dashboardLabel: 'CONFLICTED (Discrepancy Warning)',
    canUseInCalculations: false,
    canExportInReports: false
  }
};

/**
 * Allowed State Transitions Matrix
 */
const ALLOWED_TRANSITIONS: Record<VerificationState, VerificationState[]> = {
  PROPOSED: ['VALIDATED', 'CONFLICTED', 'REJECTED', 'APPROVED'],
  VALIDATED: ['VERIFIED', 'CONFLICTED', 'REJECTED', 'APPROVED'],
  VERIFIED: ['APPROVED', 'CONFLICTED', 'REJECTED'],
  APPROVED: ['CONFLICTED', 'REJECTED'], // Can be disputed if conflicting facts emerge
  REJECTED: ['PROPOSED'], // Can be re-evaluated if manually overridden by CPA
  CONFLICTED: ['PROPOSED', 'VALIDATED', 'VERIFIED', 'APPROVED', 'REJECTED']
};

export class VerificationStateMachine {
  /**
   * Validates whether a transition from currentState to targetState is allowed.
   */
  public static canTransition(currentState: VerificationState, targetState: VerificationState): boolean {
    if (currentState === targetState) return true;
    const allowed = ALLOWED_TRANSITIONS[currentState];
    return allowed ? allowed.includes(targetState) : false;
  }

  /**
   * Transitions a fact to targetState if allowed and supported by evidence.
   */
  public static transitionState(
    currentState: VerificationState,
    targetState: VerificationState,
    factLineage: Record<string, any>
  ): { newState: VerificationState; success: boolean; reason?: string } {
    if (!this.canTransition(currentState, targetState)) {
      return {
        newState: currentState,
        success: false,
        reason: `Illegal transition from ${currentState} to ${targetState}`
      };
    }

    const definition = VERIFICATION_STATE_REGISTRY[targetState];
    const missingEvidence = definition.evidenceRequired.filter(req => {
      if (req === 'source_document_id') return !factLineage.source_document_id && !factLineage.documentId;
      if (req === 'source_page') return factLineage.source_page === undefined && factLineage.pageNumber === undefined;
      if (req === 'raw_text') return !factLineage.raw_text && !factLineage.sourceText && !factLineage.rawValue;
      if (req === 'normalized_value') return factLineage.normalized_value === undefined && factLineage.normalizedValue === undefined;
      return false; // other soft evidence fields
    });

    if (missingEvidence.length > 0) {
      return {
        newState: currentState,
        success: false,
        reason: `Missing required evidence for ${targetState}: ${missingEvidence.join(', ')}`
      };
    }

    return {
      newState: targetState,
      success: true
    };
  }

  /**
   * Safety Guard for UI: Ensures a PROPOSED fact can NEVER be labeled as "VERIFIED" or "100% Verified".
   */
  public static getDashboardPresentation(fact: {
    verification_state?: string;
    verificationStatus?: string;
    status?: string;
    is_derived?: boolean;
    reported_or_derived?: string;
  }): {
    displayState: string;
    badgeColor: string;
    isVerifiedForDashboard: boolean;
    requiresReviewNotice: boolean;
    isDerived: boolean;
  } {
    const rawState = (
      fact.verification_state ||
      fact.verificationStatus ||
      fact.status ||
      'PROPOSED'
    ).toUpperCase() as VerificationState;

    const isDerived = fact.is_derived === true || fact.reported_or_derived === 'derived';

    if (rawState === 'REJECTED') {
      return {
        displayState: 'REJECTED',
        badgeColor: 'bg-red-100 text-red-800 border-red-300',
        isVerifiedForDashboard: false,
        requiresReviewNotice: true,
        isDerived
      };
    }

    if (rawState === 'CONFLICTED') {
      return {
        displayState: 'CONFLICTED - Discrepancy Detected',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-400',
        isVerifiedForDashboard: false,
        requiresReviewNotice: true,
        isDerived
      };
    }

    if (rawState === 'APPROVED') {
      return {
        displayState: isDerived ? 'APPROVED (Derived Audit Metric)' : 'APPROVED (Audit Final)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        isVerifiedForDashboard: true,
        requiresReviewNotice: false,
        isDerived
      };
    }

    if (rawState === 'VERIFIED') {
      return {
        displayState: isDerived ? 'VERIFIED (Derived Calculation)' : 'VERIFIED (Complete Lineage)',
        badgeColor: 'bg-green-100 text-green-800 border-green-300',
        isVerifiedForDashboard: true,
        requiresReviewNotice: false,
        isDerived
      };
    }

    if (rawState === 'VALIDATED') {
      return {
        displayState: 'VALIDATED (System Validated)',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        isVerifiedForDashboard: true,
        requiresReviewNotice: false,
        isDerived
      };
    }

    // Default Fallback: PROPOSED
    return {
      displayState: 'PROPOSED (Needs Review)',
      badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      isVerifiedForDashboard: false,
      requiresReviewNotice: true,
      isDerived
    };
  }
}
