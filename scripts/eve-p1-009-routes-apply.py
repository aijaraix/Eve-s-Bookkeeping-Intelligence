from pathlib import Path

p = Path('server/cpaOrganization/cpaOrganizationRoutes.ts')
text = p.read_text()

old_import = "import { solverExecutionRegistry } from './solverExecutionRegistry.js';\n"
new_import = """import { solverExecutionRegistry } from './solverExecutionRegistry.js';
import { deepDocumentIntelligence } from './deepDocumentIntelligenceEngine.js';
import { taskEvidenceSufficiencyEngine, type SourceEvidenceGap } from './taskEvidenceSufficiencyEngine.js';
"""
if old_import not in text:
    raise SystemExit('P1_009_ROUTE_IMPORT_TARGET_NOT_FOUND')
text = text.replace(old_import, new_import, 1)

marker = """  return router;\n}\n"""
routes = r'''
  // 35. Source Completeness vs Task Evidence Sufficiency (P1-009)
  router.post('/evidence-sufficiency/evaluate', async (req: Request, res: Response) => {
    try {
      const authContext = await resolveServerAuthContext(req);
      if (!authContext.authenticatedPrincipalId) {
        return res.status(401).json({ error: 'UNAUTHENTICATED: Evidence sufficiency evaluation requires authenticated server context.' });
      }
      if (!authContext.isInternalOperator) {
        return res.status(403).json({ error: 'FORBIDDEN: Evidence sufficiency evaluation requires internal operator authority.' });
      }

      const { task, gaps, documentIds, persist } = req.body || {};
      if (!task?.taskId || !task?.purpose || !Array.isArray(task?.conclusions) || task.conclusions.length === 0) {
        return res.status(400).json({ error: 'A defined task with at least one conclusion is required.' });
      }

      const requestedDocumentIds = [...new Set((Array.isArray(documentIds) ? documentIds : []).map((id: any) => String(id).trim()).filter(Boolean))];
      const completenessRecords: any[] = [];
      const unresolvedElements: any[] = [];
      const missingCompletenessGaps: SourceEvidenceGap[] = [];

      for (const documentId of requestedDocumentIds) {
        const record = deepDocumentIntelligence.getCompletenessRecord(documentId);
        if (record) {
          completenessRecords.push(record);
          unresolvedElements.push(...deepDocumentIntelligence.getUnresolvedElements(documentId));
        } else {
          missingCompletenessGaps.push({
            gapId: `gap-completeness-record-missing-${documentId}`,
            sourceArtifactId: documentId,
            gapType: 'OTHER',
            description: `No saved source-completeness record exists for requested document ${documentId}.`,
            affectedCapabilities: [],
            explicitMateriality: 'UNKNOWN',
            materialityBasis: 'The document was requested for task evaluation but its completeness state is not established.',
            evidenceRefs: [documentId],
            signals: { structuralRelevance: 'UNKNOWN', continuity: 'UNKNOWN', reconciliation: 'NOT_RUN' }
          });
        }
      }

      const decision = taskEvidenceSufficiencyEngine.evaluate({
        task,
        gaps: [...(Array.isArray(gaps) ? gaps : []), ...missingCompletenessGaps],
        completenessRecords,
        unresolvedElements,
        persist: persist !== false,
      });

      return res.json({
        success: true,
        decision,
        completenessRecordsUsed: completenessRecords.map(r => ({ documentId: r.documentId, recordId: r.recordId, completionStatus: r.completionStatus, overallCoverage: r.overallCoverage })),
        unresolvedElementsUsed: unresolvedElements.map(u => u.unresolvedId),
        requestedDocumentIds,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Evidence sufficiency evaluation failed.' });
    }
  });

  router.get('/evidence-sufficiency/decisions', async (req: Request, res: Response) => {
    const authContext = await resolveServerAuthContext(req);
    if (!authContext.authenticatedPrincipalId) {
      return res.status(401).json({ error: 'UNAUTHENTICATED: Evidence sufficiency decisions require authenticated server context.' });
    }
    if (!authContext.isInternalOperator) {
      return res.status(403).json({ error: 'FORBIDDEN: Evidence sufficiency decisions require internal operator authority.' });
    }
    const decisions = taskEvidenceSufficiencyEngine.listDecisions({
      workspaceId: req.query.workspaceId ? String(req.query.workspaceId) : undefined,
      engagementId: req.query.engagementId ? String(req.query.engagementId) : undefined,
      taskId: req.query.taskId ? String(req.query.taskId) : undefined,
    });
    return res.json({ success: true, decisions, total: decisions.length });
  });

  router.get('/evidence-sufficiency/decisions/:decisionId', async (req: Request, res: Response) => {
    const authContext = await resolveServerAuthContext(req);
    if (!authContext.authenticatedPrincipalId) {
      return res.status(401).json({ error: 'UNAUTHENTICATED: Evidence sufficiency decision requires authenticated server context.' });
    }
    if (!authContext.isInternalOperator) {
      return res.status(403).json({ error: 'FORBIDDEN: Evidence sufficiency decision requires internal operator authority.' });
    }
    const decision = taskEvidenceSufficiencyEngine.getDecision(String(req.params.decisionId || ''));
    if (!decision) return res.status(404).json({ error: 'Evidence sufficiency decision not found.' });
    return res.json({ success: true, decision });
  });

'''
if marker not in text:
    raise SystemExit('P1_009_ROUTE_INSERT_TARGET_NOT_FOUND')
text = text.replace(marker, routes + marker, 1)
p.write_text(text)
print('P1_009_ROUTES_PATCH_APPLIED=YES')
