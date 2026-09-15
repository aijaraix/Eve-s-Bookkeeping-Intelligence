# Customer Lifecycle & Onboarding Contract

## Goal

Define exactly how a person or company becomes an Eve Bookkeeping customer and how that customer is represented, provisioned, activated, supported and eventually offboarded.

This contract applies to both owner-assisted and future self-service onboarding.

## Stable identity model

### Tenant

A tenant is the customer organization.

Use the existing `tenant.id` as the stable organization key.

A tenant owns or is assigned:

- users;
- workspaces/engagements;
- documents;
- reports;
- billing account;
- subscriptions/orders;
- entitlements;
- usage events;
- onboarding state;
- audit/admin history.

Do not create another independent customer ID namespace unless an external provider requires one; external IDs are references mapped back to `tenant.id`.

## Customer profile

Recommended `CustomerProfile` fields:

### Identity

- `tenantId`
- `displayName`
- `legalName` optional
- `customerStatus`
- `createdAt`
- `activatedAt` optional
- `canceledAt` optional

### Primary contacts

- `primaryContactName`
- `primaryContactEmail`
- `billingEmail`
- `phone` optional

### Business profile

- `businessType` optional
- `industry` optional
- `employeeBand` optional
- `country`
- `stateRegion` optional
- `timezone`
- `functionalCurrency`
- `reportingFramework` optional
- `fiscalYearEnd` optional

### Service profile

- `onboardingStage`
- `assignedInternalOwnerId` optional
- `externalAccountantEmail` optional
- `supportTier` optional
- `salesSource` optional
- `notesCount`

### Legal/consent references

- accepted terms version + timestamp
- privacy notice version + timestamp
- data-processing agreement reference if applicable

Do not collect sensitive information merely because it might be useful later. Add fields only when there is a product, legal or support reason.

## Customer lifecycle

### 1. Prospect

Entry paths:

- Request Demo form
- owner/manual creation
- referral/partner
- future self-service plan selection

Minimum prospect record:

- name
- business email
- company
- prospect type (`BUSINESS`, `CPA_FIRM`, `OTHER`)
- source
- status
- createdAt

Do not create a full tenant solely because someone fills out a marketing form.

### 2. Purchase or owner approval

A customer moves to provisioning after either:

- confirmed payment/purchase;
- an owner/admin-approved manual entitlement;
- an approved trial/grant.

The browser success screen alone must never activate service. Payment-provider webhook confirmation is authoritative for paid purchases.

### 3. Tenant provisioning

Provision atomically/idempotently:

1. create or resolve tenant;
2. create CustomerProfile;
3. create BillingAccount if commercial;
4. attach subscription/order or manual entitlement;
5. calculate entitlement set;
6. create primary `CLIENT_ADMIN` invitation;
7. persist onboarding state;
8. append audit event.

If any critical step fails, leave a resumable provisioning record instead of partially creating duplicate tenants.

### 4. Account setup

Primary customer admin:

1. receives one-time invitation/setup credential or secure setup link;
2. signs in;
3. chooses permanent password;
4. accepts required terms;
5. verifies organization details;
6. lands in onboarding.

The one-time credential is invalid after successful first sign-in/password setup.

### 5. Product onboarding

Recommended onboarding checklist:

- organization profile confirmed
- reporting period/framework/currency confirmed where applicable
- customer users invited
- first engagement/workspace created or assigned
- first source document uploaded
- processing completes or reaches review-required state
- customer sees statements/evidence/findings
- first report/deliverable available when appropriate

Onboarding is complete when the customer has reached a meaningful product outcome, not merely when the account exists.

## Onboarding state model

Recommended states:

- `NOT_STARTED`
- `ACCOUNT_SETUP`
- `ORGANIZATION_SETUP`
- `WORKSPACE_SETUP`
- `FIRST_UPLOAD`
- `PROCESSING`
- `FIRST_REVIEW`
- `COMPLETED`
- `BLOCKED`

Track:

- current stage
- startedAt
- completedAt
- lastActivityAt
- blockingReason
- ownerActionRequired
- customerActionRequired

## Users and roles

Preserve existing roles.

Recommended customer behavior:

### `CLIENT_ADMIN`

Can manage permitted users, organization profile and allowed billing/settings actions.

### `CLIENT_USER`

Can work inside allowed customer accounting areas according to product permissions.

### `READ_ONLY`

Can inspect permitted accounting information without mutation.

### `CPA_REVIEWER`

May receive review workflows, but ordinary account authentication alone still does not establish licensed professional authority.

Every customer user must have exactly one permitted tenant unless a future multi-tenant professional role is explicitly designed.

## Owner-assisted onboarding

Owner control center should support:

- create prospect/customer
- provision tenant
- assign plan/manual entitlement
- invite primary admin
- resend/reset invitation
- view onboarding stage
- view blockers
- impersonation is NOT permitted by default
- open customer workspace via owner authority with clear audit event

## Self-service onboarding

Future self-service flow:

`MARKETING SITE -> SELECT OFFER -> CHECKOUT -> WEBHOOK CONFIRMED -> TENANT PROVISIONED -> ADMIN INVITED -> PASSWORD SET -> ONBOARDING -> FIRST WORKSPACE`

If a buyer already has an Eve identity, resolve the identity safely rather than create duplicate users or tenants.

## Customer status transitions

Recommended operational rules:

### `PROSPECT -> ONBOARDING`

Confirmed purchase, owner grant or approved trial.

### `ONBOARDING -> ACTIVE`

Required account setup complete and active entitlement exists.

### `ACTIVE -> PAST_DUE`

Payment provider reports unpaid/failed renewal after policy conditions.

### `PAST_DUE -> SUSPENDED`

Grace period expired according to billing policy.

### `PAST_DUE -> ACTIVE`

Payment recovered.

### `ACTIVE/PAST_DUE -> CANCELING`

Cancellation requested but access continues through paid period if applicable.

### `CANCELING -> CANCELED`

Entitlement end date reached.

### `CANCELED -> ACTIVE`

Explicit reactivation/new purchase.

## Suspension behavior

Suspension must be non-destructive.

Policy may disable:

- new uploads;
- new processing;
- new report generation;
- paid integrations.

Policy should normally retain read access to existing records for an appropriate period, subject to legal/security requirements.

Never silently delete authoritative customer accounting evidence because an invoice failed.

## Cancellation/offboarding

Record:

- cancellation initiator
- reason
- requestedAt
- effectiveAt
- entitlement end date
- retention policy
- export availability
- final deletion eligibility date if applicable

Customer data deletion must be an explicit separate lifecycle event with audit evidence.

## Owner customer record

A single owner customer detail screen should eventually expose:

- Overview
- Onboarding
- Billing
- Usage
- Entitlements
- Engagements
- Documents
- Reports
- Users
- Activity/Audit
- Internal Notes

The owner should never need to reconstruct the customer's lifecycle from raw files or multiple unrelated dashboards.
