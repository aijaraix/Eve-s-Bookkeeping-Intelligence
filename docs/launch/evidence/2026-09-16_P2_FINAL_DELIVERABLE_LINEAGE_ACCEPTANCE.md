# P2 Final Deliverable Lineage Acceptance — 2026-09-16

## Scope

This evidence closes the curated Academy case `CURR-DELIVERABLE-FINAL-LINEAGE` on `feature/universal-evidence-ocr-foundation`.

The acceptance is intentionally bounded to the case's three target dimensions:

- Source Coverage
- Accounting Accuracy
- Deliverable Truth

Semantic Understanding and Product Truth are explicitly `NOT_TESTED` here because they are owned by prior accepted curriculum cases. This is internal technical acceptance only; it is not a CPA opinion, audit opinion, statutory certification, or professional sign-off.

No production deployment, PR merge, Company 1 / Pfizer rerun, scheduler change, or Codex execution occurred.

## Accepted implementation checkpoint

- commit: `03513a3722c1c2e238a15ea185cd8c31ae00eebf`
- message: `Close final deliverable lineage curriculum`
- successful acceptance workflow: `35156567966`

The one-shot workflow and patch script self-removed after all gates passed.

## Evidence artifact

- artifact: `eve-final-deliverable-lineage-acceptance`
- artifact ID: `10471390900`
- ZIP digest: `sha256:7aaecba506d79471b101b2851d09cde7123e2d7ed0f575c0e305a540dc00398f`

## Physical source parents

The final deliverable fixture reuses two independently accepted physical source families that both carry the numeric value `53.23`, preventing value matching from substituting for identity matching.

### Spreadsheet parent

- fact ID: `fact-dashboard-spreadsheet-revenue`
- physical source: `revenue-register.xlsx`
- source SHA-256: `f9cdbdc90b205fcc7639a53f1445b59ee85405ead68bd9989f8656df39a2dd33`
- exact coordinate: `Revenue Register!B2`
- provenance ID: `prov-f9cdbdc90b205fcc-revenue-register-b2`
- value: USD `53.23`

### Receipt parent

- fact ID: `fact-dashboard-receipt-expense`
- physical source: `receipt.png`
- source SHA-256: `bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436`
- exact coordinate / region: `fixture-total-glyph-region`
- provenance ID: `prov-receipt-bdd93a72-total-53-23`
- source literal: `TOTAL $53.23`
- value: USD `53.23`

## Derived material statement

The final package contains an explicitly derived material fact:

- fact ID: `fact-final-derived-net-zero`
- derivation ID: `DER-FINAL-REVENUE-MINUS-EXPENSE`
- formula: `revenue - operating_expenses`
- operation: `SUBTRACT`
- operands:
  - `fact-dashboard-spreadsheet-revenue` = `53.23`
  - `fact-dashboard-receipt-expense` = `53.23`
- recomputed derived value: `0.00`

The final-lineage validator resolves every operand by fact ID, recursively validates each direct parent's source identity, checks derivation cycles/missing operands, compares recorded operand values to the resolved parent values, and recomputes the derived result.

## Fail-closed adversarial proof

Two negative cases were required before a valid package could be accepted.

1. **Cross-source SHA substitution**
   - the spreadsheet fact was deliberately assigned the receipt SHA while retaining the spreadsheet coordinate;
   - validation detected `SOURCE_SHA_DOES_NOT_MATCH_COORDINATE_SHA`;
   - `compileAndRegisterDeliverable(... requireFinalLineage=true)` threw `FINAL_DELIVERABLE_LINEAGE_INVALID`;
   - `REP-FINAL-LINEAGE-BAD` produced no JSON artifact, proving rejection occurred before artifact write.

2. **Missing derivation operand**
   - a derived fact was pointed at a nonexistent operand fact ID;
   - validation detected `OPERAND_FACT_MISSING` and failed closed.

Marker: `FINAL_DELIVERABLE_LINEAGE_VALIDATOR=PASS`

## Lineage-bound package hash

The prior canonical fact hash only bound metric/value pairs. This acceptance strengthens that contract.

`computeFinalDeliverableLineageHash()` now binds material final-package identity to:

- fact ID
- canonical metric
- numeric value
- reporting period
- source SHA
- source artifact ID
- provenance ID(s)
- source coordinate(s)
- derivation ID
- derivation formula
- derivation operation
- operand fact IDs
- operand values

Changing provenance while preserving the same accounting value changes the package hash.

Accepted final package lineage hash:

`c51dad8365db2dbb38b6a58a1b1e8511749b6e0095260db4f0f44e5054113986`

The manifest `contentHash` equals this lineage-bound canonical fact hash.

## Physical four-format readback

Eve's real `DeliverableArtifactService` generated the package. Acceptance physically reopened and inspected every final format rather than trusting the in-memory report record.

### PDF

- SHA-256: `6283196f119e2a9540ec57a602c83a93c1d7c1b734a7c0b6fd48fd89bba1d4a0`
- bytes: `4717`
- valid `%PDF-` magic
- manifest hash matched physical bytes
- parsed text physically contained:
  - derived fact ID
  - derivation ID and formula
  - both operand fact IDs
  - spreadsheet SHA and `Revenue Register!B2`
  - receipt SHA, provenance ID, and `fixture-total-glyph-region`

### JSON

- SHA-256: `daa3b16b0fdbe324059f988fcaae29220dd10fd6018740c5e03a532d31c9fe07`
- parsed successfully
- `finalLineageRequired=true`
- `finalLineageValidation.valid=true`
- retained the complete direct-source and derived-fact lineage objects
- canonical fact hash matched the report record and manifest content hash

### XLSX

- SHA-256: `ca9ac129cc72f103d1badf0a1ff385be2cc61ea88c11c8663cbc2cef8d14eace`
- parsed successfully
- 5 worksheets
- Lead Schedules physically retained source identities, exact source coordinates, derivation ID/formula/operation, operand fact IDs, and operand values

### CSV

- SHA-256: `478afcdf1da3940ae9813b8d4cbf6a2c91e14bf231ab6fd988f497f3f37df67c`
- physical readback contained 4 nonblank lines
- retained the same direct-source and derivation lineage fields as the final package

Artifact manifest verification:

- PDF: PASS
- XLSX: PASS
- JSON: PASS
- CSV: PASS
- `allValid=true`

Marker: `P2_FINAL_DELIVERABLE_LINEAGE_TRUTH=PASS`

## Regression coverage

The successful workflow also passed the previously accepted paths most likely to regress from the final-lineage hardening:

- receipt Deliverable Truth
- universal source-evidence contract
- spreadsheet source-to-pixel lineage
- source-to-dashboard presentation integrity
- five-dimension curriculum catalog
- five-dimension grading
- task evidence sufficiency
- production build before Minerva composition
- production build again after all acceptance gates

## Targeted Minerva result

`CURR-DELIVERABLE-FINAL-LINEAGE` produced:

- Source Coverage: **PASS — 100**
- Semantic Understanding: **NOT_TESTED**
- Accounting Accuracy: **PASS — 100**
- Product Truth: **NOT_TESTED**
- Deliverable Truth: **PASS — 100**
- tested dimensions: `3`
- passed tested dimensions: `3`
- failed dimensions: `0`
- tested-only average: `100`

The overall five-dimension status remains `INCOMPLETE_DIMENSION_COVERAGE` by design because this case targets only three dimensions. `NOT_TESTED` dimensions do not inflate the score.

Marker: `P2_FINAL_DELIVERABLE_LINEAGE_TARGETED_DIMENSIONS=PASS`

## Curriculum state after acceptance

The curated five-dimension curriculum now contains:

- total cases: `20`
- `CONTRACT_READY`: `20`
- `PHYSICAL_FIXTURE_REQUIRED`: `0`
- autonomous eligible: `0`

`CURR-DELIVERABLE-FINAL-LINEAGE` remains `autonomousEligible: false`; curriculum acceptance does not authorize scheduler promotion or production release.

## Release boundary

This acceptance is feature-branch evidence only.

- PR #31 must remain draft and unmerged until separate owner authorization.
- active production application code remains on `main`.
- no production service or OCR image was rebuilt or activated by this acceptance.
- Hermes remains the sole Academy scheduler authority.
- no autonomous scheduling eligibility was granted.
