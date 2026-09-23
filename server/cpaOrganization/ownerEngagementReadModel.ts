import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/** Shared resolver: read operations never initialize or replace accounting state. */
export function resolveAccountingStorageFile(): string {
  return process.env.STORAGE_FILE || process.env.AI_CPA_STORAGE_FILE || path.join(process.cwd(), 'storage', 'ai_cpa_storage.json');
}
function readJson(file: string): any {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { throw new Error(`ACCOUNTING_READ_UNAVAILABLE: ${path.basename(file)}`); }
}
function records(dir: string, prefix = ''): any[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith('.json')).map(f => ({ data: readJson(path.join(dir, f)), file: path.join(dir, f) }));
}
function array(value: any, name: string): any[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`ACCOUNTING_READ_INVALID: ${name}`);
  return value;
}
const upper = (v: any) => String(v || '').toUpperCase();
const unique = (xs: any[]) => [...new Set(xs.filter(v => v !== undefined && v !== null && v !== ''))];
function classification(id: string, name: string, explicit?: string): any {
  if (['PRODUCTION_CUSTOMER', 'ACADEMY_SYNTHETIC', 'ACADEMY_PUBLIC_DATA', 'INTERNAL_ACCEPTANCE', 'ACADEMY', 'CANARY', 'REGRESSION', 'DEMO', 'CUSTOMER'].includes(explicit || '')) return explicit;
  if (id.includes('canary')) return 'CANARY';
  if (id.startsWith('eng-practice-') || name.includes('Academy')) return 'ACADEMY';
  return 'CUSTOMER';
}
export function readOwnerEngagements(): any[] {
  const db = readJson(resolveAccountingStorageFile());
  if (!Array.isArray(db.workspaces)) throw new Error('ACCOUNTING_READ_INVALID: workspaces');
  for (const key of ['documents', 'facts', 'findings', 'reports']) array(db[key], key);
  const root = path.join(process.cwd(), 'storage');
  const continuations = records(path.join(root, 'cpa_memory', 'verified_customer_continuations')).map(r => r.data);
  const queueFile = process.env.QUEUE_FILE || path.join(root, 'queue_jobs.json');
  const jobs = fs.existsSync(queueFile) ? array(readJson(queueFile), 'queue') : [];
  const packages = records(process.env.HERMES_REPORTS_DIR || path.join(root, 'reports'), 'audit_package_');
  const clarificationFile = path.join(root, 'cpa_memory', 'clarifications', 'clarification_requests.json');
  const clarifications = fs.existsSync(clarificationFile) ? array(readJson(clarificationFile), 'clarifications') : [];
  const sufficiencyDecisions = records(path.join(root, 'cpa_memory', 'task_sufficiency')).map(r => r.data);
  const result: any[] = [];
  for (const ws of db.workspaces) {
    if (!ws.id) throw new Error('ACCOUNTING_READ_INVALID: workspace identity');
    const linked = continuations.filter(c => c.workspaceId === ws.id);
    const engagementIds = unique([ws.engagementId, ...linked.map(c => c.engagementId)]);
    // A workspace awaiting intake retains its real ID; no invented engagement identity.
    for (const engagementId of engagementIds.length ? engagementIds : [ws.id]) {
      const states = linked.filter(c => c.engagementId === engagementId).sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
      const state = states[0];
      for (const c of states) {
        const job = jobs.find(j => j.id === c.jobId);
        if (!job || job.workspaceId !== ws.id || job.documentId !== c.documentId) throw new Error('ACCOUNTING_RELATIONSHIP_INVALID: continuation queue linkage');
      }
      const documentIds = unique(states.map(c => c.documentId));
      const docs = array(db.documents, 'documents').filter(d => d.workspaceId === ws.id && (!states.length || documentIds.includes(d.id)));
      if (states.some(c => !docs.some(d => d.id === c.documentId))) throw new Error('ACCOUNTING_RELATIONSHIP_INVALID: continuation document linkage');
      const facts = array(db.facts, 'facts').filter(f => (f.workspaceId ?? f.workspace_id) === ws.id && (!states.length || documentIds.includes(f.documentId ?? f.document_id)));
      const pkgs = packages.filter(p => p.data.engagementId === engagementId && (!p.data.workspaceId || p.data.workspaceId === ws.id));
      const workspaceDocuments = array(db.documents, 'documents').filter(d => d.workspaceId === ws.id);
      result.push(project(ws, engagementId, docs, facts, states, pkgs, array(db.findings, 'findings').filter(f => f.workspaceId === ws.id), jobs.filter(j => j.workspaceId === ws.id && (!states.length || states.some(c => c.jobId === j.id))), workspaceDocuments, clarifications.filter(c => c.projectId === ws.id), sufficiencyDecisions.filter(d => d.task?.workspaceId === ws.id)));
    }
  }
  // Preserve historical synthetic packages without seeding simulations or fabricating customer workspaces.
  for (const p of packages) {
    const cls = classification(p.data.engagementId || '', p.data.clientName || '', p.data.classification);
    if (cls === 'CUSTOMER' || result.some(r => r.engagementId === p.data.engagementId)) continue;
    const group = packages.filter(q => q.data.engagementId === p.data.engagementId);
    result.push(project({ id: null, name: p.data.clientName, classification: cls }, p.data.engagementId, [], [], [], group, [], []));
  }
  return result;
}
function project(ws: any, engagementId: string, docs: any[], facts: any[], states: any[], packages: any[], findings: any[], jobs: any[], workspaceDocuments: any[] = docs, clarificationHistory: any[] = [], sufficiencyHistory: any[] = []): any {
  const state = states[0];
  const reports = packages.map(({ data: p, file }) => {
    const dir = path.dirname(file);
    const formats: any = {};
    for (const [key, filename] of Object.entries({ pdf: `audit_report_${p.reportId}_${p.version}.pdf`, xlsx: `audit_workbook_${p.reportId}_${p.version}.xlsx`, csv: `lead_schedules_${p.reportId}_${p.version}.csv`, json: path.basename(file) })) {
      const target = path.join(dir, filename);
      if (fs.existsSync(target)) formats[key] = { sha256: crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'), sizeBytes: fs.statSync(target).size };
    }
    return { engagementId, workspaceId: ws.id, reportId: p.reportId, version: p.version, title: p.title || 'AI-prepared review package', generatedAt: p.generatedAt || null, status: p.status === 'SUPERSEDED' || p.status === 'STALE_INVALIDATED' ? p.status : 'DRAFT', recordedStatus: p.status || null, professionalApproval: 'NOT_ASSERTED_BY_READ_MODEL', deliveryEligible: false, period: p.period || p.reportingPeriod || null, deliverableType: p.deliverableType || 'AI_PREPARED_REVIEW_PACKAGE', formats, sha256: formats.json?.sha256, specialistReview: p.specialistReview, disclosureEvidenceLedger: p.disclosureEvidenceLedger };
  }).sort((a, b) => String(b.generatedAt || '').localeCompare(String(a.generatedAt || '')));
  const newestByReport = new Set<string>();
  for (const report of reports) {
    const historical = newestByReport.has(report.reportId);
    newestByReport.add(report.reportId);
    Object.assign(report, {
      isHistorical: historical,
      displayStatus: historical ? 'HISTORICAL_SUPERSEDED' : report.status,
      warning: historical ? 'Legacy wording; not an audit or assurance opinion' : null,
      sourceStatus: report.recordedStatus,
    });
  }
  const cls = classification(engagementId, ws.name || '', ws.tenantClassification || ws.classification);
  const isCustomer = cls === 'CUSTOMER' || cls === 'PRODUCTION_CUSTOMER';
  const eligible = facts.filter(f => upper(f.status) === 'APPROVED' && upper(f.verificationStatus || f.verification_status) === 'VERIFIED' && upper(f.evidenceStatus || f.evidence_status) === 'CONFIRMED' && (f.documentId || f.document_id) && String(f.sourceText || f.source_text || '').trim());
  const periods = unique(facts.map(f => f.reportingPeriod || f.period));
  const stage = state?.status?.startsWith('BLOCKED') ? 'STALLED' : state ? 'EVIDENCE_REVIEW' : docs.length ? 'DOCUMENTS_RECEIVED' : 'ONBOARDING';
  const pbc = array(ws.pbcRequests, 'pbcRequests');
  const recordedUncertainties = (state?.specialistSummary?.jobs || []).flatMap((job: any) =>
    (job.uncertainties || []).map((finding: any) => ({ agentId: job.agentId, finding })));
  const readableFindings = recordedUncertainties.map(({ agentId, finding }: any) =>
    `${agentId}: ${typeof finding === 'string' ? finding : [finding.topic, finding.description || finding.message || JSON.stringify(finding)].filter(Boolean).join(' — ')}`);

  return {
    workspaceId: ws.id, engagementId, classification: cls, isCustomer, clientId: ws.id, clientName: state?.clientName || ws.name || 'Name not recorded', entityName: state?.clientName || ws.name || 'Name not recorded', industry: ws.industry || 'Not recorded', jurisdiction: ws.country || 'Not recorded', period: reports[0]?.period || state?.fiscalYear || ws.period || (periods.length === 1 ? periods[0] : 'Not recorded'), periods,
    framework: ws.framework || null, functionalCurrency: ws.currency || state?.reportingCurrency || null, presentationCurrency: ws.currency || state?.reportingCurrency || null,
    currentStage: stage, status: state?.status || stage, stageProgressPercent: null, assignedPartner: null, assignedManager: null, leadAgents: [],
    documentsCount: docs.length, canonicalFactsCount: unique(eligible.map(f => f.id)).length,
    measurements: { rawExtractedRows: facts.length, eligibleRows: eligible.length, uniqueEligibleFactIds: unique(eligible.map(f => f.id)).length, evidenceOccurrences: facts.length, sourceDocumentCount: docs.length, reportIncludedFactIds: unique(packages.find(p => p.data.reportId === reports[0]?.reportId && p.data.version === reports[0]?.version)?.data.facts?.map((f: any) => f.id) || []).length },
    openPbcCount: pbc.filter(p => p.status !== 'CLEARED').length, clearedPbcCount: pbc.filter(p => p.status === 'CLEARED').length,
    openReviewNotesCount: findings.filter(f => !['CLEARED', 'Auto Resolved'].includes(f.status)).length, clearedReviewNotesCount: findings.filter(f => ['CLEARED', 'Auto Resolved'].includes(f.status)).length,
    reportsGeneratedCount: reports.length, latestReportId: reports[0]?.reportId, materiality: ws.materiality || null, startedAt: ws.createdAt || state?.startedAt || null, lastActivityAt: state?.updatedAt || ws.updatedAt || ws.createdAt || null,
    numericVariance: state?.euclidBalance?.variance ?? null, crossEngagementLeakageScore: null,
    notes: isCustomer ? 'AI-prepared work. Authorized professional review remains required.' : 'Academy or acceptance evidence; not production customer work or professional certification.',
    documents: docs.map(d => ({ ...d, documentId: d.id, filename: d.originalName || d.filename || d.name || null, filesize: d.size ?? null, mimeType: d.mimeType || d.type || null, sha256: d.sha256 || null, classification: d.classification || cls, documentCategory: d.category || null, uploadedAt: d.createdAt || d.uploadedAt || null, pagesCount: d.pageCount ?? d.pagesCount ?? null })),
    documentHistory: workspaceDocuments.map(d => ({ ...d, documentId: d.id, filename: d.originalName || d.filename || d.name || null, filesize: d.size ?? null, mimeType: d.mimeType || d.type || null, sha256: d.sha256 || null, classification: d.classification || cls, documentCategory: d.category || null, uploadedAt: d.createdAt || d.uploadedAt || null, pagesCount: d.pageCount ?? d.pagesCount ?? null })),
    clarificationHistory,
    sufficiencyHistory,
    facts, financialFacts: facts, findings, pbcRequests: pbc, reviewNotes: findings, reports,
    continuation: state ? { continuationId: state.continuationId, jobId: state.jobId, documentId: state.documentId, engagementId, workspaceId: ws.id, status: state.status, jobAttempt: state.jobAttempt, logicVersion: state.logicVersion, systemFindings: state.systemFindings || [], reviewFindings: readableFindings.length ? readableFindings : (state.reviewFindings || []), structuredUncertainties: recordedUncertainties, specialistSummary: state.specialistSummary, internalTruthAudit: state.internalTruthAudit, minervaLiveValidation: state.minervaLiveValidation } : null,
    jobs: jobs.map(j => ({ jobId: j.id, workspaceId: j.workspaceId, documentId: j.documentId, status: j.status, stage: j.stage, attempts: j.attemptCount })),
  };
}
