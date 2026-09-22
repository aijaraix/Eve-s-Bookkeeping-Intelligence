# P2 Academy Five-Dimension Curriculum Catalog — Acceptance

Date: 2026-09-16 UTC

Branch: `feature/universal-evidence-ocr-foundation`

Accepted implementation checkpoint:

`98d3c236b247ea3fdb0b8d9782a1482b187a1b4a` — `Add five-dimension Academy curriculum catalog`

Status: **CURRICULUM CATALOG FOUNDATION ACCEPTED ON FEATURE BRANCH — PHYSICAL FIXTURE EXECUTION CONTINUES NEXT**

## What was added

The existing Minerva service now owns the curated five-dimension curriculum catalog. No parallel evaluator, benchmark service, Academy scheduler or execution authority was created.

Nineteen requested curriculum cases are now represented explicitly:

- receipt photo;
- scanned invoice;
- image-only PDF;
- low-quality scan;
- rotated/skewed image;
- glare/crop image;
- PaddleOCR vs docTR disagreement;
- missing page non-material to current task;
- missing transaction pages material to current task;
- missing page with unknown materiality;
- mixed source batch;
- spreadsheet + receipt mixed conclusion;
- insufficient PBC response;
- PBC response resolving only after re-evaluation;
- duplicate / near-duplicate evidence;
- bulk mixed-client upload isolation;
- long-document semantic/context extraction;
- real source-to-dashboard click-through;
- final report/export evidence lineage.

Each case preserves:

- stable case ID;
- curriculum family;
- source kinds;
- targeted five-dimension grades;
- expected safeguards;
- fixture readiness state;
- validation references where prior deterministic coverage exists;
- explicit autonomous eligibility.

## Truthful readiness states

The catalog distinguishes:

- `CONTRACT_READY`
- `PHYSICAL_FIXTURE_REQUIRED`

Five source-completeness / PBC cases are currently contract-ready because their core behavior is already backed by deterministic P1-009/P1-010 tests.

Fourteen OCR/mixed-source/isolation/semantic/browser/deliverable cases are explicitly marked `PHYSICAL_FIXTURE_REQUIRED` until the corresponding synthetic/curated fixture is physically executed.

A catalog specification is not represented as a pass.

## Scheduler protection

Every new curriculum case has:

`autonomousEligible: false`

Current coverage summary:

- total curated cases: 19
- contract-ready cases: 5
- physical-fixture-required cases: 14
- autonomous-eligible cases: 0

This prevents the new curriculum from silently entering Hermes autonomous selection before its fixture/execution path is proven.

The existing Hermes Academy scheduler remains the sole scheduler authority. Company 1 / Pfizer was not rerun.

## Observatory / UI

The existing Observatory read model now exposes:

- `fiveDimensionCurriculum`
- `fiveDimensionCurriculumCoverage`

The existing Curriculum tab displays:

- case title and ID;
- curriculum family;
- targeted dimensions;
- contract-ready vs physical-fixture-required state;
- explicit `Autonomous scheduler: NOT ELIGIBLE` status.

The UI states that a curated case is a specification until its physical fixture path is exercised and that the catalog does not convert a specification into a pass.

## Physical CI acceptance

Run:

`35053836636` — **PASS**

Passed gates:

- bounded curriculum catalog patch application;
- five-dimension curriculum catalog contract;
- five-dimension grading regression;
- five-dimension presentation regression;
- P1-009 sufficiency regression;
- P1-010 clarification coordinator regression;
- P1-010 clarification route/auth regression;
- universal source evidence regression;
- spreadsheet source-to-pixel lineage regression;
- OCR evidence regression;
- presentation adapter regression;
- Academy dashboard truth regression;
- full production build;
- final tested commit and removal of temporary one-shot machinery.

## Protected-state confirmation

This work did not:

- run Pfizer / Company 1;
- alter the accepted Pfizer FY2024 baseline;
- alter Hermes scheduler authority;
- create a second scheduler;
- make the 19 cases autonomous;
- merge PR #31;
- deploy feature-branch application code to production;
- claim physical OCR/browser/deliverable execution for cases still marked `PHYSICAL_FIXTURE_REQUIRED`;
- create another Minerva/evaluator service.

## Next physical curriculum work

The next no-Codex implementation step is to convert the first physical-fixture-required cases into independently executable Academy fixtures, beginning with receipt photo / scanned invoice / image-only PDF and then degraded-orientation/glare/OCR-disagreement variants. Each should remain non-autonomous until its source-to-result evidence and five-dimension grading are physically proven.
