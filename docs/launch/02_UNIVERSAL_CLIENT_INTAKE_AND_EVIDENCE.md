# 02 — Universal Client Intake and Evidence

## Objective

Extend Eve from strong structured/corporate-document processing into a production intake system suitable for real CPA/bookkeeping customers who may submit thousands of mixed files, tiny receipts, phone photos, scanned PDFs, spreadsheets, exports, contracts, emails and duplicates.

Do not replace the existing Universal Document IR / zero-loss model. Build the ordinary-client intake fabric in front of it and preserve all source evidence through it.

## Batch-first intake model

A customer upload is a `Batch`, not merely a list of unrelated files.

Each batch must have a durable manifest containing at minimum:

- batchId
- tenantId
- workspace/engagementId
- uploader principal
- receivedAt
- artifact count
- aggregate bytes
- physical/logical page-image-sheet count where knowable
- unique artifact count
- exact duplicate count
- near-duplicate candidate count
- classified count
- review-required classification count
- unsupported/unreadable count
- processing status totals
- clarification totals
- source completeness summary
- task evidence sufficiency summary where a defined task exists

Customer-visible progress should be granular rather than one indefinite spinner.

## Artifact preservation

Every incoming artifact must be preserved before interpretation.

Required source metadata:

- sourceArtifactId
- original filename
- MIME/detected type
- byte size
- SHA-256
- upload batch
- tenant/workspace/engagement
- uploader/source channel
- received timestamp
- original bytes/persisted location
- parser/extraction versions used

Original evidence is immutable. Derived representations reference it; they do not replace it.

## Input classes

Production intake must plan for:

- PDF native text
- PDF image-only/scanned
- JPEG/JPG
- PNG
- HEIC/HEIF where practical
- TIFF/multi-page TIFF
- DOCX
- XLS/XLSX
- CSV/TSV
- HTML/iXBRL
- TXT/Markdown
- email/message + attachments when connectors are added
- ZIP/archive + nested folders when safely supported
- screenshots
- receipts
- invoices/bills
- credit memos
- bank statements
- credit-card statements
- merchant-processor statements
- payroll reports
- GL/trial balance
- AP/AR aging
- tax forms/returns
- contracts/leases/loans
- prior financial statements/workpapers
- unknown/mixed artifacts

Unsupported formats are preserved and explicitly dispositioned; they are never silently dropped.

## Processing funnel

`RECEIVE → PRESERVE → INSPECT → DEDUPLICATE → CLASSIFY → RECONSTRUCT → EXTRACT → UNDERSTAND → ACCOUNT → RECONCILE → CLARIFY → REVIEW → DELIVER`

Each boundary must persist input/output references and reconcile handoffs.

## Deterministic first

Use deterministic structure before model reasoning whenever available:

- PDF page inventory/native text/layout first
- XLSX workbook/sheet/cell/formula parser first
- CSV typed rows/columns first
- HTML/iXBRL DOM/XBRL first
- DOCX document XML/raw structure first
- archive manifest first
- cryptographic exact duplicate detection first

OCR/vision/model reasoning resolves what deterministic parsers cannot expose reliably.

## Image and scan pipeline

Images and image-only pages require a first-class evidence pathway.

Recommended stages:

1. preserve original image/page bytes and hash
2. determine orientation/skew/crop/quality
3. preserve original coordinate system
4. optional non-destructive normalized render for OCR/vision
5. detect text/layout regions
6. OCR text with region/line/token coordinates and confidence
7. semantic field extraction from OCR + visual context
8. preserve uncertain candidates
9. route low-confidence/material fields to secondary vision/model or clarification
10. attach every promoted value to its exact supporting region(s)

A receipt may produce merchant/date/subtotal/tax/tip/total/payment-method/line-item observations while preserving raw OCR and image regions even if only total/date/vendor become accounting facts.

## Source-to-value-to-formula provenance contract

Permanent rule:

> No material value may be used in a dashboard, formula, reconciliation, report or generated deliverable without a provenance envelope.

A provenance envelope should support:

- tenant/workspace/engagement
- sourceArtifactId + source SHA
- source format
- page/sheet/section
- image bounding box OR PDF coordinates OR spreadsheet cell/range OR DOM/XBRL reference
- raw literal/raw OCR text
- normalized value
- currency/unit/scale
- extraction method + version
- confidence/verification state
- clarification references if any
- semantic/accounting assertion IDs
- canonical fact ID if promoted
- transformation/normalization history
- formula/derivation parents if derived
- rendered component/report references where used

Example image lineage:

`receipt.jpg → REGION(x1,y1,x2,y2) → OCR "$57.05" → OBS total=57.05 → VERIFIED FACT → expense total → report/dashboard`

Example spreadsheet lineage:

`Workbook.xlsx → Sheet "Cash" → Cell G18 → raw 183421.98 → normalized USD 183421.98 → VERIFIED FACT → formula operand → ending cash KPI`

