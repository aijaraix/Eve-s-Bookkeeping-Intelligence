# Eve Bookkeeping Customer Commerce & Management — Master Plan

## Purpose

Define the durable customer-management, purchasing, entitlement, usage, onboarding, and owner-operations architecture for Eve Bookkeeping **before implementation**.

This document is intentionally implementation-oriented. It exists so a later engineering agent can build against a fixed contract instead of inventing SaaS architecture during execution.

## Current foundation to preserve

The current Eve access layer already has:

- persisted users and sessions;
- roles: `OWNER`, `PLATFORM_ADMIN`, `INTERNAL_OPERATOR`, `CPA_REVIEWER`, `CLIENT_ADMIN`, `CLIENT_USER`, `READ_ONLY`;
- persisted tenants;
- `User.tenantId` for tenant-scoped users;
- `Tenant { id, name, workspaceIds }`;
- owner and customer portals;
- server-side tenant filtering;
- audit events for account administration;
- customer workspaces/engagements as the accounting system of record.

Do **not** replace this with a second customer database.

## Core architecture decision

### Tenant is the customer/business root

`tenant.id` is the stable customer organization identifier.

Every commercial or operational object must reference that same `tenant_id` where applicable:

`TENANT -> USERS -> WORKSPACES/ENGAGEMENTS -> DOCUMENTS -> PROCESSING -> REPORTS`

and

`TENANT -> BILLING ACCOUNT -> SUBSCRIPTION/ORDER -> ENTITLEMENTS -> USAGE`

A separate payment-provider customer ID is an external reference only. It never becomes the Eve customer ID.

## One data plane, three experiences

### Public

`evesbookkeeping.com`

Marketing, plan discovery, request demo, purchase/get-started flow.

### Customer

`app.evesbookkeeping.com`

Tenant-scoped bookkeeping/accounting SaaS experience.

### Owner

`owner.evesbookkeeping.com`

Platform-wide customer management, billing/usage visibility, operations, Academy, agents, reports, access and audit.

All three use the same Eve backend and stable tenant/workspace identifiers.

## Scope of the customer platform

The customer platform must support:

1. lead/prospect intake;
2. owner-created customer accounts;
3. self-service purchase/onboarding;
4. tenant provisioning;
5. customer user invitations;
6. plan/subscription or one-time purchase records;
7. entitlements;
8. usage metering;
9. owner usage/cost visibility;
10. customer usage visibility where appropriate;
11. billing state and invoice/payment references;
12. cancellation, suspension and reactivation;
13. customer support/admin notes;
14. audit history;
15. secure offboarding and retention handling.

## Principles

### 1. Identity, billing and professional authority are separate

A paid subscription grants product entitlements, not CPA signoff authority.

Ordinary account roles must never imply professional approval capability.

### 2. Payment provider is replaceable

Create a narrow `PaymentProvider` boundary. Eve owns:

- tenant identity;
- order/subscription state;
- entitlements;
- usage events;
- audit history.

The provider owns sensitive payment collection and card/bank details.

Do not store raw card data, CVV, full bank credentials or equivalent sensitive payment material in Eve.

### 3. Webhooks are authoritative for payment state

A browser redirect from checkout is not proof of payment.

Provider-signed webhook events drive activation, renewal, failed-payment and cancellation state.

All webhook handling must be idempotent.

### 4. Entitlements are enforced server-side

Hiding a button is not access control.

Plan/feature/quota enforcement occurs at the API/service boundary before a billable or restricted action begins.

### 5. Usage is event-based and auditable

Usage counters are derived views.

The source of truth is an append-only usage-event ledger with stable event IDs and idempotency keys.

### 6. Internal work is not customer billable usage

Academy, regression, owner testing, infrastructure retries caused by Eve failure, and internal quality-control activity must be marked non-billable.

### 7. No destructive response to billing problems

Past-due or canceled customers may lose write/processing entitlements according to policy, but Eve must not silently delete accounting evidence or reports.

Retention/deletion follows an explicit policy and audit trail.

## Required domain objects

The implementation should introduce or persist equivalents of:

- `CustomerProfile`
- `BillingAccount`
- `PlanVersion`
- `Subscription`
- `Order`
- `InvoiceReference`
- `PaymentReference`
- `EntitlementGrant`
- `UsageEvent`
- `UsageCounter`
- `BillingWebhookEvent`
- `OnboardingState`
- `CustomerAdminNote`

All customer-owned records reference `tenant_id`.

## Customer lifecycle states

Commercial/customer lifecycle is distinct from accounting engagement status.

Recommended customer states:

- `PROSPECT`
- `ONBOARDING`
- `ACTIVE`
- `PAST_DUE`
- `SUSPENDED`
- `CANCELING`
- `CANCELED`
- `ARCHIVED`

Billing state and onboarding state should be separately queryable; do not overload one field with every condition.

## Implementation sequence

### Phase A — schema and read models

Add the customer profile, plan, subscription/order, entitlement, usage and onboarding contracts. Extend owner views read-only first.

### Phase B — checkout and provisioning

Add provider checkout session creation, signed webhook processing, tenant activation and primary customer-admin invitation.

### Phase C — entitlement enforcement and usage

Meter actual actions and enforce plan quotas/features at server boundaries.

### Phase D — owner/customer billing UI

Expose customer list/detail, plan, billing state, usage, users, engagements, invoices/receipts and audit history.

### Phase E — lifecycle automation

Grace periods, renewal, suspension, cancellation, reactivation, usage alerts and owner notifications.

## Out of scope until separately approved

- inventing final pricing;
- storing raw payment credentials;
- automatic professional signoff;
- customer data sharing across tenants;
- billing Academy activity to customers;
- using customer accounting data as training material without separate authorization;
- deleting customer evidence solely because payment failed.

## Success condition

An owner should be able to open one customer record and answer, without querying raw files:

- Who is this customer?
- Who can access the account?
- What did they buy?
- What are they entitled to use?
- What have they used this billing period?
- What is their billing state?
- What accounting workspaces/engagements belong to them?
- What is processing now?
- What reports exist?
- Are there operational or billing alerts?
- What changed, who changed it and when?
