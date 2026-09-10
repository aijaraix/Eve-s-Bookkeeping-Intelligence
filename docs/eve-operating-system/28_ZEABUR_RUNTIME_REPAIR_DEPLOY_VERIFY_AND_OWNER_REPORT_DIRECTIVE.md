# 28 — Zeabur Runtime Repair, Deploy, Verify & Owner Report Directive

**Status:** Authoritative execution directive for Google/Gemini or another engineering agent tasked with reconciling Eve's current physical Zeabur runtime against Documents 00–27.

## Purpose

This directive turns the physical runtime gaps in Document 27 into a concrete implementation, deployment, verification, and owner-report workflow.

The objective is not to produce another architectural report. The objective is to bring the actual production runtime into conformance with the documented Eve Operating System and prove it physically.

> **Do not create another parallel implementation. Repair or replace the physical production path, deploy it to the declared authoritative services, and prove the old bypass can no longer satisfy production gates.**

---

## 1. Mandatory reading and current-state rule

Before changing anything:

1. fetch current GitHub `main`;
2. read `docs/eve-operating-system/00_START_HERE.md`;
3. follow the complete mandatory reading order through Document 28;
4. inspect current production deployment/runtime state;
5. preserve concurrent valid work;
6. do not assume a prior phase report reflects current Zeabur reality.

Document 27 is the current physical Zeabur gap register until superseded by a later physically verified register.

---

## 2. Authoritative runtime principle

Do not decide that code is production because it exists in Google AI Studio, a Cloud Run preview, GitHub, a local test, or an acceptance fixture.

For every production capability establish:

```text
CAPABILITY
→ AUTHORITATIVE SERVICE
→ PLATFORM/ENVIRONMENT
→ SOURCE COMMIT
→ BUILD/IMAGE DIGEST
→ RUNNING INSTANCE
→ PERSISTENT STORE
→ RUNTIME FINGERPRINT
```

If the customer frontend is hosted elsewhere while workers/Hermes run on Zeabur, declare that explicitly.

---

## 3. Observation-first snapshot

Before mutation preserve a machine-readable pre-change snapshot containing:

- running Zeabur pods/deployments/services;
- image digests;
- pod/process start times;
- PVC identities and mounts;
- runtime fingerprints if any;
- Hermes heartbeat/scheduler state;
- worker job state;
- current in-flight customer/Academy jobs;
- active scheduler processes;
- current secret-reference configuration without values;
- recent relevant errors/incidents;
- current GitHub source commit.

Do not expose secrets.

---

## 4. Reconcile Document 27 gap-by-gap

For every `ZR-*` gap:

```text
GAP
→ ROOT CAUSE
→ AFFECTED PHYSICAL SERVICE
→ AFFECTED STORE
→ REQUIRED CODE/CONFIG CHANGE
→ TEST
→ BUILD
→ DEPLOY
→ PHYSICAL VERIFICATION
→ NEGATIVE BYPASS TEST
→ CLOSURE RECORD
```

Do not mark all gaps resolved through one generic statement.

---

## 5. Fix runtime identity first

Implement Document 23 Runtime Authority Manifest and runtime fingerprinting before large production changes.

Required outcome:

- every material production service can state its repository/commit/build/image/config/schema identity;
- the identity is generated from the deployed artifact, not manually entered;
- external assurance can compare it with GitHub/release manifest;
- secrets are absent.

Until this exists, production deployment claims remain weak.

---

## 6. Fix secret exposure before broad rollout

Document 27 records a credential-like secret exposed in a process command line.

Required action:

- identify the affected secret without printing it in logs/reports;
- determine whether rotation is required;
- move it to Zeabur/Kubernetes protected secret injection;
- remove it from argv;
- verify the service starts correctly;
- verify the old value is absent from new process listings/logs;
- preserve only a redacted incident record.

Do not commit secret values.

---

## 7. Establish one scheduler leader

Physically map every autonomous daemon/ticker/cron process.

For each classify:

- health heartbeat;
- scheduler evaluation;
- worker heartbeat;
- maintenance ticker;
- Academy scheduler;
- deprecated.

Then ensure exactly one authoritative scheduler leader owns primary CPA engagement dispatch.

Use a durable lease/fencing mechanism.

Remove or disable duplicate dispatch ownership without deleting historical state.

---

## 8. Replace the state-writer-only heartbeat path

The production heartbeat must do more than write `START_NEW_CASE` to a state file.

Required physical path:

```text
HEARTBEAT_TICK
→ ELIGIBILITY EVALUATION
→ LEADER/LEASE CHECK
→ CUSTOMER PRIORITY CHECK
→ RESOURCE CHECK
→ DISPATCH DECISION
→ REAL JOB/DISPATCH ID
→ CONSUMER ACKNOWLEDGEMENT
→ EXECUTION STATE
```

