import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export type DatabaseHandle = ReturnType<typeof createDatabase>
export type Database = DatabaseHandle['db']
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]
export type Executor = Database | Transaction

export const createDatabase = (url: string, options: { max?: number } = {}) => {
  const client = postgres(url, { max: options.max ?? 10, onnotice: () => undefined })
  const db = drizzle({ client, schema })
  return { db, client, close: () => client.end({ timeout: 5 }) }
}

export const pingDatabase = async (db: Executor): Promise<void> => {
  await db.execute(sql`select 1`)
}

/** Runs work in a transaction scoped to one tenant; row-level security uses app.tenant_id. */
export const withTenant = <Result>(
  db: Database,
  tenantId: string,
  work: (tx: Transaction) => Promise<Result>,
): Promise<Result> =>
  db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`)
    return work(tx)
  })

/** Tenants a transaction may see: every tenant (firm-wide staff) or a fixed list. */
export type TenantScope = 'all' | readonly string[]

/**
 * Runs work in a transaction that row-level security limits to the given tenants.
 * An empty list sees no tenant rows at all.
 */
export const withTenants = <Result>(
  db: Database,
  scope: TenantScope,
  work: (tx: Transaction) => Promise<Result>,
): Promise<Result> =>
  db.transaction(async (tx) => {
    if (scope === 'all') await tx.execute(sql`select set_config('app.all_tenants', 'on', true)`)
    else await tx.execute(sql`select set_config('app.tenant_ids', ${scope.join(',')}, true)`)
    return work(tx)
  })
