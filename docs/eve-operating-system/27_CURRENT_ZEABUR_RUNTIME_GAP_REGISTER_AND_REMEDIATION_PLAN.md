# 27 — Current Zeabur Physical Runtime Gap Register & Remediation Plan

**Status:** Authoritative current-gap register based on independent read-only SentinelX observation of the Eve Bookkeeping Zeabur host. This document records observed physical reality and required closure evidence. It does **not** authorize mutation by itself.

**Observed host label:** `eve-bookkeeping-prod-ai`

**Observation basis:** read-only SentinelX inspection of host processes, K3s pods/services/PVCs, persistent state metadata, current heartbeat/worker files, and selected production source/runtime artifacts.

## Purpose

This register exists because recent Google/Gemini reports described H.9.42/H.9.43 production capabilities that were not yet physically corroborated on the Zeabur runtime. The goal is to convert that ambiguity into explicit repair work with objective closure gates.

A gap is not closed because code exists, documentation says PASS, or a preview environment works. A gap closes only when the physical authoritative runtime satisfies the required proof.

---

## P0 / P1 summary

### ZR-001 — Environment/runtime divergence

**Severity:** P0

**Observed reality:** Recent application reports claimed newer autonomous production components and H.9.43 readiness, while the physically observed Zeabur Hermes/worker runtime still showed older daemon/worker artifacts and no H.9.41/H.9.42/H.9.43 state/artifact names in the inspected persistent volumes.

**Risk:** Google/AI Studio/preview implementation may be mistaken for deployed Zeabur production.

**Required remediation:** Implement Document 23 Runtime Authority Manifest; deploy intended production artifacts to the declared services; expose runtime fingerprints.

**Closure proof:** running Zeabur service fingerprints trace to the intended Git commit/build/image; pod/process rollout evidence exists; SentinelX corroborates.

---

### ZR-002 — Hermes heartbeat records intention without dispatch

**Severity:** P0

**Observed reality:** The persistent `hermes_autonomous_daemon.mjs` currently updates `heartbeat_state.json`, sets `lastDecision.action = START_NEW_CASE`, and saves state, but the inspected daemon code contains no real engagement-dispatch call in that path.

**Risk:** Dashboard/telemetry can represent intended work as if autonomous work is occurring.

**Required remediation:** Replace/retire the state-writer-only scheduler path; connect heartbeat evaluation to the one canonical production dispatch service; persist real dispatch IDs and consumer acknowledgements.

**Closure proof:** heartbeat tick → scheduler evaluation → real dispatchId/jobId → Hermes/consumer execution → state transition, all on Zeabur.

---

### ZR-003 — Potential duplicate scheduler/daemon ownership

**Severity:** P0

**Observed reality:** At least two host-visible `node /opt/data/cpa_organization/hermes_autonomous_daemon.mjs` processes were observed. Ownership by pod/service must be resolved before change; duplicate processes may be intentional replicas or an unintended duplicate scheduler.

**Risk:** double dispatch, race conditions, lost heartbeat writes, conflicting locks, misleading cadence.

**Required remediation:** map each daemon to pod/service; establish exactly one scheduler leader using lease/fencing semantics; standby instances may observe but not dispatch.

**Closure proof:** one active leader for the scheduling domain; other instances cannot dispatch; lease owner is visible and tested.

---

### ZR-004 — Heartbeat cadence mismatch

**Severity:** P1

**Observed reality:** Recent reports referenced a 15-second heartbeat, while the physically inspected daemon uses a 30,000 ms interval and writes `nextHeartbeatAt` at +30 seconds.

**Risk:** documentation/runtime drift and misleading self-start expectations.

**Required remediation:** make cadence configuration-driven; expose configured and observed cadence; remove conflicting hardcoded values.

**Closure proof:** runtime fingerprint/config and observed physical timestamps agree.

---

### ZR-005 — Production worker is physically shallow

**Severity:** P0

