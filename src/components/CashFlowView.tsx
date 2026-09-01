import React from 'react';
import { RefreshCw, Download, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';

export const CashFlowView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Consolidated Cash Flow Statement</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Indirect Method
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Unilever PLC • FY 2025 • Figures in EUR (€ Millions)
          </p>
        </div>

        <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs font-mono cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          <span>Export Cash Flow</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">OPERATING CASH FLOW</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">€8,940M</div>
          <div className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Strong Working Capital Conversion
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">CAPEX & INVESTING CASH FLOW</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">(€1,820M)</div>
          <div className="text-xs text-slate-400 mt-1 font-semibold">
            Capital Expenditures: €1,450M
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">FREE CASH FLOW (FCF)</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">€7,120M</div>
          <div className="text-xs text-blue-600 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled to Dividend Coverage
          </div>
        </div>
      </div>

      {/* Cash Flow Statement Details Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            CASH FLOW ACTIVITIES & MOVEMENT
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-100/60">
                <th className="py-3 px-6">ACTIVITY CATEGORY</th>
                <th className="py-3 px-6 text-right">FY 2025</th>
                <th className="py-3 px-6 text-right">FY 2024</th>
                <th className="py-3 px-6 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-slate-50/80 font-bold">
                <td className="py-3 px-6 text-slate-900">1. Cash Flow from Operating Activities</td>
                <td className="py-3 px-6 text-right font-extrabold text-slate-900">€8,940M</td>
                <td className="py-3 px-6 text-right text-slate-500">€8,650M</td>
                <td className="py-3 px-6 text-right text-emerald-600 font-bold">RECONCILED</td>
              </tr>
              <tr>
                <td className="py-2.5 px-8 text-slate-700">Operating Profit (EBIT)</td>
                <td className="py-2.5 px-6 text-right font-semibold">€9,845M</td>
                <td className="py-2.5 px-6 text-right text-slate-400">€9,610M</td>
                <td className="py-2.5 px-6 text-right text-slate-400">Verified</td>
              </tr>
              <tr>
                <td className="py-2.5 px-8 text-slate-700">Depreciation & Amortization Add-Back</td>
                <td className="py-2.5 px-6 text-right font-semibold">€1,820M</td>
                <td className="py-2.5 px-6 text-right text-slate-400">€1,780M</td>
                <td className="py-2.5 px-6 text-right text-slate-400">Verified</td>
              </tr>
              <tr>
                <td className="py-2.5 px-8 text-slate-700">Working Capital Changes (Inventories/Payables)</td>
                <td className="py-2.5 px-6 text-right font-semibold">(€710M)</td>
                <td className="py-2.5 px-6 text-right text-slate-400">(€840M)</td>
                <td className="py-2.5 px-6 text-right text-slate-400">Verified</td>
              </tr>
              <tr className="bg-slate-50/80 font-bold">
                <td className="py-3 px-6 text-slate-900">2. Cash Flow from Investing Activities</td>
                <td className="py-3 px-6 text-right font-extrabold text-slate-900">(€1,820M)</td>
                <td className="py-3 px-6 text-right text-slate-500">(€2,100M)</td>
                <td className="py-3 px-6 text-right text-emerald-600 font-bold">RECONCILED</td>
              </tr>
              <tr>
                <td className="py-2.5 px-8 text-slate-700">Capital Expenditures (Property & Equipment)</td>
                <td className="py-2.5 px-6 text-right font-semibold">(€1,450M)</td>
                <td className="py-2.5 px-6 text-right text-slate-400">(€1,620M)</td>
                <td className="py-2.5 px-6 text-right text-slate-400">Verified</td>
              </tr>
              <tr className="bg-slate-50/80 font-bold">
                <td className="py-3 px-6 text-slate-900">3. Cash Flow from Financing Activities</td>
                <td className="py-3 px-6 text-right font-extrabold text-slate-900">(€7,993M)</td>
                <td className="py-3 px-6 text-right text-slate-500">(€7,200M)</td>
                <td className="py-3 px-6 text-right text-emerald-600 font-bold">RECONCILED</td>
              </tr>
              <tr>
                <td className="py-2.5 px-8 text-slate-700">Dividends Paid to Shareholders</td>
                <td className="py-2.5 px-6 text-right font-semibold">(€4,520M)</td>
                <td className="py-2.5 px-6 text-right text-slate-400">(€4,410M)</td>
                <td className="py-2.5 px-6 text-right text-slate-400">Verified</td>
              </tr>
              <tr>
                <td className="py-2.5 px-8 text-slate-700">Share Buybacks & Bond Servicing</td>
                <td className="py-2.5 px-6 text-right font-semibold">(€3,473M)</td>
                <td className="py-2.5 px-6 text-right text-slate-400">(€2,790M)</td>
                <td className="py-2.5 px-6 text-right text-slate-400">Verified</td>
              </tr>
              <tr className="bg-blue-50/60 font-extrabold text-slate-900 border-t-2 border-blue-600">
                <td className="py-3.5 px-6">NET CHANGE IN CASH & EQUIVALENTS</td>
                <td className="py-3.5 px-6 text-right text-blue-700 font-mono text-sm">(€873M)</td>
                <td className="py-3.5 px-6 text-right text-slate-500">(€650M)</td>
                <td className="py-3.5 px-6 text-right text-emerald-700">PASSED</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
