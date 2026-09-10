# 19 — Physical Execution, No-Substitute-Path & End-to-End Product Truth Standard

**Status:** Authoritative design intent and implementation guidance. This document does **not** certify that the runtime already satisfies every requirement below.

## Purpose

This standard closes a recurring Eve failure class: a component can have the correct name, interface, status, output shape, or audit label while substituting a simulation, fixture, shortcut, generated trace, monolithic helper, cache, or parallel implementation for the real production operation.

> **No production claim without physical execution evidence. No stage may substitute a representation of another stage for that stage itself.**

This document reconciles Documents 00–18 into an end-to-end physical execution contract. More specific requirements in those documents remain authoritative.

---

## 1. The failure pattern this standard prohibits

Examples of prohibited substitute paths:

- an SEC acquisition component generating local HTML instead of retrieving the authoritative filing;
- a Customer Simulator generating a JSON DOM/action trace instead of opening the actual Eve UI in a real browser;
- an Agent Swarm represented by one synchronous function while telemetry claims specialists executed;
- an extractor defining its own denominator and reporting 100% recall against only the fields it chose to inspect;
- an Internal Auditor trusting upstream `success=true` rather than independently inspecting evidence;
- a Learning record being written without a later measurable change in curriculum, routing, controls, capability, or performance;
- a dashboard rendering detached summaries rather than authoritative engagement objects;
- a report rebuilding values from fixtures/caches rather than consuming the same canonical truth as the UI.

Substitute paths may exist only when explicitly isolated as `TEST_ONLY`, `DEMO`, `CANARY`, `REGRESSION`, or `SYNTHETIC_ACADEMY`. They may never be eligible for production or certification truth.

---

## 2. Permanent physical execution graph

```text
EXTERNAL AUTHORITY / CUSTOMER MATERIAL
→ PHYSICAL SOURCE ARTIFACT
→ REAL CUSTOMER UI / FILE INTAKE
→ UPLOAD + INTAKE SESSION
→ DOCUMENT INTELLIGENCE / UNIVERSAL DOCUMENT IR
→ SOURCE ELEMENTS
→ OBSERVATIONS + ATTRIBUTES
→ DATA POINTS + RELATIONSHIPS + SEMANTIC ASSERTIONS
→ VERIFICATION
→ CANONICAL ENGAGEMENT TRUTH
→ CPA SPECIALIST WORK / DERIVATIONS / RECONCILIATIONS
→ PBC + TECHNICAL REVIEW + CONCURRING REVIEW
→ PRESENTATION CONTRACTS
→ ACTUAL EVE UI
→ REPORT / DELIVERABLE ARTIFACTS
→ INDEPENDENT INTERNAL AUDIT
→ MINERVA INDEPENDENT EXAMINATION
→ LEARNING DEAN / CAPABILITY ARCHITECT
→ MEASURED NEXT-ENGAGEMENT IMPROVEMENT
```

Every arrow is a material handoff. Every handoff must be observable, durable, scoped, and reconcilable.

A scheduler/controller may schedule, lock, checkpoint, route, and observe. It may not perform miniature substitute versions of the stages it coordinates.

---

## 3. Four required maps

### 3.1 Physical system map
For every production workflow identify physical input, producer, execution ID, durable inputs, processing service, durable outputs, handoff envelope, consumer, acknowledgement, downstream use, and failure/retry path.

### 3.2 Agent organization map
For every specialist define: `agentId/capabilityId`, mission, accepted job types, trigger, required inputs, storage read scope, tools/models, expected outputs, durable output location, handoff target, verification obligations, retry/failure policy, prohibited actions, and empirical performance metrics.

### 3.3 Data custody map
Every material information object must be reconstructable through fields equivalent to:

```text
objectId
objectType
schemaVersion
projectId
engagementId
entityId
sourceArtifactId
sourceElementIds
createdByExecutionId
createdAt
storageLocation
contentHash
verificationState
disposition
supersedesObjectId
supersededByObjectId
handoffHistory[]
consumedByExecutionIds[]
derivedObjectIds[]
presentationSurfaceIds[]
reportArtifactIds[]
incidentIds[]
```

