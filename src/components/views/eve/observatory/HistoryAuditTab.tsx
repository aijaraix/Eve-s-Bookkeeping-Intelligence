import React, { useState } from 'react';
import { History, Filter, Search, Terminal, ArrowRight, Download, Clock } from 'lucide-react';
import { ObservatoryEventItem } from './ObservatoryTypes';

export interface HistoryAuditTabProps {
  events: ObservatoryEventItem[];
  onSelectEvent?: (event: ObservatoryEventItem) => void;
}

export const HistoryAuditTab: React.FC<HistoryAuditTabProps> = ({
  events = [],
  onSelectEvent
}) => {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const filtered = events.filter((e) => {
    if (severityFilter !== 'ALL' && e.severity !== severityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.summary.toLowerCase().includes(q) ||
        e.eventType.toLowerCase().includes(q) ||
        e.sourceId.toLowerCase().includes(q) ||
        (e.engagementId && e.engagementId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header Banner */}
      <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase text-indigo-400 font-bold tracking-wider block">
              Autonomous Operations Chronology
            </span>
            <h3 className="text-base font-bold text-white">
              Immutable Runtime Audit Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Every heartbeat, agent handoff, PBC inquiry, math reconciliation, and concurring partner review is immutably logged to disk.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs">
              Showing <strong className="text-white">{filtered.length}</strong> of <strong className="text-white">{events.length}</strong> events
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Search history by keyword, agent ID, or engagement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-1">
            {['ALL', 'SUCCESS', 'INFO', 'WARNING'].map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  severityFilter === s
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History Ledger Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Event Type</th>
                <th className="p-3.5">Source & Target</th>
                <th className="p-3.5">Case ID</th>
                <th className="p-3.5">Operational Summary</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((e) => (
                <tr
                  key={e.eventId}
                  onClick={() => onSelectEvent?.(e)}
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <td className="p-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                    {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-bold border border-slate-700">
                      {e.eventType}
                    </span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="text-indigo-400 font-bold">{e.sourceId.replace('eve-', '')}</span>
                    {e.targetId && (
                      <span className="text-slate-500"> → <strong className="text-cyan-400">{e.targetId.replace('eve-', '')}</strong></span>
                    )}
                  </td>
                  <td className="p-3.5 whitespace-nowrap text-slate-400">
                    {e.engagementId || '—'}
                  </td>
                  <td className="p-3.5 text-slate-200 font-sans text-xs max-w-md">
                    {e.summary}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.status === 'SUCCESS' || e.status === 'CLEARED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
