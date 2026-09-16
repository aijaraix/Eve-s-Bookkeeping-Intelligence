# Source-to-Value Provenance Gap Audit — 2026-09-15

Task: `EVE-P1-003`
Status: DESIGN / GAP AUDIT COMPLETE; code integration remains active work.

## Existing capabilities to preserve

Eve already contains substantial lineage infrastructure. Do not replace it.

### Raw source / evidence layer

`deepDocumentIntelligenceEngine.ts` already defines `RawEvidenceRecord` with:

- evidenceId
- documentId
- sourceSha256
- byte offsets
- DOM selector/anchor
- page number
- snippet text

It also defines `DocumentElement` location information for page/section/table/row/column and source content/disposition.

### Semantic layer

`SemanticFact` already supports:

- source element IDs
- page/section/table/DOM evidence coordinates
- confidence
- verification status
- numeric/string values and period/currency context

### Canonical accounting layer

`CanonicalFinancialFact` already carries:

- canonical fact ID
- document/workspace
- normalized metric/value/currency/period/entity
- supporting semantic fact IDs
- supporting evidence IDs
- verification stage
- Euclid variance

### Physical truth eligibility

`truthEligibilityGate.ts` already supports:

- source artifact path
- claimed source SHA
- source element ID
- raw source content
- project/engagement scope
- physical file existence verification
- SHA-256 verification
- placeholder/empty-source rejection
- source-content resolution checks
- fail-closed behavior on broken source lineage

### Deep filing datapoints

`AuthoritativeDataPoint` already includes:

- sourceElementId
- sourceArtifactPath
- sourceSha256
- raw literal
- normalized value
- period/currency/scale
- XBRL tag/context when relevant

### Formula / render layer

Client and server RenderRegistry implementations already support:

- fact lineage ID
- canonical fact ID
- derived calculation ID
- entity/period/currency
- normalized value/display value
- verification state
- formula
- operand fact IDs
- operand values
- render registration
- source-to-render / render-to-source lookup

This means Eve already has the backbone for `SOURCE → FACT → CANONICAL → DERIVATION → RENDER`.

## Missing universal contract

The current lineage structures are format-specific and distributed. There is no single coordinate/provenance shape that can represent all of:

- PDF page + bounding box/text span
- image bounding box + OCR region/token/line confidence
- spreadsheet workbook/sheet/cell/range/formula
- HTML DOM node / selector / byte range
- iXBRL concept/context/unit occurrence
- DOCX paragraph/table/cell/run
- CSV row/column
- email message/header/body/attachment location

Without this, a canonical fact may have evidence IDs, but the final UI cannot reliably expose the exact same structured evidence interaction across all source types.

## Proposed universal source coordinate

A reusable source coordinate should carry a discriminated source kind and stable optional fields.

Conceptual structure:

```ts
interface UniversalSourceCoordinate {
  coordinateId: string;
  sourceArtifactId: string;
  sourceSha256: string;
  sourceType: 'PDF'|'IMAGE'|'SPREADSHEET'|'CSV'|'HTML'|'IXBRL'|'DOCX'|'EMAIL'|'TEXT'|'OTHER';

  pageNumber?: number;
  pageLabel?: string;
  boundingBox?: { x:number; y:number; width:number; height:number; unit:'PX'|'POINT'|'NORMALIZED' };
  byteStart?: number;
  byteEnd?: number;
  textStart?: number;
  textEnd?: number;

  workbookName?: string;
  sheetName?: string;
  cellAddress?: string;
  rangeAddress?: string;
  rowIndex?: number;
  columnIndex?: number;
  formula?: string;

  domSelector?: string;
  domAnchor?: string;
  xbrlConcept?: string;
  xbrlContextRef?: string;
  xbrlUnitRef?: string;

  rawLiteral?: string;
  normalizedLiteral?: string;
  confidence?: number;
  extractionMethod?: string;
  extractionVersion?: string;
}
```

The exact implementation may split format-specific coordinate payloads into a discriminated union, but the API contract must expose one common traversal surface.

## Proposed value provenance envelope

Every promoted material value should be able to resolve to:

