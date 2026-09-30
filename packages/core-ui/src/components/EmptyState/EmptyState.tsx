import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

export const EmptyState = ({ title, children }: { title: ReactNode; children?: ReactNode }) => (
  <div className={styles.empty} role="status">
    <p className={styles.title}>{title}</p>
    {children ? <div className={styles.body}>{children}</div> : null}
  </div>
)
