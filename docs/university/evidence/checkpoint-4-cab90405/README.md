# Checkpoint 4 exact-build browser acceptance

- Preserved source under examination: `cab90405b0a18453488891718509799f8fcfeef0`
- Runtime: isolated local HTTPS Express server and same-namespace headless Chromium, restricted to loopback
- Browser: `HeadlessChrome/152.0.7977.0`
- Tenant: `ACADEMY_SYNTHETIC`
- Source type: `RECEIPT`
- Synthetic authentication: `PASS`
- Customer browser: `PASS`
- Owner browser: `PASS`
- Transaction facts: `1`
- Evidence: `COMPLETE`
- Canonical accounting: `RAW_TRANSACTIONS_CANONICALIZED`
- Workpaper: balanced, `DRAFT_NOT_POSTED_TO_PRODUCTION_BOOKS`
- Deliverables: PDF, XLSX, CSV, and JSON downloaded through the authenticated customer browser and SHA-256 verified
- Reverse lineage: valid (`1` chain)
- Independent Minerva result: `PASS` (`5/5` dimensions)
- Screenshot count: `20`

The browser journey used Eve's normal login, session, CSRF, tenant-scoped upload, accounting continuation, report download, owner access, and Minerva physical-proof routes. Credentials and session material were generated in memory for the isolated fixture and were not recorded in this evidence directory.

No production customer data, production runtime, old k3s candidate, main branch, recovery branch, or PR 31 was touched.
