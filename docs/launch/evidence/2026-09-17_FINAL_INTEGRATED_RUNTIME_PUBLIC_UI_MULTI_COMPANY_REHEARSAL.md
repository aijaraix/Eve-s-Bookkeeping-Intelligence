# Eve final integrated runtime, public UI, and multi-company rehearsal

Date: 2026-09-17 UTC  
Controlling specifications: work handoff 06 and amendment 08  
Result: `EVE_INTEGRATED_CANDIDATE_NOT_READY`

## Source and release boundary

- Remote `main`: `69939bad5a4942fc11955d88943d7a20403820b7`.
- Remote feature branch and PR #31 at fetch time: `87108c56372b30b20ff7b3cee13761c63120292d`.
- Integrated local candidate commit: `e3581c50b8bd2b6ff45a9b36953c2c24e2d355f3`.
- GitHub push of the integrated commit was attempted and failed because this execution environment has no GitHub write credential. PR #31 and `main` were not changed.
- No production deployment was replaced. All runtime mutation was confined to an isolated acceptance deployment and storage claim.

## Runtime topology and reconciliation

The physical K3s namespace is `environment-6a9b1274a34c009752279011` on the existing Eve host.

| Component | Physical finding |
|---|---|
| Production Eve application | Running Zeabur image declared source `3025592d2c7123fe8e1d48429566e12dcc74ef59`, behind `evesbookkeeping.com`, `app.evesbookkeeping.com`, and `owner.evesbookkeeping.com`. It was not modified. |
| Production extraction worker | `eve-bookkeeping-repair:76cdd0860df1`, older than the fetched feature head. It was not modified. |
| Integrated acceptance web | `eve-bookkeeping-acceptance:e3581c5`, manifest digest `sha256:99c93f7a79e1e0b837190e77fd352f03c0dcf844c5d4f0426cd302c44f156053`; declared source `e3581c50b8bd2b6ff45a9b36953c2c24e2d355f3`. |
| Integrated acceptance worker | Same acceptance image, `node dist/worker.cjs`, isolated shared acceptance storage. |
| Candidate artifact identity | Server SHA-256 `0913b2ed89a5dbcb560c1e9e42df9e14b101c490be3011dbfc79ce8f2ed24ecc`; worker SHA-256 `823e9e2e605ebad43080a6951f6be72dc6f31198913278f8c10c9887a91dc969`. |
| Acceptance persistence | Dedicated 2 GiB local-path PVC, shared only by the candidate web and worker for restart testing. |
| OCR | Existing `eve-ocr-paddle:p1-005` and `eve-ocr-doctr:p1-005` services were healthy in observed probes/logs. The complete required mixed/selective OCR matrix was not rerun in this pass. |
| Local model | Existing Ollama service was healthy; observed model `qwen3.5:4b-q4_K_M`. |
| OpenClaw | Existing service was ready with Chromium and persistent storage. |
| Hermes | Existing Hermes service remained the scheduler authority. No second scheduler or control plane was created. |
| Scheduling | No K3s CronJobs existed for Eve. Candidate and production reported `ACADEMY_AUTONOMOUS_ENABLED=false`. Academy was not armed or rerun. |

The acceptance endpoint used temporary `sslip.io` hostnames and valid Let's Encrypt certificates. After testing, the authenticated-app hostname was removed from ingress and its temporary operator credential was rotated. The public candidate remains an acceptance surface, not a production cutover.

## Repairs and implementation

- Added the separate semantic public marketing surface with Home, Product, Businesses, CPA Firms, Pricing, How It Works, Security, Quality, About, Contact, Privacy, Terms, Accessibility, and truthful 404 pages.
- Added canonical metadata, page-specific Open Graph metadata/images, sitemap, robots policy, keyboard focus styles, responsive breakpoints, mobile menu, FAQ disclosure controls, and conservative claims.
- Used the checked-in Eve logo, favicon, colors, Playfair Display headings, and Inter body system.
- Kept pricing lead-only and omitted fake testimonials, ratings, customer names, savings, accuracy percentages, certifications, and unsupported compliance or integration claims.
- Added a bounded same-origin demo request endpoint with validation, honeypot, per-IP rate limiting, and durable JSONL persistence; it sends no external communication.
- Preserved the public/application/owner hostname split. Candidate-only public hostnames are explicitly allowlisted by environment rather than enabling public mode globally.
- Fixed three compile blockers: materiality narrowing, missing Observatory curriculum fields, and OCR page-number typing.
- Added public-host routing coverage to the access test.

## Build and regression evidence

- `npm ci`: passed.
- `npm run build`: passed.
- `npm run lint`: passed.
- `npm run test:access`: passed, including authentication, CSRF/origin rejection, tenant default-deny, session handling, and public-route checks.
- Broad suite via `node --import tsx run_tests.ts`: not green. Two observed failures remain:
  - Package A2 uses a brittle source-string assertion expecting `url.includes('/api/documents/upload')`; current code uses the stricter parsed-origin and exact-path check.
  - Package B3 is stateful across repeated runs and reused a report ID with conflicting `v3.0`/`v1.0` approval versions.
- H9.4 also prints three skipped cloud-model capability checks when `GEMINI_API_KEY` is absent in the local test shell; those checks were not treated as physical cloud-model proof.

## Public UI physical acceptance

The actual deployed candidate was opened in the cloud browser. The complete desktop home page rendered with the correct brand system and live semantic content. Every required public route returned its distinct title and H1, and no route showed horizontal overflow at the observed desktop viewport. A full-page browser screenshot was visually reviewed.

The only captured console errors originated from the cloud-browser extension, not from the Eve page. Canonicals, metadata, sitemap, robots, navigation, and live HTML were inspected. Pricing remained non-numeric and claims remained bounded.

Not physically verified:

- tablet, 390x844, and approximately 360px browser viewports (the available cloud-browser control did not expose viewport resizing);
- a browser-submitted demo form and its confirmation page;
- keyboard-only traversal of every page;
- page-specific social cards in an external social-card validator;
- real authenticated-product screenshots suitable for public marketing. The current hero uses a clearly labelled synthetic HTML product composition, not a screenshot from the authenticated candidate.

## Real intake and multi-company evidence

All data below was synthetic. Pfizer, Company 1, customer identifiers, and customer evidence were not used.

### Synthetic Cedar Trail intake

- Supported upload endpoint returned durable intake `intake-1789607452558-crvn` and priority job `JOB-INTAKE-intake-1789607452558-crvn`.
- CSV source SHA-256: `af7d3c56d76d1b3a03096b31b2dce03a0df87ccdb352c41470b041d79bdad2bd`.
- Text invoice source SHA-256: `b1883e2ed009aedfc3426e423743079407fd90153d7400f13e1dcd7008f7f3d8`.
- The CSV job completed.
- The text invoice failed closed with `Invalid PDF structure`; its durable job history, source hash, page manifest, source block, and error remained visible. This demonstrates a real dispatch defect for `text/plain`, not successful invoice processing.

### Bounded mixed-client isolation check

Two synthetic clients used the same filename, period, and amount shape:

| Synthetic client | Intake | Document | SHA-256 | Result |
|---|---|---|---|---|
| Aspen Lantern LLC | `intake-1789607472441-h19k` | `doc-1789607472436-lj06` | `42c6bb2ada19c542be451a24bfd8875d0606035d7745eefa29ef036c43964f12` | Completed |
| Blue Harbor Goods LLC | `intake-1789607474656-3buj` | `doc-1789607474651-t6vg` | `5b642ebb20718bcfff9078781f317ba0bdfbabf7a39bf4be776edba9b55f8931` | Completed |

The observed intake IDs, document IDs, hashes, and jobs remained distinct. This is only a bounded collision/isolation check; it is not the complete Rehearsal E proof through facts, PBC, frontend, exports, and reverse lineage.

