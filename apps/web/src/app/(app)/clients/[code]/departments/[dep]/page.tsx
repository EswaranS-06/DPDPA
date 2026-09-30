import { AccessDeniedError, can } from '@duatf/core-access'
import { buttonClass, Chip, Citation, DataTable, EmptyState } from '@duatf/core-ui'
import { departmentDashboard, NotFoundError } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionTable } from '@/components/actions/ActionBits'
import {
  AssessmentStatusChip,
  Legend,
  Metrics,
  ProgressBar,
} from '@/components/assessment/AssessmentBits'
import { FigurePanels, percent } from '@/components/dashboard/DashboardBits'
import dashStyles from '@/components/dashboard/DashboardBits.module.css'
import { EvidenceTable } from '@/components/evidence/EvidenceTable'
import { BandChip, GapChip, Heatmap } from '@/components/risk/RiskBits'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; dep: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: `Department ${decodeURIComponent((await params).dep).toUpperCase()}`,
})

export default async function Page({ params }: Props) {
  const { code, dep } = await params
  const client = await loadClient(code)
  const ctx = await serviceContext()
  const view = await departmentDashboard(ctx, client.id, decodeURIComponent(dep)).catch(
    (error: unknown) => {
      if (error instanceof NotFoundError || error instanceof AccessDeniedError) notFound()
      throw error
    },
  )
  const { department, figures, bands } = view
  const latest = figures.latestAssessment
  const base = `/clients/${client.code}`
  const titles = new Map(view.domainTitles.map((row) => [row.code, row.title]))
  const itemsHref = (questionCode: string) =>
    latest ? `${base}/assessments/${latest.code}/items/${questionCode}` : base

  return (
    <>
      <section className={styles.section} aria-labelledby="department-title">
        <p className={styles.flush}>
          <Link href={`${base}/departments`}>Departments</Link>
        </p>
        <div className={styles.headerTop}>
          <div className={styles.personCell}>
            <h2 id="department-title" className={styles.sectionTitle}>
              {department.name}
            </h2>
            <span className={styles.muted}>
              {department.fullCode}
              {department.headName ? ` · head ${department.headName}` : ''}
              {department.active ? '' : ' · inactive'}
            </span>
          </div>
          {can(ctx.principal, 'report.export', { clientId: client.id }) ? (
            <a
              href={`${base}/departments/${department.code}/workbook`}
              className={buttonClass('secondary')}
              rel="nofollow"
            >
              Download department workbook
            </a>
          ) : null}
        </div>
        <p className={styles.sectionIntro}>
          {view.owners.length
            ? `Answered by ${view.owners.map((owner) => owner.name).join(', ')} (department owner${view.owners.length > 1 ? 's' : ''}).`
            : 'No department owner has been invited yet; the client DPO answers for this department.'}
        </p>
        {latest && latest.progress.total > 0 ? (
          <>
            <p className={styles.sectionIntro}>
              {latest.progress.total} questions of{' '}
              <Link href={`${base}/assessments/${latest.code}?department=${department.id}`}>
                {latest.title}
              </Link>{' '}
              ({latest.code}) belong to this department.{' '}
              <AssessmentStatusChip status={latest.status} />
            </p>
            <Metrics progress={latest.progress} />
            <ProgressBar progress={latest.progress} label={department.name} />
            <Legend />
          </>
        ) : (
          <p className={styles.sectionIntro}>
            No question of the latest assessment is assigned to this department yet.
          </p>
        )}
        <FigurePanels
          figures={figures}
          bands={bands}
          links={{
            findings: `${base}/findings?status=open`,
            actions: `${base}/actions`,
            evidence: `${base}/evidence`,
          }}
        />
      </section>

      {latest && latest.domains.length ? (
        <section className={styles.section} aria-labelledby="domains-title">
          <h2 id="domains-title" className={styles.subTitle}>
            Compliance by domain
          </h2>
          <DataTable
            rows={latest.domains}
            rowKey={(row) => row.code}
            columns={[
              {
                key: 'domain',
                header: 'Domain',
                render: (row) => (
                  <Link
                    href={`${base}/assessments/${latest.code}?domain=${row.code}&department=${department.id}`}
                  >
                    {row.code} {titles.get(row.code) ?? ''}
                  </Link>
                ),
              },
              {
                key: 'answered',
                header: 'Answered',
                align: 'end',
                render: (row) => `${row.progress.answered}/${row.progress.total}`,
              },
              {
                key: 'compliance',
                header: 'Compliance',
                align: 'end',
                render: (row) => percent(row.progress.compliancePct),
              },
              {
                key: 'bar',
                header: <span className="visually-hidden">Progress</span>,
                width: '32%',
                render: (row) => <ProgressBar progress={row.progress} label={row.code} />,
              },
            ]}
          />
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="attention-title">
        <h2 id="attention-title" className={styles.subTitle}>
          Needs attention ({view.attention.length})
        </h2>
        {view.attention.length === 0 ? (
          <p className={styles.sectionIntro}>
            Every question of this department is answered and none was sent back.
          </p>
        ) : (
          <DataTable
            rows={view.attention}
            rowKey={(row) => row.questionCode}
            columns={[
              {
                key: 'question',
                header: 'Question',
                render: (row) => (
                  <span className={styles.personCell}>
                    <Link href={itemsHref(row.questionCode)} className={styles.questionLink}>
                      {row.text}
                    </Link>
                    <span className={styles.muted}>
                      {row.questionCode} · {row.domainCode}
                    </span>
                  </span>
                ),
              },
              {
                key: 'why',
                header: 'Why',
                width: '30%',
                render: (row) =>
                  row.reviewState === 'returned' ? (
                    <span className={styles.personCell}>
                      <Chip tone="severe">Sent back</Chip>
                      {row.reviewNote ? (
                        <span className={styles.muted}>{row.reviewNote}</span>
                      ) : null}
                    </span>
                  ) : (
                    <Chip>Not answered</Chip>
                  ),
              },
            ]}
          />
        )}
      </section>

      <section className={styles.section} aria-labelledby="findings-title">
        <h2 id="findings-title" className={styles.subTitle}>
          Open findings ({view.findings.length})
        </h2>
        {view.findings.length === 0 ? (
          <EmptyState title="No open findings for this department." />
        ) : (
          <DataTable
            rows={view.findings}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'finding',
                header: 'Finding',
                render: (row) => (
                  <span className={styles.personCell}>
                    <Link href={`${base}/findings/${row.code}`} className={styles.clientName}>
                      {row.title}
                    </Link>
                    <span className={styles.muted}>
                      <Citation>{row.code}</Citation> · question {row.questionCode} ·{' '}
                      {row.assessmentCode}
                    </span>
                  </span>
                ),
              },
              { key: 'type', header: 'Type', render: (row) => <GapChip gapType={row.gapType} /> },
              {
                key: 'risk',
                header: 'Risk',
                render: (row) =>
                  row.band ? <BandChip band={row.band} score={row.riskScore ?? undefined} /> : '—',
              },
            ]}
          />
        )}
      </section>

      <section className={styles.section} aria-labelledby="work-title">
        <div className={dashStyles.twoUp}>
          <div>
            <h2 id="work-title" className={styles.subTitle}>
              Open risks
            </h2>
            <Heatmap grid={view.heatmap} bands={bands} />
          </div>
          <div className={styles.section}>
            <h2 className={styles.subTitle}>Remediation actions ({view.actions.length})</h2>
            {view.actions.length === 0 ? (
              <EmptyState title="No actions are planned for this department." />
            ) : (
              <ActionTable rows={view.actions} clientCode={client.code} />
            )}
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="evidence-title">
        <h2 id="evidence-title" className={styles.subTitle}>
          Evidence ({view.evidence.length})
        </h2>
        {view.evidence.length === 0 ? (
          <EmptyState title="No evidence filed under this department yet." />
        ) : (
          <EvidenceTable rows={view.evidence} clientCode={client.code} />
        )}
      </section>
    </>
  )
}
