import { ChevronRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './Disclosure.module.css'

type DisclosureProps = {
  summary: ReactNode
  /** Short text on the right of the summary, e.g. "3 provisions". */
  hint?: ReactNode
  icon?: LucideIcon
  children: ReactNode
  defaultOpen?: boolean
  id?: string
}

/** Detail kept one click away: the calculation behind a figure, the legal reference. */
export const Disclosure = ({
  summary,
  hint,
  icon: Icon,
  children,
  defaultOpen = false,
  id,
}: DisclosureProps) => (
  <details className={styles.details} open={defaultOpen} id={id}>
    <summary className={styles.summary}>
      <ChevronRight className={styles.chevron} size={16} strokeWidth={2.25} aria-hidden="true" />
      {Icon ? <Icon size={16} strokeWidth={2} aria-hidden="true" /> : null}
      <span className={styles.label}>{summary}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </summary>
    <div className={styles.content}>{children}</div>
  </details>
)
