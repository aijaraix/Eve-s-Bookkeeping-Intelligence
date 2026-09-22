# EVE P2 — Bulk Mixed-Client Isolation Five-Dimension Acceptance

Date: 2026-09-16

## Scope

Curriculum case: `CURR-ISOLATION-BULK-MIXED-CLIENT`

This acceptance proves that evidence for different customers remains bound to the correct client/workspace/engagement tuple even when source presentation is intentionally collision-prone. It does not authorize autonomous Academy scheduling, merge PR #31, or activate feature-branch code in production.

## Accepted implementation

- Acceptance run: `35121630986`
- Accepted implementation checkpoint: `ddc059f578ceb928f89f8090fd2111d2d6c9880b`
- Implementation message: `Close bulk mixed-client isolation curriculum`
- Evidence artifact: `eve-bulk-client-isolation-five-dimension-acceptance`
- Artifact ID: `10457841297`
- Artifact size: `357044` bytes
- Artifact digest: `sha256:e6b78855a2693b250a87153c7a05722a0da1a4f7ab2efebf6c62c990157c5bdb`

## Physical collision-prone client fixtures

Two synthetic customer scopes were generated. Both deliberately used:

- the same original filenames: `general-ledger.csv` and `expense-support.pdf`;
- the same account label: `Office Supplies`;
- the same reporting period: `FY 2026`;
- the same accounting value: `USD 84.20`.

The client identity was the only authoritative scope discriminator.

### Alpha Academy LLC

- client: `client-alpha`
- workspace: `ws-alpha-bulk`
- engagement: `eng-alpha-bulk`
- `general-ledger.csv`
  - bytes: `90`
  - SHA-256: `1472751d87fb5e73b595f208cac90009d871dc88fc7d5589b692ea79682a9cc1`
  - exact native CSV amount coordinate: row `2`, column `4`, column `Amount`
- `expense-support.pdf`
  - bytes: `1341`
  - SHA-256: `72ce659ac8865d26caab6d365815c29dab26aeefdb55780dcf258b4810d0eb1e`
  - native-text PDF coordinate: page `1`

### Beta Academy LLC

- client: `client-beta`
- workspace: `ws-beta-bulk`
- engagement: `eng-beta-bulk`
- `general-ledger.csv`
  - bytes: `89`
  - SHA-256: `782ea5d622dc311d86c58d054afae7469bfbb2d118704d20a1247732d7e21e4f`
  - exact native CSV amount coordinate: row `2`, column `4`, column `Amount`
- `expense-support.pdf`
  - bytes: `1338`
  - SHA-256: `714cf4a76f30a61597c146841c9908073f1ac63604f5d35a3b169c9b0fa1e0f4`
  - native-text PDF coordinate: page `1`

Marker: `CLIENT_ISOLATION_PHYSICAL_FIXTURES=PASS`

## Clean client-isolation result

The clean batch contained 18 client-scoped bindings across two customer scopes:

- 4 documents;
- 4 provenance records;
- 4 accounting facts;
- 2 findings;
- 2 PBC clarification records;
- 2 rendered values.

Result:

- status: `VERIFIED_CLIENT_ISOLATION`
- promotion state: `READY_FOR_AUTHORIZED_REVIEW`
- decision: `PRESERVE_CLIENT_SCOPED_EVIDENCE`
- scope count: `2`
- binding count: `18`
- invalid bindings: `0`
- cross-client leaks: `0`
- canonical batch value: `null`

For each client independently the review retained:

- 2 documents;
- 2 provenance records;
- 2 facts;
- 1 finding;
- 1 clarification;
- 1 rendered value.

The engine explicitly recorded the deliberately shared filenames, value, label, and period without using any of them as a client identity key.

Marker: `P2_BULK_CLIENT_ISOLATION_SOURCE_TRUTH=PASS`

## Adversarial cross-client reference test

Three different Beta-side references were deliberately cross-wired to Alpha evidence:

1. Beta PDF accounting fact → Alpha PDF provenance;
2. Beta PBC clarification → Alpha PDF document;
3. Beta rendered accounting value → Alpha ledger fact.

The result failed closed:

- status: `BLOCKED_CLIENT_IDENTITY_MISMATCH`
- promotion state: `BLOCKED_CLIENT_ISOLATION`
- decision: `REQUEST_CLIENT_SCOPE_REPAIR`
- cross-client leak count: `3`

Recorded issues included:

- `CROSS_CLIENT_PROVENANCE_REFERENCE:prov-alpha-pdf-72ce659ac886`
- `FACT_SHA_DOES_NOT_MATCH_PROVENANCE_SHA`
- `CROSS_CLIENT_DOCUMENT_REFERENCE:doc-alpha-support`
- `CROSS_CLIENT_FACT_REFERENCE:fact-alpha-ledger-84-20`

No cross-client reference was treated as corroboration or accounting support.

## Deliverable Truth

