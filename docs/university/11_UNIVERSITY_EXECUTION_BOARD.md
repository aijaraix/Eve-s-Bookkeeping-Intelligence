# EVE University — Execution Board and Capability Gates

This board converts the master program into an execution sequence. It is intentionally product-first. It does not authorize deployment.

## Current governed starting point

- Product branch: `feature/university-raw-input-activation`
- Gateway/Internal Forge Accepted Head at board preparation: `a784ea62e881f2eadbad60e0ed88b5a846088262`
- Checkpoint 4: accepted; do not repeat
- GitHub documentation branch: `docs/university-service-readiness-master-20260930`
- GitHub may not yet contain the latest governed product checkpoint. Always recover product source from Gateway/Internal Forge.

## Phase A — establish examination environment

**Goal:** make the real nonproduction EVE customer and owner product browser-reachable for University.

Acceptance:
- authenticated Academy customer login;
- authenticated Owner login;
- real Documents/upload flow;
- Exceptions/PBC/clarification surfaces where applicable;
- Reports/download surfaces;
- Owner University visibility;
- desktop and mobile viewport coverage relevant to changed surfaces;
- no production customer data;
- tenant isolation intact.

Do not build a parallel University-only customer UI.

## Phase B — seal Batch 1 truth

Before Blue Team execution, create independent Minerva truth packages for:

| Case | Primary competency | Critical trap |
|---|---|---|
| U-AP-01 | AP invoice | line/tax/total/account/payable semantics |
| U-OCR-01 | poor photo receipt | OCR confidence and accountable uncertainty |
| U-BANK-01 | bank statement/reconciliation | transaction completeness and reconciliation |
| U-POS-01 | merchant settlement | gross ≠ net deposit; fees/refunds |
| U-FX-01 | multilingual/FX | language/currency/period/rate semantics |

Seal expected truth and holdouts before Blue Team sees the case.

## Phase C — Blue Team Batch 1

For each case collect evidence for:

| Gate | Required evidence |
|---|---|
| Raw input | provenance + exact input hash/inventory |
| Customer journey | screenshots/browser evidence of actual product interaction |
| Extraction | document/transaction facts with confidence/evidence |
| Evidence | proof-complete or explicit clarification |
| Canonicalization | canonical facts tied to source |
| Accounting | classification, journal/workpaper, entity/period/currency |
| Reconciliation | balanced/reconciled or explicit unresolved item |
| Deliverables | appropriate outputs generated/read back |
| Customer UI | material values/status physically verified |
| Owner UI | case/state/material values physically verified |
| Presentation integrity | independent expected-vs-rendered reconciliation |
| Reverse lineage | output → accounting → fact → evidence → source |
| Minerva | sealed independent grade |

## Phase D — remediate systemic gaps

Classify each failure:

- ingestion/routing;
- OCR/document understanding;
- table/line-item extraction;
- evidence/provenance;
- duplicate/idempotency;
- canonicalization;
- accounting classification;
- journal/balance;
- reconciliation;
- clarification/PBC;
- multi-currency;
- aggregation;
- customer UX;
- owner UX;
- deliverable generation;
- reverse lineage;
- tenant/security;
- scheduler/Hermes;
- observability/presentation integrity.

For a systemic defect, implement one reusable fix, replay the failed case, run a related regression and an unseen sealed holdout, then preserve the checkpoint before proceeding.

## Phase E — complete heterogeneous 25-case cohort

Do not satisfy the cohort with superficial variants. The cohort should collectively cover the capability classes in `10_BOOKKEEPING_SERVICE_READINESS_MASTER_PROGRAM.md`.

Maintain a live funnel:

`RAW_INPUT → EXTRACTED → EVIDENCE_COMPLETE → CANONICALIZED → ACCOUNTING → NEEDS_CLARIFICATION → WORKPAPER_BOOKS → DELIVERABLE → CUSTOMER_UI_VERIFIED → OWNER_UI_VERIFIED → PRESENTATION_INTEGRITY_VERIFIED → MINERVA_PASS/CLARIFICATION_PASS/FAIL/BLOCKED`

## Phase F — multi-period / multi-account / multi-entity progression

After prerequisite single-entity competencies pass, deliberately introduce:

1. month 1 + month 2;
2. Q1 + Q2;
3. YTD;
4. multiple bank/card accounts;
5. multiple currencies;
6. Company A + Company B;
7. shared/ambiguous documents;
8. initial intercompany cases;
9. ownership/consolidation cases only when prerequisite accounting capabilities exist.

For each step, independently reconstruct dashboard/report totals and subtotals.

## Phase G — service-readiness dress rehearsal

Create a synthetic company package resembling a real onboarding data room rather than an isolated document.

The package should contain a mixed document box, incomplete evidence, duplicates, multiple periods/accounts, realistic clarification requirements and expected outputs.

Run it through the normal product from onboarding/customer login through books, reports, owner oversight and support.

## Required status language

Never use a vague "looks good."

For each competency/case use one of:

- `CERTIFIED`
- `CERTIFIED_WITH_CLARIFICATION`
- `REMEDIATED_AND_CERTIFIED`
- `FAILED`
- `BLOCKED`
- `NOT_YET_EXAMINED`

A capability is not certified merely because code exists or a unit test passes.

## Owner Requests

When a capability needs owner input, record:
- capability requested;
- exposing case;
- why it materially improves service readiness;
- expected acceptance test;
- cost/security/operational implication if any;
- whether work can continue without it.

## Stop conditions

Stop source mutation only for a real hard gate: source cannot be recovered, checkpoint cannot be preserved, isolation fails, required authorization is absent, or production/deployment authority is required.

Ordinary product failures are work, not stop conditions.
