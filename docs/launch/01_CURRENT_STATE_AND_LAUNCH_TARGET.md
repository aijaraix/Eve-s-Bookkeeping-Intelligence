# 01 — Current State and Launch Target

## Current accepted state

### Core accounting/product engine

Substantially implemented and preserved:

- document intake and engagement flow
- universal document/intelligence architecture
- source hashing and evidence lineage
- canonical accounting facts
- financial statements and reconciliations
- findings/review workflows
- specialist-agent execution
- report/draft generation and downloadable artifacts
- source-to-render lineage in the UI
- professional-review/signoff boundaries

### Academy

Academy has an accepted real-browser pathway using the actual Eve product UI on desktop and phone. The accepted path has physically exercised upload, extraction, specialist execution, statements, evidence review, report generation/download, persisted learning, and restart survival. Hermes is the intended single Academy scheduler authority. The accepted Company 1/Pfizer evidence must remain protected from unnecessary reruns.

Academy is therefore an operational quality loop, but broad extraction accuracy across ordinary bookkeeping evidence is NOT yet established. The next Academy phase is coverage expansion, not architecture restart.

### Authentication and tenancy

Existing account foundation includes owner/internal/client roles, tenant-scoped customer access, durable sessions, password hashing, CSRF/origin checks, throttling, session revocation, and account audit records. Professional approval authority remains distinct from normal account access.

The existing Eve tenant is the customer root. Do not invent a second customer identity system.

### Domains

Intended production split:

- `https://evesbookkeeping.com/` — public website
- `https://www.evesbookkeeping.com/` — canonical redirect
- `https://app.evesbookkeeping.com/` — customer application/login
- `https://owner.evesbookkeeping.com/` — owner/operator control center
- raw Zeabur/Hermes endpoints — advanced engineering/runtime surfaces, not normal customer navigation

### Public website

A minimal server-rendered public-site foundation exists. Canva/brand work is producing the final asset direction. The current primitive public site should be replaced by the approved branded marketing experience rather than expanded piecemeal.

### Owner/customer portals

Foundations exist. Customer tenancy is the right base. The owner portal has conceptual sections for overview, customers, Academy, agents, reports, users, system and audit, but live operational feeds and commercial customer management require further productization.

### Customer commerce

A production billing/subscription/entitlement/usage system is not yet physically implemented. It must attach to the existing tenant model. Pricing values shown in mockups remain OWNER-REVIEW until explicitly approved.

### Universal intake gap

Current general parsing is strongest for native-text PDF, HTML/iXBRL, DOCX/text and structured corporate evidence. Scanned receipts, image-only PDFs, phone photos, large mixed client dumps, near-duplicate evidence, OCR/vision routing, batch manifests and durable clarification/PBC are the largest ordinary-bookkeeping intake gaps.

## Product launch target

A launch-capable Eve must support this end-to-end journey:

1. Prospect reaches the branded public website.
2. Prospect requests demo or selects an approved offer.
3. Customer record/tenant is created through an authorized onboarding/purchase path.
4. Customer admin establishes permanent account access.
5. Customer uploads one clean document OR a large mixed evidence batch.
6. Eve preserves originals, inventories every artifact, deduplicates without losing evidence, classifies document type, routes to deterministic parser/OCR/vision paths, and persists a complete source manifest.
7. Eve extracts structural, semantic and accounting information with source lineage.
8. Uncertainty becomes an explicit review/clarification item rather than a silent guess.
9. Accounting agents operate on persisted references and produce persisted receipts/outputs.
10. Statements, findings, evidence and reports render truthfully in the customer UI.
11. The Document Wizard can retrieve both accounting truth and relevant semantic/context evidence.
12. Every material numeric output can trace backward to source image region/page/table/spreadsheet cell and transformations.
13. Owner can see the customer, access state, plan, usage, processing, clarifications, reports, agent state, Academy state, costs/alerts and system health from the owner console.
14. Academy continuously tests the same product workflow with isolated synthetic/curated cases while customer work preempts it.

## First-customer launch vs general availability

### First-customer launch

May proceed before every future connector exists if the following are physically verified:

- secure tenant/account onboarding
- branded public/customer login experience
- customer upload and processing
- supported source formats clearly disclosed
- evidence/provenance works end-to-end
- uncertainty/clarification has a safe path
- owner can observe customer work
- Academy remains running and non-interfering
- no unsupported compliance claims
- manual billing/onboarding is acceptable if automated checkout is not yet approved, provided access/entitlements are controlled and auditable

### General availability

Requires broader intake coverage, production commerce, usage metering, mature clarification flow, expanded Academy corpus, operational alerts, recovery/backup verification, and documented service/support procedures.

## Launch is not

- a perfect score on one public filing
- a polished homepage without backend customer management
- a working backend without ordinary messy client intake
- a payment page that activates accounts from an unverified success URL
- a correct dashboard value with no evidence lineage
- a complete source document that is insufficient for the requested accounting task
- an incomplete source document that is automatically rejected even when the missing material is demonstrably non-material for the current purpose
