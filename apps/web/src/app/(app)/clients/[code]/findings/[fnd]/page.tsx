import { can } from '@duatf/core-access'
import { formatIst } from '@duatf/core-utils'
import {
  Callout,
  Citation,
  Disclosure,
  EmptyState,
  MarginRow,
  PageHeader,
  Panel,
  SectionHeader,
  Timeline,
} from '@duatf/core-ui'
import {
  ANSWER_LABEL,
  getFinding,
  listBands,
  NotFoundError,
  ratingFor,
  listActions,
} from '@duatf/feature-compliance-api'
import { ANSWERS } from '@duatf/platform-db'
import { ListPlus, Scale, Wrench } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionTable, actionPlanOptions } from '@/components/actions/ActionBits'
import { ActionPlanForm } from '@/components/forms/ActionForms'
import { AcceptRiskForm, RiskRatingForm } from '@/components/forms/RiskForms'
import { RemediationPath, remediationSteps } from '@/components/risk/RemediationPath'
import { BandChip, FindingStatusChip, GapChip, RiskStatusChip } from '@/components/risk/RiskBits'
import { Status } from '@/components/status'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'
import { createActionAction } from '../../actions/actions'
import { acceptRiskAction, updateRiskAction } from '../../risks/actions'
import local from './finding.module.css'

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

const answerOf = (value: unknown) => ANSWERS.find((answer) => answer === value)

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
  const answer = item.answer

  return (
    <>
      <PageHeader
        kicker={
          <span className={local.kicker}>
            <span className="code">{item.code}</span>
            <span>
              From question{' '}
              <Link href={questionHref} className="code">
                {item.questionCode}
              </Link>{' '}
              in {item.assessmentTitle}
            </span>
          </span>
        }
        title={item.title}
      >
        <GapChip gapType={item.gapType} />
        <FindingStatusChip status={item.status} />
        {item.risk ? (
          <BandChip band={ratingFor(item.risk.score, bands)} score={item.risk.score} />
        ) : null}
      </PageHeader>

      <RemediationPath
        steps={remediationSteps({
          status: item.status,
          rated: Boolean(item.risk),
          actions: actions.map((row) => row.status),
        })}
      />

      {item.status === 'closed' && item.closedReason ? (
        <Callout tone="success" title="Closed">
          <p>{item.closedReason}</p>
        </Callout>
      ) : null}

      <div className={styles.twoColumn}>
        <Panel title="What was found" titleId="found-title">
          <div>
            <MarginRow margin="Answer">
              <span className={styles.personCell}>
                {answer ? <Status kind="answer" value={answer} /> : <span>Not recorded</span>}
                {item.comment ? <span>{item.comment}</span> : null}
              </span>
            </MarginRow>
            <MarginRow margin="Recommended action">
              <p className={styles.flush}>{item.recommendation}</p>
            </MarginRow>
            <MarginRow margin="Law">
              <span className={styles.roles}>
                {item.references.length ? (
                  item.references.map((reference) => (
                    <Citation key={reference}>{reference}</Citation>
                  ))
                ) : (
                  <span className={styles.muted}>No citation recorded</span>
                )}
              </span>
            </MarginRow>
          </div>
          <Disclosure
            summary="History"
            hint={`${item.events.length} ${item.events.length === 1 ? 'event' : 'events'}`}
          >
            <Timeline
              label="Finding history"
              entries={item.events.map((event) => {
                const eventAnswer = answerOf(event.detail.answer)
                return {
                  key: event.id,
                  when: formatIst(event.at),
                  what: `${EVENT_TEXT[event.kind] ?? event.kind}${eventAnswer ? `, answer ${ANSWER_LABEL[eventAnswer]}` : ''}`,
                }
              })}
            />
          </Disclosure>
        </Panel>

        {item.risk && target ? (
          <Panel title={`Risk ${item.risk.code}`} titleId="risk-title">
            <div className={styles.roles}>
              <BandChip band={ratingFor(item.risk.score, bands)} score={item.risk.score} />
              <RiskStatusChip status={item.risk.status} />
            </div>
            <p className={styles.flush}>
              Likelihood {item.risk.likelihood} by impact {item.risk.impact} scores{' '}
              {item.risk.score}.{item.risk.ownerName ? ` Owner: ${item.risk.ownerName}.` : ''}
            </p>
            {item.risk.description ? <p className={styles.flush}>{item.risk.description}</p> : null}
            {item.risk.status === 'accepted' ? (
              <Callout tone="neutral" icon={Scale} title="Accepted by the client">
                <p>
                  {item.risk.acceptedAt ? `${formatIst(item.risk.acceptedAt)}. ` : ''}
                  {item.risk.acceptanceNote}
                </p>
              </Callout>
            ) : null}
            {can(ctx.principal, 'risk.manage', scope) && item.risk.status !== 'accepted' ? (
              <RiskRatingForm action={updateRiskAction.bind(null, target)} current={item.risk} />
            ) : null}
            {can(ctx.principal, 'risk.accept', scope) &&
            item.risk.status !== 'accepted' &&
            item.risk.status !== 'closed' ? (
              <Disclosure summary="Accept this risk instead of fixing it" icon={Scale}>
                <AcceptRiskForm action={acceptRiskAction.bind(null, target)} />
              </Disclosure>
            ) : null}
          </Panel>
        ) : (
          <div />
        )}
      </div>

      <section className={styles.section} aria-labelledby="remediation-title">
        <SectionHeader
          id="remediation-title"
          title="Remediation actions"
          count={actions.length}
          description="The owner works each action through to review; an auditor other than the owner verifies and closes it once evidence of the fix is accepted."
        />
        {actions.length === 0 ? (
          <EmptyState icon={Wrench} title="No action planned yet" size="quiet">
            {canPlan
              ? 'Plan the first action below. It starts from the recommended action; give it an owner and a due date.'
              : 'The audit team or the client DPO plans actions for this finding.'}
          </EmptyState>
        ) : (
          <ActionTable rows={actions} clientCode={client.code} />
        )}
        {canPlan && planOptions ? (
          <Disclosure summary="Plan an action" icon={ListPlus} defaultOpen={actions.length === 0}>
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
          </Disclosure>
        ) : null}
      </section>
    </>
  )
}
