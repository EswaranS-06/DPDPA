import { createHash } from 'node:crypto'
import { asc, sql } from 'drizzle-orm'
import type { Executor } from './client'
import { auditEvent } from './schema'

export type AuditEntry = {
  actorUserId: string | null
  tenantId: string | null
  action: string
  entity: string
  entityId: string
  detail?: Record<string, unknown>
}

const GENESIS = '0'.repeat(64)

/** Stable JSON: keys sorted at every level, so the hash does not depend on key order. */
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

const hashOf = (prevHash: string, entry: Required<AuditEntry>, at: string) =>
  createHash('sha256')
    .update(prevHash)
    .update(canonical({ ...entry, at }))
    .digest('hex')

/**
 * Appends an audit event inside the caller's transaction. A transaction-scoped advisory lock
 * serialises appends so every event chains to the one before it.
 */
export const appendAudit = async (db: Executor, entry: AuditEntry): Promise<void> => {
  await db.execute(sql`select pg_advisory_xact_lock(hashtext('duatf_audit_chain'))`)
  const [last] = await db.execute<{ hash: string }>(
    sql`select hash from audit_event order by id desc limit 1`,
  )
  const prevHash = last?.hash ?? GENESIS
  const at = new Date().toISOString()
  const full: Required<AuditEntry> = { ...entry, detail: entry.detail ?? {} }
  await db.insert(auditEvent).values({
    ...full,
    at: new Date(at),
    prevHash,
    hash: hashOf(prevHash, full, at),
  })
}

/** Recomputes the chain; returns the id of the first event that does not verify, or null. */
export const verifyAuditChain = async (db: Executor): Promise<number | null> => {
  const rows = await db.select().from(auditEvent).orderBy(asc(auditEvent.id))
  let prevHash = GENESIS
  for (const row of rows) {
    const expected = hashOf(
      prevHash,
      {
        actorUserId: row.actorUserId,
        tenantId: row.tenantId,
        action: row.action,
        entity: row.entity,
        entityId: row.entityId,
        detail: row.detail,
      },
      row.at.toISOString(),
    )
    if (row.prevHash !== prevHash || row.hash !== expected) return row.id
    prevHash = row.hash
  }
  return null
}
