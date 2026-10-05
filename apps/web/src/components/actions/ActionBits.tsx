import { formatDay } from '@duatf/core-utils'
import { Chip, DataTable } from '@duatf/core-ui'
import {
  assignablePeople,
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

/** People who can own an action, and the client's active departments, as form options. */
export const actionPlanOptions = async (ctx: ServiceContext, clientId: string) => {
  const [owners, departments] = await Promise.all([
    assignablePeople(ctx, clientId),
    listDepartments(ctx, clientId),
  ])
  return {
    owners,
    departments: departments
      .filter((row) => row.active)
      .map((row) => ({ value: row.id, label: row.name })),
  }
}
