# Current Launch Progress

Last updated: 2026-09-16 UTC

This file is the rolling execution overlay for `07_EXECUTION_BACKLOG_AND_OWNERSHIP.md`. Physical reality and evidence files listed here override stale task status text in earlier snapshots.

## Completed / accepted in this launch-control pass

### EVE-P0-002 — Establish launch source of truth
Status: DONE

Authoritative launch package committed to `main` under `docs/launch/`.

### EVE-P0-003 — Refresh physical runtime baseline
Status: DONE
Evidence: `docs/launch/evidence/2026-09-15_RUNTIME_BASELINE.md`

Physically verified at baseline:

- Eve web running
- extraction worker running
- local AI running
- OpenClaw running
- Hermes running
- persistent web `/storage` evidence present
- persistent Hermes `/opt/data` Academy evidence present
- exactly one Academy cron job
- Academy job `e9c9dd128ba4` enabled every 5 minutes
- scheduler `last_status: ok`
- public/customer/owner domains reachable over HTTPS
- Hermes advanced endpoint reachable and protected

### EVE-P1-001 — Current intake/parser inventory
Status: DONE
Evidence: `docs/launch/evidence/2026-09-15_INPUT_SUPPORT_MATRIX.md`

The inventory established the pre-work boundary: corporate/iXBRL/native-text parsing was useful, image OCR was placeholder-only, spreadsheet parsing lacked exact cell/formula provenance, and mixed client-dump intake remained incomplete.

### EVE-P1-003 — Universal source-to-presentation provenance contract
Status: ACCEPTED CANDIDATE ON FEATURE BRANCH
Branch: `feature/universal-evidence-ocr-foundation`
Evidence: `docs/launch/evidence/2026-09-16_UNIVERSAL_SOURCE_EVIDENCE_CONTRACT_ACCEPTANCE.md` on the feature branch

Implemented and tested:

- one source-coordinate model across PDF, image, spreadsheet, CSV, HTML/iXBRL, DOCX, email, text and other sources
- transformation history
- mixed-source parent provenance
- presentation usage references
- recursive source tracing
- browser-confirmed presentation requirement for dashboard lineage completion

Physical marker:

`UNIVERSAL_SOURCE_EVIDENCE_CONTRACT_TESTS=PASS`

### EVE-P1-004 — Spreadsheet source-to-pixel lineage
Status: ACCEPTED CANDIDATE ON FEATURE BRANCH
Evidence: `docs/launch/evidence/2026-09-16_SPREADSHEET_SOURCE_TO_PIXEL_LINEAGE_ACCEPTANCE.md` on the feature branch

Implemented and physically verified:

- source SHA and workbook identity
- sheet name
- exact cell/range address
- formulas and cached values
- cell type and number format
- merged/hidden metadata
- preservation through fact persistence
- propagation through presentation adapters
- real Practice Home DOM lineage attributes
- click-through to the actual Eve provenance drawer

Physical marker:

`P1_004_REAL_PRACTICE_HOME_BROWSER_LINEAGE=PASS`

The real browser path traced a rendered Eve value back to `Balance!B4`, including formula `=B2-B3` and number format `$#,##0.00`.

### EVE-P1-005 — Local OCR + image source-to-pixel lineage
Status: ACCEPTED CANDIDATE ON FEATURE BRANCH / INTERNAL OCR SERVICES PHYSICALLY RUNNING / PRODUCTION APP ACTIVATION PENDING
Draft PR: #31
Evidence: `docs/launch/evidence/2026-09-16_LOCAL_OCR_SOURCE_TO_PIXEL_ACCEPTANCE.md` on the feature branch
Runtime record: `docs/launch/evidence/2026-09-16_OCR_RUNTIME_CURRENT_STATE.md` on the feature branch

Accepted local engines:

- primary: PaddleOCR 3.7.0 / PP-OCRv6 medium / CPU-only
- fallback: python-doctr 1.1.0 / `fast_base+crnn_vgg16_bn` / CPU-only PyTorch
- paid/cloud OCR remains optional escalation only

Physical engine proof on the actual Eve node:

- PaddleOCR local CPU inference: PASS
- docTR local CPU inference: PASS
- exact text, regions, bounding boxes, confidence and source SHA returned by both

Persistent internal-only services now running:

- `eve-ocr-paddle:8765`
- `eve-ocr-doctr:8765`

Both are ClusterIP-only with no public ingress. Model caches are persisted under `/opt/eve-ocr-models/` and survived deployment restart.

Persistent endpoint proof markers:

- `PADDLE_PERSISTENT_OCR=PASS`
- `DOCTR_PERSISTENT_OCR=PASS`
- `OCR_CACHE_RESTART_SURVIVAL=PASS`
- OCR network reachability from Eve extraction worker: PASS
- OCR network reachability from actual Eve port-3000 web pod: PASS

Real browser marker:

`P1_005_REAL_PRACTICE_HOME_IMAGE_LINEAGE=PASS`

The real Eve Practice Home rendered a material value with image provenance and the real provenance drawer displayed:

- source image filename
- image dimensions
- page / image-region locator
- normalized bounding box
- OCR text
- confidence
- OCR engine/version
- source provenance ID

Important release boundary:

The OCR services are physically running now, but active production application code remains sourced from `main`. Production customer OCR is **not yet declared active**. Activation requires controlled merge/release of PR #31, application runtime OCR URL configuration, and a post-deployment synthetic receipt/browser regression.

PR #31 intentionally remains draft so service availability and application release remain separate control points.

