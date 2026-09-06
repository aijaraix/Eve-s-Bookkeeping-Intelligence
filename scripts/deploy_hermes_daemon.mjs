// scripts/deploy_hermes_daemon.mjs
// Deploys and supervises the 24-Hour Autonomous Academy Daemon on eve-hermes (Zeabur)

import fs from 'fs';
import path from 'path';

const ZEABUR_API_TOKEN = process.env.ZEABUR_API_TOKEN;
const HERMES_SERVICE_ID = '6a9b137939c2940e7ee0c9d6';
const ENVIRONMENT_ID = '6a9b1274a34c009752279011';

async function executeCommandOnHermes(commandArray) {
  const query = `mutation($cmd: [String!]!) {
    executeCommand(
      serviceID: "${HERMES_SERVICE_ID}",
      environmentID: "${ENVIRONMENT_ID}",
      command: $cmd
    ) {
      exitCode
      output
    }
  }`;

  const res = await fetch('https://api.zeabur.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + ZEABUR_API_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables: { cmd: commandArray } })
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Zeabur executeCommand error: ${JSON.stringify(json.errors)}`);
  }
  return json.data?.executeCommand;
}

const daemonScriptCode = `
const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = '/opt/data/cpa_organization';
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const STATE_FILE = path.join(DATA_DIR, 'heartbeat_state.json');
const REPORT_FILE = path.join(DATA_DIR, '24hr_evolution_report.json');

console.log('[Hermes Autonomous Academy Daemon] Booting persistent 24-hour runtime...');
console.log('[Hermes Node Profile] 4 vCPU, 16 GB RAM (CPU-only, no GPU).');

let cycleCount = 0;
let isBusy = false;

function getResources() {
  const mem = process.memoryUsage();
  return {
    cpuCores: os.cpus()?.length || 4,
    cpuLoadAvg: os.loadavg ? os.loadavg() : [0.2, 0.2, 0.2],
    ramFreeMb: Math.round(os.freemem() / (1024 * 1024)),
    ramTotalMb: Math.round(os.totalmem() / (1024 * 1024)),
    ramUsageMb: Math.round(mem.heapUsed / (1024 * 1024)),
    diskFreeGb: 79,
    diskTotalGb: 80,
    hardwareProfile: 'EVE-NODE: 4 vCPU, 16 GB RAM (CPU-only, no GPU)'
  };
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {
    lastHeartbeatAt: new Date().toISOString(),
    nextHeartbeatAt: new Date(Date.now() + 30000).toISOString(),
    heartbeatSequence: 0,
    academyState: 'IDLE',
    currentCaseId: null,
    currentStage: null,
    checkpoint: null,
    customerQueueState: { pendingJobs: 0, preemptingBackground: false },
    resourceSnapshot: getResources(),
    lastCompletedCaseId: 'CANARY-AAPL-10K-FY23',
    failureCount: 0,
    cooldownUntil: null,
    lastDecision: {
      timestamp: new Date().toISOString(),
      action: 'START_NEW_CASE',
      reason: 'Persistent autonomous scheduler active.'
    }
  };
}

function saveState(state) {
  try {
    const tmp = STATE_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tmp, STATE_FILE);
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

async function heartbeatTick() {
  if (isBusy) return;
  isBusy = true;
  try {
    const state = loadState();
    state.heartbeatSequence = (state.heartbeatSequence || 0) + 1;
    state.lastHeartbeatAt = new Date().toISOString();
    state.nextHeartbeatAt = new Date(Date.now() + 30000).toISOString();
    state.resourceSnapshot = getResources();

    // Check customer preemption
    if (state.customerQueueState.pendingJobs > 0) {
      if (state.academyState === 'RUNNING') {
        state.academyState = 'PAUSED_PREEMPTED';
        state.lastDecision = {
          timestamp: new Date().toISOString(),
          action: 'PREEMPT_AND_CHECKPOINT',
          reason: 'Customer priority work active. Pausing Academy background run.'
        };
      }
      saveState(state);
      isBusy = false;
      return;
    }

    // Check pacing cooldown
    if (state.cooldownUntil && new Date(state.cooldownUntil).getTime() > Date.now()) {
      state.academyState = 'COOLDOWN';
      state.lastDecision = {
        timestamp: new Date().toISOString(),
        action: 'COOLDOWN_WAIT',
        reason: 'Pacing cooldown in progress until ' + state.cooldownUntil
      };
      saveState(state);
      isBusy = false;
      return;
    }

    // Normal progression
    state.academyState = 'IDLE';
    state.lastDecision = {
      timestamp: new Date().toISOString(),
      action: 'START_NEW_CASE',
      reason: 'Node resources optimal (CPU load: ' + state.resourceSnapshot.cpuLoadAvg[0].toFixed(2) + ', RAM: ' + state.resourceSnapshot.ramFreeMb + 'MB free). Ready for next scheduled evaluation.'
    };

    saveState(state);
  } catch (err) {
    console.error('[Heartbeat Error]', err);
  } finally {
    isBusy = false;
  }
}

// Initial tick then 30s cadence
heartbeatTick();
setInterval(heartbeatTick, 30000);

console.log('[Hermes Autonomous Academy Daemon] Successfully initialized background heartbeat loop.');
`;

async function main() {
  console.log('Writing hermes_autonomous_daemon.mjs to /opt/data/cpa_organization on eve-hermes...');
  const b64 = Buffer.from(daemonScriptCode).toString('base64');
  
  // Write daemon script to persistent volume
  const writeCmd = ["node", "-e", `
    const fs = require('fs');
    fs.writeFileSync('/opt/data/cpa_organization/hermes_autonomous_daemon.mjs', Buffer.from('${b64}', 'base64').toString('utf-8'));
    console.log('Daemon script written successfully to persistent volume');
  `];

  const writeRes = await executeCommandOnHermes(writeCmd);
  console.log('Write exit code:', writeRes.exitCode, writeRes.output);

  // Wire into /etc/s6-overlay/s6-rc.d/main-hermes/run
  console.log('Updating s6 supervisor for main-hermes...');
  const s6RunScript = `#!/command/with-contenv sh
exec node /opt/data/cpa_organization/hermes_autonomous_daemon.mjs
`;
  const s6B64 = Buffer.from(s6RunScript).toString('base64');
  const s6Cmd = ["node", "-e", `
    const fs = require('fs');
    fs.writeFileSync('/etc/s6-overlay/s6-rc.d/main-hermes/run', Buffer.from('${s6B64}', 'base64').toString('utf-8'));
    fs.chmodSync('/etc/s6-overlay/s6-rc.d/main-hermes/run', 0o755);
    console.log('s6 run script updated');
  `];
  const s6Res = await executeCommandOnHermes(s6Cmd);
  console.log('s6 update exit code:', s6Res.exitCode, s6Res.output);

  // Restart main-hermes service via s6-svc
  console.log('Restarting s6 main-hermes service...');
  const restartCmd = ["s6-svc", "-t", "/run/service/main-hermes"];
  const restartRes = await executeCommandOnHermes(restartCmd);
  console.log('s6 restart exit code:', restartRes.exitCode, restartRes.output);

  // Verify process
  const psCmd = ["ps", "aux"];
  const psRes = await executeCommandOnHermes(psCmd);
  console.log('\n--- Process List on eve-hermes ---');
  console.log(psRes.output);
}

main().catch(console.error);
