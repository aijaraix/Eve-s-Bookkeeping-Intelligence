# 23 — Runtime Authority, Deployment Identity & Environment Parity

**Status:** Authoritative design intent and implementation guidance. This document does **not** certify that any environment currently satisfies these requirements.

## Purpose

Eve can be built, previewed, tested, deployed, and observed across more than one environment. A recurring failure class is that an implementation exists and passes tests in one environment while reports describe it as though it is running in the authoritative production environment.

This document makes environment identity a first-class part of every production claim.

> **Build is not deployment. Deployment is not runtime verification. Runtime verification is not product verification. Product verification is not browser verification.**

No agent, audit, report, or owner summary may collapse these distinctions.

---

## 1. Environment classes

Every execution environment must be classified explicitly as one of, or mapped to, these classes:

- `LOCAL_DEVELOPMENT`
- `AI_STUDIO_DEVELOPMENT`
- `CLOUD_PREVIEW`
- `CI_TEST`
- `STAGING`
- `PRODUCTION_FRONTEND`
- `PRODUCTION_BACKEND`
- `PRODUCTION_WORKER`
- `PRODUCTION_ORCHESTRATION`
- `PRODUCTION_STORAGE`
- `EXTERNAL_ASSURANCE_OBSERVER`
- `OTHER_EXPLICITLY_CLASSIFIED`

A deployment may span multiple environments. Eve may therefore have a production topology such as frontend in one platform and orchestration/workers/storage in another. The architecture must represent that split rather than pretending the entire product runs in one place.

---

## 2. Runtime Authority Manifest

Maintain a durable `RuntimeAuthorityManifest` or equivalent authoritative contract that identifies the runtime responsible for each production capability.

At minimum include:

```text
componentId
componentRole
environmentClass
platform
project/environment identifier
service identifier
region
network identity
repository
branch
sourceCommitSha
buildId
artifactDigest
containerImageDigest where applicable
deploymentGeneration
runtimeInstance/pod identity
runtimeStartedAt
configurationHash
schemaVersion
featureFlagSetHash
persistentStorageIdentity
healthEndpoint
readinessEndpoint
public/internal endpoint classification
owner
lastDeploymentAt
lastRuntimeVerificationAt
proofLevel
```

Never infer production authority from a component name.

---

## 3. Capability-to-runtime mapping

The manifest must explicitly map the authoritative runtime for at least:

- customer frontend;
- authentication/session layer;
- client/project/engagement API;
- upload/intake API;
- source acquisition;
- browser customer simulator;
- document-intelligence API;
- extraction worker;
- Universal Document IR;
- canonical data store;
- Hermes orchestration;
- OpenClaw;
- local AI/Ollama;
- model gateway/cloud escalation;
- PBC/clarification;
- review;
- report generation;
- Internal Audit;
- Minerva;
- Academy/Learning Dean;
- scheduler/heartbeat;
- incident/failure store;
- report/artifact store;
- external runtime assurance.

If two services can write the same authoritative object class, that must be intentional, reconciled, and documented. Otherwise it is a duplicate truth-producing path.

---

## 4. No cross-environment proof promotion

The following are prohibited:

- code passing in Google AI Studio being reported as deployed on Zeabur;
- a Cloud Run preview result being reported as physical Zeabur runtime proof;
- a GitHub commit being reported as the running commit without runtime fingerprint evidence;
- an acceptance fixture being reported as a production engagement;
- a browser journey against a preview environment being reported as verification of a different production frontend;
- a local/CI worker test being reported as proof that the Zeabur worker executed;
- a source file created in one environment being attributed to another environment without custody evidence.

Every evidence object must carry environment identity.

---

## 5. Runtime fingerprint

Every production service must expose or durably persist a machine-readable runtime fingerprint.

Recommended fields:

```text
service
version
repository
commitSha
buildId
artifactDigest
imageDigest
builtAt
deployedAt
startedAt
schemaVersion
configHash
featureFlagsHash
environmentClass
platform
```

A `/build-info`, `/runtime-info`, or equivalent read-only endpoint is recommended.

Secrets must never appear in this endpoint.

The runtime fingerprint must be generated from the deployed artifact/build process, not manually typed into an owner report.

---

## 6. Deployment parity equation

For a service to claim that GitHub code `G` is physically running in production, all applicable links must reconcile:

```text
GITHUB_COMMIT
→ BUILD_INPUT
→ BUILD_ARTIFACT
→ ARTIFACT/IMAGE_DIGEST
→ DEPLOYMENT_SPEC
→ RUNNING_INSTANCE
→ RUNTIME_FINGERPRINT
```