## Calculation principle

The calculation engine does not need entire source documents loaded into every formula. It needs trusted normalized operands plus stable parent references.

Store the clean value separately from the evidence payload, but never sever the lineage.

Derived formula object should include:

- formula/operation
- operand fact IDs
- operand values used
- period/entity/currency context
- result
- rounding/scale policy
- generatedAt/engine version
- provenance traversal to every underlying source

## Source completeness vs task evidence sufficiency

Do not reduce document acceptance to COMPLETE/INCOMPLETE.

Track at least:

### Source completeness

What physical/logical material expected from the artifact appears to be present?

### Task evidence sufficiency

Is the evidence available sufficient for the particular accounting/document conclusion currently being requested?

Suggested states:

- `SOURCE_COMPLETE`
- `SOURCE_GAP_NON_MATERIAL_FOR_CURRENT_PURPOSE`
- `SOURCE_GAP_MATERIAL_FOR_CURRENT_PURPOSE`
- `SOURCE_GAP_UNKNOWN_MATERIALITY`
- `SUFFICIENT_FOR_CURRENT_PURPOSE`
- `INSUFFICIENT_FOR_CURRENT_PURPOSE`
- `REVIEW_REQUIRED_TO_DETERMINE_MATERIALITY`

Known source gaps are never hidden. However, a missing page of demonstrably irrelevant boilerplate must not automatically block a bank-balance task, while a missing transaction page may block transaction reconstruction.

Materiality/sufficiency reasoning should use structural continuity, page/section context, table/transaction continuity, reconciliation results, source summaries and the requested task.

## Clarification / PBC queue

Uncertainty must become a durable workflow, not a guess.

Each clarification should include:

- clarificationId
- affected tenant/workspace/engagement
- source/evidence references
- field/assertion/conclusion affected
- question
- candidate answers if appropriate
- confidence/reason
- materiality/task impact
- requested respondent type: CUSTOMER / INTERNAL_REVIEWER / CPA_REVIEWER
- due/status timestamps
- response + responding principal
- response evidence/attachments where applicable
- resulting accounting/semantic decision references

Uncertain items should be classified as:

- proceed-with-flag
- blocks-specific-conclusion
- customer-knowledge-required
- reviewer-judgment-required
- better-source-required

A response becomes evidence; do not overwrite the original uncertainty record.

## Deduplication

### Exact duplicate

SHA-identical artifacts may share processing while preserving every received occurrence.

### Near duplicate

Use perceptual/structural similarity as a candidate signal only. Examples: same receipt photographed twice, rescan, cropped image, PDF and photo copy.

Do not automatically merge materially different evidence. Preserve duplicate relationships and designate a canonical processing occurrence only after confidence rules are satisfied.

## Bulk orchestration

Large client dumps require hierarchical queues:

`Batch → Artifact → Page/Image/Sheet → Extraction Task → Semantic Task → Accounting Task`

Required properties:

- bounded concurrency
- rate/cost controls
- customer priority above Academy
- idempotent task keys
- durable checkpoints
- crash/restart resume
- retry classes and limits
- dead-letter/review state
- progress counts by stage
- no full-engagement restart when unchanged checkpoints remain valid

## Semantic/context layer

The Document Wizard and professional review need more than accounting facts.

Persist independently meaningful context such as:

- people
- organizations/legal entities
- roles/titles
- authors/signers/speakers
- dates/times
- recipients/senders
- addresses/locations
- document purpose/type
- contractual terms
- obligations/commitments
- narrative assertions
- management explanations
- qualifications such as unaudited/restated/confidential
- relationships between entities/documents

These semantic objects remain attributed to sources and may be used by deliverables without forcing them into the accounting ledger.

## Deliverable retrieval

Document/report generation may retrieve from:

- verified/canonical accounting facts
- derivations/formulas
- semantic/context graph
- clarifications
- evidence/source metadata

Every material numeric statement should trace to accounting lineage; every material narrative/identity/date assertion should trace to semantic/source lineage.

## Quality metrics

Do not use one generic "accuracy" number.

Track separately:

- artifact/page/sheet coverage
- structural element disposition coverage
- OCR character/word/field quality on curated benchmarks
- document classification accuracy
- semantic field precision/recall
- accounting extraction precision/recall
- reconciliation pass/fail
- duplicate detection quality
- clarification appropriateness
- source-to-value lineage coverage
- formula operand lineage coverage
- information conservation/unaccounted remainder
- task evidence sufficiency correctness

## Hard invariants

- Every received artifact is durably manifested.
- Every detected source element has an explicit disposition.
- Every stage handoff has zero unexplained reference loss.
- Every material derived value has parent lineage.
- Every unsupported/unreadable item remains visible.
- Every material uncertainty is explicit.
- No customer evidence is silently omitted because it was not accounting-relevant at initial extraction.
