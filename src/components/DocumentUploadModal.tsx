import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Building2, Plus, Sparkles, Globe } from 'lucide-react';
import { Workspace } from '../types';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  onSubmitUpload: (files: File[], instructions: string, driveUrl?: string, confirmAttach?: boolean, workspaceId?: string) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  activeWorkspace,
  onSubmitUpload,
}) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(
    activeWorkspace?.id || workspaces[0]?.id || 'new'
  );
  const [files, setFiles] = useState<File[]>([]);
  const [instructions, setInstructions] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 && !driveUrl) {
      alert('Please select files or provide a Google Drive / Web URL.');
      return;
    }

    const isAttachToExisting = selectedWorkspaceId && selectedWorkspaceId !== 'new';
    onSubmitUpload(
      files,
      instructions,
      driveUrl,
      isAttachToExisting,
      isAttachToExisting ? selectedWorkspaceId : undefined
    );
    setFiles([]);
    setInstructions('');
    setDriveUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md sm:max-w-xl w-[92vw] p-4 sm:p-6 space-y-4 my-auto max-h-[85vh] overflow-y-auto relative text-neutral-900 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 tracking-tight">Upload Financial Documents</h3>
              <p className="text-[10px] sm:text-xs text-neutral-500">Ingest annual reports, trial balances, or SEC filings into a project workspace.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {uploadSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-neutral-900">Document Upload Successful</h4>
            <p className="text-xs text-neutral-500">Hermes AI consensus engine is verifying and parsing line items.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Target Workspace Selection */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-neutral-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Select Target Project Workspace:</span>
              </label>
              <select
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2.5 font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.country || 'Global Entity'})
                  </option>
                ))}
                <option value="new">+ Create New Workspace for this Document</option>
              </select>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-neutral-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-neutral-50/50 transition cursor-pointer relative"
            >
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.xlsx,.csv,.doc,.docx"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="font-bold text-neutral-800">
                {files.length > 0 ? `${files.length} file(s) selected` : 'Drag and drop files here, or click to browse'}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Supports PDF (annual reports, 10-K), Excel trial balances (.xlsx), and CSV files.
              </p>

              {files.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {files.map((f, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Firecrawl Web / Drive URL Ingestion */}
            <div className="space-y-1">
              <label className="font-bold text-neutral-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Or Ingest Web / Investor Relations URL (Firecrawl):</span>
              </label>
              <input
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="e.g. https://www.nestle.com/investors or Google Drive filing link"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Optional Instructions */}
            <div className="space-y-1">
              <label className="font-bold text-neutral-700">Special Instructions / Audit Scope (Optional):</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Please perform ASC 606 revenue recognition audit and verify Q4 footnotes."
                rows={2}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 rounded-xl text-xs font-bold text-neutral-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Processing & Verification...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload & Ingest Document</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