```ts
interface SourceValueProvenance {
  provenanceId: string;
  tenantId?: string;
  workspaceId?: string;
  engagementId?: string;

  sourceArtifactId: string;
  sourceSha256: string;
  sourceElementIds: string[];
  coordinates: UniversalSourceCoordinate[];

  rawLiteral?: string;
  normalizedValue?: number|string|boolean|null;
  currency?: string;
  unit?: string;
  scale?: string;
  period?: string;
  entityId?: string;

  observationIds?: string[];
  semanticFactIds?: string[];
  canonicalFactId?: string;
  clarificationIds?: string[];

  transformationSteps: ProvenanceTransformationStep[];
  verificationState: 'PROVISIONAL'|'VERIFIED'|'REVIEW_REQUIRED'|'UNSUPPORTED';
}
```

## Transformation history

Normalization must remain inspectable. Suggested transformation step fields:

- stepId
- operation type
- input reference(s)
- input literal/value
- output literal/value
- currency/unit/scale before/after
- formula/parser/model version
- rounding policy
- timestamp

Examples:

- OCR text `$1,234.50` → numeric `1234.50`
- spreadsheet percent `0.125` → display `12.5%`
- source scale `millions` × 1,000,000
- negative represented by parentheses
- FX conversion
- formula derivation
- aggregation/sum

## Formula lineage gaps

Current RenderRegistry formula lineage records operand IDs and values, which is good. Gaps to close:

- entity/period/currency context on the derivation itself
- formula/engine version
- rounding/scale policy
- output canonical/derived fact reference
- explicit provenance IDs for each operand
- durable persistence of all display conversion lineage
- a single traversal API from derivation operand back to source coordinate

## Spreadsheet-specific gap

Current `SpreadsheetParser` converts sheets to row arrays, which loses important evidence-level details:

- exact cell address
- formula vs cached value
- number format
- cell type
- merged-cell range
- hidden row/column/sheet state
- original worksheet range

For Eve's evidence contract, promoted spreadsheet values must retain at least sheet + cell/range address and formula/value metadata.

## Image/OCR-specific gap

Current `OCRParser` is a placeholder, so there are no real OCR text-region coordinates today.

Real image evidence needs:

- original image dimensions/hash
- normalized render transform if used
- detected region/line/token bounding boxes
- OCR text and confidence
- semantic field-to-region links
- promoted value-to-region links

If a normalized/deskewed image is created, preserve the transform mapping back to original coordinates.

## PDF-specific gap

Native-text PDF already has page inventory/text, but exact evidence drill-down needs:

- page coordinate/text-span references for promoted values
- table/row/cell regions where used
- native text vs OCR source distinction
- image-only page fallback

## UI contract

The customer/reviewer evidence drawer should eventually support one interaction regardless of source type:

1. show normalized fact/value
2. show source artifact and location
3. open/highlight exact evidence region/cell/node
4. show raw literal
5. show normalization/transformation steps
6. show verification/clarification state
7. show formulas/derived parents where applicable

## Invariants

- No material canonical fact without at least one source/evidence path unless explicitly classified as a derivation from parent facts.
- No material derivation without operand IDs.
- No material render without canonical/derived lineage.
- No spreadsheet value without exact sheet/cell-or-range evidence once spreadsheet lineage upgrade is complete.
- No OCR-promoted value without exact image/page region once OCR support is enabled.
- Source SHA remains stable across the full chain.

## Recommended implementation order

1. add a universal coordinate/provenance type module compatible with existing IDs
2. extend SpreadsheetParser to emit exact cell/range evidence metadata
3. extend canonical promotion adapters to carry provenance IDs
4. replace OCR placeholder with region-aware OCR/vision
5. extend formula lineage with provenance/period/entity/currency/version
6. expose one server trace API for source ↔ fact ↔ derivation ↔ render
7. add UI evidence drill-down by source type
8. Academy grades lineage coverage and exact drill-down

## Conclusion

Eve does NOT need a new evidence architecture. It needs a universal adapter/contract connecting the strong lineage pieces that already exist.

`EVE-P1-003_GAP_AUDIT = COMPLETE`
`EVE-P1-003_IMPLEMENTATION = IN_PROGRESS`
