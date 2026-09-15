import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  ActiveView,
  ViewMode,
  CompanyEntity,
  Project,
  ExtractedFact,
  FinancialFact,
  DocumentRecord,
  FinancialSummary,
  AuditFinding,
  SwarmAgentStatus,
  QueueJobStatus,
  CorporateEntity,
  EntityRelationship,
  FxRateRecord,
  FirmBranding,
  UserSession
} from '../types';

import {
  apiGet,
  fetchWorkspaces,
  fetchFacts,
  fetchSummary,
  fetchDocuments,
  fetchQueueJobs,
  fetchReports,
  fetchFindings,
  fetchAuditLogs,
  fetchSwarmStatus,
  fetchEntities,
  createEntity,
  deleteEntity,
  fetchRelationships,
  fetchFxRates,
  fetchFirmBranding,
  saveFirmBranding,
  uploadDocuments,
  generateDeliverable,
  sendEveChat,
  toFinancialFact,
  mapQueueJob,
  workspaceToCompany,
  workspaceToProject
} from '../api/practiceClient';

export interface PracticeContextType {
  engagementDetail: any;
  dataState: string;
  dataError: string | null;
  lastSuccessfulRead: string | null;
  selectedEngagementId: string;
  // Navigation & Session
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  userSession: UserSession | null;
  setUserSession: (session: UserSession | null) => void;

  // Companies & Workspaces
  companies: CompanyEntity[];
  workspaces: CompanyEntity[];
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
  selectedCompany: CompanyEntity;
  setSelectedCompany: (company: CompanyEntity) => void;
  selectedWorkspaceId: string;

  // Projects
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;

  // Financial Data & Facts
  facts: ExtractedFact[];
  financialFacts: FinancialFact[];
  documents: DocumentRecord[];
  summary: FinancialSummary | null;
  hasFacts: boolean;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;

  // Audit & Findings
  findings: AuditFinding[];
  resolveFinding: (id: string) => void;
  auditLogs: any[];

  // Hermes Swarm
  swarmStatus: any;
  swarmAgents: SwarmAgentStatus[];
  agents: SwarmAgentStatus[];
  isSwarmRunning: boolean;
  runSwarmPass: () => Promise<void>;

  // Queue & Ingestion
  queueJobs: QueueJobStatus[];
  activeJob: QueueJobStatus | null;
  intakeStatus: any;
  activeIntake: any;
  isAnalyzing: boolean;
  submitDocuments: (files: File[], options?: any) => Promise<any>;
  createEngagementWorkspace: (name: string, currency?: string, country?: string) => Promise<any>;

  // Multi-Entity & Currencies
  entities: CorporateEntity[];
  relationships: EntityRelationship[];
  addEntity: (entity: any) => Promise<any>;
  removeEntity: (id: string) => Promise<any>;
  activeScope: string;
  setActiveScope: (scope: string) => void;
  activeCurrency: string;
  setActiveCurrency: (currency: string) => void;
  fxRates: FxRateRecord[];

  // Reports & Deliverables
  reports: any[];
  compileReport: (params: any) => Promise<{ success: boolean; report?: any; error?: string }>;

  // Firm Branding
  firmBranding: FirmBranding;
  updateFirmBranding: (branding: Partial<FirmBranding>) => Promise<void>;

  // Eve Assistant
  askEve: (message: string) => Promise<string>;

  // Modals & Drawers
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  isReportWizardOpen: boolean;
  setIsReportWizardOpen: (open: boolean) => void;
}

const defaultBranding: FirmBranding = {
  firmName: "Eve CPA Practice",
  partnerName: '',
  licenseNumber: '',
  address: '',
  firmAddress: '',
  opinionType: 'Pending Review'
};

const defaultSession: UserSession = {
  id: '',
  email: '',
  name: 'Unauthenticated User',
  role: 'Viewer',
  organization: '',
  isAuthenticated: false
};

