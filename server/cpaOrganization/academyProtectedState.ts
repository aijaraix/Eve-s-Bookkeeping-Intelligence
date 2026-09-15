import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const digest = (value: string | Buffer) => crypto.createHash('sha256').update(value).digest('hex');
function canonical(value: any): any {
  if (Array.isArray(value)) return value.map(canonical).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}

/** Read-only protection manifest. No initialization, reprocessing or repair writes. */
export function captureProtectedWorkspace(storageRoot: string, workspaceId: string) {
  const db = JSON.parse(fs.readFileSync(process.env.STORAGE_FILE || process.env.AI_CPA_STORAGE_FILE || path.join(storageRoot, 'ai_cpa_storage.json'), 'utf8'));
  if (!db.workspaces?.some((w: any) => w.id === workspaceId)) throw new Error('PROTECTED_WORKSPACE_MISSING');
  const docIds = new Set((db.documents || []).filter((d: any) => d.workspaceId === workspaceId).map((d: any) => d.id));
  const belongs = (r: any) => r?.workspaceId === workspaceId || r?.workspace_id === workspaceId || docIds.has(r?.documentId || r?.document_id) || r?.id === workspaceId;
  const tables = Object.fromEntries(Object.entries(db).filter(([, v]) => Array.isArray(v)).map(([key, value]) => [key, (value as any[]).filter(belongs)]));
  const queuePath = process.env.QUEUE_FILE || path.join(storageRoot, 'queue_jobs.json');
  const jobs = JSON.parse(fs.readFileSync(queuePath, 'utf8')).filter(belongs);
  const continuationDir = path.join(storageRoot, 'cpa_memory', 'verified_customer_continuations');
  const continuations = fs.existsSync(continuationDir) ? fs.readdirSync(continuationDir).filter(n => n.endsWith('.json')).map(n => ({ file: path.join(continuationDir, n), value: JSON.parse(fs.readFileSync(path.join(continuationDir, n), 'utf8')) })).filter(r => belongs(r.value)) : [];
  const reportIds = new Set(continuations.map(r => r.value.deliverable?.reportId).filter(Boolean));
  const files = new Set<string>(continuations.map(r => r.file));
  for (const doc of (tables.documents || [])) {
    if (!doc.filePath || !fs.existsSync(doc.filePath)) throw new Error('PROTECTED_SOURCE_BYTES_MISSING');
    files.add(doc.filePath);
  }
  const reportsDir = process.env.HERMES_REPORTS_DIR || path.join(storageRoot, 'reports');
  if (fs.existsSync(reportsDir)) for (const name of fs.readdirSync(reportsDir)) {
    if ([...reportIds].some(id => name.includes(String(id)))) files.add(path.join(reportsDir, name));
  }
  const artifacts = [...files].sort().map(file => ({ file, sha256: digest(fs.readFileSync(file)) }));
  const contents = { workspaceId, tables, jobs, artifacts };
  return { workspaceId, sha256: digest(JSON.stringify(canonical(contents))), tableCounts: Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.length])), jobIds: jobs.map((j: any) => j.id), attempts: jobs.map((j: any) => j.attemptCount), artifacts };
}
