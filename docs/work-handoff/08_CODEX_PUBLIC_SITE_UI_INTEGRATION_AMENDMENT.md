# EVE BOOKKEEPING — CODEX PUBLIC SITE + UI INTEGRATION AMENDMENT

**Status:** OWNER-AUTHORIZED AMENDMENT TO FINAL INTEGRATED RUNTIME PASS

**Repository:** `aijaraix/Eve-s-Bookkeeping-Intelligence`

**Canonical working branch:** `feature/universal-evidence-ocr-foundation`

**Draft PR:** #31 — remain draft/unmerged unless the owner later gives separate release authorization.

This document amends and supplements:

`docs/work-handoff/06_CODEX_FINAL_INTEGRATED_RUNTIME_AND_MULTI_COMPANY_AUDIT_REHEARSAL.md`

Where this document conflicts with earlier wording such as "do not redesign the frontend," this document controls for the **public marketing website and approved UI/UX implementation scope described below**.

All prior accounting truth, evidence-lineage, tenant-isolation, scheduler, release, and production-safety boundaries remain in force.

---

## 1. OWNER UPDATE

The final Codex/Work pass must now include the approved Eve's Bookkeeping public-site/UI implementation before final multi-company rehearsal signoff.

The reason is deliberate: we do not want to certify the backend/runtime through an old or temporary presentation layer and then replace the frontend afterward. The final integrated rehearsal should exercise the candidate that users will actually see.

The correct sequence is:

1. establish current source/runtime/service truth;
2. repair and physically verify the integrated feature/staging/acceptance runtime;
3. create a clean synthetic/demo Eve workspace using the real candidate;
4. capture real product UI screenshots from that candidate;
5. implement the approved responsive public marketing site using the canonical repo specification and brand system;
6. physically verify the public/customer/owner frontend boundaries on desktop and mobile;
7. run the multi-company audit/bookkeeping rehearsal matrix through the actual candidate application UI and supported intake paths;
8. finish at the owner release-decision gate — do not merge PR #31 or cut over production main without separate explicit owner authorization.

---

## 2. CRITICAL SOURCE-OF-TRUTH RULE FOR DESIGN

The connected Canva boards and owner-supplied page screenshots are **visual references only**.

They are known to be incomplete. Prior Canva generation attempts dropped sections and content.

Therefore:

**DO NOT use Canva or the screenshots as the authoritative content/page-structure source.**

Use this precedence:

1. current physically verified product/runtime truth;
2. `docs/website-launch/01_CONTENT_TRUTH_AND_CLAIMS_AUDIT.md`;
3. `docs/website-launch/04_PAGE_BY_PAGE_IMPLEMENTATION_STANDARD.md`;
4. `docs/website-launch/00_WEBSITE_LAUNCH_MASTER.md`;
5. `docs/website-launch/03_LAUNCH_ACCEPTANCE_AND_BUILD_ORDER.md`;
6. `docs/website-launch/02_ASSET_EXPORT_AND_IMPLEMENTATION_CHECKLIST.md`;
7. `docs/website-launch/05_VISUAL_REFERENCE_AND_ASSET_MANIFEST.md`;
8. canonical brand assets/tokens under `public/brand/`;
9. owner-supplied screenshots and connected Canva originals for composition, spacing, visual hierarchy, image direction, and styling only.

**A section missing from Canva is not permission to omit it.**

Do not infer page completeness from any single design board.

---

## 3. MANDATORY WEBSITE READING

Before implementing public-site code, read every file under:

`docs/website-launch/`

in numeric order.

At minimum, these currently define the implementation:

- `00_WEBSITE_LAUNCH_MASTER.md`
- `01_CONTENT_TRUTH_AND_CLAIMS_AUDIT.md`
- `02_ASSET_EXPORT_AND_IMPLEMENTATION_CHECKLIST.md`
- `03_LAUNCH_ACCEPTANCE_AND_BUILD_ORDER.md`
- `04_PAGE_BY_PAGE_IMPLEMENTATION_STANDARD.md`
- `05_VISUAL_REFERENCE_AND_ASSET_MANIFEST.md`
- `reference/README.md`

