/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — ZEABUR PRODUCTION RUNTIME REPAIR TEST SUITE
 *
 * Application tests validate fail-closed self-observation behavior only.
 * They do not certify the production deployment; external physical acceptance does.
 */

import { runtimeAuthorityManifestManager } from '../cpaOrganization/runtimeAuthorityManifest.js';
import { zeaburRuntimeGapRegister } from '../cpaOrganization/zeaburRuntimeGapRegister.js';

export async function runZeaburProductionRuntimeTests(): Promise<{ passed: boolean; count: number; failures: string[] }> {
  const failures: string[] = [];
  let count = 0;

  try {
    // 1. Manifest must fail closed rather than self-promote to verified proof.
    count++;
    const manifest = runtimeAuthorityManifestManager.getManifest();
    if (!manifest.componentId || manifest.governance.proofLevel !== 'CONFIGURED' || manifest.verification.status === 'AUTHENTIC_AUTHORITATIVE') {
      failures.push('Runtime manifest must remain CONFIGURED/self-observed until external physical acceptance');
    }

    // 2. Fingerprint may contain UNVERIFIED platform identity, but the local
    // executable artifact digest must be a physical SHA-256 when built.
    count++;
    const fingerprint = runtimeAuthorityManifestManager.getFingerprint();
    if (!fingerprint.artifactDigest || (fingerprint.artifactDigest !== 'UNVERIFIED' && !/^sha256:[0-9a-f]{64}$/i.test(fingerprint.artifactDigest))) {
      failures.push('Runtime Fingerprint artifact digest is malformed');
    }

    // 3. Scheduler lease may be leader or standby. A test must never assume it
    // is entitled to leadership merely because it can call the lease function.
    count++;
    const lease = runtimeAuthorityManifestManager.acquireOrRenewLease();
    if (!lease || !['ACTIVE_LEADER', 'STANDBY'].includes(lease.state) || typeof lease.fencingToken !== 'number') {
      failures.push('Scheduler Leader Lease returned an invalid fail-closed state');
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

    // 6. Legacy gap-register shape is still checked for compatibility, but its
    // internal claims are not treated as independent production proof.
    count++;
    const report = zeaburRuntimeGapRegister.getGapRegisterReport();
    if (report.totalGapsAudited !== 22) {
      failures.push(`Zeabur Gap Register schema incomplete: ${report.totalGapsAudited}/22 gaps present`);
    }

    // 7. Negative bypass test runner must execute without reporting failures;
    // production acceptance remains external to this test process.
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
