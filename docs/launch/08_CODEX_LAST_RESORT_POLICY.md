# 08 — Codex Last-Resort Policy

## Objective

Minimize Codex usage by completing every task possible through direct architecture, GitHub changes, runtime inspection, bounded implementation and physical verification first.

Codex is not the default engineer for Eve Bookkeeping.

## Use current tools first

Before assigning work to Codex, attempt with:

- GitHub source inspection/search
- direct docs/schema/code edits through GitHub
- SentinelX/runtime inspection where connected
- existing server scripts/tests
- current Canva/brand asset connector where useful
- existing owner/customer application paths
- deterministic local test/build commands when available

## Appropriate CHATGPT_DIRECT work

Do not spend Codex credits on:

- architecture/product decisions
- backlog planning
- source-of-truth docs
- data contracts/interfaces
- content/copy/claim auditing
- parser/support inventories
- schema additions that are bounded and testable
- owner/customer read models
- small/medium React/server changes
- SEO/meta implementation
- test additions
- security review
- runtime audits
- Academy result analysis
- evidence/provenance modeling
- usage/entitlement design
- isolated repair patches
- GitHub organization/documentation

## Codex escalation criteria

A task may be moved to `CODEX_LAST_RESORT` only if at least one is true:

1. Required action needs a browser/control-plane capability unavailable to current tools and cannot be completed safely by the owner in a trivial step.
2. The change is a deeply coupled cross-repository/cross-service migration whose safe implementation requires broad autonomous code execution beyond available patch/edit tooling.
3. Reproducing/physically validating the behavior requires an execution environment that only Codex Work currently provides.
4. A current tool is blocked by permissions/security and there is no supported direct alternative.
5. A large refactor is proven necessary after smaller preservation-first changes have failed.

"This is faster in Codex" is not sufficient while credits are constrained.

## Required pre-Codex package

Before spending credits, prepare:

- exact current main SHA
- exact physical blocker
- files/services already inspected
- relevant launch-plan task IDs
- acceptance criteria
- no-go constraints
- test commands
- deployment target
- evidence that current tools cannot safely finish it

Codex prompt should be implementation-focused, not discovery-focused.

Preferred pattern:

> Continue from current remote HEAD. Read `docs/launch/00_START_HERE.md` through the relevant launch docs. Execute only task IDs X/Y/Z. Preserve all accepted architecture and protected evidence. Do not redesign. Physically verify the listed acceptance criteria and stop if owner action is genuinely required.

## Never give Codex a vague mandate

Avoid prompts such as:

- "finish Eve"
- "make the system production ready"
- "fix everything"
- "redesign the backend"

Those spend credits rediscovering decisions already made and increase regression risk.

## Owner-action preference

If a blocker is a one-time owner action such as entering a secret, approving OAuth/MFA, choosing commercial terms or granting processor authorization, prefer a concise owner instruction rather than a broad Codex run.

## Deployment/control-plane rule

Provider environment-variable/secret changes must use a supported persistent control-plane path. Do not fake completion by editing a running container when the change will disappear after replacement.

If current runtime tooling cannot mutate the provider control plane, document exactly what must be changed. Then choose between one owner action and a narrowly scoped Codex/browser task.

## Cost discipline

For every proposed Codex task, ask:

- can architecture be decided here first?
- can files be pre-written here?
- can tests/acceptance be specified here?
- can most code be committed here?
- can Codex be reduced to deployment/physical verification only?

The goal is not zero Codex forever. The goal is to reserve it for the small number of tasks where its environment materially adds capability.
