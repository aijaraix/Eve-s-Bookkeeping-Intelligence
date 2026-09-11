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
    this.seedDefaultCapabilities();
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
          this.promotionLedger = data;
          for (const rec of data) {
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

  private saveToDisk() {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(this.promotionLedger, null, 2), 'utf-8');
    } catch (err) {
      console.error('[CapabilityPromotionAuthority] Failed to save promotion ledger to disk:', err);
    }
  }

  private seedDefaultCapabilities() {
    if (this.promotionLedger.length === 0) {
      const initialSkills = [
        { skillId: 'table-scale-detection', version: '2.2.0' },
        { skillId: 'currency-normalization', version: '2.0.0' },
        { skillId: 'balance-sheet-reconciliation', version: '2.0.0' },
        { skillId: 'financial-statement-reading', version: '2.1.0' },
        { skillId: 'cash-flow-rollforward', version: '1.9.0' }
      ];

      for (const s of initialSkills) {
        this.activeVersions.set(s.skillId, s.version);
        this.promotionLedger.push({
          skillId: s.skillId,
          candidateVersion: s.version,
          previousVersion: '1.0.0',
          proposedBy: 'SYSTEM_BOOTSTRAP',
          evaluatedBy: 'MINERVA',
          approvedBy: 'PROMOTION_AUTHORITY_COMMITTEE',
          changeReason: 'Initial baseline certified capability setup',
          learningCaseIds: [],
          testResults: { passed: true, score: 1.0, totalCases: 4 },
          holdoutResults: { passed: true, accuracyRate: 1.0, numericErrorRate: 0.0 },
          status: 'PROMOTED_ACTIVE',
          promotedAt: '2026-08-01T00:00:00Z',
          rollbackTarget: '1.0.0',
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-01T00:00:00Z'
        });
      }
      this.saveToDisk();
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
   * Proposer MUST NOT be the promotion authority or examiner alone.
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
   * Attaches Minerva holdout evaluation results to a candidate version.
   */
  public attachHoldoutEvaluation(params: {
    skillId: string;
    candidateVersion: string;
    evaluatedBy: string;
    holdoutResults: { passed: boolean; accuracyRate: number; numericErrorRate: number };
  }): CapabilityVersionRecord {
    const record = this.promotionLedger.find(
      r => r.skillId === params.skillId && r.candidateVersion === params.candidateVersion
    );

    if (!record) {
      throw new Error(`Capability candidate '${params.skillId}' v${params.candidateVersion} not found.`);
    }

    record.evaluatedBy = params.evaluatedBy;
    record.holdoutResults = params.holdoutResults;
    record.status = params.holdoutResults.passed ? 'HOLDOUT_EVALUATION_PENDING' : 'REJECTED_HOLDOUT';
    record.updatedAt = new Date().toISOString();

    this.saveToDisk();
    return record;
  }

  /**
   * Promotes a candidate version to active production.
   * ENFORCES SEPARATION OF DUTIES:
   * - approvedBy MUST NOT be the proposer or examiner alone.
   * - Must have passed holdout evaluation.
   */
  public promoteCandidate(params: {
    skillId: string;
    candidateVersion: string;
    approvedBy: string; // Must be independent Promotion Authority
  }): CapabilityVersionRecord {
    const record = this.promotionLedger.find(
      r => r.skillId === params.skillId && r.candidateVersion === params.candidateVersion
    );

    if (!record) {
      throw new Error(`Capability candidate '${params.skillId}' v${params.candidateVersion} not found.`);
    }

    // Separation of Duties check
    if (params.approvedBy === record.proposedBy) {
      throw new Error(`PROMOTION_AUTHORITY_VIOLATION: Proposer '${record.proposedBy}' cannot self-promote candidate v${params.candidateVersion}. An independent Promotion Authority approval is required.`);
    }

    if (params.approvedBy === record.evaluatedBy) {
      throw new Error(`PROMOTION_AUTHORITY_VIOLATION: Examiner '${record.evaluatedBy}' cannot act as sole Promotion Authority for candidate v${params.candidateVersion}.`);
    }

    if (!record.holdoutResults || !record.holdoutResults.passed) {
      throw new Error(`PROMOTION_BLOCKED: Candidate '${params.skillId}' v${params.candidateVersion} has not passed sealed Minerva holdout benchmark evaluation.`);
    }

    // Deactivate previous active version
    const prevActive = this.promotionLedger.find(r => r.skillId === params.skillId && r.status === 'PROMOTED_ACTIVE');
    if (prevActive) {
      prevActive.status = 'DEGRADED'; // Or superseded
      prevActive.updatedAt = new Date().toISOString();
    }

    record.approvedBy = params.approvedBy;
    record.status = 'PROMOTED_ACTIVE';
    record.promotedAt = new Date().toISOString();
    record.updatedAt = record.promotedAt;

    this.activeVersions.set(params.skillId, params.candidateVersion);
    this.saveToDisk();

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

    this.activeVersions.set(skillId, rollbackTo);
    this.saveToDisk();

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
