# 02 — Universal Document Intelligence and Document IR

## Objective

Every source format must be converted into a durable, scoped, lossless internal representation before semantic or accounting interpretation. The downstream accounting system should not care whether a value originated in PDF, HTML/iXBRL, XLSX, CSV, DOCX, image, scan, email, or another supported format.

## Universal pipeline

1. Binary/source intake.
2. Source preservation and hashing.
3. Physical reconstruction.
4. Structural reconstruction.
5. Source-element inventory.
6. Observation/attribute extraction.
7. Semantic interpretation.
8. Accounting interpretation.
9. Verification and contradiction detection.
10. Knowledge-graph population.
11. Presentation mapping.
12. Extraction reconciliation.

## Document IR

Create one normalized Document Intermediate Representation (`DocumentIR`) per source artifact.

Example hierarchy:

`Document → Page/Section → Element → Child Elements → Observations → DataPoint references`

A PDF may contain:

- pages and page geometry
- text blocks and reading order
- headings
- paragraphs
- tables
- rows
- cells
- headers/footers
- captions
- footnotes
- charts
- diagrams
- images
- annotations
- signatures/certifications

An XLSX may contain:

- workbook
- sheets
- named ranges
- tables/ranges
- rows
- columns
- cells
- formulas
- formatting relevant to totals/subtotals
- merged cells
- comments/notes

An HTML/iXBRL document may contain:

- DOM nodes
- sections/headings
- paragraphs
- tables
- Inline XBRL occurrences
- concepts
- contexts
- units
- dimensions
- custom taxonomy concepts
- nil/duplicate facts
- links/cross-references

## Stable identity

Every source artifact, structural element, observation, and derived object needs a stable identifier.

A downstream data point should be able to say, for example:

`DOC-17 → PAGE-84 → TABLE-12 → ROW-7 → CELL-4 → OBS-9211 → DP-49218`

## Zero unaccounted information loss

Nothing detected is conceptually discarded.

Every source element receives a disposition such as:

- `PRESERVED_STRUCTURED_MATERIAL`
- `PRESERVED_SEMANTIC_MATERIAL`
- `PRESERVED_STRUCTURAL_REPETITIVE`
- `PRESERVED_PRESENTATION_ONLY`
- `PRESERVED_DOCUMENT_COORDINATE`
- `PRESERVED_DUPLICATE_CORROBORATING`
- `PRESERVED_REVIEW_REQUIRED`
- `PRESERVED_UNSUPPORTED`

Avoid destructive terms like “discarded” when the information was detected. Lower downstream priority does not erase existence.

## Footer example

A footer is still information. It can produce attributes/data such as:

- element type = footer
- page number
- bounding box
- raw text
- repeated-across-pages
- contains company name
- contains filing type
- contains page number
- classification = structural/repetitive
- accounting relevance = none or contextual
- disposition = preserved, not promoted

If the footer says `Unaudited`, `Restated`, `Confidential`, or identifies a legal entity, that can materially affect interpretation.

## Atomic DataPoint definition

A DataPoint is the smallest independently meaningful piece of information that can be contextualized and traced to evidence.

Do not optimize for count. Do not treat every word as a data point. Do not treat a whole paragraph as one data point if it contains independently meaningful components.

Example sentence:

“German revenue increased 12% to €840 million in FY2025 primarily due to enterprise customer growth.”

Potential DataPoints:

- geography = Germany
- metric = revenue
- value = 840,000,000
- currency = EUR
- period = FY2025
- change = +12%
- comparison period = FY2024
- causal factor = enterprise customer growth

Then create relationships that preserve context.

## Source inventory denominators

Report separately:

- documents
- pages/logical sections
- sections
- headings
- paragraphs
- tables
- table rows
- table cells
- XBRL occurrences
- footnotes
- lists
- charts
- diagrams
- images
- captions
- cross-references
- signatures/certifications

Distinguish container elements from leaf elements. Never claim a total that is inconsistent with child counts.

## Format-specific deterministic first strategy

Use the strongest deterministic structure available before LLM interpretation:

- HTML/iXBRL: DOM and XBRL parser first.
- XLSX: workbook/cell/formula parser first.
- CSV: typed row/column parser first.
- DOCX: document XML structure first.
- PDF: layout/text/table/visual reconstruction first; OCR only when needed.
- Image/scan: layout + OCR + confidence + visual preservation.
- Email: sender/recipient/time/thread/body/attachments.

Local Qwen or cloud models should interpret unresolved semantics, not substitute for parsers that already expose exact structure.

## Deep financial extraction

For financial statements, capture all material rows, subtotals, comparative periods, units, currencies, and entity scope—not only headline totals.

Each footnote should become its own structured sub-document with sections, tables, data points, relationships, accounting assertions, and unresolved items.

## Narrative and visuals

Narrative assertions remain attributed to the source speaker/management when appropriate. Visuals are inventoried and interpreted where reliable. When not reliably interpretable, preserve them and mark review-required rather than making them disappear.

## Contradiction checks

Where possible compare:

- XBRL vs statement
- statement vs footnote
- MD&A vs footnote
- chart vs table
- entity diagram vs legal-entity list
- current-year comparatives vs prior-year filings
- uploaded schedules vs published documents

## Completion states

Suggested document states:

- `STRUCTURE_INVENTORIED`
- `EXTRACTION_IN_PROGRESS`
- `STRUCTURED_EXTRACTION_COMPLETE`
- `SEMANTIC_EXTRACTION_COMPLETE`
- `MATERIAL_GAPS_REMAIN`
- `DEEP_UNDERSTANDING_VERIFIED`

`DEEP_UNDERSTANDING_VERIFIED` requires source-side coverage evidence, not merely correct headline values.
