# 06 — UI Data Lineage and Product-First Audit

**2026-09-15 clarification:** This is an existing product requirement, not a new architecture package. The owner-visible integration failure is documented in [Frontend Runtime Repair — 2026-09-15](FRONTEND_RUNTIME_REPAIR_2026-09-15.md). Read the amendment at the end of this document and the active scope in [09](09_GEMINI_EXECUTION_DIRECTIVE.md). Documentation, completed backend jobs, and generated files do not establish product acceptance.

## Objective

The actual Eve product is the primary operator truth surface. The dashboard, engagement views, financial statements, charts, PBC, review, reports, Academy, and learning screens must reflect authoritative scoped data rather than hidden fallback fixtures or detached backend state.

## Product data rule

The UI does not own financial truth. It renders authoritative knowledge.

Example lineage:

`UI Metric / Chart Point → Presentation Contract → Derivation or Canonical Fact → Verified Fact / Assertion → DataPoint → Observation → SourceElement → SourceArtifact`

Every material numeric surface must support this reverse trace.

Material narrative in reports should also preserve provenance where it is presented as factual.

## Financial surface registry

Maintain a registry of material presentation surfaces, including:

- dashboard KPI tiles
- financial statement rows
- ratio cards
- chart series/points
- entity graph relationships
- report values
- audit/review badges where they make material claims

When new UI features are added, their data contracts and lineage requirements must be registered as part of implementation.

## Chart requirements

Every material chart point must have:

- entity
- period
- currency/unit/scale
- canonical/derived source
- underlying operands where applicable
- evidence lineage

No disconnected hardcoded chart points in production paths.

## Dashboard operating view

Internal operator dashboard should separately expose:

- real commercial clients
- synthetic customer journeys
- Academy projects
- canaries/regressions
- active projects
- completed projects
- documents processed
- source elements
- observations/data points
- relationships
- semantic assertions
- verified facts
- canonical facts
- unresolved items
- PBC/clarifications/review
- reports
- Minerva evaluations
- learning findings
- capability requests
- system health

Synthetic work must not inflate real-customer counts or customer financial aggregates.

## Project detail

Every project should be inspectable through a coherent context including:

- company overview
- project/engagement identity
- documents
- Document Intelligence
- source elements
- data points
- relationships/entity graph
- financial statements
- evidence
- unresolved items
- clarifications
- PBC
- review
- reports
- journey history
- Minerva
- learning/postmortem
- neural replay

## Document Intelligence UI

For each document show authoritative persisted metrics:

- source metadata/hash
- structure inventory
- tables/XBRL/paragraphs/visuals/cross-references
- source-element counts
- observation/data-point counts
- relationship/assertion counts
- verified/canonical counts
- coverage denominators
- unresolved/review-required elements

Avoid static demo percentages.

## Data Point Explorer

Support filtering/search by relevant dimensions such as:

- entity
- family/subtype
- period
- currency
- source document/section
- verification state
- confidence
- topic

## Entity Graph UI

Allow operators to inspect legal entities, subsidiaries, JVs, counterparties, jurisdictions, currencies, segments, ownership, and other relationships. Clicking nodes/edges should expose provenance and current resolution state.

## Clarification Hub

Show:

- question
- why it matters
- evidence
- conflicting evidence
- financial/report impact
- assignee
- response/supporting docs
- resolution/status

## Product-first audit philosophy

Future audits should normally proceed:

`PRODUCT UI → DATA → RUNTIME → CODE`

Do not start with code and infer that the product works.

## Four proof levels

Label each claim:

- `CONFIGURED`
- `RUNTIME_VERIFIED`
- `PRODUCT_VERIFIED`
- `BROWSER_VERIFIED`

Examples:

- A route exists: configured.
- API returned real data: runtime verified.
- Actual Eve page showed correct authoritative value: product verified.
- Browser clicked upload/provenance/report and completed the real workflow: browser verified.

## Browser journey expectations

Representative certification journeys should verify, where appropriate:

- app launch/authentication
- client/engagement selection
- upload modal
- physical file selection
- upload/ingestion network request
- document repository
- extraction status
- financial statement rendering
- click-to-source
- PBC/clarification
- review
- Report Wizard
- downloads
- activity/audit logs
- responsive/mobile basics

