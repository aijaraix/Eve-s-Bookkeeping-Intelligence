import React, { useState } from 'react';
import { Workspace, DocumentRecord } from '../../types';
import { Clock, Filter, User, Sparkles, FileText, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ProjectActivityTabProps {
  workspace: Workspace;
  documents: DocumentRecord[];
}

export const ProjectActivityTab: React.FC<ProjectActivityTabProps> = ({
  workspace,
  documents
}) => {
  const [agentFilter, setAgentFilter] = useState('All Actors');

  const activityTrail = [
    { time: '2026-06-07 14:32:05', actor: 'Sarah Johnson', role: 'Human Audit Manager', action: 'Uploaded Source File', object: `${(workspace.name || 'Client').replace(/\s+/g, '_')}_Annual_Report.pdf`, oldVal: '—', newVal: '14.8 MB PDF', reason: 'Annual reporting submission' },
    { time: '2026-06-07 14:32:40', actor: 'Eve Extraction Engine', role: 'AI Agent', action: 'Extracted Financial Fact', object: 'Revenue Line Item', oldVal: '—', newVal: '€59,600,000,000', reason: 'OCR & Vision parsing complete' },
    { time: '2026-06-07 14:33:10', actor: 'Hermes Prime', role: 'AI Agent (Node 0)', action: 'Node Consensus Verification', object: 'Finding F-018 Revenue Cut-off', oldVal: 'Pending', newVal: '2/3 Partial Consensus', reason: 'Dissenting view on FOB shipping terms' },
    { time: '2026-06-07 14:35:00', actor: 'Michael Brown', role: 'Human Senior Manager', action: 'Approved Report Draft', oldVal: 'Under Review', newVal: 'Approved', reason: 'Audit committee sign-off' }
  ];

  return (
    <div className="space-y-6 pt-2">
      {/* ---------------- FILTER TOOLBAR ---------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex justify-between items-center text-xs">
        <div className="flex items-center gap-3">
          <span className="font-black text-slate-900 uppercase text-[10px]">Filter Actor:</span>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 font-bold text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option>All Actors</option>
            <option>Human Users</option>
            <option>AI Agents (Hermes, Eve)</option>
          </select>
        </div>
        <span className="text-slate-400 font-mono text-[11px]">Audit Log immutable & SHA-256 chained</span>
      </div>

      {/* ---------------- AUDIT TRAIL TABLE ---------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 bg-slate-50">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor / Agent</th>
                <th className="py-2.5 px-2">Action</th>
                <th className="py-2.5 px-3">Target Object</th>
                <th className="py-2.5 px-2 font-mono">Old Value</th>
                <th className="py-2.5 px-2 font-mono">New Value</th>
                <th className="py-2.5 px-3">Reason / Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {activityTrail.map((act, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">{act.time}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      {act.role.includes('AI') ? (
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                      <div>
                        <span>{act.actor}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">{act.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 font-bold text-slate-800">{act.action}</td>
                  <td className="py-3 px-3 text-slate-900 font-semibold">{act.object}</td>
                  <td className="py-3 px-2 font-mono text-slate-400">{act.oldVal}</td>
                  <td className="py-3 px-2 font-mono font-bold text-emerald-600">{act.newVal}</td>
                  <td className="py-3 px-3 text-slate-500">{act.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
