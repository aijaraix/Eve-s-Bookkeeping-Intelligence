/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — HANDOFF CONSERVATION ENGINE (PACKAGE B2 / DOC 35)
 * 
 * Enforces strict handoff conservation between specialist agents & engines:
 * - Durable Handoff Manifests with cryptographic hash tracking.
 * - Invariant:
 *     EXPECTED_INPUT_REFERENCES = ACKNOWLEDGED_INPUT_REFERENCES + EXPLICITLY_REJECTED_OR_DISPOSITIONED_REFERENCES
 *     UNACCOUNTED_REFERENCES = 0
 * - Fail-Closed: Any unaccounted references or missing handoffs block consumer execution.
 * - Consumers cannot process unacknowledged references.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface RejectedReferenceDisposition {
  referenceId: string;
  disposition: 'EXCLUDED_OUT_OF_SCOPE' | 'DUPLICATE' | 'CORRUPTED' | 'UNSUPPORTED_FORMAT' | 'MANUAL_REVIEW_REQUIRED';
  reason: string;
}

export type HandoffStatus = 'PENDING' | 'ACKNOWLEDGED' | 'REJECTED' | 'CONSERVATION_VIOLATION' | 'BLOCKED';

export interface HandoffRecord {
  handoffId: string;
  producerExecutionId: string;
  producerAgentId: string;
  consumerAgentId: string;
  engagementScope: string;
  objectReferenceManifest: string[];
  manifestHash: string;
  expectedReferenceCount: number;
  acknowledgedReferenceCount: number;
  acknowledgedReferences: string[];
  rejectedWithDisposition: RejectedReferenceDisposition[];
  unaccountedReferences: number;
  idempotencyKey: string;
  attempt: number;
  sentAt: string;
  acknowledgedAt: string | null;
  status: HandoffStatus;
  violationReason?: string;
}

export class HandoffConservationEngine {
  private static instance: HandoffConservationEngine;
  private readonly storageDir = path.join(process.cwd(), 'storage', 'cpa_memory', 'handoffs');
  private readonly inMemoryCache = new Map<string, HandoffRecord>();

