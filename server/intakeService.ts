import fs from 'fs';
import path from 'path';
import { IntakeSessionRecord, IntakeSessionFileRecord, Workspace, DocumentRecord } from '../src/types.js';
import { corporateGroupService } from './corporateGroupService.js';
import { AccountingValidationEngine } from './accountingValidationEngine.js';

function getIntakeSessionsFile(): string {
  return process.env.INTAKE_SESSIONS_FILE || path.join(process.cwd(), 'storage', 'intake_sessions.json');
}

export class IntakeService {
  private intakeSessions: Map<string, IntakeSessionRecord> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      const file = getIntakeSessionsFile();
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8');
        const list: IntakeSessionRecord[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(item => this.intakeSessions.set(item.id, item));
          console.log(`[IntakeService] Loaded ${list.length} persisted intake sessions from storage.`);
        }
      }
    } catch (err) {
      console.error('[IntakeService] Failed to load intake sessions from disk:', err);
    }
  }

  private saveToDiskAsync(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const file = getIntakeSessionsFile();
        const dir = path.dirname(file);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const list = Array.from(this.intakeSessions.values());
        fs.writeFileSync(file, JSON.stringify(list, null, 2), 'utf-8');
      } catch (err) {
        console.error('[IntakeService] Failed to save intake sessions to disk:', err);
      }
      resolve();
    });
  }

  public createIntakeSession(params: {
    targetProjectId?: string | null;
    userId?: string;
    userEmail?: string;
    engineMode?: string;
    uploadedFiles: IntakeSessionFileRecord[];
    documentIds: string[];
    stagedDocuments?: any[];
    stagedPageManifests?: any[];
    stagedSourceBlocks?: any[];
    stagedFacts?: any[];
    pagesTotal?: number;
  }): IntakeSessionRecord {
    const intakeId = `intake-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowStr = new Date().toISOString();
    const effectiveEngineMode = params.engineMode || process.env.PDF_EXTRACTION_ENGINE || 'HYBRID_GEMINI_NATIVE';

    const session: IntakeSessionRecord = {
      id: intakeId,
      targetProjectId: params.targetProjectId || null,
      userId: params.userId || 'usr-default',
      userEmail: params.userEmail || '',
      engineMode: effectiveEngineMode,
      uploadedFiles: params.uploadedFiles || [],
      documentIds: params.documentIds || [],
      queueJobIds: [],
      status: 'QUEUED',
      progress: 0,
      pagesTotal: params.pagesTotal || params.uploadedFiles.reduce((acc, f) => acc + (f.pageCount || 1), 0) || 1,
      pagesProcessed: 0,
      factsFoundCount: (params.stagedFacts || []).length,
      entitiesDiscoveredCount: 0,
      detectedEntities: [],
      detectedReportingPeriods: ['FY 2025'],
      detectedCurrencies: ['EUR'],
      detectedStatements: [],
      candidateRelationships: [],
      stagedFacts: params.stagedFacts || [],
      stagedDocuments: params.stagedDocuments || [],
      stagedPageManifests: params.stagedPageManifests || [],
      stagedSourceBlocks: params.stagedSourceBlocks || [],
      warnings: [],
      createdAt: nowStr,
      updatedAt: nowStr,
      completionState: 'PENDING',
      currentStageName: 'Intake session created. Validating uploaded documents...'
    };

    this.intakeSessions.set(intakeId, session);
    this.saveToDiskAsync();
    console.log(`[IntakeService] Created Intake Session ${intakeId} with ${params.uploadedFiles.length} file(s).`);
    return session;
  }

  public getIntakeSession(id: string): IntakeSessionRecord | null {
    return this.intakeSessions.get(id) || null;
  }

  public getActiveIntakeSessions(): IntakeSessionRecord[] {
    return Array.from(this.intakeSessions.values()).filter(
      s => s.status === 'QUEUED' || s.status === 'PROCESSING'
    );
  }

  public getAllIntakeSessions(): IntakeSessionRecord[] {
    return Array.from(this.intakeSessions.values());
  }

  public registerQueueJobs(intakeId: string, jobIds: string[]) {
    const session = this.intakeSessions.get(intakeId);
    if (!session) return;
    jobIds.forEach(id => {
      if (!session.queueJobIds.includes(id)) {
        session.queueJobIds.push(id);
      }
    });
    session.status = 'PROCESSING';
    session.updatedAt = new Date().toISOString();
    this.saveToDiskAsync();
  }

  public updateIntakeSessionFromJobs(intakeId: string, jobs: any[]): IntakeSessionRecord | null {
    const session = this.intakeSessions.get(intakeId);
    if (!session) return null;

    const intakeJobs = jobs.filter(j => session.queueJobIds.includes(j.id) || j.intakeSessionId === intakeId || j.workspaceId === intakeId);
    if (intakeJobs.length === 0) return session;

    let totalPages = 0;
    let completedPages = 0;
    let totalFactsCount = session.stagedFacts?.length || 0;
    let stageNames: string[] = [];
    let isAllComplete = true;
    let hasTerminalFailures = false;
    let hasReviewRequired = false;

    intakeJobs.forEach(job => {
      totalPages += job.pagesTotal || job.unitsTotal || 1;
      completedPages += job.pagesCompleted || job.unitsCompleted || 0;
      if (job.result?.facts && Array.isArray(job.result.facts)) {
        totalFactsCount += job.result.facts.length;
      }
      if (job.currentStage) stageNames.push(job.currentStage);

      if (job.status === 'PROCESSING' || job.status === 'QUEUED' || job.status === 'STALLED' || job.status === 'RECOVERING' || job.status === 'WAITING_FOR_AI_CAPACITY' || job.status === 'WAITING_FOR_DAILY_CAPACITY') {
        isAllComplete = false;
      } else if (job.status === 'FAILED') {
        hasTerminalFailures = true;
      } else if (job.status === 'REVIEW_REQUIRED' || job.status === 'COMPLETED_WITH_WARNINGS') {
        hasReviewRequired = true;
      }
    });

    if (totalPages > 0) session.pagesTotal = totalPages;
    session.pagesProcessed = Math.min(completedPages, session.pagesTotal);
    
    // Calculate monotonic progress percentage
    const rawProgress = session.pagesTotal > 0 ? Math.floor((session.pagesProcessed / session.pagesTotal) * 100) : 0;
    session.progress = Math.max(session.progress, Math.min(100, rawProgress));
    session.factsFoundCount = Math.max(session.factsFoundCount, totalFactsCount);
    if (stageNames.length > 0) {
      session.currentStageName = stageNames[0];
    }

    session.updatedAt = new Date().toISOString();

    const hasWaitingAi = intakeJobs.some(j => j.status === 'WAITING_FOR_AI_CAPACITY');
    const hasWaitingDaily = intakeJobs.some(j => j.status === 'WAITING_FOR_DAILY_CAPACITY');

    if (isAllComplete) {
      if (hasTerminalFailures && session.pagesProcessed === 0) {
        session.status = 'FAILED';
        session.completionState = 'FAILED';
      } else if (hasReviewRequired || hasTerminalFailures) {
        session.status = 'REVIEW_REQUIRED';
      } else {
        session.status = 'COMPLETED';
      }
      session.completedAt = new Date().toISOString();
      session.progress = 100;
    } else if (hasWaitingDaily) {
      session.status = 'WAITING_FOR_DAILY_CAPACITY';
    } else if (hasWaitingAi) {
      session.status = 'WAITING_FOR_AI_CAPACITY';
    } else {
      session.status = 'PROCESSING';
    }

    this.saveToDiskAsync();
    return session;
  }

  public promoteIntakeSessionToProject(
    intakeId: string,
    db: { workspaces: Workspace[]; documents: DocumentRecord[]; pageManifests?: any[]; sourceBlocks?: any[]; facts: any[]; discrepancies?: any[] }
  ): { workspace: Workspace; intakeSession: IntakeSessionRecord } {
    const intake = this.intakeSessions.get(intakeId);
    if (!intake) {
      throw new Error(`Intake Session ${intakeId} not found.`);
    }

    if (intake.completionState === 'PROMOTED' && intake.promotedProjectId) {
      const existingWs = db.workspaces.find(w => w.id === intake.promotedProjectId);
      if (existingWs) {
        return { workspace: existingWs, intakeSession: intake };
      }
    }

    let targetWs: Workspace | null = null;

    if (intake.targetProjectId) {
      // Promoting into an existing project
      targetWs = db.workspaces.find(w => w.id === intake.targetProjectId) || null;
    }

    if (!targetWs) {
      // Determine entity name from discovered entities or original files
      const primaryEntityName =
        intake.detectedEntities.find(e => e.entityType === 'PARENT')?.name ||
        intake.detectedEntities[0]?.name ||
        intake.uploadedFiles[0]?.originalName?.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') ||
        'Financial Workspace';

      const period = intake.detectedReportingPeriods[0] || 'FY 2025';
      const cleanCode = primaryEntityName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'PRJ';

      targetWs = {
        id: `ws-${Date.now()}`,
        name: `${primaryEntityName}`,
        code: `${cleanCode}-${Math.floor(100 + Math.random() * 900)}`,
        currency: intake.detectedCurrencies[0] || 'EUR',
        country: 'Consolidated Group',
        period,
        userEmail: intake.userEmail || '',
        createdAt: new Date().toISOString()
      };

      db.workspaces.push(targetWs);

      // Register primary entity
      const primaryEntity = corporateGroupService.createEntity({
        workspaceId: targetWs.id,
        name: primaryEntityName,
        legalName: primaryEntityName,
        jurisdiction: 'Global',
        reportingCurrency: targetWs.currency,
        entityType: 'PARENT',
        ownershipPercentage: 100,
        scope: 'Consolidated'
      });
      targetWs.primaryEntityId = primaryEntity.id;

      // Register any additional discovered sub-entities
      intake.detectedEntities.forEach(sub => {
        if (sub.name && sub.name.toLowerCase() !== primaryEntityName.toLowerCase()) {
          const newSub = corporateGroupService.createEntity({
            workspaceId: targetWs!.id,
            name: sub.name,
            legalName: sub.name,
            jurisdiction: 'Global',
            reportingCurrency: targetWs!.currency,
            entityType: 'SUBSIDIARY',
            ownershipPercentage: 100,
            scope: 'Subsidiary'
          });
          corporateGroupService.createRelationship({
            workspaceId: targetWs!.id,
            parentEntityId: primaryEntity.id,
            childEntityId: newSub.id,
            relationshipType: 'PARENT_OF',
            ownershipPercentage: 100,
            consolidationMethod: 'FULL'
          });
        }
      });
    }

    const wsId = targetWs.id;

    // Transactionally promote staged documents
    if (intake.stagedDocuments && intake.stagedDocuments.length > 0) {
      intake.stagedDocuments.forEach(doc => {
        const existing = db.documents.find(d => d.id === doc.id);
        if (existing) {
          existing.workspaceId = wsId;
        } else {
          db.documents.push({ ...doc, workspaceId: wsId });
        }
      });
    }

    // Transactionally promote staged page manifests
    if (intake.stagedPageManifests && intake.stagedPageManifests.length > 0) {
      if (!db.pageManifests) db.pageManifests = [];
      intake.stagedPageManifests.forEach(pm => {
        db.pageManifests!.push({ ...pm, workspace_id: wsId });
      });
    }

    // Transactionally promote staged source blocks
    if (intake.stagedSourceBlocks && intake.stagedSourceBlocks.length > 0) {
      if (!db.sourceBlocks) db.sourceBlocks = [];
      intake.stagedSourceBlocks.forEach(sb => {
        db.sourceBlocks!.push({ ...sb, workspace_id: wsId });
      });
    }

    // Transactionally promote staged facts
    if (intake.stagedFacts && intake.stagedFacts.length > 0) {
      intake.stagedFacts.forEach(fact => {
        const factCopy = { ...fact, workspaceId: wsId, project_id: wsId };
        const existingIdx = db.facts.findIndex(f => f.id === fact.id);
        if (existingIdx >= 0) {
          db.facts[existingIdx] = factCopy;
        } else {
          db.facts.unshift(factCopy);
        }
      });
    }

    // Run Accounting Validation Engine on promoted workspace
    try {
      const workspaceFacts = db.facts.filter(f => f.workspaceId === wsId);
      AccountingValidationEngine.validateWorkspace(wsId, workspaceFacts);
    } catch (err) {
      console.warn(`[IntakeService] Accounting validation notice for ${wsId}:`, err);
    }

    // Update intake session completion state
    intake.promotedProjectId = wsId;
    intake.completionState = 'PROMOTED';
    intake.updatedAt = new Date().toISOString();
    this.saveToDiskAsync();

    console.log(`[IntakeService] Successfully promoted Intake Session ${intakeId} -> Workspace ${wsId} (${targetWs.name})`);
    return { workspace: targetWs, intakeSession: intake };
  }
}

export const intakeService = new IntakeService();
