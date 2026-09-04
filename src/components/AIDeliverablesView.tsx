import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  FileCheck,
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';
import { ExecutiveReportPrintModal } from './ExecutiveReportPrintModal';

interface AIDeliverablesViewProps {
  onOpenReportWizard?: () => void;
}

export const AIDeliverablesView: React.FC<AIDeliverablesViewProps> = ({ onOpenReportWizard }) => {
  const { reports, companies, selectedCompanyId, facts, firmBranding, activeCurrency } = usePractice();
  const company = companies.find((c) => c.id === selectedCompanyId);
  const [selectedReportForPrint, setSelectedReportForPrint] = useState<any>(null);

  const handleExportCsv = (mode: 'lead-schedules' | 'working-papers') => {
    const filename = mode === 'lead-schedules'
      ? `Lead_Schedules_${company?.name || 'Audit'}.csv`
      : `Working_Papers_Binder_${company?.name || 'Audit'}.csv`;

    const headers = [
      'Fact ID',
      'Metric Name',
      'Classification',
      'Original Value',
      'Currency',
      'Functional Value',
      'Functional Currency',
      'Source Document',
      'Page',
      'Source Quote',
      'Verification Status'
    ];

    const rows = (facts || []).map((f) => [
      `"${f.id || ''}"`,
      `"${f.canonicalMetric || f.labelNormalized || f.labelOriginal || ''}"`,
      `"${f.statementType || 'GENERAL'}"`,
      `"${f.valueOriginal || ''}"`,
      `"${f.currencyOriginal || activeCurrency}"`,
      `"${f.valueFunctional || f.valueOriginal || ''}"`,
      `"${activeCurrency}"`,
      `"${(f as any).documentTitle || f.documentId || ''}"`,
      `"${f.pageNumber || '1'}"`,
      `"${(f.sourceText || '').replace(/"/g, '""')}"`,
      `"${f.verificationStatus || 'VERIFIED'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Header bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Audit Deliverables Hub & Working Papers Binder
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
              AICPA / US GAAS Standard
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {company?.name || EMPTY_DISPLAY} • Firm: <strong>{firmBranding?.firmName || 'Stein & Associates Audit LLP'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExportCsv('lead-schedules')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Lead Schedules (CSV)</span>
          </button>

          <button
            onClick={onOpenReportWizard}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch CPA Report Wizard</span>
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <EmptyExtractionState
          title="No generated deliverable packages"
          detail="Launch the CPA Report Wizard to compile formal Audit Memorandums, Working Papers, and Balance Sheet Lead Schedules from verified facts."
          onUpload={onOpenReportWizard}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reports.map((d: any, i: number) => {
            const branding = d.firmBranding || firmBranding;
            return (
              <div
                key={d.id || i}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-blue-400 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900">
                          {d.title || d.deliverableType || 'Independent Audit Report'}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {d.status || 'Certified'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {branding?.firmName || 'Stein & Associates Audit LLP'} • Signed by {d.signedOffBy || branding?.partnerName || EMPTY_DISPLAY}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Audience: <strong>{d.audience || 'Audit Committee'}</strong></span>
                    <span>Framework: <strong>IFRS / US GAAS</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                    <Calendar className="w-3 h-3" />
                    <span>Compiled: {new Date(d.createdAt || Date.now()).toLocaleString()}</span>
                  </div>
                </div>

                {/* Multi-Format Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedReportForPrint(d)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Letterhead PDF</span>
                  </button>

                  <button
                    onClick={() => handleExportCsv('lead-schedules')}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Lead Schedules</span>
                  </button>

                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${String(d.title || 'audit_report').replace(/\s+/g, '_')}.json`;
                      a.click();
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Letterhead Modal */}
      {selectedReportForPrint && (
        <ExecutiveReportPrintModal
          isOpen={!!selectedReportForPrint}
          onClose={() => setSelectedReportForPrint(null)}
          report={selectedReportForPrint}
          companyName={company?.name || 'Reporting Entity'}
          firmBranding={selectedReportForPrint?.firmBranding || firmBranding}
          facts={facts}
          currency={activeCurrency}
        />
      )}
    </div>
  );
};
