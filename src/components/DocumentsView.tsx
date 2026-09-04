import React, { useState } from 'react';
import { FolderArchive, UploadCloud, FileText, CheckCircle2, Clock } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';

const initialDocs = [
  {
    name: 'Unilever_Annual_Report_2024.pdf',
    size: '14.8 MB',
    pages: 248,
    status: 'Ingested & Verified',
    extractedStatements: ['Income Statement', 'Balance Sheet', 'Cash Flow', 'Statement of Equity', 'Notes 1-32'],
    uploadDate: '2026-09-04 10:15',
  },
  {
    name: 'Meridian_10K_FY2024.pdf',
    size: '8.2 MB',
    pages: 112,
    status: 'Ingested & Verified',
    extractedStatements: ['P&L', 'Balance Sheet', 'Cash Flow', 'Footnotes'],
    uploadDate: '2026-09-03 16:20',
  },
  {
    name: 'Apotheke_Nordic_Interim_Q3.pdf',
    size: '3.4 MB',
    pages: 44,
    status: 'Ingested & Verified',
    extractedStatements: ['Segment Breakdown', 'Condensed P&L'],
    uploadDate: '2026-09-02 09:12',
  },
];

export const DocumentsView: React.FC = () => {
  const { setIsUploadOpen } = usePractice();
  const [docs] = useState(initialDocs);

  return (
    <div id="documents-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Source Document Ingestion Repository</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Raw audited PDFs, 10-K filings, and statutory reports ingested into the high-precision OCR extraction worker pipeline.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload PDF / Spreadsheet</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {docs.map((doc, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">{doc.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {doc.size} • {doc.pages} pages • Uploaded {doc.uploadDate}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-wrap gap-1">
                {doc.extractedStatements.map((st, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    {st}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{doc.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
