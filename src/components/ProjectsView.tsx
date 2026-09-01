import React, { useState } from 'react';
import { Briefcase, Plus, Search, Filter, CheckCircle2, Clock, Users, ArrowUpRight, ExternalLink } from 'lucide-react';
import { ActiveView } from '../types';
import { PROJECTS, COMPANIES } from '../data/mockData';

interface ProjectsViewProps {
  onSelectView?: (view: ActiveView) => void;
  onSelectCompany?: (companyId: string) => void;
  onSelectProject?: (projectId: string) => void;
  onOpenUpload?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onSelectView,
  onSelectCompany,
  onSelectProject,
  onOpenUpload
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = PROJECTS.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">CPA Practice Audit Engagements</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {PROJECTS.length} Active Engagements
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise Audit Engagements & Project Directory • Click any engagement to enter its audit workspace
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search engagements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-48 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
          <button
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Engagement</span>
          </button>
        </div>
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filtered.map((proj) => (
          <div
            key={proj.id}
            onClick={() => {
              if (onSelectCompany) onSelectCompany(proj.companyId);
              if (onSelectProject) onSelectProject(proj.id);
              if (onSelectView) onSelectView('financials-dashboard');
            }}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">{proj.sector} • {proj.companyName}</span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-0.5 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                  {proj.name}
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                proj.status === 'COMPLETED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {proj.status === 'COMPLETED' ? 'COMPLETED' : 'IN PROGRESS'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span>Reporting Standard:</span>
                <span className="font-bold text-slate-900">{proj.reporting}</span>
              </div>
              <div className="flex justify-between">
                <span>Extracted Facts:</span>
                <span className="font-bold text-blue-600">{proj.facts} Verified Facts</span>
              </div>
              <div className="flex justify-between">
                <span>Documents Parsed:</span>
                <span className="font-bold text-slate-900">{proj.docsCount} Files</span>
              </div>
              <div className="flex justify-between">
                <span>Lead CPA:</span>
                <span className="font-bold text-slate-900">{proj.assignedLead}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400">Due: {proj.dueDate}</span>
              <span className="text-blue-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Open Workspace <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