## Restart and persistence

The acceptance worker and web deployment were each rolled through a controlled restart. Both returned ready. The same candidate source and server/worker hashes were observed afterward. Both synthetic client jobs remained `COMPLETED` with their original document and intake IDs. Academy remained disabled.

Not physically verified:

- retry after an interrupted in-flight OCR/model call;
- duplicate-promotion prevention after retry;
- report/export persistence and reverse-lineage retrieval after restart;
- frontend recovery during an intentionally induced API interruption;
- scheduler execution counters across a forced Hermes restart.

## Required rehearsal gaps

The full document-06 chain was not physically completed for Rehearsals A-E. Specifically unverified in the integrated candidate are:

- public-company native annual-report rehearsals A and B;
- scanned PDF, mixed native/scanned PDF, receipt image, scanned invoice, bank statement, XLSX GL/trial balance, long-document, exact duplicate, cosmetic near-duplicate, material conflict, missing evidence, and contradictory-evidence paths;
- sampled source-to-pixel provenance in the live frontend;
- canonical/review facts, accounting decisions/reconciliations, PBC/clarification persistence, PDF/XLSX/CSV/JSON deliverables, and reverse lineage for each rehearsal;
- complete cross-client absence of fact, provenance, finding, PBC, render, and export leakage;
- physical cloud-model route identity on the integrated candidate.

## Blocking classification

### Agent-remediable technical blockers

1. Complete and pass the required Rehearsals A-E through frontend, exports, reverse lineage, and restart retrieval.
2. Correct MIME/engine dispatch so a supported non-PDF source cannot be sent to PDF extraction as observed for `text/plain`, then add a regression test.
3. Capture real sanitized authenticated-candidate product screenshots and integrate them where the marketing specification requires real product imagery.
4. Physically verify tablet, 390x844, and approximately 360px layouts, keyboard flow, form submission, and network/console behavior.
5. Make the broad regression harness deterministic and green without weakening the stricter upload URL check.
6. Push the integrated commit to the canonical feature branch once a repository write credential is available, then rebuild from the pushed immutable SHA.

### Genuine owner-only blockers

- Provide/authorize a GitHub write credential or push `e3581c50b8bd2b6ff45a9b36953c2c24e2d355f3` to the canonical feature branch.
- After all technical gates pass, separately authorize PR merge and production release. No such authorization was assumed.

## Final status

`EVE_INTEGRATED_CANDIDATE_NOT_READY`

## Continuation pass — blocker closure and completion attempt

### Source and candidate identity

- Preserved local commits `e3581c5` and `da8d919` without rebasing or recreating them.
- Fetched remote `main`, feature branch, and PR #31; remote identities remained `69939bad5a4942fc11955d88943d7a20403820b7` and `87108c56372b30b20ff7b3cee13761c63120292d` respectively.
- GitHub push was retried before new work and remains blocked by missing write credentials.
- Non-PDF and harness repairs are committed locally as `e42252d1520394ad5bafe684a2d550536b8a31ec`.
- Isolated acceptance web and worker were rebuilt and deployed as `docker.io/library/eve-bookkeeping-acceptance:e42252d`. Production was not modified.

### Closed blockers

- Added explicit source-format routing for PDF, image, spreadsheet, and native document inputs. Unsupported formats now fail with `UNSUPPORTED_SOURCE_FORMAT` instead of falling through to PDF extraction.
- Added focused routing tests. `text/plain` resolves to the native-document/AnyDoc route; spreadsheet, image, and PDF routes resolve independently.
- Corrected the two broad-harness determinism defects without weakening assertions: the upload URL check now accepts the stricter parsed-origin/exact-path implementation, and physical signoff requires the exact report version rather than accepting an ambiguous versionless approval.
- `npm run lint`, `npm run build`, the focused source-routing test, and `node --import tsx run_tests.ts` pass. H9.4 still reports cloud-model checks as skipped when a local test shell has no Gemini credential; this is not counted as cloud-model execution proof.
- The isolated topology now declares queue roles explicitly: the candidate web is queue-write/intake authority with processing disabled, and the existing candidate worker is the sole queue processor. No second worker, scheduler, database, or control plane was created.

### Physical non-PDF dispatch proof

Synthetic `invoice-9002.txt` was uploaded through the real `/api/documents/upload` path. The response recorded:

- intake `intake-1789609173480-kuvv`;
- job `JOB-INTAKE-intake-1789609173480-kuvv`;
- document `doc-1789609173475-l486`;
- SHA-256 `20d949515122b6252382de49d8fe05b1767aa203ef3ea4450238f45995aacdbe`;
- MIME `text/plain`;
- summary `Parsed physical inventory via AnyDoc (anydoc)`;
- a queued `TEXT_BLOCK`/native-document processing unit.

This closes the demonstrated PDF-misrouting defect. It does not close the full rehearsal chain: the worker had not completed this newly written queue item during the bounded observation window, so facts, PBC, exports, reverse lineage, and restart retrieval were not credited.

### Public website continuation

- Added text-free, brand-compatible desktop and mobile WebP assets for Home, Businesses, CPA Firms, Security, and the mountain CTA under `public/brand/`.
- Integrated the page-specific imagery as responsive `<picture>` content with explicit dimensions and retained all live HTML copy, navigation, CTAs, claims, pricing boundaries, FAQs, and legal language.
- Kept the product composition explicitly synthetic; real authenticated-candidate marketing screenshots were not captured and therefore were not falsely represented as real UI captures.
- The deployed public candidate was re-opened in the cloud browser at desktop width: correct title/H1 rendered and document width equaled viewport width (`1348`), with no horizontal overflow.

### Newly observed limitation

The staged AnyDoc source block returned a parser-generated `document_id` that differed from the durable upload document ID. A local repair now remaps the canonical document and source-block identifiers to the durable upload document ID (`3c9a574`), but it has not yet been rebuilt, deployed, and physically retested; source-block-to-document lineage therefore cannot yet be accepted as complete.

### Still not physically verified

- Deployed version of the new hero/CTA asset commit (the deployed candidate remains `e42252d`).
- Tablet, 390x844, and approximately 360px physical browser viewports; the connected browser surface exposes no viewport emulation control.
- Real sanitized authenticated-product screenshots for dashboard, documents, provenance drawer, review state, reports, and reverse lineage.
- Full Rehearsals A–E through queue execution, canonical facts, reconciliation, authenticated frontend, PBC, PDF/XLSX/CSV/JSON, reverse lineage, and post-restart retrieval.
- In-flight retry/idempotency, OCR/model failure recovery, frontend recovery after API interruption, and complete cross-client absence checks across facts, provenance, findings, PBC, renders, and exports.
- Physical cloud-model route identity for each rehearsal.

### Remaining blockers

Agent-remediable technical blockers:

1. Deploy and physically retest the source-block durable document-ID repair, and prove worker pickup of queue items written after worker startup.
2. Complete real authenticated product capture and physical tablet/mobile acceptance.
3. Complete Rehearsals A–E and the recovery/idempotency matrix through frontend and exports.
4. Build and deploy the final public-asset commit, then repeat public acceptance against that immutable image.

Owner-only blockers:

1. Provide GitHub write authorization or push local commits `e3581c5`, `da8d919`, `e42252d`, and the subsequent website/evidence commit without rewriting history.
2. Separately authorize merge/production release only after the technical blockers above are closed.

## Final continuation — local recovery, `eb525e4` deployment, and bounded live retest

### Local history and durable recovery

