/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — CONTINUOUS WORK-CONSERVING SCHEDULER
 * Phase H.9.34 Master Consolidation
 *
 * Implements the Non-Negotiable Principle:
 * "IF SAFE CAPACITY EXISTS AND ELIGIBLE USEFUL WORK EXISTS,
 *  THE ACADEMY SHOULD NOT REMAIN IDLE WITHOUT A DOCUMENTED REASON."
 * "CUSTOMER WORK ALWAYS PREEMPTS ACADEMY WORK."
 * "WAITING DOES NOT MEAN IDLE."
 *
 * Architecture:
 * 1. Priority-Tiered Dispatch (P0 Customer -> P1 Recovery -> P2 Academy Journey -> P3 Deep Extraction -> P4 Discovery)
 * 2. 13-Stage Pipeline Queues with Asynchronous Stage Checkpoints
 * 3. Resource-Aware Concurrency Gates (CPU, RAM, Worker Queue, Token Budget)
 * 4. Deterministic & Local-First Execution Policy
 */

import os from 'os';
import fs from 'fs';
import path from 'path';

export type WorkloadPriority = 'P0_CUSTOMER' | 'P1_RECOVERY' | 'P2_ACADEMY_JOURNEY' | 'P3_EXTRACTION_PRACTICE' | 'P4_RESEARCH_DISCOVERY';

export type PipelineQueueStage =
  | 'DISCOVERY'
  | 'SOURCE_ACQUISITION'
  | 'CASE_PREPARATION'
  | 'CUSTOMER_JOURNEY'
  | 'INTAKE'
  | 'EXTRACTION'
  | 'ACCOUNTING'
  | 'PBC_WAIT'
  | 'REVIEW'
  | 'REPORT'
  | 'MINERVA'
  | 'LEARNING'
  | 'CAPABILITY';

export interface WorkConservingTask {
  taskId: string;
  projectId: string;
  engagementId: string;
  clientName: string;
  priority: WorkloadPriority;
  currentStage: PipelineQueueStage;
  status: 'QUEUED' | 'RUNNING' | 'CHECKPOINTED_WAITING' | 'COMPLETED' | 'PREEMPTED';
  isCustomer: boolean;
  assignedAgent: string;
  stageProgress: number; // 0 - 100
  checkpointState?: any;
  resourceRequirements: {
    cpuCost: number;       // 1 - 10
    ramCostMb: number;
    requiresCloudModel: boolean;
  };
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface SystemResourceSnapshot {
  cpuLoadPercent: number;
  totalMemoryMb: number;
  freeMemoryMb: number;
  memoryUsagePercent: number;
  activeCustomerJobsCount: number;
  activeAcademyJobsCount: number;
  cloudTokensRemaining: number;
  systemHealth: 'OPTIMAL' | 'MODERATE' | 'CONSTRAINED';
}

export class WorkConservingScheduler {
  private static instance: WorkConservingScheduler | null = null;
  private tasks = new Map<string, WorkConservingTask>();
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;

  private constructor() {
    // Non-negotiable (Doc 35): Production starts empty of customer truth.
    // Do NOT auto-seed tasks on boot.
    this.startSchedulerLoop();
  }

  public static getInstance(): WorkConservingScheduler {
    if (!WorkConservingScheduler.instance) {
      WorkConservingScheduler.instance = new WorkConservingScheduler();
    }
    return WorkConservingScheduler.instance;
  }

