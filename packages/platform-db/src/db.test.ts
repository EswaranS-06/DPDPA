import { randomBytes } from 'node:crypto'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import { sql } from 'drizzle-orm'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runMigrations, withDatabaseName } from './admin'
import { createDatabase, withTenant, type DatabaseHandle } from './client'
import { nextCode } from './codes'
import { appendEvent, consumeOnce, relayOutbox, type DomainEvent } from './outbox'
import { legalEntity, tenant } from './schema'

const env = parseEnv(testDatabaseEnvSchema)
const suffix = () => randomBytes(4).toString('hex').toUpperCase()

const FINGERPRINT = `
  select string_agg(line, E'\\n' order by line) as fingerprint from (
    select 'col|' || table_name || '|' || column_name || '|' || data_type || '|' || is_nullable
      || '|' || coalesce(column_default, '') as line
      from information_schema.columns where table_schema = 'public'
    union all select 'idx|' || tablename || '|' || indexname || '|' || indexdef
      from pg_indexes where schemaname = 'public'
    union all select 'pol|' || tablename || '|' || policyname || '|' || coalesce(qual, '')
      || '|' || coalesce(with_check, '') from pg_policies where schemaname = 'public'
    union all select 'trg|' || event_object_table || '|' || trigger_name || '|' || event_manipulation
      from information_schema.triggers where trigger_schema = 'public'
  ) lines`

describe('migrations', () => {
  it('TC-C1.2-01 give the same schema on every empty database and re-running is a no-op', async () => {
    const admin = postgres(env.TEST_DATABASE_URL, { max: 1, onnotice: () => undefined })
    const names = [1, 2].map(() => `duatf_scratch_${randomBytes(4).toString('hex')}`)
    try {
      const fingerprints: string[] = []
      for (const name of names) {
        await admin.unsafe(`create database ${name}`)
        const url = withDatabaseName(env.TEST_DATABASE_URL, name)
        await runMigrations(url)
        const probe = postgres(url, { max: 1, onnotice: () => undefined })
        const before = await probe`select count(*)::int as n from drizzle.__drizzle_migrations`
        await runMigrations(url)
        const after = await probe`select count(*)::int as n from drizzle.__drizzle_migrations`
        const [row] = await probe.unsafe<{ fingerprint: string }[]>(FINGERPRINT)
        await probe.end({ timeout: 5 })
        expect(after[0]?.n).toBe(before[0]?.n)
        fingerprints.push(row?.fingerprint ?? '')
      }
      expect(fingerprints[0]?.length).toBeGreaterThan(1000)
      expect(fingerprints[1]).toBe(fingerprints[0])
    } finally {
      for (const name of names) await admin.unsafe(`drop database if exists ${name} with (force)`)
      await admin.end({ timeout: 5 })
    }
  })
})

describe('tenant isolation and codes', () => {
  let owner: DatabaseHandle
  let app: DatabaseHandle
  const codeA = `A${suffix()}`
  const codeB = `B${suffix()}`
  let tenantA = ''
  let tenantB = ''

  beforeAll(async () => {
    owner = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
    app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 10 })
    const rows = await owner.db
      .insert(tenant)
      .values([
        { code: codeA, name: 'Tenant A' },
        { code: codeB, name: 'Tenant B' },
      ])
      .returning({ id: tenant.id, code: tenant.code })
    tenantA = rows.find((row) => row.code === codeA)?.id ?? ''
    tenantB = rows.find((row) => row.code === codeB)?.id ?? ''
    await owner.db.insert(legalEntity).values([
      { tenantId: tenantA, code: `ORG-${codeA}`, legalName: 'Alpha Pvt Ltd' },
      { tenantId: tenantB, code: `ORG-${codeB}`, legalName: 'Beta Pvt Ltd' },
    ])
  })

  afterAll(async () => {
    await owner.db.execute(sql`delete from tenant where code in (${codeA}, ${codeB})`)
    await Promise.all([owner.close(), app.close()])
  })

  it('TC-C1.2-02 lets a tenant-A session read only tenant-A rows', async () => {
    const visible = await withTenant(app.db, tenantA, (tx) =>
      tx.select({ code: legalEntity.code }).from(legalEntity),
    )
    expect(visible.map((row) => row.code)).toEqual([`ORG-${codeA}`])

    const tenants = await withTenant(app.db, tenantA, (tx) => tx.select().from(tenant))
    expect(tenants.map((row) => row.code)).toEqual([codeA])

    const withoutTenant = await app.db.select().from(legalEntity)
    expect(withoutTenant).toEqual([])

    await expect(
      withTenant(app.db, tenantA, (tx) =>
        tx.insert(legalEntity).values({ tenantId: tenantB, code: 'ORG-X', legalName: 'Sneaky' }),
      ),
    ).rejects.toThrow()
  })

  it('TC-C1.2-03 allocates sequential codes with no duplicates under concurrency', async () => {
    const scope = `ACT-${codeA}-HR`
    const first = await withTenant(app.db, tenantA, (tx) => nextCode(tx, tenantA, scope))
    expect(first).toBe(`${scope}-001`)
    const codes = await Promise.all(
      Array.from({ length: 50 }, () =>
        withTenant(app.db, tenantA, (tx) => nextCode(tx, tenantA, scope)),
      ),
    )
    expect(new Set(codes).size).toBe(50)
    const numbers = codes.map((code) => Number(code.slice(-3))).sort((a, b) => a - b)
    expect(numbers[0]).toBe(2)
    expect(numbers.at(-1)).toBe(51)
  })
})

describe('outbox', () => {
  let owner: DatabaseHandle
  const type = `test.outbox.${suffix()}`

  beforeAll(() => {
    owner = createDatabase(env.TEST_DATABASE_URL, { max: 4 })
  })
  afterAll(async () => {
    await owner.db.execute(sql`delete from outbox_event where type = ${type}`)
    await owner.close()
  })

  it('TC-C1.3-01 applies an event delivered three times exactly once', async () => {
    const eventId = await appendEvent(owner.db, { type, payload: { n: 1 } })
    let sideEffects = 0
    const deliver = () =>
      consumeOnce(owner.db, `consumer-${type}`, eventId, () => {
        sideEffects += 1
        return Promise.resolve()
      })
    const results = [await deliver(), await deliver(), await deliver()]
    expect(results).toEqual([true, false, false])
    expect(sideEffects).toBe(1)
  })

  it('TC-C1.3-02 relays each event once and marks it published', async () => {
    const ids = await Promise.all(
      [1, 2, 3].map((n) => appendEvent(owner.db, { type, payload: { n } })),
    )
    const published: DomainEvent[] = []
    await relayOutbox(owner.db, (event) => {
      published.push(event)
      return Promise.resolve()
    })
    const mine = published.filter((event) => event.type === type).map((event) => event.id)
    expect(mine).toEqual(expect.arrayContaining(ids))

    const again: DomainEvent[] = []
    await relayOutbox(owner.db, (event) => {
      again.push(event)
      return Promise.resolve()
    })
    expect(again.filter((event) => ids.includes(event.id))).toEqual([])

    const pending = await owner.db.execute<{ n: number }>(
      sql`select count(*)::int as n from outbox_event where type = ${type} and published_at is null`,
    )
    expect(pending[0]?.n).toBe(0)
  })
})
