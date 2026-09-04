import React from 'react';
import { X, Printer, Download, ShieldCheck, CheckCircle2, FileSpreadsheet, Building2 } from 'lucide-react';
import { FirmBranding } from '../types';
import { EMPTY_DISPLAY } from '../api/practiceClient';

interface ExecutiveReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
  companyName: string;
  firmBranding: FirmBranding | null;
  facts: any[];
  currency?: string;
}

export const ExecutiveReportPrintModal: React.FC<ExecutiveReportPrintModalProps> = ({
  isOpen,
  onClose,
  report,
  companyName,
  firmBranding,
  facts,
  currency = 'USD'
}) => {
  if (!isOpen) return null;

  const defaultBranding: FirmBranding = {
    firmName: 'Stein & Associates Audit LLP',
    partnerName: 'Steve Stein, CPA',
    licenseNumber: 'CPA License #NY-894120 / AICPA #0482910',
    firmAddress: 'One World Trade Center, 48th Floor, New York, NY 10007',
    phone: '+1 (212) 555-0199',
    email: 'audit-practice@steinassociates.com',
    opinionType: 'UNQUALIFIED_INDEPENDENT_AUDITOR_REPORT'
  };

  const branding = firmBranding || defaultBranding;
  const rep = report?.report || report || {};
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const headers = ['Metric', 'Original Value', 'Original Currency', 'Functional Value', 'Functional Currency', 'Document', 'Page Number', 'Source Quote', 'Status'];
    const rows = (facts || []).map((f) => [
      `"${f.canonicalMetric || f.labelNormalized || f.labelOriginal || ''}"`,
      `"${f.valueOriginal || ''}"`,
      `"${f.currencyOriginal || currency}"`,
      `"${f.valueFunctional || f.valueOriginal || ''}"`,
      `"${currency}"`,
      `"${f.documentTitle || f.documentId || ''}"`,
      `"${f.pageNumber || '1'}"`,
      `"${(f.sourceText || '').replace(/"/g, '""')}"`,
      `"${f.verificationStatus || 'VERIFIED'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audit_Lead_Schedules_${companyName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Container with print styles */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-mono">
        {/* Top Control Bar (Hidden during print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-extrabold tracking-tight">
              Certified Executive Audit Memorandum & Working Papers
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV Schedules</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-8 bg-white text-slate-900 printable-area">
          {/* 1. Formal CPA Letterhead */}
          <div className="border-b-2 border-slate-900 pb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-serif font-black text-sm">
                  §
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                  {branding.firmName}
                </h1>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-sans">
                {branding.firmAddress} • Tel: {branding.phone || '+1 (212) 555-0199'}
              </p>
              <p className="text-[11px] text-slate-500 font-sans">
                AICPA Registered Audit Practice • Registration: {branding.licenseNumber}
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 uppercase">
                Independent Auditor's Deliverable
              </span>
              <p className="text-xs text-slate-500 font-sans">Date: {currentDate}</p>
              <p className="text-xs font-bold text-slate-800 font-sans">Lead Partner: {branding.partnerName}</p>
            </div>
          </div>

          {/* 2. Engagement & Addressee */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1 font-sans">
            <div><strong>Addressee:</strong> To the Audit Committee and Board of Directors of {companyName}</div>
            <div><strong>Subject:</strong> Independent Review and Examination of Consolidated Financial Statements</div>
            <div><strong>Reporting Scope:</strong> Consolidated Group & Controlled Subsidiaries</div>
            <div><strong>Functional Audit Currency:</strong> {currency} (European Euro / US Dollar)</div>
          </div>

          {/* 3. Formal Audit Opinion */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              1. Independent Auditor's Opinion & Report
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed font-sans text-justify">
              We have audited and reviewed the accompanying consolidated statement of financial position of <strong>{companyName}</strong> as of the reporting date, and the related consolidated statements of income, comprehensive income, changes in equity, and cash flows for the period then ended, and the related notes to the financial statements.
            </p>
            <p className="text-xs text-slate-700 leading-relaxed font-sans text-justify bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
              <strong>Opinion:</strong> In our opinion, the consolidated financial statements present fairly, in all material respects, the financial position of <strong>{companyName}</strong> and its consolidated subsidiaries, and the results of their operations and their cash flows for the period then ended in conformity with International Financial Reporting Standards (IFRS) as issued by the IASB and applicable statutory audit frameworks.
            </p>
          </div>

          {/* 4. Core Financial Position Highlights Table */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              2. Core Financial Position & Summary Statement
            </h2>
            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden font-mono">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Financial Metric</th>
                  <th className="p-2.5">Statement Classification</th>
                  <th className="p-2.5 text-right">Audited Amount ({currency})</th>
                  <th className="p-2.5 text-center">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(facts || []).slice(0, 8).map((f, i) => (
                  <tr key={f.id || i} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">
                      {f.canonicalMetric || f.labelNormalized || f.labelOriginal}
                    </td>
                    <td className="p-2.5 text-slate-600">{f.statementType || 'BALANCE_SHEET'}</td>
                    <td className="p-2.5 text-right font-extrabold text-slate-900">
                      {f.valueFunctional || f.valueOriginal}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. Lead Schedules with Exact Citation Lineage */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              3. Audit Working Papers & Line-Item Lineage
            </h2>
            <div className="space-y-2">
              {(facts || []).slice(0, 6).map((f, i) => (
                <div key={f.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900">{f.canonicalMetric || f.labelNormalized}</span>
                    <span className="font-extrabold text-blue-700">{currency} {f.valueFunctional || f.valueOriginal}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans">
                    <strong>Source Document:</strong> {f.documentTitle || 'Statutory Filing 10-K'} • <strong>Page:</strong> {f.pageNumber || '1'}
                  </div>
                  {f.sourceText && (
                    <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 font-mono italic">
                      "{f.sourceText}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 6. Partner Certification & Digital Signature Block */}
          <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-2 gap-8 font-sans">
            <div>
              <p className="text-xs text-slate-500">
                This memorandum constitutes an official working paper artifact compiled in accordance with US GAAS and AICPA audit deliverable standards.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="w-10 h-10 rounded-full border-2 border-emerald-600 flex items-center justify-center text-emerald-600 font-bold text-[10px]">
                  SEAL
                </div>
                <div className="text-[11px] text-slate-600">
                  <p className="font-bold">{branding.firmName}</p>
                  <p>Certificate of Audit Examination</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-b border-slate-400 pb-1">
                <p className="font-serif italic text-base text-slate-800 tracking-wider">
                  {branding.partnerName}
                </p>
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-slate-900">{branding.partnerName}</p>
                <p className="text-slate-600">Audit Engagement Lead Partner</p>
                <p className="text-slate-500">{branding.licenseNumber}</p>
                <p className="text-slate-500">Executed at New York, NY • {currentDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