- The original six unpublished commits were verified locally in this exact linear order: `e3581c50b8bd2b6ff45a9b36953c2c24e2d355f3`, `da8d919e53706ba8a3135284d6b959efa7c57259`, `e42252d1520394ad5bafe684a2d550536b8a31ec`, `7827bb1615ccde4c54e4b942240d9a168ad09686`, `3c9a57437901820b8a47d231b956e75daea2ecf9`, and `1d3ed270b6452e2937dbf4d9e451e7a8ef604061`.
- Direct `git push` still failed with no GitHub HTTPS credential. Remote feature and PR #31 therefore remained at `87108c56372b30b20ff7b3cee13761c63120292d`; remote `main` remained `69939bad5a4942fc11955d88943d7a20403820b7`.
- Exact-history recovery artifacts were saved in the authorized Work file store: a six-commit bundle/patch archive, and a later seven-commit archive through `eb525e4622e99df72c135064b932d42e6398de2d`. The latter archive SHA-256 is `390880e60e12e396c633c01337091371e2e56603445341e6789b1fc9695bce0f` and requires base `87108c5`.
- The untracked `generated_images/` directory contains preserved high-resolution source imagery. It was not deleted or committed; its optimized production derivatives are already tracked under `public/brand/`.

### Additional live defect and repair

The first `1d3ed27` live intake showed that `sourceBlocks[].document_id` had been corrected but `source_block_id` still embedded a transient parser document ID. Commit `eb525e4622e99df72c135064b932d42e6398de2d` adds a single identity-binding function at the hybrid extraction boundary and a focused regression test. `npm run lint` and `node --import tsx server/tests/hybridDocumentIdentity.test.ts` passed.

Both isolated acceptance deployments were rebuilt and rolled out as `docker.io/library/eve-bookkeeping-acceptance:eb525e4`, manifest digest `sha256:a2dca41a072193b8fd7d7aee2c0cad62cfc8c7f49dc1ea70cb7c8b02ec8c8bfb`, with declared source `eb525e4622e99df72c135064b932d42e6398de2d`. Production remained untouched. The web process is the one durable `BackgroundIngestionQueue` processor; the separately deployed `dist/worker.cjs` remains the existing extraction HTTP endpoint and is not a second queue consumer. Academy remained disabled and no scheduler/control plane was added.

### Physical source identity, startup pickup, and restart result

A new synthetic text invoice was uploaded after the `eb525e4` candidate was healthy:

| Field | Observed value |
|---|---|
| Intake | `intake-1789614752978-3t9m` |
| Queue job | `JOB-INTAKE-intake-1789614752978-3t9m` |
| Durable document | `doc-1789614752973-6n35` |
| Source SHA-256 | `e5b4aaeeaa99326cda39f643e0c2fcbdd8f9a8e518f2d0c2d7848c58daf34f1f` |
| Source block | `SB-doc-1789614752973-6n35-P1` |
| Terminal state | `COMPLETED`, `FINAL_RECONCILIATION_COMPLETED`, attempt `1` |

The queued item was picked up without hidden intervention. The job document hash matched the independently calculated upload hash; the source block ID embedded the durable document ID; and every returned source block used the same durable `document_id`. A controlled web deployment restart then recovered the same completed job, attempt count `1`, document hash, document ID, and one source block. No second attempt or duplicate block appeared. This physically closes the demonstrated post-startup pickup and hybrid source-identity defect for this supported text intake.

The persisted job response after restart exposed no facts in `job.result.facts`; this bounded check therefore does not prove accounting-fact or promotion idempotency and is not credited as a full rehearsal.

### Final public-site browser result

The deployed image includes `7827bb1`'s responsive hero/security/mountain assets. At the available physical desktop viewport, Home, Product, Businesses, CPA Firms, Pricing, How It Works, Security, Quality, About, Contact, Privacy, Terms, Accessibility, and the 404 route each rendered with the expected distinct title, H1, canonical/OG metadata, no broken images, and no horizontal overflow. The Businesses FAQ opened, and Request Demo routed to Contact. Console errors observed were emitted by the cloud-browser extension rather than the Eve origin.

The contact form and required fields were inspected but not submitted because that would create a representational lead record. Tablet, 390x844, and approximately 360px physical viewport execution remained unavailable in the connected browser and is not claimed. Real authenticated-product marketing screenshots were not captured or installed.

### Final unverified acceptance requirements

The following release gates remain unverified and prevent a READY decision:

- Rehearsals A–E were not completed end to end in the deployed candidate.
- The live authenticated frontend was not proven for every rehearsal through provenance, review, findings/PBC, reports, and reverse lineage.
- The required PBC response/re-evaluation lifecycle was not physically exercised.
- PDF, XLSX, CSV, and JSON export generation and post-restart readback were not physically proved for each rehearsal.
- Scanned PDF, mixed PDF, receipt, invoice image, bank statement, XLSX trial balance/GL, long-document, duplicate, near-duplicate, conflict, missing-evidence, and contradictory-evidence packages were not all run through the live chain.
- Tablet, 390x844, and approximately 360px public/authenticated browser acceptance was not physically run.
- Sanitized real-product screenshots for dashboard, documents, provenance, exception/review, reports, and source-to-number lineage were not captured or used on the marketing site.
- Retry after an interrupted OCR/model call, repeated delivery, frontend recovery after API interruption, and no-duplicate accounting promotion/facts were not physically proved.
- Full adversarial cross-tenant absence across documents, facts, provenance, findings, PBC, render IDs, reports, exports, APIs, and browser views was not physically proved.
- Hermes, OpenClaw, Ollama, cloud-model, Paddle, docTR, and selective mixed-PDF execution identities were not re-proved as part of every rehearsal in this final continuation.
- The seven local commits and this evidence update were not pushed to GitHub, and PR #31 did not advance.

### Final blocker classification

Agent-remediable work still required in an environment with the necessary browser/runtime reach: complete Rehearsals A–E, authenticated product capture, mobile/tablet browser acceptance, PBC/export/reverse-lineage checks, interruption/retry/idempotency checks, and the full cross-tenant matrix.

## 17-commit recovery continuation — SentinelX restoration and live acceptance

### Preserved source and deployment identity

- The exact owner-specified 17-commit checkpoint `6182b4cfebb33b6b2e13d946d6cc286b465c02d2` was recovered from `eve-local-commits-recovery-through-6182b4c.tar.gz`; its SHA-256 was reverified as `b4d67f0f92eb9d1733a92075bba31e89c32d4b3d3a393b027122d5ce76e3c1d2` and its required base as `87108c56372b30b20ff7b3cee13761c63120292d`.
- The recovery archive and extracted repository remain on the connected SentinelX host `host_6ae75cda00e19397`. The original 17 commits were not amended, squashed, rebased, reordered, or recreated.
- Remote feature/PR #31 remains `87108c56372b30b20ff7b3cee13761c63120292d`; remote `main` remains `69939bad5a4942fc11955d88943d7a20403820b7`. GitHub write authorization remains unavailable, so neither remote ref was modified.
- Three bounded acceptance repairs were added as descendants: deployment-aware social metadata (`325cc5d` locally), spreadsheet amount/source-lineage repair (`4138086`), and explicit isolated-acceptance queue-writer authority (`8055729`). The equivalent host-side applied history has HEAD `279159579fc23373124f8ae8948f9f98b40cfb64`; file content is the deployed source of image `docker.io/library/eve-bookkeeping-acceptance:8055729`.
- Immutable image digest: `sha256:f0c85966ba058b5af1d1ae5828fb2c300cbd2d8a37facbabfc5f8cc708e7324c`.
- Existing deployments only were updated: `eve-integrated-candidate` generation 31 and `eve-integrated-candidate-worker` generation 25. Both report one ready replica. Web pod UID `104b1cba-45a8-4e49-b06f-167274e2cca0`; worker pod UID `65165ce4-9f28-46da-9a0b-6d9e70312b42`.
- The existing 2 GiB candidate PVC, OCR services, ingress, and namespace were reused. No second candidate environment, scheduler, queue, database, worker, or model service was created. Production deployments and production ingress were not changed.

