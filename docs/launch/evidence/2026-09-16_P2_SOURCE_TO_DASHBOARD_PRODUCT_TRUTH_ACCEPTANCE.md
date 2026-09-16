# P2 Source-to-Dashboard Product Truth — acceptance record

Date: 2026-09-16
Repository: `aijaraix/Eve-s-Bookkeeping-Intelligence`
Branch: `feature/universal-evidence-ocr-foundation`
Draft PR: #31

Status: **ACCEPTED FEATURE-BRANCH CURRICULUM CLOSURE / TARGETED DIMENSIONS ONLY / NOT PRODUCTION ACTIVATED / NOT AUTONOMOUS**

## Accepted checkpoint

Implementation checkpoint:

`559fab47b6fa1d22fc8245867f0f9f23ca146180` — `Close source-to-dashboard Product Truth curriculum`

Successful acceptance run:

`35155550196` — SUCCESS through physical source generation, presentation-integrity controls, regression suite, production build, real Chromium Product Truth, targeted Minerva composition, evidence upload, second production build and self-cleaning implementation commit.

Evidence artifact:

- name: `eve-source-to-dashboard-product-truth-acceptance`
- artifact ID: `10470783265`
- size: `237811` bytes
- ZIP digest: `sha256:31cf66204e46e3769736c5a6ca0c717071647960789c8cb91b1da83ec7b53f23`

Primary markers:

- `P2_SOURCE_DASHBOARD_FIXTURES=PASS`
- `P2_SOURCE_DASHBOARD_PRESENTATION_INTEGRITY=PASS`
- `P2_SOURCE_TO_DASHBOARD_PRODUCT_TRUTH_BROWSER=PASS`
- `P2_SOURCE_TO_DASHBOARD_TARGETED_DIMENSIONS=PASS`

## Scope

This acceptance closes curriculum case:

`CURR-PRODUCT-SOURCE-TO-DASHBOARD`

The case proves real source-to-dashboard Product Truth for two materially different source families that intentionally display the same dollar amount. It also proves that a correct-looking amount cannot remain verified when its source identity has been cross-bound.

This is a Product Truth case, not the final export-lineage case. The dedicated `CURR-DELIVERABLE-FINAL-LINEAGE` case remains separate.

## Physical sources

### Spreadsheet source

Physical workbook:

`revenue-register.xlsx`

- bytes: `8955`
- SHA-256: `f9cdbdc90b205fcc7639a53f1445b59ee85405ead68bd9989f8656df39a2dd33`
- sheet: `Revenue Register`
- exact source cell: `B2`
- source range: `A1:C2`
- row: `2`
- column: `2`
- parsed/cached value: `53.23`
- number format: `$#,##0.00`
- cell type: `n`
- raw literal: `$53.23`
- extraction method: `sheetjs-native-cell`
- extraction version: `0.18.5`
- provenance ID: `prov-f9cdbdc90b205fcc-revenue-register-b2`
- coordinate ID: `coord-f9cdbdc90b205fcc-revenue-register-b2`
- source artifact ID: `artifact-spreadsheet-f9cdbdc90b205fcc7639a53f`

The workbook was generated twice during acceptance and required byte-identical output before use. It was then parsed through Eve's real `SpreadsheetParser`; the parser-derived coordinate and source SHA were used by the presentation path.

### Receipt image source

Exact previously accepted receipt:

`receipt.png`

- bytes: `22803`
- SHA-256: `bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436`
- dimensions: `900x1000`
- material literal: `TOTAL $53.23`
- source region ID: `fixture-total-glyph-region`
- pixel bbox: `(60, 559, 289, 37)`
- normalized bbox: `x=0.06666666666666667, y=0.559, width=0.3211111111111111, height=0.037`
- provenance ID: `prov-receipt-bdd93a72-total-53-23`
- transform: `academy-fixture-glyph-bbox-v1`

## Same-value adversarial design

Both independent physical sources intentionally contain and render the same amount:

