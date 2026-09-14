/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — RUNTIME AUTHORITY & DEPLOYMENT PARITY MANIFEST
 *
 * This manifest is an application self-observation surface. It MUST NOT manufacture
 * deployment identity or promote itself to externally verified proof. Physical
 * deployment acceptance is performed outside the application runtime.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export type EnvironmentClass = 'ZEABUR_PRODUCTION' | 'DEV_PREVIEW' | 'LOCAL_TEST';
export type ComponentRole =
  | 'ORCHESTRATOR_AND_CPA_PLATFORM'
  | 'EXTRACTION_WORKER'
  | 'LOCAL_AI_SERVICE'
  | 'HERMES_AGENT';

export type ProofLevel =
  | 'CONFIGURED'
  | 'RUNTIME_VERIFIED'
  | 'PRODUCT_VERIFIED'
  | 'BROWSER_VERIFIED';

export interface RuntimeAuthorityManifest {
  manifestVersion: string;
  componentId: string;
  componentRole: ComponentRole;
  environmentClass: EnvironmentClass;
  platform: string;
  projectIdentifier: string;
  serviceIdentifier: string;
  region: string;
  networkIdentity: {
    internalDns: string;
    publicUrl: string;
    port: number;
  };
  repository: {
    originUrl: string;
    branch: string;
    commitSha: string;
    cleanWorkingTree: boolean | null;
  };
  build: {
    buildId: string;
    builtAt: string;
    artifactDigest: string;
    containerImageDigest: string;
    deploymentGeneration: number | null;
  };
  runtimeInstance: {
    hostname: string;
    pid: number;
    podIdentity: string;
    startedAt: string;
    uptimeSeconds: number;
  };
  governance: {
    schemaVersion: string;
    configurationHash: string;
    featureFlagSetHash: string;
    persistentStorageIdentity: string;
    storagePath: string;
    storageMountVerified: boolean;
    proofLevel: ProofLevel;
    owner: string;
  };
  endpoints: {
    healthEndpoint: string;
    readinessEndpoint: string;
    manifestEndpoint: string;
    fingerprintEndpoint: string;
    classification: 'PUBLIC_AND_INTERNAL' | 'INTERNAL_ONLY' | 'PUBLIC_ONLY';
  };
  verification: {
    lastDeploymentAt: string;
    lastRuntimeVerificationAt: string;
    status: 'AUTHENTIC_AUTHORITATIVE' | 'DEGRADED' | 'STANDBY';
    evidenceSource: 'APPLICATION_SELF_OBSERVATION';
  };
}

export interface RuntimeFingerprint {
  service: string;
  version: string;
  environmentClass: EnvironmentClass;
  platform: string;
  repository: string;
  branch: string;
  commitSha: string;
  buildId: string;
  artifactDigest: string;
  imageDigest: string;
  builtAt: string;
  deployedAt: string;
  startedAt: string;
  schemaVersion: string;
  configHash: string;
  featureFlagsHash: string;
  instanceId: string;
  proofLevel: ProofLevel;
}

export interface SchedulerLeaderLease {
  leaseId: string;
  schedulerDomain: string;
  leaderInstanceId: string;
  leaderHostname: string;
  leaderPid: number;
  fencingToken: number;
  acquiredAt: string;
  renewedAt: string;
  expiresAt: string;
  ttlMs: number;
  state: 'ACTIVE_LEADER' | 'STANDBY' | 'EXPIRED';
}

export class RuntimeAuthorityManifestManager {
  private static instance: RuntimeAuthorityManifestManager | null = null;
  private startedAt = new Date().toISOString();
  private storageDir: string;
  private manifestFilePath: string;
  private leaseFilePath: string;
  private commitSha: string;
  private buildId: string;
  private artifactDigest: string;
  private imageDigest: string;
  private currentLease: SchedulerLeaderLease | null = null;
  private fencingCounter = 1;
  private leaseTtlMs = 30000;
  private leaseRenewalInterval: NodeJS.Timeout | null = null;

