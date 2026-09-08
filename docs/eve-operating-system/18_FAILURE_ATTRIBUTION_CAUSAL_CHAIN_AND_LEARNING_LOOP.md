# Eve Failure Attribution, Causal Chain & Learning Loop

**Status:** Authoritative design intent and implementation guidance. This document does **not** certify that the runtime already satisfies every requirement below.

## Purpose

Eve must not merely detect that something went wrong. It must be able to determine **where the failure originated, which agent/service/tool produced the affected object, which handoff propagated it, which control should have detected it, which control actually detected it, how far it traveled, whether a customer was affected, how recovery occurred, and what the organization learned**.

This document formalizes failure attribution as a permanent part of Eve's operating model so that information-quality problems can be traced through the same custody and lineage architecture used for source evidence.

The goal is not to punish agents. The goal is causal observability, safer customer truth, measurable improvement, and faster remediation.

---

## 1. Core Principle — Trace the First Causal Failure

A visible error at the dashboard or report layer is often only the final symptom.

Eve must trace backward until it identifies the **first causal failure**.

Example:

`SOURCE → DOCUMENT IR → EXTRACTION → LEDGER → VERITAS → CANONICAL → UI → REPORT`

If a wrong report value appears, the report generator is not automatically the cause.

The actual cause might be:

- parser extracted the wrong period;
- Ledger assigned the wrong scale;
- a handoff dropped records;
- Veritas accepted an invalid source coordinate;
- canonicalization selected a synthetic fixture;
- UI used stale cached data;
- report generator consumed the wrong engagement context.

The root-cause record must distinguish these possibilities.

---

## 2. Required Roles in Every Material Incident

Do not use a single `responsibleAgent` field.

Every incident should distinguish, where applicable:

### Originator
The agent/service/tool that created the first affected object.

### Handoff Owner
The component responsible for transferring the object/reference into the next stage.

### Consumer
The component that accepted and acted on the object.

### Expected Verifier
The control or specialist that was supposed to catch this type of issue.

### Actual Detector
The agent/service/control that actually discovered the issue.

### Recovery Owner
The agent/service responsible for containment and safe recovery.

### Reviewer / Approver
Where human or professional approval is required, the approving authority.

The detector must never automatically be blamed for the failure it found.

---

## 3. Material Operation Execution Record

Every material processing action should retain an execution identity sufficient to reconstruct the full chain.

Recommended fields:

```text
executionId
custodyId
projectId
engagementId
entityId
sourceArtifactId
sourceElementId

stageId
handoffId

producerAgentId
producerService
producerTool
producerModel

consumerAgentId
consumerService
consumerTool
consumerModel

expectedVerifierAgentId
actualVerifierAgentId
detectorAgentId
recoveryAgentId

inputObjectIds
outputObjectIds

startedAt
completedAt

expectedReferenceCount
acknowledgedReferenceCount
explicitDispositionCount
rejectedReferenceCount
unaccountedReferenceCount

status
failureCategory
failurePoint
failureTimestamp
rootCauseClassification

retryAttempt
fallbackUsed
recoveryAction
resolutionStatus

schemaVersion
parserVersion
extractorVersion
promptTemplateVersion
modelVersion
rulesetVersion
```

Only fields relevant to a specific operation need to be populated, but identity and lineage must never be ambiguous.

---

## 4. Failure Taxonomy

Support at minimum:

### Source & Custody
- `SOURCE_CORRUPTION`
- `SOURCE_HASH_MISMATCH`
- `BROKEN_SOURCE_REFERENCE`
- `INVALID_COORDINATE`
- `HANDOFF_INCOMPLETE`
- `HANDOFF_DUPLICATION`
- `TEMPORARY_STATE_LOSS`
- `PERSISTENCE_FAILURE`
- `REHYDRATION_FAILURE`

### Extraction
- `PARSER_FAILURE`
- `LAYOUT_RECONSTRUCTION_FAILURE`
- `OCR_FAILURE`
- `TABLE_EXTRACTION_FAILURE`
- `XBRL_CONTEXT_FAILURE`
- `VISUAL_EXTRACTION_FAILURE`
- `DOCUMENT_CLASSIFICATION_ERROR`

