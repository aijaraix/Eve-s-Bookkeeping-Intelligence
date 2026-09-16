# EVE-P2-004 — Bank Statement Completeness / Sufficiency Acceptance

Date: 2026-09-16 UTC

Branch: `feature/universal-evidence-ocr-foundation`

Draft PR: #31

Status: **ACCEPTED CANDIDATE ON FEATURE BRANCH — NOT MERGED OR DEPLOYED**

Accepted implementation checkpoint:

`ad9a0847ab71958b3a648fbc3f1c1589fd8f597e` — `Close bank statement completeness curriculum`

Acceptance run:

`35066141231` — **PASS**

## Purpose

This acceptance closes the bounded EVE-P2-004 bank-statement completeness/sufficiency curriculum using real generated multi-page PDFs, Eve's real PDF parser, the existing bank-statement extractor, the existing P1-009 task-evidence sufficiency engine, the built Eve product in Chromium, and Eve's real PDF/JSON/CSV/XLSX deliverable path.

The core rule is preserved throughout:

**source completeness and task evidence sufficiency are separate judgments.**

A known missing page is never erased merely because one scoped conclusion can still proceed. Different conclusions may legitimately be ALLOWED, REVIEW_REQUIRED, or BLOCKED from the same incomplete source.

## Physical deterministic PDF fixtures

The successful acceptance run generated four genuine multi-page PDF fixtures with fixed metadata and deterministic bytes:

| Fixture | Bytes | SHA-256 |
|---|---:|---|
| complete | 3940 | `abc2476339946f492b4e5b8c6b7a9ab5df6675e9e55a9394d61d8d77f03ce2c8` |
| missing disclosure page | 3306 | `cfd04e75057b0936f7357c3f306e014de6642a36c498cfc9b902ced952892bc1` |
| missing transaction page | 3347 | `ce5210d1cafedafcb6f11900f8d2eebf5b48a35d50663d0cac7a815a5321b6fe` |
| missing unknown-role page | 2610 | `2bd4ec0ff1838ccd73fdcf743999f4b2c5a046a45e168c8e4d8b4d56030d1081` |

Marker:

`BANK_STATEMENT_PHYSICAL_FIXTURES=PASS`

All four PDFs were parsed through Eve's real `AnyDocParser`; the bank data was then extracted by `bankStatementExtractor` and evaluated by the new bank-to-P1-009 adapter.

## Bank extractor truth repairs

The bank-statement extractor was hardened as part of this acceptance.

### Date fragments cannot become monetary amounts

For text transaction lines, Eve now removes the date token before scanning monetary tokens. This prevents a date fragment such as `09` from being interpreted as the transaction amount.

The complete physical fixture proved its first transaction as:

- `09/02/2026 CLIENT PAYMENT 500.00 1,500.00`
- extracted transaction amount: `500.00`
- not `9`, `2`, or another date fragment.

### Physical page provenance is retained

Transactions parsed from PDF text now retain the actual `doc.pages[].page_number` rather than being hard-coded to page 1.

The complete fixture physically established transactions on logical/physical pages 2 and 3.

### Currency is not invented

The extractor no longer defaults an unknown bank-statement currency to USD.

An explicit `CURRENCY USD` source line establishes USD for the accepted fixtures. A separate no-currency regression removes that evidence and confirms the result remains unspecified rather than silently USD.

### Missing balances are not zero-filled

If beginning or ending balance evidence is absent and cannot be derived from a recorded running balance, Eve leaves the balance and calculated ending balance unrecorded rather than converting missing evidence into zero.

### Balance facts have distinct identities

Beginning-balance and ending-balance facts now use distinct fact IDs instead of colliding on one document-level bank fact ID.

Marker:

`P2_BANK_STATEMENT_SOURCE_SUFFICIENCY_CASES=PASS`

## Physical case 1 — complete statement

Observed logical pages: `1, 2, 3, 4`

Missing logical pages: none.

Extracted transaction population: 4 transactions.

Recorded arithmetic:

- beginning balance: `1000.00 USD`
- deposits: `550.00 USD`
- withdrawals: `400.00 USD`
- calculated ending balance: `1150.00 USD`
- reported ending balance: `1150.00 USD`
- variance: `0.00`
- reconciliation: `PASS`

