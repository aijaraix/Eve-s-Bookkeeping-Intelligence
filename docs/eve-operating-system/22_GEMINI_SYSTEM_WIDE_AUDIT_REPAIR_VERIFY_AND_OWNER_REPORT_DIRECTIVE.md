# 22 — Gemini System-Wide Audit, Repair, Verify & Owner Report Directive

**Status:** Authoritative execution directive for Google/Gemini engineering sessions operating on Eve. This document does **not** certify that the current runtime already satisfies the requirements below.

## Purpose

This directive tells Google/Gemini how to reconcile Eve against Documents 00–21 without repeating the failure mode in which Google built a plausible side system, simulation harness, duplicate pipeline, generated trace, or substitute workflow and then certified that substitute as production.

This directive is intentionally operational. It does not replace the architecture in Documents 00–21. It tells the implementation agent how to inspect, repair, verify, and report against that architecture.

> **Do not prove that your implementation can imitate Eve. Prove that Eve's existing production execution graph physically performs the required work.**

---

## 1. Mandatory reading and starting rule

Before changing any code:

1. Fetch the current branch/head. Do not assume a checkpoint is still current.
2. Read `docs/eve-operating-system/00_START_HERE.md` from the beginning.
3. Follow its entire current mandatory reading order through Document 22.
4. Read current repository/runtime code and state before proposing a fix.
5. Preserve legitimate concurrent work. Never reset or force-push over newer work.

Do not reinterpret Documents 19–21 into a new Gemini-specific architecture.

---

## 2. Two-step operating sequence

### STEP A — Comprehensive read-only reconciliation

Start observation-first. Build the actual system topology and identify side/substitute/duplicate paths.

Do not make changes until each finding has physical evidence, an intended canonical target path, and a remediation classification.

### STEP B — Safe repair, physical verification, and owner report

After the read-only findings are established, automatically repair findings when the intended architecture is unambiguous and the safe-automatic-repair criteria in Document 21 are met.

Do not stop after editing code. Physically verify the repaired path and run negative bypass tests.

If a repair requires an owner-policy choice, do not guess. Record `OWNER_REVIEW_REQUIRED` with concrete alternatives, consequences, and a recommended default where justified.

---

## 3. Scope: audit all thirty mandatory reconciliation domains

The audit must explicitly cover every domain in Document 21:

1. Document extraction.
2. Canonicalization.
3. Document IR vs financial extraction.
4. Agent orchestration.
5. Agent memory.
6. Academy learning.
7. Capability Architect / Darwin evolution.
8. Internal Audit and secondary assurance engines.
9. Minerva examination.
10. UI data sourcing.
11. Financial statement screens.
12. Charts and analytics.
13. Reports and Report Wizard.
14. Copilot / Ask Eve / Q&A.
15. PBC workflow.
16. Review notes.
17. Entity resolution.
18. Client / project / engagement identity.
19. Historical data and quarantine.
20. Caches and rehydration.
21. Model fallback.
22. Worker fallback.
23. Observability vs reality.
24. Scheduler / heartbeat.
25. Multiple server/API implementations.
26. Legacy snapshot and test imports.
27. Delivery state.
28. Security and tenant isolation across AI/query layers.
29. File-format universality.
30. Multi-currency, multi-entity, consolidation, and specialty accounting.

Also search for analogous failure classes not listed above.

---

## 4. Do not trust names, status flags, or prior reports

For this reconciliation:

- `SECEdgarAuthoritativeAcquisitionAgent` does not prove SEC acquisition.
- `CustomerSimulatorUIEngine` does not prove a browser executed.
- `HermesJobDispatchService` does not prove specialists executed.
- `DeepDocumentIntelligence` does not prove deep extraction.
- `UNQUALIFIED_PASS` does not prove independent audit.
- `BROWSER_VERIFIED` does not prove browser execution unless the browser evidence contract exists.
- `LEARNED` does not prove learning unless later behavior changed.
- `100% coverage` does not prove completeness unless the denominator came independently from the source.

Audit behavior, not labels.

---

## 5. Search the repository for historical misunderstanding patterns

Search code, configuration, reports, fixtures, and active runtime paths for patterns including:

```text
mock
fixture
synthetic
demo
canary
regression
fallback
seed
generate
template
padding
placeholder
hardcoded
sample
golden
legacy
snapshot
rehydrate
cache
default
success=true
verified=true
complete=true
browserVerified
sourceComplete
UNQUALIFIED_PASS
BROWSER_VERIFIED
COMPLETE_AUTHORITATIVE
```

Do not assume matches are defects. Classify each match by reachability and authority.

