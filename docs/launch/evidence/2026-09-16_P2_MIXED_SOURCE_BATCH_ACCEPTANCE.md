# P2 Mixed-Source Batch Five-Dimension Acceptance — 2026-09-16

## Scope

This record accepts the feature-branch candidate for Academy case `CURR-MIXED-SOURCE-BATCH`.

This is **not** production activation, merge authorization, professional sign-off, an audit opinion, or authorization to add the case to autonomous scheduling.

Repository: `aijaraix/Eve-s-Bookkeeping-Intelligence`  
Branch: `feature/universal-evidence-ocr-foundation`  
Accepted implementation checkpoint: `350c59643dbdb8d60c7d1b77a8965984fe5eaedf`  
Acceptance workflow run: `35086569281`

## Objective

Prove that one mixed-source batch containing spreadsheet, native-text PDF, receipt image, and CSV evidence:

1. preserves the correct coordinate family for each physical source;
2. retains distinct document SHA, source-artifact and provenance identities;
3. does not infer source identity or corroboration from similar monetary values;
4. does not manufacture an aggregate/canonical batch amount;
5. fails closed when one source coordinate is rebound to another document's physical identity;
6. preserves the batch decision and all material source references through the actual Eve UI and generated PDF/JSON/CSV/XLSX artifacts.

## Physical batch fixtures

The batch deliberately uses four similar but different values so value coincidence cannot establish identity:

| Source family | Physical value | Physical locator | SHA-256 |
|---|---:|---|---|
| IMAGE receipt | USD 53.23 | `fixture-total-glyph-region`, page 1 | `bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436` |
| SPREADSHEET | USD 53.24 | `Expense Register!B2` | `f2d9e16abe186bf4402259f870e24f8719044f4a1e98ba6cbdffff25732a673f` |
| PDF | USD 53.25 | native-text PDF page 1 | `14136624adb96c9ec62c4ec4245633707c1542f2164549fda7f97877f943a429` |
| CSV | USD 53.26 | row 2, column 2, `Amount` | `0849870474ac3903ee5bcc8bd977da9d4f53f059f0bd4ee0d5ddd6b8dc02059d` |

The exact accepted receipt bytes were regenerated before the batch test and retained their previously accepted OCR-region lineage.

Fixture markers:

- `MIXED_BATCH_RECEIPT_EXACT_SOURCE=PASS`
- `MIXED_SOURCE_BATCH_PHYSICAL_FIXTURES=PASS`

## Source / semantic / accounting truth

A valid four-source batch produced:

- status: `VERIFIED_SOURCE_ISOLATION`
- promotion state: `READY_FOR_AUTHORIZED_REVIEW`
- decision: `PRESERVE_SOURCE_SCOPED_FACTS`
- source families: 4
- unique source SHAs: 4
- unique documents: 4
- unique provenance identities: 4
- canonical batch value: `null`

The batch deliberately does **not** sum, average, select, or otherwise promote the four similar values into one accounting amount.

### Adversarial source-identity substitution

The CSV fact retained its own top-level document/fact identity, but its coordinate-level SHA and source-artifact identity were deliberately replaced with the PDF source identity.

Eve detected the cross-document substitution and returned:

- status: `BLOCKED_SOURCE_IDENTITY_MISMATCH`
- promotion state: `BLOCKED_SOURCE_IDENTITY_MISMATCH`
- decision: `REQUEST_BATCH_SOURCE_RECONCILIATION`
- issue includes `SOURCE_SHA_DOES_NOT_MATCH_COORDINATE_SHA`
- issue includes `SOURCE_ARTIFACT_DOES_NOT_MATCH_COORDINATE_ARTIFACT`
- canonical batch value remains `null`

A separate missing-PDF case also returned `BLOCKED_INCOMPLETE_SOURCE_FAMILIES` rather than silently treating a three-source batch as complete.

Marker: `P2_MIXED_SOURCE_BATCH_SOURCE_TRUTH=PASS`

## Product Truth — PASS

The feature branch was built with the production build command and served through Vite preview. A real Chromium process exercised the actual Eve engagement-evidence UI using the current `/api/cpa/engagements/universal` and `/api/cpa/engagements/:id` hydration contract.

The rendered product physically showed:

