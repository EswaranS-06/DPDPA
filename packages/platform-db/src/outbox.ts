import { inArray, sql } from 'drizzle-orm'
import type { Database, Executor, Transaction } from './client'
import { outboxEvent } from './schema'

export type DomainEvent = {
  id: number
  tenantId: string | null
  type: string
  payload: Record<string, unknown>
}

/** Records an event in the same transaction as the change that caused it. */
export const appendEvent = async (
  db: Executor,
  event: { tenantId?: string | null; type: string; payload?: Record<string, unknown> },
): Promise<number> => {
  const [row] = await db
    .insert(outboxEvent)
    .values({ tenantId: event.tenantId ?? null, type: event.type, payload: event.payload ?? {} })
    .returning({ id: outboxEvent.id })
  if (!row) throw new Error('Outbox insert returned no id')
  return row.id
}

/**
 * Publishes unpublished events in order and marks them published. Locked rows are skipped so
 * several relays can run; a publish failure rolls the batch back (at-least-once delivery).
 */
export const relayOutbox = async (
  db: Database,
  publish: (event: DomainEvent) => Promise<void>,
  batchSize = 100,
): Promise<number> =>
  db.transaction(async (tx) => {
    const events = await tx.execute<{
      id: number
      tenant_id: string | null
      type: string
      payload: Record<string, unknown>
    }>(sql`
      select id, tenant_id, type, payload from outbox_event
      where published_at is null
      order by id
      limit ${batchSize}
      for update skip locked`)
    for (const event of events) {
      await publish({
        id: Number(event.id),
        tenantId: event.tenant_id,
        type: event.type,
        payload: event.payload,
      })
    }
    if (events.length > 0) {
      const ids = events.map((event) => Number(event.id))
      await tx
        .update(outboxEvent)
        .set({ publishedAt: sql`now()` })
        .where(inArray(outboxEvent.id, ids))
    }
    return events.length
  })

/**
 * Runs a handler at most once per consumer and event. The marker row and the handler's own
 * writes share one transaction, so a crash never leaves the event half-applied.
 */
export const consumeOnce = async (
  db: Database,
  consumer: string,
  eventId: number,
  handler: (tx: Transaction) => Promise<void>,
): Promise<boolean> =>
  db.transaction(async (tx) => {
    const inserted = await tx.execute<{ event_id: number }>(sql`
      insert into processed_event (consumer, event_id) values (${consumer}, ${eventId})
      on conflict do nothing
      returning event_id`)
    if (inserted.length === 0) return false
    await handler(tx)
    return true
  })
