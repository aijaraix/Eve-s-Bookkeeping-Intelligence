import React, { useState } from 'react';
import { FileText, Download, Filter, Search, ShieldCheck, CheckCircle2, ChevronDown, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { FinancialFact } from '../types';

interface IncomeStatementViewProps {
  onSelectFact?: (fact: FinancialFact) => void;
}

export const IncomeStatementView: React.FC<IncomeStatementViewProps> = ({ onSelectFact }) => {
  const [filterPeriod, setFilterPeriod] = useState('FY2025');
  const [searchTerm, setSearchTerm] = useState('');

  const lineItems = [
    { id: 'fact-1', label: 'Turnover / Group Revenue', fy25: '€50,503M', fy24: '€49,610M', change: '+1.8%', status: 'VERIFIED', confidence: '99.8%', note: 'Note 2 — Segment Analysis' },
    { id: 'fact-2', label: 'Cost of Sales (COGS)', fy25: '(€26,794M)', fy24: '(€26,510M)', change: '+1.1%', status: 'VERIFIED', confidence: '99.5%', note: 'Note 3 — Materials & Supply' },
    { id: 'fact-3', label: 'Gross Profit', fy25: '€23,709M', fy24: '€23,100M', change: '+2.6%', status: 'RECONCILED', confidence: '100%', note: 'Turnover - COGS Identity' },
    { id: 'fact-op-exp', label: 'Brand & Marketing Investment', fy25: '(€8,240M)', fy24: '(€7,980M)', change: '+3.3%', status: 'VERIFIED', confidence: '98.9%', note: 'Note 4 — Selling Expenses' },
    { id: 'fact-gen-exp', label: 'Overheads & Administrative Expenses', fy25: '(€5,624M)', fy24: '(€5,510M)', change: '+2.1%', status: 'VERIFIED', confidence: '99.1%', note: 'Note 5 — Admin Costs' },
    { id: 'fact-4', label: 'Operating Profit (EBIT)', fy25: '€9,845M', fy24: '€9,610M', change: '+2.4%', status: 'VERIFIED', confidence: '99.2%', note: 'Note 6 — Operating Profit' },
    { id: 'fact-fin-cost', label: 'Net Finance Costs', fy25: '(€620M)', fy24: '(€590M)', change: '+5.1%', status: 'VERIFIED', confidence: '99.0%', note: 'Note 7 — Net Debt Interest' },
    { id: 'fact-tax', label: 'Taxation on Profit', fy25: '(€2,015M)', fy24: '(€1,980M)', change: '+1.8%', status: 'VERIFIED', confidence: '98.7%', note: 'Note 8 — Tax Reconciliation' },
    { id: 'fact-5', label: 'Net Profit Attributable to Shareholders', fy25: '€6,210M', fy24: '€6,040M', change: '+2.8%', status: 'VERIFIED', confidence: '99.7%', note: 'Consolidated Net Income' }
  ];

  const filteredItems = lineItems.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">Consolidated Income Statement</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              IFRS Audited
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Unilever PLC • FY 2025 • Figures in EUR (€ Millions)
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
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-48 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
            />
          </div>
          <button className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 font-mono cursor-pointer">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>{filterPeriod}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer font-mono">
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Total Revenue</div>
          <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">€50,503M</div>
          <div className="text-[11px] text-emerald-600 font-mono font-semibold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3" /> +1.8% vs FY24
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Gross Margin</div>
          <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">46.94%</div>
          <div className="text-[11px] text-emerald-600 font-mono font-semibold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3" /> +0.4% Expansion
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Operating Profit (EBIT)</div>
          <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">€9,845M</div>
          <div className="text-[11px] text-emerald-600 font-mono font-semibold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3" /> 19.49% Operating Margin
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Net Income</div>
          <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">€6,210M</div>
          <div className="text-[11px] text-blue-600 font-mono font-semibold flex items-center gap-1 mt-1">
            <Sparkles className="w-3 h-3" /> Reconciled to Return
          </div>
        </div>
      </div>

      {/* Statement Line Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            FINANCIAL STATEMENT LINE ITEMS
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Click any row to inspect underlying OCR PDF provenance
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-100/60">
                <th className="py-3 px-6">LINE ITEM</th>
                <th className="py-3 px-6 text-right">FY 2025</th>
                <th className="py-3 px-6 text-right">FY 2024</th>
                <th className="py-3 px-6 text-right">CHANGE</th>
                <th className="py-3 px-6">DISCLOSURE NOTE</th>
                <th className="py-3 px-6 text-center">CONFIDENCE</th>
                <th className="py-3 px-6 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isHighlight = item.label.includes('Gross Profit') || item.label.includes('Operating Profit') || item.label.includes('Net Profit');
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${
                      isHighlight ? 'bg-slate-50/80 font-bold' : ''
                    }`}
                  >
                    <td className="py-3.5 px-6 text-slate-900 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{item.label}</span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-extrabold text-slate-900">{item.fy25}</td>
                    <td className="py-3.5 px-6 text-right text-slate-500">{item.fy24}</td>
                    <td className="py-3.5 px-6 text-right text-emerald-600 font-semibold">{item.change}</td>
                    <td className="py-3.5 px-6 text-slate-500 text-[11px]">{item.note}</td>
                    <td className="py-3.5 px-6 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                        {item.confidence}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.status}
                      </span>
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
