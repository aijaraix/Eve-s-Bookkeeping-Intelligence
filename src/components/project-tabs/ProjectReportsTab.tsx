import React, { useState } from 'react';
import { Workspace, DocumentRecord } from '../../types';
import {
  FileText,
  Plus,
  Download,
  Sparkles,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Share2,
  Building2,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { AIDeliverablesView } from '../AIDeliverablesView';

interface ProjectReportsTabProps {
  workspace: Workspace;
  documents: DocumentRecord[];
}

export const ProjectReportsTab: React.FC<ProjectReportsTabProps> = ({
  workspace,
  documents
}) => {
  const [showWizard, setShowWizard] = useState(false);

  const reportsList = [
    { name: 'FY2025 Independent Audit Report', type: 'Audit Report', audience: 'Board & Shareholder', period: 'FY 2025', version: 'v2.1', status: 'Approved', readiness: '100%', preparedBy: 'Sarah Johnson', updated: '2026-06-05' },
    { name: 'Management Letter & Internal Controls Deficiencies', type: 'Management Letter', audience: 'Audit Committee', period: 'FY 2025', version: 'v1.4', status: 'Under Review', readiness: '92%', preparedBy: 'Michael Brown', updated: '2026-06-06' },
    { name: 'Q2 Executive Board Financial Package', type: 'Board Package', audience: 'Board of Directors', period: 'Q2 2025', version: 'v1.0', status: 'Draft', readiness: '85%', preparedBy: 'Eve AI Agent', updated: '2026-06-07' },
    { name: 'Due Diligence & Evidence Provenance Package', type: 'Evidence Package', audience: 'External Lenders', period: 'FY 2025', version: 'v3.0', status: 'Published', readiness: '100%', preparedBy: 'Jane Smith', updated: '2026-06-01' }
  ];

  if (showWizard) {
    return (
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div>
            <h2 className="text-base font-black text-slate-900">AI Deliverables Report Generator</h2>
            <p className="text-xs text-slate-500">Pre-loaded with workspace context for {workspace.name || 'Active Client Workspace'}</p>
          </div>
          <button
            onClick={() => setShowWizard(false)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
          >
            ← Back to Reports List
          </button>
        </div>
        <AIDeliverablesView summary={null} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* ---------------- TOP SUMMARY CARDS ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Reports</span>
          <div className="text-xl font-black text-slate-900 font-mono">12</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500">Draft</span>
          <div className="text-xl font-black text-slate-700 font-mono">3</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-blue-600">Under Review</span>
          <div className="text-xl font-black text-blue-700 font-mono">2</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-600">Awaiting Approval</span>
          <div className="text-xl font-black text-amber-700 font-mono">1</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-600">Approved</span>
          <div className="text-xl font-black text-emerald-700 font-mono">4</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-purple-600">Published</span>
          <div className="text-xl font-black text-purple-700 font-mono">2</div>
        </div>
      </div>

      {/* ---------------- BAR & GENERATE ACTION ---------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">Project Deliverables & Audit Publications</h3>
          <p className="text-xs text-slate-500">Generate executive board packages, management letters, and formal audit opinions.</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-950 transition cursor-pointer flex items-center gap-2 shadow-2xs"
        >
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span>Generate Report</span>
        </button>
      </div>

      {/* ---------------- REPORTS TABLE ---------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 bg-slate-50">
                <th className="py-2.5 px-3">Report Name</th>
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-2">Audience</th>
                <th className="py-2.5 px-2 font-mono">Period</th>
                <th className="py-2.5 px-2 font-mono">Version</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2 font-mono">Readiness</th>
                <th className="py-2.5 px-2">Prepared By</th>
                <th className="py-2.5 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {reportsList.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{r.name}</span>
                  </td>
                  <td className="py-3 px-2 text-slate-600">{r.type}</td>
                  <td className="py-3 px-2 text-slate-500">{r.audience}</td>
                  <td className="py-3 px-2 font-mono text-slate-500">{r.period}</td>
                  <td className="py-3 px-2 font-mono text-slate-500">{r.version}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      r.status === 'Published' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-mono font-bold text-emerald-600">{r.readiness}</td>
                  <td className="py-3 px-2 text-slate-600">{r.preparedBy}</td>
                  <td className="py-3 px-2 text-right">
                    <button className="p-1 text-blue-600 hover:text-blue-800 font-bold hover:bg-blue-50 rounded-lg cursor-pointer">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
