# Second AI Studio export — independent review, 2026-09-15

**Status: SOURCE PRESERVED; COMPILATION PASS; INTEGRATION ACCEPTANCE FAIL. DRAFT PR #20 MUST NOT BE MERGED OR DEPLOYED YET.**

This appends to `STUDIO_EXPORT_RECONCILIATION_2026-09-15.md`; it does not overwrite the first export's failed results or change the original FV-01 through FV-12 definitions. This is a review of the owner's new source export, not a new architecture package.

## 1. Exact source and preservation

- Repository: `aijaraix/Eve-s-Bookkeeping-Intelligence`.
- Existing branch: `fix/frontend-runtime-parity`; existing draft PR: #20.
- Production/main baseline checked: `0509c73f68a1dfc722529d3e333993bbf137c489`.
- First exported source preservation: `f3a595dce3a364aed0676d6bda55f11675aff309`.
- Second ZIP SHA-256: `7c91e042cb974d18c64ca00b3349cc11d96e0f4dd15a3738809479d452acaa50`.
- Second source preservation and tested commit: `b6928ce627a871cc6ea381a78d4a74ed4b19521c`.
- Six modified source files plus the revised `test_all_defects.ts` match the second ZIP byte-for-byte by Git blob IDs. The original conflicted continuation additions remain preserved.
- Only one of the 110 frontend files changed: `src/components/views/engagement/DeliverablesView.tsx`. `PracticeContext.tsx`, `practiceClient.ts`, Vite configuration and the other frontend files remain unchanged from the prior source.
- Existing repository Dockerfile, documentation from PR #19, and history were preserved. Missing files in the export were not interpreted as repository deletions. Exported runtime storage, Academy records, secrets, ZIP archives and duplicate/stale documentation were not imported.
- A bounded one-shot CI preservation job verified old and new hashes before writing only the approved files to this repair branch. It removed its own importer and workflow. No force push, main update, merge, production access or deployment occurred.

| File | Preserved result Git blob |
| --- | --- |
| `server.ts` | `37dd0b9113c99d8f69e95932baabeb9d35587a95` |
| `server/cpaOrganization/deliverableArtifactService.ts` | `a0ab5708193da41fe5bd0fc858c690ae023e6045` |
| `server/cpaOrganization/eveInternalAuditEngine.ts` | `afc59cafe60ce969bf5a174475b0ea9436656213` |
| `server/cpaOrganization/universalEngagementModel.ts` | `86fa800bc08de9b01fab71638e857f84ebc16696` |
| `server/cpaOrganization/verifiedCustomerContinuationService.ts` | `c14dd42ec7db8dc62695154fa303f930f73148e4` |
| `src/components/views/engagement/DeliverablesView.tsx` | `870357c0f998774b2cae480e5a2d7099dcd506a8` |
| `test_all_defects.ts` | `1d029b4ea73c945d4d0a8d2ff282e7de0bae1aac` |

## 2. Improvements actually present

The missing report-service import and the undeclared `financialFacts` compatibility field are fixed. The universal list reader no longer creates an empty database on reads, and its detail path no longer falls back to the project-root database. The report list replaces substring matching with a continuation lookup, but downstream identity issues remain below.

The frontend JSON download now uses `/api/cpa/report/download-json` and all four download buttons attach the selected version. The artifact lookup method accepts an optional version. A reusable uncertainty formatter is exported and called by the continuation code. Ordinary unsigned drafts no longer become technically noncompliant merely because delivery is pending; they remain blocked for external issuance.

These are real source improvements, not proof that the existing owner interfaces are now integrated.

## 3. Independent CI evidence

Workflow run: https://github.com/aijaraix/Eve-s-Bookkeeping-Intelligence/actions/runs/34916364080

- Preservation job: `104214740989`, successful; exact source hashes checked.
- Validation job: `104214765046`, final outcome **failure**.
- Test implementation: `scripts/review/studioSecondExportBehavioralReview.ts`.
- Evidence artifact: `10376536808`, `second-studio-export-review-evidence` (retention-limited; observations also recorded below).

