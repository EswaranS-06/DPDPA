import { buttonClass, DataTable, EmptyState, SelectField } from '@duatf/core-ui'
import { heatmap, listBands, listRisks, type RiskFilters } from '@duatf/feature-compliance-api'
import { RISK_STATUSES } from '@duatf/platform-db'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BandChip, Heatmap, RiskStatusChip } from '@/components/risk/RiskBits'
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
    band: firstValue(query.band),
  }
  const [all, bands] = await Promise.all([listRisks(ctx, client.id), listBands(ctx.db)])
  const rows = all.filter(
    (row) =>
      (!filters.status || row.status === filters.status) &&
      (!filters.band || row.band.name === filters.band),
  )
  const base = `/clients/${client.code}/risks`

  return (
    <section className={styles.section} aria-labelledby="risks-title">
      <h2 id="risks-title" className={styles.sectionTitle}>
        Risk register
      </h2>
      <p className={styles.sectionIntro}>
        Score = likelihood × impact, each from 1 to 5. Bands:{' '}
        {bands.map((band) => `${band.name} ${band.minScore}–${band.maxScore}`).join(', ')}. Impact
        starts from the penalty exposure of the obligations behind the question.
      </p>
      <div className={styles.headerTop}>
        <Heatmap grid={heatmap(all)} bands={bands} />
      </div>
      <form method="get" action={base} className={styles.filters}>
        <SelectField
          label="Status"
          name="status"
          placeholder="Any status"
          options={RISK_STATUSES.map((status) => ({
            value: status,
            label: status[0]?.toUpperCase() + status.slice(1),
          }))}
          defaultValue={filters.status}
        />
        <SelectField
          label="Band"
          name="band"
          placeholder="Any band"
          options={bands.map((band) => ({ value: band.name, label: band.name }))}
          defaultValue={filters.band}
        />
        <button type="submit" className={buttonClass('secondary')}>
          Filter
        </button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="No risks match." />
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
                    {row.code}
                    {row.questionCode ? ` · ${row.questionCode}` : ''}
                    {row.ownerName ? ` · owner ${row.ownerName}` : ''}
                  </span>
                </span>
              ),
            },
            { key: 'l', header: 'L', align: 'end', render: (row) => row.likelihood },
            { key: 'i', header: 'I', align: 'end', render: (row) => row.impact },
            {
              key: 'band',
              header: 'Rating',
              render: (row) => <BandChip band={row.band} score={row.score} />,
            },
            {
              key: 'treatment',
              header: 'Treatment',
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
  )
}
