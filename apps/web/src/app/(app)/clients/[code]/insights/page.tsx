import { formatDay } from '@duatf/core-utils'
import {
  Callout,
  DataTable,
  Disclosure,
  EmptyState,
  PageHeader,
  Panel,
  SectionHeader,
} from '@duatf/core-ui'
import {
  coverage,
  gapsByCommencement,
  listAssessments,
  MATURITY_LEVELS,
  MATURITY_MAX,
  maturityProfile,
  penaltyExposure,
  type MaturityRow,
} from '@duatf/feature-compliance-api'
import { buildLadder, RegulatoryClock } from '@duatf/feature-framework-library'
import { Radar as RadarIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Bars, Radar, Ring, type RadarSeries } from '@/components/charts/Charts'
import { FilterTabs } from '@/components/FilterTabs'
import { MaturityTargetsForm } from '@/components/forms/InsightForms'
import { libraryApi, today } from '@/server/api'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import page from '../../clients.module.css'
import { setTargetsAction } from './actions'
import styles from './insights.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Insights' }

type Props = { params: Promise<{ code: string }>; searchParams: SearchParams }

const level = (value: number | null) => (value === null ? '—' : value.toFixed(1))

const levelName = (value: number | null) =>
  value === null ? 'Not scored yet' : (MATURITY_LEVELS[Math.floor(value)] ?? '')

const gaps = (count: number) => `${count} open gap${count === 1 ? '' : 's'}`

