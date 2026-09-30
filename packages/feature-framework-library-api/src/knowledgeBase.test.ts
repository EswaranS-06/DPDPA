import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import { createDatabase, sql, type DatabaseHandle } from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { isLiveOn, type ListedSection } from './queries'
import { KB_LIST_SECTIONS } from './refs'
import { createFrameworkLibraryApi, type FrameworkLibraryApi } from './router'

const env = parseEnv(testDatabaseEnvSchema)
const reader = {
  userId: 'reader',
  email: 'reader@example.test',
  displayName: 'Reader',
  assignments: [{ role: 'client_viewer' as const, clientId: 'any-client', departmentId: null }],
}

let app: DatabaseHandle
let owner: DatabaseHandle
let api: FrameworkLibraryApi

beforeAll(() => {
  app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 3 })
  owner = createDatabase(env.TEST_DATABASE_URL, { max: 1 })
  api = createFrameworkLibraryApi({ db: app.db, principal: reader })
})
afterAll(async () => {
  await Promise.all([app.close(), owner.close()])
})

// Oracle: the row count of each section's table in the published release, read directly.
const SECTION_TABLE: Record<ListedSection, string> = {
  law: 'instrument',
  bases: 'lawful_basis',
  obligations: 'obligation',
  controls: 'control',
  questions: 'question',
  domains: 'domain',
  sectors: 'sector_overlay',
  processes: 'process_template',
  'data-elements': 'data_element',
  vocabularies: 'vocabulary',
  playbooks: 'playbook_doc',
}

const resolve = async (section: ListedSection, code: string): Promise<string> => {
  switch (section) {
    case 'law':
      return (await api.instrument({ code })).code
    case 'obligations':
      return (await api.obligation({ code })).code
    case 'controls':
      return (await api.control({ code })).code
    case 'questions':
      return (await api.question({ code })).code
    case 'domains':
      return (await api.domain({ code })).code
    case 'sectors':
      return (await api.sector({ code })).code
    case 'processes':
      return (await api.process({ code })).code
    case 'vocabularies':
      return (await api.vocabulary({ code })).code
    case 'playbooks':
      return (await api.playbook({ slug: code })).slug
    // Lawful bases and data elements are single lists; their items are anchors on the list.
    case 'bases':
    case 'data-elements':
      return code
  }
}

describe('knowledge base page', () => {
  it('TC-C4.1-01 lists items in every section and opens every item by its code', async () => {
    const release = await api.release()
    const [row] = await owner.db.execute<{ id: string }>(
      sql`select id from framework_release where version = ${release.version}`,
    )
    const unresolved: string[] = []
    for (const section of KB_LIST_SECTIONS) {
      const items = await api.section({ section })
      const [counted] = await owner.db.execute<{ n: number }>(
        sql`select count(*)::int as n from ${sql.identifier(SECTION_TABLE[section])} where release_id = ${row?.id ?? ''}`,
      )
      expect(items.length, section).toBeGreaterThan(0)
      expect(items.length, section).toBe(counted?.n)
      for (const item of items) {
        const code = await resolve(section, item.code).catch(() => '')
        if (code !== item.code) unresolved.push(`${section}/${item.code}`)
      }
    }
    expect(unresolved).toEqual([])
  }, 120_000)
})

describe('SPDI Rules sunset', () => {
  it('TC-C4.2-03 keeps LNK-SPDI-01 live on 12 May 2027 and not on 13 May 2027', async () => {
    const spdi = await api.obligation({ code: 'LNK-SPDI-01' })
    expect(spdi.inForceUntil).toBe('2027-05-13')
    expect([isLiveOn(spdi, '2027-05-12'), isLiveOn(spdi, '2027-05-13')]).toEqual([true, false])

    // The database filter used for "in force" counts agrees with isLiveOn on both days.
    const all = await api.obligations()
    for (const day of ['2027-05-12', '2027-05-13']) {
      const summary = await api.summary({ asOf: day })
      expect(summary.inForce, day).toBe(all.filter((item) => isLiveOn(item, day)).length)
    }
  })
})
