import React from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, Download } from 'lucide-react';

export const ComparativeTrendView: React.FC = () => {
  const years = [
    { metric: 'Turnover / Group Revenue', fy23: '€59,604M', fy24: '€49,610M', fy25: '€50,503M', cagr: '-7.9%' },
    { metric: 'Gross Profit', fy23: '€24,800M', fy24: '€23,100M', fy25: '€23,709M', cagr: '-2.2%' },
    { metric: 'Operating Profit (EBIT)', fy23: '€9,900M', fy24: '€9,610M', fy25: '€9,845M', cagr: '-0.3%' },
    { metric: 'Net Income', fy23: '€6,490M', fy24: '€6,040M', fy25: '€6,210M', cagr: '-2.2%' },
    { metric: 'Total Assets', fy23: '€75,200M', fy24: '€72,100M', fy25: '€70,471M', cagr: '-3.2%' },
    { metric: 'Shareholders Equity', fy23: '€21,800M', fy24: '€20,900M', fy25: '€21,551M', cagr: '-0.6%' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Multi-Year Comparative & Trend Analysis</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              3-Year Historical Series
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unilever PLC • Financial Trend & CAGR Performance (FY2023 – FY2025)
          </p>
        </div>

        <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          <span>Export Comparative Matrix</span>
        </button>
      </div>

      {/* Comparative Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            HISTORICAL FINANCIAL METRIC TRAJECTORY
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-100/60">
                <th className="py-3 px-6">METRIC</th>
                <th className="py-3 px-6 text-right">FY 2023</th>
                <th className="py-3 px-6 text-right">FY 2024</th>
                <th className="py-3 px-6 text-right">FY 2025</th>
                <th className="py-3 px-6 text-right">FY24 → FY25 CHANGE</th>
                <th className="py-3 px-6 text-right">3-YR CAGR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {years.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 cursor-pointer">
                  <td className="py-3.5 px-6 font-bold text-slate-900">{row.metric}</td>
                  <td className="py-3.5 px-6 text-right text-slate-500">{row.fy23}</td>
                  <td className="py-3.5 px-6 text-right text-slate-600">{row.fy24}</td>
                  <td className="py-3.5 px-6 text-right font-extrabold text-blue-600">{row.fy25}</td>
                  <td className="py-3.5 px-6 text-right text-emerald-600 font-bold">+1.8%</td>
                  <td className="py-3.5 px-6 text-right text-slate-500 font-semibold">{row.cagr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
