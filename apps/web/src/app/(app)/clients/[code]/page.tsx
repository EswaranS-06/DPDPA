import { can } from '@duatf/core-access'
import { formatDay } from '@duatf/core-utils'
import {
  buttonClass,
  Callout,
  DescriptionList,
  EmptyState,
  PageHeader,
  Panel,
  SectionHeader,
} from '@duatf/core-ui'
import {
  attentionFor,
  clientFigures,
  departmentBreakdown,
  getAssessment,
  listAssessments,
  ORGANISATION_TYPE_LABEL,
} from '@duatf/feature-compliance-api'
import { buildLadder } from '@duatf/feature-framework-library'
import { kbHref } from '@duatf/feature-framework-library-api'
import { ClipboardList, Download, Pencil } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AssessmentStatusChip } from '@/components/assessment/AssessmentBits'
import { ApplicabilityChip, ClientStatusChip } from '@/components/ClientChips'
import { ActionCentre } from '@/components/dashboard/ActionCentre'
import {
  DepartmentTable,
  FigurePanels,
  RequirementAreas,
} from '@/components/dashboard/DashboardBits'
import dash from '@/components/dashboard/DashboardBits.module.css'
import { Posture, type TrendPoint } from '@/components/dashboard/Posture'
import { Heatmap } from '@/components/risk/RiskBits'
import { libraryApi, today } from '@/server/api'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../clients.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: (await loadClient((await params).code)).name,
})

const contact = (name: string | null, email: string | null, phone: string | null) =>
  name || email || phone ? (
    <span className={styles.personCell}>
      {name ? <span>{name}</span> : null}
      {email ? <a href={`mailto:${email}`}>{email}</a> : null}
      {phone ? <span>{phone}</span> : null}
    </span>
  ) : null

const count = (value: number | null) => (value === null ? null : value.toLocaleString('en-IN'))

