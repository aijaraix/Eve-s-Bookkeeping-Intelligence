import React, { useState } from 'react';
import { Search, Plus, ExternalLink, ArrowUpRight } from 'lucide-react';
import { ActiveView } from '../types';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';

interface CompaniesViewProps {
  onSelectView?: (view: ActiveView) => void;
  onSelectCompany?: (companyId: string) => void;
  onOpenUpload?: () => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({ onSelectView, onSelectCompany, onOpenUpload }) => {
  const { companies, projects } = usePractice();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Client Companies & Corporate Directory</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {companies.length} Extracted {companies.length === 1 ? 'Entity' : 'Entities'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Directory is empty until intake promotion creates a workspace from uploaded documents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-48 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
          <button
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client Company</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyExtractionState title="No client companies" onUpload={onOpenUpload} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filtered.map((c) => {
            const compProjects = projects.filter((p) => p.companyId === c.id);
            return (
              <div
                key={c.id}
                onClick={() => {
                  onSelectCompany?.(c.id);
                  onSelectView?.('financials-dashboard');
                }}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-sm shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                        {c.name}
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{c.country || EMPTY_DISPLAY} • {c.reporting} ({c.ticker || EMPTY_DISPLAY})</p>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>Revenue: <span className="font-bold text-slate-700">{c.revenue}</span></div>
                  <div>Currency: <span className="font-bold text-slate-700">{c.currency || EMPTY_DISPLAY}</span></div>
                  <div>Active Engagements: <span className="font-bold text-blue-600">{compProjects.length} Project(s)</span></div>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Health {c.healthScore}
                  </span>
                  <span className="text-blue-600 font-bold flex items-center gap-1">
                    Enter Workspace <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
