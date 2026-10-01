import { daysBetween, formatDay, formatIst, isoDate } from '@duatf/core-utils'
import { Chip, DataTable } from '@duatf/core-ui'
import type { EvidenceRow } from '@duatf/feature-compliance-api'
import type { EvidenceStatus } from '@duatf/platform-db'
import { CalendarCheck, CalendarClock, CalendarX, Download } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from '@/app/(app)/clients/clients.module.css'
import { Status } from '@/components/status'

const SOON_DAYS = 30

/** Whether a file is still valid: expired, expiring within 30 days, or valid until its date. */
export const Freshness = ({ validUntil }: { validUntil: string | null }) => {
  if (!validUntil) return null
  const days = daysBetween(isoDate(new Date()), validUntil)
  if (days < 0) {
    return (
      <Chip tone="danger" icon={CalendarX}>
        Expired {formatDay(validUntil)}
      </Chip>
    )
  }
  if (days <= SOON_DAYS) {
    return (
      <Chip tone="warning" icon={CalendarClock}>
        Expires in {days} {days === 1 ? 'day' : 'days'}
      </Chip>
    )
  }
  return (
    <Chip tone="success" icon={CalendarCheck}>
      Valid until {formatDay(validUntil)}
    </Chip>
  )
}

export const EvidenceStatusChip = ({
  status,
  expired,
}: {
  status: EvidenceStatus
  expired: boolean
}) => (
  <span className={styles.roles}>
    <Status kind="evidence" value={status} />
    {expired ? (
      <Chip tone="danger" icon={CalendarX}>
        Expired
      </Chip>
    ) : null}
  </span>
)

export const fileSize = (bytes: number) =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`

type EvidenceTableProps = {
  rows: EvidenceRow[]
  clientCode: string
  /** Extra cell per row, e.g. an unlink button on a question page. */
  action?: (row: EvidenceRow) => ReactNode
}

/** Evidence with its file, status, expiry and a download link. */
export const EvidenceTable = ({ rows, clientCode, action }: EvidenceTableProps) => (
  <DataTable
    rows={rows}
    rowKey={(row) => row.id}
    columns={[
      {
        key: 'title',
        header: 'Evidence',
        render: (row) => (
          <span className={styles.personCell}>
            <Link
              href={`/clients/${clientCode}/evidence/${row.code}`}
              className={styles.clientName}
            >
              {row.title}
            </Link>
            <span className={styles.muted}>
              <span className="code">{row.code}</span>, {row.fileName}, {fileSize(row.sizeBytes)}
            </span>
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <EvidenceStatusChip status={row.status} expired={false} />,
      },
      {
        key: 'uploaded',
        header: 'Uploaded',
        render: (row) => (
          <span className={styles.personCell}>
            {formatIst(row.uploadedAt)}
            <span className={styles.muted}>{row.uploadedByName ?? 'Unknown'}</span>
          </span>
        ),
      },
      {
        key: 'valid',
        header: 'Freshness',
        priority: 'low',
        render: (row) =>
          row.validUntil ? (
            <Freshness validUntil={row.validUntil} />
          ) : (
            <span className={styles.muted}>No expiry</span>
          ),
      },
      {
        key: 'used',
        header: 'Used for',
        align: 'end',
        priority: 'low',
        render: (row) => `${row.linkCount} question${row.linkCount === 1 ? '' : 's'}`,
      },
      {
        key: 'download',
        header: <span className="visually-hidden">Download</span>,
        label: '',
        render: (row) => (
          <span className={styles.roles}>
            <a
              href={`/clients/${clientCode}/evidence/${row.code}/download`}
              rel="nofollow"
              className={styles.iconLink}
            >
              <Download size={14} aria-hidden="true" />
              Download<span className="visually-hidden"> {row.title}</span>
            </a>
            {action ? action(row) : null}
          </span>
        ),
      },
    ]}
  />
)