If any link is missing, classify the strongest proof actually available.

A matching service name is not parity proof.

---

## 7. Frontend/backend split

When the frontend and backend run in different environments, preserve a request trace:

```text
BROWSER SESSION
→ FRONTEND BUILD/FINGERPRINT
→ API REQUEST
→ BACKEND SERVICE/FINGERPRINT
→ WORKER/ORCHESTRATOR JOB
→ PERSISTENT OBJECT
→ API RESPONSE
→ RENDERED UI STATE
```

This prevents a correct frontend preview from masking an old production backend or vice versa.

---

## 8. Production release claim contract

A release claim must state explicitly:

```text
WHAT changed
WHERE it was built
WHERE it was deployed
WHICH service was rolled
WHICH commit produced it
WHICH image/artifact digest is running
WHICH persistent stores were preserved/migrated
WHEN rollout completed
HOW runtime parity was verified
HOW product behavior was verified
WHETHER browser verification occurred
```

Forbidden report language:

- `implemented in production` when only code exists;
- `deployed` when only a build artifact exists;
- `runtime verified` when only static code was inspected;
- `browser verified` when only API/component tests were run.

---

## 9. Environment drift detector

Continuously or periodically compare intended runtime authority against actual runtime fingerprints.

Detect at minimum:

- GitHub head newer than deployed commit;
- deployed image not traceable to expected build;
- stale pod/process after claimed deployment;
- mismatched schema/config versions;
- feature flags differing from release manifest;
- frontend/backend version incompatibility;
- old worker/orchestrator still processing jobs after replacement;
- runtime service absent despite documentation saying active.

Create `RUNTIME_ENVIRONMENT_DRIFT` incidents when material.

---

## 10. Build/test environments are useful but bounded

Google AI Studio, Cloud preview, CI, and development environments may be used to:

- design;
- implement;
- compile;
- run unit/integration tests;
- exercise safe fixtures;
- generate build artifacts;
- validate schemas;
- validate negative tests.

They may not independently establish that the production service is running the new implementation.

---

## 11. Runtime claims in Internal Audit and Minerva

Internal Audit and Minerva must record the environment from which each piece of evidence came.

If the engagement ran in Zeabur but the audit inspects only a Google preview, the audit must say so and cannot certify the Zeabur physical path.

A production unqualified opinion requiring runtime proof must validate the authoritative runtime manifest and fingerprints first.

---

## 12. Current Eve topology principle

The authoritative runtime may be hybrid. Do not force architectural components onto a single host merely for conceptual simplicity.

Instead require explicit ownership:

```text
CAPABILITY → AUTHORITATIVE SERVICE → PLATFORM → STORAGE → VERSION → HEALTH → PROOF
```

That relationship is authoritative, not the assumption that `Eve` means one machine.

---

## 13. Required remediation when parity fails

When code/runtime parity is broken:

1. preserve the current runtime evidence;
2. identify the intended authoritative code/version;
3. identify every affected production service;
4. determine whether state/schema migration is required;
5. build immutable artifacts;
6. record artifact/image digests;
7. deploy through the real platform;
8. verify rollout instance age/generation;
9. verify runtime fingerprint;
10. verify health and readiness;
11. verify a real production-safe end-to-end path;
12. invalidate any prior certification that assumed the new code was already running;
13. issue a new autonomous handoff boundary after the last mutation.

Do not repair parity by changing documentation to match stale code unless stale code is intentionally the accepted production version.

---

## 14. Acceptance tests

At minimum verify:

1. A GitHub change that is not deployed cannot be labeled production.
2. A deployment changes the runtime fingerprint and running instance identity.
3. The running image/artifact traces back to the claimed commit.
4. Frontend and backend fingerprints are visible independently.
5. A stale worker is detected after a newer release claim.
6. Audit evidence records its environment.
7. A blind-cohort handoff is invalidated when production code changes after handoff.
8. External runtime observation can independently corroborate the running instance.

---

## 15. Permanent invariants

1. **Every production claim names the environment it refers to.**
2. **Every production service has one declared authoritative runtime.**
3. **GitHub commit identity alone is not deployed-runtime identity.**
4. **A build is not a rollout.**
5. **A rollout is not verified until the running instance proves the expected artifact.**
6. **Cross-environment evidence may corroborate, but may not silently substitute.**
7. **A blind/autonomous certification window restarts after any production mutation.**
8. **Owner reports must distinguish code, build, deployment, runtime, product, and browser proof.**
