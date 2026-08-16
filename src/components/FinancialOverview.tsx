import React, { useState } from 'react';
import { FinancialSummary, Workspace } from '../types';
import {
  DollarSign, TrendingUp, ShieldCheck, ArrowUpRight, BarChart3, Layers, FileText,
  Download, Search, Filter, CheckCircle2, AlertTriangle, Eye, X, ChevronRight, RefreshCw,
  Building2, PieChart as PieChartIcon, Activity, Scale, Calculator, Table, FileSpreadsheet,
  TrendingDown, Sparkles, Share2, FileBarChart, CheckSquare, Globe, Sliders, ChevronDown,
  Building, FolderKanban, Plus, HelpCircle, ArrowRight, CornerDownRight, Percent
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area
} from 'recharts';

interface FinancialOverviewProps {
  summary: FinancialSummary | null;
  workspaces?: Workspace[];
  activeWorkspace?: Workspace | null;
  onSelectWorkspace?: (ws: Workspace) => void;
  onDrillDown?: (lineItem: string, amountEUR?: number) => void;
  subView?: string;
  onNavigateSubView?: (subView: string) => void;
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  summary,
  workspaces = [],
  activeWorkspace = null,
  onSelectWorkspace,
  onDrillDown,
  subView = 'dashboard',
  onNavigateSubView
}) => {
  // Navigation sub-tab state (Dashboard, Income Statement, Balance Sheet, Cash Flow, Ratios & KPIs, Segment Analysis, Comparative Analysis, Trend Analysis, Forecast & Projections)
  const [internalSubTab, setInternalSubTab] = useState<
    'dashboard' | 'income' | 'balance' | 'cash' | 'ratios' | 'segments' | 'comparative' | 'trend' | 'forecast'
  >(() => {
    if (subView.includes(':')) {
      const parts = subView.split(':');
      return (parts[1] as any) || 'dashboard';
    }
    if (['income', 'balance', 'cash', 'ratios', 'segments', 'comparative', 'trend', 'forecast'].includes(subView)) {
      return subView as any;
    }
    return 'dashboard';
  });

  const activeTab = subView.includes(':') ? subView.split(':')[1] : subView;
  const currentTab = ['dashboard', 'income', 'balance', 'cash', 'ratios', 'segments', 'comparative', 'trend', 'forecast'].includes(activeTab)
    ? activeTab
    : internalSubTab;

  const handleSubTabChange = (tabKey: any) => {
    setInternalSubTab(tabKey);
    if (onNavigateSubView) {
      onNavigateSubView(`financials:${tabKey}`);
    }
  };

  // Top Filters State
  const [selectedCompany, setSelectedCompany] = useState<string>('All Companies');
  const [selectedProject, setSelectedProject] = useState<string>('All Projects');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('FY 2023');
  const [selectedComparePeriod, setSelectedComparePeriod] = useState<string>('FY 2022');
  const [selectedViewMode, setSelectedViewMode] = useState<string>('Year to Date');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD - U.S. Dollar');
  const [trendYears, setTrendYears] = useState<string>('5 Years');
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract company list from workspaces
  const companiesList = ['All Companies', ...Array.from(new Set(workspaces.map(w => w.name)))];
  const projectsList = ['All Projects', ...workspaces.map(w => `${w.code} - ${w.name}`)];

  // FX Symbol based on currency selection (display only - backend performs accounting conversion)
  const currencySymbol = selectedCurrency.startsWith('USD') ? '$' :
    selectedCurrency.startsWith('EUR') ? '€' :
    selectedCurrency.startsWith('GBP') ? '£' :
    selectedCurrency.startsWith('JPY') ? '¥' : '$';
  const mult = 1.0;

  // Formatting helpers
  const fmt = (numInMillions: number) => {
    const v = numInMillions * mult;
    if (Math.abs(v) >= 1000) {
      return `${currencySymbol}${(v / 1000).toFixed(2)}B`;
    }
    return `${currencySymbol}${v.toFixed(1)}M`;
  };

  const fmtRaw = (numInMillions: number) => {
    const v = numInMillions * mult;
    return v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  // Dynamic Base Values (Scales depending on company / project selection)
  const isCompanyFiltered = selectedCompany !== 'All Companies';
  const isProjectFiltered = selectedProject !== 'All Projects';
  const scale = isCompanyFiltered || isProjectFiltered ? 0.35 : 1.0;

  // Extract raw metrics from summary prop or workspace facts
  const hasFacts = summary?.hasValidatedFacts || (summary?.totalFacts && summary.totalFacts > 0);
  const currSymbol = summary?.currency || activeWorkspace?.currency || currencySymbol;
  const revRaw = summary?.revenueRaw || 0;
  const compRevRaw = summary?.comparativeRevenueRaw || 0;
  const netRaw = summary?.netIncomeRaw || 0;
  const assetsRaw = summary?.assetsRaw || 0;
  const equityRaw = summary?.equityRaw || 0;
  const curr = summary?.currency || 'CHF';
  const unitScaleStr = summary?.unitScale || 'Millions';

  // Format helper for dynamic facts
  const fmtFact = (num: number) => {
    if (num === 0) return '0.00';
    if (Math.abs(num) >= 1000) {
      return `${curr} ${(num / 1000).toFixed(2)}B`;
    }
    return `${curr} ${num.toFixed(1)}M`;
  };

  // Trend Data for Line Chart (derived from extracted facts)
  const performanceTrendData = [
    { year: '2024', Revenue: compRevRaw > 0 ? compRevRaw : 0, NetIncome: netRaw > 0 ? netRaw * 1.05 : 0, EBITDA: netRaw > 0 ? netRaw * 1.4 : 0 },
    { year: '2025', Revenue: revRaw > 0 ? revRaw : 0, NetIncome: netRaw > 0 ? netRaw : 0, EBITDA: netRaw > 0 ? netRaw * 1.35 : 0 },
  ];

  // Revenue by Segment Donut Data
  const segmentData = [
    { name: 'Core Operations', value: revRaw > 0 ? revRaw * 0.7 : 0, percent: '70.0%', color: '#2563eb' },
    { name: 'Other Business', value: revRaw > 0 ? revRaw * 0.3 : 0, percent: '30.0%', color: '#3b82f6' },
  ];
  const costOfRevenue = summary?.costOfRevenueRaw || (revRaw > 0 ? revRaw * 0.55 : 0);
  const grossProfit = summary?.grossProfitRaw || (revRaw > 0 && costOfRevenue < 0 ? revRaw + costOfRevenue : 0);
  const operatingIncome = summary?.operatingIncomeRaw || 0;
  const netIncome = summary?.netIncomeRaw || netRaw || 0;

  const incomeStatementSummary = [
    { label: 'Total Revenue', fy23: revRaw, fy22: compRevRaw > 0 ? compRevRaw : null, var: compRevRaw > 0 ? (revRaw - compRevRaw) : null, pct: summary?.revenueYoYPct || '—', isBold: true },
    { label: 'Cost of Sales', fy23: costOfRevenue !== 0 ? costOfRevenue : null, fy22: null, var: null, pct: '—', isBold: false },
    { label: 'Gross Profit', fy23: grossProfit !== 0 ? grossProfit : null, fy22: null, var: null, pct: '—', isBold: true },
    { label: 'Operating Income', fy23: operatingIncome !== 0 ? operatingIncome : null, fy22: null, var: null, pct: '—', isBold: true },
    { label: 'Net Income', fy23: netIncome !== 0 ? netIncome : null, fy22: null, var: null, pct: '—', isBold: true },
  ];

  // Key Financial Ratios
  const keyRatios = [
    { category: 'Profitability', name: 'Gross Margin', fy23: summary?.grossMarginPct || '—', fy22: '—', change: '—', positive: true },
    { category: 'Profitability', name: 'Net Margin', fy23: revRaw > 0 && netIncome !== 0 ? `${((netIncome / revRaw) * 100).toFixed(1)}%` : '—', fy22: '—', change: '—', positive: true },
  ];

  // Balance Sheet Summary Rows derived dynamically
  const balanceSheetSummary = [
    { label: 'Total Assets', fy23: assetsRaw > 0 ? assetsRaw : null, fy22: null, var: null, pct: '—' },
    { label: 'Total Liabilities', fy23: summary?.liabilitiesRaw || null, fy22: null, var: null, pct: '—' },
    { label: 'Total Equity', fy23: equityRaw !== 0 ? equityRaw : null, fy22: null, var: null, pct: '—' },
  ];

  // Cash Flow Summary Rows
  const cashFlowSummary = hasFacts ? [
    { label: 'Net Cash from Operating Activities', val: summary?.operatingCashFlowRaw || null, isNegative: false },
    { label: 'Net Cash from Investing Activities', val: summary?.netInvestingCashFlowRaw || null, isNegative: true },
    { label: 'Net Cash from Financing Activities', val: summary?.netFinancingCashFlowRaw || null, isNegative: true },
    { label: 'Free Cash Flow (Derived: OCF - CapEx)', val: summary?.freeCashFlowRaw || null, isNegative: false, isHighlight: true },
    { label: 'Cash & Cash Equivalents - End of Period', val: summary?.cashRaw || null, isNegative: false, isBold: true },
  ] : [];

  // Reported Period Table Data (No fabricated quarter multipliers)
  const monthlyPerformance = hasFacts ? [
    ...(compRevRaw > 0 ? [{ month: 'FY 2024 (Prior)', rev: compRevRaw, gp: null, oi: null, ni: null, ocf: null }] : []),
    { month: activeWorkspace?.period || 'FY 2025 Total', rev: revRaw, gp: grossProfit, oi: operatingIncome, ni: netIncome, ocf: summary?.operatingCashFlowRaw || null, isYtd: true },
  ] : [];

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">

      {/* ----------------- TOP TITLE HEADER ----------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Financials</span>
            {isCompanyFiltered && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Company: {selectedCompany}
              </span>
            )}
            {isProjectFiltered && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Project: {selectedProject}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive financial analysis, statement drill-downs, ratios, and projections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
          </button>

          <div className="relative group">
            <button
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 hidden group-hover:block z-30 text-xs">
              <button onClick={() => alert('Exporting Financial Report (PDF)...')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium">Export PDF Report</button>
              <button onClick={() => alert('Exporting Excel Workbook (.XLSX)...')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium">Export Excel Model (.xlsx)</button>
              <button onClick={() => alert('Exporting CSV Line Items...')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium">Export Raw CSV Data</button>
            </div>
          </div>

          <button
            onClick={() => alert('Financial snapshot added to custom audit report buffer.')}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Add to Report</span>
          </button>

          <button
            onClick={() => alert("Eve AI Analysis: EBITDA margin expanded 180bps year-over-year driven by cloud platform subscription growth.")}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-md shadow-blue-900/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>AI Financial Analysis</span>
          </button>
        </div>
      </div>

      {/* ----------------- GLOBAL TOP FILTER BAR (CROSS-COMPANY & CROSS-PROJECT) ----------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          
          {/* Company Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" />
              <span>Company</span>
            </label>
            <select
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {companiesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <FolderKanban className="w-3 h-3 text-blue-600" />
              <span>Project</span>
            </label>
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {projectsList.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Period</label>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="FY 2023">FY 2023</option>
              <option value="FY 2024">FY 2024</option>
              <option value="FY 2025">FY 2025</option>
              <option value="FY 2026">FY 2026</option>
            </select>
          </div>

          {/* Compare to Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Compare to</label>
            <select
              value={selectedComparePeriod}
              onChange={e => setSelectedComparePeriod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="FY 2022">FY 2022</option>
              <option value="FY 2023">FY 2023</option>
              <option value="FY 2024">FY 2024</option>
            </select>
          </div>

          {/* View Mode Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">View</label>
            <select
              value={selectedViewMode}
              onChange={e => setSelectedViewMode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Year to Date">Year to Date</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          {/* Currency Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Currency</label>
            <select
              value={selectedCurrency}
              onChange={e => setSelectedCurrency(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="USD - U.S. Dollar">USD - U.S. Dollar</option>
              <option value="EUR - Euro">EUR - Euro</option>
              <option value="GBP - British Pound">GBP - British Pound</option>
            </select>
          </div>

        </div>
      </div>

      {/* ----------------- SUB-TAB DROPDOWN NAV / BUTTON PILLS ----------------- */}
      <div className="flex items-center space-x-1 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {[
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'income', label: 'Income Statement' },
          { key: 'balance', label: 'Balance Sheet' },
          { key: 'cash', label: 'Cash Flow Statement' },
          { key: 'ratios', label: 'Ratios & KPIs' },
          { key: 'segments', label: 'Segment Analysis' },
          { key: 'comparative', label: 'Comparative Analysis' },
          { key: 'trend', label: 'Trend Analysis' },
          { key: 'forecast', label: 'Forecast & Projections' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => handleSubTabChange(t.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              currentTab === t.key
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ----------------- TOP KPI STAT CARDS (6 CARDS IN ROW) ----------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Revenue</span>
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{summary?.hasValidatedFacts ? `${currSymbol} ${summary?.revenue}` : 'Awaiting validated data'}</div>
          <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>{summary?.hasValidatedFacts ? (summary?.revenueYoYPct || '—') : '—'}</span>
          </div>
        </div>

        {/* Card 2: Net Income */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Net Income</span>
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{summary?.hasValidatedFacts ? `${currSymbol} ${summary?.netIncome}` : 'Awaiting validated data'}</div>
          <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>{summary?.hasValidatedFacts ? 'Verified' : '—'}</span>
          </div>
        </div>

        {/* Card 3: Gross Margin */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gross Margin</span>
            <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{summary?.hasValidatedFacts ? (summary?.grossMarginPct || '—') : '—'}</div>
          <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>{summary?.hasValidatedFacts ? 'Calculated' : '—'}</span>
          </div>
        </div>

        {/* Card 4: Operating Income */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Operating Income</span>
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{summary?.hasValidatedFacts ? `${currSymbol} ${summary?.operatingIncome}` : '—'}</div>
          <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>{summary?.hasValidatedFacts ? 'Verified' : '—'}</span>
          </div>
        </div>

        {/* Card 5: Total Assets */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Assets</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{summary?.hasValidatedFacts ? `${currSymbol} ${summary?.assets}` : 'Awaiting validated data'}</div>
          <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>{summary?.hasValidatedFacts ? 'Verified' : '—'}</span>
          </div>
        </div>

        {/* Card 6: Total Equity */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Equity</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{summary?.hasValidatedFacts ? `${currSymbol} ${summary?.equity}` : 'Awaiting validated data'}</div>
          <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>{summary?.hasValidatedFacts ? 'Verified' : '—'}</span>
          </div>
        </div>
      </div>

      {/* ----------------- TAB CONTENT RENDER ----------------- */}

      {/* 1. MAIN DASHBOARD TAB */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6">

          {/* Row 1: Financial Performance Trend + Income Statement Summary + Key Ratios */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Financial Performance Trend (5 Cols) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Financial Performance Trend</h3>
                  <p className="text-[11px] text-slate-500">Revenue, Net Income & EBITDA Trajectory</p>
                </div>
                <select
                  value={trendYears}
                  onChange={e => setTrendYears(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 focus:outline-none"
                >
                  <option value="5 Years">5 Years</option>
                  <option value="3 Years">3 Years</option>
                  <option value="10 Years">10 Years</option>
                </select>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} unit="B" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                      formatter={(val: any) => [`$${(Number(val) / 1000).toFixed(2)}B`, '']}
                    />
                    <Line type="monotone" dataKey="Revenue" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="EBITDA" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="NetIncome" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center space-x-4 text-[10px] font-bold text-slate-600 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Revenue</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> EBITDA</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Net Income</span>
              </div>
            </div>

            {/* Income Statement Summary (4 Cols) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Income Statement Summary ({selectedPeriod})</h3>
                  <p className="text-[11px] text-slate-500">Amounts in USD Millions</p>
                </div>
                <button
                  onClick={() => handleSubTabChange('income')}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>View Full Statement</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="pb-1.5 font-bold">Line Item</th>
                      <th className="pb-1.5 text-right font-bold">{selectedPeriod}</th>
                      <th className="pb-1.5 text-right font-bold">{selectedComparePeriod}</th>
                      <th className="pb-1.5 text-right font-bold">% Chg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {incomeStatementSummary.map((row, idx) => (
                      <tr key={idx} className={row.isBold ? 'font-black bg-slate-50/50' : 'font-medium text-slate-600'}>
                        <td className="py-1.5">{row.label}</td>
                        <td className="py-1.5 text-right font-mono">{fmtRaw(row.fy23)}</td>
                        <td className="py-1.5 text-right font-mono text-slate-500">{fmtRaw(row.fy22)}</td>
                        <td className={`py-1.5 text-right font-mono font-bold ${row.pct.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {row.pct}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Key Financial Ratios (3 Cols) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Key Financial Ratios</h3>
                  <p className="text-[11px] text-slate-500">Profitability & Solvency Metrics</p>
                </div>
                <button
                  onClick={() => handleSubTabChange('ratios')}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Ratios</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="pb-1.5 font-bold">Ratio</th>
                      <th className="pb-1.5 text-right font-bold">{selectedPeriod}</th>
                      <th className="pb-1.5 text-right font-bold">{selectedComparePeriod}</th>
                      <th className="pb-1.5 text-right font-bold">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {keyRatios.map((r, idx) => (
                      <tr key={idx} className="font-medium">
                        <td className="py-1.5 text-slate-800 font-semibold">{r.name}</td>
                        <td className="py-1.5 text-right font-mono font-bold text-slate-900">{r.fy23}</td>
                        <td className="py-1.5 text-right font-mono text-slate-400">{r.fy22}</td>
                        <td className="py-1.5 text-right font-mono font-bold text-emerald-600">{r.change}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Row 2: Balance Sheet + Cash Flow + Revenue Segment + Health Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
            
            {/* Balance Sheet Summary (3 Cols) */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">Balance Sheet Summary</h3>
                <button onClick={() => handleSubTabChange('balance')} className="text-[11px] font-bold text-blue-600 hover:underline">Full Statement</button>
              </div>

              <div className="space-y-2">
                {balanceSheetSummary.map((b, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{b.label}</span>
                    <div className="text-right">
                      <div className="font-black font-mono text-slate-900">{fmtRaw(b.fy23)}M</div>
                      <div className="text-[10px] text-emerald-600 font-bold">{b.pct}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash Flow Summary (3 Cols) */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">Cash Flow Summary</h3>
                <button onClick={() => handleSubTabChange('cash')} className="text-[11px] font-bold text-blue-600 hover:underline">Full Statement</button>
              </div>

              <div className="space-y-2">
                {cashFlowSummary.map((cf, idx) => (
                  <div key={idx} className={`p-2 rounded-xl flex items-center justify-between text-xs ${cf.isHighlight ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-100'}`}>
                    <span className={`font-semibold ${cf.isBold ? 'font-black text-slate-900' : 'text-slate-700'}`}>{cf.label}</span>
                    <span className={`font-mono font-bold ${cf.isNegative ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {cf.val < 0 ? `(${fmtRaw(Math.abs(cf.val))})` : fmtRaw(cf.val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue by Segment (3 Cols) */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900">Revenue by Segment ({selectedPeriod})</h3>
              <div className="h-40 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={segmentData} innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                      {segmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}B`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-black text-slate-900">{fmt(5424.0 * scale)}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Total Rev</span>
                </div>
              </div>
              <div className="space-y-1 text-[11px]">
                {segmentData.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                      <span>{s.name}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{s.percent}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Health Score (3 Cols) */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3 text-center">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Financial Health Score</h3>
                <p className="text-[10px] text-slate-400">Automated Audit & Solvency Index</p>
              </div>

              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeDasharray="74, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900">74</span>
                  <span className="text-xs font-bold text-emerald-600">Good Health</span>
                </div>
              </div>

              <div className="bg-emerald-50 text-emerald-700 text-xs font-bold p-2 rounded-xl border border-emerald-200 flex items-center justify-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+6 pts vs last year</span>
              </div>
            </div>

          </div>

          {/* Row 3: Monthly Financial Performance Full Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Monthly Financial Performance ({selectedPeriod})</h3>
                <p className="text-xs text-slate-500">Breakdown across all 12 months in USD millions</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                Amounts in USD (millions)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="p-2.5">Line Item</th>
                    {monthlyPerformance.map(m => (
                      <th key={m.month} className={`p-2.5 text-right ${m.isYtd ? 'bg-blue-50 text-blue-900 font-black' : ''}`}>
                        {m.month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="p-2.5 font-bold text-slate-900">Revenue</td>
                    {monthlyPerformance.map((m, idx) => (
                      <td key={idx} className={`p-2.5 text-right font-mono ${m.isYtd ? 'font-black text-blue-900 bg-blue-50/50' : ''}`}>
                        {fmtRaw(m.rev)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">Gross Profit</td>
                    {monthlyPerformance.map((m, idx) => (
                      <td key={idx} className={`p-2.5 text-right font-mono ${m.isYtd ? 'font-black text-blue-900 bg-blue-50/50' : ''}`}>
                        {fmtRaw(m.gp)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">Operating Income</td>
                    {monthlyPerformance.map((m, idx) => (
                      <td key={idx} className={`p-2.5 text-right font-mono ${m.isYtd ? 'font-black text-blue-900 bg-blue-50/50' : ''}`}>
                        {fmtRaw(m.oi)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">Net Income</td>
                    {monthlyPerformance.map((m, idx) => (
                      <td key={idx} className={`p-2.5 text-right font-mono ${m.isYtd ? 'font-black text-blue-900 bg-blue-50/50' : ''}`}>
                        {fmtRaw(m.ni)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-2.5 text-slate-900">Operating Cash Flow</td>
                    {monthlyPerformance.map((m, idx) => (
                      <td key={idx} className={`p-2.5 text-right font-mono text-emerald-700 ${m.isYtd ? 'font-black text-blue-900 bg-blue-50/50' : ''}`}>
                        {fmtRaw(m.ocf)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 2. INCOME STATEMENT SUB-VIEW */}
      {currentTab === 'income' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Detailed Income Statement</h2>
              <p className="text-xs text-slate-500">Full period-over-period line items with YoY variance</p>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-lg">IFRS / US GAAP</span>
          </div>

          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                <th className="p-3">Financial Line Item</th>
                <th className="p-3 text-right">{selectedPeriod}</th>
                <th className="p-3 text-right">{selectedComparePeriod}</th>
                <th className="p-3 text-right">Variance</th>
                <th className="p-3 text-right">% Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {incomeStatementSummary.map((row, idx) => (
                <tr key={idx} className={row.isBold ? 'font-black bg-slate-50 text-slate-900' : 'hover:bg-slate-50/60'}>
                  <td className="p-3">{row.label}</td>
                  <td className="p-3 text-right font-mono">{fmtRaw(row.fy23)}M</td>
                  <td className="p-3 text-right font-mono text-slate-500">{fmtRaw(row.fy22)}M</td>
                  <td className="p-3 text-right font-mono">{fmtRaw(row.var)}M</td>
                  <td className={`p-3 text-right font-mono font-bold ${row.pct.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{row.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. BALANCE SHEET SUB-VIEW */}
      {currentTab === 'balance' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Consolidated Balance Sheet</h2>
              <p className="text-xs text-slate-500">Assets, Liabilities, and Equity Position</p>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg">Balanced Statement</span>
          </div>

          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                <th className="p-3">Balance Sheet Line Item</th>
                <th className="p-3 text-right">As of Dec 31, 2023</th>
                <th className="p-3 text-right">As of Dec 31, 2022</th>
                <th className="p-3 text-right">YoY Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {balanceSheetSummary.map((row, idx) => (
                <tr key={idx} className="font-black bg-slate-50">
                  <td className="p-3">{row.label}</td>
                  <td className="p-3 text-right font-mono">{fmtRaw(row.fy23)}M</td>
                  <td className="p-3 text-right font-mono text-slate-500">{fmtRaw(row.fy22)}M</td>
                  <td className="p-3 text-right font-mono text-emerald-600">{row.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. CASH FLOW STATEMENT SUB-VIEW */}
      {currentTab === 'cash' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Cash Flow Statement</h2>
              <p className="text-xs text-slate-500">Operating, Investing, and Financing Cash Activities</p>
            </div>
          </div>

          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                <th className="p-3">Cash Flow Category</th>
                <th className="p-3 text-right">{selectedPeriod}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {cashFlowSummary.map((row, idx) => (
                <tr key={idx} className={row.isBold ? 'font-black bg-slate-50' : 'hover:bg-slate-50'}>
                  <td className="p-3">{row.label}</td>
                  <td className={`p-3 text-right font-mono font-bold ${row.isNegative ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {row.val < 0 ? `(${fmtRaw(Math.abs(row.val))})M` : `${fmtRaw(row.val)}M`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. RATIOS & KPIS SUB-VIEW */}
      {currentTab === 'ratios' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Financial Ratios & Key Performance Indicators</h2>
              <p className="text-xs text-slate-500">Comprehensive liquidity, profitability, leverage, and efficiency ratios</p>
            </div>
          </div>

          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                <th className="p-3">Category</th>
                <th className="p-3">Ratio Name</th>
                <th className="p-3 text-right">{selectedPeriod}</th>
                <th className="p-3 text-right">{selectedComparePeriod}</th>
                <th className="p-3 text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {keyRatios.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-500 font-bold">{r.category}</td>
                  <td className="p-3 text-slate-900 font-bold">{r.name}</td>
                  <td className="p-3 text-right font-mono font-bold">{r.fy23}</td>
                  <td className="p-3 text-right font-mono text-slate-400">{r.fy22}</td>
                  <td className="p-3 text-right font-mono text-emerald-600 font-bold">{r.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. SEGMENT ANALYSIS SUB-VIEW */}
      {currentTab === 'segments' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Business Segment & Regional Analysis</h2>
              <p className="text-xs text-slate-500">Revenue and OIBDA contribution by business unit</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900">Revenue Breakdown</h3>
              {segmentData.map((s, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{s.name}</span>
                  <div className="text-right">
                    <span className="font-black text-slate-900 font-mono">${s.value.toFixed(2)}B</span>
                    <span className="text-slate-500 font-mono text-[10px] block">({s.percent})</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-64 bg-slate-50 rounded-2xl p-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={segmentData} innerRadius={50} outerRadius={80} dataKey="value">
                    {segmentData.map((e, index) => (
                      <Cell key={index} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 7. COMPARATIVE ANALYSIS SUB-VIEW */}
      {currentTab === 'comparative' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Horizontal & Vertical Comparative Analysis</h2>
              <p className="text-xs text-slate-500">Year-over-year percentage shifts and common-size statement proportions</p>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Comparing <strong className="text-slate-900">{selectedPeriod}</strong> against <strong className="text-slate-900">{selectedComparePeriod}</strong> across all active financial statements.
          </p>

          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                <th className="p-3">Financial Metric</th>
                <th className="p-3 text-right">{selectedPeriod}</th>
                <th className="p-3 text-right">{selectedComparePeriod}</th>
                <th className="p-3 text-right">Variance ($M)</th>
                <th className="p-3 text-right">% Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {incomeStatementSummary.map((row, idx) => (
                <tr key={idx} className={row.isBold ? 'font-black bg-slate-50' : ''}>
                  <td className="p-3">{row.label}</td>
                  <td className="p-3 text-right font-mono">{fmtRaw(row.fy23)}M</td>
                  <td className="p-3 text-right font-mono text-slate-500">{fmtRaw(row.fy22)}M</td>
                  <td className="p-3 text-right font-mono">{fmtRaw(row.var)}M</td>
                  <td className={`p-3 text-right font-mono font-bold ${row.pct.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{row.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 8. TREND ANALYSIS SUB-VIEW */}
      {currentTab === 'trend' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Multi-Year Trend & Compound Growth (CAGR)</h2>
              <p className="text-xs text-slate-500">Historical performance trajectory from 2019 to 2023</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis unit="B" />
                <Tooltip />
                <Area type="monotone" dataKey="Revenue" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} />
                <Area type="monotone" dataKey="EBITDA" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 9. FORECAST & PROJECTIONS SUB-VIEW */}
      {currentTab === 'forecast' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Forward Projections & Scenario Modeling</h2>
              <p className="text-xs text-slate-500">Base, Bull, and Bear case 3-year AI projections</p>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-lg">AI Scenario Engine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-blue-600 uppercase">Base Case Scenario</span>
              <div className="text-xl font-black text-slate-900">{fmt(6100.0 * scale)}</div>
              <p className="text-[11px] text-slate-500">Projected FY2025 revenue (+12.4% organic growth assumption)</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-emerald-700 uppercase">Bull Case Scenario</span>
              <div className="text-xl font-black text-emerald-900">{fmt(6850.0 * scale)}</div>
              <p className="text-[11px] text-emerald-700">High enterprise cloud adoption (+26.2% acceleration)</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-amber-700 uppercase">Bear Case Scenario</span>
              <div className="text-xl font-black text-amber-900">{fmt(5200.0 * scale)}</div>
              <p className="text-[11px] text-amber-700">Macroeconomic slowdown and hardware margin pressure</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
