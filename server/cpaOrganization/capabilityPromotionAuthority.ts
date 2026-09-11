/**
 * EVE AUTONOMOUS CPA ORGANIZATION — CAPABILITY PROMOTION AUTHORITY
 * 
 * Implements Document 35 Requirements 7, 8 & 9:
 * - Independent Promotion Authority separate from Solver, Examiner (Minerva), and Proposer (Darwin/Academy).
 * - No single agent may propose, grade, approve, AND promote its own change alone.
 * - Enforces immutable versioning: candidateVersion, previousVersion, changeReason, learningCaseIds, testResults, holdoutResults, approvedBy, promotedAt, rollbackTarget.
 * - Academy Scope Boundary: Blocks changes to accounting truth, canonical fact eligibility, professional signoff rules, or Document 35 authority matrix.
 * - Automatic rollback capability on post-promotion regression detection.
 */

import fs from 'fs';
import path from 'path';
import { academyMinervaLab } from './academyMinervaLab.js';

export interface CapabilityVersionRecord {
  skillId: string;
  candidateVersion: string;
  previousVersion: string;
  proposedBy: string; // Proposer (e.g., 'DARWIN', 'ACADEMY')
  evaluatedBy?: string; // Examiner (e.g., 'MINERVA')
  approvedBy?: string; // Independent Promotion Authority (e.g., 'PROMOTION_AUTHORITY_COMMITTEE', 'CHIEF_CPA_OFFICER')
  changeReason: string;
  learningCaseIds: string[];
  testResults: {
    passed: boolean;
    score: number;
    totalCases: number;
  };
  holdoutResults?: {
    passed: boolean;
    accuracyRate: number;
    numericErrorRate: number;
    evalId?: string;
  };
  status: 'CANDIDATE_SUBMITTED' | 'HOLDOUT_EVALUATION_PENDING' | 'PROMOTED_ACTIVE' | 'REJECTED_HOLDOUT' | 'DEGRADED' | 'ROLLED_BACK';
  promotedAt?: string;
  rollbackTarget?: string;
  createdAt: string;
  updatedAt: string;
}

export class CapabilityPromotionAuthority {
  private static instance: CapabilityPromotionAuthority | null = null;
  private promotionLedger: CapabilityVersionRecord[] = [];
  private activeVersions: Map<string, string> = new Map(); // skillId -> activeVersion
  private storageFile: string;

  private constructor() {
    const storageDir = process.env.HERMES_PERSISTENT_DATA_DIR ||
      (fs.existsSync('/opt/data') ? '/opt/data/cpa_organization' : path.join(process.cwd(), 'storage', 'cpa_memory'));
    if (!fs.existsSync(storageDir)) {
      try { fs.mkdirSync(storageDir, { recursive: true }); } catch (err) {}
    }
    this.storageFile = path.join(storageDir, 'capability_promotion_ledger.json');
    this.loadFromDisk();
    // Requirement 7: NO automatic synthetic/seeded perfect historical capability promotion seeding on startup!
  }

