import React from 'react';
import { EveEngagementHeader } from '../../design-system/EveEngagementHeader';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import { RatioDerivationPresentation, SourceToPixelMetadata } from '../../../types/presentationModels';
import { LineChart, FileSearch, HelpCircle } from 'lucide-react';

export interface AnalysisRatiosViewProps {
  clientName: string;
  engagementName: string;
  period: string;
  currency: string;
  framework: string;
  readinessState: string;
  openFindingsCount: number;
  ratios: RatioDerivationPresentation[];
  onNavigate: (viewId: string) => void;
  onInspectFact: (metadata: SourceToPixelMetadata) => void;
}

export const AnalysisRatiosView: React.FC<AnalysisRatiosViewProps> = ({
  clientName,
  engagementName,
  period,
  currency = 'USD',
  framework = 'US-GAAP',
  readinessState = 'READY',
  openFindingsCount = 0,
  ratios,
  onNavigate,
  onInspectFact
}) => {
  return (
    <div className="space-y-0">
      <EveEngagementHeader
        clientName={clientName}
        engagementName={engagementName}
        period={period}
        currency={currency}
        framework={framework}
        readinessState={readinessState}
        openFindingsCount={openFindingsCount}
        onSwitchEngagement={() => onNavigate('practice-engagements')}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <EvePageHeader
          category="Financial Analytics"
          title="Financial Ratios & Derived Lineage"
          description="Audited financial ratios derived from canonical facts with explicit numerator/denominator lineage."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ratios.map((ratio) => (
            <EveCard key={ratio.id}>
              <EveCardHeader>
                <div>
                  <EveCardTitle>{ratio.name}</EveCardTitle>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{ratio.category}</p>
                </div>
                <EveStatusBadge status={ratio.status === 'Normal' ? 'clean' : 'review_required'} size="sm" />
              </EveCardHeader>

              <EveCardContent className="p-5 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-mono text-slate-900">{ratio.formattedValue}</span>
                  <span className="text-xs text-slate-500 font-mono">Benchmark: {ratio.benchmark}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs font-mono space-y-2">
                  <div className="text-slate-500 font-sans font-semibold">Formula: {ratio.formulaDescription}</div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-2 text-slate-700">
                    <span>{ratio.numeratorLabel}:</span>
                    <span className="font-bold">${ratio.numeratorValue ? (ratio.numeratorValue / 1_000_000).toLocaleString() : '—'}M</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>{ratio.denominatorLabel}:</span>
                    <span className="font-bold">${ratio.denominatorValue ? (ratio.denominatorValue / 1_000_000).toLocaleString() : '—'}M</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onInspectFact({
                        canonicalMetric: ratio.numeratorMetric,
                        period: ratio.period,
                        currency: ratio.currency,
                        scale: 'Millions'
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    <FileSearch className="w-3.5 h-3.5" /> Inspect Numerator Fact
                  </button>
                </div>
              </EveCardContent>
            </EveCard>
          ))}
        </div>
      </div>
    </div>
  );
};
