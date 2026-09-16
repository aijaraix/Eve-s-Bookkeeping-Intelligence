# Runtime Baseline — 2026-09-15 / 2026-09-16 UTC

Task: `EVE-P0-003`
Status: DONE
Audit mode: read-only physical runtime inspection through SentinelX/k3s

## Cluster / services

Namespace: `environment-6a9b1274a34c009752279011`

Physically observed deployments, all READY 1/1 and running with current pods at zero restarts:

- `eve-extraction-worker`
- Eve local AI (`service-6a9b12c839c2940e7ee0c98d`)
- Eve OpenClaw (`service-6a9b12d039c2940e7ee0c99b`)
- Eve web/intelligence (`service-6a9b137139c2940e7ee0c9c7`)
- Eve Hermes core (`service-6a9b137939c2940e7ee0c9d6`)

Observed web pod:
`service-6a9b137139c2940e7ee0c9c7-7c8f857977-zf2fn`

Observed Hermes pod:
`service-6a9b137939c2940e7ee0c9d6-78d4bd6d76-kzxgp`

## Persistence markers

Web `/storage` physically contains persistent CPA memory, Academy UI evidence, reports, extraction/task/job caches and protected regression evidence.

Hermes `/opt/data` physically contains Academy cases/runs/screenshots/learning files, runtime browser scripts, scheduler state, cron job records and cron outputs.

This supports the prior conclusion that Academy/runtime evidence is surviving service replacement rather than existing only in process memory.

## Academy scheduler

Physical scheduler store: `/opt/data/cron/jobs.json`

Observed exactly one job:

- id: `e9c9dd128ba4`
- name: `Eve-Academy-UI`
- enabled: `true`
- schedule: interval every 5 minutes
- last_status: `ok`

Latest physically observed cron output at audit time:

`/opt/data/cron/output/e9c9dd128ba4/2026-09-16_00-25-50.md`

Recorded run metadata:

- Run Time: `2026-09-16 00:25:50`
- Mode: `no_agent (script)`
- Status: `silent (empty output)`

The empty output is not an error; scheduler metadata reports the job's last status as `ok`.

## Domain / route status

Physically requested from the runtime host:

- `https://evesbookkeeping.com/` → HTTP 200
- `https://www.evesbookkeeping.com/` → canonicalized to `https://evesbookkeeping.com/`, HTTP 200
- `https://app.evesbookkeeping.com/login` → HTTP 200
- `https://owner.evesbookkeeping.com/login` → HTTP 200
- `https://eves-hermes.zeabur.app/` → HTTP 200 after redirect to `/login?next=%2F`

## Environment observations

Web exposes the expected service-address environment names and `ACADEMY_AUTONOMOUS_ENABLED`, but the value was intentionally not printed during this audit.

Hermes exposes `ACADEMY_AUTONOMOUS_ENABLED`, Hermes runtime variables and the expected Eve service host variables. Secret values were not printed.

Hermes persisted config still exposes a non-secret dashboard username marker of `eve-admin`. This confirms the advanced Hermes credential path remains separate from the Eve owner-account identity system and still needs dedicated closeout if the owner wants the requested email-style Hermes username.

## Outstanding baseline items

Not changed during this read-only audit:

- persistent requested development PIN state
- Hermes advanced-dashboard username/password state
- source deployment fingerprint reconciliation (`SOURCE_GIT_COMMIT_SHA` has historically been stale and is not trusted alone)

These remain separate access-cleanup tasks and do not invalidate the normal owner/customer account foundation.

## Conclusion

`EVE-P0-003_RUNTIME_BASELINE = PASS`

At this checkpoint:

- core services are running
- web and Hermes pods show zero restarts
- persistent evidence exists
- one and only one Academy scheduler job is enabled
- Academy scheduler last status is ok
- cron continues firing every 5 minutes
- public/customer/owner/Hermes routes are reachable over HTTPS

No production state was mutated by this audit.
