# Eve frontend parity — staged completion runbook

**Updated:** 2026-09-15. **Scope:** finish the existing owner-visible integration on draft PR #20, not redesign Eve or restart Company 1. **Status:** implementation work order with independently measured candidate results; NOT a deployment, browser acceptance, or professional certification.

## 0. Read this checkpoint before taking another action

Repository: `aijaraix/Eve-s-Bookkeeping-Intelligence`.
Implementation branch: `fix/frontend-runtime-parity`; existing draft PR: #20.
Preserved third-export source: `644decd8c4f157d46e7c8f5f2f6136cc450e59cc`.
Main at this review: `0509c73f68a1dfc722529d3e333993bbf137c489`.
Third ZIP SHA-256: `dd3876f1d2e16e6e3cd2f7bf5b8806c4bff755b9fff3ec70890cf084948397ed`.

The source has already been saved remotely. Do not make the owner repeat Pull/Sync or another upload to preserve this checkpoint. Fetch the current repair branch and main, preserve legitimate newer work, and compare a dirty Studio workspace before replacing anything. A local branch name or local commit is not proof of a successful push. If you cannot push the repair branch through supported access, state that exact limitation; never substitute a push to deployment-linked main.

The latest ZIP changes three production source files and one test relative to the previous export: `cpaOrganizationRoutes.ts`, `deliverableArtifactService.ts`, `eveInternalAuditEngine.ts`, and `test_all_defects.ts`. Their before/after Git blob hashes were checked during preservation. The current main Dockerfile, earlier saved source, review probes, and PR #19 documentation remain. No exported runtime data, .env secrets, or generated PASS report was imported as production evidence. The one-shot source importer deleted itself after preservation.

### 0.1 Independent results, not the Studio summary

Workflow: https://github.com/aijaraix/Eve-s-Bookkeeping-Intelligence/actions/runs/34918944236
Validation job: `104222555695`. Tested source: `644decd8c4f157d46e7c8f5f2f6136cc450e59cc`.
Isolated runner with read-only repository credentials, no production data/service credentials; no deployed application or Company 1 action.

| Check | Actual result |
| --- | --- |
| Four-file export preservation | PASS, exact result blobs |
| TypeScript `tsc --noEmit` | PASS |
| Existing `npm test` | PASS; existing live-provider-dependent exclusions are not provider proof |
| Existing independent `studioSecondExportBehavioralReview.ts` | **10/10 PASS**, previously 4/10 |
| Additional event-custody and disk-rehydration probes | **6/8 PASS, 2 FAIL** |
| Production bundle generation | PASS, not deployed |
| Combined candidate gate | **FAIL** |
| Studio's separate `test_all_defects.ts` | Preserved; claimed 12/12 is not independently accepted as the original FV matrix |
| Production API / actual browser acceptance | NOT EXECUTED in this review |

Candidate bundle hashes: server `2853e6ddf7047b5bdb3478ef022608237d5e4010bb1fef6cef92821f7b4e4200`; worker `94def6f89c7e48696106f61cceb248f80bb2a094faa572a11fad8a874622267a`. Do not substitute these for current physical production fingerprints.

**Closed at isolated-test scope:** the four download handlers now forward the selected version; explicit historical lookup and missing-version rejection work in controlled tests. Actual disk rehydration retains two same-ID versions, selects the newer timestamp by default, and preserves historical fixture bytes. Unknown-principal approval-shaped objects are rejected. A simple structured uncertainty is formatted correctly. Keep these successes; do not redo them as new work.

**Still failing under the existing FV-08 requirement:**

1. A controlled provider recognizes a fictional authorized human principal and session, but no approval event exists for the report. A caller-supplied approved object naming that principal is nevertheless accepted for delivery. Knowing who a person is does not establish that they approved this report.
2. A controlled approval event is recorded, then revoked through the actual guard. The active approval lookup correctly returns nothing, yet passing an old approved copy to the audit function makes delivery eligible again. The supplied copy must not override the current revocation ledger.

