# P2 long-document semantic/context extraction — acceptance record

Date: 2026-09-16
Repository: `aijaraix/Eve-s-Bookkeeping-Intelligence`
Branch: `feature/universal-evidence-ocr-foundation`
Draft PR: #31

Status: **ACCEPTED FEATURE-BRANCH CURRICULUM CLOSURE / TARGETED DIMENSIONS ONLY / NOT PRODUCTION ACTIVATED / NOT AUTONOMOUS**

## Accepted implementation checkpoint

`74013f24355f7fbe54838c80cb1b30d90279c3fd` — `Close long-document semantic context curriculum`

Successful corrected acceptance run:

`35153189326` — SUCCESS through physical PDF generation, native parsing, semantic-context truth, runtime wiring, targeted Minerva grading, semantic/OCR/evidence regressions, production build, artifact upload, final production build, and self-cleaning implementation commit.

Evidence artifact:

- name: `eve-long-document-semantic-context-acceptance`
- artifact ID: `10469708455`
- ZIP digest: `sha256:b91afa86096bbac45ea4017b6126aefb782c906efb469c65daf90c6a98c4461c`
- artifact size: 10982 bytes

Markers:

- `LONG_DOCUMENT_SEMANTIC_FIXTURE=PASS`
- `P2_LONG_DOCUMENT_SEMANTIC_SOURCE_TRUTH=PASS`
- `LONG_DOCUMENT_SEMANTIC_RUNTIME_WIRING=PASS`
- `P2_LONG_DOCUMENT_SEMANTIC_TARGETED_DIMENSIONS=PASS`

## Scope

This pass closes curriculum case:

`CURR-SEMANTIC-LONG-DOCUMENT`

Target dimensions:

- Source Coverage
- Semantic Understanding

The case intentionally does **not** claim Accounting Accuracy, Product Truth, or Deliverable Truth. Those dimensions remain `NOT_TESTED` because this fixture tests semantic context boundaries and source attribution, not numeric accounting conclusions, browser rendering, or exported deliverables.

`CONTRACT_READY` therefore means the physical long-document semantic/evidence contract is accepted for the dimensions this case was designed to exercise. It does not convert non-target dimensions into passes.

## Deterministic physical fixture

Filename:

`long-document-semantic-context.pdf`

Physical fixture properties:

- pages: `12`
- bytes: `11268`
- SHA-256: `18979225358880b18ef07ff8184fe91a6021048ba70cc9f7ba9a471f11d48399`
- all 12 pages parsed as native-text PDF pages
- the fixture generator produced the same SHA twice in the same pinned execution, proving byte reproducibility for this deterministic source

The fixture intentionally places the word `revenue` on every page while changing its semantic meaning and context across the document.

The document includes:

1. document metadata / cover scope;
2. management forward-looking commentary for Alpha Holdings Inc., FY 2026;
3. continuation of management commentary with no repeated context markers;
4. reported consolidated statement of operations for Alpha Holdings Inc., FY 2026;
5. continuation of the reported statement;
6. Note 7 for Beta Subsidiary LLC, FY 2025;
7. continuation of the Beta note without repeated context markers;
8. Note 12 revenue-recognition accounting policy for Alpha Holdings Inc., FY 2026, footnote 12A;
9. continuation of footnote 12A without repeated context markers;
10. risk-factor / FY 2027 outlook language attributed to CFO Aaron Kim;
11. continuation of the risk section;
12. non-GAAP supplemental appendix for Alpha Holdings Inc., FY 2026.

## Deterministic context ledger

The new deterministic context ledger sits beneath the higher-level semantic/model layer.

For long PDFs, it preserves:

- exact source PDF SHA;
- source artifact identity;
- physical PDF page number;
- section;
- entity;
- reporting period;
- speaker where applicable;
- author where applicable;
- footnote identifier where applicable;
- narrative intent;
- the physical page on which every context anchor originated;
- which context fields were inherited by continuation pages.

Fail-safe boundary rule:

A new section resets prior semantic context. The new section must explicitly establish its own section, entity, period and narrative intent before those values can govern subsequent continuation pages. Prior speaker/author/footnote/intent cannot silently bleed into a different section.

## Physical result

Artifact readback recorded:

- status: `CONTEXT_LEDGER_READY`
- pages: `12`
- explicit context anchors: `36`
- inherited context fields: `26`
- distinct entities: `2`
- distinct periods: `3`
- distinct sections: `7`
- distinct narrative intents: `7`
- context issues: `0`

All 12 page evidence coordinates retained:

- source type `PDF`;
- original fixture SHA;
- physical page number;
- evidence mode `NATIVE_TEXT`.

### Continuation-page inheritance physically proven

Page 3 inherited from page 2:

- section: `Management Discussion and Outlook`
- entity: `Alpha Holdings Inc.`
- period: `FY 2026`
- speaker: `CEO Maya Levin`
- intent: `FORWARD_LOOKING_COMMENTARY`

Page 7 inherited from page 6:

- section: `Note 7 - Subsidiary Revenue`
- entity: `Beta Subsidiary LLC`
- period: `FY 2025`
- author: `Controller Daniel Ortiz`
- intent: `REPORTED_NOTE`

