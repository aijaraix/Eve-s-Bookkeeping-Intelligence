import { actionAttributes } from '../../../academy/uiActionRegistry';
import React from 'react';
import { usePractice } from '../../../context/PracticeContext';
import { adaptFactsToBalanceSheet, formatFinancialValue } from '../../../adapters/presentationAdapters';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveKpiCard } from '../../design-system/EveKpiCard';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import {
  PracticeClientSummary,
  EngagementSummary,
  SourceToPixelMetadata
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
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Search,
  Lock
} from 'lucide-react';

export interface AttentionItem {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: string;
  source: string;
  reason: string;
  evidence: string;
  suggestedAction: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
}

export interface PracticeHomeViewProps {
  clients: PracticeClientSummary[];
  engagements: EngagementSummary[];
  documentsCount: number;
  openFindingsCount: number;
  onNavigate: (viewId: string) => void;
  onSelectClient: (clientId: string) => void;
  onOpenUpload: () => void;
  onInspectFact?: (meta: SourceToPixelMetadata) => void;
}

export const PracticeHomeView: React.FC<PracticeHomeViewProps> = ({
  clients,
  engagements,
  documentsCount,
  openFindingsCount,
  onNavigate,
  onSelectClient,
  onOpenUpload,
  onInspectFact
}) => {
  const realClients = clients.filter((c) => c.category === 'REAL_CUSTOMER');
  const { engagementDetail, facts, reports, selectedPeriod, selectedCompany, dataState } = usePractice();
  const attentionItems: AttentionItem[] = (engagementDetail?.continuation?.reviewFindings || []).map((item: any) => ({
    severity: item.severity || 'INFO', source: item.topic || item.source || 'Recorded review finding',
    reason: item.description || item.message || (typeof item === 'string' ? item : JSON.stringify(item)),
    suggestedAction: item.suggestedAction || 'Review source evidence', status: 'OPEN'
  }));
  const eligible = facts.filter((f: any) => String(f.status).toUpperCase() === 'APPROVED' && String(f.verificationStatus || f.verification_status).toUpperCase() === 'VERIFIED' && String(f.evidenceStatus || f.evidence_status).toUpperCase() === 'CONFIRMED');
  const { lines, identityCheck } = adaptFactsToBalanceSheet(eligible, selectedPeriod, selectedCompany.currency || '');
  const inspectLine = (line: any) => {
    if (!line?.factLineageId || !onInspectFact) return;
    onInspectFact({ factLineageId: line.factLineageId, canonicalMetric: line.canonicalMetric, period: selectedPeriod,
      currency: line.currency, scale: line.scale, provenanceStatus: 'review_required', sourceDocName: line.sourceDocName,
      sourcePage: line.sourcePage, sourceRawValue: line.values[selectedPeriod] });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <EvePageHeader
        category="Universal Practice Management"
        title="Practice Executive Dashboard"
        description="Saved client filings and AI-prepared review work; professional approval remains separate."
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('engagement-deliverables')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Report Library ({reports.length})</span>
            </button>
            <button
              type="button"
              {...actionAttributes('intake.open.home')} onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>New Document Intake</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards Row (Tremor Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EveKpiCard
          title="Active Clients"
          value={realClients.length}
          subtext="Corporate client organizations"
          status="unverified"
          onInspect={() => onNavigate('practice-clients')}
        />

        <EveKpiCard
          title="Universal Engagements"
          value={engagements.length}
          subtext="Customer + Academy Twins"
          status="unverified"
          onInspect={() => onNavigate('practice-engagements')}
        />

        <EveKpiCard
          title="Extracted Documents"
          value={documentsCount}
          subtext="Selected workspace source documents"
          status="unverified"
          onInspect={() => onNavigate('practice-documents')}
        />

        <EveKpiCard
          title="Selected Draft Packages"
          value={reports.length}
          subtext="Saved report references; review required"
          status="unverified"
          onInspect={() => onNavigate('engagement-deliverables')}
        />
      </div>

      {/* Academy Twin Autonomous Execution Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 rounded-xl p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-semibold font-mono">
                ACADEMY OBSERVATIONS
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                EVALUATION NOT MEASURED
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white mt-1">
              Learning evidence requires a recorded evaluation
            </h4>
            <p className="text-xs text-slate-300">
              No Academy activation is authorized in this workflow. Historical cases do not certify customer work.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('eve-academy')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Open Observatory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
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
                      <EveStatusBadge status="review_required" label="Professional Review Required" size="sm" />
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

          {/* Quick Financial Summary with Click-to-Source Evidence Tracing */}
          <EveCard>
            <EveCardHeader>
              <div>
                <EveCardTitle>Active Client Financial Identity Check</EveCardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Euclid mathematical identity validation: Assets = Liabilities + Equity (Click any metric for full citation trail)
                </p>
              </div>
              <EveStatusBadge status="review_required" label={identityCheck.gateState} size="sm" />
            </EveCardHeader>
            <EveCardContent className="p-5">
              <p className="text-xs text-slate-500 mb-3">{selectedCompany.name} · {selectedPeriod || 'Period not recorded'} · source units</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center font-mono">
                {['total_assets', 'total_liabilities', 'total_equity'].map(metric => {
                  const line = lines.find(l => l.canonicalMetric === metric);
                  return <button type="button" key={metric} disabled={!line?.factLineageId} onClick={() => inspectLine(line)} className="p-4 bg-slate-50 rounded-xl border border-slate-200 disabled:cursor-default">
                    <span className="text-xs block mb-1">{metric.replaceAll('_', ' ')}</span>
                    <span className="text-lg font-bold">{line ? formatFinancialValue(line.values[selectedPeriod], line.currency) : 'Not available'}</span>
                    <span className="text-[10px] block mt-1">{line?.sourceDocName || 'Source linkage not recorded'}</span>
                  </button>;
                })}
              </div>
            </EveCardContent>
          </EveCard>
        </div>

        {/* Right Col: Attention Queue & System Health */}
        <div className="space-y-6">
          <EveCard>
            <EveCardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-600" />
                <EveCardTitle>Operator Attention Center</EveCardTitle>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                attentionItems.length === 0
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}>
                {attentionItems.length} Notice{attentionItems.length === 1 ? '' : 's'}
              </span>
            </EveCardHeader>
            <EveCardContent className="p-5">
              {attentionItems.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">No review findings displayed</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    This is not evidence of a clean opinion. Check the selected workspace processing evidence and current connection state.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attentionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg text-xs space-y-1 border ${
                        item.severity === 'CRITICAL'
                          ? 'bg-rose-50/70 border-rose-200 text-rose-800'
                          : item.severity === 'WARNING'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-800'
                          : 'bg-indigo-50/70 border-indigo-200 text-indigo-800'
                      }`}
                    >
                      <div className="font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {item.source}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/70 border">
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{item.reason}</p>
                      <p className="text-[10px] font-mono text-slate-500 pt-0.5">
                        Action: {item.suggestedAction}
                      </p>
                    </div>
                  ))}
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
                onClick={() => onNavigate('engagement-deliverables')}
                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs text-slate-700 font-medium cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Report Library & Deliverables
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
