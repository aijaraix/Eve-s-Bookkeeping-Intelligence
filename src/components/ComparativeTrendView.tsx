import React from 'react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';
import { FinancialFormatter } from '../utils/financialFormatter';

export const ComparativeTrendView: React.FC = () => {
  const { summary, hasFacts, companies, selectedCompanyId } = usePractice();
  const company = companies.find((c) => c.id === selectedCompanyId);
  const periods = Array.isArray(summary?.multiPeriodData) ? summary!.multiPeriodData : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Multi-Year Comparative & Trend Analysis</h2>
        <p className="text-xs text-slate-500 mt-1">{company?.name || EMPTY_DISPLAY} • extracted periods only (no 59.6B stubs)</p>
      </div>
      {!hasFacts || periods.length === 0 ? (
        <EmptyExtractionState title="No comparative series extracted" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-100/60">
                <th className="py-3 px-6">PERIOD</th>
                <th className="py-3 px-6 text-right">REVENUE</th>
                <th className="py-3 px-6 text-right">NET INCOME</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p: any, idx: number) => (
                <tr key={idx} className="border-t border-slate-100">
                  <td className="py-3 px-6 font-bold">{p.period || p.label}</td>
                  <td className="py-3 px-6 text-right">
                    {FinancialFormatter.format(p.revenueRaw ?? p.revenue, { currency: summary?.currency, scaleLabel: 'MILLIONS' })}
                  </td>
                  <td className="py-3 px-6 text-right">
                    {FinancialFormatter.format(p.netIncomeRaw ?? p.netIncome, { currency: summary?.currency, scaleLabel: 'MILLIONS' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