**Observed reality:** The physically observed Eve Intelligence worker implementation performs regex extraction for a small fixed set of headline metrics rather than full Universal Document IR/deep extraction.

**Risk:** real customer uploads can bypass the document-intelligence architecture and produce shallow facts while appearing complete.

**Required remediation:** deploy the actual production Document Intelligence/Universal IR worker path defined by Documents 02, 19, 21, and 24. Keep any regex extractor only as a bounded low-authority fallback.

**Closure proof:** real browser upload creates a worker job that processes the full source into IR, observations, DataPoints, relationships, assertions, verified/canonical objects with source-side completeness tests.

---

### ZR-006 — Worker source injected dynamically at runtime

**Severity:** P1

**Observed reality:** The host process list showed a Node bootstrap command carrying a large encoded source payload that writes `/storage/worker.mjs` before importing it.

**Risk:** poor build provenance, difficult rollback/reconciliation, runtime source mutation, inability to tie execution cleanly to Git/image digest.

**Required remediation:** package worker source in an immutable versioned image/artifact; remove source injection from startup.

**Closure proof:** running worker code is part of the image/build artifact and runtime fingerprint maps to Git commit/image digest.

---

### ZR-007 — Worker accepts weak document identity

**Severity:** P0

**Observed reality:** Existing persisted worker history contains a completed test job whose `documentHash` is empty. The current worker contract allows missing hash values.

**Risk:** broken source custody and inability to prove which physical artifact produced facts.

**Required remediation:** require source artifact/document hash before production extraction or use an explicit pre-hash state that cannot promote downstream.

**Closure proof:** missing-hash production job is rejected/blocked; full hash continuity passes on a real upload.

---

### ZR-008 — Worker contains unsafe period/scale shortcuts

**Severity:** P0

**Observed reality:** The physically inspected worker contains a fixed `2026-FY` reporting period and a magnitude/header heuristic that can multiply values by one million.

**Risk:** period and scale errors can become authoritative-looking facts.

**Required remediation:** derive period, unit, and scale from source evidence/context; unresolved context remains review-required; magnitude alone cannot decide scale.

**Closure proof:** multi-period/multi-scale negative tests and real-source tests demonstrate evidence-backed period/scale lineage.

---

### ZR-009 — Worker validation can overstate success

**Severity:** P0

**Observed reality:** The current results route returns a validation object with `status: PASS` independent of deep source-side completeness.

**Risk:** shallow extraction can be represented as verified completion.

**Required remediation:** remove unconditional PASS semantics; validation must consume independent evidence and proof levels.

**Closure proof:** known shallow/fragment test produces qualified/failed completeness rather than PASS.

---

### ZR-010 — H.9.42/H.9.43 physical artifacts not found in inspected Zeabur persistence

**Severity:** P0

**Observed reality:** Read-only searches of the visible K3s persistent storage did not find H.9.41/H.9.42/H.9.43 named handoff/audit/learning artifacts.

**Risk:** those phases may have executed in another environment while being described as Zeabur production.

**Required remediation:** identify actual environment of each prior evidence artifact; deploy current implementation to declared runtime; do not copy historical evidence into Zeabur and relabel it as if executed there.

**Closure proof:** future Zeabur-generated execution objects carry environment/runtime fingerprints and physical timestamps.

---

### ZR-011 — Deployment age does not corroborate recent production-change claims

**Severity:** P0

**Observed reality:** The active Eve pods/deployments observed by SentinelX had been running from approximately September 4–6 with zero restarts, despite later reports claiming major runtime replacements.

**Risk:** code changes may never have been rolled into these services.

**Required remediation:** perform explicit production rollout under Document 26 and record image/pod/runtime fingerprint changes.

**Closure proof:** new pod/instance identity and image digest correspond to the intended release.

---

### ZR-012 — Runtime commit/build provenance missing

**Severity:** P1

**Observed reality:** The running Zeabur services do not yet expose sufficiently reliable source commit/build identity for independent comparison with GitHub.

