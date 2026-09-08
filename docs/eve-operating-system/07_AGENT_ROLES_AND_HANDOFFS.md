# 07 — Agent Roles, Boundaries, and Handoffs

## Purpose

Eve already contains a broad agent organization. H.9.36-style work should strengthen role boundaries and handoff contracts rather than multiplying agents unnecessarily.

## Hermes Prime

Responsibilities:

- customer-priority scheduling
- stage orchestration
- resource-aware concurrency
- checkpoint/resume
- routing work to specialists
- ensuring custody handoffs reconcile
- surfacing unresolved blockers

Hermes should not become the sole storage or sole reasoning engine.

## Document Architect / Extraction function

This may be a dedicated worker/function rather than a new conversational agent.

Responsibilities:

- reconstruct source structure
- produce Document IR
- assign stable source-element IDs
- preserve coordinates/layout
- classify element types
- maintain source inventory and dispositions

## Ledger / Financial statement specialist

Responsibilities:

- classify accounting concepts
- map source data into statement/workpaper semantics
- maintain period/entity/currency context
- never overwrite raw source observations

## Veritas

Responsibilities:

- evidence integrity
- source coordinates
- hashes
- confidence
- provenance validation
- cross-document evidence checks

## Euclid

Responsibilities:

- deterministic arithmetic
- accounting identity checks
- reconciliation
- variance detection
- derivation verification

## Atlas / entity-consolidation specialist

Responsibilities:

- entity hierarchy
- parent/subsidiary/JV/associate relationships
- consolidation scope
- ownership percentages
- eliminations where supported
- entity-resolution evidence

## Mercury / currency specialist

Responsibilities:

- native/functional/presentation currencies
- units/scales
- FX rates and dates
- translation/revaluation
- hedging relationships where supported

## Lexicon

Responsibilities:

- multilingual terminology
- cross-framework/accounting taxonomy mapping
- source-language preservation
- confidence and ambiguity handling

## Argus

Responsibilities:

- contradiction/anomaly detection
- MD&A vs notes
- charts vs tables
- schedules vs statements
- cross-document inconsistencies
- forensic escalation

## Clara

Responsibilities:

- PBC and professional clarification coordination
- requests for missing/ambiguous evidence
- multi-turn follow-up
- response/document version handling

## Athena

Responsibilities:

- technical accounting analysis
- standards/policy memos
- response to review notes
- support for complex accounting judgments

## Quinn

Responsibilities:

- concurring review
- substantive case-specific review notes
- reopen/clearance decisions
- no template-only automatic sign-off

## Scribe / Report Factory

Responsibilities:

- construct deliverables from verified/canonical knowledge
- preserve lineage for numeric and material narrative claims
- respect review/clearance gates
- version and hash artifacts

## Sentinel

Responsibilities:

- fail-closed safety
- tamper/custody monitoring
- information-custody risks
- capability/privilege boundaries
- recovery governance

## Minerva

Responsibilities:

- independent examination
- source-side completeness/recall evaluation
- company reconstruction
- questionnaire testing
- information-custody sampling
- precision/recall and report-truth grading

Minerva must remain isolated from solver execution. Sealed answers are not an internal hint channel.

## Learning Dean

Responsibilities:

- post-engagement postmortems
- measured competency trends
- curriculum selection based on actual weakness
- distinguishing activity from learning

## Capability Architect

Responsibilities:

Classify recurring limitations as:

- `TRAINING_GAP`
- `CONFIGURATION_GAP`
- `TOOL_GAP`
- `CODE_GAP`
- `INFRASTRUCTURE_GAP`

Only justified tool/code/infrastructure gaps should create operator-facing development requests.

## Experience Faculty

Customer Simulator, Journey Auditor, and Presentation Auditor should exercise the real product and presentation contracts without contaminating real customer classifications.

## Handoff contract

Every specialist handoff should include references, not lossy summaries:

- project/engagement scope
- source/IR references
- data-point/assertion references
- expected input count
- acknowledged input count
- outputs persisted
- unresolved items
- next expected stage

A summary may accompany the references, but never replace them.
