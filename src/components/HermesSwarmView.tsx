import React, { useState } from 'react';
import { usePractice } from '../context/PracticeContext';
import {
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Terminal,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

const mockLogs = [
  '[Hermes.Orchestrator] Initializing multi-agent verification pipeline v2.4.1...',
  '[ArithmeticReconciler] Auditing Row Sums: Income Statement (Turnover - COGS = Gross Profit: €26,692M) [PASS 100%]',
  '[ArithmeticReconciler] Operating Margin Check (10,387 / 60,812 = 17.08%) [PASS]',
  '[ScaleVerifier] Detecting units across 2022-2024 annual reports. Magnitude: Millions EUR [PASS]',
  '[ScaleVerifier] Normalized Note 12 Inventories: €5,630M confirmed [PASS]',
  '[CurrencyVerifier] Validating ISO currency symbols: EUR primary, GBP/USD reporting footnotes tagged [PASS]',
  '[DiscrepancyAuditor] Cross-referencing Note 15 Lease Liabilities with prior year comparative... Flagging Δ €14M variance (restated for IFRS 16) [ADVISORY LOGGED]',
  '[BackfillAgent] Imputing Non-Controlling Interest share: €382M derived mathematically [PASS 99.2%]',
  '[SourceAuthorityRanker] Ranking primary statements against disclosure notes: Note 15 Audited Footnote elevated above prior un-restated comparative [RESOLVED]',
  '[Hermes.Orchestrator] Pipeline Pass Complete: 1,080 checks executed. 0 blocking errors. Integrity Score: 99.4%',
];

export const HermesSwarmView: React.FC = () => {
  const { swarmAgents, isSwarmRunning, runSwarmPass } = usePractice();
  const [activeTab, setActiveTab] = useState<'agents' | 'console'>('agents');

  return (
    <div id="hermes-swarm-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Hermes Autonomous Swarm Verifier</h1>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
              6 Agents Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic multi-agent verification matrix cross-auditing mathematical integrity, footnote alignment, and scale provenance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="run-swarm-btn"
            onClick={runSwarmPass}
            disabled={isSwarmRunning}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-600/20 transition cursor-pointer"
          >
            {isSwarmRunning ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Verification Matrix...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run Full Verification Pass</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Swarm Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Verification Health</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">99.4%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">High Confidence Standard</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Checks Executed</div>
          <div className="text-2xl font-bold text-white mt-1">1,080</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across 4 Financial Statements</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Discrepancies Detected</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">3</div>
          <div className="text-[11px] text-slate-500 mt-0.5">1 Material, 2 Advisory</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Latency / Throughput</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">412 ms</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Concurrent Agent Execution</div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
            activeTab === 'agents' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Specialized Agents ({swarmAgents.length})
        </button>
        <button
          onClick={() => setActiveTab('console')}
          className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'console' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Swarm Execution Telemetry & Logs</span>
        </button>
      </div>

      {/* Agents Grid */}
      {activeTab === 'agents' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {swarmAgents.map((agent) => (
            <div key={agent.id} className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-sm text-cyan-400">
                      {agent.avatar}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                      <div className="text-[11px] text-slate-400 font-mono">Last run: {agent.lastExecution}</div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                    {agent.confidence}%
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">{agent.role}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">{agent.checksCount} checks passed</span>
                {agent.discrepanciesFound > 0 ? (
                  <span className="text-amber-400 font-semibold">{agent.discrepanciesFound} finding detected</span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>0 Discrepancies</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Console Log Stream */
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Hermes Swarm Streaming Telemetry Log</span>
            </div>
            <span className="text-[11px] text-slate-500">Auto-scroll enabled</span>
          </div>

          <div className="space-y-2 text-slate-300 max-h-96 overflow-y-auto">
            {mockLogs.map((log, i) => (
              <div
                key={i}
                className={`py-1 px-2 rounded ${
                  log.includes('ADVISORY')
                    ? 'bg-amber-950/30 text-amber-300 border border-amber-900/40'
                    : log.includes('RESOLVED')
                    ? 'bg-emerald-950/30 text-emerald-300'
                    : 'text-slate-300'
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
