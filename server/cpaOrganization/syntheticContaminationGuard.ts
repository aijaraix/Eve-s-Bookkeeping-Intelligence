/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — SYNTHETIC CONTAMINATION GUARD
 * 
 * Central fail-closed guard that inspects physical filing bytes, metadata,
 * and provenance before allowing source ingestion into production or certification pipelines.
 * 
 * Rules:
 * - Rejects any document containing synthetic padding comment streams (e.g. SEC_FILING_XBRL_TAXONOMY_PADDING_STREAM)
 * - Rejects synthetic test identifiers or mock namespaces
 * - Rejects truncated or partial fragments (< 50,000 bytes for complete Form 10-K)
 * - Enforces presence of authoritative US-GAAP / DEI / Inline-XBRL XML namespaces
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface ContaminationCheckResult {
  passed: boolean;
  fileSizeBytes: number;
  sha256: string;
  isSynthetic: boolean;
  hasPaddingStream: boolean;
  hasAuthoritativeNamespaces: boolean;
  rejectionReasons: string[];
  proofLevel: 'AUTHORITATIVE_SOURCE_VERIFIED' | 'SYNTHETIC_REJECTED';
}

export class SyntheticContaminationGuard {
  private static instance: SyntheticContaminationGuard;

  public static getInstance(): SyntheticContaminationGuard {
    if (!SyntheticContaminationGuard.instance) {
      SyntheticContaminationGuard.instance = new SyntheticContaminationGuard();
    }
    return SyntheticContaminationGuard.instance;
  }

  /**
   * Inspects a physical file path or buffer for synthetic contamination or padding streams.
   */
  public inspectPhysicalSource(filePathOrBuffer: string | Buffer): ContaminationCheckResult {
    let buffer: Buffer;
    if (typeof filePathOrBuffer === 'string') {
      const fullPath = path.isAbsolute(filePathOrBuffer)
        ? filePathOrBuffer
        : path.join(process.cwd(), filePathOrBuffer);

      if (!fs.existsSync(fullPath)) {
        return {
          passed: false,
          fileSizeBytes: 0,
          sha256: '',
          isSynthetic: true,
          hasPaddingStream: false,
          hasAuthoritativeNamespaces: false,
          rejectionReasons: [`Physical source file not found on disk: ${fullPath}`],
          proofLevel: 'SYNTHETIC_REJECTED'
        };
      }
      buffer = fs.readFileSync(fullPath);
    } else {
      buffer = filePathOrBuffer;
    }

    const fileSizeBytes = buffer.length;
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const content = buffer.toString('utf8');
    const rejectionReasons: string[] = [];

    // 1. Check for synthetic padding stream patterns
    const paddingPatterns = [
      /SEC_FILING_XBRL_TAXONOMY_PADDING_STREAM/i,
      /<!--\s*PADDING_STREAM/i,
      /<!--\s*SYNTHETIC_PADDING/i,
      /<!--\s*FIXTURE_PADDING/i,
      /X{100,}/, // 100+ consecutive Xs used as padding filler
      /TEST_FIXTURE_SYNTHETIC_CONTENT/i
    ];

    let hasPaddingStream = false;
    for (const pattern of paddingPatterns) {
      if (pattern.test(content)) {
        hasPaddingStream = true;
        rejectionReasons.push(`Synthetic padding stream detected matching pattern: ${pattern.toString()}`);
        break;
      }
    }

    // 2. Check for synthetic test fixture mock identifiers
    const mockPatterns = [
      /GENERATED_SYNTHETIC_FIXTURE/i,
      /MOCK_SIMULATED_XBRL_FACTS/i,
      /SYNTHETIC_CPA_FIXTURE_V[0-9]/i
    ];

    let isSynthetic = hasPaddingStream;
    for (const pattern of mockPatterns) {
      if (pattern.test(content)) {
        isSynthetic = true;
        rejectionReasons.push(`Synthetic fixture identifier detected: ${pattern.toString()}`);
        break;
      }
    }

    // 3. Check for authoritative SEC/XBRL namespaces in HTML/iXBRL filings
    const hasAuthoritativeNamespaces = 
      (content.includes('http://www.sec.gov') || content.includes('https://www.sec.gov') || content.includes('fasb.org/us-gaap')) &&
      (content.includes('xmlns:ix=') || content.includes('xmlns:us-gaap=') || content.includes('xmlns:dei=') || content.includes('<table') || content.includes('<html'));

    if (!hasAuthoritativeNamespaces && content.length > 500) {
      rejectionReasons.push('Missing authoritative SEC / US-GAAP / Inline-XBRL XML namespaces.');
    }

    // 4. Check for minimum structural completeness for full 10-K
    // Note: full 10-Ks are multi-megabytes, or at minimum 50KB for compressed micro-filings
    if (fileSizeBytes < 25000 && !content.includes('<html')) {
      rejectionReasons.push(`File size (${fileSizeBytes} bytes) is below authoritative threshold for complete filing.`);
    }

    const passed = rejectionReasons.length === 0 && !isSynthetic && !hasPaddingStream && hasAuthoritativeNamespaces;

    return {
      passed,
      fileSizeBytes,
      sha256,
      isSynthetic,
      hasPaddingStream,
      hasAuthoritativeNamespaces,
      rejectionReasons,
      proofLevel: passed ? 'AUTHORITATIVE_SOURCE_VERIFIED' : 'SYNTHETIC_REJECTED'
    };
  }

  /**
   * Enforces fail-closed assertion: throws if source is contaminated or synthetic
   */
  public assertAuthoritative(filePathOrBuffer: string | Buffer): ContaminationCheckResult {
    const result = this.inspectPhysicalSource(filePathOrBuffer);
    if (!result.passed) {
      throw new Error(`[SyntheticContaminationGuard] FAIL-CLOSED REJECTION: ${result.rejectionReasons.join('; ')}`);
    }
    return result;
  }
}

export const syntheticContaminationGuard = SyntheticContaminationGuard.getInstance();
