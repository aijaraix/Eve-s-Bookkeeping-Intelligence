# P2 OCR Curriculum — Receipt + Invoice Physical Evidence

Date: 2026-09-16 UTC

Branch: `feature/universal-evidence-ocr-foundation`

Implementation checkpoint physically tied to this evidence:

`47afb13d671d9449d2ae53303dc2d2ff29f1c643` — `Add Academy OCR curriculum runner`

Draft PR: #31

Status: **DIRECT-IMAGE OCR SOURCE FIXTURES PHYSICALLY VERIFIED / ACADEMY RUNNER CI-ACCEPTED / FULL FIVE-DIMENSION CASES NOT YET COMPLETE**

## Purpose

This acceptance record advances the first physical curriculum fixtures after the five-dimension Academy catalog was accepted.

The work deliberately does **not**:

- rerun Pfizer / Company 1;
- change Hermes Academy scheduler authority;
- make any new curriculum case autonomous;
- merge or deploy PR #31;
- claim Product Truth without a real browser pass;
- claim Deliverable Truth without a final report/export pass;
- claim image-only/scanned-PDF OCR is complete.

The physical test used deterministic synthetic images containing no customer data and called Eve's two existing internal-only OCR services directly on the Eve runtime host.

## Live runtime verified

SentinelX host:

`eve-bookkeeping-prod-ai`

Kubernetes namespace:

`environment-6a9b1274a34c009752279011`

Internal services used:

- PaddleOCR: `eve-ocr-paddle:8765`
- docTR: `eve-ocr-doctr:8765`

No public ingress was added.

No application deployment, scheduler, database, customer workspace or production source data was modified.

## Deterministic fixture reproducibility

The committed fixture generator at checkpoint `47afb13d671d9449d2ae53303dc2d2ff29f1c643` was physically executed on the Eve host using pinned Pillow `12.3.0`.

Marker:

`COMMITTED_FIXTURE_REPRODUCIBILITY=PASS`

It reproduced the exact source bytes used by the live OCR calls:

### Receipt

Filename: `receipt.png`

Bytes: `22803`

SHA-256:

`bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436`

### Invoice

Filename: `invoice.png`

Bytes: `31822`

SHA-256:

`1000426f9989dd8aa2767d57c10248648a770aa05d957d04940fd1463e0cf105`

## Physical receipt result

### PaddleOCR

- engine: `paddleocr`
- engine version: `3.7.0`
- model: `PP-OCRv6-medium`
- pages: 1
- regions: 12
- average region confidence: `0.9974`
- service elapsed time observed: `8466 ms`

Observed text was exact for the intended receipt fixture, including:

- `EVE TEST MARKET`
- `RECEIPT R-2026-0916`
- `DATE 09/16/2026`
- `OFFICE SUPPLIES $24.50`
- `PRINTER PAPER $18.00`
- `COFFEE $7.25`
- `SUBTOTAL $49.75`
- `SALES TAX $3.48`
- `TOTAL $53.23`
- `VISA 4242 $53.23`

### docTR

- engine: `doctr`
- engine version: `1.1.0`
- model: `fast_base+crnn_vgg16_bn`
- pages: 1
- regions: 12
- average region confidence: `0.9518`
- service elapsed time observed: `1514 ms`

The normalized receipt text matched the Paddle result for the tested fixture.

### Receipt accounting identity

Expected:

`49.75 + 3.48 = 53.23`

Result: **PASS**

This physically establishes the source/OCR portion of the receipt curriculum fixture. It does not by itself establish Product Truth or Deliverable Truth.

## Physical invoice result

### PaddleOCR

- engine: `paddleocr`
- engine version: `3.7.0`
- model: `PP-OCRv6-medium`
- pages: 1
- regions: 13
- average region confidence: `0.9939`
- service elapsed time observed: `14813 ms`

All tested accounting amounts were read correctly, including:

- `$70.00`
- `$60.00`
- `$45.00`
- `SUBTOTAL $175.00`
- `SALES TAX $12.25`
- `TOTAL DUE $187.25`

But PaddleOCR produced this high-confidence semantic error:

`INV0ICE INV-260916-1042`

instead of:

`INVOICE INV-260916-1042`

### docTR

- engine: `doctr`
- engine version: `1.1.0`
- model: `fast_base+crnn_vgg16_bn`
- pages: 1
- regions: 13
- average region confidence: `0.9477`
- service elapsed time observed: `2153 ms`

For the disputed line, docTR correctly returned:

`INVOICE INV-260916-1042`

The accounting amounts also matched the expected fixture.

### Invoice accounting identity

Expected:

`175.00 + 12.25 = 187.25`

Result: **PASS**

## Important Academy finding — confidence alone is insufficient

The invoice is a real curriculum defect discovery, not a benchmark failure to hide.

The primary engine had very high aggregate confidence while still making a semantic character substitution (`O` -> `0`) in a material document identifier/label.

Therefore a confidence-only fallback policy cannot detect every OCR semantic error.

The accepted response is **not** to double OCR cost for all normal customer uploads.

Instead, checkpoint `47afb13d671d9449d2ae53303dc2d2ff29f1c643` adds an **opt-in Academy dual-engine evaluation mode**:

`forceFallbackEvaluation: true`

Production/default behavior remains unchanged (`false`). A high-confidence normal primary result therefore does not automatically incur fallback cost.

## Academy OCR curriculum runner

Checkpoint `47afb13d671d9449d2ae53303dc2d2ff29f1c643` adds:

