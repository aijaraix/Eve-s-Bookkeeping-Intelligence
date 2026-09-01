import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  TrendingUp,
  Layers,
  Search,
  Upload,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Database,
  Cpu,
  Send,
  Zap,
  BarChart3,
  DollarSign,
  Download,
  Building2,
  Users,
  Briefcase,
  Shield,
  FileSearch,
  Check
} from 'lucide-react';
import { ActiveView, FinancialFact, AccountingIdentityCheck, FinancialRatio, QueueJobStatus, AuditLogItem, UserSession } from './types';
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
import { LoginModal, DEMO_USERS } from './components/LoginModal';
import { UploadModal } from './components/UploadModal';
import { ProvenanceInspectorModal } from './components/ProvenanceInspectorModal';
import { ReportWizardModal } from './components/ReportWizardModal';

export default function App() {
  // Navigation & View State
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [activeProjectTab, setActiveProjectTab] = useState<string>('Overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(false);

  // Multi-Client Company & Engagement Context State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('unilever');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-unilever-fy25');

  // Modals & User Session State
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportWizardOpen, setIsReportWizardOpen] = useState(false);
  const [selectedFact, setSelectedFact] = useState<FinancialFact | null>(null);

  // User Authentication Session
  const [userSession, setUserSession] = useState<UserSession>({
    id: DEMO_USERS[0].id,
    email: DEMO_USERS[0].email,
    name: DEMO_USERS[0].name,
    role: DEMO_USERS[0].role,
    organization: DEMO_USERS[0].organization,
    isAuthenticated: true
  });

  // Financial facts dataset
  const [financialFacts, setFinancialFacts] = useState<FinancialFact[]>([
    {
      id: 'fact-1',
      metric: 'REVENUE',
      label: 'Turnover / Group Revenue',
      value: 50503000000,
      formattedValue: '€50,503.00M',
      rawString: '50,503',
      currency: 'EUR',
      period: 'FY2025',
      periodType: 'ANNUAL',
      statementType: 'INCOME_STATEMENT',
      pageNumber: 142,
      tableHeader: 'Turnover by Segment (€ million)',
      scaleSource: 'Table Header (Millions)',
      confidence: 0.998,
      status: 'VERIFIED',
      provenance: {
        documentId: 'doc-unilever-2025',
        documentTitle: 'Unilever_Annual_Report_and_Accounts_2025.pdf',
        section: 'Consolidated Income Statement — Line Item 1',
        lineNumber: 14,
        snippet: 'Turnover for the year ended 31 December 2025 was €50,503 million compared to €49,610 million in 2024.'
      }
    },
    {
      id: 'fact-2',
      metric: 'COST_OF_SALES',
      label: 'Cost of Sales (COGS)',
      value: -26794000000,
      formattedValue: '(€26,794.00M)',
      rawString: '(26,794)',
      currency: 'EUR',
      period: 'FY2025',
      periodType: 'ANNUAL',
      statementType: 'INCOME_STATEMENT',
      pageNumber: 142,
      tableHeader: 'Consolidated Income Statement (€ million)',
      scaleSource: 'Table Header (Millions)',
      confidence: 0.995,
      status: 'VERIFIED',
      provenance: {
        documentId: 'doc-unilever-2025',
        documentTitle: 'Unilever_Annual_Report_and_Accounts_2025.pdf',
        section: 'Consolidated Income Statement — Line Item 2',
        lineNumber: 15,
        snippet: 'Cost of sales amounted to €(26,794) million reflecting raw material inflation and supply chain optimizations.'
      }
    },
    {
      id: 'fact-3',
      metric: 'GROSS_PROFIT',
      label: 'Gross Profit',
      value: 23709000000,
      formattedValue: '€23,709.00M',
      rawString: '23,709',
      currency: 'EUR',
      period: 'FY2025',
      periodType: 'ANNUAL',
      statementType: 'INCOME_STATEMENT',
      pageNumber: 142,
      tableHeader: 'Consolidated Income Statement (€ million)',
      scaleSource: 'Arithmetic Verification (Turnover + COGS)',
      confidence: 1.0,
      status: 'RECONCILED',
      provenance: {
        documentId: 'doc-unilever-2025',
        documentTitle: 'Unilever_Annual_Report_and_Accounts_2025.pdf',
        section: 'Consolidated Income Statement — Line Item 3',
        lineNumber: 16,
        snippet: 'Gross profit was €23,709 million (46.9% gross margin).'
      }
    },
    {
      id: 'fact-4',
      metric: 'OPERATING_PROFIT',
      label: 'Operating Profit (EBIT)',
      value: 9845000000,
      formattedValue: '€9,845.00M',
      rawString: '9,845',
      currency: 'EUR',
      period: 'FY2025',
      periodType: 'ANNUAL',
      statementType: 'INCOME_STATEMENT',
      pageNumber: 142,
      tableHeader: 'Consolidated Income Statement (€ million)',
      scaleSource: 'Table Header (Millions)',
      confidence: 0.992,
      status: 'VERIFIED',
      provenance: {
        documentId: 'doc-unilever-2025',
        documentTitle: 'Unilever_Annual_Report_and_Accounts_2025.pdf',
        section: 'Consolidated Income Statement — Line Item 7',
        lineNumber: 22,
        snippet: 'Operating profit reached €9,845 million driven by brand productivity programs.'
      }
    },
    {
      id: 'fact-5',
      metric: 'NET_INCOME',
      label: 'Net Profit Attributable to Shareholders',
      value: 6210000000,
      formattedValue: '€6,210.00M',
      rawString: '6,210',
      currency: 'EUR',
      period: 'FY2025',
      periodType: 'ANNUAL',
      statementType: 'INCOME_STATEMENT',
      pageNumber: 142,
      tableHeader: 'Consolidated Income Statement (€ million)',
      scaleSource: 'Table Header (Millions)',
      confidence: 0.997,
      status: 'VERIFIED',
      provenance: {
        documentId: 'doc-unilever-2025',
        documentTitle: 'Unilever_Annual_Report_and_Accounts_2025.pdf',
        section: 'Consolidated Income Statement — Line Item 12',
        lineNumber: 31,
        snippet: 'Net profit for the year attributable to shareholders stood at €6,210 million.'
      }
    },
    {
      id: 'fact-6',
      metric: 'TOTAL_ASSETS',
      label: 'Total Assets',
      value: 70471000000,
      formattedValue: '€70,471.00M',
      rawString: '70,471',
      currency: 'EUR',
      period: 'FY2025',
      periodType: 'ANNUAL',
      statementType: 'BALANCE_SHEET',
      pageNumber: 144,
      tableHeader: 'Consolidated Balance Sheet (€ million)',
      scaleSource: 'Table Header (Millions)',
      confidence: 0.999,
      status: 'VERIFIED',
      provenance: {
        documentId: 'doc-unilever-2025',
        documentTitle: 'Unilever_Annual_Report_and_Accounts_2025.pdf',
        section: 'Consolidated Balance Sheet — Assets Section',
        lineNumber: 48,
        snippet: 'Total assets as at 31 December 2025 were €70,471 million (Non-current €52,884m, Current €17,587m).'
      }
    },
    {
      id: 'fact-7',
      metric: 'TOTAL_LIABILITIES',
      label: 'Total Liabilities',
      value: 48920000000,
      formattedValue: '€48,920.00M',
      rawString: '48,920',
      currency: 'EUR',
      period: 'FY2025',
      periodType: 'ANNUAL',
      statementType: 'BALANCE_SHEET',
      pageNumber: 144,
      tableHeader: 'Consolidated Balance Sheet (€ million)',
      scaleSource: 'Table Header (Millions)',
      confidence: 0.994,
      status: 'VERIFIED',
      provenance: {
        documentId: 'doc-unilever-2025',
        documentTitle: 'Unilever_Annual_Report_and_Accounts_2025.pdf',
        section: 'Consolidated Balance Sheet — Liabilities',
        lineNumber: 82,
        snippet: 'Total liabilities €48,920 million (Non-current €26,410m, Current €22,510m).'
      }
    },
    {
      id: 'fact-8',
      metric: 'TOTAL_EQUITY',
      label: "Total Shareholders' Equity",
      value: 21551000000,
      formattedValue: '€21,551.00M',
      rawString: '21,551',
      currency: 'EUR',
      period: 'FY2025',
      periodType: 'ANNUAL',
      statementType: 'BALANCE_SHEET',
      pageNumber: 144,
      tableHeader: 'Consolidated Balance Sheet (€ million)',
      scaleSource: 'Table Header (Millions)',
      confidence: 0.999,
      status: 'VERIFIED',
      provenance: {
        documentId: 'doc-unilever-2025',
        documentTitle: 'Unilever_Annual_Report_and_Accounts_2025.pdf',
        section: 'Consolidated Balance Sheet — Equity',
        lineNumber: 95,
        snippet: 'Total equity attributable to shareholders and non-controlling interests €21,551 million.'
      }
    }
  ]);

  // Hermes Ingestion Queue Jobs
  const [queueJobs, setQueueJobs] = useState<QueueJobStatus[]>([
    {
      id: 'job-unilever-01',
      documentTitle: 'Unilever_Annual_Report_and_Accounts_2025.pdf',
      fileSize: '14.2 MB',
      pagesTotal: 184,
      pagesCompleted: 184,
      status: 'COMPLETED',
      currentStage: 'Canonical Fact Reconciliation & Signature Verification Complete',
      engineMode: 'HYBRID_GEMINI_NATIVE',
      progress: 100,
      factsExtracted: 342,
      startedAt: '12:44:10'
    }
  ]);

  const handleAddJob = (job: QueueJobStatus) => {
    setQueueJobs((prev) => [job, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased">
      {/* Left Sidebar Navigation */}
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

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
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

        {/* Content Workspace */}
        <main
          className={`flex-1 p-6 transition-all ${
            isCollapsedSidebar ? 'lg:ml-20' : 'lg:ml-72'
          }`}
        >
          {activeView === 'overview' && (
            <OverviewView
              onSelectCompany={(companyId) => {
                setSelectedCompanyId(companyId);
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
              onInspectDocument={() => setSelectedFact(financialFacts[0])}
            />
          )}

          {activeView === 'users-teams' && (
            <UsersTeamsView />
          )}

          {activeView === 'activity-log' && (
            <ActivityLogView />
          )}
        </main>

        {/* Floating Ask Eve AI CPA Widget (Bottom Right) */}
        <FloatingEveChat />
      </div>

      {/* Global Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(session) => setUserSession(session)}
        currentSession={userSession}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddJob={handleAddJob}
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