API-only checks must never be described as browser verification.

## Audit reconciliation

For major screens produce a differential:

- screen
- visible value/count
- authoritative API/data value
- backing store
- difference
- classification/filter explanation
- verdict

This is especially important for clients versus engagements and real versus synthetic classifications.

---

## 2026-09-15 amendment — One existing product, one authorized data reality

### A1. Acceptance boundary

The owner must be able to use the EXISTING Eve interface in the Google AI Studio development preview, the actual Google shared/published application, and the Zeabur-hosted application and see the same authorized production records when each explicitly selects LIVE mode. Do not satisfy this requirement with a replacement dashboard, standalone diagnostic page, copied database, hardcoded Pfizer card, or direct report link alone.

The screens may have different frontend build versions during development, but compatible versions must resolve the same canonical backend and record revisions. Distinct local/test data is permitted only in an explicitly labeled, isolated TEST mode. Switching host must not silently switch business data.

A completed backend workflow with an empty, stale, incorrect, or inaccessible owner-facing view is an OPEN product defect. Do not announce an end-to-end pass until the browser journey passes on each required surface.

### A2. Typed identities and one customer read model

Keep `tenantId`, `clientId`, `workspaceId`, `engagementId`, `documentId`, `intakeSessionId`, `jobId`, `attemptId`, `reportId`, and `reportVersion` distinct. They are not interchangeable strings. Resolve relationships from persisted records; do not create a client ID by prefixing an engagement ID or assume a selected engagement ID is a workspace ID.

Use a common read model derived from the canonical workspace store, completed-job continuation, evidence ledgers, and artifact/version registry. A projection or cache is allowed only when its source revisions are recorded and stale entries are invalidated. It must not become another accounting-truth writer.

All Clients, Engagements, Documents, Financial Statements, Overview, Findings, and Deliverables views must agree on the selected scope. Preserve the owner's last authorized selection; otherwise prefer an eligible customer workspace. Do not automatically open the first Academy/canary record. A canary must never be relabeled as a customer when an API returns an empty array.

At the inspection checkpoint, the original Pfizer workspace and continuation are linked by the identifiers in the repair document. Those are verification inputs, NOT constants to place in production UI code.

### A3. API contract and visible failures

Maintain one typed API client or equivalent centralized request layer for data requests, polling, downloads, and any real-time connection. Identify and remove bypasses in components that call a different origin, wrong route, or incompatible schema.

Differentiate at least: loading; authenticated empty result; connection unavailable; unauthenticated; forbidden; endpoint/schema mismatch; stale cached result; and current result. Do not convert HTTP 401/403/404/500, malformed JSON, or a missing required response field into an apparently successful empty dataset.

Preserve diagnostics using sanitized correlation IDs and endpoint names. Never put secrets or unrestricted customer contents into user-visible errors. If data is retained during a temporary outage, label its observation time and stale status. Scope changes must clear previous-scope data and discard late responses; a failed request must not leave another company's summary on screen.

Polling or event subscriptions must use the same authorized backend, bounded cadence, reconnect/backoff policy, and tenant-scoped revision tracking. The implementation must state its refresh interval and demonstrate updates without reloading the entire application or restarting workers.

### A4. Screen-to-evidence contract

| Existing surface | Required authoritative representation |
| --- | --- |
| Home / Clients | Distinct authorized workspaces/clients and separately classified Academy/canary history. No fake certification or inflated customer counts. |
| Engagement selector / Overview | Canonical workspace-to-engagement relationship, actual reporting period and currency, current continuation state, selected report version, unresolved findings. |
| Documents / Intelligence | Original document ID/hash, custody, extraction status and attempt, source blocks, and measured coverage with its real denominator or NOT_MEASURED. |
| Financial statements / charts | Report-eligible values for the selected entity/period/unit/scale; actual source fact IDs and derivations; zero distinguished from unknown; duplicate rows not counted twice as independent facts. |
| Source evidence | A working click-through from a displayed fact to its actual document/source location and quote; HTML extraction locators must not masquerade as independently verified PDF page numbers. Missing source-block links remain explicit gaps. |
| Specialists / activity | Persisted executor, model or deterministic engine, attempts, handoffs, validation results, timestamps, and limitations. Health alone is not job execution. |
| Findings / PBC / review | Real structured findings and their evidence; objects rendered as readable descriptions, never `[object Object]`; unavailable private schedules remain unavailable. |
| Deliverables | Same latest applicable report/version and review status in workspace and global views; authenticated version-specific downloads that match the registered artifact hashes. Older versions remain inspectable as history. |
| Academy / learning | Actual disarm state, measured historical evaluations, defect/improvement proposals and their evidence, candidate versus active capability versions, promotion/rollback records, and unresolved gaps. No fabricated learning from activity. |
| Environment / connection | Non-secret frontend identity, backend identity, LIVE/TEST mode, selected scope, last successful synchronization time, schema compatibility, and connection errors. |

