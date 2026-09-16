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

The real Eve Practice Home rendered a material value with image provenance and the real provenance drawer displayed source image filename, dimensions, page/image-region locator, normalized bounding box, OCR text, confidence, OCR engine/version and source provenance ID.

Important release boundary:

The OCR services are physically running now, but active production application code remains sourced from `main`. Production customer OCR is **not yet declared active**. Activation requires controlled merge/release of PR #31, application runtime OCR URL configuration, and a post-deployment synthetic receipt/browser regression.

PR #31 intentionally remains draft so service availability and application release remain separate control points.

### EVE-P1-009 — Source completeness vs task evidence sufficiency
Status: ACCEPTED CANDIDATE ON FEATURE BRANCH / PRODUCTION APP ACTIVATION PENDING
Draft PR: #31
Evidence: `docs/launch/evidence/2026-09-16_TASK_EVIDENCE_SUFFICIENCY_ACCEPTANCE.md` on the feature branch

Implemented source-completeness states:

- `SOURCE_COMPLETE`
- `SOURCE_GAP_NON_MATERIAL_FOR_CURRENT_PURPOSE`
- `SOURCE_GAP_MATERIAL_FOR_CURRENT_PURPOSE`
- `SOURCE_GAP_UNKNOWN_MATERIALITY`

Implemented task-sufficiency states:

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

Operational internal CPA API candidate includes:

- `POST /api/cpa/evidence-sufficiency/evaluate`
- `GET /api/cpa/evidence-sufficiency/decisions`
- `GET /api/cpa/evidence-sufficiency/decisions/:decisionId`

Physical CI markers:

- `TASK_EVIDENCE_SUFFICIENCY_TESTS=PASS`
- `TASK_EVIDENCE_SUFFICIENCY_ROUTES_TESTS=PASS`
- core run `35050184183`: PASS through production build
- operational API run `35050681084`: PASS through route/auth tests, prior evidence/OCR regressions and production build

P1-009 deliberately does not create another completeness system or another clarification queue.

### EVE-P1-010 — Clarification / PBC tied to task evidence sufficiency
Status: ACCEPTED CANDIDATE ON FEATURE BRANCH / PRODUCTION APP ACTIVATION PENDING
Draft PR: #31
Evidence: `docs/launch/evidence/2026-09-16_CLARIFICATION_PBC_SUFFICIENCY_ACCEPTANCE.md` on the feature branch

P1-010 extends the existing `professionalClarificationEngine`; it does not create a parallel clarification queue.

Permanent workflow:

`P1-009 decision -> exact gap -> affected conclusion(s) -> clarification/PBC -> authenticated response + evidence -> P1-009 re-evaluation -> resolve only when every affected conclusion is ALLOWED`

Accepted behavior:

- one durable request per concrete actionable gap
- idempotent creation for the same source decision + gap
- material client-evidence gaps become `PBC_EVIDENCE_REQUEST`
- unknown materiality becomes `INTERNAL_MATERIALITY_REVIEW`
- non-client material issues can become `CPA_REVIEW`
- request preserves source decision/hash/task, gap IDs, affected conclusion IDs and source evidence references
- response before PBC submission state is rejected
- response evidence/document IDs persist
- authenticated server principal is the responder; body identity cannot spoof it
- a PBC response becomes `RESPONSE_RECEIVED`, not automatically `RESOLVED`
- linked response explicitly requires P1-009 re-evaluation
- unrelated task/workspace/engagement decisions cannot clear the request
- unresolved re-evaluation creates follow-up rather than false clearance
- request resolves only when every affected conclusion is `ALLOWED`
- legacy unlinked clarification response behavior remains compatible

Feature-branch professional clarification API candidate includes:

- `GET /api/cpa/professional-clarifications`
- `GET /api/cpa/professional-clarifications/:requestId`
- `POST /api/cpa/professional-clarifications/from-sufficiency/:decisionId`
- `POST /api/cpa/professional-clarifications/:requestId/submit`
- `POST /api/cpa/professional-clarifications/:requestId/respond`
- `POST /api/cpa/professional-clarifications/:requestId/link-reevaluation`

Important delivery boundary:

`SUBMITTED_TO_CLIENT` is currently a durable workflow state only. It does **not** establish that an email, portal notification or other external message was physically sent.

Physical CI acceptance:

- corrected P1-010 run `35051920926`: PASS
- P1-010 coordinator contract: PASS
- P1-010 route/auth contract: PASS
- P1-009 regression: PASS
- universal evidence regression: PASS
- spreadsheet lineage regression: PASS
- OCR evidence regression: PASS
- presentation regression: PASS
- full production build: PASS

The first P1-010 run failed only because its test expected an unknown-materiality review for a task that explicitly required a complete transaction population. P1-009 correctly treated that missing page as material. The production rule was preserved; the test was corrected to a true unknown-materiality scenario.

### EVE-P2-001 — Five-dimension Academy evidence grading
Status: ACCEPTED CANDIDATE ON FEATURE BRANCH / PRODUCTION APP ACTIVATION PENDING
Draft PR: #31
Accepted implementation checkpoint: `b7ef550513306ce50d194e045dad64b614abf117`
Evidence: `docs/launch/evidence/2026-09-16_P2_001_FIVE_DIMENSION_ACADEMY_ACCEPTANCE.md` on the feature branch

Minerva now has a stricter independent grading contract across:

- Source Coverage
- Semantic Understanding
- Accounting Accuracy
- Product Truth
- Deliverable Truth

Permanent behavior:

