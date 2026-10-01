import { can } from '@duatf/core-access'
import { formatDay } from '@duatf/core-utils'
import { DataTable, EmptyState, Meter, PageHeader, Panel } from '@duatf/core-ui'
import { listAssessments } from '@duatf/feature-compliance-api'
import { ClipboardList } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AssessmentStatusChip, Legend, ProgressBar } from '@/components/assessment/AssessmentBits'
import { NewAssessmentForm } from '@/components/forms/AssessmentForms'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../clients.module.css'
import { createAssessmentAction } from './actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Assessments' }

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const assessments = await listAssessments(ctx, client.id)
  const canCreate = can(ctx.principal, 'assessment.create', { clientId: client.id })
  const year = new Date().getFullYear()

  return (
    <>
      <PageHeader
        title="Assessments"
        lede="Each assessment asks every question of the knowledge base release it starts on. No and Partial answers become findings, each with the recommended action."
      />
      {assessments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assessment yet">
          {canCreate
            ? 'Start the first one below. Questions are then assigned to departments, answered with evidence and reviewed.'
            : 'The audit team starts assessments. You will see them here once one is open.'}
        </EmptyState>
      ) : (
        <section className={styles.section} aria-label="All assessments">
          <DataTable
            rows={assessments}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'title',
                header: 'Assessment',
                render: (row) => (
                  <span className={styles.personCell}>
                    <Link
                      href={`/clients/${client.code}/assessments/${row.code}`}
                      className={styles.clientName}
                    >
                      {row.title}
                    </Link>
                    <span className={styles.muted}>
                      <span className="code">{row.code}</span>, knowledge base release{' '}
                      {row.releaseVersion}
                    </span>
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <AssessmentStatusChip status={row.status} />,
              },
              {
                key: 'progress',
                header: 'Answers',
                width: '24%',
                render: (row) => (
                  <span className={styles.personCell}>
                    <ProgressBar progress={row.progress} label={row.title} />
                    <span className={styles.muted}>
                      {row.progress.answered} of {row.progress.total} answered
                    </span>
                  </span>
                ),
              },
              {
                key: 'compliance',
                header: 'Posture',
                width: '18%',
                render: (row) => (
                  <Meter value={row.progress.compliancePct} label={`${row.title} posture`} />
                ),
              },
              {
                key: 'due',
                header: 'Due',
                priority: 'low',
                render: (row) =>
                  row.dueDate ? (
                    formatDay(row.dueDate)
                  ) : (
                    <span className={styles.muted}>No date</span>
                  ),
              },
            ]}
          />
          <Legend />
        </section>
      )}
      {canCreate ? (
        <Panel title="Start an assessment" titleId="new-assessment">
          <p className={`${styles.flush} ${styles.sectionIntro}`}>
            The assessment uses the current knowledge base release. A re-assessment of a completed
            cycle is started from that cycle&apos;s page, so earlier answers and findings carry
            over.
          </p>
          <NewAssessmentForm
            action={createAssessmentAction.bind(null, client.id, client.code)}
            defaults={{
              title: `DPDP compliance assessment ${year}`,
              periodStart: client.assessmentPeriodStart ?? '',
              periodEnd: client.assessmentPeriodEnd ?? '',
            }}
          />
        </Panel>
      ) : null}
    </>
  )
}
