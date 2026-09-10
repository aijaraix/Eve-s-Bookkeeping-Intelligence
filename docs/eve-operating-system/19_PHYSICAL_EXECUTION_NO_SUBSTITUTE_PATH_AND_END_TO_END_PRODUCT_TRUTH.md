# 19 — Physical Execution, No-Substitute-Path & End-to-End Product Truth Standard

**Status:** Authoritative design intent and implementation guidance. This document does **not** certify that the runtime already satisfies every requirement below.

## Purpose

This standard closes a class of failure repeatedly observed during Eve development: a component can have the correct name, interface, status, output shape, or audit label while **substituting a simulation, fixture, shortcut, generated trace, monolithic helper, cached value, or parallel implementation for the real production operation**.

Eve must not merely *represent* a CPA workflow. Eve must physically execute the workflow.

The governing rule is:

> **No production claim without physical execution evidence. No stage may substitute a representation of the next stage for the next stage itself.**

This document reconciles the operating model, document intelligence, information custody, agent handoffs, UI lineage, reporting, Academy, Internal Audit, and failure-attribution standards into one end-to-end execution contract.

It supplements Documents 00–18. It does not replace their more detailed requirements.

---

## 1. Why This Standard Exists

A system can appear complete while bypassing its intended architecture. Examples include:

- an `SEC Acquisition Agent` generating local HTML rather than retrieving the SEC filing;
- a `Customer Simulator` writing a JSON action trace rather than opening a browser and clicking the UI;
- an `Agent Swarm` represented by one synchronous function executing several rule checks;
- an extraction pipeline counting only the fields it chose to extract and then declaring 100% recall;
- an Internal Auditor trusting an upstream `success=true` flag rather than independently examining evidence;
- an Academy record being written without any later behavior, capability, curriculum, or decision changing;
- a dashboard rendering a detached summary rather than the authoritative engagement objects;
- a report generator rebuilding values from fixtures or stale caches rather than consuming the same canonical truth used by the product.

These are **substitute paths**. A substitute path may be useful in unit tests, demos, fixtures, regression tests, or isolated development. It may never masquerade as production execution or certification evidence.

---

## 2. Permanent Physical Execution Graph

The intended real-world flow is:

```text
EXTERNAL AUTHORITY / CUSTOMER MATERIAL
        ↓
SOURCE ACQUISITION OR CUSTOMER-POSSESSED ARTIFACT
        ↓
PHYSICAL SOURCE ARTIFACT
        ↓
REAL CUSTOMER UI / FILE INTAKE
        ↓
UPLOAD + INTAKE SESSION
        ↓
DOCUMENT INTELLIGENCE / UNIVERSAL DOCUMENT IR
        ↓
SOURCE ELEMENTS
        ↓
OBSERVATIONS + ATTRIBUTES
        ↓
DATA POINTS + RELATIONSHIPS + SEMANTIC ASSERTIONS
        ↓
VERIFICATION
        ↓
CANONICAL ENGAGEMENT TRUTH
        ↓
CPA SPECIALIST WORK / DERIVATIONS / RECONCILIATIONS
        ↓
PBC + TECHNICAL REVIEW + CONCURRING REVIEW
        ↓
PRESENTATION CONTRACTS
        ↓
ACTUAL EVE UI
        ↓
REPORT / DELIVERABLE ARTIFACTS
        ↓
INDEPENDENT INTERNAL AUDIT
        ↓
MINERVA INDEPENDENT EXAMINATION
        ↓
LEARNING DEAN / CAPABILITY ARCHITECT
        ↓
MEASURED NEXT-ENGAGEMENT IMPROVEMENT
```

Every arrow is a material handoff and must be independently observable.

No orchestrator may replace multiple boxes with a miniature implementation and claim the boxes executed.

---

## 3. Four Maps Every Production Workflow Must Have

### 3.1 Physical System Map

For every production workflow identify:

