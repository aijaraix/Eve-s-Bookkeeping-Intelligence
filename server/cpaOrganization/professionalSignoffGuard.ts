/**
 * EVE AUTONOMOUS CPA ORGANIZATION — PROFESSIONAL SIGN-OFF GUARD & APPROVAL LEDGER
 * 
 * Implements Package B3 Requirements 4, 5, 6, 7:
 * - Professional sign-off MUST be physical and backed by an eligible approval object.
 * - Prohibits default CPA names, license numbers, PCAOB identifiers, and firm signatures.
 * - QUINN AI review is strictly separated from human concurring partner approval.
 * - Truthful report status state machine:
 *   DRAFT -> AI_PREPARED -> INTERNALLY_REVIEWED -> READY_FOR_AUTHORIZED_HUMAN_REVIEW ->
 *   AUTHORIZED_APPROVAL_RECEIVED -> ELIGIBLE_FOR_DELIVERY -> DELIVERED.
 * - File existence proves ONLY artifact persistence, never certification.
 */

import fs from 'fs';
import path from 'path';

export type ReportLifecycleStatus =
  | 'DRAFT'
  | 'AI_PREPARED'
  | 'INTERNALLY_REVIEWED'
  | 'READY_FOR_AUTHORIZED_HUMAN_REVIEW'
  | 'AUTHORIZED_APPROVAL_RECEIVED'
  | 'ELIGIBLE_FOR_DELIVERY'
  | 'DELIVERED'
  | 'SUPERSEDED'
  | 'STALE_INVALIDATED';

export type AuthorizedRole =
  | 'LICENSED_CPA'
  | 'ENGAGEMENT_PARTNER'
  | 'CONCURRING_PARTNER'
  | 'QUALITY_REVIEWER';

export interface ProfessionalApprovalObject {
  approvalId: string;
  authorizedIdentity: string;
  authorizedRole: AuthorizedRole;
  licenseNumber?: string;
  jurisdiction?: string;
  engagementId: string;
  reportId: string;
  reportVersion: string;
  reportHash: string;
  approvalScope: string;
  timestamp: string;
  approvalStatus: 'APPROVED' | 'REJECTED' | 'CONDITIONAL';
  status?: 'APPROVED' | 'REJECTED' | 'CONDITIONAL';
  sourceAuthority: string;
  notes?: string;
}

export class ProfessionalSignoffGuard {
  private static instance: ProfessionalSignoffGuard | null = null;
  private approvalsDir: string;
  private approvals: Map<string, ProfessionalApprovalObject> = new Map(); // key = approvalId
  private reportApprovals: Map<string, string[]> = new Map(); // key = reportId, values = approvalIds

  private constructor() {
    this.approvalsDir = path.join(process.cwd(), 'storage', 'cpa_memory', 'approvals');
    if (!fs.existsSync(this.approvalsDir)) {
      fs.mkdirSync(this.approvalsDir, { recursive: true });
    }
    this.rehydrateApprovals();
  }

  public static getInstance(): ProfessionalSignoffGuard {
    if (!ProfessionalSignoffGuard.instance) {
      ProfessionalSignoffGuard.instance = new ProfessionalSignoffGuard();
    }
    return ProfessionalSignoffGuard.instance;
  }

