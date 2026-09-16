# 03 — Academy Quality and Acceptance

## Objective

Evolve the already accepted real-browser Academy into a broad production-quality system that measures not only whether Eve gets headline accounting values right, but whether Eve fully accounts for source material, understands relevant semantics, handles uncertainty correctly, renders truthful product state, and produces evidence-backed deliverables.

Do not restart Academy architecture. Preserve the accepted browser operator, Hermes scheduler authority, customer-work preemption, saved evidence and learning records.

## Current accepted capability

Academy has already demonstrated the real product pathway on desktop and phone, including upload, extraction, specialist execution, statement rendering, evidence review, draft generation/download, learning persistence and restart survival.

This proves the loop. It does not yet prove broad extraction accuracy across messy bookkeeping evidence.

## Academy grading model

Every case should eventually produce separate grades for:

1. `SOURCE_COVERAGE`
2. `SEMANTIC_UNDERSTANDING`
3. `ACCOUNTING_ACCURACY`
4. `PRODUCT_TRUTH`
5. `DELIVERABLE_TRUTH`

A single blended score may be shown secondarily, but launch decisions must use the individual dimensions and hard invariants.

## Source coverage grade

Measure whether Eve accounted for the source universe:

- artifact count
- physical/logical pages
- sheets
- sections/headings/paragraphs where benchmarked
- tables/rows/cells
- images/charts/captions
- footnotes
- signatures/certifications
- source metadata
- structural/repetitive items
- explicit review-required/unsupported items

Correct headline values cannot compensate for unexplained source loss.

## Semantic understanding grade

Measure context relevant to accounting and deliverables:

- people/entities/roles
- authors/signers/speakers
- dates/periods
- document type/purpose
- contractual obligations
- narrative assertions
- currencies/units
- relationships
- qualifiers such as restated/unaudited/confidential
- customer/reviewer clarifications

Wrong attribution should fail even if the numeric value is correct.

## Accounting accuracy grade

Measure:

- statement line extraction
- invoice/receipt fields
- transaction extraction
- account/category mapping where benchmarked
- period/entity/currency scope
- debits/credits/signs
- reconciliations
- formulas/derivations
- duplicate treatment
- contradiction handling
- unresolved material accounting items

## Product truth grade

Verify the persisted truth reaches the actual UI correctly:

- dashboard values
- statement tables
- processing status
- evidence drawers
- findings
- clarification state
- reports/downloads
- customer/owner visibility boundaries
- desktop/mobile behavior

A correct backend fact rendered incorrectly is a failure.

## Deliverable truth grade

For generated reports/workpapers/documents:

- every material numeric statement uses verified accounting lineage
- every material narrative/identity/date assertion uses semantic/source lineage
- formulas reference operands
- unsupported conclusions are not invented
- review-required items remain visible
- professional approval boundaries remain explicit

## Hard invariants

The following should be gate conditions rather than averages:

- received artifact manifest coverage = 100%
- unexplained source-element remainder = 0
- unexplained custody handoff loss = 0
- material output without parent lineage = 0
- cross-tenant evidence exposure = 0
- customer work starved by Academy = 0
- silent material uncertainty = 0

## Curriculum expansion

Build cases incrementally across these families:

### A. Structured corporate / filing
- public filing / iXBRL
- long native-text PDF
- footnote-heavy statements
- multiple entities/segments/currencies

### B. Receipts and images
- clean receipt photos
- rotated/skewed photos
- shadows/glare
- low-resolution receipts
- handwritten tip/total
- duplicate and near-duplicate receipt photos
- multi-receipt images

### C. Invoices / AP / AR
- clean invoice PDF
- scanned invoice
- multi-page invoice
- credit memo
- invoice + purchase order + payment evidence
- inconsistent totals/tax

### D. Bank / card evidence
- monthly statements
- image-only statements
- missing non-material pages
- missing transaction pages
- page number vs PDF physical-page mismatches
- running-balance continuity gaps
- multiple accounts and institutions

### E. Spreadsheet/accounting exports
- GL
- trial balance
- AP aging
- AR aging
- bank export
- formulas
- hidden/merged/blank sheets
- multi-period/multi-entity workbooks

### F. Mixed client dumps
- hundreds/thousands of artifacts
- nested folders/archives
- mixed formats
- duplicates
- conflicting versions
- mixed periods/entities
- unsupported/corrupted files

### G. Contracts/correspondence/context
- lease + amendments
- loan agreement
- employment agreement
- email + attachment
- signer/author attribution
- material narrative assertion retrieval

### H. Clarification behavior
- ambiguous merchant
- unreadable total
- uncertain date
- missing attachment
- missing page that is non-material for current task
- missing page that is material
- customer answer changes accounting treatment

## Ground truth strategy

Academy should use isolated synthetic/curated cases with explicit expected manifests, values and semantic assertions. Do not use private customer data as training material without separate explicit authorization and governance.

Ground truth should include both what IS present and what IS intentionally absent/ambiguous so Academy can grade uncertainty handling rather than rewarding guessing.

## Accuracy reporting

Report by document family and dimension. Avoid claims like "99% accurate" without a defined benchmark population, sample size, field definition and time window.

Useful metrics include:

- source inventory recall
- OCR field accuracy
- receipt/invoice field precision/recall
- statement transaction extraction precision/recall
- accounting-fact precision/recall
- reconciliation exactness
- semantic attribution precision/recall
- clarification precision: asked when needed, avoided when unnecessary
- evidence lineage coverage
- UI/render fidelity
- deliverable assertion lineage coverage

## Learning loop

For each failed case:

1. preserve the original result and evidence
2. classify failure root cause
3. determine whether parser, OCR/vision, semantic model, accounting logic, orchestration, UI, or deliverable caused it
4. implement the smallest safe correction
5. rerun only the affected case/stage where possible
6. preserve before/after versions
7. promote the case into regression curriculum

Do not let Academy "learn" by mutating production truth without reviewable evidence.

## Runtime policy

- Hermes remains single Academy scheduler authority.
- Customer work preempts Academy.
- Academy may pause/defer under production backlog pressure.
- Academy artifacts and synthetic tenants remain isolated from customer accounting truth.
- Background case expansion must not silently increase material infrastructure cost.

## Launch relevance

First-customer launch requires the already accepted end-to-end Academy loop plus targeted benchmarks for the specific document families that the first customers are told Eve supports.

General availability requires materially broader curriculum coverage and a published internal support matrix identifying VERIFIED, LIMITED and NOT-YET-SUPPORTED document classes.
