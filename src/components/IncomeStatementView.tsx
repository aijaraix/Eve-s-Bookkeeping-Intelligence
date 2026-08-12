import React from 'react';
import { FinancialSummary } from '../types';
import { FileText, ArrowRight, Download } from 'lucide-react';

interface IncomeStatementProps {
  summary: FinancialSummary | null;
  onDrillDown: (line: string, amountEUR?: number) => void;
}

export const IncomeStatementView: React.FC<IncomeStatementProps> = ({ summary, onDrillDown }) => {
  const hasFacts = summary?.hasValidatedFacts;
  const curr = summary?.currency || 'EUR';

  const dynamicRows = [
    { label: 'Revenue', q2: hasFacts ? `${curr} ${summary?.revenue}` : '—', numAmount: summary?.revenueRaw || 0, bold: true },
    { label: 'Cost of Revenue', q2: hasFacts ? `${curr} ${summary?.costOfRevenue}` : '—', numAmount: summary?.costOfRevenueRaw || 0, bold: false },
    { label: 'Gross Profit', q2: hasFacts ? `${curr} ${summary?.grossProfit}` : '—', numAmount: summary?.grossProfitRaw || 0, bold: true, highlight: true },
    { label: 'Operating Income', q2: hasFacts ? `${curr} ${summary?.operatingIncome}` : '—', numAmount: summary?.operatingIncomeRaw || 0, bold: true },
    { label: 'Net Income', q2: hasFacts ? `${curr} ${summary?.netIncome}` : '—', numAmount: summary?.netIncomeRaw || 0, bold: true, highlight: true },
  ];

  return (
    <div className="space-y-6 text-neutral-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-200">
            AUDITED CONSOLIDATED STATEMENT
          </span>
          <h1 className="text-2xl font-extrabold text-neutral-900 mt-1">Consolidated Income Statement</h1>
          <p className="text-xs text-neutral-500 mt-1">
            {hasFacts
              ? `Ingested financial statement data for period ${summary?.period || 'FY 2025'}.`
              : 'No validated statement data available. Please upload financial reports to populate.'}
          </p>
        </div>
        <div className="text-xs font-mono font-bold bg-neutral-100 border border-neutral-300 px-3 py-2 rounded-xl text-neutral-800">
          Base Currency: {curr}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-200 text-xs font-bold text-neutral-600 uppercase tracking-wider">
                <th className="py-4 px-6">Financial Statement Line</th>
                <th className="py-4 px-6 text-right">Reporting Period ({summary?.period || 'FY 2025'})</th>
                <th className="py-4 px-6 text-right">YoY Variance</th>
                <th className="py-4 px-6 text-center">Audit Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm text-neutral-800">
              {dynamicRows.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => hasFacts && onDrillDown(row.label, row.numAmount)}
                  className={`hover:bg-neutral-100/80 cursor-pointer transition-colors ${
                    row.highlight ? 'bg-neutral-50' : ''
                  }`}
                >
                  <td className={`py-4 px-6 ${row.bold ? 'font-bold text-neutral-900' : 'text-neutral-700'}`}>
                    {row.label}
                  </td>
                  <td className={`py-4 px-6 text-right font-mono ${row.bold ? 'font-bold text-neutral-900' : 'text-neutral-800'}`}>
                    {row.q2}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-emerald-700 font-bold">
                    {hasFacts ? (row.label === 'Revenue' ? summary?.revenueYoYPct : '—') : '—'}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center space-x-1 text-xs text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-300 font-bold">
                      <FileText className="w-3.5 h-3.5 text-neutral-700" />
                      <span>{hasFacts ? 'Verified Fact' : 'Awaiting Data'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
