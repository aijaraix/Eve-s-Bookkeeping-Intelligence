import React from 'react';
import { cn } from '../../lib/utils';
import { EveStatusBadge } from './EveStatusBadge';
import { Building2, Calendar, Globe2, ShieldCheck, ChevronDown } from 'lucide-react';

export interface EveEngagementHeaderProps {
  clientName: string;
  engagementName: string;
  period: string;
  currency: string;
  framework: string;
  readinessState: string;
  openFindingsCount: number;
  onSwitchEngagement?: () => void;
  className?: string;
}

export const EveEngagementHeader: React.FC<EveEngagementHeaderProps> = ({
  clientName,
  engagementName,
  period,
  currency = 'USD',
  framework = 'US-GAAP',
  readinessState = 'READY',
  openFindingsCount = 0,
  onSwitchEngagement,
  className
}) => {
  return (
    <div
      className={cn(
        'bg-white border-b border-slate-200/90 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs',
        className
      )}
    >
      {/* Client & Engagement Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <span>{clientName || 'Microsoft Corporation'}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600 font-normal">{engagementName || 'FY2024 Audit'}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span>Period: <strong className="text-slate-600">{period || 'FY2024 (Annual)'}</strong></span>
              <span>•</span>
              <span>Scope: <strong className="text-slate-600">Consolidated</strong></span>
            </div>
          </div>
        </div>

        {onSwitchEngagement && (
          <button
            type="button"
            onClick={onSwitchEngagement}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
            title="Switch Client or Engagement"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Accounting & Regulatory Metadata */}
      <div className="flex items-center gap-3 flex-wrap font-mono">
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/70 text-slate-700">
          <Globe2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Currency: <strong className="text-slate-900">{currency}</strong></span>
        </div>

        <div className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/70 text-slate-700">
          <span>Standard: <strong className="text-slate-900">{framework}</strong></span>
        </div>

        {/* Sentinel Readiness Gate */}
        <div className="flex items-center gap-2 font-sans">
          <EveStatusBadge
            status={readinessState.toLowerCase().includes('ready') ? 'clean' : 'review_required'}
            label={`Gate: ${readinessState.replace(/_/g, ' ')}`}
            size="sm"
          />
          {openFindingsCount > 0 ? (
            <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
              {openFindingsCount} Open Review Item{openFindingsCount === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> 0 Findings
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
