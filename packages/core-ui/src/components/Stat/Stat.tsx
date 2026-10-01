import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './Stat.module.css'

export type StatTone = 'default' | 'danger' | 'warning' | 'success'

export type StatProps = {
  label: string
  value: ReactNode
  /** One line under the value saying what the number counts. */
  note?: ReactNode
  /** Where the number comes from; the label becomes a link that covers the tile. */
  href?: string
  /** Colours the value and shows the icon when the number needs attention. */
  tone?: StatTone
  icon?: LucideIcon
}

/** One headline number with its label and what it counts. Use inside StatGrid. */
export const Stat = ({ label, value, note, href, tone = 'default', icon: Icon }: StatProps) => (
  <div className={href ? `${styles.stat} ${styles.linked}` : styles.stat}>
    <dt className={styles.label}>
      {href ? (
        <a href={href} className={styles.stretch}>
          {label}
        </a>
      ) : (
        label
      )}
    </dt>
    <dd className={`${styles.value} ${styles[tone]}`}>
      {Icon ? <Icon size={18} strokeWidth={2.25} aria-hidden="true" /> : null}
      {value}
    </dd>
    {note ? <dd className={styles.note}>{note}</dd> : null}
  </div>
)

/** A row of stat tiles. */
export const StatGrid = ({ children, label }: { children: ReactNode; label?: string }) => (
  <dl className={styles.grid} aria-label={label}>
    {children}
  </dl>
)
