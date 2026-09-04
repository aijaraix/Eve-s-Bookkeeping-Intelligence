import React from 'react';
import { mockEvidenceRegistry } from '../data/mockData';
import { Database, Search, CheckCircle2, FileText, ExternalLink } from 'lucide-react';

export const EvidenceRegistryView: React.FC = () => {
  return (
    <div id="evidence-registry-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Canonical Evidence & Provenance Registry</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Auditable provenance chain connecting every reported financial metric directly to its source PDF page and bounding box.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">
            {mockEvidenceRegistry.length} Registered Facts
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Fact Key</th>
                <th className="py-3 px-3 font-semibold text-right">Extracted Value</th>
                <th className="py-3 px-3 font-semibold">Period</th>
                <th className="py-3 px-4 font-semibold">Source Citation</th>
                <th className="py-3 px-4 font-semibold">Verifying Agent</th>
                <th className="py-3 px-3 font-semibold text-center">Authority Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {mockEvidenceRegistry.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/60 transition">
                  <td className="py-3 px-4 font-mono text-cyan-400 font-medium">
                    {item.factKey}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-white">
                    {typeof item.value === 'number' ? `€${item.value.toLocaleString()}M` : item.value}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {item.period}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{item.documentName}</span>
                      <span className="text-[11px] px-1 rounded bg-slate-800 text-slate-400 font-mono">
                        p.{item.pageNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 italic line-clamp-1">
                      "{item.extractedText}"
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {item.verificationAgent}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono border border-emerald-500/20 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{item.authorityScore}%</span>
                    </div>
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
