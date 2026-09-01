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
  ShieldCheck
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
  setSelectedProjectId
}) => {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR (€)');
  const { companies, projects, documents } = usePractice();

  const currentCompany = companies.find((c) => c.id === selectedCompanyId);
  const companyProjects = projects.filter((p) => p.companyId === selectedCompanyId);
  const currentProject = projects.find((p) => p.id === selectedProjectId) || companyProjects[0];

  const isGlobalView = ['overview', 'projects', 'companies', 'users-teams', 'activity-log'].includes(activeView);

  const handleTabClick = (tab: string) => {
    setActiveProjectTab(tab);
    if (tab === 'Overview') setActiveView('overview');
    else if (tab === 'Financials') setActiveView('financials-dashboard');
    else if (tab.startsWith('Documents')) setActiveView('documents');
    else if (tab === 'More Sections') setActiveView('ai-deliverables');
  };

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
                • Active CPA Practice Studio
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Multi-Client Audit Swarms • Real-time Provenance • Enterprise Compliance
            </p>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Practice Client Company Dropdown Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Building2 className="w-4 h-4 text-blue-600 ml-1.5 shrink-0" />
            <select
              value={selectedCompanyId}
              onChange={(e) => {
                const newCompanyId = e.target.value;
                setSelectedCompanyId(newCompanyId);
                const firstProj = projects.find((p) => p.companyId === newCompanyId);
                if (firstProj) setSelectedProjectId(firstProj.id);
                else setSelectedProjectId(newCompanyId);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-2"
            >
              <option value="">{companies.length ? 'Select client' : 'No extracted clients'}</option>
              {companies.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name} ({comp.ticker || EMPTY_DISPLAY})
                </option>
              ))}
            </select>
          </div>

          {/* New Project / Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Engagement</span>
          </button>

          {/* Currency Selector */}
          <div className="relative">
            <button
              onClick={() => setSelectedCurrency(selectedCurrency === 'EUR (€)' ? 'USD ($)' : 'EUR (€)')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono cursor-pointer"
            >
              <span className="text-amber-600">💱</span>
              <span>{selectedCurrency}</span>
            </button>
          </div>

          {/* User Profile Pill */}
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-blue-900 text-blue-200 font-bold text-[10px] font-mono flex items-center justify-center">
              {userSession.name ? userSession.name.slice(0, 2).toUpperCase() : 'CP'}
            </div>
            <span className="text-xs font-bold font-mono text-slate-800 hidden xl:inline">
              {userSession.name || 'Steve Stein'}
            </span>
          </button>
        </div>
      </div>

      {/* Project Context Sub-Header (Only shown when inside an active project view) */}
      {!isGlobalView && (
        <div className="px-6 py-4 space-y-3 bg-slate-50/50">
          {/* Back Link & Actions */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button
              onClick={() => setActiveView('overview')}
              className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Master Practice Overview</span>
            </button>

            <div className="flex items-center gap-2 relative">
              <button
                onClick={onOpenReportWizard}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Report Wizard</span>
              </button>

              <button
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <span>Actions</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isActionsOpen && (
                <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-40 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      onOpenReportWizard();
                      setIsActionsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Generate AI Report</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenUpload();
                      setIsActionsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Document</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Title & Metadata for currently selected company */}
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {currentCompany?.name || 'No client selected'}
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                • {currentProject?.name || 'Submit documents to create an engagement'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Client Entity: {currentCompany?.reg || EMPTY_DISPLAY} • Country: {currentCompany?.country || EMPTY_DISPLAY} • Framework: {currentCompany?.reporting || EMPTY_DISPLAY} • Lead: {currentProject?.assignedLead || EMPTY_DISPLAY}
            </p>
          </div>

          {/* Project Navigation Tabs */}
          <div className="flex items-center gap-6 border-b border-slate-200 pt-2 text-xs font-semibold">
            {['Overview', 'Financials', `Documents (${documents.length})`, 'More Sections'].map((tab) => {
              const isSelected =
                (tab === 'Overview' && activeView === 'overview') ||
                (tab === 'Financials' && (activeView === 'financials-dashboard' || activeProjectTab.startsWith('Financials'))) ||
                (tab.startsWith('Documents') && activeView === 'documents') ||
                (tab === 'More Sections' && activeView === 'ai-deliverables');
              return (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={`pb-2.5 transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'border-b-2 border-blue-600 text-blue-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab}</span>
                  {tab === 'More Sections' && <ChevronDown className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

