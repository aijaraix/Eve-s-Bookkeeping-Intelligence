# P2 Duplicate / Near-Duplicate Evidence Acceptance — 2026-09-16

## Scope

Academy case: `CURR-EVIDENCE-DUPLICATE-NEAR-DUPLICATE`

This acceptance proves that Eve does not treat repeated or cosmetically modified copies of the same evidentiary item as independent corroboration, while materially changed same-identity evidence remains distinct, traceable and fail-closed.

This is an Academy technical acceptance only. It is not a CPA opinion, assurance opinion, statutory certification, professional sign-off, production release, PR merge authorization, or autonomous scheduling authorization.

## Accepted implementation

Final accepted feature checkpoint:

- commit: `1ade49aba815297ec0d92723dd1c8c0b1c9d82ce`
- message: `Harden duplicate evidence five-dimension proof`

The preceding implementation commit was:

- `79eb8c63d9496a752447ad5eed52acd158e4fc68`
- message: `Close duplicate near-duplicate evidence curriculum`

The later hardening makes the final Minerva Source Coverage evidence consume the dedicated tampered-source review directly, rather than relying only on the lower-level engine assertion.

## Successful acceptance run

Hardened acceptance run:

- GitHub Actions run: `35088863820`
- job: `104770114519`
- result: `SUCCESS`

The run physically regenerated the source families, re-executed duplicate classification, re-read all deliverables, rebuilt the application, verified Product Truth in real Chromium, composed the five-dimension result from the resulting evidence receipts, uploaded the evidence package, rebuilt again, and self-removed temporary one-shot machinery before committing the accepted feature changes.

An earlier run, `35088437946`, intentionally did **not** commit an implementation after its first attempt failed. That failure exposed a test-fixture parser bug: the PDF `TOTAL USD` regex could match the suffix of `SUBTOTAL USD`. The parser was tightened to exact line-label extraction and the full acceptance was rerun. The accounting standard itself was not weakened.

## Physical source families

Two separate document identities were exercised: one native-text PDF receipt identity and one image receipt identity. Each identity had four observations:

1. base source;
2. byte-identical exact copy;
3. cosmetic-only near-duplicate with a different physical SHA but unchanged identity/material content;
4. materially changed near-duplicate retaining the same document identity but with changed, internally consistent accounting values.

### Image family

Base / exact copy:

- SHA-256: `bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436`
- identity: receipt `R-2026-0916`, issuer `EVE TEST MARKET`, date `09/16/2026`, USD
- subtotal: `49.75`
- sales tax: `3.48`
- total: `53.23`
- payment amount: `53.23`
- image dimensions: `900x1000`
- accepted source total region: normalized `x=0.06666666666666667`, `y=0.559`, `w=0.3211111111111111`, `h=0.037`
- source literal: `TOTAL $53.23`

Cosmetic-only image near-duplicate:

- SHA-256: `bdef1871b9ed2c7bec519c5ce2c8e370a1739dc1aecc3b625da1b8088a5b3e38`
- identity visual hash remained equal to the base
- material-region visual hash remained equal to the base
- material values remained `49.75 + 3.48 = 53.23`
- classification: `NEAR_DUPLICATE_EQUIVALENT`
- corroboration weight: `0`

Materially changed image near-duplicate:

- SHA-256: `fe4de7aa817b00269cc0d35b76107adbfdc04fcd87c7b7e8a2a0858606b76814`
- identity visual hash remained equal to the base
- material-region visual hash changed
- subtotal: `59.10`
- sales tax: `4.13`
- total: `63.23`
- payment amount: `63.23`
- arithmetic: `PASS`
- classification: `NEAR_DUPLICATE_MATERIAL_CONFLICT`
- corroboration weight: `0`

### Native-text PDF family

Base / exact copy:

- SHA-256: `b86091ff15ceaac5789d4fc286cbe55fd660bcc4303c569e1df1578112578c7f`
- bytes: `1742`
- identity: receipt `R-PDF-2026-0916`, issuer `EVE PDF TEST MARKET`, date `09/16/2026`, USD
- subtotal: `49.75`
- sales tax: `3.48`
- total: `53.23`
- payment amount: `53.23`

Cosmetic-only PDF near-duplicate:

- SHA-256: `5cc2c7385fc2f743a3815df2ee9d04a087525a0ce53f34cde5089cfc1d05ea56`
- bytes: `1827`
- only presentation text changed (`COPY PRESENTATION NOTE - formatting only`)
- material values remained unchanged
- classification: `NEAR_DUPLICATE_EQUIVALENT`
- corroboration weight: `0`

Materially changed PDF near-duplicate:

- SHA-256: `37057206728a871df63468272a37b7a62483d45cd08ed8e18edf4d48c3e7a70e`
- bytes: `1741`
- same document identity
- subtotal: `59.10`
- sales tax: `4.13`
- total: `63.23`
- payment amount: `63.23`
- arithmetic: `PASS`
- classification: `NEAR_DUPLICATE_MATERIAL_CONFLICT`
- corroboration weight: `0`

## Duplicate-control behavior

### Clean duplicate set

Six observations were supplied: base + exact copy + cosmetic near-duplicate for each of the two document identities.

Physical result:

- status: `VERIFIED_DUPLICATE_CONTROL`
- input observations: `6`
- unique physical source SHAs: `4`
- evidentiary identities: `2`
- independent corroboration count: `2`
- exact duplicates suppressed: `2`
- cosmetic near-duplicates suppressed: `2`
- material conflicts: `0`

This proves that copying a file or cosmetically changing a file does not manufacture independent evidentiary strength.

### Material conflict set

All eight observations were supplied, including the two materially changed same-identity sources.

Physical result:

