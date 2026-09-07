import React from 'react';
import { EveEngagementHeader } from '../../design-system/EveEngagementHeader';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveKpiCard } from '../../design-system/EveKpiCard';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import {
  BalanceSheetIdentityCheck,
  SourceToPixelMetadata,
  StatementLinePresentation
} from '../../../types/presentationModels';
import { formatFinancialValue } from '../../../adapters/presentationAdapters';
import {
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  LineChart,
  ShieldCheck,
  FileCheck2,
  ArrowRight,
  Sparkles,
  ExternalLink,
  AlertCircle
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
  incomeStatementLines?: StatementLinePresentation[];
  balanceSheetLines?: StatementLinePresentation[];
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
  incomeStatementLines = [],
  balanceSheetLines = [],
  onNavigate,
  onInspectFact
}) => {
  // Find canonical lines from presentation models
  const revLine = incomeStatementLines.find((l) => l.canonicalMetric === 'revenue');
  const opIncLine = incomeStatementLines.find((l) => l.canonicalMetric === 'operating_income');
  const netIncLine = incomeStatementLines.find((l) => l.canonicalMetric === 'net_income');
  const totalAssetsLine = balanceSheetLines.find((l) => l.canonicalMetric === 'total_assets');

  const getPrimaryVal = (line?: StatementLinePresentation) => {
    if (!line || !line.values) return null;
    const keys = Object.keys(line.values);
    if (keys.length === 0) return null;
    return line.values[keys[0]];
  };

  const revVal = getPrimaryVal(revLine);
  const opIncVal = getPrimaryVal(opIncLine);
  const netIncVal = getPrimaryVal(netIncLine);
  const assetsVal = getPrimaryVal(totalAssetsLine);

  const formatLineage = (line?: StatementLinePresentation): SourceToPixelMetadata | undefined => {
    if (!line) return undefined;
    return {
      factLineageId: line.factLineageId || line.id,
      canonicalMetric: line.canonicalMetric || 'financial_metric',
      period: period || 'FY 2025',
      currency: line.currency || currency,
      scale: line.scale || 'Millions',
      sourceDocName: line.sourceDocName,
      sourcePage: line.sourcePage,
      sourceRawValue: getPrimaryVal(line) ?? undefined
    };
  };

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

        {/* Financial KPI Highlights (Data-driven from authoritative facts) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <EveKpiCard
            title="Total Revenue"
            value={revVal !== null ? formatFinancialValue(revVal, currency) : '—'}
            currency={currency}
            scale="In Millions"
            status={revLine ? revLine.verificationStatus : 'unverified'}
            subtext={revLine?.sourceDocName ? `${revLine.sourceDocName}${revLine.sourcePage ? ` p.${revLine.sourcePage}` : ''}` : 'No verified source fact'}
            lineage={formatLineage(revLine)}
            onInspect={() => {
              const meta = formatLineage(revLine);
              if (meta) onInspectFact(meta);
            }}
          />

          <EveKpiCard
            title="Operating Income"
            value={opIncVal !== null ? formatFinancialValue(opIncVal, currency) : '—'}
            currency={currency}
            scale="In Millions"
            status={opIncLine ? opIncLine.verificationStatus : 'unverified'}
            subtext={opIncLine?.sourceDocName ? `${opIncLine.sourceDocName}${opIncLine.sourcePage ? ` p.${opIncLine.sourcePage}` : ''}` : 'No verified source fact'}
            lineage={formatLineage(opIncLine)}
            onInspect={() => {
              const meta = formatLineage(opIncLine);
              if (meta) onInspectFact(meta);
            }}
          />

          <EveKpiCard
            title="Net Income"
            value={netIncVal !== null ? formatFinancialValue(netIncVal, currency) : '—'}
            currency={currency}
            scale="In Millions"
            status={netIncLine ? netIncLine.verificationStatus : 'unverified'}
            subtext={netIncLine?.sourceDocName ? `${netIncLine.sourceDocName}${netIncLine.sourcePage ? ` p.${netIncLine.sourcePage}` : ''}` : 'No verified source fact'}
            lineage={formatLineage(netIncLine)}
            onInspect={() => {
              const meta = formatLineage(netIncLine);
              if (meta) onInspectFact(meta);
            }}
          />

          <EveKpiCard
            title="Total Assets"
            value={assetsVal !== null ? formatFinancialValue(assetsVal, currency) : '—'}
            currency={currency}
            scale="In Millions"
            status={totalAssetsLine ? totalAssetsLine.verificationStatus : 'unverified'}
            subtext={totalAssetsLine?.sourceDocName ? `${totalAssetsLine.sourceDocName}${totalAssetsLine.sourcePage ? ` p.${totalAssetsLine.sourcePage}` : ''}` : 'No verified source fact'}
            lineage={formatLineage(totalAssetsLine)}
            onInspect={() => {
              const meta = formatLineage(totalAssetsLine);
              if (meta) onInspectFact(meta);
            }}
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
              status={identityCheck?.gateState === 'PASS' ? 'clean' : identityCheck?.gateState === 'NOT_TESTABLE' ? 'pending' : 'review_required'}
              label={
                identityCheck?.gateState === 'PASS'
                  ? 'Identity Passed (Zero Variance)'
                  : identityCheck?.gateState === 'NOT_TESTABLE'
                  ? 'Pending Extraction'
                  : 'Variance Detected'
              }
            />
          </EveCardHeader>
          <EveCardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center text-center font-mono">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-sans text-slate-500 block mb-1">Total Assets (A)</span>
                <span className="text-xl font-bold text-slate-900">
                  {identityCheck?.totalAssets !== null && identityCheck?.totalAssets !== undefined
                    ? formatFinancialValue(identityCheck.totalAssets, currency)
                    : '—'}
                </span>
              </div>

              <div className="text-xl font-bold text-slate-400 font-sans hidden md:block">=</div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-sans text-slate-500 block mb-1">Liabilities + Equity (L + E)</span>
                <span className="text-xl font-bold text-slate-900">
                  {identityCheck?.totalLiabilities !== null && identityCheck?.totalEquity !== null && identityCheck?.totalLiabilities !== undefined && identityCheck?.totalEquity !== undefined
                    ? formatFinancialValue(identityCheck.totalLiabilities + identityCheck.totalEquity, currency)
                    : '—'}
                </span>
                <span className="text-[10px] text-slate-400 block font-sans mt-0.5">
                  {identityCheck?.totalLiabilities !== null && identityCheck?.totalEquity !== null && identityCheck?.totalLiabilities !== undefined && identityCheck?.totalEquity !== undefined
                    ? `${formatFinancialValue(identityCheck.totalLiabilities, currency)} (L) + ${formatFinancialValue(identityCheck.totalEquity, currency)} (E)`
                    : 'Awaiting Operands'}
                </span>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  identityCheck?.gateState === 'PASS'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : identityCheck?.gateState === 'NOT_TESTABLE'
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <span className="text-xs font-sans block mb-1 font-semibold">Variance</span>
                <span className="text-xl font-bold">
                  {identityCheck?.gateState === 'NOT_TESTABLE'
                    ? '—'
                    : `$${Math.abs(identityCheck?.variance || 0).toFixed(2)}`}
                </span>
                <span
                  className={`text-[10px] block font-sans mt-0.5 font-medium ${
                    identityCheck?.gateState === 'PASS'
                      ? 'text-emerald-600'
                      : identityCheck?.gateState === 'NOT_TESTABLE'
                      ? 'text-slate-500'
                      : 'text-rose-600'
                  }`}
                >
                  {identityCheck?.gateState === 'PASS'
                    ? 'Identity Reconciled'
                    : identityCheck?.gateState === 'NOT_TESTABLE'
                    ? 'Missing Line Items'
                    : 'Review Required'}
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
