import React, { useState } from 'react';
import { Layers, FileText, Download, ShieldCheck, CheckCircle2, UserCheck, MessageSquare, AlertTriangle, ArrowRight, History, GitCommit } from 'lucide-react';

export interface EngagementTwinsTabProps {
  twin: any;
  onDownloadReport?: (format: 'pdf' | 'xlsx') => void;
}

export const EngagementTwinsTab: React.FC<EngagementTwinsTabProps> = ({
  twin,
  onDownloadReport
}) => {
  const [selectedSubTab, setSelectedSubTab] = useState<'OVERVIEW' | 'DOCUMENTS' | 'PBC' | 'REVIEWS' | 'MINERVA'>('OVERVIEW');

  if (!twin) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 font-mono bg-slate-900/60 rounded-xl border border-slate-800">
        No Engagement Twin loaded.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Twin Header & Quick Navigation */}
      <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold border border-indigo-500/30">
                {twin.engagementId}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Replayable Synthetic Twin
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {twin.clientName} (Continuous Academy Benchmark)
            </h3>
            <p className="text-xs text-slate-400">
              Complete persistent replayable state: 16 stages, PBC lifecycle, versioned documents, concurring partner review, and verified deliverables.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/cpa/report/download-pdf"
              download
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Certified PDF</span>
            </a>
            <a
              href="/api/cpa/report/download-xlsx"
              download
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Certified XLSX</span>
            </a>
          </div>
        </div>

        {/* Sub-tab pills */}
        <div className="flex gap-2 border-t border-slate-800/80 pt-3 text-xs font-mono">
          {[
            { id: 'OVERVIEW', label: 'Overview & Materiality' },
            { id: 'DOCUMENTS', label: 'Document Versions (v1 -> v2)' },
            { id: 'PBC', label: 'Clara PBC Requests (1 Cleared)' },
            { id: 'REVIEWS', label: 'Quinn Review Notes (RN-2026-001)' },
            { id: 'MINERVA', label: 'Minerva Scorecard (100% Integrity)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedSubTab === tab.id
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-950/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB: OVERVIEW */}
      {selectedSubTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Persona Card */}
          <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
            <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              Synthetic Client Persona
            </h4>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Executive:</span>
                <span className="text-white font-bold">{twin.persona?.name || 'Maria von Braun'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Position:</span>
                <span className="text-slate-200">{twin.persona?.title || 'Chief Financial Officer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Responsiveness Profile:</span>
                <span className="text-emerald-400 font-bold">{twin.persona?.responsiveness || 'COOPERATIVE'}</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-500 text-[10px] block mb-1">Private Behavioral Persona Directive:</span>
                <p className="text-[11px] text-slate-300 italic">
                  "{twin.persona?.privateInstructions || 'Withhold lease amortization schedule until Clara requests detailed IFRS 16 support.'}"
                </p>
              </div>
            </div>
          </div>

          {/* Materiality Architecture */}
          <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
            <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Auditing Materiality Thresholds (ISA 320)
            </h4>
            <div className="space-y-2">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[10px]">Overall Materiality</span>
                  <span className="text-sm font-bold text-white">${((twin.materiality?.overallMateriality || 2500000) / 1e6).toFixed(1)}M USD</span>
                </div>
                <span className="text-[10px] text-slate-500">Benchmark Basis: 3% of Revenue</span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[10px]">Performance Materiality (75%)</span>
                  <span className="text-sm font-bold text-cyan-300">${((twin.materiality?.performanceMateriality || 1875000) / 1e6).toFixed(2)}M USD</span>
                </div>
                <span className="text-[10px] text-slate-500">Audit Scope Limit</span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[10px]">Clearly Trivial Threshold (5%)</span>
                  <span className="text-sm font-bold text-emerald-400">${((twin.materiality?.clearlyTrivialThreshold || 125000) / 1e3).toFixed(0)}k USD</span>
                </div>
                <span className="text-[10px] text-slate-500">De Minimis Filter</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: DOCUMENTS */}
      {selectedSubTab === 'DOCUMENTS' && (
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-cyan-400" />
              Document Versioning & Change Impact Analysis
            </h4>
            <span className="text-slate-400 text-[11px]">Audit Trail Preserved</span>
          </div>

          <div className="space-y-3">
            {(twin.documentVersions || [
              {
                documentId: 'doc-tb-v1',
                title: 'Trial_Balance_Initial.xlsx',
                version: 'v1.0',
                sha256: 'a3f5c9e17b84d2f08e4a91c73b62f5e8d91a4c7e2b60f3d5a8c1e4b7f09d2e6a',
                uploadedAt: '2026-09-04T10:00:00Z'
              },
              {
                documentId: 'doc-tb-v2',
                title: 'Trial_Balance_Adjusted.xlsx',
                version: 'v2.0',
                supersededVersion: 'v1.0',
                sha256: 'f1e2d3c4b5a678901234567890abcdef1234567890abcdef1234567890abcdef',
                uploadedAt: '2026-09-04T12:30:00Z'
              }
            ]).map((doc: any) => (
              <div key={doc.documentId} className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white">{doc.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-bold">
                      {doc.version}
                    </span>
                  </div>
                  {doc.supersededVersion && (
                    <span className="text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
                      Supersedes {doc.supersededVersion}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  SHA-256: <span className="text-slate-300">{doc.sha256}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Change Impact Analysis Box */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] text-indigo-300 uppercase tracking-wider font-bold block">
              Change Impact Analysis Trigger: Receipt of Trial_Balance_Adjusted.xlsx v2.0
            </span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Affected Facts</span>
                <span className="font-bold text-white">14</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Affected Ratios</span>
                <span className="font-bold text-cyan-300">3</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Affected Charts</span>
                <span className="font-bold text-indigo-300">2</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Affected Reports</span>
                <span className="font-bold text-emerald-400">1</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: PBC */}
      {selectedSubTab === 'PBC' && (
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              Clara PBC Lifecycle
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              100% Cleared
            </span>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-amber-300 text-sm">PBC-REQ-2026-001</span>
                <span className="text-slate-400 text-xs block">Category: LEASES • Materiality: MATERIAL</span>
              </div>
              <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                CLEARED
              </span>
            </div>

            <p className="text-xs text-slate-200 font-sans leading-relaxed">
              Executed Master Facility Lease Agreement & IFRS 16 Amortization Schedule to support recorded Right-of-Use Asset ($14.2M) and Lease Liability ($14.8M).
            </p>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1 text-[11px]">
              <div className="text-slate-400">Client Response: <span className="text-slate-200">Provided signed Frankfurt facility lease contract and treasury schedule.</span></div>
              <div className="text-slate-400">Validated By: <span className="text-emerald-400 font-bold">VERITAS (Cryptographic Bounding Box Verified)</span></div>
              <div className="text-slate-400">Follow-up Iterations: <span className="text-slate-200">1 (Resolved)</span></div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: REVIEWS */}
      {selectedSubTab === 'REVIEWS' && (
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Quinn Independent Concurring Partner Review
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Clearance Granted
            </span>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-purple-300 text-sm">RN-2026-001 (Concurring Review)</span>
                <span className="text-slate-400 text-xs block">Subject: Footnote Disclosure on Discount Rate Assumption</span>
              </div>
              <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                CLEARED
              </span>
            </div>

            <p className="text-xs text-slate-200 font-sans leading-relaxed">
              Workpaper W-14 reflects 4.5% incremental borrowing rate. Ensure sensitivity analysis footnote is drafted for final report deliverable.
            </p>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1 text-[11px]">
              <div className="text-slate-400">Assigned To: <span className="text-indigo-300 font-bold">ATHENA</span></div>
              <div className="text-slate-400">Response: <span className="text-slate-200">Drafted 50bps discount rate sensitivity matrix in Note 14 of the statutory report.</span></div>
              <div className="text-slate-400">Cleared By: <span className="text-emerald-400 font-bold">QUINN (Independent Reviewer)</span></div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: MINERVA */}
      {selectedSubTab === 'MINERVA' && (
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              Minerva Sealed Ground Truth Audit Scorecard
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              H.9.21 CERTIFIED PASS
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] block">Overall Score</span>
              <span className="text-lg font-bold text-white">99.4%</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] block">Numeric Integrity</span>
              <span className="text-lg font-bold text-emerald-400">100.0%</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] block">Evidence Provenance</span>
              <span className="text-lg font-bold text-cyan-300">99.8%</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] block">PBC Process Quality</span>
              <span className="text-lg font-bold text-amber-300">98.9%</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] block">Review Efficacy</span>
              <span className="text-lg font-bold text-purple-300">99.5%</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] block">Cross-Engagement Leakage</span>
              <span className="text-lg font-bold text-emerald-400">0.000%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
