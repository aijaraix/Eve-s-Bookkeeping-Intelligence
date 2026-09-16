# P2 Receipt Five-Dimension Academy Acceptance

Date: 2026-09-16 UTC

Status: **ACCEPTED FEATURE-BRANCH CANDIDATE / PRODUCTION ACTIVATION PENDING**

Repository: `aijaraix/Eve-s-Bookkeeping-Intelligence`

Branch: `feature/universal-evidence-ocr-foundation`

Accepted implementation checkpoint: `7b19c86d92cd582720e9857b24e3f4c7dbd9ebfb`

Acceptance run: `35058959781`

Evidence artifact: `eve-receipt-five-dimension-acceptance`

Artifact ID: `10432150589`

Artifact ZIP digest: `sha256:f62ca7a56ef164c6d9d93ac3e6f09c382cc60a873024bacf19c9ccf63156ab0e`

## Scope

This acceptance closes the previously untested **Product Truth** and **Deliverable Truth** dimensions for the curated receipt-image curriculum case `CURR-OCR-RECEIPT-PHOTO` and composes those proofs with the already accepted receipt OCR/source/accounting evidence.

Minerva's result is an internal technical evidence grade only. It is not a CPA opinion, audit opinion, statutory certification, assurance conclusion, or human professional sign-off.

The case remains excluded from autonomous Academy scheduling. Contract readiness does not authorize autonomous execution or production release.

## Exact source fixture

The acceptance uses the existing deterministic synthetic Academy receipt; it contains no customer data.

- filename: `receipt.png`
- bytes: `22803`
- SHA-256: `bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436`
- image size: `900 x 1000`
- receipt total: `TOTAL $53.23`
- accounting identity: `49.75 + 3.48 = 53.23`

The run regenerated the exact accepted receipt bytes using the pinned fixture recipe and Pillow 12.3.0.

### Source-region evidence used by Product/Deliverable acceptance

The exact glyph rectangle for `TOTAL $53.23` was derived from the deterministic source-image rendering recipe:

- pixel bbox: `(x=60, y=559, width=289, height=37)`
- normalized bbox:
  - `x=0.06666666666666667`
  - `y=0.559`
  - `width=0.3211111111111111`
  - `height=0.037`
  - unit `NORMALIZED`
- source-region id used by the isolated acceptance fixture: `fixture-total-glyph-region`
- transform id: `academy-fixture-glyph-bbox-v1`

This is explicitly a deterministic **source glyph region**, not a claim that the earlier live PaddleOCR detector bounding box was retained. The earlier physical OCR acceptance independently proves the exact receipt text, OCR engines, source SHA, region-bearing OCR contract, and accounting identity.

Marker:

`RECEIPT_FIXTURE_SOURCE_REGION=PASS`

## Source Coverage / Semantic Understanding / Accounting Accuracy

These dimensions retain the previously accepted physical receipt OCR evidence:

- live PaddleOCR 3.7.0 / PP-OCRv6-medium recovered all 12 intended receipt text regions at approximately `0.9974` average confidence;
- live docTR 1.1.0 recovered all 12 intended receipt text regions at approximately `0.9518` average confidence;
- both included the material subtotal, tax and total literals;
- `49.75 + 3.48 = 53.23` passed;
- source bytes and SHA were deterministically reproduced from the committed fixture generator.

Prior evidence:

- `docs/launch/evidence/2026-09-16_P2_OCR_CURRICULUM_RECEIPT_INVOICE_ACCEPTANCE.md`
- `docs/launch/evidence/2026-09-16_LOCAL_OCR_SOURCE_TO_PIXEL_ACCEPTANCE.md`
- `docs/launch/evidence/2026-09-16_P2_DEGRADED_OCR_FIXTURES_ACCEPTANCE.md`
- `docs/launch/evidence/2026-09-16_P2_OCR_ORIENTATION_RETRY_ACCEPTANCE.md`

The final five-dimension composition test used deterministic OCR responses matching the already physically proven receipt observations; it did not pretend to be a new live OCR run.

## Product Truth — PASS

Run `35058959781` built the actual feature-branch Eve application and launched it in real headless Chromium through Vite preview.

The browser acceptance used an isolated Academy engagement fixture at the application API boundary so no customer or protected Company 1 data was touched. The rendered application, presentation adapters, financial table, click handler, and provenance drawer were the real feature-branch product code.

The browser physically verified:

- the real financial statement UI rendered `$53.23`;
- the rendered cell retained source fact ID `fact-receipt-total-53-23`;
- Eve's presentation adapter intentionally rendered the fact on canonical statement line `selling_general_and_administrative`;
- clicking the real financial cell opened the real Source-to-Pixel Provenance drawer;
- the drawer displayed `receipt.png`, `TOTAL $53.23`, `900×1000`, source region `fixture-total-glyph-region`, provenance ID `prov-receipt-bdd93a72-total-53-23`, extraction method `local-ocr:paddleocr`, and version `3.7.0`;
- the technical provenance view included the exact receipt SHA, source fact lineage ID, and the actual render ID created by the product;
- the exact normalized source region was preserved into the drawer rather than being dropped by the financial-table click handoff.

Product defects repaired before acceptance:

1. `EveFinancialTable` previously reduced the lineage metadata passed to the provenance drawer, dropping image/source-coordinate details at click time. The full source metadata now survives the actual click path.
2. The cell tooltip previously said `source proof in SEC filing`; it is now source-neutral (`source evidence`) so receipt evidence is not mislabeled.

