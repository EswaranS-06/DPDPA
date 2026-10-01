import { can } from '@duatf/core-access'
import {
  buttonClass,
  DataTable,
  EmptyState,
  Meter,
  PageHeader,
  Panel,
  SectionHeader,
  Stat,
  StatGrid,
} from '@duatf/core-ui'
import { attentionFor, homeFor, portfolio } from '@duatf/feature-compliance-api'
import { buildLadder, RegulatoryClock } from '@duatf/feature-framework-library'
import { Building, ClockAlert, Download, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AssessmentStatusChip, ProgressBar } from '@/components/assessment/AssessmentBits'
import { ClientStatusChip } from '@/components/ClientChips'
import { ActionCentre } from '@/components/dashboard/ActionCentre'
import { DomainMatrix, DueActions } from '@/components/dashboard/DashboardBits'
import dash from '@/components/dashboard/DashboardBits.module.css'
import { BandChip, Heatmap } from '@/components/risk/RiskBits'
import { libraryApi, today } from '@/server/api'
import { serviceContext } from '@/server/services'
import styles from './home.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Overview' }

const IST = 'Asia/Kolkata'

const greeting = (now: Date) => {
  const hour = Number(
    new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hourCycle: 'h23', timeZone: IST }).format(
      now,
    ),
  )
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

const longDate = (now: Date) =>
  new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: IST,
  }).format(now)

const clock = (now: Date) =>
  new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: IST,
  }).format(now)

