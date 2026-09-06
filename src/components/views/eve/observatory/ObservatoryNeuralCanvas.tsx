import React, { useState } from 'react';
import { Bot, Cpu, Database, Activity, Zap, FileText, ArrowRight, ShieldCheck, CheckCircle2, Globe, Layers, AlertCircle } from 'lucide-react';
import { ObservatoryAgent, ObservatoryPathway } from './ObservatoryTypes';

export interface ObservatoryNeuralCanvasProps {
  agents: ObservatoryAgent[];
  activePathways: ObservatoryPathway[];
  heartbeatState: any;
  currentEngagement: any;
  onSelectAgent: (agent: ObservatoryAgent) => void;
  onSelectPathway: (pathway: ObservatoryPathway) => void;
  onSelectHeartbeat: () => void;
  onSelectService: (serviceKey: string) => void;
}

export const ObservatoryNeuralCanvas: React.FC<ObservatoryNeuralCanvasProps> = ({
  agents = [],
  activePathways = [],
  heartbeatState,
  currentEngagement,
  onSelectAgent,
  onSelectPathway,
  onSelectHeartbeat,
  onSelectService
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Group agents into functional clusters
  const orchestrator = agents.find(a => a.agentId === 'eve-hermes') || {
    agentId: 'eve-hermes',
    name: 'Hermes',
    role: 'Managing Partner / Orchestrator',
    operationalStatus: 'WORKING',
    title: 'Lead Partner'
  };

  const lineAuditors = agents.filter(a => ['eve-athena', 'eve-ledger', 'eve-veritas', 'eve-euclid', 'eve-quinn'].includes(a.agentId));
  const clientAndQuality = agents.filter(a => ['eve-clara', 'eve-sentinel', 'eve-scribe'].includes(a.agentId));
  const specialists = agents.filter(a => ['eve-atlas', 'eve-mercury', 'eve-argus', 'eve-lexicon', 'eve-darwin', 'eve-minerva'].includes(a.agentId));

  return (
    <div className="relative w-full h-[650px] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col select-none">
      {/* Canvas Top Bar / Telemetry Strip */}
      <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div
            onClick={onSelectHeartbeat}
            className="flex items-center gap-2 px-3 py-1 bg-emerald-950/40 border border-emerald-800/50 rounded-lg cursor-pointer hover:bg-emerald-900/40 transition-colors"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-300">
              Heartbeat #{heartbeatState?.heartbeatSequence || 584}
            </span>
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>Status: <strong className="text-white">{heartbeatState?.academyState || 'RUNNING'}</strong></span>
            <span>•</span>
            <span>Queue: <strong className="text-emerald-400">{heartbeatState?.customerQueueState?.pendingJobs || 0} Priority Jobs</strong></span>
          </div>
        </div>

        {/* Current Active Twin Badge */}
        {currentEngagement && (
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-950/40 border border-indigo-800/50 rounded-lg text-xs font-mono">
            <span className="text-indigo-400">Active Benchmark:</span>
            <strong className="text-white truncate max-w-[200px]">
              {currentEngagement.clientName || 'AeroTech Dynamics GmbH'}
            </strong>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-bold">
              {currentEngagement.currentStage || 'EVIDENCE_REVIEW'}
            </span>
          </div>
        )}
      </div>

      {/* Main Interactive Organism Canvas Grid */}
      <div className="relative flex-1 p-6 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-y-auto">
        {/* Left Column: External World & Memory Region */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* External World */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Globe className="w-3.5 h-3.5" /> External World
              </span>
              <span className="text-[10px] text-emerald-400">Connected</span>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Synthetic Client</span>
                <span className="text-indigo-300 font-bold text-[11px]">Maria von Braun (CFO)</span>
              </div>
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Public Regulatory Filings</span>
                <span className="text-slate-400 text-[11px]">SEC EDGAR & IFRS</span>
              </div>
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">PBC Channel</span>
                <span className="text-emerald-400 font-bold text-[11px]">CLEARED (v2.0)</span>
              </div>
            </div>
          </div>

          {/* Memory Region */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                <Database className="w-3.5 h-3.5" /> Memory Region
              </span>
              <span className="text-[10px] text-slate-400">Durable Disk</span>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Working Memory</span>
                <span className="text-purple-300 font-bold text-[11px]">eng-sim-canary-01</span>
              </div>
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Episodic Memory</span>
                <span className="text-slate-300 text-[11px]">17 Sealed Cases</span>
              </div>
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Firm Shared Memory</span>
                <span className="text-emerald-400 font-bold text-[11px]">Zero Leakage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center 2 Columns: Central CPA Cortex */}
        <div className="md:col-span-2 flex flex-col justify-center items-center relative space-y-6">
          {/* Active Synaptic Pulse Lines (Visual Neural Circuit) */}
          <div className="w-full text-center space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
              Autonomous CPA Cortex
            </span>
            <h3 className="text-sm font-bold text-white tracking-wide">
              15 Named Persistent CPA Agents
            </h3>
          </div>

          {/* Central Hermes Node */}
          <div
            onClick={() => onSelectAgent(orchestrator as any)}
            className="group relative cursor-pointer transform hover:scale-105 transition-all"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300 animate-pulse" />
            <div className="relative px-6 py-4 bg-slate-900 rounded-2xl border-2 border-indigo-400/80 shadow-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg">
                H
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white font-mono">HERMES</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    MANAGING PARTNER
                  </span>
                </div>
                <p className="text-xs text-slate-300">Swarm Orchestration & Continuous Academy</p>
              </div>
            </div>
          </div>

          {/* Core Swarm Agent Nodes (Grid) */}
          <div className="w-full grid grid-cols-3 gap-3 font-mono">
            {/* Lead Line Agents */}
            {lineAuditors.map(agent => (
              <div
                key={agent.agentId}
                onClick={() => onSelectAgent(agent)}
                className={`p-3 rounded-xl bg-slate-900/80 border transition-all cursor-pointer hover:border-indigo-400 hover:bg-slate-800/90 ${
                  agent.operationalStatus === 'WORKING'
                    ? 'border-indigo-500/80 ring-1 ring-indigo-500/30'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{agent.name}</span>
                  <span className={`w-2 h-2 rounded-full ${agent.operationalStatus === 'WORKING' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                </div>
                <p className="text-[10px] text-slate-400 truncate">{agent.role}</p>
                <div className="mt-2 flex justify-between items-center text-[9px] text-slate-500">
                  <span>{agent.preferredModelTier?.split('_')[1] || 'L0'}</span>
                  <span className="text-emerald-400 font-bold">100%</span>
                </div>
              </div>
            ))}

            {/* Client & Governance Agents */}
            {clientAndQuality.map(agent => (
              <div
                key={agent.agentId}
                onClick={() => onSelectAgent(agent)}
                className={`p-3 rounded-xl bg-slate-900/80 border transition-all cursor-pointer hover:border-cyan-400 hover:bg-slate-800/90 ${
                  agent.operationalStatus === 'WORKING'
                    ? 'border-cyan-500/80 ring-1 ring-cyan-500/30'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{agent.name}</span>
                  <span className={`w-2 h-2 rounded-full ${agent.operationalStatus === 'WORKING' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                </div>
                <p className="text-[10px] text-slate-400 truncate">{agent.role}</p>
                <div className="mt-2 flex justify-between items-center text-[9px] text-slate-500">
                  <span>{agent.preferredModelTier?.split('_')[1] || 'L0'}</span>
                  <span className="text-cyan-400 font-bold">Passed</span>
                </div>
              </div>
            ))}

            {/* Specialists & Evolution */}
            {specialists.slice(0, 3).map(agent => (
              <div
                key={agent.agentId}
                onClick={() => onSelectAgent(agent)}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-400 transition-all cursor-pointer hover:bg-slate-800/90"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{agent.name}</span>
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                </div>
                <p className="text-[10px] text-slate-400 truncate">{agent.role}</p>
                <div className="mt-2 flex justify-between items-center text-[9px] text-slate-500">
                  <span>{agent.preferredModelTier?.split('_')[1] || 'L1'}</span>
                  <span className="text-purple-400 font-bold">Standby</span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Synaptic Pathways Bar */}
          <div className="w-full space-y-1.5 font-mono">
            <span className="text-[10px] uppercase text-slate-400 tracking-wider font-bold block">
              Active Inter-Agent Pathways & Signal Handoffs ({activePathways.length})
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
              {activePathways.map(pw => (
                <div
                  key={pw.id}
                  onClick={() => onSelectPathway(pw)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-[11px] flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
                >
                  <span className="text-indigo-400 font-bold">{pw.sourceAgentName}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-cyan-400 font-bold">{pw.targetAgentName}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold">
                    {pw.signalType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Intelligence & Infrastructure Services */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Intelligence Region (Model Routing) */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Cpu className="w-3.5 h-3.5" /> Model Router Tiers
              </span>
              <span className="text-[10px] text-slate-400">Least-Cost</span>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Tier 0 Deterministic</span>
                <span className="text-emerald-400 font-bold text-[11px]">Euclid / Scribe</span>
              </div>
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Tier 1 Local Qwen</span>
                <span className="text-indigo-400 font-bold text-[11px]">15ms Latency</span>
              </div>
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Tier 2 Economical Cloud</span>
                <span className="text-slate-400 text-[11px]">Gemini Flash</span>
              </div>
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Tier 3 Strong Cloud</span>
                <span className="text-slate-400 text-[11px]">Gemini Pro</span>
              </div>
            </div>
          </div>

          {/* Infrastructure & Output Deliverables */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <FileText className="w-3.5 h-3.5" /> Output Deliverables
              </span>
              <span className="text-[10px] text-emerald-400">Certified</span>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Certified PDF Audit Report</span>
                <span className="text-emerald-400 font-bold text-[11px]">SHA-256 Verified</span>
              </div>
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Certified XLSX Workbook</span>
                <span className="text-emerald-400 font-bold text-[11px]">Lead Schedules</span>
              </div>
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">Attestation Dashboard</span>
                <span className="text-indigo-400 font-bold text-[11px]">Zero Drift</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
