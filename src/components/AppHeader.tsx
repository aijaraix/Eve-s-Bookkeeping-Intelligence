import React, { useState } from 'react';
import { Search, Plus, Upload, Bell, HelpCircle, Calendar, Coins, User, ChevronDown, Menu } from 'lucide-react';
import { Workspace } from '../types';

interface AppHeaderProps {
  currentView: string;
  onOpenSearch: () => void;
  onOpenNewProject: () => void;
  onOpenUpload: () => void;
  userEmail: string | null;
  onOpenSignIn: () => void;
  globalCurrency: string;
  setGlobalCurrency: (currency: string) => void;
  globalLanguage: string;
  setGlobalLanguage: (lang: string) => void;
  activeWorkspace?: Workspace | null;
  onOpenMobileMenu?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentView,
  onOpenSearch,
  onOpenNewProject,
  onOpenUpload,
  userEmail,
  onOpenSignIn,
  globalCurrency,
  setGlobalCurrency,
  activeWorkspace,
  onOpenMobileMenu,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [dateRange, setDateRange] = useState(activeWorkspace?.period || 'FY 2025 Consolidated');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const getViewTitle = () => {
    switch (currentView) {
      case 'overview':
        return {
          title: 'Overview',
          subtitle: 'Real-time overview of your portfolio, projects, and financial intelligence.',
        };
      case 'projects':
        return {
          title: 'Projects Overview',
          subtitle: 'Manage all engagements and client workspaces across your portfolio.',
        };
      case 'companies':
        return {
          title: 'Companies',
          subtitle: 'Consolidated entity master registry, risk profiles, and corporate snapshots.',
        };
      case 'documents':
        return {
          title: 'Documents Repository',
          subtitle: 'SHA-256 verified financial records, filings, general ledgers, and subledgers.',
        };
      case 'financials':
      case 'income':
      case 'balance':
      case 'cash':
        return {
          title: 'Financial Statements & Analytics',
          subtitle: 'IFRS & US GAAP audited income statement, balance sheet, and cash flow reconciliations.',
        };
      case 'findings':
      case 'review':
        return {
          title: 'Audit & Findings Center',
          subtitle: 'PCAOB material weakness alerts, risk scoring, and auditor resolution tracking.',
        };
      case 'reports':
        return {
          title: 'AI Deliverables',
          subtitle: 'AI-powered professional deliverables in seconds. Client-ready audit, advisory, and financial packages.',
        };
      case 'insights':
      case 'chat':
        return {
          title: 'AI Insights & Hermes Copilot',
          subtitle: 'Real-time financial intelligence, anomaly detection, and CPA rule verification.',
        };
      case 'workflow':
        return {
          title: 'Workflow & Task Management',
          subtitle: 'Engagement milestone planning, task delegation, and approval chains.',
        };
      case 'teams':
        return {
          title: 'Users & Engagement Teams',
          subtitle: 'Audit partner assignments, team roles, permissions, and sign-off authorizations.',
        };
      case 'activity':
        return {
          title: 'Activity Log & System Telemetry',
          subtitle: 'Immutable audit trail of document uploads, risk modifications, and system events.',
        };
      case 'settings':
        return {
          title: 'System & Platform Settings',
          subtitle: 'Configure firm preferences, AI copilot parameters, compliance standards, and integrations.',
        };
      default:
        return {
          title: 'Eve\'s Bookkeeping Intelligence',
          subtitle: 'Accurate Records • Smart Insights • Confident Decisions.',
        };
    }
  };

  const { title, subtitle } = getViewTitle();

  const userInitials = userEmail
    ? userEmail.split('@')[0].substring(0, 2).toUpperCase()
    : 'JS';

