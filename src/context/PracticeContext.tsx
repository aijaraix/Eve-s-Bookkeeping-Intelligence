import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Company,
  CorporateEntity,
  DocumentRecord,
  EntityRelationship,
  ExtractedFact,
  FinancialFact,
  FinancialSummary,
  FirmBranding,
  Project,
  QueueJobStatus,
  UserSession,
  Workspace
} from '../types';
import {
  EMPTY_DISPLAY,
  apiPost,
  createEntity,
  deleteEntity,
  fetchAuditLogs,
  fetchDocuments,
  fetchEntities,
  fetchFacts,
  fetchFindings,
  fetchFirmBranding,
  fetchFxRates,
  fetchIntake,
  fetchQueueJob,
  fetchQueueJobs,
  fetchRelationships,
  fetchReports,
  fetchSummary,
  fetchSwarmStatus,
  fetchWorkspaces,
  generateDeliverable,
  jobIsSuccess,
  jobIsTerminal,
  mapQueueJob,
  promoteIntake,
  saveFirmBranding,
  sendEveChat,
  toFinancialFact,
  uploadDocuments,
  workspaceToCompany,
  workspaceToProject
} from '../api/practiceClient';

interface PracticeContextValue {
  userSession: UserSession;
  setUserSession: (session: UserSession) => void;
  workspaces: Workspace[];
  companies: Company[];
  projects: Project[];
  selectedCompanyId: string;
  selectedProjectId: string;
  selectedWorkspaceId: string;
  setSelectedCompanyId: (id: string) => void;
  setSelectedProjectId: (id: string) => void;
  facts: ExtractedFact[];
  financialFacts: FinancialFact[];
  summary: FinancialSummary | null;
  documents: DocumentRecord[];
  queueJobs: QueueJobStatus[];
  reports: any[];
  findings: any[];
  auditLogs: any[];
  swarmStatus: any;
  entities: CorporateEntity[];
  relationships: EntityRelationship[];
  fxRates: any[];
  firmBranding: FirmBranding | null;
  activeScope: string;
  setActiveScope: (scope: string) => void;
  activeCurrency: string;
  setActiveCurrency: (currency: string) => void;
  addEntity: (entity: Partial<CorporateEntity>) => Promise<any>;
  removeEntity: (entityId: string) => Promise<boolean>;
  updateFirmBranding: (branding: Partial<FirmBranding>) => Promise<any>;
  hasFacts: boolean;
  loading: boolean;
  error: string | null;
  intakeStatus: string | null;
  activeJob: any | null;
  activeIntake: any | null;
  isAnalyzing: boolean;
  createEngagementWorkspace: (name: string, currency?: string, country?: string) => Promise<Workspace>;
  refresh: () => Promise<void>;
  submitDocuments: (
    files: File[],
    options?: boolean | {
      uploadIntent?: 'CREATE_NEW_INTAKE' | 'ATTACH_TO_EXISTING_PROJECT';
      targetWorkspaceId?: string;
      description?: string;
    }
  ) => Promise<{
    intakeSessionId?: string;
    queueJobId?: string;
    workspace?: any;
    documents?: DocumentRecord[];
    factsCount?: number;
    status?: string;
    intakeSession?: any;
  }>;
  compileReport: (opts: { deliverableType?: string; audience?: string }) => Promise<{ success: boolean; report?: any; error?: string }>;
  askEve: (message: string) => Promise<string>;
}

const PracticeContext = createContext<PracticeContextValue | null>(null);

const defaultSession: UserSession = {
  id: 'user-cpa-1',
  email: 'stevestein4454@gmail.com',
  name: 'Steve Stein, CPA',
  role: 'CPA Lead Partner',
  organization: 'Stein & Associates Audit LLP',
  isAuthenticated: true
};

