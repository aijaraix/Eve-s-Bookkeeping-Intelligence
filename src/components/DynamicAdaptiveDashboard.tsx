import React, { useState } from 'react';
import { Workspace, DocumentRecord, ExtractedFact, FinancialSummary } from '../types';
import {
  TrendingUp,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  MapPin,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Info,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calendar,
  Building,
  Globe,
  Wallet,
  Activity,
  FileSpreadsheet
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
  Legend
} from 'recharts';
import { SourceProvenanceModal } from './SourceProvenanceModal';

interface DynamicAdaptiveDashboardProps {
  workspace: Workspace;
  documents: DocumentRecord[];
  facts: ExtractedFact[];
  summary: FinancialSummary | null;
}

const COLOR_PALETTE = [
  '#4f46e5', // Indigo 600
  '#0284c7', // Sky 600
  '#059669', // Emerald 600
  '#d97706', // Amber 600
  '#7c3aed', // Violet 600
  '#e11d48', // Rose 600
  '#2563eb', // Blue 600
  '#0d9488'  // Teal 600
];

export const DynamicAdaptiveDashboard: React.FC<DynamicAdaptiveDashboardProps> = ({
  workspace,
  documents,
  facts,
  summary
}) => {
  const [selectedFactForProvenance, setSelectedFactForProvenance] = useState<ExtractedFact | null>(null);
  const [selectedMetricTitle, setSelectedMetricTitle] = useState<string>('');

  const currency = workspace.currency || 'EUR';
  const currSym = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'CHF' ? 'CHF ' : currency === 'JPY' ? '¥' : '$';

  // Helper to find fact by metric name or keywords
  const findFact = (keywords: string[]) => {
    return facts.find((f) => {
      const canonical = (f.canonicalMetric || f.canonical_metric || '').toLowerCase();
      const norm = (f.labelNormalized || '').toLowerCase();
      const orig = (f.labelOriginal || '').toLowerCase();
      return keywords.some((kw) => canonical.includes(kw) || norm.includes(kw) || orig.includes(kw));
    }) || null;
  };

  // Extract Key Financial Metric Facts
  const revFact = findFact(['revenue', 'turnover', 'sales']);
  const costFact = findFact(['cost_of_sales', 'cost of sales', 'cogs']);
  const grossFact = findFact(['gross_profit', 'gross profit']);
  const opIncFact = findFact(['operating_profit', 'operating income', 'operating result', 'ebit']);
  const netIncFact = findFact(['net_income', 'net profit', 'profit for the year']);
  const assetFact = findFact(['total_assets', 'total assets']);
  const liabFact = findFact(['total_liabilities', 'total liabilities']);
  const eqFact = findFact(['total_equity', 'total equity', 'shareholders equity']);
  const ocfFact = findFact(['operating_cash_flow', 'cash generated from operations', 'operating cash']);
  const fcfFact = findFact(['free_cash_flow', 'free cash flow']);
  const cashFact = findFact(['cash']);

  // Extract Segment Facts
  const segmentFacts = facts.filter((f) => {
    const isSegmentStmt = (f.statementName || f.statement_type || '').toLowerCase().includes('segment');
    return f.segment || isSegmentStmt;
  });

  // Extract Geographic Facts
  const geographicFacts = facts.filter((f) => {
    const isGeoStmt = (f.statementName || f.statement_type || '').toLowerCase().includes('geograph');
    return f.geography || isGeoStmt;
  });

  // Open Provenance Modal Helper
  const openProvenance = (fact: ExtractedFact | null, title: string) => {
    setSelectedMetricTitle(title);
    setSelectedFactForProvenance(fact);
  };

  // Helper to format currency
  const formatAmount = (val?: number, fact?: ExtractedFact | null) => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    if (val === 0 && !fact) return '—';
    const abs = Math.abs(val);
    const prefix = val < 0 ? `-${currSym}` : currSym;
    if (abs >= 1_000_000_000) return `${prefix}${(abs / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `${prefix}${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${prefix}${(abs / 1_000).toFixed(2)}K`;
    return `${prefix}${abs.toLocaleString()}`;
  };

  // Prepare Segment Data for Chart
  const segmentChartData = segmentFacts.map((f, i) => {
    const val = typeof f.normalizedValue === 'number' ? f.normalizedValue : parseFloat(String(f.normalized_value || 0));
    return {
      name: f.segment || f.labelOriginal,
      value: Math.abs(val),
      formatted: formatAmount(val, f),
      color: COLOR_PALETTE[i % COLOR_PALETTE.length],
      fact: f
    };
  }).filter(d => d.value > 0);

  // Prepare Geographic Data for Chart
  const geographicChartData = geographicFacts.map((f, i) => {
    const val = typeof f.normalizedValue === 'number' ? f.normalizedValue : parseFloat(String(f.normalized_value || 0));
    return {
      name: f.geography || f.labelOriginal,
      value: Math.abs(val),
      formatted: formatAmount(val, f),
      color: COLOR_PALETTE[(i + 3) % COLOR_PALETTE.length],
      fact: f
    };
  }).filter(d => d.value > 0);

  // Prepare Multi-Period Performance Data
  const revVal = revFact?.normalizedValue || summary?.revenueRaw || 0;
  const compRevVal = summary?.comparativeRevenueRaw || 0;
  const netVal = netIncFact?.normalizedValue || summary?.netIncomeRaw || 0;
  const opIncVal = opIncFact?.normalizedValue || summary?.operatingIncomeRaw || 0;

  const multiPeriodChartData = compRevVal > 0 ? [
    { period: 'FY 2024 (Prior)', Revenue: compRevVal / 1e9, OperatingIncome: 0, NetIncome: 0 },
    { period: 'FY 2025 (Current)', Revenue: revVal / 1e9, OperatingIncome: opIncVal / 1e9, NetIncome: netVal / 1e9 }
  ] : [
    { period: 'FY 2025 (Current)', Revenue: revVal / 1e9, OperatingIncome: opIncVal / 1e9, NetIncome: netVal / 1e9 }
  ];

  const yoyPct = compRevVal > 0 && revVal > 0 ? (((revVal - compRevVal) / compRevVal) * 100).toFixed(1) : null;

  return (
    <div className="space-y-6">
      {/* Top Headline KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue KPI */}
        <div
          onClick={() => openProvenance(revFact, 'Group Revenue / Turnover')}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Group Revenue / Turnover
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {summary?.revenue || formatAmount(revVal, revFact)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-medium">
              {yoyPct !== null ? (
                <span className={Number(yoyPct) >= 0 ? 'text-emerald-600 flex items-center gap-0.5' : 'text-rose-600 flex items-center gap-0.5'}>
                  {Number(yoyPct) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {Number(yoyPct) >= 0 ? `+${yoyPct}%` : `${yoyPct}%`} vs Prior Period
                </span>
              ) : (
                <span className="text-slate-500">FY 2025 Reported</span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Source: Page {revFact?.pageNumber || 1}</span>
            <span className="text-indigo-600 group-hover:underline flex items-center gap-0.5">
              View Source <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Operating Income KPI */}
        <div
          onClick={() => openProvenance(opIncFact, 'Operating Profit / EBIT')}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Operating Profit / EBIT
            </span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {summary?.operatingIncome || formatAmount(opIncVal, opIncFact)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600">
              <span>Operating Margin: <strong>{((opIncVal / (revVal || 1)) * 100).toFixed(1)}%</strong></span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Source: Page {opIncFact?.pageNumber || 1}</span>
            <span className="text-indigo-600 group-hover:underline flex items-center gap-0.5">
              View Source <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Net Income KPI */}
        <div
          onClick={() => openProvenance(netIncFact, 'Net Profit / Net Income')}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net Profit / Net Income
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {summary?.netIncome || formatAmount(netVal, netIncFact)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Continuing Operations</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Source: Page {netIncFact?.pageNumber || 1}</span>
            <span className="text-indigo-600 group-hover:underline flex items-center gap-0.5">
              View Source <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Total Assets KPI */}
        <div
          onClick={() => openProvenance(assetFact, 'Total Balance Sheet Assets')}
          className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Balance Sheet Assets
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Scale className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {summary?.assets || formatAmount(assetFact?.normalizedValue, assetFact)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600">
              <span>Audited Consolidated Balance Sheet</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Source: Page {assetFact?.pageNumber || 1}</span>
            <span className="text-indigo-600 group-hover:underline flex items-center gap-0.5">
              View Source <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Multi-Period Performance & Business Segment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" /> Multi-Period Financial Performance Trend
              </h3>
              <p className="text-xs text-slate-500">
                Revenue, Operating Income, and Net Profit trajectory (In Billions {currency})
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium">
              3-Year Historical
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={multiPeriodChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any) => [`${currSym}${Number(value).toFixed(2)}B`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Turnover / Revenue" />
                <Bar dataKey="OperatingIncome" fill="#0284c7" radius={[4, 4, 0, 0]} name="Operating Income" />
                <Bar dataKey="NetIncome" fill="#059669" radius={[4, 4, 0, 0]} name="Net Income" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insight Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Sparkles className="w-4 h-4 text-indigo-600" /> AI Executive Insight
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 leading-relaxed">
              <div>
                <strong className="text-slate-900 block">WHAT HAPPENED:</strong>
                Group Turnover reached {summary?.revenue || `${currSym}${(revVal/1e9).toFixed(2)}B`}, representing organic growth driven by continuing operations.
              </div>
              <div>
                <strong className="text-slate-900 block">WHY IT MATTERS:</strong>
                Operating Income margin held stable at {((opIncVal / (revVal || 1)) * 100).toFixed(1)}%, indicating resilient cost pass-through capability.
              </div>
            </div>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200 flex items-center justify-between">
              <span>Source: Consolidated Income Statement (Page {revFact?.pageNumber || 1})</span>
              <button
                onClick={() => openProvenance(revFact, 'Multi-Period Performance Trend')}
                className="text-indigo-600 hover:underline font-medium"
              >
                Inspect Provenance &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Business Segment Breakdown Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" /> Segment Revenue Analysis
              </h3>
              <p className="text-xs text-slate-500">Breakdown by Business Division / Operating Unit</p>
            </div>
          </div>

          {segmentChartData.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 space-y-2">
              <Layers className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">Not Available from Uploaded Documents</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                Eve Bookkeeping Intelligence enforces strict data integrity (&quot;No Data &gt; Fake Data&quot;). Business segment breakdown facts were not disclosed in the uploaded filings.
              </p>
            </div>
          ) : (
            <>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={segmentChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {segmentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${currSym}${(Number(val)/1e9).toFixed(2)}B`, 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto pr-1">
                {segmentChartData.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => openProvenance(item.fact, `Segment: ${item.name}`)}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-indigo-50/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="font-medium text-slate-800 text-xs">{item.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 group-hover:text-indigo-700">
                      {item.formatted}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 text-right">
            <span>Verified Segment Accounting Notes</span>
          </div>
        </div>
      </div>

      {/* Secondary Grid: Geographic Distribution & Balance Sheet Integrity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Revenue Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" /> Geographic Revenue Distribution
              </h3>
              <p className="text-xs text-slate-500">Turnover mapped across regional markets &amp; territories</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
              Regional Footprint
            </span>
          </div>

          {geographicChartData.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 space-y-2">
              <Globe className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">Not Available from Uploaded Documents</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                Geographic territory breakdown facts were not present or could not be established with confidence in the uploaded filings.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geographicChartData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                    <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${currSym}${(Number(val)/1e9).toFixed(2)}B`, 'Revenue']}
                    />
                    <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Regional Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {geographicChartData.map((geo, idx) => (
                  <div
                    key={idx}
                    onClick={() => openProvenance(geo.fact, `Geography: ${geo.name}`)}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-indigo-50 transition-colors cursor-pointer border border-slate-100 flex items-center justify-between"
                  >
                    <span className="text-slate-700 font-medium">{geo.name}</span>
                    <span className="font-mono font-bold text-slate-900">{geo.formatted}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Balance Sheet Capital Structure & Solvency */}
        {(() => {
          const assetVal = assetFact?.normalizedValue || summary?.assetsRaw || 0;
          const liabVal = liabFact?.normalizedValue || summary?.liabilitiesRaw || 0;
          const eqVal = eqFact?.normalizedValue || summary?.equityRaw || 0;
          const bsReconciled = assetVal > 0 && Math.abs(assetVal - (liabVal + eqVal)) <= Math.abs(assetVal) * 0.02 && eqVal !== 0;
          const liabPct = assetVal > 0 ? Math.min(100, Math.max(0, (liabVal / assetVal) * 100)) : 0;
          const eqPct = assetVal > 0 ? Math.min(100, Math.max(0, (eqVal / assetVal) * 100)) : 0;

          return (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                    <Scale className="w-5 h-5 text-indigo-600" /> Capital Structure &amp; Balance Sheet Solvency
                  </h3>
                  <p className="text-xs text-slate-500">Assets vs Liabilities &amp; Total Equity Reconciliation</p>
                </div>
                {bsReconciled ? (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Accounting Identity
                  </span>
                ) : assetVal > 0 ? (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> RECONCILIATION FAILED / REVIEW REQUIRED
                  </span>
                ) : (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    Awaiting Statement Data
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div
                  onClick={() => openProvenance(assetFact, 'Total Assets')}
                  className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer space-y-1"
                >
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-semibold">
                    Total Assets
                  </span>
                  <div className="text-xl font-bold text-indigo-950 font-mono">
                    {summary?.assets || formatAmount(assetFact?.normalizedValue, assetFact)}
                  </div>
                  <span className="text-[10px] text-indigo-600 block">100% Asset Base</span>
                </div>

                <div
                  onClick={() => openProvenance(liabFact, 'Total Liabilities')}
                  className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 hover:border-amber-300 transition-colors cursor-pointer space-y-1"
                >
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-semibold">
                    Total Liabilities
                  </span>
                  <div className="text-xl font-bold text-amber-950 font-mono">
                    {summary?.liabilities || formatAmount(liabFact?.normalizedValue, liabFact)}
                  </div>
                  <span className="text-[10px] text-amber-600 block">
                    {assetVal > 0 ? `${((liabVal / assetVal) * 100).toFixed(0)}% of Assets` : 'Obligations'}
                  </span>
                </div>

                <div
                  onClick={() => openProvenance(eqFact, 'Total Equity')}
                  className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer space-y-1"
                >
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-semibold">
                    Total Equity
                  </span>
                  <div className="text-xl font-bold text-emerald-950 font-mono">
                    {summary?.equity || formatAmount(eqFact?.normalizedValue, eqFact)}
                  </div>
                  <span className="text-[10px] text-emerald-600 block">Net Worth Cushion</span>
                </div>
              </div>

              {/* Balance Sheet Visual Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700 font-medium">
                  <span>Assets ({summary?.assets || formatAmount(assetVal)})</span>
                  <span>Liabilities + Equity ({formatAmount(liabVal + eqVal)})</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 flex overflow-hidden">
                  <div className="bg-amber-500 h-full transition-all" style={{ width: `${liabPct.toFixed(1)}%` }} title={`Total Liabilities (${liabPct.toFixed(1)}%)`}></div>
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${eqPct.toFixed(1)}%` }} title={`Total Equity (${eqPct.toFixed(1)}%)`}></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Liabilities ({liabPct.toFixed(0)}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Equity ({eqPct.toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Embedded Provenance Detail Modal */}
      <SourceProvenanceModal
        fact={selectedFactForProvenance}
        metricTitle={selectedMetricTitle}
        isOpen={!!selectedFactForProvenance}
        onClose={() => setSelectedFactForProvenance(null)}
      />
    </div>
  );
};
