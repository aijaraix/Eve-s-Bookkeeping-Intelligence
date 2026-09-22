# EVE BOOKKEEPING — CODEX FINAL INTEGRATED RUNTIME + MULTI-COMPANY AUDIT REHEARSAL HANDOFF

**Status:** FINAL INTEGRATION / PHYSICAL ACCEPTANCE / AUDIT REHEARSAL PASS

**Repository:** `aijaraix/Eve-s-Bookkeeping-Intelligence`

**Canonical feature branch for this pass:** `feature/universal-evidence-ocr-foundation`

**Current feature HEAD when this handoff was written:** `d8ed81410ddcfef6e963d56eeb28d8353d05bcfc`

**Current protected production-main checkpoint when this handoff was written:** `69939bad5a4942fc11955d88943d7a20403820b7`

**Draft PR:** #31 — intentionally still draft/unmerged.

**IMPORTANT:** Every SHA and runtime fact in this document is a handoff checkpoint only. FETCH CURRENT REMOTE AND CURRENT PHYSICAL RUNTIME FIRST. Preserve legitimate newer work.

---

## 1. THIS PASS IS DIFFERENT FROM THE PRIOR ACADEMY WORK

The curated Academy foundation is now physically closed on the feature branch:

- 20 total curated cases
- 20 `CONTRACT_READY`
- 0 physical-fixture-required
- 0 autonomous-eligible

The final curriculum acceptance implementation checkpoint was:

`03513a3722c1c2e238a15ea185cd8c31ae00eebf`

The durable evidence/current feature checkpoint after that acceptance was:

`d8ed81410ddcfef6e963d56eeb28d8353d05bcfc`

Final curriculum acceptance run:

`35156567966`

Final deliverable-lineage artifact:

- artifact ID `10471390900`
- digest `sha256:7aaecba506d79471b101b2851d09cde7123e2d7ed0f575c0e305a540dc00398f`

The accumulated feature work includes, among other accepted capabilities:

- universal source-to-presentation evidence contracts;
- exact spreadsheet cell/range/formula lineage;
- image OCR with Paddle primary/docTR fallback and fail-closed quality gates;
- orientation retry with coordinates remapped to original source space;
- image-only and selective mixed native/scanned PDF OCR;
- evidence sufficiency and PBC re-evaluation rules;
- five-dimension Minerva technical grading;
- receipt, invoice/AP, bank, trial-balance and runtime integration cases;
- mixed-source reconciliation and mixed-source batch isolation;
- duplicate/near-duplicate evidence discrimination;
- cross-client bulk isolation;
- long-document semantic context ledger;
- source-to-dashboard Product Truth in real Chromium;
- stable reverse-render IDs across identical rerenders;
- final PDF/XLSX/CSV/JSON reverse lineage through derivations to physical source coordinates;
- fail-closed final-export lineage validation.

**DO NOT rerun the 20 Academy cases individually merely to rediscover this work.** Run targeted regressions plus one consolidated integrated acceptance where useful.

---

## 2. PRIMARY OBJECTIVE

Take the accumulated feature branch from accepted component/curriculum state to a **physically integrated, service-connected, frontend-usable, persistence-safe runtime candidate**, then exercise it through a **multi-company audit-rehearsal matrix** using real supported upload/intake paths and varied evidence packages.

This is not another architecture audit.

This is not a service-selection benchmark.

This is not permission to replace existing infrastructure.

The objective is to answer, with physical evidence:

> Can Eve receive realistic accounting/audit packages through the intended user-facing paths, move them through the real services/queues/workers/models, preserve evidence and client isolation, surface the work correctly in the frontend, produce reviewable outputs, survive service/runtime interruptions, and continue to fail closed where evidence is insufficient or contradictory?

---

## 3. OWNER INTENT / AUTHORITY FOR THIS PASS

The owner authorizes Codex/Work to:

