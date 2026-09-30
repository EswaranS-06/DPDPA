import { can } from '@duatf/core-access'
import { formatIst } from '@duatf/core-utils'
import { Citation, MarginRow } from '@duatf/core-ui'
import {
  ANSWER_LABEL,
  getFinding,
  listBands,
  NotFoundError,
  ratingFor,
  listActions,
} from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionTable, actionPlanOptions } from '@/components/actions/ActionBits'
import { ActionPlanForm } from '@/components/forms/ActionForms'
import { AcceptRiskForm, RiskRatingForm } from '@/components/forms/RiskForms'
import { BandChip, FindingStatusChip, GapChip, RiskStatusChip } from '@/components/risk/RiskBits'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'
import { createActionAction } from '../../actions/actions'
import { acceptRiskAction, updateRiskAction } from '../../risks/actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; fnd: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).fnd),
})

const EVENT_TEXT: Record<string, string> = {
  opened: 'Opened',
  reopened: 'Reopened',
  closed: 'Closed',
  escalated: 'Escalated to a gap',
  downgraded: 'Downgraded to a potential gap',
}

export default async function Page({ params }: Props) {
  const { code, fnd } = await params
  const client = await loadClient(code)
  const ctx = await serviceContext()
  const item = await getFinding(ctx, client.id, decodeURIComponent(fnd)).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound()
    throw error
  })
  const bands = await listBands(ctx.db)
  const actions = await listActions(ctx, client.id, { findingId: item.id })
  const canPlan = can(ctx.principal, 'action.manage', { clientId: client.id })
  const planOptions = canPlan ? await actionPlanOptions(ctx, client.id) : null
  const scope = { clientId: client.id }
  const questionHref = `/clients/${client.code}/assessments/${item.assessmentCode}/items/${item.questionCode}`
  const target = item.risk
    ? { clientId: client.id, clientCode: client.code, riskId: item.risk.id }
    : null

  return (
    <article className={styles.section} aria-labelledby="finding-title">
      <nav aria-label="Breadcrumb" className={styles.muted}>
        <Link href={`/clients/${client.code}/findings`}>Findings</Link> / {item.code}
      </nav>
      <header className={styles.header}>
        <span className={styles.code}>
          {item.code} · <Link href={questionHref}>{item.questionCode}</Link> ·{' '}
          {item.assessmentTitle}
        </span>
        <h2 id="finding-title" className={styles.sectionTitle}>
          {item.title}
        </h2>
        <div className={styles.chips}>
          <GapChip gapType={item.gapType} />
          <FindingStatusChip status={item.status} />
          {item.risk ? (
            <BandChip band={ratingFor(item.risk.score, bands)} score={item.risk.score} />
          ) : null}
        </div>
      </header>

      <div className={styles.twoColumn}>
        <div className={styles.section}>
          <MarginRow margin="Answer">
            <p className={styles.flush}>
              {item.answer ? ANSWER_LABEL[item.answer] : '—'}
              {item.comment ? ` — ${item.comment}` : ''}
            </p>
          </MarginRow>
          <MarginRow margin="Recommendation">
            <p className={styles.flush}>{item.recommendation}</p>
          </MarginRow>
          <MarginRow margin="Law">
            <span className={styles.roles}>
              {item.references.map((reference) => (
                <Citation key={reference}>{reference}</Citation>
              ))}
            </span>
          </MarginRow>
          <section className={styles.section} aria-labelledby="history-title">
            <h3 id="history-title" className={styles.subTitle}>
              History
            </h3>
            <ol className={styles.bullets}>
              {item.events.map((event) => (
                <li key={event.id}>
                  {EVENT_TEXT[event.kind] ?? event.kind}, {formatIst(event.at)}
                  {typeof event.detail.answer === 'string'
                    ? ` (answer ${ANSWER_LABEL[event.detail.answer as keyof typeof ANSWER_LABEL] ?? event.detail.answer})`
                    : ''}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {item.risk && target ? (
          <aside className={`${styles.section} ${styles.panel}`} aria-labelledby="risk-title">
            <h3 id="risk-title" className={styles.subTitle}>
              Risk {item.risk.code}
            </h3>
            <div className={styles.chips}>
              <BandChip band={ratingFor(item.risk.score, bands)} />
              <RiskStatusChip status={item.risk.status} />
            </div>
            <p className={styles.flush}>
              Likelihood {item.risk.likelihood} × impact {item.risk.impact} = score{' '}
              {item.risk.score}.{item.risk.ownerName ? ` Owner: ${item.risk.ownerName}.` : ''}
            </p>
            {item.risk.description ? <p className={styles.flush}>{item.risk.description}</p> : null}
            {item.risk.status === 'accepted' ? (
              <p className={styles.quote}>
                Accepted by the client on{' '}
                {item.risk.acceptedAt ? formatIst(item.risk.acceptedAt) : '—'}:{' '}
                {item.risk.acceptanceNote}
              </p>
            ) : null}
            {can(ctx.principal, 'risk.manage', scope) && item.risk.status !== 'accepted' ? (
              <RiskRatingForm action={updateRiskAction.bind(null, target)} current={item.risk} />
            ) : null}
            {can(ctx.principal, 'risk.accept', scope) &&
            item.risk.status !== 'accepted' &&
            item.risk.status !== 'closed' ? (
              <AcceptRiskForm action={acceptRiskAction.bind(null, target)} />
            ) : null}
          </aside>
        ) : null}
      </div>

      <section className={styles.section} aria-labelledby="remediation-title">
        <h3 id="remediation-title" className={styles.subTitle}>
          Remediation actions
        </h3>
        {actions.length === 0 ? (
          <p className={styles.muted}>No action planned yet.</p>
        ) : (
          <ActionTable rows={actions} clientCode={client.code} />
        )}
        {canPlan && planOptions ? (
          <div className={styles.panel}>
            <ActionPlanForm
              action={createActionAction.bind(null, {
                clientId: client.id,
                clientCode: client.code,
                findingId: item.id,
              })}
              owners={planOptions.owners}
              departments={planOptions.departments}
              submitLabel="Plan action"
              initial={{ title: item.title, description: item.recommendation }}
            />
          </div>
        ) : null}
      </section>
    </article>
  )
}
