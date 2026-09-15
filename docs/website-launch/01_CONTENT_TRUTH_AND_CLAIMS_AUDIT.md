# Eve's Bookkeeping — Content Truth and Claims Audit

Purpose: prevent concept-board language from becoming unsupported production claims.

## Status labels

- **APPROVED** — supported by current product/architecture and safe to describe accurately.
- **OWNER-REVIEW** — commercial/positioning choice not yet locked.
- **VERIFY BEFORE PUBLISH** — may be true at an infrastructure/provider level, but current repo/runtime evidence has not established the exact public claim.
- **DO NOT PUBLISH** — unsupported, misleading, invented, or conflicts with current product truth.

## Brand / positioning

APPROVED:
- "Clear Numbers. Brighter Tomorrows."
- "Bookkeeping Intelligence"
- evidence-led / traceable accounting assistance
- AI-assisted bookkeeping/accounting workflows
- human review/professional approval where required
- source/evidence lineage behind supported accounting values

## Product capability claims

APPROVED:
- document upload/intake
- extraction and structured accounting evidence
- specialist processing
- financial statement presentation
- evidence/provenance inspection
- findings/review state
- reconciliation/accounting checks where supported by source facts
- AI-prepared draft deliverables with professional review boundary
- tenant-scoped customer access foundation
- owner portal foundation
- autonomous isolated Academy browser/quality testing

VERIFY BEFORE PUBLISH:
- direct live bank-account connections
- payment-platform connections
- automatic email-forward ingestion
- Google Drive/Dropbox ingestion
- real-time continuous transaction feeds
- automatic tax filing
- direct CPA filing/submission integrations

Until those paths are physically verified, website language should say customers can upload/import source documents rather than promising live integrations.

## Security claims

APPROVED:
- server-side tenant authorization
- role-scoped account access
- secure session cookies
- CSRF controls
- scrypt password hashing
- login throttling
- session revocation
- authentication/audit events
- source-document hashes/evidence lineage
- provisioned HTTPS on public/app/owner domains
- authentication does not equal professional signing authority

VERIFY BEFORE PUBLISH:
- exact TLS protocol version such as "TLS 1.3 everywhere"
- encryption-at-rest algorithm such as "AES-256 at rest"
- geographic/data-residency guarantees
- formal penetration-testing cadence
- backup/DR RPO/RTO claims
- "bank-level security"

DO NOT PUBLISH without formal evidence/certification:
- "SOC 2 Type II Ready" badge/claim
- SOC 2 certification language
- HIPAA compliance / HIPAA badge
- GDPR compliance badge or categorical compliance claim
- PCI DSS certification claims
- AWS-hosted claims unless deployment is actually on AWS and documented
- MFA as a general customer-login feature unless physically implemented and required in the production auth path

The current source contains professional-signoff types that reference MFA-capable authority flows, but that does not establish that ordinary customer account login currently provides MFA.

## Testimonials / social proof

DO NOT PUBLISH:
- invented customer names
- invented star ratings
- invented quotes
- invented CPA firm endorsements
- unmeasured savings percentages
- unmeasured accuracy claims
- "trusted by" customer counts unless measured

Use no testimonial section until real approved customer proof exists. A temporary alternative is a capability/results section using verified product behavior rather than fake people.

## Commercial claims

OWNER-REVIEW:
- $149 / $299 / $499 monthly plans
- $499 onboarding fee
- 50% off first six months
- founding customer offer
- transaction limits
- bank/card account limits
- report limits
- priority support tiers
- CPA Firm $1,500 / $3,000 plans
- historical cleanup pricing
- cancellation/refund terms

These can remain in visual mockups as design placeholders, but production website values must come from approved versioned plan definitions.

## Academy naming

CURRENT INTERNAL TRUTH:
"Eve Academy" is the autonomous isolated quality/testing and learning system that operates the real product through browser journeys.

The Canva Academy page currently depicts customer training courses/certificates. That is a different product concept.

Recommended resolution:
- internal/marketing differentiator: **Eve Quality Academy**
- customer education: **Eve Learning Center** / **Learn Eve**

Do not present a full course/certificate catalog as live unless that content system actually exists.

## Professional/accounting language

APPROVED:
- AI-prepared
- reviewable
- evidence-backed
- professional review required where applicable
- drafts/reports prepared for review

DO NOT PUBLISH as a system-generated claim:
- "audited" unless describing an actual source audit/report accurately
- "certified" as Eve's own professional conclusion
- "CPA approved" unless a qualified authorized human has actually approved the specific work
- "compliant" as a categorical legal/accounting conclusion when the system only reviewed limited evidence

Preferred bounded wording:
- "No exception identified in the evidence reviewed"
- "Prepared for authorized professional review"
- "Evidence-backed draft"

## Public screenshot/data policy

- synthetic/demo customer names only
- synthetic amounts only
- no Pfizer/customer screenshots
- no internal secrets, IDs, API keys, workspace IDs, model credentials, or private file names
- no raw infrastructure screens