### Live public site and social acceptance

- Live public host: `https://eve-integrated-candidate.47.251.66.126.sslip.io`.
- Real Chromium captured full-page desktop (1440x1000), tablet (820x1180), mobile 390x844, and mobile 360x800 renders. At every viewport `scrollWidth === clientWidth`, all images loaded, and the primary supplied logo rendered from `/brand/eve-logo-primary.svg` with intrinsic width 1200.
- The responsive menu was physically opened at tablet, 390 px, and 360 px. `aria-expanded=true`, the navigation carried its open state, and its width matched the viewport.
- Captured PNG SHA-256 values: desktop `2ef4fcc17a09cd467f7d9b2ab4d53c4a2d58453a3828661bae27abf02d73209d`; tablet `6423742c0c26e305b6c67d629be9104b036d74e6a95b9613f4366a04dd0bde39`; 390 px `79083d3b081e53046d4ec0a02dfffa8afd833f536c41b48e73165e35f6849828`; 360 px `8c052d46c474bc0b27a4c79e254172e094c81315692e95a028d6f8bcfe10be8d`.
- Live HTML contains the required title and description and all requested Open Graph/Twitter fields. The canonical social origin is the live candidate, rather than the protected production operator host.
- `/brand/og-home.png` returns anonymous HTTP 200 as `image/png`, is 1200x630, uses the supplied Eve logo, has no clipping, and contains no unsupported claim. Live SHA-256: `ccdd7d11fa0b8cf8efac27c8fe7b8b617787fa42a88b09fb0bf10daed662acbb`.

### Proof-complete fact persistence and authenticated product

- Fresh text intake A: `intake-1789678601338-vhr2`, job `JOB-INTAKE-intake-1789678601338-vhr2`, document `doc-1789678601333-h65x`, source SHA-256 `b21f7d3ae8e6c4bb23fdcc792add508747900d68a5319ad3cb76a1d4fc578294`, source block `SB-doc-1789678601333-h65x-P1`.
- The real `HYBRID_GEMINI_NATIVE` queue/worker route produced revenue 125,000, cost of goods sold 50,000, operating expenses 30,000, and net income 45,000. All four returned `evidenceStatus=CONFIRMED`, `verificationStatus=VERIFIED`, `status=APPROVED`, with the exact source SHA and durable source-block/document identity.
- Controlled web and worker restarts changed both pod identities. The same five persisted workspace facts (four extracted and one supplemental validation fact) were retrieved afterward, with zero duplicate fact IDs and unchanged status/SHA identity.
- Authenticated Chromium opened the real accounting workspace and live Income Statement. The table rendered $125,000 revenue, $50,000 COGS, $30,000 operating expenses, and $45,000 net income.
- Clicking the live $125,000 cell opened the actual `Source-to-Pixel Provenance` dialog. It cited `atlas-garden-income-2025.txt`, page 1, the source text, raw value 125000, currency USD, and review boundary; professional approval was not fabricated.
- Authenticated tablet, 390 px, and 360 px journeys were captured. The mobile widths had no document overflow. The tablet document width also matched its viewport, although the diagnostic found 20 descendants extending outside the main rectangle; these appear in the captured state and are not asserted as fully polished tablet acceptance.

### Rehearsals and newly repaired defects

- Rehearsal B completed through a distinct balance-sheet profile: intake `intake-1789678850718-1fxk`, source SHA `8596e1290818a5b5eb35c963b173f0f3224a3c1e4d4a64b4a237b9d61b435b97`, six extracted facts, verified/confirmed/approved source lineage, and a passing balance-sheet identity check. Other statement/readiness gates correctly remained review-required.
- The first CSV rehearsal physically exposed incorrect selection of an Excel date serial (`45992`) and missing deterministic lineage. The descendant repair now excludes date/period columns and binds the exact CSV cell coordinate, source artifact, SHA, provenance, and source block.
- Rehearsal C retest: intake `intake-1789679549849-345a`, document `doc-1789679549848-efiv`, SHA `d893a409dab7e8b71bb51589cb9d393f36f5fd53da90291824f7550e08e71cba`. Values now physically read as Cash 75,000; Sales 180,000; Rent 36,000; Wages 69,000, with exact CSV row/column coordinates and no date-serial substitution. Primary-statement gates keep the incomplete cash conclusion proposed; it was not auto-promoted.
- Rehearsal D used two conflicting Redwood synthetic sources with SHA values `8d94913c254eac7dbcb96cfabf4943158d14cffe75de7df548213c522676f28b` and `e6255987c6e6a84c4e4290d15297f77c11a4bb3b59d26eb75e9bc85817efb`. Both jobs terminated without a failed queue unit, the ledger-backed 210,000 value retained its source, and workspace readiness remained blocked/review-required. The second conflicting document produced no accounting fact, so full two-sided conflict adjudication was not proved.
- Rehearsal E created two isolated synthetic tenants with the identical filename `monthly-close.csv`, identical SHA, amounts, period, account labels, and source type. Distinct workspaces/documents/fact IDs/source-block IDs were observed. Workspace-filtered document, fact, and source-block API reads contained the owning document and never the other tenant's document. This proves the bounded document/fact/source-block API slice, not the complete required PBC/render/report/export/browser matrix.

### P1-009 lifecycle

- Live P1-009 evaluation created decision `suff-1789679728847-8eca6ec6` for a missing transaction range and PBC request `pcr-1789679728867-4793`.
- Submission moved the request to `SUBMITTED_TO_CLIENT`; a narrative-only response moved it to `RESPONSE_RECEIVED` and explicitly returned `reevaluationRequired=true`.
- Re-evaluation with the same missing-evidence gap did not resolve the request (`resolved=false`). A later evaluation with the gap removed produced a new decision and only then resolved it (`resolved=true`). This proves that a response alone does not clear the accounting conclusion.

### Deliverables, interruption, and remaining acceptance failures

- The report-ready JSON package endpoint returned HTTP 200 and produced a fresh 6,501-byte JSON file with SHA-256 `fb33452d862d53056e558727e6117199d3ed54ecb8d389955cae53e735a0b51a`; it was parsed successfully before restart.
- The JSON package did not retain the source SHA. Fresh PDF, XLSX, and CSV artifacts were not generated/read back from the live rehearsal, and four-format reverse lineage and post-restart retrieval therefore fail the required acceptance gate.
- Controlled web and worker restarts and persisted fact/provenance retrieval passed. API, OCR, and model interruptions; retry/repeated delivery; duplicate report prevention; and persisted four-format report recovery were not completed. Existing OCR services may be shared and were not interrupted without proof that production would be unaffected.
- Complete Rehearsals A-E remain incomplete because every case was not proved through PBC/findings, all four exports, reverse lineage, restart/retrieval, and authenticated browser. A and B used synthetic public-company-style digitally native statements rather than independently acquired public issuer source sets.
- The full cross-tenant matrix remains incomplete for PBC, findings, render IDs, report artifacts, PDF/XLSX/CSV/JSON, and browser views.
- Public imagery is composed from checked-in sanitized product captures. A fresh real-candidate authenticated provenance screenshot was captured during this pass, but it has not been incorporated back into the public marketing assets.

### Current readiness decision

The repaired isolated candidate is healthy, the public site and social card are physically shareable, the prior proof-complete persistence blocker is closed for the fresh text intake, and the P1-009 response/re-evaluation behavior is proved. The candidate is still not release-ready because deliverable lineage/four-format readback, complete interruption/idempotency coverage, full rehearsal chains, full cross-tenant coverage, and the tablet authenticated-layout defect remain agent-remediable and unresolved. GitHub write access remains an owner/environment-only release blocker.