The positive control using a recorded fixture event with matching scope passes, and a mismatched report version is rejected. These findings are isolated function tests, NOT evidence that a production approval or delivery occurred.

Replayable tests: `scripts/review/studioSecondExportBehavioralReview.ts` and `scripts/review/studioThirdExportBehavioralReview.ts`. Preserve their rejection conditions. The old 10-test suite was not weakened to produce its new pass.

### 0.2 The main owner outcome is still open

**No frontend file changed in the third ZIP.** Across the second/third exports only `DeliverablesView.tsx` changed relative to main; the central `practiceClient.ts`, `PracticeContext.tsx`, and Vite connection configuration remain unchanged. This review therefore does not establish shared authenticated Google-to-Zeabur data access, correct workspace selection, or honest error/empty rendering. Ten function/handler tests do not cover those behaviors.

The original definitions remain in `FRONTEND_RUNTIME_REPAIR_2026-09-15.md`. Do not rename FV-03 (identity mapping) into route aliases, FV-06 (truthful presentation) into download headers, or FV-12 (evidence-backed runtime/learning presentation) into four download-route checks. A localhost health response does not close FV-01. A 404 response cannot pass a positive download test.

## 1. Execution discipline — one stage, one meaningful checkpoint

Follow stages 1 through 7 in order unless the owner explicitly chooses a named stage. Read the relevant functions before editing; do not reread the entire historical architecture as a reason to postpone the work. Existing documents 06, 09, 23, the original FV register, and professional/tenant/custody rules remain in force.

For each stage: reproduce the missing behavior, implement only its scoped correction, run the stated positive and negative checks, save the actual source on this branch, and return a short evidence checkpoint. Do not claim the next stage passed. Stop at a genuine permission barrier or a required release approval, not at an invented need to re-upload Pfizer. Independent fixture tests can proceed without production access. Do not fabricate substitute live data when a target cannot be reached.

The owner wants a working existing interface. A different dashboard, copied production database, hardcoded Pfizer card, fixture fallback, or direct-file-download shortcut is not completion.

## Stage 1 — establish the actual shared read-only connection

**Target:** FV-01 and the connection portion of FV-07/FV-12. **Do not deploy yet.**

1. Inspect `src/api/practiceClient.ts`, direct `/api` requests in components/context, the development entrypoint in `package.json`, Vite configuration, and the actual Google preview/published runtime configuration. Record frontend origin, actual iframe origin where applicable, API destination, and backend identity separately. Do not infer the iframe destination from the AI Studio editor URL.
2. Identify the existing production core from actual runtime evidence. Historical reference: `https://eves-worker.zeabur.app/` was the core, despite its confusing name. Revalidate; never infer service role from the name.
3. Choose a supported authenticated transport for the current app: explicit API-origin resolution or a narrow same-origin server proxy. Centralize it so component calls, downloads and refreshes cannot silently return to a local empty backend. A Vite dev proxy alone does not configure a published Google server; prove each entrypoint separately.
4. Enforce a read-only frontend/proxy role before importing code that starts schedulers, queue writers, Academy, seeders, or a local accounting store. Merely placing a proxy before routes is insufficient if module initialization already started those services. Keep the existing Zeabur scheduler as the authority.
5. Preserve the established authentication/session and tenant model. Verify scope on the server; `x-user-email`, caller roles, and tenant headers alone are not authority. Never put provider/worker/admin secrets in browser-exposed variables, URLs, logs, or client storage. A proxy must have a fixed approved upstream, controlled methods/paths, and cannot forward arbitrary caller-supplied targets or privileged identities. An authorized operator viewing a draft does NOT require falsely asserting a CPA license or creating a professional approval.
6. Show connection mode, backend identity, last successful read, selected scope, and error state in the existing interface. Missing access/configuration must be explicit rather than showing a canary or zero clients.

