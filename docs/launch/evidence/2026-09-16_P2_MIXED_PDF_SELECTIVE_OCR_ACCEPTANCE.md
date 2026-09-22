# P2 Mixed Native/Scanned PDF Selective OCR Acceptance — 2026-09-16

## Status

ACCEPTED on `feature/universal-evidence-ocr-foundation` only.

This is feature-branch implementation and physical acceptance evidence. It is **not** production activation, merge authorization, CPA/audit certification, or authorization to change the Hermes scheduler.

## Accepted checkpoints

- Acceptance run: `35124839571`
- Tested implementation checkpoint: `e518b7523ec43c029df428768e470845a6061d8a`
- Evidence artifact: `eve-mixed-pdf-selective-ocr-acceptance`
- Artifact ID: `10458656784`
- Artifact ZIP digest: `sha256:3dc6a9ec3dfd35f835643430483abbdfed0d5efb4db03c5dce15acd2574cbc69`

## Physical fixture

A deterministic three-page PDF was generated with two different evidence modes in one original source artifact:

- file: `mixed-native-scanned.pdf`
- bytes: `30609`
- original PDF SHA-256: `36cb52e26406bd4db4ff79e2f41e1bb679a358c7478e49a4c84f920d87a9649e`
- page 1: native PDF text
- page 2: image-only scanned page
- page 3: native PDF text
- page-2 image SHA-256: `bdb64ffd46e6f9f56d9578c7e5ff0cb2faf20de75f66d18d561495515a9dae49`
- page-2 physical image orientation: 90 degrees

The native parser physically inventoried the source as:

- page 1 `native_text_available=true`
- page 2 `native_text_available=false`
- page 3 `native_text_available=true`

Marker: `MIXED_PDF_SELECTIVE_FIXTURE=PASS`

## Selective OCR routing

The accepted implementation adds page-aware PDF OCR selection to the existing local OCR contract. It does not replace native parsing.

For the mixed fixture:

- native pages retained: `1, 3`
- OCR pages requested: `2`
- every OCR request carried exactly `pdfPageNumbers:[2]`
- pages 1 and 3 were never sent to the OCR service
- the merged document retained all three physical page numbers in original order

Final page modes:

1. page 1 — `NATIVE_TEXT`, OCR not used
2. page 2 — `OCR`, OCR used
3. page 3 — `NATIVE_TEXT`, OCR not used

Marker: `P2_MIXED_PDF_SELECTIVE_OCR_SOURCE_TRUTH=PASS`

## Original-source provenance

The merge contract binds native and OCR observations to the **same original PDF identity**:

- original PDF SHA-256 is retained on every native and OCR source coordinate;
- the shared source artifact ID is derived from the original PDF SHA;
- native page coordinates use `sourceType=PDF`, the original physical `pageNumber`, `nativeTextAvailable=true`, and `evidenceMode=NATIVE_TEXT`;
- OCR page coordinates use `sourceType=PDF`, the original physical `pageNumber`, `nativeTextAvailable=false`, and `evidenceMode=OCR`;
- no rasterized working-copy SHA is promoted as the customer source identity.

The accepted fixture produced three source-observation coordinate roots, one for each physical page, all bound to the same original PDF SHA.

## Page-level orientation retry

A single selected scanned PDF page may now use the same bounded orientation-retry quality gate previously accepted for direct images.

For physical page 2:

- original scan was rotated 90 degrees;
- initial 0-degree OCR did not satisfy the final quality gate;
- bounded candidates were evaluated at 90, 270, and 180 degrees;
- accepted candidate: `270` degrees;
- OCR regions were remapped into the original PDF page coordinate space;
- returned `coordinateSpace=ORIGINAL_SOURCE`.

The local OCR service version for this contract is `1.3.0`.

Marker: `PDF_OCR_SERVICE_SELECTIVE_RASTERIZATION=PASS`

## Fail-closed unreadable-page proof

A second acceptance path forced every OCR/orientation candidate for selected physical page 2 below the quality floor.

Observed attempts:

- page selections: `[2], [2], [2], [2]`
- rotations: `0, 90, 270, 180`
- no request included native pages 1 or 3
- final result: `LOCAL_OCR_INSUFFICIENT_QUALITY`
- reasons included average confidence below `0.90` and material confidence below `0.85`

The native text on pages 1 and 3 did **not** cause Eve to silently treat the mixed PDF as complete when material scanned page 2 remained unreadable.

Marker: `P2_MIXED_PDF_SELECTIVE_OCR_FAIL_CLOSED=PASS`

## Runtime integration

Both production-style feature paths now use the same selective contract:

- `server/worker.ts`
- `server/hybridExtraction/HybridExtractionOrchestrator.ts`

Behavior:

- all-image/no-native-text PDF: existing full PDF OCR fallback remains available;
- all-native PDF: native parsing remains unchanged;
- mixed native/scanned PDF: native pages are preserved and only pages lacking native text are sent through local OCR;
- worker `ocrPagesCount` reflects the selectively OCR'd page count for mixed PDFs;
- a selected scanned page can use bounded orientation retry without OCRing neighboring native pages.

No second OCR pipeline or scheduler was created.

## Curriculum state

`CURR-OCR-IMAGE-ONLY-PDF` is now `CONTRACT_READY` and covers page-aware PDF OCR across image-only and mixed native/scanned PDFs.

Its targeted dimensions remain deliberately limited to:

- Source Coverage — PASS
- Semantic Understanding — PASS
- Accounting Accuracy — PASS
- Product Truth — NOT_TESTED for this ingestion-specific case
- Deliverable Truth — NOT_TESTED for this ingestion-specific case

Marker: `P2_PDF_OCR_CURRICULUM_TARGET_DIMENSIONS=PASS`

The two `NOT_TESTED` dimensions are not counted as passes. Consolidated browser and final-export lineage remain separate curriculum cases.

Catalog after this acceptance:

- total cases: 20
- CONTRACT_READY: 13
- PHYSICAL_FIXTURE_REQUIRED: 7
- autonomous eligible: 0

## Regression and build gates

The successful run passed:

- local OCR PDF rasterization/service contract;
- existing image-only PDF fallback tests;
- selective mixed-PDF source/provenance test;
- unreadable selected-page fail-closed test;
- worker/hybrid integration-wiring test;
- OCR parser evidence regression;
- provenance-safe OCR orientation retry regression;
- final OCR quality fail-closed regression;
- universal source evidence contract regression;
- five-dimension Academy curriculum regression;
- five-dimension grading regression;
- task evidence sufficiency regression;
- production build;
- evidence upload;
- second production build.

## Important production boundary

The currently running OCR services were **not rebuilt or deployed** during this acceptance. Direct production activation of selective `pdfPageNumbers` and PDF-page orientation support remains a separate controlled release step.

PR #31 remains a draft and must not be merged or released without separate owner authorization.

Pfizer / Company 1 was not rerun. Hermes scheduler ownership was not changed. No Codex was used.
