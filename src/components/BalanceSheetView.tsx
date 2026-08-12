import React from 'react';
import { FinancialSummary } from '../types';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface BalanceSheetProps {
  summary: FinancialSummary | null;
  onDrillDown?: (line: string, amountEUR?: number) => void;
}

export const BalanceSheetView: React.FC<BalanceSheetProps> = ({ summary, onDrillDown }) => {
  const hasFacts = summary?.hasValidatedFacts;
  const curr = summary?.currency || 'EUR';

  const handleRowClick = (label: string, amount: number) => {
    if (onDrillDown && hasFacts) {
      onDrillDown(label, amount);
    }
  };

  return (
    <div className="space-y-6 text-neutral-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-200">
            STATEMENT OF FINANCIAL POSITION
          </span>
          <h1 className="text-2xl font-extrabold text-neutral-900 mt-1">Consolidated Balance Sheet</h1>
          <p className="text-xs text-neutral-500 mt-1">
            {hasFacts
              ? `Assets, Liabilities, and Equity extracted for period ${summary?.period || 'FY 2025'}.`
              : 'No validated balance sheet data available. Please upload financial statements.'}
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{hasFacts ? `Base Currency: ${curr}` : 'Awaiting Validated Data'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-neutral-900 border-b border-neutral-200 pb-3">Consolidated Assets</h2>
          <div className="space-y-2 text-xs">
            <div
              onClick={() => handleRowClick('Total Assets', summary?.assetsRaw || 0)}
              className="flex justify-between py-3 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 cursor-pointer text-sm font-extrabold text-neutral-900 border border-neutral-200 mt-2 transition-colors"
            >
              <span>Total Assets</span>
              <span className="font-mono">{hasFacts ? `${curr} ${summary?.assets}` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-neutral-900 border-b border-neutral-200 pb-3">Consolidated Liabilities & Equity</h2>
          <div className="space-y-2 text-xs">
            <div
              onClick={() => handleRowClick('Total Liabilities', summary?.liabilitiesRaw || 0)}
              className="flex justify-between py-3 px-3 rounded-xl hover:bg-neutral-100 cursor-pointer border-b border-neutral-200 transition-colors"
            >
              <span className="font-semibold text-neutral-800">Total Liabilities</span>
              <span className="font-mono font-bold text-neutral-900">{hasFacts ? `${curr} ${summary?.liabilities}` : '—'}</span>
            </div>
            <div
              onClick={() => handleRowClick('Total Equity', summary?.equityRaw || 0)}
              className="flex justify-between py-3 px-3 rounded-xl hover:bg-neutral-100 cursor-pointer border-b border-neutral-200 transition-colors"
            >
              <span className="font-semibold text-neutral-800">Total Equity</span>
              <span className="font-mono font-bold text-neutral-900">{hasFacts ? `${curr} ${summary?.equity}` : '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
