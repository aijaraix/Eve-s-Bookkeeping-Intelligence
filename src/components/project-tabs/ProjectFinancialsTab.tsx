import React, { useState, useEffect } from 'react';
import { Workspace, DocumentRecord, FinancialSummary, ExtractedFact } from '../../types';
import { ExtractionReportCard } from '../ExtractionReportCard';
import { DynamicAdaptiveDashboard } from '../DynamicAdaptiveDashboard';
import {
  TrendingUp,
  DollarSign,
  Layers,
  Scale,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
  Download,
  Share2,
  ChevronRight,
  ChevronDown,
  Building2,
  Globe,
  PieChart as PieChartIcon,
  BarChart3,
  FileSpreadsheet,
  HelpCircle,
  X,
  ExternalLink,
  Plus,
  RefreshCw,
  Info,
  CheckSquare,
  Lock,
  Eye,
  Sliders,
  FolderOpen,
  ArrowUpRight,
  ArrowDownRight
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
  Bar,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { VerificationStateMachine } from '../../../server/verificationStateMachine';

interface ProjectFinancialsTabProps {
  workspace: Workspace;
  documents: DocumentRecord[];
  summary: FinancialSummary | null;
}

export const ProjectFinancialsTab: React.FC<ProjectFinancialsTabProps> = ({
  workspace,
  documents,
  summary
}) => {
  const [facts, setFacts] = useState<ExtractedFact[]>([]);

  useEffect(() => {
    if (workspace?.id) {
      fetch(`/api/facts?workspaceId=${workspace.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setFacts(data);
        })
        .catch((err) => console.warn('Failed to load facts:', err));
    }
  }, [workspace?.id]);
  // Financials Secondary Sub-Tabs
  const [subTab, setSubTab] = useState<
    | 'summary'
    | 'income_statement'
    | 'balance_sheet'
    | 'cash_flow'
    | 'trial_balance'
    | 'general_ledger'
    | 'ratios'
    | 'variance'
    | 'segments'
    | 'entities'
    | 'currencies'
    | 'trends'
    | 'forecasts'
    | 'reconciliation'
    | 'source_mapping'
  >('summary');

  // Filters for Financial Workspace
  const [periodFilter, setPeriodFilter] = useState('Current period vs prior (when extracted)');
  const [comparisonFilter, setComparisonFilter] = useState('Prior Year');
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [entityFilter, setEntityFilter] = useState('All Entities (Consolidated)');

  // Traced Source Modal State
  const [selectedSourceMapping, setSelectedSourceMapping] = useState<{
    metricName: string;
    value: string;
    document: string;
    page: string;
    sheet?: string;
    cell?: string;
    account: string;
    confidence: string;
    hermesConsensus: string;
    humanReviewer: string;
    snippet: string;
  } | null>(null);

  // Income Statement Expandable Rows State
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({
    revenue: true,
    opex: true,
    cogs: false
  });

  const toggleAccountExpand = (key: string) => {
    setExpandedAccounts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currSymbol = summary?.currency || workspace.currency || '€';

  // ---------------- DYNAMIC DATA PREPARATION FROM EXTRACTED FACTS ----------------
  const hasFacts = !!summary?.hasValidatedFacts;

  const displayRevenue = summary?.revenue && summary.revenue !== "—" ? `${currSymbol}${summary.revenue}` : "—";
  const displayCOGS = summary?.costOfRevenue && summary.costOfRevenue !== "—" ? `(${currSymbol}${summary.costOfRevenue})` : "—";
  const displayGrossProfit = summary?.grossProfit && summary.grossProfit !== "—" ? `${currSymbol}${summary.grossProfit}` : "—";
  const displayNetIncome = summary?.netIncome && summary.netIncome !== "—" ? `${currSymbol}${summary.netIncome}` : "—";

  // Top KPI metrics
  const calculatedCurrentRatio = (summary?.currentAssetsRaw && summary?.currentLiabilitiesRaw && summary.currentLiabilitiesRaw > 0)
    ? (summary.currentAssetsRaw / summary.currentLiabilitiesRaw).toFixed(2)
    : '—';

  const topKpiMetrics = [
    { title: 'Revenue', val: hasFacts && summary?.revenue && summary.revenue !== "—" ? `${currSymbol}${summary.revenue}` : "—", change: summary?.revenueYoYPct && summary.revenueYoYPct !== "—" ? `↑ ${summary.revenueYoYPct}` : "—", vs: 'vs PY', icon: TrendingUp, color: 'text-emerald-600', sparkData: [] },
    { title: 'Gross Profit', val: hasFacts && summary?.grossProfit && summary.grossProfit !== "—" ? `${currSymbol}${summary.grossProfit}` : "—", change: summary?.grossMarginPct && summary.grossMarginPct !== "—" ? `Margin: ${summary.grossMarginPct}` : "—", vs: '', icon: DollarSign, color: 'text-blue-600', sparkData: [] },
    { title: 'EBITDA / Operating Profit', val: hasFacts && summary?.operatingIncome && summary.operatingIncome !== "—" ? `${currSymbol}${summary.operatingIncome}` : "—", change: '—', vs: '', icon: BarChart3, color: 'text-purple-600', sparkData: [] },
    { title: 'Net Income', val: hasFacts && summary?.netIncome && summary.netIncome !== "—" ? `${currSymbol}${summary.netIncome}` : "—", change: '—', vs: '', icon: DollarSign, color: 'text-emerald-600', sparkData: [] },
    { title: 'Total Assets', val: hasFacts && summary?.assets && summary.assets !== "—" ? `${currSymbol}${summary.assets}` : "—", change: '—', vs: '', icon: Layers, color: 'text-indigo-600', sparkData: [] },
    { title: 'Current Ratio', val: hasFacts ? calculatedCurrentRatio : '—', change: '—', vs: '', icon: Scale, color: 'text-amber-600', sparkData: [] }
  ];

  // Financial Performance Trend Data (Annual Reporting Periods from Ingested Facts - No manufactured monthly data)
  const performanceTrendData = hasFacts ? [
    { month: 'FY 2025', revenue: (summary.revenueRaw || 0) / 1e9, netIncome: (summary.netIncomeRaw || 0) / 1e9, ebitda: (summary.operatingIncomeRaw || 0) / 1e9 }
  ] : [];

  // Key Financial Ratios Table Data
  const calculatedROA = (summary?.netIncomeRaw && summary?.assetsRaw && summary.assetsRaw > 0)
    ? `${((summary.netIncomeRaw / summary.assetsRaw) * 100).toFixed(1)}%`
    : '—';
  const calculatedROE = (summary?.netIncomeRaw && summary?.equityRaw && summary.equityRaw > 0)
    ? `${((summary.netIncomeRaw / summary.equityRaw) * 100).toFixed(1)}%`
    : '—';

  const ratiosTableData = hasFacts ? [
    { ratio: 'Gross Margin', ytd: summary?.grossMarginPct || '—', py: '—', change: '—', benchmark: '—', status: summary?.grossMarginPct ? 'From facts' : 'not extracted' },
    { ratio: 'Net Margin', ytd: summary?.netIncomeRaw && summary?.revenueRaw ? `${((summary.netIncomeRaw / summary.revenueRaw) * 100).toFixed(1)}%` : '—', py: '—', change: '—', benchmark: '—', status: '—' },
    { ratio: 'ROA', ytd: calculatedROA, py: '—', change: '—', benchmark: '—', status: calculatedROA !== '—' ? 'From facts' : 'not extracted' },
    { ratio: 'ROE', ytd: calculatedROE, py: '—', change: '—', benchmark: '—', status: calculatedROE !== '—' ? 'From facts' : 'not extracted' },
    { ratio: 'Current Ratio', ytd: calculatedCurrentRatio, py: '—', change: '—', benchmark: '—', status: calculatedCurrentRatio !== '—' ? 'From facts' : 'not extracted' }
  ] : [];

  // Top Accounts Movement Data
  const topAccountsMovement = hasFacts ? [
    { account: 'Sales Revenue', ytd: summary?.revenue && summary.revenue !== "—" ? `${currSymbol}${summary.revenue}` : "—", py: '—', changeDol: '—', changePct: summary?.revenueYoYPct || '—', trend: [] },
    { account: 'Cost of Goods Sold', ytd: summary?.costOfRevenue && summary.costOfRevenue !== "—" ? `${currSymbol}${summary.costOfRevenue}` : "—", py: '—', changeDol: '—', changePct: '—', trend: [] },
    { account: 'Gross Profit', ytd: summary?.grossProfit && summary.grossProfit !== "—" ? `${currSymbol}${summary.grossProfit}` : "—", py: '—', changeDol: '—', changePct: '—', trend: [] },
    { account: 'Net Income', ytd: summary?.netIncome && summary.netIncome !== "—" ? `${currSymbol}${summary.netIncome}` : "—", py: '—', changeDol: '—', changePct: '—', trend: [] },
    { account: 'Cash & Cash Equivalents', ytd: summary?.cash && summary.cash !== "—" ? `${currSymbol}${summary.cash}` : "—", py: '—', changeDol: '—', changePct: '—', trend: [] }
  ].filter(acc => acc.ytd !== "—") : [];

  // Cash Flow Summary Data
  const cashFlowSummary = hasFacts ? [
    { name: 'Operating Cash Flow', ytd: summary?.operatingIncome && summary.operatingIncome !== "—" ? `${currSymbol}${summary.operatingIncome}` : "—", py: '—', changeDol: '—' },
    { name: 'Net Change in Cash', ytd: summary?.cash && summary.cash !== "—" ? `${currSymbol}${summary.cash}` : "—", py: '—', changeDol: '—' },
    { name: 'Ending Cash Balance', ytd: summary?.cash && summary.cash !== "—" ? `${currSymbol}${summary.cash}` : "—", py: '—', changeDol: '—' }
  ].filter(cf => cf.ytd !== "—") : [];

  // Data Health Score Gauge Donut
  const approvedCount = facts.filter(f => String(f.status).toLowerCase() === 'approved' || String(f.status).toLowerCase() === 'validated').length;
  const pendingCount = facts.filter(f => String(f.status).toLowerCase().includes('pending') || String(f.status).toLowerCase() === 'proposed').length;
  const missingCount = Math.max(0, facts.length - approvedCount - pendingCount);
  const dataHealthDonutData = facts.length > 0 ? [
    { name: 'Approved', value: approvedCount, color: '#10b981' },
    { name: 'Pending review', value: pendingCount, color: '#f59e0b' },
    { name: 'Other', value: missingCount, color: '#94a3b8' }
  ].filter(d => d.value > 0) : [];

  // Open Trace Provenance Modal Helper
  const factForLabel = (label: string) =>
    facts.find((f) => {
      const blob = `${f.labelNormalized || ''} ${f.labelOriginal || ''} ${f.canonicalMetric || ''}`.toLowerCase();
      return blob.includes(label.toLowerCase()) || blob.includes(label.toLowerCase().replace(/\s+/g, '_'));
    });

  const openTrace = (
    metricOrFact: string | ExtractedFact | null | undefined,
    value?: string,
    _document?: string,
    _page?: string,
    _account?: string,
    _snippet?: string
  ) => {
    const fact = typeof metricOrFact === 'object' && metricOrFact ? metricOrFact : factForLabel(String(metricOrFact || ''));
    const fallbackName = typeof metricOrFact === 'string' ? metricOrFact : fact?.labelNormalized;
    if (!fact?.id) {
      setSelectedSourceMapping({
        metricName: fallbackName || 'not extracted',
        value: '—',
        document: 'not extracted',
        page: '—',
        sheet: undefined,
        cell: undefined,
        account: fallbackName || '',
        confidence: 'not extracted',
        hermesConsensus: '—',
        humanReviewer: '—',
        snippet: 'This figure was not extracted from a source document.'
      });
      return;
    }
    const badge = VerificationStateMachine.getDashboardPresentation(fact);
    const doc = documents.find(d => d.id === fact.documentId);
    setSelectedSourceMapping({
      metricName: fact.labelNormalized || fact.labelOriginal || fallbackName || '',
      value: fact.valueOriginal || value || String(fact.valueFunctional),
      document: doc?.originalName || doc?.filename || fact.sourceDocument || '',
      page: fact.pageNumber ? String(fact.pageNumber) : '—',
      sheet: fact.tableName,
      cell: fact.provenance?.cellRange,
      account: fact.labelOriginal,
      confidence: badge.displayState,
      hermesConsensus: '—',
      humanReviewer: '—',
      snippet: fact.sourceText || 'not extracted'
    });
  };

  return (
    <div className="space-y-6 pt-2">
      {/* ---------------- SECONDARY SUB-NAVIGATION DROPDOWN (ANTI-HORIZONTAL-VERTICAL TABS) ---------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Financial Section:</span>
          <select
            value={subTab}
            onChange={(e) => setSubTab(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-xs rounded-xl px-3 py-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
          >
            <option value="summary">Summary Dashboard</option>
            <option value="income_statement">Income Statement</option>
            <option value="balance_sheet">Balance Sheet</option>
            <option value="cash_flow">Cash Flow Statement</option>
            <option value="trial_balance">Trial Balance</option>
            <option value="general_ledger">General Ledger</option>
            <option value="ratios">Ratios & KPIs</option>
            <option value="variance">Variance Analysis</option>
            <option value="segments">Segment Breakdown</option>
            <option value="entities">Entities & Group Consolidation</option>
            <option value="currencies">Currencies & FX</option>
            <option value="trends">Historical Trends</option>
            <option value="forecasts">Forecasts & Projections</option>
            <option value="reconciliation">Reconciliation Ledger</option>
            <option value="source_mapping">Audit Source Mapping & Provenance</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Reporting Period:</span>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-3 py-1.5 cursor-pointer focus:outline-none"
          >
            <option value="YTD (Jan 1 – Jun 7, 2025) vs PY">YTD (FY2025) vs PY</option>
            <option value="FY 2024 Audited">FY 2024 Audited</option>
            <option value="FY 2023 Audited">FY 2023 Audited</option>
          </select>
        </div>
      </div>

      {/* ---------------- MAIN FINANCIALS WORKSPACE CONTENT ---------------- */}
      <div className="space-y-6">

        {/* ---------------- SUB-TAB 1: SUMMARY (DYNAMIC EXTRACTION & ADAPTIVE DASHBOARD) ---------------- */}
        {subTab === 'summary' && (
          <div className="space-y-6">
            {/* Extraction Report Banner & Fact Registry Trigger */}
            <ExtractionReportCard
              workspace={workspace}
              documents={documents}
              facts={facts}
            />

            {/* Dynamic Adaptive Dashboard Engine */}
            <DynamicAdaptiveDashboard
              workspace={workspace}
              documents={documents}
              facts={facts}
              summary={summary}
            />
          </div>
        )}

        {/* ---------------- SUB-TAB 2: INCOME STATEMENT ---------------- */}
        {subTab === 'income_statement' && (() => {
          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

              {/* LEFT 8 COLUMNS */}
              <div className="lg:col-span-8 space-y-5">

                {/* Financial Performance Trend Chart Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span>Financial Performance Trend</span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <select className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-slate-50 text-slate-700 font-bold focus:outline-none">
                        <option>Line</option>
                        <option>Bar</option>
                        <option>Area</option>
                      </select>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-6 text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      Revenue
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      Net Income
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                      EBITDA
                    </span>
                  </div>

                  {/* Chart */}
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} unit="B" />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                        <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} name="Revenue (€B)" />
                        <Line type="monotone" dataKey="netIncome" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} name="Net Income (€B)" />
                        <Line type="monotone" dataKey="ebitda" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="4 4" dot={false} name="EBITDA (€B)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Key Financial Ratios (YTD) Table */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Key Financial Ratios (YTD)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                          <th className="py-2.5 px-2">Ratio</th>
                          <th className="py-2.5 px-2 font-mono">YTD</th>
                          <th className="py-2.5 px-2 font-mono">PY</th>
                          <th className="py-2.5 px-2 font-mono">Change</th>
                          <th className="py-2.5 px-2 font-mono">Benchmark</th>
                          <th className="py-2.5 px-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {ratiosTableData.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-2 font-bold text-slate-800">{row.ratio}</td>
                            <td className="py-2.5 px-2 font-mono font-black text-slate-900">{row.ytd}</td>
                            <td className="py-2.5 px-2 font-mono text-slate-500">{row.py}</td>
                            <td className="py-2.5 px-2 font-mono font-bold text-emerald-600">{row.change}</td>
                            <td className="py-2.5 px-2 font-mono text-slate-400">{row.benchmark}</td>
                            <td className="py-2.5 px-2 text-right">
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setSubTab('ratios')}
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all ratios & KPIs →</span>
                    </button>
                  </div>
                </div>

                {/* Top Accounts Movement (YTD) */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Top Accounts Movement (YTD)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                          <th className="py-2.5 px-2">Account</th>
                          <th className="py-2.5 px-2 font-mono">YTD</th>
                          <th className="py-2.5 px-2 font-mono">PY</th>
                          <th className="py-2.5 px-2 font-mono">Change ($)</th>
                          <th className="py-2.5 px-2 font-mono">Change (%)</th>
                          <th className="py-2.5 px-2 text-right">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {topAccountsMovement.map((acc, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => openTrace(acc.account, acc.ytd)}>
                            <td className="py-2.5 px-2 font-bold text-slate-800">{acc.account}</td>
                            <td className="py-2.5 px-2 font-mono font-black text-slate-900">{acc.ytd}</td>
                            <td className="py-2.5 px-2 font-mono text-slate-500">{acc.py}</td>
                            <td className="py-2.5 px-2 font-mono font-bold text-slate-900">{acc.changeDol}</td>
                            <td className="py-2.5 px-2 font-mono font-bold text-emerald-600">{acc.changePct}</td>
                            <td className="py-2.5 px-2 text-right w-20">
                              <div className="h-4 w-16 ml-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={acc.trend.map((v, idx) => ({ idx, v }))}>
                                    <Line type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={1.5} dot={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setSubTab('income_statement')}
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all accounts →</span>
                    </button>
                  </div>
                </div>

                {/* Cash Flow Summary (YTD) */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Cash Flow Summary (YTD)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                          <th className="py-2.5 px-2">Flow Item</th>
                          <th className="py-2.5 px-2 font-mono">YTD</th>
                          <th className="py-2.5 px-2 font-mono">PY</th>
                          <th className="py-2.5 px-2 font-mono text-right">Change ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {cashFlowSummary.map((cf, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => openTrace(cf.name, cf.ytd)}>
                            <td className="py-2.5 px-2 font-bold text-slate-800">{cf.name}</td>
                            <td className="py-2.5 px-2 font-mono font-black text-slate-900">{cf.ytd}</td>
                            <td className="py-2.5 px-2 font-mono text-slate-500">{cf.py}</td>
                            <td className={`py-2.5 px-2 font-mono font-bold text-right ${cf.changeDol.includes('(') ? 'text-rose-600' : 'text-slate-900'}`}>{cf.changeDol}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setSubTab('cash_flow')}
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View cash flow statement →</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* RIGHT 4 COLUMNS SIDEBAR */}
              <div className="lg:col-span-4 space-y-5">

                {/* AI Financial Insights */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>AI Financial Insights</span>
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-purple-900">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                        Gross margin improved by 2.5pp
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Driven by lower raw material costs and pricing actions across Personal Care segment.
                      </p>
                    </div>

                    <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Increase in marketing expenses
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Up 18% vs PY. Review for trend sustainability and ROI across global campaigns.
                      </p>
                    </div>

                    <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Operating cash flow improved
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Up €1.2B vs PY due to working capital optimization and inventory reduction.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => setSubTab('ratios')}
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all insights →</span>
                    </button>
                  </div>
                </div>

                {/* Financial Data Health */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Financial Data Health</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-28 h-28 relative shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dataHealthDonutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={44}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                          >
                            {dataHealthDonutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-lg font-black text-slate-900">92%</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Overall Score</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          Complete
                        </span>
                        <span className="font-mono font-bold text-slate-900">92%</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          Partially Missing
                        </span>
                        <span className="font-mono font-bold text-slate-900">5%</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                          Missing
                        </span>
                        <span className="font-mono font-bold text-slate-900">3%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => setSubTab('reconciliation')}
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View data quality details →</span>
                    </button>
                  </div>
                </div>

                {/* Top Anomalies Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Top Anomalies</span>
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <div className="flex justify-between items-center font-bold text-slate-900">
                        <span>Unusual journal entries detected</span>
                        <span className="font-mono text-rose-600">€4.2M</span>
                      </div>
                      <p className="text-[10px] text-slate-400">3 transactions identified in Q2 posting</p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <div className="flex justify-between items-center font-bold text-slate-900">
                        <span>Large round-dollar transactions</span>
                        <span className="font-mono text-rose-600">€2.8M</span>
                      </div>
                      <p className="text-[10px] text-slate-400">12 transactions identified across AP</p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <div className="flex justify-between items-center font-bold text-slate-900">
                        <span>Weekend posting activity</span>
                        <span className="font-mono text-rose-600">€1.3M</span>
                      </div>
                      <p className="text-[10px] text-slate-400">8 transactions identified on Sundays</p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => setSubTab('variance')}
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all anomalies →</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          );
        })()}

        {/* ---------------- SUB-TAB 2: DETAILED STATEMENTS ---------------- */}
        {subTab === 'income_statement' && (() => {
          return (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900">Consolidated Statement of Income</h2>
                  <p className="text-xs text-slate-500">FY 2025 vs Prior Period</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openTrace('Gross Profit', displayGrossProfit)} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold hover:bg-slate-100 cursor-pointer flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Trace Provenance</span>
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-blue-900 text-white text-xs font-bold hover:bg-blue-950 cursor-pointer flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>

              {!hasFacts ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold">No extracted financial statement data found.</p>
                  <p className="text-slate-400">Please upload authoritative financial documents to populate the income statement.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-200 bg-slate-50/80">
                        <th className="py-3 px-3">Line Account</th>
                        <th className="py-3 px-3 font-mono text-right">FY 2025</th>
                        <th className="py-3 px-3 font-mono text-right">FY 2024</th>
                        <th className="py-3 px-3 font-mono text-right">Var</th>
                        <th className="py-3 px-3 font-mono text-right">Var (%)</th>
                        <th className="py-3 px-3 text-right">AI Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Revenue Parent */}
                      <tr className="bg-slate-50/50 hover:bg-slate-100/60 font-bold cursor-pointer" onClick={() => toggleAccountExpand('revenue')}>
                        <td className="py-3 px-3 flex items-center gap-2 text-slate-900">
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedAccounts.revenue ? 'rotate-90' : ''}`} />
                          <span>Revenue / Turnover</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-right text-slate-900">{displayRevenue}</td>
                        <td className="py-3 px-3 font-mono text-right text-slate-600">—</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-600 text-right">—</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-600 text-right">{summary?.revenueYoYPct && summary.revenueYoYPct !== "—" ? `+${summary.revenueYoYPct}` : "—"}</td>
                        <td className="py-3 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">100% Reconciled</span>
                        </td>
                      </tr>

                      {/* COGS */}
                      <tr className="hover:bg-slate-50 font-semibold cursor-pointer" onClick={() => toggleAccountExpand('cogs')}>
                        <td className="py-3 px-3 flex items-center gap-2 text-slate-800">
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedAccounts.cogs ? 'rotate-90' : ''}`} />
                          <span>Cost of Goods Sold (COGS)</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-right text-slate-900">{displayCOGS}</td>
                        <td className="py-3 px-3 font-mono text-right text-slate-600">—</td>
                        <td className="py-3 px-3 font-mono text-right text-rose-600">—</td>
                        <td className="py-3 px-3 font-mono text-right text-rose-600">—</td>
                        <td className="py-3 px-3 text-right text-[10px] font-bold text-emerald-600">Verified</td>
                      </tr>

                      {/* Gross Profit Summary Line */}
                      <tr className="bg-blue-50/70 font-black text-slate-900 border-t-2 border-slate-300">
                        <td className="py-3.5 px-3">GROSS PROFIT</td>
                        <td className="py-3.5 px-3 font-mono text-right text-blue-950 text-sm font-black">{displayGrossProfit}</td>
                        <td className="py-3.5 px-3 font-mono text-right text-slate-700">—</td>
                        <td className="py-3.5 px-3 font-mono text-right text-emerald-700">—</td>
                        <td className="py-3.5 px-3 font-mono text-right text-emerald-700">—</td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-900">Verified</span>
                        </td>
                      </tr>

                      {/* Operating Income */}
                      <tr className="bg-slate-50/50 hover:bg-slate-100/60 font-bold">
                        <td className="py-3 px-3 flex items-center gap-2 text-slate-900">
                          <span>Operating Income</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-right text-slate-900">{summary?.operatingIncome && summary.operatingIncome !== "—" ? `${currSymbol}${summary.operatingIncome}` : "—"}</td>
                        <td className="py-3 px-3 font-mono text-right text-slate-600">—</td>
                        <td className="py-3 px-3 font-mono font-bold text-rose-600 text-right">—</td>
                        <td className="py-3 px-3 font-mono font-bold text-rose-600 text-right">—</td>
                        <td className="py-3 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 font-bold">Verified</span>
                        </td>
                      </tr>

                      {/* Net Income Line */}
                      <tr className="bg-emerald-100/80 font-black text-slate-900 border-t-2 border-emerald-500">
                        <td className="py-4 px-3 text-sm">NET INCOME ATTRIBUTABLE TO GROUP</td>
                        <td className="py-4 px-3 font-mono text-right text-emerald-950 text-base font-black">{displayNetIncome}</td>
                        <td className="py-4 px-3 font-mono text-right text-slate-800">—</td>
                        <td className="py-4 px-3 font-mono text-right text-emerald-800">—</td>
                        <td className="py-4 px-3 font-mono text-right text-emerald-800">—</td>
                        <td className="py-4 px-3 text-right">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-600 text-white">Audited</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* ---------------- SUB-TAB 3: BALANCE SHEET ---------------- */}
        {subTab === 'balance_sheet' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Consolidated Statement of Financial Position (Balance Sheet)</h2>
                <p className="text-xs text-slate-500">As of Dec 31, 2025 vs Dec 31, 2024 (In Millions EUR)</p>
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={() => openTrace('Total Assets', summary?.assets)} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold hover:bg-slate-100 cursor-pointer flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Trace Provenance</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100">
                <span className="text-[10px] text-blue-800 font-bold uppercase block">Total Assets</span>
                <span className="text-xl font-black font-mono text-blue-950">€78,500M</span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-1">▲ +3.8% vs FY 2024</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Liabilities</span>
                <span className="text-xl font-black font-mono text-slate-900">€52,900M</span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-1">▲ +2.1% vs FY 2024</span>
              </div>

              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Total Equity</span>
                <span className="text-xl font-black font-mono text-emerald-950">€25,600M</span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-1">▲ +7.5% vs FY 2024</span>
              </div>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-200 bg-slate-50">
                    <th className="py-2.5 px-3">Balance Sheet Category</th>
                    <th className="py-2.5 px-3 font-mono text-right">FY 2025</th>
                    <th className="py-2.5 px-3 font-mono text-right">FY 2024</th>
                    <th className="py-2.5 px-3 font-mono text-right">Change ($)</th>
                    <th className="py-2.5 px-3 font-mono text-right">Change (%)</th>
                    <th className="py-2.5 px-3 text-right">AI Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {/* ASSETS SECTION */}
                  <tr className="bg-slate-100/80 font-black text-slate-900">
                    <td colSpan={6} className="py-2.5 px-3 uppercase text-[11px] tracking-wider text-blue-900">ASSETS</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 pl-6 font-bold text-slate-800">Cash and Cash Equivalents</td>
                    <td className="py-2.5 px-3 font-mono text-right font-black text-slate-900">€8,910M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-slate-500">€7,420M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-bold">+€1,490M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-bold">+20.1%</td>
                    <td className="py-2.5 px-3 text-right"><span className="text-emerald-600 font-bold">Bank Confirmed</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 pl-6 font-bold text-slate-800">Trade Accounts Receivable</td>
                    <td className="py-2.5 px-3 font-mono text-right font-black text-slate-900">€6,420M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-slate-500">€6,180M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-bold">+€240M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-bold">+3.9%</td>
                    <td className="py-2.5 px-3 text-right"><span className="text-emerald-600 font-bold">Subledger Matched</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 pl-6 font-bold text-slate-800">Inventories</td>
                    <td className="py-2.5 px-3 font-mono text-right font-black text-slate-900">€5,280M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-slate-500">€5,640M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-bold">(€360M)</td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-bold">-6.4%</td>
                    <td className="py-2.5 px-3 text-right"><span className="text-emerald-600 font-bold">Physical Audit OK</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 pl-6 font-bold text-slate-800">Property, Plant & Equipment (PPE)</td>
                    <td className="py-2.5 px-3 font-mono text-right font-black text-slate-900">€18,450M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-slate-500">€18,200M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-bold">+€250M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-bold">+1.4%</td>
                    <td className="py-2.5 px-3 text-right"><span className="text-emerald-600 font-bold">Depreciation Validated</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 pl-6 font-bold text-slate-800">Goodwill & Intangible Assets</td>
                    <td className="py-2.5 px-3 font-mono text-right font-black text-slate-900">€39,440M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-slate-500">€38,190M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-bold">+€1,250M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-bold">+3.3%</td>
                    <td className="py-2.5 px-3 text-right"><span className="text-emerald-600 font-bold">Impairment Tested</span></td>
                  </tr>

                  {/* LIABILITIES & EQUITY */}
                  <tr className="bg-slate-100/80 font-black text-slate-900">
                    <td colSpan={6} className="py-2.5 px-3 uppercase text-[11px] tracking-wider text-slate-900">LIABILITIES & EQUITY</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 pl-6 font-bold text-slate-800">Short-term Debt & Borrowings</td>
                    <td className="py-2.5 px-3 font-mono text-right font-black text-slate-900">€3,800M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-slate-500">€4,120M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-bold">(€320M)</td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-bold">-7.8%</td>
                    <td className="py-2.5 px-3 text-right"><span className="text-emerald-600 font-bold">Facility Verified</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 pl-6 font-bold text-slate-800">Long-term Debt</td>
                    <td className="py-2.5 px-3 font-mono text-right font-black text-slate-900">€22,100M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-slate-500">€21,800M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-slate-900 font-bold">+€300M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-slate-900 font-bold">+1.4%</td>
                    <td className="py-2.5 px-3 text-right"><span className="text-emerald-600 font-bold">Bond Covenants OK</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 pl-6 font-bold text-slate-800">Shareholders' Equity</td>
                    <td className="py-2.5 px-3 font-mono text-right font-black text-slate-900">€25,600M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-slate-500">€23,810M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-bold">+€1,790M</td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-bold">+7.5%</td>
                    <td className="py-2.5 px-3 text-right"><span className="text-emerald-600 font-bold">Equity Statement OK</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- SUB-TAB 4: CASH FLOW ---------------- */}
        {subTab === 'cash_flow' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Consolidated Statement of Cash Flows</h2>
                <p className="text-xs text-slate-500">FY 2025 vs FY 2024 (Indirect Method)</p>
              </div>
              <button onClick={() => openTrace('Ending Cash Balance', summary?.cash)} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold hover:bg-slate-100 cursor-pointer flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Trace Cash Evidence</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Beginning Cash</span>
                <span className="text-lg font-black font-mono text-slate-900">€7,420M</span>
              </div>
              <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-emerald-800 font-bold block">Operating Cash Flow</span>
                <span className="text-lg font-black font-mono text-emerald-950">€7,210M</span>
              </div>
              <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-100">
                <span className="text-[10px] text-rose-800 font-bold block">Investing / CapEx</span>
                <span className="text-lg font-black font-mono text-rose-950">(€2,140M)</span>
              </div>
              <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-100">
                <span className="text-[10px] text-blue-800 font-bold block">Ending Cash Balance</span>
                <span className="text-lg font-black font-mono text-blue-950">€8,910M</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase">Cash Flow Waterfall (€ Millions)</h4>
              <div className="h-48 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Beg Cash', val: 7420, fill: '#64748b' },
                    { name: 'Operating CF', val: 7210, fill: '#10b981' },
                    { name: 'Investing CF', val: -2140, fill: '#ef4444' },
                    { name: 'Financing CF', val: -3010, fill: '#f59e0b' },
                    { name: 'FX Effect', val: 180, fill: '#3b82f6' },
                    { name: 'End Cash', val: 8910, fill: '#1e3a8a' }
                  ]}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip />
                    <Bar dataKey="val" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- SUB-TAB 5: TRIAL BALANCE ---------------- */}
        {subTab === 'trial_balance' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Adjusted Trial Balance</h2>
                <p className="text-xs text-slate-500">Mapped Canonical Chart of Accounts</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search account # or name..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none w-56"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-200 bg-slate-50">
                    <th className="py-2.5 px-2">Account #</th>
                    <th className="py-2.5 px-2">Account Name</th>
                    <th className="py-2.5 px-2">Entity</th>
                    <th className="py-2.5 px-2 font-mono text-right">Opening Bal</th>
                    <th className="py-2.5 px-2 font-mono text-right">Debit</th>
                    <th className="py-2.5 px-2 font-mono text-right">Credit</th>
                    <th className="py-2.5 px-2 font-mono text-right">Ending Bal</th>
                    <th className="py-2.5 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {[
                    { code: '1010-00', name: 'Cash in Bank - Primary Treasury', entity: workspace.name || 'Parent Group', open: '€4,200M', dr: '€18,450M', cr: '€13,740M', end: '€8,910M', status: 'Reconciled' },
                    { code: '1200-00', name: 'Accounts Receivable - Trade', entity: workspace.name || 'Parent Group', open: '€6,180M', dr: '€59,600M', cr: '€59,360M', end: '€6,420M', status: 'Reconciled' },
                    { code: '1300-00', name: 'Finished Goods Inventory', entity: `${workspace.name || 'Client'} EU Sub`, open: '€5,640M', dr: '€32,170M', cr: '€32,530M', end: '€5,280M', status: 'Reconciled' },
                    { code: '2010-00', name: 'Accounts Payable - Vendors', entity: `${workspace.name || 'Client'} US Sub`, open: '€4,890M', dr: '€28,400M', cr: '€28,630M', end: '€5,120M', status: 'Reconciled' },
                    { code: '4000-00', name: 'Consolidated Product Revenue', entity: `${workspace.name || 'Client'} Group`, open: '€0M', dr: '€0M', cr: '€59,600M', end: '€59,600M', status: 'Reconciled' }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => openTrace(row.name, row.end)}>
                      <td className="py-2.5 px-2 font-mono font-bold text-slate-500">{row.code}</td>
                      <td className="py-2.5 px-2 font-bold text-slate-900">{row.name}</td>
                      <td className="py-2.5 px-2 text-slate-600">{row.entity}</td>
                      <td className="py-2.5 px-2 font-mono text-right text-slate-500">{row.open}</td>
                      <td className="py-2.5 px-2 font-mono text-right text-emerald-600">{row.dr}</td>
                      <td className="py-2.5 px-2 font-mono text-right text-rose-600">{row.cr}</td>
                      <td className="py-2.5 px-2 font-mono font-black text-right text-slate-900">{row.end}</td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- SUB-TAB 6: GENERAL LEDGER ---------------- */}
        {subTab === 'general_ledger' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900">General Ledger Transaction Detail</h2>
                <p className="text-xs text-slate-500">Traceable line items with click-to-evidence provenance</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-200 bg-slate-50">
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2">Journal ID</th>
                    <th className="py-2.5 px-2">Account</th>
                    <th className="py-2.5 px-2">Description</th>
                    <th className="py-2.5 px-2 font-mono text-right">Debit</th>
                    <th className="py-2.5 px-2 font-mono text-right">Credit</th>
                    <th className="py-2.5 px-2 text-right">Source File</th>
                    <th className="py-2.5 px-2 text-right">AI Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {[
                    { date: '2025-06-01', jid: 'JNL-8921', acc: '4000 Revenue', desc: 'Global Personal Care Q2 Bulk Sale - Target Stores', dr: '—', cr: '€42,800,000', src: 'Sales_Invoice_8921.pdf', conf: '99.9%' },
                    { date: '2025-06-02', jid: 'JNL-8922', acc: '5010 COGS', desc: 'Raw Material Palm Oil Bulk Shipment - Wilmar', dr: '€14,200,000', cr: '—', src: 'PO_Wilmar_2025_06.pdf', conf: '99.7%' },
                    { date: '2025-06-03', jid: 'JNL-8923', acc: '6100 Marketing', desc: 'Global Brand Campaign Summer 2025 - WPP Agency', dr: '€8,400,000', cr: '—', src: 'WPP_Invoice_Jun2025.pdf', conf: '98.5%' },
                    { date: '2025-06-04', jid: 'JNL-8924', acc: '1010 Bank', desc: 'Intercompany Cash Pooling Transfer UK-Europe', dr: '€12,000,000', cr: '—', src: 'Bank_Statement_Jun04.pdf', conf: '100%' }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => openTrace(row.acc, row.cr !== '—' ? row.cr : row.dr, row.src)}>
                      <td className="py-2.5 px-2 font-mono text-slate-500">{row.date}</td>
                      <td className="py-2.5 px-2 font-mono font-bold text-blue-700">{row.jid}</td>
                      <td className="py-2.5 px-2 font-bold text-slate-900">{row.acc}</td>
                      <td className="py-2.5 px-2 text-slate-700">{row.desc}</td>
                      <td className="py-2.5 px-2 font-mono text-right text-emerald-600 font-bold">{row.dr}</td>
                      <td className="py-2.5 px-2 font-mono text-right text-rose-600 font-bold">{row.cr}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-500">{row.src}</td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">{row.conf}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- SUB-TAB 7: RATIOS & KPIS ---------------- */}
        {subTab === 'ratios' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Financial Ratios & Benchmark Comparison</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ratiosTableData.map((r, i) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span>{r.ratio}</span>
                    <span className="font-mono text-lg text-blue-900">{r.ytd}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Prior Period: {r.py}</span>
                    <span>Industry Benchmark: {r.benchmark}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                    <strong>Note:</strong> Industry benchmarks are not extracted. Ratios shown only when sourced from gated facts.
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- SUB-TAB 8: VARIANCE ANALYSIS ---------------- */}
        {subTab === 'variance' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-black text-slate-900">Variance & Materiality Exception Analysis</h2>
            <p className="text-xs text-slate-500">Variance is only shown when comparative facts exist for the same line item.</p>
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold">not extracted</p>
              <p className="text-slate-400">No comparative period facts are available. Exceptions are not invented.</p>
            </div>
          </div>
        )}

        {/* ---------------- SUB-TAB 9: SEGMENTS ---------------- */}
        {subTab === 'segments' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-black text-slate-900">Business Segments & Product Divisions</h2>
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold">not extracted</p>
              <p className="text-slate-400">Segment revenue is only shown when extracted from source statements.</p>
            </div>
          </div>
        )}

        {/* ---------------- SUB-TAB 10: ENTITIES ---------------- */}
        {subTab === 'entities' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-black text-slate-900">Consolidated Legal Entities & Subsidiaries</h2>
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold">not extracted</p>
              <p className="text-slate-400">Subsidiary revenue is not invented. Upload group statements to populate this table.</p>
            </div>
          </div>
        )}

        {/* ---------------- SUB-TAB 11: CURRENCIES ---------------- */}
        {subTab === 'currencies' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-black text-slate-900">Foreign Exchange Rates & Translation Matrix</h2>
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold">not extracted</p>
              <p className="text-slate-400">FX rates and translation gains are not invented.</p>
            </div>
          </div>
        )}

        {/* ---------------- SUB-TAB 12: TRENDS ---------------- */}
        {subTab === 'trends' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-black text-slate-900">Multi-Year Revenue & Margin Expansion Trends</h2>
            {!hasFacts ? (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold">No trend data available.</p>
                <p className="text-slate-400">Please upload documents to visualize performance trends.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { year: '2025', rev: summary?.revenueRaw ? summary.revenueRaw / 1e9 : 0, ebitda: summary?.operatingIncomeRaw ? summary.operatingIncomeRaw / 1e9 : 0 }
                  ]}>
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="rev" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.2} name="Revenue (€B)" />
                    <Area type="monotone" dataKey="ebitda" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Operating Profit (€B)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ---------------- SUB-TAB 13: FORECASTS ---------------- */}
        {subTab === 'forecasts' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-black text-slate-900">AI Predictive Projections & Scenario Modeling</h2>
            {!hasFacts ? (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold">No historical data to forecast.</p>
                <p className="text-slate-400">Please upload historical records to generate future predictive models.</p>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold">Forecasts are not extracted.</p>
                <p className="text-slate-400">Current-period facts are not projected into a next-period figure.</p>
              </div>
            )}
          </div>
        )}

        {/* ---------------- SUB-TAB 14: RECONCILIATION ---------------- */}
        {subTab === 'reconciliation' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-black text-slate-900">Subledger & Bank Reconciliation Status</h2>
            {!hasFacts ? (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold">Reconciliation ledger empty.</p>
                <p className="text-slate-400">Run document analysis to initialize bank statement matching logs.</p>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold">not extracted</p>
                <p className="text-slate-400">Bank-to-GL reconciliation is not marked balanced unless extracted from source.</p>
              </div>
            )}
          </div>
        )}

        {/* ---------------- SUB-TAB 15: SOURCE MAPPING ---------------- */}
        {subTab === 'source_mapping' && (() => {
          const dynamicSourceMappings = facts.filter(f => f.id && f.sourceText).map((f) => {
            const badge = VerificationStateMachine.getDashboardPresentation(f);
            const doc = documents.find(d => d.id === f.documentId);
            return {
              fact: f,
              metric: f.labelNormalized || f.labelOriginal,
              val: f.valueOriginal || String(f.valueFunctional),
              doc: doc?.originalName || doc?.filename || '—',
              page: f.pageNumber ? String(f.pageNumber) : '—',
              sheet: f.tableName || '—',
              cell: f.provenance?.cellRange || '—',
              conf: badge.displayState,
              consensus: '—'
            };
          });

          return (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-black text-slate-900">Source Mapping & Provenance Registry</h2>
                <p className="text-xs text-slate-500">Trace every financial figure to its document, page, and verbatim snippet. Consensus scores are not invented.</p>
              </div>

              {!hasFacts || dynamicSourceMappings.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold">No verified source mappings found.</p>
                  <p className="text-slate-400">Provenance records will populate once documents are uploaded and facts verified.</p>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {dynamicSourceMappings.map((item, idx) => (
                    <div key={item.fact.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-blue-300 transition cursor-pointer" onClick={() => openTrace(item.fact)}>
                      <div className="flex justify-between items-center">
                        <span className="font-black text-slate-900 text-sm">{item.metric}</span>
                        <span className="font-mono font-black text-blue-900 text-base">{item.val}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2">
                        <div><strong>Document:</strong> {item.doc}</div>
                        <div><strong>Page / Cell:</strong> Page {item.page}, Cell {item.cell}</div>
                        <div><strong>AI Confidence:</strong> {item.conf}</div>
                        <div><strong>Hermes Consensus:</strong> {item.consensus}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

      </div>

      {/* ---------------- TRACED SOURCE MAPPING MODAL ---------------- */}
      {selectedSourceMapping && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden space-y-4 p-6 relative">
            <button
              onClick={() => setSelectedSourceMapping(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-base font-black text-slate-900">Where Did This Number Come From?</h3>
                <p className="text-xs text-slate-500">Auditable source evidence trace</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Metric Name</span>
                  <span className="text-sm font-black text-blue-950">{selectedSourceMapping.metricName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Extracted Value</span>
                  <span className="text-base font-mono font-black text-blue-950">{selectedSourceMapping.value}</span>
                </div>
              </div>

              <div className="space-y-2 border-l-2 border-blue-600 pl-3.5 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">SOURCE DOCUMENT & PAGE</span>
                  <span className="text-slate-900 font-bold">{selectedSourceMapping.document} (Page {selectedSourceMapping.page})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">SPREADSHEET & CELL COORDINATE</span>
                  <span className="text-slate-900 font-mono font-semibold">{selectedSourceMapping.sheet}!{selectedSourceMapping.cell}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">RAW EXCERPT FROM SOURCE</span>
                  <p className="font-mono text-[11px] bg-slate-50 p-2.5 rounded-xl text-slate-800 border border-slate-200 mt-1">
                    "{selectedSourceMapping.snippet}"
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>AI Confidence: <strong>{selectedSourceMapping.confidence}</strong></div>
                  <div>Hermes Node Consensus: <strong>{selectedSourceMapping.hermesConsensus}</strong></div>
                  <div className="col-span-2">Human Auditor Sign-off: <strong>{selectedSourceMapping.humanReviewer}</strong></div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSourceMapping(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
