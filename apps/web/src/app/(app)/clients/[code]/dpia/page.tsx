import { formatDay } from '@duatf/core-utils'
import { buttonClass, Chip, DataTable, EmptyState, PageHeader } from '@duatf/core-ui'
import { DPIA_OUTCOME_LABEL, listDpias } from '@duatf/feature-compliance-api'
import { CalendarClock, FileSearch } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { LevelChip } from '@/components/data/LevelChip'
import { ActionButton } from '@/components/forms/RegisterForms'
import { DpiaStatusChip } from '@/components/registers/RegisterBits'
import bits from '@/components/registers/RegisterBits.module.css'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../clients.module.css'
import { startDpiaAction } from './actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'DPIAs' }

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const list = await listDpias(ctx, client.id)
  const base = `/clients/${client.code}`
  // Activities with a DPIA or a reason for one come first.
  const rows = [...list.activities].sort(
    (a, b) =>
      Number(Boolean(b.dpia)) - Number(Boolean(a.dpia)) ||
      b.reasons.length - a.reasons.length ||
      a.ref - b.ref,
  )

  return (
    <>
      <PageHeader
        title="Data protection impact assessments"
        lede="A Significant Data Fiduciary must carry out a DPIA every 12 months (s.10(2)(c)(i), R13(1)); for other organisations it is good practice where the processing is sensitive. Each DPIA covers one RoPA activity: the rights of the Data Principals, the purpose, and the assessment and management of the risk to those rights."
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No processing activity to assess yet"
          action={
            <Link href={`${base}/data-mapping`} className={buttonClass('secondary')}>
              Open data mapping
            </Link>
          }
        >
          A DPIA is started from an activity in the record of processing. Add the activities first.
        </EmptyState>
      ) : (
        <DataTable
          rows={rows}
          rowKey={(row) => String(row.ref)}
          columns={[
            {
              key: 'activity',
              header: 'Processing activity',
              render: (row) => (
                <span className={styles.personCell}>
                  <Link
                    href={`${base}/data-mapping/activities/${row.refLabel}`}
                    className={styles.clientName}
                  >
                    {row.name}
                  </Link>
                  <span className={styles.muted}>
                    <span className="code">{row.refLabel}</span>, {row.departmentName}
                  </span>
                </span>
              ),
            },
            {
              key: 'level',
              header: 'Most sensitive data',
              priority: 'low',
              render: (row) =>
                row.highestLevel ? (
                  <LevelChip level={row.highestLevel} />
                ) : (
                  <span className={styles.muted}>No personal data listed</span>
                ),
            },
            {
              key: 'reasons',
              header: 'Why a DPIA',
              render: (row) =>
                row.reasons.length ? (
                  <ul className={bits.reasons}>
                    {row.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <span className={styles.muted}>Nothing calls for one</span>
                ),
            },
            {
              key: 'dpia',
              header: 'DPIA',
              render: (row) =>
                row.dpia ? (
                  <span className={styles.personCell}>
                    <span className={styles.roles}>
                      <Link href={`${base}/dpia/${row.dpia.code}`} className="code">
                        {row.dpia.code}
                      </Link>
                      <DpiaStatusChip status={row.dpia.status} />
                      {row.dpia.reviewDue ? (
                        <Chip tone="warning" icon={CalendarClock}>
                          Review due
                        </Chip>
                      ) : null}
                    </span>
                    <span className={styles.muted}>
                      {row.dpia.outcome ? DPIA_OUTCOME_LABEL[row.dpia.outcome] : 'No outcome yet'}
                      {row.dpia.nextReviewOn ? `, review ${formatDay(row.dpia.nextReviewOn)}` : ''}
                    </span>
                  </span>
                ) : list.canEdit ? (
                  <ActionButton
                    action={startDpiaAction.bind(null, {
                      clientId: client.id,
                      clientCode: client.code,
                      activityRef: row.ref,
                    })}
                    pendingText="Starting…"
                  >
                    Start a DPIA
                  </ActionButton>
                ) : (
                  <span className={styles.muted}>None</span>
                ),
            },
          ]}
        />
      )}
    </>
  )
}
