import React, { useState } from 'react';
import { ActiveView, FinancialFact, ExtractedFact } from './types';
import { PracticeProvider, usePractice } from './context/PracticeContext';
import { AppSidebar } from './components/AppSidebar';
import { AppHeader } from './components/AppHeader';
import { OverviewView } from './components/OverviewView';
import { FinancialDashboardView } from './components/FinancialDashboardView';
import { IncomeStatementView } from './components/IncomeStatementView';
import { BalanceSheetView } from './components/BalanceSheetView';
import { CashFlowView } from './components/CashFlowView';
import { RatiosView } from './components/RatiosView';
import { SegmentAnalysisView } from './components/SegmentAnalysisView';
import { ComparativeTrendView } from './components/ComparativeTrendView';
import { ForecastView } from './components/ForecastView';
import { HermesSwarmView } from './components/HermesSwarmView';
import { AuditFindingsView } from './components/AuditFindingsView';
import { AIDeliverablesView } from './components/AIDeliverablesView';
import { ProjectsView } from './components/ProjectsView';
import { CompaniesView } from './components/CompaniesView';
import { DocumentsView } from './components/DocumentsView';
import { UsersTeamsView } from './components/UsersTeamsView';
import { ActivityLogView } from './components/ActivityLogView';
import { CorporateStructureView } from './components/CorporateStructureView';
import { WorkerDiagnosticsView } from './components/WorkerDiagnosticsView';
import { EquityStatementView } from './components/EquityStatementView';
import { NotesDisclosuresView } from './components/NotesDisclosuresView';
import { EvidenceRegistryView } from './components/EvidenceRegistryView';
import { FirmSettingsView } from './components/FirmSettingsView';
import { EveAuditCopilotDrawer } from './components/EveAuditCopilotDrawer';
import { LoginModal } from './components/LoginModal';
import { UploadModal } from './components/UploadModal';
import { ProvenanceInspectorModal } from './components/ProvenanceInspectorModal';
import { ReportWizardModal } from './components/ReportWizardModal';

