import React, { useState } from 'react';
import { Bot, ShieldCheck, CheckCircle2, Award, Zap, Layers, AlertCircle, ArrowRight, Activity, TrendingUp } from 'lucide-react';
import { ObservatoryAgent } from './ObservatoryTypes';

export interface AgentCompetencyTabProps {
  agents: ObservatoryAgent[];
  onSelectAgent?: (agent: ObservatoryAgent) => void;
}

export const AgentCompetencyTab: React.FC<AgentCompetencyTabProps> = ({
  agents = [],
  onSelectAgent
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.agentId || 'eve-hermes');

  const selectedAgent = agents.find(a => a.agentId === selectedAgentId) || agents[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl space-y-2">
        <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider block">
          CPA Swarm Competency Architecture
        </span>
        <h3 className="text-base font-bold text-white">
          Empirical Measured Performance vs. Baseline Charter Priors
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Zero-tolerance truth protocol: Baseline charter dimensions establish theoretical specializations, while measured runtime statistics track actual Academy cycle execution and verified operational precision.
        </p>
      </div>

      {/* Main Grid: Left Selector List + Right Deep Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents List (Left Column) */}
        <div className="space-y-2 font-mono text-xs max-h-[600px] overflow-y-auto pr-1">
          {agents.map((agent) => {
            const isSelected = agent.agentId === selectedAgentId;
            return (
              <div
                key={agent.agentId}
                onClick={() => setSelectedAgentId(agent.agentId)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                      {agent.name.substring(0, 2)}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-xs">{agent.name}</h4>
                      <p className="text-[10px] text-slate-400">{agent.role}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      agent.operationalStatus === 'WORKING'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {agent.operationalStatus}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Deep Agent Profile (Right 2 Columns) */}
        {selectedAgent && (
          <div className="lg:col-span-2 space-y-5">
            {/* Header Identity Card */}
            <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-mono">{selectedAgent.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                      {selectedAgent.agentId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedAgent.title}</p>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 block uppercase">Model Routing</span>
                  <span className="text-xs font-bold text-cyan-400">{selectedAgent.preferredModelTier}</span>
                </div>
              </div>

              {/* Mission statement */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-sans text-slate-300 leading-relaxed">
                <strong>Core Mission:</strong> {selectedAgent.mission}
              </div>

              {/* Charter */}
              <div className="space-y-1.5 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                  Operational Responsibilities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans">
                  {selectedAgent.charter?.map((c, i) => (
                    <div key={i} className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-start gap-2">
                      <span className="text-indigo-400 font-mono font-bold">•</span>
                      <span className="text-slate-300">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 1: MEASURED EMPIRICAL OPERATIONAL METRICS */}
            <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-emerald-400 uppercase text-xs tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  MEASURED: Empirical Operational Metrics
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                  REAL RUNTIME STATS
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Jobs Executed</span>
                  <span className="text-lg font-bold text-white">{selectedAgent.jobsCompleted || 0}</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Success Rate</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {Math.round((selectedAgent.successRate || 1.0) * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Escalation Rate</span>
                  <span className="text-lg font-bold text-indigo-300">
                    {Math.round((selectedAgent.escalationRate || 0.0) * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Learning Cases</span>
                  <span className="text-lg font-bold text-cyan-300">{selectedAgent.learningCases?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: BASELINE CHARTER PRIORS */}
            {selectedAgent.competencyScores && (
              <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-cyan-400 uppercase text-xs tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    BASELINE: Charter Specialization Priors (0.0 - 1.0)
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    IMMUTABLE SPEC
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(selectedAgent.competencyScores).map(([dim, val]) => {
                    const score = Number(val) || 0;
                    const pct = Math.round(score * 100);
                    return (
                      <div key={dim} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300 capitalize">{dim.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-cyan-400 font-bold">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tool Whitelist & Guardrails */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider block">
                  Authorized Tools ({selectedAgent.allowedTools?.length || 0})
                </span>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {selectedAgent.allowedTools?.map((t) => (
                    <li key={t} className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <span className="text-rose-400 font-bold uppercase text-[10px] tracking-wider block">
                  Prohibited Actions & Hard Guardrails
                </span>
                <ul className="space-y-1 text-[11px] text-slate-400">
                  {selectedAgent.prohibitedTools?.map((t) => (
                    <li key={t} className="flex items-center gap-1.5 truncate">
                      <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
