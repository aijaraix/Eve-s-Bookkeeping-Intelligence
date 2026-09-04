import React, { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  FileText,
  DollarSign,
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
  Settings,
  ChevronLeft,
  X,
  PieChart,
  Server,
  GitFork,
  Coins,
  BookOpen,
  Award
} from 'lucide-react';
import { ActiveView, UserSession } from '../types';
import { usePractice } from '../context/PracticeContext';

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
  const [isCorporateOpen, setIsCorporateOpen] = useState(true);
  const [isAuditOpen, setIsAuditOpen] = useState(true);

  const { companies, documents, queueJobs, projects, isAnalyzing } = usePractice();
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
                  Big-4 Audit Studio
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-xs custom-scrollbar">
          {/* PILLAR 1: HOME & ENGAGEMENTS */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                1. Engagements
              </div>
            )}
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
                {!isCollapsed && <span>Home Dashboard</span>}
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
                {!isCollapsed && <span>Audit Engagements</span>}
              </div>
              {!isCollapsed && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
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
                {!isCollapsed && <span>Client Companies</span>}
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
                {!isCollapsed && <span>Filing Cabinet & PDFs</span>}
              </div>
            </button>
          </div>

          {/* PILLAR 2: FINANCIAL WORKBENCH */}
          <div className="space-y-1">
            {!isCollapsed && (
              <button
                onClick={() => setIsFinancialsOpen(!isFinancialsOpen)}
                className="w-full px-3 text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between hover:text-slate-300 cursor-pointer"
              >
                <span>2. Financial Workbench</span>
                {isFinancialsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}

            {isFinancialsOpen && (
              <div className="space-y-0.5">
                {[
                  { id: 'financials-dashboard', label: 'Statements Overview', icon: DollarSign },
                  { id: 'income-statement', label: 'Income Statement', icon: DollarSign },
                  { id: 'balance-sheet', label: 'Balance Sheet', icon: DollarSign },
                  { id: 'cash-flow', label: 'Cash Flow Statement', icon: DollarSign },
                  { id: 'equity-statement', label: 'Statement of Equity', icon: PieChart },
                  { id: 'notes-disclosures', label: 'Notes & Disclosures', icon: BookOpen },
                  { id: 'ratios', label: 'Ratios & Analytics', icon: TrendingUp },
                  { id: 'segment-analysis', label: 'Segment Reporting', icon: DollarSign },
                  { id: 'comparative-analysis', label: 'Comparative Trends', icon: DollarSign }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id as ActiveView)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeView === item.id
                        ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-400 text-xs font-mono">•</span>
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PILLAR 3: CORPORATE STRUCTURE */}
          <div className="space-y-1">
            {!isCollapsed && (
              <button
                onClick={() => setIsCorporateOpen(!isCorporateOpen)}
                className="w-full px-3 text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between hover:text-slate-300 cursor-pointer"
              >
                <span>3. Corporate Structure</span>
                {isCorporateOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}

            {isCorporateOpen && (
              <div className="space-y-0.5">
                {[
                  { id: 'corporate-structure', label: 'Entities & Subsidiaries', icon: GitFork },
                  { id: 'currencies-fx', label: 'Currencies & FX Rates', icon: Coins },
                  { id: 'capital-structure', label: 'Capital & Buybacks', icon: PieChart }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id as ActiveView)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left transition-all cursor-pointer ${
                        activeView === item.id
                          ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* PILLAR 4: AUDIT & DELIVERABLES */}
          <div className="space-y-1">
            {!isCollapsed && (
              <button
                onClick={() => setIsAuditOpen(!isAuditOpen)}
                className="w-full px-3 text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between hover:text-slate-300 cursor-pointer"
              >
                <span>4. Audit & Deliverables</span>
                {isAuditOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}

            {isAuditOpen && (
              <div className="space-y-0.5">
                <button
                  onClick={() => handleNavClick('audit-findings')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeView === 'audit-findings'
                      ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileSearch className="w-3.5 h-3.5 text-slate-400" />
                    {!isCollapsed && <span>Findings & Risks</span>}
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('hermes-swarm')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeView === 'hermes-swarm'
                      ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {!isCollapsed && <span>Hermes 4-Agent Swarm</span>}
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('evidence-registry')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeView === 'evidence-registry'
                      ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    {!isCollapsed && <span>Lineage Evidence</span>}
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('ai-deliverables')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeView === 'ai-deliverables'
                      ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    {!isCollapsed && <span>CPA Report Generator</span>}
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* SYSTEM & SETTINGS */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                Settings & Infrastructure
              </div>
            )}
            <button
              onClick={() => handleNavClick('firm-settings')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeView === 'firm-settings'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                {!isCollapsed && <span>Firm Branding & License</span>}
              </div>
            </button>

            <button
              onClick={() => handleNavClick('worker-diagnostics')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeView === 'worker-diagnostics'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                {!isCollapsed && <span>VPS Extraction Worker</span>}
              </div>
              {!isCollapsed && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('activity-log')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeView === 'activity-log'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {!isCollapsed && <span>Audit Trail Logs</span>}
              </div>
            </button>
          </div>
        </div>

        {/* Bottom Upload & Collapse Bar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between shrink-0">
          {!isCollapsed ? (
            <button
              onClick={onOpenUpload}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Intake Documents</span>
            </button>
          ) : (
            <button
              onClick={onOpenUpload}
              className="w-full p-2 text-emerald-400 hover:bg-slate-800 rounded-lg flex justify-center cursor-pointer"
              title="Intake Documents"
            >
              <Upload className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
