import { buttonClass, EmptyState, SelectField } from '@duatf/core-ui'
import { ACTION_STATUS_LABEL, listActions, type ActionFilters } from '@duatf/feature-compliance-api'
import { ACTION_STATUSES } from '@duatf/platform-db'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ActionTable } from '@/components/actions/ActionBits'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import styles from '../../clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Remediation' }

type Props = { params: Promise<{ code: string }>; searchParams: SearchParams }

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const query = await searchParams
  const show = firstValue(query.show)
  const filters: ActionFilters = {
    status: ACTION_STATUSES.find((status) => status === firstValue(query.status)),
    ownerUserId: show === 'mine' ? ctx.principal.userId : undefined,
    overdue: show === 'overdue',
  }
  const rows = await listActions(ctx, client.id, filters)
  const base = `/clients/${client.code}/actions`

  return (
    <section className={styles.section} aria-labelledby="actions-title">
      <h2 id="actions-title" className={styles.sectionTitle}>
        Remediation
      </h2>
      <p className={styles.sectionIntro}>
        Actions are planned from findings. The owner works them through to review; an auditor other
        than the owner verifies and closes them once evidence of the fix is accepted.
      </p>
      <form method="get" action={base} className={styles.filters}>
        <SelectField
          label="Show"
          name="show"
          options={[
            { value: 'all', label: 'All actions' },
            { value: 'mine', label: 'Assigned to me' },
            { value: 'overdue', label: 'Overdue' },
          ]}
          defaultValue={show ?? 'all'}
        />
        <SelectField
          label="Status"
          name="status"
          placeholder="Any status"
          options={ACTION_STATUSES.map((status) => ({
            value: status,
            label: ACTION_STATUS_LABEL[status],
          }))}
          defaultValue={filters.status}
        />
        <button type="submit" className={buttonClass('secondary')}>
          Filter
        </button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="No actions match.">
          Plan actions from a finding: open it on the{' '}
          <Link href={`/clients/${client.code}/findings`}>Findings</Link> tab.
        </EmptyState>
      ) : (
        <ActionTable rows={rows} clientCode={client.code} />
      )}
    </section>
  )
}
