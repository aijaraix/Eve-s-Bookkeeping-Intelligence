# Eve Bookkeeping Brand Asset Handoff Manifest

Last verified: 2026-09-15
Status: STRUCTURE READY / CANONICAL ASSET POPULATION IN PROGRESS

This document is the GitHub-side source of truth for the Canva production asset system that will feed the public website and unified Eve product experience.

## Canva source of truth

Canonical Canva folder:

`Eve's Bookkeeping — Brand System`

Verified production folders:

- `01 — BRAND MASTER`
- `02 — LOGOS`
- `03 — ICONS`
- `04 — HERO ASSETS`
- `05 — PRODUCT UI`
- `06 — DOCUMENT EXAMPLES`
- `07 — CTA MOUNTAINS`
- `08 — SOCIAL OG`
- `10 — CODEX HANDOFF`
- existing `Website` concept folder

Verified logo subfolders:

- `Primary`
- `Reversed`
- `Emblem`
- `App Mark`

At the time of verification, the production folder structure exists, but `01 — BRAND MASTER` and `10 — CODEX HANDOFF` contain no permanent design items yet. The brand master / implementation document exists as generated Canva candidate material and still requires a human-selected permanent design before it becomes canonical. Do not treat candidate generation alone as final asset completion.

## Locked brand tokens

Typography:

- Brand/editorial/display serif: `Playfair Display`
- UI/body/product sans serif: `Inter`

Color system:

- Deep Navy: `#0B2D4D`
- Primary Blue: `#2563EB`
- Teal: `#14B8A6`
- Slate: `#64748B`
- Border/Light Gray: `#E5E7EB`
- White: `#FFFFFF`

These values supersede earlier approximate palette descriptions for implementation unless a later owner-approved Brand Master explicitly changes them.

## Brand behavior

- Public site should feel premium, institutional, financial and modern rather than generic AI/crypto/neon SaaS.
- Playfair Display is used for high-impact brand/editorial headings; Inter is used for navigation, UI, body copy, forms, tables, controls and dense product surfaces.
- Deep Navy is the principal trust/authority color.
- Blue is the primary digital/action accent.
- Teal is a restrained supporting/status/intelligence accent.
- White/light space is the default reading and product surface.
- Avoid decorative gradients, glowing robot imagery, AI-brain clichés, excessive glassmorphism and unrelated stock-photo accounting imagery.

## Required production assets

### Logos

1. Horizontal full-color Eve Bookkeeping logo, SVG preferred.
2. Horizontal reversed/white logo for dark navy backgrounds.
3. Circular `E` emblem.
4. App mark.
5. Monochrome/one-color fallback where useful.
6. Safe-area / minimum-size guidance in Brand Master.

### Icons / application identity

1. Favicon set.
2. PWA/app icons.
3. Square app mark for product navigation/avatar contexts.
4. Social/profile-safe emblem crop.

### Hero assets

Separate desktop and mobile hero compositions are required.

Hero assets should not rely on baked website body copy. Engineering must be able to render accessible live HTML text on top/alongside assets.

Expected directions:

- source document / financial evidence
- Eve intelligence layer
- clean product/dashboard outcome
- premium financial/modern visual language

### Product UI

Create synthetic or sanitized product mockups for eight product-UI families. Public visuals must never expose Pfizer or real confidential customer data.

Recommended families:

1. Customer Dashboard
2. Document Intake / Processing
3. Financial Statements
4. Evidence / Provenance Drawer
5. Findings / Clarifications
6. Reports / Deliverables
7. Owner Customer Operations
8. Eve Quality Academy / Agent Operations

All mockups must use fictional/synthetic names, entities, values and documents.

### Document examples

Fictional evidence examples should include representative:

- bank statement
- receipt / phone photo
- invoice
- spreadsheet / schedule
- financial statement
- contract or contextual document where useful

These examples should support the website story of source → evidence → normalized fact → statement/report.

### CTA mountain imagery

Provide clean mountain CTA imagery without website copy baked into the image. Keep sufficient negative space for responsive live text/buttons.

### Social / OG

Provide eleven unique `1200×630` social/OG directions, mapped to the final public page set.

Minimum target page coverage:

1. Home
2. Product
3. How It Works
4. For Businesses
5. For CPA Firms
6. Evidence / Security
7. Eve Quality Academy
8. Pricing / Plans (only after pricing approval)
9. About
10. Request Demo / Contact
11. Generic fallback / brand share image

Each final public page must have its own relevant title, description and share image; do not use one generic OG image everywhere.

## Academy naming distinction

Do not conflate two different concepts:

- `Eve Quality Academy` = the autonomous product-quality/self-testing system that exercises the real Eve workflow with isolated synthetic cases.
- `Eve Learning Center` = any future customer education/course/tutorial experience.

If Academy appears on the launch website, it should describe the real Quality Academy unless a separate Learning Center has actually been built.

## Security and trust claims

Canva and website assets must not assert unverified certifications/capabilities such as:

- SOC 2 Type II
- HIPAA compliance
- GDPR certification/compliance as a blanket claim
- AWS hosting
- AES-256-at-rest guarantees
- TLS 1.3 everywhere
- penetration testing claims
- MFA availability unless the published experience is physically verified
- bank-grade / military-grade security phrasing

Only physically verified capabilities approved in the launch content-truth audit may be published.

## Implementation rules

- Canva is visual direction and asset source, not the website runtime.
- Do not publish Canva screenshots as entire webpages.
- Website copy remains live HTML for accessibility, SEO, responsive behavior and editing.
- Use real responsive layout components rather than fixed desktop screenshots.
- Preserve product/customer/owner domain architecture from `docs/launch/05_PUBLIC_CUSTOMER_OWNER_EXPERIENCE.md`.
- All authenticated owner/customer surfaces remain `noindex,nofollow`.
- Public product mockups must be synthetic/sanitized.
- Keep every image asset optimized for web delivery and responsive loading.
- Prefer SVG for marks/logos where appropriate, WebP/AVIF/optimized PNG/JPEG for raster imagery as supported by the implementation.

## Current completion state

### Complete

- canonical Canva Brand System exists
- production folder taxonomy exists
- logo production subfolders exist
- exact fonts locked
- exact hex values locked
- hero desktop/mobile requirement locked
- product UI families requirement locked
- fictional document/evidence requirement locked
- mountain CTA direction locked
- 11× 1200×630 OG direction requirement locked
- security-claim restrictions locked
- Academy naming distinction locked

### In progress / not yet canonical

- permanent Brand Master design selection
- permanent Codex/implementation handoff manifest inside Canva
- final exported logo files
- final icon/favicon/PWA files
- final hero assets
- final product UI mockups
- final document examples
- final mountain CTA assets
- final OG/social images

## Website implementation gate

`EVE-P6-001` should not be marked fully DONE until the actual canonical exported assets are present and reviewable. However, the website implementation may proceed structurally using the locked tokens and layout specification while final raster/vector assets are still being populated.

Current state:

`EVE-P6-001 = STRUCTURE_READY_ASSET_POPULATION_IN_PROGRESS`
`EVE-P6-003 = STRUCTURAL_IMPLEMENTATION_CAN_PROCEED`