Also inspect code that contains no obvious suspicious keyword but duplicates an existing conceptual responsibility.

---

## 6. Build the actual execution topology before repair

Produce a machine-readable and human-readable topology for each major workflow:

```text
entry point
→ route
→ service
→ queue/job
→ agent/worker
→ tool/model
→ store write
→ handoff
→ downstream consumer
→ canonicalization
→ presentation/report/audit/learning
```

For every arrow record physical code/runtime evidence.

For every conceptual operation answer:

- How many implementations exist?
- Which is production reachable?
- Which writes truth?
- Which reads truth?
- Which is legacy/test/synthetic?
- Which callers still use old implementations?
- Are any duplicate writers active?

---

## 7. Production path classification

Classify every discovered execution path using Document 21 categories.

If two paths claim production authority for the same conceptual operation, treat that as a finding until reconciled.

If a test/synthetic path is production reachable, treat that as a finding even if it is not currently active.

---

## 8. Document/extraction reconciliation

Physically inspect all production document ingestion and extraction entry points.

Verify:

- browser/customer upload and direct API upload converge into the correct intake contract;
- format detection routes into the intended shared custody/IR architecture;
- HTML/XBRL, PDF, scanned PDF/image, XLSX, CSV, DOCX/text/package adapters do not maintain detached truth stores;
- source inventory occurs before semantic promotion;
- observation layer is not silently bypassed;
- parser chunks cannot disappear before persistence;
- regex/local/deterministic fallback outputs have bounded authority;
- source-side recall denominator is independent of extractor output;
- large documents cannot be marked deep/complete from a handful of desired fields.

When a correct deep path exists beside a shallow legacy path, migrate callers rather than building a third path.

---

## 9. Data movement and custody reconciliation

For representative real/archived eligible engagements trace information through every stage.

Check for objects temporarily held in:

- HTTP upload buffers;
- worker payloads;
- parser chunks;
- model prompts/context;
- in-memory maps;
- dedupe sets;
- browser staging;
- queue messages;
- temporary report renders.

Verify material objects are persisted or explicitly dispositioned before the producer releases them.

Find every handoff without acknowledgement or count/hash reconciliation.

---

## 10. Canonical truth reconciliation

Enumerate every writer of candidate/verified/canonical financial or nonfinancial truth.

Verify one authoritative scoped path determines engagement canonical truth.

Check for:

- graph canonical facts vs legacy database facts;
- financial adapter facts vs Document IR facts;
- report-specific values;
- UI-only derived values;
- historical/canary values still queryable as current;
- synthetic facts eligible for customer queries.

Repair duplicate writers or enforce a formal reconciliation authority.

---

## 11. Agent organization reconciliation

For every registered agent/capability distinguish:

- configured;
- available;
- actually dispatched;
- actually executed;
- output persisted;
- handoff acknowledged;
- downstream output consumed.

Inspect whether one monolithic function impersonates multiple agents.

One process may host multiple agent executions; separate OS processes are not required. But logical execution IDs, job contracts, durable inputs/outputs, and handoffs are required.

Where applicable, verify actual work paths for Hermes, Ledger, Veritas, Euclid, Justitia, Pacioli, Athena, Clara, Quinn, Sentinel, Lexicon, Meridian, Aegis, Turing, Minerva, Experience faculty, Learning Dean, and Capability Architect.

Do not run irrelevant agents solely to inflate execution counts.

---

## 12. Memory and Academy reconciliation

Audit every claimed memory/learning mechanism.

For each memory store determine:

- what writes it;
- what reads it;
- whether it is authoritative;
- whether later decisions actually query it;
- how scope/tenant boundaries are enforced;
- how stale or superseded memory is handled.

For each Academy learning record find later evidence of impact.

If no impact exists, correct status to `LEARNING_RECORDED_NOT_YET_PROVEN` rather than deleting history.

---

## 13. Capability evolution reconciliation

Trace actual capability proposals from finding through test/promotion/runtime effect.

If the system merely writes requests but never promotes capability, do not call evolution active.

If it auto-promotes, verify governance, rollback, versioning, negative tests, and measurement.

---

## 14. UI/UX product-truth reconciliation

Map every major route and visible component to its exact authoritative data source.

Inspect actual active product routes for:

- Practice Home;
- Clients;
- Engagements;
- Documents;
- Document Intelligence;
- Data/Knowledge Graph;
- financial statements;
- ratios/trends;
- entity structure;
- FX/consolidation;
- evidence;
- PBC;
- review;
- reports;
- Internal Audit;
- Academy/Learning;
- incidents/causal chain;
- system health;
- Copilot/Q&A.

For every displayed count/value/status answer:

