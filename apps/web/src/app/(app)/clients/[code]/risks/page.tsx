import { buttonClass, DataTable, EmptyState, PageHeader, Panel, SelectField } from '@duatf/core-ui'
import { heatmap, listBands, listRisks, type RiskFilters } from '@duatf/feature-compliance-api'
import { RISK_STATUSES } from '@duatf/platform-db'
import { TriangleAlert } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import dash from '@/components/dashboard/DashboardBits.module.css'
import { BandChip, Heatmap, RiskStatusChip } from '@/components/risk/RiskBits'
import { STATUS } from '@/components/status'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import styles from '../../clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Risk register' }

const TREATMENT: Record<string, string> = {
  mitigate: 'Mitigate',
  accept: 'Accept',
  transfer: 'Transfer',
  avoid: 'Avoid',
}

type Props = { params: Promise<{ code: string }>; searchParams: SearchParams }

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const query = await searchParams
  const filters: RiskFilters = {
    status: RISK_STATUSES.find((status) => status === firstValue(query.status)),
    band: firstValue(query.band) || undefined,
  }
  const [all, bands] = await Promise.all([listRisks(ctx, client.id), listBands(ctx.db)])
  const rows = all.filter(
    (row) =>
      (!filters.status || row.status === filters.status) &&
      (!filters.band || row.band.name === filters.band),
  )
  const base = `/clients/${client.code}/risks`

  return (
    <>
      <PageHeader
        title="Risk register"
        lede="One risk per finding, rated by likelihood and impact on scales of 1 to 5. Only the client DPO can accept a risk instead of fixing it."
      />
      <div className={dash.split}>
        <Panel title="How risks are rated" titleId="rating-title">
          <p className={styles.flush}>
            Score = likelihood × impact. Impact starts from the penalty exposure of the obligations
            behind the question; the audit team adjusts both when it rates the risk.
          </p>
          <ul className={styles.bullets}>
            {bands.map((band) => (
              <li key={band.name}>
                <BandChip band={band} /> scores {band.minScore} to {band.maxScore}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Open risks" titleId="heatmap-title">
          <Heatmap grid={heatmap(all)} bands={bands} />
        </Panel>
      </div>
      <section className={styles.section} aria-label="Risks">
        <form method="get" action={base} className={styles.filters} role="search">
          <SelectField
            label="Status"
            name="status"
            placeholder="Any status"
            options={RISK_STATUSES.map((status) => ({
              value: status,
              label: STATUS.risk[status].label,
            }))}
            defaultValue={filters.status}
          />
          <SelectField
            label="Rating"
            name="band"
            placeholder="Any rating"
            options={bands.map((band) => ({ value: band.name, label: band.name }))}
            defaultValue={filters.band}
          />
          <button type="submit" className={buttonClass('secondary')}>
            Apply filters
          </button>
          {filters.status || filters.band ? (
            <Link href={base} className={buttonClass('ghost')}>
              Clear filters
            </Link>
          ) : null}
        </form>
        {rows.length === 0 ? (
          <EmptyState
            icon={TriangleAlert}
            title={all.length ? 'No risk matches these filters' : 'No risks yet'}
          >
            Each finding gets a risk to rate. Findings come from No and Partial answers.
          </EmptyState>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'risk',
                header: 'Risk',
                render: (row) => (
                  <span className={styles.personCell}>
                    {row.findingCode ? (
                      <Link
                        href={`/clients/${client.code}/findings/${row.findingCode}`}
                        className={styles.clientName}
                      >
                        {row.title}
                      </Link>
                    ) : (
                      <strong>{row.title}</strong>
                    )}
                    <span className={styles.muted}>
                      <span className="code">{row.code}</span>
                      {row.questionCode ? (
                        <>
                          , question <span className="code">{row.questionCode}</span>
                        </>
                      ) : null}
                      {row.ownerName ? `, owner ${row.ownerName}` : ''}
                    </span>
                  </span>
                ),
              },
              {
                key: 'score',
                header: 'Likelihood × impact',
                align: 'end',
                render: (row) => `${row.likelihood} × ${row.impact}`,
              },
              {
                key: 'band',
                header: 'Rating',
                render: (row) => <BandChip band={row.band} score={row.score} />,
              },
              {
                key: 'treatment',
                header: 'Treatment',
                priority: 'low',
                render: (row) => TREATMENT[row.treatment] ?? row.treatment,
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <RiskStatusChip status={row.status} />,
              },
            ]}
          />
        )}
      </section>
    </>
  )
}
