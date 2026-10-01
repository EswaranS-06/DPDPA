// Temporary screenshot run for the knowledge-base editor (not committed). Creates a throwaway QA
// user (firm administrator and lead auditor) and server-side sessions, screenshots the preview,
// clicks "Suggest obligations" once (it saves nothing), then deletes the sessions and the user.
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
const OUT = process.env.QA_OUT ?? '/root/qa-shots/kb'
const QA_EMAIL = 'qa-kb@duatf.local'
const sessions: string[] = []
const restore: { email: string; status: 'invited' | 'active' | 'disabled' }[] = []
mkdirSync(OUT, { recursive: true })

type Shot = {
  name: string
  path: string
  width?: number
  height?: number
  theme?: string
  full?: boolean
  draft?: boolean
  action?: 'suggest'
}

const EDITOR: Shot[] = [
  { name: 'kb-published', path: '/knowledge-base', full: false },
  { name: 'kb-draft-overview', path: '/knowledge-base', draft: true, full: false },
  { name: 'kb-draft-bases', path: '/knowledge-base?section=bases', draft: true },
  {
    name: 'kb-draft-elements',
    path: '/knowledge-base?section=data-elements',
    draft: true,
    full: false,
  },
  { name: 'kb-draft-processes', path: '/knowledge-base?section=processes&sector=HTA', draft: true },
  { name: 'kb-draft-process', path: '/knowledge-base?section=processes&item=HTA-05', draft: true },
  { name: 'kb-draft-sector', path: '/knowledge-base?section=sectors&item=AGR', draft: true },
  {
    name: 'kb-draft-vocab',
    path: '/knowledge-base?section=vocabularies&item=notice-languages',
    draft: true,
  },
  {
    name: 'kb-draft-flags',
    path: '/knowledge-base?section=vocabularies&item=engine-flags',
    draft: true,
    full: false,
  },
  {
    name: 'kb-draft-playbook',
    path: '/knowledge-base?section=playbooks&item=breach-response-runbook',
    draft: true,
  },
  { name: 'release', path: '/knowledge-base/draft' },
  { name: 'edit-process', path: '/knowledge-base/draft/processes/HTA-05' },
  { name: 'new-process-picker', path: '/knowledge-base/draft/processes/new', full: false },
  { name: 'new-process-form', path: '/knowledge-base/draft/processes/new?prefix=HLT' },
  { name: 'suggest', path: '/knowledge-base/draft/processes/new?prefix=HLT', action: 'suggest' },
  { name: 'edit-sector', path: '/knowledge-base/draft/sectors/AGR' },
  { name: 'edit-basis-390', path: '/knowledge-base/draft/bases/ex17_4', width: 390, height: 844 },
  {
    name: 'edit-vocab-dark',
    path: '/knowledge-base/draft/vocabularies/engine-flags',
    theme: 'dark',
    full: false,
  },
]

const READER: Shot[] = [
  // A client DPO asking for the draft still reads the published release, with no release bar.
  {
    name: 'kb-processes',
    path: '/knowledge-base?section=processes&sector=HTA',
    draft: true,
    full: false,
  },
  { name: 'draft-page', path: '/knowledge-base/draft', full: false },
]

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
      { name: 'duatf-kb-view', value: shot.draft ? 'draft' : 'published', url: BASE },
      ...(shot.theme ? [{ name: 'duatf-theme', value: shot.theme, url: BASE }] : []),
    ])
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', (error: Error) => errors.push(error.message))
    page.on('console', (message: { type: () => string; text: () => string }) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    const response = await page.goto(`${BASE}${shot.path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    let note = ''
    if (shot.action === 'suggest') {
      await page.check('input[name="typicalLawfulBasis"][value="consent"]')
      await page.check('input[name="flags"][value="children"]')
      await page.click('button[name="intent"][value="suggest"]')
      await page.waitForTimeout(2500)
      const ticked = await page.locator('input[name="obligationCodes"]:checked').count()
      const message = await page.locator('[role="status"]').first().textContent()
      note = ` suggested=${ticked} message=${JSON.stringify(message)}`
    }
    await page.screenshot({ path: `${OUT}/${who}-${shot.name}.png`, fullPage: shot.full ?? true })
    console.log(
      `${response?.status()} ${who} ${shot.name}${note}${errors.length ? ` ERRORS: ${errors.join(' | ')}` : ''}`,
    )
    await context.close()
  }
}

try {
  const [qa] = await db
    .insert(appUser)
    .values({ email: QA_EMAIL, displayName: 'Asha QA', kind: 'firm', status: 'active' })
    .returning({ id: appUser.id })
  await db.insert(roleAssignment).values([
    { userId: qa?.id ?? '', role: 'firm_admin' },
    { userId: qa?.id ?? '', role: 'lead_auditor' },
  ])
  const browser = await chromium.launch()
  await run(browser, await sessionFor(qa?.id ?? ''), 'admin', EDITOR)
  await run(browser, await sessionFor(await userId('principal@amma.example')), 'dpo', READER)
  await browser.close()
} finally {
  if (sessions.length) await db.delete(userSession).where(inArray(userSession.id, sessions))
  for (const row of restore) {
    await db.update(appUser).set({ status: row.status }).where(eq(appUser.email, row.email))
  }
  const [qa] = await db.select({ id: appUser.id }).from(appUser).where(eq(appUser.email, QA_EMAIL))
  if (qa) await db.delete(roleAssignment).where(eq(roleAssignment.userId, qa.id))
  await db.delete(appUser).where(eq(appUser.email, QA_EMAIL))
  await handle.close()
  console.log('cleaned up')
}
