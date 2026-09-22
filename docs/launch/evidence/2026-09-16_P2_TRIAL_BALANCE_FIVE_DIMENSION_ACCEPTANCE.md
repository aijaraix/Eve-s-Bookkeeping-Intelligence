# EVE-P2 — Spreadsheet / General Ledger / Trial Balance Five-Dimension Acceptance

Date: 2026-09-16 UTC

Repository: `aijaraix/Eve-s-Bookkeeping-Intelligence`

Branch: `feature/universal-evidence-ocr-foundation`

Draft PR: #31

Status: **ACCEPTED CANDIDATE ON FEATURE BRANCH — NOT MERGED OR DEPLOYED**

Accepted implementation checkpoint:

`81a84c318b5660d2751f24a7003d2c13cbaa1aca` — `Close spreadsheet trial balance curriculum`

Acceptance run:

`35076405884` — **PASS**

## Purpose

This acceptance establishes a bounded spreadsheet/general-ledger/trial-balance truth contract on top of Eve's previously accepted spreadsheet source-to-pixel lineage.

The new Academy case is:

`CURR-SPREADSHEET-GL-TRIAL-BALANCE`

It proves that Eve can:

- parse a real XLSX trial-balance workbook;
- preserve exact workbook/sheet/cell and formula provenance;
- include hidden ledger rows rather than silently omitting them;
- recompute total debits and credits from source account rows;
- distinguish trial-balance equality from the separate Assets = Liabilities + Equity equation;
- detect stale or inconsistent cached spreadsheet formula values;
- fail closed on an unbalanced underlying ledger even when cached total cells claim balance;
- render the result in the actual built Eve product;
- preserve the result and reverse lineage in Eve's actual PDF/JSON/CSV/XLSX deliverables.

This acceptance does **not** activate the capability inside the production LEDGER specialist. The existing production LEDGER path continues to report `ACCOUNT_LINES_DISCOVERED_TRIAL_BALANCE_NOT_TESTED` when appropriate until a separate controlled integration and release is authorized.

## Physical XLSX fixtures

The acceptance run generated real XLSX bytes through SheetJS.

### Balanced trial balance

- filename: `trial-balance-balanced.xlsx`
- bytes: `9505`
- SHA-256: `463d4e14d5bf81cfadce2f715e97dcb830ac6c0ffb20e5af187385d9a191a841`
- worksheet: `Trial Balance`
- used range: `A1:E8`

Account population:

- `1000` Cash — debit `1000`
- `1100` Accounts Receivable — debit `500`
- `1999` Clearing — debit `100` — **hidden worksheet row**
- `2000` Accounts Payable — credit `400`
- `3000` Equity — credit `1000`
- `4000` Revenue — credit `200`

Formula total cells:

- `C8`: `=SUM(C2:C7)` — cached `1600`
- `D8`: `=SUM(D2:D7)` — cached `1600`
- `E8`: `=C8-D8` — cached `0`

Physical marker:

`TRIAL_BALANCE_PHYSICAL_FIXTURES=PASS`

### Stale-cache adversarial trial balance

- filename: `trial-balance-stale-cache-unbalanced.xlsx`
- bytes: `9525`
- SHA-256: `7ae7a846b837b3966fdde802f6e1879a34bd9a9c810ff36602a77c0e9f82f8e1`

The hidden Clearing debit is changed from `100` to `90`, while the workbook deliberately retains stale cached formula totals:

- cached debit total: `1600`
- cached credit total: `1600`
- cached variance: `0`

The underlying account rows instead recompute to:

- total debits: `1590`
- total credits: `1600`
- variance: `-10`

## Source Coverage — PASS

The accepted `trialBalanceInterpretationEngine` binds the review to the exact source SHA, worksheet, range, row/cell evidence and formula cells.

The hidden `1999 / Clearing` account remains part of the population and retains exact spreadsheet lineage:

- account row: source row `4`
- debit cell: `Trial Balance!C4`
- `hiddenRow=true`

Total/formula lineage is retained at:

- debit total: `Trial Balance!C8`
- credit total: `Trial Balance!D8`
- variance: `Trial Balance!E8`

Every material source observation retains its spreadsheet provenance ID and coordinate.

## Semantic Understanding — PASS

The engine separates account rows from the `TOTALS` formula row rather than double-counting formula totals as ledger accounts.

For the accepted balanced fixture:

- account line count: `6`
- hidden account lines included: `1`
- semantic status: `TRIAL_BALANCE_ROWS_PARSED`
- no ledger row contains simultaneous non-zero debit and credit amounts.

The interpretation deliberately does not promote trial-balance equality into financial-statement completeness, posting authorization, or the distinct balance-sheet identity.

## Accounting Accuracy — PASS

Balanced fixture recomputation:

- debits: `1600`
- credits: `1600`
- variance: `0`
- trial balance status: `BALANCED`
- formula integrity: `MATCH`
- promotion state: `READY_FOR_AUTHORIZED_REVIEW`

