# Current Launch Progress

Last updated: 2026-09-15 / 2026-09-16 UTC

This file is the rolling execution overlay for `07_EXECUTION_BACKLOG_AND_OWNERSHIP.md`. Physical reality and evidence files listed here override stale task status text in earlier snapshots.

## Completed in this launch-control pass

### EVE-P0-002 — Establish launch source of truth
Status: DONE

Authoritative launch package committed to `main` under `docs/launch/`.

### EVE-P0-003 — Refresh physical runtime baseline
Status: DONE
Evidence: `docs/launch/evidence/2026-09-15_RUNTIME_BASELINE.md`

Physically verified:

- Eve web running
- extraction worker running
- local AI running
- OpenClaw running
- Hermes running
- current observed pods at zero restarts
- persistent web `/storage` evidence present
- persistent Hermes `/opt/data` Academy evidence present
- exactly one Academy cron job
- Academy job `e9c9dd128ba4` enabled every 5 minutes
- scheduler `last_status: ok`
- cron continuing through 2026-09-16 00:25:50 UTC at audit time
- public/customer/owner domains reachable over HTTPS
- Hermes advanced endpoint reachable and redirects unauthenticated users to login

### EVE-P1-001 — Current intake/parser inventory
Status: DONE for code/runtime support inventory
Evidence: `docs/launch/evidence/2026-09-15_INPUT_SUPPORT_MATRIX.md`

Key findings:

- current corporate/iXBRL and native-text PDF foundation is useful
- native PDF path inventories pages and extracts page text but lacks scan OCR fallback
- image extensions route to `OCRParser`
- current `OCRParser` is a placeholder, not real OCR
- spreadsheet path uses SheetJS and iterates sheets but does not yet preserve exact cell/formula provenance
- DOCX raw text extraction exists via Mammoth
- archive/email/bulk client-dump intake is not launch-grade yet
- no dedicated OCR/CV package is present in current Node dependencies
- local Ollama currently exposes `qwen3.5:4b-q4_K_M`; vision/OCR capability of this exact model is not yet proven

## Source-control safety note

During creation of the launch package an empty `README.md` was accidentally created by a helper write call and immediately removed. A compare against the pre-plan checkpoint confirmed the net launch-plan change contained only the intended `docs/launch/*` files. No prior repository content was lost.

## Tooling capability established

The connected SentinelX host can reach GitHub with `git`.

The production Eve web container has Node 22 and npm 10 with installed dependencies, but contains bundled production output rather than the full source tree.

This creates a workable no-Codex pattern for bounded changes:

1. inspect/prepare exact patch through GitHub
2. use an isolated scratch clone/worktree on the connected host where possible
3. use container/runtime tooling for read-only verification or isolated execution
4. commit through GitHub only after review
5. avoid mutating running production containers as a substitute for deployment

If a patch cannot be fully tested with current tooling, record that limitation rather than claiming acceptance.

## Active next tasks

1. `EVE-P1-003` — source-to-value provenance contract / gap audit
2. `EVE-P1-004` — spreadsheet cell/formula lineage
3. `EVE-P1-005` — OCR/vision architecture benchmark
4. `EVE-P1-009` — source completeness vs task evidence sufficiency model
5. `EVE-P1-010` — clarification/PBC model
6. `EVE-P2-001` — Academy five-dimension grading contract
7. `EVE-P3-002/003/004` — plan, entitlement and usage schemas
8. `EVE-P4-001` — owner live operational read-model integration audit
9. `EVE-P5-001` — remove development/internal language from customer-facing routes
10. `EVE-P6-002` — public claims truth lock while Canva assets are finalized

## Immediate blockers not requiring Codex yet

- Canva final asset pack for visual website implementation
- owner pricing/plan decisions before publishing commercial pricing
- payment-processor selection/authorization before automated checkout
- advanced Hermes/development credential closeout may require provider control-plane access, but must be audited with current tools before Codex escalation

## Codex status

No current task is authorized as `CODEX_LAST_RESORT` merely because credits are unavailable. Current work continues through direct GitHub/runtime tooling until a specific physical blocker is documented.
