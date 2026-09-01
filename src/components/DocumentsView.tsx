import React, { useState } from 'react';
import { FileText, Eye, Upload, Search } from 'lucide-react';
import { FinancialFact } from '../types';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';
import { EmptyExtractionState } from './EmptyExtractionState';

interface DocumentsViewProps {
  onOpenUpload?: () => void;
  onInspectDocument?: (fact?: FinancialFact) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ onOpenUpload, onInspectDocument }) => {
  const { documents, financialFacts, companies, selectedCompanyId } = usePractice();
  const [searchTerm, setSearchTerm] = useState('');
  const company = companies.find((c) => c.id === selectedCompanyId);
  const filtered = documents.filter((d) => (d.originalName || d.filename || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Audit Document Repository</h2>
          <p className="text-xs text-slate-500 mt-1">
            {company?.name || EMPTY_DISPLAY} • {filtered.length} ingested file{filtered.length === 1 ? '' : 's'}
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
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-48"
            />
          </div>
          <button onClick={onOpenUpload} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Upload PDF Document
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyExtractionState title="No documents" onUpload={onOpenUpload} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-100/60">
                <th className="py-3 px-6">DOCUMENT NAME</th>
                <th className="py-3 px-6">SHA-256</th>
                <th className="py-3 px-6 text-right">PAGES</th>
                <th className="py-3 px-6 text-right">FACTS</th>
                <th className="py-3 px-6 text-center">STATUS</th>
                <th className="py-3 px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    {doc.originalName || doc.filename}
                  </td>
                  <td className="py-3.5 px-6 text-slate-500 font-mono text-[10px]">{(doc.sha256 || EMPTY_DISPLAY).slice(0, 16)}</td>
                  <td className="py-3.5 px-6 text-right">{doc.pageCount || EMPTY_DISPLAY}</td>
                  <td className="py-3.5 px-6 text-right font-extrabold text-blue-600">{doc.extractedFactsCount || 0}</td>
                  <td className="py-3.5 px-6 text-center">{doc.status}</td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => onInspectDocument?.(financialFacts.find((f) => f.provenance.documentId === doc.id))}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
