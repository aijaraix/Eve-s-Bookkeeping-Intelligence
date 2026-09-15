#!/bin/bash
set -euo pipefail
# Install this source-managed launcher under HERMES_HOME/scripts and register
# exactly one native `hermes cron create ... --script academy-ui-cron.sh --no-agent`.
EVE_ACADEMY_ROOT="${HERMES_HOME:-/opt/data}/academy-ui"
cd "$EVE_ACADEMY_ROOT/runtime"
export EVE_ACADEMY_STATE_DIR="$EVE_ACADEMY_ROOT"
export EVE_OPERATOR_PIN_FILE="$EVE_ACADEMY_ROOT/runtime/operator.pin"
export EVE_APP_BASE_URL="${EVE_APP_BASE_URL:-https://eves-worker.zeabur.app}"
export EVE_RUNTIME_ENV="${EVE_RUNTIME_ENV:-production}"
export EVE_ACADEMY_LOCK_HELD=1
exec flock -n "$EVE_ACADEMY_ROOT/execution.lock" node academy-ui-tick.cjs
