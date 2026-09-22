export const escape = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0B2D4D"/><path d="M19 17h28v7H27v5h17v7H27v5h20v7H19z" fill="#fff"/><circle cx="47" cy="17" r="5" fill="#14B8A6"/></svg>`;
const nav = [
  ["/product", "Product"],
  ["/businesses", "For Businesses"],
  ["/cpa-firms", "For CPA Firms"],
  ["/pricing", "Pricing"],
  ["/how-it-works", "How It Works"],
  ["/security", "Security"],
  ["/about", "About"],
];
const info: Record<string, [string, string, string]> = {
  home: [
    "Intelligent, evidence-backed bookkeeping",
    "Turn financial documents into organized, traceable bookkeeping intelligence.",
    "Eve brings source documents, accounting evidence, review, and reporting into one clear workspace—so you spend less time chasing the work and more time using it.",
  ],
  product: [
    "Product",
    "From documents to financial intelligence.",
    "See how Eve turns uploaded source documents into organized evidence, reviewable accounting work, and traceable draft reports.",
  ],
  businesses: [
    "For Businesses",
    "Spend less time on bookkeeping. Spend more time on what matters.",
    "Organize documents, follow processing, inspect evidence, resolve exceptions, and understand financial work in one place.",
  ],
  "cpa-firms": [
    "For CPA Firms",
    "Give your professionals better-prepared work. Do more for your clients.",
    "Prepare multi-client accounting work with organized evidence, visible exceptions, and explicit professional approval boundaries.",
  ],
  pricing: [
    "Pricing",
    "Start with launch pricing and put your books on a clearer path.",
    "Join Eve's launch program for $125 per month—normally $300—and get an evidence-led workspace built for organized, reviewable bookkeeping.",
  ],
  "how-it-works": [
    "How It Works",
    "A complete workflow from start to finish.",
    "Follow supported source documents through understanding, organization, verification, review, and reporting.",
  ],
  security: [
    "Security",
    "Access controls and evidence belong in the product.",
    "Learn about Eve’s verified access boundaries, tenant isolation, secure sessions, audit events, and evidence lineage.",
  ],
  quality: [
    "Eve Quality Academy",
    "Quality tested through real product journeys.",
    "Isolated synthetic cases exercise Eve’s real product experience without using customer data for training.",
  ],
  about: [
    "About Eve",
    "Clear Numbers. Brighter Tomorrows.",
    "Eve is evidence-led bookkeeping intelligence built to support useful work and responsible human judgment.",
  ],
  contact: [
    "Get Started",
    "Start building a clearer bookkeeping workflow.",
    "Tell us about your business or accounting firm and claim Eve's $125 per month launch offer.",
  ],
  privacy: [
    "Privacy",
    "Privacy information",
    "A bounded pre-launch privacy notice for Eve Bookkeeping.",
  ],
  terms: [
    "Terms",
    "Terms of use",
    "A bounded pre-launch terms notice for Eve Bookkeeping.",
  ],
  accessibility: [
    "Accessibility",
    "Accessibility statement",
    "How Eve Bookkeeping approaches accessible public and product experiences.",
  ],
};
const icon = (x: string) =>
  (
    ({
      doc: "▤",
      trace: "⌁",
      review: "✓",
      report: "▥",
      shield: "◇",
      people: "◎",
    }) as any
  )[x] || "•";
const card = (t: string, b: string, k = "trace") =>
  `<article class="card"><span class="icon" aria-hidden="true">${icon(k)}</span><h3>${t}</h3><p>${b}</p></article>`;
const cards = (xs: string[][]) =>
  `<div class="cards">${xs.map((x) => card(x[0], x[1], x[2])).join("")}</div>`;