Do not recreate marketing/content strategy from scratch. The repo is now the canonical implementation brief.

---

## 4. CANONICAL BRAND SYSTEM ALREADY IN REPO

Use the checked-in production-friendly brand assets under:

`public/brand/`

Including:

- `eve-logo-primary.svg`
- `eve-logo-reversed.svg`
- `eve-emblem-primary.svg`
- `eve-emblem-reversed.svg`
- `eve-app-mark.svg`
- `favicon.svg`
- `eve-brand-tokens.css`
- `brand-tokens.json`
- `ASSET_MANIFEST.json`
- `README.md`

Core visual tokens:

- Midnight Navy `#0B2D4D`
- Eve Blue `#2563EB`
- Teal `#14B8A6`
- Slate `#64748B`
- Light Gray `#E5E7EB`
- White `#FFFFFF`
- Display/headings: Playfair Display
- UI/body/navigation: Inter

Visual direction:

- premium financial;
- calm and trustworthy;
- modern and evidence-led;
- mostly light/white surfaces with restrained navy bands;
- blue/teal accents;
- no neon AI look;
- no crypto aesthetic;
- no robot imagery;
- no gratuitous glassmorphism.

---

## 5. OWNER-SUPPLIED VISUAL REFERENCES

The owner may attach the original page screenshots and/or brand ZIP to the Work/Codex session.

Use them for fidelity only:

- Home
- Product
- For Businesses
- For CPA Firms
- Pricing
- How It Works
- Learning/Academy visual concept
- brand board
- mobile context screenshots

The connected Canva originals also remain available, but they are incomplete and must not override repo structure/content.

The repo records the observed Canva design IDs in `05_VISUAL_REFERENCE_AND_ASSET_MANIFEST.md`.

Do not spend significant Codex credits trying to reconstruct missing page content from flattened Canva layers. The repo already defines the required content and section order.

---

## 6. PUBLIC SITE VS. APPLICATION UI — KEEP THE BOUNDARY CLEAR

These are different surfaces.

### Public marketing website

Canonical intent:

- `https://evesbookkeeping.com`
- `https://www.evesbookkeeping.com` -> canonical root redirect

Public site is marketing/product education only and must not expose tenant/customer/internal runtime data.

### Customer SaaS

Canonical intent:

- `https://app.evesbookkeeping.com`

This is the real authenticated Eve application used for customer work, uploads, processing, evidence, review, reports, and provenance.

### Owner/operator surface

Canonical intent:

- `https://owner.evesbookkeeping.com`

Keep private/operator functionality separate and `noindex,nofollow`.

Do not collapse these surfaces into one insecure route tree merely for implementation convenience.

---

## 7. PUBLIC SITE BUILD SCOPE

Implement the responsive site mechanically from the repo specification.

Required launch pages/surfaces include:

- Home
- Product
- For Businesses
- For CPA Firms
- Pricing only with approved/verified commercial data; otherwise use owner-review or lead/demo treatment
- How It Works
- Security
- About
- Contact / Request Demo
- Learning/Quality treatment consistent with current product truth
- Privacy / Terms / Accessibility links/owner-review handling
- real 404 behavior

Use shared components for:

- responsive header/mobile navigation;
- footer;
- CTAs;
- cards;
- FAQ accordions;
- pricing presentation;
- forms;
- product screenshot frames;
- responsive section primitives.

Do not implement the pages as giant raster screenshots.

Text, pricing, navigation, buttons, forms, FAQs, legal/commercial claims, and meaningful product copy must remain semantic live HTML/CSS/components.

---

## 8. CONTENT-TRUTH REQUIREMENTS

The concept boards contain placeholder/invented claims that must not be blindly published.

