import { CircleAlert, CircleCheck, Info, Lock, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './Callout.module.css'

export type CalloutTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'locked'

const ICON: Record<CalloutTone, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
  neutral: Info,
  locked: Lock,
}

type CalloutProps = {
  tone?: CalloutTone
  title?: ReactNode
  children?: ReactNode
  icon?: LucideIcon
  /** "alert" for errors the reader must notice now; "status" for the rest. */
  role?: 'alert' | 'status' | 'note'
}

/** A message inside a page: what happened or what applies, and what to do about it. */
export const Callout = ({ tone = 'info', title, children, icon, role = 'note' }: CalloutProps) => {
  const Icon = icon ?? ICON[tone]
  return (
    <div className={`${styles.callout} ${styles[tone]}`} role={role}>
      <Icon className={styles.icon} size={16} strokeWidth={2.25} aria-hidden="true" />
      <div className={styles.body}>
        {title ? <p className={styles.title}>{title}</p> : null}
        {children ? <div className={styles.text}>{children}</div> : null}
      </div>
    </div>
  )
}
