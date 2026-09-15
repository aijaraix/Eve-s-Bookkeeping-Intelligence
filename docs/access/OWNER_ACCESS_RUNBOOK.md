# Owner access continuation

Baseline: Academy accepted through main d03b03ebf0d4c75bbbc15e47369cc08e9b20a7f3. Preserve Pfizer workspace ws-1789404405588. Do not repeat intake/extraction or create another Academy scheduler.

## Account service

The service persists account hashes, sessions, tenant/workspace assignments, failed-login counters and audit records in storage/identity/accounts.json. Storage must remain on the existing persistent volume. All changes take an exclusive filesystem lock and fsync the replacement and directory. A stale lock after an interrupted write deliberately fails closed: inspect the file and running processes before removing a stale write.lock. This is a single-volume deployment; do not scale to disconnected identity stores.

Build runs scripts/build-access.mjs and includes dist/owner-account.cjs. From protected deployment administration, bootstrap exactly once:

    node dist/owner-account.cjs bootstrap <owner-email> /private/owner-setup.json

Use an absolute private directory, mode 0700, outside the static web root. Output is mode 0600 and never printed. Deliver its content privately once, then remove the delivered credential file. The application retains only the scrypt hash. Invitations expire in 24 hours and are consumed at first successful login. That session can only choose a permanent password for 30 minutes; permanent-password submission revokes every prior session. Codex must not choose or know the owner's permanent password.

Protected recovery, after independently verifying the owner:

    node dist/owner-account.cjs reset <owner-email> /private/owner-setup.json

Recovery revokes all sessions and issues a new single-use password. Automatic email delivery is not enabled: physical environment inspection found no configured RESEND_API_KEY or SMTP_HOST. Do not invent a delivered email.

## Authorization

OWNER and PLATFORM_ADMIN can administer account invitations, resets, session revocation and tenant assignments. INTERNAL_OPERATOR can inspect platform work but not account administration. CPA_REVIEWER, CLIENT_ADMIN, CLIENT_USER and READ_ONLY require a tenant. A workspace can be assigned to only one tenant and must be classified CUSTOMER. Customer endpoints use a field projection and default-deny every legacy/global route, including raw reviewer, job and infrastructure APIs. No account role grants professional approval; existing professional authority-provider verification remains separate.

Customer portal currently supports scoped reading of assigned documents, supported values/source quotes, explicitly customer-visible findings and PDF drafts. New uploads and additional customer mutations are not enabled in this foundation. Owner operations reuse the existing accounting UI through deep links.

## URLs

/public: public foundation; /login: account login; /owner: owner control center; /portal: customer workspace; /account: account and session management. /operator-login remains the existing independent temporary PIN fallback.

Host routing: apex -> public home, www root -> apex, app -> customer portal/login, owner -> owner portal/login. No agents custom hostname is required.

## Deployment and physical checks still required

1. Review source and run npm run test:access, tsc --noEmit, and npm run build.
2. Deploy via the existing reviewed GitHub/Zeabur path.
3. Set the requested EVE_OPERATOR_PIN in Zeabur persistent service configuration, never source or a pod-only environment. Update the existing Hermes protected operator.pin in coordination, under the same execution lock, or use a persistent Hermes secret; preserve its 0600 permissions. Do not modify PASSWORD.
4. Bootstrap owner through the protected command, verify single-use login and mandatory setup. Owner selects permanent password privately.
5. Configure Hermes' supported dashboard identity provider, preserving its separate infrastructure secrets; verify its login.
6. Run the existing browser operator against the saved Academy intake on both viewports. Resume only; no upload/extraction rerun. Keep native cron e9c9dd128ba4 as the single authority.
7. Recheck Pfizer using /storage/academy-ui-evidence/protected-state.cjs against pfizer-before.json; save a new manifest without rewriting baseline evidence.
8. Complete custom DNS only after destination registration; verify HTTPS and redirects.

The owner Academy section reads existing engagement receipts. Live native scheduler/browser learning status still needs a supported read-only feed from Hermes; it must not report the unrelated legacy heartbeat as that scheduler.

## Security and acceptance

No credential belongs in GitHub, logs, screenshots or public reports. Session cookies are Secure/HttpOnly/SameSite=Strict and host-only. Password/login pages have a restrictive CSP; mutations require same origin and a session CSRF token. New account tests use temporary isolated state and do not write accounting evidence.

Never report EVE_ACCESS_AND_PORTAL_READY from source tests alone. Owner account, temporary PIN, Hermes login, account change and final production/browser regressions require physical proof.
