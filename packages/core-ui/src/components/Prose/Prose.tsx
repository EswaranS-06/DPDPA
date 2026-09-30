import type { ReactNode } from 'react'
import styles from './Prose.module.css'

type ProseProps = {
  children: ReactNode
  /** "law" sets statutory text in the serif; "guide" keeps the interface sans. */
  voice?: 'law' | 'guide'
}

export const Prose = ({ children, voice = 'guide' }: ProseProps) => (
  <div className={`${styles.prose} ${voice === 'law' ? styles.law : styles.guide}`}>{children}</div>
)
