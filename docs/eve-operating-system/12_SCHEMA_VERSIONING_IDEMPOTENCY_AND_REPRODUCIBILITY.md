# 12 — Schema Versioning, Idempotency and Reproducibility

## Purpose
A long-lived autonomous CPA system must survive code changes without corrupting old evidence or making historical results impossible to reproduce.

## Version every durable contract
At minimum:
- SourceArtifact schema
- DocumentIR schema
- SourceElement / Observation schema
- DataPoint schema
- Relationship schema
- SemanticAssertion schema
- Verified/Canonical Fact schema
- Project/Engagement schema
- Render/Presentation contract
- Report manifest
- Event schema
- Model/tool execution record

Every persisted object should carry `schemaVersion` and, where relevant, `producerVersion`.

## Migrations
Migrations must be:
- explicit
- reversible where practical
- backed up before mutation
- deterministic
- audited
- tested against historical fixtures

Never silently reinterpret old records under a new schema.

## Historical immutability
Old Academy/customer journey results remain historical truth. A deeper re-extraction creates a new extraction version linked to the same source hash; it does not rewrite the old result.

## Idempotency keys
Use stable keys for upload, queue dispatch, extraction unit, fact creation, relationship creation, PBC request, review note, report generation and event emission. Replays after crash/restart must not double-create material records.

## Reproducibility record
For every important conclusion/report, preserve enough metadata to reconstruct the run:
- source hashes
- parser/adapter version
- extraction config
- schema versions
- deterministic rules version
- model/tool route
- model identifier
- prompt/template version where used
- timestamps
- canonical fact versions
- report template/version

## Drift policy
If a model/parser/tool changes and a historical source is reprocessed, store a differential:
`OLD_RESULT → NEW_RESULT` with reason, changed objects, score impact and review disposition.

## Acceptance
A report must never become unauditable because the code changed after it was issued. Historical evidence and lineage must remain interpretable under the versions that created it.