**Stage evidence:** actual request path from the existing frontend to the intended backend, authenticated read result and schema, and a negative disconnected/expired-session check. If live target access is missing, deliver the tested transport code with `BLOCKED_ACCESS` for the affected live surface and identify exactly one indispensable permission/configuration. Do not certify the connection from a local health check. Do not test live mutating routes.

## Stage 2 — connect the existing client selector and workspace detail

**Target:** FV-02, FV-03, FV-04, FV-05, FV-07. **No new intake or extraction.**

1. Use one read-only storage resolver shared by `server.ts` and the universal customer projection. Production storage must be the existing persistent volume, not a copied or newly initialized database in Google. Missing/unreadable/corrupt storage must produce a distinguishable service/data error; reading a list must never create an empty replacement store.
2. Join persisted workspace, document, queue job, continuation, and report registry records by their actual relationships. Keep `workspaceId`, `engagementId`, `documentId`, `jobId`, `reportId`, and `reportVersion` separate. Never use substring matching, an invented `client-` prefix, or `workspaceId || engagementId` as proof that the identities are equivalent.
3. Historical reference to verify: workspace `ws-1789404405588`; engagement `eng-customer-809952caaf3cfb7b`; document `doc-1789375664699-hpue`; completed job `JOB-INTAKE-intake-1789375664744-5mh3`, extraction Attempt 9. These are selectors for inspecting existing records, not values to hardcode into UI logic or create again.
4. Repair `PracticeContext.tsx` selection and its callers. The selected company is not automatically a workspace. Both compatibility detail routes must call one typed/scoped resolver; `facts` and its `financialFacts` compatibility alias must refer to the same authorized array. Prefer/preserve an authorized real customer selection rather than blindly choosing the first canary.
5. Add explicit loading, authenticated-empty, disconnected, unauthorized, not-found, malformed-response, and stale states. Cancel or reject late responses when user/tenant/workspace/period changes. Clear prior-scope sensitive state on logout and scope changes. A rejected request must not masquerade as an empty successful list.
6. Make the workspace report list and global library resolve the same scoped registry and actual latest applicable version. Do not stop at merging every report into every workspace or copying values into the legacy `db.reports` array.

**Stage evidence:** in an isolated representative fixture, two workspaces/engagements cannot read each other's documents/facts/reports; missing/corrupt backing records yield explicit errors; no GET creates business objects. On the authorized live connection, the EXISTING Clients page must select the existing Pfizer workspace and open its real document and current draft references. If not yet deployed, label that live journey NOT_EXECUTED, not complete.

## Stage 3 — truthful financial, report and learning presentation

**Target:** FV-06, FV-09, FV-10, FV-11, FV-12; preserve the now-passing version tests.**

1. Correct `universalEngagementModel.ts` and presentation adapters to read actual reporting periods and status. The known report is FY 2024 with comparative periods. Remove unsupported FY 2025, 100 scores, fabricated partner/license/clearance values, `Clean Opinion`, `PUBLISHED`, and completion inferred merely from fact/file existence. Do not invent source quotes, hashes, page numbers, or missing corporate relationships.
2. Display raw extracted rows, eligible rows, unique fact IDs, evidence occurrences, and source coverage as different measurements. At the old checkpoint: 256 raw rows, 133 eligible rows, 117 distinct included IDs. Derive current numbers; never make these hardcoded production acceptance targets. Prevent duplicate-ID rows from double-counting aggregates; preserve original occurrence/evidence history. Missing balance operands or statements remain missing, not zero or READY.
3. Connect a displayed value to its persisted document/source evidence. HTML extraction locators are not independently verified physical PDF pages. Preserve missing-source-link findings instead of manufacturing clickable proof.
4. Keep execution success, technical validation, substantive findings, and external authorization visibly separate. Display persisted specialist receipts and structured findings with readable topic/description/source references. Health alone is not execution; Lexicon's 166 historical name proposals are not verified taxonomy anchors.
5. Use the selected `(reportId, version)` throughout lists, detail, registry, and all four download actions. Retain prior versions and immutable historical bytes; missing/stale/disallowed versions must not silently substitute another. Verify bytes against the selected version's registered hash. Do not regenerate reports or rerun specialists simply to populate a screen.
6. Bind Academy/learning screens to actual saved observations, evaluations, candidate capabilities, promotions and rollbacks. Absence is `NOT_MEASURED`/not yet evaluated, not a seeded achievement. Maintain Academy DISARMED. Viewing entity/learning pages must not call `seedRealisticGroupIfEmpty`, create new cases, or promote a capability.