Adversarial stale-cache fixture recomputation:

- debits: `1590`
- credits: `1600`
- variance: `-10`
- formula integrity: `STALE_OR_INCONSISTENT`
- trial balance status: `UNBALANCED`
- promotion state: `BLOCKED_UNBALANCED`

A cached formula display is therefore not treated as authoritative when it conflicts with the underlying ledger rows.

Marker:

`P2_TRIAL_BALANCE_SOURCE_ACCOUNTING=PASS`

## Product Truth — PASS

The successful run built the actual feature-branch application and exercised it in real headless Chromium.

The actual Eve evidence view rendered the trial-balance review panel and physically showed:

- `Trial Balance!A1:E8`;
- six account lines;
- one hidden account row included;
- total debits `USD 1600.00`;
- total credits `USD 1600.00`;
- variance `USD 0.00`;
- status `BALANCED`;
- formula integrity `MATCH`;
- promotion state `READY_FOR_AUTHORIZED_REVIEW`;
- formulas and coordinates `C8`, `D8`, `E8`;
- the hidden `1999 / Clearing` row;
- exact debit source `Trial Balance!C4`;
- the exact source SHA-256.

Marker:

`P2_TRIAL_BALANCE_PRODUCT_TRUTH_BROWSER=PASS`

## Deliverable Truth — PASS

The acceptance used Eve's actual `DeliverableArtifactService` and physically read back the generated artifacts.

Reverse lineage and trial-balance review state were verified in:

- PDF
- JSON
- CSV
- XLSX

The artifacts preserve:

- trial-balance status;
- total debits, credits and variance;
- formula integrity and promotion state;
- formula coordinates and formulas;
- cached values;
- hidden ledger row state;
- account-level debit/credit source coordinates;
- source provenance IDs;
- source SHA-256.

The generated workbook includes a `Trial Balance Review` worksheet.

Marker:

`P2_TRIAL_BALANCE_DELIVERABLE_TRUTH=PASS`

## Five-dimension result — PASS

The final Minerva composition required the machine-readable source/accounting, Product Truth and Deliverable Truth evidence receipts from the successful run.

For `CURR-SPREADSHEET-GL-TRIAL-BALANCE`:

- Source Coverage: **PASS**
- Semantic Understanding: **PASS**
- Accounting Accuracy: **PASS**
- Product Truth: **PASS**
- Deliverable Truth: **PASS**
- passed dimensions: `5`
- NOT_TESTED dimensions: `0`
- fully tested: `true`
- all required dimensions passed: `true`
- overall: `FIVE_DIMENSION_PASS`

Marker:

`P2_TRIAL_BALANCE_FIVE_DIMENSION_PASS=PASS`

## Acceptance evidence bundle

GitHub Actions run:

`35076405884`

Artifact:

- name: `eve-trial-balance-five-dimension-acceptance`
- artifact ID: `10438367956`
- size: `305522` bytes
- ZIP digest: `sha256:c830deb62715a272fd7213ed4c2602c72c43e39dfca36e62a06ebb1949371658`

The same successful run also passed regressions for:

- prior spreadsheet source-to-pixel lineage;
- bank-statement completeness and deliverable truth;
- invoice/AP interpretation, classification and deliverable truth;
- receipt deliverable truth;
- P1-009 task evidence sufficiency;
- P1-010 clarification/PBC coordinator and authenticated route behavior;
- five-dimension curriculum and grading;
- OCR curriculum disagreement handling;
- OCR parser evidence;
- OCR orientation retry;
- OCR fail-closed quality gate;
- PDF OCR fallback;
- universal source evidence;
- presentation adapters;
- Academy dashboard truth;
- production build before Chromium acceptance;
- real Chromium Product Truth;
- evidence-backed five-dimension composition;
- evidence upload;
- final production build.

## Curriculum state

After this acceptance:

- total curated cases: `20`
- contract-ready: `8`
- physical-fixture-required: `12`
- autonomous eligible: `0`

`CURR-SPREADSHEET-GL-TRIAL-BALANCE` remains `autonomousEligible: false`.

## Protected-state confirmation

This work did not:

- rerun Pfizer / Company 1;
- alter the accepted Pfizer baseline;
- create or alter an Academy scheduler;
- change Hermes scheduler authority;
- make the new trial-balance case autonomous;
- merge PR #31;
- deploy feature-branch application code;
- activate trial-balance testing inside the production LEDGER specialist;
- treat trial-balance equality as the Assets = Liabilities + Equity identity;
- authorize a ledger posting;
- issue CPA/audit/statutory professional certification;
- use Codex.

## Result

**SPREADSHEET / GL / TRIAL-BALANCE CURRICULUM: FIVE-DIMENSION PASS ON FEATURE BRANCH**

Controlled production integration, merge and release remain separate owner-authorized steps.
