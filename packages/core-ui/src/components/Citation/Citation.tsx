import type { ReactNode } from 'react'
import styles from './Citation.module.css'

/** A legal citation or code (s.6(1), R7, OBL-CON-01): tabular figures and case-sensitive forms. */
export const Citation = ({
  children,
  strong = false,
}: {
  children: ReactNode
  strong?: boolean
}) => (
  <span className={strong ? `code ${styles.citation} ${styles.strong}` : `code ${styles.citation}`}>
    {children}
  </span>
)
