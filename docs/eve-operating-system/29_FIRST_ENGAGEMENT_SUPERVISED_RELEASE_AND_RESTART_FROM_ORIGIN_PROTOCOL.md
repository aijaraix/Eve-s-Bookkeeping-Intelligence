# 29 — First Engagement Supervised Release & Restart-from-Origin Protocol

**Status:** Authoritative production-trial protocol. This document governs the first real engagement used to release an autonomous multi-company cohort. It does not itself certify implementation.

## Purpose

The first engagement in a production trial is a supervised release candidate for Eve's actual operating system. Google/Gemini or another engineering agent may initiate the customer-like starting event and observe the run, but must not replace Eve's production services with local code, direct method calls, generated traces, synthetic inputs, shadow pipelines, or ad-hoc execution.

The objective is to prove that the system described in Documents 00–28 can complete one real engagement from origin to delivery entirely through Eve's own production processes. If a defect is found, the defect may be repaired autonomously, but the engagement must then restart from origin. Midstream repair-and-continue is not acceptable evidence of a clean end-to-end run.

## Authoritative lifecycle

`REAL SOURCE ACQUISITION → CUSTOMER-SIDE STAGING → REAL EVE CUSTOMER UI → PHYSICAL UPLOAD → DURABLE INTAKE SESSION → CUSTOMER-PRIORITY QUEUE → HERMES SCHEDULER / ORCHESTRATOR → DOCUMENT INTELLIGENCE / IR → SOURCE INVENTORY → OBSERVATIONS / ATTRIBUTES → DATA POINTS / RELATIONSHIPS / ASSERTIONS → VERIFICATION → CANONICAL FACTS → CPA SPECIALIST AGENTS → PBC / CLARIFICATION WHERE REQUIRED → FINANCIAL STATEMENTS / ANALYSIS → REPORT WIZARD / DELIVERABLES → DASHBOARD / PRESENTATION → INTERNAL AUDIT → MINERVA → ACADEMY LEARNING HANDOFF → ENGAGEMENT CLOSE`

No stage may be replaced by a local test helper that merely imitates its outputs.

## First-company roles

### Eve

Eve owns every production transition after the customer-side action. Eve must receive the source through the production UI/intake path, create durable state, dispatch work, preserve custody, invoke actual agents, produce outputs, audit itself, and close the engagement.

### Customer Simulator

For a public-company trial, Source Acquisition may obtain the filing from an authoritative external source. That acquisition does **not** start extraction. The Customer Simulator must behave like a customer and physically use the real product interface to select/upload the acquired file and submit it.

A filesystem copy, direct POST performed outside the product journey, internal engine call, or preloaded datastore row is not a customer-initiated intake.

### Google / Gemini Observer

Google may:

- trigger the customer-simulator start action;
- observe the first company's real run;
- inspect production UI, runtime logs, durable state, queue receipts, agent execution evidence, reports, audit results, and deployment/runtime identity;
- diagnose defects after they manifest;
- enter Remediation Mode when a defect requires repair.

Google may not execute the accounting work itself or substitute a local/private implementation for a missing Eve capability.

## Observer freeze rule

Once the physical customer upload is submitted, Google enters **WATCH_ONLY** state.

While WATCH_ONLY:

- no production source code is edited;
- no runtime state is manually advanced;
- no internal engine method is invoked to skip a failed stage;
- no database row is manually fabricated or corrected;
- no audit result is forced;
- no agent output is manufactured;
- no UI result is patched in place;
- no proof level is manually promoted;
- no hidden test harness is allowed to finish the engagement.

Read-only inspection is permitted.

## Defect transition

If a material defect occurs, the observed engagement becomes `FAILED_SUPERVISED_TRIAL` or `ABORTED_FOR_REMEDIATION`.

Before repair:

1. Preserve the original source hash.
2. Preserve the complete run ID / engagement ID / browser session ID / queue and job IDs.
3. Preserve first causal failure evidence.
4. Preserve downstream symptoms without treating them as root cause.
5. Record the incident under Document 18.
6. Quarantine the failed run from production truth eligibility.

Only then may Google leave WATCH_ONLY and enter **REMEDIATION**.

## Remediation rules

Remediation must fix the generalized production capability, not the single company's values.

Allowed:

- repair production source;
- add missing contract enforcement;
- fix parser/adapter/orchestrator/agent/UI/report/audit logic;
- add a regression test reproducing the defect;
- commit and push to canonical GitHub;
- deploy through the declared production path;
- verify rollout and runtime fingerprint;
- use external assurance such as SentinelX to corroborate the new running artifact.

Not allowed:

- company-specific expected-value patches in generic production code;
- modifying the failed run's evidence to make it pass;
- resuming from a post-failure stage and calling that a clean run;
- preserving generated success flags from the failed run as current evidence.

## Restart-from-origin rule

After every material remediation, the supervised engagement must restart from the beginning with a new execution/engagement identity.

The restart begins no later than authoritative source acquisition and **must again pass through physical customer UI upload**. No derived object from the failed run may be silently reused unless it is explicitly immutable source evidence whose hash is revalidated and whose reuse is recorded.

A successful run is acceptable only when the entire chain completes after the final code/deployment state without midstream mutation.

## Clean-run release gate

The first company is a release gate. The remaining cohort may not begin until one clean first-company run proves all applicable stages end-to-end.

At minimum the clean run must prove:

- authoritative source bytes and source provenance;
- real browser/customer upload through the production UI;
- exact source/intake/IR hash continuity;
- source-side inventory and zero unaccounted source elements;
- deep extraction, not headline-only extraction;
- real durable agent executions and handoffs;
- no unsupported PBC/customer-response claims;
- entity/project/period placement;
- canonical truth promotion with evidence;
- financial statement/dashboard rendering from canonical facts;
- report/document wizard output from the same canonical truth;
- independent Internal Audit;
- independent Minerva source-denial evaluation;
- Academy learning handoff, without claiming learning until later measurable effect;
- engagement closure and reproducible evidence package;
- production runtime fingerprint tied to canonical GitHub/deployment identity.

## Evidence disposition after retries

Every failed attempt is retained as historical trial evidence with explicit ineligibility for customer truth. A later successful attempt does not erase prior failures.

The final supervised-run report must include all remediation cycles: first causal failure, generalized fix, deployment identity, regression proof, restart identity, and final clean-run result.

## Release outcome

Only one of these outcomes is valid:

- `FIRST_COMPANY_CLEAN_RUN_PASSED_RELEASE_NINE`
- `FIRST_COMPANY_FAILED_REMEDIATION_REQUIRED`
- `FIRST_COMPANY_BLOCKED_EXTERNAL_DEPENDENCY`
- `FIRST_COMPANY_ABORTED_SAFETY_OR_SECURITY`

There is no `PASS_WITH_MIDSTREAM_FIX` state.
