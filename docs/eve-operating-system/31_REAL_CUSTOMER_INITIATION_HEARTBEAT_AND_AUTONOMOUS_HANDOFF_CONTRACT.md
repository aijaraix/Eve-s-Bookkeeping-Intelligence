# 31 — Real Customer Initiation, Heartbeat & Autonomous Handoff Contract

**Status:** Authoritative execution contract for how a real/customer-simulated upload becomes autonomous CPA work.

## Purpose

Eve must begin accounting work because a real product event creates durable customer-priority work, not because Google or a test script directly calls an extraction/orchestration method. This document defines the production initiation and scheduling boundary.

## Customer start event

The authoritative customer start event is a successful submission through the same product intake path available to a real customer.

For browser certification, the Customer Simulator must physically:

1. open the deployed Eve application;
2. select/create the intended client/engagement context through the UI;
3. interact with the real file-input/dropzone control;
4. select the physical source artifact;
5. submit the upload through the product's normal HTTP request;
6. receive a real server response;
7. confirm the uploaded bytes were persisted and independently hashed server-side.

Merely launching Chrome is insufficient. Recording an action string such as `Physical File Selection` without manipulating the DOM/file input is insufficient. Assigning the pre-upload hash to an `intakeSha256` field without reading/hash-verifying server-received bytes is insufficient.

## Source acquisition is separate from customer initiation

For public-company Academy trials, an autonomous Source Acquisition service may discover and download an authoritative filing. Its output is a source artifact and custody manifest.

Source Acquisition must **not** invoke extraction directly.

Its handoff is:

`SOURCE ACQUISITION → CUSTOMER-SIDE STAGING → CUSTOMER SIMULATOR → REAL UI UPLOAD`

Only the upload creates the customer-priority intake job.

## Immediate customer-priority path

Customer work is not governed by Academy idle cooldowns.

After successful upload:

`UPLOAD ACK → INTAKE SESSION PERSISTED → CUSTOMER_PRIORITY_JOB CREATED → QUEUE ACKNOWLEDGED → HERMES OBSERVES PENDING CUSTOMER WORK → ACADEMY PREEMPTED IF NECESSARY → DOCUMENT INTELLIGENCE JOB DISPATCHED`

The upload handler should normally enqueue the durable customer job immediately. The 15-second heartbeat is a supervisory/recovery boundary, not an excuse to delay customer work for 30–120 minutes.

If immediate dispatch fails but the durable queue event exists, the next healthy heartbeat must detect and recover it. Under normal healthy conditions, the maximum scheduler-observation delay should therefore be approximately one heartbeat interval, while queue creation occurs synchronously with/just after intake persistence.

## Heartbeat semantics

A 15-second heartbeat means Eve reevaluates system state at that cadence. It does not mean every accounting stage must wait 15 seconds.

Heartbeat responsibilities include:

- detect customer-priority work;
- verify scheduler leadership/lease;
- preempt Academy background work;
- recover orphaned queued jobs;
- detect stalled stages;
- verify infrastructure health;
- advance only through actual dispatch/consumer acknowledgements;
- persist scheduler decisions and state.

A heartbeat status such as `START_NEW_CASE` is not execution. A real dispatch requires at minimum:

- schedulerDecisionId;
- jobId/executionId;
- producer service identity;
- intended consumer;
- input manifest/hash;
- dispatch timestamp;
- consumer acknowledgement timestamp;
- final result/failure state.

## Exactly-one dispatch authority

Only the elected authoritative scheduler/orchestrator may turn the customer-priority queue into CPA execution. Health tickers, observers, browser simulators, UI polling, Academy controllers, and Google may not independently dispatch the same conceptual work.

Leader/fencing requirements from Documents 24–28 apply.

## Intake custody contract

The source hash is recomputed at distinct physical boundaries. Do not copy one hash value into multiple fields and call that continuity.

Required boundaries when applicable:

- source acquisition bytes;
- customer staging bytes;
- browser-selected file bytes/metadata as observable;
- HTTP server-received upload bytes;
- persisted intake artifact;
- Document IR source artifact.

Each physically measurable boundary receives its own evidence record. Equality is verified after measurement.

## Extraction trigger contract

Document Intelligence receives the persisted intake artifact/reference through the production queue/handoff. It must not silently reread an unrelated local source path supplied by the test controller.

The authoritative input to extraction includes:

- tenant/workspace/client/engagement scope;
- documentId;
- intakeSessionId;
- persisted artifact locator;
- document SHA-256;
- MIME/type metadata;
- custody envelope/version;
- producer/consumer identities.

Missing material identity/hash/custody data is fail-closed.

## Project/entity placement

Extraction does not automatically mean final project placement. The pipeline must classify the document and resolve entity/period/project identity from evidence. If ambiguity exceeds safe thresholds, Eve creates a professional clarification/PBC requirement instead of guessing.

## Academy preemption

Real customer-priority jobs always outrank Academy work. Academy work may checkpoint and resume only after customer work is safely cleared. The preemption and resume states must be durable and observable.

## Acceptance proof

A supervised first-company trial passes this contract only if an external observer can trace one real source through the UI upload into a durable customer-priority job and then into Document Intelligence without a direct test-controller invocation of the extractor.
