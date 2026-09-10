# 21 — System-Wide Execution Topology, Side-Flow & Duplicate-Path Reconciliation Standard

**Status:** Authoritative design intent, audit standard, and remediation guidance. This document does **not** certify that the current runtime already satisfies every requirement below.

## Purpose

Eve has evolved through many implementation phases. Some capabilities were created before the current operating specifications existed. A recurring failure pattern has now been physically demonstrated: an implementation may look correct, return plausible outputs, expose the expected API, use the expected agent name, or produce a passing audit while still operating through a substitute, parallel, legacy, simulated, cached, fallback, or disconnected side path.

This document defines the permanent repository-wide method for finding, classifying, reconciling, repairing, and preventing those side flows.

> **The question is not whether a component exists. The question is whether the real production object entered the real production component, was processed by the real execution path, was durably handed to the next production component, and remained traceable through UI, report, audit, and learning.**

This standard must be read together with Documents 19–20. Document 19 defines physical execution and no-substitute-path truth. Document 20 defines physical assurance and acceptance gates. Document 21 extends those principles across the entire historical repository and runtime topology.

---

## 1. Permanent audit objective

For every material Eve capability, construct and verify the actual physical path:

```text
USER / EXTERNAL SOURCE / PRIOR AUTHORITATIVE OBJECT
→ UI / API / SCHEDULER ENTRY
→ ROUTE
→ SERVICE
→ QUEUE / JOB
→ AGENT / WORKER
→ TOOL / MODEL / DETERMINISTIC ENGINE
→ DURABLE OUTPUT
→ HANDOFF
→ NEXT CONSUMER
→ CANONICAL TRUTH
→ PRESENTATION
→ UI / REPORT / AUDIT / LEARNING
```

The audit must compare the **intended path** in Documents 00–20 against the **actual path** in code and runtime.

Every discovered path is classified as exactly one of:

- `PRIMARY_PRODUCTION_PATH`
- `VALID_FALLBACK_WITH_LIMITED_AUTHORITY`
- `TEST_ONLY`
- `ACADEMY_ONLY`
- `CANARY_ONLY`
- `REGRESSION_ONLY`
- `DEMO_ONLY`
- `LEGACY_INACTIVE`
- `DUPLICATE_PARALLEL_PATH`
- `SIMULATION_OR_SUBSTITUTE_PATH`
- `ORPHANED_PATH`
- `UNKNOWN_REQUIRES_RECONCILIATION`

No `DUPLICATE_PARALLEL_PATH`, `SIMULATION_OR_SUBSTITUTE_PATH`, `ORPHANED_PATH`, or `UNKNOWN_REQUIRES_RECONCILIATION` may remain eligible to create customer canonical truth, production UI truth, production deliverables, production audit conclusions, or production learning claims.

---

## 2. Repository-wide topology inventory

The reconciliation must inventory all material production-reachable:

- frontend routes and screens;
- backend routes;
- services;
- workers;
- queues;
- schedulers;
- heartbeat loops;
- cron/timers;
- agent registries;
- actual agent executors;
- model routers;
- deterministic fallback engines;
- storage adapters;
- caches;
- rehydrators;
- report generators;
- audit engines;
- Academy engines;
- canary/regression harnesses;
- legacy snapshots;
- test fixtures;
- synthetic datasets;
- source acquisition mechanisms;
- browser automation mechanisms;
- ingestion mechanisms;
- document parsers;
- format adapters;
- knowledge graph writers/readers;
- canonicalization services;
- presentation adapters;
- API serializers;
- UI data providers;
- identity/entity-resolution services;
- tenant/security layers;
- external integrations.

For each object record:

```text
componentId
componentType
repositoryPath
runtimeOwner
productionReachability
entryPoints
inputs
outputs
storesRead
storesWritten
queuesRead
queuesWritten
agentsCalled
toolsCalled
modelsCalled
fallbacks
callers
consumers
proofLevel
pathClassification
knownIncidents
supersededBy
```

---

## 3. Thirty mandatory side-flow reconciliation domains

### 3.1 Document extraction

Verify there is one authoritative production document-intelligence execution graph per format family and that older extractors, regex fallbacks, Academy parsers, XBRL helpers, PDF parsers, and Universal IR services do not independently create competing truth.

