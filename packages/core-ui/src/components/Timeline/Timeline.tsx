import type { ReactNode } from 'react'
import styles from './Timeline.module.css'

export type TimelineEntry = { key: string | number; when: string; what: ReactNode }

/** Who did what and when, oldest first: the activity behind a record. */
export const Timeline = ({ entries, label }: { entries: TimelineEntry[]; label: string }) => (
  <ol className={styles.timeline} aria-label={label}>
    {entries.map((entry) => (
      <li key={entry.key}>
        <span className={styles.when}>{entry.when}</span>
        <span className={styles.what}>{entry.what}</span>
      </li>
    ))}
  </ol>
)
