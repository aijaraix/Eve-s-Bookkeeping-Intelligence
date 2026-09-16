# 12 — Universal Source-to-Presentation Lineage

Status: AUTHORITATIVE LAUNCH REQUIREMENT

## Purpose

Lineage in Eve is not a spreadsheet feature. It is a universal evidence requirement across every source type and every material value, statement, calculation, report and rendered UI element.

Permanent rule:

> A material value or statement is not lineage-complete until the exact thing a user sees in the real Eve product can be traced backward through every transformation to the original customer evidence that supports it.

Database persistence, agent accessibility, or canonical fact storage alone is insufficient.

## Universal chain

The required traversal is:

`ORIGINAL CUSTOMER EVIDENCE → SOURCE ELEMENT/REGION → EXTRACTED OBSERVATION → SEMANTIC/ACCOUNTING ASSERTION → NORMALIZED/CANONICAL VALUE → DERIVATION/FORMULA → ACTUAL RENDERED DASHBOARD/REPORT/DOCUMENT OUTPUT`

The reverse traversal must also work:

`ACTUAL RENDERED OUTPUT → DERIVATION/CANONICAL VALUE → SUPPORTING ASSERTIONS/OBSERVATIONS → SOURCE ELEMENT/REGION → ORIGINAL CUSTOMER EVIDENCE`

## Supported source origins

The same lineage contract must work when evidence originates from any combination of:

- spreadsheet cells, ranges or formulas
- native-text PDF pages, tables, rows and text spans
- image-only PDF pages
- receipt photographs
- scanned invoices
- screenshots
- JPEG/PNG/TIFF/HEIC or other supported images
- bank statements
- credit-card statements
- payroll reports
- general-ledger/trial-balance exports
- CSV/TSV rows and columns
- HTML/iXBRL nodes and occurrences
- DOCX paragraphs/tables/cells
- contracts, leases and loan documents
- email/message content and attachments when supported
- customer/reviewer clarification responses
- multiple independent sources that jointly support one conclusion

Lineage must not depend on the source being a spreadsheet.

## Many-to-one evidence

One rendered number may be supported by many source artifacts.

Example:

`Dashboard Ending Cash = $1,243,821`

may derive from:

- Operating Account bank statement page 3 closing balance
- Payroll workbook, Sheet `Cash`, cell G18
- Petty-cash ledger row 87

The displayed value must retain the full operand/source set. A user or reviewer must be able to inspect each contributing source.

## One-to-many usage

One source value may feed multiple outputs.

Example:

`Workbook.xlsx → Sheet Cash → G18`

may be consumed by:

- cash balance KPI
- balance sheet
- liquidity ratio
- reconciliation worksheet
- management report
- Document Wizard deliverable

Eve must be able to answer both:

1. Where did this rendered value come from?
2. Where is this source value used?

## Source-specific coordinates

Each evidence reference must preserve enough information to reopen or highlight the original evidence.

### Spreadsheet

- source artifact/hash
- workbook/sheet
- exact cell/range
- formula where present
- cached/raw value
- number format/type
- relevant merged/hidden state where material

### Image / scanned receipt / image-only page

- original artifact/hash
- original dimensions/page
- exact bounding region
- OCR text/line/token references
- OCR/vision confidence
- preprocessing transform mapping back to original coordinates

### PDF

- original artifact/hash
- physical page
- text span or bounding region
- table/row/cell coordinate where applicable
- native-text vs OCR extraction method

### HTML / iXBRL

- source artifact/hash
- DOM selector/anchor
- XBRL concept/context/unit/dimension where applicable
- byte/text offsets where useful

### CSV / structured rows

- source artifact/hash
- row/column or field coordinate
- raw literal

### Narrative / contextual documents

- page/section/paragraph/message reference
- speaker/author/signer attribution where applicable
- exact supporting text/region

### Clarification

- original unresolved source reference
- clarification question
- responding principal
- response timestamp
- answer/attachment
- resulting accounting or semantic decision

## Transformation lineage

Every transformation that materially changes interpretation or presentation must remain inspectable.

Examples:

- OCR `$57.O5` plus visual verification → `$57.05`
- source string `(1,234)` → numeric `-1234`
- source value in millions → base-unit normalization
- currency conversion
- percentage normalization
- aggregation/sum
- formula derivation
- rounding or display scaling
- classification or account mapping

The final UI may show only the clean result, but evidence inspection must expose the transformation chain.

## Real-product acceptance standard

Backend lineage is not sufficient acceptance.

A lineage feature is accepted only when the real customer/owner/reviewer interface renders the value and a browser-level check can traverse from that rendered element back to the underlying source evidence.

At minimum, the product must support:

1. identify the exact rendered widget/cell/KPI/report statement
2. resolve its canonical/derived fact ID
3. resolve all derivation operands
4. resolve each operand's provenance/evidence references
5. open the original source artifact
6. highlight or identify the exact supporting region/cell/node
7. show the raw literal and normalized value
8. show transformation/formula history
9. show verification and clarification state

The reverse path should identify all current rendered consumers of a selected source fact/value.

## Mixed-document evidence

A customer may upload a combined evidence set rather than one authoritative document.

Example batch:

- twelve bank statements
- 800 receipt images
- three spreadsheets
- ten invoices
- lease agreement
- customer clarification

A conclusion may combine evidence from several classes. Eve must maintain a graph of the contributing evidence rather than force the conclusion to choose one nominal source document.

## Document Wizard requirement

Document Wizard output must use the same universal evidence graph.

Material numeric statements trace through accounting/derivation lineage.

Material narrative, identity, date, signer, contract-term or management-assertion statements trace through semantic/context lineage.

A deliverable is not evidence-complete merely because its numbers came from canonical facts; material narrative claims must also resolve to original evidence.

## Dashboard and report invariants

- No material rendered number without canonical/derived lineage.
- No material derived number without operand lineage.
- No operand without source provenance or a documented derivation from sourced parents.
- No OCR-promoted value without an exact original image/page region once OCR support is enabled.
- No spreadsheet-promoted value without exact sheet/cell-or-range evidence once spreadsheet lineage upgrade is complete.
- No material narrative claim without semantic/source lineage.
- No source gap is hidden merely because the affected value still renders.
- The real UI, exported report and generated deliverable must not diverge from the authoritative provenance graph.

## Academy requirement

Academy must grade the full source-to-presentation chain, not merely backend extraction.

For selected benchmark facts/claims it should verify:

`SOURCE → EXTRACTION → NORMALIZATION → CANONICAL/DERIVATION → REAL UI/REPORT → REVERSE TRACE BACK TO SOURCE`

A case fails if:

- the backend has the correct value but the UI shows something different
- the UI shows the correct value but its source reference is broken
- the correct source exists but the wrong source is attached
- one formula operand is missing from lineage
- a generated report/document uses a claim that cannot resolve to evidence

## Implementation consequence

`EVE-P1-003` is therefore a UNIVERSAL SOURCE-TO-PRESENTATION lineage task.

`EVE-P1-004` is the spreadsheet-specific adapter into that universal contract, not the overall lineage feature.

OCR/image, PDF, HTML/iXBRL, CSV, DOCX, clarification and future email connectors must implement the same universal contract.