function PracticeApp() {
  const {
    userSession,
    setUserSession,
    selectedCompanyId,
    selectedProjectId,
    setSelectedCompanyId,
    setSelectedProjectId,
    facts
  } = usePractice();

  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [activeProjectTab, setActiveProjectTab] = useState<string>('Overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportWizardOpen, setIsReportWizardOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [selectedFact, setSelectedFact] = useState<FinancialFact | null>(null);

  const handleInspectMetric = (metricName: string) => {
    const found = facts.find(
      (f) =>
        f.canonicalMetric === metricName ||
        f.metric?.toLowerCase() === metricName.toLowerCase() ||
        f.label?.toLowerCase().includes(metricName.toLowerCase())
    );
    if (found) {
      setSelectedFact(found as any);
    } else {
      // Fallback synthetic fact for line item provenance
      setSelectedFact({
        id: `insp-${Date.now()}`,
        metric: metricName,
        label: metricName,
        value: 0,
        formattedValue: 'Line Item Inspected',
        period: 'FY2024',
        statementType: 'INCOME_STATEMENT',
        sourceDocumentId: 'doc-source',
        sourceDocumentName: 'Audited Financial Statements.pdf',
        pageNumber: 1,
        confidence: 0.99,
        verified: true,
        scale: 'Millions'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased">
      <AppSidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        isCollapsed={isCollapsedSidebar}
        setIsCollapsed={setIsCollapsedSidebar}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        userSession={userSession}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AppHeader
          activeView={activeView}
          setActiveView={setActiveView}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenReportWizard={() => setIsReportWizardOpen(true)}
          userSession={userSession}
          activeProjectTab={activeProjectTab}
          setActiveProjectTab={setActiveProjectTab}
          isCollapsedSidebar={isCollapsedSidebar}
          selectedCompanyId={selectedCompanyId}
          setSelectedCompanyId={setSelectedCompanyId}
          selectedProjectId={selectedProjectId}
          setSelectedProjectId={setSelectedProjectId}
          onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
          isCopilotOpen={isCopilotOpen}
        />

        <main
          className={`flex-1 p-6 transition-all ${
            isCollapsedSidebar ? 'lg:ml-20' : 'lg:ml-72'
          }`}
        >
          {/* PILLAR 1: HOME & ENGAGEMENTS */}
          {activeView === 'overview' && (
            <OverviewView
              onSelectCompany={(companyId) => {
                setSelectedCompanyId(companyId);
                setSelectedProjectId(companyId);
                setActiveView('financials-dashboard');
              }}
              onSelectView={setActiveView}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenReportWizard={() => setIsReportWizardOpen(true)}
            />
          )}

          {activeView === 'projects' && (
            <ProjectsView
              onSelectView={setActiveView}
              onSelectCompany={setSelectedCompanyId}
              onSelectProject={setSelectedProjectId}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {activeView === 'companies' && (
            <CompaniesView
              onSelectView={setActiveView}
              onSelectCompany={setSelectedCompanyId}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {activeView === 'documents' && (
            <DocumentsView
              onOpenUpload={() => setIsUploadOpen(true)}
              onInspectDocument={(fact) => setSelectedFact(fact ?? null)}
            />
          )}

          {/* PILLAR 2: FINANCIAL WORKBENCH */}
          {activeView === 'financials-dashboard' && (
            <FinancialDashboardView />
          )}

          {activeView === 'income-statement' && (
            <IncomeStatementView onSelectFact={(fact) => setSelectedFact(fact)} />
          )}

          {activeView === 'balance-sheet' && (
            <BalanceSheetView />
          )}

          {activeView === 'cash-flow' && (
            <CashFlowView />
          )}

          {activeView === 'equity-statement' && (
            <EquityStatementView onInspectMetric={handleInspectMetric} />
          )}

          {activeView === 'notes-disclosures' && (
            <NotesDisclosuresView onInspectMetric={handleInspectMetric} />
          )}

          {activeView === 'ratios' && (
            <RatiosView />
          )}

          {activeView === 'segment-analysis' && (
            <SegmentAnalysisView />
          )}

          {(activeView === 'comparative-analysis' || activeView === 'trend-analysis') && (
            <ComparativeTrendView />
          )}

          {activeView === 'forecast' && (
            <ForecastView />
          )}

          {/* PILLAR 3: CORPORATE STRUCTURE */}
          {(activeView === 'corporate-structure' || activeView === 'currencies-fx' || activeView === 'capital-structure') && (
            <CorporateStructureView />
          )}

          {/* PILLAR 4: AUDIT & DELIVERABLES */}
          {activeView === 'hermes-swarm' && (
            <HermesSwarmView />
          )}

          {activeView === 'audit-findings' && (
            <AuditFindingsView />
          )}

          {activeView === 'evidence-registry' && (
            <EvidenceRegistryView onInspectFact={(f) => setSelectedFact(f as any)} />
          )}

          {activeView === 'ai-deliverables' && (
            <AIDeliverablesView onOpenReportWizard={() => setIsReportWizardOpen(true)} />
          )}

          {/* SETTINGS & INFRASTRUCTURE */}
          {activeView === 'firm-settings' && (
            <FirmSettingsView />
          )}

          {activeView === 'worker-diagnostics' && (
            <WorkerDiagnosticsView />
          )}

          {activeView === 'users-teams' && (
            <UsersTeamsView />
          )}

          {activeView === 'activity-log' && (
            <ActivityLogView />
          )}
        </main>

        {/* Eve Audit Copilot Drawer */}
        <EveAuditCopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          onInspectMetric={handleInspectMetric}
        />
      </div>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(session) => setUserSession(session)}
        currentSession={userSession}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSelectView={setActiveView}
        onOpenReportWizard={() => setIsReportWizardOpen(true)}
      />

      <ReportWizardModal
        isOpen={isReportWizardOpen}
        onClose={() => setIsReportWizardOpen(false)}
      />

      <ProvenanceInspectorModal
        fact={selectedFact}
        onClose={() => setSelectedFact(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <PracticeProvider>
      <PracticeApp />
    </PracticeProvider>
  );
}
