# 26 — Deployment Promotion, Cutover, Rollback & Physical Attestation

**Status:** Authoritative design intent and implementation guidance. This document governs how Eve changes move from code to the real production runtime.

## Purpose

Eve has repeatedly reached a state where code, tests, or acceptance reports described a newer architecture than the physical production runtime actually running. This document defines the only acceptable promotion path from repository code to production operation.

> **No production implementation is complete until the intended artifact is physically deployed, running, fingerprinted, state-compatible, and independently observable.**

---

## 1. Canonical release chain

Every production change must follow a traceable chain:

```text
FETCH CURRENT SOURCE
→ RECONCILE CONCURRENT WORK
→ IMPLEMENT
→ TEST
→ BUILD IMMUTABLE ARTIFACT
→ RECORD ARTIFACT DIGEST
→ PRE-DEPLOYMENT STATE CHECKPOINT
→ DEPLOY TO DECLARED AUTHORITATIVE SERVICE
→ ROLLOUT/RESTART AS REQUIRED
→ VERIFY RUNNING INSTANCE
→ VERIFY RUNTIME FINGERPRINT
→ VERIFY STORAGE/MIGRATIONS
→ VERIFY HEALTH/READINESS
→ VERIFY REAL PRODUCTION-SAFE EXECUTION PATH
→ EXTERNAL PHYSICAL CORROBORATION
→ CUTOVER ACCEPTANCE
```

Skipping a step lowers the proof level.

---

## 2. Pre-deployment release manifest

Before mutation, create a release manifest containing at minimum:

```text
releaseId
repository
branch
sourceCommitSha
changeSummary
affectedServices
affectedStores
schemaChanges
migrationPlan
rollbackCommit/artifact
buildCommand/testResults
buildId
artifact/image digests
config changes
feature flag changes
secret-reference changes
expected rollout actions
expected runtime fingerprint
expected browser/API behavior
blindCohortImpact
```

Do not include secret values.

---

## 3. Pre-deployment state preservation

Before a material production change:

- identify all affected persistent stores;
- snapshot or back up where required by Document 13;
- preserve current runtime fingerprints;
- preserve currently running image digests;
- preserve scheduler/lease state;
- preserve active engagement/checkpoint state;
- identify in-flight jobs;
- determine whether drain/checkpoint is required.

Production changes must not silently orphan in-flight work.

---

## 4. Immutable build artifacts

Production code should be packaged into immutable artifacts/images with reproducible identity.

Required:

- source commit embedded or linked;
- artifact/image digest;
- build timestamp;
- dependency lock state;
- schema version;
- runtime version;
- configuration reference.

Avoid production source mutation at boot.

Forbidden as normal production deployment patterns:

- base64 source injection through process arguments;
- large `node -e` code payloads;
- writing the worker/orchestrator source dynamically on container start;
- unpinned `git pull` during boot;
- fetching arbitrary latest code at runtime.

---

## 5. Service-specific deployment ownership

Each release must name exactly which production services are being changed.

Example categories:

- frontend;
- API;
- Eve Intelligence/extraction worker;
- Hermes Core;
- OpenClaw;
- local AI configuration;
- browser runner;
- report service;
- audit/minerva service if separate.

A new backend build does not automatically update Hermes or the extraction worker.

---

## 6. Rollout proof

After deployment, record:

```text
deploymentId
service
previousImageDigest
newImageDigest
previousInstanceIds
newInstanceIds
rolloutStartedAt
rolloutCompletedAt
pod/process start timestamps
restart count
runtimeFingerprint
health/readiness result
```

If the expected pod/process did not change when the release required it, investigate before claiming deployment.

---

## 7. Runtime fingerprint must match release manifest

After rollout:

```text
RUNNING.commitSha == RELEASE.sourceCommitSha
RUNNING.artifactDigest == RELEASE.artifactDigest
RUNNING.configHash == RELEASE.expectedConfigHash
RUNNING.schemaVersion compatible with RELEASE.schemaVersion
```

Where exact equality is not applicable, the release must document the transformation/build mapping.

---

## 8. Storage and schema migration

Persistent storage is not recreated merely because code is redeployed.

For every schema change:

- version the schema;
- define forward migration;
- define backward/rollback behavior;
- preserve historical objects;
- test rehydration;
- ensure idempotency;
- reconcile object counts/IDs/hashes where applicable;
- never silently reinterpret old runtime records under a new schema.

---

## 9. Scheduler deployment safety

Before changing scheduler/heartbeat code:

- checkpoint active cohort/engagement state;
- identify current scheduler leader;
- preserve lease/fencing state;
- stop/replace only the intended scheduler instance through the platform rollout;
- verify exactly one leader after rollout;
- verify heartbeat cadence from physical timestamps;
- verify scheduler evaluation and dispatch are distinct;
- verify old daemon cannot continue dispatching.

