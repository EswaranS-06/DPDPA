import { can } from '@duatf/core-access'
import { formatDay } from '@duatf/core-utils'
import { buttonClass, DataTable, EmptyState, SelectField } from '@duatf/core-ui'
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
import { AssignForm, StatusButtons } from '@/components/forms/AssessmentForms'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'
import { assignItemsAction, changeStatusAction } from '../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; asm: string }>; searchParams: SearchParams }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).asm),
})

const oneOf = <T extends string>(values: readonly T[], value: string | undefined): T | undefined =>
  values.find((item) => item === value)

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
    domain: firstValue(query.domain),
    department:
      firstValue(query.department) ??
      (query.department === undefined ? (ownDepartment ?? undefined) : undefined),
    state: oneOf<ComplianceState>(COMPLIANCE_STATES, firstValue(query.state)),
    review: oneOf<ReviewState>(REVIEW_STATES, firstValue(query.review)),
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
      <section className={styles.section} aria-labelledby="assessment-title">
        <div className={styles.headerTop}>
          <div className={styles.header}>
            <span className={styles.code}>
              {detail.code} · knowledge base {detail.releaseVersion}
            </span>
            <h2 id="assessment-title" className={styles.sectionTitle}>
              {detail.title}
            </h2>
            <div className={styles.chips}>
              <AssessmentStatusChip status={detail.status} />
              {detail.periodStart ? (
                <span className={styles.muted}>
                  Period {formatDay(detail.periodStart)}
                  {detail.periodEnd ? ` to ${formatDay(detail.periodEnd)}` : ''}
                </span>
              ) : null}
              {detail.dueDate ? (
                <span className={styles.muted}>Due {formatDay(detail.dueDate)}</span>
              ) : null}
            </div>
          </div>
          <StatusButtons action={changeStatusAction.bind(null, target)} transitions={transitions} />
        </div>
        <Metrics progress={detail.progress} />
        <ProgressBar progress={detail.progress} label="All questions" />
        <Legend />
      </section>

      <section className={styles.section} aria-labelledby="by-domain">
        <h2 id="by-domain" className={styles.sectionTitle}>
          By domain and department
        </h2>
        <DataTable
          rows={detail.domains}
          rowKey={(row) => row.code}
          columns={[
            {
              key: 'domain',
              header: 'Domain',
              render: (row) => (
                <Link href={`${base}?domain=${row.code}`}>
                  {row.code} {row.title}
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
              key: 'gaps',
              header: 'Gaps',
              align: 'end',
              render: (row) => row.progress.gap + row.progress.potentialGap,
            },
            {
              key: 'compliance',
              header: 'Compliance',
              align: 'end',
              render: (row) =>
                row.progress.compliancePct === null ? '—' : `${row.progress.compliancePct}%`,
            },
            {
              key: 'bar',
              header: <span className="visually-hidden">Progress</span>,
              width: '28%',
              render: (row) => <ProgressBar progress={row.progress} label={row.title} />,
            },
          ]}
        />
        <DataTable
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
              render: (row) => `${row.progress.answered}/${row.progress.total}`,
            },
            {
              key: 'gaps',
              header: 'Gaps',
              align: 'end',
              render: (row) => row.progress.gap + row.progress.potentialGap,
            },
            {
              key: 'bar',
              header: <span className="visually-hidden">Progress</span>,
              width: '28%',
              render: (row) => <ProgressBar progress={row.progress} label={row.name} />,
            },
          ]}
        />
      </section>

      {can(ctx.principal, 'assessment.assign', scope) && detail.status !== 'completed' ? (
        <section className={`${styles.section} ${styles.panel}`} aria-labelledby="assign">
          <h2 id="assign" className={styles.sectionTitle}>
            Assign questions to a department
          </h2>
          {departmentOptions.length === 0 ? (
            <p className={styles.sectionIntro}>
              Add departments first, on the{' '}
              <Link href={`/clients/${client.code}/departments`}>Departments</Link> tab.
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
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="questions">
        <h2 id="questions" className={styles.sectionTitle}>
          Questions
        </h2>
        <form method="get" action={base} className={styles.filters}>
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
            options={REVIEW_STATES.map((state) => ({ value: state, label: REVIEW_LABEL[state] }))}
            defaultValue={filters.review}
          />
          <button type="submit" className={buttonClass('secondary')}>
            Filter
          </button>
          {filtering ? (
            <Link href={`${base}?department=`} className={styles.muted}>
              Show all
            </Link>
          ) : null}
        </form>
        {items.length === 0 ? (
          <EmptyState title="No question matches these filters." />
        ) : (
          <DataTable
            rows={items}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'code',
                header: 'Code',
                width: '7rem',
                render: (row) => <span className={styles.code}>{row.questionCode}</span>,
              },
              {
                key: 'question',
                header: 'Question',
                render: (row) => (
                  <Link href={`${base}/items/${row.questionCode}`} className={styles.questionLink}>
                    {row.text}
                  </Link>
                ),
              },
              {
                key: 'department',
                header: 'Department',
                render: (row) =>
                  row.departmentName ?? <span className={styles.muted}>Not assigned</span>,
              },
              {
                key: 'outcome',
                header: 'Outcome',
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