  return (
    <header className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        
        {/* Left Title & Mobile Menu Trigger */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Hamburger button for mobile */}
            {onOpenMobileMenu && (
              <button
                onClick={onOpenMobileMenu}
                className="lg:hidden p-2 min-h-[44px] min-w-[44px] rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 flex items-center justify-center transition cursor-pointer shrink-0"
                aria-label="Open mobile navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight flex flex-wrap items-center gap-2">
                <span>{title}</span>
                {activeWorkspace && currentView !== 'overview' && currentView !== 'projects' && (
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                    ● Active Engagement
                  </span>
                )}
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1 sm:line-clamp-none">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Right Search, Actions & Profile Tools */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Global Search Bar Trigger */}
          <div
            onClick={onOpenSearch}
            className="flex items-center space-x-2 bg-neutral-100/80 hover:bg-neutral-100 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-500 cursor-pointer w-full sm:w-64 transition"
          >
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <span className="truncate flex-1 font-medium">Search companies, projects...</span>
            <kbd className="font-mono text-[10px] bg-white text-neutral-500 border border-neutral-200 rounded px-1.5 py-0.5 shadow-2xs">
              ⌘K
            </kbd>
          </div>

          {/* New Project Button */}
          <button
            onClick={onOpenNewProject}
            className="bg-[#0b1739] hover:bg-[#12224d] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>

          {/* Currency Toggle Dropdown */}
          <div className="flex items-center space-x-1 bg-neutral-50 border border-neutral-200 rounded-xl px-2 py-1 text-xs font-mono font-bold text-neutral-800">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <select
              value={globalCurrency}
              onChange={(e) => setGlobalCurrency(e.target.value)}
              className="bg-transparent text-xs font-bold text-neutral-900 focus:outline-none cursor-pointer"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="BRL">BRL (R$)</option>
              <option value="CHF">CHF (Fr)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="relative">
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 text-xs font-medium px-3 py-2 rounded-xl flex items-center space-x-2 transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span className="font-mono text-[11px] font-semibold">{dateRange}</span>
            </button>
            {isDatePickerOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 p-2 z-40 text-xs space-y-1">
                {['FY 2025 Consolidated', 'FY 2024 Comparative Period', 'FY 2023 Historic Period'].map((range) => (
                  <div
                    key={range}
                    onClick={() => {
                      setDateRange(range);
                      setIsDatePickerOpen(false);
                    }}
                    className={`px-3 py-2 rounded-lg cursor-pointer transition font-mono ${
                      dateRange === range ? 'bg-neutral-100 font-bold text-blue-600' : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    {range}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 relative transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-neutral-200 p-4 z-40 text-xs">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-3">
                  <span className="font-bold text-neutral-900">Notifications (3 Unread)</span>
                  <span className="text-[10px] text-blue-600 cursor-pointer font-semibold" onClick={() => setShowNotifications(false)}>
                    Mark all read
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="p-2 bg-blue-50/60 rounded-xl border border-blue-100">
                    <p className="font-bold text-neutral-900">High Risk Finding Detected</p>
                    <p className="text-[11px] text-neutral-600">Revenue cut-off test pending in GlobalTech Solutions.</p>
                    <span className="text-[10px] text-neutral-400 font-mono">10 mins ago</span>
                  </div>
                  <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200">
                    <p className="font-bold text-neutral-900">Document Processing Complete</p>
                    <p className="text-[11px] text-neutral-600">Income Statement FY 2023 parsed successfully.</p>
                    <span className="text-[10px] text-neutral-400 font-mono">25 mins ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help Button */}
          <button
            onClick={() => alert('Eve\'s Bookkeeping Advisory Platform. For support or CPA guidance, contact audit-support@evesbookkeeping.com.')}
            className="p-2 rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
            title="Help & Documentation"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* User Profile Avatar / Sign In */}
          <button
            onClick={onOpenSignIn}
            className="flex items-center space-x-2 bg-neutral-900 text-white rounded-xl px-2.5 py-1.5 hover:bg-neutral-800 transition cursor-pointer shadow-xs"
            title={userEmail ? `Signed in as ${userEmail}` : 'Sign In / Switch Account'}
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">
              {userInitials}
            </div>
            <span className="text-xs font-semibold max-w-[100px] truncate hidden sm:inline">
              {userEmail ? userEmail.split('@')[0] : 'Sign In'}
            </span>
          </button>

        </div>
      </div>
    </header>
  );
};
