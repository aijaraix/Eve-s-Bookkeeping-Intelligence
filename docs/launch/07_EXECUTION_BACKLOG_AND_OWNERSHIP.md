# 07 — Execution Backlog and Ownership

Status legend:

- `DONE` — physically verified or committed source-of-truth work complete
- `RUNNING` — active subsystem operating but still monitored
- `READY` — can start now with current tools
- `BLOCKED_ASSET` — waiting on Canva/final asset package
- `BLOCKED_OWNER` — requires owner decision/credential/approval
- `CODEX_LAST_RESORT` — only after current-tool attempt proves blocked

Primary owner legend:

- `CHATGPT_DIRECT`
- `CANVA_ASSET`
- `OWNER_ACTION`
- `CODEX_LAST_RESORT`

## P0 — Preserve the accepted engine

### EVE-P0-001 — Protect current main and Academy acceptance
Status: DONE
Owner: CHATGPT_DIRECT

Acceptance:
- do not restart architecture
- do not rerun protected Company 1/Pfizer without demonstrated need
- Hermes remains single Academy scheduler authority
- customer work preempts Academy

### EVE-P0-002 — Establish launch source of truth
Status: DONE when this launch directory is committed to main
Owner: CHATGPT_DIRECT

### EVE-P0-003 — Refresh physical runtime baseline
Status: READY
Owner: CHATGPT_DIRECT

Check and record:
- current web/Hermes pods/services
- Academy scheduler enabled/current last runs
- owner/customer/public domains
- current owner login path
- identity persistence
- current Hermes advanced access state
- current development PIN state
- persistent storage health

Do not change credentials merely to audit them.

## P1 — Universal intake and evidence foundation

### EVE-P1-001 — Current intake/parser inventory
Status: READY
Owner: CHATGPT_DIRECT

Produce a support matrix by format/document family: VERIFIED / PARTIAL / NOT YET SUPPORTED, based on actual code and runtime tests.

### EVE-P1-002 — Batch Intake Manifest schema
Status: READY
Owner: CHATGPT_DIRECT

Define/implement durable batch + artifact manifest contracts tied to tenant/workspace/engagement.

### EVE-P1-003 — Source-to-value provenance envelope
Status: READY
Owner: CHATGPT_DIRECT

Define/implement one reusable lineage contract for PDF/image/spreadsheet/HTML values and formula derivations.

### EVE-P1-004 — Spreadsheet source lineage audit
Status: READY
Owner: CHATGPT_DIRECT

Verify current XLSX/CSV input paths and implement sheet/cell/range/formula provenance where missing.

### EVE-P1-005 — Image/scan/OCR architecture benchmark
Status: READY
Owner: CHATGPT_DIRECT

Tasks:
- inventory installed OCR/vision-capable libraries/services
- benchmark locally available options before adding paid dependencies
- define image region/token evidence schema
- test representative synthetic/curated receipts and image-only pages
- record quality/cost/latency

Do not assume one OCR engine is sufficient before benchmark.

### EVE-P1-006 — Document classification router
Status: READY
Owner: CHATGPT_DIRECT

Route artifact classes to specialized deterministic/OCR/semantic recipes without forcing every file through the SEC/iXBRL pathway.

### EVE-P1-007 — Exact duplicate handling
Status: READY
Owner: CHATGPT_DIRECT

Use SHA identity for processing reuse while preserving every received occurrence.

### EVE-P1-008 — Near-duplicate candidate design
Status: READY
Owner: CHATGPT_DIRECT

Add only after exact-dedupe baseline. Do not auto-merge materially different evidence.

### EVE-P1-009 — Source completeness vs task sufficiency model
Status: READY
Owner: CHATGPT_DIRECT

Implement/grade separate states for source gaps and conclusion-specific evidence sufficiency.

### EVE-P1-010 — Clarification/PBC model
Status: READY
Owner: CHATGPT_DIRECT

Define/implement clarification records, customer/reviewer routing and answer-as-evidence lineage.

### EVE-P1-011 — Bulk queue/backpressure design
Status: READY
Owner: CHATGPT_DIRECT

Verify existing queue/runtime capacity and add hierarchical batch/artifact/task checkpoints where necessary.

### EVE-P1-012 — Semantic/context graph for Document Wizard
Status: READY
Owner: CHATGPT_DIRECT

