/**
 * Browser client for the fail-closed CPA API.
 * Live views must read workspaces, facts, and summaries from these endpoints only.
 */

import {
  Company,
  DocumentRecord,
  ExtractedFact,
  FinancialFact,
  FinancialSummary,
  Project,
  QueueJobStatus,
  Workspace
} from '../types';

const DASH = '—';

function userHeaders(email?: string): HeadersInit {
  const headers: Record<string, string> = {};
  if (email) headers['x-user-email'] = email;
  return headers;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error || body.message || res.statusText;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

export async function apiGet<T>(path: string, email?: string): Promise<T> {
  const res = await fetch(path, { headers: userHeaders(email) });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown, email?: string): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...userHeaders(email) },
    body: JSON.stringify(body)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || json.message || `HTTP ${res.status}`) as Error & { status?: number; payload?: unknown };
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json as T;
}

export async function fetchWorkspaces(email?: string): Promise<Workspace[]> {
  return apiGet<Workspace[]>('/api/workspaces', email);
}

export async function fetchFacts(workspaceId: string, email?: string): Promise<ExtractedFact[]> {
  if (!workspaceId) return [];
  return apiGet<ExtractedFact[]>(`/api/facts?workspaceId=${encodeURIComponent(workspaceId)}`, email);
}

export async function fetchSummary(workspaceId?: string, email?: string): Promise<FinancialSummary> {
  const q = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  return apiGet<FinancialSummary>(`/api/financial/summary${q}`, email);
}

export async function fetchDocuments(workspaceId?: string, email?: string): Promise<DocumentRecord[]> {
  const q = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  const data = await apiGet<DocumentRecord[] | { documents?: DocumentRecord[] }>(`/api/documents${q}`, email);
  if (Array.isArray(data)) return data;
  return data.documents || [];
}

export async function fetchQueueJobs(workspaceId?: string, email?: string): Promise<any[]> {
  const q = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  const data = await apiGet<{ jobs?: any[] }>(`/api/queue/jobs${q}`, email);
  return data.jobs || [];
}

export async function fetchIntake(intakeId: string, email?: string): Promise<any> {
  return apiGet<any>(`/api/intake/${encodeURIComponent(intakeId)}`, email);
}

export async function fetchQueueJob(jobId: string, email?: string): Promise<any> {
  return apiGet<any>(`/api/queue/jobs/${encodeURIComponent(jobId)}`, email);
}

export async function promoteIntake(intakeId: string, email?: string): Promise<{ workspace?: Workspace }> {
  return apiPost(`/api/intake/${encodeURIComponent(intakeId)}/promote`, {}, email);
}

export async function fetchReports(workspaceId?: string, email?: string): Promise<any[]> {
  const q = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  const data = await apiGet<any[] | { reports?: any[] }>(`/api/reports${q}`, email);
  if (Array.isArray(data)) return data;
  return data.reports || [];
}

export async function fetchFindings(workspaceId?: string, email?: string): Promise<any[]> {
  const q = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  const data = await apiGet<any[] | { findings?: any[] }>(`/api/findings${q}`, email);
  if (Array.isArray(data)) return data;
  return data.findings || [];
}

export async function fetchAuditLogs(workspaceId?: string, email?: string): Promise<any[]> {
  const q = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  try {
    const data = await apiGet<any[] | { logs?: any[]; auditLogs?: any[] }>(`/api/audit-logs${q}`, email);
    if (Array.isArray(data)) return data;
    return data.logs || data.auditLogs || [];
  } catch {
    return [];
  }
}

export async function fetchSwarmStatus(workspaceId?: string, email?: string): Promise<any> {
  const q = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  try {
    return await apiGet<any>(`/api/swarm/status${q}`, email);
  } catch {
    return null;
  }
}

export interface UploadDocumentsResult {
  success?: boolean;
  error?: string;
  intakeSessionId?: string;
  queueJobId?: string;
  workspace?: Workspace | null;
  documents?: DocumentRecord[];
  factsCount?: number;
  status?: string;
  requiresConfirmation?: boolean;
  existingWorkspace?: Workspace;
}

