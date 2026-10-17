import { formatDay } from '@duatf/core-utils'
import {
  Callout,
  Chip,
  DescriptionList,
  Disclosure,
  EmptyState,
  PageHeader,
  Panel,
} from '@duatf/core-ui'
import {
  CONTRACT_TERMS,
  getProcessor,
  listEvidence,
  NotFoundError,
} from '@duatf/feature-compliance-api'
import { CalendarClock, Check, MapPin, Minus, Pencil, Trash2, Workflow } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LevelChip } from '@/components/data/LevelChip'
import { ActionButton, ProcessorForm } from '@/components/forms/RegisterForms'
import { ContractChip } from '@/components/registers/RegisterBits'
import bits from '@/components/registers/RegisterBits.module.css'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'
import { removeProcessorAction, updateProcessorAction } from '../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; prc: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).prc),
})

const LOCATION = { india: 'In India', outside: 'Outside India', unknown: 'Not known yet' }
const KIND = { processor: 'Data Processor', sub_processor: 'Processor’s own processor' }
const RATING = { low: 'Low risk', medium: 'Medium risk', high: 'High risk' }

export default async function Page({ params }: Props) {
  const { code, prc } = await params
  const client = await loadClient(code)
  const ctx = await serviceContext()
  const item = await getProcessor(ctx, client.id, decodeURIComponent(prc)).catch(
    (error: unknown) => {
      if (error instanceof NotFoundError) notFound()
      throw error
    },
  )
  const evidence = item.canEdit ? await listEvidence(ctx, client.id) : []
  const target = { clientId: client.id, clientCode: client.code, processorId: item.id }
  const contracted = item.contract === 'yes'

  return (
    <>
      <PageHeader
        kicker={<span className="code">{item.code}</span>}
        title={item.name}
        lede={item.service ?? undefined}
      >
        <ContractChip state={item.state} />
        <Chip tone={item.location === 'outside' ? 'warning' : 'neutral'} icon={MapPin}>
          {LOCATION[item.location]}
        </Chip>
        {item.rating ? (
          <Chip tone={item.rating === 'high' ? 'danger' : 'neutral'}>{RATING[item.rating]}</Chip>
        ) : null}
        {item.reviewDue ? (
          <Chip tone="warning" icon={CalendarClock}>
            Review due
          </Chip>
        ) : null}
        {item.active ? null : <Chip tone="neutral">No longer used</Chip>}
      </PageHeader>

      {item.state === 'none' || item.state === 'ended' ? (
        <Callout
          tone="danger"
          title={item.state === 'none' ? 'No contract' : 'The contract has ended'}
        >
          <p>
            A Data Processor may be engaged only under a valid contract (s.8(2)).
            {item.activities.length
              ? ` ${item.activities.length} RoPA ${item.activities.length === 1 ? 'activity names' : 'activities name'} this processor.`
              : ''}
          </p>
        </Callout>
      ) : null}

      <div className={styles.twoColumn}>
        <div className={styles.section}>
          <Panel title="Contract" titleId="contract-title">
            <DescriptionList
              columns={2}
              items={[
                { label: 'Kind', value: KIND[item.kind] },
                { label: 'Countries or regions', value: item.countries },
                {
                  label: 'Contract starts',
                  value: item.contractStart ? formatDay(item.contractStart) : null,
                },
                {
                  label: 'Contract ends',
                  value: item.contractEnd
                    ? formatDay(item.contractEnd)
                    : contracted
                      ? 'No end date'
                      : null,
                },
                {
                  label: 'The contract, in evidence',
                  value: item.contractEvidenceCode ? (
                    <Link
                      href={`/clients/${client.code}/evidence/${item.contractEvidenceCode}`}
                      className="code"
                    >
                      {item.contractEvidenceCode}
                    </Link>
                  ) : null,
                },
                {
                  label: 'Contact',
                  value: [item.contactName, item.contactEmail].filter(Boolean).join(', ') || null,
                },
                {
                  label: 'Last assessed',
                  value: item.lastAssessedOn ? formatDay(item.lastAssessedOn) : null,
                },
                {
                  label: 'Next review',
                  value: item.nextReviewOn ? formatDay(item.nextReviewOn) : null,
                },
                ...(item.aliases.length
                  ? [{ label: 'Other spellings', value: item.aliases.join(', '), wide: true }]
                  : []),
                ...(item.notes ? [{ label: 'Notes', value: item.notes, wide: true }] : []),
              ]}
            />
          </Panel>
          {contracted ? (
            <Panel title="What the contract covers" titleId="terms-title">
              <ul className={bits.terms}>
                {CONTRACT_TERMS.map((term) => {
                  const covered = item.terms.includes(term.code)
                  return (
                    <li key={term.code} className={covered ? bits.covered : bits.uncovered}>
                      {covered ? (
                        <Check size={16} aria-hidden="true" />
                      ) : (
                        <Minus size={16} aria-hidden="true" />
                      )}
                      <span>
                        {term.label} <span className={bits.muted}>({term.basis})</span>
                        <span className="visually-hidden">
                          {covered ? ', covered' : ', not covered'}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </Panel>
          ) : null}
        </div>

        <Panel title="What the RoPA says it receives" titleId="ropa-title">
          {item.activities.length === 0 ? (
            <EmptyState icon={Workflow} title="No activity names this processor" size="quiet">
              Name it as a processor on the activities it takes part in, or add the spelling the
              RoPA uses under “Other spellings”.
            </EmptyState>
          ) : (
            <div className={bits.stack}>
              <ul className={styles.bullets}>
                {item.activities.map((activity) => (
                  <li key={activity.ref}>
                    <Link
                      href={`/clients/${client.code}/data-mapping/activities/${activity.refLabel}`}
                    >
                      <span className="code">{activity.refLabel}</span> {activity.name}
                    </Link>{' '}
                    <span className={styles.muted}>{activity.departmentName}</span>
                  </li>
                ))}
              </ul>
              <div className={bits.tags}>
                {item.elements.map((element) => (
                  <span key={element.title} className={styles.roles}>
                    <LevelChip level={element.level} />
                    <span>{element.title}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {item.canEdit ? (
        <>
          <Disclosure summary="Edit this processor" icon={Pencil}>
            <ProcessorForm
              action={updateProcessorAction.bind(null, target)}
              initial={{
                name: item.name,
                aliases: item.aliases.join('\n'),
                kind: item.kind,
                service: item.service ?? '',
                location: item.location,
                countries: item.countries ?? '',
                contactName: item.contactName ?? '',
                contactEmail: item.contactEmail ?? '',
                contract: item.contract,
                contractStart: item.contractStart ?? '',
                contractEnd: item.contractEnd ?? '',
                contractEvidenceId: item.contractEvidenceId ?? '',
                rating: item.rating ?? '',
                lastAssessedOn: item.lastAssessedOn ?? '',
                nextReviewOn: item.nextReviewOn ?? '',
                notes: item.notes ?? '',
                active: String(item.active),
              }}
              initialTerms={item.terms}
              terms={CONTRACT_TERMS.map((term) => ({
                value: term.code,
                label: `${term.label} (${term.basis})`,
              }))}
              evidence={evidence.map((row) => ({
                value: row.id,
                label: `${row.code} ${row.title}`,
              }))}
              submitLabel="Save processor"
            />
          </Disclosure>
          <Disclosure summary="Remove from the register" icon={Trash2}>
            <p className={`${styles.flush} ${styles.muted}`}>
              For an entry added by mistake. A processor the organisation has stopped using is
              better marked “No longer used”, so its history stays.
            </p>
            <ActionButton
              action={removeProcessorAction.bind(null, target)}
              variant="danger"
              pendingText="Removing…"
            >
              Remove {item.name}
            </ActionButton>
          </Disclosure>
        </>
      ) : null}
      <Panel title="Documents from this record" titleId="record-documents">
        <ul className={styles.documentLinks}>
          <li>
            <Link href={`/clients/${client.code}/documents/V01?record=${item.code}`}>
              <span className="code">V01</span> Data processing agreement
            </Link>
          </li>
          <li>
            <Link href={`/clients/${client.code}/documents/V03?record=${item.code}`}>
              <span className="code">V03</span> Vendor due-diligence questionnaire
            </Link>
          </li>
        </ul>
      </Panel>
    </>
  )
}
