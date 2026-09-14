# Frontend/runtime visibility repair — 2026-09-15

**Classification:** Dated incident evidence, bounded implementation instructions, and acceptance criteria for the EXISTING architecture. Not a new architecture package, production patch, or certification.

**Owner requirement:** The existing frontend must represent the real backend data, execution, evidence, review results, and legitimately measured learning whether opened in Google AI Studio development preview, the Google shared/published application, or Zeabur. The owner must not need to inspect server files to discover that work occurred.

**Companion contracts:** [06 — UI/Data Lineage](06_UI_DATA_LINEAGE_AND_PRODUCT_AUDIT.md), [23 — Runtime/Environment Parity](23_RUNTIME_AUTHORITY_DEPLOYMENT_AND_ENVIRONMENT_PARITY.md), and the active section of [09 — Gemini Directive](09_GEMINI_EXECUTION_DIRECTIVE.md). Existing custody, access, professional-signoff, and no-shadow-execution rules remain in force.

## 1. Evidence scope and limitations

This document records the September 14–15 troubleshooting checkpoint. Source findings were checked against GitHub commit `0509c73f68a1dfc722529d3e333993bbf137c489`. Production facts below were obtained by earlier authorized read-only SentinelX inspection of the running core, persisted files, and application HTTP responses, including the completed-run inspection at `2026-09-14T22:13:23Z` and the subsequent frontend diagnosis. The owner screenshots were displayed on September 15 local time. This documentation update did not rerun the business workflow or change the server.

Treat these observations as a pinned checkpoint, NOT a guarantee of current state. Re-read current main, the AI Studio workspace, live fingerprints, approved operating posture, and relevant record revisions before implementation. Preserve newer legitimate work.

One owner screenshot identifies the AI Studio editor app as `8cb49cd7-b034-4859-8b60-0e602cfa4378`. The screenshots show an AeroTech canary, zero production clients, empty financial cards, and misleading readiness/score labels. They do not expose the iframe's actual API network destination. That connection must be measured in a real browser. The other shared/published frontend URL and its runtime were not independently identified by these screenshots.

The inspection established working backend execution for a public-filing review, not a complete autonomous CPA practice, complete filing extraction, real bank reconciliation, customer approval, or professional audit. A preserved repaired run cannot be retroactively called a clean single-release end-to-end trial.

## 2. Preserved Company 1 and runtime checkpoint

| Object | Observed identifier/state |
| --- | --- |
| Repository/code baseline | `aijaraix/Eve-s-Bookkeeping-Intelligence` at `0509c73f68a1dfc722529d3e333993bbf137c489` |
| Production core | Existing Zeabur `eve-s-bookkeeping-intelligence`, generation 55 at the checkpoint |
| Public core origin | `https://eves-worker.zeabur.app/` — role verified from the service, not inferred from its name |
| Core image | Zeabur registry deployment `6aa86dddc1527b5197a701e4`, image pull policy Always |
| Runtime image digest | `sha256:40faf79bc24d3d0143d3ef660abff43bc30df804cd6c1855e2c66454c1623414` |
| Executing server SHA-256 | `7e51af13bd20c65c1d79f5cc379afed95255a7e85c9257474e833746e85ac63d` |
| Canonical workspace | `ws-1789404405588`, saved name `pfe-20241231` |
| Document | `doc-1789375664699-hpue`, source filename `pfe-20241231.htm` |
| Source SHA-256 | `c7efde84a2bd100f559e4d6b8e93a52dfec9ad71a83f4dfa152eb3c969f0fcf5` |
| Intake | `intake-1789375664744-5mh3` |
| Canonical queue job | `JOB-INTAKE-intake-1789375664744-5mh3` |
| Extraction | COMPLETED, Attempt 9; no replacement intake |
| Customer engagement | `eng-customer-809952caaf3cfb7b` |
| Continuation | `CONT-809952caaf3cfb7b`, logic `v6-bounded-lexicon-review-package` |
| Continuation result | READY_FOR_AUTHORIZED_HUMAN_REVIEW, completed `2026-09-14T22:09:01.619Z` |
| Report ID/version | `REP-CUSTOMER-809952caaf3c` / `v6.a9.cd2b72fb` |
| Reporting period | FY 2024, with original comparative periods retained per row |
| Specialist execution | Nine completed execution contracts; not nine independent professional approvals |
| Lexicon | 166 input concepts = 166 unique name-classification proposals in 11 validated model batches; authoritative anchors verified = 0 |
| Financial rows | 133 eligible rows, 117 distinct fact IDs; 16 repeated-ID groups had identical compared financial content |
| Raw store | 256 fact rows at the query checkpoint; not all eligible, unique, or complete |
| Disclosure evidence | 24 selected excerpts; not full filing-coverage proof |
| Human authority | No professional approval object; Quinn deliveryEligible false, human sign-off pending |
| Academy | DISARMED; last case ACADEMY-CASE-005 |

