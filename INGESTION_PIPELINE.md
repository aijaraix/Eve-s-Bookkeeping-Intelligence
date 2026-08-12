# Resilient Ingestion Pipeline Specification

## Pipeline Stages

```
UPLOAD ──► DURABLE STORAGE ──► DOCUMENT REGISTRY ──► PAGE MANIFEST
                                                           │
DASHBOARDS ◄── VALIDATION ◄── FACT EXTRACTION ◄── SOURCE BLOCKS
```

1. **Resumable Upload & Ingestion**:
   - Accepts direct multi-part file uploads up to 100MB, Google Drive document links, URL links, and spoken instructions.
   - Computes SHA-256 file hashes to detect duplicate uploads instantly.

2. **Document Registry**:
   - Registers metadata including workspace ID, file size, MIME type, detected language, reporting period, presentation units, and reporting currency.

3. **Page Manifest**:
   - Every page receives a discrete status record (`PENDING`, `PROCESSING`, `PROCESSED`, `RETRYING`, `FAILED`, `REVIEW_REQUIRED`). No page silently disappears.

4. **Source Block Registry**:
   - Raw text is preserved in atomic source blocks (`Headings`, `Paragraphs`, `Tables`, `Cells`, `Footnotes`, `Captions`).
