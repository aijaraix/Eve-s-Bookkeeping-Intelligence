import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  FileText,
  FileSpreadsheet,
  LineChart,
  BarChart3,
  TrendingUp,
  Share2,
  Globe2,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  Bot,
  Cpu,
  GraduationCap,
  Settings,
  Users,
  Activity,
  ScrollText,
  Terminal,
  ChevronDown,
  ChevronRight,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

export interface AppSidebarProps {
  activeView: string;
  onNavigate: (viewId: string) => void;
  openFindingsCount?: number;
  openReviewItemsCount?: number;
  className?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeView,
  onNavigate,
  openFindingsCount = 0,
  openReviewItemsCount = 0,
  className
}) => {
  const [financialsExpanded, setFinancialsExpanded] = useState(true);
  const [analysisExpanded, setAnalysisExpanded] = useState(true);

  // Group 1: PRACTICE
  const practiceNav = [
    { id: 'practice-home', label: 'Home', icon: LayoutDashboard },
    { id: 'practice-clients', label: 'Clients', icon: Building2 },
    { id: 'practice-engagements', label: 'Engagements', icon: Briefcase },
    { id: 'practice-documents', label: 'Documents', icon: FileText }
  ];

  // Group 2: ENGAGEMENT WORK
  const engagementDirectNav = [
    { id: 'engagement-overview', label: 'Overview', icon: Layers }
  ];

  const financialStatementNav = [
    { id: 'financials-overview', label: 'Statements Overview' },
    { id: 'financials-income', label: 'Income Statement' },
    { id: 'financials-balance', label: 'Balance Sheet' },
    { id: 'financials-cashflow', label: 'Cash Flow' },
    { id: 'financials-equity', label: 'Statement of Equity' },
    { id: 'financials-notes', label: 'Notes & Disclosures' }
  ];

  const analysisNav = [
    { id: 'analysis-ratios', label: 'Ratios & Analytics' },
    { id: 'analysis-segments', label: 'Segment Reporting' },
    { id: 'analysis-trends', label: 'Comparative Trends' },
    { id: 'analysis-forecast', label: 'Forecasts & Projections' }
  ];

  const engagementAttestationNav = [
    { id: 'engagement-structure', label: 'Corporate Structure', icon: Share2 },
    { id: 'engagement-currencies', label: 'Currencies & FX', icon: Globe2 },
    { id: 'engagement-evidence', label: 'Evidence & Workpapers', icon: ShieldCheck },
    {
      id: 'engagement-findings',
      label: 'Findings & Review',
      icon: AlertCircle,
      badge: openFindingsCount > 0 ? openFindingsCount : undefined
    },
    { id: 'engagement-deliverables', label: 'Deliverables & Reports', icon: FileCheck2 }
  ];

  // Group 3: EVE INTELLIGENCE
  const eveNav = [
    { id: 'eve-copilot', label: 'Eve Copilot', icon: Bot },
    { id: 'eve-intelligence', label: 'Intelligence Center', icon: Cpu },
    { id: 'eve-academy', label: 'Hermes Academy', icon: GraduationCap }
  ];

  // Group 4: ADMINISTRATION
  const adminNav = [
    { id: 'admin-firm', label: 'Firm & Branding', icon: Settings },
    { id: 'admin-users', label: 'Users & Access', icon: Users },
    { id: 'admin-health', label: 'System Health', icon: Activity },
    { id: 'admin-audit-logs', label: 'Audit Logs', icon: ScrollText },
    { id: 'admin-diagnostics', label: 'Diagnostics', icon: Terminal }
  ];

  const renderNavItem = (item: {
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    badge?: number;
    subItem?: boolean;
  }) => {
    const Icon = item.icon;
    const isActive = activeView === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onNavigate(item.id)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer group',
          item.subItem ? 'pl-8 py-1 text-slate-600' : 'text-slate-700',
          isActive
            ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
            : 'hover:bg-slate-100 hover:text-slate-900'
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          {Icon && (
            <Icon
              className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
              )}
            />
          )}
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge !== undefined && item.badge > 0 && (
          <span
            className={cn(
              'px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono',
              isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-amber-100 text-amber-800'
            )}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={cn(
        'w-64 bg-slate-50/80 border-r border-slate-200 flex flex-col h-screen select-none',
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>EVE</span>
              <span className="text-[10px] uppercase font-mono font-medium px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-200/50">
                CPA Studio
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Autonomous Audit Attestation</div>
          </div>
        </div>
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* 1. PRACTICE */}
        <div>
          <div className="px-3 mb-1.5 text-[11px] font-bold tracking-wider uppercase text-slate-400 font-mono">
            Practice
          </div>
          <nav className="space-y-0.5">{practiceNav.map(renderNavItem)}</nav>
        </div>

        {/* 2. ENGAGEMENT */}
        <div>
          <div className="px-3 mb-1.5 text-[11px] font-bold tracking-wider uppercase text-slate-400 font-mono">
            Engagement
          </div>
          <nav className="space-y-0.5">
            {engagementDirectNav.map(renderNavItem)}

            {/* Financial Statements Submenu */}
            <div>
              <button
                type="button"
                onClick={() => setFinancialsExpanded(!financialsExpanded)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                  <span>Financial Statements</span>
                </div>
                {financialsExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              {financialsExpanded && (
                <div className="mt-0.5 space-y-0.5">
                  {financialStatementNav.map((sub) =>
                    renderNavItem({ ...sub, subItem: true })
                  )}
                </div>
              )}
            </div>

            {/* Analysis & Ratios Submenu */}
            <div>
              <button
                type="button"
                onClick={() => setAnalysisExpanded(!analysisExpanded)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <LineChart className="w-4 h-4 text-slate-400" />
                  <span>Analysis & Analytics</span>
                </div>
                {analysisExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              {analysisExpanded && (
                <div className="mt-0.5 space-y-0.5">
                  {analysisNav.map((sub) =>
                    renderNavItem({ ...sub, subItem: true })
                  )}
                </div>
              )}
            </div>

            {engagementAttestationNav.map(renderNavItem)}
          </nav>
        </div>

        {/* 3. EVE INTELLIGENCE */}
        <div>
          <div className="px-3 mb-1.5 text-[11px] font-bold tracking-wider uppercase text-slate-400 font-mono flex items-center justify-between">
            <span>Eve Intelligence</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Hermes Swarm Active" />
          </div>
          <nav className="space-y-0.5">{eveNav.map(renderNavItem)}</nav>
        </div>

        {/* 4. ADMINISTRATION */}
        <div>
          <div className="px-3 mb-1.5 text-[11px] font-bold tracking-wider uppercase text-slate-400 font-mono">
            Administration
          </div>
          <nav className="space-y-0.5">{adminNav.map(renderNavItem)}</nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 bg-white text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>SOC-2 & PCAOB</span>
        </span>
        <span className="font-mono text-slate-400">v9.19</span>
      </div>
    </aside>
  );
};
