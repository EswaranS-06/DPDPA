import { can } from '@duatf/core-access'
import { formatDay, formatIst, isoDate } from '@duatf/core-utils'
import { MarginRow } from '@duatf/core-ui'
import {
  ACTION_STATUS_LABEL,
  FINAL_ACTION_STATUSES,
  getAction,
  listEvidence,
  nextSteps,
  NotFoundError,
} from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionStatusChip, actionPlanOptions } from '@/components/actions/ActionBits'
import { EvidenceStatusChip } from '@/components/evidence/EvidenceTable'
import { ActionPlanForm, ActionSteps } from '@/components/forms/ActionForms'
import { LinkEvidenceForm, UploadEvidenceForm } from '@/components/forms/EvidenceForms'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'
import {
  linkEvidenceToAction,
  moveAction,
  updatePlanAction,
  uploadActionEvidence,
} from '../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; rem: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).rem),
})

export default async function Page({ params }: Props) {
  const { code, rem } = await params
  const client = await loadClient(code)
  const ctx = await serviceContext()
  const item = await getAction(ctx, client.id, decodeURIComponent(rem)).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound()
    throw error
  })
  const scope = { clientId: client.id, departmentId: item.departmentId }
  const target = {
    clientId: client.id,
    clientCode: client.code,
    actionId: item.id,
    departmentId: item.departmentId,
  }
  const finished = FINAL_ACTION_STATUSES.includes(item.status)
  const canManage = can(ctx.principal, 'action.manage', { clientId: client.id }) && !finished
  const canUpdate = can(ctx.principal, 'action.update', scope) && !finished
  const steps = nextSteps(ctx, client.id, item)
  const options = canManage ? await actionPlanOptions(ctx, client.id) : null
  const repository = canUpdate ? await listEvidence(ctx, client.id) : []
  const today = isoDate(new Date())

  return (
    <article className={styles.section} aria-labelledby="action-title">
      <nav aria-label="Breadcrumb" className={styles.muted}>
        <Link href={`/clients/${client.code}/actions`}>Remediation</Link> / {item.code}
      </nav>
      <header className={styles.header}>
        <span className={styles.code}>
          {item.code} · finding{' '}
          <Link href={`/clients/${client.code}/findings/${item.findingCode}`}>
            {item.findingCode}
          </Link>{' '}
          {item.findingTitle}
        </span>
        <h2 id="action-title" className={styles.sectionTitle}>
          {item.title}
        </h2>
        <div className={styles.chips}>
          <ActionStatusChip status={item.status} />
          {item.dueDate ? (
            <span className={item.dueDate < today && !finished ? styles.overdueText : styles.muted}>
              Due {formatDay(item.dueDate)}
            </span>
          ) : null}
        </div>
      </header>

      <div className={styles.twoColumn}>
        <div className={styles.section}>
          <MarginRow margin="Owner">
            <p className={styles.flush}>
              {item.ownerName ?? 'Not assigned yet'}
              {item.departmentName ? ` · ${item.departmentName}` : ''}
            </p>
          </MarginRow>
          {item.description ? (
            <MarginRow margin="What to do">
              <p className={styles.flush}>{item.description}</p>
            </MarginRow>
          ) : null}
          <MarginRow margin="Recommendation">
            <p className={styles.flush}>{item.recommendation}</p>
          </MarginRow>

          {steps.length && !finished ? (
            <section className={`${styles.section} ${styles.panel}`} aria-labelledby="next-steps">
              <h3 id="next-steps" className={styles.subTitle}>
                Next step
              </h3>
              <ActionSteps action={moveAction.bind(null, target)} steps={steps} />
            </section>
          ) : null}

          <section className={styles.section} aria-labelledby="action-evidence">
            <h3 id="action-evidence" className={styles.subTitle}>
              Evidence of the fix
            </h3>
            {item.evidence.length === 0 ? (
              <p className={styles.muted}>
                None yet. Evidence is needed before review, and must be accepted before closing.
              </p>
            ) : (
              <ul className={styles.bullets}>
                {item.evidence.map((row) => (
                  <li key={row.id}>
                    <Link href={`/clients/${client.code}/evidence/${row.code}`}>{row.title}</Link> (
                    {row.fileName}) <EvidenceStatusChip status={row.status} expired={false} />
                  </li>
                ))}
              </ul>
            )}
            {canUpdate ? (
              <div className={`${styles.section} ${styles.panel}`}>
                <UploadEvidenceForm action={uploadActionEvidence.bind(null, target)} />
                <LinkEvidenceForm
                  action={linkEvidenceToAction.bind(null, target)}
                  itemId=""
                  options={repository
                    .filter((row) => !item.evidence.some((linked) => linked.id === row.id))
                    .map((row) => ({ value: row.id, label: `${row.code} ${row.title}` }))}
                />
              </div>
            ) : null}
          </section>
        </div>

        <aside className={styles.section} aria-labelledby="action-history">
          <h3 id="action-history" className={styles.subTitle}>
            History
          </h3>
          <ol className={styles.bullets}>
            {item.events.map((event) => (
              <li key={event.id}>
                {ACTION_STATUS_LABEL[event.toStatus as keyof typeof ACTION_STATUS_LABEL] ??
                  event.toStatus}
                , {formatIst(event.at)}
                {event.actorName ? ` by ${event.actorName}` : ''}
                {event.note ? <span className={styles.muted}> — {event.note}</span> : null}
              </li>
            ))}
          </ol>
          {canManage && options ? (
            <div className={styles.panel}>
              <h3 className={styles.subTitle}>Plan</h3>
              <ActionPlanForm
                action={updatePlanAction.bind(null, target)}
                owners={options.owners}
                departments={options.departments}
                submitLabel="Save plan"
                initial={{
                  title: item.title,
                  description: item.description ?? '',
                  ownerUserId: item.ownerUserId ?? '',
                  departmentId: item.departmentId ?? '',
                  dueDate: item.dueDate ?? '',
                }}
              />
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  )
}
