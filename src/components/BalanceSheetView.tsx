import React, { useState } from 'react';
import { Scale, FileText } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';
import { FinancialFormatter } from '../utils/financialFormatter';

export const BalanceSheetView: React.FC = () => {
  const { financialFacts, companies, selectedCompanyId, summary, hasFacts } = usePractice();
  const [activeTab, setActiveTab] = useState<'all' | 'assets' | 'liabilities' | 'equity'>('all');
  const company = companies.find((c) => c.id === selectedCompanyId);
  const rows = financialFacts.filter((f) => f.statementType === 'BALANCE_SHEET');

  const assets = summary?.assetsRaw;
  const liabilities = summary?.liabilitiesRaw;
  const equity = summary?.equityRaw;
  const variance = hasFacts && assets != null && liabilities != null && equity != null
    ? assets - (liabilities + equity)
    : null;

  const fmt = (raw?: number, fallback?: string) => {
    if (!hasFacts) return EMPTY_DISPLAY;
    if (fallback && fallback !== EMPTY_DISPLAY) return fallback;
    if (raw == null || !Number.isFinite(raw)) return EMPTY_DISPLAY;
    return FinancialFormatter.format(raw, { currency: summary?.currency || company?.currency, scaleLabel: 'MILLIONS' });
  };

  const visible = rows.filter((item) => {
    if (activeTab === 'all') return true;
    const label = item.label.toLowerCase();
    if (activeTab === 'assets') return label.includes('asset') || item.metric.includes('asset');
    if (activeTab === 'liabilities') return label.includes('liab') || item.metric.includes('liab');
    return label.includes('equity') || item.metric.includes('equity');
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">Consolidated Balance Sheet</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {company?.name || EMPTY_DISPLAY} • {summary?.period || EMPTY_DISPLAY}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-5 rounded-2xl border border-slate-700 text-white shadow-md flex flex-wrap items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">FUNDAMENTAL BALANCE SHEET IDENTITY CHECK</div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              Assets ({fmt(assets, summary?.assets)}) = Liabilities ({fmt(liabilities, summary?.liabilities)}) + Equity ({fmt(equity, summary?.equity)})
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase">IDENTITY VARIANCE</div>
          <div className="text-lg font-extrabold text-emerald-400">
            {variance == null ? EMPTY_DISPLAY : FinancialFormatter.format(variance, { currency: summary?.currency, scaleLabel: 'ONES' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TOTAL ASSETS</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{fmt(assets, summary?.assets)}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TOTAL LIABILITIES</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{fmt(liabilities, summary?.liabilities)}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">SHAREHOLDERS' EQUITY</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{fmt(equity, summary?.equity)}</div>
        </div>
      </div>

      {!hasFacts || visible.length === 0 ? (
        <EmptyExtractionState title="Balance sheet not extracted" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2 font-mono">
            {(['all', 'assets', 'liabilities', 'equity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                  activeTab === tab ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-100/60">
                <th className="py-3 px-6">COMPONENT</th>
                <th className="py-3 px-6 text-right">AMOUNT</th>
                <th className="py-3 px-6 text-center">CONFIDENCE</th>
                <th className="py-3 px-6 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-3 px-6 text-slate-900 font-bold flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    {item.label}
                  </td>
                  <td className="py-3 px-6 text-right font-extrabold">
                    {FinancialFormatter.format(item.value, { currency: item.currency, scaleLabel: item.scaleSource || 'MILLIONS' })}
                  </td>
                  <td className="py-3 px-6 text-center">
                    {typeof item.confidence === 'number' ? `${(item.confidence * 100).toFixed(1)}%` : EMPTY_DISPLAY}
                  </td>
                  <td className="py-3 px-6 text-right">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
