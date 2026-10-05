import { AccessDeniedError, can } from '@duatf/core-access'
import { formatDay } from '@duatf/core-utils'
import {
  buttonClass,
  Callout,
  Citation,
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  SectionHeader,
} from '@duatf/core-ui'
import {
  assignablePeople,
  departmentDashboard,
  getAssessment,
  listEvidenceRequests,
  listItems,
  NotFoundError,
} from '@duatf/feature-compliance-api'
import {
  ClipboardList,
  Download,
  FileCheck,
  ListChecks,
  ListTodo,
  Pencil,
  Wrench,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionTable } from '@/components/actions/ActionBits'
import { AssessmentStatusChip } from '@/components/assessment/AssessmentBits'
import { QuestionList } from '@/components/assessment/QuestionList'
import { FigurePanels, RequirementAreas } from '@/components/dashboard/DashboardBits'
import dash from '@/components/dashboard/DashboardBits.module.css'
import { Posture } from '@/components/dashboard/Posture'
import { EvidenceTable } from '@/components/evidence/EvidenceTable'
import { CheckAllForm } from '@/components/forms/AssessmentForms'
import { BulkAssignForm } from '@/components/forms/AssignForms'
import { BandChip, GapChip, Heatmap } from '@/components/risk/RiskBits'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import { assignDepartmentAction, checkAllAction } from '../../assessments/actions'
import styles from '../../../clients.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; dep: string }>; searchParams: SearchParams }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: `Department ${decodeURIComponent((await params).dep).toUpperCase()}`,
})