Owner/environment-only blockers: restore an authorized Git repository write path that can push the exact existing commit graph without rewriting it; separately authorize merge and production release only after the remaining technical gates pass.

Final result: `EVE_INTEGRATED_CANDIDATE_NOT_READY`

## Final closure pass — responsive browser proof and real product imagery

### Preservation checkpoint

- Starting local HEAD `0454422d9a8329eb48c2bb354405e71d858531aa` retained the exact eight-commit linear history above remote `87108c56372b30b20ff7b3cee13761c63120292d`.
- `/tmp/eve-local-commits-recovery-through-0454422.tar.gz` remained present at the start of this pass, matched SHA-256 `0e61e62813133f9563baaa8048b194b9e2c567f2c050a1944be4fc2130fd4494`, and its bundle verified with prerequisite `87108c56372b30b20ff7b3cee13761c63120292d` and head `0454422d9a8329eb48c2bb354405e71d858531aa`.
- Remote `main` remained `69939bad5a4942fc11955d88943d7a20403820b7`; remote feature and PR #31 remained `87108c56372b30b20ff7b3cee13761c63120292d`.
- The untracked high-resolution `generated_images/` source folder remained untouched.

### Physical responsive acceptance

Chromium `152.0.7977.82` opened the real public acceptance origin at four actual device metrics. Each run loaded the Home title/H1, had zero broken images, and reported `scrollWidth === clientWidth`:

| Viewport | Client/scroll width | Menu result | Overflow |
|---|---:|---|---|
| Desktop 1440x1000 | 1425 / 1425 | Desktop navigation visible | No |
| Tablet 820x1180 | 805 / 805 | Menu opened; navigation 805px wide | No |
| Mobile 390x844 | 390 / 390 | Menu opened; navigation 390px wide | No |
| Mobile 360x800 | 360 / 360 | Menu opened; navigation 360px wide | No |

Viewport screenshots were retained on the acceptance host with independently recorded SHA-256 hashes. This closes the previously unexecuted public tablet/390/360 viewport check for Home and its responsive menu. It does not prove every public route at every mobile viewport.

### Real authenticated synthetic product capture

A separate acceptance-only hostname was attached to the existing candidate service; it did not create a service, worker, scheduler, database, or control plane. The real operator gate and same-origin authenticated application were exercised against the synthetic `Cedar Trail Studio — Synthetic` workspace. Chromium captured these real product routes:

- `practice-home` — Practice Executive Dashboard;
- `practice-documents` — Document Repository & Intake;
- `engagement-findings` — Findings and review;
- `engagement-overview` — Engagement Overview & Attestation Workspace;
- `engagement-deliverables` — Authoritative Report Library & Deliverables Factory;
- `financials-income` — Consolidated Statement of Income;
- `engagement-evidence` — Saved source and specialist evidence.

Every desktop view reported the expected `data-eve-view`, the same synthetic workspace ID, same-origin API state `ready`, and no horizontal overflow. The documents view also passed a physical 390x844 run with client/scroll width `390/390`. Eight sanitized JPEG captures were added under `public/brand/product/` and integrated into Home, Product, Businesses, and CPA Firms in local commit `20a996d117794b0946c0050570f479d47bba20ed`. The fictional Northstar dashboard composition is no longer used by those marketing sections. Lint, production build, and access/operator-security tests passed after integration.

### Rehearsal preflight and demonstrated blocker

The live acceptance database contains a completed synthetic intake with three hybrid facts linked to durable document `doc-1789614312588-ua4f`. The facts retained source text, physical page `1`, document identity, currency, reporting period, confirmed evidence state, and the real `HYBRID_GEMINI_NATIVE` extraction route. They remained `PROPOSED`, and the engagement correctly reported `BLOCKED_NO_PROOF_COMPLETE_FACTS`, zero eligible rows, and zero report-included facts.

`GET /api/deliverables/download/ws-1789614320873` physically returned HTTP `422` with `REFUSED: No REPORT_READY facts. Empty extraction cannot export a deliverable package.` This is correct fail-closed behavior. It also demonstrates that the currently exposed normal intake/review product path has not yet completed the transition from proposed extracted facts to proof-complete reviewed facts and the existing four-format artifact compiler. The legacy compile endpoint is deliberately rejected, and no supported authenticated rehearsal workflow was physically found that compiles an ordinary customer intake into PDF/XLSX/CSV/JSON without bypassing the review boundary.

Consequently, Rehearsals A–E cannot honestly be credited end to end in this pass. Existing fixture/canary generators and backend-only browser mocks were not substituted for live customer-path proof.

### Remaining unverified after this pass

- All routes at all four viewports; authenticated tablet and 360px product journeys; modal/drawer viewport behavior and keyboard traversal remain incomplete.
- The provenance drawer itself was not opened and inspected; the evidence route was captured.
- Rehearsals A–E remain incomplete through reviewed facts, accounting decisions, PBC, artifacts, reverse lineage, and restart readback.
- The real professional clarification/P1-009 response and re-evaluation lifecycle remains unexecuted in the integrated candidate.
- Fresh PDF/XLSX/CSV/JSON artifacts were not generated from these rehearsal intakes and therefore could not be read back before/after restart.
- OCR/model interruption, fallback, reconnect, repeated delivery, and no-duplicate fact/promotion/report behavior remain unexecuted.
- The complete adversarial cross-tenant matrix across facts, provenance, findings, PBC, browser render IDs, reports, and downloadable formats remains unexecuted.
- Per-rehearsal Hermes, OpenClaw, Ollama, cloud route, Paddle, docTR, and selective mixed-PDF execution identities remain unverified.

Final result remains `EVE_INTEGRATED_CANDIDATE_NOT_READY`.

## 2026-09-18 surgical closure continuation (32–34 commit descendants)

### Isolated candidate and bounded source repairs

- Production/main and PR #31 were not changed. The existing namespace, PVC, queue, worker, and OCR deployments were reused.
- Commit `061d1cb` normalized numeric/hex HTML entities for deterministic evidence-label comparison. Commit `a1627e90c8bcfd8d20c748f31f77e6d1017707fb` additionally recognizes source-row labels carrying parser-added `beginning/ending balances` context and invalidates persisted continuation results when verification logic changes. Commit `0c54db8` recognizes the literal issuer metrics `Total shareholders’ equity` and `Total stockholders’ equity` in the balance-sheet identity gate. Targeted regression coverage and TypeScript lint passed.
- The `a1627e9` immutable image tar SHA-256 was `fbe4bc91d08ee954098006376a778ffdf931475ed92df1a1874419a1d4ce2a26`; imported manifest digest was `sha256:5694dd587ffea1870292ce2481035b410934968abf4ec71b398d84b7f640eb86`. Candidate-only deployment generations advanced to web `54` and worker `47`; production was not mutated.

### Rehearsal D conflict-specific P1-009 closure

- Workspace `ws-1789683370090` retained original conflicting documents `doc-1789683360026-j33y` / SHA `e05c10b126fea00b5d6267f92d8d70cd0a3b0eb0339a05280884d810fb8bd364` and `doc-1789683360208-v5bq` / SHA `0bc8617dd295490b002f8793b9e622531c7ba12327046dea1f5e149cc22af580`.
- The real evidence-sufficiency route created decision `suff-1789690492775-4c0a6822` and clarification `pcr-1789690492780-9dea`. A controller narrative response was accepted only as evidence; reevaluation `suff-1789690492794-2c6e4653` remained `BLOCKED_INSUFFICIENT` and did not resolve the clarification.
- A new synthetic controller-approved reconciliation was ingested through the ordinary intake/queue path as intake `intake-1789690494551-lbp5`, job `JOB-INTAKE-intake-1789690494551-lbp5`, document `doc-1789690494546-kat7`, SHA `dcca92141362bc1151d46c26d447e948a4de4107975440a75faa910f67826239`. Only the subsequent full-set P1-009 decision `suff-1789690505277-5f582d1e` became `ALLOWED` and resolved the clarification. Its evidence references retain both conflicts, the clarification, and resolving document/SHA. No CPA approval was asserted and no database state was forced.