**Risk:** impossible to prove which code version is actually executing.

**Required remediation:** implement runtime fingerprint endpoint/object per Document 23.

**Closure proof:** SentinelX can query/corroborate source commit, build ID, image digest, config/schema identity without reading secrets.

---

### ZR-013 — Historical canary/test artifacts coexist on production PVC

**Severity:** P1

**Observed reality:** Historical canary/test artifacts, including an Apple canary source and old learning/checkpoint files, remain physically present in Hermes persistent storage.

**Risk:** historical/test material can become eligible through accidental read paths even if hidden from UI.

**Required remediation:** maintain explicit classification/quarantine/read-boundary enforcement; preserve history without eligibility for production truth.

**Closure proof:** negative tests prove customer/real-source queries cannot consume canary/test objects.

---

### ZR-014 — Credential-like secret exposed in process command line

**Severity:** P0 Security

**Observed reality:** SentinelX host process inspection revealed a credential-like gateway token embedded in a running process argument. The value is intentionally omitted from this document.

**Risk:** process command lines can be inspected by privileged host users/tools and may be captured in diagnostics.

**Required remediation:** rotate affected credential as appropriate and inject through protected Zeabur/Kubernetes secret environment/file mechanism; remove secret from argv/logs.

**Closure proof:** new process listing contains no secret value; service remains healthy; old credential invalidated if rotation required.

---

### ZR-015 — Resource telemetry contains hardcoded values

**Severity:** P1

**Observed reality:** The physical Hermes daemon hardcodes disk totals/free values in its resource snapshot. At observation time the daemon state reported values inconsistent with host `df` output. Its `ramUsageMb` field represents Node heap usage rather than total host RAM usage.

**Risk:** scheduler and operator dashboards may make decisions from misleading telemetry.

**Required remediation:** obtain live filesystem/memory metrics from real runtime sources; name process-memory and host-memory fields distinctly.

**Closure proof:** runtime telemetry reconciles with host metrics within expected sampling tolerance.

---

### ZR-016 — Internal worker mutation endpoint authorization requires hardening verification

**Severity:** P1 Security

**Observed reality:** The physically inspected worker HTTP implementation exposes job-creation endpoints and permissive CORS headers; authentication enforcement is not evident in the observed code path.

**Risk:** internal network access could create or manipulate extraction jobs outside tenant/engagement authorization.

**Required remediation:** enforce authenticated service-to-service requests, tenant/project/engagement scope, request signing/token validation, and narrow CORS according to actual caller requirements.

**Closure proof:** negative unauthorized requests are rejected; authorized end-to-end intake still succeeds.

---

### ZR-017 — Multiple heartbeat/ticker mechanisms require ownership reconciliation

**Severity:** P1

**Observed reality:** Persistent storage contains both Hermes heartbeat state and separately updated cron ticker heartbeat/success files.

**Risk:** health tickers may be mistaken for scheduler dispatch activity or may duplicate scheduling semantics.

**Required remediation:** classify each timer under Document 24; exactly one component owns CPA scheduling decisions.

**Closure proof:** topology names each timer, purpose, cadence, owner, and confirms only canonical scheduler can dispatch.

---

### ZR-018 — Browser execution on Zeabur remains physically unverified

**Severity:** P0 for browser certification

**Observed reality:** No Chrome/Chromium binary appeared on the host PATH and no current Chrome-like host process existed at the baseline snapshot. A browser could still exist inside a container or have executed earlier, so this is not proof of historical absence.

**Risk:** prior `BROWSER_VERIFIED` claims may refer to another environment or simulated journey.

**Required remediation:** declare authoritative browser-runtime location; deploy real browser capability there; persist browser session evidence; externally corroborate during a controlled test.

**Closure proof:** browserSessionId correlates with a real browser process/container and real Eve upload/network activity on the declared production topology.

---

### ZR-019 — Current worker persistence contains only legacy test evidence

**Severity:** P1

