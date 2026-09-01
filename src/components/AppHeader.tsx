import React from 'react';
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
  ChevronRight
} from 'lucide-react';
import { UserSession } from '../types';

interface AppHeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenLogin: () => void;
  onOpenUpload: () => void;
  userSession: UserSession;
  activeProjectTab: string;
  setActiveProjectTab: (tab: string) => void;
  isCollapsedSidebar: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onToggleMobileSidebar,
  onOpenLogin,
  onOpenUpload,
  userSession,
  activeProjectTab,
  setActiveProjectTab,
  isCollapsedSidebar
}) => {
  return (
    <header
      className={`bg-white border-b border-slate-200 sticky top-0 z-30 transition-all ${
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
              <h1 className="text-base font-extrabold text-slate-900 font-mono tracking-tight">
                Eve's Bookkeeping Intelligence
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                • Active Engagement
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Accurate Records • Smart Insights • Confident Decisions.
            </p>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies, projects... ⌘K"
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-56 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-mono"
            />
          </div>

          {/* New Project Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>

          {/* Currency Selector */}
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono cursor-pointer">
            <span className="text-amber-600">💱</span>
            <span>EUR (€)</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Date Range Picker */}
          <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono cursor-pointer">
            <Calendar className="w-3.5 h-3.5 text-red-500" />
            <span>Jun 1 – Jun 7, 2024</span>
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 relative transition-colors cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
          </button>

          {/* Help Icon */}
          <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer">
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* User Profile Pill */}
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-900 text-emerald-300 font-bold text-[10px] font-mono flex items-center justify-center">
              SH
            </div>
            <span className="text-xs font-bold font-mono text-slate-800 hidden xl:inline">
              sholom
            </span>
          </button>
        </div>
      </div>

      {/* Project Context Sub-Header */}
      <div className="px-6 py-4 space-y-3">
        {/* Back Link & Actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </button>

          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer">
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Share</span>
            </button>
            <button className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer">
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
            <button className="px-3.5 py-1.5 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
              <span>Actions</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Metadata */}
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              Unilever PLC
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              • In Progress
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Audit Engagement • FY 2025 • Jan 1 – Dec 31, 2025 • 🌐 EUR
          </p>
        </div>

        {/* Project Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 pt-2 text-xs font-semibold">
          {['Overview', 'Financials', 'Documents (3)', 'More Sections'].map((tab) => {
            const isSelected = activeProjectTab === tab || (tab === 'Financials' && activeProjectTab.startsWith('Financials'));
            return (
              <button
                key={tab}
                onClick={() => setActiveProjectTab(tab)}
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
    </header>
  );
};
