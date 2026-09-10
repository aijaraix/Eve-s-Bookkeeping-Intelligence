# 32 — Real Agent Execution & Anti-Pseudo-Swarm Standard

**Status:** Authoritative execution standard for named CPA agents, specialist swarms, review roles, and agent proof.

## Purpose

A named agent is not proven to have executed merely because a TypeScript function generated an object labeled with that agent's name. Eve's multi-agent architecture requires physically distinguishable work execution, durable input/output handoffs, evidence-aware reasoning, and role-specific accountability.

This document exists to prevent synchronous hard-coded `computeOutput()` calls, pre-filled compliance conclusions, fabricated PBC responses, fixed job counts, or status strings from masquerading as an autonomous CPA organization.

## Definition of an actual agent execution

An execution may be credited to a named agent only when all applicable evidence exists:

- durable `agentExecutionId` / job identity;
- agent identity and version/configuration;
- engagement/tenant/workspace scope;
- exact input manifest and evidence references;
- execution start timestamp;
- actual inference/tool/process invocation where the role requires reasoning or action;
- model/tool provenance where applicable;
- output manifest persisted separately from the caller's local variables;
- output evidence references and uncertainty/dispositions;
- execution end timestamp;
- success/failure/needs-review state derived from the real result;
- consumer acknowledgement when handed to another role;
- proof level assigned only after evidence supports it.

A synchronous callback inside an orchestrator that returns a predetermined object is an ordinary software function, not an independently executed agent.

## Availability is not execution

Agent registry entries, health checks, names, prompts, tool definitions, model availability, or UI cards demonstrate configuration/availability only.

Required distinction:

- `REGISTERED`
- `AVAILABLE`
- `DISPATCHED`
- `EXECUTING`
- `OUTPUT_PERSISTED`
- `CONSUMED`
- `VERIFIED`

No higher state may be inferred from a lower one.

## No hard-coded professional conclusions

Production agents may not return fixed conclusions such as:

- `COMPLIANT`;
- `UNQUALIFIED_STANDARDS_COMPLIANCE`;
- `ALL_PBC_ITEMS_AUTHENTICATED_AND_CLEARED`;
- `FULL_PROFESSIONAL_STANDARDS_MET`;
- `ALL_FACTS_SEMANTICALLY_ANCHORED`;
- `qualityReviewApproved: true`;
- `unsupportedClaimsCount: 0`;

unless those conclusions were produced from actual engagement evidence and the supporting tests are persisted.

A test fixture may intentionally use fixed outputs, but it must be TEST_ONLY and ineligible for production truth.

## Role-specific requirements

### HERMES — Orchestrator

Hermes coordinates work, validates scope/custody, selects appropriate roles, tracks dependencies, and ensures real customer work preempts Academy work. Hermes does not fabricate specialist conclusions.

### LEDGER — Ledger / account structure

Ledger operates on actual extracted/canonical accounting data. Account counts, trial-balance state, journal status, and mapping conclusions must come from real data objects, not constant numbers.

### EUCLID — Mathematical verification

Euclid independently recomputes relevant identities from canonical evidence. It may not accept caller-provided `variance=0` or balancing values without recomputation and source/context validation.

### VERITAS — Provenance / evidence

Veritas independently checks hashes, evidence locators, source coordinates, unsupported assertions, and custody. `sha256Match=true` cannot be set merely because the caller supplied one hash.

### ATHENA — Technical accounting

Athena identifies applicable GAAP/IFRS topics from the actual engagement and tests relevant disclosures/recognition/presentation. It must not automatically claim ASC 606/842/280 compliance for every registrant.

### CLARA — Clarification / PBC

Clara may issue requests and manage responses. A PBC item can be `CLEARED` only if an actual response/evidence object exists and the responsible verification step accepts it. For public SEC trials where no human customer is present, Clara must record `NOT_APPLICABLE`, `PUBLIC_EVIDENCE_SUBSTITUTED_WITH_BASIS`, or `OPEN`, rather than inventing customer responses.

### QUINN — Quality / concurring review

Quinn reviews actual workpapers, significant matters, unresolved exceptions, consultations, and audit outputs. Approval is conditional and evidence-backed; it is not the default return value.

### SENTINEL — Risk / compliance

Sentinel evaluates actual operational/professional risks and control evidence. Zero findings cannot be assumed.

### LEXICON — Taxonomy / semantics

Lexicon maps actual concepts, extensions, dimensions, labels, contexts, and footnote semantics. Counts and taxonomy versions must be derived from the source/IR and recorded.

## Dynamic role invocation

Not every engagement requires every specialist. Hermes should select roles from actual engagement needs while preserving mandatory control roles defined elsewhere.

For certification of the agent system, a trial may deliberately exercise all required roles, but each must still execute real role-appropriate work.

## Agent handoff conservation

For every material agent-to-agent or engine-to-agent handoff:

`EXPECTED_INPUT_REFERENCES = ACKNOWLEDGED_INPUT_REFERENCES + EXPLICITLY_REJECTED_OR_DISPOSITIONED_REFERENCES`

`UNACCOUNTED_REFERENCES = 0`

The receiving agent's output must retain upstream evidence IDs rather than replacing them with prose-only summaries.

## Agent independence

When one role verifies another, the verifying role must not simply echo the producer's conclusion. Independence is proportional to risk:

- mathematical checks recompute;
- provenance checks re-read/rehash eligible evidence;
- audit checks use source-side denominators;
- quality review examines unresolved exceptions;
- Minerva uses sealed questions/ground truth and source-denial where specified.

## Physical execution evidence

Where agents share one process/model runtime, physical separation does not require one container per agent. It does require separately persisted job/execution records and actual model/tool invocations attributable to each role. If one monolithic prompt generates all nine named-agent outputs in one response, it must be classified as `MONOLITHIC_MULTI_ROLE_INFERENCE`, not nine independent executions.

## Failure states are first-class

Agents must be able to return:

- `SUCCEEDED`
- `FAILED`
- `BLOCKED`
- `INSUFFICIENT_EVIDENCE`
- `NEEDS_PROFESSIONAL_REVIEW`
- `NOT_APPLICABLE`

The orchestrator may not convert an agent failure into success merely to complete an engagement.

## Trial acceptance

Before a ten-company autonomous trial is released, the supervised first engagement must prove that the agent execution ledger contains real, durable, role-specific executions and that at least one verifier independently challenges upstream work. Any fixed/pseudo-swarm path discovered during this proof is a release blocker.