If no dispatch occurs, persist a real non-dispatch reason.

Do not represent an intention as an execution.

---

## 9. Replace the shallow production worker

The currently observed regex/headline worker is not sufficient as authoritative Document Intelligence.

Connect the production intake path to the actual Universal Document Intelligence architecture.

Required processing chain:

```text
PHYSICAL DOCUMENT
→ SOURCE INVENTORY
→ UNIVERSAL DOCUMENT IR
→ OBSERVATIONS/ATTRIBUTES
→ DATAPOINTS
→ RELATIONSHIPS
→ SEMANTIC ASSERTIONS
→ VERIFICATION
→ CANONICALIZATION
```

Do not introduce a new H.9.x-specific extractor.

Reuse the canonical implementation defined by current source/docs.

---

## 10. Constrain fallback extraction

Regex, deterministic, OCR-only, local parser, or model fallback paths may remain where useful, but every fallback needs:

```text
fallbackId
trigger
capability scope
authority ceiling
required downstream verification
proof level ceiling
failure/exit condition
```

A shallow fallback cannot claim:

- deep extraction;
- complete document understanding;
- source-side recall certification;
- unqualified canonical truth;
- final audit readiness.

---

## 11. Fix worker identity/period/scale contracts

Production job acceptance must require valid source identity.

Remove hardcoded reporting periods and magnitude-only scale rules.

Derive:

- period;
- entity;
- currency;
- unit;
- scale;
- statement scope

from evidence.

Unresolved values remain unresolved/review-required.

---

## 12. Secure internal worker/orchestration endpoints

Ensure mutating internal APIs require authenticated service-to-service access and project/engagement scope.

Negative tests must prove:

- missing/invalid credentials rejected;
- wrong tenant/project rejected;
- wrong engagement rejected;
- replay handled idempotently;
- valid production intake succeeds.

Do not rely solely on ClusterIP/private networking.

---

## 13. Prove cross-service custody

Hermes and worker/service stores are physically separate.

Every cross-service material transfer requires a handoff receipt.

At minimum prove:

```text
UPLOAD/INTAKE
→ WORKER JOB
→ IR OUTPUT
→ HERMES/SPECIALIST CONSUMPTION
→ VERIFIED/CANONICAL OUTPUT
→ UI/REPORT
```

with object IDs/hashes and zero unaccounted references.

---

## 14. Deploy real browser capability where it belongs

Declare the authoritative browser-runtime location.

If browser automation runs in another production environment, record that in the Runtime Authority Manifest and correlate it to Zeabur backend requests.

If it belongs on Zeabur, deploy it there in a traceable image/artifact.

`BROWSER_VERIFIED` requires:

- real browser process/session;
- actual Eve URL;
- actual file input interaction;
- browser-generated upload request;
- server intake object;
- visible resulting state.

---

## 15. Preserve and quarantine historical test/canary data

Do not delete historical evidence merely to create a clean appearance.

Instead:

- classify it;
- enforce read-boundary exclusion;
- remove it from production candidate/canonical/UI/report eligibility;
- keep it available for regression and forensic history.

Run negative tests proving ineligibility.

---

## 16. Fix resource telemetry

Replace hardcoded disk/resource values with live metrics.

Distinguish:

- host memory;
- process RSS/heap;
- pod memory;
- disk filesystem free/used;
- PVC usage where available.

Scheduler decisions must identify which metric they use.

---

## 17. Immutable deployment build

Package updated Hermes/worker production code into immutable artifacts/images.

Do not use source-generation/bootstrap code as the final production architecture.

Record:

- commit;
- build ID;
- image digest;
- deployment generation;
- config hash;
- schema version.

---

## 18. Deploy through the actual Zeabur/K3s services

Apply the production rollout to the services identified by the Runtime Authority Manifest.

Do not stop after building.

Verify:

- new image deployed;
- expected pod/instance rolled;
- old process stopped/drained;
- PVC preserved/mounted;
- health/readiness restored;
- runtime fingerprint matches release manifest.

---

## 19. Reconcile scheduler processes after rollout

External observation previously saw multiple daemon processes.

After rollout prove:

- which process belongs to which pod/service;
- exactly one scheduler leader exists;
- no stale old daemon can dispatch;
- heartbeat cadence equals configured cadence;
- cron/ticker files cannot masquerade as scheduling evidence.

---

## 20. Physical real-source acceptance test

Before another blind cohort, use an archived/development issuer and execute a real production-safe flow:

