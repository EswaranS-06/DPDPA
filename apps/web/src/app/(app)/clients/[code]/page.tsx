import { can } from '@duatf/core-access'
import { formatDay } from '@duatf/core-utils'
import { buttonClass, DataTable } from '@duatf/core-ui'
import {
  clientFigures,
  getAssessment,
  ORGANISATION_TYPE_LABEL,
} from '@duatf/feature-compliance-api'
import { kbHref } from '@duatf/feature-framework-library-api'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  AssessmentStatusChip,
  Legend,
  Metrics,
  ProgressBar,
} from '@/components/assessment/AssessmentBits'
import { BandChip } from '@/components/risk/RiskBits'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../clients.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: (await loadClient((await params).code)).name,
})

const Item = ({
  label,
  children,
  wide,
}: {
  label: string
  children: ReactNode
  wide?: boolean
}) => (
  <div className={wide ? styles.wide : undefined}>
    <dt>{label}</dt>
    <dd>{children ?? '—'}</dd>
  </div>
)

const contact = (name: string | null, email: string | null, phone: string | null) =>
  name || email || phone ? (
    <>
      {name ?? ''}
      {email ? (
        <>
          {name ? <br /> : null}
          <a href={`mailto:${email}`}>{email}</a>
        </>
      ) : null}
      {phone ? (
        <>
          <br />
          {phone}
        </>
      ) : null}
    </>
  ) : null

const count = (value: number | null) => (value === null ? null : value.toLocaleString('en-IN'))

export default async function Page({ params }: Props) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const { principal } = ctx
  const figures = await clientFigures(ctx, client.id)
  const latest = figures.latestAssessment
    ? await getAssessment(ctx, client.id, figures.latestAssessment.code)
    : null
  const base = `/clients/${client.code}`
  return (
    <>
      <section className={styles.section} aria-labelledby="dashboard-title">
        <h2 id="dashboard-title" className={styles.sectionTitle}>
          Where things stand
        </h2>
        {latest ? (
          <>
            <p className={styles.sectionIntro}>
              Latest assessment{' '}
              <Link href={`${base}/assessments/${latest.code}`}>{latest.title}</Link> ({latest.code}
              , knowledge base {latest.releaseVersion}){' '}
              <AssessmentStatusChip status={latest.status} />
            </p>
            <Metrics progress={latest.progress} />
            <ProgressBar progress={latest.progress} label="All questions" />
            <Legend />
          </>
        ) : (
          <p className={styles.sectionIntro}>
            No assessment yet. <Link href={`${base}/assessments`}>Start one</Link> to see progress
            and gaps here.
          </p>
        )}
        <dl className={styles.profile}>
          <div className={styles.panel}>
            <dt>Open findings</dt>
            <dd>
              <Link href={`${base}/findings`}>
                {figures.openFindings.gap} gaps, {figures.openFindings.potentialGap} potential gaps
              </Link>
            </dd>
          </div>
          <div className={styles.panel}>
            <dt>Open risks</dt>
            <dd className={styles.roles}>
              {figures.bands.map((band) => (
                <BandChip
                  key={band.name}
                  band={band}
                  score={figures.openRisksByBand[band.name] ?? 0}
                />
              ))}
            </dd>
          </div>
          <div className={styles.panel}>
            <dt>Remediation</dt>
            <dd>
              <Link href={`${base}/actions`}>
                {figures.actions.open} open, {figures.actions.underReview} under review,{' '}
                {figures.actions.closed} closed
              </Link>
              {figures.actions.overdue ? (
                <span className={styles.overdueText}> · {figures.actions.overdue} overdue</span>
              ) : null}
            </dd>
          </div>
          <div className={styles.panel}>
            <dt>Evidence awaiting review</dt>
            <dd>
              <Link href={`${base}/evidence?status=pending_review`}>
                {figures.evidenceAwaitingReview}
              </Link>
            </dd>
          </div>
        </dl>
        {latest && latest.domains.length ? (
          <DataTable
            caption="Compliance by domain in the latest assessment"
            rows={latest.domains}
            rowKey={(row) => row.code}
            columns={[
              {
                key: 'domain',
                header: 'Domain',
                render: (row) => (
                  <Link href={`${base}/assessments/${latest.code}?domain=${row.code}`}>
                    {row.code} {row.title}
                  </Link>
                ),
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
                width: '32%',
                render: (row) => <ProgressBar progress={row.progress} label={row.title} />,
              },
            ]}
          />
        ) : null}
      </section>

      <section className={styles.section} aria-labelledby="profile-title">
        <div className={styles.headerTop}>
          <h2 id="profile-title" className={styles.sectionTitle}>
            Profile
          </h2>
          {can(principal, 'client.edit', { clientId: client.id }) ? (
            <Link href={`/clients/${client.code}/edit`} className={buttonClass('secondary')}>
              Edit profile
            </Link>
          ) : null}
        </div>
        <dl className={`${styles.profile} ${styles.panel}`}>
          <Item label="Client ID">{client.code}</Item>
          <Item label="Legal name">{client.legalName}</Item>
          <Item label="Organisation type">{ORGANISATION_TYPE_LABEL[client.organisationType]}</Item>
          <Item label="Industry">{client.industry}</Item>
          <Item label="Sector overlay">
            {client.sectorCode ? (
              <Link href={kbHref('sectors', client.sectorCode)}>{client.sectorCode}</Link>
            ) : null}
          </Item>
          <Item label="Website">
            {client.website ? (
              <a href={client.website} rel="noreferrer noopener" target="_blank">
                {client.website.replace(/^https?:\/\//, '')}
              </a>
            ) : null}
          </Item>
          <Item label="Employees">{count(client.employeeCount)}</Item>
          <Item label="Data principals (approximate)">{count(client.dataPrincipalCount)}</Item>
          <Item label="Location">{[client.state, client.country].filter(Boolean).join(', ')}</Item>
          <Item label="Primary contact">
            {contact(
              client.primaryContactName,
              client.primaryContactEmail,
              client.primaryContactPhone,
            )}
          </Item>
          <Item label="DPO or privacy contact">
            {contact(client.dpoName, client.dpoEmail, client.dpoPhone)}
          </Item>
          <Item label="Assessment period">
            {client.assessmentPeriodStart
              ? `${formatDay(client.assessmentPeriodStart)}${client.assessmentPeriodEnd ? ` to ${formatDay(client.assessmentPeriodEnd)}` : ''}`
              : null}
          </Item>
          <Item label="Registered address" wide>
            {client.address}
          </Item>
          <Item label="Applicability note" wide>
            {client.applicabilityNote}
          </Item>
        </dl>
      </section>
    </>
  )
}
