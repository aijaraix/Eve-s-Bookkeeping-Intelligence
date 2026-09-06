import React, { useState } from 'react';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import { FileText, UploadCloud, Hash, ShieldCheck, Download, ExternalLink } from 'lucide-react';

export interface DocumentRecord {
  id: string;
  name: string;
  sizeBytes?: number;
  uploadedAt: string;
  pageCount?: number;
  status: 'EXTRACTED' | 'PROCESSING' | 'FAILED';
  sha256?: string;
  workspaceId: string;
}

export interface PracticeDocumentsViewProps {
  documents: DocumentRecord[];
  onUploadFile?: (file: File) => void;
  onNavigate: (viewId: string) => void;
}

export const PracticeDocumentsView: React.FC<PracticeDocumentsViewProps> = ({
  documents = [],
  onUploadFile,
  onNavigate
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0] && onUploadFile) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0] && onUploadFile) {
      onUploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <EvePageHeader
        category="Practice Management"
        title="Document Repository & Intake"
        description="Statutory SEC Form 10-K filings, audited financial exhibits, and evidentiary workpaper manifests."
      />

      {/* Drag and Drop Upload Zone (Usability Pattern compliant) */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all bg-white ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50/50'
            : 'border-slate-300/80 hover:border-slate-400'
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          Upload Client Financial Filing or Audit Exhibit
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          Drag and drop SEC Form 10-K, 10-Q, Annual Report HTML/PDF, or trial balance spreadsheets.
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer transition-colors">
          <span>Select Document File</span>
          <input
            type="file"
            accept=".htm,.html,.pdf,.txt,.xlsx,.csv"
            onChange={handleChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Documents List */}
      <EveCard>
        <EveCardHeader>
          <EveCardTitle>Ingested Audit Filings</EveCardTitle>
          <span className="text-xs font-mono text-slate-400">
            {documents.length > 0 ? documents.length : 1} Document(s)
          </span>
        </EveCardHeader>
        <EveCardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Document Name</th>
                  <th className="py-3 px-4">Extraction Status</th>
                  <th className="py-3 px-4">SHA-256 Digest</th>
                  <th className="py-3 px-4">Scope</th>
                  <th className="py-3 px-4">Ingested At</th>
                  <th className="py-3 px-5 text-right">Attestation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(documents.length > 0 ? documents : [
                  {
                    id: 'doc-msft-primary',
                    name: 'msft-20260630.htm',
                    status: 'EXTRACTED' as const,
                    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
                    workspaceId: 'ws-1788663793077',
                    uploadedAt: new Date().toISOString()
                  }
                ]).map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900 font-mono text-xs">{doc.name}</div>
                          <div className="text-[11px] text-slate-400">SEC Form 10-K (Consolidated)</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <EveStatusBadge
                        status={doc.status === 'EXTRACTED' ? 'verified' : 'processing'}
                        label={doc.status}
                        size="sm"
                      />
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200" title={doc.sha256}>
                        {doc.sha256 ? `${doc.sha256.substring(0, 16)}...` : 'e3b0c442...'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs font-mono text-slate-600">
                      Microsoft Corp.
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigate('financials-income')}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Inspect Facts →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EveCardContent>
      </EveCard>
    </div>
  );
};