The completed continuation is stored under `/storage/cpa_memory/verified_customer_continuations/`; model batch receipts under `/storage/cpa_memory/lexicon_batches/`; accounting workspace data under `/storage/ai_cpa_storage.json`; and draft formats under `/storage/reports/`. `/app/storage` resolved to the mounted `/storage` volume. Do not duplicate these stores in Google or restore a stale workspace snapshot over them.

The `SOURCE_GIT_COMMIT_SHA` environment label was still `3025592d...` while physical server bytes matched the repaired build. The dedicated worker remained on a node-local older image, although its executable SHA-256 matched the current compiled worker (`94def6f89c7e48696106f61cceb248f80bb2a094faa572a11fad8a874622267a`). Keep those deployment findings explicit; do not treat labels as code proof or restart useful work merely to update metadata.

### 2.1 Draft integrity checkpoint

| Format | Filename under reports/ | SHA-256 |
| --- | --- | --- |
| PDF | `audit_report_REP-CUSTOMER-809952caaf3c_v6.a9.cd2b72fb.pdf` | `1faf68b5a0305eebb175bb8e0282108731c688d9b2fb6888fd38abbdb7d485d8` |
| XLSX | `audit_workbook_REP-CUSTOMER-809952caaf3c_v6.a9.cd2b72fb.xlsx` | `26cbe924c6ff5bb1bbd7ff9c119a426a3947f704aa81a3751c9bdb68616eed3e` |
| JSON | `audit_package_REP-CUSTOMER-809952caaf3c_v6.a9.cd2b72fb.json` | `a2f129446360a674463deb93e4c92c44c5597d959e8cef1000d5e53b74bd9086` |
| CSV | `lead_schedules_REP-CUSTOMER-809952caaf3c_v6.a9.cd2b72fb.csv` | `06bdbb46c05cb64641182a1b3ba641f1a04d20b49e5399f27eec1c9f9638b6ba` |

The physical bytes matched these hashes at inspection. PDF text extraction found 23 pages and all included source fact IDs. Visual page/workbook acceptance was still incomplete. Do not mark presentation or accounting quality accepted merely because file integrity passes.

## 3. Measured query differential

The following were actual HTTP responses from the existing core on its observed local API listener, port 3000. This is API evidence, NOT browser proof. Initial attempts against the generic PORT value were diagnostic failures and are not evidence of absent business records.

| Request | Observed response | Meaning |
| --- | --- | --- |
| `/api/workspaces` | 200; one saved Pfizer workspace | The canonical customer workspace exists. |
| `/api/cpa/engagements/universal` | 200; eight entries including Pfizer and historical canary/Academy records | Does not match the one-entry owner screenshot; source/connection must be reconciled. Counts across different object types need not be identical. |
| `/api/cpa/engagements/eng-customer-809952caaf3cfb7b` | 404 | This is the detail-route shape used by the frontend. |
| `/api/cpa/engagements/universal/eng-customer-809952caaf3cfb7b` | 200; 133 facts, one document, but older v1.0 report labeled PUBLISHED and FY 2025 | A working route can still return stale or false presentation metadata. |
| `/api/cpa/engagements/universal/ws-1789404405588` | 404 | Workspace and engagement IDs cannot be used interchangeably. |
| `/api/cpa/reports/library` | 200; seven artifacts including current Pfizer v6.a9.cd2b72fb, READY_FOR_AUTHORIZED_HUMAN_REVIEW | The current report exists in the artifact registry. |
| `/api/reports?workspaceId=ws-1789404405588` | 200; zero reports | A second report reader does not join the canonical continuation/artifact records. |
| `/api/facts?workspaceId=ws-1789404405588` | 200; 256 raw rows | Presence is not report eligibility, uniqueness, or full extraction completeness. |

