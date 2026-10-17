import { formatDay, isoDate } from '@duatf/core-utils'
import { Callout, Chip, DescriptionList, Disclosure, PageHeader, Panel } from '@duatf/core-ui'
import {
  getRightsRequest,
  listDepartments,
  NotFoundError,
  RIGHTS_KIND_INFO,
  REQUESTER_ROLE_LABEL,
  RIGHTS_STATUS_LABEL,
} from '@duatf/feature-compliance-api'
import { RIGHTS_KINDS } from '@duatf/platform-db'
import { Globe, Pencil, UserCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RightsMoveForm, RightsRequestForm } from '@/components/forms/RegisterForms'
import { DueChip, RightsStatusChip } from '@/components/registers/RegisterBits'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'
import { moveRequestAction, updateRequestAction } from '../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; dpr: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).dpr),
})

const MOVE_LABEL: Record<string, string> = {
  in_progress: 'Work started',
  fulfilled: 'Fulfilled',
  refused: 'Refused',
  withdrawn: 'Withdrawn by the requester',
}

export default async function Page({ params }: Props) {
  const { code, dpr } = await params
  const client = await loadClient(code)
  const ctx = await serviceContext()
  const item = await getRightsRequest(ctx, client.id, decodeURIComponent(dpr)).catch(
    (error: unknown) => {
      if (error instanceof NotFoundError) notFound()
      throw error
    },
  )
  const departments = item.canEdit ? await listDepartments(ctx, client.id) : []
  const target = { clientId: client.id, clientCode: client.code, requestId: item.id }
  const kind = RIGHTS_KIND_INFO[item.kind]

  return (
    <>
      <PageHeader
        kicker={
          <span>
            <span className="code">{item.code}</span>, reference {item.requesterRef}
          </span>
        }
        title={kind.label}
        lede={`DPDP Act ${kind.basis}. Received ${formatDay(item.receivedOn)}${item.channel ? ` by ${item.channel.toLowerCase()}` : ''}.`}
      >
        <RightsStatusChip status={item.status} />
        <DueChip dueOn={item.dueOn} daysLeft={item.daysLeft} overdue={item.overdue} />
        {item.identityVerified ? (
          <Chip tone="success" icon={UserCheck}>
            Requester identified
          </Chip>
        ) : null}
        {item.source === 'public' ? (
          <Chip tone="info" icon={Globe}>
            From the public page
          </Chip>
        ) : null}
      </PageHeader>

      {!item.open ? (
        <Callout
          tone={item.status === 'refused' ? 'danger' : 'success'}
          title={`${RIGHTS_STATUS_LABEL[item.status]}${item.closedOn ? ` on ${formatDay(item.closedOn)}` : ''}${item.daysTaken === null ? '' : `, ${item.daysTaken} days after it was received`}`}
        >
          {item.outcome ? <p>{item.outcome}</p> : null}
        </Callout>
      ) : null}

      <div className={styles.twoColumn}>
        <Panel title="The request" titleId="request-title">
          <DescriptionList
            columns={2}
            items={[
              { label: 'What is asked', value: item.details, wide: true },
              { label: 'Kind of Data Principal', value: item.principalType },
              {
                label: 'Made by',
                value: item.requesterRole ? REQUESTER_ROLE_LABEL[item.requesterRole] : null,
              },
              {
                label: 'Identity checked',
                value:
                  [item.verificationMethod, item.verifiedOn ? formatDay(item.verifiedOn) : null]
                    .filter(Boolean)
                    .join(', ') || null,
              },
              {
                label: 'Acknowledged',
                value: item.acknowledgedOn ? formatDay(item.acknowledgedOn) : null,
              },
              { label: 'Letter sent', value: item.letterRef },
              { label: 'Due', value: formatDay(item.dueOn) },
              { label: 'Department', value: item.departmentName },
              { label: 'Handled by', value: item.handler },
              ...(item.contact
                ? [{ label: 'Contact given', value: item.contact, wide: true }]
                : []),
            ]}
          />
        </Panel>
        {item.canEdit && item.open ? (
          <Panel title="Move it on" titleId="move-title">
            <RightsMoveForm
              action={moveRequestAction.bind(null, target)}
              moves={item.moves.map((move) => ({ value: move, label: MOVE_LABEL[move] ?? move }))}
              today={isoDate(new Date())}
            />
          </Panel>
        ) : (
          <div />
        )}
      </div>

      {item.canEdit && item.open ? (
        <Disclosure summary="Edit the request" icon={Pencil}>
          <RightsRequestForm
            action={updateRequestAction.bind(null, target)}
            initial={{
              kind: item.kind,
              receivedOn: item.receivedOn,
              dueOn: item.dueOn,
              channel: item.channel ?? '',
              requesterRef: item.requesterRef,
              principalType: item.principalType ?? '',
              details: item.details ?? '',
              identityVerified: String(item.identityVerified),
              requesterRole: item.requesterRole ?? '',
              verificationMethod: item.verificationMethod ?? '',
              verifiedOn: item.verifiedOn ?? '',
              acknowledgedOn: item.acknowledgedOn ?? '',
              letterRef: item.letterRef ?? '',
              departmentId: item.departmentId ?? '',
              handler: item.handler ?? '',
            }}
            kinds={RIGHTS_KINDS.map((value) => ({
              value,
              label: `${RIGHTS_KIND_INFO[value].label} (${RIGHTS_KIND_INFO[value].basis})`,
            }))}
            departments={departments
              .filter((row) => row.active)
              .map((row) => ({ value: row.id, label: row.name }))}
            responseDays={item.responseDays}
            submitLabel="Save the request"
          />
        </Disclosure>
      ) : null}
      <Panel title="Documents from this record" titleId="record-documents">
        <ul className={styles.documentLinks}>
          <li>
            <Link href={`/clients/${client.code}/documents/R04?record=${item.code}`}>
              <span className="code">R04</span> Response letters to the requester
            </Link>
          </li>
        </ul>
      </Panel>
    </>
  )
}
