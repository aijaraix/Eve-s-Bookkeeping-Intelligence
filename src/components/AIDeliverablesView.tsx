import React, { useEffect, useState } from 'react';
import {
  FileText, Sparkles, CheckCircle2, AlertTriangle, Download, Lock, X
} from 'lucide-react';
import { FinancialSummary, Workspace } from '../types';

interface AIDeliverablesViewProps {
  summary: FinancialSummary | null;
  workspace?: Workspace | null;
  userEmail?: string | null;
}

export const AIDeliverablesView: React.FC<AIDeliverablesViewProps> = ({ summary, workspace, userEmail }) => {
  const workspaceId = workspace?.id || (summary as any)?.workspaceId || '';
  const clientName = workspace?.name || (summary as any)?.entityName || 'Reporting Entity';

  const [audience, setAudience] = useState('Board of Directors');
  const [deliverableType, setDeliverableType] = useState('Financial Report');
  const [brandPrimary, setBrandPrimary] = useState('#1e293b');
  const [signOffName, setSignOffName] = useState(userEmail || '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [reports, setReports] = useState<any[]>([]);

  const hasFacts = Boolean(summary?.hasValidatedFacts && summary?.totalFacts);

  useEffect(() => {
    if (userEmail) setSignOffName(userEmail);
  }, [userEmail]);

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/reports?workspaceId=${encodeURIComponent(workspaceId)}`)
      .then((r) => r.json())
      .then((data) => setReports(Array.isArray(data?.reports) ? data.reports : []))
      .catch(() => setReports([]));
  }, [workspaceId, report]);

  const generate = async () => {
    setError(null);
    if (!workspaceId) {
      setError('A workspace is required. Open a project before compiling a report.');
      return;
    }
    if (!hasFacts) {
      setError('REFUSED: No extracted facts. Empty extraction cannot look like a Deloitte report.');
      return;
    }
    if (!signOffName.trim() || /sarah johnson/i.test(signOffName)) {
      setError('A real authenticated user must sign off. Fictitious auditors are not accepted.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/deliverables/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(signOffName ? { 'X-User-Email': signOffName } : {})
        },
        body: JSON.stringify({
          workspaceId,
          companyName: clientName,
          projectName: workspace?.name || clientName,
          deliverableType,
          audience,
          signedOffBy: signOffName.trim(),
          brandColors: { primary: brandPrimary, secondary: '#2563eb', accent: '#0284c7', bg: '#f8fafc' }
        })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setError(data.error || 'Report generation refused.');
        setReport(null);
        return;
      }
      setReport(data.report);
    } catch (err: any) {
      setError(err?.message || 'Report generation failed.');
    } finally {
      setBusy(false);
    }
  };

  const exportArtifact = () => {
    if (!workspaceId) return;
    window.location.href = `/api/deliverables/download/${encodeURIComponent(workspaceId)}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900">Report wizard</h2>
            <p className="text-xs text-slate-500">Compiles REPORT_READY facts from db.facts for {clientName}. No invented numbers.</p>
          </div>
          <Lock className="w-4 h-4 text-slate-400" />
        </div>

        {!hasFacts && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Not extracted</p>
            <p>This workspace has no gated facts. The wizard will not export a fake report.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="space-y-1">
            <span className="font-bold text-slate-600">Audience</span>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
              <option>Board of Directors</option>
              <option>Audit Committee</option>
              <option>Management</option>
              <option>Lenders</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="font-bold text-slate-600">Deliverable</span>
            <select value={deliverableType} onChange={(e) => setDeliverableType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
              <option>Financial Report</option>
              <option>Lead Schedules</option>
              <option>Audit Memorandum</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="font-bold text-slate-600">Brand color</span>
            <input type="color" value={brandPrimary} onChange={(e) => setBrandPrimary(e.target.value)} className="h-9 w-full border border-slate-200 rounded-xl" />
          </label>
          <label className="space-y-1">
            <span className="font-bold text-slate-600">Sign-off (authenticated user)</span>
            <input
              type="email"
              value={signOffName}
              onChange={(e) => setSignOffName(e.target.value)}
              placeholder="you@firm.com"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
            />
          </label>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
            <X className="w-4 h-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={generate}
            disabled={busy}
            className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-950 disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {busy ? 'Compiling…' : 'Compile from facts'}
          </button>
          <button
            onClick={exportArtifact}
            disabled={!report && reports.length === 0}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 disabled:opacity-40 cursor-pointer inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export working papers (JSON)
          </button>
        </div>
      </div>

      {report && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Compiled {report.title || 'report'} — signed by {report.signedOffBy}
          </div>
          <pre className="bg-slate-50 border border-slate-100 rounded-xl p-3 overflow-auto max-h-[480px] text-[11px] font-mono">
            {JSON.stringify(report.report || report, null, 2)}
          </pre>
        </div>
      )}

      {reports.length > 0 && !report && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 text-xs">
          <p className="font-bold text-slate-800 flex items-center gap-2"><FileText className="w-4 h-4" /> Previously compiled reports</p>
          {reports.map((r) => (
            <div key={r.id} className="flex justify-between border-b border-slate-100 py-2">
              <span>{r.title}</span>
              <span className="text-slate-400">{r.signedOffBy || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
