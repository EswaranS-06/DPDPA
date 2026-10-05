#!/usr/bin/env bash
# Kept for old habits: writes .env from infra/.env through `pnpm duatf env` (no secrets printed).
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck disable=SC1091
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null
exec corepack pnpm --silent duatf env "$@"