Persist authors/signers/people/entities/dates/relationships/narrative assertions/contractual context separately from canonical accounting facts, with source lineage.

## P2 — Academy expansion

### EVE-P2-001 — Academy five-dimension grading contract
Status: READY
Owner: CHATGPT_DIRECT

Source coverage / semantic understanding / accounting accuracy / product truth / deliverable truth.

### EVE-P2-002 — Receipt-image curriculum
Status: depends on P1-005
Owner: CHATGPT_DIRECT

### EVE-P2-003 — Invoice/AP curriculum
Status: READY after document router baseline
Owner: CHATGPT_DIRECT

### EVE-P2-004 — Bank-statement completeness/sufficiency curriculum
Status: READY
Owner: CHATGPT_DIRECT

Include missing non-material vs missing material page scenarios.

### EVE-P2-005 — Spreadsheet/GL/TB curriculum
Status: READY after P1-004
Owner: CHATGPT_DIRECT

### EVE-P2-006 — Mixed-batch/duplicate curriculum
Status: READY after P1-002/P1-007
Owner: CHATGPT_DIRECT

### EVE-P2-007 — Clarification curriculum
Status: READY after P1-010
Owner: CHATGPT_DIRECT

### EVE-P2-008 — Accuracy reporting baseline
Status: READY after first expanded curricula
Owner: CHATGPT_DIRECT

Report per document family/dimension. Do not publish broad accuracy claims yet.

## P3 — Customer commercial foundation

### EVE-P3-001 — Customer/tenant model audit
Status: DONE conceptually; runtime/data audit READY
Owner: CHATGPT_DIRECT

Existing tenant remains customer root.

### EVE-P3-002 — Plan / PlanVersion schema
Status: READY
Owner: CHATGPT_DIRECT

Pricing values remain owner-controlled data.

### EVE-P3-003 — Entitlement schema/enforcement points
Status: READY
Owner: CHATGPT_DIRECT

### EVE-P3-004 — Usage event ledger
Status: READY
Owner: CHATGPT_DIRECT

Track document/page/OCR/job/report/storage/seat dimensions separately. Academy/internal retries non-billable.

### EVE-P3-005 — Owner customer detail read model
Status: READY
Owner: CHATGPT_DIRECT

Overview / onboarding / billing / usage / entitlements / engagements / batches / clarifications / reports / users / activity / notes.

### EVE-P3-006 — Customer plan/usage read model
Status: READY
Owner: CHATGPT_DIRECT

### EVE-P3-007 — First-customer manual commercial workflow
Status: READY, commercial terms BLOCKED_OWNER
Owner: CHATGPT_DIRECT + OWNER_ACTION

Permit manual plan/entitlement assignment before automated checkout if owner approves.

### EVE-P3-008 — Approved pricing/offer decisions
Status: BLOCKED_OWNER
Owner: OWNER_ACTION

Decide initial plans, prices, allowances, onboarding fees/discounts and supported customer types.

### EVE-P3-009 — Payment provider integration
Status: BLOCKED_OWNER until processor chosen/authorized
Owner: CHATGPT_DIRECT after OWNER_ACTION

Implement adapter + verified webhook + idempotent entitlement activation.

## P4 — Unified owner operations

### EVE-P4-001 — Owner live operational read model
Status: READY
Owner: CHATGPT_DIRECT

Connect Hermes/Academy/agent/job state into owner portal without creating another scheduler or duplicate accounting store.

### EVE-P4-002 — Owner overview SaaS presentation
Status: READY after read model
Owner: CHATGPT_DIRECT

### EVE-P4-003 — Academy owner view
Status: READY
Owner: CHATGPT_DIRECT

### EVE-P4-004 — Agent activity view
Status: READY
Owner: CHATGPT_DIRECT

### EVE-P4-005 — System health/alerts view
Status: READY
Owner: CHATGPT_DIRECT

### EVE-P4-006 — Advanced engineering console link
Status: READY
Owner: CHATGPT_DIRECT

Keep raw Hermes as advanced/emergency surface.

## P5 — Customer application cleanup

### EVE-P5-001 — Remove development/internal language from customer routes
Status: READY
Owner: CHATGPT_DIRECT

### EVE-P5-002 — Customer navigation cleanup
Status: READY
Owner: CHATGPT_DIRECT