Page 9 inherited from page 8:

- section: `Note 12 - Revenue Recognition`
- entity: `Alpha Holdings Inc.`
- period: `FY 2026`
- author: `Accounting Policy Team`
- footnote: `12A`
- intent: `ACCOUNTING_POLICY`

Page 11 inherited from page 10:

- section: `Risk Factors`
- entity: `Alpha Holdings Inc.`
- period: `FY 2027 OUTLOOK`
- speaker: `CFO Aaron Kim`
- intent: `HYPOTHETICAL_RISK`

## Keyword-collision adversarial proof

A keyword-only query for `revenue` matched all 12 pages:

`[1,2,3,4,5,6,7,8,9,10,11,12]`

This is intentional. The fixture proves that accounting keyword presence is not enough to identify the meaning or authority of a passage.

Applying semantic context narrowed the same word correctly:

### Alpha reported financial statement

Query context:

- entity: Alpha Holdings Inc.
- period: FY 2026
- section: Consolidated Statement of Operations
- intent: REPORTED_FINANCIAL_STATEMENT

Result:

`[4,5]`

### Beta subsidiary reported note

Query context:

- entity: Beta Subsidiary LLC
- period: FY 2025
- section: Subsidiary Revenue
- intent: REPORTED_NOTE

Result:

`[6,7]`

### Alpha accounting-policy footnote

Query context:

- entity: Alpha Holdings Inc.
- period: FY 2026
- footnote: 12A
- author: Accounting Policy Team
- intent: ACCOUNTING_POLICY

Result:

`[8,9]`

### Alpha FY 2027 hypothetical risk

Query context:

- entity: Alpha Holdings Inc.
- period: FY 2027 OUTLOOK
- section: Risk Factors
- speaker: Aaron Kim
- intent: HYPOTHETICAL_RISK

Result:

`[10,11]`

### Impossible cross-context query

The deliberately invalid combination:

- Beta Subsidiary LLC
- FY 2025
- footnote 12A
- ACCOUNTING_POLICY

returned:

`[]`

Eve therefore did not borrow a nearby `revenue` keyword from Alpha's FY 2026 accounting-policy footnote.

## Runtime integration

`HybridExtractionOrchestrator` now constructs the deterministic semantic-context review for non-spreadsheet documents with at least 8 physical pages and retains the review beside the parsed document / hybrid result.

This context ledger is beneath the existing Gemini Document Map and note-extraction layers. It does not replace those higher-level semantic tools; it gives them a deterministic physical context boundary so later semantic extraction can be checked against exact page/entity/period/section attribution.

Runtime wiring marker:

`LONG_DOCUMENT_SEMANTIC_RUNTIME_WIRING=PASS`

No additional scheduler, agent, or competing semantic service was created.

## Targeted Minerva grading

For `CURR-SEMANTIC-LONG-DOCUMENT`:

- Source Coverage: **PASS**, score 100
  - page source lineage
  - context-anchor origin lineage
- Semantic Understanding: **PASS**, score 100
  - keyword/context disambiguation
  - footnote/attribution preservation
  - impossible cross-context refusal
- Accounting Accuracy: `NOT_TESTED`
- Product Truth: `NOT_TESTED`
- Deliverable Truth: `NOT_TESTED`

Result:

- passed dimensions: `2`
- not-tested dimensions: `3`
- global overall status: `INCOMPLETE_DIMENSION_COVERAGE`

That global status is expected because non-target dimensions were deliberately not fabricated. The curated case itself is now `CONTRACT_READY` for its two required target dimensions.

## Regression / build acceptance

Corrected run `35153189326` passed:

- deterministic long-document PDF generation;
- physical native-PDF parsing;
- long-document source/context truth;
- long-document runtime wiring;
- targeted Minerva grading;
- five-dimension curriculum regression;
- five-dimension grading regression;
- universal source-evidence regression;
- task-evidence-sufficiency regression;
- Academy OCR curriculum regression;
- PDF OCR fallback regression;
- mixed native/scanned PDF selective OCR regression after regenerating its isolated fixture with pinned Pillow/PyMuPDF;
- mixed-PDF fail-closed regression;
- production build;
- evidence upload;
- final production build;
- self-cleaning implementation commit.

Two earlier workflow attempts stopped only in regression setup after all new long-document gates had already passed:

1. run `35152973756`: referenced a nonexistent TypeScript mixed-PDF fixture generator;
2. run `35153088446`: corrected to the accepted Python generator but had not installed its pinned PyMuPDF/Pillow test dependencies.

The final run fixed test setup only. No long-document semantic rule was weakened to obtain the green result.

## Curriculum state after acceptance

- total cases: `20`
- contract ready: `18`
- physical fixture required: `2`
- autonomous eligible: `0`

The two remaining physical curriculum cases are the consolidated source-to-dashboard Product Truth case and final deliverable/export lineage case.

## Boundaries

This acceptance does **not** authorize merge or production release.

Still unchanged:

- PR #31 remains draft until separate owner authorization;
- production application remains on `main`;
- Company 1 / Pfizer was not rerun;
- Hermes remains the sole Academy scheduler authority;
- the new case remains `autonomousEligible: false`;
- no production deployment was performed;
- no Codex was used.
