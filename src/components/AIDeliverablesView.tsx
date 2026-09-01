import React from 'react';
import { Sparkles, FileText, Download, CheckCircle2, Share2, Layers } from 'lucide-react';

interface AIDeliverablesViewProps {
  onOpenReportWizard?: () => void;
}

export const AIDeliverablesView: React.FC<AIDeliverablesViewProps> = ({ onOpenReportWizard }) => {
  const deliverables = [
    { title: 'Executive Summary & Audit Opinion Brief', pages: 4, date: 'Jun 7, 2024', status: 'CPA SIGNED', type: 'Executive Report' },
    { title: 'Consolidated Financial Statement Working Papers', pages: 28, date: 'Jun 7, 2024', status: 'RECONCILED', type: 'Working Papers' },
    { title: 'Accounting Identity & Identity Verification Log', pages: 12, date: 'Jun 6, 2024', status: 'PASSED', type: 'Verification Log' },
    { title: 'Board Audit Committee Presentation Deck', pages: 18, date: 'Jun 5, 2024', status: 'READY', type: 'Board Deck' }
  ];

  const handleDownload = (title: string) => {
    const blob = new Blob([`Delivered Document: ${title}\nEntity: Unilever PLC\nDate: Jun 7, 2024\nAudit Opinion: CPA Certified UNQUALIFIED`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.txt`;
    a.click();
  };

  const handleShare = (title: string) => {
    navigator.clipboard?.writeText?.(window.location.href);
    alert(`Shareable link for "${title}" copied to clipboard!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Generated Audit Deliverables Hub</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Compiled Reports
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unilever PLC FY2025 Audit Workpapers & Sign-off Briefs
          </p>
        </div>

        <button
          onClick={onOpenReportWizard}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate New Report</span>
        </button>
      </div>

      {/* Deliverables Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {deliverables.map((d, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-purple-300 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{d.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{d.type} • {d.pages} Pages • Created {d.date}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {d.status}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare(d.title)}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3 h-3" /> Share
                </button>
                <button
                  onClick={() => handleDownload(d.title)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