---

## 10. Worker deployment safety

Before changing extraction worker code:

- identify queued/processing jobs;
- define checkpoint/retry semantics;
- prevent duplicate job completion;
- preserve document/source hashes;
- maintain idempotency keys;
- validate worker output schema;
- verify old worker instances are drained;
- verify new jobs enter the new worker implementation.

---

## 11. Secret handling in deployment

Secrets belong in Zeabur/Kubernetes secret storage or another approved secret system.

Do not expose secrets through:

- process arguments;
- Git remotes;
- logs;
- owner reports;
- source files;
- browser bundle;
- runtime fingerprint endpoints.

If a secret is observed in process arguments or logs:

1. classify the exposure;
2. redact it from reports;
3. rotate the secret where necessary;
4. move injection to protected environment/file/secret reference;
5. verify the old value is no longer present in process listings/logs.

---

## 12. Post-deployment acceptance ladder

Run the minimum applicable proof ladder:

### Level 1 — Runtime

- process/pod exists;
- runtime fingerprint matches;
- PVCs mounted;
- health/readiness pass;
- no crash loop.

### Level 2 — Production service

- real request reaches the intended service;
- service creates actual job/output;
- persistent object is written;
- handoff reaches intended consumer.

### Level 3 — Product

- actual Eve UI/API consumes the new path;
- authoritative data matches runtime state;
- no side path remains active.

### Level 4 — Browser

- real browser uses the intended frontend and triggers the intended backend;
- browser evidence and backend execution correlate.

### Level 5 — External assurance

- SentinelX/physical host observation corroborates deployment identity, process/pod state, job evidence, and storage behavior.

---

## 13. Negative bypass tests after deployment

Every major production-path repair should prove the old shortcut can no longer satisfy production/certification gates.

Examples:

- generated SEC document rejected;
- filesystem-only upload cannot become browser verified;
- shallow regex worker cannot declare deep extraction complete;
- monolithic pseudo-swarm cannot claim separate specialist executions;
- old scheduler intention record cannot count as dispatch;
- test/canary artifact cannot enter customer canonical truth;
- stale UI cache cannot survive canonical invalidation.

---

## 14. Cutover criteria

A release is cut over only when:

- intended services are physically running the intended artifact;
- persistent stores are compatible;
- old truth-producing path is disabled/isolation-proven;
- real production-safe smoke tests pass;
- no P0/P1 release blocker remains;
- runtime authority manifest updated;
- external physical corroboration completed where required.

---

## 15. Rollback criteria

Rollback if a release introduces:

- source/custody corruption;
- cross-tenant leakage;
- canonical truth errors;
- unrecoverable worker failure;
- duplicate scheduler leaders;
- inability to rehydrate persistent state;
- broken customer intake;
- broken report delivery;
- material security regression;
- unbounded resource exhaustion.

Rollback itself must be versioned and audited.

---

## 16. Rollback procedure

1. checkpoint/preserve evidence of failure;
2. stop new work if necessary;
3. restore previous immutable artifact/image;
4. restore compatible config/schema state;
5. verify exactly one scheduler owner;
6. verify worker queues/checkpoints;
7. verify persistent stores;
8. verify health/readiness;
9. verify customer-safe path;
10. preserve failed release as historical evidence;
11. open incident and learning record.

Do not erase the failed deployment history.

---

## 17. Blind/autonomous handoff rule

Any production mutation after an autonomous/blind handoff invalidates that certification window.

After the final repair/deployment:

- create a new handoff ID;
- record exact timestamp;
- record runtime fingerprints/image digests;
- record scheduler state;
- record store/checkpoint state;
- then external engineering exits.

Do not pretend the old window remained unattended.

---

## 18. Owner report after deployment

Every material release report must answer:

- What physical service changed?
- What commit/build produced it?
- What image/artifact is running?
- Did the pod/process actually roll?
- What storage was preserved/migrated?
- What old path was disabled?
- What real request/job proved the new path?
- What negative test proved the bypass is blocked?
- What did SentinelX/physical assurance observe?
- What remains unresolved?
- Is a new blind handoff required?

---

## 19. Permanent invariants

1. **Code completion is not production completion.**
2. **Production code is immutable and fingerprinted.**
3. **Every release names affected services and stores.**
4. **Every rollout leaves verifiable physical evidence.**
5. **Persistent state survives deployment intentionally, not accidentally.**
6. **Old truth-producing paths are disabled or explicitly isolated before cutover.**
7. **Secrets never belong in process arguments or owner reports.**
8. **Negative bypass tests are part of release acceptance.**
9. **External physical observation should corroborate high-risk production changes.**
10. **Any production mutation creates a new autonomous certification boundary.**
