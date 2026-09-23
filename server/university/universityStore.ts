import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const UNIVERSITY_TENANT_CLASSIFICATIONS = [
  'PRODUCTION_CUSTOMER',
  'ACADEMY_SYNTHETIC',
  'ACADEMY_PUBLIC_DATA',
  'INTERNAL_ACCEPTANCE'
] as const;

export type UniversityTenantClassification = typeof UNIVERSITY_TENANT_CLASSIFICATIONS[number];
export type UniversityResult = 'UNTESTED' | 'RUNNING' | 'PASS' | 'CLARIFICATION_PASS' | 'FAIL' | 'BLOCKED' | 'NOT_APPLICABLE';
export type UniversityStage =
  | 'INTAKE'
  | 'EXTRACTION'
  | 'EVIDENCE'
  | 'CANONICALIZATION'
  | 'ACCOUNTING'
  | 'RECONCILIATION'
  | 'CLARIFICATION'
  | 'BOOKS_WORKPAPER'
  | 'DELIVERABLE'
  | 'LINEAGE'
  | 'MINERVA'
  | 'LEARNING';

export interface UniversityExamination {
  examinationId: string;
  tenantId: string;
  workspaceId: string | null;
  intakeId: string;
  name: string;
  tenantClassification: Exclude<UniversityTenantClassification, 'PRODUCTION_CUSTOMER'>;
  sourceType: string;
  documentIds: string[];
  stage: UniversityStage;
  result: UniversityResult;
  createdAt: string;
  updatedAt: string;
}

export interface UniversityWorkerExecution {
  executionId: string;
  examinationId: string;
  workerId: string;
  stage: UniversityStage;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  startedAt: string | null;
  completedAt: string | null;
  result: string | null;
}

