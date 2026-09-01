import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Cpu, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { QueueJobStatus } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJob: (job: QueueJobStatus) => void;
}

export const SAMPLE_DOCUMENTS = [
  {
    title: 'Unilever_Annual_Report_and_Accounts_2025.pdf',
    size: '14.2 MB',
    pages: 184,
    description: 'Consolidated Income Statement, Balance Sheet, Cash Flows & Note Disclosures'
  },
  {
    title: 'Volkswagen_AG_Annual_Report_2025.pdf',
    size: '32.8 MB',
    pages: 302,
    description: 'Automotive & Financial Services segment reporting with IFRS reconciliation'
  },
  {
    title: 'Nestle_SA_Financial_Statements_Q4_2025.pdf',
    size: '18.5 MB',
    pages: 128,
    description: 'Quarterly financial report with currency translation & raw material notes'
  }
];

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onAddJob }) => {
  const [selectedEngine, setSelectedEngine] = useState<'HYBRID_GEMINI_NATIVE' | 'STRUCTURED_OCR' | 'DEEP_PARSER'>('HYBRID_GEMINI_NATIVE');
  const [customFileName, setCustomFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file.name, `${(file.size / (1024 * 1024)).toFixed(1)} MB`, 140);
    }
  };

  const processFile = (title: string, size: string, pages: number) => {
    setIsProcessing(true);
    setTimeout(() => {
      const newJob: QueueJobStatus = {
        id: `job-${Date.now()}`,
        documentTitle: title,
        fileSize: size,
        pagesTotal: pages,
        pagesCompleted: 0,
        status: 'PROCESSING',
        currentStage: 'Intake Service: PDF Layout Analysis & Section Mapping',
        engineMode: selectedEngine,
        progress: 15,
        factsExtracted: 0,
        startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      onAddJob(newJob);
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Upload Financial Statements</h2>
              <p className="text-xs text-slate-300">Hermes Ingestion & Forensic Scalar Extraction Engine</p>
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
          {/* Drag & Drop Zone */}
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
            <h3 className="text-sm font-bold text-slate-900">Drag & Drop Financial Reports (PDF, XLSX)</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Supports multi-page Annual Reports, 10-K filings, and balance sheet schedules up to 200 MB.
            </p>
            <div className="mt-4">
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 cursor-pointer inline-flex items-center gap-2 transition-all">
                <FileText className="w-4 h-4" />
                <span>Browse Files</span>
                <input
                  type="file"
                  accept=".pdf,.xlsx,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      processFile(f.name, `${(f.size / (1024 * 1024)).toFixed(1)} MB`, 160);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Extraction Engine Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Select Extraction Strategy
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'HYBRID_GEMINI_NATIVE', label: 'Hybrid Gemini Native', desc: 'Highest Accuracy (Default)' },
                { id: 'STRUCTURED_OCR', label: 'Structured OCR', desc: 'Scanned Documents' },
                { id: 'DEEP_PARSER', label: 'Deep Parser', desc: 'Multi-table Discrepancy' }
              ].map((engine) => (
                <button
                  key={engine.id}
                  onClick={() => setSelectedEngine(engine.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedEngine === engine.id
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{engine.label}</div>
                  <div className="text-[10px] text-slate-500">{engine.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preset Sample Documents for 1-Click Test */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                Or Select Sample Audit Seed Files:
              </span>
              <span className="text-blue-600 text-[11px] font-mono">Instant Simulation</span>
            </div>

            <div className="space-y-2">
              {SAMPLE_DOCUMENTS.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold text-xs font-mono">
                      PDF
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">{doc.title}</div>
                      <div className="text-[11px] text-slate-500">{doc.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => processFile(doc.title, doc.size, doc.pages)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-semibold text-xs rounded-lg transition-all border border-blue-200 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Ingest</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