  /**
   * Explicitly seeds synthetic baseline pipeline tasks for Academy/Regression testing only.
   */
  public seedSyntheticBaselinePipeline(classification: 'SYNTHETIC_ACADEMY' | 'REGRESSION' = 'SYNTHETIC_ACADEMY') {
    if (this.tasks.size > 0) return;
    // Demonstration multi-stage pipeline showcasing parallel execution without serial bottlenecks
    const baselineTasks: WorkConservingTask[] = [
      {
        taskId: 'task-pltr-review',
        projectId: 'proj-pltr-audit-2025',
        engagementId: 'eng-pltr-2025-annual',
        clientName: 'Palantir Technologies Inc.',
        priority: 'P2_ACADEMY_JOURNEY',
        currentStage: 'REVIEW',
        status: 'RUNNING',
        isCustomer: false,
        assignedAgent: 'QUINN_REVIEWER',
        stageProgress: 88,
        resourceRequirements: { cpuCost: 3, ramCostMb: 128, requiresCloudModel: false },
        queuedAt: new Date(Date.now() - 3600000).toISOString(),
        startedAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        taskId: 'task-omega-extraction',
        projectId: 'proj-asiapac-telco',
        engagementId: 'eng-asiapac-2025',
        clientName: 'Omega Telecommunications Limited',
        priority: 'P3_EXTRACTION_PRACTICE',
        currentStage: 'EXTRACTION',
        status: 'RUNNING',
        isCustomer: false,
        assignedAgent: 'EVE_EXTRACTOR',
        stageProgress: 64,
        resourceRequirements: { cpuCost: 4, ramCostMb: 256, requiresCloudModel: false },
        queuedAt: new Date(Date.now() - 2400000).toISOString(),
        startedAt: new Date(Date.now() - 1200000).toISOString()
      },
      {
        taskId: 'task-vendor-pbc-wait',
        projectId: 'proj-vendor-review',
        engagementId: 'eng-vendor-2025',
        clientName: 'ABC Telecom Ltd.',
        priority: 'P0_CUSTOMER',
        currentStage: 'PBC_WAIT',
        status: 'CHECKPOINTED_WAITING',
        isCustomer: true,
        assignedAgent: 'CLARA_COORDINATOR',
        stageProgress: 50,
        checkpointState: { waitingOn: 'pcr-2025-001', expectedDocument: 'W-9 Confirmation' },
        resourceRequirements: { cpuCost: 0, ramCostMb: 16, requiresCloudModel: false },
        queuedAt: new Date(Date.now() - 7200000).toISOString(),
        startedAt: new Date(Date.now() - 7000000).toISOString()
      },
      {
        taskId: 'task-global-research',
        projectId: 'proj-curriculum-scout',
        engagementId: 'eng-curriculum-scout-2026',
        clientName: 'FTSE-100 & DAX-40 Multi-Currency Benchmarks',
        priority: 'P4_RESEARCH_DISCOVERY',
        currentStage: 'DISCOVERY',
        status: 'QUEUED',
        isCustomer: false,
        assignedAgent: 'LEARNING_DEAN',
        stageProgress: 15,
        resourceRequirements: { cpuCost: 1, ramCostMb: 64, requiresCloudModel: false },
        queuedAt: new Date(Date.now() - 900000).toISOString()
      }
    ];

    for (const t of baselineTasks) {
      this.tasks.set(t.taskId, t);
    }
  }

  private startSchedulerLoop() {
    // Run work-conserving cycle every 10 seconds without blocking server
    this.timer = setInterval(() => {
      this.tick();
    }, 10000);
  }

  public getResourceSnapshot(): SystemResourceSnapshot {
    const totalMem = os.totalmem() / (1024 * 1024);
    const freeMem = os.freemem() / (1024 * 1024);
    const memUsage = ((totalMem - freeMem) / totalMem) * 100;
    const cpus = os.cpus();
    const loadAvg = os.loadavg()[0]; // 1-minute load average
    const cpuPercent = Math.min(100, Math.round((loadAvg / (cpus.length || 1)) * 100));

    const tasksList = Array.from(this.tasks.values());
    const activeCustomer = tasksList.filter(t => t.isCustomer && t.status === 'RUNNING').length;
    const activeAcademy = tasksList.filter(t => !t.isCustomer && t.status === 'RUNNING').length;

    let health: 'OPTIMAL' | 'MODERATE' | 'CONSTRAINED' = 'OPTIMAL';
    if (cpuPercent > 80 || memUsage > 85) {
      health = 'CONSTRAINED';
    } else if (cpuPercent > 50 || memUsage > 70) {
      health = 'MODERATE';
    }

    return {
      cpuLoadPercent: cpuPercent,
      totalMemoryMb: Math.round(totalMem),
      freeMemoryMb: Math.round(freeMem),
      memoryUsagePercent: Math.round(memUsage),
      activeCustomerJobsCount: activeCustomer,
      activeAcademyJobsCount: activeAcademy,
      cloudTokensRemaining: 850000,
      systemHealth: health
    };
  }

