/**
 * EVE AUTONOMOUS CPA ORGANIZATION — EXPRESS API ROUTES
 * 
 * Exposes endpoints for managing the 13 Named CPA Agents, dynamic swarms,
 * Model Router telemetry, Minerva evaluation lab, Darwin evolution log,
 * persistent memory inspector, skills registry, and Hermes heartbeat.
 */

import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { cpaAgentRegistry } from './cpaAgentRegistry.js';
import { cpaModelRouter } from './cpaModelRouter.js';
import { persistentAgentMemory } from './persistentMemory.js';
import { skillsRegistry } from './skillsRegistry.js';
import { academyMinervaLab } from './academyMinervaLab.js';
import { darwinEvolutionLoop } from './darwinEvolutionLoop.js';
import { hermesHeartbeat } from './hermesHeartbeat.js';
import { hermesPrimeAcademyEngine } from './hermesPrimeAcademyEngine.js';
import { renderRegistryService } from './renderRegistryService.js';

export function createCPAOrganizationRouter(): Router {
  const router = Router();

  // 1. Named CPA Agents
  router.get('/agents', (req: Request, res: Response) => {
    const agents = cpaAgentRegistry.getAllAgents();
    res.json({ agents, total: agents.length });
  });

  router.get('/agents/:agentId', (req: Request, res: Response) => {
    const agent = cpaAgentRegistry.getAgent(req.params.agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({ agent });
  });

  // 2. Dynamic Swarms
  router.get('/swarms', (req: Request, res: Response) => {
    const swarms = cpaAgentRegistry.getAllSwarms();
    res.json({ swarms, total: swarms.length });
  });

  router.post('/specialist/spawn', (req: Request, res: Response) => {
    const { topic, customTitle, targetWorkspaceId } = req.body || {};
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    const specialist = cpaAgentRegistry.spawnTemporarySpecialist({
      topic,
      customTitle,
      targetWorkspaceId
    });
    res.json({ specialist });
  });

  router.post('/swarms/:swarmId/dispatch', (req: Request, res: Response) => {
    try {
      const { workspaceId, workspaceFacts } = req.body || {};
      const result = cpaAgentRegistry.dispatchSwarm({
        swarmId: req.params.swarmId,
        workspaceId: workspaceId || 'ws-default',
        workspaceFacts: workspaceFacts || []
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Failed to dispatch swarm' });
    }
  });

  router.post('/agents/:agentId/learning-case', (req: Request, res: Response) => {
    const { context, observedDefect, rootCause, remedyApplied, verifiedBy } = req.body || {};
    if (!observedDefect || !remedyApplied) {
      return res.status(400).json({ error: 'observedDefect and remedyApplied are required' });
    }
    const lc = cpaAgentRegistry.addLearningCase(req.params.agentId, {
      context: context || 'Production Execution',
      observedDefect,
      rootCause: rootCause || 'Root-cause analysis',
      remedyApplied,
      verifiedBy: verifiedBy || 'SENTINEL'
    });
    if (!lc) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({ learningCase: lc });
  });

  router.post('/agents/:agentId/metrics', (req: Request, res: Response) => {
    const { jobsCompleted, success, escalated } = req.body || {};
    cpaAgentRegistry.updateAgentMetrics(req.params.agentId, { jobsCompleted, success, escalated });
    const agent = cpaAgentRegistry.getAgent(req.params.agentId);
    res.json({ agent });
  });

  // 3. Model Router Telemetry
  router.get('/router/telemetry', (req: Request, res: Response) => {
    const telemetry = cpaModelRouter.getTelemetry();
    res.json({ telemetry });
  });

  router.post('/router/route', (req: Request, res: Response) => {
    const { taskId, taskType, contextComplexity } = req.body || {};
    if (!taskType) {
      return res.status(400).json({ error: 'taskType is required' });
    }
    const decision = cpaModelRouter.routeTask({
      taskId: taskId || `task-${Date.now()}`,
      taskType,
      contextComplexity
    });
    res.json({ decision });
  });

  // 4. Minerva Academy & Evaluation Lab
  router.get('/academy/evaluations', (req: Request, res: Response) => {
    const evaluations = academyMinervaLab.getEvaluationHistory();
    const benchmarks = academyMinervaLab.getSealedCorpusSummary();
    res.json({ evaluations, benchmarks });
  });

  router.post('/academy/run-eval', (req: Request, res: Response) => {
    const report = academyMinervaLab.runEvaluation();
    res.json({ report });
  });

  // 5. Darwin Evolution Loop
  router.get('/darwin/evolution-log', (req: Request, res: Response) => {
    const proposals = darwinEvolutionLoop.getAllProposals();
    res.json({ proposals, total: proposals.length });
  });

  router.post('/darwin/propose', (req: Request, res: Response) => {
    const { sourceDefect, affectedSkillId, rootCauseAnalysis, proposedEnhancement } = req.body || {};
    if (!sourceDefect || !affectedSkillId || !proposedEnhancement) {
      return res.status(400).json({ error: 'Missing required proposal fields' });
    }
    const proposal = darwinEvolutionLoop.analyzeDefectAndPropose({
      sourceDefect,
      affectedSkillId,
      rootCauseAnalysis: rootCauseAnalysis || 'Automated defect analysis',
      proposedEnhancement
    });
    res.json({ proposal });
  });

  // 6. Persistent Memory Inspector
  router.get('/memory/:agentId', (req: Request, res: Response) => {
    const memories = persistentAgentMemory.getAgentMemories(req.params.agentId);
    res.json({ agentId: req.params.agentId, memories, total: memories.length });
  });

  router.get('/memory', (req: Request, res: Response) => {
    const memories = persistentAgentMemory.getAllMemories();
    res.json({ memories, total: memories.length });
  });

  router.post('/memory', (req: Request, res: Response) => {
    const { namespace, type, key, value, tags, confidence } = req.body || {};
    if (!namespace || !type || !key || value === undefined) {
      return res.status(400).json({ error: 'namespace, type, key, and value are required' });
    }
    const memory = persistentAgentMemory.store({
      namespace,
      type,
      key,
      value,
      tags: tags || [],
      confidence: typeof confidence === 'number' ? confidence : 0.95
    });
    res.json({ memory });
  });

  // 7. Skills & Tools Registry
  router.get('/skills', (req: Request, res: Response) => {
    const skills = skillsRegistry.getAllSkills();
    res.json({ skills, total: skills.length });
  });

  router.post('/skills/execute', (req: Request, res: Response) => {
    const { skillId, agentId, input } = req.body || {};
    if (!skillId || !agentId) {
      return res.status(400).json({ error: 'skillId and agentId are required' });
    }
    const result = skillsRegistry.executeSkill({
      skillId,
      agentId,
      input: input || {}
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // 8. Hermes Heartbeat & Infrastructure Health
  router.get('/heartbeat/status', async (req: Request, res: Response) => {
    const status = await hermesHeartbeat.getStatus();
    res.json({ status });
  });

  // 9. Agent Aliases Reconciliation Mapping
  router.get('/aliases', (req: Request, res: Response) => {
    const mapping = cpaAgentRegistry.getAliasesMapping();
    res.json({ success: true, mapping, count: mapping.length });
  });

  // 10. Real Hermes Swarm Job Execution
  router.post('/hermes/execute-job', (req: Request, res: Response) => {
    const { objective, workspaceId, facts } = req.body || {};
    const result = cpaAgentRegistry.executeHermesJob({
      objective: objective || 'Reconcile FY2024 Audited Financial Statements and Verify Cryptographic Lineage',
      workspaceId: workspaceId || 'ws-audit-primary',
      facts: facts || []
    });
    res.json(result);
  });

  // 11. Customer Preemption Demonstration
  router.post('/preemption/test', (req: Request, res: Response) => {
    const result = hermesHeartbeat.runPreemptionDemonstration();
    res.json(result);
  });

  // 12. Phase H.9.13 — 24-Hour Evolution Report
  router.get('/academy/24hr-report', (req: Request, res: Response) => {
    const report = hermesPrimeAcademyEngine.generate24HourEvolutionReport();
    res.json({ success: true, report });
  });

  // 13. Phase H.9.13 — Trigger Academy Cycle
  router.post('/academy/cycle', async (req: Request, res: Response) => {
    try {
      const { caseId } = req.body || {};
      const result = await hermesPrimeAcademyEngine.executeAcademyCycle(caseId);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Academy cycle failed' });
    }
  });

  // 14. Phase H.9.13 — Curriculum Coverage Matrix
  router.get('/academy/curriculum', (req: Request, res: Response) => {
    const coverage = hermesPrimeAcademyEngine.getCurriculumCoverage();
    const benchmarks = hermesPrimeAcademyEngine.getSealedGroundTruthsSummary();
    res.json({ success: true, coverage, benchmarks });
  });

  // 15. Phase H.9.13 — Render Registry Renders
  router.get('/render-registry/renders', (req: Request, res: Response) => {
    const renders = renderRegistryService.getAllRenders();
    res.json({ success: true, renders, count: renders.length });
  });

  // 16. Phase H.9.13 — Register Render Element
  router.post('/render-registry/register', (req: Request, res: Response) => {
    const entry = req.body;
    if (!entry || !entry.factLineageId || !entry.displayValue) {
      return res.status(400).json({ error: 'factLineageId and displayValue are required' });
    }
    const renderId = renderRegistryService.registerRender(entry);
    res.json({ success: true, renderId });
  });

  // 17. Phase H.9.13 — Bidirectional Lineage Traces
  router.get('/render-registry/trace/source/:factLineageId', (req: Request, res: Response) => {
    const traces = renderRegistryService.traceSourceToRender(req.params.factLineageId);
    res.json({ success: true, factLineageId: req.params.factLineageId, renders: traces });
  });

  router.get('/render-registry/trace/render/:renderId', (req: Request, res: Response) => {
    const result = renderRegistryService.traceRenderToSource(req.params.renderId);
    res.json({ success: true, renderId: req.params.renderId, ...result });
  });

  // 18. Phase H.9.13 — UI / Backend Differential Comparison
  router.post('/render-registry/differential', (req: Request, res: Response) => {
    const { engagementId, canonicalFacts, renderedElements } = req.body || {};
    if (!canonicalFacts || !renderedElements) {
      return res.status(400).json({ error: 'canonicalFacts and renderedElements arrays required' });
    }
    const report = renderRegistryService.compareBackendToUI({
      engagementId: engagementId || 'eng-diff-eval',
      canonicalFacts,
      renderedElements
    });
    res.json({ success: true, report });
  });

  // 19. Phase H.9.15 — Canary Case Execution Result
  router.get('/academy/canary-result', (req: Request, res: Response) => {
    try {
      const storageDir = process.env.HERMES_PERSISTENT_DATA_DIR || 
        (fs.existsSync('/opt/data') ? '/opt/data/cpa_organization' : path.join(process.cwd(), 'storage', 'cpa_memory'));
      const canaryPath = path.join(storageDir, 'canary_run_result.json');
      if (fs.existsSync(canaryPath)) {
        const raw = fs.readFileSync(canaryPath, 'utf-8');
        return res.json({ success: true, result: JSON.parse(raw) });
      }
      res.json({ success: false, message: 'No canary result found yet.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 20. Phase H.9.16 — Download Audit Report
  router.get('/audit-report/download', (req: Request, res: Response) => {
    try {
      const format = String(req.query.format || 'html').toLowerCase();
      let filename = 'PHASE_H916_AUDIT_REPORT.html';
      let contentType = 'text/html; charset=utf-8';

      if (format === 'md' || format === 'markdown') {
        filename = 'PHASE_H916_AUDIT_REPORT.md';
        contentType = 'text/markdown; charset=utf-8';
      } else if (format === 'json') {
        filename = 'PHASE_H916_AUDIT_REPORT.json';
        contentType = 'application/json; charset=utf-8';
      }

      const filePath = path.join(process.cwd(), 'public', 'reports', filename);
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.sendFile(filePath);
      }
      res.status(404).json({ error: 'Report file not found' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
