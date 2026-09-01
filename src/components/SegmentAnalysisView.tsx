import React from 'react';
import { PieChart, BarChart3, TrendingUp, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

const segmentData = [
  { name: 'Beauty & Wellbeing', turnover: 12540, margin: 21.2, color: '#2563EB' },
  { name: 'Personal Care', turnover: 13800, margin: 20.5, color: '#10B981' },
  { name: 'Home Care', turnover: 12400, margin: 18.2, color: '#F59E0B' },
  { name: 'Nutrition', turnover: 13200, margin: 18.9, color: '#8B5CF6' },
  { name: 'Ice Cream', turnover: 8563, margin: 15.4, color: '#EC4899' }
];

export const SegmentAnalysisView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Business Unit & Segment Breakdown</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Note 2 — Segment Reporting
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unilever PLC • FY2025 Turnover & Operating Margin by Business Division
          </p>
        </div>

        <button className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
          <span>FY2025 Divisional View</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Segment Revenue Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              TURNOVER BY BUSINESS DIVISION (€ MILLIONS)
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">Total: €60,503M (Gross)</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `€${v}M`} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#E2E8F0', fontSize: '12px' }} />
              <Bar dataKey="turnover" radius={[8, 8, 0, 0]}>
                {segmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Segment Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            DIVISIONAL PERFORMANCE MATRIX
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-100/60">
                <th className="py-3 px-6">BUSINESS DIVISION</th>
                <th className="py-3 px-6 text-right">TURNOVER (€M)</th>
                <th className="py-3 px-6 text-right">% SHARE</th>
                <th className="py-3 px-6 text-right">OPERATING MARGIN (%)</th>
                <th className="py-3 px-6 text-right">AUDIT STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {segmentData.map((seg, idx) => (
                <tr key={idx} className="hover:bg-slate-50 cursor-pointer">
                  <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                    {seg.name}
                  </td>
                  <td className="py-3.5 px-6 text-right font-extrabold text-slate-900">€{seg.turnover.toLocaleString()}M</td>
                  <td className="py-3.5 px-6 text-right text-slate-600">{((seg.turnover / 60503) * 100).toFixed(1)}%</td>
                  <td className="py-3.5 px-6 text-right text-emerald-600 font-bold">{seg.margin}%</td>
                  <td className="py-3.5 px-6 text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                      VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
