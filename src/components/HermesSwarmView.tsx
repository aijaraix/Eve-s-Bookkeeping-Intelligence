import React from 'react';
import { Cpu, CheckCircle2, AlertCircle, RefreshCw, Zap, ShieldCheck, Activity } from 'lucide-react';

export const HermesSwarmView: React.FC = () => {
  const agents = [
    { name: 'Agent 1: OCR & Layout Parser', status: 'ACTIVE', load: '12%', processed: '184 / 184 Pages', desc: 'Parses tabular structures, PDF page coordinates, and image tokens.' },
    { name: 'Agent 2: Fact Extraction Engine', status: 'ACTIVE', load: '24%', processed: '342 Facts Extracted', desc: 'Extracts line items, scales (Millions), and currency signatures.' },
    { name: 'Agent 3: Fundamental Reconciler', status: 'ACTIVE', load: '5%', processed: '0 Variances Detected', desc: 'Verifies Assets = Liabilities + Equity identity and Income Statement arithmetic.' },
    { name: 'Agent 4: Compliance & Audit Inspector', status: 'ACTIVE', load: '18%', processed: 'IFRS & SEC Standards Passed', desc: 'Checks GAAP/IFRS notes disclosures, auditor opinions, and signoffs.' }
  ];

  const logs = [
    { time: '13:25:41', agent: 'Agent 1', log: 'OCR scan verified for page 142 (Consolidated Income Statement).' },
    { time: '13:25:42', agent: 'Agent 2', log: 'Fact "Turnover" extracted: €50,503M (Confidence: 99.8%).' },
    { time: '13:25:43', agent: 'Agent 3', log: 'Identity Check PASSED: €70,471M = €48,920M + €21,551M.' },
    { time: '13:25:45', agent: 'Agent 4', log: 'Auditor Opinion (PwC) confirmed clean & unqualified.' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Hermes Autonomous AI Audit Agent Swarm</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              4 Agents Operational
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-Time Audit Intelligence Processing Stream for Unilever PLC
          </p>
        </div>

        <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-Run Swarm Inspection</span>
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {agents.map((ag, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900">{ag.name}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {ag.status}
              </span>
            </div>

            <p className="text-xs text-slate-500">{ag.desc}</p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div>Load: <span className="font-bold text-blue-600">{ag.load}</span></div>
              <div>Output: <span className="font-bold text-slate-900">{ag.processed}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Activity Terminal Log */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-100 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              REAL-TIME AGENT TELEMETRY & AUDIT STREAM
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Stream Status: Connected</span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-slate-500">{log.time}</span>
              <span className="text-blue-400 font-bold">[{log.agent}]</span>
              <span className="text-slate-200">{log.log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
