import { findRepoRoot, parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import {
  createDatabase,
  FRAMEWORK_CHILD_TABLES,
  sql,
  type DatabaseHandle,
} from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  buildRelease,
  QUESTION_BANK_TABLES,
  questionBankPaths,
  readQuestionBank,
  RELEASE_1_1_0,
  ReleaseExistsError,
} from './release'

const env = parseEnv(testDatabaseEnvSchema)

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
    // Questions and questionnaires are rebuilt from the ComplyX bank, not copied.
    for (const table of FRAMEWORK_CHILD_TABLES.filter(
      (name) => !QUESTION_BANK_TABLES.includes(name),
    )) {
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

  it('TC-C19.2-01 holds the three ComplyX questionnaires and 142 complete, mapped questions', async () => {
    const next = ids['1.1.0'] ?? ''
    const questionnaires = await handle.db.execute<{
      code: string
      respondent: string
      n: number
    }>(sql`
      select qn.code, qn.respondent,
             (select count(*)::int from question q
              where q.release_id = qn.release_id and q.questionnaire_code = qn.code) as n
      from questionnaire qn where qn.release_id = ${next} order by qn.seq`)
    expect(questionnaires.map((row) => [row.code, row.respondent, row.n])).toEqual([
      ['TPL-001', 'organisation', 70],
      ['TPL-002', 'department', 14],
      ['TPL-003', 'vendor', 58],
    ])
    const { bank } = readQuestionBank(questionBankPaths(findRepoRoot()))
    const [total] = await handle.db.execute<{ n: number }>(
      sql`select count(*)::int as n from question where release_id = ${next}`,
    )
    expect(total?.n).toBe(bank.files.flatMap((file) => file.questions).length)

    // Every question carries its law (references, obligations), controls, a recommendation and
    // evidence, all from the knowledge base; scored questions have options that score.
    const incomplete = await handle.db.execute<{ code: string }>(sql`
      select q.code from question q
      where q.release_id = ${next}
        and (length(q.text) < 10 or length(q.title) < 5 or length(q.recommendation) < 20
          or length(q.guidance) = 0 or cardinality(q.references) = 0
          or cardinality(q.obligation_codes) = 0 or cardinality(q.control_codes) = 0
          or cardinality(q.evidence_required) + cardinality(q.evidence_recommended) = 0
          or q.risk_weight not between 2 and 5
          or (q.answer_type <> 'text' and jsonb_array_length(q.options) < 2)
          or exists (select 1 from unnest(q.control_codes) c(code) where not exists (
            select 1 from control k where k.release_id = q.release_id and k.code = c.code))
          or exists (select 1 from unnest(q.obligation_codes) o(code) where not exists (
            select 1 from obligation b where b.release_id = q.release_id and b.code = o.code))
          or not exists (select 1 from domain d where d.release_id = q.release_id and d.code = q.domain_code))`)
    expect(incomplete.map((row) => row.code)).toEqual([])

    const overlapping = await handle.db.execute<{ code: string }>(sql`
      select q.code from question q, lateral (
        select lower(e) as item from unnest(q.evidence_required) e
        union all select lower(e) from unnest(q.evidence_recommended) e
        union all select lower(e) from unnest(q.evidence_supporting) e) items
      where q.release_id = ${next}
      group by q.code having count(*) <> count(distinct items.item)`)
    expect(overlapping.map((row) => row.code)).toEqual([])

    // The penalty of a question comes from its obligations: the critical DPO question carries one.
    const [dpo] = await handle.db.execute<{ tiers: string[] }>(sql`
      select array_agg(distinct b.penalty_tier) filter (where b.penalty_tier is not null) as tiers
      from question q join obligation b
        on b.release_id = q.release_id and b.code = any(q.obligation_codes)
      where q.release_id = ${next} and q.code = 'A1.1'`)
    expect(dpo?.tiers?.length ?? 0).toBeGreaterThan(0)

    // Gates are stored with the question they depend on.
    const [gated] = await handle.db.execute<{ gates: { question: string; values: string[] }[] }>(
      sql`select gates from question where release_id = ${next} and code = 'A12.1'`,
    )
    expect(gated?.gates.map((gate) => [gate.question, gate.values])).toEqual([['A1.4', ['No']]])
  })

  it('refuses to build the same release twice', async () => {
    await expect(
      buildRelease({
        databaseUrl: env.TEST_DATABASE_URL,
        questionBank: questionBankPaths(findRepoRoot()),
        ...RELEASE_1_1_0,
      }),
    ).rejects.toBeInstanceOf(ReleaseExistsError)
  })
})
