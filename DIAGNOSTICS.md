# System Diagnostics Area Specification

Route: `/system-diagnostics`

## Diagnostic Tabs (20 Tabs)
1. System Overview
2. Documents
3. Ingestion Jobs
4. Page Processing
5. Source Blocks
6. Tables & Charts
7. Fact Registry
8. Derived Metrics
9. Validation & Reconciliation
10. Conflicts & Review Queue
11. Additional Fact Extraction
12. AI / Agent Activity
13. Ask Eve Retrieval
14. Dashboard Lineage
15. Report Lineage
16. Errors & Retries
17. Performance & Cost
18. Pipeline Versions
19. Test Harness
20. Diagnostic Export

## Security & Privacy Rules
- **No Secrets Exposed**: API keys, credentials, service account JSON, and database tokens are sanitized before rendering.
- **Export Bundle**: Exports non-secret operational state as a JSON/ZIP package.
