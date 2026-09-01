import React from 'react';
import { Sparkles, FileText, Download } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';

interface AIDeliverablesViewProps {
  onOpenReportWizard?: () => void;
}

export const AIDeliverablesView: React.FC<AIDeliverablesViewProps> = ({ onOpenReportWizard }) => {
  const { reports, companies, selectedCompanyId } = usePractice();
  const company = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Generated Audit Deliverables Hub</h2>
          <p className="text-xs text-slate-500 mt-1">{company?.name || EMPTY_DISPLAY} • compiled via POST /api/deliverables/generate</p>
        </div>
        <button onClick={onOpenReportWizard} className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          <Sparkles className="w-3.5 h-3.5" />
          Generate New Report
        </button>
      </div>

      {reports.length === 0 ? (
        <EmptyExtractionState title="No report packages" detail="The wizard will not export without REPORT_READY facts and a real sign-off email." onUpload={onOpenReportWizard} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reports.map((d: any, i: number) => (
            <div key={d.id || i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{d.title || d.deliverableType || 'Report'}</h3>
                  <p className="text-[11px] text-slate-400">{d.signedOffBy || EMPTY_DISPLAY} • {d.createdAt || EMPTY_DISPLAY}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${String(d.title || 'report').replace(/\s+/g, '_')}.json`;
                  a.click();
                }}
                className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
