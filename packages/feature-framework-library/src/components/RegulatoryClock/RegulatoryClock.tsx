import { daysBetween, formatDay } from '@duatf/core-utils'
import { OFFICIAL_SOURCES } from '@duatf/feature-framework-library-api'
import type { CSSProperties } from 'react'
import type { Ladder } from '../CommencementLadder/ladder'
import styles from './RegulatoryClock.module.css'

type RegulatoryClockProps = {
  ladder: Ladder
  release: string
  /** Heading level inside the page. */
  level?: 2 | 3
  /** Show the links to the official texts under the chart. */
  sources?: boolean
}

const inDays = (today: string, date: string) => {
  const days = daysBetween(today, date)
  return days === 1 ? 'tomorrow' : `in ${days} days`
}

const share = (count: number, total: number) => (total ? (count / total) * 100 : 0)

/**
 * How much of the DPDP framework applies, and when the rest starts: one row per commencement
 * date, each bar the obligations in force from that day, the new ones lighter. The bars grow in
 * once on load; nothing else on the page moves.
 */
export const RegulatoryClock = ({
  ladder,
  release,
  level = 2,
  sources = true,
}: RegulatoryClockProps) => {
  const Heading = level === 2 ? 'h2' : 'h3'
  return (
    <section className={styles.clock} aria-labelledby="regulatory-clock-title">
      <div className={styles.head}>
        <div className={styles.headText}>
          <Heading id="regulatory-clock-title" className={styles.title}>
            Obligations in force
          </Heading>
          <p className={styles.sentence}>
            {ladder.headline} {ladder.upcoming}
          </p>
        </div>
        <p className={styles.framework}>
          DPDP Act, 2023 and DPDP Rules, 2025
          <span>Knowledge base release {release}</span>
        </p>
      </div>

      <ol className={styles.stages}>
        {ladder.steps.map((step, index) => {
          const before = step.cumulative - (index === 0 ? step.cumulative : step.added)
          return (
            <li
              key={step.date}
              className={index === 0 ? `${styles.stage} ${styles.today}` : styles.stage}
              style={{ '--order': index } as CSSProperties}
            >
              <span className={styles.when}>
                <span className={styles.date}>{index === 0 ? 'Today' : formatDay(step.date)}</span>
                <span className={styles.relative}>
                  {index === 0 ? formatDay(step.date) : inDays(ladder.today, step.date)}
                </span>
              </span>
              <span
                className={styles.bar}
                role="img"
                aria-label={
                  index === 0
                    ? `${step.cumulative} of ${ladder.total} obligations in force today`
                    : `${step.cumulative} of ${ladder.total} in force from ${formatDay(step.date)}, ${step.added} of them new`
                }
              >
                {before > 0 ? (
                  <span
                    className={styles.inForce}
                    style={{ width: `${share(before, ladder.total)}%` }}
                  />
                ) : null}
                <span
                  className={index === 0 ? styles.inForce : styles.added}
                  style={{
                    width: `${share(index === 0 ? step.cumulative : step.added, ladder.total)}%`,
                  }}
                />
              </span>
              <span className={styles.count}>
                <span>
                  <strong>{step.cumulative}</strong> of {ladder.total}
                </span>
                {index === 0 ? null : <span className={styles.plus}>{step.added} new</span>}
              </span>
            </li>
          )
        })}
      </ol>

      {sources ? (
        <p className={styles.sources}>
          Official texts:{' '}
          <a href={OFFICIAL_SOURCES.act.href} target="_blank" rel="noreferrer noopener">
            DPDP Act, 2023 (PDF)
          </a>{' '}
          and{' '}
          <a href={OFFICIAL_SOURCES.framework.href} target="_blank" rel="noreferrer noopener">
            MeitY data protection framework
          </a>
          . Dates are computed from the Gazette. A working compliance framework, not legal advice.
        </p>
      ) : null}
    </section>
  )
}
