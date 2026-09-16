# 13 — Local OCR Selection Strategy

Status: APPROVED DIRECTION / IMPLEMENTATION PENDING
Date: 2026-09-15
Task: `EVE-P1-005`

## Objective

Select and integrate a high-quality self-hosted OCR/vision stack for Eve without spending Codex credits on repeated benchmark loops and without making per-page paid OCR a required operating cost.

The selection process is:

1. use current official/community benchmark evidence to narrow the field;
2. choose two commercially usable local candidates;
3. expose both behind one Eve OCR adapter contract;
4. run the real Eve-specific benchmark continuously through Academy and production-safe synthetic/curated fixtures;
5. route by confidence/materiality rather than running every engine on every page;
6. retain a paid/cloud OCR/VLM only as an optional future escalation path, never as the default dependency.

## Current physical host constraint

Runtime audit on 2026-09-15 found the Eve host has:

- 4 vCPUs
- approximately 14 GiB RAM
- no NVIDIA GPU / no `nvidia-smi`
- approximately 20 GiB free root storage at the time of audit

This means candidate selection must value CPU viability and bounded memory use. Published GPU-only throughput cannot be treated as representative of Eve's current runtime.

## Recommended local stack

### Primary engine — PaddleOCR

Recommended starting composition:

- PP-OCRv6 or current stable CPU-suitable recognition/detection tier
- PP-StructureV3 / document-layout components where layout/table structure is needed
- deterministic image preprocessing before OCR where useful

Reasons:

- Apache 2.0 license
- active project and broad document/image support
- official support for layout analysis, text detection/recognition and table structure
- CPU inference is a supported deployment mode
- community reports consistently describe it as a substantial upgrade over Tesseract for receipts, scanned financial documents and non-trivial layouts
- newer PaddleOCR releases explicitly target skew, warping, scans, illumination and screen-photo/document-image scenarios

Eve should not assume one Paddle model/configuration is best for every class. Use a named engine version/config in every OCR evidence receipt.

### Secondary engine — docTR

Recommended as an independent second OCR implementation behind the same Eve adapter.

Reasons:

- Apache 2.0 license
- local/self-hosted Python implementation
- detection + recognition pipeline with geometry output
- project includes evaluation paths for document OCR/KIE and receipt-oriented datasets such as SROIE/CORD/FUNSD
- provides an independent model family for disagreement checks rather than merely rerunning a differently configured Paddle model

Use docTR selectively rather than on every artifact until actual Eve runtime cost is measured.

## Utility baseline — Tesseract / OCRmyPDF

Tesseract should remain available as a low-complexity deterministic baseline and utility for clean printed/scanned pages or searchable-PDF workflows.

Do not make it Eve's principal receipt/photo OCR. Community reports and current project requirements indicate weaker behavior on low-quality images and document layout compared with modern document OCR pipelines.

It is useful for:

- clean-page baseline comparisons
- cheap secondary sanity checks
- searchable-PDF creation through OCRmyPDF where appropriate
- regression detection when a newer OCR stack unexpectedly produces worse plain-text output

## Surya status

Surya/Surya 2 is technically interesting and published benchmarks show strong document/layout/table performance, but it is not selected as an embedded production engine at this stage because:

- current Eve hardware has no GPU and only 4 vCPU;
- current Surya runtime guidance centers on GPU/vLLM or llama.cpp-style inference backends for the newer model;
- the current Surya model license contains commercial-use restrictions, including revenue/funding thresholds and restrictions related to competing services.

Do not embed Surya in Eve production without a specific license review and runtime justification. Published Surya results may still be used as an external quality reference.

## Eve OCR adapter contract

Both candidate engines must produce the same normalized output contract so the rest of Eve is engine-agnostic.

Minimum output per page/image:

- `ocrRunId`
- `engineName`
- `engineVersion`
- `modelName`
- `modelVersion/configHash`
- `sourceArtifactId`
- `sourceSha256`
- `pageNumber/imageId`
- original width/height
- normalized/deskew transform where used
- text regions / lines / tokens
- bounding coordinates mapped back to original source coordinates
- recognized text
- confidence at the most granular level available
- reading-order information where available
- layout/table region information where available
- preprocessing operations
- run start/end/latency
- CPU/RAM/resource metadata where practical
- warnings / unsupported conditions