Eve's real `DeliverableArtifactService` generated independent PDF, JSON, XLSX and CSV packages for each client. The physical readback required every package to contain only its own client source SHA/provenance identities and to exclude the other client identity and source hashes.

### Alpha package hashes

- PDF: `a7b6c80c0ada78d2c9f42ff1e2b4f11319deb72ae4851b2d2a2f5490f982199f`
- JSON: `50579a0151bbfa0b5dc22e8ed49dd377bd4306419566dc6518939ebd610f77f2`
- XLSX: `0b30ab4ca491ea509987cf076268686f3da17bad189cf00d5cdf31b37d05c2d8`
- CSV: `2cac300689a4ea0f18b1c37dbfbf411d5f5018e1f0e233f64c8faac142fa47d4`

### Beta package hashes

- PDF: `72ebec824cdf6a19b6918610ce7ab807f94ede7311fd4c4007894a4aee50ed0b`
- JSON: `ced030ae8cdff16b9df7851ec813a5653235e07c21564e533718a5496d1eebf3`
- XLSX: `6b346fd5e7192fef9853c5ea6d3213bdf2326aa68ffd895a65b0b7fa7e93346a`
- CSV: `1c5947d0c2d6ecc241a26f3ac7f6f239649f57066857f9db33f7717851560522`

The JSON package contract was tested as physically implemented: engagement/client identity plus scoped facts and source lineage. `workspaceId` is not currently serialized as a top-level JSON deliverable field; workspace identity remains enforced in the source/control layer. The acceptance did not add a fake field merely to satisfy a test.

Marker: `P2_BULK_CLIENT_ISOLATION_DELIVERABLE_TRUTH=PASS`

## Product Truth

The feature branch was built and exercised through real headless Chromium.

The browser first rendered the adversarial control review and visibly retained:

- `BLOCKED_CLIENT_IDENTITY_MISMATCH`;
- `BLOCKED_CLIENT_ISOLATION`;
- `REQUEST_CLIENT_SCOPE_REPAIR`;
- all three cross-client reference classes;
- `NOT AGGREGATED` for the canonical batch value.

The same built Eve UI was then loaded independently for Alpha and Beta. Each customer view rendered its own verified isolation state, workspace/engagement/client identity, `USD 84.20`, source SHAs, and provenance IDs. The browser assertions required that no opposing client name, workspace, source SHA or provenance ID appear in the other customer's rendered isolation panel.

Marker: `P2_BULK_CLIENT_ISOLATION_PRODUCT_TRUTH_BROWSER=PASS`

## Five-dimension result

Minerva consumed the source, browser and artifact evidence produced by the same accepted run.

- Source Coverage: `PASS`
- Semantic Understanding: `PASS`
- Accounting Accuracy: `PASS`
- Product Truth: `PASS`
- Deliverable Truth: `PASS`
- passed dimensions: `5`
- NOT_TESTED dimensions: `0`
- fully tested: `true`
- all required dimensions passed: `true`
- overall: `FIVE_DIMENSION_PASS`

Notable examiner evidence:

- Source Coverage: `scopes=2; bindings=18; invalid=0`
- Tamper proof: `status=BLOCKED_CLIENT_IDENTITY_MISMATCH; leaks=3`
- Semantic collision proof: shared filenames `expense-support.pdf,general-ledger.csv`, shared value `84.2`, shared label `Office Supplies`, shared period `FY 2026`
- Accounting proof: `canonicalBatchValue=null; rendered=client-alpha:1,client-beta:1`
- Product proof: control blocked, Alpha verified, Beta verified, `leaksBlocked=3`

Marker: `P2_BULK_CLIENT_ISOLATION_FIVE_DIMENSION_PASS=PASS`

## Acceptance defect found and corrected

Initial run `35121488546` correctly passed the physical source/isolation engine but stopped at Deliverable Truth because the test expected a top-level `workspaceId` in Eve's JSON artifact. The actual persisted JSON deliverable contract contains `engagementId`, `clientName`, scoped facts and full source lineage, but not top-level `workspaceId`.

The test was corrected to the physical contract rather than modifying the product schema for the test. The final accepted run then passed Deliverable Truth, existing isolation/auth regressions, both production builds, real-browser Product Truth, five-dimension composition, artifact upload, and self-cleaning commit.

## Curriculum state

`CURR-ISOLATION-BULK-MIXED-CLIENT` is now `CONTRACT_READY` and targets all five dimensions.

Catalog counts after this acceptance:

- total cases: `20`
- CONTRACT_READY: `12`
- PHYSICAL_FIXTURE_REQUIRED: `8`
- autonomous eligible: `0`

The case remains `autonomousEligible: false`.

## Boundaries preserved

- no production deployment;
- no PR #31 merge/release authorization;
- no Pfizer / Company 1 rerun;
- no new Academy scheduler;
- Hermes remains the sole scheduler authority;
- no Codex used;
- Minerva result is internal technical grading only, not a CPA/audit/statutory professional opinion.
