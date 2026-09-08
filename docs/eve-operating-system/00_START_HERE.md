# Eve Operating System — Start Here

**Status:** Authoritative design intent and implementation guidance. This document does **not** certify that the runtime already satisfies every requirement below.

## Purpose

Eve is being built as a continuously operating autonomous CPA practice, document-intelligence system, and product self-testing academy. The architecture must preserve source truth, extract deeply, maintain information custody through every handoff, keep project and customer data isolated, make every material presentation traceable, and continuously improve through measured Academy work.

This documentation set consolidates the design decisions and operating rules developed across the Eve build so that future implementation agents do not have to reconstruct the architecture from chat history.

## Read in this order

1. `01_MASTER_OPERATING_MODEL.md`
2. `02_UNIVERSAL_DOCUMENT_INTELLIGENCE_AND_IR.md`
3. `03_INFORMATION_CUSTODY_AND_ZERO_LOSS.md`
4. `04_KNOWLEDGE_GRAPH_ENTITY_RESOLUTION.md`
5. `05_CONTINUOUS_ACADEMY_AND_ORCHESTRATION.md`
6. `06_UI_DATA_LINEAGE_AND_PRODUCT_AUDIT.md`
7. `07_AGENT_ROLES_AND_HANDOFFS.md`
8. `08_IMPLEMENTATION_SEQUENCE_AND_ACCEPTANCE.md`
9. `09_GEMINI_EXECUTION_DIRECTIVE.md`
10. `10_RUNTIME_STATE_PERSISTENCE_AND_TRANSACTIONAL_HANDOFFS.md`
11. `11_SECURITY_PRIVACY_AND_TENANT_BOUNDARIES.md`
12. `12_SCHEMA_VERSIONING_IDEMPOTENCY_AND_REPRODUCIBILITY.md`
13. `13_RESILIENCE_BACKUP_RESTORE_AND_DISASTER_RECOVERY.md`
14. `14_MODEL_TOOL_PROMPT_PROVENANCE_AND_COST_GOVERNANCE.md`
15. `15_PILOT_READINESS_RELEASE_AND_ACCEPTANCE_GATES.md`
16. `16_FORMAT_ADAPTER_TEST_MATRIX_AND_EXTRACTION_CONSERVATION.md`
17. `17_CURRENT_REPOSITORY_GAP_REGISTER.md`
18. `18_FAILURE_ATTRIBUTION_CAUSAL_CHAIN_AND_LEARNING_LOOP.md`

## Non-negotiable principles

- Real customer work has absolute priority over Academy work.
- No material financial assertion without evidence.
- No material financial display without lineage.
- No uncertain entity identity may be silently merged.
- No material ambiguity may be silently guessed.
- Global knowledge may help discovery, but accounting evidence authority does not automatically cross engagement boundaries.
- Agents may reason over data, but agent context is never the authoritative storage location.
- Information must survive every tool/worker/agent handoff through durable scoped persistence.
- Nothing detected in a document is conceptually discarded. It receives a disposition and remains traceable.
- Derived objects append meaning; they do not replace lower-level evidence.
- Every durable contract must be versioned enough to interpret historical records later.
- Every material stage transition must be idempotent and custody-reconciled.
- Every material failure must retain causal attribution across originator, handoff owner, consumer, expected verifier, actual detector, recovery owner, and customer impact.
- The detector of an error is not automatically the component that caused it; Eve must trace to the first causal failure.
- Production authorization is default-deny and tenant-scoped; test security is not production security.
- Persistence is not disaster recovery until restore has been proven.
- If safe capacity and eligible useful work exist, the Academy should not remain idle without a documented reason.
- Activity is not learning. Learning requires measured evidence and post-engagement evaluation.
- Product verification begins at the actual Eve UI and traces inward to data, runtime, and code.
- The objective is zero uncontained material customer-truth escapes, not zero recorded incidents.

## Permanent information hierarchy

`SOURCE ARTIFACT → SOURCE ELEMENT → OBSERVATION / ATTRIBUTE → DATA POINT → RELATIONSHIP → SEMANTIC ASSERTION → VERIFIED FACT → CANONICAL FACT → DERIVATION → PRESENTATION → REPORT`

Every layer has a distinct purpose and must remain independently addressable.

## Critical distinction

A large filing producing only a handful of correct headline metrics is **not** deep extraction. Completeness is measured against the source inventory and the information that survived the pipeline, not against a predetermined fact-count target.

## Audit proof levels

Every claim should be labeled with the strongest proof actually established:

- `CONFIGURED`
- `RUNTIME_VERIFIED`
- `PRODUCT_VERIFIED`
- `BROWSER_VERIFIED`

Never promote an implementation claim into a runtime or product certification without evidence.

## Current gap register

`17_CURRENT_REPOSITORY_GAP_REGISTER.md` is the forward-looking risk list. It is intentionally conservative: each item must be reconciled against the live runtime before being marked closed.

## Failure attribution and learning

`18_FAILURE_ATTRIBUTION_CAUSAL_CHAIN_AND_LEARNING_LOOP.md` defines how Eve attributes failures to the correct causal stage, records producer/consumer/verifier/detector roles, measures customer impact, preserves incidents as durable evidence, and turns recurring failures into Academy curriculum or bounded capability requests.
