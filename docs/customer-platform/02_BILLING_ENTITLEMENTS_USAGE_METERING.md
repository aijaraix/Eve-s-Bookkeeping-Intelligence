# Billing, Entitlements & Usage Metering Contract

## Goal

Define how Eve records purchases, subscriptions, entitlements and actual product usage without coupling accounting truth to a specific payment processor.

Final prices are intentionally not defined here.

## Payment-provider boundary

Create a narrow provider adapter such as:

```ts
interface PaymentProvider {
  createCheckoutSession(input: CheckoutRequest): Promise<CheckoutSession>;
  verifyWebhook(rawBody: Buffer, headers: Record<string,string>): VerifiedWebhook;
  createCustomerPortalSession?(billingAccountId: string): Promise<string>;
  cancelSubscription?(providerSubscriptionId: string, mode: 'END_OF_TERM'|'IMMEDIATE'): Promise<void>;
}
```

The provider may change later without changing Eve tenant IDs, usage records or entitlement logic.

## Commercial data model

### BillingAccount

One primary billing account per tenant unless explicitly extended later.

Fields:

- `id`
- `tenantId`
- `provider`
- `providerCustomerId` optional
- `billingEmail`
- `status`
- `createdAt`
- `updatedAt`

Never store raw card/bank credentials.

### PlanVersion

Plans must be versioned so historical subscriptions remain explainable when pricing or allowances change.

Fields:

- `planId`
- `version`
- `name`
- `description`
- `status` (`DRAFT`, `ACTIVE`, `RETIRED`)
- `currency`
- `billingInterval` (`MONTHLY`, `ANNUAL`, `ONE_TIME`, `CUSTOM`)
- `basePriceMinor`
- `features`
- `allowances`
- `overagePolicy`
- `effectiveFrom`
- `effectiveTo` optional

Do not overwrite a plan version already referenced by a purchase.

### Subscription

Fields:

- `id`
- `tenantId`
- `billingAccountId`
- `planId`
- `planVersion`
- `providerSubscriptionId` optional
- `status`
- `periodStart`
- `periodEnd`
- `cancelAtPeriodEnd`
- `canceledAt` optional
- `trialEndsAt` optional
- `createdAt`
- `updatedAt`

Recommended statuses:

- `PENDING`
- `TRIALING`
- `ACTIVE`
- `PAST_DUE`
- `SUSPENDED`
- `CANCELING`
- `CANCELED`

### Order

Supports one-time purchases and the initial purchase that creates a subscription.

Fields:

- `id`
- `tenantId` nullable until provisioning if necessary
- purchaser email
- provider checkout/session ID
- plan/product references
- amount/currency
- status
- idempotency key
- createdAt
- paidAt optional
- failedAt optional

### InvoiceReference / PaymentReference

Store provider references and normalized status only.

Do not duplicate sensitive payment instruments.

### BillingWebhookEvent

Persist every verified provider event before processing.

Fields:

- provider event ID
- provider
- event type
- receivedAt
- verifiedAt
- processedAt optional
- processing result
- associated tenant/order/subscription IDs where resolved
- payload digest or appropriately minimized retained payload according to policy

Provider event ID must be unique to guarantee idempotency.

## Checkout flow

### Server-authoritative sequence

1. Visitor/customer chooses an offer.
2. Eve server validates active PlanVersion.
3. Eve creates a `PENDING` Order with a unique idempotency key.
4. Server asks PaymentProvider for checkout session.
5. Browser is redirected to provider-hosted checkout.
6. Provider sends signed webhook.
7. Eve verifies signature and stores BillingWebhookEvent.
8. In one idempotent transaction Eve marks payment/order state and creates/updates subscription.
9. Eve provisions or activates tenant entitlement.
10. Customer receives/continues onboarding.
11. Checkout success page only displays server-read status; it never grants access by itself.

## Entitlements

Entitlements are the bridge between commerce and product access.

Recommended model:

```ts
interface EntitlementGrant {
  id: string;
  tenantId: string;
  sourceType: 'SUBSCRIPTION'|'ORDER'|'TRIAL'|'OWNER_GRANT';
  sourceId: string;
  key: string;
  limit: number | boolean | string | null;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE'|'EXPIRED'|'REVOKED';
}
```

Possible entitlement keys:

- `SEATS_MAX`
- `DOCUMENTS_PER_PERIOD`
- `PAGES_PER_PERIOD`
- `PROCESSING_JOBS_PER_PERIOD`
- `REPORTS_PER_PERIOD`
- `STORAGE_BYTES_MAX`
- `WORKSPACES_MAX`
- `ADVANCED_EVIDENCE`
- `API_ACCESS`
- `INTEGRATIONS`
- `PRIORITY_PROCESSING`
- `RETENTION_TIER`

