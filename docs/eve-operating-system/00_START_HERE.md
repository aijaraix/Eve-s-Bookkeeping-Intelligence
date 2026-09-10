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
19. `19_PHYSICAL_EXECUTION_NO_SUBSTITUTE_PATH_AND_END_TO_END_PRODUCT_TRUTH.md`
20. `20_PHYSICAL_ASSURANCE_ACADEMY_AND_PRODUCTION_ACCEPTANCE_GATES.md`
21. `21_SYSTEM_WIDE_EXECUTION_TOPOLOGY_SIDE_FLOW_AND_DUPLICATE_PATH_RECONCILIATION.md`
22. `22_GEMINI_SYSTEM_WIDE_AUDIT_REPAIR_VERIFY_AND_OWNER_REPORT_DIRECTIVE.md`
23. `23_RUNTIME_AUTHORITY_DEPLOYMENT_AND_ENVIRONMENT_PARITY.md`
24. `24_ZEABUR_SERVICE_TOPOLOGY_STORAGE_AND_SCHEDULER_OWNERSHIP.md`
25. `25_EXTERNAL_RUNTIME_ASSURANCE_SENTINELX_AND_PHYSICAL_OBSERVABILITY.md`
26. `26_DEPLOYMENT_PROMOTION_CUTOVER_ROLLBACK_AND_PHYSICAL_ATTESTATION.md`
27. `27_CURRENT_ZEABUR_RUNTIME_GAP_REGISTER_AND_REMEDIATION_PLAN.md`
28. `28_ZEABUR_RUNTIME_REPAIR_DEPLOY_VERIFY_AND_OWNER_REPORT_DIRECTIVE.md`

Documents 19–28 are mandatory before modifying, certifying, auditing, reconciling, deploying, or externally attesting production execution paths. They exist specifically to prevent a simulated, parallel, legacy, duplicate, cached, fallback, preview-only, build-only, or presentation-only implementation from being mistaken for the real Eve production workflow.

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
- **Naming is not execution.** A production component/agent must have physical execution evidence.
- **No substitute production path.** A controller may orchestrate production services but may not simulate or reimplement them and claim they ran.
- **One conceptual production responsibility must not have multiple uncontrolled truth-producing implementations.** Duplicate writers and side flows must be reconciled.
- **The source determines the extraction denominator.** Extractor output cannot define its own recall denominator.
- **A generated trace is not a browser session.** `BROWSER_VERIFIED` requires actual browser execution evidence.
- **A filesystem copy is not customer upload.** Customer-journey certification must exercise the production intake path.
- **A success flag is not independent audit evidence.** Internal Audit and Minerva must independently examine eligible evidence.
- **A learning record is not learning.** Learning requires a measurable later effect.
- **Healthy/registered is not executing.** Agent and service telemetry must distinguish availability from actual work.
- **Fallback resilience must not silently become higher-authority truth.** Every fallback has an explicit authority ceiling and verification requirement.
- **Historical quarantine must be enforced at read boundaries, not merely hidden in the UI.**
- **Every production claim is environment-specific.** Code or test results in one environment may not certify another environment.
- **Build is not deployment.** GitHub/AI Studio/preview code is not production until the declared runtime physically runs the intended artifact.
- **Every production service requires runtime identity.** Commit, build/artifact/image, config/schema, and running-instance identity must be reconcilable.
- **One scheduling domain has one authoritative scheduler leader.** Health tickers and worker heartbeats cannot masquerade as dispatchers.
- **A heartbeat intention is not a dispatch.** Actual work requires a job/execution ID and consumer acknowledgement.
- **Separate persistent volumes require explicit handoffs.** Co-location on one server does not imply shared custody.
- **Production runtime source must be traceable to immutable deployment artifacts.** Runtime source injection is not the desired final production deployment architecture.
- **Secrets do not belong in process command-line arguments.** Use protected secret injection and redact external assurance evidence.
- **SentinelX is independent external assurance.** It corroborates physical runtime behavior; it does not become Eve's accounting truth or silently mutate what it audits.

## Permanent information hierarchy

`SOURCE ARTIFACT → SOURCE ELEMENT → OBSERVATION / ATTRIBUTE → DATA POINT → RELATIONSHIP → SEMANTIC ASSERTION → VERIFIED FACT → CANONICAL FACT → DERIVATION → PRESENTATION → REPORT`

Every layer has a distinct purpose and must remain independently addressable.

## Critical distinction

A large filing producing only a handful of correct headline metrics is **not** deep extraction. Completeness is measured against the source inventory and the information that survived the pipeline, not against a predetermined fact-count target.

