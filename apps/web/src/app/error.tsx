'use client'

import { ErrorCard } from '@/components/StateCards'
import styles from './states.module.css'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main id="main" className={styles.page}>
      <ErrorCard digest={error.digest} reset={reset} />
    </main>
  )
}