At the checkpoint the package contains 133 eligible rows and 117 distinct fact IDs. The UI must distinguish raw extracted rows, eligible rows, unique facts, evidence occurrences, and source coverage. These numbers are observations, not acceptance targets for future filings. Any deduplication must preserve evidence and original history; conflicting records sharing an ID must be reported, not silently merged.

### A5. Truthful readiness and professional authority

Keep four different judgments visible: execution success; technical validation; unresolved substantive review; and authorized professional delivery. No one judgment implies the others.

`READY_FOR_AUTHORIZED_HUMAN_REVIEW` is not `FINAL_CERTIFIED`, `PUBLISHED`, a clean audit opinion, or permission for external distribution. Downloading a draft as an authorized operator is not statutory issuance. An internal technical check must not set the authoritative external-delivery gate to eligible without the real required human approval object bound to the current report hash/version.

Do not supply default partner names, CPA titles/licenses, SOC 2/PCAOB assertions, Minerva 100 scores, fixed clearances, zero findings, financial years, or progress percentages. Readiness must reflect the appropriate evidence and review gates. Empty facts or missing balance operands cannot coexist with an unqualified READY/clean badge.

Historical canary evidence may be visible in its own scope; an old badge or score is not live-customer proof. The UI must not execute a simulated practice job merely because an operator opens a page.

### A6. Backend findings and learning must propagate honestly

A backend finding must be visible with its originating run, affected fact/report, severity, unresolved/resolved state, and source or execution receipt. Changes must invalidate dependent views and stale reports as defined by existing truth-governance rules.

A correction, failed model attempt, or proposed skill improvement is not automatically Academy learning or a promoted capability. Display candidate/proposed, evaluated, approved, active, and rolled-back states separately, with real recorded authority and measurement. If no legitimate learning record exists, show NOT_MEASURED or NOT_YET_EVALUATED. Keep Academy DISARMED during this remediation; observing its history does not authorize new cases or global learning from customer records.

### A7. Read boundaries have no business side effects

GET/list/detail/report-read endpoints must not seed synthetic organizations, generate facts, clear findings, approve reports, start Academy, create intake jobs, or change queue attempts. In particular, inspect the existing entity-list path that calls `seedRealisticGroupIfEmpty` before using browser navigation as a supposedly read-only acceptance test.

All record access must be authorized server-side against the authenticated principal and tenant. A browser-provided email, role, or tenant header is not authority. A shared report library is still a tenant-scoped view, not permission to enumerate other clients.

### A8. Required owner browser proof

Follow the acceptance matrix in the repair document. On each required frontend, record the actual browser origin, frontend build, resolved API destination, backend release/schema, authenticated scope, selected workspace/engagement, report version, timestamps, and sanitized request/result evidence.

Show the complete existing-product journey: login → choose Pfizer → Overview → Documents → financial rows → click-to-source → specialist results → review limitations → latest draft download → refresh/reopen. Do not re-upload the filing or retry completed extraction to produce this evidence.

Compare at a common backend revision or explain legitimate intervening changes. Test tenant switches, disconnected API, expired session, unavailable report version, unsupported fields, and canary/customer filters. A genuine empty result must remain distinguishable from a broken connection.

Classify each surface independently as PASS, FAIL, BLOCKED_ACCESS, or NOT_EXECUTED. API evidence alone cannot close a browser acceptance row. Backend-only status must remain RUNTIME_VERIFIED until the owner-facing UI is physically demonstrated.
