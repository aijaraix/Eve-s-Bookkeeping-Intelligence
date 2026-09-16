# Eve Bookkeeping Launch Control — Start Here

Status: AUTHORITATIVE LAUNCH SOURCE OF TRUTH
Created: 2026-09-15
Baseline main commit when created: `21e2c8d85ef336c4266a4c110268aa18566e3fb4`

## Purpose

This directory is the operational source of truth for taking Eve Bookkeeping from its current working engine to a customer-ready production service. It consolidates product, extraction, Academy, customer, commerce, owner-operations, website, evidence, security, and launch-acceptance requirements.

Future agents must read this directory before proposing broad work. Do not restart or redesign working subsystems for convenience.

## Read in this order

1. `01_CURRENT_STATE_AND_LAUNCH_TARGET.md`
2. `02_UNIVERSAL_CLIENT_INTAKE_AND_EVIDENCE.md`
3. `03_ACADEMY_QUALITY_AND_ACCEPTANCE.md`
4. `04_CUSTOMER_COMMERCE_AND_OPERATIONS.md`
5. `05_PUBLIC_CUSTOMER_OWNER_EXPERIENCE.md`
6. `06_SECURITY_RELIABILITY_AND_OBSERVABILITY.md`
7. `07_EXECUTION_BACKLOG_AND_OWNERSHIP.md`
8. `08_CODEX_LAST_RESORT_POLICY.md`
9. `09_LAUNCH_ACCEPTANCE_CHECKLIST.md`

Also preserve and defer to the deeper operating-system specifications under `docs/eve-operating-system/` where they are more specific, especially Universal Document IR and zero-loss information custody.

## Permanent architectural rules

- One Eve platform; do not create parallel products or duplicate accounting truth.
- Existing tenant identity is the customer/business root. Billing, usage, users, workspaces, reports and entitlements attach to it.
- Hermes remains the agent/runtime and Academy scheduler authority unless an approved migration explicitly replaces it.
- Customer work always preempts Academy/background exercises.
- Academy must use the real product pathway; synthetic fixtures are isolated from customer records.
- Agents are not storage. Persisted evidence and lineage are authoritative.
- No dashboard, formula, report or deliverable may use a material value without source lineage.
- Source completeness and task evidence sufficiency are separate concepts.
- Known source gaps are never hidden, but only materially relevant gaps block a conclusion.
- AI-prepared work is not professional CPA approval. Account roles do not confer professional signing authority.
- No secret, PIN, password, API key, token or private customer data is committed to GitHub.
- Do not claim security/compliance certifications or capabilities unless physically verified and approved for publication.
- Do not rerun protected customer/company cases merely to prove unrelated infrastructure changes.

## Ownership labels

Each backlog item is assigned one of these primary owners:

- `CHATGPT_DIRECT` — can be designed, inspected, coded, committed, or verified with currently available tools.
- `CANVA_ASSET` — depends on final brand/visual asset delivery.
- `OWNER_ACTION` — requires owner credential entry, legal/commercial decision, processor approval, or destructive authorization.
- `CODEX_LAST_RESORT` — only after a concrete blocker shows the work cannot safely be completed with current tooling.

## Launch philosophy

Eve is not ready merely because it produces correct headline numbers. Launch requires an end-to-end system in which a customer can be onboarded, submit ordinary messy accounting evidence, see processing and clarifications, receive traceable outputs, and be managed from the owner console while Academy continuously validates the same workflow.

The target guarantee is:

> Eve knows what it received, what it understood, what remains uncertain, what evidence supports each material output, and what requires human/customer clarification — with zero silent information loss.

## Update rule

When physical reality changes, update these files. Current physical evidence overrides stale handoff statements. Do not mark a backlog item DONE from source inspection alone when its acceptance requires runtime proof.
