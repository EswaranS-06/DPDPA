import type { ReactNode } from 'react'
import styles from './MarginRow.module.css'

type MarginRowProps = {
  /** The marginal note: citation, commencement, phase. */
  margin: ReactNode
  children: ReactNode
  as?: 'div' | 'li' | 'section'
  id?: string
}

/** Bare Act layout: the marginal note sits beside the text it annotates. */
export const MarginRow = ({ margin, children, as: Element = 'div', id }: MarginRowProps) => (
  <Element className={styles.row} id={id}>
    <div className={styles.margin}>{margin}</div>
    <div className={styles.text}>{children}</div>
  </Element>
)
