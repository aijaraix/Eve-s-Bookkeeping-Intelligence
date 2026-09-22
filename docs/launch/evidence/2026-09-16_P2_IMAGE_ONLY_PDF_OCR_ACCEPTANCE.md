# P2 image-only PDF OCR fallback — acceptance record

Date: 2026-09-16
Branch: `feature/universal-evidence-ocr-foundation`
Status: ACCEPTED FEATURE-BRANCH CANDIDATE / LIVE SERVICE RELEASE PENDING

## Scope

This record covers page-aware OCR fallback for PDFs with no native text.

It does not replace deterministic native-text PDF parsing. The accepted order is:

1. PDF enters `AnyDocParser` first.
2. Native page inventory/text is preserved when available.
3. Only when the PDF has no native text across its inventoried pages does Eve route the original PDF into the local OCR boundary.
4. The OCR service rasterizes each PDF page and applies the existing PaddleOCR/docTR engine path.
5. OCR observations retain PDF page/region provenance rather than being mislabeled as generic image evidence.

Accepted implementation checkpoint:

`ccedc37d7f3b07d49a6d4c4aaf9cb5c67d6c21d9`

CI run:

`35055831123` — PASS through PDF-specific contracts, all listed P1/P2 regressions and full production build.

## Physical design proof on Eve hardware

A deterministic synthetic receipt image was embedded into a one-page PDF as an image only.

Native-text verification:

`PDF_NATIVE_TEXT_EMPTY=PASS`

Physical PDF artifact:

- bytes: 24,574
- SHA-256: `6fce244e380c81d9e54cfcef0eff76f8ef73a98b380f4764611ef00d9cd72f13`

PyMuPDF 1.26.4 rasterization at 160 DPI produced:

- raster bytes: 84,580
- raster SHA-256: `55818cb18e5357e441c7c7432e3e6e7819ab98a7bcb09b60a156bf93f7033a6c`

Marker:

`PDF_RASTERIZATION=PASS`

The exact raster page was then sent to the already-running internal OCR services.

PaddleOCR recovered 12 regions including:

- `SUBTOTAL $49.75`
- `SALES TAX $3.48`
- `TOTAL $53.23`

docTR recovered 13 regions including the same material totals.

Marker:

`IMAGE_ONLY_PDF_RASTER_TO_LIVE_OCR=PASS`

This physical test establishes that the selected rasterization approach works on Eve's actual CPU host and that the resulting page raster is consumable by both existing OCR engines.

## Implemented service contract

The local OCR service now accepts both direct images and PDFs in feature-branch source.

For PDFs it:

- verifies the original PDF source SHA-256;
- enforces input byte limits;
- rejects encrypted/password-required PDFs;
- enforces a configurable maximum page count;
- rasterizes pages with PyMuPDF;
- uses a bounded configurable PDF DPI (default 160);
- invokes the same configured OCR engine page by page;
- preserves original PDF page numbers;
- returns page raster dimensions plus original PDF page dimensions in points;
- returns `PDF_RASTERIZED_FOR_OCR` in warnings;
- keeps the original PDF hash as the source hash for the OCR result.

Runtime settings added in feature-branch source:

- `OCR_PDF_RENDER_DPI=160`
- `OCR_MAX_PDF_PAGES=50`

PyMuPDF is pinned in both local OCR service images.

## Parser/fallback contract

`shouldUsePdfOcrFallback(...)` is content-aware.

Fallback is allowed when:

- the source is a PDF;
- the PDF page inventory exists (or native extraction produced no useful inventory/text);
- every inventoried page lacks native text;
- the overall extracted native text is empty.

Fallback is not triggered merely because the file extension is PDF.

A PDF with native text remains on the deterministic native-text parser path.

A mixed PDF containing at least one native-text page is not silently converted wholesale to OCR by this first implementation. Selective page-level OCR for mixed native/scanned PDFs remains follow-on work.

## Universal evidence contract

For scanned-PDF OCR, `OCRParser` now emits `PdfSourceCoordinate` rather than `ImageSourceCoordinate`.

The coordinate retains:

- original PDF source SHA-256;
- source artifact ID;
- PDF page number;
- exact normalized OCR bounding region;
- OCR literal;
- confidence;
- engine/version;
- `nativeTextAvailable: false`;
- `evidenceMode: OCR`.

This keeps scanned-PDF observations in the correct source-coordinate family and preserves reverse trace to the original customer PDF page.

## Execution-path integration

The content-aware fallback is wired into:

- the dedicated extraction worker;
- the hybrid extraction orchestrator.

The implementation extends the existing parsers and OCR services. It does not create a second PDF/OCR subsystem.

## CI acceptance

Run `35055831123` passed:

- Python source compile checks;
- functional two-page PDF rasterization/service contract;
- PDF OCR fallback decision tests;
- PDF source-coordinate provenance tests;
- worker/hybrid integration wiring tests;
- parser selection regression;
- local OCR routing/final-quality regression;
- OCR parser evidence regression;
- Academy OCR curriculum regression;
- degraded OCR fixture regression;
- five-dimension Academy grading and curriculum regressions;
- P1-009 sufficiency regression;
- P1-010 clarification coordinator regression;
- P1-010 route/auth regression;
- universal evidence regression;
- spreadsheet lineage regression;
- presentation adapter regression;
- Academy dashboard truth regression;
- full production build.

## Release boundary

The currently running `eve-ocr-paddle` and `eve-ocr-doctr` services were intentionally not rebuilt/redeployed during this step.

Therefore:

- the rasterization approach is physically verified on Eve hardware;
- both live OCR engines are physically verified against the resulting page raster;
- the new direct-PDF local OCR service contract is CI-tested in feature-branch source;
- normal production application/customer uploads are **not yet declared to be using direct PDF OCR fallback**.

Activation still requires the separate controlled PR #31 release, service image rebuild/release, OCR URL/runtime configuration verification, and a post-deployment synthetic scanned-PDF regression.

## Remaining work

- selective page-level OCR for mixed native-text/scanned PDFs;
- real deployed direct-PDF request against the rebuilt local OCR services;
- Product Truth browser verification for the scanned-PDF case;
- Deliverable Truth export/report verification for a scanned-PDF-derived conclusion.

No Pfizer / Company 1 run was performed. No Academy scheduler was changed. No Codex was used.
