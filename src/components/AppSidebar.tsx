import React from 'react';
import { usePractice } from '../context/PracticeContext';
import { ViewMode } from '../types';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Scale,
  ArrowLeftRight,
  BookOpen,
  Cpu,
  AlertCircle,
  Database,
  FileCheck2,
  FolderArchive,
  Activity,
} from 'lucide-react';

interface NavItem {
  id: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

export const AppSidebar: React.FC = () => {
  const { currentView, setCurrentView, findings } = usePractice();

  const unresolvedCount = findings.filter((f) => !f.resolved).length;

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: 'FINANCIAL STATEMENTS',
      items: [
        { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
        { id: 'income_statement', label: 'Income Statement (P&L)', icon: FileSpreadsheet },
        { id: 'balance_sheet', label: 'Balance Sheet', icon: Scale },
        { id: 'cash_flow', label: 'Cash Flow Statement', icon: ArrowLeftRight },
        { id: 'notes_disclosures', label: 'Notes & Disclosures', icon: BookOpen },
      ],
    },
    {
      title: 'FORENSIC AUDIT & SWARM',
      items: [
        { id: 'hermes_swarm', label: 'Hermes Swarm Verifier', icon: Cpu, badge: '6 Agents', badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-800' },
        {
          id: 'audit_findings',
          label: 'Audit Findings & Flags',
          icon: AlertCircle,
          badge: unresolvedCount > 0 ? unresolvedCount : undefined,
          badgeColor: 'bg-amber-950 text-amber-400 border-amber-800',
        },
        { id: 'evidence_registry', label: 'Evidence & Provenance', icon: Database },
      ],
    },
    {
      title: 'PRACTICE & TOOLS',
      items: [
        { id: 'deliverables', label: 'Audit Deliverables', icon: FileCheck2 },
        { id: 'documents', label: 'Document Intake', icon: FolderArchive },
        { id: 'diagnostics', label: 'Worker Diagnostics', icon: Activity },
      ],
    },
  ];

  return (
    <aside id="app-sidebar" className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-3 space-y-6 flex-1">
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <h2 className="px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
              {sec.title}
            </h2>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const active = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition cursor-pointer ${
                      active
                        ? 'bg-cyan-500/10 text-cyan-400 font-semibold border-l-2 border-cyan-400 pl-2.5'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-semibold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Info */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Engine: Zeabur + Gemini</span>
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Ready
        </span>
      </div>
    </aside>
  );
};
