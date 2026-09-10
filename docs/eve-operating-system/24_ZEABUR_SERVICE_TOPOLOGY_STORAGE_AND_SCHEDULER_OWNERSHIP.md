# 24 — Zeabur Service Topology, Persistent Storage & Scheduler Ownership

**Status:** Authoritative design intent and implementation guidance. This document does **not** certify that the current Zeabur runtime is compliant.

## Purpose

Eve's production backend currently spans multiple Zeabur/K3s services with separate persistent volumes. This creates a recurring risk: two services can both appear healthy while responsibility for orchestration, extraction, storage, scheduling, or truth production is duplicated or ambiguous.

This document defines the required physical service ownership model for the Eve production runtime and the rules for heartbeat, scheduler, worker, storage, and cross-service handoffs.

---

## 1. Logical production service map

The production service topology must explicitly map at least the following logical roles:

### `eve-hermes-core`
Primary responsibilities:

- engagement orchestration;
- queue prioritization;
- customer preemption;
- scheduler evaluation;
- specialist dispatch;
- checkpoint/resume;
- handoff reconciliation;
- operator-facing orchestration state.

### `eve-intelligence`
Primary responsibilities:

- production document-intelligence/extraction worker responsibilities assigned to this service;
- physical intake job consumption;
- Universal Document IR generation or delegated production extraction work;
- durable worker job state;
- explicit output manifests.

### `eve-local-ai`
Primary responsibilities:

- local model serving;
- low-cost bounded inference tasks;
- no independent canonical truth authority.

### `eve-openclaw`
Primary responsibilities:

- OpenClaw gateway/runtime functions explicitly assigned by the Eve operating model;
- no duplicate ownership of canonical scheduler or extraction truth without explicit contract.

### Frontend / API / browser-runtime services
If these run outside this Zeabur host or in additional services, Document 23 requires them to appear in the Runtime Authority Manifest.

---

## 2. Current observed physical baseline is evidence, not design truth

A SentinelX read-only host observation on the Eve Bookkeeping Zeabur server identified four active Eve service groups:

- local Ollama service on port 11434 with a dedicated persistent volume;
- OpenClaw on port 18789 with a dedicated persistent volume;
- an Eve Intelligence service on port 8080 with a dedicated `/storage` volume;
- an Eve Hermes Core service exposing ports 8642 and 9119 with a dedicated `/opt/data` volume.

This observation is a baseline only. Service IDs, pod names, and image revisions may change. Logical service labels and Runtime Authority Manifest identities are the permanent references.

---

## 3. Persistent storage ownership

Every durable store must have exactly one declared authoritative owner and explicit readers/writers.

Maintain a `PersistentStoreRegistry` equivalent to:

```text
storeId
logicalPurpose
authoritativeWriterService
allowedReaderServices
physicalPlatform
persistentVolumeIdentity
mountPath
schemaVersion
backupPolicy
restorePolicy
retentionPolicy
quarantinePolicy
cross-engagementIsolationPolicy
lastReconciliationAt
```

At minimum register:

- Hermes orchestration state;
- heartbeat/scheduler state;
- worker job state;
- intake sessions;
- Universal Document IR;
- evidence/observations;
- DataPoints/relationships/assertions;
- canonical truth;
- incidents;
- PBC/review records;
- reports;
- Internal Audit records;
- Minerva examinations;
- Academy learning;
- model/tool provenance;
- source artifacts.

---

## 4. Cross-PVC handoff rule

Different persistent volumes do not imply shared state.

When one service writes to one PVC and another service consumes data from another PVC, transfer must occur through an explicit production handoff/API/message contract.

Required evidence:

```text
handoffId
producerService
producerExecutionId
sourceStoreId
inputObjectIds
payload/manifest hash
consumerService
consumerExecutionId
destinationStoreId
sentAt
receivedAt
acknowledgedAt
status
unaccountedReferences
```

Never assume that two services see the same file because they run on the same physical server.

---

## 5. Exactly one canonical scheduler owner

There must be one and only one authoritative scheduler owner for each scheduling domain.

For the primary CPA practice scheduler, Hermes owns dispatch semantics unless another component is explicitly declared and reconciled.

Potentially separate health tickers, cron markers, maintenance loops, or worker heartbeats may exist, but they must not independently decide engagement work.

Classify every timer/loop as one of:

- `HEALTH_HEARTBEAT`
- `SCHEDULER_EVALUATION`
- `WORKER_HEARTBEAT`
- `MAINTENANCE_CRON`
- `MONITORING_TICKER`
- `ACADEMY_SCHEDULER`
- `DEPRECATED`

No two active loops may both believe they own `DISCOVER_NEXT_COMPANY`, customer preemption, or engagement dispatch.

---

## 6. Heartbeat is not work completion

A heartbeat has three distinct concepts:

```text
HEARTBEAT_TICK
→ SCHEDULER_EVALUATION
→ OPTIONAL_DISPATCH
```

Persist them separately.

A heartbeat record saying:

`action = START_NEW_CASE`

is not evidence that a case started.

A real dispatch requires:

```text
dispatchId
jobId/executionId
selectedAction
lock/lease
consumer acknowledgement
resulting state transition
```

UI and audits must never count heartbeat intentions as actual agent work.

---

## 7. Heartbeat cadence

Heartbeat cadence must be configuration-driven and observable.

Do not hardcode one cadence in documentation and another in the deployed daemon.

Persist:

```text
configuredHeartbeatSeconds
observedHeartbeatSeconds
lastHeartbeatAt
nextHeartbeatAt
schedulerEvaluationCount
dispatchCount
missedHeartbeatCount
```

