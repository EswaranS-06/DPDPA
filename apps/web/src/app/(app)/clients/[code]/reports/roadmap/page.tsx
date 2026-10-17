import { formatDay } from '@duatf/core-utils'
import { DataTable, EmptyState, PageHeader, Panel, Stat, StatGrid } from '@duatf/core-ui'
import { roadmap } from '@duatf/feature-compliance-api'
import { Route } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PrintButton } from '@/components/PrintButton'
import { BandChip } from '@/components/risk/RiskBits'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Roadmap' }

const days = (value: number) => `${value} day${value === 1 ? '' : 's'}`

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const plan = await roadmap(await serviceContext(), client.id)
  const base = `/clients/${client.code}`

  return (
    <>
      <PageHeader
        title="Remediation roadmap"
        lede={`${client.name}: every unfinished action in a phase. The phase is the one set on the action, or else the one its finding’s risk rating suggests: High and Critical now, Medium next, the rest later.`}
        actions={<PrintButton />}
      />
      {plan.total === 0 ? (
        <EmptyState icon={Route} title="No unfinished actions">
          Actions planned on the findings appear here by phase.
        </EmptyState>
      ) : (
        <>
          <StatGrid label="Roadmap by phase">
            {plan.phases.map((phase) => (
              <Stat
                key={phase.phase}
                label={`${phase.label}, ${phase.window}`}
                value={phase.actions}
                note={`${days(phase.effortDays)} estimated${phase.unestimated ? `, ${phase.unestimated} to estimate` : ''}${phase.overdue ? `, ${phase.overdue} overdue` : ''}`}
                tone={phase.overdue ? 'warning' : 'default'}
              />
            ))}
          </StatGrid>
          {plan.phases.map((phase) => (
            <Panel
              key={phase.phase}
              title={`${phase.label}, ${phase.window}`}
              titleId={`phase-${phase.phase}`}
              padding={phase.rows.length ? 'flush' : 'normal'}
            >
              {phase.rows.length ? (
                <DataTable
                  plain
                  rows={phase.rows}
                  rowKey={(row) => row.id}
                  columns={[
                    {
                      key: 'action',
                      header: 'Action',
                      render: (row) => (
                        <span className={styles.personCell}>
                          <Link href={`${base}/actions/${row.code}`}>{row.title}</Link>
                          <span className={styles.muted}>
                            <span className="code">{row.code}</span>
                            {row.phaseSet ? '' : ', phase suggested'}
                          </span>
                        </span>
                      ),
                    },
                    {
                      key: 'finding',
                      header: 'Finding',
                      priority: 'low',
                      render: (row) => (
                        <Link href={`${base}/findings/${row.findingCode}`} className="code">
                          {row.findingCode}
                        </Link>
                      ),
                    },
                    {
                      key: 'owner',
                      header: 'Owner',
                      render: (row) => row.ownerName ?? <span className={styles.muted}>Not assigned</span>,
                    },
                    {
                      key: 'due',
                      header: 'Due',
                      render: (row) =>
                        row.dueDate ? (
                          <span className={row.overdue ? styles.overdueText : undefined}>
                            {formatDay(row.dueDate)}
                            {row.overdue ? ', overdue' : ''}
                          </span>
                        ) : (
                          <span className={styles.muted}>No date</span>
                        ),
                    },
                    {
                      key: 'effort',
                      header: 'Effort',
                      align: 'end',
                      render: (row) =>
                        row.effortDays === null ? (
                          <span className={styles.muted}>—</span>
                        ) : (
                          days(row.effortDays)
                        ),
                    },
                    {
                      key: 'rating',
                      header: 'Risk',
                      render: (row) =>
                        row.band ? (
                          <BandChip band={row.band} />
                        ) : (
                          <span className={styles.muted}>Not rated</span>
                        ),
                    },
                  ]}
                />
              ) : (
                <p className={styles.muted}>Nothing in this phase.</p>
              )}
            </Panel>
          ))}
        </>
      )}
    </>
  )
}