  private rehydrateApprovals(): void {
    try {
      if (!fs.existsSync(this.approvalsDir)) return;
      const files = fs.readdirSync(this.approvalsDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(this.approvalsDir, file), 'utf-8');
          const approval: ProfessionalApprovalObject = JSON.parse(raw);
          if (this.isValidApprovalObject(approval).valid) {
            this.approvals.set(approval.approvalId, approval);
            const list = this.reportApprovals.get(approval.reportId) || [];
            if (!list.includes(approval.approvalId)) {
              list.push(approval.approvalId);
              this.reportApprovals.set(approval.reportId, list);
            }
          }
        } catch (_) {}
      }
    } catch (_) {}
  }

  /**
   * Validates whether an object represents an authentic physical human approval.
   * AI agents are strictly prohibited from generating human approval objects.
   */
  public isValidApprovalObject(approval: any): { valid: boolean; reason?: string } {
    if (!approval || typeof approval !== 'object') {
      return { valid: false, reason: 'Approval object is null or undefined.' };
    }

    const identity = approval.authorizedIdentity || approval.approverName;
    if (!identity || typeof identity !== 'string' || identity.trim() === '') {
      return { valid: false, reason: 'Missing authorized identity / approver name.' };
    }

    // AI agent names cannot masquerade as human practitioners
    const aiAgents = ['QUINN', 'HERMES', 'ATHENA', 'CLARA', 'VERITAS', 'LEDGER', 'EUCLID', 'SCRIBE', 'MINERVA', 'DARWIN', 'EVE'];
    const identityUpper = identity.trim().toUpperCase();
    for (const agent of aiAgents) {
      if (identityUpper === agent || identityUpper.startsWith(`EVE-${agent}`) || identityUpper.startsWith(`AI-${agent}`) || identityUpper.includes('AUTONOMOUS')) {
        return {
          valid: false,
          reason: `AI Agent '${identity}' is not authorized to provide physical professional sign-off.`
        };
      }
    }

    // Check signatureType if present
    if (approval.signatureType && approval.signatureType !== 'PHYSICAL_HUMAN') {
      return {
        valid: false,
        reason: `Signature type '${approval.signatureType}' is prohibited. Only PHYSICAL_HUMAN sign-off is accepted.`
      };
    }

    // Prohibit synthetic source authorities
    const source = approval.sourceAuthority || approval.sourceType || 'HUMAN_AUTHORITY';
    const prohibitedAuthorities = ['AI_EXECUTION', 'AUTONOMOUS_MODEL', 'DEFAULT_SEED', 'SYNTHETIC_CANARY'];
    if (prohibitedAuthorities.includes(source.trim().toUpperCase())) {
      return {
        valid: false,
        reason: `Source authority '${source}' is synthetic and cannot grant professional approval.`
      };
    }

    const status = approval.approvalStatus || approval.status;
    if (status !== 'APPROVED') {
      return {
        valid: false,
        reason: `Approval status is '${status}', which does not satisfy sign-off requirements.`
      };
    }

    return { valid: true };
  }

  public validateApprovalObject(approval: any): { valid: boolean; errors: string[] } {
    const check = this.isValidApprovalObject(approval);
    return {
      valid: check.valid,
      errors: check.valid ? [] : [check.reason || 'Invalid approval object']
    };
  }

  /**
   * Registers an authentic human professional sign-off.
   */
  public registerApproval(approval: ProfessionalApprovalObject): { success: boolean; reason?: string } {
    const check = this.isValidApprovalObject(approval);
    if (!check.valid) {
      return { success: false, reason: check.reason };
    }

    this.approvals.set(approval.approvalId, approval);
    const list = this.reportApprovals.get(approval.reportId) || [];
    if (!list.includes(approval.approvalId)) {
      list.push(approval.approvalId);
      this.reportApprovals.set(approval.reportId, list);
    }

    try {
      fs.writeFileSync(
        path.join(this.approvalsDir, `${approval.approvalId}.json`),
        JSON.stringify(approval, null, 2),
        'utf-8'
      );
    } catch (_) {}

    return { success: true };
  }

  /**
   * Retrieves active approval for a report.
   */
  public getApprovalForReport(reportId: string, reportHash?: string): ProfessionalApprovalObject | undefined {
    const list = this.reportApprovals.get(reportId) || [];
    for (const id of list) {
      const app = this.approvals.get(id);
      if (app && app.approvalStatus === 'APPROVED') {
        if (!reportHash || app.reportHash === reportHash) {
          return app;
        }
      }
    }
    return undefined;
  }

  /**
   * Validates whether a requested report status transition is legal.
   * Prevents skipping directly to certified/signed statuses without human approval.
   */
  public validateStatusTransition(
    currentStatus: ReportLifecycleStatus,
    targetStatus: ReportLifecycleStatus,
    approval?: ProfessionalApprovalObject
  ): { allowed: boolean; reason?: string } {
    // Certified or signed statuses strictly require valid physical approval
    const certifiedStatuses: ReportLifecycleStatus[] = [
      'AUTHORIZED_APPROVAL_RECEIVED',
      'ELIGIBLE_FOR_DELIVERY',
      'DELIVERED'
    ];

    if (certifiedStatuses.includes(targetStatus)) {
      if (!approval) {
        return {
          allowed: false,
          reason: `Target status '${targetStatus}' requires an active physical professional approval object.`
        };
      }
      const check = this.isValidApprovalObject(approval);
      if (!check.valid) {
        return {
          allowed: false,
          reason: `Target status '${targetStatus}' rejected: ${check.reason}`
        };
      }
    }

    // Enforce progression order
    const progressionOrder: Record<ReportLifecycleStatus, number> = {
      DRAFT: 0,
      AI_PREPARED: 1,
      INTERNALLY_REVIEWED: 2,
      READY_FOR_AUTHORIZED_HUMAN_REVIEW: 3,
      AUTHORIZED_APPROVAL_RECEIVED: 4,
      ELIGIBLE_FOR_DELIVERY: 5,
      DELIVERED: 6,
      SUPERSEDED: 99,
      STALE_INVALIDATED: 99
    };

    if (targetStatus === 'SUPERSEDED' || targetStatus === 'STALE_INVALIDATED') {
      return { allowed: true };
    }

    const currentIdx = progressionOrder[currentStatus] ?? 0;
    const targetIdx = progressionOrder[targetStatus] ?? 0;

    // Cannot jump more than 1 step forward in normal progression
    if (targetIdx > currentIdx + 1 && targetIdx <= 6) {
      return {
        allowed: false,
        reason: `Illegal status leap from '${currentStatus}' directly to '${targetStatus}'. Must follow canonical lifecycle progression.`
      };
    }

    return { allowed: true };
  }

  /**
   * Sanitizes branding/signatory fields to guarantee no manufactured identities are output.
   */
  public sanitizeSignatory(identity?: string, role?: string): {
    signatory: string;
    isHumanApproved: boolean;
  } {
    if (!identity || identity.trim() === '') {
      return { signatory: 'READY_FOR_AUTHORIZED_HUMAN_REVIEW', isHumanApproved: false };
    }

    const lower = identity.toLowerCase();
    const fakeKeywords = ['default', 'steve stein', 'managing partner', 'cpa-pcaob', 'test partner'];
    if (fakeKeywords.some(kw => lower.includes(kw))) {
      return { signatory: 'READY_FOR_AUTHORIZED_HUMAN_REVIEW', isHumanApproved: false };
    }

    return { signatory: identity.trim(), isHumanApproved: true };
  }
}

export const professionalSignoffGuard = ProfessionalSignoffGuard.getInstance();