**Observed reality:** The visible worker job store contained one old Microsoft test job from September 6 and no current H.9.43 cohort work.

**Risk:** current dashboard/application claims may not be using this worker at all, or production work is happening elsewhere.

**Required remediation:** trace actual customer upload to the authoritative worker; retire/or isolate unused legacy worker path if not authoritative.

**Closure proof:** a new real-source browser upload creates a matching job in the declared authoritative worker with full custody lineage.

---

### ZR-020 — Cross-service/PVC custody is not yet physically proven

**Severity:** P0

**Observed reality:** Hermes and Eve Intelligence use separate persistent volumes. Current architecture reports often describe a unified workflow, but physical cross-PVC handoff receipts were not established in the baseline.

**Risk:** information may exist in one service store while dashboard/report/agents use another, recreating side-flow loss.

**Required remediation:** implement/verify cross-service handoff envelopes per Documents 03, 18, 19, and 24.

**Closure proof:** source/intake/IR/agent/canonical/report object IDs reconcile across service boundaries with zero unaccounted references.

---

### ZR-021 — Shared/custom image role ambiguity

**Severity:** P1

**Observed reality:** Eve Intelligence and Hermes Core deployments were observed using closely related/custom image provenance while performing different logical roles.

**Risk:** one image/bootstrap may launch overlapping daemons/workers, obscuring service ownership and causing duplicate schedulers.

**Required remediation:** make entrypoint/role explicit per deployment and include it in runtime fingerprint; separate images if that materially improves isolation/provenance.

**Closure proof:** each pod's entrypoint/process graph matches its declared responsibility and no unintended duplicate daemon runs.

---

### ZR-022 — Local AI connectivity is not local-AI execution proof

**Severity:** P2

**Observed reality:** Ollama is healthy and currently serves `qwen3.5:4b-q4_K_M`, but current worker health logic largely proves connectivity rather than that a particular job actually used the model.

**Risk:** owner reports may overstate model participation.

**Required remediation:** record per-job model/tool provenance only when inference occurs.

**Closure proof:** actual inference execution records correlate to job IDs; connectivity-only checks remain labeled health/readiness.

---

## Required repair order

Do not fix these gaps randomly. Recommended dependency order:

```text
1. ZR-001 / ZR-012 — establish authoritative runtime identity
2. ZR-014 — contain credential/process-argument exposure
3. ZR-003 / ZR-017 / ZR-004 — establish one scheduler owner/cadence
4. ZR-002 — connect scheduler evaluation to real dispatch
5. ZR-005 / ZR-006 / ZR-007 / ZR-008 / ZR-009 — replace shallow worker path
6. ZR-016 — enforce internal worker authorization
7. ZR-020 — prove cross-service custody
8. ZR-018 — deploy/prove real browser journey
9. ZR-013 / ZR-019 / ZR-021 — isolate legacy paths and clarify service roles
10. ZR-022 — tighten model execution provenance
11. run full Documents 19–22 negative-path reconciliation
12. deploy under Document 26
13. SentinelX independently corroborates
14. only then create a new blind autonomous handoff
```

---

## Gap closure standard

Every gap closure record must include:

```text
gapId
rootCause
files/services/stores changed
Git commit
build/artifact digest
deploymentId
runtime fingerprint
pre-change evidence
post-change evidence
negative bypass test
SentinelX corroboration where applicable
remaining limitations
closedAt
```

A Google/Gemini statement `FIXED` without this evidence leaves the gap open.

---

## Current certification consequence

Until the P0 gaps in this register are physically closed on the authoritative production runtime, do not treat prior H.9.42/H.9.43 production-readiness claims as proof that the Zeabur Eve Bookkeeping backend is running the documented architecture.

The correct status is:

`PRODUCTION_RUNTIME_RECONCILIATION_REQUIRED`

This is not a conclusion that the new code is unusable. It is a statement that deployment/runtime identity and physical execution must be brought into alignment and proven.
