import { formatDay } from '@duatf/core-utils'
import {
  Callout,
  Chip,
  DataTable,
  Disclosure,
  EmptyState,
  PageHeader,
  SectionHeader,
} from '@duatf/core-ui'
import { CONTRACT_TERMS, listEvidence, listProcessors } from '@duatf/feature-compliance-api'
import { CalendarClock, Handshake, ListPlus, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { LevelChip } from '@/components/data/LevelChip'
import { ActionButton, ProcessorForm } from '@/components/forms/RegisterForms'
import { ContractChip } from '@/components/registers/RegisterBits'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import styles from '../../clients.module.css'
import { addFromRopaAction, createProcessorAction } from './actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Processors' }

const LOCATION = { india: 'In India', outside: 'Outside India', unknown: 'Not known yet' }

type Props = { params: Promise<{ code: string }>; searchParams: SearchParams }

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const added = Number(firstValue((await searchParams).added) ?? '')
  const ctx = await serviceContext()
  const list = await listProcessors(ctx, client.id)
  const evidence = list.canEdit ? await listEvidence(ctx, client.id) : []
  const target = { clientId: client.id, clientCode: client.code }
  const base = `/clients/${client.code}/processors`
  const count = list.unregistered.length

  return (
    <>
      <PageHeader
        title="Processors"
        lede="The vendors that process personal data for the organisation. A Data Processor may be used only under a valid contract (s.8(2)), and the organisation stays answerable for what the processor does (s.8(1)). Each entry shows the RoPA activities that name it."
      />
      {added > 0 ? (
        <Callout tone="success" role="status" title={`Added ${added} from the RoPA`}>
          <p>Open each one and record its contract, where it processes the data and its terms.</p>
        </Callout>
      ) : null}
      {count ? (
        <Callout
          tone="warning"
          title={`The RoPA names ${count} ${count === 1 ? 'processor that is' : 'processors that are'} not in the register`}
        >
          <p>{list.unregistered.join(', ')}</p>
          {list.canEdit ? (
            <ActionButton action={addFromRopaAction.bind(null, target)} pendingText="Adding…">
              <ListPlus size={16} aria-hidden="true" /> Add {count === 1 ? 'it' : `all ${count}`} to
              the register
            </ActionButton>
          ) : null}
        </Callout>
      ) : null}
      <section className={styles.section} aria-labelledby="register-title">
        <SectionHeader id="register-title" title="Register" count={list.entries.length} />
        {list.entries.length === 0 ? (
          <EmptyState icon={Handshake} title="No processor listed yet">
            Add the vendors that handle personal data for the organisation: payroll and HR systems,
            cloud hosting, laboratories, marketing agencies, support desks.
          </EmptyState>
        ) : (
          <DataTable
            rows={list.entries}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'processor',
                header: 'Processor',
                render: (row) => (
                  <span className={styles.personCell}>
                    <Link href={`${base}/${row.code}`} className={styles.clientName}>
                      {row.name}
                    </Link>
                    <span className={styles.muted}>
                      <span className="code">{row.code}</span>
                      {row.service ? `, ${row.service}` : ''}
                      {row.active ? '' : ', no longer used'}
                    </span>
                  </span>
                ),
              },
              {
                key: 'contract',
                header: 'Contract',
                render: (row) => (
                  <span className={styles.personCell}>
                    <ContractChip state={row.state} />
                    {row.contractEnd ? (
                      <span className={styles.muted}>ends {formatDay(row.contractEnd)}</span>
                    ) : null}
                  </span>
                ),
              },
              {
                key: 'data',
                header: 'Personal data it receives',
                render: (row) =>
                  row.activities.length ? (
                    <span className={styles.personCell}>
                      {row.highestLevel ? <LevelChip level={row.highestLevel} /> : null}
                      <span className={styles.muted}>
                        {row.elements.length} data{' '}
                        {row.elements.length === 1 ? 'element' : 'elements'} in{' '}
                        {row.activities.length}{' '}
                        {row.activities.length === 1 ? 'activity' : 'activities'}
                      </span>
                    </span>
                  ) : (
                    <span className={styles.muted}>Not named in the RoPA</span>
                  ),
              },
              {
                key: 'location',
                header: 'Where',
                priority: 'low',
                render: (row) => (
                  <span className={styles.personCell}>
                    <Chip tone={row.location === 'outside' ? 'warning' : 'neutral'} icon={MapPin}>
                      {LOCATION[row.location]}
                    </Chip>
                    {row.countries ? <span className={styles.muted}>{row.countries}</span> : null}
                  </span>
                ),
              },
              {
                key: 'review',
                header: 'Assessed',
                priority: 'low',
                render: (row) => (
                  <span className={styles.personCell}>
                    <span>{row.lastAssessedOn ? formatDay(row.lastAssessedOn) : 'Not yet'}</span>
                    {row.reviewDue ? (
                      <Chip tone="warning" icon={CalendarClock}>
                        Review due
                      </Chip>
                    ) : row.nextReviewOn ? (
                      <span className={styles.muted}>next {formatDay(row.nextReviewOn)}</span>
                    ) : null}
                  </span>
                ),
              },
            ]}
          />
        )}
      </section>
      {list.canEdit ? (
        <Disclosure summary="Add a processor" icon={ListPlus} defaultOpen={!list.entries.length}>
          <ProcessorForm
            action={createProcessorAction.bind(null, target)}
            initial={{}}
            initialTerms={[]}
            terms={CONTRACT_TERMS.map((term) => ({
              value: term.code,
              label: `${term.label} (${term.basis})`,
            }))}
            evidence={evidence.map((row) => ({ value: row.id, label: `${row.code} ${row.title}` }))}
            submitLabel="Add processor"
          />
        </Disclosure>
      ) : null}
    </>
  )
}
