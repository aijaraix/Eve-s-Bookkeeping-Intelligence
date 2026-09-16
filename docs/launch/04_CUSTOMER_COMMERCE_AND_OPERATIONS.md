# 04 — Customer Commerce and Operations

## Objective

Add a commercial/customer-management layer without creating a second customer database or bypassing existing tenant security.

Permanent rule:

> One Eve tenant = one customer/business root.

Everything commercial attaches to that tenant.

## Customer lifecycle

Suggested lifecycle:

`LEAD → QUALIFIED → OFFER_SELECTED → CHECKOUT_STARTED → PAYMENT_VERIFIED → TENANT_PROVISIONED → ADMIN_INVITED → ONBOARDING_IN_PROGRESS → ACTIVE → PAST_DUE/PAUSED → CANCELLED/OFFBOARDED`

Manual owner-assisted onboarding may be used for first customers before automated checkout is approved, provided tenant/entitlement/access changes are auditable and controlled.

## Commercial data model

Attach these records to tenantId:

### CustomerProfile

- tenantId
- legal/display name
- primary contact
- billing contact
- customer type: BUSINESS / CPA_FIRM
- status
- onboarding state
- createdAt/activatedAt
- internal owner notes

### Plan

Logical commercial product, e.g. Business, Firm, Pilot. Do not hard-code current mockup prices as truth.

### PlanVersion

Versioned commercial terms:

- planVersionId
- planId
- effective dates
- price/currency/billing interval
- included allowances
- feature entitlements
- overage policy
- onboarding fee if any
- status ACTIVE/RETIRED

Existing subscriptions stay bound to the version purchased unless deliberately migrated.

### Order / Purchase

- orderId
- tenant/prospect reference
- planVersion/product
- amount/currency
- provider reference
- payment state
- created/completed timestamps

### Subscription

- subscriptionId
- tenantId
- planVersionId
- provider customer/subscription IDs
- current period
- status
- renewal/cancel state
- grace/past-due metadata

### Entitlement

Represents what the tenant is allowed to use:

- feature key
- allowance/limit
- enforcement mode
- effective dates
- source plan/manual grant
- audit history

### UsageEvent

Append-only normalized usage record:

- usageEventId
- tenantId
- engagement/workspace
- event type
- quantity/unit
- timestamp
- source job/artifact/report
- billable boolean
- idempotency key
- internal cost metadata where available

### UsageAggregate

Materialized/customer-display totals by period and dimension.

### OnboardingRecord

Tracks business setup, document instructions, users, initial engagement, source collection readiness and completion.

## Usage dimensions

Do not use one vague "uses" counter. Track dimensions separately, for example:

- documents uploaded
- pages/images processed
- OCR/vision pages
- processing jobs
- specialist executions
- reports generated
- document-wizard outputs
- storage
- seats
- API calls when introduced

Internal-only dimensions may include model calls/tokens/provider cost/compute duration where receipts support it.

Academy, synthetic QA, internal retries caused by Eve failures, and owner/internal test activity should be non-billable unless explicitly defined otherwise.

## Billing activation safety

Never activate entitlements from a browser "success" page alone.

Production checkout flow:

`Website/App → provider checkout → provider payment → verified server webhook → Eve order/subscription update → entitlement activation`

Requirements:

- signature/authentication verification
- idempotent webhook processing
- replay safety
- stored provider IDs, not card data
- auditable activation/deactivation
- no plaintext payment secrets in repository

Provider abstraction should keep the commercial model independent from any single processor.

## Customer onboarding

After verified purchase/manual approval:

1. create/activate tenant if needed
2. assign PlanVersion/entitlements
3. create/invite CLIENT_ADMIN
4. force permanent-password setup
5. capture company/entity profile
6. define first engagement/reporting period
7. show supported evidence upload methods
8. accept first batch
9. show processing and clarification state
10. mark onboarding complete only when customer can reach a usable workspace

## Owner customer-management UI

Owner customer detail should expose one coherent record with tabs/sections:

- Overview
- Onboarding
- Billing
- Usage
- Entitlements
- Engagements
- Documents/Batches
- Clarifications
- Reports
- Users
- Activity/Audit
- Internal Notes

Owner should be able to answer quickly:

- who is the customer?
- what did they buy?
- are they active/paid?
- what are they entitled to?
- how much are they using?
- what is currently processing?
- what is blocked?
- what reports exist?
- how many seats/users?
- what internal operational cost is visible?

## Customer billing/plan experience

Customer should see only understandable commercial state:

- current plan
- renewal/status
- included allowances
- current usage
- invoices/receipts when provider integration supports it
- upgrade/contact path
- seat/user limits

Do not expose provider internals, infrastructure costs, Academy activity or other tenants.

## Customer support state

Owner/customer consoles should surface:

- active clarification requests
- failed/paused processing
- unsupported artifact notices
- plan/usage limit notices
- past-due billing notices
- onboarding incomplete state

## Pricing governance

No price, discount, founding offer, transaction limit or plan allowance shown in design mockups becomes production truth until OWNER_APPROVED.

Store approved values as plan data, not scattered UI constants.

## First launch commerce strategy

To reduce implementation risk and preserve launch momentum:

Phase 1 may support owner-created tenant + manually approved plan/entitlements + invoice/payment outside automated checkout, if legally/commercially acceptable to owner.

Phase 2 adds provider checkout and verified webhooks.

Phase 3 adds self-service plan changes/usage overages where justified.

The accounting product must not be blocked on choosing sophisticated subscription infrastructure if a controlled manual commercial workflow can safely onboard the first pilot customers.