This is the baseline against which missing-page cases are evaluated.

## Physical case 2 — missing non-material disclosure page

Observed logical pages: `1, 2, 3`

Expected logical pages: `4`

Missing logical page: `4`

Page 3 contains explicit `END OF TRANSACTION ACTIVITY`, and the observed bank arithmetic still reconciles.

The missing page is therefore persisted as a real source gap but is structurally outside the transaction population for the tested purposes.

Result:

- gap type: `MISSING_PAGE`
- materiality for current bank balance / transaction purposes: `NON_MATERIAL`
- ending-balance conclusion: `ALLOWED`
- complete transaction population: `ALLOWED`
- recommended action: proceed with disclosed gap rather than erase the gap.

This case proves that a known missing page can remain disclosed without falsely blocking conclusions that no longer depend on that page.

## Physical case 3 — missing material transaction page

Representative all-five acceptance case.

Observed logical pages: `1, 3, 4`

Expected logical pages: `4`

Missing logical page: `2`

Later transaction activity is physically present on page 3, so missing page 2 interrupts the transaction population.

Observed arithmetic from supplied pages:

- beginning balance: `1000.00 USD`
- observed deposits: `50.00 USD`
- observed withdrawals: `100.00 USD`
- calculated ending balance from observed population: `950.00 USD`
- reported ending balance: `1150.00 USD`
- variance: `-200.00 USD`
- reconciliation: `FAIL`

P1-009 scoped result:

- source gap: `MISSING_TRANSACTION_RANGE`
- materiality: `MATERIAL`
- explicit ending cash balance conclusion: `ALLOWED`
- claim of complete transaction population: `BLOCKED_INSUFFICIENT`
- transaction-population recommended action: `REQUEST_ADDITIONAL_EVIDENCE`
- clarification recommended: `true`

This is deliberate. The supplied statement still contains direct ending-balance evidence, so Eve may preserve that scoped fact. It may **not** claim that the observed transactions form a complete population.

## Physical case 4 — missing page of unknown role

Observed logical pages: `1, 3`

Expected logical pages: `3`

Missing logical page: `2`

The observed page structure does not establish whether page 2 contains transactions, disclosures, or other relevant evidence.

Observed arithmetic can still reconcile on the supplied page-1 data, but reconciliation alone does not prove the missing page irrelevant.

P1-009 fail-safe result:

- gap materiality: `UNKNOWN` for an ordinary scoped balance conclusion
- ending cash conclusion: `REVIEW_REQUIRED`
- ending-balance action: `REVIEW_MATERIALITY`
- complete transaction population: `BLOCKED_INSUFFICIENT`
- transaction-population action: `REQUEST_ADDITIONAL_EVIDENCE`

The stronger complete-population rule is intentional: when a missing page may contain members of a population, a claim of completeness cannot remain merely REVIEW_REQUIRED; it is blocked until evidence resolves the gap.

## Product Truth — PASS

The successful run built the actual feature-branch Eve application, launched it under Vite preview, and exercised the real `RecordedEngagementEvidenceView` in headless Chromium using the material missing-transaction-page case.

The real product physically rendered:

- expected logical pages: 4
- observed logical pages: `1, 3, 4`
- missing logical page: `2`
- physical pages supplied: 3
- beginning balance: `USD 1000.00`
- observed deposits: `USD 50.00`
- observed withdrawals: `USD 100.00`
- calculated ending balance: `USD 950.00`
- reported ending balance: `USD 1150.00`
- variance: `USD -200.00`
- reconciliation: `FAIL`
- ending cash conclusion: `ALLOWED`
- complete transaction population: `BLOCKED_INSUFFICIENT`
- transaction action: `REQUEST_ADDITIONAL_EVIDENCE`
- clarification required: `YES`
- persisted `MISSING_TRANSACTION_RANGE` / `MATERIAL` gap
- original source SHA-256.

Marker:

`P2_BANK_STATEMENT_PRODUCT_TRUTH_BROWSER=PASS`

## Deliverable Truth — PASS

The same material case was passed through Eve's actual `DeliverableArtifactService` and physically read back.

The bank completeness / sufficiency review was verified in:

- PDF
- JSON
- CSV lead schedules / bank review section
- XLSX `Bank Review` sheet and source lead schedule.

