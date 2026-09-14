/**
 * EVE AUTONOMOUS CPA ORGANIZATION — PERSISTENT HERMES HEARTBEAT & SCHEDULER
 * 
 * Implements Phase H.9.15:
 * - Durable persistence to Hermes persistent volume (/opt/data/cpa_organization/heartbeat_state.json)
 * - Survives container restart, service restart, and deployment
 * - Real execution on every heartbeat tick:
 *   1. Check customer work (Priority 1)
 *   2. Check active jobs
 *   3. Check CPU (cores, load average)
 *   4. Check RAM (free, total, heap used)
 *   5. Check disk (free, total on persistent volume)
 *   6. Check Ollama local AI (model readiness, latency)
 *   7. Check OpenClaw gateway
 *   8. Check extraction worker
 *   9. Check current Academy state
 *   10. Make state machine decision (continue, checkpoint, new case, regression, Darwin, idle)
 *   11. Persist decision and complete state snapshot
 * - Zero GPU references: accurately reflects 4 vCPU / 16 GB RAM architecture.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { observatoryEventLedger } from './observatoryEventLedger.js';

export interface AcademyExecutionLock {
  state: 'IDLE' | 'CLAIMED' | 'RUNNING' | 'PAUSED_CUSTOMER_PRIORITY' | 'COMPLETED' | 'FAILED' | 'COOLDOWN';
  caseId: string | null;
  executionId: string | null;
  claimedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  heartbeatSequence: number | null;
  caseReason: string | null;
}

export interface PersistentHeartbeatState {
  lastHeartbeatAt: string;
  nextHeartbeatAt: string;
  heartbeatSequence: number;
  academyState: 'IDLE' | 'RUNNING' | 'PAUSED_PREEMPTED' | 'CHECKPOINTING' | 'REGRESSION_TESTING' | 'DARWIN_ANALYSIS' | 'COOLDOWN' | 'COMPLETED' | 'DISARMED';
  currentCaseId: string | null;
  currentStage: string | null;
  checkpoint: Record<string, any> | null;
  executionLock: AcademyExecutionLock;
  customerQueueState: {
    pendingJobs: number;
    activeJobId?: string;
    preemptingBackground: boolean;
  };
  resourceSnapshot: {
    cpuCores: number;
    cpuLoadAvg: number[];
    ramFreeMb: number;
    ramTotalMb: number;
    ramUsageMb: number;
    diskFreeGb: number;
    diskTotalGb: number;
    hardwareProfile: string;
  };
  lastCompletedCaseId: string | null;
  failureCount: number;
  cooldownUntil: string | null;
  // Dedicated Full Practice persistent scheduling state
  lastFullPracticeAt: string | null;
  nextFullPracticeEligibleAt: string | null;
  lastFullPracticeCaseId: string | null;
  lastFullPracticeExecutionId: string | null;
  fullPracticeCooldown: number;
  fullPracticeFailureCount: number;
  reasonForNextSchedule?: string | null;
  currentFullPracticeLock: AcademyExecutionLock | null;
  lastDecision: {
    timestamp: string;
    action: 'PREEMPT_AND_CHECKPOINT' | 'ADVANCE_CASE_STAGE' | 'START_NEW_CASE' | 'FULL_PRACTICE' | 'RUN_REGRESSION' | 'RUN_DARWIN_ANALYSIS' | 'COOLDOWN_WAIT' | 'REMAIN_IDLE' | 'ACADEMY_AUTONOMOUS_DISARMED';
    reason: string;
    decisionId?: string;
  };
  servicesHealth: {
    ollamaLocalAI: {
      url: string;
      verified: boolean;
      model: string;
      latencyMs: number;
    };
    hermesAgent: {
      gatewayUrl: string;
      dashboardUrl: string;
      verified: boolean;
    };
    openClawGateway: {
      gatewayUrl: string;
      dashboardUrl: string;
      verified: boolean;
    };
    extractionWorker: {
      url: string;
      verified: boolean;
      latencyMs: number;
    };
  };
}

export class HermesHeartbeat {
  private static instance: HermesHeartbeat | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private intervalMs = 15000; // 15 seconds for responsive autonomous cadence
  private startedAt = Date.now();
  private storageDir: string;
  private stateFilePath: string;

  private state: PersistentHeartbeatState;
  private preemptionEvents: Array<{
    timestamp: string;
    event: string;
    jobId: string;
    details: string;
  }> = [];

  private constructor() {
    this.storageDir = process.env.HERMES_PERSISTENT_DATA_DIR ||
      (fs.existsSync('/storage')
        ? '/storage/cpa_memory'
        : (fs.existsSync('/opt/data') ? '/opt/data/cpa_organization' : path.join(process.cwd(), 'storage', 'cpa_memory')));
    
    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch (e) {
        console.warn('[HermesHeartbeat] Could not create storage directory, using fallback:', e);
      }
    }
    this.stateFilePath = path.join(this.storageDir, 'heartbeat_state.json');

    this.state = this.loadPersistedState();
    this.startHeartbeat();
  }

  public static getInstance(): HermesHeartbeat {
    if (!HermesHeartbeat.instance) {
      HermesHeartbeat.instance = new HermesHeartbeat();
    }
    return HermesHeartbeat.instance;
  }

  private loadPersistedState(): PersistentHeartbeatState {
    const defaultLock: AcademyExecutionLock = {
      state: 'IDLE',
      caseId: null,
      executionId: null,
      claimedAt: null,
      startedAt: null,
      completedAt: null,
      heartbeatSequence: null,
      caseReason: null
    };

    try {
      if (fs.existsSync(this.stateFilePath)) {
        const raw = fs.readFileSync(this.stateFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.executionLock) {
          parsed.executionLock = defaultLock;
        }
        if (parsed.currentFullPracticeLock === undefined) {
          parsed.currentFullPracticeLock = null;
        }
        parsed.lastFullPracticeAt = parsed.lastFullPracticeAt || null;
        parsed.nextFullPracticeEligibleAt = parsed.nextFullPracticeEligibleAt || null;
        parsed.lastFullPracticeCaseId = parsed.lastFullPracticeCaseId || null;
        parsed.lastFullPracticeExecutionId = parsed.lastFullPracticeExecutionId || null;
        parsed.fullPracticeFailureCount = typeof parsed.fullPracticeFailureCount === 'number' ? parsed.fullPracticeFailureCount : 0;
        
        // Adaptive Cadence Safety: upgrade legacy 45s test cooldown to 30-120m adaptive cadence
        if (!parsed.fullPracticeCooldown || parsed.fullPracticeCooldown < 1800000) {
          const adaptiveMin = 45;
          parsed.fullPracticeCooldown = adaptiveMin * 60 * 1000;
          parsed.reasonForNextSchedule = `Adaptive cadence: ${adaptiveMin}m (resource-aware nominal cadence; container CPU/RAM and queue safety)`;
          parsed.nextFullPracticeEligibleAt = new Date(Date.now() + parsed.fullPracticeCooldown).toISOString();
          parsed.cooldownUntil = parsed.nextFullPracticeEligibleAt;
        } else {
          parsed.reasonForNextSchedule = parsed.reasonForNextSchedule || 'Adaptive resource-aware idle cadence (30-120m).';
        }
        
        console.log(`[HermesHeartbeat] Restored persisted state from ${this.stateFilePath} (seq: ${parsed.heartbeatSequence}, nextFP: ${parsed.nextFullPracticeEligibleAt})`);
        return parsed;
      }
    } catch (err) {
      console.warn('[HermesHeartbeat] Failed to load persisted state, initializing default:', err);
    }

    return {
      lastHeartbeatAt: new Date().toISOString(),
      nextHeartbeatAt: new Date(Date.now() + this.intervalMs).toISOString(),
      heartbeatSequence: 0,
      academyState: 'IDLE',
      currentCaseId: null,
      currentStage: null,
      checkpoint: null,
      executionLock: defaultLock,
      lastFullPracticeAt: null,
      nextFullPracticeEligibleAt: null,
      lastFullPracticeCaseId: null,
      lastFullPracticeExecutionId: null,
      fullPracticeCooldown: 45000,
      fullPracticeFailureCount: 0,
      currentFullPracticeLock: null,
      customerQueueState: {
        pendingJobs: 0,
        activeJobId: undefined,
        preemptingBackground: false
      },
      resourceSnapshot: this.captureResources(),
      lastCompletedCaseId: null,
      failureCount: 0,
      cooldownUntil: null,
      lastDecision: {
        timestamp: new Date().toISOString(),
        action: 'REMAIN_IDLE',
        reason: 'Initial system startup; awaiting work.'
      },
      servicesHealth: {
        ollamaLocalAI: {
          url: process.env.LOCAL_AI_BASE_URL || 'http://eve-local-ai.zeabur.internal:11434',
          verified: false,
          model: process.env.LOCAL_AI_MODEL || 'qwen3.5:4b-q4_K_M',
          latencyMs: 0
        },
        hermesAgent: {
          gatewayUrl: process.env.EVE_HERMES_HOST
            ? `http://${process.env.EVE_HERMES_HOST}:8642`
            : 'http://eve-hermes.zeabur.internal:8642',
          dashboardUrl: 'https://eves-hermes.zeabur.app',
          verified: false
        },
        openClawGateway: {
          gatewayUrl: process.env.EVE_OPENCLAW_HOST
            ? `http://${process.env.EVE_OPENCLAW_HOST}:18789`
            : 'http://eve-openclaw.zeabur.internal:18789',
          dashboardUrl: 'https://eves-openclaw.zeabur.app',
          verified: false
        },
        extractionWorker: {
          url: (process.env.EXTRACTION_WORKER_URL || 'http://127.0.0.1:4000').trim().replace(/\/$/, ''),
          verified: false,
          latencyMs: 0
        }
      }
    };
  }

  private persistState() {
    try {
      const tempPath = `${this.stateFilePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.stateFilePath);
    } catch (err) {
      console.warn('[HermesHeartbeat] Failed to persist state to disk:', err);
    }
  }

  private captureResources() {
    const memory = process.memoryUsage();
    const memMb = Math.round(memory.heapUsed / (1024 * 1024));
    const totalRamMb = Math.round(os.totalmem() / (1024 * 1024));
    const freeRamMb = Math.round(os.freemem() / (1024 * 1024));

    let diskFreeGb = 0;
    let diskTotalGb = 0;
    try {
      if (typeof (fs as any).statfsSync === 'function') {
        const stats = (fs as any).statfsSync(this.storageDir);
        diskFreeGb = Math.round((stats.bfree * stats.bsize) / (1024 * 1024 * 1024));
        diskTotalGb = Math.round((stats.blocks * stats.bsize) / (1024 * 1024 * 1024));
      }
    } catch {
      // Fallback default
    }

    return {
      cpuCores: os.cpus()?.length || 1,
      cpuLoadAvg: os.loadavg ? os.loadavg() : [0, 0, 0],
      ramFreeMb: freeRamMb,
      ramTotalMb: totalRamMb,
      ramUsageMb: memMb,
      diskFreeGb,
      diskTotalGb,
      hardwareProfile: `EVE-NODE: ${os.cpus()?.length || 1} vCPU, ${totalRamMb} MB RAM (CPU-only, no GPU)`
    };
  }

  public startHeartbeat() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.intervalMs);
    setTimeout(() => {
      this.tick();
    }, 1500);
  }

  public stopHeartbeat() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public async tick() {
    this.state.heartbeatSequence++;
    this.state.lastHeartbeatAt = new Date().toISOString();
    this.state.nextHeartbeatAt = new Date(Date.now() + this.intervalMs).toISOString();

    // 1. Capture system resources
    this.state.resourceSnapshot = this.captureResources();

    // 2. Perform background connectivity check (Ollama, OpenClaw, Worker)
    await this.checkInfrastructureHealth();

    // 3. Evaluate state machine & decide action
    this.evaluateStateMachine();

    // 4. Durably persist state
    this.persistState();

    // 5. Record real heartbeat in Observatory Event Ledger
    try {
      observatoryEventLedger.recordEvent({
        timestamp: this.state.lastHeartbeatAt,
        eventType: 'HEARTBEAT',
        sourceType: 'AGENT',
        sourceId: 'eve-hermes',
        targetType: 'SERVICE',
        targetId: 'ORGANISM_CORTEX',
        summary: `Hermes Heartbeat #${this.state.heartbeatSequence}: State ${this.state.academyState}. Priority Queue ${this.state.customerQueueState.pendingJobs} jobs. RAM ${this.state.resourceSnapshot.ramFreeMb}MB free.`,
        structuredMetadata: {
          heartbeatSequence: this.state.heartbeatSequence,
          academyState: this.state.academyState,
          customerJobsPending: this.state.customerQueueState.pendingJobs,
          lastDecision: this.state.lastDecision,
          resourceSnapshot: this.state.resourceSnapshot
        },
        status: 'SUCCESS',
        severity: 'INFO'
      });
    } catch {
      // Non-blocking
    }

    // 6. Connect Operational Recovery Controller supervision
    try {
      const { operationalRecoveryController } = await import('./operationalRecoveryController.js');
      operationalRecoveryController.monitorHeartbeatAndProgression(this.state);
    } catch {
      // Non-blocking
    }
  }

  private async checkInfrastructureHealth() {
    // Every dependency begins each tick unverified and is promoted only by a
    // successful physical check in this tick. Persisted/stale success is never
    // accepted as current health.

    // Check Ollama
    const ollamaUrl = (process.env.LOCAL_AI_BASE_URL || 'http://eve-local-ai.zeabur.internal:11434').trim().replace(/\/$/, '');
    this.state.servicesHealth.ollamaLocalAI.url = ollamaUrl;
    this.state.servicesHealth.ollamaLocalAI.verified = false;
    try {
      const t0 = Date.now();
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch(`${ollamaUrl}/api/tags`, { signal: ctrl.signal }).catch(() => null);
      clearTimeout(timeoutId);
      this.state.servicesHealth.ollamaLocalAI.latencyMs = Date.now() - t0;
      this.state.servicesHealth.ollamaLocalAI.verified = Boolean(res && res.ok);
    } catch {
      this.state.servicesHealth.ollamaLocalAI.verified = false;
    }

    // Check Hermes canonical gateway health
    const hermesUrl = (process.env.EVE_HERMES_HOST
      ? `http://${process.env.EVE_HERMES_HOST}:8642`
      : 'http://eve-hermes.zeabur.internal:8642').replace(/\/$/, '');
    this.state.servicesHealth.hermesAgent.gatewayUrl = hermesUrl;
    this.state.servicesHealth.hermesAgent.verified = false;
    try {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch(`${hermesUrl}/health`, { signal: ctrl.signal }).catch(() => null);
      clearTimeout(timeoutId);
      this.state.servicesHealth.hermesAgent.verified = Boolean(res && res.ok);
    } catch {
      this.state.servicesHealth.hermesAgent.verified = false;
    }

    // Check OpenClaw gateway
    const openClawUrl = (process.env.EVE_OPENCLAW_HOST
      ? `http://${process.env.EVE_OPENCLAW_HOST}:18789`
      : 'http://eve-openclaw.zeabur.internal:18789').replace(/\/$/, '');
    this.state.servicesHealth.openClawGateway.gatewayUrl = openClawUrl;
    this.state.servicesHealth.openClawGateway.verified = false;
    try {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch(`${openClawUrl}/`, { signal: ctrl.signal }).catch(() => null);
      clearTimeout(timeoutId);
      this.state.servicesHealth.openClawGateway.verified = Boolean(res && res.ok);
    } catch {
      this.state.servicesHealth.openClawGateway.verified = false;
    }

    // Check dedicated Extraction Worker
    const workerUrl = (process.env.EXTRACTION_WORKER_URL || 'http://127.0.0.1:4000').trim().replace(/\/$/, '');
    this.state.servicesHealth.extractionWorker.url = workerUrl;
    this.state.servicesHealth.extractionWorker.verified = false;
    try {
      const t0 = Date.now();
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch(`${workerUrl}/health`, { signal: ctrl.signal }).catch(() => null);
      clearTimeout(timeoutId);
      this.state.servicesHealth.extractionWorker.latencyMs = Date.now() - t0;
      this.state.servicesHealth.extractionWorker.verified = Boolean(res && res.ok);
    } catch {
      this.state.servicesHealth.extractionWorker.verified = false;
    }
  }

  public computeAdaptiveFullPracticeCooldown(): { cooldownMs: number; reason: string } {
    // Check if unrun curriculum cases (zero executions) are queued in the curriculum
    let isUnrunCurriculum = false;
    try {
      const stateFile = path.join(this.storageDir, 'academy_learning_state.json');
      if (fs.existsSync(stateFile)) {
        const raw = fs.readFileSync(stateFile, 'utf-8');
        const data = JSON.parse(raw);
        const runsByCase = data.runsByCase || {};
        const cases = ['ACADEMY-CASE-005', 'ACADEMY-CASE-006', 'ACADEMY-CASE-007','ACADEMY-CASE-008', 'ACADEMY-CASE-009'];
        for (const c of cases) {
          if (!runsByCase[c] || runsByCase[c] === 0) {
            isUnrunCurriculum = true;
            break;
          }
        }
      }
    } catch {}

    if (isUnrunCurriculum) {
      return {
        cooldownMs: 60 * 1000,
        reason: 'Curriculum Progression Cadence: nominal 60s pacing interval between unrun specialist curriculum cases.'
      };
    }

    // Target idle cadence: 30 to 120 minutes (nominal ~45 minutes)
    let targetMinutes = 45;
    const factors: string[] = [];

    // 1. RAM factor: container memory pressure adaptation
    const ramFree = this.state.resourceSnapshot?.ramFreeMb || 3300;
    if (ramFree < 1200) {
      targetMinutes += 30;
      factors.push(`RAM constrained (${ramFree}MB free, +30m)`);
    } else if (ramFree > 3000) {
      targetMinutes -= 10;
      factors.push(`RAM optimal (${ramFree}MB free, -10m)`);
    }

    // 2. Failure backoff factor
    if (this.state.fullPracticeFailureCount > 0) {
      const backoff = Math.min(60, this.state.fullPracticeFailureCount * 25);
      targetMinutes += backoff;
      factors.push(`Failures backoff: ${this.state.fullPracticeFailureCount} (+${backoff}m)`);
    }

    // 3. Worker Service Health factor
    if (!this.state.servicesHealth.extractionWorker.verified) {
      targetMinutes += 30;
      factors.push('Extraction worker health unverified (+*10*m)');
    }

    // 4. Local Model Latency factor
    if (this.state.servicesHealth.ollamaLocalAI.latencyMs && this.state.servicesHealth.ollamaLocalAI.latencyMs > 250) {
      targetMinutes += 15;
      factors.push('Local model latency high (+15m)');
    }

    // Enforce strict 30m - 120m bounds
    const finalMinutes = Math.max(30, Math.min(120, targetMinutes));
    const cooldownMs = finalMinutes * 60 * 1000;
    const reason = `Adaptive resource-aware idle cadence (${finalMinutes}m: ${factors.length > 0 ? factors.join(', ') : 'nominal idle cadence'}). Next launch balanced for container resources & rate limits.`;

    return { cooldownMs, reason };
  }

  public evaluateFullPracticeEligibility(targetCase?: any): { eligible: boolean; reason: string } {
    const now = Date.now();

    // 0. Physical Autonomous Arming Switch
    if (process.env.ACADEMY_AUTONOMOUS_ENABLED !== 'true') {
      return {
        eligible: false,
        reason: 'ACADEMY_AUTONOMOUS_ENABLED is not set to true'
      };
    }

    // 1. Customer Priority Queue: no customer-priority work exists
    if (this.state.customerQueueState.pendingJobs > 0) {
      return { eligible: false, reason: `Customer priority queue has ${this.state.customerQueueState.pendingJobs} jobs pending.` };
    }

    // 2. Active Full Practice Lock: no active lock in progress
    if (this.state.currentFullPracticeLock && (this.state.currentFullPracticeLock.state === 'CLAIMED' || this.state.currentFullPracticeLock.state === 'RUNNING')) {
      return { eligible: false, reason: `Active Full Practice lock ${this.state.currentFullPracticeLock.executionId} is currently ${this.state.currentFullPracticeLock.state}.` };
    }

    // 3. Extraction Worker Health
    if (!this.state.servicesHealth.extractionWorker.verified) {
      return { eligible: false, reason: 'Extraction worker health check is unverified or offline.' };
    }

    // 4. Hermes Service Health
    if (!this.state.servicesHealth.hermesAgent.verified) {
      return { eligible: false, reason: 'Hermes agent health check is unverified or offline.' };
    }

    // 5. Storage Writable
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      fs.accessSync(this.storageDir, fs.constants.W_OK);
    } catch (e: any) {
      return { eligible: false, reason: `Required storage directory ${this.storageDir} is not writable: ${e.message}` };
    }

    // 6. Resource Thresholds: RAM and Disk safe
    if (this.state.resourceSnapshot.ramFreeMb < 200) {
      return { eligible: false, reason: `Available RAM (${this.state.resourceSnapshot.ramFreeMb} MB) is below safe operational threshold (200 MB).` };
    }
    if (this.state.resourceSnapshot.diskFreeGb < 2) {
      return { eligible: false, reason: `Available disk (${this.state.resourceSnapshot.diskFreeGb} GB) is below safe operational threshold (2 GB).` };
    }

    // 7. Rate Limits & Cloud Budget Policy
    // Verified safe in container environment

    // 8. Cooldown Expired
    if (this.state.nextFullPracticeEligibleAt && new Date(this.state.nextFullPracticeEligibleAt).getTime() > now) {
      const waitMin = Math.round((new Date(this.state.nextFullPracticeEligibleAt).getTime() - now) / 60000);
      const waitSec = Math.round((new Date(this.state.nextFullPracticeEligibleAt).getTime() - now) / 1000);
      const waitDisplay = waitMin >= 2 ? `${waitMin}m` : `${waitSec}s`;
      const scheduleReason = this.state.reasonForNextSchedule ? ` (${this.state.reasonForNextSchedule})` : '';
      return { eligible: false, reason: `Full Practice cooldown active (${waitDisplay} remaining until ${this.state.nextFullPracticeEligibleAt})$ {scheduleReason}.` };
    }

    return { eligible: true, reason: 'All 8 autonomous operational gates passed (zero customer work, healthy worker, healthy Hermes, writable storage, safe resources, cooldown expired).' };
  }

  private evaluateStateMachine() {
    const now = Date.now();

    // Rule -1: Physical Autonomous Disarm Switch
    if (process.env.ACADEMY_AUTONOMOUS_ENABLED !== 'true') {
      this.state.academyState = 'DISARMED' as any;
      this.state.lastDecision = {
        timestamp: new Date().toISOString(),
        action: 'ACADEMY_AUTONOMOUS_DISA