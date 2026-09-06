import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, FileText, Download, ShieldCheck, UserCheck, MessageSquare } from 'lucide-react';

export interface ObservatoryEngagementViewProps {
  twin: any;
  onDownloadReport?: (format: 'pdf' | 'xlsx') => void;
}

const STAGES = [
  'ONBOARDING',
  'INITIAL_PBC',
  'DOCUMENTS_RECEIVED',
  'INGESTION',
  'EXTRACTION',
  'RECONCILIATION',
  'EVIDENCE_REVIEW',
  'CLIENT_FOLLOW_UP',
  'ADDITIONAL_DOCUMENTS',
  'REPROCESSING',
  'PREPARER_COMPLETE',
  'INTERNAL_REVIEW',
  'REVIEW_NOTES',
  'CLEARANCE',
  'REPORT_WIZARD',
  'FINAL_DELIVERABLE',
  'ENGAGEMENT_COMPLETE'
];

export const ObservatoryEngagementView: React.FC<ObservatoryEngagementViewProps> = ({
  twin,
  onDownloadReport
}) => {
  if (!twin) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 font-mono bg-slate-900/60 rounded-xl border border-slate-800">
        No active engagement twin loaded.
      </div>
    );
  }

  const currentStageIndex = STAGES.indexOf(twin.currentStage || 'FINAL_DELIVERABLE');

  return (
    <div className="space-y-6">
      {/* 16-Stage Interactive Stepper */}
      <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
              16-Stage Engagement Lifecycle State Machine
            </span>
            <h4 className="text-sm font-bold text-white">
              {twin.clientName} ({twin.engagementId})
            </h4>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Current: {twin.currentStage || 'FINAL_DELIVERABLE'}
          </span>
        </div>

        {/* Stepper Scroll Row */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center gap-2 min-w-[980px]">
            {STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage} className="flex items-center gap-1.5 flex-1">
                  <div
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono whitespace-nowrap border flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-indigo-600 text-white font-bold border-indigo-400 shadow-md shadow-indigo-500/20 ring-2 ring-indigo-400/30'
                        : isPast
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 font-semibold'
                        : 'bg-slate-950/50 text-slate-500 border-slate-800'
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : isCurrent ? (
                      <Clock className="w-3 h-3 text-white animate-spin" />
                    ) : (
                      <span className="w-3 h-3 text-center text-[9px] text-slate-600">{idx + 1}</span>
                    )}
                    <span>{stage.replace(/_/g, ' ')}</span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-slate-700 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Synthetic Persona, Materiality, PBC Requests & Review Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Synthetic Persona & Materiality */}
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              Synthetic Client Persona
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Minerva Sealed
            </span>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Name:</span>
              <span className="font-bold text-white">{twin.persona?.name || 'Maria von Braun'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Title:</span>
              <span className="text-slate-200">{twin.persona?.title || 'Chief Financial Officer'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Company:</span>
              <span className="text-slate-200">{twin.persona?.companyName || 'AeroTech Dynamics GmbH'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Responsiveness:</span>
              <span className="text-emerald-400 font-bold">{twin.persona?.responsiveness || 'COOPERATIVE'}</span>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <span className="text-slate-500 text-[10px] block mb-1">Private Scenario Instructions (Sealed from Solver):</span>
              <p className="text-[11px] text-slate-300 italic">
                "{twin.persona?.privateInstructions || 'Withhold lease schedule until Clara requests detailed IFRS 16 support.'}"
              </p>
            </div>
          </div>

          {/* Materiality Architecture */}
          {twin.materiality && (
            <div className="space-y-2 font-mono text-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                Auditing Materiality Thresholds
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Overall</span>
                  <span className="text-xs font-bold text-white">${(twin.materiality.overallMateriality / 1e6).toFixed(1)}M</span>
                </div>
                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Performance</span>
                  <span className="text-xs font-bold text-cyan-300">${(twin.materiality.performanceMateriality / 1e6).toFixed(2)}M</span>
                </div>
                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Trivial</span>
                  <span className="text-xs font-bold text-emerald-400">${(twin.materiality.clearlyTrivialThreshold / 1e3).toFixed(0)}k</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PBC Requests & Review Notes */}
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              Clara PBC & Quinn Review Notes
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              All Cleared
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* PBC Request */}
            {twin.pbcRequests?.map((pbc: any) => (
              <div key={pbc.requestId} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-300">{pbc.requestId}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {pbc.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans">{pbc.description}</p>
                <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/80">
                  <span>Category: {pbc.requestCategory}</span>
                  <span>Follow-ups: {pbc.followUpCount}</span>
                </div>
              </div>
            ))}

            {/* Review Note */}
            {twin.reviewNotes?.map((rn: any) => (
              <div key={rn.reviewNoteId} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-purple-300">{rn.reviewNoteId} (Quinn Review)</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {rn.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans">{rn.description}</p>
                <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/80">
                  <span>Assigned: {rn.assignedTo}</span>
                  <span>Cleared By: {rn.clearedBy || 'QUINN'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deliverables Bar */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950/60 rounded-2xl border border-indigo-500/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase text-indigo-300 font-bold tracking-wider block">
            Certified Statutory Deliverables
          </span>
          <h4 className="text-sm font-bold text-white">
            Binary PDF & XLSX Lead Schedules with Identical Cryptographic Hashes
          </h4>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/cpa/report/download-pdf"
            download
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-colors shadow-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Certified PDF
          </a>
          <a
            href="/api/cpa/report/download-xlsx"
            download
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-colors shadow-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Certified XLSX
          </a>
        </div>
      </div>
    </div>
  );
};
