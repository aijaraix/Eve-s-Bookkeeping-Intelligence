# 09 — Gemini Execution Directive

Use this document as the compact implementation instruction for Google/Gemini after it has read the full Eve operating-system documentation in this directory.

## Directive

Read, understand, and follow every document in `docs/eve-operating-system/` in numeric order before making changes.

Treat those documents as authoritative design intent for Eve's document intelligence, information custody, knowledge graph, entity resolution, clarification, Academy, UI/data lineage, and verification architecture.

Do not assume that the current runtime already satisfies the documents merely because interfaces or similarly named services exist.

Your task is to reconcile the current implementation against the design, preserve working systems, close measured gaps, activate the resulting process, and prove it with runtime/product evidence.

## Required behavior

1. Inventory the current production code paths and stores first.
2. Trace at least one representative complex document end-to-end.
3. Identify where information is currently stored temporarily and where it can be lost.
4. Implement or reconcile the Universal Document IR and stable source-element identity.
5. Implement or reconcile scoped Information Custody Ledgers and transactional handoffs.
6. Ensure agents consume persisted references and create persisted outputs rather than passing lossy summaries as the only handoff.
7. Preserve every detected source element with an explicit disposition.
8. Build observations, atomic DataPoints, relationships, semantic assertions, verified facts, canonical facts, derivations, presentations, and reports as distinct layers.
9. Preserve project/engagement/entity isolation and anti-silent-merge rules.
10. Route material ambiguity through Professional Clarification rather than guessing.
11. Keep real customer work distinct from synthetic Academy/customer-journey work in both backend and UI.
12. Wire authoritative stores to the actual Eve dashboard, Document Intelligence, Data Point Explorer, Entity Graph, Clarification Hub, financial statements, charts, and reports.
13. Update Minerva/Academy to test information conservation, recall/completeness, entity ambiguity, company reconstruction, product journeys, and learning.
14. Keep Hermes work-conserving and resource-aware without creating artificial CPU load.
15. Preserve historical results. New extraction versions must not rewrite old shallow runs.

## Specific extraction rules

- Do not use predetermined fact-count targets.
- Do not claim a document is deeply understood because a small set of headline metrics is correct.
- Do not call source elements noise and erase them; classify and preserve them.
- Do not collapse thousands of lower-level objects into a summary that replaces the originals.
- Do not allow temporary agent/worker memory to be the only copy of information.
- Do not treat XBRL wrappers, raw chunks, duplicates, and independently meaningful semantic assertions as the same thing.
- Do not infer product correctness from code alone.

## Required proof

For a representative real public-source complex filing, produce an extraction reconciliation showing:

- source artifacts
- container source elements
- leaf source elements
- tables/rows/cells
- XBRL occurrences
- paragraphs/footnotes/visuals/cross-references
- observations/attributes
- evidence occurrences
- atomic DataPoints by family
- relationships by type
- semantic assertions by class
- verified facts
- canonical facts
- unresolved/review-required elements
- information-custody handoff counts at every stage
- source-side coverage/recall denominators
- company reconstruction results

For each stage transition report:

`expected inputs / received inputs / dispositioned inputs / unaccounted inputs`.

Certified transitions require unaccounted inputs = 0.

## Product proof

Use the actual Eve product for product certification. Reconcile visible client, engagement, project, document, graph, clarification, report, and learning data to authoritative stores.

Distinguish proof levels:

- CONFIGURED
- RUNTIME_VERIFIED
- PRODUCT_VERIFIED
- BROWSER_VERIFIED

Do not report a stronger level than was actually observed.

## Continuous operation

After implementation and controlled verification, leave Hermes running under normal resource-aware continuous scheduling. Do not manually manufacture dozens of cases for a favorable report.

If a meaningful long observation window has not elapsed, say so rather than fabricating proof.

## Final report

Return one evidence-based report containing:

- what existed before changes
- what changed
- exact stores/code paths involved
- extraction/custody reconciliation
- UI/backend reconciliation
- Academy/Minerva integration
- continuous scheduler state
- unresolved gaps ranked P0-P3
- strongest proof level for each major capability

Possible final status:

- `PASS` only if deep extraction, zero-loss custody, scoped graph, product wiring, and continuous operation are all proven at the appropriate level.
- `PARTIAL` when architecture is implemented but live evidence remains incomplete or measurable gaps remain.
- `FAIL` when material information can still disappear, customer/project scope is unsafe, or product-visible data cannot be reconciled to authoritative evidence.
