import { formatDay } from '@duatf/core-utils'
import { Chip, DataTable } from '@duatf/core-ui'
import type {
  Band,
  ClientFigures,
  DepartmentFigureRow,
  Portfolio,
  PortfolioRow,
} from '@duatf/feature-compliance-api'
import Link from 'next/link'
import { ActionStatusChip } from '@/components/actions/ActionBits'
import { ProgressBar } from '@/components/assessment/AssessmentBits'
import { BandChip } from '@/components/risk/RiskBits'
import clientStyles from '@/app/(app)/clients/clients.module.css'
import styles from './DashboardBits.module.css'

export const percent = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${value}%`

const toneClass = (value: number | null | undefined) =>
  value === null || value === undefined
    ? styles.none
    : value >= 80
      ? styles.good
      : value >= 50
        ? styles.fair
        : styles.poor

const seriousBands = (bands: readonly Band[]) => bands.filter((band) => band.tone === 'severe')

/** Open findings, open risks by band, remediation and evidence, as four panels. */
export const FigurePanels = ({
  figures,
  bands,
  links,
}: {
  figures: ClientFigures
  bands: Band[]
  links: { findings: string; actions: string; evidence: string }
}) => (
  <dl className={clientStyles.profile}>
    <div className={clientStyles.panel}>
      <dt>Open findings</dt>
      <dd>
        <Link href={links.findings}>
          {figures.openFindings.gap} gaps, {figures.openFindings.potentialGap} potential gaps
        </Link>
      </dd>
    </div>
    <div className={clientStyles.panel}>
      <dt>Open risks</dt>
      <dd className={clientStyles.roles}>
        {bands.map((band) => (
          <BandChip key={band.name} band={band} score={figures.openRisksByBand[band.name] ?? 0} />
        ))}
      </dd>
    </div>
    <div className={clientStyles.panel}>
      <dt>Remediation</dt>
      <dd>
        <Link href={links.actions}>
          {figures.actions.open} open, {figures.actions.underReview} under review,{' '}
          {figures.actions.closed} closed
        </Link>
        {figures.actions.overdue ? (
          <span className={clientStyles.overdueText}> · {figures.actions.overdue} overdue</span>
        ) : null}
      </dd>
    </div>
    <div className={clientStyles.panel}>
      <dt>Evidence awaiting review</dt>
      <dd>
        <Link href={links.evidence}>{figures.evidenceAwaitingReview}</Link>
      </dd>
    </div>
  </dl>
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
            <span className={clientStyles.personCell}>
              <Link
                href={`/clients/${clientCode}/departments/${row.code}`}
                className={clientStyles.clientName}
              >
                {row.name}
              </Link>
              <span className={clientStyles.muted}>
                {row.fullCode}
                {row.active ? '' : ' · inactive'}
              </span>
            </span>
          ) : (
            <span className={clientStyles.muted}>Not assigned to a department</span>
          ),
      },
      {
        key: 'answered',
        header: 'Answered',
        align: 'end',
        render: (row) =>
          row.latestAssessment
            ? `${row.latestAssessment.progress.answered}/${row.latestAssessment.progress.total}`
            : '—',
      },
      {
        key: 'compliance',
        header: 'Compliance',
        align: 'end',
        render: (row) => (
          <span
            className={`${styles.pct} ${toneClass(row.latestAssessment?.progress.compliancePct)}`}
          >
            {percent(row.latestAssessment?.progress.compliancePct)}
          </span>
        ),
      },
      {
        key: 'bar',
        header: <span className="visually-hidden">Progress</span>,
        width: '22%',
        render: (row) =>
          row.latestAssessment && row.latestAssessment.progress.total > 0 ? (
            <ProgressBar progress={row.latestAssessment.progress} label={row.name} />
          ) : null,
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
        render: (row) => (
          <span className={clientStyles.roles}>
            {seriousBands(bands).map((band) =>
              (row.openRisksByBand[band.name] ?? 0) > 0 ? (
                <BandChip key={band.name} band={band} score={row.openRisksByBand[band.name]} />
              ) : null,
            )}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <span className={clientStyles.personCell}>
            <span>{row.actions.open} open</span>
            {row.actions.overdue ? (
              <span className={clientStyles.overdueText}>{row.actions.overdue} overdue</span>
            ) : null}
          </span>
        ),
      },
      {
        key: 'evidence',
        header: 'Evidence to review',
        align: 'end',
        render: (row) => row.evidenceAwaitingReview,
      },
    ]}
  />
)

/** Compliance of every client's latest assessment, domain by domain. */
export const DomainMatrix = ({
  rows,
  domains,
}: {
  rows: PortfolioRow[]
  domains: Portfolio['domains']
}) => (
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
              <abbr title={item.title}>{item.code}</abbr>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <th scope="row" className={styles.rowHead}>
              <Link href={`/clients/${row.code}`}>{row.name}</Link>
            </th>
            <td className={toneClass(row.latestAssessment?.progress.compliancePct)}>
              {percent(row.latestAssessment?.progress.compliancePct)}
            </td>
            {domains.map((item) => {
              const value = row.latestAssessment?.domains.find((entry) => entry.code === item.code)
                ?.progress.compliancePct
              return (
                <td
                  key={item.code}
                  className={toneClass(value)}
                  title={`${row.name}, ${item.code} ${item.title}: ${percent(value)}`}
                >
                  {value === null || value === undefined ? '—' : Math.round(value)}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
    <p className={styles.legend}>
      <span className={`${styles.swatch} ${styles.good}`} /> 80% or more
      <span className={`${styles.swatch} ${styles.fair}`} /> 50 to 79%
      <span className={`${styles.swatch} ${styles.poor}`} /> under 50%
      <span className={`${styles.swatch} ${styles.none}`} /> not answered yet. Hover a code for the
      domain name.
    </p>
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
          <span className={clientStyles.personCell}>
            <Link
              href={`/clients/${row.clientCode}/actions/${row.code}`}
              className={clientStyles.clientName}
            >
              {row.title}
            </Link>
            <span className={clientStyles.muted}>
              {row.clientName} · {row.code}
            </span>
          </span>
        ),
      },
      {
        key: 'owner',
        header: 'Owner',
        render: (row) => (
          <span className={clientStyles.personCell}>
            {row.ownerName ?? <span className={clientStyles.muted}>Not assigned</span>}
            {row.departmentName ? (
              <span className={clientStyles.muted}>{row.departmentName}</span>
            ) : null}
          </span>
        ),
      },
      {
        key: 'due',
        header: 'Due',
        render: (row) =>
          row.dueDate ? (
            <span className={clientStyles.roles}>
              {formatDay(row.dueDate)}
              {row.overdue ? <Chip tone="severe">Overdue</Chip> : null}
            </span>
          ) : (
            '—'
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
