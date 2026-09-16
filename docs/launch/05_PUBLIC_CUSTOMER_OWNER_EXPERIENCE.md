# 05 — Public, Customer, and Owner Experience

## Objective

Present one coherent Eve brand across three role-specific experiences without duplicating backend truth.

## Domain roles

### Public
`evesbookkeeping.com`

Purpose: explain Eve, build trust, capture qualified leads, route approved purchases/demos, and send existing customers to login.

### Customer
`app.evesbookkeeping.com`

Purpose: tenant-scoped customer workspace for uploads, processing, statements, evidence, findings/clarifications, reports, team and account/plan state.

### Owner
`owner.evesbookkeeping.com`

Purpose: business/operations control center for customers, usage, Academy, agents, reports, users, system health and audit.

### Engineering
Raw Hermes/Zeabur endpoints remain available only as advanced engineering/runtime surfaces.

## Brand direction

Use the approved Eve Bookkeeping Canva/brand package as the visual source of truth once final assets are delivered.

Current direction:

- premium financial/institutional tone
- deep navy authority surfaces
- white/ivory breathing room
- restrained blue/teal operational accents
- serif editorial/brand headings + clean sans-serif application typography
- prominent but sparing Eve emblem
- real/synthetic product UI rather than generic AI/robot imagery

Do not bake website copy into background images when live HTML text should remain accessible/responsive/indexable.

## Public site launch information architecture

Recommended initial public pages:

- Home
- Product
- How It Works
- For Businesses
- For CPA Firms
- Evidence & Security
- Pricing or Plans (only after commercial values approved)
- About
- Contact / Request Demo
- Login

Customer education/tutorial material should use a separate Learning Center concept. The existing autonomous QA Academy should not be confused with a customer course library.

If Academy is public-facing, describe the real quality system accurately, e.g. Eve Quality Academy / Continuous Quality.

## Public positioning

Core story:

> Bookkeeping intelligence you can trace.

Explain:

- document-to-accounting workflow
- evidence behind supported values
- specialized intelligence/agents behind Eve
- reconciliation and findings
- reviewable outputs
- explicit human professional boundaries
- continuous quality testing

Avoid generic unsupported claims such as "AI bookkeeping with 99% accuracy" without benchmark definition.

## Public claim governance

Do not publish unverified claims for:

- SOC 2 certification
- HIPAA compliance
- GDPR compliance as a blanket certification claim
- AWS hosting unless current production hosting is actually AWS
- AES-256/TLS-version specifics unless physically verified end-to-end
- penetration-test claims
- MFA availability unless customer-facing path is actually implemented/verified
- unsupported bank/payment/cloud-drive integrations
- fake testimonials/star ratings
- unsupported savings/time percentages

Security page may accurately discuss physically implemented controls after verification, such as tenant-scoped authorization, hashed passwords, session controls, CSRF/origin checks, throttling, evidence hashes/lineage and HTTPS domains.

## Public asset dependency

Final Canva/brand asset pack should provide:

- horizontal logo
- reversed/white logo
- circular Eve emblem
- app mark
- favicon
- exact brand hex values
- exact approved fonts
- hero compositions/backgrounds without baked site text
- product UI mockups or synthetic screenshots
- desktop/mobile hero assets
- CTA/mountain image
- OG/social share direction and unique page images where practical

## Customer application

Do not redesign the entire existing interior unless usability testing shows a real need.

Preferred navigation:

- Dashboard
- Documents / Batches
- Processing
- Financial Statements
- Evidence
- Findings / Requests
- Reports
- Team
- Billing / Plan
- Account

Remove or hide from normal customer experience:

- development-access language
- raw Hermes/provider/model internals
- scheduler/worker details
- internal Academy controls
- debug IDs unless a Technical Trace is deliberately opened
- other tenants/global admin data

Preserve:

- statements
- evidence lineage
- findings
- report/download workflow
- processing status
- customer clarifications
- source-to-value trace

## Customer dashboard goals

Within seconds, a customer should understand:

- what Eve received
- what is still processing
- what completed
- what needs their attention
- latest supported financial information
- latest reports/deliverables
- open clarification requests
- plan/usage state where relevant

## Owner control center

Normal owner operation should not require logging into separate Hermes and raw infrastructure consoles.

Owner navigation should include:

- Overview
- Customers
- Processing / Queue
- Academy
- Agents
- Reports
- Usage / Billing
- Users / Access
- System
- Audit
- Advanced / Engineering Console

### Owner overview

Show at-a-glance:

- active customers
- active engagements
- intake batches processing
- artifacts/pages waiting
- jobs running/failed
- clarification requests
- reports awaiting review
- plan/subscription alerts
- Academy current state + last result
- agent health
- service health
- recent material alerts

### Academy view

Live read model should show:

- scheduler enabled/state
- next/last run
- current case
- current browser journey stage
- extraction stage
- specialist progress
- grading dimensions
- learning result
- recent failures/retries
- evidence/screenshots links

Do not create another scheduler merely to populate this screen.

### Agents view

Expose useful operating information rather than raw logs:

- agent/specialist name
- current/last state
- tenant/case where allowed
- execution ID
- model/provider where owner-only
- duration
- result/failure reason
- evidence/receipt link

### System view

Show health for Eve app, intake workers, Hermes, OpenClaw/local intelligence where used, persistence/storage, browser operator and Academy scheduler.

## Unified identity

Customer and owner application should share the same account/session architecture with role/tenant authorization determining destination and permissions.

Do not make raw Hermes Basic Auth equivalent to Eve account identity. It remains a separate advanced infrastructure credential until a supported secure integration replaces it.

## SEO and social launch requirements

Public pages:

- canonical URL
- unique title/description
- index/follow
- sitemap.xml
- robots.txt
- Open Graph metadata
- social image
- SoftwareApplication/Organization structured data only where accurate

Customer/owner/authenticated pages:

- noindex/nofollow

## Request Demo / lead capture

Public lead form should capture enough to route follow-up without requesting sensitive accounting documents:

- name
- business email
- company
- business vs CPA firm
- approximate company/firm size
- accounting need/workflow
- optional message

Add rate/spam protection and owner notification when a supported delivery channel is configured.