const initialSwarmAgents: SwarmAgentStatus[] = [
  {
    id: 'arithmetic_reconciler',
    name: 'Arithmetic Reconciler',
    role: 'Row sum validation, cross-statement matrix consistency, delta auditing',
    status: 'idle',
    confidence: 0,
    checksCount: 0,
    discrepanciesFound: 0,
    lastExecution: 'Not executed',
    avatar: 'Σ',
  },
  {
    id: 'scale_verifier',
    name: 'Scale & Magnitude Verifier',
    role: 'Unit detection (thousands vs millions), restatement scalar normalization',
    status: 'idle',
    confidence: 0,
    checksCount: 0,
    discrepanciesFound: 0,
    lastExecution: 'Not executed',
    avatar: '10ⁿ',
  },
  {
    id: 'currency_verifier',
    name: 'Currency Provenance Verifier',
    role: 'ISO currency symbol tracking, FX translation footnote alignment',
    status: 'idle',
    confidence: 0,
    checksCount: 0,
    discrepanciesFound: 0,
    lastExecution: 'Not executed',
    avatar: '€/$',
  },
  {
    id: 'discrepancy_auditor',
    name: 'Discrepancy Auditor',
    role: 'Footnote-to-statement variance detection, retroactive restatements',
    status: 'idle',
    confidence: 0,
    checksCount: 0,
    discrepanciesFound: 0,
    lastExecution: 'Not executed',
    avatar: 'Δ',
  },
  {
    id: 'note_auditor',
    name: 'Footnote Disclosure Cross-Auditor',
    role: 'Cross-checks note references against table data, verifies completeness',
    status: 'idle',
    confidence: 0,
    checksCount: 0,
    discrepanciesFound: 0,
    lastExecution: 'Not executed',
    avatar: '¶',
  },
  {
    id: 'restatement_tracker',
    name: 'Restatement & Prior Period Tracker',
    role: 'Compares current prior-year columns to original filings, flags restatements',
    status: 'idle',
    confidence: 0,
    checksCount: 0,
    discrepanciesFound: 0,
    lastExecution: 'Not executed',
    avatar: '↺',
  },
];

const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

