import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
import { mockCompanies, mockFindings, mockSwarmAgents } from '../data/mockData';
import {
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
  firmName: "Eve's CPA & Advisory LLP",
  partnerName: 'Managing Partner, CPA / CA',
  licenseNumber: 'CPA-PCAOB-982410',
  address: '100 Financial Center Blvd, Suite 4000, New York, NY 10005',
  firmAddress: '100 Financial Center Blvd, Suite 4000, New York, NY 10005',
  opinionType: 'Unqualified / Clean Opinion'
};

const defaultSession: UserSession = {
  id: 'user-cpa-1',
  email: 'stevestein4454@gmail.com',
  name: 'Steve Stein, CPA',
  role: 'CPA Lead Partner',
  organization: 'Stein & Associates Audit LLP',
  isAuthenticated: true
};

const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

export const PracticeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('overview');
  const [userSession, setUserSession] = useState<UserSession | null>(defaultSession);

  // Entities & Selection
  const [companies, setCompanies] = useState<CompanyEntity[]>(mockCompanies);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(mockCompanies[0]?.id || 'unilever_group');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Financial Facts & Summary
  const [facts, setFacts] = useState<ExtractedFact[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [findings, setFindings] = useState<AuditFinding[]>(mockFindings);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Swarm & Queue
  const [swarmStatus, setSwarmStatus] = useState<any>(null);
  const [swarmAgents, setSwarmAgents] = useState<SwarmAgentStatus[]>(mockSwarmAgents);
  const [isSwarmRunning, setIsSwarmRunning] = useState(false);
  const [queueJobs, setQueueJobs] = useState<QueueJobStatus[]>([]);
  const [activeJob, setActiveJob] = useState<QueueJobStatus | null>(null);
  const [intakeStatus] = useState<any>(null);
  const [activeIntake] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Multi-Entity & FX
  const [entities, setEntities] = useState<CorporateEntity[]>([]);
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [activeScope, setActiveScope] = useState<string>('CONSOLIDATED');
  const [activeCurrency, setActiveCurrency] = useState<string>('EUR');
  const [fxRates, setFxRates] = useState<FxRateRecord[]>([]);

  // Reports & Deliverables
  const [reports, setReports] = useState<any[]>([]);
  const [firmBranding, setFirmBranding] = useState<FirmBranding>(defaultBranding);

  // Modals & Period
  const [selectedPeriod, setSelectedPeriod] = useState<string>('FY2025');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportWizardOpen, setIsReportWizardOpen] = useState(false);

  const selectedWorkspaceId = selectedCompanyId;
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0] || mockCompanies[0];
  const setSelectedCompany = useCallback((comp: CompanyEntity) => {
    setSelectedCompanyId(comp.id);
  }, []);

  const hasFacts = facts.length > 0;
  const financialFacts: FinancialFact[] = facts.map((f) => toFinancialFact(f));

  // Load Workspaces & Initial Data
  const loadWorkspaceData = useCallback(async (wsId: string) => {
    try {
      const email = userSession?.email;
      const [f, s, docs, qj, rep, fd, logs, sw, ent, rel, fx] = await Promise.allSettled([
        fetchFacts(wsId, email),
        fetchSummary(wsId, email),
        fetchDocuments(wsId, email),
        fetchQueueJobs(wsId, email),
        fetchReports(wsId, email),
        fetchFindings(wsId, email),
        fetchAuditLogs(wsId, email),
        fetchSwarmStatus(wsId, email),
        fetchEntities(wsId, email),
        fetchRelationships(wsId, email),
        fetchFxRates(email)
      ]);

      if (f.status === 'fulfilled') setFacts(f.value || []);
      if (s.status === 'fulfilled') setSummary(s.value || null);
      if (docs.status === 'fulfilled') setDocuments(docs.value || []);
      if (qj.status === 'fulfilled') {
        const mapped = (qj.value || []).map(mapQueueJob);
        setQueueJobs(mapped);
        const inProg = mapped.find((j) => j.status === 'PROCESSING' || j.status === 'QUEUED');
        setActiveJob(inProg || null);
        setIsAnalyzing(Boolean(inProg));
      }
      if (rep.status === 'fulfilled') setReports(rep.value || []);
      if (fd.status === 'fulfilled' && fd.value.length > 0) setFindings(fd.value);
      if (logs.status === 'fulfilled') setAuditLogs(logs.value || []);
      if (sw.status === 'fulfilled') setSwarmStatus(sw.value || null);
      if (ent.status === 'fulfilled') setEntities(ent.value || []);
      if (rel.status === 'fulfilled') setRelationships(rel.value || []);
      if (fx.status === 'fulfilled') setFxRates(fx.value || []);
    } catch (err) {
      console.warn('[PracticeContext] Error loading workspace data:', err);
    }
  }, [userSession?.email]);

  // Initial Boot
  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        const email = userSession?.email;
        const [wsList, branding] = await Promise.allSettled([
          fetchWorkspaces(email),
          fetchFirmBranding(email)
        ]);

        if (branding.status === 'fulfilled' && branding.value) {
          setFirmBranding((prev) => ({ ...prev, ...branding.value }));
        }

        if (wsList.status === 'fulfilled' && wsList.value?.length > 0) {
          const mappedCompanies = wsList.value.map((w) => workspaceToCompany(w));
          const mappedProjects = wsList.value.map((w) => workspaceToProject(w, 'Lead CPA Partner'));
          if (mounted) {
            setCompanies((prev) => {
              const combined = [...mappedCompanies];
              mockCompanies.forEach((mc) => {
                if (!combined.some((c) => c.id === mc.id)) combined.push(mc);
              });
              return combined;
            });
            setProjects(mappedProjects);
            if (mappedCompanies[0]?.id) {
              setSelectedCompanyId(mappedCompanies[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('[PracticeContext] Boot error:', err);
      }
    }
    boot();
    return () => { mounted = false; };
  }, [userSession?.email]);

  // When selected workspace changes, fetch its specific data
  useEffect(() => {
    if (selectedCompanyId) {
      loadWorkspaceData(selectedCompanyId);
    }
  }, [selectedCompanyId, loadWorkspaceData]);

  const resolveFinding = (id: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, resolved: !f.resolved } : f))
    );
  };

  const runSwarmPass = async () => {
    setIsSwarmRunning(true);
    setSwarmAgents((prev) => prev.map((a) => ({ ...a, status: 'running' })));
    try {
      await fetch('/api/swarm/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: selectedWorkspaceId })
      });
      await loadWorkspaceData(selectedWorkspaceId);
    } catch {
      // offline simulation
    } finally {
      setTimeout(() => {
        setSwarmAgents((prev) =>
          prev.map((a) => ({
            ...a,
            status: 'completed',
            checksCount: a.checksCount + Math.floor(Math.random() * 15 + 5),
            lastExecution: 'Just now'
          }))
        );
        setIsSwarmRunning(false);
      }, 1000);
    }
  };

  const submitDocuments = async (files: File[], options?: any) => {
    setIsAnalyzing(true);
    try {
      const res = await uploadDocuments({
        workspaceId: options?.targetWorkspaceId || selectedWorkspaceId,
        files,
        uploadIntent: options?.uploadIntent || 'ATTACH_TO_EXISTING_PROJECT',
        userEmail: userSession?.email
      });
      await loadWorkspaceData(selectedWorkspaceId);
      return res;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createEngagementWorkspace = async (name: string, currency = 'USD', country = 'US') => {
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, currency, country, email: userSession?.email })
    });
    const ws = await res.json();
    setCompanies((prev) => [workspaceToCompany(ws), ...prev]);
    setSelectedCompanyId(ws.id);
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
        signedOffBy: params.signedOffBy || userSession?.name || 'Lead CPA Partner',
        companyName: selectedCompany?.name
      });
      await loadWorkspaceData(selectedWorkspaceId);
      return { success: true, report: res };
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
        facts,
        financialFacts,
        documents,
        summary,
        hasFacts,
        selectedPeriod,
        setSelectedPeriod,
        findings,
        resolveFinding,
        auditLogs,
        swarmStatus,
        swarmAgents,
        agents: swarmAgents,
        isSwarmRunning,
        runSwarmPass,
        queueJobs,
        activeJob,
        intakeStatus,
        activeIntake,
        isAnalyzing,
        submitDocuments,
        createEngagementWorkspace,
        entities,
        relationships,
        addEntity,
        removeEntity,
        activeScope,
        setActiveScope,
        activeCurrency,
        setActiveCurrency,
        fxRates,
        reports,
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
