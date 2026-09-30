import { randomBytes } from 'node:crypto'
import { parseEnv, testDatabaseEnvSchema } from '@duatf/core-config'
import { eq, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { appendAudit, verifyAuditChain } from './audit'
import { createDatabase, type DatabaseHandle } from './client'
import { auditEvent } from './schema'

const env = parseEnv(testDatabaseEnvSchema)

class Rollback extends Error {}

describe('audit log', () => {
  let owner: DatabaseHandle
  let app: DatabaseHandle
  const action = `test.audit.${randomBytes(4).toString('hex')}`

  beforeAll(() => {
    owner = createDatabase(env.TEST_DATABASE_URL, { max: 2 })
    app = createDatabase(env.TEST_APP_DATABASE_URL, { max: 4 })
  })
  afterAll(async () => {
    await Promise.all([owner.close(), app.close()])
  })

  it('TC-C3.4-01 detects a tampered row at that row, and the app role cannot rewrite history', async () => {
    for (const n of [1, 2, 3]) {
      await app.db.transaction((tx) =>
        appendAudit(tx, {
          actorUserId: null,
          tenantId: null,
          action,
          entity: 'test',
          entityId: String(n),
          detail: { n, nested: { b: 2, a: 1 } },
        }),
      )
    }
    const rows = await owner.db
      .select({ id: auditEvent.id })
      .from(auditEvent)
      .where(eq(auditEvent.action, action))
      .orderBy(auditEvent.id)
    expect(rows).toHaveLength(3)
    expect(await verifyAuditChain(owner.db)).toBeNull()

    const target = rows[1]?.id ?? 0
    let brokenAt: number | null = null
    await owner.db
      .transaction(async (tx) => {
        await tx.execute(sql`update audit_event set detail = '{"n": 99}' where id = ${target}`)
        brokenAt = await verifyAuditChain(tx)
        throw new Rollback()
      })
      .catch((error: unknown) => {
        if (!(error instanceof Rollback)) throw error
      })
    expect(brokenAt).toBe(target)

    await expect(
      app.db.execute(sql`update audit_event set action = 'forged' where id = ${target}`),
    ).rejects.toThrow()
    await expect(
      app.db.execute(sql`delete from audit_event where id = ${target}`),
    ).rejects.toThrow()
  })
})
