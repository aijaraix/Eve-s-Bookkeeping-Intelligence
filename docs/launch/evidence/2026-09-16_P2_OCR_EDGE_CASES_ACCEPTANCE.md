# P2 OCR edge cases — targeted-dimension acceptance

Date: 2026-09-16
Repository: `aijaraix/Eve-s-Bookkeeping-Intelligence`
Branch: `feature/universal-evidence-ocr-foundation`
Draft PR: #31

Status: **ACCEPTED FEATURE-BRANCH CURRICULUM CLOSURE / TARGETED DIMENSIONS ONLY / NOT PRODUCTION ACTIVATED / NOT AUTONOMOUS**

## Accepted implementation checkpoint

`cd09e0fa92ab1b966f4d9859c777f3dc1271d263` — `Close degraded OCR edge curriculum`

Successful corrected acceptance run:

`35144300336` — SUCCESS

Evidence artifact:

- name: `eve-ocr-edge-cases-targeted-acceptance`
- artifact ID: `10465664879`
- ZIP digest: `sha256:69a7f46485888c9e1b43e6281319e9d6fdfeba94b221f841bd3afd42a05c8346`
- size: 142090 bytes

Markers:

- `P2_OCR_EDGE_PHYSICAL_SOURCE_CONTRACT=PASS`
- `P2_OCR_EDGE_CASES_TARGETED_DIMENSIONS_ACCEPTED=PASS`

## Scope and grading rule

This pass closes the four remaining degraded direct-image OCR curriculum fixtures:

- `CURR-OCR-LOW-QUALITY-SCAN`
- `CURR-OCR-ROTATED-SKEWED`
- `CURR-OCR-GLARE-CROP`
- `CURR-OCR-ENGINE-DISAGREEMENT`

These are narrow ingestion/evidence-control cases. Their curated curriculum definitions target only the dimensions relevant to the risk being tested.

Accordingly, this acceptance does **not** fabricate Product Truth, Deliverable Truth, or any other non-target dimension. Non-target dimensions remain `NOT_TESTED`, and each case has `overallStatus=INCOMPLETE_DIMENSION_COVERAGE` under the global five-dimension grader even though every required targeted dimension passes.

`CONTRACT_READY` here means the physical fixture and its intended safety behavior are accepted; it does not mean all five global dimensions were exercised.

## Physical source reproducibility

The corrected workflow regenerated the existing deterministic receipt/invoice fixtures with pinned Pillow 12.3.0 and verified the exact previously accepted source identities:

- upright receipt: `bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436`
- invoice: `1000426f9989dd8aa2767d57c10248648a770aa05d957d04940fd1463e0cf105`
- low-quality receipt: `a1f03b9bdda7e8d8eae67d924a62de679a8d5fa6e6d0e94967b2cfd7d417de9c`
- 90-degree receipt: `9f2496573071e396c8452534bf5afe67ddf0d676a0907919820733418609a698`
- 6-degree skew receipt: `ec635a9f1cbb49d89afb0308339e50f591ed2a23d29d44fd8e754279eec4ce0a`
- glare over totals: `49fac9e0a910f8b8b3f8cd130569cc8732bd15783ddb6611514edb4cd667072a`
- crop before totals: `017e27b1bdcf1d5045512fe82a2f577cb44e841bdf992405061c55781fa8eaed`

Additional physical source checks in this run:

- rotating the exact 90-degree fixture by 270 degrees regenerated the already accepted upright receipt bytes exactly;
- the glare fixture's material totals rectangle `(40,445,860,610)` was physically all-white, extrema `(255,255)`;
- the crop fixture was exactly `900x450`, ending before the subtotal/tax/total block;
- low-quality fixture remained exactly `405x450`;
- skew fixture retained its exact deterministic SHA.

## Case 1 — low-quality scan

Case: `CURR-OCR-LOW-QUALITY-SCAN`

Target dimensions:

- Source Coverage — **PASS**
- Accounting Accuracy — **PASS**

Non-target dimensions remain `NOT_TESTED`.

Physical source:

`a1f03b9bdda7e8d8eae67d924a62de679a8d5fa6e6d0e94967b2cfd7d417de9c`

Previously accepted live Eve OCR evidence records:

- PaddleOCR: 12 regions; average confidence approximately 0.9946; material receipt fields/totals readable;
- docTR: 12 regions; average confidence approximately 0.9423; material totals readable with a punctuation-only `SALES, TAX` variation.

The current Academy routing contract was re-exercised against the exact physical fixture identity. It retained source SHA/confidence evidence and the material accounting literals:

- subtotal `49.75`
- tax `3.48`
- total `53.23`
- identity `49.75 + 3.48 = 53.23`

The accepted behavior remains conservative: a readable degraded fixture is not a claim that arbitrary low-quality scans are safe, and low-confidence material evidence still fails closed under the existing final quality gate.

## Case 2 — rotated / skewed

Case: `CURR-OCR-ROTATED-SKEWED`

Target dimensions:

- Source Coverage — **PASS**
- Semantic Understanding — **PASS**

Non-target dimensions remain `NOT_TESTED`.

Physical sources:

- 90-degree: `9f2496573071e396c8452534bf5afe67ddf0d676a0907919820733418609a698`
- 6-degree skew: `ec635a9f1cbb49d89afb0308339e50f591ed2a23d29d44fd8e754279eec4ce0a`

