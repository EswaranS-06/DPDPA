import type { ReactNode } from 'react'
import styles from './Citation.module.css'

/** A legal citation or code, set condensed with tabular figures (s.6(1), R7, OBL-CON-01). */
export const Citation = ({
  children,
  strong = false,
}: {
  children: ReactNode
  strong?: boolean
}) => (
  <span className={strong ? `${styles.citation} ${styles.strong}` : styles.citation}>
    {children}
  </span>
)
