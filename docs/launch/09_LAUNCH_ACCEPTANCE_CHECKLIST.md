# 09 — Launch Acceptance Checklist

This checklist defines evidence required before launch claims. Static source inspection alone is insufficient when a gate requires runtime proof.

## A. Public website

- [ ] `evesbookkeeping.com` serves approved branded site over HTTPS
- [ ] `www` redirects to canonical root
- [ ] desktop/mobile layouts physically reviewed
- [ ] no unsupported pricing/security/compliance/integration/testimonial claims
- [ ] Product / Businesses / CPA Firms / How It Works / Evidence-Security / About / Contact routes work
- [ ] Request Demo form works and stores/notifies through approved path
- [ ] Login routes to customer application
- [ ] unique page titles/descriptions/canonicals
- [ ] sitemap + robots
- [ ] Open Graph/social images and metadata
- [ ] public pages indexable; authenticated pages noindex
- [ ] no customer/private data in screenshots

## B. Identity and tenant isolation

- [ ] owner login physically works
- [ ] customer admin login physically works
- [ ] permanent-password flow physically works
- [ ] wrong credentials rejected/throttled as expected
- [ ] session/logout/revoke behavior works
- [ ] customer can access only assigned tenant/workspaces
- [ ] customer cannot open owner/admin/Hermes views
- [ ] evidence/report download authorization is tenant-scoped
- [ ] owner/internal roles do not imply professional signing authority
- [ ] no plaintext secrets in repository/logs/evidence

## C. Customer lifecycle / commercial controls

For first pilot, manual controlled commerce may satisfy this section if automated checkout is not yet approved.

- [ ] customer/tenant root record exists
- [ ] plan/PlanVersion exists as data, not scattered UI constants
- [ ] entitlement state is explicit
- [ ] usage events are tenant-scoped and idempotent
- [ ] Academy/internal QA events excluded from billable usage
- [ ] owner can see plan/status/usage/users/engagements
- [ ] customer can see understandable plan/usage state where enabled
- [ ] if checkout live: verified provider webhook is authoritative for activation
- [ ] webhook replay/idempotency tested
- [ ] cancellation/past-due behavior defined

## D. Universal intake

- [ ] every upload creates durable Batch/Artifact manifest
- [ ] original artifact bytes preserved + SHA-256
- [ ] exact duplicates identified without deleting occurrences
- [ ] supported formats have explicit parser/OCR route
- [ ] unsupported/unreadable formats remain visible with disposition
- [ ] large batch processing is bounded, resumable and observable
- [ ] customer work has priority over Academy
- [ ] crash/restart does not require full unchanged engagement rerun

## E. Source completeness and information conservation

- [ ] physical/logical page-sheet-section inventory persisted where format supports it
- [ ] detected elements have explicit disposition
- [ ] unexplained source remainder = 0 on launch-critical cases
- [ ] unexplained custody handoff loss = 0
- [ ] source completeness reported separately from task evidence sufficiency
- [ ] non-material source gap case can proceed with explicit disclosure
- [ ] material source gap case blocks affected conclusion
- [ ] reviewer can inspect why a gap was considered material/non-material

## F. Image / OCR / scanned evidence

Before advertising scanned/receipt support:

- [ ] representative receipt/photo benchmark completed
- [ ] image orientation/crop/quality handled
- [ ] OCR tokens/lines/regions retain coordinates/confidence
- [ ] promoted values link to exact image region(s)
- [ ] low-confidence material values route to review/clarification
- [ ] original image remains available
- [ ] customer can view evidence behind promoted value

## G. Spreadsheet / structured evidence

- [ ] XLSX/CSV source handling benchmarked
- [ ] workbook/sheet/range/cell/formula references persisted
- [ ] formula-derived values distinguish source formula from Eve derivation
- [ ] hidden/merged/blank sheet behavior documented
- [ ] promoted numeric values trace to exact cells/ranges

