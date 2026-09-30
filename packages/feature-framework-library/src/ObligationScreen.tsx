import { formatDay } from '@duatf/core-utils'
import { Chip, Citation, DataTable, MarginRow, PageHeader } from '@duatf/core-ui'
import {
  basisLabel,
  describeTrigger,
  flagLabel,
  type FrameworkLibraryApi,
  kbHref,
} from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { PenaltyChip } from './components/PenaltyChip'
import { TimeStatus } from './components/TimeStatus'
import { ACTOR_LABEL, KIND_SINGULAR, PENALTY } from './consts/labels'
import { orNotFound } from './orNotFound'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; code: string; today: string }

export const ObligationScreen = async ({ api, code, today }: Props) => {
  const item = await orNotFound(api.obligation({ code }))
  const penalty = item.penaltyTier ? PENALTY[item.penaltyTier] : undefined
  const sources = [item.actRef, item.ruleRef, item.scheduleRef].filter(Boolean)

  return (
    <div className={styles.page}>
      <PageHeader kicker={<Citation>{item.code}</Citation>} title={item.title}>
        <TimeStatus inForce={item.inForce} today={today} />
        <PenaltyChip tier={item.penaltyTier} />
        <Chip>{ACTOR_LABEL[item.actor] ?? item.actor}</Chip>
        <Chip>
          <Link href={kbHref('domains', item.domain.code)}>
            {item.domain.code} {item.domain.title}
          </Link>
        </Chip>
      </PageHeader>

      <div>
        <MarginRow
          margin={sources.map((source) => (
            <Citation key={source} strong>
              {source}
            </Citation>
          ))}
        >
          <p className={styles.requirement}>{item.requirement}</p>
        </MarginRow>

        <MarginRow margin="Trigger">
          <p className={styles.flush}>{describeTrigger(item.trigger)}</p>
          {item.trigger.basis?.length || item.trigger.flags?.length ? (
            <div className={`${styles.chips} ${styles.below}`}>
              {item.trigger.basis?.map((basis) => (
                <Chip key={basis}>
                  <Link href={`${kbHref('bases')}#${basis}`}>{basisLabel(basis)}</Link>
                </Chip>
              ))}
              {item.trigger.flags?.map((flag) => (
                <Chip key={flag}>{flagLabel(flag)}</Chip>
              ))}
            </div>
          ) : null}
        </MarginRow>

        <MarginRow margin="Commencement">
          <p className={styles.flush}>
            {item.inForce
              ? item.inForce <= today
                ? `In force since ${formatDay(item.inForce)}.`
                : `Starts on ${formatDay(item.inForce)} (phase ${item.phase}).`
              : 'In force; no commencement date is recorded for this linked law.'}
            {item.inForceUntil ? ` Stops applying on ${formatDay(item.inForceUntil)}.` : ''}
          </p>
        </MarginRow>

        {penalty ? (
          <MarginRow margin="Penalty">
            <p className={styles.flush}>
              {penalty.amount}, under the Act Schedule item for {penalty.basis}. The Board sets the
              amount using the factors in s.33.
            </p>
          </MarginRow>
        ) : null}

        {item.instruments.length ? (
          <MarginRow margin="Where it comes from">
            <ul className={styles.bullets}>
              {item.instruments.map((instrument) => (
                <li key={instrument.code}>
                  <Link className={styles.inlineLink} href={kbHref('law', instrument.code)}>
                    {instrument.code} {instrument.title}
                  </Link>{' '}
                  <span className={styles.muted}>({KIND_SINGULAR[instrument.kind]})</span>
                </li>
              ))}
            </ul>
          </MarginRow>
        ) : null}

        {item.evidenceExpected.length ? (
          <MarginRow margin="Evidence to ask for">
            <ul className={styles.bullets}>
              {item.evidenceExpected.map((evidence) => (
                <li key={evidence}>{evidence}</li>
              ))}
            </ul>
          </MarginRow>
        ) : null}
      </div>

      <section className={styles.section} aria-labelledby="controls-title">
        <h2 id="controls-title" className={styles.sectionTitle}>
          Controls that satisfy it
        </h2>
        <DataTable
          rows={item.controls}
          rowKey={(row) => row.code}
          columns={[
            {
              key: 'code',
              header: 'Control',
              width: '7rem',
              render: (row) => <Citation>{row.code}</Citation>,
            },
            {
              key: 'title',
              header: 'Title',
              render: (row) => (
                <Link className={styles.inlineLink} href={kbHref('controls', row.code)}>
                  {row.title}
                </Link>
              ),
            },
            { key: 'type', header: 'Type', render: (row) => row.controlType },
            { key: 'nature', header: 'Nature', render: (row) => row.nature },
            { key: 'owner', header: 'Usual owner', render: (row) => row.ownerRole },
          ]}
        />
      </section>

      {item.processes.length ? (
        <section className={styles.section} aria-labelledby="processes-title">
          <h2 id="processes-title" className={styles.sectionTitle}>
            Processes where it is typically triggered
          </h2>
          <p className={styles.sectionIntro}>
            {item.processes.length} process templates name this obligation beyond the baseline that
            applies to every activity.
          </p>
          <ul className={styles.bullets}>
            {item.processes.map((process) => (
              <li key={process.code}>
                <Link className={styles.inlineLink} href={kbHref('processes', process.code)}>
                  {process.code} {process.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
