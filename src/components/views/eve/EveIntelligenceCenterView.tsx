import React, { useState } from 'react';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import { NamedCpaAgentPresentation } from '../../../types/presentationModels';
import { Cpu, Bot, Activity, Sparkles, ShieldCheck, CheckCircle2, GraduationCap, ArrowRight } from 'lucide-react';

export interface EveIntelligenceCenterViewProps {
  agents: NamedCpaAgentPresentation[];
  onNavigate: (viewId: string) => void;
}

export const EveIntelligenceCenterView: React.FC<EveIntelligenceCenterViewProps> = ({
  agents = [],
  onNavigate
}) => {
  const [selectedAgent, setSelectedAgent] = useState<NamedCpaAgentPresentation | null>(null);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <EvePageHeader
        category="Eve Intelligence"
        title="Eve Intelligence Center & Swarm Architecture"
        description="Live status, charters, and real-time execution logs for the 13 Named CPA Agents."
      />

      {/* Live Hermes Academy Compact Pulse Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">Hermes Academy</span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">
              AeroTech Dynamics GmbH (Academy Benchmark Case)
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-300 mt-1">
              <span>Stage: <strong className="text-white">Evidence Review / Deliverable Cleared</strong></span>
              <span>•</span>
              <span>Working Agents: <strong className="text-cyan-300">7 Active</strong></span>
              <span>•</span>
              <span>Outstanding PBC: <strong className="text-emerald-400">0 (1 Cleared)</strong></span>
              <span>•</span>
              <span>Next: <strong className="text-indigo-300">START_NEW_CASE</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('eve-academy')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <span>Open Live Observatory</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {agents.map((agent) => (
          <EveCard
            key={agent.id}
            className={`hover:border-indigo-300 transition-all cursor-pointer ${
              selectedAgent?.id === agent.id ? 'border-indigo-600 ring-2 ring-indigo-500/20' : ''
            }`}
            onClick={() => setSelectedAgent(agent)}
          >
            <EveCardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${agent.avatarColor} text-white font-bold flex items-center justify-center text-xs shadow-xs`}>
                    {agent.callsign.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{agent.callsign}</h4>
                    <p className="text-[10px] text-slate-400 font-mono uppercase">{agent.role}</p>
                  </div>
                </div>
                <EveStatusBadge status={agent.status === 'ACTIVE' ? 'running' : 'clean'} size="sm" />
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {agent.charter}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Model: <strong className="text-slate-800">{agent.modelTier}</strong></span>
                <span className="text-emerald-600 font-bold">{agent.successRatePct}% Success</span>
              </div>
            </EveCardContent>
          </EveCard>
        ))}
      </div>

      {/* Selected Agent Details */}
      {selectedAgent && (
        <EveCard className="border-indigo-200 bg-indigo-50/20">
          <EveCardHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${selectedAgent.avatarColor} text-white font-bold flex items-center justify-center text-sm`}>
                {selectedAgent.callsign.substring(0, 2)}
              </div>
              <div>
                <EveCardTitle>{selectedAgent.name} ({selectedAgent.callsign})</EveCardTitle>
                <p className="text-xs text-slate-500 font-mono">{selectedAgent.role}</p>
              </div>
            </div>
            <EveStatusBadge status={selectedAgent.status === 'ACTIVE' ? 'running' : 'clean'} />
          </EveCardHeader>

          <EveCardContent className="p-5 space-y-4 text-xs">
            <div>
              <span className="font-bold text-slate-700 block mb-1">Charter & Responsibilities</span>
              <p className="text-slate-600 leading-relaxed">{selectedAgent.charter}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-slate-200 font-mono">
              <div>
                <span className="text-slate-400 block text-[11px]">Model Tier</span>
                <span className="font-bold text-slate-900">{selectedAgent.modelTier}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tasks Executed</span>
                <span className="font-bold text-slate-900">{selectedAgent.recentTasksCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Success Rate</span>
                <span className="font-bold text-emerald-600">{selectedAgent.successRatePct}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Academy Competency</span>
                <span className="font-bold text-slate-900">{selectedAgent.academyCompetencyScore}%</span>
              </div>
            </div>
          </EveCardContent>
        </EveCard>
      )}
    </div>
  );
};
