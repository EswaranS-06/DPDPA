import { formatDay } from '@duatf/core-utils'
import { Chip, DataTable } from '@duatf/core-ui'
import type { EvidenceRequestRow } from '@duatf/feature-compliance-api'
import { CalendarX, FileClock, FileInput } from 'lucide-react'
import Link from 'next/link'
import styles from '@/app/(app)/clients/clients.module.css'

/** Evidence asked for and not yet accepted: what it is, for which question, from whom, by when. */
export const RequestTable = ({
  rows,
  clientCode,
}: {
  rows: EvidenceRequestRow[]
  clientCode: string
}) => (
  <DataTable
    rows={rows}
    rowKey={(row) => row.id}
    columns={[
      {
        key: 'title',
        header: 'Requested evidence',
        render: (row) => (
          <span className={styles.personCell}>
            <span>{row.title}</span>
            {row.note ? <span className={styles.muted}>{row.note}</span> : null}
          </span>
        ),
      },
      {
        key: 'question',
        header: 'Question',
        render: (row) =>
          row.departmentCode ? (
            <Link
              href={`/clients/${clientCode}/assessments/${row.assessmentCode}/items/${row.departmentCode}/${row.questionCode}`}
              className="code"
            >
              {row.questionCode}
            </Link>
          ) : (
            <span className="code">{row.questionCode}</span>
          ),
      },
      { key: 'department', header: 'Department', render: (row) => row.departmentName ?? '' },
      {
        key: 'from',
        header: 'From',
        render: (row) => row.assigneeName ?? <span className={styles.muted}>The audit team</span>,
      },
      {
        key: 'due',
        header: 'Due',
        render: (row) => (row.dueDate ? formatDay(row.dueDate) : ''),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) =>
          row.status === 'received' ? (
            <Chip tone="pending" icon={FileInput}>
              Received, to review
            </Chip>
          ) : row.overdue ? (
            <Chip tone="danger" icon={CalendarX}>
              Overdue
            </Chip>
          ) : (
            <Chip tone="info" icon={FileClock}>
              Requested
            </Chip>
          ),
      },
    ]}
  />
)