`Which authoritative object(s) produced this UI value?`

Search for:

- mock merge behavior;
- static defaults;
- adapter fallbacks;
- hardcoded KPIs;
- detached observability summaries;
- stale caches;
- prefix-based classification;
- UI-created truth not written back to canonical state.

Repair by connecting the UI to canonical presentation contracts, not by copying values into another UI-specific store.

---

## 15. Reports and deliverables reconciliation

Verify report generation is a consumer of canonical truth.

For representative report assertions trace backwards to physical source.

Check whether Report Wizard or report generators rebuild accounting values independently.

Where UI and report display the same concept, verify shared canonical/derivation identity.

---

## 16. Copilot/Q&A reconciliation

Identify every retrieval source used by Eve's conversational interfaces.

Prove whether answers come from:

- canonical persisted knowledge;
- raw source;
- vector index;
- web;
- model prior knowledge;
- cached summaries.

Label modes accurately. Do not present source-assisted or web-assisted answers as memory-only document understanding.

Ensure tenant and engagement scoping applies to semantic retrieval.

---

## 17. PBC and review reconciliation

Trace at least one complete actual PBC/review object chain from request through response/evidence/clearance.

Check for separate customer portal state vs CPA PBC state.

Check whether review notes are issuer-specific and evidence-backed or generic workflow approvals.

---

## 18. Entity and identity reconciliation

Audit entity resolution against actual downstream use.

Find places where names/tickers/prefixes are still used as identity authority rather than stable IDs.

Test ambiguous similar-name cases without silently merging.

---

## 19. Historical/quarantine purity reconciliation

Inventory every historical/synthetic/test/canary/demo object still present.

Determine whether it can be returned by:

- production APIs;
- canonicalization;
- UI;
- reports;
- Copilot/vector search;
- graph queries;
- Academy production evaluation.

If active reachability exists, quarantine or scope it without deleting forensic history.

---

## 20. Cache and rehydration reconciliation

For each cache/rehydration process determine:

- source authority;
- source version/hash;
- invalidation;
- startup behavior;
- classification preservation;
- supersession behavior.

Ensure empty authoritative state produces empty/review state, not demo fallback.

---

## 21. Model and worker fallback reconciliation

Review all fallback mechanisms individually.

Do not globally remove resilience.

Instead define each fallback's authority ceiling and downstream verification requirement.

Examples:

- model fallback may perform classification but not unsupported technical accounting;
- regex extraction may produce candidate facts but cannot certify document completeness;
- local worker fallback may continue extraction but must expose coverage/proof limitations until equivalence is verified.

Add negative tests that ensure degraded paths cannot over-promote proof level.

---

## 22. Scheduler/background-process reconciliation

Inventory every persistent scheduler/background loop.

Determine workload ownership and whether duplicate loops can dispatch the same work.

Verify heartbeat means reevaluate eligible work, not fabricate activity.

Persist machine-readable non-dispatch reasons and stale-lock/lease handling.

---

## 23. API/server reconciliation

Map legacy and new API endpoints performing equivalent functions.

Identify active callers of old endpoints.

Do not simply delete legacy routes. Migrate active callers, preserve compatibility if required, and prevent legacy writes from becoming competing authority.

---

## 24. Security reconciliation beyond IDOR

Test isolation through:

- direct store queries;
- graph traversal;
- vector/semantic search;
- model context assembly;
- memory lookup;
- cache retrieval;
- report generation;
- Copilot/Q&A.

A secure HTTP route does not prove secure AI retrieval.

---

## 25. Format universality reconciliation

For every format claimed supported, determine actual proof level.

Do not infer PDF/scanned/XLSX/DOCX capability from HTML/XBRL success.

Use archived fixtures/known sources for physical acceptance tests when safe.

Record unsupported/partial capabilities honestly.

---

## 26. Specialty accounting reconciliation

Trace multi-currency, consolidation, eliminations, tax, debt, leases, valuation/impairment, segment accounting, and other specialty features into/out of the main engagement truth graph.

If a feature exists only as a screen or Academy scenario, classify it accordingly.

---

## 27. Remediation priority and automatic action

Work in severity order:

1. P0 truth/security contamination.
2. P1 substitute/duplicate production paths and custody failures.
3. P2 operational/learning weaknesses.
4. P3 presentation/quality.

For each finding:

```text
prove
→ preserve
→ repair if unambiguous
→ test
→ negative-test
→ physically verify
→ record
→ continue
```

Do not ask the owner for permission for every routine safe remediation. Use Document 21's safe automatic repair criteria.

Ask for owner confirmation only where architecture/policy is genuinely ambiguous or the repair would require a consequential owner choice.