export async function uploadDocuments(params: {
  files: File[];
  uploadIntent: 'CREATE_NEW_INTAKE' | 'ATTACH_TO_EXISTING_PROJECT';
  workspaceId?: string;
  userEmail?: string;
  userId?: string;
  description?: string;
}): Promise<UploadDocumentsResult> {
  const fd = new FormData();
  for (const file of params.files) {
    fd.append('files', file);
  }
  fd.append('uploadIntent', params.uploadIntent);
  if (params.workspaceId) fd.append('workspaceId', params.workspaceId);
  if (params.userEmail) fd.append('userEmail', params.userEmail);
  if (params.userId) fd.append('userId', params.userId);
  if (params.description) fd.append('description', params.description);

  const res = await fetch('/api/documents/upload', {
    method: 'POST',
    headers: userHeaders(params.userEmail),
    body: fd
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || json.message || `Upload failed (${res.status})`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return json;
}

export async function generateDeliverable(params: {
  workspaceId: string;
  signedOffBy: string;
  companyName?: string;
  projectName?: string;
  deliverableType?: string;
  audience?: string;
}): Promise<{ success: boolean; report?: any; error?: string }> {
  const res = await fetch('/api/deliverables/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...userHeaders(params.signedOffBy) },
    body: JSON.stringify(params)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: json.error || `Report refused (${res.status})` };
  }
  return json;
}

export async function sendEveChat(message: string, workspaceId?: string, email?: string): Promise<string> {
  try {
    const json = await apiPost<any>('/api/chat', { message, workspaceId }, email);
    return json.reply || json.message || json.text || 'No response from Eve.';
  } catch (err: any) {
    return `Eve cannot answer from verified facts yet. ${err.message || ''}`.trim();
  }
}

export function dash(value?: string | number | null): string {
  if (value == null) return DASH;
  const s = String(value).trim();
  if (!s || s === '0' || s === 'undefined' || s === 'null') return DASH;
  return s;
}

export function displayOrDash(value?: string | number | null, hasFacts?: boolean): string {
  if (!hasFacts) return DASH;
  return dash(value);
}

function classifyStatement(f: ExtractedFact): FinancialFact['statementType'] {
  const st = String(f.statementType || (f as any).statement_type || '').toLowerCase();
  const metric = String(f.canonicalMetric || f.canonical_metric || f.factType || '').toLowerCase();
  if (st.includes('income') || ['revenue', 'comparative_revenue', 'cost_of_sales', 'gross_profit', 'operating_profit', 'ebitda', 'profit_before_tax', 'net_income'].includes(metric)) {
    return 'INCOME_STATEMENT';
  }
  if (st.includes('balance') || ['total_assets', 'total_liabilities', 'total_equity'].includes(metric)) {
    return 'BALANCE_SHEET';
  }
  if (st.includes('cash') || metric.includes('cash_flow')) {
    return 'CASH_FLOW';
  }
  if (st.includes('segment')) return 'SEGMENT';
  return 'NOTE_DISCLOSURE';
}

function mapFactStatus(status?: string): FinancialFact['status'] {
  const upper = String(status || '').toUpperCase();
  if (upper === 'APPROVED' || upper === 'VERIFIED' || upper === 'VALIDATED') return 'VERIFIED';
  if (upper === 'RECONCILED') return 'RECONCILED';
  if (upper === 'CONFLICT' || upper === 'REJECTED' || upper === 'BLOCKED') return 'CONFLICT';
  return 'REVIEW_REQUIRED';
}

export function toFinancialFact(f: ExtractedFact, documentTitle?: string): FinancialFact {
  const value = typeof f.normalizedValue === 'number' && Number.isFinite(f.normalizedValue)
    ? f.normalizedValue
    : Number(f.valueFunctional);
  const periodType = String(f.periodType || '').toLowerCase().includes('quarter') ? 'QUARTERLY' : 'ANNUAL';
  return {
    id: f.id,
    metric: String(f.canonicalMetric || f.factType || ''),
    label: f.labelNormalized || f.labelOriginal || 'Unlabelled line item',
    value: Number.isFinite(value) ? value : 0,
    formattedValue: f.valueOriginal ? String(f.valueOriginal) : (Number.isFinite(value) ? String(value) : DASH),
    rawString: String(f.valueOriginal || f.rawValue || ''),
    currency: f.currencyOriginal || f.functionalCurrency || f.currency || '',
    period: f.reportingPeriod || f.periodOriginal || f.fiscalYear || '',
    periodType,
    statementType: classifyStatement(f),
    pageNumber: f.pageNumber || 0,
    tableHeader: f.tableName || f.statementName,
    scaleSource: f.unitScale || f.scale,
    confidence: typeof f.confidence === 'number' ? f.confidence : undefined as unknown as number,
    status: mapFactStatus(f.status),
    provenance: {
      documentId: f.documentId,
      documentTitle: documentTitle || f.sourceDocument || f.documentId,
      section: f.statementSection || f.statementName || '',
      snippet: f.sourceText || f.rawText || ''
    }
  };
}

export function mapQueueJob(job: any): QueueJobStatus {
  const statusRaw = String(job.status || 'QUEUED').toUpperCase();
  let status: QueueJobStatus['status'] = 'QUEUED';
  if (statusRaw.includes('FAIL')) status = 'FAILED';
  else if (statusRaw.includes('COMPLETE')) status = 'COMPLETED';
  else if (statusRaw.includes('PROCESS')) status = 'PROCESSING';
  else if (statusRaw.includes('CAPACITY')) status = 'WAITING_FOR_AI_CAPACITY';
  else if (statusRaw.includes('QUEUE')) status = 'QUEUED';

  const engine = String(job.engineMode || job.engine_mode || 'HYBRID_GEMINI_NATIVE');
  return {
    id: job.id,
    documentTitle: job.filename || job.documentTitle || job.documentId || 'Document',
    fileSize: job.fileSize || '',
    pagesTotal: job.pagesTotal || job.pageCount || 0,
    pagesCompleted: job.pagesCompleted || job.pagesProcessed || 0,
    status,
    currentStage: job.currentStage || job.stage || statusRaw,
    engineMode: engine.includes('OCR') ? 'STRUCTURED_OCR' : engine.includes('DEEP') ? 'DEEP_PARSER' : 'HYBRID_GEMINI_NATIVE',
    progress: typeof job.progress === 'number' ? job.progress : (status === 'COMPLETED' ? 100 : 0),
    factsExtracted: job.factsExtracted || job.factsCount || 0,
    startedAt: job.startedAt || job.createdAt || ''
  };
}

export function workspaceToCompany(
  ws: Workspace,
  summary?: FinancialSummary | null,
  factCount = 0,
  docCount = 0
): Company {
  const hasFacts = factCount > 0 && Boolean(summary?.hasValidatedFacts || factCount > 0);
  const revenue = hasFacts ? dash(summary?.revenue) : DASH;
  const netIncome = hasFacts ? dash(summary?.netIncome) : DASH;
  const assets = hasFacts ? dash(summary?.assets) : DASH;
  return {
    id: ws.id,
    workspaceId: ws.id,
    name: ws.name,
    ticker: ws.code || '',
    country: ws.country || '',
    reporting: 'IFRS',
    currency: ws.currency || '',
    healthScore: hasFacts ? dash(summary?.validationPassRate) : DASH,
    status: hasFacts ? 'IN_PROGRESS' : 'REVIEW_REQUIRED',
    reg: DASH,
    sector: DASH,
    revenue,
    netIncome,
    assets,
    activeProjectsCount: 1
  };
}

export function workspaceToProject(
  ws: Workspace,
  lead: string,
  factCount = 0,
  docCount = 0
): Project {
  return {
    id: ws.id,
    workspaceId: ws.id,
    companyId: ws.id,
    companyName: ws.name,
    name: ws.period ? `${ws.period} engagement` : `Document extraction — ${ws.name}`,
    ticker: ws.code || '',
    sector: DASH,
    status: factCount > 0 ? 'IN_PROGRESS' : 'PENDING_REVIEW',
    reporting: 'IFRS',
    assignedLead: lead || DASH,
    facts: factCount,
    docsCount: docCount,
    startDate: ws.createdAt ? String(ws.createdAt).slice(0, 10) : DASH,
    dueDate: DASH
  };
}

export const EMPTY_DISPLAY = DASH;

export function jobIsTerminal(status?: string): boolean {
  const s = String(status || '').toUpperCase();
  return s.includes('COMPLETE') || s.includes('FAIL') || s === 'REVIEW_REQUIRED' || s === 'COMPLETED_WITH_WARNINGS';
}

export function jobIsSuccess(status?: string): boolean {
  const s = String(status || '').toUpperCase();
  return s === 'COMPLETED' || s === 'COMPLETED_WITH_WARNINGS' || s === 'REVIEW_REQUIRED';
}
