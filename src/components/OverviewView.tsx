import React from 'react';
import { usePractice } from '../context/PracticeContext';
import { formatCurrency, formatPercent } from '../utils/financialFormatter';
import {
  TrendingUp,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  ArrowUpRight,
  FileCheck,
  Scale,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const chartData = [
  { year: '2022', turnover: 60073, grossProfit: 25284, operatingProfit: 10753 },
  { year: '2023', turnover: 59604, grossProfit: 25630, operatingProfit: 9759 },
  { year: '2024', turnover: 60812, grossProfit: 26692, operatingProfit: 10387 },
];

export const OverviewView: React.FC = () => {
  const { selectedCompany, findings, swarmAgents, setCurrentView, setIsCopilotOpen } = usePractice();

  const unresolved = findings.filter((f) => !f.resolved);

  return (
    <div id="overview-view" className="space-y-6">
      {/* Top Banner / Entity Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">{selectedCompany.name}</h1>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-cyan-950 text-cyan-400 border border-cyan-800">
              {selectedCompany.ticker}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standard: <span className="text-slate-300 font-semibold">{selectedCompany.reportingStandard}</span> • Currency:{' '}
            <span className="text-slate-300 font-semibold">{selectedCompany.currency} ({selectedCompany.scale})</span> • Period:{' '}
            <span className="text-slate-300 font-semibold">{selectedCompany.fiscalYear}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Status: {selectedCompany.auditStatus}</span>
          </div>
          <button
            onClick={() => setCurrentView('hermes_swarm')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Swarm Details</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase font-mono">Turnover (FY24)</div>
          <div className="text-xl font-bold text-white mt-1">
            {formatCurrency(60812, selectedCompany.currency, selectedCompany.scale)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>+2.0% YoY</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase font-mono">Gross Profit</div>
          <div className="text-xl font-bold text-white mt-1">
            {formatCurrency(26692, selectedCompany.currency, selectedCompany.scale)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Margin: <span className="text-slate-200 font-semibold">43.9%</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase font-mono">Operating Profit</div>
          <div className="text-xl font-bold text-white mt-1">
            {formatCurrency(10387, selectedCompany.currency, selectedCompany.scale)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+6.4% YoY (17.1% margin)</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase font-mono">Net Profit</div>
          <div className="text-xl font-bold text-white mt-1">
            {formatCurrency(7593, selectedCompany.currency, selectedCompany.scale)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Effective Tax: <span className="text-slate-200 font-semibold">23.3%</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase font-mono">Total Assets</div>
          <div className="text-xl font-bold text-white mt-1">
            {formatCurrency(73020, selectedCompany.currency, selectedCompany.scale)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Equity: <span className="text-slate-200 font-semibold">€22,820M (31.3%)</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase font-mono">Balance Check</div>
          <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <Scale className="w-5 h-5" />
            <span>€0.00</span>
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1 font-mono">
            Assets = Liab + Equity (100%)
          </div>
        </div>
      </div>

      {/* Main Performance Chart & Hermes Swarm Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-Year Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Historical Financial Trajectory</h3>
              <p className="text-xs text-slate-400">Turnover, Gross Margin & Operating Profit (€ Millions)</p>
            </div>
            <button
              onClick={() => setCurrentView('income_statement')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>Full P&L</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `€${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: number) => [`€${val.toLocaleString()}M`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="turnover" name="Turnover" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="grossProfit" name="Gross Profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="operatingProfit" name="Operating Profit (EBIT)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hermes Swarm Agent Status Widget */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Hermes Swarm Status</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                99.4%
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Autonomous 6-agent verification pipeline continuously cross-reconciling row math, footnote matrices, and ISO currency scalars.
            </p>

            <div className="space-y-2.5">
              {swarmAgents.slice(0, 4).map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-850 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[11px] font-bold text-cyan-400">
                      {agent.avatar}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-200">{agent.name}</div>
                      <div className="text-[10px] text-slate-500">{agent.checksCount} checks executed</div>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-mono font-medium">{agent.confidence}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentView('hermes_swarm')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition text-center cursor-pointer"
            >
              Open Hermes Swarm Console
            </button>
          </div>
        </div>
      </div>

      {/* Audit Findings & Copilot Prompt Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Findings Box */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Active Audit & Footnote Findings</h3>
            </div>
            <button
              onClick={() => setCurrentView('audit_findings')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View all ({findings.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {unresolved.map((finding) => (
              <div
                key={finding.id}
                className="p-3 rounded-lg bg-slate-850 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {finding.category}
                      </span>
                      <span className="text-xs font-semibold text-white">{finding.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{finding.impactDescription}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                      <span>Source: <strong className="text-slate-400">{finding.evidenceSource}</strong> (p. {finding.page})</span>
                      <span>•</span>
                      <span>Period: {finding.affectedPeriods.join(', ')}</span>
                    </div>
                  </div>
                  {finding.discrepancyAmount !== undefined && (
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-amber-400">
                        Δ €{finding.discrepancyAmount}M
                      </div>
                      <div className="text-[10px] text-slate-500">variance</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eve Copilot Quick Launch Card */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Eve Forensic Accounting Copilot</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Ask deep questions about footnote reconciliations, IFRS 16 lease restatements, working capital swings, or auto-draft audit committee memos.
            </p>

            <div className="space-y-2 mt-4">
              <button
                onClick={() => setIsCopilotOpen(true)}
                className="w-full text-left p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition cursor-pointer"
              >
                "Explain the €14M variance in Note 15 leases"
              </button>
              <button
                onClick={() => setIsCopilotOpen(true)}
                className="w-full text-left p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition cursor-pointer"
              >
                "Verify balance sheet equation and covenant ratios"
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsCopilotOpen(true)}
            className="w-full mt-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-600/20 transition cursor-pointer"
          >
            Launch Copilot Consultation
          </button>
        </div>
      </div>
    </div>
  );
};