### A/B authoritative-byte replay and authenticated responsive diagnosis

- Apple and NVIDIA source bytes were read from durable storage and independently rehashed to the previously recorded official-source SHAs before replay. The real upload contract deduplicated to the original document IDs while creating new durable jobs: Apple intake `intake-1789690884101-00x0`, job `JOB-INTAKE-intake-1789690884101-00x0`, 366 facts found in the intake response; NVIDIA intake `intake-1789690891217-fhqy`, job `JOB-INTAKE-intake-1789690891217-fhqy`, 59 facts found. Persisted queue results recorded 331 and 45 canonical facts respectively. Apple now has source-confirmed, verified, approved total assets, liabilities, and shareholders’ equity with the original SHA/block/coordinate lineage. Final continuation/report closure is recorded only after the final candidate sweep below.
- A legitimate operator session was derived inside the candidate from its protected runtime secret and passed to an ephemeral Chromium acceptance pod without printing the PIN or cookie. At 390px and 360px, `scrollWidth === clientWidth`; the many negative-coordinate descendants were the intentionally closed 256px off-canvas navigation, not page overflow. At 820px the diagnostic found a genuine header-actions overflow (right edge 1018.5 on an 820px viewport). Commit `41c878a70bfb472e37b81f8d1b48f322bab20fae` reduces tablet header spacing, defers search and action labels to wider breakpoints, and preserves mobile navigation. TypeScript lint passed; post-deployment browser verification is required below.

### Post-repair physical results and newly exposed fail-closed boundary

- The authenticated Chromium rerun against deployed `41c878a` returned HTTP 200 and exact page-width equality at 820/390/360. Tablet had zero out-of-viewport descendants. At both mobile sizes every reported offscreen descendant belonged to the closed 256px navigation (`right <= 0`); there was no positive-edge overflow. Screenshots and the machine-readable result are persisted under `/storage/acceptance-browser/` in the isolated PVC.
- After logic version `v8-shareholder-equity-identity`, Apple crossed the accounting gate with assets `359241000000`, liabilities `285508000000`, equity `73733000000`, variance `0`. The deliverable stage then failed closed on pre-existing duplicate fact IDs created by prior same-source replays; no artifact was issued from ambiguous duplicate lineage. Commit `36767d7` makes completed-job persistence converge to one newest fact per workspace/fact ID and scopes replacement to the current workspace, preventing an ID collision from overwriting another tenant. Existing intake and target-policy tests plus TypeScript lint passed. The same-source replay after this repair is the required physical closure step.
- The OCR interruption fixture was a synthetic 2400x3200 PNG, SHA `cd8efe3c6e318c2fb5316180199cc9d9686130dd210d22e45b1ee370dafa70f4`, uploaded as intake `intake-1789691793474-gnm4`, job `JOB-INTAKE-intake-1789691793474-gnm4`, document `doc-1789691793468-xjxg`. Both acceptance-only OCR deployments were scaled to zero and restored to one. The queue job was created only after restoration and later failed truthfully at `INGESTION_FAILED` because Gemini rejected the document request; it committed zero facts. This proves no fabricated result, but it does **not** prove an in-flight OCR retry/recovery and is therefore not marked as the required OCR interruption pass.
- NVIDIA remains `BLOCKED_ACCOUNTING_IDENTITY`: its official 10-K route produced a complete proof-backed income statement but no balance-sheet statement, while the current customer-continuation contract accepts only a balance-sheet identity. No synthetic balance data or manual state promotion was introduced.

## Final acceptance closure — durable four-format lineage and two-source conflict

### Preserved source and isolated deployment

- Work continued from preserved local descendant `05c4c1cdc5091aca5ee35c10dab361cde90a074b`; no reset, rebase, squash, amend, or production/main mutation occurred. Remote feature/PR #31 remained `87108c56372b30b20ff7b3cee13761c63120292d` and GitHub write credentials remained unavailable.
- Narrow commits added in this closure: `38cd386` (native source lineage), `87c69a8` (cross-format package identity), `dabbd67` (durable continuation race recovery), `0a4e1ae` (compact fiscal-year recognition), `b2d00d4` (review state/scale/source-block rendering), `f131b94` (durable scale persistence), `4c7ea27` (conflict identity normalization), and `9f0017d` (invalidate an earlier draft when later evidence conflicts).
- Final isolated image is `docker.io/library/eve-bookkeeping-acceptance:9f0017d`, imported digest `sha256:bbf87a77c659e1e9d2b2fddf7f587641b9053c5ed3b26566f5d14d626126c350`; local source `9f0017df8398624850800b146de5056c9e8c1470`, host-equivalent source `5604f6c3404a0404141b91feb57b6dc90866ab80`.
- Final running identities observed after rollout: web pod `eve-integrated-candidate-567889d55-fbxvf` (`9a7c7991-144e-4b66-8266-109caaec40dc`) and worker pod `eve-integrated-candidate-worker-76974476c7-fl7j4` (`68331318-a80d-4293-aaf5-f58e342adb80`). Only the existing candidate web/worker deployments changed; production remained separate and untouched.

### Four-format truth and restart retrieval

- Fresh synthetic-safe source `eve-final-durable-scale.txt` (not a real customer) was ingested as intake `intake-1789683573591-1umj`, job `JOB-INTAKE-intake-1789683573591-1umj`, attempt `1`, document `doc-1789683573583-sj7i`, workspace `ws-1789683587495`, engagement `eng-customer-8f55d5407cec4c2f`, source SHA-256 `11e99ac71a3c6fe164d4b54f2e42f0592acf958bb6040950fdca93131f44277a`.
- The worker produced six APPROVED/VERIFIED/CONFIRMED facts, zero Euclid variance, final-lineage validation `valid=true`, report `REP-CUSTOMER-8f55d5407cec`, version `v6.a1.faf0dc02`, and a truthful `READY_FOR_AUTHORIZED_HUMAN_REVIEW_WITH_SYSTEM_FINDINGS` state. LEXICON remained explicitly `MODEL_UNAVAILABLE`; no substitute or professional approval was claimed.
- PDF/XLSX/JSON/CSV were physically parsed/read. Every format contained report/version, engagement/workspace/client, fact/value, source SHA, document, source-block, provenance, artifact, coordinate, extraction method, period/currency/scale, and APPROVED/VERIFIED/CONFIRMED state. Structured JSON retained all of those fields per fact; individual reporting-period representations remained source-derived (`FY 2029` or exact period date), not rewritten.

| Format | Bytes | SHA-256 |
|---|---:|---|
| PDF | 15,539 | `b65b89ca7389525d837e8f409f912960b9e84a3bc53cbc77d88245843b958c7d` |
| XLSX | 24,477 | `ef12fc40302d4dcb61b1a69f8a2275fdeccc6ebcdf33f61c702e80bf04ad9e71` |
| JSON | 45,996 | `1ddf173221dc1a3caa8e195b54929baabc90866bab8f4772be5c240e70a859a3` |
| CSV | 12,718 | `f02bee3494865d6dc01aaa829eaacc4d5b9f482f19bfb63b1e46658edd588ac6` |

- Controlled web and worker restarts changed pods from `eve-integrated-candidate-6f8f8b99b-46pdz` / `eve-integrated-candidate-worker-6f94f9ff-8bk5h` to `eve-integrated-candidate-557d9c5b7b-mfz57` / `eve-integrated-candidate-worker-5b7698598-ktl9j`. The same four artifact IDs were then downloaded without regeneration; response `X-Artifact-SHA256` values and recomputed bytes matched the table exactly.
- Repeated continuation sweeps and later deployments left exactly four canonical files for this report (one per format), closing duplicate-report prevention for this bounded report. The same job remained attempt `1`; no duplicate accounting promotion was observed.

