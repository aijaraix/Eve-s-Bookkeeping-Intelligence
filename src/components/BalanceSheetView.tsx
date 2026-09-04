import React from 'react';
import { usePractice } from '../context/PracticeContext';
import { mockBalanceSheet } from '../data/mockData';
import { formatCurrency } from '../utils/financialFormatter';
import {
  Scale,
  CheckCircle2,
  Download,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export const BalanceSheetView: React.FC = () => {
  const { selectedCompany } = usePractice();

  return (
    <div id="balance-sheet-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Consolidated Balance Sheet</h1>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-cyan-950 text-cyan-400 border border-cyan-800">
              IAS 1 / {selectedCompany.reportingStandard}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            As at 31 December ({selectedCompany.currency} in {selectedCompany.scale}). Zero-variance balance check verified.
          </p>
        </div>

        {/* Balance Equation Status Card */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <Scale className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <div className="font-bold">Accounting Equation Holds</div>
            <div className="text-[11px] text-emerald-400/80 font-mono">
              Assets (€73,020M) = Liab (€50,200M) + Equity (€22,820M) • Δ €0.00
            </div>
          </div>
        </div>
      </div>

      {/* Balance Sheet Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Statement Section / Caption</th>
                <th className="py-3 px-3 text-center font-semibold w-24">Note</th>
                <th className="py-3 px-3 text-right font-semibold">FY2022</th>
                <th className="py-3 px-3 text-right font-semibold">FY2023</th>
                <th className="py-3 px-4 text-right font-semibold text-white">FY2024 (Audited)</th>
                <th className="py-3 px-4 text-center font-semibold w-32">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {mockBalanceSheet.map((item) => {
                if (item.isHeader) {
                  return (
                    <tr key={item.id} className="bg-slate-950/40 text-slate-400 font-semibold font-mono text-[11px]">
                      <td colSpan={6} className="py-2.5 px-4 uppercase tracking-wider text-cyan-400">
                        {item.label}
                      </td>
                    </tr>
                  );
                }

                const isBold = item.isTotal || item.level === 0;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/60 transition ${
                      isBold ? 'bg-slate-850/50 font-semibold text-white' : 'text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-4 flex items-center gap-2">
                      <span style={{ paddingLeft: `${(item.level - 1) * 16}px` }}></span>
                      <span>{item.label}</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {item.noteRef ? (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-400">
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
    </div>
  );
};
