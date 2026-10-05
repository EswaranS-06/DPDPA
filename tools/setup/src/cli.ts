// The installer and operations command of the self-audit edition: pnpm duatf <command> [options]
// setup.sh (Linux, macOS) and setup.ps1 (Windows) fetch the code and dependencies, then call it.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import postgres from 'postgres'
import {
  ensureServiceEnv,
  installedSettings,
  parseEnvFile,
  writeAppEnv,
  type ServicesMode,
} from './env'
import { appStatus, logFile, portOpen, startApp, stopApp, type AppName } from './run'

const root = process.cwd()
if (!existsSync(join(root, 'pnpm-workspace.yaml'))) {
  console.error('Run this from the DUATF folder (where pnpm-workspace.yaml is).')
  process.exit(64)
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    services: { type: 'string' },
    'web-port': { type: 'string' },
    'api-port': { type: 'string' },
    database: { type: 'string' },
    'host-ip': { type: 'string' },
    username: { type: 'string' },
    name: { type: 'string' },
    out: { type: 'string' },
    lines: { type: 'string' },
    purge: { type: 'boolean', default: false },
    yes: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
})

const HELP = `DUATF self-audit: pnpm duatf <command> [options]

  install     Environment, services, database, knowledge base, build, first account, start
  update      Migrate the database, rebuild and restart (after the code was pulled)
  repair      Recreate what is missing (env, services, databases, buckets), migrate, rebuild, restart
  env         Write infra/.env (secrets, kept) and .env (generated)
  services    up | down | status   the Postgres, Redis and MinIO started by this installer
  db          Create the databases if missing, the app role, and run the migrations
  kb          Import the knowledge base and publish the release with the question templates
  storage     Create the evidence buckets
  account     Create or reset an administrator: --username NAME --name "Shown name"
  build       Build the web and API apps
  start | stop | restart | status
  logs        [web|api] [--lines N]
  backup      Dump the database to backups/ (--out DIR)
  doctor      Check versions, services, ports and the apps

Options: --services docker|external  --web-port N  --api-port N  --database NAME
         --host-ip IP  --username NAME  --name "Name"  --purge  --yes`

const fail = (message: string): never => {
  console.error(`✗ ${message}`)
  process.exit(1)
}
const step = (message: string) => console.log(`\n▸ ${message}`)

const run = (
  cmd: string,
  args: string[],
  options: { allowFail?: boolean; quiet?: boolean } = {},
) => {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: options.quiet ? 'pipe' : 'inherit',
    shell: process.platform === 'win32' && !cmd.endsWith('.exe') && cmd !== process.execPath,
    encoding: 'utf8',
  })
  if (result.status !== 0 && !options.allowFail) {
    fail(`${cmd} ${args.join(' ')} failed (exit ${result.status ?? 'none'}).`)
  }
  return result
}

/** pnpm, through the one running this command when there is one, else through corepack. */
const pnpm = (args: string[], options: { allowFail?: boolean; quiet?: boolean } = {}) => {
  const execPath = process.env.npm_execpath
  return execPath && /pnpm/i.test(execPath)
    ? run(process.execPath, [execPath, ...args], options)
    : run('corepack', ['pnpm', ...args], options)
}

/** A TypeScript tool of the repository, run with tsx. */
const tool = (file: string, args: string[] = [], options: { allowFail?: boolean } = {}) =>
  run(process.execPath, ['--import', 'tsx', join(root, file), ...args], options)

const settings = () => {
  const installed = installedSettings(root)
  return {
    webPort: Number(values['web-port'] ?? installed?.webPort ?? 53500),
    apiPort: Number(values['api-port'] ?? installed?.apiPort ?? 54500),
    database: values.database ?? installed?.database ?? 'duatf_self',
  }
}

/**
 * docker: this installer runs Postgres, Redis and MinIO (infra/docker-compose.self.yml).
 * external: infra/.env points at services that already run. Remembered in infra/.env; an
 * existing infra/.env without the marker was made for external services.
 */
