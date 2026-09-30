import { sql } from 'drizzle-orm'
import {
  bigserial,
  bigint,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

// Tenant-scoped tables carry tenant_id and are protected by row-level security (migration 0001).

export const tenant = pgTable('tenant', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const legalEntity = pgTable(
  'legal_entity',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    legalName: text('legal_name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('legal_entity_tenant_code').on(table.tenantId, table.code)],
)

export const codeSequence = pgTable(
  'code_sequence',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    scope: text('scope').notNull(),
    lastValue: integer('last_value').notNull(),
  },
  (table) => [primaryKey({ name: 'code_sequence_pk', columns: [table.tenantId, table.scope] })],
)

export const outboxEvent = pgTable('outbox_event', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: uuid('tenant_id'),
  type: text('type').notNull(),
  payload: jsonb('payload')
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
})

export const processedEvent = pgTable(
  'processed_event',
  {
    consumer: text('consumer').notNull(),
    eventId: bigint('event_id', { mode: 'number' }).notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ name: 'processed_event_pk', columns: [table.consumer, table.eventId] })],
)
