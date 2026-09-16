# Universal Source Evidence Contract Acceptance — 2026-09-16

Task: `EVE-P1-003`
Branch: `feature/universal-evidence-ocr-foundation`
Tested branch commit: `c6d47c7f486780e8c30cde58ceff906b84992f6c`
Status: CONTRACT IMPLEMENTED AND ISOLATED RUNTIME TEST PASSED; parser/render integrations remain follow-on work.

## Implemented

Added shared contract module:

`src/lib/evidence/universalSourceEvidence.ts`

The contract provides one source-agnostic evidence model for:

- PDF page/region/text/table coordinates
- image/OCR regions and bounding boxes
- spreadsheet workbook/sheet/cell/range/formula coordinates
- CSV row/column coordinates
- HTML DOM/byte/text coordinates
- iXBRL concept/context/unit coordinates
- DOCX paragraph/table/cell/run coordinates
- email message/header/body/attachment coordinates
- text line/byte coordinates
- explicit other-source locators

It also defines:

- provenance lineage kind
- normalized/raw value context
- transformation history
- materiality and verification state
- parent provenance relationships for calculations/derivations
- presentation usage references for actual dashboard/report/document outputs
- browser/report presentation verification state
- coordinate and provenance validation
- recursive parent-to-physical-source traversal
- cycle/unresolved-parent detection
- rendered-lineage completeness evaluation

## Critical presentation invariant

A material rendered value is not considered lineage-complete merely because backend evidence exists.

`evaluateRenderedLineageCompleteness(...)` requires both:

1. a complete physical-source provenance path, and
2. a physically confirmed presentation usage.

For dashboard output, the usage must be `BROWSER_RENDER_CONFIRMED`.

For report/document output, `REPORT_RENDER_CONFIRMED` or a browser-confirmed presentation may satisfy presentation verification.

This preserves the owner requirement that the actual value seen by a customer/reviewer must match and participate in the evidence chain.

## Mixed-source acceptance

The test case models one dashboard value derived from:

- a spreadsheet source coordinate (`Cash_Workpaper.xlsx`, sheet `Cash`, cell `G18`), and
- a receipt image OCR region.

The recursive tracer resolves both physical source coordinates through the derived dashboard value.

## Negative tests

The contract test also proves fail-closed behavior for:

- a source observation with no source coordinate
- a dashboard presentation that is only server-registered and not browser-confirmed
- cyclic provenance relationships

## Physical test method

No production application files were changed.

The exact integration branch was shallow-cloned to the connected host. The contract and test were copied into an isolated `/tmp/eve-contract-test` directory inside the current Eve Node 22 web container. The committed `.js` module import was rewritten only in the temporary runtime copy to `.ts` so Node 22 native TypeScript stripping could execute the isolated test without installing dev dependencies.

Executed result:

`UNIVERSAL_SOURCE_EVIDENCE_CONTRACT_TESTS=PASS`

Additional marker:

`RUNTIME_CONTRACT_TEST=PASS`

The temporary runtime directory was removed after the test.

## Files changed on branch

- `src/lib/evidence/universalSourceEvidence.ts`
- `server/tests/universalSourceEvidenceContract.test.ts`
- this acceptance record

## Not yet claimed

This acceptance does NOT yet claim:

- SpreadsheetParser emits exact cell/range coordinates in production.
- OCRParser emits real OCR regions in production.
- current RenderRegistry is fully bridged into this contract.
- current customer dashboard drill-down uses this contract.
- Academy grades this contract across live UI journeys.

Those are follow-on integration tasks.

## Next implementation step

`EVE-P1-004` — adapt spreadsheet ingestion to emit exact workbook/sheet/cell/range/formula evidence into this universal contract, then connect the resulting provenance through existing canonical/render lineage to a browser-confirmed actual dashboard value.

`EVE-P1-003_CONTRACT_IMPLEMENTATION = PASS`
`EVE-P1-003_RUNTIME_TEST = PASS`
`EVE-P1-003_FULL_PRODUCT_INTEGRATION = IN_PROGRESS`