### Accounting / Semantics
- `SCALE_ERROR`
- `CURRENCY_ERROR`
- `PERIOD_ERROR`
- `ENTITY_RESOLUTION_ERROR`
- `ACCOUNTING_CLASSIFICATION_ERROR`
- `CANONICALIZATION_ERROR`
- `DERIVATION_ERROR`
- `CONSOLIDATION_ERROR`
- `TAXONOMY_MAPPING_ERROR`
- `CONTRADICTION_MISSED`

### Data Isolation & Truth
- `SYNTHETIC_FIXTURE_CONTAMINATION`
- `CANARY_CONTAMINATION`
- `CROSS_ENGAGEMENT_CONTAMINATION`
- `CROSS_TENANT_CONTAMINATION`
- `STALE_CANONICAL_TRUTH`
- `LEGACY_DATA_REINTRODUCTION`
- `FALLBACK_DATA_USED`

### Model / Tool
- `MODEL_HALLUCINATION`
- `MODEL_TIMEOUT`
- `MODEL_PROVIDER_FAILURE`
- `TOOL_FAILURE`
- `PROMPT_TEMPLATE_ERROR`
- `ROUTING_ERROR`

### Product / Reporting
- `REPORT_RENDER_ERROR`
- `REPORT_SOURCE_MISMATCH`
- `UI_DATA_MISMATCH`
- `STALE_UI_STATE`
- `BROKEN_DOWNLOAD`
- `PROVENANCE_DRAWER_MISMATCH`
- `CHART_LINEAGE_ERROR`

### Security / Authorization
- `AUTHENTICATION_FAILURE`
- `AUTHORIZATION_FAILURE`
- `TENANT_BOUNDARY_FAILURE`
- `IDOR_EXPOSURE`

### Review / Governance
- `REVIEW_FAILURE`
- `MISSED_VERIFICATION`
- `UNSUPPORTED_PROFESSIONAL_CLAIM`
- `UNRESOLVED_MATERIAL_AMBIGUITY`

### Other
- `OTHER`

The taxonomy is extensible, but new categories must remain specific enough to support learning and trend analysis.

---

## 5. First-Class OperationalIncident / EvolutionIncident

Failures must not live only in logs.

Create a durable incident object that may connect to:

- project;
- engagement;
- client/entity;
- document;
- source artifact;
- source element;
- observation;
- DataPoint;
- relationship;
- semantic assertion;
- verified fact;
- canonical fact;
- derivation;
- agent;
- service;
- model;
- tool;
- handoff;
- UI surface;
- chart;
- report;
- PBC request;
- review note;
- learning case;
- capability request.

Example conceptual graph:

```text
INCIDENT-392
  CAUSED_AT_STAGE → CANONICALIZATION
  CAUSED_BY_COMPONENT → universalDataGraph
  AFFECTED_DATAPOINT → dp-pltr-revenue
  AFFECTED_ENGAGEMENT → eng-cj-325562
  EXPECTED_DETECTOR → eve-veritas
  ACTUAL_DETECTOR → eve-presentation-auditor
  ROOT_CAUSE → SYNTHETIC_FIXTURE_CONTAMINATION
  RESULTED_IN → WRONG_UI_VALUE
  RESULTED_IN → WRONG_REPORT
  LEARNING_ASSIGNED_TO → eve-dean
  CAPABILITY_REVIEWED_BY → eve-architect
```

---

## 6. Customer Impact Classification

Every incident must be assigned one of the following or a more specific compatible classification:

- `NO_CUSTOMER_IMPACT`
- `ACADEMY_ONLY`
- `CAUGHT_AT_SOURCE`
- `CAUGHT_AT_HANDOFF`
- `CAUGHT_BEFORE_CANONICAL`
- `CAUGHT_BEFORE_PRESENTATION`
- `CAUGHT_BEFORE_REPORT`
- `CUSTOMER_VISIBLE_NOT_DELIVERED`
- `CUSTOMER_DELIVERED`
- `UNKNOWN`

A material `CUSTOMER_DELIVERED` truth error is P0 and requires explicit incident review.

The objective is not zero recorded incidents. A learning system should discover failures. The safety objective is **zero uncontained material customer-truth escapes**.

---

## 7. Handoff Failure Attribution

Every material handoff must support causal reconciliation.

For each stage transition retain:

```text
handoffId
producer
consumer
expectedInputReferences
acknowledgedReferences
explicitlyRejectedReferences
explicitDispositionReferences
unaccountedReferences
checkpointId
retryCount
idempotencyKey
persistenceConfirmation
```

