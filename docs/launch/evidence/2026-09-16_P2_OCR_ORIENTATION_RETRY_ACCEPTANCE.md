# P2 OCR Orientation Retry Acceptance

Date: 2026-09-16 UTC
Repository: `aijaraix/Eve-s-Bookkeeping-Intelligence`
Branch: `feature/universal-evidence-ocr-foundation`
Draft PR: #31
Accepted implementation checkpoint: `f52d0bad8b2aa8f8cccc6c51bacd471e6cfa9279`
Acceptance workflow run: `35057464110`

## Acceptance status

**ACCEPTED FEATURE-BRANCH CANDIDATE / PRODUCTION ACTIVATION PENDING**

This work closes the direct-image 90-degree orientation gap discovered during the degraded OCR curriculum tests while preserving the existing fail-closed OCR quality gate and exact source-to-pixel provenance requirements.

It does **not** merge or release PR #31 and does not change the currently running production OCR services.

## Controlled retry policy

Normal high-quality direct images remain on the one-pass OCR path.

Orientation retry occurs only after the original direct-image OCR result still fails the final quality gate after normal primary/fallback evaluation.

Bounded working-copy rotations are evaluated in this order:

1. 90 degrees
2. 270 degrees
3. 180 degrees

Primary PaddleOCR rotation candidates are evaluated first. Rotated docTR fallback candidates are evaluated only if no primary rotated candidate independently passes the same final quality gate.

A rotated candidate is never accepted merely because it is better than the failed original. It must independently clear the existing final quality thresholds. If every candidate remains insufficient, Eve still throws the fail-closed `LOCAL_OCR_INSUFFICIENT_QUALITY` path.

Orientation retry currently applies to direct image inputs only. Nonzero rotation requests for PDFs are rejected; scanned/mixed-PDF orientation handling remains a separate page-level integration concern.

## Original-source provenance preservation

Rotation is a temporary OCR working-copy transformation only.

The original uploaded source remains authoritative:

- original source SHA-256 is retained on every retry request and returned evidence;
- OCR boxes/polygons obtained from a rotated working copy are inverse-transformed back to the original uploaded image coordinate system before provenance is emitted;
- selected OCR output declares `coordinateSpace: ORIGINAL_SOURCE`;
- the OCR parser records the rotation/remap transform in lineage metadata;
- page dimensions exposed for provenance remain the original source-image dimensions, while working-copy dimensions are separately available internally.

The geometry contract verifies inverse mappings for 90, 180 and 270 degrees and rejects unsupported rotation angles.

Physical/CI marker:

`OCR_ORIENTATION_GEOMETRY_TESTS=PASS`

## Deterministic 90-degree fixture closure

Previously accepted fixture hashes:

- upright receipt: `bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436`
- 90-degree receipt: `9f2496573071e396c8452534bf5afe67ddf0d676a0907919820733418609a698`

The acceptance workflow regenerated the committed degraded fixture set with the pinned deterministic recipe, then rotated the exact accepted 90-degree fixture by 270 degrees.

The corrected image reproduced the already accepted upright receipt **byte-for-byte**, not merely visually:

`OCR_ROTATION_270_RESTORES_ACCEPTED_RECEIPT_BYTES=PASS`

That upright receipt source had already been physically exercised against the live Eve PaddleOCR/docTR services in the prior receipt curriculum work, where the intended material fields and accounting identity were recovered.

This establishes that the controlled 270-degree correction for the known 90-degree fixture resolves to the same physically proven source bytes.

## Routing + provenance contract

`server/tests/ocrOrientationRetry.test.ts` proves that:

- original low-quality primary/fallback results do not get promoted;
- orientation retry is invoked only after final-quality failure;
- the bounded rotation attempts retain the original source SHA;
- a passing rotated primary candidate can be selected without unnecessary rotated fallback evaluation;
- only one attempt is marked selected;
- selected rotation is persisted in routing metadata;
- the parser preserves original-source coordinates and records a rotation/remap transform;
- source blocks and source-value provenance retain the orientation metadata.

Marker:

`OCR_ORIENTATION_RETRY_TESTS=PASS`

## Regression and build acceptance

Corrected acceptance run: `35057464110` — **SUCCESS**.

Passed gates:

- original-coordinate orientation geometry contract
- deterministic 90-degree fixture correction identity
- orientation retry routing and provenance
- local OCR routing and final-quality regression
- OCR fail-closed quality gate regression
- OCR parser evidence regression
- PDF OCR rasterization regression
- PDF OCR fallback regression
- PDF OCR integration wiring regression
- Academy OCR curriculum regression
- degraded OCR fixture regression
- five-dimension Academy grading regression
- five-dimension Academy curriculum regression
- P1-009 task evidence sufficiency regression
- P1-010 clarification coordinator regression
- P1-010 clarification route/auth regression
- universal evidence regression
- spreadsheet lineage regression
- presentation adapter regression
- Academy dashboard truth regression
- full production build

The first orientation workflow run `35057352806` stopped only because its workflow referenced a stale/nonexistent test filename. The new orientation-specific gates had already passed. The workflow target was corrected to the current `server/tests/ocrFailClosedQualityGate.test.ts`; no production rule was weakened to obtain the green run.

## Source-control cleanup

The one-shot implementation machinery self-removed after acceptance:

- `.github/workflows/eve-p2-orientation-retry-one-shot.yml` — removed
- `scripts/eve-p2-orientation-retry-apply.py` — removed

Only tested implementation/tests remain on the feature branch.

## Remaining boundaries

This acceptance does **not** establish production activation.

Still pending controlled release authorization:

- merge/release of draft PR #31;
- rebuild/release of the live OCR services with the orientation-capable service version;
- production application runtime activation and post-release synthetic/browser regression.

Also still pending separate work:

- selective page-level OCR/orientation handling for mixed native/scanned PDFs;
- case-specific Product Truth and Deliverable Truth browser/export evidence;
- invoice/AP semantic and workflow curriculum beyond OCR extraction.

All relevant new Academy cases remain outside autonomous scheduling until their complete physical execution path is independently accepted.

Pfizer / Company 1 was not rerun. Hermes remains the sole Academy scheduler authority. No Codex was used.