### EVE-P1-009 — Source completeness vs task evidence sufficiency
Status: ACCEPTED CANDIDATE ON FEATURE BRANCH / PRODUCTION APP ACTIVATION PENDING
Draft PR: #31
Evidence: `docs/launch/evidence/2026-09-16_TASK_EVIDENCE_SUFFICIENCY_ACCEPTANCE.md` on the feature branch

Implemented decision states:

Source completeness:

- `SOURCE_COMPLETE`
- `SOURCE_GAP_NON_MATERIAL_FOR_CURRENT_PURPOSE`
- `SOURCE_GAP_MATERIAL_FOR_CURRENT_PURPOSE`
- `SOURCE_GAP_UNKNOWN_MATERIALITY`

Task evidence sufficiency:

- `SUFFICIENT_FOR_CURRENT_PURPOSE`
- `INSUFFICIENT_FOR_CURRENT_PURPOSE`
- `REVIEW_REQUIRED_TO_DETERMINE_MATERIALITY`

Accepted behavior:

- a known source gap is never erased merely because work can proceed
- a gap demonstrated irrelevant to the current task can be disclosed without blocking a supported conclusion
- broken transaction continuity / failed reconciliation blocks the affected population-dependent conclusion
- a missing required evidence capability fails closed for the affected conclusion
- unknown gap impact scope applies fail-safe to every current conclusion until scope is established
- mixed tasks block only affected conclusions rather than freezing unrelated supported work
- a requested document with no saved completeness record becomes an unknown-impact gap rather than being silently treated as complete
- decisions persist with evidence references and a decision hash under runtime storage

Operational internal CPA API candidate now includes:

- `POST /api/cpa/evidence-sufficiency/evaluate`
- `GET /api/cpa/evidence-sufficiency/decisions`
- `GET /api/cpa/evidence-sufficiency/decisions/:decisionId`

The evaluation route consumes existing `deepDocumentIntelligence` completeness records and unresolved evidence. Evaluation/readback requires authenticated internal-operator authority.

Physical CI markers:

- `TASK_EVIDENCE_SUFFICIENCY_TESTS=PASS`
- `TASK_EVIDENCE_SUFFICIENCY_ROUTES_TESTS=PASS`
- core run `35050184183`: PASS through production build
- operational API run `35050681084`: PASS through route/auth tests, prior evidence/OCR regressions and production build

P1-009 deliberately does not create another completeness system or another clarification queue. It sits between existing source completeness/custody evidence and the existing `professionalClarificationEngine` that P1-010 will extend/link.

### EVE-P6-001 — Canva Brand System production structure
Status: STRUCTURE READY / ASSET POPULATION IN PROGRESS
Evidence: `docs/launch/11_BRAND_ASSET_HANDOFF_MANIFEST.md`

Verified in Canva:

- canonical `Eve's Bookkeeping — Brand System`
- Brand Master, Logos, Icons, Hero Assets, Product UI, Document Examples, CTA Mountains, Social/OG and Codex Handoff folders
- Primary, Reversed, Emblem and App Mark logo subfolders

Locked implementation tokens:

- Playfair Display + Inter
- `#0B2D4D`
- `#2563EB`
- `#14B8A6`
- `#64748B`
- `#E5E7EB`
- `#FFFFFF`

Final canonical asset selection/export is still being populated by the Canva workstream.

## Source-control / runtime safety

Current evidence/OCR/sufficiency application work is isolated on `feature/universal-evidence-ocr-foundation` and draft PR #31. `main` application code has not been changed by that work.

Pfizer / Company 1 was not rerun or altered.

Hermes was not replaced and no second Academy scheduler was created.

The two OCR services were added side-by-side and do not replace any existing Eve service.

A transient accidental `noop` helper file created while updating the feature-branch metadata was immediately removed before this checkpoint. It never touched `main` or production runtime.

## No-Codex engineering pattern established

For bounded work we can now:

1. inspect exact current source through GitHub
2. prepare/test branch patches in isolated scratch or Kubernetes environments
3. run branch CI/build gates
4. exercise the actual Eve UI with the existing real-browser runtime
5. physically verify runtime services through SentinelX
6. commit only after tests pass
7. reserve Codex for a documented blocker rather than routine implementation

## Active next tasks

1. `EVE-P1-010` — integrate clarification/PBC contracts with P1-009 decisions, gap IDs, affected conclusions and source evidence; extend the existing `professionalClarificationEngine`, do not create a parallel queue
2. `EVE-P2-001` — expand Academy into five-dimension grading: source coverage, semantic understanding, accounting accuracy, product truth, deliverable truth
3. extend Academy curriculum to receipts, invoices, scans, missing pages, mixed batches and ambiguity cases
4. controlled review/release plan for draft PR #31 after the next evidence-foundation task is integrated or explicitly split
5. `EVE-P3-002/003/004` — plan, entitlement and usage schemas
6. `EVE-P4-001` — owner live operational read-model integration audit
7. `EVE-P5-001` — remove development/internal language from customer-facing routes
8. `EVE-P6-002` — public claims truth lock while final Canva assets are populated
9. `EVE-P6-003` — website structural implementation using locked brand tokens

## Immediate blockers not requiring Codex

- final canonical Canva asset population/export for full public-site visual fidelity
- owner pricing/plan decisions before publishing commercial pricing
- payment-processor selection/authorization before automated checkout
- production application OCR/evidence/sufficiency activation is deliberately held behind PR #31 release control, not blocked by Codex

## Codex status

No current task is authorized as `CODEX_LAST_RESORT`. Current work continues through direct GitHub/runtime tooling until a specific physical blocker is documented.
