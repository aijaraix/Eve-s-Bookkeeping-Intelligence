import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Company,
  DocumentRecord,
  ExtractedFact,
  FinancialFact,
  FinancialSummary,
  Project,
  QueueJobStatus,
  UserSession,
  Workspace
} from '../types';
import {
  EMPTY_DISPLAY,
  fetchAuditLogs,
  fetchDocuments,
  fetchFacts,
  fetchFindings,
  fetchIntake,
  fetchQueueJob,
  fetchQueueJobs,
  fetchReports,
  fetchSummary,
  fetchSwarmStatus,
  fetchWorkspaces,
  generateDeliverable,
  jobIsSuccess,
  jobIsTerminal,
  mapQueueJob,
  promoteIntake,
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
  hasFacts: boolean;
  loading: boolean;
  error: string | null;
  intakeStatus: string | null;
  refresh: () => Promise<void>;
  submitDocuments: (files: File[], attachToSelected?: boolean) => Promise<{ intakeSessionId?: string; queueJobId?: string }>;
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
      return;
    }
    const [wsFacts, wsSummary, wsDocs, jobs, wsReports, wsFindings, logs, swarm] = await Promise.all([
      fetchFacts(workspaceId, email),
      fetchSummary(workspaceId, email),
      fetchDocuments(workspaceId, email),
      fetchQueueJobs(workspaceId, email),
      fetchReports(workspaceId, email),
      fetchFindings(workspaceId, email),
      fetchAuditLogs(workspaceId, email),
      fetchSwarmStatus(workspaceId, email)
    ]);
    setFacts(wsFacts);
    setSummary(wsSummary);
    setDocuments(wsDocs);
    setQueueJobs(jobs.map(mapQueueJob));
    setReports(wsReports);
    setFindings(wsFindings);
    setAuditLogs(logs);
    setSwarmStatus(swarm);
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

  const submitDocuments = useCallback(async (files: File[], attachToSelected = false) => {
    const uploadIntent = attachToSelected && selectedWorkspaceId
      ? 'ATTACH_TO_EXISTING_PROJECT'
      : 'CREATE_NEW_INTAKE';
    const result = await uploadDocuments({
      files,
      uploadIntent,
      workspaceId: attachToSelected ? selectedWorkspaceId : undefined,
      userEmail: userSession.email,
      userId: userSession.id
    });
    setIntakeStatus(result.status || 'QUEUED');
    if (result.workspace?.id) {
      setSelectedCompanyId(result.workspace.id);
      setSelectedProjectId(result.workspace.id);
    }
    startPoll(result.intakeSessionId, result.queueJobId);
    return { intakeSessionId: result.intakeSessionId, queueJobId: result.queueJobId };
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
    hasFacts,
    loading,
    error,
    intakeStatus,
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
