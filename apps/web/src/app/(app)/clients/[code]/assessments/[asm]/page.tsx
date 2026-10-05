import { can } from '@duatf/core-access'
import { formatDay } from '@duatf/core-utils'
import {
  buttonClass,
  DataTable,
  EmptyState,
  Meter,
  PageHeader,
  Panel,
  SectionHeader,
  SelectField,
} from '@duatf/core-ui'
import {
  COMPLIANCE_LABEL,
  describeResponse,
  getAssessment,
  listItems,
  NotFoundError,
  TRANSITIONS,
  type ItemFilters,
} from '@duatf/feature-compliance-api'
import { COMPLIANCE_STATES, type ComplianceState } from '@duatf/platform-db'
import { ListTodo, SearchX } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AssessmentStatusChip,
  ComplianceChip,
  Legend,
  Metrics,
  ProgressBar,
  ReviewChip,
} from '@/components/assessment/AssessmentBits'
import dash from '@/components/dashboard/DashboardBits.module.css'
import { ReassessForm } from '@/components/forms/ActionForms'
import { CheckAllForm, StatusButtons } from '@/components/forms/AssessmentForms'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'
import { reassessAction } from '../../actions/actions'
import { changeStatusAction, checkAllAction } from '../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; asm: string }>; searchParams: SearchParams }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).asm),
})

const oneOf = <T extends string>(values: readonly T[], value: string | undefined): T | undefined =>
  values.find((item) => item === value)

const CHECK_FILTERS = ['unchecked', 'checked'] as const

