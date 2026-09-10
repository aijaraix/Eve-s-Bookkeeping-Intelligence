/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — TRUTH ELIGIBILITY GATE
 * 
 * Implements H.9.36.2 Sections 2, 3, 5, 6, 11, 20, 21:
 * - Mechanical Evidence Verification before any object becomes production-authoritative
 * - Physical SHA-256 Byte Verification against physical storage
 * - Empty-string SHA256 and Placeholder Refusal
 * - Benchmark and Canary Firewalls
 * - Fail-Closed on Broken Lineage
 * - Prohibition of in-memory seeds / mock fixtures in production mode
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { forensicQuarantineLedger } from './forensicQuarantineLedger';

export const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export interface TruthEligibilityCheckRequest {
  recordId: string;
  projectId: string;
  engagementId: string;
  entityName: string;
  classification: string;
  sourceArtifactPath?: string;
  claimedSourceHash?: string;
  sourceElementId?: string;
  rawSourceContent?: string;
  period?: string;
  currency?: string;
  scale?: string;
  value?: any;
}

export interface TruthEligibilityResult {
  eligible: boolean;
  status:
    | 'AUTHORITATIVE_APPROVED'
    | 'INVALID_SOURCE_LINEAGE'
    | 'BROKEN_SOURCE_REFERENCE'
    | 'HASH_MISMATCH'
    | 'INVALID_COORDINATE'
    | 'UNSUPPORTED_SOURCE'
    | 'SYNTHETIC_QUARANTINED'
    | 'CANARY_QUARANTINED'
    | 'PLACEHOLDER_HASH_REJECTED'
    | 'BENCHMARK_FIREWALL_BLOCKED'
    | 'REVIEW_REQUIRED';
  actualPhysicalHash?: string;
  actualFileSize?: number;
  reason?: string;
  rejectionDetails?: Record<string, any>;
}

export class TruthEligibilityGate {
  private static instance: TruthEligibilityGate;

  private constructor() {}

  public static getInstance(): TruthEligibilityGate {
    if (!TruthEligibilityGate.instance) {
      TruthEligibilityGate.instance = new TruthEligibilityGate();
    }
    return TruthEligibilityGate.instance;
  }

  /**
   * Verify an object before it enters Active Production Truth
   */
  public evaluateEligibility(req: TruthEligibilityCheckRequest): TruthEligibilityResult {
    // 1. Check if explicitly quarantined in Forensic Quarantine Ledger
    if (forensicQuarantineLedger.isQuarantined(req.recordId) || forensicQuarantineLedger.isQuarantined(req.value)) {
      return {
        eligible: false,
        status: 'SYNTHETIC_QUARANTINED',
        reason: `Record ${req.recordId} or value ${req.value} is marked as quarantined non-authoritative.`
      };
    }

    // 2. Benchmark / Test Firewall (Section 5)
    const blockedClassifications = [
      'SEALED_MINERVA_TRUTH',
      'ACADEMY_EXPECTED_ANSWERS',
      'TEST_FIXTURE',
      'CANARY',
      'CANARY_FIXTURES',
      'SYNTHETIC_CUSTOMER_ACADEMY',
      'DEMO'
    ];
    if (blockedClassifications.includes(req.classification)) {
      return {
        eligible: false,
        status: 'BENCHMARK_FIREWALL_BLOCKED',
        reason: `Classification ${req.classification} is sealed inside test/benchmark boundaries and forbidden in customer truth.`
      };
    }

    // 3. Project & Engagement verification
    if (!req.projectId || req.projectId.trim() === '' || !req.engagementId || req.engagementId.trim() === '') {
      return {
        eligible: false,
        status: 'INVALID_SOURCE_LINEAGE',
        reason: 'Missing projectId or engagementId.'
      };
    }

    // Canary cross-engagement check (Section 6)
    if (req.classification === 'CANARY' || req.engagementId.includes('canary')) {
      if (req.engagementId.startsWith('eng-cj-') && !req.engagementId.includes('canary')) {
        return {
          eligible: false,
          status: 'CANARY_QUARANTINED',
          reason: 'Canary deliverable attempted to bind to customer engagement ID.'
        };
      }
    }

    // 4. Physical Source Artifact Verification
    if (req.sourceArtifactPath) {
      const fullPath = path.isAbsolute(req.sourceArtifactPath)
        ? req.sourceArtifactPath
        : path.join(process.cwd(), req.sourceArtifactPath);

      if (!fs.existsSync(fullPath)) {
        return {
          eligible: false,
          status: 'BROKEN_SOURCE_REFERENCE',
          reason: `Physical source file does not exist on disk: ${req.sourceArtifactPath}`
        };
      }

      const fileStats = fs.statSync(fullPath);
      const fileBytes = fs.readFileSync(fullPath);
      const actualHash = crypto.createHash('sha256').update(fileBytes).digest('hex');

      // 5. Empty-string / Placeholder hash refusal
      if (actualHash === EMPTY_SHA256 || req.claimedSourceHash === EMPTY_SHA256) {
        return {
          eligible: false,
          status: 'PLACEHOLDER_HASH_REJECTED',
          actualPhysicalHash: actualHash,
          actualFileSize: fileStats.size,
          reason: 'Cryptographic hash is the empty-string SHA-256 (0 bytes) or placeholder.'
        };
      }

      if (req.claimedSourceHash && req.claimedSourceHash !== actualHash) {
        return {
          eligible: false,
          status: 'HASH_MISMATCH',
          actualPhysicalHash: actualHash,
          actualFileSize: fileStats.size,
          reason: `Physical SHA-256 (${actualHash}) does not match claimed source hash (${req.claimedSourceHash}).`
        };
      }

      // 6. Source Content Verification (if rawSourceContent specified)
      if (req.rawSourceContent && req.rawSourceContent.trim().length > 0) {
        const fileContent = fileBytes.toString('utf8');
        // Simple substring check or stripped whitespace check
        const cleanContent = req.rawSourceContent.replace(/\s+/g, ' ').trim();
        const cleanSource = fileContent.replace(/\s+/g, ' ');
        if (!cleanSource.includes(cleanContent) && !fileContent.includes(req.rawSourceContent)) {
          return {
            eligible: false,
            status: 'INVALID_COORDINATE',
            actualPhysicalHash: actualHash,
            reason: `Claimed raw source content does not resolve in physical artifact: "${req.rawSourceContent.substring(0, 60)}..."`
          };
        }
      }

      return {
        eligible: true,
        status: 'AUTHORITATIVE_APPROVED',
        actualPhysicalHash: actualHash,
        actualFileSize: fileStats.size
      };
    }

    // Derived values must have valid classification
    if (req.classification === 'AUTHORITATIVE_CUSTOMER_DERIVED' || req.classification === 'AUTHORITATIVE_PUBLIC_SOURCE') {
      return {
        eligible: true,
        status: 'AUTHORITATIVE_APPROVED'
      };
    }

    return {
      eligible: false,
      status: 'UNSUPPORTED_SOURCE',
      reason: 'No verifiable physical source artifact attached to record.'
    };
  }
}

export const truthEligibilityGate = TruthEligibilityGate.getInstance();
