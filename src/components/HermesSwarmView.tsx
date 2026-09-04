import React from 'react';
import { Cpu, Zap } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';

export const HermesSwarmView: React.FC = () => {
  const { swarmStatus, queueJobs, hasFacts, companies, selectedCompanyId } = usePractice();
  const company = companies.find((c) => c.id === selectedCompanyId);
  const agents = Array.isArray(swarmStatus?.agents) ? swarmStatus.agents : [];
  const logs = Array.isArray(swarmStatus?.logs)
    ? swarmStatus.logs
    : Array.isArray(swarmStatus?.events)
      ? swarmStatus.events
      : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Hermes Autonomous AI Audit Agent Swarm</h2>
        <p className="text-xs text-slate-500 mt-1">
          {company?.name || EMPTY_DISPLAY} • live /api/swarm/status · {queueJobs.length} queue job{queueJobs.length === 1 ? '' : 's'}
        </p>
      </div>

      {agents.length === 0 && logs.length === 0 ? (
        <EmptyExtractionState title="Swarm idle" detail="No identity checks are simulated. Telemetry appears when hybrid extraction is running." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {agents.map((ag: any, idx: number) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">{ag.name || ag.agent || `Agent ${idx + 1}`}</span>
                </div>
                <p className="text-xs text-slate-500">{ag.desc || ag.detail || ag.status || EMPTY_DISPLAY}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-100 space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase">REAL-TIME AGENT TELEMETRY</span>
            </div>
            {logs.map((log: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="text-slate-500">{log.time || log.timestamp || EMPTY_DISPLAY}</span>
                <span className="text-blue-400 font-bold">[{log.agent || 'swarm'}]</span>
                <span className="text-slate-200">{log.log || log.detail || log.message}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