Follow `01_CONTENT_TRUTH_AND_CLAIMS_AUDIT.md`.

In particular, do not publish unverified:

- fake testimonials or star ratings;
- invented client/firm names;
- unmeasured savings percentages;
- unsupported accuracy claims;
- unsupported "trusted by" counts;
- SOC 2/HIPAA/GDPR/PCI/AWS badges or categorical claims;
- encryption/TLS specifics that have not been physically established;
- bank-feed, payment-platform, forwarded-email, Google Drive/Dropbox or other integrations unless physically verified in the candidate;
- professional-signoff claims beyond the actual human-approval boundary.

Commercial/pricing values shown in design concepts remain owner-review unless the current approved commerce data establishes them.

If a capability is not physically live, use bounded truthful language or omit it.

---

## 9. PRODUCT SCREENSHOTS MUST COME FROM THE REAL CANDIDATE

Do not simply reuse fictional dashboard screenshots from the design boards as final production product proof.

After the integrated acceptance candidate is running, create/use a sanitized synthetic/demo workspace and capture the **real built Eve UI**.

At minimum produce/capture marketing-ready synthetic views for:

- financial overview/dashboard;
- documents list;
- evidence/provenance drawer;
- exception/review state;
- reports/deliverables library;
- source -> fact -> statement trace.

Requirements:

- synthetic/demo customer names and amounts only;
- no Pfizer / Company 1 / real customer data;
- no secrets, workspace IDs, API keys, private filenames, or internal infrastructure screens;
- screenshots must reflect actual supported product behavior;
- crop/frame cleanly for public use.

These real candidate captures become the public site's product imagery and a visual truth check against the marketing promises.

---

## 10. REMAINING VISUAL ASSETS TO PRODUCE DURING IMPLEMENTATION

The existing brand pack is a strong production starter pack but does not include every marketing image.

Create or source only what is necessary for the implemented site, including:

- text-free Home hero imagery with desktop/mobile composition;
- text-free Businesses hero imagery with desktop/mobile composition;
- text-free CPA Firms hero imagery with desktop/mobile composition;
- text-free Security hero imagery if needed;
- mountain CTA imagery with desktop/mobile composition;
- page-specific OG/social images, target 1200x630;
- synthetic document/evidence examples where real sanitized candidate captures are not appropriate.

Do not bake headings, prices, legal text, CTAs, or material product claims into decorative images.

Optimize web images and avoid giant full-page Canva exports.

---

## 11. RESPONSIVE / UX ACCEPTANCE

Physically test the implemented public site and the critical authenticated application flows.

Public site minimum:

- desktop Chrome;
- tablet sanity check;
- 390x844 mobile;
- approximately 360px small-phone width;
- responsive navigation/menu;
- CTA destinations;
- Request Demo/contact form behavior if implemented;
- FAQ interactions;
- keyboard/focus flow;
- heading hierarchy;
- meaningful alt text;
- contrast;
- reduced-motion consideration;
- no material layout shift from image sizing;
- no overflow/cutoff/desktop-only scaling on mobile;
- console/network error review.

The phone screenshots supplied by the owner are context only. Do not simply shrink the desktop design into a long unreadable image.

Authenticated app minimum:

- customer login still works;
- owner login still works;
- tenant isolation remains enforced;
- upload/intake works;
- queue/progress state is understandable;
- evidence/review/provenance paths remain usable;
- report retrieval works;
- source-to-pixel click-through remains intact;
- UI remains operational after the public-site changes.

---

## 12. SEO / PUBLIC-SITE PRODUCTION HYGIENE

For public pages, implement/verify as applicable:

- canonical URLs;
- unique titles;
- unique meta descriptions;
- Open Graph metadata and page-specific images;
- Twitter/X card metadata;
- sitemap.xml;
- robots.txt;
- correct public/private indexing boundary;
- structured data only where factually accurate;
- 404 behavior;
- root/www canonical redirect behavior where the current hosting stack supports it.

