// Temporary screenshot run (not committed). Creates server-side sessions for a throwaway QA admin
// and two demo people, opens pages in headless Chromium against the local preview, saves PNGs,
// then deletes the sessions and the QA user. Session tokens never leave this process.
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
import { mkdirSync } from 'node:fs'
import { chromium } from '/root/qa-shots/node_modules/playwright/index.mjs'

loadRootEnvFile()
const env = parseEnv(databaseEnvSchema)
const handle = createDatabase(env.DATABASE_URL, { max: 1 })
const db = handle.db
const BASE = process.env.QA_BASE ?? 'http://127.0.0.1:53110'
const OUT = process.env.QA_OUT ?? '/root/qa-shots/out'
const QA_EMAIL = 'qa-shots@duatf.local'
const sessions: string[] = []
const restore: { email: string; status: 'invited' | 'active' | 'disabled' }[] = []
mkdirSync(OUT, { recursive: true })

const sessionFor = async (userId: string) => {
  const { token } = await createSession(db, { userId, ttlHours: 1 })
  sessions.push(hashToken(token))
  return token
}

const userId = async (email: string) => {
  const [row] = await db
    .select({ id: appUser.id, status: appUser.status })
    .from(appUser)
    .where(eq(appUser.email, email))
  if (row && row.status !== 'active') {
    restore.push({ email, status: row.status })
    await db.update(appUser).set({ status: 'active' }).where(eq(appUser.email, email))
  }
  return row?.id ?? ''
}

type Shot = {
  name: string
  path: string
  width?: number
  height?: number
  theme?: string
  full?: boolean
  density?: string
  action?: string
  follow?: string
}

const plan = (process.env.QA_PLAN ?? 'default').split(',')
const shots: Record<string, Shot[]> = {
  all: [
    { name: 'clients', path: '/clients' },
    { name: 'assessments', path: '/clients/NADALL/assessments' },
    { name: 'assessment', path: '/clients/NADALL/assessments/ASM-NADALL-002' },
    { name: 'findings', path: '/clients/NADALL/findings' },
    { name: 'finding', path: '/clients/NADALL/findings', follow: 'a[href*="/findings/FND-"]' },
    { name: 'risks', path: '/clients/NADALL/risks' },
    { name: 'actions', path: '/clients/NADALL/actions' },
    {
      name: 'action',
      path: '/clients/NADALL/actions?show=overdue',
      follow: 'a[href*="/actions/REM-"]',
    },
    { name: 'evidence', path: '/clients/NADALL/evidence' },
    {
      name: 'evidence-item',
      path: '/clients/NADALL/evidence',
      follow: 'a[href*="/evidence/EVD-"]',
    },
    { name: 'departments', path: '/clients/NADALL/departments' },
    { name: 'people', path: '/clients/NADALL/people' },
    { name: 'reports', path: '/clients/NADALL/reports' },
    { name: 'executive', path: '/clients/NADALL/reports/executive/ASM-NADALL-001' },
    { name: 'kb', path: '/knowledge-base' },
    { name: 'kb-question', path: '/knowledge-base?section=questions&item=Q-NOT-03' },
    { name: 'search', path: '/search?q=consent' },
    { name: 'staff-denied', path: '/admin/staff' },
    { name: 'palette', path: '/clients/NADALL', action: 'palette', full: false },
    { name: 'menu', path: '/', action: 'menu', full: false },
    {
      name: 'drawer-390',
      path: '/clients/AMMA',
      width: 390,
      height: 844,
      action: 'drawer',
      full: false,
    },
    { name: 'client-390', path: '/clients/AMMA', width: 390, height: 844, full: false },
    {
      name: 'item-contrast',
      path: '/clients/NADALL/assessments/ASM-NADALL-002/items/Q-SEC-03',
      theme: 'contrast',
      full: false,
    },
    { name: 'client-dark', path: '/clients/NADALL', theme: 'dark', full: false },
    { name: 'actions-compact', path: '/clients/NADALL/actions', density: 'compact', full: false },
    { name: 'notfound', path: '/clients/NADALL/findings/FND-NOPE-999', full: false },
  ],
  default: [
    { name: 'home-1440', path: '/' },
    { name: 'home-1440-dark', path: '/', theme: 'dark' },
    { name: 'client-nadall-1440', path: '/clients/NADALL' },
    { name: 'item-1440', path: '/clients/NADALL/assessments/ASM-NADALL-002/items/Q-SEC-03' },
    { name: 'department-1440', path: '/clients/NADALL/departments/IT' },
    { name: 'home-390', path: '/', width: 390, height: 844 },
    { name: 'client-1024', path: '/clients/AMMA', width: 1024, height: 900 },
  ],
}

