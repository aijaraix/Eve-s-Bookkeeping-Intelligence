import React from 'react';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import { EngagementSummary } from '../../../types/presentationModels';
import { Briefcase, ArrowRight, ShieldCheck, FileCheck2, AlertCircle } from 'lucide-react';

export interface PracticeEngagementsViewProps {
  engagements: EngagementSummary[];
  onSelectEngagement: (engagementId: string) => void;
  onNavigate: (viewId: string) => void;
}

export const PracticeEngagementsView: React.FC<PracticeEngagementsViewProps> = ({
  engagements,
  onSelectEngagement,
  onNavigate
}) => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <EvePageHeader
        category="Practice Management"
        title="Audit Engagements"
        description="Formal statutory attestations, period audits, and reporting engagements under US-GAAP and IFRS."
      />

      <EveCard>
        <EveCardHeader>
          <EveCardTitle>Active Engagements</EveCardTitle>
          <span className="text-xs font-mono text-slate-400">
            {engagements.length} Engagement{engagements.length === 1 ? '' : 's'}
          </span>
        </EveCardHeader>
        <EveCardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Engagement / Client</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Framework</th>
                  <th className="py-3 px-4">Currency</th>
                  <th className="py-3 px-4">Sentinel Gate</th>
                  <th className="py-3 px-4">Facts / Evidence</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {engagements.map((eng) => (
                  <tr key={eng.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{eng.name}</div>
                          <div className="text-xs text-slate-500">{eng.clientName}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      {eng.period}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {eng.framework}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {eng.reportingCurrency}
                    </td>

                    <td className="py-3 px-4">
                      <EveStatusBadge
                        status={eng.readinessState === 'READY' ? 'clean' : 'review_required'}
                        label={eng.readinessState.replace(/_/g, ' ')}
                        size="sm"
                      />
                    </td>

                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
                      {eng.factsCount} facts / {eng.documentsCount} doc
                    </td>

                    <td className="py-3 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectEngagement(eng.id);
                          onNavigate('engagement-overview');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <span>Workbench</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EveCardContent>
      </EveCard>
    </div>
  );
};
