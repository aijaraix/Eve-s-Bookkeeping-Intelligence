# 08 — Implementation Sequence and Acceptance Gates

## Principle

Do not claim success because types/interfaces exist. Implement, activate, observe, and verify each layer with evidence.

## Recommended sequence

### Phase A — Inventory current reality

Before changing extraction:

- map existing source formats and parsers
- map temporary stores, queue payloads, in-memory registries, agent memory, and durable stores
- trace one existing document through every stage
- identify where object counts shrink and whether shrinkage is destructive or merely derived
- identify all production UI consumers of document/graph data

Deliverable: current-state information-flow map.

### Phase B — Document IR contract

Implement one durable normalized `DocumentIR` schema with stable IDs and format-specific adapters.

Acceptance:

- original source preserved/hash verified
- structure reconstructable
- source-element inventory internally consistent
- every element has a disposition
- lower-level source evidence remains available after downstream processing

### Phase C — Custody ledger

Implement scoped custody envelopes and transactional handoffs.

Acceptance:

- each stage records expected/received/dispositioned references
- unaccounted transitions = 0 for certified runs
- temporary state cannot be purged before persistence + downstream acknowledgement
- restart resumes from durable checkpoint

### Phase D — Observation/DataPoint/Relationship extraction

Build observations and atomic data points from Document IR without count targets.

Acceptance:

- representative complex filing materially exceeds headline-only graph depth
- no raw-paragraph-as-data-point inflation
- relationships preserve entity/period/currency/segment context
- provenance is complete

### Phase E — Semantic/accounting interpretation

Use deterministic parsers first, specialists/models only where appropriate.

Acceptance:

- full material statement rows/comparatives
- footnote-specific structures
- debt/lease/tax/segment/people/entity/risk coverage where applicable
- unresolved material elements are visible

### Phase F — Graph and scope

Populate engagement-aware knowledge graph with entity resolution and cross-project safety.

Acceptance:

- no silent merge
- global knowledge cannot silently become engagement authority
- ambiguous matches create candidates/clarifications

### Phase G — UI mapping

Wire Document Intelligence, Data Point Explorer, Entity Graph, Clarification Hub, project dashboard, financial surfaces, and report lineage to authoritative stores.

Acceptance:

- no hidden fallback fixtures in production paths
- visible values reconcile to backend
- synthetic and real work clearly separated

### Phase H — Academy and Minerva

Update Academy to exercise conservation, extraction depth, entity ambiguity, clarification, product journeys, and company reconstruction.

Acceptance:

- Minerva answer keys isolated
- recall/completeness measured from source-side denominator
- learning postmortems target measured weaknesses

### Phase I — Continuous runtime

Leave Hermes in normal resource-aware continuous mode.

Acceptance:

- work-conserving behavior based on real progress
- real customer preemption preserved
- no arbitrary unexplained idle when safe capacity + eligible work exist
- no overload to achieve cosmetic utilization

## Required extraction reconciliation report

For every certified complex document, report:

### Source side

- source artifacts
- pages/logical sections
- container source elements
- leaf source elements
- paragraphs
- tables/rows/cells
- XBRL occurrences
- footnotes
- visuals
- cross-references

### Understanding side

- observations/attributes
- evidence occurrences
- atomic DataPoints by family
- relationships by type
- semantic assertions by classification
- verified facts
- canonical facts
- unresolved/review-required elements

### Quality side

- precision
- recall
- structural coverage
- statement coverage
- footnote coverage
- table coverage
- XBRL coverage
- narrative coverage
- visual coverage
- entity reconstruction
- information-custody reconciliation

## Information conservation acceptance

Certified transition requires:

- expected inputs = acknowledged/dispositioned inputs
- unexplained remainder = 0
- every derived object has backward lineage
- every material source element is interpreted, intentionally classified, review-required, or unsupported with an explicit reason

## Historical safety

When a better engine reprocesses an old source, create a new extraction version. Do not rewrite historical results or pretend old shallow runs were always deep.

## Audit window

Do not certify continuous autonomy from a few minutes. If a meaningful observation window has not naturally elapsed, return `ACTIVATED_PENDING_LONG_WINDOW_PROOF`.

## Failure posture

If the source inventory is deep but the graph remains shallow, identify the exact stage where compression/loss occurs. If the parser sees little, fix reconstruction. If semantic processing consumes everything but creates only a few data points, fix semantic decomposition. Evidence should identify the failed layer rather than trigger another broad rewrite.
