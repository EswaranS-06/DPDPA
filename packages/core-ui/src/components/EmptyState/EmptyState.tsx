import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

type EmptyStateProps = {
  /** What is missing: "No findings yet". */
  title: ReactNode
  /** Why it matters and what fills it. */
  children?: ReactNode
  icon?: LucideIcon
  /** The next step, usually one button. */
  action?: ReactNode
  /** "quiet" for empty lists inside a section that already explains itself. */
  size?: 'normal' | 'quiet'
}

/** An empty list says what is missing, why it matters and what to do next. */
export const EmptyState = ({
  title,
  children,
  icon: Icon,
  action,
  size = 'normal',
}: EmptyStateProps) => (
  <div
    className={size === 'quiet' ? `${styles.empty} ${styles.quiet}` : styles.empty}
    role="status"
  >
    {Icon ? (
      <span className={styles.icon} aria-hidden="true">
        <Icon size={20} strokeWidth={1.75} />
      </span>
    ) : null}
    <div className={styles.text}>
      <p className={styles.title}>{title}</p>
      {children ? <div className={styles.body}>{children}</div> : null}
      {action ? <div className={`${styles.action} no-print`}>{action}</div> : null}
    </div>
  </div>
)