Material mismatch creates `SCHEDULER_CONFIGURATION_DRIFT`.

---

## 8. Leader lease and duplicate-daemon protection

At most one active scheduler instance may hold the authoritative scheduler lease for the same cohort/domain.

Use a durable lease with:

```text
leaseId
schedulerDomain
ownerInstanceId
ownerPod/service
acquiredAt
renewedAt
expiresAt
fencingToken
```

A second instance must remain standby/read-only for that scheduler domain.

Do not rely only on process existence or a local boolean flag.

A stale lease may be expired only under the documented lease contract. Do not use arbitrary age-based deletion without renewal/fencing semantics.

---

## 9. Worker contract

The production extraction worker must not be a shallow fallback disguised as the authoritative Document Intelligence engine.

A production worker job must carry:

```text
jobId
intakeSessionId
workspace/project/engagementId
documentId
documentHash
sourceArtifactId
format
requestedProcessingContract
schemaVersion
createdAt
```

A production result must include references to actual persisted IR/evidence objects, not merely a small array of headline financial facts.

A regex-only extractor may exist as a bounded fallback for limited tasks, but its authority ceiling must be explicit. It cannot certify deep extraction, full document completeness, or canonical customer truth without downstream independent verification.

---

## 10. Required worker integrity rules

1. Document hash is mandatory for production jobs unless a documented pre-hash stage explicitly applies.
2. Period cannot be hardcoded globally.
3. Currency cannot be inferred from one symbol and silently treated as complete multi-currency understanding.
4. Scale cannot be inferred solely from numeric magnitude.
5. Positive-only regex extraction cannot represent full accounting truth.
6. Worker validation cannot always return `PASS` merely because the function completed.
7. Job completion must distinguish `PROCESSING_COMPLETE` from `DOCUMENT_UNDERSTANDING_VERIFIED`.
8. Local-AI connectivity is not evidence that local AI performed inference.

---

## 11. Service health semantics

Separate:

- process alive;
- HTTP health endpoint returns;
- dependency reachable;
- queue consumable;
- storage writable;
- job execution proven;
- production capability ready.

Recommended states:

```text
PROCESS_ALIVE
HEALTHY
READY
DEGRADED
BLOCKED
UNVERIFIED
```

A service returning HTTP 200 cannot automatically be described as fully operational for all business capabilities.

---

## 12. Internal network identity

Service discovery names may resolve inside Kubernetes pods but not from the host namespace. External assurance must therefore distinguish:

- pod/service DNS;
- ClusterIP;
- host networking;
- public ingress.

A host-level DNS failure to a Kubernetes-internal name does not prove the service is down if ClusterIP/pod checks succeed.

---

## 13. Deployment artifact rule

Production worker/orchestrator source should arrive as a traceable immutable build artifact or image.

Avoid production patterns such as:

- injecting large source payloads through `node -e` at startup;
- base64-decoding the production worker source from command arguments;
- mutating production source on every container boot;
- downloading unpinned runtime code during startup.

These patterns destroy clean build provenance and make runtime reconciliation difficult.

If bootstrap generation is unavoidable for a bounded transition, it must be temporary, versioned, hashed, auditable, and replaced by an immutable deployment artifact before production certification.

---

## 14. Security of internal services

Internal ClusterIP does not eliminate authorization requirements for material production actions.

At minimum:

- authenticate mutating worker/orchestrator endpoints;
- scope jobs to tenant/project/engagement;
- reject malformed/missing authorization where applicable;
- do not use wildcard browser CORS for sensitive internal mutation APIs unless justified and independently protected;
- do not place secrets in process command-line arguments;
- use Zeabur/Kubernetes secret mechanisms or equivalent protected environment/file injection.

---

## 15. Old fixtures and canaries on production storage

Historical/test artifacts may remain physically present for audit and regression purposes, but must be classified and ineligible at every read boundary.

Required classification examples:

- `PRODUCTION_CUSTOMER`
- `AUTHORITATIVE_REAL_SOURCE_PRACTICE`
- `SYNTHETIC_ACADEMY`
- `CANARY`
- `REGRESSION`
- `DEMO`
- `QUARANTINED_HISTORICAL`

A file being hidden from the UI is not sufficient isolation.

---

## 16. Runtime service map acceptance test

For every production service prove:

1. logical service role;
2. current pod/instance;
3. image/artifact digest;
4. runtime fingerprint;
5. storage mounts;
6. scheduler/worker responsibilities;
7. health/readiness;
8. authoritative writer domains;
9. cross-service handoffs;
10. no uncontrolled duplicate owner.

---

## 17. Scheduler acceptance tests

At minimum verify:

- exactly one scheduler leader;
- heartbeat intent is not counted as dispatch;
- dispatch creates a real consumer execution;
- customer preemption is real;
- stale lease recovery uses lease semantics;
- no legacy Academy cooldown blocks eligible customer/blind work unless intentionally configured;
- no duplicate cron/ticker dispatch path exists;
- a completed engagement causes the next eligible discovery through the canonical scheduler only.

---

## 18. Permanent invariants

1. **One scheduling domain, one authoritative scheduler leader.**
2. **One durable object class, one declared authoritative writer or explicit reconciled multi-writer contract.**
3. **A state intention is not execution evidence.**
4. **Separate PVCs require explicit handoffs.**
5. **A worker heartbeat is not extraction proof.**
6. **A health check is not business-capability proof.**
7. **Historical fixtures cannot become production truth through shared storage.**
8. **Production runtime code must be traceable to immutable deployment artifacts.**
9. **Internal mutation endpoints remain authenticated and scoped.**
10. **Scheduler, worker, and storage ownership must be visible to Internal Audit and external assurance.**
