import React, { useState } from 'react';
import {
  Building2,
  Briefcase,
  FileText,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Upload,
  Sparkles,
  Search,
  ExternalLink,
  Bot
} from 'lucide-react';
import { ActiveView } from '../types';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';

interface OverviewViewProps {
  onSelectCompany: (companyId: string) => void;
  onSelectView: (view: ActiveView) => void;
  onOpenUpload: () => void;
  onOpenReportWizard: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onSelectCompany,
  onSelectView,
  onOpenUpload,
  onOpenReportWizard
}) => {
  const { companies, projects, documents, queueJobs, facts, summary, findings, swarmStatus } = usePractice();
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredCompanies = companies.filter((comp) => {
    const matchesSector = selectedSector === 'ALL' || (comp.sector || '').toLowerCase().includes(selectedSector.toLowerCase());
    const matchesSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) || comp.ticker.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSector && matchesSearch;
  });

  const totalFacts = projects.reduce((acc, p) => acc + (p.facts || 0), 0);
  const swarmFeeds = Array.isArray(swarmStatus?.events)
    ? swarmStatus.events
    : Array.isArray(swarmStatus?.agents)
      ? swarmStatus.agents.map((a: any) => ({
          agent: a.name || a.agent || 'Hermes agent',
          target: a.target || '',
          detail: a.detail || a.status || '',
          time: a.time || a.updatedAt || '',
          type: a.type || 'INFO'
        }))
      : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-400/30">
                PRACTICE MANAGEMENT DASHBOARD
              </span>
              <span className="text-slate-400 text-xs">
                • {companies.length} Client Compan{companies.length === 1 ? 'y' : 'ies'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
              CPA Practice Master Dashboard
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Cards and KPIs fill only from extracted db.facts. Empty workspace shows {EMPTY_DISPLAY}.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Submit Client Documents</span>
            </button>
            <button
              onClick={onOpenReportWizard}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Practice Audit Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Portfolio revenue (extracted)</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">{summary?.revenue && facts.length ? summary.revenue : EMPTY_DISPLAY}</div>
          <div className="text-[11px] text-slate-500 font-bold">{companies.length} extracted client{companies.length === 1 ? '' : 's'}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Audit Engagements</span>
            <Briefcase className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">{projects.length || EMPTY_DISPLAY}</div>
          <div className="text-[11px] text-slate-500 font-semibold">From intake promotion</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Parsed Financial Facts</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">{totalFacts || EMPTY_DISPLAY}</div>
          <div className="text-[11px] text-slate-500 font-bold">db.facts only</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Partner Risk Flags</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">{findings.length || EMPTY_DISPLAY}</div>
          <div className="text-[11px] text-slate-500 font-bold">From /api/findings</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Client Company Organizations & Active Engagements
            </h2>
            <p className="text-xs text-slate-500">
              Select a client extracted from documents. Nothing is pre-seeded.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {['ALL', 'Consumer', 'Healthcare', 'Tech', 'Industrial'].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedSector === sec ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl w-44 text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {filteredCompanies.length === 0 ? (
          <EmptyExtractionState
            title="No client companies"
            detail="Submit a PDF or bank statement. Company cards appear after intake promotion writes a workspace and facts."
            onUpload={onOpenUpload}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((comp) => {
              const compProjects = projects.filter((p) => p.companyId === comp.id);
              return (
                <div
                  key={comp.id}
                  onClick={() => {
                    onSelectCompany(comp.id);
                    onSelectView('financials-dashboard');
                  }}
                  className="bg-slate-50/70 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-extrabold text-sm flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {comp.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                          {comp.name}
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <p className="text-[10px] text-slate-500">{comp.country || EMPTY_DISPLAY} • {comp.reporting} • {comp.ticker || EMPTY_DISPLAY}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      Health {comp.healthScore}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-slate-400 block">Revenue</span>
                      <span className="font-bold text-slate-800">{comp.revenue}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Net Income</span>
                      <span className="font-bold text-slate-800">{comp.netIncome}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Total Assets</span>
                      <span className="font-bold text-slate-800">{comp.assets}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                    <span>{compProjects.length} Active Engagement(s)</span>
                    <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-0.5">
                      Open Workspace <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Document ingestion queue
              </h3>
              <p className="text-[11px] text-slate-500">Live jobs from /api/queue/jobs and /api/documents.</p>
            </div>
            <button onClick={onOpenUpload} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Submit Document
            </button>
          </div>
          {documents.length === 0 && queueJobs.length === 0 ? (
            <p className="text-xs text-slate-500">{EMPTY_DISPLAY} No documents extracted yet.</p>
          ) : (
            <div className="space-y-2.5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    onSelectCompany(doc.workspaceId);
                    onSelectView('documents');
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{doc.originalName || doc.filename}</p>
                    <p className="text-[10px] text-slate-500 truncate">{doc.entityName || EMPTY_DISPLAY} • {doc.status}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {doc.extractedFactsCount || 0} Facts
                  </span>
                </div>
              ))}
              {queueJobs.map((job) => (
                <div key={job.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <span className="font-bold text-slate-800 truncate">{job.documentTitle}</span>
                  <span className="text-[10px] text-slate-500">{job.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-600" />
                Hermes swarm telemetry
              </h3>
              <p className="text-[11px] text-slate-500">Live /api/swarm/status only. No simulated “just now” checks.</p>
            </div>
            <button onClick={() => onSelectView('hermes-swarm')} className="text-xs font-bold text-purple-600 cursor-pointer">
              View All Swarms
            </button>
          </div>
          {swarmFeeds.length === 0 ? (
            <p className="text-xs text-slate-500">{EMPTY_DISPLAY} Swarm idle until extraction runs.</p>
          ) : (
            <div className="space-y-3">
              {swarmFeeds.map((feed: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{feed.agent}</span>
                    <span className="text-[10px] text-slate-400">{feed.time || EMPTY_DISPLAY}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {feed.target ? `Target: ${feed.target} — ` : ''}{feed.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
