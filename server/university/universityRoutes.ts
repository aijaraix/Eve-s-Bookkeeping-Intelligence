import { Router, type Request } from 'express';
import { UNIVERSITY_TENANT_CLASSIFICATIONS, universityStore, type UniversityTenantClassification } from './universityStore.js';

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

  router.get('/overview', (_req, res) => res.json(universityStore.snapshot()));
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
