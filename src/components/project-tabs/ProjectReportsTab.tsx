import React, { useEffect, useState } from 'react';
import { Workspace, DocumentRecord, FinancialSummary } from '../../types';
import { FileText, Sparkles, Download } from 'lucide-react';
import { AIDeliverablesView } from '../AIDeliverablesView';

interface ProjectReportsTabProps {
  workspace: Workspace;
  documents: DocumentRecord[];
  summary?: FinancialSummary | null;
  userEmail?: string | null;
}

export const ProjectReportsTab: React.FC<ProjectReportsTabProps> = ({
  workspace,
  documents,
  summary,
  userEmail
}) => {
  const [showWizard, setShowWizard] = useState(false);
  const [reportsList, setReportsList] = useState<any[]>([]);

  useEffect(() => {
    if (!workspace?.id) return;
    fetch(`/api/reports?workspaceId=${encodeURIComponent(workspace.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.reports)) setReportsList(data.reports);
        else if (Array.isArray(data)) setReportsList(data);
      })
      .catch(() => setReportsList([]));
  }, [workspace?.id, showWizard]);

  if (showWizard) {
    return (
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div>
            <h2 className="text-base font-black text-slate-900">Report compiler</h2>
            <p className="text-xs text-slate-500">Compiles REPORT_READY facts from {workspace.name || 'this workspace'} only.</p>
          </div>
          <button
            onClick={() => setShowWizard(false)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
          >
            ← Back to reports
          </button>
        </div>
        <AIDeliverablesView
          summary={summary || null}
          workspace={workspace}
          userEmail={userEmail}
        />
      </div>
    );
  }

  const draftCount = reportsList.filter((r) => r.status === 'Draft').length;
  const publishedCount = reportsList.filter((r) => r.status === 'Published' || r.status === 'Approved').length;

  return (
    <div className="space-y-6 pt-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Reports</span>
          <div className="text-xl font-black text-slate-900 font-mono">{reportsList.length}</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500">Draft</span>
          <div className="text-xl font-black text-slate-700 font-mono">{draftCount}</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-600">Approved / Published</span>
          <div className="text-xl font-black text-emerald-700 font-mono">{publishedCount}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">Project deliverables</h3>
          <p className="text-xs text-slate-500">Generate only from REPORT_READY facts. Empty extraction cannot look like an audit report.</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-950 transition cursor-pointer flex items-center gap-2 shadow-2xs"
        >
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span>Generate Report</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
        {reportsList.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold">No reports compiled yet.</p>
            <p className="text-slate-400">Use Generate Report after facts are extracted and signed off.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 bg-slate-50">
                  <th className="py-2.5 px-3">Report Name</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2">Audience</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Prepared By</th>
                  <th className="py-2.5 px-2 text-right">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {reportsList.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{r.title || r.name}</span>
                    </td>
                    <td className="py-3 px-2 text-slate-600">{r.deliverableType || r.type || '—'}</td>
                    <td className="py-3 px-2 text-slate-500">{r.audience || '—'}</td>
                    <td className="py-3 px-2">{r.status || 'Draft'}</td>
                    <td className="py-3 px-2 text-slate-600">{r.signedOffBy || '—'}</td>
                    <td className="py-3 px-2 text-right">
                      <a
                        href={`/api/deliverables/download/${workspace.id}`}
                        className="p-1 text-blue-600 hover:text-blue-800 font-bold hover:bg-blue-50 rounded-lg inline-flex"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