`/storage/ai_cpa_storage.json` existed with one workspace, one document, 256 raw facts, and zero entries in its legacy `reports` array. `/app/ai_cpa_storage.json` did not exist. An empty legacy reports array must not override the actual artifact registry.

## 4. Defect register and repair ownership

These are demonstrated integration gaps and clearly marked unverified hypotheses, not invented new requirements. Reproduce each before changing code.

| ID | Evidence and failure | Narrow correction / primary locations |
| --- | --- | --- |
| FV-01 | Google API destination not measured; inspected client uses relative `/api` calls and Vite has no explicit API proxy | Inspect actual preview/shared origins and route all intended calls through a supported authenticated canonical connection. `src/api/practiceClient.ts`, direct callers, environment/proxy configuration, `vite.config.ts`. |
| FV-02 | Main server reads cwd/storage/ai_cpa_storage.json, universal reader defaults to cwd/ai_cpa_storage.json | Shared authoritative storage resolver; no database copy. `server.ts`, `server/cpaOrganization/universalEngagementModel.ts`. |
| FV-03 | `selectedWorkspaceId = selectedCompanyId` although company list mixes engagement IDs and workspace IDs; report reader invents `client-${engId}` | Typed canonical identity relationship and consistent selection. `src/context/PracticeContext.tsx`, universal read model, presentation adapters. |
| FV-04 | Frontend detail route is missing `/universal/`; fallback expects `financialFacts`, API returns `facts` | Agree one typed detail contract and correct callers; provide tested compatibility only where needed. `PracticeContext.tsx`, `cpaOrganizationRoutes.ts`. |
| FV-05 | Workspace report list empty while global artifact library contains the current draft; detail returns v1.0 | Join actual workspace/continuation/artifact relationships; choose latest applicable version deterministically and expose explicit history. `server.ts`, universal model, `deliverableArtifactService.ts`, Deliverables view. |
| FV-06 | Legacy reader hardcodes FY 2025, scores, clearances, partner identity and completion; UI converts completion to Clean Opinion | Derive period/status/counts/approval only from scoped persisted evidence; remove unsupported defaults from customer projections and badges. |
| FV-07 | Universal entries inserted first and first entry auto-selected; API errors/absent fields become empty arrays; some previous data can remain | Preserve authorized customer selection, distinct error/empty/stale states, cancellation/revision guards and tenant-scoped caching. `PracticeContext.tsx`, `PracticeClientsView.tsx`, `PracticeEngagementsView.tsx`. |
| FV-08 | Internal truth audit reports ELIGIBLE_FOR_DELIVERY while package and Quinn prohibit unapproved delivery | Separate technical review from external issuance, enforce real approval bound to report version/hash, keep operator draft access distinct. `eveInternalAuditEngine.ts` and consumers. |
| FV-09 | Continuation summary flattens Athena uncertainty objects to `[object Object]`; descriptions survive in specialist/package | Render structured topic/description/evidence faithfully; preserve originals. `verifiedCustomerContinuationService.ts` and findings components. |
| FV-10 | Entity-list GET source invokes `seedRealisticGroupIfEmpty` | Remove/isolate synthetic writes from customer reads before browser tests; a read must not create corporate relationships. `server.ts`, corporate-group read implementation. |
| FV-11 | Deliverables JSON button points to `/api/cpa/audit-report/download` instead of the corresponding `/api/cpa/report/download-json`; downloads identify report but not selected version | Verify route/version/auth contracts for all four formats; selected version must resolve matching registry hash, not whichever file is found first. `src/components/views/engagement/DeliverablesView.tsx`, report routes/registry. |
| FV-12 | Runtime state and UI validation/learning labels are not one consistent evidence-backed view; screenshots show READY with absent operands | Bind existing dashboard/specialist/Academy surfaces to real records and their authority ceilings, timestamps and modes. Do not populate missing learning through fabricated history. |

