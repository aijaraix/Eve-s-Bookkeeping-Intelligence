import React, { useState } from 'react';
import { EveEngagementHeader } from '../../design-system/EveEngagementHeader';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import { FileCheck2, Download, ShieldCheck, FileText, Sparkles, Building2, Layers } from 'lucide-react';
import { ReportWizardModal } from '../../ReportWizardModal';
import { SyntheticClientPortalModal } from '../../SyntheticClientPortalModal';

export interface DeliverablesViewProps {
  clientName: string;
  engagementName: string;
  period: string;
  currency: string;
  framework: string;
  readinessState: string;
  openFindingsCount: number;
  onNavigate: (viewId: string) => void;
}

export const DeliverablesView: React.FC<DeliverablesViewProps> = ({
  clientName,
  engagementName,
  period,
  currency = 'USD',
  framework = 'US-GAAP',
  readinessState = 'READY',
  openFindingsCount = 0,
  onNavigate
}) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);

  const downloadReport = (format: 'html' | 'md' | 'json') => {
    window.open(`/api/cpa/audit-report/download?format=${format}`, '_blank');
  };

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
        <div className="flex items-center justify-between">
          <EvePageHeader
            category="Engagement Deliverables"
            title="Attestation Deliverables & Audit Reports"
            description="Formal statutory audit reports, Lead Schedules, Audit Memorandums, and certified packages."
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsClientPortalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg cursor-pointer transition flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-pink-600" />
              <span>Client Portal & Review (Clara / Quinn)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Open 8-Stage Report Factory</span>
            </button>
          </div>
        </div>

        {/* Action Showcase Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 border border-indigo-700/50 rounded-xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 font-semibold">
                PHASE H.9.21 REPORT FACTORY
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/30 text-pink-200 border border-pink-400/40 font-semibold">
                15 CPA ROLES (CLARA & QUINN)
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">Full-Spectrum Statutory Audit Deliverable Engine</h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Generate certified multi-format deliverables (PDF/Print, XLSX, CSV Working Papers, and JSON) with source-to-pixel lineage proofs, Euclid identity gate checks, and independent concurring partner review notes.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Report Wizard</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EveCard>
            <EveCardHeader>
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <EveCardTitle>Phase H.9.16 System Audit Memorandum</EveCardTitle>
              </div>
              <EveStatusBadge status="clean" label="Certified Package" size="sm" />
            </EveCardHeader>

            <EveCardContent className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Comprehensive statutory audit memorandum containing complete evidence lineage, Sentinel readiness checks, and Euclid double-entry reconciliations.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => downloadReport('html')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> HTML Report
                </button>
                <button
                  type="button"
                  onClick={() => downloadReport('md')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Markdown
                </button>
                <button
                  type="button"
                  onClick={() => downloadReport('json')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> JSON Audit Package
                </button>
              </div>
            </EveCardContent>
          </EveCard>

          <EveCard>
            <EveCardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <EveCardTitle>Statutory Lead Schedules</EveCardTitle>
              </div>
              <EveStatusBadge status="verified" label="Generated" size="sm" />
            </EveCardHeader>

            <EveCardContent className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Detailed working lead schedules mapping every trial balance item to verified SEC Form 10-K page citations and source blocks.
              </p>

              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Lead Schedules via Wizard
              </button>
            </EveCardContent>
          </EveCard>
        </div>
      </div>

      {/* 8-Stage Report Factory Modal */}
      <ReportWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />

      {/* Synthetic Client Portal & Concurring Review Suite Modal */}
      <SyntheticClientPortalModal
        isOpen={isClientPortalOpen}
        onClose={() => setIsClientPortalOpen(false)}
        onOpenReportWizard={() => setIsWizardOpen(true)}
      />
    </div>
  );
};
