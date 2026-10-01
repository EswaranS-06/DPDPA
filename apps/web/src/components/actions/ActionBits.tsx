import { formatDay } from '@duatf/core-utils'
import { Chip, DataTable } from '@duatf/core-ui'
import {
  listClientPeople,
  listDepartments,
  type ActionRow,
  type ServiceContext,
} from '@duatf/feature-compliance-api'
import type { ActionStatus } from '@duatf/platform-db'
import { ClockAlert } from 'lucide-react'
import Link from 'next/link'
import styles from '@/app/(app)/clients/clients.module.css'
import { Status } from '@/components/status'

export const ActionStatusChip = ({ status }: { status: ActionStatus }) => (
  <Status kind="action" value={status} />
)

export const ActionTable = ({ rows, clientCode }: { rows: ActionRow[]; clientCode: string }) => (
  <DataTable
    rows={rows}
    rowKey={(row) => row.id}
    columns={[
      {
        key: 'action',
        header: 'Action',
        render: (row) => (
          <span className={styles.personCell}>
            <Link href={`/clients/${clientCode}/actions/${row.code}`} className={styles.clientName}>
              {row.title}
            </Link>
            <span className={styles.muted}>
              <span className="code">{row.code}</span> for{' '}
              <Link href={`/clients/${clientCode}/findings/${row.findingCode}`} className="code">
                {row.findingCode}
              </Link>{' '}
              {row.findingTitle}
            </span>
          </span>
        ),
      },
      {
        key: 'owner',
        header: 'Owner',
        render: (row) => (
          <span className={styles.personCell}>
            {row.ownerName ?? <span className={styles.muted}>Not assigned</span>}
            {row.departmentName ? <span className={styles.muted}>{row.departmentName}</span> : null}
          </span>
        ),
      },
      {
        key: 'due',
        header: 'Due',
        render: (row) =>
          row.dueDate ? (
            <span className={styles.personCell}>
              {formatDay(row.dueDate)}
              {row.overdue ? (
                <Chip tone="danger" icon={ClockAlert}>
                  Overdue
                </Chip>
              ) : null}
            </span>
          ) : (
            <span className={styles.muted}>No date</span>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <ActionStatusChip status={row.status} />,
      },
    ]}
  />
)

/** People who may own actions for a client, and its active departments, as form options. */
export const actionPlanOptions = async (ctx: ServiceContext, clientId: string) => {
  const [people, departments] = await Promise.all([
    listClientPeople(ctx, clientId),
    listDepartments(ctx, clientId),
  ])
  return {
    owners: [...people.clientUsers, ...people.firmTeam]
      .filter((person) => person.status !== 'disabled')
      .map((person) => ({
        value: person.userId,
        label: `${person.displayName} (${person.kind === 'firm' ? 'ComplyX' : 'client'})`,
      })),
    departments: departments
      .filter((row) => row.active)
      .map((row) => ({ value: row.id, label: row.name })),
  }
}