Check for:

- desired-field extraction before source inventory;
- shallow fallback promoted as complete extraction;
- extraction output defining its own denominator;
- source elements bypassing observations;
- facts created without source coordinates/identities;
- dropped parser chunks;
- format-specific side stores not consumed by canonicalization;
- multiple extractors producing incompatible object schemas.

**Repair standard:** designate one production orchestration path, route all eligible format adapters into Universal Document IR/custody, constrain fallbacks to explicit limited-authority outputs, preserve old paths as test/legacy only, and add negative tests preventing fallback promotion to deep-complete status.

### 3.2 Canonicalization

Find every service capable of writing or returning objects labeled canonical.

Check whether multiple engines can create independent `CANONICAL_FACT` values without reconciliation.

**Repair standard:** establish one scoped canonicalization authority or a formally reconciled canonicalization protocol. All candidate facts remain candidates until the authority accepts them. Every canonical object records the evidence/verification objects it supersedes or consolidates.

### 3.3 Document IR vs. financial extraction

Verify the financial/accounting pipeline actually consumes Universal IR/verified knowledge rather than a detached legacy facts array while the IR exists only for observability.

**Repair standard:** accounting consumers must receive durable object references originating from the same Document IR/custody path. Any direct legacy extraction feed must be migrated, constrained, or isolated.

### 3.4 Agent orchestration

Determine whether named agents actually receive discrete jobs or are merely method names/status labels inside a monolithic service.

**Repair standard:** applicable specialists require execution IDs, input/output manifests, persisted outputs, and acknowledged handoffs. One process may host several agents physically, but logical executions and custody boundaries must remain measurable.

### 3.5 Agent memory

Determine whether memory is actually queried by future work or merely logged.

**Repair standard:** distinguish `HISTORICAL_OBSERVABILITY`, `EPISODIC_MEMORY`, `SEMANTIC_MEMORY`, `WORKING_CONTEXT_CACHE`, and `AUTHORITATIVE_KNOWLEDGE`. For a memory claim to be operational, record the later execution that retrieved and used it.

### 3.6 Academy learning

Verify learning changes later behavior rather than just adding a learning record.

**Repair standard:** every learning case must identify source evidence, lesson, proposed change, validation method, promotion decision, effective version, and later measured outcome. No later effect means `LEARNING_RECORDED_NOT_YET_PROVEN`, not `LEARNED`.

### 3.7 Capability Architect / Darwin evolution

Verify a capability proposal leads through bounded test, approval, implementation/promotion, runtime activation, and measurement.

**Repair standard:** require `PROPOSED → TESTED → VALIDATED → APPROVED → PROMOTED → RUNTIME_ACTIVE → MEASURED`. Stored proposals cannot count as deployed capabilities.

### 3.8 Internal Audit and secondary assurance engines

Find every audit-like service: internal audit, journey audit, presentation audit, lineage audit, report audit, completeness audit, canary audit, Minerva examination.

Check for shared success flags, circular denominators, test fixtures, output-derived expectations, or self-attestation.

**Repair standard:** every independent assurance engine establishes its own evidence sample/denominator and fails closed if required evidence is unavailable.

### 3.9 Minerva examination

Verify question creation, answer-key/source inspection, and solver are physically isolated.

**Repair standard:** persist examiner execution, question set, allowed/denied resources, solver execution, score, misses, and source-side recall findings. Prevent source/web/answer-key access during source-denied exams.

### 3.10 UI data sourcing

Build a route-by-route/component-by-component map from visible surface to API/service/store.

Check for mock merges, presentation-only caches, hardcoded counters, detached summaries, independently generated cards, default companies, and stale routes.

**Repair standard:** every material UI surface consumes authoritative scoped objects through registered presentation contracts. Empty data must render honest empty/review states rather than substitutes.

### 3.11 Financial statement screens

Inspect Income Statement, Balance Sheet, Cash Flow, Equity, ratios, trends, consolidations, FX, and related statements.

**Repair standard:** display values must derive from canonical/derivation IDs; formatting fallbacks may format presentation only and may never synthesize missing values.

### 3.12 Charts and analytics

Inventory every active chart/graph/KPI series.

