import React, { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  FileText,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  FileSearch,
  Sparkles,
  Users,
  Clock,
  Upload,
  AlertTriangle,
  Star,
  ArrowRight,
  Settings,
  LogOut,
  ChevronLeft,
  X,
  PieChart,
  HardDrive
} from 'lucide-react';
import { ActiveView, UserSession } from '../types';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';

interface AppSidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onOpenUpload: () => void;
  onOpenLogin: () => void;
  userSession: UserSession;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeView,
  setActiveView,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
  onOpenUpload,
  onOpenLogin,
  userSession
}) => {
  const [isFinancialsOpen, setIsFinancialsOpen] = useState(true);
  const { companies, documents, queueJobs, projects } = usePractice();
  const processed = documents.filter((d) => /complete|parsed|done/i.test(d.status || '')).length;
  const processing = queueJobs.filter((j) => j.status === 'PROCESSING' || j.status === 'QUEUED').length;

  const handleNavClick = (view: ActiveView) => {
    setActiveView(view);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#0B0F19] text-slate-300 border-r border-slate-800 flex flex-col transition-all duration-300 ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Brand Logo & Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-emerald-400 font-extrabold text-base font-mono">E</span>
            </div>
            {!isCollapsed && (
              <div>
                <div className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5 font-mono">
                  EVE's <span className="text-emerald-400">BOOKKEEPING</span>
                </div>
                <div className="text-[9px] font-mono tracking-wider uppercase text-slate-400 font-semibold">
                  Audit Intelligence Platform
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs custom-scrollbar">
          {/* Main Navigation */}
          <div className="space-y-1">
            <button
              onClick={() => handleNavClick('overview')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'overview'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                {!isCollapsed && <span>Overview</span>}
              </div>
            </button>

            <button
              onClick={() => handleNavClick('projects')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'projects'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-slate-400" />
                {!isCollapsed && <span>Projects</span>}
              </div>
              {!isCollapsed && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  {projects.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('companies')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'companies'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {!isCollapsed && <span>Companies</span>}
              </div>
            </button>

            <button
              onClick={() => handleNavClick('documents')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'documents'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-400" />
                {!isCollapsed && <span>Documents</span>}
              </div>
            </button>

            {/* Financials Dropdown Accordion */}
            <div className="pt-1">
              <button
                onClick={() => setIsFinancialsOpen(!isFinancialsOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  activeView.startsWith('financials') || activeView === 'income-statement' || activeView === 'balance-sheet' || activeView === 'cash-flow' || activeView === 'ratios'
                    ? 'text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 font-bold">$</span>
                  {!isCollapsed && <span>Financials</span>}
                </div>
                {!isCollapsed && (
                  isFinancialsOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isFinancialsOpen && !isCollapsed && (
                <div className="ml-7 mt-1 pl-2 border-l border-slate-800 space-y-1">
                  {[
                    { id: 'financials-dashboard', label: 'Dashboard' },
                    { id: 'income-statement', label: 'Income Statement' },
                    { id: 'balance-sheet', label: 'Balance Sheet' },
                    { id: 'cash-flow', label: 'Cash Flow Statement' },
                    { id: 'ratios', label: 'Ratios & KPIs' },
                    { id: 'segment-analysis', label: 'Segment Analysis' },
                    { id: 'comparative-analysis', label: 'Comparative Analysis' },
                    { id: 'trend-analysis', label: 'Trend Analysis' },
                    { id: 'forecast', label: 'Forecast & Projections' }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => handleNavClick(sub.id as ActiveView)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer block ${
                        activeView === sub.id
                          ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hermes Swarm & Audit */}
            <button
              onClick={() => handleNavClick('hermes-swarm')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'hermes-swarm'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {!isCollapsed && <span className="truncate">Hermes Swarm & Au...</span>}
              </div>
              {!isCollapsed && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
                  4-AGENT
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('audit-findings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'audit-findings'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileSearch className="w-4 h-4 text-slate-400" />
                {!isCollapsed && <span>Audit & Findings</span>}
              </div>
            </button>

            <button
              onClick={() => handleNavClick('ai-deliverables')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'ai-deliverables'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                {!isCollapsed && <span>AI Deliverables</span>}
              </div>
              {!isCollapsed && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                  AI
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('users-teams')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'users-teams'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-400" />
                {!isCollapsed && <span>Users & Teams</span>}
              </div>
            </button>

            <button
              onClick={() => handleNavClick('activity-log')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'activity-log'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {!isCollapsed && <span>Activity Log</span>}
              </div>
            </button>
          </div>

          {!isCollapsed && (
            <>
              {/* SHORTCUTS */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-3">
                  SHORTCUTS
                </div>
                <button
                  onClick={onOpenUpload}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all text-[11px] cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Upload Documents</span>
                </button>
                <button
                  onClick={() => handleNavClick('documents')}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all text-[11px] cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pending Reviews</span>
                </button>
                <button
                  onClick={() => handleNavClick('audit-findings')}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all text-[11px] cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>High Risk Findings</span>
                </button>
                <button
                  onClick={() => handleNavClick('overview')}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all text-[11px] cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 text-slate-400" />
                  <span>Favorites</span>
                </button>
              </div>

              {/* RECENT PROJECTS */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-3">
                  RECENT PROJECTS
                </div>
                <div className="space-y-1">
                  {companies.length === 0 ? (
                    <div className="px-3 py-1.5 text-[11px] text-slate-500">No extracted clients</div>
                  ) : (
                    companies.slice(0, 5).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleNavClick('financials-dashboard')}
                        className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800/40 text-[11px]"
                      >
                        <div className="font-bold text-slate-200">{c.name}</div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 font-mono">
                          {c.revenue || EMPTY_DISPLAY}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <button
                  onClick={() => handleNavClick('projects')}
                  className="text-[11px] text-blue-400 hover:text-blue-300 px-3 font-semibold flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <span>View all projects</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* AI DOCUMENT STATUS WIDGET */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    AI DOCUMENT STATUS
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full border-4 border-blue-600 border-t-emerald-500 flex flex-col items-center justify-center shrink-0">
                      <span className="text-sm font-extrabold text-white font-mono leading-none">{documents.length}</span>
                      <span className="text-[7px] text-slate-400 uppercase leading-none mt-0.5">Docs</span>
                    </div>
                    <div className="text-[10px] space-y-0.5 text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Processed {processed}</div>
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Processing {processing}</div>
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Needs Review 0</div>
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Failed 0</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>STORAGE USED</span>
                      <span className="text-slate-200 font-bold">&lt; 0.1%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[1%]" />
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">18.4 MB of 250 GB</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-[#090D15] space-y-1 shrink-0 text-xs">
          <button
            onClick={onOpenLogin}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            {!isCollapsed && <span>Settings</span>}
          </button>
          <button
            onClick={onOpenLogin}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-full items-center gap-2.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all cursor-pointer"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
