import { formatDay, formatIst } from '@duatf/core-utils'
import { Chip, DataTable, type ChipTone } from '@duatf/core-ui'
import type { EvidenceRow } from '@duatf/feature-compliance-api'
import type { EvidenceStatus } from '@duatf/platform-db'
import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from '@/app/(app)/clients/clients.module.css'

const STATUS: Record<EvidenceStatus, { label: string; tone: ChipTone }> = {
  pending_review: { label: 'Awaiting review', tone: 'pending' },
  accepted: { label: 'Accepted', tone: 'live' },
  rejected: { label: 'Rejected', tone: 'severe' },
}

export const EvidenceStatusChip = ({
  status,
  expired,
}: {
  status: EvidenceStatus
  expired: boolean
}) => (
  <span className={styles.roles}>
    <Chip tone={STATUS[status].tone}>{STATUS[status].label}</Chip>
    {expired ? <Chip tone="severe">Expired</Chip> : null}
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
              {row.code} · {row.fileName} · {fileSize(row.sizeBytes)}
            </span>
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <EvidenceStatusChip status={row.status} expired={row.expired} />,
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
        header: 'Valid until',
        render: (row) => (row.validUntil ? formatDay(row.validUntil) : '—'),
      },
      {
        key: 'used',
        header: 'Used for',
        align: 'end',
        render: (row) => `${row.linkCount} question${row.linkCount === 1 ? '' : 's'}`,
      },
      {
        key: 'download',
        header: <span className="visually-hidden">Download</span>,
        render: (row) => (
          <span className={styles.roles}>
            <a href={`/clients/${clientCode}/evidence/${row.code}/download`} rel="nofollow">
              Download
            </a>
            {action ? action(row) : null}
          </span>
        ),
      },
    ]}
  />
)
