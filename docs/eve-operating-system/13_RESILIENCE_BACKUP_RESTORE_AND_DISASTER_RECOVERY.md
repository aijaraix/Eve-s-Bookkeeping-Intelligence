# 13 — Resilience, Backup, Restore and Disaster Recovery

## Purpose
The autonomous practice is not production-ready if state survives ordinary processing but cannot survive service loss, bad deployment, corrupted files, or operator error.

## Durable-state inventory
Maintain a machine-readable inventory of every durable store and its recovery priority:
- customer/workspace registry
- source artifacts
- Document IR
- observations/data points/relationships/assertions
- verified/canonical facts
- PBC and clarification records
- review notes
- render registry
- report artifacts/manifests
- project/engagement twins
- event archives
- agent memory/learning records
- scheduler/checkpoint state
- capability leases

## Backup requirements
Define backup method, frequency, retention and location per store. Backups must not rely on the same failure domain as the primary volume.

## Restore testing
A backup is not proven until restored. Periodically perform read-only or isolated restore drills proving:
- source hashes match
- indexes rebuild
- project/engagement links remain intact
- reports reopen
- render registry rehydrates
- scheduler does not duplicate completed work
- historical events remain queryable

## Crash consistency
Use atomic file replacement / transactional persistence for manifests and indexes. Never leave partially-written JSON as authoritative state. For append logs, tolerate/recover from a partial final record.

## Deployment rollback
Before production changes preserve:
- current commit/version
- configuration snapshot excluding secret values
- schema version
- migration backup
- service topology
- rollback procedure

## Recovery objectives
Define practical RPO/RTO targets before external pilot. Customer work should have stricter objectives than Academy telemetry.

## Disaster scenarios to exercise
- Hermes restart during extraction
- worker restart after producing results but before acknowledgement
- duplicate queue delivery
- report generation crash
- corrupted registry/index with source files intact
- lost render cache
- local model unavailable
- cloud provider unavailable
- disk nearing capacity
- bad schema migration

## Acceptance
Do not certify persistence merely because files exist on disk. Certification requires a demonstrated restore/reconciliation path and no duplicate or orphaned accounting truth after recovery.