| Gate | Observed result |
| --- | --- |
| Locked dependency install, lifecycle scripts disabled | PASS |
| `npm run lint` / `tsc --noEmit` | PASS, zero errors |
| Existing `npm test` command | PASS; existing provider-dependent routing checks remain outside live-provider proof without credentials |
| Independent function/handler checks | **4 passed, 6 failed** |
| `NODE_ENV=production npm run build` | PASS |
| Combined gate | **FAIL**, nonzero exit |
| Production API acceptance | NOT EXECUTED during this source review |
| Real browser acceptance, all required frontends | NOT EXECUTED |

Compiled artifact hashes for the tested candidate, NOT a deployment claim:

- `dist/server.cjs`: `887567a27dda7ac9b7fd4fb9e850f25981ed5f45100402be2408d63f57a678bb`.
- `dist/worker.cjs`: `94def6f89c7e48696106f61cceb248f80bb2a094faa572a11fad8a874622267a`.

The independent tests run after switching to a fresh temporary directory, with no provider credentials, no production data and no application server. External fetch is disabled. They invoke actual exported functions and registered route-handler callbacks with explicitly isolated fixtures. The download lookup is stubbed to distinguish selected v1 from default v2. These are meaningful function/handler tests, NOT HTTP authorization tests, real browser execution or professional approval.

| Check | Observed result |
| --- | --- |
| Unsigned draft keeps technical status separate from issuance | PASS: compliant=true, delivery blocked |
| Final-status claim with no approval | PASS: compliant=false, delivery blocked |
| Unregistered, merely shaped approval with a PHYSICAL_HUMAN string | **FAIL: compliant=true, ELIGIBLE_FOR_DELIVERY** |
| Same invented approval with no signatureType | **FAIL: compliant=true, ELIGIBLE_FOR_DELIVERY** |
| Direct artifact method supplied version v1 with both versions in a fixture | PASS: v1 returned |
| Actual PDF handler propagates selected v1 | **FAIL: version omitted from lookup; default v2 selected** |
| Actual XLSX handler propagates selected v1 | **FAIL: version omitted from lookup; default v2 selected** |
| Actual JSON handler propagates selected v1 | **FAIL: version omitted from lookup; default v2 selected** |
| Actual CSV handler propagates selected v1 | **FAIL: version omitted from lookup; default v2 selected** |
| Exported formatter handles simple topic/description | PASS |

No external report was sent and no actual production sign-off was attempted. The two approval failures demonstrate an invalid trust decision in the candidate audit function, not an observed public exploit.

## 4. Remaining blockers, using the ORIGINAL FV definitions

### FV-01 / FV-03 / FV-07 — the principal empty-interface defects remain

The central API client and selected-workspace state are unchanged. Calls are still relative `/api` requests, and `selectedWorkspaceId = selectedCompanyId` still conflates engagement and workspace identifiers. Boot still inserts universal/canary entries first and selects the first item. Failed/missing requests can still become empty arrays. This export does not implement or independently prove a shared authenticated backend connection for Google preview/published surfaces.

Aliasing routes and adding `financialFacts` cannot establish that connection or repair all identity consumers. Complete the existing request/selection contracts without creating another frontend, database, scheduler or seeded customer record.

### FV-05 / FV-11 — version handling is only partially wired

`cpaOrganizationRoutes.ts` is unchanged from the earlier export: all four handlers still call `getArtifactByReportId(reportId)` without `req.query.version`. The frontend now sends version, but the backend ignores it. Propagate and validate the selected version and reject unknown versions rather than silently downloading another.

Source review also found `rehydrateFromDisk()` deduplicates by report ID alone, and generation filters out existing entries by report ID alone. Adding an optional version filter does not make multiple persisted versions available. Test a cold registry with two real fixture packages sharing one report ID, distinct versions/hashes and timestamps. Preserve history, select latest explicitly when intended, and reconcile workspace/global/detail views. The direct-method passing test above deliberately does NOT prove disk rehydration.

### FV-03 / FV-06 / FV-12 — canonical representation and truth labels remain incomplete

