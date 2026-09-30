import { can } from '@duatf/core-access'
import { formatDay } from '@duatf/core-utils'
import { buttonClass, DataTable, EmptyState, PageHeader } from '@duatf/core-ui'
import { listClients } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ApplicabilityChip, ClientStatusChip } from '@/components/ClientChips'
import { serviceContext } from '@/server/services'
import styles from './clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Clients' }

const period = (start: string | null, end: string | null) =>
  start && end
    ? `${formatDay(start)} to ${formatDay(end)}`
    : start
      ? `From ${formatDay(start)}`
      : '—'

export default async function Page() {
  const ctx = await serviceContext()
  const clients = await listClients(ctx)
  const canCreate = can(ctx.principal, 'client.create')
  return (
    <div className={styles.page}>
      <PageHeader
        title="Clients"
        lede={
          canCreate
            ? 'Every client organisation you work on. Open one to manage its departments, people and assessments.'
            : 'The organisations you have access to.'
        }
      >
        {canCreate ? (
          <Link href="/clients/new" className={buttonClass()}>
            Onboard client
          </Link>
        ) : null}
      </PageHeader>
      {clients.length === 0 ? (
        <EmptyState title="No clients yet.">
          {canCreate
            ? 'Onboard the first client to start an engagement.'
            : 'You have not been given access to a client yet. Ask your administrator.'}
        </EmptyState>
      ) : (
        <DataTable
          rows={clients}
          rowKey={(row) => row.id}
          columns={[
            {
              key: 'client',
              header: 'Client',
              render: (row) => (
                <span className={styles.clientCell}>
                  <Link href={`/clients/${row.code}`} className={styles.clientName}>
                    {row.name}
                  </Link>
                  <span className={styles.muted}>
                    {row.code} · {row.legalName}
                  </span>
                </span>
              ),
            },
            { key: 'industry', header: 'Industry', render: (row) => row.industry },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <ClientStatusChip status={row.status} />,
            },
            {
              key: 'applicability',
              header: 'DPDP Act',
              render: (row) => <ApplicabilityChip applicability={row.applicability} />,
            },
            {
              key: 'departments',
              header: 'Departments',
              align: 'end',
              render: (row) => row.departmentCount,
            },
            {
              key: 'period',
              header: 'Assessment period',
              render: (row) => period(row.assessmentPeriodStart, row.assessmentPeriodEnd),
            },
          ]}
        />
      )}
    </div>
  )
}
