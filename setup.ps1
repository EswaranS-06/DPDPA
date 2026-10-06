<#
.SYNOPSIS
  DUATF self-audit edition: install, update and look after an installation on Windows.

.DESCRIPTION
  Linux and macOS: use setup.sh. Commands:
    install    Fetch the code (or use this folder), install dependencies, set up the services,
               database, knowledge base and first administrator, build and start
    update     Pull the latest code, install dependencies, migrate, update the knowledge base, rebuild and restart
    pull       Pull the latest code only (fast-forward), without rebuilding
    repair     Reinstall dependencies, recreate missing settings, databases and buckets,
               migrate, rebuild and restart (data is kept)
    switch     Move to another branch (-Branch NAME), then update
    start, stop, restart, status, logs [web|api], account, backup, doctor
    uninstall  Stop the apps and the services this installer started (-Purge also deletes data)

.EXAMPLE
  .\setup.ps1 install -Username auditor -Name "ComplyX Auditor"
.EXAMPLE
  .\setup.ps1 update
.EXAMPLE
  .\setup.ps1 logs web -Lines 100
#>
param(
  [Parameter(Position = 0)][string]$Command = 'help',
  [Parameter(Position = 1)][string]$Target,
  [string]$Dir,
  [string]$Branch = 'self-audit',
  [string]$Repo = 'https://github.com/EswaranS-06/DPDPA.git',
  [ValidateSet('docker', 'external')][string]$Services,
  [int]$WebPort,
  [int]$ApiPort,
  [string]$HostIp,
  [string]$Username,
  [string]$Name,
  [string]$Out,
  [int]$Lines,
  [switch]$Purge,
  [switch]$Help
)

$ErrorActionPreference = 'Stop'