`$53.23`

This prevents the acceptance from passing by matching a displayed value to whichever evidence happens to contain the same number.

The valid source chains remain distinct:

1. spreadsheet revenue fact -> spreadsheet SHA -> `Revenue Register!B2` -> spreadsheet provenance ID;
2. receipt expense fact -> receipt SHA -> exact image/OCR region -> receipt provenance ID.

A third adversarial fact also displays `$53.23`, but its top-level source SHA was deliberately replaced with the receipt SHA while retaining the spreadsheet coordinate.

The presentation source-identity validator detected:

`SOURCE_SHA_DOES_NOT_MATCH_COORDINATE_SHA`

That fact remained visible for review, but Eve downgraded its presentation from the claimed `VERIFIED` state to `review_required` and registered its render as `REVIEW_REQUIRED` rather than verified Product Truth.

## Presentation-boundary source identity control

New implementation:

`src/lib/evidence/presentationSourceIdentity.ts`

The control validates, before verified presentation status is allowed:

- source coordinate exists;
- source provenance ID exists;
- coordinate ID exists;
- coordinate SHA is a valid SHA-256;
- source artifact identity exists;
- top-level source SHA agrees with coordinate SHA;
- top-level artifact identity agrees with coordinate artifact identity;
- source-type-specific locator requirements exist for spreadsheet, image, PDF and CSV evidence.

`src/adapters/presentationAdapters.ts` now applies this control when creating statement presentation lines. An invalid source binding does not disappear from the UI; it is explicitly downgraded to review-required and cannot receive a verified render state.

## Reverse-render lineage stability repair

The first browser harness correction exposed a genuine Product Truth defect in `RenderRegistry`.

Before the repair, React recomputation of the same statement presentation called `registerRender()` again and generated a new random render ID. This meant a render ID captured from the financial cell could become stale merely by opening/closing a provenance drawer, even though the underlying source, fact, value and presentation had not changed.

Accepted repair:

`src/utils/renderRegistry.ts`

`registerRender()` now uses an idempotent presentation identity based on:

- route;
- screen;
- component;
- widget;
- fact lineage ID;
- canonical fact ID;
- derivation ID where applicable;
- entity;
- period;
- currency;
- display scale;
- display value;
- normalized base value;
- verification state.

The same unchanged presentation reuses the same render ID across React rerenders. A materially changed value, source fact/derivation, verification state, route/widget, period or currency produces a new render identity.

The non-browser presentation-integrity test explicitly invokes the adapter a second time and requires the spreadsheet, receipt and review-required adversarial presentations to retain their original render IDs.

## Real Chromium Product Truth

The successful run built the actual feature application, launched the production build under Vite preview and exercised it with real headless Chromium (`Chrome/152.0.7977.82`).

The actual financial statement UI contained three independent cells, each displaying:

`$53.23`

### Spreadsheet-derived cell

- fact ID: `fact-dashboard-spreadsheet-revenue`
- browser render ID: `RND-mu4ncfm7-dkvn`
- UI provenance status: `verified`
- source SHA: `f9cdbdc90b205fcc7639a53f1445b59ee85405ead68bd9989f8656df39a2dd33`
- source locator: `Revenue Register!B2`
- provenance ID: `prov-f9cdbdc90b205fcc-revenue-register-b2`

A real click on this cell opened Eve's actual `Source-to-Pixel Provenance` drawer. The drawer physically displayed the workbook name, `Revenue Register!B2`, source excerpt and provenance ID. Its technical trace contained the exact spreadsheet SHA, fact lineage ID and the same browser render ID.

### Receipt-derived cell

- fact ID: `fact-dashboard-receipt-expense`
- browser render ID: `RND-mu4ncfm7-lmmf`
- UI provenance status: `verified`
- source SHA: `bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436`
- source locator: `fixture-total-glyph-region`
- provenance ID: `prov-receipt-bdd93a72-total-53-23`

