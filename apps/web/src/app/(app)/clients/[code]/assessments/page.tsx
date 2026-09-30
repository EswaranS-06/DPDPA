import { can } from '@duatf/core-access'
import { formatDay } from '@duatf/core-utils'
import { DataTable, EmptyState } from '@duatf/core-ui'
import { listAssessments } from '@duatf/feature-compliance-api'
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
      <section className={styles.section} aria-labelledby="assessments-title">
        <h2 id="assessments-title" className={styles.sectionTitle}>
          Assessments
        </h2>
        <p className={styles.sectionIntro}>
          Each assessment asks every question in the knowledge base release it was started on. No
          and Partial answers become gaps; the question&apos;s recommendation goes with them.
        </p>
        {assessments.length === 0 ? (
          <EmptyState title="No assessment yet.">
            {canCreate ? 'Start the first one below.' : null}
          </EmptyState>
        ) : (
          <>
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
                        {row.code} · knowledge base {row.releaseVersion}
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
                  header: 'Progress',
                  width: '26%',
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
                  header: 'Compliance',
                  align: 'end',
                  render: (row) =>
                    row.progress.compliancePct === null ? '—' : `${row.progress.compliancePct}%`,
                },
                {
                  key: 'due',
                  header: 'Due',
                  render: (row) => (row.dueDate ? formatDay(row.dueDate) : '—'),
                },
              ]}
            />
            <Legend />
          </>
        )}
      </section>
      {canCreate ? (
        <section className={`${styles.section} ${styles.panel}`} aria-labelledby="new-assessment">
          <h2 id="new-assessment" className={styles.sectionTitle}>
            Start an assessment
          </h2>
          <NewAssessmentForm
            action={createAssessmentAction.bind(null, client.id, client.code)}
            defaults={{
              title: `DPDP compliance assessment ${year}`,
              periodStart: client.assessmentPeriodStart ?? '',
              periodEnd: client.assessmentPeriodEnd ?? '',
            }}
          />
        </section>
      ) : null}
    </>
  )
}
