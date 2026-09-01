import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Scale,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const chartData = [
  { month: 'Jan', Revenue: -2.8, NetIncome: -0.4, EBITDA: 1.8 },
  { month: 'Feb', Revenue: -2.9, NetIncome: -0.4, EBITDA: 1.8 },
  { month: 'Mar', Revenue: -3.0, NetIncome: -0.4, EBITDA: 1.85 },
  { month: 'Apr', Revenue: -3.2, NetIncome: -0.4, EBITDA: 1.9 },
  { month: 'May', Revenue: -3.3, NetIncome: -0.4, EBITDA: 1.92 },
  { month: 'Jun', Revenue: -3.4, NetIncome: -0.4, EBITDA: 1.95 },
  { month: 'Jul', Revenue: -3.5, NetIncome: -0.4, EBITDA: 1.98 },
  { month: 'Aug', Revenue: -3.55, NetIncome: -0.4, EBITDA: 2.0 },
  { month: 'Sep', Revenue: -3.6, NetIncome: -0.4, EBITDA: 2.02 },
  { month: 'Oct', Revenue: -3.62, NetIncome: -0.4, EBITDA: 2.05 },
  { month: 'Nov', Revenue: -3.65, NetIncome: -0.4, EBITDA: 2.08 },
  { month: 'Dec', Revenue: -3.7, NetIncome: -0.4, EBITDA: 2.1 }
];

export const FinancialDashboardView: React.FC = () => {
  const [viewType, setViewType] = useState<'Monthly' | 'Quarterly' | 'Annual'>('Monthly');

  return (
    <div className="space-[#000] space-y-6 animate-in fade-in duration-200">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              FINANCIAL SECTION:
            </span>
            <button className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
              <span>Summary Dashboard</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Reporting Period:
            </span>
            <button className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
              <span>YTD (FY2025) vs PY</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 6 Key Metric KPI Cards Grid (Matches Screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs hover:border-blue-300 transition-all">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Revenue</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            EUR-€26.79B
          </div>
          <div className="text-xs text-slate-400 font-mono">-- vs PY</div>
          {/* Sparkline line */}
          <div className="w-full h-8 pt-2">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M 0 10 Q 30 15, 60 18 T 100 22" fill="none" stroke="#2563EB" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 2: Gross Profit */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs hover:border-blue-300 transition-all">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span>Gross Profit</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            EUR€50.50B
          </div>
          <div className="text-xs text-slate-400 font-mono">--</div>
          {/* Sparkline line */}
          <div className="w-full h-8 pt-2">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M 0 20 Q 30 18, 60 15 T 100 12" fill="none" stroke="#2563EB" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 3: EBITDA / Operating Profit */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs hover:border-blue-300 transition-all">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <span>EBITDA / Operating Profit</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            EUR€9.00B
          </div>
          <div className="text-xs text-slate-400 font-mono">--</div>
          {/* Sparkline line */}
          <div className="w-full h-8 pt-2">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M 0 16 Q 40 14, 70 15 T 100 14" fill="none" stroke="#2563EB" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 4: Net Income */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs hover:border-blue-300 transition-all">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <DollarSign className="w-4 h-4 text-teal-600" />
            <span>Net Income</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            EUR-€1.04B
          </div>
          <div className="text-xs text-slate-400 font-mono">--</div>
          {/* Sparkline line */}
          <div className="w-full h-8 pt-2">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M 0 12 Q 40 16, 70 19 T 100 22" fill="none" stroke="#2563EB" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 5: Total Assets */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs hover:border-blue-300 transition-all">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <Scale className="w-4 h-4 text-amber-600" />
            <span>Total Assets</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            EUR€34.76B
          </div>
          <div className="text-xs text-slate-400 font-mono">--</div>
          {/* Sparkline line */}
          <div className="w-full h-8 pt-2">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M 0 18 Q 40 16, 70 14 T 100 12" fill="none" stroke="#2563EB" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 6: Current Ratio */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs hover:border-blue-300 transition-all">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <Scale className="w-4 h-4 text-indigo-600" />
            <span>Current Ratio</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            1.33
          </div>
          <div className="text-xs text-slate-400 font-mono">--</div>
          {/* Sparkline line */}
          <div className="w-full h-8 pt-2">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M 0 15 Q 40 15, 70 15 T 100 15" fill="none" stroke="#2563EB" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Second Filter Control Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">PERIOD:</span>
            <button className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold flex items-center gap-1.5 cursor-pointer">
              <span>YTD (Jan 1 – Jun 7, 2025) vs PY</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">COMPARISON:</span>
            <button className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold flex items-center gap-1.5 cursor-pointer">
              <span>Prior Year</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-bold px-2">VIEW:</span>
            {(['Monthly', 'Quarterly', 'Annual'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewType(v)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewType === v ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">ENTITY:</span>
            <button className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold flex items-center gap-1.5 cursor-pointer">
              <span>All Entities (Consolidated)</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Financial Performance Trend Line Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              FINANCIAL PERFORMANCE TREND
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Net Income</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> EBITDA</span>
            </div>

            <button className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex items-center gap-1 cursor-pointer">
              <span>Line</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[-4, 4]} tickFormatter={(v) => `${v}B`} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#E2E8F0', fontSize: '12px' }} />
              <Line type="monotone" dataKey="Revenue" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="NetIncome" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="EBITDA" stroke="#9333EA" strokeWidth={2.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Financial Ratios Table (Matches Screenshot) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            KEY FINANCIAL RATIOS (YTD)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-100/60 font-mono">
                <th className="py-3 px-6">RATIO</th>
                <th className="py-3 px-6">YTD</th>
                <th className="py-3 px-6">PY</th>
                <th className="py-3 px-6">CHANGE</th>
                <th className="py-3 px-6">BENCHMARK</th>
                <th className="py-3 px-6 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {[
                { ratio: 'Gross Margin', ytd: '—', py: '—', change: '—', benchmark: '41.0%', status: 'Good' },
                { ratio: 'Net Margin', ytd: '3.9%', py: '—', change: '—', benchmark: '9.5%', status: 'Good' },
                { ratio: 'ROA', ytd: '8.2%', py: '—', change: '—', benchmark: '7.0%', status: 'Good' },
                { ratio: 'ROE', ytd: '13.1%', py: '—', change: '—', benchmark: '11.0%', status: 'Good' },
                { ratio: 'Current Ratio', ytd: '1.33', py: '—', change: '—', benchmark: '1.10', status: 'Good' }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-6 font-bold text-slate-800">{row.ratio}</td>
                  <td className="py-3 px-6 text-slate-700 font-semibold">{row.ytd}</td>
                  <td className="py-3 px-6 text-slate-400">{row.py}</td>
                  <td className="py-3 px-6 text-slate-400">{row.change}</td>
                  <td className="py-3 px-6 text-slate-500">{row.benchmark}</td>
                  <td className="py-3 px-6 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
          <button className="text-xs text-blue-600 hover:text-blue-800 font-bold font-mono inline-flex items-center gap-1 cursor-pointer">
            <span>View all ratios & KPIs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