## H. Source-to-value-to-formula lineage

- [ ] every material canonical fact has source lineage
- [ ] every material dashboard value can resolve to canonical/derived source
- [ ] every Eve formula stores operand IDs and values
- [ ] every report numeric statement can resolve through lineage
- [ ] every material narrative/identity/date statement can resolve through semantic/source lineage
- [ ] lineage works for PDF/image/spreadsheet launch-critical cases

## I. Clarification / PBC

- [ ] unresolved item can create durable clarification
- [ ] clarification shows affected source and question
- [ ] routes to customer/internal/CPA reviewer appropriately
- [ ] response stores actor/time/evidence
- [ ] response creates decision lineage without deleting original uncertainty
- [ ] non-material uncertainty does not unnecessarily block unrelated work
- [ ] material uncertainty blocks affected conclusion

## J. Accounting/product truth

- [ ] supported launch cases extract expected accounting facts
- [ ] reconciliations/formulas verified
- [ ] statement UI reflects persisted truth
- [ ] evidence drawer/source trace works
- [ ] findings/requests visible
- [ ] report generation/download physically works
- [ ] no blank/misleading values presented as authoritative truth

## K. Academy

- [ ] native Hermes Academy scheduler physically enabled
- [ ] no duplicate scheduler authority
- [ ] current accepted browser pathway still passes
- [ ] Academy synthetic evidence isolated from customers
- [ ] customer work preempts Academy
- [ ] five-dimension grading contract implemented for new cases
- [ ] launch-critical supported document families have regression cases
- [ ] failed cases preserve evidence and become regression candidates
- [ ] no broad public accuracy claim before benchmark definition

## L. Owner operations

- [ ] owner overview shows current customers/engagements
- [ ] owner can see intake/processing state
- [ ] owner can see active clarifications
- [ ] owner can see agent execution summary
- [ ] owner can see Academy current/last state
- [ ] owner can see reports
- [ ] owner can see users/access
- [ ] owner can see plan/usage where enabled
- [ ] owner can see system health/alerts
- [ ] raw Hermes available under Advanced/Engineering, not required for normal operation

## M. Security / reliability

- [ ] tenant isolation regression passes
- [ ] auth/CSRF/session tests pass
- [ ] no authenticated customer/owner routes are publicly indexable
- [ ] persistence survives service replacement/restart
- [ ] source/report/account data backup mechanism inventoried
- [ ] restore procedure documented and testable
- [ ] in-progress jobs resume from safe checkpoint
- [ ] critical failure alerts have owner-visible path
- [ ] data retention/offboarding policy defined before general availability

## N. Pilot launch acceptance

Pilot may be approved only when:

- [ ] supported-source matrix explicitly identifies what the pilot customer may submit
- [ ] customer onboarding path works
- [ ] owner can observe the customer end to end
- [ ] evidence lineage works on the customer's supported document families
- [ ] clarification has a safe path
- [ ] Academy remains operational and non-interfering
- [ ] known limitations are disclosed internally and to customer where relevant
- [ ] owner explicitly approves the pilot launch

## O. General availability acceptance

General availability additionally requires:

- [ ] broader ordinary-bookkeeping source support
- [ ] production commerce/usage or an approved scalable commercial process
- [ ] mature bulk-intake/backpressure/recovery
- [ ] receipt/invoice/image benchmarks
- [ ] clarification workflow at customer scale
- [ ] expanded Academy curriculum and stable quality metrics
- [ ] operational support/incident procedures
- [ ] retention/deletion/recovery policies physically implemented
- [ ] owner explicitly approves GA

## Final launch rule

Do not use a single statement like `PRODUCTION_READY` unless the specific launch level is named:

- `PILOT_READY`
- `FIRST_CUSTOMER_READY`
- `GENERAL_AVAILABILITY_READY`

Each must point to the completed checklist evidence and remaining limitations.