- physical input;
- producing service/agent/tool;
- durable input object IDs;
- execution ID;
- processing service;
- durable outputs;
- handoff envelope;
- consuming service/agent;
- acknowledgement;
- downstream presentation/report use;
- failure/retry path.

### 3.2 Agent Organization Map

For every logical specialist define:

- `agentId` / capability ID;
- mission;
- accepted job types;
- triggering condition;
- required input object types;
- authoritative storage read scope;
- tools/models allowed;
- expected outputs;
- durable output location;
- handoff target;
- verification obligations;
- retry/failure policy;
- prohibited actions;
- empirical performance metrics.

An agent registration is not agent execution.

### 3.3 Data Custody Map

Every material information object should be reconstructable through fields equivalent to:

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

Not every object requires every field, but identity, scope, origin, custody, and downstream use must never be ambiguous.

### 3.4 Physical Proof Map

Every material status word must have an objective proof contract. See Section 5.

---

## 4. No-Substitute-Path Rule

A production component may call shared production services. It may not implement a simplified copy of another production stage for convenience.

Forbidden certification patterns include:

```text
cohortController.generateSource()
cohortController.simulateBrowser()
cohortController.extractHeadlineFacts()
cohortController.runFakeSwarmChecks()
cohortController.stampAuditPass()
cohortController.writeLearningSuccess()
```

The correct pattern is:

```text
cohortController.dispatch(SourceAcquisitionJob)
→ SourceAcquisitionService produces physical artifact
→ cohortController dispatches CustomerBrowserJourneyJob
→ actual Eve intake produces DocumentIntelligenceJob
→ Hermes dispatches specialist jobs
→ production Report Service produces deliverable
→ independent Internal Audit examines evidence
→ independent Minerva examines persisted knowledge
→ Learning Dean consumes measured outcomes
```

The cohort/scheduler/controller may schedule, lock, checkpoint, route, and observe. It may not perform the business work of the stages it coordinates.

---

## 5. Production Vocabulary Has Physical Meaning

### `SOURCE_ACQUIRED`
Requires actual physical bytes or a physically persisted customer-provided artifact. A generated URL, generated HTML, metadata object, or expected filename is insufficient.

### `AUTHORITATIVE_SOURCE_VERIFIED`
Requires authority, entity, period/document identity, physical artifact identity, hash, and source provenance. For externally retrieved sources, retrieval evidence must exist.

### `COMPLETE_AUTHORITATIVE_FILING`
Requires independent source-identity/completeness gates. File size alone is insufficient. Generated fixtures and extracted fragments are ineligible.

### `UPLOADED`
Requires actual intake through the production upload contract. A filesystem copy into a backend store is not customer upload.

### `BROWSER_VERIFIED`
Requires an actual browser process/session and evidence of real navigation and interaction. A DOM-selector list, route trace, component test, or JSON action simulation is not browser verification.

### `AGENT_EXECUTED`
Requires an execution record with actual inputs, outputs, timestamps, and handoff. Registered/healthy/available is not executed.

### `EXTRACTED`
Requires a source-backed output object and lineage to the physical source. Populating a desired field is not proof of full extraction.

### `VERIFIED`
Requires an independent verification operation appropriate to the claim. Upstream success flags are not verification.

### `CANONICAL`
Requires eligible verified evidence, scope resolution, conflict handling, and canonicalization. Synthetic fixtures cannot become customer canonical truth.

### `RENDERED`
Requires the actual product surface to consume the authoritative scoped object. A backend route returning the correct value is not proof the UI rendered it.

### `REPORTED`
Requires a physical report artifact whose material assertions trace to authoritative scoped knowledge.

### `AUDITED`
Requires an independent audit execution with its own evidence gathering and denominators. Reading a workflow success flag is not auditing.

### `LEARNED`
Requires more than a learning record. There must be an observable subsequent effect: curriculum selection, verification change, routing change, capability proposal, tested capability promotion, or measured performance change.

