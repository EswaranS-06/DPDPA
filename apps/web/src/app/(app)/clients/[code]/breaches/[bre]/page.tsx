import { formatIst } from '@duatf/core-utils'
import {
  Callout,
  Chip,
  DescriptionList,
  Disclosure,
  PageHeader,
  Panel,
  Timeline,
} from '@duatf/core-ui'
import {
  BREACH_NATURES,
  BREACH_STEPS,
  breachFormOptions,
  getBreach,
  NotFoundError,
  toLocalInput,
  type BreachStep,
} from '@duatf/feature-compliance-api'
import { ClipboardPen, FileText, Pencil, RotateCcw, Wifi } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ActionButton,
  BreachForm,
  BreachStepForm,
  CloseBreachForm,
} from '@/components/forms/RegisterForms'
import { BreachStatusChip, ClockList, SeverityTag } from '@/components/registers/RegisterBits'
import bits from '@/components/registers/RegisterBits.module.css'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'
import {
  closeBreachAction,
  recordStepAction,
  reopenBreachAction,
  updateBreachAction,
} from '../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; bre: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).bre),
})

const EVENT_TEXT: Record<string, string> = {
  ...BREACH_STEPS,
  recorded: 'Recorded',
  updated: 'Record updated',
  closed: 'Closed',
  reopened: 'Reopened',
}

