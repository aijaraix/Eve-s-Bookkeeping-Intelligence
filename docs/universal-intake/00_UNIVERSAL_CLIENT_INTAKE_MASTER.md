# Universal Client Intake Master

## Purpose

Eve must support both highly structured corporate filings and ordinary CPA-firm client dumps: native PDFs, scanned PDFs, phone photos, receipts, invoices, spreadsheets, exports, statements, emails, contracts, ZIPs and mixed folders containing thousands of files or pages.

The intake system must preserve every source artifact, account for every detected source element, separate extraction completeness from accounting promotion, and maintain evidence lineage from original bytes to every normalized value, formula, dashboard cell and deliverable statement.

This document extends, and does not replace:

- `docs/eve-operating-system/02_UNIVERSAL_DOCUMENT_INTELLIGENCE_AND_IR.md`
- `docs/eve-operating-system/03_INFORMATION_CUSTODY_AND_ZERO_LOSS.md`

## Permanent architecture

`BATCH -> ARTIFACT -> PHYSICAL ELEMENT -> OBSERVATION -> SEMANTIC ASSERTION -> ACCOUNTING FACT -> CANONICAL VALUE -> DERIVATION -> RENDER / DELIVERABLE`

Every layer persists references to its parent layer. Meaning is added upward; source evidence is never destructively summarized away.

## Universal client intake fabric

Each customer submission creates a durable Batch Intake Manifest.

Minimum fields:

- batchId
- tenantId
- engagementId
- uploaderId
- receivedAt
- sourceChannel
- artifactCount
- physicalPageOrImageCount
- totalBytes
- uniqueArtifactCount
- exactDuplicateCount
- nearDuplicateCandidateCount
- classifiedCount
- reviewRequiredCount
- unreadableOrPartialCount
- processingState
- custodyState

The batch is a container. It is not an accounting object.

## Processing stages

1. Receive
2. Preserve original bytes
3. Hash
4. Inspect file type and integrity
5. Unpack archives / enumerate contents
6. Exact duplicate detection
7. Near-duplicate candidate detection where supported
8. Document classification
9. Physical reconstruction
10. Source-element inventory
11. OCR / native-text extraction / workbook parsing
12. Semantic interpretation
13. Accounting interpretation
14. Matching and reconciliation
15. Clarification / PBC queue
16. Promotion to verified/canonical accounting values
17. Presentation and deliverable mapping
18. Extraction and custody reconciliation

## File-family routing

Use deterministic structure first.

- Native PDF: physical pages + native text + layout/table reconstruction.
- Image-only/scanned PDF: page images + OCR/vision + layout reconstruction.
- PNG/JPEG/HEIC/TIFF: image normalization + OCR/vision + region inventory.
- XLSX/XLS: workbook/sheet/cell/formula parser.
- CSV: typed row/column parser.
- HTML/iXBRL: DOM/XBRL parser.
- DOCX: OOXML structure + paragraph/table extraction.
- Email: sender/recipient/time/thread/body/attachments.
- ZIP/archive: manifest contents first, then recursively route each artifact.

LLMs and multimodal models interpret unresolved semantics; they do not replace deterministic parsers when exact structure is available.

## CPA-firm intake scenarios to support

- large annual reports / filings
- bank and credit-card statements
- accounts payable invoice folders
- accounts receivable documents
- phone-photo receipts
- expense screenshots
- payroll reports
- tax forms and prior returns
- trial balance / general ledger exports
- fixed-asset schedules
- leases and loan agreements
- contracts
- correspondence and email attachments
- mixed entity / mixed period dumps
- duplicates and rescans
- missing pages
- unreadable/cropped/glared images
- thousands of small documents in one batch

## Clarification contract

Uncertainty must be visible, persisted and actionable.

A source may be:

- `UNDERSTOOD`
- `UNDERSTOOD_WITH_LOW_CONFIDENCE_FIELDS`
- `REVIEW_REQUIRED`
- `CUSTOMER_CLARIFICATION_REQUIRED`
- `BETTER_SOURCE_REQUIRED`
- `UNSUPPORTED_PRESERVED`

Unknown values are not silently guessed.

Questions should be routed to the right party:

- deterministic retry when a parser/worker can improve the result
- internal reviewer for accounting ambiguity
- customer for business-purpose / identity / missing-context questions
- source-quality request for unreadable or incomplete evidence

A clarification answer becomes its own evidence object and never overwrites the original source.

## Batch progress model

For large client dumps the customer and owner UI should show concrete progress instead of one giant spinner.

Example:

- received: 9,226
- unique: 8,970
- classified: 8,811
- processing: 392
- matched/reconciled: 8,431
- review required: 76
- customer clarification required: 21
- duplicates preserved: 106
- unsupported preserved: 4
- unexplained custody loss: 0

## Accounting promotion is not source completeness

A batch may contain tens of thousands of observations but only hundreds of canonical accounting facts.

That is acceptable only when every lower-level source element remains persisted and dispositioned.

No production UI should imply that `canonicalFactsCount` equals document completeness.

## Completion gates

A source or batch cannot claim deep completion merely because headline accounting values are correct.

Hard gates:

- all original artifacts hashed and persisted
- physical structure enumerated where technically possible
- every detected leaf element explicitly dispositioned
- no unexplained source-reference loss between stages
- OCR/native-text uncertainty recorded
- unresolved material items surfaced
- all accounting facts have source lineage
- all derivations have operand lineage
- all rendered/material deliverable values have reverse lineage

## Academy extension

Academy must test mixed client-document cases in addition to public filings.

Required benchmark families include:

- receipt images
- low-quality scans
- multi-page image-only PDFs
- bank statements
- invoice folders
- spreadsheet ledgers
- duplicate and near-duplicate uploads
- missing pages
- mixed entity/period batches
- archive uploads
- ambiguous fields that require clarification

Academy grades source coverage, semantic understanding, accounting accuracy, custody conservation, UI truth and deliverable truth separately.