### `COMPLETE`
Means all required stage gates are satisfied or explicitly dispositioned. It may not mean merely that a function returned successfully.

---

## 6. Source Acquisition Contract

When Eve obtains external authoritative material, preserve:

```text
sourceAcquisitionId
executionId
agentId/serviceId
authority
request/reference
retrievalTimestamp
HTTP/result metadata where applicable
entity identity
period/document identity
physical path
physical bytes
SHA-256
MIME/type
completeness classification
retry history
failure history
```

### Invariants

1. No generated substitute may replace a failed authoritative retrieval.
2. A 200 response is not proof of a complete document.
3. A local fixture may not be relabeled as externally acquired.
4. Source acquisition failure is a first-class incident, not permission to fabricate a source.
5. Rate limits, partial downloads, timeouts, wrong periods, wrong forms, and identity mismatches must remain observable.

---

## 7. Customer UI / Browser Intake Contract

For customer-journey certification preserve:

```text
browserSessionId
browserEngine/process
startedAt/completedAt
viewport
routeHistory
DOM control/selector
action
physical selected filename
selected file hash
browser-generated request
server response
intakeSessionId
resulting documentId
visible processing state
```

### Invariants

- Customer-side staging and customer upload are separate stages.
- Backend file copy is not UI upload.
- API verification is not browser verification.
- Browser journey evidence must be generated by the actual browser interaction, not reconstructed afterward.
- The source selected in the browser must hash-match the source acquired/possessed by the simulated or real customer.

---

## 8. End-to-End Hash / Identity Continuity

Where the same physical artifact is intended to flow unchanged:

```text
SOURCE_ARTIFACT_HASH
=
CUSTOMER_STAGING_HASH
=
BROWSER_SELECTED_FILE_HASH
=
SERVER_RECEIVED_HASH
=
INTAKE_STORED_HASH
=
DOCUMENT_IR_SOURCE_HASH
```

Any mismatch must block downstream certification until explained.

Transforms are allowed only when explicit transformation lineage exists:

```text
INPUT_ARTIFACT
→ TRANSFORMATION_EXECUTION
→ OUTPUT_ARTIFACT
```

with both hashes preserved.

---

## 9. Universal Extraction Means Inventory Before Interpretation

Extraction must begin with:

> **What physically exists in the source?**

not:

> **Which fields do we want?**

The source determines the denominator.

The extractor never defines its own completeness denominator.

For applicable formats inventory structures such as:

- artifacts/pages/logical pages;
- sections/subsections;
- headings;
- paragraphs/sentences where useful;
- lists/list items;
- tables/rows/cells;
- footnotes;
- XBRL occurrences/contexts/units/dimensions;
- spreadsheet sheets/ranges/formulas/styles/comments;
- PDF text blocks/layout regions;
- charts/diagrams/images/captions;
- signatures/certifications;
- cross-references;
- headers/footers;
- presentation-only structures.

Nothing detected is silently discarded.

---

## 10. Source Elements, Observations, DataPoints, Assertions, and Facts Are Different

### Source Element
A physically detectable part of the source.

### Observation
A perceptual/structural measurement of an element: text, coordinate, row/column, style, XBRL context, layout relationship, etc.

### Attribute
A property attached to an element/observation.

### DataPoint
An independently meaningful normalized piece of information with context.

### Relationship
An edge connecting entities, concepts, periods, structures, instruments, documents, or other knowledge objects.

### Semantic Assertion
A meaningful claim expressed or derived from one or more observations/DataPoints.

### Verified Fact
A fact/assertion that has passed appropriate verification.

### Canonical Fact
The eligible scoped authoritative representation selected after reconciliation.

A source element may create zero, one, or many DataPoints. A DataPoint may have multiple evidence occurrences. Canonicalization may reduce duplicates without deleting lower-level evidence.

---

## 11. Even Discarded-for-Promotion Information Remains Information

A footer is still a SourceElement.

It may contain:

- text;
- page number;
- document identity;
- position;
- repeated-pattern classification;
- relationship to page/section.

