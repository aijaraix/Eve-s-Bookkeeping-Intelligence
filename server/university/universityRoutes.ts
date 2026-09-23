import { Router, type Request } from 'express';
import { UNIVERSITY_TENANT_CLASSIFICATIONS, universityStore, type UniversityTenantClassification } from './universityStore.js';
import { RAW_CONTINUATION_STAGES, rawInputHermesContinuationService } from '../cpaOrganization/rawInputHermesContinuation.js';
import { rawInputAccountingStageExecutor } from '../cpaOrganization/rawInputAccountingStageExecutor.js';

function isInternal(req: Request): boolean {
  const identityRole = (req as any).eveIdentity?.user?.role;
  const role = (req as any).user?.role || (req as any).user?.authorityRole;
  return ['OWNER', 'PLATFORM_ADMIN', 'INTERNAL_OPERATOR', 'INTERNAL_SERVICE', 'ACADEMY_SERVICE', 'SYSTEM_SERVICE'].includes(identityRole || role || '');
}

export function createUniversityRouter(): Router {
  const router = Router();
  router.use((req, res, next) => {
    if (process.env.NODE_ENV === 'test' || isInternal(req)) return next();
    return res.status(403).json({ error: 'UNIVERSITY_INTERNAL_ACCESS_REQUIRED' });
  });

  router.get('/overview', (_req, res) => {
    const snapshot = universityStore.snapshot();
    const rawContinuations = rawInputHermesContinuationService.getAllContinuations();
    return res.json({
      ...snapshot,
      hermes: {
        ...snapshot.hermes,
        supportedRawStages: RAW_CONTINUATION_STAGES,
        rawContinuations: rawContinuations.map(continuation => ({
          continuationId: continuation.continuationId,
          sourceQueueJobId: continuation.sourceQueueJobId,
          examinationId: continuation.examinationId,
          documentKind: continuation.documentKind,
          status: continuation.status,
          queued: continuation.executions.filter(execution => execution.status === 'QUEUED').length,
          running: continuation.executions.filter(execution => execution.status === 'RUNNING').length,
          physicalExecutions: continuation.executions.filter(execution => Boolean(execution.startedAt)).length,
          latestStage: continuation.executions.at(-1)?.stage || null,
          latestOutcome: continuation.executions.filter(execution => Boolean(execution.outcomeCode)).at(-1)?.outcomeCode || null,
        })),
      },
    });
  });
  router.post('/raw-continuations/:id/physical-proof', async (req, res) => {
    try {
      const productEvidenceRefs = Array.isArray(req.body?.productEvidenceRefs) ? req.body.productEvidenceRefs.map(String) : [];
      const deliverableEvidenceRefs = Array.isArray(req.body?.deliverableEvidenceRefs) ? req.body.deliverableEvidenceRefs.map(String) : [];
      if (!productEvidenceRefs.every((ref: string) => /^(browser|screenshot):/.test(ref)) ||
          !deliverableEvidenceRefs.every((ref: string) => /^(download|readback|artifact):/.test(ref))) {
        return res.status(422).json({ error: 'PHYSICAL_PROOF_REFERENCE_TYPE_INVALID' });
      }
      rawInputHermesContinuationService.recordPhysicalProof(req.params.id, { productEvidenceRefs, deliverableEvidenceRefs });
      const execution = await rawInputHermesContinuationService.dispatchNext({
        continuationId: req.params.id,
        supportedStages: ['MINERVA_GRADING'],
        executor: rawInputAccountingStageExecutor,
      });
      if (!execution) return res.status(409).json({ error: 'MINERVA_GRADING_NOT_QUEUED' });
      return res.json({ execution, continuation: rawInputHermesContinuationService.getContinuation(req.params.id) });
    } catch (error: any) {
      return res.status(409).json({ error: error.message });
    }
  });
  router.post('/purge/preview', (req, res) => {
    try {
      const classifications = Array.isArray(req.body?.classifications) ? req.body.classifications : [];
      if (classifications.some((value: string) => !UNIVERSITY_TENANT_CLASSIFICATIONS.includes(value as UniversityTenantClassification))) {
        return res.status(422).json({ error: 'UNIVERSITY_CLASSIFICATION_INVALID' });
      }
      return res.json(universityStore.purge({ classifications, dryRun: true, actor: String((req as any).user?.id || 'internal-operator') }));
    } catch (error: any) {
      return res.status(409).json({ error: error.message });
    }
  });
  return router;
}