### Real public issuer rehearsals and runtime identities

- Rehearsal A used Apple Inc. 2025 Form 10-K acquired from the official SEC archive, SHA-256 `548ae59778cf08ee0f2ee088e7ece20d947076c3c01f74d2d65db4c2777e436a`, job `JOB-INTAKE-intake-1789681076803-nh8m`, document `doc-1789681076787-wxw4`, workspace `ws-1789681209722`. It completed attempt `1` with 331 extracted/112 approved facts; every approved fact retained SHA, coordinate, and provenance. The accounting identity remained truthfully blocked because the extracted source set did not yield one authoritative total-equity fact.
- Rehearsal B used NVIDIA 2025 Form 10-K acquired from the official SEC archive, SHA-256 `dae19486be264fd26eb00a7f920dc641041a261c81bc8c03b678eea947de4856`, job `JOB-INTAKE-intake-1789681092342-oizg`, document `doc-1789681092320-zad8`, workspace `ws-1789681301640`. It completed attempt `1` with 45 extracted/43 approved facts and complete persisted source identity, but did not yield a complete authoritative balance-sheet identity. Both A and B therefore correctly stopped at `BLOCKED_ACCOUNTING_IDENTITY`; four-format issuance and the remaining downstream stages were not manufactured.
- Rehearsal C is closed through fresh source, queue/worker, deterministic AnyDoc native-text route (`TEXT_NATIVE_TEXT`, `anydoc-2.1`), proof-complete facts, accounting decision, specialist runtime receipts, four formats, reverse lineage, restart, and exact artifact retrieval using the Juniper package above. Recorded specialist routes included Google Gemini 3.5 Flash (HERMES/ATHENA/QUINN), Google Gemini 3.1 Flash Lite (CLARA), deterministic LEDGER/VERITAS/EUCLID/SENTINEL, and truthful unavailable local Ollama LEXICON.

### Rehearsal D two-sided conflict

- A single isolated intake `intake-1789683360419-3chs` preserved two plausible synthetic source sets for Cascade Works LLC. Management schedule document `doc-1789683360026-j33y` has SHA `e05c10b126fea00b5d6267f92d8d70cd0a3b0eb0339a05280884d810fb8bd364`; controller schedule document `doc-1789683360208-v5bq` has SHA `0bc8617dd295490b002f8793b9e622531c7ba12327046dea1f5e149cc22af580`. Both completed on attempt `1` in workspace `ws-1789683370090` with independent source-block, artifact, provenance, and coordinate identities.
- Conflict diagnostics initially failed to group `Total assets` with `TotalAssets`; `4c7ea27` normalizes metric/period identity and retains both candidates' SHA, source blocks, provenance, coordinates, values, and documents. The live endpoint then returned two material conflicts (`totalassets` 300,000 vs 320,000; `totalequity` 200,000 vs 220,000).
- The later job remained `BLOCKED_ACCOUNTING_IDENTITY`. After `9f0017d`, the first job's earlier draft was durably reclassified from `READY_FOR_AUTHORIZED_HUMAN_REVIEW_WITH_SYSTEM_FINDINGS` to `BLOCKED_ACCOUNTING_IDENTITY`; report `REP-CUSTOMER-ed50a8f9244d` is retained for history but marked `STALE_BLOCKED_CONFLICT`, `isStale=true`. Eve therefore does not silently keep either source as the current conclusion.
- The earlier accepted P1-009 proof still establishes that a clarification response is evidence only, the same gap remains unresolved after re-evaluation, and only a sufficient re-evaluation resolves it. A new conflict-specific clarification route call could not be authenticated through the operator-session gate because P1-009 requires separate internal authority; no new D-specific response/resolution claim is made.

### Cross-client and public regression

- Focused physical mixed-client fixtures used overlapping `general-ledger.csv` and `expense-support.pdf` filenames, identical periods/labels/values, and distinct physical SHA identities. Source-truth evaluation passed across documents, facts, provenance, findings, clarifications/PBC references, and rendered values. Separate PDF/XLSX/CSV/JSON packages were parsed and proved to contain only their own client's SHA/provenance/engagement/workspace identities. A live authenticated API/browser rerun of that complete matrix was not completed in this closure.
- Final public browser regression returned the exact title, three Eve logo instances, correct H1, zero broken images, and `scrollWidth === clientWidth` at the live desktop viewport. Anonymous homepage and OG image returned HTTP 200; metadata fields remained present; the OG asset is PNG 1200x630 with SHA-256 `ccdd7d11fa0b8cf8efac27c8fe7b8b617787fa42a88b09fb0bf10daed662acbb`. Previously accepted mobile/burger checks were not redundantly rerun because no public UI code changed.

### Remaining physical gaps

- Rehearsals A and B still lack proof-complete accounting identity, four-format issuance, restart retrieval, and authenticated frontend/provenance-drawer closure. Their fail-closed states are correct, but the required full chains are incomplete.
- Rehearsal D still lacks a newly authenticated conflict-specific clarification response, sufficient third-source resolution, post-resolution artifact chain, and conflict-history browser proof.
- Rehearsal E's focused source/deliverable isolation passed, but the complete live authenticated/API/browser matrix (documents, blocks, facts, provenance, PBC, findings, render IDs, reports, and downloads) was not rerun end to end.
- OCR interruption/retry and a controlled cloud-model interruption/restore were not executed. LEXICON's real unavailable-route evidence is truthful but is not a complete interruption/recovery test.
- The authenticated tablet diagnostic (20 descendants outside the main rectangle), authenticated tablet/390/360 provenance-drawer usability, and a fresh marketing-image browser capture were not physically closed in this pass. Existing checked-in sanitized real product imagery remains live.

Final result remains `EVE_INTEGRATED_CANDIDATE_NOT_READY`.

## Final continuation handoff recovery and share-card repair

### Physical preservation and remote state

- The exact handoff checkout was recovered at `ea10a141c83d6d0c154df58c4ba9e303ff725910`, with all 15 single-parent local commits preserved above remote feature/PR #31 base `87108c56372b30b20ff7b3cee13761c63120292d`.
- A fresh fetch confirmed remote `main` at `69939bad5a4942fc11955d88943d7a20403820b7`, remote feature at `87108c56372b30b20ff7b3cee13761c63120292d`, and PR #31 at the same feature SHA. Production/main was not checked out, changed, pushed, or deployed.
- A verified 15-patch/Git-bundle archive was created as `eve-local-commits-recovery-through-ea10a14.tar.gz`. Its SHA-256 is `cf0a3d54e253bd7520302efbc8aaf96471af8185538876f582dc689859028c33`; the bundle requires base `87108c56372b30b20ff7b3cee13761c63120292d` and exposes head `ea10a141c83d6d0c154df58c4ba9e303ff725910`.
- A direct fast-forward push attempt failed before authentication because this environment has no GitHub HTTPS credential. No remote ref changed.
- The unrelated untracked `generated_images/` source directory remains untouched.

### Local candidate verification and WhatsApp-safe metadata

- TypeScript lint, the production build, public/access regression tests, and operator-access security tests passed from the preserved candidate.
- Local anonymous HTTP retrieval returned the exact homepage title/description, canonical Open Graph/Twitter fields, favicon references, and the social artwork with HTTP 200 and byte-identical source/build output.
- The earlier SVG social card was visually inspected and found to clip its single-line headline at 1200x630. Commit `0b97a1ae6e22224aec233f239d7d2148f8347fd4` replaces that share path with a physically inspected 1200x630 PNG composed with the owner-supplied exact logo asset, wraps the headline safely, and points homepage Open Graph/Twitter metadata to `https://evesbookkeeping.com/brand/og-home.png`. The PNG is emitted into the production build and the metadata regression test passes.
- The existing public structure, responsive assets, mobile menu, and sanitized real-product captures were preserved; no customer data, Pfizer, or Company 1 rehearsal was used.

