/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — DISAGREEMENT & EXCEPTION LEDGER (PACKAGE B2 / DOC 35)
 * 
 * Enforces strict disagreement handling across specialist swarms:
 * - Voting/consensus is strictly FORBIDDEN: agent consensus does NOT create accounting truth.
 * - Conflicting findings create durable Disagreement Objects.
 * - Affected truth remains BLOCKED until formally resolved or escalated to human review.
 * - Disagreements trigger reopen/review of upstream specialist workpapers.
 */

import fs from 'fs';
import path from 'path';

export type DisagreementType =
  | 'ARITHMETIC_VARIANCE'
  | 'HASH_MISMATCH'
  | 'DISCLOSURE_DEFICIT'
  | 'UNRESOLVED_PBC'
  | 'STANDARDS_CONFLICT'
  | 'TENANT_VIOLATION'
  | 'SCOPE_DISCREPANCY';

export type DisagreementDisposition =
  | 'OPEN'
  | 'RESOLVED'
  | 'ESCALATED_HUMAN_REVIEW'
  | 'BLOCKED';

export interface DisagreementRecord {
  disagreementId: string;
  engagementId: string;
  sourceAgentId: string;
  challengingAgentId: string;
  targetObjectId: string;
  field: string;
  sourceValue: any;
  conflictingValue: any;
  disagreementType: DisagreementType;
  disposition: DisagreementDisposition;
  blocking: boolean;
  reopenTargetAgentId?: string;
  reopenTriggered: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export class DisagreementLedger {
  private static instance: DisagreementLedger;
  private readonly storageDir = path.join(process.cwd(), 'storage', 'cpa_memory', 'disagreements');
  private readonly inMemoryCache = new Map<string, DisagreementRecord>();

  private constructor() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    this.loadPersistedRecords();
  }

  public static getInstance(): DisagreementLedger {
    if (!DisagreementLedger.instance) {
      DisagreementLedger.instance = new DisagreementLedger();
    }
    return DisagreementLedger.instance;
  }

  private loadPersistedRecords(): void {
    try {
      if (!fs.existsSync(this.storageDir)) return;
      const files = fs.readdirSync(this.storageDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.storageDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const record = JSON.parse(content) as DisagreementRecord;
          this.inMemoryCache.set(record.disagreementId, record);
        }
      }
    } catch (_) {}
  }

  /**
   * Records a durable disagreement object when specialists detect contradictory findings.
   * Consensus/majority voting is rejected: the discrepancy must be preserved.
   */
  public recordDisagreement(params: {
    engagementId: string;
    sourceAgentId: string;
    challengingAgentId: string;
    targetObjectId: string;
    field: string;
    sourceValue: any;
    conflictingValue: any;
    disagreementType: DisagreementType;
    blocking?: boolean;
    reopenTargetAgentId?: string;
    resolutionNotes?: string;
  }): DisagreementRecord {
    const disagreementId = `disagree-${params.challengingAgentId.toLowerCase()}-vs-${params.sourceAgentId.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const blocking = params.blocking !== false; // defaults to true
    const reopenTriggered = !!params.reopenTargetAgentId;

    const record: DisagreementRecord = {
      disagreementId,
      engagementId: params.engagementId,
      sourceAgentId: params.sourceAgentId,
      challengingAgentId: params.challengingAgentId,
      targetObjectId: params.targetObjectId,
      field: params.field,
      sourceValue: params.sourceValue,
      conflictingValue: params.conflictingValue,
      disagreementType: params.disagreementType,
      disposition: 'OPEN',
      blocking,
      reopenTargetAgentId: params.reopenTargetAgentId,
      reopenTriggered,
      createdAt: new Date().toISOString(),
      resolutionNotes: params.resolutionNotes
    };

    this.persistRecord(record);
    return record;
  }

  /**
   * Resolves or escalates a disagreement.
   */
  public resolveDisagreement(
    disagreementId: string,
    params: {
      resolvedBy: string;
      disposition: 'RESOLVED' | 'ESCALATED_HUMAN_REVIEW' | 'BLOCKED';
      resolutionNotes: string;
    }
  ): DisagreementRecord {
    const record = this.inMemoryCache.get(disagreementId);
    if (!record) {
      throw new Error(`[DisagreementLedger] Disagreement not found: ${disagreementId}`);
    }

    record.disposition = params.disposition;
    record.resolvedBy = params.resolvedBy;
    record.resolvedAt = new Date().toISOString();
    record.resolutionNotes = params.resolutionNotes;
    if (params.disposition === 'RESOLVED') {
      record.blocking = false;
    }

    this.persistRecord(record);
    return record;
  }

  /**
   * Checks if an object is currently blocked by an open disagreement.
   */
  public isObjectBlocked(engagementId: string, targetObjectId: string): boolean {
    const records = this.getDisagreementsForEngagement(engagementId);
    return records.some(
      r => r.targetObjectId === targetObjectId && r.disposition === 'OPEN' && r.blocking
    );
  }

  public getDisagreement(disagreementId: string): DisagreementRecord | null {
    return this.inMemoryCache.get(disagreementId) || null;
  }

  public getDisagreementsForEngagement(engagementId: string): DisagreementRecord[] {
    return Array.from(this.inMemoryCache.values()).filter(d => d.engagementId === engagementId);
  }

  public getBlockingDisagreements(engagementId: string): DisagreementRecord[] {
    return this.getDisagreementsForEngagement(engagementId).filter(
      d => d.blocking && d.disposition === 'OPEN'
    );
  }

  private persistRecord(record: DisagreementRecord): void {
    this.inMemoryCache.set(record.disagreementId, record);
    try {
      const filename = `${record.disagreementId}.json`;
      const tempPath = path.join(this.storageDir, `${filename}.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`);
      const targetPath = path.join(this.storageDir, filename);
      fs.writeFileSync(tempPath, JSON.stringify(record, null, 2), 'utf-8');
      fs.renameSync(tempPath, targetPath);
    } catch (err: any) {
      console.error(`[DisagreementLedger] Persistence error: ${err.message}`);
    }
  }
}

export const disagreementLedger = DisagreementLedger.getInstance();
