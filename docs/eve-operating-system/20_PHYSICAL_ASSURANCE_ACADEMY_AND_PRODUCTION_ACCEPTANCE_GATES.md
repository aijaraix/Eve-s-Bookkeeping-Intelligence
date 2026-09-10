# 20 — Physical Assurance, Academy Learning & Production Acceptance Gates

**Status:** Authoritative design intent and implementation guidance. This document continues Document 19. It does **not** certify current runtime compliance.

## Purpose

Document 19 defines Eve's physical execution and no-substitute-path standard. This document completes the assurance side of that contract: Internal Audit independence, Minerva isolation, Academy learning, failure recovery, observability, negative testing, and the gates required before any workflow may be described as production/certification ready.

---

## 1. Internal Audit independence

Internal Audit must independently inspect evidence. It may not infer correctness from orchestrator or upstream status flags.

Before an unqualified production opinion, verify as applicable:

- source authority and identity;
- physical source/hash;
- non-synthetic eligibility;
- source-side completeness denominator;
- structural and semantic recall;
- DataPoint/assertion precision;
- custody and handoff reconciliation;
- actual agent execution evidence;
- accounting/derivation reconciliation;
- real product/browser proof when claimed;
- UI/backend differential;
- report/source differential;
- unresolved P0/P1 findings;
- test/canary/legacy contamination;
- report self-consistency.

If mandatory evidence is absent, `UNQUALIFIED_PASS` is forbidden.

Internal Audit must independently obtain its denominator from physical source or other external authoritative reference appropriate to the test. It may never set `expected = captured` merely because that is what the extractor produced.

---

## 2. Audit self-consistency

Before publishing an audit, mechanically reconcile the audit's own:

- engagement/project/entity IDs;
- document IDs/hashes;
- values and units;
- periods;
- source coordinates;
- counts and denominators;
- equations;
- proof-level labels;
- browser claims;
- agent execution claims;
- findings/opinion.

Contradictory audit prose blocks publication until resolved or explicitly qualified.

---

## 3. Minerva independence and source denial

Minerva is an independent examiner, not a second success-flag reader.

For sealed knowledge testing:

1. extraction completes first;
2. Minerva independently samples/reads the authoritative source;
3. Minerva creates questions/answer criteria after extraction;
4. solver execution receives only persisted Eve knowledge;
5. solver is denied physical source, web/source authority, examiner excerpts, answer key, and shared temporary examiner memory;
6. every question records examiner and solver execution identities;
7. results classify `CORRECT`, `PARTIAL`, `NOT_CAPTURED`, `WRONG`, `UNSUPPORTED`.

Question depth must include obscure and cross-document/contextual information, not only headline financial values.

A synthetic internally consistent source cannot establish complete-document production readiness.

---

## 4. Academy is a consumer of operational reality

The Academy may have synthetic curricula, but real operational learning follows:

```text
REAL EXECUTION
→ OBSERVATION
→ INCIDENT / AUDIT / MINERVA RESULT
→ POSTMORTEM
→ LEARNING CLASSIFICATION
→ CURRICULUM / PROCESS / CONTROL / CAPABILITY PROPOSAL
→ SANDBOX TEST
→ VALIDATION
→ SAFE PROMOTION
→ MEASURED LATER EFFECT
```

Writing a learning object alone is not learning.

Learning must be attributable to evidence and, where promoted, observable in later execution.

The Academy may improve **how** research/accounting/extraction is performed. It may not lower source truth, evidence, publication, or professional-review standards to increase pass rates.

---

## 5. Learning categories

Classify lessons using compatible categories such as:

- `PROCESS_GAP`
- `TRAINING_GAP`
- `CONFIGURATION_GAP`
- `TOOL_GAP`
- `CODE_GAP`
- `MODEL_GAP`
- `INFRASTRUCTURE_GAP`
- `CONTROL_GAP`
- `UI_UX_GAP`
- `SOURCE_ACQUISITION_GAP`
- `HANDOFF_GAP`
- `EXTRACTION_GAP`

A single failure does not automatically justify production code change.

---

## 6. Capability Architect contract

A capability proposal should preserve:

```text
capabilityRequestId
incidentIds / auditFindingIds
failureCategory
frequency
sampleSize
customerImpact
rootCauseEvidence
currentWorkaround
proposedCapability
expectedBenefit
risk
requiredPrivilege
sandboxTestPlan
acceptanceCriteria
promotionDecision
```

No autonomous privilege expansion solely because an agent requests a tool.

No company-specific hardcoding is a valid general capability improvement.

---

## 7. Failure recovery is part of the execution graph

When a safely repairable failure occurs:

```text
DETECT
→ PRESERVE INCIDENT
→ TRACE FIRST CAUSAL FAILURE
→ CONTAIN
→ SELECT EARLIEST SAFE CHECKPOINT
→ REPAIR / ALTERNATE TOOL / RETRY
→ REPROCESS AFFECTED SCOPE
→ REVERIFY
→ INVALIDATE OR SUPERSEDE CONTAMINATED DOWNSTREAM OBJECTS
→ CONTINUE
```

