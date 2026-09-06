import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';

export const RatiosView: React.FC = () => {
  const { summary, hasFacts, companies, selectedCompanyId } = usePractice();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const company = companies.find((c) => c.id === selectedCompanyId);

  const ratios = hasFacts ? [
    { name: 'Gross Margin', val: summary?.grossMarginPct || EMPTY_DISPLAY, cat: 'PROFITABILITY', formula: 'Gross Profit / Turnover' },
    { name: 'Net Profit Margin', val: summary?.netMarginPct || EMPTY_DISPLAY, cat: 'PROFITABILITY', formula: 'Net Profit / Turnover' },
    { name: 'Return on Equity (ROE)', val: summary?.returnOnEquity != null ? `${(Number(summary.returnOnEquity) * 100).toFixed(2)}%` : EMPTY_DISPLAY, cat: 'PROFITABILITY', formula: 'Net Profit / Total Equity' },
    { name: 'Debt to Equity', val: summary?.debtToEquity != null ? `${Number(summary.debtToEquity).toFixed(2)}x` : EMPTY_DISPLAY, cat: 'SOLVENCY', formula: 'Total Debt / Shareholders Equity' }
  ] : [];

  const filtered = selectedCategory === 'ALL' ? ratios : ratios.filter((r) => r.cat === selectedCategory);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Financial Ratios & Audit Benchmarks</h2>
          <p className="text-xs text-slate-500 mt-1">{company?.name || EMPTY_DISPLAY} • computed from gated summary facts</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'PROFITABILITY', 'LIQUIDITY', 'SOLVENCY', 'EFFICIENCY'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyExtractionState title="Ratios not extracted" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ratio) => (
            <div key={ratio.name} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{ratio.cat}</span>
              <div className="text-sm font-extrabold text-slate-900">{ratio.name}</div>
              <div className="text-2xl font-extrabold text-blue-600">{ratio.val}</div>
              <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg">Formula: {ratio.formula}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
