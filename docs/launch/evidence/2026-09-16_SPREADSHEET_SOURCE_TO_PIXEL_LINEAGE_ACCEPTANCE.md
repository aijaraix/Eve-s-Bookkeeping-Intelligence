# Spreadsheet Source-to-Pixel Lineage Acceptance — 2026-09-16

Task: `EVE-P1-004`
Branch: `feature/universal-evidence-ocr-foundation`
Implementation commit under test: `61299a067e4653123f72fb00db95602eb5f778df`
Status: IMPLEMENTATION, BUILD, AND REAL PRACTICE-HOME BROWSER LINEAGE PASS

## Objective

Prove that spreadsheet evidence is not merely retained in backend storage. A material spreadsheet-derived value must preserve its exact source location through extraction, persistence, presentation adaptation, the actual Eve Practice Home dashboard, and the real provenance drawer the user sees.

Required chain:

`original spreadsheet → workbook/sheet/cell/formula evidence → extracted fact → persisted accounting fact → presentation adapter → actual Practice Home rendered value → provenance drawer → original spreadsheet coordinate`

## Implemented source evidence

`SpreadsheetParser` now preserves source-level spreadsheet evidence including:

- physical file SHA-256
- stable source artifact ID
- workbook name
- sheet name
- exact cell address
- worksheet range
- row / column index
- formula where present
- cached cell value
- number format
- cell type
- merged range where applicable
- hidden sheet / row / column state when available
- raw literal
- normalized literal
- parser method/version
- per-cell provenance ID
- sheet-level manifest

CSV/TSV inputs use the same universal contract with row/column coordinates rather than pretending to be workbook cells.

## Fact promotion and persistence

The spreadsheet table-to-fact path now binds the numeric fact to the actual value-cell evidence and also retains the row-label evidence where available.

Promoted facts can carry:

- `sourceProvenanceId`
- `sourceProvenanceIds`
- `sourceCoordinate`
- `sourceCoordinates`
- `provenanceCoordinates`
- source provenance records
- universal provenance envelope
- source artifact/hash
- sheet/cell/formula/number-format metadata

The web ingestion persistence boundary was updated so these fields are not dropped when worker results are written into durable Eve accounting state.

## Actual customer/practice presentation path

The implementation follows the real active Eve path rather than an unused demonstration dashboard:

`persisted fact → presentationAdapters → PracticeHomeView → financial identity button → App onInspectFact → EveProvenanceDrawer`

`StatementLinePresentation` / `SourceToPixelMetadata` now retain the source coordinate and provenance data required by that path.

The actual Practice Home financial identity buttons expose machine-readable lineage attributes:

- `data-fact-lineage-id`
- `data-render-id`
- `data-source-provenance-id`
- `data-source-type`
- `data-source-location`

The provenance drawer is source-type-aware. Spreadsheet evidence displays:

- workbook
- exact `Sheet!Cell` locator
- formula or literal-value state
- cached/parsed value
- number format
- provenance ID
- source SHA through the common evidence metadata

## Automated implementation tests

A synthetic XLSX fixture contains a balance-sheet workpaper with:

- Total Assets
- Total Liabilities
- Total Equity
- formula cell `Balance!B4 = B2-B3`
- cached value `40`
- number format `$#,##0.00`
- hidden column metadata

The test verifies exact parser evidence and the presentation adapter handoff.

Passed:

- `UNIVERSAL_SOURCE_EVIDENCE_CONTRACT_TESTS=PASS`
- `SPREADSHEET_SOURCE_TO_PIXEL_LINEAGE_TESTS=PASS`
- existing presentation-adapter regression suite
- production Vite/server/worker build

The existing Pfizer presentation regression remained passing and no Pfizer rerun was performed.

## GitHub Actions acceptance

One-shot branch-only workflow run:

- Run ID: `35044400296`
- Result: `success`

Successful gates included:

1. bounded patch application
2. dependency install
3. universal evidence contract regression
4. spreadsheet source-to-pixel lineage test
5. presentation adapter regression
6. production build
7. tested branch commit

The temporary patch script and one-shot workflow removed themselves after the tested commit. `main` was not changed.

## Real browser proof of the actual Practice Home path

A temporary isolated Vite instance was built from the exact feature-branch implementation. It used only synthetic API responses and no production customer storage or credentials.

A real headless Chromium session from the existing Hermes browser runtime opened the real Eve application with `PracticeHomeView` active.

The browser physically located the rendered financial identity button with:

- fact lineage ID: `fact-equity`
- render ID: `RND-mu3fpz1i-g4hu`
- source provenance ID: `prov-balance-b4`
- source type: `SPREADSHEET`
- source location: `Balance!B4`
- rendered text containing `$400,000`

The browser clicked that exact rendered dashboard value.

The real `EveProvenanceDrawer` opened and the browser verified the presence of:

- `Synthetic_Balance.xlsx`
- `Balance!B4`
- formula `=B2-B3`
- number format `$#,##0.00`
- provenance ID `prov-balance-b4`
- `Raw Source Value`

Physical browser marker:

`P1_004_REAL_PRACTICE_HOME_BROWSER_LINEAGE=PASS`

## Safety/isolation

- No production workspace was modified.
- No production customer evidence was used.
- No production login credential was used.
- No Pfizer rerun was performed.
- Temporary Kubernetes proof pods/services were removed after execution.
- `main` remained untouched.

## Acceptance conclusion

The feature branch now proves spreadsheet lineage across both sides of the product boundary:

1. exact spreadsheet source evidence survives ingestion/persistence, and
2. the actual rendered Practice Home value visibly and machine-readably links back to that evidence.

This is the required pattern for later PDF/image/OCR/CSV/document adapters as well; spreadsheet evidence is only one source adapter into the universal provenance system.

`EVE-P1-004_IMPLEMENTATION = PASS`
`EVE-P1-004_BUILD = PASS`
`EVE-P1-004_REAL_PRACTICE_HOME_BROWSER_PROOF = PASS`
`EVE-P1-004_MAIN_MERGE = NOT_YET_PERFORMED`

## Next implementation step

`EVE-P1-005` — replace the placeholder OCR path with the local OCR adapter architecture, beginning with the common OCR result contract and PaddleOCR primary / docTR fallback integration behind the same universal source-evidence model.
