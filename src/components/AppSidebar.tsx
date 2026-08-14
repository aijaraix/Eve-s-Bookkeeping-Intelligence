import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  FileText,
  DollarSign,
  AlertTriangle,
  FileSpreadsheet,
  Sparkles,
  CheckSquare,
  Users,
  Activity,
  UploadCloud,
  CheckCircle2,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  Settings,
  ShieldCheck,
  Eye,
  Building,
  Database,
  LogOut,
  Cpu,
  HelpCircle,
  BookOpen,
  FileCheck
} from 'lucide-react';
import { Workspace, DocumentRecord } from '../types';
import { EvesLogo } from './EvesLogo';

interface AppSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  onSelectWorkspace: (ws: Workspace) => void;
  onOpenUpload: () => void;
  onOpenAdminPanel?: () => void;
  onSignOut?: () => void;
  documents?: DocumentRecord[];
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  activeRole?: 'customer' | 'reviewer' | 'admin';
  onRoleChange?: (role: 'customer' | 'reviewer' | 'admin') => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  count?: number;
  badge?: string;
  badgeColor?: string;
}

interface ShortcutItem {
  label: string;
  action: () => void;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  onNavigate,
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onOpenUpload,
  onOpenAdminPanel,
  onSignOut,
  documents = [],
  isMobileOpen = false,
  onCloseMobile,
  activeRole = 'customer',
  onRoleChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFinancialsExpanded, setIsFinancialsExpanded] = useState(true);

  const handleNavClick = (view: string) => {
    onNavigate(view);
    if (onCloseMobile) onCloseMobile();
  };

  // Dynamic calculations from actual documents
  const totalDocs = documents.length;
  const processedDocs = documents.filter(
    (d) =>
      d.status?.toLowerCase() === 'processed' ||
      d.status?.toLowerCase() === 'validated' ||
      d.status?.toLowerCase() === 'complete'
  ).length;

  const processingDocs = documents.filter(
    (d) =>
      d.status?.toLowerCase() === 'processing' ||
      d.status?.toLowerCase() === 'pending'
  ).length;

  const reviewDocs = documents.filter(
    (d) =>
      d.status?.toLowerCase().includes('review') ||
      d.status?.toLowerCase() === 'proposed'
  ).length;

  const failedDocs = documents.filter(
    (d) =>
      d.status?.toLowerCase() === 'failed' ||
      d.status?.toLowerCase() === 'rejected' ||
      d.status?.toLowerCase() === 'error'
  ).length;

  const processedPct = totalDocs > 0 ? Math.round((processedDocs / totalDocs) * 100) : 0;
  const processingPct = totalDocs > 0 ? Math.round((processingDocs / totalDocs) * 100) : 0;
  const reviewPct = totalDocs > 0 ? Math.round((reviewDocs / totalDocs) * 100) : 0;
  const failedPct = totalDocs > 0 ? Math.round((failedDocs / totalDocs) * 100) : 0;

  // Donut SVG parameters
  const C = 263.89;
  const procDash = totalDocs > 0 ? (processedDocs / totalDocs) * C : 0;
  const ingDash = totalDocs > 0 ? (processingDocs / totalDocs) * C : 0;
  const revDash = totalDocs > 0 ? (reviewDocs / totalDocs) * C : 0;
  const failDash = totalDocs > 0 ? (failedDocs / totalDocs) * C : 0;

  // Storage Used calculation
  const totalBytes = documents.reduce((acc, d) => acc + (d.size || 0), 0);
  const maxCapacityBytes = 250 * 1024 * 1024 * 1024; // 250 GB
  const storagePctNum = Math.min(100, (totalBytes / maxCapacityBytes) * 100);
  const storagePctDisplay = totalBytes === 0 ? '0%' : storagePctNum < 0.1 ? '< 0.1%' : `${storagePctNum.toFixed(1)}%`;

  let formattedBytes = '0 MB';
  if (totalBytes >= 1024 * 1024 * 1024) {
    formattedBytes = `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  } else if (totalBytes >= 1024 * 1024) {
    formattedBytes = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  } else if (totalBytes > 0) {
    formattedBytes = `${(totalBytes / 1024).toFixed(1)} KB`;
  }

  const financialSubItems = [
    { id: 'financials:dashboard', label: 'Financial Overview' },
    { id: 'financials:income', label: 'Income Statement' },
    { id: 'financials:balance', label: 'Balance Sheet' },
    { id: 'financials:cash', label: 'Cash Flow Statement' },
    { id: 'financials:ratios', label: 'Ratios & KPIs' },
    { id: 'financials:segments', label: 'Segment Analysis' },
    { id: 'financials:comparative', label: 'Comparative Analysis' },
    { id: 'financials:trend', label: 'Trend Analysis' },
    { id: 'financials:forecast', label: 'Forecast & Projections' },
  ];

  // Build customer primary navigation + role-based extensions
  const customerNavItems: NavItem[] = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'documents', label: 'Documents', icon: FileText, count: totalDocs },
    { id: 'financials', label: 'Financials', icon: DollarSign },
    { id: 'reports', label: 'Reports & AI', icon: Sparkles },
    { id: 'review', label: 'Review', icon: CheckSquare, count: reviewDocs || undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const reviewerNavItems: NavItem[] = [
    { id: 'unbounded-registry', label: 'Fact Registry & Recon', icon: Database, badge: 'Auditor', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { id: 'findings', label: 'Audit Findings', icon: AlertTriangle, badge: 'Findings', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { id: 'deliverables-stage', label: 'Lead Schedules', icon: FileCheck, badge: 'Reviewer', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  ];

  const adminNavItems: NavItem[] = [
    { id: 'swarm', label: 'Hermes Swarm', icon: Cpu, badge: 'Admin', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    { id: 'system-diagnostics', label: 'Diagnostics', icon: ShieldCheck, badge: 'Health', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    { id: 'tenant-regression', label: 'Security & Integrations', icon: ShieldCheck, badge: 'Suite', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'teams', label: 'Users & Teams', icon: Users },
  ];

  let mainNavItems: NavItem[] = [...customerNavItems];

  if (activeRole === 'reviewer') {
    // Insert Reviewer tools right before Settings
    const settingsIdx = mainNavItems.findIndex(i => i.id === 'settings');
    mainNavItems.splice(settingsIdx, 0, ...reviewerNavItems);
  } else if (activeRole === 'admin') {
    const settingsIdx = mainNavItems.findIndex(i => i.id === 'settings');
    mainNavItems.splice(settingsIdx, 0, ...reviewerNavItems, ...adminNavItems);
  }

  const shortcuts: ShortcutItem[] = [
    { label: 'Upload Documents', action: () => { onOpenUpload(); if (onCloseMobile) onCloseMobile(); }, icon: UploadCloud },
    { label: 'Pending Reviews', action: () => handleNavClick('review'), icon: Clock },
    { label: 'AI Reports', action: () => handleNavClick('reports'), icon: Sparkles },
    { label: 'Engagements & Projects', action: () => handleNavClick('projects'), icon: Star },
  ];

  const sidebarContent = (
    <aside
      className={`bg-[#081028] text-slate-300 border-r border-[#1a274d] flex flex-col h-full select-none shrink-0 ${
        isCollapsed ? 'w-20' : 'w-72 lg:w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#18264d] bg-[#060c21]">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavClick('overview')}>
            <EvesLogo variant="emblem" size="md" />
            <div className="flex flex-col">
              <div className="flex items-center space-x-1 leading-none">
                <span className="font-serif font-extrabold text-base tracking-widest text-white">EVE's</span>
                <span className="font-sans font-bold text-xs tracking-widest text-emerald-400 uppercase">BOOKKEEPING</span>
              </div>
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider mt-1">
                AUDIT INTELLIGENCE PLATFORM
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto cursor-pointer" onClick={() => handleNavClick('overview')}>
            <EvesLogo variant="emblem" size="md" />
          </div>
        )}
      </div>

      {/* Role Switcher Pill Bar */}
      {!isCollapsed && onRoleChange && (
        <div className="px-3 py-2 bg-[#060c21]/60 border-b border-[#18264d] flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Mode:</span>
          <div className="flex items-center space-x-1 bg-[#0d1b3f] p-0.5 rounded-lg border border-[#1e2e5c]">
            <button
              onClick={() => onRoleChange('customer')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                activeRole === 'customer'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => onRoleChange('reviewer')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                activeRole === 'reviewer'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Reviewer
            </button>
            <button
              onClick={() => onRoleChange('admin')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                activeRole === 'admin'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>
        </div>
      )}

      {/* Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-[#1e2e5c]">
        
        {/* Main Navigation Links */}
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isFinancialItem = item.id === 'financials';
            const isActive = currentView === item.id || (isFinancialItem && (currentView.startsWith('financials') || ['financials', 'income', 'balance', 'cash', 'financial'].includes(currentView)));

            if (isFinancialItem) {
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      onNavigate('financials');
                      setIsFinancialsExpanded(!isFinancialsExpanded);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer group ${
                      isActive
                        ? 'bg-[#1a2b58] text-white shadow-xs border border-blue-500/30 font-bold'
                        : 'text-slate-300 hover:bg-[#121f44] hover:text-white'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <Icon className={`w-4 h-4 shrink-0 transition ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <span className="text-slate-400 group-hover:text-white">
                        {isFinancialsExpanded ? (
                          <ChevronLeft className="w-3.5 h-3.5 transform -rotate-90 transition-transform" />
                        ) : (
                          <ChevronLeft className="w-3.5 h-3.5 transition-transform" />
                        )}
                      </span>
                    )}
                  </button>

                  {/* Submenu links */}
                  {!isCollapsed && isFinancialsExpanded && (
                    <div className="pl-6 space-y-0.5 border-l-2 border-[#1e2e5c] ml-4 my-1">
                      {financialSubItems.map((sub) => {
                        const isSubActive =
                          currentView === sub.id ||
                          (sub.id === 'financials:dashboard' && (currentView === 'financials' || currentView === 'financial')) ||
                          (sub.id === 'financials:income' && currentView === 'income') ||
                          (sub.id === 'financials:balance' && currentView === 'balance') ||
                          (sub.id === 'financials:cash' && currentView === 'cash');

                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleNavClick(sub.id)}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition cursor-pointer flex items-center justify-between ${
                              isSubActive
                                ? 'bg-[#182b5a] text-blue-300 font-bold border-l-2 border-blue-400 -ml-[2px]'
                                : 'text-slate-400 hover:text-slate-100 hover:bg-[#101b3a]'
                            }`}
                          >
                            <span className="truncate">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer group ${
                  isActive
                    ? 'bg-[#1a2b58] text-white shadow-xs border border-blue-500/30 font-bold'
                    : 'text-slate-300 hover:bg-[#121f44] hover:text-white'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 transition ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border border-current ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                {!isCollapsed && item.count !== undefined && !item.badge && (
                  <span className="text-[10px] text-slate-400 font-mono font-bold bg-[#14234b] px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* SHORTCUTS Section */}
        {!isCollapsed && (
          <div className="pt-2 border-t border-[#18264d]">
            <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Shortcuts
            </h3>
            <div className="space-y-1">
              {shortcuts.map((sc, idx) => {
                const Icon = sc.icon;
                return (
                  <button
                    key={idx}
                    onClick={sc.action}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-[#121f44] hover:text-white transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{sc.label}</span>
                    </div>
                    {sc.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${sc.badgeColor || 'bg-blue-600/30 text-blue-300'}`}>
                        {sc.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* RECENT PROJECTS Section */}
        {!isCollapsed && (
          <div className="pt-2 border-t border-[#18264d] space-y-4">
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Recent Projects
                </h3>
              </div>
              <div className="space-y-1">
                {workspaces.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] text-slate-500 italic">
                    No active projects yet.
                  </div>
                ) : (
                  workspaces.slice(0, 3).map((ws) => (
                    <div
                      key={ws.id}
                      onClick={() => {
                        onSelectWorkspace(ws);
                      }}
                      className={`p-2.5 rounded-xl hover:bg-[#121f44] cursor-pointer transition group ${
                        activeWorkspace?.id === ws.id ? 'bg-[#121f44] border border-blue-500/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 truncate">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                            {ws.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1 pl-4">
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md border bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                          Active
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => onNavigate('projects')}
                className="w-full text-left px-3 pt-2 text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1 cursor-pointer"
              >
                <span>View all projects</span>
                <span>→</span>
              </button>
            </div>

            {/* AI Document Status Donut Widget */}
            <div className="px-3 pt-3 border-t border-[#18264d] space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                AI Document Status
              </h3>

              <div className="bg-[#0c1838] p-3 rounded-xl border border-blue-900/40 space-y-2.5">
                <div className="flex items-center justify-center relative py-1">
                  <svg className="w-28 h-28 transform -rotate-90">
                    {/* Base Circle */}
                    <circle cx="56" cy="56" r="42" stroke="#1e293b" strokeWidth="12" fill="transparent" />
                    {totalDocs > 0 && (
                      <>
                        {/* Processed Segment */}
                        {procDash > 0 && (
                          <circle cx="56" cy="56" r="42" stroke="#10b981" strokeWidth="12" fill="transparent" strokeDasharray={`${procDash} ${C}`} strokeDashoffset={0} />
                        )}
                        {/* Processing Segment */}
                        {ingDash > 0 && (
                          <circle cx="56" cy="56" r="42" stroke="#38bdf8" strokeWidth="12" fill="transparent" strokeDasharray={`${ingDash} ${C}`} strokeDashoffset={-procDash} />
                        )}
                        {/* Needs Review Segment */}
                        {revDash > 0 && (
                          <circle cx="56" cy="56" r="42" stroke="#f59e0b" strokeWidth="12" fill="transparent" strokeDasharray={`${revDash} ${C}`} strokeDashoffset={-(procDash + ingDash)} />
                        )}
                        {/* Failed Segment */}
                        {failDash > 0 && (
                          <circle cx="56" cy="56" r="42" stroke="#f43f5e" strokeWidth="12" fill="transparent" strokeDasharray={`${failDash} ${C}`} strokeDashoffset={-(procDash + ingDash + revDash)} />
                        )}
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-sm font-black text-white font-mono leading-none">{totalDocs.toLocaleString()}</span>
                    <span className="text-[9px] font-bold text-slate-400 mt-0.5">Total Documents</span>
                  </div>
                </div>

                <div className="space-y-1 text-[10px] text-slate-300 font-medium">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Processed</span>
                    </div>
                    <span className="font-mono text-slate-400">{processedDocs.toLocaleString()} ({processedPct}%)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                      <span>Processing</span>
                    </div>
                    <span className="font-mono text-slate-400">{processingDocs.toLocaleString()} ({processingPct}%)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Needs Review</span>
                    </div>
                    <span className="font-mono text-slate-400">{reviewDocs.toLocaleString()} ({reviewPct}%)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Failed</span>
                    </div>
                    <span className="font-mono text-slate-400">{failedDocs.toLocaleString()} ({failedPct}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Used Widget */}
            <div className="px-3 pt-1 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Storage Used</span>
                <span className="font-mono font-bold text-slate-300">{storagePctDisplay}</span>
              </div>

              <div className="text-[11px] font-mono text-slate-200">
                {formattedBytes} of 250 GB
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(storagePctNum, totalBytes > 0 ? 1 : 0))}%` }}
                />
              </div>

              <button
                onClick={() => handleNavClick('settings')}
                className="text-[10px] font-bold text-blue-400 hover:underline pt-0.5 block cursor-pointer"
              >
                Manage Storage
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Footer System Links */}
      <div className="p-3 border-t border-[#18264d] bg-[#060c21] space-y-1">
        <button
          onClick={() => handleNavClick('system_guide')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
            currentView === 'system_guide' || currentView === 'how_to'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-300 hover:bg-[#121f44] hover:text-white'
          }`}
          title="Complete Platform Architecture & How-To Guide"
        >
          <HelpCircle className="w-4 h-4 shrink-0 text-blue-400" />
          {!isCollapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate">How System Works</span>
              <span className="text-[9px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30 shrink-0 ml-1">
                How-To
              </span>
            </div>
          )}
        </button>

        <button
          onClick={() => handleNavClick('settings')}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-[#121f44] hover:text-white transition cursor-pointer"
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </button>

        <button
          onClick={() => {
            if (onSignOut) {
              onSignOut();
            } else {
              handleNavClick('landing');
            }
          }}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition cursor-pointer"
          title="Sign Out to Homepage"
        >
          <LogOut className="w-4 h-4 shrink-0 text-red-400" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-[#121f44] hover:text-white transition cursor-pointer hidden lg:flex"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0 shrink-0 z-40">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative max-w-xs w-full bg-[#081028] h-full shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
