# Codex Implementation Directive — Customer Commerce & Management

Use this only when the owner authorizes implementation.

## Read first

Read in order:

1. `00_CUSTOMER_COMMERCE_MASTER_PLAN.md`
2. `01_CUSTOMER_LIFECYCLE_ONBOARDING.md`
3. `02_BILLING_ENTITLEMENTS_USAGE_METERING.md`
4. `03_OWNER_CUSTOMER_MANAGEMENT_UI_API.md`
5. `04_MIGRATION_SECURITY_ACCEPTANCE.md`

Then fetch current remote state and inspect the physical production architecture.

Current production truth overrides historical implementation assumptions.

## Objective

Implement the smallest durable customer-commerce layer that extends the existing tenant/account system.

Do not redesign Eve.
Do not create a second customer database.
Do not duplicate accounting workspaces.
Do not create another Academy scheduler.
Do not rerun customer accounting merely because commerce is being added.

## Root invariant

The existing Eve `tenant.id` remains the customer organization key.

Billing, purchases, subscriptions, entitlements, usage and onboarding reference the same tenant.

## Required implementation order

### Pass 1 — discovery and schema

- inspect existing tenant/user/session storage;
- inspect existing transactional database/storage services;
- inspect existing payment/email integrations;
- choose the existing appropriate durable store;
- add versioned domain records from the docs;
- add migration without changing existing tenant/workspace IDs.

### Pass 2 — owner read model

Add Customer list/detail projections covering:

- profile
- onboarding
- users
- engagements
- billing state
- entitlements
- usage
- reports
- alerts
- audit.

Use existing accounting read models rather than copying accounting data.

### Pass 3 — manual entitlement path

Before external checkout, physically prove an owner can provision a tenant/customer with a plan/manual grant and that server-side entitlement enforcement works.

### Pass 4 — checkout/provider integration

Only after inspecting available provider integrations:

- implement provider adapter;
- provider-hosted checkout;
- verified signed webhook;
- idempotent order/subscription reconciliation;
- tenant provisioning/activation;
- customer admin invitation.

Never activate from browser success redirect alone.

### Pass 5 — usage ledger

Emit authoritative UsageEvents from backend workflow boundaries.

Do not use frontend clicks as the source when backend processing events exist.

Academy/regression/owner QA must be non-billable.

### Pass 6 — customer billing UI

Expose tenant-scoped plan/billing/usage/invoice references according to role policy.

## Safety boundaries

- no raw card/CVV storage;
- no secrets in GitHub;
- no cross-tenant reads;
- no billing status granting CPA authority;
- no destructive deletion for payment failure;
- no duplicate tenant/subscription/usage from retries;
- no Academy usage billed to customers.

## Physical acceptance

Return `CUSTOMER_COMMERCE_READY` only after physically proving the acceptance contract in `04_MIGRATION_SECURITY_ACCEPTANCE.md`.

If the payment provider or owner pricing decision is not yet available, stop at `CUSTOMER_COMMERCE_FOUNDATION_READY` with manual entitlements physically verified and list only the truly external decision/action remaining.

## Closeout

Return:

- authoritative Git SHA
- deployed version
- storage/migration evidence
- customer data model
- owner customer-management evidence
- checkout/webhook evidence if implemented
- entitlement test evidence
- usage-ledger/counter evidence
- tenant-isolation result
- Academy regression result
- customer-accounting preservation result
- exact remaining owner decision/action, if any.
