import { can } from '@duatf/core-access'
import { formatDay, formatIst, isoDate } from '@duatf/core-utils'
import {
  Callout,
  Chip,
  DescriptionList,
  Disclosure,
  EmptyState,
  PageHeader,
  Panel,
  Timeline,
} from '@duatf/core-ui'
import {
  ACTION_STATUS_LABEL,
  FINAL_ACTION_STATUSES,
  getAction,
  listEvidence,
  nextSteps,
  NotFoundError,
} from '@duatf/feature-compliance-api'
import { ACTION_STATUSES } from '@duatf/platform-db'
import { ClockAlert, FileCheck, FilePlus, Pencil } from 'lucide-react'
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
import local from './action.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; rem: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).rem),
})

const statusLabel = (value: string) => {
  const status = ACTION_STATUSES.find((item) => item === value)
  return status ? ACTION_STATUS_LABEL[status] : value
}

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
  const overdue =
    item.dueDate !== null &&
    item.dueDate < isoDate(new Date()) &&
    !finished &&
    item.status !== 'remediated'

  return (
    <>
      <PageHeader
        kicker={
          <span className={local.kicker}>
            <span className="code">{item.code}</span>
            <span>
              For finding{' '}
              <Link href={`/clients/${client.code}/findings/${item.findingCode}`} className="code">
                {item.findingCode}
              </Link>{' '}
              {item.findingTitle}
            </span>
          </span>
        }
        title={item.title}
      >
        <ActionStatusChip status={item.status} />
        {item.dueDate ? <span>Due {formatDay(item.dueDate)}</span> : <span>No due date</span>}
        {overdue ? (
          <Chip tone="danger" icon={ClockAlert}>
            Overdue
          </Chip>
        ) : null}
      </PageHeader>

      <div className={styles.twoColumn}>
        <div className={local.work}>
          {steps.length && !finished ? (
            <Panel title="Next step" titleId="next-steps">
              <ActionSteps action={moveAction.bind(null, target)} steps={steps} />
            </Panel>
          ) : finished ? (
            <Callout
              tone="success"
              title={`This action is ${statusLabel(item.status).toLowerCase()}`}
            >
              <p>Nothing more to do. Its history stays on the right.</p>
            </Callout>
          ) : (
            <Callout tone="locked" title="No next step yet">
              <p>
                {item.status === 'under_review' || item.status === 'remediated'
                  ? 'Verify and close the action once the evidence of the fix is accepted.'
                  : 'Move the action on when the client reports progress.'}
              </p>
            </Callout>
          )}

          <Panel title="What to do" titleId="what-title">
            <DescriptionList
              columns={2}
              items={[
                { label: 'Owner', value: item.ownerName ?? 'Not assigned yet' },
                { label: 'Department', value: item.departmentName },
                ...(item.description
                  ? [{ label: 'Plan', value: item.description, wide: true }]
                  : []),
                { label: 'Recommended action', value: item.recommendation, wide: true },
              ]}
            />
          </Panel>

          <Panel title={`Evidence of the fix (${item.evidence.length})`} titleId="action-evidence">
            {item.evidence.length === 0 ? (
              <EmptyState icon={FileCheck} title="No evidence yet" size="quiet">
                Evidence is needed before review, and one file must be accepted before the action
                can be verified and closed.
              </EmptyState>
            ) : (
              <ul className={local.files}>
                {item.evidence.map((row) => (
                  <li key={row.id}>
                    <span className={styles.personCell}>
                      <Link
                        href={`/clients/${client.code}/evidence/${row.code}`}
                        className={styles.clientName}
                      >
                        {row.title}
                      </Link>
                      <span className={styles.muted}>{row.fileName}</span>
                    </span>
                    <EvidenceStatusChip status={row.status} expired={false} />
                  </li>
                ))}
              </ul>
            )}
            {canUpdate ? (
              <Disclosure
                summary="Add evidence"
                icon={FilePlus}
                defaultOpen={item.evidence.length === 0}
              >
                <UploadEvidenceForm action={uploadActionEvidence.bind(null, target)} />
                <LinkEvidenceForm
                  action={linkEvidenceToAction.bind(null, target)}
                  itemId=""
                  options={repository
                    .filter((row) => !item.evidence.some((linked) => linked.id === row.id))
                    .map((row) => ({ value: row.id, label: `${row.code} ${row.title}` }))}
                />
              </Disclosure>
            ) : null}
          </Panel>
        </div>

        <div className={local.work}>
          <Panel title="History" titleId="action-history">
            <Timeline
              label="Action history"
              entries={item.events.map((event) => ({
                key: event.id,
                when: formatIst(event.at),
                what: (
                  <>
                    {statusLabel(event.toStatus)}
                    {event.actorName ? ` by ${event.actorName}` : ''}
                    {event.note ? <span className={styles.muted}>. {event.note}</span> : null}
                  </>
                ),
              }))}
            />
          </Panel>
          {canManage && options ? (
            <Disclosure summary="Change the plan" icon={Pencil}>
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
            </Disclosure>
          ) : null}
        </div>
      </div>
    </>
  )
}
