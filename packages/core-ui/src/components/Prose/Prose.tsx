import type { ReactNode } from 'react'
import styles from './Prose.module.css'

type ProseProps = {
  children: ReactNode
  /** "law" sets statutory summaries as reading text with a rule beside them; "guide" is plain. */
  voice?: 'law' | 'guide'
}

export const Prose = ({ children, voice = 'guide' }: ProseProps) => (
  <div className={`${styles.prose} ${voice === 'law' ? styles.law : styles.guide}`}>{children}</div>
)
