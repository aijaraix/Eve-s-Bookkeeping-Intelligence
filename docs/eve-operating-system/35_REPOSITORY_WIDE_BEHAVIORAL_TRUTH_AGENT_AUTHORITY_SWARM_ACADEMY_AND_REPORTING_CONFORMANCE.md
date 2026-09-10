# 35 — Repository-Wide Behavioral Truth, Agent Authority, Swarm, Academy & Reporting Conformance

**Status:** Authoritative implementation and acceptance directive. Read after Documents 00–34. This document closes interpretation loopholes repeatedly observed when an implementation creates the name, interface, status, artifact, agent label, browser trace, test shape, or report appearance of a required capability without physically performing the required behavior.

## Purpose

Eve must be evaluated by what the production system physically does, not by what a class, method, JSON record, UI card, test name, agent name, report, or status string says happened.

This document applies repository-wide to production source, runtime services, Document Intelligence, custody, queues, schedulers, agents, swarms, memory, model routing, skills, entity resolution, canonical truth, UI, reports, Internal Audit, Minerva, Academy, learning, and external observation.

Permanent execution rule:

`REQUIRED BEHAVIOR → PHYSICAL EXECUTION → DURABLE EVIDENCE → INDEPENDENT VERIFICATION → CLAIM`

Never reverse that relationship by creating a claim first and making the evidence resemble it afterward.

---

## 1. Operational meaning beats structural resemblance

The following do **not** prove a capability by themselves:

- a class/file with the correct name;
- a method that returns the expected schema;
- an agent registry entry;
- a persisted JSON execution artifact;
- an API route;
- a browser process that bypasses the product UI;
- a test that searches source code for expected strings;
- a status such as `PASS`, `PRODUCT_VERIFIED`, `CERTIFIED`, `CLEARED`, or `COMPLIANT`;
- a generated report asserting that review/audit occurred;
- a fallback that returns successful-looking prose;
- a dashboard displaying accuracy/competency percentages.

Implementation agents must verify the **behavioral contract at the actual production boundary**.

---

## 2. Production starts empty of customer-like truth

Production-authority stores must not silently initialize customer-like truth merely because a map, graph, registry, database, or file is empty.

Forbidden production auto-seeding includes:

- example financial facts or canonical facts;
- example entities/subsidiaries/relationships;
- example lineage/presentation records;
- example reports;
- example PBC responses;
- example review clearances;
- example agent performance history;
- example completed scheduler work;
- company-specific historical expected values.

Allowed static initialization is limited to non-customer configuration such as schemas, generic accounting identities, role definitions, generic rules/taxonomy metadata, and explicitly classified Academy/test fixtures.

Every fixture/example must be classified as one of:

`SYNTHETIC_ACADEMY`, `REGRESSION`, `DEMO`, `FORENSIC`, `QUARANTINED_NON_AUTHORITATIVE`.

Isolation is enforced at **read boundaries**. A production read with no customer truth returns empty/unresolved, never example truth.

---

## 3. Examiner / solver / production-memory isolation

Minerva sealed truth, golden answers, expected values, examiner-generated questions, withheld source excerpts, answer keys, and grading material may not be retrievable from:

- firm-shared solver memory;
- HERMES or line-agent memory;
- Copilot / Ask Eve retrieval indexes;
- generic memory/search APIs;
- prompts or context supplied to solver agents;
- common temporary files readable by examiner and solver;
- customer canonical truth stores.

Required separation:

`EXAMINER_VAULT ≠ SOLVER_KNOWLEDGE ≠ CUSTOMER_TRUTH`.

For source-denial evaluation, Minerva independently creates/holds the test, solver execution sees only persisted Eve knowledge, and grading occurs only after solver output is frozen.

A benchmark stored in shared firm memory is **not sealed**.

---

## 4. Canonical role and authority matrix

Maintain one machine-readable canonical role catalog. Aliases may resolve to a role but may not create independent authority.

For every persistent agent, director, reviewer, or deterministic specialist define:

```text
agentId / engineId
role
runtimeType
mandatoryOrConditional
allowedInputClasses
allowedWrites
allowedTools
prohibitedActions
canCreateObservations
canCreateAssertions
canVerify
canPromoteCanonical
canBlock
canApproveDelivery
requiredIndependentVerifier
memoryNamespace
version
```

Allowed `runtimeType` examples:

- `REAL_AI_AGENT`
- `DETERMINISTIC_SPECIALIST_ENGINE`
- `ORCHESTRATOR`
- `HUMAN_REVIEW_REQUIRED`
- `EXAMINER_ONLY`
- `LEARNING_GOVERNANCE`