Recovery must preserve recovery owner, action, retry, checkpoint, supersession, downstream invalidation/refresh, and customer impact.

A recovered incident remains historical evidence.

---

## 8. No workaround around a broken required stage

If a required production stage is broken, downstream code may not bypass it to obtain a desired final result.

Examples:

- failed SEC acquisition may not be replaced with generated HTML;
- failed browser automation may not be replaced with a backend file copy while retaining `BROWSER_VERIFIED`;
- failed specialist dispatch may not be replaced with a monolithic function while claiming specialist execution;
- failed extraction may not be replaced with hardcoded expected financial values;
- failed Internal Audit may not be replaced with an orchestrator success stamp.

Fix the required stage or qualify/block the workflow.

---

## 9. Real-time observability must describe work, not availability

Report separately:

```text
SERVICES_HEALTHY
HEARTBEAT_TICKS
SCHEDULER_EVALUATIONS
SCHEDULER_DISPATCHES
AGENT_EXECUTIONS
TOOL_EXECUTIONS
MODEL_CALLS
BROWSER_SESSIONS
WORKER_JOBS
ENGAGEMENTS_STARTED
ENGAGEMENTS_COMPLETED
```

Never call healthy services “agents working.”

For every active engagement the operator should be able to see:

- current stage;
- actual active agent/job;
- current input/output object counts;
- last handoff;
- blockers;
- incidents;
- retries;
- source acquisition state;
- extraction state;
- review/audit state;
- next expected action.

Persist events as they occur. Do not reconstruct a fake history after completion.

---

## 10. Work-conserving scheduling

A heartbeat is a wake/evaluation mechanism, not a long artificial cooldown.

If eligible work exists and capacity/safety gates pass, scheduler evaluation should promptly dispatch the next appropriate job.

Persist machine-readable non-dispatch reasons such as:

- `NO_ELIGIBLE_WORK`
- `ACTIVE_ENGAGEMENT`
- `CUSTOMER_PREEMPTION`
- `RESOURCE_CONSTRAINT`
- `LOCK_HELD`
- `BACKOFF_ACTIVE`
- `SOURCE_RATE_LIMIT`
- `EXTERNAL_DEPENDENCY`
- `COHORT_COMPLETE`
- `OTHER`.

Stale locks require explicit lease/heartbeat semantics; age alone should not invalidate a legitimately renewed long-running lease.

---

## 11. Sequential learning experiments

When a cohort is explicitly intended to measure cross-engagement learning, enforce:

```text
ENGAGEMENT N COMPLETE
→ INTERNAL AUDIT COMPLETE
→ MINERVA COMPLETE
→ LEARNING COMPLETE
→ ENGAGEMENT CLOSED
→ THEN DISCOVER ENGAGEMENT N+1
```

Persist timestamps proving ordering.

If companies are merely reserved in advance, report that accurately and do not claim later selection was influenced by prior learning.

---

## 12. Data and truth classifications

At minimum distinguish:

- `REAL_CUSTOMER`
- `AUTONOMOUS_REAL_SOURCE_PRACTICE`
- `SYNTHETIC_ACADEMY`
- `CANARY`
- `REGRESSION`
- `DEMO`
- `GOOGLE_ASSISTED_DEVELOPMENT_AND_LEARNING_COHORT`
- `QUARANTINED_NON_AUTHORITATIVE`
- `SUPERSEDED_HISTORICAL_RUN`.

Classification must be data-driven, not inferred from ID prefixes.

Synthetic/test work cannot inflate commercial customer counts or become eligible customer canonical truth.

---

## 13. Negative tests are mandatory

Production guards must prove they reject:

1. generated filing presented as authoritative;
2. padding-based fake filing;
3. extracted fragment presented as complete filing;
4. filesystem copy presented as browser upload;
5. route/selector trace presented as browser session;
6. hardcoded financial fixture presented as extraction;
7. monolithic orchestrator presented as specialist swarm;
8. audit success flag without independent evidence;
9. circular completeness denominator;
10. source-denied exam with answer/source leakage;
11. canary/synthetic data entering customer scope;
12. stale/legacy fallback entering active presentation;
13. UI count detached from authoritative store;
14. report value detached from canonical fact;
15. learning record with no measurable downstream effect presented as learned capability.

A guard existing in code is `CONFIGURED`; a negative test physically rejecting the invalid case is stronger runtime evidence.

---

## 14. Production-path acceptance graph

Before arming a blind autonomous production trial, physically verify using archived/development subjects only:

```text
REAL SOURCE RETRIEVAL / CUSTOMER ARTIFACT
→ PHYSICAL SOURCE IDENTITY
→ REAL BROWSER PROCESS
→ REAL UI UPLOAD
→ HASH CONTINUITY
→ PRODUCTION INTAKE
→ PRODUCTION DOCUMENT INTELLIGENCE
→ SOURCE-SIDE RECALL
→ HERMES DISPATCH
→ APPLICABLE SPECIALIST EXECUTIONS
→ PBC / REVIEW
→ PRODUCTION REPORT
→ INDEPENDENT INTERNAL AUDIT
→ MINERVA ISOLATION
→ LEARNING HANDOFF
```

Do not use future blind-cohort companies for acceptance tests.

One failed mandatory gate means the blind cohort is not ready.

---

## 15. UI/product acceptance

A production workflow is not product-verified until the actual Eve product is reconciled against authoritative stores.

For each major screen compare:

```text
visible value/count/status
↔ presentation contract
↔ authoritative object/store
↔ scope/classification
```

Audit client/engagement/document counts, extraction metrics, financial values, chart points, entity relationships, PBC, review notes, reports, audits, incidents, and learning.

Click-to-source must resolve to actual evidence, not a fabricated locator.

---

## 16. Report acceptance

Sample material report assertions and trace backward:

```text
REPORT
→ PRESENTATION/REPORT CONTRACT
→ CANONICAL/DERIVATION
→ VERIFIED FACT/ASSERTION
→ DATAPOINT/RELATIONSHIP
→ OBSERVATION
→ SOURCE ELEMENT
→ SOURCE ARTIFACT
```

Check report IDs, entity, period, currency, units/scales, values, coordinates, hashes, and review status.

---

## 17. Empirical agent performance

Track with denominators:

- tasks completed;
- objects processed;
- errors introduced;
- errors detected;
- errors missed;
- false positives/negatives;
- handoff failures;
- recoveries;
- review reopen rate;
- customer-impact incidents;
- latency;
- model/tool/resource cost;
- recurring failure classes.

Avoid cosmetic competency percentages without sample size.

---

## 18. Customer-truth escape funnel

Measure where errors are caught:

```text
CAUGHT_AT_SOURCE
CAUGHT_AT_HANDOFF
CAUGHT_AT_EXTRACTION
CAUGHT_AT_VERIFICATION
CAUGHT_AT_CANONICALIZATION
CAUGHT_AT_PRESENTATION
CAUGHT_AT_REPORT_REVIEW
CUSTOMER_VISIBLE_NOT_DELIVERED
CUSTOMER_DELIVERED
```

The objective is zero uncontained material customer-truth escapes, not zero incidents.

---

## 19. Physical audit order

For production-readiness investigations prefer:

```text
ACTUAL PRODUCT UI
→ AUTHORITATIVE DATA
→ PERSISTED EXECUTION/HANDOFFS
→ RUNTIME SERVICES/TOOLS
→ CODE
```

For source-completeness investigations additionally begin independently from the physical source.

Do not inspect code and infer the product works.

---

## 20. Required “no assumptions” questions

For every material production claim ask:

1. What physical object entered?
2. Where is it durably stored?
3. What execution actually processed it?
4. Which agent/service/tool performed that execution?
5. What exact inputs did it consume?
6. What exact outputs did it persist?
7. Who acknowledged the handoff?
8. What was dispositioned rather than promoted?
9. What independent control verified it?
10. What does the actual UI show?
11. What report consumed it?
12. What happened if the stage failed?
13. Did any simulation/test/legacy path participate?
14. What later evidence proves learning occurred?

If these cannot be answered, the strongest claim is `UNVERIFIED` or the applicable lower proof level.

---

## 21. Permanent acceptance invariants

1. Naming is not execution.
2. Registration is not execution.
3. A trace is not a browser.
4. A file copy is not customer upload.
5. A generated source is not authoritative retrieval.
6. A desired field is not complete extraction.
7. Extractor output is not its own recall denominator.
8. A monolithic helper is not a multi-agent handoff graph.
9. A success flag is not independent audit evidence.
10. A learning record is not measured learning.
11. UI truth and report truth must consume authoritative scoped knowledge.
12. Temporary state cannot be the only location of material information.
13. Synthetic/test truth is permanently isolated from customer truth.
14. Every material handoff is custody-reconciled.
15. Every material production claim is bounded by the strongest physical proof actually established.

---

## 22. Relationship to other Eve specifications

- Document 02 defines Universal Document Intelligence and IR.
- Document 03 defines information custody and zero loss.
- Document 04 defines knowledge graph/entity resolution.
- Document 05 defines continuous Academy/orchestration.
- Document 06 defines UI lineage/product-first audit.
- Document 07 defines agent roles/handoffs.
- Documents 10–16 define persistence, security, reproducibility, resilience, model/tool provenance, pilot gates, and format conservation.
- Document 18 defines causal failure attribution and learning.
- Document 19 defines the physical execution/no-substitute-path contract.
- **Document 20 defines the independent assurance and production acceptance gates that prove Document 19 is actually being followed.**

Together they form the operating constitution for future Eve implementation agents.