export default async function Page({ params, searchParams }: Props) {
  const { code, asm } = await params
  const client = await loadClient(code)
  const ctx = await serviceContext()
  const detail = await getAssessment(ctx, client.id, decodeURIComponent(asm)).catch(
    (error: unknown) => {
      if (error instanceof NotFoundError) notFound()
      throw error
    },
  )
  const query = await searchParams
  // A department by id (from the filter) or by code (a typed link); anything else is ignored.
  const wanted = firstValue(query.department)
  const department = detail.departments.find(
    (row) => row.id === wanted || row.code === wanted?.toUpperCase(),
  )
  const filters: ItemFilters = {
    domain: firstValue(query.domain) || undefined,
    department: department?.id,
    questionnaire: firstValue(query.questionnaire) || undefined,
    state: oneOf<ComplianceState>(COMPLIANCE_STATES, firstValue(query.state)),
    check: oneOf(CHECK_FILTERS, firstValue(query.check)),
  }
  const items = await listItems(ctx, client.id, detail.id, filters)
  const scope = { clientId: client.id }
  const transitions = TRANSITIONS[detail.status].filter((transition) =>
    can(ctx.principal, transition.capability, scope),
  )
  const target = {
    clientId: client.id,
    clientCode: client.code,
    assessmentId: detail.id,
    assessmentCode: detail.code,
  }
  const base = `/clients/${client.code}/assessments/${detail.code}`
  const departmentOptions = detail.departments.map((row) => ({ value: row.id, label: row.name }))
  const filtering = Object.values(filters).some(Boolean)
  const unchecked = detail.progress.answered - detail.progress.accepted
  const open = detail.status !== 'completed'

  return (
    <>
      <PageHeader
        kicker={
          <span>
            <span className="code">{detail.code}</span>, knowledge base release{' '}
            {detail.releaseVersion}
          </span>
        }
        title={detail.title}
        actions={
          <StatusButtons action={changeStatusAction.bind(null, target)} transitions={transitions} />
        }
      >
        <AssessmentStatusChip status={detail.status} />
        {detail.periodStart ? (
          <span>
            Period {formatDay(detail.periodStart)}
            {detail.periodEnd ? ` to ${formatDay(detail.periodEnd)}` : ''}
          </span>
        ) : null}
        {detail.dueDate ? <span>Due {formatDay(detail.dueDate)}</span> : null}
      </PageHeader>

      <section className={styles.section} aria-label="Progress">
        <Metrics progress={detail.progress} />
        <ProgressBar progress={detail.progress} label="All questions" size="large" />
        <Legend progress={detail.progress} />
      </section>

      {detail.status === 'completed' && can(ctx.principal, 'assessment.create', scope) ? (
        <Panel title="Next cycle" titleId="next-cycle">
          <p className={`${styles.flush} ${styles.sectionIntro}`}>
            Starts a new cycle on the current knowledge base, linked to this one, giving every
            active department the questions it had. Answers start empty and the previous answer is
            shown beside each question. Open findings are resolved or carried forward as the new
            answers come in.
          </p>
          <ReassessForm
            action={reassessAction.bind(null, {
              clientId: client.id,
              clientCode: client.code,
              assessmentId: detail.id,
            })}
            defaultTitle={`${detail.title} (re-assessment)`}
          />
        </Panel>
      ) : null}

      <div className={dash.twoUp}>
        <Panel title="By domain" titleId="by-domain" padding="flush">
          <DataTable
            plain
            mobile="scroll"
            rows={detail.domains}
            rowKey={(row) => row.code}
            columns={[
              {
                key: 'domain',
                header: 'Domain',
                render: (row) => (
                  <Link href={`${base}?domain=${row.code}`} className={styles.personCell}>
                    <span>{row.title}</span>
                    <span className={`code ${styles.muted}`}>{row.code}</span>
                  </Link>
                ),
              },
              {
                key: 'answered',
                header: 'Answered',
                align: 'end',
                render: (row) => `${row.progress.answered} of ${row.progress.total}`,
              },
              {
                key: 'gaps',
                header: 'Gaps',
                align: 'end',
                render: (row) => row.progress.gap + row.progress.potentialGap,
              },
              {
                key: 'compliance',
                header: 'Posture',
                width: '30%',
                render: (row) => <Meter value={row.progress.compliancePct} label={row.title} />,
              },
            ]}
          />
        </Panel>
        <Panel title="By department" titleId="by-department" padding="flush">
          <DataTable
            plain
            mobile="scroll"
            rows={detail.departments}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'department',
                header: 'Department',
                render: (row) => (
                  <Link href={`/clients/${client.code}/departments/${row.code}`}>{row.name}</Link>
                ),
              },
              {
                key: 'answered',
                header: 'Answered',
                align: 'end',
                render: (row) => `${row.progress.answered} of ${row.progress.total}`,
              },
              {
                key: 'bar',
                header: 'Answers',
                width: '34%',
                render: (row) => <ProgressBar progress={row.progress} label={row.name} />,
              },
            ]}
          />
        </Panel>
      </div>

      {detail.progress.total === 0 ? (
        <EmptyState icon={ListTodo} title="No questions in this cycle yet">
          Questions come from the departments. Add a department and choose its questions on the{' '}
          <Link href={`/clients/${client.code}/departments`}>Departments</Link> page.
        </EmptyState>
      ) : null}

      {open && unchecked > 0 ? (
        <Panel title={`${unchecked} answers not checked yet`} titleId="check-all">
          <p className={`${styles.flush} ${styles.sectionIntro}`}>
            The cycle can be completed once every question is answered and every answer is ticked as
            checked. Tick them one by one on each question, or all at once here.
          </p>
          <CheckAllForm action={checkAllAction.bind(null, target)} count={unchecked} />
        </Panel>
      ) : null}

      <section className={styles.section} aria-labelledby="questions">
        <SectionHeader id="questions" title="Questions" count={items.length} />
        <form method="get" action={base} className={styles.filters} role="search">
          <SelectField
            label="Domain"
            name="domain"
            placeholder="All domains"
            options={detail.domains.map((row) => ({
              value: row.code,
              label: `${row.code} ${row.title}`,
            }))}
            defaultValue={filters.domain}
          />
          <SelectField
            label="Department"
            name="department"
            placeholder="All departments"
            options={departmentOptions}
            defaultValue={filters.department}
          />
          <SelectField
            label="Questionnaire"
            name="questionnaire"
            placeholder="All questionnaires"
            options={detail.questionnaires.map((row) => ({
              value: row.code,
              label: `${row.code} ${row.title}`,
            }))}
            defaultValue={filters.questionnaire}
          />
          <SelectField
            label="Outcome"
            name="state"
            placeholder="Any outcome"
            options={COMPLIANCE_STATES.map((state) => ({
              value: state,
              label: COMPLIANCE_LABEL[state],
            }))}
            defaultValue={filters.state}
          />
          <SelectField
            label="Self-check"
            name="check"
            placeholder="Checked or not"
            options={[
              { value: 'unchecked', label: 'Answered, not checked' },
              { value: 'checked', label: 'Checked' },
            ]}
            defaultValue={filters.check}
          />
          <button type="submit" className={buttonClass('secondary')}>
            Apply filters
          </button>
          {filtering ? (
            <Link href={base} className={buttonClass('ghost')}>
              Clear filters
            </Link>
          ) : null}
        </form>
        {items.length === 0 ? (
          <EmptyState icon={SearchX} title="No question matches these filters" size="quiet">
            Clear a filter to see more questions.
          </EmptyState>
        ) : (
          <DataTable
            rows={items}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'question',
                header: 'Question',
                render: (row) => (
                  <span className={styles.personCell}>
                    <Link
                      href={`${base}/items/${row.departmentCode ?? '-'}/${row.questionCode}`}
                      className={styles.questionLink}
                    >
                      <span className="code">{row.questionCode}</span> {row.title}
                    </Link>
                    <span className={styles.muted}>
                      {row.answer === 'not_assessed'
                        ? 'Not answered yet'
                        : describeResponse(row, row)}
                    </span>
                  </span>
                ),
              },
              {
                key: 'department',
                header: 'Department',
                width: '20%',
                render: (row) => row.departmentName ?? <span className={styles.muted}>None</span>,
              },
              {
                key: 'outcome',
                header: 'Outcome',
                width: '20%',
                render: (row) => (
                  <span className={styles.roles}>
                    <ComplianceChip state={row.complianceState} />
                    <ReviewChip review={row.reviewState} />
                  </span>
                ),
              },
            ]}
          />
        )}
      </section>
    </>
  )
}
