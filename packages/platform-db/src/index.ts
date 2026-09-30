export * as schema from './schema'
export * from './schema'
export {
  createDatabase,
  pingDatabase,
  withTenant,
  withTenants,
  type Database,
  type DatabaseHandle,
  type Executor,
  type TenantScope,
  type Transaction,
} from './client'
export { nextCode } from './codes'
export { appendEvent, relayOutbox, consumeOnce, type DomainEvent } from './outbox'
export { appendAudit, verifyAuditChain, type AuditEntry } from './audit'
export {
  ensureAppRole,
  runMigrations,
  recreateSchema,
  withDatabaseName,
  MIGRATIONS_DIR,
} from './admin'
export {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  not,
  notInArray,
  or,
  sql,
} from 'drizzle-orm'
