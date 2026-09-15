import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { realBrowserCustomerSimulatorEngine } from '../server/cpaOrganization/realBrowserCustomerSimulatorEngine';

// One bounded invocation under Hermes native cron --no-agent. No injected daemon.
const root = process.env.EVE_ACADEMY_STATE_DIR || path.join(process.env.HERMES_HOME || '/opt/data', 'academy-ui');
fs.mkdirSync(root, { recursive: true });
const stateFile = path.join(root, 'scheduler-state.json');
function persist(value: any) {
  const temporary = stateFile + '.tmp';
  fs.writeFileSync(temporary, JSON.stringify({ ...value, authority: 'HERMES_NATIVE_CRON_UI', enabled: process.env.ACADEMY_AUTONOMOUS_ENABLED === 'true',
    checkedAt: new Date().toISOString() }, null, 2), { mode: 0o600 });
  const fd = fs.openSync(temporary, 'r'); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(temporary, stateFile);
  const directory = fs.openSync(root, 'r'); try { fs.fsyncSync(directory); } finally { fs.closeSync(directory); }
}

async function tick() {
  if (process.env.ACADEMY_AUTONOMOUS_ENABLED !== 'true') { persist({ state: 'DISARMED' }); return; }
  if (process.env.EVE_ACADEMY_LOCK_HELD !== '1') throw new Error('NATIVE_CRON_FLOCK_REQUIRED');
  const lock = path.join(root, 'execution-owner.json');
  const fd = fs.openSync(lock, 'w', 0o600);
  try {
    fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, host: os.hostname(), startedAt: new Date().toISOString() })); fs.fsyncSync(fd);
    const prior = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
    if (prior.cooldownUntil && Date.parse(prior.cooldownUntil) > Date.now()) { persist({ ...prior, state: 'COOLDOWN' }); return; }
    if (os.freemem() < 512 * 1024 * 1024 || os.loadavg()[0] > os.availableParallelism() * 1.5) { persist({ state: 'RESOURCE_WAIT' }); return; }
    const executable = realBrowserCustomerSimulatorEngine.resolveChromeExecutablePath();
    const configPath = path.join(root, 'case.json');
    if (!fs.existsSync(configPath)) { persist({ state: 'ENABLED_AWAITING_AUTHORIZED_FIXTURE', executable }); return; }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!/^[a-zA-Z0-9_-]+$/.test(config.caseId || '') || !config.expectedMetrics || !config.synthetic || !config.fixturePath || !config.fixtureSha256 || !config.caseId) throw new Error('EXPLICIT_SYNTHETIC_FIXTURE_REQUIRED');
    const hash = crypto.createHash('sha256').update(fs.readFileSync(config.fixturePath)).digest('hex');
    if (hash !== config.fixtureSha256) throw new Error('FIXTURE_HASH_MISMATCH');
    const disk = fs.statfsSync(root);
    if (disk.bavail * disk.bsize < 512 * 1024 * 1024) { persist({ state: 'DISK_RESOURCE_WAIT' }); return; }
    if (!config.healthUrls?.worker || !config.healthUrls?.hermes) throw new Error('WORKER_AND_HERMES_HEALTH_GATES_REQUIRED');
    for (const [name, url] of Object.entries(config.healthUrls)) {
      const response = await fetch(String(url), { signal: AbortSignal.timeout(15000), redirect: 'error' });
      if (!response.ok) throw new Error(`${name}_HEALTH_HTTP_${response.status}`);
      const health: any = await response.json();
      if (!['ok', 'healthy'].includes(String(health.status).toLowerCase())) throw new Error(`${name}_HEALTH_UNVERIFIED`);
      if (name === 'worker' && health.activeJobsCount > 0) { persist({ state: 'CUSTOMER_PRIORITY_PREEMPTED' }); return; }
    }
    const evidenceDir = path.join(root, 'runs', config.caseId);
    const checkpointFile = path.join(evidenceDir, 'checkpoint.json');
    const checkpoint = fs.existsSync(checkpointFile) ? JSON.parse(fs.readFileSync(checkpointFile, 'utf8')) : null;
    if (checkpoint && !checkpoint.intakeSessionId) { persist({ state: 'SUBMISSION_UNCERTAIN_REQUIRES_RECONCILIATION', caseId: config.caseId }); return; }
    if (checkpoint?.state === 'TRUTH_FAILED') { persist({ state: 'FAILED_TRUTH_REQUIRES_CORRECTION', caseId: config.caseId }); return; }
    if (checkpoint?.state === 'UI_JOURNEY_EXECUTED_PENDING_ACCEPTANCE') { persist({ state: 'AWAITING_ACCEPTANCE_REVIEW', caseId: config.caseId }); return; }
    const pinFile = process.env.EVE_OPERATOR_PIN_FILE || path.join(root, 'runtime', 'operator.pin');
    const operatorPin = fs.readFileSync(pinFile, 'utf8').trim();
    persist({ state: 'RUNNING', caseId: config.caseId, executable, evidenceDir });
    const result = await realBrowserCustomerSimulatorEngine.executeBrowserCustomerJourney({
      clientName: config.clientName, ticker: 'ACADEMY', engagementId: config.caseId, physicalSourcePath: config.fixturePath,
      routingMode: 'NEW_ENGAGEMENT', engagementName: config.caseId, reportingStandard: 'US_GAAP', reportingCurrency: 'USD',
      viewport: config.viewport || { width: 1365, height: 900 }, operatorPin, academy: { evidenceDir, resumeIntakeId: checkpoint?.intakeSessionId, expectedMetrics: config.expectedMetrics }
    });
    fs.writeFileSync(path.join(evidenceDir, 'learning.json'), JSON.stringify({ fixture: { id: config.caseId, sha256: hash }, result,
      score: null, status: 'PHYSICAL_ACCEPTANCE_REVIEW_REQUIRED', observations: [] }, null, 2), { mode: 0o600 });
    persist({ state: 'AWAITING_ACCEPTANCE_REVIEW', caseId: config.caseId, journeyId: result.journeyId,
      cooldownUntil: new Date(Date.now() + 30 * 60000).toISOString() });
  } catch (error: any) {
    persist({ state: 'BLOCKED', error: error.message, cooldownUntil: new Date(Date.now() + 5 * 60000).toISOString() });
    process.exitCode = 1;
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
void tick();
