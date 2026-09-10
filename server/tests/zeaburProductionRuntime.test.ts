/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — ZEABUR PRODUCTION RUNTIME REPAIR TEST SUITE
 * 
 * Verifies:
 * - Document 23: Runtime Authority Manifest & Deployment Fingerprint
 * - Document 27: Zeabur Gap Register (ZR-001 through ZR-022)
 * - Document 28: Zeabur Runtime Repair, Negative Bypass Tests & Owner Closure Standards
 */

import { runtimeAuthorityManifestManager } from '../cpaOrganization/runtimeAuthorityManifest.js';
import { zeaburRuntimeGapRegister } from '../cpaOrganization/zeaburRuntimeGapRegister.js';

export async function runZeaburProductionRuntimeTests(): Promise<{ passed: boolean; count: number; failures: string[] }> {
  const failures: string[] = [];
  let count = 0;

  try {
    // 1. Manifest
    count++;
    const manifest = runtimeAuthorityManifestManager.getManifest();
    if (!manifest.componentId || !manifest.build.artifactDigest || manifest.governance.proofLevel !== 'RUNTIME_VERIFIED') {
      failures.push('Runtime Authority Manifest invalid properties');
    }

    // 2. Fingerprint
    count++;
    const fingerprint = runtimeAuthorityManifestManager.getFingerprint();
    if (!fingerprint.commitSha || !fingerprint.artifactDigest || !fingerprint.buildId) {
      failures.push('Runtime Fingerprint missing required provenance fields');
    }

    // 3. Scheduler Leader Lease
    count++;
    const lease = runtimeAuthorityManifestManager.acquireOrRenewLease();
    if (!lease || lease.state !== 'ACTIVE_LEADER' || typeof lease.fencingToken !== 'number') {
      failures.push('Scheduler Leader Lease did not grant active leadership with fencing token');
    }

    // 4. Credential Scrubbing
    count++;
    const scrubbed = runtimeAuthorityManifestManager.sanitizeStringForSecrets('AIzaSyBNm98123456789012345678901234 Bearer mytoken12345678901234567890');
    if (!scrubbed.includes('[REDACTED_GEMINI_KEY]') || !scrubbed.includes('[REDACTED_TOKEN]')) {
      failures.push('Credential scrubbing failed to redact secrets');
    }

    // 5. Live OS Metrics
    count++;
    const metrics = runtimeAuthorityManifestManager.getLiveSystemMetrics();
    if (metrics.cpuCores <= 0 || metrics.ramFreeMb <= 0 || metrics.ramTotalMb <= 0) {
      failures.push('Live OS metrics returned invalid values');
    }

    // 6. Zeabur Gap Register (22 gaps audited)
    count++;
    const report = zeaburRuntimeGapRegister.getGapRegisterReport();
    if (report.totalGapsAudited !== 22 || report.resolvedGapsCount !== 22 || !report.allP0GapsResolved) {
      failures.push(`Zeabur Gap Register audit incomplete: ${report.resolvedGapsCount}/${report.totalGapsAudited} resolved`);
    }

    // 7. Negative Bypass Tests
    count++;
    const bypass = zeaburRuntimeGapRegister.runNegativeBypassTests();
    if (!bypass.allPassed || bypass.failedTests > 0) {
      failures.push(`Negative bypass tests failed (${bypass.failedTests} failures)`);
    }

  } catch (err: any) {
    failures.push(`Test execution exception: ${err.message}`);
  }

  return {
    passed: failures.length === 0,
    count,
    failures
  };
}
