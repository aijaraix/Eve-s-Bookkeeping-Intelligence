import React from 'react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';
import { FinancialFormatter } from '../utils/financialFormatter';
import { generateFactLineageId } from '../utils/renderRegistry';

export interface CashFlowViewProps {
  onInspectMetric?: (metricName: string) => void;
  onSelectFact?: (fact: any) => void;
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({ onInspectMetric, onSelectFact }) => {
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
        <div
          onClick={() => onInspectMetric?.('Operating Cash Flow')}
          data-fact-lineage-id={generateFactLineageId({ metric: 'Operating Cash Flow', period: summary?.period, entityId: selectedCompanyId })}
          data-canonical-fact-id="FCT-OPERATING_CASH_FLOW"
          data-entity-id={selectedCompanyId || 'group'}
          data-period-id={summary?.period || 'current'}
          data-currency={summary?.currency || company?.currency || 'USD'}
          data-verification-state={hasFacts ? 'CONFIRMED' : 'UNCONFIRMED'}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to inspect optical provenance for Operating Cash Flow"
        >
          <div className="text-xs font-bold text-slate-500 uppercase group-hover:text-blue-600 transition-colors">OPERATING CASH FLOW</div>
          <div className="text-2xl font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors mt-1">{fmt(summary?.operatingCashFlowRaw, summary?.operatingCashFlow)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Click to inspect provenance</div>
        </div>
        <div
          onClick={() => onInspectMetric?.('Investing Cash Flow')}
          data-fact-lineage-id={generateFactLineageId({ metric: 'Investing Cash Flow', period: summary?.period, entityId: selectedCompanyId })}
          data-canonical-fact-id="FCT-INVESTING_CASH_FLOW"
          data-entity-id={selectedCompanyId || 'group'}
          data-period-id={summary?.period || 'current'}
          data-currency={summary?.currency || company?.currency || 'USD'}
          data-verification-state={hasFacts ? 'CONFIRMED' : 'UNCONFIRMED'}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to inspect optical provenance for Investing Cash Flow"
        >
          <div className="text-xs font-bold text-slate-500 uppercase group-hover:text-blue-600 transition-colors">INVESTING CASH FLOW</div>
          <div className="text-2xl font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors mt-1">{fmt(summary?.netInvestingCashFlowRaw, summary?.investingCashFlow || summary?.netInvestingCashFlow)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Click to inspect provenance</div>
        </div>
        <div
          onClick={() => onInspectMetric?.('Free Cash Flow')}
          data-fact-lineage-id={generateFactLineageId({ metric: 'Free Cash Flow', period: summary?.period, entityId: selectedCompanyId })}
          data-canonical-fact-id="FCT-FREE_CASH_FLOW"
          data-derivation-id="DRV-FREE-CASH-FLOW-001"
          data-entity-id={selectedCompanyId || 'group'}
          data-period-id={summary?.period || 'current'}
          data-currency={summary?.currency || company?.currency || 'USD'}
          data-verification-state={hasFacts ? 'CONFIRMED' : 'UNCONFIRMED'}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to inspect optical provenance for Free Cash Flow"
        >
          <div className="text-xs font-bold text-slate-500 uppercase group-hover:text-blue-600 transition-colors">FREE CASH FLOW (FCF)</div>
          <div className="text-2xl font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors mt-1">{fmt(summary?.freeCashFlowRaw, summary?.freeCashFlow)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Click to inspect provenance</div>
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
                <tr
                  key={item.id}
                  onClick={() => onSelectFact?.(item)}
                  className="hover:bg-blue-50/60 cursor-pointer transition-colors group"
                  title={`Click to view provenance for ${item.label}`}
                >
                  <td className="py-3 px-6 text-slate-900 font-bold group-hover:text-blue-700">{item.label}</td>
                  <td className="py-3 px-6 text-right font-extrabold group-hover:text-blue-700">
                    {FinancialFormatter.format(item.value, { currency: item.currency, scaleLabel: item.scaleSource || 'MILLIONS' })}
                  </td>
                  <td className="py-3 px-6 text-right font-semibold text-emerald-600">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
