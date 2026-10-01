// Walks every tour against a running DUATF in a headless browser, as the person each tour is for,
// and reports how far each got: to its end, to its hands-on step (as designed), or where it broke.
// Nothing is saved: the check never performs a hands-on step.
//
// Usage (on the server, against a preview build): pnpm --filter @duatf/playbook check
//   PLAYBOOK_BASE  address of DUATF (default http://127.0.0.1:53110)
//   PLAYBOOK_CLIENT  client the staff tours practise on (default NADALL)
//   PLAYBOOK_ONLY  comma-separated tour ids
import { databaseEnvSchema, loadRootEnvFile, parseEnv } from '@duatf/core-config'
import {
  appUser,
  createDatabase,
  eq,
  inArray,
  roleAssignment,
  userSession,
} from '@duatf/platform-db'
import { createSession, hashToken, SESSION_COOKIE } from '@duatf/platform-identity'
import { chromium } from 'playwright-core'
import { TOURS } from './catalog.ts'
import { TourRun, type CheckOutcome } from './runner.ts'
import type { Tour } from './types.ts'

loadRootEnvFile()
const env = parseEnv(databaseEnvSchema)
const handle = createDatabase(env.DATABASE_URL, { max: 1 })
const db = handle.db
const BASE = process.env.PLAYBOOK_BASE ?? 'http://127.0.0.1:53110'
const STAFF_CLIENT = process.env.PLAYBOOK_CLIENT ?? 'NADALL'
const ONLY = process.env.PLAYBOOK_ONLY?.split(',').filter(Boolean)
const QA_EMAIL = 'qa-playbook@duatf.local'
const PERSONA_EMAIL: Record<Exclude<Tour['persona'], 'staff'>, string> = {
  dpo: 'principal@amma.example',
  owner: 'admissions@amma.example',
}

const sessions: string[] = []
const restore: { email: string; status: 'invited' | 'active' | 'disabled' }[] = []

const sessionFor = async (userId: string) => {
  const { token } = await createSession(db, { userId, ttlHours: 1 })
  sessions.push(hashToken(token))
  return token
}

const activeUser = async (email: string) => {
  const [row] = await db
    .select({ id: appUser.id, status: appUser.status })
    .from(appUser)
    .where(eq(appUser.email, email))
  if (!row) throw new Error(`${email} is not in this database; load the demo data first.`)
  if (row.status !== 'active') {
    restore.push({ email, status: row.status })
    await db.update(appUser).set({ status: 'active' }).where(eq(appUser.email, email))
  }
  return row.id
}

const results: CheckOutcome[] = []
try {
  const [qa] = await db
    .insert(appUser)
    .values({ email: QA_EMAIL, displayName: 'Playbook Check', kind: 'firm', status: 'active' })
    .returning({ id: appUser.id })
  await db.insert(roleAssignment).values([
    { userId: qa?.id ?? '', role: 'firm_admin' },
    { userId: qa?.id ?? '', role: 'lead_auditor' },
  ])
  const tokens: Record<Tour['persona'], string> = {
    staff: await sessionFor(qa?.id ?? ''),
    dpo: await sessionFor(await activeUser(PERSONA_EMAIL.dpo)),
    owner: await sessionFor(await activeUser(PERSONA_EMAIL.owner)),
  }
  const browser = await chromium.launch({ headless: true })
  for (const tour of TOURS.filter((item) => !ONLY || ONLY.includes(item.id))) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await context.addCookies([{ name: SESSION_COOKIE, value: tokens[tour.persona], url: BASE }])
    const page = await context.newPage()
    const run = new TourRun(page, tour, {
      base: BASE,
      mode: 'check',
      client: tour.persona === 'staff' ? STAFF_CLIENT : 'AMMA',
    })
    const outcome = await run.run()
    results.push(outcome)
    console.log(
      `${outcome.outcome === 'failed' ? 'FAIL' : 'ok  '} ${tour.id.padEnd(24)} ${outcome.reached}/${outcome.total} ${outcome.outcome}${outcome.failure ? `: ${outcome.failure}` : ''}${outcome.skipped?.length ? ` (skipped: ${outcome.skipped.join('; ')})` : ''}`,
    )
    await context.close()
  }
  await browser.close()
} finally {
  if (sessions.length) await db.delete(userSession).where(inArray(userSession.id, sessions))
  for (const row of restore) {
    await db.update(appUser).set({ status: row.status }).where(eq(appUser.email, row.email))
  }
  const [qa] = await db.select({ id: appUser.id }).from(appUser).where(eq(appUser.email, QA_EMAIL))
  if (qa) {
    await db.delete(roleAssignment).where(eq(roleAssignment.userId, qa.id))
    await db.delete(appUser).where(eq(appUser.id, qa.id))
  }
  await handle.close()
}

const failed = results.filter((row) => row.outcome === 'failed')
console.log(
  `${results.length} tours: ${results.length - failed.length} reached their end or hands-on step, ${failed.length} failed.`,
)
process.exitCode = failed.length ? 1 : 0
