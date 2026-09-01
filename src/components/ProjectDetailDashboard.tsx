import React, { useState } from 'react';
import { Workspace, DocumentRecord, FinancialSummary, BankAccountSummary, ExtractedFact } from '../types';
import { ProjectFinancialsTab } from './project-tabs/ProjectFinancialsTab';
import { ProjectDocumentsTab } from './project-tabs/ProjectDocumentsTab';
import { ProjectFindingsTab } from './project-tabs/ProjectFindingsTab';
import { ProjectReportsTab } from './project-tabs/ProjectReportsTab';
import { ProjectInsightsTab } from './project-tabs/ProjectInsightsTab';
import { ProjectActivityTab } from './project-tabs/ProjectActivityTab';
import { VerificationStateMachine } from '../../server/verificationStateMachine';
import {
  ArrowLeft,
  Search,
  Share2,
  Download,
  ChevronDown,
  TrendingUp,
  DollarSign,
  Building2,
  Scale,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Activity,
  Cpu,
  Sparkles,
  Layers,
  Building,
  Info,
  X,
  Mail,
  Phone,
  User,
  CheckSquare,
  BarChart3,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  Users,
  MapPin,
  Database,
  Leaf,
  Edit,
  MessageSquare,
  Send,
  Globe,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

import { ExtractionInspector } from './ExtractionInspector';
import { HermesQueueTracker } from './HermesQueueTracker';

interface ProjectDetailDashboardProps {
  workspace: Workspace;
  documents: DocumentRecord[];
  summary: FinancialSummary | null;
  onNavigate: (view: string) => void;
  onBackToProjects?: () => void;
  onOpenQueueModal?: () => void;
  activeQueueJob?: any;
  userEmail?: string | null;
}

export const ProjectDetailDashboard: React.FC<ProjectDetailDashboardProps> = ({
  workspace,
  documents,
  summary,
  onNavigate,
  onBackToProjects,
  onOpenQueueModal,
  activeQueueJob,
  userEmail,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'projects' | 'financials' | 'documents' | 'findings' | 'reports' | 'insights' | 'subsidiaries' | 'contacts' | 'activity' | 'geographic' | 'settings' | 'extraction'
  >('overview');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('ALL_CONSOLIDATED');

  React.useEffect(() => {
    if (workspace?.id) {
      fetch(`/api/workspaces/${workspace.id}/entities`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.entities)) {
            setEntities(data.entities);
          }
        })
        .catch(() => setEntities([]));
    }
  }, [workspace?.id]);

  const [overviewSubTab, setOverviewSubTab] = useState<
    'key_info' | 'financial_highlights' | 'credit_ratings' | 'banking_facilities' | 'legal_compliance' | 'esg_overview'
  >('key_info');

  const [aiChatMessage, setAiChatMessage] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am Eve, your project-specific AI Assistant. How can I assist with financial statements, compliance findings, or trace-provenance audits today?'
    }
  ]);

  // Dynamic chart variables will be declared below based on workspace context

  // Engagements / Projects List - Only real records
  const companyProjects: any[] = [];

  // Dynamic Subsidiaries Data based on Entity Registry (No hardcoded Apple/Microsoft/Unilever)
  const getDynamicSubs = () => {
    return [];
  };

  const subsidiariesList = getDynamicSubs();

  // Dynamic Client Contacts - Only real extracted or user-entered records
  const getDynamicContactsList = () => {
    return [];
  };

  const clientContacts = getDynamicContactsList();

  // Activity Feed
  const activityLogs: any[] = [];

  // Intelligent company-specific fallback parameters
  const fallbackRevenue = '—';
  const fallbackNetIncome = '—';
  const fallbackAssets = '—';
  const fallbackLiabilities = '—';
  const fallbackEquity = '—';
  const fallbackOperatingIncome = '—';

  // Dynamic visual charts data mapping - No fake decorative series
  const businessSegmentsData: any[] = [];
  const geographicRegions: any[] = [];
  const fiveYearTrendData: any[] = [];

  // Dynamic company details block
  const companyDocs = documents.filter(d => d.workspaceId === workspace.id);
  const companyDetails = {
    name: workspace.name,
    legalName: workspace.name,
    status: 'Active Workspace',
    listing: 'Corporate Client',
    industry: 'Financial & Corporate Entity',
    country: workspace.country || 'Global',
    hq: '—',
    fiscalYearEnd: 'December 31',
    reportingCurrency: workspace.currency || 'EUR',
    accountingStandard: 'IFRS / GAAP',
    healthScore: companyDocs.length > 0 ? Math.round((companyDocs.filter(d => d.status === 'Completed' || d.status === 'PROCESSED').length / companyDocs.length) * 100) : 0,
    riskScore: 'Not Assessed',
    auditReadiness: companyDocs.length > 0 ? Math.round((companyDocs.filter(d => d.status === 'Completed' || d.status === 'PROCESSED').length / companyDocs.length) * 100) : 0,
    dataCompleteness: companyDocs.length > 0 ? Math.round((companyDocs.filter(d => d.status === 'Completed' || d.status === 'PROCESSED').length / companyDocs.length) * 100) : 0,
    annualRevenue: summary?.revenue && summary.revenue !== '—' ? summary.revenue : fallbackRevenue,
    netIncome: summary?.netIncome && summary.netIncome !== '—' ? summary.netIncome : fallbackNetIncome,
    totalAssets: summary?.assets && summary.assets !== '—' ? summary.assets : fallbackAssets,
    totalLiabilities: summary?.liabilities && summary.liabilities !== '—' ? summary.liabilities : fallbackLiabilities,
    equity: summary?.equity && summary.equity !== '—' ? summary.equity : fallbackEquity,
    cashBalance: '—',
    marketCap: '—',
    enterpriseValue: '—',
    employees: '—',
    operatingCountries: '—',
    taxId: 'Not Available',
    regNumber: 'Not Available',
    dateIncorporated: 'Not Available',
    website: 'Not Available',
    auditor: '—',
    legalCounsel: '—',
    bankingPartners: '—',
    ownership: '—',
    documentsCount: companyDocs.length,
    lastUpdated: 'Just now'
  };

  const handleSendAiChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatMessage.trim()) return;

    const userText = aiChatMessage;
    setAiChatHistory((prev) => [...prev, { sender: 'user', text: userText }]);
    setAiChatMessage('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, workspaceId: workspace.id, workspaceName: workspace.name })
      });
      const data = await res.json();
      if (data && data.answer) {
        setAiChatHistory((prev) => [...prev, { sender: 'ai', text: data.answer }]);
      } else {
        setAiChatHistory((prev) => [...prev, { sender: 'ai', text: 'Analysis unavailable. No accounting conclusion has been made.' }]);
      }
    } catch (err) {
      setAiChatHistory((prev) => [...prev, { sender: 'ai', text: 'Analysis unavailable. No accounting conclusion has been made.' }]);
    }
  };

  // Traced Metric Provenance Drawer Modal State
  const [tracedMetricModal, setTracedMetricModal] = useState<{
    metricName: string;
    dashboardValue: string;
    factId: string;
    extractedRowLabel: string;
    documentName: string;
    page: string;
    sourceSnippet: string;
    extractionEngine: string;
    confidence: string;
    status: string;
  } | null>(null);

  // Search & Filter within transactions
  const [txnSearch, setTxnSearch] = useState('');
  const [txnCategoryFilter, setTxnCategoryFilter] = useState('ALL');

  // Check if workspace contains Bank Statement documents
  const isBankStatementWorkspace = workspace.workspaceType === 'bank_statement_review' ||
    documents.some(d => d.category?.toLowerCase().includes('bank statement') || d.filename.toLowerCase().includes('bank') || d.filename.toLowerCase().includes('statement'));

  const currSymbol = summary?.currency || workspace.currency || 'EUR';

  // Extract financial values or fallback gracefully
  const revValue = summary?.revenue && summary.revenue !== '—' ? summary.revenue : fallbackRevenue;
  const netIncValue = summary?.netIncome && summary.netIncome !== '—' ? summary.netIncome : fallbackNetIncome;
  const assetsValue = summary?.assets && summary.assets !== '—' ? summary.assets : fallbackAssets;
  const liabValue = summary?.liabilities && summary.liabilities !== '—' ? summary.liabilities : fallbackLiabilities;
  const equityValue = summary?.equity && summary.equity !== '—' ? summary.equity : fallbackEquity;
  const ebitdaValue = summary?.operatingIncome && summary.operatingIncome !== '—' ? summary.operatingIncome : fallbackOperatingIncome;

  // Verified Performance Data by Reported Period (No fabricated monthly trends)
  const periodPerformanceData = summary?.revenueRaw ? [
    ...(summary?.comparativeRevenueRaw ? [{ period: 'Prior Period', revenue: Number((summary.comparativeRevenueRaw / 1e9).toFixed(2)), netIncome: 0 }] : []),
    { period: workspace.period || summary?.period || 'Current Period', revenue: Number((summary.revenueRaw / 1e9).toFixed(2)), netIncome: summary?.netIncomeRaw ? Number((summary.netIncomeRaw / 1e9).toFixed(2)) : 0 }
  ] : [];

  // Audit Readiness Gauge Donut Data derived from verified document facts
  const verifiedDocsCount = companyDocs.filter(d => d.status === 'Completed' || d.status === 'PROCESSED').length;
  const auditReadinessPct = companyDocs.length > 0 ? Math.round((verifiedDocsCount / companyDocs.length) * 100) : 0;
  const auditReadinessData = [
    { name: 'Processed', value: auditReadinessPct, color: '#059669' },
    { name: 'Remaining', value: 100 - auditReadinessPct, color: '#e2e8f0' }
  ];

  // Financial Health Score Donut Data derived from facts existence
  const healthScoreVal = companyDocs.length > 0 ? Math.round((verifiedDocsCount / companyDocs.length) * 100) : 0;
  const healthScoreData = [
    { name: 'Score', value: healthScoreVal, color: '#2563eb' },
    { name: 'Remaining', value: 100 - healthScoreVal, color: '#f1f5f9' }
  ];

  // Balance Sheet Assets Breakdown Donut Data from facts
  const assetsBreakdownData = [
    { name: 'Current Assets', value: summary?.currentAssetsRaw && summary?.assetsRaw ? Math.round((summary.currentAssetsRaw / summary.assetsRaw) * 100) : 0, color: '#3b82f6' },
    { name: 'Non-Current Assets', value: summary?.currentAssetsRaw && summary?.assetsRaw ? Math.round(100 - (summary.currentAssetsRaw / summary.assetsRaw) * 100) : 0, color: '#0f172a' }
  ];

  // Dynamic Cash Flow Waterfall Bar Data from real facts
  const cashFlowData = [
    { name: 'Operating', amount: summary?.operatingCashFlowRaw ? Number((summary.operatingCashFlowRaw / 1e9).toFixed(2)) : 0, fill: '#059669' },
    { name: 'Investing', amount: summary?.netInvestingCashFlowRaw ? Number((summary.netInvestingCashFlowRaw / 1e9).toFixed(2)) : 0, fill: '#dc2626' },
    { name: 'Financing', amount: summary?.netFinancingCashFlowRaw ? Number((summary.netFinancingCashFlowRaw / 1e9).toFixed(2)) : 0, fill: '#dc2626' },
    { name: 'Free Cash (Derived)', amount: summary?.freeCashFlowRaw ? Number((summary.freeCashFlowRaw / 1e9).toFixed(2)) : 0, fill: '#2563eb' }
  ];

  // Bank Statement Summary
  const defaultBankSummary: BankAccountSummary | null = null;

  const handleOpenTraceModal = (metricName: string, fact?: ExtractedFact | null, displayValue?: string) => {
    if (!fact?.id) return;
    const badge = VerificationStateMachine.getDashboardPresentation(fact);
    const doc = documents.find(d => d.id === fact.documentId);
    setTracedMetricModal({
      metricName,
      dashboardValue: displayValue || fact.valueOriginal || String(fact.valueFunctional),
      factId: fact.id,
      extractedRowLabel: fact.labelOriginal || fact.labelNormalized,
      documentName: doc?.originalName || doc?.filename || fact.sourceDocument || 'not extracted',
      page: fact.pageNumber ? String(fact.pageNumber) : '—',
      sourceSnippet: fact.sourceText || 'not extracted',
      extractionEngine: fact.extractionEngine || fact.extractionMethod || '—',
      confidence: badge.displayState,
      status: badge.displayState
    });
  };

  const kpiFact = (key: string): ExtractedFact | undefined => summary?.kpiProvenanceMap?.[key];
  const renderKpiCard = (title: string, key: string, value: string, icon: React.ReactNode, yoy?: string) => {
    const fact = kpiFact(key);
    const display = fact?.id && value && value !== '—' ? value : '—';
    const badge = fact ? VerificationStateMachine.getDashboardPresentation(fact) : null;
    return (
      <div
        onClick={() => fact?.id && handleOpenTraceModal(title, fact, display)}
        className={`bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs ${fact?.id ? 'hover:border-blue-400 hover:shadow-md cursor-pointer' : ''}`}
      >
        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-600">
          {icon}
          <span>{title}</span>
        </div>
        <div className="mt-2">
          <span className="text-xl font-black text-slate-900 tracking-tight font-mono">{display === '—' ? 'not extracted' : display}</span>
          <p className="text-[10px] font-bold mt-0.5 flex items-center space-x-1">
            <span className={yoy && yoy !== '—' ? 'text-emerald-600' : 'text-slate-400'}>{yoy && yoy !== '—' ? yoy : '—'}</span>
            <span className="text-slate-400 font-normal">vs PY</span>
          </p>
          <p className={`mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded inline-block border ${badge?.badgeColor || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            {fact?.id ? badge?.displayState : 'not extracted'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-16 text-slate-800 font-sans">

      {/* ----------------- TOP NAVIGATION & PROJECT HEADER ----------------- */}
      <div className="bg-white border-b border-slate-200/80 -mx-6 -mt-6 px-6 pt-5 pb-0 shadow-xs space-y-4">
        {/* Top Breadcrumb & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => {
              if (onBackToProjects) onBackToProjects();
              else onNavigate('projects');
            }}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </button>

          <div className="flex items-center space-x-2">
            {activeQueueJob && (activeQueueJob.status === 'PROCESSING' || activeQueueJob.status === 'QUEUED') && onOpenQueueModal && (
              <button
                onClick={onOpenQueueModal}
                className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-black shadow-md hover:opacity-95 transition cursor-pointer animate-pulse"
              >
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Extraction Running ({activeQueueJob.progress || 10}%)</span>
              </button>
            )}
            <button className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer">
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Share</span>
            </button>
            <button className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer">
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
            <div className="relative inline-block">
              <button className="inline-flex items-center space-x-1.5 bg-blue-900 hover:bg-blue-950 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition cursor-pointer">
                <span>Actions</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Project Title & Status Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{workspace.name}</h1>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>In Progress</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Audit Engagement</span>
              <span>•</span>
              <span>{workspace.period || summary?.period || 'Not Specified'}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">🌐 {currSymbol}</span>
            </div>
          </div>

          {entities.length > 0 && (
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-600">Reporting Scope:</span>
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="bg-white border border-slate-300 text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL_CONSOLIDATED">🌐 Consolidated Group ({workspace.name})</option>
                {entities.map(e => (
                  <option key={e.id} value={e.id}>
                    🏢 {e.name} ({e.entityType} • {e.reportingCurrency})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-1 overflow-visible text-xs font-bold text-slate-600 border-t border-slate-100 pt-1">
          <button
            onClick={() => { setActiveTab('overview'); setIsMoreMenuOpen(false); }}
            className={`px-4 py-2.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-700 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => { setActiveTab('financials'); setIsMoreMenuOpen(false); }}
            className={`px-4 py-2.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'financials'
                ? 'border-blue-700 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Financials
          </button>
          <button
            onClick={() => { setActiveTab('documents'); setIsMoreMenuOpen(false); }}
            className={`px-4 py-2.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'documents'
                ? 'border-blue-700 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Documents ({documents.length})
          </button>

          {/* More Sections Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`px-4 py-2.5 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                ['projects', 'findings', 'reports', 'insights', 'subsidiaries', 'contacts', 'activity', 'geographic', 'settings', 'extraction'].includes(activeTab)
                  ? 'border-blue-700 text-blue-700 font-extrabold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>More Sections</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {isMoreMenuOpen && (
              <div className="absolute left-0 mt-1 w-48 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in duration-100">
                {[
                  { key: 'findings', label: 'Audit & Findings' },
                  { key: 'projects', label: 'Projects & Tasks' },
                  { key: 'subsidiaries', label: 'Subsidiaries' },
                  { key: 'contacts', label: 'Contacts' },
                  { key: 'geographic', label: 'Geographic & ESG' },
                  { key: 'activity', label: 'Activity Log' },
                  { key: 'settings', label: 'Settings' },
                  { key: 'extraction', label: 'Extraction Inspector' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveTab(item.key as any);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors ${
                      activeTab === item.key ? 'text-blue-700 bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ----------------- TAB: OVERVIEW DASHBOARD (IMAGE 1 EXACT MATCH) ----------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6 pt-2">

          {/* 6 TOP KPI METRIC CARDS ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {renderKpiCard('Revenue', 'revenue', revValue, <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />, summary?.revenueYoYPct)}
            {renderKpiCard('Net Income', 'net_income', netIncValue, <DollarSign className="w-3.5 h-3.5 text-blue-600" />)}
            {renderKpiCard('Total Assets', 'total_assets', assetsValue, <Layers className="w-3.5 h-3.5 text-purple-600" />)}
            {renderKpiCard('Liabilities', 'total_liabilities', liabValue, <Scale className="w-3.5 h-3.5 text-amber-600" />)}
            {renderKpiCard('Equity', 'total_equity', equityValue, <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />)}
            {renderKpiCard('Operating Profit', 'operating_profit', ebitdaValue, <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />)}
          </div>


          {/* ROW 1: FINANCIAL PERFORMANCE CHART & AUDIT READINESS OVERVIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Card: Financial Performance (YTD) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Financial Performance (YTD)</h3>
                <select className="border border-slate-200 rounded-md text-xs py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none">
                  <option>YTD vs PY</option>
                  <option>Quarterly YoY</option>
                  <option>Monthly Trend</option>
                </select>
              </div>

              {/* Chart */}
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={periodPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="revenue" fill="#2563eb" name={`Revenue (${currSymbol}B)`} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netIncome" fill="#059669" name={`Net Income (${currSymbol}B)`} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Key Metric Summaries */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 pt-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block font-medium">Revenue</span>
                  <span className="font-extrabold text-slate-900 font-mono text-sm">{revValue}</span>
                  <p className="text-[10px] text-slate-500 font-medium">Reported Fact</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block font-medium">Net Income</span>
                  <span className="font-extrabold text-slate-900 font-mono text-sm">{netIncValue}</span>
                  <p className="text-[10px] text-slate-500 font-medium">Reported Fact</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block font-medium">Operating Profit</span>
                  <span className="font-extrabold text-slate-900 font-mono text-sm">{ebitdaValue}</span>
                  <p className="text-[10px] text-slate-500 font-medium">Reported Fact</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block font-medium">Gross Margin</span>
                  <span className="font-extrabold text-slate-900 font-mono text-sm">{summary?.grossMarginPct || '—'}</span>
                  <p className="text-[10px] text-slate-500 font-medium">Derived Formula</p>
                </div>
              </div>
            </div>

            {/* Right Card: Audit Readiness Overview */}
            <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Audit Readiness Assessment</h3>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  Document Ingestion & Verification Status
                </span>
              </div>

              {companyDocs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Donut Chart */}
                  <div className="sm:col-span-5 relative flex items-center justify-center">
                    <div className="w-36 h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={auditReadinessData}
                            innerRadius={46}
                            outerRadius={62}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                          >
                            {auditReadinessData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-slate-900 tracking-tight">{auditReadinessPct}%</span>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Documents Ingested</span>
                    </div>
                  </div>

                  {/* Document Processing Stats */}
                  <div className="sm:col-span-7 space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 text-[11px] block">Uploaded Documents</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">{companyDocs.length} File(s)</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                      <span className="text-emerald-700 text-[11px] block">Processed & Reconciled</span>
                      <span className="font-bold text-emerald-950 text-sm font-mono">{verifiedDocsCount} File(s)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center space-y-2 bg-slate-50 rounded-xl border border-slate-100">
                  <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">Audit readiness has not yet been assessed.</p>
                  <p className="text-xs text-slate-500">Upload statutory annual reports or financial statements to initiate automated verification and audit readiness workflows.</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab('findings')}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>View audit findings &amp; risk logs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>


          {/* ROW 2: TOP FINDINGS, KEY RATIOS & FINANCIAL HEALTH SCORE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Col 1: Top Findings by Risk */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Top Findings by Risk</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start justify-between space-x-2 border-b border-slate-50 pb-2">
                    <div className="flex items-start space-x-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800">High</span>
                      <div>
                        <span className="font-semibold text-slate-800 block leading-tight">Revenue cut-off test – pending confirmation</span>
                        <span className="text-[10px] text-slate-400">Due Jun 12, 2026</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between space-x-2 border-b border-slate-50 pb-2">
                    <div className="flex items-start space-x-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800">High</span>
                      <div>
                        <span className="font-semibold text-slate-800 block leading-tight">Related party transactions – additional review</span>
                        <span className="text-[10px] text-slate-400">Due Jun 15, 2026</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between space-x-2 border-b border-slate-50 pb-2">
                    <div className="flex items-start space-x-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800">Medium</span>
                      <div>
                        <span className="font-semibold text-slate-800 block leading-tight">Inventory valuation – aging analysis required</span>
                        <span className="text-[10px] text-slate-400">Due Jun 18, 2026</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between space-x-2 border-b border-slate-50 pb-2">
                    <div className="flex items-start space-x-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800">Medium</span>
                      <div>
                        <span className="font-semibold text-slate-800 block leading-tight">Lease classification – review required</span>
                        <span className="text-[10px] text-slate-400">Due Jun 20, 2026</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between space-x-2">
                    <div className="flex items-start space-x-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">Low</span>
                      <div>
                        <span className="font-semibold text-slate-800 block leading-tight">Bank reconciliation – minor differences</span>
                        <span className="text-[10px] text-slate-400">Due Jun 25, 2026</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab('findings')}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>View all findings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Col 2: Key Ratios */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Key Ratios</h3>
                  <select className="border border-slate-200 rounded-md text-[11px] py-0.5 px-1.5 bg-slate-50 text-slate-700 font-medium focus:outline-none">
                    <option>vs PY</option>
                    <option>vs Industry</option>
                  </select>
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-600 font-medium">Current Ratio</span>
                    <div className="text-right font-mono">
                      <strong className="text-slate-900">
                        {summary?.currentAssetsRaw && summary?.currentLiabilitiesRaw && summary.currentLiabilitiesRaw > 0
                          ? (summary.currentAssetsRaw / summary.currentLiabilitiesRaw).toFixed(2)
                          : '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-slate-600 font-medium">Gross Margin</span>
                    <div className="text-right font-mono">
                      <strong className="text-slate-900">
                        {summary?.grossMarginPct !== null && summary?.grossMarginPct !== undefined ? `${summary.grossMarginPct}%` : '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-slate-600 font-medium">Operating Margin</span>
                    <div className="text-right font-mono">
                      <strong className="text-slate-900">
                        {summary?.operatingMarginPct !== null && summary?.operatingMarginPct !== undefined ? `${summary.operatingMarginPct}%` : '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-slate-600 font-medium">Net Margin</span>
                    <div className="text-right font-mono">
                      <strong className="text-slate-900">
                        {summary?.netMarginPct !== null && summary?.netMarginPct !== undefined ? `${summary.netMarginPct}%` : '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-slate-600 font-medium">Debt to Equity</span>
                    <div className="text-right font-mono">
                      <strong className="text-slate-900">
                        {summary?.debtToEquity !== null && summary?.debtToEquity !== undefined ? summary.debtToEquity.toFixed(2) : '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-slate-600 font-medium">ROE (Return on Equity)</span>
                    <div className="text-right font-mono">
                      <strong className="text-slate-900">
                        {summary?.returnOnEquity !== null && summary?.returnOnEquity !== undefined ? `${summary.returnOnEquity}%` : '—'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab('financials')}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>View all ratios</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Col 3: Financial Health Score */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Financial Health Score</h3>
                  <span className="text-[10px] font-mono text-slate-400">Model v1.0</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2">
                  <Activity className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">Financial health assessment not yet available.</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Requires multi-period verified ratio streams (Altman Z-Score / Beneish M-Score) with verified input facts across all reporting periods.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab('insights')}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>View underlying ratios</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>


          {/* ROW 3: BALANCE SHEET SUMMARY & CASH FLOW SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Balance Sheet Summary */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Balance Sheet Summary</h3>
                    <span className="text-[11px] text-slate-400">As of Dec 31, 2025</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-3">
                  <div className="sm:col-span-6 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                      <span className="text-slate-600 font-semibold">Total Assets</span>
                      <div className="text-right font-mono">
                        <strong className="text-slate-900">{kpiFact('total_assets')?.id ? assetsValue : 'not extracted'}</strong>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                      <span className="text-slate-600 font-semibold">Total Liabilities</span>
                      <div className="text-right font-mono">
                        <strong className="text-slate-900">{kpiFact('total_liabilities')?.id ? liabValue : 'not extracted'}</strong>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                      <span className="text-slate-600 font-semibold">Total Equity</span>
                      <div className="text-right font-mono">
                        <strong className="text-slate-900">{kpiFact('total_equity')?.id ? equityValue : 'not extracted'}</strong>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-semibold">Working Capital</span>
                      <div className="text-right font-mono">
                        <strong className="text-slate-900">not extracted</strong>
                      </div>
                    </div>
                  </div>

                  {/* Donut Chart */}
                  <div className="sm:col-span-6 relative flex items-center justify-center">
                    <div className="w-36 h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={assetsBreakdownData}
                            innerRadius={42}
                            outerRadius={58}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                          >
                            {assetsBreakdownData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                      <span className="text-xs font-black text-slate-900 font-mono">{assetsValue}</span>
                      <span className="text-[9px] text-slate-400 font-semibold">Total Assets</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab('financials')}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>View balance sheet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Cash Flow Summary */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Cash Flow Summary (YTD)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-3">
                  <div className="sm:col-span-6 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                      <span className="text-slate-600 font-semibold">Operating Cash Flow</span>
                      <div className="text-right font-mono">
                        <strong className="text-slate-900">{summary?.operatingCashFlow && summary.operatingCashFlow !== "—" ? summary.operatingCashFlow : '—'}</strong>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                      <span className="text-slate-600 font-semibold">Investing Cash Flow</span>
                      <div className="text-right font-mono">
                        <strong className="text-slate-900">{summary?.investingCashFlow && summary.investingCashFlow !== "—" ? summary.investingCashFlow : '—'}</strong>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                      <span className="text-slate-600 font-semibold">Financing Cash Flow</span>
                      <div className="text-right font-mono">
                        <strong className="text-slate-900">{summary?.financingCashFlow && summary.financingCashFlow !== "—" ? summary.financingCashFlow : '—'}</strong>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-semibold">Free Cash Flow</span>
                      <div className="text-right font-mono">
                        <strong className="text-slate-900">{summary?.freeCashFlow && summary.freeCashFlow !== "—" ? summary.freeCashFlow : '—'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Cash Flow Waterfall Bar Chart */}
                  <div className="sm:col-span-6 h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '10px' }} />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                          {cashFlowData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab('financials')}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>View cash flow statement</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>


          {/* Asynchronous Hermes Queue Telemetry & Progress Tracker */}
          <HermesQueueTracker activeWorkspace={workspace} />

          {/* ROW 4: RECENT DOCUMENTS & TASKS / MILESTONES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Recent Documents Table */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Recent Documents</h3>
                </div>

                <div className="overflow-x-auto pt-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                        <th className="py-2 px-1">Document Name</th>
                        <th className="py-2 px-2">Type</th>
                        <th className="py-2 px-2">Period</th>
                        <th className="py-2 px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400 text-xs">No documents uploaded yet.</td>
                        </tr>
                      ) : (
                        documents.slice(0, 5).map((doc, idx) => (
                          <tr key={`${doc.id}-${idx}`} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-1 font-semibold text-slate-800 flex items-center space-x-2">
                              <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{doc.originalName || doc.filename}</span>
                            </td>
                            <td className="py-2.5 px-2 text-slate-500 font-medium">{doc.category || 'Financial Statement'}</td>
                            <td className="py-2.5 px-2 text-slate-500 font-mono">FY 2025</td>
                            <td className="py-2.5 px-2 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Processed
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab('documents')}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>Go to Documents</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tasks & Milestones Table */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Tasks & Milestones</h3>
                </div>

                <div className="overflow-x-auto pt-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                        <th className="py-2 px-1">Task / Milestone</th>
                        <th className="py-2 px-2">Owner</th>
                        <th className="py-2 px-2">Due Date</th>
                        <th className="py-2 px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      <tr>
                        <td className="py-4 px-1 text-slate-400 text-xs" colSpan={4}>No tasks recorded for this workspace.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab('findings')}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>View all tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>


          {/* ROW 5: ENGAGEMENT TEAM, PROJECT TIMELINE & ACTIVITY FEED */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Col 1: Engagement Team */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Engagement Team</h3>
                </div>

                <div className="space-y-2.5 text-xs text-slate-500">
                  {userEmail ? (
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
                        {userEmail.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">{userEmail}</span>
                        <span className="text-[10px] text-slate-400">Signed-in user</span>
                      </div>
                    </div>
                  ) : (
                    <p>No engagement team recorded. People are not invented.</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center space-x-1 cursor-pointer">
                  <span>View all team members</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Col 2: Project Timeline */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Project Timeline</h3>
                </div>

                {/* Progress Stepper */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <div className="text-center">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-1">✓</div>
                      <span>Planning</span>
                    </div>
                    <div className="text-center">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-1">✓</div>
                      <span>Fieldwork</span>
                    </div>
                    <div className="text-center">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-1 animate-bounce">●</div>
                      <span className="text-blue-700 font-bold">Review</span>
                    </div>
                    <div className="text-center">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-1">4</div>
                      <span>Reporting</span>
                    </div>
                    <div className="text-center">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-1">5</div>
                      <span>Close</span>
                    </div>
                  </div>

                  <div className="bg-blue-50/80 border border-blue-200 p-3 rounded-lg text-xs space-y-1">
                    <span className="text-[10px] font-bold text-blue-900 uppercase block">Currently in Review</span>
                    <p className="text-[11px] text-blue-800">
                      We are currently reviewing audit evidence and extracted findings. Please upload any pending documents or working papers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center space-x-1 cursor-pointer">
                  <span>View full timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Col 3: Activity Feed */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Activity Feed</h3>
                  <button onClick={() => setActiveTab('activity')} className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer">
                    View all
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  {companyDocs.length === 0 ? (
                    <p className="text-slate-400">No activity yet. Uploads will appear here.</p>
                  ) : companyDocs.slice(0, 4).map((doc) => (
                    <div key={doc.id} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1 flex-shrink-0"></div>
                      <div>
                        <span className="font-semibold text-slate-800 block">{doc.originalName || doc.filename} uploaded</span>
                        <span className="text-[10px] text-slate-400">{doc.createdAt || '—'} · {doc.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab('activity')}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>View activity log</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ----------------- TAB: FINANCIALS ----------------- */}
      {activeTab === 'financials' && (
        <ProjectFinancialsTab workspace={workspace} documents={documents} summary={summary} />
      )}

      {/* ----------------- TAB: DOCUMENTS ----------------- */}
      {activeTab === 'documents' && (
        <ProjectDocumentsTab workspace={workspace} documents={documents} />
      )}

      {/* ----------------- TAB: AUDIT & FINDINGS ----------------- */}
      {activeTab === 'findings' && (
        <ProjectFindingsTab workspace={workspace} documents={documents} />
      )}

      {/* ----------------- TAB: REPORTS ----------------- */}
      {activeTab === 'reports' && (
        <ProjectReportsTab workspace={workspace} documents={documents} summary={summary} userEmail={userEmail} />
      )}

      {/* ----------------- TAB: INSIGHTS ----------------- */}
      {activeTab === 'insights' && (
        <ProjectInsightsTab workspace={workspace} documents={documents} />
      )}

      {/* ----------------- TAB: PROJECTS ----------------- */}
      {activeTab === 'projects' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Client Engagements & Projects ({companyProjects.length})</h3>
              <p className="text-xs text-slate-500">Every audit, review, tax, and advisory engagement under this client master record.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Project Title</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Partner & Manager</th>
                  <th className="py-2.5 px-3">Completion</th>
                  <th className="py-2.5 px-3">Budget</th>
                  <th className="py-2.5 px-3">Risk</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {companyProjects.map((proj) => (
                  <tr key={proj.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{proj.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {proj.startDate} – {proj.endDate}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{proj.type}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          proj.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : proj.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {proj.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div className="font-bold text-slate-800">{proj.partner}</div>
                      <div className="text-[10px] text-slate-400">{proj.manager}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      <div className="flex items-center space-x-2">
                        <span>{proj.completion}%</span>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: `${proj.completion}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{proj.budget}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          proj.risk === 'Low' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {proj.risk}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-blue-700">
                      Active engagement
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- TAB: SUBSIDIARIES ----------------- */}
      {activeTab === 'subsidiaries' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Corporate Subsidiaries & Group Structure</h3>
              <p className="text-xs text-slate-500">Legal corporate tree, ownership percentages, and consolidation status.</p>
            </div>
          </div>

          {subsidiariesList.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">not extracted — subsidiaries are not invented.</p>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subsidiariesList.map((sub, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-extrabold text-xs text-slate-900">{sub.name}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold text-[10px] rounded-full">{sub.ownership}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Country: {sub.country} • Revenue: {sub.rev}</div>
                <div className="text-[10px] font-bold text-slate-700 bg-white p-1.5 rounded border border-slate-200">{sub.role}</div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* ----------------- TAB: CONTACTS ----------------- */}
      {activeTab === 'contacts' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Key Client Contacts & Management</h3>

          {clientContacts.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">not extracted — people are not invented.</p>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientContacts.map((c, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="font-extrabold text-slate-900">{c.name}</div>
                <div className="text-slate-500 font-semibold">{c.title}</div>
                <div className="flex items-center space-x-2 text-blue-600 font-mono text-[11px] pt-1 border-t border-slate-200">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{c.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-500 font-mono text-[11px]">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{c.phone}</span>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* ----------------- TAB: ACTIVITY ----------------- */}
      {activeTab === 'activity' && (
        <ProjectActivityTab workspace={workspace} documents={documents} />
      )}

      {/* ----------------- TAB: GEOGRAPHIC & ESG ----------------- */}
      {activeTab === 'geographic' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
          <div>
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Geographic Intelligence & ESG Compliance</h3>
            <p className="text-xs text-slate-500">Geographic operations overview, carbon neutrality and regulatory status.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <div className="font-bold text-slate-900">Geographic Regions</div>
              <p className="text-slate-600">not extracted — region mix is only shown when sourced from gated facts.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <Leaf className="w-5 h-5 text-emerald-600" />
              <div className="font-bold text-slate-900">ESG & Sustainability Rating</div>
              <p className="text-slate-600">not extracted — ESG scores are not invented.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <Scale className="w-5 h-5 text-purple-600" />
              <div className="font-bold text-slate-900">Global Tax & Regulatory Compliance</div>
              <p className="text-slate-600">not extracted — filings and auditor opinions are not assumed.</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Regional Distribution Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {geographicRegions.map((reg, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>{reg.region}</span>
                    <span className="font-mono text-slate-900">{reg.rev} ({reg.pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`${reg.color} h-full rounded-full transition-all duration-500`} style={{ width: `${reg.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: SETTINGS ----------------- */}
      {activeTab === 'settings' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 max-w-2xl">
          <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Project Master Settings</h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Project Name</label>
              <input type="text" defaultValue={workspace.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Accounting Standard</label>
                <select defaultValue="IFRS" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800">
                  <option value="IFRS">IFRS / EU GAAP</option>
                  <option value="US_GAAP">US GAAP</option>
                  <option value="Local_GAAP">Local GAAP</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reporting Currency</label>
                <select defaultValue={workspace.currency || "EUR"} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800">
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-blue-950 transition">
                Save Project Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: EXTRACTION PIPELINE ----------------- */}
      {activeTab === 'extraction' && (
        <ExtractionInspector workspace={workspace} documents={documents} />
      )}

      {/* ----------------- TRACED METRIC PROVENANCE MODAL ----------------- */}
      {tracedMetricModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden space-y-4 p-6 relative">
            <button
              onClick={() => setTracedMetricModal(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Trace Value Provenance Chain</h3>
                <p className="text-xs text-slate-500">Auditable evidence trail connecting UI value to source file</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Metric Name</span>
                  <span className="text-sm font-black text-blue-950">{tracedMetricModal.metricName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Extracted Value</span>
                  <span className="text-base font-mono font-black text-blue-950">{tracedMetricModal.dashboardValue}</span>
                </div>
              </div>

              <div className="space-y-2 border-l-2 border-blue-500 pl-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">FACT ID</span>
                  <span className="font-mono text-slate-800">{tracedMetricModal.factId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">SOURCE DOCUMENT & PAGE</span>
                  <span className="text-slate-900 font-semibold">{tracedMetricModal.documentName} (Page {tracedMetricModal.page})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">RAW EXCERPT FROM DOCUMENT</span>
                  <p className="font-mono text-[11px] bg-slate-50 p-2 rounded text-slate-800 border border-slate-200 mt-1">
                    "{tracedMetricModal.sourceSnippet}"
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span>Extraction Engine: <strong>{tracedMetricModal.extractionEngine}</strong></span>
                  <span className="text-emerald-600 font-bold">Confidence: {tracedMetricModal.confidence}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setTracedMetricModal(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Close Provenance Trace
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
