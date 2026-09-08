# 15 — Pilot Readiness, Release and Acceptance Gates

## Purpose
Prevent architectural presence, test fixtures, or internal Academy success from being mislabeled as readiness for a CPA firm's customer data.

## Proof levels
Use only:
- CONFIGURED
- RUNTIME_VERIFIED
- PRODUCT_VERIFIED
- BROWSER_VERIFIED

Each acceptance claim must state its level.

## P0 pilot blockers
External pilot is blocked by any of:
- cross-tenant data access
- synthetic data appearing as real customer truth
- unsupported/hallucinated material financial values
- missing source lineage for material values
- report issuance from unresolved material facts
- inability to recover authoritative state after restart
- silent information loss between extraction stages
- unsafe authorization or secrets exposure
- inability to distinguish customer vs Academy classifications

## Minimum pilot journey
Using a real authorized test customer workspace and non-sensitive/approved test evidence, verify through the same UI a CPA firm will use:
1. authenticated entry
2. create/select client and engagement
3. upload files
4. exact source hashing
5. format adapter / Document IR
6. extraction and custody reconciliation
7. unresolved/review-required handling
8. financial statements and evidence clicks
9. PBC/clarification flow
10. reviewer clearance
11. report generation
12. download and reopen artifacts
13. logout/relogin/restart persistence
14. tenant-isolation negative tests

## Extraction acceptance
Do not certify from precision alone. Require measurable recall/conservation against the document inventory and `UNACCOUNTED = 0` at stage handoffs.

## UI acceptance
Every visible count/card/financial/chart/report must reconcile to the authoritative store and classification. Empty state must remain honestly empty.

## Release checklist
Before deployment:
- tests/lint/build clean
- schema migration plan and backup
- current runtime state snapshot
- rollback target
- security regression
- custody/idempotency regression
- browser smoke
- report integrity smoke
- observability healthy

After deployment:
- health probes
- version/schema confirmation
- no duplicate scheduler
- no duplicate queue processing
- representative product journey
- no stale UI adapters/fallback fixtures

## Academy boundary
Academy may continuously exercise the same product and pipeline, but its outputs remain clearly synthetic and never count as real customers, revenue, or commercial engagements.

## Final certification language
Use PASS only when the required proof exists. Otherwise return PARTIAL with the exact missing evidence; do not force certification.