function Show-Usage {
  Write-Host @'
DUATF self-audit setup (Windows)

  .\setup.ps1 <command> [options]

Commands
  install     Fetch the code (or use this folder), install dependencies, set up the services,
              database, knowledge base and first administrator, build and start
  update      Pull the latest code, install dependencies, migrate, update the knowledge base, rebuild and restart
  pull        Pull the latest code only (fast-forward), without rebuilding
  repair      Reinstall dependencies, recreate missing settings, databases and buckets,
              migrate, rebuild and restart (data is kept)
  switch      Move to another branch (-Branch NAME), then update
  start | stop | restart | status
  logs        [web|api] [-Lines N]
  account     Create or reset an administrator (-Username NAME -Name "Shown name")
  backup      Dump the database to backups\ (-Out DIR)
  doctor      Check prerequisites, services, ports and the apps
  uninstall   Stop the apps and the services this installer started (-Purge also deletes data)

Options
  -Dir PATH        Installation folder (default: this folder if it holds DUATF, else .\DPDPA)
  -Branch NAME     Branch to install or switch to (default: self-audit; main is the LTS)
  -Repo URL        Git remote (default: https://github.com/EswaranS-06/DPDPA.git)
  -Services MODE   docker (run Postgres, Redis and MinIO in Docker Desktop) or external
  -WebPort N       Web port (default 53500)     -ApiPort N   API port (default 54500)
  -HostIp IP       Address other machines use to reach this one (default: detected)
  -Username NAME   Administrator login for install/account;  -Name "Shown name"
  -Purge           With uninstall: also delete the service data volumes
'@
}

function Fail([string]$Message) { Write-Host "x $Message" -ForegroundColor Red; exit 1 }
function Say([string]$Message) { Write-Host "> $Message" -ForegroundColor Cyan }

function Need([string]$Tool, [string]$Hint) {
  if (-not (Get-Command $Tool -ErrorAction SilentlyContinue)) { Fail "$Tool is needed. $Hint" }
}

function Test-Node {
  Need 'node' 'Install Node.js 22 or later (https://nodejs.org).'
  $major = [int](& node -p "process.versions.node.split('.')[0]")
  if ($major -lt 22) { Fail "Node.js 22 or later is needed (found $(& node -v))." }
  Need 'corepack' 'Corepack comes with Node.js 22; reinstall Node.js.'
}

if ($Help -or $Command -in @('help', '-h', '--help')) { Show-Usage; exit 0 }

if (-not $Dir) {
  if (Test-Path (Join-Path $PSScriptRoot 'pnpm-workspace.yaml')) { $Dir = $PSScriptRoot }
  else { $Dir = Join-Path (Get-Location) 'DPDPA' }
}

# The options handed on to `pnpm duatf`.
$pass = @()
if ($Target) { $pass += $Target }
if ($Services) { $pass += @('--services', $Services) }
if ($WebPort) { $pass += @('--web-port', "$WebPort") }
if ($ApiPort) { $pass += @('--api-port', "$ApiPort") }
if ($HostIp) { $pass += @('--host-ip', $HostIp) }
if ($Username) { $pass += @('--username', $Username) }
if ($Name) { $pass += @('--name', $Name) }
if ($Out) { $pass += @('--out', $Out) }
if ($Lines) { $pass += @('--lines', "$Lines") }
if ($Purge) { $pass += '--purge' }

function Invoke-Pnpm([string[]]$Arguments) {
  Push-Location $Dir
  try {
    & corepack pnpm @Arguments
    if ($LASTEXITCODE -ne 0) { Fail "pnpm $($Arguments -join ' ') failed (exit $LASTEXITCODE)." }
  } finally { Pop-Location }
}

function Invoke-Duatf([string]$Sub) { Invoke-Pnpm (@('duatf', $Sub) + $pass) }

function Invoke-Git([string[]]$Arguments) {
  & git @Arguments
  if ($LASTEXITCODE -ne 0) { Fail "git $($Arguments -join ' ') failed." }
}

function Get-Code {
  Need 'git' 'Install Git for Windows (https://git-scm.com).'
  if (Test-Path (Join-Path $Dir '.git')) { Say "Using the code in $Dir" }
  else {
    Say "Cloning $Repo ($Branch) into $Dir"
    Invoke-Git @('clone', '--branch', $Branch, $Repo, $Dir)
  }
}

function Update-Code {
  if (-not (Test-Path (Join-Path $Dir '.git'))) { Fail "$Dir is not a git checkout; run install first." }
  $changes = & git -C $Dir status --porcelain --untracked-files=no
  if ($changes) { Fail "There are local changes in $Dir; commit or stash them first (git -C $Dir status)." }
  Say "Pulling $(& git -C $Dir rev-parse --abbrev-ref HEAD)"
  Invoke-Git @('-C', $Dir, 'fetch', '--prune')
  Invoke-Git @('-C', $Dir, 'pull', '--ff-only')
  & git -C $Dir log -1 --format='Now at %h %s (%cr)'
}

function Test-WantsDocker {
  if ($Services -eq 'external') { return $false }
  $envFile = Join-Path $Dir 'infra\.env'
  if ((Test-Path $envFile) -and -not (Select-String -Path $envFile -Pattern '^DUATF_SERVICES=docker' -Quiet)) {
    return $false
  }
  return $true
}

switch ($Command) {
  'install' {
    Test-Node
    Get-Code
    if (Test-WantsDocker) { Need 'docker' 'Install Docker Desktop (or use -Services external with your own services).' }
    Say 'Installing dependencies'
    Invoke-Pnpm @('install', '--frozen-lockfile')
    Invoke-Duatf 'install'
  }
  'update' {
    Test-Node
    Update-Code
    Say 'Installing dependencies'
    Invoke-Pnpm @('install', '--frozen-lockfile')
    Invoke-Duatf 'update'
  }
  'pull' {
    Need 'git' 'Install Git for Windows.'
    Update-Code
  }
  'repair' {
    Test-Node
    Say 'Reinstalling dependencies'
    Invoke-Pnpm @('install', '--force')
    Invoke-Duatf 'repair'
  }
  'switch' {
    Test-Node
    if (-not (Test-Path (Join-Path $Dir '.git'))) { Fail "$Dir is not a git checkout." }
    Invoke-Git @('-C', $Dir, 'fetch', '--prune')
    Invoke-Git @('-C', $Dir, 'checkout', $Branch)
    Update-Code
    Invoke-Pnpm @('install', '--frozen-lockfile')
    Invoke-Duatf 'update'
  }
  'uninstall' {
    Test-Node
    Invoke-Pnpm @('duatf', 'stop')
    $down = @('duatf', 'services', 'down')
    if ($Purge) { $down += '--purge' }
    Invoke-Pnpm $down
  }
  { $_ -in @('start', 'stop', 'restart', 'status', 'logs', 'account', 'backup', 'doctor', 'env', 'services', 'db', 'kb', 'build', 'storage') } {
    Test-Node
    Invoke-Duatf $Command
  }
  default { Show-Usage; Fail "Unknown command `"$Command`"." }
}
