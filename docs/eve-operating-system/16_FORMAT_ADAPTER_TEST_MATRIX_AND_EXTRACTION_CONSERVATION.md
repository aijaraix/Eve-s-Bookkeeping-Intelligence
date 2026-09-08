# 16 — Format Adapter Test Matrix and Extraction Conservation

## Purpose
Deep document understanding depends on format-specific reconstruction feeding one normalized downstream contract. Each adapter must prove both fidelity and conservation.

## Required adapters
At minimum maintain/test:
- PDF native-text
- PDF scanned/image
- HTML / Inline XBRL
- XLSX
- CSV/TSV
- DOCX
- image/photo
- email/message + attachments
- generic unknown/fail-closed

## Common output contract
Every adapter must populate the same Document IR concepts:
- source artifact metadata + hash
- pages/sections/sheets/message parts
- structural containers
- leaf elements
- coordinates/addressing
- raw content
- style/layout attributes needed for interpretation
- parent/child relationships
- extraction confidence/status

## PDF requirements
Test reading order, multi-column pages, rotated pages, headers/footers, footnotes, merged tables, continued tables, charts/diagrams, scanned pages, mixed native/OCR pages, signatures and appendices.

## XLSX requirements
Preserve workbook, sheet, cell address, formulas, displayed values, number format, merged ranges, hidden rows/columns/sheets, named ranges, comments/notes and cross-sheet references where relevant.

## HTML/iXBRL requirements
Preserve DOM location, inline fact occurrence, concept, context, dimensions, unit, scale, sign, nil state, custom taxonomy, duplicate occurrences and narrative text around the fact.

## Conservation controls
For each adapter report denominators and dispositions. Every detected material element must be:
- interpreted structured
- interpreted semantic
- structural
- presentation-only
- duplicate/corroborating
- review-required
- unsupported

`DETECTED = DISPOSITIONED`, with zero unexplained remainder.

## Golden fixtures
Maintain small deterministic fixtures for edge cases plus real public-source documents for integrated depth tests. Do not use the same sealed expected answers as solver inputs.

## Cross-format equivalence
Where the same source data exists as PDF, XLSX, HTML and XBRL, compare normalized accounting meaning while preserving different source lineage.

## Density alarms
Use suspiciously low extraction density only as an anomaly signal, never as a quota. A large filing with thousands of cells/XBRL occurrences and only a handful of DataPoints requires investigation.

## Acceptance
An adapter is not PASS because it returned some facts. It passes when structure is reconstructed, material elements are dispositioned, handoffs reconcile, and downstream evidence can trace back to exact source coordinates.