It may receive disposition `PRESERVED_STRUCTURAL_REPETITIVE` and stop before semantic promotion.

Similarly:

- a table border may be `PRESERVED_PRESENTATION_ONLY`;
- a parent table may preserve topology without becoming a financial fact;
- a duplicate value may be `PRESERVED_DUPLICATE_CORROBORATING`;
- an ambiguous element may be `PRESERVED_REVIEW_REQUIRED`.

Stopping promotion is not deletion.

---

## 12. Extraction Completeness Must Be Multi-Dimensional

Never certify deep extraction from one count.

Measure independently where applicable:

- source structural coverage;
- table coverage;
- XBRL coverage;
- spreadsheet/formula coverage;
- narrative coverage;
- footnote coverage;
- visual coverage;
- entity/people coverage;
- relationship coverage;
- financial statement coverage;
- accounting-policy coverage;
- debt/lease/tax/equity coverage;
- risk/legal/regulatory coverage;
- provenance coverage;
- unresolved/review-required coverage.

A large document producing a small number of correct headline facts is shallow extraction.

---

## 13. Independent Source-Side Recall

Completeness must be tested from the source side.

Required methodology:

1. independently inspect/sample the physical source;
2. identify information expected to survive extraction;
3. only then query Eve's persisted knowledge;
4. classify each sample as `CAPTURED`, `PARTIAL`, `NOT_CAPTURED`, `WRONG`, or `UNSUPPORTED`;
5. report denominator and sampling method.

Forbidden methodology:

```text
expected = extractor_output_count
captured = extractor_output_count
recall = 100%
```

That is circular and invalid.

---

## 14. Ask-Anything / Knowledge Reconstruction Standard

After extraction, Eve should be testable without rereading the source.

The solver may use persisted Eve knowledge only.

Independent examination should include unforeseen questions covering applicable:

- identity;
- business;
- people;
- entities;
- financial statements;
- segments/geographies;
- currencies;
- tax;
- debt;
- leases;
- equity;
- acquisitions/goodwill;
- fair value;
- policies;
- commitments/contingencies;
- risks;
- legal/regulatory;
- governance;
- MD&A/narrative;
- provenance;
- obscure granular details.

Question generation and answer keys must be isolated from the solver.

---

## 15. Agent Execution and Handoff Contract

A named agent is a logical specialist capability. Production claims about that agent require actual execution evidence.

For every substantive job persist:

```text
executionId
agentId
engagementId
jobType
startedAt
completedAt
inputObjectIds/inputManifest
inputStorageReferences
model/tool/ruleset used
outputObjectIds/outputManifest
outputStorageReferences
handoffTarget
handoffId
status
failure/retry data
```

### Handoff invariant

```text
EXPECTED_INPUT_REFERENCES
=
ACKNOWLEDGED_REFERENCES
+
EXPLICITLY_REJECTED_WITH_DISPOSITION
```

and:

```text
UNACCOUNTED_REFERENCES = 0
```

Summaries may accompany references. They may never replace them.

---

## 16. Hermes Is an Orchestrator, Not the Entire CPA Firm

Hermes should:

- prioritize;
- schedule;
- dispatch;
- checkpoint;
- coordinate;
- enforce stage gates;
- reconcile handoffs;
- surface blockers.

Hermes must not impersonate all specialists inside one opaque function while telemetry claims each specialist executed.

Where specialist work is applicable, Hermes creates real specialist jobs and receives real outputs.

---

## 17. Specialist Responsibilities and Physical Outputs

Use existing canonical role definitions in Document 07. The following clarifies execution expectations.

### Document Architect / Extraction
Consumes physical artifact; produces Document IR and source inventory.

### Ledger
Consumes source-backed DataPoints/assertions; produces accounting classifications/workpaper mappings without replacing raw evidence.

### Veritas
Consumes exact source/evidence references; produces verification records, coordinate/hash/provenance decisions