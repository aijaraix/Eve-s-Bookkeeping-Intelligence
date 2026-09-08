# 10 — Runtime State Persistence and Transactional Handoffs

## Purpose
Eve must not lose information because a worker, agent, service, process, browser, or container ends. The authoritative system is durable scoped state, not process memory.

## Permanent rule
**Agents and services may cache; they may not be the sole authoritative store.** Any material observation, task result, review state, render contract, queue item, clarification, report manifest, or learning output must be persisted before downstream acknowledgement.

## Scoped storage model
Persist by tenant/client → project → engagement → artifact. Avoid one unpartitioned global bucket. Global indexes may point into scoped stores but must not copy engagement-authoritative evidence into another engagement.

Recommended logical namespaces per engagement:
- `sources/`
- `document-ir/`
- `observations/`
- `data-points/`
- `relationships/`
- `assertions/`
- `verified/`
- `canonical/`
- `clarifications/`
- `review/`
- `presentations/`
- `reports/`
- `events/`
- `checkpoints/`

## Custody envelope
Every produced material object should carry or resolve to:
- custodyId
- tenantId/clientId
- projectId
- engagementId
- entityId where applicable
- sourceArtifactId / sourceElementId
- parentCustodyId(s)
- createdBy / createdAt
- contentHash
- schemaVersion
- persistedLocation
- currentState
- currentOwner
- inputReferences
- outputReferences
- verificationState
- nextExpectedStage
- disposition

## Transactional handoff control
Each stage handoff must record:
- expected input reference count
- acknowledged input reference count
- rejected/unsupported count
- checkpoint ID
- producer
- consumer
- handoff timestamp
- hash/manifest of reference set

`UNACCOUNTED = EXPECTED - ACKNOWLEDGED - EXPLICITLY_REJECTED`

Acceptance target: `UNACCOUNTED = 0` for every completed handoff.

## Temporary lifecycle
Temporary state is allowed only with explicit lifecycle:
`CREATED_TEMPORARY → PERSISTED → ACKNOWLEDGED_DOWNSTREAM → SAFE_TO_PURGE`.

If a material object remains temporary past its SLA, Sentinel must raise `INFORMATION_CUSTODY_RISK`.

## Restart safety
Every long-running unit must be restartable from the last durable checkpoint. Never restart an entire 400-page filing merely because one downstream stage failed unless the source or parser version changed in a way that invalidates prior checkpoints.

## Idempotent resume
A retried stage must not duplicate facts, relationships, events, reports, PBC requests, or review notes. Use deterministic/idempotency keys based on engagement + source + stage + version + unit.

## Known repository risk to reconcile
The repository contains several runtime Maps/caches. Some already persist, others may not. Treat every `Map`, singleton registry, static array, or service-local cache as non-authoritative until persistence + startup rehydration + crash-recovery behavior are proven.

## Required audit
For one deep document, prove forward custody:
`Source → IR → Observation → DataPoint → Assertion → Verified/Canonical → Presentation → Report`
and reverse custody from a displayed/report value back to the exact source.
