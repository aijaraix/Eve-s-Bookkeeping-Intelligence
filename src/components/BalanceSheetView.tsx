import React, { useState } from 'react';
import { Scale, CheckCircle2, FileText, Download, ShieldCheck, Search, ChevronDown } from 'lucide-react';

export const BalanceSheetView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'assets' | 'liabilities' | 'equity'>('all');

  const assets = [
    { label: 'Property, Plant & Equipment (PPE)', fy25: '€24,850M', fy24: '€24,200M', cat: 'Non-Current' },
    { label: 'Goodwill & Intangibles', fy25: '€22,100M', fy24: '€21,950M', cat: 'Non-Current' },
    { label: 'Other Non-Current Investments', fy25: '€5,934M', fy24: '€5,810M', cat: 'Non-Current' },
    { label: 'Inventories & Raw Materials', fy25: '€6,420M', fy24: '€6,250M', cat: 'Current' },
    { label: 'Trade & Other Receivables', fy25: '€7,150M', fy24: '€6,980M', cat: 'Current' },
    { label: 'Cash & Cash Equivalents', fy25: '€4,017M', fy24: '€4,890M', cat: 'Current' }
  ];

  const liabilities = [
    { label: 'Non-Current Financial Debt & Bonds', fy25: '€20,150M', fy24: '€19,800M', cat: 'Non-Current' },
    { label: 'Deferred Tax & Pension Liabilities', fy25: '€6,260M', fy24: '€6,110M', cat: 'Non-Current' },
    { label: 'Trade Payables & Accruals', fy25: '€16,420M', fy24: '€15,950M', cat: 'Current' },
    { label: 'Short-Term Borrowings & Overdrafts', fy25: '€6,090M', fy24: '€5,820M', cat: 'Current' }
  ];

  const equity = [
    { label: 'Share Capital & Premium', fy25: '€2,410M', fy24: '€2,410M', cat: 'Equity' },
    { label: 'Retained Earnings', fy25: '€17,940M', fy24: '€16,810M', cat: 'Equity' },
    { label: 'Other Reserves & Non-Controlling', fy25: '€1,201M', fy24: '€1,180M', cat: 'Equity' }
  ];

  const totalAssets = 70471;
  const totalLiabilities = 48920;
  const totalEquity = 21551;
  const variance = totalAssets - (totalLiabilities + totalEquity);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">Consolidated Balance Sheet</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Assets = L + E Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Unilever PLC • Statement of Financial Position as at Dec 31, 2025
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <button className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
            <span>IFRS Standard</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>Export Balance Sheet</span>
          </button>
        </div>
      </div>

      {/* Accounting Fundamental Identity Verification Banner */}
      <div className="bg-gradient-to-r from-emerald-950 to-slate-900 p-5 rounded-2xl border border-emerald-500/30 text-white shadow-md flex flex-wrap items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              FUNDAMENTAL BALANCE SHEET IDENTITY CHECK
            </div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              Total Assets (€70,471M) = Liabilities (€48,920M) + Equity (€21,551M)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase">IDENTITY VARIANCE</div>
            <div className="text-lg font-extrabold text-emerald-400">€0.00 (0.000%)</div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950">
            STATUS: PASSED
          </span>
        </div>
      </div>

      {/* Summary Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TOTAL ASSETS</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">€70,471M</div>
          <div className="text-xs text-slate-400 mt-1">Non-Current: €52,884M | Current: €17,587M</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TOTAL LIABILITIES</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">€48,920M</div>
          <div className="text-xs text-slate-400 mt-1">Non-Current: €26,410M | Current: €22,510M</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">SHAREHOLDERS' EQUITY</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">€21,551M</div>
          <div className="text-xs text-slate-400 mt-1">Retained Earnings: €17,940M</div>
        </div>
      </div>

      {/* Tables Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono">
            {(['all', 'assets', 'liabilities', 'equity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer transition-all ${
                  activeTab === tab ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-100/60">
                <th className="py-3 px-6">SECTION & COMPONENT</th>
                <th className="py-3 px-6">CLASSIFICATION</th>
                <th className="py-3 px-6 text-right">FY 2025</th>
                <th className="py-3 px-6 text-right">FY 2024</th>
                <th className="py-3 px-6 text-center">CONFIDENCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'all' || activeTab === 'assets') &&
                assets.map((item, idx) => (
                  <tr key={`asset-${idx}`} className="hover:bg-slate-50 cursor-pointer">
                    <td className="py-3 px-6 text-slate-900 font-bold flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      {item.label}
                    </td>
                    <td className="py-3 px-6 text-slate-500">{item.cat} Asset</td>
                    <td className="py-3 px-6 text-right font-extrabold text-slate-900">{item.fy25}</td>
                    <td className="py-3 px-6 text-right text-slate-400">{item.fy24}</td>
                    <td className="py-3 px-6 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">99.6%</span>
                    </td>
                  </tr>
                ))}

              {(activeTab === 'all' || activeTab === 'liabilities') &&
                liabilities.map((item, idx) => (
                  <tr key={`liab-${idx}`} className="hover:bg-slate-50 cursor-pointer">
                    <td className="py-3 px-6 text-slate-900 font-bold flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      {item.label}
                    </td>
                    <td className="py-3 px-6 text-slate-500">{item.cat} Liability</td>
                    <td className="py-3 px-6 text-right font-extrabold text-slate-900">{item.fy25}</td>
                    <td className="py-3 px-6 text-right text-slate-400">{item.fy24}</td>
                    <td className="py-3 px-6 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">99.4%</span>
                    </td>
                  </tr>
                ))}

              {(activeTab === 'all' || activeTab === 'equity') &&
                equity.map((item, idx) => (
                  <tr key={`eq-${idx}`} className="hover:bg-slate-50 cursor-pointer">
                    <td className="py-3 px-6 text-slate-900 font-bold flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      {item.label}
                    </td>
                    <td className="py-3 px-6 text-slate-500">{item.cat}</td>
                    <td className="py-3 px-6 text-right font-extrabold text-slate-900">{item.fy25}</td>
                    <td className="py-3 px-6 text-right text-slate-400">{item.fy24}</td>
                    <td className="py-3 px-6 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">99.9%</span>
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
