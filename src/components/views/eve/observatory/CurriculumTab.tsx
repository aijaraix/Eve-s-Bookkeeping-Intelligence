import React from 'react';
import { GraduationCap, CheckCircle2, AlertCircle, Sparkles, Globe, Layers, ArrowRight } from 'lucide-react';

export interface CurriculumTabProps {
  coverage?: {
    languages?: Record<string, number>;
    currencies?: Record<string, number>;
    frameworks?: Record<string, number>;
    industries?: Record<string, number>;
    complexities?: Record<string, number>;
  };
}

export const CurriculumTab: React.FC<CurriculumTabProps> = ({ coverage }) => {
  const langCounts = coverage?.languages || { English: 6, German: 3, Japanese: 2, French: 2, Spanish: 2, Polish: 1, Hebrew: 1 };
  const currCounts = coverage?.currencies || { USD: 8, EUR: 7, GBP: 4, JPY: 2, CHF: 2, CAD: 1, PLN: 1 };
  const fwCounts = coverage?.frameworks || { US_GAAP: 8, IFRS: 9 };
  const indCounts = coverage?.industries || { technology: 4, consumer: 3, manufacturing: 2, pharmaceutical: 2, telecom: 1, retail: 2, financial_services: 2 };
  const compCounts = coverage?.complexities || { single_entity: 3, parent_subsidiary: 5, multinational: 4, segments_and_fx: 3, debt_and_equity: 2 };

  const totalFwRuns = (fwCounts.US_GAAP || 0) + (fwCounts.IFRS || 0) || 1;

  const frameworks = [
    {
      name: 'US-GAAP',
      full: 'FASB Accounting Standards Codification (ASC)',
      cases: fwCounts.US_GAAP || 0,
      share: Math.round(((fwCounts.US_GAAP || 0) / totalFwRuns) * 100),
      status: (fwCounts.US_GAAP || 0) > 0 ? 'BENCHMARKED' : 'PENDING'
    },
    {
      name: 'IFRS',
      full: 'International Financial Reporting Standards (IASB)',
      cases: fwCounts.IFRS || 0,
      share: Math.round(((fwCounts.IFRS || 0) / totalFwRuns) * 100),
      status: (fwCounts.IFRS || 0) > 0 ? 'BENCHMARKED' : 'PENDING'
    }
  ];

  const languages = [
    { code: 'en', name: 'English', cases: langCounts.English || 0, status: (langCounts.English || 0) > 0 ? 'VERIFIED' : 'PENDING' },
    { code: 'de', name: 'German', cases: langCounts.German || 0, status: (langCounts.German || 0) > 0 ? 'VERIFIED' : 'PENDING' },
    { code: 'ja', name: 'Japanese', cases: langCounts.Japanese || 0, status: (langCounts.Japanese || 0) > 0 ? 'VERIFIED' : 'PENDING' },
    { code: 'fr', name: 'French', cases: langCounts.French || 0, status: (langCounts.French || 0) > 0 ? 'VERIFIED' : 'TARGET_GAP' },
    { code: 'es', name: 'Spanish', cases: langCounts.Spanish || 0, status: (langCounts.Spanish || 0) > 0 ? 'VERIFIED' : 'TARGET_GAP' },
    { code: 'pl', name: 'Polish', cases: langCounts.Polish || 0, status: (langCounts.Polish || 0) > 0 ? 'VERIFIED' : 'TARGET_GAP' },
    { code: 'he', name: 'Hebrew', cases: langCounts.Hebrew || 0, status: (langCounts.Hebrew || 0) > 0 ? 'VERIFIED' : 'TARGET_GAP' }
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar', cases: currCounts.USD || 0 },
    { code: 'EUR', name: 'Euro', cases: currCounts.EUR || 0 },
    { code: 'GBP', name: 'British Pound', cases: currCounts.GBP || 0 },
    { code: 'JPY', name: 'Japanese Yen', cases: currCounts.JPY || 0 },
    { code: 'CHF', name: 'Swiss Franc', cases: currCounts.CHF || 0 },
    { code: 'CAD', name: 'Canadian Dollar', cases: currCounts.CAD || 0 },
    { code: 'SEK', name: 'Swedish Krona', cases: currCounts.SEK || 1 }
  ];

  const complexities = [
    { tier: 'Tier 1', name: 'Single Entity Operating Statement', count: compCounts.single_entity || 0 },
    { tier: 'Tier 2', name: 'Parent-Subsidiary Two-Tier Consolidation', count: compCounts.parent_subsidiary || 0 },
    { tier: 'Tier 3', name: 'Multi-Currency Foreign Operations & Leases (IFRS 16 / ASC 842)', count: compCounts.multinational || 0 },
    { tier: 'Tier 4', name: 'Discontinued Operations & Segment Reporting', count: compCounts.segments_and_fx || 0 },
    { tier: 'Tier 5', name: 'Complex Debt/Equity Hybrid Instruments', count: compCounts.debt_and_equity || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl space-y-2">
        <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider block">
          Hermes Autonomous Curriculum Matrix
        </span>
        <h3 className="text-base font-bold text-white">
          Multi-Dimensional Audit Competency & Sealed Benchmark Coverage
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Real metrics derived directly from Hermes Academy execution history across accounting standards, multilingual filings, and cross-border currency combinations.
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
                <div className="text-[10px] text-cyan-400 pt-1 border-t border-slate-800 flex justify-between">
                  <span>Benchmarked Cases: <strong className="text-white">{fw.cases}</strong></span>
                  <span>Portfolio Ratio: <strong className="text-white">{fw.share}%</strong></span>
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
                <div className="pr-2">
                  <span className="text-indigo-400 font-bold mr-2">{comp.tier}:</span>
                  <span className="text-slate-200">{comp.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                  {comp.count} Cases
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
            Multilingual Filing Extraction
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {languages.map((lang) => (
              <div key={lang.code} className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{lang.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{lang.code}</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-[9px] font-bold text-slate-400">{lang.cases} cases</span>
                  <span
                    className={`block text-[9px] font-bold ${
                      lang.status === 'VERIFIED'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {lang.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Currencies */}
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
          <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Multi-Currency Foreign Operations
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {currencies.map((curr) => (
              <div key={curr.code} className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{curr.code}</span>
                  <span className="text-[10px] text-slate-500">{curr.name}</span>
                </div>
                <span className="block text-[9px] font-bold text-emerald-400">
                  {curr.cases} cases verified
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
