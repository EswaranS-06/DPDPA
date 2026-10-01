import { formatIst } from '@duatf/core-utils'
import { buttonClass, DataTable, EmptyState, PageHeader, SelectField } from '@duatf/core-ui'
import {
  listAssessments,
  listBands,
  listFindings,
  ratingFor,
  type FindingFilters,
} from '@duatf/feature-compliance-api'
import { FINDING_STATUSES } from '@duatf/platform-db'
import { ListChecks } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BandChip, FindingStatusChip, GapChip } from '@/components/risk/RiskBits'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import styles from '../../clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Findings' }

type Props = { params: Promise<{ code: string }>; searchParams: SearchParams }

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const query = await searchParams
  const statusParam = firstValue(query.status)
  const plan = firstValue(query.plan)
  const filters: FindingFilters = {
    status:
      statusParam === 'all'
        ? undefined
        : (FINDING_STATUSES.find((status) => status === statusParam) ?? 'open'),
    assessmentId: firstValue(query.assessment) || undefined,
    withoutActions: plan === 'none',
  }
  const [rows, assessments, bands] = await Promise.all([
    listFindings(ctx, client.id, filters),
    listAssessments(ctx, client.id),
    listBands(ctx.db),
  ])
  const base = `/clients/${client.code}/findings`
  const filtering = statusParam !== undefined || Boolean(filters.assessmentId) || plan === 'none'

  return (
    <>
      <PageHeader
        title="Findings"
        lede="A No answer raises a gap and a Partial answer a potential gap, each with the recommended action and a risk to rate. A later Yes or Not applicable closes the finding; its history is kept."
      />
      <section className={styles.section} aria-label="Findings list">
        <form method="get" action={base} className={styles.filters} role="search">
          <SelectField
            label="Status"
            name="status"
            options={[
              { value: 'open', label: 'Open' },
              { value: 'closed', label: 'Closed' },
              { value: 'all', label: 'All' },
            ]}
            defaultValue={statusParam ?? 'open'}
          />
          <SelectField
            label="Assessment"
            name="assessment"
            placeholder="All assessments"
            options={assessments.map((row) => ({
              value: row.id,
              label: `${row.code} ${row.title}`,
            }))}
            defaultValue={filters.assessmentId}
          />
          <SelectField
            label="Remediation"
            name="plan"
            placeholder="With or without actions"
            options={[{ value: 'none', label: 'No action planned yet' }]}
            defaultValue={plan}
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
        {rows.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={
              filters.status === 'open' && !filtering
                ? 'No open findings'
                : 'No finding matches these filters'
            }
          >
            Findings appear here when a question is answered No or Partial. Each one carries the
            recommended action and a risk rating.
          </EmptyState>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'finding',
                header: 'Finding',
                render: (row) => (
                  <span className={styles.personCell}>
                    <Link href={`${base}/${row.code}`} className={styles.clientName}>
                      {row.title}
                    </Link>
                    <span className={styles.muted}>
                      <span className="code">{row.code}</span>, question{' '}
                      <Link
                        href={`/clients/${client.code}/assessments/${row.assessmentCode}/items/${row.questionCode}`}
                        className="code"
                      >
                        {row.questionCode}
                      </Link>{' '}
                      in {row.assessmentTitle}
                    </span>
                  </span>
                ),
              },
              { key: 'gap', header: 'Type', render: (row) => <GapChip gapType={row.gapType} /> },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <FindingStatusChip status={row.status} />,
              },
              {
                key: 'risk',
                header: 'Risk',
                render: (row) =>
                  row.riskScore === null ? (
                    <span className={styles.muted}>Not rated</span>
                  ) : (
                    <BandChip band={ratingFor(row.riskScore, bands)} score={row.riskScore} />
                  ),
              },
              {
                key: 'opened',
                header: 'Opened',
                priority: 'low',
                render: (row) => (
                  <span className={styles.personCell}>
                    {formatIst(row.openedAt)}
                    {row.closedReason ? (
                      <span className={styles.muted}>{row.closedReason}</span>
                    ) : null}
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
