import { can, ROLE_LABEL } from '@duatf/core-access'
import { buttonClass, DataTable, EmptyState, PageHeader } from '@duatf/core-ui'
import { homeFor, portfolio } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AssessmentStatusChip, ProgressBar } from '@/components/assessment/AssessmentBits'
import { ClientStatusChip } from '@/components/ClientChips'
import { DomainMatrix, DueActions } from '@/components/dashboard/DashboardBits'
import dashStyles from '@/components/dashboard/DashboardBits.module.css'
import { BandChip, Heatmap } from '@/components/risk/RiskBits'
import { serviceContext } from '@/server/services'
import styles from './home.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Home' }

const percent = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${value}%`

export default async function Page() {
  const ctx = await serviceContext()
  const { user, principal } = ctx.session
  const view = await portfolio(ctx)
  const landing = homeFor(
    principal,
    view.rows.map((row) => row.code),
  )
  if (landing) redirect(landing)

  const severe = view.bands.filter((band) => band.tone === 'severe')
  const roles = [...new Set(principal.assignments.map((assignment) => ROLE_LABEL[assignment.role]))]
  const canExport = view.rows.some((row) => can(principal, 'report.export', { clientId: row.id }))

  return (
    <div className={styles.page}>
      <PageHeader
        title={`Welcome, ${user.displayName}`}
        lede={
          roles.length
            ? `Signed in as ${roles.join(', ')}.`
            : 'No role has been given to you yet. Ask your DUATF administrator.'
        }
      >
        {canExport ? (
          <a href="/reports/overall" className={buttonClass('secondary')} rel="nofollow">
            Download overall workbook
          </a>
        ) : null}
        {can(principal, 'client.create') ? (
          <Link href="/clients/new" className={buttonClass()}>
            Onboard client
          </Link>
        ) : null}
      </PageHeader>

      <h2 className={styles.heading}>Overall dashboard</h2>

      <dl className={styles.totals}>
        <div>
          <dt>Clients</dt>
          <dd>{view.totals.clients}</dd>
          <span>{view.totals.activeClients} active or onboarding</span>
        </div>
        <div>
          <dt>Assessments running</dt>
          <dd>{view.totals.assessmentsInProgress}</dd>
          <span>Latest cycle not completed</span>
        </div>
        <div>
          <dt>Open gaps</dt>
          <dd>{view.totals.openGaps + view.totals.openPotentialGaps}</dd>
          <span>
            {view.totals.openGaps} gaps, {view.totals.openPotentialGaps} potential
          </span>
        </div>
        <div>
          <dt>Serious risks</dt>
          <dd>
            {severe.reduce((sum, band) => sum + (view.totals.openRisksByBand[band.name] ?? 0), 0)}
          </dd>
          <span>
            {severe
              .map(
                (band) =>
                  `${view.totals.openRisksByBand[band.name] ?? 0} ${band.name.toLowerCase()}`,
              )
              .join(', ')}
          </span>
        </div>
        <div>
          <dt>Overdue actions</dt>
          <dd className={view.totals.overdueActions > 0 ? styles.alarm : undefined}>
            {view.totals.overdueActions}
          </dd>
          <span>{view.totals.evidenceAwaitingReview} evidence files awaiting review</span>
        </div>
      </dl>

      <section aria-labelledby="portfolio" className={styles.section}>
        <h2 id="portfolio" className={styles.heading}>
          Clients
        </h2>
        {view.rows.length === 0 ? (
          <EmptyState title="No clients yet.">
            {can(principal, 'client.create')
              ? 'Onboard the first client to begin.'
              : 'You have not been given access to a client yet.'}
          </EmptyState>
        ) : (
          <DataTable
            rows={view.rows}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'client',
                header: 'Client',
                render: (row) => (
                  <span className={styles.cell}>
                    <Link href={`/clients/${row.code}`} className={styles.clientName}>
                      {row.name}
                    </Link>
                    <span className={styles.muted}>
                      {row.code} · <ClientStatusChip status={row.status} />
                    </span>
                  </span>
                ),
              },
              {
                key: 'assessment',
                header: 'Latest assessment',
                width: '24%',
                render: (row) =>
                  row.latestAssessment ? (
                    <span className={styles.cell}>
                      <Link href={`/clients/${row.code}/assessments/${row.latestAssessment.code}`}>
                        {row.latestAssessment.code}
                      </Link>
                      <ProgressBar progress={row.latestAssessment.progress} label={row.name} />
                      <span className={styles.muted}>
                        {percent(row.latestAssessment.progress.progressPct)} answered ·{' '}
                        <AssessmentStatusChip status={row.latestAssessment.status} />
                      </span>
                    </span>
                  ) : (
                    <span className={styles.muted}>None yet</span>
                  ),
              },
              {
                key: 'compliance',
                header: 'Compliance',
                align: 'end',
                render: (row) => percent(row.latestAssessment?.progress.compliancePct),
              },
              {
                key: 'gaps',
                header: 'Open gaps',
                align: 'end',
                render: (row) => (
                  <Link href={`/clients/${row.code}/findings`}>
                    {row.openFindings.gap + row.openFindings.potentialGap}
                  </Link>
                ),
              },
              {
                key: 'risks',
                header: 'Serious risks',
                render: (row) => (
                  <span className={styles.chips}>
                    {severe.map((band) =>
                      (row.openRisksByBand[band.name] ?? 0) > 0 ? (
                        <BandChip
                          key={band.name}
                          band={band}
                          score={row.openRisksByBand[band.name]}
                        />
                      ) : null,
                    )}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <Link href={`/clients/${row.code}/actions`} className={styles.cell}>
                    <span>{row.actions.open} open</span>
                    {row.actions.overdue ? (
                      <span className={styles.alarm}>{row.actions.overdue} overdue</span>
                    ) : null}
                  </Link>
                ),
              },
            ]}
          />
        )}
      </section>

      {view.rows.length ? (
        <section aria-labelledby="domains" className={styles.section}>
          <h2 id="domains" className={styles.heading}>
            Compliance by domain
          </h2>
          <p className={styles.note}>
            Each client&apos;s latest assessment: Yes plus half of Partial, over the answered
            questions of the domain.
          </p>
          <DomainMatrix rows={view.rows} domains={view.domains} />
        </section>
      ) : null}

      {view.rows.length ? (
        <section aria-labelledby="risk-work" className={styles.section}>
          <div className={dashStyles.twoUp}>
            <div>
              <h2 id="risk-work" className={styles.heading}>
                Open risks, all clients
              </h2>
              <Heatmap grid={view.heatmap} bands={view.bands} />
            </div>
            <div>
              <h2 className={styles.heading}>Actions due next</h2>
              {view.dueActions.length ? (
                <DueActions rows={view.dueActions} />
              ) : (
                <p className={styles.note}>No unfinished remediation actions.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="start" className={styles.section}>
        <h2 id="start" className={styles.heading}>
          Also here
        </h2>
        <ul className={styles.links}>
          <li>
            <Link href="/knowledge-base">Knowledge base</Link>
            <span>
              The DPDP Act and Rules, obligations, controls, the question bank and playbooks.
            </span>
          </li>
        </ul>
      </section>
    </div>
  )
}
