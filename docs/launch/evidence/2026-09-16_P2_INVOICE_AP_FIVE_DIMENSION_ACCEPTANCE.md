# EVE-P2-003 — Invoice / Accounts Payable Five-Dimension Acceptance

Date: 2026-09-16 UTC

Branch: `feature/universal-evidence-ocr-foundation`

Draft PR: #31

Status: **ACCEPTED CANDIDATE ON FEATURE BRANCH — NOT MERGED OR DEPLOYED**

Accepted implementation checkpoint:

`76a59bc6ecd244e76051132bc612c623a99bb6d7` — `Close invoice AP five-dimension curriculum`

Acceptance run:

`35060741177` — **PASS**

## Purpose

This acceptance advances `CURR-OCR-SCANNED-INVOICE` from OCR-only evidence into a bounded accounts-payable interpretation and review contract with all five Minerva dimensions physically/deterministically tested.

The implementation does not create a payment rail, vendor master, purchase-order system, receiving system, approval authority, or autonomous ledger posting workflow. It uses the evidence actually present and fails closed where independent AP control evidence is absent.

## Exact deterministic invoice fixture

Filename: `invoice.png`

Bytes: `31822`

SHA-256:

`1000426f9989dd8aa2767d57c10248648a770aa05d957d04940fd1463e0cf105`

The fixture contains:

- vendor: `SYNTHETIC OFFICE SUPPLY CO.`
- invoice identifier: `INV-260916-1042`
- invoice date: `09/16/2026`
- due date: `10/16/2026`
- bill-to: `EVE ACADEMY TEST CLIENT`
- line item 1: `ACCOUNTING BINDERS 2 x $35.00 = $70.00`
- line item 2: `ARCHIVE BOXES 5 x $12.00 = $60.00`
- line item 3: `DOCUMENT BAGS 3 x $15.00 = $45.00`
- subtotal: `$175.00`
- sales tax: `$12.25`
- total due: `$187.25`
- PO reference printed on invoice: `PO-EVE-1001`
- explicit currency: `USD`

CI physically regenerated the same bytes before acceptance:

`INVOICE_AP_FIXTURE_REPRODUCIBILITY=PASS`

## Physical live OCR revalidation on Eve runtime

Before implementation acceptance, the exact fixture bytes were re-run against the existing internal-only OCR services on `eve-bookkeeping-prod-ai`.

PaddleOCR and docTR both physically recovered:

- vendor
- invoice identifier
- invoice date
- due date
- bill-to
- all three line items
- subtotal
- sales tax
- total due
- PO reference
- explicit USD currency

Physical markers:

- `LIVE_INVOICE_VENDOR_OCR=PASS`
- `LIVE_INVOICE_LINE_ITEMS_OCR=PASS`
- `LIVE_INVOICE_AP_FIELDS_OCR=PASS`

The previously discovered raw disagreement was reproduced and preserved:

- PaddleOCR: `INV0ICE INV-260916-1042`
- docTR: `INVOICE INV-260916-1042`

Both engines independently agree on the material invoice identifier `INV-260916-1042` and the required AP fields.

## Semantic adjudication

The accepted `invoiceApInterpretationEngine` does not erase the raw OCR disagreement and does not silently declare the Paddle label correct.

For this fixture:

- raw label disagreement: **preserved**
- field-level invoice identifier consensus: **PASS**
- required AP-field cross-engine consensus: **PASS**
- adjudication status: `RESOLVED_FIELD_CONSENSUS`

If a required field is missing or conflicts across engines, semantic status becomes `REVIEW_REQUIRED`.

An adversarial acceptance test changes docTR total due to `$197.25`. The accepted engine must then:

- mark total due `CONFLICT`;
- mark semantic adjudication `REVIEW_REQUIRED`;
- mark arithmetic reconciliation `FAIL`;
- refuse a supported payable candidate;
- produce failed semantic/accounting checks.

This closed a defect found in the first acceptance attempt: accounting reconciliation previously could use the primary engine value and remain PASS despite a cross-engine material conflict. The accepted logic now requires cross-engine consensus for every material numeric field before reconciliation can PASS.

Marker:

`INVOICE_AP_INTERPRETATION_ENGINE_TESTS=PASS`

## Accounting / AP control truth

Arithmetic physically/deterministically accepted:

- `2 × 35.00 = 70.00`
- `5 × 12.00 = 60.00`
- `3 × 15.00 = 45.00`
- `70.00 + 60.00 + 45.00 = 175.00`
- `175.00 + 12.25 = 187.25`
- variance: `0`

The invoice supports a reviewable payable candidate:

- amount: `187.25`
- currency: `USD`
- liability concept: `ACCOUNTS_PAYABLE`
- payable candidate state: `SUPPORTED_CANDIDATE`

The invoice does **not** prove the controls required to authorize payment or posting. The accepted state is therefore:

- invoice references PO `PO-EVE-1001`: **yes**
- independent purchase-order record verified: **no**
- receiving evidence verified: **no**
- three-way match: `NOT_TESTABLE`
- approval evidence verified: **no**
- approval: `REVIEW_REQUIRED`
- payment eligibility: `BLOCKED`
- payment status: `UNKNOWN`
- posting status: `NOT_POSTED`
- debit-side chart-of-accounts classification: `REVIEW_REQUIRED`

