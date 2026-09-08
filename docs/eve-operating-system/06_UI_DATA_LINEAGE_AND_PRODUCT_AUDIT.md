# 06 — UI Data Lineage and Product-First Audit

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
- tables/XBRL/paragraphs/visuals
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
