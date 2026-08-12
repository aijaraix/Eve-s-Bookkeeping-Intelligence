import React, { useState } from 'react';
import {
  Building2,
  FolderKanban,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Plus,
  ArrowRight,
  FileSpreadsheet,
  Clock,
  Upload
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Workspace, DocumentRecord, FinancialSummary } from '../types';

interface GlobalOverviewDashboardProps {
  workspaces: Workspace[];
  documents: DocumentRecord[];
  summary: FinancialSummary | null;
  onNavigate: (view: string) => void;
  onSelectWorkspace: (ws: Workspace) => void;
}

export const GlobalOverviewDashboard: React.FC<GlobalOverviewDashboardProps> = ({
  workspaces,
  documents,
  summary,
  onNavigate,
  onSelectWorkspace,
}) => {
  // Palette for chart segments
  const COLORS_DOCS = ['#10b981', '#3b82f6', '#f59e0b', '#64748b'];

  // Metrics derived from actual workspace data
  const activeProjectsCount = workspaces.length;
  const totalDocumentsCount = documents.length;
  const financialDocsCount = documents.filter(d => 
    d.category?.toLowerCase().includes('financial') || 
    d.originalName?.toLowerCase().includes('statement') ||
    d.mimeType?.includes('sheet') ||
    d.mimeType?.includes('excel')
  ).length;

  // Donut chart dataset using real values or clean UI framework placeholders
  const documentTypeData = totalDocumentsCount > 0 ? [
    { name: 'Financial Statements', value: financialDocsCount || 1 },
    { name: 'Audit Evidence', value: Math.max(0, totalDocumentsCount - financialDocsCount) || 1 },
    { name: 'Tax / Compliance', value: 0 },
    { name: 'Other Attachments', value: 0 }
  ] : [
    { name: 'Processed', value: 0 },
    { name: 'In Review', value: 0 },
    { name: 'Pending', value: 0 },
    { name: 'Issues', value: 0 }
  ];

  // Helper to parse numeric string value safely
  const parseAmount = (valStr?: string) => {
    if (!valStr) return 0;
    const cleaned = valStr.replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const revenueNum = parseAmount(summary?.revenue);

  // Proportional performance chart data
  const performanceTrendData = [
    { period: 'Q1', Extracted: revenueNum ? Math.round(revenueNum * 0.2) : 0 },
    { period: 'Q2', Extracted: revenueNum ? Math.round(revenueNum * 0.45) : 0 },
    { period: 'Q3', Extracted: revenueNum ? Math.round(revenueNum * 0.75) : 0 },
    { period: 'Q4', Extracted: revenueNum ? Math.round(revenueNum) : 0 }
  ];

  return (
    <div className="space-y-4 pb-12">
      
      {/* ----------------- SECTION 1: TOP COMPACT METRIC CARDS (6-Grid) ----------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Metric 1: Active Projects */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold">
            <span>Active Projects</span>
            <FolderKanban className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black font-mono text-neutral-900">{activeProjectsCount}</div>
          <div className="text-[10px] text-neutral-500 font-medium">
            {activeProjectsCount > 0 ? 'Active in workspace' : 'No active projects'}
          </div>
        </div>

        {/* Metric 2: Processed Documents */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold">
            <span>Documents</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black font-mono text-neutral-900">{totalDocumentsCount}</div>
          <div className="text-[10px] text-neutral-500 font-medium">
            {totalDocumentsCount > 0 ? 'Uploaded files' : '0 files uploaded'}
          </div>
        </div>

        {/* Metric 3: Financial Records */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold">
            <span>Financial Statements</span>
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black font-mono text-neutral-900">{financialDocsCount}</div>
          <div className="text-[10px] text-neutral-500 font-medium">
            {summary ? 'Financial data extracted' : 'Pending statement'}
          </div>
        </div>

        {/* Metric 4: Extracted Facts */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold">
            <span>Extracted Facts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono text-neutral-900">
            {summary?.totalFacts || 0}
          </div>
          <div className="text-[10px] text-neutral-500 font-medium">Extracted line items</div>
        </div>

        {/* Metric 5: Audit Readiness */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold">
            <span>Audit Readiness</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black font-mono text-neutral-900">
            {summary?.validationPassRate ? `${summary.validationPassRate}` : '--'}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold">
            {totalDocumentsCount > 0 ? 'Documentation attached' : 'Placeholder state'}
          </div>
        </div>

        {/* Metric 6: AI Engine Status */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold">
            <span>AI Processing</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black font-mono text-neutral-900">Active</div>
          <div className="text-[10px] text-purple-600 font-bold">Ready for intake</div>
        </div>

      </div>

      {/* ----------------- SECTION 2: MAIN OPERATIONS & PERFORMANCE GRID ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column (8 Cols): Recent Projects Table + Compact Performance Chart */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Active Projects Directory Table */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <div>
                <h3 className="font-extrabold text-xs text-neutral-900 uppercase tracking-wider">Active Projects & Workspaces</h3>
                <p className="text-[10px] text-neutral-500">Your active client engagements and bookkeeping workspaces.</p>
              </div>
              <button
                onClick={() => onNavigate('projects')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Projects</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {workspaces.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-neutral-400 font-semibold border-b border-neutral-100 text-[11px]">
                      <th className="py-2 px-2">Project / Company Name</th>
                      <th className="py-2 px-2">Currency</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2">Created</th>
                      <th className="py-2 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workspaces.map((ws) => (
                      <tr
                        key={ws.id}
                        onClick={() => {
                          onSelectWorkspace(ws);
                          onNavigate('projects');
                        }}
                        className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer font-medium transition"
                      >
                        <td className="py-2.5 px-2 font-bold text-neutral-900 flex items-center space-x-2">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{ws.name}</span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-neutral-600">{ws.currency || 'USD'}</td>
                        <td className="py-2.5 px-2">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Active
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-neutral-500 font-mono text-[11px]">
                          {new Date(ws.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <span className="text-blue-600 font-bold hover:underline text-[11px]">Open Workspace →</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center bg-neutral-50/80 rounded-xl border border-dashed border-neutral-200 space-y-2">
                <Building2 className="w-8 h-8 text-neutral-400 mx-auto" />
                <h4 className="text-xs font-bold text-neutral-800">No Projects Added Yet</h4>
                <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                  Create your first client workspace or upload financial documents to populate project intelligence.
                </p>
                <button
                  onClick={() => onNavigate('projects')}
                  className="mt-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Project Workspace</span>
                </button>
              </div>
            )}
          </div>

          {/* Compact Financial Performance Trend Chart */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <div>
                <h3 className="font-extrabold text-xs text-neutral-900 uppercase tracking-wider">Financial Performance Framework</h3>
                <p className="text-[10px] text-neutral-500">Proportional trend visualization for uploaded financial statements.</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-neutral-100 px-2 py-0.5 rounded">
                YTD Intake
              </span>
            </div>

            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceTrendData}>
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Extracted" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
              <span>Revenue Extracted: <strong className="font-mono text-neutral-900">{summary?.revenue ? summary.revenue : '$0.00'}</strong></span>
              <span className="text-[11px] text-neutral-400">UI placeholder chart framework</span>
            </div>
          </div>

        </div>

        {/* Right Column (4 Cols): Document Status & Activity Stream */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Documents Breakdown Donut */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-extrabold text-xs text-neutral-900 uppercase tracking-wider">Document Summary</h3>
              <span onClick={() => onNavigate('documents')} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                View files →
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-24 h-24 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={documentTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={40}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {documentTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_DOCS[index % COLORS_DOCS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-black font-mono text-neutral-900">{totalDocumentsCount}</span>
                  <span className="text-[8px] text-neutral-400 font-bold uppercase">Files</span>
                </div>
              </div>

              <div className="flex-1 space-y-1 text-xs">
                {documentTypeData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS_DOCS[idx] }} />
                      <span className="font-medium text-neutral-700 truncate">{item.name}</span>
                    </div>
                    <span className="font-mono text-neutral-900 font-bold shrink-0">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Timeline Placeholder */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-extrabold text-xs text-neutral-900 uppercase tracking-wider">Recent Activity</h3>
              <span onClick={() => onNavigate('activity')} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                All activity →
              </span>
            </div>

            {documents.length > 0 ? (
              <div className="space-y-2 text-xs">
                {documents.slice(0, 4).map((doc, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 p-1.5 hover:bg-neutral-50 rounded-lg transition">
                    <div className="flex items-start space-x-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="truncate">
                        <div className="font-semibold text-neutral-800 truncate">{doc.originalName || doc.filename}</div>
                        <div className="text-[10px] text-neutral-400">Uploaded to workspace</div>
                      </div>
                    </div>
                    <span className="text-[9px] text-neutral-400 font-mono shrink-0">Recent</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-neutral-400 space-y-1">
                <Clock className="w-5 h-5 mx-auto text-neutral-300" />
                <p className="text-[11px]">No workspace activity logged yet.</p>
                <p className="text-[10px] text-neutral-400">Upload documents to see live event logs.</p>
              </div>
            )}
          </div>

          {/* AI Workflow Banner */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-4 rounded-xl text-white space-y-2 shadow-sm">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>Eve AI Intelligence</span>
            </div>
            <p className="text-[11px] text-blue-100 leading-relaxed">
              Upload any PDF, XLSX, or DOCX financial statement to perform instant audit-ready analysis and risk verification.
            </p>
            <button
              onClick={() => onNavigate('documents')}
              className="mt-1 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