export default async function Page({ params }: Props) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const { principal } = ctx
  const [figures, breakdown, cycles, attention, summary] = await Promise.all([
    clientFigures(ctx, client.id),
    departmentBreakdown(ctx, client.id),
    listAssessments(ctx, client.id),
    attentionFor(ctx, [client.id]),
    (await libraryApi()).summary({ asOf: today() }),
  ])
  const latest = figures.latestAssessment
    ? await getAssessment(ctx, client.id, figures.latestAssessment.code)
    : null
  const base = `/clients/${client.code}`
  const ownDepartments = breakdown.rows.filter((row) =>
    principal.assignments.some(
      (assignment) =>
        assignment.role === 'department_owner' &&
        assignment.clientId === client.id &&
        assignment.departmentId === row.id,
    ),
  )
  const trend: TrendPoint[] = [...cycles].reverse().map((cycle) => ({
    code: cycle.code,
    label: cycle.code.replace(`ASM-${client.code}-`, 'Cycle '),
    value: cycle.progress.compliancePct,
    current: cycle.status !== 'completed',
  }))
  const ladder = buildLadder(summary, today())
  const titles = new Map((latest?.domains ?? []).map((row) => [row.code, row.title]))

  return (
    <>
      <PageHeader
        kicker={<span className="code">{client.code}</span>}
        title={client.name}
        actions={
          <>
            {can(principal, 'report.export', { clientId: client.id }) ? (
              <a
                href={`${base}/reports/workbook`}
                className={buttonClass('secondary')}
                rel="nofollow"
              >
                <Download size={16} aria-hidden="true" />
                Download client workbook
              </a>
            ) : null}
            {can(principal, 'client.edit', { clientId: client.id }) ? (
              <Link href={`${base}/edit`} className={buttonClass('secondary')}>
                <Pencil size={16} aria-hidden="true" />
                Edit profile
              </Link>
            ) : null}
          </>
        }
      >
        <ClientStatusChip status={client.status} />
        <ApplicabilityChip applicability={client.applicability} />
        <span>{ORGANISATION_TYPE_LABEL[client.organisationType]}</span>
        {client.state ? (
          <span>{[client.state, client.country].filter(Boolean).join(', ')}</span>
        ) : null}
      </PageHeader>

      {ownDepartments.length ? (
        <Callout tone="info" title="Your department">
          {ownDepartments.map((row, index) => (
            <span key={row.id}>
              {index > 0 ? ', ' : ''}
              <Link href={`${base}/departments/${row.code}`}>{row.name} dashboard</Link>
            </span>
          ))}
          : the questions, findings and actions you answer for.
        </Callout>
      ) : null}

      <div className={dash.twoUp}>
        {latest ? (
          <Posture
            progress={latest.progress}
            source={{
              code: latest.code,
              title: latest.title,
              href: `${base}/assessments/${latest.code}`,
              status: <AssessmentStatusChip status={latest.status} />,
              release: latest.releaseVersion,
            }}
            trend={trend}
            caveat={`${ladder.headline} ${ladder.upcoming ?? ''} The posture covers every question, including obligations that have not started yet.`}
          />
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No assessment yet"
            action={
              can(principal, 'assessment.create', { clientId: client.id }) ? (
                <Link href={`${base}/assessments`} className={buttonClass()}>
                  Start an assessment
                </Link>
              ) : null
            }
          >
            The compliance posture, gaps and risks appear here once the first assessment is started
            and questions are answered.
          </EmptyState>
        )}
        <Panel title="Needs your attention" titleId="attention-title">
          <ActionCentre items={attention} showClient={false} />
        </Panel>
      </div>

      <FigurePanels
        figures={figures}
        bands={figures.bands}
        links={{
          findings: `${base}/findings`,
          risks: `${base}/risks`,
          actions: `${base}/actions`,
          evidence: `${base}/evidence?status=pending_review`,
        }}
      />

      <div className={dash.split}>
        {latest && latest.domains.length ? (
          <Panel
            title="Requirement areas"
            titleId="areas-title"
            actions={
              <Link
                href={`${base}/assessments/${latest.code}`}
                className={buttonClass('ghost', 'sm')}
              >
                Open {latest.code}
              </Link>
            }
          >
            <RequirementAreas
              domains={latest.domains}
              titles={titles}
              href={(domain) => `${base}/assessments/${latest.code}?domain=${domain}`}
            />
          </Panel>
        ) : (
          <div />
        )}
        <Panel
          title="Risk picture"
          titleId="heatmap-title"
          actions={
            <Link href={`${base}/risks`} className={buttonClass('ghost', 'sm')}>
              Open the risk register
            </Link>
          }
        >
          <Heatmap grid={figures.heatmap} bands={figures.bands} />
        </Panel>
      </div>

      {breakdown.rows.length ? (
        <section className={styles.section} aria-labelledby="by-department-title">
          <SectionHeader
            id="by-department-title"
            title="By department"
            description="Each department's questions in the latest assessment, and the findings, risks, actions and evidence that belong to it. Open a department for its own dashboard."
          />
          <DepartmentTable rows={breakdown.rows} clientCode={client.code} bands={breakdown.bands} />
        </section>
      ) : null}

      <Panel title="Profile" titleId="profile-title">
        <DescriptionList
          items={[
            { label: 'Legal name', value: client.legalName },
            { label: 'Industry', value: client.industry },
            {
              label: 'Sector overlay',
              value: client.sectorCode ? (
                <Link href={kbHref('sectors', client.sectorCode)}>{client.sectorCode}</Link>
              ) : null,
            },
            {
              label: 'Website',
              value: client.website ? (
                <a href={client.website} rel="noreferrer noopener" target="_blank">
                  {client.website.replace(/^https?:\/\//, '')}
                </a>
              ) : null,
            },
            { label: 'Employees', value: count(client.employeeCount) },
            { label: 'Data principals (approximate)', value: count(client.dataPrincipalCount) },
            {
              label: 'Primary contact',
              value: contact(
                client.primaryContactName,
                client.primaryContactEmail,
                client.primaryContactPhone,
              ),
            },
            {
              label: 'DPO or privacy contact',
              value: contact(client.dpoName, client.dpoEmail, client.dpoPhone),
            },
            {
              label: 'Assessment period',
              value: client.assessmentPeriodStart
                ? `${formatDay(client.assessmentPeriodStart)}${client.assessmentPeriodEnd ? ` to ${formatDay(client.assessmentPeriodEnd)}` : ''}`
                : null,
            },
            { label: 'Registered address', value: client.address, wide: true },
            { label: 'Applicability note', value: client.applicabilityNote, wide: true },
          ]}
        />
      </Panel>
    </>
  )
}
