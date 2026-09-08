# 03 — Information Custody, Scoped Persistence, and Zero-Loss Handoffs

## Problem statement

Deep extraction can still fail even when the first parser sees the information. Data may be temporarily held in worker memory, an agent context, a queue payload, a local object, a temporary file, or a summarized handoff and then disappear before it reaches the durable graph or product.

Eve therefore needs two separate guarantees:

1. **Extraction completeness:** Did Eve detect the information?
2. **Information conservation:** Did everything Eve detected survive the full processing chain with an explicit disposition?

## Storage model

Do not use one undifferentiated global bucket for customer/project evidence.

Use scoped durable namespaces with shared contracts and indexes.

Conceptually:

`CLIENT → PROJECT → ENGAGEMENT`

Within each engagement:

- `sources/`
- `document-ir/`
- `observations/`
- `data-points/`
- `relationships/`
- `assertions/`
- `verified/`
- `canonical/`
- `derivations/`
- `clarifications/`
- `review/`
- `presentations/`
- `reports/`
- `audit-ledger/`

A cross-engagement/global index may reference these stores where authorization permits, but underlying evidence remains scoped.

## Agents are not storage

Permanent rule:

> Agents consume persisted references and produce persisted outputs.

No agent context window, prompt, scratchpad, response body, or ephemeral memory may be the only authoritative location of information.

## Append-and-reference, not replace-and-summarize

If the parser creates 50,000 observations and semantic interpretation creates 12,000 assertions, the 50,000 observations remain. The 12,000 assertions reference them.

If accounting review creates 3,000 verified accounting assertions, the semantic objects remain.

If canonicalization produces 600 canonical facts, lower layers remain intact.

Meaning is added upward; evidence is not destructively compressed away.

## Data Custody Envelope

Every material object or processing batch should carry custody metadata such as:

- `custodyId`
- `projectId`
- `engagementId`
- `entityId`
- `sourceArtifactId`
- `sourceElementId`
- `parentCustodyId`
- `createdBy`
- `createdAt`
- `informationType`
- `classification`
- `contentHash`
- `currentState`
- `currentOwner`
- `inputReferences`
- `outputReferences`
- `persistedLocation`
- `verificationState`
- `nextExpectedStage`
- `disposition`

## Transactional handoffs

Every stage boundary must reconcile expected and received references.

Example:

- Worker expected handoff: 8,914 source-element references.
- Next stage acknowledged: 8,914.
- Unaccounted: 0.

A smaller number of newly produced semantic or canonical objects is acceptable because the underlying inputs remain persisted and referenced.

## Information conservation equation

For each stage:

`INPUT REFERENCES = ACKNOWLEDGED / DISPOSITIONED INPUT REFERENCES`

Unaccounted input references must equal zero before the stage can be considered clean.

For source elements:

`DETECTED MATERIAL ELEMENTS = INTERPRETED + STRUCTURAL + PRESENTATION_ONLY + DUPLICATE/CORROBORATING + REVIEW_REQUIRED + UNSUPPORTED`

Again, unexplained remainder must equal zero.

## Derived-object invariant

Permanent rule:

> No derived object may exist without parent lineage.

A semantic assertion must reference supporting observations/data points.

A verified fact must reference evidence and assertions.

A canonical fact must reference verified facts/evidence.

A derivation must reference operands.

A UI presentation object must reference canonical/derived objects.

A report value or material narrative statement must reference its evidence lineage.

## Temporary state lifecycle

Temporary objects may exist, but they need lifecycle states:

- `CREATED_TEMPORARY`
- `PERSISTED`
- `ACKNOWLEDGED_DOWNSTREAM`
- `SAFE_TO_PURGE`

Nothing should be purged because a worker merely finished.

If an object remains temporary beyond expected limits without persistence, Sentinel raises `INFORMATION_CUSTODY_RISK`.

## Crash/restart behavior

Hermes resumes from durable acknowledged checkpoints.

A restart should answer:

- What was fully persisted?
- What was handed off?
- What was acknowledged?
- What is incomplete?
- Where should processing resume?

Do not restart the whole engagement when unchanged source sections and prior checkpoints are valid.

## Incremental/idempotent processing

Use hashes and versions where possible:

- source artifact hash
- page/section hash
- table hash
- cell/range hash
- version diff

Do not spend resources reprocessing unchanged material unless a new engine/version explicitly requires a new extraction comparison.

## Custody audit

Minerva should test both directions:

Forward:

`Source → Document IR → Observation → DataPoint → Assertion → Verified/Canonical → Presentation`

Reverse:

`Dashboard/Report → Canonical/Derivation → Assertion/DataPoint → Observation → Source`

Minerva should also sample non-promoted information, such as a footer, and verify Eve can still show what it was, where it appeared, what it contained, and why it was not promoted.