**Repair standard:** every material point references canonical or derivation identities, period, unit/currency, and evidence lineage. Generated trend arrays cannot be production truth unless they are explicit derivations from authoritative operands.

### 3.13 Reports and Report Wizard

Verify reports consume the same canonical objects as UI rather than rebuilding financial truth in a detached report model.

**Repair standard:** report sections preserve source canonical/derivation identities, artifact version/hash, review status, and report-generation execution. UI/report discrepancies become incidents.

### 3.14 Copilot / Ask Eve / Q&A

Verify question answering retrieves persisted engagement knowledge rather than silently rereading source, querying the web, or using a separate stale vector index when source-denied behavior is claimed.

**Repair standard:** define permitted retrieval scopes per mode. Persist retrieval object IDs. Separate `KNOWLEDGE_ONLY`, `SOURCE_ASSISTED`, and `WEB_ASSISTED` answers visibly and in provenance.

### 3.15 PBC workflow

Trace actual Clara request to actual customer-facing response and resulting evidence/intake.

**Repair standard:** one durable PBC object graph must connect request, delivery, customer response, attachments, intake, clearance, review, and audit history.

### 3.16 Review notes

Determine whether Athena/Quinn review is substantive or status-based.

**Repair standard:** review objects must cite actual workpapers/evidence/canonical objects, contain issuer/engagement-specific reasoning, and record clearance execution.

### 3.17 Entity resolution

Verify entity-resolution UI/graph decisions govern downstream accounting identity rather than existing alongside name-string based processing.

**Repair standard:** downstream objects use stable entity IDs. Name similarity never becomes merge authority. Ambiguities create durable clarification candidates.

### 3.18 Client / project / engagement identity

Find prefix inference, default IDs, implicit selected-company state, or inconsistent classification semantics.

**Repair standard:** classification is a first-class authoritative field, not inferred from ID strings or names. All objects carry stable project/engagement/entity scope.

### 3.19 Historical data and quarantine

Verify old/synthetic/incorrect records are not merely hidden from UI while remaining queryable by canonicalization, agents, reports, Q&A, indexes, or Academy production evaluation.

**Repair standard:** quarantine status must be enforced at every production read boundary. Historical artifacts remain immutable but ineligible unless explicitly requested for historical analysis.

### 3.20 Caches and rehydration

Inventory report caches, graph caches, in-memory state, disk rehydration, browser caches, model caches, derived summaries, and startup hydration.

**Repair standard:** every cache records authoritative source version/hash and invalidation semantics. Cache misses cannot activate synthetic defaults. Rehydration must preserve classification and supersession.

### 3.21 Model fallback

Inspect `MODEL_FALLBACK`, `DETERMINISTIC_FALLBACK`, local model fallback, cloud escalation, and timeout routing.

**Repair standard:** each fallback declares the maximum authority of its output. A deterministic classifier may classify structure but cannot claim semantic/accounting conclusions beyond its validated contract. Proof/completeness must degrade visibly when capability degrades.

### 3.22 Worker fallback

Inspect extraction-worker local fallback and worker-unavailable behavior.

**Repair standard:** fallback results remain tagged with execution path, coverage limitations, and required verification. A recovery path cannot silently claim equivalence to the primary deep extractor unless independently proven equivalent for that artifact.

### 3.23 Observability vs. reality

Determine whether progress/stage events originate from physical job/object transitions or are merely orchestration narratives.

**Repair standard:** every material progress event references execution/job/object IDs. `PROCESSING`, `REVIEWED`, `UPLOADED`, `AUDITED`, and `COMPLETED` cannot be emitted solely because a controller advanced its own state machine.

### 3.24 Scheduler / heartbeat

Inventory every scheduler, heartbeat, cron, interval, queue consumer, background worker, and Academy loop.

**Repair standard:** assign explicit workload ownership, priority, lock/lease semantics, wake cadence, stall detection, and non-dispatch reasons. Prevent duplicate schedulers from independently acting on the same engagement.

### 3.25 Multiple server/API implementations

Identify legacy and new route families that perform conceptually identical operations, including `/api/workspaces`, `/api/documents`, `/api/cpa/*`, test routes, compatibility adapters, and old server modules.

