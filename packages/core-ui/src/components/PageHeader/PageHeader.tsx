import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

type PageHeaderProps = {
  title: ReactNode
  /** Short context above the title, e.g. the code "OBL-CON-01". Not a category label. */
  kicker?: ReactNode
  lede?: ReactNode
  /** Status badges and facts under the title. */
  children?: ReactNode
  /** Buttons for the page: at most one primary. */
  actions?: ReactNode
  /** Heading level: 1 for a page, 2 when the page sits inside a layout that owns the h1. */
  level?: 1 | 2
  id?: string
}

export const PageHeader = ({
  title,
  kicker,
  lede,
  children,
  actions,
  level = 1,
  id,
}: PageHeaderProps) => {
  const Heading = level === 1 ? 'h1' : 'h2'
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        {kicker ? <div className={styles.kicker}>{kicker}</div> : null}
        <Heading id={id} className={styles.title}>
          {title}
        </Heading>
        {lede ? <p className={styles.lede}>{lede}</p> : null}
        {children ? <div className={styles.meta}>{children}</div> : null}
      </div>
      {actions ? <div className={`${styles.actions} no-print`}>{actions}</div> : null}
    </header>
  )
}

type SectionHeaderProps = {
  title: ReactNode
  id: string
  description?: ReactNode
  actions?: ReactNode
  /** h2 by default; h3 inside a section. */
  level?: 2 | 3
  /** A count shown after the title. */
  count?: number
}

/** The heading of a section within a page, with an optional description and actions. */
export const SectionHeader = ({
  title,
  id,
  description,
  actions,
  level = 2,
  count,
}: SectionHeaderProps) => {
  const Heading = level === 2 ? 'h2' : 'h3'
  return (
    <div className={styles.section}>
      <div className={styles.text}>
        <Heading id={id} className={level === 2 ? styles.sectionTitle : styles.subTitle}>
          {title}
          {count === undefined ? null : <span className={styles.count}>{count}</span>}
        </Heading>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions ? <div className={`${styles.actions} no-print`}>{actions}</div> : null}
    </div>
  )
}
