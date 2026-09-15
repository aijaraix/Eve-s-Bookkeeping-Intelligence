# EVE BOOKKEEPING — OWNER APPROVAL & FINAL HANDOFF POLICY

## Objective

Minimize owner interruption without bypassing security, provider authorization or high-impact decision controls.

## Agent-authorized work

Work/Codex should proceed without repeatedly asking the owner for ordinary reversible engineering actions that are necessary to satisfy this package and are already within existing project access, including inspection, tests, log review, code repair on the working branch, non-destructive configuration diagnosis, safe service health checks and bounded acceptance tests.

Use existing authenticated connections and secret references where available. Never reveal secret values.

## Owner-only blockers

Interrupt the owner only when at least one of the following is true:

1. **Interactive provider authorization:** the provider requires the owner to sign in, consent, approve OAuth, approve a device/session, or complete MFA.
2. **Genuinely missing secret:** a required credential does not exist in any authorized current environment and cannot be created/recovered by the available authorized tooling.
3. **Destructive/irreversible action:** deletion of production data, destructive migration, credential revocation/rotation with material blast radius, or irreversible infrastructure change.
4. **New material cost/commitment:** creation of paid infrastructure or a material spend increase not already authorized.
5. **External/financial action:** sending externally consequential communications, moving money, filing/submitting to authorities, or other action requiring owner/business authorization.
6. **Professional sign-off:** CPA/auditor certification, attestation or other licensed professional approval.
7. **Material scope/business decision:** two technically valid paths materially change product behavior, compliance posture, customer experience or cost and the existing directive does not choose between them.

A mere tool error, expired session, missing UI visibility, deployment failure or unfamiliar configuration is not automatically an owner-only blocker. Diagnose first.

## How to ask the owner

When owner action is unavoidable, present one compact request:

- **Action needed:** exact approval/action.
- **Why:** why an agent cannot lawfully/technically complete it.
- **Already verified:** evidence that existing configuration/credentials were checked first.
- **Scope/risk:** what the approval permits and does not permit.
- **After approval:** state that execution will resume from the current checkpoint; do not restart.

Do not ask the owner to copy passwords, API keys, private keys or client secrets into chat.

## Final owner handoff

The final report must be usable without reading raw logs. Include:

- final verdict;
- current remote Git SHA and deployed build/SHA;
- production topology summary;
- Company 1 state and what was physically proven;
- persistence/restart result;
- scheduler/queue/worker result;
- model execution result;
- Hermes/OpenClaw result where required;
- review/professional-approval state;
- owner-facing URLs/entry points available from the environment, without exposing secret/admin tokens;
- remaining limitations or intentionally disabled features;
- exact actions the owner must still approve, if any;
- evidence index pointing to sanitized acceptance artifacts.

## Definition of a clean handoff

A clean handoff means the owner does not need to reconstruct engineering history, rerun setup, manually reconcile Git vs deployment, or guess whether a green status is real. The final report should say what works, what is deliberately gated, what remains, and provide evidence sufficient for another engineer/agent to continue without restarting.