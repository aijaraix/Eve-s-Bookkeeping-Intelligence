import React from 'react';
import { GraduationCap, CheckCircle2, AlertCircle, Sparkles, Globe, Layers, ArrowRight } from 'lucide-react';

export interface CurriculumTabProps {
  coverage: any;
}

export const CurriculumTab: React.FC<CurriculumTabProps> = ({ coverage }) => {
  const languages = [
    { code: 'en', name: 'English', status: 'VERIFIED', benchmarks: 12 },
    { code: 'de', name: 'German', status: 'VERIFIED', benchmarks: 4 },
    { code: 'ja', name: 'Japanese', status: 'IN_PROGRESS', benchmarks: 2 },
    { code: 'fr', name: 'French', status: 'VERIFIED', benchmarks: 3 },
    { code: 'es', name: 'Spanish', status: 'VERIFIED', benchmarks: 3 },
    { code: 'pl', name: 'Polish', status: 'IN_PROGRESS', benchmarks: 1 },
    { code: 'he', name: 'Hebrew', status: 'TARGET_GAP', benchmarks: 1 }
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar', status: 'VERIFIED' },
    { code: 'EUR', name: 'Euro', status: 'VERIFIED' },
    { code: 'GBP', name: 'British Pound', status: 'VERIFIED' },
    { code: 'JPY', name: 'Japanese Yen', status: 'VERIFIED' },
    { code: 'CHF', name: 'Swiss Franc', status: 'VERIFIED' },
    { code: 'CAD', name: 'Canadian Dollar', status: 'VERIFIED' },
    { code: 'PLN', name: 'Polish Zloty', status: 'IN_PROGRESS' }
  ];

  const frameworks = [
    { name: 'US-GAAP', full: 'FASB Accounting Standards Codification', coverage: '99.6%', status: 'PRODUCTION_VERIFIED' },
    { name: 'IFRS', full: 'International Financial Reporting Standards', coverage: '99.4%', status: 'PRODUCTION_VERIFIED' }
  ];

  const industries = [
    { name: 'Technology & Cloud Services', status: 'CERTIFIED', weight: 'High' },
    { name: 'Aerospace & Precision Manufacturing', status: 'CERTIFIED', weight: 'High' },
    { name: 'Consumer Products & Retail', status: 'CERTIFIED', weight: 'High' },
    { name: 'Pharmaceuticals & Life Sciences', status: 'ACTIVE_BENCHMARK', weight: 'Medium' },
    { name: 'Telecommunications & Media', status: 'QUEUED', weight: 'Medium' },
    { name: 'Financial Services & Banking', status: 'PLANNED', weight: 'High' }
  ];

  const complexities = [
    { tier: 'Tier 1', name: 'Single Entity Operating Statement', status: 'MASTERED' },
    { tier: 'Tier 2', name: 'Parent-Subsidiary Two-Tier Consolidation', status: 'MASTERED' },
    { tier: 'Tier 3', name: 'Multi-Currency Foreign Operations & Leases (IFRS 16 / ASC 842)', status: 'MASTERED' },
    { tier: 'Tier 4', name: 'Discontinued Operations & Segment Reporting', status: 'BENCHMARKING' },
    { tier: 'Tier 5', name: 'Complex Debt/Equity Hybrid Instruments', status: 'CURRICULUM_ROADMAP' }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl space-y-2">
        <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider block">
          Hermes Autonomous Curriculum Matrix
        </span>
        <h3 className="text-base font-bold text-white">
          Self-Directing Multi-Dimensional Audit Competency Architecture
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Hermes autonomously identifies gaps across international frameworks, languages, currencies, and technical complexities, queuing synthetic and real benchmarks to eliminate competency deficits.
        </p>
      </div>

      {/* Grid: Frameworks & Complexities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Accounting Frameworks */}
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
          <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-purple-400" />
            Core Accounting Standards
          </h4>

          <div className="space-y-3">
            {frameworks.map((fw) => (
              <div key={fw.name} className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">{fw.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {fw.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{fw.full}</p>
                <div className="text-[10px] text-cyan-400 pt-1 border-t border-slate-800">
                  Benchmarked Coverage: <strong className="text-white">{fw.coverage}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complexity Progression Tiers */}
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
          <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Technical Complexity Tiers
          </h4>

          <div className="space-y-2">
            {complexities.map((comp) => (
              <div key={comp.tier} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-indigo-400 font-bold mr-2">{comp.tier}:</span>
                  <span className="text-slate-200">{comp.name}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    comp.status === 'MASTERED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {comp.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Languages & Currencies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Languages */}
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
          <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            Multilingual Parsing Coverage
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {languages.map((lang) => (
              <div key={lang.code} className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{lang.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{lang.code}</span>
                </div>
                <span
                  className={`block text-[9px] font-bold ${
                    lang.status === 'VERIFIED'
                      ? 'text-emerald-400'
                      : lang.status === 'IN_PROGRESS'
                      ? 'text-indigo-400'
                      : 'text-amber-400'
                  }`}
                >
                  {lang.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Currencies */}
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
          <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Multi-Currency FX Ledger Engines
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {currencies.map((curr) => (
              <div key={curr.code} className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{curr.code}</span>
                  <span className="text-[10px] text-slate-500">{curr.name}</span>
                </div>
                <span className="block text-[9px] font-bold text-emerald-400">
                  {curr.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