export default async function Page({ params, searchParams }: Props) {
  const { code, dep } = await params
  const kept = firstValue((await searchParams).kept)
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
  const [items, cycle] = latest
    ? await Promise.all([
        listItems(ctx, client.id, latest.id, { department: department.id }),
        getAssessment(ctx, client.id, latest.code),
      ])
    : [[], null]
  const canAssign = can(ctx.principal, 'assessment.assign', { clientId: client.id })
  const [people, requests] = await Promise.all([
    canAssign ? assignablePeople(ctx, client.id) : Promise.resolve([]),
    listEvidenceRequests(ctx, client.id, { departmentId: department.id, open: true }),
  ])
  const unchecked = items.filter(
    (item) => item.answer !== 'not_assessed' && item.reviewState !== 'accepted',
  ).length
  const open = latest !== null && latest.status !== 'completed'

  return (
    <>
      <PageHeader
        kicker={<span className="code">{department.fullCode}</span>}
        title={department.name}
        lede={department.description ?? undefined}
        actions={
          <>
            {department.active ? (
              <Link
                href={`${base}/departments/${department.code}/edit`}
                className={buttonClass('secondary')}
              >
                <Pencil size={16} aria-hidden="true" />
                Edit questions
              </Link>
            ) : null}
            <a
              href={`${base}/departments/${department.code}/workbook`}
              className={buttonClass('secondary')}
              rel="nofollow"
            >
              <Download size={16} aria-hidden="true" />
              Workbook
            </a>
          </>
        }
      >
        {department.headName ? <span>Contact: {department.headName}</span> : null}
        {department.headEmail ? <span>{department.headEmail}</span> : null}
        {department.active ? null : <span>Inactive</span>}
      </PageHeader>

      {kept ? (
        <Callout tone="neutral" title="Some questions stayed with the department">
          <p>
            {kept}. Clear the answer and unlink the evidence first if a question really should go.
          </p>
        </Callout>
      ) : null}

      <section className={styles.section} aria-labelledby="questions-title">
        <SectionHeader
          id="questions-title"
          title="Questions"
          count={items.length}
          actions={
            latest ? (
              <span className={styles.muted}>
                In <Link href={`${base}/assessments/${latest.code}`}>{latest.code}</Link>{' '}
                <AssessmentStatusChip status={latest.status} />
              </span>
            ) : null
          }
        />
        {items.length === 0 ? (
          <EmptyState icon={ListTodo} title="No questions chosen yet">
            {department.active ? (
              <>
                <Link href={`${base}/departments/${department.code}/edit`}>Choose questions</Link>{' '}
                from the Data Fiduciary, internal handler or external handler templates.
              </>
            ) : (
              'Reactivate the department to give it questions.'
            )}
          </EmptyState>
        ) : (
          <>
            {open && canAssign && latest ? (
              <Panel title="Give the questions to someone" titleId="bulk-title">
                <p className={`${styles.flush} ${styles.muted}`}>
                  For example the department head. Add people (with or without a login) under
                  People; single questions are given from each question page.
                </p>
                <BulkAssignForm
                  action={assignDepartmentAction.bind(null, {
                    clientId: client.id,
                    clientCode: client.code,
                    assessmentId: latest.id,
                    departmentId: department.id,
                  })}
                  people={people}
                />
              </Panel>
            ) : null}
            {requests.length ? (
              <Panel title={`Open evidence requests (${requests.length})`} titleId="dept-requests">
                <ul className={styles.bullets}>
                  {requests.map((row) => (
                    <li key={row.id}>
                      <Link
                        href={`${base}/assessments/${row.assessmentCode}/items/${department.code}/${row.questionCode}`}
                        className="code"
                      >
                        {row.questionCode}
                      </Link>{' '}
                      {row.title}
                      <span className={styles.muted}>
                        {row.assigneeName ? `, from ${row.assigneeName}` : ''}
                        {row.dueDate ? `, by ${formatDay(row.dueDate)}` : ''}
                        {row.status === 'received' ? ', received, to review' : ''}
                        {row.overdue ? ', overdue' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}
            {open && unchecked > 0 && latest ? (
              <Panel title={`${unchecked} answers not checked yet`} titleId="check-title">
                <p className={`${styles.flush} ${styles.muted}`}>
                  Tick an answer as checked once its evidence has been looked at. A cycle can be
                  completed when every answer is checked.
                </p>
                <CheckAllForm
                  action={checkAllAction.bind(null, {
                    clientId: client.id,
                    clientCode: client.code,
                    assessmentId: latest.id,
                    assessmentCode: latest.code,
                    departmentId: department.id,
                  })}
                  count={unchecked}
                />
              </Panel>
            ) : null}
            <QuestionList
              items={items}
              questionnaires={cycle?.questionnaires ?? []}
              hrefFor={(item) =>
                `${base}/assessments/${latest?.code ?? ''}/items/${department.code}/${item.questionCode}`
              }
            />
          </>
        )}
      </section>

      <div className={dash.twoUp}>
        {latest && latest.progress.total > 0 ? (
          <Posture
            progress={latest.progress}
            source={{
              code: latest.code,
              title: `${latest.title}, ${department.name}`,
              href: `${base}/assessments/${latest.code}?department=${department.id}`,
              status: <AssessmentStatusChip status={latest.status} />,
            }}
            trend={[]}
          />
        ) : (
          <EmptyState icon={ClipboardList} title="No posture yet">
            The posture appears once this department has questions with scored answers.
          </EmptyState>
        )}
        <Panel title="Open risks" titleId="heatmap-title">
          <Heatmap grid={view.heatmap} bands={bands} />
        </Panel>
      </div>

      <FigurePanels
        figures={figures}
        bands={bands}
        links={{
          findings: `${base}/findings?status=open`,
          risks: `${base}/risks`,
          actions: `${base}/actions`,
          evidence: `${base}/evidence`,
        }}
      />

      {latest && latest.domains.length ? (
        <Panel title="Requirement areas" titleId="areas-title">
          <RequirementAreas
            domains={latest.domains}
            titles={titles}
            href={(domain) =>
              `${base}/assessments/${latest.code}?domain=${domain}&department=${department.id}`
            }
          />
        </Panel>
      ) : null}

      <section className={styles.section} aria-labelledby="findings-title">
        <SectionHeader id="findings-title" title="Open findings" count={view.findings.length} />
        {view.findings.length === 0 ? (
          <EmptyState icon={ListChecks} title="No open findings" size="quiet">
            Findings appear when an answer shows a gap or a partial gap.
          </EmptyState>
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
                      <Citation>{row.code}</Citation>, question{' '}
                      <span className="code">{row.questionCode}</span> in{' '}
                      <span className="code">{row.assessmentCode}</span>
                    </span>
                  </span>
                ),
              },
              { key: 'type', header: 'Type', render: (row) => <GapChip gapType={row.gapType} /> },
              {
                key: 'risk',
                header: 'Risk',
                render: (row) =>
                  row.band ? (
                    <BandChip band={row.band} score={row.riskScore ?? undefined} />
                  ) : (
                    <span className={styles.muted}>Not rated</span>
                  ),
              },
            ]}
          />
        )}
      </section>

      <section className={styles.section} aria-labelledby="actions-title">
        <SectionHeader id="actions-title" title="Remediation actions" count={view.actions.length} />
        {view.actions.length === 0 ? (
          <EmptyState icon={Wrench} title="No actions planned" size="quiet">
            Plan actions from this department&apos;s findings.
          </EmptyState>
        ) : (
          <ActionTable rows={view.actions} clientCode={client.code} />
        )}
      </section>

      <section className={styles.section} aria-labelledby="evidence-title">
        <SectionHeader id="evidence-title" title="Evidence" count={view.evidence.length} />
        {view.evidence.length === 0 ? (
          <EmptyState icon={FileCheck} title="No evidence filed yet" size="quiet">
            Evidence you attach to this department&apos;s questions and actions appears here.
          </EmptyState>
        ) : (
          <EvidenceTable rows={view.evidence} clientCode={client.code} />
        )}
      </section>
    </>
  )
}
