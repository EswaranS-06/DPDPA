import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findRepoRoot, parseEnv, seedEnvSchema, testDatabaseEnvSchema } from '@duatf/core-config'
import { createDatabase, sql, type DatabaseHandle } from '@duatf/platform-db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AlreadyImportedError, importSeedVault, SEED_SOURCE } from './importer'

const env = parseEnv(testDatabaseEnvSchema)
const vaultPath = join(findRepoRoot(), parseEnv(seedEnvSchema).SEED_VAULT_PATH)

// --- Oracle: an independent, deliberately simple scan of the seed files ---------------------
const seedFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name === '90 Templates') return []
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return seedFiles(full)
    return entry.name.endsWith('.md') ? [full] : []
  })
const frontmatterOf = (text: string) =>
  text.startsWith('---') ? (text.split('\n---')[0] ?? '') : ''
const seedNotes = seedFiles(vaultPath).map((path) => {
  const text = readFileSync(path, 'utf8')
  const fm = frontmatterOf(text)
  return { path, text, fm, type: /^type:\s*(\S+)/m.exec(fm)?.[1] ?? '' }
})
const countType = (type: string) => seedNotes.filter((note) => note.type === type).length
const noteNamed = (fileName: string) =>
  seedNotes.find((note) => note.path.endsWith(fileName))?.text ?? ''

const seedCounts = {
  sections: countType('act_section'),
  rules: countType('rule'),
  schedules: countType('schedule'),
  lawfulBases: countType('lawful_basis'),
  domains: countType('domain'),
  obligations: countType('obligation'),
  controls: countType('control'),
  processTemplates: countType('process_template'),
  sectorOverlays: countType('sector_overlay'),
  dataElements: countType('data_element'),
  vocabularies: countType('vocabulary'),
  pbcItems: (noteNamed('Evidence Request List (PBC).md').match(/^\| \d+ \|/gm) ?? []).length,
  stuckPoints: (noteNamed('Stuck-Point Playbook.md').match(/^### SP-\d+/gm) ?? []).length,
}

const tally = (values: string[]) =>
  values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {})

// ----------------------------------------------------------------------------------------------
let handle: DatabaseHandle
let releaseId = ''
const one = async <Row extends Record<string, unknown>>(query: ReturnType<typeof sql>) =>
  (await handle.db.execute<Row>(query))[0]

beforeAll(async () => {
  handle = createDatabase(env.TEST_DATABASE_URL, { max: 3 })
  const row = await one<{ id: string }>(
    sql`select id from framework_release where source = ${SEED_SOURCE}`,
  )
  releaseId = row?.id ?? ''
})
afterAll(() => handle.close())

const countIn = async (table: string, where = '') =>
  Number(
    (
      await one<{ n: number }>(
        sql`select count(*)::int as n from ${sql.identifier(table)} where release_id = ${releaseId} ${sql.raw(where)}`,
      )
    )?.n,
  )

describe('seed import (framework release 1.0.0)', () => {
  it('TC-C2.2-01 stores exactly as many records of each kind as the seed holds', async () => {
    const dbCounts = {
      sections: await countIn('instrument', "and kind = 'section'"),
      rules: await countIn('instrument', "and kind = 'rule'"),
      schedules: await countIn('instrument', "and kind = 'schedule'"),
      lawfulBases: await countIn('lawful_basis'),
      domains: await countIn('domain'),
      obligations: await countIn('obligation'),
      controls: await countIn('control'),
      processTemplates: await countIn('process_template'),
      sectorOverlays: await countIn('sector_overlay'),
      dataElements: await countIn('data_element'),
      vocabularies: await countIn('vocabulary'),
      pbcItems: await countIn('pbc_item'),
      stuckPoints: await countIn('stuck_point'),
    }
    expect(dbCounts).toEqual(seedCounts)
  })

  it('TC-C2.2-06 [drift] seed counts equal the plan snapshot of 29 Sep 2026', () => {
    expect(seedCounts).toEqual({
      sections: 44,
      rules: 23,
      schedules: 8,
      lawfulBases: 19,
      domains: 18,
      obligations: 99,
      controls: 82,
      processTemplates: 124,
      sectorOverlays: 20,
      dataElements: 91,
      vocabularies: 17,
      pbcItems: 34,
      stuckPoints: 25,
    })
  })

  it('TC-C2.2-02 links every obligation and control, with no dangling codes', async () => {
    const orphanObligations = await one<{ n: number }>(sql`
      select count(*)::int as n from obligation o where o.release_id = ${releaseId}
      and not exists (select 1 from obligation_control l
        where l.release_id = o.release_id and l.obligation_code = o.code)`)
    const orphanControls = await one<{ n: number }>(sql`
      select count(*)::int as n from control c where c.release_id = ${releaseId}
      and not exists (select 1 from obligation_control l
        where l.release_id = c.release_id and l.control_code = c.code)`)
    const dangling = await one<{ n: number }>(sql`
      select count(*)::int as n from obligation_control l where l.release_id = ${releaseId}
      and (not exists (select 1 from obligation o where o.release_id = l.release_id and o.code = l.obligation_code)
        or not exists (select 1 from control c where c.release_id = l.release_id and c.code = l.control_code))`)
    expect([orphanObligations?.n, orphanControls?.n, dangling?.n]).toEqual([0, 0, 0])
  })

  it('TC-C2.2-03 keeps the obligation profile by actor and phase', async () => {
    const obligationNotes = seedNotes.filter((note) => note.type === 'obligation')
    const seedActors = tally(
      obligationNotes.map((note) => /^actor:\s*(\S+)/m.exec(note.fm)?.[1] ?? ''),
    )
    const seedPhases = tally(
      obligationNotes.map((note) => /^phase:\s*(\d+)/m.exec(note.fm)?.[1] ?? ''),
    )
    const rows = await handle.db.execute<{ actor: string; phase: number }>(
      sql`select actor, phase from obligation where release_id = ${releaseId}`,
    )
    expect(tally(rows.map((row) => row.actor))).toEqual(seedActors)
    expect(tally(rows.map((row) => String(row.phase)))).toEqual(seedPhases)
  })

  it('TC-C2.2-04 refuses a second import', async () => {
    await expect(
      importSeedVault({ vaultPath, databaseUrl: env.TEST_DATABASE_URL }),
    ).rejects.toThrow(AlreadyImportedError)
  })

  it('TC-C2.2-05 resolves every cross-reference stored in note bodies', async () => {
    const targets: Record<string, [string, string]> = {
      obligation: ['obligation', 'code'],
      control: ['control', 'code'],
      domain: ['domain', 'code'],
      law: ['instrument', 'code'],
      basis: ['lawful_basis', 'code'],
      sector: ['sector_overlay', 'code'],
      process: ['process_template', 'code'],
      'data-element': ['data_element', 'code'],
      vocabulary: ['vocabulary', 'code'],
      playbook: ['playbook_doc', 'slug'],
    }
    const bodies = await handle.db.execute<{ body: string }>(sql`
      select body_md as body from instrument where release_id = ${releaseId}
      union all select body_md from obligation where release_id = ${releaseId}
      union all select body_md from control where release_id = ${releaseId}
      union all select body_md from domain where release_id = ${releaseId}
      union all select body_md from process_template where release_id = ${releaseId}
      union all select body_md from sector_overlay where release_id = ${releaseId}
      union all select body_md from playbook_doc where release_id = ${releaseId}
      union all select body_md from stuck_point where release_id = ${releaseId}`)
    const refs = bodies.flatMap((row) => [...row.body.matchAll(/\(ref:([a-z-]+)\/([^)\s]+)\)/g)])
    expect(refs.length).toBeGreaterThan(500)
    const missing: string[] = []
    for (const [, kind = '', code = ''] of refs) {
      const target = targets[kind]
      if (!target) {
        missing.push(`${kind}/${code}`)
        continue
      }
      const found = await one<{ n: number }>(
        sql`select count(*)::int as n from ${sql.identifier(target[0])} where release_id = ${releaseId} and ${sql.identifier(target[1])} = ${decodeURIComponent(code)}`,
      )
      if (found?.n !== 1) missing.push(`${kind}/${code}`)
    }
    expect(missing).toEqual([])
  })
})