const servicesMode = (): ServicesMode => {
  const file = join(root, 'infra', '.env')
  const exists = existsSync(file)
  const marker = exists ? parseEnvFile(readFileSync(file, 'utf8')).DUATF_SERVICES : undefined
  const mode = values.services ?? marker ?? (exists ? 'external' : 'docker')
  if (mode !== 'docker' && mode !== 'external') fail('--services is docker or external.')
  return mode as ServicesMode
}

const compose = (args: string[], options: { allowFail?: boolean } = {}) =>
  run(
    'docker',
    [
      'compose',
      '-p',
      'duatf-self',
      '-f',
      join(root, 'infra', 'docker-compose.self.yml'),
      '--env-file',
      join(root, 'infra', '.env'),
      ...args,
    ],
    options,
  )

const doEnv = () => {
  const mode = servicesMode()
  const chosen = { ...settings(), services: mode }
  const { file, added } = ensureServiceEnv({ root, ...chosen, hostIp: values['host-ip'] })
  const text = readFileSync(file, 'utf8')
  writeFileSync(
    file,
    /^DUATF_SERVICES=/m.test(text)
      ? text.replace(/^DUATF_SERVICES=.*$/m, `DUATF_SERVICES=${mode}`)
      : `${text.replace(/\s*$/, '\n')}DUATF_SERVICES=${mode}\n`,
    { mode: 0o600 },
  )
  const url = writeAppEnv({ root, ...chosen, hostIp: values['host-ip'] })
  console.log(
    `infra/.env ${added.length ? `gained ${added.join(', ')}` : 'unchanged'}; .env written for ${url}`,
  )
  return url
}

