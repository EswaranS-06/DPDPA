#!/usr/bin/env bash
# Starts, stops or restarts the built web (:53000) and API (:54000) apps, bound to 0.0.0.0.
# Usage: infra/run-app.sh start|stop|restart|status   (build first: pnpm build)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .run
# shellcheck disable=SC1091
. "$HOME/.nvm/nvm.sh" >/dev/null

stop_one() {
  local name=$1
  if [ -f ".run/$name.pid" ]; then
    local pid
    pid=$(cat ".run/$name.pid")
    if kill -0 "$pid" 2>/dev/null; then
      kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
      for _ in 1 2 3 4 5 6 7 8 9 10; do kill -0 "$pid" 2>/dev/null || break; sleep 0.5; done
    fi
    rm -f ".run/$name.pid"
  fi
}

start_one() {
  local name=$1 package=$2
  NODE_ENV=production setsid nohup pnpm --filter "$package" start >".run/$name.log" 2>&1 &
  echo $! >".run/$name.pid"
}

status() {
  for name in api web; do
    if [ -f ".run/$name.pid" ] && kill -0 "$(cat ".run/$name.pid")" 2>/dev/null; then
      echo "$name running (pid $(cat ".run/$name.pid"), log .run/$name.log)"
    else
      echo "$name stopped"
    fi
  done
}

case "${1:-status}" in
  start | restart)
    stop_one web
    stop_one api
    start_one api @duatf/backend
    start_one web @duatf/web
    sleep 3
    status
    ;;
  stop)
    stop_one web
    stop_one api
    status
    ;;
  status) status ;;
  *)
    echo "Usage: $0 start|stop|restart|status" >&2
    exit 64
    ;;
esac
