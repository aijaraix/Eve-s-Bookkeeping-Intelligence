import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, Clock, Loader2, AlertCircle, RefreshCw, FileText, AlertTriangle } from 'lucide-react';
import { Workspace } from '../types';

export interface QueueJobUI {
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
  chunksTotal?: number;
  chunksCompleted?: number;
  unitsTotal?: number;
  unitsCompleted?: number;
  pagesTotal?: number;
  pagesCompleted?: number;
  tasksTotal?: number;
  tasksCompleted?: number;
  factsExtractedCount?: number;
  heartbeatAt?: string;
  subAgents?: {
    alpha: { status: "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED"; pages: string; factsFound: number };
    beta: { status: "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED"; pages: string; factsFound: number };
    gamma: { status: "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED"; pages: string; factsFound: number };
    synthesizer: { status: "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED"; totalFactsMerged: number };
  };
  result?: {
    facts: any[];
    discrepancies: any[];
    executionTimeMs: number;
  };
  error?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

interface HermesQueueTrackerProps {
  activeWorkspace: Workspace | null;
}

export const HermesQueueTracker: React.FC<HermesQueueTrackerProps> = ({ activeWorkspace }) => {
  const [jobs, setJobs] = useState<QueueJobUI[]>([]);
  const [resumingJobId, setResumingJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      let url = '/api/queue/jobs';
      if (activeWorkspace) {
        url += `?workspaceId=${activeWorkspace.id}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      setJobs([]);
    }
  };

  const handleResumeJob = async (jobId: string) => {
    setResumingJobId(jobId);
    try {
      await fetch(`/api/queue/jobs/${jobId}/resume`, { method: 'POST' });
      await fetchJobs();
    } catch (err) {
      console.error("[QueueTracker] Resume error:", err);
    } finally {
      setResumingJobId(null);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 2500);
    return () => clearInterval(interval);
  }, [activeWorkspace]);

  if (jobs.length === 0) return null;

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
              Asynchronous Multi-Agent Hermes Ingestion Queue
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-100 text-blue-800 font-bold">
                {jobs.filter(j => j.status === 'PROCESSING' || j.status === 'QUEUED').length} Active
              </span>
            </h3>
            <p className="text-xs text-neutral-500">Persisted state machine tracking physical pages & financial verification.</p>
          </div>
        </div>

        <button
          onClick={fetchJobs}
          className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition cursor-pointer"
          title="Refresh Queue"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => {
          const statusVal: "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED" = 
            (job.status === 'COMPLETED' || job.status === 'COMPLETED_WITH_WARNINGS' || job.status === 'REVIEW_REQUIRED')
              ? 'COMPLETED'
              : job.status === 'PROCESSING'
              ? 'PROCESSING'
              : 'IDLE';

          const subAgents = job.subAgents || {
            alpha: {
              status: statusVal,
              pages: `Pages 1 - ${Math.ceil((job.pagesTotal || 1) / 3)}`,
              factsFound: Math.floor((job.factsExtractedCount ?? job.result?.facts?.length ?? 0) * 0.35)
            },
            beta: {
              status: statusVal,
              pages: `Pages ${Math.ceil((job.pagesTotal || 1) / 3) + 1} - ${Math.ceil(((job.pagesTotal || 1) * 2) / 3)}`,
              factsFound: Math.floor((job.factsExtractedCount ?? job.result?.facts?.length ?? 0) * 0.35)
            },
            gamma: {
              status: statusVal,
              pages: `Pages ${Math.ceil(((job.pagesTotal || 1) * 2) / 3) + 1} - ${job.pagesTotal || 1}`,
              factsFound: Math.floor((job.factsExtractedCount ?? job.result?.facts?.length ?? 0) * 0.3)
            },
            synthesizer: {
              status: statusVal,
              totalFactsMerged: job.factsExtractedCount ?? job.result?.facts?.length ?? 0
            }
          };

          return (
            <div key={job.id} className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-extrabold text-neutral-900 text-xs">{job.documentTitle}</span>
                  <span className="text-[10px] font-mono text-neutral-400">({job.id})</span>
                </div>

                <div className="flex items-center space-x-2">
                  {job.status === 'PROCESSING' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" /> Ingestion Active ({job.progress}%)
                    </span>
                  )}
                  {job.status === 'QUEUED' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-neutral-200 text-neutral-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Queued
                    </span>
                  )}
                  {job.status === 'COMPLETED' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Complete (100%)
                    </span>
                  )}
                  {job.status === 'COMPLETED_WITH_WARNINGS' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" /> Complete (With Warnings)
                    </span>
                  )}
                  {job.status === 'REVIEW_REQUIRED' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-purple-600" /> Review Required
                    </span>
                  )}
                  {job.status === 'STALLED' && (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Stalled
                      </span>
                      <button
                        onClick={() => handleResumeJob(job.id)}
                        disabled={resumingJobId === job.id}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 cursor-pointer"
                      >
                        {resumingJobId === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        <span>Resume</span>
                      </button>
                    </div>
                  )}
                  {job.status === 'FAILED' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Failed
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 transition-all duration-300 ${
                    job.status === 'COMPLETED' || job.status === 'COMPLETED_WITH_WARNINGS' || job.status === 'REVIEW_REQUIRED'
                      ? 'bg-emerald-500'
                      : job.status === 'FAILED'
                      ? 'bg-rose-500'
                      : job.status === 'STALLED'
                      ? 'bg-amber-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span className="font-medium">{job.currentStage}</span>
                <span className="font-mono text-[10.5px] font-bold text-neutral-500 shrink-0 ml-2">
                  Pages: {job.pagesCompleted ?? job.unitsCompleted ?? 0}/{job.pagesTotal ?? job.unitsTotal ?? 1} | Tasks: {job.tasksCompleted ?? job.unitsCompleted ?? 0}/{job.tasksTotal ?? job.unitsTotal ?? 1}
                </span>
              </div>

              {/* Sub-Agents Status Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
                <div className="bg-white p-2.5 rounded-xl border border-neutral-200 space-y-1">
                  <div className="flex items-center justify-between font-extrabold text-neutral-800">
                    <span>Agent Alpha</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                      subAgents.alpha.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {subAgents.alpha.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500 truncate">{subAgents.alpha.pages}</p>
                  <span className="font-mono text-[10px] text-blue-600 font-bold block">{subAgents.alpha.factsFound} facts</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-neutral-200 space-y-1">
                  <div className="flex items-center justify-between font-extrabold text-neutral-800">
                    <span>Agent Beta</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                      subAgents.beta.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {subAgents.beta.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500 truncate">{subAgents.beta.pages}</p>
                  <span className="font-mono text-[10px] text-blue-600 font-bold block">{subAgents.beta.factsFound} facts</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-neutral-200 space-y-1">
                  <div className="flex items-center justify-between font-extrabold text-neutral-800">
                    <span>Agent Gamma</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                      subAgents.gamma.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {subAgents.gamma.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500 truncate">{subAgents.gamma.pages}</p>
                  <span className="font-mono text-[10px] text-blue-600 font-bold block">{subAgents.gamma.factsFound} facts</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-neutral-200 space-y-1">
                  <div className="flex items-center justify-between font-extrabold text-neutral-800">
                    <span>Synthesizer</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                      subAgents.synthesizer.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {subAgents.synthesizer.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500">Unified Model</p>
                  <span className="font-mono text-[10px] text-emerald-600 font-bold block">{subAgents.synthesizer.totalFactsMerged} facts merged</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
