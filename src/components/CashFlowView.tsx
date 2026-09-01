import React from 'react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';
import { FinancialFormatter } from '../utils/financialFormatter';

export const CashFlowView: React.FC = () => {
  const { financialFacts, companies, selectedCompanyId, summary, hasFacts } = usePractice();
  const company = companies.find((c) => c.id === selectedCompanyId);
  const rows = financialFacts.filter((f) => f.statementType === 'CASH_FLOW');

  const fmt = (raw?: number, fallback?: string) => {
    if (!hasFacts) return EMPTY_DISPLAY;
    if (fallback && fallback !== EMPTY_DISPLAY) return fallback;
    if (raw == null || !Number.isFinite(raw)) return EMPTY_DISPLAY;
    return FinancialFormatter.format(raw, { currency: summary?.currency || company?.currency, scaleLabel: 'MILLIONS' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-mono">Consolidated Cash Flow Statement</h2>
        <p className="text-xs text-slate-500 mt-1 font-mono">{company?.name || EMPTY_DISPLAY} • {summary?.period || EMPTY_DISPLAY}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">OPERATING CASH FLOW</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{fmt(summary?.operatingCashFlowRaw, summary?.operatingCashFlow)}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">INVESTING CASH FLOW</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{fmt(summary?.netInvestingCashFlowRaw, summary?.investingCashFlow || summary?.netInvestingCashFlow)}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">FREE CASH FLOW (FCF)</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{fmt(summary?.freeCashFlowRaw, summary?.freeCashFlow)}</div>
        </div>
      </div>

      {!hasFacts || rows.length === 0 ? (
        <EmptyExtractionState title="Cash flow statement not extracted" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-100/60">
                <th className="py-3 px-6">ACTIVITY</th>
                <th className="py-3 px-6 text-right">AMOUNT</th>
                <th className="py-3 px-6 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-6 text-slate-900 font-bold">{item.label}</td>
                  <td className="py-3 px-6 text-right font-extrabold">
                    {FinancialFormatter.format(item.value, { currency: item.currency, scaleLabel: item.scaleSource || 'MILLIONS' })}
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
