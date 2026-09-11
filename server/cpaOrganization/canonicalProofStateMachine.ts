/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — CANONICAL PROOF-STATE MACHINE (PACKAGE B2 / DOC 35)
 * 
 * Enforces canonical proof-state promotion boundaries:
 *   UNVERIFIED → ACCEPTED → DISPATCHED → EXECUTING → OUTPUT_PERSISTED → CONSUMED → INDEPENDENTLY_VERIFIED → ELIGIBLE_FOR_CANONICAL
 * 
 * Strict Promotion Rules:
 * 1. File existence on disk proves OUTPUT_PERSISTED only, NEVER INDEPENDENTLY_VERIFIED.
 * 2. Producer cannot self-promote its own material assertion to INDEPENDENTLY_VERIFIED or ELIGIBLE_FOR_CANONICAL.
 * 3. QUINN cannot self-certify its own assertions or approve delivery without independent verification.
 * 4. Missing verifier evidence leaves the lower state intact.
 * 5. Open blocking disagreements strictly prevent promotion to ELIGIBLE_FOR_CANONICAL.
 */

import { disagreementLedger } from './disagreementLedger.js';
import { CANONICAL_ROLE_AUTHORITY_MATRIX } from './cpaAgentRegistry.js';

export type CanonicalProofState =
  | 'UNVERIFIED'
  | 'ACCEPTED'
  | 'DISPATCHED'
  | 'EXECUTING'
  | 'OUTPUT_PERSISTED'
  | 'CONSUMED'
  | 'INDEPENDENTLY_VERIFIED'
  | 'ELIGIBLE_FOR_CANONICAL';

export const PROOF_STATE_HIERARCHY: Record<CanonicalProofState, number> = {
  UNVERIFIED: 0,
  ACCEPTED: 1,
  DISPATCHED: 2,
  EXECUTING: 3,
  OUTPUT_PERSISTED: 4,
  CONSUMED: 5,
  INDEPENDENTLY_VERIFIED: 6,
  ELIGIBLE_FOR_CANONICAL: 7
};

export interface ProofPromotionContext {
  engagementId: string;
  targetObjectId: string;
  producerAgentId: string;
  verifyingAgentId?: string;
  verifierEvidence?: {
    verifierExecutionId: string;
    verifiedAt: string;
    verificationHash: string;
    verificationType: string;
  };
  fileExistedOnDisk?: boolean;
}

export interface PromotionEvaluation {
  allowed: boolean;
  targetState: CanonicalProofState;
  achievedState: CanonicalProofState;
  reason: string;
}

export class CanonicalProofStateMachine {
  private static instance: CanonicalProofStateMachine;

  private constructor() {}

  public static getInstance(): CanonicalProofStateMachine {
    if (!CanonicalProofStateMachine.instance) {
      CanonicalProofStateMachine.instance = new CanonicalProofStateMachine();
    }
    return CanonicalProofStateMachine.instance;
  }

  /**
   * Evaluates if a proof state transition is valid under canonical rules.
   */
  public evaluatePromotion(
    currentState: CanonicalProofState,
    targetState: CanonicalProofState,
    context: ProofPromotionContext
  ): PromotionEvaluation {
    const currentRank = PROOF_STATE_HIERARCHY[currentState];
    const targetRank = PROOF_STATE_HIERARCHY[targetState];

    if (targetRank <= currentRank) {
      return {
        allowed: true,
        targetState,
        achievedState: targetState,
        reason: 'Idempotent or downgrade transition allowed'
      };
    }

    // Check if target object is blocked by an open disagreement
    if (disagreementLedger.isObjectBlocked(context.engagementId, context.targetObjectId)) {
      if (targetRank >= PROOF_STATE_HIERARCHY.INDEPENDENTLY_VERIFIED) {
        return {
          allowed: false,
          targetState,
          achievedState: currentState,
          reason: `Object ${context.targetObjectId} is BLOCKED by open disagreement in engagement ${context.engagementId}`
        };
      }
    }

    // Rule: File existence alone can only reach OUTPUT_PERSISTED
    if (context.fileExistedOnDisk && targetRank > PROOF_STATE_HIERARCHY.OUTPUT_PERSISTED && !context.verifierEvidence) {
      return {
        allowed: false,
        targetState,
        achievedState: 'OUTPUT_PERSISTED',
        reason: 'Physical file existence proves OUTPUT_PERSISTED only, not independent verification'
      };
    }

    // Rule: Transition to INDEPENDENTLY_VERIFIED or ELIGIBLE_FOR_CANONICAL requires independent verifier
    if (targetRank >= PROOF_STATE_HIERARCHY.INDEPENDENTLY_VERIFIED) {
      if (!context.verifyingAgentId || !context.verifierEvidence) {
        return {
          allowed: false,
          targetState,
          achievedState: currentRank >= PROOF_STATE_HIERARCHY.OUTPUT_PERSISTED ? currentState : 'OUTPUT_PERSISTED',
          reason: 'Independent verification evidence is required to advance beyond OUTPUT_PERSISTED/CONSUMED'
        };
      }

      // Rule: Producer cannot self-verify or self-promote
      if (context.verifyingAgentId.toUpperCase() === context.producerAgentId.toUpperCase()) {
        return {
          allowed: false,
          targetState,
          achievedState: currentState,
          reason: `Producer ${context.producerAgentId} cannot self-certify its own assertions to ${targetState}`
        };
      }

      // Check Canonical Role Authority Matrix for required verifier
      const producerMatrix = CANONICAL_ROLE_AUTHORITY_MATRIX[context.producerAgentId.toUpperCase()];
      if (producerMatrix && producerMatrix.requiredIndependentVerifier) {
        const reqVerifier = producerMatrix.requiredIndependentVerifier.toUpperCase();
        const actualVerifier = context.verifyingAgentId.toUpperCase();
        // Allow if actual verifier matches or is an authority like EVE_INTERNAL_AUDIT or SENTINEL
        const isAuthorizedVerifier =
          reqVerifier.includes(actualVerifier) ||
          actualVerifier.includes(reqVerifier) ||
          actualVerifier === 'EVE_INTERNAL_AUDIT' ||
          actualVerifier === 'QUINN';

        if (!isAuthorizedVerifier) {
          return {
            allowed: false,
            targetState,
            achievedState: currentState,
            reason: `Verifier ${context.verifyingAgentId} does not satisfy matrix requirement (${producerMatrix.requiredIndependentVerifier}) for ${context.producerAgentId}`
          };
        }
      }
    }

    return {
      allowed: true,
      targetState,
      achievedState: targetState,
      reason: 'Valid promotion transition satisfying all canonical boundaries'
    };
  }
}

export const canonicalProofStateMachine = CanonicalProofStateMachine.getInstance();
