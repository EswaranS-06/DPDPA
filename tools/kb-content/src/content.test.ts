import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import {
  DEPARTMENT_PRESETS,
  normaliseCategory,
  PERSONAL_DATA_CATEGORIES,
} from '@duatf/feature-compliance-api/personal-data'
import {
  draftProblems,
  releaseOverview,
  releaseReviews,
} from '@duatf/feature-framework-library-api'
import { createDatabase, sql, type Database, type DatabaseHandle } from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { applyContent, contentContext } from './apply'
import {
  BASES,
  DATA_ELEMENTS,
  ENGINE_FLAG_FIXES,
  PLAYBOOKS,
  PROCESSES,
  SECTORS,
  VOCABULARIES,
} from './content'
import { PROCESS_ROPA, ROPA_VOCABULARIES } from './ropa'

const env = parseEnv(testDatabaseEnvSchema)
let app: DatabaseHandle

beforeAll(() => {
  app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 2 })
})
afterAll(async () => {
  await app.close()
})

class Rollback extends Error {}

describe('AI-drafted knowledge-base content', () => {
  it('TC-C17.4-01 every drafted entry is accepted by the editor, labelled for legal review and breaks no reference', async () => {
    await expect(
      app.db.transaction(async (tx) => {
        const db = tx as unknown as Database
        const ctx = contentContext(db)
        const report = await applyContent(ctx)
        const expected = [
          ...BASES.map((row) => `bases/${String(row.code)}`),
          ...DATA_ELEMENTS.map((row) => `data-elements/${String(row.code)}`),
          ...[...VOCABULARIES, ...ROPA_VOCABULARIES].map(
            (row) => `vocabularies/${String(row.code)}`,
          ),
          ...SECTORS.map((row) => `sectors/${String(row.code)}`),
          ...PROCESSES.map((row) => `processes/${String(row.code)}`),
          ...PLAYBOOKS.map((row) => `playbooks/${String(row.code)}`),
        ]
        expect(report.added.sort()).toEqual([...expected].sort())
        // Every catalogue process takes its RoPA defaults.
        const filled = Object.keys(PROCESS_ROPA).map((code) => `processes/${code}`)
        expect(report.fixed.sort()).toEqual(['vocabularies/engine-flags', ...filled].sort())
        // Every added or fixed entry awaits legal review and is marked as AI-drafted.
        const draft = (await releaseOverview(db)).draft
        const reviews = await releaseReviews(db, draft?.id ?? '')
        expect(reviews.map((row) => `${row.section}/${row.code}`).sort()).toEqual(
          [...new Set([...expected, ...report.fixed])].sort(),
        )
        expect(new Set(reviews.map((row) => `${row.status}:${row.origin}`))).toEqual(
          new Set(['awaiting_review:assistant']),
        )
        // Nothing the draft adds leaves a reference dangling.
        expect(await draftProblems(db)).toEqual([])
        // The engine flags now match the flag names obligations and processes use.
        const flags = await db.execute<{ term: string }>(sql`
          select term from vocabulary_term
          where release_id = ${draft?.id ?? ''} and vocabulary_code = 'engine-flags'`)
        const terms = flags.map((row) => row.term)
        for (const [broken, fixed] of Object.entries(ENGINE_FLAG_FIXES)) {
          expect(terms).not.toContain(broken)
          expect(terms).toContain(fixed)
        }
        // Each process got the obligations its lawful bases and facts trigger.
        const processes = await db.execute<{ code: string; n: number }>(sql`
          select code, cardinality(obligation_codes) as n from process_template
          where release_id = ${draft?.id ?? ''} and code in (${sql.join(
            PROCESSES.map((row) => sql`${String(row.code)}`),
            sql`, `,
          )})`)
        expect(processes.filter((row) => row.n === 0)).toEqual([])
        // A process keeps its RoPA defaults in its body.
        const [payroll] = await db.execute<{ body_md: string; ropa_elements: string[] }>(sql`
          select body_md, ropa_elements from process_template
          where release_id = ${draft?.id ?? ''} and code = 'CMN-HR-03'`)
        expect(payroll?.ropa_elements).toEqual(PROCESS_ROPA['CMN-HR-03']?.elements)
        expect(payroll?.body_md).toContain('## RoPA defaults')
        // Running it again adds nothing, and leaves the defaults alone.
        const again = await applyContent(ctx)
        expect(again.added).toEqual([])
        expect(again.fixed).toEqual([])
        throw new Rollback()
      }),
    ).rejects.toBeInstanceOf(Rollback)
  })

  it('TC-C20.1-01 every data element falls into a data map category, and every suggested element exists', async () => {
    const released = await app.db.execute<{ code: string; category: string }>(sql`
      select d.code, d.category from data_element d
      join framework_release r on r.id = d.release_id
      where r.status = 'published'`)
    const drafted = DATA_ELEMENTS.map((row) => ({
      code: String(row.code),
      category: String(row.category ?? row.newCategory),
    }))
    const all = [...released, ...drafted]
    expect(released.length).toBeGreaterThan(80)
    // No element is left in "Other personal data".
    expect(all.filter((row) => normaliseCategory(row) === 'other').map((row) => row.code)).toEqual(
      [],
    )
    // The drafted elements are new, and every element a department preset suggests exists.
    const codes = new Set(released.map((row) => row.code))
    expect(drafted.filter((row) => codes.has(row.code)).map((row) => row.code)).toEqual([])
    for (const row of drafted) codes.add(row.code)
    const missing = DEPARTMENT_PRESETS.flatMap((preset) =>
      preset.elements.filter((code) => !codes.has(code)).map((code) => `${preset.key}:${code}`),
    )
    expect(missing).toEqual([])
    // The categories vocabulary lists every category with its default level.
    const vocabulary = VOCABULARIES.find((row) => row.code === 'personal-data-categories')
    expect(String(vocabulary?.terms).split('\n')).toHaveLength(PERSONAL_DATA_CATEGORIES.length)
  })

  it('TC-C21.1-01 every catalogue process has RoPA defaults drawn from the RoPA lists', async () => {
    const terms = (code: string) =>
      new Set(
        String(ROPA_VOCABULARIES.find((row) => row.code === code)?.terms)
          .split('\n')
          .map((line) => line.split(' | ')[0] ?? ''),
      )
    const lists = {
      principals: terms('ropa-data-principals'),
      sources: terms('ropa-sources'),
      recipients: terms('ropa-recipients'),
      retention: terms('ropa-retention'),
      deletion: terms('ropa-deletion'),
      security: terms('ropa-security'),
    }
    const released = await app.db.execute<{ code: string }>(sql`
      select d.code from data_element d
      join framework_release r on r.id = d.release_id
      where r.status = 'published'`)
    const elements = new Set([
      ...released.map((row) => row.code),
      ...DATA_ELEMENTS.map((row) => String(row.code)),
    ])
    const problems: string[] = []
    const check = (code: string, field: string, values: string[], allowed: Set<string>) => {
      for (const value of values)
        if (!allowed.has(value)) problems.push(`${code} ${field}: ${value}`)
    }
    for (const [code, ropa] of Object.entries(PROCESS_ROPA)) {
      if (!ropa.purpose) problems.push(`${code}: no purpose`)
      if (ropa.principals.length === 0) problems.push(`${code}: no data principals`)
      check(code, 'principals', ropa.principals, lists.principals)
      check(code, 'sources', ropa.sources, lists.sources)
      check(code, 'processors', ropa.processors, lists.recipients)
      check(code, 'recipients', ropa.recipients, lists.recipients)
      check(code, 'retention', [ropa.retention], lists.retention)
      check(code, 'deletion', [ropa.deletion], lists.deletion)
      check(code, 'security', ropa.security, lists.security)
      check(code, 'elements', ropa.elements, elements)
    }
    expect(problems).toEqual([])
    // Every data element has one short RoPA name, and no spelling points at two elements.
    const names = String(
      ROPA_VOCABULARIES.find((row) => row.code === 'ropa-data-element-names')?.terms,
    )
      .split('\n')
      .map((line) => line.split(' | '))
    expect(new Set(names.map((cells) => cells[1])).size).toBe(names.length)
    expect([...elements].filter((code) => !names.some((cells) => cells[1] === code))).toEqual([])
    const spellings = names.flatMap((cells) =>
      [cells[0] ?? '', ...(cells[2] ?? '').split('; ')]
        .filter(Boolean)
        .map((item) => item.toLowerCase()),
    )
    expect(spellings.length).toBe(new Set(spellings).size)
  })
})