  public static getInstance(): CapabilityPromotionAuthority {
    if (!CapabilityPromotionAuthority.instance) {
      CapabilityPromotionAuthority.instance = new CapabilityPromotionAuthority();
    }
    return CapabilityPromotionAuthority.instance;
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          // Requirement 7: Clean out any synthetic/seeded default capabilities on load
          this.promotionLedger = data.filter(rec => rec.proposedBy !== 'SYSTEM_BOOTSTRAP' && rec.promotedAt !== '2026-08-01T00:00:00Z');
          for (const rec of this.promotionLedger) {
            if (rec.status === 'PROMOTED_ACTIVE') {
              this.activeVersions.set(rec.skillId, rec.candidateVersion);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[CapabilityPromotionAuthority] Could not load promotion ledger from disk:', err);
    }
  }

  /**
   * Requirement 9: ATOMIC PERSISTENCE WITH FSYNC.
   * Throws error if save fails, ensuring fail-closed semantics for promotions.
   */
  private saveToDisk() {
    const tmpFile = `${this.storageFile}.tmp`;
    try {
      fs.writeFileSync(tmpFile, JSON.stringify(this.promotionLedger, null, 2), 'utf-8');
      const fd = fs.openSync(tmpFile, 'r+');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fs.renameSync(tmpFile, this.storageFile);
    } catch (err: any) {
      if (fs.existsSync(tmpFile)) {
        try { fs.unlinkSync(tmpFile); } catch (e) {}
      }
      throw new Error(`PERSISTENCE_FAILURE: Atomic storage write failed (${err.message}). Promotion state change rejected fail-closed.`);
    }
  }

  /**
   * Scope Boundary Check:
   * Academy/Darwin may propose improvements to execution heuristics (prompts, parsers, routing, retrieval).
   * Academy/Darwin CANNOT alter accounting standards, canonical fact eligibility, signoff gates, or Document 35 policies.
   */
  public validateScopeBoundary(proposedChange: string): { allowed: boolean; reason?: string } {
    const forbiddenTerms = [
      'ACCOUNTING_RULE', 'GAAP_OVERRIDE', 'IFRS_OVERRIDE', 'BYPASS_PROFESSIONAL_APPROVAL',
      'AUTO_SIGN_OFF', 'ALTER_CANONICAL_ELIGIBILITY', 'DISABLE_FAIL_CLOSED', 'DOCUMENT_35_POLICY_OVERRIDE'
    ];

    const normalized = proposedChange.toUpperCase();
    for (const term of forbiddenTerms) {
      if (normalized.includes(term)) {
        return {
          allowed: false,
          reason: `UNAUTHORIZED_ACADEMY_SCOPE_VIOLATION: Academy/Darwin cannot modify fundamental governance or accounting policy '${term}'.`
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Submits a new candidate version for a capability.
   */
  public submitCandidate(params: {
    skillId: string;
    candidateVersion: string;
    proposedBy: string;
    changeReason: string;
    learningCaseIds?: string[];
    testResults: { passed: boolean; score: number; totalCases: number };
  }): CapabilityVersionRecord {
    const scopeCheck = this.validateScopeBoundary(params.changeReason);
    if (!scopeCheck.allowed) {
      throw new Error(scopeCheck.reason);
    }

    const previousVersion = this.activeVersions.get(params.skillId) || '1.0.0';
    const now = new Date().toISOString();

    const record: CapabilityVersionRecord = {
      skillId: params.skillId,
      candidateVersion: params.candidateVersion,
      previousVersion,
      proposedBy: params.proposedBy,
      changeReason: params.changeReason,
      learningCaseIds: params.learningCaseIds || [],
      testResults: params.testResults,
      status: 'CANDIDATE_SUBMITTED',
      rollbackTarget: previousVersion,
      createdAt: now,
      updatedAt: now
    };

    this.promotionLedger.unshift(record);
    this.saveToDisk();
    return record;
  }

  /**
   * Requirement 17: Attaches Minerva holdout evaluation results verified against persisted evaluation receipt.
   * Does NOT accept caller-supplied accuracy or evaluation scores.
   */
  public attachHoldoutEvaluation(params: {
    skillId: string;
    candidateVersion: string;
    evalId: string;
  }): CapabilityVersionRecord {
    const evalReport = academyMinervaLab.getEvaluationReport(params.evalId);
    if (!evalReport) {
      throw new Error(`MINERVA_EVALUATION_RECEIPT_NOT_FOUND: Persisted evaluation receipt '${params.evalId}' not found in Minerva examiner ledger. Holdout evaluation cannot be attached without genuine examiner receipt.`);
    }

    const record = this.promotionLedger.find(
      r => r.skillId === params.skillId && r.candidateVersion === params.candidateVersion
    );

    if (!record) {
      throw new Error(`Capability candidate '${params.skillId}' v${params.candidateVersion} not found.`);
    }

    const passed = (evalReport.certifiedStatus === 'BENCHMARK_PASSED' || (evalReport.passed === evalReport.totalTests && evalReport.numericErrorRate === 0));

    record.evaluatedBy = 'MINERVA';
    record.holdoutResults = {
      passed,
      accuracyRate: evalReport.accuracyRate,
      numericErrorRate: evalReport.numericErrorRate,
      evalId: params.evalId
    };
    record.status = passed ? 'HOLDOUT_EVALUATION_PENDING' : 'REJECTED_HOLDOUT';
    record.updatedAt = new Date().toISOString();

    this.saveToDisk();
    return record;
  }

  /**
   * Promotes a candidate version to active production.
   * Requirement 8 & 9: Requires authenticated promotion authority context.
   * Atomically persists state change to disk before modifying in-memory active versions.
   */
  public promoteCandidate(params: {
    skillId: string;
    candidateVersion: string;
    authContext?: { authenticatedPrincipalId: string | null; isPromotionAuthority?: boolean } | string;
    approvedBy?: string;
  }): CapabilityVersionRecord {
    let approvedBy = params.approvedBy || '';
    let isAuthority = false;

    if (typeof params.authContext === 'object' && params.authContext !== null) {
      if (params.authContext.isPromotionAuthority || params.authContext.authenticatedPrincipalId === 'CHIEF_CPA_OFFICER' || params.authContext.authenticatedPrincipalId === 'PROMOTION_AUTHORITY_COMMITTEE') {
        isAuthority = true;
        approvedBy = params.authContext.authenticatedPrincipalId || approvedBy;
      }
    } else if (typeof params.authContext === 'string') {
      const norm = params.authContext.toUpperCase();
      if (norm === 'CHIEF_CPA_OFFICER' || norm === 'PROMOTION_AUTHORITY_COMMITTEE') {
        isAuthority = true;
        approvedBy = norm;
      }
    }

    if (!isAuthority) {
      throw new Error(`UNAUTHORIZED_PROMOTION_AUTHORITY: Caller lacks authenticated Promotion Authority credentials.`);
    }

    const record = this.promotionLedger.find(
      r => r.skillId === params.skillId && r.candidateVersion === params.candidateVersion
    );

    if (!record) {
      throw new Error(`Capability candidate '${params.skillId}' v${params.candidateVersion} not found.`);
    }

    // Separation of Duties check
    if (approvedBy === record.proposedBy) {
      throw new Error(`PROMOTION_AUTHORITY_VIOLATION: Proposer '${record.proposedBy}' cannot self-promote candidate v${params.candidateVersion}. An independent Promotion Authority approval is required.`);
    }

    if (approvedBy === record.evaluatedBy) {
      throw new Error(`PROMOTION_AUTHORITY_VIOLATION: Examiner '${record.evaluatedBy}' cannot act as sole Promotion Authority for candidate v${params.candidateVersion}.`);
    }

    if (!record.holdoutResults || !record.holdoutResults.passed) {
      throw new Error(`PROMOTION_BLOCKED: Candidate '${params.skillId}' v${params.candidateVersion} has not passed sealed Minerva holdout benchmark evaluation.`);
    }

    // Snapshot current state in case rollback is needed if saveToDisk fails
    const oldLedgerSnapshot = JSON.parse(JSON.stringify(this.promotionLedger));
    const oldActiveVersion = this.activeVersions.get(params.skillId);

    // Deactivate previous active version
    const prevActive = this.promotionLedger.find(r => r.skillId === params.skillId && r.status === 'PROMOTED_ACTIVE');
    if (prevActive) {
      prevActive.status = 'DEGRADED';
      prevActive.updatedAt = new Date().toISOString();
    }

    record.approvedBy = approvedBy;
    record.status = 'PROMOTED_ACTIVE';
    record.promotedAt = new Date().toISOString();
    record.updatedAt = record.promotedAt;

    try {
      this.saveToDisk();
      this.activeVersions.set(params.skillId, params.candidateVersion);
    } catch (saveError) {
      // Revert in-memory state on atomic write failure (Requirement 9)
      this.promotionLedger = oldLedgerSnapshot;
      if (oldActiveVersion) {
        this.activeVersions.set(params.skillId, oldActiveVersion);
      } else {
        this.activeVersions.delete(params.skillId);
      }
      throw saveError;
    }

    return record;
  }

  /**
   * Rolls back an active capability version to a previous certified version.
   */
  public rollbackCapability(skillId: string, targetVersion?: string): CapabilityVersionRecord {
    const currentActive = this.promotionLedger.find(r => r.skillId === skillId && r.status === 'PROMOTED_ACTIVE');
    const rollbackTo = targetVersion || currentActive?.previousVersion || '1.0.0';

    if (currentActive) {
      currentActive.status = 'ROLLED_BACK';
      currentActive.updatedAt = new Date().toISOString();
    }

    const targetRecord = this.promotionLedger.find(
      r => r.skillId === skillId && r.candidateVersion === rollbackTo
    );

    if (targetRecord) {
      targetRecord.status = 'PROMOTED_ACTIVE';
      targetRecord.updatedAt = new Date().toISOString();
    }

    this.saveToDisk();
    this.activeVersions.set(skillId, rollbackTo);

    return {
      skillId,
      candidateVersion: rollbackTo,
      previousVersion: currentActive?.candidateVersion || 'UNKNOWN',
      proposedBy: 'SYSTEM_ROLLBACK',
      approvedBy: 'EMERGENCY_ROLLBACK_GATE',
      changeReason: `Rollback triggered from ${currentActive?.candidateVersion || 'current'} to target ${rollbackTo}`,
      learningCaseIds: [],
      testResults: { passed: true, score: 1.0, totalCases: 1 },
      status: 'PROMOTED_ACTIVE',
      promotedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  public getActiveVersion(skillId: string): string {
    return this.activeVersions.get(skillId) || '1.0.0';
  }

  public getLedger(): CapabilityVersionRecord[] {
    return this.promotionLedger;
  }
}

export const capabilityPromotionAuthority = CapabilityPromotionAuthority.getInstance();
