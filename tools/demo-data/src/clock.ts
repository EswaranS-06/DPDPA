import { sql, withTenants, type Database } from '@duatf/platform-db'

const DAY = 86_400_000
const MINUTE = 60_000

// Timestamp columns of the client records, and the column that names their client.
const TIMESTAMPS: readonly [table: string, client: string, columns: readonly string[]][] = [
  ['tenant', 'id', ['created_at']],
  ['client_profile', 'tenant_id', ['created_at', 'updated_at']],
  ['department', 'tenant_id', ['created_at']],
  ['role_assignment', 'tenant_id', ['created_at']],
  ['assessment', 'tenant_id', ['created_at', 'started_at', 'completed_at']],
  ['assessment_item', 'tenant_id', ['answered_at', 'reviewed_at']],
  ['evidence', 'tenant_id', ['uploaded_at', 'reviewed_at']],
  ['evidence_link', 'tenant_id', ['created_at']],
  ['finding', 'tenant_id', ['opened_at', 'closed_at']],
  ['finding_event', 'tenant_id', ['at']],
  ['risk', 'tenant_id', ['created_at', 'updated_at', 'accepted_at']],
  ['remediation_action', 'tenant_id', ['created_at', 'updated_at', 'verified_at', 'closed_at']],
  ['action_event', 'tenant_id', ['at']],
]

const list = (values: readonly string[]) =>
  sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )

/**
 * Spreads the demo over past months. Work runs through the services now; afterwards every
 * timestamp it wrote is moved to the story's day (days before today, 10:00 IST onwards, one
 * minute apart so the order is kept). The audit log is append-only and keeps the real time.
 */
export const demoClock = (ownerDb: Database, now = new Date()) => {
  const ist = new Date(now.getTime() + 5.5 * 60 * MINUTE)
  // 10:00 IST (04:30 UTC) on today's Indian date.
  const base = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), 4, 30)
  let minute = 0

  const databaseNow = async () => {
    const rows = await ownerDb.execute<{ epoch: number }>(
      sql`select extract(epoch from clock_timestamp())::float8 as epoch`,
    )
    return new Date(Number(rows[0]?.epoch ?? 0) * 1000 - 5000)
  }

  const retime = async (
    from: Date,
    to: Date,
    scope: { clientIds: readonly string[]; emails: readonly string[] },
  ) => {
    const since = sql`${from.toISOString()}::timestamptz`
    const when = sql`${to.toISOString()}::timestamptz`
    await withTenants(ownerDb, 'all', async (tx) => {
      if (scope.clientIds.length) {
        for (const [table, client, columns] of TIMESTAMPS) {
          const set = columns.map(
            (column) =>
              sql`${sql.identifier(column)} = case when ${sql.identifier(column)} >= ${since} then ${when} else ${sql.identifier(column)} end`,
          )
          const touched = columns.map((column) => sql`${sql.identifier(column)} >= ${since}`)
          await tx.execute(
            sql`update ${sql.identifier(table)} set ${sql.join(set, sql`, `)} where ${sql.identifier(client)} in (${list(scope.clientIds)}) and (${sql.join(touched, sql` or `)})`,
          )
        }
      }
      if (scope.emails.length) {
        await tx.execute(
          sql`update app_user set created_at = ${when} where email in (${list(scope.emails)}) and created_at >= ${since}`,
        )
      }
    })
  }

  return {
    /** The ISO date the given number of days from today (negative: in the past). */
    date: (days: number) => new Date(base + days * DAY).toISOString().slice(0, 10),
    /**
     * Runs work as if it happened on that day (a negative number of days from today). The
     * scope (which clients and people to re-date) is read after the work, once ids exist.
     */
    at: async <Result>(
      day: number,
      scope: () => { clientIds: readonly string[]; emails: readonly string[] },
      work: () => Promise<Result>,
    ): Promise<Result> => {
      if (day >= 0) throw new Error('Demo events must be in the past.')
      const from = await databaseNow()
      const result = await work()
      minute += 1
      await retime(from, new Date(base + day * DAY + minute * MINUTE), scope())
      return result
    },
  }
}
export type DemoClock = ReturnType<typeof demoClock>
