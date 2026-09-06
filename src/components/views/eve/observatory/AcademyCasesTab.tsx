import React from 'react';
import { GraduationCap, ShieldCheck, CheckCircle2, Clock, ArrowRight, ExternalLink, Filter, Search } from 'lucide-react';

export interface AcademyCasesTabProps {
  cases: any[];
  currentCaseId?: string;
  onSelectCase?: (caseId: string) => void;
  onOpenTwin?: (twinId: string) => void;
}

export const AcademyCasesTab: React.FC<AcademyCasesTabProps> = ({
  cases = [],
  currentCaseId,
  onSelectCase,
  onOpenTwin
}) => {
  const allCases = [
    {
      caseId: 'ACADEMY-CANARY-01',
      twinId: 'eng-sim-canary-01',
      issuer: 'AeroTech Dynamics GmbH',
      country: 'Germany (Frankfurt)',
      framework: 'IFRS',
      languages: ['English', 'German'],
      currencies: ['USD', 'EUR'],
      industry: 'Aerospace & Precision Tech',
      complexity: 'Leases & Multicurrency Group',
      status: 'ACTIVE_BENCHMARK',
      minervaVerdict: '100.0% NUMERIC INTEGRITY',
      caseReason: 'IFRS 16 lease schedule compliance, PBC workflow with Maria von Braun, and concurring partner review.'
    },
    {
      caseId: 'ACADEMY-CASE-001',
      twinId: 'twin-case-001',
      issuer: 'Apex Global Consumer PLC',
      country: 'United Kingdom (London)',
      framework: 'IFRS',
      languages: ['English'],
      currencies: ['EUR'],
      industry: 'Consumer Products',
      complexity: 'Multinational Parent-Subsidiary',
      status: 'COMPLETED',
      minervaVerdict: '100.0% EXACT MATCH',
      caseReason: 'Standard IFRS multinational consumer products continuing operations & consolidation verification.'
    },
    {
      caseId: 'ACADEMY-CASE-002',
      twinId: 'twin-case-002',
      issuer: 'Tokyo MicroSystems K.K.',
      country: 'Japan (Tokyo)',
      framework: 'US_GAAP',
      languages: ['Japanese', 'English'],
      currencies: ['JPY', 'USD'],
      industry: 'Technology',
      complexity: 'Segments & FX Consolidation',
      status: 'QUEUED',
      minervaVerdict: 'PENDING NEXT CYCLE',
      caseReason: 'Japanese GAAP equity competency & JPY multi-currency consolidation gap target.'
    },
    {
      caseId: 'ACADEMY-CASE-003',
      twinId: 'twin-case-003',
      issuer: 'Berlin Präzisionsmechanik AG',
      country: 'Germany (Berlin)',
      framework: 'IFRS',
      languages: ['German', 'English'],
      currencies: ['EUR', 'CHF'],
      industry: 'Manufacturing',
      complexity: 'Parent-Subsidiary Cross-Border',
      status: 'QUEUED',
      minervaVerdict: 'PENDING NEXT CYCLE',
      caseReason: 'German IFRS precision manufacturing multi-currency EUR/CHF cross-border coverage.'
    },
    {
      caseId: 'CANARY-AAPL-10K-FY23',
      twinId: 'twin-aapl-01',
      issuer: 'Apple Inc. (SEC 10-K FY23)',
      country: 'United States (California)',
      framework: 'US_GAAP',
      languages: ['English'],
      currencies: ['USD'],
      industry: 'Technology & Hardware',
      complexity: 'Multi-Segment Comprehensive 10-K',
      status: 'COMPLETED',
      minervaVerdict: '100.0% EXACT MATCH',
      caseReason: 'Baseline SEC EDGAR 10-K extraction benchmark with comprehensive note disclosures.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider block">
            Hermes Academy Case Registry
          </span>
          <h3 className="text-base font-bold text-white">
            Authoritative Ground Truth Benchmarks & Adaptive Curriculum
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Two-sided architecture: Side A Minerva Examiner Lab seals ground truths while Side B Hermes CPA Swarm solves.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Total Benchmarks</span>
            <span className="font-bold text-white">17 Cases</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Current Status</span>
            <span className="font-bold text-emerald-400">Continuous Active</span>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Case ID & Client</th>
                <th className="p-4">Country & Standard</th>
                <th className="p-4">Currency & Languages</th>
                <th className="p-4">Complexity & Industry</th>
                <th className="p-4">Minerva Evaluation</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {allCases.map((c) => {
                const isCurrent = c.status === 'ACTIVE_BENCHMARK';
                return (
                  <tr
                    key={c.caseId}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      isCurrent ? 'bg-indigo-950/30' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        {c.issuer}
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[11px] block mt-0.5">{c.caseId}</span>
                      <p className="text-[11px] text-slate-300 font-sans mt-1 line-clamp-1 italic">
                        {c.caseReason}
                      </p>
                    </td>

                    <td className="p-4">
                      <div className="text-slate-200 font-bold">{c.framework}</div>
                      <span className="text-slate-400 text-[11px]">{c.country}</span>
                    </td>

                    <td className="p-4">
                      <div className="text-cyan-300 font-bold">{c.currencies.join(' / ')}</div>
                      <span className="text-slate-400 text-[11px]">{c.languages.join(', ')}</span>
                    </td>

                    <td className="p-4">
                      <div className="text-slate-200 font-bold">{c.complexity}</div>
                      <span className="text-slate-400 text-[11px]">{c.industry}</span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          c.status === 'COMPLETED' || c.status === 'ACTIVE_BENCHMARK'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {c.minervaVerdict}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => onOpenTwin?.(c.twinId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                      >
                        <span>View Twin</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
