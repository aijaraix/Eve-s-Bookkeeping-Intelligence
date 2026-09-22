# EVE P2 Mixed Spreadsheet + Receipt Five-Dimension Acceptance

Date: 2026-09-16

## Scope

This record accepts the bounded Academy curriculum closure for `CURR-MIXED-SPREADSHEET-RECEIPT` on feature branch `feature/universal-evidence-ocr-foundation`.

This acceptance proves that Eve can reconcile independent spreadsheet and receipt-image evidence without flattening provenance or silently preferring the structured spreadsheet when the underlying sources disagree.

This is feature-branch acceptance only. It is not merge, release, production activation, CPA sign-off, audit opinion, or autonomous-scheduler authorization.

## Accepted implementation

- Implementation checkpoint: `f1adad49e2b50d5cb2422c076a8f63d8afd1250d`
- Successful acceptance workflow: `35080898424`
- Evidence artifact: `eve-mixed-spreadsheet-receipt-five-dimension-acceptance`
- Artifact ID: `10440097824`
- Artifact digest: `sha256:35034edc991a4edf2eeaa0ee1bed3bcb9791c0800107ba3d5b60eacd721b42fe`

## Physical source fixtures

### Receipt

The acceptance run regenerated the exact previously accepted deterministic receipt:

- SHA-256: `bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436`
- image size: `900x1000`
- material literal: `TOTAL $53.23`
- source region: `fixture-total-glyph-region`
- source type: `IMAGE`

The source-glyph rectangle is the deterministic fixture source region, not a reconstructed claim about an earlier Paddle detector box.

### Agreement spreadsheet

- filename: `mixed-expense-agreement.xlsx`
- bytes: `9132`
- SHA-256: `ac68dc46adcb536782e03ca5f0338e48ad62f7ea0579f154a52e72abc50505d9`
- worksheet/cell: `Expense Register!C2`
- amount: `USD 53.23`

### Conflict spreadsheet

- filename: `mixed-expense-conflict.xlsx`
- bytes: `9134`
- SHA-256: `222022a88be29117634fa6a6eb418adc13ab2112e403ac469884de55d989ffd7`
- worksheet/cell: `Expense Register!C2`
- amount: `USD 54.23`

Both spreadsheet fixtures were generated twice during acceptance and required byte-identical hashes.

## Reconciliation behavior

The new `mixedSourceReconciliationEngine` retains the spreadsheet and receipt as independent parent evidence families, including independent source SHA-256 values, provenance IDs, artifacts, and source coordinates.

### Agreement case

The agreement case established:

- spreadsheet value: `USD 53.23`
- receipt value: `USD 53.23`
- difference: `USD 0.00`
- status: `AGREED`
- promotion state: `READY_FOR_AUTHORIZED_REVIEW`
- reviewable matched value: `USD 53.23`

The matched value is eligible for authorized review only; this acceptance does not create payment, posting, professional approval, or external-delivery authority.

### Conflict case

The adversarial conflict case established:

- spreadsheet value: `USD 54.23`
- receipt value: `USD 53.23`
- difference: `USD 1.00`
- status: `CONFLICT`
- promotion state: `BLOCKED_SOURCE_CONFLICT`
- action: `REQUEST_SOURCE_RECONCILIATION`
- canonical promoted value: `null / NOT PROMOTED`

The spreadsheet value did not mask or override the contradictory receipt evidence.

Marker:

`P2_MIXED_SPREADSHEET_RECEIPT_SOURCE_ACCOUNTING=PASS`

## Product Truth

The successful acceptance workflow built the actual feature-branch application and exercised the mixed-source review in real headless Chromium.

The actual Eve UI physically rendered:

- spreadsheet evidence value `USD 54.23`;
- exact spreadsheet source `Expense Register!C2`;
- spreadsheet source SHA and provenance ID;
- receipt evidence value `USD 53.23`;
- receipt image source region `fixture-total-glyph-region`;
- receipt source SHA and provenance ID;
- `CONFLICT` status;
- `USD 1.00` difference;
- `BLOCKED_SOURCE_CONFLICT`;
- `REQUEST_SOURCE_RECONCILIATION`;
- `Canonical promoted value: NOT PROMOTED`.

Marker:

`P2_MIXED_SPREADSHEET_RECEIPT_PRODUCT_TRUTH_BROWSER=PASS`

## Deliverable Truth

Eve's real deliverable service generated and physically read back the mixed-source review in:

- PDF
- JSON
- CSV
- XLSX

The artifacts were required to preserve:

- the blocked conflict state;
- both source values;
- the `USD 1.00` difference;
- both cryptographically distinct source SHAs;
- both provenance IDs;
- exact spreadsheet coordinate `Expense Register!C2`;
- receipt source region `fixture-total-glyph-region`;
- the fact that no canonical value was promoted.

Marker:

`P2_MIXED_SPREADSHEET_RECEIPT_DELIVERABLE_TRUTH=PASS`

## Five-dimension result

The final Minerva composition consumed the machine-readable source/accounting, Product Truth, and Deliverable Truth receipts from the same successful acceptance run.

For `CURR-MIXED-SPREADSHEET-RECEIPT`:

- Source Coverage: PASS
- Semantic Understanding: PASS
- Accounting Accuracy: PASS
- Product Truth: PASS
- Deliverable Truth: PASS
- NOT_TESTED dimensions: `0`
- `fullyTested=true`
- `allRequiredDimensionsPassed=true`
- overall: `FIVE_DIMENSION_PASS`

Marker:

`P2_MIXED_SPREADSHEET_RECEIPT_FIVE_DIMENSION_PASS=PASS`

## Regression coverage

The successful final run also passed the existing accepted regression chain, including:

- exact spreadsheet source-to-pixel lineage;
- trial-balance interpretation and deliverable truth;
- LEDGER trial-balance runtime integration;
- verified-customer continuation trial-balance reconstruction;
- receipt deliverable truth;
- bank-statement source sufficiency and deliverable truth;
- invoice/AP interpretation and deliverable truth;
- P1 task-evidence sufficiency and clarification/PBC;
- Academy five-dimension curriculum and grading;
- OCR parser evidence, orientation retry, fail-closed quality gate and PDF OCR fallback;
- universal source evidence;
- specialist retry / Package B2 execution;
- presentation adapters and Academy dashboard truth;
- full production build before Product Truth;
- final production build after all acceptance gates.

Two earlier workflow attempts were not accepted and made no implementation commit:

1. `35080597140` stopped because the trial-balance regression fixtures had not been regenerated in that job.
2. `35080697371` stopped because the receipt regression reused the mixed-source evidence directory and overwrote `deliverable-truth.json` with the receipt marker.

The successful run `35080898424` isolated the regression evidence directories and passed the unchanged acceptance criteria.

## Curriculum state

`CURR-MIXED-SPREADSHEET-RECEIPT` is now `CONTRACT_READY` and targets all five dimensions.

Catalog state after this acceptance:

- total cases: `20`
- contract-ready: `9`
- physical-fixture-required: `11`
- autonomous eligible: `0`

The case remains `autonomousEligible: false`.

## Boundaries

- PR #31 must remain draft until separate owner authorization for merge/release.
- Production application code on `main` was not changed by this acceptance.
- No production deployment was performed.
- Company 1 / Pfizer was not rerun or altered.
- Hermes remains the sole Academy scheduler authority.
- No additional scheduler or competing reconciliation authority was created.
- Minerva acceptance is internal technical grading only, not professional certification or sign-off.
- No Codex was used for this closure.