Security-related access gaps revealed by a shared-backend connection must be fixed at the actual trust boundary. Caller-controlled identity headers and broad CORS are not an authorization solution. Do not silently downgrade protection to get the screenshots to look populated.

## 5. Implementation sequence and stop boundaries

### 5.1 Reproduce and freeze the comparison, not the whole project

Record current remote/workspace/runtime identities; inspect API schema and actual browser network requests; capture permitted tenant and selected IDs. Identify legitimate source drift. Preserve the completed job and receipts. No full re-extraction or new company is needed for this diagnosis.

### 5.2 Repair the backend read model first

Unify path resolution and canonical record relationships, including current report version and approval state. A list/detail endpoint must not reconstruct guessed accounting truth from filenames. Missing records remain explicit; reading a route does not create them. Retain original records and history. Diagnose duplicate facts and missing source-block references; never invent replacement IDs or source links.

### 5.3 Wire the existing frontend consistently

Use centralized compatible requests and explicit backend identity, mode and schema. Fix direct callers, detail fields, selected scope, latest report, findings and empty/error behavior. Keep existing navigation and design; only make changes needed to represent real data and expose the connection.

Data contract fields should include actual IDs, reporting period/unit/scale, proof/eligibility state, source references, data revision/observed time, and review/delivery limitations. Missing values remain null/unknown, not zero, 100%, or a fabricated date. Preserve semantic distinctions between evidence-backed extraction, professional correctness, and complete coverage.

### 5.4 Connect and verify all authorized environments

Measure each Google runtime's actual origin and supported routing, including the shared/published URL. Configure supported server-side connection or direct API authentication without starting another production scheduler/store. Default the repair's browser verification to read-only access. If a runtime cannot safely connect without a genuinely missing permission/configuration, mark that environment BLOCKED_ACCESS, name the exact requirement and stop that subtask; continue independent executable tests without claiming full parity.

Do not change secrets or production access by posting them into chat. The owner deferred key rotation, not enforcement of authentication and tenant boundaries.

### 5.5 Test, release, and prove the user journey

Use isolated regression tests and a focused PR. Carry the documentation amendments into the implementation so future work does not return to the legacy contract. Main is linked to production deployment; check triggers before merging. Deploy only through authorized mechanisms; earlier tool safety blocks are not permission to reroute the blocked operation.

Validate runtime artifacts and data preservation after cutover, then execute the REAL read-only browser journey. Do not run arbitrary shell scripts on the production server to manufacture success states. After cutover, Google observes Eve's business behavior without manual facts, state advancement or shadow agent execution.

This task does not authorize Company 2, the other nine companies, new Academy cases, new source acquisition, external customer contact, report issuance, or a new whole-system design phase. No clean-cohort certification may be inferred from this repaired-existing-record visibility pass.

## 6. Acceptance matrix — evidence required, not prefilled PASS

For each check store observed time, frontend origin/build, backend identity, user/tenant scope, record IDs, data revision, sanitized request/response evidence, and actual browser artifact references. Use PASS, FAIL, BLOCKED_ACCESS, or NOT_EXECUTED. Record unit/API tests separately from browser tests.

