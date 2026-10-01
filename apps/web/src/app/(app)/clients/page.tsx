import { can } from '@duatf/core-access'
import { formatDay } from '@duatf/core-utils'
import { buttonClass, DataTable, EmptyState, PageHeader } from '@duatf/core-ui'
import { listClients } from '@duatf/feature-compliance-api'
import { Building, Plus } from 'lucide-react'
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
      : null

export default async function Page() {
  const ctx = await serviceContext()
  const clients = await listClients(ctx)
  const canCreate = can(ctx.principal, 'client.create')
  const onboard = canCreate ? (
    <Link href="/clients/new" className={buttonClass()}>
      <Plus size={16} aria-hidden="true" />
      Onboard client
    </Link>
  ) : null
  return (
    <div className={styles.page}>
      <PageHeader
        title="Clients"
        lede={
          canCreate
            ? 'Every organisation ComplyX assesses. Open one for its posture, assessments, findings and people.'
            : 'The organisations you have access to.'
        }
        actions={onboard}
      />
      {clients.length === 0 ? (
        <EmptyState icon={Building} title="No clients yet" action={onboard}>
          {canCreate
            ? 'Onboarding records the organisation profile and whether the DPDP Act applies. Departments, people and the first assessment follow.'
            : 'You have not been given access to a client yet. Ask your DUATF administrator.'}
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
                    <span className="code">{row.code}</span>, {row.legalName}
                  </span>
                </span>
              ),
            },
            { key: 'industry', header: 'Industry', priority: 'low', render: (row) => row.industry },
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
              priority: 'low',
              render: (row) =>
                period(row.assessmentPeriodStart, row.assessmentPeriodEnd) ?? (
                  <span className={styles.muted}>Not set</span>
                ),
            },
          ]}
        />
      )}
    </div>
  )
}