- inspect current source and current physical infrastructure;
- use existing connected services and existing credential references without exposing secret values;
- repair demonstrated code/configuration/deployment gaps within existing architecture;
- run builds, regressions, browser tests, service health tests and persistence/restart tests;
- create isolated synthetic/public-data test companies, workspaces and engagements;
- perform realistic audit/bookkeeping workflow rehearsals using non-sensitive synthetic data and/or publicly available source documents;
- create bounded acceptance fixtures/packages needed to prove the real intake paths;
- deploy a feature-branch/staging/acceptance candidate where the existing deployment platform safely supports it;
- continue through agent-remediable failures instead of stopping.

### Still NOT authorized without separate explicit owner approval

- merge PR #31 into `main`;
- replace the protected production `main` deployment with the feature branch if that would constitute production release;
- delete or overwrite preserved Company 1/Pfizer evidence;
- rerun Pfizer / Company 1 from scratch;
- arm Academy/autonomous scheduling beyond its currently authorized state;
- create a second scheduler/control plane;
- rotate working credentials merely for convenience;
- send external customer communications or perform professional/statutory CPA sign-off;
- incur new paid infrastructure/model commitments beyond already-authorized services.

If the existing environment has a safe staging/preview/acceptance deployment path, use it. If no safe non-production deployment path exists and the only next step is a production release/merge, stop at the release gate with exact evidence and the smallest owner approval request.

---

## 4. CONSERVE CODEX CREDITS

Do not spend Codex cycles on work already established unless a current physical mismatch requires it.

Specifically:

- do not rediscover the architecture from zero;
- do not run service-selection benchmarks;
- do not rerun Pfizer/Company 1;
- do not rerun every Academy case separately;
- do not rebuild Hermes/OpenClaw/OCR/model services if the existing services can be safely reused;
- do not redesign the frontend;
- do not create parallel queues/workers/schedulers/databases;
- use existing accepted tests/evidence as regression anchors;
- prefer one integrated physical acceptance matrix over repeated narrow loops;
- repair only demonstrated blockers.

---

## 5. FIRST REQUIRED ACTIONS

1. Fetch CURRENT remote state for `main`, `feature/universal-evidence-ocr-foundation`, and PR #31.
2. Read every file in `docs/work-handoff/` in numeric order. This document (`06_...`) controls the new final-stage pass where it is more specific than older historical handoff text.
3. Read the current launch evidence under `docs/launch/evidence/`, prioritizing the most recent P2 acceptance records.
4. Establish current physical runtime truth before mutation.
5. Produce a concise source/runtime matrix before making broad changes.

Do not treat historical deployment information as current truth.

---

## 6. PHYSICAL RUNTIME / SERVICE ACCEPTANCE MATRIX

Physically inspect and verify the existing intended runtime topology. Last-known hints include a dedicated Eve environment, Hermes, OpenClaw, local Ollama/Qwen, workers, persistent storage and internal OCR services. Reverify everything.

At minimum record:

| Area | Current source truth | Physical runtime truth | Pass/Fail | Evidence / remediation |
|---|---|---|---|---|
| Frontend/web app | | | | |
| API/backend | | | | |
| Deployed source/build identity | | | | |
| Primary database | | | | |
| Persistent files/object storage | | | | |
| Queue/job persistence | | | | |
| Worker process(es) | | | | |
| Hermes gateway/control plane | | | | |
| Hermes scheduler authority | | | | |
| OpenClaw | | | | |
| Ollama/local model | | | | |
| Cloud model path(s) | | | | |
| Paddle OCR service | | | | |
| docTR OCR service | | | | |
| Mixed/selective PDF OCR path | | | | |
| Report/artifact storage | | | | |
| Frontend authentication | | | | |
| Client/workspace isolation | | | | |
| Browser source-to-pixel drawer | | | | |
| PBC/clarification state | | | | |
| Observability/audit logs | | | | |
| Restart/redeploy durability | | | | |

### Important prior runtime concern to reverify

The last known running OCR services predated some of the feature-branch selective-PDF/orientation code. Do not assume the running OCR containers already contain current feature behavior. Compare service build/version/source identity to current feature code and repair/deploy only if physically stale.

### Scheduler preservation

Hermes is the intended Academy scheduler authority. Prior known cron:

- name: `Eve-Academy-UI`
- ID: `e9c9dd128ba4`
- cadence: every 5 minutes

Reverify current truth. Do not create a competing scheduler. Academy remains unarmed/non-autonomous unless separately authorized.

---

## 7. FRONTEND PHYSICAL ACCEPTANCE

Use the actual built/running Eve frontend, not a backend-only substitute.

Physically test the complete customer/operator experience appropriate to the current product:

1. authentication / authorized access;
2. client/workspace creation or selection through the intended path;
3. engagement creation/selection;
4. upload/intake of supported source types;
5. progress/state visibility while work moves through queues/workers/models;
6. evidence/fact presentation;
7. accounting review panels where applicable;
8. findings/gaps/PBC clarification state;
9. source-to-pixel provenance drawer and technical trace;
10. product handling of review-required / blocked evidence;
11. reports/deliverables library;
12. PDF/XLSX/CSV/JSON artifact retrieval/readback;
13. mobile/responsive sanity check for core owner workflows if the current frontend supports it;
14. browser console/network errors during these flows.

Do not accept a flow merely because an API call succeeded.

---

## 8. COMPLEX FEED / INTAKE ACCEPTANCE

Exercise the real supported intake path with increasingly realistic packages.

At minimum include:

- single native-text PDF;
- scanned/image-only PDF;
- mixed native/scanned PDF;
- image receipt/photo;
- scanned invoice;
- XLSX general ledger/trial balance;
- CSV transaction/account feed;
- bank statement package;
- multi-file mixed batch;
- exact duplicate evidence;
- cosmetic near-duplicate evidence;
- material near-duplicate conflict;
- incomplete package / missing page;
- contradictory spreadsheet-versus-source evidence;
- long narrative/report document;
- two-client bulk/isolation attempt.

Use existing accepted fixtures where they exercise the real intake path. Create new physical fixtures only when needed to test a path that the existing evidence did not physically traverse.

---

## 9. MULTI-COMPANY AUDIT REHEARSAL MATRIX

After the integrated runtime passes, proceed directly into multiple end-to-end audit/bookkeeping **technical rehearsals**. These are system-validation engagements, not licensed audit opinions.

Do not use Pfizer / Company 1 for this matrix.

Use a combination of non-sensitive synthetic packages and publicly available company records. Prefer variety over repetition.

### Rehearsal A — Public company, digitally native source set

Use a public company other than Pfizer with an accessible annual filing/report.

Purpose:

- long-document ingestion;
- native PDF/HTML/text extraction as supported;
- reporting-period/entity context;
- financial statement facts;
- source-to-dashboard trace;
- report/export lineage.

### Rehearsal B — Public company with different accounting profile

Choose a company whose statements materially exercise different topics (for example inventory/retail, leases, segment reporting, or subscription/revenue-recognition complexity).

Purpose:

- prove Eve is not overfit to one statement layout or industry;
- exercise semantic context, disclosures and classification variability.

### Rehearsal C — Synthetic private SMB bookkeeping package

Build a realistic private-company package containing, as supported:

- bank statement(s);
- receipt images;
- vendor invoices;
- CSV transactions;
- XLSX GL/trial balance;
- selected supporting PDFs;
- deliberate but realistic bookkeeping irregularities.

Purpose:

- end-to-end bookkeeping/accounting workflow;
- reconciliation;
- AP controls;
- bank completeness;
- trial balance;
- PBC gaps;
- final review package.

### Rehearsal D — Adversarial incomplete/conflicting package

Include:

- a missing material page/transaction;
- one exact duplicate;
- one cosmetic near-duplicate;
- one materially changed near-duplicate;
- one spreadsheet/receipt or spreadsheet/PDF contradiction;
- at least one low-quality or scanned source.

Purpose:

- prove fail-closed behavior survives the integrated runtime;
- no silent averaging, inference or false promotion;
- clarification/PBC flow is real and persistent.

### Rehearsal E — Mixed-client bulk/isolation package

Two synthetic clients with intentionally overlapping filenames, periods, labels and dollar values.

Purpose:

- prove no cross-client document/fact/provenance/finding/PBC/render/export leakage under real intake and worker concurrency.

### Optional Rehearsal F — Larger mixed-format package

If the system remains healthy and credits/runtime allow, run one larger package to test realistic queue depth, worker retry/idempotency and frontend progress under load. Do not turn this into a benchmark contest; the goal is functional conservation and observability.

---

## 10. FOR EACH REHEARSAL, PHYSICALLY PROVE THE SAME CHAIN

Record:

`source upload -> durable source identity -> queue/job -> parser/OCR/model execution -> evidence/provenance -> canonical/review facts -> accounting decision/reconciliation -> frontend presentation -> PBC/findings where applicable -> report/export -> reverse lineage -> persistent retrieval after restart`

For every material fact/decision sampled, verify:

- correct client/workspace/engagement;
- correct period/entity;
- correct source SHA/artifact;
- correct provenance ID and coordinate family;
- correct value/currency/scale;
- correct verification/review state;
- no unsupported inference;
- no hidden fallback presented as real model work;
- final artifacts remain traceable back to the source.

---

## 11. FAILURE / RECOVERY TESTS

Do not declare integrated readiness without at least bounded recovery proof.

Where safe, test:

- worker restart during or after queued work;
- service reconnect;
- job retry/idempotency;
- stale/failed OCR/model response handling;
- persistence after process/revision restart;
- frontend recovery after backend/API interruption;
- no duplicate scheduler execution;
- no duplicate accounting promotion after retry;
- no loss of source/provenance/report records.

Use a controlled acceptance workspace; do not endanger preserved customer evidence.

---

## 12. MODEL / SERVICE TRUTH

When a real model/service is required:

- prove the actual intended model/service endpoint executed;
- record model/service identity/version when available without exposing secrets;
- preserve provider/route metadata if the system supports it;
- do not silently replace a failed real-model call with deterministic success;
- fail closed when `requireRealModel` or equivalent applies.

Use local/Ollama paths for bounded low-cost work where current architecture already intends them. Use cloud/heavier models only where the existing routing requires them.

---

## 13. RELEASE BOUNDARY

Passing this integrated rehearsal does **not** itself merge PR #31.

If all acceptance gates pass, stop at one of these two release conclusions:

### `EVE_INTEGRATED_CANDIDATE_READY_FOR_OWNER_RELEASE_DECISION`

Use only when:

- current feature source is physically integrated in the tested candidate environment;
- all required services are healthy/current;
- frontend and complex intake paths pass;
- multi-company rehearsals pass to the defined scope;
- persistence/recovery tests pass;
- no agent-remediable blocker remains;
- remaining step is owner release/merge authorization.

### `EVE_INTEGRATED_CANDIDATE_NOT_READY`

Use when a blocker remains. Continue fixing agent-remediable blockers during the run. Distinguish owner-only blockers from technical blockers.

Do not merge PR #31 or replace production `main` without the separate owner release decision.

---

## 14. REQUIRED CODEX / WORK OUTPUT

At completion, save a durable report under `docs/launch/evidence/` containing:

1. current source identities;
2. deployed/tested build identities;
3. complete runtime topology;
4. service version/currentness findings;
5. every repair made;
6. tests/regressions executed;
7. frontend physical acceptance evidence;
8. complex-intake matrix results;
9. each multi-company rehearsal result;
10. sampled source-to-report lineage proofs;
11. recovery/persistence results;
12. unresolved limitations;
13. exact release blockers, if any;
14. exact owner-only action, if any;
15. explicit statement of anything not physically verified;
16. final status from Section 13.

Never include secret values.

---

## 15. FINAL OPERATING PRINCIPLE

Do not optimize for making the dashboard look green.

Optimize for **truthful, persistent, observable accounting work that survives realistic documents, realistic failures and realistic customer boundaries**.

The final test is not whether Eve can pass another fixture.

The final test is whether Eve can receive realistic company evidence, do the work through the intended runtime, show the owner exactly what happened, preserve every material source relationship, fail closed when it should, and produce a reviewable package that can be independently traced back to physical evidence.
