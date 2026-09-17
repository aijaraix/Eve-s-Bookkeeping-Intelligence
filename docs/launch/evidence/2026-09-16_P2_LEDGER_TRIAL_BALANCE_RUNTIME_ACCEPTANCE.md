# EVE P2 — LEDGER Trial-Balance Runtime Integration Acceptance

Date: 2026-09-16

Status: **FEATURE-BRANCH ACCEPTED — NOT DEPLOYED**

Repository: `aijaraix/Eve-s-Bookkeeping-Intelligence`

Branch: `feature/universal-evidence-ocr-foundation`

Accepted implementation checkpoint: `cb1b3099a259ef7e736ce856f1e5f814230473fc`

Acceptance workflow run: `35079221045`

Evidence artifact:

- name: `eve-ledger-trial-balance-runtime-acceptance`
- artifact ID: `10439187602`
- ZIP digest: `sha256:2b26e5f140e0d5f0a096edbc4e6a60ddf3eff6d4db0c07320f0d43503294bf03`

## Objective

Wire the already accepted spreadsheet trial-balance interpretation contract into Eve's real extraction-worker, verified-customer-continuation and LEDGER specialist paths without changing nonqualifying source behavior.

The runtime integration must remain fail-closed:

- qualifying spreadsheet / GL evidence is physically re-read and hash-bound before LEDGER may claim that a trial balance was tested;
- a balanced source may produce a tested balanced result;
- an unbalanced or insufficient source may not be promoted as balanced;
- source/review identity mismatch blocks the LEDGER conclusion;
- non-spreadsheet evidence and spreadsheets that are not trial balances retain the truthful `TRIAL_BALANCE_NOT_TESTED` behavior.

## Physical fixtures

Accepted deterministic workbooks:

### Balanced trial balance

- SHA-256: `463d4e14d5bf81cfadce2f715e97dcb830ac6c0ffb20e5af187385d9a191a841`
- total debits: `1600`
- total credits: `1600`
- variance: `0`
- hidden account rows included: `1`
- hidden row example: account `1999 / Clearing`, debit source `Trial Balance!C4`
- formula integrity: `MATCH`
- interpretation status: `BALANCED`

### Adversarial stale-cache / unbalanced trial balance

- SHA-256: `7ae7a846b837b3966fdde802f6e1879a34bd9a9c810ff36602a77c0e9f82f8e1`
- source account-row debits: `1590`
- source account-row credits: `1600`
- variance: `-10`
- cached spreadsheet total formulas still claim a balanced result
- formula integrity: `STALE_OR_INCONSISTENT`
- interpretation status: `UNBALANCED`
- promotion state: `BLOCKED_UNBALANCED`

The runtime recomputes from source account rows. Cached total/formula values cannot override contradictory row evidence.

## Shared physical runtime adapter

`server/cpaOrganization/trialBalanceRuntimeAdapter.ts` is the single bridge from physical spreadsheet source bytes into the accepted trial-balance interpretation engine.

It distinguishes:

- `QUALIFIED_TRIAL_BALANCE`
- `SPREADSHEET_NOT_TRIAL_BALANCE`
- `NOT_APPLICABLE_NON_SPREADSHEET`

For spreadsheet sources it requires the expected source SHA and an available physical file. It recomputes the physical file SHA before parsing. Missing physical spreadsheet evidence or a hash mismatch fails closed.

## Extraction worker — physical HTTP proof

The acceptance workflow started the real dedicated `server/worker.ts` HTTP service and uploaded both deterministic XLSX files through `POST /v1/jobs`.

The worker physically verified:

- source SHA continuity from upload to parsed spreadsheet;
- trial-balance qualification for both trial-balance workbooks;
- exact accepted spreadsheet/cell/formula lineage through the existing `SpreadsheetParser`;
- balanced workbook returns a `BALANCED` trial-balance review;
- stale-cache workbook returns `UNBALANCED`, variance `-10`, and `STALE_OR_INCONSISTENT` formula integrity;
- an unbalanced qualifying trial balance forces the worker job to `COMPLETE_REVIEW_REQUIRED` rather than silently completing as clean.

Marker: `WORKER_TRIAL_BALANCE_PHYSICAL=PASS`

