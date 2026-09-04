import React, { useState } from 'react';
import { usePractice } from '../context/PracticeContext';
import { UploadCloud, X, FileText, CheckCircle2 } from 'lucide-react';

export const UploadModal: React.FC = () => {
  const { isUploadOpen, setIsUploadOpen } = usePractice();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  if (!isUploadOpen) return null;

  const handleSimulateUpload = (filename: string) => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploadedFile(filename);
      setTimeout(() => {
        setIsUploadOpen(false);
        setUploadedFile(null);
      }, 1200);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Intake Financial Document</h3>
          </div>
          <button
            onClick={() => setIsUploadOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Upload statutory Annual Reports, 10-K / 10-Q filings, audit workpapers, or XLSX financial tables for OCR ingestion and multi-agent swarm validation.
        </p>

        {/* Drag and drop area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.[0]) {
              handleSimulateUpload(e.dataTransfer.files[0].name);
            }
          }}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center space-y-3 ${
            dragActive
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-750 hover:border-slate-600 bg-slate-850/50'
          }`}
        >
          {uploading ? (
            <div className="space-y-2">
              <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-300 font-semibold">Running high-precision OCR & Swarm parsing...</p>
            </div>
          ) : uploadedFile ? (
            <div className="space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-xs text-emerald-400 font-semibold">Document {uploadedFile} ingested successfully!</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Drag & drop your PDF or spreadsheet here
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Supports PDF, XLSX, CSV up to 100MB</p>
              </div>

              <button
                onClick={() => handleSimulateUpload('Unilever_2024_Statutory_Pack.pdf')}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Or Select Sample Audit Pack
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
