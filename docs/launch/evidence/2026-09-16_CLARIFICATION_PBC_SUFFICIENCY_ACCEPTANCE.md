# EVE-P1-010 — Clarification / PBC Linked to Task Evidence Sufficiency Acceptance

Date: 2026-09-16 UTC

Feature branch: `feature/universal-evidence-ocr-foundation`

Accepted implementation checkpoint before this evidence record:

`17e0711845d34df33a8dc9a83d253bd47df98336` — `Link clarification PBC lifecycle to task evidence sufficiency`

Status: **ACCEPTED CANDIDATE ON FEATURE BRANCH — NOT YET MERGED INTO MAIN APPLICATION CODE**

## Purpose

P1-010 closes the evidence-gap workflow between P1-009 task sufficiency and Eve's existing durable professional clarification system.

Permanent chain:

`P1-009 sufficiency decision -> exact gap -> affected conclusion(s) -> durable professional clarification/PBC request -> authenticated response + response evidence -> new P1-009 re-evaluation -> resolve only when the affected conclusion(s) are actually allowed`

A customer response is evidence. It is **not** by itself proof that a blocked accounting/document conclusion is now safe.

## Existing system extended, not duplicated

P1-010 extends:

`server/cpaOrganization/professionalClarificationEngine.ts`

It does not create a second clarification queue.

The pre-existing legacy `/api/cpa/pbc/*` routes remain tied to the synthetic engagement engine and were not repurposed as production evidence routes.

The real P1-010 workflow is exposed through new `/api/cpa/professional-clarifications/*` routes backed by the durable `ProfessionalClarificationEngine`.

## Clarification kinds

Linked clarification requests now distinguish:

- `PBC_EVIDENCE_REQUEST`
- `INTERNAL_MATERIALITY_REVIEW`
- `CPA_REVIEW`
- `GENERAL_CLARIFICATION` for existing/non-P1-010 uses

Routing policy:

- a material client-evidence gap such as missing pages, missing transaction ranges, unreadable/OCR evidence, unsupported source evidence or an explicitly missing required evidence capability becomes `PBC_EVIDENCE_REQUEST`, assigned to `CLIENT_CONTROLLER`;
- unknown materiality becomes `INTERNAL_MATERIALITY_REVIEW`, assigned to `AUDIT_MANAGER`;
- a material issue that is not a client-evidence acquisition gap becomes `CPA_REVIEW`, assigned to `CPA_PARTNER`.

This routing is derived from the P1-009 gap/materiality assessment rather than guessed from free text.

## Exact P1-009 linkage

Each P1-010 request may preserve a `SufficiencyClarificationLink` containing:

- source P1-009 decision ID;
- source decision hash;
- source task ID;
- exact gap IDs;
- exact affected conclusion IDs;
- source evidence references;
- materiality at creation;
- re-evaluation decision IDs;
- latest re-evaluation decision ID;
- resolved gap IDs;
- unresolved gap IDs.

This prevents a clarification response for one gap/task from silently clearing another conclusion.

## One request per concrete gap

P1-010 creates one durable request per actionable P1-009 gap rather than combining unrelated ambiguity into one vague PBC item.

Creation is idempotent for the same source decision + same gap. Re-running request creation returns the existing non-withdrawn request rather than creating duplicates.

## Lifecycle

The linked lifecycle records durable events including:

- `CREATED`
- `SUBMITTED_TO_CLIENT`
- `RESPONSE_RECEIVED`
- `REEVALUATED`
- `FOLLOW_UP_REQUIRED`
- `RESOLVED`

Each event carries actor/time and may carry evidence references and decision IDs.

### Important send boundary

`SUBMITTED_TO_CLIENT` is currently a recorded workflow state only.

The implementation explicitly states that marking a PBC submitted does **not** imply that an email, portal notification, or other transport action was physically sent.

Actual customer notification/delivery is a later workflow integration and must not be claimed by this acceptance.

## Response behavior

For linked PBC evidence requests:

- a response is rejected before the request is in `SUBMITTED_TO_CLIENT` state;
- narrative response is required;
- supporting document IDs and evidence references are durably recorded;
- the response actor comes from server authentication at the HTTP boundary, not from a body-supplied `respondedBy` value;
- a received PBC response becomes `RESPONSE_RECEIVED`, not `RESOLVED`;
- API response explicitly indicates `reevaluationRequired: true`.

This fixes the prior over-aggressive behavior where `respondToClarification()` immediately resolved a request.

For backwards compatibility, the existing legacy `respondToClarification()` method still retains its historical immediate-resolution behavior for existing/unlinked callers. New P1-010 workflows use the stricter `recordClarificationResponse(... resolveImmediately: false)` path.