**Stage evidence:** selected periods and report hashes agree between API and UI; readable limitations and correct learning states; default/stale/wrong-version negative tests; before/after conservation of all business IDs and attempts. The completed original FV/A matrix is the scope, not a renamed list of convenient checks.

## Stage 4 — close approval-event custody, not just principal validation

**Target:** the remaining measured FV-08 failures. This stage may be worked in parallel with read-only frontend work, but remains a release blocker.**

1. Read the implementations, not just names, of `isValidApprovalObject`, `getApprovalForReport`, approval registration/event processing, revocation, and report invalidation. The first validates principal/object eligibility; it does not establish that the supplied approval was actually recorded or remains active.
2. For a delivery decision, resolve the authoritative persisted approval by identity and current report context. Require an actual registered, non-revoked approval event with matching tenant/engagement/report/version/hash and authorized scope. Compare against current ledger state. Caller-supplied copies are references to validate, not competing authority.
3. A recognized human without a recorded report approval must remain blocked. A revoked approval replayed as an old `APPROVED` object must remain blocked. Omitted required binding fields must not turn equality checks into optional checks. A report hash must come from the current registered artifact, not a caller assertion.
4. Respect synchronous/asynchronous authority-provider contracts. Do not configure synthetic trusted principals or override production authority to make a positive test pass. Use clearly fictional principals/events only inside isolated tests. Genuine pending human review is normal: a technically valid draft can remain `compliant=true` with delivery blocked. Draft viewing is not statutory issuance.
5. Keep all actual issuance and report-status consumers aligned; do not repair the audit return value while leaving a registry rehydration path that treats an arbitrary approval-shaped field as certification.

**Stage evidence:** unchanged prior 10 tests pass; the additional eight review tests pass, including the two failed event-custody cases and their positive control. Add relevant missing-binding, expiry, cross-scope and persisted-restart negatives to the real production decision path. Do not relabel the unrecorded approval in `test_all_defects.ts` as a genuine positive event.

## Stage 5 — combined code gate and release plan

1. Fetch current remote heads and ensure your source is actually pushed on the repair branch. Preserve old failure reports and append current results rather than rewriting their history. Retain the same PR #20; do not introduce a new architecture package.
2. In an isolated environment without production data/credentials, run TypeScript, the existing regression command, both review suites, and the focused connection/identity/UI tests. Tests must return nonzero on failure. A missing route, 404 or empty array cannot satisfy a positive behavior expectation. Mocked component/handler tests are not browser or production evidence.
3. Build from the exact reviewed commit and record resulting hashes; no success from a compile helper overrides failed type/behavior checks. If a known provider-dependent test is excluded, state that exclusion and its scope. Do not spend model credits reprocessing the completed filing for this visibility task.
4. Produce a minimal per-service release plan: target repo/branch/SHA, backend/frontend roles, schema compatibility, mounts, preserved IDs, affected secrets by NAME only, active scheduler, current/target image digests and rollback mechanism. Keep unchanged worker packaging as an explicit open item; do not unnecessarily roll workers to change a label.
5. Stop before main merge/deployment unless the owner has explicitly authorized that release. Main is linked to Zeabur and a merge may deploy. A runbook describing deployment is not itself permission to deploy an unaccepted candidate.

**Stage evidence:** reviewable pushed commit, real tests/logs, original FV map, known exclusions, and an exact release plan. No claim that all three frontends are live before the next stages.

## Stage 6 — approved rollout, exact bytes, preserved data

Execute only after the release boundary is authorized.

