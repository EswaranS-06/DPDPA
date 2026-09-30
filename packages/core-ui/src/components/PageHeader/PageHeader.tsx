import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

type PageHeaderProps = {
  title: ReactNode
  /** Short context above the title, e.g. the code "OBL-CON-01". Not a category label. */
  kicker?: ReactNode
  lede?: ReactNode
  children?: ReactNode
}

export const PageHeader = ({ title, kicker, lede, children }: PageHeaderProps) => (
  <header className={styles.header}>
    {kicker ? <div className={styles.kicker}>{kicker}</div> : null}
    <h1 className={styles.title}>{title}</h1>
    {lede ? <p className={styles.lede}>{lede}</p> : null}
    {children ? <div className={styles.meta}>{children}</div> : null}
  </header>
)