- `server/cpaOrganization/academyOcrCurriculumRunner.ts`
- `scripts/academy/generate_ocr_curriculum_fixtures.py`
- `scripts/academy/run_ocr_curriculum_fixture.ts`
- `server/tests/academyOcrCurriculumRunner.test.ts`
- opt-in forced dual-engine evaluation in `src/lib/ocr/localOcrClient.ts`

The runner:

1. computes the exact source SHA;
2. uses Eve's existing `LocalOcrClient`;
3. forces both local engines only for the Academy fixture;
4. preserves both OCR attempts;
5. compares engine text and identifies material disagreement;
6. creates evidence-backed Source Coverage, Semantic Understanding and Accounting Accuracy checks;
7. routes those checks through the existing five-dimension Minerva grader;
8. leaves Product Truth `NOT_TESTED` until a real Eve browser pass exists;
9. leaves Deliverable Truth `NOT_TESTED` until a real final report/export pass exists.

No parallel Minerva/evaluator service was created.

## Deterministic CI acceptance

GitHub Actions run:

`35054577162` — **PASS**

Final tested implementation commit:

`47afb13d671d9449d2ae53303dc2d2ff29f1c643`

The run passed:

- Academy OCR curriculum runner contract;
- five-dimension curriculum catalog regression;
- five-dimension grading regression;
- five-dimension presentation regression;
- P1-009 sufficiency regression;
- P1-010 clarification coordinator regression;
- P1-010 clarification route/auth regression;
- universal source-evidence regression;
- spreadsheet source-to-pixel lineage regression;
- OCR evidence regression;
- presentation adapter regression;
- Academy dashboard truth regression;
- full production build;
- tested commit and one-shot cleanup.

The deterministic runner test explicitly reproduces the physical invoice disagreement:

- Paddle selected under the unchanged higher-confidence production-style score policy;
- Paddle text: `INV0ICE INV-260916-1042`;
- docTR text: `INVOICE INV-260916-1042`;
- dual-engine material difference: detected;
- Source Coverage: PASS;
- Semantic Understanding: FAIL independently;
- Accounting Accuracy: PASS independently;
- Product Truth: NOT_TESTED;
- Deliverable Truth: NOT_TESTED;
- overall five-dimension result: FAIL because Semantic Understanding failed.

The same test proves default/non-Academy high-confidence routing makes only the primary call and does not invoke fallback.

## Exact committed runner — live-service execution boundary

The live OCR services and the exact committed fixture bytes are physically verified.

The exact committed TypeScript runner has **not yet** been executed against the live internal OCR services from the SentinelX host shell because that host shell currently has neither Node/npm nor Docker available.

A bounded attempt stopped before OCR invocation with:

`npm: command not found`

No production/runtime state was changed by that failed attempt.

This is a runtime execution-surface gap, not evidence that the runner failed, and not a Codex blocker. The runner is deterministic-CI accepted; live OCR behavior is independently physically proven with the same source bytes.

Do not silently mutate the production Kubernetes cluster merely to manufacture a Node execution surface for this additional proof.

## Five-dimension truth status for these fixtures

### Receipt photo

Physically established now:

- Source/OCR evidence: verified
- Semantic fixture literals: verified at raw OCR level
- Accounting amounts/reconciliation: verified at raw OCR level

Still required before a full five-dimension pass:

- actual Eve browser-rendered Product Truth for this exact fixture
- final deliverable/report truth for this exact fixture where applicable

### Scanned invoice image

Physically established now:

- Source/OCR evidence: verified
- Accounting amounts/reconciliation: verified
- material cross-engine semantic disagreement: verified

Current curriculum finding:

- Semantic Understanding must **not** be treated as PASS while the selected primary output contains `INV0ICE` for an expected `INVOICE` label/identifier context.

Still required before any complete five-dimension result:

- repair or adjudication behavior for the semantic disagreement
- actual Eve browser Product Truth
- final deliverable/report truth where applicable

These catalog cases therefore remain `PHYSICAL_FIXTURE_REQUIRED` and `autonomousEligible: false` rather than being promoted to a blanket PASS.

## Image-only PDF boundary remains open

Direct image OCR is first-class for PNG/JPEG/WEBP/TIFF/BMP.

Image-only/scanned PDF page rendering into the OCR contract remains a follow-on integration and must not be represented as complete yet. The repository's `services/local_ocr/README.md` explicitly preserves this boundary.

The image-only PDF curriculum case therefore remains pending.

## Protected-state confirmation

This work did not:

- rerun Pfizer / Company 1;
- change the accepted Pfizer FY2024 baseline;
- create or change an Academy scheduler;
- make any new curriculum case autonomous;
- merge PR #31;
- deploy feature-branch application code;
- enable global dual-engine OCR economics for normal customer work;
- issue a CPA opinion, audit opinion, statutory certification or human professional sign-off;
- claim Product Truth or Deliverable Truth without their required physical evidence.

## Result

**RECEIPT + INVOICE DIRECT-IMAGE OCR CURRICULUM SOURCE EVIDENCE: PHYSICALLY VERIFIED**

**ACADEMY OCR CURRICULUM RUNNER: CI ACCEPTED**

**FULL FIVE-DIMENSION RECEIPT/INVOICE ACCEPTANCE: NOT YET COMPLETE**

The next bounded no-Codex work is to add the semantic disagreement adjudication/fail-closed path and then continue low-quality/rotated/glare/crop fixtures. Image-only PDF requires the separate PDF-page-rendering integration before it can be physically accepted.