A production workflow that returns the correct-looking output through a fixture, generated source, simulated browser, monolithic pseudo-swarm, detached UI summary, audit success shortcut, duplicate canonical writer, legacy API, stale cache, unbounded fallback, preview-only implementation, or undeployed GitHub code is **not** production verification. Follow Documents 19–28 to prove and reconcile the physical execution path.

## Audit proof levels

Every claim should be labeled with the strongest proof actually established:

- `CONFIGURED`
- `RUNTIME_VERIFIED`
- `PRODUCT_VERIFIED`
- `BROWSER_VERIFIED`

Never promote an implementation claim into a runtime or product certification without evidence. Proof-level promotion must be fail-closed and evidence-backed.

Environment identity is part of proof. `BROWSER_VERIFIED` in one preview environment does not automatically verify a different production environment.

## Current gap registers

`17_CURRENT_REPOSITORY_GAP_REGISTER.md` remains the general forward-looking repository risk list.

`27_CURRENT_ZEABUR_RUNTIME_GAP_REGISTER_AND_REMEDIATION_PLAN.md` is the current physical Zeabur runtime gap register created from independent SentinelX observation. For physical Zeabur production readiness, Document 27 takes precedence over historical statements that those runtime gaps were already closed, until its gaps are physically verified as resolved.

## Failure attribution and learning

`18_FAILURE_ATTRIBUTION_CAUSAL_CHAIN_AND_LEARNING_LOOP.md` defines how Eve attributes failures to the correct causal stage, records producer/consumer/verifier/detector roles, measures customer impact, preserves incidents as durable evidence, and turns recurring failures into Academy curriculum or bounded capability requests.

## Physical execution and assurance

`19_PHYSICAL_EXECUTION_NO_SUBSTITUTE_PATH_AND_END_TO_END_PRODUCT_TRUTH.md` defines how real source acquisition, customer intake, extraction, agent execution, custody, UI, and reports must physically connect without substitute implementations.

`20_PHYSICAL_ASSURANCE_ACADEMY_AND_PRODUCTION_ACCEPTANCE_GATES.md` defines the independent audit, Minerva, Academy, negative-test, observability, and production acceptance gates required to prove those physical paths actually executed.

## System-wide side-flow reconciliation

`21_SYSTEM_WIDE_EXECUTION_TOPOLOGY_SIDE_FLOW_AND_DUPLICATE_PATH_RECONCILIATION.md` defines the permanent repository-wide audit/remediation standard for discovering legacy, duplicate, simulated, cached, fallback, orphaned, or detached side paths across extraction, canonicalization, agents, memory, Academy, audit, UI, reports, Q&A, identity, security, formats, schedulers, and specialty accounting.

`22_GEMINI_SYSTEM_WIDE_AUDIT_REPAIR_VERIFY_AND_OWNER_REPORT_DIRECTIVE.md` is the operating directive for Google/Gemini sessions performing that reconciliation. It requires observation-first physical proof, then safe generalized repair, negative bypass tests, post-repair physical verification, and a plain-language owner report rather than self-certification from names/status flags.

## Runtime authority and Zeabur physical production

`23_RUNTIME_AUTHORITY_DEPLOYMENT_AND_ENVIRONMENT_PARITY.md` defines environment identity, Runtime Authority Manifests, runtime fingerprints, and the prohibition on promoting AI Studio/preview/build evidence into production claims without physical deployment proof.

`24_ZEABUR_SERVICE_TOPOLOGY_STORAGE_AND_SCHEDULER_OWNERSHIP.md` defines service/PVC ownership, exactly-one scheduler leadership, worker integrity, cross-service handoffs, timer classification, and service-health semantics for the Zeabur/K3s backend.

`25_EXTERNAL_RUNTIME_ASSURANCE_SENTINELX_AND_PHYSICAL_OBSERVABILITY.md` defines SentinelX as a read-only-by-default external assurance plane used to independently corroborate processes, pods, images, storage, browser execution, jobs, scheduler activity, and deployment state.

`26_DEPLOYMENT_PROMOTION_CUTOVER_ROLLBACK_AND_PHYSICAL_ATTESTATION.md` defines the required repository → build → artifact → deployment → running-instance → verification → rollback chain.

`27_CURRENT_ZEABUR_RUNTIME_GAP_REGISTER_AND_REMEDIATION_PLAN.md` records the current physical Zeabur findings and exact closure evidence required for each gap.

`28_ZEABUR_RUNTIME_REPAIR_DEPLOY_VERIFY_AND_OWNER_REPORT_DIRECTIVE.md` instructs engineering agents how to repair those physical gaps, deploy into the real services, run negative bypass tests, obtain independent physical corroboration, and report gap-by-gap closure without another parallel architecture.
