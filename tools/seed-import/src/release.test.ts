import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findRepoRoot, parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import {
  createDatabase,
  FRAMEWORK_CHILD_TABLES,
  sql,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { parseQuestionBank } from './questionBank'
import { buildRelease, RELEASE_1_1_0, ReleaseExistsError } from './release'

const env = parseEnv(testDatabaseEnvSchema)
const bankPath = join(findRepoRoot(), 'seed', 'question-bank', 'questions.yaml')

let handle: DatabaseHandle
const ids: Record<string, string> = {}

beforeAll(async () => {
  handle = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
  const rows = await handle.db.execute<{ id: string; version: string; status: string }>(
    sql`select id, version, status from framework_release where version in ('1.0.0', '1.1.0')`,
  )
  for (const row of rows) ids[`${row.version}`] = row.id
})
afterAll(() => handle.close())

/** Rows of one table in one release, as JSON without the release id and generated ids. */
const rowsOf = (table: string, releaseId: string) =>
  sql`select to_jsonb(t) - 'release_id' - 'id' as row from ${sql.identifier(table)} t
      where t.release_id = ${releaseId}`

describe('framework release 1.1.0', () => {
  it('TC-C4.2-01 carries every 1.0.0 row unchanged apart from the documented amendments', async () => {
    const statuses = await handle.db.execute<{ version: string; status: string }>(
      sql`select version, status from framework_release where version in ('1.0.0', '1.1.0') order by version`,
    )
    expect(statuses.map((row) => `${row.version}:${row.status}`)).toEqual([
      '1.0.0:superseded',
      '1.1.0:published',
    ])
    const old = ids['1.0.0'] ?? ''
    const next = ids['1.1.0'] ?? ''
    const differences: Record<string, { counts: [number, number]; changed: string[] }> = {}
    for (const table of FRAMEWORK_CHILD_TABLES.filter((name) => name !== 'question')) {
      const counts = await handle.db.execute<{ old: number; next: number }>(sql`
        select (select count(*)::int from ${sql.identifier(table)} where release_id = ${old}) as old,
               (select count(*)::int from ${sql.identifier(table)} where release_id = ${next}) as next`)
      const changed = await handle.db.execute<{ code: string | null }>(sql`
        select coalesce(row->>'code', row->>'seq', row->>'slug') as code
        from ((${rowsOf(table, old)}) except (${rowsOf(table, next)})) missing`)
      differences[table] = {
        counts: [counts[0]?.old ?? -1, counts[0]?.next ?? -2],
        changed: changed.map((row) => row.code ?? '?').sort(),
      }
    }
    // Some tables are empty in the seed (for example acceptance criteria); the copy must still
    // match row for row, and the release as a whole must not be empty.
    const copied = Object.values(differences).reduce((sum, result) => sum + result.counts[1], 0)
    expect(copied).toBeGreaterThan(1000)
    for (const [table, result] of Object.entries(differences)) {
      expect(result.counts[1], `${table} row count`).toBe(result.counts[0])
      const expected = RELEASE_1_1_0.amendments
        .filter((amendment) => amendment.table === table)
        .map((amendment) => amendment.code)
      expect(result.changed, `${table} changed rows`).toEqual(expected)
    }
  })

  it('TC-C4.2-02 has one complete question per control', async () => {
    const next = ids['1.1.0'] ?? ''
    const [counts] = await handle.db.execute<{ controls: number; questions: number }>(sql`
      select (select count(*)::int from control where release_id = ${next}) as controls,
             (select count(*)::int from question where release_id = ${next}) as questions`)
    expect(counts?.questions).toBe(counts?.controls)
    expect(counts?.questions).toBe(parseQuestionBank(readFileSync(bankPath, 'utf8')).length)

    const incomplete = await handle.db.execute<{ code: string }>(sql`
      select q.code from question q
      where q.release_id = ${next}
        and (length(q.text) < 20 or length(q.recommendation) < 20 or length(q.guidance) = 0
          or cardinality(q.references) = 0 or cardinality(q.obligation_codes) = 0
          or cardinality(q.evidence_required) + cardinality(q.evidence_recommended) = 0
          or q.risk_weight not between 1 and 5
          or not exists (select 1 from control c where c.release_id = q.release_id and c.code = q.control_code))`)
    expect(incomplete.map((row) => row.code)).toEqual([])

    const overlapping = await handle.db.execute<{ code: string }>(sql`
      select q.code from question q, lateral (
        select lower(e) as item from unnest(q.evidence_required) e
        union all select lower(e) from unnest(q.evidence_recommended) e
        union all select lower(e) from unnest(q.evidence_supporting) e) items
      where q.release_id = ${next}
      group by q.code having count(*) <> count(distinct items.item)`)
    expect(overlapping.map((row) => row.code)).toEqual([])
  })

  it('refuses to build the same release twice', async () => {
    await expect(
      buildRelease({
        databaseUrl: env.TEST_DATABASE_URL,
        questionBankPath: bankPath,
        ...RELEASE_1_1_0,
      }),
    ).rejects.toBeInstanceOf(ReleaseExistsError)
  })
})
