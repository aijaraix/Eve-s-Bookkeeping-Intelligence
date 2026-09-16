# P2 degraded OCR curriculum fixtures — acceptance record

Date: 2026-09-16
Branch: `feature/universal-evidence-ocr-foundation`
Status: ACCEPTED FIXTURE FOUNDATION / PHYSICAL OUTCOMES RECORDED / NOT AUTONOMOUS

## Scope

This record covers deterministic Academy fixtures for degraded direct-image OCR conditions. It does not claim that every degraded condition is successfully readable. The purpose is to make failure and success states reproducible and evidence-backed.

Accepted fixture implementation checkpoint:

`5066706e41dad96390665e92de9bd9e626e10a22`

CI run:

`35055472690` — PASS through deterministic fixture hash reproduction, OCR/Academy/P1 regressions and full production build.

## Deterministic fixtures

Generated from the synthetic receipt fixture with Pillow 12.3.0:

- low-quality JPEG: `a1f03b9bdda7e8d8eae67d924a62de679a8d5fa6e6d0e94967b2cfd7d417de9c`
- 90-degree rotation: `9f2496573071e396c8452534bf5afe67ddf0d676a0907919820733418609a698`
- 6-degree skew: `ec635a9f1cbb49d89afb0308339e50f591ed2a23d29d44fd8e754279eec4ce0a`
- glare/occlusion over subtotal-tax-total: `49fac9e0a910f8b8b3f8cd130569cc8732bd15783ddb6611514edb4cd667072a`
- crop immediately before subtotal/tax/total: `017e27b1bdcf1d5045512fe82a2f577cb44e841bdf992405061c55781fa8eaed`

Marker:

`DEGRADED_OCR_FIXTURE_REPRODUCIBILITY=PASS`

The exact hashes physically generated on the Eve host were reproduced independently in GitHub CI.

## Physical OCR findings on Eve hardware

### Low-quality compressed scan

PaddleOCR:
- 12 regions
- average confidence approximately 0.9946
- material receipt fields and totals remained readable.

docTR:
- 12 regions
- average confidence approximately 0.9423
- material totals remained readable; one punctuation variation appeared in `SALES, TAX`.

Disposition: readable for this fixture; semantic normalization must not erase literal OCR provenance.

### 90-degree rotation

PaddleOCR:
- 12 low-quality/garbled regions
- average confidence approximately 0.6848
- required receipt semantics/totals were not recovered reliably.

docTR:
- 9 largely unusable regions
- average confidence approximately 0.8187
- required receipt semantics/totals were not recovered reliably.

Disposition: FAIL / review required. Current engines do not reliably auto-orient this fixture.

This physical result directly motivated the accepted final OCR quality gate at checkpoint:

`e983ffbe7680a47c30e697618f0e19996a256cff`

A fallback engine being better than the primary is no longer sufficient. If the selected result still fails the final quality floor, Eve fails closed instead of promoting poor OCR as source evidence.

### 6-degree skew

Both PaddleOCR and docTR recovered the material receipt content and totals correctly with high confidence.

Disposition: PASS for the exercised OCR dimensions.

### Material glare/occlusion

Both engines returned the visible receipt content but the obscured subtotal/tax/total lines disappeared.

Disposition: the missing material evidence must remain a source gap. Eve must not infer the hidden totals from surrounding context.

### Material crop

Both engines returned visible receipt lines but no subtotal/tax/total because those source regions were physically absent.

Disposition: the missing material evidence must remain a source gap and task sufficiency must fail closed where those totals are required.

## Safety semantics

- A readable degraded fixture is not evidence that all degraded scans are safe.
- A high OCR confidence score is not equivalent to semantic correctness.
- Missing/obscured material fields are evidence gaps, not zero values and not inferred values.
- Both-poor OCR results fail closed after the final-quality gate.
- Product Truth and Deliverable Truth remain `NOT_TESTED` unless a real browser/export path is exercised for the specific case.
- None of these new curriculum cases is autonomous-eligible yet.

## Regression gates

Run `35055472690` passed:

- degraded fixture generator contract
- exact fixture SHA reproduction
- local OCR routing/final-quality regression
- Academy OCR curriculum regression
- five-dimension grading regression
- P1-009 sufficiency regression
- P1-010 clarification regression
- universal evidence regression
- OCR parser evidence regression
- full production build

## Remaining work

- orientation correction / controlled rotation retry for the 90-degree case is not yet implemented;
- glare/crop cases still need full P1-009 task-sufficiency curriculum executions tied to concrete conclusions;
- real browser and deliverable evidence remains separate.

No Pfizer / Company 1 run was performed. No Academy scheduler was changed. No Codex was used.
