import React, { useState } from 'react';
import { usePractice } from '../context/PracticeContext';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  FileCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const AuditFindingsView: React.FC = () => {
  const { findings, resolveFinding, setIsCopilotOpen } = usePractice();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filtered = findings.filter(
    (f) => selectedCategory === 'all' || f.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <div id="audit-findings-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Audit Findings & Discrepancies</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated anomaly detection results cross-referencing published statements with notes and disclosure footnotes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Filter Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter audit findings by category"
            className="bg-slate-800 text-slate-200 text-xs font-semibold rounded-md px-3 py-1.5 border border-slate-700 cursor-pointer"
          >
            <option value="all">All Categories ({findings.length})</option>
            <option value="Footnote Mismatch">Footnote Mismatch</option>
            <option value="Arithmetic">Arithmetic</option>
            <option value="Disclosure Gap">Disclosure Gap</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((finding) => (
          <div
            key={finding.id}
            className={`p-5 rounded-xl border transition ${
              finding.resolved
                ? 'bg-slate-900/40 border-slate-800/60 opacity-70'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase border ${
                      finding.severity === 'critical'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : finding.severity === 'material'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {finding.severity}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-slate-800 text-cyan-400 border border-slate-700">
                    {finding.category}
                  </span>
                  <h3 className="text-sm font-bold text-white">{finding.title}</h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{finding.impactDescription}</p>

                <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 text-xs">
                  <span className="text-slate-400 font-semibold">Suggested Audit Workpaper Procedure: </span>
                  <span className="text-cyan-300">{finding.suggestedAction}</span>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span>Statement: <strong className="text-slate-400">{finding.statement}</strong></span>
                  <span>•</span>
                  <span>Source: <strong className="text-slate-400">{finding.evidenceSource}</strong> (p. {finding.page})</span>
                  <span>•</span>
                  <span>Periods: <strong className="text-slate-400">{finding.affectedPeriods.join(', ')}</strong></span>
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 gap-3">
                {finding.discrepancyAmount !== undefined && (
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-amber-400">
                      Δ €{finding.discrepancyAmount}M
                    </div>
                    <div className="text-[10px] text-slate-500">variance delta</div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => resolveFinding(finding.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      finding.resolved
                        ? 'bg-slate-800 hover:bg-slate-750 text-slate-400 border border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow shadow-emerald-600/20'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{finding.resolved ? 'Mark Unresolved' : 'One-Click Resolve'}</span>
                  </button>
                  <button
                    onClick={() => setIsCopilotOpen(true)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 transition cursor-pointer"
                    title="Consult Eve Copilot on this finding"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