**Repair standard:** establish canonical production endpoints/services, migrate active callers, retain compatibility only where explicitly versioned, and prevent legacy write paths from creating competing truth.

### 3.26 Legacy snapshot and test imports

Prove `legacy_snapshot`, old mock data, canary fixtures, demo assets, and test helpers cannot be imported or referenced by production bundles/runtime paths.

**Repair standard:** build-time/import guards and negative tests must fail if forbidden modules become production reachable.

### 3.27 Delivery state

Verify generated, reviewed, approved, publishable, delivered, superseded, and quarantined states are distinct.

**Repair standard:** physical artifact generation cannot automatically imply review or customer delivery. Persist state transitions and actors/executions.

### 3.28 Security and tenant isolation across AI/query layers

HTTP IDOR tests are insufficient if shared graphs, vector indexes, caches, model context, or memory retrieval can cross tenant scope.

**Repair standard:** apply tenant/engagement scoping to storage queries, semantic retrieval, caches, agent context construction, report compilation, and Q&A. Add negative cross-tenant retrieval tests.

### 3.29 File-format universality

Do not infer universal document intelligence from one successful HTML/iXBRL path.

Audit actual production paths for PDF, scanned PDF/image, XLSX, CSV, DOCX, HTML/iXBRL, text, ZIP/package, and multilingual artifacts where supported.

**Repair standard:** every adapter terminates in the shared custody/IR contract and publishes explicit capability/coverage limitations. Unsupported information becomes unresolved, never silently dropped.

### 3.30 Multi-currency, multi-entity, consolidation and specialty accounting

Verify FX, consolidation, eliminations, subsidiaries, functional/presentation currencies, tax, leases, debt, valuations, regulatory accounting, and specialty modules participate in the primary engagement graph rather than existing as disconnected feature screens.

**Repair standard:** specialty modules consume scoped canonical/verified inputs and return derivations/reconciliation objects to the same engagement truth graph with full operand lineage.

---

## 4. Additional mandatory search domains

The auditor must also investigate any analogous failure class discovered during the review, including but not limited to:

- duplicated schema definitions with different semantics;
- duplicated write stores;
- direct database/file writes bypassing service contracts;
- status fields that can be set without evidence gates;
- helper methods whose names imply stronger proof than their behavior;
- generated timestamps/history reconstructed after completion;
- report/dashboard data populated from observability events rather than authoritative stores;
- orphaned background workers;
- dead code still runtime reachable;
- environment-dependent paths that differ between preview and production;
- local development fixtures loaded when production data is empty;
- hardcoded formulas/values in presentation layers;
- seed-on-start behavior;
- first-run auto-population;
- synthetic data mixed into discovery pools;
- manual-only steps incorrectly labeled autonomous;
- hidden human/operator dependencies;
- model/tool calls that never persist outputs;
- missing handoff acknowledgements;
- temporary state destroyed before custody;
- duplicate report IDs/artifacts;
- stale superseded canonical facts still returned by APIs;
- source transformations without input/output hashes;
- background jobs that claim completion despite downstream failure;
- retry loops that create duplicate writes;
- repair routines that rewrite history rather than supersede it.

---

## 5. Physical path evidence standard

For every material capability, the audit must produce at least one representative forward trace and one reverse trace.

### Forward trace

```text
ENTRY EVENT
→ OBJECT IDs
→ JOB/EXECUTION
→ TOOL/MODEL
→ OUTPUT OBJECTS
→ HANDOFF
→ CONSUMER
→ CANONICAL/PRESENTATION/REPORT
```

### Reverse trace

```text
VISIBLE/UI/REPORT/AUDIT CLAIM
→ PRESENTATION/REPORT CONTRACT
→ CANONICAL/DERIVATION OBJECT
→ VERIFIED OBJECT
→ DATAPOINT/RELATIONSHIP/ASSERTION
→ OBSERVATION
→ SOURCE ELEMENT
→ PHYSICAL SOURCE ARTIFACT
→ ACQUISITION/UPLOAD EVENT
```

If the chain cannot be completed, mark the capability `PARTIAL` or `FAIL`. Do not fill missing links with architectural assumptions.

---

## 6. Side-flow failure classes

Use standardized findings:

