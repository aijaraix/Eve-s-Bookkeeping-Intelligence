# 17 — Current Repository Gap Register

## Purpose
This is a forward-looking implementation risk register derived from the current repository and the Eve operating goal. It is not a claim that every listed risk is an active production defect. Each item must be reconciled against the live runtime before closure.

## P0 — must be proven before external CPA pilot

### G-001 — Process-memory authority risk
Repository evidence shows multiple services/registries using in-process `Map`, singleton, or static collections. Some have disk reload, some may not. Prove durable persistence + startup rehydration + crash consistency for every material registry.

Examples to inspect include render registries, audit/review queues, model/file caches, background queues, corporate-group/entity stores, and any synthetic engagement or deliverable lookup maps.

### G-002 — Production authorization vs test authorization
Tenant-isolation code and role types exist, but test/demo mappings must not be mistaken for production auth. Prove authenticated identity is enforced on all customer data and download routes, including IDOR negative tests.

### G-003 — Information-custody gaps between extraction stages
The current system has several extraction engines/services. Prove the exact handoff chain and where every intermediate output is persisted. Eliminate any stage where only a summarized object or agent context survives.

### G-004 — Historical reproducibility
Durable accounting objects currently need explicit schema/tool/model/template versioning. Prove issued reports can be traced to the exact source, rules, parser, model/tool route and presentation version used at creation.

## P1 — required for robust pilot operations

### G-005 — Schema migrations
Introduce explicit schema versions and migration discipline for durable JSON/files/stores before the number of historical projects grows substantially.

### G-006 — Backup and restore proof
Inventory all durable stores, configure off-failure-domain backups, and perform restore drills. Persistence on one mounted volume is not sufficient recovery proof.

### G-007 — Atomic writes and corruption recovery
Audit JSON/index writes for atomic replacement or append-safe semantics. Define repair/rebuild procedures from primary evidence if an index is corrupt.

### G-008 — Queue/job lease semantics
Prove duplicate delivery, retry, restart and lease expiry cannot double-promote facts, duplicate PBC requests, duplicate review notes or duplicate reports.

### G-009 — Real vs synthetic classification everywhere
Classification must be data-driven, not inferred from ID prefixes. UI counts, clients, engagements, reports and attention metrics must all use authoritative classification fields.

### G-010 — Report language/legal-status controls
Templates must not imply an audit opinion, CPA sign-off, PCAOB status, license, or professional credential unless the engagement and authorized signer actually support that statement. Academy outputs must be unmistakably synthetic.

## P2 — depth, learning and operational quality

### G-011 — Universal Document IR implementation gap
Design is documented; reconcile actual PDF/HTML/XLSX/scan flows to prove all produce the same durable IR contract before semantics.

### G-012 — Full-format extraction matrix
Existing hybrid extraction is strongest on core formats. Add/verify deterministic coverage for difficult PDFs, scans, DOCX, images, emails and edge-case spreadsheets.

### G-013 — Source-side recall examiner
Minerva needs independent source-inventory/recall evaluation, not only correctness of retained facts. Measure what was missed.

### G-014 — Visual/diagram understanding
Charts, org charts, diagrams and maps need explicit inventory, preservation and review-required behavior when interpretation is unreliable.

### G-015 — Prompt/model/tool registry
Version production prompts/templates and persist actual model/tool execution provenance, fallback and cost.

### G-016 — Knowledge graph temporal/version semantics
Entity ownership, names, addresses, officers, currencies and relationships change over time. Graph edges/attributes need effective dates and source-specific authority.

### G-017 — Learning confidence
Competency changes must include sample size and difficulty normalization. One successful case should not create a strong confidence claim.

## P3 — product clarity and maintainability

### G-018 — Single authoritative UI query layer
Continue removing direct component dependence on legacy workspaces, fixture adapters or duplicated stores. Product views should resolve through scoped universal services.

### G-019 — Generated audit reports vs evidence
Do not let historical markdown audit reports become operational truth. Treat them as historical assertions that must be reverified against current runtime.

### G-020 — Documentation compliance automation
Add tests/checks that enforce critical invariants from `docs/eve-operating-system/`: classification, lineage, no unaccounted handoff loss, schemaVersion presence, no unscoped customer queries and honest proof-level labels.

## Repository observations supporting this register
- Hybrid document extraction and fail-closed work already exist and should be preserved, not replaced wholesale.
- Worker/intake paths show persistence patterns that can be extended into the custody model.
- Several material services use `Map`/singleton state and therefore require explicit authority/rehydration classification.
- Tenant regression/security types exist, but production authorization requires separate runtime proof.
- The repository already contains historical audit-report artifacts; these are useful evidence but must not override live data.

## Closure rule
No gap is closed by code presence alone. Closure requires the strongest applicable proof level: `CONFIGURED`, `RUNTIME_VERIFIED`, `PRODUCT_VERIFIED`, or `BROWSER_VERIFIED`.
