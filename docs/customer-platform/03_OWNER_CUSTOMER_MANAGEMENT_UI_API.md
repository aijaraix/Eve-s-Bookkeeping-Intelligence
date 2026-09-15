# Owner Customer Management UI & API Contract

## Goal

Define the operational control center for managing Eve customers without forcing the owner to inspect raw storage, Hermes, payment-provider consoles, or multiple unrelated dashboards.

This extends the existing owner control center and existing Eve read models.

## Owner navigation

Recommended top-level customer-management navigation:

- Overview
- Customers
- Billing
- Usage
- Academy
- Agents
- Reports
- Users & Access
- System
- Audit

This document focuses on Customers, Billing and Usage.

## Customers list

### Required columns

- Customer / organization name
- Customer status
- Onboarding stage
- Plan / offer
- Billing status
- Current-period usage summary
- Users/seats
- Active engagements
- Processing now
- Open findings/alerts
- Last activity

### Filters

- status
- onboarding stage
- plan
- billing state
- usage threshold state
- has active processing
- has system/billing alert
- created date

### Search

Search by:

- company name
- primary contact
- billing email
- tenant ID
- workspace/engagement identifier where appropriate for support

## Customer detail

One tenant detail page should be the owner source of truth for customer operations.

Recommended tabs:

### 1. Overview

Show:

- organization identity
- primary/billing contact
- customer status
- onboarding stage
- plan/billing status
- usage snapshot
- active users
- active engagements
- latest processing
- latest report
- alerts requiring owner attention

Quick actions:

- Open customer accounting workspace
- Invite user
- View billing
- View usage
- Add internal note
- Suspend/reactivate where authorized

Every quick action must generate an audit event.

### 2. Onboarding

Show checklist and timestamps:

- account created
- admin invited
- permanent password established
- organization details complete
- first engagement created
- first document uploaded
- first processing completed/review required
- first statements/evidence viewed
- onboarding complete

Show:

- customer action required
- owner action required
- blocking reason

### 3. Billing

Show:

- BillingAccount status
- active subscription/order
- plan/version
- billing interval
- current period
- renewal/end date
- provider reference masked/internal-only
- invoice/payment history references
- past-due status
- cancellation state

Owner actions, permission-gated:

- issue manual entitlement/grant
- schedule cancellation
- reactivate
- update billing contact
- open provider-hosted billing portal when available

Do not show or store raw card data.

### 4. Usage

Show current billing-period consumption:

- documents
- pages
- processing jobs
- specialist executions if customer-facing plan uses them
- reports
- seats
- storage
- API/automation when applicable

For each metric show:

- used
- allowance
- remaining or overage
- reset date
- trend vs prior period

Owner-only detail may additionally show:

- internal estimated AI/service cost
- non-billable retries
- Academy excluded usage
- unusual spikes

### 5. Entitlements

Show effective feature/quota grants and their source:

- subscription
- one-time order
- trial
- owner grant

Owner manual override must require:

- owner/admin role
- reason
- effective dates
- audit entry

Never mutate the historical plan version to create a one-off exception.

### 6. Engagements

Use the existing accounting read model.

Show:

- workspace/engagement
- period
- framework/currency
- documents
- facts/coverage
- processing state
- findings
- reports
- last activity

Click-through opens the existing accounting workspace, not a duplicate implementation.

### 7. Users

Show:

- email
- role
- status
- invitation/setup state
- last sign-in where retained
- sessions
- createdAt

Actions:

- invite
- disable/enable
- reset access
- revoke sessions
- role change within allowed tenant policy

All changes audit logged.

### 8. Activity / Audit

Combine customer-relevant events into one chronological timeline:

- account access
- onboarding transitions
- uploads
- processing transitions
- reports
- billing/subscription events
- entitlement changes
- usage limit events
- user administration
- owner notes/administration

Do not mix internal secrets into customer-visible activity.

### 9. Internal Notes

Owner/internal notes are never customer-visible unless explicitly converted to a customer communication.

Fields:

- author
- timestamp
- category
- note
- optional follow-up date