| ID | Check | Required evidence / rejection condition |
| --- | --- | --- |
| A-01 | Studio development preview connection | Actual iframe/API destination and backend fingerprint match intended LIVE_READ_ONLY namespace; no local production store/scheduler. |
| A-02 | Google shared/published connection | Actual shared/published URL independently exercised; same authorized records; missing URL/access is not PASS. |
| A-03 | Zeabur frontend connection | Actual browser request to intended backend with compatible schema and selected scope. |
| A-04 | Login and access boundaries | Valid session can view only permitted scope; expired/missing session and spoofed headers do not acquire authority; logout clears sensitive caches. |
| A-05 | Client/engagement selection | Existing Pfizer workspace appears in appropriate production/customer view, opens correct engagement, and is not replaced by a canary on refresh. No new workspace created. |
| A-06 | IDs and data persistence | Same document/hash/intake/job/Attempt 9/continuation/report relationship across views and environments at a reconciled revision. No string-prefix identity invention. |
| A-07 | Documents and source links | Original filing visible; selected displayed facts link to real source evidence. Missing source-block reference/page proof is explicitly reported, not fabricated. |
| A-08 | Financial presentation | Correct FY 2024 and comparative row periods, USD where authoritative, scale, zero/unknown, entity scope, and stored value lineage. No false completion for missing statements. |
| A-09 | Counts and duplication | Raw/eligible/unique/evidence/coverage counts distinguished; checkpoint 133 rows versus 117 IDs explained; no double-counting in aggregates or fixed future targets. |
| A-10 | Specialist execution | Nine recorded contracts and eleven Lexicon batches/166 proposals trace to actual receipts; model inference distinguished from deterministic engines and substantive approval. |
| A-11 | Review and delivery | Human approval pending and external delivery not granted everywhere; technical validation cannot enable issuance; unauthorized approval actions rejected. |
| A-12 | Latest draft/history | Global and workspace report views select the same applicable version; older v1.0 remains historical, not relabeled as current/PUBLISHED. |
| A-13 | Download parity | PDF/XLSX/CSV/JSON UI actions retrieve the selected version and match its registered hash. No generation/retry/upload side effect. |
| A-14 | Findings | Athena objects display real descriptions and references; no `[object Object]`; unresolved private-PBC and taxonomy-definition limitations retained. |
| A-15 | Learning/governance visibility | Existing observations/candidates/evaluations/promotions/rollbacks accurately separated; absent measurement not invented; Academy DISARMED and no new case caused by page load. |
| A-16 | Error versus empty | Disconnected API, 401/403/404/500, malformed schema and stale cache render distinct safe states; genuine authenticated empty result does not pull canary fixtures. |
| A-17 | Scope/race safety | Switch tenant/workspace/period during an in-flight request; late data cannot overwrite the new selection or leak the prior scope. |
| A-18 | Read-side-effect conservation | Before/after read journey: no new company, intake, extraction attempt, approval, synthetic entity/relationship or Academy case; normal permitted heartbeat/audit-access logs accounted for. |
| A-19 | Refresh and reopening | Same authorized selection, report version and connection identity after refresh/logout-login/reopen, with stale data labeled and schema incompatibility rejected. |
| A-20 | Rendered output acceptance | Inspect real generated PDF pages and workbook layout, not only text/hash/file existence. Record defects or unexecuted visual checks explicitly. |

A-01 through A-03 each require the relevant A-04 through A-19 browser behaviors on that surface; do not use one host's screenshots as proof for all three. A-20 applies to actual artifacts obtained through the authorized UI. Refresh updates may be tested with isolated fixtures where no live state changes occur; never manufacture a new production event simply to satisfy an observation.

## 7. Definition of done and owner handoff

The visibility repair is done only when the existing interface is the owner's reliable view of the actual backend: the same current scoped records, source evidence, specialist outcomes, report versions, review limitations, and legitimately measured learning state appear through all required authorized entry points. Any material untested/inaccessible surface, false authority label, data leak, stale/wrong report, or read-side business mutation leaves the corresponding gate open.

Return the filled acceptance matrix, before/after defects, exact code/documentation commits, current deployed artifacts, unresolved defects, and the actual owner navigation path to the latest draft. Provide short checkpoints throughout. A file existing on GitHub, a passing unit test, or a server returning healthy is not the owner handoff.

The application may truthfully become a usable public-filing review demonstration after acceptance. Broader autonomous bookkeeping/audit claims still require separately authorized workflows and independent evidence. Stop at the owner-visible integration report; do not release another company or authorize professional distribution.

## 8. Evidence maintenance

Keep this checkpoint immutable as historical context. Append dated observations and links to sanitized acceptance artifacts as implementation proceeds; never overwrite a failure with an unexplained PASS. Pin repository references to commits and browser evidence to the runtime/data revision observed. Do not commit private customer records, session tokens, raw environment dumps, provider prompts containing confidential data, or secret values.

Platform references that informed the connection contract are listed in document 23. They describe capabilities, not the actual configuration of the owner's app.
