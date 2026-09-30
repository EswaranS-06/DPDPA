import { can } from '@duatf/core-access'
import { formatDay } from '@duatf/core-utils'
import { buttonClass } from '@duatf/core-ui'
import { ORGANISATION_TYPE_LABEL } from '@duatf/feature-compliance-api'
import { kbHref } from '@duatf/feature-framework-library-api'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { loadClient } from '@/server/clients'
import { requireSession } from '@/server/auth'
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
  const { principal } = await requireSession()
  return (
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
  )
}
