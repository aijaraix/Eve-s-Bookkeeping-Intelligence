# 25 — External Runtime Assurance, SentinelX & Physical Observability

**Status:** Authoritative design intent and implementation guidance. This document does **not** make SentinelX part of Eve's production truth. SentinelX is an independent external assurance plane.

## Purpose

Eve requires a way to independently verify what the physical production server actually did. Application logs, internal audit reports, agent telemetry, and Google/Gemini code analysis are valuable but can all share the same mistaken assumption or simulated evidence path.

SentinelX provides an external host-level assurance perspective on the actual Linux/Zeabur runtime.

> **Eve says what Eve did. Google/Gemini can inspect application/code behavior. SentinelX independently observes the physical host. The three views should reconcile.**

SentinelX does not replace Eve's custody, provenance, audit, or security controls.

---

## 1. Assurance-plane role

SentinelX is classified as:

`EXTERNAL_ASSURANCE_OBSERVER`

Its normal use is read-only verification of:

- processes;
- services;
- K3s/container state;
- deployment age;
- image identity;
- ports;
- storage mounts;
- persistent-file existence/metadata;
- runtime logs;
- CPU/RAM/disk;
- browser process evidence;
- worker/scheduler activity;
- host-side file hashes where permitted;
- runtime drift.

It is not an authoritative source for accounting truth.

---

## 2. Read-only by default

For production assurance tasks, SentinelX must default to read-only operations.

Allowed normal assurance activity includes:

- `state`;
- service status/is-active;
- process inspection;
- read/list/search;
- project snapshot;
- read-only Git diff/status;
- read-only network/port checks;
- read-only scripts;
- read-only K3s/container queries;
- log inspection.

Mutation actions such as edit, restart, chmod/chown, copy/move/delete, service lifecycle changes, package installation, or configuration changes require explicit owner authorization or a separately authorized remediation task.

External assurance must not silently become an operator that alters the system it is auditing.

---

## 3. SentinelX host identity

Every enrolled production host should have a stable label and host ID.

For Eve Bookkeeping, use a label equivalent to:

`eve-bookkeeping-prod-ai`

The stable SentinelX `host_id` remains the immutable host identity; labels are human-readable aliases.

Record host identity in external audit reports without exposing SentinelX credentials or identity secrets.

---

## 4. Baseline snapshot

Before a major deployment, blind cohort, or forensic investigation, capture a read-only baseline containing:

```text
snapshotId
timestamp
hostId/label
hostname
kernel/architecture
uptime
load average
CPU count
memory total/available
disk filesystems/usage
running production processes
running systemd services
K3s pods/deployments/services
pod image digests
pod ages/restarts
persistent volumes/mounts
listening ports
runtime fingerprints
scheduler/heartbeat state
worker state
recent incident/error summary
```

Do not include secret values.

---

## 5. Independent process proof

Claims about physical execution should be corroborated where possible.

Examples:

### Real browser
Application claim:

`BROWSER_VERIFIED`

External host proof may include:

- Chrome/Chromium/Playwright/Puppeteer process lifetime;
- container process evidence;
- browser execution logs;
- correlated browserSessionId/timestamps;
- resource/network activity.

Absence of a browser process in a later snapshot does not prove one never ran, because browser processes may be short-lived. Therefore correlate persisted browser evidence and process/log history rather than relying only on one live `ps` output.

### Real extraction
Application claim:

`deep extraction executed`

External assurance may corroborate:

- worker process active;
- actual worker job record created;
- source file present;
- IR/output stores changed;
- CPU/memory/IO increased plausibly;
- logs show the job/execution ID;
- timestamps align.

### Real agent dispatch
Application claim:

`9 specialists executed`

External assurance may inspect:

- real job objects;
- process/service logs;
- queue state;
- execution IDs;
- output object creation times.

Do not require one OS process per logical agent; agents may share a worker process. The proof requirement is distinct job execution and persisted input/output/handoff evidence, not separate Linux PIDs.

---

## 6. Deployment verification

After Google/Gemini or another engineering agent claims a production deployment, SentinelX should independently verify:

- expected service rolled;
- pod/instance start time changed when rollout requires it;
- image/artifact digest matches release manifest;
- runtime fingerprint reports expected commit/build;
- old instances are drained/terminated as intended;
- persistent volumes remain mounted;
- health/readiness returns;
- no duplicate stale worker/scheduler remains active;
- logs do not show crash loops.

A code commit without these physical changes is not deployment proof.

---

## 7. Scheduler assurance

SentinelX should be able to verify the difference among:

- heartbeat tick;
- scheduler evaluation;
- actual dispatch;
- agent job execution;
- engagement completion.

Useful external checks include:

- scheduler process ownership;
- number of scheduler daemon instances;
- lease/state files;
- heartbeat file timestamps;
- dispatch/job records;
- cron/ticker files;
- process uptime;
- logs around dispatch.

A frequently updated heartbeat file with zero real jobs is an autonomy warning, not proof of productive work.

---

## 8. Persistent-storage assurance

For each important PVC/mount, external assurance should know:

- logical service owner;
- mount path;
- physical PV path where observable;
- recent material files;
- approximate usage;
- expected object families;
- backup/restore relationship.

Do not inspect customer-sensitive file contents unless the audit requires it and authorization permits it. Metadata, hashes, counts, timestamps, and scoped samples are preferred for routine assurance.

---

## 9. Secret hygiene during observation

External host inspection can expose process command lines, environment values, config files, and logs that may contain secrets.

Rules:

1. Never reproduce secrets in owner reports.
2. Redact credential-like values immediately.
3. If a secret appears in process arguments, classify as `SECRET_EXPOSED_IN_PROCESS_ARGUMENTS` and recommend rotation/migration to protected secret injection.
4. Never read `/etc/sentinelx/identity.json` contents into an owner report.
5. Never commit host secrets to GitHub.
6. Avoid broad environment dumps.
7. Query only variable names when values are unnecessary.

---

## 10. Blind/autonomous trial independence

During a blind autonomous cohort, SentinelX may take point-in-time read-only snapshots without invalidating the trial if it does not mutate, trigger, retry, repair, enqueue, clear, or otherwise influence Eve.

Every snapshot should record:

```text
observerSnapshotId
handoffId
snapshotStartedAt
snapshotCutoffAt
hostId
operationsPerformed
mutationsPerformed = 0
```

Do not remain attached waiting for future events unless the owner explicitly asks for monitoring and the trial design allows it.

---

## 11. Three-way reconciliation

For high-impact claims compare:

```text
EVE INTERNAL CLAIM
vs
GOOGLE/GEMINI APPLICATION FORENSICS
vs
SENTINELX PHYSICAL HOST EVIDENCE
```

Classify:

- `THREE_WAY_MATCH`
- `APPLICATION_ONLY_UNCORROBORATED`
- `HOST_ONLY_UNEXPLAINED`
- `RUNTIME_DIVERGENCE`
- `ENVIRONMENT_MISMATCH`
- `INSUFFICIENT_EVIDENCE`

A disagreement is not automatically proof that one side is wrong. Trace the environment, timestamp, object ID, and execution ID first.

---

## 12. Current Eve Bookkeeping physical baseline categories

A read-only SentinelX baseline has already demonstrated why external assurance is required. It observed, among other things:

- the Zeabur host is a K3s server with separate Eve service pods and PVCs;
- Hermes, OpenClaw, local AI, and extraction services are physically reachable;
- current host load is low;
- physical scheduler/worker artifacts differ materially from some recent application reports;
- old test/canary artifacts remain on persistent volumes;
- multiple host-visible autonomous-daemon processes require ownership reconciliation;
- no current host-level Chrome process existed at the snapshot instant;
- production runtime provenance is not yet sufficiently tied to recent GitHub/build claims.

These are findings to reconcile, not permission for SentinelX to change production.

---

## 13. External assurance evidence model

Recommended record:

```text
externalEvidenceId
snapshotId
hostId
environmentClass
observationType
observedObject
observedValue
observedAt
relatedExecutionId
relatedDeploymentId
relatedEngagementId
proofMethod
sensitiveDataRedacted
result
notes
```

External evidence should be linkable to incidents but should remain distinguishable from Eve-generated evidence.

---

## 14. When external evidence should block certification

Examples:

- Google claims a deployment but pod/image/runtime fingerprint did not change;
- Eve claims a real browser journey but no persisted browser-session evidence exists and runtime execution does not corroborate it;
- Eve claims active extraction while worker state contains no matching job;
- Eve claims a new scheduler but the physical daemon is an older non-dispatching implementation;
- a production report claims a version/commit not present in the runtime;
- multiple scheduler leaders are active for one domain;
- a secret is exposed in command arguments;
- runtime data comes from a different environment than the certification report claims.

Certification should become `CONDITIONAL` or `BLOCKED` until explained.

---

## 15. Remediation workflow after external discrepancy

SentinelX should normally stop after observation.

Then the engineering workflow is:

```text
EXTERNAL OBSERVATION
→ OWNER/ENGINEERING DIAGNOSIS
→ DOCUMENTED REMEDIATION PLAN
→ AUTHORIZED CHANGE
→ DEPLOYMENT
→ APPLICATION VERIFICATION
→ SENTINELX POST-CHANGE CORROBORATION
```

Do not let external assurance silently fix what it finds unless the owner explicitly authorizes a remediation task.

---

## 16. Permanent invariants

1. **SentinelX is independent assurance, not production accounting authority.**
2. **Read-only is the default assurance mode.**
3. **Every physical-runtime claim should be corroboratable where practical.**
4. **Absence of a short-lived process in one snapshot is not conclusive historical proof.**
5. **Do not expose secrets while observing the host.**
6. **A production deployment should leave physical runtime evidence.**
7. **Heartbeat activity is not productive-work proof.**
8. **External observations remain timestamped and environment-specific.**
9. **Blind trials remain valid only if external observation causes zero mutation.**
10. **Application and host disagreements must be reconciled before strong certification.**
