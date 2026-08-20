import React from 'react';
import { Cpu, Loader2, Clock, CheckCircle2, AlertTriangle, Maximize2, Sparkles } from 'lucide-react';

interface LiveWalkthroughPillProps {
  job: any;
  onOpenWalkthrough: () => void;
}

export const LiveWalkthroughPill: React.FC<LiveWalkthroughPillProps> = ({
  job,
  onOpenWalkthrough
}) => {
  if (!job) return null;

  const isComplete = job.status === 'COMPLETED' || job.status === 'COMPLETED_WITH_WARNINGS';
  const isFailed = job.status === 'FAILED';
  const isPaused = job.status === 'WAITING_FOR_AI_CAPACITY' || job.currentStage?.includes('Paused') || job.currentStage?.includes('Capacity');
  const progress = job.progress || 0;

  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-sm sm:max-w-md animate-slideUp">
      <div 
        onClick={onOpenWalkthrough}
        className="bg-neutral-900/95 hover:bg-neutral-900 text-white backdrop-blur-md border border-neutral-700/80 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 cursor-pointer transition transform hover:-translate-y-0.5 group"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isComplete
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : isPaused
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : isFailed
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
          }`}>
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : isPaused ? (
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            ) : isFailed ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                Live Walkthrough
              </span>
              <span className="text-[10px] font-mono text-neutral-400 font-bold">
                ({progress}%)
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[240px]">
              {isPaused 
                ? 'AI Capacity Paused (Auto-Retrying)'
                : job.currentStage || 'Processing Financial Ingestion...'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenWalkthrough();
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center space-x-1 shrink-0 shadow-xs transition group-hover:bg-blue-500"
        >
          <span>View</span>
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