- `SUBSTITUTE_IMPLEMENTATION`
- `DUPLICATE_PRODUCTION_WRITER`
- `DETACHED_PRESENTATION_SOURCE`
- `DETACHED_REPORT_SOURCE`
- `LEGACY_RUNTIME_PATH`
- `SYNTHETIC_PRODUCTION_REACHABILITY`
- `SHALLOW_FALLBACK_OVERPROMOTION`
- `AGENT_EXECUTION_NOT_PROVEN`
- `AUDIT_SELF_ATTESTATION`
- `LEARNING_EFFECT_NOT_PROVEN`
- `CACHE_AUTHORITY_AMBIGUITY`
- `SCOPE_ISOLATION_BYPASS`
- `TEMPORARY_STATE_LOSS_RISK`
- `UNACKNOWLEDGED_HANDOFF`
- `ORPHANED_STORE`
- `ORPHANED_WORKER`
- `PROOF_LEVEL_OVERPROMOTION`
- `STATUS_WITHOUT_EVIDENCE`
- `SOURCE_TRANSFORMATION_UNTRACKED`
- `HISTORY_RECONSTRUCTION_NOT_RUNTIME_EVENT`

Every finding records first causal failure where knowable, not merely the surface symptom.

---

## 7. Remediation decision framework

For each finding choose one remediation class:

### A. Route to existing production capability
Use when a correct production service already exists but a caller uses a duplicate/side path.

Actions:
1. preserve evidence of old path;
2. migrate caller to canonical path;
3. reconcile schemas/IDs;
4. add negative regression test;
5. deprecate/isolate old path;
6. verify physical trace.

### B. Constrain a valid fallback
Use when fallback is useful but currently overclaims authority.

Actions:
1. document fallback capability boundary;
2. mark outputs with execution path/proof limit;
3. require downstream verification/escalation;
4. prevent complete/canonical/audited promotion beyond authority;
5. test degraded mode.

### C. Merge duplicate implementations
Use when two services perform the same conceptual production responsibility.

Actions:
1. choose canonical implementation based on actual capability and compatibility;
2. migrate state/readers/writers safely;
3. maintain supersession/migration evidence;
4. remove duplicate writer reachability;
5. test idempotency and historical readability.

### D. Isolate test/synthetic path
Use when a path is legitimate for Academy/test but production reachable.

Actions:
1. classify path explicitly;
2. move behind test-only namespace/configuration;
3. block production imports/runtime calls;
4. add guard tests;
5. preserve historical fixtures.

### E. Implement missing real capability
Use when only simulation/representation exists.

Actions:
1. define physical input/output contract;
2. implement production capability;
3. connect to existing custody/job graph;
4. physically acceptance-test;
5. remove substitute eligibility;
6. verify UI/report/audit consumers.

### F. Quarantine contaminated data
Use when synthetic/incorrect objects entered active stores.

Actions:
1. preserve original evidence/history;
2. mark non-authoritative/quarantined;
3. identify downstream uses;
4. rebuild eligible objects from authoritative evidence;
5. supersede, never rewrite historical artifacts;
6. validate active-store purity.

---

## 8. Safe automatic repair policy

A reconciliation agent may automatically repair a finding only if all of the following are true:

- intended architecture is unambiguous in Documents 00–21;
- repair is generalized, not company/customer-specific;
- historical evidence can be preserved;
- tenant/security boundaries are maintained;
- no production truth must be guessed;
- tests can verify the repair;
- no unresolved owner-policy decision is required.

If these conditions are not met, create `OWNER_REVIEW_REQUIRED` with concrete alternatives and impact.

Automatic repair must never:

- invent evidence;
- fabricate missing source;
- silently merge entities;
- rewrite historical reports/incidents;
- delete forensic evidence;
- lower audit standards to obtain a pass;
- hardcode an issuer/customer answer;
- create a new duplicate production path merely to satisfy a test.

---

## 9. Audit → repair → verify loop

For each finding:

