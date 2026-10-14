import { formatDay, isoDate } from '@duatf/core-utils'
import { DataTable, Disclosure, EmptyState, PageHeader } from '@duatf/core-ui'
import {
  listDepartments,
  listRightsRequests,
  RIGHTS_KIND_INFO,
  type RightsFilters,
} from '@duatf/feature-compliance-api'
import { RIGHTS_KINDS } from '@duatf/platform-db'
import { Inbox, MailPlus, Settings2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { FilterTabs } from '@/components/FilterTabs'
import { ResponseDaysForm, RightsRequestForm } from '@/components/forms/RegisterForms'
import { DueChip, RightsStatusChip } from '@/components/registers/RegisterBits'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import styles from '../../clients.module.css'
import { recordRequestAction, setResponseDaysAction } from './actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Rights requests' }

type Props = { params: Promise<{ code: string }>; searchParams: SearchParams }

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const show = firstValue((await searchParams).show)
  const filters: RightsFilters =
    show === 'closed' ? { open: false } : show === 'all' ? {} : { open: true }
  const list = await listRightsRequests(ctx, client.id, filters)
  const requests = show === 'overdue' ? list.requests.filter((row) => row.overdue) : list.requests
  const departments = list.canEdit ? await listDepartments(ctx, client.id) : []
  const target = { clientId: client.id, clientCode: client.code }
  const base = `/clients/${client.code}/rights`
  const kinds = RIGHTS_KINDS.map((kind) => ({
    value: kind,
    label: `${RIGHTS_KIND_INFO[kind].label} (${RIGHTS_KIND_INFO[kind].basis})`,
  }))

  return (
    <>
      <PageHeader
        title="Rights requests"
        lede="Requests from Data Principals: access (s.11), correction and erasure (s.12), grievances (s.13), nominations (s.14) and withdrawals of consent (s.6(4)). A grievance is answered within the period the organisation publishes, which is at most 90 days (R14(3))."
      />
      <section className={styles.section} aria-label="Requests">
        <FilterTabs
          label="Requests by state"
          tabs={[
            { href: base, label: 'Open', count: list.counts.open, current: !show },
            {
              href: `${base}?show=overdue`,
              label: 'Overdue',
              count: list.counts.overdue,
              current: show === 'overdue',
            },
            {
              href: `${base}?show=closed`,
              label: 'Closed',
              count: list.counts.closed,
              current: show === 'closed',
            },
            {
              href: `${base}?show=all`,
              label: 'All',
              count: list.counts.open + list.counts.closed,
              current: show === 'all',
            },
          ]}
        />
        {requests.length === 0 ? (
          <EmptyState icon={Inbox} title={show ? 'No request matches' : 'No open request'}>
            Record each request the day it arrives, by the organisation’s own ticket or customer
            reference. The register shows what is due and what was done.
          </EmptyState>
        ) : (
          <DataTable
            rows={requests}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'request',
                header: 'Request',
                render: (row) => (
                  <span className={styles.personCell}>
                    <Link href={`${base}/${row.code}`} className={styles.clientName}>
                      {RIGHTS_KIND_INFO[row.kind].label}
                    </Link>
                    <span className={styles.muted}>
                      <span className="code">{row.code}</span>, reference {row.requesterRef}
                      {row.principalType ? `, ${row.principalType}` : ''}
                    </span>
                  </span>
                ),
              },
              {
                key: 'received',
                header: 'Received',
                render: (row) => (
                  <span className={styles.personCell}>
                    <span>{formatDay(row.receivedOn)}</span>
                    {row.channel ? <span className={styles.muted}>{row.channel}</span> : null}
                  </span>
                ),
              },
              {
                key: 'due',
                header: 'Due',
                render: (row) =>
                  row.open ? (
                    <DueChip dueOn={row.dueOn} daysLeft={row.daysLeft} overdue={row.overdue} />
                  ) : (
                    <span className={styles.muted}>
                      Closed {row.closedOn ? formatDay(row.closedOn) : ''}
                      {row.daysTaken === null ? '' : `, in ${row.daysTaken} days`}
                    </span>
                  ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <RightsStatusChip status={row.status} />,
              },
              {
                key: 'department',
                header: 'Handled by',
                priority: 'low',
                render: (row) =>
                  [row.departmentName, row.handler].filter(Boolean).join(', ') || (
                    <span className={styles.muted}>Not assigned</span>
                  ),
              },
            ]}
          />
        )}
      </section>
      {list.canEdit ? (
        <>
          <Disclosure
            summary="Record a request"
            icon={MailPlus}
            defaultOpen={list.counts.open + list.counts.closed === 0}
          >
            <RightsRequestForm
              action={recordRequestAction.bind(null, target)}
              initial={{ receivedOn: isoDate(new Date()) }}
              kinds={kinds}
              departments={departments
                .filter((row) => row.active)
                .map((row) => ({ value: row.id, label: row.name }))}
              responseDays={list.responseDays}
              submitLabel="Record the request"
            />
          </Disclosure>
          <Disclosure summary="Response period" icon={Settings2} hint={`${list.responseDays} days`}>
            <ResponseDaysForm
              action={setResponseDaysAction.bind(null, target)}
              days={list.responseDays}
            />
          </Disclosure>
        </>
      ) : null}
    </>
  )
}