Promoted fields must reference exact OCR region IDs through the universal source-to-presentation lineage contract.

## Routing policy

Do not run both full OCR engines on every page by default.

Suggested runtime policy:

1. deterministic native-text extraction first;
2. if native text is sufficient, do not OCR;
3. image/image-only page → PaddleOCR primary;
4. if primary confidence and structural checks pass, continue;
5. if a material field is low-confidence, structurally inconsistent, fails reconciliation, or falls in a difficult class, run docTR on only the affected page/region;
6. compare candidate outputs;
7. deterministic accounting/business checks may resolve disagreement;
8. unresolved material disagreement becomes clarification/reviewer workflow;
9. customer work always preempts Academy/background OCR exercises.

## Disagreement logic

The secondary engine is evidence, not an automatic truth oracle.

Example:

- Paddle reads `$57.05`
- docTR reads `$57.85`
- receipt subtotal/tax arithmetic supports `$57.05`

Eve may promote `$57.05` with an evidence record explaining the disagreement and reconciliation.

If no rule/source context resolves the disagreement, mark the field `REVIEW_REQUIRED` or issue a clarification.

## Benchmark strategy — no Codex loop

Do not use Codex to repeatedly install/run/compare OCR candidates.

Academy owns the empirical benchmark after integration.

### External evidence phase

Use:

- official project benchmarks
- public benchmark datasets
- current GitHub documentation/issues
- credible community experience reports
- license and deployment requirements

This phase narrows candidates only; it does not make customer-facing accuracy claims.

### Internal Eve benchmark phase

Create a persistent synthetic/curated benchmark corpus containing at least:

- clean printed receipt
- crumpled/angled receipt photo
- low-light receipt
- long thermal receipt
- printed invoice with tables
- scanned bank statement
- image-only multi-page PDF
- tiny text
- multiple columns
- rotated/skewed page
- handwritten annotation over printed text
- poor contrast
- mixed currency/date/decimal formats
- duplicate/near-duplicate images
- document with a materially important single ambiguous digit

Each case has sealed expected fields/coordinates where feasible.

Academy records per engine:

- detection/recognition quality
- field-level precision/recall
- numeric exact-match accuracy
- currency/date accuracy
- reading order/layout quality
- table structure quality
- coordinate fidelity
- confidence calibration
- latency
- resource use
- failure/crash rate
- whether secondary engine changed the final outcome

Do not publish one generic OCR accuracy percentage.

## Promotion gate

No OCR-derived number enters authoritative customer accounting truth solely because one OCR engine emitted it.

Promotion may use:

- OCR confidence
- agreement between engines
- arithmetic/reconciliation
- source context
- duplicate/corroborating evidence
- downstream deterministic validation
- customer/reviewer clarification

The original image/page, OCR output and all disagreements remain preserved.

## Cost rule

The default OCR path must be self-hosted with no per-page third-party charge.

Cloud OCR/VLM may later be added only as an optional bounded escalation for exceptional material cases, with explicit cost tracking and owner-approved policy.

## Implementation order

1. define normalized OCR adapter/result interfaces
2. build isolated Python OCR sidecar/service boundary rather than forcing heavy Python dependencies into the Node web process
3. integrate PaddleOCR primary path
4. integrate docTR secondary path
5. preserve Tesseract/OCRmyPDF as baseline utility if operationally useful
6. connect OCR regions to `UniversalSourceCoordinate`
7. connect OCR-promoted values to source-to-presentation lineage
8. add confidence/disagreement/reconciliation routing
9. add Academy OCR benchmark corpus and scorecard
10. tune routing based on accumulated Eve evidence rather than developer preference

## Current decision

`PRIMARY_LOCAL_OCR = PaddleOCR`

`SECONDARY_LOCAL_OCR = docTR`

`UTILITY_BASELINE = Tesseract/OCRmyPDF`

`SURYA = EXTERNAL_REFERENCE / NOT EMBEDDED WITHOUT LICENSE+RUNTIME REVIEW`

`PAID_OCR = OPTIONAL_FUTURE_ESCALATION_ONLY`

`CODEX_BENCHMARK_LOOP = PROHIBITED`