const waitForPort = async (port: number, label: string, seconds = 90) => {
  for (let waited = 0; waited < seconds; waited += 2) {
    if (await portOpen(port)) return
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  fail(`${label} did not answer on port ${port}.`)
}

const doServices = async (action: string) => {
  if (servicesMode() !== 'docker') {
    console.log('Services are external (infra/.env points at services you run); nothing to do.')
    return
  }
  if (action === 'up') {
    compose(['up', '-d'])
    const env = parseEnvFile(readFileSync(join(root, 'infra', '.env'), 'utf8'))
    await waitForPort(Number(env.POSTGRES_PORT), 'Postgres')
    await waitForPort(Number(env.MINIO_API_PORT), 'MinIO')
  } else if (action === 'down') {
    compose(values.purge ? ['down', '--volumes'] : ['down'])
  } else {
    compose(['ps'])
  }
}

const databaseUrl = () => {
  const installed = installedSettings(root)
  if (!installed?.databaseUrl) fail('No .env yet: run `pnpm duatf env` first.')
  return installed?.databaseUrl ?? ''
}

const doDb = async () => {
  const url = new URL(databaseUrl())
  const name = url.pathname.slice(1)
  url.pathname = '/postgres'
  const sql = postgres(url.toString(), { max: 1, onnotice: () => undefined })
  try {
    for (const database of [name, `${name}_test`]) {
      const [found] = await sql`select 1 as found from pg_database where datname = ${database}`
      if (!found) {
        await sql.unsafe(`create database "${database.replace(/"/g, '')}"`)
        console.log(`Created database ${database}.`)
      }
    }
  } finally {
    await sql.end({ timeout: 5 })
  }
  tool('packages/platform-db/src/cli/setup.ts')
  tool('packages/platform-db/src/cli/migrate.ts')
}

const releases = async () => {
  const sql = postgres(databaseUrl(), { max: 1, onnotice: () => undefined })
  try {
    const rows = await sql<{ version: string; status: string; questions: number }[]>`
      select r.version, r.status,
        (select count(*)::int from question q where q.release_id = r.id) as questions
      from framework_release r order by r.created_at`
    return rows.map((row) => ({ ...row }))
  } finally {
    await sql.end({ timeout: 5 })
  }
}

const doKb = async () => {
  let known = await releases()
  if (!known.some((row) => row.version === '1.0.0')) tool('tools/seed-import/src/cli.ts')
  known = await releases()
  if (!known.some((row) => row.version === '1.1.0')) tool('tools/seed-import/src/releaseCli.ts')
  known = await releases()
  if (!known.some((row) => row.version === '1.2.0'))
    tool('tools/kb-content/src/cli.ts', ['--publish'])
  const published = (await releases()).find((row) => row.status === 'published')
  console.log(
    `Knowledge base: release ${published?.version ?? 'none'} published with ${published?.questions ?? 0} questions.`,
  )
}

const hasAdmin = async () => {
  const sql = postgres(databaseUrl(), { max: 1, onnotice: () => undefined })
  try {
    const [row] =
      await sql`select count(*)::int as n from app_user u join role_assignment r on r.user_id = u.id
      where r.role = 'firm_admin' and r.tenant_id is null and u.login_enabled`
    return Number(row?.n ?? 0) > 0
  } finally {
    await sql.end({ timeout: 5 })
  }
}

const doAccount = async (required: boolean) => {
  if (!values.username) {
    if (required) fail('Give --username and --name for the administrator.')
    if (await hasAdmin()) {
      console.log(
        'An administrator exists; no account created (use `pnpm duatf account` to add or reset one).',
      )
      return
    }
    values.username = 'admin'
    values.name = values.name ?? 'Administrator'
  }
  tool('tools/account-setup/src/cli.ts', [
    '--username',
    values.username,
    '--name',
    values.name ?? values.username,
  ])
}

const doStart = (which: AppName[] = ['api', 'web']) => {
  const { webPort, apiPort } = settings()
  for (const name of which) {
    const pid = startApp(root, name, name === 'web' ? webPort : apiPort)
    console.log(`${name} running (pid ${pid}, log ${logFile(root, name)})`)
  }
}

const doStop = (which: AppName[] = ['web', 'api']) => {
  for (const name of which)
    console.log(`${name} ${stopApp(root, name) ? 'stopped' : 'was not running'}`)
}

const doStatus = async () => {
  const { webPort, apiPort } = settings()
  for (const [name, port] of [
    ['web', webPort],
    ['api', apiPort],
  ] as const) {
    const status = await appStatus(root, name, port)
    console.log(
      `${name.padEnd(4)} ${status.pid ? `pid ${status.pid}` : 'not started'}; port ${port} ${status.listening ? 'answers' : 'closed'}`,
    )
  }
  const installed = installedSettings(root)
  if (installed?.webUrl) console.log(`Open ${installed.webUrl}`)
}

const doLogs = () => {
  const name: AppName = positionals[1] === 'api' ? 'api' : 'web'
  const file = logFile(root, name)
  if (!existsSync(file)) fail(`No log yet at ${file}.`)
  const lines = readFileSync(file, 'utf8').split('\n')
  console.log(lines.slice(-Number(values.lines ?? 60)).join('\n'))
}

const doBackup = () => {
  const out = values.out ?? join(root, 'backups')
  mkdirSync(out, { recursive: true })
  const file = join(
    out,
    `duatf-${settings().database}-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`,
  )
  const env = parseEnvFile(readFileSync(join(root, 'infra', '.env'), 'utf8'))
  const result =
    servicesMode() === 'docker'
      ? run(
          'docker',
          [
            'compose',
            '-p',
            'duatf-self',
            '-f',
            join(root, 'infra', 'docker-compose.self.yml'),
            '--env-file',
            join(root, 'infra', '.env'),
            'exec',
            '-T',
            'postgres',
            'pg_dump',
            '-U',
            env.POSTGRES_USER ?? 'duatf',
            '-d',
            settings().database,
          ],
          { quiet: true, allowFail: true },
        )
      : run('pg_dump', [databaseUrl()], { quiet: true, allowFail: true })
  if (result.status !== 0) fail(`The dump failed: ${String(result.stderr).slice(0, 300)}`)
  writeFileSync(file, String(result.stdout), { mode: 0o600 })
  console.log(
    `Database saved to ${file}. Evidence files stay in the object store (bucket duatf-self-evidence).`,
  )
}

const doDoctor = async () => {
  const node = process.versions.node
  console.log(`node ${node} ${Number(node.split('.')[0]) >= 22 ? '✓' : '✗ (needs 22 or later)'}`)
  const git = run('git', ['--version'], { quiet: true, allowFail: true })
  console.log(`${String(git.stdout).trim() || 'git ✗ not found'}`)
  const docker = run('docker', ['--version'], { quiet: true, allowFail: true })
  console.log(
    `${String(docker.stdout).trim() || 'docker not found (needed only with --services docker)'}`,
  )
  console.log(`services: ${servicesMode()}`)
  if (existsSync(join(root, 'infra', '.env'))) {
    const env = parseEnvFile(readFileSync(join(root, 'infra', '.env'), 'utf8'))
    for (const [label, port] of [
      ['Postgres', env.POSTGRES_PORT],
      ['Redis', env.REDIS_PORT],
      ['MinIO', env.MINIO_API_PORT],
    ] as const) {
      console.log(
        `${label.padEnd(8)} port ${port ?? '?'} ${port && (await portOpen(Number(port))) ? 'answers ✓' : 'closed ✗'}`,
      )
    }
  } else {
    console.log('infra/.env missing: run install or `pnpm duatf env`.')
  }
  console.log(
    `build: web ${existsSync(join(root, 'apps', 'web', '.next', 'BUILD_ID')) ? '✓' : '✗'}, api ${existsSync(join(root, 'apps', 'backend', 'dist', 'main.js')) ? '✓' : '✗'}`,
  )
  if (installedSettings(root)) {
    const known = await releases().catch(() => [])
    const published = known.find((row) => row.status === 'published')
    console.log(
      `knowledge base: ${published ? `${published.version}, ${published.questions} questions ✓` : 'not loaded ✗'}`,
    )
    console.log(
      `administrator: ${(await hasAdmin().catch(() => false)) ? '✓' : '✗ run `pnpm duatf account`'}`,
    )
  }
  await doStatus()
}

const command = positionals[0]
if (values.help || !command) {
  console.log(HELP)
  process.exit(command ? 0 : 64)
}

switch (command) {
  case 'install':
    step('Environment')
    doEnv()
    step('Services')
    await doServices('up')
    step('Database')
    await doDb()
    step('Evidence storage')
    tool('packages/platform-storage/src/cli/buckets.ts')
    step('Knowledge base')
    await doKb()
    step('Build')
    pnpm(['build'])
    step('Administrator')
    await doAccount(false)
    step('Start')
    doStop()
    doStart()
    await new Promise((resolve) => setTimeout(resolve, 3000))
    await doStatus()
    break
  case 'update':
    step('Database')
    await doDb()
    step('Build')
    pnpm(['build'])
    step('Restart')
    doStop()
    doStart()
    await doStatus()
    break
  case 'repair':
    step('Environment')
    doEnv()
    step('Services')
    await doServices('up')
    step('Database')
    await doDb()
    step('Evidence storage')
    tool('packages/platform-storage/src/cli/buckets.ts')
    step('Knowledge base')
    await doKb()
    step('Build')
    pnpm(['build'])
    step('Restart')
    doStop()
    doStart()
    await doStatus()
    break
  case 'env':
    doEnv()
    break
  case 'services':
    await doServices(positionals[1] ?? 'status')
    break
  case 'db':
    await doDb()
    break
  case 'kb':
    await doKb()
    break
  case 'storage':
    tool('packages/platform-storage/src/cli/buckets.ts')
    break
  case 'account':
    await doAccount(true)
    break
  case 'build':
    pnpm(['build'])
    break
  case 'start':
    doStart()
    break
  case 'stop':
    doStop()
    break
  case 'restart':
    doStop()
    doStart()
    break
  case 'status':
    await doStatus()
    break
  case 'logs':
    doLogs()
    break
  case 'backup':
    doBackup()
    break
  case 'doctor':
    await doDoctor()
    break
  default:
    console.log(HELP)
    fail(`Unknown command "${command}".`)
}
