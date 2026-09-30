import { formatSequentialCode } from '@duatf/core-utils'
import { sql } from 'drizzle-orm'
import type { Executor } from './client'

/**
 * Allocates the next code in a series (e.g. scope "ACT-ACME-HR" -> "ACT-ACME-HR-004").
 * The upsert takes a row lock, so concurrent callers never receive the same number.
 */
export const nextCode = async (
  db: Executor,
  tenantId: string,
  scope: string,
  width = 3,
): Promise<string> => {
  const rows = await db.execute<{ last_value: number }>(sql`
    insert into code_sequence (tenant_id, scope, last_value)
    values (${tenantId}, ${scope}, 1)
    on conflict (tenant_id, scope)
    do update set last_value = code_sequence.last_value + 1
    returning last_value`)
  const value = rows[0]?.last_value
  if (value === undefined) throw new Error(`No sequence value returned for ${scope}`)
  return formatSequentialCode(scope, value, width)
}