## Verified continuation — independent reconstruction

`verifiedCustomerContinuationService` does not trust the worker's trial-balance payload by itself.

For a qualifying spreadsheet source the continuation independently:

1. reopens the physical source;
2. recomputes the physical SHA and checks it against the expected source SHA;
3. reparses the spreadsheet through the shared runtime adapter;
4. independently reconstructs the trial-balance review;
5. compares any worker-provided review against the independently reconstructed source SHA, status, debit total, credit total, variance and formula-integrity result.

A tampered worker review is rejected with `TRIAL_BALANCE_WORKER_CONTINUATION_MISMATCH`.

Non-spreadsheet continuation remains `NOT_APPLICABLE_NON_SPREADSHEET` and does not acquire a synthetic trial-balance claim.

Marker: `TRIAL_BALANCE_CONTINUATION_RUNTIME=PASS`

## LEDGER specialist behavior

LEDGER now consumes the trial-balance review only when the runtime qualification is `QUALIFIED_TRIAL_BALANCE` and the review's source SHA matches the engagement source SHA.

Accepted states:

- qualifying + balanced → `SOURCE_TRIAL_BALANCE_BALANCED`, `trialBalanceTested=true`, `JOB_COMPLETED_SUCCESS`;
- qualifying + unbalanced → `SOURCE_TRIAL_BALANCE_UNBALANCED`, `trialBalanceTested=true`, `JOB_NEEDS_REVIEW`;
- qualifying + insufficient evidence → `SOURCE_TRIAL_BALANCE_INSUFFICIENT_EVIDENCE`, blocked;
- qualifying review/source identity mismatch → `TRIAL_BALANCE_EVIDENCE_MISMATCH`, blocked;
- no qualifying trial-balance evidence but account lines exist → legacy `ACCOUNT_LINES_DISCOVERED_TRIAL_BALANCE_NOT_TESTED` remains intact.

Marker: `LEDGER_TRIAL_BALANCE_RUNTIME=PASS`

## Legacy behavior / retry compatibility

The acceptance suite reran the existing bounded Academy specialist-retry and Package B2 specialist execution tests unchanged.

Both passed after the integration-order repair.

This proves the optional trial-balance evidence does not silently change the old non-trial-balance LEDGER input contract or break bounded specialist retry/reuse behavior.

## End-to-end runtime marker

The machine-composed runtime receipt required the LEDGER and physical-worker receipts to exist and pass.

Marker: `P2_LEDGER_TRIAL_BALANCE_RUNTIME_INTEGRATION=PASS`

## Regression gates

The successful run also passed:

- existing trial-balance interpretation and Deliverable Truth tests;
- exact spreadsheet source-to-pixel lineage;
- Academy specialist retry;
- Package B2 specialist execution;
- bank-statement completeness / deliverable regressions;
- invoice/AP interpretation, classification and deliverable regressions;
- receipt Deliverable Truth regression;
- P1-009 task-evidence sufficiency;
- P1-010 clarification coordinator and route/auth regressions;
- five-dimension Academy catalog and grading;
- OCR curriculum, parser evidence, orientation retry and fail-closed quality gate;
- PDF OCR fallback;
- universal evidence contract;
- presentation-adapter truth;
- Academy dashboard truth;
- production build before evidence upload;
- final production build after all acceptance gates.

## Scope boundary

This is a **feature-branch runtime integration acceptance**, not production activation.

No production deployment or release occurred. No production service was rebuilt. `main` was not modified. Company 1 / Pfizer was not rerun. Hermes remains the sole Academy scheduler authority. No new scheduler was created. No Codex was used.

The verified-customer continuation's existing proof-complete-fact, currency and current balance-sheet gates remain in force. This change does not bypass or broaden those gates; it adds a truthful trial-balance result when qualifying spreadsheet evidence reaches that existing continuation path.

## Staging-run note

Two earlier one-shot attempts failed before an application commit because of staging-only continuation-helper issues (escaped newlines and then initialization order). A diagnostic identified the ordering error (`document` referenced before its existing local initialization). The accepted run corrected the staging order, reran the complete acceptance suite, self-removed all temporary workflow/patch/diagnostic machinery and committed only the tested runtime integration.
