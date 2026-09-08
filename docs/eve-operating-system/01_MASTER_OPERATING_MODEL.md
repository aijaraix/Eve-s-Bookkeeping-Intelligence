# 01 — Master Operating Model

## Mission

Eve is not merely an extraction tool and not merely a dashboard. It is a continuously operating CPA practice platform in which customer work, autonomous practice, evidence processing, accounting analysis, review, reporting, product testing, and learning operate as one governed system.

## Core operating layers

### 1. Eve Customer Product
What a CPA firm, operator, or authorized client sees and uses: onboarding, upload, documents, engagements, financial statements, PBC, evidence, review, reports, and Copilot.

### 2. Eve CPA Organization
The accounting workforce coordinated by Hermes: specialists for statements, evidence, reconciliation, technical accounting, currency, entities, review, reporting, and evaluation.

### 3. Eve Document Intelligence
Turns source artifacts into a lossless structured representation before semantic or accounting interpretation.

### 4. Eve Knowledge Graph
Stores data points, entities, relationships, assertions, evidence links, project scope, and temporal context.

### 5. Eve Report Factory
Turns verified knowledge into audience-appropriate deliverables while preserving provenance.

### 6. Eve Academy
Continuously creates or selects practice work, exercises the real product and production-like pipelines, measures weaknesses, and supplies new curriculum.

### 7. Minerva
Independent examiner. Minerva evaluates but does not leak sealed answers to solver agents.

### 8. Learning System
Learning Dean and Capability Architect convert measured failures into training, configuration, tool, code, or infrastructure decisions.

### 9. Hermes Prime
The work-conserving orchestrator. Keeps useful work moving within customer-priority and resource-safety constraints.

## Classification model

Classification and priority are separate.

Supported work classifications should include:

- `CUSTOMER`
- `CUSTOMER_JOURNEY_ACADEMY`
- `SYNTHETIC_CUSTOMER_ACADEMY`
- `ACADEMY`
- `CANARY`
- `REGRESSION`
- `DEMO`

Only genuine authorized commercial work may be classified `CUSTOMER`.

A synthetic journey may exercise a simulated customer-priority path, but it must remain visibly synthetic so dashboard metrics are not contaminated.

## Customer priority

Priority order:

1. Real customer work.
2. Customer-facing recovery, security, or urgent review.
3. High-value customer-journey Academy work.
4. Deep extraction/accounting Academy work.
5. Discovery, research, and curriculum preparation.

When customer work arrives, background Academy work yields resources safely and resumes from checkpoints later.

## Work-conserving principle

If safe capacity exists and eligible useful work exists, Hermes should dispatch useful work. Fixed arbitrary cooldowns should not create idle time unless they correspond to a real resource, rate, budget, or safety gate.

Useful work means measurable progress: source discovery, download, hashing, parsing, extraction, data creation, verification, model inference, PBC action, review, report compilation, Minerva evaluation, postmortem, browser journey, or capability analysis.

Heartbeat state changes alone are not productive work.

## Project, engagement, and entity are distinct

- **Project:** business assignment or workstream.
- **Engagement:** specific accounting/review/reporting instance.
- **Entity:** legal or operational organization.

A project may involve multiple engagements. An engagement may involve multiple entities. An entity may appear in multiple projects.

Never use company-name strings as primary identity.

## Global knowledge versus engagement truth

Maintain explicit scopes:

- `GLOBAL_ENTITY_KNOWLEDGE`
- `ENGAGEMENT_EVIDENCE`
- `ENGAGEMENT_CANONICAL_TRUTH`

Global knowledge may suggest a hypothesis or help locate evidence. It must not silently become accounting authority in another engagement.

## Ask rather than guess

Any material ambiguity about entity, period, currency, scale, document version, source authority, ownership, accounting treatment, consolidation scope, framework, counterparty, or jurisdiction must be resolved through evidence, clarification, review, or fail-closed status.

## Academy realism

Synthetic customers must not always respond perfectly. Curriculum should include partial responses, wrong documents, conflicting versions, delays, ambiguous answers, revised schedules, and unresolved requests.

## Learning standard

Do not call repeated activity learning. Learning requires a measured before/after change supported by cases, postmortems, and reproducible evidence.
