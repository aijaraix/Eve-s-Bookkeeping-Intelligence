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
import { mockCompanies, mockFindings } from '../data/mockData';
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
  const [intakeStatus] = useState<any>(null);
  const [activeIntake] = useState<any>(null);
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
  const [selectedPeriod, setSelectedPeriod] = useState<string>('FY2025');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportWizardOpen, setIsReportWizardOpen] = useState(false);

  const selectedWorkspaceId = selectedCompanyId;
  const selectedCompany: CompanyEntity =
    companies.find((c) => c.id === selectedCompanyId) ||
    companies[0] || {
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

  // Load Workspaces & Initial Data
  const loadWorkspaceData = useCallback(async (wsId: string) => {
    if (!wsId) return;
    try {
      const email = userSession?.email;
      const [f, s, docs, qj, rep, fd, logs, sw, ent, rel, fx, univDetail] = await Promise.allSettled([
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
        fetchFxRates(email),
        fetch(`/api/cpa/engagements/${wsId}`).then((r) => (r.ok ? r.json() : null))
      ]);

      const univEngagement = univDetail.status === 'fulfilled' && univDetail.value?.engagement ? univDetail.value.engagement : null;

      if (f.status === 'fulfilled' && f.value && f.value.length > 0) {
        setFacts(f.value);
      } else if (univEngagement && univEngagement.financialFacts && univEngagement.financialFacts.length > 0) {
        setFacts(univEngagement.financialFacts);
      } else {
        setFacts([]);
      }

      if (s.status === 'fulfilled') setSummary(s.value || null);

      if (docs.status === 'fulfilled' && docs.value && docs.value.length > 0) {
        setDocuments(docs.value);
      } else if (univEngagement && univEngagement.documents && univEngagement.documents.length > 0) {
        setDocuments(univEngagement.documents);
      } else {
        setDocuments([]);
      }

      if (qj.status === 'fulfilled') {
        const mapped = (qj.value || []).map(mapQueueJob);
        setQueueJobs(mapped);
        const inProg = mapped.find((j) => j.status === 'PROCESSING' || j.status === 'QUEUED');
        setActiveJob(inProg || null);
        setIsAnalyzing(Boolean(inProg));
      }

      if (rep.status === 'fulfilled' && rep.value && rep.value.length > 0) {
        setReports(rep.value);
      } else if (univEngagement && univEngagement.reports && univEngagement.reports.length > 0) {
        setReports(univEngagement.reports);
      } else {
        setReports([]);
      }

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
        const [wsList, branding, univRes] = await Promise.allSettled([
          fetchWorkspaces(email),
          fetchFirmBranding(email),
          fetch('/api/cpa/engagements/universal').then((r) => (r.ok ? r.json() : null))
        ]);

        if (branding.status === 'fulfilled' && branding.value) {
          setFirmBranding((prev) => ({ ...prev, ...branding.value }));
        }

        const combinedCompanies: CompanyEntity[] = [];

        // 1. Authoritative Universal Engagements
        if (univRes.status === 'fulfilled' && univRes.value?.engagements?.length > 0) {
          const univMapped: CompanyEntity[] = univRes.value.engagements.map((eng: any) => ({
            id: eng.engagementId,
            name: eng.clientName,
            ticker: eng.classification || 'ENGAGEMENT',
            reportingStandard: eng.framework || 'US-GAAP',
            currency: eng.functionalCurrency || 'USD',
            scale: 'millions',
            fiscalYear: eng.period || 'FY 2025',
            auditStatus: eng.currentStage === 'ENGAGEMENT_COMPLETE' ? 'Clean Opinion' : 'Under Review',
            verificationScore: typeof eng.minervaOverallScore === 'number' ? eng.minervaOverallScore : 0
          }));
          combinedCompanies.push(...univMapped);
        }

        // 2. Real workspaces from storage
        if (wsList.status === 'fulfilled' && wsList.value?.length > 0) {
          const mappedCompanies = wsList.value.map((w) => workspaceToCompany(w));
          const mappedProjects = wsList.value.map((w) => workspaceToProject(w, 'Lead CPA Partner'));
          setProjects(mappedProjects);

          mappedCompanies.forEach((mc) => {
            if (!combinedCompanies.some((c) => c.id === mc.id)) {
              combinedCompanies.push(mc);
            }
          });
        }

        if (mounted) {
          setCompanies(combinedCompanies);
          if (combinedCompanies.length > 0) {
            setSelectedCompanyId(combinedCompanies[0].id);
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
        setSwarmAgents((prev) =>
          prev.map((a) => ({
            ...a,
            status: 'completed',
            lastExecution: 'Just now'
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