export default async function Page({ params }: Props) {
  const { code, bre } = await params
  const client = await loadClient(code)
  const ctx = await serviceContext()
  const item = await getBreach(ctx, client.id, decodeURIComponent(bre)).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound()
    throw error
  })
  const options = item.canEdit ? await breachFormOptions(ctx, client.id) : null
  const target = { clientId: client.id, clientCode: client.code, breachId: item.id }
  const open = item.status !== 'closed'
  const steps = (Object.keys(BREACH_STEPS) as BreachStep[])
    .filter((step) => step !== 'cert_in' || item.cyberIncident)
    .map((step) => ({ value: step, label: BREACH_STEPS[step] }))
  const natures = BREACH_NATURES.filter((nature) => item.natures.includes(nature.code))
  const overdue = item.clocks.filter((clock) => clock.state === 'overdue')

  return (
    <>
      <PageHeader
        kicker={
          <span>
            <span className="code">{item.code}</span>, aware {formatIst(item.awareAt)}
          </span>
        }
        title={item.title}
      >
        <BreachStatusChip status={item.status} />
        <SeverityTag severity={item.severity} />
        {item.cyberIncident ? (
          <Chip tone="info" icon={Wifi}>
            Cyber incident
          </Chip>
        ) : null}
      </PageHeader>

      {open && overdue.length ? (
        <Callout tone="danger" role="alert" title="An intimation is overdue">
          <p>{overdue.map((clock) => clock.label).join('; ')}.</p>
        </Callout>
      ) : null}
      {item.status === 'closed' ? (
        <Callout tone="neutral" title={`Closed ${item.closedAt ? formatIst(item.closedAt) : ''}`}>
          {item.closeReason ? <p>{item.closeReason}</p> : null}
        </Callout>
      ) : null}

      <div className={styles.twoColumn}>
        <div className={styles.section}>
          <Panel title="What happened" titleId="what-title">
            <p className={styles.flush}>{item.description}</p>
            <DescriptionList
              columns={2}
              items={[
                {
                  label: 'Occurred',
                  value: item.occurredAt ? formatIst(item.occurredAt) : null,
                },
                { label: 'Where', value: item.place },
                {
                  label: 'Nature (s.2(u))',
                  value: natures.length ? natures.map((nature) => nature.label).join(', ') : null,
                },
                {
                  label: 'Data Principals affected',
                  value:
                    item.affectedPrincipals === null
                      ? null
                      : `About ${item.affectedPrincipals.toLocaleString('en-IN')}`,
                },
                { label: 'Personal data affected', value: item.dataAffected, wide: true },
                { label: 'Department', value: item.departmentName },
                {
                  label: 'Processor',
                  value: item.processorCode ? (
                    <Link href={`/clients/${client.code}/processors/${item.processorCode}`}>
                      {item.processorName}
                    </Link>
                  ) : null,
                },
                ...(item.activities.length
                  ? [
                      {
                        label: 'RoPA activities affected',
                        wide: true,
                        value: (
                          <span className={bits.tags}>
                            {item.activities.map((activity) => (
                              <Link
                                key={activity.ref}
                                href={`/clients/${client.code}/data-mapping/activities/${activity.ref}`}
                              >
                                <span className="code">{activity.refLabel}</span> {activity.name}
                              </Link>
                            ))}
                          </span>
                        ),
                      },
                    ]
                  : []),
                {
                  label: 'Board reference',
                  value: item.boardReference,
                },
                {
                  label: 'How Data Principals were told',
                  value: item.principalsHow,
                },
              ]}
            />
          </Panel>
          <Panel title="Timeline" titleId="timeline-title">
            <Timeline
              label="Breach timeline"
              entries={item.events.map((event) => ({
                key: event.id,
                when: formatIst(event.happenedAt ?? event.at),
                what: (
                  <>
                    {EVENT_TEXT[event.kind] ?? event.kind}
                    {event.note ? `: ${event.note}` : ''}
                    <span className={bits.muted}>
                      {' '}
                      (recorded {formatIst(event.at)}
                      {event.actorName ? ` by ${event.actorName}` : ''})
                    </span>
                  </>
                ),
              }))}
            />
          </Panel>
        </div>

        <div className={styles.section}>
          <Panel title="Intimations" titleId="clocks-title">
            <ClockList clocks={item.clocks} />
          </Panel>
          {item.canEdit && open ? (
            <Panel title="Record a step" titleId="step-title">
              <BreachStepForm
                action={recordStepAction.bind(null, target)}
                steps={steps}
                now={toLocalInput(new Date())}
              />
            </Panel>
          ) : null}
          {item.canEdit && open ? (
            <Disclosure summary="Close this breach" icon={ClipboardPen}>
              <CloseBreachForm
                action={closeBreachAction.bind(null, target)}
                outstanding={item.outstanding}
              />
            </Disclosure>
          ) : null}
          {item.canEdit && !open ? (
            <Disclosure summary="Reopen this breach" icon={RotateCcw}>
              <ActionButton action={reopenBreachAction.bind(null, target)} pendingText="Reopening…">
                Reopen
              </ActionButton>
            </Disclosure>
          ) : null}
        </div>
      </div>

      <section className={styles.section} aria-labelledby="notices-title">
        <h2 id="notices-title" className={styles.sectionTitle}>
          Draft notices
        </h2>
        <p className={`${styles.flush} ${styles.sectionIntro}`}>
          Each draft lists what Rule 7 asks for, in its order, filled from this record. An item
          marked “Not recorded yet” has to be completed in the record before the notice goes out.
          The wording is a starting point: have it reviewed before it is sent.
        </p>
        {item.notices.map((notice) => {
          const missing = notice.items.filter((entry) => !entry.text).length
          return (
            <Disclosure
              key={notice.key}
              summary={notice.title}
              icon={FileText}
              hint={missing ? `${missing} not recorded yet` : 'Complete'}
            >
              <p className={`${styles.flush} ${styles.muted}`}>{notice.basis}</p>
              <ol className={bits.notice}>
                {notice.items.map((entry) => (
                  <li key={`${entry.rule}-${entry.heading}`}>
                    <span className={bits.noticeHead}>
                      {entry.heading} <span className={bits.muted}>({entry.rule})</span>
                    </span>
                    {entry.text ? (
                      <span>{entry.text}</span>
                    ) : (
                      <span className={bits.missing}>Not recorded yet</span>
                    )}
                  </li>
                ))}
              </ol>
            </Disclosure>
          )
        })}
      </section>

      {options && open ? (
        <Disclosure summary="Edit the record" icon={Pencil}>
          <BreachForm
            action={updateBreachAction.bind(null, target)}
            initial={{
              title: item.title,
              description: item.description,
              awareAt: toLocalInput(item.awareAt),
              occurredAt: toLocalInput(item.occurredAt),
              place: item.place ?? '',
              severity: item.severity,
              cyberIncident: String(item.cyberIncident),
              affectedPrincipals:
                item.affectedPrincipals === null ? '' : String(item.affectedPrincipals),
              dataAffected: item.dataAffected ?? '',
              departmentId: item.departmentId ?? '',
              processorId: item.processorId ?? '',
              likelyImpact: item.likelyImpact ?? '',
              measures: item.measures ?? '',
              safetySteps: item.safetySteps ?? '',
              contact: item.contact ?? '',
              cause: item.cause ?? '',
              personResponsible: item.personResponsible ?? '',
              remedial: item.remedial ?? '',
            }}
            initialNatures={item.natures}
            initialActivities={item.activityRefs.map(String)}
            natures={BREACH_NATURES.map((nature) => ({ value: nature.code, label: nature.label }))}
            activities={options.activities.map((activity) => ({
              value: String(activity.ref),
              label: `${activity.refLabel} ${activity.name}`,
            }))}
            departments={options.departments.map((row) => ({ value: row.id, label: row.name }))}
            processors={options.processors.map((row) => ({ value: row.id, label: row.name }))}
            submitLabel="Save the record"
          />
        </Disclosure>
      ) : null}
    </>
  )
}
