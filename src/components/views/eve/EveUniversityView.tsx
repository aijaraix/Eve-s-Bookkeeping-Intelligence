import React, { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, Bot, Boxes, ClipboardCheck, FileSearch, FlaskConical, GraduationCap, Network, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { apiGet } from '../../../api/practiceClient';

type UniversitySnapshot = Record<string, any>;

const tabs = [
  ['overview', 'University Overview'],
  ['liveExaminations', 'Live Examinations'],
  ['syntheticCustomers', 'Synthetic Customers'],
  ['rawInputLab', 'Raw Input Lab'],
  ['capabilityMatrix', 'Capability Matrix'],
  ['failuresRemediation', 'Failures & Remediation'],
  ['regression', 'Regression'],
  ['minerva', 'Minerva'],
  ['workforce', 'Workforce'],
  ['hermes', 'Hermes'],
  ['learningDarwin', 'Learning / Darwin'],
  ['curriculum', 'Curriculum'],
  ['ownerRequests', 'Owner Requests']
] as const;

function StatusPill({ value }: { value: unknown }) {
  const text = String(value ?? 'UNTESTED');
  const color = text.includes('PASS') ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : text === 'RUNNING' ? 'bg-blue-50 text-blue-700 border-blue-200'
    : text === 'FAIL' || text === 'BLOCKED' ? 'bg-rose-50 text-rose-700 border-rose-200'
    : 'bg-slate-50 text-slate-600 border-slate-200';
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${color}`}>{text.replaceAll('_', ' ')}</span>;
}

function DataTable({ rows }: { rows: any[] }) {
  if (!rows.length) return <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">No physical University records have been recorded yet.</p>;
  const keys = Object.keys(rows[0]).filter(key => !Array.isArray(rows[0][key]) && typeof rows[0][key] !== 'object').slice(0, 8);
  return <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{keys.map(key => <th key={key} className="px-3 py-2 font-semibold uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1')}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{rows.map((row, index) => <tr key={row.examinationId || row.capabilityId || row.failureId || index}>{keys.map(key => <td key={key} className="max-w-xs px-3 py-3 align-top text-slate-700">{key === 'result' || key === 'status' ? <StatusPill value={row[key]} /> : String(row[key] ?? '—')}</td>)}</tr>)}</tbody></table></div>;
}

export const EveUniversityView: React.FC = () => {
  const [snapshot, setSnapshot] = useState<UniversitySnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number][0]>('overview');
  const [error, setError] = useState('');
  const load = async () => {
    try { setSnapshot(await apiGet('/api/university/overview')); setError(''); }
    catch (err: any) { setError(err.message || 'University state is unavailable.'); }
  };
  useEffect(() => { void load(); }, []);
  const overview = snapshot?.overview || {};
  const tabValue = snapshot?.[activeTab];
  const icons = [GraduationCap, FileSearch, Users, FlaskConical, Boxes, AlertTriangle, RefreshCw, ShieldCheck, Bot, Network, ClipboardCheck, BookOpen, AlertTriangle];

  return <div className="min-h-full bg-slate-950 text-slate-100">
    <header className="border-b border-slate-800 bg-slate-950/95 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400">Owner Command Center</p><h1 className="mt-1 text-2xl font-bold">Eve University</h1><p className="mt-1 text-sm text-slate-400">Physical raw-input examinations through books, deliverables, reverse lineage, and sealed Minerva grading.</p></div><button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900"><RefreshCw className="h-4 w-4" /> Refresh evidence</button></div>
    </header>
    {error && <div role="alert" className="m-6 rounded-xl border border-rose-800 bg-rose-950/40 p-4 text-sm text-rose-200">{error}</div>}
    <div className="grid min-h-[calc(100vh-112px)] lg:grid-cols-[250px_1fr]">
      <nav className="border-r border-slate-800 p-3">{tabs.map(([id, label], index) => { const Icon = icons[index]; return <button key={id} onClick={() => setActiveTab(id)} className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold ${activeTab === id ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}><Icon className="h-4 w-4" />{label}</button>; })}</nav>
      <main className="p-6">
        {activeTab === 'overview' ? <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
            ['Active examinations', overview.active ?? 0], ['Grading', overview.grading ?? 0], ['Remediation', overview.remediation ?? 0], ['Queue depth', overview.queueDepth ?? 0], ['Physical workers', overview.workersActive ?? 0], ['Regression passed', overview.regressionHealthy ?? 0], ['Owner requests', overview.ownerRequestsOpen ?? 0], ['Total examinations', overview.examinations ?? 0]
          ].map(([label, value]) => <section key={String(label)} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-white">{value}</p></section>)}</div>
          <section className="mt-5 rounded-xl border border-cyan-900/70 bg-cyan-950/20 p-5"><h2 className="font-bold text-cyan-100">Accountable disposition, not fabricated extraction</h2><p className="mt-2 text-sm leading-6 text-slate-300">Academy tenants use the same authenticated customer product and accounting controls. Unknown fields remain unknown, missing evidence becomes clarification/PBC, and production promotion remains separately governed.</p></section>
        </> : <section><div className="mb-4"><h2 className="text-xl font-bold">{tabs.find(row => row[0] === activeTab)?.[1]}</h2><p className="mt-1 text-xs text-slate-500">Only recorded physical evidence is shown. Registry entries do not imply execution.</p></div>{Array.isArray(tabValue) ? <DataTable rows={tabValue} /> : tabValue && typeof tabValue === 'object' ? <DataTable rows={Object.entries(tabValue).map(([key, value]) => ({ metric: key, value: typeof value === 'object' ? JSON.stringify(value) : value }))} /> : <DataTable rows={[]} />}</section>}
      </main>
    </div>
  </div>;
};