```text
REAL AUTHORITY SOURCE
→ REAL PHYSICAL DOWNLOAD/CUSTOMER FILE
→ REAL BROWSER UPLOAD
→ ACTUAL ZEEABUR INTAKE
→ ACTUAL WORKER JOB
→ ACTUAL DOCUMENT IR
→ ACTUAL HERMES/SPECIALIST JOBS
→ ACTUAL REPORT
→ INTERNAL AUDIT
→ MINERVA
→ LEARNING
```

Correct typo in implementation naming as appropriate; this document's meaning is actual Zeabur intake.

Do not use a future blind cohort issuer for this acceptance test.

---

## 21. Physical extraction acceptance evidence

The acceptance test must report actual:

- source bytes/hash;
- intake ID;
- worker job ID;
- IR object counts;
- observations;
- DataPoints by family;
- relationships;
- assertions;
- verified/canonical counts;
- unresolved items;
- source-side census/recall sample;
- specialist job IDs;
- report artifact IDs/hashes;
- Internal Audit ID;
- Minerva exam ID;
- learning case ID.

Do not certify from headline fact count.

---

## 22. Negative bypass acceptance tests

At minimum verify production rejects/prevents certification for:

- generated SEC/padded synthetic filing;
- missing document hash;
- filesystem-copy-only browser claim;
- browser trace with no browser process;
- shallow regex-only deep-extraction claim;
- hardcoded period;
- magnitude-only scale assumption;
- monolithic pseudo-agent swarm;
- unconditional validation PASS;
- test/canary artifact in customer truth;
- scheduler intention with no dispatch;
- duplicate scheduler leader;
- unauthorized internal job submission.

---

## 23. Google/Gemini must not self-certify from its own build

After implementation and deployment, Google/Gemini may perform application-level verification.

It must not claim final physical production closure solely from its own report.

For high-risk gaps, request/record independent SentinelX corroboration.

Google/Gemini should provide the owner with the exact facts needed for independent verification:

- deployment IDs;
- image digests;
- pod/service names;
- runtime fingerprints;
- execution/job IDs;
- relevant timestamps;
- artifact hashes.

Do not provide secrets.

---

## 24. Owner approval rule

Google/Gemini may automatically repair issues where:

- the intended architecture is unambiguous from Documents 00–28;
- the fix is generalized;
- no destructive customer-data decision is required;
- security boundaries are preserved;
- history is retained;
- rollback is available.

Pause for owner decision when:

- customer data must be deleted;
- a destructive migration is required;
- a new external paid dependency is required;
- an irreversible security/identity decision is required;
- two valid architectural options materially affect product behavior;
- legal/professional policy requires human approval.

---

## 25. Owner report format

For every repaired gap report:

```text
GAP ID
WHAT WAS PHYSICALLY WRONG
WHY IT HAPPENED
FIRST CAUSAL FAILURE
WHAT CHANGED
FILES/SERVICES/STORES CHANGED
TESTS RUN
BUILD ID / IMAGE DIGEST
DEPLOYMENT / POD CHANGE
RUNTIME FINGERPRINT
REAL EXECUTION PROOF
NEGATIVE BYPASS PROOF
SENTINELX CORROBORATION STATUS
HISTORICAL EVIDENCE PRESERVED
REMAINING LIMITATIONS
STATUS: FIXED / PARTIAL / BLOCKED
```

Do not collapse the report into `30/30 PASS` without this evidence.

---

## 26. Completion condition

This directive is complete only when:

- all P0 Document 27 gaps are physically closed or explicitly blocked;
- all P1 gaps required for the next controlled autonomous test are closed;
- intended production services run the intended artifacts;
- one scheduler leader exists;
- real customer intake reaches the real deep worker;
- cross-service custody reconciles;
- real browser certification path exists;
- old synthetic/shallow paths cannot satisfy production gates;
- secrets are not exposed in process arguments;
- runtime telemetry is truthful;
- SentinelX can independently corroborate the physical topology.

Only then may a new blind/autonomous cohort be armed with a fresh handoff ID.

---

## 27. Final status language

Finish with one of:

`ZEEABUR PRODUCTION RUNTIME RECONCILED — PHYSICAL EXECUTION PATH VERIFIED`

or

`ZEABUR PRODUCTION RUNTIME PARTIAL — REMAINING PHYSICAL GAPS LISTED`

or

`ZEABUR PRODUCTION RUNTIME BLOCKED — PRODUCTION PATH NOT YET SAFE TO CERTIFY`

The first string contains a spelling error and must not be used in final reporting. The intended successful phrase is:

`ZEABUR PRODUCTION RUNTIME RECONCILED — PHYSICAL EXECUTION PATH VERIFIED`
