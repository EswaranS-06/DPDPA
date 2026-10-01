import { buttonClass, EmptyState, PageHeader, SelectField } from '@duatf/core-ui'
import { ACTION_STATUS_LABEL, listActions, type ActionFilters } from '@duatf/feature-compliance-api'
import { ACTION_STATUSES } from '@duatf/platform-db'
import { Wrench } from 'lucide-react'
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

const SHOW = [
  { value: 'all', label: 'All actions' },
  { value: 'mine', label: 'Assigned to me' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'verify', label: 'Ready to verify or close' },
]

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const query = await searchParams
  const show = firstValue(query.show)
  const filters: ActionFilters = {
    status: ACTION_STATUSES.find((status) => status === firstValue(query.status)),
    statuses: show === 'verify' ? ['under_review', 'remediated'] : undefined,
    ownerUserId: show === 'mine' ? ctx.principal.userId : undefined,
    overdue: show === 'overdue',
  }
  const rows = await listActions(ctx, client.id, filters)
  const base = `/clients/${client.code}/actions`
  const filtering = (show !== undefined && show !== 'all') || Boolean(filters.status)

  return (
    <>
      <PageHeader
        title="Remediation"
        lede="Actions are planned from findings. The owner works each one through to review; an auditor other than the owner verifies and closes it once evidence of the fix is accepted."
      />
      <section className={styles.section} aria-label="Remediation actions">
        <form method="get" action={base} className={styles.filters} role="search">
          <SelectField label="Show" name="show" options={SHOW} defaultValue={show ?? 'all'} />
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
            Apply filters
          </button>
          {filtering ? (
            <Link href={base} className={buttonClass('ghost')}>
              Clear filters
            </Link>
          ) : null}
        </form>
        {rows.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title={filtering ? 'No action matches these filters' : 'No remediation actions yet'}
          >
            Actions are planned from a finding: open one on the{' '}
            <Link href={`/clients/${client.code}/findings`}>Findings</Link> page and plan its fix
            with an owner and a due date.
          </EmptyState>
        ) : (
          <ActionTable rows={rows} clientCode={client.code} />
        )}
      </section>
    </>
  )
}
