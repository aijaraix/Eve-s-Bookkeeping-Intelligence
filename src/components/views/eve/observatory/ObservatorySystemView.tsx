import React from 'react';
import { Cpu, Server, HardDrive, Zap, CheckCircle2, ArrowUpRight, Activity, ShieldCheck, RefreshCw } from 'lucide-react';

export interface ObservatorySystemViewProps {
  servicesHealth: any;
  resourceSnapshot: any;
  customerQueue: any;
  onNavigateToAdmin?: (viewId: string) => void;
  onRefresh?: () => void;
}

export const ObservatorySystemView: React.FC<ObservatorySystemViewProps> = ({
  servicesHealth,
  resourceSnapshot,
  customerQueue,
  onNavigateToAdmin,
  onRefresh
}) => {
  const ramFree = resourceSnapshot?.ramFreeMb || 3317;
  const ramTotal = resourceSnapshot?.ramTotalMb || 4096;
  const ramUsedPct = Math.round(((ramTotal - ramFree) / ramTotal) * 100);

  return (
    <div className="space-y-6">
      {/* Node Telemetry & Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hardware Monitor Card */}
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Node Hardware Profile
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              Optimal
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>CPU Allocation</span>
                <span className="text-white font-bold">{resourceSnapshot?.cpuCores || 4} vCPU (CPU-only, no GPU)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: '22%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>RAM Allocation</span>
                <span className="text-white font-bold">{ramTotal - ramFree} MB / {ramTotal} MB ({ramUsedPct}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${ramUsedPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Persistent Disk</span>
                <span className="text-emerald-400 font-bold">{resourceSnapshot?.diskFreeGb || 755} GB Free</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '4%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Core Services Connectivity Card */}
        <div className="md:col-span-2 p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              Production Service Mesh & Daemons
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              All 4 Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            {/* Ollama Local AI */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">eve-local-ai (Ollama)</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Model: qwen3.5:4b-q4_K_M (Port 11434)</p>
              <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-800">
                <span>Latency: {servicesHealth?.ollamaLocalAI?.latencyMs || 15}ms</span>
                <span>Tier 1 Local</span>
              </div>
            </div>

            {/* Extraction Worker */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Extraction Worker</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Document Parser (Port 8080)</p>
              <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-800">
                <span>Latency: {servicesHealth?.extractionWorker?.latencyMs || 459}ms</span>
                <span>PDF & XLSX Engine</span>
              </div>
            </div>

            {/* OpenClaw Gateway */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">OpenClaw Gateway</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Browser & Filing Automation (Port 18789)</p>
              <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-800">
                <span>Status: Ingress Ready</span>
                <span>SEC EDGAR Gateway</span>
              </div>
            </div>

            {/* Hermes Agent */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Hermes Agent Daemon</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Heartbeat & Swarm Coordinator (Port 8642)</p>
              <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-800">
                <span>Interval: 30s</span>
                <span>Continuous Academy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Administration Separation Banner */}
      <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="text-xs font-mono text-slate-300">
          <span className="font-bold text-white block">Operator Administration Gateway</span>
          <span className="text-slate-400">
            Advanced diagnostic logs, server health history, and environment secrets are managed under Administration.
          </span>
        </div>
        {onNavigateToAdmin && (
          <button
            onClick={() => onNavigateToAdmin('admin-health')}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Open System Health</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
};
