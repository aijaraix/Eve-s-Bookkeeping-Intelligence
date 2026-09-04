import React, { useState } from 'react';
import { usePractice } from '../context/PracticeContext';
import { mockIncomeStatement } from '../data/mockData';
import { StatementLineItem } from '../types';
import { formatCurrency, formatPercent } from '../utils/financialFormatter';
import {
  FileCheck2,
  ExternalLink,
  Info,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const IncomeStatementView: React.FC = () => {
  const { selectedCompany, setIsCopilotOpen } = usePractice();
  const [selectedItem, setSelectedItem] = useState<StatementLineItem | null>(null);

  const calculateYoY = (v24: number | null, v23: number | null) => {
    if (v24 === null || v23 === null || v23 === 0) return null;
    return ((v24 - v23) / Math.abs(v23)) * 100;
  };

  return (
    <div id="income-statement-view" className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Consolidated Income Statement</h1>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-cyan-950 text-cyan-400 border border-cyan-800">
              {selectedCompany.reportingStandard}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Figures stated in {selectedCompany.currency} ({selectedCompany.scale}). Audited comparative periods (FY2022 - FY2024).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const csv = mockIncomeStatement
                .map((r) => `${r.label},${r.values['2022'] || ''},${r.values['2023'] || ''},${r.values['2024'] || ''}`)
                .join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Income_Statement_${selectedCompany.id}.csv`;
              a.click();
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Statement Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Line Item / Footnote Reference</th>
                <th className="py-3 px-3 text-center font-semibold w-24">Note</th>
                <th className="py-3 px-3 text-right font-semibold">FY2022</th>
                <th className="py-3 px-3 text-right font-semibold">FY2023</th>
                <th className="py-3 px-4 text-right font-semibold text-white">FY2024 (Audited)</th>
                <th className="py-3 px-3 text-right font-semibold">YoY %</th>
                <th className="py-3 px-4 text-center font-semibold w-32">Swarm Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {mockIncomeStatement.map((item) => {
                if (item.isHeader) {
                  return (
                    <tr key={item.id} className="bg-slate-950/40 text-slate-400 font-semibold font-mono text-[11px]">
                      <td colSpan={7} className="py-2.5 px-4 uppercase tracking-wider text-cyan-400">
                        {item.label}
                      </td>
                    </tr>
                  );
                }

                const yoy = calculateYoY(item.values['2024'] ?? null, item.values['2023'] ?? null);
                const isBold = item.isTotal || item.level === 0;

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`hover:bg-slate-800/60 transition cursor-pointer ${
                      isBold ? 'bg-slate-850/40 font-semibold text-slate-100' : 'text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-4 flex items-center gap-2">
                      <span style={{ paddingLeft: `${(item.level - 1) * 16}px` }}></span>
                      <span>{item.label}</span>
                      {item.sourceDoc && (
                        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                          (p. {item.page})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {item.noteRef ? (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-400 hover:bg-slate-700">
                          {item.noteRef}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {formatCurrency(item.values['2022'], selectedCompany.currency, selectedCompany.scale)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {formatCurrency(item.values['2023'], selectedCompany.currency, selectedCompany.scale)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatCurrency(item.values['2024'], selectedCompany.currency, selectedCompany.scale)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      {yoy !== null ? (
                        <span className={yoy > 0 ? 'text-emerald-400' : yoy < 0 ? 'text-rose-400' : 'text-slate-400'}>
                          {formatPercent(yoy)}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{item.confidence}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-down Detail Modal/Panel */}
      {selectedItem && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{selectedItem.label}</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                Fact ID: {selectedItem.id}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Audited in <span className="text-slate-300 font-semibold">{selectedItem.sourceDoc}</span> on page{' '}
              <span className="text-slate-300 font-semibold">{selectedItem.page}</span>. Status:{' '}
              <span className="text-emerald-400 font-semibold uppercase">{selectedItem.status}</span> with{' '}
              <span className="text-emerald-400 font-semibold">{selectedItem.confidence}% verified confidence</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
            >
              Ask Eve about this item
            </button>
            <button
              onClick={() => setSelectedItem(null)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