  public constructor() {
    // Zeabur mounts Eve's durable volume at /storage. Prefer that physical mount
    // before any container-layer fallback. HERMES_PERSISTENT_DATA_DIR remains an
    // explicit override for deployments that intentionally use another path.
    this.storageDir = process.env.HERMES_PERSISTENT_DATA_DIR ||
      (fs.existsSync('/storage')
        ? path.join('/storage', 'cpa_memory')
        : (fs.existsSync('/opt/data')
          ? '/opt/data/cpa_organization'
          : path.join(process.cwd(), 'storage', 'cpa_memory')));

    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch {
        // Persistence failure is reflected by storageMountVerified=false and
        // must be handled by external deployment acceptance.
      }
    }

    this.manifestFilePath = path.join(this.storageDir, 'runtime_manifest.json');
    this.leaseFilePath = path.join(this.storageDir, 'scheduler_leader_lease.json');

    // These are declared provenance inputs, not self-proving evidence. Never
    // invent a commit or image digest when the platform did not supply one.
    this.commitSha = this.normalizeCommitSha(
      process.env.ZEABUR_GIT_COMMIT_SHA ||
      process.env.SOURCE_GIT_COMMIT_SHA ||
      process.env.GIT_COMMIT ||
      process.env.COMMIT_SHA ||
      this.resolveGitCommitSha()
    );
    this.buildId = this.firstNonEmpty(
      process.env.ZEABUR_BUILD_ID,
      process.env.BUILD_ID,
      process.env.ZEABUR_DEPLOYMENT_ID
    ) || 'UNVERIFIED';
    this.artifactDigest = this.computeArtifactDigest();
    this.imageDigest = this.normalizeImageDigest(
      process.env.CONTAINER_IMAGE_DIGEST || process.env.IMAGE_DIGEST
    );

