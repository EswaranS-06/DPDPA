import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
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
          ...VOCABULARIES.map((row) => `vocabularies/${String(row.code)}`),
          ...SECTORS.map((row) => `sectors/${String(row.code)}`),
          ...PROCESSES.map((row) => `processes/${String(row.code)}`),
          ...PLAYBOOKS.map((row) => `playbooks/${String(row.code)}`),
        ]
        expect(report.added.sort()).toEqual([...expected].sort())
        expect(report.fixed).toEqual(['vocabularies/engine-flags'])
        // Every added or fixed entry awaits legal review and is marked as AI-drafted.
        const draft = (await releaseOverview(db)).draft
        const reviews = await releaseReviews(db, draft?.id ?? '')
        expect(reviews.map((row) => `${row.section}/${row.code}`).sort()).toEqual(
          [...expected, 'vocabularies/engine-flags'].sort(),
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
        // Running it again adds nothing.
        const again = await applyContent(ctx)
        expect(again.added).toEqual([])
        throw new Rollback()
      }),
    ).rejects.toBeInstanceOf(Rollback)
  })
})
