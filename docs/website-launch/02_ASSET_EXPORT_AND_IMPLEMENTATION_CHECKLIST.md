# Eve's Bookkeeping — Website Asset Export & Implementation Checklist

Purpose: convert the Canva concepts into build-ready assets so engineering does not have to redraw the brand.

## Canva inventory observed

The owner's connected Canva currently contains ten separate Eve's Bookkeeping custom designs matching the brand board and major public page concepts.

The uploaded concepts cover:
- Brand board
- Home / sales landing page
- Product page
- For Businesses
- For CPA Firms
- Pricing
- How It Works
- Security
- Customer learning/Academy concept
- Additional homepage/how-it-works variation

## Required brand exports

Export or recreate as proper web assets rather than screenshots where possible:

### Logos
- horizontal full-color logo, transparent SVG preferred
- horizontal reversed/white logo for navy backgrounds
- circular E mark, SVG
- app/icon mark, SVG + PNG
- favicon, SVG + 32x32/48x48 PNG or ICO as needed
- monochrome logo

### Color tokens
Lock CSS tokens to brand-board values:
- `--eve-navy: #0B2D4D`
- `--eve-blue: #2563EB`
- `--eve-teal: #14B8A6`
- `--eve-slate: #64748B`
- `--eve-gray: #E5E7EB`
- `--eve-white: #FFFFFF`

If the final Canva board adds cream/ivory or gold, record their exact hex values before implementation rather than sampling screenshots.

### Typography
- Brand/display serif: Playfair Display or final approved equivalent
- UI/body: Inter or final approved equivalent
- Define web-safe fallbacks
- Do not rely on Canva-only font rendering screenshots for live text

## Required public-site image assets

- homepage hero background / environment image
- product laptop/dashboard frame
- business-page hero lifestyle image
- CPA-firm hero/team image
- security hero image
- How It Works product visual
- final mountain CTA background
- synthetic document examples
- synthetic evidence/source example
- synthetic product screenshots

All product screenshots must use synthetic/demo data.

## Responsive asset requirements

For each major hero provide:
- desktop landscape crop
- tablet crop if necessary
- mobile portrait/vertical crop or alternate composition

Do not simply scale the desktop Canva board down on phones.

Text should remain live HTML wherever possible. Avoid baking headings, pricing, buttons, navigation, or legally meaningful claims into background images.

## Social/SEO assets

Create:
- root/home OG image 1200x630
- Product OG image
- Businesses OG image
- CPA Firms OG image
- Pricing OG image
- Security OG image
- How It Works OG image
- About/Contact generic brand OG image

Each public page should have:
- unique title
- unique meta description
- canonical URL
- Open Graph title/description/image
- Twitter card metadata
- appropriate structured data where accurate

Owner/app/customer portals must be `noindex,nofollow`.

## Build behavior

Engineering should reproduce Canva as a responsive web design, not place full-page Canva exports as giant images.

Use the Canva boards for:
- visual hierarchy
- spacing rhythm
- section composition
- image direction
- typography hierarchy
- color usage
- CTA placement

Use semantic HTML/CSS/components for:
- navigation
- headings/body copy
- pricing
- FAQ accordions
- buttons
- cards
- tables
- forms
- footer

## Interactive requirements

Minimum functional interactions:
- responsive header/mobile menu
- Login → `https://app.evesbookkeeping.com/login`
- Get Started / Request Demo → approved purchase/onboarding or lead path
- pricing CTA behavior based on approved commerce architecture
- FAQ accordions
- accessible focus/keyboard behavior
- contact/demo form with validation + rate/spam controls

Video/watch buttons must not be displayed unless a real video destination exists. Otherwise remove them until content is ready.

## Legal / footer requirements

Required launch links:
- Privacy
- Terms
- Accessibility
- Contact

Do not publish placeholder legal policies as if counsel-approved. Mark owner/legal review where appropriate.

## Performance/accessibility

Acceptance targets:
- responsive at 360/390px, tablet, desktop
- meaningful alt text
- heading hierarchy
- color contrast
- keyboard navigation
- reduced-motion consideration
- no layout shift from image sizing
- optimize/compress hero imagery
- lazy-load below-fold imagery
- avoid loading giant full-page Canva PNGs

## Launch asset completion gate

Before implementation is called "design complete," the following must exist:
1. approved logo assets
2. exact color tokens
3. exact font choices
4. approved page screenshots/boards
5. approved copy or OWNER-REVIEW markers
6. desktop + mobile hero strategy
7. synthetic product screenshots/demo data
8. approved pricing/offer values or pricing hidden
9. security claims cleared through the claims audit
10. real CTA destinations
