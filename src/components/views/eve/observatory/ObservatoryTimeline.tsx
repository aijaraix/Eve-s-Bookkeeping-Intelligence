import React, { useState } from 'react';
import { Terminal, Filter, Search, Zap, Clock, ShieldCheck, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ObservatoryEventItem } from './ObservatoryTypes';

export interface ObservatoryTimelineProps {
  events: ObservatoryEventItem[];
  onSelectEvent: (event: ObservatoryEventItem) => void;
  selectedEventId?: string;
  onRefresh?: () => void;
  isPolling?: boolean;
}

export const ObservatoryTimeline: React.FC<ObservatoryTimelineProps> = ({
  events = [],
  onSelectEvent,
  selectedEventId,
  onRefresh,
  isPolling = true
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = events.filter(e => {
    if (filterType === 'HEARTBEATS' && e.eventType !== 'HEARTBEAT') return false;
    if (filterType === 'AGENTS' && !['AGENT_ACTIVATED', 'AGENT_COMPLETED', 'AGENT_HANDOFF', 'TASK_COMPLETED'].includes(e.eventType)) return false;
    if (filterType === 'PBC' && !['PBC_REQUEST_CREATED', 'PBC_RESPONSE_RECEIVED', 'PBC_CLEARED'].includes(e.eventType)) return false;
    if (filterType === 'RECONCILIATION' && !['RECONCILIATION_STARTED', 'RECONCILIATION_PASSED', 'FACT_VERIFIED'].includes(e.eventType)) return false;
    if (filterType === 'REVIEW' && !['REVIEW_NOTE_CREATED', 'REVIEW_NOTE_CLEARED', 'SENTINEL_GATE'].includes(e.eventType)) return false;
    if (filterType === 'DELIVERABLES' && !['REPORT_GENERATED', 'REPORT_DOWNLOADED'].includes(e.eventType)) return false;
    if (filterType === 'MILESTONES' && !['ACADEMY_WAKE', 'ENGAGEMENT_CREATED', 'MINERVA_EVALUATION_COMPLETED', 'CAPABILITY_REQUEST'].includes(e.eventType)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.summary.toLowerCase().includes(q) ||
        e.eventType.toLowerCase().includes(q) ||
        e.sourceId.toLowerCase().includes(q) ||
        (e.targetId && e.targetId.toLowerCase().includes(q)) ||
        (e.engagementId && e.engagementId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
      {/* Timeline Controls Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Live Operational Ledger
            </h3>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
              {filteredEvents.length} events
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real Persisted Stream
            </span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer transition-colors"
                title="Refresh Ledger"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'HEARTBEATS', label: 'Heartbeats' },
            { id: 'AGENTS', label: 'Agents' },
            { id: 'PBC', label: 'PBC Client' },
            { id: 'RECONCILIATION', label: 'Math / Facts' },
            { id: 'REVIEW', label: 'Concurring Review' },
            { id: 'DELIVERABLES', label: 'Deliverables' },
            { id: 'MILESTONES', label: 'Milestones' }
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => setFilterType(pill.id)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                filterType === pill.id
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search telemetry ledger (e.g. PBC, Euclid, IFRS 16, Quinn, Heartbeat)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Events Scroll List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 font-mono">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            No operational events match current filter.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isSelected = selectedEventId === evt.eventId;
            const timeStr = new Date(evt.timestamp).toLocaleTimeString([], { hour12: false });

            let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
            if (evt.eventType === 'HEARTBEAT') badgeColor = 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50';
            else if (evt.eventType.includes('PBC')) badgeColor = 'bg-amber-950/50 text-amber-300 border-amber-800/50';
            else if (evt.eventType.includes('RECONCILIATION')) badgeColor = 'bg-cyan-950/50 text-cyan-300 border-cyan-800/50';
            else if (evt.eventType.includes('REVIEW')) badgeColor = 'bg-purple-950/50 text-purple-300 border-purple-800/50';
            else if (evt.eventType.includes('REPORT')) badgeColor = 'bg-indigo-950/50 text-indigo-300 border-indigo-800/50';
            else if (evt.eventType.includes('MINERVA')) badgeColor = 'bg-rose-950/50 text-rose-300 border-rose-800/50';

            return (
              <div
                key={evt.eventId}
                onClick={() => onSelectEvent(evt)}
                className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-800/60 ${
                  isSelected ? 'bg-indigo-950/40 border-l-2 border-indigo-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-600" />
                      {timeStr}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${badgeColor}`}>
                      {evt.eventType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                    {evt.sourceId.replace('eve-', '')}
                  </span>
                </div>

                <p className="text-[11px] text-slate-200 font-sans leading-relaxed line-clamp-2">
                  {evt.summary}
                </p>

                {evt.engagementId && (
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="text-indigo-400">Case: {evt.engagementId}</span>
                    {evt.status && (
                      <span className="text-emerald-400 font-bold">• {evt.status}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
