# EVE BOOKKEEPING — CODEX EXECUTION PLAYBOOK

## Mission

Finish and physically verify the existing system. Optimize for the shortest safe path from current truth to a durable, observable, decision-usable Eve Bookkeeping production state.

## Operating rules

### Inspect first
Do not edit until you know current remote HEAD, current deployed identity, current service topology and the real remaining blockers.

### Continue, never restart
Preserve legitimate newer work and customer evidence. Do not replace architecture because a fresh implementation would be easier.

### Reuse authentication and configuration
If an integration appears unavailable:
1. determine whether its service/configuration already exists;
2. inspect whether a credential reference/secret is already attached without exposing its value;
3. test the existing path safely;
4. repair routing/configuration/permissions where agent-authorized;
5. request owner intervention only when the provider truly requires interactive authorization, a secret is genuinely absent, or policy requires human approval.

Never ask the owner to paste a secret into chat.

## Execution phases

### Phase A — Establish physical truth
- Fetch current remote state and recent history.
- Detect legitimate commits newer than this package baseline.
- Identify deployment provider(s), project/service identities and deployed source/build identity.
- Inventory persistent storage, database(s), queues, scheduler(s), workers, Hermes, OpenClaw, Ollama/local AI and cloud-model configuration.
- Inspect Academy gate/state without changing it.
- Inspect Company 1 current workflow state and preserved evidence.
- Identify mocks, fixture-only paths, deterministic fallbacks and local filesystem dependencies that could masquerade as production behavior.
- Produce the source/runtime matrix required by `01_EVE_CURRENT_PHYSICAL_STATE.md`.

### Phase B — Reconcile and repair
Prioritize in this order:
1. deployment drift;
2. persistence/durability;
3. single scheduler authority and queue conservation;
4. worker reachability/processing;
5. real-model execution contracts;
6. Company 1 canonical continuation;
7. deliverable/review-package integrity;
8. observability and owner-facing retrieval;
9. non-blocking polish.

For each repair: state the proven defect, make the smallest safe change, add/extend a regression test where appropriate, run relevant tests, and preserve evidence.

### Phase C — Physical acceptance
Do not substitute unit tests for this phase.

Prove, as applicable to the authorized production scope:
- deployed source identity equals the intended current commit;
- service health after deployment;
- database/persistent-volume survival;
- scheduler has one intended authority;
- queue insertion, lease/claim, processing, acknowledgment and retry/dead-letter behavior conserve work;
- worker survives/reconnects after process or instance replacement;
- Hermes/OpenClaw paths are real and reachable where the architecture requires them;
- Ollama/Qwen real execution returns valid bounded structured output when selected;
- cloud-model execution is real when selected and usage metadata is truthful where available;
- `requireRealModel` or equivalent gates fail closed rather than silently fabricating success;
- Company 1 continues from preserved evidence rather than being recreated;
- canonical promotion remains evidence-gated;
- review artifacts remain hash/evidence-bound;
- professional approval state remains truthful and human-gated;
- owner-facing retrieval can locate the resulting work;
- required state survives a controlled restart/redeploy/replacement test.

### Phase D — Evidence package
Write/update a sanitized acceptance report in the working branch. Include immutable identities and record IDs but no secrets.

## Stop conditions

Do NOT stop for an agent-remediable failure. Repair and retest.

Stop and request owner action only for an OWNER-ONLY blocker defined in `04_OWNER_APPROVAL_AND_FINAL_HANDOFF.md`.

If a requested owner action is necessary, provide one compact approval/request at a time with: why it is necessary, what was already tried, exact scope, risk, and what execution resumes automatically after approval.

## Prohibited shortcuts

- changing health checks so they report green without fixing the dependency;
- bypassing canonical queues to invoke workers directly for acceptance;
- creating a fresh Company 1 fixture instead of continuing preserved work;
- using mocked AI output to satisfy a real-model gate;
- silently falling back from a required real model to deterministic output;
- writing durable state only to ephemeral container filesystem;
- claiming restart durability without forcing a real process/instance/revision replacement;
- marking professional certification/approval complete without authorized human sign-off;
- arming broader autonomy solely to demonstrate activity.

## Codex completion output

Provide Astra with:
- current source SHA;
- deployed SHA/build identity;
- topology inventory;
- changes made and why;
- tests run;
- physical acceptance evidence;
- known limitations;
- unresolved owner-only blockers, if any;
- explicit statement of anything not physically verified.