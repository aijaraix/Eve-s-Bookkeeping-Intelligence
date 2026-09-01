import path from 'path';
import fs from 'fs';
import { beforeAll, afterAll } from 'vitest';

const fixturesDir = path.join(process.cwd(), 'server', 'tests', 'fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

const tmpStorage = path.join(fixturesDir, 'tmp_ai_cpa_storage.json');
const tmpQueue = path.join(fixturesDir, 'tmp_queue_jobs.json');

process.env.NODE_ENV = 'test';
process.env.STORAGE_FILE = tmpStorage;
process.env.QUEUE_FILE = tmpQueue;

const emptyDb = JSON.stringify({
  workspaces: [],
  documents: [],
  facts: [],
  findings: [],
  snapshots: [],
  auditLogs: [],
  discrepancies: [],
  agentLogs: [],
  pageManifests: [],
  sourceBlocks: []
}, null, 2);

beforeAll(() => {
  fs.writeFileSync(tmpStorage, emptyDb);
  fs.writeFileSync(tmpQueue, '[]');
});

afterAll(() => {
  try {
    if (fs.existsSync(tmpStorage)) fs.unlinkSync(tmpStorage);
    if (fs.existsSync(tmpQueue)) fs.unlinkSync(tmpQueue);
  } catch (e) {}
});
