import fs from 'fs';
import path from 'path';

export interface SemanticTaskRecord {
  taskId: string;
  intakeId: string;
  documentId?: string;
  taskType:
    | 'DOCUMENT_MAP'
    | 'EXTRACT_INCOME_STATEMENT'
    | 'EXTRACT_BALANCE_SHEET'
    | 'EXTRACT_CASH_FLOW'
    | 'EXTRACT_EQUITY'
    | 'EXTRACT_MATERIAL_NOTES'
    | 'ENTITY_SCOPE_RESOLUTION'
    | 'EVIDENCE_CROSSCHECK'
    | 'CANONICAL_RESOLUTION'
    | 'ACCOUNTING_RECONCILIATION'
    | 'READINESS_EVALUATION'
    | 'PROJECT_MATERIALIZATION';
  status:
    | 'QUEUED'
    | 'RUNNING'
    | 'WAITING_FOR_AI_CAPACITY'
    | 'RETRY_SCHEDULED'
    | 'COMPLETED'
    | 'COMPLETED_WITH_WARNINGS'
    | 'REVIEW_REQUIRED'
    | 'FAILED';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  attemptCount: number;
  provider: string;
  model: string;
  requestId?: string;
  retryAt?: number;
  error?: string;
  factsProduced?: number;
  factsVerified?: number;
  stageLabel?: string;
}

function getSemanticTasksFile(): string {
  return process.env.SEMANTIC_TASKS_FILE || path.join(process.cwd(), 'storage', 'semantic_tasks.json');
}

export class SemanticTaskManager {
  private static instance: SemanticTaskManager;
  private tasksMap: Map<string, SemanticTaskRecord> = new Map();

  private constructor() {
    this.loadFromDisk();
  }

  public static getInstance(): SemanticTaskManager {
    if (!SemanticTaskManager.instance) {
      SemanticTaskManager.instance = new SemanticTaskManager();
    }
    return SemanticTaskManager.instance;
  }

