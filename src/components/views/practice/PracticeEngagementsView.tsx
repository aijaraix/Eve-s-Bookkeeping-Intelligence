import React, { useState, useEffect } from 'react';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import { EngagementSummary } from '../../../types/presentationModels';
import {
  Briefcase,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  Building2,
  GraduationCap,
  FlaskConical,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText
} from 'lucide-react';

export interface UniversalEngagementItem {
  engagementId: string;
  clientName: string;
  classification: 'CUSTOMER' | 'ACADEMY' | 'CANARY' | 'DEMO';
  period: string;
  reportingStandard: 'US_GAAP' | 'IFRS';
  reportingCurrency: string;
  currentStage: string;
  stageProgressPercent: number;
  assignedPartner: string;
  assignedManager: string;
  documentsCount: number;
  canonicalFactsCount: number;
  openPbcCount: number;
  clearedPbcCount: number;
  openReviewNotesCount: number;
  clearedReviewNotesCount: number;
  reportsGeneratedCount: number;
  minervaOverallScore?: number;
  numericVariance: number;
  notes?: string;
  startedAt: string;
}

export interface PracticeEngagementsViewProps {
  engagements: EngagementSummary[];
  onSelectEngagement: (engagementId: string) => void;
  onNavigate: (viewId: string) => void;
}

export const PracticeEngagementsView: React.FC<PracticeEngagementsViewProps> = ({
  engagements: fallbackEngagements,
  onSelectEngagement,
  onNavigate
}) => {
  const [universalEngagements, setUniversalEngagements] = useState<UniversalEngagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [classificationFilter, setClassificationFilter] = useState<'ALL' | 'CUSTOMER' | 'ACADEMY' | 'CANARY'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETE' | 'NEEDS_REVIEW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUniversal = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cpa/engagements/universal?classification=${classificationFilter}&status=${statusFilter}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setUniversalEngagements(data.engagements || []);
      }
    } catch (err) {
      console.warn('Failed to load universal engagements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversal();
  }, [classificationFilter, statusFilter, searchQuery]);

  const displayList = universalEngagements.length > 0
    ? universalEngagements
    : fallbackEngagements.map(e => ({
        engagementId: e.id,
        clientName: e.clientName,
        classification: 'CUSTOMER' as const,
        period: e.period,
        reportingStandard: e.framework as any,
        reportingCurrency: e.reportingCurrency,
        currentStage: 'FINAL_DELIVERABLE',
        stageProgressPercent: 100,
        assignedPartner: 'HERMES (Lead CPA)',
        assignedManager: 'ATHENA (Technical Manager)',
        documentsCount: 1,
        canonicalFactsCount: e.factsCount,
        openPbcCount: 0,
        clearedPbcCount: 2,
        openReviewNotesCount: 0,
        clearedReviewNotesCount: 1,
        reportsGeneratedCount: 1,
        numericVariance: 0.000,
        startedAt: new Date().toISOString()
      }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <EvePageHeader
        category="Universal Practice Management"
        title="Universal Audit Engagements Portfolio"
        description="Unified authoritative practice ledger spanning Commercial Client Workspaces, Academy Simulation Twins, and Regression Canaries."
      />

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setClassificationFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              classificationFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Engagements ({displayList.length})
          </button>
          <button
            type="button"
            onClick={() => setClassificationFilter('CUSTOMER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              classificationFilter === 'CUSTOMER'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Customer Workspaces</span>
          </button>
          <button
            type="button"
            onClick={() => setClassificationFilter('ACADEMY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              classificationFilter === 'ACADEMY'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academy Twins</span>
          </button>
          <button
            type="button"
            onClick={() => setClassificationFilter('CANARY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              classificationFilter === 'CANARY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Canaries</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by client, ID, or stage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 cursor-pointer focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active in Progress</option>
            <option value="COMPLETE">Completed & Certified</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
          </select>
        </div>
      </div>

      <EveCard>
        <EveCardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <EveCardTitle>Authoritative Universal Engagements</EveCardTitle>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {displayList.length} Total Record{displayList.length === 1 ? '' : 's'}
          </span>
        </EveCardHeader>
        <EveCardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Engagement & Client</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Period / Standard</th>
                  <th className="py-3 px-4">Lifecycle Stage</th>
                  <th className="py-3 px-3 text-center">PBC</th>
                  <th className="py-3 px-3 text-center">Review Notes</th>
                  <th className="py-3 px-3 text-center">Artifacts</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayList.map((eng) => {
                  const isCompleted = eng.currentStage === 'ENGAGEMENT_COMPLETE' || eng.stageProgressPercent === 100;
                  return (
                    <tr key={eng.engagementId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                            eng.classification === 'CUSTOMER'
                              ? 'bg-blue-50 border border-blue-200 text-blue-700'
                              : eng.classification === 'ACADEMY'
                              ? 'bg-amber-50 border border-amber-200 text-amber-700'
                              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          }`}>
                            {eng.classification === 'CUSTOMER' && <Building2 className="w-4 h-4" />}
                            {eng.classification === 'ACADEMY' && <GraduationCap className="w-4 h-4" />}
                            {eng.classification === 'CANARY' && <FlaskConical className="w-4 h-4" />}
                            {eng.classification === 'DEMO' && <Briefcase className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              <span>{eng.clientName}</span>
                              {eng.minervaOverallScore && (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                                  Minerva {eng.minervaOverallScore}/100
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-slate-500">
                              {eng.engagementId} • {eng.assignedPartner}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          eng.classification === 'CUSTOMER'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : eng.classification === 'ACADEMY'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {eng.classification}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-xs">
                        <div className="text-slate-800 font-medium">{eng.period}</div>
                        <div className="text-[11px] text-slate-500">{eng.reportingStandard} • {eng.reportingCurrency}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1 min-w-[130px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700">{eng.currentStage.replace(/_/g, ' ')}</span>
                            <span className="font-mono text-slate-500">{eng.stageProgressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${eng.stageProgressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-xs">
                        {eng.openPbcCount > 0 ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200">
                            {eng.openPbcCount} open
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {eng.clearedPbcCount} cleared
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-xs">
                        {eng.openReviewNotesCount > 0 ? (
                          <span className="text-pink-700 bg-pink-50 px-2 py-0.5 rounded font-bold border border-pink-200">
                            {eng.openReviewNotesCount} open
                          </span>
                        ) : (
                          <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {eng.clearedReviewNotesCount} cleared
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {eng.reportsGeneratedCount > 0 ? (
                          <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded inline-flex items-center gap-1 font-semibold">
                            <FileText className="w-3 h-3" />
                            <span>{eng.reportsGeneratedCount} Report</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectEngagement(eng.engagementId);
                              onNavigate('engagement-overview');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer transition-colors"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </EveCardContent>
      </EveCard>
    </div>
  );
};
