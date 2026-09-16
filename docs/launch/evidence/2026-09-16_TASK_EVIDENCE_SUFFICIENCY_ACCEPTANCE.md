# EVE-P1-009 — Source Completeness vs Task Evidence Sufficiency Acceptance

Date: 2026-09-16 UTC

Feature branch: `feature/universal-evidence-ocr-foundation`

Accepted branch checkpoint before this evidence record:

`2ab0d9d14838af4b92b101e5fa92205275708701` — `Expose task evidence sufficiency decisions through CPA API`

Status: **ACCEPTED CANDIDATE ON FEATURE BRANCH — NOT YET MERGED INTO MAIN APPLICATION CODE**

## Purpose

Eve must not confuse two different questions:

1. **Source completeness:** what expected physical/logical source material is present, missing, unreadable, unsupported, unresolved, or unclassified?
2. **Task evidence sufficiency:** is the available evidence sufficient for the specific accounting/document conclusion being requested right now?

A known source gap must never disappear merely because Eve can continue with some work. Conversely, a demonstrably irrelevant missing page must not automatically block an unrelated accounting conclusion.

## Accepted state model

### Source completeness states

- `SOURCE_COMPLETE`
- `SOURCE_GAP_NON_MATERIAL_FOR_CURRENT_PURPOSE`
- `SOURCE_GAP_MATERIAL_FOR_CURRENT_PURPOSE`
- `SOURCE_GAP_UNKNOWN_MATERIALITY`

### Task sufficiency states

- `SUFFICIENT_FOR_CURRENT_PURPOSE`
- `INSUFFICIENT_FOR_CURRENT_PURPOSE`
- `REVIEW_REQUIRED_TO_DETERMINE_MATERIALITY`

### Per-conclusion states

- `ALLOWED`
- `BLOCKED_INSUFFICIENT`
- `REVIEW_REQUIRED`

### Recommended actions

- `PROCEED`
- `PROCEED_WITH_DISCLOSED_GAP`
- `REVIEW_MATERIALITY`
- `REQUEST_ADDITIONAL_EVIDENCE`

## Core implementation

New engine:

`server/cpaOrganization/taskEvidenceSufficiencyEngine.ts`

The engine accepts a defined task with one or more conclusions. Each conclusion declares the evidence capabilities it requires and may declare that a complete population is required.

Known source gaps preserve:

- gap identity and type;
- source artifact identity;
- location/description;
- affected evidence capabilities;
- explicit materiality where established;
- structural relevance signal;
- continuity signal;
- reconciliation signal;
- evidence references;
- confidence/context.

The decision preserves:

- source-completeness state;
- task-sufficiency state;
- per-gap materiality assessment;
- per-conclusion allow/block/review decision;
- allowed conclusion IDs;
- blocked conclusion IDs;
- review-required conclusion IDs;
- recommended action;
- whether clarification is recommended;
- evidence references;
- durable decision hash.

Decisions may be persisted under:

`storage/cpa_memory/task_sufficiency/`

Runtime storage remains outside source control.

## Fail-safe rules physically covered

### 1. Complete source and required evidence present

Result:

- `SOURCE_COMPLETE`
- `SUFFICIENT_FOR_CURRENT_PURPOSE`
- action `PROCEED`

### 2. Missing pages demonstrably irrelevant to the current task

Synthetic bank-balance case:

- pages 4–5 absent;
- adjacent headings identify terms/disclosures only;
- transaction continuity intact;
- relevant reconciliation passes;
- the current purpose is ending-cash verification.

Result:

- the gap remains recorded;
- `SOURCE_GAP_NON_MATERIAL_FOR_CURRENT_PURPOSE`;
- `SUFFICIENT_FOR_CURRENT_PURPOSE`;
- action `PROCEED_WITH_DISCLOSED_GAP`.

The known gap is not hidden.

### 3. Missing transaction pages with broken continuity

Synthetic transaction-reconstruction case:

- transaction sequence jumps across missing pages;
- continuity is `BROKEN`;
- reconciliation is `FAIL`;
- complete transaction population is required.

Result:

- `SOURCE_GAP_MATERIAL_FOR_CURRENT_PURPOSE`;
- `INSUFFICIENT_FOR_CURRENT_PURPOSE`;
- affected conclusion blocked;
- action `REQUEST_ADDITIONAL_EVIDENCE`.

### 4. Unknown missing page / unknown impact scope

Permanent fail-safe rule:

> A known source gap whose affected capability scope is unknown is evaluated against every current conclusion until Eve can establish what the gap affects.

It is never silently treated as unrelated.

Synthetic result:

- `SOURCE_GAP_UNKNOWN_MATERIALITY`;
- `REVIEW_REQUIRED_TO_DETERMINE_MATERIALITY`;
- action `REVIEW_MATERIALITY`.

### 5. Required evidence capability is absent

If the task explicitly requires a capability that is not available, Eve creates a material `REQUIRED_EVIDENCE_CAPABILITY_MISSING` gap even when upstream did not create a separate gap object.

Result is fail-closed for the affected conclusion.

### 6. Mixed task — block only affected conclusion

Synthetic mixed review established that a missing transaction/disclosure population blocks only the conclusion that consumes that evidence. An unrelated supported cash conclusion remains `ALLOWED`.

This prevents one source defect from unnecessarily freezing unrelated work.

### 7. Existing document-completeness records feed task sufficiency

The engine can consume Eve's existing `DocumentCompletenessRecord` and unresolved elements from `deepDocumentIntelligenceEngine`.

A partial/less-than-100%-coverage record with unknown task impact does not automatically become sufficient; it enters materiality review.

## Operational CPA API integration

The existing CPA organization API now includes:

### POST `/api/cpa/evidence-sufficiency/evaluate`

Internal-operator authority required.

The route:

- accepts a defined task, optional explicit gaps and requested document IDs;
- loads saved `DocumentCompletenessRecord` objects from `deepDocumentIntelligence`;
- loads saved unresolved elements for those documents;
- evaluates the combined evidence through the P1-009 engine;
- persists the decision by default unless explicitly disabled.

Fail-safe route rule:

> If a requested document has no saved completeness record, the route creates an unknown-impact source gap instead of treating the document as complete or silently excluding it.

### GET `/api/cpa/evidence-sufficiency/decisions`

Internal-operator authority required. Supports workspace/engagement/task filters.

### GET `/api/cpa/evidence-sufficiency/decisions/:decisionId`

Internal-operator authority required. Returns one durable decision.

These routes are intentionally internal at this stage. P1-010 will connect clarification/PBC records to these decisions before customer-facing clarification workflows are exposed.

## Authentication acceptance

Route tests verified that unauthenticated callers cannot create sufficiency decisions.

The evaluation and decision-read routes require an authenticated internal operator through the existing Eve server-auth boundary.

No authentication mechanism was weakened or duplicated.

## CI / regression evidence

### Core engine run

GitHub Actions run:

`35050184183`

Passed:

- task-evidence-sufficiency contract tests;
- universal evidence contract regression;
- spreadsheet source-to-pixel regression;
- local OCR routing regression;
- OCR parser evidence regression;
- image source-to-pixel presentation regression;
- presentation adapter regression;
- full production build.

Physical marker:

`TASK_EVIDENCE_SUFFICIENCY_TESTS=PASS`

### Operational API run

GitHub Actions run:

`35050681084`

Passed:

- task-evidence-sufficiency contract;
- task-evidence-sufficiency route/auth tests;
- universal evidence regression;
- spreadsheet lineage regression;
- OCR parser evidence regression;
- full production build;
- tested route integration commit and one-shot cleanup.

Physical marker:

`TASK_EVIDENCE_SUFFICIENCY_ROUTES_TESTS=PASS`

## Relationship to existing Eve systems

P1-009 does **not** create a second completeness system or a second clarification queue.

It is the decision layer between:

- `informationCustodyEngine` / `deepDocumentIntelligenceEngine` — source inventory/completeness/unresolved evidence;
- `professionalClarificationEngine` — durable clarification/PBC workflow.

P1-010 should attach clarification requests to the exact P1-009 decision, gap IDs and blocked/review-required conclusion IDs.

## Protected-state confirmation

This work did not:

- rerun Pfizer / Company 1;
- alter Pfizer facts;
- replace Hermes;
- create another Academy scheduler;
- change live production customer application code on `main`;
- weaken the existing authentication boundary;
- hide source gaps;
- permit unsupported professional signoff.

## Result

**EVE-P1-009 SOURCE COMPLETENESS VS TASK EVIDENCE SUFFICIENCY: ACCEPTED CANDIDATE ON FEATURE BRANCH**

Next foundation task:

**EVE-P1-010 — clarification / PBC contract integration**, using the existing `professionalClarificationEngine` and linking every clarification to its originating P1-009 sufficiency decision and source evidence.
