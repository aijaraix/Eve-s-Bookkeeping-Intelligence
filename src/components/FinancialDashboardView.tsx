import React, { useState } from 'react';
import { TrendingUp, DollarSign, BarChart3, Scale } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';

export const FinancialDashboardView: React.FC = () => {
  const { summary, hasFacts, companies, selectedCompanyId } = usePractice();
  const [viewType, setViewType] = useState<'Monthly' | 'Quarterly' | 'Annual'>('Annual');
  const company = companies.find((c) => c.id === selectedCompanyId);
  const chartData = Array.isArray(summary?.multiPeriodData)
    ? summary!.multiPeriodData.map((p: any) => ({
        label: p.period || p.label || '',
        Revenue: p.revenueRaw ?? p.revenue,
        NetIncome: p.netIncomeRaw ?? p.netIncome,
        EBITDA: p.ebitdaRaw ?? p.ebitda
      }))
    : [];

  const kpis = [
    { title: 'Revenue', value: hasFacts ? (summary?.revenue || EMPTY_DISPLAY) : EMPTY_DISPLAY, icon: TrendingUp },
    { title: 'Gross Profit', value: hasFacts ? (summary?.grossProfit || EMPTY_DISPLAY) : EMPTY_DISPLAY, icon: DollarSign },
    { title: 'EBITDA / Operating Profit', value: hasFacts ? (summary?.operatingIncome || summary?.ebitda || EMPTY_DISPLAY) : EMPTY_DISPLAY, icon: BarChart3 },
    { title: 'Net Income', value: hasFacts ? (summary?.netIncome || EMPTY_DISPLAY) : EMPTY_DISPLAY, icon: DollarSign },
    { title: 'Total Assets', value: hasFacts ? (summary?.assets || EMPTY_DISPLAY) : EMPTY_DISPLAY, icon: Scale },
    { title: 'Current Ratio', value: hasFacts && summary?.currentAssetsRaw && summary?.currentLiabilitiesRaw
      ? (summary.currentLiabilitiesRaw ? (summary.currentAssetsRaw / summary.currentLiabilitiesRaw).toFixed(2) : EMPTY_DISPLAY)
      : EMPTY_DISPLAY, icon: Scale }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
          {company?.name || 'No client selected'} • {summary?.period || EMPTY_DISPLAY}
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['Monthly', 'Quarterly', 'Annual'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewType(v)}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                viewType === v ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <kpi.icon className="w-4 h-4 text-blue-600" />
              <span>{kpi.title}</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">{kpi.value}</div>
            <div className="text-xs text-slate-400 font-mono">{hasFacts ? (summary?.revenueYoYPct || EMPTY_DISPLAY) : 'not extracted'}</div>
          </div>
        ))}
      </div>

      {chartData.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">FINANCIAL PERFORMANCE TREND</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#E2E8F0', fontSize: '12px' }} />
                <Line type="monotone" dataKey="Revenue" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="NetIncome" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="EBITDA" stroke="#9333EA" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <EmptyExtractionState title="No extracted trend series" detail="Charts render only after GET /api/financial/summary returns gated facts." />
      )}
    </div>
  );
};