The exported evidence preserves:

- expected / observed / missing page inventory;
- bank arithmetic and failed reconciliation;
- scoped ending-cash and transaction-population decisions;
- `REQUEST_ADDITIONAL_EVIDENCE` action;
- `MISSING_TRANSACTION_RANGE` gap;
- original source SHA and fact lineage.

Marker:

`P2_BANK_STATEMENT_DELIVERABLE_TRUTH=PASS`

The previously accepted invoice/AP and receipt deliverable regressions also passed in the same acceptance chain.

## Five-dimension result — PASS

The final evidence composition required the physical source/sufficiency receipt, the real-browser Product Truth receipt, and the real-artifact Deliverable Truth receipt from the same CI run.

For the representative material missing-transaction-page curriculum case:

- Source Coverage: **PASS** — physical/logical page inventory correctly identifies the missing transaction page.
- Semantic Understanding: **PASS** — Eve distinguishes direct ending-balance evidence from a blocked claim of a complete transaction population.
- Accounting Accuracy: **PASS** — Eve faithfully computes `1000 + 50 - 100 = 950`, compares it to reported `1150`, records variance `-200`, and fails reconciliation rather than forcing a tie.
- Product Truth: **PASS** — the actual built Eve UI physically renders those states.
- Deliverable Truth: **PASS** — real generated artifacts preserve the gap, scoped decisions, arithmetic, and source lineage.

Final state:

- passed dimensions: `5`
- NOT_TESTED dimensions: `0`
- `fullyTested=true`
- `allRequiredDimensionsPassed=true`
- overall: `FIVE_DIMENSION_PASS`

Marker:

`P2_BANK_STATEMENT_FIVE_DIMENSION_PASS=PASS`

## Acceptance evidence bundle

GitHub Actions run:

`35066141231`

Artifact:

- name: `eve-bank-statement-five-dimension-acceptance`
- artifact ID: `10434615409`
- ZIP digest: `sha256:0f86366d519fa0698d572a8a86b420893eebda2130ef59cc4bbc3ff65fcf0d2b`
- artifact size: `277189` bytes

The accepted run passed:

- deterministic physical bank PDF fixture generation;
- real bank extraction and scoped P1-009 sufficiency cases;
- real bank deliverable read-back;
- invoice/AP interpretation and classification regressions;
- invoice/AP deliverable regression;
- receipt deliverable regression;
- generic P1-009 sufficiency;
- P1-010 clarification coordinator and route/auth;
- five-dimension curriculum and grading regressions;
- OCR curriculum disagreement;
- OCR evidence, orientation and final-quality fail-closed gates;
- PDF OCR fallback;
- universal source evidence;
- spreadsheet lineage;
- presentation adapters;
- Academy dashboard truth;
- full production build;
- real Chromium bank Product Truth;
- evidence-backed five-dimension composition;
- artifact upload;
- final production build.

## Curriculum state

The three existing missing-page cases now carry explicit bank-statement physical validation:

- `CURR-SUFF-MISSING-PAGE-NON-MATERIAL`
- `CURR-SUFF-MISSING-TRANSACTION-MATERIAL`
- `CURR-SUFF-MISSING-PAGE-UNKNOWN`

The material missing-transaction case now targets all five dimensions with case-specific browser/export evidence.

They remain `autonomousEligible: false`.

Catalog totals remain:

- total cases: `19`
- contract-ready: `7`
- physical-fixture-required: `12`
- autonomous eligible: `0`

## Protected-state confirmation

This work did not:

- rerun Pfizer / Company 1;
- alter the accepted Pfizer baseline;
- create or modify the Academy scheduler;
- create a second scheduler authority;
- make any curriculum case autonomous;
- merge PR #31;
- deploy feature-branch application code;
- infer missing transactions or zero-fill missing balances;
- invent a bank currency;
- treat a known missing page as globally cleared;
- issue a CPA/audit/statutory professional certification;
- use Codex.

## Result

**EVE-P2-004 BANK-STATEMENT COMPLETENESS / SUFFICIENCY CURRICULUM: ACCEPTED FIVE-DIMENSION FEATURE-BRANCH CANDIDATE**

Controlled merge/release remains a separate owner-authorized step.