---

## 28. Do not recreate working infrastructure

If a correct production service already exists, use it.

Do not build another service merely because its interface is inconvenient.

Do not replace current Hermes/OpenClaw/local-model/extraction/browser/report infrastructure without physical evidence that the existing service cannot satisfy the contract.

---

## 29. Historical evidence and migrations

Never rewrite history to make the current audit pass.

When incorrect prior outputs exist:

- preserve them;
- classify/quarantine them;
- create superseding authoritative objects;
- preserve incident and remediation lineage.

If data migration is required, produce before/after counts/hashes and prove no tenant mixing or orphaning.

---

## 30. Required negative tests

At minimum prove the production system rejects or downgrades:

- generated authoritative filing;
- synthetic fixture entering customer canonical truth;
- browser trace without browser process;
- filesystem copy labeled customer upload;
- agent registration labeled execution;
- monolithic routine labeled specialist handoffs without job evidence;
- shallow fallback labeled deep extraction;
- output-derived 100% recall denominator;
- audit success flag without independent evidence;
- learning record labeled learned without later effect;
- stale/superseded canonical record returned as current;
- cross-tenant semantic retrieval;
- report value with no canonical/source lineage;
- UI value with no authoritative data contract.

---

## 31. Acceptance after repair

A finding may be marked `FIXED` only when all applicable evidence exists:

- code/config repair committed;
- physical execution path demonstrated;
- output/store/handoff reconciled;
- UI/report consequence verified;
- negative bypass test passed;
- no historical evidence destroyed;
- proof level accurately assigned.

Otherwise use `PARTIALLY_FIXED`, `BLOCKED`, or `OWNER_REVIEW_REQUIRED`.

---

## 32. Owner report format

Return a comprehensive report organized as:

### A. Executive summary
- overall verdict;
- P0/P1/P2/P3 finding counts;
- number of duplicate/substitute paths discovered;
- number fixed;
- number remaining;
- whether production/customer truth was affected.

### B. Topology summary
- intended execution graph;
- actual execution graph before repair;
- actual execution graph after repair.

### C. Thirty-domain matrix
For each Document 21 domain:

```text
Domain
Status Before
Physical Finding
Root Cause
Repair
Status After
Proof Level
Remaining Risk
```

### D. Additional findings
Any side-flow class discovered outside the thirty mandatory areas.

### E. Production path inventory
All canonical production entry points/services/writers/stores.

### F. Deprecated/isolation inventory
Legacy/test/demo/canary/synthetic paths and how production reachability is blocked.

### G. Agent execution map
Configured vs executed vs handoff-proven agents.

### H. Data custody map
Representative source-to-report/UI traces and handoff conservation.

### I. UI/report reconciliation
All mismatches found and fixed/remaining.

### J. Internal Audit / Minerva / Academy
Independence and real-learning evidence.

### K. Security/tenant isolation
HTTP + semantic/AI retrieval results.

### L. Negative tests
List every bypass test and result.

### M. Change ledger
Files changed, migrations, stores changed, commits.

### N. Owner decisions
Only genuinely unresolved owner-policy choices.

### O. Final verdict
Choose one:

- `SYSTEM_WIDE_PHYSICAL_RECONCILIATION_PASS`
- `SYSTEM_WIDE_PHYSICAL_RECONCILIATION_PARTIAL`
- `SYSTEM_WIDE_PHYSICAL_RECONCILIATION_FAIL`

Do not use PASS with unresolved P0/P1 findings.

---

## 33. Report repairs in plain language

For every material fixed issue, explain to the owner in this format:

```text
WHAT WAS WRONG:
<plain-language behavior>

WHY IT HAPPENED:
<first causal failure>

WHAT I CHANGED:
<canonical repair>

HOW I PROVED IT:
<physical execution evidence + negative test>

WHAT HISTORY WAS PRESERVED:
<old objects/reports/incidents>

WHAT REMAINS:
<none or limitations>
```

This allows the owner to understand and confirm the architecture without reading implementation detail alone.

---

## 34. Do not stop early

Do not stop because:

- the first P0 was fixed;
- code compiles;
- unit tests pass;
- a representative browser test passes;
- one extraction format works;
- one agent handoff works;
- one report matches.

Continue through all thirty domains and additional discovered analogues.

---

## 35. Final operating rule

The goal is not to make Eve look internally consistent.

The goal is to ensure that there is one physically real, evidence-backed, production execution graph in which source/customer information moves through the actual agents/services, survives every handoff, becomes scoped canonical truth, appears accurately in the actual UI and deliverables, is independently audited, and generates measurable learning without a hidden side system doing the real work.
