import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, Cpu, ShieldCheck, X } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { submitDocuments, selectedWorkspaceId, companies, intakeStatus } = usePractice();
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachToSelected, setAttachToSelected] = useState(Boolean(selectedWorkspaceId));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else setDragActive(false);
  };

  const addFiles = (list: FileList | File[]) => {
    const next = Array.from(list).filter((f) => /\.(pdf|xlsx|xls|csv)$/i.test(f.name) || f.type.includes('pdf') || f.type.includes('sheet'));
    setSelectedFiles((prev) => [...prev, ...next]);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!selectedFiles.length) {
      setError('No files uploaded. Refusing to synthesize an Audit Working Paper from empty input.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      await submitDocuments(selectedFiles, attachToSelected && Boolean(selectedWorkspaceId));
      setSelectedFiles([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Upload refused');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCompany = companies.find((c) => c.id === selectedWorkspaceId);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Submit Client Documents</h2>
              <p className="text-xs text-slate-300">POST /api/documents/upload · Hybrid Gemini extraction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              dragActive
                ? 'border-blue-600 bg-blue-50/80 scale-[1.01]'
                : 'border-slate-300 bg-slate-50/60 hover:border-blue-500 hover:bg-blue-50/30'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">PDF, XLSX, or bank statements (200+ pages supported)</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Multipart upload only. Drive URLs and empty uploads are refused by fail-closed guards.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 cursor-pointer inline-flex items-center gap-2 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Browse Files</span>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <span className="font-bold text-slate-800 truncate">{file.name}</span>
                  <span className="text-slate-500 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              ))}
            </div>
          )}

          <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={attachToSelected && Boolean(selectedWorkspaceId)}
              disabled={!selectedWorkspaceId}
              onChange={(e) => setAttachToSelected(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Attach to selected company/project
              {selectedCompany ? ` (${selectedCompany.name})` : ' — none selected, will CREATE_NEW_INTAKE'}
            </span>
          </label>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            Engine: HYBRID_GEMINI_NATIVE · SHA-256 hashed on the server · no live mocks
          </div>

          {intakeStatus && (
            <div className="text-xs font-mono text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
              Intake status: {intakeStatus}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              {isProcessing ? 'Uploading…' : 'Upload & Extract'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