export const PracticeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('overview');
  const [userSession, setUserSession] = useState<UserSession | null>(defaultSession);

  // Entities & Selection
  const [companies, setCompanies] = useState<CompanyEntity[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Financial Facts & Summary
  const [facts, setFacts] = useState<ExtractedFact[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Swarm & Queue
  const [swarmStatus, setSwarmStatus] = useState<any>(null);
  const [swarmAgents, setSwarmAgents] = useState<SwarmAgentStatus[]>(initialSwarmAgents);
  const [isSwarmRunning, setIsSwarmRunning] = useState(false);
  const [queueJobs, setQueueJobs] = useState<QueueJobStatus[]>([]);
  const [activeJob, setActiveJob] = useState<QueueJobStatus | null>(null);
  const [intakeStatus, setIntakeStatus] = useState<any>(null);
  const [activeIntake, setActiveIntake] = useState<any>(null);
  const [activeIntakeId, setActiveIntakeId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Multi-Entity & FX
  const [entities, setEntities] = useState<CorporateEntity[]>([]);
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [activeScope, setActiveScope] = useState<string>('CONSOLIDATED');
  const [activeCurrency, setActiveCurrency] = useState<string>('USD');
  const [fxRates, setFxRates] = useState<FxRateRecord[]>([]);

  // Reports & Deliverables
  const [reports, setReports] = useState<any[]>([]);
  const [firmBranding, setFirmBranding] = useState<FirmBranding>(defaultBranding);

  // Modals & Period
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportWizardOpen, setIsReportWizardOpen] = useState(false);

  const [engagementDetail, setEngagementDetail] = useState<any>(null);
  const [loadedScope, setLoadedScope] = useState('');
  const sessionScope = JSON.stringify([userSession?.id, userSession?.email, userSession?.organization, userSession?.isAuthenticated]);
  const currentSessionRef = useRef(sessionScope);
  currentSessionRef.current = sessionScope;
  const intakeGeneration = useRef(0);
  const dataScope = sessionScope + ':' + selectedCompanyId;
  const scopeIsCurrent = loadedScope === dataScope;
  const [dataState, setDataState] = useState('loading');
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastSuccessfulRead, setLastSuccessfulRead] = useState<string | null>(null);
  const requestGeneration = useRef(0);
  const engagementListGeneration = useRef(0);
  const selectedRecord = companies.find(c => c.id === selectedCompanyId);
  const selectedWorkspaceId = selectedRecord?.workspaceId || '';
  const selectedEngagementId = selectedRecord?.engagementId || '';
  const clearScopeData = useCallback(() => {
    setEngagementDetail(null); setLoadedScope('');
    setFacts([]); setDocuments([]); setSummary(null); setFindings([]); setAuditLogs([]);
    setReports([]); setQueueJobs([]); setActiveJob(null); setEntities([]); setRelationships([]);
    setSwarmStatus(null); setSwarmAgents(initialSwarmAgents); setFxRates([]);
  }, []);
  const selectedCompany: CompanyEntity =
    companies.find((c) => c.id === selectedCompanyId) ||
    {
      id: '',
      name: 'No Engagement Selected',
      ticker: '',
      reportingStandard: 'US-GAAP',
      currency: 'USD',
      scale: 'millions',
      fiscalYear: '—',
      auditStatus: 'Pending',
      verificationScore: 0
    };
  const setSelectedCompany = useCallback((comp: CompanyEntity) => {
    setSelectedCompanyId(comp.id);
  }, []);

  const hasFacts = facts.length > 0;
  const financialFacts: FinancialFact[] = facts.map((f) => toFinancialFact(f));

  // A response belongs to one actual workspace and session generation only.
  const loadWorkspaceData = useCallback(async (wsId: string) => {
    const generation = ++requestGeneration.current;
    clearScopeData();
    if (!wsId) { setDataState('not-found'); return; }
    setDataState('loading'); setDataError(null);
    try {
      const record = companies.find(c => c.workspaceId === wsId && c.id === selectedCompanyId);
      if (!record?.engagementId) throw new Error('No persisted engagement mapping for this workspace.');
      const detail = await apiGet<any>(`/api/cpa/engagements/${encodeURIComponent(record.engagementId)}`);
      if (generation !== requestGeneration.current) return;
      const eng = detail.engagement;
      if (!eng || eng.workspaceId !== wsId || eng.engagementId !== record.engagementId ||
          !Array.isArray(eng.facts) || !Array.isArray(eng.documents) || !Array.isArray(eng.reports)) {
        throw new Error('Malformed response or mismatched workspace/engagement identity.');
      }
      setLoadedScope(dataScope); setEngagementDetail(eng);
      setFacts(eng.facts); setDocuments(eng.documents); setReports(eng.reports);
      setFindings(Array.isArray(eng.findings) ? eng.findings : []);
      if (eng.period) setSelectedPeriod(eng.period);
      setDataState(eng.facts.length || eng.documents.length || eng.reports.length ? 'ready' : 'authenticated-empty');
      setLastSuccessfulRead(new Date().toISOString());
    } catch (error: any) {
      if (generation !== requestGeneration.current) return;
      clearScopeData();
      setDataState(error.status === 401 ? 'unauthorized' : error.status === 403 ? 'forbidden' : error.status === 404 ? 'not-found' : 'disconnected-or-invalid');
      setDataError(error.message || 'Workspace read failed.');
    }
  }, [companies, selectedCompanyId, clearScopeData, dataScope]);

  useEffect(() => {
    let active = true;
    ++requestGeneration.current;
    clearScopeData(); setCompanies([]); setProjects([]); setFirmBranding(defaultBranding);
    setDataState('loading'); setDataError(null); setLastSuccessfulRead(null);
    async function boot() {
      const generation = ++engagementListGeneration.current;
      try {
        const result = await apiGet<any>('/api/cpa/engagements/universal');
        if (!active || generation !== engagementListGeneration.current) return;
        if (!Array.isArray(result.engagements)) throw new Error('Malformed engagement list response.');
        const mapped: CompanyEntity[] = result.engagements.map((eng: any) => {
          if (!eng.engagementId) throw new Error('Engagement identity missing from response.');
          return {
            ...eng, id: eng.engagementId, engagementId: eng.engagementId,
            workspaceId: eng.workspaceId, name: eng.clientName,
            reportingStandard: eng.framework, currency: eng.functionalCurrency,
            fiscalYear: eng.period, period: eng.period,
            auditStatus: 'Professional review required',
            verificationScore: typeof eng.minervaOverallScore === 'number' ? eng.minervaOverallScore : undefined
          };
        });
        setCompanies(mapped);
        setSelectedCompanyId(previous => mapped.some(c => c.id === previous) ? previous :
          (mapped.find(c => c.isCustomer && c.workspaceId)?.id || mapped.find(c => c.workspaceId)?.id || ''));
        setDataState(mapped.length ? 'loading' : 'authenticated-empty');
        setLastSuccessfulRead(new Date().toISOString());
      } catch (error: any) {
        if (!active || generation !== engagementListGeneration.current) return;
        setSelectedCompanyId('');
        setDataState(error.status === 401 ? 'unauthorized' : error.status === 403 ? 'forbidden' : 'disconnected-or-invalid');
        setDataError(error.message || 'Client list read failed.');
      }
    }
    boot();
    return () => { active = false; ++requestGeneration.current; };
  }, [userSession?.id, userSession?.email, userSession?.organization, userSession?.isAuthenticated, clearScopeData]);

  useEffect(() => {
    if (selectedWorkspaceId) void loadWorkspaceData(selectedWorkspaceId);
    else { ++requestGeneration.current; clearScopeData(); }
    return () => { ++requestGeneration.current; };
  }, [selectedWorkspaceId, loadWorkspaceData, clearScopeData]);

  const resolveFinding = (id: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, resolved: !f.resolved } : f))
    );
  };

  const runSwarmPass = async () => {
    setIsSwarmRunning(true);
    setSwarmAgents((prev) => prev.map((a) => ({ ...a, status: 'running' })));
    try {
      const res = await fetch('/api/swarm/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: selectedWorkspaceId })
      });
      if (!res.ok) {
        throw new Error(`Swarm run failed with status ${res.status}`);
      }
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data.agents)) {
        setSwarmAgents(data.agents);
      } else {
        // HTTP success is not agent success. Keep unmeasured if backend did not return agent records
        setSwarmAgents((prev) =>
          prev.map((a) => ({
            ...a,
            status: 'idle',
            lastExecution: 'Execution detail not returned by server'
          }))
        );
      }
      await loadWorkspaceData(selectedWorkspaceId);
    } catch (err) {
      console.warn('[PracticeContext] Swarm run failed:', err);
      // Fail closed: do not manufacture checks or pretend completion on failure
      setSwarmAgents((prev) =>
        prev.map((a) => ({
          ...a,
          status: 'idle',
          lastExecution: 'Execution failed / Unverified'
        }))
      );
    } finally {
      setIsSwarmRunning(false);
    }
  };

  const submitDocuments = async (files: File[], options?: any) => {
    const generation = ++intakeGeneration.current;
    const isCurrent = () => currentSessionRef.current === sessionScope && intakeGeneration.current === generation;
    setIsAnalyzing(true);
    setIntakeStatus('UPLOADING'); setActiveIntake(null); setActiveIntakeId('');
    try {
      const res = await uploadDocuments({
        workspaceId: options?.uploadIntent === 'CREATE_NEW_INTAKE' ? undefined : options?.targetWorkspaceId || selectedWorkspaceId,
        files,
        requestedWorkspaceName: options?.requestedWorkspaceName,
        uploadIntent: options?.uploadIntent || 'ATTACH_TO_EXISTING_PROJECT',
        userEmail: userSession?.email
      });
      if (!isCurrent()) throw new Error('Session changed while uploading. The saved intake was not repeated.');
      if (!res.success || !res.intakeSessionId) throw new Error('Upload returned no persisted intake receipt.');
      setActiveIntakeId(res.intakeSessionId);
      setIntakeStatus('QUEUED');
      return res;
    } catch (error) {
      if (!isCurrent()) throw error;
      setIntakeStatus('FAILED');
      setIsAnalyzing(false);
      throw error;
    }
  };

  const refreshPersistedEngagements = useCallback(async (workspaceId: string, stillCurrent: () => boolean = () => true) => {
    const scope = currentSessionRef.current;
    const generation = ++engagementListGeneration.current;
    const result = await apiGet<any>('/api/cpa/engagements/universal');
    if (currentSessionRef.current !== scope || generation !== engagementListGeneration.current || !stillCurrent()) return false;
    if (!Array.isArray(result.engagements)) throw new Error('Persisted engagement list is unavailable.');
    const mapped = result.engagements.map((eng: any) => ({
      ...eng, id: eng.engagementId, engagementId: eng.engagementId,
      name: eng.clientName, reportingStandard: eng.framework,
      currency: eng.functionalCurrency, fiscalYear: eng.period,
      auditStatus: 'Professional review required'
    }));
    const record = mapped.find((eng: any) => eng.workspaceId === workspaceId);
    if (!record?.engagementId) throw new Error('The new workspace has no persisted engagement mapping.');
    setCompanies(mapped); setSelectedCompanyId(record.engagementId);
    return true;
  }, []);

  useEffect(() => {
    if (!activeIntakeId) return;
    const scope = sessionScope;
    let cancelled = false;
    const stillCurrent = () => !cancelled && currentSessionRef.current === scope;
    let timer: ReturnType<typeof setTimeout>;
    async function pollIntake() {
      try {
        const result = await apiGet<any>(`/api/intake/${encodeURIComponent(activeIntakeId)}`);
        if (!stillCurrent()) return;
        const intake = result.intakeSession;
        if (!intake || intake.id !== activeIntakeId) throw new Error('Intake receipt identity mismatch.');
        setActiveIntake(intake);
        const status = intake.completionState === 'PROMOTED' && intake.status === 'COMPLETED' ? 'PROMOTED' : intake.status;
        setIntakeStatus(status);
        if (status === 'PROMOTED' && intake.promotedProjectId) {
          const hydrated = await refreshPersistedEngagements(intake.promotedProjectId, stillCurrent);
          if (!stillCurrent()) return;
          if (!hydrated) throw new Error('Engagement refresh was superseded; retrying saved intake observation.');
          setIsAnalyzing(false); setActiveIntakeId('');
          return;
        }
        if (['FAILED', 'CANCELLED', 'BLOCKED', 'REVIEW_REQUIRED', 'COMPLETED'].includes(status)) {
          setIntakeStatus(status === 'COMPLETED' ? 'REVIEW_REQUIRED' : status);
          setIsAnalyzing(false); setActiveIntakeId('');
          setDataError(intake.error || intake.currentStageName || 'Processing requires review.');
          return;
        }
      } catch (error: any) {
        if (!stillCurrent()) return;
        setDataError(error.message || 'Unable to retrieve intake progress.');
        if (error.status === 401 || error.status === 403) {
          setActiveIntake(null); setActiveIntakeId(''); setActiveJob(null);
          setIntakeStatus('ACCESS_REQUIRED'); setIsAnalyzing(false);
          return;
        }
        // Preserve the receipt and retry observation; never re-upload on a read failure.
      }
      if (stillCurrent()) timer = setTimeout(pollIntake, 2000);
    }
    void pollIntake();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeIntakeId, refreshPersistedEngagements, sessionScope]);

  useEffect(() => {
    ++intakeGeneration.current;
    // Legacy userSession is not the HttpOnly operator identity. Never restore a
    // browser receipt under that shared key across owner logins. Server intake
    // persistence remains authoritative; this observer is scoped to this page.
    setActiveIntakeId(''); setActiveIntake(null);
    setIntakeStatus(null); setIsAnalyzing(false);
  }, [sessionScope]);

  const createEngagementWorkspace = async (name: string, currency = 'USD', country = 'US') => {
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, currency, country, userEmail: userSession?.email })
    });
    const ws = await res.json();
    if (!res.ok || !ws.id) throw new Error(ws.error || 'Unable to create engagement workspace.');
    await refreshPersistedEngagements(ws.id);
    return ws;
  };

  const addEntity = async (entity: any) => {
    const created = await createEntity(selectedWorkspaceId, entity, userSession?.email);
    setEntities((prev) => [...prev, created]);
    return created;
  };

  const removeEntity = async (id: string) => {
    await deleteEntity(selectedWorkspaceId, id, userSession?.email);
    setEntities((prev) => prev.filter((e) => e.id !== id));
  };

  const compileReport = async (params: any) => {
    try {
      const res = await generateDeliverable({
        workspaceId: selectedWorkspaceId,
        deliverableType: params.deliverableType || 'Financial Report',
        audience: params.audience || 'Board of Directors',
        signedOffBy: params.signedOffBy || '',
        companyName: selectedCompany?.name
      });
      await loadWorkspaceData(selectedWorkspaceId);
      return res;
    } catch (err: any) {
      return { success: false, error: err.message || 'REFUSED: cannot generate report without verified source facts.' };
    }
  };

  const updateFirmBranding = async (branding: Partial<FirmBranding>) => {
    const merged = { ...firmBranding, ...branding };
    setFirmBranding(merged);
    try {
      await saveFirmBranding(merged, userSession?.email);
    } catch {
      // safe fallback
    }
  };

  const askEve = async (message: string): Promise<string> => {
    return sendEveChat(message, selectedWorkspaceId, userSession?.email);
  };

  return (
    <PracticeContext.Provider
      value={{
        engagementDetail: scopeIsCurrent ? engagementDetail : null,
        dataState, dataError, lastSuccessfulRead, selectedEngagementId,
        currentView,
        setCurrentView,
        userSession,
        setUserSession,
        companies,
        workspaces: companies,
        selectedCompanyId,
        setSelectedCompanyId,
        selectedCompany,
        setSelectedCompany,
        selectedWorkspaceId,
        projects,
        selectedProjectId,
        setSelectedProjectId,
        facts: scopeIsCurrent ? facts : [],
        financialFacts: scopeIsCurrent ? financialFacts : [],
        documents: scopeIsCurrent ? documents : [],
        summary: scopeIsCurrent ? summary : null,
        hasFacts: scopeIsCurrent && hasFacts,
        selectedPeriod,
        setSelectedPeriod,
        findings: scopeIsCurrent ? findings : [],
        resolveFinding,
        auditLogs: scopeIsCurrent ? auditLogs : [],
        swarmStatus,
        swarmAgents,
        agents: swarmAgents,
        isSwarmRunning,
        runSwarmPass,
        queueJobs: scopeIsCurrent ? queueJobs : [],
        activeJob,
        intakeStatus,
        activeIntake,
        isAnalyzing,
        submitDocuments,
        createEngagementWorkspace,
        entities: scopeIsCurrent ? entities : [],
        relationships: scopeIsCurrent ? relationships : [],
        addEntity,
        removeEntity,
        activeScope,
        setActiveScope,
        activeCurrency,
        setActiveCurrency,
        fxRates: scopeIsCurrent ? fxRates : [],
        reports: scopeIsCurrent ? reports : [],
        compileReport,
        firmBranding,
        updateFirmBranding,
        askEve,
        isCopilotOpen,
        setIsCopilotOpen,
        isUploadOpen,
        setIsUploadOpen,
        isReportWizardOpen,
        setIsReportWizardOpen
      }}
    >
      {children}
    </PracticeContext.Provider>
  );
};

export const usePractice = () => {
  const ctx = useContext(PracticeContext);
  if (!ctx) throw new Error('usePractice must be used within a PracticeProvider');
  return ctx;
};
