# EVE BOOKKEEPING — WORK / CODEX / ASTRA ULTRA MASTER DIRECTIVE

**Status:** CONTINUATION — DO NOT RESTART
**Repository:** `aijaraix/Eve-s-Bookkeeping-Intelligence`
**Baseline when this package was created:** `0509c73f68a1dfc722529d3e333993bbf137c489`
**Owner objective:** finish the existing Eve Bookkeeping system with the least owner reconfiguration possible, prove it physically, and hand back a decision-usable production state.

## 1. Governing instruction

This is an existing implementation. Do not rebuild it from scratch, replace working infrastructure for convenience, create duplicate services, rotate working credentials, erase state, or ask the owner to repeat configuration already present.

Before any mutation, establish CURRENT physical truth. Fetch current remote state, inspect current deployments and runtime configuration, identify legitimate work newer than this document, and preserve it. The SHA above is a historical handoff baseline, not permission to roll back newer work.

## 2. Roles

### Work
Orchestrate the task across available repositories, deployment systems, logs, services and connected tools. Maintain continuity and stop the owner only for genuinely owner-only approvals.

### Codex
Act as implementation and verification engineer. Inspect before editing; make the smallest safe repairs; test; deploy where authorized; verify the physical runtime; preserve evidence.

### Astra Ultra
Act as independent systems auditor. Do not merely accept Codex's report. Attempt to falsify READY by inspecting actual evidence and searching for gaps, mocks, fallbacks, deployment drift, persistence failures, hidden manual steps, queue loss, duplicate authority and product-level incompleteness.

### Owner
The owner should primarily approve unavoidable authorization, destructive/high-impact actions, new spending, genuinely missing secrets, or material business decisions. Do not turn ordinary engineering work into owner homework.

## 3. Non-negotiable preservation rules

- DO NOT restart the project.
- DO NOT roll back legitimate newer work to the baseline SHA.
- DO NOT expose, print, commit, copy into reports, or request secrets that already exist in a secure environment.
- DO NOT create replacement credentials merely because the current credential is not visible to the agent.
- DO NOT rebuild an integration before proving the existing path is unusable.
- DO NOT create duplicate schedulers, workers, queues, databases, gateways, model services or deployment projects.
- DO NOT destroy customer/accounting evidence or prior failed-run evidence.
- DO NOT represent AI-prepared accounting work as licensed CPA certification without the required authorized human professional approval.
- DO NOT arm Academy or autonomous production behavior merely to make a test pass; respect current gates and authorization state.
- DO NOT declare READY from source-code tests alone.

## 4. Required execution order

1. **Discover current truth.** Fetch remote HEAD; inspect recent commits/PRs; identify deployed SHA/build; inspect running services, health, persistent storage, queues, scheduler authority, worker topology, model endpoints, databases and relevant environment configuration without revealing secret values.
2. **Reconcile state.** Build a source-vs-runtime matrix. Classify every material mismatch as intentional, stale deployment, configuration gap, credential gap, code gap, persistence gap or unknown.
3. **Preserve and repair.** Keep legitimate newer work. Repair only proven gaps. Prefer the existing architecture and credentials.
4. **Deploy/restart only as required.** Use normal deployment paths. Record the resulting immutable source/build identity.
5. **Run physical acceptance.** Exercise the real runtime and persistence paths, not only mocks or local fixtures.
6. **Astra independent challenge.** Astra reviews evidence and actively searches for reasons the system is not production-operational.
7. **Close gaps and repeat.** Codex repairs validated gaps; Astra re-tests affected acceptance gates.
8. **Final handoff.** Return READY only when the acceptance specification is satisfied. Otherwise return NOT READY with the smallest actionable blocker list and exact owner-only actions, if any.

## 5. Gap taxonomy

Every unresolved issue must be assigned one or more of these types: CODE, CONFIGURATION, CREDENTIAL, DEPLOYMENT, PERSISTENCE, AUTHORITY, QUEUE, MODEL, FALLBACK, OBSERVABILITY, AUTONOMY, SECURITY/SAFETY, ACCOUNTING-PRODUCT, OWNER-ONLY.

## 6. Definition of finished for this activation phase

Eve Bookkeeping is READY only when a real authorized company can enter the intended canonical workflow; its source records and derived work survive persistence; the intended scheduler/queue/worker topology processes work exactly once or with documented idempotent retry behavior; the intended real model path executes where required; results retain evidence/lineage; owner-facing retrieval works; restart/redeploy does not silently lose required state; no unauthorized mock/local/deterministic fallback is being presented as real model work; observability can prove what happened; and all professional-review gates remain truthful.

READY does not mean every future feature is complete. It means the currently authorized production scope is physically operational, durable, observable and truthful.

## 7. Evidence standard

For each acceptance gate record: timestamp, source/deployed identity, command/request or test identity, sanitized output/result, persistent object/record identifier where applicable, pass/fail, and remediation if failed. Never include secret values.

## 8. Final status vocabulary

Use exactly one final status:

- `EVE_BOOKKEEPING_READY_FOR_OWNER_HANDOFF`
- `EVE_BOOKKEEPING_NOT_READY`

If NOT READY, distinguish owner-only blockers from agent-remediable blockers. Do not stop merely because an agent-remediable blocker exists.