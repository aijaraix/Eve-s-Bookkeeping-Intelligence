# Eve's Bookkeeping — Visual Reference & Asset Manifest

Status: implementation-reference package. This document does not authorize production publish by itself.

## 1. Reference rule

The Canva boards and owner-supplied page screenshots are **visual framework references only**. They are known to omit content. They must never override the canonical page structure, claims audit, product truth, or responsive requirements in `docs/website-launch/`.

Precedence:
1. current verified product/runtime truth;
2. claims audit;
3. `04_PAGE_BY_PAGE_IMPLEMENTATION_STANDARD.md`;
4. website launch master/build-order docs;
5. canonical brand assets/tokens;
6. screenshots + Canva boards for visual composition only.

## 2. Canonical brand starter pack

Owner-supplied original ZIP SHA-256:
`9108adfee017f2b4eea73b9db9d7f83ecaa7cd3f6acc675ce9175a67a7a55ff0`

The build-ready text/vector assets from that pack are now checked into:

`public/brand/`

Included in-repo implementation assets:
- `public/brand/eve-logo-primary.svg`
- `public/brand/eve-logo-reversed.svg`
- `public/brand/eve-emblem-primary.svg`
- `public/brand/eve-emblem-reversed.svg`
- `public/brand/eve-app-mark.svg`
- `public/brand/favicon.svg`
- `public/brand/eve-brand-tokens.css`
- `public/brand/brand-tokens.json`
- `public/brand/ASSET_MANIFEST.json`
- `public/brand/README.md`

The owner's original ZIP also contains PNG icon/logo variants and the large raster brand-board reference. Attach that ZIP to the Work/Codex session when possible if those binary variants are useful.

Canonical tokens:
- Midnight Navy `#0B2D4D`
- Eve Blue `#2563EB`
- Teal `#14B8A6`
- Slate `#64748B`
- Light Gray `#E5E7EB`
- White `#FFFFFF`
- Display: Playfair Display
- UI/body: Inter

## 3. Owner-supplied visual reference labels

The owner supplied page images corresponding to these labels during this preparation:

- `home-concept`
- `product-concept`
- `for-businesses-concept`
- `for-cpa-firms-concept`
- `pricing-concept`
- `how-it-works-primary-concept`
- `how-it-works-alt-mobile-concept`
- `learning-academy-desktop-concept`
- `learning-academy-mobile-concept`
- `brand-board-concept`

These images are not required for semantic/content completeness because the repo contains the canonical page specification. For maximum visual fidelity, attach the original screenshots to the Work/Codex run or inspect the connected Canva originals.

See `docs/website-launch/reference/README.md` for the usage rule.

The two phone screenshots are **visual context only**, not canonical mobile layouts. Engineering must implement purpose-built responsive layouts at 360/390px.

## 4. Connected Canva original design set

The owner still has ten Eve's Bookkeeping custom designs connected in Canva. Design IDs observed during preparation:

- `DAHVTjxHRmA`
- `DAHVTqyVUQs`
- `DAHVTihHAr0`
- `DAHVTRavlWQ`
- `DAHVTq8SPdU`
- `DAHVTiXAhfc`
- `DAHVTkfHaEQ`
- `DAHVTZ4pNts`
- `DAHVTkTcw0c`
- `DAHVTgubRxg`

Use them only to inspect visual hierarchy, composition, imagery direction, spacing, and styling. Do not assume their text/content layer is complete; some designs are effectively flattened/incomplete and prior generation attempts dropped content.

## 5. Still missing for a complete production website pack

The owner-supplied starter pack does NOT yet include these production-ready web assets:

- text-free desktop/mobile homepage hero photography;
- text-free desktop/mobile business hero photography;
- text-free desktop/mobile CPA-firm hero photography;
- text-free security hero imagery;
- standalone synthetic product dashboard screenshots captured from the real accepted app;
- standalone synthetic documents/evidence/review/report screenshots;
- clean mountain CTA desktop/mobile imagery;
- page-specific 1200x630 OG/social images.

These should be produced/captured as part of the public-site implementation pass. Do not bake page copy or legal/commercial claims into decorative imagery.

## 6. Product screenshot requirement

Final marketing screenshots should come from a sanitized synthetic/demo Eve workspace after the integrated candidate is running. They should reflect the real UI and real supported workflow, not a fictional dashboard that diverges from the product.

At minimum capture:
- financial overview;
- documents list;
- evidence/provenance drawer;
- exception/review state;
- report/deliverable library;
- source-to-number trace.

No Pfizer or other real-customer data.

## 7. Engineering acceptance

Do not call design implementation complete until:
- shared tokens/logo assets are used consistently;
- all required repo-defined sections are implemented even if absent from Canva;
- desktop/mobile layouts are physically browser-tested;
- synthetic product screenshots are generated from the real candidate UI;
- unsupported claims are removed/replaced;
- missing decorative/OG assets are completed;
- no full-page concept board is used as a production page image.
