#!/usr/bin/env bash
# Kept for old habits: starts, stops or restarts the built apps through `pnpm duatf`.
# Usage: infra/run-app.sh start|stop|restart|status
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck disable=SC1091
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null
exec corepack pnpm --silent duatf "${1:-status}"