```text
OBSERVE
→ PROVE PHYSICAL FAILURE
→ IDENTIFY FIRST CAUSAL FAILURE
→ CLASSIFY PATH
→ IDENTIFY CANONICAL TARGET ARCHITECTURE
→ PRESERVE FORENSIC EVIDENCE
→ APPLY SMALLEST GENERALIZED SAFE REPAIR
→ TEST LOCALLY/IN ISOLATION
→ VERIFY PHYSICAL PRODUCTION PATH
→ RUN NEGATIVE BYPASS TEST
→ RECONCILE UI/REPORT/AUDIT CONSEQUENCES
→ RECORD REMEDIATION
→ CONTINUE AUDIT
```

Do not stop after a code edit. `FIXED` requires post-repair physical verification.

---

## 10. Remediation record

Every repaired finding must produce a durable record containing:

```text
findingId
findingClass
severity
observedBehavior
expectedBehavior
firstCausalFailure
originatorComponent
affectedPaths
affectedStores
affectedCustomers/engagements
historicalContaminationScope
canonicalTargetPath
repairSummary
filesChanged
schemasChanged
migrationPerformed
forensicEvidencePreserved
testsRun
negativeTestsRun
physicalVerificationEvidence
remainingLimitations
proofLevelAfterRepair
ownerReviewRequired
commitSha
```

---

## 11. Severity

- `P0_CRITICAL_TRUTH_OR_SECURITY` — wrong/synthetic/cross-tenant customer truth, fabricated evidence, broken source identity, delivery of materially unsupported outputs.
- `P1_PRODUCTION_PATH_BLOCKER` — substitute browser/source/agent/audit path, duplicate canonical writer, missing custody, side flow capable of affecting production.
- `P2_OPERATIONAL_OR_LEARNING` — memory/learning/capability/scheduler behavior materially weaker than intended without immediate customer-truth corruption.
- `P3_PRESENTATION_OR_QUALITY` — truthful backend but misleading/incomplete UX, observability, labels, or non-material presentation problems.
- `INFO` — documented inactive legacy/test paths with correctly enforced boundaries.

---

## 12. Report format

A repository-wide reconciliation report must include:

1. Executive verdict.
2. Current commit/runtime/environment.
3. Intended physical execution graph.
4. Discovered actual execution graph.
5. Component inventory.
6. All 30 mandatory domain verdicts.
7. Additional discovered domains.
8. Duplicate/side-flow inventory.
9. Production-reachable synthetic/test inventory.
10. Active stores and writers/readers.
11. UI route/API/store map.
12. Agent job/handoff map.
13. Scheduler/worker ownership map.
14. Audit/Minerva independence map.
15. Learning/evolution effect map.
16. Security/tenant retrieval map.
17. Format-adapter map.
18. Findings by severity.
19. Repairs completed.
20. Repairs requiring owner review.
21. Physical post-repair proofs.
22. Negative bypass tests.
23. Remaining unknowns.
24. Current production acceptance recommendation.

Do not issue `PASS` merely because code compiles or tests pass. The strongest conclusion must match the strongest evidence.

---

## 13. Permanent prevention rules

For all future engineering:

1. Every new capability must declare where it attaches to the existing production execution graph.
2. Every new store must declare authoritative/non-authoritative status, writers, readers, retention, versioning, and supersession.
3. Every new agent must declare actual job trigger/input/output/handoff; registry-only agents are `CONFIGURED`, not executing.
4. Every new UI surface must register its authoritative data contract.
5. Every new report value must trace to canonical/derivation identity.
6. Every fallback must declare its authority ceiling.
7. Every test/synthetic path must be production-ineligible by construction.
8. Every proof-level promotion requires evidence.
9. Every Academy learning claim requires later measurable effect.
10. Every duplicate conceptual production implementation requires explicit reconciliation before release.

---

## 14. Formal completion standard

System-wide reconciliation is complete only when:

- all production entry points have mapped physical execution paths;
- all production writers/readers/stores are known;
- all production-reachable substitute paths are removed, isolated, or constrained;
- every material UI/report/audit claim has a real reverse trace;
- applicable agents have real execution/handoff evidence;
- fallbacks cannot over-promote authority;
- synthetic/test/legacy data cannot enter customer truth;
- Academy/Internal Audit/Minerva independence is physically demonstrated;
- remaining unknowns are explicitly recorded rather than guessed.

A clean architecture diagram is not completion. A physically reconciled runtime is completion.
