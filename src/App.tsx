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
import { FinancialDashboardView } from './components/FinancialDashboardView';
import { FloatingEveChat } from './components/FloatingEveChat';
import { LoginModal, DEMO_USERS } from './components/LoginModal';
import { UploadModal } from './components/UploadModal';
import { ProvenanceInspectorModal } from './components/ProvenanceInspectorModal';

export default function App() {
  // Navigation & View State
  const [activeView, setActiveView] = useState<ActiveView>('financials-dashboard');
  const [activeProjectTab, setActiveProjectTab] = useState<string>('Financials');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(false);

  // Modals & User Session State
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
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
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenUpload={() => setIsUploadOpen(true)}
          userSession={userSession}
          activeProjectTab={activeProjectTab}
          setActiveProjectTab={setActiveProjectTab}
          isCollapsedSidebar={isCollapsedSidebar}
        />

        {/* Content Workspace */}
        <main
          className={`flex-1 p-6 transition-all ${
            isCollapsedSidebar ? 'lg:ml-20' : 'lg:ml-72'
          }`}
        >
          {/* Default / Financial Dashboard View */}
          {(activeView === 'financials-dashboard' || activeView === 'overview') && (
            <FinancialDashboardView />
          )}

          {/* Income Statement View */}
          {activeView === 'income-statement' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-mono">Consolidated Income Statement</h2>
                  <p className="text-xs text-slate-500">Unilever PLC • FY 2025 • In EUR Millions</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  IFRS Audited
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase">
                      <th className="py-2.5 px-4">Line Item</th>
                      <th className="py-2.5 px-4 text-right">FY 2025</th>
                      <th className="py-2.5 px-4 text-right">FY 2024</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financialFacts
                      .filter((f) => f.statementType === 'INCOME_STATEMENT')
                      .map((fact) => (
                        <tr key={fact.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedFact(fact)}>
                          <td className="py-3 px-4 font-bold text-slate-800">{fact.label}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">{fact.formattedValue}</td>
                          <td className="py-3 px-4 text-right text-slate-500">€49,610.00M</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                              {fact.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Balance Sheet View */}
          {activeView === 'balance-sheet' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-mono">Consolidated Balance Sheet</h2>
                  <p className="text-xs text-slate-500">Assets, Liabilities & Equity • Identity Identity Checked</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Assets = L + E Verified
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase">
                      <th className="py-2.5 px-4">Balance Sheet Metric</th>
                      <th className="py-2.5 px-4 text-right">FY 2025</th>
                      <th className="py-2.5 px-4 text-center">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financialFacts
                      .filter((f) => f.statementType === 'BALANCE_SHEET')
                      .map((fact) => (
                        <tr key={fact.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedFact(fact)}>
                          <td className="py-3 px-4 font-bold text-slate-800">{fact.label}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">{fact.formattedValue}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                              {(fact.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fallback for other sidebar views */}
          {!['financials-dashboard', 'overview', 'income-statement', 'balance-sheet'].includes(activeView) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-mono uppercase">
                  {activeView.replace('-', ' ')}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Active Audit Workspace for Unilever PLC. All data streams and AI agents are running in real-time.
                </p>
              </div>
              <button
                onClick={() => setActiveView('financials-dashboard')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                Return to Summary Dashboard
              </button>
            </div>
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

      <ProvenanceInspectorModal
        fact={selectedFact}
        onClose={() => setSelectedFact(null)}
      />
    </div>
  );
}