The prior live OCR evidence established that both engines read the 6-degree skew correctly with the material receipt content/totals intact.

The prior live evidence also established that the uncorrected 90-degree source was materially poor in both engines. The accepted bounded retry policy was re-exercised in this pass:

- orientation retry invoked only after original/fallback quality failure;
- bounded candidates: 90, 270, 180 degrees;
- selected correction: **270 degrees**;
- selected coordinate space: **`ORIGINAL_SOURCE`**;
- original rotated source SHA retained;
- the deterministic 270-degree correction reproduces the already-live-proven upright receipt bytes exactly.

The case therefore proves both reading-order recovery and preservation of original-image lineage rather than substituting the rotated working copy as the authoritative source.

## Case 3 — glare / crop

Case: `CURR-OCR-GLARE-CROP`

Target dimensions:

- Source Coverage — **PASS**
- Accounting Accuracy — **PASS**

Non-target dimensions remain `NOT_TESTED`.

Physical sources:

- glare: `49fac9e0a910f8b8b3f8cd130569cc8732bd15783ddb6611514edb4cd667072a`
- crop: `017e27b1bdcf1d5045512fe82a2f577cb44e841bdf992405061c55781fa8eaed`

The source verifier proved the glare physically removes the material totals region and the crop physically ends before the totals block. The prior live Eve OCR evidence independently observed the same truth: visible receipt content remained, but subtotal/tax/total disappeared in both engines.

This run then exercised the current P1-009 task-evidence-sufficiency engine against both exact source identities.

For each degraded source:

- merchant identity remained an independently supported/allowed conclusion;
- `receipt-total` was explicitly blocked;
- task evidence state became `INSUFFICIENT_FOR_CURRENT_PURPOSE`;
- recommended action became `REQUEST_ADDITIONAL_EVIDENCE`;
- Eve did not infer, zero-fill, or reconstruct the obscured/absent totals.

This is the intended accounting behavior: material source loss blocks only the conclusions that require the lost evidence.

## Case 4 — PaddleOCR / docTR material disagreement

Case: `CURR-OCR-ENGINE-DISAGREEMENT`

Target dimensions:

- Source Coverage — **PASS**
- Accounting Accuracy — **PASS**

Non-target dimensions remain `NOT_TESTED` in the targeted curriculum closure.

Exact invoice source:

`1000426f9989dd8aa2767d57c10248648a770aa05d957d04940fd1463e0cf105`

The prior live Eve OCR calls physically established:

- PaddleOCR: `INV0ICE INV-260916-1042`
- docTR: `INVOICE INV-260916-1042`
- Paddle remained the higher-confidence primary;
- accounting amounts themselves agreed and reconciled.

The current Academy dual-engine runner was re-exercised against the exact physical source identity and reproduced the disagreement contract:

- both engine attempts preserved;
- material difference detected: `true`;
- selected engine remains Paddle under the unchanged confidence policy;
- Accounting Accuracy for subtotal/tax/total remains `PASS`;
- Semantic Understanding in the underlying dual-engine execution is `FAIL`;
- underlying execution overall status is **`FIVE_DIMENSION_FAIL`**.

That failure is intentional evidence of the safeguard: a high-confidence primary output cannot convert an unresolved material cross-engine semantic disagreement into a passing/canonically promotable interpretation merely because the accounting arithmetic is correct.

## Regression acceptance

Corrected run `35144300336` passed:

- deterministic degraded fixture generation;
- physical hash/pixel/crop verification;
- four-case targeted-dimension acceptance;
- Academy OCR curriculum runner regression;
- OCR orientation retry regression;
- OCR final-quality fail-closed regression;
- OCR parser evidence regression;
- P1-009 task evidence sufficiency regression;
- universal source-evidence contract regression;
- five-dimension curriculum regression;
- five-dimension grading regression;
- image-only PDF fallback regression;
- mixed native/scanned PDF selective OCR regression after regenerating its accepted fixture;
- mixed-PDF fail-closed regression;
- production build;
- evidence upload;
- final production build;
- tested implementation commit and one-shot cleanup.

The earlier run `35144181559` stopped after all new edge-case gates and earlier OCR regressions had passed because the workflow invoked the already-accepted mixed-PDF regression without regenerating `/tmp/eve-mixed-pdf-ocr/fixture-manifest.json`. The corrected workflow added the existing deterministic mixed-PDF fixture generator plus its pinned PyMuPDF dependency. No application or acceptance rule was weakened.

## Curriculum state after acceptance

- total cases: **20**
- `CONTRACT_READY`: **17**
- `PHYSICAL_FIXTURE_REQUIRED`: **3**
- autonomous eligible: **0**

The three remaining physical curriculum cases are:

- `CURR-SEMANTIC-LONG-DOCUMENT`
- `CURR-PRODUCT-SOURCE-TO-DASHBOARD`
- `CURR-DELIVERABLE-FINAL-LINEAGE`

## Boundaries

This acceptance does not merge or deploy PR #31.

It also does not rebuild/release the currently running OCR services. Feature-branch acceptance and production activation remain separate.

Product Truth and Deliverable Truth remain `NOT_TESTED` for these narrow edge cases unless explicitly targeted by their curriculum definitions.

Pfizer / Company 1 was not rerun. Hermes remains the sole Academy scheduler authority. No new case became autonomous. No Codex was used.