### Authority separation

- **HERMES** routes, schedules, blocks, and coordinates; it does not manufacture missing accounting truth or approve its own conclusions.
- **Document Intelligence** inventories/extracts; completion of parsing does not self-certify completeness.
- **LEDGER / ATLAS / MERCURY / LEXICON** create specialized interpretations from actual evidence and retain upstream references.
- **EUCLID** recomputes mathematical identities independently.
- **VERITAS** independently re-reads/re-hashes eligible custody/evidence and validates source locators.
- **ATHENA** performs technical accounting reasoning; presence of extracted facts is not evidence that a standard is complied with.
- **ARGUS** challenges contradictions/anomalies and may reopen upstream work.
- **CLARA** manages actual clarification/PBC state and never invents the customer side.
- **QUINN** reviews actual workpapers/exceptions and may reopen/block/clear; it does not create the workpaper it reviews.
- **SCRIBE** renders eligible cleared knowledge; it never invents missing facts/citations/signatures to finish a report.
- **SENTINEL** may block unsafe transitions and monitor operational controls; it does not fix accounting values to make them pass.
- **INTERNAL AUDIT** independently audits the engagement after substantive work.
- **MINERVA** is examiner-only and never writes production accounting truth.
- **LEARNING DEAN / DARWIN / CAPABILITY ARCHITECT** may propose/test improvements but may not silently weaken tests, expand privileges, or self-promote production changes.

No one component should both create a material conclusion and provide the only verification required to promote it.

---

## 5. Real agent execution and execution classes

A named agent counts as having executed only when the role-specific work physically occurred.

Each execution records at minimum:

```text
agentExecutionId
engagementId
agentId
runtimeType
objective
inputManifestId/hash
inputObjectReferences
executionMechanism
model/tool/ruleset provenance where applicable
startedAt
completedAt
outputManifestId/hash
outputObjectReferences
status
uncertainties/findings
handoffId
consumerAcknowledgement
proofState
```

Persisting a callback output proves `OUTPUT_PERSISTED`; it does not prove independent reasoning, professional review, or `PRODUCT_VERIFIED`.

Deterministic specialists are legitimate when their task is actually deterministic. Do not force every role through an LLM, and do not label deterministic functions as AI agents merely to inflate agent counts.

If one prompt produces multiple role personas in one inference, classify it `MONOLITHIC_MULTI_ROLE_INFERENCE`, not multiple independent agent executions.

---

## 6. Swarm DAG and communication contract

HERMES must construct an explicit dependency graph for substantive work.

Each work node defines:

- prerequisites;
- eligible execution role;
- input references;
- required verification;
- retry/reopen policy;
- downstream consumers.

Independent work may run concurrently. Dependent work waits for acknowledged prerequisites.

Every material handoff carries:

```text
handoffId
producerExecutionId
consumerAgentId / consumerService
engagementScope
objectReferenceManifest
manifestHash
expectedReferenceCount
acknowledgedReferenceCount
rejectedWithDisposition
unaccountedReferences
idempotencyKey
attempt
sentAt
acknowledgedAt
```

Required invariant:

`EXPECTED = ACKNOWLEDGED + EXPLICITLY_REJECTED_WITH_DISPOSITION`

`UNACCOUNTED = 0`

A prose summary may accompany references but may never replace them.

### Disagreement is not voting

Agent consensus does not create accounting truth. Conflicting findings create a durable disagreement/exception object and route to evidence resolution, independent verification, clarification, technical review, or fail-closed state.

---

## 7. Canonical proof-state machine

Use one canonical proof-state model rather than allowing every subsystem to invent its own promotion semantics.

Recommended progression:

`CREATED → ACCEPTED → DISPATCHED → EXECUTING → OUTPUT_PERSISTED → CONSUMED → INDEPENDENTLY_VERIFIED → ELIGIBLE_FOR_CANONICAL_OR_DELIVERY`

Product/browser-specific proof may be layered separately, but every promotion must identify the evidence and verifier.

Permanent rules:

- file existence does not equal verification;
- HTTP 200 does not equal semantic correctness;
- producer cannot self-promote the strongest proof for its own material assertion;
- missing verifier evidence leaves the lower state intact;
- proof states begin unverified.

---

## 8. Model router, fallback authority, and fake-human prohibition

A model/tool failure may only fall back to a capability that can genuinely establish the required result.