An invoice-stated PO reference is explicitly treated as a reference only; it is not promoted into independent PO evidence.

No payment, receiving, approval, account classification or ledger posting is inferred from invoice content alone.

## Document classification truth

The generic document-intelligence classifier was repaired for invoices:

- invoice classification is explicit (`documentKind=INVOICE`);
- invoices no longer claim `INCOME_STATEMENT` / `BALANCE_SHEET` statement types;
- explicit ISO currency evidence is required; a dollar sign alone does not silently establish USD;
- confidence is based on observed invoice signals instead of a blanket `0.96`.

Marker:

`DOCUMENT_INTELLIGENCE_INVOICE_TRUTH_TESTS=PASS`

## Product Truth — PASS

The successful acceptance run built the actual feature-branch Eve application and exercised it in real headless Chromium with an isolated synthetic Academy engagement at the API boundary.

The actual `RecordedEngagementEvidenceView` rendered the new AP review panel and physically showed:

- vendor and invoice identifier;
- invoice date and due date;
- bill-to and PO reference;
- explicit USD currency;
- subtotal, tax and total due;
- all three line items;
- arithmetic reconciliation `PASS`;
- payable candidate `$187.25 USD`;
- three-way match `NOT_TESTABLE`;
- independent PO `NOT PROVIDED`;
- receiving evidence `NOT PROVIDED`;
- approval `REVIEW_REQUIRED`;
- payment eligibility `BLOCKED`;
- payment status `UNKNOWN`;
- posting `NOT_POSTED`;
- debit account classification `REVIEW_REQUIRED`;
- semantic adjudication `RESOLVED_FIELD_CONSENSUS`;
- both raw OCR labels;
- source SHA and Paddle/docTR evidence references.

Marker:

`P2_INVOICE_AP_PRODUCT_TRUTH_BROWSER=PASS`

## Deliverable Truth — PASS

The same run used Eve's actual `DeliverableArtifactService` and physically read back its generated outputs.

The invoice/AP review and reverse lineage were verified in:

- PDF
- JSON
- CSV lead schedules / AP review section
- XLSX `AP Review` and `Lead Schedules`

The artifacts retain:

- vendor / invoice identifier / dates;
- PO reference and currency;
- invoice arithmetic and AP control state;
- raw Paddle/docTR disagreement as distinct evidence;
- `NOT_TESTABLE` three-way match;
- `REVIEW_REQUIRED` approval;
- `BLOCKED` payment eligibility;
- `UNKNOWN` payment state;
- `NOT_POSTED` posting state;
- original invoice SHA and source lineage.

The PDF physically renders each raw OCR invoice-label observation as a separate evidence line so the disagreement survives the exported artifact without being hidden by text wrapping.

Marker:

`P2_INVOICE_AP_DELIVERABLE_TRUTH=PASS`

The already-accepted receipt deliverable regression also passed in the same run.

## Five-dimension result — PASS

The final composition required machine-readable Product Truth and Deliverable Truth receipts generated earlier in the same CI job. Missing either receipt blocks PASS.

For `CURR-OCR-SCANNED-INVOICE`:

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

`P2_INVOICE_AP_FIVE_DIMENSION_PASS=PASS`

## Acceptance evidence bundle

GitHub Actions run:

`35060741177`

Artifact:

- name: `eve-invoice-ap-five-dimension-acceptance`
- artifact ID: `10432730800`
- ZIP digest: `sha256:c5d7146277ad7f45b433fade365c17605feb5657567ebf663046821bfdc26b54`

The successful run also passed:

- invoice/AP interpretation and adversarial fail-closed contract;
- invoice document-classification truth;
- existing OCR engine-disagreement regression;
- invoice AP deliverable reverse-lineage truth;
- receipt deliverable truth regression;
- five-dimension curriculum and grading regressions;
- image source-to-pixel presentation;
- OCR parser evidence;
- orientation retry;
- OCR final-quality fail-closed gate;
- PDF OCR fallback;
- P1-009 sufficiency;
- P1-010 clarification coordinator and route/auth;
- universal source evidence;
- spreadsheet lineage;
- presentation adapters;
- Academy dashboard truth;
- full production build before browser acceptance;
- real Chromium AP Product Truth;
- evidence-backed five-dimension composition;
- evidence upload;
- final production build.

## Curriculum state

`CURR-OCR-SCANNED-INVOICE` is now:

- fixture status: `CONTRACT_READY`
- target dimensions: all five
- `autonomousEligible: false`

Catalog counts after this acceptance:

- total cases: `19`
- contract-ready: `7`
- physical-fixture-required: `12`
- autonomous eligible: `0`

## Protected-state confirmation

This work did not:

- rerun Pfizer / Company 1;
- alter the accepted Pfizer baseline;
- create a second Academy scheduler;
- change Hermes scheduler authority;
- make the invoice curriculum autonomous;
- merge PR #31;
- deploy feature-branch application code;
- create or execute a real payment;
- create an approved ledger posting;
- claim a three-way match without independent PO/receiving evidence;
- issue a CPA/audit/statutory professional certification;
- use Codex.

## Result

**EVE-P2-003 INVOICE / AP CURRICULUM: FIVE-DIMENSION PASS ON FEATURE BRANCH**

Controlled merge/release remains a separate owner-authorized step.
