import type { ReactNode } from 'react'
import styles from './Panel.module.css'

type PanelProps = {
  children: ReactNode
  /** A heading inside the panel's top edge. */
  title?: ReactNode
  titleId?: string
  /** Actions on the right of the heading. */
  actions?: ReactNode
  /** "flush" removes the inner padding, for a table or list that runs edge to edge. */
  padding?: 'normal' | 'flush'
  className?: string
}

/** A bordered surface for one self-contained thing: a summary, a form, a list of work. */
export const Panel = ({
  children,
  title,
  titleId,
  actions,
  padding = 'normal',
  className,
}: PanelProps) => (
  <section
    className={[styles.panel, className].filter(Boolean).join(' ')}
    aria-labelledby={title ? titleId : undefined}
  >
    {title ? (
      <div className={styles.head}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {actions ? <div className={`${styles.actions} no-print`}>{actions}</div> : null}
      </div>
    ) : null}
    <div className={padding === 'flush' ? styles.flush : styles.body}>{children}</div>
  </section>
)
