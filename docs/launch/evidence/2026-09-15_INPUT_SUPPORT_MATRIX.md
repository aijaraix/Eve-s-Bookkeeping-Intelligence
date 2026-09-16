# Current Input / Parser Support Matrix — 2026-09-15

Task: `EVE-P1-001`
Status: DONE for source/runtime inventory; runtime accuracy benchmarking remains separate tasks.

Evidence basis: current `main` parser/router source, accepted Academy pathway, runtime dependency/model inventory.

## Status definitions

- `VERIFIED_BASELINE` — current pathway has physical/runtime evidence for the stated limited capability.
- `PARTIAL` — code path exists and can extract useful information, but launch-required completeness/provenance is incomplete.
- `ROUTED_PLACEHOLDER` — router recognizes the input but parser is not a real extraction implementation.
- `NOT_SUPPORTED` — no current production intake/parser path identified.
- `NOT_BENCHMARKED` — implementation exists, but ordinary-bookkeeping quality has not been physically benchmarked.

## Matrix

| Input / document family | Current route | Current status | What works now | Major launch gaps |
|---|---|---|---|---|
| HTML / iXBRL corporate filing | Deep filing pipeline / HTML paths | VERIFIED_BASELINE for current corporate-file work | deterministic HTML/XBRL extraction, structured corporate facts, existing deep filing/DocumentIR work | ordinary generic HTML path consistency; full DOM/source-coordinate provenance across all upload routes |
| Native-text PDF | `AnyDocParser` + `pdf-parse` | VERIFIED_BASELINE / PARTIAL | real PDF page inventory and per-page native text; accepted Academy PDF flow | table/layout extraction, exact text coordinates, image regions, image-only page fallback, broader document-family benchmarks |
| Image-only/scanned PDF | currently still `AnyDocParser` | NOT_SUPPORTED for real OCR | page inventory may exist even when native text is absent | no automatic OCR/vision fallback; no region-level evidence; no scan quality/orientation handling |
| PNG/JPG/JPEG/WEBP/TIFF | router → `OCRParser` | ROUTED_PLACEHOLDER | file classification/routing exists | `OCRParser` currently returns placeholder text, not OCR; no token/region coordinates/confidence |
| HEIC/HEIF | no explicit route | NOT_SUPPORTED | none verified | format decode/conversion + OCR/vision path required |
| XLSX | `SpreadsheetParser` / SheetJS | PARTIAL | workbook opens; iterates sheets; converts sheet data to row arrays; preserves sheet names in table objects | exact cell/range addresses, formulas vs values, formatting/units, merged/hidden sheets/cells, formula lineage, source-to-cell provenance |
| XLS | `SpreadsheetParser` / SheetJS | PARTIAL / NOT_BENCHMARKED | router sends XLS to SheetJS | ordinary client benchmark; exact cell/formula provenance |
| CSV/TSV | `SpreadsheetParser` / SheetJS | PARTIAL / NOT_BENCHMARKED | router sends CSV/TSV to spreadsheet parser and SheetJS can ingest tabular buffers | typed column semantics, stable row/cell source IDs, explicit delimiter/encoding quality, benchmark |
| DOCX | `AnyDocParser` + Mammoth | PARTIAL | raw text extraction | paragraph/table/style/footnote/comment/signature structure, exact source coordinates/relationships |
| legacy DOC | routed as word document | NOT_BENCHMARKED / unsafe to claim | route exists | current parser is DOCX-oriented; binary DOC reliability not established |
| TXT / Markdown / LOG | `AnyDocParser` | PARTIAL | plain text preserved/extracted | richer structural/semantic benchmarks as needed |
| JSON | `AnyDocParser` as text | PARTIAL | raw text can be retained | structured JSON parsing/schema/source-path provenance not first-class |
| ZIP / nested archive | `jszip` dependency exists but no intake route identified | NOT_SUPPORTED | library available in repo | secure archive manifest, decompression limits, nested artifact IDs, duplicate handling, batch routing |
| Email/message + attachments | no production intake path identified | NOT_SUPPORTED | none verified | sender/recipient/time/thread/body/attachment preservation + routing |
| Receipt photo | image route exists but OCR placeholder | NOT_SUPPORTED for real extraction | none beyond routing | OCR/vision, merchant/date/tax/total/line items, coordinates/confidence, duplicate matching, accounting mapping |
| Scanned invoice | image route exists but OCR placeholder | NOT_SUPPORTED for real extraction | none beyond routing | OCR/vision, invoice schema, multi-page linking, totals/tax/vendor/PO fields, evidence regions |
| Native-text invoice PDF | PDF text route | PARTIAL / NOT_BENCHMARKED | native text can be extracted | invoice-specific classification/schema, table/layout evidence, benchmark |
| Bank statement native PDF | PDF text route | PARTIAL / NOT_BENCHMARKED | page/native text extraction | transaction-table reconstruction, balances, continuity/materiality logic, exact evidence positions |
| Bank statement scanned PDF | no OCR fallback | NOT_SUPPORTED | none reliable | scan OCR + transaction extraction + continuity/reconciliation |
| Credit-card statement | generic PDF path | PARTIAL / NOT_BENCHMARKED | native text only where present | transaction reconstruction, page completeness, reconciliation, family-specific benchmark |
| GL / trial balance workbook | spreadsheet route | PARTIAL | row-array extraction | account/period/entity recognition, exact cell/range lineage, formula handling, benchmark |
| AP/AR aging workbook | spreadsheet route | PARTIAL | row-array extraction | table/entity/date semantics + cell provenance + benchmark |
| Large mixed customer dump | no explicit Batch Intake Manifest/orchestrator identified | NOT_SUPPORTED as launch-grade capability | individual file upload/processing primitives exist | batch manifest, archive/folder handling, backpressure, checkpoint/resume, progress, clarification aggregation, cost controls |
| Exact duplicate artifact | source hashing exists in evidence architecture but no complete mixed-batch dedupe flow established | PARTIAL | SHA/source hashes exist in current system | batch occurrence model + processing reuse + owner/customer presentation |
| Near-duplicate artifact | no launch-grade flow identified | NOT_SUPPORTED | none verified | perceptual/structural similarity candidates + safe corroboration rules |

