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
  getAssessment,
  listItems,
  NotFoundError,
  REVIEW_LABEL,
  TRANSITIONS,
  type ItemFilters,
} from '@duatf/feature-compliance-api'
import {
  COMPLIANCE_STATES,
  REVIEW_STATES,
  type ComplianceState,
  type ReviewState,
} from '@duatf/platform-db'
import { SearchX } from 'lucide-react'
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
import { AssignForm, StatusButtons } from '@/components/forms/AssessmentForms'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'
import { reassessAction } from '../../actions/actions'
import { assignItemsAction, changeStatusAction } from '../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; asm: string }>; searchParams: SearchParams }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).asm),
})

const oneOf = <T extends string>(values: readonly T[], value: string | undefined): T | undefined =>
  values.find((item) => item === value)

const REVIEW_FILTERS: readonly (ReviewState | 'awaiting')[] = [...REVIEW_STATES, 'awaiting']

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
  const ownDepartment = ctx.principal.assignments.find(
    (assignment) => assignment.role === 'department_owner' && assignment.clientId === client.id,
  )?.departmentId
  const filters: ItemFilters = {
    domain: firstValue(query.domain) || undefined,
    department:
      firstValue(query.department) ||
      (query.department === undefined ? (ownDepartment ?? undefined) : undefined),
    state: oneOf<ComplianceState>(COMPLIANCE_STATES, firstValue(query.state)),
    review: oneOf(REVIEW_FILTERS, firstValue(query.review)),
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
  const departmentOptions = detail.departments
    .filter((row) => row.id !== null)
    .map((row) => ({ value: row.id ?? '', label: row.name }))
  const filtering = Object.values(filters).some(Boolean)

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
            Starts a new assessment on the current knowledge base, linked to this one, with the same
            department for each question. Answers start empty and the previous answer is shown
            beside each question. Open findings are resolved or carried forward as the new answers
            come in.
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
                  <Link
                    href={`${base}?domain=${row.code}&department=`}
                    className={styles.personCell}
                  >
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
            rowKey={(row) => row.id ?? 'none'}
            columns={[
              {
                key: 'department',
                header: 'Department',
                render: (row) => (
                  <Link href={`${base}?department=${row.id ?? 'none'}`}>{row.name}</Link>
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

      {can(ctx.principal, 'assessment.assign', scope) && detail.status !== 'completed' ? (
        <Panel title="Assign questions to a department" titleId="assign">
          {departmentOptions.length === 0 ? (
            <p className={`${styles.flush} ${styles.sectionIntro}`}>
              Add departments first, on the{' '}
              <Link href={`/clients/${client.code}/departments`}>Departments</Link> page.
            </p>
          ) : (
            <AssignForm
              action={assignItemsAction.bind(null, target)}
              departments={departmentOptions}
              domains={detail.domains.map((row) => ({
                value: row.code,
                label: `${row.code} ${row.title}`,
              }))}
            />
          )}
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
            options={[...departmentOptions, { value: 'none', label: 'Not assigned' }]}
            defaultValue={filters.department}
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
            label="Review"
            name="review"
            placeholder="Any review state"
            options={[
              ...REVIEW_STATES.map((state) => ({ value: state, label: REVIEW_LABEL[state] })),
              { value: 'awaiting', label: 'Answered, not reviewed' },
            ]}
            defaultValue={filters.review}
          />
          <button type="submit" className={buttonClass('secondary')}>
            Apply filters
          </button>
          {filtering ? (
            <Link href={`${base}?department=`} className={buttonClass('ghost')}>
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
                      href={`${base}/items/${row.questionCode}`}
                      className={styles.questionLink}
                    >
                      {row.text}
                    </Link>
                    <span className={`code ${styles.muted}`}>{row.questionCode}</span>
                  </span>
                ),
              },
              {
                key: 'department',
                header: 'Department',
                width: '20%',
                render: (row) =>
                  row.departmentName ?? <span className={styles.muted}>Not assigned</span>,
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
