# 23 — Runtime Authority, Deployment Identity & Environment Parity

**Status:** Authoritative design intent and implementation guidance. This document does **not** certify that any environment currently satisfies these requirements.

**2026-09-15 amendment:** Section 16 makes the existing shared-backend requirement explicit for Google AI Studio preview, Google shared/published UI, and Zeabur UI. The observed failure and bounded repair directive are in [Frontend Runtime Repair — 2026-09-15](FRONTEND_RUNTIME_REPAIR_2026-09-15.md). This is not authorization to restart Company 1, arm Academy, or replace the architecture.

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
10. verify a real production-safe end-to-end path;
11. invalidate any prior certification that assumed the new code was already running;
12. issue a new autonomous handoff boundary after the last mutation.

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

---

## 16. Shared frontend/backend contract — 2026-09-15

### 16.1 Owner-facing environments are entry points, not separate accounting stores

When explicitly connected in LIVE mode, the existing Google AI Studio development preview, Google shared/published application, and Zeabur-hosted UI must reach the same authorized Eve production backend and canonical data namespace. Merely importing or synchronizing the same repository does not establish this connection.

For EACH surface record the actual browser/iframe origin, frontend build identity, server/proxy configuration, resolved API origin, backend fingerprint, API schema, authenticated tenant scope, data revision, and access mode. Do not infer the shared/published URL from the Studio editor URL. Discover and verify the actual URLs and authentication behavior separately.

The checkpoint public origin is `https://eves-worker.zeabur.app/`; despite its name it was observed serving the core application. Revalidate its role rather than routing by the word "worker". Internal service addresses are not browser API destinations. The observed core listener was port 3000; the value of a generic PORT variable was not reliable proof of the listener. Use actual service routing and runtime observations.

### 16.2 Supported transport, not a blanket fetch replacement

Inspect existing routing first, then use the smallest supported shared API connection. Either a correctly authenticated direct HTTPS API or a controlled same-origin backend-for-frontend/proxy can satisfy the contract. A new application, public open proxy, or database migration is not required by this document.

The connection must cover queries, authorized mutations, uploads, downloads, polling, and any event stream—not only the dashboard's first request. Inventory direct component fetches as well as the central client. Do not blindly replace all `fetch` calls, change unrelated external-resource requests, or install an arbitrary-URL forwarding endpoint.

When proxying, fix the upstream destination server-side, allow only intended API routes/methods, preserve validated user/tenant context, handle errors explicitly, and prevent server-side request forgery and credential forwarding to arbitrary hosts. A server-held service credential by itself must not give every preview visitor access to all customers.

When using browser cross-origin requests, validate exact controlled origins and the actual session/credential flow. Test browser cookies, preflight, CSRF protections for relevant mutations, logout, expired sessions, and unauthorized scopes. Do not use broad CORS rules or spoofed email/role headers to make a broken connection appear to work.

Provider keys, worker credentials, fallback passwords, database credentials, and administrative tokens never belong in browser code, browser storage, URLs, screenshots, or public runtime fingerprints. Client-exposed build variables may contain non-secret API configuration only. Config/flag fingerprints must exclude secret values and secret-derived hashes.

### 16.3 Explicit operating modes and one scheduler

Use existing configuration mechanisms where possible; document the actual names chosen rather than pretending the following conceptual mode names already exist.

- LIVE_READ_ONLY: authorized access to production records, no production intake, approvals, or scheduling from the preview.
- LIVE_AUTHORIZED: only the actions allowed to the real authenticated user, through the canonical production API and normal approval gates.
- ISOLATED_TEST: clearly labeled fixtures and separate stores, never presented as production state.

For this visibility repair, begin with LIVE_READ_ONLY. Inspecting reports does not authorize customer writes. Fail closed when the backend identity, schema, session, or mode is missing or incompatible. Do not fall back to a local empty database or canary.

A Google frontend/proxy runtime connected to production must NOT initialize a second production queue, scheduler leader, local accounting-truth store, Academy executor, model worker, or synthetic entity seeder. Only canonical Eve services execute the business workflow. Browser/proxy replicas do not gain scheduler authority.

### 16.4 One storage resolver and canonical relationships

Every customer query must resolve the same configured authoritative store. At the checkpoint, server.ts read `storage/ai_cpa_storage.json` under the application directory, resolving to `/storage/ai_cpa_storage.json`; the universal engagement reader instead attempted the missing `/app/ai_cpa_storage.json`.

Repair that mismatch in the shared resolver/read model. Do not copy the database to the wrong path, drop a symlink merely to mask divergent logic, or replicate production JSON into Google. Any legacy compatibility resolver must be explicit, tested, read-only where appropriate, and derived from canonical identity—not another writer.

Unify workspace, continuation, engagement, facts, evidence, and versioned reports through stored relationships. A report-file scan with guessed client IDs, dates, stages, or scores is not a canonical customer projection. Preserve old versions and failed attempts without allowing them to replace the current selected version.

### 16.5 Runtime identity must be visible and safe

Use an existing fingerprint endpoint or add a minimal read-only one with fields appropriate to its caller. The UI should show environment/mode, frontend release, backend release, schema compatibility, and last successful data synchronization without exposing administrative topology or secrets to unauthorized users.

Build identity must come from build provenance. A manually set SOURCE_GIT_COMMIT_SHA is a claim to compare against actual artifact identity, not proof. At the checkpoint it still contained an older SHA even though the executing server hash matched the repaired build. Correct that mismatch through the approved configuration/build process; do not rewrite labels to manufacture acceptance.

Do not auto-deploy documentation edits without considering source-triggered deployment hooks. Code, frontend assets, and backend compatibility must be reconciled across Studio and production before replacing any live service. Preserve newer legitimate commits and the current runtime data.

### 16.6 Parity acceptance

For a common authorized scope and compatible data revision, demonstrate:

`same workspace → same document/hash → same job/attempt → same eligible/unique counts → same evidence → same current report/version → same review and delivery limits`

Run the existing UI journey on Studio preview, the actual Google shared/published surface, and Zeabur UI. Mark inaccessible surfaces BLOCKED_ACCESS and unexecuted journeys NOT_EXECUTED. One host passing does not imply another passed. Record any legitimate revision changes while comparing results.

A disconnected browser must clearly show a connection failure. A TEST-mode browser must clearly show TEST. Neither may fabricate the appearance of live customer work. Loading a page must not mutate canonical work or activate Academy.

### 16.7 Platform references

These explain available platform behavior, not evidence that Eve is configured correctly. Recheck them when implementing a platform-dependent change.

- Google AI Studio build/runtime and GitHub sync: https://ai.google.dev/gemini-api/docs/aistudio-build-mode
- Google AI Studio server-side runtime: https://ai.google.dev/gemini-api/docs/aistudio-fullstack
- Vite client-exposed environment variables: https://vite.dev/guide/env-and-mode

The project requirement remains the same regardless of platform UI changes: one authorized production data reality, explicitly connected frontends, no secret exposure, and physical browser proof.
