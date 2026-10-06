#!/usr/bin/env bash
# DUATF self-audit edition: install, update and look after an installation on Linux or macOS.
# Windows: use setup.ps1. Run ./setup.sh help for the commands.
set -euo pipefail

REPO_URL="${DUATF_REPO:-https://github.com/EswaranS-06/DPDPA.git}"
BRANCH="${DUATF_BRANCH:-self-audit}"
DIR=""
COMMAND="${1:-help}"
[ $# -gt 0 ] && shift
PASS=()

usage() {
  cat <<'TEXT'
DUATF self-audit setup (Linux and macOS)

  ./setup.sh <command> [options]

Commands
  install     Fetch the code (or use this folder), install dependencies, set up the services,
              database, knowledge base and first administrator, build and start
  update      Pull the latest code, install dependencies, migrate, update the knowledge base, rebuild and restart
  pull        Pull the latest code only (fast-forward), without rebuilding
  repair      Reinstall dependencies, recreate missing settings, databases and buckets,
              migrate, rebuild and restart (data is kept)
  switch      Move to another branch (--branch NAME), then update
  start | stop | restart | status
  logs        [web|api] [--lines N]
  account     Create or reset an administrator (--username NAME --name "Shown name")
  backup      Dump the database to backups/ (--out DIR)
  doctor      Check prerequisites, services, ports and the apps
  uninstall   Stop the apps and the services this installer started (--purge also deletes data)

Options
  --dir PATH          Installation folder (default: this folder if it holds DUATF, else ./DPDPA)
  --branch NAME       Branch to install or switch to (default: self-audit; main is the LTS)
  --repo URL          Git remote (default: https://github.com/EswaranS-06/DPDPA.git)
  --services MODE     docker: run Postgres, Redis and MinIO in Docker (default for a new install)
                      external: use the services named in infra/.env
  --web-port N        Web port (default 53500)      --api-port N   API port (default 54500)
  --host-ip IP        Address other machines use to reach this one (default: detected)
  --username NAME     Administrator login for install/account; --name "Shown name"
  --purge             With uninstall: also delete the service data volumes
  -h, --help          This help
TEXT
}

die() {
  echo "✗ $*" >&2
  exit 1
}
say() { echo "▸ $*"; }

while [ $# -gt 0 ]; do
  case "$1" in
    --dir) DIR="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --repo) REPO_URL="$2"; shift 2 ;;
    -h | --help) usage; exit 0 ;;
    *) PASS+=("$1"); shift ;;
  esac
done

need() { command -v "$1" >/dev/null 2>&1 || die "$1 is needed. $2"; }

check_node() {
  need node "Install Node.js 22 or later (https://nodejs.org)."
  local major
  major=$(node -p 'process.versions.node.split(".")[0]')
  [ "$major" -ge 22 ] || die "Node.js 22 or later is needed (found $(node -v))."
  need corepack "Corepack comes with Node.js 22; reinstall Node.js."
}

wants_docker() {
  for arg in "${PASS[@]+"${PASS[@]}"}"; do [ "$arg" = "external" ] && return 1; done
  [ -f "$DIR/infra/.env" ] && ! grep -q '^DUATF_SERVICES=docker' "$DIR/infra/.env" && return 1
  return 0
}

resolve_dir() {
  if [ -z "$DIR" ]; then
    local here
    here="$(cd "$(dirname "$0")" && pwd)"
    if [ -f "$here/pnpm-workspace.yaml" ]; then DIR="$here"; else DIR="$(pwd)/DPDPA"; fi
  fi
}

pnpm_() { (cd "$DIR" && corepack pnpm "$@"); }
duatf() { pnpm_ duatf "$@" "${PASS[@]+"${PASS[@]}"}"; }

fetch_code() {
  need git "Install git."
  if [ -d "$DIR/.git" ]; then
    say "Using the code in $DIR"
  else
    say "Cloning $REPO_URL ($BRANCH) into $DIR"
    git clone --branch "$BRANCH" "$REPO_URL" "$DIR"
  fi
}

pull_code() {
  [ -d "$DIR/.git" ] || die "$DIR is not a git checkout; run install first."
  if [ -n "$(git -C "$DIR" status --porcelain --untracked-files=no)" ]; then
    die "There are local changes in $DIR; commit or stash them first (git -C $DIR status)."
  fi
  say "Pulling $(git -C "$DIR" rev-parse --abbrev-ref HEAD)"
  git -C "$DIR" fetch --prune
  git -C "$DIR" pull --ff-only
  git -C "$DIR" log -1 --format='Now at %h %s (%cr)'
}

resolve_dir
case "$COMMAND" in
  install)
    check_node
    fetch_code
    wants_docker && need docker "Install Docker (or use --services external with your own services)."
    say "Installing dependencies"
    pnpm_ install --frozen-lockfile
    duatf install
    ;;
  update)
    check_node
    pull_code
    say "Installing dependencies"
    pnpm_ install --frozen-lockfile
    duatf update
    ;;
  pull)
    need git "Install git."
    pull_code
    ;;
  repair)
    check_node
    say "Reinstalling dependencies"
    pnpm_ install --force
    duatf repair
    ;;
  switch)
    check_node
    [ -d "$DIR/.git" ] || die "$DIR is not a git checkout."
    git -C "$DIR" fetch --prune
    git -C "$DIR" checkout "$BRANCH"
    pull_code
    pnpm_ install --frozen-lockfile
    duatf update
    ;;
  uninstall)
    check_node
    pnpm_ duatf stop
    pnpm_ duatf services down "${PASS[@]+"${PASS[@]}"}"
    ;;
  start | stop | restart | status | logs | account | backup | doctor | env | services | db | kb | build | storage)
    check_node
    duatf "$COMMAND"
    ;;
  help | -h | --help) usage ;;
  *)
    usage
    die "Unknown command \"$COMMAND\"."
    ;;
esac
