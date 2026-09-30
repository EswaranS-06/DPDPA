import type { ReactNode } from 'react'
import styles from './Chip.module.css'

export type ChipTone = 'neutral' | 'live' | 'pending' | 'severe' | 'accent'

type ChipProps = {
  tone?: ChipTone
  children: ReactNode
  title?: string
}

export const Chip = ({ tone = 'neutral', children, title }: ChipProps) => (
  <span className={`${styles.chip} ${styles[tone]}`} title={title}>
    {children}
  </span>
)
