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

Repository-friendly web asset bundle:
`docs/website-launch/assets/eve-bookkeeping-web-assets.zip`

Expected bundle SHA-256:
`09338a05dffb782a2ecc73fc7b8bc0d8e92300766f3d37c714e3c6211f0b6b80`

The bundle contains:
- primary horizontal SVG + PNG logo;
- reversed horizontal SVG + PNG logo;
- primary/reversed circular E emblem;
- app mark;
- favicon SVG;
- PNG icon family;
- exact CSS/JSON design tokens;
- asset manifest + README.

The original large brand-board PNG is intentionally represented separately by the compressed visual reference below rather than duplicated inside the web bundle.

Canonical tokens:
- Midnight Navy `#0B2D4D`
- Eve Blue `#2563EB`
- Teal `#14B8A6`
- Slate `#64748B`
- Light Gray `#E5E7EB`
- White `#FFFFFF`
- Display: Playfair Display
- UI/body: Inter

## 3. Owner-supplied visual references saved for implementation

These are compressed visual references, not production page images. Production must be semantic/responsive HTML/CSS/components.

- `reference/home-concept.jpg`
  - SHA-256 `e1686f0f672f953b458b82d172b7770950499d5ed02e651df0aa99bf716ab763`
- `reference/product-concept.jpg`
  - SHA-256 `ab093a02befe42eaba13782af8391a9c0ff4ab45228fae3c396e1cd7783321be`
- `reference/for-businesses-concept.jpg`
  - SHA-256 `019722351ab80573ba0a6ad5ca257026536ff64119e3cc8747ca49bfa98b3fde`
- `reference/for-cpa-firms-concept.jpg`
  - SHA-256 `2aa9671c5e407380e67c05949083adaee3c425fb8b849ae72876175b2359fed0`
- `reference/pricing-concept.jpg`
  - SHA-256 `e4f1808c963fa3767e2a98703f6e80203ccc8bcb4041cbc6849c83320f4987c4`
- `reference/how-it-works-primary-concept.jpg`
  - SHA-256 `9ae0674c6bdba114a9fed7ad0860af0c1821473b5fa2d8f1929fefd2ee5be784`
- `reference/how-it-works-alt-mobile-concept.jpg`
  - SHA-256 `30c0821cde72f6ff592178755eed33e01a19358079c80a87f1c3334aef7a00d8`
- `reference/learning-academy-desktop-concept.jpg`
  - SHA-256 `13adf4d57e42c10d1ac2fa9d6d4467cd057945bfe00446744aae7c8a6157ba7c`
- `reference/learning-academy-mobile-concept.jpg`
  - SHA-256 `3a8604bbdb98c60c7c5b7f8094372c6260726632e851b852186730e7c3f395b8`
- `reference/brand-board-concept.jpg`
  - SHA-256 `e7a5c20a0455dde36a30340e850f19700559bac8b5a06b4009c014834ef7b8d8`

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
- the asset bundle hash matches;
- required reference images are present;
- shared tokens/logo assets are used consistently;
- all required repo-defined sections are implemented even if absent from Canva;
- desktop/mobile layouts are physically browser-tested;
- synthetic product screenshots are generated from the real candidate UI;
- unsupported claims are removed/replaced;
- missing decorative/OG assets are completed;
- no full-page concept board is used as a production page image.
