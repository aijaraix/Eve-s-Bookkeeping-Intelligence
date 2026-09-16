# 06 — Security, Reliability, and Observability

## Objective

Make Eve operationally safe enough for real customer accounting evidence without overstating compliance or professional authority.

## Identity and authorization

Preserve the existing account/tenant model and strengthen only where needed.

Required principles:

- server-side authorization is authoritative
- every customer principal belongs to an allowed tenant
- no global customer read APIs
- roles limit product functions
- internal/owner roles remain distinct from client roles
- account role does not grant professional signing authority
- inactive/disabled users cannot retain active sessions
- password resets revoke prior sessions
- sensitive actions require current session + CSRF/origin protections
- rate limiting/throttling applies to login/recovery/invitation endpoints

## Professional authority boundary

Permanent rule:

> AI-prepared and internally reviewed work is not a CPA/auditor opinion, certification, statutory issuance or professional signature unless an appropriately authorized professional physically performs the required approval/signoff flow.

Customer-facing language and report states must preserve this distinction.

## Secrets

Never store plaintext secrets in GitHub, customer records, logs or Academy evidence.

Examples:

- passwords
- temporary passwords
- PINs
- processor secrets
- provider API keys
- database passwords
- webhook signing secrets
- OAuth refresh tokens
- infrastructure Basic Auth credentials

Use persistent deployment/control-plane configuration or approved secret stores.

## Existing infrastructure access

Raw development PIN and Hermes Basic Auth are infrastructure/emergency paths, not the normal product identity architecture.

Remaining physical configuration/verification for these paths should be tracked separately and must not block use of the normal owner account unless a required workflow truly depends on them.

## Tenant/evidence isolation

Every persisted source artifact, DocumentIR object, observation, fact, clarification, report and usage event must carry sufficient scope to enforce customer isolation.

Cross-tenant joins/searches are owner/internal-only and should return summaries unless deeper access is explicitly authorized.

Public/Academy synthetic evidence must never be mistaken for customer evidence.

## Data retention and deletion

Before general availability define and implement policy for:

- original uploaded source retention
- derived OCR/IR retention
- reports/workpapers
- account/audit records
- billing/usage records
- Academy synthetic artifacts
- customer cancellation/offboarding
- legal hold/manual retention override
- secure deletion requests and evidence of deletion

Do not purge lower-level evidence merely because a canonical fact/report was generated.

## Backup and recovery

Production launch requires physical proof of recoverability, not just a claim that storage is persistent.

Verify at minimum:

- identity/account persistence
- customer source/evidence persistence
- report/deliverable persistence
- Academy learning/evidence persistence
- configuration persistence
- database/filesystem backup mechanism where applicable
- restore procedure on isolated test target where safe
- restart/resume behavior for in-progress intake jobs

## Job reliability

All long-running intake/extraction/accounting tasks should support:

- durable job ID
- idempotency key
- current state
- input references
- output references
- retry count
- failure class
- last heartbeat/activity
- safe retry boundary
- customer priority
- resume checkpoint

No task should be considered complete merely because a process exited successfully if expected output/custody references were not persisted.

## Observability

Owner console should surface business-relevant operational state; detailed logs remain an engineering drill-down.

Observe:

- app availability
- intake queue depth
- extraction throughput
- OCR/vision failure rate
- job wait/run duration
- specialist success/failure
- clarification backlog
- report generation failures
- Academy last/current result
- storage pressure
- provider/model error rates where used
- authentication failures/throttling
- webhook/billing failures when commerce is live

## Alerts

Define severity:

### CRITICAL

- cross-tenant exposure
- source/evidence loss
- corrupted persistence
- auth bypass
- billing grants access without verified authorization
- professional-signoff boundary bypass

### HIGH

- customer processing stuck beyond SLA
- repeated extraction failure on supported format
- Academy regression in launch-critical pathway
- repeated report generation failure
- unavailable owner/customer login

### MEDIUM

- growing clarification backlog
- elevated OCR low-confidence rate
- usage approaching plan threshold
- near-capacity storage/queue

### LOW/INFO

- scheduled Academy exercise completed
- non-material unsupported artifact
- routine retries recovered

## Audit trail

Record material events with actor/system identity and stable subject references:

- login/logout/password change/reset/invite
- tenant/user creation/disable/role change
- plan/entitlement changes
- payment/subscription state changes
- upload/batch acceptance
- clarification response
- manual fact/review change
- report generation/download/approval
- configuration changes
- Academy run and accepted learning change

## Public security claims

Marketing statements must be limited to physically implemented controls and approved legal/compliance language.

Do not claim SOC 2, HIPAA, PCI compliance, a specific cloud provider, encryption algorithm/version, penetration testing or broad regulatory compliance unless there is current evidence supporting the exact statement.

## Launch security acceptance

First customer requires:

- tenant isolation regression
- owner/client role checks
- login/session controls physically verified
- no public index of authenticated pages
- no secrets committed
- source upload scoped to authorized tenant/workspace
- report/evidence download authorization
- customer cannot access owner/Hermes/infrastructure views
- owner account recovery path documented
- unsupported professional approval remains impossible through ordinary customer access

General availability additionally requires mature recovery, retention/deletion and incident-response procedures.
