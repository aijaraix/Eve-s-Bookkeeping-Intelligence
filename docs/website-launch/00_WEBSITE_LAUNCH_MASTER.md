# Eve's Bookkeeping — Public Website Launch Master

Status: design/source-of-truth preparation only. This document does not authorize production deployment by itself.

## Source of truth

Visual direction comes from the Eve's Bookkeeping Canva brand board and page concepts supplied by the owner in September 2026. Current public code is only a minimal foundation and is not the final design.

Brand direction:
- Primary brand: Eve's Bookkeeping / Bookkeeping Intelligence
- Emotional tagline: **Clear Numbers. Brighter Tomorrows.**
- Visual tone: premium financial, calm, trustworthy, modern, evidence-led
- Headings: Playfair Display-style serif
- Body/UI: Inter-style sans serif
- Core palette from brand board: Midnight Navy #0B2D4D, Eve Blue #2563EB, Teal #14B8A6, Slate #64748B, Light Gray #E5E7EB, White #FFFFFF
- Use the circular E mark and horizontal Eve's Bookkeeping wordmark consistently
- Avoid neon AI aesthetics, robot imagery, crypto styling, heavy glassmorphism, and generic stock-accountant clichés

## Canonical domain model

- `https://evesbookkeeping.com` — public marketing website
- `https://www.evesbookkeeping.com` — redirect to root canonical domain
- `https://app.evesbookkeeping.com` — customer login and customer SaaS
- `https://owner.evesbookkeeping.com` — owner/operator control center

Public marketing must never expose customer, Academy, infrastructure, or internal model data.

## Launch information architecture

Primary navigation:
1. Product
2. For Businesses
3. For CPA Firms
4. Pricing
5. How It Works
6. Security
7. About
8. Login
9. Get Started / Request Demo

Customer education should be labelled **Learning Center** or **Learn Eve** unless/until the owner explicitly chooses to use the public name "Academy." The internal Eve Academy currently means the autonomous product-testing/learning system, so public training content must not blur that distinction.

## Approved public page set for launch

### 1. Home
Purpose: explain the value in under 20 seconds and drive demo/start conversion.

Recommended hero direction:
**Your books deserve more than automation. They deserve intelligence.**

Supporting message:
Eve combines AI-assisted bookkeeping, evidence-backed workflows, and clear review controls so businesses and accounting professionals can understand what happened, what needs attention, and where every supported number came from.

Core homepage sections:
- Hero + product dashboard visual
- Trust/value strip
- Old way vs. Eve
- One Eve / specialist intelligence behind the scenes
- Evidence behind every supported number
- How it works
- Product preview
- Business + CPA firm pathways
- Security/trust summary
- Final CTA

### 2. Product
Use the concept: **From documents to financial intelligence.**

Show:
- Documents
- Transactions/workflows only where actually supported
- Evidence
- Review
- Reports
- Source-to-number traceability
- Human review boundary

### 3. For Businesses
Use the concept: **Spend less time on bookkeeping. Spend more time on what matters.**

Show:
- Document organization
- Visibility into processing and exceptions
- Financial statements/reports
- Evidence access
- Team/customer portal
- Clear status and review workflow

Do not publish invented customer testimonials.

### 4. For CPA Firms
Use the concept: **Give your professionals better-prepared work. Do more for your clients.**

Show:
- Evidence-backed workpapers
- Multi-client organization
- Exceptions/findings
- Reviewable drafts
- Specialist receipts / evidence where appropriate
- Explicit human professional approval boundary

Do not publish invented time-savings percentages, client quotes, firm names, or professional endorsements.

### 5. Pricing
Design direction from Canva is approved as a visual concept only.

Pricing amounts, transaction caps, seat counts, bank-account limits, onboarding fees, historical-cleanup terms, discounts, and founding-customer offers are **OWNER-REVIEW commercial fields** until explicitly approved.

The engineering implementation should read plan definitions from versioned plan/entitlement data rather than hardcoding pricing throughout the UI.

### 6. How It Works
Use the six-step visual structure:
1. Connect / Bring your data
2. Understand
3. Organize
4. Verify
5. Review
6. Report

For launch, "Connect" must describe capabilities that actually exist. Document upload is supported. Live bank feeds, Google Drive/Dropbox ingestion, forwarded-email ingestion, and other integrations must not be represented as live unless physically verified.

### 7. Security
Keep the visual design, but only publish verified controls.

Approved factual categories based on current implementation:
- tenant-scoped access controls
- server-side authorization boundaries
- secure session cookies
- CSRF protections
- password hashing
- login throttling
- audit/account events
- source hashes / evidence lineage
- HTTPS on provisioned public/app/owner domains
- professional approval separated from ordinary account authentication

Do not publish certifications or encryption claims unless separately verified and documented.

### 8. Learning / Quality
Separate two concepts:
- **Customer Learning Center** — tutorials, onboarding, documentation, guides. This may be built later.
- **Eve Quality Academy** — Eve's internal isolated synthetic browser-testing and learning system. This is a real current differentiator and may be explained on the marketing site as a quality process.

Suggested public message for Quality Academy:
"Eve continuously exercises the real product with isolated synthetic accounting cases, including desktop and mobile browser journeys, to identify workflow and presentation failures before they affect customer work."

Do not imply that private customer data is used for training unless specifically implemented and authorized.

## Primary CTA model

Public CTA hierarchy:
- Primary: **Get Started** or **Request a Demo**
- Secondary: **See How It Works**
- Tertiary: **Login**

The final choice between direct self-serve checkout and sales-assisted onboarding should be determined by the customer-commerce plan before launch.

## Product UI visuals

Use sanitized/synthetic data only.
Never use Pfizer/customer data in public screenshots.

Preferred public screenshots/mockups:
- financial overview dashboard
- documents list
- evidence/provenance drawer
- exception/review queue
- report library
- source → fact → statement trace

## Launch principle

The public website must communicate three things clearly:
1. what Eve does,
2. why Eve is different,
3. what a prospect should do next.

The site should not make claims simply because they appeared in a concept mockup.