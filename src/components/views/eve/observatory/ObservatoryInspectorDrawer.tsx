import React from 'react';
import { X, Bot, Activity, ShieldCheck, Cpu, Database, CheckCircle2, AlertTriangle, ArrowRight, Zap, Terminal, FileText, Layers } from 'lucide-react';
import { ObservatoryAgent, ObservatoryPathway, ObservatoryEventItem } from './ObservatoryTypes';

export interface ObservatoryInspectorDrawerProps {
  selection: {
    type: 'AGENT' | 'PATHWAY' | 'HEARTBEAT' | 'EVENT' | 'SERVICE';
    data: any;
  } | null;
  onClose: () => void;
  onNavigateToTwin?: (twinId: string) => void;
}

export const ObservatoryInspectorDrawer: React.FC<ObservatoryInspectorDrawerProps> = ({
  selection,
  onClose,
  onNavigateToTwin
}) => {
  if (!selection) return null;

  const { type, data } = selection;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900/95 backdrop-blur-md border-l border-slate-700/80 shadow-2xl z-50 flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          {type === 'AGENT' && <Bot className="w-5 h-5 text-indigo-400" />}
          {type === 'PATHWAY' && <Activity className="w-5 h-5 text-cyan-400" />}
          {type === 'HEARTBEAT' && <Zap className="w-5 h-5 text-emerald-400" />}
          {type === 'EVENT' && <Terminal className="w-5 h-5 text-amber-400" />}
          {type === 'SERVICE' && <Cpu className="w-5 h-5 text-purple-400" />}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              {type === 'AGENT' ? `${data.name} Inspector` : `${type} Inspector`}
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {type === 'AGENT' ? data.title : 'Live Runtime Telemetry'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-300 font-sans">
        {/* AGENT INSPECTION */}
        {type === 'AGENT' && (
          <div className="space-y-5">
            {/* Status & Identity Card */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    {data.name}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {data.agentId}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">{data.role}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                    data.operationalStatus === 'WORKING'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                      : 'bg-slate-700/60 text-slate-300 border border-slate-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${data.operationalStatus === 'WORKING' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                  {data.operationalStatus || 'AVAILABLE'}
                </span>
              </div>

              {/* Current Task Objective */}
              <div className="pt-2 border-t border-slate-700/50">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Current Active Objective</span>
                <p className="text-xs text-white bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 leading-relaxed font-mono">
                  {data.currentTaskObjective || 'Standing by for continuous autonomous learning tasks.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-mono">
                <div className="p-2 bg-slate-900/60 rounded border border-slate-700/50">
                  <span className="text-slate-400 block text-[10px]">Model Tier</span>
                  <span className="font-bold text-indigo-300">{data.preferredModelTier || 'Deterministic Level 0'}</span>
                </div>
                <div className="p-2 bg-slate-900/60 rounded border border-slate-700/50">
                  <span className="text-slate-400 block text-[10px]">Success Rate</span>
                  <span className="font-bold text-emerald-400">{((data.successRate || 1.0) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Permanent Operational Charter */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Permanent Operational Charter
              </h5>
              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2 text-[11px] leading-relaxed text-slate-300">
                {Array.isArray(data.charter) ? (
                  data.charter.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-mono font-bold mt-0.5">•</span>
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <p>{data.charter || data.mission || 'Autonomous CPA partner operations.'}</p>
                )}
              </div>
            </div>

            {/* Measured Competencies */}
            {data.competencyScores && (
              <div className="space-y-2.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Measured Competency Dimensions (0.0 - 1.0)
                </h5>
                <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2 font-mono text-[11px]">
                  {Object.entries(data.competencyScores).map(([key, val]) => {
                    const score = Number(val) || 0;
                    const pct = Math.round(score * 100);
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-cyan-400 font-bold">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Allowed & Prohibited Tools */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Tool Boundary & Least-Privilege Policy
              </h5>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-lg">
                  <span className="text-emerald-400 font-bold block mb-1.5">Authorized Tools ({data.allowedTools?.length || 0})</span>
                  <ul className="space-y-1 text-slate-300">
                    {(data.allowedTools || ['deterministic_math', 'read_ledger']).slice(0, 4).map((t: string) => (
                      <li key={t} className="truncate">• {t}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-2.5 bg-rose-950/30 border border-rose-800/40 rounded-lg">
                  <span className="text-rose-400 font-bold block mb-1.5">Prohibited Tools</span>
                  <ul className="space-y-1 text-slate-400">
                    {(data.prohibitedTools || ['modify_source_docs', 'bypass_sentinel']).slice(0, 4).map((t: string) => (
                      <li key={t} className="truncate">• {t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Learning Cases */}
            {data.learningCases && data.learningCases.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Recorded Learning Cases ({data.learningCases.length})
                </h5>
                <div className="space-y-2">
                  {data.learningCases.map((lc: any) => (
                    <div key={lc.caseId} className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 text-[11px] space-y-1">
                      <div className="flex justify-between items-center font-mono">
                        <span className="font-bold text-amber-300">{lc.caseId}</span>
                        <span className="text-[10px] text-slate-400">{new Date(lc.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-300"><strong className="text-slate-200">Root Cause:</strong> {lc.rootCause}</p>
                      <p className="text-emerald-400"><strong className="text-slate-200">Remedy:</strong> {lc.remedyApplied}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PATHWAY INSPECTION */}
        {type === 'PATHWAY' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase">
                <span>{data.sourceAgentName || data.sourceAgentId}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span>{data.targetAgentName || data.targetAgentId}</span>
              </div>
              <p className="text-sm font-bold text-white">{data.signalType}</p>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
                {data.description}
              </p>
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-700/50">
                <span>Timestamp: {new Date(data.timestamp).toLocaleTimeString()}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {data.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* HEARTBEAT INSPECTION */}
        {type === 'HEARTBEAT' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Hermes Autonomous Pulse
                </h4>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  #{data.heartbeatSequence}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2 bg-slate-900/60 rounded border border-slate-700/50">
                  <span className="text-slate-400">Academy Mode State:</span>
                  <span className="font-bold text-white">{data.academyState || 'RUNNING'}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900/60 rounded border border-slate-700/50">
                  <span className="text-slate-400">Customer Priority Queue:</span>
                  <span className="font-bold text-emerald-400">{data.customerQueueState?.pendingJobs || 0} Pending Jobs</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900/60 rounded border border-slate-700/50">
                  <span className="text-slate-400">Hardware Profile:</span>
                  <span className="font-bold text-slate-200">{data.resourceSnapshot?.hardwareProfile || '4 vCPU, 16 GB RAM'}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900/60 rounded border border-slate-700/50">
                  <span className="text-slate-400">RAM Allocation:</span>
                  <span className="font-bold text-cyan-400">{data.resourceSnapshot?.ramFreeMb || 3317} MB Free / 4,096 MB Total</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900/60 rounded border border-slate-700/50">
                  <span className="text-slate-400">Persistent Disk Storage:</span>
                  <span className="font-bold text-cyan-400">{data.resourceSnapshot?.diskFreeGb || 755} GB Free</span>
                </div>
              </div>

              {data.lastDecision && (
                <div className="pt-2 border-t border-slate-700/60">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Last Autonomous Decision</span>
                  <p className="text-xs text-white bg-slate-900/90 p-2.5 rounded border border-slate-700/70 font-mono">
                    [{data.lastDecision.action}] {data.lastDecision.reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EVENT INSPECTION */}
        {type === 'EVENT' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  {data.eventType}
                </span>
                <span className="text-[10px] text-slate-400">{new Date(data.timestamp).toLocaleString()}</span>
              </div>
              <h4 className="text-sm font-bold text-white">{data.summary}</h4>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/60 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Event ID:</span>
                  <span className="text-slate-200">{data.eventId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Source:</span>
                  <span className="text-slate-200">{data.sourceId} ({data.sourceType})</span>
                </div>
                {data.targetId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target:</span>
                    <span className="text-slate-200">{data.targetId}</span>
                  </div>
                )}
                {data.engagementId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Engagement:</span>
                    <span className="text-indigo-400">{data.engagementId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-bold">{data.status}</span>
                </div>
              </div>

              {data.structuredMetadata && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Structured Metadata</span>
                  <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[10px] text-slate-300 overflow-x-auto">
                    {JSON.stringify(data.structuredMetadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