Authenticated customer/owner surfaces must remain private/noindex.

---

## 13. IMPLEMENTATION ORDER INSIDE THE FINAL CODEX PASS

### Stage A — Runtime reconciliation first

Before broad public UI implementation:

- fetch current remote state;
- read work handoffs;
- establish physical runtime truth;
- verify API/backend/database/storage/queue/workers/Hermes/OpenClaw/Ollama/cloud-model/OCR service identities;
- repair demonstrated stale service/build mismatches;
- produce a safe feature/staging/acceptance candidate.

Do not spend the first part of the pass decorating a runtime that is physically broken.

### Stage B — Real synthetic product truth

- create/use a synthetic demo workspace;
- drive real supported intake;
- ensure the candidate shows real dashboard/documents/evidence/review/report states;
- capture sanitized product screenshots from the actual candidate.

### Stage C — Public website implementation

- read `docs/website-launch/`;
- use `public/brand/`;
- implement responsive public pages from the repo-defined structure;
- use screenshots/Canva only for visual fidelity;
- create remaining decorative/OG assets as needed;
- physically browser-test desktop/mobile;
- verify Login/CTA/public-private boundaries.

### Stage D — Multi-company technical rehearsals

Run the matrix from document 06 through the actual candidate application and supported frontend/intake paths.

The public marketing site does not itself need to process accounting work, but its Login/Get Started/Request Demo routing must lead into the intended real customer journey.

### Stage E — Recovery + release decision

- bounded restart/retry/idempotency/recovery tests;
- verify persistence and UI recovery;
- verify final source-to-report lineage;
- write durable acceptance evidence;
- stop at owner release decision.

---

## 14. FRONTEND CHANGE BOUNDARY

This amendment **does authorize** implementation of the approved public marketing site and associated responsive shared UI shell.

It also authorizes bounded UI polish/repair in the authenticated Eve application when required to:

- make real supported workflows understandable and usable;
- support synthetic public product screenshots;
- expose already-accepted evidence/review/provenance/report behavior correctly;
- fix responsive/accessibility defects encountered during physical acceptance.

It does **not** authorize replacing working accounting application architecture, state models, APIs, evidence contracts, queues, workers, or tenancy for cosmetic convenience.

Do not turn this into a wholesale authenticated-app rewrite.

---

## 15. REQUIRED FINAL REPORT ADDITIONS

In addition to the final-report requirements in document 06, include:

- public-site source/build identity;
- pages physically implemented;
- brand assets/tokens actually used;
- visual references consulted;
- synthetic candidate screenshots captured;
- missing/generated visual assets;
- desktop/mobile browser acceptance results;
- public/app/owner routing and indexing boundaries;
- content/claims removed or bounded because they were unsupported;
- pricing/commercial fields still awaiting owner approval, if any;
- CTA/login/demo behavior;
- SEO/social implementation state;
- anything from the approved page specification that was not physically implemented.

Do not call the integrated candidate ready if the runtime passes but the intended public/customer presentation is materially broken or incomplete.

---

## 16. RELEASE BOUNDARY REMAINS UNCHANGED

This amendment does not authorize merge/release.

Final status must still be exactly one of:

`EVE_INTEGRATED_CANDIDATE_READY_FOR_OWNER_RELEASE_DECISION`

or

`EVE_INTEGRATED_CANDIDATE_NOT_READY`

Do not merge PR #31 into `main` and do not replace the protected production-main deployment without a separate explicit owner release instruction.

---

## 17. OPERATING PRINCIPLE

The target is not merely a beautiful landing page and not merely a green backend.

The target is one coherent Eve candidate where:

- the runtime is real;
- the accounting work is real and traceable;
- the frontend exposes that truth correctly;
- the public site accurately represents what the product can actually do;
- the visual brand is consistent and professional;
- realistic multi-company rehearsals pass;
- failures remain observable and fail closed;
- and the entire system is ready for an owner release decision.