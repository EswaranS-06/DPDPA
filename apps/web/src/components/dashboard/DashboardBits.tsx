import { formatDay } from '@duatf/core-utils'
import { Chip, DataTable, METER_BAND, Meter, meterBand, Stat, StatGrid } from '@duatf/core-ui'
import type {
  Band,
  ClientFigures,
  DepartmentFigureRow,
  Portfolio,
  PortfolioRow,
  Progress,
} from '@duatf/feature-compliance-api'
import { ClockAlert } from 'lucide-react'
import Link from 'next/link'
import { ActionStatusChip } from '@/components/actions/ActionBits'
import { BandChip } from '@/components/risk/RiskBits'
import styles from './DashboardBits.module.css'

export const percent = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${value}%`

const seriousBands = (bands: readonly Band[]) => bands.filter((band) => band.tone === 'severe')

const seriousCount = (byBand: Record<string, number>, bands: readonly Band[]) =>
  seriousBands(bands).reduce((sum, band) => sum + (byBand[band.name] ?? 0), 0)

/** Open findings, serious risks, remediation and evidence: four tiles that link to their lists. */
export const FigurePanels = ({
  figures,
  bands,
  links,
}: {
  figures: ClientFigures
  bands: Band[]
  links: { findings: string; risks: string; actions: string; evidence: string }
}) => {
  const serious = seriousBands(bands)
  return (
    <StatGrid label="Open work">
      <Stat
        label="Open findings"
        value={figures.openFindings.gap + figures.openFindings.potentialGap}
        note={`${figures.openFindings.gap} gaps, ${figures.openFindings.potentialGap} potential gaps`}
        href={links.findings}
      />
      <Stat
        label="Serious risks"
        value={seriousCount(figures.openRisksByBand, bands)}
        note={
          serious.length
            ? `Open and rated ${serious.map((band) => band.name).join(' or ')}`
            : 'No band is marked serious'
        }
        href={links.risks}
        tone={seriousCount(figures.openRisksByBand, bands) > 0 ? 'warning' : 'default'}
      />
      <Stat
        label="Remediation"
        value={figures.actions.open}
        note={`${figures.actions.underReview} under review, ${figures.actions.closed} closed${figures.actions.overdue ? `, ${figures.actions.overdue} overdue` : ''}`}
        href={links.actions}
        tone={figures.actions.overdue > 0 ? 'danger' : 'default'}
        icon={figures.actions.overdue > 0 ? ClockAlert : undefined}
      />
      <Stat
        label="Evidence to review"
        value={figures.evidenceAwaitingReview}
        note="Files waiting for an auditor"
        href={links.evidence}
      />
    </StatGrid>
  )
}

/** Compliance of each requirement area (domain), as meters with the answered count. */
export const RequirementAreas = ({
  domains,
  titles,
  href,
}: {
  domains: { code: string; progress: Progress }[]
  titles: Map<string, string>
  href: (code: string) => string
}) => (
  <ul className={styles.areas}>
    {domains.map((row) => (
      <li key={row.code} className={styles.area}>
        <span className={styles.areaName}>
          <Link href={href(row.code)}>{titles.get(row.code) ?? row.code}</Link>
          <span className={`code ${styles.areaCode}`}>
            {row.code}, {row.progress.answered} of {row.progress.total} answered
          </span>
        </span>
        <Meter
          value={row.progress.compliancePct}
          label={`${titles.get(row.code) ?? row.code} compliance`}
        />
      </li>
    ))}
  </ul>
)

/** Each department's share of the latest assessment and its open work. */
export const DepartmentTable = ({
  rows,
  clientCode,
  bands,
}: {
  rows: DepartmentFigureRow[]
  clientCode: string
  bands: Band[]
}) => (
  <DataTable
    rows={rows}
    rowKey={(row) => row.id ?? 'none'}
    columns={[
      {
        key: 'department',
        header: 'Department',
        render: (row) =>
          row.id ? (
            <span className={styles.cell}>
              <Link href={`/clients/${clientCode}/departments/${row.code}`} className={styles.name}>
                {row.name}
              </Link>
              <span className={`code ${styles.muted}`}>
                {row.fullCode}
                {row.active ? '' : ', inactive'}
              </span>
            </span>
          ) : (
            <span className={styles.muted}>Not assigned to a department</span>
          ),
      },
      {
        key: 'answered',
        header: 'Answered',
        align: 'end',
        render: (row) =>
          row.latestAssessment
            ? `${row.latestAssessment.progress.answered} of ${row.latestAssessment.progress.total}`
            : '—',
      },
      {
        key: 'compliance',
        header: 'Compliance',
        width: '22%',
        render: (row) =>
          row.latestAssessment && row.latestAssessment.progress.total > 0 ? (
            <Meter value={row.latestAssessment.progress.compliancePct} label={row.name} />
          ) : (
            <span className={styles.muted}>No questions</span>
          ),
      },
      {
        key: 'gaps',
        header: 'Open gaps',
        align: 'end',
        render: (row) => row.openFindings.gap + row.openFindings.potentialGap,
      },
      {
        key: 'risks',
        header: 'Serious risks',
        render: (row) => {
          const chips = seriousBands(bands).filter(
            (band) => (row.openRisksByBand[band.name] ?? 0) > 0,
          )
          return chips.length ? (
            <span className={styles.chips}>
              {chips.map((band) => (
                <BandChip key={band.name} band={band} score={row.openRisksByBand[band.name]} />
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
          <span className={styles.cell}>
            <span>{row.actions.open} open</span>
            {row.actions.overdue ? (
              <span className={styles.overdue}>{row.actions.overdue} overdue</span>
            ) : null}
          </span>
        ),
      },
      {
        key: 'evidence',
        header: 'Evidence to review',
        align: 'end',
        priority: 'low',
        render: (row) => row.evidenceAwaitingReview,
      },
    ]}
  />
)

const BAND_CLASS = {
  good: styles.good,
  fair: styles.fair,
  poor: styles.poor,
  none: styles.none,
}

/** Compliance of every client's latest assessment, domain by domain. */
export const DomainMatrix = ({
  rows,
  domains,
}: {
  rows: PortfolioRow[]
  domains: Portfolio['domains']
}) => (
  <div className={styles.matrixWrap}>
    <div className={styles.scroller}>
      <table className={styles.matrix}>
        <caption className="visually-hidden">
          Compliance of each client&apos;s latest assessment by domain
        </caption>
        <thead>
          <tr>
            <th scope="col" className={styles.rowHead}>
              Client
            </th>
            <th scope="col">All</th>
            {domains.map((item) => (
              <th key={item.code} scope="col" title={item.title}>
                <abbr title={item.title} className="code">
                  {item.code}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const overall = row.latestAssessment?.progress.compliancePct
            return (
              <tr key={row.id}>
                <th scope="row" className={styles.rowHead}>
                  <Link href={`/clients/${row.code}`}>{row.name}</Link>
                </th>
                <td className={`${styles.all} ${BAND_CLASS[meterBand(overall)]}`}>
                  {percent(overall)}
                </td>
                {domains.map((item) => {
                  const value = row.latestAssessment?.domains.find(
                    (entry) => entry.code === item.code,
                  )?.progress.compliancePct
                  return (
                    <td
                      key={item.code}
                      className={BAND_CLASS[meterBand(value)]}
                      title={`${row.name}, ${item.code} ${item.title}: ${percent(value)}`}
                    >
                      {value === null || value === undefined ? (
                        <span aria-label="Not answered yet">–</span>
                      ) : (
                        Math.round(value)
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    <ul className={styles.legend}>
      {(['good', 'fair', 'poor', 'none'] as const).map((band) => {
        const Icon = METER_BAND[band].icon
        return (
          <li key={band}>
            <span className={`${styles.swatch} ${BAND_CLASS[band]}`} aria-hidden="true">
              <Icon size={11} strokeWidth={2.5} />
            </span>
            {METER_BAND[band].label}
          </li>
        )
      })}
      <li className={styles.legendNote}>Hover a domain code for its name.</li>
    </ul>
  </div>
)

/** Unfinished actions across clients, the earliest due first. */
export const DueActions = ({ rows }: { rows: Portfolio['dueActions'] }) => (
  <DataTable
    rows={rows}
    rowKey={(row) => row.id}
    columns={[
      {
        key: 'action',
        header: 'Action',
        render: (row) => (
          <span className={styles.cell}>
            <Link href={`/clients/${row.clientCode}/actions/${row.code}`} className={styles.name}>
              {row.title}
            </Link>
            <span className={styles.muted}>
              {row.clientName}, <span className="code">{row.code}</span>
            </span>
          </span>
        ),
      },
      {
        key: 'owner',
        header: 'Owner',
        priority: 'low',
        render: (row) => (
          <span className={styles.cell}>
            {row.ownerName ?? <span className={styles.muted}>Not assigned</span>}
            {row.departmentName ? <span className={styles.muted}>{row.departmentName}</span> : null}
          </span>
        ),
      },
      {
        key: 'due',
        header: 'Due',
        render: (row) =>
          row.dueDate ? (
            <span className={styles.cell}>
              {formatDay(row.dueDate)}
              {row.overdue ? (
                <Chip tone="danger" icon={ClockAlert}>
                  Overdue
                </Chip>
              ) : null}
            </span>
          ) : (
            <span className={styles.muted}>No date</span>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <ActionStatusChip status={row.status} />,
      },
    ]}
  />
)
