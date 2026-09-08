# 04 — Knowledge Graph, Entity Resolution, and Professional Clarification

## Objective

Eve must understand companies, projects, engagements, legal entities, counterparties, and relationships without contaminating one project with another. Similar company names, former names, trade names, subsidiaries, vendors, and overlapping engagements are expected conditions, not edge cases.

## Core graph objects

At minimum:

- Firm
- Client
- Project
- Engagement
- Entity
- Subsidiary / business unit / JV / associate
- Counterparty
- SourceArtifact
- SourceElement
- Observation
- DataPoint
- Relationship
- SemanticAssertion
- VerifiedFact
- CanonicalFact
- Derivation
- Presentation
- Report

## Entity identity

Do not identify entities by display name alone.

Entity resolution should consider:

- legal name
- normalized name
- trade name
- former name
- registration number
- CIK
- LEI
- tax ID
- jurisdiction
- address
- phone
- website/domain
- parent
- officers
- ownership
- filing identifiers
- effective dates
- source authority

## Resolution states

Use explicit states:

- `CONFIRMED_SAME_ENTITY`
- `CONFIRMED_DIFFERENT_ENTITY`
- `PROBABLE_MATCH`
- `POSSIBLE_MATCH`
- `AMBIGUOUS`
- `UNRESOLVED`

## Anti-silent-merge rule

Uncertain identity must never be silently merged.

For example, `ABC Telecom Ltd.` and `ABC Telecommunications Limited` remain distinct until evidence supports a merge.

## EntityResolutionCandidate

Persist candidate records with:

- candidate ID
- entity A / entity B
- projects and engagements affected
- matching evidence
- conflicting evidence
- confidence
- potential financial/report impact
- recommendation
- current status
- resolution evidence

## Temporal identity

Entity knowledge changes over time. Support:

- `validFrom`
- `validTo`
- `sourceDate`
- `observedAt`

Examples include former names, acquisitions, ownership changes, reorganizations, address changes, and discontinued entities.

## Relationship model

Relationships are first-class, evidence-backed objects. Examples:

- `SUBSIDIARY_OF`
- `OWNED_BY`
- `PARENT_OF`
- `CONSOLIDATES`
- `JOINT_VENTURE_WITH`
- `ASSOCIATE_OF`
- `CUSTOMER_OF`
- `SUPPLIER_OF`
- `COUNTERPARTY_TO`
- `RELATED_PARTY_TO`
- `LENDS_TO`
- `BORROWS_FROM`
- `GUARANTEES`
- `OPERATES_IN`
- `INCORPORATED_IN`
- `TAXED_IN`
- `REPORTS_IN`
- `USES_FUNCTIONAL_CURRENCY`
- `USES_REPORTING_FRAMEWORK`
- `BELONGS_TO_SEGMENT`
- `GOVERNED_BY_POLICY`
- `SUPPORTED_BY`
- `FORMERLY_KNOWN_AS`
- `TRADE_NAME_OF`
- `SAME_CONCEPT_AS`
- `SUPERSEDES`
- `REFERENCES`

Relationships can carry amount, currency, period, ownership percentage, effective dates, confidence, and verification state.

## Cross-project safety

Global entity knowledge may help Eve recognize a possible match, but material current-engagement conclusions must be supported by evidence authorized for the current engagement.

Examples:

- Prior project knowledge can raise `POSSIBLE_MATCH`.
- It cannot silently import another engagement's payable balance.

## ProfessionalClarificationRequest

Any agent may create a governed clarification request when material uncertainty remains.

Fields should include:

- request ID
- project ID
- engagement ID
- creator
- assignee
- clarification type
- question
- why it matters
- evidence available
- conflicting evidence
- confidence
- potential financial impact
- potential report impact
- options/recommendation when appropriate
- status
- response
- supporting documents
- resolver and timestamp

Supported categories include:

- entity identity
- entity relationship
- period
- currency
- scale
- source authority
- document version
- consolidation scope
- accounting treatment
- counterparty
- ownership
- tax jurisdiction
- reporting framework
- contract scope
- missing evidence

## Ask rather than guess

When evidence is insufficient, the system should ask, fail closed, or hold for review rather than inventing certainty.

## Academy simulation

In Academy work, realistic synthetic responses can include:

- complete response
- partial response
- wrong document
- ambiguous response
- revised response
- delayed response
- no response
- conflicting response

Minerva grades whether the solver recognized ambiguity and asked the right question. Minerva does not leak sealed answers directly to solver agents.

## Metrics

Track:

- candidates evaluated
- confirmed same
- confirmed different
- ambiguous/unresolved
- automatic merges
- false merges
- missed matches
- ambiguity detection rate
- unnecessary clarification rate
- clarification success
- cross-project contamination

Use `OBSERVED_ZERO_WITH_LIMITED_SAMPLE` rather than claiming a globally proven 0% false-merge rate on tiny samples.
