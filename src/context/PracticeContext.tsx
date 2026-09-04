import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ViewMode, CompanyEntity, AuditFinding, SwarmAgentStatus } from '../types';
import { mockCompanies, mockFindings, mockSwarmAgents } from '../data/mockData';

interface PracticeContextType {
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  selectedCompany: CompanyEntity;
  setSelectedCompany: (company: CompanyEntity) => void;
  companies: CompanyEntity[];
  findings: AuditFinding[];
  resolveFinding: (id: string) => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  isReportWizardOpen: boolean;
  setIsReportWizardOpen: (open: boolean) => void;
  swarmAgents: SwarmAgentStatus[];
  isSwarmRunning: boolean;
  runSwarmPass: () => Promise<void>;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

export const PracticeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('overview');
  const [companies] = useState<CompanyEntity[]>(mockCompanies);
  const [selectedCompany, setSelectedCompany] = useState<CompanyEntity>(mockCompanies[0]);
  const [findings, setFindings] = useState<AuditFinding[]>(mockFindings);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportWizardOpen, setIsReportWizardOpen] = useState(false);
  const [swarmAgents, setSwarmAgents] = useState<SwarmAgentStatus[]>(mockSwarmAgents);
  const [isSwarmRunning, setIsSwarmRunning] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('FY2024');

  const resolveFinding = (id: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, resolved: !f.resolved } : f))
    );
  };

  const runSwarmPass = async () => {
    setIsSwarmRunning(true);
    setSwarmAgents((prev) => prev.map((a) => ({ ...a, status: 'running' })));
    
    try {
      await fetch('/api/swarm/run', { method: 'POST' });
    } catch {
      // simulate in offline/mock mode
    }

    setTimeout(() => {
      setSwarmAgents((prev) =>
        prev.map((a) => ({
          ...a,
          status: 'completed',
          checksCount: a.checksCount + Math.floor(Math.random() * 20 + 5),
          lastExecution: 'Just now',
        }))
      );
      setIsSwarmRunning(false);
    }, 1200);
  };

  return (
    <PracticeContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedCompany,
        setSelectedCompany,
        companies,
        findings,
        resolveFinding,
        isCopilotOpen,
        setIsCopilotOpen,
        isUploadOpen,
        setIsUploadOpen,
        isReportWizardOpen,
        setIsReportWizardOpen,
        swarmAgents,
        isSwarmRunning,
        runSwarmPass,
        selectedPeriod,
        setSelectedPeriod,
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
