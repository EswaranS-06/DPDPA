import { can } from '@duatf/core-access'
import { buttonClass, DataTable, EmptyState } from '@duatf/core-ui'
import { listAssessments, listDepartments } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AssessmentStatusChip } from '@/components/assessment/AssessmentBits'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Reports' }

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const scope = { clientId: client.id }
  const [assessments, departments] = await Promise.all([
    listAssessments(ctx, client.id),
    listDepartments(ctx, client.id),
  ])
  const base = `/clients/${client.code}/reports`
  const canExport = can(ctx.principal, 'report.export', scope)

  return (
    <>
      {canExport ? (
        <section className={`${styles.section} ${styles.panel}`} aria-labelledby="workbook-title">
          <h2 id="workbook-title" className={styles.sectionTitle}>
            Compliance workbook
          </h2>
          <p className={styles.sectionIntro}>
            One Excel file that opens on a dashboard (headline figures, compliance by domain and
            by department, risks by rating, a risk heatmap and remediation by status), followed by
            the department figures, the risk register, all findings, remediation actions and the
            answers of the latest assessment. Each download is recorded.
          </p>
          <div>
            <a href={`${base}/workbook`} className={buttonClass()} rel="nofollow">
              Download Excel workbook
            </a>
          </div>
        </section>
      ) : null}
      {canExport && departments.length ? (
        <section className={styles.section} aria-labelledby="department-books-title">
          <h2 id="department-books-title" className={styles.sectionTitle}>
            Department workbooks
          </h2>
          <p className={styles.sectionIntro}>
            One Excel file per department: its dashboard, its answers in the latest assessment,
            its findings, remediation actions and evidence. Useful to send to a department head.
          </p>
          <DataTable
            rows={departments}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'department',
                header: 'Department',
                render: (row) => (
                  <span className={styles.personCell}>
                    <Link href={`/clients/${client.code}/departments/${row.code}`}>{row.name}</Link>
                    <span className={styles.muted}>{row.fullCode}</span>
                  </span>
                ),
              },
              {
                key: 'download',
                header: <span className="visually-hidden">Download</span>,
                render: (row) => (
                  <a href={`/clients/${client.code}/departments/${row.code}/workbook`} rel="nofollow">
                    Download workbook
                  </a>
                ),
              },
            ]}
          />
        </section>
      ) : null}
      <section className={styles.section} aria-labelledby="executive-title">
        <h2 id="executive-title" className={styles.sectionTitle}>
          Executive reports
        </h2>
        <p className={styles.sectionIntro}>
          A printable summary of one assessment for management: scope, compliance by domain, key
          findings with recommendations, the risk picture and remediation status. Use the
          browser&apos;s print dialog to save it as PDF.
        </p>
        {assessments.length === 0 ? (
          <EmptyState title="No assessment to report on yet." />
        ) : (
          <DataTable
            rows={assessments}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'assessment',
                header: 'Assessment',
                render: (row) => (
                  <span className={styles.personCell}>
                    <strong>{row.title}</strong>
                    <span className={styles.muted}>
                      {row.code} · knowledge base {row.releaseVersion}
                    </span>
                  </span>
                ),
              },
              { key: 'status', header: 'Status', render: (row) => <AssessmentStatusChip status={row.status} /> },
              {
                key: 'open',
                header: <span className="visually-hidden">Open</span>,
                render: (row) => <Link href={`${base}/executive/${row.code}`}>Executive report</Link>,
              },
            ]}
          />
        )}
      </section>
    </>
  )
}