Forbidden fallback behavior includes returning successful-looking statements such as:

- classification confirmed;
- disclosures comply;
- zero non-conforming disclosures;
- accounting policy approved;
- discrepancy cleared;
- human/CPA memorandum completed;

when the fallback did not perform equivalent verified work.

If the required capability is unavailable, return an honest state such as:

`MODEL_UNAVAILABLE`, `TOOL_UNAVAILABLE`, `INSUFFICIENT_EVIDENCE`, `BLOCKED`, or `HUMAN_REVIEW_REQUIRED`.

### Fake human actions are prohibited

Never generate and represent as physically performed:

- CPA/human approval;
- human review memorandum;
- customer response;
- signature;
- license number;
- PBC response;
- concurring partner sign-off;
- legal/regulatory professional attestation.

Human-required states remain pending until an actual authorized human action object exists.

Model execution telemetry must distinguish configured model, attempted model, actual model, fallback, tokens/cost measured versus estimated, and health check versus inference.

---

## 9. Skills certification and empirical performance

Static profile values are configuration, not operational evidence.

Agent/skill fields such as:

- jobs completed;
- accuracy;
- competency;
- success rate;
- escalation rate;
- benchmark score;
- cost savings;
- token usage;
- average latency;
- learning improvement;

must be derived from execution history with denominators and sample size if shown as empirical performance.

Seeded values must be labeled `CONFIGURED_BASELINE` or `DEMO_ONLY`, never measured production performance.

A skill's `CERTIFIED` state must resolve to actual certification evidence/version, not a hard-coded label.

External-source operations such as FX rates require rate, date, source, and retrieval/verification evidence. Missing source data may not silently become 1.0 or an embedded example rate.

---

## 10. Intake is a durable transaction

A customer intake is not complete merely because an API returned `intakeSessionId`.

Required successful transaction:

`BYTES_RECEIVED → HASH_COMPUTED → BYTES_DURABLY_PERSISTED → DOCUMENT_ID_CREATED → CUSTODY_ENVELOPE_CREATED → TENANT/WORKSPACE/ENGAGEMENT_SCOPE_VERIFIED → CUSTOMER_PRIORITY_JOB_CREATED → DURABLE_QUEUE_ACKNOWLEDGED`

If a required step fails, intake fails/rolls back or remains explicitly incomplete; it may not advertise successful processing.

The uploaded artifact consumed by Document Intelligence must be the persisted intake artifact/reference—not an unrelated acquisition/local filesystem path supplied by the test controller.

---

## 11. One real customer queue

Upload-created queue state, worker queue state, and HERMES customer-priority state must reconcile to the same durable job identities.

Do not maintain an unrelated counter that merely says `pendingJobs > 0` while the actual worker queue is different.

For each customer job prove:

```text
customerPriorityJobId
intakeSessionId
documentId
queueStore
producer
dispatcher
consumer
lease/claim
attempt
createdAt
dispatchedAt
acknowledgedAt
completed/failedAt
```

Customer work preempts Academy work. The heartbeat observes/recover jobs; it does not replace the durable queue.

---

## 12. Persistent state, concurrency, and crash safety

Audit every `Map`, singleton, in-memory array, JSON file, and service-local cache.

For each conceptual store define:

- authoritative store;
- owner service;
- concurrent writers allowed;
- transaction/atomicity model;
- version/compare-and-swap or locking where required;
- idempotency key;
- startup rehydration;
- crash recovery;
- corruption handling;
- backup/restore evidence.

If multiple pods/processes can write the same conceptual state, plain local Maps/files are insufficient without explicit coordination.

Exactly-once business effect should be achieved through idempotency and durable state; do not rely on exactly-once message delivery assumptions.

---

## 13. Legacy/test/Academy side-flow isolation

Repository-wide, classify every simulator, H.9.x engine, canary helper, synthetic engagement, seeded lineage service, regression runner, and legacy route as:

`PRODUCTION`, `TEST_ONLY`, `ACADEMY_ONLY`, `FORENSIC`, or `LEGACY`.

Non-production paths may not:

- create eligible customer canonical truth;
- satisfy production proof;
- write into production reporting stores;
- inflate customer counts or agent performance;
- become fallback production paths;
- expose mutation routes without explicit non-production protection.

Production must have exactly one authoritative path per conceptual responsibility.

---

## 14. Entity / project / period placement

Document extraction does not automatically establish entity/project/period identity.

Placement must resolve from evidence and preserve:

- client/tenant;
- project/engagement;
- legal entity;
- reporting entity/group;
- subsidiary/segment where relevant;
- period/start/end/instant;
- currency/unit/scale;
- source authority.

Ambiguity creates `UNRESOLVED` / clarification, never a silent merge or guessed project.

Example/test entities must not auto-seed into production entity stores.

---

## 15. Canonical truth, derived values, and invalidation

Canonical truth is promoted only from eligible verified evidence.

Every derivation requires:

- derivation ID;
- operand IDs;
- formula/rule version;
- entity/period/currency scope;
- result;
- verification state.

A derived value may be useful, but it must never masquerade as an independently source-observed fact.

When any source, observation, assertion, fact, or relationship is invalidated/quarantined, dependency propagation must identify and invalidate/rebuild/supersede every affected:

- canonical fact;
- derivation;
- chart point;
- UI surface;
- report field;
- Copilot/retrieval index;
- review/audit conclusion.

An incident is not resolved while contaminated downstream objects remain active.

---

## 16. Source-side completeness is calculated, never assigned

Document Intelligence must inventory the physical source before claiming completeness.

Forbidden patterns include:

- fixed structural counts;
- fixed relationship counts;
- fixed `100%` preservation values;
- fixed `unaccountedItems = 0`;
- arbitrary minimum floors;
- extractor output defining its own denominator.

Every denominator, disposition, preserved count, remainder, and relationship count must derive from actual inventoried source objects.

For completed custody boundaries:

`DETECTED = PRESERVED/ACKNOWLEDGED + EXPLICITLY_DISPOSITIONED + UNACCOUNTED`

`UNACCOUNTED = 0` is a computed result, never a default constant.

The system must support documents where the truthful result is partial/deficient.

---

## 17. Customer Simulator and browser truth

A browser process is not sufficient.

For `BROWSER_VERIFIED`, the simulator must use the deployed customer product:

- authenticate/establish scope as applicable;
- navigate real routes;
- locate the real upload control;
- assign the physical file through the DOM input/dropzone;
- observe visible selected-file state;
- click the real submission/start action;
- capture the product-generated request/response;
- receive the real intake/job receipt;
- continue observation through actual customer surfaces.

Direct `page.evaluate(fetch('/api/...'))` is API verification occurring inside a browser, not customer UI verification.

The simulator may not call a second hidden `/process` endpoint to make accounting work begin. The upload transaction creates the durable customer-priority job and Eve continues autonomously.

---

## 18. UI truth and no display fallbacks

The UI renders authoritative scoped knowledge; it does not own or repair truth.

Forbidden customer-facing fallbacks include:

- example company/entity when no entity exists;
- seeded financial values when no canonical fact exists;
- static completeness percentages;
- static agent-working indicators;
- fabricated source snippets/coordinates;
- default verification badges.

Missing data renders `—`, `Unavailable`, `Not established`, `Review Required`, or the correct state.

Every material visible number/status supports reverse lineage to its authoritative object.

Operator dashboards must distinguish availability from execution and configured baseline from empirical metrics.

---

## 19. Report Wizard and reporting truth

A report generator may never manufacture missing evidence to finish a document.

Do not default or fabricate:

- source page;
- source quote;
- source coordinate;
- verification status;
- confidence;
- currency/scale;
- period;
- signer;
- reviewer;
- CPA identity/license;
- audit opinion;
- quality clearance;
- professional attestation.

Missing evidence remains missing or blocks/qualifies the relevant report section.

Report inputs must be canonical facts/derivations for the correct engagement, not arbitrary `facts` arrays accepted on confidence alone.

A fact does not become verified because confidence exceeds a threshold.

Every report artifact stores the exact canonical fact/derivation manifest and hash used to generate it.

### Professional status

Never label output `FINAL_CERTIFIED`, `INDEPENDENT_AUDITOR_OPINION`, `CPA_SIGNED`, `PCAOB_SIGNED`, or equivalent unless the required real authorized sign-off object exists.

AI-prepared outputs use truthful states such as `DRAFT`, `AI_PREPARED`, `REVIEW_REQUIRED`, or another approved non-professional-signoff status.

---

## 20. Internal Audit independence

Internal Audit obtains evidence and denominators independently of producer success flags.

It must test as applicable:

- source authority/hash;
- source-side inventory;
- extraction conservation;
- entity/period/currency/scale;
- agent execution evidence;
- unresolved exceptions;
- UI/backend differential;
- report/source differential;
- historical/test contamination;
- audit self-consistency.

The auditor may not pass because the producer said `complete`, because balances happen to tie, or because an execution artifact exists.