Required invariant:

`ACKNOWLEDGED + EXPLICITLY_REJECTED_WITH_DISPOSITION = EXPECTED_INPUT_REFERENCES`

and:

`UNACCOUNTED_REFERENCES = 0`

If not, open an incident automatically.

Example:

```text
Expected: 12,406
Producer: eve-ledger
Consumer: eve-veritas
Acknowledged: 4,003
Explicitly dispositioned: 0
Unaccounted: 8,403
Failure: HANDOFF_INCOMPLETE
```

Sentinel should checkpoint the engagement and prevent affected data from progressing until the custody failure is resolved.

---

## 8. Information-Loss Detection

Information loss may occur even when both producer and consumer report success.

Therefore reconcile:

- object counts;
- object IDs;
- content hashes;
- parent references;
- custody envelopes;
- durable locations;
- schema versions.

A smaller number of derived objects is not itself loss. Inputs remain preserved and referenced.

For example:

`47,810 observations → 12,481 assertions → 3,912 verified accounting facts → 684 canonical facts`

is acceptable only if the 47,810 observations still exist or remain durably represented with explicit disposition and lineage.

---

## 9. Missed-Detection Analysis

For every material incident Eve should answer:

1. Who or what introduced the first incorrect state?
2. Which stage was responsible for transferring it?
3. Which component consumed it?
4. Which control was designed to detect it?
5. Why did that control fail?
6. Who actually detected it?
7. How many stages did it propagate?
8. Did it reach canonical truth?
9. Did it reach presentation?
10. Did it reach a report?
11. Did it reach a customer?
12. What containment/recovery occurred?

Do not stop analysis at the final visible symptom.

---

## 10. Agent Operational Performance

Move away from purely static competency scores.

For each agent maintain empirical operational metrics, with visible sample size:

- objects processed;
- tasks completed;
- errors introduced;
- errors detected;
- errors missed;
- handoff failures;
- verification failures;
- successful recoveries;
- false positives;
- false negatives;
- review reopen rate;
- customer-impact incidents;
- average processing latency;
- applicable cost/resource use;
- recurring failure categories.

Never infer strong competency from tiny samples.

Examples of useful findings:

- `Ledger processed 41,282 accounting objects and introduced 3 scale-classification errors.`
- `Veritas reviewed 17 invalid-coordinate incidents and missed 2.`

These statements are more useful than a cosmetic percentage without denominator context.

---

## 11. Learning Dean Feedback Loop

Every material incident should be evaluated by the Learning Dean.

Classify root remediation need as one or more of:

- `PROCESS_GAP`
- `TRAINING_GAP`
- `CONFIGURATION_GAP`
- `TOOL_GAP`
- `CODE_GAP`
- `MODEL_GAP`
- `INFRASTRUCTURE_GAP`
- `CONTROL_GAP`

The Learning Dean should decide whether the incident requires:

- new curriculum;
- targeted replay;
- changed verification rule;
- new extraction scenario;
- model-routing calibration;
- agent training;
- capability request;
- no action beyond observation.

A single incident should not automatically trigger a production code change.

---

## 12. Capability Architect Escalation

Recurring or material failures may generate a structured capability request.

A capability request should include:

```text
capabilityRequestId
incidentIds
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
```

Sentinel least-privilege controls still apply.

No autonomous privilege expansion solely because an agent wants a new tool.

---

## 13. Recovery Attribution

Recovery itself must be auditable.

Record:

- recovery owner;
- recovery action;
- retry count;
- alternate parser/model/tool;
- checkpoint used;
- data revalidated;
- canonical objects superseded;
- downstream presentation invalidated/refreshed;
- whether customer communication was required.

A recovered incident is not equivalent to a non-event. It remains useful learning evidence.

---

## 14. Failure Escape Funnel

Measure failures by where they were caught:

```text
TOTAL_ERRORS_DETECTED
CAUGHT_AT_SOURCE
CAUGHT_AT_HANDOFF
CAUGHT_AT_EXTRACTION
CAUGHT_AT_VERIFICATION
CAUGHT_AT_CANONICALIZATION
CAUGHT_AT_PRESENTATION
CAUGHT_AT_REPORT_REVIEW
CUSTOMER_VISIBLE_ESCAPES
CUSTOMER_DELIVERED_ESCAPES
```

Trend these over time by:

- agent;
- service;
- parser;
- model;
- document format;
- accounting domain;
- engagement type;
- curriculum case.

Improvement should shift failures earlier in the funnel and reduce customer-visible escapes.

---

## 15. Failure & Learning Operator UI

Provide an operator-visible `Failures & Learning` experience.

At minimum show:

- incident ID;
- what happened;
- severity;
- project/client;
- engagement;
- document;
- affected metric/fact/object;
- pipeline stage;
- originating agent/tool/service;
- handoff owner;
- expected verifier;
- actual detector;
- affected downstream surfaces;
- customer impact;
- root cause;
- recovery;
- current status;
- lesson learned;
- linked capability request;
- exact lineage/custody chain.

Useful morning-summary metrics might include:

- operational incidents overnight;
- self-recovered;
- Academy-only;
- customer-visible but not delivered;
- customer-delivered;
- awaiting operator action;
- recurring failure classes;
- newly created learning cases.

---

## 16. UI / Report Impact Propagation

When an upstream object is invalidated or quarantined, Eve must identify every downstream dependency:

- DataPoints;
- relationships;
- assertions;
- canonical facts;
- derivations;
- UI surfaces;
- chart points;
- reports;
- Copilot retrieval indexes.

An incident is not resolved until contaminated downstream objects are either:

- invalidated;
- superseded;
- rebuilt;
- quarantined;
- explicitly preserved as historical evidence.

---

## 17. Historical Failure Preservation

Do not delete failures once fixed.

Preserve:

- original object;
- original incorrect value;
- original lineage claim;
- discovery timestamp;
- corrective action;
- superseding object;
- lessons learned.

Historical failures are evidence and training material.

They must not remain eligible as current authoritative truth.

---

## 18. Academy Integration

The Academy should intentionally learn from real operational failure patterns while preserving customer isolation.

Examples:

- repeated PDF table-scale errors → targeted scale curriculum;
- wrong period-column selection → comparative-period cases;
- entity false-match risk → entity-resolution curriculum;
- broken source coordinates → Veritas provenance exercises;
- handoff losses → custody/retry exercises;
- synthetic contamination → truth-boundary regression suite.

Academy may learn from incident metadata and sanitized patterns, but customer evidence authority must remain scoped.

---

## 19. Failure Attribution Acceptance Tests

At minimum verify:

1. A parser error can be traced to parser/version/tool and affected elements.
2. A handoff count mismatch opens an incident before canonicalization.
3. A verifier miss distinguishes expected verifier from actual detector.
4. A stale UI value traces to its upstream stale object.
5. Synthetic fixture contamination records the first production-boundary violation.
6. A recovery retry resumes from a persisted checkpoint without duplicate outputs.
7. Customer impact classification is stored and queryable.
8. Learning Dean receives material incidents.
9. Capability Architect can link a capability request to recurring incidents.
10. Historical incidents remain queryable after resolution.

---

## 20. Permanent Invariants

The following are permanent Eve rules:

1. **The detector is not automatically the cause.**
2. **Trace to the first causal failure.**
3. **Every material handoff has producer and consumer identity.**
4. **Every material object has execution and custody identity.**
5. **No unexplained handoff remainder is acceptable.**
6. **Failures are durable first-class evidence.**
7. **Customer impact must be explicit.**
8. **Recovery remains auditable.**
9. **Learning is driven by measured incidents, not cosmetic scores.**
10. **The objective is zero uncontained material customer-truth escapes, not zero recorded failures.**

---

## 21. Recommended Final Audit Output

Future Eve audits should include a section like:

```text
FAILURES DETECTED
FAILURES BY CATEGORY
FAILURES BY STAGE
FAILURES BY AGENT/SERVICE
CAUGHT AT SOURCE
CAUGHT AT HANDOFF
CAUGHT BY VERITAS/SENTINEL/MINERVA
CUSTOMER VISIBLE
CUSTOMER DELIVERED
SELF-RECOVERED
OPERATOR ESCALATIONS
LEARNING CASES CREATED
CAPABILITY REQUESTS CREATED
RECURRING FAILURE CATEGORIES
```

The presence of incidents is not itself a failure of Eve.

A trustworthy Eve system may report:

> 17 incidents found, 15 self-recovered, 2 escalated, 0 material customer-truth escapes.

That is more informative than a blanket `100% PASS` claim.