## Re-evaluation and clearance rules

A P1-010 request can be linked only to a persisted P1-009 decision that:

- has the same task ID;
- has the same engagement when the original task established one;
- has the same workspace when the original task established one;
- does not predate the source decision;
- contains all affected conclusions referenced by the clarification.

The clarification is resolved only when **every affected conclusion is `ALLOWED`** in the linked P1-009 re-evaluation.

If an affected conclusion remains `BLOCKED_INSUFFICIENT` or `REVIEW_REQUIRED`:

- the request is not resolved;
- follow-up count increments;
- the request stays in client-submitted or internal-review state as appropriate;
- a `FOLLOW_UP_REQUIRED` lifecycle event is recorded.

An unrelated task decision cannot clear the request.

## Operational CPA API

Feature-branch routes:

### Read

- `GET /api/cpa/professional-clarifications`
- `GET /api/cpa/professional-clarifications/:requestId`

Readback requires authenticated internal-operator authority at this stage.

### Create from P1-009

- `POST /api/cpa/professional-clarifications/from-sufficiency/:decisionId`

Requires authenticated internal-operator authority.

### Mark PBC workflow submission state

- `POST /api/cpa/professional-clarifications/:requestId/submit`

Requires authenticated internal-operator authority.

This route changes durable workflow state only; it does not claim a transport/send action.

### Record response

- `POST /api/cpa/professional-clarifications/:requestId/respond`

Requires an authenticated principal. The principal must be an internal operator or be authorized for the request's engagement.

The persisted responder identity is derived from the authenticated server context. Request-body identity cannot override it.

### Link P1-009 re-evaluation

- `POST /api/cpa/professional-clarifications/:requestId/link-reevaluation`

Requires authenticated internal-operator authority.

## Tests physically passed

GitHub Actions run:

`35051920926`

Physical result:

**PASS**

Passing gates included:

- P1-010 clarification coordinator contract;
- P1-010 clarification route/auth contract;
- P1-009 task evidence sufficiency regression;
- universal source evidence regression;
- spreadsheet source-to-pixel regression;
- OCR parser evidence regression;
- presentation adapter regression;
- full production build;
- successful commit of the tested implementation;
- removal of temporary one-shot patch/test/workflow machinery.

Key behavioral tests physically covered:

1. material missing transaction evidence creates a PBC request linked to the exact gap and affected ledger conclusion;
2. rerunning creation does not duplicate the request;
3. PBC response before submission state is rejected;
4. response evidence is persisted and the request remains `RESPONSE_RECEIVED`;
5. a re-evaluation that still blocks the conclusion does not resolve the PBC and creates follow-up;
6. a later matching re-evaluation with the affected conclusion `ALLOWED` resolves the request;
7. a true unknown-materiality missing-page case produces internal materiality review instead of client-PBC spam;
8. an unrelated task's decision cannot resolve a linked clarification;
9. legacy immediate-resolution clarification behavior remains compatible;
10. unauthenticated clarification creation is rejected;
11. request-body responder identity cannot spoof the authenticated responding principal.

## Initial failed test was policy-correct

The first P1-010 CI run (`35051847267`) stopped at one new test because the test expected `INTERNAL_MATERIALITY_REVIEW`, while P1-009 correctly classified the scenario as material: the test task explicitly required a complete transaction population and the source page was missing.

The production rule was not weakened. The test was corrected to use a balance-verification task without a complete-population requirement, where unknown missing-page content appropriately remains `UNKNOWN` and routes to internal materiality review.

The corrected run `35051920926` passed all gates.

## Protected-state confirmation

This work did not:

- rerun Pfizer / Company 1;
- alter Pfizer facts;
- replace Hermes;
- create a second Academy scheduler;
- merge application code into `main`;
- expose OCR publicly;
- create a second clarification/PBC persistence system;
- repurpose synthetic engagement PBC routes as production evidence routes;
- claim that PBC submission state means an external message was sent;
- allow AI/customer response alone to clear a blocked conclusion without P1-009 re-evaluation.

## Result

**EVE-P1-010 CLARIFICATION / PBC SUFFICIENCY LIFECYCLE: ACCEPTED CANDIDATE ON FEATURE BRANCH**

The immediate intelligence/evidence foundation now has:

1. universal source-to-real-presentation lineage;
2. local OCR with exact image-region provenance;
3. source completeness vs task evidence sufficiency;
4. durable clarification/PBC resolution tied back to sufficiency re-evaluation.

Production application activation remains behind controlled review/merge/release of draft PR #31.