Audit findings must be capable of reopening/blocking delivery.

---

## 21. Minerva is an independent exam, not source eligibility

Source eligibility and Minerva grading are separate.

For live engagement validation, Minerva must test persisted Eve knowledge with withheld/source-derived questions appropriate to that engagement and source denial where specified.

Coverage includes, when applicable:

- headline values;
- non-headline details;
- footnotes;
- dimensions/segments;
- period/context;
- units/scales;
- relationships;
- exceptions/negative facts;
- source/citation integrity.

Missing answer/evidence is not an automatic pass.

Regression benchmark self-verification is not proof that a live engagement passed Minerva.

---

## 22. Academy learning, holdouts, promotion, and rollback

Academy may not improve its score by modifying the test used to prove improvement.

For each learning candidate preserve:

```text
baselineExecutionIds
incident/finding IDs
rootCause
proposedChange
changeClassification
training/test corpus version
immutable holdout version
preChangeResult
postChangeResult
canaryResult
promotionDecision
productionVersion
laterEngagementResult
measuredDelta
rollbackCondition
```

Required loop:

`REAL FAILURE/WEAKNESS → POSTMORTEM → PROPOSAL → SANDBOX → UNCHANGED HOLDOUT → CANARY → SAFE PROMOTION → LATER ENGAGEMENT → MEASURED EFFECT`

A learning JSON record, changed prompt, or higher score on a modified test does not prove learning.

Academy changes cannot lower evidence/professional standards simply to improve pass rates.

---

## 23. Security and tenant scope

Every production read, mutation, job, agent execution, graph query, memory query, report download, and Copilot request must resolve authenticated tenant/workspace/engagement authority.

Forbidden production behavior includes:

- default `ws-default` authority;
- trusting tenant/workspace IDs from request body without authorization;
- broad memory/graph/report APIs exposing other tenants;
- customer access to examiner/sealed memory;
- UI-only authorization;
- static mock user access maps as production auth.

System/service identities require explicit service authorization and least privilege.

---

## 24. Observability truth

Persist execution events as they occur; do not reconstruct a convincing history after completion.

Report separately:

```text
SERVICES_HEALTHY
HEARTBEAT_TICKS
SCHEDULER_EVALUATIONS
SCHEDULER_DISPATCHES
WORKER_JOBS
AGENT_EXECUTIONS
MODEL_INFERENCES
TOOL_EXECUTIONS
BROWSER_SESSIONS
INTAKES
ENGAGEMENTS_STARTED
ENGAGEMENTS_COMPLETED
AUDIT_FINDINGS
MINERVA_EVALUATIONS
LEARNING_CANDIDATES
PROMOTED_LEARNING_CHANGES
```

Hard-coded claims such as 100% accuracy, 99.x% competency, zero incidents, or learned capability are prohibited unless derived from real execution records with denominator/sample size.

---

## 25. Behavioral negative-test matrix

For every repaired class, create a negative test that exercises the actual boundary and proves invalid behavior is rejected.

At minimum prove:

1. production empty store does not auto-seed customer-like truth;
2. solver cannot read Minerva sealed answer material;
3. missing model does not become successful compliance/accounting output;
4. no synthetic human/CPA/PBC action can satisfy a human-required gate;
5. persisted agent JSON alone cannot become independently verified;
6. agent disagreement creates an exception, not majority-vote canonical truth;
7. upload cannot return complete success without durable bytes + custody + queue job;
8. HERMES queue state and worker job refer to the same job identity;
9. duplicate queue delivery does not duplicate business effect;
10. service restart rehydrates work without losing/duplicating objects;
11. test/Academy/legacy route cannot write customer truth;
12. cross-tenant read/write is denied;
13. missing entity identity creates unresolved clarification rather than silent merge;
14. source inventory mismatch yields nonzero unaccounted/deficient state;
15. direct API fetch inside Chrome cannot satisfy `BROWSER_VERIFIED`;
16. missing UI fact renders empty/review-required rather than fixture fallback;
17. unverified fact cannot enter final report merely because confidence is high;
18. report cannot claim CPA/audit sign-off without authorized sign-off object;
19. Internal Audit fails when producer success flag conflicts with source evidence;
20. Minerva fails missing/unrelated solver output;
21. Academy cannot use altered grader/holdout to prove its own improvement;
22. invalidated upstream fact propagates invalidation to UI/report/retrieval dependents.

Source-string tests may supplement these tests but cannot replace them.

---

