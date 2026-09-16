import assert from 'node:assert/strict';
import { createCPAOrganizationRouter } from '../cpaOrganization/cpaOrganizationRoutes.js';
import { hermesHeartbeat } from '../cpaOrganization/hermesHeartbeat.js';

function routeHandler(path: string, method: 'get' | 'post') {
  const router = createCPAOrganizationRouter();
  const layer = (router as any).stack.find((entry: any) => entry.route?.path === path && entry.route?.methods?.[method]);
  const handler = layer?.route?.stack?.[0]?.handle;
  if (!handler) throw new Error(`ROUTE_HANDLER_NOT_FOUND:${method.toUpperCase()} ${path}`);
  return handler;
}

function mockReqRes(params: { body?: any; query?: any; params?: any; user?: any }) {
  const req: any = {
    body: params.body || {},
    query: params.query || {},
    params: params.params || {},
    user: params.user,
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
  };
  let statusCode = 200;
  let payload: any;
  const res: any = {
    status(code: number) { statusCode = code; return res; },
    json(data: any) { payload = data; return res; },
    get statusCode() { return statusCode; },
    get payload() { return payload; },
  };
  return { req, res };
}

const evaluate = routeHandler('/evidence-sufficiency/evaluate', 'post');

// Unauthenticated requests cannot create evidence decisions.
{
  const { req, res } = mockReqRes({ body: {} });
  await evaluate(req, res);
  assert.equal(res.statusCode, 401);
  assert.match(String(res.payload?.error || ''), /UNAUTHENTICATED/);
}

const internalUser = {
  id: 'p1-009-internal-operator',
  sessionId: 'session-p1-009',
  role: 'INTERNAL_OPERATOR',
  claims: ['INTERNAL_OPERATOR'],
  isHuman: true,
};

// A requested document with no saved completeness record becomes an unknown-impact gap.
{
  const { req, res } = mockReqRes({
    user: internalUser,
    body: {
      persist: false,
      documentIds: ['doc-completeness-not-recorded'],
      task: {
        taskId: 'task-route-cash',
        taskType: 'BANK_BALANCE_VERIFICATION',
        purpose: 'Establish ending cash.',
        availableCapabilities: ['BANK_ENDING_BALANCE'],
        conclusions: [{ conclusionId: 'cash', label: 'Ending cash', requiredCapabilities: ['BANK_ENDING_BALANCE'] }],
      },
    },
  });
  await evaluate(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload?.success, true);
  assert.equal(res.payload?.decision?.sourceCompletenessState, 'SOURCE_GAP_UNKNOWN_MATERIALITY');
  assert.equal(res.payload?.decision?.taskEvidenceSufficiencyState, 'REVIEW_REQUIRED_TO_DETERMINE_MATERIALITY');
  assert.ok(res.payload?.decision?.gaps?.some((g: any) => g.gapId === 'gap-completeness-record-missing-doc-completeness-not-recorded'));
}

// Explicit material transaction gap blocks only the affected conclusion.
{
  const { req, res } = mockReqRes({
    user: internalUser,
    body: {
      persist: false,
      task: {
        taskId: 'task-route-mixed',
        taskType: 'MIXED_REVIEW',
        purpose: 'Establish ending cash and reconstruct transactions.',
        availableCapabilities: ['BANK_ENDING_BALANCE', 'TRANSACTION_LEDGER'],
        conclusions: [
          { conclusionId: 'cash', label: 'Ending cash', requiredCapabilities: ['BANK_ENDING_BALANCE'] },
          { conclusionId: 'ledger', label: 'Complete transaction ledger', requiredCapabilities: ['TRANSACTION_LEDGER'], requiresCompletePopulation: true },
        ],
      },
      gaps: [{
        gapId: 'gap-route-transactions',
        gapType: 'MISSING_TRANSACTION_RANGE',
        description: 'Transaction pages are missing.',
        affectedCapabilities: ['TRANSACTION_LEDGER'],
        evidenceRefs: ['page-sequence'],
        signals: { continuity: 'BROKEN', reconciliation: 'FAIL', structuralRelevance: 'RELEVANT_TO_TASK' },
      }],
    },
  });
  await evaluate(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload?.decision?.allowedConclusionIds, ['cash']);
  assert.deepEqual(res.payload?.decision?.blockedConclusionIds, ['ledger']);
  assert.equal(res.payload?.decision?.recommendedAction, 'REQUEST_ADDITIONAL_EVIDENCE');
}

hermesHeartbeat.stopHeartbeat();
console.log('TASK_EVIDENCE_SUFFICIENCY_ROUTES_TESTS=PASS');
// The full CPA router imports several long-lived runtime services by design.
// All route assertions above are awaited; exit explicitly so this isolated contract test
// cannot be held open by unrelated production heartbeat/timer handles.
process.exit(0);
