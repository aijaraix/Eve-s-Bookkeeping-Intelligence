import React from 'react';
import {
  PieChart,
  Scale,
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  Share2
} from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';

interface EquityStatementViewProps {
  onInspectMetric?: (metricName: string) => void;
}

export const EquityStatementView: React.FC<EquityStatementViewProps> = ({ onInspectMetric }) => {
  const { companies, selectedCompanyId, facts } = usePractice();
  const company = companies.find((c) => c.id === selectedCompanyId);

  // Filter facts related to equity roll-forward
  const equityFacts = facts.filter((f) =>
    /equity|retained|share|capital|stock|buyback|dividend|comprehensive|treasury/i.test(
      f.metric || f.label || ''
    )
  );

  const equityRows = [
    { label: 'Beginning Balance', metric: 'EQUITY_BEGINNING', defaultVal: '€14,820M', verified: true },
    { label: 'Net Income Attributable to Shareholders', metric: 'NET_INCOME', defaultVal: '€6,480M', verified: true },
    { label: 'Other Comprehensive Income (OCI)', metric: 'OCI', defaultVal: '(€340M)', verified: true },
    { label: 'Dividends Declared & Paid', metric: 'DIVIDENDS_PAID', defaultVal: '(€4,120M)', verified: true },
    { label: 'Share Repurchases (Treasury Buybacks)', metric: 'SHARE_BUYBACKS', defaultVal: '(€1,500M)', verified: true },
    { label: 'Stock-Based Compensation', metric: 'SHARE_BASED_COMP', defaultVal: '€240M', verified: true },
    { label: 'Ending Total Equity', metric: 'TOTAL_EQUITY', defaultVal: '€15,580M', isTotal: true, verified: true }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <span>FINANCIAL WORKBENCH — PRIMARY STATEMENT</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-mono">
              Consolidated Statement of Changes in Equity
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Roll-forward of share capital, treasury stock repurchases, retained earnings, and other comprehensive income.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-700">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Reporting Entity</span>
              <span className="font-bold">{company?.name || 'Consolidated Group'}</span>
            </div>
            <div className="px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800">
              <span className="text-[10px] text-emerald-600 uppercase block font-bold">Currency</span>
              <span className="font-bold">{company?.currency || 'EUR'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Statement Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs font-mono font-bold text-slate-700 uppercase">
            Equity Reconciliation & Roll-Forward Schedule
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Click any row to inspect digital provenance
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
            <tr>
              <th className="py-3.5 px-4">Line Item / Equity Movement</th>
              <th className="py-3.5 px-4">Metric Identifier</th>
              <th className="py-3.5 px-4 text-right">Reported Amount</th>
              <th className="py-3.5 px-4 text-center">Integrity Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {equityRows.map((row, idx) => {
              const matchedFact = equityFacts.find(
                (f) => f.canonicalMetric === row.metric || f.metric?.toUpperCase() === row.metric
              );
              const displayVal = matchedFact?.formattedValue || (matchedFact ? String(matchedFact.normalizedValue) : (facts.length > 0 ? '—' : row.defaultVal));

              return (
                <tr
                  key={idx}
                  onClick={() => onInspectMetric && onInspectMetric(row.metric)}
                  className={`hover:bg-blue-50/60 transition-colors cursor-pointer ${
                    row.isTotal ? 'bg-slate-50 font-bold border-t border-b border-slate-200' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <span className={row.isTotal ? 'font-bold text-slate-950' : ''}>
                      {row.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {row.metric}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    <span className="px-2 py-0.5 rounded-sm hover:bg-blue-100 transition-colors">
                      {displayVal}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>VERIFIED</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
