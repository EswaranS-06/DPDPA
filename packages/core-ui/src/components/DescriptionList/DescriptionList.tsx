import type { ReactNode } from 'react'
import styles from './DescriptionList.module.css'

export type DescriptionItem = {
  label: string
  value: ReactNode
  /** Spans the full width: addresses, notes. */
  wide?: boolean
}

/** Facts about a record as label and value pairs, in columns on wide screens. */
export const DescriptionList = ({
  items,
  columns = 3,
}: {
  items: DescriptionItem[]
  columns?: 2 | 3
}) => (
  <dl className={columns === 2 ? `${styles.list} ${styles.two}` : styles.list}>
    {items.map((item) => (
      <div key={item.label} className={item.wide ? styles.wide : undefined}>
        <dt>{item.label}</dt>
        <dd>{item.value ?? <span className={styles.none}>Not recorded</span>}</dd>
      </div>
    ))}
  </dl>
)