const steps = (xs: string[][]) =>
  `<ol class="steps">${xs.map((x, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span><div><h3>${x[0]}</h3><p>${x[1]}</p></div></li>`).join("")}</ol>`;
const faq = (xs: string[][]) =>
  `<div class="faq">${xs.map((x) => `<details><summary>${x[0]}<span aria-hidden="true">+</span></summary><p>${x[1]}</p></details>`).join("")}</div>`;
const section = (e: string, t: string, p: string, c: string, k = "") =>
  `<section class="section ${k}"><div class="section-head"><p class="eyebrow">${e}</p><h2>${t}</h2><p>${p}</p></div>${c}</section>`;
const conversionCss = `<style>
body{overflow-x:hidden}.site-header{background:rgba(255,255,255,.97);backdrop-filter:blur(12px)}
.button{align-items:center;border-radius:10px;box-shadow:0 9px 24px rgba(37,99,235,.2);transition:transform .2s ease,box-shadow .2s ease}.button:hover{transform:translateY(-2px);box-shadow:0 13px 30px rgba(37,99,235,.27)}.text-link.light{color:#fff}
.hero{padding-top:54px;padding-bottom:62px;gap:56px;min-height:550px}.hero-copy{position:relative;z-index:2}.hero .lead{font-size:18px;line-height:1.62}.offer-line{display:inline-flex;gap:7px;align-items:center;margin:8px 0 0;padding:8px 11px;border-radius:999px;background:#e8f8f5;color:#126b68;font-size:13px}.offer-line s{color:#73899b}.hero-actions{margin-top:24px}
.story-visual{position:relative;padding:0 0 55px 36px}.story-visual .hero-photo{transform:translateZ(0);animation:visual-drift 9s ease-in-out infinite alternate}.story-product{position:absolute;left:0;right:23%;bottom:0;margin:0;border:1px solid #dbe5ed;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 22px 55px rgba(11,45,77,.25);animation:panel-rise .65s ease-out both}.story-product img{display:block;width:100%;height:auto}.story-product figcaption{padding:7px 10px}.story-chip{position:absolute;right:10px;bottom:34px;background:var(--navy);color:#fff;padding:10px 13px;border-radius:999px;font-size:11px;font-weight:800;box-shadow:0 10px 25px rgba(11,45,77,.25)}
.offer-band{display:flex;align-items:center;justify-content:space-between;gap:28px;padding:28px;border:1px solid #cfe8e3;border-radius:18px;background:#fff}.offer-band div{display:flex;flex-direction:column;gap:8px}.offer-band b{font:700 27px var(--serif);color:var(--navy)}.offer-band span{color:#587086;line-height:1.6}
.pricing-visual{position:relative}.pricing-visual .product{transform:rotate(1deg)}.deal-badge{display:inline-flex;width:max-content;background:var(--teal);color:#062f36;padding:9px 13px;border-radius:999px;font-size:12px;font-weight:850;letter-spacing:.04em}.pricing-visual>.deal-badge{position:absolute;z-index:2;right:-10px;top:-18px;box-shadow:0 12px 25px rgba(6,47,54,.2)}
.launch-plan{display:grid;grid-template-columns:.8fr 1.2fr;gap:0;max-width:980px;border:1px solid #dce7ee;border-radius:22px;overflow:hidden;box-shadow:0 24px 60px rgba(11,45,77,.1)}.price-side{padding:38px;background:var(--navy);color:#fff}.price-side .eyebrow,.price-side b{color:#fff}.regular-price{color:#b9ccda}.launch-price{display:flex;align-items:flex-end;margin:10px 0}.launch-price span{font-size:24px;padding-bottom:12px}.launch-price b{font:700 78px/1 var(--serif)}.launch-price small{padding:0 0 11px 8px;color:#c8d8e3}.savings{color:#75e2d5;font-weight:750}.price-side>.button{margin:12px 0;display:flex}.price-side>small{display:block;color:#b9ccda;line-height:1.5}.included{padding:38px;background:#fff}.included ul{padding-left:20px}.included li{margin:15px 0;color:#526d83}.mini-offer{display:flex;flex-direction:column;gap:6px;margin-top:24px;padding:20px;border-radius:14px;background:#e8f8f5}.mini-offer b{font:700 34px var(--serif);color:var(--navy)}.mini-offer span{color:#456078}
@keyframes panel-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes visual-drift{from{transform:translateY(0)}to{transform:translateY(-5px)}}
@media(max-width:1080px){.hero{padding-top:40px;grid-template-columns:1fr;gap:34px;min-height:auto}.story-visual{max-width:820px}.launch-plan{grid-template-columns:1fr 1fr}}
@media(max-width:700px){.site-header .actions .button{display:inline-flex;font-size:12px;padding:9px 11px}.site-header{gap:9px}.brand img{width:148px}.menu{font-size:0}.menu:after{content:'Menu';font-size:13px}.hero{padding:28px 18px 44px;gap:25px}.hero h1{font-size:clamp(36px,10.4vw,42px);margin-bottom:16px}.hero .lead{font-size:16px;line-height:1.55}.offer-line{border-radius:11px;flex-wrap:wrap}.hero-actions{width:100%;gap:13px;flex-direction:row;align-items:center}.hero-actions .button{flex:1}.hero-actions .text-link{white-space:nowrap;font-size:14px}.story-visual{padding:0 0 43px 0}.story-visual .hero-photo{aspect-ratio:4/3!important}.story-product{left:12px;right:18%;max-height:155px}.story-product img{height:120px;object-fit:cover;object-position:top}.story-chip{right:0;bottom:25px;font-size:9px;padding:8px}.value{gap:9px;padding:18px;font-size:13px;align-items:flex-start}.section{padding-top:54px;padding-bottom:54px}.section-head{margin-bottom:28px}.section-head>p:last-child{font-size:16px}.offer-band{align-items:flex-start;flex-direction:column;padding:22px}.offer-band .button{width:100%}.launch-plan{grid-template-columns:1fr}.price-side,.included{padding:28px 23px}.launch-price b{font-size:68px}.pricing-visual>.deal-badge{right:8px;top:-14px}.product-gallery{gap:16px!important}.mountain{min-height:360px;background-position:62% center!important}.mountain .hero-actions{align-items:stretch;flex-direction:column}.mountain .text-link{padding:4px}.form-section{gap:28px}.demo{padding:22px}.foot{gap:26px}.foot .button{width:max-content}}
@media(max-width:380px){.site-header{padding:0 12px}.brand img{width:132px}.site-header .actions .button{padding:8px 9px}.hero{padding-left:15px;padding-right:15px}.hero-actions{align-items:stretch;flex-direction:column}.hero-actions .button{width:100%}.story-product{right:12%;max-height:145px}.story-product img{height:110px}.section{padding-left:15px;padding-right:15px}.launch-price b{font-size:62px}}
@media(prefers-reduced-motion:reduce){.story-product,.story-visual .hero-photo{animation:none}.button{transition:none}}
</style>`;
const hero = (slug: string, visual: string) => {
  const x = info[slug];
  return `${conversionCss}<section class="hero"><div class="hero-copy"><p class="eyebrow">Bookkeeping intelligence</p><h1>${x[1]}</h1><p class="lead">${x[2]}</p><p class="offer-line"><b>Launch offer:</b> $125/month <s>$300/month</s></p><div class="hero-actions"><a class="button" href="/contact?intent=launch">Start with Launch Pricing</a><a class="text-link" href="/pricing">See pricing →</a></div></div>${visual}</section>`;
};
const photo = (name: string, alt: string) =>
  `<picture class="hero-photo" style="display:block;border-radius:24px;overflow:hidden;box-shadow:0 25px 60px rgba(11,45,77,.16);aspect-ratio:8/5"><source media="(max-width:700px)" srcset="/brand/${name}-mobile.webp"><img style="display:block;width:100%;height:100%;object-fit:cover" src="/brand/${name}.webp" alt="${alt}" width="1600" height="1000" loading="eager" fetchpriority="high"></picture>`;
const storyPhoto = (name: string, alt: string, product = "provenance") =>
  `<div class="story-visual">${photo(name, alt)}<figure class="story-product"><img src="/brand/product/eve-product-${product}.jpg" alt="Eve acceptance workspace shown with synthetic data" width="1440" height="1000"><figcaption>Eve workspace shown with synthetic data.</figcaption></figure><span class="story-chip">Source → evidence → report</span></div>`;
const flow = () =>
  `<div class="lineage"><div><span>01</span><b>Original source</b><small>Document hash and physical locator</small></div><i>→</i><div><span>02</span><b>Accounting work</b><small>Fact, check, and review state</small></div><i>→</i><div><span>03</span><b>Statement or report</b><small>Rendered value with reverse lineage</small></div></div>`;
const cta = () =>
  `<section class="mountain" style="background-image:linear-gradient(90deg,rgba(6,33,57,.96),rgba(10,54,83,.56)),image-set(url('/brand/mountain-cta.webp') 1x);background-size:cover;background-position:center"><div><p class="eyebrow">Launch pricing is live</p><h2>Clear numbers. Brighter tomorrows.</h2><p>Start Eve for $125 per month during launch, normally $300. Organize source documents, make review needs visible, and keep supported numbers connected to evidence.</p><div class="hero-actions"><a class="button white" href="/contact?intent=launch">Claim Launch Pricing</a><a class="text-link light" href="/pricing">See what's included →</a></div></div></section>`;
const productCapture = (name = "overview", caption = "Real Eve acceptance workspace with sanitized synthetic data.") =>
  `<figure class="product product-capture"><picture style="display:block"><source media="(max-width:700px)" srcset="/brand/product/eve-product-${name === "documents" ? "documents-mobile390" : name}.jpg"><img style="display:block;width:100%;height:auto" src="/brand/product/eve-product-${name}.jpg" alt="${escape(caption)}" width="1440" height="1000" loading="lazy"></picture><figcaption>${escape(caption)}</figcaption></figure>`;
const frame = () => productCapture("overview");
const productGallery = () =>
  `<div class="product-gallery" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:24px">${[
    ["documents", "Document repository and supported intake"],
    ["provenance", "Saved source and specialist evidence"],
    ["review", "Exception and review state"],
    ["reports", "Reports and deliverables library"],
    ["lineage", "Financial statement and source-to-number work"],
    ["workflow", "Engagement and accounting workflow"],
  ].map(([name, caption]) => productCapture(name, caption)).join("")}</div>`;
function shell(slug: string, body: string) {
  const x = info[slug] || info.home,
    publicOrigin = (process.env.EVE_PUBLIC_CANONICAL_ORIGIN || "https://evesbookkeeping.com").replace(/\/$/, ""),
    canonical = `${publicOrigin}${slug === "home" ? "" : `/${slug}`}`,
    title = slug === "home" ? "Eve Bookkeeping | Evidence-Led Bookkeeping Intelligence" : `${x[0]} — Eve's Bookkeeping`,
    description = slug === "home" ? "Eve brings documents, accounting evidence, financial reporting and professional review into one connected workspace." : x[2],
    socialImage = slug === "home"
      ? `${publicOrigin}/brand/og-home.png`
      : `${publicOrigin}/brand/og-${slug}.svg`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="description" content="${escape(description)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="Eve's Bookkeeping"><meta property="og:url" content="${canonical}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:image" content="${socialImage}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${socialImage}"><title>${escape(title)}</title><link rel="icon" href="/brand/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/brand/eve-icon-180.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet"><script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Eve's Bookkeeping","applicationCategory":"BusinessApplication","operatingSystem":"Web","url":"https://evesbookkeeping.com"}</script><style>${publicCss}</style></head><body><a class="skip" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="/"><img src="/brand/eve-logo-primary.svg" alt="Eve's Bookkeeping"></a><button class="menu" aria-expanded="false" aria-controls="nav">Menu</button><nav id="nav" aria-label="Primary">${nav.map((n) => `<a ${n[0] === `/${slug}` ? 'aria-current="page"' : ""} href="${n[0]}">${n[1]}</a>`).join("")}</nav><div class="actions"><a href="https://app.evesbookkeeping.com/login">Login</a><a class="button small" href="/contact?intent=launch">Start Now</a></div></header><main id="main">${body}</main><footer><div class="foot"><div><img src="/brand/eve-logo-reversed.svg" alt="Eve's Bookkeeping"><p>Evidence-led bookkeeping intelligence with clear human and professional review boundaries.</p><a class="button small" href="/contact?intent=launch">Start with Launch Pricing</a></div><div><h3>Explore</h3><a href="/product">Product</a><a href="/businesses">For Businesses</a><a href="/cpa-firms">For CPA Firms</a><a href="/pricing">Pricing</a></div><div><h3>Trust</h3><a href="/security">Security</a><a href="/quality">Quality</a><a href="/about">About</a><a href="/contact">Contact</a></div><div><h3>Legal</h3><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/accessibility">Accessibility</a></div></div><div class="legal">© 2026 Eve's Bookkeeping. AI-prepared work requires appropriate human professional review. Authentication does not grant CPA signoff authority.</div></footer><script>const b=document.querySelector('.menu'),n=document.querySelector('#nav');b?.addEventListener('click',()=>{const o=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!o));n?.classList.toggle('open',!o)});</script></body></html>`;
}
const paths = () =>
  `<div class="paths"><a href="/businesses"><p class="eyebrow">For businesses</p><h3>Know what is happening in your books.</h3><p>Follow documents, processing, exceptions, and financial visibility.</p><b>Explore the business experience →</b></a><a href="/cpa-firms"><p class="eyebrow">For CPA firms</p><h3>Give judgment better-prepared work.</h3><p>Organize multi-client evidence, findings, and draft deliverables.</p><b>Explore the firm experience →</b></a></div>`;
function home() {
  return shell(
    "home",
    hero(
      "home",
      storyPhoto("home-hero", "Financial documents arranged beside an Eve bookkeeping workspace", "provenance"),
    ) +
      `<section class="value"><b>Evidence-backed workflows</b><b>Human review where it matters</b><b>Built for businesses and professionals</b></section>` +
      section(
        "See the evidence, not a black box",
        "A real workspace for reviewable accounting work.",
        "Eve keeps documents, evidence, exceptions, and draft reporting in one inspectable experience.",
        frame(),
      ) +
      section(
        "A better operating model",
        "Move beyond disconnected bookkeeping.",
        "Keep the source, work, exception, and draft output in one explainable flow.",
        `<div class="compare"><div><h3>The old way</h3><p>Files scattered across inboxes and folders.</p><p>Numbers separated from supporting evidence.</p><p>Review questions arrive late.</p></div><div><h3>The Eve way</h3><p>Sources organized into durable records.</p><p>Evidence and review state travel with the number.</p><p>Exceptions remain visible before approval.</p></div></div>`,
      ) +
      section(
        "One financial intelligence system",
        "Specialist intelligence, one accountable workspace.",
        "Document understanding, accounting organization, evidence checks, review, and reporting stay connected.",
        cards([
          [
            "Document intelligence",
            "Reads supported files while preserving source identity.",
            "doc",
          ],
          [
            "Accounting organization",
            "Structures reviewable accounting work.",
            "trace",
          ],
          ["Evidence review", "Surfaces gaps and conflicts.", "review"],
          [
            "Draft deliverables",
            "Prepares traceable outputs for review.",
            "report",
          ],
        ]),
      ) +
      section(
        "Every number has a reason",
        "Trace supported values to evidence.",
        "Pages, spreadsheet cells, and image regions remain available where supported.",
        flow(),
        "navy",
      ) +
      section(
        "How Eve works",
        "A clear path from intake to review.",
        "Bring supported files. Eve preserves the questions that still require judgment.",
        steps([
          ["Bring your data", "Upload supported accounting files."],
          ["Understand", "Extract observations with source identity."],
          ["Organize", "Structure by company, period, and context."],
          ["Verify", "Check sufficiency and conflicts."],
          ["Review", "Resolve exceptions and missing evidence."],
          ["Report", "Prepare traceable drafts and exports."],
        ]),
      ) +
      section(
        "Built for the people doing the work",
        "One foundation, two focused paths.",
        "Businesses need clarity. Professionals need reviewable evidence.",
        paths(),
      ) +
      section(
        "Trust is operational",
        "Clear access boundaries. Visible evidence. Honest review state.",
        "We publish verified controls—not unsupported badges.",
        '<a class="text-link" href="/security">See the verified security approach →</a>',
        "soft",
      ) +
      section(
        "Launch offer",
        "Start building clearer books for $125 a month.",
        "Save $175 each month against Eve's regular $300 monthly price while launch pricing is available.",
        '<div class="offer-band"><div><b>58% launch savings</b><span>Evidence-led bookkeeping intelligence, organized intake, visible review state, and traceable draft reporting.</span></div><a class="button" href="/contact?intent=launch">Claim Launch Pricing</a></div>',
        "soft",
      ) +
      cta(),
  );
}
function product() {
  return shell(
    "product",
    hero("product", frame()) +
      section(
        "One connected workflow",
        "Six stages, one evidence chain.",
        "Each stage preserves what is known and what still needs review.",
        steps([
          [
            "Bring data",
            "Upload supported PDFs, images, CSV, and spreadsheets.",
          ],
          ["Understand", "Preserve content and locators."],
          ["Organize", "Structure entity, period, and currency."],
          ["Verify", "Evaluate evidence and reconciliations."],
          ["Review", "Expose exceptions and PBC needs."],
          ["Report", "Prepare evidence-bound outputs."],
        ]),
      ) +
      section(
        "Work where the evidence lives",
        "Move from document to decision without losing the source.",
        "The real workspace brings documents, evidence, review state, and reports together.",
        productGallery(),
      ) +
      section(
        "Source-to-number trace",
        "A correct-looking number is not enough.",
        "Broken source identity remains review-required.",
        flow(),
        "navy",
      ) +
      section(
        "Human judgment stays visible",
        "AI assistance does not become professional authority.",
        "Licensed or authorized approval remains a separate explicit step.",
        '<a class="button" href="/contact?intent=launch">Start Now</a>',
        "soft",
      ) +
      cta(),
  );
}
function businesses() {
  return shell(
    "businesses",
    hero(
      "businesses",
      storyPhoto("business-hero", "Business source documents becoming organized in Eve", "documents"),
    ) +
      section(
        "Clarity where it counts",
        "A practical view of your accounting work.",
        "Understand what arrived, what was processed, and where input is needed.",
        cards([
          ["Save time", "Keep supported source files organized.", "doc"],
          [
            "See the picture",
            "Use views grounded in eligible facts.",
            "report",
          ],
          ["Always be ready", "Retain traceable records.", "trace"],
          ["Gain confidence", "See unresolved questions.", "review"],
        ]),
      ) +
      section(
        "Made for operating work",
        "Supported file-based intake.",
        "We do not promise unverified live feeds.",
        '<div class="chips"><span>Receipts</span><span>Invoices</span><span>Statements</span><span>PDFs</span><span>CSV exports</span><span>XLSX ledgers</span></div>' + productCapture("documents", "Real sanitized document repository and intake view"),
        "soft",
      ) +
      section(
        "Your workflow",
        "From first upload to reviewable results.",
        "Results depend on the evidence provided.",
        steps([
          ["Get started", "Create the right workspace boundary."],
          ["Upload sources", "Use product intake."],
          ["Eve processes", "Work moves through durable jobs."],
          ["Review", "Resolve exceptions."],
          ["See results", "Open supported views and drafts."],
        ]),
      ) +
      section(
        "Questions businesses ask",
        "Straight answers before you start.",
        "",
        faq([
          [
            "Does Eve replace my accountant?",
            "No. Eve assists; professional responsibility remains human.",
          ],
          [
            "Can Eve connect directly to my bank?",
            "Direct live bank feeds are not represented as verified. Supported files can be uploaded.",
          ],
          [
            "Will Eve hide incomplete work?",
            "No. Missing or conflicting evidence should remain review-required.",
          ],
        ]),
      ) +
      cta(),
  );
}
function firms() {
  return shell(
    "cpa-firms",
    hero(
      "cpa-firms",
      storyPhoto("cpa-hero", "Professional accounting workspace with organized evidence in Eve", "workflow"),
    ) +
      section(
        "Prepared work, visible boundaries",
        "Support review without overstating authority.",
        "Eve organizes the chain professionals need to inspect.",
        cards([
          ["Workpapers", "Tie documents and facts to engagement.", "doc"],
          ["Exceptions", "Find gaps before finalization.", "review"],
          [
            "Multi-client organization",
            "Maintain explicit boundaries.",
            "people",
          ],
          ["Evidence trail", "Trace values to source.", "trace"],
          [
            "Reviewable drafts",
            "Prepare without calling them opinions.",
            "report",
          ],
          ["Team workflow", "Keep status understandable.", "people"],
        ]),
      ) +
      section(
        "A professional workflow",
        "Eve prepares. Authorized professionals decide.",
        "",
        steps([
          ["Select client", "Enter the assigned boundary."],
          ["Process evidence", "Organize sources and facts."],
          ["Review exceptions", "Inspect conflicts and PBC needs."],
          ["Finalize responsibly", "Use authorized approval workflow."],
        ]),
      ) +
      section(
        "Fit and trust",
        "Evidence, not black-box confidence.",
        "Access boundaries and explicit review states support inspectable work.",
        productCapture("workflow", "Real sanitized engagement workflow") + productCapture("reports", "Real sanitized reports and deliverables view"),
        "soft",
      ) +
      section(
        "Launch with Eve",
        "Put better-prepared client work in your professionals' hands.",
        "Start with the $125 monthly launch offer, then confirm the right multi-client scope with the Eve team.",
        '<a class="button" href="/contact?intent=launch&audience=cpa">Claim Launch Pricing</a>',
      ) +
      cta(),
  );
}
function pricing() {
  return shell(
    "pricing",
    hero(
      "pricing",
      '<div class="pricing-visual"><span class="deal-badge">Launch offer · save 58%</span>' + productCapture("reports", "Eve reports workspace shown with synthetic data.") + '</div>',
    ) +
      section(
        "Launch pricing",
        "One clear offer to start now.",
        "Get Eve's evidence-led bookkeeping workspace for 58% less during launch.",
        `<div class="launch-plan"><div class="price-side"><p class="eyebrow">Eve launch plan</p><p class="regular-price">Normally <s>$300/month</s></p><div class="launch-price"><span>$</span><b>125</b><small>/month</small></div><p class="savings">Save $175 every month during launch.</p><a class="button" href="/contact?intent=launch&plan=eve-launch">Claim Launch Pricing</a><small>Launch offer is manually confirmed during onboarding. No payment is collected on this site.</small></div><div class="included"><h3>What you get</h3><ul><li>Supported document and spreadsheet intake</li><li>Organized source evidence and review visibility</li><li>Traceable accounting work and draft reports</li><li>Exception and clarification workflow</li><li>PDF, XLSX, CSV, and JSON deliverables where supported</li><li>A workspace for businesses or accounting professionals</li></ul></div></div>`,
      ) +
      section(
        "Start without uncertainty",
        "Three simple steps to claim the offer.",
        "Eve uses a short, owner-assisted launch onboarding while self-serve checkout is being completed.",
        steps([
          ["Claim the offer", "Tell us whether you are a business or accounting firm."],
          ["Confirm your workflow", "Match your source files and review needs to Eve."],
          ["Start onboarding", "Receive confirmed launch terms and workspace setup."],
        ]),
      ) +
      section(
        "Pricing questions",
        "Clear answers before you start.",
        "",
        faq([
          [
            "Can I start today?",
            "Yes. Claim the launch offer now and the Eve team will confirm onboarding and payment details directly. This site does not collect payment.",
          ],
          [
            "Who is the launch plan for?",
            "The launch plan is designed for businesses and accounting professionals who want organized source evidence, visible review state, and traceable reporting.",
          ],
          [
            "Is professional signoff included?",
            "No licensed signoff should be assumed.",
          ],
        ]),
      ) +
      cta(),
  );
}
function how() {
  return shell(
    "how-it-works",
    hero(
      "how-it-works",
      '<div class="art route"><span>Source</span><i>→</i><span>Evidence</span><i>→</i><span>Review</span></div>',
    ) +
      section(
        "Start with supported sources",
        "Bring data through real intake.",
        "File-based intake is verified; unverified live feeds are not promised.",
        '<div class="chips"><span>Native PDFs</span><span>Scanned PDFs</span><span>Receipt images</span><span>Invoices</span><span>Bank statements</span><span>CSV</span><span>XLSX</span></div>',
        "soft",
      ) +
      section(
        "Six stages, one chain",
        "Each stage adds structure without discarding uncertainty.",
        "",
        steps([
          ["Bring your data", "Upload source files."],
          ["Understand", "Extract and preserve locators."],
          ["Organize", "Set company and period context."],
          ["Verify", "Test sufficiency and conflicts."],
          ["Review", "Keep judgment visible."],
          ["Report", "Prepare traceable drafts."],
        ]),
      ) +
      section(
        "Behind the scenes",
        "The system should not feel mysterious.",
        "Durable source identity, queued processing, evidence records, and review state stay connected.",
        flow(),
        "navy",
      ) +
      section(
        "Your role and Eve's role",
        "Assistance and authority are different.",
        "Eve prepares and explains. Authorized people decide.",
        `<div class="compare"><div><h3>Eve</h3><p>Reads supported files.</p><p>Preserves provenance.</p><p>Surfaces exceptions.</p></div><div><h3>Your team</h3><p>Provides complete evidence.</p><p>Answers clarifications.</p><p>Approves where authorized.</p></div></div>`,
      ) +
      cta(),
  );
}
function security() {
  return shell(
    "security",
    hero(
      "security",
      photo("security-hero", "A protected archive representing access control and evidence integrity"),
    ) +
      section(
        "Verified controls",
        "Security starts at the server boundary.",
        "Current implementation includes role-scoped access, secure cookies, CSRF, scrypt hashing, throttling, revocation, and account events.",
        cards([
          [
            "Authorization",
            "Protected routes are evaluated server-side.",
            "shield",
          ],
          ["Tenant scope", "Customer reads use assigned workspaces.", "people"],
          [
            "Session protection",
            "Cookie, CSRF, throttle, and revoke.",
            "shield",
          ],
        ]),
      ) +
      section(
        "Evidence integrity",
        "Source identity travels with the work.",
        "Hashes and lineage support reverse inspection.",
        flow(),
        "navy",
      ) +
      section(
        "Professional authority is separate",
        "Signing in is not signing off.",
        "Ordinary authentication does not grant CPA authority.",
        '<div class="notice"><b>Bounded claim</b><p>Eve does not publish SOC 2, HIPAA, GDPR, PCI, AWS, AES-256, bank-level security, or exact TLS-version claims without evidence.</p></div>',
      ) +
      section(
        "Security questions",
        "Specific, factual answers.",
        "",
        faq([
          [
            "Is HTTPS provisioned?",
            "The public, customer, and owner domains use HTTPS.",
          ],
          [
            "Does Eve claim formal certification?",
            "No formal certification claim is published.",
          ],
          [
            "Does customer login grant approval authority?",
            "No. Authentication and professional signoff are separate.",
          ],
        ]),
      ) +
      cta(),
  );
}
function quality() {
  return shell(
    "quality",
    hero(
      "quality",
      '<div class="art quality"><b>20 / 20</b><span>curated technical cases contract-ready</span><small>Autonomous scheduling remains disabled</small></div>',
    ) +
      section(
        "An internal quality system—not a course catalog",
        "Synthetic cases exercise the real product.",
        "The Quality Academy checks scans, spreadsheets, duplicates, missing evidence, isolation, presentation, and deliverable lineage.",
        cards([
          ["Browser journeys", "Desktop and mobile product checks.", "trace"],
          ["Synthetic cases", "No private customer demonstration data.", "doc"],
          [
            "Five dimensions",
            "Coverage, accuracy, semantics, product, and deliverable truth.",
            "review",
          ],
        ]),
      ) +
      section(
        "Quality without hidden autonomy",
        "Scheduler boundaries remain controlled.",
        "Contract-ready cases do not automatically arm production scheduling.",
        '<div class="notice"><b>Current boundary</b><p>20 curated cases are contract-ready; none are autonomous-eligible.</p></div>',
        "soft",
      ) +
      cta(),
  );
}
function about() {
  return shell(
    "about",
    hero(
      "about",
      '<div class="art route"><span>Evidence</span><i>+</i><span>Intelligence</span><i>+</i><span>Judgment</span></div>',
    ) +
      section(
        "What Eve is",
        "Bookkeeping intelligence built around evidence.",
        "An AI Creates AI initiative for useful assistance without losing source, exceptions, or human responsibility.",
        cards([
          ["Useful", "Designed around real workflows.", "doc"],
          ["Inspectable", "Conclusions stay connected.", "trace"],
          ["Responsible", "Professional boundaries remain clear.", "people"],
        ]),
      ) +
      section(
        "Our philosophy",
        "Clarity is more than a clean dashboard.",
        "Show what happened, why a number appears, and what remains unresolved.",
        "<blockquote>“Clear Numbers. Brighter Tomorrows.”</blockquote>",
        "navy",
      ) +
      section("Work with Eve", "Choose the right path.", "", paths()) +
      cta(),
  );
}
function contact(q = "") {
  return shell(
    "contact",
    hero(
      "contact",
      '<div class="art"><div class="paper"><span class="deal-badge">58% launch savings</span><b>$125/month</b><span>Normally $300/month. No financial documents are needed to get started.</span></div></div>',
    ) +
      `<section class="section form-section"><div><p class="eyebrow">Start now</p><h2>Claim Eve's launch pricing.</h2><p>Tell us whether you are a business or accounting firm. We will confirm fit, launch terms, and the shortest path into a real Eve workspace.</p><div class="mini-offer"><b>$125/month</b><span>Normally $300/month · save $175 monthly</span></div></div><form class="demo" method="post" action="/request-demo"><input type="hidden" name="intent" value="launch-pricing"><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><label for="name">Name</label><input id="name" name="name" required maxlength="120"><label for="email">Work email</label><input id="email" name="email" type="email" required maxlength="254"><label for="organization">Organization</label><input id="organization" name="organization" required maxlength="160"><label for="audience">I’m interested as</label><select id="audience" name="audience" required><option value="">Select one</option><option ${q.includes("cpa") ? "selected" : ""}>CPA or accounting firm</option><option>Business</option><option>Multi-entity organization</option><option>Security reviewer</option></select><label for="message">What would you like Eve to help with?</label><textarea id="message" name="message" rows="5" required maxlength="2000"></textarea><label class="consent"><input type="checkbox" name="consent" value="yes" required> I agree to be contacted about starting Eve.</label><button class="button">Claim Launch Pricing</button><small>No payment is collected here. Do not include financial documents, account numbers, passwords, or sensitive information.</small></form></section>`,
  );
}
function legal(slug: string) {
  const x =
    slug === "privacy"
      ? "The demo form collects the contact information you provide so the Eve team can respond. Do not submit sensitive financial data."
      : slug === "terms"
        ? "This site describes an in-development bookkeeping product. It does not provide legal, tax, audit, certification, or licensed advice."
        : "Eve aims for semantic structure, keyboard access, visible focus, readable contrast, responsive layouts, and meaningful labels.";
  return shell(
    slug,
    hero(slug, "") +
      section(
        "Owner/legal review boundary",
        info[slug][1],
        x,
        '<div class="notice"><p>This bounded notice is not represented as counsel-approved final legal text.</p></div>',
      ),
  );
}
export function marketing(slug: string, q = "") {
  slug = (slug || "home").replace(/^\/+|\/+$/g, "") || "home";
  return slug === "home"
    ? home()
    : slug === "product"
      ? product()
      : slug === "businesses"
        ? businesses()
        : slug === "cpa-firms"
          ? firms()
          : slug === "pricing"
            ? pricing()
            : slug === "how-it-works"
              ? how()
              : slug === "security"
                ? security()
                : ["quality", "academy"].includes(slug)
                  ? quality()
                  : slug === "about"
                    ? about()
                    : slug === "contact"
                      ? contact(q)
                      : ["privacy", "terms", "accessibility"].includes(slug)
                        ? legal(slug)
                        : null;
}
export function demoThanks() {
  return shell(
    "contact",
    '<section class="section centered"><p class="eyebrow">Launch request received</p><h1>Thank you. Your next step is underway.</h1><p class="lead">We’ll review your workflow and confirm launch onboarding. Please do not send sensitive information until an approved secure intake is provided.</p><a class="button" href="/">Return home</a></section>',
  );
}
export function notFound() {
  return shell(
    "home",
    '<section class="section centered"><p class="eyebrow">404</p><h1>That page could not be found.</h1><a class="button" href="/">Return home</a></section>',
  ).replace("index,follow,max-image-preview:large", "noindex,follow");
}
export function page(
  title: string,
  content: string,
  navHtml = "",
  publicPage = false,
) {
  if (publicPage) return shell("home", content);
  const styles = `${portalCss}${controlCenterCss}.scroll table{min-width:760px}@media(max-width:900px){.scroll table.responsive-table{display:block;min-width:0}.responsive-table thead{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.responsive-table tbody{display:grid;gap:12px}.responsive-table tr{display:block;border:1px solid #dfe7ef;border-radius:12px;padding:2px 12px}.responsive-table td{display:grid;grid-template-columns:minmax(112px,.85fr) minmax(0,1.35fr);gap:12px;align-items:start;width:100%;padding:10px 0;border:0;text-align:left}.responsive-table td+td{border-top:1px solid #e2e8f0}.responsive-table td::before{content:attr(data-label);color:#526378;font-weight:750}.responsive-table td[colspan]{display:block}.responsive-table td[colspan]::before{content:none}}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escape(title)} — Eve Bookkeeping</title><link rel="icon" href="/brand/favicon.svg"><style>${styles}</style></head><body><header><a class="brand" href="/"><img src="/brand/eve-emblem-primary.svg" alt=""><b>Eve Bookkeeping</b></a><nav>${navHtml}</nav></header><main>${content}</main><footer>Eve Bookkeeping · AI-assisted work requires human professional review.</footer></body></html>`;
}
export const input = (n: string, l: string, t = "text", x = "") =>
  `<label for="${n}">${l}</label><input id="${n}" name="${n}" type="${t}" ${x}>`;
export const csrf = (t: string) =>
  `<input type="hidden" name="csrf" value="${escape(t)}">`;
export const table = (h: string[], r: unknown[][]) =>
  `<div class="scroll"><table class="responsive-table"><thead><tr>${h.map((x) => `<th>${escape(x)}</th>`).join("")}</tr></thead><tbody>${r.length ? r.map((x) => `<tr>${x.map((y, index) => `<td data-label="${escape(h[index] || "")}">${escape(y)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${h.length}">No records available.</td></tr>`}</tbody></table></div>`;
const portalCss = `:root{font-family:Inter,system-ui;color:#0B2D4D;background:#f4f7fa}*{box-sizing:border-box}body{margin:0}a{color:#126b68}header,footer{padding:22px max(20px,calc((100vw - 1160px)/2));background:white;border-bottom:1px solid #dfe7ef}header{display:flex;justify-content:space-between;gap:22px;flex-wrap:wrap}.brand{display:flex;gap:10px;align-items:center;text-decoration:none;color:#0B2D4D}.brand img{width:38px}nav{display:flex;gap:16px;flex-wrap:wrap}main{max-width:1160px;margin:auto;padding:36px 20px 64px}h1{font-size:clamp(32px,5vw,58px)}p{line-height:1.7;color:#526378}.card{background:white;border:1px solid #dfe7ef;border-radius:18px;padding:26px;margin:20px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:18px}.auth{max-width:480px;margin:35px auto}label{display:block;margin:18px 0 7px;font-weight:650}input,select,textarea{width:100%;padding:13px;border:1px solid #9aabbc;border-radius:8px;font:inherit}button,.button{display:inline-block;background:#0B2D4D;color:white;border:0;border-radius:9px;padding:13px 20px;font-weight:700;text-decoration:none;margin:12px 8px 12px 0}.scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:12px;border-bottom:1px solid #e2e8f0}.inline{display:inline}.error{border-left:4px solid #b42318;padding:12px;background:#fff0ed;color:#942011}`;
const controlCenterCss = `
.control-nav{margin:0 0 24px;padding:14px 16px;background:#eaf3f5;border:1px solid #d4e5e8;border-radius:14px;gap:12px}.control-nav a{font-weight:700;text-decoration:none;padding:8px 10px;border-radius:8px}.control-nav a:hover,.control-nav a:focus{background:#d7ebea}.control-link{font-weight:750;white-space:nowrap}.section-heading,.case-header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.section-heading h2,.case-header h2{margin:0}.count-badge,.status-badge{display:inline-flex;align-items:center;min-height:28px;padding:4px 9px;border-radius:999px;background:#e8f5f3;color:#0b625d;font-size:12px;font-weight:800;text-transform:capitalize;white-space:nowrap}.count-badge{background:#0b2d4d;color:#fff}.customer-summary{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,1.4fr);gap:24px;align-items:center}.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.metric-grid>div{min-width:0;padding:14px;border:1px solid #dfe7ef;border-radius:12px;background:#f7fafb}.metric-grid b,.metric-grid span{display:block;overflow-wrap:anywhere}.metric-grid b{font-size:22px;color:#0b2d4d}.metric-grid span,.muted{color:#61758a;font-size:13px}.support-case-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(240px,.85fr);gap:18px}.support-case-grid>section:first-child{grid-row:span 2}.session-banner{display:flex;flex-direction:column;gap:4px;max-width:280px;padding:14px;border:1px solid #9bd8d0;border-radius:12px;background:#effaf8;color:#155d58}.session-banner.inactive{border-color:#d8e1e9;background:#f7f9fb;color:#526378}.message-list{display:grid;gap:12px}.message{min-width:0;padding:14px 16px;border-left:4px solid #14a89a;border-radius:10px;background:#f4fbfa}.message>div{display:flex;justify-content:space-between;gap:12px;align-items:baseline}.message p{margin:8px 0 4px;overflow-wrap:anywhere}.message time{color:#61758a;font-size:12px;white-space:nowrap}.internal-note{border-left-color:#9a6b24;background:#fff8e6}.support-history-list>h2{margin-top:32px}.support-history{margin:16px 0}.help-intro{border-color:#b8ddd9;background:#fbfffe}.build-metadata{display:inline-block;max-width:100%;overflow-wrap:anywhere;word-break:break-word;font-size:12px;line-height:1.55}.scroll{max-width:100%;overscroll-behavior-inline:contain}th,td{overflow-wrap:anywhere}.stat{font-size:34px;font-weight:800;color:#0b2d4d}
@media(max-width:900px){.customer-summary,.support-case-grid{grid-template-columns:1fr}.support-case-grid>section:first-child{grid-row:auto}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.session-banner{max-width:none}.control-nav{gap:6px}.control-nav a{padding:7px 8px}}
@media(max-width:600px){header,footer{padding:16px}header{gap:12px}.brand{min-width:0}.brand b{font-size:14px}header nav{width:100%;gap:8px}header nav a{font-size:14px}header nav .inline{margin-left:auto}main{padding:24px 14px 48px}h1{font-size:clamp(30px,11vw,42px);line-height:1.08}.card{padding:18px;border-radius:14px}.control-nav{padding:10px}.control-nav a{font-size:13px}.section-heading,.case-header{flex-direction:column;gap:10px}.metric-grid{gap:8px}.metric-grid>div{padding:12px}.message{padding:13px}.message>div{align-items:flex-start;flex-direction:column;gap:2px}.message time{white-space:normal}.button{width:100%;margin-right:0;text-align:center}th,td{padding:10px;font-size:13px}.scroll{margin-inline:-2px}.support-history-list>h2{font-size:26px}}
@media(max-width:380px){main{padding-inline:12px}.card{padding:16px}.metric-grid b{font-size:19px}.status-badge{font-size:11px;padding-inline:8px}.control-nav a{font-size:12px;padding:6px}.brand img{width:32px}}
`;
const publicCss = `:root{--navy:#0B2D4D;--blue:#2563EB;--teal:#14B8A6;--soft:#F4F8FB;--serif:'Playfair Display',Georgia,serif;--sans:Inter,system-ui,sans-serif;color:#102A43;font-family:var(--sans)}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0}a{color:inherit}.skip{position:fixed;top:-60px;left:10px;z-index:99;background:#fff;padding:12px}.skip:focus{top:10px}.site-header{height:78px;padding:0 max(24px,calc((100vw - 1240px)/2));display:flex;align-items:center;gap:25px;border-bottom:1px solid #e5edf3;background:#fff;position:sticky;top:0;z-index:20}.brand img{width:220px;display:block}.site-header nav{display:flex;gap:20px;margin-left:auto}.site-header nav a,.actions>a:first-child{text-decoration:none;font-size:14px;font-weight:650;color:#456078}.site-header nav a[aria-current=page]{color:var(--blue)}.actions{display:flex;align-items:center;gap:14px}.menu{display:none}.button{display:inline-flex;justify-content:center;border:0;border-radius:9px;padding:14px 22px;background:var(--blue);color:white;text-decoration:none;font-weight:750}.button.small{padding:11px 15px;font-size:14px}.button.white{background:#fff;color:var(--navy)}.text-link{color:var(--blue);text-decoration:none;font-weight:750}.hero{max-width:1240px;margin:auto;padding:90px 24px 80px;display:grid;grid-template-columns:.9fr 1.1fr;gap:65px;align-items:center;min-height:630px}.eyebrow{text-transform:uppercase;letter-spacing:.16em;color:var(--teal);font-size:12px;font-weight:800}h1,h2,blockquote{font-family:var(--serif);color:var(--navy);letter-spacing:-.025em}h1{font-size:clamp(44px,5vw,72px);line-height:1.04;margin:15px 0 23px}h2{font-size:clamp(34px,4vw,51px);line-height:1.08;margin:0 0 18px}h3{color:var(--navy)}.lead{font-size:19px;line-height:1.7;color:#526d83}.hero-actions{display:flex;align-items:center;gap:24px;margin-top:28px}.product{margin:0;border:1px solid #dfe8ef;border-radius:18px;overflow:hidden;box-shadow:0 28px 70px rgba(11,45,77,.17)}.appbar{height:50px;background:var(--navy);color:#fff;padding:0 15px;display:flex;align-items:center;gap:10px}.appbar>span{background:var(--blue);padding:5px 9px;border-radius:7px}.appbar small{margin-left:auto}.appbody{display:grid;grid-template-columns:120px 1fr;min-height:320px}.appbody aside{background:#f1f6fa;padding:22px 15px;display:flex;flex-direction:column;gap:18px;font-size:12px;color:#71879b}.dash{padding:22px}.dashhead{display:flex;justify-content:space-between}.dashhead h3{margin:3px 0}.dashhead em{font-size:11px;background:#fff4ce;padding:7px;border-radius:99px;height:min-content}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:22px 0}.metrics div{padding:13px;background:#f7fafc;border:1px solid #e5edf3;border-radius:10px}.metrics small,.metrics span{font-size:10px;color:#74899c;display:block}.metrics b{font-size:19px;display:block;margin:7px 0}.source{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid #e1eaf0;padding:18px;border-radius:10px;font-size:11px}.source i{color:var(--teal)}figcaption{font-size:11px;color:#667f93;background:#f7fafc;padding:10px 14px}.value{background:var(--navy);color:#fff;display:flex;justify-content:center;gap:70px;padding:23px}.section{padding:92px max(24px,calc((100vw - 1180px)/2))}.section.soft{background:var(--soft)}.section.navy{background:var(--navy);color:#fff}.section.navy h2,.section.navy h3,.section.navy b{color:#fff}.section.navy p,.section.navy small{color:#c5d5e2}.section-head{max-width:760px;margin-bottom:40px}.section-head>p:last-child{color:#587086;line-height:1.7;font-size:17px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.card{border:1px solid #dfe8ef;border-radius:15px;padding:25px;background:#fff}.card p{color:#60788e;line-height:1.65;font-size:14px}.icon{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:#e8f8f5;color:#07877a;font-size:20px}.compare{display:grid;grid-template-columns:1fr 1fr;max-width:950px;border:1px solid #dde7ee;border-radius:16px;overflow:hidden}.compare>div{padding:34px;background:#f7f9fb}.compare>div:last-child{background:#e9f8f5}.compare p{color:#526d83}.lineage{display:grid;grid-template-columns:1fr 35px 1fr 35px 1fr;gap:12px;align-items:center}.lineage>div{padding:24px;border:1px solid rgba(255,255,255,.18);border-radius:13px;display:flex;flex-direction:column;gap:8px}.lineage span{color:var(--teal);font-size:12px;font-weight:800}.lineage i{text-align:center;color:var(--teal)}.steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.steps li{display:flex;gap:16px;padding:24px;border-top:2px solid #dce7ee}.steps li>span{color:var(--teal);font-weight:800}.steps h3{margin:0 0 8px}.steps p{margin:0;color:#60788e;line-height:1.6;font-size:14px}.paths,.plans{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}.paths>a,.plans article{padding:32px;border:1px solid #dce7ee;border-radius:16px;text-decoration:none}.paths p{color:#60788e}.paths b{color:var(--blue)}.plans{grid-template-columns:repeat(3,1fr)}.plans li{margin:12px 0;color:#5d758b}.mountain{min-height:410px;padding:70px max(24px,calc((100vw - 1180px)/2));display:flex;align-items:center;background:linear-gradient(90deg,rgba(6,33,57,.95),rgba(10,54,83,.7)),linear-gradient(165deg,#254f68 48%,#7da6a0 49%,#21415a 62%);color:#fff}.mountain h2{color:#fff}.mountain p{color:#d5e2eb;line-height:1.7;max-width:650px}.art{min-height:360px;border-radius:24px;background:linear-gradient(145deg,#e8f6f4,#eef4ff);display:grid;place-items:center;padding:30px;box-shadow:0 25px 60px rgba(11,45,77,.13)}.paper{background:#fff;padding:30px;border-radius:14px;display:flex;flex-direction:column;gap:12px;box-shadow:0 18px 40px rgba(11,45,77,.14)}.paper b{font-size:27px;color:var(--navy)}.tiers{grid-template-columns:repeat(3,1fr);gap:10px}.tiers span,.route span{background:#fff;padding:20px;border-radius:10px;font-weight:800;color:var(--navy)}.route{grid-auto-flow:column;gap:10px}.route i{font-style:normal;color:var(--teal);font-size:22px}.shield,.quality{display:flex;flex-direction:column;gap:14px}.shield b{width:90px;height:110px;border-radius:45px 45px 30px 30px;background:var(--navy);color:#fff;display:grid;place-items:center;font:700 40px var(--serif)}.quality b{font:700 45px var(--serif);color:var(--navy)}.chips{display:flex;flex-wrap:wrap;gap:12px}.chips span{padding:12px 16px;background:#fff;border:1px solid #dce7ee;border-radius:99px;font-weight:650}.faq{max-width:900px}.faq details{border-top:1px solid #dce7ee;padding:20px 0}.faq summary{display:flex;justify-content:space-between;cursor:pointer;font-weight:750}.faq summary span{font-size:23px;color:var(--teal)}.faq p,.notice p{color:#60788e;line-height:1.7}.notice{border-left:4px solid var(--teal);padding:20px 24px;background:#edf9f7;max-width:900px}.form-section{display:grid;grid-template-columns:.8fr 1.2fr;gap:70px}.demo{border:1px solid #dce7ee;border-radius:18px;padding:30px;box-shadow:0 18px 45px rgba(11,45,77,.08)}label{display:block;font-weight:700;margin:16px 0 7px}input,select,textarea{width:100%;padding:13px;border:1px solid #b7c5d1;border-radius:8px;font:inherit}.consent{display:flex;gap:10px;font-weight:500;color:#4d687e}.consent input{width:auto}.hp{position:absolute;left:-9999px}.demo small{display:block;color:#6c8295}.centered{text-align:center;min-height:500px}blockquote{font-size:50px;color:#fff}.menu:focus,input:focus,select:focus,textarea:focus,a:focus,button:focus,summary:focus{outline:3px solid rgba(37,99,235,.35);outline-offset:3px}footer{background:#071f35;color:#fff;padding:60px max(24px,calc((100vw - 1180px)/2)) 24px}.foot{display:grid;grid-template-columns:2fr repeat(3,1fr);gap:45px}.foot img{width:220px}.foot p,.legal{color:#9fb2c1;line-height:1.7}.foot a{display:block;text-decoration:none;color:#bed0dc;margin:11px 0;font-size:14px}.foot h3{color:#fff}.legal{border-top:1px solid #274259;margin-top:35px;padding-top:20px;font-size:12px}@media(max-width:1080px){.site-header nav{display:none;position:absolute;top:78px;left:0;right:0;background:#fff;padding:22px;flex-direction:column}.site-header nav.open{display:flex}.menu{display:block;margin-left:auto;background:#fff;border:1px solid #ccd7df;border-radius:8px;padding:9px}.hero{grid-template-columns:1fr}.cards{grid-template-columns:repeat(2,1fr)}.actions>a:first-child{display:none}.form-section{grid-template-columns:1fr}.foot{grid-template-columns:2fr 1fr 1fr}}@media(max-width:700px){.site-header{height:68px;padding:0 16px}.site-header nav{top:68px}.brand img{width:166px}.actions .button{display:none}.hero{padding:50px 18px 58px;min-height:auto}.hero h1{font-size:42px}.hero-actions{flex-direction:column;align-items:flex-start}.appbody{grid-template-columns:1fr}.appbody aside{display:none}.metrics,.cards,.steps,.paths,.plans{grid-template-columns:1fr}.source{flex-direction:column}.value{flex-direction:column;gap:12px}.section{padding:65px 18px}.compare{grid-template-columns:1fr}.lineage{grid-template-columns:1fr}.lineage i{transform:rotate(90deg)}.tiers{grid-template-columns:1fr}.route{grid-auto-flow:row}.foot{grid-template-columns:1fr 1fr}.foot>div:first-child{grid-column:1/-1}.mountain{padding:55px 18px}}@media(max-width:380px){.brand img{width:145px}.hero h1{font-size:37px}.foot{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}`;
