# 05 — Continuous Academy and Work-Conserving Orchestration

## Objective

Eve should behave like a continuously operating CPA practice and learning laboratory, not a single-case batch runner with arbitrary idle cooldowns.

## Persistent pipeline queues

Maintain durable queues for:

- `DISCOVERY`
- `SOURCE_ACQUISITION`
- `CASE_PREPARATION`
- `CUSTOMER_JOURNEY`
- `INTAKE`
- `EXTRACTION`
- `ACCOUNTING`
- `PBC_WAIT`
- `REVIEW`
- `REPORT`
- `MINERVA`
- `LEARNING`
- `CAPABILITY`

Multiple projects may occupy different stages simultaneously.

Example:

- Project A: Quinn review
- Project B: deep extraction
- Project C: waiting on PBC
- Project D: source acquisition
- Project E: Minerva examination
- Project F: Learning Dean postmortem
- Project G: next-case discovery

## Waiting does not mean idle

When an engagement waits for customer/PBC clarification:

1. persist the checkpoint,
2. release unnecessary resources,
3. continue other eligible work,
4. wake and resume the waiting engagement when new evidence arrives.

## Resource-aware concurrency

Track workload-specific limits, including:

- CPU
- RAM
- disk
- worker queue
- local Qwen occupancy
- browser sessions
- cloud rate limits
- cloud budget
- customer queue

Do not maximize concurrency blindly. The goal is maximum **safe useful productivity**, not maximum CPU percentage.

## Model routing

Prefer:

1. deterministic logic/parsers,
2. local Qwen for suitable semantic tasks,
3. cloud models only when necessary,
4. human/operator escalation for material unresolved issues.

Health probes and routing decisions are not inference calls and should not inflate model-usage metrics.

## Case Curator / Research Scout function

While current work executes, the system should prepare future practice work.

Responsibilities:

- identify candidate public companies and other suitable public-source cases
- target measured competency gaps
- locate authoritative sources
- identify languages/currencies/frameworks
- estimate complexity
- download/hash source packages
- avoid redundant practice
- prepare case shells
- provide sealed examiner material to Minerva without leaking answers to solver agents

This function can live under Hermes/Learning Dean rather than requiring unnecessary agent proliferation.

## Intelligent curriculum selection

Next projects should respond to measured weaknesses.

Examples:

- weak debt maturity extraction → select debt-heavy filing
- weak lease schedule extraction → select major lease disclosures
- weak German/Spanish terminology → select appropriate multilingual filing
- weak entity-resolution precision → select legally ambiguous group structures
- weak chart/diagram interpretation → select visual-heavy reports
- weak consolidation/FX → select multinational telecom/group cases

## Customer journey practice

A proportion of Academy work should exercise the real Eve product path, including:

- create/select client/engagement
- upload
- document intake
- financial statements
- click-to-source
- PBC
- review
- Report Wizard
- downloads

Browser journeys are especially important after deployments, UI changes, and report/workflow changes. Not every background practice case needs a browser if a cheaper contract-level path provides adequate coverage.

## Scheduler proof

Do not infer useful utilization from task status alone.

Count useful work only when measurable progress occurs, such as:

- file downloaded/hashed
- source elements created
- parser progress persisted
- data points/relationships created
- facts verified/canonicalized
- inference completed
- PBC/review action completed
- report compiled
- Minerva evaluation persisted
- postmortem created
- browser checkpoint passed

## Utilization metrics

Where telemetry permits, report:

- productive wall-clock time
- legitimate wait time
- unexplained idle time
- average/peak concurrent projects
- worker occupancy
- Qwen occupancy
- cloud calls/cost
- documents processed per hour
- source elements processed per hour
- data points/relationships created per hour
- reports/evaluations completed per hour

## Learning loop

After an engagement:

1. Minerva independently grades performance.
2. Learning Dean creates a postmortem.
3. Weakness is classified as training, configuration, tool, code, or infrastructure gap.
4. Capability Architect only escalates genuine capability gaps.
5. Curriculum selection targets the weakness where appropriate.
6. Later cases provide before/after evidence.

Activity alone is not learning.
