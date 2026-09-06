import React, { useState } from 'react';
import {
  Menu,
  Search,
  Plus,
  ChevronDown,
  Calendar,
  Bell,
  HelpCircle,
  ArrowLeft,
  Share2,
  Download,
  Sparkles,
  Briefcase,
  Building2,
  Users,
  ShieldCheck,
  Bot,
  Layers,
  Globe2,
  Coins
} from 'lucide-react';
import { UserSession, ActiveView } from '../types';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';

interface AppHeaderProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onToggleMobileSidebar: () => void;
  onOpenLogin: () => void;
  onOpenUpload: () => void;
  onOpenReportWizard: () => void;
  userSession: UserSession;
  activeProjectTab: string;
  setActiveProjectTab: (tab: string) => void;
  isCollapsedSidebar: boolean;
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  onToggleCopilot?: () => void;
  isCopilotOpen?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeView,
  setActiveView,
  onToggleMobileSidebar,
  onOpenLogin,
  onOpenUpload,
  onOpenReportWizard,
  userSession,
  activeProjectTab,
  setActiveProjectTab,
  isCollapsedSidebar,
  selectedCompanyId,
  setSelectedCompanyId,
  selectedProjectId,
  setSelectedProjectId,
  onToggleCopilot,
  isCopilotOpen
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState('EUR (€)');
  const [selectedPeriod, setSelectedPeriod] = useState('FY2024');
  const [selectedScope, setSelectedScope] = useState('Consolidated Group');

  const { companies, projects, documents, isAnalyzing, activeJob, queueJobs } = usePractice();

  const currentCompany = companies.find((c) => c.id === selectedCompanyId);
  const companyProjects = projects.filter((p) => p.companyId === selectedCompanyId);
  const currentProject = projects.find((p) => p.id === selectedProjectId) || companyProjects[0];

  const isGlobalView = ['overview', 'projects', 'companies', 'users-teams', 'activity-log', 'firm-settings', 'worker-diagnostics'].includes(activeView);
  const activeProcessingCount = queueJobs.filter((j) => j.status === 'PROCESSING' || j.status === 'QUEUED').length;

  return (
    <header
      className={`bg-white border-b border-slate-200 sticky top-0 z-30 transition-all font-mono ${
        isCollapsedSidebar ? 'lg:ml-20' : 'lg:ml-72'
      }`}
    >
      {/* Top Bar Row */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-slate-100 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                Eve's Bookkeeping Intelligence
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                • CPA Practice Studio
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Dedicated VPS Worker • Mathematical Reconciliation • Lineage Evidence Registry
            </p>
          </div>
        </div>

        {/* Global Context Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Client Engagement Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedCompanyId}
              onChange={(e) => {
                const newCompanyId = e.target.value;
                setSelectedCompanyId(newCompanyId);
                const firstProj = projects.find((p) => p.companyId === newCompanyId);
                if (firstProj) setSelectedProjectId(firstProj.id);
                else setSelectedProjectId(newCompanyId);
              }}
              className="bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="">{companies.length ? 'Select Client' : 'No Clients'}</option>
              {companies.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reporting Period Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent focus:outline-hidden cursor-pointer text-xs"
            >
              <option value="FY2024">FY2024</option>
              <option value="FY2023">FY2023</option>
              <option value="Q3 2024">Q3 2024</option>
              <option value="ALL">All Periods</option>
            </select>
          </div>

          {/* Consolidation Scope Selector */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
            <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="bg-transparent focus:outline-hidden cursor-pointer text-xs"
            >
              <option value="Consolidated Group">Consolidated Group</option>
              <option value="Parent Company Only">Parent Company Only</option>
              <option value="Subsidiaries Scope">Subsidiaries Scope</option>
            </select>
          </div>

          {/* Presentation Currency Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
            <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-transparent focus:outline-hidden cursor-pointer text-xs"
            >
              <option value="EUR (€)">EUR (€)</option>
              <option value="USD ($)">USD ($)</option>
              <option value="GBP (£)">GBP (£)</option>
              <option value="CHF (CHF)">CHF (CHF)</option>
              <option value="SGD (S$)">SGD (S$)</option>
            </select>
          </div>

          {/* Active Intake Processing Pill */}
          {(isAnalyzing || activeProcessingCount > 0) && (
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold transition-all cursor-pointer shadow-xs animate-pulse"
              title="Click to view live extraction ingestion monitor"
            >
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden lg:inline">Worker Processing</span>
            </button>
          )}

          {/* Eve Audit Copilot Drawer Toggle Button */}
          {onToggleCopilot && (
            <button
              onClick={onToggleCopilot}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isCopilotOpen
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Audit Copilot</span>
            </button>
          )}

          {/* Primary Upload Intake Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Intake</span>
          </button>

          {/* User Profile Pill */}
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-2 px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-blue-900 text-blue-200 font-bold text-[10px] font-mono flex items-center justify-center">
              {userSession.name ? userSession.name.slice(0, 2).toUpperCase() : 'CP'}
            </div>
          </button>
        </div>
      </div>

      {/* Sub-Header Context Row */}
      {!isGlobalView && (
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('overview')}
              className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Master Overview</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-900 font-mono">
              {currentCompany ? currentCompany.name : 'Active Engagement'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenReportWizard}
              className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Audit Package</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