Final packaging/pricing is a business decision and must not be invented by engineering.

## Entitlement enforcement

Before restricted actions begin, the server evaluates:

1. authenticated user;
2. tenant membership;
3. role permission;
4. customer operational status;
5. active entitlement;
6. current usage against limit;
7. action-specific accounting/professional boundary.

The frontend may display limits, but enforcement must remain server-side.

## Usage-event ledger

### UsageEvent is authoritative

Counters and dashboards are derived from immutable usage events.

Recommended fields:

- `id`
- `tenantId`
- `workspaceId` optional
- `engagementId` optional
- `actorUserId` optional
- `sourceEventId`
- `metric`
- `quantity`
- `unit`
- `occurredAt`
- `billingPeriodKey`
- `billable`
- `nonBillableReason` optional
- `provider/model` optional internal-only metadata
- `estimatedInternalCostMinor` optional internal-only field
- `metadata` minimized and non-sensitive
- `idempotencyKey`

`idempotencyKey` must be unique for the metric event so retries do not double-count.

## Recommended usage metrics

Track separately; do not collapse everything into one ambiguous "use" count.

### Customer/product consumption

- `DOCUMENT_UPLOAD_COUNT`
- `DOCUMENT_BYTES_INGESTED`
- `SOURCE_PAGES_PROCESSED`
- `PROCESSING_JOB_STARTED`
- `PROCESSING_JOB_COMPLETED`
- `SPECIALIST_EXECUTION_COUNT`
- `REPORT_GENERATED_COUNT`
- `REPORT_DOWNLOAD_COUNT`
- `STORAGE_BYTE_DAYS` or current `STORAGE_BYTES`
- `ACTIVE_SEAT_COUNT`
- `WORKSPACE_COUNT`
- `API_ACTION_COUNT` if/when API is offered

### Internal cost/operations metrics

Where physical provider receipts support them:

- inference input tokens
- inference output tokens
- model call count
- provider-reported cost or internally estimated cost
- OCR/extraction service usage

Internal cost metrics do not automatically become customer billable units.

## Billable/non-billable classification

Automatically non-billable:

- Academy exercises;
- regression/test tenants;
- owner QA;
- system retries caused by Eve infrastructure failure;
- duplicate webhook/event replay;
- failed actions before billable work begins;
- re-rendering/read-only dashboard views;
- internal verification runs not requested by customer pricing policy.

Every non-billable UsageEvent should retain a reason code.

## UsageCounter

Counters are a materialized/derived view for fast UI reads.

Key:

`tenantId + billingPeriodKey + metric`

Fields:

- quantity
- included allowance
- remaining allowance where meaningful
- lastEventAt
- calculatedAt

A counter can always be rebuilt from UsageEvents.

## Customer usage UI

Customer should see understandable product consumption, not raw infrastructure telemetry.

Examples:

- Documents processed this period
- Pages processed this period
- Reports generated
- Team seats used / available
- Storage used
- Plan limits and reset/renewal date

Do not expose internal model/provider costs or infrastructure secrets.

## Owner usage UI

Owner should be able to see:

- usage by tenant
- plan/allowances
- current period consumption
- previous period trend
- internal estimated cost where available
- overage risk
- unusual spikes
- failed/retried jobs
- non-billable system activity
- gross margin inputs once pricing/cost policy is defined

## Thresholds and alerts

Support threshold events at configurable percentages, e.g. 70/90/100%, without hardcoding those exact values into business logic.

Possible responses:

- informational alert
- customer notification
- owner notification
- soft limit
- hard limit
- metered overage

Behavior is defined by the plan/entitlement policy.

## Failed payment policy

Payment failure should update billing state and emit audit/notification events.

Recommended sequence:

`ACTIVE -> PAST_DUE -> grace period -> SUSPENDED`

Recovery:

`PAST_DUE/SUSPENDED -> ACTIVE`

Suspension should be non-destructive and should not remove authoritative accounting evidence.

## Cancellation

Support:

- cancel at period end;
- immediate cancel where business rules permit;
- reactivation;
- provider webhook reconciliation.

Retain historical purchase/subscription records even after cancellation.

## Refunds and disputes

Refund/dispute provider events must be recorded and reconciled to Eve orders/payments.

Do not automatically delete customer records or reverse accounting facts because a payment is refunded.

## Audit requirements

Record at minimum:

- checkout/order created
- payment confirmed/failed/refunded
- subscription created/renewed/past-due/canceled
- entitlement granted/revoked/expired
- owner manual grant/override
- usage-limit denial
- plan change
- billing-email change

Every owner override needs actor, timestamp, tenant and reason.
