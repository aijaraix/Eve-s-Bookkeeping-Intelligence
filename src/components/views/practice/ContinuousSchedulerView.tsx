import React, { useState, useEffect } from 'react';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { EveStatusBadge } from '../../design-system/EveStatusBadge';
import {
  Clock,
  Cpu,
  Zap,
  Play,
  Pause,
  RotateCw,
  Layers,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  Server,
  Activity,
  HardDrive
} from 'lucide-react';

export const ContinuousSchedulerView: React.FC<{ onNavigate: (viewId: string) => void }> = ({ onNavigate }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [resources, setResources] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ticking, setTicking] = useState(false);

  const fetchSchedulerData = async () => {
    setLoading(true);
    try {
      const [tasksRes, resRes] = await Promise.all([
        fetch('/api/cpa/scheduler/tasks').then(r => r.json()),
        fetch('/api/cpa/scheduler/resources').then(r => r.json())
      ]);
      if (tasksRes.success) setTasks(tasksRes.tasks);
      if (resRes.success) setResources(resRes.resources);
    } catch (err) {
      console.warn('Failed to load scheduler data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedulerData();
    const timer = setInterval(fetchSchedulerData, 8000);
    return () => clearInterval(timer);
  }, []);

  const triggerTick = async () => {
    setTicking(true);
    try {
      const res = await fetch('/api/cpa/scheduler/tick', { method: 'POST' }).then(r => r.json());
      if (res.success) {
        setTasks(res.tasks);
        setResources(res.resources);
      }
    } catch (err) {
      console.warn('Tick error:', err);
    } finally {
      setTicking(false);
    }
  };

  const pipelineStages = [
    'DISCOVERY',
    'SOURCE_ACQUISITION',
    'CASE_PREPARATION',
    'CUSTOMER_JOURNEY',
    'INTAKE',
    'EXTRACTION',
    'ACCOUNTING',
    'PBC_WAIT',
    'REVIEW',
    'REPORT',
    'MINERVA',
    'LEARNING',
    'CAPABILITY'
  ];

  const priorityOrder = [
    { key: 'P0_CUSTOMER', label: 'P0 Customer Work (Preemptive)', color: 'text-emerald-400 bg-emerald-950 border-emerald-800' },
    { key: 'P1_RECOVERY', label: 'P1 Urgent Review & Recovery', color: 'text-amber-400 bg-amber-950 border-amber-800' },
    { key: 'P2_ACADEMY_JOURNEY', label: 'P2 Academy Customer Journey', color: 'text-blue-400 bg-blue-950 border-blue-800' },
    { key: 'P3_EXTRACTION_PRACTICE', label: 'P3 Deep Extraction Practice', color: 'text-indigo-400 bg-indigo-950 border-indigo-800' },
    { key: 'P4_RESEARCH_DISCOVERY', label: 'P4 Research & Discovery', color: 'text-purple-400 bg-purple-950 border-purple-800' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <EvePageHeader
        category="Continuous Practice Engine"
        title="Continuous Work-Conserving Practice Scheduler"
        description="Priority-tiered asynchronous pipeline keeping Eve productive without arbitrary cooldowns while strictly protecting customer preemption"
        actions={
          <div className="flex items-center gap-2">
            <EveStatusBadge status="running" label="Phase H.9.34 Active" />
            <button
              onClick={triggerTick}
              disabled={ticking}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-lg transition cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 ${ticking ? 'animate-bounce' : ''}`} />
              <span>Step Scheduler Tick</span>
            </button>
            <button
              onClick={fetchSchedulerData}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* System Telemetry & Resource Gates (PART XXXIV) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>CPU Core Load</span>
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {resources?.cpuLoadPercent ?? 12}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${resources?.cpuLoadPercent ?? 12}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>RAM Allocation</span>
            <Server className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {resources?.memoryUsagePercent ?? 45}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${resources?.memoryUsagePercent ?? 45}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>Customer vs Academy Jobs</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {resources?.activeCustomerJobsCount ?? 1} / {resources?.activeAcademyJobsCount ?? 2}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Customer work has absolute priority</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>System Capacity Gate</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {resources?.systemHealth ?? 'OPTIMAL'}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Safe execution capacity confirmed</div>
        </div>
      </div>

      {/* 13-Stage Horizontal Pipeline Visualizer */}
      <EveCard className="bg-slate-900 border-slate-800">
        <EveCardHeader className="pb-2">
          <EveCardTitle className="text-sm font-mono uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>13-Stage Practice Pipeline (Parallel Non-Serial Execution)</span>
            </span>
            <span className="text-xs font-mono text-slate-500 font-normal">
              Active Pipeline Projects: {tasks.length}
            </span>
          </EveCardTitle>
        </EveCardHeader>

        <EveCardContent className="pt-2">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 custom-scrollbar">
            {pipelineStages.map((stage, idx) => {
              const countInStage = tasks.filter(t => t.currentStage === stage).length;
              return (
                <div
                  key={stage}
                  className={`shrink-0 p-2.5 rounded-lg border text-xs font-mono min-w-[120px] ${
                    countInStage > 0
                      ? 'bg-slate-800 border-emerald-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500">{idx + 1}</span>
                    {countInStage > 0 && (
                      <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">
                        {countInStage}
                      </span>
                    )}
                  </div>
                  <div className="font-semibold truncate text-[11px]">
                    {stage.replace(/_/g, ' ')}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-xs font-mono text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Hourglass className="w-3.5 h-3.5 text-amber-400" />
              <span>
                "Waiting Does Not Mean Idle": Checkpointed tasks (e.g. PBC wait) yield CPU/RAM to let eligible Academy work advance without blocking.
              </span>
            </span>
          </div>
        </EveCardContent>
      </EveCard>

      {/* Pipeline Tasks Queue */}
      <div className="space-y-3">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1">
          Active Parallel Pipeline Workloads ({tasks.length})
        </div>

        <div className="space-y-3">
          {tasks.map(task => (
            <div
              key={task.taskId}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${task.isCustomer ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-blue-950 text-blue-300 border-blue-800'}`}>
                    {task.priority.replace(/_/g, ' ')}
                  </span>
                  <div className="text-sm font-bold text-white font-sans">{task.clientName}</div>
                  <span className="text-xs font-mono text-slate-500">({task.engagementId})</span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-slate-400">Assigned: <strong className="text-slate-200">{task.assignedAgent}</strong></span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      task.status === 'RUNNING'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : task.status === 'CHECKPOINTED_WAITING'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>

              {/* Stage Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Current Stage: <strong className="text-emerald-400">{task.currentStage.replace(/_/g, ' ')}</strong></span>
                  <span>{task.stageProgress}% Complete</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${task.stageProgress}%` }}
                  />
                </div>
              </div>

              {task.checkpointState && (
                <div className="text-xs font-mono text-amber-300 bg-amber-950/20 p-2.5 rounded border border-amber-900/40 flex items-center justify-between">
                  <span>Waiting On: <strong>{task.checkpointState.waitingOn}</strong> ({task.checkpointState.expectedDocument})</span>
                  <span className="text-slate-400 text-[11px]">Resources yielded to background workloads</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
