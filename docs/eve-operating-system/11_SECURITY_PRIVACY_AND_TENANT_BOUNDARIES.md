# 11 — Security, Privacy and Tenant Boundaries

## Purpose
Eve will process highly sensitive financial, tax, payroll, bank, contract, audit and personally identifiable information. Product correctness is incomplete without strong tenant isolation and least-privilege access.

## Non-negotiable boundaries
- Default deny.
- Every request, background job, tool call, graph query, report download and Copilot query must resolve an authorized tenant/workspace/engagement scope.
- Synthetic/Academy evidence must never enter real customer accounting truth.
- Global entity knowledge may assist discovery but may not become customer evidence without engagement-specific authority.
- No agent may widen its own permissions.

## Required identity model
Production authorization must derive from authenticated identity/session, not query parameters, static role defaults, hardcoded emails, UI-only hiding, or seeded mock maps.

Roles should be explicit and capability-based. At minimum consider:
- OWNER / FIRM_ADMIN
- PARTNER
- MANAGER / REVIEWER
- PREPARER
- CLIENT_CONTACT
- READ_ONLY
- SYSTEM_SERVICE

Every capability should be scoped: tenant, client, project, engagement, document, report, administration.

## Sensitive-data handling
Classify data such as:
- PUBLIC_FILING
- CUSTOMER_CONFIDENTIAL
- PII
- PAYROLL
- BANKING
- TAX
- LEGAL_PRIVILEGED_OR_SENSITIVE
- CREDENTIAL_OR_SECRET
- SYNTHETIC_ACADEMY

Apply retention, export, logging and model-routing policy by classification.

## Model privacy
Before any cloud-model request, policy must determine whether the payload may leave the private runtime. Prefer deterministic/local processing for sensitive raw evidence. Cloud calls should use the minimum necessary content and record what was sent, by policy class, without logging secrets.

## Encryption and storage
Require TLS in transit and platform-supported encryption at rest. Do not place secrets in repositories, event payloads, report artifacts, browser state, prompt logs or Academy fixtures.

## Auditability
Persist security-relevant events:
- login/session establishment
- authorization decision
- denied access
- export/download
- admin change
- customer data model route
- capability lease
- cross-tenant access attempt

## Data deletion and retention
Design before pilot for engagement retention rules, customer-requested deletion where legally appropriate, legal hold, artifact immutability where required, and deletion propagation through indexes/caches while preserving allowed audit metadata.

## Repository gap requiring explicit verification
Current code contains tenant-isolation/test services and role types, but production security must not be inferred from those tests. Verify the live routes actually enforce authenticated tenant scope end-to-end.

## Acceptance
A pilot is blocked if another tenant's engagement, document, fact, graph edge, report or Copilot context can be accessed by changing an ID or URL parameter.