1. Revalidate baseline and compatibility; capture safe state fingerprints of the original document/job/attempt/continuation/reports and disarm posture. Use approved backup/recovery practices without copying production records into the public repo.
2. Merge/deploy through the existing GitHub/Zeabur release process and supported Google frontend configuration/publication process. Do not blindly press a Pull conflict button, force-push main, install runtime source manually, or bypass a tool/access restriction.
3. Verify the actual running frontend and backend artifacts, deployment generation, registry image digest, mounts and single scheduler. A typed source label is not proof of executing bytes. Do not accidentally point the production backend at a documentation/review branch.
4. Check the existing job remains completed at Attempt 9 and no extra intake, extraction, specialist run, approval or Academy case was produced by rollout/reads. Do not bump continuation logic merely to force re-execution. Investigate an unexpected change before declaring readiness.
5. After release, Google is WATCH_ONLY for business execution. Repairing software is not permission to manually supply financial outputs, clear findings, or certify the report.

**Stage evidence:** approved release reference, exact executing identities and state-conservation comparison. Health checks alone do not close Stage 7.

## Stage 7 — real owner browser acceptance on every required entrypoint

Perform the original A-01 through A-20 matrix, separately for Studio development preview, the actual shared/published Google URL, and Zeabur UI. Do not reuse one environment's screenshots as proof of another.

The read-only journey is: authenticated login → existing client selector → existing Pfizer → source document → financial values and comparative periods → click-to-evidence → specialist outcomes/limitations → latest draft PDF/XLSX/CSV/JSON → refresh and reopen. Record actual network requests, backend and frontend identity, permitted scope, record IDs, version/hash, observed timestamps and sanitized real browser evidence. Inspect rendered PDF pages/workbook, not just file existence.

Negative checks must distinguish disconnected backend, expired session, forbidden scope, missing report version, schema failure and genuine empty data. Scope changes cannot display cached previous-tenant data. No page load may generate a synthetic organization or new case. Record legitimate intervening data revisions rather than assuming all screenshots are simultaneous.

A missing browser tool, user session or shared URL is `BLOCKED_ACCESS` or `NOT_EXECUTED`, not a generated browser trace. Do not claim a private Google iframe was inspected when only its editor screenshot was available. Name the exact indispensable owner action only when supported tools cannot resolve it.

**Finish:** the owner can use the EXISTING interface to inspect the actual saved work through every required authorized surface. Remaining untested/failed surfaces stay open. Stop at the integration handoff; no Company 2/cohort, Academy activation, professional signature, external communication or report issuance is authorized. A repaired visibility pass does not retroactively make Company 1 a clean autonomous single-release trial or prove all CPA services.

## Checkpoint format and immediate next instruction

At each stage return only the stage's evidence, not an unqualified all-defects-complete summary:

```text
STAGE=
SOURCE_BASE_AND_CURRENT_PUSHED_SHA=
WHAT_CHANGED=
FILES_CHANGED=
ACTUAL_POSITIVE_AND_NEGATIVE_CHECKS=
EVIDENCE_SCOPE=SOURCE|ISOLATED_TEST|RUNTIME|PRODUCT|BROWSER
FRONTEND_ORIGIN_AND_BACKEND_IDENTITY=
PRESERVED_COMPANY1_JOB_ATTEMPT_AND_REPORT=
UNRESOLVED_OR_BLOCKED=
NEXT_STAGE=
OWNER_ACTION_REQUIRED=NONE_OR_EXACT_PREREQUISITE
MERGED=NO_OR_AUTHORIZED_RELEASE_REFERENCE
DEPLOYED=NO_OR_VERIFIED_RUNTIME_REFERENCE
```

**Start with Stage 1 now when the owner sends this handoff.** Reuse the preserved third-export work. Prioritize proving/implementing the shared read-only connection and actual customer-selection path, then follow the stages. Do not spend the next response repeating that twelve local labels passed. The gate is owner-visible data parity, with approval-event custody enforced before release.
