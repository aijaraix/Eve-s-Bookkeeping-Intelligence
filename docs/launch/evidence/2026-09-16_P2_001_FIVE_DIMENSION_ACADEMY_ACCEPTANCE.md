# EVE-P2-001 — Five-Dimension Academy Evidence Grading Acceptance

Date: 2026-09-16 UTC

Feature branch: `feature/universal-evidence-ocr-foundation`

Accepted implementation checkpoint:

`b7ef550513306ce50d194e045dad64b614abf117` — `Harden five-dimension Academy evidence grading`

Status: **ACCEPTED CANDIDATE ON FEATURE BRANCH — NOT YET MERGED INTO MAIN APPLICATION CODE**

Draft PR: #31

## Purpose

P2-001 upgrades the existing Minerva / Hermes Academy evaluation path into a stricter five-dimension technical evidence-grading contract without replacing Minerva, creating a parallel evaluator, changing Academy scheduler authority, or removing the existing Full Practice compatibility score.

The five independent dimensions are:

1. `SOURCE_COVERAGE`
2. `SEMANTIC_UNDERSTANDING`
3. `ACCOUNTING_ACCURACY`
4. `PRODUCT_TRUTH`
5. `DELIVERABLE_TRUTH`

The contract is intentionally stricter than historical aggregate Academy scoring.

## Permanent grading semantics

Each dimension has exactly three externally meaningful states:

- `PASS`
- `FAIL`
- `NOT_TESTED`

`NOT_TESTED` is not a pass.

A case receives `FIVE_DIMENSION_PASS` only when all five required dimensions are independently tested and pass.

Any failed dimension produces `FIVE_DIMENSION_FAIL`.

If no dimension fails but one or more required dimensions are untested or only partially exercised, the case is `INCOMPLETE_DIMENSION_COVERAGE`.

A dimension containing any `NOT_TESTED` assertion remains `NOT_TESTED` rather than receiving a misleading partial pass.

## Evidence is required for PASS

A `PASS` assertion without at least one nonblank evidence reference is treated as an effective failure.

This prevents unsupported statements from becoming Academy passes merely because a caller labeled them successful.

Each dimension preserves:

- status;
- score or `null` when incomplete;
- evidence references;
- tested assertions;
- passed assertions;
- failed assertions;
- not-tested reason;
- defects;
- examiner notes;
- total / tested / passed / failed / not-tested assertion counts.

## Overall result contract

The five-dimension report preserves:

- `testedDimensionCount`
- `passedDimensionCount`
- `failedDimensionCount`
- `notTestedDimensionCount`
- `testedOnlyAverageScore`
- `fullyTested`
- `allRequiredDimensionsPassed`
- per-dimension reports
- tested / passed / failed / not-tested dimension lists.

The tested-only average excludes `NOT_TESTED` dimensions. Untested work therefore cannot inflate the average by being treated as an implicit 100%.

There is no new weighted five-dimension overall accuracy score.

## Backward compatibility

The pre-existing Full Practice score remains available for compatibility:

- numeric integrity: 40%
- evidence integrity: 20%
- PBC quality: 15%
- review efficacy: 10%
- report integrity: 15%

That legacy score is explicitly identified in the Full Practice result as a compatibility score. It does not override five-dimension status.

Historical cases are not automatically converted into five-dimension passes.

Legacy Full Practice cases that did not independently collect semantic or real-browser/product proof remain `NOT_TESTED` for those dimensions until a curriculum case actually exercises them.

## Full Practice integration

The existing `hermesPrimeAcademyEngine` now attaches `fiveDimensionGrading` to Full Practice Minerva results.

Existing evidence is reused where it genuinely supports a dimension:

- physical source and provenance checks feed Source Coverage;
- canonical fact and reconciliation checks feed Accounting Accuracy;
- physical PDF/XLSX artifact checks feed Deliverable Truth.

Legacy gaps remain explicit:

- sealed semantic/context assertions are `NOT_TESTED` unless a case carries the independent rubric;
- actual customer-visible browser source-to-pixel proof is `NOT_TESTED` in legacy backend-only Full Practice cases;
- P1-009 task-sufficiency and P1-010 clarification/re-evaluation scenarios are `NOT_TESTED` unless the case actually exercises them.

## Observatory / Academy read model

The Observatory read model exposes:

- `latestFiveDimensionEvaluation`
- bounded `fiveDimensionHistory`
- current five-dimension status
- whether all five dimensions were fully tested
- whether all required dimensions passed.

The Academy Curriculum UI visibly distinguishes `PASS`, `FAIL`, and `NOT_TESTED` and explains that an incomplete/unexercised dimension has no dimension score.

## Global certification language removed / qualified

The legacy global `zeroToleranceCertified` Observatory field no longer becomes `true` from a case result. It is returned as `null` with an explanatory compatibility note directing consumers to case-scoped five-dimension evidence grading.

The Minerva UI now describes the system as internal technical examination / evidence grading rather than an unqualified certification suite.

This evaluation is **not** represented as:

- a CPA opinion;
- an audit opinion;
- a statutory professional certification;
- human professional sign-off.

## Deterministic acceptance coverage

The P2-001 grading tests physically prove that:

1. `NOT_TESTED` does not count as `PASS`;
2. any failed required dimension prevents `allRequiredDimensionsPassed`;
3. the tested-only average excludes untested dimensions;
4. evidence references are required for `PASS`;
5. Product Truth can fail while Accounting Accuracy passes;
6. Deliverable Truth can fail independently of Accounting Accuracy and Product Truth;
7. Source Coverage can fail independently;
8. Source Coverage can remain `NOT_TESTED` independently;
9. a complete five-dimension case passes only when all five dimensions independently pass;
10. current/history readback remains available.

## Physical CI acceptance

Initial P2-001 integration run:

`35053016519` — PASS

This established the first five-dimension integration, UI presentation and Full Practice compatibility path.

Hardening / final acceptance run:

`35053528405` — **PASS**

The final run physically passed:

- bounded P2-001 hardening patch application;
- five-dimension Academy grading contract;
- five-dimension Academy presentation contract;
- P1-009 task-evidence-sufficiency regression;
- P1-010 clarification coordinator regression;
- P1-010 clarification route/auth regression;
- universal source-evidence regression;
- spreadsheet source-to-pixel lineage regression;
- OCR evidence regression;
- presentation adapter regression;
- Academy dashboard truth regression;
- full production build;
- final tested commit and removal of temporary one-shot machinery.

## Protected-state confirmation

This work did not:

- rerun Pfizer / Company 1;
- change the accepted Pfizer FY2024 baseline;
- alter Hermes Academy scheduler authority;
- create a second Academy scheduler;
- change the requirement that customer work preempts Academy work;
- replace Minerva or create a second evaluator service;
- merge PR #31;
- deploy feature-branch application code to production;
- expose local OCR publicly;
- claim that legacy Academy cases are five-dimension complete;
- claim that Minerva technical grading is a CPA or audit opinion.

## Release boundary

P2-001 is accepted as a feature-branch candidate inside draft PR #31.

Production application code remains controlled by `main` until a separate deliberate merge/release decision is authorized and post-deployment verification is completed.

## Result

**EVE-P2-001 FIVE-DIMENSION ACADEMY EVIDENCE GRADING: ACCEPTED CANDIDATE ON FEATURE BRANCH**

The next Academy workstream is curriculum expansion so the five dimensions are exercised by curated/synthetic cases rather than inferred from historical scores, beginning with receipts, invoices, scans, missing-page conditions, OCR disagreement, mixed-source conclusions, task-sufficiency / clarification scenarios, source-to-dashboard proof, and final deliverable lineage.
