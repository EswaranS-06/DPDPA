import { formatDay } from '@duatf/core-utils'
import type { Ladder } from './ladder'
import styles from './CommencementLadder.module.css'

/** Step chart of obligations in force over time, from today to the last commencement date. */
export const CommencementLadder = ({ ladder }: { ladder: Ladder }) => {
  const height = (count: number) => (ladder.total ? (count / ladder.total) * 100 : 0)
  const points = ladder.steps.flatMap((step, index) => {
    const next = ladder.steps[index + 1]
    const end = next ? next.position : 100
    const y = 100 - height(step.cumulative)
    return [`${step.position},${y}`, `${end},${y}`]
  })
  const area = `0,100 ${points.join(' ')} 100,100`

  return (
    <figure className={styles.figure} aria-labelledby="ladder-caption">
      <div className={styles.chart}>
        <svg
          className={styles.area}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polygon points={area} />
        </svg>
        {ladder.steps.map((step, index) => (
          <div
            key={step.date}
            className={index === 0 ? `${styles.marker} ${styles.today}` : styles.marker}
            style={{ left: `${step.position}%` }}
          >
            <span
              className={styles.count}
              style={{ top: `calc(${100 - height(step.cumulative)}% - 1.75rem)` }}
            >
              {step.cumulative}
            </span>
          </div>
        ))}
      </div>
      <ol className={styles.legend}>
        {ladder.steps.map((step, index) => (
          <li key={step.date} className={index === 0 ? styles.legendToday : undefined}>
            <span className={styles.when}>
              {index === 0 ? `Today, ${formatDay(step.date)}` : `From ${step.label}`}
            </span>
            <span className={styles.what}>{step.detail}</span>
          </li>
        ))}
      </ol>
      <figcaption id="ladder-caption" className={styles.caption}>
        Obligations in force over time, out of {ladder.total} in the framework.
      </figcaption>
    </figure>
  )
}