A real click opened the same production provenance drawer and physically displayed `receipt.png`, `TOTAL $53.23`, `900x1000`, the exact region ID and provenance ID. Its technical trace contained the receipt SHA, fact lineage ID and the same stable render ID captured from the cell.

### Adversarial source-mismatched cell

- fact ID: `fact-dashboard-tampered-net-income`
- browser render ID: `RND-mu4ncfm7-xq9e`
- visible value: `$53.23`
- UI provenance status: `review_required`

The correct-looking value therefore did not become verified Product Truth after its source identity was corrupted.

A real browser screenshot was retained in the evidence artifact as:

`source-to-dashboard-product-truth.png`

## Targeted Minerva result

`CURR-PRODUCT-SOURCE-TO-DASHBOARD` targets Source Coverage, Accounting Accuracy and Product Truth.

Final machine-readable result:

- Source Coverage: **PASS — 100**
- Accounting Accuracy: **PASS — 100**
- Product Truth: **PASS — 100**
- Semantic Understanding: **NOT_TESTED** — outside this source-to-render fidelity case
- Deliverable Truth: **NOT_TESTED** — reserved for `CURR-DELIVERABLE-FINAL-LINEAGE`
- tested dimensions: `3`
- passed dimensions: `3`
- failed dimensions: `0`
- NOT_TESTED dimensions: `2`
- tested-only average: `100`
- overall global five-dimension status: `INCOMPLETE_DIMENSION_COVERAGE`

That global status is intentional. `CONTRACT_READY` for this case means all dimensions targeted by this curriculum contract are physically accepted; non-target dimensions were not converted into artificial passes.

## Acceptance attempts and defects found

### Initial staging attempt

Run `35155067944` did not reach product tests. The one-shot patch used a stale curriculum-text anchor after the preceding long-document case changed the surrounding block. The staging wrapper was repaired; no Product Truth rule was changed.

### Browser attempt — drawer tab state

Run `35155186089` reached the actual built UI. The product drawer correctly preserved its last selected tab. The test opened the spreadsheet technical trace, closed the drawer, reopened the receipt and incorrectly expected summary-tab content without switching back to `Auditor Summary View`.

The browser harness was corrected to select the summary tab before asserting receipt citation content. No product behavior was weakened.

### Browser attempt — unstable render ID

Run `35155299711` then exposed the genuine reverse-render lineage defect described above: React rerenders generated a new random render ID for an unchanged presentation.

The product was repaired by making equivalent render registrations idempotent. The final successful run then required the same render identity across rerenders and across the actual browser cell -> provenance drawer technical trace.

## Regression and build acceptance

The successful run passed:

- deterministic physical spreadsheet and receipt fixture generation;
- spreadsheet parser source-to-pixel lineage;
- presentation source-identity validation;
- adversarial cross-source SHA mismatch downgrade;
- render identity stability across repeated presentation adaptation;
- universal source-evidence contract;
- five-dimension curriculum regression;
- five-dimension grading regression;
- P1-009 task-evidence sufficiency regression;
- full production build before Chromium;
- real Chromium spreadsheet and receipt click-through Product Truth;
- real Chromium review-required display for the tampered fact;
- targeted Minerva composition;
- evidence artifact upload;
- final production build;
- self-cleaning implementation commit.

## Curriculum state after acceptance

- total cases: `20`
- CONTRACT_READY: `19`
- PHYSICAL_FIXTURE_REQUIRED: `1`
- autonomous eligible: `0`

The only remaining physical curriculum case is:

`CURR-DELIVERABLE-FINAL-LINEAGE`

## Boundaries

This acceptance does **not** authorize or perform a production release.

- PR #31 remains a draft until separate owner authorization.
- production application code remains on `main`.
- no live production OCR/service rebuild occurred in this pass.
- Pfizer / Company 1 was not rerun.
- Hermes scheduling was not changed.
- no Codex credits were used.
- Minerva status is internal technical grading only, not CPA/audit/statutory professional certification or sign-off.