Marker:

`P2_RECEIPT_PRODUCT_TRUTH_BROWSER=PASS`

The evidence artifact contains `product-truth.json` and `product-truth-browser.png`.

## Deliverable Truth — PASS

The same run exercised Eve's real `DeliverableArtifactService` and review-package renderers against the isolated receipt fact. The generated artifacts were physically read back instead of trusting the in-memory report record.

The acceptance required reverse lineage in all four actual output formats:

- PDF
- JSON
- CSV lead schedules
- XLSX lead schedules

The artifact read-back verified preservation of:

- receipt SHA-256;
- source artifact / provenance identity;
- `prov-receipt-bdd93a72-total-53-23`;
- exact source region / bounding box;
- source excerpt `TOTAL $53.23`;
- extraction method/version;
- receipt-derived fact/value context.

The PDF was required to be a real `%PDF-` artifact and its physical SHA-256 had to match the report manifest SHA.

Deliverable defects repaired before acceptance:

1. Report normalization previously dropped exact source SHA/provenance/source-coordinate/extraction metadata. That lineage now survives the report boundary.
2. The generic renderer used public-filing-specific wording even for receipt/bookkeeping evidence. It now uses source-neutral `EVIDENCE REVIEW` / `supplied evidence` language.
3. The PDF previously failed to print the actual deliverable title even though the report record contained it. The title is now physically rendered.
4. Receipt evidence previously risked displaying a meaningless zero-valued assets/liabilities/equity identity. The package now records `balanceIdentityApplicable=false`, `euclidBalance=null`, and states that the balance-sheet identity is not applicable when a complete balance-sheet population was not supplied.
5. XLSX and CSV lead schedules now preserve source SHA, provenance IDs, source coordinate, extraction method/version, confidence and source excerpt.

Marker:

`P2_RECEIPT_DELIVERABLE_TRUTH=PASS`

The evidence artifact contains the generated report artifacts plus `deliverable-truth.json`.

## Five-dimension composition — PASS

The final acceptance test consumed both machine-readable evidence receipts generated earlier in the same CI job:

- `product-truth.json`
- `deliverable-truth.json`

Missing either receipt prevents Product Truth / Deliverable Truth PASS.

The five-dimension result required:

- Source Coverage: `PASS`
- Semantic Understanding: `PASS`
- Accounting Accuracy: `PASS`
- Product Truth: `PASS`
- Deliverable Truth: `PASS`
- passed dimensions: `5`
- not-tested dimensions: `0`
- `fullyTested=true`
- `allRequiredDimensionsPassed=true`
- overall: `FIVE_DIMENSION_PASS`

Every PASS carries one or more nonblank evidence references under the existing P2-001 fail-closed grading contract.

Marker:

`P2_RECEIPT_FIVE_DIMENSION_PASS=PASS`

The evidence artifact contains `five-dimension-result.json`.

## Curriculum state

`CURR-OCR-RECEIPT-PHOTO` now targets all five dimensions and is `CONTRACT_READY` on the feature branch.

Catalog counts after this acceptance:

- total curated cases: `19`
- contract-ready: `6`
- physical-fixture-required: `13`
- autonomous eligible: `0`

The receipt case remains `autonomousEligible: false` until autonomous scheduling is separately authorized and physically accepted.

## Regression / build acceptance

Corrected successful run: `35058959781`

Passed in the final successful run:

- exact receipt regeneration and source-region derivation;
- existing Academy OCR curriculum default behavior;
- receipt deliverable reverse-lineage read-back;
- image source-to-pixel presentation regression;
- five-dimension curriculum catalog;
- five-dimension grading;
- OCR parser evidence;
- OCR orientation retry;
- OCR fail-closed quality gate;
- PDF OCR fallback;
- P1-009 evidence sufficiency;
- P1-010 clarification coordinator;
- P1-010 clarification route/auth;
- universal evidence contract;
- spreadsheet lineage;
- presentation adapters;
- Academy dashboard truth auditor;
- production build before browser acceptance;
- real Chromium Product Truth acceptance;
- evidence-backed receipt five-dimension composition;
- evidence artifact upload;
- final production build after all acceptance gates.

The first three attempts were deliberately not accepted:

- run 1 exposed that the PDF did not physically render its deliverable title;
- run 2 advanced through the PDF/JSON/CSV checks and then exposed a test-side XLSX ESM read-back incompatibility;
- run 3 proved the real `$53.23` browser cell was present and exposed that the test expected the pre-adapter metric name instead of Eve's canonical rendered statement metric.

None of those failed attempts committed the candidate implementation.

## Release and runtime boundaries

- PR #31 remains draft.
- This feature-branch acceptance is not production activation or merge authorization.
- Active production application code remains on `main`.
- No production customer data was used for the browser/export fixture.
- Pfizer / Company 1 was not rerun or altered.
- Hermes remains the sole Academy scheduler authority; no second scheduler was created.
- The receipt case remains excluded from autonomous scheduling.
- No Codex was used.

## Next

The next P2 curriculum work can move to `EVE-P2-003` invoice/AP beyond OCR: semantic AP fields, accounting/approval/reconciliation behavior, Product Truth and Deliverable Truth. Selective page-level OCR/orientation for mixed native/scanned PDFs remains a separate P1/P2 integration item.