## Current router behavior

`FileRouter` currently recognizes:

- spreadsheet: `xlsx`, `xls`, `csv`, `tsv`
- PDF
- images: `png`, `jpg`, `jpeg`, `webp`, `tiff`
- HTML/HTM
- DOCX/DOC
- TXT/MD/JSON/LOG

This is useful because the extension points already exist. The largest issue is parser depth, not the lack of a router.

## Critical image/OCR finding

Current `OCRParser` is not an OCR implementation. It constructs placeholder content:

`[OCR Text Content for <filename>]`

Therefore no marketing, customer support matrix, Academy score, or launch acceptance should claim receipt/photo/scanned-image OCR based on the current parser.

## Current spreadsheet finding

`SpreadsheetParser` uses SheetJS to read the workbook and iterates all `workbook.SheetNames`, then converts each sheet through `sheet_to_json(..., {header: 1})` into headers and row arrays.

This is a useful ingestion baseline but not sufficient for Eve's evidence standard because it does not currently persist exact cell addresses/formulas/formatting/merged/hidden structure into the canonical document model.

## Current native PDF finding

`AnyDocParser` uses `pdf-parse` and preserves the returned page list, page number, page text, total page count and a `native_text_available` manifest flag. Parser failure is allowed to propagate rather than treating binary PDF bytes as text evidence.

This is a good safety behavior. However, image-only pages have no OCR fallback in the current path.

## Current available dependencies / runtime

Node dependencies relevant to intake include:

- `xlsx`
- `pdf-parse`
- `pdf-lib`
- `mammoth`
- `jszip`
- `@google/genai`

No dedicated OCR/CV dependency is present in the current Node package list.

Runtime local AI physically contains:

- `qwen3.5:4b-q4_K_M` via Ollama

Vision/OCR capability and quality of that exact local model have NOT yet been proven; do not assume it is adequate merely because it is installed.

## Immediate implications

1. Do not rebuild the existing deterministic parsers.
2. Add source-cell provenance to the spreadsheet path rather than replacing SheetJS.
3. Replace the placeholder OCR path with a benchmarked OCR/vision pipeline.
4. Add automatic detection/routing for image-only PDF pages.
5. Add a Batch Intake Manifest/orchestrator in front of individual artifact processing.
6. Build document-family extraction on top of universal source evidence rather than one monolithic LLM parser.
7. Keep the public supported-format list conservative until each family has Academy/runtime benchmarks.

## Next tasks unlocked

- `EVE-P1-003` Source-to-value provenance envelope
- `EVE-P1-004` Spreadsheet source lineage audit/implementation
- `EVE-P1-005` OCR/vision architecture benchmark
- `EVE-P1-006` Document classification router extension
- `EVE-P1-011` Bulk queue/backpressure design

`EVE-P1-001_SOURCE_INVENTORY = COMPLETE`