  private loadFromDisk() {
    try {
      const file = getSemanticTasksFile();
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8');
        const list: SemanticTaskRecord[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(t => this.tasksMap.set(t.taskId, t));
          console.log(`[SemanticTaskManager] Loaded ${list.length} semantic task records from disk.`);
        }
      }
    } catch (err) {
      console.warn('[SemanticTaskManager] Failed to load semantic tasks from disk:', err);
    }
  }

  private saveToDisk() {
    try {
      const file = getSemanticTasksFile();
      const dir = path.dirname(file);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const list = Array.from(this.tasksMap.values());
      fs.writeFileSync(file, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[SemanticTaskManager] Failed to save semantic tasks to disk:', err);
    }
  }

  public createTask(params: {
    intakeId: string;
    documentId?: string;
    taskType: SemanticTaskRecord['taskType'];
    stageLabel?: string;
    model?: string;
    provider?: string;
  }): SemanticTaskRecord {
    const taskId = `TSK-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowStr = new Date().toISOString();
    const task: SemanticTaskRecord = {
      taskId,
      intakeId: params.intakeId,
      documentId: params.documentId,
      taskType: params.taskType,
      status: 'QUEUED',
      createdAt: nowStr,
      attemptCount: 0,
      provider: params.provider || 'Google Gemini Native API',
      model: params.model || 'gemini-3.6-flash',
      stageLabel: params.stageLabel || params.taskType
    };
    this.tasksMap.set(taskId, task);
    this.saveToDisk();
    return task;
  }

  public updateTaskStatus(
    taskId: string,
    status: SemanticTaskRecord['status'],
    updates?: Partial<SemanticTaskRecord>
  ): SemanticTaskRecord | null {
    const task = this.tasksMap.get(taskId);
    if (!task) return null;

    task.status = status;
    const nowStr = new Date().toISOString();

    if (status === 'RUNNING' && !task.startedAt) {
      task.startedAt = nowStr;
    }
    if (status === 'COMPLETED' || status === 'COMPLETED_WITH_WARNINGS' || status === 'FAILED' || status === 'REVIEW_REQUIRED') {
      task.completedAt = nowStr;
    }

    if (updates) {
      Object.assign(task, updates);
    }

    this.tasksMap.set(taskId, task);
    this.saveToDisk();
    return task;
  }

  public getTasksForIntake(intakeId: string): SemanticTaskRecord[] {
    return Array.from(this.tasksMap.values()).filter(t => t.intakeId === intakeId);
  }

  public calculateIntakeProgress(intakeId: string): {
    progressPercent: number;
    stageName: string;
    completedCount: number;
    totalCount: number;
    tasks: SemanticTaskRecord[];
    activeTask?: SemanticTaskRecord;
    waitingTask?: SemanticTaskRecord;
  } {
    const tasks = this.getTasksForIntake(intakeId);
    if (tasks.length === 0) {
      return {
        progressPercent: 5,
        stageName: 'Preparing Documents',
        completedCount: 0,
        totalCount: 0,
        tasks: []
      };
    }

    const completed = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'COMPLETED_WITH_WARNINGS');
    const running = tasks.find(t => t.status === 'RUNNING');
    const waiting = tasks.find(t => t.status === 'WAITING_FOR_AI_CAPACITY');

    // Calculate real progress using stage completion weights
    let progress = 15; // Base document preparation complete

    const docMapTask = tasks.find(t => t.taskType === 'DOCUMENT_MAP');
    if (docMapTask?.status === 'COMPLETED' || docMapTask?.status === 'COMPLETED_WITH_WARNINGS') {
      progress += 20;
    } else if (docMapTask?.status === 'RUNNING') {
      progress += 10;
    }

    const statementTasks = tasks.filter(t =>
      t.taskType === 'EXTRACT_INCOME_STATEMENT' ||
      t.taskType === 'EXTRACT_BALANCE_SHEET' ||
      t.taskType === 'EXTRACT_CASH_FLOW' ||
      t.taskType === 'EXTRACT_EQUITY' ||
      t.taskType === 'EXTRACT_MATERIAL_NOTES'
    );
    if (statementTasks.length > 0) {
      const completedStmt = statementTasks.filter(t => t.status === 'COMPLETED' || t.status === 'COMPLETED_WITH_WARNINGS').length;
      progress += Math.round((completedStmt / statementTasks.length) * 35);
    }

    const evTask = tasks.find(t => t.taskType === 'EVIDENCE_CROSSCHECK');
    if (evTask?.status === 'COMPLETED' || evTask?.status === 'COMPLETED_WITH_WARNINGS') {
      progress += 15;
    } else if (evTask?.status === 'RUNNING') {
      progress += 5;
    }

    const reconTask = tasks.find(t => t.taskType === 'ACCOUNTING_RECONCILIATION');
    if (reconTask?.status === 'COMPLETED' || reconTask?.status === 'COMPLETED_WITH_WARNINGS') {
      progress += 10;
    } else if (reconTask?.status === 'RUNNING') {
      progress += 5;
    }

    const matTask = tasks.find(t => t.taskType === 'PROJECT_MATERIALIZATION');
    if (matTask?.status === 'COMPLETED' || matTask?.status === 'COMPLETED_WITH_WARNINGS') {
      progress += 5;
    }

    const finalProgress = Math.min(100, Math.max(5, progress));

    let stageName = 'Preparing Documents';
    if (waiting) {
      stageName = 'AI Analysis Temporarily Paused (Waiting for Capacity)';
    } else if (running?.stageLabel) {
      stageName = running.stageLabel;
    } else if (docMapTask?.status === 'RUNNING') {
      stageName = 'Understanding Document Structure';
    } else if (statementTasks.some(t => t.status === 'RUNNING')) {
      stageName = 'Reading Financial Statements';
    } else if (evTask?.status === 'RUNNING') {
      stageName = 'Verifying Source Evidence';
    } else if (reconTask?.status === 'RUNNING') {
      stageName = 'Reconciling Financial Statements';
    } else if (matTask?.status === 'RUNNING') {
      stageName = 'Preparing Project';
    } else if (completed.length === tasks.length && tasks.length > 0) {
      stageName = 'Complete';
    }

    return {
      progressPercent: finalProgress,
      stageName,
      completedCount: completed.length,
      totalCount: tasks.length,
      tasks,
      activeTask: running,
      waitingTask: waiting
    };
  }
}

export const semanticTaskManager = SemanticTaskManager.getInstance();
