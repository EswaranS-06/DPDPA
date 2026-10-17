import { can } from '@duatf/core-access'
import { buttonClass, Chip, DataTable, EmptyState, PageHeader, Panel } from '@duatf/core-ui'
import { listAssessments, listDepartments } from '@duatf/feature-compliance-api'
import { Download, FileSpreadsheet, FileText, Printer, Route, Waypoints } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AssessmentStatusChip } from '@/components/assessment/AssessmentBits'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../clients.module.css'
import local from './reports.module.css'

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
      <PageHeader
        title="Reports"
        lede="Every report is generated from the live records: answers, evidence, findings, risks and actions. Each download is recorded in the audit log."
      />

      <div className={local.catalogue}>
        <Panel
          title="Executive report"
          titleId="executive-title"
          actions={
            <Chip icon={FileText} tone="neutral">
              PDF, by printing
            </Chip>
          }
        >
          <p className={`${styles.flush} ${styles.sectionIntro}`}>
            A summary of one assessment for management: scope, compliance by domain, key findings
            with recommendations, the risk picture and remediation status. Open it and use the
            browser&apos;s print dialog to save it as PDF.
          </p>
          {assessments.length === 0 ? (
            <EmptyState title="No assessment to report on yet" size="quiet">
              The report becomes available once an assessment is started.
            </EmptyState>
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
                      <span className={`code ${styles.muted}`}>{row.code}</span>
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => <AssessmentStatusChip status={row.status} />,
                },
                {
                  key: 'open',
                  header: <span className="visually-hidden">Open</span>,
                  label: '',
                  render: (row) => (
                    <Link
                      href={`${base}/executive/${row.code}`}
                      className={buttonClass('secondary', 'sm')}
                    >
                      <Printer size={14} aria-hidden="true" />
                      Open report<span className="visually-hidden"> for {row.code}</span>
                    </Link>
                  ),
                },
              ]}
            />
          )}
        </Panel>

        {canExport ? (
          <Panel
            title="Compliance workbook"
            titleId="workbook-title"
            actions={
              <Chip icon={FileSpreadsheet} tone="neutral">
                Excel
              </Chip>
            }
          >
            <p className={`${styles.flush} ${styles.sectionIntro}`}>
              Opens on a dashboard: headline figures, compliance by domain and by department, risks
              by rating, a risk heatmap and remediation by status. Then the department figures, the
              risk register, all findings, remediation actions, the roadmap, the standards
              crosswalk and the answers of the latest assessment.
            </p>
            <div>
              <a href={`${base}/workbook`} className={buttonClass()} rel="nofollow">
                <Download size={16} aria-hidden="true" />
                Download compliance workbook
              </a>
            </div>
          </Panel>
        ) : null}
      </div>

      {canExport && assessments.length ? (
        <Panel
          title="Word deliverables"
          titleId="word-title"
          padding="flush"
          actions={
            <Chip icon={FileText} tone="neutral">
              Word
            </Chip>
          }
        >
          <p className={local.intro}>
            Built from the records of each assessment, ready to edit: the gap-assessment report
            with its charts, a two-page memo for the Board and a one-page assessment statement
            with the sign-off. None of them calls the result a certificate.
          </p>
          <DataTable
            plain
            rows={assessments}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'assessment',
                header: 'Assessment',
                render: (row) => (
                  <span className={styles.personCell}>
                    <strong>{row.title}</strong>
                    <span className={`code ${styles.muted}`}>{row.code}</span>
                  </span>
                ),
              },
              ...(
                [
                  ['gap-report', 'Gap-assessment report'],
                  ['board-memo', 'Board memo'],
                  ['statement', 'Assessment statement'],
                ] as const
              ).map(([path, label]) => ({
                key: path,
                header: label,
                label,
                render: (row: (typeof assessments)[number]) => (
                  <a href={`${base}/${path}/${row.code}`} rel="nofollow" className={styles.iconLink}>
                    <Download size={14} aria-hidden="true" />
                    Download<span className="visually-hidden"> the {label.toLowerCase()} of {row.code}</span>
                  </a>
                ),
              })),
            ]}
          />
        </Panel>
      ) : null}

      <div className={local.catalogue}>
        <Panel
          title="Remediation roadmap"
          titleId="roadmap-title"
          actions={
            <Chip icon={Route} tone="neutral">
              Page and Excel
            </Chip>
          }
        >
          <p className={`${styles.flush} ${styles.sectionIntro}`}>
            Every unfinished action in a phase, now, next or later, with its owner, due date,
            effort and risk rating. Print it from the page; it is also a sheet of the compliance
            workbook.
          </p>
          <div>
            <Link href={`${base}/roadmap`} className={buttonClass('secondary')}>
              <Printer size={16} aria-hidden="true" />
              Open the roadmap
            </Link>
          </div>
        </Panel>
        <Panel
          title="Standards crosswalk"
          titleId="crosswalk-title"
          actions={
            <Chip icon={Waypoints} tone="neutral">
              Page and Excel
            </Chip>
          }
        >
          <p className={`${styles.flush} ${styles.sectionIntro}`}>
            The open gaps under each ISO/IEC 27001, ISO/IEC 27701 and NIST CSF reference of their
            controls.
          </p>
          <div>
            <Link href={`${base}/crosswalk`} className={buttonClass('secondary')}>
              <Printer size={16} aria-hidden="true" />
              Open the crosswalk
            </Link>
          </div>
        </Panel>
      </div>

      {canExport ? (
        <Panel
          title="Registers workbook"
          titleId="registers-title"
          actions={
            <Chip icon={FileSpreadsheet} tone="neutral">
              Excel
            </Chip>
          }
        >
          <p className={`${styles.flush} ${styles.sectionIntro}`}>
            The seven registers of the DPDP template library, their columns exactly as the library
            lays them out: RoPA, retention schedule, vendor register, breach register, rights-request
            log, consent log and cookie register. Filled from DUATF’s records where it holds the
            data; the other columns are left to fill in.
          </p>
          <div>
            <a href={`${base}/registers`} className={buttonClass('secondary')} rel="nofollow">
              <Download size={16} aria-hidden="true" />
              Download the registers
            </a>
          </div>
        </Panel>
      ) : null}

      {canExport && departments.length ? (
        <Panel
          title="Department workbooks"
          titleId="department-books-title"
          padding="flush"
          actions={
            <Chip icon={FileSpreadsheet} tone="neutral">
              Excel
            </Chip>
          }
        >
          <p className={local.intro}>
            One file per department: its dashboard, its answers in the latest assessment, its
            findings, remediation actions and evidence. Useful to send to a department head.
          </p>
          <DataTable
            plain
            rows={departments}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'department',
                header: 'Department',
                render: (row) => (
                  <span className={styles.personCell}>
                    <Link href={`/clients/${client.code}/departments/${row.code}`}>{row.name}</Link>
                    <span className={`code ${styles.muted}`}>{row.fullCode}</span>
                  </span>
                ),
              },
              {
                key: 'download',
                header: <span className="visually-hidden">Download</span>,
                label: '',
                render: (row) => (
                  <a
                    href={`/clients/${client.code}/departments/${row.code}/workbook`}
                    rel="nofollow"
                    className={styles.iconLink}
                  >
                    <Download size={14} aria-hidden="true" />
                    Download<span className="visually-hidden"> the {row.name} workbook</span>
                  </a>
                ),
              },
            ]}
          />
        </Panel>
      ) : null}
    </>
  )
}
