import React from 'react';
import { cn } from '../../lib/utils';
import { EveCard, EveCardContent } from './EveCard';
import { EveStatusBadge } from './EveStatusBadge';
import { ShieldAlert, AlertTriangle, Info, CheckCircle, FileText, ArrowRight } from 'lucide-react';

export interface EveFindingCardProps {
  id: string;
  title: string;
  category: string;
  severity: 'critical' | 'warning' | 'info';
  impactedMetric?: string;
  description: string;
  evidenceQuote?: string;
  sourceCitation?: string;
  recommendedAction?: string;
  resolved?: boolean;
  onResolve?: (id: string) => void;
  onInspectEvidence?: () => void;
  className?: string;
}

export const EveFindingCard: React.FC<EveFindingCardProps> = ({
  id,
  title,
  category,
  severity,
  impactedMetric,
  description,
  evidenceQuote,
  sourceCitation,
  recommendedAction,
  resolved = false,
  onResolve,
  onInspectEvidence,
  className
}) => {
  return (
    <EveCard
      className={cn(
        'transition-all duration-200 border-l-4',
        severity === 'critical' && !resolved && 'border-l-rose-500 bg-rose-50/20',
        severity === 'warning' && !resolved && 'border-l-amber-500 bg-amber-50/20',
        severity === 'info' && !resolved && 'border-l-sky-500 bg-sky-50/20',
        resolved && 'border-l-emerald-500 bg-slate-50/50 opacity-75',
        className
      )}
    >
      <EveCardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0">
              {severity === 'critical' && !resolved && <ShieldAlert className="w-5 h-5 text-rose-600" />}
              {severity === 'warning' && !resolved && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {severity === 'info' && !resolved && <Info className="w-5 h-5 text-sky-600" />}
              {resolved && <CheckCircle className="w-5 h-5 text-emerald-600" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={cn('text-sm font-semibold tracking-tight', resolved ? 'line-through text-slate-500' : 'text-slate-900')}>
                  {title}
                </h4>
                <EveStatusBadge
                  status={resolved ? 'verified' : severity === 'critical' ? 'failed' : severity === 'warning' ? 'review_required' : 'neutral'}
                  label={resolved ? 'Resolved' : severity.toUpperCase()}
                  size="sm"
                />
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                  {category}
                </span>
              </div>
              {impactedMetric && (
                <p className="text-xs text-slate-600 mt-1 font-mono">
                  Impacted Metric: <strong className="text-slate-800">{impactedMetric}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {onResolve && (
              <button
                type="button"
                onClick={() => onResolve(id)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer',
                  resolved
                    ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    : 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700 shadow-2xs'
                )}
              >
                {resolved ? 'Reopen Finding' : 'Approve / Clear'}
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          {description}
        </p>

        {evidenceQuote && (
          <div className="my-3 p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-mono text-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-sans font-bold tracking-wider block mb-1">
              Source Evidence Citation:
            </span>
            <blockquote className="italic border-l-2 border-slate-400 pl-2 text-slate-800">
              "{evidenceQuote}"
            </blockquote>
            {sourceCitation && (
              <span className="mt-1.5 inline-block text-[11px] text-indigo-600 font-sans font-medium">
                {sourceCitation}
              </span>
            )}
          </div>
        )}

        {recommendedAction && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="font-semibold text-slate-700">Recommendation:</span>
              <span className="truncate">{recommendedAction}</span>
            </div>
            {onInspectEvidence && (
              <button
                type="button"
                onClick={onInspectEvidence}
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium shrink-0 cursor-pointer"
              >
                Inspect Lineage <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </EveCardContent>
    </EveCard>
  );
};