- all four source families: SPREADSHEET, PDF, IMAGE, CSV;
- the four deliberately similar values: 53.23 / 53.24 / 53.25 / 53.26;
- spreadsheet locator `Expense Register!B2`;
- PDF page 1;
- receipt OCR region `fixture-total-glyph-region`;
- CSV row 2 / column 2;
- each source SHA-256;
- `BLOCKED_SOURCE_IDENTITY_MISMATCH`;
- `REQUEST_BATCH_SOURCE_RECONCILIATION`;
- `NOT AGGREGATED` for the canonical batch value;
- the source-SHA mismatch finding.

Marker: `P2_MIXED_SOURCE_BATCH_PRODUCT_TRUTH_BROWSER=PASS`

## Deliverable Truth — PASS

The real `DeliverableArtifactService` generated and physically read back:

- PDF
- JSON
- CSV lead schedules
- XLSX workbook

The artifacts preserve all four source families and their reverse lineage, as well as the blocked source-identity state and reconciliation action. The PDF hash was checked against the report manifest.

Marker: `P2_MIXED_SOURCE_BATCH_DELIVERABLE_TRUTH=PASS`

## Five-dimension result

The final Minerva composition consumed the machine-readable source, browser Product Truth, and Deliverable Truth receipts generated earlier in the same accepted run.

For `CURR-MIXED-SOURCE-BATCH`:

- Source Coverage: **PASS**
- Semantic Understanding: **PASS**
- Accounting Accuracy: **PASS**
- Product Truth: **PASS**
- Deliverable Truth: **PASS**
- passed dimensions: 5
- NOT_TESTED dimensions: 0
- `fullyTested=true`
- `allRequiredDimensionsPassed=true`
- overall: `FIVE_DIMENSION_PASS`

Marker: `P2_MIXED_SOURCE_BATCH_FIVE_DIMENSION_PASS=PASS`

The curriculum case is now `CONTRACT_READY` and remains `autonomousEligible: false`.

Catalog counts after acceptance:

- total cases: 20
- contract-ready: 10
- physical-fixture-required: 10
- autonomous eligible: 0

## Acceptance artifact

Workflow artifact:

- name: `eve-mixed-source-batch-five-dimension-acceptance`
- artifact ID: `10442950431`
- size: `444328` bytes
- digest: `sha256:da3b3ed668689049228af84809c47c1d5cd58e7afc4ad1785791cf112a3619e2`
- accepted run: `35086569281`

The uploaded bundle contains 17 evidence files, including the physical source fixtures, source-truth receipt, Product Truth screenshot/receipt, Deliverable Truth receipt, and five-dimension result.

## Regression / build protection

The accepted run also passed the previously accepted:

- mixed spreadsheet + receipt case;
- spreadsheet source-to-pixel lineage;
- trial-balance source/accounting and deliverable tests;
- LEDGER trial-balance runtime and continuation reconstruction;
- receipt Deliverable Truth;
- bank-statement completeness/sufficiency and Deliverable Truth;
- invoice/AP interpretation and Deliverable Truth;
- P1-009 task sufficiency;
- P1-010 clarification/PBC;
- Academy curriculum and five-dimension grading;
- OCR evidence/orientation/fail-closed quality/PDF fallback;
- universal source evidence;
- Academy specialist retry;
- Package B2 real-agent execution;
- presentation adapters and Academy dashboard truth.

The production build passed before Chromium acceptance and passed again after evidence upload.

## Failure progression retained as evidence

Earlier runs failed closed and did not commit implementation:

1. `35085992088` — the new engine incorrectly treated `validateSourceCoordinate(...)` as an iterable rather than consuming its `{ valid, issues }` contract. Corrected without removing validation.
2. `35086301122` — backend/export gates were green, but the new Chromium test used stale `/api/practice/...` interception endpoints. The test harness was corrected to Eve's current `/api/cpa/engagements/...` hydration contract. Product behavior was not weakened.
3. `35086569281` — final accepted run, all gates green.

## Boundaries preserved

- No production deploy or release occurred.
- PR #31 remains a feature-branch acceptance vehicle; merge/release is separately owner-authorized.
- Pfizer / Company 1 was not rerun or modified.
- Hermes remains the sole Academy scheduler authority.
- No new Academy case was made autonomous.
- No Codex credits were used.
