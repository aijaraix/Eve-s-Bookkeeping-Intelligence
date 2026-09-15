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
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const selectedAgent = agents.find(agent => agent.id === selectedAgentId) || null;
  const measuredPercent = (value: number | null) => value == null ? 'Not measured' : `${value}%`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <EvePageHeader
        category="Eve Intelligence"
        title="Eve Intelligence Center & Swarm Architecture"
        description="Recorded agent status and measurements. Missing execution evidence remains unmeasured."
      />

      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-indigo-500/40">
        <h4 className="text-sm font-bold">Academy evaluation: Not measured</h4>
        <p className="text-xs text-slate-300 mt-1">No recorded Academy activity is supplied by this agent view. Opening this page does not start a case.</p>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {agents.map((agent) => (
          <EveCard
            key={agent.id}
            className={`hover:border-indigo-300 transition-all cursor-pointer ${
              selectedAgent?.id === agent.id ? 'border-indigo-600 ring-2 ring-indigo-500/20' : ''
            }`}
            onClick={() => setSelectedAgentId(agent.id)}
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
                <EveStatusBadge status={agent.status === 'ACTIVE' ? 'running' : 'pending'} size="sm" />
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {agent.charter}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Model: <strong className="text-slate-800">{agent.modelTier}</strong></span>
                <span className="text-emerald-600 font-bold">{measuredPercent(agent.successRatePct)} success</span>
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
            <EveStatusBadge status={selectedAgent.status === 'ACTIVE' ? 'running' : 'pending'} />
          </EveCardHeader>

          <EveCardContent className="p-5 space-y-4 text-xs">
            <p>Last activity: {selectedAgent.lastActivityAt || 'No recorded activity'}</p>
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
                <span className="font-bold text-slate-900">{selectedAgent.recentTasksCount ?? 'Not measured'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Success Rate</span>
                <span className="font-bold text-emerald-600">{measuredPercent(selectedAgent.successRatePct)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Academy Competency</span>
                <span className="font-bold text-slate-900">{measuredPercent(selectedAgent.academyCompetencyScore)}</span>
              </div>
            </div>
          </EveCardContent>
        </EveCard>
      )}
    </div>
  );
};
