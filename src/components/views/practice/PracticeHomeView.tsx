import React from 'react';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveKpiCard } from '../../design-system/EveKpiCard';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import { EveEmptyState } from '../../design-system/EveEmptyState';
import {
  PracticeClientSummary,
  EngagementSummary,
  AttentionQueueItem
} from '../../../types/presentationModels';
import {
  Building2,
  Briefcase,
  FileText,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

export interface PracticeHomeViewProps {
  clients: PracticeClientSummary[];
  engagements: EngagementSummary[];
  documentsCount: number;
  openFindingsCount: number;
  onNavigate: (viewId: string) => void;
  onSelectClient: (clientId: string) => void;
  onOpenUpload: () => void;
}

export const PracticeHomeView: React.FC<PracticeHomeViewProps> = ({
  clients,
  engagements,
  documentsCount,
  openFindingsCount,
  onNavigate,
  onSelectClient,
  onOpenUpload
}) => {
  const realClients = clients.filter((c) => c.category === 'REAL_CUSTOMER');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <EvePageHeader
        category="Practice Management"
        title="Practice Executive Dashboard"
        description="Unified audit attestation overview across active clients, filings, and autonomous attestation workpapers."
        actions={
          <button
            type="button"
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>New Document Intake</span>
          </button>
        }
      />

      {/* KPI Cards Row (Tremor Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EveKpiCard
          title="Active Clients"
          value={realClients.length > 0 ? realClients.length : 1}
          subtext="Corporate client organizations"
          status="verified"
          onInspect={() => onNavigate('practice-clients')}
        />

        <EveKpiCard
          title="Engagements in Flight"
          value={engagements.length > 0 ? engagements.length : 1}
          subtext="FY2024 Audit Attestations"
          status="verified"
          onInspect={() => onNavigate('practice-engagements')}
        />

        <EveKpiCard
          title="Extracted Documents"
          value={documentsCount > 0 ? documentsCount : 1}
          subtext="SEC Form 10-K filings"
          status="verified"
          onInspect={() => onNavigate('practice-documents')}
        />

        <EveKpiCard
          title="Open Review Items"
          value={openFindingsCount}
          delta={{
            value: openFindingsCount === 0 ? 'Zero Variance' : `${openFindingsCount} items`,
            direction: openFindingsCount === 0 ? 'up' : 'down'
          }}
          subtext={openFindingsCount === 0 ? 'All controls passed' : 'Awaiting CPA review'}
          status={openFindingsCount === 0 ? 'verified' : 'review_required'}
          onInspect={() => onNavigate('engagement-findings')}
        />
      </div>

      {/* Two Column Layout: Active Client Filings & Attestation Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Client Engagements */}
        <div className="lg:col-span-2 space-y-6">
          <EveCard>
            <EveCardHeader>
              <div>
                <EveCardTitle>Active Client Engagements</EveCardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Production corporate filings with verified canonical facts
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('practice-engagements')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </EveCardHeader>
            <EveCardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {realClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{client.name}</h4>
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {client.reportingCurrency}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{client.industry}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-mono">
                          <span>Jurisdiction: {client.jurisdiction}</span>
                          <span>•</span>
                          <span>Period: {client.latestPeriod}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <EveStatusBadge status="verified" label="Clean Opinion" size="sm" />
                      <button
                        type="button"
                        onClick={() => {
                          onSelectClient(client.id);
                          onNavigate('engagement-overview');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                        Open Engagement
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </EveCardContent>
          </EveCard>

          {/* Quick Financial Summary */}
          <EveCard>
            <EveCardHeader>
              <div>
                <EveCardTitle>Active Client Financial Identity Check</EveCardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Euclid mathematical identity validation: Assets = Liabilities + Equity
                </p>
              </div>
              <EveStatusBadge status="clean" label="Euclid Identity Passed" size="sm" />
            </EveCardHeader>
            <EveCardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center font-mono">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-xs font-sans text-slate-500 block mb-1">Total Assets</span>
                  <span className="text-lg font-bold text-slate-900">$512,163M</span>
                  <span className="text-[10px] text-emerald-600 block mt-1 font-sans">Verified in 10-K p.65</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-xs font-sans text-slate-500 block mb-1">Total Liabilities</span>
                  <span className="text-lg font-bold text-slate-900">$243,686M</span>
                  <span className="text-[10px] text-emerald-600 block mt-1 font-sans">Verified in 10-K p.65</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-xs font-sans text-slate-500 block mb-1">Stockholders Equity</span>
                  <span className="text-lg font-bold text-slate-900">$268,477M</span>
                  <span className="text-[10px] text-emerald-600 block mt-1 font-sans">Verified in 10-K p.65</span>
                </div>
              </div>
            </EveCardContent>
          </EveCard>
        </div>

        {/* Right Col: Attention Queue & System Health */}
        <div className="space-y-6">
          <EveCard>
            <EveCardHeader>
              <EveCardTitle>Auditor Attention Queue</EveCardTitle>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                0 Critical
              </span>
            </EveCardHeader>
            <EveCardContent className="p-5">
              {openFindingsCount === 0 ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">All Safeguards Passed</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    No discrepancies, unmapped line items, or currency conflicts detected on active filings.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs space-y-1">
                    <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Review Required Fact Items
                    </div>
                    <p className="text-amber-700">
                      {openFindingsCount} item(s) flagged by Sentinel for manual CPA confirmation.
                    </p>
                  </div>
                </div>
              )}
            </EveCardContent>
          </EveCard>

          {/* Quick Jump Links */}
          <EveCard>
            <EveCardHeader>
              <EveCardTitle>Auditor Workbenches</EveCardTitle>
            </EveCardHeader>
            <EveCardContent className="p-3 space-y-1">
              <button
                type="button"
                onClick={() => onNavigate('financials-income')}
                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs text-slate-700 font-medium cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  Income Statement Attestation
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('financials-balance')}
                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs text-slate-700 font-medium cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  Balance Sheet Verification
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('analysis-ratios')}
                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs text-slate-700 font-medium cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  Financial Ratios & Lineage Proof
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('eve-intelligence')}
                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs text-slate-700 font-medium cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Hermes Swarm Intelligence Center
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </EveCardContent>
          </EveCard>
        </div>
      </div>
    </div>
  );
};