The universal model still invents engagement/client relationships through prefixes. Report records are rehydrated with `workspace-${engagementId}`, which is not the saved canonical workspace. The new `/api/reports` mapping prefers that artifact workspace string over the actual continuation relationship. Use persisted typed IDs, not reversible-looking names.

Some workspace defaults were improved, but the report-package reader still hardcodes FY 2025, ENGAGEMENT_COMPLETE, 100 percent, partner/clearance assumptions, and fabricated fallback source metadata. The workspace reader substitutes FY 2024 when period is absent and uses fixed 15/50/85 progress. A correct filing for one company cannot justify these defaults.

The fallback detail mapper still replaces source fact IDs with generated `fact-${engagementId}-${idx+1}`, forces verified status and manufactures source quotes. Retain real periods, proof states, source IDs and missing-data limitations. Do not patch labels while continuing to manufacture provenance underneath.

### FV-08 — a shaped object is still accepted as trusted authority

The new helper checks object fields but does not resolve a registered approval through the existing trusted professional-signoff/authority service. Signature type is optional, binding checks only run when both optional fields exist, and a missing Quinn field is treated as eligible. A fixture name plus an arbitrary license string and APPROVED flag passes the candidate's final gate.

Use the existing trusted authority and approval records, with authenticated human authority, active status, revocation/expiry checks and mandatory engagement/report/version/hash binding. Missing or unknown review authority stays blocked. Preserve the positive behavior: an unsigned reviewable draft may pass technical checks without being externally authorized.

Do not solve the failing tests by changing their expected outcome, hardcoding fixture rejection or supplying an unverified default approval. No live professional sign-off is requested.

### FV-09 / FV-10 — useful scoped changes, limited evidence

Simple uncertainty objects now render through the real helper; nested object values can still yield `[object Object]` through String conversions. Keep structured evidence and test nested/unavailable values where accepted by the schema.

The source still contains the earlier entity-GET seeding removal. This turn did not run the live entity path. The supplied test compares only the main accounting file, not every store the corporate-group service can write. Do not call that full read-side-effect or cross-tenant browser proof.

## 5. Why the supplied 12-test report is not full acceptance

The revised script now exits nonzero on failed assertions, which is an improvement. However:

- FV-01 checks localhost health, not Google-to-Zeabur routing or a server-verified session.
- Its zero-leakage check reads `crossEngagementLeakageScore === 0`; the projection itself assigns that field a constant zero.
- The nonexistent-workspace report checks accept 200 plus an empty array rather than require the expected existing report/identity.
- The download check still accepts 404 and does not assert selected version, response bytes or hash.
- The positive human-signoff fixture supplies an unregistered object and labels it authentic.
- Several test numbers still do not implement the original FV register definitions.

The original revised script was preserved exactly, not represented as an independent passing acceptance suite. The independent tests above add rejection conditions that the source must satisfy. The original broader A-01 through A-20 browser matrix remains open.

## 6. Bounded next work order

Continue on this same PR #20/branch. First compare current remote state; do not overwrite newer work or use the Studio main-sync panel. Read this review, then the active 09 directive and original 06/23/FV matrix already present on the branch.

1. Close the actual shared-backend/request/scope/error contract in the existing frontend, preserving server-side identity and tenant authorization.
2. Close report-version handling end to end, including disk rehydration and selected-version downloads.
3. Replace shaped-approval trust with the existing real approval authority; keep technical review distinct from delivery.
4. Remove remaining customer-projection false defaults and fabricated source lineage. Use current persisted continuation/evidence/report state, without rerunning the company.
5. Add regression cases for these failures; keep the independent rejection checks failing until the implementation genuinely fixes them. Then run normal tests and the required real browser journeys on each authorized surface through the approved release procedure.

This review does NOT authorize merging, deployment, another intake, retrying completed extraction, specialist/model reruns, Academy/cohort activation, Company 2, external delivery, or credential changes. Keep the original Pfizer extraction Attempt 9 and all receipts/report versions/history intact. The owner does not need another ZIP simply to preserve this update: its source is now on GitHub. If Studio cannot target the repair branch, report that access limitation rather than pushing to deployment-linked main.