### 3.4 Physical proof map
Every material status word has an objective proof contract; naming is never proof.

---

## 4. Production vocabulary has physical meaning

- **`SOURCE_ACQUIRED`** — physical bytes/customer artifact exists. A URL or generated file is insufficient.
- **`AUTHORITATIVE_SOURCE_VERIFIED`** — authority, entity, period/document identity, physical artifact, hash, and provenance verified.
- **`COMPLETE_AUTHORITATIVE_FILING`** — independent source identity/completeness gate passed; generated fixtures/fragments are ineligible.
- **`UPLOADED`** — production intake contract executed. Backend filesystem copy is not customer upload.
- **`BROWSER_VERIFIED`** — actual browser process/session with real navigation/interaction evidence. Selector lists and route traces do not qualify.
- **`AGENT_EXECUTED`** — actual execution record with inputs, outputs, timestamps, and handoff. Registered/healthy/available does not qualify.
- **`EXTRACTED`** — source-backed output object with lineage. A populated desired field does not prove deep extraction.
- **`VERIFIED`** — appropriate independent verification execution occurred.
- **`CANONICAL`** — eligible verified evidence was reconciled within scope; synthetic fixtures cannot become customer canonical truth.
- **`RENDERED`** — actual Eve UI consumed the authoritative object.
- **`REPORTED`** — physical report artifact consumed eligible authoritative knowledge.
- **`AUDITED`** — independent audit execution gathered its own evidence and denominators.
- **`LEARNED`** — a later observable effect exists; writing `learning.json` alone is activity, not learning.
- **`COMPLETE`** — required stage gates satisfied or explicitly dispositioned; function return success is insufficient.

Proof-level promotion is centrally fail-closed: `CONFIGURED → RUNTIME_VERIFIED → PRODUCT_VERIFIED → BROWSER_VERIFIED`. Callers cannot self-promote proof level.

---

## 5. Source acquisition contract

Persist where applicable:

```text
sourceAcquisitionId
executionId
agentId/serviceId
authority
request/reference
retrievalTimestamp
HTTP/result metadata
entity identity
period/document identity
physical path
physical bytes
SHA-256
MIME/type
completeness classification
retry/failure history
```

Rules:
1. Never generate a substitute for failed authoritative retrieval.
2. HTTP 200 does not prove completeness.
3. A fixture cannot be relabeled as externally acquired.
4. Retrieval failure becomes an incident, not permission to fabricate.
5. Rate limits, partial downloads, wrong periods/forms/entities remain observable.

---

## 6. Real customer UI / browser intake contract

For browser certification persist:

```text
browserSessionId
browserEngine/process
startedAt/completedAt
viewport
routeHistory
DOM selector/control
action
selected physical filename
selected file hash
browser-generated request
server response
intakeSessionId
resulting documentId
visible processing state
```

Customer staging and customer upload are distinct. API checks are not browser checks. Browser evidence must originate from the browser session, not be reconstructed after the fact.

Where the same artifact flows unchanged:

```text
SOURCE_HASH
= CUSTOMER_STAGING_HASH
= BROWSER_SELECTED_HASH
= SERVER_RECEIVED_HASH
= INTAKE_HASH
= DOCUMENT_IR_SOURCE_HASH
```

Transforms require explicit input/output hashes and a transformation execution record.

---

## 7. Universal extraction: inventory before interpretation

Extraction begins with **what physically exists**, not with desired fields.

The source determines the denominator. The extractor never determines its own completeness denominator.

Inventory applicable structures including artifacts/pages, sections, headings, paragraphs, lists, tables/rows/cells, footnotes, XBRL occurrences/contexts/units/dimensions, spreadsheet sheets/ranges/formulas/styles/comments, PDF layout regions, charts/diagrams/images/captions, signatures/certifications, cross-references, headers/footers, and presentation structures.

Nothing detected is silently discarded.

---

## 8. Information hierarchy is not a flat fact list