    this.startSchedulerLeaseManager();
    this.persistManifest();
  }

  public static getInstance(): RuntimeAuthorityManifestManager {
    if (!RuntimeAuthorityManifestManager.instance) {
      RuntimeAuthorityManifestManager.instance = new RuntimeAuthorityManifestManager();
    }
    return RuntimeAuthorityManifestManager.instance;
  }

  private firstNonEmpty(...values: Array<string | undefined>): string | undefined {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return undefined;
  }

  private normalizeCommitSha(value?: string): string {
    const candidate = (value || '').trim();
    return /^[0-9a-f]{40}$/i.test(candidate) ? candidate.toLowerCase() : 'UNVERIFIED';
  }

  private normalizeImageDigest(value?: string): string {
    const candidate = (value || '').trim();
    return /^sha256:[0-9a-f]{64}$/i.test(candidate) ? candidate.toLowerCase() : 'UNVERIFIED';
  }

  private resolveGitCommitSha(): string {
    try {
      const gitHeadPath = path.join(process.cwd(), '.git', 'HEAD');
      if (fs.existsSync(gitHeadPath)) {
        const head = fs.readFileSync(gitHeadPath, 'utf-8').trim();
        if (head.startsWith('ref:')) {
          const refPath = path.join(process.cwd(), '.git', head.substring(5).trim());
          if (fs.existsSync(refPath)) {
            return fs.readFileSync(refPath, 'utf-8').trim();
          }
        }
        return head;
      }
    } catch {
      // Fail closed below.
    }
    return 'UNVERIFIED';
  }

  private computeArtifactDigest(): string {
    try {
      const serverBundlePath = path.join(process.cwd(), 'dist', 'server.cjs');
      if (fs.existsSync(serverBundlePath)) {
        const content = fs.readFileSync(serverBundlePath);
        return `sha256:${crypto.createHash('sha256').update(content).digest('hex')}`;
      }
    } catch {
      // Fail closed below.
    }
    return 'UNVERIFIED';
  }

  private computeConfigHash(): string {
    const safeEnvKeys = [
      'NODE_ENV',
      'PORT',
      'ZEABUR_SERVICE_ID',
      'ZEABUR_ENVIRONMENT_ID',
      'HERMES_PERSISTENT_DATA_DIR',
      'EXTRACTION_WORKER_URL',
      'LOCAL_AI_BASE_URL',
      'ACADEMY_AUTONOMOUS_ENABLED'
    ];
    const pairs = safeEnvKeys.map(k => `${k}=${process.env[k] || ''}`).sort().join(';');
    return crypto.createHash('sha256').update(pairs).digest('hex').substring(0, 16);
  }

  private computeFeatureFlagsHash(): string {
    const flags = {
      DOCUMENT_INTELLIGENCE_V2: true,
      UNIVERSAL_IR_CONSERVATION: true,
      HERMES_AUTONOMOUS_SCHEDULER: true,
      LEADER_FENCING_ENFORCEMENT: true,
      SEC_LIVE_EDGAR_DISCOVERY: true,
      AUDIT_PACKAGE_FACTORY_V1: true,
      ACADEMY_AUTONOMOUS_ENABLED: process.env.ACADEMY_AUTONOMOUS_ENABLED === 'true'
    };
    return crypto.createHash('sha256').update(JSON.stringify(flags)).digest('hex').substring(0, 16);
  }

  private getCleanWorkingTreeClaim(): boolean | null {
    const raw = this.firstNonEmpty(process.env.GIT_WORKTREE_CLEAN, process.env.SOURCE_WORKTREE_CLEAN);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return null;
  }

  private getDeploymentGeneration(): number | null {
    const raw = this.firstNonEmpty(
      process.env.ZEABUR_DEPLOYMENT_GENERATION,
      process.env.DEPLOYMENT_GENERATION,
      process.env.KUBERNETES_DEPLOYMENT_REVISION
    );
    if (!raw) return null;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  private isStorageOnMountedVolume(): boolean {
    try {
      const target = fs.realpathSync(this.storageDir);
      const mountInfo = fs.readFileSync('/proc/self/mountinfo', 'utf-8');
      const mountPoints = mountInfo.split('\n').map(line => line.trim().split(/\s+/)[4]).filter(Boolean);
      return mountPoints.some(mountPoint => target === mountPoint || target.startsWith(`${mountPoint}/`)) &&
             mountPoints.some(mountPoint => mountPoint === '/storage' && (target === '/storage' || target.startsWith('/storage/')));
    } catch {
      return false;
    }
  }

  public getLiveSystemMetrics(): {
    cpuCores: number;
    cpuLoadAvg: number[];
    ramFreeMb: number;
    ramTotalMb: number;
    ramHeapUsedMb: number;
    ramProcessRssMb: number;
    diskFreeGb: number;
    diskTotalGb: number;
    diskPath: string;
    isRealMetrics: boolean;
  } {
    const mem = process.memoryUsage();
    const heapUsedMb = Math.round(mem.heapUsed / (1024 * 1024));
    const rssMb = Math.round(mem.rss / (1024 * 1024));
    const totalRamMb = Math.round(os.totalmem() / (1024 * 1024));
    const freeRamMb = Math.round(os.freemem() / (1024 * 1024));

    let diskFreeGb = 0;
    let diskTotalGb = 0;
    let isRealDisk = false;

    try {
      if (typeof (fs as any).statfsSync === 'function') {
        const stats = (fs as any).statfsSync(this.storageDir);
        if (stats && stats.blocks && stats.bsize) {
          diskFreeGb = Math.round((stats.bfree * stats.bsize) / (1024 * 1024 * 1024));
          diskTotalGb = Math.round((stats.blocks * stats.bsize) / (1024 * 1024 * 1024));
          isRealDisk = true;
        }
      }
    } catch {
      // Leave zero values instead of synthetic capacity defaults.
    }

    return {
      cpuCores: os.cpus()?.length || 1,
      cpuLoadAvg: os.loadavg ? os.loadavg() : [0, 0, 0],
      ramFreeMb: freeRamMb,
      ramTotalMb: totalRamMb,
      ramHeapUsedMb: heapUsedMb,
      ramProcessRssMb: rssMb,
      diskFreeGb,
      diskTotalGb,
      diskPath: this.storageDir,
      isRealMetrics: isRealDisk
    };
  }

  public getManifest(): RuntimeAuthorityManifest {
    const isZeabur = !!(
      process.env.ZEABUR_ENVIRONMENT_ID ||
      process.env.ZEABUR_SERVICE_ID ||
      process.env.ZEABUR_PROJECT_ID ||
      process.env.ZEABUR === 'true'
    );
    const envClass: EnvironmentClass = isZeabur ? 'ZEABUR_PRODUCTION' : 'DEV_PREVIEW';
    const uptimeSec = Math.max(0, Math.round((Date.now() - new Date(this.startedAt).getTime()) / 1000));
    const storageMountVerified = this.isStorageOnMountedVolume();
    const isLeader = this.isLeader();
    const portRaw = Number.parseInt(process.env.PORT || process.env.WEB_PORT || '3000', 10);
    const port = Number.isFinite(portRaw) && portRaw > 0 ? portRaw : 3000;

    return {
      manifestVersion: '1.5.0',
      componentId: 'eve-bookkeeping-cpa-platform',
      componentRole: 'ORCHESTRATOR_AND_CPA_PLATFORM',
      environmentClass: envClass,
      platform: isZeabur ? 'ZEABUR_K3S' : 'CONTAINER_SANDBOX',
      projectIdentifier: process.env.ZEABUR_PROJECT_ID || process.env.ZEABUR_PROJECT_NAME || 'UNVERIFIED',
      serviceIdentifier: process.env.ZEABUR_SERVICE_ID || process.env.ZEABUR_SERVICE_NAME || 'eve-s-bookkeeping-intelligence',
      region: process.env.ZEABUR_REGION || process.env.HOST_REGION || 'UNVERIFIED',
      networkIdentity: {
        internalDns: process.env.EVE_S_BOOKKEEPING_INTELLIGENCE_HOST || 'UNVERIFIED',
        publicUrl: process.env.ZEABUR_WEB_URL || process.env.PUBLIC_URL || 'UNVERIFIED',
        port
      },
      repository: {
        originUrl: 'https://github.com/aijaraix/Eve-s-Bookkeeping-Intelligence',
        branch: process.env.GIT_BRANCH || 'main',
        commitSha: this.commitSha,
        cleanWorkingTree: this.getCleanWorkingTreeClaim()
      },
      build: {
        buildId: this.buildId,
        builtAt: process.env.BUILD_TIMESTAMP || process.env.BUILT_AT || 'UNVERIFIED',
        artifactDigest: this.artifactDigest,
        containerImageDigest: this.imageDigest,
        deploymentGeneration: this.getDeploymentGeneration()
      },
      runtimeInstance: {
        hostname: os.hostname(),
        pid: process.pid,
        podIdentity: `pod-${os.hostname()}`,
        startedAt: this.startedAt,
        uptimeSeconds: uptimeSec
      },
      governance: {
        schemaVersion: '1.5.0',
        configurationHash: this.computeConfigHash(),
        featureFlagSetHash: this.computeFeatureFlagsHash(),
        persistentStorageIdentity: process.env.PERSISTENT_STORAGE_IDENTITY || (storageMountVerified ? 'MOUNTED_VOLUME:/storage' : 'UNVERIFIED'),
        storagePath: this.storageDir,
        storageMountVerified,
        // The application can describe its own runtime but cannot independently
        // certify itself. SentinelX/operator acceptance promotes proof externally.
        proofLevel: 'CONFIGURED',
        owner: process.env.RUNTIME_OWNER || 'Eve Bookkeeping'
      },
      endpoints: {
        healthEndpoint: '/api/health',
        readinessEndpoint: '/api/health',
        // These routes are not physically exposed in the current server and must
        // not be advertised as live until they are independently verified.
        manifestEndpoint: 'UNAVAILABLE',
        fingerprintEndpoint: 'UNAVAILABLE',
        classification: 'INTERNAL_ONLY'
      },
      verification: {
        lastDeploymentAt: process.env.DEPLOYED_AT || 'UNVERIFIED',
        lastRuntimeVerificationAt: 'UNVERIFIED',
        status: isLeader ? 'DEGRADED' : 'STANDBY',
        evidenceSource: 'APPLICATION_SELF_OBSERVATION'
      }
    };
  }

  public getFingerprint(): RuntimeFingerprint {
    const manifest = this.getManifest();
    return {
      service: manifest.serviceIdentifier,
      version: manifest.manifestVersion,
      environmentClass: manifest.environmentClass,
      platform: manifest.platform,
      repository: manifest.repository.originUrl,
      branch: manifest.repository.branch,
      commitSha: manifest.repository.commitSha,
      buildId: manifest.build.buildId,
      artifactDigest: manifest.build.artifactDigest,
      imageDigest: manifest.build.containerImageDigest,
      builtAt: manifest.build.builtAt,
      deployedAt: manifest.verification.lastDeploymentAt,
      startedAt: manifest.runtimeInstance.startedAt,
      schemaVersion: manifest.governance.schemaVersion,
      configHash: manifest.governance.configurationHash,
      featureFlagsHash: manifest.governance.featureFlagSetHash,
      instanceId: manifest.runtimeInstance.podIdentity,
      proofLevel: manifest.governance.proofLevel
    };
  }

  private persistManifest() {
    try {
      const manifest = this.getManifest();
      const tmpPath = `${this.manifestFilePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(manifest, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.manifestFilePath);
    } catch (err) {
      console.warn('[RuntimeAuthority] Failed to persist self-observation manifest:', err);
    }
  }

  // =========================================================================
  // SCHEDULER LEADER LEASE & FENCING
  // =========================================================================

  private startSchedulerLeaseManager() {
    this.acquireOrRenewLease();
    this.leaseRenewalInterval = setInterval(() => {
      this.acquireOrRenewLease();
    }, Math.floor(this.leaseTtlMs / 3));
  }

  private readPersistedLease(): SchedulerLeaderLease | null {
    try {
      if (!fs.existsSync(this.leaseFilePath)) return null;
      const raw = fs.readFileSync(this.leaseFilePath, 'utf-8');
      return JSON.parse(raw) as SchedulerLeaderLease;
    } catch {
      return null;
    }
  }

  public acquireOrRenewLease(): SchedulerLeaderLease {
    const now = Date.now();
    const instanceId = `pod-${os.hostname()}-${process.pid}`;
    const existingLease = this.readPersistedLease();
    const existingExpiry = existingLease ? new Date(existingLease.expiresAt).getTime() : Number.NaN;
    const isExistingExpired = !existingLease || !Number.isFinite(existingExpiry) || existingExpiry <= now;
    const isMeCurrentLeader = !!existingLease && existingLease.leaderInstanceId === instanceId;

    if (existingLease && !isExistingExpired && !isMeCurrentLeader) {
      // Fail closed. A valid lease owned by another runtime is authoritative.
      // Never manufacture an in-memory ACTIVE_LEADER state for this process.
      this.currentLease = { ...existingLease, state: 'STANDBY' };
      return this.currentLease;
    }

    const fencingToken = existingLease?.fencingToken
      ? existingLease.fencingToken + 1
      : this.fencingCounter++;
    const lease: SchedulerLeaderLease = {
      leaseId: `lease-sched-${fencingToken}`,
      schedulerDomain: 'HERMES_CPA_SCHEDULER',
      leaderInstanceId: instanceId,
      leaderHostname: os.hostname(),
      leaderPid: process.pid,
      fencingToken,
      acquiredAt: isMeCurrentLeader && existingLease ? existingLease.acquiredAt : new Date().toISOString(),
      renewedAt: new Date().toISOString(),
      expiresAt: new Date(now + this.leaseTtlMs).toISOString(),
      ttlMs: this.leaseTtlMs,
      state: 'ACTIVE_LEADER'
    };

    try {
      const tmp = `${this.leaseFilePath}.tmp.${now}.${process.pid}`;
      fs.writeFileSync(tmp, JSON.stringify(lease, null, 2), { encoding: 'utf-8', flag: 'wx' });
      fs.renameSync(tmp, this.leaseFilePath);
      this.currentLease = lease;
      return lease;
    } catch (err) {
      console.warn('[RuntimeAuthority] Failed writing scheduler lease; remaining standby:', err);
      const persisted = this.readPersistedLease();
      if (persisted) {
        this.currentLease = { ...persisted, state: 'STANDBY' };
        return this.currentLease;
      }
      const standby: SchedulerLeaderLease = {
        ...lease,
        state: 'STANDBY',
        expiresAt: new Date(now).toISOString()
      };
      this.currentLease = standby;
      return standby;
    }
  }

  public isLeader(): boolean {
    const persisted = this.readPersistedLease();
    if (!persisted) return false;
    const instanceId = `pod-${os.hostname()}-${process.pid}`;
    const expiresAt = new Date(persisted.expiresAt).getTime();
    return persisted.state === 'ACTIVE_LEADER' &&
      persisted.leaderInstanceId === instanceId &&
      Number.isFinite(expiresAt) &&
      expiresAt > Date.now();
  }

  public getLeaseStatus(): SchedulerLeaderLease | null {
    const persisted = this.readPersistedLease();
    if (!persisted) return this.currentLease;
    const instanceId = `pod-${os.hostname()}-${process.pid}`;
    const expiresAt = new Date(persisted.expiresAt).getTime();
    if (persisted.leaderInstanceId === instanceId && persisted.state === 'ACTIVE_LEADER' && Number.isFinite(expiresAt) && expiresAt > Date.now()) {
      this.currentLease = persisted;
      return persisted;
    }
    this.currentLease = { ...persisted, state: 'STANDBY' };
    return this.currentLease;
  }

  // =========================================================================
  // CREDENTIAL SCRUBBING & PROCESS SAFETY
  // =========================================================================

  public sanitizeStringForSecrets(input: string): string {
    return RuntimeAuthorityManifestManager.sanitizeStringForSecrets(input);
  }

  public getSanitizedEnvSummary(): Record<string, string> {
    return RuntimeAuthorityManifestManager.getSanitizedEnvSummary();
  }

  public static sanitizeStringForSecrets(input: string): string {
    if (!input) return input;
    return input
      .replace(/(AIzaSy[A-Za-z0-9_-]{15,})/g, '[REDACTED_GEMINI_KEY]')
      .replace(/(sk-[A-Za-z0-9_-]{10,})/g, '[REDACTED_SECRET_KEY]')
      .replace(/(bearer\s+)([a-zA-Z0-9_\-\.]{5,})/gi, '$1[REDACTED_TOKEN]')
      .replace(/(token=)([a-zA-Z0-9_\-\.]{5,})/gi, '$1[REDACTED_TOKEN]')
      .replace(/(password=)([^\s&]+)/gi, '$1[REDACTED_PASSWORD]');
  }

  public static getSanitizedEnvSummary(): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveKeywords = ['KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'AUTH', 'CREDENTIAL', 'PRIVATE'];

    for (const [key, val] of Object.entries(process.env)) {
      if (!val) continue;
      const isSensitive = sensitiveKeywords.some(kw => key.toUpperCase().includes(kw));
      if (isSensitive) {
        sanitized[key] = `[CONFIGURED_AND_PROTECTED: len=${val.length}]`;
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }
}

export const runtimeAuthorityManifestManager = RuntimeAuthorityManifestManager.getInstance();
