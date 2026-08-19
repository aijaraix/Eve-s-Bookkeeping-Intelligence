import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  Building2,
  ShieldCheck,
  X,
  AlertCircle,
  FileText,
  Database,
  Clock,
  Cloud,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Workspace } from '../types';

export interface ServerQueueJob {
  id: string;
  workspaceId: string;
  documentId: string;
  documentTitle: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "COMPLETED_WITH_WARNINGS" | "REVIEW_REQUIRED" | "FAILED" | "STALLED";
  stage?: string;
  stageHistory?: Array<{
    stage: string;
    status: "STARTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
    timestamp: string;
    details?: string;
  }>;
  progress: number;
  currentStage: string;
  unitsTotal: number;
  unitsCompleted: number;
  pagesTotal?: number;
  pagesCompleted?: number;
  tasksTotal?: number;
  tasksCompleted?: number;
  heartbeatAt?: string;
  processingUnits?: Array<{
    unit_id: string;
    actual_page_start: number;
    actual_page_end: number;
    status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "RETRYING" | "REVIEW_REQUIRED" | "NO_TEXT";
    last_error?: string;
  }>;
  result?: {
    facts?: any[];
    discrepancies?: any[];
    agentLogs?: any[];
  };
  error?: string;
  lastError?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ExtractionProgressModalProps {
  isOpen: boolean;
  progress: number;
  stepName: string;
  stepNumber: number;
  error: string | null;
  job?: ServerQueueJob | null;
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
  job,
  result,
  userEmail,
  onClose,
  onViewProject,
}) => {
  const activeProgress = job?.progress !== undefined ? job.progress : progress;
  const activeStage = job?.currentStage || stepName;
  const activeError = job?.lastError || job?.error || error;

  const isStalled = job?.status === 'STALLED';
  const isFailed = job?.status === 'FAILED';
  const isComplete = (
    job?.status === 'COMPLETED' ||
    job?.status === 'COMPLETED_WITH_WARNINGS' ||
    job?.status === 'REVIEW_REQUIRED' ||
    (activeProgress === 100 && !activeError)
  ) && !isStalled && !isFailed;

  const [countdown, setCountdown] = useState<number>(1);
  const [isResuming, setIsResuming] = useState(false);

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

  const [traceData, setTraceData] = useState<any>(null);

  // Poll forensic trace telemetry for active intake session
  useEffect(() => {
    if (!isOpen || isComplete) return;

    const intakeId = job?.intakeSessionId || job?.workspaceId;
    if (!intakeId) return;

    const fetchTrace = async () => {
      try {
        const res = await fetch(`/api/intakes/${intakeId}/trace`);
        if (res.ok) {
          const data = await res.json();
          setTraceData(data);
        }
      } catch (err) {
        // Silent trace poll
      }
    };

    fetchTrace();
    const interval = setInterval(fetchTrace, 2000);
    return () => clearInterval(interval);
  }, [isOpen, isComplete, job?.intakeSessionId, job?.workspaceId]);

  if (!isOpen) return null;

  const isRateLimited = Boolean(
    job?.status === 'WAITING_FOR_AI_CAPACITY' ||
    traceData?.waitingTasks?.length > 0 ||
    job?.currentStage?.includes('Paused') ||
    job?.currentStage?.includes('Capacity')
  );

  const semanticTasks = traceData?.semanticTasks || [];

  const handleCloseClick = () => {
    onClose();
    if (isComplete) {
      onViewProject(result?.workspace || null);
    }
  };

  const handleResume = async () => {
    if (!job?.id) return;
    setIsResuming(true);
    try {
      await fetch(`/api/queue/jobs/${job.id}/resume`, { method: 'POST' });
    } catch (err) {
      console.error("[Modal] Resume failed:", err);
    } finally {
      setIsResuming(false);
    }
  };

  const isStageDone = (stageKey: string) => {
    if (isComplete) return true;
    if (!job) return false;
    return Boolean(job.stageHistory?.some(s => s.stage === stageKey && s.status === 'COMPLETED'));
  };

  const isStageActive = (stageKey: string) => {
    if (isComplete || !job) return false;
    return job.stage === stageKey;
  };

  // Rule 4: Do NOT show page cards until PAGE_INVENTORY_COMPLETED is achieved
  const isPageInventoryDone = job
    ? Boolean(
        job.stageHistory?.some(s => s.stage === 'PAGE_INVENTORY_COMPLETED' && s.status === 'COMPLETED') ||
        (job.pagesTotal && job.pagesTotal > 0 && job.stage !== 'DOCUMENT_REGISTERED' && job.stage !== 'PAGE_INVENTORY_STARTED')
      )
    : false;

  const units = job?.processingUnits || [];
  const pagesTotal = job?.pagesTotal || units.length || 0;
  const pagesCompleted = job?.pagesCompleted || units.filter(u => u.status === 'COMPLETED' || u.status === 'NO_TEXT').length || 0;
  const tasksTotal = job?.tasksTotal || units.length + 2;
  const tasksCompleted = job?.tasksCompleted || pagesCompleted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl max-w-md sm:max-w-lg w-[92vw] p-3.5 sm:p-5 shadow-2xl text-neutral-900 space-y-3 relative overflow-hidden my-auto max-h-[85vh] sm:max-h-[88vh] flex flex-col">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between shrink-0 pb-1">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold ${
            isComplete
              ? job?.status === 'COMPLETED_WITH_WARNINGS'
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : job?.status === 'REVIEW_REQUIRED'
                ? 'bg-purple-50 border border-purple-200 text-purple-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : isStalled
              ? 'bg-amber-100 border border-amber-300 text-amber-900'
              : isFailed
              ? 'bg-rose-100 border border-rose-300 text-rose-900'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {isComplete ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : isStalled || isFailed ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            )}
            <span>
              {isComplete
                ? job?.status === 'COMPLETED_WITH_WARNINGS'
                  ? 'Complete (With Extraction Warnings)'
                  : job?.status === 'REVIEW_REQUIRED'
                  ? 'Complete (Audit Review Required)'
                  : 'Complete & Fully Reconciled'
                : isStalled
                ? 'Ingestion Stalled (Heartbeat Timeout)'
                : isFailed
                ? 'Ingestion Failed'
                : 'Server Extraction Active'}
            </span>
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
              {isComplete ? 'Document Ingestion & Analysis Complete' : isStalled ? 'Ingestion Heartbeat Stalled' : 'Extracting Financial Data'}
            </h2>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-medium leading-relaxed">
              {isComplete
                ? 'Financial statements and disclosures have been extracted into the Fact Registry.'
                : activeStage || 'Parsing document pages and running multi-agent verification...'}
            </p>
          </div>

          {/* Rate Limit / Paused Capacity Notice */}
          {isRateLimited && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-amber-950 text-xs shadow-xs animate-fadeIn">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-extrabold block text-amber-950">
                  AI Analysis Temporarily Paused (Capacity Limit)
                </span>
                <p className="text-amber-900 text-[11px] leading-relaxed">
                  AI analysis temporarily paused. Your work is safely saved. Processing will resume automatically.
                </p>
              </div>
            </div>
          )}

          {/* Background Worker Notification Badge */}
          {!isComplete && !isStalled && !isFailed && !isRateLimited && (
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-2.5 flex items-start gap-2.5 text-blue-900 shadow-xs">
              <Cloud className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-0.5 text-[11px]">
                <span className="font-extrabold block text-blue-950 flex items-center gap-1">
                  Persistent Background State Machine Active
                </span>
                <p className="text-blue-800/90 leading-snug">
                  Refreshing or closing your browser will <strong>not</strong> lose progress. State is continuously persisted on the backend.
                </p>
              </div>
            </div>
          )}

          {/* Stalled Banner */}
          {isStalled && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start justify-between gap-3 text-amber-900 text-xs">
              <div className="space-y-1">
                <span className="font-extrabold block text-amber-950 flex items-center gap-1">
                  Worker Thread Heartbeat Stalled
                </span>
                <p className="text-amber-800 text-[11px]">
                  No heartbeat was received from the extraction thread for over 30s. Click Resume to re-queue incomplete units.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResume}
                disabled={isResuming}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
              >
                {isResuming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Resume</span>
              </button>
            </div>
          )}

          {/* Progress Bar & Counters (Rule 5 & Rule 6: Separate pages from tasks) */}
          <div className="space-y-1.5 bg-neutral-50 border border-neutral-200 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[11px] font-extrabold">
              <span className="text-neutral-700 font-mono">
                Physical Pages: <span className="text-blue-700">{pagesCompleted}/{pagesTotal}</span>
              </span>
              <span className="text-neutral-500 font-mono text-[10px]">
                Internal Tasks: {tasksCompleted}/{tasksTotal}
              </span>
              <span className={`${isComplete ? 'text-emerald-600' : 'text-blue-600'} font-mono`}>{activeProgress}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden border border-neutral-300 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isComplete ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                }`}
                style={{ width: `${Math.max(5, activeProgress)}%` }}
              />
            </div>
          </div>

          {/* Auto-Navigation Status Banner */}
          {isComplete && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] sm:text-xs font-bold p-2.5 rounded-xl flex items-center justify-between animate-fadeIn shadow-xs">
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 text-emerald-600 animate-spin shrink-0" />
                <span>Closing modal & opening workspace in {countdown}s...</span>
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

          {/* Rule 4: Do NOT show page cards until PAGE_INVENTORY_COMPLETED */}
          {isPageInventoryDone && units.length > 0 && !isComplete && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider block">
                  Physical Page Manifest Inventory ({pagesCompleted}/{pagesTotal} Pages Extracted)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
                {units.map((u, i) => (
                  <div
                    key={u.unit_id || i}
                    className={`p-1.5 rounded-lg border text-[10.5px] font-medium flex items-center justify-between ${
                      u.status === 'COMPLETED'
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : u.status === 'NO_TEXT'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : u.status === 'PROCESSING'
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold animate-pulse'
                        : u.status === 'FAILED'
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-white border-neutral-200 text-neutral-500'
                    }`}
                  >
                    <span className="truncate">Page {u.actual_page_start}</span>
                    <span className="text-[9px] font-mono font-bold shrink-0">
                      {u.status === 'COMPLETED' ? (
                        <span className="text-emerald-700">Extracted</span>
                      ) : u.status === 'NO_TEXT' ? (
                        <span className="text-amber-700">No Text</span>
                      ) : u.status === 'PROCESSING' ? (
                        <Loader2 className="w-3 h-3 text-blue-600 animate-spin shrink-0" />
                      ) : u.status === 'FAILED' ? (
                        <span className="text-rose-700">Failed</span>
                      ) : (
                        <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real Hybrid Semantic Pipeline Execution Checklist */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 sm:p-3.5 space-y-1.5">
            <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider block mb-0.5">
              Hybrid Extraction & Semantic Pipeline Telemetry
            </span>
            {semanticTasks.length > 0 ? (
              semanticTasks.map((task: any, idx: number) => {
                const isDone = task.status === 'COMPLETED' || task.status === 'COMPLETED_WITH_WARNINGS';
                const isRunning = task.status === 'RUNNING';
                const isWaiting = task.status === 'WAITING_FOR_AI_CAPACITY';

                return (
                  <div key={task.taskId || idx} className="flex items-center justify-between text-[11px] sm:text-xs py-0.5 border-b border-neutral-100 last:border-none">
                    <div className="flex items-center space-x-2">
                      {isDone ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        </div>
                      ) : isRunning ? (
                        <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        </div>
                      ) : isWaiting ? (
                        <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center shrink-0 font-bold text-[9px]">
                          {idx + 1}
                        </div>
                      )}
                      <span className={`font-semibold text-[11px] sm:text-xs ${isDone ? 'text-neutral-900' : isRunning ? 'text-blue-700 font-bold' : isWaiting ? 'text-amber-800 font-bold' : 'text-neutral-400'}`}>
                        {task.taskType?.replace(/_/g, ' ') || task.title}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                      isDone ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                      isRunning ? 'text-blue-700 bg-blue-50 border-blue-200 animate-pulse' :
                      isWaiting ? 'text-amber-800 bg-amber-50 border-amber-200' :
                      'text-neutral-500 bg-neutral-100 border-neutral-200'
                    }`}>
                      {isDone ? 'Completed' : isRunning ? 'In Progress' : isWaiting ? 'Paused' : 'Queued'}
                    </span>
                  </div>
                );
              })
            ) : (
              [
                { name: 'Document Structure & Map', key: 'DOCUMENT_MAP' },
                { name: 'Income Statement Extraction', key: 'EXTRACT_INCOME_STATEMENT' },
                { name: 'Balance Sheet Extraction', key: 'EXTRACT_BALANCE_SHEET' },
                { name: 'Cash Flow Extraction', key: 'EXTRACT_CASH_FLOW' },
                { name: 'Footnotes & Disclosures Analysis', key: 'EXTRACT_NOTES' },
                { name: 'Evidence Cross-Verification', key: 'EVIDENCE_VERIFICATION' },
                { name: 'Accounting Reconciliation', key: 'ACCOUNTING_RECONCILIATION' },
                { name: 'Project Workspace Materialization', key: 'PROJECT_MATERIALIZATION' }
              ].map((s, idx) => {
                const isDone = isComplete || (job?.pagesCompleted && job.pagesCompleted > 0 && idx < 4);
                const isRunning = !isComplete && idx === Math.min(7, Math.floor((activeProgress / 100) * 8));

                return (
                  <div key={s.key} className="flex items-center justify-between text-[11px] sm:text-xs py-0.5 border-b border-neutral-100 last:border-none">
                    <div className="flex items-center space-x-2">
                      {isDone ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        </div>
                      ) : isRunning ? (
                        <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center shrink-0 font-bold text-[9px]">
                          {idx + 1}
                        </div>
                      )}
                      <span className={`font-semibold text-[11px] sm:text-xs ${isDone ? 'text-neutral-900' : isRunning ? 'text-blue-700 font-bold' : 'text-neutral-400'}`}>
                        {s.name}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                      isDone ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                      isRunning ? 'text-blue-700 bg-blue-50 border-blue-200 animate-pulse' :
                      'text-neutral-500 bg-neutral-100 border-neutral-200'
                    }`}>
                      {isDone ? 'Completed' : isRunning ? 'In Progress' : 'Queued'}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Error State */}
          {activeError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-start space-x-2 text-red-800 text-[11px] sm:text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Extraction Notice</span>
                <p className="text-red-700 text-[10.5px] mt-0.5">{activeError}</p>
              </div>
            </div>
          )}

          {/* Extraction Result Summary Box */}
          {isComplete && (
            <div className="bg-gradient-to-br from-slate-900 to-[#0c1838] p-3 sm:p-3.5 rounded-xl border border-slate-800 text-white space-y-2 shadow-md">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400 block">Extracted Workspace</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white font-sans">{result?.extractedName || job?.documentTitle || 'Financial Workspace'}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[8.5px] sm:text-[9.5px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                  <span>State Verified</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
                <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50 flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-blue-400 shrink-0" />
                  <div>
                    <span className="text-[8.5px] text-slate-400 block font-semibold">Physical Pages</span>
                    <span className="font-extrabold text-white text-[11px] block">{job?.pagesTotal || result?.docCount || 1} Physical Pages</span>
                  </div>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50 flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[8.5px] text-slate-400 block font-semibold">Extracted Line Items</span>
                    <span className="font-extrabold text-emerald-400 text-[11px] block">{job?.result?.facts?.length || result?.factsCount || 0} Financial Facts</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button Footer */}
        {isComplete && (
          <div className="space-y-1.5 pt-1.5 border-t border-neutral-100 shrink-0">
            <button
              type="button"
              onClick={handleCloseClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 sm:py-2.5 px-3 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-xs"
            >
              <span>View Extracted Workspace & Financials</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