- dimension states are `PASS`, `FAIL`, `NOT_TESTED`
- `NOT_TESTED` never counts as PASS
- incomplete/partially exercised dimensions remain `NOT_TESTED` and receive no dimension score
- every PASS assertion requires a nonblank evidence reference
- any failed dimension prevents all-required-pass
- the case receives `FIVE_DIMENSION_PASS` only when all five required dimensions independently pass
- tested-only average excludes untested dimensions
- historical cases are not retroactively treated as five-dimension complete
- the old numeric/evidence/PBC/review/report weighted Full Practice score remains available only for backward compatibility and cannot override five-dimension status
- latest result plus bounded five-dimension history are exposed through the Observatory read model
- PASS / FAIL / NOT_TESTED are visibly distinct in the Academy curriculum UI
- blanket global `zeroToleranceCertified` is disabled rather than inferred from one case
- Minerva wording is explicitly internal technical evaluation, not a CPA opinion, audit opinion, statutory certification or human professional sign-off

Physical CI acceptance:

- initial integration run `35053016519`: PASS
- final hardening run `35053528405`: PASS
- five-dimension grading tests: PASS
- five-dimension presentation tests: PASS
- P1-009 regression: PASS
- P1-010 coordinator regression: PASS
- P1-010 route/auth regression: PASS
- universal evidence regression: PASS
- spreadsheet lineage regression: PASS
- OCR evidence regression: PASS
- presentation adapter regression: PASS
- Academy dashboard truth regression: PASS
- full production build: PASS

P2-001 extends the existing Minerva / Hermes Academy path; no second evaluator service was created.

### EVE-P2-002 — Five-dimension Academy curriculum catalog
Status: CATALOG FOUNDATION ACCEPTED ON FEATURE BRANCH / PHYSICAL FIXTURE EXECUTION IN PROGRESS / PRODUCTION APP ACTIVATION PENDING
Draft PR: #31
Accepted implementation checkpoint: `98d3c236b247ea3fdb0b8d9782a1482b187a1b4a`
Evidence: `docs/launch/evidence/2026-09-16_P2_ACADEMY_CURRICULUM_CATALOG_ACCEPTANCE.md` on the feature branch

The existing Minerva service now owns a curated 19-case curriculum spanning:

- receipt photo and scanned invoice OCR
- image-only PDF
- low-quality, rotated/skewed, glare/crop image conditions
- PaddleOCR vs docTR material disagreement
- missing-page non-material, material transaction-population and unknown-materiality cases
- mixed-source batch and spreadsheet + receipt conclusions
- insufficient PBC response and resolving PBC response after re-evaluation
- duplicate / near-duplicate evidence
- bulk mixed-client upload isolation
- long-document semantic/context extraction
- real source-to-dashboard click-through
- final report/export evidence lineage

Truthful readiness state:

- total curated cases: 19
- contract-ready cases: 5
- physical-fixture-required cases: 14
- autonomous-eligible cases: 0

All new cases are explicitly excluded from autonomous scheduling until their fixture/execution path is physically proven. A curriculum specification is not treated as a pass.

The Observatory and existing Curriculum tab expose the case catalog, target dimensions, readiness state and explicit `Autonomous scheduler: NOT ELIGIBLE` status.

Physical CI acceptance:

- curriculum catalog run `35053836636`: PASS
- 19-case curriculum contract: PASS
- P2 five-dimension grading/presentation regressions: PASS
- P1-009 regression: PASS
- P1-010 coordinator + route/auth regressions: PASS
- universal evidence, spreadsheet lineage, OCR evidence and presentation regressions: PASS
- Academy dashboard truth regression: PASS
- full production build: PASS

No new evaluator service or scheduler was created.

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

Current evidence/OCR/sufficiency/clarification/Academy application work is isolated on `feature/universal-evidence-ocr-foundation` and draft PR #31. `main` application code has not been changed by that work; progress-document updates do not activate feature-branch application code.

Pfizer / Company 1 was not rerun or altered.

Hermes was not replaced and no second Academy scheduler was created.

The two OCR services were added side-by-side and do not replace any existing Eve service.

Transient helper-file mistakes (`noop` earlier and an empty `nonexistent` file during P1-010 metadata cleanup) were immediately removed from the feature branch. P2 one-shot hardening/catalog machinery also removed itself automatically after green builds. None of these helper files touched production runtime.

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

1. physically implement and execute the receipt-photo, scanned-invoice and image-only-PDF curriculum fixtures against the local OCR/evidence path
2. then execute low-quality, rotated/skewed, glare/crop and PaddleOCR-vs-docTR disagreement fixtures
3. exercise the mixed-source, duplicate/isolation, semantic-context, real browser source-to-dashboard and final deliverable-lineage cases, preserving `NOT_TESTED` until each dimension is actually proven
4. controlled review/release plan for draft PR #31 as a separate authorized step; do not infer merge authorization from branch acceptance
5. `EVE-P3-002/003/004` — plan, entitlement and usage schemas
6. `EVE-P4-001` — owner live operational read-model integration audit
7. `EVE-P5-001` — remove development/internal language from customer-facing routes
8. `EVE-P6-002` — public claims truth lock while final Canva assets are populated
9. `EVE-P6-003` — website structural implementation using locked brand tokens

## Immediate blockers not requiring Codex

- final canonical Canva asset population/export for full public-site visual fidelity
- owner pricing/plan decisions before publishing commercial pricing
- payment-processor selection/authorization before automated checkout
- production application evidence/OCR/sufficiency/clarification/P2 activation is deliberately held behind PR #31 release control, not blocked by Codex
- PBC external delivery/notification transport is not yet implemented; current accepted state is durable workflow state + authenticated response/re-evaluation contracts

## Codex status

No current task is authorized as `CODEX_LAST_RESORT`. Current work continues through direct GitHub/runtime tooling until a specific physical blocker is documented.