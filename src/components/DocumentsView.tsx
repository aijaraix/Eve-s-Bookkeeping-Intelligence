import React, { useState } from 'react';
import { FileText, Download, Eye, Upload, CheckCircle2, Clock, Search } from 'lucide-react';

interface DocumentsViewProps {
  onOpenUpload?: () => void;
  onInspectDocument?: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ onOpenUpload, onInspectDocument }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const docs = [
    { title: 'Unilever_Annual_Report_and_Accounts_2025.pdf', size: '14.2 MB', pages: 184, date: '2026-03-14', status: 'PARSED', facts: 342, type: 'Annual Report' },
    { title: 'Unilever_Q4_2025_Bank_Statements_Consolidated.pdf', size: '4.8 MB', pages: 32, date: '2026-02-10', status: 'PARSED', facts: 114, type: 'Bank Statement' },
    { title: 'PwC_Independent_Auditors_Report_2025.pdf', size: '2.1 MB', pages: 12, date: '2026-03-15', status: 'VERIFIED', facts: 48, type: 'Auditor Opinion' }
  ];

  const filtered = docs.filter((d) => d.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Audit Document Repository & OCR Pipeline</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              3 Ingested Documents
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unilever PLC • Canonical PDF Document Store & Fact Extraction Engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-48 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
          <button
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF Document</span>
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            INGESTED AUDIT FILES & PROVENANCE SOURCES
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-100/60">
                <th className="py-3 px-6">DOCUMENT NAME</th>
                <th className="py-3 px-6">TYPE</th>
                <th className="py-3 px-6 text-right">SIZE / PAGES</th>
                <th className="py-3 px-6 text-right">FACTS EXTRACTED</th>
                <th className="py-3 px-6 text-center">STATUS</th>
                <th className="py-3 px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((doc, idx) => (
                <tr key={idx} className="hover:bg-slate-50 cursor-pointer" onClick={onInspectDocument}>
                  <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    {doc.title}
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">{doc.type}</td>
                  <td className="py-3.5 px-6 text-right text-slate-600">{doc.size} ({doc.pages}p)</td>
                  <td className="py-3.5 px-6 text-right font-extrabold text-blue-600">{doc.facts} Facts</td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectDocument?.();
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                      title="Inspect Provenance"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