- **Source Element:** physically detectable source object.
- **Observation:** perceptual/structural measurement such as text, coordinate, row/column, style, context, layout relation.
- **Attribute:** property of an element/observation.
- **DataPoint:** independently meaningful normalized information with context.
- **Relationship:** edge connecting knowledge objects.
- **Semantic Assertion:** meaningful claim expressed/derived from evidence.
- **Verified Fact:** assertion/fact passing appropriate verification.
- **Canonical Fact:** eligible scoped authoritative representation after reconciliation.

A source element may yield zero, one, or many DataPoints. A DataPoint may have multiple evidence occurrences. Canonicalization may deduplicate without deleting lower-level evidence.

A footer remains a SourceElement even if it stops at `PRESERVED_STRUCTURAL_REPETITIVE`. A table border may be `PRESERVED_PRESENTATION_ONLY`; a duplicate may be `PRESERVED_DUPLICATE_CORROBORATING`; ambiguity may be `PRESERVED_REVIEW_REQUIRED`. Stopping promotion is not deletion.

---

## 9. Extraction completeness is multi-dimensional

Measure independently as applicable:

- structural coverage;
- table coverage;
- XBRL coverage;
- spreadsheet/formula coverage;
- narrative coverage;
- footnote coverage;
- visual coverage;
- entity/people coverage;
- relationship coverage;
- financial statement coverage;
- policies;
- debt/leases/tax/equity;
- risks/legal/regulatory;
- provenance;
- unresolved/review-required information.

A large document producing a small number of correct headline facts is shallow extraction.

### Independent source-side recall

1. Independently inspect/sample physical source.
2. Identify information expected to survive extraction.
3. Only then query persisted Eve knowledge.
4. Classify `CAPTURED`, `PARTIAL`, `NOT_CAPTURED`, `WRONG`, `UNSUPPORTED`.
5. Report denominator and sampling method.

Forbidden circular audit:

```text
expected = extractor_output
captured = extractor_output
recall = 100%
```

---

## 10. Knowledge reconstruction / Ask-Anything

After extraction, a solver must be testable without rereading the source. Independent questions should cover applicable identity, business, people, entities, financials, segments/geographies, currencies, tax, debt, leases, equity, acquisitions/goodwill, fair value, policies, commitments/contingencies, risks, legal/regulatory, governance, MD&A/narrative, provenance, and obscure granular details.

Question generation/answer keys must be isolated from the solver. Solver source/web access must be explicitly denied for source-denied certification.

---

## 11. Agent execution and handoff contract

For every substantive job persist:

```text
executionId
agentId
engagementId
jobType
startedAt/completedAt
inputObjectIds/inputManifest
inputStorageReferences
model/tool/ruleset
outputObjectIds/outputManifest
outputStorageReferences
handoffTarget
handoffId
status
failure/retry data
```

Handoff invariant:

```text
EXPECTED_INPUT_REFERENCES
= ACKNOWLEDGED_REFERENCES
+ EXPLICITLY_REJECTED_WITH_DISPOSITION
UNACCOUNTED_REFERENCES = 0
```

Summaries may accompany references; they never replace references.

---

## 12. Hermes and specialist organization

Hermes prioritizes, schedules, dispatches, checkpoints, coordinates, enforces gates, reconciles handoffs, and surfaces blockers. Hermes must not impersonate all specialists inside one opaque function.

Use Document 07 role definitions. Physical expectations include:

- **Document Architect/Extraction:** physical artifact → Document IR/source inventory.
- **Ledger:** source-backed knowledge → accounting classifications/workpaper mappings.
- **Veritas:** exact evidence refs → provenance/hash/coordinate verification records.
- **Euclid:** operands → deterministic reconciliations/variance/derivation proofs.
- **Atlas/entity specialist:** entity evidence → hierarchy/consolidation/ownership outputs.
- **Mercury/currency specialist:** currency/unit/scale evidence → translation/revaluation outputs.
- **Lexicon:** source language/taxonomy → mapped terminology with ambiguity retained.
- **Argus:** cross-source knowledge → contradiction/anomaly candidates.
- **Clara:** actual missing/ambiguous evidence → PBC/clarification objects and response history.
- **Athena:** evidence/accounting issue → technical accounting analysis/review response.
- **Quinn:** actual workpapers/evidence → substantive review notes/clearance decisions.
- **Scribe/Report Factory:** eligible canonical knowledge → versioned hashed deliverables.
- **Sentinel:** custody/safety state → incidents, blocks, recovery governance.
- **Minerva:** independently selected source-side tests → recall/precision/reconstruction results.
- **Learning Dean:** measured outcomes → postmortem/curriculum decisions.
- **Capability Architect:** recurring evidenced gaps → bounded capability proposals.

Do not invoke irrelevant specialists merely to inflate execution counts. Do not claim applicable specialists executed without execution IDs and outputs.

---

## 13. Temporary state cannot become an information graveyard

Material information may temporarily exist in parser chunks, worker memory, browser state, deduplication sets, model context, queue payloads, or intermediate transforms. Before producer release/garbage collection, it must be durably persisted or explicitly proven non-material/reconstructible.

Lifecycle:

```text
CREATED_TEMPORARY
→ PERSISTED_OR_DISPOSITIONED
→ DOWNSTREAM_ACKNOWLEDGED
→ SAFE_TO_PURGE
```

If material temporary state disappears before persistence/acknowledgement, record `TEMPORARY_STATE_LOSS`.

No agent context is authoritative storage.

---

## 14. Canonical truth and project/entity isolation

Maintain strict distinction between:

- global entity knowledge;
- engagement evidence;
- engagement canonical truth;
- synthetic Academy truth;
- canary/regression/demo data.

Similar names do not authorize merges. Cross-engagement corroboration may inform discovery but does not automatically become accounting evidence authority. Ambiguous identity becomes a clarification candidate.

Every object must retain project/engagement/entity/period scope sufficient to prevent silent cross-project contamination.

---

## 15. UI product-truth contract

The UI does not own truth; it renders authoritative scoped objects.

Required reverse trace for material information:

```text
UI SURFACE
→ PRESENTATION CONTRACT
→ DERIVATION/CANONICAL FACT
→ VERIFIED FACT/ASSERTION
→ DATAPOINT/RELATIONSHIP
→ OBSERVATION
→ SOURCE ELEMENT
→ SOURCE ARTIFACT
```

Required forward trace where useful:

```text
SOURCE ARTIFACT/ELEMENT
→ DOWNSTREAM KNOWLEDGE
→ CANONICAL
→ UI SURFACES
→ REPORT USES
```

Register material surfaces including KPI tiles, financial rows, ratio cards, chart points, relationship edges, document counts, agent-status claims, audit badges, learning cards, and report values.

UI agent status must distinguish `REGISTERED`, `AVAILABLE`, `EXECUTING`, `WAITING`, `FAILED`, `COMPLETED`. Healthy services are not “agents working.”

Every displayed count must reconcile to an authoritative scoped store. No static demo percentages or detached telemetry summaries may masquerade as product truth.

---

## 16. Report truth contract

There is no separate report truth.

```text
SOURCE → VERIFIED/CANONICAL TRUTH → PRESENTATION CONTRACT → UI
SOURCE → VERIFIED/CANONICAL TRUTH → REPORT CONTRACT → ARTIFACT
```

Where the same assertion appears in UI and report, both should reference the same canonical/derivation identity where applicable.

Every deliverable must preserve engagement scope, report version, artifact hash, source knowledge references, review clearance, and supersession history.

Historical wrong reports remain preserved but become ineligible current truth.

---

## 17. Internal Audit independence

Internal Audit must not certify orchestration flags. It independently checks physical evidence.

Before an unqualified production opinion, require applicable proof of:

- source authority/identity;
- physical source/hash;
- non-synthetic eligibility;
- source-side completeness denominator;
- extraction recall/precision;
- custody/handoff reconciliation;
- agent execution evidence;
- accounting reconciliation