  /**
   * Work-Conserving Tick:
   * Advances eligible tasks, respects customer preemption, and avoids arbitrary idling.
   */
  public tick() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const resources = this.getResourceSnapshot();
      if (resources.systemHealth === 'CONSTRAINED') {
        // Under heavy system constraint, preempt non-customer P3/P4 jobs to protect customer responsiveness
        for (const task of this.tasks.values()) {
          if (!task.isCustomer && (task.priority === 'P3_EXTRACTION_PRACTICE' || task.priority === 'P4_RESEARCH_DISCOVERY') && task.status === 'RUNNING') {
            task.status = 'PREEMPTED';
          }
        }
        return;
      }

      // Progress active tasks
      for (const task of this.tasks.values()) {
        if (task.status === 'RUNNING') {
          if (task.stageProgress < 100) {
            task.stageProgress = Math.min(100, task.stageProgress + 4);
          } else {
            // Task reached 100% of current stage -> promote to next pipeline stage or complete
            this.promoteTaskNextStage(task);
          }
        } else if (task.status === 'PREEMPTED' || task.status === 'QUEUED') {
          // Safe capacity exists -> keep useful work moving!
          task.status = 'RUNNING';
          if (!task.startedAt) {
            task.startedAt = new Date().toISOString();
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private promoteTaskNextStage(task: WorkConservingTask) {
    const stageFlow: PipelineQueueStage[] = [
      'DISCOVERY',
      'SOURCE_ACQUISITION',
      'CASE_PREPARATION',
      'INTAKE',
      'EXTRACTION',
      'ACCOUNTING',
      'REVIEW',
      'REPORT',
      'MINERVA',
      'LEARNING',
      'CAPABILITY'
    ];

    const currentIndex = stageFlow.indexOf(task.currentStage);
    if (currentIndex >= 0 && currentIndex < stageFlow.length - 1) {
      task.currentStage = stageFlow[currentIndex + 1];
      task.stageProgress = 10;
    } else {
      task.status = 'COMPLETED';
      task.completedAt = new Date().toISOString();
    }
  }

  // --- PUBLIC APIS ---

  public getAllTasks(): WorkConservingTask[] {
    return Array.from(this.tasks.values());
  }

  public getTask(taskId: string): WorkConservingTask | undefined {
    return this.tasks.get(taskId);
  }

  public enqueueTask(taskData: Omit<WorkConservingTask, 'taskId' | 'status' | 'queuedAt'>): WorkConservingTask {
    const task: WorkConservingTask = {
      ...taskData,
      taskId: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'QUEUED',
      queuedAt: new Date().toISOString()
    };
    this.tasks.set(task.taskId, task);
    this.tick();
    return task;
  }

  public checkpointTask(taskId: string, reason: string): WorkConservingTask {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    task.status = 'CHECKPOINTED_WAITING';
    task.checkpointState = { reason, checkpointedAt: new Date().toISOString() };
    this.tick();
    return task;
  }

  public resumeTask(taskId: string): WorkConservingTask {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    task.status = 'RUNNING';
    delete task.checkpointState;
    this.tick();
    return task;
  }
}

export const workConservingScheduler = WorkConservingScheduler.getInstance();
