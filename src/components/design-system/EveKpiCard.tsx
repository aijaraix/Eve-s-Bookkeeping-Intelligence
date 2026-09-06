import React from 'react';
import { cn } from '../../lib/utils';
import { EveCard, EveCardContent } from './EveCard';
import { SourceToPixelMetadata } from '../../types/presentationModels';
import { ArrowUpRight, ArrowDownRight, Minus, FileSearch, ShieldCheck } from 'lucide-react';

export interface EveKpiCardProps {
  title: string;
  value: string | number;
  currency?: string;
  scale?: string;
  delta?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  status?: 'verified' | 'unverified' | 'review_required' | 'calculated';
  subtext?: string;
  lineage?: SourceToPixelMetadata;
  onInspect?: () => void;
  className?: string;
}

export const EveKpiCard: React.FC<EveKpiCardProps> = ({
  title,
  value,
  currency = 'USD',
  scale,
  delta,
  status = 'verified',
  subtext,
  lineage,
  onInspect,
  className
}) => {
  const isClickable = Boolean(onInspect);

  return (
    <EveCard
      className={cn(
        'group relative overflow-hidden',
        isClickable && 'cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all',
        className
      )}
      onClick={onInspect}
      // Source-to-Pixel Lineage Dataset Attributes (Phases 26 & 35)
      data-fact-lineage-id={lineage?.factLineageId || undefined}
      data-render-id={lineage?.renderId || undefined}
      data-canonical-metric={lineage?.canonicalMetric || title.toLowerCase().replace(/[^a-z0-9]/g, '_')}
      data-entity-id={lineage?.entityId || undefined}
      data-period={lineage?.period || undefined}
      data-currency={lineage?.currency || currency}
      data-scale={lineage?.scale || scale || undefined}
      data-provenance-status={lineage?.provenanceStatus || status}
    >
      <EveCardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">
            {title}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {status === 'verified' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            )}
            {status === 'review_required' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Review
              </span>
            )}
            {isClickable && (
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-indigo-600 rounded"
                title="Inspect Source Provenance"
              >
                <FileSearch className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono">
            {value}
          </span>
          {scale && (
            <span className="text-xs font-normal text-slate-500 lowercase">
              ({scale})
            </span>
          )}
        </div>

        {(delta || subtext) && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            {delta && (
              <span
                className={cn(
                  'inline-flex items-center font-medium gap-0.5 px-1.5 py-0.5 rounded text-[11px]',
                  delta.direction === 'up' && 'text-emerald-700 bg-emerald-50',
                  delta.direction === 'down' && 'text-rose-700 bg-rose-50',
                  delta.direction === 'neutral' && 'text-slate-600 bg-slate-100'
                )}
              >
                {delta.direction === 'up' && <ArrowUpRight className="w-3 h-3" />}
                {delta.direction === 'down' && <ArrowDownRight className="w-3 h-3" />}
                {delta.direction === 'neutral' && <Minus className="w-3 h-3" />}
                {delta.value}
                {delta.label && <span className="ml-1 text-slate-500 font-normal">{delta.label}</span>}
              </span>
            )}
            {subtext && <span className="truncate text-slate-400 text-[11px] ml-auto">{subtext}</span>}
          </div>
        )}
      </EveCardContent>
    </EveCard>
  );
};
