import React from 'react';
import { EveEngagementHeader } from '../../design-system/EveEngagementHeader';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveKpiCard } from '../../design-system/EveKpiCard';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import {
  BalanceSheetIdentityCheck,
  SourceToPixelMetadata
} from '../../../types/presentationModels';
import {
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  LineChart,
  ShieldCheck,
  FileCheck2,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export interface EngagementOverviewViewProps {
  clientName: string;
  engagementName: string;
  period: string;
  currency: string;
  framework: string;
  readinessState: string;
  openFindingsCount: number;
  factsCount: number;
  documentsCount: number;
  identityCheck: BalanceSheetIdentityCheck;
  onNavigate: (viewId: string) => void;
  onInspectFact: (metadata: SourceToPixelMetadata) => void;
}

export const EngagementOverviewView: React.FC<EngagementOverviewViewProps> = ({
  clientName,
  engagementName,
  period,
  currency = 'USD',
  framework = 'US-GAAP',
  readinessState = 'READY',
  openFindingsCount = 0,
  factsCount,
  documentsCount,
  identityCheck,
  onNavigate,
  onInspectFact
}) => {
  return (
    <div className="space-y-0">
      {/* Persistent Engagement Context Header */}
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
        {/* Page Title */}
        <EvePageHeader
          category="Engagement Attestation"
          title="Engagement Overview & Attestation Workspace"
          description="Consolidated audit workspace for statutory financial statements, automated cross-statement reconciliations, and workpapers."
          actions={
            <button
              type="button"
              onClick={() => onNavigate('engagement-deliverables')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Generate Audit Deliverable</span>
            </button>
          }
        />

        {/* Financial KPI Highlights (Tremor Inspired with Lineage Attributes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <EveKpiCard
            title="Total Revenue"
            value="$245,123M"
            currency="USD"
            scale="In Millions"
            delta={{ value: '+15.7%', direction: 'up', label: 'YoY' }}
            status="verified"
            subtext="SEC 10-K p.64"
            lineage={{
              factLineageId: 'fl-msft-rev-01',
              canonicalMetric: 'revenue',
              period: 'FY2024',
              currency: 'USD',
              scale: 'Millions',
              sourceDocName: 'msft-20260630.htm',
              sourcePage: 64,
              sourceRawValue: 245123000000
            }}
            onInspect={() =>
              onInspectFact({
                factLineageId: 'fl-msft-rev-01',
                canonicalMetric: 'revenue',
                period: 'FY2024',
                currency: 'USD',
                scale: 'Millions',
                sourceDocName: 'msft-20260630.htm',
                sourcePage: 64,
                sourceRawValue: 245123000000
              })
            }
          />

          <EveKpiCard
            title="Operating Income"
            value="$109,433M"
            currency="USD"
            scale="In Millions"
            delta={{ value: '+23.9%', direction: 'up', label: 'YoY' }}
            status="verified"
            subtext="SEC 10-K p.64"
            lineage={{
              factLineageId: 'fl-msft-opinc-01',
              canonicalMetric: 'operating_income',
              period: 'FY2024',
              currency: 'USD',
              scale: 'Millions',
              sourceDocName: 'msft-20260630.htm',
              sourcePage: 64,
              sourceRawValue: 109433000000
            }}
            onInspect={() =>
              onInspectFact({
                factLineageId: 'fl-msft-opinc-01',
                canonicalMetric: 'operating_income',
                period: 'FY2024',
                currency: 'USD',
                scale: 'Millions',
                sourceDocName: 'msft-20260630.htm',
                sourcePage: 64,
                sourceRawValue: 109433000000
              })
            }
          />

          <EveKpiCard
            title="Net Income"
            value="$88,308M"
            currency="USD"
            scale="In Millions"
            delta={{ value: '+21.8%', direction: 'up', label: 'YoY' }}
            status="verified"
            subtext="SEC 10-K p.64"
            lineage={{
              factLineageId: 'fl-msft-netinc-01',
              canonicalMetric: 'net_income',
              period: 'FY2024',
              currency: 'USD',
              scale: 'Millions',
              sourceDocName: 'msft-20260630.htm',
              sourcePage: 64,
              sourceRawValue: 88308000000
            }}
            onInspect={() =>
              onInspectFact({
                factLineageId: 'fl-msft-netinc-01',
                canonicalMetric: 'net_income',
                period: 'FY2024',
                currency: 'USD',
                scale: 'Millions',
                sourceDocName: 'msft-20260630.htm',
                sourcePage: 64,
                sourceRawValue: 88308000000
              })
            }
          />

          <EveKpiCard
            title="Total Assets"
            value="$512,163M"
            currency="USD"
            scale="In Millions"
            delta={{ value: '+24.3%', direction: 'up', label: 'YoY' }}
            status="verified"
            subtext="SEC 10-K p.65"
            lineage={{
              factLineageId: 'fl-msft-assets-01',
              canonicalMetric: 'total_assets',
              period: 'FY2024',
              currency: 'USD',
              scale: 'Millions',
              sourceDocName: 'msft-20260630.htm',
              sourcePage: 65,
              sourceRawValue: 512163000000
            }}
            onInspect={() =>
              onInspectFact({
                factLineageId: 'fl-msft-assets-01',
                canonicalMetric: 'total_assets',
                period: 'FY2024',
                currency: 'USD',
                scale: 'Millions',
                sourceDocName: 'msft-20260630.htm',
                sourcePage: 65,
                sourceRawValue: 512163000000
              })
            }
          />
        </div>

        {/* Mathematical Accounting Identity Block */}
        <EveCard className="border-indigo-100 bg-linear-to-r from-white via-indigo-50/20 to-white">
          <EveCardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <EveCardTitle>Euclid Balance Sheet Accounting Identity Verification</EveCardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Universal double-entry accounting rule: Total Assets = Total Liabilities + Stockholders Equity
                </p>
              </div>
            </div>
            <EveStatusBadge
              status={identityCheck.gateState === 'PASS' ? 'clean' : 'review_required'}
              label={identityCheck.gateState === 'PASS' ? 'Identity Passed (Zero Variance)' : 'Variance Detected'}
            />
          </EveCardHeader>
          <EveCardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center text-center font-mono">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-sans text-slate-500 block mb-1">Total Assets (A)</span>
                <span className="text-xl font-bold text-slate-900">$512,163M</span>
              </div>

              <div className="text-xl font-bold text-slate-400 font-sans hidden md:block">=</div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-sans text-slate-500 block mb-1">Liabilities + Equity (L + E)</span>
                <span className="text-xl font-bold text-slate-900">$512,163M</span>
                <span className="text-[10px] text-slate-400 block font-sans mt-0.5">
                  $243,686M (L) + $268,477M (E)
                </span>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800">
                <span className="text-xs font-sans block mb-1 font-semibold">Variance</span>
                <span className="text-xl font-bold">$0.00</span>
                <span className="text-[10px] block font-sans mt-0.5 text-emerald-600 font-medium">
                  Identity Reconciled
                </span>
              </div>
            </div>
          </EveCardContent>
        </EveCard>

        {/* Engagement Nav Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EveCard className="hover:border-indigo-300 transition-colors">
            <EveCardContent className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Financial Statements</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Review verified multi-period Income Statement, Balance Sheet, Cash Flow, and Statement of Equity with line-level citations.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('financials-income')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer pt-2"
              >
                Inspect Statements <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </EveCardContent>
          </EveCard>

          <EveCard className="hover:border-indigo-300 transition-colors">
            <EveCardContent className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <LineChart className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Financial Analytics & Ratios</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Explore liquidity, profitability, and solvency ratios with explicit mathematical formula breakdowns and evidence links.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('analysis-ratios')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer pt-2"
              >
                Analyze Ratios <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </EveCardContent>
          </EveCard>

          <EveCard className="hover:border-indigo-300 transition-colors">
            <EveCardContent className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Attestation Deliverables</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Generate signed audit opinions, lead schedules, and executive attestation packages for audit committee sign-off.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('engagement-deliverables')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer pt-2"
              >
                Deliverables Hub <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </EveCardContent>
          </EveCard>
        </div>
      </div>
    </div>
  );
};
