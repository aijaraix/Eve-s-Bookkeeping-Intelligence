# EVE-P1-005 — Local OCR + Image Source-to-Pixel Acceptance

Date: 2026-09-16 UTC

Feature branch: `feature/universal-evidence-ocr-foundation`

Status: **ACCEPTED CANDIDATE ON FEATURE BRANCH — NOT YET MERGED INTO MAIN APPLICATION CODE**

This acceptance closes the local OCR foundation requested for Eve without using paid per-page OCR and without using Codex for an OCR benchmark loop.

## Scope accepted

Eve now has a source-agnostic OCR path that preserves:

`original image bytes -> SHA-256 -> OCR engine/model -> page/image dimensions -> exact OCR region/bounding box -> text/confidence -> SourceValueProvenance -> promoted fact -> render metadata -> actual Practice Home value -> provenance drawer`

The same universal evidence contract used by spreadsheet cells is used by image OCR regions.

## Local engines

Primary: **PaddleOCR 3.7.0**, PP-OCRv6 medium, CPU only.

Fallback: **python-doctr 1.1.0**, `fast_base+crnn_vgg16_bn`, CPU-only PyTorch.

Paid OCR is not the default path. The Eve routing client invokes docTR only when the Paddle result is unavailable, empty, warning-bearing, below average-confidence threshold, or below material-field confidence threshold. Fallback output replaces primary output only when it materially improves the quality score under the configured margin.

## Physical engine proof on Eve hardware

Both engines were installed and executed on the actual Eve CPU-only node using the same synthetic receipt image.

PaddleOCR returned:

- correct receipt text including `EVE TEST MARKET`, `DATE 09/15/2026`, `OFFICE SUPPLIES 42.50`, `TAX`, `3.40`, `TOTAL`, `$45.90`;
- exact OCR polygons/boxes;
- per-region confidence;
- source dimensions;
- successful local CPU inference.

The current Eve CPU required Paddle static inference with MKL-DNN disabled. The default oneDNN/PIR path raised `ConvertPirAttribute2RuntimeAttribute not support ...`; the accepted service therefore explicitly uses `engine="paddle_static"` and `enable_mkldnn=False`.

docTR returned:

- the same receipt text;
- normalized geometry;
- per-word confidence aggregated to line regions;
- source dimensions;
- successful local CPU inference.

## Branch CI acceptance

GitHub Actions run `35046896743` completed successfully.

Passing gates included:

- Python OCR service syntax;
- universal evidence contract regression;
- spreadsheet lineage regression;
- local OCR routing regression;
- OCR parser evidence regression;
- unified parser-selection regression;
- image source-to-pixel presentation regression;
- existing presentation adapter regression;
- full production build.

The tested integration commit produced by that run was:

`37a75a9bafb16c79e5a9cbd09c322c377683bd2d` — `Integrate local OCR source-to-pixel lineage`.

## Real browser acceptance

A real headless Chromium session rendered the actual Eve `PracticeHomeView` path from the feature branch and used the actual `EveProvenanceDrawer`.

Physical marker:

`P1_005_REAL_PRACTICE_HOME_IMAGE_LINEAGE=PASS`

Observed rendered lineage for the synthetic Total Equity value:

- fact lineage ID: `fact-equity`;
- render ID: physically present;
- source provenance ID: `prov-receipt-total`;
- source type: `IMAGE`;
- locator: `Page 1 · Image region x=70.0% y=70.0% w=20.0% h=5.0%`;
- actual displayed value: `$400,000`;
- source document: `Synthetic_Receipt.png`.

After clicking that exact rendered value, the real provenance drawer displayed:

- image dimensions `1000×1400`;
- page `1`;
- OCR region `p1-r8`;
- normalized bounding box `x=0.7000 y=0.7000 w=0.2000 h=0.0500`;
- OCR text `TOTAL $400,000`;
- confidence `99.90%`;
- OCR engine `local-ocr:PADDLEOCR`;
- engine version `3.7.0`;
- provenance ID `prov-receipt-total`.

This satisfies the project rule that a material value is not lineage-complete merely because provenance exists in storage; the lineage must reach the real user-visible output.

## Persistent runtime services

The two OCR engines were built from:

- `services/local_ocr/Dockerfile.paddle`
- `services/local_ocr/Dockerfile.doctr`

and imported into the current single-node k3s/containerd runtime as:

- `docker.io/library/eve-ocr-paddle:p1-005`
- `docker.io/library/eve-ocr-doctr:p1-005`

Internal-only deployments and services are running:

- `eve-ocr-paddle:8765`
- `eve-ocr-doctr:8765`

No public ingress was created.

The reproducible current runtime manifest is stored at:

`deploy/k8s/eve-local-ocr.yaml`

## Persistent endpoint proof

The same synthetic receipt bytes were posted to both persistent service endpoints.

Paddle persistent service:

- `PADDLE_PERSISTENT_OCR=PASS`
- engine version `3.7.0`;
- model `PP-OCRv6-medium`;
- first warm execution approximately `20031 ms`;
- eight OCR regions;
- average confidence approximately `0.999838`;
- exact source SHA verified.

docTR persistent service:

- `DOCTR_PERSISTENT_OCR=PASS`
- engine version `1.1.0`;
- model `fast_base+crnn_vgg16_bn`;
- first warm execution approximately `8922 ms`;
- eight OCR regions;
- average confidence approximately `0.942668`;
- exact source SHA verified.

## Persistence / restart proof

Model caches are host-persisted:

- Paddle cache: `/opt/eve-ocr-models/paddle` — observed `139163790` bytes;
- docTR cache: `/opt/eve-ocr-models/doctr` — observed `129117916` bytes.

Both deployments were restarted. Cache byte counts were unchanged after replacement.

Physical marker:

`OCR_CACHE_RESTART_SURVIVAL=PASS`

Both OCR deployments returned to `1/1` ready.

The existing Eve extraction worker and the actual port-3000 Eve web pod were both able to reach the two internal OCR service endpoints successfully.

## Current application activation boundary

The OCR services are physically running, but the active production application is still sourced from `main` and therefore does **not** yet use this feature-branch OCR implementation.

Activation of image OCR for normal production upload flow requires:

1. merge/release of the feature-branch application changes;
2. application runtime environment values:
   - `EVE_OCR_PADDLE_URL=http://eve-ocr-paddle:8765`
   - `EVE_OCR_DOCTR_URL=http://eve-ocr-doctr:8765`;
3. post-deployment upload/browser regression using an isolated synthetic receipt before declaring production activation.

Do not claim production customer OCR is active merely because the internal OCR services are running.

## Protected-state confirmation

This work did not:

- rerun Pfizer / Company 1;
- alter Pfizer facts;
- replace Hermes;
- create a second Academy scheduler;
- merge application code into `main`;
- expose OCR publicly;
- introduce a paid OCR dependency.

## Result

**EVE-P1-005 LOCAL OCR FOUNDATION: ACCEPTED ON FEATURE BRANCH**

The next intelligence foundation task is source completeness + task evidence sufficiency + clarification/PBC contracts.
