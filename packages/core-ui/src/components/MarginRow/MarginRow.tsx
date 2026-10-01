import type { ReactNode } from 'react'
import styles from './MarginRow.module.css'

type MarginRowProps = {
  /** The label of the row: "How to test it", a citation, a date. */
  margin: ReactNode
  children: ReactNode
  as?: 'div' | 'li' | 'section'
  id?: string
}

/** A labelled row: the label in a narrow column beside the content it names. */
export const MarginRow = ({ margin, children, as: Element = 'div', id }: MarginRowProps) => (
  <Element className={styles.row} id={id}>
    <div className={styles.margin}>{margin}</div>
    <div className={styles.text}>{children}</div>
  </Element>
)
