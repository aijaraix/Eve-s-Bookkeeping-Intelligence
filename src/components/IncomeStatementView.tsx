import React, { useState } from 'react';
import { FileText, Search, CheckCircle2 } from 'lucide-react';
import { FinancialFact } from '../types';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';
import { FinancialFormatter } from '../utils/financialFormatter';

interface IncomeStatementViewProps {
  onSelectFact?: (fact: FinancialFact) => void;
}

export const IncomeStatementView: React.FC<IncomeStatementViewProps> = ({ onSelectFact }) => {
  const { financialFacts, companies, selectedCompanyId, summary, hasFacts } = usePractice();
  const [searchTerm, setSearchTerm] = useState('');
  const company = companies.find((c) => c.id === selectedCompanyId);
  const lineItems = financialFacts.filter((f) => f.statementType === 'INCOME_STATEMENT');
  const filteredItems = lineItems.filter((item) => item.label.toLowerCase().includes(searchTerm.toLowerCase()));

  const fmt = (raw?: number, fallback?: string) => {
    if (!hasFacts) return EMPTY_DISPLAY;
    if (fallback && fallback !== EMPTY_DISPLAY) return fallback;
    if (raw == null || !Number.isFinite(raw) || raw === 0) return EMPTY_DISPLAY;
    return FinancialFormatter.format(raw, { currency: summary?.currency || company?.currency, scaleLabel: 'MILLIONS' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">Consolidated Income Statement</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              {hasFacts ? 'Gated facts' : 'Not extracted'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {company?.name || EMPTY_DISPLAY} • {summary?.period || EMPTY_DISPLAY}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter line items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-48 text-slate-800 focus:outline-none focus:border-blue-600 font-mono"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmt(summary?.revenueRaw, summary?.revenue) },
          { label: 'Gross Margin', value: hasFacts ? dashOr(summary?.grossMarginPct) : EMPTY_DISPLAY },
          { label: 'Operating Profit (EBIT)', value: fmt(summary?.operatingIncomeRaw, summary?.operatingIncome) },
          { label: 'Net Income', value: fmt(summary?.netIncomeRaw, summary?.netIncome) }
        ].map((card) => (
          <div key={card.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-mono font-bold uppercase text-slate-400">{card.label}</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">{card.value}</div>
          </div>
        ))}
      </div>

      {!hasFacts || filteredItems.length === 0 ? (
        <EmptyExtractionState title="Income statement not extracted" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              FINANCIAL STATEMENT LINE ITEMS
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-100/60">
                  <th className="py-3 px-6">LINE ITEM</th>
                  <th className="py-3 px-6 text-right">AMOUNT</th>
                  <th className="py-3 px-6">PERIOD</th>
                  <th className="py-3 px-6 text-center">CONFIDENCE</th>
                  <th className="py-3 px-6 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                    onClick={() => onSelectFact?.(item)}
                  >
                    <td className="py-3.5 px-6 text-slate-900 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{item.label}</span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-extrabold text-slate-900">
                      {FinancialFormatter.format(item.value, { currency: item.currency, scaleLabel: item.scaleSource || 'MILLIONS' })}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">{item.period || EMPTY_DISPLAY}</td>
                    <td className="py-3.5 px-6 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                        {typeof item.confidence === 'number' ? `${(item.confidence * 100).toFixed(1)}%` : EMPTY_DISPLAY}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

function dashOr(value?: string | null) {
  if (!value || value === '—' || value === 'undefined') return EMPTY_DISPLAY;
  return value;
}