No passwords/payment credentials/secrets in notes.

## Owner overview metrics

Once billing exists, the owner overview can include:

- total customers
- active customers
- onboarding customers
- past-due customers
- active subscriptions
- plan distribution
- documents/pages processed this period
- reports generated this period
- active seats
- usage threshold alerts
- current processing jobs
- customers requiring attention

Financial business metrics such as MRR/ARR should only be shown after pricing/subscription data is actually authoritative.

## Customer-facing account/billing area

Customer `CLIENT_ADMIN` should eventually have an Account / Plan & Usage area showing only their tenant:

- plan name
- subscription state
- current period/end date
- invoices/receipts where provider permits
- usage against allowance
- seats used
- change/cancel controls according to business policy
- billing contact
- payment-method management through provider-hosted secure UI where possible

`CLIENT_USER` and `READ_ONLY` access to billing is policy-controlled.

## API design principles

Use authenticated tenant-aware endpoints.

Recommended logical surfaces (exact routing may match existing conventions):

### Owner-only

- `GET /api/owner/customers`
- `GET /api/owner/customers/:tenantId`
- `GET /api/owner/customers/:tenantId/usage`
- `GET /api/owner/customers/:tenantId/billing`
- `GET /api/owner/customers/:tenantId/activity`
- `POST /api/owner/customers/:tenantId/entitlements`
- `POST /api/owner/customers/:tenantId/status`
- `POST /api/owner/customers/:tenantId/notes`

### Customer tenant-scoped

- `GET /api/portal/account`
- `GET /api/portal/billing`
- `GET /api/portal/usage`
- `GET /api/portal/invoices`
- `POST /api/portal/billing/session`

### Commerce/public authenticated as required

- `POST /api/commerce/checkout`
- `GET /api/commerce/order/:id/status`
- `POST /api/commerce/webhooks/:provider`

## Authorization rules

### Owner endpoints

Require `OWNER` or `PLATFORM_ADMIN`, with narrow exceptions deliberately granted to `INTERNAL_OPERATOR`.

### Customer endpoints

Require authenticated user whose `tenantId` equals the target tenant.

Never accept arbitrary `tenantId` from the browser and trust it without server-side membership verification.

### Billing webhooks

Do not use ordinary browser session auth.

Require payment-provider signature verification over the exact raw payload according to provider contract.

## Read models

Owner UI should receive composed read models, not perform dozens of client-side joins.

Recommended `OwnerCustomerSummary`:

```ts
interface OwnerCustomerSummary {
  tenantId: string;
  name: string;
  status: string;
  onboardingStage: string;
  planName?: string;
  billingStatus?: string;
  currentPeriodUsage: Record<string, number>;
  activeUsers: number;
  engagementCount: number;
  documentsCount: number;
  processingCount: number;
  openAlerts: number;
  lastActivityAt?: string;
}
```

Recommended `OwnerCustomerDetail` composes profile, billing, usage, entitlements, engagement summaries, users and alerts while keeping each underlying domain authoritative.

## Alerts

Owner customer page should support normalized alerts such as:

- `ONBOARDING_BLOCKED`
- `PAYMENT_FAILED`
- `PAST_DUE`
- `USAGE_THRESHOLD`
- `USAGE_LIMIT_REACHED`
- `PROCESSING_FAILED`
- `REVIEW_REQUIRED`
- `CUSTOMER_ACTION_REQUIRED`
- `OWNER_ACTION_REQUIRED`

Alerts link directly to the relevant screen/action.

## UX standard

Owner/customer management should feel like the rest of the Eve SaaS product:

- cards for summary states
- tables for customer lists
- status pills
- compact usage progress bars
- charts only where they improve decisions
- clear action menus
- responsive phone view
- no raw JSON as normal UI
- no payment-provider technical jargon in customer UI

## Audit invariant

Any action that can affect:

- access
- billing
- entitlements
- customer status
- usage adjustments
- cancellation
- tenant/workspace assignment

must record:

- actor
- tenant
- action
- timestamp
- reason where applicable
- affected object ID
- before/after or event reference sufficient for later investigation.
