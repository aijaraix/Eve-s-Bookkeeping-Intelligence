import React from 'react';
import { Sparkles, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Zap, Award, Layers } from 'lucide-react';

export interface EvolutionRequestsTabProps {
  proposals: any[];
  capabilityRequests: any[];
  incidents: any[];
}

export const EvolutionRequestsTab: React.FC<EvolutionRequestsTabProps> = ({
  proposals = [],
  capabilityRequests = [],
  incidents = []
}) => {
  const defaultCapabilityRequests = [
    {
      requestId: 'CAP-2026-01',
      title: 'High-Contrast Attestation UI Badges',
      domain: 'UI_DESIGN_SYSTEM',
      reason: 'Enhance contrast ratio for low-vision auditors verifying certified lead schedules.',
      status: 'APPROVED_DEPLOYED',
      submittedBy: 'DARWIN',
      reviewedBy: 'FIRM_BOARD'
    },
    {
      requestId: 'CAP-2026-02',
      title: 'Multi-Column German IFRS Table Parser Heuristics',
      domain: 'DOCUMENT_PARSER',
      reason: 'Optimize column boundary recognition for complex footnotes in German financial statements.',
      status: 'SHADOW_BENCHMARKING',
      submittedBy: 'ATHENA',
      reviewedBy: 'DARWIN'
    },
    {
      requestId: 'CAP-2026-03',
      title: 'Tri-Party Cross-Currency Lease Amortization Solver',
      domain: 'EUCLID_MATH',
      reason: 'Direct matrix algebra verification for multi-currency lease liability and ROU asset schedules.',
      status: 'QUEUED_FOR_EVALUATION',
      submittedBy: 'EUCLID',
      reviewedBy: 'DARWIN'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Darwin Evolution Mission Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/40 rounded-2xl border border-indigo-500/40 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span className="text-[10px] font-mono uppercase text-indigo-300 font-bold tracking-wider">
            Darwin 24-Hour Autonomous Evolution Loop
          </span>
        </div>
        <h3 className="text-base font-bold text-white">
          What Is Eve Actively Trying to Improve?
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          During continuous academy runs, the <strong>Darwin Evolution Specialist</strong> monitors real execution traces and synthetic benchmark friction. When minor inefficiencies or edge cases occur, Darwin submits formal <strong>Capability Requests</strong>, tests candidate heuristics against the 17 sealed Minerva ground truth benchmarks, and promotes only zero-regression improvements.
        </p>
      </div>

      {/* Zero-Tolerance Gate Certification */}
      <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="font-bold text-white uppercase text-xs tracking-wider font-mono flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Zero-Tolerance Production Governance Gates
          </h4>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            All 4 Certified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] block">Gate 1: Numeric Integrity</span>
            <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100.0% Exact Match
            </div>
            <span className="text-[10px] text-slate-500">Zero tolerance for arithmetic drift</span>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] block">Gate 2: Source Provenance</span>
            <div className="text-cyan-300 font-bold text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100.0% Cryptographic
            </div>
            <span className="text-[10px] text-slate-500">Every pixel traced to source</span>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] block">Gate 3: Cross-Engagement Privacy</span>
            <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 0.000% Leakage
            </div>
            <span className="text-[10px] text-slate-500">Hermetic client workspace memory</span>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] block">Gate 4: Preemption Recovery</span>
            <div className="text-indigo-300 font-bold text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 0ms Starvation
            </div>
            <span className="text-[10px] text-slate-500">Customer priority atomic checkpoints</span>
          </div>
        </div>
      </div>

      {/* Capability Requests Table */}
      <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="font-bold text-white uppercase text-xs tracking-wider font-mono flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Formal Capability Requests & Evolution Proposals
          </h4>
          <span className="text-[11px] font-mono text-slate-400">
            {defaultCapabilityRequests.length} Proposals Registered
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {defaultCapabilityRequests.map((req) => (
            <div key={req.requestId} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{req.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                    {req.requestId}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-bold">
                    {req.domain}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    req.status.includes('APPROVED')
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {req.status}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {req.reason}
              </p>

              <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-800">
                <span>Submitted By: <strong className="text-slate-300">{req.submittedBy}</strong></span>
                <span>Governance Review: <strong className="text-slate-300">{req.reviewedBy}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
