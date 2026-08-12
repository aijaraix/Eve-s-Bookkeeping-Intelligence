import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Loader2, ArrowRight, Building2, ShieldCheck, X, AlertCircle, FileText, Database } from 'lucide-react';
import { Workspace } from '../types';

interface ExtractionProgressModalProps {
  isOpen: boolean;
  progress: number;
  stepName: string;
  stepNumber: number;
  error: string | null;
  result?: {
    workspace: Workspace | null;
    extractedName: string;
    docCount: number;
    factsCount: number;
  } | null;
  userEmail: string | null;
  onClose: () => void;
  onViewProject: (ws: Workspace | null) => void;
  onOpenSignIn?: () => void;
}

export const ExtractionProgressModal: React.FC<ExtractionProgressModalProps> = ({
  isOpen,
  progress,
  stepName,
  stepNumber,
  error,
  result,
  userEmail,
  onClose,
  onViewProject,
  onOpenSignIn,
}) => {
  const isComplete = progress === 100 && !error;
  const [countdown, setCountdown] = useState<number>(1);

  useEffect(() => {
    if (isOpen && isComplete) {
      setCountdown(1);
      const timer = setTimeout(() => {
        onClose();
        onViewProject(result?.workspace || null);
      }, 1500);

      const interval = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [isOpen, isComplete]);

  if (!isOpen) return null;

  const steps = [
    { num: 1, label: 'Uploading & SHA-256 Hash Verification' },
    { num: 2, label: 'AnyDoc & Spreadsheet Multi-Page Parsing' },
    { num: 3, label: 'Financial Fact Extraction & Line Item Normalization' },
    { num: 4, label: 'Hermes 4-Agent Consensus Audit' }
  ];

  const handleCloseClick = () => {
    onClose();
    if (isComplete) {
      onViewProject(result?.workspace || null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl max-w-md sm:max-w-lg w-[92vw] p-3.5 sm:p-5 shadow-2xl text-neutral-900 space-y-3 relative overflow-hidden my-auto max-h-[85vh] sm:max-h-[88vh] flex flex-col">
        
        {/* Top Header Bar with Always-Visible Close Button */}
        <div className="flex items-center justify-between shrink-0 pb-1">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold ${
            isComplete ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {isComplete ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            )}
            <span>{isComplete ? 'Extraction Complete' : 'Processing Document'}</span>
          </div>

          <button
            type="button"
            onClick={handleCloseClick}
            className="text-neutral-400 hover:text-neutral-900 p-1 sm:p-1.5 rounded-xl hover:bg-neutral-100 transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Main Content Body */}
        <div className="flex-1 overflow-y-auto space-y-2.5 sm:space-y-3.5 pr-0.5 text-xs sm:text-sm">
          {/* Title */}
          <div className="space-y-0.5">
            <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 leading-snug">
              {isComplete ? 'Document Extraction Complete!' : 'Analyzing & Extracting Financial Data'}
            </h2>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-medium leading-relaxed">
              {isComplete
                ? 'All financial statements and line items have been parsed and reconciled into the Fact Registry.'
                : stepName || 'Parsing documents and running multi-agent consensus verification...'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-extrabold">
              <span className="text-neutral-700 font-mono">Progress Stage</span>
              <span className={`${isComplete ? 'text-emerald-600' : 'text-blue-600'} font-mono`}>{progress}%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden border border-neutral-200 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isComplete ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                }`}
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
          </div>

          {/* Auto-Navigation Status Banner */}
          {isComplete && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] sm:text-xs font-bold p-2.5 rounded-xl flex items-center justify-between animate-fadeIn shadow-xs">
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 text-emerald-600 animate-spin shrink-0" />
                <span>Closing modal & opening workspace automatically in {countdown}s...</span>
              </div>
              <button
                type="button"
                onClick={handleCloseClick}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-lg transition cursor-pointer shrink-0"
              >
                Open Now
              </button>
            </div>
          )}

          {/* Pipeline Execution Checklist */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 sm:p-3.5 space-y-1.5">
            <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider block mb-0.5">
              Pipeline Execution Checklist
            </span>
            {steps.map((s) => {
              const stepDone = progress >= s.num * 25 || isComplete;
              const stepCurrent = !isComplete && progress >= (s.num - 1) * 25 && progress < s.num * 25;

              return (
                <div key={s.num} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs">
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      {stepDone ? (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </div>
                      ) : stepCurrent ? (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Loader2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center shrink-0 font-bold text-[8px] sm:text-[9px]">
                          {s.num}
                        </div>
                      )}
                      <span className={`font-semibold text-[11px] sm:text-xs ${stepDone ? 'text-neutral-900' : stepCurrent ? 'text-blue-700 font-bold' : 'text-neutral-400'}`}>
                        {s.label}
                      </span>
                    </div>
                    {stepDone && (
                      <span className="text-[8.5px] sm:text-[9.5px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        Verified
                      </span>
                    )}
                  </div>

                  {s.num === 4 && (progress >= 80 || isComplete) && (
                    <div className="ml-4 sm:ml-6 pl-2 border-l border-neutral-200 space-y-0.5 py-0.5">
                      {[
                        { id: 'fin', label: 'Fin AI (Ledger Tracing)', activeRange: [80, 84] },
                        { id: 'audit', label: 'Audit AI (Regulatory Compliance)', activeRange: [85, 89] },
                        { id: 'risk', label: 'Risk AI (Cut-off Review)', activeRange: [90, 94] },
                        { id: 'lead', label: 'Hermes Lead (Consensus Verification)', activeRange: [95, 100] },
                      ].map(agent => {
                        const agentDone = progress > agent.activeRange[1] || isComplete;
                        const agentActive = !isComplete && progress >= agent.activeRange[0] && progress <= agent.activeRange[1];
                        return (
                          <div key={agent.id} className="flex items-center space-x-1.5 text-[9.5px] sm:text-[10px]">
                            {agentDone ? (
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                            ) : agentActive ? (
                              <Loader2 className="w-2.5 h-2.5 text-blue-600 animate-spin shrink-0" />
                            ) : (
                              <div className="w-2 h-2 rounded-full border border-neutral-300 shrink-0" />
                            )}
                            <span className={`${agentDone ? 'text-neutral-600 font-medium' : agentActive ? 'text-blue-700 font-bold' : 'text-neutral-400'}`}>
                              {agent.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-start space-x-2 text-red-800 text-[11px] sm:text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Extraction Error</span>
                <p className="text-red-700 text-[10.5px] mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Extraction Result Summary Box (When Complete) - Dynamic Facts Counter */}
          {isComplete && result && (
            <div className="bg-gradient-to-br from-slate-900 to-[#0c1838] p-3 sm:p-3.5 rounded-xl border border-slate-800 text-white space-y-2 shadow-md">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400 block">Extracted Entity</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white font-sans">{result.extractedName}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[8.5px] sm:text-[9.5px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Validated</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
                <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50 flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-blue-400 shrink-0" />
                  <div>
                    <span className="text-[8.5px] text-slate-400 block font-semibold">Processed Documents</span>
                    <span className="font-extrabold text-white text-[11px] block">{result.docCount} Document File</span>
                  </div>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50 flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[8.5px] text-slate-400 block font-semibold">Extracted Line Items</span>
                    <span className="font-extrabold text-emerald-400 text-[11px] block">{result.factsCount} Financial Facts</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button Footer */}
        {isComplete && (
          <div className="space-y-1.5 pt-1.5 border-t border-neutral-100 shrink-0">
            {userEmail ? (
              <button
                type="button"
                onClick={handleCloseClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 sm:py-2.5 px-3 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <span>View Extracted Workspace & Financials</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={handleCloseClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 sm:py-2.5 px-3 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <span>View Extracted Workspace & Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenSignIn) onOpenSignIn();
                  }}
                  className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-1.5 px-2.5 rounded-lg transition text-[11px] cursor-pointer flex items-center justify-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Sign in to Save to Account</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
