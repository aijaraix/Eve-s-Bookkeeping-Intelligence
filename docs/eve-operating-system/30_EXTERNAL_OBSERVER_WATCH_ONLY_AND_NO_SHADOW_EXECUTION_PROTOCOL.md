# 30 — External Observer Watch-Only & No-Shadow-Execution Protocol

**Status:** Authoritative observer-mode contract for supervised production trials and external engineering review.

## Purpose

An external engineering agent can be extremely useful while Eve is proving a new workflow, but the observer must not become an invisible second runtime. This document separates observation from execution so that a successful trial proves Eve worked, not that Google/Gemini, a local test harness, or another development environment completed missing steps on Eve's behalf.

## Four explicit modes

An external engineering agent may operate only in one of four declared modes:

1. `ENGINEERING` — source changes, tests, commits, deployment preparation.
2. `INITIATOR` — performs only the authorized customer-like start action for a supervised trial.
3. `WATCH_ONLY` — reads evidence and observes the running engagement without mutation.
4. `REMEDIATION` — after a failed/aborted run, fixes generalized production defects, redeploys, verifies, and then starts a brand-new run from origin.

The current mode must be written to the trial observer log with timestamp and reason. Silent mode switching is prohibited.

## WATCH_ONLY means read-only

During WATCH_ONLY the observer may inspect:

- production UI state;
- browser/network traces created by the actual product journey;
- queue/job state;
- scheduler decisions and lease state;
- process/service/pod identity;
- runtime fingerprints;
- persisted source/IR/custody objects;
- agent execution receipts;
- dashboard/render lineage;
- generated reports;
- audit/Minerva results;
- logs and metrics.

During WATCH_ONLY the observer may **not**:

- call internal engine methods to advance work;
- write directly to queues, ledgers, memory, databases, or files;
- inject source documents after the authorized customer upload;
- manually create agent execution receipts;
- calculate missing financial facts and write them back;
- run a local substitute extractor/auditor/report generator and copy its output into Eve;
- change proof levels or statuses;
- edit code or restart production merely to hide a failure;
- create a shadow scheduler, watcher, browser, or pseudo-agent execution path.

## No-shadow-runtime rule

The observer's own environment is not part of Eve's production graph.

Local AI Studio code, local filesystem artifacts, generated JSON traces, in-memory simulations, local Chrome, test-only servers, or local scripts cannot satisfy a production stage unless that stage is explicitly defined as external and its custody contract says so.

If Google computes an answer independently for diagnostic comparison, that result is `OBSERVER_DIAGNOSTIC_ONLY` and cannot become canonical customer truth without passing through Eve's normal evidence and verification pipeline.

## Failure handling

WATCH_ONLY ends immediately when a material defect is confirmed and the trial is marked failed/aborted for remediation. The observer may then enter REMEDIATION, but must not repair the active engagement in place.

The required sequence is:

`OBSERVE FAILURE → FREEZE / QUARANTINE RUN → PRESERVE EVIDENCE → TRACE FIRST CAUSAL FAILURE → REMEDIATE GENERAL PRODUCTION CODE → TEST → COMMIT/PUSH → DEPLOY → VERIFY RUNTIME → START NEW ENGAGEMENT FROM ORIGIN → WATCH_ONLY AGAIN`

This loop may repeat autonomously until one clean supervised engagement completes.

## What the observer should measure

The observer report should focus on evidence and deltas rather than narrative confidence. For each material stage record:

- expected producer;
- actual producer;
- input object IDs/hashes;
- output object IDs/hashes;
- start/end timestamps;
- service/pod/process identity;
- agent execution ID where applicable;
- custody acknowledgement;
- proof level actually established;
- first causal failure if any;
- customer-visible consequence if any.

## Observer cannot self-certify the system

Google's conclusion may be useful, but a Google statement such as `CLOSURE_CERTIFIED` is not independent physical proof. Where practical, production runtime identity/process/pod/browser evidence should be corroborated by an independent observer such as SentinelX under Document 25.

## Point-in-time observation after release

After the first company releases the remaining nine-company cohort, Google does not need to remain attached continuously. Eve must persist enough state to continue independently.

A later point-in-time read-only snapshot may be taken to inspect cohort progress or final state. That snapshot must not modify running work or introduce a new scheduler/watcher.

## Trial report minimum

The observer's supervised-first-company report must state:

- observer modes and transition times;
- number of failed/restarted attempts;
- first causal failure for every restart;
- generalized repair made;
- Git/deployment/runtime identity for each repair;
- final clean-run engagement ID;
- whether any observer-created computation entered production truth (required answer: NO);
- release status for the remaining cohort.