### Acceptance/deployment boundary in this environment

- The prior Zeabur acceptance deployment/control credential and temporary acceptance hostname are not exposed in this workspace, and no Zeabur deployment connector/client is installed. The repaired `0a12e04` proof-complete candidate and `0b97a1a` share-card repair therefore were not deployed to the isolated acceptance lane in this continuation.
- Because the repaired candidate could not be placed in the isolated lane, this continuation does not claim live proof-complete persistence after restart, authenticated provenance-drawer proof, Rehearsals A-E, the PBC/P1-009 lifecycle, fresh four-format readback, reverse lineage, controlled interruption/retry/idempotency, or the full cross-tenant adversarial matrix.
- These remain acceptance-environment blockers rather than inferred passes. Academy remains unarmed, and production/main remains untouched.

Final result remains `EVE_INTEGRATED_CANDIDATE_NOT_READY`.

## Final asset-serving deployment and route sweep

Commit `abefd613a8b94d468c95dcfae38f65b8217bddb4` adds a constrained nested-product-image handler and focused access regression coverage. It accepts only `eve-product-[a-z0-9-]+.jpg` beneath `dist/brand/product`, returns 404 for unexpected/traversal paths, and leaves the existing flat brand handler unchanged. Lint, production build, and access tests passed before deployment.

The existing isolated web and worker deployments were rolled to `docker.io/library/eve-bookkeeping-acceptance:abefd61`; imported manifest digest was `sha256:d2ba43c43361531965e7b7266a2c9ab0559018ca6422f5f85757c90005ad5498`, and both deployments declared source `abefd613a8b94d468c95dcfae38f65b8217bddb4`. No production deployment, scheduler, queue, database, or control plane was changed.

All seven sanitized product assets returned HTTP 200 with nonzero bodies. A traversal request returned 404. Chromium then opened every public route at 1440px and 390px. All routes reported `scrollWidth === clientWidth`, distinct expected titles/H1s, and no broken images after lazy content was scrolled into view. Product loaded all seven real captures at nonzero natural width; CPA Firms loaded workflow and reports captures. The 404 route rendered its dedicated not-found H1. Earlier Home checks at tablet 820px and mobile 360px remain valid because this deployment changed only the nested static-asset handler.

### Final local/remote durability state

- Local head before this evidence update: `abefd613a8b94d468c95dcfae38f65b8217bddb4`, eleven linear commits ahead of remote feature base `87108c56372b30b20ff7b3cee13761c63120292d`.
- GitHub write credentials remained unavailable; no force push, history rewrite, or repeated push attempt was made. PR #31 therefore remained at the remote base.
- A fresh verified bundle/archive through the final evidence commit is required below and supersedes the earlier ten-commit archive for recovery.

### Final gate result

The public website and real sanitized marketing imagery are now deployed and browser-verified at the bounded viewports above. The release remains not ready because the live supported customer workflow still stops at proposed facts and correctly refuses an empty/non-REPORT_READY deliverable. Rehearsals A–E, the PBC re-evaluation lifecycle, four-format export/readback, reverse lineage, interruption/retry/idempotency, and the complete adversarial cross-tenant matrix therefore remain physically unverified rather than being inferred from fixtures.

Final result: `EVE_INTEGRATED_CANDIDATE_NOT_READY`.

## Proof-complete lifecycle repair and exact brand-pack checkpoint

### Preserved state

- The starting checkout was physically verified at `50ee7ce3f8f9a1375c661364607a49da5c637dd3`, exactly 12 single-parent commits ahead of remote feature base `87108c56372b30b20ff7b3cee13761c63120292d`.
- Remote feature remained `87108c56372b30b20ff7b3cee13761c63120292d`; remote `main` remained `69939bad5a4942fc11955d88943d7a20403820b7` after a fetch used for awareness only.
- `/tmp/eve-local-commits-recovery-through-50ee7ce.tar.gz` physically matched SHA-256 `95de6c44c1d0e5fbda4e99beeb6ef05f0f75e0b6dd58e363526ea5c6d87eab3c` and contained the expected 12 patches and Git bundle.
- The unrelated untracked `generated_images/` directory remained untouched.

### Root cause and bounded repair

The hybrid pipeline correctly produced source-confirmed candidates, but ordinary primary statements with an identified reporting entity and no consolidated/parent prefix did not receive any reporting scope. `CanonicalFactResolver.promotePrimaryStatementFacts` therefore failed Gate E and returned those facts as `PROPOSED`. In addition, `EvidenceCrossCheckEngine` returned matched text but not the matched source-block object, so SHA, artifact, provenance and exact coordinate identity were not reliably transferred into the persisted fact.

Commit `0a12e049b6a101bf02f29ac7d8c0765832330f23` repairs only those boundaries:

- an explicitly identified ordinary entity statement receives bounded scope `ENTITY_AS_PRESENTED`; unidentified statements remain scope-unresolved and cannot promote;
- the exact matched deterministic source block is returned by the evidence check;
- source block ID, SHA-256, source artifact ID, provenance ID, coordinate, and extraction identity are copied into the fact and durable application store;
- existing `CONFIRMED` evidence, canonical gates, contradiction/accounting checks, and review-required behavior remain in force.

TypeScript lint and the production build passed. Targeted tests proved exact matched-block retention, identified entity-scope promotion to `APPROVED` + `VERIFIED`, non-promotion when reporting entity/scope is absent, durable handoff behavior, fail-closed persistence, canonical promotion integrity, and the verified-continuation selector. The broad local regression runner passed its accounting, fail-closed, parser, and adversarial suites until reaching environment-gated model-discovery coverage; targeted suites were then run separately without an external model call.

### Exact owner brand pack and shareability

The uploaded `eve-bookkeeping-brand-asset-pack.zip` matched SHA-256 `9108adfee017f2b4eea73b9db9d7f83ecaa7cd3f6acc675ce9175a67a7a55ff0`. Commit `b717379788e3d3265947040672e4c7af040b95f2` installs its exact primary/reversed logos, primary/reversed emblems, app mark, favicon, PNG logos, and 16–512px icon set. Direct SHA comparisons confirmed the canonical primary logo and favicon are byte-identical to the supplied assets.

The homepage now emits the requested canonical title and description, full Open Graph and Twitter fields, 1200×630 image dimensions, exact canonical URL, SVG favicon, and Apple touch icon. `og-home.svg` uses the exact supplied logo geometry and truthful pre-launch messaging. Access, operator-security, lint, and production-build checks passed; the existing public structure and sanitized product imagery were preserved.

### Physical-verification boundary after this checkpoint

The repair is committed locally but was not deployed during this continuation because the current workspace exposes neither the prior VPS deployment credential/path nor an installed deployment client. The existing isolated public candidate was read in a real cloud browser and still serves the previous deployed website. Therefore no post-repair live fact transition, candidate restart, authenticated provenance drawer, artifact generation, or Rehearsal A–E result is claimed here.

The remaining unverified readiness items are unchanged until the repaired commit is deployed to the isolated candidate: persisted post-restart proof-complete state, real authenticated provenance drawer, tablet/360 authenticated journeys, Rehearsals A–E, PBC/P1-009 response/re-evaluation, four-format live readback, reverse lineage, OCR/model interruptions, repeated-delivery/accounting idempotency, full cross-tenant adversarial matrix, and per-rehearsal runtime service identities.

Final result remains `EVE_INTEGRATED_CANDIDATE_NOT_READY`.
