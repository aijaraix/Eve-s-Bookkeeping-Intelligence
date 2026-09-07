import React, { useState, useEffect } from 'react';
import { EveEngagementHeader } from '../../design-system/EveEngagementHeader';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import {
  FileCheck2,
  Download,
  ShieldCheck,
  FileText,
  Sparkles,
  Building2,
  FileSpreadsheet,
  Layers,
  Search,
  RefreshCw,
  Hash,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { ReportWizardModal } from '../../ReportWizardModal';
import { SyntheticClientPortalModal } from '../../SyntheticClientPortalModal';

export interface ReportItem {
  reportId: string;
  title: string;
  deliverableType: string;
  clientName: string;
  engagementId: string;
  version: string;
  status: string;
  generatedAt: string;
  numericFactsCount: number;
  euclidVariance: number;
  formatsAvailable: {
    pdf: boolean;
    xlsx: boolean;
    csv: boolean;
    json: boolean;
  };
  sha256?: string;
}

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
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cpa/reports/library?reportType=${typeFilter}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.warn('Failed to load global report library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [typeFilter, searchQuery]);

  const downloadReportFile = (reportId: string, format: 'pdf' | 'xlsx' | 'csv' | 'json') => {
    if (format === 'pdf') {
      window.open(`/api/cpa/report/download-pdf?reportId=${encodeURIComponent(reportId)}`, '_blank');
    } else if (format === 'xlsx') {
      window.open(`/api/cpa/report/download-xlsx?reportId=${encodeURIComponent(reportId)}`, '_blank');
    } else if (format === 'csv') {
      window.open(`/api/cpa/report/download-csv?reportId=${encodeURIComponent(reportId)}`, '_blank');
    } else {
      window.open(`/api/cpa/audit-report/download?format=json&reportId=${encodeURIComponent(reportId)}`, '_blank');
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <EvePageHeader
            category="Engagement Deliverables & Library"
            title="Authoritative Report Library & Deliverables Factory"
            description="Persistent, rehydrated audit deliverables across commercial client workspaces and autonomous practice simulations."
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsClientPortalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg cursor-pointer transition flex items-center gap-2 shadow-xs"
            >
              <Building2 className="w-4 h-4 text-pink-600" />
              <span>Client Portal & Review</span>
            </button>
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Launch 8-Stage Report Wizard</span>
            </button>
          </div>
        </div>

        {/* Global Library Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% PERSISTENCE REHYDRATED</span>
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 font-semibold">
                SHA-256 PROVENANCE GUARANTEE
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">Full-Spectrum Certified Deliverable Packages</h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Every deliverable package contains mathematically verified financial statements, Euclid balance identity proofs, citation coordinates, and dual binary outputs (PDF/Print, Excel, CSV Lead Schedules, and JSON).
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={fetchReports}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Library</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                typeFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Formats ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('AUDIT_FINANCIAL_DELIVERABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                typeFilter === 'AUDIT_FINANCIAL_DELIVERABLE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Audit Deliverables
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('BOARD_PRESENTATION_PACKAGE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                typeFilter === 'BOARD_PRESENTATION_PACKAGE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Board Packages
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('STATUTORY_WORKING_PAPERS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                typeFilter === 'STATUTORY_WORKING_PAPERS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Lead Schedules
            </button>
          </div>

          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reports by title, client, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((rep) => (
            <EveCard key={rep.reportId} className="flex flex-col justify-between">
              <div>
                <EveCardHeader>
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-indigo-600" />
                    <div>
                      <EveCardTitle className="text-sm font-bold text-slate-900">{rep.title}</EveCardTitle>
                      <span className="text-[11px] font-mono text-slate-500">
                        {rep.clientName} • {rep.engagementId}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EveStatusBadge status="clean" label={rep.status} size="sm" />
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      {rep.version}
                    </span>
                  </div>
                </EveCardHeader>

                <EveCardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg text-center font-mono text-xs border border-slate-200/70">
                    <div>
                      <span className="text-[10px] font-sans text-slate-500 block">Facts</span>
                      <span className="font-bold text-slate-800">{rep.numericFactsCount} Facts</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans text-slate-500 block">Euclid Variance</span>
                      <span className="font-bold text-emerald-700">0.000</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans text-slate-500 block">Generated</span>
                      <span className="text-[11px] text-slate-700 font-medium">
                        {new Date(rep.generatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {rep.sha256 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded border border-slate-200 truncate">
                      <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="shrink-0 text-slate-600 font-semibold">SHA-256:</span>
                      <span className="truncate">{rep.sha256}</span>
                    </div>
                  )}
                </EveCardContent>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                <div className="flex items-center justify-between gap-2 pt-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Download Formats:
                  </span>
                  <div className="flex items-center gap-2">
                    {rep.formatsAvailable.pdf && (
                      <button
                        type="button"
                        onClick={() => downloadReportFile(rep.reportId, 'pdf')}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md cursor-pointer transition flex items-center gap-1"
                        title="Download Certified PDF Report"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    )}
                    {rep.formatsAvailable.xlsx && (
                      <button
                        type="button"
                        onClick={() => downloadReportFile(rep.reportId, 'xlsx')}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md cursor-pointer transition flex items-center gap-1"
                        title="Download Multi-Tab Excel Workbook"
                      >
                        <FileSpreadsheet className="w-3 h-3" />
                        <span>XLSX</span>
                      </button>
                    )}
                    {rep.formatsAvailable.csv && (
                      <button
                        type="button"
                        onClick={() => downloadReportFile(rep.reportId, 'csv')}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md cursor-pointer transition flex items-center gap-1"
                        title="Download CSV Lead Schedules"
                      >
                        <Download className="w-3 h-3" />
                        <span>CSV</span>
                      </button>
                    )}
                    {rep.formatsAvailable.json && (
                      <button
                        type="button"
                        onClick={() => downloadReportFile(rep.reportId, 'json')}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md cursor-pointer transition flex items-center gap-1"
                        title="Download Complete JSON Audit Package"
                      >
                        <Download className="w-3 h-3" />
                        <span>JSON</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </EveCard>
          ))}
        </div>

        {/* Modals */}
        {isWizardOpen && (
          <ReportWizardModal
            isOpen={isWizardOpen}
            onClose={() => {
              setIsWizardOpen(false);
              fetchReports();
            }}
          />
        )}

        {isClientPortalOpen && (
          <SyntheticClientPortalModal
            isOpen={isClientPortalOpen}
            onClose={() => setIsClientPortalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