export default async function Page() {
  const ctx = await serviceContext()
  const { user, principal } = ctx.session
  const view = await portfolio(ctx)
  const landing = homeFor(
    principal,
    view.rows.map((row) => row.code),
  )
  if (landing) redirect(landing)

  const now = new Date()
  const [attention, summary] = await Promise.all([
    attentionFor(ctx),
    (await libraryApi()).summary({ asOf: today() }),
  ])
  const severe = view.bands.filter((band) => band.tone === 'severe')
  const seriousOpen = severe.reduce(
    (sum, band) => sum + (view.totals.openRisksByBand[band.name] ?? 0),
    0,
  )
  const canExport = view.rows.some((row) => can(principal, 'report.export', { clientId: row.id }))
  const firstName = user.displayName.split(/\s+/)[0] ?? user.displayName

  return (
    <div className={styles.page}>
      <PageHeader
        title={`${greeting(now)}, ${firstName}`}
        lede={`Here is where your clients stand on ${longDate(now)}. Figures as of ${clock(now)} IST.`}
        actions={
          <>
            {canExport ? (
              <a href="/reports/overall" className={buttonClass('secondary')} rel="nofollow">
                <Download size={16} aria-hidden="true" />
                Download overall workbook
              </a>
            ) : null}
            {can(principal, 'client.create') ? (
              <Link href="/clients/new" className={buttonClass()}>
                <Plus size={16} aria-hidden="true" />
                Onboard client
              </Link>
            ) : null}
          </>
        }
      />

      <RegulatoryClock ladder={buildLadder(summary, today())} release={summary.release.version} />

      <StatGrid label="Across all clients">
        <Stat
          label="Clients"
          value={view.totals.clients}
          note={`${view.totals.activeClients} active or onboarding`}
          href="/clients"
        />
        <Stat
          label="Assessments running"
          value={view.totals.assessmentsInProgress}
          note="Latest cycle not yet completed"
        />
        <Stat
          label="Open gaps"
          value={view.totals.openGaps + view.totals.openPotentialGaps}
          note={`${view.totals.openGaps} gaps, ${view.totals.openPotentialGaps} potential gaps`}
        />
        <Stat
          label="Serious risks"
          value={seriousOpen}
          note={
            severe.length
              ? `Open and rated ${severe.map((band) => band.name).join(' or ')}`
              : 'No band is marked serious'
          }
          tone={seriousOpen > 0 ? 'warning' : 'default'}
        />
        <Stat
          label="Overdue actions"
          value={view.totals.overdueActions}
          note={`${view.totals.evidenceAwaitingReview} evidence files waiting for review`}
          tone={view.totals.overdueActions > 0 ? 'danger' : 'default'}
          icon={view.totals.overdueActions > 0 ? ClockAlert : undefined}
        />
      </StatGrid>

      <div className={dash.twoUp}>
        <Panel title="Needs your attention" titleId="attention-title">
          <ActionCentre items={attention} showClient />
        </Panel>
        <Panel title="Open risks, all clients" titleId="heatmap-title">
          <Heatmap grid={view.heatmap} bands={view.bands} />
        </Panel>
      </div>

      <section className={styles.section} aria-labelledby="clients-title">
        <SectionHeader
          id="clients-title"
          title="Clients"
          count={view.rows.length}
          description="Each client's latest assessment: questions by outcome, the compliance posture so far and the open work."
        />
        {view.rows.length === 0 ? (
          <EmptyState
            icon={Building}
            title="No clients yet"
            action={
              can(principal, 'client.create') ? (
                <Link href="/clients/new" className={buttonClass()}>
                  Onboard client
                </Link>
              ) : null
            }
          >
            {can(principal, 'client.create')
              ? 'Onboard a client to set up its departments and start its first assessment.'
              : 'You have not been given access to a client yet. Ask your DUATF administrator.'}
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
                    <span className={styles.meta}>
                      <span className="code">{row.code}</span>
                      <ClientStatusChip status={row.status} />
                    </span>
                  </span>
                ),
              },
              {
                key: 'assessment',
                header: 'Latest assessment',
                width: '26%',
                render: (row) =>
                  row.latestAssessment ? (
                    <span className={styles.cell}>
                      <span className={styles.meta}>
                        <Link
                          href={`/clients/${row.code}/assessments/${row.latestAssessment.code}`}
                          className="code"
                        >
                          {row.latestAssessment.code}
                        </Link>
                        <AssessmentStatusChip status={row.latestAssessment.status} />
                      </span>
                      <ProgressBar progress={row.latestAssessment.progress} label={row.name} />
                      <span className={styles.muted}>
                        {row.latestAssessment.progress.answered} of{' '}
                        {row.latestAssessment.progress.total} answered
                      </span>
                    </span>
                  ) : (
                    <span className={styles.muted}>No assessment yet</span>
                  ),
              },
              {
                key: 'compliance',
                header: 'Posture',
                width: '16%',
                render: (row) => (
                  <Meter
                    value={row.latestAssessment?.progress.compliancePct}
                    label={`${row.name} compliance posture`}
                  />
                ),
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
                priority: 'low',
                render: (row) => {
                  const shown = severe.filter((band) => (row.openRisksByBand[band.name] ?? 0) > 0)
                  return shown.length ? (
                    <span className={styles.chips}>
                      {shown.map((band) => (
                        <BandChip
                          key={band.name}
                          band={band}
                          score={row.openRisksByBand[band.name]}
                        />
                      ))}
                    </span>
                  ) : (
                    <span className={styles.muted}>None</span>
                  )
                },
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
        <section className={styles.section} aria-labelledby="domains-title">
          <SectionHeader
            id="domains-title"
            title="Compliance by domain"
            description="Each client's latest assessment, domain by domain: Yes plus half of Partial, over the answered questions in scope."
          />
          <DomainMatrix rows={view.rows} domains={view.domains} />
        </section>
      ) : null}

      {view.rows.length ? (
        <section className={styles.section} aria-labelledby="due-title">
          <SectionHeader
            id="due-title"
            title="Actions due next"
            description="Unfinished remediation across clients, the earliest due first."
          />
          {view.dueActions.length ? (
            <DueActions rows={view.dueActions} />
          ) : (
            <EmptyState title="No unfinished remediation actions" size="quiet">
              Actions appear here once they are planned from findings.
            </EmptyState>
          )}
        </section>
      ) : null}
    </div>
  )
}