Dashboard / Documents / Processing / Statements / Evidence / Findings-Requests / Reports / Team / Billing-Plan / Account.

### EVE-P5-003 — Processing/batch progress UI
Status: READY after P1-002
Owner: CHATGPT_DIRECT

### EVE-P5-004 — Clarification/customer request UI
Status: READY after P1-010
Owner: CHATGPT_DIRECT

### EVE-P5-005 — Evidence drill-down to image/PDF/spreadsheet source
Status: READY after P1-003/P1-004/P1-005
Owner: CHATGPT_DIRECT

## P6 — Public website

### EVE-P6-001 — Final brand asset pack
Status: BLOCKED_ASSET
Owner: CANVA_ASSET

Need logos/app mark/favicon/exact fonts/hex/hero/background/product mockups/mobile assets/social images.

### EVE-P6-002 — Public content truth lock
Status: READY
Owner: CHATGPT_DIRECT

Remove/qualify unsupported security/compliance/integration/testimonial/accuracy claims.

### EVE-P6-003 — Website implementation
Status: BLOCKED_ASSET for final visual fidelity; structural prep READY
Owner: CHATGPT_DIRECT

### EVE-P6-004 — Request Demo lead capture
Status: READY
Owner: CHATGPT_DIRECT

### EVE-P6-005 — SEO/social metadata
Status: READY once assets arrive
Owner: CHATGPT_DIRECT

### EVE-P6-006 — Pricing page activation
Status: BLOCKED_OWNER
Owner: OWNER_ACTION + CHATGPT_DIRECT

Do not publish design placeholder pricing until approved.

## P7 — Security/reliability

### EVE-P7-001 — Tenant isolation regression suite review
Status: READY
Owner: CHATGPT_DIRECT

### EVE-P7-002 — Secrets/config audit
Status: READY
Owner: CHATGPT_DIRECT

### EVE-P7-003 — Owner/customer authenticated route noindex audit
Status: READY
Owner: CHATGPT_DIRECT

### EVE-P7-004 — Backup/recovery inventory
Status: READY
Owner: CHATGPT_DIRECT

### EVE-P7-005 — Persistence/restart verification
Status: READY
Owner: CHATGPT_DIRECT

### EVE-P7-006 — Raw development PIN/Hermes access closeout
Status: READY to audit; mutation may become BLOCKED_OWNER/CODEX_LAST_RESORT if provider control-plane cannot be changed with current tools
Owner: CHATGPT_DIRECT first

## P8 — Launch acceptance

### EVE-P8-001 — Supported-source matrix approved for pilot
Status: pending P1
Owner: CHATGPT_DIRECT + OWNER_ACTION

### EVE-P8-002 — Pilot customer dry run
Status: pending P1/P3/P5
Owner: CHATGPT_DIRECT + OWNER_ACTION

### EVE-P8-003 — Public website production acceptance
Status: pending P6
Owner: CHATGPT_DIRECT

### EVE-P8-004 — Owner operations acceptance
Status: pending P4
Owner: CHATGPT_DIRECT

### EVE-P8-005 — Academy launch-critical regression acceptance
Status: pending P2
Owner: CHATGPT_DIRECT

### EVE-P8-006 — First real customer go-live decision
Status: BLOCKED_OWNER until preceding gates satisfied
Owner: OWNER_ACTION

## Recommended next-five-day order without Codex

1. EVE-P0-003 runtime baseline
2. EVE-P1-001 parser/support matrix
3. EVE-P1-003 provenance contract implementation/gap audit
4. EVE-P1-004 spreadsheet lineage audit
5. EVE-P1-005 OCR/vision benchmark
6. EVE-P1-009 sufficiency model
7. EVE-P1-010 clarification model
8. EVE-P2-001 Academy grading contract
9. EVE-P3-002/003/004 customer commercial schemas
10. EVE-P4-001 owner live-read integration audit
11. EVE-P5-001 customer UI development-language cleanup
12. EVE-P6-002 public claims lock while Canva finishes
13. EVE-P7 security/recovery audits
14. implement website immediately when assets arrive

## Working rule

Do not move a task to CODEX_LAST_RESORT because it is large or inconvenient. Attempt it with current GitHub/runtime/tools first. Escalate only after the exact missing capability is identified and documented.