/** The database error text; the query builder wraps it as the error's cause. */
const rejection = async (work: Promise<unknown>): Promise<string> => {
  try {
    await work
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined
    return cause instanceof Error ? cause.message : String(error)
  }
  return 'no error'
}

describe('release immutability', () => {
  it('TC-C2.3-01 rejects inserts, updates and deletes on a published release', async () => {
    const attempts = [
      sql`update obligation set title = 'changed' where release_id = ${releaseId} and code = 'OBL-CON-01'`,
      sql`insert into domain (release_id, code, title, description, body_md) values (${releaseId}, 'D99', 'x', 'x', 'x')`,
      sql`delete from control where release_id = ${releaseId} and code = 'CTL-CON-01'`,
      sql`update framework_release set notes = 'changed' where id = ${releaseId}`,
      sql`delete from framework_release where id = ${releaseId}`,
    ]
    for (const attempt of attempts) {
      expect(await rejection(handle.db.execute(attempt))).toMatch(/cannot be changed/)
    }
  })

  it('allows editing and deleting a draft release', async () => {
    const version = `0.0.0-test-${Date.now()}`
    // One transaction, so the short-lived draft is never visible to tests running alongside
    // (the knowledge-base editor tests look for the open draft).
    const left = await handle.db.transaction(async (tx) => {
      const [draft] = await tx.execute<{ id: string }>(sql`
        insert into framework_release (version, status, source, created_by)
        values (${version}, 'draft', 'test', 'test') returning id`)
      await tx.execute(
        sql`insert into domain (release_id, code, title, description, body_md) values (${draft?.id}, 'D99', 'x', 'x', 'x')`,
      )
      await tx.execute(sql`delete from framework_release where id = ${draft?.id}`)
      const [row] = await tx.execute<{ n: number }>(
        sql`select count(*)::int as n from domain where code = 'D99'`,
      )
      return row
    })
    expect(left?.n).toBe(0)
  })
})
