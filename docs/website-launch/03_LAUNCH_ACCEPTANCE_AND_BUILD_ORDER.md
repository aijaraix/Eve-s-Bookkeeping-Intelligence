# Eve's Bookkeeping — Launch Acceptance & Build Order

## Goal

Replace the minimal current public site with the approved Canva-based responsive marketing site without disturbing customer authentication, owner access, Academy, accounting data, or custom-domain routing.

## Recommended build order

### Phase 1 — Design tokens and shared shell
1. Logo assets
2. Typography
3. Color tokens
4. Header/navigation
5. Footer
6. Shared CTA component
7. Responsive breakpoints

### Phase 2 — Conversion-critical pages
1. Home
2. Product
3. For Businesses
4. For CPA Firms
5. How It Works
6. Security

### Phase 3 — Commercial flow
1. Pricing after owner approval of actual plans/offer
2. Get Started flow connected to customer-commerce architecture
3. Request Demo/contact form
4. Customer login routing

### Phase 4 — Supporting content
1. About
2. Learning Center if content exists
3. Eve Quality Academy explainer
4. FAQ
5. Legal/footer pages

## Do not block initial launch on
- a full course/certification platform
- public display of raw Hermes infrastructure
- exhaustive integrations that are not yet live
- complex animations
- nonessential marketing automation

## Functional launch gates

### Public site
- root domain displays final branded Home page
- www redirects to root
- navigation works
- all public pages responsive
- no development wording
- no private/customer information
- CTA routes work
- no dead "watch video" controls
- no invented testimonials
- no unsupported security/compliance badges

### Login/customer boundary
- Login routes to app.evesbookkeeping.com
- public site cannot access tenant data
- app/owner routes remain noindex
- customer account/session behavior unchanged

### Commerce boundary
If pricing is shown:
- exact plan version is defined in customer-commerce architecture
- checkout/product mapping is explicit
- successful payment alone is not inferred from a return URL
- verified provider webhook controls activation
- owner can see customer purchase/subscription and usage

If commerce is not yet wired, CTA should use Request Demo / Get Started lead capture rather than a fake checkout.

### Security/content
- run the content-truth audit before production publish
- remove SOC 2/HIPAA/GDPR/AWS/AES/TLS-version claims unless verified
- remove fake testimonials and performance percentages
- customer education and internal Quality Academy are clearly distinguished

### SEO/social
- sitemap.xml
- robots.txt
- canonical URLs
- page titles/descriptions
- OG metadata/images
- schema only where accurate
- 404 behavior

### Quality
Physically test:
- Chrome desktop
- phone viewport 390x844
- at least one additional small phone width ~360px
- navigation/menu
- forms
- CTA destinations
- login handoff
- accessibility keyboard flow
- Lighthouse/Core Web Vitals-oriented performance review

## Regression gates

Do not call website launch ready until verifying:
- owner login still works
- customer login still works
- tenant isolation remains enforced
- existing accounting workspace renders
- accepted Academy scheduler/browser architecture is not changed
- Pfizer authoritative state is not reprocessed or mutated

## Future implementation instruction

An engineering agent should not redesign the website. It should:
1. read all files in `docs/website-launch/` in order,
2. read `docs/customer-platform/` before wiring pricing/checkout,
3. use the owner's approved Canva boards as visual references,
4. implement responsive components and real routes,
5. replace concept-only claims with the approved truth set,
6. physically verify public/app/owner domains.

The build should be mostly mechanical. Product/marketing strategy changes require owner review rather than engineering invention.
