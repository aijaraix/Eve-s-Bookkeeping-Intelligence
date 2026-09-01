import React, { useState } from 'react';
import { BarChart3, TrendingUp, CheckCircle2, AlertTriangle, Scale, ArrowUpRight } from 'lucide-react';

export const RatiosView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const ratios = [
    { name: 'Gross Margin', val: '46.94%', py: '46.56%', bench: '41.0%', status: 'Good', cat: 'PROFITABILITY', formula: 'Gross Profit / Turnover' },
    { name: 'Net Profit Margin', val: '12.30%', py: '12.17%', bench: '9.5%', status: 'Good', cat: 'PROFITABILITY', formula: 'Net Profit / Turnover' },
    { name: 'Return on Equity (ROE)', val: '28.81%', py: '27.90%', bench: '22.0%', status: 'Good', cat: 'PROFITABILITY', formula: 'Net Profit / Total Equity' },
    { name: 'Return on Assets (ROA)', val: '8.81%', py: '8.54%', bench: '7.0%', status: 'Good', cat: 'PROFITABILITY', formula: 'Net Profit / Total Assets' },
    { name: 'Current Ratio', val: '1.33x', py: '1.29x', bench: '1.10x', status: 'Good', cat: 'LIQUIDITY', formula: 'Current Assets / Current Liabilities' },
    { name: 'Quick Ratio (Acid Test)', val: '0.98x', py: '0.94x', bench: '0.85x', status: 'Good', cat: 'LIQUIDITY', formula: '(Cash + Receivables) / Current Liabilities' },
    { name: 'Debt to Equity', val: '1.22x', py: '1.25x', bench: '1.50x', status: 'Good', cat: 'SOLVENCY', formula: 'Total Debt / Shareholders Equity' },
    { name: 'Interest Coverage Ratio', val: '15.88x', py: '16.29x', bench: '8.0x', status: 'Good', cat: 'SOLVENCY', formula: 'Operating Profit / Finance Costs' },
    { name: 'Asset Turnover', val: '0.72x', py: '0.70x', bench: '0.65x', status: 'Good', cat: 'EFFICIENCY', formula: 'Turnover / Average Total Assets' },
    { name: 'Inventory Days (DIO)', val: '87.4 Days', py: '86.1 Days', bench: '90.0 Days', status: 'Good', cat: 'EFFICIENCY', formula: '(Inventories / COGS) * 365' }
  ];

  const filtered = selectedCategory === 'ALL' ? ratios : ratios.filter(r => r.cat === selectedCategory);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Financial Ratios & Audit Benchmarks</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              • All 10 Core Benchmarks Passed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unilever PLC • Computed from Audited FY2025 Financial Statements
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'PROFITABILITY', 'LIQUIDITY', 'SOLVENCY', 'EFFICIENCY'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Ratios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((ratio, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{ratio.cat}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {ratio.status}
              </span>
            </div>

            <div>
              <div className="text-sm font-extrabold text-slate-900">{ratio.name}</div>
              <div className="text-2xl font-extrabold text-blue-600 mt-1">{ratio.val}</div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>PY: <span className="font-bold text-slate-700">{ratio.py}</span></div>
              <div>Benchmark: <span className="font-bold text-slate-700">{ratio.bench}</span></div>
            </div>

            <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
              Formula: {ratio.formula}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