## 26. Current repository-wide audit targets

Before Company 1 release, physically search current production reachability for these known classes of historical risk and either remove, reclassify, or prove safe isolation:

- production entity/lineage/graph auto-seeding;
- benchmark values in shared agent/firm memory;
- static agent jobs/success/competency metrics represented as empirical;
- static skill certification scores/status;
- fixed FX rate tables represented as authoritative external rates;
- model fallback prose that declares success without equivalent execution;
- generated human/CPA review language;
- legacy Customer Journey simulators with fixed financial/PBC/report outputs;
- report services that rehydrate historical artifacts as automatically final/certified;
- report wizard defaults for source quote/page/status/signatory;
- UI example/fallback data when canonical stores are empty;
- fixed completeness/disposition/unaccounted counters inside extraction;
- disconnected customer-queue counters versus worker jobs;
- mutation/read routes lacking authenticated tenant scope;
- duplicate production truth writers or legacy H.9.x execution paths.

Fix generalized behavior. Preserve forensic history under explicit non-authoritative classification.

---

## 27. Company 1 release gate extension

Documents 29–34 remain controlling for the supervised-first-company trial. In addition, Company 1 may not be accepted as a clean release solely because the new primary orchestrator succeeds.

The observer must confirm that no alternate seeded, legacy, test, fallback, model-router, memory, UI, reporting, or Academy path contributed higher-authority truth.

For the clean run prove:

- production stores began without customer-like fixture truth;
- customer UI initiated the transaction;
- one durable customer job identity propagated through scheduling/worker execution;
- source-side completeness was calculated from actual inventory;
- canonical facts came from eligible evidence;
- every role claimed as executed has valid execution-class proof;
- no fake human/customer/CPA action occurred;
- every material UI/report claim traces backward;
- Internal Audit and Minerva were independent;
- Academy did not alter its own grading basis;
- production runtime identity matches canonical GitHub deployment;
- Google supplied no production truth while in WATCH_ONLY.

If any requirement fails, freeze/quarantine the attempt and follow Document 29 restart-from-origin remediation.

---

## 28. Gemini implementation instruction

When Google/Gemini consumes this document, it must not create a new parallel architecture merely to satisfy it.

Required sequence:

`FETCH CURRENT MAIN → READ 00–35 → INVENTORY EXISTING IMPLEMENTATIONS → TRACE REAL PRODUCTION REACHABILITY → CLASSIFY EACH PATH → REPAIR THE GENERALIZED EXISTING SYSTEM → ADD BEHAVIORAL NEGATIVE TESTS → RUN CLEAN CHECKOUT → COMMIT/PUSH → DEPLOY REAL ZEEABUR RUNTIME → PHYSICALLY VERIFY → STOP BEFORE COMPANY 1 IF RELEASE GATES ARE NOT YET MET`

Do not fix only the file named by a finding. Search for the same failure class across the repository.

Do not report `CERTIFIED`, `PHYSICALLY_VERIFIED`, or equivalent unless the required evidence exists in the environment being claimed.

If deployment authority is unavailable, report `BLOCKED_ZEABUR_DEPLOYMENT_ACCESS` and stop rather than inventing runtime evidence.

---

## Permanent invariants

1. Behavioral execution outranks naming/interface resemblance.
2. Production starts empty of customer-like fixture truth.
3. Examiner truth is isolated from solver memory.
4. One canonical role catalog governs agent authority.
5. A callback/persisted file is not automatically an agent/proof.
6. Swarm handoffs use durable references and conservation.
7. Disagreement creates an exception, not truth by vote.
8. Proof promotion requires the required independent verifier.
9. Fallback cannot increase authority.
10. AI may never fabricate a human/customer/professional action.
11. Empirical metrics require empirical denominators.
12. Intake success includes durable source + custody + queue state.
13. Customer queue identity is singular and traceable end-to-end.
14. Runtime state is crash-safe, idempotent, and concurrency-aware.
15. Legacy/test/Academy paths cannot become customer truth.
16. Completeness and `unaccounted=0` are calculated, never assigned.
17. Browser verification requires real UI interaction.
18. UI missing data stays missing.
19. Reports never manufacture citations, approval, or sign-off.
20. Internal Audit and Minerva remain independent.
21. Learning requires an unchanged holdout and later measurable effect.
22. Upstream invalidation propagates to every downstream dependent.
23. Tenant scope is enforced server-side at every authority boundary.
24. Observability reflects events that actually occurred.
25. Company 1 is not a clean release if any hidden substitute path participated.
