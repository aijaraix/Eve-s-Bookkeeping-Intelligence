# AI Studio ZIP reconciliation — 2026-09-15

**Status: source preservation and independent code review only. DRAFT / DO NOT MERGE OR DEPLOY.**

The owner supplied the AI Studio source ZIP after canceling a conflicting pull. This branch preserves the actual exported repair against the unchanged GitHub baseline and carries the authoritative documentation from PR #19. It is not a release approval, confirmation of the reported 9/9 tests, live API acceptance, or browser proof.

## 1. Source custody and comparison

- Repository baseline: `0509c73f68a1dfc722529d3e333993bbf137c489`.
- Documentation parent: `bc789aaeb65dd328a025d185167d7be82e523210` (PR #19).
- Owner ZIP SHA-256: `813c0fccf021c4ec2c59b8d95bf8277290664ada72b577f296ec57c6c89feec4`.
- ZIP inventory: 450 files; 29 paths under `storage/` excluded from import. The archive is retained privately; no source ZIP, secrets, storage contents, generated Academy files, or production data are uploaded to this branch.
- Five runtime files differ: `server.ts`, `cpaOrganizationRoutes.ts`, `universalEngagementModel.ts`, `eveInternalAuditEngine.ts`, and `verifiedCustomerContinuationService.ts`.
- The entire 110-file `src/` tree is unchanged. Its computed Git tree is `51b68070eba42f08c47bccbc724bfc0af4e5d01d`, identical to baseline. In particular, the frontend API client, PracticeContext, and Deliverables view were NOT repaired in this export.
- `vite.config.ts`, package.json, package-lock.json, all existing server tests, extraction code, and worker code are unchanged.
- Reversing only the five observed source deltas reproduces every corresponding baseline blob hash and the entire baseline `server/` tree `b9804b47e2c55c51b6f5c00b09cc2a6b549afeed`. This establishes that unrelated server source was not silently overwritten.
- The ZIP omits the baseline `Dockerfile`. Absence from an export is not a deletion instruction: preserve it from GitHub.
- The three amended existing documentation files match PR #19. The export places the dated repair document in a duplicate directory; retain the authoritative copy under `docs/eve-operating-system/`, inherited from PR #19, rather than creating competing instructions.
- The auto-generated README is excluded as unrelated export boilerplate. Existing legacy snapshots, old audit reports, and stored data are not re-imported or promoted as proof.
- The original `test_all_defects.ts` is preserved for review, NOT added to the accepted regression command and NOT treated as certification.

### Expected source blobs after preservation

| File | Git blob |
| --- | --- |
| server.ts | `7b169e0bc4c669ea9a85e052551ca0562d7685bf` |
| server/cpaOrganization/cpaOrganizationRoutes.ts | `ca64e0c633c22279482f3952b7c04182809a26b0` |
| server/cpaOrganization/universalEngagementModel.ts | `9462fd5ce22772aa67fb8bab91e26ef279f1b95f` |
| server/cpaOrganization/eveInternalAuditEngine.ts | `3a812452ba3f027aa0a1200ae8b288281cffab0c` |
| server/cpaOrganization/verifiedCustomerContinuationService.ts | `0a029f59efea5f9876a36f6c6f5c6c5d1cf06931` |
| test_all_defects.ts | `9c7e219aae5304c33644e81820ba41c7cdbda514` |

A one-shot branch-only materialization workflow may apply the hash-checked source delta and remove its own bootstrap files. It must never update main. Its separate validation job has read-only repository permission, no production credentials, and no deployed service access. Preservation success is independent of validation success: a failed validation must leave this PR a draft with the failure retained.

## 2. Conflict disposition

The visible Studio-only `getContinuationByEngagementId` addition and uncertainty formatting are retained. The full pre-existing continuation implementation, v6 logic version, terminal-state guards, source identity, and retry history rules are preserved. No whole-file choice from the screenshot is required.

This lookup is not yet an accepted canonical identity resolver: it combines four ID types, ignores corrupt JSON, and sorts by a timestamp that can be missing/invalid or tied. It has no new application call sites in the exported delta. Do not claim that merely adding it repairs the caller's workspace/engagement mapping or selected report version.

## 3. Independent findings in the actual exported code

### R-01 — The required frontend connection is not implemented

`src/api/practiceClient.ts`, `src/context/PracticeContext.tsx`, `src/components/views/engagement/DeliverablesView.tsx`, and `vite.config.ts` are byte-identical to baseline. Relative /api requests, selectedWorkspaceId = selectedCompanyId, first-entry/canary selection, empty-array error handling, and the JSON-download URL remain. Existing local backend routes do not establish a secure shared Zeabur backend for Google preview or published UI.

### R-02 — Report integration contains a missing binding and guessed identity

`server.ts` calls `deliverableArtifactService.getAllArtifacts()` without importing or defining that symbol. The new `catch (e) {}` can hide the runtime ReferenceError and return the unchanged empty report list. The new matcher uses `reportId.includes(workspaceId.replace('ws-', ''))`; that is not a canonical join and can match unrelated identifiers. It refers to `art.workspaceId`, which is not part of the current artifact record contract. Fix the typed relationship using actual continuation/workspace/engagement IDs and propagate a real read failure; do not solve this with `any`, substring matching, or hardcoded Pfizer IDs.

### R-03 — The storage read introduces writes and retains a second fallback

`getAllEngagements()` now creates an empty accounting database when the file is missing. That is a business-state write during a list/read and can mask missing persistence or a wrong environment. `getEngagementDetail()` still falls back to the former application-root store. Use a shared authoritative path resolver with explicit missing/unavailable/corrupt-state behavior. Do not create or copy an accounting store while rendering a list.

### R-04 — The facts alias is incomplete at the type boundary

The detail return object adds `financialFacts`, but the `UniversalEngagementDetail` interface in the export does not declare it. The original test reads this undeclared property. A compatibility alias may be useful, but it needs a correct typed schema and identity-correct callers, not just another property on a return object.

### R-05 — The proposed delivery gate still has a bypass and conflates technical review

The new pending-review check only adds a blocker when `!approval`. An arbitrary non-empty object can bypass this branch in a draft, including when Quinn explicitly reports deliveryEligible=false. It does not validate that approval is authentic, current, non-revoked, scoped, and bound to the selected report hash/version.

Conversely, adding a P1 for every ordinary unsigned draft makes auditDeliverableTruth.compliant false; the continuation uses that field for technicalPass. This can turn the expected human-review boundary into BLOCKED_TECHNICAL_VALIDATION. Separate evidence/technical validity from external delivery authorization. Do not weaken the genuine professional-signoff authority or change tests merely to accept a new misleading status.

### R-06 — Route aliases do not fix report versioning or false authority labels

The export adds list/detail and download aliases. Existing Content-Disposition and X-Artifact-SHA256 headers were already present in the baseline. The aliases do not select a requested version, fix the unchanged frontend JSON URL, or remove FY 2025, 100-score, fabricated partner, cleared-note, or completion defaults. Preserve any useful compatibility routes but validate their actual consumers and authorization.

### R-07 — A useful read-side-effect fix is present

The entity-list GET no longer calls seedRealisticGroupIfEmpty. This is a relevant narrow change. Its acceptance test still needs to compare before/after state for a real isolated workspace; a response with an entities array alone is not evidence that nothing was written.

### R-08 — Readable findings are partially improved

The new formatter reads description/topic/text for simple uncertainty objects. The original source objects must remain preserved. Test the actual production formatter, nested/malformed values and persisted read projection. Do not bump continuation logic or rerun models just to update display text on historical records.

## 4. Why the original 9/9 report is not an acceptance gate

The preserved test script:

- permits a failed HTTP alias result to be treated as success when the direct manager returns an array;
- treats an empty artifact array as passing;
- treats HTTP 404 as passing the PDF header check and never requires a matching filename or digest;
- chooses the first engagement/canary instead of establishing the existing customer's full ID relationship;
- tests a locally duplicated uncertainty expression rather than the production formatter;
- checks only that the continuation method exists, not its sorting/ambiguity behavior;
- does not compare entity storage before/after the read;
- increments failure counters but does not set a nonzero exit status when assertions fail;
- does not verify browser destinations, authenticated tenant scope, existing customer selection, cross-environment parity, report version selection, or rendered UI behavior.

Do not quote 9/9 as physical proof. Replace these with isolated fail-closed behavioral regressions mapped to the ORIGINAL FV-01 through FV-12 definitions and A-01 through A-20 acceptance matrix. Preserve this original version in history. Record compiler, existing regression, and build outcomes separately; a transpiled bundle is not a TypeScript pass.

## 5. Work order from this branch

1. Read this review, the active section of 09, the amendments in 06 and 23, and FRONTEND_RUNTIME_REPAIR_2026-09-15.md.
2. Start from current `fix/frontend-runtime-parity` and compare current main before editing. Do not overwrite the preserved source from an older AI Studio snapshot. The reported local commit 7c9c2977... was not the remote branch identity; use the actual pushed commit from this PR.
3. Correct R-02 through R-06 and complete the omitted canonical ID/read-model and shared authenticated frontend connection. Keep useful changes without preserving their demonstrated regressions.
4. Add genuine negative tests for missing stores, spoofed approval, explicit Quinn denial, duplicate/ambiguous IDs, stale versions, disconnected API, and tenant switching. A missing backend is not an empty company.
5. Carry out isolated TypeScript/regression/build checks, then return the exact implementation commit and deployment plan for review. This preservation operation does not authorize merging or deployment.
6. Complete the real existing-product read-only browser journey on each required surface after an approved release. Unexecuted/inaccessible checks remain unexecuted/blocked, not PASS.

Do not create another intake, rerun Pfizer extraction or specialists, reset attempts, alter facts, arm Academy, start Company 2/the cohort, rotate credentials as a diversion, or grant professional approval. Do not expose secrets, introduce an open proxy, or weaken authentication. No live server mutation was part of this ZIP reconciliation.