  private constructor() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    this.loadPersistedHandoffs();
  }

  public static getInstance(): HandoffConservationEngine {
    if (!HandoffConservationEngine.instance) {
      HandoffConservationEngine.instance = new HandoffConservationEngine();
    }
    return HandoffConservationEngine.instance;
  }

  private loadPersistedHandoffs(): void {
    try {
      if (!fs.existsSync(this.storageDir)) return;
      const files = fs.readdirSync(this.storageDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.storageDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const record = JSON.parse(content) as HandoffRecord;
          this.inMemoryCache.set(record.handoffId, record);
        }
      }
    } catch (_) {}
  }

  /**
   * Computes sha256 of the object reference manifest in deterministic order.
   */
  public computeManifestHash(references: string[]): string {
    const sorted = [...references].sort();
    return crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex');
  }

  /**
   * Creates a durable handoff manifest from producer to consumer.
   */
  public createHandoff(params: {
    producerExecutionId: string;
    producerAgentId: string;
    consumerAgentId: string;
    engagementScope: string;
    objectReferenceManifest: string[];
    idempotencyKey?: string;
    attempt?: number;
  }): HandoffRecord {
    const manifestHash = this.computeManifestHash(params.objectReferenceManifest);
    const handoffId = `handoff-${params.producerAgentId.toLowerCase()}-to-${params.consumerAgentId.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const idempotencyKey = params.idempotencyKey || `idem-${handoffId}`;

    const record: HandoffRecord = {
      handoffId,
      producerExecutionId: params.producerExecutionId,
      producerAgentId: params.producerAgentId,
      consumerAgentId: params.consumerAgentId,
      engagementScope: params.engagementScope,
      objectReferenceManifest: [...params.objectReferenceManifest],
      manifestHash,
      expectedReferenceCount: params.objectReferenceManifest.length,
      acknowledgedReferenceCount: 0,
      acknowledgedReferences: [],
      rejectedWithDisposition: [],
      unaccountedReferences: params.objectReferenceManifest.length,
      idempotencyKey,
      attempt: params.attempt || 1,
      sentAt: new Date().toISOString(),
      acknowledgedAt: null,
      status: 'PENDING'
    };

    this.persistRecord(record);
    return record;
  }

  /**
   * Consumer acknowledges receipt and accounts for every reference.
   * Enforces Handoff Conservation Invariant:
   *   EXPECTED = ACKNOWLEDGED + REJECTED
   *   UNACCOUNTED = 0
   */
  public acknowledgeHandoff(
    handoffId: string,
    params: {
      acknowledgedReferences: string[];
      rejectedWithDisposition?: RejectedReferenceDisposition[];
    }
  ): { record: HandoffRecord; conserved: boolean; violationReason?: string } {
    const record = this.inMemoryCache.get(handoffId);
    if (!record) {
      throw new Error(`[HandoffConservationEngine] Handoff not found: ${handoffId}`);
    }

    const acknowledged = params.acknowledgedReferences || [];
    const rejected = params.rejectedWithDisposition || [];

    // Verify all acknowledged references were in the expected manifest
    const manifestSet = new Set(record.objectReferenceManifest);
    for (const ref of acknowledged) {
      if (!manifestSet.has(ref)) {
        record.status = 'CONSERVATION_VIOLATION';
        record.violationReason = `Unsolicited acknowledged reference ${ref} not in producer manifest`;
        this.persistRecord(record);
        return { record, conserved: false, violationReason: record.violationReason };
      }
    }

    // Verify all rejected references were in the expected manifest
    for (const rej of rejected) {
      if (!manifestSet.has(rej.referenceId)) {
        record.status = 'CONSERVATION_VIOLATION';
        record.violationReason = `Unsolicited rejected reference ${rej.referenceId} not in producer manifest`;
        this.persistRecord(record);
        return { record, conserved: false, violationReason: record.violationReason };
      }
    }

    // Check overlap between acknowledged and rejected
    const acknowledgedSet = new Set(acknowledged);
    for (const rej of rejected) {
      if (acknowledgedSet.has(rej.referenceId)) {
        record.status = 'CONSERVATION_VIOLATION';
        record.violationReason = `Reference ${rej.referenceId} cannot be both acknowledged and rejected`;
        this.persistRecord(record);
        return { record, conserved: false, violationReason: record.violationReason };
      }
    }

    const totalAccounted = acknowledged.length + rejected.length;
    const unaccounted = record.expectedReferenceCount - totalAccounted;

    record.acknowledgedReferenceCount = acknowledged.length;
    record.acknowledgedReferences = acknowledged;
    record.rejectedWithDisposition = rejected;
    record.unaccountedReferences = unaccounted;
    record.acknowledgedAt = new Date().toISOString();

    if (unaccounted === 0) {
      record.status = 'ACKNOWLEDGED';
      record.violationReason = undefined;
      this.persistRecord(record);
      return { record, conserved: true };
    } else {
      record.status = 'CONSERVATION_VIOLATION';
      record.violationReason = `Handoff conservation violation: expected ${record.expectedReferenceCount}, accounted ${totalAccounted}, unaccounted ${unaccounted}`;
      this.persistRecord(record);
      return { record, conserved: false, violationReason: record.violationReason };
    }
  }

  /**
   * Verifies if a handoff is fully conserved and valid.
   */
  public verifyConservation(handoffId: string): { conserved: boolean; unaccounted: number; violationReason?: string } {
    const record = this.inMemoryCache.get(handoffId);
    if (!record) {
      return { conserved: false, unaccounted: -1, violationReason: `Handoff ${handoffId} not found` };
    }
    const conserved = record.status === 'ACKNOWLEDGED' && record.unaccountedReferences === 0;
    return {
      conserved,
      unaccounted: record.unaccountedReferences,
      violationReason: record.violationReason
    };
  }

  public getHandoff(handoffId: string): HandoffRecord | null {
    return this.inMemoryCache.get(handoffId) || null;
  }

  public getHandoffsForEngagement(engagementScope: string): HandoffRecord[] {
    return Array.from(this.inMemoryCache.values()).filter(h => h.engagementScope === engagementScope);
  }

  private persistRecord(record: HandoffRecord): void {
    this.inMemoryCache.set(record.handoffId, record);
    try {
      const filename = `${record.handoffId}.json`;
      const tempPath = path.join(this.storageDir, `${filename}.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`);
      const targetPath = path.join(this.storageDir, filename);
      fs.writeFileSync(tempPath, JSON.stringify(record, null, 2), 'utf-8');
      fs.renameSync(tempPath, targetPath);
    } catch (err: any) {
      console.error(`[HandoffConservationEngine] Persistence error: ${err.message}`);
    }
  }
}

export const handoffConservationEngine = HandoffConservationEngine.getInstance();
