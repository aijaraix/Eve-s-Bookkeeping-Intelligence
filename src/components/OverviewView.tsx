import React, { useState } from 'react';
import {
  Building2,
  Briefcase,
  FileText,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Upload,
  Sparkles,
  CheckCircle2,
  Search,
  ExternalLink,
  Bot
} from 'lucide-react';
import { ActiveView } from '../types';
import { COMPANIES, PROJECTS } from '../data/mockData';

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
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredCompanies = COMPANIES.filter((comp) => {
    const matchesSector = selectedSector === 'ALL' || comp.sector.toLowerCase().includes(selectedSector.toLowerCase());
    const matchesSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) || comp.ticker.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSector && matchesSearch;
  });

  const recentIngestedDocs = [
    { title: 'Unilever_Annual_Report_2025.pdf', company: 'Unilever PLC', companyId: 'unilever', project: 'FY 2025 Financial Statement Audit', pages: 184, status: 'PARSED', facts: 342, time: '12 mins ago' },
    { title: 'Novartis_Q4_Bank_Statements_Consolidated.pdf', company: 'Novartis AG', companyId: 'novartis', project: 'FY 2025 Global Compliance Audit', pages: 32, status: 'PARSED', facts: 114, time: '28 mins ago' },
    { title: 'Sony_10K_USGAAP_Audited.pdf', company: 'Sony Group Corporation', companyId: 'sony', project: 'FY 2025 US GAAP 10-K Audit', pages: 210, status: 'PARSED', facts: 298, time: '1 hour ago' },
    { title: 'Siemens_Trial_Balance_Dec2025.xlsx', company: 'Siemens AG', companyId: 'siemens', project: 'ESG & Financial Assurance FY25', pages: 14, status: 'PARSED', facts: 186, time: '3 hours ago' },
  ];

  const firmSwarmFeeds = [
    { agent: 'Identity Verification Swarm', target: 'Sony Group Corp', detail: 'Balance Sheet Identity A = L + E validated across $92.1B assets. 0.00% variance.', time: 'Just now', type: 'SUCCESS' },
    { agent: 'Tax & IFRS Rule Engine', target: 'Unilever PLC', detail: 'Deferred Tax Asset disclosure cross-referenced with Note 14 snippet on Page 42.', time: '4m ago', type: 'INFO' },
    { agent: 'Variance Detection Agent', target: 'Novartis AG', detail: 'Flagged $14.2M foreign exchange translation discrepancy in European subsidiary.', time: '18m ago', type: 'WARNING' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-400/30">
                PRACTICE MANAGEMENT DASHBOARD
              </span>
              <span className="text-slate-400 text-xs">• 14 Active Client Companies</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
              CPA Practice Master Dashboard
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Global oversight across all client organizations, engagement projects, ingested trial balances, and real-time AI compliance swarms.
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

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Monitored Portfolio AUM</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">€142.8B</div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 5 Global Client Enterprises
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Audit Engagements</span>
            <Briefcase className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">28 Projects</div>
          <div className="text-[11px] text-slate-500 font-semibold">
            18 IFRS • 10 US GAAP
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Parsed Financial Facts</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">1,840 Facts</div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 99.4% AI Provenance Score
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Partner Risk Flags</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-amber-600">3 Attention Items</div>
          <div className="text-[11px] text-amber-700 font-bold">
            Requires CPA Sign-off
          </div>
        </div>
      </div>

      {/* Main Client Company Registry & Workspace Navigator */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Client Company Organizations & Active Engagements
            </h2>
            <p className="text-xs text-slate-500">
              Select any client organization below to open its specialized audit workspace, statements, and audit working papers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sector Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {['ALL', 'Consumer', 'Healthcare', 'Tech', 'Industrial'].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedSector === sec
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>

            {/* Search Input */}
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

        {/* Company Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((comp) => {
            const compProjects = PROJECTS.filter((p) => p.companyId === comp.id);
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
                      <p className="text-[10px] text-slate-500">{comp.country} • {comp.reporting} • {comp.ticker}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
      </div>

      {/* Two Column Section: Multi-Document Organization Router & Real-Time AI Swarm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Practice Document Ingestion Router */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Practice Document Organization & Routing Queue
              </h3>
              <p className="text-[11px] text-slate-500">
                Incoming documents automatically separated into client organizations and project scopes.
              </p>
            </div>
            <button
              onClick={onOpenUpload}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Submit Document
            </button>
          </div>

          <div className="space-y-2.5">
            {recentIngestedDocs.map((doc, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectCompany(doc.companyId);
                  onSelectView('documents');
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{doc.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      Organization: <span className="font-semibold text-slate-700">{doc.company}</span> • Project: {doc.project}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {doc.facts} Facts
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{doc.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-Client AI Swarm Activity Log */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-600" />
                Practice-Wide Autonomous AI Audit Swarms
              </h3>
              <p className="text-[11px] text-slate-500">
                Live background verification across all active client balance sheets & disclosures.
              </p>
            </div>
            <button
              onClick={() => onSelectView('hermes-swarm')}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
            >
              View All Swarms
            </button>
          </div>

          <div className="space-y-3">
            {firmSwarmFeeds.map((feed, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {feed.agent}
                  </span>
                  <span className="text-[10px] text-slate-400">{feed.time}</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Target: <span className="font-semibold text-slate-800">{feed.target}</span> — {feed.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