export const PracticeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userSession, setUserSession] = useState<UserSession>(defaultSession);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [facts, setFacts] = useState<ExtractedFact[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [queueJobs, setQueueJobs] = useState<QueueJobStatus[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [swarmStatus, setSwarmStatus] = useState<any>(null);
  const [factCounts, setFactCounts] = useState<Record<string, number>>({});
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});
  const [summariesByWs, setSummariesByWs] = useState<Record<string, FinancialSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intakeStatus, setIntakeStatus] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [activeIntake, setActiveIntake] = useState<any | null>(null);
  const [entities, setEntities] = useState<CorporateEntity[]>([]);
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [fxRates, setFxRates] = useState<any[]>([]);
  const [firmBranding, setFirmBranding] = useState<FirmBranding | null>(null);
  const [activeScope, setActiveScope] = useState<string>('CONSOLIDATED');
  const [activeCurrency, setActiveCurrency] = useState<string>('USD');
  const pollRef = useRef<number | null>(null);

  const selectedWorkspaceId = selectedProjectId || selectedCompanyId;

  const loadWorkspaceDetail = useCallback(async (workspaceId: string, email: string) => {
    if (!workspaceId) {
      setFacts([]);
      setSummary(null);
      setDocuments([]);
      setQueueJobs([]);
      setReports([]);
      setFindings([]);
      setAuditLogs([]);
      setSwarmStatus(null);
      setEntities([]);
      setRelationships([]);
      return;
    }
    const [wsFacts, wsSummary, wsDocs, jobs, wsReports, wsFindings, logs, swarm, entList, relList, fxList, branding] = await Promise.all([
      fetchFacts(workspaceId, email),
      fetchSummary(workspaceId, email),
      fetchDocuments(workspaceId, email),
      fetchQueueJobs(workspaceId, email),
      fetchReports(workspaceId, email),
      fetchFindings(workspaceId, email),
      fetchAuditLogs(workspaceId, email),
      fetchSwarmStatus(workspaceId, email),
      fetchEntities(workspaceId, email),
      fetchRelationships(workspaceId, email),
      fetchFxRates(email),
      fetchFirmBranding(email)
    ]);
    setFacts(wsFacts);
    setSummary(wsSummary);
    setDocuments(wsDocs);
    setQueueJobs(jobs.map(mapQueueJob));
    setReports(wsReports);
    setFindings(wsFindings);
    setAuditLogs(logs);
    setSwarmStatus(swarm);
    setEntities(entList || []);
    setRelationships(relList || []);
    setFxRates(fxList || []);
    if (branding) setFirmBranding(branding);
    setFactCounts((prev) => ({ ...prev, [workspaceId]: wsFacts.length }));
    setDocCounts((prev) => ({ ...prev, [workspaceId]: wsDocs.length }));
    setSummariesByWs((prev) => ({ ...prev, [workspaceId]: wsSummary }));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const email = userSession.email;
      const list = await fetchWorkspaces(email);
      setWorkspaces(list);

      const counts: Record<string, number> = {};
      const dcounts: Record<string, number> = {};
      const sums: Record<string, FinancialSummary> = {};
      await Promise.all(list.map(async (ws) => {
        const [f, d, s] = await Promise.all([
          fetchFacts(ws.id, email),
          fetchDocuments(ws.id, email),
          fetchSummary(ws.id, email)
        ]);
        counts[ws.id] = f.length;
        dcounts[ws.id] = d.length;
        sums[ws.id] = s;
      }));
      setFactCounts(counts);
      setDocCounts(dcounts);
      setSummariesByWs(sums);

      setSelectedCompanyId((current) => {
        if (current && list.some((w) => w.id === current)) return current;
        return list[0]?.id || '';
      });
      setSelectedProjectId((current) => {
        if (current && list.some((w) => w.id === current)) return current;
        return list[0]?.id || '';
      });

      const nextId = (selectedWorkspaceId && list.some((w) => w.id === selectedWorkspaceId))
        ? selectedWorkspaceId
        : (list[0]?.id || '');
      await loadWorkspaceDetail(nextId, email);
    } catch (err: any) {
      setError(err.message || 'Failed to load practice data');
      setWorkspaces([]);
      setFacts([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [userSession.email, selectedWorkspaceId, loadWorkspaceDetail]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSession.email]);

  useEffect(() => {
    if (!selectedWorkspaceId) return;
    loadWorkspaceDetail(selectedWorkspaceId, userSession.email).catch((err) => {
      setError(err.message || 'Failed to load workspace');
    });
  }, [selectedWorkspaceId, userSession.email, loadWorkspaceDetail]);

  const stopPoll = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPoll = useCallback((intakeId?: string, jobId?: string) => {
    stopPoll();
    if (!intakeId && !jobId) return;
    const tick = async () => {
      try {
        let status = '';
        let promotedWs: Workspace | undefined;
        if (intakeId) {
          const intakeRes = await fetchIntake(intakeId, userSession.email);
          const session = intakeRes.intakeSession || intakeRes;
          setActiveIntake(session);
          status = session.status || '';
          setIntakeStatus(status);
          if (jobIsSuccess(status) && !session.promotedProjectId) {
            try {
              const promoted = await promoteIntake(intakeId, userSession.email);
              promotedWs = promoted.workspace;
            } catch {
              /* promotion may already be complete */
            }
          }
          if (session.promotedProjectId) {
            setSelectedCompanyId(session.promotedProjectId);
            setSelectedProjectId(session.promotedProjectId);
          }
        }
        if (jobId) {
          const jobRes = await fetchQueueJob(jobId, userSession.email);
          const job = jobRes.job || jobRes;
          setActiveJob(job);
          status = job.status || status;
          setIntakeStatus(status);
        }
        if (promotedWs?.id) {
          setSelectedCompanyId(promotedWs.id);
          setSelectedProjectId(promotedWs.id);
        }
        if (jobIsTerminal(status)) {
          stopPoll();
          setIntakeStatus(status);
          await refresh();
        }
      } catch (err: any) {
        setError(err.message || 'Intake poll failed');
      }
    };
    tick();
    pollRef.current = window.setInterval(tick, 2500);
  }, [refresh, userSession.email]);

  useEffect(() => () => stopPoll(), []);

  const createEngagementWorkspace = useCallback(async (name: string, currency = 'USD', country = 'US'): Promise<Workspace> => {
    const res = await apiPost<Workspace>('/api/workspaces', {
      name: name.trim(),
      currency,
      country,
      userEmail: userSession.email
    }, userSession.email);
    await refresh();
    if (res?.id) {
      setSelectedCompanyId(res.id);
      setSelectedProjectId(res.id);
    }
    return res;
  }, [userSession.email, refresh]);

  const submitDocuments = useCallback(async (
    files: File[],
    options?: boolean | {
      uploadIntent?: 'CREATE_NEW_INTAKE' | 'ATTACH_TO_EXISTING_PROJECT';
      targetWorkspaceId?: string;
      description?: string;
    }
  ) => {
    let uploadIntent: 'CREATE_NEW_INTAKE' | 'ATTACH_TO_EXISTING_PROJECT' = 'CREATE_NEW_INTAKE';
    let targetWorkspaceId: string | undefined = undefined;
    let description: string | undefined = undefined;

    if (typeof options === 'boolean') {
      uploadIntent = options && selectedWorkspaceId ? 'ATTACH_TO_EXISTING_PROJECT' : 'CREATE_NEW_INTAKE';
      targetWorkspaceId = options ? selectedWorkspaceId : undefined;
    } else if (options) {
      uploadIntent = options.uploadIntent || (options.targetWorkspaceId ? 'ATTACH_TO_EXISTING_PROJECT' : 'CREATE_NEW_INTAKE');
      targetWorkspaceId = options.targetWorkspaceId;
      description = options.description;
    }

    const result = await uploadDocuments({
      files,
      uploadIntent,
      workspaceId: targetWorkspaceId,
      userEmail: userSession.email,
      userId: userSession.id,
      description
    });

    setIntakeStatus(result.status || 'QUEUED');
    if (result.workspace?.id) {
      setSelectedCompanyId(result.workspace.id);
      setSelectedProjectId(result.workspace.id);
    }
    startPoll(result.intakeSessionId, result.queueJobId);
    return {
      intakeSessionId: result.intakeSessionId,
      queueJobId: result.queueJobId,
      workspace: result.workspace,
      documents: result.documents,
      factsCount: result.factsCount,
      status: result.status,
      intakeSession: (result as any).intakeSession
    };
  }, [selectedWorkspaceId, startPoll, userSession.email, userSession.id]);

  const compileReport = useCallback(async (opts: { deliverableType?: string; audience?: string }) => {
    if (!selectedWorkspaceId) {
      return { success: false, error: 'Select a client workspace before compiling a report.' };
    }
    if (!userSession.email) {
      return { success: false, error: 'A real authenticated user must sign off before export.' };
    }
    const ws = workspaces.find((w) => w.id === selectedWorkspaceId);
    const result = await generateDeliverable({
      workspaceId: selectedWorkspaceId,
      signedOffBy: userSession.email,
      companyName: ws?.name,
      projectName: ws?.period || ws?.name,
      deliverableType: opts.deliverableType,
      audience: opts.audience
    });
    if (result.success) {
      await loadWorkspaceDetail(selectedWorkspaceId, userSession.email);
    }
    return result;
  }, [loadWorkspaceDetail, selectedWorkspaceId, userSession.email, workspaces]);

  const askEve = useCallback(async (message: string) => {
    return sendEveChat(message, selectedWorkspaceId || undefined, userSession.email);
  }, [selectedWorkspaceId, userSession.email]);

  const addEntity = useCallback(async (entity: Partial<CorporateEntity>) => {
    if (!selectedWorkspaceId) return;
    const res = await createEntity(selectedWorkspaceId, entity, userSession.email);
    if (res && res.entity) {
      setEntities((prev) => [...prev, res.entity]);
    }
    return res;
  }, [selectedWorkspaceId, userSession.email]);

  const removeEntity = useCallback(async (entityId: string) => {
    if (!selectedWorkspaceId) return false;
    const ok = await deleteEntity(selectedWorkspaceId, entityId, userSession.email);
    if (ok) {
      setEntities((prev) => prev.filter((e) => e.id !== entityId));
      setRelationships((prev) => prev.filter((r) => r.parentEntityId !== entityId && r.childEntityId !== entityId));
    }
    return ok;
  }, [selectedWorkspaceId, userSession.email]);

  const updateFirmBranding = useCallback(async (branding: Partial<FirmBranding>) => {
    const res = await saveFirmBranding(branding, userSession.email);
    if (res && res.branding) {
      setFirmBranding(res.branding);
    }
    return res;
  }, [userSession.email]);

  const companies = useMemo(
    () => workspaces.map((ws) => workspaceToCompany(ws, summariesByWs[ws.id], factCounts[ws.id] || 0, docCounts[ws.id] || 0)),
    [workspaces, summariesByWs, factCounts, docCounts]
  );

  const projects = useMemo(
    () => workspaces.map((ws) => workspaceToProject(ws, userSession.name, factCounts[ws.id] || 0, docCounts[ws.id] || 0)),
    [workspaces, userSession.name, factCounts, docCounts]
  );

  const financialFacts = useMemo(
    () => facts.map((f) => {
      const doc = documents.find((d) => d.id === f.documentId);
      return toFinancialFact(f, doc?.originalName || doc?.filename);
    }),
    [facts, documents]
  );

  const hasFacts = facts.length > 0;
  const isAnalyzing = Boolean(
    intakeStatus &&
    !jobIsTerminal(intakeStatus)
  ) || Boolean(activeJob && !jobIsTerminal(activeJob.status));

  const value: PracticeContextValue = {
    userSession,
    setUserSession,
    workspaces,
    companies,
    projects,
    selectedCompanyId,
    selectedProjectId,
    selectedWorkspaceId,
    setSelectedCompanyId,
    setSelectedProjectId,
    facts,
    financialFacts,
    summary,
    documents,
    queueJobs,
    reports,
    findings,
    auditLogs,
    swarmStatus,
    entities,
    relationships,
    fxRates,
    firmBranding,
    activeScope,
    setActiveScope,
    activeCurrency,
    setActiveCurrency,
    addEntity,
    removeEntity,
    updateFirmBranding,
    hasFacts,
    loading,
    error,
    intakeStatus,
    activeJob,
    activeIntake,
    isAnalyzing,
    createEngagementWorkspace,
    refresh,
    submitDocuments,
    compileReport,
    askEve
  };

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
};

export function usePractice(): PracticeContextValue {
  const ctx = useContext(PracticeContext);
  if (!ctx) throw new Error('usePractice must be used within PracticeProvider');
  return ctx;
}

export { EMPTY_DISPLAY };