- status: `BLOCKED_MATERIAL_NEAR_DUPLICATE_CONFLICT`
- promotion state: `BLOCKED_MATERIAL_CONFLICT`
- action: `REQUEST_MATERIAL_SOURCE_RECONCILIATION`
- material conflicts: `2`
- independent corroboration remained `2`
- canonical promoted value: `null` / `NOT PROMOTED`

Both changed sources remained internally arithmetically valid. Therefore this test proves semantic/evidentiary conflict handling rather than merely catching a broken arithmetic document.

### Source-identity tamper case

A controlled adversarial case changed the source-coordinate SHA for the base PDF while leaving the observation-level source SHA unchanged.

Physical result:

- status: `BLOCKED_INVALID_SOURCE_IDENTITY`
- invalid sources: `1`
- exact recorded issue: `doc-pdf-base:SOURCE_SHA_DOES_NOT_MATCH_COORDINATE_SHA`

The hardened five-dimension Source Coverage receipt explicitly contains:

- `status=BLOCKED_INVALID_SOURCE_IDENTITY`
- `invalidSources=1`
- `issues=doc-pdf-base:SOURCE_SHA_DOES_NOT_MATCH_COORDINATE_SHA`

This proves duplicate classification is not allowed to rely on filename, amount, or semantic similarity while ignoring physical source identity.

Marker: `P2_DUPLICATE_EVIDENCE_SOURCE_TRUTH=PASS`

## Product Truth — PASS

The built feature application was served through Vite preview and exercised in real headless Chromium.

Browser version recorded by the acceptance artifact:

- `Chrome/152.0.7977.82`

The actual Eve engagement evidence UI physically rendered:

- `BLOCKED_MATERIAL_NEAR_DUPLICATE_CONFLICT`;
- `REQUEST_MATERIAL_SOURCE_RECONCILIATION`;
- exact duplicates suppressed: `2`;
- cosmetic near-duplicates suppressed: `2`;
- material conflicts: `2`;
- independent corroboration: `2`;
- canonical promoted value: `NOT PROMOTED`;
- `EXACT_DUPLICATE`;
- `NEAR_DUPLICATE_EQUIVALENT`;
- `NEAR_DUPLICATE_MATERIAL_CONFLICT`;
- both PDF and IMAGE source families;
- both `USD 53.23` and `USD 63.23` observations;
- zero corroboration weight on duplicate/conflicting copies;
- every tested source SHA.

Marker: `P2_DUPLICATE_EVIDENCE_PRODUCT_TRUTH_BROWSER=PASS`

## Deliverable Truth — PASS

The real `DeliverableArtifactService` generated and physically read back all four supported draft formats.

Recorded artifact hashes:

- PDF: `4ce99bde30cb040055d3686a24447204bde2daaa0cd5929d7f3d8281b610425d`
- JSON: `317d759cc471d5d63e3fc39553db06d5a89ea3e2d23b04385e953396ce9386fa`
- XLSX: `483981c4dcc374a075c63aee833a398cead108a5d1144fad7794e41def23a9e0`
- CSV: `590eaa6f54eac521a489f6a8e3b3c104066ed6ca24d20eb874ada4c2070e61cd`

The PDF, JSON, CSV and XLSX preserve duplicate classifications, physical source lineage, identity/material fingerprints, representative source, corroboration weight, arithmetic state, source coordinates/provenance, suppression counts, material-conflict counts and the fail-closed reconciliation action.

Marker: `P2_DUPLICATE_EVIDENCE_DELIVERABLE_TRUTH=PASS`

## Five-Dimension result — PASS

Hardened final composition:

- Source Coverage: `PASS`
- Semantic Understanding: `PASS`
- Accounting Accuracy: `PASS`
- Product Truth: `PASS`
- Deliverable Truth: `PASS`
- passed dimensions: `5`
- failed dimensions: `0`
- NOT_TESTED dimensions: `0`
- `fullyTested=true`
- `allRequiredDimensionsPassed=true`
- tested-only average: `100`
- overall: `FIVE_DIMENSION_PASS`

Marker: `P2_DUPLICATE_EVIDENCE_FIVE_DIMENSION_PASS=PASS`

## Hardened evidence artifact

- artifact name: `eve-duplicate-evidence-five-dimension-acceptance-hardened`
- artifact ID: `10443457153`
- size: `513908` bytes
- ZIP digest: `sha256:7d2c3fce26fe2de2110a68ce15d993464fd48023b9ea8fe55aefe5f14bac0107`
- created: `2026-09-16T11:10:49Z`
- expiry: `2026-09-23T11:10:47Z`

The evidence package includes the physical source variants, source-truth receipt, Product Truth screenshot/receipt, Deliverable Truth receipt, final five-dimension result and generated draft artifacts.

## Academy catalog state

After this acceptance:

- total cases: `20`
- `CONTRACT_READY`: `11`
- `PHYSICAL_FIXTURE_REQUIRED`: `9`
- autonomous eligible: `0`

`CURR-EVIDENCE-DUPLICATE-NEAR-DUPLICATE` remains `autonomousEligible: false`.

## Boundaries preserved

- PR #31 remains a draft integration PR; this acceptance is not merge/release authorization.
- Production application code remains on `main`; this work did not deploy the feature branch.
- No Company 1 / Pfizer baseline was rerun.
- No second Academy scheduler was created; Hermes remains the sole scheduler authority.
- No duplicate/cosmetic copy is promoted as additional corroboration.
- A material same-identity conflict is not silently deduplicated away.
- Source SHA/artifact/coordinate identity mismatches fail closed.
- Minerva result is internal technical evaluation only, not professional accounting or assurance sign-off.
- No Codex was used for this implementation or acceptance.
