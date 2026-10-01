import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './Chip.module.css'

/** Tones follow the status language: never colour alone, always a label and, for states, an icon. */
export type ChipTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'brand'

type ChipProps = {
  tone?: ChipTone
  /** The state's icon; plain tags (a department, a code) have none. */
  icon?: LucideIcon
  children: ReactNode
  title?: string
}

/** A status badge or tag: icon, label and tone together. */
export const Chip = ({ tone = 'neutral', icon: Icon, children, title }: ChipProps) => (
  <span className={`${styles.chip} ${styles[tone]}`} title={title}>
    {Icon ? <Icon className={styles.icon} size={13} strokeWidth={2.25} aria-hidden="true" /> : null}
    <span className={styles.label}>{children}</span>
  </span>
)
