import React, { useState } from 'react';
import { GraduationCap, ShieldCheck, CheckCircle2, Clock, ArrowRight, Play, Zap, RefreshCw, Layers } from 'lucide-react';

export interface AcademyCasesTabProps {
  cases?: any[];
  caseHistory?: Record<string, { caseId: string; lastRunAt: string | null; executionCount: number; failureCount?: number; lastMode?: string }>;
  currentCaseId?: string;
  onSelectCase?: (caseId: string) => void;
  onOpenTwin?: (twinId: string) => void;
  onRunFullPractice?: (caseId: string) => Promise<void>;
  onRunFastRegression?: (caseId: string) => Promise<void>;
}

export const AcademyCasesTab: React.FC<AcademyCasesTabProps> = ({
  cases = [],
  caseHistory = {},
  currentCaseId,
  onSelectCase,
  onOpenTwin,
  onRunFullPractice,
  onRunFastRegression
}) => {
  const [runningAction, setRunningAction] = useState<string | null>(null);

  // Fallback fixtures if backend hasn't populated yet
  const defaultCases = [
    {
      caseId: 'ACADEMY-CASE-001',
      issuer: 'Apex Global Consumer PLC',
      framework: 'IFRS',
      industry: 'Consumer Products',
      complexity: 'Multinational Parent-Subsidiary',
      languages: ['English'],
      currencies: ['EUR'],
      period: 'FY 2025',
      expectedFactsCount: 6,
      sealed: true
    },
    {
      caseId: 'ACADEMY-CASE-002',
      issuer: 'Kyoto Robotics K.K.',
      framework: 'US_GAAP',
      industry: 'Technology & Robotics',
      complexity: 'Segments & Multi-Currency FX',
      languages: ['Japanese', 'English'],
      currencies: ['JPY', 'USD'],
      period: 'FY 2025',
      expectedFactsCount: 5,
      sealed: true
    },
    {
      caseId: 'ACADEMY-CASE-003',
      issuer: 'Bavaria Präzision AG',
      framework: 'IFRS',
      industry: 'Precision Manufacturing',
      complexity: 'Cross-Border Parent-Subsidiary',
      languages: ['German', 'English'],
      currencies: ['EUR', 'CHF'],
      period: 'FY 2025',
      expectedFactsCount: 5,
      sealed: true
    },
    {
      caseId: 'ACADEMY-CASE-004',
      issuer: 'Nordic CleanTech AB',
      framework: 'IFRS',
      industry: 'Clean Energy & Tech',
      complexity: 'R&D Capitalization & Deferred Taxes',
      languages: ['Swedish', 'English'],
      currencies: ['SEK', 'EUR'],
      period: 'FY 2025',
      expectedFactsCount: 4,
      sealed: true
    },
    {
      caseId: 'ACADEMY-CANARY-01',
      issuer: 'AeroTech Dynamics GmbH',
      framework: 'IFRS',
      industry: 'Aerospace & Precision Tech',
      complexity: 'IFRS 16 Leases & Multi-Currency',
      languages: ['English', 'German'],
      currencies: ['USD', 'EUR'],
      period: 'FY 2024',
      expectedFactsCount: 6,
      sealed: true
    }
  ];

  const displayCases = cases && cases.length > 0 ? cases : defaultCases;

  const handleAction = async (caseId: string, type: 'FULL' | 'FAST') => {
    setRunningAction(`${type}-${caseId}`);
    try {
      if (type === 'FULL' && onRunFullPractice) {
        await onRunFullPractice(caseId);
      } else if (type === 'FAST' && onRunFastRegression) {
        await onRunFastRegression(caseId);
      } else {
        // Fallback direct API invocation
        const endpoint = type === 'FULL' ? '/api/cpa/academy/full-practice' : '/api/cpa/academy/fast-regression';
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseId })
        });
      }
    } catch (e) {
      console.error('Failed to trigger academy run:', e);
    } finally {
      setRunningAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider block">
            Hermes Academy Case Registry & Dual-Cadence Autonomy
          </span>
          <h3 className="text-base font-bold text-white">
            Authoritative Ground Truth Benchmarks & Full Practice Engagements
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Two execution classes: <strong>Fast Regression</strong> (golden fixture integrity) and <strong>Full Practice</strong> (16-stage end-to-end CPA workflow with Minerva audit evaluation).
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Registered Benchmarks</span>
            <span className="font-bold text-white">{displayCases.length} Ground Truths</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Cadence Mode</span>
            <span className="font-bold text-emerald-400">Dual Adaptive</span>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Case ID & Issuer</th>
                <th className="p-4">Accounting Standard</th>
                <th className="p-4">Currency & Languages</th>
                <th className="p-4">Complexity & Industry</th>
                <th className="p-4">Execution History</th>
                <th className="p-4 text-right">Cadence Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayCases.map((c) => {
                const isCurrent = currentCaseId === c.caseId;
                const hist = caseHistory[c.caseId];
                const executionCount = hist?.executionCount || 0;
                const lastRunStr = hist?.lastRunAt
                  ? new Date(hist.lastRunAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Never';
                const lastMode = hist?.lastMode || (executionCount > 0 ? 'FAST_REGRESSION' : 'NONE');

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
                        {c.sealed && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                            SEALED
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[11px] block mt-0.5">{c.caseId} ({c.period || 'FY 2025'})</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {c.expectedFactsCount || 5} Sealed Financial Facts • Math & Reconciliation Gates
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="text-slate-200 font-bold">{c.framework}</div>
                      <span className="text-slate-400 text-[11px]">{c.industry || 'Corporate'}</span>
                    </td>

                    <td className="p-4">
                      <div className="text-cyan-300 font-bold">
                        {Array.isArray(c.currencies) ? c.currencies.join(' / ') : c.currencies || 'USD'}
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {Array.isArray(c.languages) ? c.languages.join(', ') : c.languages || 'English'}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="text-slate-200 font-bold">{c.complexity || 'Multi-Tier'}</div>
                      <span className="text-slate-400 text-[11px]">{c.industry}</span>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold">{executionCount}</span>
                          <span className="text-slate-400 text-[10px]">cycles</span>
                          {lastMode === 'FULL_PRACTICE' && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-700/50">
                              Full Practice
                            </span>
                          )}
                          {lastMode === 'FAST_REGRESSION' && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-sky-950/70 text-sky-300 border border-sky-700/50">
                              Regression
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Last: {lastRunStr}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleAction(c.caseId, 'FULL')}
                          disabled={runningAction !== null}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                          title="Run full 16-stage CPA practice engagement"
                        >
                          <Play className="w-3 h-3" />
                          <span>Full Practice</span>
                        </button>
                        <button
                          onClick={() => handleAction(c.caseId, 'FAST')}
                          disabled={runningAction !== null}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                          title="Run fast regression benchmark"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Regression</span>
                        </button>
                        {onOpenTwin && (
                          <button
                            onClick={() => onOpenTwin(c.twinId || 'eng-sim-canary-01')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View Twin"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
