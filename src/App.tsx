import React, { useState } from 'react';
import { ActiveView, FinancialFact } from './types';
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
import { FloatingEveChat } from './components/FloatingEveChat';
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
    setSelectedProjectId
  } = usePractice();

  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [activeProjectTab, setActiveProjectTab] = useState<string>('Overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportWizardOpen, setIsReportWizardOpen] = useState(false);
  const [selectedFact, setSelectedFact] = useState<FinancialFact | null>(null);

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
        />

        <main
          className={`flex-1 p-6 transition-all ${
            isCollapsedSidebar ? 'lg:ml-20' : 'lg:ml-72'
          }`}
        >
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

          {activeView === 'hermes-swarm' && (
            <HermesSwarmView />
          )}

          {activeView === 'audit-findings' && (
            <AuditFindingsView />
          )}

          {activeView === 'ai-deliverables' && (
            <AIDeliverablesView onOpenReportWizard={() => setIsReportWizardOpen(true)} />
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
              onInspectDocument={(fact) => setSelectedFact(fact)}
            />
          )}

          {activeView === 'users-teams' && (
            <UsersTeamsView />
          )}

          {activeView === 'activity-log' && (
            <ActivityLogView />
          )}
        </main>

        <FloatingEveChat />
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