export interface UniversityFailure {
  failureId: string;
  examinationId: string;
  stage: UniversityStage;
  rootCause: string | null;
  capabilityGap: string | null;
  status: 'OPEN' | 'REMEDIATING' | 'REPLAY_READY' | 'REGRESSION' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface UniversityRegression {
  regressionId: string;
  failureId: string;
  examinationId: string;
  status: UniversityResult;
  hiddenHoldoutId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UniversityOwnerRequest {
  requestId: string;
  requestingAgent: string;
  examinationIds: string[];
  observedProblem: string;
  frequency: number;
  materiality: string;
  toolsAttempted: string[];
  proposedCapability: string;
  expectedImprovement: string;
  securityPrivacyImplications: string;
  costResourceImplications: string;
  suggestedImplementation: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'OWNER_REVIEW' | 'APPROVED' | 'DECLINED' | 'IMPLEMENTED';
  ownerDecision: string | null;
  resultEvidence: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UniversityAuditRecord {
  auditId: string;
  action: string;
  actor: string;
  classifications: UniversityTenantClassification[];
  dryRun: boolean;
  counts: Record<string, number>;
  createdAt: string;
}

interface UniversityState {
  version: 1;
  examinations: UniversityExamination[];
  workerExecutions: UniversityWorkerExecution[];
  failures: UniversityFailure[];
  regressions: UniversityRegression[];
  ownerRequests: UniversityOwnerRequest[];
  schedulerDecisions: Array<{
    decisionId: string;
    examinationId: string | null;
    action: string;
    reason: string;
    createdAt: string;
  }>;
  audit: UniversityAuditRecord[];
}

const capabilityRows = [
  ['RAW_INPUT', 'Raw document intake'],
  ['EXTRACTION', 'Transaction-level extraction'],
  ['EVIDENCE', 'Evidence completeness'],
  ['CANONICALIZATION', 'Canonical accounting facts'],
  ['ACCOUNTING', 'Classification and posting'],
  ['RECONCILIATION', 'Applicable reconciliation'],
  ['CLARIFICATION', 'PBC and clarification'],
  ['BOOKS_WORKPAPER', 'Books and workpapers'],
  ['DELIVERABLE', 'Report wizard and deliverables'],
  ['LINEAGE', 'Forward and reverse lineage'],
  ['MINERVA', 'Independent sealed grading']
] as const;

function emptyState(): UniversityState {
  return {
    version: 1,
    examinations: [],
    workerExecutions: [],
    failures: [],
    regressions: [],
    ownerRequests: [],
    schedulerDecisions: [],
    audit: []
  };
}

function assertAcademyClassification(value: UniversityTenantClassification): asserts value is Exclude<UniversityTenantClassification, 'PRODUCTION_CUSTOMER'> {
  if (!UNIVERSITY_TENANT_CLASSIFICATIONS.includes(value)) throw new Error('UNIVERSITY_CLASSIFICATION_INVALID');
  if (value === 'PRODUCTION_CUSTOMER') throw new Error('UNIVERSITY_PRODUCTION_TENANT_REJECTED');
}

export class UniversityStore {
  readonly root: string;
  readonly file: string;

  constructor(root = process.env.EVE_UNIVERSITY_DIR || path.join(process.cwd(), 'storage', 'university')) {
    this.root = root;
    this.file = path.join(root, 'university-state.json');
  }

  read(): UniversityState {
    if (!fs.existsSync(this.file)) return emptyState();
    const state = JSON.parse(fs.readFileSync(this.file, 'utf8')) as UniversityState;
    if (state.version !== 1 || !Array.isArray(state.examinations) || !Array.isArray(state.workerExecutions) ||
      !Array.isArray(state.failures) || !Array.isArray(state.regressions) || !Array.isArray(state.ownerRequests) ||
      !Array.isArray(state.schedulerDecisions) || !Array.isArray(state.audit)) {
      throw new Error('UNIVERSITY_STATE_INVALID');
    }
    return state;
  }

  transaction<T>(mutate: (state: UniversityState) => T): T {
    fs.mkdirSync(this.root, { recursive: true, mode: 0o700 });
    const lock = path.join(this.root, 'write.lock');
    let lockFd: number;
    try {
      lockFd = fs.openSync(lock, 'wx', 0o600);
    } catch {
      throw new Error('UNIVERSITY_STATE_BUSY');
    }
    try {
      const state = this.read();
      const result = mutate(state);
      const temp = `${this.file}.${crypto.randomUUID()}.tmp`;
      const fd = fs.openSync(temp, 'wx', 0o600);
      try {
        fs.writeFileSync(fd, JSON.stringify(state, null, 2));
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }
      fs.renameSync(temp, this.file);
      const dirFd = fs.openSync(this.root, 'r');
      try { fs.fsyncSync(dirFd); } finally { fs.closeSync(dirFd); }
      return result;
    } finally {
      fs.closeSync(lockFd!);
      fs.unlinkSync(lock);
    }
  }

  registerAcademyIntake(params: {
    intakeId: string;
    tenantId?: string;
    name?: string;
    tenantClassification: UniversityTenantClassification;
    sourceType?: string;
    documentIds?: string[];
  }): UniversityExamination {
    assertAcademyClassification(params.tenantClassification);
    const tenantClassification = params.tenantClassification as Exclude<UniversityTenantClassification, 'PRODUCTION_CUSTOMER'>;
    if (!params.intakeId) throw new Error('UNIVERSITY_INTAKE_ID_REQUIRED');
    return this.transaction(state => {
      const existing = state.examinations.find(row => row.intakeId === params.intakeId);
      if (existing) return existing;
      const now = new Date().toISOString();
      const examination: UniversityExamination = {
        examinationId: `univ-exam-${crypto.randomUUID()}`,
        tenantId: params.tenantId || `academy-tenant-${crypto.randomUUID()}`,
        workspaceId: null,
        intakeId: params.intakeId,
        name: params.name?.trim().slice(0, 200) || 'Academy raw-input examination',
        tenantClassification,
        sourceType: params.sourceType?.trim().slice(0, 120) || 'UNCLASSIFIED_RAW_INPUT',
        documentIds: [...new Set(params.documentIds || [])],
        stage: 'INTAKE',
        result: 'RUNNING',
        createdAt: now,
        updatedAt: now
      };
      state.examinations.push(examination);
      state.schedulerDecisions.push({
        decisionId: `univ-decision-${crypto.randomUUID()}`,
        examinationId: examination.examinationId,
        action: 'ACADEMY_INTAKE_REGISTERED',
        reason: 'Authenticated Academy customer submitted raw input through the normal Documents intake.',
        createdAt: now
      });
      return examination;
    });
  }

  linkWorkspace(intakeId: string, workspaceId: string): UniversityExamination | null {
    if (!intakeId || !workspaceId) return null;
    return this.transaction(state => {
      const examination = state.examinations.find(row => row.intakeId === intakeId);
      if (!examination) return null;
      examination.workspaceId = workspaceId;
      examination.updatedAt = new Date().toISOString();
      return examination;
    });
  }

  inventoryPurge(classifications: UniversityTenantClassification[]) {
    const requested = [...new Set(classifications)];
    if (requested.includes('PRODUCTION_CUSTOMER')) throw new Error('UNIVERSITY_PURGE_PRODUCTION_REJECTED');
    requested.forEach(assertAcademyClassification);
    const state = this.read();
    const exams = state.examinations.filter(row => requested.includes(row.tenantClassification));
    const examIds = new Set(exams.map(row => row.examinationId));
    const failures = state.failures.filter(row => examIds.has(row.examinationId));
    const failureIds = new Set(failures.map(row => row.failureId));
    return {
      classifications: requested,
      counts: {
        examinations: exams.length,
        workerExecutions: state.workerExecutions.filter(row => examIds.has(row.examinationId)).length,
        failures: failures.length,
        regressions: state.regressions.filter(row => examIds.has(row.examinationId) || failureIds.has(row.failureId)).length,
        ownerRequests: state.ownerRequests.filter(row => row.examinationIds.some(id => examIds.has(id))).length,
        schedulerDecisions: state.schedulerDecisions.filter(row => row.examinationId && examIds.has(row.examinationId)).length
      },
      productionRecordsMatched: 0,
      scope: 'UNIVERSITY_CONTROL_STATE_ONLY'
    };
  }

  purge(params: { classifications: UniversityTenantClassification[]; dryRun: boolean; actor: string }) {
    const inventory = this.inventoryPurge(params.classifications);
    if (params.dryRun) return inventory;
    return this.transaction(state => {
      const examIds = new Set(state.examinations.filter(row => inventory.classifications.includes(row.tenantClassification)).map(row => row.examinationId));
      const failureIds = new Set(state.failures.filter(row => examIds.has(row.examinationId)).map(row => row.failureId));
      state.examinations = state.examinations.filter(row => !examIds.has(row.examinationId));
      state.workerExecutions = state.workerExecutions.filter(row => !examIds.has(row.examinationId));
      state.failures = state.failures.filter(row => !examIds.has(row.examinationId));
      state.regressions = state.regressions.filter(row => !examIds.has(row.examinationId) && !failureIds.has(row.failureId));
      state.ownerRequests = state.ownerRequests.filter(row => !row.examinationIds.some(id => examIds.has(id)));
      state.schedulerDecisions = state.schedulerDecisions.filter(row => !row.examinationId || !examIds.has(row.examinationId));
      state.audit.push({
        auditId: `univ-audit-${crypto.randomUUID()}`,
        action: 'ACADEMY_CONTROL_STATE_PURGED',
        actor: params.actor,
        classifications: inventory.classifications,
        dryRun: false,
        counts: inventory.counts,
        createdAt: new Date().toISOString()
      });
      return inventory;
    });
  }

  snapshot() {
    const state = this.read();
    const counts = (values: UniversityResult[]) => Object.fromEntries(values.map(result => [result, state.examinations.filter(row => row.result === result).length]));
    const activeWorkers = state.workerExecutions.filter(row => row.status === 'RUNNING' && row.startedAt && !row.completedAt);
    const queueDepth = state.workerExecutions.filter(row => row.status === 'QUEUED').length;
    const latestExecutionByWorker = new Map<string, UniversityWorkerExecution>();
    for (const execution of state.workerExecutions.slice().sort((a, b) => String(b.startedAt || '').localeCompare(String(a.startedAt || '')))) {
      if (!latestExecutionByWorker.has(execution.workerId)) latestExecutionByWorker.set(execution.workerId, execution);
    }
    const capabilities = capabilityRows.map(([capabilityId, name]) => {
      const stage = capabilityId === 'RAW_INPUT' ? 'INTAKE' : capabilityId;
      const related = state.examinations.filter(row => row.stage === stage || row.result !== 'UNTESTED');
      const physicalEvidence = state.workerExecutions.filter(row => row.stage === stage);
      const result: UniversityResult = physicalEvidence.some(row => row.status === 'FAILED') ? 'FAIL'
        : physicalEvidence.some(row => row.status === 'BLOCKED') ? 'BLOCKED'
        : physicalEvidence.some(row => row.status === 'COMPLETED') ? 'PASS'
        : physicalEvidence.some(row => row.status === 'RUNNING') ? 'RUNNING'
        : 'UNTESTED';
      return { capabilityId, name, result, examinations: related.length, physicalExecutions: physicalEvidence.length };
    });
    return {
      generatedAt: new Date().toISOString(),
      operatingModel: 'RAW_BOX_TO_BOOKS',
      tenantClassifications: UNIVERSITY_TENANT_CLASSIFICATIONS,
      overview: {
        examinations: state.examinations.length,
        active: state.examinations.filter(row => row.result === 'RUNNING').length,
        grading: state.examinations.filter(row => row.stage === 'MINERVA' && row.result === 'RUNNING').length,
        remediation: state.failures.filter(row => ['OPEN', 'REMEDIATING', 'REPLAY_READY'].includes(row.status)).length,
        results: counts(['PASS', 'CLARIFICATION_PASS', 'FAIL', 'BLOCKED']),
        regressions: state.regressions.length,
        regressionHealthy: state.regressions.filter(row => row.status === 'PASS').length,
        workersActive: activeWorkers.length,
        workersIdle: Math.max(0, latestExecutionByWorker.size - activeWorkers.length),
        queueDepth,
        ownerRequestsOpen: state.ownerRequests.filter(row => ['OPEN', 'OWNER_REVIEW'].includes(row.status)).length
      },
      liveExaminations: state.examinations.filter(row => row.result === 'RUNNING'),
      syntheticCustomers: state.examinations.map(row => ({
        tenantId: row.tenantId,
        workspaceId: row.workspaceId,
        examinationId: row.examinationId,
        name: row.name,
        classification: row.tenantClassification,
        result: row.result
      })),
      rawInputLab: state.examinations.map(row => ({
        examinationId: row.examinationId,
        intakeId: row.intakeId,
        sourceType: row.sourceType,
        documentCount: row.documentIds.length,
        stage: row.stage,
        result: row.result
      })),
      capabilityMatrix: capabilities,
      failuresRemediation: state.failures,
      regression: state.regressions,
      minerva: state.examinations.filter(row => row.stage === 'MINERVA' || ['PASS', 'CLARIFICATION_PASS', 'FAIL', 'BLOCKED'].includes(row.result)),
      workforce: [...latestExecutionByWorker.values()],
      hermes: {
        queueDepth,
        activeWorkers: activeWorkers.length,
        physicalExecutions: state.workerExecutions.length,
        decisions: state.schedulerDecisions.slice(-100).reverse(),
        idleReason: queueDepth === 0 && activeWorkers.length === 0 ? 'NO_ELIGIBLE_RECORDED_UNIVERSITY_WORK' : null
      },
      learningDarwin: state.failures.map(row => ({
        failureId: row.failureId,
        examinationId: row.examinationId,
        rootCause: row.rootCause,
        capabilityGap: row.capabilityGap,
        status: row.status,
        regressions: state.regressions.filter(regression => regression.failureId === row.failureId)
      })),
      curriculum: { retainedCases: state.examinations.length, sealedHoldouts: state.regressions.filter(row => row.hiddenHoldoutId).length },
      ownerRequests: state.ownerRequests,
      audit: state.audit.slice(-100).reverse()
    };
  }
}

export const universityStore = new UniversityStore();
