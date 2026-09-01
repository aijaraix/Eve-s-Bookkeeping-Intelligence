import React, { useState } from 'react';
import { Sparkles, TrendingUp, Sliders, Zap, CheckCircle2 } from 'lucide-react';

export const ForecastView: React.FC = () => {
  const [scenario, setScenario] = useState<'BASE' | 'BULL' | 'BEAR'>('BASE');
  const [growthRate, setGrowthRate] = useState<number>(scenario === 'BULL' ? 4.5 : scenario === 'BEAR' ? 0.5 : 2.5);

  const getMultipliers = () => {
    if (scenario === 'BULL') return { rev26: '€52,775M', rev27: '€55,150M', ebitda26: '€12,200M', ebitda27: '€13,100M' };
    if (scenario === 'BEAR') return { rev26: '€50,755M', rev27: '€51,009M', ebitda26: '€11,100M', ebitda27: '€11,250M' };
    return { rev26: '€51,765M', rev27: '€53,059M', ebitda26: '€11,650M', ebitda27: '€12,100M' };
  };

  const proj = getMultipliers();

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Financial Projections & Scenario Engine</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Eve AI Monte Carlo Model
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unilever PLC • Predictive Financial Forecast for FY2026 – FY2027
          </p>
        </div>

        {/* Scenario Selector Buttons */}
        <div className="flex items-center gap-2">
          {(['BASE', 'BULL', 'BEAR'] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setScenario(s);
                setGrowthRate(s === 'BULL' ? 4.5 : s === 'BEAR' ? 0.5 : 2.5);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                scenario === s
                  ? s === 'BULL' ? 'bg-emerald-600 text-white shadow-xs' : s === 'BEAR' ? 'bg-amber-600 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {s} CASE
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Output Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase">FY2026 REVENUE PROJECTION</div>
          <div className="text-2xl font-extrabold text-blue-600">{proj.rev26}</div>
          <div className="text-xs text-slate-500 font-semibold">+2.5% Organic Growth Model</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase">FY2027 REVENUE PROJECTION</div>
          <div className="text-2xl font-extrabold text-blue-600">{proj.rev27}</div>
          <div className="text-xs text-slate-500 font-semibold">+5.0% Cumulative Expansion</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase">FY2026 EBITDA ESTIMATE</div>
          <div className="text-2xl font-extrabold text-emerald-600">{proj.ebitda26}</div>
          <div className="text-xs text-slate-500 font-semibold">22.5% EBITDA Margin</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase">FY2027 EBITDA ESTIMATE</div>
          <div className="text-2xl font-extrabold text-emerald-600">{proj.ebitda27}</div>
          <div className="text-xs text-slate-500 font-semibold">22.8% EBITDA Margin</div>
        </div>
      </div>

      {/* Sensitivity Slider Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              ORGANIC VOLUME & PRICE GROWTH SENSITIVITY ADJUSTMENT
            </h3>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
            Current Rate: {growthRate}% YoY
          </span>
        </div>

        <input
          type="range"
          min="-2.0"
          max="8.0"
          step="0.5"
          value={growthRate}
          onChange={(e) => setGrowthRate(parseFloat(e.target.value))}
          className="w-full accent-purple-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Severe Contraction (-2.0%)</span>
          <span>Baseline FY25 (+2.5%)</span>
          <span>High Growth (+8.0%)</span>
        </div>
      </div>
    </div>
  );
};
