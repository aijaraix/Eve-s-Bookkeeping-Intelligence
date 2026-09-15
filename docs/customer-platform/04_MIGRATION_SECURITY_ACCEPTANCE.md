# Customer Platform Migration, Security & Acceptance

## Purpose

Define how the customer-commerce layer is introduced without breaking the accepted Eve accounting, Academy, owner-authentication, tenant-isolation or customer-workflow architecture.

## Current-state migration rule

The current access model already persists users, tenants, sessions and tenant-to-workspace assignments.

Preserve all existing IDs.

### Tenant migration

Existing:

```ts
Tenant {
  id: string;
  name: string;
  workspaceIds: string[];
}
```

Target:

Keep the existing Tenant identity and add related domain records rather than forcing every field into the tenant object.

Example:

```text
Tenant
  ├── CustomerProfile
  ├── BillingAccount
  ├── Subscription / Orders
  ├── EntitlementGrants
  ├── UsageEvents / Counters
  ├── OnboardingState
  ├── Users
  └── existing Workspaces / Engagements
```

Do not re-key existing customer users or workspaces.

## Storage strategy

The implementation must first inspect existing production storage/database capabilities.

For billing webhooks, usage events and concurrent customer commerce, prefer an existing transactional database if one is already deployed and appropriate.

If the current JSON identity store remains temporarily in use:

- do not stuff high-volume usage-event history into `accounts.json`;
- separate identity/account state from usage/billing event ledgers;
- preserve atomic writes and locking;
- provide a documented migration path to transactional tables;
- do not create an unbounded single JSON file for usage.

There must still be one logical customer data model regardless of physical storage implementation.

## Migration phases

### Phase 0 — discovery only

Before source changes:

- enumerate current identity/tenant state;
- enumerate production customer workspaces;
- identify authoritative storage/database services;
- identify existing email/notification and payment-provider integrations if any;
- confirm current owner/customer routes and auth middleware.

No customer processing rerun.

### Phase 1 — schema + read-only owner projection

Introduce types/tables/stores for:

- CustomerProfile
- OnboardingState
- PlanVersion
- BillingAccount
- Subscription
- Order
- EntitlementGrant
- UsageEvent
- UsageCounter
- BillingWebhookEvent

Populate owner customer detail with existing tenant/accounting data before commerce actions are enabled.

### Phase 2 — manual commercial provisioning

Allow owner to assign:

- plan
- trial/manual entitlement
- onboarding state

without payment-provider checkout.

This provides a safe operational fallback and proves entitlement enforcement before self-service commerce.

### Phase 3 — purchase/checkout

Add:

- checkout session
- signed webhook
- order/payment/subscription reconciliation
- idempotent tenant activation
- primary customer admin invitation

### Phase 4 — metering

Emit usage events from authoritative workflow boundaries.

Do not estimate customer usage from UI clicks when a backend event exists.

### Phase 5 — customer billing UI and lifecycle automation

Expose plan/usage/invoice references and add renewal/past-due/cancellation automation.

## Security requirements

### Payment security

- provider-hosted payment collection preferred;
- no raw card numbers/CVV stored;
- provider secrets only in secret configuration;
- webhook signatures verified over required raw payload;
- reject unsigned/invalid/replayed events;
- do not log sensitive payment payload fields unnecessarily.

### Tenant isolation

Every customer-owned object includes or resolves to `tenantId`.

Every customer request verifies tenant membership server-side.

Negative tests must prove a valid user in Tenant A cannot read Tenant B by changing URLs, IDs, request bodies or workspace IDs.

### Owner operations

Owner/admin mutations require appropriate role and CSRF/session protections consistent with the existing access layer.

Manual billing/entitlement changes require an audit reason.

### Professional authority

Subscription, payment, role or owner status must never fabricate CPA signoff authority.

Professional authorization remains a separate capability/gate.

### Secrets

Never commit:

- payment-provider secrets
- webhook signing secrets
- customer passwords
- invitation passwords
- full private payment payloads
- private bank/card data.

## Idempotency requirements

Idempotency must exist at:

- checkout/order creation where retryable;
- provider webhook ingestion;
- subscription activation/renewal;
- tenant provisioning;
- usage event emission;
- invoice/payment reconciliation.

A network retry must not create:

- duplicate tenant
- duplicate subscription
- duplicate entitlement
- duplicate usage charge
- duplicate invitation.

## Usage correctness tests

For each metric prove:

1. one real operation emits one event;
2. retry/replay does not double count;
3. internal Academy activity is non-billable;
4. system-failure retry policy is non-billable where required;
5. Tenant A events never appear in Tenant B counters;
6. counter rebuild from ledger matches displayed value.

## Billing state tests

Physically test or provider-sandbox test:

- successful initial purchase
- duplicate webhook
- failed payment
- payment recovery
- renewal
- cancel at period end
- immediate cancellation where supported
- refund
- malformed/unsigned webhook
- provider timeout/retry

Browser success redirect without webhook must not activate service.

## Customer onboarding acceptance

A new customer can move through:

`PURCHASE/OWNER GRANT -> TENANT -> ADMIN INVITE -> PASSWORD SET -> ORGANIZATION SETUP -> FIRST WORKSPACE -> FIRST UPLOAD -> PROCESSING -> CUSTOMER DASHBOARD`

Verify no manual database editing is required for the normal path.

## Owner acceptance

Owner can select a customer and see in one place:

- organization/contact
- onboarding
- users
- plan
- subscription/order state
- entitlements
- current usage
- historical usage
- engagements
- processing
- reports
- alerts
- activity/audit.

## Customer acceptance

Customer admin can see only their tenant and, according to policy:

- organization
- team
- plan
- billing state
- usage
- accounting workspaces
- documents
- statements/evidence/findings
- reports.

Customer cannot see:

- global customer list
- other tenants
- global Academy
- global agent infrastructure
- internal cost telemetry
- payment-provider secrets
- owner controls.

## Regression requirements

Any implementation pass must verify:

- existing OWNER login still works;
- tenant isolation tests still pass;
- temporary PIN path remains unchanged until owner removes it;
- accepted Academy UI/browser system still runs;
- Hermes remains the single Academy scheduler authority;
- existing customer accounting work is not rerun merely because billing was added;
- Pfizer/customer regression hashes/state remain unchanged where used as protected baseline.

## Readiness states

### `CUSTOMER_COMMERCE_FOUNDATION_READY`

Schema, owner read views, onboarding and manual entitlements are physically working, but payment checkout may still be disabled.

### `CUSTOMER_COMMERCE_READY`

Requires:

- checkout physically verified;
- webhook verified;
- purchase provisions/activates correct tenant;
- entitlements enforced;
- usage events/counters verified;
- owner customer-management screens verified;
- customer billing/usage screen verified;
- cancellation/past-due flow tested;
- tenant isolation verified;
- Academy/internal activity excluded from customer billing;
- no secrets committed;
- existing accounting/Academy regression passes.

Do not claim READY from unit tests alone when a provider sandbox or real physical flow can be exercised.
