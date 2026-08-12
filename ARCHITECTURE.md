# Eve's Bookkeeping Intelligence — Enterprise System Architecture

## System Diagram & Data Flow

```
USER
 │
 ▼
[ UPLOAD / RESUMABLE INGESTION ] (Direct, Google Drive, URL, API)
 │
 ▼
[ DURABLE STORAGE ] (ai_cpa_storage.json / Firestore)
 │
 ▼
[ DOCUMENT REGISTRY ]
 │
 ▼
[ PAGE MANIFEST ] ── (Granular status per page: PENDING, PROCESSING, PROCESSED, FAILED)
 │
 ▼
[ SOURCE BLOCK REGISTRY ] ── (Headings, Paragraphs, Tables, Cells, Footnotes, Notes)
 │
 ▼
[ TABLE & PAGE PROCESSING ENGINE ]
 │
 ├──► [ PRIMARY FACT EXTRACTION ] (Claude 3.7 Sonnet / Gemini Flash + Deterministic OCR)
 │
 └──► [ ADDITIONAL FACT EXTRACTION ] (Opportunity Scanner for KPIs, Guidance, Debt, Tax Rates)
       │
       ▼
[ NORMALIZATION ENGINE ] (Scale & Sign Resolution, Currency Conversion, Standardized Units)
       │
       ▼
[ FACT REGISTRY ] ── (Searchable, Immutable, Source Provenance Bound)
       │
       ▼
[ VALIDATION & RECONCILIATION ] ── (Balance Sheet Identity, Income Identity, Cash Flow Reconciler)
       │
       ▼
[ DERIVED METRICS ENGINE ] ── (Gross Margin, Current Ratio, Debt/Equity, Free Cash Flow)
       │
       ▼
[ SEARCH & RETRIEVAL INDEX ]
       │
 ┌─────┴───────────────────────────────┬──────────────────────────────┐
 ▼                                     ▼                              ▼
[ FINANCIAL DASHBOARDS ]        [ ASK EVE CHATBOT ]          [ AUDIT REPORTS & WORKPAPERS ]
(Dynamic Fact-Driven UI)        (Claude RAG Retrieval)       (Auditable Fact Lineage Memos)
```

## System Overview & Core Principles

Eve's Bookkeeping Intelligence is designed as an end-to-end observable, source-grounded financial audit and bookkeeping application.

### Key Architectural Standards:
1. **Zero Unverifiable Claims**: Every financial value, chart entry, and audit report claim is traceable to an underlying `fact_id` in the Fact Registry with page-level bounding coordinates.
2. **Resilient Large File Processing**: Multi-hundred page reports are chunked into discrete processing units governed by a durable **Page Manifest**. Failed pages are retried independently without re-uploading the original file.
3. **Deterministic & LLM Hybrid Extraction**: Primary extraction leverages Anthropic Claude 3.7 / 3.5 Sonnet for natural language comprehension combined with local regex/table parsing to ensure mathematical exactness.
4. **Second-Pass Opportunity Extraction**: Scans the entire corpus post-primary extraction to capture operational KPIs, ESG metrics, debt maturities, tax rate reconciliations, and management guidance.
5. **Multi-Tenant Workspace Partitioning**: Workspaces (`ws-xxx`) enforce strict data isolation across entities, documents, facts, findings, and diagnostic logs.