const run = async (
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  token: string,
  who: string,
  list: Shot[],
) => {
  for (const shot of list) {
    const context = await browser.newContext({
      viewport: { width: shot.width ?? 1440, height: shot.height ?? 900 },
      deviceScaleFactor: 1,
      colorScheme: shot.theme === 'dark' ? 'dark' : 'light',
    })
    await context.addCookies([
      { name: SESSION_COOKIE, value: token, url: BASE },
      ...(shot.theme ? [{ name: 'duatf-theme', value: shot.theme, url: BASE }] : []),
      ...(shot.density ? [{ name: 'duatf-density', value: shot.density, url: BASE }] : []),
    ])
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', (error: Error) => errors.push(error.message))
    page.on('console', (message: { type: () => string; text: () => string }) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    let response = await page.goto(`${BASE}${shot.path}`, { waitUntil: 'networkidle' })
    if (shot.follow) {
      const href = await page.locator(shot.follow).first().getAttribute('href')
      response = await page.goto(`${BASE}${href ?? shot.path}`, { waitUntil: 'networkidle' })
    }
    await page.waitForTimeout(1300)
    if (shot.action === 'palette') {
      await page.keyboard.press('Control+K')
      await page.keyboard.type(process.env.QA_QUERY ?? 'consent', { delay: 30 })
      await page.waitForTimeout(900)
    }
    if (shot.action === 'menu') {
      await page.click('[popovertarget="user-menu"]')
      await page.waitForTimeout(300)
    }
    if (shot.action === 'drawer') {
      await page.click('button[aria-controls="sidebar"]')
      await page.waitForTimeout(500)
    }
    await page.screenshot({ path: `${OUT}/${who}-${shot.name}.png`, fullPage: shot.full ?? true })
    console.log(
      `${response?.status()} ${who} ${shot.name}${errors.length ? ` ERRORS: ${errors.join(' | ')}` : ''}`,
    )
    await context.close()
  }
}

try {
  const [qa] = await db
    .insert(appUser)
    .values({ email: QA_EMAIL, displayName: 'Meera QA', kind: 'firm', status: 'active' })
    .returning({ id: appUser.id })
  await db.insert(roleAssignment).values({ userId: qa?.id ?? '', role: 'lead_auditor' })
  const browser = await chromium.launch()
  for (const key of plan) {
    if (key.startsWith('dpo:') || key.startsWith('owner:') || key === 'default') continue
  }
  const admin = await sessionFor(qa?.id ?? '')
  await run(
    browser,
    admin,
    'lead',
    plan.flatMap((key) => shots[key] ?? []),
  )
  if (process.env.QA_DPO) {
    const dpo = await sessionFor(await userId('principal@amma.example'))
    await run(browser, dpo, 'dpo', JSON.parse(process.env.QA_DPO) as Shot[])
  }
  if (process.env.QA_OWNER) {
    const owner = await sessionFor(await userId('admissions@amma.example'))
    await run(browser, owner, 'owner', JSON.parse(process.env.QA_OWNER) as Shot[])
  }
  if (process.env.QA_EXTRA) {
    await run(browser, admin, 'lead', JSON.parse(process.env.QA_EXTRA) as Shot[])
  }
  await browser.close()
} finally {
  if (sessions.length) await db.delete(userSession).where(inArray(userSession.id, sessions))
  for (const row of restore) {
    await db.update(appUser).set({ status: row.status }).where(eq(appUser.email, row.email))
  }
  await db.delete(appUser).where(eq(appUser.email, QA_EMAIL))
  await handle.close()
  console.log('cleaned up')
}