/** How each domain's level is read, in a sentence for the table. */
const basisText = (row: MaturityRow) =>
  row.basis === 'maturity'
    ? `Mean of ${row.answers} maturity answer${row.answers === 1 ? '' : 's'}`
    : row.basis === 'equivalent'
      ? `From ${row.answers} Yes, Partial or No answer${row.answers === 1 ? '' : 's'}`
      : 'No scored answer yet'

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const query = await searchParams
  const cycles = await listAssessments(ctx, client.id)
  const chosen = firstValue(query.cycle)
  const cycleCode = cycles.some((cycle) => cycle.code === chosen) ? chosen : undefined
  const [profile, penalty, covered, byStart, summary] = await Promise.all([
    maturityProfile(ctx, client.id, cycleCode),
    penaltyExposure(ctx, client.id),
    coverage(ctx, client.id),
    gapsByCommencement(ctx, client.id),
    (await libraryApi()).summary({ asOf: today() }),
  ])
  const base = `/clients/${client.code}`
  const insights = `${base}/insights`
  const compare =
    firstValue(query.compare) === 'previous' && profile.previous ? 'previous' : 'target'
  const cycleQuery = cycleCode ? `cycle=${cycleCode}&` : ''
  const series: RadarSeries[] = [
    {
      key: 'now',
      label: profile.assessment ? `${profile.assessment.code}` : 'Now',
      values: profile.assessed.map((row) => row.level),
      style: 'area',
    },
    compare === 'previous' && profile.previous
      ? {
          key: 'previous',
          label: profile.previous.code,
          values: profile.assessed.map((row) => row.previousLevel),
          style: 'outline',
        }
      : {
          key: 'target',
          label: 'Target',
          values: profile.assessed.map((row) => row.target),
          style: 'outline',
        },
  ]
  const describe = `Maturity by requirement area, on a scale of 0 to ${MATURITY_MAX}: ${profile.assessed
    .map(
      (row) =>
        `${row.domainCode} ${row.title} ${level(row.level)}, ${
          compare === 'previous' ? `previously ${level(row.previousLevel)}` : `target ${row.target}`
        }`,
    )
    .join('; ')}.`
  const exposedFindings = new Set(
    penalty.exposed.flatMap((item) => item.findings.map((finding) => finding.code)),
  ).size

  return (
    <>
      <PageHeader
        title="Insights"
        lede="Where the client stands in each requirement area against its targets, the Schedule items its open gaps fall under, how well the answers are backed by evidence, and when the obligations still to come start to apply."
      />

      {cycles.length > 1 ? (
        <FilterTabs
          label="Assessment cycle"
          tabs={cycles.map((cycle, index) => ({
            href: index === 0 ? insights : `${insights}?cycle=${cycle.code}`,
            label: cycle.code,
            current: (cycleCode ?? cycles[0]?.code) === cycle.code,
          }))}
        />
      ) : null}

      <section className={page.section} aria-labelledby="maturity-heading">
        <SectionHeader
          id="maturity-heading"
          title="Maturity by requirement area"
          description={
            profile.assessment
              ? `${profile.assessment.code}, ${profile.assessment.title}. Level 0 is "${MATURITY_LEVELS[0]}" and level ${MATURITY_MAX} "${MATURITY_LEVELS[MATURITY_MAX]}"; level 3, "${MATURITY_LEVELS[3]}", is the lowest level the question bank counts as compliant.`
              : 'No assessment yet.'
          }
        />
        {profile.assessed.length === 0 ? (
          <EmptyState icon={RadarIcon} title="Nothing scored yet">
            The levels appear once questions of the assessment are answered.
          </EmptyState>
        ) : (
          <div className={styles.maturity}>
            <Panel
              title="Level against target"
              titleId="radar-title"
              actions={
                profile.previous ? (
                  <FilterTabs
                    label="Compare with"
                    tabs={[
                      {
                        href: `${insights}?${cycleQuery}compare=target`,
                        label: 'Target',
                        current: compare === 'target',
                      },
                      {
                        href: `${insights}?${cycleQuery}compare=previous`,
                        label: `Last cycle, ${profile.previous.code}`,
                        current: compare === 'previous',
                      },
                    ]}
                  />
                ) : null
              }
            >
              {profile.assessed.length >= 3 ? (
                <Radar
                  axes={profile.assessed.map((row) => ({
                    key: row.domainCode,
                    label: row.domainCode,
                    title: `${row.domainCode} ${row.title}`,
                  }))}
                  series={series}
                  max={MATURITY_MAX}
                  describe={describe}
                />
              ) : (
                <p className={page.muted}>
                  A radar needs three scored requirement areas or more. The levels are in the table
                  below.
                </p>
              )}
              {profile.overall ? (
                <p className={styles.overall}>
                  Mean level <strong>{level(profile.overall.level)}</strong> against a mean target
                  of {level(profile.overall.target)}, across {profile.assessed.length} of{' '}
                  {profile.rows.length} areas with a scored answer. Areas with none are left off the
                  chart.
                </p>
              ) : null}
            </Panel>

            <Panel title="Gaps to close first" titleId="ranked-title" padding="flush">
              {profile.ranked.length ? (
                <DataTable
                  plain
                  rows={profile.ranked}
                  mobile="scroll"
                  rowKey={(row) => row.domainCode}
                  columns={[
                    {
                      key: 'area',
                      header: 'Requirement area',
                      render: (row) => (
                        <span className={page.personCell}>
                          <Link
                            href={`${base}/assessments/${profile.assessment?.code ?? ''}?domain=${row.domainCode}`}
                          >
                            {row.title}
                          </Link>
                          <span className={page.muted}>
                            <span className="code">{row.domainCode}</span>
                            {row.penaltyTier ? `, Schedule item ${row.penaltyTier}` : ''}
                          </span>
                        </span>
                      ),
                    },
                    {
                      key: 'level',
                      header: 'Level',
                      align: 'end',
                      render: (row) => `${level(row.level)} of ${row.target}`,
                    },
                    { key: 'gap', header: 'Gap', align: 'end', render: (row) => level(row.gap) },
                    {
                      key: 'priority',
                      header: 'Priority',
                      align: 'end',
                      render: (row) => level(row.priority),
                    },
                  ]}
                />
              ) : (
                <p className={styles.panelNote}>Every scored area is at or above its target.</p>
              )}
              <div className={styles.panelNote}>
                <Disclosure summary="How the priority is worked out">
                  <p>
                    Priority is the gap to target multiplied by the weight of the heaviest Schedule
                    item among the area’s obligations: its maximum divided by Rs 50 crore, and at
                    least 1. The weight only orders the list. It is not an estimate of a penalty.
                  </p>
                </Disclosure>
              </div>
            </Panel>
          </div>
        )}

        {profile.rows.length ? (
          <Disclosure summary="Every area as a table" hint={`${profile.rows.length} areas`}>
            <DataTable
              rows={profile.rows}
              rowKey={(row) => row.domainCode}
              mobile="scroll"
              columns={[
                {
                  key: 'area',
                  header: 'Requirement area',
                  render: (row) => (
                    <>
                      <span className="code">{row.domainCode}</span> {row.title}
                    </>
                  ),
                },
                {
                  key: 'level',
                  header: 'Level',
                  align: 'end',
                  render: (row) => level(row.level),
                },
                { key: 'name', header: 'Stands for', render: (row) => levelName(row.level) },
                { key: 'basis', header: 'Worked out from', render: basisText, priority: 'low' },
                { key: 'target', header: 'Target', align: 'end', render: (row) => row.target },
                { key: 'gap', header: 'Gap', align: 'end', render: (row) => level(row.gap) },
                ...(profile.previous
                  ? [
                      {
                        key: 'previous',
                        header: profile.previous.code,
                        align: 'end' as const,
                        render: (row: MaturityRow) => level(row.previousLevel),
                      },
                    ]
                  : []),
              ]}
            />
          </Disclosure>
        ) : null}

        {profile.canEdit && profile.rows.length ? (
          <Disclosure summary="Set the targets" hint="Level 3 unless changed">
            <MaturityTargetsForm
              action={setTargetsAction.bind(null, {
                clientId: client.id,
                clientCode: client.code,
              })}
              domains={profile.rows.map((row) => ({
                code: row.domainCode,
                title: row.title,
                target: row.target,
              }))}
              levels={MATURITY_LEVELS}
            />
          </Disclosure>
        ) : null}
      </section>

      <section className={page.section} aria-labelledby="penalty-heading">
        <SectionHeader
          id="penalty-heading"
          title="Open gaps by Schedule item"
          description={`${exposedFindings} of ${penalty.openFindings} open findings fall under at least one Schedule item. Each bar is the number of open gaps under the item, whose maximum is in its name.`}
        />
        <Callout tone="neutral" title="What the maximums mean">
          <p>{penalty.note}</p>
        </Callout>
        {penalty.items.length ? (
          <Panel>
            <Bars
              label="Open gaps under each Schedule item"
              rows={penalty.items.map((item) => ({
                key: item.tier,
                label: (
                  <>
                    <span className="code">{item.tier}</span> {item.text}
                  </>
                ),
                value: item.findings.length,
                valueText: gaps(item.findings.length),
                quiet: item.findings.length === 0,
                title: `${item.tier}: ${gaps(item.findings.length)}`,
              }))}
            />
          </Panel>
        ) : (
          <p className={page.muted}>The knowledge base release names no Schedule items.</p>
        )}
        {penalty.exposed.map((item) => (
          <Disclosure
            key={item.tier}
            summary={`${item.tier}: the gaps under it`}
            hint={gaps(item.findings.length)}
          >
            <ul className={styles.findingList}>
              {item.findings.map((finding) => (
                <li key={finding.code}>
                  <Link href={`${base}/findings/${finding.code}`} className="code">
                    {finding.code}
                  </Link>{' '}
                  {finding.title}
                </li>
              ))}
            </ul>
          </Disclosure>
        ))}
      </section>

      <section className={page.section} aria-labelledby="coverage-heading">
        <SectionHeader
          id="coverage-heading"
          title="Coverage"
          description={
            covered.assessment
              ? `Scored answers of ${covered.assessment.code} backed by accepted evidence, and open findings with a remediation action.`
              : 'No assessment yet.'
          }
        />
        <div className={styles.rings}>
          <Panel>
            <Ring
              covered={covered.evidence.covered}
              total={covered.evidence.total}
              label="scored answers"
              covers="with accepted evidence"
            />
          </Panel>
          <Panel>
            <Ring
              covered={covered.actions.covered}
              total={covered.actions.total}
              label="open findings"
              covers="with a remediation action"
            />
          </Panel>
        </div>
      </section>

      <div className={page.section}>
        <RegulatoryClock ladder={buildLadder(summary, today())} release={summary.release.version} />
        <Panel title="Open gaps by the date their obligations apply" titleId="commencement-heading">
          {byStart.length ? (
            <DataTable
              plain
              rows={byStart}
              rowKey={(row) => row.date ?? 'now'}
              columns={[
                {
                  key: 'date',
                  header: 'Applies from',
                  render: (row) => (row.date ? formatDay(row.date) : 'In force now'),
                },
                { key: 'gaps', header: 'Open gaps', align: 'end', render: (row) => row.gaps },
              ]}
            />
          ) : (
            <p className={page.muted}>No open gap is tied to an obligation yet.</p>
          )}
        </Panel>
      </div>
    </>
  )
}
